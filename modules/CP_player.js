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

  var regexpEpisode = new RegExp('^s([0-9]{1,4})e([0-9]{1,4})(_(.*?)|)$', 'ig');
  var execEpisode = regexpEpisode.exec(type);
  if (execEpisode) {
    serial.season = execEpisode[1];
    serial.episode = execEpisode[2];
    serial.translate = encodeURIComponent(execEpisode[4]);
  }

  if (type === 'picture') {
    var pictures = '';

    if (movie.pictures.length) {
      movie.pictures.forEach(function(picture) {
        pictures +=
          '<img src="' +
          picture.picture +
          '" alt="' +
          movie.title.replace(/"/g, "'") +
          '" style="width:100%;height:100%;">';
      });
    } else {
      pictures +=
        '<img src="' +
        config.default.image +
        '" alt="' +
        movie.title.replace(/"/g, "'") +
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
    scriptPlayer('trailer');
  } else {
    var list_abuse = modules.abuse.data.movies.indexOf('' + movie.kp_id) + 1;
    var country_abuse =
      modules.abuse.data.country &&
      movie.year &&
      '' + movie.year === new Date().getFullYear() + '' &&
      movie.countries_arr.filter(function(c) {
        return new RegExp(options.userinfo.country, 'i').test(c);
      }).length;

    if (
      modules.abuse.status &&
      (list_abuse || country_abuse) &&
      options.userinfo.device !== 'app'
    ) {
      if (country_abuse) {
        code.status_code = modules.abuse.data.status_code_country;
      }
      if (list_abuse) {
        code.status_code = modules.abuse.data.status_code_list;
      }

      if (
        modules.app.status &&
        modules.blocking.data.app.abuse &&
        options.userinfo.device === 'desktop'
      ) {
        scriptPlayer('trailer');
        var code2 = CP_blocking.code(code, movie, options, 'app');
        code.player = code2 && code2.player ? code2.player : code.player;
      } else {
        code.player =
          '' +
          '<div style="position:absolute;background:#000 url(' +
          config.default.image +
          ') 100% 100% no-repeat;    background-size:100% 100%;z-index:9999;top:0;left:0;width:100%;height:100%;color:#fff;text-align:center">' +
          '<div style="margin:80px auto 0;width:70%">' +
          modules.abuse.data.message +
          '</div>' +
          '</div>';
      }

      return code;
    }

    if (type === 'download') {
      scriptPlayer('torrent');
    } else if (serial.season && serial.episode) {
      if (modules.player.data.display === 'script') {
        scriptPlayer(true);
      } else {
        scriptPlayer();
      }
    } else if (movie.player) {
      if (/\/\/[^,]*,/.test(movie.player)) {
        scriptPlayer(movie.player);
      } else {
        scriptPlayer();
      }
    } else if (modules.player.data.display === 'script') {
      scriptPlayer(true);
    } else {
      scriptPlayer();
    }

    code =
      options.userinfo.device !== 'app'
        ? CP_blocking.code(code, movie, options)
        : code;
  }

  /**
   * Script player.
   */

  function scriptPlayer(player) {
    var data = modules.player.data.script
      ? JSON.parse(modules.player.data.script)
      : {};

    if (type === 'online' || serial.season) {
      data['data-player'] = data['data-player']
        .replace(/,trailer|trailer,/gi, '')
        .replace(/,torrent|torrent,/gi, '');
    }

    data['data-player'] =
      typeof player === 'string' ? player : data['data-player'];
    data['data-title'] = movie.title_full ? movie.title_full : '';
    data['data-kinopoisk'] = movie.kp_id ? movie.kp_id : '';
    data['data-imdb'] = movie.custom.imdb_id ? movie.custom.imdb_id : '';
    data['data-tmdb'] = movie.custom.tmdb_id ? movie.custom.tmdb_id : '';
    data['data-douban'] = movie.custom.douban_id ? movie.custom.douban_id : '';
    data['data-videospider_tv'] = '' + movie.type === '1' ? '1' : '0';
    data['data-season'] = serial.season ? serial.season : '';
    data['data-episode'] = serial.episode ? serial.episode : '';
    data['data-translate'] = serial.translate ? serial.translate : '';
    data['data-country'] = config.country ? config.country : '';
    data['data-language'] = config.language ? config.language : '';
    if (
      modules.tv &&
      modules.tv.status &&
      (/^tv\./.test(options.domain) || /\/tv-version$/.test(options.domain))
    ) {
      data['data-tv'] = '1';
      data['data-autoplay'] = '1';
    }

    var video = '';
    for (var dkey in data) {
      if (data.hasOwnProperty(dkey) && data[dkey]) {
        data[dkey] = ('' + data[dkey]).trim();
        video += ' ' + dkey + '="' + encodeURIComponent(data[dkey]) + '"';
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
    } else if (movie.player && /\.(mp4|mkv|avi|mov|flv)$/.test(movie.player)) {
      code.player =
        '' +
        '<link rel="stylesheet" href="https://cdn.fluidplayer.com/v2/current/fluidplayer.min.css" type="text/css"/>' +
        '<script src="https://cdn.fluidplayer.com/v2/current/fluidplayer.min.js"></script>' +
        '<video id="cinemapress-cdn"><source src="' +
        movie.player +
        '" type="video/mp4"/></video>';
      code.footer = '' + '<script>fluidPlayer("cinemapress-cdn");</script>';
    } else {
      var param = {};

      param.title = movie.title ? movie.title : '';
      param.year = movie.year ? movie.year : '';
      param.kp_id = movie.kp_id ? movie.kp_id : '';
      param.imdb_id = movie.custom.imdb_id ? movie.custom.imdb_id : '';
      param.tmdb_id = movie.custom.tmdb_id ? movie.custom.tmdb_id : '';
      param.douban_id = movie.custom.douban_id ? movie.custom.douban_id : '';
      param.season = serial.season ? serial.season : '';
      param.episode = serial.episode ? serial.episode : '';
      param.translate = serial.translate ? serial.translate : '';
      param.player = movie.player && movie.player !== '1' ? movie.player : '';
      if (
        modules.tv &&
        modules.tv.status &&
        (/^tv\./.test(options.domain) || /\/tv-version$/.test(options.domain))
      ) {
        param.tv = '1';
        param.autoplay = '1';
      }

      var script = '';
      for (var pkey in param) {
        if (param.hasOwnProperty(pkey) && param[pkey]) {
          param[pkey] = ('' + param[pkey]).trim();
          script += '&' + pkey + '=' + encodeURIComponent(param[pkey]);
        }
      }

      code.footer =
        '<script>(function(){var e=document,t=e.createElement("script");t.async=true;t.src="/player?' +
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
