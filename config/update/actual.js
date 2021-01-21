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

var indexed = 0;

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
                    CP_get.movies(
                      {
                        query_id: movie.query_id,
                        from: process.env.CP_XMLPIPE2
                      },
                      1,
                      '',
                      1,
                      false,
                      function(err, ms) {
                        if (err) {
                          console.error(err);
                          return callback();
                        }
                        if (ms && ms.length) {
                          var m = ms[0];
                          if (
                            typeof movie.description === 'string' &&
                            movie.description === '' &&
                            typeof m.description === 'string' &&
                            m.description !== ''
                          ) {
                            delete movie.description;
                          }
                          if (m.year) {
                            delete movie.year;
                          }
                          if (m.actor) {
                            delete movie.actor;
                          }
                          if (m.genre) {
                            delete movie.genre;
                          }
                          if (m.country) {
                            delete movie.country;
                          }
                          if (m.director) {
                            delete movie.director;
                          }
                          if (m.premiere) {
                            delete movie.premiere;
                          }
                          if (m.kp_rating) {
                            delete movie.kp_rating;
                          }
                          if (m.kp_vote) {
                            delete movie.kp_vote;
                          }
                          if (m.imdb_rating) {
                            delete movie.imdb_rating;
                          }
                          if (m.imdb_vote) {
                            delete movie.imdb_vote;
                          }
                          if (m.all_movies) {
                            delete movie.all_movies;
                          }
                          var old = movie.all_movies;
                          movie.id = movie.kp_id;
                          if (
                            !movie.description ||
                            movie.description === m.description
                          ) {
                            var custom = movie.custom
                              ? JSON.parse(movie.custom)
                              : {};
                            //custom.unique = false;
                            //movie.custom = JSON.stringify(custom);
                          }
                          if (
                            /("unique":true|"unique":"true")/i.test(
                              movie.custom
                            )
                          ) {
                            indexed++;
                          }
                          CP_save.save(movie, 'rt', function(err, result) {
                            if (old && old !== domain) {
                              console.log(
                                result,
                                old.replace(/(^_|_$)/gi, '') +
                                  ' -> ' +
                                  domain.replace(/(^_|_$)/gi, '')
                              );
                            } else {
                              console.log(result);
                            }
                            return callback(err);
                          });
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
          console.log('INDEXED: ', indexed);
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
                    CP_save.save(content, 'content', function(err, result) {
                      if (old && old !== domain) {
                        console.log(
                          result,
                          old.replace(/(^_|_$)/gi, '') +
                            ' -> ' +
                            domain.replace(/(^_|_$)/gi, '')
                        );
                      } else {
                        console.log(result);
                      }
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
                    CP_save.save(comment, 'comment', function(err, result) {
                      if (old && old !== domain) {
                        console.log(
                          result,
                          old.replace(/(^_|_$)/gi, '') +
                            ' -> ' +
                            domain.replace(/(^_|_$)/gi, '')
                        );
                      } else {
                        console.log(result);
                      }
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
