const fs = require('fs');
const os = require('os');
const path = require('path');

let theme = process && process.argv && process.argv[2] ? process.argv[2] : '';

let config_file = path.join(
  __dirname,
  'config',
  'production',
  'config.js'
);
let modules_file = path.join(
  __dirname,
  'config',
  'production',
  'modules.js'
);
let process_file = path.join(__dirname, 'process.json');

let config = require(config_file);
let modules = require(modules_file);
let process_json = require(process_file);

config.index.year.keys = new Date().getFullYear() + '';

if (['arya'].indexOf(theme) + 1) {
  config.default.count = 12;
  config.index.year.count = 12;
  modules.content.data.index.count = 12;
  modules.related.data.types.year.count = 6;
  modules.content.data.news.count = 3;
}

if (['bran'].indexOf(theme) + 1) {
  modules.comments.data.disqus.recent.display = [];
  config.default.count = 12;
  config.index.year.count = 12;
  modules.content.data.index.count = 12;
  modules.related.data.types.year.count = 6;
  modules.content.data.news.count = 3;
}

if (['cersei'].indexOf(theme) + 1) {
  config.default.count = 15;
  config.index.year.count = 15;
  modules.content.data.index.count = 15;
  modules.related.data.types.year.count = 5;
}

if (['robb', 'sansa', 'tyrion'].indexOf(theme) + 1) {
  config.default.count = 10;
  config.index.year.count = 10;
  modules.content.data.index.count = 10;
  modules.related.data.types.year.count = 5;
}

if (['joffrey'].indexOf(theme) + 1) {
  modules.related.data.types.year.count = 7;
}

if (['hodor'].indexOf(theme) + 1) {
  modules.comments.data.disqus.recent.display = [];
  config.default.count = 10;
  config.index.year.count = 10;
  modules.content.data.index.count = 10;
  modules.related.data.types.year.count = 5;
  modules.content.data.news.count = 3;
}

if (['daenerys'].indexOf(theme) + 1) {
  config.default.count = 12;
  config.index.year.count = 12;
  modules.content.data.index.count = 12;
  modules.related.data.types.year.count = 5;
  modules.content.data.news.count = 3;
}

if (['tarly'].indexOf(theme) + 1) {
  config.default.count = 24;
  config.index.year.count = 24;
  modules.content.data.index.count = 12;
  modules.related.data.types.year.count = 12;
  modules.top.data.count = 5;
  modules.comments.data.disqus.recent.num_items = 3;
}

if (['mormont'].indexOf(theme) + 1) {
  config.default.count = 12;
  config.index.year.count = 12;
  modules.content.data.index.count = 12;
  modules.related.data.types.year.count = 4;
}

let mem = parseInt('' + os.totalmem() / 1000000);
let cpu = os.cpus() ? os.cpus().length : 1;
let max = parseInt('' + mem / cpu);

process_json.apps[0].node_args = '--max-old-space-size=' + max;
process_json.apps[0].max_memory_restart = max + 'M';
//process_json.apps[0].instances = cpu + '';

fs.writeFileSync(
  config_file,
  'module.exports = ' + JSON.stringify(config, null, '\t') + ';'
);
fs.writeFileSync(
  modules_file,
  'module.exports = ' + JSON.stringify(modules, null, '\t') + ';'
);
fs.writeFileSync(process_file, JSON.stringify(process_json, null, '\t'));
