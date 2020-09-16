'use strict';

/**
 * Configuration dependencies.
 */

var modules = require('../config/production/modules');
Object.keys(modules).length === 0 &&
  (modules = require('../config/production/modules.backup'));

/**
 * Adding social page for all page website.
 *
 * @return {Object}
 */

function pagesSocial() {
  return modules.social.data;
}

module.exports = {
  pages: pagesSocial
};
