'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../config/production/config.backup'));
var modules = require('../config/production/modules');
Object.keys(modules).length === 0 &&
  (modules = require('../config/production/modules.backup'));

/**
 * Node dependencies.
 */

var path = require('path');
var fs = require('fs');

/**
 * Adding to the pages of the website information on the TV site.
 *
 * @param {String} url
 * @return {Object}
 */

function tvVersion(url) {
  var data = '';

  if (/:\/\/tv\.|\/tv-version/i.test(url)) {
    data +=
      '<link rel="canonical" href="' +
      url
        .replace('://tv.', '://' + (config.botdomain || config.subdomain))
        .replace('/tv-version', '') +
      '">';

    if (modules.tv.data.theme === 'custom') {
      var css = fs.readFileSync(
        path.join(
          path.dirname(__dirname),
          'themes',
          'default',
          'public',
          'tv',
          'custom',
          'css',
          'style.css'
        )
      );
      data += '<style>' + css + '</style>';

      data = data
        .replace(/body_bg/gi, modules.tv.data.custom.body_bg)
        .replace(/contents_color/gi, modules.tv.data.custom.contents_color)
        .replace(
          /contents_active_bg/gi,
          modules.tv.data.custom.contents_active_bg
        )
        .replace(/categories_color/gi, modules.tv.data.custom.categories_color)
        .replace(
          /categories_current_bg/gi,
          modules.tv.data.custom.categories_current_bg
        )
        .replace(
          /categories_active_bg/gi,
          modules.tv.data.custom.categories_active_bg
        );
    }
  }

  return data;
}

/**
 * Format index data.
 *
 * @param {Object} data
 * @param {Object} options
 * @return {Object}
 */

function tvIndex(data, options) {
  var payload = {
    categories: [],
    contents: [],
    settings: {
      backgrounds: [
        'https://unpkg.com/tvwww/backgrounds/1.jpg',
        'https://unpkg.com/tvwww/backgrounds/2.jpg',
        'https://unpkg.com/tvwww/backgrounds/3.jpg',
        'https://unpkg.com/tvwww/backgrounds/4.jpg',
        'https://unpkg.com/tvwww/backgrounds/5.jpg',
        'https://unpkg.com/tvwww/backgrounds/6.jpg',
        'https://unpkg.com/tvwww/backgrounds/7.jpg',
        'https://unpkg.com/tvwww/backgrounds/8.jpg',
        'https://unpkg.com/tvwww/backgrounds/9.jpg',
        'https://unpkg.com/tvwww/backgrounds/10.jpg'
      ]
    },
    active: {
      display: 'categories.1.ok'
    }
  };
  payload.categories.push({
    title: config.l.home,
    ok: options.origin
  });
  if (typeof data.index === 'object') {
    for (var type in data.index) {
      if (data.index.hasOwnProperty(type) && data.index[type].length) {
        data.index[type].forEach(function(category) {
          if (category.movies.length) {
            var cat = {
              title: category.name,
              ok: {
                contents: []
              }
            };
            category.movies.forEach(function(movie, i) {
              cat.ok.contents.push({
                active: i === 0,
                ok: movie.url,
                image: movie.poster,
                title: movie.title,
                top: movie.translate
                  ? movie.translate
                  : movie.year
                  ? movie.year
                  : '',
                bottom:
                  (movie.season
                    ? movie.season + ' ' + config.l.season + ' '
                    : '') +
                  (movie.episode
                    ? movie.episode + ' ' + config.l.episode + ' '
                    : '') +
                  (movie.genres ? movie.genres : '')
              });
            });
            payload.categories.push(cat);
          }
        });
      }
    }
  }
  payload.categories.push({
    title: config.l.years,
    ok: options.origin + '/' + config.urls.year
  });
  payload.categories.push({
    title: config.l.genres,
    ok: options.origin + '/' + config.urls.genre
  });
  payload.categories.push({
    title: config.l.countries,
    ok: options.origin + '/' + config.urls.country
  });
  payload.categories.push({
    title: config.l.full,
    ok:
      config.protocol +
      config.subdomain +
      config.domain +
      options.port +
      '?desktop'
  });
  return payload;
}

/**
 * Format categories data.
 *
 * @param {Object} data
 * @param {Object} options
 * @return {Object}
 */

function tvCategories(data, options) {
  var payload = {
    categories: [],
    contents: [],
    settings: {
      backgrounds: [
        'https://unpkg.com/tvwww/backgrounds/1.jpg',
        'https://unpkg.com/tvwww/backgrounds/2.jpg',
        'https://unpkg.com/tvwww/backgrounds/3.jpg',
        'https://unpkg.com/tvwww/backgrounds/4.jpg',
        'https://unpkg.com/tvwww/backgrounds/5.jpg',
        'https://unpkg.com/tvwww/backgrounds/6.jpg',
        'https://unpkg.com/tvwww/backgrounds/7.jpg',
        'https://unpkg.com/tvwww/backgrounds/8.jpg',
        'https://unpkg.com/tvwww/backgrounds/9.jpg',
        'https://unpkg.com/tvwww/backgrounds/10.jpg'
      ]
    },
    active: {
      display: ''
    }
  };
  payload.categories.push({
    title: config.l.home,
    ok: options.origin
  });
  if (typeof data.categories === 'object' && data.categories.length) {
    data.categories.forEach(function(category, i) {
      payload.contents.push({
        active: i === 0,
        title: category.title,
        ok: category.url
      });
    });
  }
  payload.categories.push({
    title: config.l.years,
    ok: options.origin + '/' + config.urls.year
  });
  payload.categories.push({
    title: config.l.genres,
    ok: options.origin + '/' + config.urls.genre
  });
  payload.categories.push({
    title: config.l.countries,
    ok: options.origin + '/' + config.urls.country
  });
  payload.categories.push({
    title: config.l.full,
    ok:
      config.protocol +
      config.subdomain +
      config.domain +
      options.port +
      '?desktop'
  });
  return payload;
}

