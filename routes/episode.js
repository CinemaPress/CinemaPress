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
    url:
      modules.episode.data.source === 'iframe'
        ? 'iframe.video'
        : 'streamguard.cc',
    token:
      modules.episode.data.source === 'iframe'
        ? modules.player.data.iframe.token.trim()
        : modules.player.data.moonwalk.token.trim()
  };

  var url = kp_id.length
    ? 'https://' +
      source.url +
      '/api/videos.json?api_token=' +
      source.token +
      '&kinopoisk_id=' +
      kp_id[0]
    : 'https://' +
      source.url +
      '/api/serials_updates.json?api_token=' +
      source.token;

  var type = kp_id.length ? 'serial' : 'serials';

  res.setHeader('Content-Type', 'application/json');

  getReq(url, function(err, list) {
    if (err) return res.status(404).send('{"error": "' + err + '"}');

    if (!kp_id.length && list.updates) {
      list.updates.forEach(function(serial) {
        if (parseInt(serial.serial.kinopoisk_id)) {
          kp_id.push(serial.serial.kinopoisk_id);
        }
      });
    }

    CP_get.additional({ query_id: kp_id }, 'ids', options, function(
      err,
      movies
    ) {
      if (err) return res.status(404).send('{"error": "' + err + '"}');

      if (movies && movies.length) {
        if (type === 'serial') {
          getSerial(list, movies[0], function(err, result) {
            if (err || isEmpty(result[movies[0].kp_id + '_'])) {
              return res
                .status(404)
                .send('{"error": "' + (err || 'Empty') + '"}');
            }
            return res.send(tv ? CP_tv.episode(result, options) : result);
          });
        } else {
          getSerials(list.updates, movies, function(err, result) {
            if (err) {
              return res.status(404).send('{"error": "' + err + '"}');
            }
            return res.send(result);
          });
        }
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
    request(
      { timeout: 500, agent: false, pool: { maxSockets: 100 }, url: url },
      function(error, response, body) {
        var result = body ? tryParseJSON(body) : {};

        if (error || response.statusCode !== 200 || result.error) {
          return callback('Moonwalk/Iframe request error.');
        }

        callback(null, result);
      }
    );
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
        if (serial.type !== 'serial') return callback();

        serial.translator = serial.translator
          ? serial.translator
          : config.l.original;
        serial.translator_id = serial.translator_id ? serial.translator_id : '';

        if (config.language === 'en') {
          if (!/субт|subt|eng/i.test(serial.translator)) {
            return callback();
          }
          serial.translator = 'English';
        }

        serials[movie.kp_id + '_'][serial.translator] = {};

        var serial_episodes =
          'https://' +
          source.url +
          '/api/serial_episodes.json?' +
          'api_token=' +
          source.token +
          '&' +
          'kinopoisk_id=' +
          movie.kp_id +
          '&' +
          'translator_id=' +
          serial.translator_id;

        getReq(serial_episodes, function(err, result) {
          if (err) return callback(err);

          if (
            !result.season_episodes_count ||
            !result.season_episodes_count.length
          )
            return callback();

          result.season_episodes_count.forEach(function(episode) {
            episode.episodes.sort(function(a, b) {
              return parseInt(a) - parseInt(b);
            });
            var episodes = {};

            episode.episodes.forEach(function(e) {
              serial.season = episode.season_number;
              serial.episode = e;

              episodes[e] = structure(serial, movie);
            });

            serials[movie.kp_id + '_'][serial.translator][
              episode.season_number
            ] = episodes;
          });

          callback();
        });
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
   * Get serials data.
   *
   * @param {Object} list
   * @param {Array} movies
   * @param {Callback} callback
   */

  function getSerials(list, movies, callback) {
    var serials = {};

    for (var i = 0, num = list.length; i < num; i++) {
      for (var j = 0, len = movies.length; j < len; j++) {
        if (
          parseInt(list[i].serial.kinopoisk_id) === parseInt(movies[j].kp_id)
        ) {
          var serial_moon = JSON.stringify(list[i].serial) || '';
          serial_moon = JSON.parse(serial_moon) || {};

          var season_num = /season=([0-9]{1,4})/i.exec(
            list[i].episode_iframe_url
          );
          var episode_num = /episode=([0-9]{1,4})/i.exec(
            list[i].episode_iframe_url
          );

          if (!season_num || !episode_num) continue;

          serial_moon.translator = serial_moon.translator
            ? serial_moon.translator
            : config.l.original;
          serial_moon.season = season_num[1];
          serial_moon.episode = episode_num[1];

          serials[movies[j].kp_id + '_'] = serials[movies[j].kp_id + '_']
            ? serials[movies[j].kp_id + '_']
            : {};
          serials[movies[j].kp_id + '_'][serial_moon.translator] = serials[
            movies[j].kp_id + '_'
          ][serial_moon.translator]
            ? serials[movies[j].kp_id + '_'][serial_moon.translator]
            : {};
          serials[movies[j].kp_id + '_'][serial_moon.translator][
            serial_moon.season
          ] = serials[movies[j].kp_id + '_'][serial_moon.translator][
            serial_moon.season
          ]
            ? serials[movies[j].kp_id + '_'][serial_moon.translator][
                serial_moon.season
              ]
            : {};
          serials[movies[j].kp_id + '_'][serial_moon.translator][
            serial_moon.season
          ][serial_moon.episode] = serials[movies[j].kp_id + '_'][
            serial_moon.translator
          ][serial_moon.season][serial_moon.episode]
            ? serials[movies[j].kp_id + '_'][serial_moon.translator][
                serial_moon.season
              ][serial_moon.episode]
            : structure(serial_moon, movies[j]);
        }
      }
    }

    callback(null, serials);
  }

  /**
   * Structure for serial data.
   *
   * @param {Object} serial_moon
   * @param {Object} serial_data
   * @return {Object}
   */

  function structure(serial_moon, serial_data) {
    var season_url = parseInt(serial_moon.season);
    var episode_url = parseInt(serial_moon.episode);
    var translate_url = parseInt(serial_moon.translator_id);

    season_url = season_url <= 9 ? '0' + season_url : season_url;
    episode_url = episode_url <= 9 ? '0' + episode_url : episode_url;
    translate_url = translate_url ? '_' + translate_url : '';

    return {
      title:
        config.language === 'en'
          ? serial_moon.title_en || serial_moon.title_ru
          : serial_moon.title_ru || serial_moon.title_en,
      title_ru: serial_moon.title_ru,
      title_en: serial_moon.title_en,
      kp_id: serial_data.kp_id,
      poster: serial_data.poster,
      translate: modules.episode.data.translate + ' ' + serial_moon.translator,
      translate_id: serial_moon.translator_id,
      season: serial_moon.season + ' ' + modules.episode.data.season,
      episode: serial_moon.episode + ' ' + modules.episode.data.episode,
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
