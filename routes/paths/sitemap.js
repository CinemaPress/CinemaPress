'use strict';

/**
 * Module dependencies.
 */

var CP_translit = require('../../lib/CP_translit');
var CP_structure = require('../../lib/CP_structure');
var CP_get = require('../../lib/CP_get');

/**
 * Configuration dependencies.
 */

var config = require('../../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../../config/production/config.backup'));
var config_md5 = require('md5')(JSON.stringify(config));

var modules = require('../../config/production/modules');
Object.keys(modules).length === 0 &&
  (modules = require('../../config/production/modules.backup'));
var modules_md5 = require('md5')(JSON.stringify(modules));

setInterval(function() {
  if (
    config_md5 &&
    process.env['CP_CONFIG_MD5'] &&
    config_md5 !== process.env['CP_CONFIG_MD5']
  ) {
    config = require('../../config/production/config');
    Object.keys(config).length === 0 &&
      (config = require('../../config/production/config.backup'));
    config_md5 = process.env['CP_CONFIG_MD5'];
  }
  if (
    modules_md5 &&
    process.env['CP_MODULES_MD5'] &&
    modules_md5 !== process.env['CP_MODULES_MD5']
  ) {
    modules = require('../../config/production/modules');
    Object.keys(modules).length === 0 &&
      (modules = require('../../config/production/modules.backup'));
    modules_md5 = process.env['CP_MODULES_MD5'];
  }
}, 3333);

/**
 * Node dependencies.
 */

var fs = require('fs');
var path = require('path');
var moment = require('moment');
moment.locale(config.language);

/**
 * Callback.
 *
 * @callback Callback
 * @param {Object} err
 * @param {Object} [render]
 */

/**
 * Getting the data to render all sitemaps page.
 *
 * @param {Object} options
 * @param {Callback} callback
 */

function allSitemap(options, callback) {
  var query = {};
  query['year'] = '!_empty';
  return CP_get.movies(query, -2, 'kinopoisk-vote-up', 1, false, function(
    err,
    movies
  ) {
    if (err) return callback(err);

    var render = {};
    render.sitemaps = [];

    var categories = CP_structure.categories('year', movies, options);

    var y = new Date().getFullYear() + '';

    for (var year in categories) {
      if (categories.hasOwnProperty(year)) {
        if (categories[year].title === y) y = 0;
        render.sitemaps[render.sitemaps.length] = categories[year].url
          .replace(
            /^(https?:\/\/|\/\/)[^\/]+(.+)$/i,
            config.protocol +
              (config.botdomain + config.bomain ||
                config.ru.botdomain + config.ru.bomain ||
                config.subdomain + config.domain) +
              '$2'
          )
          .replace(
            '/' + config.urls.year + config.urls.slash,
            '/' + config.urls.sitemap + '/' + config.urls.year + '/'
          );
      }
    }

    if (y) {
      render.sitemaps.unshift(
        config.protocol +
          (config.botdomain + config.bomain ||
            config.ru.botdomain + config.ru.bomain ||
            config.subdomain + config.domain) +
          '/' +
          config.urls.sitemap +
          '/' +
          config.urls.year +
          '/' +
          y
      );
    }

    var c = [
      config.urls.year,
      config.urls.genre,
      config.urls.country,
      config.urls.actor,
      config.urls.director,
      config.urls.type,
      modules.content.data.url,
      'comment'
    ];

    for (var cat in c) {
      if (c.hasOwnProperty(cat) && c[cat]) {
        render.sitemaps[render.sitemaps.length] =
          config.protocol +
          (config.botdomain + config.bomain ||
            config.ru.botdomain + config.ru.bomain ||
            config.subdomain + config.domain) +
          '/' +
          config.urls.sitemap +
          '/' +
          c[cat];
      }
    }

    if (options.debug) {
      options.debug.detail.push({
        type: 'sitemaps',
        mem:
          Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
          100,
        duration: new Date() - options.debug.duration.current + 'ms'
      });
      options.debug.duration.current = new Date();
    }

    return callback(null, render);
  });
}

/**
 * Getting the data to render one sitemap page.
 *
 * @param {String} type
 * @param {number} year
 * @param {Object} options
 * @param {Callback} callback
 */

