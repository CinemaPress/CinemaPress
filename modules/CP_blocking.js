'use strict';

/**
 * Module dependencies.
 */

var CP_text = require('../lib/CP_text');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
var modules = require('../config/production/modules');

/**
 * Blocking a page player.
 *
 * @param {Object} code
 * @param {Object} [movie]
 * @param {Object} [options]
 * @return {Object}
 */

function blockingPlayer(code, movie, options) {
  if (arguments.length === 1) {
    options = {};
    options.domain = '' + config.domain;
  }

  if (
    modules.blocking.status &&
    modules.blocking.data[modules.blocking.data.display]
  ) {
    var tv =
      options.domain.indexOf('tv.') !== -1 ||
      options.domain.indexOf('/tv-version') !== -1;
    var block = modules.blocking.data[modules.blocking.data.display];

    var message = block.message.replace(
      '[timer]',
      '<span id="blockingTimer" style="background:#000;color:#fff;padding:2px 7px 0;border-radius:3px;border:1px solid #666;font-family:monospace,sans-serif">--</span>'
    );
    message = CP_text.formatting(message, movie);

    if (modules.blocking.data.display === 'share' && !tv) {
      code.player =
        '<div id="blocking" style="position:absolute;background:#000 url(' +
        config.default.image +
        ') 100% 100% no-repeat;background-size:100% 100%;z-index:10000;top:0;left:0;width:100%;height:100%;color:#fff;text-align:center;text-shadow: 1px 1px #000;"><div id="blockingMessage" style="margin:80px auto 0;width:70%">' +
        message +
        '</div><div id="blockingCode" style="margin:50px auto"><script src="/themes/default/public/desktop/js/yastatic.net/es5-shims.min.js" charset="utf-8"></script><script src="/themes/default/public/desktop/js/yastatic.net/share2.js" charset="utf-8"></script><div class="ya-share2" data-services="facebook,twitter,vkontakte,odnoklassniki,moimir" data-counter=""></div></div></div><script>window.addEventListener("load",function(){var e=document.getElementById("blockingTimer"),n=' +
        block.time +
        ';var si=setInterval(function(){if(e.innerHTML=""+n,n=parseInt(n),n--,0>n){var t=document.getElementById("blocking");t.parentElement.removeChild(t);clearInterval(si)}},1e3);var t=document.getElementById("blockingCode");t.addEventListener("click",function(){setTimeout(function(){var e=document.getElementById("blocking");e.parentElement.removeChild(e);clearInterval(si)},10e3)})});</script>' +
        code.player;
    } else if (modules.blocking.data.display === 'adv') {
      var skipText = modules.blocking.data.adv.skip;
      var skipCode = modules.blocking.data.adv.skip
        ? 'var bm=document.getElementById("blockingMessage");bm.style.display="none";var bs=document.getElementById("blockingSkip");bs.style.display="block";'
        : 'var t=document.getElementById("blocking");t.parentElement.removeChild(t);';

      code.player =
        '<div id="blocking" style="position:absolute;background:#000 url(' +
        config.default.image +
        ') 100% 100% no-repeat;background-size:100% 100%;z-index:10000;top:0;left:0;width:100%;height:100%;color:#fff;text-align:center;text-shadow: 1px 1px #000;"><div id="blockingMessage" style="margin:30px auto 0;width:70%">' +
        message +
        '</div><div id="blockingSkip" style="color:white; margin:30px auto 0;width:70%; display: none;cursor: pointer;">' +
        skipText +
        '</div><div id="blockingCode" style="margin:30px auto">' +
        block.code +
        '</div></div><script>window.addEventListener("load",function(){var e=document.getElementById("blockingTimer"),n=' +
        block.time +
        ';var si=setInterval(function(){if(e.innerHTML=""+n,n=parseInt(n),n--,0>n){' +
        skipCode +
        'clearInterval(si)}},1e3);var s=document.getElementById("blockingSkip");s.addEventListener("click",function(){var t=document.getElementById("blocking");t.parentElement.removeChild(t);})});</script>' +
        code.player;
    } else if (modules.blocking.data.display === 'adblock' && !tv) {
      code.player =
        '<div id="blocking" style="position:absolute;background:#000 url(' +
        config.default.image +
        ') 100% 100% no-repeat;background-size:100% 100%;z-index:10000;top:0;left:0;width:100%;height:100%;color:#fff;text-align:center;text-shadow: 1px 1px #000;"><div id="blockingMessage" style="margin:80px auto 0;width:70%">' +
        message +
        '</div></div><script src="/themes/default/public/desktop/js/ads.js" charset="utf-8"></script><script>window.addEventListener("load",function(){var e=document.getElementById("blockingTimer"),n=' +
        block.time +
        ';var si=setInterval(function(){if(e.innerHTML=""+n,n=parseInt(n),n--,0>n){var t=document.getElementById("blocking");t.parentElement.removeChild(t);clearInterval(si)}},1e3);if(document.getElementById("CinemaPressACMS")){var ee=document.getElementById("blocking");ee.parentElement.removeChild(ee);clearInterval(si)}});</script>' +
        code.player;
    } else if (modules.blocking.data.display === 'sub') {
      if (
        !options.subscribe ||
        (options.subscribe &&
          modules.blocking.data.sub.keys.indexOf(options.subscribe) === -1)
      ) {
        code.player =
          '<div id="blocking" style="position:absolute;background:#000 url(' +
          config.default.image +
          ') 100% 100% no-repeat;background-size:100% 100%;z-index:10000;top:0;left:0;width:100%;height:100%;color:#fff;text-align:center;text-shadow: 1px 1px #000;"><div id="blockingMessage" style="margin:80px auto 0;width:70%">' +
          message +
          '</div><div id="blockingCode" style="margin:30px auto"> <input type="text" placeholder="CP8881160388831744" style="border: 0;padding: 10px;border-radius: 3px;background: #ccc;color: #000;" id="subscribeKey"><input type="button" style="border: 0;padding: 10px;border-radius: 3px;background: #000;color: #fff; cursor: pointer;" value="' +
          config.l.subscribe +
          '" id="subscribe"></div></div><script>function setCookie(e,t,n){n=n||{};var o=n.expires;if("number"===typeof o&&o){var i=new Date;i.setTime(i.getTime()+1e3*o),o=n.expires=i}o&&o.toUTCString&&(n.expires=o.toUTCString()),t=encodeURIComponent(t);var r=e+"="+t;for(var a in n)if(n.hasOwnProperty(a)){r+="; "+a;var s=n[a];s!==!0&&(r+="="+s)}document.cookie=r}window.addEventListener("load",function(){var e=document.getElementById("subscribe");e.addEventListener("click",function(){var e=document.getElementById("subscribeKey");e&&e.value&&(setCookie("CP_subscribe",e.value,{expires:29549220,path:"/"}),setTimeout(function(){location.reload(!0)},1e3))})});</script>';
      }
    } else if (modules.blocking.data.display === 'legal') {
      if (
        options.userinfo &&
        modules.blocking.data.legal.countries.filter(function(c) {
          return new RegExp(options.userinfo.country_en, 'i').test(c);
        }).length === 0
      ) {
        code.player =
          block.time && !tv
            ? '<div id="blocking" style="position:absolute;background:#000 url(' +
              config.default.image +
              ') 100% 100% no-repeat;background-size:100% 100%;z-index:10000;top:0;left:0;width:100%;height:100%;color:#fff;text-align:center;text-shadow: 1px 1px #000;"><div id="blockingMessage" style="margin:80px auto 0;width:70%">' +
              message +
              '</div></div><script>window.addEventListener("load",function(){var e=document.getElementById("blockingTimer"),n=' +
              block.time +
              ';var si=setInterval(function(){if(e.innerHTML=""+n,n=parseInt(n),n--,0>n){var t=document.getElementById("blocking");t.parentElement.removeChild(t);clearInterval(si)}},1e3);});</script>' +
              code.player.replace(
                /data-player="[a-z0-9,\s%]*?"/i,
                'data-player="trailer"'
              )
            : code.player.replace(
                /data-player="[a-z0-9,\s%]*?"/i,
                'data-player="trailer"'
              );
        code.footer = code.footer
          .replace(/\?player=.*?"/i, '"')
          .replace(/\?&id=.*?"/i, '"');
        code.footer =
          code.footer +
          '<style>.search-ggl span.g{color:#4285F4}.search-ggl span.o:nth-child(2){color:#EA4335}.search-ggl span.o:nth-child(3){color:#FBBC05}.search-ggl span.l{color:#34A853}.search-ggl span.e{color:#EA4335}.search-ynd span.y{color:#FF0000}.search-ggl, .search-ynd{float:left;width:50%;background:#333;padding:10px 0;cursor:pointer;text-align:center;color:#fff;}.search-ggl:hover, .search-ynd:hover{background:#444;}div.search-ggl{border-radius:5px 0 0 5px;}div.search-ynd{border-radius:0 5px 5px 0;}</style>';
      }
    }
  }

  return code;
}

module.exports = {
  code: blockingPlayer
};
