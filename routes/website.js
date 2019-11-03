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
var modules = require('../config/production/modules');

/**
 * Node dependencies.
 */

var md5 = require('md5');
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
  var options = {};
  options.userinfo = req.userinfo;
  options.origin = req.userinfo.origin;
  options.domain = req.userinfo.domain;
  options.port = req.userinfo.port;
  options.subscribe = req.cookies.CP_subscribe || '';
  options.debug =
    process.env.NODE_ENV !== 'production'
      ? {
          url: parseUrl(),
          duration: { current: new Date(), all: new Date() },
          detail: []
        }
      : null;

  req.query.start_time = req.query.start_time || '';
  options.start_time = '';
  if (req.query.start_time && req.query.start_time.replace(/[^0-9]/gi, '')) {
    options.start_time = req.query.start_time.replace(/[^0-9]/gi, '');
  }

  req.query.start_episode = req.query.start_episode || '';
  options.start_episode = '';
  if (
    req.query.start_episode &&
    req.query.start_episode.replace(/[^0-9a-z|]/gi, '')
  ) {
    options.start_episode = req.query.start_episode.replace(/[^0-9a-z|]/gi, '');
  }

  var url = parseUrl();
  var urlHash = md5(JSON.stringify(options) + url.toLowerCase());

  var level1 = CP_regexp.str(req.params.level1) || null;
  var level2 =
    CP_regexp.str(req.query.q) ||
    CP_regexp.str(CP_translit.text(req.params.level2, true)) ||
    null;
  var level3 = CP_regexp.str(req.params.level3) || null;
  var sorting =
    CP_regexp.str(req.query.sorting) ||
    (level1 === modules.content.data.url ? '' : config.default.sorting);
  var tag = CP_regexp.str(req.query.tag) || null;

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
    if (config.cache.time) {
      getCache(function(err, render) {
        return callback(err, render);
      });
    } else {
      getSphinx(function(err, render) {
        return callback(err, render);
      });
    }
  }

  function getCache(callback) {
    CP_cache.get(urlHash, function(err, render) {
      if (err) return callback(err);

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
        movie.data(movie.id(level2), 'movie', options, function(err, render) {
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
        movie.data(movie.id(level2), 'online', options, function(err, render) {
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
        movie.data(movie.id(level2), 'download', options, function(
          err,
          render
        ) {
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
        movie.data(movie.id(level2), 'trailer', options, function(err, render) {
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
        movie.data(movie.id(level2), 'picture', options, function(err, render) {
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
        movie.data(movie.id(level2), level3, options, function(err, render) {
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
              callback(err, render);
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
              callback(err, render);
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
      config.protocol +
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
        return movie.id(level2) ? movie.type(level3) : 'error';
      case config.urls.movie:
        return movie.id(level2) ? movie.type(level3) : 'error';
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
        return level2 ? 'category' : 'error';
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

    if (
      options.userinfo.bot &&
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
        console.log('[Indexing is forbidden]', url);

        return next({
          status: 404,
          message: err
        });
      }
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
            req.userinfo.device === 'desktop'
              ? template
              : req.userinfo.device + '/' + template;
        }

        res.render(template, render, function(err, html) {
          if (options.debug) {
            options.debug.detail.push({
              type: 'render',
              duration: new Date() - options.debug.duration.current + 'ms'
            });
            options.debug.duration.current = new Date();
          }

          if (err) console.log('[renderData] Render Error:', err);

          res
            .status(
              render.page && render.page.status_code
                ? render.page.status_code
                : 200
            )
            .send(html);

          if (config.cache.time && render && !render.cache) {
            render.cache = true;
            CP_cache.set(urlHash, render, config.cache.time, function(err) {
              if (err) {
                if ((err + '').indexOf('1048576') + 1) {
                  console.log(
                    '[routes/website.js:renderData] Cache Length Error:',
                    url
                  );
                } else {
                  console.log(
                    '[routes/website.js:renderData] Cache Set Error:',
                    err
                  );
                }
              }
            });
          }

          if (options.debug) {
            options.debug.duration =
              new Date() - options.debug.duration.all + 'ms';
            console.log(options.debug);
          }
        });
      }
    } else {
      if (options.debug) {
        options.debug.detail.push({
          type: 'cache',
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
