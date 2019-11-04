'use strict';

/**
 * Module dependencies.
 */

var CP_structure = require('../../lib/CP_structure');
var CP_page = require('../../lib/CP_page');
var CP_get = require('../../lib/CP_get.min');

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
 * Getting the data to render categories page.
 *
 * @param {String} type
 * @param {Object} [options]
 * @param {Callback} callback
 */

function allCategory(type, options, callback) {
  if (arguments.length === 2) {
    callback = options;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  switch (type) {
    case config.urls.year:
      getCategories('year', function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    case config.urls.genre:
      getCategories('genre', function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    case config.urls.country:
      getCategories('country', function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    case config.urls.actor:
      getCategories('actor', function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    case config.urls.director:
      getCategories('director', function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    default:
      callback(config.l.notFound);
  }

  /**
   * Get categories.
   *
   * @param {String} category
   * @param {Callback} callback
   */

  function getCategories(category, callback) {
    async.parallel(
      {
        categories: function(callback) {
          var query = {};
          query[category] = '!_empty';
          return CP_get.movies(
            query,
            -2,
            'kinopoisk-vote-up',
            1,
            false,
            options,
            function(err, movies) {
              if (options.debug) {
                options.debug.detail.push({
                  type: 'categories',
                  duration: new Date() - options.debug.duration.current + 'ms'
                });
                options.debug.duration.current = new Date();
              }
              if (err) return callback(err);

              if (movies && movies.length && category === 'year') {
                movies.push({
                  year: new Date().getFullYear() + ''
                });
              }

              var categories = CP_structure.categories(
                category,
                movies,
                options
              );

              return callback(null, categories);
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
                      duration:
                        new Date() - options.debug.duration.current + 'ms'
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
        }
      },
      function(err, result) {
        if (err) return callback(err);

        for (var r in result) {
          if (result.hasOwnProperty(r) && result[r] === null) {
            delete result[r];
          }
        }

        CP_page.categories(result, category, options, function(err, result) {
          if (options.debug) {
            options.debug.detail.push({
              type: 'page',
              duration: new Date() - options.debug.duration.current + 'ms'
            });
            options.debug.duration.current = new Date();
          }
          callback(err, result);
        });
      }
    );
  }
}

/**
 * Getting the data to render category page.
 *
 * @param {String} type
 * @param {String} key
 * @param {Number} page
 * @param {String} sorting
 * @param {Object} [options]
 * @param {Callback} callback
 */

function oneCategory(type, key, page, sorting, options, callback) {
  if (arguments.length === 5) {
    callback = options;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  page = page ? page : 1;

  switch (type) {
    case config.urls.year:
      getMovies({ year: key }, function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    case config.urls.genre:
      getMovies({ genre: key }, function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    case config.urls.country:
      getMovies({ country: key }, function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    case config.urls.actor:
      getMovies({ actor: key }, function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    case config.urls.director:
      getMovies({ director: key }, function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    case config.urls.type:
      getMovies({ type: key }, function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    case config.urls.search:
      getMovies({ search: key }, function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    default:
      callback(config.l.notFound);
  }

  /**
   * Get movies.
   *
   * @param {Object} query
   * @param {Callback} callback
   */

  function getMovies(query, callback) {
    async.parallel(
      {
        movies: function(callback) {
          return CP_get.movies(
            query,
            config.default.count,
            sorting,
            page,
            true,
            options,
            function(err, movies) {
              if (options.debug) {
                options.debug.detail.push({
                  type: 'category',
                  duration: new Date() - options.debug.duration.current + 'ms'
                });
                options.debug.duration.current = new Date();
              }
              if (err) return callback(err);

              return movies && movies.length
                ? callback(null, movies)
                : callback(null, []);
            }
          );
        },
        top: function(callback) {
          return modules.top.status
            ? CP_get.additional(query, 'top', options, function(err, movies) {
                if (options.debug) {
                  options.debug.detail.push({
                    type: 'top',
                    duration: new Date() - options.debug.duration.current + 'ms'
                  });
                  options.debug.duration.current = new Date();
                }
                if (err) return callback(err);

                return movies && movies.length
                  ? callback(null, movies)
                  : callback(null, []);
              })
            : callback(null, []);
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
                      duration:
                        new Date() - options.debug.duration.current + 'ms'
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
            modules.comments.data.disqus.recent.display.indexOf('category') + 1
          ) {
            service.push('disqus');
          }
          if (
            modules.comments.data.hypercomments.widget_id &&
            modules.comments.data.hypercomments.recent.num_items &&
            modules.comments.data.hypercomments.recent.display.indexOf(
              'category'
            ) + 1
          ) {
            service.push('hypercomments');
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
        count: function(callback) {
          if (!config.default.lastpage) {
            var pages =
              page <= config.default.pages / 2
                ? page + config.default.pages
                : page + config.default.pages / 2;
            return callback(null, pages);
          }
          return CP_get.count(query, sorting, function(err, num) {
            if (options.debug) {
              options.debug.detail.push({
                type: 'count',
                duration: new Date() - options.debug.duration.current + 'ms'
              });
              options.debug.duration.current = new Date();
            }
            if (err) return callback(err);

            num = Math.ceil(parseInt(num) / config.default.count);

            return num ? callback(null, num) : callback(null, 0);
          });
        }
      },
      function(err, result) {
        if (err) return callback(err);

        if (
          !config.default.lastpage &&
          result.movies.length < config.default.count
        ) {
          result.count = page;
        }

        for (var r in result) {
          if (result.hasOwnProperty(r) && result[r] === null) {
            delete result[r];
          }
        }

        CP_page.category(result, query, sorting, page, options, function(
          err,
          result
        ) {
          if (options.debug) {
            options.debug.detail.push({
              type: 'page',
              duration: new Date() - options.debug.duration.current + 'ms'
            });
            options.debug.duration.current = new Date();
          }
          callback(err, result);
        });
      }
    );
  }
}

/**
 * Getting random movie in category.
 *
 * @param {String} type
 * @param {String} key
 * @param {Object} [options]
 * @param {Callback} callback
 */

function randomCategory(type, key, options, callback) {
  switch (type) {
    case config.urls.year:
      CP_get.movies(
        { year: key },
        -3,
        undefined,
        undefined,
        undefined,
        options,
        function(err, movies) {
          return err
            ? callback(err)
            : movies && movies.length
              ? callback(
                  null,
                  movies[Math.floor(Math.random() * movies.length)].url
                )
              : callback(null, '');
        }
      );
      break;
    case config.urls.genre:
      CP_get.movies(
        { genre: key },
        -3,
        undefined,
        undefined,
        undefined,
        options,
        function(err, movies) {
          return err
            ? callback(err)
            : movies && movies.length
              ? callback(
                  null,
                  movies[Math.floor(Math.random() * movies.length)].url
                )
              : callback(null, '');
        }
      );
      break;
    case config.urls.country:
      CP_get.movies(
        { country: key },
        -3,
        undefined,
        undefined,
        undefined,
        options,
        function(err, movies) {
          return err
            ? callback(err)
            : movies && movies.length
              ? callback(
                  null,
                  movies[Math.floor(Math.random() * movies.length)].url
                )
              : callback(null, '');
        }
      );
      break;
    case config.urls.actor:
      CP_get.movies(
        { actor: key },
        -3,
        undefined,
        undefined,
        undefined,
        options,
        function(err, movies) {
          return err
            ? callback(err)
            : movies && movies.length
              ? callback(
                  null,
                  movies[Math.floor(Math.random() * movies.length)].url
                )
              : callback(null, '');
        }
      );
      break;
    case config.urls.director:
      CP_get.movies(
        { director: key },
        -3,
        undefined,
        undefined,
        undefined,
        options,
        function(err, movies) {
          return err
            ? callback(err)
            : movies && movies.length
              ? callback(
                  null,
                  movies[Math.floor(Math.random() * movies.length)].url
                )
              : callback(null, '');
        }
      );
      break;
    case config.urls.type:
      CP_get.movies(
        { type: key },
        -3,
        undefined,
        undefined,
        undefined,
        options,
        function(err, movies) {
          return err
            ? callback(err)
            : movies && movies.length
              ? callback(
                  null,
                  movies[Math.floor(Math.random() * movies.length)].url
                )
              : callback(null, '');
        }
      );
      break;
    case config.urls.search:
      CP_get.movies(
        { search: key },
        -3,
        undefined,
        undefined,
        undefined,
        options,
        function(err, movies) {
          return err
            ? callback(err)
            : movies && movies.length
              ? callback(
                  null,
                  movies[Math.floor(Math.random() * movies.length)].url
                )
              : callback(null, '');
        }
      );
      break;
    default:
      callback(config.l.notFound);
  }
}

module.exports = {
  all: allCategory,
  one: oneCategory,
  random: randomCategory
};
