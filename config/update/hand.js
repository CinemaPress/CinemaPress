'use strict';

/**
 * Node dependencies.
 */

var path = require('path');
var fs = require('fs');

/**
 * Global env.
 */

var domain = '';

try {
  var p = tryParseJSON(
    fs.readFileSync(
      path.join(path.dirname(__filename), '..', '..', 'process.json'),
      'utf8'
    )
  );
  var e = p.apps[0].env;
  if (e && e['CP_RT']) {
    domain = '_' + e['CP_RT'].replace('rt_', '') + '_';
  }
  for (var prop in e) {
    if (e.hasOwnProperty(prop)) {
      process.env[prop] = e[prop];
    }
  }
} catch (err) {
  console.log('NOT FILE PROCESS DATA');
  process.exit();
}

process.env['NO_CACHE'] = true;

/**
 * Module dependencies.
 */

var CP_save = require(path.join(
  path.dirname(__filename),
  '..',
  '..',
  'lib',
  'CP_save.js'
));
var CP_get = require(path.join(
  path.dirname(__filename),
  '..',
  '..',
  'lib',
  'CP_get.js'
));

/**
 * Node dependencies.
 */

var async = require('async');

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

var new_m = 0;
var update_m = 0;

async.series(
  [
    function(callback) {
      var i = 1;
      async.forever(
        function(next) {
          CP_get.movies(
            { from: process.env.CP_XMLPIPE2, certainly: true, full: true },
            500,
            '',
            i,
            false,
            function(err, xmlpipe2) {
              i++;
              if (err) {
                console.error(err);
                return next('STOP');
              }
              if (xmlpipe2 && xmlpipe2.length) {
                async.eachOfLimit(
                  xmlpipe2,
                  1,
                  function(xmlpipe2_movie, key, callback) {
                    CP_get.movies(
                      {
                        id: xmlpipe2_movie.query_id,
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
                          var rt_movie = rt[0];
                          var update_movie = Object.assign({}, rt_movie);
                          if (
                            update_movie['title_ru'] === '' &&
                            xmlpipe2_movie['title_ru'] !== ''
                          ) {
                            update_movie['title_ru'] =
                              xmlpipe2_movie['title_ru'];
                          }
                          if (
                            update_movie['title_en'] === '' &&
                            xmlpipe2_movie['title_en'] !== ''
                          ) {
                            update_movie['title_en'] =
                              xmlpipe2_movie['title_en'];
                          }
                          update_movie['search'] = [
                            update_movie['title_ru'],
                            update_movie['title_en']
                          ].join(' / ');
                          if (
                            update_movie['description'] === '' &&
                            xmlpipe2_movie['description'] !== ''
                          ) {
                            update_movie['description'] =
                              xmlpipe2_movie['description'];
                          }
                          [
                            'rating',
                            'vote',
                            'kp_rating',
                            'kp_vote',
                            'imdb_rating',
                            'imdb_vote',
                            'premiere'
                          ].forEach(function(attr_uint) {
                            var auto =
                              (typeof xmlpipe2_movie[attr_uint] !==
                                'undefined' &&
                                xmlpipe2_movie[attr_uint] &&
                                parseFloat(xmlpipe2_movie[attr_uint])) ||
                              0;
                            var hand =
                              (typeof rt_movie[attr_uint] !== 'undefined' &&
                                rt_movie[attr_uint] &&
                                parseFloat(rt_movie[attr_uint])) ||
                              0;
                            if (auto > hand) {
                              update_movie[attr_uint] =
                                xmlpipe2_movie[attr_uint];
                            }
                          });
                          [
                            'country',
                            'director',
                            'genre',
                            'actor',
                            'pictures'
                          ].forEach(function(attr_string) {
                            var auto =
                              (typeof xmlpipe2_movie[attr_string] !==
                                'undefined' &&
                                xmlpipe2_movie[attr_string]) ||
                              '';
                            var hand =
                              (typeof rt_movie[attr_string] !== 'undefined' &&
                                rt_movie[attr_string]) ||
                              '';
                            if (auto.length > hand.length) {
                              update_movie[attr_string] =
                                xmlpipe2_movie[attr_string];
                            }
                          });
                          CP_save.save(update_movie, 'rt', function(
                            err,
                            result
                          ) {
                            update_m++;
                            console.log(err, result);
                            return callback(err);
                          });
                        } else {
                          xmlpipe2_movie['custom'] = '{"unique":false}';
                          CP_save.save(xmlpipe2_movie, 'rt', function(
                            err,
                            result
                          ) {
                            new_m++;
                            console.log(err, result);
                            return callback(err);
                          });
                        }
                      }
                    );
                  },
                  function(err) {
                    if (err) console.error(err);
                    return next();
                  }
                );
              } else {
                return next('STOP');
              }
            }
          );
        },
        function() {
          console.log('NEW MOVIES:', new_m);
          console.log('UPDATE MOVIES:', update_m);
          return callback();
        }
      );
    }
  ],
  function() {
    process.env['NO_CACHE'] = undefined;
    return process.exit();
  }
);
