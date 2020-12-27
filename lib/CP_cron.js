'use strict';

/**
 * Node dependencies.
 */

var adop = require('adop');
var request = require('request');
var sinoni = require('sinoni');
var async = require('async');
var _eval = require('eval');
var util = require('util');
var td = new util.TextDecoder('utf8', { fatal: true });
var path = require('path');
var fs = require('fs');
var os = require('os-utils');
var Imap = require('imap');
var MP = require('mailparser-mit').MailParser;
var nodemailer = require('nodemailer');
var mimemessage = require('mimemessage');
var pm2 = require('pm2');

/**
 * Global env.
 */

try {
  var p = tryParseJSON(
    fs.readFileSync(
      path.join(path.dirname(__filename), '..', 'process.json'),
      'utf8'
    )
  );
  var e = p.apps[0].env;
  for (var prop in e) {
    if (e.hasOwnProperty(prop)) {
      process.env[prop] = e[prop];
    }
  }
} catch (err) {
  return console.log('NOT FILE PROCESS DATA');
}

/**
 * Module dependencies.
 */

var CP_get = require('./CP_get');
var CP_save = require('./CP_save');
var CP_cache = require('./CP_cache');
var CP_sub = require('../lib/CP_sub');
var CP_translit = require('../lib/CP_translit');
var CP_structure = require('../lib/CP_structure');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../config/production/config.backup'));
var modules = require('../config/production/modules');
Object.keys(modules).length === 0 &&
  (modules = require('../config/production/modules.backup'));

/**
 * Route dependencies.
 */

var movie = require('../routes/paths/movie');

var timeZone = new Date();

console.log(
  timeZone,
  '[',
  Math.ceil(os.freemem()),
  'MB]',
  '1min:',
  os.loadavg(1).toFixed(2),
  '5min:',
  os.loadavg(5).toFixed(2),
  '15min:',
  os.loadavg(15).toFixed(2)
);

if (Math.ceil(os.freemem()) < 50) {
  console.log('The server is overloaded to start cron.');
  return process.exit(0);
}

var hour = new Date(timeZone).getHours() + 1;

console.time('DONE');

var active = {
  num: 0,
  process: {}
};

/**
 * Parser new movie ids.
 */

if (
  modules.content.status &&
  modules.content.data.scraper &&
  modules.content.data.scraper.length
) {
  active.num++;
  active.process.scraper = true;

  setTimeout(function() {
    active.num--;
    active.process.scraper = false;
  }, 1000 * 60 * 50);

  async.eachOfLimit(
    modules.content.data.scraper.split('\n'),
    1,
    function(task, index, callback) {
      task = task.trim();
      var parse = task
        .replace(/(^\s*)|(\s*)$/g, '')
        .replace(/\s*~\s*/g, '~')
        .split('~');
      if (task.charAt(0) === '#' || parse.length < 5) {
        return callback();
      }
      var p = {
        every: parseInt(parse[0]),
        url: parse[1],
        regex_url: parse[2],
        regex_id:
          parse[3] && parse[3] !== 'kp'
            ? parse[3]
            : '(?:' +
              '/level/1/film/([0-9]{3,8})|' +
              'kinopoisk\\.ru/([0-9]{3,8})\\.gif|' +
              'rating/([0-9]{3,8})\\.gif|' +
              '/film/([0-9]{3,8})|' +
              '/series/([0-9]{3,8})' +
              ')',
        collection: parse[4]
      };
      if (hour % p.every) return callback();
      request(
        {
          url: p.url,
          method: 'GET',
          timeout: 15000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
              'AppleWebKit/537.36 (KHTML, like Gecko) ' +
              'Chrome/79.0.' +
              (Math.floor(Math.random() * 600) + 1) +
              '.100 Safari/537.36'
          }
        },
        function(error, response, body) {
          if (error || response.statusCode !== 200 || !body) {
            console.error(task, (error && error.code) || '', body);
            return callback();
          }
          var ids = [];
          var urls = [];
          if (p.regex_url) {
            var u;
            var regex_url = new RegExp(p.regex_url, 'ig');
            while ((u = regex_url.exec(body)) !== null) {
              if (/(\/\/|http)/i.test(u[1])) {
                urls.push(u[1]);
              } else if (/\//i.test(u[1])) {
                urls.push(
                  require('url').parse(p.url).protocol +
                    '//' +
                    require('url').parse(p.url).host +
                    u[1]
                );
              } else {
                var s = p.url.split('/');
                s.pop();
                var slash = s.join('/');
                urls.push(slash + '/' + u[1]);
              }
            }
          }
          if (!urls.length) urls.push(p.url);
          urls = urls.filter(function(item, pos) {
            return urls.indexOf(item) === pos;
          });
          console.log(urls, urls.length);
          async.eachOfLimit(
            urls,
            1,
            function(url, i, callback) {
              request(
                {
                  url: url,
                  method: 'GET',
                  timeout: 15000,
                  headers: {
                    'User-Agent':
                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                      'Chrome/54.0.' +
                      (Math.floor(Math.random() * 600) + 1) +
                      '.100 Safari/537.36'
                  }
                },
                function(error2, response2, body2) {
                  if (error2 || response2.statusCode !== 200 || !body2) {
                    console.error(task, error2.code, body2);
                    return callback();
                  }
                  var found;
                  var regex_id = new RegExp(p.regex_id, 'ig');
                  while ((found = regex_id.exec(body2)) !== null) {
                    var find_id =
                      found[1] || found[2] || found[3] || found[4] || found[5];
                    if (
                      find_id &&
                      ids.indexOf(find_id) === -1 &&
                      modules.abuse.data.movies.indexOf(find_id) === -1
                    ) {
                      ids.push(find_id);
                    }
                  }
                  setTimeout(function() {
                    callback();
                  }, Math.floor(Math.random() * 2000 + 1000));
                }
              );
            },
            function() {
              console.log('IDs:', ids);
              if (!ids.length) return callback();
              saveData(
                p.collection,
                ids.map(function(id) {
                  return { kinopoisk_id: id };
                }),
                function() {
                  callback();
                }
              );
            }
          );
        }
      );
    },
    function() {
      active.num--;
      active.process.scraper = false;
    }
  );
} else {
  console.log(
    'NOT START:',
    'CONTENT',
    'status',
    !!modules.content.status,
    'scraper',
    modules.content.data.scraper.length
  );
}

/**
 * API new movie ids.
 */

