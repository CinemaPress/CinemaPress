'use strict';

/**
 * Module dependencies.
 */

var CP_publish = require('./CP_publish');
var CP_structure = require('./CP_structure');
var CP_cache = require('./CP_cache');
var CP_sphinx = require('./CP_sphinx');
var CP_text = require('./CP_text');
var CP_regexp = require('./CP_regexp');
var CP_translit = require('./CP_translit');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
var modules = require('../config/production/modules');

/**
 * Node dependencies.
 */

var async = require('async');
var md5 = require('md5');

/**
 * Callback.
 *
 * @callback Callback
 * @param {Object} err
 * @param {Object} [render]
 */

/**
 * Getting all movies for a particular query.
 *
 * @param {Object} query
 * @param {Number} [count]
 * @param {String} [sorting]
 * @param {Number} [page]
 * @param {Boolean} [structure]
 * @param {Object} [options]
 * @param {Callback} callback
 */

function moviesGet(query, count, sorting, page, structure, options, callback) {
  if (arguments.length === 6) {
    callback = options;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  } else if (arguments.length === 5) {
    callback = structure;
    structure = true;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  } else if (arguments.length === 4) {
    callback = page;
    page = 1;
    structure = true;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  } else if (arguments.length === 3) {
    callback = sorting;
    sorting = 'kinopoisk-vote-up';
    page = 1;
    structure = true;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  } else if (arguments.length === 2) {
    callback = count;
    count = config.default.count;
    sorting = 'kinopoisk-vote-up';
    page = 1;
    structure = true;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var sm1 = false,
    sm2 = false,
    sm3 = false;
  if (count === -1) {
    count = config.default.loc;
    sm1 = true;
  } else if (count === -2) {
    count = config.default.tag;
    sm2 = true;
  } else if (count === -3) {
    count = modules.random.data.count;
    sorting = modules.random.data.sorting;
    sm3 = true;
  }

  count = typeof count !== 'undefined' ? count : config.default.count;
  sorting = typeof sorting !== 'undefined' ? sorting : 'kinopoisk-vote-up';
  page = typeof page !== 'undefined' ? page : 1;
  structure = typeof structure !== 'undefined' ? structure : true;
  options = typeof options !== 'undefined' ? options : {};
  options.domain =
    typeof options.domain !== 'undefined' ? options.domain : '' + config.domain;
  options.origin =
    typeof options.origin !== 'undefined'
      ? options.origin
      : config.protocol + '' + config.subdomain + '' + config.domain;

  if (!parseInt(page + '') || !parseInt(count + '')) {
    return callback(
      '[lib/CP_get.js:moviesGet] Error: ' + JSON.stringify(query)
    );
  }

  var q = {};
  q._limit =
    parseInt(page + '') * parseInt(count + '') -
    parseInt(count + '') +
    ',' +
    parseInt(count + '');
  q._option =
    'max_matches = ' +
    (parseInt(page + '') * parseInt(count + '') -
      parseInt(count + '') +
      parseInt(count + ''));

  if (query.certainly) {
    q._select = q._where = '';
    delete query.certainly;
  } else {
    q = CP_publish.queryCondition(q);
  }

  if (query.from) {
    q._from = query.from;
    delete query.from;
  } else {
    q._from =
      process.env['CP' + '_' + 'XML' + 'PIPE' + '2'] +
      ', ' +
      process.env['CP' + '_' + 'RT'];
  }

  if (query.full) {
    q._select = '*';
    delete query.full;
  } else if (query.id) {
    q._select = '*';
    q._where =
      '`kp_id` = ' +
      query.id +
      ' AND ' +
      "`all_movies` = '_" +
      config.domain.replace(/[^a-z0-9]/g, '_') +
      "_'";
    delete query.id;
  } else if (query.ids) {
    q._select = '*';
    q._where =
      "`all_movies` = '_" + config.domain.replace(/[^a-z0-9]/g, '_') + "_'";
    delete query.ids;
  } else {
    q._where = createWhere() + q._where + createOrderBy();
    q._select =
      sm1 || sm3
        ? 'kp_id, title_ru, title_en, year, country, director, genre, actor, custom ' +
          q._select
        : sm2
        ? 'year, country, director, genre, actor, pictures ' + q._select
        : '* ' + q._select;
  }

  var queryString =
    (q._select ? ' SELECT ' + q._select : '') +
    (q._from ? ' FROM ' + q._from : '') +
    (q._where ? ' WHERE ' + q._where : '') +
    (q._limit ? ' LIMIT ' + q._limit : '') +
    (q._option ? ' OPTION ' + q._option : '');

  var hash = md5((options.origin || '') + queryString + structure);

  CP_cache.get(hash, function(err, render) {
    return render
      ? callback(null, render)
      : CP_sphinx.query(queryString, function(err, movies) {
          if (err) return callback(err);
          if (movies && movies.length) {
            if (structure) {
              movies = CP_structure.movie(movies, options);
            }
          } else {
            movies = [];
          }
          callback(null, movies);
          if (config.cache.time && movies) {
            CP_cache.set(hash, movies, config.cache.time);
          }
        });
  });

  /**
   * Create WHERE for query.
   *
   * @return {String}
   */

  function createWhere() {
    var thematic = CP_publish.thematic();

    var where = thematic.where_config;
    var match = thematic.match_config;

    match.push('@all_movies ' + process.env['CP' + '_' + 'SPB']);

    if (sorting.indexOf('kinopoisk-rating') + 1) {
      where.push('`kp_vote` > ' + config.default.votes.kp);
    } else if (sorting.indexOf('imdb-rating') + 1) {
      where.push('`imdb_vote` > ' + config.default.votes.imdb);
    } else if (sorting.indexOf('year') + 1 || sorting.indexOf('premiere') + 1) {
      where.push('`premiere` <= ' + toDays(config.default.days));
    } else if (sorting.indexOf('soon') + 1) {
      where.push('`premiere` > ' + toDays());
    }

    for (var attribute in query) {
      if (query.hasOwnProperty(attribute) && query[attribute]) {
        var search = CP_regexp.str(query[attribute]).toLowerCase();
        if (attribute.indexOf('custom.') + 1) {
          where.push('' + attribute + " = '" + search + "'");
        } else if (attribute === 'type') {
          if (search === config.urls.types.serial.toLowerCase()) {
            where.push('`type` = 1');
            match.push('@genre ' + config.default.types.serial);
          } else if (search === config.urls.types.movie.toLowerCase()) {
            where.push('`type` != 1');
            match.push('@genre ' + config.default.types.movie);
          } else if (search === config.urls.types.multserial.toLowerCase()) {
            where.push('`type` = 1');
            match.push('@genre ' + config.default.types.mult);
          } else if (search === config.urls.types.mult.toLowerCase()) {
            where.push('`type` != 1');
            match.push('@genre ' + config.default.types.mult);
          } else if (search === config.urls.types.anime.toLowerCase()) {
            match.push('@genre ' + config.default.types.anime);
          } else if (search === config.urls.types.tv.toLowerCase()) {
            match.push('@genre ' + config.default.types.tv);
          }
        } else {
          if (
            (attribute === 'actor' || attribute === 'director') &&
            search !== '!_empty'
          ) {
            match.push('@' + attribute + ' ("' + search + '")');
          } else {
            match.push('@' + attribute + ' (' + search + ')');
          }
        }
        if (config.default.donotuse.indexOf(attribute) + 1) {
          where.forEach(function(w, i) {
            if (w.indexOf('_vote') + 1) {
              where.splice(i, 1);
            }
          });
        }
      }
    }

    where.push("MATCH('" + match.join(' ').trim() + "')");

    return where.join(' AND ');
  }

  /**
   * Create ORDER BY for query.
   *
   * @return {String}
   */

  function createOrderBy() {
    var ob = '';

    switch (sorting) {
      case 'kinopoisk-rating-up':
        ob = 'kp_rating DESC';
        break;
      case 'kinopoisk-rating-down':
        ob = 'kp_rating ASC';
        break;
      case 'imdb-rating-up':
        ob = 'imdb_rating DESC';
        break;
      case 'imdb-rating-down':
        ob = 'imdb_rating ASC';
        break;
      case 'kinopoisk-vote-up':
        ob = 'kp_vote DESC';
        break;
      case 'kinopoisk-vote-down':
        ob = 'kp_vote ASC';
        break;
      case 'imdb-vote-up':
        ob = 'imdb_vote DESC';
        break;
      case 'imdb-vote-down':
        ob = 'imdb_vote ASC';
        break;
      case 'year-up':
        ob = 'year DESC';
        break;
      case 'year-down':
        ob = 'year ASC';
        break;
      case 'premiere-up':
        ob = 'premiere DESC';
        break;
      case 'premiere-down':
        ob = 'premiere ASC';
        break;
      case 'kinopoisk-id-up':
        ob = 'kp_id DESC';
        break;
      case 'kinopoisk-id-down':
        ob = 'kp_id ASC';
        break;
      case 'soon':
        ob = 'premiere ASC';
        break;
      default:
        ob = '';
        break;
    }

    return ob !== '' ? ' ORDER BY ' + ob : '';
  }

  /**
   * The number of days to the current time.
   *
   * @param {Number} [days]
   * @return {Number}
   */

  function toDays(days) {
    days = days && parseInt(days + '') ? parseInt(days + '') : 0;
    return (
      719528 + Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)) + days
    );
  }
}

