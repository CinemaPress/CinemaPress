'use strict';

/**
 * Configuration dependencies.
 */

var modules = require('../config/production/modules');

/**
 * Add the function to continue viewing.
 * All pages in footer should be a block: id="recentlyViewed"
 *
 * @return {String}
 */

function codeViewed() {
  var code = '';

  if (modules.viewed.status) {
    var count =
      modules.viewed.data && modules.viewed.data.count
        ? modules.viewed.data.count
        : 20;

    code =
      'function getCookie(e){var t=document.cookie.match(new RegExp("(?:^|; )"+e.replace(/([.$?*|{}()\\[\\]\\\\\\/+^])/g,"\\\\$1")+"=([^;]*)"));return t?decodeURIComponent(t[1]):""}function setCookie(e,t,n){var i=(n=n||{}).expires;if("number"===typeof i&&i){var r=new Date;r.setTime(r.getTime()+1e3*i),i=n.expires=r}i&&i.toUTCString&&(n.expires=i.toUTCString());var o=e+"="+(t=encodeURIComponent(t));for(var c in n)if(n.hasOwnProperty(c)){o+="; "+c;var a=n[c];!0!==a&&(o+="="+a)}document.cookie=o}window.addEventListener("load",function(){function e(){var e=new RegExp("([htps:]{5,6}//[^/]*/[^/]*/[^/]*)","ig").exec(window.location.href);return e&&e[1]?e[1]:""}var t,n,i,r=(n=e(),i=(t=document.getElementById("cinemapress-poster"))&&t.src?t.src:"",n&&i?n+"|"+i:""),o=e();c=getCookie("CP_viewed"),a=document.getElementById("recentlyViewed"),d=c?c.split("~"):[];var p=(o)?d.filter(function(e){return-1===e.indexOf(""+o)}):d;if(r&&((p.length>=parseInt(' +
      count +
      ')||3200<p.join("~").length)&&p.pop(),p.unshift(r)),a){var l=document.querySelectorAll(".recentlyViewedBlock");if(l&&l.length)for(var s=0;s<l.length;s++)l[s].style.display="block";for(var u=0;u<p.length;u++)if(p[u]){var f=p[u].split("|"),m=document.createElement("a");if(!f[0]||!f[1]){p.splice(u,1),u--;continue}m.setAttribute("href",f[0]);var g=document.createElement("img");g.setAttribute("src",f[1]),g.setAttribute("style","width: 52px; height: 72px; margin: 3px; border-radius:3px;"),m.appendChild(g),a.appendChild(m)}}r&&setCookie("CP_viewed",p.join("~"),{expires:864e3,path:"/"})});';

    code = '<script>' + code + '</script>';
  }

  return code;
}

module.exports = {
  code: codeViewed
};
