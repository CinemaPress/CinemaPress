'use strict';

/**
 * Node dependencies.
 */

var exec = require('child_process').exec;
var request = require('request');
var sinoni = require('sinoni');
var async = require('async');
var util = require('util');
var td = new util.TextDecoder('utf8', { fatal: true });
var path = require('path');
var fs = require('fs');
var Imap = require('imap');
var MP = require('mailparser-mit').MailParser;
var nodemailer = require('nodemailer');
var mimemessage = require('mimemessage');

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

var timeZone = new Date().toLocaleString('en-GB', {
  timeZone: 'Europe/Helsinki'
});

var hour = new Date(timeZone).getHours() + 1;

console.log(timeZone);

var active = {
  num: 0,
  process: {}
};

/**
 * Added new movie from website.
 */

if (modules.content.status && modules.content.data.scraper) {
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
  console.log(parsers);
  async.eachOfLimit(
    parsers,
    1,
    function(parser, ii, callback) {
      if (parser.charAt(0) === '#') return callback();
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
              timeout: 5000,
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
                var u;
                var regex_url = new RegExp(p.regex_url, 'ig');
                while ((u = regex_url.exec(html)) !== null) {
                  if (/(\/\/|http)/i.test(u[1])) {
                    urls.push(u[1]);
                  } else if (/\//i.test(u[1])) {
                    urls.push(
                      require('url').parse(p.url).protocol +
                        '//' +
                        require('url').parse(p.url).host +
                        u[1]
                    );
                  } else {
                    var s = p.url.split('/');
                    s.pop();
                    var slash = s.join('/');
                    urls.push(slash + '/' + u[1]);
                  }
                }
              }
              if (!urls.length) urls.push(p.url);
              console.log(urls, urls.length);
              async.eachOfLimit(
                urls,
                1,
                function(url, i, callback) {
                  request(
                    {
                      url: url,
                      method: 'GET',
                      timeout: 5000,
                      headers: {
                        'User-Agent':
                          agents[Math.floor(Math.random() * agents.length)]
                      }
                    },
                    function(error, response, html) {
                      if (error || !html) {
                        console.log(parser, url, error.code, html);
                        return callback();
                      }
                      var found;
                      var regex_id = new RegExp(p.regex_id, 'ig');
                      while ((found = regex_id.exec(html)) !== null) {
                        if (found[1] && !(ids.indexOf(found[1]) + 1)) {
                          ids.push(found[1]);
                          mvs.push({ kinopoisk_id: found[1] });
                        }
                      }
                      setTimeout(function() {
                        callback();
                      }, Math.floor(Math.random() * 2000 + 1000));
                    }
                  );
                },
                function(err) {
                  if (err) console.error(err);
                  console.log('ID KinoPoisk:', mvs);
                  saveContent(p.collection, mvs, false, function() {});
                  setTimeout(function() {
                    callback();
                  }, 3000);
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
      active.process.scraper = false;
    }
  );
} else {
  console.log(
    'NOT START:',
    'SCRAPER',
    'status',
    !!modules.content.status,
    'data',
    !!modules.content.data.scraper
  );
}

/**
 * Added new movie ids.
 */

if (
  modules.content.status &&
  (modules.player.data.iframe.token ||
    modules.player.data.kodik.token ||
    modules.player.data.videocdn.token ||
    modules.player.data.hdvb.token) &&
  [
    'kodik_movies',
    'kodik_serials',
    'iframe_movies',
    'iframe_serials',
    'videocdn_movies',
    'videocdn_serials',
    'hdvb_movies',
    'hdvb_serials'
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
    iframe_movies: [
      'https://iframe.video/api/v2/updates?type=movie&api_token=[token]'
    ],
    iframe_serials: [
      'https://iframe.video/api/v2/updates?type=serial&api_token=[token]'
    ],
    videocdn_movies: [
      'https://videocdn.tv/api/movies?api_token=[token]&ordering=id&direction=desc'
    ],
    videocdn_serials: [
      'https://videocdn.tv/api/tv-series/episodes?api_token=[token]&ordering=id&direction=desc',
      'https://videocdn.tv/api/anime-tv-series/episodes?api_token=[token]&ordering=id&direction=desc',
      'https://videocdn.tv/api/show-tv-series/episodes?api_token=[token]&ordering=id&direction=desc'
    ],
    hdvb_movies: [
      'https://' +
        (modules.player.data.hdvb.token.trim().split(':')[1]
          ? modules.player.data.hdvb.token.trim().split(':')[1]
          : 'apivb.info') +
        '/api/movies_updates.json?token=[token]'
    ],
    hdvb_serials: [
      'https://' +
        (modules.player.data.hdvb.token.trim().split(':')[1]
          ? modules.player.data.hdvb.token.trim().split(':')[1]
          : 'apivb.info') +
        '/api/serials_updates.json?token=[token]'
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
      if (key === 'iframe_movies' && modules.player.data.iframe.token) {
        async.eachOf(
          arr,
          function(url, id, callback) {
            url = url.replace(
              '[token]',
              modules.player.data.iframe.token.trim().split(':')[0]
            );
            request({ url: url, method: 'GET', timeout: 5000 }, function(
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
                      if (movie.added) {
                        movie.added.sort(function(a, b) {
                          return new Date(b.date) - new Date(a.date);
                        });
                      } else {
                        movie.added = [
                          { date: new Date(), source: '', translator: '' }
                        ];
                      }
                      mvs.push({
                        kinopoisk_id: movie.kinopoisk_id,
                        added_at: movie.added[0].date || '',
                        quality:
                          movie.added &&
                          movie.added[0] &&
                          movie.added[0].source &&
                          modules.content.data.auto[key].quality
                            ? movie.added[0].source
                            : '',
                        translate:
                          movie.added &&
                          movie.added[0] &&
                          movie.added[0].translator &&
                          modules.content.data.auto[key].translate
                            ? movie.added[0].translator
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
              modules.player.data.iframe.token.trim().split(':')[0]
            );
            request({ url: url, method: 'GET', timeout: 5000 }, function(
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
                movies.results &&
                movies.results.length
              ) {
                movies.results.forEach(function(movie) {
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
                      if (movie.added && movie.added.length) {
                        movie.added.sort(function(a, b) {
                          return new Date(b.date) - new Date(a.date);
                        });
                      } else {
                        movie.added = [
                          { date: new Date(), source: '', translator: '' }
                        ];
                      }
                      mvs.push({
                        kinopoisk_id: movie.kinopoisk_id,
                        added_at: movie.added[0].date || '',
                        quality:
                          movie.added &&
                          movie.added[0] &&
                          movie.added[0].source &&
                          modules.content.data.auto[key].quality
                            ? movie.added[0].source
                            : '',
                        translate:
                          movie.added &&
                          movie.added[0] &&
                          movie.added[0].translator &&
                          modules.content.data.auto[key].translate
                            ? movie.added[0].translator
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
              modules.player.data.kodik.token.trim().split(':')[0]
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
              modules.player.data.kodik.token.trim().split(':')[0]
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
      } else if (
        key === 'videocdn_movies' &&
        modules.player.data.videocdn.token
      ) {
        async.eachOf(
          arr,
          function(url, id, callback) {
            url = url.replace(
              '[token]',
              modules.player.data.videocdn.token.trim().split(':')[0]
            );
            request({ url: url, method: 'GET', timeout: 5000 }, function(
              error,
              response,
              movies
            ) {
              if (error) {
                console.log('videocdn_movies', error.code);
                return callback();
              }
              movies = tryParseJSON(movies);
              if (
                response.statusCode === 200 &&
                movies &&
                movies.data &&
                movies.data.length
              ) {
                movies.data.forEach(function(movie) {
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
                        added_at: movie.created,
                        quality:
                          movie.media &&
                          movie.media[0] &&
                          movie.media[0].source_quality &&
                          modules.content.data.auto[key].quality
                            ? movie.media[0].source_quality.toUpperCase()
                            : '',
                        translate:
                          movie.media &&
                          movie.media[0] &&
                          movie.media[0].translation &&
                          movie.media[0].translation.short_title &&
                          modules.content.data.auto[key].translate
                            ? movie.media[0].translation.short_title
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
        key === 'videocdn_serials' &&
        modules.player.data.videocdn.token
      ) {
        async.eachOf(
          arr,
          function(url, id, callback) {
            url = url.replace(
              '[token]',
              modules.player.data.videocdn.token.trim().split(':')[0]
            );
            request({ url: url, method: 'GET', timeout: 5000 }, function(
              error,
              response,
              movies
            ) {
              if (error) {
                console.log('videocdn_serials', error.code);
                return callback();
              }
              movies = tryParseJSON(movies);
              if (
                response.statusCode === 200 &&
                movies &&
                movies.data &&
                movies.data.length
              ) {
                movies.data.forEach(function(movie) {
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
                        added_at: movie.created,
                        quality:
                          movie.media &&
                          movie.media[0] &&
                          movie.media[0].source_quality &&
                          modules.content.data.auto[key].quality
                            ? movie.media[0].source_quality.toUpperCase()
                            : '',
                        translate:
                          movie.media &&
                          movie.media[0] &&
                          movie.media[0].translation &&
                          movie.media[0].translation.short_title &&
                          modules.content.data.auto[key].translate
                            ? movie.media[0].translation.short_title
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
      } else if (key === 'hdvb_movies' && modules.player.data.hdvb.token) {
        async.eachOf(
          arr,
          function(url, id, callback) {
            url = url.replace(
              '[token]',
              modules.player.data.hdvb.token.trim().split(':')[0]
            );
            request({ url: url, method: 'GET', timeout: 5000 }, function(
              error,
              response,
              movies
            ) {
              if (error) {
                console.log('hdvb_movies', error.code);
                return callback();
              }
              movies = tryParseJSON(movies);
              if (response.statusCode === 200 && movies && movies.length) {
                movies.forEach(function(movie) {
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
                        added_at: movie.added_date,
                        quality:
                          movie.quality &&
                          modules.content.data.auto[key].quality
                            ? decodeURIComponent(movie.quality).toUpperCase()
                            : '',
                        translate:
                          movie.translator &&
                          modules.content.data.auto[key].translate
                            ? decodeURIComponent(movie.translator)
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
      } else if (key === 'hdvb_serials' && modules.player.data.hdvb.token) {
        async.eachOf(
          arr,
          function(url, id, callback) {
            url = url.replace(
              '[token]',
              modules.player.data.hdvb.token.trim().split(':')[0]
            );
            request({ url: url, method: 'GET', timeout: 5000 }, function(
              error,
              response,
              movies
            ) {
              if (error) {
                console.log('hdvb_serials', error.code);
                return callback();
              }
              movies = tryParseJSON(movies);
              if (response.statusCode === 200 && movies && movies.length) {
                movies.forEach(function(movie) {
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
                        added_at: movie.added_date,
                        quality:
                          movie.quality &&
                          modules.content.data.auto[key].quality
                            ? decodeURIComponent(movie.quality).toUpperCase()
                            : '',
                        translate:
                          movie.translator &&
                          modules.content.data.auto[key].translate
                            ? decodeURIComponent(movie.translator)
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
      } else {
        callback();
      }
    },
    function(err) {
      if (err) console.error(err);

      var m = [
        modules.content.data.auto.kodik_movies
          ? modules.content.data.auto.kodik_movies.url
          : '',
        modules.content.data.auto.iframe_movies
          ? modules.content.data.auto.iframe_movies.url
          : '',
        modules.content.data.auto.videocdn_movies
          ? modules.content.data.auto.videocdn_movies.url
          : '',
        modules.content.data.auto.hdvb_movies
          ? modules.content.data.auto.hdvb_movies.url
          : ''
      ];
      var s = [
        modules.content.data.auto.kodik_serials
          ? modules.content.data.auto.kodik_serials.url
          : '',
        modules.content.data.auto.iframe_serials
          ? modules.content.data.auto.iframe_serials.url
          : '',
        modules.content.data.auto.iframe_serials
          ? modules.content.data.auto.iframe_serials.url
          : '',
        modules.content.data.auto.videocdn_serials
          ? modules.content.data.auto.videocdn_serials.url
          : '',
        modules.content.data.auto.hdvb_serials
          ? modules.content.data.auto.hdvb_serials.url
          : ''
      ];
      var a = s.concat(m);

      var mov = m.filter(urlUnique);
      var ser = s.filter(urlUnique);
      var all = a.filter(urlUnique);

      if (all.length === 1) {
        var all_coll_array = [
          'kodik_movies',
          'kodik_serials',
          'iframe_movies',
          'iframe_serials',
          'videocdn_movies',
          'videocdn_serials',
          'hdvb_movies',
          'hdvb_serials'
        ].filter(function(k) {
          return (
            modules.content.data.auto[k] &&
            modules.content.data.auto[k].url &&
            modules.content.data.auto[k].count
          );
        });
        var all_coll =
          all_coll_array && all_coll_array[0]
            ? all_coll_array[0]
            : 'iframe_movies';
        all_movies = arrayUnique(all_movies.concat(all_serials));
        all_movies.sort(function(a, b) {
          return new Date(b.added_at) - new Date(a.added_at);
        });
        all_movies = all_movies.slice(
          0,
          parseInt(modules.content.data.auto[all_coll].count)
        );
        saveContent(all_coll, all_movies, true, function() {
          active.num--;
          active.num--;
          active.process.content = false;
        });
      } else {
        if (mov.length === 1) {
          var mov_coll_array = [
            'kodik_movies',
            'iframe_movies',
            'videocdn_movies',
            'hdvb_movies'
          ].filter(function(k) {
            return (
              modules.content.data.auto[k] &&
              modules.content.data.auto[k].url &&
              modules.content.data.auto[k].count
            );
          });
          var mov_coll =
            mov_coll_array && mov_coll_array[0]
              ? mov_coll_array[0]
              : 'iframe_movies';
          all_movies = arrayUnique(all_movies);
          all_movies.sort(function(a, b) {
            return new Date(b.added_at) - new Date(a.added_at);
          });
          all_movies = all_movies.slice(
            0,
            parseInt(modules.content.data.auto[mov_coll].count)
          );
          saveContent(mov_coll, all_movies, true, function() {
            active.num--;
            active.process.content = false;
          });
        } else {
          active.num--;
          active.process.content = false;
        }
        if (ser.length === 1) {
          var ser_coll_array = [
            'kodik_serials',
            'iframe_serials',
            'videocdn_serials',
            'hdvb_serials'
          ].filter(function(k) {
            return (
              modules.content.data.auto[k] &&
              modules.content.data.auto[k].url &&
              modules.content.data.auto[k].count
            );
          });
          var ser_coll =
            ser_coll_array && ser_coll_array[0]
              ? ser_coll_array[0]
              : 'iframe_serials';
          all_serials = arrayUnique(all_serials);
          all_serials.sort(function(a, b) {
            return new Date(b.added_at) - new Date(a.added_at);
          });
          all_serials = all_serials.slice(
            0,
            parseInt(modules.content.data.auto[ser_coll].count)
          );
          saveContent(ser_coll, all_serials, true, function() {
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
} else {
  console.log(
    'NOT START:',
    'CONTENT',
    'status',
    !!modules.content.status,
    'token',
    !!(
      modules.player.data.iframe.token ||
      modules.player.data.kodik.token ||
      modules.player.data.videocdn.token ||
      modules.player.data.hdvb.token
    )
  );
}

/**
 * Publish new movies.
 */

if (config.publish.every.hours && config.publish.every.movies) {
  active.num++;

  active.process.publish = true;

  CP_get.publishIds(function(err, ids) {
    var log = '';

    if (!ids) {
      log = '[publish] Not Movies.';
      config.publish.every.hours = 0;
      config.publish.every.movies = 0;
    } else if (
      ids.start_id === config.publish.start &&
      ids.stop_id === config.publish.stop
    ) {
      log = '[publish] All movies published.';
      config.publish.every.hours = 0;
      config.publish.every.movies = 0;
    } else {
      log = '[publish] New IDs: ' + ids.start_id + ' - ' + ids.stop_id;
      config.publish.start = ids.start_id;
      config.publish.stop = ids.stop_id;
    }

    if (modules.rewrite.status && modules.rewrite.data.token) {
      active.num++;

      active.process.rewrite = true;

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
      console.log(
        'NOT START:',
        'REWRITE',
        'status',
        !!modules.rewrite.status,
        'token',
        !!modules.rewrite.data.token
      );
    }

    CP_save.save(config, 'config', function(err) {
      if (err) {
        console.log('[CP_save.save]', err);
      } else {
        console.log(log);
      }
      active.num--;
      active.process.publish = false;
    });
  });
} else {
  console.log(
    'NOT START:',
    'PUBLISH',
    'hours',
    !!config.publish.every.hours,
    'movies',
    !!config.publish.every.movies
  );
}

/**
 * Download new translators.
 */

if (modules.player.data.iframe.token && hour === 5) {
  active.num++;
  active.num++;

  active.process.player = true;
  active.process.translators = true;

  var url = 'iframe.video';

  var file = 'translators';

  request(
    {
      url: 'http://' + 't' + '.' + 'cinemapress' + '.' + 'io/' + config.domain,
      method: 'POST',
      timeout: 5000
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
    { url: 'https://' + url + '/api/v2/translates', timeout: 5000 },
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

if (config.random && hour === 4) {
  active.num++;
  active.process.random = true;

  config.subdomain = dayToLetter();

  CP_save.save(config, 'config', function(err) {
    if (err) console.log('[CP_save.save]', err);
    active.num--;
    active.process.random = false;
  });
} else {
  console.log('NOT START:', 'RANDOM', 'config', !!config.random, '4 !=', hour);
}

/**
 * Delete abuse movies.
 */

if (
  modules.abuse.data.imap.user &&
  modules.abuse.data.imap.password &&
  modules.abuse.data.imap.host &&
  (hour === 3 || hour === 9 || hour === 15 || hour === 21)
) {
  active.num++;
  active.process.imap = true;

  var options_imap = JSON.stringify(modules.abuse.data.imap);
  options_imap = JSON.parse(options_imap);
  options_imap.tls = options_imap.tls !== 0;
  delete options_imap.from;
  delete options_imap.subdomain;

  var options_smtp = JSON.stringify(modules.abuse.data.smtp);
  options_smtp = JSON.parse(options_smtp);
  options_smtp.secure = options_smtp.secure !== 0;
  if (options_smtp.dkim) {
    options_smtp.dkim = JSON.parse(options_smtp.dkim);
  } else {
    delete options_smtp.dkim;
  }
  var message = options_smtp.message;
  delete options_smtp.message;

  var date = new Date();
  var search = [
    ['or', ['SINCE', date.setHours(date.getHours() - 6)], ['UNSEEN']]
  ];

  if (modules.abuse.data.imap.from && modules.abuse.data.imap.from.length) {
    if (modules.abuse.data.imap.from.length === 1) {
      modules.abuse.data.imap.from.forEach(function(email) {
        search.push(['FROM', email.trim()]);
      });
    } else if (modules.abuse.data.imap.from.length > 1) {
      var search_or = [];
      search_or.push('or');
      modules.abuse.data.imap.from.forEach(function(email) {
        search_or.push(['FROM', email.trim()]);
      });
      search.push(search_or);
    } else {
      search.push(['ALL']);
    }
  }

  var headers_ = [];

  var transporter =
    options_smtp && options_smtp.host
      ? nodemailer.createTransport(options_smtp)
      : null;
  var imap = new Imap(options_imap);
  imap.once('ready', function() {
    imap.openBox('INBOX', false, function(err) {
      if (err) {
        console.error('imap.openBox', err);
        return imap.end();
      }
      imap.search(search, function(err, results) {
        if (err || !results || !results.length) {
          console.log('imap.search', search, err || results);
          return imap.end();
        }
        var f = imap.fetch(results, { bodies: '', markSeen: true });
        f.on('message', function(msg) {
          var parser = new MP();
          parser.on('end', function(data) {
            var to =
              data['from'] && data['from'][0] && data['from'][0]['address']
                ? data['from'][0]['address']
                : '';
            var subject = data['subject'] ? data['subject'] : '';
            var text = data['text']
              ? data['text']
              : data['html']
              ? data['html']
                  .replace(/<blockquote>[^]*<\/blockquote>/gi, '')
                  .replace(/<q>[^]*<\/q>/gi, '')
              : '';
            var html = data['html']
              ? data['html']
                  .replace(/<blockquote>[^]*?<\/blockquote>/gi, '')
                  .replace(/<q>[^]*?<\/q>/gi, '')
              : data['text']
              ? data['text']
              : '';
            if (to && subject && (text || html)) {
              headers_.push({
                to: to,
                subject: subject,
                text: text,
                html: html
              });
            }
          });
          msg.on('body', function(stream) {
            stream.on('data', function(chunk) {
              parser.write(td.decode(chunk));
            });
          });
          msg.once('end', function() {
            parser.end();
          });
        });
        f.once('error', function(err) {
          console.error('f.once', err);
        });
        f.once('end', function() {
          imap.end();
        });
      });
    });
  });
  imap.once('error', function(err) {
    console.error('imap.once', err);
    active.num--;
    active.process.imap = false;
  });
  imap.once('end', function() {
    if (headers_ && headers_.length) {
      var save = false;
      async.eachOfLimit(
        headers_,
        1,
        function(d, i, callback) {
          var re = new RegExp(
            config.domain +
              '(\\/mobile-version|\\/tv-version|)\\/[a-z0-9._-]*?' +
              (config.urls.slash === '/' ? '\\/' : '-') +
              '[a-z0-9._-]*',
            'ig'
          );
          var urls = headers_[i].html
            .replace(/<br>/gi, '')
            .replace(/\n/gi, '')
            .replace(/\r\n/gi, '')
            .replace(/\r/gi, '')
            .match(re);
          if (!urls) {
            console.log('NOT ID', headers_[i]);
            return callback();
          } else {
            var unique = urls.filter(function(v, i, a) {
              return a.indexOf(v) === i;
            });
            console.log('URLS', unique);
          }
          var send = false;
          headers_[i].id = [];
          unique.forEach(function(u) {
            var id = movie.id(u);
            if (id >= 1 && id <= 99999999) {
              send = !!transporter;
              if (!(headers_[i].id.indexOf('' + id) + 1)) {
                headers_[i].id.push(id.toString());
              }
              if (modules.abuse.data.movies.indexOf('' + id) + 1) {
                console.log('ABUSE ONLY EMAIL', headers_[i].to, id, send);
              } else {
                console.log('ABUSE', headers_[i].to, id, send);
                modules.abuse.data.movies.unshift('' + id);
                save = true;
              }
            }
          });
          console.log('SEND', send, headers_[i].id);
          if (send) {
            send = false;
            var dateNow = new Date();
            var dateString =
              ('0' + dateNow.getDate()).slice(-2) +
              '-' +
              ('0' + (dateNow.getMonth() + 1)).slice(-2) +
              '-' +
              dateNow.getFullYear() +
              ' ' +
              ('0' + dateNow.getHours()).slice(-2) +
              ':' +
              ('0' + dateNow.getMinutes()).slice(-2);
            var mailMessage =
              message && message.indexOf('[id]') + 1
                ? message.replace(/\[id]/gi, headers_[i].id.join(','))
                : message;
            var mailOptions = {
              name: options_smtp.auth.user.split('@')[1],
              from: options_smtp.auth.user,
              to: headers_[i].to,
              textEncoding: 'base64',
              date: dateNow,
              subject: 'RE: ' + headers_[i].subject,
              text: (
                mailMessage
                  .replace(/<br>/gi, '\n')
                  .replace(/(<([^>]+)>)/gi, '') +
                '\n\n' +
                '---- ' +
                dateString +
                ' <' +
                headers_[i].to +
                '> ----\n' +
                headers_[i].text
                  .replace(/<br>/gi, '\n')
                  .replace(/(<([^>]+)>)/gi, '')
              ).replace(/(^\s*)|(\s*)$/g, ''),
              html: (
                mailMessage +
                '<br><br>' +
                '---- ' +
                dateString +
                ' <' +
                headers_[i].to +
                '> ----<br>' +
                '<blockquote>' +
                headers_[i].html.replace(/\n/g, '<br>') +
                '</blockquote>'
              )
                .replace(/\s+/g, ' ')
                .replace(/(^\s*)|(\s*)$/g, '')
            };
            setTimeout(function() {
              console.log(
                'START sendMail',
                headers_[i].to,
                headers_[i].subject
              );
              transporter.sendMail(mailOptions, function(err) {
                if (err) console.error('sendMail', err);
                console.log(
                  'REPLY',
                  headers_[i].to,
                  'RE: ' + headers_[i].subject
                );
                if (
                  !err &&
                  modules.abuse.data.smtp.host.indexOf('yandex') + 1
                ) {
                  var imap2 = new Imap(options_imap);
                  imap2.once('ready', function() {
                    imap2.openBox('Sent', false, function(err, box) {
                      if (err) {
                        console.error('openBox Sent', err);
                        imap2.end();
                        callback();
                      }
                      let msg, htmlEntity;
                      msg = mimemessage.factory({
                        contentType: 'multipart/alternate',
                        body: []
                      });
                      htmlEntity = mimemessage.factory({
                        contentType: 'text/html;charset=utf-8',
                        body: mailOptions.html
                      });
                      msg.header(
                        'Message-ID',
                        '<' +
                          Math.random()
                            .toString(36)
                            .substr(2, 5) +
                          '>'
                      );
                      msg.header('From', mailOptions.from);
                      msg.header('To', mailOptions.to);
                      msg.header('Subject', mailOptions.subject);
                      msg.body.push(htmlEntity);
                      imap2.append(
                        msg.toString(),
                        {
                          mailbox: 'Sent',
                          flags: ['Seen']
                        },
                        function(err) {
                          if (err) {
                            console.error('APPEND', err);
                          }
                          imap2.end();
                        }
                      );
                    });
                  });
                  imap2.once('error', function(err) {
                    console.error('SENT FOLDER', err);
                    callback();
                  });
                  imap2.once('end', function() {
                    console.error('SENT', mailOptions.to, mailOptions.subject);
                    callback();
                  });
                  imap2.connect();
                } else {
                  callback();
                }
              });
            }, 10000 * i);
            console.log('TIMEOUT', headers_[i].subject, 10000 * i, 'sec');
          } else {
            callback();
          }
        },
        function(err) {
          if (err) console.error(err);
          if (save) {
            CP_save.save(modules, 'modules', function(err) {
              if (err) console.log('[CP_save.save]', err);
              if (modules.abuse.data.imap.subdomain) {
                config.subdomain = dayToLetter();
                CP_save.save(config, 'config', function(err) {
                  if (err) console.log('[CP_save.save]', err);
                  active.num--;
                  active.process.imap = false;
                });
              } else {
                active.num--;
                active.process.imap = false;
              }
            });
          } else {
            active.num--;
            active.process.imap = false;
          }
        }
      );
    } else {
      active.num--;
      active.process.imap = false;
      console.log('headers:', headers_.length, 'data:', headers_.length);
    }
  });
  imap.connect();
} else {
  console.log(
    'NOT START:',
    'IMAP',
    'user',
    !!modules.abuse.data.imap.user,
    'password',
    !!modules.abuse.data.imap.password,
    'host',
    !!modules.abuse.data.imap.host,
    '3,9,15,21 !=',
    hour
  );
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
                saved,
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
                    return callback();
                  }
                },
                function(err) {
                  if (err) console.error(err);
                  return callback(null);
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
 * Current day to letter.
 */

function dayToLetter() {
  var now = new Date();
  var year = now.getFullYear();
  var start = new Date(year, 0, 0);
  var diff = now - start;
  var oneDay = 86400000;
  var day = ('00' + Math.floor(diff / oneDay)).slice(-3);
  var letter1 = ['a', 'e', 'i', 'o', 'u'];
  var letter2 = ['b', 'c', 'd', 'p', 's', 'w', 'v', 'n', 'l', 'm'];
  if (config.domain.split('.')[0].length % 2) {
    letter1 = letter1.reverse();
  }
  if (config.domain.split('.')[1].length % 2) {
    letter2 = letter2.reverse();
  }
  var result =
    letter2[parseInt(day[0])] +
    letter1[parseInt(day[1]) % 5] +
    letter2[parseInt(day[2])] +
    (config.random === 3 ? '' : letter1[year % 5]);
  if (parseInt(day[1]) >= 5) {
    result =
      letter1[parseInt(day[0]) % 5] +
      letter2[parseInt(day[1])] +
      letter1[parseInt(day[2]) % 5] +
      (config.random === 3 ? '' : letter2[year % 10]);
  }
  if (now.getDate() % 2) {
    result = result
      .split('')
      .reverse()
      .join('');
  }
  return result + '.';
}

/**
 * Check active process.
 */

var interval = 0;
var sint = setInterval(function() {
  if (!(interval % 10)) {
    console.log(active.num, active.process);
  }
  if (active.num <= 0) {
    clearInterval(sint);
    console.log(active.num, active.process);
    if (Object.keys(active.process).length === 0) return;
    var rand = Math.floor(Math.random() * 10) + 10;
    console.log('Reload after', rand * 1000, 'sec');
    setTimeout(function() {
      exec('pm2 reload ' + config.domain, function(err, stdout, stderr) {
        if (err || stderr) console.error(err || stderr);
        console.log('Flush memcached');
        CP_cache.flush(function(err) {
          if (err) console.error(err);
          return process.exit(0);
        });
      });
    }, rand * 1000);
  }
  interval++;
}, 1000);