if (
  modules.content.status &&
  modules.content.data.custom &&
  modules.content.data.custom.length &&
  hour > 6
) {
  active.num++;
  active.process.content = true;

  setTimeout(function() {
    active.num--;
    active.process.content = false;
  }, 1000 * 60 * 50);

  var task_groups = {};
  modules.content.data.custom.forEach(function(task) {
    var parse = task
      .replace(/(^\s*)|(\s*)$/g, '')
      .replace(/\s*~\s*/g, '~')
      .split('~');
    if (task.charAt(0) === '#' || parse.length < 3) return;
    if (task_groups[parse[2]]) {
      task_groups[parse[2]].push(task);
    } else {
      task_groups[parse[2]] = [task];
    }
  });

  async.eachOfLimit(
    task_groups,
    1,
    function(group, group_index, callback) {
      var movies = [];
      async.eachOfLimit(
        group,
        1,
        function(task, index, callback) {
          var parse = task
            .replace(/(^\s*)|(\s*)$/g, '')
            .replace(/\s*~\s*/g, '~')
            .split('~');
          if (task.charAt(0) === '#' || parse.length < 3) {
            return callback();
          }
          var obj = [
            {
              name: 'kinopoisk_id',
              path: parse[1],
              type: 'number'
            }
          ];
          if (parse[3]) {
            obj.push({
              name: 'translate',
              path: parse[3],
              type: 'string'
            });
          }
          if (parse[4]) {
            obj.push({
              name: 'quality',
              path: parse[4],
              type: 'string'
            });
          }
          if (parse[5]) {
            obj.push({
              name: 'date',
              path: parse[5],
              type: 'string'
            });
          }
          request(
            {
              url: parse[0],
              method: 'GET',
              timeout: 15000
            },
            function(error, response, body) {
              if (error || response.statusCode !== 200 || !body) {
                console.error(
                  task,
                  (error && error.code) || (response && response.statusCode)
                );
                return callback();
              }
              movies = movies && movies.length ? movies : [];
              var sorting = [];
              var all = adop(tryParseJSON(body), obj);
              var ids = all.reduce(function(r, a) {
                if (sorting.indexOf(parseInt(a['kinopoisk_id'])) === -1) {
                  sorting.push(parseInt(a['kinopoisk_id']));
                }
                r[a['kinopoisk_id']] = r[a['kinopoisk_id']] || [];
                r[a['kinopoisk_id']].push(a);
                return r;
              }, {});
              Object.keys(ids).forEach(function(id) {
                var m = { kinopoisk_id: parseInt(id) };
                if (
                  ids[id][0] &&
                  ids[id][0].translate &&
                  ids[id][0].translate.toString().toLowerCase() !== 'null'
                ) {
                  var reg = /[^(]+\s*\([^)]+\)\s*\(([^)]+)\)/i.exec(
                    ids[id][0].translate.toString()
                  );
                  m.translate = reg && reg[1] ? reg[1] : ids[id][0].translate;
                }
                if (
                  ids[id][0] &&
                  ids[id][0].quality &&
                  ids[id][0].quality.toString().toLowerCase() !== 'null'
                ) {
                  m.quality = ids[id][0].quality.toString();
                }
                if (
                  ids[id][0] &&
                  ids[id][0].date &&
                  !isNaN(Date.parse(ids[id][0].date))
                ) {
                  m.date = Date.parse(ids[id][0].date);
                }
                movies.push(m);
              });
              movies
                .sort(function(a, b) {
                  return (
                    sorting.indexOf(a.kinopoisk_id) -
                    sorting.indexOf(b.kinopoisk_id)
                  );
                })
                .sort(function(a, b) {
                  return a.date && b.date ? b.date - a.date : 0;
                });
              if (group.length > index + 1) {
                return callback();
              }
              if (!movies.length) return callback();
              saveData(parse[2], movies, function() {
                movies = [];
                return callback();
              });
            }
          );
        },
        function() {
          callback();
        }
      );
    },
    function() {
      active.num--;
      active.process.content = false;
    }
  );
} else {
  console.log(
    'NOT START:',
    'CONTENT',
    'status',
    !!modules.content.status,
    'custom',
    modules.content.data.custom.length
  );
}

/**
 * API new episodes.
 */

if (
  modules.episode.status &&
  modules.episode.data.index.custom &&
  modules.episode.data.index.custom.length
) {
  active.num++;
  active.process.episode = true;

  setTimeout(function() {
    active.num--;
    active.process.episode = false;
  }, 1000 * 60 * 50);

  async.eachOfLimit(
    modules.episode.data.index.custom,
    1,
    function(task, index, callback) {
      var parse = task
        .replace(/(^\s*)|(\s*)$/g, '')
        .replace(/\s*~\s*/g, '~')
        .split('~');
      if (task.charAt(0) === '#' || parse.length < 4) {
        return callback();
      }
      var obj = [
        {
          name: 'kinopoisk_id',
          path: parse[1],
          type: 'number'
        },
        {
          name: 'season',
          path: parse[2],
          type: 'number'
        },
        {
          name: 'episode',
          path: parse[3],
          type: 'number'
        }
      ];
      if (parse[4]) {
        obj.push({
          name: 'translate',
          path: parse[4],
          type: 'string'
        });
      }
      request(
        {
          url: parse[0],
          method: 'GET',
          timeout: 15000
        },
        function(error, response, body) {
          if (error || response.statusCode !== 200 || !body) {
            console.error(task, (error && error.code) || '', body);
            return callback();
          }
          var results = [];
          var sorting = [];
          var all = adop(tryParseJSON(body), obj);
          var ids = all.reduce(function(r, a) {
            if (sorting.indexOf(a['kinopoisk_id']) === -1) {
              sorting.push(a['kinopoisk_id']);
            }
            r[a['kinopoisk_id']] = r[a['kinopoisk_id']] || [];
            r[a['kinopoisk_id']].push(a);
            return r;
          }, {});

          Object.keys(ids)
            .filter(function(id) {
              return id && id !== '0';
            })
            .forEach(function(id) {
              var t = ids[id]
                .sort(function(a, b) {
                  return parseFloat(b.season) - parseFloat(a.season);
                })
                .filter(function(episode, i, a) {
                  return a[0].season <= episode.season;
                })
                .sort(function(a, b) {
                  return parseFloat(b.episode) - parseFloat(a.episode);
                })
                .filter(function(episode, i, a) {
                  return a[0].episode === episode.episode;
                });
              var translates = Object.assign(t[0], {
                translate_url: t[0].translate,
                translate: t
                  .map(function(episode) {
                    return episode.translate;
                  })
                  .join(' ')
              });
              results.push(translates);
            });

          results.sort(function(a, b) {
            return (
              sorting.indexOf(a.kinopoisk_id) - sorting.indexOf(b.kinopoisk_id)
            );
          });

          if (!results.length) return callback();

          var query_id = results
            .map(function(result) {
              return result.kinopoisk_id;
            })
            .join('|');

          process.env['CP_VER'] = new Date().getTime().toString();

          CP_get.movies(
            {
              query_id: query_id
            },
            results.length,
            '',
            1,
            true,
            function(err, ms) {
              if (err) {
                console.log('[CP_get.movies]', query_id, err);
                return callback(null);
              }
              if (!ms || !ms.length) {
                console.log('[CP_get.movies]', query_id, 'NOT SERIES');
                return callback(null);
              }
              var episodes = sortingSeries(results, ms).map(function(episode) {
                episode.url =
                  episode.url +
                  '/s' +
                  episode.season +
                  'e' +
                  episode.episode +
                  (episode.translate
                    ? '_' +
                      CP_translit.text(
                        episode.translate_url,
                        undefined,
                        'translate'
                      )
                    : '');
                episode.pathname =
                  episode.pathname +
                  '/s' +
                  episode.season +
                  'e' +
                  episode.episode +
                  (episode.translate
                    ? '_' +
                      CP_translit.text(
                        episode.translate_url,
                        undefined,
                        'translate'
                      )
                    : '');
                episode.year2 =
                  episode.season +
                  ' ' +
                  config.l.season +
                  ' ' +
                  episode.episode +
                  ' ' +
                  config.l.episode;
                episode.year3 = 'S' + episode.season + 'E' + episode.episode;
                return episode;
              });
              fs.writeFileSync(
                path.join(
                  path.dirname(__filename),
                  '..',
                  'files',
                  'episodes.json'
                ),
                JSON.stringify(episodes, null, 2)
              );
              callback();
            }
          );
        }
      );
    },
    function() {
      active.num--;
      active.process.episode = false;
    }
  );
} else {
  console.log(
    'NOT START:',
    'EPISODE',
    'status',
    !!modules.episode.status,
    'custom',
    modules.episode.data.index.custom.length
  );
}