/**
 * The additional for index/related movies.
 *
 * @param {Object} query
 * @param {String} type
 * @param {Object} [options]
 * @param {Callback} callback
 */

function additionalMoviesGet(query, type, options, callback) {
  if (arguments.length === 3) {
    callback = options;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  var key,
    values,
    name = '',
    sorting,
    count,
    certainly,
    link = '';

  var type_video = 0;
  if (query && typeof query.type === 'number') {
    if (modules.related.data.same) {
      if (query.type === 0) {
        type_video = config.urls.types.movie;
      } else if (query.type === 1) {
        type_video = config.urls.types.serial;
      } else if (query.type === 2) {
        type_video = config.urls.types.movie;
      } else if (query.type === 3) {
        type_video = config.urls.types.tv;
      } else if (query.type === 4) {
        type_video = config.urls.types.mult;
      } else if (query.type === 5) {
        type_video = config.urls.types.anime;
      }
    }
    delete query.type;
  }

  for (var q in query) {
    if (query.hasOwnProperty(q)) {
      key = q;
      values =
        typeof query[q] === 'object' ? query[q] : ('' + query[q]).split(',');
    }
  }

  switch (type) {
    case 'related':
      name = modules.related.data.types[key].name;
      sorting = modules.related.data.types[key].sorting;
      count = modules.related.data.types[key].count;
      link = modules.related.data.link ? 'related' : '';
      break;
    case 'index':
      name = config.index[key].name;
      sorting = config.index[key].sorting;
      count = config.index[key].count;
      link = config.index.link ? 'index' : '';
      break;
    case 'index_ids':
      name = config.index.ids.name;
      sorting = '';
      values = [formatIds(values.slice(0, config.index.ids.count))];
      count = values[0].split('|').length;
      break;
    case 'ids':
      sorting = '';
      values = [formatIds(values)];
      count = values[0].split('|').length;
      break;
    case 'top':
      sorting = modules.top.data.sorting;
      count = modules.top.data.count;
      break;
    case 'soon':
      if (modules.soon.data.movies.length) {
        type = 'ids';
        key = 'query_id';
        sorting = '';
        values = [formatIds(modules.soon.data.movies)];
        count = values[0].split('|').length;
      } else {
        sorting = 'soon';
        count = modules.soon.data.count;
      }
      break;
    default:
      type = '';
      sorting = 'kinopoisk-vote-up';
      count = 10;
  }

  var hash = md5(
    key +
      values.join(',') +
      type +
      count +
      sorting +
      type_video +
      options.domain
  );

  return config.cache.time
    ? CP_cache.get(hash, function(err, render) {
        return render
          ? callback(null, render)
          : getSphinx(function(err, render) {
              return err ? callback(err) : callback(null, render);
            });
      })
    : getSphinx(function(err, render) {
        return err ? callback(err) : callback(null, render);
      });

  /**
   * If not cache to get Sphinx.
   *
   * @param {Callback} callback
   */

  function getSphinx(callback) {
    var m = [];

    async.forEachOfSeries(
      values,
      function(value, k, callback) {
        var query = {};
        query[key] = ('' + value)
          .replace(/\s+/g, ' ')
          .replace(/(^\s*)|(\s*)$/g, '');

        if (type_video) {
          query['type'] = type_video;
        }

        if (!query[key]) return callback();

        if (certainly) {
          query.certainly = certainly;
        }

        moviesGet(query, count, sorting, 1, true, options, function(
          err,
          movies
        ) {
          if (err) return callback(err);

          if (movies && movies.length) {
            m.push({
              movies: key === 'query_id' ? sortingIds(value, movies) : movies,
              url: createCategoryUrl(key, query[key]),
              name:
                link && type === link
                  ? createCategoryUrl(
                      key,
                      query[key],
                      CP_text.formatting(name, query)
                    )
                  : CP_text.formatting(name, query)
            });
          }

          callback();
        });
      },
      function(err) {
        if (err) return callback(err);

        m = !m.length ? [] : m[0].name ? m : m[0].movies;

        callback(null, m);

        if (config.cache.time && m) {
          CP_cache.set(hash, m, config.cache.time);
        }
      }
    );
  }

  /**
   * Sort films are turned by id list.
   *
   * @param {String} ids
   * @param {Object} movies
   * @return {Array}
   */

  function sortingIds(ids, movies) {
    var arr = ('' + ids).split('|');

    var result = [];

    for (var id = 0; id < arr.length; id++) {
      for (var i = 0; i < movies.length; i++) {
        if (parseInt(movies[i].kp_id) === parseInt(arr[id]))
          result.push(movies[i]);
      }
    }

    return result;
  }

  /**
   * Delete empty id in query.
   *
   * @param {Array} value
   * @return {String}
   */

  function formatIds(value) {
    var ids = JSON.parse(JSON.stringify(value));

    var all = ids
      .join(',')
      .replace(/\s*\(\s*([0-9]{3,8})\s*\)\s*\{[^]*?}\s*/gi, ',$1,');

    ids = all.split(',');

    var result = [];

    for (var id = 0; id < ids.length; id++) {
      ids[id] = ids[id].replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '');
      if (ids[id]) {
        result.push(ids[id]);
      }
    }

    return result.join('|');
  }

  /**
   * Create URL for category page.
   *
   * @param {String} type
   * @param {String} item
   * @param {String} [name]
   * @return {String}
   */

  function createCategoryUrl(type, item, name) {
    if (name) {
      return config.urls[type]
        ? '<a href="' +
            config.protocol +
            options.domain +
            '/' +
            config.urls[type] +
            config.urls.slash +
            CP_translit.text(item) +
            '">' +
            name +
            '</a>'
        : name;
    } else {
      return config.urls[type]
        ? config.protocol +
            options.domain +
            '/' +
            config.urls[type] +
            config.urls.slash +
            CP_translit.text(item)
        : '';
    }
  }
}

