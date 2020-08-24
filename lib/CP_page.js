'use strict';

/**
 * Module dependencies.
 */

var CP_text = require('./CP_text');
var CP_translit = require('./CP_translit');
var CP_autocomplete = require('./CP_autocomplete');

var CP_player = require('../modules/CP_player');
var CP_schema = require('../modules/CP_schema');
var CP_comments = require('../modules/CP_comments');
var CP_social = require('../modules/CP_social');
var CP_random = require('../modules/CP_random');
var CP_viewed = require('../modules/CP_viewed');
var CP_continue = require('../modules/CP_continue');
var CP_mobile = require('../modules/CP_mobile');
var CP_episode = require('../modules/CP_episode');
var CP_adv = require('../modules/CP_adv');
var CP_tv = require('../modules/CP_tv');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
var modules = require('../config/production/modules');

/**
 * Callback.
 *
 * @callback Callback
 * @param {Object} err
 * @param {Object} [render]
 */

/**
 * Adding basic information on the index page:
 * protocol, domain, email, url, urls, codes, seo, title,
 * description, sorting, pagination.
 *
 * Data from modules:
 * viewed, continue, social, schema, mobile, episode, adv,
 * tv, random.
 *
 * @param {Object} result
 * @param {Object} [options]
 * @param {Callback} callback
 */

function pageIndex(result, options, callback) {
  if (!arguments.length) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var all = result.count;
  delete result.count;
  var page = {};

  page.ver = process.env.CP_VER || new Date().getTime().toString();
  page.theme = config.theme;
  page.protocol = config.protocol;
  page.subdomain = config.subdomain;
  page.domain = options.domain;
  page.email = config.email;
  page.language = config.language;
  page.country = config.country;
  page.l = config.l;
  page.url = config.protocol + options.domain;
  page.pathname = '/';
  page.type = 'index';
  page.urls = formatUrls(config.urls);
  page.codes = formatCodes(config.codes);
  page.seo = CP_text.formatting(config.descriptions.index);

  if (Object.keys(result.index).length) {
    var type =
      config.index.count.type === 'content_url'
        ? modules.content.data.url
        : config.urls[config.index.count.type];
    var url = categoryUrl(type, config.index.count.key, options);
    page.pagination = createPagination(url, config.index.count.sorting, 1, all);
  }

  page.title = optimalLength(CP_text.formatting(config.titles.index));
  page.h1 = optimalLength(CP_text.formatting(config.h1.index));
  page.description = optimalLength(page.seo);

  if (modules.viewed.status) {
    page.codes.footer = CP_viewed.code() + page.codes.footer;
  }
  if (modules.continue.status) {
    page.codes.footer = CP_continue.code(options) + page.codes.footer;
  }
  if (modules.social.status) {
    page.social = CP_social.pages();
  }
  if (modules.schema.status) {
    page.codes.head = CP_schema.general(page, options) + page.codes.head;
  }
  if (modules.mobile.status) {
    page.codes.head = CP_mobile.mobile(page.url) + page.codes.head;
  }
  if (modules.adv.status) {
    page.adv = CP_adv.codes(options, 'index');
  }
  if (modules.tv.status) {
    page.codes.head = CP_tv.tv(page.url) + page.codes.head;
    if (/^tv\./.test(options.domain) || /\/tv-version$/.test(options.domain)) {
      result.payload = CP_tv.index(result, options);
    }
  }
  if (modules.random.status) {
    page.codes.footer = CP_random.code(page) + page.codes.footer;
  }
  page.codes.footer = CP_autocomplete.code() + page.codes.footer;

  result.page = page;
  callback(null, result);
}

/**
 * Adding basic information on the movie page:
 * protocol, domain, email, url, urls, codes, seo, title,
 * description.
 *
 * Data from modules:
 * player, viewed, continue, social, schema, comments,
 * mobile, episode, schema, adv, tv, random.
 *
 * @param {Object} result
 * @param {String} type - One type of movie, online,
 * download, picture, trailer or episode.
 * @param {Object} [options]
 * @param {Callback} callback
 */

