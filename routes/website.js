'use strict';

/**
 * Module dependencies.
 */

var CP_cache = require('../lib/CP_cache');
var CP_decode = require('../lib/CP_decode');
var CP_translit = require('../lib/CP_translit');
var CP_regexp = require('../lib/CP_regexp');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../config/production/config.backup'));
var config_md5 = require('md5')(JSON.stringify(config));

var modules = require('../config/production/modules');
Object.keys(modules).length === 0 &&
  (modules = require('../config/production/modules.backup'));
var modules_md5 = require('md5')(JSON.stringify(modules));

setInterval(function() {
  if (
    config_md5 &&
    process.env['CP_CONFIG_MD5'] &&
    config_md5 !== process.env['CP_CONFIG_MD5']
  ) {
    config = require('../config/production/config');
    Object.keys(config).length === 0 &&
      (config = require('../config/production/config.backup'));
    config_md5 = process.env['CP_CONFIG_MD5'];
  }
  if (
    modules_md5 &&
    process.env['CP_MODULES_MD5'] &&
    modules_md5 !== process.env['CP_MODULES_MD5']
  ) {
    modules = require('../config/production/modules');
    Object.keys(modules).length === 0 &&
      (modules = require('../config/production/modules.backup'));
    modules_md5 = process.env['CP_MODULES_MD5'];
  }
}, 3333);

/**
 * Node dependencies.
 */

var fs = require('fs');
var md5 = require('md5');
var url_parse = require('url');
var path = require('path');
var _eval = require('eval');
var express = require('express');
var router = express.Router();

/**
 * Route dependencies.
 */

var index = require('./paths/index');
var movie = require('./paths/movie');
var category = require('./paths/category');
var sitemap = require('./paths/sitemap');

/**
 * Route CP modules dependencies.
 */

var content = require('./paths/content');

/**
 * Callback.
 *
 * @callback Callback
 * @param {Object} err
 * @param {Object} [render]
 */

