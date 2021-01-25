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
var fail_req = 2;
var prev_req = 0;
var some_req = 0;

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
      path: parse[2],
      id: parse[3],
      info: parse.slice(4)
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
      var i = 0;
      var ids = [];
      async.forever(
        function(next) {
          i++;
          if (task.page.indexOf('[page]') === -1 && i > 1) {
            return next('STOP');
          }
          if (fail_req <= 0) {
            return next('STOP');
          }
          if (some_req >= 5) {
            return next('STOP');
          }
          if (prev_req === ids.length) {
            some_req++;
          } else {
            prev_req = 0;
          }
          prev_req = ids.length;
          console.log('[REALTIME]', ids.length, task.page.replace('[page]', i));
          axios(task.page.replace('[page]', i))
            .then(function(r) {
              if (!r || !r.data) {
                return next('STOP');
              }
              var all = adop(tryParseJSON(r.data), [
                {
                  name: 'id',
                  path: task.path
                }
              ]);
              if (all && all.length) {
                all.forEach(function(a) {
                  if (
                    a &&
                    a.id &&
                    a.id !== 'null' &&
                    a.id !== 'false' &&
                    a.id !== 'n/a' &&
                    a.id !== 'N/A' &&
                    ids.indexOf(a.id) === -1
                  ) {
                    ids.push(a.id);
                  }
                });
                return next();
              } else {
                console.error('[REALTIME]', 'STOP PAGE (' + fail_req + ')', i);
                fail_req = fail_req - 1;
                return next();
              }
            })
            .catch(function(err) {
              console.error(
                '[REALTIME]',
                'STOP PAGE (' + fail_req + ')',
                i,
                err
              );
              fail_req = fail_req - 1;
              return next();
            });
        },
        function() {
          async.eachOfLimit(
            ids,
            5,
            function(id, id_index, callback) {
              if (!/\[[a-z0-9_]+?]/i.test(task.id + '') && id_index >= 1) {
                return callback();
              }
              axios((task.id + '').replace(/\[[a-z0-9_]+?]/i, id))
                .then(function(j) {
                  if (!j || !j.data) {
                    return callback();
                  }
                  var json = tryParseJSON(j.data);
                  if (!json || typeof json !== 'object') {
                    return callback();
                  }
                  var movie = {};
                  task.info.forEach(function(info) {
                    var parse = info
                      .replace(/(^\s*)|(\s*)$/g, '')
                      .replace(/\s*<>\s*/g, '<>')
                      .split('<>');
                    var sup_parse = parse[3]
                      ? parse[3]
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
                          '_VALUE_',
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
                      if (joinItem) {
                        set_data = listItem
                          .map(function(item) {
                            var set_info = false;
                            if (sup_parse[0] && sup_parse[1]) {
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
                  } else {
                    movie['custom'] = { unique: false };
                  }
                  if (movie['genre']) {
                    movie['genre'] = movie['genre'].toLowerCase();
                  }
                  if (!movie['poster']) {
                    movie['poster'] = '1';
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
                    movie['kp_vote'] = ('' + movie['kp_vote']).replace(
                      /,/g,
                      ''
                    );
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
                    var year = new Date(movie['premiere']).getFullYear();
                    if (!movie['year']) {
                      movie['year'] = !isNaN(year) ? year : 0;
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
                    (movie['type'].toLowerCase().indexOf('tv') + 1 ||
                      movie['type'].toLowerCase().indexOf('show') + 1 ||
                      movie['type'].toLowerCase().indexOf('ser') + 1 ||
                      movie['type'].toLowerCase().indexOf('scripted') + 1)
                  ) {
                    movie['type'] = 1;
                  } else {
                    movie['type'] = 0;
                  }
                  var req_id =
                    movie['id'] ||
                    movie['kp_id'] ||
                    (movie['custom'] &&
                      movie['custom']['tmdb_id'] &&
                      parseInt(movie['custom']['tmdb_id']) &&
                      parseInt(movie['custom']['tmdb_id']) + 100000000) ||
                    (movie['custom'] &&
                      movie['custom']['imdb_id'] &&
                      parseInt(movie['custom']['imdb_id']) &&
                      parseInt(movie['custom']['imdb_id']) + 100000000);
                  var req_title = movie['title_ru'] || movie['title_en'];
                  if (!req_id || !req_title) {
                    return callback();
                  }
                  movie['id'] = req_id;
                  CP_get.movies(
                    {
                      id: movie['id'],
                      from: process.env.CP_RT,
                      certainly: true
                    },
                    1,
                    '',
                    1,
                    false,
                    function(err, rt) {
                      if (err) {
                        console.error(err);
                        return callback();
                      }
                      if (rt && rt.length) {
                        var current_movie = Object.assign({}, rt[0]);
                        var parse_movie = Object.assign({}, movie);
                        Object.keys(current_movie).forEach(function(k) {
                          if (!current_movie[k] && parse_movie[k]) {
                            delete current_movie[k];
                          }
                        });
                        if (
                          current_movie['poster'] === '1' &&
                          current_movie['poster'] === 1
                        ) {
                          delete current_movie['poster'];
                        }
                        if (current_movie.custom && parse_movie.custom) {
                          if (
                            current_movie.custom &&
                            typeof current_movie.custom === 'string'
                          ) {
                            current_movie.custom = JSON.parse(
                              current_movie.custom
                            );
                          }
                          if (
                            parse_movie.custom &&
                            typeof parse_movie.custom === 'string'
                          ) {
                            parse_movie.custom = JSON.parse(parse_movie.custom);
                          }
                          current_movie.custom = Object.assign(
                            {},
                            parse_movie.custom,
                            current_movie.custom
                          );
                        }
                        var update_movie = Object.assign(
                          {},
                          parse_movie,
                          current_movie
                        );
                        [
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
                            (attr_uint === 'rating' ||
                              attr_uint === 'kp_rating' ||
                              attr_uint === 'imdb_rating') &&
                            parse < 10
                          ) {
                            parse = parseInt(parse * 10 + '');
                          }
                          if (
                            attr_uint === 'vote' ||
                            attr_uint === 'kp_vote' ||
                            attr_uint === 'imdb_vote'
                          ) {
                            parse = parseInt(parse + '');
                          }
                          if (parse > current) {
                            update_movie[attr_uint] = parse_movie[attr_uint];
                          }
                        });
                        ['country', 'director', 'genre', 'actor'].forEach(
                          function(attr_string) {
                            var parse =
                              (typeof parse_movie[attr_string] !==
                                'undefined' &&
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
                        console.log(
                          '[REALTIME]',
                          id_index,
                          '/',
                          ids.length,
                          ')',
                          'UPDATE MOVIE',
                          movie['id']
                        );
                        console.log(update_movie);
                        CP_save.save(update_movie, 'rt', function(err, result) {
                          update_m++;
                          console.log(err, result);
                          return callback(err);
                        });
                      } else {
                        console.log(
                          '[REALTIME]',
                          id_index,
                          '/',
                          ids.length,
                          ')',
                          'SAVE REALTIME MOVIE'
                        );
                        console.log(movie);
                        CP_save.save(movie, 'rt', function(err, result) {
                          added_m++;
                          console.log(err, result);
                          return callback(err);
                        });
                      }
                    }
                  );
                })
                .catch(function(err) {
                  console.error('[REALTIME]', 'STOP PAGE', i, err);
                  console.log('[REALTIME]', 'ADDED', added_m);
                  console.log('[REALTIME]', 'UPDATE', update_m);
                  return callback();
                });
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
        var result = convert.xml2json(jsonString, { compact: true });
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
