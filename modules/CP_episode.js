'use strict';

/**
 * Module dependencies.
 */

var CP_translit = require('../lib/CP_translit');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
var modules = require('../config/production/modules');

/**
 * Node dependencies.
 */

var LRU = require('lru-cache');
var cache = new LRU({ maxAge: 3600000, max: 100 });
var md5 = require('md5');
var path = require('path');
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

  if (!cache.has('CP_VER') || cache.get('CP_VER') !== process.env['CP_VER']) {
    cache.reset();
    cache.set('CP_VER', process.env['CP_VER']);
  }

  var hash = md5('episodes' + process.env['CP_VER']);

  var episodes;
  if (cache.has(hash)) {
    episodes = cache.get(hash);
  } else {
    episodes = require(path.join(
      path.dirname(__filename),
      '..',
      'files',
      'episodes.json'
    ));
    cache.set(hash, episodes);
  }
  var result = {};
  result.name = modules.episode.data.index.name;
  result.movies = (Array.isArray(episodes) ? episodes : [])
    .slice(0, 99)
    .map(function(episode, i) {
      if (i >= modules.episode.data.index.count) {
        episode.hide = true;
      }
      episode.url = options.origin + episode.pathname;
      return episode;
    });
  callback(null, [result]);
}

/**
 * Adding a page episodes list id="#episodesList".
 *
 * @return {Object}
 */

