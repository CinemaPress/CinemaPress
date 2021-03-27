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

var ipRangeCheck = require('ip-range-check');
var crypto = require('crypto').createHash;
var isbot = require('isbot');
var dns = require('dns');
var LRU = require('lru-cache');
var success_ips = new LRU({ maxAge: 3600000, max: 1000 });

module.exports = function() {
  return function(req, res, next) {
    var ua = req.get('user-agent') ? req.get('user-agent').toLowerCase() : '';
    var bot_main = null;
    var date = new Date();

    req.userinfo = {
      bot: { all: isbot(ua), main: false },
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

    if (!config.bots || !config.bots.length) {
      return next();
    }

    var hash = crypto('sha1')
      .update(req.userinfo.ip + '' + ua)
      .digest('base64');

    var success_ip = success_ips.get(hash);

    if (success_ip && success_ip.status) {
      if (success_ip.status === 1) {
        req.userinfo.bot.all = true;
        req.userinfo.bot.main = true;
      } else if (success_ip.status === 2) {
        req.userinfo.bot.all = false;
        req.userinfo.bot.main = false;
      } else if (success_ip.status === 3) {
        var time = Array(3)
          .fill([3600, success_ip.time.getTime() - new Date().getTime()])
          .map((v, i, a) => {
            a[i + 1] = [
              a[i][0] / 60,
              ((v[1] / (v[0] * 1000)) % 1) * (v[0] * 1000)
            ];
            return (
              '<span class=w>' +
              ('0' + Math.floor(v[1] / (v[0] * 1000)) + '').slice(-2) +
              '</span>'
            );
          })
          .join(':');
        return next({
          status: 403,
          message: success_ip.message + '<br><br>' + time
        });
      }
      return next();
    }

    for (var i = 0; i < config.bots.length; i++) {
      config.bots[i] = config.bots[i].trim();
      if (config.bots[i] && config.bots[i].charAt(0) !== '#') {
        var config_bot = config.bots[i].replace(/\s*~\s*/g, '~').split('~');
        if (config_bot[0] && ua.indexOf(config_bot[0].toLowerCase()) + 1) {
          bot_main = {
            keyword: config_bot[0].toUpperCase(),
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
              : [],
            message: config_bot[3] ? config_bot[3] : '',
            time: new Date(new Date().setHours(new Date().getHours() + 1))
          };
          break;
        }
      }
    }

    if (!bot_main) {
      return next();
    }

    if (bot_main.ips && bot_main.ips.length) {
      if (!ipRangeCheck(req.userinfo.ip, bot_main.ips)) {
        console.log(
          'FAKE BOT DETECTED [IP]',
          req.userinfo.ip,
          bot_main.keyword,
          ('00' + (new Date() - date)).slice(-3) + 'ms'
        );
        req.userinfo.bot.all = false;
        req.userinfo.bot.main = false;
        if (bot_main.message) {
          success_ips.set(hash, {
            message: bot_main.message,
            time: bot_main.time,
            status: 3
          });
          return next({
            status: 403,
            message:
              bot_main.message +
              '<br><br><span class="w">01</span>:<span class="w">00</span>:<span class="w">00</span>'
          });
        } else {
          success_ips.set(hash, { status: 2 });
          return next();
        }
      } else {
        console.log(
          'TRUE BOT DETECTED [IP]',
          req.userinfo.ip,
          bot_main.keyword,
          ('00' + (new Date() - date)).slice(-3) + 'ms'
        );
        req.userinfo.bot.all = true;
        req.userinfo.bot.main = true;
        success_ips.set(hash, { status: 1 });
        return next();
      }
    } else if (bot_main.domains && bot_main.domains.length) {
      dns.reverse(req.userinfo.ip, function(err, domains) {
        if (err !== null || !domains || !domains.length) {
          console.log(
            'FAKE BOT DETECTED [REVERSE]',
            req.userinfo.ip,
            bot_main.keyword,
            ('00' + (new Date() - date)).slice(-3) + 'ms'
          );
          req.userinfo.bot.all = false;
          req.userinfo.bot.main = false;
          if (bot_main.message) {
            success_ips.set(hash, {
              message: bot_main.message,
              time: bot_main.time,
              status: 3
            });
            return next({
              status: 403,
              message:
                bot_main.message +
                '<br><br><span class="w">01</span>:<span class="w">00</span>:<span class="w">00</span>'
            });
          } else {
            success_ips.set(hash, { status: 2 });
            return next();
          }
        }
        domains.forEach(function(domain) {
          var not_domain = true;
          for (var i = 0; i < bot_main.domains.length; i++) {
            var reg_domain = new RegExp(bot_main.domains[i] + '$', 'i');
            if (reg_domain.test(domain)) {
              not_domain = false;
              break;
            }
          }
          if (not_domain) {
            console.log(
              'FAKE BOT DETECTED [DOMAIN]',
              req.userinfo.ip,
              bot_main.keyword,
              ('00' + (new Date() - date)).slice(-3) + 'ms'
            );
            req.userinfo.bot.all = false;
            req.userinfo.bot.main = false;
            if (bot_main.message) {
              success_ips.set(hash, {
                message: bot_main.message,
                time: bot_main.time,
                status: 3
              });
              return next({
                status: 403,
                message:
                  bot_main.message +
                  '<br><br><span class="w">01</span>:<span class="w">00</span>:<span class="w">00</span>'
              });
            } else {
              success_ips.set(hash, { status: 2 });
              return next();
            }
          }
          dns.lookup(
            domain,
            /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
              req.userinfo.ip
            )
              ? 4
              : 6,
            function(err, address, family) {
              if (err !== null || !address || req.userinfo.ip !== address) {
                console.log(
                  'FAKE BOT DETECTED [ADDRESS]',
                  req.userinfo.ip,
                  bot_main.keyword,
                  ('00' + (new Date() - date)).slice(-3) + 'ms'
                );
                req.userinfo.bot.all = false;
                req.userinfo.bot.main = false;
                if (bot_main.message) {
                  success_ips.set(hash, {
                    message: bot_main.message,
                    time: bot_main.time,
                    status: 3
                  });
                  return next({
                    status: 403,
                    message:
                      bot_main.message +
                      '<br><br><span class="w">01</span>:<span class="w">00</span>:<span class="w">00</span>'
                  });
                } else {
                  success_ips.set(hash, { status: 2 });
                  return next();
                }
              } else {
                console.log(
                  'TRUE BOT DETECTED [ADDRESS]',
                  req.userinfo.ip,
                  bot_main.keyword,
                  ('00' + (new Date() - date)).slice(-3) + 'ms'
                );
                req.userinfo.bot.all = true;
                req.userinfo.bot.main = true;
                success_ips.set(hash, { status: 1 });
                return next();
              }
            }
          );
        });
      });
    } else {
      req.userinfo.bot.all = true;
      req.userinfo.bot.main = true;
      return next();
    }
  };
};
