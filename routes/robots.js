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

var express = require('express');
var router = express.Router();
var url = require('url');

/**
 * Robots.
 */

router.get('/?', function(req, res) {
  res.header('Content-Type', 'text/plain');

  var protocol;

  if (req.protocol === 'http') {
    if (
      req.get('x-cloudflare-proto') &&
      req.get('x-cloudflare-proto').toLowerCase() === 'https'
    ) {
      protocol = 'https';
    } else {
      protocol = 'http';
    }
  } else {
    protocol = 'https';
  }

  var host = req.get('host');
  var host_domain = url.parse(protocol + '://' + host).hostname;

  if (
    (config.bomain && host_domain === config.subdomain + config.domain) ||
    (config.bomain && host_domain === config.ru.subdomain + config.ru.domain) ||
    (!req.userinfo.bot.main && !config.user_bot)
  ) {
    res.send('User-agent: *\nDisallow: /');
  } else {
    res.send(
      config.codes.robots +
        '\n\n' +
        'Sitemap: ' +
        (req.userinfo && req.userinfo.origin
          ? req.userinfo.origin
          : config.protocol + config.subdomain + config.domain) +
        '/' +
        config.urls.sitemap
    );
  }
});

module.exports = router;
