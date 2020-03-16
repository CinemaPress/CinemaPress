'use strict';

/**
 * Configuration dependencies.
 */

var modules = require('../config/production/modules');

/**
 * Node dependencies.
 */

var LRU = require('lru-cache');
var cache = new LRU({ maxAge: 3600000 });
var md5 = require('md5');
var op = require('object-path');
var async = require('async');
var request = require('request');
var express = require('express');
var router = express.Router();

/**
 * Player.
 */

router.get('/?', function(req, res) {
  if (!cache.has('CP_VER') || cache.get('CP_VER') !== process.env['CP_VER']) {
    cache.reset();
    cache.set('CP_VER', process.env['CP_VER']);
  }

  var script =
    '(function() {' +
    "    var y = document.querySelector('#yohoho');" +
    "    var yohoho = document.createElement('div');" +
    '    var attr = Array.prototype.slice.call(y.attributes);' +
    '    while(a = attr.pop()) {yohoho.setAttribute(a.nodeName, a.nodeValue);}' +
    '    yohoho.innerHTML = y.innerHTML;' +
    '    y.parentNode.replaceChild(yohoho, y);' +
    "    i = document.createElement('iframe');" +
    "    i.setAttribute('id', 'yohoho-iframe');" +
    "    i.setAttribute('frameborder', '0');" +
    "    i.setAttribute('allowfullscreen', 'allowfullscreen');" +
    '    i.setAttribute("src", decodeURIComponent("iframe-src"));' +
    '    yohoho.appendChild(i);' +
    '    if (parseInt(yohoho.offsetWidth)) {' +
    '        w = parseInt(yohoho.offsetWidth);' +
    '    }' +
    '    else if (yohoho.parentNode && parseInt(yohoho.parentNode.offsetWidth)) {' +
    '        w = parseInt(yohoho.parentNode.offsetWidth);' +
    '    }' +
    '    else {' +
    '        w = 610;' +
    '    }' +
    "    if (yohoho.parentNode && yohoho.parentNode.tagName && yohoho.parentNode.tagName.toLowerCase() === 'body') {" +
    '        h = Math.max(document.body.scrollHeight, document.body.offsetHeight,' +
    '            document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);' +
    '    }' +
    '    else if (parseInt(yohoho.offsetHeight) && parseInt(yohoho.offsetHeight) < 370) {' +
    '        if (yohoho.parentNode && parseInt(yohoho.parentNode.offsetHeight) && parseInt(yohoho.parentNode.offsetHeight) >= 370) {' +
    '            h = parseInt(yohoho.parentNode.offsetHeight);' +
    '        }' +
    '        else {' +
    '            h = 370;' +
    '        }' +
    '    }' +
    '    else if (parseInt(yohoho.offsetHeight) && w/3 < parseInt(yohoho.offsetHeight)) {' +
    '        h = parseInt(yohoho.offsetHeight);' +
    '    }' +
    '    else if (yohoho.parentNode && parseInt(yohoho.parentNode.offsetHeight) && w/3 < parseInt(yohoho.parentNode.offsetHeight)) {' +
    '        h = parseInt(yohoho.parentNode.offsetHeight);' +
    '    }' +
    '    else {' +
    '        h = w/2;' +
    '    }' +
    "    var style = 'width:' + w + 'px;height:' + h + 'px;border:0;margin:0;padding:0;overflow:hidden;position:relative';" +
    "    i.setAttribute('style', style);" +
    "    i.setAttribute('width', w);" +
    "    i.setAttribute('height', h);" +
    "    yohoho.setAttribute('style', style);" +
    '    var q = document.querySelector("[data-yo=\\"quality\\"]");' +
    '    if (q && "iframe-"+"quality" !== "iframe-quality") {q.innerHTML="iframe-quality"};' +
    '    var t = document.querySelector("[data-yo=\\"translate\\"]");' +
    '    if (t && "iframe-"+"translate" !== "iframe-translate") {t.innerHTML="iframe-translate"};' +
    '})();';

  if (req.query.player) {
    res.setHeader('Content-Type', 'application/javascript');
    return res.send(
      script.replace(/iframe-src/g, encodeURIComponent(req.query.player))
    );
  }

  if (
    /googlebot|crawler|spider|robot|crawling|bot/i.test(req.get('User-Agent'))
  ) {
    res.setHeader('Content-Type', 'application/javascript');
    res.send("console.log('Hello CinemaPress!');");
    return;
  }

  var result = false;

  async.eachOfLimit(
    modules.player.data.custom,
    1,
    function(task, index, callback) {
      var parse = task.replace(/\s*~\s*/g, '~').split('~');
      if (task.charAt(0) === '#' || parse.length < 2 || result) {
        return callback();
      }
      var p = {
        url: parse[0],
        iframe: parse[1],
        translate: parse[2] || '',
        quality: parse[3] || '',
        uid: parse[4] || ''
      };
      p.url = p.url
        .replace(/\[kp_id]/, req.query.kp_id ? req.query.kp_id : '')
        .replace(/\[imdb_id]/, req.query.imdb_id ? req.query.imdb_id : '')
        .replace(/\[tmdb_id]/, req.query.tmdb_id ? req.query.tmdb_id : '')
        .replace(/\[douban_id]/, req.query.douban_id ? req.query.douban_id : '')
        .replace(/\[year]/, req.query.year ? req.query.year : '')
        .replace(
          /\[title]/,
          req.query.title ? encodeURIComponent(req.query.title) : ''
        );
      var hash = md5(JSON.stringify(req.query) + process.env['CP_VER']);
      if (cache.has(hash)) {
        script = cache.get(hash);
        result = true;
        return callback();
      }
      request(
        {
          url: p.url,
          method: 'GET',
          timeout: 15000
        },
        function(error, response, body) {
          if (error || response.statusCode !== 200 || !body) {
            console.error(
              task,
              error && error.code,
              response && response.statusCode
            );
            return callback();
          }
          var json = tryParseJSON(body);
          var iframe = p.iframe ? op.get(json, p.iframe) || '' : '';
          var translate = p.translate ? op.get(json, p.translate) || '' : '';
          var quality = p.quality ? op.get(json, p.quality) || '' : '';
          if (iframe && p.uid) {
            iframe += iframe.indexOf('?') + 1 ? '&' + p.uid : '?' + p.uid;
          }
          if (iframe && req.query.autoplay) {
            iframe +=
              iframe.indexOf('?') + 1
                ? '&autoplay=' + req.query.autoplay
                : '?autoplay=' + req.query.autoplay;
          }
          if (iframe && req.query.season) {
            iframe +=
              iframe.indexOf('?') + 1
                ? '&season=' + req.query.season
                : '?season=' + req.query.season;
          }
          if (iframe && req.query.episode) {
            iframe +=
              iframe.indexOf('?') + 1
                ? '&episode=' + req.query.episode
                : '?episode=' + req.query.episode;
          }
          if (iframe) {
            script = script
              .replace(/iframe-src/gi, iframe)
              .replace(/iframe-translate/gi, translate.toUpperCase())
              .replace(/iframe-quality/gi, quality.toUpperCase());
            result = true;
          }
          cache.set(hash, script);
          callback();
        }
      );
    },
    function() {
      if (result) {
        res.setHeader('Content-Type', 'application/javascript');
        res.send(script);
      } else {
        res.redirect(302, modules.player.data.js);
      }
    }
  );

  /**
   * Valid JSON.
   *
   * @param {String} jsonString
   */

  function tryParseJSON(jsonString) {
    try {
      var o = JSON.parse(jsonString);
      if (o && typeof o === 'object') {
        return o;
      }
    } catch (e) {}
    return null;
  }
});

module.exports = router;
