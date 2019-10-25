'use strict';

/**
 * Module dependencies.
 */

var CP_get = require('../lib/CP_get.min');
var CP_player = require('../modules/CP_player');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
var modules = require('../config/production/modules');

/**
 * Node dependencies.
 */

var express = require('express');
var router = express.Router();

/**
 * Iframe code.
 */

router.get('/:id?/:title?', function(req, res) {
  var kinopoisk = req.params.id ? ('' + req.params.id).replace(/\D/g, '') : '';
  var title = req.params.title ? req.params.title.replace(/"/g, "'") : '';
  var autoplay = req.query.autoplay
    ? ('' + req.query.autoplay).replace(/\D/g, '')
    : '';

  if (kinopoisk && title) {
    res.send(
      '<!DOCTYPE html><html><body>' +
        '<style>body,html{border:0;padding:0;margin:0;width:100%;height:100%;overflow:hidden}</style>' +
        '<div id="yohoho" ' +
        'data-kinopoisk="' +
        kinopoisk +
        '" ' +
        'data-title="' +
        title +
        '" ' +
        'data-player="' +
        (modules.player.data.yohoho.player || '') +
        '" ' +
        'data-bg="' +
        (modules.player.data.yohoho.bg || '') +
        '" ' +
        'data-country="' +
        (config.country || '') +
        '" ' +
        'data-language="' +
        (config.language || '') +
        '" ' +
        'data-moonwalk="' +
        (modules.player.data.moonwalk.token || '') +
        '" ' +
        'data-hdgo="' +
        (modules.player.data.hdgo.token || '') +
        '" ' +
        'data-videocdn="' +
        (modules.player.data.videocdn.token || '') +
        '" ' +
        'data-hdvb="' +
        (modules.player.data.hdvb.token || '') +
        '" ' +
        'data-youtube="' +
        (modules.player.data.youtube.token || '') +
        '" ' +
        'data-kodik="' +
        (modules.player.data.kodik.token || '') +
        '" ' +
        'data-collaps="' +
        (modules.player.data.collaps.token || '') +
        '" ' +
        'data-autoplay="' +
        autoplay +
        '" ' +
        '></div>' +
        '<script data-cfasync="false" src="//cdn.jsdelivr.net/gh/4h0y/4h0y.github.io/yo.js"></script>' +
        '</body></html>'
    );
  } else if (kinopoisk) {
    CP_get.movies({ query_id: req.params.id }, 1, '', 1, false, function(
      err,
      movies
    ) {
      if (err) return res.status(404).send(err);

      if (movies && movies.length) {
        if (movies[0] && movies[0].player) {
          var player = CP_player.code('movie', movies[0]);
          return res.send(
            '<!DOCTYPE html><html>' +
              '<head>' +
              (player.head || '') +
              '</head>' +
              '<body>' +
              '<style>body,html{border:0;padding:0;margin:0;width:100%;height:100%;overflow:hidden}</style>' +
              (player.player || '') +
              (player.footer || '') +
              '</body></html>'
          );
        }
        var custom = {};
        var imdb = '';
        var tmdb = '';
        try {
          custom = JSON.parse(movies[0].custom);
          imdb = custom.imdb_id || '';
          tmdb = custom.tmdb_id || '';
        } catch (e) {
          console.error(e);
        }
        title =
          (movies[0].title_ru || movies[0].title_en) +
          ' (' +
          movies[0].year +
          ')';
        title = title.replace(/"/g, "'");
        res.send(
          '<!DOCTYPE html><html><body>' +
            '<style>body,html{border:0;padding:0;margin:0;width:100%;height:100%;overflow:hidden}</style>' +
            '<div id="yohoho" ' +
            'data-kinopoisk="' +
            kinopoisk +
            '" ' +
            'data-imdb="' +
            imdb +
            '" ' +
            'data-tmdb="' +
            tmdb +
            '" ' +
            'data-videospider_tv="' +
            ('' + movies[0].type === '1' ? '1' : '0') +
            '" ' +
            'data-title="' +
            title +
            '" ' +
            'data-trailer="' +
            (modules.player.data.yohoho.trailer || '') +
            '" ' +
            'data-player="' +
            (modules.player.data.yohoho.player || '') +
            '" ' +
            'data-bg="' +
            (modules.player.data.yohoho.bg || '') +
            '" ' +
            'data-country="' +
            (config.country || '') +
            '" ' +
            'data-language="' +
            (config.language || '') +
            '" ' +
            'data-moonwalk="' +
            (modules.player.data.moonwalk.token || '') +
            '" ' +
            'data-hdgo="' +
            (modules.player.data.hdgo.token || '') +
            '" ' +
            'data-videocdn="' +
            (modules.player.data.videocdn.token || '') +
            '" ' +
            'data-hdvb="' +
            (modules.player.data.hdvb.token || '') +
            '" ' +
            'data-youtube="' +
            (modules.player.data.youtube.token || '') +
            '" ' +
            'data-kodik="' +
            (modules.player.data.kodik.token || '') +
            '" ' +
            'data-collaps="' +
            (modules.player.data.collaps.token || '') +
            '" ' +
            'data-autoplay="' +
            autoplay +
            '" ' +
            '></div>' +
            '<script data-cfasync="false" src="//cdn.jsdelivr.net/gh/4h0y/4h0y.github.io/yo.js"></script>' +
            '</body></html>'
        );
      } else {
        res.status(404).send(config.l.notFound);
      }
    });
  } else {
    res.status(404).send(config.l.notFound);
  }
});

module.exports = router;
