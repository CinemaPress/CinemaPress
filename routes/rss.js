'use strict';

/**
 * Module dependencies.
 */

var CP_cache = require('../lib/CP_cache');
var CP_get = require('../lib/CP_get');
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
 * RSS.
 */

router.get('/?', function(req, res, next) {
  var url =
    (req.userinfo && req.userinfo.origin
      ? req.userinfo.origin
      : config.protocol + config.subdomain + config.domain) + req.originalUrl;
  var urlHash = md5(url.toLowerCase() + process.env['CP_VER']);

  getRender(function(err, render) {
    renderData(err, render);
  });

  /**
   * Get render.
   *
   * @param {Callback} callback
   */

  function getRender(callback) {
    return config.cache.time
      ? getCache(function(err, render) {
          return err ? callback(err) : callback(null, render);
        })
      : getSphinx(function(err, render) {
          return err ? callback(err) : callback(null, render);
        });
  }

  /**
   * Get cache.
   *
   * @param {Callback} callback
   */

  function getCache(callback) {
    CP_cache.get(urlHash, function(err, render) {
      return render
        ? callback(null, render)
        : getSphinx(function(err, render) {
            return err ? callback(err) : callback(null, render);
          });
    });
  }

  /**
   * Get sphinx.
   *
   * @param {Callback} callback
   */

  function getSphinx(callback) {
    if (!modules.rss.status) {
      return callback('RSS is disabled!');
    }

    var options = {};
    options.protocol =
      req.userinfo && req.userinfo.protocol
        ? req.userinfo.protocol
        : config.protocol;
    options.domain =
      req.userinfo && req.userinfo.domain ? req.userinfo.domain : config.domain;
    options.origin =
      req.userinfo && req.userinfo.origin
        ? req.userinfo.origin
        : config.protocol + config.subdomain + config.domain;
    options.content_image = config.default.image;

    var render = {};
    render.config = config;
    render.movies = [];
    var collection = req.query.collection
      ? CP_regexp.str(req.query.collection)
      : '';
    var tag = req.query.tag
      ? { content_tags: CP_regexp.str(req.query.tag) }
      : '';
    var ids = req.query.ids ? req.query.ids : '';

    if (modules.content.status && collection) {
      CP_get.contents({ content_url: collection }, function(err, contents) {
        if (err) {
          return callback(err);
        }
        if (contents && contents.length && contents[0].movies) {
          var query_id = [];
          contents[0].movies.forEach(function(item, i, arr) {
            query_id.push(item + '^' + (parseInt(arr.length) - parseInt(i)));
          });
          var query = { query_id: query_id.join('|') };
          CP_get.movies(
            query,
            contents[0].movies.length,
            '',
            1,
            true,
            options,
            function(err, movies) {
              if (err) {
                return callback(err);
              }

              render.movies = sortingIds(query_id, movies);
              callback(null, render);
            }
          );
        } else {
          return callback('Collection is empty!');
        }
      });
    } else if (config.index.ids.keys && ids) {
      var items = (ids.replace(/[0-9,\s]/g, '')
        ? config.index.ids.keys
        : ids.replace(/[^0-9,]/g, '')
      )
        .split(',')
        .map(function(key) {
          return parseInt(key.trim());
        });
      if (items && items.length) {
        var query_id = [];
        items.forEach(function(item, i, arr) {
          query_id.push(item + '^' + (arr.length - i));
        });
        var query = { query_id: query_id.join('|') };
        CP_get.movies(query, items.length, '', 1, true, options, function(
          err,
          movies
        ) {
          if (err) {
            return callback(err);
          }

          render.movies = sortingIds(query_id, movies);
          callback(null, render);
        });
      } else {
        return callback('No data!');
      }
    } else if (modules.content.status && tag) {
      CP_get.contents(tag, 100, 1, true, options, function(err, contents) {
        if (err) return callback(err);

        if (contents && contents.length) {
          render.movies = contents;
          callback(null, render);
        } else {
          return callback('Tag does not exist!');
        }
      });
    } else {
      CP_get.publishIds(true, function(err, ids) {
        if (err) {
          return callback(err);
        } else if (!ids) {
          return callback('Publication is over!');
        }
        render.movies = ids.movies;
        callback(null, render);
      });
    }
  }

  /**
   * Render data.
   *
   * @param {Object} err
   * @param {Object} render
   */

  function renderData(err, render) {
    if (err) {
      console.log('[routes/rss.js] Error:', url, err);

      return next({
        status: 404,
        message: err
      });
    }

    if (typeof render === 'object') {
      if (req.query.json) {
        res.json(render);
      } else {
        if (
          render.movies &&
          render.movies.length &&
          config.publish.indexing.condition
        ) {
          var condition = _eval(
            'module.exports=function(movie){return !!(' +
              config.publish.indexing.condition.toString() +
              ');}'
          );
          render.movies = render.movies.filter(function(movie) {
            return !condition(movie);
          });
        }
        res.header('Content-Type', 'application/xml');
        res.render('desktop/rss', render, function(err, html) {
          if (err) console.log('[renderData] Render Error:', err);

          res.send(html);

          if (config.cache.time && html) {
            CP_cache.set(urlHash, html, config.cache.time, function(err) {});
          }
        });
      }
    } else {
      res.header('Content-Type', 'application/xml');
      res.send(render);
    }
  }
});

/**
 * Sort films are turned by id list.
 *
 * @param {Object} ids
 * @param {Object} movies
 * @return {Array}
 */

function sortingIds(ids, movies) {
  var result = [];
  for (var id = 0; id < ids.length; id++) {
    for (var i = 0; i < movies.length; i++) {
      if (parseInt(movies[i].kp_id) === parseInt(('' + ids[id]).trim())) {
        result.push(movies[i]);
      }
    }
  }
  return result;
}

module.exports = router;
