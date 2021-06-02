'use strict';

/**
 * Node dependencies.
 */

var axios = require('axios');
var async = require('async');

var server_ip = '';
axios('https://ipinfo.io/json')
  .then(function(r) {
    server_ip = r.data.ip;
  })
  .catch(function(e) {
    setTimeout(function() {
      axios('https://ipinfo.io/json')
        .then(function(r) {
          server_ip = r.data.ip;
        })
        .catch(function(e) {
          console.error('IPINFO ERROR');
        });
    }, 5000);
  });

/**
 * Add subdomain to DNS CloudFlare.
 *
 * @param {String} subdomain
 * @param {String} domain
 */

function addSub(subdomain, domain) {
  var config = require('../config/production/config');
  Object.keys(config).length === 0 &&
    (config = require('../config/production/config.backup'));
  var cloudflare_opt = {
    headers: {
      'X-Auth-Email': config.dns.cloudflare.email,
      'X-Auth-Key': config.dns.cloudflare.key,
      'Content-Type': 'application/json'
    }
  };
  if (
    !config.dns.cloudflare.email ||
    !config.dns.cloudflare.key ||
    !subdomain ||
    !domain ||
    !server_ip
  ) {
    return;
  }
  var url = 'https://api.cloudflare.com/client/v4/zones';
  var name = '?name=' + domain;
  var query_data = {};
  query_data['type'] = 'A';
  query_data['name'] = subdomain.trim().replace(/\.$/, '') + '.' + domain;
  query_data['proxied'] = config.dns.cloudflare.proxied === 'true';
  query_data['content'] = server_ip;
  var get_zone_id = {
    method: 'get',
    ...cloudflare_opt,
    url: url + name
  };
  axios(get_zone_id)
    .then(function(response) {
      if (
        response &&
        response.data &&
        response.data.result[0] &&
        response.data.result[0].id
      ) {
        var zone_id = response.data.result[0].id;
        var set_dns = {
          method: 'post',
          ...cloudflare_opt,
          url: url + '/' + zone_id + '/dns_records',
          data: query_data
        };
        axios(set_dns)
          .then(function(response) {
            if (response && response.data && response.data.success) {
              console.log('DNS SUCCESS:', response.data);
            } else {
              console.error('DNS ERROR 4:', response.data);
            }
          })
          .catch(function(error) {
            console.error(
              'DNS ERROR 3:',
              (error &&
                error.response &&
                error.response.data &&
                error.response.data.errors &&
                error.response.data.errors[0] &&
                error.response.data.errors[0].message) ||
                error
            );
          });
      } else {
        console.error('DNS ERROR 2:', response.data);
      }
    })
    .catch(function(error) {
      console.error(
        'DNS ERROR 1:',
        (error &&
          error.response &&
          error.response.data &&
          error.response.data.errors &&
          error.response.data.errors[0] &&
          error.response.data.errors[0].message) ||
          error
      );
    });
}

/**
 * Added all subdomains to DNS CloudFlare
 */

function allSub(callback) {
  var c = require('../config/production/config');
  Object.keys(c).length === 0 &&
    (c = require('../config/production/config.backup'));
  var botdomains = [];
  var m = c.botdomains.match(/{\s*['"][a-z0-9\-]{1,200}['"]\s*}/gi);
  if (m) {
    m.forEach(function(m) {
      if (c.bomain) {
        botdomains.push({
          subdomain: m.replace(/[^a-z0-9\-]/gi, ''),
          domain: c.bomain
        });
      }
      if (c.alt.bomain) {
        botdomains.push({
          subdomain: m.replace(/[^a-z0-9\-]/gi, ''),
          domain: c.alt.bomain
        });
      }
      if (c.ru.bomain) {
        botdomains.push({
          subdomain: m.replace(/[^a-z0-9-]/gi, ''),
          domain: c.ru.bomain
        });
      }
      if (!c.bomain && !c.alt.bomain && !c.ru.bomain) {
        botdomains.push({
          subdomain: m.replace(/[^a-z0-9-]/gi, ''),
          domain: c.domain
        });
      }
    });
  }
  async.eachOfLimit(
    [
      ...botdomains,
      {
        subdomain: c.subdomain,
        domain: c.domain
      },
      {
        subdomain: c.botdomain,
        domain: c.bomain
      },
      {
        subdomain: c.alt.botdomain,
        domain: c.alt.bomain
      },
      {
        subdomain: c.ru.subdomain,
        domain: c.ru.domain
      },
      {
        subdomain: c.ru.botdomain,
        domain: c.ru.bomain
      }
    ],
    1,
    function(d, index, callback) {
      addSub(d.subdomain, d.domain);
      setTimeout(function() {
        callback();
      }, 500);
    },
    function(err) {
      if (err) console.error(err);
      callback();
    }
  );
}

/**
 * Added main subdomains to DNS CloudFlare
 */

function fullSub(callback) {
  allSub(function() {
    var c = require('../config/production/config');
    Object.keys(c).length === 0 &&
      (c = require('../config/production/config.backup'));
    async.eachOfLimit(
      [
        {
          subdomain: 'www',
          domain: c.domain
        },
        {
          subdomain: 'tv',
          domain: c.domain
        },
        {
          subdomain: 'm',
          domain: c.domain
        },
        {
          subdomain: 'app',
          domain: c.domain
        },
        {
          subdomain: 'ftp',
          domain: c.domain
        },
        {
          subdomain: 'torrent',
          domain: c.domain
        },
        {
          subdomain: 'www',
          domain: c.bomain
        },
        {
          subdomain: 'tv',
          domain: c.bomain
        },
        {
          subdomain: 'm',
          domain: c.bomain
        },
        {
          subdomain: 'www',
          domain: c.alt.bomain
        },
        {
          subdomain: 'tv',
          domain: c.alt.bomain
        },
        {
          subdomain: 'm',
          domain: c.alt.bomain
        },
        {
          subdomain: 'www',
          domain: c.ru.domain
        },
        {
          subdomain: 'tv',
          domain: c.ru.domain
        },
        {
          subdomain: 'm',
          domain: c.ru.domain
        },
        {
          subdomain: 'app',
          domain: c.ru.domain
        },
        {
          subdomain: 'ftp',
          domain: c.ru.domain
        },
        {
          subdomain: 'torrent',
          domain: c.ru.domain
        },
        {
          subdomain: 'www',
          domain: c.ru.bomain
        },
        {
          subdomain: 'tv',
          domain: c.ru.bomain
        },
        {
          subdomain: 'm',
          domain: c.ru.bomain
        }
      ],
      1,
      function(d, index, callback) {
        addSub(d.subdomain, d.domain);
        setTimeout(function() {
          callback();
        }, 500);
      },
      function(err) {
        if (err) console.error(err);
        callback();
      }
    );
  });
}

module.exports = {
  add: addSub,
  all: allSub,
  full: fullSub
};
