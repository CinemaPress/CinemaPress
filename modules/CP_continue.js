'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../config/production/config.backup'));
var config_md5 = require('md5')(JSON.stringify(config));

var modules = require('../config/production/modules');
Object.keys(modules).length === 0 &&
  (modules = require('../config/production/modules.backup'));
var modules_md5 = require('md5')(JSON.stringify(modules));

setInterval(function() {
  if (
    config_md5 &&
    process.env['CP_CONFIG_MD5'] &&
    config_md5 !== process.env['CP_CONFIG_MD5']
  ) {
    config = require('../config/production/config');
    Object.keys(config).length === 0 &&
      (config = require('../config/production/config.backup'));
    config_md5 = process.env['CP_CONFIG_MD5'];
  }
  if (
    modules_md5 &&
    process.env['CP_MODULES_MD5'] &&
    modules_md5 !== process.env['CP_MODULES_MD5']
  ) {
    modules = require('../config/production/modules');
    Object.keys(modules).length === 0 &&
      (modules = require('../config/production/modules.backup'));
    modules_md5 = process.env['CP_MODULES_MD5'];
  }
}, 3333);

/**
 * Add the function to continue viewing.
 * All pages should be a button: id="continueViewing"
 * On the page movie should be a button: id="watchLater"
 *
 * @return {String}
 */

function codeContinue(options) {
  var code = '';

  if (modules.continue.status) {
    code =
      'var continue_domain="' +
      (options.current_domain || config.domain) +
      '";' +
      'function continueViewing(){var e=getCookieCinemaPress("CP_continue");e&&(window.location.href=e)}function watchLater(){document.querySelector("#watchLater").textContent="✔ OK",setCookieCinemaPress("CP_continue",window.location.href.split("?")[0].split("#")[0].split(/\\/s[0-9]*?e[0-9]*?_[0-9]*?$/)[0],{expires:31104e3,path:"/",domain:"."+continue_domain})}!function(){var t=document.querySelectorAll(".continueViewingBlock");if(t&&t.length&&getCookieCinemaPress("CP_continue"))for(var n=0;n<t.length;n++)t[n].style.display="block";var i=document.querySelector("#continueViewing");i&&i.addEventListener("click",continueViewing);var o=document.querySelectorAll(".watchLaterBlock");if(o&&o.length)for(var c=0;c<o.length;c++)o[c].style.display="block";var r=document.querySelector("#watchLater");r&&r.innerHTML;r&&r.addEventListener("click",function t(){watchLater(),r.removeEventListener("click",t)})}();';

    code = '<script>' + code + '</script>';
  }

  return code;
}

module.exports = {
  code: codeContinue
};
