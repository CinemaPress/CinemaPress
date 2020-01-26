'use strict';

/**
 * Module dependencies.
 */

var CP_blocking = require('./CP_blocking');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
var modules = require('../config/production/modules');

/**
 * Adding a page player.
 *
 * @param {String} type
 * @param {Object} movie
 * @param {Object} [options]
 * @return {Object}
 */

function codePlayer(type, movie, options) {
  if (arguments.length === 2) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var code = {};
  code.head = '';
  code.player = '';
  code.footer = '';

  var serial = {};
  serial.season = '';
  serial.episode = '';
  serial.translate = '';

  var regexpEpisode = new RegExp(
    '^s([0-9]{1,4})e([0-9]{1,4})(_([0-9]{1,3})|)$',
    'ig'
  );
  var execEpisode = regexpEpisode.exec(type);
  if (execEpisode) {
    serial.season = execEpisode[1];
    serial.episode = execEpisode[2];
    serial.translate = execEpisode[4];
  }

  var title = encodeURIComponent(movie.title_full);

  if (type === 'picture') {
    var pictures = '';

    if (movie.pictures.length) {
      movie.pictures.forEach(function(picture) {
        pictures +=
          '<img src="' +
          picture.picture +
          '" alt="' +
          movie.title +
          '" style="width:100%;height:100%;">';
      });
    } else {
      pictures +=
        '<img src="' +
        config.default.image +
        '" alt="' +
        movie.title +
        '" style="width:100%;height:100%;">';
    }

    code.head =
      '' +
      '<link rel="stylesheet" href="/themes/default/public/desktop/css/ideal-image-slider.css">';

    code.player =
      '' + '<div id="slider" class="img_tmhover">' + pictures + '</div>';

    code.footer =
      '' +
      '<script src="/themes/default/public/desktop/js/ideal-image-slider.min.js"></script>' +
      '<script>var sldr = new IdealImageSlider.Slider("#slider");sldr.start();</script>';
  } else if (type === 'trailer') {
    yohohoPlayer('trailer');
  } else {
    var list_abuse = modules.abuse.data.movies.indexOf('' + movie.kp_id) + 1;
    var country_abuse =
      modules.abuse.data.country &&
      movie.year &&
      '' + movie.year === new Date().getFullYear() + '' &&
      movie.countries_arr.filter(function(c) {
        return new RegExp(options.userinfo.country, 'i').test(c);
      }).length;

    if (modules.abuse.status && (list_abuse || country_abuse)) {
      if (country_abuse) {
        code.status_code = modules.abuse.data.status_code_country;
      }
      if (list_abuse) {
        code.status_code = modules.abuse.data.status_code_list;
      }

      code.player =
        '' +
        '<div style="position:absolute;background:#000 url(' +
        config.default.image +
        ') 100% 100% no-repeat;    background-size:100% 100%;z-index:9999;top:0;left:0;width:100%;height:100%;color:#fff;text-align:center">' +
        '<div style="margin:80px auto 0;width:70%">' +
        modules.abuse.data.message +
        '</div>' +
        '</div>';

      return code;
    }

    if (type === 'download') {
      yohohoPlayer('torrent');
    } else if (serial.season && serial.episode) {
      yohohoPlayer();
    } else if (movie.player) {
      if (/\/\/[^,]*,/.test(movie.player)) {
        yohohoPlayer(movie.player);
      } else {
        yohohoPlayer();
      }
    } else if (modules.player.data.display === 'yohoho') {
      yohohoPlayer(modules.player.data.yohoho.player);
    } else {
      yohohoPlayer();
    }

    code = CP_blocking.code(code, movie, options);
  }

  /**
   * Yohoho player.
   */

  function yohohoPlayer(player) {
    var data = {};

    if (type === 'online') {
      data.player = player
        ? player
            .replace(/,trailer|trailer,/gi, '')
            .replace(/,torrent|torrent,/gi, '')
        : modules.player.data.yohoho.player
        ? modules.player.data.yohoho.player
            .replace(/,trailer|trailer,/gi, '')
            .replace(/,torrent|torrent,/gi, '')
        : '';
    } else {
      data.player = player
        ? player
        : modules.player.data.yohoho.player
        ? modules.player.data.yohoho.player
        : '';
    }
    data.bg = modules.player.data.yohoho.bg
      ? modules.player.data.yohoho.bg
      : '';
    data.button = modules.player.data.yohoho.button
      ? modules.player.data.yohoho.button
      : '';
    data.trailer = modules.player.data.yohoho.trailer
      ? modules.player.data.yohoho.trailer
      : '';
    data.title = title ? title : '';
    data.kinopoisk = movie.kp_id ? movie.kp_id : '';
    data.imdb = movie.custom.imdb_id ? movie.custom.imdb_id : '';
    data.tmdb = movie.custom.tmdb_id ? movie.custom.tmdb_id : '';
    data.videospider_tv = '' + movie.type === '1' ? '1' : '0';
    data.season = serial.season ? serial.season : '';
    data.episode = serial.episode ? serial.episode : '';
    data.translate = serial.translate ? serial.translate : '';
    data.country = config.country ? config.country : '';
    data.language = config.language ? config.language : '';
    data.youtube =
      modules.player &&
      modules.player.data &&
      modules.player.data.youtube &&
      modules.player.data.youtube.token
        ? modules.player.data.youtube.token
        : '';
    data.kodik =
      modules.player &&
      modules.player.data &&
      modules.player.data.kodik &&
      modules.player.data.kodik.token
        ? modules.player.data.kodik.token
        : '';
    data.videocdn =
      modules.player &&
      modules.player.data &&
      modules.player.data.videocdn &&
      modules.player.data.videocdn.token
        ? modules.player.data.videocdn.token
        : '';
    data.hdvb =
      modules.player &&
      modules.player.data &&
      modules.player.data.hdvb &&
      modules.player.data.hdvb.token
        ? modules.player.data.hdvb.token
        : '';
    data.collaps =
      modules.player &&
      modules.player.data &&
      modules.player.data.collaps &&
      modules.player.data.collaps.token
        ? modules.player.data.collaps.token
        : '';
    data.tv =
      modules.tv &&
      modules.tv.status &&
      (/^tv\./.test(options.domain) || /\/tv-version$/.test(options.domain))
        ? '1'
        : '';
    data.autoplay =
      modules.tv &&
      modules.tv.status &&
      (/^tv\./.test(options.domain) || /\/tv-version$/.test(options.domain))
        ? '1'
        : '';
    data.resize = '1';

    var video = '';
    for (var data_key in data) {
      if (data.hasOwnProperty(data_key) && data[data_key]) {
        data[data_key] = ('' + data[data_key]).trim();
        video +=
          ' data-' + data_key + '="' + encodeURIComponent(data[data_key]) + '"';
      }
    }

    var param = {};

    param.id = movie.kp_id ? movie.kp_id : '';
    param.season = serial.season ? serial.season : '';
    param.episode = serial.episode ? serial.episode : '';
    param.translate = serial.translate ? serial.translate : '';
    param.player = movie.player && movie.player !== '1' ? movie.player : '';
    param.cdn =
      movie.player && /\.(mp4|mkv|avi|mov|flv)$/.test(movie.player)
        ? movie.player
        : '';
    param.tv =
      modules.tv &&
      modules.tv.status &&
      (/^tv\./.test(options.domain) || /\/tv-version$/.test(options.domain))
        ? '1'
        : '';
    param.autoplay =
      modules.tv &&
      modules.tv.status &&
      (/^tv\./.test(options.domain) || /\/tv-version$/.test(options.domain))
        ? '1'
        : '';
    param.resize = '1';

    var script = '';
    for (var param_key in param) {
      if (param.hasOwnProperty(param_key) && param[param_key]) {
        param[param_key] = ('' + param[param_key]).trim();
        script += '&' + param_key + '=' + encodeURIComponent(param[param_key]);
      }
    }

    code.player =
      '' +
      '<video id="yohoho" controls  ' +
      video +
      ' style="display:none">' +
      '  <source src="/balancer/' +
      movie.kp_id +
      '.mp4" type="video/mp4">' +
      '</video>';

    if (player) {
      code.footer =
        '<script>(function(){var e=document,t=e.createElement("script");t.async=true;t.src="https://4h0y.gitlab.io/yo.js",(e.head||e.body).appendChild(t)})();</script>' +
        '<script>document.addEventListener("DOMContentLoaded",function(){window.addEventListener("message",function(t){if(t&&t.data){var a=document.querySelector(\'[data-yo="quality"]\'),e=document.querySelector(\'[data-yo="translate"]\');t.data.quality&&a&&(a.innerHTML=t.data.quality),t.data.translate&&e&&(e.innerHTML=t.data.translate)}})});</script>';
    } else if (param.cdn) {
      code.player =
        '' +
        '<link rel="stylesheet" href="https://cdn.fluidplayer.com/v2/current/fluidplayer.min.css" type="text/css"/>' +
        '<script src="https://cdn.fluidplayer.com/v2/current/fluidplayer.min.js"></script>' +
        '<video id="cinemapress-cdn"><source src="' +
        param.cdn +
        '" type="video/mp4"/></video>';
      code.footer = '' + '<script>fluidPlayer("cinemapress-cdn");</script>';
    } else {
      code.footer =
        '<script>(function(){var e=document,t=e.createElement("script");t.async=true;t.src="/iframe.player?' +
        script +
        '",(e.head||e.body).appendChild(t)})();</script>' +
        '<script>document.addEventListener("DOMContentLoaded",function(){window.addEventListener("message",function(t){if(t&&t.data){var a=document.querySelector(\'[data-yo="quality"]\'),e=document.querySelector(\'[data-yo="translate"]\');t.data.quality&&a&&(a.innerHTML=t.data.quality),t.data.translate&&e&&(e.innerHTML=t.data.translate)}})});</script>';
    }
  }

  return code;
}

module.exports = {
  code: codePlayer
};
