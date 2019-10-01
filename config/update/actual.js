'use strict';

/**
 * Node dependencies.
 */

var path = require('path');
var fs = require('fs');

/**
 * Global env.
 */

try {
  var p = tryParseJSON(
    fs.readFileSync(
      path.join(path.dirname(__filename), '..', '..', 'process.json'),
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

(function upd(i) {
  i = i || 1;
  var ii = i + 1;

  if (i >= 1500) {
    return process.exit();
  }

  CP_get.movies(
    { from: process.env.CP_RT, certainly: true, full: true },
    2000,
    '',
    i,
    false,
    function(err, movies) {
      if (err) return console.error(err);

      if (movies && movies.length) {
        async.eachOfLimit(
          movies,
          1,
          function(movie, key, callback) {
            delete movie.year;
            delete movie.actor;
            delete movie.genre;
            delete movie.country;
            delete movie.director;
            delete movie.premiere;
            delete movie.kp_rating;
            delete movie.kp_vote;
            delete movie.imdb_rating;
            delete movie.imdb_vote;
            movie.id = movie.kp_id;
            CP_save.save(movie, 'rt', function(err, result) {
              console.log(result);
              return callback(err);
            });
          },
          function(err) {
            console.error(err);
            upd(ii);
          }
        );
      } else {
        upd(ii);
      }
    }
  );
})();
