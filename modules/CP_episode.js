'use strict';

/**
 * Module dependencies.
 */

var CP_get = require('../lib/CP_get.min');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
var modules = require('../config/production/modules');

/**
 * Node dependencies.
 */

var request = require('request');
var moment = require('moment');
moment.locale(config.language);

/**
 * Callback.
 *
 * @callback Callback
 * @param {Object} err
 * @param {Object} [render]
 */

/**
 * Adding list episodes on index page.
 *
 * @param {Object} [options]
 * @param {Callback} callback
 */

function indexEpisode(options, callback) {
  if (arguments.length === 1) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var source = {
    url: 'iframe.video',
    token: modules.player.data.iframe.token.trim()
  };

  var url =
    'https://' +
    source.url +
    '/api/v2/updates?limit=100&type=serial&api_token=' +
    source.token;

  getReq(url, function(err, list) {
    if (err || !list.results || !list.results.length) {
      return callback(null, null);
    }

    var serials = list.results;
    var query_id = {};

    serials.forEach(function(serial) {
      if (parseInt(serial.kinopoisk_id)) {
        query_id[serial.kinopoisk_id] = {};
      }
    });

    CP_get.additional(
      { query_id: Object.keys(query_id) },
      'ids',
      options,
      function(err, movies) {
        if (err || !movies.length) {
          return callback(null, null);
        }

        var result = {};
        result.name = modules.episode.data.index.name;
        result.movies = [];

        for (var i = 0, num1 = serials.length; i < num1; i++) {
          for (var j = 0, num2 = movies.length; j < num2; j++) {
            if (
              parseInt(serials[i].kinopoisk_id) === parseInt(movies[j].kp_id)
            ) {
              var serial_video = JSON.stringify(serials[i]) || '';
              serial_video = JSON.parse(serial_video) || {};

              var serial_base = JSON.stringify(movies[j]) || '';
              serial_base = JSON.parse(serial_base) || {};

              var added = serial_video.added;

              if (!added || !added.length) continue;

              var last = added[added.length - 1];

              var season_num = last['SxEx']
                ? last['SxEx'].split('E')[0].replace(/[^0-9]/g, '')
                : '';
              var episode_num = last['SxEx']
                ? last['SxEx'].split('E')[1].replace(/[^0-9]/g, '')
                : '';

              if (!season_num || !episode_num) continue;

              var season_url = parseInt(season_num);
              var episode_url = parseInt(episode_num);
              var translate_url = parseInt(last.translate_id);
              var translate = last.translator
                ? last.translator
                : modules.episode.data.default;
              var premiere =
                last.date && !isNaN(new Date(last.date).getFullYear())
                  ? moment(last.date.slice(0, 10)).format('LL')
                  : '';

              if (config.language === 'en') {
                if (!/субт|subt|eng/i.test(translate)) {
                  continue;
                }
                translate = 'English';
              }

              season_url = season_url <= 9 ? '0' + season_url : season_url;
              episode_url = episode_url <= 9 ? '0' + episode_url : episode_url;
              translate_url = translate_url ? '_' + translate_url : '';

              serial_base.translate = translate;
              serial_base.season = season_num;
              serial_base.episode = episode_num;
              serial_base.premiere = premiere;
              serial_base.year = premiere
                ? new Date(premiere).getFullYear()
                : new Date().getFullYear();
              serial_base.url =
                serial_base.url +
                '/s' +
                season_url +
                'e' +
                episode_url +
                translate_url;
              serial_base.year2 =
                serial_base.season && serial_base.episode
                  ? serial_base.season +
                    ' ' +
                    config.l.season +
                    ' ' +
                    serial_base.episode +
                    ' ' +
                    config.l.episode
                  : serial_base.year;
              serial_base.year3 =
                serial_base.season && serial_base.episode
                  ? 'S' + serial_base.season + 'E' + serial_base.episode
                  : serial_base.year;

              result.movies.push(serial_base);
            }
          }
        }

        var sort_result = [];

        unique: for (var k = 0, num3 = result.movies.length; k < num3; k++) {
          if (modules.episode.data.index.latest) {
            for (var l = 0, num4 = sort_result.length; l < num4; l++) {
              if (
                parseInt(sort_result[l].kp_id) ===
                  parseInt(result.movies[k].kp_id) &&
                modules.episode.data.index.count > k
              ) {
                sort_result[l] = result.movies[k];
                continue unique;
              }
            }
          }
          if (modules.episode.data.index.count > k) {
            sort_result.push(result.movies[k]);
          }
        }

        result.movies = sort_result;

        callback(null, [result]);
      }
    );
  });

  /**
   * Get request on url.
   *
   * @param {String} url
   * @param {Callback} callback
   */

  function getReq(url, callback) {
    request(
      { timeout: 500, agent: false, pool: { maxSockets: 100 }, url: url },
      function(error, response, body) {
        var result = body ? tryParseJSON(body) : {};

        try {
          if (error || response.statusCode !== 200 || result.error) {
            console.log(url, error.code || '', result.error || '');
            return callback('Iframe request error.');
          }

          callback(null, result);
        } catch (err) {
          callback(null, err);
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
    return {};
  }
}

/**
 * Adding a page episodes list id="#episodesList".
 *
 * @return {Object}
 */

function codeEpisode() {
  var code = {};

  code.episodes =
    'function cp_episodes(){var E=document.querySelector("#episodesList");if(!E)return!1;var e=E.dataset.id||1,O=new XMLHttpRequest;O.open("GET","/episode.json?id="+e,!0),O.onload=function(e){if(4===O.readyState&&200===O.status){var t=JSON.parse(O.responseText),n=t[Object.keys(t)[0]],a=1===Object.keys(n).length?"display:block;":"display:none;",r=1===Object.keys(n).length?"display:none;":"display:block;",o=1===Object.keys(n).length?"margin:0;padding:0;":"margin:0 0 0 20px;padding:0;";for(var i in n)if(n.hasOwnProperty(i)){var s=document.createElement("ul"),l=document.createElement("li"),d=document.createElement("li"),p=document.createElement("span");/укр/i.test(i)?l.setAttribute("style",r+"opacity:.8;list-style-type:none;cursor:pointer;float:none;border-radius:5px;padding:5px;background:repeating-linear-gradient(180deg, #001b38, #001b38 50%, #4c4000 50%, #4c4000 100%);color:#fff;margin:10px auto;"):/субт|subt|eng/i.test(i)?l.setAttribute("style",r+"opacity:.8;list-style-type:none;cursor:pointer;float:none;border-radius:5px;padding:5px;background:linear-gradient(0deg, #121121, #121121), repeating-linear-gradient(180deg, #350a0f, #350a0f 7.7%, #323232 7.7%, #323232 15.4%);background-size: 40% 53.85%, 100% 100%;background-repeat: no-repeat;background-position: top left;color:#fff;margin:10px auto;"):l.setAttribute("style",r+"opacity:.8;list-style-type:none;cursor:pointer;float:none;border-radius:5px;padding:5px;background:repeating-linear-gradient(180deg, #323232, #323232 33.3%, #001032 33.3%, #001032, #001032 66.6%, #400b07 66.6%, #400b07);color:#fff;margin:10px auto;"),s.setAttribute("style","margin:0;padding:0;float:none"),l.setAttribute("class","cinemapress_li"),l.setAttribute("data-click",i),d.setAttribute("style",a+"list-style-type:none;float:none;margin:0"),d.setAttribute("data-show",i),l.textContent="► "+i,p.setAttribute("style","float:right"),p.textContent="▼",l.appendChild(p),s.appendChild(l);var c=document.createElement("ul");for(var u in c.setAttribute("style","float:none;"+o),n[i])if(n[i].hasOwnProperty(u)){var g=document.createElement("li"),y=document.createElement("li"),b=document.createElement("span");/укр/i.test(i)?g.setAttribute("style","opacity:.8;list-style-type:none;cursor:pointer;float:none;border-radius:5px;padding:5px;background:repeating-linear-gradient(180deg, #001b38, #001b38 50%, #4c4000 50%, #4c4000 100%);color:#fff;margin:10px auto;"):/субт|subt|eng/i.test(i)?g.setAttribute("style","opacity:.8;list-style-type:none;cursor:pointer;float:none;border-radius:5px;padding:5px;background:linear-gradient(0deg, #121121, #121121), repeating-linear-gradient(180deg, #350a0f, #350a0f 7.7%, #323232 7.7%, #323232 15.4%);background-size: 40% 53.85%, 100% 100%;background-repeat: no-repeat;background-position: top left;color:#fff;margin:10px auto;"):g.setAttribute("style","opacity:.8;list-style-type:none;cursor:pointer;float:none;border-radius:5px;padding:5px;background:repeating-linear-gradient(180deg, #323232, #323232 33.3%, #001032 33.3%, #001032, #001032 66.6%, #400b07 66.6%, #400b07);color:#fff;margin:10px auto;"),g.setAttribute("class","cinemapress_li"),g.setAttribute("data-click",i+u),y.setAttribute("style","list-style-type:none;display:none;float:none;margin:0"),y.setAttribute("data-show",i+u),g.textContent="► "+u,b.setAttribute("style","float:right"),b.textContent="▼",g.appendChild(b),c.appendChild(g);var f=document.createElement("ul");for(var m in f.setAttribute("style","float:none;margin:0 0 0 20px;padding:0;"),n[i][u])if(n[i][u].hasOwnProperty(m)){var x=document.createElement("li"),h=document.createElement("a");x.setAttribute("style","list-style-type:none;float:none;margin:0"),h.setAttribute("href",n[i][u][m].url),h.setAttribute("target","_blank"),h.setAttribute("style","text-decoration:none;float:none"),h.textContent="► "+n[i][u][m].translate+" "+n[i][u][m].season+" "+n[i][u][m].episode,l.textContent="► "+n[i][u][m].translate+" "+n[i][u][m].season+" "+n[i][u][m].episode,g.textContent="► "+n[i][u][m].translate+" "+n[i][u][m].season,x.appendChild(h),f.appendChild(x)}y.appendChild(f),c.appendChild(y)}d.appendChild(c),s.appendChild(d),E.appendChild(s);var k=document.querySelectorAll(".episodesListBlock");if(k&&k.length)for(var A=0;A<k.length;A++)k[A].style.display="block"}var C=document.querySelectorAll(".cinemapress_li");if(C&&C.length)for(var v=0;v<C.length;v++)C[v].addEventListener("click",function(){var e=document.querySelector("li[data-show=\'"+this.dataset.click+"\']");e.style.display="block"==e.style.display?"none":"block"})}},O.onerror=function(e){console.error(O.statusText)},O.send(null)}document.addEventListener("DOMContentLoaded",cp_episodes);';

  var li = '<style>.cinemapress_li:hover{opacity:1 !important}</style>';

  return modules.player.data &&
    modules.player.data.iframe &&
    modules.player.data.iframe.token
    ? '<script>' + code.episodes + '</script>' + li
    : '';
}

/**
 * Parse data episode.
 *
 * @param {String} type
 * @param {Object} options
 * @return {Object}
 */

function parseEpisode(type, options) {
  if (arguments.length === 1) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var regexpEpisode = new RegExp(
    '^s([0-9]{1,4})e([0-9]{1,4})(_([0-9]{1,3})|)$',
    'ig'
  );
  var execEpisode = regexpEpisode.exec(type);

  var serial = {};
  serial.season =
    execEpisode && execEpisode[1] ? '' + parseInt(execEpisode[1]) : '';
  serial.episode =
    execEpisode && execEpisode[2] ? '' + parseInt(execEpisode[2]) : '';
  serial.translate_id =
    execEpisode && execEpisode[4] ? '' + parseInt(execEpisode[4]) : '';
  serial.translate = modules.episode.data.default;

  var translators = modules.episode.data.source
    ? require('../files/' + modules.episode.data.source + '.json')
    : require('../files/translators.json');
  if (translators && translators.length) {
    for (var i = 0, len = translators.length; i < len; i++) {
      if (parseInt(translators[i].id) === parseInt(serial.translate_id)) {
        serial.translate = translators[i].name;
        if (
          config.language === 'en' &&
          /субт|subt|eng/i.test(serial.translate)
        ) {
          serial.translate = 'English';
        }
        break;
      }
    }
  }

  return serial;
}

module.exports = {
  code: codeEpisode,
  parse: parseEpisode,
  index: indexEpisode
};
