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

var isbot = require('isbot');
var dns = require('dns');
var LRU = require('lru-cache');
var cache = new LRU();

// "bots": [
//   "google ~ googlebot.com,google.com",
//   "yandex ~ yandex.ru,yandex.net,yandex.com",
//   "bing ~ search.msn.com",
//   "yahoo ~ crawl.yahoo.net",
//   "baidu ~ baidu.com,baidu.jp",
//   "duckduckgo ~ ~ 23.21.227.69,40.88.21.235,50.16.241.113,50.16.241.114,50.16.241.117,50.16.247.234,52.204.97.54,52.5.190.19,54.197.234.188,54.208.100.253,54.208.102.37,107.21.1.8",
//   "mail ~ mail.ru",
//   "# facebook",
//   "# twitter",
//   "# telegram",
//   "# whatsapp",
//   "# vk"
// ],

module.exports = function() {
  return function(req, res, next) {
    var ua = req.get('user-agent') ? req.get('user-agent').toLowerCase() : '';

    req.userinfo = {
      bot: { all: isbot(ua), main: null },
      ip: (
        (
          req.headers['x-real-ip'] ||
          req.headers['cf-connecting-ip'] ||
          req.headers['x-forwarded-for'] ||
          ''
        )
          .split(',')
          .pop()
          .trim() ||
        req.ip ||
        req.connection.remoteAddress
      ).replace('::ffff:', '')
    };

    if (cache.get(req.userinfo.ip)) {
      return next();
    }

    for (var i = 0; i < config.bots.length; i++) {
      config.bots[i] = config.bots[i].trim();
      if (config.bots[i] && config.bots[i].charAt(0) !== '#') {
        var config_bot = config.bots[i].replace(/\s*~\s*/g, '~').split('~');
        if (config_bot[0] && ua.indexOf(config_bot[0]) + 1) {
          req.userinfo.bot.main = {
            domains: config_bot[1]
              ? config_bot[1]
                  .replace(/\s*,\s*/g, ',')
                  .split(',')
                  .filter(Boolean)
              : [],
            ips: config_bot[2]
              ? config_bot[2]
                  .replace(/\s*,\s*/g, ',')
                  .split(',')
                  .filter(Boolean)
              : []
          };
          break;
        }
      }
    }

    if (!req.userinfo.bot.main) {
      return next();
    }

    if (req.userinfo.bot.main.ips && req.userinfo.bot.main.ips.length) {
      if (req.userinfo.bot.main.ips.indexOf(req.userinfo.ip) === -1) {
        console.log(
          'FAKE BOT DETECTED [IP]',
          '«' + req.userinfo.ip + '»',
          '(' + ua + ')'
        );
        return next({
          status: 404
        });
      } else {
        return next();
      }
    } else if (
      req.userinfo.bot.main.domains &&
      req.userinfo.bot.main.domains.length
    ) {
      dns.reverse(req.userinfo.ip, function(err, domains) {
        if (err !== null || !domains || !domains.length) {
          console.log(
            'FAKE BOT DETECTED [REVERSE]',
            '«' + req.userinfo.ip + '»',
            '(' + ua + ')'
          );
          return next({
            status: 404
          });
        }
        domains.forEach(function(domain) {
          var not_domain = true;
          for (var i = 0; i < req.userinfo.bot.main.domains.length; i++) {
            var reg_domain = new RegExp(
              req.userinfo.bot.main.domains[i] + '$',
              'i'
            );
            if (reg_domain.test(domain)) {
              not_domain = false;
              break;
            }
          }
          if (not_domain) {
            console.log(
              'FAKE BOT DETECTED [DOMAIN]',
              '«' + req.userinfo.ip + '»',
              '(' + ua + ')'
            );
            return next({
              status: 404
            });
          }
          dns.lookup(domain, function(err, address, family) {
            if (err !== null || !address || req.userinfo.ip !== address) {
              console.log(
                'FAKE BOT DETECTED [ADDRESS]',
                '«' + req.userinfo.ip + '»',
                '(' + ua + ')'
              );
              return next({
                status: 404
              });
            } else {
              cache.set(req.userinfo.ip, domain);
              return next();
            }
          });
        });
      });
    } else {
      return next();
    }
  };
};
