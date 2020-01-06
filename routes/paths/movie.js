'use strict';

/**
 * Module dependencies.
 */

var CP_page = require('../../lib/CP_page');
var CP_get = require('../../lib/CP_get.min');
var CP_decode = require('../../lib/CP_decode');

var CP_comments = require('../../modules/CP_comments');

/**
 * Configuration dependencies.
 */

var config = require('../../config/production/config');
var modules = require('../../config/production/modules');

/**
 * Node dependencies.
 */

var async = require('async');

/**
 * Callback.
 *
 * @callback Callback
 * @param {Object} err
 * @param {Object} [render]
 */

/**
 * Getting the data to render movie page.
 *
 * @param {Number} id
 * @param {String} type
 * @param {Object} [options]
 * @param {Callback} callback
 */

function dataMovie(id, type, options, callback) {
  if (arguments.length === 3) {
    callback = options;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var related = {};

  async.series(
    {
      movie: function(callback) {
        return CP_get.movies(
          { query_id: id },
          config.default.count,
          'kinopoisk-vote-up',
          1,
          true,
          options,
          function(err, movies) {
            if (options.debug) {
              options.debug.detail.push({
                type: 'movie',
                duration: new Date() - options.debug.duration.current + 'ms'
              });
              options.debug.duration.current = new Date();
            }
            if (err) return callback(err);

            if (movies && movies.length) {
              related = movies[0];
              callback(null, movies[0]);
            } else {
              callback(config.l.notFound);
            }
          }
        );
      },
      slider: function(callback) {
        return modules.slider.status
          ? modules.slider.data.url && modules.slider.data.count
            ? CP_get.contents(
                { content_url: modules.slider.data.url },
                function(err, contents) {
                  if (err) return callback(err);

                  return contents && contents.length && contents[0].movies
                    ? CP_get.additional(
                        {
                          query_id: contents[0].movies.slice(
                            0,
                            modules.slider.data.count
                          )
                        },
                        'ids',
                        options,
                        function(err, movies) {
                          if (options.debug) {
                            options.debug.detail.push({
                              type: 'slider',
                              duration:
                                new Date() -
                                options.debug.duration.current +
                                'ms'
                            });
                            options.debug.duration.current = new Date();
                          }
                          if (err) return callback(err);

                          return movies && movies.length
                            ? callback(null, movies)
                            : callback(null, []);
                        }
                      )
                    : callback(null, []);
                }
              )
            : CP_get.additional(
                { query_id: modules.slider.data.movies },
                'ids',
                options,
                function(err, movies) {
                  if (options.debug) {
                    options.debug.detail.push({
                      type: 'slider',
                      duration:
                        new Date() - options.debug.duration.current + 'ms'
                    });
                    options.debug.duration.current = new Date();
                  }
                  if (err) return callback(err);

                  return movies && movies.length
                    ? callback(null, movies)
                    : callback(null, []);
                }
              )
          : callback(null, []);
      },
      soon: function(callback) {
        return modules.soon.status
          ? CP_get.additional(
              { all_movies: process.env.CP_ALL },
              'soon',
              options,
              function(err, movies) {
                if (options.debug) {
                  options.debug.detail.push({
                    type: 'soon',
                    duration: new Date() - options.debug.duration.current + 'ms'
                  });
                  options.debug.duration.current = new Date();
                }
                if (err) return callback(err);

                return movies && movies.length
                  ? callback(null, movies)
                  : callback(null, []);
              }
            )
          : callback(null, []);
      },
      news: function(callback) {
        return modules.content.status &&
          modules.content.data.news.tags &&
          modules.content.data.news.count
          ? CP_get.contents(
              { content_tags: modules.content.data.news.tags },
              modules.content.data.news.count,
              1,
              true,
              options,
              function(err, contents) {
                if (options.debug) {
                  options.debug.detail.push({
                    type: 'news',
                    duration: new Date() - options.debug.duration.current + 'ms'
                  });
                  options.debug.duration.current = new Date();
                }
                if (err) return callback(err);

                return contents && contents.length
                  ? callback(null, contents)
                  : callback(null, []);
              }
            )
          : callback(null, []);
      },
      contents: function(callback) {
        return modules.content.status && modules.content.data.movie.count
          ? CP_get.contents(
              {
                content_movies: id,
                content_tags: modules.content.data.movie.tags,
                condition: 'OR'
              },
              modules.content.data.movie.count,
              1,
              true,
              options,
              function(err, contents) {
                if (options.debug) {
                  options.debug.detail.push({
                    type: 'contents',
                    duration: new Date() - options.debug.duration.current + 'ms'
                  });
                  options.debug.duration.current = new Date();
                }
                if (err) return callback(err);

                return contents && contents.length
                  ? callback(null, contents)
                  : callback(null, []);
              }
            )
          : callback(null, []);
      },
      recent: function(callback) {
        var service = [];
        if (
          modules.comments.data.disqus.shortname &&
          modules.comments.data.disqus.recent.num_items &&
          modules.comments.data.disqus.recent.display.indexOf('movie') + 1
        ) {
          service.push('disqus');
        }
        if (
          modules.comments.data.hypercomments.widget_id &&
          modules.comments.data.hypercomments.recent.num_items &&
          modules.comments.data.hypercomments.recent.display.indexOf('movie') +
            1
        ) {
          service.push('hypercomments');
        }
        if (
          modules.comments.status &&
          modules.comments.data.fast.active &&
          modules.comments.data.fast.recent.display.indexOf('movie') + 1
        ) {
          service.push('fast');
        }
        return service.length
          ? CP_comments.recent(service, options, function(err, comments) {
              if (options.debug) {
                options.debug.detail.push({
                  type: 'recent',
                  duration: new Date() - options.debug.duration.current + 'ms'
                });
                options.debug.duration.current = new Date();
              }
              if (err) return callback(err);

              return comments ? callback(null, comments) : callback(null, []);
            })
          : callback(null, []);
      },
      indexer: function(callback) {
        return modules.comments.data.disqus.api_key ||
          modules.comments.data.hypercomments.sekretkey
          ? CP_comments.indexer(related.url, related.pathname, function(
              err,
              comments
            ) {
              if (options.debug) {
                options.debug.detail.push({
                  type: 'indexer',
                  duration: new Date() - options.debug.duration.current + 'ms'
                });
                options.debug.duration.current = new Date();
              }
              if (err) return callback(err);

              return comments ? callback(null, comments) : callback(null, '');
            })
          : callback(null, '');
      },
      movies: function(callback) {
        options.random_movies = [];
        return related.id && modules.related.status
          ? async.parallel(
              {
                countries: function(callback) {
                  return related.countries_arr.length &&
                    modules.related.data.display.indexOf('countries') + 1
                    ? CP_get.additional(
                        { country: related.countries_arr, type: related.type },
                        'related',
                        options,
                        function(err, movies) {
                          if (err) return callback(err);

                          return movies && movies.length
                            ? callback(null, movies)
                            : callback(null, []);
                        }
                      )
                    : callback(null, []);
                },
                genres: function(callback) {
                  return related.genres_arr.length &&
                    modules.related.data.display.indexOf('genres') + 1
                    ? CP_get.additional(
                        { genre: related.genres_arr, type: related.type },
                        'related',
                        options,
                        function(err, movies) {
                          if (err) return callback(err);

                          return movies && movies.length
                            ? callback(null, movies)
                            : callback(null, []);
                        }
                      )
                    : callback(null, []);
                },
                directors: function(callback) {
                  return related.directors_arr.length &&
                    modules.related.data.display.indexOf('directors') + 1
                    ? CP_get.additional(
                        { director: related.directors_arr, type: related.type },
                        'related',
                        options,
                        function(err, movies) {
                          if (err) return callback(err);

                          return movies && movies.length
                            ? callback(null, movies)
                            : callback(null, []);
                        }
                      )
                    : callback(null, []);
                },
                actors: function(callback) {
                  return related.actors_arr.length &&
                    modules.related.data.display.indexOf('actors') + 1
                    ? CP_get.additional(
                        { actor: related.actors_arr, type: related.type },
                        'related',
                        options,
                        function(err, movies) {
                          if (err) return callback(err);

                          return movies && movies.length
                            ? callback(null, movies)
                            : callback(null, []);
                        }
                      )
                    : callback(null, []);
                },
                country: function(callback) {
                  return related.country &&
                    modules.related.data.display.indexOf('country') + 1
                    ? CP_get.additional(
                        { country: related.country, type: related.type },
                        'related',
                        options,
                        function(err, movies) {
                          if (err) return callback(err);

                          return movies && movies.length
                            ? callback(null, movies)
                            : callback(null, []);
                        }
                      )
                    : callback(null, []);
                },
                genre: function(callback) {
                  return related.genre &&
                    modules.related.data.display.indexOf('genre') + 1
                    ? CP_get.additional(
                        { genre: related.genre, type: related.type },
                        'related',
                        options,
                        function(err, movies) {
                          if (err) return callback(err);

                          return movies && movies.length
                            ? callback(null, movies)
                            : callback(null, []);
                        }
                      )
                    : callback(null, []);
                },
                director: function(callback) {
                  return related.director &&
                    modules.related.data.display.indexOf('director') + 1
                    ? CP_get.additional(
                        { director: related.director, type: related.type },
                        'related',
                        options,
                        function(err, movies) {
                          if (err) return callback(err);

                          return movies && movies.length
                            ? callback(null, movies)
                            : callback(null, []);
                        }
                      )
                    : callback(null, []);
                },
                actor: function(callback) {
                  return related.actor &&
                    modules.related.data.display.indexOf('actor') + 1
                    ? CP_get.additional(
                        { actor: related.actor, type: related.type },
                        'related',
                        options,
                        function(err, movies) {
                          if (err) return callback(err);

                          return movies && movies.length
                            ? callback(null, movies)
                            : callback(null, []);
                        }
                      )
                    : callback(null, []);
                },
                year: function(callback) {
                  return related.year &&
                    modules.related.data.display.indexOf('year') + 1
                    ? CP_get.additional(
                        { year: related.year, type: related.type },
                        'related',
                        options,
                        function(err, movies) {
                          if (err) return callback(err);

                          return movies && movies.length
                            ? callback(null, movies)
                            : callback(null, []);
                        }
                      )
                    : callback(null, []);
                }
              },
              function(err, result) {
                if (options.debug) {
                  options.debug.detail.push({
                    type: 'related',
                    duration: new Date() - options.debug.duration.current + 'ms'
                  });
                  options.debug.duration.current = new Date();
                }

                if (
                  !err &&
                  result &&
                  modules.comments.data.fast.active &&
                  (modules.comments.data.fast.question_yes ||
                    modules.comments.data.fast.question_not)
                ) {
                  var categories = Object.keys(result).filter(function(c) {
                    return result[c] && result[c].length;
                  });
                  var c =
                    categories[Math.floor(Math.random() * categories.length)];
                  var random_category =
                    result[c][Math.floor(Math.random() * result[c].length)];
                  if (random_category && random_category.movies) {
                    random_category.movies.forEach(function(movie) {
                      if (movie.kp_id === related.kp_id) return;
                      options.random_movies.push({
                        title: movie.title,
                        poster: movie.poster,
                        url: movie.url
                      });
                    });
                  }
                }

                return err ? callback(err) : callback(err, result);
              }
            )
          : callback(null, null);
      },
      comments: function(callback) {
        var q = { movie_id: related.id, comment_confirm: 1 };
        var regexpEpisode = new RegExp(
          '^s([0-9]{1,4})e([0-9]{1,4})(_([0-9]{1,3})|)$',
          'ig'
        );
        var execEpisode = regexpEpisode.exec(type);
        q.season_id =
          execEpisode && execEpisode[1] ? '' + parseInt(execEpisode[1]) : '0';
        q.episode_id =
          execEpisode && execEpisode[2] ? '' + parseInt(execEpisode[2]) : '0';
        modules.comments.data.fast.active
          ? CP_comments.comments(q, null, null, null, options, function(
              err,
              comments
            ) {
              if (options.debug) {
                options.debug.detail.push({
                  type: 'comments',
                  duration: new Date() - options.debug.duration.current + 'ms'
                });
                options.debug.duration.current = new Date();
              }
              if (err) return callback(err);

              return comments ? callback(null, comments) : callback(null, {});
            })
          : callback(null, {});
      }
    },
    function(err, result) {
      if (err) return callback(err);

      for (var r in result) {
        if (result.hasOwnProperty(r) && result[r] === null) {
          delete result[r];
        }
      }

      var indexer = result.indexer ? result.indexer : '';

      CP_page.movie(result, type, options, function(err, result) {
        if (result.page.comments && typeof result.page.comments === 'string') {
          result.page.comments = indexer + result.page.comments;
        } else if (
          result.page.comments &&
          typeof result.page.comments === 'object'
        ) {
          result.page.comments.indexer = indexer;
        }
        callback(err, result);
      });
    }
  );
}

/**
 * Get ID movie.
 *
 * @param {String} url
 * @return {Number}
 */

function idMovie(url) {
  url = config.urls.slash + url;

  var prefixId = config.urls.prefix_id || config.urls.slash;
  var regexpId = new RegExp(CP_decode.text(prefixId) + '([0-9]{1,8})', 'ig');
  var execId = regexpId.exec(CP_decode.text(url));
  var intId = execId ? parseInt(execId[1]) : 0;

  return intId ? intId - config.urls.unique_id : 0;
}

/**
 * Get type movie.
 *
 * @param {String} type
 * @return {String}
 */

function typeMovie(type) {
  type = type || 'movie';

  var types = '';

  for (var t in config.urls.movies) {
    if (config.urls.movies.hasOwnProperty(t)) {
      types += '|' + config.urls.movies[t];
    }
  }

  var regexpType = new RegExp('^(movie' + types + ')$', 'ig');
  var execType = regexpType.exec(type);

  var regexpEpisode = new RegExp(
    '^(s[0-9]{1,4}e[0-9]{1,4}(_[0-9]{1,3}|))$',
    'g'
  );
  var execEpisode = regexpEpisode.exec(type);

  if (execType) {
    for (var e in config.urls.movies) {
      if (config.urls.movies.hasOwnProperty(e)) {
        if (config.urls.movies[e] === execType[1]) {
          type = e;
          break;
        }
      }
    }
  } else if (execEpisode) {
    type = 'episode';
  } else {
    type = '404';
  }

  return type;
}

module.exports = {
  id: idMovie,
  type: typeMovie,
  data: dataMovie
};
