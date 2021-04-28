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
 * Module dependencies.
 */

var CP_get = require('./CP_get');
var CP_save = require('./CP_save');

/**
 * Node dependencies.
 */

var fs = require('fs');
var path = require('path');
var os = require('os-utils');
var op = require('object-path');
var async = require('async');
var adop = require('adop');
var axios = require('axios');
var convert = require('xml-js');
var moment = require('moment');
var episode_parser = require('episode-parser');
var htmlmetaparser = require('htmlmetaparser');
var countries = require('i18n-iso-countries');
var htmlparser2 = require('htmlparser2');
var LRU = require('lru-cache');
var cache = new LRU({ max: 1000 });
var HttpsProxyAgent = require('https-proxy-agent');
var sphinx = require('sphinx');
var request = require('request');
var zlib = require('zlib');
var axiosCookieJarSupport = require('axios-cookiejar-support').default;
var tough = require('tough-cookie');
var Cookie = tough.Cookie;

axiosCookieJarSupport(axios);

var cookieJar = new tough.CookieJar();

if (config.movies.cookies) {
  try {
    var cookies = JSON.parse(config.movies.cookies);
    Object.keys(cookies).forEach(function(domain) {
      cookies[domain].forEach(function(cookie) {
        if (!cookie) return;
        if (cookie.name) {
          cookie.key = cookie.name;
        }
        if (cookie.expirationDate) {
          cookie.expires = new Date(parseInt(cookie.expirationDate) * 1000);
        }
        cookieJar.setCookie(Cookie.fromJSON(cookie), domain, function(e, c) {});
      });
    });
  } catch (e) {
    cookieJar = undefined;
    console.error(e);
  }
}

/**
 * Global env.
 */

try {
  var p = tryParseJSON(
    fs.readFileSync(
      path.join(path.dirname(__filename), '..', 'process.json'),
      'utf8'
    )
  );
  var e = p.apps[0].env;
  for (var prop in e) {
    if (e.hasOwnProperty(prop)) {
      process.env[prop] = e[prop];
    }
  }
} catch (err) {
  return console.log('NOT FILE PROCESS DATA');
}

process.env['NO_CACHE'] = true;
process.env['CP_XMLPIPE2'] = process.env['CP_RT'];

var run = process.argv && typeof process.argv[2] !== 'undefined';
var timeZone = new Date();
var hour = new Date(timeZone).getHours() + 1;
var day = parseInt(moment().dayOfYear() + '');

console.time('[REALTIME] DONE');

console.log(
  '[REALTIME]',
  new Date()
    .toJSON()
    .replace('T', ' ')
    .split('.')[0],
  '[',
  Math.ceil(os.freemem()),
  'MB ]',
  os.loadavg(1).toFixed(2),
  os.loadavg(5).toFixed(2),
  os.loadavg(15).toFixed(2)
);

if (Math.ceil(os.freemem()) < 50) {
  console.log('The server is overloaded to start get movies.');
  return process.exit(0);
}

/**
 * Get movie information.
 *
 */