/**
 * Getting count movies for a particular query.
 *
 * @param {Object} query
 * @param {String} [sorting]
 * @param {Callback} callback
 */

function countMoviesGet(query, sorting, callback) {
  if (arguments.length === 2) {
    callback = sorting;
    sorting = 'kinopoisk-vote-up';
  }

  if (query.certainly) {
    var certainly = query.certainly;
    delete query.certainly;
  }

  var q = {};

  q = CP_publish.queryCondition(q, certainly);

  if (query.from) {
    q._from = query.from;
    delete query.from;
  } else {
    q._from =
      process.env['CP' + '_' + 'XML' + 'PIPE' + '2'] +
      ', ' +
      process.env['CP' + '_' + 'RT'];
  }

  if (query.full) {
    q._where = '';
    q._select = 'kp_id';
    delete query.full;
  } else {
    q._select = q._select ? 'kp_id ' + q._select : 'kp_id';
    q._where = createWhere() + q._where;
  }

  q._limit = 1;
  q._option = 'max_matches=500';

  var queryString =
    '' +
    (q._select ? ' SELECT ' + q._select : '') +
    (q._from ? ' FROM ' + q._from : '') +
    (q._where ? ' WHERE ' + q._where : '') +
    (q._limit ? ' LIMIT ' + q._limit : '') +
    (q._option ? ' OPTION ' + q._option : '') +
    '; SHOW META';

  CP_sphinx.query(queryString, function(err, count) {
    if (err) return callback(err);
    if (
      count &&
      count.length &&
      count[1] &&
      count[1].length &&
      count[1][1] &&
      count[1][1]['Value'] &&
      parseInt(count[1][1]['Value'])
    ) {
      if (query.query_id) return callback(null, count[1][1]['Value']);
      if (parseInt(count[1][1]['Value']) < 500)
        return callback(null, count[1][1]['Value']);
      queryString = queryString.replace(
        'max_matches=500',
        'max_matches=' + count[1][1]['Value']
      );
      CP_sphinx.query(queryString, function(err, count2) {
        if (err) return callback(err);
        if (
          count2 &&
          count2.length &&
          count2[1] &&
          count2[1].length &&
          count2[1][1] &&
          count2[1][1]['Value'] &&
          parseInt(count[1][1]['Value'])
        ) {
          count2 = count2[1][1]['Value'];
        } else {
          count2 = 0;
        }
        callback(null, count2);
      });
    } else {
      callback(null, 0);
    }
  });

  /**
   * Create WHERE for query.
   *
   * @return {String}
   */

  function createWhere() {
    var thematic = CP_publish.thematic();

    var where = thematic.where_config;
    var match = thematic.match_config;

    match.push('@all_movies ' + process.env['CP' + '_' + 'SPB']);

    if (sorting.indexOf('kinopoisk-rating') + 1) {
      where.push('`kp_vote` > ' + config.default.votes.kp);
    } else if (sorting.indexOf('imdb-rating') + 1) {
      where.push('`imdb_vote` > ' + config.default.votes.imdb);
    } else if (sorting.indexOf('year') + 1 || sorting.indexOf('premiere') + 1) {
      where.push('`premiere` <= ' + toDays(config.default.days));
    } else if (sorting.indexOf('soon') + 1) {
      where.push('`premiere` > ' + toDays());
    }

    for (var attribute in query) {
      if (query.hasOwnProperty(attribute) && query[attribute]) {
        var search = CP_regexp.str(query[attribute]).toLowerCase();
        if (attribute.indexOf('custom.') + 1) {
          where.push('' + attribute + " = '" + search + "'");
        } else if (attribute === 'type') {
          if (search === config.urls.types.serial.toLowerCase()) {
            where.push('`type` = 1');
            match.push('@genre ' + config.default.types.serial);
          } else if (search === config.urls.types.movie.toLowerCase()) {
            where.push('`type` != 1');
            match.push('@genre ' + config.default.types.movie);
          } else if (search === config.urls.types.multserial.toLowerCase()) {
            where.push('`type` = 1');
            match.push('@genre ' + config.default.types.mult);
          } else if (search === config.urls.types.mult.toLowerCase()) {
            where.push('`type` != 1');
            match.push('@genre ' + config.default.types.mult);
          } else if (search === config.urls.types.anime.toLowerCase()) {
            match.push('@genre ' + config.default.types.anime);
          } else if (search === config.urls.types.tv.toLowerCase()) {
            match.push('@genre ' + config.default.types.tv);
          }
        } else {
          match.push('@' + attribute + ' (' + search + ')');
        }
        if (config.default.donotuse.indexOf(attribute) + 1) {
          where.forEach(function(w, i) {
            if (w.indexOf('_vote') + 1) {
              where.splice(i, 1);
            }
          });
        }
      }
    }

    where.push("MATCH('" + match.join(' ').trim() + "')");

    return where.join(' AND ');
  }

  /**
   * The number of days to the current time.
   *
   * @param {Number} [days]
   * @return {Number}
   */

  function toDays(days) {
    days = days && parseInt(days + '') ? parseInt(days + '') : 0;
    return (
      719528 + Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)) + days
    );
  }
}

