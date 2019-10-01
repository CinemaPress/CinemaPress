'use strict';

/**
 * Formatting text to create synonyms, categories and keys.
 *
 * @param {String} text
 * @param {Object} [keywords]
 * @return {String}
 */

function textFormatting(text, keywords) {
  if (typeof text === 'undefined') {
    text = '';
  } else {
    text = '' + text;
  }

  if (typeof keywords === 'undefined') {
    keywords = {};
  }

  var dflt = true;

  for (var key in keywords) {
    if (
      keywords.hasOwnProperty(key) &&
      key.search(/_url|_arr|poster|picture|description/gi) === -1
    ) {
      var keyRegExp = ('' + key).replace(/[-\/\\\^$*+?.()|\[\]{}]/g, '\\$&');
      var keywordRegExp = ('' + keywords[key]).replace(
        /[-\/\\\^$*+?.()|\[\]{}]/g,
        '\\$&'
      );

      if (text.indexOf('}') + 1) {
        var allSpecific = new RegExp(
          '(\\s*\\(\\s*' + keywordRegExp + '\\s*\\)\\s*\\{([^]*?)\\}\\s*)',
          'gi'
        );
        var match = allSpecific.exec(text);
        if (match) {
          dflt = false;
        }
        text = text.replace(allSpecific, ' $2 ');
      }

      var allKeys = new RegExp('\\[' + keyRegExp + '\\]', 'g');
      text = text.replace(allKeys, keywords[key]);
    }
  }

  if (dflt) {
    var defaultSpecific = new RegExp(
      '(\\s*\\(\\s*default\\s*\\)\\s*\\{([^]*?)\\}\\s*)',
      'gi'
    );
    text = text.replace(defaultSpecific, ' $2 ');
  }

  var allSpecifics = new RegExp('(\\s*\\([^]*?\\)\\s*\\{([^]*?)\\}\\s*)', 'gi');
  text = text.replace(allSpecifics, ' ');

  text = text.replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '');

  while (true) {
    var p = new RegExp('\\[([^]*?)\\]', 'g');
    var parts = p.exec(text);

    if (parts) {
      var search = parts[0];
      var part = parts[1].split('|');
      var replace = part[Math.floor(Math.random() * part.length)];
      text = text.replace(search, replace);
    } else {
      break;
    }
  }

  return text;
}

module.exports = {
  formatting: textFormatting
};
