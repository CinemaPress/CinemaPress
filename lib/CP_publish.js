'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
Object.keys(config).length === 0 &&
  (config = require('../config/production/config.backup'));

/**
 * Formation of the query term.
 *
 * @param {Object} q
 * @param {Object} [certainly]
 * @return {Object}
 */

function queryConditionPublish(q, certainly) {
  var where = config.publish.required.length
    ? config.publish.required.map(function(ctgry) {
        return ' AND `' + ctgry.trim() + "` != '' ";
      })
    : [];
  where = where.length ? where.join(' ') : '';

  if (
    certainly ||
    (config.publish.start <= 298 && config.publish.stop >= 3000000)
  ) {
    q._select = ', 1 AS movie ';
  } else {
    if (config.publish.start > 298 && config.publish.stop >= 3000000) {
      q._select = ', ( ' + 'kp_id >= ' + config.publish.start + ' ) AS movie';
    } else if (config.publish.start <= 298 && config.publish.stop < 3000000) {
      q._select = ', ( ' + 'kp_id <= ' + config.publish.stop + ' ) AS movie';
    } else {
      q._select =
        ', ( ' +
        'kp_id >= ' +
        config.publish.start +
        ' AND ' +
        'kp_id <= ' +
        config.publish.stop +
        ' ) AS movie';
    }
  }

  q._where = ' AND movie > 0 ' + where;

  return q;
}

/**
 * Terms thematic site.
 *
 * @return {Object}
 */

function thematicPublish() {
  var publish = {};
  publish.where_config = [];
  publish.match_config = [];

  if (config.publish.thematic.type) {
    publish.where_config.push(
      '`type` = ' + parseInt(config.publish.thematic.type)
    );
  }

  if (config.publish.thematic.kp_vote) {
    publish.where_config.push(
      '`kp_vote` > ' + parseInt(config.publish.thematic.kp_vote)
    );
  }

  if (config.publish.thematic.imdb_vote) {
    publish.where_config.push(
      '`imdb_vote` > ' + parseInt(config.publish.thematic.imdb_vote)
    );
  }

  Object.keys(config.publish.thematic).forEach(function(key) {
    if (
      config.publish.thematic[key] &&
      key !== 'type' &&
      key !== 'kp_vote' &&
      key !== 'imdb_vote'
    ) {
      publish.match_config.push('@' + key + ' ' + config.publish.thematic[key]);
    }
  });

  return publish;
}

module.exports = {
  queryCondition: queryConditionPublish,
  thematic: thematicPublish
};