/**
 * Format category data.
 *
 * @param {Object} data
 * @param {Object} page
 * @param {Object} options
 * @return {Object}
 */

function tvCategory(data, page, options) {
  var payload = {
    categories: [],
    contents: [],
    settings: {
      backgrounds: [
        'https://unpkg.com/tvwww/backgrounds/1.jpg',
        'https://unpkg.com/tvwww/backgrounds/2.jpg',
        'https://unpkg.com/tvwww/backgrounds/3.jpg',
        'https://unpkg.com/tvwww/backgrounds/4.jpg',
        'https://unpkg.com/tvwww/backgrounds/5.jpg',
        'https://unpkg.com/tvwww/backgrounds/6.jpg',
        'https://unpkg.com/tvwww/backgrounds/7.jpg',
        'https://unpkg.com/tvwww/backgrounds/8.jpg',
        'https://unpkg.com/tvwww/backgrounds/9.jpg',
        'https://unpkg.com/tvwww/backgrounds/10.jpg'
      ]
    },
    active: {
      display: ''
    }
  };
  payload.categories.push({
    title: config.l.home,
    ok: options.origin
  });
  if (typeof data.movies === 'object' && data.movies.length) {
    data.movies.forEach(function(movie, i) {
      payload.contents.push({
        active: i === 0,
        ok: movie.url,
        image: movie.poster,
        title: movie.title,
        top: movie.translate ? movie.translate : movie.year ? movie.year : '',
        bottom:
          (movie.season ? movie.season + ' ' + config.l.season + ' ' : '') +
          (movie.episode ? movie.episode + ' ' + config.l.episode + ' ' : '') +
          (movie.genres ? movie.genres : '')
      });
    });
    if (
      payload.contents.length &&
      page.pagination &&
      page.pagination.next &&
      page.pagination.next[0]
    ) {
      payload.contents.push({
        ok: page.pagination.next[0].link,
        title: config.l.continue
      });
    }
  }
  payload.categories.push({
    title: config.l.years,
    ok: options.origin + '/' + config.urls.year
  });
  payload.categories.push({
    title: config.l.genres,
    ok: options.origin + '/' + config.urls.genre
  });
  payload.categories.push({
    title: config.l.countries,
    ok: options.origin + '/' + config.urls.country
  });
  payload.categories.push({
    title: config.l.full,
    ok:
      config.protocol +
      config.subdomain +
      config.domain +
      options.port +
      '?desktop'
  });
  return payload;
}

/**
 * Format episode data.
 *
 * @param {Object} data
 * @param {Object} options
 * @return {Object}
 */

function tvEpisode(data, options) {
  var payload = {
    categories: [],
    contents: [],
    settings: {
      backgrounds: [
        'https://unpkg.com/tvwww/backgrounds/1.jpg',
        'https://unpkg.com/tvwww/backgrounds/2.jpg',
        'https://unpkg.com/tvwww/backgrounds/3.jpg',
        'https://unpkg.com/tvwww/backgrounds/4.jpg',
        'https://unpkg.com/tvwww/backgrounds/5.jpg',
        'https://unpkg.com/tvwww/backgrounds/6.jpg',
        'https://unpkg.com/tvwww/backgrounds/7.jpg',
        'https://unpkg.com/tvwww/backgrounds/8.jpg',
        'https://unpkg.com/tvwww/backgrounds/9.jpg',
        'https://unpkg.com/tvwww/backgrounds/10.jpg'
      ]
    },
    active: {
      display: 'categories.1.ok'
    }
  };
  payload.categories.push({
    title: config.l.home,
    ok: config.protocol + config.subdomain + config.domain + '/tv-version'
  });

  if (typeof data === 'object') {
    for (var translate in data) {
      if (data.hasOwnProperty(translate)) {
        var data_translate = {
          title: translate,
          ok: {
            contents: []
          }
        };

        if (typeof data[translate] === 'object') {
          for (var season in data[translate]) {
            if (data[translate].hasOwnProperty(season)) {
              if (typeof data[translate][season] === 'object') {
                for (var episode in data[translate][season]) {
                  if (data[translate][season].hasOwnProperty(episode)) {
                    var movie = data[translate][season][episode];
                    data_translate.ok.contents.push({
                      ok: movie.url,
                      image: movie.poster,
                      title: movie.title,
                      top: movie.season ? movie.season : '',
                      bottom: movie.episode ? movie.episode : ''
                    });
                  }
                }
              }
            }
          }
        }

        data_translate.ok.contents = data_translate.ok.contents.reverse();
        data_translate.ok.contents[0].active = true;

        payload.categories.push(data_translate);
      }
    }
  }
  payload.categories.push({
    title: config.l.full,
    ok:
      config.protocol +
      config.subdomain +
      config.domain +
      options.port +
      '?desktop'
  });
  return payload;
}

module.exports = {
  tv: tvVersion,
  index: tvIndex,
  category: tvCategory,
  categories: tvCategories,
  episode: tvEpisode
};
