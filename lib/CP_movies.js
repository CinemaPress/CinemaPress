'use strict';

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
 * Module dependencies.
 */

var CP_get = require('./CP_get');
var CP_save = require('./CP_save');

/**
 * Node dependencies.
 */

var fs = require('fs');
var path = require('path');
var os = require('os-utils');
var op = require('object-path');
var async = require('async');
var adop = require('adop');
var axios = require('axios');
var convert = require('xml-js');
var htmlmetaparser = require('htmlmetaparser');
var countries = require('i18n-iso-countries');
var htmlparser2 = require('htmlparser2');
var LRU = require('lru-cache');
var cache = new LRU({ max: 1000 });

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

process.env['NO_CACHE'] = true;

var run = process.argv && typeof process.argv[2] !== 'undefined';
var timeZone = new Date();
var hour = new Date(timeZone).getHours() + 1;

console.log(
  timeZone,
  '[',
  Math.ceil(os.freemem()),
  'MB ]',
  '1min:',
  os.loadavg(1).toFixed(2),
  '5min:',
  os.loadavg(5).toFixed(2),
  '15min:',
  os.loadavg(15).toFixed(2)
);

if (Math.ceil(os.freemem()) < 50) {
  console.log('The server is overloaded to start get movies.');
  return process.exit(0);
}

/**
 * Get movie information.
 *
 */

