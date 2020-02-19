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

router.get('/:id', function(req, res) {
  var id = req.params.id ? ('' + req.params.id).replace(/[^0-9]/g, '') : '';

  var data = modules.player.data.yohoho
    ? JSON.parse(modules.player.data.yohoho)
    : {};

  var parameters = '';
  data['data-kinopoisk'] = id ? id : '';
  data['data-title'] = req.query.title
    ? req.query.title.replace(/"/g, "'")
    : '';
  data['data-autoplay'] = req.query.autoplay ? req.query.autoplay : '';

  if (id && req.query.title) {
    for (var dkey in data) {
      if (data.hasOwnProperty(dkey) && data[dkey]) {
        data[dkey] = ('' + data[dkey]).trim();
        parameters += ' ' + dkey + '="' + encodeURIComponent(data[dkey]) + '"';
      }
    }
    res.send(
      '<!DOCTYPE html><html lang="' +
        config.language +
        '"><body>' +
        '<style>body,html{border:0;padding:0;margin:0;width:100%;height:100%;overflow:hidden}</style>' +
        '<div id="yohoho" ' +
        parameters +
        '></div>' +
        '<script data-cfasync="false" src="https://4h0y.gitlab.io/yo.js"></script>' +
        '</body></html>'
    );
  } else if (id) {
    CP_get.movies({ query_id: id }, 1, '', 1, false, function(err, movies) {
      if (err) return res.status(404).send(err);
      if (movies && movies.length) {
        if (movies[0] && movies[0].player) {
          var player = CP_player.code('movie', movies[0]);
          return res.send(
            '<!DOCTYPE html><html lang="' +
              config.language +
              '">' +
              '<head>' +
              '<title>' +
              id +
              '</title>' +
              (player.head || '') +
              '</head>' +
              '<body>' +
              '<style>body,html{border:0;padding:0;margin:0;width:100%;height:100%;overflow:hidden}</style>' +
              (player.player || '') +
              (player.footer || '') +
              '</body></html>'
          );
        }
        try {
          var custom = JSON.parse(movies[0].custom);
          data['data-imdb'] = custom.imdb_id ? custom.imdb_id : '';
          data['data-tmdb'] = custom.tmdb_id ? custom.tmdb_id : '';
        } catch (e) {
          console.error(e);
        }
        data['data-title'] = (
          (movies[0].title_ru || movies[0].title_en) +
          ' (' +
          movies[0].year +
          ')'
        ).replace(/"/g, "'");
        for (var dkey in data) {
          if (data.hasOwnProperty(dkey) && data[dkey]) {
            data[dkey] = ('' + data[dkey]).trim();
            parameters +=
              ' ' + dkey + '="' + encodeURIComponent(data[dkey]) + '"';
          }
        }
        res.send(
          '<!DOCTYPE html><html lang="' +
            config.language +
            '"><body>' +
            '<style>body,html{border:0;padding:0;margin:0;width:100%;height:100%;overflow:hidden}</style>' +
            '<div id="yohoho" ' +
            parameters +
            '></div>' +
            '<script data-cfasync="false" src="https://4h0y.gitlab.io/yo.js"></script>' +
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
