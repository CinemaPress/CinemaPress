'use strict';

/**
 * Node dependencies.
 */

var LRUCache = require('mnemonist/lru-cache');
var cache = new LRUCache(10000);

module.exports = {
  set: function(hash, data, time, callback) {
    cache.set(hash, data);
    return callback();
  },
  get: function(hash, callback) {
    return callback(null, cache.get(hash));
  },
  flush: function(callback) {
    cache.clear();
    return callback();
  }
};
