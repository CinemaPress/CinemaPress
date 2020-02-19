'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
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
    var width =
      modules.viewed.data && modules.viewed.data.width
        ? modules.viewed.data.width
        : '50px';
    var height =
      modules.viewed.data && modules.viewed.data.height
        ? modules.viewed.data.height
        : '70px';

    code =
      'var location_reg="' +
      (config.urls.slash === '/'
        ? '([htps:]{5,6}//[^/]*/(tv-version/|mobile-version/|)[^/]*/[^/]*)'
        : '([htps:]{5,6}//[^/]*/(tv-version/|mobile-version/|)[^/]*)') +
      '";' +
      'var viewed_count="' +
      count +
      '";' +
      'var viewed_width="' +
      width +
      '";' +
      'var viewed_height="' +
      height +
      '";' +
      'var viewed_domain="' +
      config.domain +
      '";' +
      'var viewed_subdomain="' +
      config.subdomain +
      '";' +
      '(function(){function e(){var e=new RegExp(location_reg,"ig").exec(window.location.href.split("?")[0].split("#")[0]);return e&&e[1]?e[1]:""}var t,n,i,r=(n=e(),i=(t=document.querySelector("[data-cinemapress-poster]"))&&t.dataset.cinemapressPoster?t.dataset.cinemapressPoster:"",n&&i?n+"|"+i:""),o=e();c=getCookieCinemaPress("CP_viewed"),a=document.getElementById("recentlyViewed"),d=c?c.split("~"):[];var p=(o)?d.filter(function(e){if(viewed_domain+"/"===o.toLowerCase().trim().replace("https://", "//").replace("http://", "//").replace("//" + viewed_subdomain, "").replace("//tv.", "").replace("//m.", "")){return true;}return-1===e.toLowerCase().trim().indexOf(o.toLowerCase().trim().replace("https://","//").replace("http://","//").replace("//"+viewed_subdomain,"").replace("//tv.","").replace("//m.",""))}):d;if(r&&((p.length>=parseInt(viewed_count)||3200<p.join("~").length)&&p.pop(),p.unshift(r)),a){var l=document.querySelectorAll(".recentlyViewedBlock");if( p.length&&l&&l.length)for(var s=0;s<l.length;s++)l[s].style.display="block";for(var u=0;u<p.length;u++)if(p[u]){var f=p[u].split("|"),m=document.createElement("a");if(!f[0]||!f[1]){p.splice(u,1),u--;continue}m.setAttribute("href",f[0]);var g=document.createElement("img");g.setAttribute("src",f[1]),g.setAttribute("style","width:" + viewed_width + ";height:" + viewed_height + ";margin:3px;border-radius:3px;"),m.appendChild(g),a.appendChild(m)}}r&&setCookieCinemaPress("CP_viewed",p.join("~"),{expires:864e3,path:"/",domain:"."+viewed_domain})})();';

    code = '<script>' + code + '</script>';
  }

  return code;
}

module.exports = {
  code: codeViewed
};