function codeEpisode() {
  var code = {};

  code.episodes =
    'function cp_episodes(){var E=document.querySelector("#episodesList");if(!E)return!1;var e=E.dataset.id||1,O=new XMLHttpRequest;O.open("GET","/episode?id="+e,!0),O.timeout=5000,O.onload=function(e){if(4===O.readyState&&200===O.status){var t=JSON.parse(O.responseText);if(!t||t.error){return;}var n=t,a=1===Object.keys(n).length?"display:block;":"display:none;",r=1===Object.keys(n).length?"display:none;":"display:block;",o=1===Object.keys(n).length?"margin:0;padding:0;":"margin:0 0 0 20px;padding:0;";for(var i in n)if(n.hasOwnProperty(i)){var s=document.createElement("ul"),l=document.createElement("li"),d=document.createElement("li"),p=document.createElement("span");/укр/i.test(i)?l.setAttribute("style",r+"opacity:.8;list-style-type:none;cursor:pointer;float:none;border-radius:5px;padding:5px;background:repeating-linear-gradient(180deg, #001b38, #001b38 50%, #4c4000 50%, #4c4000 100%);color:#fff;margin:10px auto;"):/субт|subt|eng/i.test(i)?l.setAttribute("style",r+"opacity:.8;list-style-type:none;cursor:pointer;float:none;border-radius:5px;padding:5px;background:linear-gradient(0deg, #121121, #121121), repeating-linear-gradient(180deg, #350a0f, #350a0f 7.7%, #323232 7.7%, #323232 15.4%);background-size: 40% 53.85%, 100% 100%;background-repeat: no-repeat;background-position: top left;color:#fff;margin:10px auto;"):l.setAttribute("style",r+"opacity:.8;list-style-type:none;cursor:pointer;float:none;border-radius:5px;padding:5px;background:repeating-linear-gradient(180deg, #323232, #323232 33.3%, #001032 33.3%, #001032, #001032 66.6%, #400b07 66.6%, #400b07);color:#fff;margin:10px auto;"),s.setAttribute("style","margin:0;padding:0;float:none"),l.setAttribute("class","cinemapress_li"),l.setAttribute("data-click",i),d.setAttribute("style",a+"list-style-type:none;float:none;margin:0"),d.setAttribute("data-show",i),l.textContent="► "+i,p.setAttribute("style","float:right"),p.textContent="▼",l.appendChild(p),s.appendChild(l);var c=document.createElement("ul");for(var u in c.setAttribute("style","float:none;"+o),n[i])if(n[i].hasOwnProperty(u)){var g=document.createElement("li"),y=document.createElement("li"),b=document.createElement("span");/укр/i.test(i)?g.setAttribute("style","opacity:.8;list-style-type:none;cursor:pointer;float:none;border-radius:5px;padding:5px;background:repeating-linear-gradient(180deg, #001b38, #001b38 50%, #4c4000 50%, #4c4000 100%);color:#fff;margin:10px auto;"):/субт|subt|eng/i.test(i)?g.setAttribute("style","opacity:.8;list-style-type:none;cursor:pointer;float:none;border-radius:5px;padding:5px;background:linear-gradient(0deg, #121121, #121121), repeating-linear-gradient(180deg, #350a0f, #350a0f 7.7%, #323232 7.7%, #323232 15.4%);background-size: 40% 53.85%, 100% 100%;background-repeat: no-repeat;background-position: top left;color:#fff;margin:10px auto;"):g.setAttribute("style","opacity:.8;list-style-type:none;cursor:pointer;float:none;border-radius:5px;padding:5px;background:repeating-linear-gradient(180deg, #323232, #323232 33.3%, #001032 33.3%, #001032, #001032 66.6%, #400b07 66.6%, #400b07);color:#fff;margin:10px auto;"),g.setAttribute("class","cinemapress_li"),g.setAttribute("data-click",i+u),y.setAttribute("style","list-style-type:none;display:none;float:none;margin:0"),y.setAttribute("data-show",i+u),g.textContent="► "+u,b.setAttribute("style","float:right"),b.textContent="▼",g.appendChild(b),c.appendChild(g);var f=document.createElement("ul");for(var m in f.setAttribute("style","float:none;margin:0 0 0 20px;padding:0;"),n[i][u])if(n[i][u].hasOwnProperty(m)){var x=document.createElement("li"),h=document.createElement("a");x.setAttribute("style","list-style-type:none;float:none;margin:0"),h.setAttribute("href",n[i][u][m].url),h.setAttribute("target","_blank"),h.setAttribute("style","text-decoration:none;float:none"),h.textContent="► "+n[i][u][m].translate+" "+n[i][u][m].season+" "+n[i][u][m].episode,l.textContent="► "+n[i][u][m].translate+" "+n[i][u][m].season+" "+n[i][u][m].episode,g.textContent="► "+n[i][u][m].translate+" "+n[i][u][m].season,x.appendChild(h),f.appendChild(x)}y.appendChild(f),c.appendChild(y)}d.appendChild(c),s.appendChild(d),E.appendChild(s);var k=document.querySelectorAll(".episodesListBlock");if(k&&k.length)for(var A=0;A<k.length;A++)k[A].style.display="block"}var C=document.querySelectorAll(".cinemapress_li");if(C&&C.length)for(var v=0;v<C.length;v++)C[v].addEventListener("click",function(){var e=document.querySelector("li[data-show=\'"+this.dataset.click+"\']");e.style.display="block"==e.style.display?"none":"block"})}},O.onerror=function(e){console.error(O.statusText)},O.send(null)}cp_episodes()';

  var li = '<style>.cinemapress_li:hover{opacity:1 !important}</style>';

  return modules.episode.status
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

  var regexpEpisode = new RegExp('^s([0-9]{1,4})e([0-9]{1,4})(_(.*?)|)$', 'ig');
  var execEpisode = regexpEpisode.exec(type);

  var serial = {};
  serial.season =
    execEpisode && execEpisode[1] ? '' + parseInt(execEpisode[1]) : '';
  serial.episode =
    execEpisode && execEpisode[2] ? '' + parseInt(execEpisode[2]) : '';
  serial.translate =
    execEpisode && execEpisode[4]
      ? CP_translit.text(execEpisode[4], true, 'translate')
      : modules.episode.data.default;

  return serial;
}

module.exports = {
  code: codeEpisode,
  parse: parseEpisode,
  index: indexEpisode
};
