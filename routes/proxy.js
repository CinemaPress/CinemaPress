'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');

/**
 * Node dependencies.
 */

var request = require('request');
var express = require('express');
var router = express.Router();

/**
 * Proxy.
 */

router.get(
  /(\/t\/p\/(w92|w185|w300|w1280|original)|\/images\/(film_iphone|film_big|kadr))\/[a-z0-9\-_]*\.jpg/i,
  function(req, res) {
    req.userinfo = {};

    if (req.protocol === 'http') {
      if (
        req.get('x-cloudflare-proto') &&
        req.get('x-cloudflare-proto').toLowerCase() === 'https'
      ) {
        req.userinfo.protocol = 'https';
      } else {
        req.userinfo.protocol = 'http';
      }
    } else {
      req.userinfo.protocol = 'https';
    }

    request
      .get({
        url: req.userinfo.protocol + ':/' + req.originalUrl,
        timeout: 1000,
        agent: false,
        pool: { maxSockets: 100 }
      })
      .on('error', function(err) {
        console.error(err.message || err, req.originalUrl);
        return res.redirect(
          302,
          config.protocol +
            config.subdomain +
            config.domain +
            '/files/poster/no-poster.jpg'
        );
      })
      .pipe(res);
  }
);

router.get('/avatar/:id.svg', function(req, res) {
  req.userinfo = {};

  if (req.protocol === 'http') {
    if (
      req.get('x-cloudflare-proto') &&
      req.get('x-cloudflare-proto').toLowerCase() === 'https'
    ) {
      req.userinfo.protocol = 'https';
    } else {
      req.userinfo.protocol = 'http';
    }
  } else {
    req.userinfo.protocol = 'https';
  }

  request
    .get({
      url:
        'https://avatars.dicebear.com/v2/avataaars/' +
        encodeURIComponent(req.params.id) +
        '.svg',
      timeout: 1000,
      agent: false,
      pool: { maxSockets: 100 }
    })
    .on('error', function(err) {
      console.error(err.message || err, req.originalUrl);
      return res.redirect(
        302,
        config.protocol +
          config.subdomain +
          config.domain +
          '/files/poster/no-avatar.svg'
      );
    })
    .pipe(res);
});

module.exports = router;
