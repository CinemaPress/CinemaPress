'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');

/**
 * Node dependencies.
 */

var os = require('os-utils');

module.exports = function() {
  return function(req, res, next) {
    var percent = 0;

    if (os.loadavg(1) > config.loadavg.one / 100) {
      percent = Math.ceil(os.loadavg(1) * 100);
    } else if (os.loadavg(5) > config.loadavg.five / 100) {
      percent = Math.ceil(os.loadavg(5) * 100);
    } else if (os.loadavg(15) > config.loadavg.fifteen / 100) {
      percent = Math.ceil(os.loadavg(15) * 100);
    }

    if (!req.cookies.loadavg) {
      if (percent) {
        var message = config.loadavg.message.replace('[percent]', percent);
        var url = require('url').parse(config.loadavg.message);
        if (url && url.hostname) {
          return res.redirect(302, message);
        } else {
          return next({
            status: 503,
            message: message
          });
        }
      } else {
        res.cookie('loadavg', percent, {
          maxAge: 3600000,
          httpOnly: true
        });
      }
    }

    next();
  };
};
