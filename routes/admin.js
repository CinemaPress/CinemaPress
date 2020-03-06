'use strict';

/**
 * Module dependencies.
 */

var CP_get = require('../lib/CP_get.min');
var CP_save = require('../lib/CP_save.min');
var CP_cache = require('../lib/CP_cache');
var CP_structure = require('../lib/CP_structure');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
var modules = require('../config/production/modules');

/**
 * Node dependencies.
 */

var express = require('express');
var sinoni = require('sinoni');
var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');
var multer = require('multer');
var async = require('async');
var Sharp = require('sharp');
var i18n = require('i18n');
var router = express.Router();

/**
 * Translation module.
 */

i18n.configure({
  locales: [
    'ru',
    'en',
    'es',
    'de',
    'fr',
    'ja',
    'pt',
    'it',
    'zh',
    'pl',
    'nl',
    'tr',
    'cs',
    'ko',
    'vi',
    'sv',
    'hu',
    'el',
    'ro',
    'sk',
    'da',
    'id',
    'fi',
    'th',
    'bg',
    'uk',
    'ar',
    'sq',
    'lt',
    'hr',
    'sr',
    'bn',
    'sl',
    'et',
    'lv',
    'hi',
    'sw'
  ],
  directory: path.join(
    __dirname,
    '..',
    'themes',
    'default',
    'public',
    'admin',
    'locales'
  ),
  updateFiles: false
});

/**
 * Middleware functions.
 */

router.use(i18n.init);

/**
 * Callback.
 *
 * @callback Callback
 * @param {Object} err
 * @param {Object} [result]
 */

