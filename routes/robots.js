'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');

/**
 * Node dependencies.
 */

var express = require('express');
var router = express.Router();

/**
 * Robots.
 */

router.get('/?', function(req, res) {
  res.header('Content-Type', 'text/plain');

  res.send(
    config.codes.robots +
      '\n\n' +
      'Sitemap: ' +
      config.protocol +
      config.subdomain +
      config.domain +
      '/' +
      config.urls.sitemap
  );
});

module.exports = router;