function pageMovie(result, type, options, callback) {
  if (arguments.length === 3) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var movie = result.movie;
  var movies = result.movies;
  var comments = result.comments;
  var page = {};

  page.ver = process.env.CP_VER || new Date().getTime().toString();
  page.theme = config.theme;
  page.protocol = config.protocol;
  page.subdomain = config.subdomain;
  page.domain = options.domain;
  page.email = config.email;
  page.language = config.language;
  page.country = config.country;
  page.l = config.l;
  page.url =
    type === 'movie'
      ? movie.url
      : movie.url + '/' + (config.urls.movies[type] || type);
  page.pathname =
    type === 'movie'
      ? movie.pathname
      : movie.pathname + '/' + (config.urls.movies[type] || type);
  page.type = type;
  page.urls = formatUrls(config.urls);
  page.codes = formatCodes(config.codes);
  page.seo = config.descriptions.movie[type]
    ? CP_text.formatting(config.descriptions.movie[type], movie)
    : '';

  if (options.debug) {
    options.debug.detail.push({
      type: 'seo',
      duration: new Date() - options.debug.duration.current + 'ms'
    });
    options.debug.duration.current = new Date();
  }

  page.title = optimalLength(uniqueTitle());
  page.h1 = optimalLength(CP_text.formatting(config.h1.movie[type], movie));
  page.description = optimalLength(movie.description_meta || page.seo);

  if (options.debug) {
    options.debug.detail.push({
      type: 'meta',
      duration: new Date() - options.debug.duration.current + 'ms'
    });
    options.debug.duration.current = new Date();
  }

  if (modules.player.status || type === 'trailer' || type === 'picture') {
    var player = CP_player.code(type, movie, options);
    page.codes.head = player.head + page.codes.head;
    page.player = player.player;
    page.codes.footer = player.footer + page.codes.footer;

    page.status_code = player.status_code ? player.status_code : '';

    if (options.debug) {
      options.debug.detail.push({
        type: 'player',
        duration: new Date() - options.debug.duration.current + 'ms'
      });
      options.debug.duration.current = new Date();
    }
  }
  if (/^tv\./.test(options.domain) || /\/tv-version$/.test(options.domain)) {
    if (modules.tv.status) {
      page.codes.head = CP_tv.tv(page.url) + page.codes.head;

      if (options.debug) {
        options.debug.detail.push({
          type: 'tv',
          duration: new Date() - options.debug.duration.current + 'ms'
        });
        options.debug.duration.current = new Date();
      }
    }
    result.page = page;
    return callback(null, result);
  }
  if (modules.viewed.status) {
    page.codes.footer = CP_viewed.code() + page.codes.footer;

    if (options.debug) {
      options.debug.detail.push({
        type: 'viewed',
        duration: new Date() - options.debug.duration.current + 'ms'
      });
      options.debug.duration.current = new Date();
    }
  }
  if (modules.continue.status) {
    page.codes.footer = CP_continue.code(options) + page.codes.footer;

    if (options.debug) {
      options.debug.detail.push({
        type: 'continue',
        duration: new Date() - options.debug.duration.current + 'ms'
      });
      options.debug.duration.current = new Date();
    }
  }
  if (modules.social.status) {
    page.social = CP_social.pages();

    if (options.debug) {
      options.debug.detail.push({
        type: 'social',
        duration: new Date() - options.debug.duration.current + 'ms'
      });
      options.debug.duration.current = new Date();
    }
  }
  if (modules.mobile.status) {
    page.codes.head = CP_mobile.mobile(page.url) + page.codes.head;

    if (options.debug) {
      options.debug.detail.push({
        type: 'mobile',
        duration: new Date() - options.debug.duration.current + 'ms'
      });
      options.debug.duration.current = new Date();
    }
  }
  if (modules.episode.status) {
    if (!page.title) {
      var serial = CP_episode.parse(type, options);

      movie.season = serial.season;
      movie.episode = serial.episode;
      movie.translate = serial.translate;

      page.seo = CP_text.formatting(modules.episode.data.description, movie);

      page.title = optimalLength(
        CP_text.formatting(modules.episode.data.title, movie)
      );
      page.h1 = optimalLength(
        CP_text.formatting(modules.episode.data.h1, movie)
      );
      page.description = optimalLength(page.seo);
    }
    page.codes.footer = CP_episode.code() + page.codes.footer;

    if (options.debug) {
      options.debug.detail.push({
        type: 'episode',
        duration: new Date() - options.debug.duration.current + 'ms'
      });
      options.debug.duration.current = new Date();
    }
  }
  if (modules.comments.status) {
    page.codes.head = CP_comments.head() + page.codes.head;
    page.comments = modules.comments.data.fast.active
      ? ''
      : CP_comments.codes(page.url, movie.id);
    page.codes.footer += CP_comments.codes(page.url, movie.id, {
      movie_id: movie.id,
      season_id: movie.season,
      episode_id: movie.episode
    });

    if (options.debug) {
      options.debug.detail.push({
        type: 'comments',
        duration: new Date() - options.debug.duration.current + 'ms'
      });
      options.debug.duration.current = new Date();
    }
  }
  if (modules.schema.status) {
    page.codes.head =
      CP_schema.fullMovie(page, movie, movies, comments, options) +
      page.codes.head;

    if (options.debug) {
      options.debug.detail.push({
        type: 'schema',
        duration: new Date() - options.debug.duration.current + 'ms'
      });
      options.debug.duration.current = new Date();
    }
  }
  if (modules.adv.status) {
    var t = config.titles.movie[type] ? type : 'episode';
    page.adv = CP_adv.codes(options, t);

    if (options.debug) {
      options.debug.detail.push({
        type: 'adv',
        duration: new Date() - options.debug.duration.current + 'ms'
      });
      options.debug.duration.current = new Date();
    }
  }
  if (modules.random.status) {
    page.codes.footer = CP_random.code(page) + page.codes.footer;

    if (options.debug) {
      options.debug.detail.push({
        type: 'random',
        duration: new Date() - options.debug.duration.current + 'ms'
      });
      options.debug.duration.current = new Date();
    }
  }
  page.codes.footer = CP_autocomplete.code() + page.codes.footer;

  /**
   * Choose a unique title, if any.
   *
   * @return {String}
   */

  function uniqueTitle() {
    return type === 'movie' && movie.title_page
      ? CP_text.formatting(movie.title_page)
      : config.titles.movie[type]
      ? CP_text.formatting(config.titles.movie[type], movie)
      : '';
  }

  result.page = page;
  callback(null, result);
}

