'use strict';

/**
 * Configuration dependencies.
 */

var modules = require('../config/production/modules');

/**
 * Add the function to continue viewing.
 * All pages should be a button: id="continueViewing"
 * On the page movie should be a button: id="watchLater"
 *
 * @return {String}
 */

function codeContinue() {
  var code = '';

  if (modules.continue.status) {
    code =
      '<script>function getCookie(e){var t=document.cookie.match(new RegExp("(?:^|; )"+e.replace(/([.$?*|{}()[]\\/+^])/g,"\\$1")+"=([^;]*)"));return t?decodeURIComponent(t[1]):void 0}function setCookie(e,t,n){var o=(n=n||{}).expires;if("number"==typeof o&&o){var a=new Date;a.setTime(a.getTime()+1e3*o),o=n.expires=a}o&&o.toUTCString&&(n.expires=o.toUTCString());var i=e+"="+(t=encodeURIComponent(t));for(var r in n)if(n.hasOwnProperty(r)){i+="; "+r;var c=n[r];!0!==c&&(i+="="+c)}document.cookie=i}function continueViewing(){var e=getCookie("CP_continue");e&&(window.location.href=e)}function watchLater(e){document.querySelector("#watchLater").textContent="✔ OK",setCookie("CP_continue",window.location.href.split("?")[0].split("#")[0].split(/\\/s[0-9]*?e[0-9]*?_[0-9]*?$/)[0]+e,{expires:31104e3,path:"/"})}window.addEventListener("load",function(){function t(t){if(t.data&&"MW_PLAYER_TIME_UPDATE"==t.data.message){l=Math.floor(t.data.value);var n=Math.floor(t.data.value),o=Math.floor(n/60),a=Math.floor(o/60),i=n%60?n%60<10?"0"+n%60:n%60:"00",r=o%60?o%60<10?"0"+o%60:o%60:"00",c=a%24?a%60<10?"0"+a%60:a%24:"00";d.innerHTML=s+" ["+c+":"+r+":"+i+"]"}if(t.data&&"MW_PLAYER_SELECT_EPISODE"==t.data.message){var v=t.data.value;v&&v.episode&&v.season&&v.token&&(u=v.token+"|"+v.season+"|"+v.episode)}}function n(){var e="";u&&(e="?start_episode="+u),l&&(e=e?e+"&start_time="+l:"?start_time="+l),watchLater(e),d.removeEventListener("click",n),window.addEventListener?window.removeEventListener("message",t):window.detachEvent("onmessage",t)}var o=document.querySelectorAll(".continueViewingBlock");if(o&&o.length&&getCookie("CP_continue"))for(var a=0;a<o.length;a++)o[a].style.display="block";var i=document.querySelector("#continueViewing");i&&i.addEventListener("click",continueViewing);var r=document.querySelectorAll(".watchLaterBlock");if(r&&r.length)for(var c=0;c<r.length;c++)r[c].style.display="block";var d=document.querySelector("#watchLater"),s=(d)?d.innerHTML:"",l=0,u="";window.addEventListener?window.addEventListener("message",t):window.attachEvent("onmessage",t),d&&d.addEventListener("click",n)});</script>';
  }

  return code;
}

module.exports = {
  code: codeContinue
};
