'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');
var modules = require('../config/production/modules');

/**
 * Node dependencies.
 */

var md5 = require('md5');
var async = require('async');
var crypto = require('crypto');
var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
moment.locale(config.language);

/**
 * Callback.
 *
 * @callback Callback
 * @param {Object} err
 * @param {Object} [render]
 */

/**
 * Adding in head social comments for movie page.
 *
 * @return {String}
 */

function headComments() {
  var start = 'none_comments';

  if (modules.comments.data.cackle.id) {
    start = 'cack_comment';
  } else if (modules.comments.data.hypercomments.widget_id) {
    start = 'hycm_comment';
  } else if (modules.comments.data.disqus.shortname) {
    start = 'dsqs_comment';
  } else if (modules.comments.data.vk.app_id) {
    start = 'veka_comment';
  } else if (modules.comments.data.facebook.admins) {
    start = 'fcbk_comment';
  } else if (modules.comments.data.sigcomments.host_id) {
    start = 'sigc_comment';
  }

  var data =
    '<script>function showComments(){var t=this.dataset&&this.dataset.id?this.dataset.id:"' +
    start +
    '",e=document.querySelector("#"+t);if(e){var n=document.querySelectorAll(".CP_comment");if(n&&n.length)for(var o=0;o<n.length;o++)n[o].style.display="none";e.style.display="block"}}window.addEventListener("load",function(){var t=document.querySelectorAll(".CP_button");if(t&&t.length)for(var e=0;e<t.length;e++)t[e].addEventListener("click",showComments);showComments()});</script><style>#hypercomments_widget .hc__root{clear: inherit !important;}#vk_comments,#vk_comments iframe {width: 100% !important;}.fb-comments,.fb-comments span,.fb-comments iframe {width: 100% !important;}</style>';

  if (modules.comments.data.vk.app_id) {
    data +=
      '<script src="//vk.com/js/api/openapi.js?127"></script><script>if (typeof VK == "object") {VK.init({apiId: ' +
      modules.comments.data.vk.app_id +
      ', onlyWidgets: true});}</script>';
  }

  if (modules.comments.data.facebook.admins) {
    var admins = modules.comments.data.facebook.admins.split(',');
    for (var i = 0; i < admins.length; i++) {
      admins[i] = '<meta property="fb:admins" content="' + admins[i] + '">';
    }

    data += admins.join('');
  }

  return data;
}

/**
 * Adding social comments for page.
 *
 * @param {String} url
 * @param {String} pathname
 * @param {String} [position]
 * @return {String}
 */

