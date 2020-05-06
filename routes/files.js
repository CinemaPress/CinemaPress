'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');

/**
 * Node dependencies.
 */

var LRU = require('lru-cache');
var cache = new LRU({ maxAge: 2.592e9 });
var fs = require('fs');
var path = require('path');
var request = require('request');
var express = require('express');
var router = express.Router();

/**
 * Save file to server.
 */

router.get(
  /\/(poster|picture)\/(small|medium|original)\/([a-z0-9@.,_\-]*)\.(jpg|png)/i,
  function(req, res) {
    var type = req.params[0];
    var size = req.params[1];
    var id = req.params[2];
    var format = req.params[3];
    var file = id + '.' + format;
    var url_kp = /^[0-9]*$/.test(id);
    var url_tmdb = /^[a-z0-9]*$/i.test(id);
    var url_imdb = /^[a-z0-9\-_.,@]*$/i.test(id);
    var origin = '/files/' + type + '/' + size + '/' + file;

    if (cache.has(origin)) {
      var r = Math.random()
        .toString(36)
        .substring(7);
      return res.redirect(302, cache.get(origin) + '?' + r);
    }

    var save = config.image.save
      ? path.join(path.dirname(__filename), '..', origin)
      : false;
    var no_image =
      config.protocol +
      config.subdomain +
      config.domain +
      '/files/' +
      type +
      '/no.jpg';
    var source = false;

    if (url_kp) {
      source = 'kinopoisk';
    } else if (url_tmdb) {
      source = 'tmdb';
    } else if (url_imdb) {
      source = 'imdb';
    }

    if (!source) {
      return res.redirect(302, no_image);
    }

    var image = 'https://';

    switch (type) {
      case 'poster':
        switch (source) {
          case 'kinopoisk':
            image += 'st.kp.yandex.net';
            switch (size) {
              case 'small':
                image += '/images/film_iphone/iphone90_' + file;
                break;
              case 'medium':
                image += '/images/film_iphone/iphone180_' + file;
                break;
              case 'original':
                image += '/images/film_big/' + file;
                break;
            }
            break;
          case 'tmdb':
            image += 'image.tmdb.org';
            switch (size) {
              case 'small':
                image += '/t/p/w92/' + file;
                break;
              case 'medium':
                image += '/t/p/w185/' + file;
                break;
              case 'original':
                image += '/t/p/original/' + file;
                break;
            }
            break;
          case 'imdb':
            image += 'm.media-amazon.com';
            switch (size) {
              case 'small':
                image +=
                  '/images/M/' + id + '._V1_SX90_CR0,0,0,0_AL_.' + format;
                break;
              case 'medium':
                image +=
                  '/images/M/' + id + '._V1_SX180_CR0,0,0,0_AL_.' + format;
                break;
              case 'original':
                image +=
                  '/images/M/' + id + '._V1_SX300_CR0,0,0,0_AL_.' + format;
                break;
            }
            break;
        }
        break;
      case 'picture':
        switch (source) {
          case 'kinopoisk':
            image += 'st.kp.yandex.net';
            switch (size) {
              case 'small':
                image += '/images/kadr/sm_' + file;
                break;
              case 'medium':
                image += '/images/kadr/' + file;
                break;
              case 'original':
                image += '/images/kadr/' + file;
                break;
            }
            break;
          case 'tmdb':
            image += 'image.tmdb.org';
            switch (size) {
              case 'small':
                image += '/t/p/w300/' + file;
                break;
              case 'medium':
                image += '/t/p/w1280/' + file;
                break;
              case 'original':
                image += '/t/p/original/' + file;
                break;
            }
            break;
          case 'imdb':
            image += 'm.media-amazon.com';
            switch (size) {
              case 'small':
                image +=
                  '/images/M/' + id + '._V1_SY300_CR0,0,0,0_AL_.' + format;
                break;
              case 'medium':
                image +=
                  '/images/M/' + id + '._V1_SY1200_CR0,0,0,0_AL_.' + format;
                break;
              case 'original':
                image +=
                  '/images/M/' + id + '._V1_SX2400_CR0,0,0,0_AL_.' + format;
                break;
            }
            break;
        }
        break;
    }

    if (!save) {
      return res.redirect(302, image);
    }

    request.head(image, function(error, info) {
      if (
        error ||
        !info ||
        !info.headers ||
        !info.headers['content-type'] ||
        !info.headers['content-length'] ||
        !/image/i.test(info.headers['content-type']) ||
        parseInt(info.headers['content-length']) < 1375
      ) {
        cache.set(origin, no_image);
        return res.redirect(302, no_image);
      }

      request
        .get({
          url: image,
          timeout: 1000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
              'AppleWebKit/537.36 (KHTML, like Gecko) ' +
              'Chrome/79.0.' +
              (Math.floor(Math.random() * 600) + 1) +
              '.100 Safari/537.36'
          }
        })
        .on('error', function(err) {
          console.error(err && err.message, req.originalUrl);
          cache.set(origin, no_image);
          return res.redirect(302, no_image);
        })
        .on('response', function(response) {
          if (response.statusCode === 200) {
            var contentType =
              response.headers && response.headers['content-type'];
            if (contentType) {
              res.setHeader('Content-Type', contentType);
            }
            var writeStream = fs.createWriteStream(save);
            response.pipe(writeStream);
            response.pipe(res);
            writeStream.on('error', function(err) {
              console.log('NOT SAVE', save, err);
              fs.unlinkSync(save);
            });
          }
        })
        .on('close', function() {
          cache.set(origin, origin);
        });
    });
  }
);

module.exports = router;
