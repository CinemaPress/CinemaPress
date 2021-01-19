'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../config/production/config.backup'));

/**
 * Add autocomplete script.
 *
 * @return {String}
 */

function codeAutocomplete() {
  return (
    '<script>document.addEventListener("DOMContentLoaded",function(){var e=document.querySelectorAll("input[data-autocomplete]");if(e)for(var t=0;t<e.length;t++)e[t].setAttribute("autocomplete","off");var n=document.querySelectorAll(".cinemapress-autocomplete");if(n)for(var o=0;o<n.length;o++){var a=document.querySelector(\'input[data-autocomplete="\'+n[o].dataset.autocomplete+\'"]\');if(!a)return;a.addEventListener("input",function(){if(this&&this.value&&!(this.value.length<=3)){var r=this.value,s=document.querySelector(\'div[data-autocomplete="\'+this.dataset.autocomplete+\'"]\');s.style.display="none";var i=new XMLHttpRequest;i.open("GET",(window.location.href.indexOf("/mobile-version")+1 ? "/mobile-version" : "") + "/' +
    config.urls.search +
    '?json=1&q="+encodeURIComponent(r)),i.responseType="json",i.send(),i.onload=function(){if(200===i.status&&i.response&&i.response.movies&&i.response.movies.length){var e=document.createElement("ul");s.innerHTML="",s.appendChild(e);for(var t=0;t<i.response.movies.length;t++){var n=i.response.movies[t],o=document.createElement("li");o.dataset.url=n.url,o.innerHTML=\'<img src="\'+n.poster_min+\'" alt="Poster"><p><strong>\'+n.title+"</strong><br><span><small>"+n.country+" | "+n.genre+"</small></span><br><i><small>"+n.year+"</small></i></p>",o.addEventListener("click",function(){window.location.href=this.dataset.url}),e.appendChild(o)}var a=document.createElement("div");a.innerHTML="' +
    config.l.results +
    '",a.addEventListener("click",function(){window.location.href=(window.location.href.indexOf("/mobile-version")+1 ? "/mobile-version" : "") + "/' +
    config.urls.search +
    '?q="+encodeURIComponent(r)}),s.appendChild(a),s.style.display="block"}},document.addEventListener("click",function(e){s.contains(e.target||e.srcElement)||(s.style.display="none")})}})}});</script>'
  );
}

module.exports = {
  code: codeAutocomplete
};
