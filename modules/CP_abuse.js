'use strict';

/**
 * Configuration dependencies.
 */

var modules = require('../config/production/modules');

/**
 * Adding the ability to hide the movie.
 *
 * @return {Object}
 */

function hideAbuse() {
  return modules.abuse.data.movies;
}

module.exports = {
  hide: hideAbuse
};
