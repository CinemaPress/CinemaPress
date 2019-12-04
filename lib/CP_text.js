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
      (typeof keywords[key] === 'string' ||
        typeof keywords[key] === 'number') &&
      !/_url|_arr|poster|picture|description|year2|year3/i.test(key)
    ) {
      var keyRegExp = ('' + key).replace(/[-\/\\\^$*+?.()|\[\]{}]/g, '\\$&');
      var keyRegExp2 = keyRegExp.charAt(0).toUpperCase() + keyRegExp.slice(1);
      var keyword = '' + keywords[key];
      var keywordRegExp = keyword.replace(/[-\/\\\^$*+?.()|\[\]{}]/g, '\\$&');

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

      if (text.indexOf(']') + 1) {
        var allKeys = new RegExp('\\[' + keyRegExp + '\\]', 'g');
        var allKeys2 = new RegExp('\\[' + keyRegExp2 + '\\]', 'g');
        text = text
          .replace(allKeys, keyword)
          .replace(
            allKeys2,
            keyword.charAt(0).toUpperCase() + keyword.slice(1)
          );
      }
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
      if (parts[1] && parts[1].indexOf('|') + 1) {
        var part = parts[1].split('|');
        var replace = part[Math.floor(Math.random() * part.length)];
        text = text.replace(search, replace);
      } else {
        text = text.replace(search, '');
      }
    } else {
      break;
    }
  }

  return text.replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '');
}

module.exports = {
  formatting: textFormatting
};
