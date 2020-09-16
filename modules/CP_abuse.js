'use strict';

/**
 * Configuration dependencies.
 */

var modules = require('../config/production/modules');
Object.keys(modules).length === 0 &&
  (modules = require('../config/production/modules.backup'));

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