function oneSitemap(type, year, options, callback) {
  year = year ? parseInt(year) : 0;

  switch (type) {
    case config.urls.year:
      return year
        ? getMovies(year, function(err, render) {
            return err ? callback(err) : callback(null, render);
          })
        : getCategories('year', function(err, render) {
            return err ? callback(err) : callback(null, render);
          });
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
    case config.urls.type:
      getTypes(function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    case modules.content.data.url:
      getContents(function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    case 'comment':
      getComments(function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
      break;
    default:
      getCategories('year', function(err, render) {
        return err ? callback(err) : callback(null, render);
      });
  }

  function getTypes(callback) {
    var render = {};
    render.urls = [];

    var types = [
      config.urls.types.movie,
      config.urls.types.serial,
      config.urls.types.anime,
      config.urls.types.mult,
      config.urls.types.tv
    ];

    for (var i = 0; i < types.length; i++) {
      render.urls[render.urls.length] = {
        loc:
          config.protocol +
          (config.botdomain + config.bomain ||
            config.ru.botdomain + config.ru.bomain ||
            config.subdomain + config.domain) +
          '/' +
          config.urls.type +
          config.urls.slash +
          CP_translit.text(types[i], undefined, config.urls.type)
      };
    }

    callback(null, render);
  }

  function getCategories(category, callback) {
    var query = {};
    query[category] = '!_empty';
    return CP_get.movies(query, -2, 'kinopoisk-vote-up', 1, false, function(
      err,
      movies
    ) {
      if (err) return callback(err);

      var render = {};
      render.urls = [];

      var categories = CP_structure.categories(category, movies, options);

      for (var year in categories) {
        if (categories.hasOwnProperty(year)) {
          render.urls[render.urls.length] = {
            loc: categories[year].url.replace(
              /^(https?:\/\/|\/\/)[^\/]+(.+)$/i,
              config.protocol +
                (config.botdomain + config.bomain ||
                  config.ru.botdomain + config.ru.bomain ||
                  config.subdomain + config.domain) +
                '$2'
            )
          };
        }
      }

      if (options.debug) {
        options.debug.detail.push({
          type: 'sitemapCategory',
          mem:
            Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
            100,
          duration: new Date() - options.debug.duration.current + 'ms'
        });
        options.debug.duration.current = new Date();
      }

      return callback(null, render);
    });
  }

  /**
   * Get contents.
   *
   * @param {Callback} callback
   */

  function getContents(callback) {
    var render = {};
    render.urls = [];

    CP_get.contents({}, 500, 1, true, options, function(err, contents) {
      if (err) return callback(err);

      var render = {};
      render.urls = [];

      for (var content in contents) {
        if (contents.hasOwnProperty(content)) {
          render.urls[render.urls.length] = {
            loc: contents[content].url.replace(
              /^(https?:\/\/|\/\/)[^\/]+(.+)$/i,
              config.protocol +
                (config.botdomain + config.bomain ||
                  config.ru.botdomain + config.ru.bomain ||
                  config.subdomain + config.domain) +
                '$2'
            ),
            lastmod: moment(
              contents[content].publish,
              config.default.moment
            ).format('YYYY-MM-DD'),
            image: contents[content].image
              ? /^(http|\/\/)/i.test(contents[content].image)
                ? contents[content].image
                : config.protocol +
                    (config.botdomain + config.bomain ||
                      config.ru.botdomain + config.ru.bomain ||
                      config.subdomain + config.domain) +
                    contents[content].image || ''
              : '',
            title: (contents[content].title || '')
              .replace(/&/g, '&amp;')
              .replace(/'/g, '&apos;')
              .replace(/"/g, '&quot;')
              .replace(/>/g, '&gt;')
              .replace(/</g, '&lt;')
          };
        }
      }

      if (options.debug) {
        options.debug.detail.push({
          type: 'sitemapContent',
          mem:
            Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
            100,
          duration: new Date() - options.debug.duration.current + 'ms'
        });
        options.debug.duration.current = new Date();
      }

      return callback(null, render);
    });
  }

  /**
   * Get movies.
   *
   * @param {String} year
   * @param {function(*=, *=): *} callback
   */

  function getMovies(year, callback) {
    var file = path.join(
      __dirname,
      '..',
      '..',
      'themes',
      config.theme,
      'views',
      config.urls.sitemap,
      config.urls.year + '-' + year + '.json'
    );

    fs.access(file, function(err) {
      if (!err) return callback(null, {});
      CP_get.movies(
        { year: year },
        -1,
        'kinopoisk-vote-up',
        1,
        true,
        options,
        function(err, movies) {
          if (options.debug) {
            options.debug.detail.push({
              type: 'sitemapMovies',
              mem:
                Math.round(
                  (process.memoryUsage().heapUsed / 1024 / 1024) * 100
                ) / 100,
              duration: new Date() - options.debug.duration.current + 'ms'
            });
            options.debug.duration.current = new Date();
          }

          if (err) return callback(err);

          var render = {};
          render.urls = [];

          if (movies && movies.length) {
            for (var i = 0; i < movies.length; i++) {
              if (
                (config.urls.noindex &&
                  movies[i].url.indexOf(
                    '/' + config.urls.noindex + config.urls.slash
                  ) + 1) ||
                (modules.abuse.data.status_code_list === '404' &&
                  modules.abuse.data.movies.indexOf(movies[i].kp_id + '') + 1)
              ) {
                continue;
              }
              render.urls[render.urls.length] = {
                loc:
                  config.protocol +
                  (config.botdomain + config.bomain ||
                    config.ru.botdomain + config.ru.bomain ||
                    config.subdomain + config.domain) +
                  movies[i].pathname,
                lastmod:
                  movies[i].custom && movies[i].custom.lastmod
                    ? movies[i].custom.lastmod.substr(0, 10)
                    : '',
                image: movies[i].poster
                  ? /^(http|\/\/)/i.test(movies[i].poster)
                    ? movies[i].poster
                    : config.protocol +
                      (config.botdomain + config.bomain ||
                        config.ru.botdomain + config.ru.bomain ||
                        config.subdomain + config.domain) +
                      movies[i].poster
                  : '',
                title: (movies[i].title || '')
                  .replace(/&/g, '&amp;')
                  .replace(/'/g, '&apos;')
                  .replace(/"/g, '&quot;')
                  .replace(/>/g, '&gt;')
                  .replace(/</g, '&lt;')
              };
            }

            callback(null, render);
          } else {
            callback(null, render);
          }
        }
      );
    });
  }

  /**
   * Get comments.
   *
   * @param {Callback} callback
   */

  function getComments(callback) {
    var render = {};
    render.urls = [];

    CP_get.comments({ comment_confirm: 1 }, 100, '', 1, options, function(
      err,
      comments
    ) {
      if (err) console.error(err);

      if (comments && comments.length) {
        for (var i = 0, l = comments.length; i < l; i++) {
          render.urls[render.urls.length] = {
            loc: (options.origin + comments[i].comment_url).replace(
              /^(https?:\/\/|\/\/)[^\/]+(.+)$/i,
              config.protocol +
                (config.botdomain + config.bomain ||
                  config.ru.botdomain + config.ru.bomain ||
                  config.subdomain + config.domain) +
                '$2'
            ),
            lastmod: moment(
              new Date(
                parseInt(comments[i].comment_publish) -
                  719528 * 1000 * 60 * 60 * 24
              ).toJSON()
            ).format('YYYY-MM-DD'),
            image:
              config.protocol +
                (config.botdomain + config.bomain ||
                  config.ru.botdomain + config.ru.bomain ||
                  config.subdomain + config.domain) +
                comments[i].comment_avatar || '',
            title: (comments[i].comment_anonymous || '')
              .replace(/&/g, '&amp;')
              .replace(/'/g, '&apos;')
              .replace(/"/g, '&quot;')
              .replace(/>/g, '&gt;')
              .replace(/</g, '&lt;')
          };
        }
      }

      if (options.debug) {
        options.debug.detail.push({
          type: 'sitemapComment',
          mem:
            Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
            100,
          duration: new Date() - options.debug.duration.current + 'ms'
        });
        options.debug.duration.current = new Date();
      }

      return callback(null, render);
    });
  }
}

module.exports = {
  all: allSitemap,
  one: oneSitemap
};
