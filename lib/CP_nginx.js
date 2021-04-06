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

var path = require('path');

module.exports = function() {
  return function(req, res, next) {
    var originalUrl = '';
    try {
      originalUrl = decodeURIComponent(req.originalUrl);
    } catch (e) {}
    var redirect =
      originalUrl &&
      config.redirect &&
      config.redirect.from &&
      config.redirect.from.length === config.redirect.to.length
        ? config.redirect.from.indexOf(originalUrl)
        : -1;
    var redirect_to = redirect + 1 ? config.redirect.to[redirect] : '';
    if (
      !redirect_to &&
      config.redirect &&
      config.redirect.from &&
      config.redirect.from.length
    ) {
      config.redirect.from.forEach(function(url, i) {
        if (redirect_to || url.indexOf('*') === -1 || !config.redirect.to[i])
          return;
        var url_regex = new RegExp('^' + url + '$', 'i');
        if (url_regex.test(originalUrl)) {
          redirect_to = originalUrl.replace(url_regex, config.redirect.to[i]);
        }
      });
    }
    var admin = /^\/admin$/i.test(req.originalUrl);
    var balancer = /\/balancer\/[0-9]{1,10}\.mp4/i.test(req.originalUrl);
    var forbidden = /^\/(tv-version\/|mobile-version\/|)(doc|Dockerfile|config|modules|node_modules|lib|log|routes|core|app\.js|optimal\.js|package\.json|package-lock\.json|process\.json|restart\.server|LICENSE\.txt|README\.md|.*\.sh|.*\.conf|.*\.log|.*\.jade|.*\.ejs|\.git)($|\/)/i.test(
      req.originalUrl
    );
    if (admin) {
      return res.render('secret', {
        search: config.urls.search,
        status: 401,
        message: /^admin-secret$/i.test(config.urls.admin) ? 'secret' : '',
        language: config.language
      });
    } else if (forbidden) {
      return res.status(404).render('error', {
        search: config.urls.search,
        status: 404,
        message: config.l.notFound,
        language: config.language
      });
    } else if (balancer) {
      return res.sendFile(
        path.join(
          path.dirname(__filename),
          '..',
          '..',
          '..',
          'var',
          'local',
          'balancer',
          'bbb.mp4'
        )
      );
    } else if (redirect_to) {
      return next({
        status: 301,
        message: redirect_to
      });
    } else {
      return next();
    }
  };
};