(function getInfo() {
  if (!config.movies.cron) return process.exit();

  var tasks = [];
  config.movies.cron.forEach(function(task) {
    var parse = task
      .replace(/(^\s*)|(\s*)$/g, '')
      .replace(/\s*~\s*/g, '~')
      .split('~');
    if (task.charAt(0) === '#') return;
    tasks.push({
      hour: parse[0] && parseInt(parse[0]) ? parseInt(parse[0]) : 0,
      page: parse[1] || '',
      path: (parse[2] || '').split('<>')[0].trim(),
      id: parse[3] || '',
      info: parse.slice(4),
      type_id: ((parse[2] || '').split('<>')[1] || '').trim(),
      ids: []
    });
  });

  var update_m = 0;
  var added_m = 0;

  async.eachOfLimit(
    tasks,
    1,
    function(task, task_index, callback) {
      if (task.hour && task.hour % hour) {
        return callback();
      }
      if (task.hour === 0 && !run) {
        return callback();
      }
      var i = 1;
      var fail_req = 5;
      var next_req = 1;
      var prev_req = 0;
      var some_req = 0;
      var retry_req = '';
      var ids = cache.get(task.page + task.path + task.type_id) || [];
      if (ids && ids.length) {
        fail_req = 0;
        next_req = 0;
      }
      async.forever(
        function(next) {
          if (
            task.page === '' ||
            task.page === 'realtime' ||
            task.page === 'rt' ||
            task.page === 'database' ||
            task.page === 'db'
          ) {
            CP_get.movies(
              { certainly: true },
              100,
              'kinopoisk-id-up',
              i,
              false,
              function(err, rt) {
                if (ids.length && !(ids.length % 1000)) {
                  console.log('[REALTIME]', ids.length);
                }
                if (err) {
                  console.error(err);
                  return next('STOP');
                }
                if (rt && rt.length) {
                  rt.forEach(function(r) {
                    var id = '';
                    if (task.path.indexOf('custom.') + 1) {
                      var cst = {};
                      try {
                        cst = r.custom ? JSON.parse(r.custom) : {};
                      } catch (e) {}
                      id = op.get({ custom: cst }, task.path);
                      if (id) {
                        task.type_id = task.path;
                      }
                    } else {
                      id = r['kp_id'];
                      task.type_id = 'kp_id';
                    }
                    if (id && ids.indexOf(id + '') === -1) {
                      ids.push(id + '');
                    }
                  });
                  i = i + 1;
                  return next();
                } else {
                  return next('STOP');
                }
              }
            );
          } else {
            if (task.page.indexOf('[page]') === -1 && i > 1) {
              console.log('[PAGE] 1');
              return next('STOP');
            }
            if (fail_req <= 0) {
              if (next_req) {
                i++;
                fail_req = 5;
                next_req = 0;
                retry_req = '';
                return next();
              }
              console.log('[FAIL] REQUEST');
              return next('STOP');
            }
            if (some_req >= 5) {
              console.log('[SOME] LENGTH');
              return next('STOP');
            }
            if (prev_req === ids.length) {
              some_req++;
            } else {
              retry_req = '';
              some_req = 0;
              prev_req = 0;
            }
            prev_req = ids.length;
            var url_req = task.page.replace('[page]', i);
            if (retry_req) {
              url_req = retry_req;
            } else {
              console.log('[REALTIME]', ids.length, url_req);
            }
            var opt = {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0'
              }
            };
            var hostname = require('url').parse(url_req).hostname;
            if (config.movies.proxy && config.movies.proxy.length) {
              var proxies = config.movies.proxy.filter(function(p) {
                var only_proxy = p.split('<>')[0].trim();
                var only_domain = (p.split('<>')[1] || '').trim();
                if (only_domain) {
                  if (only_proxy && only_domain === hostname) {
                    return true;
                  }
                } else if (only_proxy) {
                  return true;
                }
                return false;
              });
              var proxy =
                proxies && proxies.length
                  ? proxies[Math.floor(Math.random() * proxies.length)]
                  : '';
              if (proxy) {
                opt['headers'] = {
                  'User-Agent':
                    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
                };
                var proxy_obj = {};
                proxy_obj['protocol'] =
                  proxy.indexOf('http://') + 1 ? 'http' : 'https';
                proxy = proxy.replace(/https?:\/\//i, '');
                var host_auth = proxy.split('@');
                if (proxy.indexOf('@') + 1) {
                  proxy_obj['host'] = host_auth[1].split(':')[0];
                  proxy_obj['port'] = host_auth[1].split(':')[1];
                  proxy_obj['auth'] = {
                    username: host_auth[0].split(':')[0],
                    password: host_auth[0].split(':')[1]
                  };
                } else {
                  proxy_obj['host'] = host_auth[0].split(':')[0];
                  proxy_obj['port'] = host_auth[0].split(':')[1];
                }
                opt.proxy = proxy_obj;
              }
            }
            axios(url_req, opt)
              .then(function(r) {
                if (!r || !r.data) {
                  if (retry_req) {
                    i++;
                    retry_req = '';
                  } else {
                    retry_req = url_req;
                  }
                  console.error(
                    '[REALTIME]',
                    'STOP PAGE (' + (6 - fail_req) + ' fails)',
                    url_req
                  );
                  fail_req = fail_req - 1;
                  setTimeout(function() {
                    return next();
                  }, 5000);
                } else if (r.data) {
                  if (
                    typeof r.data === 'string' &&
                    r.data.indexOf('<html') + 1
                  ) {
                    if (task.path) {
                      var ids_list = r.data.match(task.path.split('<>')[0]);
                      if (ids_list && ids_list.length) {
                        ids_list.forEach(function(id) {
                          id = id.trim();
                          if (id && ids.indexOf(id) === -1) {
                            ids.push(id);
                          }
                        });
                      }
                    }
                    i++;
                    return next();
                  } else {
                    var all = adop(tryParseJSON(r.data), [
                      {
                        name: 'id',
                        path: task.path.split('<>')[0],
                        type: task.path.split('<>')[1] || undefined,
                        regex: task.path.split('<>')[2] || undefined
                      }
                    ]);
                    if (all && all.length) {
                      all.forEach(function(a) {
                        if (
                          a &&
                          a.id &&
                          a.id !== 'null' &&
                          a.id !== 'false' &&
                          a.id !== 'undefined' &&
                          a.id !== 'n/a' &&
                          a.id !== 'N/A' &&
                          ids.indexOf(a.id) === -1
                        ) {
                          ids.push(a.id);
                        }
                      });
                      i++;
                      return next();
                    } else {
                      if (retry_req) {
                        i++;
                        retry_req = '';
                      } else {
                        retry_req = url_req;
                      }
                      console.error(
                        '[REALTIME]',
                        'STOP PAGE (' + (6 - fail_req) + ' fails)',
                        url_req
                      );
                      fail_req = fail_req - 1;
                      setTimeout(function() {
                        return next();
                      }, 5000);
                    }
                  }
                } else {
                  return next();
                }
              })
              .catch(function(err) {
                if (retry_req) {
                  i++;
                  retry_req = '';
                } else {
                  retry_req = url_req;
                }
                console.error(
                  '[REALTIME]',
                  'STOP PAGE (' + (6 - fail_req) + ' fails)',
                  url_req,
                  err.response && err.response.status + '',
                  err.response && err.response.statusText + ''
                );
                fail_req = fail_req - 1;
                setTimeout(function() {
                  return next();
                }, 5000);
              });
          }
        },
        function() {
          cache.set(task.page + task.path + task.type_id, ids);
          async.eachOfLimit(
            ids,
            5,
            function(id, id_index, callback) {
              if (!/\[[a-z0-9_]+?]/i.test(task.id + '') && id_index >= 1) {
                if (
                  !(
                    task.page === '' ||
                    task.page === 'realtime' ||
                    task.page === 'rt' ||
                    task.page === 'database' ||
                    task.page === 'db'
                  )
                ) {
                  return callback();
                }
              }
              var task_type_id = task.type_id || '';
              var task_url = (task.id + '').replace(/\[[a-z0-9_]+?]/i, id + '');
              if (task_url) {
                var opt = {
                  headers: {
                    'User-Agent':
                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0'
                  }
                };
                var hostname = require('url').parse(task_url).hostname;
                if (config.movies.proxy && config.movies.proxy.length) {
                  var proxies = config.movies.proxy.filter(function(p) {
                    var only_proxy = p.split('<>')[0].trim();
                    var only_domain = (p.split('<>')[1] || '').trim();
                    if (only_domain) {
                      if (only_proxy && only_domain === hostname) {
                        return true;
                      }
                    } else if (only_proxy) {
                      return true;
                    }
                    return false;
                  });
                  var proxy =
                    proxies && proxies.length
                      ? proxies[Math.floor(Math.random() * proxies.length)]
                      : '';
                  if (proxy) {
                    opt['headers'] = {
                      'User-Agent':
                        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
                    };
                    var proxy_obj = {};
                    proxy_obj['protocol'] =
                      proxy.indexOf('http://') + 1 ? 'http' : 'https';
                    proxy = proxy.replace(/https?:\/\//i, '');
                    var host_auth = proxy.split('@');
                    if (proxy.indexOf('@') + 1) {
                      proxy_obj['host'] = host_auth[1].split(':')[0];
                      proxy_obj['port'] = host_auth[1].split(':')[1];
                      proxy_obj['auth'] = {
                        username: host_auth[0].split(':')[0],
                        password: host_auth[0].split(':')[1]
                      };
                    } else {
                      proxy_obj['host'] = host_auth[0].split(':')[0];
                      proxy_obj['port'] = host_auth[0].split(':')[1];
                    }
                    opt.proxy = proxy_obj;
                  }
                }
                axios(task_url, opt)
                  .then(function(j) {
                    if (!j || !j.data) {
                      return callback();
                    }
                    if (
                      typeof j.data === 'string' &&
                      j.data.indexOf('<html') + 1
                    ) {
                      var handler = new htmlmetaparser.Handler(
                        function(err, json) {
                          if (!json || typeof json !== 'object') {
                            return callback();
                          }
                          movie_data(json, function() {
                            return callback();
                          });
                        },
                        { url: task_url }
                      );
                      var parser = new htmlparser2.Parser(handler, {
                        decodeEntities: true
                      });
                      parser.write(j.data);
                      parser.done();
                    }
                    var json = tryParseJSON(j.data);
                    if (!json || typeof json !== 'object') {
                      return callback();
                    }
                    movie_data(json, function() {
                      return callback();
                    });
                  })
                  .catch(function(err) {
                    console.log(
                      '[REALTIME]',
                      id_index + 1,
                      '/',
                      ids.length,
                      ')',
                      'ERROR MOVIE',
                      task_url,
                      err.response && err.response.status + '',
                      err.response && err.response.statusText + ''
                    );
                    return callback();
                  });
              } else {
                movie_data({}, function() {
                  return callback();
                });
              }
              function movie_data(json, callback) {
                var movie = {};
                if (task_type_id) {
                  if (task_type_id === 'id' || task_type_id === 'kp_id') {
                    movie['kp_id'] = id.replace(/[^0-9]/g, '');
                  } else if (task_type_id.indexOf('custom.') + 1) {
                    op.set(movie, task_type_id, id.replace(/[^0-9]/g, ''));
                  }
                }
                task.info.forEach(function(info) {
                  var parse = info
                    .replace(/(^\s*)|(\s*)$/g, '')
                    .replace(/\s*<>\s*/g, '<>')
                    .split('<>');
                  var sup_double = !!(parse[3] && parse[3].indexOf('==') + 1);
                  var sup_parse = parse[3]
                    ? parse[3].indexOf('==') + 1
                      ? parse[3]
                          .replace(/(^\s*)|(\s*)$/g, '')
                          .replace(/\s*==\s*/g, '==')
                          .split('==')
                      : parse[3]
                          .replace(/(^\s*)|(\s*)$/g, '')
                          .replace(/\s*=\s*/g, '=')
                          .split('=')
                    : [];
                  var eval_parse = parse[4] || '';
                  var set_data = '';
                  var listItem;
                  if (parse[0].indexOf('.0') + 1) {
                    var items = parse[0].split('.0');
                    var joinItem = items.pop().replace(/^\./, '');
                    var arrayItem = items.join('.0');
                    listItem = op.get(json, arrayItem);
                  } else if (parse[0].indexOf('"') + 1) {
                    set_data = parse[0].toString().replace(/"/g, '');
                  } else {
                    listItem = op.get(json, parse[0]);
                  }
                  if (
                    listItem &&
                    eval_parse &&
                    eval_parse.indexOf('_VALUE_') + 1
                  ) {
                    listItem = eval(
                      eval_parse.replace(
                        /_VALUE_/g,
                        typeof listItem === 'object'
                          ? JSON.stringify(listItem)
                          : typeof listItem === 'boolean'
                          ? listItem.toString()
                          : listItem
                      )
                    );
                  }
                  if (
                    listItem &&
                    typeof listItem === 'object' &&
                    Array.isArray(listItem) &&
                    listItem.length
                  ) {
                    listItem = listItem
                      .map(function(item) {
                        if (item && typeof item === 'string') {
                          return item
                            .replace(/\s+/g, ' ')
                            .replace(/(^\s*)|(\s*)$/g, '');
                        }
                        return item;
                      })
                      .filter(Boolean);
                    if (joinItem) {
                      set_data = listItem
                        .map(function(item) {
                          var set_info = false;
                          if (sup_parse[0] && sup_parse[1]) {
                            if (sup_double) {
                              if (
                                op.get(item, sup_parse[0]) &&
                                op
                                  .get(item, sup_parse[0])
                                  .toString()
                                  .toLowerCase() ===
                                  sup_parse[1].toString().toLowerCase()
                              ) {
                                set_info = true;
                              }
                            } else {
                              if (
                                op.get(item, sup_parse[0]) &&
                                op
                                  .get(item, sup_parse[0])
                                  .toString()
                                  .toLowerCase()
                                  .indexOf(
                                    sup_parse[1].toString().toLowerCase()
                                  ) + 1
                              ) {
                                set_info = true;
                              }
                            }
                          } else {
                            set_info = true;
                          }
                          return set_info ? op.get(item, joinItem) : set_info;
                        })
                        .filter(Boolean)
                        .slice(
                          0,
                          (parse[2] && parseInt(parse[2])) || listItem.length
                        )
                        .join(',');
                    } else {
                      set_data = listItem
                        .slice(
                          0,
                          (parse[2] && parseInt(parse[2])) || listItem.length
                        )
                        .join(',');
                    }
                  } else if (listItem) {
                    set_data = listItem.toString();
                  }
                  op.set(movie, parse[1], set_data);
                });
                if (movie['custom'] && typeof movie['custom'] === 'object') {
                  movie['custom']['unique'] =
                    movie['custom']['unique'] === true ||
                    movie['custom']['unique'] === 'true';
                  if (movie['custom']['imdb_id']) {
                    movie['custom']['imdb_id'] = movie['custom'][
                      'imdb_id'
                    ].replace(/[^0-9]/g, '');
                  }
                  [
                    'imdb_id',
                    'tmdb_id',
                    'douban_id',
                    'tvmaze_id',
                    'wa_id',
                    'movie_id'
                  ].forEach(function(id) {
                    if (
                      typeof movie['custom'][id] !== 'undefined' &&
                      !movie['custom'][id]
                    ) {
                      delete movie['custom'][id];
                    }
                  });
                } else {
                  movie['custom'] = { unique: false };
                }
                if (
                  movie['title_ru'] &&
                  movie['title_en'] &&
                  movie['title_ru'] === movie['title_en'] &&
                  movie['title_ru'] !== movie['title_ru'].replace(/[^0-9]/g, '')
                ) {
                  if (movie['title_en'].replace(/[^а-яё]/gi, '')) {
                    movie['title_en'] = '';
                  } else {
                    movie['title_ru'] = '';
                  }
                }
                if (movie['description']) {
                  movie['description'] = (movie['description'] + '')
                    .replace(/\n\r/g, ' ')
                    .replace(/\n/g, ' ')
                    .replace(/\r/g, ' ')
                    .replace(/\s+/g, ' ')
                    .replace(/(^\s*)|(\s*)$/g, '');
                }
                if (movie['genre']) {
                  movie['genre'] = (movie['genre'] + '').replace(' & ', ',');
                }
                if (config.language === 'ru') {
                  if (movie['genre']) {
                    movie['genre'] = movie['genre'].toLowerCase();
                    movie['genre'] = movie['genre'].replace(
                      'нф ',
                      'фантастика'
                    );
                  }
                  if (movie['country']) {
                    movie['country'] = movie['country']
                      .split(',')
                      .map(function(country) {
                        country = (country + '').trim();
                        if (
                          country &&
                          (country.length === 2 || country.length === 3) &&
                          countries.isValid(country)
                        ) {
                          return countries.getName(country, config.language);
                        }
                        return country;
                      })
                      .filter(Boolean)
                      .join(',');
                  }
                }
                if (!movie['poster']) {
                  movie['poster'] = '1';
                } else {
                  if (
                    movie['poster'] &&
                    movie['poster'].toLowerCase().indexOf('/st.kp.') + 1
                  ) {
                    movie['poster'] = '1';
                  } else if (
                    /^.*?media-amazon\.com\/images\/[a-z0-9]\/([a-z0-9@.,_\-]*)$/i.test(
                      movie['poster']
                    )
                  ) {
                    movie['poster'] = movie['poster'].replace(
                      /^.*?media-amazon\.com\/images\/[a-z0-9]\/([a-z0-9@.,_\-]*)$/i,
                      '/$1'
                    );
                  } else if (
                    /^.*?static\.tvmaze\.com\/uploads\/images\/[a-z_]*\/([0-9]*)\/([0-9]*)\.([a-z0-9]*)$/i.test(
                      movie['poster']
                    )
                  ) {
                    movie['poster'] = movie['poster'].replace(
                      /^.*?static\.tvmaze\.com\/uploads\/images\/[a-z_]*\/([0-9]*)\/([0-9]*)\.([a-z0-9]*)$/i,
                      '/$1-$2.$3'
                    );
                  } else {
                    movie['poster'] = '1';
                  }
                }
                if (movie['rating']) {
                  movie['rating'] = ('' + movie['rating']).replace(/,/g, '');
                  movie['rating'] =
                    parseFloat(movie['rating']) &&
                    parseFloat(movie['rating']) < 10
                      ? parseInt(parseFloat(movie['rating']) * 10 + '')
                      : parseInt(movie['rating']);
                }
                if (movie['kp_rating']) {
                  movie['kp_rating'] = ('' + movie['kp_rating']).replace(
                    /,/g,
                    ''
                  );
                  movie['kp_rating'] =
                    parseFloat(movie['kp_rating']) &&
                    parseFloat(movie['kp_rating']) < 10
                      ? parseInt(parseFloat(movie['kp_rating']) * 10 + '')
                      : parseInt(movie['kp_rating']);
                }
                if (movie['imdb_rating']) {
                  movie['imdb_rating'] = ('' + movie['imdb_rating']).replace(
                    /,/g,
                    ''
                  );
                  movie['imdb_rating'] =
                    parseFloat(movie['imdb_rating']) &&
                    parseFloat(movie['imdb_rating']) < 10
                      ? parseInt(parseFloat(movie['imdb_rating']) * 10 + '')
                      : parseInt(movie['imdb_rating']);
                }
                if (movie['vote']) {
                  movie['vote'] = ('' + movie['vote']).replace(/,/g, '');
                  movie['vote'] = parseInt(movie['vote'] + '');
                }
                if (movie['kp_vote']) {
                  movie['kp_vote'] = ('' + movie['kp_vote']).replace(/,/g, '');
                  movie['kp_vote'] = parseInt(movie['kp_vote'] + '');
                }
                if (movie['imdb_vote']) {
                  movie['imdb_vote'] = ('' + movie['imdb_vote']).replace(
                    /,/g,
                    ''
                  );
                  movie['imdb_vote'] = parseInt(movie['imdb_vote'] + '');
                }
                if (movie['premiere']) {
                  if (
                    /[0-9]{1,2}\s+[а-я]+\s+[0-9]{4}/i.test(movie['premiere'])
                  ) {
                    var p = movie['premiere'].replace(
                      /([0-9]{1,2})\s+([а-я]+)\s+([0-9]{4})/i,
                      '$3-$2-$1'
                    );
                    [
                      'января',
                      'февраля',
                      'марта',
                      'апреля',
                      'мая',
                      'июня',
                      'июля',
                      'августа',
                      'сентября',
                      'октября',
                      'ноября',
                      'декабря'
                    ].forEach(function(month, i) {
                      if (p.toLowerCase().indexOf(month) + 1) {
                        p = p.toLowerCase().replace(month, i + 1 + '');
                      }
                    });
                    p = p
                      .split('-')
                      .map(function(num) {
                        if (num && parseInt(num) < 10) {
                          num = '0' + num;
                        }
                        return num;
                      })
                      .join('-');
                    movie['premiere'] = p;
                  }
                  if (
                    /[0-9]{1,2}\s+[a-z]+\s+[0-9]{4}/i.test(movie['premiere'])
                  ) {
                    var pp = movie['premiere'].replace(
                      /([0-9]{1,2})\s+([a-z]+)\s+([0-9]{4})/i,
                      '$3-$2-$1'
                    );
                    [
                      'JAN',
                      'FEB',
                      'MAR',
                      'APR',
                      'MAY',
                      'JUN',
                      'JUL',
                      'AUG',
                      'SEP',
                      'OCT',
                      'NOV',
                      'DEC'
                    ].forEach(function(month, i) {
                      if (pp.toUpperCase().indexOf(month) + 1) {
                        p = p.toUpperCase().replace(month, i + 1 + '');
                      }
                    });
                    p = p
                      .split('-')
                      .map(function(num) {
                        if (num && parseInt(num) < 10) {
                          num = '0' + num;
                        }
                        return num;
                      })
                      .join('-');
                    movie['premiere'] = p;
                  }
                  if (
                    /[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}/i.test(movie['premiere'])
                  ) {
                    movie['premiere'] = movie['premiere'] + 'T00:00:00.000Z';
                  }
                  var year = new Date(movie['premiere']).getFullYear();
                  if (!movie['year']) {
                    movie['year'] = !isNaN(year) ? year + '' : '0';
                  }
                  movie['premiere'] = !isNaN(year)
                    ? Math.floor(
                        new Date(movie['premiere']).getTime() /
                          1000 /
                          60 /
                          60 /
                          24 +
                          719528
                      ) + ''
                    : '0';
                }
                if (
                  movie['type'] &&
                  (movie['type'].toLowerCase().indexOf('1') + 1 ||
                    movie['type'].toLowerCase().indexOf('tv') + 1 ||
                    movie['type'].toLowerCase().indexOf('show') + 1 ||
                    movie['type'].toLowerCase().indexOf('ser') + 1 ||
                    movie['type'].toLowerCase().indexOf('script') + 1)
                ) {
                  movie['type'] = 1;
                } else {
                  movie['type'] = 0;
                }
                var req_id =
                  (movie['kp_id'] && parseInt(movie['kp_id'])) ||
                  (movie['custom'] &&
                    !movie['type'] &&
                    movie['custom']['tmdb_id'] &&
                    parseInt(movie['custom']['tmdb_id']) &&
                    parseInt(movie['custom']['tmdb_id']) + 200000000) ||
                  (movie['custom'] &&
                    movie['type'] &&
                    movie['custom']['tmdb_id'] &&
                    parseInt(movie['custom']['tmdb_id']) &&
                    parseInt(movie['custom']['tmdb_id']) + 300000000) ||
                  (movie['custom'] &&
                    movie['custom']['imdb_id'] &&
                    parseInt(movie['custom']['imdb_id']) &&
                    parseInt(movie['custom']['imdb_id']) + 400000000) ||
                  (movie['custom'] &&
                    movie['custom']['douban_id'] &&
                    parseInt(movie['custom']['douban_id']) &&
                    parseInt(movie['custom']['douban_id']) + 600000000) ||
                  (movie['custom'] &&
                    movie['custom']['wa_id'] &&
                    parseInt(movie['custom']['wa_id']) &&
                    parseInt(movie['custom']['wa_id']) + 700000000) ||
                  (movie['custom'] &&
                    movie['custom']['tvmaze_id'] &&
                    parseInt(movie['custom']['tvmaze_id']) &&
                    parseInt(movie['custom']['tvmaze_id']) + 800000000) ||
                  (movie['custom'] &&
                    movie['custom']['movie_id'] &&
                    parseInt(movie['custom']['movie_id']) &&
                    parseInt(movie['custom']['movie_id']) + 900000000);
                if (!req_id) {
                  return callback();
                }
                var queries = [];
                if (movie['kp_id'] && parseInt(movie['kp_id'])) {
                  queries.push({ id: parseInt(movie['kp_id']) + '' });
                }
                if (
                  movie['custom'] &&
                  movie['custom']['tmdb_id'] &&
                  parseInt(movie['custom']['tmdb_id'])
                ) {
                  queries.push({
                    type: movie['type'],
                    id: 'custom.tmdb_id',
                    'custom.tmdb_id':
                      movie['custom']['tmdb_id'].replace(/[^0-9]/g, '') + ''
                  });
                }
                if (
                  movie['custom'] &&
                  movie['custom']['imdb_id'] &&
                  parseInt(movie['custom']['imdb_id'])
                ) {
                  queries.push({
                    id: 'custom.imdb_id',
                    'custom.imdb_id':
                      movie['custom']['imdb_id'].replace(/[^0-9]/g, '') + ''
                  });
                }
                if (
                  movie['custom'] &&
                  movie['custom']['douban_id'] &&
                  parseInt(movie['custom']['douban_id'])
                ) {
                  queries.push({
                    id: 'custom.douban_id',
                    'custom.douban_id':
                      movie['custom']['douban_id'].replace(/[^0-9]/g, '') + ''
                  });
                }
                if (
                  movie['custom'] &&
                  movie['custom']['tvmaze_id'] &&
                  parseInt(movie['custom']['tvmaze_id'])
                ) {
                  queries.push({
                    id: 'custom.tvmaze_id',
                    'custom.tvmaze_id':
                      movie['custom']['tvmaze_id'].replace(/[^0-9]/g, '') + ''
                  });
                }
                if (
                  movie['custom'] &&
                  movie['custom']['wa_id'] &&
                  parseInt(movie['custom']['wa_id'])
                ) {
                  queries.push({
                    id: 'custom.wa_id',
                    'custom.wa_id':
                      movie['custom']['wa_id'].replace(/[^0-9]/g, '') + ''
                  });
                }
                if (
                  movie['custom'] &&
                  movie['custom']['movie_id'] &&
                  parseInt(movie['custom']['movie_id'])
                ) {
                  queries.push({
                    id: 'custom.movie_id',
                    'custom.movie_id':
                      movie['custom']['movie_id'].replace(/[^0-9]/g, '') + ''
                  });
                }
                var current_movie = null;
                async.eachOfLimit(
                  queries,
                  1,
                  function(query, query_index, callback) {
                    if (current_movie) {
                      return callback('STOP');
                    }
                    var req = {};
                    req['certainly'] = true;
                    CP_get.movies(
                      Object.assign({}, req, query),
                      1,
                      '',
                      1,
                      false,
                      function(err, rt) {
                        if (err) {
                          console.error(err);
                          return callback('STOP');
                        }
                        if (rt && rt.length) {
                          current_movie = Object.assign({}, rt[0]);
                          return callback('STOP');
                        }
                        return callback();
                      }
                    );
                  },
                  function() {
                    if (current_movie) {
                      delete current_movie['all_movies'];
                      delete movie['all_movies'];
                      var cm = Object.assign({}, current_movie);
                      delete cm['custom'];
                      var commit_movie = JSON.stringify(
                        Object.keys(cm)
                          .sort()
                          .reduce(function(obj, key) {
                            obj[key] = cm[key];
                            return obj;
                          }, {})
                      );
                      var parse_movie = Object.assign({}, movie);
                      var custom_no_change = false;
                      Object.keys(parse_movie).forEach(function(k) {
                        if (!parse_movie[k]) {
                          delete parse_movie[k];
                        }
                      });
                      Object.keys(current_movie).forEach(function(k) {
                        if (!current_movie[k] && parse_movie[k]) {
                          delete current_movie[k];
                        }
                      });
                      if (
                        (current_movie['poster'] === '1' ||
                          current_movie['poster'] === 1 ||
                          current_movie['poster'] === '0' ||
                          current_movie['poster'] === 0) &&
                        parse_movie['poster']
                      ) {
                        delete current_movie['poster'];
                      }
                      if (
                        current_movie['quality'] &&
                        parse_movie['quality'] &&
                        current_movie['quality'] !== parse_movie['quality']
                      ) {
                        delete current_movie['quality'];
                      }
                      if (
                        current_movie['translate'] &&
                        parse_movie['translate'] &&
                        current_movie['translate'] !== parse_movie['translate']
                      ) {
                        delete current_movie['translate'];
                      }
                      var current_movie_custom = {};
                      if (current_movie.custom) {
                        if (
                          current_movie.custom &&
                          typeof current_movie.custom === 'string'
                        ) {
                          current_movie_custom = JSON.parse(
                            current_movie.custom
                          );
                        } else {
                          current_movie_custom = Object.assign(
                            {},
                            current_movie.custom
                          );
                        }
                      }
                      if (current_movie.custom && parse_movie.custom) {
                        var parse_movie_custom = {};
                        if (
                          parse_movie.custom &&
                          typeof parse_movie.custom === 'string'
                        ) {
                          parse_movie_custom = JSON.parse(parse_movie.custom);
                        } else {
                          parse_movie_custom = Object.assign(
                            {},
                            parse_movie.custom
                          );
                        }
                        [1, 2, 3, 4, 5].forEach(function(i) {
                          if (
                            current_movie_custom['player' + i] &&
                            parse_movie_custom['player' + i]
                          ) {
                            delete current_movie_custom['player' + i];
                            if (parse_movie_custom['player' + i] === 'none') {
                              delete parse_movie_custom['player' + i];
                            }
                          }
                        });
                        [
                          'imdb_id',
                          'tmdb_id',
                          'douban_id',
                          'tvmaze_id',
                          'wa_id',
                          'movie_id'
                        ].forEach(function(id) {
                          if (
                            typeof parse_movie_custom[id] !== 'undefined' &&
                            !parse_movie_custom[id]
                          ) {
                            delete parse_movie_custom[id];
                          }
                          if (
                            typeof current_movie_custom[id] !== 'undefined' &&
                            !current_movie_custom[id]
                          ) {
                            delete current_movie_custom[id];
                          }
                        });
                        current_movie.custom = Object.assign(
                          {},
                          parse_movie_custom,
                          current_movie_custom
                        );
                        if (
                          JSON.stringify(
                            Object.keys(current_movie.custom)
                              .sort()
                              .reduce(function(obj, key) {
                                obj[key] = current_movie.custom[key];
                                return obj;
                              }, {})
                          ) ===
                          JSON.stringify(
                            Object.keys(current_movie_custom)
                              .sort()
                              .reduce(function(obj, key) {
                                obj[key] = current_movie_custom[key];
                                return obj;
                              }, {})
                          )
                        ) {
                          custom_no_change = true;
                        }
                      }
                      if (
                        current_movie_custom &&
                        typeof current_movie_custom.unique === 'boolean' &&
                        current_movie_custom.unique === false
                      ) {
                        if (
                          current_movie['title_ru'] &&
                          parse_movie['title_ru'] &&
                          current_movie['title_ru'] !== parse_movie['title_ru']
                        ) {
                          delete current_movie['title_ru'];
                        }
                        if (
                          current_movie['title_en'] &&
                          parse_movie['title_en'] &&
                          current_movie['title_en'] !== parse_movie['title_en']
                        ) {
                          delete current_movie['title_en'];
                        }
                        if (
                          current_movie['description'] &&
                          parse_movie['description'] &&
                          current_movie['description'] !==
                            parse_movie['description']
                        ) {
                          delete current_movie['description'];
                        }
                      }
                      var update_movie = Object.assign(
                        {},
                        parse_movie,
                        current_movie
                      );
                      [
                        'year',
                        'rating',
                        'vote',
                        'kp_rating',
                        'kp_vote',
                        'imdb_rating',
                        'imdb_vote',
                        'premiere'
                      ].forEach(function(attr_uint) {
                        var current =
                          (typeof current_movie[attr_uint] !== 'undefined' &&
                            current_movie[attr_uint] &&
                            parseFloat(current_movie[attr_uint])) ||
                          0;
                        var parse =
                          (typeof parse_movie[attr_uint] !== 'undefined' &&
                            parse_movie[attr_uint] &&
                            parseFloat(parse_movie[attr_uint])) ||
                          0;
                        if (
                          attr_uint === 'rating' ||
                          attr_uint === 'kp_rating' ||
                          attr_uint === 'imdb_rating'
                        ) {
                          if (parse && parse > 100) {
                            parse = 0;
                          }
                          if (!parse) {
                            return;
                          }
                          if (parse < 10) {
                            parse = parseInt(parse * 10 + '');
                          }
                          update_movie[attr_uint] = parse;
                          return;
                        }
                        if (
                          attr_uint === 'year' ||
                          attr_uint === 'premiere' ||
                          attr_uint === 'vote' ||
                          attr_uint === 'kp_vote' ||
                          attr_uint === 'imdb_vote'
                        ) {
                          parse = parseInt(parse + '');
                        }
                        if (parse > current) {
                          update_movie[attr_uint] = parseInt(parse);
                        }
                        if (
                          attr_uint === 'year' &&
                          typeof update_movie['year'] !== 'undefined'
                        ) {
                          update_movie['year'] = update_movie['year'] + '';
                        }
                      });
                      ['country', 'director', 'genre', 'actor'].forEach(
                        function(attr_string) {
                          var parse =
                            (typeof parse_movie[attr_string] !== 'undefined' &&
                              parse_movie[attr_string]) ||
                            '';
                          var current =
                            (typeof current_movie[attr_string] !==
                              'undefined' &&
                              current_movie[attr_string]) ||
                            '';
                          if (parse.length > current.length) {
                            update_movie[attr_string] =
                              parse_movie[attr_string];
                          }
                        }
                      );
                      var cm2 = Object.assign({}, update_movie);
                      delete cm2['custom'];
                      var commit_movie2 = JSON.stringify(
                        Object.keys(cm2)
                          .sort()
                          .reduce(function(obj, key) {
                            obj[key] = cm2[key];
                            return obj;
                          }, {})
                      );
                      if (custom_no_change && commit_movie === commit_movie2) {
                        console.log(
                          '[REALTIME]',
                          id_index + 1,
                          '/',
                          ids.length,
                          ')',
                          'NO UPDATE',
                          current_movie.id
                        );
                        return callback();
                      }
                      console.log(
                        '[REALTIME]',
                        id_index + 1,
                        '/',
                        ids.length,
                        ')',
                        'UPDATE MOVIE',
                        current_movie.id
                      );
                      console.log(update_movie);
                      CP_save.save(update_movie, 'rt', function(err, result) {
                        update_m++;
                        console.log(err, result);
                        return callback(err);
                      });
                    } else {
                      if (!movie['title_ru'] && !movie['title_en']) {
                        console.log(
                          '[REALTIME]',
                          id_index + 1,
                          '/',
                          ids.length,
                          ')',
                          'NO SAVE',
                          req_id
                        );
                        return callback();
                      }
                      console.log(
                        '[REALTIME]',
                        id_index + 1,
                        '/',
                        ids.length,
                        ')',
                        'SAVE MOVIE',
                        req_id
                      );
                      console.log(movie);
                      CP_save.save(movie, 'rt', function(err, result) {
                        added_m++;
                        if (err) {
                          console.log(err);
                        }
                        return callback(err);
                      });
                    }
                  }
                );
              }
            },
            function() {
              console.log('[REALTIME]', 'ADDED:', added_m);
              console.log('[REALTIME]', 'UPDATE:', update_m);
              return callback();
            }
          );
        }
      );
    },
    function() {
      process.env['NO_CACHE'] = undefined;
      console.log('[REALTIME]', 'DONE');
      return process.exit();
    }
  );
})();

/**
 * Valid JSON.
 *
 */

function tryParseJSON(jsonString) {
  try {
    if (jsonString && typeof jsonString === 'string') {
      if (jsonString.indexOf('<?xml') + 1) {
        var result = convert.xml2js(jsonString, { compact: true });
        if (result && typeof result === 'object') {
          return result;
        }
      }
      var o = JSON.parse(jsonString);
      if (o && typeof o === 'object') {
        return o;
      }
    } else {
      if (jsonString && typeof jsonString === 'object') {
        return jsonString;
      }
    }
  } catch (e) {}
  return null;
}
