'use strict';

/**
 * Module dependencies.
 */

var CP_decode = require('../lib/CP_decode');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../config/production/config.backup'));
var config_md5 = require('md5')(JSON.stringify(config));

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
}, 3333);

/**
 * Translit the text.
 *
 * @param {String} text
 * @param {Boolean} [engToRus]
 * @param {String} [type]
 * @return {String}
 */

function translitText(text, engToRus, type) {
  if (type && typeof type === 'string' && type === config.urls.year) {
    return (text + '').replace(/[^0-9\-]/g, '');
  }
  text = text ? text : '';
  engToRus = engToRus ? engToRus : null;
  type = type && typeof type === 'string' ? type.charAt(0) : '';
  var key = '-';
  var r = new RegExp('[' + key + ']', 'gi');

  if (type) {
    text = text.replace(new RegExp('^' + type + key, 'i'), key);
  }

  if (!text) {
    return text;
  } else if (text.replace(/\D/g, '') === text) {
    return text;
  } else if (
    text.replace(/[А-Яа-яЁё]/g, '') === text &&
    text.substring(0, 1) !== key
  ) {
    return engToRus ? text.replace(r, ' ').trim() : text.replace(/[\s]/gi, key);
  } else if (!config.urls.translit) {
    return typeof engToRus !== 'boolean' ? encodeURIComponent(text) : text;
  } else if (typeof engToRus !== 'boolean') {
    text = text.substring(0, 1) !== key ? type + key + text : text;
  } else if (text.substring(0, 1) !== key) {
    return engToRus ? text.replace(r, ' ').trim() : text.replace(/[\s]/gi, key);
  }
  text = CP_decode.text(text);
  var rus = config.urls.translit_from.split(/ +/g);
  var eng =
    config.urls.translit === 1
      ? 'shh sh ch c  yu ya yo zh `` y  e` a b v g d e z i j k l m n o p r s t u f x `'.split(
          / +/g
        )
      : config.urls.translit_to.split(/ +/g);
  var x;
  for (x = 0; x < rus.length; x++) {
    text = text
      .split(engToRus ? eng[x] : rus[x])
      .join(engToRus ? rus[x] : eng[x]);
    text = text
      .split(engToRus ? eng[x].toUpperCase() : rus[x].toUpperCase())
      .join(engToRus ? rus[x].toUpperCase() : eng[x].toUpperCase());
  }
  text = engToRus ? text.replace(r, ' ').trim() : text.replace(/[\s]/gi, key);
  text = text.split(/\s+/).join(' ');
  return text;
}

module.exports = {
  text: translitText
};
