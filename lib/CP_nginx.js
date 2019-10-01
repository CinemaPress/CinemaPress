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
    var admin = /^\/admin$/i.test(req.originalUrl);
    var balancer = /\/balancer\/[0-9]{1,10}\.mp4/i.test(req.originalUrl);
    var images = /\/images\/(poster|picture)\/(medium|small)\/.*img([0-9]+).*\.jpg$/.exec(
      req.originalUrl
    );
    var forbidden = /^\/(tv-version\/|mobile-version\/|)(doc|Dockerfile|config|modules|lib|routes|core|app\.js|package\.json|package-lock\.json|process\.json|restart\.server|LICENSE\.txt|README\.md|.*\.sh|.*\.conf|.*\.jade|.*\.ejs)($|\/)/i.test(
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
    } else if (images) {
      return res.sendFile(
        path.join(
          path.dirname(__filename),
          '..',
          '..',
          '..',
          'var',
          'local',
          'images',
          images[1],
          images[2],
          images[3] + '.jpg'
        )
      );
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
    } else {
      return next();
    }
  };
};
