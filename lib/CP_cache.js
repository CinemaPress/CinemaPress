'use strict';

/**
 * Node dependencies.
 */

var LRUCache = require('mnemonist/lru-cache');
var cache = new LRUCache(10000);
var lingTimeCache = new LRUCache(10000);

module.exports = {
  set: function(hash, data, callback) {
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
  setSync: function(hash, data) {
    if (!process.env['NO_CACHE']) {
      cache.set(hash, data);
    }
  },
  getSync: function(hash) {
    return !process.env['NO_CACHE'] ? cache.get(hash) : undefined;
  },
  setSyncLing: function(hash, data) {
    if (!process.env['NO_CACHE']) {
      lingTimeCache.set(hash, data);
    }
  },
  getSyncLong: function(hash) {
    return !process.env['NO_CACHE'] ? lingTimeCache.get(hash) : undefined;
  },
  flush: function(callback) {
    process.env.CP_VER = process.env.CP_VER
      ? parseInt(process.env.CP_VER) + 1
      : new Date().getTime().toString();
    Object.keys(require.cache).forEach(function(key) {
      delete require.cache[key];
    });
    var config = require('../config/production/config');
    Object.keys(config).length === 0 &&
      (config = require('../config/production/config.backup'));
    var modules = require('../config/production/modules');
    Object.keys(modules).length === 0 &&
      (modules = require('../config/production/modules.backup'));
    process.env.CP_CONFIG_MD5 = require('md5')(JSON.stringify(config));
    process.env.CP_MODULES_MD5 = require('md5')(JSON.stringify(modules));
    cache.clear();
    return callback();
  }
};
