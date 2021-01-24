'use strict';

/**
 * Module dependencies.
 */

var CP_text = require('./CP_text');
var CP_translit = require('../lib/CP_translit');

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

var LRU = require('lru-cache');
var cache = new LRU({
  maxAge: 3600000,
  max: 10000
});
var md5 = require('md5');
var getSlug = require('limax');
var moment = require('moment');
moment.locale(config.language);

/**
 * A data structure for a movie/movies.
 *
 * @param {Object} movies
 * @param {Object} [options]
 * @return {Object}
 */

function structureMovie(movies, options) {
  if (arguments.length === 1) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  if (!cache.has('CP_VER') || cache.get('CP_VER') !== process.env['CP_VER']) {
    cache.reset();
    cache.set('CP_VER', process.env['CP_VER']);
  }

  movies = movies ? movies : [];

  return movies.map(function(movie) {
    movie = movie ? movie : {};

    var hash = md5(
      (options.origin || '') +
        'movie' +
        movie.kp_id +
        '?' +
        process.env['CP_VER'] +
        JSON.stringify(Object.keys(movie))
    );

    if (cache.has(hash)) return cache.get(hash);

    var id = parseInt(movie.kp_id) + config.urls.unique_id;

    var images = createImages(movie);

    for (var key in movie) {
      if (movie.hasOwnProperty(key) && movie[key] === '_empty') {
        movie[key] = '';
      } else if (movie.hasOwnProperty(key) && typeof movie[key] === 'string') {
        movie[key] = movie[key]
          .replace(/\s+/g, ' ')
          .replace(/(^\s*)|(\s*)$/g, '');
        if (
          key === 'country' ||
          key === 'director' ||
          key === 'genre' ||
          key === 'actor'
        ) {
          var items = movie[key].split(',').map(function(item) {
            return item.replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '');
          });
          movie[key] = items.join(',');
        }
      }
    }

    movie = {
      id: id,
      kp_id: movie.kp_id,
      title: textQuotes(movie.title_ru || movie.title_en),
      title_ru: textQuotes(movie.title_ru),
      title_en: textQuotes(movie.title_en),
      title_full: textQuotes(titleFull(movie)),
      title_page: textQuotes(movie.title_page || ''),
      player: movie.player || '',
      quality: movie.quality || '',
      translate: movie.translate || '',
      description: changeDescription(movie),
      description_meta: changeDescription(movie, null, true),
      description_short: changeDescription(movie, true),
      poster: images.poster,
      poster_big: images.poster_big,
      poster_min: images.poster_min,
      picture: images.picture,
      picture_big: images.picture_big,
      picture_min: images.picture_min,
      pictures: images.pictures,
      year:
        movie.year && parseInt('' + movie.year) ? parseInt('' + movie.year) : 0,
      year2: movie.year,
      year3: movie.year,
      year_url: createCategoryUrl('year', '' + movie.year),
      countries: randPos(movie.country),
      directors: randPos(movie.director),
      genres: randPos(movie.genre),
      actors: randPos(movie.actor),
      country: movie.country.split(',')[0],
      director: movie.director.split(',')[0],
      genre: movie.genre.split(',')[0],
      actor: movie.actor.split(',')[0],
      countries_url: randPos(createCategoryUrl('country', movie.country)),
      directors_url: randPos(createCategoryUrl('director', movie.director)),
      genres_url: randPos(createCategoryUrl('genre', movie.genre)),
      actors_url: randPos(createCategoryUrl('actor', movie.actor)),
      tags_url: createTagUrl(movie),
      country_url: createCategoryUrl('country', movie.country.split(',')[0]),
      director_url: createCategoryUrl('director', movie.director.split(',')[0]),
      genre_url: createCategoryUrl('genre', movie.genre.split(',')[0]),
      actor_url: createCategoryUrl('actor', movie.actor.split(',')[0]),
      countries_arr: movie.country ? movie.country.split(',') : [],
      directors_arr: movie.director ? movie.director.split(',') : [],
      genres_arr: movie.genre ? movie.genre.split(',') : [],
      actors_arr: movie.actor ? movie.actor.split(',') : [],
      rating: createRating(movie, 'rating'),
      vote: createRating(movie, 'vote'),
      kp_rating: movie.kp_rating,
      kp_vote: movie.kp_vote,
      imdb_rating: movie.imdb_rating,
      imdb_vote: movie.imdb_vote,
      type: movie.type,
      passed: alreadyPassed(movie.premiere),
      premiere: toDate(movie.premiere),
      url: createMovieUrl(movie),
      pathname: createMovieUrl(movie, true),
      custom: movie.custom
    };

    try {
      movie.custom = JSON.parse(movie.custom);
      if (movie.custom.imdb_id) {
        movie.imdb_id = movie.custom.imdb_id;
      }
      if (movie.custom.tmdb_id) {
        movie.tmdb_id = movie.custom.tmdb_id;
      }
      if (movie.custom.douban_id) {
        movie.douban_id = movie.custom.douban_id;
      }
    } catch (e) {
      movie.custom = {};
    }

    var bot_all =
      options &&
      options.userinfo &&
      options.userinfo.bot &&
      options.userinfo.bot.all;

    if (!process.env['NO_CACHE'] && !bot_all) {
      cache.set(hash, movie);
    }

    return movie;
  });

  /**
   * Change description.
   *
   * @param {Object} movie
   * @param {Boolean} [short]
   * @param {Boolean} [meta]
   * @return {String}
   */

  function changeDescription(movie, short, meta) {
    movie = typeof movie === 'object' ? movie : {};

    var text = '';

    movie.description = movie.description ? movie.description : '';

    if (typeof meta === 'boolean') {
      text = (movie.description_short || movie.description)
        .replace(/<\/?[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .replace(/(^\s*)|(\s*)$/g, '')
        .substr(0, 200)
        .replace(/"([^"]*?)"/gi, '«$1»')
        .replace('"', '&quot;');
    } else if (typeof short === 'boolean') {
      text = movie.description
        .replace(/<\/?[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .replace(/(^\s*)|(\s*)$/g, '')
        .substr(0, 200)
        .replace(/"([^"]*?)"/gi, '«$1»')
        .replace('"', '&quot;');
    } else {
      text = movie.description
        .replace(/\s+/g, ' ')
        .replace(/(^\s*)|(\s*)$/g, '');
    }

    return text;
  }

  /**
   * Create a string with the categories in random order.
   *
   * @param {String} items
   * @return {String}
   */

  function randPos(items) {
    var itemsArr = shuffle(('' + items).split(','));
    if (itemsArr.length > 1) {
      var lastArr = itemsArr.pop();
      items = itemsArr.join(', ') + ' ' + config.l.and + ' ' + lastArr;
    } else {
      items = itemsArr.join(', ');
    }

    return items;
  }

  /**
   * Full title.
   *
   * @param {Object} movie
   * @return {String}
   */

  function titleFull(movie) {
    var title_full = movie.title_ru ? movie.title_ru : '';
    title_full = title_full
      ? movie.title_en
        ? title_full + ' / ' + movie.title_en
        : title_full
      : movie.title_en;
    title_full =
      movie.year && parseInt(movie.year)
        ? title_full + ' (' + movie.year + ')'
        : title_full;

    return title_full;
  }

  /**
   * Quotes «» in string.
   *
   * @param {String} text
   * @return {String}
   */

  function textQuotes(text) {
    return text
      ? ('' + text).replace(/"([^"]*?)"/gi, '«$1»').replace('"', "'")
      : '';
  }

  /**
   * Shuffle array.
   *
   * @param {Array} array
   * @return {Array}
   */

  function shuffle(array) {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex;

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  /**
   * Create URL for tag page.
   *
   * @param {Object} movie
   * @return {String}
   */

  function createTagUrl(movie) {
    var tags = [];
    var arr = [];
    var type =
      movie.type && movie.type.toString() === '1'
        ? config.urls.types.serial
        : config.urls.types.movie;

    [movie.year].forEach(function(year) {
      if (!year) return;
      if (config.default.tags.list.indexOf('year') + 1) {
        arr.push([{ k: 'year', v: year }]);
      }
      movie.genre.split(',').forEach(function(genre, g) {
        if (!genre) return;
        if (config.default.tags.list.indexOf('genre') + 1) {
          arr.push([{ k: 'genre', v: genre }]);
        }
        if (
          config.default.tags.list.indexOf('year') + 1 &&
          config.default.tags.list.indexOf('genre') + 1
        ) {
          arr.push([
            { k: 'year', v: year },
            { k: 'genre', v: genre }
          ]);
        }
        movie.country.split(',').forEach(function(country) {
          if (!country) return;
          if (config.default.tags.list.indexOf('country') + 1) {
            if (g === 0) arr.push([{ k: 'country', v: country }]);
          }
          if (
            config.default.tags.list.indexOf('year') + 1 &&
            config.default.tags.list.indexOf('country') + 1
          ) {
            if (g === 0)
              arr.push([
                { k: 'year', v: year },
                { k: 'country', v: country }
              ]);
          }
          if (
            config.default.tags.list.indexOf('genre') + 1 &&
            config.default.tags.list.indexOf('country') + 1
          ) {
            arr.push([
              { k: 'genre', v: genre },
              { k: 'country', v: country }
            ]);
          }
          if (
            config.default.tags.list.indexOf('year') + 1 &&
            config.default.tags.list.indexOf('genre') + 1 &&
            config.default.tags.list.indexOf('country') + 1
          ) {
            arr.push([
              { k: 'year', v: year },
              { k: 'genre', v: genre },
              { k: 'country', v: country }
            ]);
          }
        });
      });
    });

    arr.forEach(function(a) {
      var data = {};
      data.type = type;
      a.forEach(function(obj) {
        data[obj.k] = obj.v;
      });
      tags.push(
        '<a href="' +
          config.protocol +
          options.domain +
          '/' +
          config.urls.type +
          config.urls.slash +
          CP_translit.text(type, undefined, config.urls.type) +
          '?' +
          a
            .map(function(obj) {
              return (
                obj.k +
                '=' +
                CP_translit.text(obj.v, undefined, config.urls[obj.k])
              );
            })
            .join('&') +
          '">' +
          CP_text.formatting(config.default.tags.format, data) +
          '</a>'
      );
    });

    return tags.join(', ');
  }

  /**
   * Create URL for category page.
   *
   * @param {String} type
   * @param {String} items
   * @return {String}
   */

  function createCategoryUrl(type, items) {
    var itemsArr = items ? ('' + items).split(',') : [];

    itemsArr = itemsArr.map(function(item) {
      return (
        '<a href="' +
        config.protocol +
        options.domain +
        '/' +
        config.urls[type] +
        config.urls.slash +
        CP_translit.text(item, undefined, config.urls[type]) +
        '">' +
        item +
        '</a>'
      );
    });

    return itemsArr.join(', ');
  }

  /**
   * Create URL for movie page.
   *
   * @param {Object} movie
   * @param {Boolean} [pathname]
   * @return {String}
   */

  function createMovieUrl(movie, pathname) {
    var id = parseInt(movie.kp_id) + parseInt('' + config.urls.unique_id);

    var data = {
      title: movie.title_ru || movie.title_en,
      title_ru: movie.title_ru,
      title_en: movie.title_en,
      year: movie.year ? movie.year.toString() : '',
      country: movie.country.split(',')[0],
      director: movie.director.split(',')[0],
      genre: movie.genre.split(',')[0],
      actor: movie.actor.split(',')[0],
      random: dayToLetter()
    };

    var separator = config.urls.separator;
    var prefix_id = config.urls.prefix_id + '' + id;
    var url = config.urls.movie_url;

    url = url.replace(/\[prefix_id]/g, prefix_id);
    url = url.replace(/\[separator]/g, separator);

    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        if (!data[key]) {
          var c = separator + '[' + key + ']' + separator;
          var l = '[' + key + ']' + separator;
          var r = separator + '[' + key + ']';
          url = url.replace(c, separator);
          url = url.replace(l, '');
          url = url.replace(r, '');
        } else {
          var k = '[' + key + ']';
          url = url.replace(k, getSlug(data[key], separator));
        }
      }
    }

    var noindex = config.urls.noindex
      ? movie.custom && /"unique":true|"unique":"true"/i.test(movie.custom)
        ? config.urls.movie
        : config.urls.noindex
      : config.urls.movie;

    return typeof pathname !== 'undefined'
      ? '/' + noindex + config.urls.slash + url
      : config.protocol +
          options.domain +
          '/' +
          noindex +
          config.urls.slash +
          url;
  }

  function dayToLetter() {
    var now = new Date();
    var year = now.getFullYear();
    var start = new Date(year, 0, 0);
    var diff = now - start;
    var oneDay = 86400000;
    var day = ('00' + Math.floor(diff / oneDay)).slice(-3);
    var letter1 = ['a', 'e', 'i', 'o', 'u'];
    var letter2 = ['b', 'c', 'd', 'f', 'g', 'h', 'z', 'k', 'l', 'm'];
    var letter3 = ['n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y']; // j
    if (config.domain.split('.')[0].length % 2) {
      letter1 = letter1.reverse();
    }
    if (config.domain.split('.')[1].length % 2) {
      letter2 = letter2.reverse();
    }
    var result =
      letter2[parseInt(day[0])] +
      letter1[parseInt(day[1]) % 5] +
      letter3[parseInt(day[2])] +
      letter1[year % 5];
    if (parseInt(day[1]) >= 5) {
      result =
        letter1[parseInt(day[0]) % 5] +
        (parseInt(day[0] + day[2]) % 2 ? letter2 : letter3)[parseInt(day[1])] +
        letter1[parseInt(day[2]) % 5] +
        letter2[year % 10];
    }
    if (now.getDate() % 2) {
      result = result
        .split('')
        .reverse()
        .join('');
    }
    return result;
  }

  /**
   * Images for website.
   *
   * @param {Object} movie
   * @return {Object}
   */

  function createImages(movie) {
    var images = {};

    var poster =
      !movie.poster || /^([01])$/.test(movie.poster)
        ? '' + (parseInt(movie.kp_id) % 1000000000)
        : '' + movie.poster;

    images.pictures = [];

    images.poster_min = createImgUrl('poster', 'small', poster);
    images.poster = createImgUrl('poster', 'medium', poster);
    images.poster_big = createImgUrl('poster', 'original', poster);

    images.picture_min = images.poster_min;
    images.picture = images.poster;
    images.picture_big = images.poster_big;

    if (movie.pictures) {
      movie.pictures.split(',').forEach(function(id, i) {
        if (!i) {
          images.picture_min = createImgUrl('picture', 'small', id);
          images.picture = createImgUrl('picture', 'medium', id);
          images.picture_big = createImgUrl('picture', 'original', id);
        }
        images.pictures.push({
          picture_min: createImgUrl('picture', 'small', id),
          picture: createImgUrl('picture', 'medium', id),
          picture_big: createImgUrl('picture', 'original', id)
        });
      });
    }

    return images;
  }

  /**
   * Create overall rating.
   *
   * @param {Object} movie
   * @param {String} type
   * @return {Object}
   */

  function createRating(movie, type) {
    var result = {};
    result.rating = 0;
    result.vote = 0;

    if (movie.kp_vote > 0 && movie.imdb_vote > 0) {
      if (movie.kp_rating && movie.imdb_rating) {
        result.rating += Math.round(
          (parseInt(movie.kp_rating) + parseInt(movie.imdb_rating)) / 2
        );
        result.vote += parseInt(movie.kp_vote);
        result.vote += parseInt(movie.imdb_vote);
      }
    } else if (movie.kp_vote > 0) {
      if (movie.kp_rating) {
        result.rating += parseInt(movie.kp_rating);
        result.vote += parseInt(movie.kp_vote);
      }
    } else if (movie.imdb_vote > 0) {
      if (movie.imdb_rating) {
        result.rating += parseInt(movie.imdb_rating);
        result.vote += parseInt(movie.imdb_vote);
      }
    }

    if (
      !result.rating &&
      !result.vote &&
      movie.rating &&
      movie.vote &&
      parseInt(movie.rating) &&
      parseInt(movie.vote)
    ) {
      result.rating = parseInt(movie.rating);
      result.vote = parseInt(movie.vote);
    }

    return result[type];
  }

  /**
   * Create date format.
   *
   * @param {Number, String} days
   * @return {String}
   */

  function toDate(days) {
    return days && parseInt(days)
      ? moment(
          new Date((parseInt(days) - 719528) * 1000 * 60 * 60 * 24)
            .toJSON()
            .substr(0, 10)
        )
          .format(config.default.moment)
          .trim()
      : '';
  }

  /**
   * Premiere < current date.
   *
   * @param {Number, String} days
   * @return {Boolean}
   */

  function alreadyPassed(days) {
    return days && parseInt(days)
      ? Math.floor(new Date().getTime() / 1000 / 60 / 60 / 24 + 719528) >
          parseInt(days)
      : false;
  }
}

