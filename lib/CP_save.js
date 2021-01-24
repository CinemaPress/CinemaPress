'use strict';

/**
 * Module dependencies.
 */

var CP_sphinx = require('../lib/CP_sphinx');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../config/production/config.backup'));

/**
 * Node dependencies.
 */

var async = require('async');
var path = require('path');
var exec = require('child_process').exec;
var fs = require('fs');

/**
 * Callback.
 *
 * @callback Callback
 * @param {Object} err
 * @param {String} [result]
 */

/**
 * Save config.
 *
 * @param {Object} content_raw
 * @param {String} name
 * @param {Callback} callback
 */

function saveContent(content_raw, name, callback) {
  var content = Object.assign(
    {},
    typeof content_raw === 'object' ? content_raw : {}
  );
  if (name === 'config' || name === 'modules') {
    if (
      name === 'config' &&
      typeof content === 'object' &&
      config.domain !== content.domain
    ) {
      config.domain = content.domain;
    }

    var data = JSON.stringify(content, null, '\t');
    var dir = path.join(path.dirname(__filename), '..', 'config', 'production');
    cp(
      path.join(dir, name + '.js'),
      path.join(dir, name + '.prev.js'),
      function(err) {
        if (err) return callback(err);
        fs.writeFile(
          path.join(dir, name + '.js'),
          'module.exports = ' + data + ';',
          function(err) {
            if (err) {
              cp(
                path.join(dir, name + '.prev.js'),
                path.join(dir, name + '.js'),
                function(err) {
                  if (err) console.error(err);
                }
              );
              return callback(err);
            }
            exec('pm2 id ' + config.domain, function(err, ids) {
              try {
                ids = ids ? JSON.parse(ids) : [];
              } catch (e) {
                ids = [];
              }
              async.eachOfLimit(
                ids,
                1,
                function(id, key, callback) {
                  if (
                    typeof process.env.pm_id === 'undefined' ||
                    parseInt(id) === parseInt(process.env.pm_id)
                  ) {
                    callback(null);
                  } else {
                    exec('pm2 reload ' + id, function(err) {
                      return err ? callback(err) : callback(null);
                    });
                  }
                },
                function(err) {
                  cp(
                    path.join(dir, name + '.js'),
                    path.join(dir, name + '.backup.js'),
                    function(err) {
                      if (err) console.error(err);
                    }
                  );
                  return err
                    ? callback(err)
                    : callback(null, [process.env.pm_id, ids]);
                }
              );
            });
          }
        );
      }
    );
  } else {
    var db = name + '_' + config.domain.replace(/[^A-Za-z0-9]/g, '_');

    if (content.delete) {
      CP_sphinx.query(
        'DELETE FROM ' + db + ' WHERE id IN (' + content.id + ')',
        function(err) {
          if (err) return callback(err);
          callback(null, 'Delete ID ' + content.id);
        }
      );
    } else if (content.id) {
      if (
        content.duplicate &&
        (content.actor ||
          content.genre ||
          content.country ||
          content.director ||
          content.year)
      ) {
        return callback(null, '');
      }
      CP_sphinx.query(
        'SELECT * FROM ' +
          process.env[
            'CP' + '_' + (name === 'comment' ? 'COMMENT' : 'XML' + 'PIPE' + '2')
          ] +
          (content.duplicate ? ', ' + process.env['CP' + '_' + 'RT'] : '') +
          ' WHERE id = ' +
          content.id,
        function(err, results) {
          if (err) return callback(err);
          var result = results && results.length ? results[0] : {};
          delete content.duplicate;
          try {
            var cnt = content.custom
              ? typeof content.custom === 'string'
                ? JSON.parse(content.custom)
                : typeof content.custom === 'object'
                ? content.custom
                : {}
              : {};
            var res = result.custom
              ? typeof result.custom === 'string'
                ? JSON.parse(result.custom)
                : typeof result.custom === 'object'
                ? result.custom
                : {}
              : {};
            cnt = Object.assign({}, res, cnt);
            content.custom = JSON.stringify(cnt);
          } catch (e) {
            console.error(e);
          }
          var content_query = Object.assign({}, result, content);
          if (
            content_query.title_ru ||
            content_query.title_en ||
            content_query.user_login ||
            content_query.content_title ||
            content_query.comment_text
          ) {
            var query = insertQuery(content_query, name);
            if (query) {
              CP_sphinx.query(query, function(err) {
                if (err) return callback(err);
                callback(
                  null,
                  'Insert ID ' +
                    (content_query.id ||
                      content_query.kp_id ||
                      content_query.content_url ||
                      content_query.comment_id)
                );
              });
            } else {
              callback(
                JSON.stringify({
                  status: 'error',
                  name: name,
                  content: content_query
                })
              );
            }
          } else {
            callback(null, '');
          }
        }
      );
    } else {
      var query = insertQuery(content, name);
      if (query) {
        CP_sphinx.query(query, function(err) {
          if (err) return callback(err);
          callback(null, 'Insert data.');
        });
      } else {
        callback(
          JSON.stringify({ status: 'error', name: name, content: content })
        );
      }
    }
  }

  /**
   * Copy config.
   *
   * @param {String} oldName
   * @param {String} newName
   * @param {Callback} callback
   */

  function cp(oldName, newName, callback) {
    exec('cp ' + oldName + ' ' + newName, function(error, stdout, stderr) {
      if (error) {
        console.error(error);
        return callback('ERROR: cp ' + oldName + ' ' + newName);
      }
      if (stdout) console.log(stdout);
      if (stderr) console.log(stderr);
      callback(null);
    });
  }

  /**
   * Create insert query.
   *
   * @param {Object} content
   * @param {String} name
   * @return {String}
   */

  function insertQuery(content, name) {
    var id = content.id ? content.id : 0;
    delete content.id;

    if (name === 'rt') {
      if (!id) {
        id = content.kp_id;
      }
      if (!content.kp_id) {
        content.kp_id = id;
      }
      if (!content.query_id) {
        content.query_id = content.kp_id;
      }
      if (!content.search) {
        content.search = content['title_ru']
          ? content['title_ru'] +
            (content['title_en'] ? ' / ' + content['title_en'] : '')
          : content['title_en'];
      }
      if (content.custom) {
        try {
          var cst;
          if (typeof content.custom === 'string') {
            cst = JSON.parse(content.custom);
          } else {
            cst = content.custom;
          }
          cst.unique = typeof cst.unique !== 'undefined' ? cst.unique : true;
          cst.lastmod = new Date().toJSON();
          content.custom = JSON.stringify(cst);
        } catch (e) {
          console.error(e);
          content.custom = JSON.stringify({
            unique: true,
            lastmod: new Date().toJSON()
          });
        }
      } else {
        content.custom = JSON.stringify({
          unique: true,
          lastmod: new Date().toJSON()
        });
      }
      if (!content.all_movies) {
        content.all_movies =
          '_' + config.domain.replace(/[^A-Za-z0-9]/g, '_') + '_';
      }
    } else if (name === 'content') {
      if (!id) {
        id = new Date().getTime();
      }
      if (!content.all_contents) {
        content.all_contents =
          '_' + config.domain.replace(/[^A-Za-z0-9]/g, '_') + '_';
      }
      content.content_publish =
        new Date().getTime() + 719528 * 1000 * 60 * 60 * 24;
    } else if (name === 'comment') {
      if (!id) {
        id = content.comment_id || new Date().getTime();
      }
      if (!content.all_comments) {
        content.all_comments =
          '_' + config.domain.replace(/[^A-Za-z0-9]/g, '_') + '_';
      }
      if (!content.comment_publish) {
        content.comment_publish =
          new Date().getTime() + 719528 * 1000 * 60 * 60 * 24;
      }
      content.comment_id = id;
    }

    var list = {
      rt: [
        'id',
        'kp_id',
        'rating',
        'vote',
        'kp_rating',
        'kp_vote',
        'imdb_rating',
        'imdb_vote',
        'premiere',
        'type',
        'poster',
        'title_ru',
        'title_en',
        'title_page',
        'description',
        'description_short',
        'pictures',
        'custom',
        'query_id',
        'search',
        'year',
        'country',
        'director',
        'genre',
        'actor',
        'player',
        'translate',
        'quality',
        'all_movies'
      ],
      user: [
        'user_id',
        'user_custom',
        'user_login',
        'user_avatar',
        'user_email',
        'user_confirm',
        'user_date',
        'user_text',
        'all_users'
      ],
      content: [
        'content_publish',
        'content_url',
        'content_title',
        'content_description',
        'content_image',
        'content_tags',
        'content_movies',
        'all_contents'
      ],
      comment: [
        'comment_custom',
        'comment_publish',
        'comment_id',
        'content_id',
        'movie_id',
        'season_id',
        'episode_id',
        'user_id',
        'reply_id',
        'comment_like',
        'comment_dislike',
        'comment_confirm',
        'comment_star',
        'comment_url',
        'comment_text',
        'comment_title',
        'comment_anonymous',
        'comment_avatar',
        'comment_admin',
        'comment_ip',
        'comment_vote_ip',
        'all_comments'
      ]
    };

    var req_key_success = false;
    var req_key = [
      'title_ru',
      'title_en',
      'user_login',
      'content_title',
      'comment_text'
    ];

    var keys = Object.keys(content).filter(function(k) {
      return list[name].indexOf(k.toLowerCase()) !== -1;
    });
    var insert = [];
    for (var i = 0, len = keys.length; i < len; i++) {
      if (req_key.indexOf(keys[i]) + 1 && content[keys[i]]) {
        req_key_success = true;
      }
      insert.push(sphinxEscape(content[keys[i]]));
    }

    keys.unshift('id');
    insert.unshift(id);

    var db = name + '_' + config.domain.replace(/[^A-Za-z0-9]/g, '_');

    return req_key_success
      ? 'REPLACE INTO ' +
          db +
          ' ( ' +
          keys.join(', ') +
          " ) VALUES ( '" +
          insert.join("', '") +
          "' )"
      : '';
  }

  function sphinxEscape(stringToEscape) {
    return ('' + stringToEscape)
      .replace(/\\*'/gi, "\\'")
      .replace(/\\+$/gi, '\\\\')
      .replace(/\n/gi, '\\n')
      .replace(/\r/gi, '\\r');
  }
}

module.exports = {
  save: saveContent
};