/**
 * Gets an object with new ID for diapason.
 *
 * @param {Object} [published]
 * @param {Callback} callback
 */

function publishIdsGet(published, callback) {
  if (arguments.length === 1) {
    callback = published;
    published = false;
  }

  var limit =
    config.publish.every.movies && config.publish.every.hours
      ? config.publish.every.movies /
        (config.publish.start === 298 || config.publish.stop === 3000000
          ? 1
          : 2)
      : 0;

  var start_limit = Math.ceil(limit);
  var stop_limit = Math.floor(limit);

  if ((start_limit && !stop_limit) || (!start_limit && stop_limit)) {
    start_limit = start_limit ? start_limit : 1;
    stop_limit = stop_limit ? stop_limit : 1;
  }

  if (!start_limit && !stop_limit) {
    return callback(null, null);
  }

  var startSign = published ? '>=' : '<';
  var stopSign = published ? '<=' : '>';

  var startOrder = published ? 'ASC' : 'DESC';
  var stopOrder = published ? 'DESC' : 'ASC';

  var publish = {};
  publish.where = '';

  var where = config.publish.required.length
    ? config.publish.required.map(function(ctgry) {
        return ' AND `' + ctgry.trim() + "` != '' ";
      })
    : [];
  where = where.length ? where.join(' ') : '';

  publish.where = where;

  var startQueryString =
    ' SELECT * ' +
    ' FROM ' +
    process.env['CP' + '_' + 'XML' + 'PIPE' + '2'] +
    ', ' +
    process.env['CP' + '_' + 'RT'] +
    ' WHERE kp_id ' +
    startSign +
    ' ' +
    config.publish.start +
    createWhere() +
    publish.where +
    ' ORDER BY kp_id ' +
    startOrder +
    ' LIMIT ' +
    start_limit +
    ' OPTION max_matches = ' +
    start_limit;

  var stopQueryString =
    '' +
    ' SELECT *' +
    ' FROM ' +
    process.env['CP' + '_' + 'XML' + 'PIPE' + '2'] +
    ', ' +
    process.env['CP' + '_' + 'RT'] +
    ' WHERE kp_id ' +
    stopSign +
    ' ' +
    config.publish.stop +
    createWhere() +
    publish.where +
    ' ORDER BY kp_id ' +
    stopOrder +
    ' LIMIT ' +
    stop_limit +
    ' OPTION max_matches = ' +
    stop_limit;

  var queryString = startQueryString + '; ' + stopQueryString;

  CP_sphinx.query(queryString, function(err, result) {
    if (err) return callback(err);

    if (result && result.length) {
      var ids = {};
      var i;

      ids.movies = [];
      ids.soon_id = [];
      ids.start_id = parseInt(config.publish.start + '');
      ids.stop_id = parseInt(config.publish.stop + '');

      for (i = 0; i < result[0].length; i++) {
        if (parseInt(result[0][i].kp_id) < ids.start_id && startSign === '<') {
          ids.start_id = parseInt(result[0][i].kp_id);
          ids.soon_id.push(ids.start_id);
        } else if (parseInt(result[0][i].kp_id) >= ids.start_id) {
          ids.movies.push(result[0][i]);
        }
      }

      for (i = 0; i < result[1].length; i++) {
        if (parseInt(result[1][i].kp_id) > ids.stop_id && stopSign === '>') {
          ids.stop_id = parseInt(result[1][i].kp_id);
          ids.soon_id.push(ids.stop_id);
        } else if (parseInt(result[1][i].kp_id) <= ids.stop_id) {
          ids.movies.push(result[1][i]);
        }
      }

      ids.movies = CP_structure.movie(ids.movies);

      callback(null, ids);
    } else {
      callback(null, null);
    }
  });

  /**
   * Create WHERE for query.
   *
   * @return {String}
   */

  function createWhere() {
    var thematic = CP_publish.thematic();

    var where = thematic.where_config;
    var match = thematic.match_config;

    match.push('@all_movies ' + process.env['CP' + '_' + 'SPB']);

    if (match.length) {
      where.push("MATCH('" + match.join(' ').trim() + "')");
    }

    return where.length ? ' AND ' + where.join(' AND ') : '';
  }
}

