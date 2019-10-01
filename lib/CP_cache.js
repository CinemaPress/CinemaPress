'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');

/**
 * Node dependencies.
 */

var Memcached = require('memcached');

var addrs =
  config && config.cache && config.cache.addr
    ? config.cache.addr.split(',').map(function(addr) {
        return addr.trim();
      })
    : ['127.0.0.1:11211'];

module.exports = new Memcached(addrs[Math.floor(Math.random() * addrs.length)]);