/**
 * Adding basic information on the category page:
 * protocol, domain, email, url, urls, codes, seo, title,
 * description, sorting, pagination.
 *
 * Data from modules:
 * viewed, continue, social, schema, mobile, episode, adv,
 * tv, random.
 *
 * @param {Object} result
 * @param {Object} query
 * @param {String} sorting
 * @param {Number} num
 * @param {Object} [options]
 * @param {Callback} callback
 */

function pageCategory(result, query, sorting, num, options, callback) {
  if (arguments.length === 5) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var all = result.count;
  delete result.count;
  var movies = result.movies;
  var page = {};

  page.ver = process.env.CP_VER || new Date().getTime().toString();
  page.theme = config.theme;
  page.protocol = config.protocol;
  page.subdomain = config.subdomain;
  page.domain = options.domain;
  page.email = config.email;
  page.language = config.language;
  page.country = config.country;
  page.l = config.l;
  page.urls = formatUrls(config.urls);
  page.codes = formatCodes(config.codes);
  page.current_page = num;

  for (var type in query) {
    if (query.hasOwnProperty(type) && typeof query['page'] === 'undefined') {
      page.type = type;

      query['sorting'] =
        config.default.sorting !== sorting
          ? config.titles.sorting[sorting] || ''
          : '';
      query['page'] =
        num !== 1 ? config.titles.num.replace('[num]', '' + num) : '';

      page.seo = CP_text.formatting(config.descriptions[type], query);

      page.title = optimalLength(
        CP_text.formatting(config.titles[type], query)
      );
      page.h1 = optimalLength(CP_text.formatting(config.h1[type], query));
      page.description = optimalLength(page.seo);
      page.url = categoryUrl(config.urls[type], query[type], options);
      page.pathname = categoryUrl(
        config.urls[type],
        query[type],
        Object.assign(
          { query: options.query || {} },
          {
            protocol: '',
            domain: ''
          }
        )
      );

      if (result.movies.length) {
        page.sorting = sortingUrl(page.url, sorting);
        page.pagination = createPagination(page.url, sorting, num, all);
      }

      if (config.default.sorting !== sorting || num !== 1) {
        page.seo = '';
      }
    }
  }

  if (!/\s/g.test(page.title)) {
    page.title = page.title.charAt(0).toUpperCase() + page.title.slice(1);
  }
  if (!/\s/g.test(page.h1)) {
    page.h1 = page.h1.charAt(0).toUpperCase() + page.h1.slice(1);
  }
  if (!/\s/g.test(page.title)) {
    page.description =
      page.description.charAt(0).toUpperCase() + page.description.slice(1);
  }
  if (!/\s/g.test(page.seo)) {
    page.seo = page.seo.charAt(0).toUpperCase() + page.seo.slice(1);
  }

  if (modules.viewed.status) {
    page.codes.footer = CP_viewed.code() + page.codes.footer;
  }
  if (modules.continue.status) {
    page.codes.footer = CP_continue.code(options) + page.codes.footer;
  }
  if (modules.social.status) {
    page.social = CP_social.pages();
  }
  if (modules.schema.status) {
    page.codes.head =
      CP_schema.category(page, movies, options) + page.codes.head;
  }
  if (modules.mobile.status) {
    page.codes.head = CP_mobile.mobile(page.url) + page.codes.head;
  }
  if (modules.adv.status) {
    page.adv = CP_adv.codes(options, 'category');
  }
  if (modules.tv.status) {
    page.codes.head = CP_tv.tv(page.url) + page.codes.head;
    if (/^tv\./.test(options.domain) || /\/tv-version$/.test(options.domain)) {
      result.payload = CP_tv.category(result, page, options);
    }
  }
  if (modules.random.status) {
    page.codes.footer =
      CP_random.code(page, movies && movies.length > 1) + page.codes.footer;
  }
  page.codes.footer = CP_autocomplete.code() + page.codes.footer;

  result.page = page;
  callback(null, result);
}

