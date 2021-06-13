'use strict';

/**
 * Node dependencies.
 */

var entities = require('html-entities');

/**
 * Decoding the text.
 *
 * @param {String} text
 * @return {String}
 */

function decodeText(text) {
  var out = '',
    arr,
    i = 0,
    l,
    x;
  text = entities.decode(text, { level: 'all' });
  arr = text.split(/(%(?:D0|D1)%.{2})/);
  for (l = arr.length; i < l; i++) {
    try {
      x = decodeURIComponent(arr[i]);
    } catch (e) {
      x = arr[i];
    }
    out += x;
  }
  return out.search(/[0-9]{1,5}\+[0-9]{1,5}/) + 1
    ? out
    : out.replace(/\+/g, ' ');
}

module.exports = {
  text: decodeText
};