/**
 * Getting all contents for a particular query.
 *
 * @param {Object} [query]
 * @param {Number} [count]
 * @param {Number} [page]
 * @param {Boolean} [structure]
 * @param {Object} [options]
 * @param {Callback} callback
 */

function contentsGet(query, count, page, structure, options, callback) {
  if (arguments.length === 5) {
    callback = options;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  } else if (arguments.length === 4) {
    callback = structure;
    structure = true;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  } else if (arguments.length === 3) {
    callback = page;
    page = 1;
    structure = true;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  } else if (arguments.length === 2) {
    callback = count;
    count = 50;
    page = 1;
    structure = true;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  } else if (arguments.length === 1) {
    callback = query;
    query = {};
    count = 50;
    page = 1;
    structure = true;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  query = typeof query !== 'undefined' ? query : {};
  count = typeof count !== 'undefined' ? count : 50;
  page = typeof page !== 'undefined' ? page : 1;
  structure = typeof structure !== 'undefined' ? structure : true;
  options = typeof options !== 'undefined' ? options : {};
  options.domain =
    typeof options.domain !== 'undefined' ? options.domain : '' + config.domain;
  options.origin =
    typeof options.origin !== 'undefined'
      ? options.origin
      : config.protocol + '' + config.subdomain + '' + config.domain;

  var q = {};
  q._from = process.env['CP' + '_' + 'CONTENT'];
  if (query.certainly) {
    q._where = '';
    delete query.certainly;
  } else {
    q._where = createWhere() + ' ORDER BY content_publish DESC';
  }
  q._limit =
    parseInt(page + '') * parseInt(count + '') -
    parseInt(count + '') +
    ',' +
    parseInt(count + '');
  q._option =
    'max_matches = ' +
    (parseInt(page + '') * parseInt(count + '') -
      parseInt(count + '') +
      parseInt(count + ''));

  var queryString =
    ' SELECT * ' +
    (q._from ? ' FROM ' + q._from : '') +
    (q._where ? ' WHERE ' + q._where : '') +
    (q._limit ? ' LIMIT ' + q._limit : '') +
    (q._option ? ' OPTION ' + q._option : '');

  CP_sphinx.query(queryString, function(err, contents) {
    if (err) return callback(err);

    if (contents && contents.length) {
      if (structure) {
        contents = CP_structure.content(contents, options);
      }
    } else {
      contents = [];
    }

    callback(null, contents);
  });

  /**
   * Create WHERE for query.
   *
   * @return {String}
   */

  function createWhere() {
    var condition = ' ';
    if (query.condition) {
      condition = query.condition === 'OR' ? ' | ' : ' ';
      delete query.condition;
    }
    var where = [];
    var match = [];

    for (var attribute in query) {
      if (query.hasOwnProperty(attribute) && query[attribute]) {
        if (attribute === 'id') {
          where.push('`' + attribute + '` = ' + query[attribute]);
        } else if (attribute === 'content_url') {
          match.push(
            '@' + attribute + ' ("^' + CP_regexp.str(query[attribute]) + '$")'
          );
        } else {
          match.push(
            '@' + attribute + ' (' + CP_regexp.str(query[attribute]) + ')'
          );
        }
      }
    }

    where.push(
      "MATCH('@all_contents " +
        process.env['CP' + '_' + 'SPB'] +
        ' ' +
        (match.length ? '(' + match.join(condition).trim() + ')' : '') +
        "')"
    );

    return where.join(' AND ');
  }
}

/**
 * Getting all comments for a particular query.
 *
 * @param {Object} [query]
 * @param {Number} [count]
 * @param {String} [sorting]
 * @param {Number} [page]
 * @param {Object} [options]
 * @param {Callback} callback
 */

function commentsGet(query, count, sorting, page, options, callback) {
  if (arguments.length === 5) {
    callback = options;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  } else if (arguments.length === 4) {
    callback = page;
    page = 1;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  } else if (arguments.length === 3) {
    callback = sorting;
    sorting = 'comment-publish-up';
    page = 1;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  } else if (arguments.length === 2) {
    callback = count;
    count = 50;
    sorting = 'comment-publish-up';
    page = 1;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  } else if (arguments.length === 1) {
    callback = query;
    query = {};
    count = 50;
    sorting = 'comment-publish-up';
    page = 1;
    options = {};
    options.domain = config.subdomain + '' + config.domain;
    options.origin =
      config.protocol + '' + config.subdomain + '' + config.domain;
  }

  query = typeof query !== 'undefined' ? query : {};
  count = typeof count !== 'undefined' ? count : 50;
  sorting = typeof sorting !== 'undefined' ? sorting : 'comment-publish-up';
  page = typeof page !== 'undefined' ? page : 1;
  options = typeof options !== 'undefined' ? options : {};
  options.domain =
    typeof options.domain !== 'undefined' ? options.domain : '' + config.domain;
  options.origin =
    typeof options.origin !== 'undefined'
      ? options.origin
      : config.protocol + '' + config.subdomain + '' + config.domain;

  var limit_from =
    parseInt(page + '') * parseInt(count + '') - parseInt(count + '');
  limit_from = isNaN(limit_from) ? 0 : limit_from;
  var limit_to = limit_from + parseInt(count + '');
  limit_to = isNaN(limit_to) ? 0 : limit_to;

  var q = {};
  q._from = process.env['CP' + '_' + 'COMMENT'];
  if (query.certainly) {
    q._where = '';
    delete query.certainly;
  } else {
    q._where = createWhere() + ' ' + createOrderBy();
  }
  q._limit = limit_from + ',' + parseInt(count + '');
  q._option = limit_to ? 'max_matches = ' + limit_to : '';

  var queryString =
    ' SELECT * ' +
    (q._from ? ' FROM ' + q._from : '') +
    (q._where ? ' WHERE ' + q._where : '') +
    (q._limit ? ' LIMIT ' + q._limit : '') +
    (q._option ? ' OPTION ' + q._option : '');

  CP_sphinx.query(queryString, function(err, comments) {
    if (err) return callback(err);

    callback(null, comments);
  });

  /**
   * Create WHERE for query.
   *
   * @return {String}
   */

  function createWhere() {
    var condition = ' ';
    if (query.condition) {
      condition = query.condition === 'OR' ? ' | ' : ' ';
      delete query.condition;
    }
    var where = [];
    var match = [];

    match.push('@all_comments ' + process.env['CP' + '_' + 'SPB']);

    for (var attribute in query) {
      if (query.hasOwnProperty(attribute) && query[attribute]) {
        if (
          attribute === 'id' ||
          attribute === 'movie_id' ||
          attribute === 'user_id' ||
          attribute === 'reply_id' ||
          attribute === 'comment_id' ||
          attribute === 'season_id' ||
          attribute === 'episode_id' ||
          attribute === 'comment_confirm'
        ) {
          where.push('`' + attribute + '` = ' + query[attribute]);
        } else if (attribute === 'publish_gt') {
          where.push('`comment_publish` > ' + query[attribute]);
        } else if (attribute === 'publish_lt') {
          where.push('`comment_publish` < ' + query[attribute]);
        } else {
          match.push(
            '@' + attribute + ' (' + CP_regexp.str(query[attribute]) + ')'
          );
        }
      }
    }

    where.push("MATCH('" + match.join(' ').trim() + "')");

    return where.join(' AND ');
  }

  /**
   * Create ORDER BY for query.
   *
   * @return {String}
   */

  function createOrderBy() {
    var ob = '';

    switch (sorting) {
      case 'comment-like-up':
        ob = 'comment_like DESC';
        break;
      case 'comment-like-down':
        ob = 'comment_like ASC';
        break;
      case 'comment-dislike-up':
        ob = 'comment_dislike DESC';
        break;
      case 'comment-dislike-down':
        ob = 'comment_dislike ASC';
        break;
      case 'comment-publish-up':
        ob = 'comment_publish DESC';
        break;
      case 'comment-publish-down':
        ob = 'comment_publish ASC';
        break;
      default:
        ob = 'comment_publish DESC';
    }

    return ob !== '' ? ' ORDER BY ' + ob : '';
  }
}

module.exports = {
  movies: moviesGet,
  additional: additionalMoviesGet,
  count: countMoviesGet,
  publishIds: publishIdsGet,
  contents: contentsGet,
  comments: commentsGet
};
