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

var crypto = require('crypto').createHash;
var url = require('url');
var LRU = require('lru-cache');
var defense_domain = new LRU({ maxAge: 3600000, max: 10000 });
var defense_agent = new LRU({ maxAge: 3600000, max: 10000 });

module.exports = function() {
  return function(req, res, next) {
    var host = req.get('host');
    var host_domain = url.parse('http://' + host).hostname;
    var ua = req.get('user-agent') ? req.get('user-agent').toLowerCase() : '';

    if (
      (!config.defense.domain && !config.defense.agent) ||
      req.userinfo.bot.main
    ) {
      return next();
    }

    var hash = crypto('sha1')
      .update(
        config.defense.domain_key === 1
          ? req.userinfo.ip
          : req.userinfo.ip + '' + ua
      )
      .digest('base64');

    var get_defense_domain = defense_domain.get(hash);
    var get_defense_agent = defense_agent.get(req.userinfo.ip);
    var captcha_1 = Math.floor(Math.random() * 9) + 1;
    var captcha_2 = Math.floor(Math.random() * 9) + 1;

    if (req.query && req.query.captcha) {
      var c1 = req.query.captcha.toString().trim();
      if (get_defense_domain && get_defense_domain.captcha) {
        var c2 = get_defense_domain.captcha.toString();
        if (c1 === c2) {
          defense_domain.del(hash);
          get_defense_domain = undefined;
          console.log(
            'BAD BOT DETECTED [CAPTCHA TRUE]',
            req.userinfo.ip,
            c1 + ' = ' + c2
          );
        } else {
          console.log(
            'BAD BOT DETECTED [CAPTCHA FALSE]',
            req.userinfo.ip,
            c1 + ' != ' + c2
          );
        }
      }
      if (get_defense_agent && get_defense_agent.captcha) {
        var c3 = get_defense_agent.captcha.toString();
        if (c1 === c3) {
          defense_agent.del(hash);
          get_defense_agent = undefined;
          console.log(
            'BAD BOT DETECTED [CAPTCHA TRUE]',
            req.userinfo.ip,
            c1 + ' = ' + c3
          );
        } else {
          console.log(
            'BAD BOT DETECTED [CAPTCHA FALSE]',
            req.userinfo.ip,
            c1 + ' != ' + c3
          );
        }
      }
    }

    if (
      config.defense.domain_ex &&
      config.defense.domain_ex.length &&
      config.defense.domain_ex
        .map(function(d) {
          switch (d) {
            case 'domain.for.people':
              return config.subdomain + config.domain;
            case 'domain.for.bots':
              return config.botdomain + config.bomain;
            case 'domain2.for.bots':
              return config.alt.botdomain + config.alt.bomain;
            case 'domain.for.ru.people':
              return config.ru.subdomain + config.ru.domain;
            case 'domain.for.ru.bots':
              return config.ru.botdomain + config.ru.bomain;
            case 'domain.for.app':
              return 'app.' + config.domain;
            case 'domain.for.mobile':
              return 'm.' + config.domain;
            case 'domain.for.tv':
              return 'tv.' + config.domain;
            case 'domain.for.ftp':
              return 'ftp.' + config.domain;
            case 'domain.for.www':
              return 'www.' + config.domain;
            default:
              return d;
          }
        })
        .indexOf(host_domain) + 1
    ) {
      host_domain = '';
    }

    if (get_defense_domain && config.defense.domain) {
      if (
        host_domain &&
        get_defense_domain.domains.indexOf(host_domain) === -1
      ) {
        get_defense_domain.domains.push(host_domain);
        defense_domain.set(hash, get_defense_domain);
        if (get_defense_domain.domains.length > config.defense.domain) {
          console.log(
            'BAD BOT DETECTED [DOMAIN]',
            req.userinfo.ip,
            '[' + get_defense_domain.domains.join('] » [') + ']'
          );
        }
      }
      if (get_defense_domain.domains.length > config.defense.domain) {
        get_defense_domain.captcha = captcha_1 + captcha_2;
        defense_domain.set(hash, get_defense_domain);
        return next({
          status: 404,
          message:
            config.defense.message +
            '<br><br><form method="get" autocomplete="off"><div class="input-group input-group-lg"><span class="input-group-addon">' +
            captcha_1 +
            ' + ' +
            captcha_2 +
            ' =</span><input class="form-control" placeholder="__" type="text" name="captcha"><span class="input-group-btn"><button class="btn btn-default" type="submit">OK</button></span></div></form>'
        });
      }
    } else if (host_domain) {
      defense_domain.set(hash, {
        domains: [host_domain]
      });
    }

    if (get_defense_agent && config.defense.agent) {
      if (get_defense_agent.agents.indexOf(ua) === -1) {
        get_defense_agent.agents.push(ua);
        defense_agent.set(req.userinfo.ip, get_defense_agent);
        if (get_defense_agent.agents.length > config.defense.agent) {
          console.log(
            'BAD BOT DETECTED [AGENT]',
            req.userinfo.ip,
            '[' + get_defense_agent.agents.join('] » [') + ']'
          );
        }
      }
      if (get_defense_agent.agents.length > config.defense.agent) {
        get_defense_agent.captcha = captcha_1 + captcha_2;
        defense_agent.set(req.userinfo.ip, get_defense_agent);
        return next({
          status: 404,
          message:
            config.defense.message +
            '<br><br><form method="get" autocomplete="off"><div class="input-group input-group-lg"><span class="input-group-addon">' +
            captcha_1 +
            ' + ' +
            captcha_2 +
            ' =</span><input class="form-control" placeholder="__" type="text" name="captcha"><span class="input-group-btn"><button class="btn btn-default" type="submit">OK</button></span></div></form>'
        });
      }
    } else {
      defense_agent.set(req.userinfo.ip, {
        agents: [ua]
      });
    }

    return next();
  };
};
