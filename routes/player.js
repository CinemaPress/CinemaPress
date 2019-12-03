'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
var modules = require('../config/production/modules');

/**
 * Node dependencies.
 */

var async = require('async');
var request = require('request');
var express = require('express');
var router = express.Router();

/**
 * Player.
 */

router.get('/?', function(req, res) {
  var id = parseInt(req.query.id) ? parseInt(req.query.id) : 0;
  var season = parseInt(req.query.season) ? parseInt(req.query.season) : 0;
  var episode = parseInt(req.query.episode) ? parseInt(req.query.episode) : 0;
  var translate = parseInt(req.query.translate)
    ? parseInt(req.query.translate)
    : null;
  var start_time = parseInt(req.query.start_time)
    ? parseInt(req.query.start_time)
    : 0;
  var start_episode = req.query.start_episode ? req.query.start_episode : '';
  var autoplay = req.query.autoplay ? '?&autoplay=1' : '';

  var script =
    'function player(){var e,t,r,n=document.querySelector("#yohoho");if(!n)return!1;for(var a=document.createElement("div"),o=Array.prototype.slice.call(n.attributes);r=o.pop();)a.setAttribute(r.nodeName,r.nodeValue);a.innerHTML=n.innerHTML,n.parentNode.replaceChild(a,n);var i=document.createElement("iframe");i.setAttribute("id","player-iframe"),i.setAttribute("frameborder","0"),i.setAttribute("allowfullscreen","allowfullscreen"),i.setAttribute("src",decodeURIComponent("iframe-src")),a.appendChild(i);var s="width:"+(e=parseInt(a.offsetWidth)?parseInt(a.offsetWidth):parseInt(a.parentNode.offsetWidth)?a.parentNode.offsetWidth:610)+"px;height:"+(t=parseInt(a.offsetHeight)&&parseInt(a.offsetHeight)<370?parseInt(a.parentNode.offsetHeight)&&370<=parseInt(a.parentNode.offsetHeight)?parseInt(a.parentNode.offsetHeight):370:parseInt(a.offsetHeight)&&e/3<parseInt(a.offsetHeight)?parseInt(a.offsetHeight):parseInt(a.parentNode.offsetHeight)&&e/3<parseInt(a.parentNode.offsetHeight)?parseInt(a.parentNode.offsetHeight):e/2)+"px;border:0;margin:0;padding:0;overflow:hidden;position:relative";i.setAttribute("style",s),i.setAttribute("width",e),i.setAttribute("height",t),a.setAttribute("style",s)}document.addEventListener("DOMContentLoaded",player),document.addEventListener("DOMContentLoaded",function(){document.querySelector("#player-translate");document.querySelector("#player-quality")});';

  if (req.query.player) {
    res.setHeader('Content-Type', 'application/javascript');
    return res.send(
      script.replace('iframe-src', encodeURIComponent(req.query.player))
    );
  }

  if (
    /googlebot|crawler|spider|robot|crawling|bot/i.test(req.get('User-Agent'))
  ) {
    res.setHeader('Content-Type', 'application/javascript');
    res.send("console.log('Hello CinemaPress!');");
    return;
  }

  async.parallel(
    {
      iframe: function(callback) {
        if (modules.player.data.iframe && modules.player.data.iframe.token) {
          getIframe(function(result) {
            callback(null, result);
          });
        } else {
          callback(null, {});
        }
      },
      kodik: function(callback) {
        if (modules.player.data.kodik && modules.player.data.kodik.token) {
          getKodik(function(result) {
            callback(null, result);
          });
        } else {
          callback(null, {});
        }
      },
      videocdn: function(callback) {
        if (
          modules.player.data.videocdn &&
          modules.player.data.videocdn.token
        ) {
          getVideocdn(function(result) {
            callback(null, result);
          });
        } else {
          callback(null, {});
        }
      },
      hdvb: function(callback) {
        if (modules.player.data.hdvb && modules.player.data.hdvb.token) {
          getHdvb(function(result) {
            callback(null, result);
          });
        } else {
          callback(null, {});
        }
      },
      collaps: function(callback) {
        if (modules.player.data.collaps && modules.player.data.collaps.token) {
          getCollaps(function(result) {
            callback(null, result);
          });
        } else {
          callback(null, {});
        }
      },
      yohoho: function(callback) {
        if (modules.player.data.yohoho.player) {
          getYohoho(function(result) {
            callback(null, result);
          });
        } else {
          callback(null, {});
        }
      }
    },
    function(err, result) {
      if (err) {
        return res.send(err);
      }

      if (
        modules.episode.status &&
        season &&
        result[modules.episode.data.source].src
      ) {
        script = script
          .replace(
            'iframe-src',
            result[modules.episode.data.source].src + autoplay
          )
          .replace(
            'iframe-translate',
            result[modules.episode.data.source].translate.toUpperCase()
          )
          .replace(
            'iframe-quality',
            result[modules.episode.data.source].quality.toUpperCase()
          );
      } else if (result[modules.player.data.display].src) {
        if (modules.player.data.display === 'yohoho') {
          script = result['yohoho'].src;
        } else {
          script = script
            .replace(
              'iframe-src',
              result[modules.player.data.display].src + autoplay
            )
            .replace(
              'iframe-translate',
              result[modules.player.data.display].translate.toUpperCase()
            )
            .replace(
              'iframe-quality',
              result[modules.player.data.display].quality.toUpperCase()
            );
        }
      } else if (result['iframe'].src) {
        script = script
          .replace('iframe-src', result['iframe'].src + autoplay)
          .replace('iframe-translate', result['iframe'].translate.toUpperCase())
          .replace('iframe-quality', result['iframe'].quality.toUpperCase());
      } else if (result['kodik'].src) {
        script = script
          .replace('iframe-src', result['kodik'].src + autoplay)
          .replace('iframe-translate', result['kodik'].translate.toUpperCase())
          .replace('iframe-quality', result['kodik'].quality.toUpperCase());
      } else if (result['yohoho'].src) {
        script = result['yohoho'].src;
      } else {
        script = '';
      }

      res.setHeader('Content-Type', 'application/javascript');
      res.send(script);
    }
  );

  /**
   * Get Iframe player.
   */

  function getIframe(callback) {
    api(
      'https://iframe.video/api/videos.json?' +
        'api_token=' +
        modules.player.data.iframe.token.trim().split(':')[0] +
        '&' +
        'kinopoisk_id=' +
        id,
      function(json) {
        var iframe_src = '';
        var iframe_translate = '';
        var iframe_quality = '';
        if (json && !json.error && json.length) {
          var iframe_url = '';
          var added = 0;
          for (var i = 0; i < json.length; i++) {
            if (season && episode && translate === json[i].translator_id) {
              iframe_url =
                json[i].iframe_url +
                '?season=' +
                season +
                '&episode=' +
                episode;
              iframe_translate = json[i].translator ? json[i].translator : '';
              iframe_quality = json[i].source_type ? json[i].source_type : '';
              break;
            } else {
              var d = json[i].added_at || json[i].last_episode_time || 0;
              var publish = new Date(d).getTime() / 1000;
              if (publish >= added) {
                iframe_url = json[i].iframe_url;
                iframe_translate = json[i].translator ? json[i].translator : '';
                iframe_quality = json[i].source_type ? json[i].source_type : '';
                added = publish;
              }
            }
          }
          if (iframe_url && start_episode) {
            var se = start_episode.match(
              /^([a-z0-9]*?)\|([0-9]*?)\|([0-9]*?)$/i
            );
            if (se && se.length === 4) {
              iframe_url = iframe_url.replace(
                /serial\/([a-z0-9]*?)\//i,
                'serial/' + se[1] + '/'
              );
              if (iframe_url.indexOf('?') + 1) {
                iframe_url =
                  iframe_url + '&season=' + se[2] + '&episode=' + se[3];
              } else {
                iframe_url =
                  iframe_url + '?season=' + se[2] + '&episode=' + se[3];
              }
            }
          }
          if (iframe_url && start_time) {
            if (iframe_url.indexOf('?') + 1) {
              iframe_url = iframe_url + '&start_time=' + start_time;
            } else {
              iframe_url = iframe_url + '?start_time=' + start_time;
            }
          }
          if (modules.player.data.iframe.token.trim().split(':')[1]) {
            if (iframe_url.indexOf('?') + 1) {
              iframe_url =
                iframe_url +
                '&uid=' +
                modules.player.data.iframe.token.trim().split(':')[1];
            } else {
              iframe_url =
                iframe_url +
                '?uid=' +
                modules.player.data.iframe.token.trim().split(':')[1];
            }
          }
          iframe_src = iframe_url;
        }
        callback({
          src: iframe_src,
          translate: iframe_translate,
          quality: iframe_quality
        });
      }
    );
  }

  /**
   * Get Kodik player.
   */

  function getKodik(callback) {
    api(
      'https://kodikapi.com/search?' +
        'token=' +
        modules.player.data.kodik.token.trim().split(':')[0] +
        '&' +
        'kinopoisk_id=' +
        id,
      function(json) {
        var iframe_src = '';
        var iframe_translate = '';
        var iframe_quality = '';
        if (json && json.results && json.results.length) {
          iframe_src =
            json.results[0].link && json.results[0].link.indexOf('/') + 1
              ? json.results[0].link.replace('http:', 'https:')
              : '';
          iframe_translate =
            json.results[0].translation && json.results[0].translation.title
              ? json.results[0].translation.title
              : '';
          iframe_quality = json.results[0].quality
            ? json.results[0].quality
            : '';
          if (modules.player.data.kodik.token.trim().split(':')[1]) {
            if (iframe_src.indexOf('?') + 1) {
              iframe_src =
                iframe_src +
                '&uid=' +
                modules.player.data.kodik.token.trim().split(':')[1];
            } else {
              iframe_src =
                iframe_src +
                '?uid=' +
                modules.player.data.kodik.token.trim().split(':')[1];
            }
          }
        }
        callback({
          src: iframe_src,
          translate: iframe_translate,
          quality: iframe_quality
        });
      }
    );
  }

  /**
   * Get Videocdn player.
   */

  function getVideocdn(callback) {
    api(
      'https://videocdn.tv/api/short?' +
        'api_token=' +
        modules.player.data.videocdn.token.trim().split(':')[0] +
        '&' +
        'kinopoisk_id=' +
        id,
      function(json) {
        var iframe_src = '';
        var iframe_translate = '';
        var iframe_quality = '';
        if (json && json.data && json.data.length && json.data[0].iframe_src) {
          iframe_src = json.data[0].iframe_src;
          iframe_translate =
            json.data[0].translations && json.data[0].translations[0]
              ? json.data[0].translations[0]
              : '';
          iframe_quality = json.data[0].quality ? json.data[0].quality : '';
          if (modules.player.data.videocdn.token.trim().split(':')[1]) {
            if (iframe_src.indexOf('?') + 1) {
              iframe_src =
                iframe_src +
                '&uid=' +
                modules.player.data.videocdn.token.trim().split(':')[1];
            } else {
              iframe_src =
                iframe_src +
                '?uid=' +
                modules.player.data.videocdn.token.trim().split(':')[1];
            }
          }
        }
        callback({
          src: iframe_src,
          translate: iframe_translate,
          quality: iframe_quality
        });
      }
    );
  }

  /**
   * Get Hdvb player.
   */

  function getHdvb(callback) {
    api(
      'http://' +
        (modules.player.data.hdvb.token.trim().split(':')[1]
          ? modules.player.data.hdvb.token.trim().split(':')[1]
          : 'farsihd.info') +
        '/api/videos.json?' +
        'token=' +
        modules.player.data.hdvb.token.trim().split(':')[0] +
        '&' +
        'id_kp=' +
        id,
      function(json) {
        var iframe_url = '';
        var iframe_translate = '';
        var iframe_quality = '';
        if (json && json.length && json[0].iframe_url) {
          iframe_url = json[0].iframe_url;
          iframe_translate = json[0].translator
            ? decodeURIComponent(json[0].translator)
            : '';
          iframe_quality = json[0].quality
            ? decodeURIComponent(json[0].quality)
            : '';
        }
        callback({
          src: iframe_url,
          translate: iframe_translate,
          quality: iframe_quality
        });
      }
    );
  }

  /**
   * Get Collaps player.
   */

  function getCollaps(callback) {
    api(
      'https://apicollaps.cc/list?' +
        'token=' +
        modules.player.data.collaps.token.trim().split(':')[0] +
        '&' +
        'kinopoisk_id=' +
        id,
      function(json) {
        var iframe_src = '';
        var iframe_translate = '';
        var iframe_quality = '';
        if (
          json &&
          json.results &&
          json.results.length &&
          json.results[0].iframe_url
        ) {
          iframe_src = json.results[0].iframe_url;
          iframe_translate = '';
          iframe_quality = '';
          if (modules.player.data.collaps.token.trim().split(':')[1]) {
            if (iframe_src.indexOf('?') + 1) {
              iframe_src =
                iframe_src +
                '&host=' +
                modules.player.data.collaps.token.trim().split(':')[1];
            } else {
              iframe_src =
                iframe_src +
                '?host=' +
                modules.player.data.collaps.token.trim().split(':')[1];
            }
          }
        }
        callback({
          src: iframe_src,
          translate: iframe_translate,
          quality: iframe_quality
        });
      }
    );
  }

  /**
   * Get Yohoho player.
   */

  function getYohoho(callback) {
    api('https://4h0y.gitlab.io/yo.js', function(json, body) {
      callback({
        src: body,
        translate: '',
        quality: ''
      });
    });
  }

  /**
   * Request.
   */

  function api(url, callback) {
    request(
      { url: url, timeout: 1500, agent: false, pool: { maxSockets: 100 } },
      function(error, response, body) {
        if (!error && response.statusCode === 200) {
          var json = tryParseJSON(body);
          callback(json, body);
        } else {
          console.log(url, error && error.code ? error.code : error);
          callback(null, '');
        }
      }
    );
  }

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
