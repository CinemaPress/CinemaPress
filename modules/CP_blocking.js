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
 * @param {String} [display]
 * @return {Object}
 */

function blockingPlayer(code, movie, options, display) {
  if (arguments.length === 1) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  if (
    modules.blocking.status &&
    modules.blocking.data[display || modules.blocking.data.display]
  ) {
    if (
      (display === 'app' || modules.blocking.data.display === 'app') &&
      !modules.app.status
    ) {
      return code;
    }
    var tv_version =
      options.domain.indexOf('tv.') !== -1 ||
      options.domain.indexOf('/tv-version') !== -1;
    var mobile_version =
      options.domain.indexOf('m.') !== -1 ||
      options.domain.indexOf('/mobile-version') !== -1;
    var block = modules.blocking.data[modules.blocking.data.display];

    var img = '"' + config.default.image + '"';
    var time = block.time ? block.time : 0;
    var skip = block.skip ? block.skip : '';
    var message = '<div id=blockingMessageText>' + block.message + '</div>';

    var share =
      '<div id="blockingShareDiv">' +
      '  <span id=blockingShare>' +
      '    <a href="#" target="_blank" class="fcbk"><img src="/themes/default/public/desktop/img/fcbk.svg" alt="Share"></a>' +
      '    <a href="#" target="_blank" class="tlgr"><img src="/themes/default/public/desktop/img/tlgr.svg" alt="Share"></a>' +
      '    <a href="#" target="_blank" class="vknt"><img src="/themes/default/public/desktop/img/vknt.svg" alt="Share"></a>' +
      '    <a href="#" target="_blank" class="twtr"><img src="/themes/default/public/desktop/img/twtr.svg" alt="Share"></a>' +
      '    <a href="#" target="_blank" class="onkl"><img src="/themes/default/public/desktop/img/onkl.svg" alt="Share"></a>' +
      '    <a href="#" target="_blank" class="pntr"><img src="/themes/default/public/desktop/img/pntr.svg" alt="Share"></a>' +
      '    <script>!function(){var e=encodeURIComponent(window.location.href.replace(window.location.hash,"")),t=encodeURIComponent(document.title),r=document.querySelector("[data-cinemapress-poster]")?encodeURIComponent(document.querySelector("[data-cinemapress-poster]").dataset.cinemapressPoster):"",o=document.querySelector(".tlgr"),n=document.querySelector(".fcbk"),c=document.querySelector(".vknt"),s=document.querySelector(".twtr"),u=document.querySelector(".onkl"),a=document.querySelector(".pntr");o&&(o.href="https://telegram.me/share/url?url="+e+"&text="+t),n&&(n.href="https://www.facebook.com/sharer/sharer.php?u="+e),c&&(c.href="https://vk.com/share.php?url="+e+"&title="+t),s&&(s.href="https://twitter.com/intent/tweet?url="+e+"&text="+t),u&&(u.href="https://connect.ok.ru/dk?st.cmd=WidgetSharePreview&service=odnoklassniki&st.shareUrl="+e),a&&(a.href="https://pinterest.com/pin/create/button/?url="+e+"&media="+r);var s=document.getElementById("blockingShare");s.addEventListener("click",function(){setTimeout(function(){var t=document.getElementById("blockingPlayer");t.parentElement.removeChild(t)},10000)});}();</script>' +
      '    <style>.tlgr img,.fcbk img,.vknt img,.twtr img,.onkl img,.pntr img{width:50px;height:50px;margin:5px;display: inline-block;;opacity:.8}.tlgr img:hover,.fcbk img:hover,.vknt img:hover,.twtr img:hover,.onkl img:hover,.pntr img:hover{opacity:.6}#blockingShare{padding:0;margin:20px auto}#blockingShareDiv{position:absolute;z-index:100001;margin:20px auto;text-align:center;width:100%}</style>' +
      '  </span>' +
      '</div>';

    var adblock =
      '<script src="/themes/default/public/desktop/js/ads.js" charset="utf-8"></script>' +
      '<script>document.addEventListener("DOMContentLoaded",function(){if(document.getElementById("CinemaPress")){var t=document.getElementById("blockingPlayer");t.parentElement.removeChild(t)}});</script>';

    var sub =
      '<input type="text" placeholder="CP8881160388831744" style="border: 0;padding: 10px;border-radius: 3px;background: #ccc;color: #000; margin: 20px;width: 200px;;opacity:.8" id="subscribeKey"><input type="button" style="border: 0;padding: 10px;border-radius: 3px;background: #000;color: #fff; cursor: pointer;;opacity:.8" value="' +
      config.l.subscribe +
      '" id="subscribe">' +
      '<script>(function(){var e=document.getElementById("subscribe");e.addEventListener("click",function(){var e=document.getElementById("subscribeKey");e&&e.value&&(setCookieCinemaPress("CP_subscribe",e.value,{expires:29549220,path:"/"}),setTimeout(function(){location.reload(!0)},1e3))})})();</script>';

    var legal =
      CP_text.formatting(
        config.language === 'ru'
          ? "<div style='width:90%;margin:20px auto;opacity:.8'><div class=search-ggl onclick=\"window.open('https://href.li/?https://google.com/search?&tbm=vid&q=[title] [year] смотреть онлайн','_blank')\">Смотреть онлайн в <span class=g>G</span><span class=o>o</span><span class=o>o</span><span class=g>g</span><span class=l>l</span><span class=e>e</span></div><div class=search-ynd  onclick=\"window.open('https://href.li/?https://yandex.fr/video/search?text=[title] [year] смотреть онлайн','_blank')\">Смотреть онлайн в <span class=y>Я</span>ндекс</div><br><br><br><div class=search-ivi onclick=\"window.open('https://href.li/?https://www.ivi.ru/search/?q=[title]','_blank')\">Купить в <span class=i>ivi</span></div><div class=search-knp onclick=\"window.open('https://href.li/?https://www.kinopoisk.ru/film/[kp_id]/watch/?from_block=button_online','_blank')\">Купить в КиноПоиск <span class=h>HD</span></div></div>"
          : "<div style='width:90%;margin:20px auto;opacity:.8'><div class=search-ggl onclick=\"window.open('https://href.li/?https://google.com/search?&tbm=vid&q=[title] [year] watch online','_blank')\">Watch online on <span class=g>G</span><span class=o>o</span><span class=o>o</span><span class=g>g</span><span class=l>l</span><span class=e>e</span></div>\n\n<div class=search-ynd  onclick=\"window.open('https://href.li/?https://yandex.fr/video/search?text=[title] [year] watch online','_blank')\">Watch online on <span class=y>Y</span>andex</div>\n\n<br><br><br>\n\n<div class=search-ggl onclick=\"window.open('https://href.li/?https://play.google.com/store/search?c=movies&q=[title]','_blank')\">Buy on <span class=g>G</span><span class=o>o</span><span class=o>o</span><span class=g>g</span><span class=l>l</span><span class=e>e</span> Play</div>\n\n<div class=search-amz onclick=\"window.open('https://href.li/?https://www.amazon.com/s?i=instant-video&k=[title]','_blank')\">Buy on amazon <span class=p>prime</span></div></div>",
        movie
      ) +
      '<style>.search-ggl span.g{color:#4285F4}.search-ggl span.o:nth-child(2){color:#EA4335}.search-ggl span.o:nth-child(3){color:#FBBC05}.search-ggl span.l{color:#34A853}.search-ggl span.e{color:#EA4335}.search-ynd span.y{color:#FF0000}.search-ggl,.search-ynd,.search-amz,.search-ivi,.search-knp{float:left;width:50%;background:#111;padding:10px 0;cursor:pointer;text-align:center;color:#fff;margin:-3px;}.search-ggl:hover,.search-ynd:hover,.search-amz:hover,.search-ivi:hover,.search-knp:hover{background:#222;}div.search-ggl,div.search-ivi{border-radius:5px 0 0 5px;border-left: 5px #16494e solid;}div.search-ynd,div.search-amz,div.search-knp{border-radius:0 5px 5px 0;border-right: 5px #16494e solid;}.search-amz span.p{color:#00aae1}.search-knp span.h{color:#ff6600;font-style:italic}.search-ivi span.i{color:#ec174f}</style>';

    var app =
      "<div style='width:90%;margin:20px auto;opacity:.8'>" +
      '    <div class=download-macos onclick="window.location.href=\'' +
      modules.blocking.data.app.download.macos +
      '\'">' +
      '        macOS<br><br>' +
      '        <img alt="macOS" src=\'/themes/default/public/app/img/macos.svg\' class="download-logo">' +
      '        <br><br>' +
      '        <img alt="Download" src="/themes/default/public/app/img/zip.svg" class="download-zip">&nbsp;' +
      '        <span class="download-text">' +
      config.l.downloading +
      '</span>' +
      '    </div>' +
      '    <div class=download-windows onclick="window.location.href=\'' +
      modules.blocking.data.app.download.windows +
      '\'">' +
      '        Windows<br><br>' +
      '        <img alt="Windows" src=\'/themes/default/public/app/img/windows.svg\' class="download-logo">' +
      '        <br><br>' +
      '        <img alt="Download" src="/themes/default/public/app/img/zip.svg" class="download-zip">&nbsp;' +
      '        <span class="download-text">' +
      config.l.downloading +
      '</span>' +
      '    </div>' +
      '    <div class=download-linux onclick="window.location.href=\'' +
      modules.blocking.data.app.download.linux +
      '\'">' +
      '        Linux<br><br>' +
      '        <img alt="Linux" src=\'/themes/default/public/app/img/linux.svg\' class="download-logo">' +
      '        <br><br>' +
      '        <img alt="Download" src="/themes/default/public/app/img/zip.svg" class="download-zip">&nbsp;' +
      '        <span class="download-text">' +
      config.l.downloading +
      '</span>' +
      '    </div>' +
      (modules.blocking.data.app.safe.macos ||
      modules.blocking.data.app.safe.windows ||
      modules.blocking.data.app.safe.linux
        ? (modules.blocking.data.app.safe.macos
            ? '    <div class=total-macos onclick="window.open(\'' +
              modules.blocking.data.app.safe.macos +
              "','_blank')\">" +
              '      <img alt="Safe" src="/themes/default/public/app/img/shield.svg" class="total-safe">&nbsp;' +
              '      <span class="total-text">' +
              config.l.safety +
              '</span>' +
              '    </div>'
            : '<div class="total-macos no-hover"><span style="display: none">.</span></div>') +
          (modules.blocking.data.app.safe.windows
            ? '    <div class=total-windows onclick="window.open(\'' +
              modules.blocking.data.app.safe.windows +
              "','_blank')\">" +
              '      <img alt="Safe" src="/themes/default/public/app/img/shield.svg" class="total-safe">&nbsp;' +
              '      <span class="total-text">' +
              config.l.safety +
              '</span>' +
              '    </div>'
            : '<div class="total-windows no-hover"><span style="display: none">.</span></div>') +
          (modules.blocking.data.app.safe.linux
            ? '    <div class=total-linux onclick="window.open(\'' +
              modules.blocking.data.app.safe.linux +
              "','_blank')\">" +
              '      <img alt="Safe" src="/themes/default/public/app/img/shield.svg" class="total-safe">&nbsp;' +
              '      <span class="total-text">' +
              config.l.safety +
              '</span>' +
              '    </div>'
            : '<div class="total-linux no-hover"><span style="display: none">.</span></div>')
        : '') +
      (modules.blocking.data.app.instruction.macos ||
      modules.blocking.data.app.instruction.windows ||
      modules.blocking.data.app.instruction.linux
        ? (modules.blocking.data.app.instruction.macos
            ? '    <div class=instruction-macos onclick="window.open(\'' +
              modules.blocking.data.app.instruction.macos +
              "','_blank')\">" +
              '      <img alt="Instruction" src="/themes/default/public/app/img/instruction.svg" class="total-instruction">&nbsp;' +
              '      <span class="instruction-text">' +
              config.l.instruction +
              '</span>' +
              '    </div>'
            : '<div class="instruction-macos no-hover"><span style="display: none">.</span></div>') +
          (modules.blocking.data.app.instruction.windows
            ? '    <div class=instruction-windows onclick="window.open(\'' +
              modules.blocking.data.app.instruction.windows +
              "','_blank')\">" +
              '      <img alt="Instruction" src="/themes/default/public/app/img/instruction.svg" class="total-instruction">&nbsp;' +
              '      <span class="instruction-text">' +
              config.l.instruction +
              '</span>' +
              '    </div>'
            : '<div class="instruction-windows no-hover"><span style="display: none">.</span></div>') +
          (modules.blocking.data.app.instruction.linux
            ? '    <div class=instruction-linux onclick="window.open(\'' +
              modules.blocking.data.app.instruction.linux +
              "','_blank')\">" +
              '      <img alt="Instruction" src="/themes/default/public/app/img/instruction.svg" class="total-instruction">&nbsp;' +
              '      <span class="instruction-text">' +
              config.l.instruction +
              '</span>' +
              '    </div>'
            : '<div class="instruction-linux no-hover"><span style="display: none">.</span></div>')
        : '') +
      '</div>' +
      '<style>' +
      '.download-macos,' +
      '.download-windows,' +
      '.download-linux,' +
      '.instruction-macos,' +
      '.instruction-windows,' +
      '.instruction-linux,' +
      '.total-macos,' +
      '.total-windows,' +
      '.total-linux{' +
      '    float:left;' +
      '    width:33.3%;' +
      '    background:#111;' +
      '    padding:10px 0;' +
      '    cursor:pointer;' +
      '    text-align:center;' +
      '    color:#fff;' +
      '    margin:0;' +
      '    font-size:11px;' +
      '    line-height: 1;' +
      '}' +
      '.no-hover{' +
      '    min-height: 25px' +
      '}' +
      '.download-macos img,' +
      '.download-windows img,' +
      '.download-linux img,' +
      '.instruction-macos img,' +
      '.instruction-windows img,' +
      '.instruction-linux img,' +
      '.total-macos img,' +
      '.total-windows img,' +
      '.total-linux img{' +
      '    margin:0;' +
      '    padding:0' +
      '    display: inline-block;' +
      '}' +
      '.total-macos,' +
      '.total-windows,' +
      '.total-linux{' +
      '    color:#00dd80;' +
      '}' +
      '.instruction-macos,' +
      '.instruction-windows,' +
      '.instruction-linux{' +
      '    color:#428dff;' +
      '}' +
      '.download-logo{' +
      '    width: 50px; height: 50px;' +
      '}' +
      '.download-zip,.total-safe,.total-instruction{' +
      '    width: 15px; height: 15px; vertical-align:middle' +
      '}' +
      '.download-text,.total-text,.instruction-text{' +
      '    line-height: 15px; vertical-align:middle' +
      '}' +
      '.download-macos:hover,' +
      '.download-windows:hover,' +
      '.download-linux:hover,' +
      '.instruction-macos:hover,' +
      '.instruction-windows:hover,' +
      '.instruction-linux:hover,' +
      '.total-macos:hover,' +
      '.total-windows:hover,' +
      '.total-linux:hover{' +
      '    background:#222;' +
      '}' +
      '.download-macos:hover.no-hover,' +
      '.download-windows:hover.no-hover,' +
      '.download-linux:hover.no-hover,' +
      '.instruction-macos:hover.no-hover,' +
      '.instruction-windows:hover.no-hover,' +
      '.instruction-linux:hover.no-hover,' +
      '.total-macos:hover.no-hover,' +
      '.total-windows:hover.no-hover,' +
      '.total-linux:hover.no-hover{' +
      '    background:#111;' +
      '    cursor: auto' +
      '}' +
      'div.download-macos,' +
      'div.instruction-macos,' +
      'div.total-macos{' +
      '    border-radius: 5px 0 0 5px;' +
      '    ' +
      '}' +
      'div.download-linux,' +
      'div.instruction-linux,' +
      'div.total-linux{' +
      '    border-radius: 0 5px 5px 0' +
      '    ' +
      '}' +
      '.instruction-macos,' +
      '.instruction-windows,' +
      '.instruction-linux,' +
      '.total-macos,' +
      '.total-windows,' +
      '.total-linux{' +
      '    padding:5px 0;' +
      '    margin:5px 0 0 0;' +
      '    border:0;' +
      '}' +
      '#blockingMessageText {' +
      '    background:none !important;' +
      '    border:0 !important;' +
      '    font-weight: bold;' +
      '    text-overflow: ellipsis;' +
      '    overflow: hidden;' +
      '    white-space: nowrap;' +
      '}' +
      '#blockingBg {' +
      '    background-color: inherit !important;' +
      '}' +
      '</style>';
    if (modules.blocking.data.display === 'app') {
      img = '/themes/default/public/app/img/player.png';
    }

    var blocking =
      '<div id=blockingPlayer>' +
      '  <div id=blockingMessage>' +
      (modules.blocking.data.display === 'adv' ? block.message : message) +
      (modules.blocking.data.display === 'share' ? share : '') +
      (modules.blocking.data.display === 'adblock' ? adblock : '') +
      (modules.blocking.data.display === 'sub' ? sub : '') +
      (modules.blocking.data.display === 'legal' ? legal : '') +
      (modules.blocking.data.display === 'app' ? app : '') +
      '  </div>' +
      '  <div id=blockingBg></div>' +
      (time
        ? '  <div id=blockingCountdown>' +
          '    <div id="blockingCountdownNumber"></div>' +
          '    <svg><circle r="18" cx="20" cy="20"></circle></svg>' +
          '  </div>'
        : '') +
      '</div>' +
      '<style>#blockingPlayer{display:block}#blockingMessage{position:absolute;z-index:100001;text-align:center;width:100%}#blockingMessageText{margin: 50px auto 0 auto;width: 70%;background:#000;color:#fff;padding: 20px;border-radius: 5px;border-right: 5px#16494e solid;border-left: 5px#16494e solid;opacity:.8;text-shadow: 1px 1px #000}#blockingTimer{background:#000;color:#ccc;padding: 10px 20px;border-radius: 0 3px 3px 0;font-family: monospace,sans-serif;position: absolute;left: 0;bottom: 10px;font-size: 20px;font-weight: bold;border-right: 5px#ccc solid;border-top: 1px#ccc dotted;border-bottom: 1px#ccc dotted;z-index:100001;}#blockingBg{position:absolute;background:#000 url(' +
      img +
      ') 100% 100% no-repeat;background-size:100% 100%;z-index:10000;top:0;left:0;width:100%;height:100%;color:#fff;text-align:center;text-shadow: 1px 1px #000;}</style>';
    var countdown = time
      ? "<script>(function(){var cd=document.getElementById('blockingCountdown');var el=document.getElementById('blockingCountdownNumber');" +
        'var s="' +
        skip +
        '";' +
        'var c=' +
        time +
        ';el.textContent=c;var si=setInterval(function(){c=--c;if(c<=0){clearInterval(si);if(s){cd.innerHTML=s;cd.setAttribute("class","blockingSkip");cd.addEventListener("click",function(){var t=document.getElementById("blockingPlayer");t.parentElement.removeChild(t)});return;}var t=document.getElementById("blockingPlayer");t.parentElement.removeChild(t)}el.textContent=c},1000)})();</script>' +
        '<style>#blockingCountdown{color:#fff;z-index:100001;position:absolute;left:12px;top:12px;margin:0;height:40px;width:40px;text-align:center;}#blockingCountdownNumber{color:white;display:inline-block;line-height:40px;}#blockingCountdown svg{position:absolute;top:0;right:0;width:40px;height:40px;transform:rotateY(-180deg) rotateZ(-90deg);z-index:-1}#blockingCountdown svg circle {stroke-dasharray:113px;stroke-dashoffset: 0;stroke-linecap:round;stroke-width:2px;stroke:white;fill:#000;animation:countdown ' +
        time +
        's linear infinite forwards;}@keyframes countdown {from{stroke-dashoffset:0}to{stroke-dashoffset:113px}}.blockingSkip{z-index: 100001;position: absolute;left: 10px;top: 10px;margin: 0;height: auto !important;width: auto !important;text-align: center;background:#000;padding: 15px 20px;border-radius: 5px;cursor: pointer;border: 2px #16494e dotted;line-height:1;}</style>'
      : '';

    if (modules.blocking.data.display === 'share' && !tv_version) {
      code.player = blocking + countdown + code.player;
    } else if (modules.blocking.data.display === 'adv') {
      code.player = blocking + countdown + code.player;
    } else if (modules.blocking.data.display === 'adblock' && !tv_version) {
      code.player = blocking + countdown + code.player;
    } else if (modules.blocking.data.display === 'app') {
      var l =
        options.userinfo &&
        modules.blocking.data.app.countries &&
        modules.blocking.data.app.countries.length
          ? modules.blocking.data.app.countries.filter(function(c) {
              return new RegExp(options.userinfo.country_en, 'i').test(c);
            }).length
          : 1;
      if (l >= 1 || display) {
        code.player =
          time && !tv_version && !mobile_version
            ? blocking +
              countdown +
              code.player.replace(
                /data-player="[a-z0-9,\s%]*?"/i,
                'data-player="trailer"'
              )
            : blocking +
              code.player.replace(
                /data-player="[a-z0-9,\s%]*?"/i,
                'data-player="trailer"'
              );
        code.footer = code.footer
          .replace(/\?player=.*?"/i, '"')
          .replace(/\?&id=.*?"/i, '"');
      }
    } else if (modules.blocking.data.display === 'sub') {
      if (
        !options.subscribe ||
        (options.subscribe &&
          modules.blocking.data.sub.keys.indexOf(options.subscribe) === -1)
      ) {
        code.player = blocking;
      }
    } else if (modules.blocking.data.display === 'legal') {
      if (
        options.userinfo &&
        modules.blocking.data.legal.countries.filter(function(c) {
          return new RegExp(options.userinfo.country_en, 'i').test(c);
        }).length === 0
      ) {
        code.player =
          time && !tv_version
            ? blocking +
              countdown +
              code.player.replace(
                /data-player="[a-z0-9,\s%]*?"/i,
                'data-player="pleer,trailer"'
              )
            : code.player.replace(
                /data-player="[a-z0-9,\s%]*?"/i,
                'data-player="pleer,trailer"'
              );
        code.footer = code.footer
          .replace(/\?player=.*?"/i, '"')
          .replace(/\?&id=.*?"/i, '"');
      }
    }
  }

  return code;
}

module.exports = {
  code: blockingPlayer
};
