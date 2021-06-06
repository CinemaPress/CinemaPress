'use strict';

/**
 * Module dependencies.
 */

var CP_cache = require('./CP_cache');

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../config/production/config.backup'));
var config_md5 = require('md5')(JSON.stringify(config));

setInterval(function() {
  if (
    config_md5 &&
    process.env['CP_CONFIG_MD5'] &&
    config_md5 !== process.env['CP_CONFIG_MD5']
  ) {
    config = require('../config/production/config');
    Object.keys(config).length === 0 &&
      (config = require('../config/production/config.backup'));
    config_md5 = process.env['CP_CONFIG_MD5'];
  }
}, 3333);

/**
 * Node dependencies.
 */

var exec = require('child_process').exec;
var sphinx = require('sphinx');
var md5 = require('md5');

/**
 * Callback.
 *
 * @callback Callback
 * @param {Object} err
 * @param {Object} [render]
 */

/**
 * Query to sphinx.
 *
 * @param {String} query
 * @param {Callback} callback
 */

function sphinxQuery(query, callback) {
  var hash = md5(query);

  return CP_cache.get(hash, function(err, render) {
    return render
      ? callback(null, render)
      : getSphinx(function(err, render) {
          return err ? callback(err) : callback(null, render);
        });
  });

  /**
   * Sphinx.
   *
   * @param {Callback} callback
   */

  function getSphinx(callback) {
    var cc = 'rt_' + config.database.all_movies.replace(/[^a-z0-9]/gi, '_');
    var connection = sphinx.createConnection(
      query.indexOf(cc) + 1 ? config.database : {}
    );

    connection.connect(function(err) {
      if (err) {
        connection.end();
        if (
          err.code === 'PROTOCOL_CONNECTION_LOST' ||
          err.code === 'ECONNREFUSED'
        ) {
          restartSphinx(function(err, render) {
            callback(err, render);
          });
        } else {
          callback(err);
        }
      } else {
        connection.query(query, function(err, results) {
          connection.end();
          if (err) return callback(err);

          callback(null, results);

          if (results && !process.env['NO_CACHE']) {
            CP_cache.set(hash, results, function(err) {});
          }
        });
      }
    });
  }

  /**
   * Restart sphinx.
   *
   * @param {Callback} callback
   */

  function restartSphinx(callback) {
    console.log('[restartSphinx] searchd --stop');
    exec('searchd --stop');
    setTimeout(function() {
      console.log('[restartSphinx] searchd');
      exec('searchd');
      setTimeout(function() {
        getSphinx(function(err, render) {
          return err ? callback(err) : callback(null, render);
        });
      }, 2500);
    }, 2500);
  }
}

module.exports = {
  query: sphinxQuery
};
