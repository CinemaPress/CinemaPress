'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
var modules = require('../config/production/modules');

/**
 * Node dependencies.
 */

var fs = require('fs');
var path = require('path');
var LRU = require('lru-cache');
var cache = new LRU();
var blacklist = new LRU();
var ipRangeCheck = require('ip-range-check');
var isbot = require('isbot');
var whois = require('whois');
var url = require('url');

var whois_timeout = 0;
var whois_dump = path.join(__dirname, '..', 'files', 'whois.json');

var whois_org = [];
var whois_key = [];
var whois_all = [];

module.exports = function(lookup) {
  lookup = lookup || {};
  lookup.country = lookup.country || {};
  lookup.asn = lookup.asn || {};

  return function(req, res, next) {
    if (req.method !== 'GET') return next();

    if (!cache.has('CP_VER') || cache.get('CP_VER') !== process.env['CP_VER']) {
      cache.reset();
      cache.set('CP_VER', process.env['CP_VER']);
    }

    var ua = req.get('user-agent') ? req.get('user-agent').toLowerCase() : '';
    var uabot = /(google|yandex|bing|yahoo|baidu|duckduckgo|mail|ask|aol|msn|facebook|vk|twitter|telegram|whatsapp)/i.test(
      ua
    );

    req.userinfo = {};
    req.userinfo.bot = isbot(ua);
    req.userinfo.ip = (
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
    ).replace('::ffff:', '');
    req.userinfo.whois = cache.get(req.userinfo.ip);
    req.userinfo.referrer = !!(
      (req.cookies && req.cookies['CP_referrer']) ||
      (req.header &&
        (req.header('Referrer') || req.header('Referer')) &&
        (req.header('Referrer') || req.header('Referer'))
          .toLowerCase()
          .indexOf('iframe-toloka') + 1)
    );

    if (req.userinfo.referrer) {
      res.cookie('CP_referrer', '1', {
        maxAge: 86400,
        httpOnly: true
      });
    }

    if (req.protocol === 'http') {
      if (
        req.get('x-cloudflare-proto') &&
        req.get('x-cloudflare-proto').toLowerCase() === 'https'
      ) {
        req.userinfo.protocol = 'https';
      } else {
        req.userinfo.protocol = 'http';
      }
    } else {
      req.userinfo.protocol = 'https';
    }

    if (
      req.userinfo.protocol + '://' === config.protocol &&
      /^\/admin-/i.test(req.originalUrl)
    )
      return next();

    var host = req.get('host');
    var host_domain = url.parse(req.userinfo.protocol + '://' + host).hostname;
    req.userinfo.port =
      /:[0-9]{1,5}$/.test(host) && !/:80$/.test(host) && !/:443$/.test(host)
        ? ':' + host.split(':')[1]
        : '';

    if (
      config.random &&
      config.homepage &&
      config.subdomain &&
      config.domain !== config.homepage &&
      config.domain === host
    ) {
      return next({
        status: 302,
        message: '//' + config.homepage
      });
    }

    var config_bomain =
      config.alt.bomain &&
      host_domain === config.alt.botdomain + config.alt.bomain
        ? '' + config.alt.bomain
        : '' + config.bomain;
    var config_botdomain =
      config.alt.bomain &&
      host_domain === config.alt.botdomain + config.alt.bomain
        ? '' + config.alt.botdomain
        : '' + config.botdomain;
    if (req.userinfo.bot && uabot && config.alt.bomain) {
      req.userinfo.alt =
        host_domain === config.alt.botdomain + config.alt.bomain
          ? config.protocol +
            (config.botdomain || config.subdomain) +
            (config.bomain || config.domain) +
            req.userinfo.port
          : config.protocol +
            config.alt.botdomain +
            config.alt.bomain +
            req.userinfo.port;
    }

    if (req.userinfo.bot && uabot) {
      var originalUrl = req.originalUrl;
      var prefixId = config.urls.prefix_id || config.urls.slash;
      var regexpId = new RegExp(prefixId + '([0-9]{1,8})', 'i');
      var execId = regexpId.exec(originalUrl);
      var idId = execId ? parseInt(execId[1]) - config.urls.unique_id : 0;
      if (idId && config.botdomains) {
        var regexpSep = new RegExp('(^[^a-z0-9]*)|([^a-z0-9]*)$', 'ig');
        var regexpUrl = new RegExp(
          idId + config.urls.unique_id + '([a-z0-9_-]*)',
          'i'
        );
        var execUrl = regexpUrl.exec(originalUrl);
        var urlUrl = execUrl ? execUrl[1].replace(regexpSep, '') : '';
        var eval_botdomain = eval(
          'let id = ' +
            idId +
            ';' +
            'let url = "' +
            urlUrl +
            '";' +
            config.botdomains
        );
        config_botdomain = eval_botdomain || config_botdomain;
      }
    }

    config_botdomain = config_botdomain
      ? '' +
        config_botdomain.replace(/[^a-z0-9.\-]/gi, '').replace(/\.*$/, '') +
        '.'
      : '';

    if (/^\/tv-version/i.test(req.originalUrl)) {
      req.userinfo.domain =
        (modules.tv.data.subdomain
          ? 'tv.'
          : req.userinfo.bot && uabot && config_botdomain
          ? config_botdomain
          : config.subdomain) +
        (req.userinfo.bot && uabot && config_bomain
          ? config_bomain
          : config.domain) +
        req.userinfo.port +
        (modules.tv.data.subdomain ? '' : '/tv-version');
      req.userinfo.device = 'tv';
    } else if (/^\/mobile-version/i.test(req.originalUrl)) {
      req.userinfo.domain =
        (modules.mobile.data.subdomain
          ? 'm.'
          : req.userinfo.bot && uabot && config_botdomain
          ? config_botdomain
          : config.subdomain) +
        (req.userinfo.bot && uabot && config_bomain
          ? config_bomain
          : config.domain) +
        req.userinfo.port +
        (modules.mobile.data.subdomain ? '' : '/mobile-version');
      req.userinfo.device = 'mobile';
    } else {
      req.userinfo.domain =
        (req.userinfo.bot && uabot && config_botdomain
          ? config_botdomain
          : config.subdomain) +
        (req.userinfo.bot && uabot && config_bomain
          ? config_bomain
          : config.domain) +
        req.userinfo.port;
      req.userinfo.device = 'desktop';
      if (/CinemaPress App/i.test(ua)) {
        req.userinfo.device = 'app';
      }
    }

    req.userinfo.origin = config.protocol + req.userinfo.domain;

    if (req.userinfo.device === 'mobile' && !modules.mobile.status) {
      return next({
        status: 404,
        message: config.l.notMobile
      });
    }

    if (req.userinfo.device === 'tv' && !modules.tv.status) {
      return next({
        status: 404,
        message: config.l.notTv
      });
    }

    if (
      modules.adv.status ||
      modules.blocking.status ||
      modules.abuse.status ||
      config.geolite2.countries.length ||
      config.geolite2.ips.length
    ) {
      if (
        config.geolite2.countries.length ||
        config.geolite2.ips.length ||
        modules.adv.data.target ||
        modules.abuse.data.country ||
        (modules.blocking.data.display === 'legal' &&
          modules.blocking.data.legal.countries) ||
        (modules.blocking.data.display === 'app' &&
          modules.blocking.data.app.countries)
      ) {
        var info =
          typeof lookup.country.get !== 'undefined' && req.userinfo.ip
            ? lookup.country.get(req.userinfo.ip)
            : null;
        if (info) {
          req.userinfo.country_en =
            info.country && info.country.names && info.country.names.en
              ? info.country.names.en
              : '';
          req.userinfo.country_ru =
            info.country && info.country.names && info.country.names.ru
              ? info.country.names.ru
              : '';
          req.userinfo.country_de =
            info.country && info.country.names && info.country.names.de
              ? info.country.names.de
              : '';
          req.userinfo.country_es =
            info.country && info.country.names && info.country.names.es
              ? info.country.names.es
              : '';
          req.userinfo.country_fr =
            info.country && info.country.names && info.country.names.fr
              ? info.country.names.fr
              : '';
          req.userinfo.country_ja =
            info.country && info.country.names && info.country.names.ja
              ? info.country.names.ja
              : '';
          req.userinfo.country_pt =
            info.country && info.country.names && info.country.names['pt-BR']
              ? info.country.names['pt-BR']
              : '';
          req.userinfo.country_zh =
            info.country && info.country.names && info.country.names['zh-CN']
              ? info.country.names['zh-CN']
              : '';
          req.userinfo.country =
            req.userinfo['country_' + config.language] || '';
        }

        if (
          !req.userinfo.bot &&
          req.userinfo.country_en &&
          config.geolite2.countries.length
        ) {
          var regex = new RegExp(req.userinfo.country_en, 'i');
          var regexIp = new RegExp(req.userinfo.ip, 'i');
          if (
            config.geolite2.countries.filter(function(c) {
              return regex.test(c) && !regexIp.test(c);
            }).length
          ) {
            return res.status(503).end();
          }
        }
        if (
          !req.userinfo.bot &&
          ipRangeCheck(req.userinfo.ip, config.geolite2.ips)
        ) {
          return res.status(503).end();
        }

        //var user = require('ua-parser-js')(req.headers['user-agent']);
        //req.userinfo.browser = (user.browser && user.browser.name)
        //    ? user.browser.name
        //    : '';
        //req.userinfo.type = (user.device && user.device.type)
        //    ? user.device.type
        //    : '';
        //req.userinfo.vendor = (user.device && user.device.vendor)
        //    ? user.device.vendor
        //    : '';
        //req.userinfo.os = (user.os && user.os.name)
        //    ? user.os.name
        //    : '';
        //req.userinfo.model = (user.device && user.device.model)
        //    ? user.device.model
        //    : '';
      }
    }

    // -----------------------------------------------------------------

    // -----------------------------------------------------------------
    // Detection of the mobile device and a redirect to the mobile site.
    // -----------------------------------------------------------------

    if (req.userinfo.device === 'desktop') {
      if (typeof req.query.desktop !== 'undefined') {
        res.cookie('CP_desktop', '1', {
          maxAge: 86400000,
          httpOnly: true
        });
      }

      var mobile =
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
          ua
        ) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
          ua.substr(0, 4)
        );

      if (
        modules.mobile.status &&
        mobile &&
        req.cookies &&
        !req.cookies.CP_desktop &&
        typeof req.query.desktop === 'undefined'
      ) {
        return next({
          status: 302,
          message:
            config.protocol +
            (modules.mobile.data.subdomain ? 'm.' : config.subdomain) +
            config.domain +
            req.userinfo.port +
            (modules.mobile.data.subdomain ? '' : '/mobile-version') +
            req.originalUrl
        });
      }
    }

    // -----------------------------------------------------------------

    // -----------------------------------------------------------------
    // Detection of the TV device and a redirect to the TV site.
    // -----------------------------------------------------------------

    if (req.userinfo.device === 'desktop') {
      if (typeof req.query.desktop !== 'undefined') {
        res.cookie('CP_desktop', '1', {
          maxAge: 86400000,
          httpOnly: true
        });
      }

      var tv = /GoogleTV|SmartTV|SMART-TV|Internet TV|NetCast|NETTV|AppleTV|boxee|Kylo|Roku|DLNADOC|hbbtv|CrKey|CE-HTML/i.test(
        ua
      );

      if (
        modules.tv.status &&
        tv &&
        req.cookies &&
        !req.cookies.CP_desktop &&
        typeof req.query.desktop === 'undefined'
      ) {
        return next({
          status: 302,
          message:
            config.protocol +
            (modules.mobile.data.subdomain ? 'tv.' : config.subdomain) +
            config.domain +
            req.userinfo.port +
            (modules.mobile.data.subdomain ? '' : '/tv-version') +
            req.originalUrl
        });
      }
    }

    // -----------------------------------------------------------------
    // Redirect to correct domain and protocol.
    // -----------------------------------------------------------------

    var conf_domain = url.parse(req.userinfo.origin).hostname;

    if (conf_domain && host_domain && conf_domain !== host_domain) {
      return next({
        status: 301,
        message:
          config.protocol +
          req.userinfo.domain +
          req.originalUrl.replace(/^\/(mobile|tv)-version/i, '')
      });
    } else if (config.protocol !== req.userinfo.protocol + '://') {
      if (req.userinfo.bot && uabot) {
        return next({
          status: 301,
          message:
            config.protocol +
            req.userinfo.domain +
            req.originalUrl
              .replace(/^\/(mobile|tv)-version/i, '')
              .replace(/\?(https|http)$/i, '')
        });
      } else if (
        typeof req.cookies['CP_' + config.protocol.replace('://', '')] ===
        'undefined'
      ) {
        res.cookie('CP_' + config.protocol.replace('://', ''), 1, {
          signed: false,
          secure: false,
          httpOnly: false,
          maxAge: 60000
        });
        return next({
          status: 301,
          message:
            config.protocol +
            req.userinfo.domain +
            req.originalUrl.replace(/^\/(mobile|tv)-version/i, '')
        });
      } else if (
        typeof req.query[config.protocol.replace('://', '')] === 'undefined'
      ) {
        return next({
          status: 301,
          message:
            config.protocol +
            req.userinfo.domain +
            req.originalUrl.replace(/^\/(mobile|tv)-version/i, '') +
            (/\?/.test(req.originalUrl)
              ? '&' + config.protocol.replace('://', '')
              : '?' + config.protocol.replace('://', ''))
        });
      }
    }

    // -----------------------------------------------------------------

    // -----------------------------------------------------------------
    // Set secure CP_rand cookie
    // -----------------------------------------------------------------

    if (!req.signedCookies || !req.signedCookies.CP_rand) {
      var rand1 = Math.floor(Math.random() * 9) + 1 + '';
      var rand2 = Math.floor(Math.random() * 9) + 1 + '';
      res.cookie('CP_rand', rand1 + rand2, {
        signed: true,
        secure: false,
        httpOnly: true,
        maxAge: 86400000
      });
    }

    // -----------------------------------------------------------------

    // -----------------------------------------------------------------
    // Maintenance website
    // -----------------------------------------------------------------

    /*if (req.userinfo.ip !== 'IP_ADMIN') { // Change IP_ADMIN
            return next({
                "status"  : 503,
                "message" : "Site under maintenance."
            });
        }*/

    // -----------------------------------------------------------------

    if (
      !uabot &&
      !req.userinfo.bot &&
      req.userinfo.whois === undefined &&
      modules.abuse.status &&
      ((modules.abuse.data.whois && modules.abuse.data.whois.length) ||
        (modules.abuse.data.ips && modules.abuse.data.ips.length))
    ) {
      var time = new Date();

      // -----------------------------------------------------------------
      // Dump whois
      // -----------------------------------------------------------------

      if (cache.itemCount <= 1) {
        whois_org = [];
        whois_key = [];
        whois_all = [];
        if (modules.abuse.data.whois && modules.abuse.data.whois.length) {
          for (
            var wi = 0, wl = modules.abuse.data.whois.length;
            wi < wl;
            wi++
          ) {
            if (modules.abuse.data.whois[wi].indexOf('~') + 1) {
              var wi0 = modules.abuse.data.whois[wi].split('~')[0].trim();
              var wi1 = modules.abuse.data.whois[wi].split('~')[1].trim();
              if (wi0 && wi1) {
                whois_org.push(wi0);
                whois_key.push(wi1);
              }
            } else if (modules.abuse.data.whois[wi].trim()) {
              whois_all.push(modules.abuse.data.whois[wi].trim());
            }
          }
        }
        if (fs.existsSync(whois_dump)) {
          var whois_raw = fs.readFileSync(whois_dump, 'utf8');
          try {
            var whois_json = JSON.parse(whois_raw);
            cache.load(whois_json);
            blacklist.load(whois_json);
            console.log('READ whois.json', cache.itemCount);
            cache.set('CP_VER', process.env['CP_VER']);
          } catch (e) {
            console.error(e);
          }
          req.userinfo.whois = cache.get(req.userinfo.ip);
          if (req.userinfo.whois !== undefined) {
            return next();
          }
        }
      }

      // -----------------------------------------------------------------

      if (
        modules.abuse.data.ips &&
        modules.abuse.data.ips.length &&
        ipRangeCheck(req.userinfo.ip, modules.abuse.data.ips)
      ) {
        req.userinfo.whois = 'IP';
        cache.set(req.userinfo.ip, req.userinfo.whois);
        blacklist.set(req.userinfo.ip, req.userinfo.whois);
        console.log(
          'WHOIS DETECTED BY IP',
          '«' + req.userinfo.ip + '»',
          '(' + blacklist.itemCount + ')',
          new Date() - time,
          'ms'
        );
        fs.writeFile(
          whois_dump,
          JSON.stringify(blacklist.dump(), null, 2),
          function() {}
        );
        return next();
      } else if (
        modules.abuse.data.whois &&
        modules.abuse.data.whois.length &&
        whois_timeout <= 5
      ) {
        var asn =
          typeof lookup.asn.get !== 'undefined' && req.userinfo.ip
            ? lookup.asn.get(req.userinfo.ip)
            : null;
        if (
          asn &&
          asn.autonomous_system_organization &&
          whois_all.length &&
          whois_all.indexOf(asn.autonomous_system_organization) + 1
        ) {
          req.userinfo.whois = 'ASN';
          cache.set(req.userinfo.ip, req.userinfo.whois);
          blacklist.set(req.userinfo.ip, req.userinfo.whois);
          console.log(
            'WHOIS DETECTED BY ASN',
            '«' + asn.autonomous_system_organization + '»',
            'IP',
            '«' + req.userinfo.ip + '»',
            '(' + blacklist.itemCount + ')',
            new Date() - time,
            'ms'
          );
          fs.writeFile(
            whois_dump,
            JSON.stringify(blacklist.dump(), null, 2),
            function() {}
          );
          return next();
        }
        var current_keys = [].concat(whois_all);
        if (
          whois_org.length &&
          whois_key.length &&
          asn &&
          asn.autonomous_system_organization
        ) {
          for (var oi = 0; oi < whois_org.length; oi++) {
            if (
              asn.autonomous_system_organization
                .toLowerCase()
                .indexOf(whois_org[oi].toLowerCase()) + 1
            ) {
              current_keys.push(whois_key[oi]);
            }
          }
        }
        if (!current_keys.length) {
          req.userinfo.whois = '';
          cache.set(req.userinfo.ip, req.userinfo.whois);
          return next();
        }
        whois.lookup(req.userinfo.ip, { timeout: 500 }, function(err, data) {
          if (err) {
            whois_timeout++;
            req.userinfo.whois = '';
            console.error(
              whois_timeout,
              'NOT WHOIS',
              req.userinfo.ip,
              new Date() - time,
              'ms'
            );
          } else {
            whois_timeout = whois_timeout >= 1 ? whois_timeout - 1 : 0;
            req.userinfo.whois = current_keys
              .filter(function(k) {
                return data.indexOf(k) + 1;
              })
              .join(',');
            if (new Date() - time > 1000) {
              console.log('LONG REQUEST', new Date() - time, 'ms');
            }
          }
          cache.set(req.userinfo.ip, req.userinfo.whois);
          next();
          if (req.userinfo.whois) {
            blacklist.set(req.userinfo.ip, req.userinfo.whois);
            console.log(
              'WHOIS DETECTED BY KEY',
              '«' + req.userinfo.whois + '»',
              'IP',
              '«' + req.userinfo.ip + '»',
              '(' + blacklist.itemCount + ')',
              new Date() - time,
              'ms'
            );
            fs.writeFile(
              whois_dump,
              JSON.stringify(blacklist.dump(), null, 2),
              function() {}
            );
          }
        });
      } else {
        if (new Date() - time > 500) {
          console.log('LONG REQUEST', new Date() - time, 'ms');
        }
        next();
      }
    } else {
      next();
    }
  };
};