/**
 * Create image URL.
 *
 * @param {String} type
 * @param {String} size
 * @param {String} id
 * @return {String}
 */

function createImgUrl(type, size, id) {
  id = id ? ('' + id).trim() : '';
  var image = '/files/poster/no.jpg';
  var source = 'not';

  var url_url = /^(http|\/)/.test(id);
  var url_kp = /^[0-9]*$/.test(id);
  var url_tmdb = /^\/[a-z0-9]*\.(jpg|png)$/i.test(id);
  var url_imdb = /^\/[a-z0-9\-_.,@]*\.(jpg|png)$/i.test(id);

  if (url_tmdb) {
    source = 'tmdb';
  } else if (url_imdb) {
    source = 'imdb';
  } else if (url_kp) {
    source = 'kinopoisk';
  } else if (url_url) {
    source = 'url';
  }

  switch (source) {
    case 'kinopoisk':
      image = '/files/' + type + '/' + size + '/' + id + '.jpg';
      break;
    case 'imdb':
    case 'tmdb':
      image = '/files/' + type + '/' + size + id;
      break;
    case 'url':
      image = id;
      break;
  }

  return image;
}

/**
 * A data structure for a categories.
 *
 * @param {String} type
 * @param {Object} movies
 * @param {Object} [options]
 * @return {Array}
 */

