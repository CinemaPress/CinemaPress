'use strict';

/**
 * Node dependencies.
 */

var async = require('async');
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

/**
 * Check files.
 */

try {
  var data = tryParseJSON(
    fs.readFileSync(path.join(__dirname, 'default.json'), 'utf8')
  );
} catch (err) {
  console.log('NOT FILE DEFAULT DATA');
  process.exit();
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

var run = 0;

if (data.movies && data.movies.length) {
  var m = 0;
  async.eachOfLimit(
    data.movies,
    1,
    function(movie, key, callback) {
      movie.id = movie.kp_id;
      movie.duplicate = true;
      CP_save.save(movie, 'rt', function(err, result) {
        if (err) console.error(err, result, movie);
        if (result) {
          m = m + 1;
          console.log(result, m);
        }
        return callback();
      });
    },
    function(err) {
      console.log('');
      console.log(err || m + ' movies added.');
      console.log('');
      run++;
    }
  );
}

if (data.contents && data.contents.length) {
  var c = 0;
  async.eachOfLimit(
    data.contents,
    1,
    function(content, key, callback) {
      CP_save.save(content, 'content', function(err, result) {
        if (err) console.error(err, result, content);
        if (result) {
          c = c + 1;
          console.log(result, c);
        }
        return callback();
      });
    },
    function(err) {
      console.log('');
      console.log(err || m + ' contents added.');
      console.log('');
      run++;
    }
  );
}

if (run === 2) {
  process.exit();
}
