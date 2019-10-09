'use strict';

/**
 * Node dependencies.
 */

var exec = require('child_process').exec;
var request = require('request');
var sinoni = require('sinoni');
var async = require('async');
var path = require('path');
var fs = require('fs');
var Imap = require('imap');
var MP = require('mailparser').MailParser;

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

/**
 * Module dependencies.
 */

var CP_get = require('./CP_get.min');
var CP_save = require('./CP_save.min');
var CP_cache = require('./CP_cache');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
var modules = require('../config/production/modules');

/**
 * Route dependencies.
 */

var movie = require('../routes/paths/movie');

var hour = new Date().getHours() + 1;

var active = {
  num: 0,
  process: {}
};

/**
 * Added new movie from website.
 */

if (hour && modules.content.status && modules.content.data.scraper) {
  active.num++;
  active.process.scraper = true;

  var agents = [
    'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; LCJB; rv:11.0) like Gecko',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
    'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/534.57.2 (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 YaBrowser/16.10.1.1114 Yowser/2.5 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36 OPR/41.0.2353.69',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2906.0 Safari/537.36 OPR/43.0.2423.0 (Edition developer)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.100 Safari/537.36 Vivaldi/1.5.676.6',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.82 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:50.0) Gecko/20100101 Firefox/50.0'
  ];
  var parsers = modules.content.data.scraper.split('\n');
  async.eachOfLimit(
    parsers,
    1,
    function(parser, ii, callback) {
      var parse = parser.split('~');
      if (parse.length === 5) {
        var p = {
          every: parseInt(parse[0]),
          url: parse[1],
          regex_url: parse[2],
          regex_id: parse[3],
          collection: parse[4]
        };
        if (!(hour % p.every)) {
          request(
            {
              url: p.url,
              method: 'GET',
              timeout: 1000,
              headers: {
                'User-Agent': agents[Math.floor(Math.random() * agents.length)]
              }
            },
            function(error, response, html) {
              if (error || !html) {
                console.log(parser, error.code, html);
                return callback();
              }
              var urls = [];
              var mvs = [];
              var ids = [];
              if (p.regex_url) {
                var regex_url = new RegExp(p.regex_url, 'ig');
                var u;
                while ((u = regex_url.exec(html)) !== null) {
                  if (u[1]) {
                    if (/^http|^\/\//i.test(u[1])) {
                      urls.push(u[1]);
                    } else {
                      var domain = /([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+)/i.exec(
                        p.url
                      );
                      if (domain !== null && domain[1]) {
                        urls.push('http://' + domain[1] + u[1]);
                      }
                    }
                  }
                }
              }
              if (!urls.length) urls.push(p.url);
              async.eachOfLimit(
                urls,
                1,
                function(url, i, callback) {
                  request(
                    {
                      url: url,
                      method: 'GET',
                      timeout: 1000,
                      headers: {
                        'User-Agent':
                          agents[Math.floor(Math.random() * agents.length)]
                      }
                    },
                    function(error, response, html) {
                      if (error || !html) {
                        console.log(parser, error.code, html);
                        return callback();
                      }
                      var regex_id = new RegExp(p.regex_id, 'ig');
                      var found;
                      while ((found = regex_id.exec(html)) !== null) {
                        if (found[1] && !(ids.indexOf(found[1]) + 1)) {
                          ids.push(found[1]);
                          mvs.push({ kinopoisk_id: found[1] });
                        }
                      }
                      callback();
                    }
                  );
                },
                function(err) {
                  if (err) console.error(err);
                  saveContent(p.collection, mvs, false, function() {});
                  callback();
                }
              );
            }
          );
        } else {
          callback();
        }
      } else {
        callback();
      }
    },
    function(err) {
      if (err) console.error(err);
      active.num--;
      active.process.scraper = true;
    }
  );
}

/**
 * Added new movie ids.
 */

if (
  hour &&
  modules.content.status &&
  (modules.player.data.moonwalk.token ||
    modules.player.data.iframe.token ||
    modules.player.data.hdgo.token ||
    modules.player.data.kodik.token) &&
  [
    'kodik_movies',
    'kodik_serials',
    'hdgo_movies',
    'hdgo_serials',
    'moonwalk_movies',
    'moonwalk_serials',
    'iframe_movies',
    'iframe_serials'
  ].filter(function(k) {
    return (
      modules.content.data.auto[k] &&
      modules.content.data.auto[k].url &&
      modules.content.data.auto[k].count
    );
  }).length
) {
  active.num++;
  active.num++;

  active.process.content = true;

  var keys = {
    kodik_movies: [
      'https://kodikapi.com/list?token=[token]&types=foreign-movie,soviet-cartoon,foreign-cartoon,russian-cartoon,anime,russian-movie'
    ],
    kodik_serials: [
      'https://kodikapi.com/list?token=[token]&types=cartoon-serial,documentary-serial,russian-serial,foreign-serial,anime-serial,multi-part-film,russian-documentary-serial,russian-cartoon-serial'
    ],
    hdgo_movies: ['http://hdgo.cc/api/movies.json?token=[token]'],
    hdgo_serials: ['http://hdgo.cc/api/movies.json?token=[token]'],
    moonwalk_movies: [
      'http://moonwalk.cc/api/movies_updates.json?api_token=[token]',
      'http://moonwalk.cc/api/movies_updates.json?api_token=[token]&category=Russian',
      'http://moonwalk.cc/api/movies_updates.json?api_token=[token]&category=CamRip',
      'http://moonwalk.cc/api/movies_updates.json?api_token=[token]&category=Anime'
    ],
    moonwalk_serials: [
      'http://moonwalk.cc/api/serials_updates.json?api_token=[token]',
      'http://moonwalk.cc/api/serials_updates.json?api_token=[token]&category=Russian',
      'http://moonwalk.cc/api/serials_updates.json?api_token=[token]&category=Anime'
    ],
    iframe_movies: [
      'https://iframe.video/api/movies_updates.json?api_token=[token]'
    ],
    iframe_serials: [
      'https://iframe.video/api/serials_updates.json?api_token=[token]'
    ]
  };

  var all_movies = [];
  var all_serials = [];

  async.eachOfLimit(
    keys,
    1,
    function(arr, key, callback) {
      if (
        !modules.content.data.auto[key] ||
        !modules.content.data.auto[key].url ||
        !modules.content.data.auto[key].count
      ) {
        return callback();
      }
      var ids = [];
      var mvs = [];
      if (key === 'moonwalk_movies' && modules.player.data.moonwalk.token) {
        async.eachOf(
          arr,
          function(url, id, callback) {
            url = url.replace(
              '[token]',
              modules.player.data.moonwalk.token.trim()
            );
            request({ url: url, method: 'GET', timeout: 1000 }, function(
              error,
              response,
              movies
            ) {
              if (error) {
                console.log('moonwalk_movies', error.code);
                return callback();
              }
              movies = tryParseJSON(movies);
              if (
                response.statusCode === 200 &&
                movies &&
                movies.updates &&
                movies.updates.length
              ) {
                movies.updates.forEach(function(movie) {
                  if (
                    movie &&
                    movie.kinopoisk_id &&
                    parseInt(movie.kinopoisk_id)
                  ) {
                    movie.kinopoisk_id = parseInt(movie.kinopoisk_id);
                    if (
                      movie.kinopoisk_id &&
                      !(ids.indexOf(movie.kinopoisk_id) + 1)
                    ) {
                      ids.push(movie.kinopoisk_id);
                      mvs.push({
                        kinopoisk_id: movie.kinopoisk_id,
                        added_at: movie.added_at,
                        quality:
                          movie.source_type &&
                          modules.content.data.auto[key].quality
                            ? movie.source_type
                            : '',
                        translate:
                          movie.translator &&
                          modules.content.data.auto[key].translate
                            ? movie.translator
                            : ''
                      });
                    }
                  }
                });
              }
              callback();
            });
          },
          function(err) {
            if (err) console.error(err);
            mvs.sort(function(a, b) {
              return new Date(b.added_at) - new Date(a.added_at);
            });
            mvs = mvs.slice(0, parseInt(modules.content.data.auto[key].count));
            all_movies = all_movies.concat(mvs);
            saveContent(key, mvs, false, function() {
              callback();
            });
          }
        );
      } else if (
        key === 'moonwalk_serials' &&
        modules.player.data.moonwalk.token
      ) {
        async.eachOf(
          arr,
          function(url, id, callback) {
            url = url.replace(
              '[token]',
              modules.player.data.moonwalk.token.trim()
            );
            request({ url: url, method: 'GET', timeout: 1000 }, function(
              error,
              response,
              movies
            ) {
              if (error) {
                console.log('moonwalk_serials', error.code);
                return callback();
              }
              movies = tryParseJSON(movies);
              if (
                response.statusCode === 200 &&
                movies &&
                movies.updates &&
                movies.updates.length
              ) {
                movies.updates.forEach(function(movie) {
                  if (
                    movie &&
                    movie.serial &&
                    movie.serial.kinopoisk_id &&
                    parseInt(movie.serial.kinopoisk_id)
                  ) {
                    movie.serial.kinopoisk_id = parseInt(
                      movie.serial.kinopoisk_id
                    );
                    if (
                      movie.serial.kinopoisk_id &&
                      !(ids.indexOf(movie.serial.kinopoisk_id) + 1)
                    ) {
                      ids.push(movie.serial.kinopoisk_id);
                      mvs.push({
                        kinopoisk_id: movie.serial.kinopoisk_id,
                        added_at: movie.added_at,
                        quality:
                          movie.source_type &&
                          modules.content.data.auto[key].quality
                            ? movie.source_type
                            : '',
                        translate:
                          movie.translator &&
                          modules.content.data.auto[key].translate
                            ? movie.translator
                            : ''
                      });
                    }
                  }
                });
              }
              callback();
            });
          },
          function(err) {
            if (err) console.error(err);
            mvs.sort(function(a, b) {
              return new Date(b.added_at) - new Date(a.added_at);
            });
            mvs = mvs.slice(0, parseInt(modules.content.data.auto[key].count));
            all_serials = all_serials.concat(mvs);
            saveContent(key, mvs, false, function() {
              callback();
            });
          }
        );
      } else if (key === 'iframe_movies' && modules.player.data.iframe.token) {
        async.eachOf(
          arr,
          function(url, id, callback) {
            url = url.replace(
              '[token]',
              modules.player.data.iframe.token.trim()
            );
            request({ url: url, method: 'GET', timeout: 1000 }, function(
              error,
              response,
              movies
            ) {
              if (error) {
                console.log('iframe_movies', error.code);
                return callback();
              }
              movies = tryParseJSON(movies);
              if (
                response.statusCode === 200 &&
                movies &&
                movies.updates &&
                movies.updates.length
              ) {
                movies.updates.forEach(function(movie) {
                  if (
                    movie &&
                    movie.kinopoisk_id &&
                    parseInt(movie.kinopoisk_id)
                  ) {
                    movie.kinopoisk_id = parseInt(movie.kinopoisk_id);
                    if (
                      movie.kinopoisk_id &&
                      !(ids.indexOf(movie.kinopoisk_id) + 1)
                    ) {
                      ids.push(movie.kinopoisk_id);
                      mvs.push({
                        kinopoisk_id: movie.kinopoisk_id,
                        added_at: movie.added_at,
                        quality:
                          movie.source_type &&
                          modules.content.data.auto[key].quality
                            ? movie.source_type
                            : '',
                        translate:
                          movie.translator &&
                          modules.content.data.auto[key].translate
                            ? movie.translator
                            : ''
                      });
                    }
                  }
                });
              }
              callback();
            });
          },
          function(err) {
            if (err) console.error(err);
            mvs.sort(function(a, b) {
              return new Date(b.added_at) - new Date(a.added_at);
            });
            mvs = mvs.slice(0, parseInt(modules.content.data.auto[key].count));
            all_movies = all_movies.concat(mvs);
            saveContent(key, mvs, false, function() {
              callback();
            });
          }
        );
      } else if (key === 'iframe_serials' && modules.player.data.iframe.token) {
        async.eachOf(
          arr,
          function(url, id, callback) {
            url = url.replace(
              '[token]',
              modules.player.data.iframe.token.trim()
            );
            request({ url: url, method: 'GET', timeout: 1000 }, function(
              error,
              response,
              movies
            ) {
              if (error) {
                console.log('iframe_serials', error.code);
                return callback();
              }
              movies = tryParseJSON(movies);
              if (
                response.statusCode === 200 &&
                movies &&
                movies.updates &&
                movies.updates.length
              ) {
                movies.updates.forEach(function(movie) {
                  if (
                    movie &&
                    movie.serial &&
                    movie.serial.kinopoisk_id &&
                    parseInt(movie.serial.kinopoisk_id)
                  ) {
                    movie.serial.kinopoisk_id = parseInt(
                      movie.serial.kinopoisk_id
                    );
                    if (
                      movie.serial.kinopoisk_id &&
                      !(ids.indexOf(movie.serial.kinopoisk_id) + 1)
                    ) {
                      ids.push(movie.serial.kinopoisk_id);
                      mvs.push({
                        kinopoisk_id: movie.serial.kinopoisk_id,
                        added_at: movie.added_at,
                        quality:
                          movie.source_type &&
                          modules.content.data.auto[key].quality
                            ? movie.source_type
                            : '',
                        translate:
                          movie.translator &&
                          modules.content.data.auto[key].translate
                            ? movie.translator
                            : ''
                      });
                    }
                  }
                });
              }
              callback();
            });
          },
          function(err) {
            if (err) console.error(err);
            mvs.sort(function(a, b) {
              return new Date(b.added_at) - new Date(a.added_at);
            });
            mvs = mvs.slice(0, parseInt(modules.content.data.auto[key].count));
            all_serials = all_serials.concat(mvs);
            saveContent(key, mvs, false, function() {
              callback();
            });
          }
        );
      } else if (key === 'hdgo_movies' && modules.player.data.hdgo.token) {
        async.eachOf(
          arr,
          function(url, id, callback) {
            url = url.replace('[token]', modules.player.data.hdgo.token.trim());
            request({ url: url, method: 'GET', timeout: 15000 }, function(
              error,
              response,
              movies
            ) {
              if (error) {
                console.log('hdgo_movies', error.code);
                return callback();
              }
              movies = tryParseJSON(movies);
              if (response.statusCode === 200 && movies && movies.length) {
                movies.forEach(function(movie) {
                  if (
                    movie &&
                    movie.type === 'movie' &&
                    movie.kinopoisk_id &&
                    parseInt(movie.kinopoisk_id)
                  ) {
                    movie.kinopoisk_id = parseInt(movie.kinopoisk_id);
                    if (
                      movie.kinopoisk_id &&
                      !(ids.indexOf(movie.kinopoisk_id) + 1)
                    ) {
                      ids.push(movie.kinopoisk_id);
                      mvs.push({
                        kinopoisk_id: movie.kinopoisk_id,
                        added_at: movie.added_at,
                        quality:
                          movie.quality &&
                          modules.content.data.auto[key].quality
                            ? movie.quality
                            : '',
                        translate:
                          movie.translator &&
                          modules.content.data.auto[key].translate
                            ? movie.translator
                            : ''
                      });
                    }
                  }
                });
              }
              callback();
            });
          },
          function(err) {
            if (err) console.error(err);
            mvs.sort(function(a, b) {
              return new Date(b.added_at) - new Date(a.added_at);
            });
            mvs = mvs.slice(0, parseInt(modules.content.data.auto[key].count));
            all_movies = all_movies.concat(mvs);
            saveContent(key, mvs, false, function() {
              callback();
            });
          }
        );
      } else if (key === 'hdgo_serials' && modules.player.data.hdgo.token) {
        async.eachOf(
          arr,
          function(url, id, callback) {
            url = url.replace('[token]', modules.player.data.hdgo.token.trim());
            request({ url: url, method: 'GET', timeout: 15000 }, function(
              error,
              response,
              movies
            ) {
              if (error) {
                console.log('hdgo_serials', error.code);
                return callback();
              }
              movies = tryParseJSON(movies);
              if (response.statusCode === 200 && movies && movies.length) {
                movies.forEach(function(movie) {
                  if (
                    movie &&
                    movie.type === 'serial' &&
                    movie.kinopoisk_id &&
                    parseInt(movie.kinopoisk_id)
                  ) {
                    movie.kinopoisk_id = parseInt(movie.kinopoisk_id);
                    if (
                      movie.kinopoisk_id &&
                      !(ids.indexOf(movie.kinopoisk_id) + 1)
                    ) {
                      ids.push(movie.kinopoisk_id);
                      mvs.push({
                        kinopoisk_id: movie.kinopoisk_id,
                        added_at: movie.added_at,
                        quality:
                          movie.quality &&
                          modules.content.data.auto[key].quality
                            ? movie.quality
                            : '',
                        translate:
                          movie.translator &&
                          modules.content.data.auto[key].translate
                            ? movie.translator
                            : ''
                      });
                    }
                  }
                });
              }
              callback();
            });
          },
          function(err) {
            if (err) console.error(err);
            mvs.sort(function(a, b) {
              return new Date(b.added_at) - new Date(a.added_at);
            });
            mvs = mvs.slice(0, parseInt(modules.content.data.auto[key].count));
            all_serials = all_serials.concat(mvs);
            saveContent(key, mvs, false, function() {
              callback();
            });
          }
        );
      } else if (key === 'kodik_movies' && modules.player.data.kodik.token) {
        async.eachOf(
          arr,
          function(url, id, callback) {
            url = url.replace(
              '[token]',
              modules.player.data.kodik.token.trim()
            );
            request({ url: url, method: 'GET', timeout: 2000 }, function(
              error,
              response,
              movies
            ) {
              if (error) {
                console.log('kodik_movies', error.code);
                return callback();
              }
              movies = tryParseJSON(movies);
              if (
                response.statusCode === 200 &&
                movies.results &&
                movies.results.length
              ) {
                movies.results.forEach(function(movie) {
                  if (
                    movie &&
                    movie.kinopoisk_id &&
                    parseInt(movie.kinopoisk_id)
                  ) {
                    movie.kinopoisk_id = parseInt(movie.kinopoisk_id);
                    if (
                      movie.kinopoisk_id &&
                      !(ids.indexOf(movie.kinopoisk_id) + 1)
                    ) {
                      ids.push(movie.kinopoisk_id);
                      mvs.push({
                        kinopoisk_id: movie.kinopoisk_id,
                        added_at: movie.updated_at,
                        quality:
                          movie.quality &&
                          modules.content.data.auto[key].quality
                            ? movie.quality
                            : '',
                        translate:
                          movie.translation &&
                          movie.translation[0] &&
                          movie.translation[0].title &&
                          modules.content.data.auto[key].translate
                            ? movie.translation[0].title
                            : ''
                      });
                    }
                  }
                });
              }
              callback();
            });
          },
          function(err) {
            if (err) console.error(err);
            mvs.sort(function(a, b) {
              return new Date(b.added_at) - new Date(a.added_at);
            });
            mvs = mvs.slice(0, parseInt(modules.content.data.auto[key].count));
            all_movies = all_movies.concat(mvs);
            saveContent(key, mvs, false, function() {
              callback();
            });
          }
        );
      } else if (key === 'kodik_serials' && modules.player.data.kodik.token) {
        async.eachOf(
          arr,
          function(url, id, callback) {
            url = url.replace(
              '[token]',
              modules.player.data.kodik.token.trim()
            );
            request({ url: url, method: 'GET', timeout: 2000 }, function(
              error,
              response,
              movies
            ) {
              if (error) {
                console.log('kodik_serials', error.code);
                return callback();
              }
              movies = tryParseJSON(movies);
              if (
                response.statusCode === 200 &&
                movies.results &&
                movies.results.length
              ) {
                movies.results.forEach(function(movie) {
                  if (
                    movie &&
                    movie.kinopoisk_id &&
                    parseInt(movie.kinopoisk_id)
                  ) {
                    movie.kinopoisk_id = parseInt(movie.kinopoisk_id);
                    if (
                      movie.kinopoisk_id &&
                      !(ids.indexOf(movie.kinopoisk_id) + 1)
                    ) {
                      ids.push(movie.kinopoisk_id);
                      mvs.push({
                        kinopoisk_id: movie.kinopoisk_id,
                        added_at: movie.updated_at,
                        quality:
                          movie.quality &&
                          modules.content.data.auto[key].quality
                            ? movie.quality
                            : '',
                        translate:
                          movie.translation &&
                          movie.translation[0] &&
                          movie.translation[0].title &&
                          modules.content.data.auto[key].translate
                            ? movie.translation[0].title
                            : ''
                      });
                    }
                  }
                });
              }
              callback();
            });
          },
          function(err) {
            if (err) console.error(err);
            mvs.sort(function(a, b) {
              return new Date(b.added_at) - new Date(a.added_at);
            });
            mvs = mvs.slice(0, parseInt(modules.content.data.auto[key].count));
            all_serials = all_serials.concat(mvs);
            saveContent(key, mvs, false, function() {
              callback();
            });
          }
        );
      } else {
        callback();
      }
    },
    function(err) {
      if (err) console.error(err);

      var m = [
        modules.content.data.auto.moonwalk_movies
          ? modules.content.data.auto.moonwalk_movies.url
          : '',
        modules.content.data.auto.hdgo_movies
          ? modules.content.data.auto.hdgo_movies.url
          : '',
        modules.content.data.auto.kodik_movies
          ? modules.content.data.auto.kodik_movies.url
          : '',
        modules.content.data.auto.iframe_movies
          ? modules.content.data.auto.iframe_movies.url
          : ''
      ];
      var s = [
        modules.content.data.auto.moonwalk_serials
          ? modules.content.data.auto.moonwalk_serials.url
          : '',
        modules.content.data.auto.hdgo_serials
          ? modules.content.data.auto.hdgo_serials.url
          : '',
        modules.content.data.auto.kodik_serials
          ? modules.content.data.auto.kodik_serials.url
          : '',
        modules.content.data.auto.iframe_serials
          ? modules.content.data.auto.iframe_serials.url
          : ''
      ];
      var a = s.concat(m);

      var mov = m.filter(urlUnique);
      var ser = s.filter(urlUnique);
      var all = a.filter(urlUnique);

      if (all.length === 1) {
        all_movies = arrayUnique(all_movies.concat(all_serials));
        all_movies.sort(function(a, b) {
          return new Date(b.added_at) - new Date(a.added_at);
        });
        all_movies = all_movies.slice(
          0,
          parseInt(modules.content.data.auto.moonwalk_movies.count)
        );
        saveContent('moonwalk_movies', all_movies, true, function() {
          console.log(new Date(), 'ALL');
          active.num--;
          active.num--;
          active.process.content = false;
        });
      } else {
        if (mov.length === 1) {
          all_movies = arrayUnique(all_movies);
          all_movies.sort(function(a, b) {
            return new Date(b.added_at) - new Date(a.added_at);
          });
          all_movies = all_movies.slice(
            0,
            parseInt(modules.content.data.auto.moonwalk_movies.count)
          );
          saveContent('moonwalk_movies', all_movies, true, function() {
            console.log(new Date(), 'MOVIES');
            active.num--;
            active.process.content = false;
          });
        } else {
          active.num--;
          active.process.content = false;
        }
        if (ser.length === 1) {
          all_serials = arrayUnique(all_serials);
          all_serials.sort(function(a, b) {
            return new Date(b.added_at) - new Date(a.added_at);
          });
          all_serials = all_serials.slice(
            0,
            parseInt(modules.content.data.auto.moonwalk_serials.count)
          );
          saveContent('moonwalk_serials', all_serials, true, function() {
            console.log(new Date(), 'SERIALS');
            active.num--;
            active.process.content = false;
          });
        } else {
          active.num--;
          active.process.content = false;
        }
      }
    }
  );
}

/**
 * Publish new movies.
 */

if (config.publish.every.hours && config.publish.every.movies) {
  active.num++;
  active.num++;

  active.process.publish = true;
  active.process.rewrite = true;

  CP_get.publishIds(function(err, ids) {
    if (!ids) {
      console.log('[publish] Not Movies.');
      config.publish.every.hours = 0;
      config.publish.every.movies = 0;
    } else if (
      ids.start_id === config.publish.start &&
      ids.stop_id === config.publish.stop
    ) {
      console.log('[publish] All movies published.');
      config.publish.every.hours = 0;
      config.publish.every.movies = 0;
    } else {
      console.log('[publish] New IDs: ' + ids.start_id + ' - ' + ids.stop_id);
      config.publish.start = ids.start_id;
      config.publish.stop = ids.stop_id;
    }

    CP_save.save(config, 'config', function(err) {
      if (err) console.log('[CP_save.save]', err);
      active.num--;
      active.process.publish = false;
    });

    if (modules.rewrite.status && modules.rewrite.data.token) {
      CP_get.movies(
        { query_id: ids.soon_id.join('|') },
        ids.soon_id.length,
        '',
        1,
        false,
        function(err, movies) {
          if (err) {
            active.num--;
            active.process.rewrite = '[CP_get.movies] ERR';
            return console.log('[CP_get.movies]', err);
          }
          if (movies && movies.length) {
            movies = movies.filter(function(m) {
              return m.description && m.description.length >= 100;
            });
            async.eachOfLimit(
              movies,
              1,
              function(movie, i, callback) {
                sinoni({
                  token: modules.rewrite.data.token,
                  double: modules.rewrite.data.double,
                  unique: modules.rewrite.data.unique,
                  text: movie.description,
                  lang: config.language
                })
                  .then(function(res) {
                    console.log(res);
                    if (typeof res.percent !== 'undefined') {
                      var custom = {};
                      if (movie.custom) {
                        custom = JSON.parse(movie.custom);
                      } else {
                        custom.unique = true;
                      }
                      custom.rewrite = {};
                      if (typeof res.percent !== 'undefined') {
                        custom.rewrite.percent = res.percent;
                      }
                      if (typeof res.words !== 'undefined') {
                        custom.rewrite.words = res.words;
                      }
                      if (typeof res.spam !== 'undefined') {
                        custom.rewrite.spam = res.spam;
                      }
                      if (typeof res.water !== 'undefined') {
                        custom.rewrite.water = res.water;
                      }
                      movie.custom = JSON.stringify(custom);
                    }
                    if (typeof res.rewrite !== 'undefined') {
                      movie.description = res.rewrite;
                      CP_save.save(movie, 'rt', function(err) {
                        callback(err);
                      });
                    } else {
                      callback();
                    }
                  })
                  .catch(function(err) {
                    callback(err);
                  });
              },
              function(err) {
                if (err) console.log('[sinoni]', err);
                active.num--;
                active.process.rewrite = false;
              }
            );
          } else {
            active.num--;
            active.process.rewrite = 'Movies 0';
          }
        }
      );
    } else {
      active.num--;
      active.process.rewrite = false;
    }
  });
}

/**
 * Download new translators.
 */

if (
  (modules.player.data.moonwalk.token || modules.player.data.iframe.token) &&
  hour === 3
) {
  active.num++;
  active.num++;

  active.process.player = true;
  active.process.translators = true;

  var url =
    modules.episode.data.source && modules.episode.data.source === 'iframe'
      ? 'iframe.video'
      : 'streamguard.cc';

  var file = 'translators';

  request(
    {
      url: 'http://' + 't' + '.' + 'cinemapress' + '.' + 'io/' + config.domain,
      method: 'POST',
      timeout: 1000
    },
    function(error, response, translators) {
      if (error) {
        active.num--;
        active.process.translators = file + ' ERR';
        return console.log(file, error.code);
      }
      if (response.statusCode === 200 && translators) {
        fs.writeFile(
          path.join(path.dirname(__dirname), 'files', file + '.json'),
          translators,
          function(err) {
            if (err) console.error(err);
            active.num--;
            active.process.translators = false;
          }
        );
      } else {
        active.num--;
        active.process.translators = false;
      }
    }
  );
  request(
    {
      url:
        'https://' +
        url +
        '/api/translators.json?api_token=' +
        modules.player.data.moonwalk.token.trim(),
      timeout: 1000
    },
    function(error, response, translators) {
      if (error) {
        active.num--;
        active.process.player = url + ' ERR';
        return console.log(file, error.code);
      }
      if (response.statusCode === 200 && translators) {
        fs.writeFile(
          path.join(
            path.dirname(__dirname),
            'files',
            modules.episode.data.source + '.json'
          ),
          translators,
          function(err) {
            if (err) console.error(err);
            active.num--;
            active.process.player = false;
          }
        );
      } else {
        active.num--;
        active.process.player = false;
      }
    }
  );
}

/**
 * Create random subdomain.
 */

if (config.random && hour === 2) {
  active.num++;
  active.process.random = true;

  var now = new Date();
  var year = now.getFullYear();
  var start = new Date(year, 0, 0);
  var diff = now - start;
  var oneDay = 86400000;
  var day = ('00' + Math.floor(diff / oneDay)).slice(-3);
  var letter1 = ['a', 'e', 'i', 'o', 'u'];
  var letter2 = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'];
  config.subdomain =
    letter2[parseInt(day[0])] +
    letter1[parseInt(day[1]) % 5] +
    letter2[parseInt(day[2])] +
    letter1[year % 5] +
    '.';

  CP_save.save(config, 'config', function(err) {
    if (err) console.log('[CP_save.save]', err);
    active.num--;
    active.process.random = false;
  });
}

/**
 * Delete abuse movies.
 */

if (
  modules.abuse.data.imap.user &&
  modules.abuse.data.imap.password &&
  modules.abuse.data.imap.host &&
  hour === 1
) {
  active.num++;
  active.process.imap = true;

  var options = JSON.stringify(modules.abuse.data.imap);
  options = JSON.parse(options);

  options.tls = options.tls !== 0;

  var save = false;

  var imap = new Imap(options);
  imap.once('ready', function() {
    imap.openBox('INBOX', true, function(err) {
      if (err) return imap.end();
      var date = new Date();
      imap.search(
        ['ALL', ['SINCE', date.setDate(date.getDate() - 1)]],
        function(err, results) {
          if (err || !results || !results.length) return imap.end();
          var f = imap.fetch(results, { bodies: [''] });
          f.on('message', function(msg) {
            var parser = new MP();
            parser.on('data', function(data) {
              if (data.type === 'text') {
                var str = data.html || data.text || '';
                var re = new RegExp(
                  config.domain + '\\/.*?\\/[a-z0-9_-]*',
                  'ig'
                );
                var urls = str.match(re);
                if (!urls) return;
                urls.forEach(function(u) {
                  var id = movie.id(u);
                  if (
                    id >= 1 &&
                    id <= 9999999 &&
                    !(modules.abuse.data.movies.indexOf('' + id) + 1)
                  ) {
                    console.log('ABUSE', id);
                    modules.abuse.data.movies.push('' + id);
                    save = true;
                  }
                });
              }
            });
            msg.on('body', function(stream) {
              stream.on('data', function(chunk) {
                parser.write(chunk.toString('utf8'));
              });
            });
            msg.once('end', function() {
              parser.end();
            });
            /*msg.once('attributes', function (attrs) {

                        function toUpper(thing) {

                            return thing && thing.toUpperCase ? thing.toUpperCase() : thing;

                        }

                        function findAttachmentParts(struct, attachments) {

                            attachments = attachments || [];

                            for (var i = 0, len = struct.length; i < len; ++i) {
                                if (Array.isArray(struct[i])) {
                                    findAttachmentParts(struct[i], attachments);
                                } else {
                                    if (struct[i].disposition && ['INLINE', 'ATTACHMENT'].indexOf(toUpper(struct[i].disposition.type)) + 1) {
                                        attachments.push(struct[i]);
                                    }
                                }
                            }

                            return attachments;

                        }

                        function buildAttMessageFunction(attachment) {

                            var encoding = attachment.encoding;

                            return function (msg) {
                                msg.on('body', function (stream) {
                                    if (encoding === 'BASE64') {
                                        stream = stream.pipe(base64.decode());
                                    }
                                    var chunks = [];
                                    stream.on('data', function (chunk) {
                                        chunks.push(chunk);
                                    });
                                    stream.on('end', function () {
                                        var urls;
                                        var string = chunks.join('')
                                            .replace(/\\u33\\\'3f/gi, '!')
                                            .replace(/\\u34\\\'3f/gi, '"')
                                            .replace(/\\u35\\\'3f/gi, '#')
                                            .replace(/\\u36\\\'3f/gi, '$')
                                            .replace(/\\u37\\\'3f/gi, '%')
                                            .replace(/\\u38\\\'3f/gi, '&')
                                            .replace(/\\u39\\\'3f/gi, "'")
                                            .replace(/\\u40\\\'3f/gi, '(')
                                            .replace(/\\u41\\\'3f/gi, ')')
                                            .replace(/\\u42\\\'3f/gi, '*')
                                            .replace(/\\u43\\\'3f/gi, '+')
                                            .replace(/\\u44\\\'3f/gi, ',')
                                            .replace(/\\u45\\\'3f/gi, '-')
                                            .replace(/\\u46\\\'3f/gi, '.')
                                            .replace(/\\u47\\\'3f/gi, '/')
                                            .replace(/\\u58\\\'3f/gi, ':')
                                            .replace(/\\u64\\\'3f/gi, '@')
                                            .replace(/\\u91\\\'3f/gi, '[')
                                            .replace(/\\u92\\\'3f/gi, '\\')
                                            .replace(/\\u93\\\'3f/gi, ']')
                                            .replace(/\\u94\\\'3f/gi, '^')
                                            .replace(/\\u95\\\'3f/gi, '_')
                                            .replace(/\\u123\\\'3f/gi, '{')
                                            .replace(/\\u124\\\'3f/gi, '|')
                                            .replace(/\\u125\\\'3f/gi, '}')
                                            .replace(/\\u126\\\'3f/gi, '~');
                                        var expr = new RegExp(config.domain + '/[a-zа-яё0-9./_\\\'-]*', 'ig');
                                        while ((urls = expr.exec(string)) !== null) {
                                            var id = movie.id(urls[0]);
                                            if (id >= 1 && id <= 9999999 && !(modules.abuse.data.movies.indexOf(''+id)+1)) {
                                                modules.abuse.data.movies.push(''+id);
                                                saveData();
                                            }
                                        }
                                    });
                                });
                            };
                        }

                        var attachments = findAttachmentParts(attrs.struct);

                        for (var i = 0, len = attachments.length; i < len; i++) {

                            var attachment = attachments[i];

                            if (
                                attachment &&
                                attachment.disposition &&
                                attachment.disposition.params &&
                                attachment.disposition.params.filename &&
                                attachment.disposition.params.filename.indexOf('.rtf') + 1 &&
                                attachment.disposition.params.filename.indexOf('.sig') === -1
                            ) {
                                var f = imap.fetch(attrs.uid, {
                                    bodies: [attachment.partID],
                                    struct: true
                                });

                                f.on('message', buildAttMessageFunction(attachment));
                            }

                        }

                    });*/
          });
          f.once('error', function(err) {
            console.error(err);
          });
          f.once('end', function() {
            imap.end();
          });
        }
      );
    });
  });
  imap.once('error', function(err) {
    console.error(err);
    active.num--;
    active.process.imap = false;
  });
  imap.once('end', function() {
    if (save) {
      CP_save.save(modules, 'modules', function(err) {
        if (err) console.log('[CP_save.save]', err);
        active.num--;
        active.process.imap = false;
      });
    } else {
      active.num--;
      active.process.imap = false;
    }
  });
  imap.connect();
}

/**
 * Save content.
 *
 * @param {String} key
 * @param {Object} array_mvs
 * @param {Boolean} saved
 * @param {Callback} callback
 */

function saveContent(key, array_mvs, saved, callback) {
  var content_url =
    key && modules.content.data.auto[key] && modules.content.data.auto[key].url
      ? modules.content.data.auto[key].url
      : key;
  var count =
    key &&
    modules.content.data.auto[key] &&
    modules.content.data.auto[key].count &&
    parseInt(modules.content.data.auto[key].count)
      ? parseInt(modules.content.data.auto[key].count)
      : 100;

  if (!array_mvs.length) {
    console.log('[saveContent]', key, content_url, array_mvs.length);
    return callback(null);
  }

  CP_get.contents({ content_url: content_url }, 1, 1, false, function(
    err,
    contents
  ) {
    if (err) {
      console.log('[CP_get.contents]', key, content_url, err);
      return callback(null);
    }

    if (contents && contents.length && contents[0].id) {
      CP_get.movies(
        {
          query_id: array_mvs
            .map(function(id) {
              return id.kinopoisk_id;
            })
            .join('|')
        },
        array_mvs.length,
        '',
        1,
        false,
        function(err, movies) {
          if (err) {
            console.log('[CP_get.movies]', key, content_url, err);
            return callback(null);
          }

          if (movies && movies.length) {
            movies = sortingIds(
              array_mvs.map(function(id) {
                return id.kinopoisk_id;
              }),
              movies
            );
            var ids = [];
            var unique = [];
            movies.forEach(function(movie) {
              movie.kp_id = parseInt(movie.kp_id);
              if (movie.kp_id && !(ids.indexOf(movie.kp_id) + 1)) {
                ids.push(movie.kp_id);
                unique.push({
                  kinopoisk_id: movie.kp_id,
                  custom: movie.custom,
                  translate: movie.translate
                });
              }
            });
            contents[0].content_movies.split(',').forEach(function(kp_id) {
              kp_id = parseInt(kp_id);
              if (kp_id && !(ids.indexOf(kp_id) + 1)) {
                ids.push(kp_id);
                unique.push({ kinopoisk_id: kp_id });
              }
            });
            unique = unique.slice(0, count);

            contents[0].content_movies = unique
              .map(function(id) {
                return id.kinopoisk_id;
              })
              .join(',');

            CP_save.save(contents[0], 'content', function(err, result) {
              console.log(
                '[CP_save.save]',
                key,
                content_url,
                err,
                unique.length,
                result
              );
              if (!saved) return callback(null);
              async.eachOfLimit(
                unique,
                1,
                function(unq, key, callback) {
                  var mov = null;
                  array_mvs.forEach(function(mvs) {
                    if (
                      unq.kinopoisk_id === mvs.kinopoisk_id &&
                      (mvs.quality || mvs.translate)
                    ) {
                      mov = {
                        id: mvs.kinopoisk_id,
                        kp_id: mvs.kinopoisk_id,
                        quality: mvs.quality,
                        translate:
                          config.language === 'uk'
                            ? mvs.translate
                            : /укр/i.test(mvs.translate)
                              ? unq.translate
                              : mvs.translate,
                        custom: unq.custom ? unq.custom : '{"unique":false}',
                        duplicate: true
                      };
                    }
                  });
                  if (mov) {
                    CP_save.save(mov, 'rt', function() {
                      return callback();
                    });
                  } else {
                    callback();
                  }
                },
                function(err) {
                  if (err) console.error(err);
                  callback(null);
                }
              );
            });
          } else {
            console.log('[movies]', key, content_url, err, movies);
            return callback(null);
          }
        }
      );
    } else {
      console.log('[contents]', key, content_url, err, contents);
      callback(null);
    }
  });
}

/**
 * Valid JSON.
 *
 * @param {String} jsonString
 */

function tryParseJSON(jsonString) {
  try {
    var o = JSON.parse(jsonString);
    if (o && typeof o === 'object') {
      return o;
    }
  } catch (e) {}
  return {};
}

/**
 * Array unique.
 *
 * @param {Object} array
 */

function arrayUnique(array) {
  var a = array.concat();
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i].kinopoisk_id === a[j].kinopoisk_id) a.splice(j--, 1);
    }
  }
  return a;
}