/**
 * Publish new movies.
 */

if (
  config.publish.every.hours &&
  config.publish.every.movies &&
  !(hour % config.publish.every.hours)
) {
  active.num++;
  active.process.publish = true;

  setTimeout(function() {
    active.num--;
    active.process.publish = false;
  }, 1000 * 60 * 50);

  process.env['CP_VER'] = new Date().getTime().toString();

  CP_get.publishIds(function(err, ids) {
    var log = '';

    if (!ids) {
      log = '[publish] Not Movies.';
      config.publish.every.hours = 0;
      config.publish.every.movies = 0;
    } else if (
      ids.start_id === config.publish.start &&
      ids.stop_id === config.publish.stop
    ) {
      log = '[publish] All movies published.';
      config.publish.every.hours = 0;
      config.publish.every.movies = 0;
    } else {
      log = '[publish] New IDs: ' + ids.start_id + ' - ' + ids.stop_id;
      config.publish.start = ids.start_id;
      config.publish.stop = ids.stop_id;
    }

    if (
      modules.rewrite.status &&
      modules.rewrite.data.token &&
      ids &&
      ids.soon_id
    ) {
      active.num++;

      active.process.rewrite = true;

      console.log('CP_XMLPIPE2', ids.soon_id.join('|'));
      CP_get.movies(
        { query_id: ids.soon_id.join('|'), from: process.env.CP_XMLPIPE2 },
        ids.soon_id.length,
        '',
        1,
        false,
        function(err, movies_CP_XMLPIPE2) {
          if (err) {
            active.num--;
            active.process.rewrite = '[CP_get.movies] ERR';
            return console.log('[CP_get.movies]', err);
          }
          if (movies_CP_XMLPIPE2 && movies_CP_XMLPIPE2.length) {
            movies_CP_XMLPIPE2 = movies_CP_XMLPIPE2.filter(function(m) {
              return m.description && m.description.length >= 100;
            });
            var rewrites = [];
            async.eachOfLimit(
              movies_CP_XMLPIPE2,
              1,
              function(movie_CP_XMLPIPE2, i, callback) {
                movie_CP_XMLPIPE2.description = movie_CP_XMLPIPE2.description.trim();
                CP_get.movies(
                  {
                    query_id: movie_CP_XMLPIPE2.query_id,
                    from: process.env.CP_XMLPIPE2
                  },
                  1,
                  '',
                  1,
                  true,
                  function(err, structures_CP_XMLPIPE2) {
                    if (err) {
                      console.log(movie_CP_XMLPIPE2.query_id, err);
                      return callback();
                    }
                    if (modules.rewrite.data.condition) {
                      var condition = _eval(
                        'module.exports=function(movie){return !!(' +
                          modules.rewrite.data.condition.toString() +
                          ');}'
                      );
                      if (!condition(structures_CP_XMLPIPE2[0])) {
                        return callback();
                      }
                    }
                    CP_get.movies(
                      {
                        query_id: movie_CP_XMLPIPE2.query_id,
                        from: process.env.CP_RT
                      },
                      1,
                      '',
                      1,
                      false,
                      function(err, movies_CP_RT) {
                        if (err) {
                          console.log(movie_CP_XMLPIPE2.query_id, err);
                          return callback();
                        }
                        if (
                          movies_CP_RT &&
                          movies_CP_RT[0] &&
                          movies_CP_RT[0].description &&
                          movie_CP_XMLPIPE2.description.toLowerCase() !==
                            movies_CP_RT[0].description.trim().toLowerCase()
                        ) {
                          console.log(
                            movie_CP_XMLPIPE2.query_id,
                            movie_CP_XMLPIPE2.description.length +
                              ' !== ' +
                              movies_CP_RT[0].description.trim().length
                          );
                          return callback();
                        }
                        sinoni({
                          token: modules.rewrite.data.token,
                          double: modules.rewrite.data.double,
                          unique: modules.rewrite.data.unique,
                          text: movie_CP_XMLPIPE2.description,
                          lang: config.language
                        })
                          .then(function(res) {
                            var custom = {};
                            if (movie_CP_XMLPIPE2.custom) {
                              custom = JSON.parse(movie_CP_XMLPIPE2.custom);
                            }
                            if (typeof res.percent !== 'undefined') {
                              custom.rewrite = {};
                              if (typeof res.percent !== 'undefined') {
                                custom.rewrite.percent = res.percent;
                              }
                              if (typeof res.words !== 'undefined') {
                                custom.rewrite.words = res.words;
                              }
                              if (typeof res.spam !== 'undefined') {
                                custom.rewrite.spam = res.spam;
                              }
                              if (typeof res.water !== 'undefined') {
                                custom.rewrite.water = res.water;
                              }
                            }
                            if (typeof res.rewrite !== 'undefined') {
                              custom.unique = true;
                              movie_CP_XMLPIPE2.custom = JSON.stringify(custom);
                              movie_CP_XMLPIPE2.description = res.rewrite;
                              CP_save.save(movie_CP_XMLPIPE2, 'rt', function(
                                err
                              ) {
                                rewrites.push(movie_CP_XMLPIPE2.query_id);
                                callback(err);
                              });
                            } else {
                              callback();
                            }
                          })
                          .catch(function(err) {
                            callback(err);
                          });
                      }
                    );
                  }
                );
              },
              function(err) {
                if (err) console.log('[sinoni]', err);
                active.num--;
                active.process.rewrite = rewrites.length
                  ? 'Movies ' + rewrites.join(',')
                  : false;
              }
            );
          } else {
            active.num--;
            active.process.rewrite = 'Movies 0';
          }
        }
      );
    } else {
      console.log(
        'NOT START:',
        'REWRITE',
        'status',
        !!modules.rewrite.status,
        'token',
        !!modules.rewrite.data.token
      );
    }

    CP_save.save(config, 'config', function(err) {
      if (err) {
        console.log('[CP_save.save]', err);
      } else {
        console.log(log);
      }
      active.num--;
      active.process.publish = false;
    });
  });
} else {
  console.log(
    'NOT START:',
    'PUBLISH',
    'hours',
    !!config.publish.every.hours,
    'movies',
    !!config.publish.every.movies
  );
}

