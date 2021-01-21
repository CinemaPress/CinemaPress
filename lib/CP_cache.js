'use strict';

/**
 * Node dependencies.
 */

var LRUCache = require('mnemonist/lru-cache');
var cache = new LRUCache(10000);

module.exports = {
  set: function(hash, data, time, callback) {
    if (!process.env['NO_CACHE']) {
      cache.set(hash, data);
    }
    return callback();
  },
  get: function(hash, callback) {
    return !process.env['NO_CACHE']
      ? callback(null, cache.get(hash))
      : callback(null, undefined);
  },
  flush: function(callback) {
    cache.clear();
    return callback();
  }
};