function codesComments(url, pathname, position) {
  var data = {};
  var footer = '';

  if (modules.comments.data.cackle.id) {
    data.cackle = '<div id="mc-container"></div>';
    footer +=
      '<script>cackle_widget=window.cackle_widget||[],cackle_widget.push({widget:"Comment",id:' +
      modules.comments.data.cackle.id +
      '}),function(){var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=("https:"===document.location.protocol?"https":"http")+"://cackle.me/widget.js";var b=document.getElementsByTagName("script")[0];b.parentNode.insertBefore(a,b.nextSibling)}();</script>';
  }

  if (modules.comments.data.hypercomments.widget_id) {
    data.hypercomments = '<div id="hypercomments_widget"></div>';
    footer +=
      '<script>_hcwp=window._hcwp||[],_hcwp.push({widget:"Stream",widget_id:' +
      modules.comments.data.hypercomments.widget_id +
      ',xid:"' +
      pathname +
      '"}),function(){if(!("HC_LOAD_INIT"in window)){HC_LOAD_INIT=!0;var a=("ru").substr(0,2).toLowerCase(),b=document.createElement("script");b.type="text/javascript",b.async=!0,b.src=("https:"===document.location.protocol?"https":"http")+"://w.hypercomments.com/widget/hc/' +
      modules.comments.data.hypercomments.widget_id +
      '/"+a+"/widget.js";var c=document.getElementsByTagName("script")[0];c.parentNode.insertBefore(b,c.nextSibling)}}();</script>';
  }

  if (modules.comments.data.disqus.shortname) {
    data.disqus = '<div id="disqus_thread"></div>';
    footer +=
      '<script>var disqus_config=function(){this.page.url="' +
      url +
      '",this.page.identifier="' +
      pathname +
      '"};!function(){var e=document,t=e.createElement("script");t.async=true;t.src="//' +
      modules.comments.data.disqus.shortname +
      '.disqus.com/embed.js",t.setAttribute("data-timestamp",+new Date),(e.head||e.body).appendChild(t)}();</script>';
  }

  if (modules.comments.data.vk.app_id) {
    data.vk = '<div id="vk_comments"></div>';
    footer +=
      '<script>if (typeof VK == "object") {VK.Widgets.Comments("vk_comments", {limit: 10, width: "auto", attach: "*", autoPublish: 1});}</script>';
  }

  if (modules.comments.data.facebook.admins) {
    data.facebook =
      '<div class="fb-comments" data-href="' +
      url +
      '" data-numposts="10" data-width="auto"></div><div id="fb-root"></div>';
    footer +=
      '<script>(function(d, s, id) {var js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) return; js = d.createElement(s); js.id = id; js.src = "//connect.facebook.net/ru_RU/sdk.js#xfbml=1&version=v2.6"; fjs.parentNode.insertBefore(js, fjs);}(document, "script", "facebook-jssdk"));</script>';
  }

  if (modules.comments.data.sigcomments.host_id) {
    data.sigcomments = '<div id="sigCommentsBlock"></div>';
    footer +=
      '<script>(function(){var host_id = "' +
      modules.comments.data.sigcomments.host_id +
      '";var script = document.createElement("script");script.type = "text/javascript";script.async = true;script.src = "//sigcomments.com/chat/?host_id="+host_id;var ss = document.getElementsByTagName("script")[0];ss.parentNode.insertBefore(script, ss);})();</script>';
  }

  var buttons = '';
  var blocks = '';
  var single = 0;

  if (data.cackle) {
    buttons +=
      '<a href="javascript:void(0)" class="CP_button cack" data-id="cack_comment" style="background: #4FA3DA !important; color: #fff !important; border-radius: 2px !important; padding: 10px !important; text-decoration: none !important; margin: 0 5px 0 0 !important; float: none !important;">' +
      config.l.comments +
      '</a>';
    blocks +=
      '<div class="CP_comment" id="cack_comment" style="display: none;">' +
      data.cackle +
      '</div>';
    single++;
  }
  if (data.hypercomments) {
    buttons +=
      '<a href="javascript:void(0)" class="CP_button hycm" data-id="hycm_comment" style="background: #E4C755 !important; color: #fff !important; border-radius: 2px !important; padding: 10px !important; text-decoration: none !important; margin: 0 5px 0 0 !important; float: none !important;">' +
      config.l.comments +
      '</a>';
    blocks +=
      '<div class="CP_comment" id="hycm_comment" style="display: none;">' +
      data.hypercomments +
      '</div>';
    single++;
  }
  if (data.disqus) {
    buttons +=
      '<a href="javascript:void(0)" class="CP_button dsqs" data-id="dsqs_comment" style="background: #2E9FFF !important; color: #fff !important; border-radius: 2px !important; padding: 10px !important; text-decoration: none !important; margin: 0 5px 0 0 !important; float: none !important;">' +
      config.l.comments +
      '</a>';
    blocks +=
      '<div class="CP_comment" id="dsqs_comment" style="display: none;">' +
      data.disqus +
      '</div>';
    single++;
  }
  if (data.vk) {
    buttons +=
      '<a href="javascript:void(0)" class="CP_button veka" data-id="veka_comment" style="background: #507299 !important; color: #fff !important; border-radius: 2px !important; padding: 10px !important; text-decoration: none !important; margin: 5px !important; float: none !important;">' +
      config.l.vk +
      '</a>';
    blocks +=
      '<div class="CP_comment" id="veka_comment" style="display: none;">' +
      data.vk +
      '</div>';
    single++;
  }
  if (data.facebook) {
    buttons +=
      '<a href="javascript:void(0)" class="CP_button fsbk" data-id="fcbk_comment" style="background: #3B5998 !important; color: #fff !important; border-radius: 2px !important; padding: 10px !important; text-decoration: none !important; margin: 5px !important; float: none !important;">' +
      config.l.facebook +
      '</a>';
    blocks +=
      '<div class="CP_comment" id="fcbk_comment" style="display: none;">' +
      data.facebook +
      '</div>';
    single++;
  }
  if (data.sigcomments) {
    buttons +=
      '<a href="javascript:void(0)" class="CP_button sigc" data-id="sigc_comment" style="background: #2996cc !important; color: #fff !important; border-radius: 2px !important; padding: 10px !important; text-decoration: none !important; margin: 5px !important; float: none !important;">' +
      config.l.comments +
      '</a>';
    blocks +=
      '<div class="CP_comment" id="sigc_comment" style="display: none;">' +
      data.sigcomments +
      '</div>';
    single++;
  }

  buttons = single === 1 ? '' : buttons;

  return position
    ? footer
    : '' +
        '<div class="CP_buttons" style="margin:30px 0 !important; float: none !important;">' +
        buttons +
        '</div>' +
        '<div class="CP_comments" style="margin:20px 0 !important; float: none !important;">' +
        blocks +
        '</div>';
}

