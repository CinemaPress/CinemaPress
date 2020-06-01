'use strict';

process.env['UV_THREADPOOL_SIZE'] = '128';
process.env['CP_VER'] = new Date().getTime().toString();
require('events').EventEmitter.defaultMaxListeners = 15;

/**
 * Configuration dependencies.
 */

var config = require('./config/production/config');

/**
 * Node dependencies.
 */

var path = require('path');
var lookup = {};
try {
  var MaxMindReader = require('maxmind').Reader;
  lookup.country = new MaxMindReader(
    require('fs').readFileSync(
      path.join(path.dirname(__filename), 'files', 'GeoLite2-Country.mmdb')
    )
  );
  lookup.asn = new MaxMindReader(
    require('fs').readFileSync(
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
  res.setHeader('X-Powered-By', 'CinemaPress');
  next();
});
app.use('/ping', function(req, res) {
  return res.send('pong');
});

/**
 * Route dependencies.
 */

var files = require('./routes/files');
var iframe = require('./routes/iframe');
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
var nginx = require('./lib/CP_nginx');

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
  /^(?:\/mobile-version|\/tv-version|)?/,
  express.static(path.join(path.dirname(__filename), '/'))
);
app.use('/telegram', telegram);
app.use('/files', files);
app.use(userinfo(lookup));
app.use(/^(?:\/mobile-version|\/tv-version|)?\/player.*$/, player);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/episode.*$/, episode);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/robots\.txt$/, robots);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/opensearch\.xml$/, opensearch);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/iframe/, iframe);
app.use(/^(?:\/mobile-version|\/tv-version|)?\/rss\.xml.*$/, rss);
app.use('/' + config.urls.admin, admin);
app.use(loadavg());
app.use(/^(?:\/mobile-version|\/tv-version|)?\/api/, api);
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

app.listen(port);
