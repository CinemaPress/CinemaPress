'use strict';

/**
 * Module dependencies.
 */

var CP_cache = require('./CP_cache');

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
    var connection = sphinx.createConnection({});

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
    exec('searchd --stop');
    setTimeout(function() {
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