function structureCategories(type, movies, options) {
  if (arguments.length === 2) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var image = config.default.image;
  var categories = [];

  movies.forEach(function(movie) {
    var one_cat_one_image = true;

    ('' + movie[type]).split(',').forEach(function(cat_new) {
      if (cat_new === '_empty' || cat_new === '') return;

      var there_is = false;
      one_cat_one_image =
        type === 'actor' || type === 'director' ? true : one_cat_one_image;

      categories.forEach(function(cat_old, i) {
        if (categories[i].title === cat_new) {
          there_is = true;
          if (categories[i].image === image) {
            categories[i].image =
              movie.pictures && movie.pictures.length
                ? createImgUrl(
                    'picture',
                    'small',
                    movie.pictures.split(',')[
                      Math.floor(
                        Math.random() * movie.pictures.split(',').length
                      )
                    ]
                  )
                : image;
          }
        }
      });

      if (!there_is) {
        categories.push({
          url: createCategoryUrl(type, cat_new),
          title: cat_new,
          image: one_cat_one_image
            ? movie.pictures && movie.pictures.length
              ? createImgUrl(
                  'picture',
                  'small',
                  movie.pictures.split(',')[
                    Math.floor(Math.random() * movie.pictures.split(',').length)
                  ]
                )
              : image
            : image
        });
        one_cat_one_image = false;
      }
    });
  });

  /**
   * Create URL for category page.
   *
   * @param {String} type
   * @param {String} category
   * @return {String}
   */

  function createCategoryUrl(type, category) {
    return (
      config.protocol +
      options.domain +
      '/' +
      config.urls[type] +
      config.urls.slash +
      CP_translit.text(category, undefined, config.urls[type])
    );
  }

  if (type === 'year') {
    categories.sort(function(x, y) {
      return parseInt(y.title) - parseInt(x.title);
    });
  }

  return categories;
}