/**
 * Create random subdomain.
 */

if ((config.random || config.ru.random) && hour === 4) {
  active.num++;
  active.process.random = true;

  config.subdomain = config.random ? dayToLetter() : config.subdomain;
  config.ru.subdomain = config.ru.random
    ? dayToLetter()
        .replace(/\./g, '')
        .split('')
        .reverse()
        .join('') + '.'
    : config.ru.subdomain;

  CP_save.save(config, 'config', function(err) {
    if (err) console.log('[CP_save.save]', err);
    CP_sub.add(config.subdomain, config.domain);
    CP_sub.add(config.ru.subdomain, config.ru.domain);
    active.num--;
    active.process.random = false;
  });
} else {
  console.log(
    'NOT START:',
    'RANDOM',
    'config',
    !!config.random,
    'hour',
    '4 !=',
    hour
  );
}

/**
 * Check domain in BlackList.
 */

if (
  (config.botdomain ||
    config.subdomain ||
    config.ru.botdomain ||
    config.ru.subdomain) &&
  config.blacklist &&
  !(hour % 6)
) {
  active.num++;
  active.process.checkdomain = true;

  setTimeout(function() {
    active.num--;
    active.process.checkdomain = false;
  }, 1000 * 60 * 50);

  request(
    {
      url: 'https://reestr.rublacklist.net/api/v2/domains/json',
      method: 'GET',
      timeout: 15000
    },
    function(error, response, body) {
      if (error || response.statusCode !== 200 || !body) {
        console.error((error && error.code) || '', body);
        active.num--;
        active.process.checkdomain = false;
      }
      var dms = [];
      try {
        dms = JSON.parse(body);
      } catch (e) {
        console.error(e);
      }
      async.eachOfLimit(
        ['*', 'ru'],
        1,
        function(lang, index, callback) {
          if (lang === '*' && !config.botdomain && !config.subdomain) {
            return callback();
          }
          if (lang === 'ru' && !config.ru.botdomain && !config.ru.subdomain) {
            return callback();
          }
          var danger = false;
          var subs =
            lang === 'ru'
              ? config.ru.subdomain
                ? config.ru.subdomain.split('.').filter(Boolean)
                : []
              : config.subdomain
              ? config.subdomain.split('.').filter(Boolean)
              : [];
          var bots =
            lang === 'ru'
              ? config.ru.botdomain
                ? config.ru.botdomain.split('.').filter(Boolean)
                : []
              : config.botdomain
              ? config.botdomain.split('.').filter(Boolean)
              : [];
          var domains = {
            sub: {
              domain: lang === 'ru' ? config.ru.domain : config.domain,
              main: subs[1] ? subs[1] + '.' : subs[0] ? subs[0] + '.' : '',
              second: subs[1] ? subs[0] + '.' : ''
            },
            bot: {
              domain:
                lang === 'ru'
                  ? config.ru.bomain || config.ru.domain
                  : config.bomain || config.domain,
              main: bots[1] ? bots[1] + '.' : bots[0] ? bots[0] + '.' : '',
              second: bots[1] ? bots[0] + '.' : ''
            }
          };
          for (var i = 0; i < dms.length; i++) {
            ['sub', 'bot'].forEach(function(name) {
              if (name === 'bot' && config.blacklist === 3) {
                return;
              }
              if (name === 'sub' && config.blacklist === 2) {
                return;
              }
              if (
                (dms[i] === '*.' + domains.bot.domain ||
                  dms[i] === domains.bot.domain) &&
                (lang === 'ru'
                  ? config.ru.alt.bomain &&
                    config.ru.bomain &&
                    config.ru.alt.bomain !== config.ru.bomain
                  : config.alt.bomain &&
                    config.bomain &&
                    config.alt.bomain !== config.bomain)
              ) {
                domains.bot.domain =
                  lang === 'ru' ? config.ru.alt.bomain : config.alt.bomain;
                if (
                  lang === 'ru' ? config.ru.alt.botdomain : config.alt.botdomain
                ) {
                  domains.bot.main =
                    lang === 'ru'
                      ? config.ru.alt.botdomain
                      : config.alt.botdomain;
                  if (lang === 'ru') {
                    config.ru.alt.botdomain =
                      config.ru.alt.botdomain
                        .replace(/\./g, '')
                        .replace(/[0-9]/g, '') +
                      (parseInt(
                        config.ru.alt.botdomain.replace(/[^0-9]/g, '') || '0'
                      ) +
                        1) +
                      '.';
                  } else {
                    config.alt.botdomain =
                      config.alt.botdomain
                        .replace(/\./g, '')
                        .replace(/[0-9]/g, '') +
                      (parseInt(
                        config.alt.botdomain.replace(/[^0-9]/g, '') || '0'
                      ) +
                        1) +
                      '.';
                  }
                }
                danger = true;
              } else if (
                domains[name].main &&
                (dms[i] === domains[name].main + domains[name].domain ||
                  dms[i] === '*.' + domains[name].main + domains[name].domain)
              ) {
                domains[name].main =
                  domains[name].main.replace(/\./g, '').replace(/[0-9]/g, '') +
                  (parseInt(domains[name].main.replace(/[^0-9]/g, '') || '0') +
                    1) +
                  '.';
                if (
                  name === 'bot' &&
                  (lang === 'ru'
                    ? config.ru.alt.botdomain
                    : config.alt.botdomain)
                ) {
                  domains.bot.main =
                    lang === 'ru'
                      ? config.ru.alt.botdomain
                      : config.alt.botdomain;
                  if (lang === 'ru') {
                    config.ru.alt.botdomain =
                      config.ru.alt.botdomain
                        .replace(/\./g, '')
                        .replace(/[0-9]/g, '') +
                      (parseInt(
                        config.ru.alt.botdomain.replace(/[^0-9]/g, '') || '0'
                      ) +
                        1) +
                      '.';
                  } else {
                    config.alt.botdomain =
                      config.alt.botdomain
                        .replace(/\./g, '')
                        .replace(/[0-9]/g, '') +
                      (parseInt(
                        config.alt.botdomain.replace(/[^0-9]/g, '') || '0'
                      ) +
                        1) +
                      '.';
                  }
                }
                danger = true;
              } else if (
                domains[name].second &&
                (dms[i] ===
                  domains[name].second +
                    domains[name].main +
                    domains[name].domain ||
                  dms[i] ===
                    '*.' +
                      domains[name].second +
                      domains[name].main +
                      domains[name].domain)
              ) {
                domains[name].second =
                  domains[name].second
                    .replace(/\./g, '')
                    .replace(/[0-9]/g, '') +
                  (parseInt(
                    domains[name].second.replace(/[^0-9]/g, '') || '0'
                  ) +
                    1) +
                  '.';
                danger = true;
              }
            });
          }
          if (danger) {
            if (lang === 'ru') {
              config.ru.botdomain = domains.bot.second + domains.bot.main;
              config.ru.subdomain = domains.sub.second + domains.sub.main;
              config.ru.bomain = domains.bot.domain;

              console.log(
                'NEW RU SUBDOMAIN:',
                config.ru.subdomain + domains.sub.domain
              );
              console.log(
                'NEW RU BOTDOMAIN:',
                config.ru.botdomain + domains.bot.domain
              );
            } else {
              config.botdomain = domains.bot.second + domains.bot.main;
              config.subdomain = domains.sub.second + domains.sub.main;
              config.bomain = domains.bot.domain;

              console.log(
                'NEW SUBDOMAIN:',
                config.subdomain + domains.sub.domain
              );
              console.log(
                'NEW BOTDOMAIN:',
                config.botdomain + domains.bot.domain
              );
            }

            CP_save.save(config, 'config', function(err) {
              if (err) console.log('[CP_save.save]', err);
              callback();
            });
          } else {
            callback();
          }
        },
        function(err) {
          if (err) console.error(err);
          CP_sub.all(function() {
            active.num--;
            active.process.checkdomain = false;
          });
        }
      );
    }
  );
} else {
  console.log(
    'NOT START:',
    'CHECKDOMAIN',
    'config',
    !!config.botdomain ||
      !!config.subdomain ||
      !!config.ru.botdomain ||
      !!config.ru.subdomain,
    'hour',
    '6,12,18,24 !=',
    hour
  );
}