router.get('/:type?', function(req, res) {
  var c = JSON.stringify(config);
  var m = JSON.stringify(modules);

  var host = req.get('host');
  var port =
    /:[0-9]{1,5}$/.test(host) && !/:80$/.test(host) && !/:443$/.test(host)
      ? ':' + host.split(':')[1]
      : '';

  var render = {
    config: JSON.parse(c),
    modules: JSON.parse(m),
    type: req.params.type || 'index',
    url: '/' + config.urls.admin + '/' + (req.params.type || 'index'),
    languages: [],
    language: config.language
  };

  render.config.domain =
    port && render.config.domain.indexOf(port) === -1
      ? render.config.domain + port
      : render.config.domain;

  render.icons = {
    index: 'fa fa-database',
    main: 'fa fa-cog',
    publish: 'fa fa-clock',
    homepage: 'fa fa-bars',
    display: 'fa fa-list',
    urls: 'fa fa-sitemap',
    codes: 'fa fa-code',
    movies: 'fa fa-film',
    titles: 'fa fa-pencil-alt',
    h1: 'fa fa-pen-fancy',
    descriptions: 'fa fa-pen-alt',

    soon: 'far fa-calendar-alt',
    comments: 'fa fa-comments',
    related: 'far fa-list-alt',
    content: 'fa fa-pen-nib',
    slider: 'fa fa-images',
    abuse: 'far fa-copyright',
    top: 'fa fa-chart-bar',
    social: 'fab fa-facebook-f',
    schema: 'fa fa-key',
    continue: 'fa fa-history',
    viewed: 'fa fa-eye',
    player: 'fa fa-play',
    blocking: 'fa fa-lock',
    mobile: 'fa fa-mobile-alt',
    episode: 'fa fa-hand-spock',
    adv: 'fa fa-dollar-sign',
    rss: 'fa fa-rss',
    tv: 'fa fa-tv',
    random: 'fa fa-dice',
    rewrite: 'far fa-hand-rock',
    app: 'fas fa-desktop'
  };

  render.icon = render.icons[render.type];

  var id =
    typeof req.query.id !== 'undefined' ||
    typeof req.query.kp_id !== 'undefined' ||
    typeof req.query.imdb_id !== 'undefined' ||
    typeof req.query.tmdb_id !== 'undefined' ||
    typeof req.query.douban_id !== 'undefined'
      ? '_add_'
      : '';

  var kp_id = req.query.kp_id
    ? req.query.kp_id.replace(/[^0-9]/g, '')
    : req.query.id
    ? req.query.id.replace(/[^0-9]/g, '')
    : '';
  var imdb_id = req.query.imdb_id
    ? req.query.imdb_id.replace(/[^0-9]/g, '')
    : '';
  var tmdb_id = req.query.tmdb_id
    ? req.query.tmdb_id.replace(/[^0-9]/g, '')
    : '';
  var douban_id = req.query.douban_id
    ? req.query.douban_id.replace(/[^0-9]/g, '')
    : '';
  var comment_id = req.query.comment_id ? req.query.comment_id : null;
  var url = req.query.url ? req.query.url : null;
  var num = req.query.num ? parseInt(req.query.num) : 1;
  var type = req.query.type ? parseInt(req.query.type) : '';

  if (req.query.language) {
    res.cookie('language', req.query.language, {
      maxAge: 2147483647,
      httpOnly: true
    });
    res.setLocale(req.query.language);
  } else if (req.cookies.language) {
    res.setLocale(req.cookies.language);
  } else {
    res.setLocale(config.language);
  }

  render.languages = res.getLocales();
  render.language = res.getLocale();

  switch (req.params.type) {
    case 'homepage':
      render.title = res.__('Главная');
      res.render('admin/homepage', render);
      break;
    case 'movies':
      render.title = res.__('Фильмы');
      getMovie(function(err, render) {
        res.render('admin/movies', render);
      });
      break;
    case 'main':
      render.title = res.__('Настройки');
      getThemes(function(err, themes) {
        if (err) return res.render('error', { message: err });
        render.themes = themes;
        res.render('admin/main', render);
      });
      break;
    case 'urls':
      render.title = res.__('URL');
      res.render('admin/urls', render);
      break;
    case 'display':
      render.title = res.__('Отображение');
      res.render('admin/display', render);
      break;
    case 'titles':
      render.title = res.__('Названия');
      res.render('admin/titles', render);
      break;
    case 'h1':
      render.title = res.__('H1');
      res.render('admin/h1', render);
      break;
    case 'descriptions':
      render.title = res.__('Описания');
      res.render('admin/descriptions', render);
      break;
    case 'codes':
      render.title = res.__('Коды');
      res.render('admin/codes', render);
      break;
    case 'publish':
      render.title = res.__('Автопубликация');
      getCountMovies(function(err, render) {
        CP_get.publishIds(function(err, ids) {
          if (err) console.error(err);
          render.soon_id = ids && ids.soon_id ? ids.soon_id : [];
          res.render('admin/publish', render);
        });
      });
      break;
    case 'comments':
      render.title = res.__('Комментарии');
      getComment(function(err, render) {
        res.render('admin/modules/comments', render);
      });
      break;
    case 'related':
      render.title = res.__('Связанные');
      res.render('admin/modules/related', render);
      break;
    case 'slider':
      render.title = res.__('Слайдер');
      res.render('admin/modules/slider', render);
      break;
    case 'abuse':
      render.title = res.__('Скрыть');
      res.render('admin/modules/abuse', render);
      break;
    case 'top':
      render.title = res.__('Топ');
      res.render('admin/modules/top', render);
      break;
    case 'social':
      render.title = res.__('Социальные сети');
      res.render('admin/modules/social', render);
      break;
    case 'schema':
      render.title = res.__('Микроразметка');
      res.render('admin/modules/schema', render);
      break;
    case 'soon':
      render.title = res.__('Скоро');
      res.render('admin/modules/soon', render);
      break;
    case 'continue':
      render.title = res.__('Продолжить');
      res.render('admin/modules/continue', render);
      break;
    case 'viewed':
      render.title = res.__('Просмотренные');
      res.render('admin/modules/viewed', render);
      break;
    case 'player':
      render.title = res.__('Плеер');
      res.render('admin/modules/player', render);
      break;
    case 'blocking':
      render.title = res.__('Блокировка');
      res.render('admin/modules/blocking', render);
      break;
    case 'mobile':
      render.title = res.__('Мобильная версия');
      res.render('admin/modules/mobile', render);
      break;
    case 'episode':
      render.title = res.__('Серии');
      res.render('admin/modules/episode', render);
      break;
    case 'adv':
      render.title = res.__('Реклама');
      res.render('admin/modules/adv', render);
      break;
    case 'content':
      render.title = res.__('Контент');
      getContent(function(err, render) {
        res.render('admin/modules/content', render);
      });
      break;
    case 'rss':
      render.title = res.__('RSS');
      res.render('admin/modules/rss', render);
      break;
    case 'tv':
      render.title = res.__('ТВ версия');
      res.render('admin/modules/tv', render);
      break;
    case 'random':
      render.title = res.__('Случайный');
      res.render('admin/modules/random', render);
      break;
    case 'rewrite':
      render.title = res.__('Рерайт');
      res.render('admin/modules/rewrite', render);
      break;
    case 'app':
      render.title = res.__('Приложение');
      getApps(function(err, apps) {
        if (err) return res.render('error', { message: err });
        render.apps = apps;
        res.render('admin/modules/app', render);
      });
      break;

    case 'poster':
      getMovie(function(err, render) {
        res.redirect(302, render);
      });
      break;

    default:
      render.title = res.__('Панель администратора');
      getCountMovies(function(err, render) {
        res.render('admin/index', render);
      });
      break;
  }

  /**
   * Get movie.
   *
   * @param {Callback} callback
   */

  function getMovie(callback) {
    render.num = num;
    render.all = num;
    render.mass = null;
    render.movie = null;
    render.movies = null;
    render.structure = null;

    if (id) {
      var query = { certainly: true };

      if (kp_id) {
        query['query_id'] = kp_id;
      } else if (imdb_id) {
        query['custom.imdb_id'] = imdb_id;
      } else if (tmdb_id) {
        query['custom.tmdb_id'] = tmdb_id;
      } else if (douban_id) {
        query['custom.douban_id'] = douban_id;
      } else {
        render.movie = {};
        render.structure = {};
        return callback(null, render);
      }

      CP_get.movies(query, 1, 'kinopoisk-id-up', 1, false, function(
        err,
        movies
      ) {
        if (err) console.error(err);
        render.structure = {};
        render.movie = {
          kp_id: kp_id,
          type: type
        };
        render.movie.custom = JSON.stringify({
          imdb_id: imdb_id,
          tmdb_id: tmdb_id,
          douban_id: douban_id
        });
        if (movies && movies.length) {
          render.movie = JSON.parse(JSON.stringify(movies[0]));
          render.structure = CP_structure.movie(movies)[0];
        }
        if (req.params.type === 'poster') {
          callback(
            null,
            render.structure.poster
              ? render.structure.poster
              : config.protocol +
                  config.subdomain +
                  config.domain +
                  '/files/poster/no-poster.jpg'
          );
        } else {
          callback(null, render);
        }
      });
    } else {
      CP_get.movies(
        { from: process.env.CP_RT, certainly: true },
        config.default.count,
        'kinopoisk-id-up',
        num,
        function(err, movies) {
          if (err) console.error(err);

          render.movies = [];

          if (movies && movies.length) {
            render.next = !(movies.length % config.default.count) ? 1 : 0;
            render.movies = movies;
          }

          callback(null, render);
        }
      );
    }
  }

  /**
   * Get content.
   *
   * @param {Callback} callback
   */

  function getContent(callback) {
    render.num = num;
    render.all = num;
    render.content = null;
    render.contents = null;

    if (url === '_add_') {
      render.content = {};
      callback(null, render);
    } else if (url) {
      CP_get.contents({ content_url: url }, 1, 1, false, function(
        err,
        contents
      ) {
        if (err) console.error(err);

        render.content = {};
        render.content.content_url = url;

        if (contents && contents.length) {
          render.content = contents[0];
        }

        callback(null, render);
      });
    } else {
      CP_get.contents({}, 50, num, false, function(err, contents) {
        if (err) console.error(err);

        render.contents = [];

        if (contents && contents.length) {
          render.next = !(contents.length % 50) ? 1 : 0;
          render.contents = contents;
        }

        callback(null, render);
      });
    }
  }

  /**
   * Get comments.
   *
   * @param {Callback} callback
   */

  function getComment(callback) {
    render.num = num;
    render.all = num;
    render.comment = null;
    render.comments = null;

    if (comment_id) {
      CP_get.comments({ comment_id: comment_id }, 1, '', 1, function(
        err,
        comments
      ) {
        if (err) console.error(err);

        render.comment = {};
        render.comment.id = comment_id;

        if (comments && comments.length) {
          render.comment = comments[0];
        }

        callback(null, render);
      });
    } else {
      CP_get.comments({}, 10, '', num, function(err, comments) {
        if (err) console.error(err);

        render.comments = [];

        if (comments && comments.length) {
          render.next = !(comments.length % 10) ? 1 : 0;
          render.comments = comments;
        }

        callback(null, render);
      });
    }
  }

  /**
   * Get count all and publish movies in website.
   *
   * @param {Callback} callback
   */

  function getCountMovies(callback) {
    async.series(
      {
        all: function(callback) {
          CP_get.count({ certainly: true, full: true }, function(err, count) {
            if (err) return callback(err);

            callback(null, count);
          });
        },
        fil: function(callback) {
          CP_get.count({ certainly: true }, function(err, count) {
            if (err) return callback(err);

            callback(null, count);
          });
        },
        pub: function(callback) {
          CP_get.count({}, function(err, count) {
            if (err) return callback(err);

            callback(null, count);
          });
        }
      },
      function(err, result) {
        if (err) {
          console.error(err);
          result = { all: 0, fil: 0, pub: 0 };
        }

        render.line = { counts: result };
        render.line.percent = { all: 100 };
        render.line.percent.fil = render.line.counts.all
          ? Math.round(
              (render.line.percent.all * render.line.counts.fil) /
                render.line.counts.all
            )
          : 0;
        render.line.percent.pub = render.line.counts.all
          ? Math.round(
              (render.line.percent.all * render.line.counts.pub) /
                render.line.counts.all
            )
          : 0;
        render.line.percent.top =
          render.line.counts.pub && render.line.counts.fil
            ? Math.round(
                (render.line.percent.all * render.line.counts.pub) /
                  render.line.counts.fil
              )
            : 0;
        render.line.percent.pub =
          render.line.percent.top === 100 ? 100 : render.line.percent.pub;
        render.line.days =
          render.line.counts.fil - render.line.counts.pub &&
          config.publish.every.movies &&
          config.publish.every.hours
            ? Math.round(
                (render.line.counts.fil - render.line.counts.pub) /
                  Math.round(
                    (24 * config.publish.every.movies) /
                      config.publish.every.hours
                  )
              )
            : 0;

        callback(null, render);
      }
    );
  }

  /**
   * Get themes name.
   *
   * @param {Callback} callback
   */

  function getThemes(callback) {
    var dir = path.join(path.dirname(__filename), '..', 'themes');
    fs.readdir(dir, function(err, files) {
      if (err) return callback(err);
      var dirs = [];
      for (var index = 0; index < files.length; ++index) {
        var file = files[index];
        if (file[0] !== '.') {
          var filePath = path.join(dir, file);
          fs.stat(
            filePath,
            function(err, stat) {
              if (err) return callback(err);
              if (stat.isDirectory()) {
                dirs.push(this.file);
              }
              if (files.length === this.index + 1) {
                return callback(null, dirs);
              }
            }.bind({ index: index, file: file })
          );
        }
      }
    });
  }

  /**
   * Get list apps.
   *
   * @param {Callback} callback
   */

  function getApps(callback) {
    var apps = {};
    var dir_win = path.join(path.dirname(__filename), '..', 'files', 'windows');
    var dir_osx = path.join(path.dirname(__filename), '..', 'files', 'osx');
    var dir_linux = path.join(path.dirname(__filename), '..', 'files', 'linux');
    if (fs.existsSync(dir_win)) {
      var files_win = fs.readdirSync(dir_win);
      files_win.sort(function(a, b) {
        return (
          fs.statSync(dir_win + a).mtime.getTime() -
          fs.statSync(dir_win + b).mtime.getTime()
        );
      });
      apps.windows = files_win[0];
    }
    if (fs.existsSync(dir_osx)) {
      var files_osx = fs.readdirSync(dir_osx);
      files_osx.sort(function(a, b) {
        return (
          fs.statSync(dir_osx + a).mtime.getTime() -
          fs.statSync(dir_osx + b).mtime.getTime()
        );
      });
      apps.osx = files_osx[0];
    }
    if (fs.existsSync(dir_linux)) {
      var files_linux = fs.readdirSync(dir_linux);
      files_linux.sort(function(a, b) {
        return (
          fs.statSync(dir_linux + a).mtime.getTime() -
          fs.statSync(dir_linux + b).mtime.getTime()
        );
      });
      apps.linux = files_linux[0];
    }
    callback(null, apps);
  }
});

