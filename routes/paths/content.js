'use strict';

/**
 * Module dependencies.
 */

var CP_page = require('../../lib/CP_page');
var CP_get = require('../../lib/CP_get');

var CP_comments = require('../../modules/CP_comments');

/**
 * Configuration dependencies.
 */

var config = require('../../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../../config/production/config.backup'));
var modules = require('../../config/production/modules');
Object.keys(modules).length === 0 &&
  (modules = require('../../config/production/modules.backup'));

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
 * Getting the data to custom contents.
 *
 * @param {String} tag
 * @param {Object} [options]
 * @param {Callback} callback
 */

function allContents(tag, options, callback) {
  if (arguments.length === 1) {
    callback = options;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var query = tag ? { content_tags: tag } : {};

  async.parallel(
    {
      categories: function(callback) {
        options.content_image = config.default.image;
        CP_get.contents(query, 100, 1, true, options, function(err, contents) {
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
        });
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
              { all_movies: process.env.CP_SPB },
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
      }
    },
    function(err, result) {
      if (err) return callback(err);

      for (var r in result) {
        if (result.hasOwnProperty(r) && result[r] === null) {
          delete result[r];
        }
      }

      CP_page.contents(query, result, options, function(err, result) {
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

/**
 * Getting the data to render content.
 *
 * @param {String} url
 * @param {Number} page
 * @param {String} sorting
 * @param {Object} [options]
 * @param {Callback} callback
 */

function oneContent(url, page, sorting, options, callback) {
  if (arguments.length === 4) {
    callback = options;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  page = page ? page : 1;
  var query = '';

  var related = {};

  async.series(
    {
      content: function(callback) {
        return CP_get.contents(
          {
            id: url.replace(/[^0-9]/g, '') === url ? url : '',
            content_url: url.replace(/[^0-9]/g, '') === url ? '' : url
          },
          1,
          1,
          true,
          options,
          function(err, contents) {
            if (options.debug) {
              options.debug.detail.push({
                type: 'content',
                duration: new Date() - options.debug.duration.current + 'ms'
              });
              options.debug.duration.current = new Date();
            }
            if (err) return callback(err);

            if (
              contents &&
              contents.length &&
              contents[0].movies &&
              contents[0].movies.length
            ) {
              if (contents[0].tags.indexOf('NoSorting') + 1) {
                sorting = '';
              }
              if (contents[0].tags.indexOf('NoPagination') + 1) {
                page = 1;
              }
              var query_id = [];
              if (sorting) {
                contents[0].movies.forEach(function(item) {
                  query_id.push(item);
                });
              } else {
                contents[0].movies
                  .slice(
                    config.default.count * (page ? page - 1 : 0),
                    config.default.count * (!page ? 1 : page)
                  )
                  .forEach(function(item) {
                    query_id.push(item);
                  });
              }
              query = { query_id: query_id.join('|') };
            }

            if (contents && contents.length) related = contents[0];

            return contents && contents.length
              ? callback(null, contents[0])
              : callback(config.l.notFound);
          }
        );
      },
      movies: function(callback) {
        if (!query) return callback(null, []);
        return CP_get.movies(
          query,
          config.default.count,
          sorting,
          sorting ? page : 1,
          true,
          options,
          function(err, movies) {
            if (options.debug) {
              options.debug.detail.push({
                type: 'movies',
                duration: new Date() - options.debug.duration.current + 'ms'
              });
              options.debug.duration.current = new Date();
            }
            if (err) return callback(err);

            return movies && movies.length
              ? sorting
                ? callback(null, movies)
                : callback(
                    null,
                    sortingIds(related.movies, movies, config.default.count)
                  )
              : callback(null, []);
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
              { all_movies: process.env.CP_SPB },
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
      recent: function(callback) {
        var service = [];
        if (
          modules.comments.status &&
          modules.comments.data.disqus.shortname &&
          modules.comments.data.disqus.recent.num_items &&
          modules.comments.data.disqus.recent.display.indexOf('content') + 1
        ) {
          service.push('disqus');
        }
        if (
          modules.comments.status &&
          modules.comments.data.hypercomments.widget_id &&
          modules.comments.data.hypercomments.recent.num_items &&
          modules.comments.data.hypercomments.recent.display.indexOf(
            'content'
          ) + 1
        ) {
          service.push('hypercomments');
        }
        if (
          modules.comments.status &&
          modules.comments.data.fast.active &&
          modules.comments.data.fast.recent.num_items &&
          modules.comments.data.fast.recent.display.indexOf('content') + 1
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
          ? CP_comments.indexer(
              config.protocol +
                options.domain +
                '/' +
                modules.content.data.url +
                config.urls.slash +
                url,
              '/' + modules.content.data.url + config.urls.slash + url,
              function(err, comments) {
                if (options.debug) {
                  options.debug.detail.push({
                    type: 'comments',
                    duration: new Date() - options.debug.duration.current + 'ms'
                  });
                  options.debug.duration.current = new Date();
                }
                if (err) return callback(err);

                return comments ? callback(null, comments) : callback(null, '');
              }
            )
          : callback(null, '');
      },
      count: function(callback) {
        if (!query) return callback(null, 0);
        if (sorting) {
          return CP_get.count(query, function(err, num) {
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
        } else {
          return callback(
            null,
            Math.ceil(
              related.movies && related.movies.length
                ? related.movies.length / config.default.count
                : 0
            )
          );
        }
      },
      comments: function(callback) {
        modules.comments.data.fast.active && !/NoComment/i.test(related.tags)
          ? CP_comments.comments(
              { content_id: related.id, comment_confirm: 1 },
              null,
              null,
              null,
              options,
              function(err, comments) {
                if (options.debug) {
                  options.debug.detail.push({
                    type: 'comments',
                    duration: new Date() - options.debug.duration.current + 'ms'
                  });
                  options.debug.duration.current = new Date();
                }
                if (err) return callback(err);

                return comments ? callback(null, comments) : callback(null, {});
              }
            )
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

      CP_page.content(result, url, page, sorting, options, function(
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

  /**
   * Sort films are turned by id list.
   *
   * @param {Object} ids
   * @param {Object} movies
   * @param {Number} [count]
   * @return {Array}
   */

  function sortingIds(ids, movies, count) {
    if (arguments.length === 2) {
      count = 0;
    }

    var result = [];

    for (var id = 0; id < ids.length; id++) {
      for (var i = 0; i < movies.length; i++) {
        if (parseInt(movies[i].kp_id) === parseInt(('' + ids[id]).trim())) {
          result.push(movies[i]);
          if (result.length === count) return result;
        }
      }
    }

    return result;
  }
}

/**
 * Getting random movie in content.
 *
 * @param {String} url
 * @param {Object} [options]
 * @param {Callback} callback
 */

function randomContent(url, options, callback) {
  CP_get.contents(
    {
      id: url.replace(/[^0-9]/g, '') === url ? url : '',
      content_url: url.replace(/[^0-9]/g, '') === url ? '' : url
    },
    undefined,
    undefined,
    undefined,
    options,
    function(err, contents) {
      return err
        ? callback(err)
        : contents &&
          contents.length &&
          contents[0].movies &&
          contents[0].movies.length
        ? callback(
            null,
            '/' +
              config.urls.movie +
              config.urls.slash +
              config.urls.prefix_id +
              (parseInt(
                contents[0].movies[
                  Math.floor(Math.random() * contents[0].movies.length)
                ]
              ) +
                parseInt('' + config.urls.unique_id))
          )
        : callback(null, '');
    }
  );
}

module.exports = {
  all: allContents,
  one: oneContent,
  random: randomContent
};