/**
 * Delete abuse movies.
 */

if (
  modules.abuse.data.imap.user &&
  modules.abuse.data.imap.password &&
  modules.abuse.data.imap.host &&
  hour === 3
) {
  active.num++;
  active.process.imap = true;

  setTimeout(function() {
    active.num--;
    active.process.imap = false;
  }, 1000 * 60 * 50);

  var options_imap = JSON.stringify(modules.abuse.data.imap);
  options_imap = JSON.parse(options_imap);
  options_imap.tls = options_imap.tls !== 0;
  delete options_imap.from;
  delete options_imap.subdomain;

  var options_smtp = JSON.stringify(modules.abuse.data.smtp);
  options_smtp = JSON.parse(options_smtp);
  options_smtp.secure = options_smtp.secure !== 0;
  if (options_smtp.dkim) {
    options_smtp.dkim = JSON.parse(options_smtp.dkim);
  } else {
    delete options_smtp.dkim;
  }
  var message = options_smtp.message;
  delete options_smtp.message;

  var date = new Date();
  var search = [
    [
      'or',
      ['SINCE', formatDate(new Date(date.setDate(date.getDate() - 1)))],
      ['UNSEEN']
    ]
  ];

  if (modules.abuse.data.imap.from && modules.abuse.data.imap.from.length) {
    if (modules.abuse.data.imap.from.length === 1) {
      modules.abuse.data.imap.from.forEach(function(email) {
        search.push(['FROM', email.trim()]);
      });
    } else if (modules.abuse.data.imap.from.length > 1) {
      var search_or = [];
      search_or.push('or');
      modules.abuse.data.imap.from.forEach(function(email) {
        search_or.push(['FROM', email.trim()]);
      });
      search.push(search_or);
    } else {
      search.push(['ALL']);
    }
  }

  var headers_ = [];

  var transporter =
    options_smtp && options_smtp.host
      ? nodemailer.createTransport(options_smtp)
      : null;
  var imap = new Imap(options_imap);

  var si_i = 0;
  var si = setInterval(function() {
    if (si_i >= 6) {
      clearInterval(si);
      console.error('ERROR: IMAP Timeout');
      active.num--;
      active.process.imap = false;
    }
    si_i++;
  }, 11000);

  imap.once('ready', function() {
    imap.openBox('INBOX', false, function(err) {
      if (err) {
        console.error('imap.openBox', err);
        return imap.end();
      }
      imap.search(search, function(err, results) {
        if (err || !results || !results.length) {
          console.log('imap.search', search, err || results);
          return imap.end();
        }
        var f = imap.fetch(results, { bodies: '', markSeen: true });
        f.on('message', function(msg) {
          var parser = new MP();
          parser.on('end', function(data) {
            var to =
              data['from'] && data['from'][0] && data['from'][0]['address']
                ? data['from'][0]['address']
                : '';
            var subject = data['subject'] ? data['subject'] : '';
            var text = data['text']
              ? data['text']
              : data['html']
              ? data['html']
                  .replace(/<blockquote>[^]*<\/blockquote>/gi, '')
                  .replace(/<q>[^]*<\/q>/gi, '')
              : '';
            var html = data['html']
              ? data['html']
                  .replace(/<blockquote>[^]*?<\/blockquote>/gi, '')
                  .replace(/<q>[^]*?<\/q>/gi, '')
              : data['text']
              ? data['text']
              : '';
            if (to && subject && (text || html)) {
              headers_.push({
                to: to,
                subject: subject,
                text: text,
                html: html
              });
            }
          });
          msg.on('body', function(stream) {
            stream.on('data', function(chunk) {
              parser.write(td.decode(chunk));
            });
          });
          msg.once('end', function() {
            parser.end();
          });
        });
        f.once('error', function(err) {
          console.error('f.once', err);
        });
        f.once('end', function() {
          imap.end();
        });
      });
    });
  });
  imap.once('error', function(err) {
    clearInterval(si);
    console.error('imap.once', err);
    active.num--;
    active.process.imap = false;
  });
  imap.once('close', function() {
    clearInterval(si);
    if (headers_ && headers_.length) {
      var save = false;
      async.eachOfLimit(
        headers_,
        1,
        function(d, i, callback) {
          var re = new RegExp(
            '(' +
              config.domain +
              '|' +
              config.bomain +
              ')' +
              '(\\/mobile-version|\\/tv-version|)\\/[a-z0-9._-]*?' +
              (config.urls.slash === '/' ? '\\/' : '-') +
              '[a-z0-9._-]*',
            'ig'
          );
          var urls = headers_[i].html
            .replace(/<br>/gi, '')
            .replace(/\n/gi, '')
            .replace(/\r\n/gi, '')
            .replace(/\r/gi, '')
            .match(re);
          if (!urls) {
            console.log('NOT ID', headers_[i]);
            return callback();
          } else {
            var unique = urls.filter(function(v, i, a) {
              return a.indexOf(v) === i;
            });
            console.log('URLS', unique);
          }
          var send = false;
          headers_[i].id = [];
          unique.forEach(function(u) {
            var id = movie.id(u);
            if (id >= 1 && id <= 99999999) {
              send = !!transporter;
              if (!(headers_[i].id.indexOf('' + id) + 1)) {
                headers_[i].id.push(id.toString());
              }
              if (modules.abuse.data.movies.indexOf('' + id) + 1) {
                console.log('ABUSE ONLY EMAIL', headers_[i].to, id, send);
              } else {
                console.log('ABUSE', headers_[i].to, id, send);
                modules.abuse.data.movies.unshift('' + id);
                save = true;
              }
            }
          });
          console.log('SEND', send, headers_[i].id);
          if (send) {
            send = false;
            var dateNow = new Date();
            var dateString =
              ('0' + dateNow.getDate()).slice(-2) +
              '-' +
              ('0' + (dateNow.getMonth() + 1)).slice(-2) +
              '-' +
              dateNow.getFullYear() +
              ' ' +
              ('0' + dateNow.getHours()).slice(-2) +
              ':' +
              ('0' + dateNow.getMinutes()).slice(-2);
            var mailMessage =
              message && message.indexOf('[id]') + 1
                ? message.replace(/\[id]/gi, headers_[i].id.join(','))
                : message;
            var mailOptions = {
              name: options_smtp.auth.user.split('@')[1],
              from: options_smtp.auth.user,
              to: headers_[i].to,
              textEncoding: 'base64',
              date: dateNow,
              subject: 'RE: ' + headers_[i].subject,
              text: (
                mailMessage
                  .replace(/<br>/gi, '\n')
                  .replace(/(<([^>]+)>)/gi, '') +
                '\n\n' +
                '---- ' +
                dateString +
                ' <' +
                headers_[i].to +
                '> ----\n' +
                headers_[i].text
                  .replace(/<br>/gi, '\n')
                  .replace(/(<([^>]+)>)/gi, '')
              ).replace(/(^\s*)|(\s*)$/g, ''),
              html: (
                mailMessage +
                '<br><br>' +
                '---- ' +
                dateString +
                ' <' +
                headers_[i].to +
                '> ----<br>' +
                '<blockquote>' +
                headers_[i].html.replace(/\n/g, '<br>') +
                '</blockquote>'
              )
                .replace(/\s+/g, ' ')
                .replace(/(^\s*)|(\s*)$/g, '')
            };
            setTimeout(function() {
              console.log(
                'START sendMail',
                headers_[i].to,
                headers_[i].subject
              );
              transporter.sendMail(mailOptions, function(err) {
                if (err) console.error('sendMail', err);
                console.log(
                  'REPLY',
                  headers_[i].to,
                  'RE: ' + headers_[i].subject
                );
                if (
                  !err &&
                  modules.abuse.data.smtp.host.indexOf('zoho') === -1
                ) {
                  var imap2 = new Imap(options_imap);
                  var si_i2 = 0;
                  var si2 = setInterval(function() {
                    if (si_i2 >= 6) {
                      clearInterval(si2);
                      console.error('ERROR: IMAP2 Timeout');
                      callback();
                    }
                    si_i2++;
                  }, 11000);
                  imap2.once('ready', function() {
                    imap2.openBox('Sent', false, function(err, box) {
                      if (err) {
                        console.error('openBox Sent', err);
                        imap2.end();
                        callback();
                      }
                      let msg, htmlEntity;
                      msg = mimemessage.factory({
                        contentType: 'multipart/alternate',
                        body: []
                      });
                      htmlEntity = mimemessage.factory({
                        contentType: 'text/html;charset=utf-8',
                        body: mailOptions.html
                      });
                      msg.header(
                        'Message-ID',
                        '<' +
                          Math.random()
                            .toString(36)
                            .substr(2, 5) +
                          '>'
                      );
                      msg.header('From', mailOptions.from);
                      msg.header('To', mailOptions.to);
                      msg.header('Subject', mailOptions.subject);
                      msg.body.push(htmlEntity);
                      imap2.append(
                        msg.toString(),
                        {
                          mailbox: 'Sent',
                          flags: ['Seen']
                        },
                        function(err) {
                          if (err) {
                            console.error('APPEND', err);
                          }
                          imap2.end();
                        }
                      );
                    });
                  });
                  imap2.once('error', function(err) {
                    clearInterval(si2);
                    console.error('SENT FOLDER', err);
                    callback();
                  });
                  imap2.once('close', function() {
                    clearInterval(si2);
                    console.error('SENT', mailOptions.to, mailOptions.subject);
                    callback();
                  });
                  imap2.connect();
                } else {
                  callback();
                }
              });
            }, 180000 * i);
            console.log('TIMEOUT', headers_[i].subject, 180000 * i, 'sec');
          } else {
            callback();
          }
        },
        function(err) {
          if (err) console.error(err);
          if (save) {
            CP_save.save(modules, 'modules', function(err) {
              if (err) console.log('[CP_save.save]', err);
              if (modules.abuse.data.imap.subdomain) {
                config.subdomain = dayToLetter();
                CP_save.save(config, 'config', function(err) {
                  if (err) console.log('[CP_save.save]', err);
                  CP_sub.add(config.subdomain, config.domain);
                  active.num--;
                  active.process.imap = false;
                });
              } else {
                active.num--;
                active.process.imap = false;
              }
            });
          } else {
            active.num--;
            active.process.imap = false;
          }
        }
      );
    } else {
      active.num--;
      active.process.imap = false;
      console.log('headers:', headers_.length, 'data:', headers_.length);
    }
  });
  imap.connect();

  function formatDate(date) {
    var monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return monthNames[monthIndex] + ' ' + day + ', ' + ' ' + year;
  }
} else {
  console.log(
    'NOT START:',
    'IMAP',
    'user',
    !!modules.abuse.data.imap.user,
    'password',
    !!modules.abuse.data.imap.password,
    'host',
    !!modules.abuse.data.imap.host,
    '3 !=',
    hour
  );
}

