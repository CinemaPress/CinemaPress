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

var os = require('os-utils');

module.exports = function() {
  return function(req, res, next) {
    var percent = 0;

    if (req && req.userinfo && req.userinfo.bot && req.userinfo.bot.main) {
      return next();
    }

    if (os.loadavg(1) > config.loadavg.one / 100) {
      percent = Math.ceil(os.loadavg(1) * 100);
    } else if (os.loadavg(5) > config.loadavg.five / 100) {
      percent = Math.ceil(os.loadavg(5) * 100);
    } else if (os.loadavg(15) > config.loadavg.fifteen / 100) {
      percent = Math.ceil(os.loadavg(15) * 100);
    }

    if (typeof req.cookies['CP_loadavg'] === 'undefined') {
      if (percent) {
        var message = config.loadavg.message.replace(
          '[percent]',
          '<div style="padding:10px">' +
            percent
              .toString()
              .split('')
              .map(function(p) {
                return '<span class=p>' + p + '</span>';
              })
              .join('') +
            '<span class=w>%</span></div>'
        );
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
        res.cookie('CP_loadavg', percent, {
          maxAge: 3600000,
          httpOnly: true
        });
      }
    }

    next();
  };
};
