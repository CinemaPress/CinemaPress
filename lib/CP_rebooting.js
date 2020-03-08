'use strict';

module.exports = function() {
  return function(req, res, next) {
    next({ status: 503, message: 'Rebooting' });
  };
};