/**
 * Sitemap generator.
 */

if (hour === 1 || hour === 2 || hour === 4 || hour === 5) {
  active.num++;
  active.process.sitemap = true;

  setTimeout(function() {
    active.num--;
    active.process.sitemap = false;
  }, 1000 * 60 * 50);

  var year_start = new Date(timeZone).getFullYear() + 10;
  var year_stop = 1890;

  if (hour === 1) {
    year_stop = 2010;
  } else if (hour === 2) {
    year_start = 2009;
    year_stop = 1995;
  } else if (hour === 4) {
    year_start = 1994;
    year_stop = 1980;
  } else if (hour === 5) {
    year_start = 1979;
  }

  var years = [];

  for (var i = year_start; i >= year_stop; i--) {
    years.push('' + i);
  }

  var start = new Date();

  async.eachOfLimit(
    years,
    1,
    function(year, key, callback) {
      process.env['CP_VER'] = new Date().getTime().toString();

      CP_get.movies({ year: year }, -1, 'kinopoisk-vote-up', 1, true, function(
        err,
        movies
      ) {
        if (err) return callback(err);

        var render = {};
        render.urls = [];

        if (movies && movies.length) {
          for (var i = 0; i < movies.length; i++) {
            if (
              (config.urls.noindex &&
                movies[i].url.indexOf(
                  '/' + config.urls.noindex + config.urls.slash
                ) + 1) ||
              (modules.abuse.data.status_code_list === '404' &&
                modules.abuse.data.movies.indexOf(movies[i].kp_id + '') + 1)
            ) {
              continue;
            }
            render.urls[render.urls.length] = {
              loc:
                config.protocol +
                (config.bomain ? config.botdomain : config.subdomain) +
                (config.bomain || config.domain) +
                movies[i].pathname,
              lastmod:
                movies[i].custom && movies[i].custom.lastmod
                  ? movies[i].custom.lastmod.substr(0, 10)
                  : '',
              image:
                config.protocol +
                  (config.botdomain + config.bomain ||
                    config.subdomain + config.domain) +
                  movies[i].poster || '',
              title: (movies[i].title || '')
                .replace(/&/g, '&amp;')
                .replace(/'/g, '&apos;')
                .replace(/"/g, '&quot;')
                .replace(/>/g, '&gt;')
                .replace(/</g, '&lt;')
            };
          }

          var tq = new Date() - start;
          var la = parseFloat(os.loadavg(1).toFixed(2));
          console.log(
            '[',
            Math.ceil(os.freemem()),
            'MB]',
            '[',
            year,
            '] query:',
            tq,
            'ms',
            'loadavg:',
            la
          );
          if (Math.ceil(os.freemem()) < 50) {
            callback('STOP');
          } else {
            setTimeout(function() {
              start = new Date();
              callback(null, render);
            }, tq * la);
          }
        } else {
          return callback(null, render);
        }

        var dir = path.join(
          __dirname,
          '..',
          'themes',
          config.theme,
          'views',
          config.urls.sitemap
        );

        fs.mkdirSync(dir, { recursive: true });
        fs.writeFile(
          path.join(dir, config.urls.year + '-' + year + '.json'),
          JSON.stringify(render, null, 2),
          function(err) {
            if (err) console.error('Write File Error:', err);
            CP_cache.flush(function() {});
          }
        );
      });
    },
    function() {
      active.num--;
      active.process.sitemap = false;
    }
  );
} else {
  console.log('NOT START:', 'SITEMAP', 'hour', '1,2,4,5 !=', hour);
}

/**
 * Categories generator.
 */

if (hour === 6) {
  active.num++;
  active.process.categories = true;

  setTimeout(function() {
    active.num--;
    active.process.categories = false;
  }, 1000 * 60 * 50);

  var categories = ['year', 'genre', 'country', 'actor', 'director'];

  async.eachOfLimit(
    categories,
    1,
    function(category, key, callback) {
      process.env['CP_VER'] = new Date().getTime().toString();

      var query = {};
      query[category] = '!_empty';
      CP_get.movies(query, -2, 'kinopoisk-vote-up', 1, false, function(
        err,
        movies
      ) {
        if (err) return callback(err);

        if (movies && movies.length && category === 'year') {
          movies.push({
            year: new Date().getFullYear() + ''
          });
        }

        var render = CP_structure.categories(category, movies);

        callback(null, render);

        var file = path.join(__dirname, '..', 'files', category + '.json');

        fs.writeFile(file, JSON.stringify(render, null, 2), function(err) {
          if (err) console.error('Write File Error:', err);
        });
      });
    },
    function() {
      active.num--;
      active.process.categories = false;
    }
  );
} else {
  console.log('NOT START:', 'CATEGORIES', 'hour', '6 !=', hour);
}

/**
 * Generate WORLD and RU subdomains.
 */

if (config.random || config.ru.random) {
  (function fileSubdomains() {
    request('https://api.ipify.org', function(error, response, body) {
      if (error || !body) return;
      var dns = '.' + config.domain + '.\t1\tIN\tA\t' + body;
      var dns_ru = '.' + config.ru.domain + '.\t1\tIN\tA\t' + body;
      var subdomains = {};
      subdomains[config.domain] = [dayToLetter().replace(/\./g, '') + dns];
      if (config.ru.domain) {
        if ((config.domain = config.ru.domain)) {
          subdomains[config.domain].push(
            dayToLetter()
              .replace(/\./g, '')
              .split('')
              .reverse()
              .join('') + dns
          );
        } else {
          subdomains[config.ru.domain] = [
            dayToLetter()
              .replace(/\./g, '')
              .split('')
              .reverse()
              .join('') + dns_ru
          ];
        }
      }
      for (var i = 1; i <= 365; i++) {
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + i);
        subdomains[config.domain].push(
          dayToLetter(tomorrow).replace(/\./g, '') + dns
        );
        if (config.ru.domain) {
          subdomains[config.ru.domain].push(
            dayToLetter(tomorrow)
              .replace(/\./g, '')
              .split('')
              .reverse()
              .join('') + dns_ru
          );
        }
      }
      fs.writeFileSync(
        path.join(
          path.dirname(__filename),
          '..',
          'files',
          config.domain +
            (config.dns.cloudflare.proxied === 'true' ? '.proxied' : '') +
            '.sub.txt'
        ),
        subdomains[config.domain].join('\n') + '\n'
      );
      if (config.ru.domain) {
        fs.writeFileSync(
          path.join(
            path.dirname(__filename),
            '..',
            'files',
            config.ru.domain +
              (config.dns.cloudflare.proxied === 'true' ? '.proxied' : '') +
              '.sub.txt'
          ),
          subdomains[config.ru.domain].join('\n') + '\n'
        );
      }
    });
  })();
}

/**
 * Save data.
 *
 * @param {String} collection
 * @param {Object} movies
 * @param {Callback} callback
 */

function saveData(collection, movies, callback) {
  CP_get.contents({ content_url: collection }, 1, 1, false, function(
    err,
    contents
  ) {
    if (err) {
      console.log('[CP_get.contents]', collection, err);
      return callback(null);
    }
    if (contents && contents.length && contents[0].id) {
      console.log('API', movies.length, 'movies');
      console.log(movies);
      var content = contents[0];
      var query_id = movies
        .map(function(id) {
          return id.kinopoisk_id;
        })
        .join('|');
      CP_get.movies(
        { query_id: query_id },
        movies.length,
        '',
        1,
        false,
        function(err, ms) {
          if (err) {
            console.log('[CP_get.movies]', collection, err);
            return callback(null);
          }
          console.log('Website', ms.length, 'movies');
          if (ms && ms.length) {
            var sort_movies = sortingIds(movies, ms);
            console.log('After sort', sort_movies.length, 'movies');
            if (!sort_movies.length) return callback(null);
            var content_movies = content.content_movies
              .replace(/^,*|,*$/, '')
              .split(',');
            sort_movies.reverse().forEach(function(m) {
              if (!m.kp_id) return;
              return content_movies.unshift('' + m.kp_id);
            });
            content.content_movies = content_movies
              .filter(function(value, index, self) {
                return self.indexOf(value) === index;
              })
              .filter(Boolean)
              .filter(function(id) {
                return (
                  parseInt(id) &&
                  modules.abuse.data.movies.indexOf(id + '') === -1
                );
              })
              .join(',');
            var noMore = 0;
            if (content.content_tags.indexOf('NoMore') + 1) {
              content.content_tags.split(',').forEach(function(tag) {
                if (tag.indexOf('NoMore') + 1) {
                  noMore = parseInt(tag.replace(/[^0-9]/g, '') || '200');
                }
              });
            }
            if (noMore && content.content_movies.split(',').length > noMore) {
              content.content_movies = content.content_movies
                .split(',')
                .slice(0, noMore);
            }
            if (!noMore && content.content_movies.split(',').length > 200) {
              content.content_tags =
                content.content_tags.indexOf('NoSorting') + 1
                  ? content.content_tags
                  : content.content_tags
                  ? content.content_tags + ',NoSorting'
                  : 'NoSorting';
            }
            CP_save.save(content, 'content', function(err, result) {
              console.log(
                '[CP_save.save]',
                collection,
                content.content_movies,
                err,
                result
              );
              var readOnly = false;
              CP_cache.flush(function(err) {
                if (readOnly) {
                  return console.error('readOnly', err);
                }
                readOnly = true;
                var saved = {};
                async.eachOfLimit(
                  sort_movies,
                  1,
                  function(movie, key, callback) {
                    if (!movie.translate && !movie.quality)
                      return callback(null);
                    var rt = {};
                    rt.id = movie.kp_id;
                    rt.kp_id = movie.kp_id;
                    rt.translate = movie.translate;
                    rt.quality = movie.quality.toUpperCase();
                    rt.duplicate = true;
                    try {
                      var c = movie.custom ? JSON.parse(movie.custom) : {};
                      c.unique = c.unique ? c.unique : false;
                      rt.custom = JSON.stringify(c);
                    } catch (e) {
                      rt.custom = JSON.stringify({ unique: false });
                    }
                    CP_save.save(rt, 'rt', function(save_e) {
                      setTimeout(function() {
                        CP_get.movies(
                          { query_id: rt.id + '' },
                          1,
                          '',
                          1,
                          false,
                          function(get_e, available) {
                            if (err || !available || !available.length) {
                              saved[rt.id] =
                                'SAVE: ' + save_e + ' GET: ' + get_e;
                            } else {
                              saved[rt.id] =
                                available[0].title_ru +
                                ' - [' +
                                rt.quality +
                                '] == [' +
                                available[0].quality +
                                '] [' +
                                rt.translate +
                                '] == [' +
                                available[0].translate +
                                ']';
                            }
                            setTimeout(function() {
                              return callback(null);
                            }, 1000);
                          }
                        );
                      }, 1000);
                    });
                  },
                  function() {
                    console.log('SAVED', saved);
                    return callback(null);
                  }
                );
              });
            });
          } else {
            console.log(
              '[CP_get.movies] NOT IDs',
              query_id.split('|'),
              collection,
              err
            );
            return callback(null);
          }
        }
      );
    } else {
      console.log('[CP_get.contents] NOT', collection, err);
      callback(null);
    }
  });
}

/**
 * Valid JSON.
 *
 * @param {String} jsonString
 */

function tryParseJSON(jsonString) {
  try {
    var o = JSON.parse(jsonString);
    if (o && typeof o === 'object') {
      return o;
    }
  } catch (e) {}
  return {};
}

/**
 * Sort series are turned by id list.
 *
 * @param {Object} updates
 * @param {Object} movies
 * @return {Array}
 */

function sortingSeries(updates, movies) {
  var result = [];

  for (var u = 0; u < updates.length; u++) {
    var kp1 = parseInt(('' + updates[u].kinopoisk_id).replace(/[^0-9]/g, ''));
    for (var m = 0; m < movies.length; m++) {
      var kp2 = parseInt(movies[m].kp_id);
      if (kp1 === kp2) {
        movies[m].quality = updates[u].quality ? updates[u].quality : '';
        movies[m].translate = updates[u].translate ? updates[u].translate : '';
        if (updates[u].season) movies[m].season = updates[u].season;
        if (updates[u].episode) movies[m].episode = updates[u].episode;
        if (updates[u].translate_url)
          movies[m].translate_url = updates[u].translate_url;
        result.push(movies[m]);
      }
    }
  }

  return result;
}

/**
 * Sort ids are turned by id list.
 *
 * @param {Object} updates
 * @param {Object} movies
 * @return {Array}
 */

function sortingIds(updates, movies) {
  var result = [];

  for (var u = 0; u < updates.length; u++) {
    var kp1 = parseInt(('' + updates[u].kinopoisk_id).replace(/[^0-9]/g, ''));
    for (var m = 0; m < movies.length; m++) {
      var kp2 = parseInt(movies[m].kp_id);
      if (kp1 === kp2) {
        result.push({
          kp_id: movies[m].kp_id,
          custom: movies[m].custom,
          quality:
            updates[u].quality && movies[m].quality !== updates[u].quality
              ? updates[u].quality
              : movies[m].quality,
          translate:
            updates[u].translate && movies[m].translate !== updates[u].translate
              ? updates[u].translate
              : movies[m].translate
        });
      }
    }
  }

  return result;
}

/**
 * Current day to letter.
 */

function dayToLetter(now) {
  now = now || new Date();
  var year = now.getFullYear();
  var start = new Date(year, 0, 0);
  var diff = now - start;
  var oneDay = 86400000;
  var day = ('00' + Math.floor(diff / oneDay)).slice(-3);
  var letter1 = ['a', 'e', 'i', 'o', 'u'];
  var letter2 = ['b', 'c', 'd', 'f', 'g', 'h', 'z', 'k', 'l', 'm'];
  var letter3 = ['n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y']; // j
  if (config.domain.split('.')[0].length % 2) {
    letter1 = letter1.reverse();
  }
  if (config.domain.split('.')[1].length % 2) {
    letter2 = letter2.reverse();
  }
  var result =
    letter2[parseInt(day[0])] +
    letter1[parseInt(day[1]) % 5] +
    letter3[parseInt(day[2])] +
    (config.random === 3 ? '' : letter1[year % 5]);
  if (parseInt(day[1]) >= 5) {
    result =
      letter1[parseInt(day[0]) % 5] +
      (parseInt(day[0] + day[2]) % 2 ? letter2 : letter3)[parseInt(day[1])] +
      letter1[parseInt(day[2]) % 5] +
      (config.random === 3 ? '' : letter2[year % 10]);
  }
  if (now.getDate() % 2) {
    result = result
      .split('')
      .reverse()
      .join('');
  }
  var words = config.subdomain.split('.').filter(Boolean);
  words[0] = result;
  return words.join('.') + '.';
}

/**
 * Check active process.
 */

var interval = 0;
var sint = setInterval(function() {
  if (!(interval % 10)) {
    if (Object.keys(active.process).length) {
      console.log(active.num, active.process);
    }
  }
  if (active.num <= 0) {
    clearInterval(sint);
    if (Object.keys(active.process).length) {
      console.log(active.num, active.process);
    }
    if (Object.keys(active.process).length === 0) return;
    var rand = Math.floor(Math.random() * 10) + 10;
    setTimeout(function() {
      pm2.connect(function(err) {
        if (err) {
          console.error('pm2.connect', err);
          return process.exit(0);
        }
        pm2.reload(config.domain, function(err) {
          if (err) {
            console.error('pm2.reload', err);
            return process.exit(0);
          }
          CP_cache.flush(function() {
            console.timeEnd('DONE');
            return process.exit(0);
          });
        });
      });
    }, rand * 1000);
  }
  interval++;
}, 1000);
