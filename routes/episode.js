'use strict';

/**
 * Module dependencies.
 */

var CP_get = require('../lib/CP_get');
var CP_tv = require('../modules/CP_tv');
var CP_translit = require('../lib/CP_translit');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../config/production/config.backup'));
var modules = require('../config/production/modules');
Object.keys(modules).length === 0 &&
  (modules = require('../config/production/modules.backup'));

/**
 * Node dependencies.
 */

var adop = require('adop');
var LRU = require('lru-cache');
var cache = new LRU({
  maxAge: 3600000,
  max: 1000,
  length: function(n, key) {
    return (
      (new TextEncoder().encode(JSON.stringify(n)).length + key.length) / 1024
    );
  }
});
var md5 = require('md5');
var async = require('async');
var request = require('request');
var express = require('express');
var router = express.Router();

/**
 * Callback.
 *
 * @callback Callback
 * @param {Object} err
 * @param {Object} [render]
 */

/**
 * List episodes.
 */

router.get('/?', function(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (!req.query.id) return res.status(404).json({ error: '404' });

  if (!cache.has('CP_VER') || cache.get('CP_VER') !== process.env['CP_VER']) {
    cache.reset();
    cache.set('CP_VER', process.env['CP_VER']);
  }

  var kp_id = parseInt(req.query.id) ? [parseInt(req.query.id)] : [];
  var tv = typeof req.query.tv !== 'undefined';

  var host = req.get('host');
  var port =
    /:[0-9]{1,5}$/.test(host) && !/:80$/.test(host) && !/:443$/.test(host)
      ? ':' + host.split(':')[1]
      : '';

  if (/^\/tv-version/i.test(req.originalUrl)) {
    req.userinfo.domain =
      (modules.tv.data.subdomain ? 'tv.' : config.subdomain) +
      config.domain +
      port +
      (modules.tv.data.subdomain ? '' : '/tv-version');
  } else if (/^\/mobile-version/i.test(req.originalUrl)) {
    req.userinfo.domain =
      (modules.mobile.data.subdomain ? 'm.' : config.subdomain) +
      config.domain +
      port +
      (modules.mobile.data.subdomain ? '' : '/mobile-version');
  } else {
    req.userinfo.domain = config.subdomain + config.domain + port;
  }

  var options = {};
  options.origin = config.protocol + req.userinfo.domain;
  options.domain = req.userinfo.domain;
  options.port = port;

  var serials = {};

  async.eachOfLimit(
    modules.episode.data.custom,
    1,
    function(task, index, callback) {
      CP_get.movies({ query_id: kp_id }, 1, '', 1, true, options, function(
        err,
        movies
      ) {
        if (err || !movies || !movies.length) return callback();
        var movie = movies[0];
        var parse = task.replace(/\s*~\s*/g, '~').split('~');
        if (task.charAt(0) === '#' || parse.length < 3) {
          return callback();
        }
        var params = {
          url: parse[0],
          season: parse[1],
          episode: parse[2]
        };
        if (parse[3]) {
          params.translate = parse[3];
        }
        params.url = params.url
          .replace(
            /\[kp_id]/,
            movie.kp_id && parseInt(movie.kp_id)
              ? '' + (parseInt(movie.kp_id) % 1000000000)
              : ''
          )
          .replace(/\[imdb_id]/, movie.imdb_id ? movie.imdb_id : '')
          .replace(/\[tmdb_id]/, movie.tmdb_id ? movie.tmdb_id : '')
          .replace(/\[douban_id]/, movie.douban_id ? movie.douban_id : '')
          .replace(/\[tvmaze_id]/, movie.tvmaze_id ? movie.tvmaze_id : '')
          .replace(/\[wa_id]/, movie.wa_id ? movie.wa_id : '')
          .replace(/\[movie_id]/, movie.movie_id ? movie.movie_id : '');
        var hash = md5(
          JSON.stringify(params) + options.origin + process.env['CP_VER']
        );
        if (cache.has(hash)) {
          serials = cache.get(hash);
          return callback();
        }
        var group = 'season.episode';
        var obj = [
          {
            name: 'season',
            path: parse[1],
            type: 'number'
          },
          {
            name: 'episode',
            path: parse[2],
            type: 'number'
          }
        ];
        if (parse[3]) {
          group = 'translate.season.episode';
          obj.push({
            name: 'translate',
            path: parse[3],
            type: 'string'
          });
        }
        request(
          {
            url: params.url,
            method: 'GET',
            timeout: 15000
          },
          function(error, response, body) {
            if (error || response.statusCode !== 200 || !body) {
              return callback();
            }
            serials = adop(tryParseJSON(body), obj, group);
            if (group === 'season.episode') {
              serials = {
                '': serials
              };
            }
            Object.keys(serials).forEach(function(translate) {
              Object.keys(serials[translate]).forEach(function(season) {
                Object.keys(serials[translate][season]).forEach(function(
                  episode
                ) {
                  serials[translate][season][episode] = {
                    kp_id: movie.kp_id,
                    title: movie.title,
                    title_ru: movie.title_ru,
                    title_en: movie.title_en,
                    poster: movie.poster,
                    season: season + ' ' + modules.episode.data.season,
                    episode: episode + ' ' + modules.episode.data.episode,
                    translate: translate
                      ? modules.episode.data.translate + ' ' + translate
                      : '',
                    pathname:
                      movie.pathname +
                      '/s' +
                      season +
                      'e' +
                      episode +
                      (translate
                        ? '_' +
                          CP_translit.text(translate, undefined, 'translate')
                        : ''),
                    url:
                      movie.url +
                      '/s' +
                      season +
                      'e' +
                      episode +
                      (translate
                        ? '_' +
                          CP_translit.text(translate, undefined, 'translate')
                        : '')
                  };
                });
              });
            });
            cache.set(hash, serials);
            callback();
          }
        );
      });
    },
    function() {
      if (
        serials &&
        Object.keys(serials).length &&
        (typeof serials[''] === 'undefined' || Object.keys(serials['']).length)
      ) {
        return res.json(tv ? CP_tv.episode(serials, options) : serials);
      } else {
        return res.status(404).json({ error: 'NO EPISODES' });
      }
    }
  );

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
});

module.exports = router;
