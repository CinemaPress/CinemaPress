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
 * Node dependencies.
 */

var md5 = require('md5');

/**
 * API structure.
 *
 * @return {Object}
 */

function movieApi(movie) {
  var custom = JSON.parse(movie.custom);
  var poster =
    !movie.poster || /^([01])$/.test(movie.poster)
      ? '' + (parseInt(movie.id) % 1000000000)
      : '' + movie.poster;
  var players = movie.player
    ? movie.player
        .replace(/(^\s*)|(\s*)$/g, '')
        .replace(/\s*,\s*/g, ',')
        .split(',')
        .map(function(p) {
          if (/\s*([^h\/]+?)\s+(http.+|\/\/.+)\s*/i.test(p.trim())) {
            var name_iframe = /\s*([^h\/]+?)\s+(http.+|\/\/.+)\s*/i.exec(
              p.trim()
            );
            var name = name_iframe[1];
            var iframe = name_iframe[2];
            var season, episode;
            if (/([0-9]+)\s+сезон\s+([0-9]+)\s+серия/i.test(name)) {
              var season_episode1 = /([0-9]+)\s+сезон\s+([0-9]+)\s+серия/i.exec(
                name
              );
              season = parseInt(season_episode1[1]);
              episode = parseInt(season_episode1[2]);
              name = name
                .replace(/\s*([0-9]+)\s+сезон\s+([0-9]+)\s+серия\s*/i, ' ')
                .trim();
            }
            if (/сезон\s+([0-9]+)\s+серия\s+([0-9]+)/i.test(name)) {
              var season_episode2 = /сезон\s+([0-9]+)\s+серия\s+([0-9]+)/i.exec(
                name
              );
              season = parseInt(season_episode2[1]);
              episode = parseInt(season_episode2[2]);
              name = name
                .replace(/\s*сезон\s+([0-9]+)\s+серия\s+([0-9]+)\s*/i, ' ')
                .trim();
            }
            if (/s([0-9]+)e([0-9]+)/i.test(name)) {
              var season_episode3 = /s([0-9]+)e([0-9]+)/i.exec(name);
              season = parseInt(season_episode3[1]);
              episode = parseInt(season_episode3[2]);
              name = name.replace(/\s*s([0-9]+)e([0-9]+)\s*/i, ' ').trim();
            }
            if (!name) {
              var name2 = iframe
                .trim()
                .match(/^.+?:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
              name = (name2 && name2[1]) || '';
            }
            if (
              typeof season !== 'undefined' &&
              typeof episode !== 'undefined'
            ) {
              return {
                id: md5(iframe),
                name: name,
                season: season,
                episode: episode,
                src: iframe
              };
            }
            return {
              id: md5(iframe),
              name: name,
              src: iframe
            };
          } else if (/http|\/\//i.test(p.trim())) {
            var matches = p.trim().match(/^.+?:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
            return {
              id: md5(p.trim()),
              name: (matches && matches[1]) || '',
              src: p.trim()
            };
          }
          return false;
        })
        .filter(Boolean)
    : [];
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(function(i) {
    if (custom['player' + i]) {
      if (
        /\s*([^h\/]+?)\s+(http.+|\/\/.+)\s*/i.test(custom['player' + i].trim())
      ) {
        var name_iframe = /\s*([^h\/]+?)\s+(http.+|\/\/.+)\s*/i.exec(
          custom['player' + i].trim()
        );
        var name = name_iframe[1];
        var iframe = name_iframe[2];
        players.push({
          id: md5(iframe),
          name: name,
          src: iframe
        });
      } else {
        var matches = custom['player' + i]
          .trim()
          .match(/^.+?:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
        players.push({
          id: md5(custom['player' + i]),
          name: (matches && matches[1]) || '',
          src: custom['player' + i]
        });
      }
    }
  });
  Object.keys(custom)
    .reverse()
    .forEach(function(e) {
      if (/s([0-9]+)e([0-9]+)/i.test(e)) {
        var season_episode = /s([0-9]+)e([0-9]+)/i.exec(e);
        var season = parseInt(season_episode[1]);
        var episode = parseInt(season_episode[2]);
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(function(i) {
          if (custom[e]['player' + i]) {
            if (
              /\s*([^h\/]+?)\s+(http.+|\/\/.+)\s*/i.test(
                custom[e]['player' + i].trim()
              )
            ) {
              var name_iframe = /\s*([^h\/]+?)\s+(http.+|\/\/.+)\s*/i.exec(
                custom[e]['player' + i].trim()
              );
              var name = name_iframe[1];
              var iframe = name_iframe[2];
              players.push({
                id: md5(iframe),
                name: name,
                season: season,
                episode: episode,
                src: iframe
              });
            } else {
              var matches = custom[e]['player' + i]
                .trim()
                .match(/^.+?:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
              players.push({
                id: md5(custom[e]['player' + i]),
                name: (matches && matches[1]) || '',
                season: season,
                episode: episode,
                src: custom[e]['player' + i]
              });
            }
          }
        });
      }
    });
  var data = {
    id: movie.id,
    imdb_id: (custom && custom.imdb_id) || null,
    tmdb_id: (custom && custom.tmdb_id) || null,
    tvmaze_id: (custom && custom.tvmaze_id) || null,
    wa_id: (custom && custom.wa_id) || null,
    douban_id: (custom && custom.douban_id) || null,
    movie_id: (custom && custom.movie_id) || null,
    original_title: movie.title_en || null,
    translated_title: movie.title_ru || null,
    type: movie.type === 0 ? 'movie' : 'tv',
    release:
      movie.premiere && parseInt(movie.premiere)
        ? new Date((parseInt(movie.premiere) - 719528) * 1000 * 60 * 60 * 24)
            .toJSON()
            .substr(0, 10)
        : null,
    year: movie.year || null,
    country: movie.country
      ? movie.country
          .replace(/(^\s*)|(\s*)$/g, '')
          .replace(/\s*,\s*/g, ',')
          .split(',')
      : null,
    genre: movie.genre
      ? movie.genre
          .replace(/(^\s*)|(\s*)$/g, '')
          .replace(/\s*,\s*/g, ',')
          .split(',')
      : null,
    director: movie.director
      ? movie.director
          .replace(/(^\s*)|(\s*)$/g, '')
          .replace(/\s*,\s*/g, ',')
          .split(',')
      : null,
    actor: movie.actor
      ? movie.actor
          .replace(/(^\s*)|(\s*)$/g, '')
          .replace(/\s*,\s*/g, ',')
          .split(',')
      : null,
    overview: movie.description || null,
    poster: {
      small: createImgUrl('poster', 'small', poster),
      medium: createImgUrl('poster', 'medium', poster),
      original: createImgUrl('poster', 'original', poster)
    },
    photos: movie.pictures
      ? movie.pictures.split(',').map(function(picture) {
          return {
            small: createImgUrl('picture', 'small', picture),
            medium: createImgUrl('picture', 'medium', picture),
            original: createImgUrl('picture', 'original', picture)
          };
        })
      : null,
    trailer: (custom && custom.trailer) || null,
    embed:
      (config.language === 'ru' && config.ru.subdomain && config.ru.domain
        ? config.protocol + config.ru.subdomain + config.ru.domain
        : config.protocol + config.subdomain + config.domain) +
      '/embed/' +
      movie.id,
    players:
      players && players.length
        ? players
            .sort(function(a, b) {
              if (
                typeof a.season === 'undefined' ||
                typeof a.episode === 'undefined'
              ) {
                return -1;
              }
              return parseFloat(a.season) - parseFloat(b.season);
            })
            .sort(function(a, b) {
              if (
                typeof a.season === 'undefined' ||
                typeof a.episode === 'undefined'
              ) {
                return -1;
              }
              if (b.season === a.season) {
                return parseFloat(a.episode) - parseFloat(b.episode);
              }
              return 0;
            })
        : null,
    imdb: {
      rating: movie.imdb_rating,
      votes: movie.imdb_vote
    },
    kp: {
      rating: movie.kp_rating,
      votes: movie.kp_vote
    },
    web: {
      rating: movie.rating,
      votes: movie.vote
    },
    lastmod: (custom && custom.lastmod) || null
  };
  if (movie.quality) {
    data.quality = movie.quality;
  }
  if (movie.translate) {
    data.sound = movie.translate;
  }
  return data;
}

function createImgUrl(type, size, id) {
  id = id ? ('' + id).trim() : '';
  var image = '/files/poster/no.jpg';
  var source = 'not';

  var url_url = /^(http|\/)/.test(id);
  var url_kp = /^[0-9]*$/.test(id);
  var url_ya = /^\/(get-kinopoisk-image|get-kino-vod-films-gallery)[a-z0-9\-]*$/i.test(
    id
  );
  var url_shikimori = /^\/(animes|mangas|screenshots)-[a-z0-9]+-[a-z0-9]+\.(jpg|jpeg|gif|png)$/i.test(
    id
  );
  var url_tvmaze = /^\/[0-9]{1,3}-[0-9]*\.(jpg|png)$/.test(id);
  var url_tmdb = /^\/[a-z0-9]*\.(jpg|png)$/i.test(id);
  var url_imdb = /^\/[a-z0-9\-_.,@]*\.(jpg|png)$/i.test(id);

  if (url_tmdb) {
    source = 'tmdb';
  } else if (url_tvmaze) {
    source = 'tvmaze';
  } else if (url_imdb) {
    source = 'imdb';
  } else if (url_kp) {
    source = 'kinopoisk';
  } else if (url_ya) {
    source = 'yandex';
  } else if (url_shikimori) {
    source = 'shikimori';
  } else if (url_url) {
    source = 'url';
  }

  switch (source) {
    case 'kinopoisk':
      image = '/files/' + type + '/' + size + '/' + id + '.jpg';
      break;
    case 'yandex':
      image = '/files/' + type + '/' + size + id + '.jpg';
      break;
    case 'imdb':
    case 'tmdb':
    case 'tvmaze':
    case 'shikimori':
      image = '/files/' + type + '/' + size + id;
      break;
    case 'url':
      image = id;
      break;
  }

  return (
    (config.language === 'ru' && config.ru.subdomain && config.ru.domain
      ? config.protocol + config.ru.subdomain + config.ru.domain
      : config.protocol + config.subdomain + config.domain) + image
  );
}

module.exports = {
  movie: movieApi
};
