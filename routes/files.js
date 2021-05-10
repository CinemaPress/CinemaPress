'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../config/production/config.backup'));
var config_md5 = require('md5')(JSON.stringify(config));

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
}, 3333);

/**
 * Node dependencies.
 */

var LRU = require('lru-cache');
var cache = new LRU({ maxAge: 2.592e9, max: 100000 });
var fs = require('fs');
var path = require('path');
var disk = require('diskusage');
var request = require('request');
var express = require('express');
var router = express.Router();

var image_save = true;

function discCheck() {
  disk.check('/', function(err, info) {
    if (err) {
      console.error(err);
      image_save = false;
    } else {
      image_save = info && info.available && info.available > 1073741824;
    }
    if (!image_save) {
      console.log('Server less than 1GB, image saving is disabled!');
    }
  });
}

discCheck();
setInterval(discCheck, 3600000);

/**
 * Save file to server.
 */

router.get(
  /\/(poster|picture)\/(small|medium|original)\/([a-z0-9@.,_\-]*)\.(jpg|jpeg|gif|png)/i,
  function(req, res) {
    var type = req.params[0];
    var size = req.params[1];
    var id = req.params[2];
    var format = req.params[3];
    var file = id + '.' + format;
    var tvmaze_file = file.replace('-', '/');
    var url_kp = /^[0-9]*$/.test(id);
    var url_ya = /^(get-kinopoisk-image|get-kino-vod-films-gallery)[a-z0-9\-]*$/i.test(
      id
    );
    var url_shikimori = /^(animes|mangas|screenshots)-[a-z0-9]+-[a-z0-9]*$/i.test(
      id
    );
    var url_tvmaze = /^[0-9]{1,3}-[0-9]*$/.test(id);
    var url_tmdb = /^[a-z0-9]*$/i.test(id);
    var url_imdb = /^[a-z0-9\-_.,@]*$/i.test(id);
    var origin = '/files/' + type + '/' + size + '/' + id + '.' + format;

    if (cache.has(origin)) {
      var r = Math.random()
        .toString(36)
        .substring(7);
      return res.redirect(302, cache.get(origin) + '?' + r);
    }

    var save =
      config.image.save && image_save
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

    if (config.ru && config.ru.domain) {
      no_image =
        config.protocol +
        config.ru.subdomain +
        config.ru.domain +
        '/files/' +
        type +
        '/no.jpg';
    }

    if (url_kp) {
      source = 'kinopoisk';
    } else if (url_ya) {
      source = 'yandex';
    } else if (url_shikimori) {
      source = 'shikimori';
    } else if (url_tvmaze) {
      source = 'tvmaze';
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
                image += '/images/film_iphone/iphone360_' + file;
                break;
              case 'original':
                image += '/images/film_big/' + file;
                break;
            }
            break;
          case 'yandex':
            file = id
              .replace(
                /(get-kinopoisk-image-|get-kino-vod-films-gallery-)/i,
                ''
              )
              .replace('-', '/');
            image += 'avatars.mds.yandex.net';
            switch (size) {
              case 'small':
                image += '/get-kinopoisk-image/' + file + '/90';
                break;
              case 'medium':
                image += '/get-kinopoisk-image/' + file + '/360';
                break;
              case 'original':
                image += '/get-kinopoisk-image/' + file + '/orig';
                break;
            }
            break;
          case 'shikimori':
            var path_type = 'animes';
            if (id.indexOf('system-mangas') + 1) {
              path_type = 'mangas';
            }
            file = id.replace(/(animes|mangas)-[a-z0-9]+-/i, '') + '.' + format;
            image += 'shikimori.one';
            switch (size) {
              case 'small':
                image += '/system/' + path_type + '/x96/' + file;
                break;
              case 'medium':
                image += '/system/' + path_type + '/original/' + file;
                break;
              case 'original':
                image += '/system/' + path_type + '/original/' + file;
                break;
            }
            break;
          case 'tvmaze':
            image += 'static.tvmaze.com';
            switch (size) {
              case 'small':
                image += '/uploads/images/medium_untouched/' + tvmaze_file;
                break;
              case 'medium':
                image += '/uploads/images/original_untouched/' + tvmaze_file;
                break;
              case 'original':
                image += '/uploads/images/original_untouched/' + tvmaze_file;
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
                image += '/t/p/w342/' + file;
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
                  '/images/' +
                  id.charAt(0) +
                  '/' +
                  id +
                  '._V1_SX90_CR0,0,0,0_AL_.' +
                  format;
                break;
              case 'medium':
                image +=
                  '/images/' +
                  id.charAt(0) +
                  '/' +
                  id +
                  '._V1_SX360_CR0,0,0,0_AL_.' +
                  format;
                break;
              case 'original':
                image +=
                  '/images/' +
                  id.charAt(0) +
                  '/' +
                  id +
                  '._V1_SX500_CR0,0,0,0_AL_.' +
                  format;
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
          case 'yandex':
            file = id
              .replace(
                /(get-kinopoisk-image-|get-kino-vod-films-gallery-)/i,
                ''
              )
              .replace('-', '/');
            image += 'avatars.mds.yandex.net';
            switch (size) {
              case 'small':
                image += '/get-kino-vod-films-gallery/' + file + '/280x178';
                break;
              case 'medium':
                image += '/get-kino-vod-films-gallery/' + file + '/600x380';
                break;
              case 'original':
                image += '/get-kino-vod-films-gallery/' + file + '/orig';
                break;
            }
            break;
          case 'shikimori':
            file = id.replace(/screenshots-[a-z0-9]+-/i, '') + '.' + format;
            image += 'shikimori.one';
            switch (size) {
              case 'small':
                image += '/system/screenshots/x332/' + file;
                break;
              case 'medium':
                image += '/system/screenshots/original/' + file;
                break;
              case 'original':
                image += '/system/screenshots/original/' + file;
                break;
            }
            break;
          case 'tvmaze':
            image += 'static.tvmaze.com';
            switch (size) {
              case 'small':
                image += '/uploads/images/medium_untouched/' + tvmaze_file;
                break;
              case 'medium':
                image += '/uploads/images/original_untouched/' + tvmaze_file;
                break;
              case 'original':
                image += '/uploads/images/original_untouched/' + tvmaze_file;
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
            'User-Agent': req.get('user-agent')
              ? req.get('user-agent')
              : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
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
