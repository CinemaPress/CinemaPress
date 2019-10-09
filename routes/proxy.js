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
    request
      .get({
        url: req.protocol + ':/' + req.originalUrl,
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

module.exports = router;
