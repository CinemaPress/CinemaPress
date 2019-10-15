'use strict';

/**
 * Node dependencies.
 */

var async = require('async');
var path = require('path');
var exec = require('child_process').exec;
var fs = require('fs');

/**
 * Global env.
 */

try {
  var p = tryParseJSON(
    fs.readFileSync(
      path.join(path.dirname(__filename), '..', '..', 'process.json'),
      'utf8'
    )
  );
  var e = p.apps[0].env;
  for (var prop in e) {
    if (e.hasOwnProperty(prop)) {
      process.env[prop] = e[prop];
    }
  }
} catch (err) {
  console.log('NOT FILE PROCESS DATA');
  process.exit();
}

/**
 * Valid JSON.
 *
 * @param {String} jsonString
 */

function tryParseJSON(jsonString) {
  try {
    var o = JSON.parse(jsonString);
    if (o && typeof o === 'object') {
      return o;
    }
  } catch (e) {}
  return {};
}

/**
 * Module dependencies.
 */

var CP_save = require(path.join(path.dirname(__filename), '..', '..', 'lib', 'CP_save.min.js'));

/**
 * Configuration dependencies.
 */

var config = require(path.join(__dirname, '..', 'production', 'config.js'));
var modules = require(path.join(__dirname, '..', 'production', 'modules.js'));

/**
 * Check files.
 */

try {
  fs.statSync(path.join(__dirname, '..', 'default', 'config.js'));
  fs.statSync(path.join(__dirname, '..', 'default', 'modules.js'));
} catch (err) {
  console.log('NOT DEFAULT CONFIG AND MODULES');
  process.exit();
}

/**
 * New configuration dependencies.
 */

var config_default = require(path.join(__dirname, '..', 'default', 'config.js'));
var modules_default = require(path.join(__dirname, '..', 'default', 'modules.js'));

var prt = fs.existsSync(path.join(__dirname, '..', 'production', 'nginx', 'ssl.d', 'live', config.domain))
  ? ''
  : 'protocol';

var cdn = true;
var cnt = true;

function objReplace(obj_new, obj_old) {
  obj_new = JSON.stringify(obj_new);
  obj_new = JSON.parse(obj_new);

  obj_old = JSON.stringify(obj_old);
  obj_old = JSON.parse(obj_old);

  for (var key in obj_new) {
    if (obj_new.hasOwnProperty(key) && obj_old.hasOwnProperty(key)) {
      if (typeof obj_new[key] === 'object' && !Array.isArray(obj_new[key])) {
        if (key === 'image') cdn = false;
        if (key === 'count') cnt = false;
        obj_new[key] = objReplace(obj_new[key], obj_old[key]);
      } else {
        if (typeof obj_new[key] === typeof obj_old[key]) {
          if (
            (key === 'addr' && cdn) ||
            (key === 'key' && cnt) ||
            key === prt ||
            key === 'domain' ||
            key === 'date'
          )
            continue;
          obj_new[key] = obj_old[key];
          cdn = true;
        }
      }
    }
  }

  return obj_new;
}

function objAdd(obj_new, obj_old) {
  obj_new = JSON.stringify(obj_new);
  obj_new = JSON.parse(obj_new);

  obj_old = JSON.stringify(obj_old);
  obj_old = JSON.parse(obj_old);

  for (var key in obj_old) {
    if (obj_old.hasOwnProperty(key) && obj_new.hasOwnProperty(key)) {
      if (typeof obj_old[key] === 'object' && !Array.isArray(obj_old[key])) {
        obj_new[key] = objAdd(obj_new[key], obj_old[key]);
      }
    } else if (obj_old.hasOwnProperty(key) && !obj_new.hasOwnProperty(key)) {
      obj_new[key] = obj_old[key];
    }
  }

  return obj_new;
}

async.series(
  {
    config: function(callback) {
      CP_save.save(
        objAdd(objReplace(config_default, config), config),
        'config',
        function(err, result) {
          return err ? callback(err) : callback(null, result);
        }
      );
    },
    modules: function(callback) {
      CP_save.save(
        objAdd(objReplace(modules_default, modules), modules),
        'modules',
        function(err, result) {
          return err ? callback(err) : callback(null, result);
        }
      );
    }
  },
  function(err, result) {
    if (err) return console.error(err);
    exec('pm2 reload ' + config.domain, function(
      error,
      stdout,
      stderr
    ) {
      if (stdout) console.log(stdout);
      if (stderr) console.log(stderr);
      return error ? console.error(error) : console.log(null, 'Reload server.');
    });
  }
);
