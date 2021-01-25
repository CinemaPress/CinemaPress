const fs = require('fs');
const os = require('os');
const path = require('path');

let config_file = path.join(__dirname, 'config', 'production', 'config.js');
let modules_file = path.join(__dirname, 'config', 'production', 'modules.js');
let process_file = path.join(__dirname, 'process.json');

let config = require(config_file);
let modules = require(modules_file);
let process_json = require(process_file);

var d = new Date();
d.setDate(d.getDate() - 31);

config.index.year.keys = d.getFullYear() + '';
config.index.year.sorting = 'premiere-up';
config.index.year.order = 9;

config.index.count.type = 'year';
config.index.count.key = d.getFullYear() + '';
config.index.count.sorting = 'premiere-up';

let theme =
  process && process.argv && process.argv[2] ? process.argv[2] : config.theme;

if (['arya'].indexOf(theme) + 1) {
  config.default.count = 12;
  config.index.year.count = 12;
  modules.content.data.index.count = 12;
  modules.episode.data.index.count = 12;
  modules.related.data.types.year.count = 6;
  modules.content.data.news.count = 3;
  modules.comments.data.fast.recent.display = ['index'];
  modules.player.data.script = modules.player.data.script.replace(
    /#[a-z0-9]{6}/i,
    '#14181c'
  );
  modules.slider.data.movies = modules.slider.data.movies.slice(0, 6);
}

if (['bran'].indexOf(theme) + 1) {
  modules.comments.data.hypercomments.recent.display = [];
  modules.comments.data.fast.recent.display = [];
  modules.comments.data.disqus.recent.display = [];
  modules.comments.data.fast.recent.num_items = 0;
  modules.comments.data.fast.recent.display = ['index'];
  modules.comments.data.disqus.recent.num_items = 0;
  modules.comments.data.hypercomments.recent.num_items = 0;
  config.default.count = 12;
  config.index.year.count = 12;
  modules.content.data.index.count = 12;
  modules.episode.data.index.count = 12;
  modules.related.data.types.year.count = 6;
  modules.content.data.news.count = 3;
  modules.player.data.script = modules.player.data.script.replace(
    /#[a-z0-9]{6}/i,
    '#101010'
  );
}

if (['cersei'].indexOf(theme) + 1) {
  config.default.count = 15;
  config.index.year.count = 10;
  modules.content.data.index.count = 10;
  modules.episode.data.index.count = 20;
  modules.related.data.types.year.count = 5;
  modules.comments.data.fast.recent.display = ['index'];
  modules.player.data.script = modules.player.data.script.replace(
    /#[a-z0-9]{6}/i,
    '#393939'
  );
}

if (['robb', 'sansa', 'tyrion'].indexOf(theme) + 1) {
  config.default.count = 10;
  config.index.year.count = 10;
  modules.content.data.index.count = 10;
  modules.episode.data.index.count = 12;
  modules.related.data.types.year.count = 5;
  modules.player.data.script = modules.player.data.script.replace(
    /#[a-z0-9]{6}/i,
    '#7e8594'
  );
}

if (['joffrey'].indexOf(theme) + 1) {
  modules.related.data.types.year.count = 7;
  modules.comments.data.fast.recent.display = ['index'];
  modules.player.data.script = modules.player.data.script.replace(
    /#[a-z0-9]{6}/i,
    '#5e81a8'
  );
  modules.slider.data.movies = modules.slider.data.movies.slice(0, 10);
}

if (['hodor'].indexOf(theme) + 1) {
  modules.comments.data.hypercomments.recent.display = [];
  modules.comments.data.fast.recent.display = [];
  modules.comments.data.disqus.recent.display = [];
  modules.comments.data.fast.recent.num_items = 0;
  modules.comments.data.disqus.recent.num_items = 0;
  modules.comments.data.hypercomments.recent.num_items = 0;
  config.default.count = 10;
  config.index.year.count = 10;
  modules.content.data.index.count = 10;
  modules.episode.data.index.count = 25;
  modules.related.data.types.year.count = 5;
  modules.content.data.news.count = 3;
  modules.player.data.script = modules.player.data.script.replace(
    /#[a-z0-9]{6}/i,
    '#1f2123'
  );
  modules.slider.data.movies = modules.slider.data.movies.slice(0, 3);
}

if (['daenerys'].indexOf(theme) + 1) {
  config.default.count = 12;
  config.index.year.count = 12;
  modules.content.data.index.count = 12;
  modules.episode.data.index.count = 24;
  modules.related.data.types.year.count = 5;
  modules.content.data.news.count = 3;
  modules.comments.data.fast.recent.display = ['index'];
  modules.player.data.script = modules.player.data.script.replace(
    /#[a-z0-9]{6}/i,
    '#282350'
  );
  modules.slider.data.movies = modules.slider.data.movies.slice(0, 3);
}

if (['tarly'].indexOf(theme) + 1) {
  config.default.count = 12;
  config.index.year.count = 12;
  modules.content.data.index.count = 12;
  modules.episode.data.index.count = 5;
  modules.related.data.types.year.count = 12;
  modules.top.data.count = 5;
  modules.comments.data.fast.recent.num_items = 5;
  modules.comments.data.disqus.recent.num_items = 0;
  modules.comments.data.hypercomments.recent.num_items = 0;
  modules.player.data.script = modules.player.data.script.replace(
    /#[a-z0-9]{6}/i,
    '#333333'
  );
  modules.slider.data.movies = modules.slider.data.movies.slice(0, 3);
}

if (['mormont'].indexOf(theme) + 1) {
  config.default.count = 12;
  config.index.year.count = 12;
  modules.content.data.index.count = 12;
  modules.episode.data.index.count = 16;
  modules.related.data.types.year.count = 12;
  modules.player.data.script = modules.player.data.script.replace(
    /#[a-z0-9]{6}/i,
    '#262626'
  );
}

if (['ramsay'].indexOf(theme) + 1) {
  modules.episode.data.index.count = 24;
  modules.comments.data.fast.recent.display = ['index'];
  modules.player.data.script = modules.player.data.script.replace(
    /#[a-z0-9]{6}/i,
    '#333333'
  );
}

if (['dustin'].indexOf(theme) + 1) {
  config.default.count = 12;
  config.index.year.count = 12;
  modules.content.data.index.count = 12;
  modules.episode.data.index.count = 24;
  modules.related.data.types.year.count = 4;
  modules.viewed.data.width = '90px';
  modules.viewed.data.height = '120px';
  modules.player.data.script = modules.player.data.script.replace(
    /#[a-z0-9]{6}/i,
    '#44475a'
  );
}

if (['tormund'].indexOf(theme) + 1) {
  config.default.count = 12;
  config.index.year.count = 12;
  modules.content.data.index.count = 12;
  modules.episode.data.index.count = 32;
  modules.related.data.types.year.count = 10;
  modules.content.data.news.count = 4;
  modules.comments.data.fast.recent.display = ['index'];
  modules.player.data.script = modules.player.data.script.replace(
    /#[a-z0-9]{6}/i,
    '#111216'
  );
  modules.slider.data.movies = modules.slider.data.movies.slice(0, 6);
}

let mem = parseInt('' + os.totalmem() / 1000000);
let cpu = os.cpus() ? os.cpus().length : 1;
let max = parseInt('' + mem / (cpu > 1 ? cpu : 2));

//process_json.apps[0].node_args = '--max-old-space-size=' + max;
//process_json.apps[0].max_memory_restart = max + 'M';
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
