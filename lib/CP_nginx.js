'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');

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
      config.redirect.from.length === config.redirect.to.length
        ? config.redirect.from.indexOf(originalUrl)
        : -1;
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
    } else if (redirect + 1) {
      return next({
        status: 301,
        message: config.redirect.to[redirect]
      });
    } else {
      return next();
    }
  };
};
