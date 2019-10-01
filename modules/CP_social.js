'use strict';

/**
 * Configuration dependencies.
 */

var modules = require('../config/production/modules');

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