/**
 * Sort films are turned by id list.
 *
 * @param {Object} ids
 * @param {Object} movies
 * @param {Number} [count]
 * @return {Array}
 */

function sortingIds(ids, movies, count) {
  if (arguments.length === 2) {
    count = 0;
  }

  var result = [];

  for (var id = 0; id < ids.length; id++) {
    for (var i = 0; i < movies.length; i++) {
      if (parseInt(movies[i].kp_id) === parseInt(('' + ids[id]).trim())) {
        result.push(movies[i]);
        if (result.length === count) return result;
      }
    }
  }

  return result;
}

/**
 * Unique array URLs.
 *
 * @param {String} value
 * @param {Number} index
 * @param {Object} self
 */

function urlUnique(value, index, self) {
  return self.indexOf(value) === index;
}

/**
 * Check active process.
 */

var i = 0;
var si = setInterval(function() {
  if (!(i % 10)) {
    console.log(active.num, active.process);
  }
  if (active.num <= 0) {
    clearInterval(si);
    if (Object.keys(active.process).length === 0) return;
    var rand = Math.floor(Math.random() * 10) + 10;
    console.log('Reload after', rand * 1000, 'sec');
    setTimeout(function() {
      exec('pm2 reload ' + config.domain, function(err, stdout, stderr) {
        if (err || stderr) console.error(err || stderr);
        console.log('Flush memcached');
        CP_cache.flush(function(err) {
          if (err) console.error(err);
          console.log('Flush pagespeed');
          exec('touch /var/ngx_pagespeed_cache/cache.flush', function(err) {
            if (err) console.error(err);
            return process.exit(0);
          });
        });
      });
    }, rand * 1000);
  }
  i++;
}, 1000);
