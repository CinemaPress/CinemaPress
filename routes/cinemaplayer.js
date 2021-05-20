'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../config/production/config.backup'));
var config_md5 = require('md5')(JSON.stringify(config));

var modules = require('../config/production/modules');
Object.keys(modules).length === 0 &&
  (modules = require('../config/production/modules.backup'));
var modules_md5 = require('md5')(JSON.stringify(modules));

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
  if (
    modules_md5 &&
    process.env['CP_MODULES_MD5'] &&
    modules_md5 !== process.env['CP_MODULES_MD5']
  ) {
    modules = require('../config/production/modules');
    Object.keys(modules).length === 0 &&
      (modules = require('../config/production/modules.backup'));
    modules_md5 = process.env['CP_MODULES_MD5'];
  }
}, 3333);

/**
 * Node dependencies.
 */

var LRU = require('lru-cache');
var cache = new LRU({ maxAge: 3600000, max: 1000 });
var md5 = require('md5');
var op = require('object-path');
var async = require('async');
var request = require('request');
var express = require('express');
var router = express.Router();

/**
 * API code.
 */

router.get('/:tab', function(req, res) {
  res.setHeader('Content-Type', 'application/json');

  var err = '';
  var tab =
    req.params.tab &&
    [
      'information',
      'trailer',
      'online',
      'trailer',
      'download',
      'picture'
    ].indexOf('' + req.params.tab) + 1
      ? '' + req.params.tab
      : '';
  var id =
    typeof req.query.id !== 'undefined' &&
    ('' + req.query.id).replace(/[^0-9]/g, '')
      ? ('' + req.query.id).replace(/[^0-9]/g, '')
      : typeof req.query.kp_id !== 'undefined' &&
        ('' + req.query.kp_id).replace(/[^0-9]/g, '')
      ? ('' + req.query.kp_id).replace(/[^0-9]/g, '')
      : '';
  var imdb_id =
    typeof req.query.imdb_id !== 'undefined' &&
    ('' + req.query.imdb_id).replace(/[^0-9]/g, '')
      ? ('' + req.query.imdb_id).replace(/[^0-9]/g, '')
      : '';
  var tmdb_id =
    typeof req.query.tmdb_id !== 'undefined' &&
    ('' + req.query.tmdb_id).replace(/[^0-9]/g, '')
      ? ('' + req.query.tmdb_id).replace(/[^0-9]/g, '')
      : '';
  var douban_id =
    typeof req.query.douban_id !== 'undefined' &&
    ('' + req.query.douban_id).replace(/[^0-9]/g, '')
      ? ('' + req.query.douban_id).replace(/[^0-9]/g, '')
      : '';
  var tvmaze_id =
    typeof req.query.tvmaze_id !== 'undefined' &&
    ('' + req.query.tvmaze_id).replace(/[^0-9]/g, '')
      ? ('' + req.query.tvmaze_id).replace(/[^0-9]/g, '')
      : '';
  var wa_id =
    typeof req.query.wa_id !== 'undefined' &&
    ('' + req.query.wa_id).replace(/[^0-9]/g, '')
      ? ('' + req.query.wa_id).replace(/[^0-9]/g, '')
      : '';
  var movie_id =
    typeof req.query.movie_id !== 'undefined' &&
    ('' + req.query.movie_id).replace(/[^0-9]/g, '')
      ? ('' + req.query.movie_id).replace(/[^0-9]/g, '')
      : '';
  var type =
    req.query.type && ['tv', 'movie'].indexOf('' + req.query.type) + 1
      ? '' + req.query.type
      : '';
  var title =
    typeof req.query.title !== 'undefined' && '' + req.query.title
      ? encodeURIComponent('' + req.query.title)
      : '';
  var year =
    typeof req.query.year !== 'undefined' &&
    ('' + req.query.year).replace(/[^0-9]/g, '')
      ? ('' + req.query.year).replace(/[^0-9]/g, '')
      : '';
  var ip =
    typeof req.query.ip !== 'undefined' &&
    ('' + req.query.ip).replace(/[^0-9.:]/g, '')
      ? ('' + req.query.ip).replace(/[^0-9.:]/g, '')
      : '';
  var hash =
    typeof req.query.hash !== 'undefined' &&
    ('' + req.query.hash).replace(/[^0-9a-z]/g, '')
      ? ('' + req.query.hash).replace(/[^0-9a-z]/g, '')
      : '';
  var custom =
    typeof req.query.custom !== 'undefined' && '' + req.query.custom
      ? '' + req.query.custom
      : '';
  var current_hash = '';
  if (ip) {
    current_hash = md5(ip + '.' + config.urls.admin);
  } else {
    var current_ip = getIp(req);
    current_hash = md5(current_ip + '.' + config.urls.admin);
  }
  if (!current_hash || !hash || current_hash !== hash) {
    err = 'HASH is incorrect.';
  }
  if (err) {
    return res.status(404).json({ status: 'error', message: err });
  }
  var results = [];
  async.eachOfLimit(
    modules.player.data.cinemaplayer[tab].api,
    1,
    function(task, index, callback) {
      var parse = task.replace(/\s*~\s*/g, '~').split('~');
      if (task.charAt(0) === '#' || parse.length < 2) {
        return callback();
      }
      var name = parse[1];
      var iframe = (parse[2] && parse[2].split('<>')[0].trim()) || '';
      var format_iframe =
        parse[2] && parse[2].split('<>')[1]
          ? parse[2].split('<>')[1].trim()
          : '';
      if (tab !== 'download' && tab !== 'picture' && parse.length === 2) {
        name = '"Player ' + (index + 1) + '"';
        iframe = (parse[1] && parse[1].split('<>')[0].trim()) || '';
        format_iframe =
          parse[1] && parse[1].split('<>')[1]
            ? parse[1].split('<>')[1].trim()
            : '';
      }
      var p = {
        url:
          parse[0] && /^(http|\/\/)/i.test(parse[0])
            ? parse[0]
            : config.protocol + config.subdomain + config.domain + parse[0],
        name: name,
        iframe: iframe,
        image: (parse[3] && parse[3].split('<>')[0].trim()) || '',
        season: parse[4] || '',
        episode: parse[5] || '',
        format_iframe: format_iframe,
        format_image:
          parse[3] && parse[3].split('<>')[1]
            ? parse[3].split('<>')[1].trim()
            : ''
      };
      if (p.url.indexOf('[id]') + 1) {
        if (id) {
          p.url = p.url.replace(/\[id]/gi, id ? id : '');
        } else {
          return callback();
        }
      }
      if (p.url.indexOf('[kp_id]') + 1) {
        if (id) {
          p.url = p.url.replace(/\[kp_id]/gi, id ? id : '');
        } else {
          return callback();
        }
      }
      if (p.url.indexOf('[imdb_id]') + 1) {
        if (imdb_id) {
          p.url = p.url.replace(/\[imdb_id]/gi, imdb_id ? imdb_id : '');
        } else {
          return callback();
        }
      }
      if (p.url.indexOf('[tmdb_id]') + 1) {
        if (tmdb_id) {
          p.url = p.url.replace(/\[tmdb_id]/gi, tmdb_id ? tmdb_id : '');
        } else {
          return callback();
        }
      }
      if (p.url.indexOf('[douban_id]') + 1) {
        if (douban_id) {
          p.url = p.url.replace(/\[douban_id]/gi, douban_id ? douban_id : '');
        } else {
          return callback();
        }
      }
      if (p.url.indexOf('[tvmaze_id]') + 1) {
        if (tvmaze_id) {
          p.url = p.url.replace(/\[tvmaze_id]/gi, tvmaze_id ? tvmaze_id : '');
        } else {
          return callback();
        }
      }
      if (p.url.indexOf('[wa_id]') + 1) {
        if (wa_id) {
          p.url = p.url.replace(/\[wa_id]/gi, wa_id ? wa_id : '');
        } else {
          return callback();
        }
      }
      if (p.url.indexOf('[movie_id]') + 1) {
        if (movie_id) {
          p.url = p.url.replace(/\[movie_id]/gi, movie_id ? movie_id : '');
        } else {
          return callback();
        }
      }
      if (p.url.indexOf('[type]') + 1) {
        if (type) {
          p.url = p.url.replace(/\[type]/gi, type ? type : '');
        } else {
          return callback();
        }
      }
      if (p.url.indexOf('[title]') + 1) {
        if (title) {
          p.url = p.url.replace(/\[title]/gi, title ? title : '');
        } else {
          return callback();
        }
      }
      if (p.url.indexOf('[year]') + 1) {
        if (year) {
          p.url = p.url.replace(/\[year]/gi, year ? year : '');
        } else {
          return callback();
        }
      }
      if (p.url.indexOf('[ip]') + 1) {
        if (ip) {
          p.url = p.url.replace(/\[ip]/gi, ip ? ip : '');
        } else {
          return callback();
        }
      }
      if (p.url.indexOf('[custom]') + 1) {
        if (custom) {
          p.url = p.url.replace(/\[custom]/gi, custom ? custom : '');
        } else {
          return callback();
        }
      }
      request(
        {
          url: p.url,
          method: 'GET',
          rejectUnauthorized: false,
          timeout: 5000
        },
        function(error, response, body) {
          if (error || response.statusCode !== 200 || !body) {
            console.error(
              p.url,
              error && error.code,
              response && response.statusCode
            );
            return callback();
          }
          var json = tryParseJSON(body);
          var name = p.name
            ? /^".*?"$/i.test(p.name)
              ? p.name.replace(/^"\s*(.*?)\s*"$/i, '$1')
              : op.get(json, p.name)
            : '';
          var iframe = p.iframe
            ? /^".*?"$/i.test(p.iframe)
              ? p.iframe.replace(/^"\s*(.*?)\s*"$/i, '$1')
              : op.get(json, p.iframe)
            : '';
          var image = p.image
            ? /^".*?"$/i.test(p.image)
              ? p.image.replace(/^"\s*(.*?)\s*"$/i, '$1')
              : op.get(json, p.image)
            : '';
          var season = p.season
            ? /^".*?"$/i.test(p.season)
              ? p.season.replace(/^"\s*(.*?)\s*"$/i, '$1')
              : op.get(json, p.season)
            : '';
          var episode = p.episode
            ? /^".*?"$/i.test(p.episode)
              ? p.episode.replace(/^"\s*(.*?)\s*"$/i, '$1')
              : op.get(json, p.episode)
            : '';
          if (iframe && p.format_iframe) {
            iframe = p.format_iframe.replace(/_VALUE_/gi, iframe);
          }
          if (image && p.format_image) {
            image = p.format_image.replace(/_VALUE_/gi, image);
          }
          var result = {};
          if (tab === 'download') {
            if (name && iframe) {
              if (name) {
                result['title'] = name;
              }
              if (iframe) {
                result['link'] = iframe;
              }
              if (image) {
                result['image'] = image;
              }
              if (season) {
                result['badge'] = season;
              }
              if (episode) {
                result['description'] = episode;
              }
              results.push(result);
            }
          } else if (tab === 'picture') {
            if (name) {
              if (name) {
                results.push({ image: name });
              }
              if (iframe) {
                results.push({ image: iframe });
              }
              if (image) {
                results.push({ image: image });
              }
              if (season) {
                results.push({ image: season });
              }
              if (episode) {
                results.push({ image: episode });
              }
            }
          } else if (iframe) {
            if (name) {
              result['name'] = name;
            }
            if (iframe) {
              result['iframe'] = iframe;
            }
            if (image) {
              result['image'] = image;
            }
            if (season) {
              result['season'] = season;
            }
            if (episode) {
              result['episode'] = episode;
            }
            results.push(result);
          }
          callback();
        }
      );
    },
    function() {
      if (results && results.length) {
        var j = {};
        if (tab === 'download') {
          j['list'] = { items: results };
        } else if (tab === 'picture') {
          j['slider'] = { items: results };
        } else {
          j['simple-api'] = results;
        }
        return res.json(j);
      } else {
        return res.status(404).json({ status: 'error', message: 'Not!' });
      }
    }
  );
});

/**
 * Get user IP.
 *
 * @param {Object} req
 */

function getIp(req) {
  var ips = req.ips || [];
  var ip = '';
  if (req.header('x-forwarded-for')) {
    req
      .header('x-forwarded-for')
      .split(',')
      .forEach(function(one_ip) {
        if (ips.indexOf(one_ip.trim()) === -1) {
          ips.push(one_ip.trim());
        }
      });
  }
  if (req.header('x-real-ip')) {
    req
      .header('x-real-ip')
      .split(',')
      .forEach(function(one_ip) {
        if (ips.indexOf(one_ip.trim()) === -1) {
          ips.push(one_ip.trim());
        }
      });
  }
  if (req.connection.remoteAddress) {
    req.connection.remoteAddress.split(',').forEach(function(one_ip) {
      if (ips.indexOf(one_ip.trim()) === -1) {
        ips.push(one_ip.trim());
      }
    });
  }
  ips.forEach(function(one_ip) {
    if (ip) return;
    one_ip = one_ip.replace('::ffff:', '');
    if (
      one_ip !== '127.0.0.1' &&
      /^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/.test(
        one_ip
      )
    ) {
      ip = one_ip;
    }
  });
  return ip;
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

module.exports = router;
