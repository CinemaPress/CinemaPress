'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../config/production/config.backup'));

/**
 * Formatting text to create synonyms, categories and keys.
 *
 * @param {String} text
 * @param {Object} [keywords]
 * @return {String}
 */

var types = {
  mult: config.default.types.mult
    .replace(/![^\s]+/g, '')
    .split('|')
    .map(function(genre) {
      return genre.trim();
    })
    .filter(Boolean),
  anime: config.default.types.anime
    .replace(/![^\s]+/g, '')
    .split('|')
    .map(function(genre) {
      return genre.trim();
    })
    .filter(Boolean),
  tv: config.default.types.tv
    .replace(/![^\s]+/g, '')
    .split('|')
    .map(function(genre) {
      return genre.trim();
    })
    .filter(Boolean)
};

function textFormatting(text, keys) {
  if (typeof text === 'undefined') {
    text = '';
  } else {
    text = '' + text;
  }

  var keywords = {};

  if (typeof keys !== 'undefined' && typeof keys === 'object') {
    keywords = Object.assign({}, keys, {
      types: '',
      category:
        keys['year'] ||
        keys['genre'] ||
        keys['country'] ||
        keys['actor'] ||
        keys['director'] ||
        keys['search'] ||
        keys['type'] ||
        ''
    });
  }

  var dflt = true;

  if (
    text.indexOf('}') === -1 &&
    text.indexOf(']') === -1 &&
    text.indexOf('|') === -1
  ) {
    return text.replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '');
  }

  for (var key in keywords) {
    if (
      keywords.hasOwnProperty(key) &&
      (typeof keywords[key] === 'string' ||
        typeof keywords[key] === 'number') &&
      !/_full|_page|_url|_arr|poster|picture|description|year2|year3/i.test(key)
    ) {
      var keyRegExp = ('' + key).replace(/[-\/\\\^$*+?.()|\[\]{}]/g, '\\$&');
      var keyRegExp2 = keyRegExp.charAt(0).toUpperCase() + keyRegExp.slice(1);
      var keyword = '' + keywords[key];
      var keywordRegExp = keyword.replace(/[-\/\\\^$*+?.()|\[\]{}]/g, '\\$&');

      if (keyRegExp === 'types') {
        if (typeof keywords['type'] !== 'undefined' && keywords['type'] + '') {
          var i = 0,
            l = 0;
          var stop = true;
          var types_set = [
            config.urls.types.movie,
            config.urls.types.serial,
            config.urls.types.mult,
            config.urls.types.multserial,
            config.urls.types.anime,
            config.urls.types.tv
          ]
            .filter(Boolean)
            .filter(function(t) {
              return t === '' + keywords['type'];
            });
          if (types_set.length) {
            keywordRegExp = types_set[0];
            stop = false;
          }
          if (
            stop &&
            typeof keywords['genres'] !== 'undefined' &&
            keywords['genres'] + ''
          ) {
            for (i = 0, l = types.anime.length; i < l; i++) {
              if (('' + keywords['genres']).indexOf(types.anime[i]) + 1) {
                keywordRegExp = config.urls.types.anime;
                stop = false;
                break;
              }
            }
          }
          if (
            stop &&
            typeof keywords['genres'] !== 'undefined' &&
            keywords['genres'] + ''
          ) {
            for (i = 0, l = types.tv.length; i < l; i++) {
              if (('' + keywords['genres']).indexOf(types.tv[i]) + 1) {
                keywordRegExp = config.urls.types.tv;
                stop = false;
                break;
              }
            }
          }
          if (
            stop &&
            ('' + keywords['type'] === '1' ||
              '' + keywords['type'] === config.urls.types.serial ||
              '' + keywords['type'] === config.urls.types.multserial)
          ) {
            if (
              typeof keywords['genres'] !== 'undefined' &&
              keywords['genres'] + ''
            ) {
              for (i = 0, l = types.mult.length; i < l; i++) {
                if (('' + keywords['genres']).indexOf(types.mult[i]) + 1) {
                  keywordRegExp = config.urls.types.multserial;
                  stop = false;
                  break;
                }
              }
            }
            if (stop) {
              stop = false;
              keywordRegExp = config.urls.types.serial;
            }
          }
          if (
            stop &&
            '' + keywords['type'] !== '1' &&
            '' + keywords['type'] !== config.urls.types.serial &&
            '' + keywords['type'] !== config.urls.types.multserial
          ) {
            if (
              typeof keywords['genres'] !== 'undefined' &&
              keywords['genres'] + ''
            ) {
              for (i = 0, l = types.mult.length; i < l; i++) {
                if (('' + keywords['genres']).indexOf(types.mult[i]) + 1) {
                  keywordRegExp = config.urls.types.mult;
                  stop = false;
                  break;
                }
              }
            }
            if (stop) {
              stop = false;
              keywordRegExp = config.urls.types.movie;
            }
          }
        }
      }

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

  if (dflt && text.indexOf('default') + 1) {
    var defaultSpecific = new RegExp(
      '(\\s*\\(\\s*default\\s*\\)\\s*\\{([^]*?)\\}\\s*)',
      'gi'
    );
    text = text.replace(defaultSpecific, ' $2 ');
  }

  if (text.indexOf('}') + 1) {
    var allSpecifics = new RegExp(
      '(\\s*\\([^]*?\\)\\s*\\{([^]*?)\\}\\s*)',
      'gi'
    );
    text = text.replace(allSpecifics, ' ');
  }

  if (text.indexOf(']') + 1) {
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
  }

  if (text.indexOf('+?') + 1) {
    text = text
      .replace(
        /(\+\?\s*\+\?\s*\+\?\s*\+\?\s*\+\?|\+\?\s*\+\?\s*\+\?\s*\+\?|\+\?\s*\+\?\s*\+\?|\+\?\s*\+\?)/g,
        '+?'
      )
      .replace(/(^\s*\+\?\s*)|(\s*\+\?\s*)$/g, '')
      .replace(/(\+\?)/g, '+');
  }

  if (text.indexOf('-?') + 1) {
    text = text
      .replace(
        /(-\?\s*-\?\s*-\?\s*-\?\s*-\?|-\?\s*-\?\s*-\?\s*-\?|-\?\s*-\?\s*-\?|-\?\s*-\?)/g,
        '-?'
      )
      .replace(/(^\s*-\?\s*)|(\s*-\?\s*)$/g, '')
      .replace(/(-\?)/g, '-');
  }

  return text.replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '');
}

module.exports = {
  formatting: textFormatting
};
