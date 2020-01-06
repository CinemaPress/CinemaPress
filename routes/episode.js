'use strict';

/**
 * Module dependencies.
 */

var CP_get = require('../lib/CP_get.min');
var CP_tv = require('../modules/CP_tv');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
var modules = require('../config/production/modules');

/**
 * Node dependencies.
 */

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

  if (!req.query.id) return res.status(404).send('{"error": "404"}');

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

  var source = {
    url: 'iframe.video',
    token: modules.player.data.iframe.token.trim()
  };

  var url =
    'https://' +
    source.url +
    '/api/v2/serials?&include=seasons%2Ctranslate&api_token=' +
    source.token +
    '&kp=' +
    kp_id[0];

  getReq(url, function(err, list) {
    if (err) return res.status(404).send('{"error": "' + err + '"}');
    CP_get.additional({ query_id: kp_id }, 'ids', options, function(
      err,
      movies
    ) {
      if (err) return res.status(404).send('{"error": "' + err + '"}');
      if (movies && movies.length) {
        getSerial(list.results, movies[0], function(err, result) {
          if (err || isEmpty(result[movies[0].kp_id + '_'])) {
            return res
              .status(404)
              .send('{"error": "' + (err || 'Empty') + '"}');
          }
          return res.send(tv ? CP_tv.episode(result, options) : result);
        });
      } else {
        return res.status(404).send('{"error": "' + config.l.notFound + '"}');
      }
    });
  });

  /**
   * Get request on url.
   *
   * @param {String} url
   * @param {Callback} callback
   */

  function getReq(url, callback) {
    request({ timeout: 500, agent: false, url: url }, function(
      error,
      response,
      body
    ) {
      var result = body ? tryParseJSON(body) : {};

      if (error || response.statusCode !== 200 || result.error) {
        console.log(url, error.code || '');
        return callback('Iframe request error.');
      }

      callback(null, result);
    });
  }

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

  /**
   * Get serial data.
   *
   * @param {Object} list
   * @param {Object} movie
   * @param {Callback} callback
   */

  function getSerial(list, movie, callback) {
    var serials = {};
    serials[movie.kp_id + '_'] = {};

    async.each(
      list,
      function(serial, callback) {
        if (
          serial.type !== 'serial' ||
          !serial.seasons ||
          !serial.seasons.length
        )
          return callback();

        serial.seasons.forEach(function(season) {
          if (!season.episodes || !season.episodes.length) return;
          season.translate = season.translate
            ? season.translate
            : config.l.original;
          season.translate_id = season.translate_id ? season.translate_id : '';
          if (config.language === 'en') {
            if (!/субт|subt|eng/i.test(season.translate)) {
              return callback();
            }
            season.translate = 'English';
          }
          serials[movie.kp_id + '_'][season.translate] = serials[
            movie.kp_id + '_'
          ][season.translate]
            ? serials[movie.kp_id + '_'][season.translate]
            : {};
          var episodes = {};
          season.episodes.forEach(function(episode) {
            season.season = season.season_num;
            season.episode = episode;
            episodes[episode] = structure(season, movie);
          });
          serials[movie.kp_id + '_'][season.translate][
            season.season
          ] = episodes;
        });
        return callback();
      },
      function(err) {
        if (err) {
          return callback(err);
        }
        callback(null, serials);
      }
    );
  }

  /**
   * Structure for serial data.
   *
   * @param {Object} serial_video
   * @param {Object} serial_data
   * @return {Object}
   */

  function structure(serial_video, serial_data) {
    var season_url = parseInt(serial_video.season);
    var episode_url = parseInt(serial_video.episode);
    var translate_url = parseInt(serial_video.translate_id);

    season_url = season_url <= 9 ? '0' + season_url : season_url;
    episode_url = episode_url <= 9 ? '0' + episode_url : episode_url;
    translate_url = translate_url ? '_' + translate_url : '';

    return {
      title:
        config.language === 'en'
          ? serial_video.title_en || serial_video.title_ru
          : serial_video.title_ru || serial_video.title_en,
      title_ru: serial_video.title_ru,
      title_en: serial_video.title_en,
      kp_id: serial_data.kp_id,
      poster: serial_data.poster,
      translate: modules.episode.data.translate + ' ' + serial_video.translate,
      translate_id: serial_video.translator_id,
      season: serial_video.season + ' ' + modules.episode.data.season,
      episode: serial_video.episode + ' ' + modules.episode.data.episode,
      pathname:
        serial_data.pathname +
        '/s' +
        season_url +
        'e' +
        episode_url +
        translate_url,
      url:
        serial_data.url + '/s' + season_url + 'e' + episode_url + translate_url
    };
  }

  /**
   * Check empty object.
   *
   * @param {Object} obj
   * @return {Boolean}
   */

  function isEmpty(obj) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        return false;
      }
    }
    return true;
  }
});

module.exports = router;