(function getInfo() {
  if (!config.movies.cron || !config.movies.cron.length) return process.exit();

  var tasks = [];
  config.movies.cron.forEach(function(task) {
    var parse = task
      .replace(/(^\s*)|(\s*)$/g, '')
      .replace(/\s*~\s*/g, '~')
      .split('~');
    if (task.charAt(0) === '#') return;
    tasks.push({
      hour: parse[0] && parseInt(parse[0]) ? parseInt(parse[0]) : 0,
      page: (parse[1] || '').split('<>')[0].trim(),
      path: (parse[2] || '').split('<>')[0].trim(),
      id: parse[3] || '',
      info: parse.slice(4),
      type_id: ((parse[2] || '').split('<>')[1] || '').trim(),
      ids: [],
      additional_info: parse
        .map(function(p) {
          if (/additional_info/i.test(p)) {
            return p
              .split('<>')[0]
              .trim()
              .replace(/additional_info\.?/i, '')
              .trim();
          }
          return false;
        })
        .filter(Boolean),
      percent: ((parse[1] || '').split('<>')[1] || '').trim()
    });
  });

  if (!tasks || !tasks.length) return process.exit();

  var update_m = 0;
  var added_m = 0;

  async.eachOfLimit(
    tasks,
    1,
    function(task, task_index, callback) {
      var task_day = 1;
      if (task.hour > 24) {
        task_day = parseInt(task.hour / 24 + '');
        task.hour = task.hour - 24 * task_day;
        if (task.hour <= 12) {
          task.hour = (task.hour ? task.hour : 1) + 12;
        }
      }
      if (task_day && task_day !== 1 && day % task_day) {
        return callback();
      }
      if (task.hour && task.hour !== 1 && hour % task.hour) {
        return callback();
      }
      if (task.hour === 0 && !run) {
        return callback();
      }
      var percent_start = 0;
      var percent_stop = 100;
      if (task.percent.indexOf('-') + 1) {
        percent_start = parseInt(
          task.percent.split('-')[0].replace(/[^0-9]/g, '')
        );
        percent_stop = parseInt(
          task.percent.split('-')[1].replace(/[^0-9]/g, '')
        );
      }
      var i = 1;
      var fail_req = 5;
      var next_req = 1;
      var prev_req = 0;
      var some_req = 0;
      var retry_req = '';
      var iter_req = 0;
      var ids = cache.get(task.page + task.path + task.type_id) || [];
      var additional_info =
        cache.get('additional_info' + task.page + task.path + task.type_id) ||
        [];
      if (ids && ids.length) {
        fail_req = 0;
        next_req = 0;
      }
      var url_next = '';
      var url_next_path = '';
      var parallel_req =
        os.cpuCount() && os.cpuCount() > 2 ? os.cpuCount() - 1 : 1;
      var lastmod_stop = false;
      async.forever(
        function(next) {
          if (
            task.page === '' ||
            task.page === 'realtime' ||
            task.page === 'rt' ||
            task.page === 'database' ||
            task.page === 'db' ||
            task.page === 'xmlpipe2' ||
            task.page === 'lastmod' ||
            task.page === 'movie' ||
            task.page === 'movies' ||
            task.page === 'tv' ||
            task.page === 'lastmod_movie' ||
            task.page === 'lastmod_movies' ||
            task.page === 'lastmod_tv'
          ) {
            if (lastmod_stop) {
              return next('STOP');
            }
            var q = {};
            q.certainly = true;
            q.from =
              (task.page === 'xmlpipe2' ? 'xmlpipe2' : 'rt') +
              '_' +
              config.domain.replace(/[^a-z0-9]/g, '_');
            if (
              task.page === 'movie' ||
              task.page === 'movies' ||
              task.page === 'lastmod_movie' ||
              task.page === 'lastmod_movies'
            ) {
              q.type_movie = true;
            } else if (task.page === 'tv' || task.page === 'lastmod_tv') {
              q.type_tv = true;
            }
            CP_get.movies(
              q,
              100,
              task.page === 'lastmod' ||
                task.page === 'lastmod_movie' ||
                task.page === 'lastmod_movies' ||
                task.page === 'lastmod_tv'
                ? 'lastmod'
                : 'kinopoisk-id-up',
              i,
              false,
              function(err, rt) {
                if (ids.length && !(ids.length % 1000)) {
                  console.log('[REALTIME]', ids.length);
                }
                if (err) {
                  console.error(err);
                  return next('STOP');
                }
                if (rt && rt.length) {
                  rt.forEach(function(r) {
                    if (lastmod_stop) return;
                    if (
                      task.page === 'lastmod' ||
                      task.page === 'lastmod_movie' ||
                      task.page === 'lastmod_movies' ||
                      task.page === 'lastmod_tv'
                    ) {
                      var last_cst = {};
                      try {
                        last_cst = r.custom ? JSON.parse(r.custom) : {};
                      } catch (e) {}
                      if (last_cst && last_cst.lastmod) {
                        var l1 = new Date(last_cst.lastmod);
                        var l2 = new Date();
                        l2.setHours(l2.getHours() - 1);
                        if (l1 < l2) {
                          lastmod_stop = true;
                        }
                      }
                    }
                    if (lastmod_stop) return;
                    var id = '';
                    if (task.path.indexOf('custom.') + 1) {
                      var cst = {};
                      try {
                        cst = r.custom ? JSON.parse(r.custom) : {};
                      } catch (e) {}
                      id = op.get({ custom: cst }, task.path);
                      if (id) {
                        task.type_id = task.path;
                      }
                    } else if (!task.id) {
                      id = 0;
                      ids.push(r);
                    } else {
                      id = r['kp_id'];
                      task.type_id = 'kp_id';
                    }
                    if (id && ids.indexOf(id + '') === -1) {
                      ids.push(id + '');
                    }
                  });
                  iter_req = iter_req + ids.length;
                  ids_iteration(function() {
                    some_req = 0;
                    ids = [];
                    i++;
                    return next();
                  });
                } else {
                  return next('STOP');
                }
              }
            );
          } else if (
            task.page === 'themoviedb_movie' ||
            task.page === 'tmdb_movie' ||
            task.page === 'themoviedb_tv_series' ||
            task.page === 'tmdb_tv_series' ||
            task.page === 'themoviedb_movie_popularity' ||
            task.page === 'tmdb_movie_popularity' ||
            task.page === 'themoviedb_tv_series_popularity' ||
            task.page === 'tmdb_tv_series_popularity' ||
            task.page === 'themoviedb_movie_adult' ||
            task.page === 'tmdb_movie_adult' ||
            task.page.indexOf('files.tmdb.org/p/exports') + 1
          ) {
            var d = new Date();
            d.setDate(d.getDate() - 1);
            var dd = d.getDate();
            var mm = d.getMonth() + 1;
            var yyyy = d.getFullYear();
            if (dd < 10) {
              dd = '0' + dd;
            }
            if (mm < 10) {
              mm = '0' + mm;
            }
            var f1 = 'https://files.tmdb.org/p/exports/';
            var f2 = '_ids_' + mm + '_' + dd + '_' + yyyy + '.json.gz';
            var urls = [];
            var filter = {
              adult: false,
              popularity: 0.6
            };
            if (
              task.page === 'themoviedb_movie' ||
              task.page === 'tmdb_movie'
            ) {
              urls.push(f1 + 'movie' + f2);
            } else if (
              task.page === 'themoviedb_tv_series' ||
              task.page === 'tmdb_tv_series'
            ) {
              urls.push(f1 + 'tv_series' + f2);
            } else if (
              task.page === 'themoviedb_movie_popularity' ||
              task.page === 'tmdb_movie_popularity'
            ) {
              urls.push(f1 + 'movie' + f2);
              filter.popularity = 'all';
            } else if (
              task.page === 'themoviedb_tv_series_popularity' ||
              task.page === 'tmdb_tv_series_popularity'
            ) {
              urls.push(f1 + 'tv_series' + f2);
              filter.popularity = 'all';
            } else if (
              task.page === 'themoviedb_movie_adult' ||
              task.page === 'tmdb_movie_adult'
            ) {
              urls.push(f1 + 'movie' + f2);
              filter.adult = 'all';
            } else {
              urls.push(task.page.trim());
            }
            async.eachOfLimit(
              urls,
              1,
              function(url, id_url, callback) {
                var filter_type = 'MOVIE';
                if (url.indexOf('tv_series') + 1) {
                  filter.adult = 'all';
                  filter_type = 'TV';
                }
                console.log('[REALTIME] DOWNLOAD', url);
                request(url, { encoding: null }, function(err, response, body) {
                  if (err) return callback(err);
                  console.log('[REALTIME] GUNZIP', url);
                  zlib.gunzip(body, function(err, dezipped) {
                    if (err) return callback(err);
                    var dezipped_ids = dezipped.toString().split('\n');
                    var percent_100 = dezipped_ids.length;
                    var percent_1 = dezipped_ids.length / 100;
                    var percent_start_ids =
                      percent_start === 0
                        ? 0
                        : Math.floor(percent_start * percent_1);
                    var percent_stop_ids =
                      percent_stop === 100
                        ? percent_100
                        : Math.ceil(percent_stop * percent_1);
                    if (percent_start !== 0 || percent_stop !== 100) {
                      dezipped_ids = dezipped_ids.slice(
                        percent_start_ids,
                        percent_stop_ids
                      );
                      percent_start = 0;
                      percent_stop = 100;
                    }
                    if (filter.adult === 'all' && filter.popularity === 'all') {
                      ids = dezipped_ids
                        .map(function(id) {
                          if (!id.trim()) return false;
                          var curr = JSON.parse(id);
                          return curr.id + '';
                        })
                        .filter(Boolean);
                    } else if (filter.adult === 'all') {
                      ids = dezipped_ids
                        .map(function(id, i) {
                          if (!(i % 100000)) {
                            console.log(
                              '[REALTIME] FILTER POPULARITY',
                              filter_type,
                              i
                            );
                          }
                          if (!id.trim()) return false;
                          var curr = JSON.parse(id);
                          return curr.popularity > filter.popularity
                            ? curr.id + ''
                            : false;
                        })
                        .filter(Boolean);
                    } else if (filter.popularity === 'all') {
                      ids = dezipped_ids
                        .map(function(id, i) {
                          if (!(i % 100000)) {
                            console.log(
                              '[REALTIME] FILTER ADULT',
                              filter_type,
                              i
                            );
                          }
                          if (!id.trim()) return false;
                          var curr = JSON.parse(id);
                          return curr.adult === filter.adult
                            ? curr.id + ''
                            : false;
                        })
                        .filter(Boolean);
                    } else {
                      ids = dezipped_ids
                        .map(function(id, i) {
                          if (!id.trim()) return false;
                          var curr = JSON.parse(id);
                          if (!(i % 100000)) {
                            console.log(
                              '[REALTIME] FILTER POPULARITY AND ADULT',
                              filter_type,
                              i
                            );
                          }
                          return curr.adult === filter.adult &&
                            curr.popularity > filter.popularity
                            ? curr.id + ''
                            : false;
                        })
                        .filter(Boolean);
                    }
                    iter_req = iter_req + ids.length;
                    body = null;
                    dezipped = null;
                    ids_iteration(function() {
                      some_req = 0;
                      ids = [];
                      return callback();
                    });
                  });
                });
              },
              function(err) {
                if (err) console.error(err);
                return next('STOP');
              }
            );
          } else if (task.page.indexOf('datasets.imdbws.com') + 1) {
            console.log('[REALTIME] DOWNLOAD', task.page);
            request(task.page.trim(), { encoding: null }, function(
              err,
              response,
              body
            ) {
              if (err) {
                console.error(err);
                return next('STOP');
              }
              console.log('[REALTIME] GUNZIP', task.page);
              zlib.gunzip(body, function(err, dezipped) {
                if (err) {
                  console.error(err);
                  return next('STOP');
                }
                var unzip_data = dezipped.toString().split('\n');
                if (!unzip_data || !unzip_data.length) {
                  console.error('NOT IMDb IDs');
                  return next('STOP');
                }
                var unzip_data_name = unzip_data.shift();
                var name_keys = unzip_data_name.split('\t').map(function(item) {
                  return item.trim();
                });
                var percent_100 = unzip_data.length;
                var percent_1 = unzip_data.length / 100;
                var percent_start_ids =
                  percent_start === 0
                    ? 0
                    : Math.floor(percent_start * percent_1);
                var percent_stop_ids =
                  percent_stop === 100
                    ? percent_100
                    : Math.ceil(percent_stop * percent_1);
                var no_percent = true;
                if (percent_start !== 0 || percent_stop !== 100) {
                  unzip_data = unzip_data.slice(
                    percent_start_ids,
                    percent_stop_ids
                  );
                  percent_start = 0;
                  percent_stop = 100;
                  no_percent = false;
                }
                ids = unzip_data
                  .map(function(id, i) {
                    if (!id.trim()) return false;
                    if (!(i % 100000)) {
                      console.log('[REALTIME] IMDb IDs', i);
                    }
                    var curr = id.split('\t').map(function(item) {
                      return item.trim();
                    });
                    var res = {};
                    name_keys.forEach(function(key, i) {
                      res[key] = curr[i];
                    });
                    return res;
                  })
                  .filter(Boolean)
                  .reverse();
                if (no_percent) {
                  var imdb_ids = {};
                  var imdb_ids_page = 1;
                  async.forever(
                    function(next) {
                      var q = {};
                      q.certainly = true;
                      q.from =
                        'rt' + '_' + config.domain.replace(/[^a-z0-9]/g, '_');
                      CP_get.movies(q, 100, '', imdb_ids_page, false, function(
                        err,
                        rt
                      ) {
                        imdb_ids_page++;
                        var ids_length = Object.keys(imdb_ids).length;
                        if (ids_length && !(ids_length % 100)) {
                          console.log(
                            '[REALTIME] IMDb IDs FOR FILTER',
                            ids_length
                          );
                        }
                        if (err) {
                          console.error(err);
                          return next('STOP');
                        }
                        if (rt && rt.length) {
                          rt.forEach(function(r) {
                            var last_cst = {};
                            try {
                              last_cst = r.custom ? JSON.parse(r.custom) : {};
                            } catch (e) {}
                            if (last_cst && last_cst.imdb_id) {
                              imdb_ids['tt' + last_cst.imdb_id] = 1;
                            }
                          });
                        } else {
                          return next('STOP');
                        }
                        next();
                      });
                    },
                    function() {
                      ids = ids.filter(function(id, i) {
                        if (!(i % 100000)) {
                          console.log('[REALTIME] FILTER IMDb IDs', i);
                        }
                        return imdb_ids[id['tconst']];
                      });
                      iter_req = iter_req + ids.length;
                      body = null;
                      dezipped = null;
                      unzip_data = null;
                      ids_iteration(function() {
                        some_req = 0;
                        ids = [];
                        return next('STOP');
                      });
                    }
                  );
                } else {
                  iter_req = iter_req + ids.length;
                  body = null;
                  dezipped = null;
                  unzip_data = null;
                  ids_iteration(function() {
                    some_req = 0;
                    ids = [];
                    return next('STOP');
                  });
                }
              });
            });
          } else if (task.page === 'saved') {
            var saved = '/home/' + config.domain + '/files/saved/';
            var saved_files = fs.readdirSync(saved);
            var percent_100 = saved_files.length;
            var percent_1 = saved_files.length / 100;
            var percent_start_ids =
              percent_start === 0 ? 0 : Math.floor(percent_start * percent_1);
            var percent_stop_ids =
              percent_stop === 100
                ? percent_100
                : Math.ceil(percent_stop * percent_1);
            if (percent_start !== 0 || percent_stop !== 100) {
              saved_files = saved_files.slice(
                percent_start_ids,
                percent_stop_ids
              );
              percent_start = 0;
              percent_stop = 100;
            }
            saved_files.forEach(function(file) {
              var read_json = fs.readFileSync(saved + file, 'utf-8');
              try {
                var m = JSON.parse(read_json);
                ids.push(m);
              } catch (e) {}
            });
            iter_req = iter_req + ids.length;
            ids_iteration(function() {
              ids = [];
              return next('STOP');
            });
          } else if (/^\/[a-z0-9]/i.test(task.page)) {
            var read_json = fs.readFileSync(
              /\/home\//.test(task.page)
                ? task.page
                : '/home/' + config.domain + task.page,
              'utf-8'
            );
            try {
              var m = JSON.parse(read_json);
              ids.push(m);
            } catch (e) {}
            iter_req = iter_req + ids.length;
            ids_iteration(function() {
              ids = [];
              return next('STOP');
            });
          } else {
            if (task.page.indexOf('[page]') === -1 && i > 1) {
              console.log('[PAGE] 1');
              return next('STOP');
            }
            if (fail_req <= 0) {
              if (next_req) {
                i++;
                fail_req = 5;
                next_req = 0;
                retry_req = '';
                return next();
              }
              console.log('[FAIL] REQUEST');
              return next('STOP');
            }
            if (some_req >= 5) {
              console.log('[SOME] LENGTH');
              return next('STOP');
            }
            if (prev_req === ids.length) {
              some_req++;
            } else {
              retry_req = '';
              some_req = 0;
              prev_req = 0;
            }
            prev_req = ids.length;
            var url_req = task.page.replace('[page]', i);
            var re = /\[page]\[(.+)]/i;
            if (re.test(task.page) && !url_next_path && !url_next) {
              url_req = task.page.replace(/[a-z0-9]+=\[page]\[(.+)]/i, '');
              var url_next_path_exec = re.exec(task.page);
              if (
                url_next_path_exec &&
                url_next_path_exec.length &&
                url_next_path_exec[1]
              ) {
                if (
                  url_next_path_exec[1].replace(/[^0-9]/g, '') ===
                  url_next_path_exec[1]
                ) {
                  if (
                    i >= parseInt(url_next_path_exec[1].replace(/[^0-9]/g, ''))
                  ) {
                    console.log('[PAGE] ', i);
                    return next('STOP');
                  } else {
                    url_req = task.page.replace(/\[page]\[(.+)]/i, i);
                  }
                } else {
                  url_next_path = url_next_path_exec[1];
                }
              }
            }
            if (url_next) {
              url_req = url_next;
            }
            if (retry_req) {
              url_req =
                retry_req +
                (retry_req.indexOf('?') + 1 ? '&' : '?') +
                'clear-cache-request=' +
                Math.random()
                  .toString(36)
                  .slice(2);
            } else {
              console.log('[REALTIME]', ids.length, url_req);
            }
            var opt = {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0'
              }
            };
            if (config.movies.cookies && cookieJar) {
              opt.jar = cookieJar;
              opt.withCredentials = true;
            }
            var hostname = require('url').parse(url_req).hostname;
            var movies_proxy = '';
            if (config.movies.proxy && config.movies.proxy.length) {
              var proxies = config.movies.proxy.filter(function(p) {
                var only_proxy = p.split('<>')[0].trim();
                var only_domain = (p.split('<>')[1] || '').trim();
                if (only_domain) {
                  if (only_proxy && only_domain === hostname) {
                    return true;
                  }
                } else if (only_proxy) {
                  return true;
                }
                return false;
              });
              var proxy =
                proxies && proxies.length
                  ? proxies[Math.floor(Math.random() * proxies.length)]
                  : '';
              if (proxy) {
                var proxy_obj = {};
                if (proxy.indexOf('@') + 1) {
                  var host_auth = proxy.split('@');
                  proxy_obj['host'] = host_auth[1].split(':')[0];
                  proxy_obj['port'] = parseInt(host_auth[1].split(':')[1]);
                  proxy_obj['auth'] = host_auth[0];
                } else {
                  proxy_obj['host'] = proxy.split(':')[0];
                  proxy_obj['port'] = parseInt(proxy.split(':')[1]);
                }
                opt.httpsAgent = new HttpsProxyAgent(proxy_obj);
                movies_proxy =
                  proxy.indexOf('@') + 1 ? proxy.split('@')[1] : proxy;
              }
            }
            axios(url_req, opt)
              .then(function(r) {
                if (!r || !r.data) {
                  if (retry_req) {
                    i++;
                    retry_req = '';
                  } else {
                    retry_req = url_req;
                  }
                  console.error(
                    '[REALTIME]',
                    'STOP PAGE (' + (6 - fail_req) + ' fails)',
                    url_req,
                    movies_proxy ? 'PROXY ' + movies_proxy : ''
                  );
                  fail_req = fail_req - 1;
                  setTimeout(function() {
                    return next();
                  }, 5000);
                } else if (r.data) {
                  if (
                    typeof r.data === 'string' &&
                    r.data.indexOf('<html') + 1
                  ) {
                    if (task.path) {
                      var ids_list = r.data.match(task.path.split('<>')[0]);
                      if (ids_list && ids_list.length) {
                        ids_list.forEach(function(id) {
                          id = id.trim();
                          if (id && ids.indexOf(id) === -1) {
                            ids.push(id);
                          }
                        });
                      }
                    }
                    i++;
                    return next();
                  } else {
                    var r_data = tryParseJSON(r.data);
                    if (r_data && typeof r_data === 'object' && url_next_path) {
                      url_next = op.get(r_data, url_next_path);
                    }
                    if (r_data && (!task.id || task.id === '[url]')) {
                      if (!task.path || task.id === '[url]') {
                        if (
                          typeof r_data === 'object' &&
                          Array.isArray(r_data)
                        ) {
                          var url_100 = r_data.length;
                          var url_1 = r_data.length / 100;
                          var url_start_ids =
                            percent_start === 0
                              ? 0
                              : Math.floor(percent_start * url_1);
                          var url_stop_ids =
                            percent_stop === 100
                              ? url_100
                              : Math.ceil(percent_stop * url_1);
                          if (percent_start !== 0 || percent_stop !== 100) {
                            r_data = r_data.slice(url_start_ids, url_stop_ids);
                            percent_start = 0;
                            percent_stop = 100;
                          }
                          ids = r_data;
                          iter_req = iter_req + ids.length;
                          ids_iteration(function() {
                            some_req = 0;
                            additional_info = [];
                            ids = [];
                            i++;
                            return next();
                          });
                        } else {
                          i++;
                          return next();
                        }
                      } else {
                        var get_array = op.get(r_data, task.path);
                        if (
                          typeof get_array === 'object' &&
                          Array.isArray(get_array)
                        ) {
                          ids = get_array;
                          iter_req = iter_req + ids.length;
                          ids_iteration(function() {
                            some_req = 0;
                            additional_info = [];
                            ids = [];
                            i++;
                            return next();
                          });
                        } else {
                          i++;
                          return next();
                        }
                      }
                    } else {
                      if (
                        r_data &&
                        typeof r_data === 'object' &&
                        Array.isArray(r_data)
                      ) {
                        var percent_100 = r_data.length;
                        var percent_1 = r_data.length / 100;
                        var percent_start_ids =
                          percent_start === 0
                            ? 0
                            : Math.floor(percent_start * percent_1);
                        var percent_stop_ids =
                          percent_stop === 100
                            ? percent_100
                            : Math.ceil(percent_stop * percent_1);
                        if (percent_start !== 0 || percent_stop !== 100) {
                          r_data = r_data.slice(
                            percent_start_ids,
                            percent_stop_ids
                          );
                          percent_start = 0;
                          percent_stop = 100;
                        }
                      }
                      var r_paths = [];
                      var id_path = {
                        name: 'id',
                        path: task.path.split('<>')[0]
                      };
                      if (task.path.split('<>')[1]) {
                        id_path.type = task.path.split('<>')[1];
                      }
                      if (task.path.split('<>')[2]) {
                        id_path.regex = task.path.split('<>')[2];
                      }
                      r_paths.push(id_path);
                      task.additional_info.forEach(function(a) {
                        var last_arr = task.path
                          .split('<>')[0]
                          .trim()
                          .split('0')
                          .map(function(p) {
                            return p.replace(/(^\.*)|(\.*)$/g, '');
                          });
                        var first_path = '';
                        if (last_arr && last_arr.length > 1) {
                          last_arr.pop();
                          first_path =
                            last_arr.join('.0.').replace(/(^\.*)|(\.*)$/g, '') +
                            '.0';
                        }
                        r_paths.push({
                          name: 'additional_info.' + a,
                          path: (
                            first_path +
                            (first_path ? '.' : '') +
                            a
                          ).replace(/(^\.*)|(\.*)$/g, '')
                        });
                      });
                      var all = adop(r_data, r_paths);
                      if (all && all.length) {
                        all.forEach(function(a) {
                          if (
                            a &&
                            a.id &&
                            a.id !== 'null' &&
                            a.id !== 'false' &&
                            a.id !== 'undefined' &&
                            a.id !== 'n/a' &&
                            a.id !== 'N/A' &&
                            a.id !== '\\N' &&
                            ids.indexOf(a.id) === -1
                          ) {
                            if (
                              task.additional_info &&
                              task.additional_info.length
                            ) {
                              var new_a = {};
                              Object.keys(a).forEach(function(key) {
                                op.set(new_a, key, a[key]);
                              });
                              additional_info.push(new_a);
                            }
                            ids.push(a.id);
                          }
                        });
                        if (!ids.length) {
                          some_req = some_req + 1;
                          additional_info = [];
                          ids = [];
                          i++;
                          return next();
                        }
                        iter_req = iter_req + ids.length;
                        ids_iteration(function() {
                          some_req = 0;
                          additional_info = [];
                          ids = [];
                          i++;
                          return next();
                        });
                      } else {
                        if (retry_req) {
                          i++;
                          retry_req = '';
                        } else {
                          retry_req = url_req;
                        }
                        console.error(
                          '[REALTIME]',
                          'STOP PAGE (' + (6 - fail_req) + ' fails)',
                          url_req,
                          movies_proxy ? 'PROXY ' + movies_proxy : ''
                        );
                        fail_req = fail_req - 1;
                        setTimeout(function() {
                          return next();
                        }, 5000);
                      }
                    }
                  }
                } else {
                  return next();
                }
              })
              .catch(function(err) {
                if (retry_req) {
                  i++;
                  retry_req = '';
                } else {
                  retry_req = url_req;
                }
                console.error(
                  '[REALTIME]',
                  'STOP PAGE (' + (6 - fail_req) + ' fails)',
                  url_req,
                  (err.response && err.response.status) || err,
                  movies_proxy ? 'PROXY ' + movies_proxy : ''
                );
                fail_req = fail_req - 1;
                setTimeout(function() {
                  return next();
                }, 5000);
              });
          }
        },
        function() {
          ids_iteration(function() {
            callback();
          });
        }
      );
      function ids_iteration(callback) {
        var pool = sphinx.createPool({});
        var percent_100 = ids.length;
        var percent_1 = ids.length / 100;
        var percent_start_ids =
          percent_start === 0 ? 0 : Math.floor(percent_start * percent_1);
        var percent_stop_ids =
          percent_stop === 100
            ? percent_100
            : Math.ceil(percent_stop * percent_1);
        ids = ids.slice(percent_start_ids, percent_stop_ids);
        if (percent_start !== 0 || percent_stop !== 100) {
          ids = ids.slice(percent_start_ids, percent_stop_ids);
        }
        cache.set(task.page + task.path + task.type_id, ids);
        async.eachOfLimit(
          ids,
          parallel_req,
          function(id, id_index, callback) {
            if (!(id_index % 1000)) {
              console.log(
                '[REALTIME]',
                new Date()
                  .toJSON()
                  .replace('T', ' ')
                  .split('.')[0],
                '[',
                Math.ceil(os.freemem()),
                'MB ]',
                os.loadavg(1).toFixed(2),
                os.loadavg(5).toFixed(2),
                os.loadavg(15).toFixed(2)
              );
            }
            ids[id_index] = null;
            if (
              task.id &&
              !/\[[a-z0-9_]+?]/i.test(task.id + '') &&
              id_index >= 1
            ) {
              if (
                !(
                  task.page === '' ||
                  task.page === 'realtime' ||
                  task.page === 'rt' ||
                  task.page === 'database' ||
                  task.page === 'db' ||
                  task.page === 'xmlpipe2' ||
                  task.page === 'saved' ||
                  task.page === 'lastmod' ||
                  task.page === 'movie' ||
                  task.page === 'movies' ||
                  task.page === 'tv' ||
                  task.page === 'lastmod_movie' ||
                  task.page === 'lastmod_movies' ||
                  task.page === 'lastmod_tv'
                )
              ) {
                return callback();
              }
            }
            var task_type_id = task.type_id || '';
            var task_url =
              typeof id === 'object'
                ? ''
                : (task.id + '').replace(/\[[a-z0-9_]+?]/i, id + '');
            if (task_url) {
              var opt = {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0'
                }
              };
              if (config.movies.cookies && cookieJar) {
                opt.jar = cookieJar;
                opt.withCredentials = true;
              }
              var hostname = require('url').parse(task_url).hostname;
              var movies_proxy = '';
              var movies_captcha = '';
              if (config.movies.proxy && config.movies.proxy.length) {
                var proxies = config.movies.proxy.filter(function(p) {
                  var only_proxy = p.split('<>')[0].trim();
                  var only_domain = (p.split('<>')[1] || '').trim();
                  if (only_domain) {
                    if (only_proxy && only_domain === hostname) {
                      return true;
                    }
                  } else if (only_proxy) {
                    return true;
                  }
                  return false;
                });
                var proxy =
                  proxies && proxies.length
                    ? proxies[Math.floor(Math.random() * proxies.length)]
                    : '';
                if (proxy) {
                  var proxy_obj = {};
                  if (proxy.indexOf('@') + 1) {
                    var host_auth = proxy.split('@');
                    proxy_obj['host'] = host_auth[1].split(':')[0];
                    proxy_obj['port'] = parseInt(host_auth[1].split(':')[1]);
                    proxy_obj['auth'] = host_auth[0];
                  } else {
                    proxy_obj['host'] = proxy.split(':')[0];
                    proxy_obj['port'] = parseInt(proxy.split(':')[1]);
                  }
                  opt.httpsAgent = new HttpsProxyAgent(proxy_obj);
                  movies_proxy =
                    proxy.indexOf('@') + 1 ? proxy.split('@')[1] : proxy;
                }
              }
              axios(task_url, opt)
                .then(function(j) {
                  if (!j || !j.data) {
                    return callback();
                  }
                  if (
                    typeof j.data === 'string' &&
                    j.data.indexOf('<html') + 1
                  ) {
                    var handler = new htmlmetaparser.Handler(
                      function(err, json) {
                        if (!json || typeof json !== 'object') {
                          return callback();
                        }
                        if (
                          json &&
                          json.html &&
                          json.html.title &&
                          json.html.title === 'Ой!'
                        ) {
                          movies_captcha = 'CAPTCHA';
                          json = {};
                        }
                        movie_data(json, function() {
                          return callback();
                        });
                      },
                      { url: task_url }
                    );
                    var parser = new htmlparser2.Parser(handler, {
                      decodeEntities: true
                    });
                    parser.write(j.data);
                    parser.done();
                  } else {
                    var json = tryParseJSON(j.data);
                    if (!json || typeof json !== 'object') {
                      return callback();
                    }
                    if (task.id === '[url]') {
                      var movies_on_page = op.get(json, task.path);
                      if (Array.isArray(movies_on_page)) {
                        async.eachOfLimit(
                          movies_on_page,
                          5,
                          function(movie, id_index, callback) {
                            movie_data(movie, function() {
                              return callback();
                            });
                          },
                          function() {
                            return callback();
                          }
                        );
                      } else {
                        return callback();
                      }
                    } else {
                      if (
                        additional_info &&
                        additional_info.length &&
                        additional_info[id_index]
                      ) {
                        json = Object.assign(
                          {},
                          json,
                          additional_info[id_index]
                        );
                      }
                      movie_data(json, function() {
                        return callback();
                      });
                    }
                  }
                })
                .catch(function(err) {
                  console.log(
                    '[REALTIME]',
                    id_index + 1,
                    '/',
                    ids.length,
                    iter_req ? '[' + iter_req + ']' : '',
                    'ERROR MOVIE',
                    task_url,
                    (err.response && err.response.status) || err,
                    movies_proxy ? 'PROXY ' + movies_proxy : ''
                  );
                  return callback();
                });
            } else if (typeof id === 'object') {
              movie_data(id, function() {
                return callback();
              });
            } else {
              movie_data({}, function() {
                return callback();
              });
            }
            function movie_data(json, callback) {
              var movie = {};
              if (task_type_id) {
                if (task_type_id === 'id' || task_type_id === 'kp_id') {
                  movie['kp_id'] = id.replace(/[^0-9]/g, '');
                } else if (task_type_id.indexOf('custom.') + 1) {
                  op.set(movie, task_type_id, id.replace(/[^0-9]/g, ''));
                }
              }
              var required_arr = [];
              task.info.forEach(function(info) {
                var parse = info
                  .replace(/(^\s*)|(\s*)$/g, '')
                  .replace(/\s*<>\s*/g, '<>')
                  .split('<>');
                var sup_double = !!(
                  parse[3] &&
                  parse[3].indexOf('==') + 1 &&
                  parse[3].indexOf('!') === -1
                );
                var sup_parse =
                  parse[3] &&
                  parse[3].indexOf('=') + 1 &&
                  parse[3].indexOf('!') === -1
                    ? parse[3].indexOf('==') + 1
                      ? parse[3]
                          .replace(/(^\s*)|(\s*)$/g, '')
                          .replace(/\s*==\s*/g, '==')
                          .split('==')
                      : parse[3]
                          .replace(/(^\s*)|(\s*)$/g, '')
                          .replace(/\s*=\s*/g, '=')
                          .split('=')
                    : [];
                var sup_double_no = !!(parse[3] && parse[3].indexOf('!==') + 1);
                var sup_parse_no =
                  parse[3] &&
                  parse[3].indexOf('=') + 1 &&
                  parse[3].indexOf('!') + 1
                    ? parse[3].indexOf('!==') + 1
                      ? parse[3]
                          .replace(/(^\s*)|(\s*)$/g, '')
                          .replace(/\s*!==\s*/g, '!==')
                          .split('!==')
                      : parse[3]
                          .replace(/(^\s*)|(\s*)$/g, '')
                          .replace(/\s*!=\s*/g, '!=')
                          .split('!=')
                    : [];
                var eval_parse = parse[4] || '';
                if (parse[1] && (/^!/.test(parse[1]) || /!$/.test(parse[1]))) {
                  required_arr.push(
                    parse[1].replace(/^!+\s*/, '').replace(/\s*!+$/, '')
                  );
                }
                var set_data = '';
                var listItem;
                var oneItem = op.get(json, parse[0]);
                if (parse[0].indexOf('.0') + 1) {
                  var items = parse[0].split('.0');
                  var joinItem = items.pop().replace(/^\./, '');
                  var arrayItem = items.join('.0');
                  listItem = op.get(json, arrayItem);
                } else if (parse[0].indexOf('"') + 1) {
                  set_data = parse[0].toString().replace(/"/g, '');
                } else {
                  listItem = op.get(json, parse[0]);
                }
                if (
                  oneItem &&
                  eval_parse &&
                  eval_parse.indexOf('_OBJECT_') + 1
                ) {
                  listItem = eval(
                    eval_parse.replace(
                      /_OBJECT_/g,
                      typeof oneItem === 'object'
                        ? JSON.stringify(oneItem)
                        : typeof oneItem === 'boolean'
                        ? oneItem.toString()
                        : oneItem
                    )
                  );
                }
                if (
                  listItem &&
                  typeof listItem === 'object' &&
                  Array.isArray(listItem) &&
                  listItem.length
                ) {
                  listItem = listItem
                    .map(function(item) {
                      if (item && typeof item === 'string') {
                        return item
                          .replace(/\s+/g, ' ')
                          .replace(/(^\s*)|(\s*)$/g, '');
                      }
                      return item;
                    })
                    .filter(Boolean);
                  if (joinItem) {
                    set_data = listItem
                      .map(function(item) {
                        var set_info = false;
                        if (sup_parse[0] && sup_parse[1]) {
                          sup_parse[0] = sup_parse[0].replace(
                            /(^"*)|("*)$/g,
                            ''
                          );
                          sup_parse[1] = sup_parse[1].replace(
                            /(^"*)|("*)$/g,
                            ''
                          );
                          if (sup_double) {
                            if (
                              op.get(item, sup_parse[0]) &&
                              op
                                .get(item, sup_parse[0])
                                .toString()
                                .toLowerCase() ===
                                sup_parse[1].toString().toLowerCase()
                            ) {
                              set_info = true;
                            }
                          } else {
                            if (
                              op.get(item, sup_parse[0]) &&
                              op
                                .get(item, sup_parse[0])
                                .toString()
                                .toLowerCase()
                                .indexOf(
                                  sup_parse[1].toString().toLowerCase()
                                ) !== -1
                            ) {
                              set_info = true;
                            }
                          }
                        } else if (sup_parse_no[0] && sup_parse_no[1]) {
                          sup_parse_no[0] = sup_parse_no[0].replace(
                            /(^"*)|("*)$/g,
                            ''
                          );
                          sup_parse_no[1] = sup_parse_no[1].replace(
                            /(^"*)|("*)$/g,
                            ''
                          );
                          if (sup_double_no) {
                            if (
                              op.get(item, sup_parse_no[0]) &&
                              op
                                .get(item, sup_parse_no[0])
                                .toString()
                                .toLowerCase() !==
                                sup_parse_no[1].toString().toLowerCase()
                            ) {
                              set_info = true;
                            }
                          } else {
                            if (
                              op.get(item, sup_parse_no[0]) &&
                              op
                                .get(item, sup_parse_no[0])
                                .toString()
                                .toLowerCase()
                                .indexOf(
                                  sup_parse_no[1].toString().toLowerCase()
                                ) === -1
                            ) {
                              set_info = true;
                            }
                          }
                        } else {
                          set_info = true;
                        }
                        return set_info ? op.get(item, joinItem) : set_info;
                      })
                      .filter(Boolean)
                      .slice(
                        0,
                        (parse[2] && parseInt(parse[2])) || listItem.length
                      )
                      .join(',');
                  } else {
                    set_data = listItem
                      .slice(
                        0,
                        (parse[2] && parseInt(parse[2])) || listItem.length
                      )
                      .join(',');
                  }
                } else if (listItem) {
                  set_data = listItem.toString();
                }
                if (
                  set_data &&
                  eval_parse &&
                  eval_parse.indexOf('_VALUE_') + 1
                ) {
                  set_data = eval(eval_parse.replace(/_VALUE_/g, set_data));
                  if (typeof set_data === 'object' && Array.isArray(set_data)) {
                    set_data = set_data
                      .slice(
                        0,
                        (parse[2] && parseInt(parse[2])) || set_data.length
                      )
                      .join(',');
                  }
                }
                if (
                  set_data !== '\\N' &&
                  set_data !== 'n/a' &&
                  set_data !== 'N/A'
                ) {
                  op.set(
                    movie,
                    parse[1].replace(/^!+\s*/, '').replace(/\s*!+$/, ''),
                    set_data
                  );
                }
              });
              if (movie['custom'] && typeof movie['custom'] === 'object') {
                if (typeof movie['custom']['unique'] !== 'undefined') {
                  movie['custom']['unique'] =
                    movie['custom']['unique'] === true ||
                    movie['custom']['unique'] === 'true';
                }
                if (movie['custom']['imdb_id']) {
                  movie['custom']['imdb_id'] = movie['custom'][
                    'imdb_id'
                  ].replace(/[^0-9]/g, '');
                }
                [
                  'imdb_id',
                  'tmdb_id',
                  'douban_id',
                  'tvmaze_id',
                  'wa_id',
                  'movie_id'
                ].forEach(function(id) {
                  if (
                    typeof movie['custom'][id] !== 'undefined' &&
                    !movie['custom'][id]
                  ) {
                    delete movie['custom'][id];
                  }
                });
              } else {
                movie['custom'] = {};
              }
              if (
                movie['title_ru'] &&
                movie['title_en'] &&
                movie['title_ru'] === movie['title_en'] &&
                movie['title_ru'] !== movie['title_ru'].replace(/[^0-9]/g, '')
              ) {
                if (movie['title_en'].replace(/[^а-яё]/gi, '')) {
                  movie['title_en'] = '';
                } else {
                  movie['title_ru'] = '';
                }
              }
              if (movie['title_ru']) {
                movie['title_ru'] = decodeEntities(movie['title_ru'] + '')
                  .replace(/\n\r/g, ' ')
                  .replace(/\n/g, ' ')
                  .replace(/\r/g, ' ')
                  .replace(/\s+/g, ' ')
                  .replace(/(^\s*)|(\s*)$/g, '');
              }
              if (movie['title_en']) {
                movie['title_en'] = decodeEntities(movie['title_en'] + '')
                  .replace(/\n\r/g, ' ')
                  .replace(/\n/g, ' ')
                  .replace(/\r/g, ' ')
                  .replace(/\s+/g, ' ')
                  .replace(/(^\s*)|(\s*)$/g, '');
              }
              if (movie['description']) {
                movie['description'] = decodeEntities(movie['description'] + '')
                  .replace(/<(.|\n)*?>/g, '')
                  .replace(/\n\r/g, ' ')
                  .replace(/\n/g, ' ')
                  .replace(/\r/g, ' ')
                  .replace(/\s+/g, ' ')
                  .replace(/(^\s*)|(\s*)$/g, '');
              }
              if (movie['genre']) {
                movie['genre'] = (movie['genre'] + '').replace(/\s*&\s*/g, ',');
              }
              if (config.language === 'ru') {
                if (movie['genre']) {
                  movie['genre'] = (movie['genre'] + '').replace(
                    /\s+и\s+/g,
                    ','
                  );
                  movie['genre'] = movie['genre'].toLowerCase();
                  movie['genre'] = movie['genre'].replace('нф', 'фантастика');
                  if (!/[а-я]/i.test(movie['genre'])) {
                    movie['genre'] = '';
                  }
                }
              }
              if (config.language === 'en') {
                if (movie['genre']) {
                  movie['genre'] = movie['genre']
                    .replace(/Science Fiction/i, 'Sci-Fi')
                    .replace(/Science-Fiction/i, 'Sci-Fi')
                    .replace(/SciFi/i, 'Sci-Fi');
                  if (!/[a-z]/i.test(movie['genre'])) {
                    movie['genre'] = '';
                  }
                }
              }
              if (movie['country']) {
                movie['country'] = movie['country']
                  .split(',')
                  .map(function(country) {
                    country = (country + '').trim();
                    if (
                      country.toLowerCase() === 'us' &&
                      config.language === 'en'
                    ) {
                      return 'USA';
                    } else if (
                      country.toLowerCase() === 'ru' &&
                      config.language === 'ru'
                    ) {
                      return 'Россия';
                    } else if (
                      country.toLowerCase() === 'cn' &&
                      config.language === 'ru'
                    ) {
                      return 'Китай';
                    } else if (
                      country.toLowerCase() === 'tw' &&
                      config.language === 'ru'
                    ) {
                      return 'Тайвань';
                    } else if (
                      country &&
                      (country.length === 2 || country.length === 3) &&
                      countries.isValid(country)
                    ) {
                      return countries.getName(country, config.language);
                    } else if (country.toLowerCase() === 'su') {
                      return config.language === 'ru' ? 'СССР' : 'USSR';
                    }
                    return country;
                  })
                  .filter(Boolean)
                  .join(',');
              }
              if (movie['actor']) {
                movie['actor'] = (movie['actor'] + '')
                  .replace(/\s*,\s*/g, ',')
                  .replace(/\s+/g, ' ')
                  .replace(/(^\s*)|(\s*)$/g, '');
                var actor_arr = movie['actor'].split(',');
                movie['actor'] = actor_arr
                  .filter(function(item, pos) {
                    return actor_arr.indexOf(item) === pos;
                  })
                  .join(',');
              }
              if (movie['director']) {
                movie['director'] = (movie['director'] + '')
                  .replace(/\s*,\s*/g, ',')
                  .replace(/\s+/g, ' ')
                  .replace(/(^\s*)|(\s*)$/g, '');
                var director_arr = movie['director'].split(',');
                movie['director'] = director_arr
                  .filter(function(item, pos) {
                    return director_arr.indexOf(item) === pos;
                  })
                  .join(',');
              }
              if (movie['poster']) {
                if (
                  (movie['poster'] &&
                    movie['poster'].toLowerCase().indexOf('/st.kp.') + 1) ||
                  movie['poster'].toLowerCase().indexOf('/www.kinopoisk.ru') + 1
                ) {
                  movie['poster'] = '1';
                } else if (
                  /^.*?avatars\.mds\.yandex\.net\/(get-kinopoisk-image|get-kino-vod-films-gallery)\/([0-9]*)\/([a-z0-9\-]*)\/[0-9x_]*$/i.test(
                    movie['poster']
                  )
                ) {
                  movie['poster'] = movie['poster'].replace(
                    /^.*?avatars\.mds\.yandex\.net\/(get-kinopoisk-image|get-kino-vod-films-gallery)\/([0-9]*)\/([a-z0-9\-]*)\/[0-9x_]*$/i,
                    '/$1-$2-$3'
                  );
                } else if (
                  /^.*?media-amazon\.com\/images\/[a-z0-9]\/([a-z0-9@.,_\-]*)$/i.test(
                    movie['poster']
                  )
                ) {
                  movie['poster'] = movie['poster'].replace(
                    /^.*?media-amazon\.com\/images\/[a-z0-9]\/([a-z0-9@.,_\-]*)$/i,
                    '/$1'
                  );
                } else if (
                  /^.*?static\.tvmaze\.com\/uploads\/images\/[a-z_]*\/([0-9]*)\/([0-9]*)\.([a-z0-9]*)$/i.test(
                    movie['poster']
                  )
                ) {
                  movie['poster'] = movie['poster'].replace(
                    /^.*?static\.tvmaze\.com\/uploads\/images\/[a-z_]*\/([0-9]*)\/([0-9]*)\.([a-z0-9]*)$/i,
                    '/$1-$2.$3'
                  );
                } else if (
                  /^.*?shikimori\.one\/system\/(animes|mangas)\/([a-z0-9]+)\/([a-z0-9]+)\.([a-z0-9]+)[?0-9]*$/i.test(
                    movie['poster']
                  )
                ) {
                  movie['poster'] = movie['poster'].replace(
                    /^.*?shikimori\.one\/system\/(animes|mangas)\/([a-z0-9]+)\/([a-z0-9]+)\.([a-z0-9]+)[?0-9]*$/i,
                    '/$1-original-$3.$4'
                  );
                }
              }
              if (movie['pictures']) {
                if (
                  movie['pictures'].indexOf(
                    'shikimori.one/system/screenshots'
                  ) + 1
                ) {
                  movie['pictures'] = movie['pictures']
                    .split(',')
                    .map(function(picture) {
                      if (
                        /^.*?shikimori\.one\/system\/screenshots\/[a-z0-9]+\/([a-z0-9]+)\.([a-z0-9]+)[?0-9]*$/i.test(
                          picture.trim()
                        )
                      ) {
                        return picture
                          .trim()
                          .replace(
                            /^.*?shikimori\.one\/system\/screenshots\/[a-z0-9]+\/([a-z0-9]+)\.([a-z0-9]+)[?0-9]*$/i,
                            '/screenshots-original-$1.$2'
                          );
                      } else {
                        return false;
                      }
                    })
                    .filter(Boolean)
                    .join(',');
                }
                if (movie['pictures'].indexOf('avatars.mds.yandex.net') + 1) {
                  movie['pictures'] = movie['pictures']
                    .split(',')
                    .map(function(picture) {
                      if (
                        /^.*?avatars\.mds\.yandex\.net\/(get-kinopoisk-image|get-kino-vod-films-gallery)\/([0-9]*)\/([a-z0-9\-]*)\/[0-9x_]*$/i.test(
                          picture.trim()
                        )
                      ) {
                        return picture
                          .trim()
                          .replace(
                            /^.*?avatars\.mds\.yandex\.net\/(get-kinopoisk-image|get-kino-vod-films-gallery)\/([0-9]*)\/([a-z0-9\-]*)\/[0-9x_]*$/i,
                            '/$1-$2-$3'
                          );
                      } else {
                        return picture.trim();
                      }
                    })
                    .filter(Boolean)
                    .join(',');
                }
              }
              if (movie['rating']) {
                movie['rating'] = ('' + movie['rating']).replace(/,/g, '');
                movie['rating'] =
                  parseFloat(movie['rating']) &&
                  parseFloat(movie['rating']) < 10
                    ? parseInt(parseFloat(movie['rating']) * 10 + '')
                    : parseInt(movie['rating']);
              }
              if (movie['kp_rating']) {
                movie['kp_rating'] = ('' + movie['kp_rating']).replace(
                  /,/g,
                  ''
                );
                movie['kp_rating'] =
                  parseFloat(movie['kp_rating']) &&
                  parseFloat(movie['kp_rating']) < 10
                    ? parseInt(parseFloat(movie['kp_rating']) * 10 + '')
                    : parseInt(movie['kp_rating']);
              }
              if (movie['imdb_rating']) {
                movie['imdb_rating'] = ('' + movie['imdb_rating']).replace(
                  /,/g,
                  ''
                );
                movie['imdb_rating'] =
                  parseFloat(movie['imdb_rating']) &&
                  parseFloat(movie['imdb_rating']) < 10
                    ? parseInt(parseFloat(movie['imdb_rating']) * 10 + '')
                    : parseInt(movie['imdb_rating']);
              }
              if (movie['vote']) {
                movie['vote'] = ('' + movie['vote']).replace(/,/g, '');
                movie['vote'] = parseInt(movie['vote'] + '');
              }
              if (movie['kp_vote']) {
                movie['kp_vote'] = ('' + movie['kp_vote']).replace(/,/g, '');
                movie['kp_vote'] = parseInt(movie['kp_vote'] + '');
              }
              if (movie['imdb_vote']) {
                movie['imdb_vote'] = ('' + movie['imdb_vote']).replace(
                  /,/g,
                  ''
                );
                movie['imdb_vote'] = parseInt(movie['imdb_vote'] + '');
              }
              if (movie['premiere']) {
                if (/[0-9]{1,2}\s+[а-я]+\s+[0-9]{4}/i.test(movie['premiere'])) {
                  var p = movie['premiere'].replace(
                    /([0-9]{1,2})\s+([а-я]+)\s+([0-9]{4})/i,
                    '$3-$2-$1'
                  );
                  [
                    'января',
                    'февраля',
                    'марта',
                    'апреля',
                    'мая',
                    'июня',
                    'июля',
                    'августа',
                    'сентября',
                    'октября',
                    'ноября',
                    'декабря'
                  ].forEach(function(month, i) {
                    if (p.toLowerCase().indexOf(month) + 1) {
                      p = p.toLowerCase().replace(month, i + 1 + '');
                    }
                  });
                  p = p
                    .split('-')
                    .map(function(num) {
                      if (num && parseInt(num) < 10) {
                        num = '0' + num;
                      }
                      return num;
                    })
                    .join('-');
                  movie['premiere'] = p;
                }
                if (/[0-9]{1,2}\s+[a-z]+\s+[0-9]{4}/i.test(movie['premiere'])) {
                  var pp = movie['premiere'].replace(
                    /([0-9]{1,2})\s+([a-z]+)\s+([0-9]{4})/i,
                    '$3-$2-$1'
                  );
                  [
                    'JAN',
                    'FEB',
                    'MAR',
                    'APR',
                    'MAY',
                    'JUN',
                    'JUL',
                    'AUG',
                    'SEP',
                    'OCT',
                    'NOV',
                    'DEC'
                  ].forEach(function(month, i) {
                    if (pp.toUpperCase().indexOf(month) + 1) {
                      p = p.toUpperCase().replace(month, i + 1 + '');
                    }
                  });
                  p = p
                    .split('-')
                    .map(function(num) {
                      if (num && parseInt(num) < 10) {
                        num = '0' + num;
                      }
                      return num;
                    })
                    .join('-');
                  movie['premiere'] = p;
                }
                if (/[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}/i.test(movie['premiere'])) {
                  movie['premiere'] = movie['premiere'] + 'T00:00:00.000Z';
                }
                var year = new Date(movie['premiere']).getFullYear();
                if (!movie['year']) {
                  movie['year'] = !isNaN(year) ? year + '' : '0';
                }
                movie['premiere'] = !isNaN(year)
                  ? Math.floor(
                      new Date(movie['premiere']).getTime() /
                        1000 /
                        60 /
                        60 /
                        24 +
                        719528
                    ) + ''
                  : '0';
              }
              if (
                movie['type'] &&
                (movie['type'].toLowerCase().indexOf('1') + 1 ||
                  movie['type'].toLowerCase().indexOf('tv') + 1 ||
                  movie['type'].toLowerCase().indexOf('show') + 1 ||
                  movie['type'].toLowerCase().indexOf('ser') + 1 ||
                  movie['type'].toLowerCase().indexOf('script') + 1 ||
                  movie['type'].toLowerCase().indexOf('episode') + 1)
              ) {
                movie['type'] = 1;
              } else {
                movie['type'] = 0;
              }
              var req_id =
                (movie['kp_id'] && parseInt(movie['kp_id'])) ||
                (movie['custom'] &&
                  !movie['type'] &&
                  movie['custom']['tmdb_id'] &&
                  parseInt(movie['custom']['tmdb_id']) &&
                  parseInt(movie['custom']['tmdb_id']) + 200000000) ||
                (movie['custom'] &&
                  movie['type'] &&
                  movie['custom']['tmdb_id'] &&
                  parseInt(movie['custom']['tmdb_id']) &&
                  parseInt(movie['custom']['tmdb_id']) + 300000000) ||
                (movie['custom'] &&
                  movie['custom']['imdb_id'] &&
                  parseInt(movie['custom']['imdb_id']) &&
                  parseInt(movie['custom']['imdb_id']) + 400000000) ||
                (movie['custom'] &&
                  movie['custom']['douban_id'] &&
                  parseInt(movie['custom']['douban_id']) &&
                  parseInt(movie['custom']['douban_id']) + 600000000) ||
                (movie['custom'] &&
                  movie['custom']['wa_id'] &&
                  parseInt(movie['custom']['wa_id']) &&
                  parseInt(movie['custom']['wa_id']) + 700000000) ||
                (movie['custom'] &&
                  movie['custom']['tvmaze_id'] &&
                  parseInt(movie['custom']['tvmaze_id']) &&
                  parseInt(movie['custom']['tvmaze_id']) + 800000000) ||
                (movie['custom'] &&
                  movie['custom']['movie_id'] &&
                  parseInt(movie['custom']['movie_id']) &&
                  parseInt(movie['custom']['movie_id']) + 900000000);
              if (
                !req_id ||
                (req_id &&
                  config.movies.skip &&
                  config.movies.skip.length &&
                  config.movies.skip.indexOf(req_id + '') !== -1)
              ) {
                return callback();
              }
              var queries = [];
              if (movie['kp_id'] && parseInt(movie['kp_id'])) {
                queries.push({ id: parseInt(movie['kp_id']) + '' });
              }
              if (
                movie['custom'] &&
                movie['custom']['tmdb_id'] &&
                parseInt(movie['custom']['tmdb_id'])
              ) {
                queries.push({
                  type: movie['type'],
                  id: 'custom.tmdb_id',
                  'custom.tmdb_id':
                    movie['custom']['tmdb_id'].replace(/[^0-9]/g, '') + ''
                });
              }
              if (
                movie['custom'] &&
                movie['custom']['imdb_id'] &&
                parseInt(movie['custom']['imdb_id'])
              ) {
                queries.push({
                  id: 'custom.imdb_id',
                  'custom.imdb_id':
                    movie['custom']['imdb_id'].replace(/[^0-9]/g, '') + ''
                });
              }
              if (
                movie['custom'] &&
                movie['custom']['douban_id'] &&
                parseInt(movie['custom']['douban_id'])
              ) {
                queries.push({
                  id: 'custom.douban_id',
                  'custom.douban_id':
                    movie['custom']['douban_id'].replace(/[^0-9]/g, '') + ''
                });
              }
              if (
                movie['custom'] &&
                movie['custom']['tvmaze_id'] &&
                parseInt(movie['custom']['tvmaze_id'])
              ) {
                queries.push({
                  id: 'custom.tvmaze_id',
                  'custom.tvmaze_id':
                    movie['custom']['tvmaze_id'].replace(/[^0-9]/g, '') + ''
                });
              }
              if (
                movie['custom'] &&
                movie['custom']['wa_id'] &&
                parseInt(movie['custom']['wa_id'])
              ) {
                queries.push({
                  id: 'custom.wa_id',
                  'custom.wa_id':
                    movie['custom']['wa_id'].replace(/[^0-9]/g, '') + ''
                });
              }
              if (
                movie['custom'] &&
                movie['custom']['movie_id'] &&
                parseInt(movie['custom']['movie_id'])
              ) {
                queries.push({
                  id: 'custom.movie_id',
                  'custom.movie_id':
                    movie['custom']['movie_id'].replace(/[^0-9]/g, '') + ''
                });
              }
              var current_movie = null;
              async.eachOfLimit(
                queries,
                1,
                function(query, query_index, callback) {
                  if (current_movie) {
                    return callback('STOP');
                  }
                  var w = '';
                  if (query.id.indexOf('custom.') + 1 && query[query.id]) {
                    w = query.id + " = '" + query[query.id] + "'";
                    w += query.type
                      ? ' AND type = ' +
                        (query.type.toString() === '1' ? '1' : '0')
                      : '';
                  } else {
                    w = '`kp_id` = ' + query.id + '';
                  }
                  pool.getConnection(function(err, connection) {
                    if (err) {
                      if (typeof connection !== 'undefined' && connection) {
                        connection.release();
                      }
                      return callback();
                    }
                    connection.query(
                      'SELECT * FROM ' +
                        (task.page === 'xmlpipe2' ? 'xmlpipe2' : 'rt') +
                        '_' +
                        config.domain.replace(/[^a-z0-9]/g, '_') +
                        ' WHERE ' +
                        w +
                        ' LIMIT 0,1 OPTION max_matches = 1',
                      function(err, rt) {
                        if (task.page === 'xmlpipe2') {
                          if (err) {
                            console.error(err);
                            return callback('STOP');
                          }
                          connection.query(
                            'SELECT * FROM ' +
                              'rt' +
                              '_' +
                              config.domain.replace(/[^a-z0-9]/g, '_') +
                              ' WHERE ' +
                              w +
                              ' LIMIT 0,1 OPTION max_matches = 1',
                            function(err2, rt2) {
                              if (
                                typeof connection !== 'undefined' &&
                                connection
                              ) {
                                connection.release();
                              }
                              if (err2) {
                                console.error(err);
                                return callback('STOP');
                              }
                              if (rt2 && rt2.length) {
                                current_movie = Object.assign({}, rt2[0]);
                                return callback('STOP');
                              }
                              if (rt && rt.length) {
                                current_movie = Object.assign({}, rt[0]);
                                return callback('STOP');
                              }
                              return callback();
                            }
                          );
                        } else {
                          if (typeof connection !== 'undefined' && connection) {
                            connection.release();
                          }
                          if (err) {
                            console.error(err);
                            return callback('STOP');
                          }
                          if (rt && rt.length) {
                            current_movie = Object.assign({}, rt[0]);
                            return callback('STOP');
                          }
                          return callback();
                        }
                      }
                    );
                  });
                },
                function() {
                  if (current_movie) {
                    delete current_movie['all_movies'];
                    delete movie['all_movies'];
                    var cm = Object.assign({}, current_movie);
                    delete cm['custom'];
                    var commit_movie = JSON.stringify(
                      Object.keys(cm)
                        .sort()
                        .reduce(function(obj, key) {
                          obj[key] = cm[key];
                          return obj;
                        }, {})
                    );
                    var parse_movie = Object.assign({}, movie);
                    var custom_no_change = false;
                    Object.keys(parse_movie).forEach(function(k) {
                      if (!parse_movie[k]) {
                        delete parse_movie[k];
                      }
                    });
                    Object.keys(current_movie).forEach(function(k) {
                      if (!current_movie[k] && parse_movie[k]) {
                        delete current_movie[k];
                      }
                    });
                    if (
                      (current_movie['poster'] === '1' ||
                        current_movie['poster'] === 1 ||
                        current_movie['poster'] === '0' ||
                        current_movie['poster'] === 0) &&
                      parse_movie['poster']
                    ) {
                      delete current_movie['poster'];
                    }
                    if (
                      current_movie['quality'] &&
                      parse_movie['quality'] &&
                      current_movie['quality'] !== parse_movie['quality']
                    ) {
                      delete current_movie['quality'];
                    }
                    if (
                      current_movie['translate'] &&
                      parse_movie['translate'] &&
                      current_movie['translate'] !== parse_movie['translate']
                    ) {
                      delete current_movie['translate'];
                    }
                    var current_movie_custom = {};
                    if (current_movie.custom) {
                      if (
                        current_movie.custom &&
                        typeof current_movie.custom === 'string'
                      ) {
                        current_movie_custom = JSON.parse(current_movie.custom);
                      } else {
                        current_movie_custom = Object.assign(
                          {},
                          current_movie.custom
                        );
                      }
                    }
                    if (current_movie.custom && parse_movie.custom) {
                      var parse_movie_custom = {};
                      if (
                        parse_movie.custom &&
                        typeof parse_movie.custom === 'string'
                      ) {
                        parse_movie_custom = JSON.parse(parse_movie.custom);
                      } else {
                        parse_movie_custom = Object.assign(
                          {},
                          parse_movie.custom
                        );
                      }
                      var season = '';
                      var episode = '';
                      if (
                        /(s[0-9]+e[0-9]+|[0-9]+x[0-9]+|season|episode)/i.test(
                          parse_movie_custom['season']
                        ) &&
                        /(s[0-9]+e[0-9]+|[0-9]+x[0-9]+|season|episode)/i.test(
                          parse_movie_custom['episode']
                        )
                      ) {
                        var ps = parse_movie_custom['season'] + '' || '';
                        if (ps) {
                          if (ps.replace(/[^0-9]/g, '') === ps) {
                            season = parseInt(ps.replace(/[^0-9]/g, '')) + '';
                          }
                          if (ps.replace(/[^0-9]/g, '')) {
                            var season_ = episode_parser(ps);
                            if (
                              season_ &&
                              typeof season_.season !== 'undefined'
                            ) {
                              season = season_.season + '';
                            }
                          }
                          delete parse_movie_custom['season'];
                        }
                        var pe = parse_movie_custom['episode'] + '' || '';
                        if (pe) {
                          if (pe.replace(/[^0-9]/g, '') === pe) {
                            episode = parseInt(pe.replace(/[^0-9]/g, '')) + '';
                          }
                          if (pe.replace(/[^0-9]/g, '')) {
                            var episode_ = episode_parser(pe);
                            if (
                              episode_ &&
                              typeof episode_.episode !== 'undefined'
                            ) {
                              episode = episode_.episode + '';
                            }
                          }
                          delete parse_movie_custom['episode'];
                        }
                      } else {
                        delete parse_movie_custom['season'];
                        delete parse_movie_custom['episode'];
                      }
                      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(function(i) {
                        if (
                          current_movie_custom['player' + i] &&
                          parse_movie_custom['player' + i] &&
                          current_movie_custom['player' + i] !==
                            parse_movie_custom['player' + i]
                        ) {
                          delete current_movie_custom['player' + i];
                          if (parse_movie_custom['player' + i] === 'none') {
                            delete parse_movie_custom['player' + i];
                          }
                        }
                        if (
                          season &&
                          episode &&
                          current_movie_custom['s' + season + 'e' + episode] &&
                          current_movie_custom['s' + season + 'e' + episode][
                            'player' + i
                          ] &&
                          parse_movie_custom['player' + i]
                        ) {
                          if (
                            current_movie_custom['s' + season + 'e' + episode][
                              'player' + i
                            ] !== parse_movie_custom['player' + i]
                          ) {
                            delete current_movie_custom[
                              's' + season + 'e' + episode
                            ]['player' + i];
                            if (
                              !Object.keys(
                                current_movie_custom[
                                  's' + season + 'e' + episode
                                ]
                              ).length
                            ) {
                              delete current_movie_custom[
                                's' + season + 'e' + episode
                              ];
                            }
                            if (parse_movie_custom['player' + i] === 'none') {
                              delete parse_movie_custom['player' + i];
                            } else {
                              if (
                                typeof parse_movie_custom[
                                  's' + season + 'e' + episode
                                ] !== 'object'
                              ) {
                                parse_movie_custom[
                                  's' + season + 'e' + episode
                                ] = {};
                              }
                              parse_movie_custom['s' + season + 'e' + episode][
                                'player' + i
                              ] = parse_movie_custom['player' + i];
                              delete parse_movie_custom['player' + i];
                            }
                          } else {
                            delete parse_movie_custom['player' + i];
                          }
                        } else if (
                          season &&
                          episode &&
                          parse_movie_custom['player' + i]
                        ) {
                          if (
                            typeof parse_movie_custom[
                              's' + season + 'e' + episode
                            ] !== 'object'
                          ) {
                            parse_movie_custom[
                              's' + season + 'e' + episode
                            ] = {};
                          }
                          parse_movie_custom['s' + season + 'e' + episode][
                            'player' + i
                          ] = parse_movie_custom['player' + i];
                          delete parse_movie_custom['player' + i];
                        }
                      });
                      [
                        'imdb_id',
                        'tmdb_id',
                        'douban_id',
                        'tvmaze_id',
                        'wa_id',
                        'movie_id'
                      ].forEach(function(id) {
                        if (
                          typeof parse_movie_custom[id] !== 'undefined' &&
                          !parse_movie_custom[id]
                        ) {
                          delete parse_movie_custom[id];
                        }
                        if (
                          typeof current_movie_custom[id] !== 'undefined' &&
                          !current_movie_custom[id]
                        ) {
                          delete current_movie_custom[id];
                        }
                      });
                      if (typeof parse_movie_custom['unique'] !== 'undefined') {
                        parse_movie_custom['unique'] =
                          parse_movie_custom['unique'] === true ||
                          parse_movie_custom['unique'] === 'true';
                      }
                      if (
                        typeof current_movie_custom['unique'] !== 'undefined'
                      ) {
                        current_movie_custom['unique'] =
                          current_movie_custom['unique'] === true ||
                          current_movie_custom['unique'] === 'true';
                      }
                      if (
                        typeof parse_movie_custom['unique'] !== 'undefined' &&
                        typeof current_movie_custom['unique'] !== 'undefined' &&
                        parse_movie_custom['unique'] !==
                          current_movie_custom['unique']
                      ) {
                        delete current_movie_custom['unique'];
                      }
                      current_movie.custom = Object.assign(
                        {},
                        parse_movie_custom,
                        current_movie_custom
                      );
                      if (
                        JSON.stringify(
                          Object.keys(current_movie.custom)
                            .sort()
                            .reduce(function(obj, key) {
                              obj[key] = current_movie.custom[key];
                              return obj;
                            }, {})
                        ) ===
                        JSON.stringify(
                          Object.keys(current_movie_custom)
                            .sort()
                            .reduce(function(obj, key) {
                              obj[key] = current_movie_custom[key];
                              return obj;
                            }, {})
                        )
                      ) {
                        custom_no_change = true;
                      }
                    }
                    if (
                      typeof current_movie_custom.unique === 'undefined' ||
                      (typeof current_movie_custom.unique === 'boolean' &&
                        current_movie_custom.unique === false)
                    ) {
                      ['title_ru', 'title_en'].forEach(function(lang) {
                        if (current_movie[lang] && parse_movie[lang]) {
                          var cm = current_movie[lang]
                            .toLowerCase()
                            .replace(/\s+/g, ' ')
                            .replace(/(^\s*)|(\s*)$/g, '')
                            .replace(
                              /(['"«».,!?#№$;:&+()*%\-]+)|(\s+and\s+)/g,
                              ''
                            );
                          var pm = parse_movie[lang]
                            .toLowerCase()
                            .replace(/\s+/g, ' ')
                            .replace(/(^\s*)|(\s*)$/g, '')
                            .replace(
                              /(['"«».,!?#№$;:&+()*%\-]+)|(\s+and\s+)/g,
                              ''
                            );
                          if (cm !== pm) {
                            if (
                              !(cm.length > pm.length && cm.indexOf(pm) + 1)
                            ) {
                              delete current_movie[lang];
                            }
                          }
                        }
                      });
                      if (
                        current_movie['description'] &&
                        parse_movie['description'] &&
                        current_movie['description'] !==
                          parse_movie['description'] &&
                        current_movie['description'].length <
                          parse_movie['description'].length
                      ) {
                        delete current_movie['description'];
                      }
                    } else {
                      ['title_ru', 'title_en', 'description'].forEach(function(
                        lang
                      ) {
                        if (current_movie[lang] && parse_movie[lang]) {
                          delete parse_movie[lang];
                        }
                      });
                    }
                    var update_movie = Object.assign(
                      {},
                      parse_movie,
                      current_movie
                    );
                    [
                      ['rating', 'vote'],
                      ['kp_rating', 'kp_vote'],
                      ['imdb_rating', 'imdb_vote']
                    ].forEach(function(attr_uint) {
                      var parse_rating =
                        (typeof parse_movie[attr_uint[0]] !== 'undefined' &&
                          parse_movie[attr_uint[0]] &&
                          parseFloat(parse_movie[attr_uint[0]])) ||
                        0;
                      var current_vote =
                        (typeof current_movie[attr_uint[1]] !== 'undefined' &&
                          current_movie[attr_uint[1]] &&
                          parseFloat(current_movie[attr_uint[1]])) ||
                        0;
                      var parse_vote =
                        (typeof parse_movie[attr_uint[1]] !== 'undefined' &&
                          parse_movie[attr_uint[1]] &&
                          parseFloat(parse_movie[attr_uint[1]])) ||
                        0;
                      if (
                        !parse_vote ||
                        !current_vote ||
                        current_vote > parse_vote
                      ) {
                        return;
                      }
                      if (parse_rating && parse_rating > 100) {
                        parse_rating = 0;
                      }
                      if (!parse_rating) {
                        return;
                      }
                      if (parse_rating < 10) {
                        parse_rating = parseInt(parse_rating * 10 + '');
                      }
                      update_movie[attr_uint[0]] = parse_rating;
                      update_movie[attr_uint[1]] = parse_vote;
                    });
                    ['year', 'premiere'].forEach(function(attr_uint) {
                      var current =
                        (typeof current_movie[attr_uint] !== 'undefined' &&
                          current_movie[attr_uint] &&
                          parseFloat(current_movie[attr_uint])) ||
                        0;
                      var parse =
                        (typeof parse_movie[attr_uint] !== 'undefined' &&
                          parse_movie[attr_uint] &&
                          parseFloat(parse_movie[attr_uint])) ||
                        0;
                      if (attr_uint === 'year' || attr_uint === 'premiere') {
                        parse = parseInt(parse + '');
                      }
                      if (parse > current) {
                        update_movie[attr_uint] = parseInt(parse);
                      }
                      if (
                        attr_uint === 'year' &&
                        typeof update_movie['year'] !== 'undefined'
                      ) {
                        update_movie['year'] = update_movie['year'] + '';
                      }
                    });
                    ['country', 'director', 'genre', 'actor'].forEach(function(
                      attr_string
                    ) {
                      var parse =
                        (typeof parse_movie[attr_string] !== 'undefined' &&
                          parse_movie[attr_string]) ||
                        '';
                      var current = (
                        (typeof current_movie[attr_string] !== 'undefined' &&
                          current_movie[attr_string]) ||
                        ''
                      ).replace('_empty', '');
                      if (parse.length > current.length) {
                        update_movie[attr_string] = parse_movie[attr_string];
                      }
                    });
                    var cm2 = Object.assign({}, update_movie);
                    delete cm2['custom'];
                    var commit_movie2 = JSON.stringify(
                      Object.keys(cm2)
                        .sort()
                        .reduce(function(obj, key) {
                          obj[key] = cm2[key];
                          return obj;
                        }, {})
                    );
                    if (custom_no_change && commit_movie === commit_movie2) {
                      console.log(
                        '[REALTIME]',
                        id_index + 1,
                        '/',
                        ids.length,
                        iter_req ? '[' + iter_req + ']' : '',
                        'NO UPDATE',
                        current_movie.id,
                        movies_proxy ? 'PROXY ' + movies_proxy : '',
                        movies_captcha || ''
                      );
                      return callback();
                    }
                    if (required_arr && required_arr.length) {
                      var required_update = [];
                      required_arr.forEach(function(r) {
                        if (!op.get(update_movie, r)) {
                          required_update.push(r);
                        }
                      });
                      if (required_update.length) {
                        console.log(
                          '[REALTIME]',
                          id_index + 1,
                          '/',
                          ids.length,
                          iter_req ? '[' + iter_req + ']' : '',
                          'NO UPDATE REQUIRED',
                          required_update.join(' | '),
                          current_movie.id,
                          movies_proxy ? 'PROXY ' + movies_proxy : ''
                        );
                        return callback();
                      }
                    }
                    console.log(
                      '[REALTIME]',
                      id_index + 1,
                      '/',
                      ids.length,
                      iter_req ? '[' + iter_req + ']' : '',
                      'UPDATE MOVIE',
                      current_movie.id,
                      movies_proxy ? 'PROXY ' + movies_proxy : ''
                    );
                    console.log(update_movie);
                    CP_save.save(update_movie, 'rt', function(err, result) {
                      update_m++;
                      if (err) console.log(err);
                      return callback(err);
                    });
                  } else {
                    if (config.movies.id && !op.get(movie, config.movies.id)) {
                      console.log(
                        '[REALTIME]',
                        id_index + 1,
                        '/',
                        ids.length,
                        iter_req ? '[' + iter_req + ']' : '',
                        'NO ' + config.movies.id,
                        req_id,
                        movies_proxy ? 'PROXY ' + movies_proxy : ''
                      );
                      return callback();
                    }
                    if (!movie['title_ru'] && !movie['title_en']) {
                      console.log(
                        '[REALTIME]',
                        id_index + 1,
                        '/',
                        ids.length,
                        iter_req ? '[' + iter_req + ']' : '',
                        'NO SAVE',
                        req_id,
                        movies_proxy ? 'PROXY ' + movies_proxy : ''
                      );
                      return callback();
                    }
                    if (required_arr && required_arr.length) {
                      var required_save = [];
                      required_arr.forEach(function(r) {
                        if (!op.get(movie, r)) {
                          required_save.push(r);
                        }
                      });
                      if (required_save.length) {
                        console.log(
                          '[REALTIME]',
                          id_index + 1,
                          '/',
                          ids.length,
                          iter_req ? '[' + iter_req + ']' : '',
                          'NO SAVE REQUIRED',
                          required_save.join(' | '),
                          req_id,
                          movies_proxy ? 'PROXY ' + movies_proxy : ''
                        );
                        return callback();
                      }
                    }
                    console.log(
                      '[REALTIME]',
                      id_index + 1,
                      '/',
                      ids.length,
                      iter_req ? '[' + iter_req + ']' : '',
                      'SAVE MOVIE',
                      req_id,
                      movies_proxy ? 'PROXY ' + movies_proxy : ''
                    );
                    console.log(movie);
                    CP_save.save(movie, 'rt', function(err, result) {
                      added_m++;
                      if (err) console.log(err);
                      return callback(err);
                    });
                  }
                }
              );
            }
          },
          function() {
            console.log('[REALTIME]', 'ADDED:', added_m);
            console.log('[REALTIME]', 'UPDATE:', update_m);
            return callback();
          }
        );
      }
    },
    function() {
      process.env['NO_CACHE'] = undefined;
      request(
        'http://localhost:3000/flush-cache-' + config.urls.admin,
        function(error, response, body) {
          if (error || body !== 'OK') {
            console.error('[REALTIME] FLUSH ERROR', error);
            return process.exit(0);
          }
          console.log(
            '[REALTIME]',
            new Date()
              .toJSON()
              .replace('T', ' ')
              .split('.')[0],
            '[',
            Math.ceil(os.freemem()),
            'MB ]',
            os.loadavg(1).toFixed(2),
            os.loadavg(5).toFixed(2),
            os.loadavg(15).toFixed(2)
          );
          console.timeEnd('[REALTIME] DONE');
          return process.exit(0);
        }
      );
    }
  );
})();

/**
 * Valid JSON.
 *
 */

function tryParseJSON(jsonString) {
  try {
    if (jsonString && typeof jsonString === 'string') {
      if (jsonString.indexOf('<?xml') + 1) {
        var result = convert.xml2js(jsonString, { compact: true });
        if (result && typeof result === 'object') {
          return result;
        }
      }
      var o = JSON.parse(jsonString);
      if (o && typeof o === 'object') {
        return o;
      }
    } else {
      if (jsonString && typeof jsonString === 'object') {
        return jsonString;
      }
    }
  } catch (e) {}
  return null;
}

/**
 * Decode entities.
 *
 */

function decodeEntities(encodedString) {
  var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
  var translate = {
    nbsp: ' ',
    amp: '&',
    quot: '"',
    lt: '<',
    gt: '>'
  };
  return encodedString
    .replace(translate_re, function(match, entity) {
      return translate[entity];
    })
    .replace(/&#(\d+);/gi, function(match, numStr) {
      var num = parseInt(numStr, 10);
      return String.fromCharCode(num);
    });
}