/**
 * Adding basic information on the categories page:
 * protocol, domain, email, url, urls, codes, seo, title,
 * description.
 *
 * Data from modules:
 * viewed, continue, social, schema, mobile, episode, adv,
 * tv, random.
 *
 * @param {Object} result
 * @param {String} category
 * @param {Object} [options]
 * @param {Callback} callback
 */

function pageCategories(result, category, options, callback) {
  if (arguments.length === 1) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var page = {};

  var categories = {
    year: 'years',
    genre: 'genres',
    actor: 'actors',
    country: 'countries',
    director: 'directors'
  };

  page.ver = process.env.CP_VER || new Date().getTime().toString();
  page.theme = config.theme;
  page.protocol = config.protocol;
  page.subdomain = config.subdomain;
  page.domain = options.domain;
  page.email = config.email;
  page.language = config.language;
  page.country = config.country;
  page.l = config.l;
  page.urls = formatUrls(config.urls);
  page.codes = formatCodes(config.codes);
  page.url = categoriesUrl(config.urls[category], options);
  page.pathname = categoriesUrl(config.urls[category], {
    protocol: '',
    domain: ''
  });
  page.type = 'categories';
  page.seo = CP_text.formatting(config.descriptions[categories[category]]);

  page.title = optimalLength(
    CP_text.formatting(config.titles[categories[category]])
  );
  page.h1 = optimalLength(CP_text.formatting(config.h1[categories[category]]));
  page.description = optimalLength(page.seo);

  if (modules.viewed.status) {
    page.codes.footer = CP_viewed.code() + page.codes.footer;
  }
  if (modules.continue.status) {
    page.codes.footer = CP_continue.code(options) + page.codes.footer;
  }
  if (modules.social.status) {
    page.social = CP_social.pages();
  }
  if (modules.schema.status) {
    page.codes.head = CP_schema.general(page, options) + page.codes.head;
  }
  if (modules.mobile.status) {
    page.codes.head = CP_mobile.mobile(page.url) + page.codes.head;
  }
  if (modules.adv.status) {
    page.adv = CP_adv.codes(options, 'categories');
  }
  if (modules.tv.status) {
    page.codes.head = CP_tv.tv(page.url) + page.codes.head;
    if (/^tv\./.test(options.domain) || /\/tv-version$/.test(options.domain)) {
      result.payload = CP_tv.categories(result, options);
    }
  }
  if (modules.random.status) {
    page.codes.footer = CP_random.code(page) + page.codes.footer;
  }
  page.codes.footer = CP_autocomplete.code() + page.codes.footer;

  result.page = page;
  callback(null, result);
}

