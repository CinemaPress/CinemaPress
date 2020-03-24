'use strict';

/**
 * Node dependencies.
 */

var path = require('path');
var fs = require('fs');

/**
 * Global env.
 */

var save = process.argv && typeof process.argv[2] !== 'undefined';
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

/**
 * Module dependencies.
 */

var CP_save = require(path.join(
  path.dirname(__filename),
  '..',
  '..',
  'lib',
  'CP_save.min.js'
));
var CP_get = require(path.join(
  path.dirname(__filename),
  '..',
  '..',
  'lib',
  'CP_get.min.js'
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

var not_available = 0;

async.series(
  [
    function(callback) {
      var i = 1;
      async.forever(
        function(next) {
          CP_get.movies(
            { from: process.env.CP_RT, ids: true },
            500,
            '',
            i,
            false,
            function(err, movies) {
              i++;
              if (err) {
                console.error(err);
                return next('STOP');
              }
              if (movies && movies.length) {
                async.eachOfLimit(
                  movies,
                  1,
                  function(movie, key, callback) {
                    CP_get.movies(
                      { query_id: movie.query_id },
                      1,
                      '',
                      1,
                      false,
                      function(err, ms) {
                        if (err) {
                          console.error(err);
                          return callback();
                        }
                        if (!ms || !ms.length) {
                          if (save) {
                            CP_save.save(movie, 'rt', function(err) {
                              console.log('SAVED:', movie.query_id);
                              return callback(err);
                            });
                          } else {
                            console.log('NOT AVAILABLE:', movie.query_id);
                            not_available++;
                            return callback();
                          }
                        } else {
                          return callback();
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
          if (not_available) {
            console.log('NOT AVAILABLE', not_available, 'MOVIES');
          } else {
            console.log('ALL MOVIES AVAILABLE');
          }
          return callback();
        }
      );
    }
  ],
  function() {
    return process.exit();
  }
);
