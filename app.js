'use strict';

process.env['UV_THREADPOOL_SIZE'] = '128';
process.env['CP_VER'] = new Date().getTime().toString();
require('events').EventEmitter.defaultMaxListeners = 15;

/**
 * Configuration dependencies.
 */

var config = require('./config/production/config');
Object.keys(config).length === 0 &&
  (config = require('./config/production/config.backup'));
var modules = require('./config/production/modules');
Object.keys(modules).length === 0 &&
  (modules = require('./config/production/modules.backup'));

/**
 * Global configuration.
 */

process.env['CP_CONFIG_MD5'] = require('md5')(JSON.stringify(config));
process.env['CP_MODULES_MD5'] = require('md5')(JSON.stringify(modules));

/**
 * Module dependencies.
 */

var CP_cache = require('./lib/CP_cache');

/**
 * Node dependencies.
 */

var path = require('path');
var fs = require('fs');
var lookup = {};
try {
  var MaxMindReader = require('maxmind').Reader;
  lookup.country = new MaxMindReader(
    fs.readFileSync(
      path.join(path.dirname(__filename), 'files', 'GeoLite2-Country.mmdb')
    )
  );
  lookup.asn = new MaxMindReader(
    fs.readFileSync(
      path.join(path.dirname(__filename), 'files', 'GeoLite2-ASN.mmdb')
    )
  );
} catch (err) {
  console.log('NOT FILE GeoLite2-Country.mmdb OR GeoLite2-ASN.mmdb');
}
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();

app.use(function(req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    req.start_request = new Date();
    console.log('GET:', req.originalUrl);
  }
  next();
});
app.use(function(req, res, next) {
  res.setHeader('X-Powered-By', 'CinemaPress');
  next();
});
app.use('/ping', function(req, res) {
  return res.send('pong');
});
app.use('/flush-cache-' + config.urls.admin, function(req, res) {
  CP_cache.flush(function() {
    return res.send('OK');
  });
});

/**
 * Route dependencies.
 */

var files = require('./routes/files');
var embed = require('./routes/embed');
var iframe = require('./routes/iframe');
var cinemaplayer = require('./routes/cinemaplayer');
var player = require('./routes/player');
var episode = require('./routes/episode');
var robots = require('./routes/robots');
var opensearch = require('./routes/opensearch');
var rss = require('./routes/rss');
var admin = require('./routes/admin');
var website = require('./routes/website');
var api = require('./routes/api');
var telegram = require('./routes/telegram');

/**
 * Middleware dependencies.
 */

var rebooting = require('./lib/CP_rebooting');
var userinfo = require('./lib/CP_userinfo');
var loadavg = require('./lib/CP_loadavg');
var defence = require('./lib/CP_defense');
var nginx = require('./lib/CP_nginx');
var bots = require('./lib/CP_bots');

/**
 * Port.
 */

var port = process.env.PORT || 3000;

/**
 * Template engine.
 */

app.set('views', [
  path.join(__dirname, 'themes', 'default', 'views'),
  path.join(__dirname, 'themes', config.theme, 'views')
]);
app.set('view engine', 'ejs');

/**
 * Middleware functions.
 */

app.enable('trust proxy');

app.use(cookieParser(config.domain));
app.use(bodyParser.json({ limit: '64mb' }));
app.use(bodyParser.urlencoded({ limit: '64mb', extended: true }));

//app.use(rebooting());
app.use(nginx());
app.use(
  /^(?:\/mobile-version|\/tv-version|)?\//,
  express.static(path.join(path.dirname(__filename), '/'))
);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/api/, api);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/cinemaplayer/, cinemaplayer);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/telegram/, telegram);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/files/, files);
app.use(bots());
app.use(defence());
app.use(userinfo(lookup));
app.use(/^(?:\/mobile-version|\/tv-version|)?\/player.*$/, player);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/episode.*$/, episode);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/robots\.txt$/, robots);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/opensearch\.xml$/, opensearch);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/embed/, embed);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/iframe/, iframe);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/rss\.xml.*$/, rss);
app.use('/' + config.urls.admin, admin);
app.use(loadavg());
app.use(/^(?:\/mobile-version|\/tv-version|)?/, website);

app.use(function(err, req, res, next) {
  if (res.headersSent) return next();
  err.status = err.status ? err.status : 404;
  err.message = err.message ? err.message : 'Not Found';
  if (err.status === 301 || err.status === 302) {
    res.writeHead(err.status, { Location: err.message });
    return res.end();
  }
  return res.status(err.status).render('error', {
    search: config.urls.search,
    status: err.status,
    message: err.message,
    language: config.language
  });
});

app.use(function(req, res) {
  if (res.headersSent) return;
  return res.status(404).render('error', {
    search: config.urls.search,
    status: 404,
    message: 'Not Found',
    language: config.language
  });
});

process.stdout.on('error', function(err) {
  if (err.code === 'EPIPE') {
    console.error('---------------', 'ERROR EPIPE', '---------------');
    process.exit(0);
  }
  if (err.code === 'ENOMEM') {
    console.error('---------------', 'ERROR ENOMEM', '---------------');
    process.exit(0);
  }
});

app.listen(port);