/**
 * A data structure for a content/contents.
 *
 * @param {Object} contents
 * @param {Object} [options]
 * @return {Object}
 */

function structureContent(contents, options) {
  if (arguments.length === 1) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  if (!cache.has('CP_VER') || cache.get('CP_VER') !== process.env['CP_VER']) {
    cache.reset();
    cache.set('CP_VER', process.env['CP_VER']);
  }

  return contents.map(function(content) {
    var hash = md5(
      (options.origin || '') +
        'content' +
        content.content_url +
        '?' +
        process.env['CP_VER']
    );

    if (cache.has(hash)) return cache.get(hash);

    for (var key in content) {
      if (content.hasOwnProperty(key) && content[key] === '_empty') {
        content[key] = '';
      }
    }

    var movies = content.content_movies.split(',');
    var tags = content.content_tags.split(',').map(function(tag) {
      tag = tag.replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '');
      return (
        '<a href="' +
        config.protocol +
        options.domain +
        '/' +
        modules.content.data.url +
        '?tag=' +
        encodeURIComponent(tag) +
        '">' +
        tag +
        '</a>'
      );
    });

    content = {
      id: content.id,
      title: content.content_title,
      description: CP_text.formatting(content.content_description),
      image:
        content.content_image ||
        options.content_image ||
        config.default.image ||
        '',
      tags: tags.join(', '),
      publish: toDate(content.content_publish),
      movies:
        movies.length && movies[0]
          ? movies.map(function(item) {
              return parseInt(item);
            })
          : [],
      url:
        config.protocol +
        options.domain +
        '/' +
        modules.content.data.url +
        config.urls.slash +
        content.content_url,
      slug: content.content_url
    };

    content.title = content.title
      .replace(/"([^"]*?)"/gi, '«$1»')
      .replace('"', '&quot;');
    content.description_short = content.description
      .replace(/<\/?[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/(^\s*)|(\s*)$/g, '')
      .substr(0, 200)
      .replace(/"([^"]*?)"/gi, '«$1»')
      .replace('"', '&quot;');

    cache.set(hash, content);

    return content;
  });

  /**
   * Create date format.
   *
   * @param {Number, String} days
   * @return {String}
   */

  function toDate(days) {
    return days && parseInt(days)
      ? moment(
          new Date(parseInt(days) - 719528 * 1000 * 60 * 60 * 24)
            .toJSON()
            .substr(0, 10)
        ).format(config.default.moment)
      : '';
  }
}

