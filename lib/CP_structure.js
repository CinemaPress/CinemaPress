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
var modules = require('../config/production/modules');

/**
 * Node dependencies.
 */

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
    options.domain = '' + config.domain;
  }

  return movies.map(function(movie) {
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
      year: movie.year,
      year2: movie.year,
      year3: movie.year,
      year_url: createCategoryUrl('year', movie.year),
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
        '/' +
        CP_translit.text(item) +
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
      year: movie.year,
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
      ? movie.custom && /"unique":true/.test(movie.custom)
        ? config.urls.movie
        : config.urls.noindex
      : config.urls.movie;

    return typeof pathname !== 'undefined'
      ? '/' + noindex + '/' + url
      : config.protocol + options.domain + '/' + noindex + '/' + url;
  }

  function dayToLetter() {
    var now = new Date();
    var year = now.getFullYear();
    var start = new Date(year, 0, 0);
    var diff = now - start;
    var oneDay = 1000 * 60 * 60 * 24;
    var day = ('00' + Math.floor(diff / oneDay)).slice(-3);
    var letter1 = ['a', 'e', 'i', 'o', 'u'];
    var letter2 = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'];
    return (
      letter2[parseInt(day[0])] +
      letter1[parseInt(day[1]) % 5] +
      letter2[parseInt(day[2])] +
      letter1[year % 5]
    );
  }

  /**
   * Images for website.
   *
   * @param {Object} movie
   * @return {Object}
   */

  function createImages(movie) {
    var images = {};

    images.pictures = [];

    images.poster_min = createImgUrl(movie, 'poster', 'small');
    images.poster = createImgUrl(movie, 'poster', 'medium');
    images.poster_big = createImgUrl(movie, 'poster', 'big');

    images.picture_min = images.poster_min;
    images.picture = images.poster;
    images.picture_big = images.poster_big;

    if (movie.pictures) {
      images.picture_min = createImgUrl(movie, 'picture', 'small');
      images.picture = createImgUrl(movie, 'picture', 'medium');
      images.picture_big = createImgUrl(movie, 'picture', 'big');

      movie.pictures.split(',').forEach(function(id) {
        images.pictures.push({
          picture_min: createImgUrl(movie, 'picture', 'small', id.trim()),
          picture: createImgUrl(movie, 'picture', 'medium', id.trim()),
          picture_big: createImgUrl(movie, 'picture', 'big', id.trim())
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
          new Date((parseInt(days) - 719527) * 1000 * 60 * 60 * 24)
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
      ? Math.floor(new Date().getTime() / 1000 / 60 / 60 / 24 + 719527) >
          parseInt(days)
      : false;
  }
}

/**
 * Create image URL.
 *
 * @param {Object} movie
 * @param {String} type
 * @param {String} size
 * @param {Number,String} [id]
 * @return {String}
 */

function createImgUrl(movie, type, size, id) {
  var st = config.image.addr;
  var proxy = config.image.proxy ? config.domain + '/' : '';

  var img = '';

  if (type === 'picture') {
    if (!id) {
      var p = movie.pictures.split(',');
      var r = Math.floor(Math.random() * p.length);
      id = p[r].trim();
    }
    if (st === config.domain && (size === 'big' || size === 'medium')) {
      st = 'k.1poster.net';
    }
    if (('' + id).replace(/\d/g, '')) {
      if (/^\/[a-z0-9]*\.(jpg|png)$/i.test('' + id)) {
        st = 't.1poster.net';
        switch (size) {
          case 'small':
            img = config.protocol + proxy + st + '/t/p/w300' + id;
            break;
          case 'big':
            img = config.protocol + proxy + st + '/t/p/original' + id;
            break;
          default:
            img = config.protocol + proxy + st + '/t/p/w1280' + id;
        }
        return img;
      } else if (('' + id).indexOf('//') + 1) {
        return id;
      } else {
        return config.protocol + config.domain + id;
      }
    }
    if (st !== config.domain) {
      switch (size) {
        case 'small':
          img = config.protocol + proxy + st + '/images/kadr/sm_' + id + '.jpg';
          break;
        case 'big':
          img = config.protocol + proxy + st + '/images/kadr/' + id + '.jpg';
          break;
        default:
          img = config.protocol + proxy + st + '/images/kadr/' + id + '.jpg';
      }
      return img;
    }
  } else {
    if (!id) {
      id = movie.kp_id;
    }
    if (st === config.domain && size === 'big') {
      st = 'k.1poster.net';
    }
    if (('' + movie.poster).replace(/\d/g, '')) {
      if (/^\/[a-z0-9]*\.(jpg|png)$/i.test(movie.poster)) {
        st = 't.1poster.net';
        switch (size) {
          case 'small':
            img = config.protocol + proxy + st + '/t/p/w92' + movie.poster;
            break;
          case 'big':
            img = config.protocol + proxy + st + '/t/p/original' + movie.poster;
            break;
          default:
            img = config.protocol + proxy + st + '/t/p/w185' + movie.poster;
        }
        return img;
      } else if (/^http/i.test(movie.poster)) {
        return movie.poster;
      } else {
        return config.protocol + config.domain + movie.poster;
      }
    }
    if (st !== config.domain) {
      switch (size) {
        case 'small':
          var width = config.image.size / 2 >= 60 ? config.image.size / 2 : 60;
          img =
            config.protocol +
            proxy +
            st +
            '/images/film_iphone/iphone' +
            width +
            '_' +
            id +
            '.jpg';
          break;
        case 'big':
          img =
            config.protocol + proxy + st + '/images/film_big/' + id + '.jpg';
          break;
        default:
          img =
            config.protocol +
            proxy +
            st +
            '/images/film_iphone/iphone' +
            config.image.size +
            '_' +
            id +
            '.jpg';
      }
      return img;
    }
  }

  var separator = config.urls.separator;
  var prefix_id = 'img' + id;
  var url = config.urls.movie_url;

  url = url.replace(/\[prefix_id]/gi, prefix_id);
  url = url.replace(/\[separator]/gi, separator);

  var keys = {
    title: movie.title_ru || movie.title_en,
    title_ru: movie.title_ru,
    title_en: movie.title_en,
    year: movie.year,
    country: movie.country.split(',')[0],
    director: movie.director.split(',')[0],
    genre: movie.genre.split(',')[0],
    actor: movie.actor.split(',')[0]
  };

  for (var key in keys) {
    if (keys.hasOwnProperty(key)) {
      if (!keys[key]) {
        url = url.replace(separator + '[' + key + ']' + separator, separator);
        url = url.replace('[' + key + ']' + separator, '');
        url = url.replace(separator + '[' + key + ']', '');
      } else {
        url = url.replace('[' + key + ']', getSlug(keys[key], separator));
      }
    }
  }

  url = url.split('.')[0];

  img = '/images/' + type + '/' + size + '/' + url + '.jpg';

  return img;
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
    options.domain = '' + config.domain;
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
                ? createImgUrl(movie, 'picture', 'small')
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
              ? createImgUrl(movie, 'picture', 'small')
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
      '/' +
      CP_translit.text(category)
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
    options.domain = '' + config.domain;
  }

  return contents.map(function(content) {
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
        '/' +
        content.content_url
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
          new Date(parseInt(days) - 719527 * 1000 * 60 * 60 * 24)
            .toJSON()
            .substr(0, 10)
        ).format(config.default.moment)
      : '';
  }
}

module.exports = {
  categories: structureCategories,
  movie: structureMovie,
  content: structureContent
};