router.post('/change', function(req, res) {
  var form = req.body;
  var configs = {
    config: config,
    modules: modules
  };

  if (
    form.movie &&
    (typeof form.movie.tmdb_id !== 'undefined' ||
      typeof form.movie.imdb_id !== 'undefined' ||
      typeof form.movie.douban_id !== 'undefined')
  ) {
    try {
      var custom = {};
      if (form.movie.tmdb_id && form.movie.tmdb_id.replace(/[^0-9]/g, '')) {
        custom.tmdb_id = form.movie.tmdb_id.replace(/[^0-9]/g, '');
      }
      if (form.movie.imdb_id && form.movie.imdb_id.replace(/[^0-9]/g, '')) {
        custom.imdb_id = form.movie.imdb_id.replace(/[^0-9]/g, '');
      }
      if (form.movie.douban_id && form.movie.douban_id.replace(/[^0-9]/g, '')) {
        custom.douban_id = form.movie.douban_id.replace(/[^0-9]/g, '');
        delete form.movie.douban_id;
      }
      delete form.movie.tmdb_id;
      delete form.movie.imdb_id;
      delete form.movie.douban_id;
      form.movie.custom = JSON.stringify(
        Object.assign(JSON.parse(form.movie.custom), custom)
      );
    } catch (e) {
      console.error(e);
    }
  }

  async.series(
    {
      id: function(callback) {
        if (form.movie && (form.movie.kp_id || form.movie.id)) {
          var id = form.movie.id || form.movie.kp_id || '';
          id = ('' + id).replace(/[^0-9]/g, '');
          form.movie.id = form.movie.kp_id =
            id && parseInt(id) ? parseInt(id) : 0;
        }
        if (form.movie && !form.movie.id) {
          CP_get.movies(
            { certainly: true },
            1,
            'kinopoisk-id-up',
            1,
            false,
            function(err, movies) {
              if (err) console.error(err);
              var id = 10000000;
              form.movie.id = form.movie.kp_id =
                movies && movies.length && parseInt(movies[0].id) <= id
                  ? id + 1
                  : parseInt(movies[0].id) + 1;
              callback(null, form.movie.id);
            }
          );
        } else {
          callback(null, 'Null');
        }
      },
      keys: function(callback) {
        if (form.movie && form.movie.id) {
          var id = '' + form.movie.id;
          var keys = config.index.ids.keys.split(',');
          var count = config.index.ids.count;
          if (keys.length) {
            var i = keys.indexOf(id);
            if (i + 1) keys.splice(i, 1);
          }
          if (!form.delete) {
            keys.unshift(id);
            keys = keys.slice(0, count);
          }
          form.config = {
            index: {
              ids: {
                keys: keys
                  .filter(function(key) {
                    return !!key.replace(/[^0-9]/, '');
                  })
                  .join(',')
              }
            }
          };
          form.flush_memcached = true;
          callback(null, 'Keys');
        } else {
          callback(null, 'Null');
        }
      },
      config: function(callback) {
        if (!form.config) return callback(null, 'Null');
        form.flush_memcached = true;
        if (
          (form.config.urls &&
            form.config.urls.admin &&
            form.config.urls.admin !== configs.config.urls.admin &&
            /^admin/.test(form.config.urls.admin)) ||
          (form.config.theme && form.config.theme !== configs.config.theme) ||
          (form.config.language &&
            form.config.language !== configs.config.language)
        ) {
          form.restart = true;
        }
        if (
          form.config.urls &&
          form.config.urls.admin &&
          /^admin/.test(form.config.urls.admin) === false
        ) {
          form.config.urls.admin = configs.config.urls.admin;
        }
        configs.config = parseData(configs.config, form.config);
        CP_save.save(configs.config, 'config', function(err, result) {
          return err ? callback(err) : callback(null, result);
        });
      },
      modules: function(callback) {
        if (!form.modules) return callback(null, 'Null');
        form.flush_memcached = true;
        configs.modules = parseData(configs.modules, form.modules);
        CP_save.save(configs.modules, 'modules', function(err, result) {
          return err ? callback(err) : callback(null, result);
        });
      },
      movie: function(callback) {
        if (!form.movie || !form.movie.id) return callback(null, 'Null');
        form.flush_memcached = true;
        form.movie.search = form.movie.title_ru
          ? form.movie.title_ru +
            (form.movie.title_en ? ' / ' + form.movie.title_en : '')
          : form.movie.title_en
          ? form.movie.title_en
          : '';
        form.movie.premiere =
          form.movie.premiere &&
          !isNaN(new Date(form.movie.premiere).getFullYear())
            ? Math.floor(
                new Date(form.movie.premiere).getTime() / 1000 / 60 / 60 / 24 +
                  719528
              ) + ''
            : '0';
        form.movie.country = form.movie.country
          ? form.movie.country
              .replace(/\s*,\s*/g, ',')
              .replace(/\s+/g, ' ')
              .replace(/(^\s*)|(\s*)$/g, '')
          : '_empty';
        form.movie.genre = form.movie.genre
          ? form.movie.genre
              .replace(/\s*,\s*/g, ',')
              .replace(/\s+/g, ' ')
              .replace(/(^\s*)|(\s*)$/g, '')
          : '_empty';
        form.movie.director = form.movie.director
          ? form.movie.director
              .replace(/\s*,\s*/g, ',')
              .replace(/\s+/g, ' ')
              .replace(/(^\s*)|(\s*)$/g, '')
          : '_empty';
        form.movie.actor = form.movie.actor
          ? form.movie.actor
              .replace(/\s*,\s*/g, ',')
              .replace(/\s+/g, ' ')
              .replace(/(^\s*)|(\s*)$/g, '')
          : '_empty';
        form.movie.type = form.movie.type ? form.movie.type : '0';
        form.movie.poster = form.movie.poster ? form.movie.poster : '';
        addMovie(form.movie, function(err, result) {
          return err ? callback(err) : callback(null, result);
        });
      },
      switch: function(callback) {
        if (!form.switch || !form.switch.module || !modules[form.switch.module])
          return callback(null, 'Null');
        form.flush_memcached = true;
        configs.modules[form.switch.module].status =
          form.switch.status === 'true';
        CP_save.save(configs.modules, 'modules', function(err, result) {
          return err ? callback(err) : callback(null, result);
        });
      },
      content: function(callback) {
        if (!form.content) return callback(null, 'Null');
        form.flush_memcached = true;
        if (form.delete) {
          if (!form.content.id) return callback(null, 'Null');
          form.content.delete = true;
        }
        CP_save.save(form.content, 'content', function(err, result) {
          return err ? callback(err) : callback(null, result);
        });
      },
      comment: function(callback) {
        if (!form.comment) return callback(null, 'Null');
        form.flush_memcached = true;
        if (form.delete) {
          if (!form.comment.id) return callback(null, 'Null');
          form.comment.delete = true;
        }
        CP_save.save(form.comment, 'comment', function(err, result) {
          return err ? callback(err) : callback(null, result);
        });
      },
      pagespeed: function(callback) {
        if (!form.config || typeof form.config.pagespeed === 'undefined')
          return callback(null, 'Null');
        exec(
          '/usr/bin/cinemapress container speed ' + form.config.pagespeed,
          function(err) {
            setTimeout(function() {
              form.flush = true;
              return err ? callback(err) : callback(null, 'PageSpeed');
            }, 5000);
          }
        );
      },
      protocol: function(callback) {
        if (!form.config || typeof form.config.protocol === 'undefined')
          return callback(null, 'Null');
        exec(
          '/usr/bin/cinemapress container protocol "' +
            form.config.protocol +
            '"',
          function(err) {
            setTimeout(function() {
              form.flush = true;
              return err ? callback(err) : callback(null, 'Protocol');
            }, 5000);
          }
        );
      },
      flush: function(callback) {
        if (!form.flush) return callback(null, 'Null');
        form.flush_static = true;
        form.flush_memcached = true;
        return callback(null, 'Flush');
      },
      flush_static: function(callback) {
        if (!form.flush_static) return callback(null, 'Null');
        exec('touch /var/ngx_pagespeed_cache/cache.flush', function(err) {
          process.env.CP_VER = process.env.CP_VER
            ? parseInt(process.env.CP_VER) + 1
            : new Date().getTime().toString();
          return err ? callback(err) : callback(null, 'FlushStatic');
        });
      },
      flush_memcached: function(callback) {
        if (!form.flush_memcached) return callback(null, 'Null');
        CP_cache.flush(function(err) {
          if (err) {
            if ((err + '').indexOf('not available') === -1) {
              console.error(err);
            }
          }
          process.env.CP_VER = process.env.CP_VER
            ? parseInt(process.env.CP_VER) + 1
            : new Date().getTime().toString();
          return callback(null, 'FlushMemcached');
        });
      },
      database: function(callback) {
        if (!form.database) return callback(null, 'Null');
        exec(
          'nohup /usr/bin/cinemapress database ' +
            config.domain +
            ' ' +
            form.database +
            ' > ' +
            path.join(path.dirname(__filename), '..', 'log', 'database.log') +
            ' &',
          function(err) {
            setTimeout(function() {
              return err ? callback(err) : callback(null, 'Database');
            }, 1000 * 60 * 9.5);
          }
        );
      },
      restart: function(callback) {
        if (!form.restart) return callback(null, 'Null');
        exec(
          'cd /home/' +
            config.domain +
            ' && pm2 restart process.json --update-env',
          function(err) {
            return err ? callback(err) : callback(null, 'Restart');
          }
        );
      }
    },
    function(err, result) {
      return err ? res.status(404).send(err) : res.json(result);
    }
  );

  /**
   * Determine what the configuration settings have been changed.
   *
   * @param {Object} config
   * @param {Object} changes
   * @return {Object}
   */

  function parseData(config, changes) {
    var originals = config;

    for (var key in originals) {
      if (originals.hasOwnProperty(key) && changes.hasOwnProperty(key)) {
        if (Array.isArray(originals[key])) {
          var arr =
            typeof changes[key] === 'string'
              ? changes[key].split(',')
              : Array.isArray(changes[key])
              ? changes[key]
              : [];
          var clear_arr = [];
          arr.forEach(function(text) {
            text = text
              .replace(/(^\s*)|(\s*)$/g, '')
              .replace(/\u2028/g, '')
              .replace(/\u2029/g, '');
            if (text) {
              clear_arr.push(text);
            }
          });
          originals[key] = clear_arr;
        } else if (typeof originals[key] === 'string') {
          originals[key] = ('' + changes[key])
            .replace(/\u2028/g, '')
            .replace(/\u2029/g, '');
        } else if (typeof originals[key] === 'number') {
          originals[key] = parseInt(changes[key]);
        } else if (typeof originals[key] === 'boolean') {
          originals[key] = changes[key] === 'true';
        } else if (typeof originals[key] === 'object') {
          originals[key] = parseData(originals[key], changes[key]);
        }
      }
    }

    return originals;
  }

  /**
   * Add movie in rt.
   *
   * @param {Object} movie
   * @param {Callback} callback
   */

  function addMovie(movie, callback) {
    if (form.delete) {
      movie.delete = true;
    }
    CP_save.save(movie, 'rt', function(err, result) {
      return err ? callback(err) : callback(null, result);
    });
  }
});