/**
 * Adding basic information on the content:
 * protocol, domain, email, url, urls, codes, seo, title,
 * description, sorting, pagination.
 *
 * Data from modules:
 * viewed, continue, social, schema, comments, mobile, adv,
 * tv, random.
 *
 * @param {Object} result
 * @param {String} url - The unique key page.
 * @param {Number} num
 * @param {String} sorting
 * @param {Object} [options]
 * @param {Callback} callback
 */

function pageContent(result, url, num, sorting, options, callback) {
  if (arguments.length === 3) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var content = result.content;

  var all = result.count;
  delete result.count;
  var page = {};
  var keys = {};

  keys['sorting'] =
    config.default.sorting !== sorting
      ? config.titles.sorting[sorting] || ''
      : '';
  keys['page'] = num !== 1 ? config.titles.num.replace('[num]', '' + num) : '';

  page.ver = process.env.CP_VER || new Date().getTime().toString();
  page.theme = config.theme;
  page.protocol = config.protocol;
  page.subdomain = config.subdomain;
  page.domain = options.domain;
  page.email = config.email;
  page.language = config.language;
  page.country = config.country;
  page.l = config.l;
  page.urls = formatUrls(config.urls);
  page.codes = formatCodes(config.codes);

  page.title = optimalLength(CP_text.formatting(content.title));
  page.h1 = optimalLength(CP_text.formatting(content.title));
  page.description = optimalLength(content.description);
  page.url =
    config.protocol +
    options.domain +
    '/' +
    modules.content.data.url +
    config.urls.slash +
    url;
  page.pathname = '/' + modules.content.data.url + config.urls.slash + url;
  page.type = 'content';
  page.current_page = num;

  if (result.movies.length && !/(NoSorting)/i.test(content.tags)) {
    page.sorting = sortingUrl(page.url, sorting);
  }

  if (result.movies.length && !/(NoPagination)/i.test(content.tags)) {
    page.pagination = createPagination(page.url, sorting, num, all);
  }

  if (modules.viewed.status) {
    page.codes.footer = CP_viewed.code() + page.codes.footer;
  }
  if (modules.continue.status) {
    page.codes.footer = CP_continue.code(options) + page.codes.footer;
  }
  if (modules.social.status) {
    page.social = CP_social.pages();
  }
  if (modules.schema.status) {
    page.codes.head = CP_schema.content(content, options) + page.codes.head;
  }
  if (modules.comments.status && !/NoComment/i.test(content.tags)) {
    page.codes.head = CP_comments.head() + page.codes.head;
    page.comments = modules.comments.data.fast.active
      ? ''
      : CP_comments.codes(page.url, content.id);
    page.codes.footer += CP_comments.codes(page.url, content.id, {
      content_id: content.id
    });
  }
  if (modules.mobile.status) {
    page.codes.head = CP_mobile.mobile(page.url) + page.codes.head;
  }
  if (modules.adv.status) {
    page.adv = CP_adv.codes(options, 'category');
  }
  if (modules.tv.status) {
    page.codes.head = CP_tv.tv(page.url) + page.codes.head;
  }
  if (modules.random.status && !/(NoComment|NoRandom)/i.test(content.tags)) {
    page.codes.footer =
      result.movies.length > 1
        ? CP_random.code(page) + page.codes.footer
        : page.codes.footer;
  }
  page.codes.footer = CP_autocomplete.code() + page.codes.footer;

  if (/NoSorting/i.test(content.tags)) {
    content.tags = content.tags
      .replace(/\s*,\s*<a[^>]*>NoSorting<\/a>\s*/i, '')
      .replace(/\s*<a[^>]*>NoSorting<\/a>\s*,\s*/i, '')
      .replace(/\s*<a[^>]*>NoSorting<\/a>\s*/i, '');
  }
  if (/NoPagination/i.test(content.tags)) {
    content.tags = content.tags
      .replace(/\s*,\s*<a[^>]*>NoPagination<\/a>\s*/i, '')
      .replace(/\s*<a[^>]*>NoPagination<\/a>\s*,\s*/i, '')
      .replace(/\s*<a[^>]*>NoPagination<\/a>\s*/i, '');
  }
  if (/NoRandom/i.test(content.tags)) {
    content.tags = content.tags
      .replace(/\s*,\s*<a[^>]*>NoRandom<\/a>\s*/i, '')
      .replace(/\s*<a[^>]*>NoRandom<\/a>\s*,\s*/i, '')
      .replace(/\s*<a[^>]*>NoRandom<\/a>\s*/i, '');
  }
  if (/NoComment/i.test(content.tags)) {
    content.tags = content.tags
      .replace(/\s*,\s*<a[^>]*>NoComments?<\/a>\s*/i, '')
      .replace(/\s*<a[^>]*>NoComments?<\/a>\s*,\s*/i, '')
      .replace(/\s*<a[^>]*>NoComments?<\/a>\s*/i, '');
  }

  result.page = page;
  callback(null, result);
}