/**
 * A data structure for a comment/comments.
 *
 * @param {Object} comments
 * @param {Boolean} [short]
 * @return {Object}
 */

function structureComment(comments, short) {
  comments = comments || [];
  short = short || false;

  if (!cache.has('CP_VER') || cache.get('CP_VER') !== process.env['CP_VER']) {
    cache.reset();
    cache.set('CP_VER', process.env['CP_VER']);
  }

  return comments.map(function(comment) {
    var hash = md5(
      'comment' + comment.comment_id + short + '?' + process.env['CP_VER']
    );

    if (cache.has(hash)) return cache.get(hash);

    var r = {};
    r['id'] = comment.comment_id;
    r['url'] = comment.comment_url;
    r['user'] = comment.comment_anonymous;
    r['avatar'] = comment.comment_avatar;
    r['title'] = comment.comment_title;
    r['star'] = comment.comment_star;
    r['comment'] = short
      ? comment.comment_text
          .replace(
            /\[spoiler][^\[]*?\[\/spoiler]/gi,
            ' *' + config.l.spoiler + '* '
          )
          .replace(/\[br]/gi, ' ')
          .replace(/[<][^>]*?>/gi, '')
          .replace(/[\[][^\]]*?]/gi, '')
          .replace(/\s+/g, ' ')
          .replace(/(^\s*)|(\s*)$/g, '')
          .slice(0, modules.comments.data.fast.recent.excerpt_length) + '...'
      : bb_codes(comment.comment_text);
    r['plain'] = short
      ? ''
      : r['comment']
          .replace(/\[br]/gi, ' ')
          .replace(/[<][^>]*?>/gi, '')
          .replace(/\s+/g, ' ')
          .replace(/(^\s*)|(\s*)$/g, '');
    r['admin'] = short ? '' : bb_codes(comment.comment_admin);
    r['like'] = comment.comment_like || 0;
    r['dislike'] = comment.comment_dislike || 0;

    var date = moment(
      new Date(
        parseInt(comment.comment_publish) - 719528 * 1000 * 60 * 60 * 24
      ).toJSON()
    );
    r['date'] = date.fromNow();
    r['time'] = date.valueOf();

    cache.set(hash, r);

    return r;
  });

  /**
   * BB-codes to HTML-tags.
   *
   * @param {String} text
   */

  function bb_codes(text) {
    return text
      .replace(/\[br]/gi, '<br>')
      .replace(/\[spoiler](.*?)\[\/spoiler]/gi, function(match, p1) {
        return (
          '<span class=cinemapress-comment-spoiler data-comment-spoiler="' +
          p1.replace(/"/g, '&quot;') +
          '">👻&nbsp;' +
          config.l.spoiler +
          '</span>'
        );
      })
      .replace(/\[search](.*?)\[\/search]/gi, function(match, p1) {
        return (
          '<span class=cinemapress-comment-search data-comment-search="' +
          p1.replace(/"/g, '&quot;') +
          '">🔍&nbsp;' +
          p1 +
          '</span>'
        );
      })
      .replace(
        /\[b](.*?)\[\/b]/gi,
        '<span class=cinemapress-comment-b>$1</span>'
      )
      .replace(
        /\[i](.*?)\[\/i]/gi,
        '<span class=cinemapress-comment-i>$1</span>'
      )
      .replace(
        /\[url](.*?)\[\/url]/gi,
        '<a href="$1">' + config.subdomain + config.domain + '$1</a>'
      );
  }
}

module.exports = {
  categories: structureCategories,
  movie: structureMovie,
  content: structureContent,
  comment: structureComment
};