router.post('/upload/:renamed?', function(req, res) {
  var filepath = path.join(__dirname, '..', 'files');
  var filename = 'CinemaPress.png';
  var fieldname = '';
  var storage = multer.diskStorage({
    destination: function(req, file, cb) {
      fieldname =
        file.fieldname === 'content_image' ? 'content' : file.fieldname;
      exec(
        'mkdir -p ' +
          path.join(filepath, fieldname, 'original') +
          ' ' +
          path.join(filepath, fieldname, 'medium') +
          ' ' +
          path.join(filepath, fieldname, 'small'),
        function(err) {
          if (err) {
            console.error(err);
            return res.status(404).send('{"error": "MKDIR"}');
          }
          cb(null, path.join(filepath, fieldname, 'original'));
        }
      );
    },
    filename: function(req, file, cb) {
      filename =
        req && req.params && req.params.renamed
          ? req.params.renamed + path.extname(file.originalname)
          : Date.now() + '-' + file.originalname;
      cb(null, filename);
    }
  });

  var upload = multer({
    storage: storage,
    fileFilter: function(req, file, callback) {
      var ext = path.extname(file.originalname);
      if (
        ext !== '.png' &&
        ext !== '.jpg' &&
        ext !== '.gif' &&
        ext !== '.jpeg'
      ) {
        return callback('Only images are allowed', null);
      }
      callback(null, true);
    }
  }).any();

  upload(req, res, function(err) {
    if (err) {
      console.error(err);
      return res.status(404).send('{"error": "UPLOAD"}');
    }
    async.eachOfLimit(
      ['medium', 'small'],
      1,
      function(size, key, callback) {
        Sharp.cache(false);
        Sharp(path.join(filepath, fieldname, 'original', filename))
          .resize({
            width: size === 'medium' ? 500 : 120,
            withoutEnlargement: true
          })
          .jpeg({ quality: 80, progressive: true, force: false })
          .webp({ quality: 80, lossless: true, force: false })
          .png({ quality: 80, compressionLevel: 8, force: false })
          .toFile(path.join(filepath, fieldname, size, filename), function(
            err
          ) {
            callback(err);
          });
      },
      function(err) {
        if (err) {
          console.error(err);
          res
            .status(200)
            .send(
              '{"file": "' +
                path.join('/', 'files', fieldname, 'original', filename) +
                '"}'
            );
        }
        res
          .status(200)
          .send(
            '{"file": "' +
              path.join('/', 'files', fieldname, 'medium', filename) +
              '"}'
          );
      }
    );
  });
});

router.post('/rewrite', function(req, res) {
  sinoni({
    token: modules.rewrite.data.token,
    double: modules.rewrite.data.double,
    unique: modules.rewrite.data.unique,
    text: req.body.text,
    lang: config.language
  })
    .then(function(result) {
      return res.status(200).json(result);
    })
    .catch(function(error) {
      console.error(error);
      return res.status(404).json(error);
    });
});

module.exports = router;