/**
 * Adding basic information on the contents:
 * protocol, domain, email, url, urls, codes, seo, title,
 * description.
 *
 * Data from modules:
 * viewed, continue, social, schema, mobile, episode, adv,
 * tv, random.
 *
 * @param {Object} query
 * @param {Object} result
 * @param {Object} [options]
 * @param {Callback} callback
 */

function pageContents(query, result, options, callback) {
  if (!arguments.length) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var page = {};

  page.ver = process.env.CP_VER || new Date().getTime().toString();
  page.theme = config.theme;
  page.protocol = config.protocol;
  page.subdomain = config.subdomain;
  page.domain = options.domain;
  page.email = config.email;
  page.language = config.language;
  page.country = config.country;
  page.l = config.l;
  page.urls = formatUrls(config.urls);
  page.codes = formatCodes(config.codes);
  page.url = categoriesUrl(
    modules.content.data.url +
      (query && query.content_tags
        ? '?tag=' + encodeURIComponent(query.content_tags)
        : ''),
    options
  );
  page.pathname = categoriesUrl(
    modules.content.data.url +
      (query && query.content_tags
        ? '?tag=' + encodeURIComponent(query.content_tags)
        : ''),
    {
      protocol: '',
      domain: ''
    }
  );
  page.type = 'contents';
  page.seo = !query.content_tags
    ? CP_text.formatting(modules.content.data.description)
    : '';

  page.title = !query.content_tags
    ? optimalLength(CP_text.formatting(modules.content.data.title))
    : optimalLength(query.content_tags);
  page.h1 = !query.content_tags
    ? optimalLength(CP_text.formatting(modules.content.data.h1))
    : optimalLength(query.content_tags);
  page.description = !query.content_tags
    ? optimalLength(page.seo)
    : optimalLength(query.content_tags);

  if (modules.viewed.status) {
    page.codes.footer = CP_viewed.code() + page.codes.footer;
  }
  if (modules.continue.status) {
    page.codes.footer = CP_continue.code(options) + page.codes.footer;
  }
  if (modules.social.status) {
    page.social = CP_social.pages();
  }
  if (modules.mobile.status) {
    page.codes.head = CP_mobile.mobile(page.url) + page.codes.head;
  }
  if (modules.adv.status) {
    page.adv = CP_adv.codes(options, 'categories');
  }
  if (modules.tv.status) {
    page.codes.head = CP_tv.tv(page.url) + page.codes.head;
  }
  if (modules.random.status) {
    page.codes.footer = CP_random.code(page) + page.codes.footer;
  }
  page.codes.footer = CP_autocomplete.code() + page.codes.footer;

  result.page = page;
  callback(null, result);
}

