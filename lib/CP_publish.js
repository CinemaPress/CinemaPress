'use strict';

/**
 * Formation of the query term.
 *
 * @param {Object} config
 * @param {Object} q
 * @param {Object} [certainly]
 * @return {Object}
 */

function queryConditionPublish(config, q, certainly) {
  var where = config.publish.required.length
    ? config.publish.required.map(function(ctgry) {
        if (ctgry === 'poster') {
          return (
            ' AND `' +
            ctgry.trim() +
            "` != '' " +
            ' AND `' +
            ctgry.trim() +
            "` != '0' "
          );
        } else {
          return ' AND `' + ctgry.trim() + "` != '' ";
        }
      })
    : [];
  where = where.length ? where.join(' ') : '';

  if (
    certainly ||
    (config.publish.start <= 298 && config.publish.stop >= 10000000)
  ) {
    q._select = ', 1 AS movie ';
  } else {
    if (config.publish.start > 298 && config.publish.stop >= 10000000) {
      q._select = ', ( ' + 'kp_id >= ' + config.publish.start + ' ) AS movie';
    } else if (config.publish.start <= 298 && config.publish.stop < 10000000) {
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
 * @param {Object} config
 * @return {Object}
 */

function thematicPublish(config) {
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
