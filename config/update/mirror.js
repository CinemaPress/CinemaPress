'use strict';

/**
 * Node dependencies.
 */

var path = require('path');
var fs = require('fs');

/**
 * Global env.
 */

process.env['NO_CACHE'] = true;
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

async.series(
  [
    function(callback) {
      var i = 1;
      async.forever(
        function(next) {
          CP_get.movies(
            { from: process.env.CP_RT, certainly: true, full: true },
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
                    var old = movie.all_movies;
                    delete movie.all_movies;
                    if (old && old === domain) {
                      return callback();
                    }
                    CP_save.save(movie, 'rt', function(err, result) {
                      console.log(
                        result && result.trim()
                          ? result.trim()
                          : movie.id
                          ? movie.id
                          : '',
                        old.replace(/(^_|_$)/gi, '') +
                          ' -> ' +
                          domain.replace(/(^_|_$)/gi, '')
                      );
                      return callback(err);
                    });
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
          return callback();
        }
      );
    },
    function(callback) {
      var i = 1;
      async.forever(
        function(next) {
          CP_get.contents(
            { from: process.env.CP_RT, certainly: true },
            500,
            i,
            false,
            function(err, contents) {
              i++;
              if (err) {
                console.error(err);
                return next('STOP');
              }
              if (contents && contents.length) {
                async.eachOfLimit(
                  contents,
                  1,
                  function(content, key, callback) {
                    var old = content.all_contents;
                    delete content.all_contents;
                    if (old && old === domain) {
                      return callback();
                    }
                    CP_save.save(content, 'content', function(err, result) {
                      console.log(
                        result && result.trim()
                          ? result.trim()
                          : content.id
                          ? content.id
                          : '',
                        old.replace(/(^_|_$)/gi, '') +
                          ' -> ' +
                          domain.replace(/(^_|_$)/gi, '')
                      );
                      return callback(err);
                    });
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
          return callback();
        }
      );
    },
    function(callback) {
      var i = 1;
      async.forever(
        function(next) {
          CP_get.comments(
            { from: process.env.CP_RT, certainly: true },
            500,
            '',
            i,
            function(err, comments) {
              i++;
              if (err) {
                console.error(err);
                return next('STOP');
              }
              if (comments && comments.length) {
                async.eachOfLimit(
                  comments,
                  1,
                  function(comment, key, callback) {
                    var old = comment.all_comments;
                    delete comment.all_comments;
                    if (old && old === domain) {
                      return callback();
                    }
                    CP_save.save(comment, 'comment', function(err, result) {
                      console.log(
                        result && result.trim()
                          ? result.trim()
                          : comment.id
                          ? comment.id
                          : '',
                        old.replace(/(^_|_$)/gi, '') +
                          ' -> ' +
                          domain.replace(/(^_|_$)/gi, '')
                      );
                      return callback(err);
                    });
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
          return callback();
        }
      );
    }
  ],
  function() {
    return process.exit();
  }
);