/**
 * Create URL for category/content.
 *
 * @param {String} category
 * @param {String} name
 * @param {Object} [options]
 * @return {String}
 */

function categoryUrl(category, name, options) {
  if (arguments.length === 2) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var options_query = [];
  if (options.query) {
    for (var q in options.query) {
      if (options.query.hasOwnProperty(q)) {
        options_query.push(
          q + '=' + CP_translit.text(options.query[q], undefined, q)
        );
      }
    }
  }

  return (
    (options.domain ? config.protocol : '') +
    options.domain +
    '/' +
    category +
    config.urls.slash +
    CP_translit.text(name, undefined, category) +
    (options_query && options_query.length ? '?' + options_query.join('&') : '')
  );
}

/**
 * Create URL for categories/contents.
 *
 * @param {String} category
 * @param {Object} [options]
 * @return {String}
 */

function categoriesUrl(category, options) {
  if (arguments.length === 1) {
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  return (
    (typeof options.protocol === 'string' && options.protocol === ''
      ? ''
      : config.protocol) +
    options.domain +
    '/' +
    category
  );
}

/**
 * Create a URL including sorting.
 *
 * @param {String} url
 * @param {String} sorting
 * @return {Object}
 */

function sortingUrl(url, sorting) {
  var sortingUp = [
    'kinopoisk-rating-up',
    'imdb-rating-up',
    'kinopoisk-vote-up',
    'imdb-vote-up',
    'year-up',
    'premiere-up'
  ];

  var sortingDown = {
    'kinopoisk-rating-down': sortingUp[0],
    'imdb-rating-down': sortingUp[1],
    'kinopoisk-vote-down': sortingUp[2],
    'imdb-vote-down': sortingUp[3],
    'year-down': sortingUp[4],
    'premiere-down': sortingUp[5]
  };

  return sortingUp.map(function(s) {
    var a = false;

    if (sorting === s) {
      s = sorting.replace('up', 'down');
      a = 'up';
    } else if (sortingDown[sorting] === s) {
      a = 'down';
    }

    return {
      name: config.sorting[s],
      url: url + (url.indexOf('?') + 1 ? '&' : '?') + 'sorting=' + s,
      active: a
    };
  });
}

/**
 * Remove excess, added new in URLs.
 *
 * @param {Object} urls
 * @return {Object}
 */

function formatUrls(urls) {
  var a = JSON.stringify(urls);
  urls = JSON.parse(a);

  delete urls.prefix_id;
  delete urls.unique_id;
  delete urls.separator;
  delete urls.movie_url;
  delete urls.admin;
  delete urls.prefix_id;
  delete urls.translit;

  urls.genres = config.default.categories.genres.map(function(genre) {
    return {
      title: genre,
      url:
        '/' +
        urls.genre +
        config.urls.slash +
        CP_translit.text(genre, undefined, urls.genre)
    };
  });

  urls.countries = config.default.categories.countries.map(function(country) {
    return {
      title: country,
      url:
        '/' +
        urls.country +
        config.urls.slash +
        CP_translit.text(country, undefined, urls.country)
    };
  });

  urls.years = config.default.categories.years.map(function(year) {
    return {
      title: year,
      url: '/' + urls.year + config.urls.slash + year
    };
  });

  if (modules.content.status) {
    urls.content = modules.content.data.url;
  }

  return urls;
}

/**
 * Remove excess, added new in codes.
 *
 * @param {Object} codes
 * @return {Object}
 */

function formatCodes(codes) {
  var a = JSON.stringify(codes);
  codes = JSON.parse(a);

  codes.head +=
    '<script>function getCookieCinemaPress(e){var o=document.cookie.match(new RegExp("(?:^|; )"+e.replace(/([.$?*|{}()[]\\/+^])/g,"\\$1")+"=([^;]*)"));return o?decodeURIComponent(o[1]):""}function setCookieCinemaPress(e,o,n){var r=(n=n||{}).expires;if("number"==typeof r&&r){var t=new Date;t.setTime(t.getTime()+1e3*r),r=n.expires=t}r&&r.toUTCString&&(n.expires=r.toUTCString());var i=e+"="+(o=encodeURIComponent(o));for(var a in n)if(n.hasOwnProperty(a)){i+="; "+a;var c=n[a];!0!==c&&(i+="="+c)}document.cookie=i}</script>';

  delete codes.robots;

  return codes;
}

/**
 * SEO description and title.
 *
 * @param {String} text
 * @return {String}
 */

function optimalLength(text) {
  text = text
    .replace(/<(?:.|\n)*?>/gm, '')
    .replace(/\s+/g, ' ')
    .replace(/(^\s*)|(\s*)$/g, '')
    .replace(/"([^"]*?)"/gi, '«$1»')
    .replace('"', '&quot;');

  if (text.length > 160) {
    var seo_text = text.substr(0, 160);
    var seo_arr = seo_text.split(' ');
    if (seo_arr.length > 1) seo_arr.pop();
    text = seo_arr.join(' ').trim();
  }

  return text;
}