router.get('/:level1?/:level2?/:level3?/:level4?', function(req, res, next) {
  var levels = [
    config.urls.movie,
    config.urls.year,
    config.urls.genre,
    config.urls.country,
    config.urls.actor,
    config.urls.director,
    config.urls.type,
    config.urls.search,
    modules.content.data.url
  ];
  if (config.urls.noindex) {
    levels.push(config.urls.noindex);
  }
  var levels_first = new RegExp('^(' + levels.join('|') + ')-(.*)$', 'i');
  if (req.params && req.params.level1 && levels_first.test(req.params.level1)) {
    var l = req.params.level1.match(levels_first);
    req.params.level1 = l[1];
    if (req.params.level2) {
      req.params.level3 = req.params.level2;
      req.params.level2 = l[2];
    } else {
      req.params.level2 = l[2];
    }
  }
  var options = {};
  options.query = {};
  options.userinfo = req.userinfo;
  options.protocol = req.userinfo.protocol || config.protocol;
  options.domain = req.userinfo.domain || config.subdomain + '' + config.domain;
  options.origin =
    req.userinfo.origin || options.protocol + '' + options.domain;
  options.port = req.userinfo.port;
  options.subscribe = req.cookies.CP_subscribe || '';
  options.debug =
    process.env.NODE_ENV !== 'production'
      ? {
          url: parseUrl(),
          duration: {
            current: new Date(),
            all: req.start_request || new Date()
          },
          detail: [
            {
              type: 'website',
              mem:
                Math.round(
                  (process.memoryUsage().heapUsed / 1024 / 1024) * 100
                ) / 100,
              duration: new Date() - (req.start_request || new Date()) + 'ms'
            }
          ]
        }
      : null;
  options.comments = {
    page: req.query.page ? CP_regexp.str(req.query.page) : null,
    sorting: req.query.sorting ? CP_regexp.str(req.query.sorting) : null,
    num: req.query.num ? CP_regexp.str(req.query.num) : null
  };

  var url = parseUrl();
  var urlHash = md5(
    JSON.stringify(options) + url.toLowerCase() + process.env['CP_VER']
  );

  var level1 = CP_regexp.str(req.params.level1) || null;
  var level2 =
    CP_regexp.str(req.query.q) ||
    CP_regexp.str(CP_translit.text(req.params.level2 || '', true, level1)) ||
    null;
  var level3 = CP_regexp.str(req.params.level3 || '') || null;
  var sorting =
    CP_regexp.str(req.query.sorting) ||
    (level1 === modules.content.data.url || level1 === config.urls.search
      ? level1 === config.urls.search
        ? config.default.sorting_search
        : ''
      : config.default.sorting);
  var tag = CP_regexp.str(req.query.tag) || null;
  var id = level2 ? movie.id(level2) : '';
  var filename = level2
    ? id
      ? id
      : level1 === config.urls.sitemap && level3
      ? decodeURIComponent(
          CP_translit.text(level2 + '-' + level3, undefined, '')
        ).replace(/^-/, '')
      : decodeURIComponent(
          CP_translit.text(level2 || '', undefined, '')
        ).replace(/^-/, '')
    : 'index';
  var custom_template = path.join(
    __dirname,
    '..',
    'themes',
    config.theme,
    'views',
    req.userinfo.device === 'desktop' ? '' : req.userinfo.device,
    level1 || 'custom',
    filename + '.ejs'
  );
  var custom_data = path.join(
    __dirname,
    '..',
    'themes',
    config.theme,
    'views',
    req.userinfo.device === 'desktop' ? '' : req.userinfo.device,
    level1 || 'custom',
    filename + '.json'
  );

  [
    'type',
    'year',
    'genre',
    'country',
    'actor',
    'director',
    'kp_rating',
    'imdb_rating'
  ].forEach(function(t) {
    if (req.query[t] && level1 !== config.urls[t]) {
      if (t === 'year' || t === 'kp_rating' || t === 'imdb_rating') {
        options.query[t] = CP_regexp.str(req.query[t]);
      } else {
        options.query[t] = CP_regexp.str(
          CP_translit.text(req.query[t], true, config.urls[t])
        );
      }
      if (!level2) {
        level2 = 'X';
      }
    }
  });

  Object.keys(req.query).forEach(function(t) {
    if (/^custom\./i.test(t)) {
      options.query[t] = CP_regexp.str(req.query[t]);
      if (!level2) {
        level2 = 'X';
      }
    }
  });

  var template = setTemplate();

  getRender(function(err, render) {
    switch (template) {
      case 'content':
        template = 'category';
        break;
      case 'contents':
        template = 'categories';
        break;
    }

    renderData(err, render);
  });

  function getRender(callback) {
    if (typeof req.query.random !== 'undefined' && modules.random.status) {
      getSphinx(function(err, render) {
        return callback(err, render);
      });
    } else {
      getCache(function(err, render) {
        return callback(err, render);
      });
    }
  }

  function getCache(callback) {
    CP_cache.get(urlHash, function(err, render) {
      return render
        ? callback(null, render)
        : getSphinx(function(err, render) {
            return err ? callback(err) : callback(null, render);
          });
    });
  }

  function getSphinx(callback) {
    switch (template) {
      case 'movie':
        movie.data(id, 'movie', options, function(err, render) {
          if (err) {
            callback(err);
          } else if (url === render.page.url) {
            callback(null, render);
          } else {
            return res.redirect(301, render.page.url);
          }
        });
        break;
      case 'online':
        movie.data(id, 'online', options, function(err, render) {
          if (err) {
            callback(err);
          } else if (url === render.page.url) {
            callback(null, render);
          } else {
            return res.redirect(301, render.page.url);
          }
        });
        break;
      case 'download':
        movie.data(id, 'download', options, function(err, render) {
          if (err) {
            callback(err);
          } else if (url === render.page.url) {
            callback(null, render);
          } else {
            return res.redirect(301, render.page.url);
          }
        });
        break;
      case 'trailer':
        movie.data(id, 'trailer', options, function(err, render) {
          if (err) {
            callback(err);
          } else if (url === render.page.url) {
            callback(null, render);
          } else {
            return res.redirect(301, render.page.url);
          }
        });
        break;
      case 'picture':
        movie.data(id, 'picture', options, function(err, render) {
          if (err) {
            callback(err);
          } else if (url === render.page.url) {
            callback(null, render);
          } else {
            return res.redirect(301, render.page.url);
          }
        });
        break;
      case 'episode':
        movie.data(id, level3, options, function(err, render) {
          if (err) {
            callback(err);
          } else if (url === render.page.url) {
            callback(null, render);
          } else {
            return res.redirect(301, render.page.url);
          }
        });
        break;
      case 'category':
        if (typeof req.query.random !== 'undefined' && modules.random.status) {
          category.random(level1, level2, options, function(err, url) {
            if (err) {
              callback(err);
            } else if (!url) {
              callback(config.l.notFound);
            } else {
              return res.redirect(302, url);
            }
          });
        } else {
          category.one(
            level1,
            level2,
            parseInt(level3),
            sorting,
            options,
            function(err, render) {
              var levels_category = new RegExp(
                '/' + level1 + config.urls.slash,
                'i'
              );
              if (err) {
                callback(err);
              } else if (
                level1 === config.urls.search ||
                levels_category.test(url)
              ) {
                callback(null, render);
              } else {
                return res.redirect(301, render.page.url);
              }
            }
          );
        }
        break;
      case 'categories':
        category.all(level1, options, function(err, render) {
          callback(err, render);
        });
        break;
      case 'content':
        if (typeof req.query.random !== 'undefined' && modules.random.status) {
          content.random(req.params.level2, options, function(err, url) {
            if (err) {
              callback(err);
            } else if (!url) {
              callback(config.l.notFound);
            } else {
              return res.redirect(302, url);
            }
          });
        } else {
          content.one(
            req.params.level2,
            parseInt(level3),
            sorting,
            options,
            function(err, render) {
              if (err || !render) {
                return callback(err);
              }
              var levels_content = new RegExp(
                '/' +
                  modules.content.data.url +
                  config.urls.slash +
                  render.content.slug,
                ''
              );
              if (levels_content.test(url)) {
                callback(null, render);
              } else {
                return res.redirect(
                  301,
                  '/' +
                    modules.content.data.url +
                    config.urls.slash +
                    render.content.slug
                );
              }
            }
          );
        }
        break;
      case 'contents':
        content.all(tag, options, function(err, render) {
          callback(err, render);
        });
        break;
      case 'sitemap':
        if (level2) {
          sitemap.one(level2, level3, options, function(err, render) {
            callback(err, render);
          });
        } else {
          sitemap.all(options, function(err, render) {
            callback(err, render);
          });
        }
        break;
      case 'index':
        if (
          typeof req.query.random !== 'undefined' &&
          modules.random.status &&
          modules.random.data.menu
        ) {
          content.random(modules.random.data.menu, options, function(err, red) {
            if (err) {
              callback(err);
            } else if (!red) {
              callback(config.l.notFound);
            } else {
              return res.redirect(302, red);
            }
          });
        } else {
          index.data(options, function(err, render) {
            callback(err, render);
          });
        }
        break;
      default:
        callback(config.l.notFound);
    }
  }

  function parseUrl() {
    var parts = req.originalUrl.split('?');

    var url =
      options.protocol +
      options.domain +
      parts[0].replace(/\/tv-version|\/mobile-version/, '');

    if (parts[1]) {
      if (req.query.sorting && config.sorting[req.query.sorting]) {
        url +=
          (url.indexOf('?') + 1 ? '&' : '?') + 'sorting=' + req.query.sorting;
      }
      if (req.query.q) {
        url +=
          (url.indexOf('?') + 1 ? '&' : '?') +
          'q=' +
          CP_regexp.str(req.query.q);
      }
      if (req.query.tag) {
        url +=
          (url.indexOf('?') + 1 ? '&' : '?') +
          'tag=' +
          CP_regexp.str(req.query.tag);
      }
      [
        'type',
        'year',
        'genre',
        'country',
        'actor',
        'director',
        'kp_rating',
        'imdb_rating'
      ].forEach(function(t) {
        if (req.query[t]) {
          url += (url.indexOf('?') + 1 ? '&' : '?') + t + '=' + req.query[t];
        }
      });
      if (typeof req.query.json !== 'undefined') {
        url += (url.indexOf('?') + 1 ? '&' : '?') + 'json=1';
      }
      if (typeof req.query.random !== 'undefined') {
        url += (url.indexOf('?') + 1 ? '&' : '?') + 'random=1';
      }
    }

    return CP_decode.text(url);
  }

  function setTemplate() {
    switch (level1) {
      case config.urls.noindex:
        if (!config.urls.noindex) return 'error';
        return id ? movie.type(level3) : 'error';
      case config.urls.movie:
        return id ? movie.type(level3) : 'error';
      case config.urls.year:
        return level2 ? 'category' : 'categories';
      case config.urls.genre:
        return level2 ? 'category' : 'categories';
      case config.urls.country:
        return level2 ? 'category' : 'categories';
      case config.urls.actor:
        return level2 ? 'category' : 'categories';
      case config.urls.director:
        return level2 ? 'category' : 'categories';
      case config.urls.type:
        return level2 ? 'category' : 'error';
      case config.urls.search:
        return level2 && !/^-/.test(level2) ? 'category' : 'error';
      case config.urls.sitemap:
        return 'sitemap';
      case modules.content.data.url:
        if (!modules.content.status) return 'error';
        return level2 ? 'content' : 'contents';
      case null:
        return 'index';
      default:
        return 'error';
    }
  }

  function renderData(err, render) {
    if (err) {
      console.log('[routes/website.js]', url);

      return next({
        status: 404,
        message: err
      });
    }

    if (options.userinfo.bot.all) {
      if (
        config.publish.indexing &&
        config.publish.indexing.condition &&
        /(movie|online|download|trailer|picture|episode)/i.test(template)
      ) {
        var condition = _eval(
          'module.exports=function(movie){return !!(' +
            config.publish.indexing.condition.toString() +
            ');}'
        );
        if (condition(render.movie)) {
          console.log('[Indexing is forbidden in condition]', url);

          return next({
            status: 404,
            message: err
          });
        }
      }
    }

    if (template === 'sitemap') {
      if (!config.user_bot) {
        if (!req.userinfo.bot.main) {
          return next({
            status: 404,
            message: 'The sitemap is available only to search bots.'
          });
        }
        var host = req.get('host');
        var host_domain = url_parse.parse(config.protocol + '://' + host)
          .hostname;
        if (
          (config.bomain || config.ru.bomain) &&
          (host_domain === config.subdomain + config.domain ||
            host_domain === config.ru.subdomain + config.ru.domain ||
            config.mirrors.indexOf(host_domain) + 1)
        ) {
          return next({
            status: 404,
            message: 'The sitemap is available only to search bots.'
          });
        }
      }
    }

    if (req.userinfo.bot.main) {
      res.header('X-Robots-Tag', 'noarchive');
    }

    if (
      req.userinfo.bot.main &&
      (level1 === config.urls.year ||
        level1 === config.urls.genre ||
        level1 === config.urls.country ||
        level1 === config.urls.actor ||
        level1 === config.urls.director ||
        level1 === config.urls.type) &&
      (!render.movies || render.movies.length <= 0)
    ) {
      return next({
        status: 404,
        message: config.l.notFound
      });
    }

    if (typeof render === 'object') {
      if (
        config.theme === 'default' ||
        (req.query.json && level1 === config.urls.search)
      ) {
        if (level1 === config.urls.search) {
          res.json({ movies: render.movies });
        } else {
          res.json(render);
        }

        if (options.debug) {
          options.debug.duration =
            new Date() - options.debug.duration.all + 'ms';
          console.log(options.debug);
        }
      } else {
        if (template === 'sitemap') {
          res.header('Content-Type', 'application/xml');
          template = 'desktop' + '/' + template;
        } else {
          template =
            req.userinfo.device === 'desktop' || req.userinfo.device === 'app'
              ? template
              : req.userinfo.device + '/' + template;
        }

        if (typeof render.page !== 'object') render.page = {};
        if (typeof render.page.custom !== 'object') render.page.custom = {};

        fs.access(custom_data, function(err) {
          if (!err) {
            try {
              render.page.custom = require(custom_data);
            } catch (e) {
              console.error(e);
            }
          }
          fs.access(custom_template, function(err) {
            if (err) custom_template = template;

            res.render(custom_template, render, function(err, html) {
              if (options.debug) {
                options.debug.detail.push({
                  type: 'render',
                  mem:
                    Math.round(
                      (process.memoryUsage().heapUsed / 1024 / 1024) * 100
                    ) / 100,
                  duration: new Date() - options.debug.duration.current + 'ms'
                });
                options.debug.duration.current = new Date();
              }

              if (err) console.log('[renderData] Render Error:', err);

              var link_header = '';

              if (options.userinfo.alt && render.page && render.page.pathname) {
                link_header +=
                  (link_header ? ', ' : '') +
                  '<' +
                  options.userinfo.alt +
                  render.page.pathname.replace(/\/$/, '') +
                  '>; rel="alternate"; hreflang="x-default"';
              }

              if (options.userinfo.ru && render.page && render.page.pathname) {
                link_header +=
                  (link_header ? ', ' : '') +
                  '<' +
                  options.userinfo.ru +
                  render.page.pathname.replace(/\/$/, '') +
                  '>; rel="alternate"; hreflang="ru"';
              }

              if (link_header) {
                res.header('Link', link_header);
              }

              res
                .status(
                  render.page && render.page.status_code
                    ? render.page.status_code
                    : 200
                )
                .send(html);

              if (
                config.cache.time &&
                render &&
                !render.cache &&
                !req.userinfo.bot.all
              ) {
                render.cache = true;
                CP_cache.set(urlHash, render, function(err) {});
              }

              if (options.debug) {
                options.debug.duration =
                  new Date() - options.debug.duration.all + 'ms';
                console.log(options.debug);
              }
            });
          });
        });
      }
    } else {
      if (options.debug) {
        options.debug.detail.push({
          type: 'cache',
          mem:
            Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
            100,
          duration: new Date() - options.debug.duration.current + 'ms'
        });
        options.debug.duration.current = new Date();
      }

      if (template === 'sitemap') {
        res.header('Content-Type', 'application/xml');
        res.send(render);
      } else {
        res.send(render);
      }

      if (options.debug) {
        options.debug.duration = new Date() - options.debug.duration.all + 'ms';
        console.log(options.debug);
      }
    }
  }
});

module.exports = router;