/**
 * Adding recent comments.
 *
 * @param {Object} service
 * @param {Object} options
 * @param {Callback} callback
 */

function recentComments(service, options, callback) {
  /**
   * Node dependencies.
   */

  var fs = require('fs');
  var path = require('path');

  /**
   * Module dependencies.
   */

  var CP_cache = require('../lib/CP_cache');

  /**
   * Route dependencies.
   */

  var movie = require('../routes/paths/movie');

  var hash = md5(config.protocol + options.domain + 'comments');

  return config.cache.time
    ? CP_cache.get(hash, function(err, render) {
        return render
          ? typeof render === 'object'
            ? callback(null, render)
            : callback(null, JSON.parse(render))
          : getComments(function(err, render) {
              callback(null, render);
            });
      })
    : getComments(function(err, render) {
        callback(null, render);
      });

  /**
   * Comments.
   *
   * @param {Callback} callback
   */

  function getComments(callback) {
    async.parallel(
      [
        function(callback) {
          if (!(service.indexOf('disqus') + 1)) return callback(null, []);

          var url =
            'https://' +
            modules.comments.data.disqus.shortname +
            '.disqus.com/recent_comments_widget.js?' +
            '&num_items=' +
            modules.comments.data.disqus.recent.num_items +
            '&hide_avatars=' +
            modules.comments.data.disqus.recent.hide_avatars +
            '&excerpt_length=' +
            modules.comments.data.disqus.recent.excerpt_length +
            '&random=' +
            Math.random();

          request(
            { url: url, timeout: 500, agent: false, pool: { maxSockets: 100 } },
            function(error, response, body) {
              if (error) {
                console.log('disqus', error.code);
                return callback(null, []);
              }

              if (response.statusCode === 200 && body) {
                var comments1 = [];
                body = body
                  .replace(/document\.write\('/, '')
                  .replace(/'\);/, '')
                  .replace(/\\\n/g, '')
                  .replace(/\\'/g, "'");
                var $ = cheerio.load(body, { decodeEntities: false });
                if ($) {
                  $('li').each(function(i, elem) {
                    var href = $(elem)
                      .find('.dsq-widget-meta a')
                      .first()
                      .attr('href');
                    if (
                      href &&
                      href.indexOf(options.domain) === -1 &&
                      options.domain.indexOf('cinemapress') === -1
                    ) {
                      return;
                    }
                    var r = {};
                    r['url'] = $(elem)
                      .find('.dsq-widget-meta a')
                      .first()
                      .attr('href')
                      .replace(
                        /(https?:\/\/[a-z0-9._\-]*)/i,
                        config.protocol + options.domain
                      );
                    r['user'] = $(elem)
                      .find('.dsq-widget-user')
                      .text()
                      ? $(elem)
                          .find('.dsq-widget-user')
                          .text()
                      : '';
                    r['avatar'] = $(elem)
                      .find('.dsq-widget-avatar')
                      .attr('src')
                      ? $(elem)
                          .find('.dsq-widget-avatar')
                          .attr('src')
                          .replace('/avatar92', '/avatar36')
                      : '';
                    r['title'] = $(elem)
                      .find('.dsq-widget-meta a')
                      .first()
                      .text()
                      ? $(elem)
                          .find('.dsq-widget-meta a')
                          .first()
                          .text()
                          .trim()
                      : '';
                    r['comment'] = $(elem)
                      .find('.dsq-widget-comment')
                      .text()
                      ? $(elem)
                          .find('.dsq-widget-comment')
                          .text()
                      : '';
                    r['comment'] = r['comment']
                      ? r['comment']
                          .replace(/\s+/g, ' ')
                          .replace(/(^\s*)|(\s*)$/g, '')
                          .replace(/['"]/g, '')
                          .replace(/(<([^>]+)>)/gi, '')
                      : '';

                    var date = $(elem)
                      .find('.dsq-widget-meta a')
                      .last()
                      .text()
                      ? $(elem)
                          .find('.dsq-widget-meta a')
                          .last()
                          .text() + ''
                      : '';
                    var num = date.replace(/[^0-9]/g, '') || 1;
                    date =
                      date.indexOf('hour') + 1
                        ? moment().subtract(num, 'hour')
                        : date.indexOf('day') + 1
                        ? moment().subtract(num, 'day')
                        : date.indexOf('week') + 1
                        ? moment().subtract(num, 'week')
                        : date.indexOf('month') + 1
                        ? moment().subtract(num, 'month')
                        : date.indexOf('year') + 1
                        ? moment().subtract(num, 'year')
                        : moment().subtract(num, 'minute');
                    r['date'] = date.fromNow();
                    r['time'] = date.valueOf();
                    r['kp_id'] = movie.id(r['url']);

                    comments1.push(r);
                  });
                }
                callback(null, comments1);
              } else {
                callback(null, []);
              }
            }
          );
        },
        function(callback) {
          if (!(service.indexOf('hypercomments') + 1))
            return callback(null, []);

          var url = {
            url: 'http://c1n1.hypercomments.com/api/mixstream',
            method: 'POST',
            form: {
              data:
                '{"widget_id":' +
                modules.comments.data.hypercomments.widget_id +
                ',"limit":' +
                modules.comments.data.hypercomments.recent.num_items +
                ',"filter":"last"}'
            },
            timeout: 500,
            agent: false,
            pool: { maxSockets: 100 }
          };
          request(url, function(error, response, body) {
            if (error) {
              console.log('hypercomments', error.code);
              return callback(null, []);
            }

            if (response.statusCode === 200 && body) {
              var json = tryParseJSON(body);
              if (
                !json ||
                !json.result ||
                json.result !== 'success' ||
                !json.data
              ) {
                return callback(null, []);
              }
              var comments2 = [];
              json.data.forEach(function(comment) {
                comment.text = comment.text
                  ? comment.text
                      .replace(/\s+/g, ' ')
                      .replace(/(^\s*)|(\s*)$/g, '')
                      .replace(/['"]/g, '')
                      .replace(/(<([^>]+)>)/gi, '')
                  : '';
                var tri =
                  ('' + comment.text).length >=
                  modules.comments.data.hypercomments.recent.excerpt_length
                    ? '...'
                    : '';
                var r = {};
                r['url'] = comment.link
                  ? comment.link.replace(
                      /(https?:\/\/[a-z0-9._\-]*)/i,
                      config.protocol + options.domain
                    )
                  : '';
                r['user'] = comment.nick ? comment.nick : '';
                r['avatar'] = '';
                r['title'] = comment.title ? comment.title : '';
                r['comment'] = comment.text
                  ? comment.text.slice(
                      0,
                      modules.comments.data.hypercomments.recent.excerpt_length
                    ) + tri
                  : '';
                var date = comment.time ? moment(new Date(comment.time)) : '';
                r['date'] = date ? date.fromNow() : '';
                r['time'] = date ? date.valueOf() : '';
                r['kp_id'] = r['url'] ? movie.id(r['url']) : '';
                if (r['comment']) {
                  comments2.push(r);
                }
              });
              callback(null, comments2);
            } else {
              callback(null, []);
            }
          });
        }
      ],
      function(err, res) {
        var result = res[0].concat(res[1]);

        result.sort(function(x, y) {
          return parseInt(y.time) - parseInt(x.time);
        });

        var file = path.join(__dirname, '..', 'files', 'comments.json');
        if ((!result || !result.length) && fs.existsSync(file)) {
          var c = fs.readFileSync(file);
          try {
            result = JSON.parse(c);
            console.log(
              '[modules/CP_comments.js:recentComments] Get from comments.json'
            );
          } catch (e) {
            console.error(e);
          }
        }

        callback(err, result);

        if (config.cache.time && result && result.length) {
          fs.writeFile(file, JSON.stringify(result), function(err) {
            if (err) {
              console.log(
                '[modules/CP_comments.js:recentComments] Write File Error:',
                err
              );
            }
          });

          CP_cache.set(hash, result, config.cache.time, function(err) {
            if (err) {
              if ((err + '').indexOf('1048576') + 1) {
                console.log(
                  '[modules/CP_comments.js:recentComments] Cache Length Error'
                );
              } else {
                console.log(
                  '[modules/CP_comments.js:recentComments] Cache Set Error:',
                  err
                );
              }
            }
          });
        }
      }
    );
  }
}

/**
 * Adding comments to body page.
 *
 * @param {String} thread
 * @param {String} pathname
 * @param {Callback} callback
 */

function indexerComments(thread, pathname, callback) {
  async.parallel(
    [
      function(callback) {
        if (
          !modules.comments.data.disqus.api_key ||
          !modules.comments.data.disqus.shortname ||
          (modules.comments.data.disqus.time &&
            modules.comments.data.disqus.time === new Date().getHours() + 1)
        )
          return callback(null, '');

        var url = {
          url:
            'https://disqus.com/api/3.0/threads/listPosts.json?' +
            'api_key=' +
            modules.comments.data.disqus.api_key.trim() +
            '&' +
            'forum=' +
            modules.comments.data.disqus.shortname.trim() +
            '&' +
            'limit=10&' +
            'thread=ident:' +
            encodeURIComponent(pathname),
          timeout: 200,
          agent: false,
          pool: { maxSockets: 100 }
        };

        request(url, function(error, response, body) {
          if (error) {
            console.log('1,000 requests per hour limit!', new Date());
            modules.comments.data.disqus.time = new Date().getHours() + 1;
            return callback(null, '');
          }

          var comments = '';

          if (response.statusCode === 200 && body) {
            var json = tryParseJSON(body);
            if (json && json.response && json.response.length) {
              json.response.forEach(function(comment) {
                if (comment.raw_message) {
                  comments += comment.raw_message + ' ';
                }
              });
            }
          }

          callback(null, comments);
        });
      },
      function(callback) {
        if (
          !modules.comments.data.hypercomments.sekretkey ||
          !modules.comments.data.hypercomments.widget_id
        )
          return callback(null, '');

        var body =
          '{"widget_id":' +
          modules.comments.data.hypercomments.widget_id.trim() +
          ',"link":"' +
          thread +
          '","xid":"' +
          pathname +
          '","sort":"new","limit":"20","offset":"0"}';

        var signature = crypto
          .createHash('sha1')
          .update(body + modules.comments.data.hypercomments.sekretkey)
          .digest('hex');

        var url = {
          url: 'http://c1api.hypercomments.com/1.0/comments/list',
          method: 'POST',
          form: { body: body, signature: signature },
          timeout: 200,
          agent: false,
          pool: { maxSockets: 100 }
        };
        request(url, function(error, response, body) {
          if (error) {
            console.log('Stream with comments not found.');
            return callback(null, '');
          }

          var comments = '';

          if (response.statusCode === 200 && body) {
            var json = tryParseJSON(body);
            if (
              !json ||
              !json.result ||
              json.result !== 'success' ||
              !json.data
            ) {
              return callback(null, '');
            }
            json.data.forEach(function(comment) {
              if (comment.text) {
                comments += comment.text + ' ';
              }
            });
          }

          callback(null, comments);
        });
      }
    ],
    function(err, results) {
      var c = '';
      if (results && results.length) {
        c =
          '<span style="display: none !important;">' +
          results
            .join(' ')
            .replace(/\s+/g, ' ')
            .replace(/(^\s*)|(\s*)$/g, '')
            .replace(/['"]/g, '')
            .replace(/(<([^>]+)>)/gi, '') +
          '</span>';
      }

      callback(err, c);
    }
  );
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
  return null;
}

module.exports = {
  codes: codesComments,
  head: headComments,
  recent: recentComments,
  indexer: indexerComments
};