/**
 * Create pagination links.
 *
 * @param {String} url
 * @param {String} sorting
 * @param {Number} current
 * @param {Number} last
 * @return {Object}
 */

function createPagination(url, sorting, current, last) {
  if (!last) return false;

  var pagination = {};
  pagination.prev = [];
  pagination.next = [];
  pagination.current = current;

  var number_prev = current;
  var number_next = current;

  var pages =
    current <= config.default.pages / 2
      ? config.default.pages - current + 1
      : current >= last - config.default.pages / 2
      ? config.default.pages - (last - current)
      : config.default.pages / 2;

  var sorting_page =
    !sorting ||
    (sorting === config.default.sorting &&
      url.indexOf('/' + modules.content.data.url + config.urls.slash) === -1)
      ? ''
      : (url.indexOf('?') + 1 ? '&' : '?') + 'sorting=' + sorting;

  pagination.first = {
    number: 1,
    link: url + sorting_page
  };

  pagination.last = {
    number: last,
    link:
      (url.indexOf('?') + 1
        ? url.replace('?', '/' + last + '?')
        : url + '/' + last) + sorting_page
  };

  for (var i = 1; i <= pages; i++) {
    number_prev = number_prev - 1;
    if (number_prev >= 1) {
      pagination.prev.push({
        number: number_prev,
        link:
          (url.indexOf('?') + 1
            ? number_prev === 1
              ? url
              : url.replace('?', '/' + number_prev + '?')
            : number_prev === 1
            ? url
            : url + '/' + number_prev) + sorting_page
      });
    }
    number_next = number_next + 1;
    if (number_next <= last) {
      pagination.next.push({
        number: number_next,
        link:
          (url.indexOf('?') + 1
            ? url.replace('?', '/' + number_next + '?')
            : url + '/' + number_next) + sorting_page
      });
    }
    if (number_next === last || current === last) {
      pagination.last = null;
    }
    if (number_prev === 1 || current === 1) {
      pagination.first = null;
    }
  }

  pagination.prev.reverse();

  return pagination;
}

module.exports = {
  index: pageIndex,
  movie: pageMovie,
  category: pageCategory,
  categories: pageCategories,
  content: pageContent,
  contents: pageContents
};
