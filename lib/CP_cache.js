'use strict';

/**
 * Node dependencies.
 */

var Memcached = require('memcached');

module.exports = new Memcached('127.0.0.1:11211');
