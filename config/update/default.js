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

var arg = process && process.argv && process.argv[2] ? process.argv[2] : '';

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
  'CP_save.js'
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

process.env['NO_CACHE'] = true;

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

if ((!arg || arg === 'movies') && data['movies'] && data['movies'].length) {
  var m = 0;
  async.eachOfLimit(
    data['movies'],
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

if (
  (!arg || arg === 'contents') &&
  data['contents'] &&
  data['contents'].length
) {
  var c = 0;
  async.eachOfLimit(
    data['contents'],
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
      console.log(err || c + ' contents added.');
      console.log('');
      run++;
    }
  );
}

if (
  (!arg || arg === 'comments') &&
  data['comments'] &&
  data['comments'].length
) {
  var cm = 0;
  async.eachOfLimit(
    data['comments'],
    1,
    function(comment, key, callback) {
      CP_save.save(comment, 'comment', function(err, result) {
        if (err) console.error(err, result, comment);
        if (result) {
          cm = cm + 1;
          console.log(result, cm);
        }
        return callback();
      });
    },
    function(err) {
      console.log('');
      console.log(err || cm + ' comments added.');
      console.log('');
      run++;
    }
  );
}

var ii = 1;
setInterval(function() {
  if (run === 2 || ii >= 10) {
    process.env['NO_CACHE'] = undefined;
    process.exit();
  }
  ii++;
}, 1000);
