'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../config/production/config.backup'));

/**
 * Node dependencies.
 */

var express = require('express');
var router = express.Router();

/**
 * Robots.
 */

router.get('/?', function(req, res) {
  res.header('Content-Type', 'application/xml');

  res.send(
    '<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">' +
      '  <ShortName>' +
      config.domain +
      '</ShortName>' +
      '  <Description>' +
      config.titles.index +
      '</Description>' +
      '  <Image width="16" height="16" type="image/x-icon">' +
      (req.userinfo && req.userinfo.origin
        ? req.userinfo.origin
        : config.protocol + config.subdomain + config.domain) +
      '/favicon.ico</Image>' +
      '  <Url type="text/html" template="' +
      (req.userinfo && req.userinfo.origin
        ? req.userinfo.origin
        : config.protocol + config.subdomain + config.domain) +
      '/' +
      config.urls.search +
      '?q={searchTerms}"/>' +
      '  <Url type="application/json" template="' +
      (req.userinfo && req.userinfo.origin
        ? req.userinfo.origin
        : config.protocol + config.subdomain + config.domain) +
      '/' +
      config.urls.search +
      '?q={searchTerms}&amp;json=1"/>' +
      '<OutputEncoding>utf-8</OutputEncoding>' +
      '<InputEncoding>utf-8</InputEncoding>' +
      '</OpenSearchDescription>'
  );
});

module.exports = router;
