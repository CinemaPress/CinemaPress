!(function(e) {
  function t(o) {
    if (n[o]) return n[o].exports;
    var i = (n[o] = { i: o, l: !1, exports: {} });
    return e[o].call(i.exports, i, i.exports, t), (i.l = !0), i.exports;
  }
  var n = {};
  (t.m = e),
    (t.c = n),
    (t.d = function(e, n, o) {
      t.o(e, n) ||
        Object.defineProperty(e, n, {
          configurable: !1,
          enumerable: !0,
          get: o
        });
    }),
    (t.n = function(e) {
      var n =
        e && e.__esModule
          ? function() {
              return e.default;
            }
          : function() {
              return e;
            };
      return t.d(n, 'a', n), n;
    }),
    (t.o = function(e, t) {
      return Object.prototype.hasOwnProperty.call(e, t);
    }),
    (t.p = 'https://yastatic.net/share2/v-1.19.2/'),
    t((t.s = 18));
})([
  function(e, t, n) {
    'use strict';
    function o(e) {
      return e.getElementsByTagName('head')[0] || e.body;
    }
    function i(e) {
      var t = document.createElement('script');
      return (t.src = e), (t.defer = !0), document.head.appendChild(t), t;
    }
    function r(e) {
      function t() {
        document.removeEventListener('DOMContentLoaded', t),
          window.removeEventListener('load', t),
          e();
      }
      'complete' === document.readyState ||
      ('loading' !== document.readyState && !document.documentElement.doScroll)
        ? e()
        : (document.addEventListener('DOMContentLoaded', t),
          window.addEventListener('load', t));
    }
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.injectJs = i),
      (t.ready = r);
    var s = function(e) {
      this._document = e;
    };
    (s.prototype.injectCss = function(e, t) {
      var n = t.nonce,
        i = o(this._document),
        r = this._document.createElement('style');
      (r.type = 'text/css'),
        (r.innerHTML = e),
        n && r.setAttribute('nonce', n),
        i.appendChild(r);
    }),
      (t.default = s);
  },
  function(e, t, n) {
    'use strict';
    function o(e) {
      return Array.isArray(e) ? e : Array.from(e);
    }
    function i(e) {
      return e.search
        .substring(1)
        .split('&')
        .reduce(function(e, t) {
          var n = t.split('='),
            i = o(n),
            r = i[0],
            s = i.slice(1);
          return (e[r] = decodeURIComponent(s.join('='))), e;
        }, {});
    }
    function r(e, t) {
      return e.replace(/{(\w+)}/g, function(e, n) {
        return void 0 !== t[n] ? encodeURIComponent(t[n]) : '';
      });
    }
    function s(e) {
      return Object.keys(e)
        .map(function(t) {
          return t + '=' + encodeURIComponent(e[t]);
        })
        .join('&');
    }
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.getParams = i),
      (t.applyTemplate = r),
      (t.serializeParams = s);
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 });
    var o = {
      closest: function(e, t) {
        do {
          if (e.classList && e.classList.contains(t)) return e;
        } while ((e = e.parentNode));
      },
      toArray: function(e) {
        for (var t = [], n = e.length, o = 0; o < n; o += 1) t.push(e[o]);
        return t;
      },
      getTarget: function(e) {
        return e.target || e.srcElement;
      },
      remove: function(e) {
        return e.parentNode.removeChild(e);
      },
      getRectRelativeToDocument: function(e) {
        var t = e.getBoundingClientRect(),
          n =
            void 0 === window.scrollY
              ? document.documentElement.scrollTop
              : window.scrollY,
          o =
            void 0 === window.scrollX
              ? document.documentElement.scrollLeft
              : window.scrollX;
        return {
          top: t.top + n,
          left: t.left + o,
          width: void 0 === t.width ? t.right - t.left : t.width,
          height: void 0 === t.height ? t.bottom - t.top : t.height
        };
      }
    };
    t.default = o;
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 });
    var o = (t.count = {
      jsonp: {
        url:
          'https://graph.facebook.com/?id={url}&access_token={accessToken}&callback={callback}',
        callback: function(e) {
          return e.share.share_count;
        }
      }
    });
    t.default = {
      config: {
        shareUrl: {
          default:
            'https://www.facebook.com/sharer.php?src=sp&u={url}&title={title}&description={description}&picture={image}',
          share:
            'https://www.facebook.com/dialog/share?app_id={appId}&display=popup&href={url}&redirect_uri={nextUrl}',
          feed:
            'https://www.facebook.com/dialog/feed?display=popup&app_id={appId}&link={url}&next={nextUrl}&name={title}&description={description}&picture={image}'
        },
        count: o
      },
      contentOptions: { accessToken: '', appId: '', nextUrl: '' },
      popupDimensions: [800, 520],
      i18n: {
        az: 'Facebook',
        be: 'Facebook',
        en: 'Facebook',
        hy: 'Facebook',
        ka: 'Facebook',
        kk: 'Facebook',
        ro: 'Facebook',
        ru: 'Facebook',
        tr: 'Facebook',
        tt: 'Facebook',
        uk: 'Facebook'
      },
      color: '#3b5998'
    };
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }), (t.count = void 0);
    var o = n(5),
      i = (t.count = {
        cors: {
          request: function(e, t) {
            var n = e.url;
            return (0, o.post)(
              {
                url: 'https://clients6.google.com/rpc',
                headers: { 'content-type': 'application/json; charset=UTF-8' },
                body: JSON.stringify({
                  method: 'pos.plusones.get',
                  id: n,
                  params: {
                    nolog: !0,
                    id: n,
                    source: 'widget',
                    userId: '@viewer',
                    groupId: '@self'
                  },
                  jsonrpc: '2.0',
                  key: 'p',
                  apiVersion: 'v1'
                })
              },
              function(e, n) {
                if (null === e)
                  try {
                    var o = JSON.parse(n),
                      i = o.result.metadata.globalCounts.count;
                    t(null, i);
                  } catch (e) {}
              }
            );
          }
        }
      });
    t.default = {
      config: { shareUrl: 'https://plus.google.com/share?url={url}', count: i },
      popupDimensions: [560, 370],
      i18n: {
        az: 'Google+',
        be: 'Google+',
        en: 'Google+',
        hy: 'Google+',
        ka: 'Google+',
        kk: 'Google+',
        ro: 'Google+',
        ru: 'Google+',
        tr: 'Google+',
        tt: 'Google+',
        uk: 'Google+'
      },
      color: '#dc4e41'
    };
  },
  function(e, t, n) {
    'use strict';
    function o(e, t) {
      var n = e.url,
        o = e.headers,
        i = void 0 === o ? {} : o,
        r = e.body,
        s = void 0 === r ? '' : r,
        a = new XMLHttpRequest();
      a.open('POST', n, !0),
        Object.keys(i).forEach(function(e) {
          a.setRequestHeader(e, i[e]);
        }),
        (a.onreadystatechange = function() {
          4 === a.readyState && 200 === a.status && t(null, a.responseText);
        }),
        a.send(s);
    }
    Object.defineProperty(t, '__esModule', { value: !0 }), (t.post = o);
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 });
    var o = (t.count = {
      jsonp: {
        url:
          'https://www.linkedin.com/countserv/count/share?url={url}&callback={callback}',
        callback: function(e) {
          return e.count;
        }
      }
    });
    t.default = {
      config: {
        shareUrl:
          'https://www.linkedin.com/shareArticle?mini=true&url={url}&title={title}&summary={description}',
        count: o
      },
      popupDimensions: [800, 520],
      i18n: {
        az: 'LinkedIn',
        be: 'LinkedIn',
        en: 'LinkedIn',
        hy: 'LinkedIn',
        ka: 'LinkedIn',
        kk: 'LinkedIn',
        ro: 'LinkedIn',
        ru: 'LinkedIn',
        tr: 'LinkedIn',
        tt: 'LinkedIn',
        uk: 'LinkedIn'
      },
      color: '#0083be'
    };
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 });
    var o = (t.count = {
      jsonp: {
        url:
          'https://connect.mail.ru/share_count?func={callback}&callback=1&url_list={url}',
        callback: function(e) {
          return e[Object.keys(e)[0]].shares;
        }
      }
    });
    t.default = {
      config: {
        shareUrl:
          'https://connect.mail.ru/share?url={url}&title={title}&description={description}',
        count: o
      },
      popupDimensions: [560, 400],
      i18n: {
        az: 'Moy Mir',
        be: 'Мой Мир',
        en: 'Moi Mir',
        hy: 'Moi Mir',
        ka: 'Moi Mir',
        kk: 'Мой Мир',
        ro: 'Moi Mir',
        ru: 'Мой Мир',
        tr: 'Moi Mir',
        tt: 'Мой Мир',
        uk: 'Мой Мир'
      },
      color: '#168de2'
    };
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 });
    var o = (t.count = {
      jsonp: {
        url: 'https://connect.ok.ru/dk?st.cmd=extLike&uid=odklocs0&ref={url}',
        mount: function(e, t) {
          e.ODKL = {
            updateCount: function(e, n) {
              t(n);
            }
          };
        }
      }
    });
    t.default = {
      config: {
        shareUrl:
          'https://connect.ok.ru/offer?url={url}&title={title}&description={description}&imageUrl={image}',
        count: o
      },
      popupDimensions: [800, 520],
      i18n: {
        az: 'Odnoklassniki',
        be: 'Одноклассники',
        en: 'Odnoklassniki',
        hy: 'Odnoklassniki',
        ka: 'Odnoklasniki',
        kk: 'Одноклассники',
        ro: 'Odnoklassniki',
        ru: 'Одноклассники',
        tr: 'Odnoklasniki',
        tt: 'Одноклассники',
        uk: 'Однокласники'
      },
      color: '#eb722e'
    };
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 });
    var o = (t.count = {
      jsonp: {
        url:
          'https://api.pinterest.com/v1/urls/count.json?callback={callback}&url={url}',
        callback: function(e) {
          return e.count;
        }
      }
    });
    t.default = {
      config: {
        shareUrl:
          'https://pinterest.com/pin/create/button/?url={url}&media={image}&description={title}',
        count: o
      },
      popupDimensions: [800, 520],
      i18n: {
        az: 'Pinterest',
        be: 'Pinterest',
        en: 'Pinterest',
        hy: 'Pinterest',
        ka: 'Pinterest',
        kk: 'Pinterest',
        ro: 'Pinterest',
        ru: 'Pinterest',
        tr: 'Pinterest',
        tt: 'Pinterest',
        uk: 'Pinterest'
      },
      color: '#c20724'
    };
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 });
    var o = (t.count = {
      jsonp: {
        url: 'https://vk.com/share.php?act=count&index=0&url={url}',
        mount: function(e, t) {
          e.VK = {
            Share: {
              count: function(e, n) {
                t(n);
              }
            }
          };
        }
      }
    });
    t.default = {
      config: {
        shareUrl:
          'https://vk.com/share.php?url={url}&title={title}&description={description}&image={image}',
        count: o
      },
      popupDimensions: [550, 420],
      i18n: {
        az: 'ВКонтакте',
        be: 'ВКонтакте',
        en: 'VKontakte',
        hy: 'VKontakte',
        ka: 'VKontakte',
        kk: 'ВКонтакте',
        ro: 'VKontakte',
        ru: 'ВКонтакте',
        tr: 'VKontakte',
        tt: 'ВКонтакте',
        uk: 'ВКонтакті'
      },
      color: '#48729e'
    };
  },
  function(e, t, n) {
    'use strict';
    var o =
        'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
          ? function(e) {
              return typeof e;
            }
          : function(e) {
              return e &&
                'function' == typeof Symbol &&
                e.constructor === Symbol &&
                e !== Symbol.prototype
                ? 'symbol'
                : typeof e;
            },
      i = Object.prototype.hasOwnProperty,
      r = Object.prototype.toString,
      s = function(e) {
        return 'function' == typeof Array.isArray
          ? Array.isArray(e)
          : '[object Array]' === r.call(e);
      },
      a = function(e) {
        if (!e || '[object Object]' !== r.call(e)) return !1;
        var t = i.call(e, 'constructor'),
          n =
            e.constructor &&
            e.constructor.prototype &&
            i.call(e.constructor.prototype, 'isPrototypeOf');
        if (e.constructor && !t && !n) return !1;
        var o;
        for (o in e);
        return void 0 === o || i.call(e, o);
      };
    e.exports = function e() {
      var t,
        n,
        i,
        r,
        l,
        c,
        u = arguments[0],
        p = 1,
        d = arguments.length,
        h = !1;
      for (
        'boolean' == typeof u && ((h = u), (u = arguments[1] || {}), (p = 2)),
          (null == u ||
            ('object' !== (void 0 === u ? 'undefined' : o(u)) &&
              'function' != typeof u)) &&
            (u = {});
        p < d;
        ++p
      )
        if (null != (t = arguments[p]))
          for (n in t)
            (i = u[n]),
              (r = t[n]),
              u !== r &&
                (h && r && (a(r) || (l = s(r)))
                  ? (l
                      ? ((l = !1), (c = i && s(i) ? i : []))
                      : (c = i && a(i) ? i : {}),
                    (u[n] = e(h, c, r)))
                  : void 0 !== r && (u[n] = r));
      return u;
    };
  },
  function(e, t, n) {
    'use strict';
    var o,
      i =
        'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
          ? function(e) {
              return typeof e;
            }
          : function(e) {
              return e &&
                'function' == typeof Symbol &&
                e.constructor === Symbol &&
                e !== Symbol.prototype
                ? 'symbol'
                : typeof e;
            };
    o = (function() {
      return this;
    })();
    try {
      o = o || Function('return this')() || (0, eval)('this');
    } catch (e) {
      'object' === ('undefined' == typeof window ? 'undefined' : i(window)) &&
        (o = window);
    }
    e.exports = o;
  },
  function(e, t, n) {
    'use strict';
    (function(e) {
      function n(e) {
        try {
          return JSON.parse(e);
        } catch (e) {
          return {};
        }
      }
      function o(e) {
        return (e.parent !== e && e.parent) || e.opener || e.top;
      }
      Object.defineProperty(t, '__esModule', { value: !0 });
      var i = function(t, n) {
        (this._window = t),
          (this._opener = o(t)),
          (this._namespace = n),
          (this._subscriptions = new e());
      };
      (i.prototype.subscribe = function(e, t) {
        var o = this,
          i = function(e) {
            var i = n(e.data),
              r = i.namespace,
              s = i.action,
              a = i.payload;
            r === o._namespace && t(s, a);
          },
          r = this._subscriptions.get(e) || [];
        r.push(i),
          this._subscriptions.set(e, r),
          this._window.addEventListener('message', i);
      }),
        (i.prototype.unsubscribe = function(e) {
          var t = this;
          (this._subscriptions.get(e) || []).forEach(function(e) {
            return t._window.removeEventListener('message', e);
          }),
            this._subscriptions.delete(e);
        }),
        (i.prototype.publish = function(e, t, n) {
          (n || this._opener).postMessage(
            JSON.stringify({
              namespace: this._namespace,
              action: e,
              payload: t
            }),
            '*'
          );
        }),
        (t.default = i);
    }.call(t, n(14)));
  },
  function(e, t, n) {
    'use strict';
    function o() {
      var e = {};
      return function(t) {
        var n = t.valueOf(e);
        return void 0 !== n && n !== t && n.identity === e ? n : i(t, e);
      };
    }
    function i(e, t) {
      var n = { identity: t },
        o = e.valueOf,
        i = function(i) {
          return i !== t || this !== e ? o.apply(this, arguments) : n;
        };
      return (e.valueOf = i), n;
    }
    function r(e) {
      if (e !== Object(e))
        throw new TypeError('value is not a non-null object');
      return e;
    }
    e.exports =
      'WeakMap' in window
        ? window.WeakMap
        : function() {
            var e = o();
            return {
              get: function(t, n) {
                var o = e(r(t));
                return {}.hasOwnProperty.call(o, 'value') ? o.value : n;
              },
              set: function(t, n) {
                e(r(t)).value = n;
              },
              has: function(t) {
                return 'value' in e(t);
              },
              delete: function(t) {
                return delete e(r(t)).value;
              }
            };
          };
  },
  function(e, t, n) {
    'use strict';
    function o() {
      var e = n(20);
      return e.keys().reduce(function(t, n) {
        var o = n.match(/^\.\/(\w+)\.js/);
        return o && (t[o[1]] = e(n).default), t;
      }, {});
    }
    function i() {
      return n(40);
    }
    function r(e) {
      var t = n(41);
      return (
        n(68) +
        Object.keys(e)
          .map(function(n) {
            return (
              '\n.ya-share2__item_service_' +
              n +
              ' .ya-share2__badge\n{\n    background-color: ' +
              e[n].color +
              ';\n}\n\n.ya-share2__item_service_' +
              n +
              ' .ya-share2__icon\n{\n    background: url(' +
              t('./' + n + '.svg') +
              ');\n}\n'
            );
          })
          .join('')
      );
    }
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.loadPlugins = o),
      (t.getFrameUrl = i),
      (t.getCss = r);
  },
  function(e, t) {
    (function(t) {
      e.exports = t;
    }.call(t, {}));
  },
  function(e, t, n) {
    'use strict';
    function o(e) {
      return e && e.__esModule ? e : { default: e };
    }
    Object.defineProperty(t, '__esModule', { value: !0 });
    var i = n(79),
      r = o(i),
      s = n(2),
      a = o(s),
      l = {
        findInside: function(e, t) {
          return e.querySelectorAll('.' + r.default.stringify(t));
        },
        findOutside: function(e, t) {
          return a.default.closest(e, r.default.stringify(t));
        },
        getMod: function(e, t) {
          for (var n = 0, o = e.classList.length; n < o; n += 1) {
            var i = r.default.parse(e.classList[n]);
            if (i && i.modName === t) return i.modVal;
          }
        }
      };
    t.default = l;
  },
  function(e, t, n) {
    'use strict';
    function o(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var i =
        'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
          ? function(e) {
              return typeof e;
            }
          : function(e) {
              return e &&
                'function' == typeof Symbol &&
                e.constructor === Symbol &&
                e !== Symbol.prototype
                ? 'symbol'
                : typeof e;
            },
      r = n(19),
      s = o(r),
      a = n(15),
      l = n(69),
      c = o(l),
      u = n(70),
      p = o(u),
      d = n(0),
      h = (0, a.loadPlugins)(),
      f = (0, a.getFrameUrl)(),
      m = new c.default(s.default.metrika.id),
      _ = s.default.defaults,
      v = (0, p.default)({ defaults: _, plugins: h, frameUrl: f, metrika: m });
    (0, d.ready)(function() {
      m.init(), v('.ya-share2', { reinit: !1 });
    }),
      (window.Ya = window.Ya || {}),
      (window.Ya.share2 = function(e, t) {
        if (
          'object' === (void 0 === e ? 'undefined' : i(e)) &&
          1 === e.nodeType
        )
          return v(e, t)[0];
        if ('string' == typeof e)
          return (
            0 === e.indexOf('#') &&
              (console.log(
                'DEPRECATION: use element id instead of query selector for initialization'
              ),
              (e = e.slice(1))),
            v('#' + e, t)[0]
          );
        throw new TypeError('Neither element nor element id is provided');
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        metrika: { id: 26811653 },
        defaults: {
          hooks: { onready: function() {}, onshare: function() {} },
          theme: {
            bare: !1,
            copy: 'last',
            counter: !1,
            lang: 'ru',
            limit: !1,
            nonce: '',
            popupPosition: 'inner',
            popupDirection: 'bottom',
            services: 'collections,vkontakte,facebook,twitter',
            size: 'm',
            direction: 'horizontal'
          },
          i18n: {
            az: {
              copyLink: 'Əlaqə',
              pressToCopy: 'Press ctrl+C and Enter to copy'
            },
            be: {
              copyLink: 'Cпасылка',
              pressToCopy: 'Press ctrl+C and Enter to copy'
            },
            en: {
              copyLink: 'Copy link',
              pressToCopy: 'Press ctrl+C and Enter to copy'
            },
            hy: {
              copyLink: 'Հղում',
              pressToCopy: 'Press ctrl+C and Enter to copy'
            },
            ka: {
              copyLink: 'ბმული',
              pressToCopy: 'Press ctrl+C and Enter to copy'
            },
            kk: {
              copyLink: 'Сілтеме',
              pressToCopy: 'Press ctrl+C and Enter to copy'
            },
            ro: {
              copyLink: 'Link',
              pressToCopy: 'Press ctrl+C and Enter to copy'
            },
            ru: {
              copyLink: 'Скопировать ссылку',
              pressToCopy: 'Чтобы скопировать, нажмите ctrl+С и enter'
            },
            tr: {
              copyLink: 'Bağlantı',
              pressToCopy: 'Press ctrl+C and Enter to copy'
            },
            tt: {
              copyLink: 'Сылтама',
              pressToCopy: 'Press ctrl+C and Enter to copy'
            },
            uk: {
              copyLink: 'Посилання',
              pressToCopy: 'Press ctrl+C and Enter to copy'
            }
          },
          content: {
            template: 'default',
            description: '',
            image: '',
            title: window.document.title,
            url: window.location.href
          },
          contentByService: {}
        }
      });
  },
  function(e, t, n) {
    function o(e) {
      return n(i(e));
    }
    function i(e) {
      var t = r[e];
      if (!(t + 1)) throw new Error("Cannot find module '" + e + "'.");
      return t;
    }
    var r = {
      './blogger.js': 21,
      './collections.js': 22,
      './delicious.js': 23,
      './digg.js': 24,
      './evernote.js': 25,
      './facebook.js': 3,
      './gplus.js': 4,
      './linkedin.js': 6,
      './lj.js': 26,
      './moimir.js': 7,
      './odnoklassniki.js': 8,
      './pinterest.js': 9,
      './pocket.js': 27,
      './qzone.js': 28,
      './reddit.js': 29,
      './renren.js': 30,
      './sinaWeibo.js': 31,
      './skype.js': 32,
      './surfingbird.js': 33,
      './telegram.js': 34,
      './tencentWeibo.js': 35,
      './tumblr.js': 36,
      './twitter.js': 37,
      './viber.js': 38,
      './vkontakte.js': 10,
      './whatsapp.js': 39
    };
    (o.keys = function() {
      return Object.keys(r);
    }),
      (o.resolve = i),
      (e.exports = o),
      (o.id = 20);
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl:
            'https://www.blogger.com/blog-this.g?t={description}&u={url}&n={title}'
        },
        popupDimensions: [800, 320],
        i18n: {
          az: 'Blogger',
          be: 'Blogger',
          en: 'Blogger',
          hy: 'Blogger',
          ka: 'Blogger',
          kk: 'Blogger',
          ro: 'Blogger',
          ru: 'Blogger',
          tr: 'Blogger',
          tt: 'Blogger',
          uk: 'Blogger'
        },
        color: '#fb8f3d'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl:
            'https://yandex.fr/collections/share/?url={url}&image={image}&description={title}'
        },
        popupDimensions: [994, 576],
        i18n: {
          az: 'Yandex.Collections',
          be: 'Яндэкс.Калекцыi',
          en: 'Yandex.Collections',
          hy: 'Yandex.Collections',
          ka: 'Yandex.Collections',
          kk: 'Yandex.Collections',
          ro: 'Yandex.Collections',
          ru: 'Яндекс.Коллекции',
          tr: 'Yandex.Collections',
          tt: 'Yandex.Collections',
          uk: 'Yandex.Collections'
        },
        color: '#eb1c00'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl:
            'https://www.delicious.com/save?v=5&noui&jump=close&url={url}&title={title}'
        },
        popupDimensions: [800, 520],
        i18n: {
          az: 'Delicious',
          be: 'Delicious',
          en: 'Delicious',
          hy: 'Delicious',
          ka: 'Delicious',
          kk: 'Delicious',
          ro: 'Delicious',
          ru: 'Delicious',
          tr: 'Delicious',
          tt: 'Delicious',
          uk: 'Delicious'
        },
        color: '#31a9ff'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl:
            'https://digg.com/submit?url={url}&title={title}&bodytext={description}'
        },
        popupDimensions: [800, 520],
        i18n: {
          az: 'Digg',
          be: 'Digg',
          en: 'Digg',
          hy: 'Digg',
          ka: 'Digg',
          kk: 'Digg',
          ro: 'Digg',
          ru: 'Digg',
          tr: 'Digg',
          tt: 'Digg',
          uk: 'Digg'
        },
        color: '#000'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl:
            'https://www.evernote.com/clip.action?title={title}&body={description}&url={url}'
        },
        popupDimensions: [800, 520],
        i18n: {
          az: 'Evernote',
          be: 'Evernote',
          en: 'Evernote',
          hy: 'Evernote',
          ka: 'Evernote',
          kk: 'Evernote',
          ro: 'Evernote',
          ru: 'Evernote',
          tr: 'Evernote',
          tt: 'Evernote',
          uk: 'Evernote'
        },
        color: '#24d666'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl:
            'https://www.livejournal.com/update.bml?subject={title}&event={url}%0A{description}'
        },
        popupDimensions: [800, 520],
        i18n: {
          az: 'LiveJournal',
          be: 'LiveJournal',
          en: 'LiveJournal',
          hy: 'LiveJournal',
          ka: 'LiveJournal',
          kk: 'LiveJournal',
          ro: 'LiveJournal',
          ru: 'LiveJournal',
          tr: 'LiveJournal',
          tt: 'LiveJournal',
          uk: 'LiveJournal'
        },
        color: '#0d425a'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl: 'https://getpocket.com/save?url={url}&title={title}'
        },
        popupDimensions: [800, 520],
        i18n: {
          az: 'Pocket',
          be: 'Pocket',
          en: 'Pocket',
          hy: 'Pocket',
          ka: 'Pocket',
          kk: 'Pocket',
          ro: 'Pocket',
          ru: 'Pocket',
          tr: 'Pocket',
          tt: 'Pocket',
          uk: 'Pocket'
        },
        color: '#ee4056'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl:
            'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url={url}&title={title}&pics={image}'
        },
        popupDimensions: [800, 520],
        i18n: {
          az: 'Qzone',
          be: 'Qzone',
          en: 'Qzone',
          hy: 'Qzone',
          ka: 'Qzone',
          kk: 'Qzone',
          ro: 'Qzone',
          ru: 'Qzone',
          tr: 'Qzone',
          tt: 'Qzone',
          uk: 'Qzone'
        },
        color: '#f5b53c'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl: 'https://www.reddit.com/submit?url={url}&title={title}'
        },
        popupDimensions: [800, 520],
        i18n: {
          az: 'reddit',
          be: 'reddit',
          en: 'reddit',
          hy: 'reddit',
          ka: 'reddit',
          kk: 'reddit',
          ro: 'reddit',
          ru: 'reddit',
          tr: 'reddit',
          tt: 'reddit',
          uk: 'reddit'
        },
        color: '#ff4500'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl:
            'http://widget.renren.com/dialog/share?resourceUrl={url}&srcUrl={url}&title={title}&pic={image}&description={description}'
        },
        popupDimensions: [800, 520],
        i18n: {
          az: 'Renren',
          be: 'Renren',
          en: 'Renren',
          hy: 'Renren',
          ka: 'Renren',
          kk: 'Renren',
          ro: 'Renren',
          ru: 'Renren',
          tr: 'Renren',
          tt: 'Renren',
          uk: 'Renren'
        },
        color: '#1760a7'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl:
            'http://service.weibo.com/share/share.php?url={url}&type=3&pic={image}&title={title}'
        },
        popupDimensions: [800, 520],
        i18n: {
          az: 'Sina Weibo',
          be: 'Sina Weibo',
          en: 'Sina Weibo',
          hy: 'Sina Weibo',
          ka: 'Sina Weibo',
          kk: 'Sina Weibo',
          ro: 'Sina Weibo',
          ru: 'Sina Weibo',
          tr: 'Sina Weibo',
          tt: 'Sina Weibo',
          uk: 'Sina Weibo'
        },
        color: '#c53220'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: { shareUrl: 'https://web.skype.com/share?url={url}' },
        popupDimensions: [800, 520],
        i18n: {
          az: 'Skype',
          be: 'Skype',
          en: 'Skype',
          hy: 'Skype',
          ka: 'Skype',
          kk: 'Skype',
          ro: 'Skype',
          ru: 'Skype',
          tr: 'Skype',
          tt: 'Skype',
          uk: 'Skype'
        },
        color: '#00aff0'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl:
            'https://surfingbird.ru/share?url={url}&title={title}&desc={description}'
        },
        popupDimensions: [500, 170],
        i18n: {
          az: 'Surfingbird',
          be: 'Surfingbird',
          en: 'Surfingbird',
          hy: 'Surfingbird',
          ka: 'Surfingbird',
          kk: 'Surfingbird',
          ro: 'Surfingbird',
          ru: 'Surfingbird',
          tr: 'Surfingbird',
          tt: 'Surfingbird',
          uk: 'Surfingbird'
        },
        color: '#30baff'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl: 'https://telegram.me/share/url?url={url}&text={title}'
        },
        i18n: {
          az: 'telegram',
          be: 'telegram',
          en: 'telegram',
          hy: 'telegram',
          ka: 'telegram',
          kk: 'telegram',
          ro: 'telegram',
          ru: 'telegram',
          tr: 'telegram',
          tt: 'telegram',
          uk: 'telegram'
        },
        color: '#64a9dc'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl:
            'http://share.v.t.qq.com/index.php?c=share&a=index&url={url}&title={title}&pic={image}'
        },
        popupDimensions: [800, 520],
        i18n: {
          az: 'Tencent Weibo',
          be: 'Tencent Weibo',
          en: 'Tencent Weibo',
          hy: 'Tencent Weibo',
          ka: 'Tencent Weibo',
          kk: 'Tencent Weibo',
          ro: 'Tencent Weibo',
          ru: 'Tencent Weibo',
          tr: 'Tencent Weibo',
          tt: 'Tencent Weibo',
          uk: 'Tencent Weibo'
        },
        color: '#53a9d7'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl:
            'https://www.tumblr.com/share/link?url={url}&description={description}'
        },
        popupDimensions: [800, 520],
        i18n: {
          az: 'Tumblr',
          be: 'Tumblr',
          en: 'Tumblr',
          hy: 'Tumblr',
          ka: 'Tumblr',
          kk: 'Tumblr',
          ro: 'Tumblr',
          ru: 'Tumblr',
          tr: 'Tumblr',
          tt: 'Tumblr',
          uk: 'Tumblr'
        },
        color: '#547093'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: {
          shareUrl:
            'https://twitter.com/intent/tweet?text={title}&url={url}&hashtags={hashtags}'
        },
        contentOptions: { hashtags: '' },
        popupDimensions: [550, 420],
        i18n: {
          az: 'Twitter',
          be: 'Twitter',
          en: 'Twitter',
          hy: 'Twitter',
          ka: 'Twitter',
          kk: 'Twitter',
          ro: 'Twitter',
          ru: 'Twitter',
          tr: 'Twitter',
          tt: 'Twitter',
          uk: 'Twitter'
        },
        color: '#00aced'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: { shareUrl: 'viber://forward?text={title}%20{url}' },
        i18n: {
          az: 'Viber',
          be: 'Viber',
          en: 'Viber',
          hy: 'Viber',
          ka: 'Viber',
          kk: 'Viber',
          ro: 'Viber',
          ru: 'Viber',
          tr: 'Viber',
          tt: 'Viber',
          uk: 'Viber'
        },
        color: '#7b519d'
      });
  },
  function(e, t, n) {
    'use strict';
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.default = {
        config: { shareUrl: 'whatsapp://send?text={title}%20{url}' },
        i18n: {
          az: 'WhatsApp',
          be: 'WhatsApp',
          en: 'WhatsApp',
          hy: 'WhatsApp',
          ka: 'WhatsApp',
          kk: 'WhatsApp',
          ro: 'WhatsApp',
          ru: 'WhatsApp',
          tr: 'WhatsApp',
          tt: 'WhatsApp',
          uk: 'WhatsApp'
        },
        color: '#65bc54'
      });
  },
  function(e, t, n) {
    e.exports = n.p + 'frame.html';
  },
  function(e, t, n) {
    function o(e) {
      return n(i(e));
    }
    function i(e) {
      var t = r[e];
      if (!(t + 1)) throw new Error("Cannot find module '" + e + "'.");
      return t;
    }
    var r = {
      './blogger.svg': 42,
      './collections.svg': 43,
      './delicious.svg': 44,
      './digg.svg': 45,
      './evernote.svg': 46,
      './facebook.svg': 47,
      './gplus.svg': 48,
      './linkedin.svg': 49,
      './lj.svg': 50,
      './moimir.svg': 51,
      './odnoklassniki.svg': 52,
      './pinterest.svg': 53,
      './pocket.svg': 54,
      './qzone.svg': 55,
      './reddit.svg': 56,
      './renren.svg': 57,
      './sinaWeibo.svg': 58,
      './skype.svg': 59,
      './surfingbird.svg': 60,
      './telegram.svg': 61,
      './tencentWeibo.svg': 62,
      './tumblr.svg': 63,
      './twitter.svg': 64,
      './viber.svg': 65,
      './vkontakte.svg': 66,
      './whatsapp.svg': 67
    };
    (o.keys = function() {
      return Object.keys(r);
    }),
      (o.resolve = i),
      (e.exports = o),
      (o.id = 41);
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M19.896 14.833A5.167 5.167 0 0 1 14.729 20H9.166A5.167 5.167 0 0 1 4 14.833V9.167A5.166 5.166 0 0 1 9.166 4h2.608a5.167 5.167 0 0 1 5.167 5.167l.002.011c.037.536.484.96 1.03.96l.018-.002h.872c.57 0 1.034.463 1.034 1.034l-.001 3.663zM9.038 10.176h2.926a.993.993 0 0 0 0-1.987H9.038a.994.994 0 0 0 0 1.987zm5.867 3.83H9.032a.94.94 0 0 0 0 1.879h5.873a.94.94 0 1 0 0-1.88z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 18l5-2.71L17 18V6H7v12z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 12h8v8H4zm8-8h8v8h-7.984z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.555 10.814V14.1h.96s.18.005.18-.222v-3.287h-.96s-.18-.006-.18.222zm8.032 3.065v-3.287h-.96s-.18-.006-.18.222V14.1h.96s.18.006.18-.222zm-5.306 1.32c0 .227-.18.222-.18.222H4V9.497c0-.227.18-.222.18-.222h2.514V7.222c0-.227.18-.222.18-.222h1.408l-.001 8.199zm2.065 0c0 .227-.18.221-.18.221H8.761V9.496c0-.226.18-.221.18-.221h1.406v5.924zm0-7.103c0 .227-.18.222-.18.222H8.76V7.222c0-.227.18-.222.18-.222h1.408l-.001 1.096zm4.827 9.21c0 .228-.18.223-.18.223h-4.1v-1.096c0-.227.18-.222.18-.222h2.513v-.79h-2.694V9.497c0-.227.18-.222.18-.222l4.102.003v8.029zm4.826 0c0 .228-.18.223-.18.223h-4.1v-1.096c0-.227.18-.222.18-.222h2.514v-.79h-2.695V9.497c0-.227.18-.222.18-.222L20 9.279v8.028zm-1.585-3.427v-3.287h-.96s-.18-.006-.18.222V14.1h.96s.18.006.18-.222z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6.277 7.109h1.517c.08 0 .16-.08.16-.16V5.313c0-.28.08-.559.159-.758l.04-.12L5.2 7.348l.16-.08c.239-.12.558-.16.917-.16zm11.654-.28c-.12-.638-.479-.917-.838-1.037-.36-.12-.718-.28-1.676-.4-.759-.08-1.557-.12-2.116-.12-.16-.438-.399-.917-1.317-1.156-.638-.16-1.796-.12-2.155-.08-.559.08-.758.319-.918.479-.16.16-.28.598-.28.878v1.556c0 .48-.318.838-.877.838H6.397c-.32 0-.559.04-.758.12-.16.12-.32.28-.4.4-.2.279-.239.598-.239.957 0 0 0 .28.08.798.04.4.479 3.033.878 3.911.16.36.28.48.599.639.718.32 2.354.639 3.152.758.759.08 1.278.32 1.557-.279 0 0 .04-.16.12-.36a6.3 6.3 0 0 0 .28-1.915c0-.04.079-.04.079 0 0 .36-.08 1.557.838 1.876.36.12 1.118.24 1.876.32.678.079 1.197.358 1.197 2.114 0 1.078-.24 1.238-1.397 1.238-.958 0-1.317.04-1.317-.759 0-.598.599-.558 1.078-.558.2 0 .04-.16.04-.52 0-.398.24-.598 0-.598-1.557-.04-2.475 0-2.475 1.956 0 1.796.679 2.115 2.914 2.115 1.756 0 2.354-.04 3.073-2.275.16-.439.479-1.796.678-4.03.16-1.478-.12-5.788-.319-6.866zm-3.033 4.75c-.2 0-.32 0-.519.04h-.08s-.04 0-.04-.04v-.04c.08-.4.28-.878.878-.878.639.04.799.599.799 1.038v.04c0 .04-.04.04-.04.04-.04 0-.04 0-.04-.04-.28-.08-.599-.12-.958-.16z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.423 20v-7.298h2.464l.369-2.845h-2.832V8.042c0-.824.23-1.385 1.417-1.385h1.515V4.111A20.255 20.255 0 0 0 14.148 4c-2.183 0-3.678 1.326-3.678 3.76v2.097H8v2.845h2.47V20h2.953z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9.09 11.364v1.745h2.888c-.116.75-.873 2.196-2.887 2.196-1.738 0-3.156-1.44-3.156-3.214 0-1.775 1.418-3.215 3.156-3.215.989 0 1.65.422 2.029.786l1.382-1.331C11.615 7.5 10.465 7 9.09 7A5.087 5.087 0 0 0 4 12.09a5.087 5.087 0 0 0 5.09 5.092c2.94 0 4.888-2.066 4.888-4.975 0-.334-.036-.589-.08-.843H9.091zm10.91 0h-1.455V9.909h-1.454v1.455h-1.455v1.454h1.455v1.455h1.454v-1.455H20' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.246 8.954h3.41v10.281h-3.41zm1.725-4.935c-1.167 0-1.929.769-1.929 1.776 0 .987.74 1.777 1.884 1.777h.022c1.19 0 1.93-.79 1.93-1.777-.023-1.007-.74-1.776-1.907-1.776zm10.052 4.715c-1.81 0-2.62.997-3.073 1.698V8.976H9.54c.045.965 0 10.281 0 10.281h3.41v-5.742c0-.307.022-.614.112-.834.246-.613.807-1.25 1.75-1.25 1.233 0 1.727.944 1.727 2.325v5.501h3.41v-5.896c0-3.158-1.683-4.627-3.926-4.627z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M17.815 13.3c.438 2.114.868 4.221 1.306 6.336.037.178-.148.385-.334.311-2.025-.741-4.006-1.49-6.01-2.24a.625.625 0 0 1-.318-.23l-7.39-8.903c-.067-.082-.082-.215-.06-.32.312-1.23.72-2.143 1.752-3.019C7.799 4.36 8.779 4.1 10.047 4.004c.156-.015.223.014.312.133 2.418 2.909 4.837 5.817 7.248 8.725a.888.888 0 0 1 .208.438z' fill='%23FFF'/%3E%3Cpath d='M6.175 8.462c.69-1.795 2.3-3.004 3.835-3.301l-.185-.223a4.242 4.242 0 0 0-3.85 3.272l.2.252z' fill='%230D425A'/%3E%3Cpath d='M10.53 5.792c-1.744.326-3.124 1.513-3.851 3.271l.905 1.091c.787-1.78 2.3-2.997 3.836-3.302l-.89-1.06zm2.76 7.827L9.364 8.9a6.119 6.119 0 0 0-1.269 1.87l4.89 5.89c.289-.385.867-2.359.303-3.041zM9.647 8.633l3.947 4.748c.445.542 2.456.327 3.086-.193l-4.756-5.72c-.793.156-1.587.564-2.277 1.165zm7.308 5.045c-.609.46-1.9.735-2.931.527.074.823-.096 1.892-.616 2.745l1.885.712 1.528.564c.223-.378.542-.608.913-.764l-.35-1.692-.43-2.092z' fill='%230D425A'/%3E%3C/g%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8.889 9.667a1.333 1.333 0 1 0 0-2.667 1.333 1.333 0 0 0 0 2.667zm6.222 0a1.333 1.333 0 1 0 0-2.667 1.333 1.333 0 0 0 0 2.667zm4.77 6.108l-1.802-3.028a.879.879 0 0 0-1.188-.307.843.843 0 0 0-.313 1.166l.214.36a6.71 6.71 0 0 1-4.795 1.996 6.711 6.711 0 0 1-4.792-1.992l.217-.364a.844.844 0 0 0-.313-1.166.878.878 0 0 0-1.189.307l-1.8 3.028a.844.844 0 0 0 .312 1.166.88.88 0 0 0 1.189-.307l.683-1.147a8.466 8.466 0 0 0 5.694 2.18 8.463 8.463 0 0 0 5.698-2.184l.685 1.151a.873.873 0 0 0 1.189.307.844.844 0 0 0 .312-1.166z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFF' fill-rule='evenodd'%3E%3Cpath d='M11.674 6.536a1.69 1.69 0 0 0-1.688 1.688c0 .93.757 1.687 1.688 1.687a1.69 1.69 0 0 0 1.688-1.687 1.69 1.69 0 0 0-1.688-1.688zm0 5.763a4.08 4.08 0 0 1-4.076-4.075 4.08 4.08 0 0 1 4.076-4.077 4.08 4.08 0 0 1 4.077 4.077 4.08 4.08 0 0 1-4.077 4.075zM10.025 15.624a7.633 7.633 0 0 1-2.367-.98 1.194 1.194 0 0 1 1.272-2.022 5.175 5.175 0 0 0 5.489 0 1.194 1.194 0 1 1 1.272 2.022 7.647 7.647 0 0 1-2.367.98l2.279 2.28a1.194 1.194 0 0 1-1.69 1.688l-2.238-2.24-2.24 2.24a1.193 1.193 0 1 1-1.689-1.689l2.279-2.279'/%3E%3C/g%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9.742c0 1.58.599 2.986 1.884 3.51.21.087.4.003.46-.23.043-.16.144-.568.189-.738.06-.23.037-.31-.133-.512-.37-.436-.608-1.001-.608-1.802 0-2.322 1.74-4.402 4.53-4.402 2.471 0 3.829 1.508 3.829 3.522 0 2.65-1.174 4.887-2.917 4.887-.963 0-1.683-.795-1.452-1.77.276-1.165.812-2.421.812-3.262 0-.752-.405-1.38-1.24-1.38-.985 0-1.775 1.017-1.775 2.38 0 .867.293 1.454.293 1.454L8.69 16.406c-.352 1.487-.053 3.309-.028 3.492.015.11.155.136.22.054.09-.119 1.262-1.564 1.66-3.008.113-.409.647-2.526.647-2.526.32.61 1.254 1.145 2.248 1.145 2.957 0 4.964-2.693 4.964-6.298C18.4 6.539 16.089 4 12.576 4 8.204 4 6 7.13 6 9.742z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M17.9 5c1.159 0 2.1.948 2.1 2.117v5.862c0 .108-.008.215-.024.32.016.156.024.314.024.473 0 3.36-3.582 6.085-8 6.085s-8-2.724-8-6.085c0-.159.008-.317.024-.473a2.148 2.148 0 0 1-.024-.32V7.117C4 5.948 4.94 5 6.1 5h11.8zM8.596 9.392L12 12.795l3.404-3.403a1.063 1.063 0 0 1 1.502 1.502l-4.132 4.131c-.21.21-.486.314-.76.311-.284.01-.571-.094-.788-.31l-4.132-4.132a1.063 1.063 0 0 1 1.502-1.502z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M17.367 14.463s-.105.148-.457.299l-.553.222.597 3.273c.062.282.25.983-.082 1.062-.17.04-.307-.067-.395-.121l-.769-.445-2.675-1.545c-.204-.122-.78-.546-1.093-.489-.205.038-.336.127-.483.216l-.77.445-2.39 1.386-.883.508c-.123.06-.301.058-.394-.025-.07-.063-.09-.253-.063-.388l.19-1.004.572-3.02c.047-.2.237-.975.166-1.137-.048-.107-.173-.196-.261-.267l-.61-.565-2.13-1.983c-.189-.153-.345-.345-.533-.496l-.235-.216c-.062-.078-.165-.235-.09-.369.142-.248.974-.218 1.335-.28l2.682-.31.82-.09c.146-.024.299-.004.413-.063.239-.123.51-.809.636-1.087l1.31-2.714c.151-.297.286-.603.431-.896.075-.15.133-.308.305-.356.162-.045.257.105.312.178.177.235.325.685.451.973l1.29 2.853c.104.238.363.964.54 1.074.266.166.858.108 1.227.172l2.841.292c.355.062 1.245.01 1.36.267.076.17-.072.314-.152.394l-.864.814-1.983 1.868c-.185.164-.77.637-.833.858-.04.14.02.414.088.722-.096-.001-.39-.007-1.182-.029-.63-.007-2.616-.17-2.713-.178l-.84-.076c-.14-.023-.326.012-.4-.076v-.02c1.727-1.168 3.407-2.416 5.142-3.578l-.006-.044c-.146-.072-.359-.059-.54-.095-.385-.077-.79-.078-1.208-.147-.75-.124-1.59-.114-2.434-.114-1.172 0-2.329.03-3.35.21-.45.079-.894.095-1.309.197-.172.042-.358.03-.49.108l.007.012c.1.027.253.02.381.02l.928.019.808.025.813.032.591.032c.486.075 1.007.036 1.475.114.404.068.804.065 1.182.14.113.022.245.015.33.064v.006c-.039.094-.336.255-.432.318l-1.055.743-2.256 1.62-1.417.992c.003.048.024.035.045.061 1.15.167 2.52.258 3.77.262 1.298.005 2.465-.094 3.118-.193.561-.086 1.082-.147 1.653-.287.325-.08.521-.148.521-.148z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16.542 10.63c-1.105-.636-2.494-1.033-4.025-1.118l.808-2.393 2.182.637c0 .963.78 1.742 1.743 1.742.964 0 1.758-.779 1.758-1.742C19.008 6.78 18.214 6 17.25 6c-.609 0-1.148.326-1.459.793l-2.65-.764a.482.482 0 0 0-.61.311l-1.063 3.172c-1.516.085-2.905.482-4.01 1.119a1.987 1.987 0 0 0-1.46-.623A1.995 1.995 0 0 0 4 12.004c0 .75.425 1.403 1.035 1.742-.029.17-.043.34-.043.51 0 2.62 3.146 4.744 7.015 4.744 3.855 0 7-2.124 7-4.744 0-.17-.013-.34-.042-.51A1.974 1.974 0 0 0 20 12.004a1.995 1.995 0 0 0-1.998-1.996c-.581 0-1.091.24-1.46.623zM9.499 12.5a1.01 1.01 0 0 1 1.006 1.006.998.998 0 0 1-1.006.991.986.986 0 0 1-.992-.991c0-.553.439-1.006.992-1.006zm5.002 0a.998.998 0 0 0-.992 1.006c0 .552.44.991.992.991a.998.998 0 0 0 1.006-.991 1.01 1.01 0 0 0-1.006-1.006zm-5.3 3.597a.484.484 0 0 1-.085-.694c.156-.226.482-.255.694-.085.567.44 1.474.68 2.197.68.709 0 1.616-.24 2.197-.68a.484.484 0 0 1 .694.085.496.496 0 0 1-.085.694c-.737.58-1.885.907-2.806.907-.935 0-2.07-.326-2.806-.907zm8.05-7.59c-.411 0-.752-.34-.752-.75 0-.426.34-.752.751-.752s.752.326.752.751c0 .41-.34.75-.752.75z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.019 15.562l-.001-.003-.018.002a.055.055 0 0 0 .019.001zM7.71 12.398l.146-.68c.048-.205.03-.452.03-.692V9.812L7.88 8c-.139 0-.278.043-.393.076-.358.102-.666.201-.962.352-1.158.59-2.022 1.565-2.387 2.944-.343 1.297-.007 2.652.522 3.507.118.19.269.48.44.61.135-.02.272-.15.375-.217a6.06 6.06 0 0 0 .622-.452l.24-.229c.63-.506 1.075-1.346 1.373-2.193zm4.276 3.164h.02a.382.382 0 0 0-.019-.003v.003zm-3.01-.888l-.258-.575-.088-.264H8.62l-.264.498c-.176.288-.358.574-.557.839a6.5 6.5 0 0 1-.85.944l-.517.422.012.024.287.14c.206.091.43.173.657.235.788.217 1.811.177 2.545-.053.178-.055.643-.194.739-.305v-.017c-.177-.092-.324-.254-.47-.381a5.573 5.573 0 0 1-1.225-1.507zm10.884-3.302c-.365-1.379-1.23-2.354-2.387-2.944-.296-.15-.604-.25-.962-.352-.115-.033-.254-.077-.393-.076l-.005 1.812v1.214c0 .24-.019.487.029.692l.147.68c.297.847.741 1.687 1.372 2.193l.24.23c.196.164.402.309.622.45.103.067.24.198.375.218.171-.13.322-.42.44-.61.529-.855.865-2.21.522-3.507zm-3.66 3.8c-.2-.265-.381-.55-.557-.839l-.264-.498h-.011l-.088.264-.258.575a5.576 5.576 0 0 1-1.226 1.507c-.145.127-.292.29-.469.38v.018c.096.111.561.25.739.305.734.23 1.757.27 2.545.053a4.85 4.85 0 0 0 .657-.234l.287-.141a1.31 1.31 0 0 0 .012-.024l-.516-.422a6.5 6.5 0 0 1-.85-.944zm-1.653-2.727c.068-.192.097-.402.146-.61.05-.21.024-.484.024-.727V9.753l-.006-1.741c-.015-.008-.02-.01-.047-.012-.197.047-.326.05-.592.14-.357.102-.685.275-.985.44-.289.16-.53.388-.78.587-.097.077-.199.19-.308.312l.01.01a1.19 1.19 0 0 0-.01.012l.36.47c.232.359.445.763.581 1.213.326 1.079.182 2.411-.235 3.273a4.9 4.9 0 0 1-.445.75l-.258.323a.018.018 0 0 1-.003.007c.004.007.01.016.012.022h.008c.395-.215.686-.574 1.027-.844.189-.15.354-.35.504-.54.404-.514.755-1.046.997-1.73zm-2.55 3.085l-.259-.323a4.903 4.903 0 0 1-.445-.75c-.417-.862-.561-2.194-.235-3.273.136-.45.35-.854.58-1.214L12 9.501l-.01-.011.01-.01a2.791 2.791 0 0 0-.308-.313c-.25-.2-.491-.427-.78-.586-.3-.166-.628-.339-.985-.44-.266-.09-.395-.094-.592-.141-.026.001-.032.004-.047.012l-.006 1.741v1.355c0 .243-.026.517.024.727.049.208.078.418.146.61.242.684.593 1.216.997 1.73.15.19.315.39.505.54.34.27.63.629 1.026.844h.008c.001-.006.008-.015.012-.022a.019.019 0 0 1-.003-.007z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ctitle%3EsinaWeibo%3C/title%3E%3Cpath d='M10.266 14.696c-.103.421.55.447.64.063.037-.191-.103-.332-.282-.332-.167 0-.333.128-.358.269zm-.128.945c.102-.498-.307-.869-.793-.843-.46.038-.843.358-.92.754-.115.511.307.882.793.844.46-.026.843-.345.92-.755zm3.797-3.157c-1.586-.997-3.707-1.01-5.42-.447-.857.28-1.764.818-2.301 1.495-.627.793-.882 1.815-.23 2.8.958 1.431 3.413 2.033 5.675 1.508 1.33-.307 2.749-1.048 3.35-2.326.562-1.177-.052-2.378-1.074-3.03zm-3.17.498c.945.167 1.7.755 1.827 1.739.243 1.854-2.173 3.336-4.026 2.327a1.933 1.933 0 0 1-.742-2.723c.435-.767 1.266-1.266 2.148-1.355a2.75 2.75 0 0 1 .793.012zm6.11-.37c-.268-.18-.538-.281-.856-.383-.308-.103-.359-.154-.243-.46.076-.218.14-.41.166-.666.14-1.15-.793-1.495-1.854-1.406-.498.039-.92.167-1.355.307-.281.09-.806.384-.92.205-.064-.09.013-.23.038-.32.166-.626.23-1.496-.384-1.88-.447-.28-1.227-.204-1.7-.038-2.556.87-6.455 4.552-5.663 7.479.18.664.55 1.163.908 1.521 1.061 1.061 2.71 1.65 4.231 1.866 1.112.154 2.263.14 3.375-.064 1.815-.332 3.554-1.15 4.679-2.607.754-.972.997-2.352 0-3.235a3.334 3.334 0 0 0-.422-.319zm1.623-3.682c.652 1.483-.064 2.148.166 2.66.192.421.767.46 1.023.14.191-.243.294-.959.307-1.278a4.193 4.193 0 0 0-1.125-3.12c-.984-1.073-2.276-1.444-3.694-1.303-.256.025-.46.064-.601.217-.332.358-.166.882.294.959.384.063 1.342-.23 2.416.396.498.307.971.792 1.214 1.33zm-3.45-.562c-.282.345-.078.87.408.856.294-.012.358-.05.677.051.307.103.626.448.64.857.025.268-.282.895.32 1.061a.523.523 0 0 0 .536-.166c.115-.128.166-.371.192-.575.089-.857-.333-1.598-1.01-2.02-.384-.23-1.445-.46-1.764-.064z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M19.537 13.698c.115-.52.176-1.06.176-1.614 0-4.155-3.415-7.524-7.63-7.524-.444 0-.88.038-1.304.11A4.444 4.444 0 0 0 8.425 4C5.981 4 4 5.954 4 8.364c0 .805.222 1.56.608 2.207a7.428 7.428 0 0 0-.155 1.513c0 4.156 3.416 7.4 7.63 7.4.477 0 .944-.044 1.397-.126.623.33 1.335.642 2.092.642 2.444 0 4.425-1.953 4.425-4.364 0-.695-.166-1.354-.46-1.938zm-3.974 1.457c-.294.418-.725.747-1.293.984-.567.238-1.239.356-2.016.356-.933 0-1.702-.162-2.308-.486a2.986 2.986 0 0 1-1.047-.934c-.268-.39-.403-.768-.403-1.137 0-.213.08-.395.242-.547a.855.855 0 0 1 .615-.229c.202 0 .373.059.512.178.14.119.26.294.358.527.12.278.25.51.39.695.139.185.336.34.589.46.254.12.587.18 1 .18.566 0 1.027-.12 1.382-.364.354-.243.532-.547.532-.91a.919.919 0 0 0-.287-.702 1.88 1.88 0 0 0-.741-.412 13.21 13.21 0 0 0-1.216-.303c-.678-.146-1.247-.318-1.703-.513-.458-.196-.822-.463-1.09-.8-.269-.34-.403-.759-.403-1.26 0-.48.142-.904.426-1.275.283-.372.693-.658 1.23-.858.537-.2 1.17-.299 1.895-.299.58 0 1.082.066 1.505.198.423.133.774.309 1.053.528.28.22.484.45.612.691.13.24.194.477.194.705 0 .21-.08.4-.241.567a.8.8 0 0 1-.603.252c-.22 0-.386-.05-.5-.151-.114-.101-.237-.266-.37-.495a2.27 2.27 0 0 0-.618-.768c-.241-.184-.627-.276-1.16-.276-.494 0-.893.1-1.196.3-.303.199-.455.44-.455.72 0 .173.053.324.155.45.103.128.245.235.426.326.18.091.363.162.547.214.185.052.49.126.916.225a15.47 15.47 0 0 1 1.446.38c.432.138.8.307 1.103.503.302.198.54.45.709.752.17.302.255.673.255 1.111 0 .525-.148.998-.442 1.417z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M17.315 8.49l-.214 1.987-3.436 3.382h-1.826l-.698 1.826v2.523l-2.47-.698 2.846-5.1L4 8.167l5.638.752L6.899 5l7.463 4.027 2.202-2.47h1.02L20 7.631z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M18.92 6.089L4.747 11.555c-.967.388-.962.928-.176 1.168l3.534 1.104 1.353 4.146c.164.454.083.634.56.634.368 0 .53-.168.736-.368.13-.127.903-.88 1.767-1.719l3.677 2.717c.676.373 1.165.18 1.333-.628l2.414-11.374c.247-.99-.378-1.44-1.025-1.146zM8.66 13.573l7.967-5.026c.398-.242.763-.112.463.154l-6.822 6.155-.265 2.833-1.343-4.116z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8.813 6.01a4.397 4.397 0 0 0-4.326 6.121c.087.199.312.29.511.2a.382.382 0 0 0 .206-.51 3.566 3.566 0 0 1-.286-1.668A3.616 3.616 0 0 1 8.76 6.79a3.615 3.615 0 0 1 3.366 3.84 3.615 3.615 0 0 1-4.65 3.218.39.39 0 0 0-.486.263.394.394 0 0 0 .262.485c.315.093.647.152.977.174a4.397 4.397 0 0 0 4.677-4.087A4.398 4.398 0 0 0 8.813 6.01zm-1.348 5.658a1.67 1.67 0 1 0-.46-.655c-.274.27-.565.59-.854.966-1.022 1.315-2.224 3.694-2.148 7.007.006.204.157.484.355.497l.04.002c.213.015.394-.301.391-.516-.064-2.458.6-4.662 1.955-6.423.242-.316.488-.626.72-.878zm12.388 4.106c-1.307-.48-2.302-1.27-2.95-2.352a4.873 4.873 0 0 1-.354-.71.819.819 0 0 0 .337-.36.829.829 0 0 0-.395-1.098.822.822 0 0 0-1.098.392.822.822 0 0 0 .724 1.177c.091.237.218.516.39.81.483.812 1.431 1.912 3.196 2.558a.226.226 0 0 0 .278-.113c0-.006.005-.01.007-.022a.224.224 0 0 0-.135-.282zm-3.767-1.676a2.04 2.04 0 0 1-1.707-3.042 2.039 2.039 0 0 1 2.784-.787 2.04 2.04 0 0 1 .786 2.783 1.92 1.92 0 0 1-.268.378.223.223 0 0 0 .014.314c.09.082.234.074.313-.016a2.489 2.489 0 1 0-4.017-2.89 2.493 2.493 0 0 0 2.08 3.708.224.224 0 0 0 .015-.448z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.72 7.7h3.699v2.857h-3.7v4.102c0 .928-.01 1.463.087 1.726.098.262.343.534.61.69.355.213.758.32 1.214.32.81 0 1.616-.264 2.417-.79v2.522c-.683.322-1.302.55-1.857.678a7.94 7.94 0 0 1-1.798.195 4.905 4.905 0 0 1-1.724-.276 4.215 4.215 0 0 1-1.438-.79c-.399-.343-.673-.706-.826-1.09-.154-.386-.23-.945-.23-1.676v-5.611H7V8.29c.628-.203 1.357-.496 1.804-.877.45-.382.809-.84 1.08-1.374.272-.534.459-1.214.56-2.039h2.276v3.7z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 7.539a6.56 6.56 0 0 1-1.885.517 3.294 3.294 0 0 0 1.443-1.816 6.575 6.575 0 0 1-2.085.796 3.283 3.283 0 0 0-5.593 2.994A9.32 9.32 0 0 1 5.114 6.6a3.28 3.28 0 0 0 1.016 4.382 3.274 3.274 0 0 1-1.487-.41v.041a3.285 3.285 0 0 0 2.633 3.218 3.305 3.305 0 0 1-1.482.056 3.286 3.286 0 0 0 3.066 2.28A6.585 6.585 0 0 1 4 17.524 9.291 9.291 0 0 0 9.032 19c6.038 0 9.34-5 9.34-9.337 0-.143-.004-.285-.01-.425A6.672 6.672 0 0 0 20 7.538z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFF' fill-rule='evenodd'%3E%3Cpath d='M18.434 15.574c-.484-.391-1.002-.743-1.511-1.102-1.016-.718-1.945-.773-2.703.38-.426.648-1.021.677-1.644.392-1.718-.782-3.044-1.989-3.821-3.743-.344-.777-.34-1.473.465-2.022.425-.29.854-.634.82-1.268-.045-.828-2.043-3.593-2.832-3.885a1.429 1.429 0 0 0-.984 0C4.373 4.95 3.606 6.48 4.34 8.292c2.19 5.405 6.043 9.167 11.349 11.463.302.13.638.183.808.23 1.208.012 2.623-1.158 3.032-2.318.393-1.117-.438-1.56-1.096-2.093zM12.485 4.88c3.879.6 5.668 2.454 6.162 6.38.045.363-.09.909.426.919.538.01.408-.528.413-.89.045-3.699-3.163-7.127-6.888-7.253-.281.04-.863-.195-.9.438-.024.427.466.357.787.406z'/%3E%3Cpath d='M13.244 5.957c-.373-.045-.865-.222-.953.299-.09.546.458.49.811.57 2.395.538 3.23 1.414 3.624 3.802.057.349-.057.89.532.8.436-.066.278-.53.315-.802.02-2.293-1.936-4.38-4.329-4.669z'/%3E%3Cpath d='M13.464 7.832c-.249.006-.493.033-.585.3-.137.4.152.496.446.544.983.158 1.5.74 1.598 1.725.027.268.195.484.452.454.356-.043.389-.361.378-.664.017-1.106-1.227-2.385-2.289-2.359z'/%3E%3C/g%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.576-1.496c.588-.19 1.341 1.26 2.14 1.818.605.422 1.064.33 1.064.33l2.137-.03s1.117-.071.587-.964c-.043-.073-.308-.661-1.588-1.87-1.34-1.264-1.16-1.059.453-3.246.983-1.332 1.376-2.145 1.253-2.493-.117-.332-.84-.244-.84-.244l-2.406.015s-.178-.025-.31.056c-.13.079-.212.262-.212.262s-.382 1.03-.89 1.907c-1.07 1.85-1.499 1.948-1.674 1.832-.407-.267-.305-1.075-.305-1.648 0-1.793.267-2.54-.521-2.733-.262-.065-.454-.107-1.123-.114-.858-.009-1.585.003-1.996.208-.274.136-.485.44-.356.457.159.022.519.099.71.363.246.341.237 1.107.237 1.107s.142 2.11-.33 2.371c-.325.18-.77-.187-1.725-1.865-.489-.859-.859-1.81-.859-1.81s-.07-.176-.198-.272c-.154-.115-.37-.151-.37-.151l-2.286.015s-.343.01-.469.161C3.94 7.721 4.043 8 4.043 8s1.79 4.258 3.817 6.403c1.858 1.967 3.968 1.838 3.968 1.838h.957z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      "\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 11.794c0 4.304-3.517 7.794-7.855 7.794a7.87 7.87 0 0 1-3.796-.97L4 20l1.418-4.182a7.714 7.714 0 0 1-1.127-4.024C4.29 7.489 7.807 4 12.145 4S20 7.49 20 11.794zm-7.855-6.553c-3.641 0-6.603 2.94-6.603 6.553 0 1.434.467 2.762 1.258 3.842l-.825 2.433 2.537-.806a6.6 6.6 0 0 0 3.633 1.084c3.642 0 6.604-2.94 6.604-6.553s-2.962-6.553-6.604-6.553zm3.967 8.348c-.049-.08-.177-.128-.37-.223-.192-.095-1.139-.558-1.315-.621-.177-.064-.305-.096-.434.095a10.92 10.92 0 0 1-.61.749c-.112.128-.224.143-.416.048-.193-.096-.813-.297-1.549-.948a5.76 5.76 0 0 1-1.07-1.323c-.113-.191-.013-.295.084-.39.086-.086.192-.223.289-.334.096-.112.128-.191.192-.319s.032-.239-.016-.335c-.048-.095-.433-1.035-.594-1.418-.16-.382-.32-.318-.433-.318-.112 0-.24-.016-.369-.016a.71.71 0 0 0-.513.239c-.177.19-.674.653-.674 1.593s.69 1.848.786 1.976c.096.127 1.332 2.119 3.289 2.884 1.958.764 1.958.51 2.31.477.353-.031 1.14-.461 1.3-.908.16-.446.16-.829.113-.908z' fill='%23FFF' fill-rule='evenodd'/%3E%3C/svg%3E\"";
  },
  function(e, t) {
    e.exports =
      '.ya-share2,\n.ya-share2 * {\n  line-height: normal;\n}\n.ya-share2 :link:hover,\n.ya-share2 :visited:hover {\n  color: #000 !important;\n}\n.ya-share2 input {\n  color: inherit;\n  font: inherit;\n  margin: 0;\n  line-height: normal;\n}\n.ya-share2__container_size_m {\n  font-size: 13px;\n}\n.ya-share2__container_size_m .ya-share2__icon {\n  height: 24px;\n  width: 24px;\n  background-size: 24px 24px;\n}\n.ya-share2__container_size_m .ya-share2__title {\n  line-height: 24px;\n}\n.ya-share2__container_size_m .ya-share2__item {\n  margin: 5px 4px 5px 0;\n}\n.ya-share2__container_size_m .ya-share2__item:last-child {\n  margin-right: 0;\n}\n.ya-share2__container_size_m .ya-share2__counter {\n  font-size: 12px;\n  line-height: 24px;\n  padding: 0 8px;\n}\n.ya-share2__container_size_m .ya-share2__counter:before {\n  margin-left: -8px;\n}\n.ya-share2__container_size_m .ya-share2__icon_more:before {\n  font-size: 12px;\n  line-height: 24px;\n}\n.ya-share2__container_size_m .ya-share2__popup {\n  padding: 5px 10px;\n}\n.ya-share2__container_size_m .ya-share2__popup_direction_bottom {\n  top: 28px;\n}\n.ya-share2__container_size_m .ya-share2__popup_direction_top {\n  bottom: 28px;\n}\n.ya-share2__container_size_m .ya-share2__input_copy {\n  width: 140px;\n}\n.ya-share2__container_size_m .ya-share2__badge + .ya-share2__title {\n  margin-left: 10px;\n}\n.ya-share2__container_size_s {\n  font-size: 12px;\n}\n.ya-share2__container_size_s .ya-share2__icon {\n  height: 18px;\n  width: 18px;\n  background-size: 18px 18px;\n}\n.ya-share2__container_size_s .ya-share2__title {\n  line-height: 18px;\n}\n.ya-share2__container_size_s .ya-share2__item {\n  margin: 3px 4px 3px 0;\n}\n.ya-share2__container_size_s .ya-share2__item:last-child {\n  margin-right: 0;\n}\n.ya-share2__container_size_s .ya-share2__counter {\n  font-size: 10px;\n  line-height: 18px;\n  padding: 0 6px;\n}\n.ya-share2__container_size_s .ya-share2__counter:before {\n  margin-left: -6px;\n}\n.ya-share2__container_size_s .ya-share2__icon_more:before {\n  font-size: 10px;\n  line-height: 18px;\n}\n.ya-share2__container_size_s .ya-share2__popup {\n  padding: 3px 6px;\n}\n.ya-share2__container_size_s .ya-share2__popup_direction_bottom {\n  top: 21px;\n}\n.ya-share2__container_size_s .ya-share2__popup_direction_top {\n  bottom: 21px;\n}\n.ya-share2__container_size_s .ya-share2__input_copy {\n  width: 110px;\n}\n.ya-share2__container_size_s .ya-share2__badge + .ya-share2__title {\n  margin-left: 6px;\n}\n.ya-share2__list_direction_horizontal > .ya-share2__item {\n  display: inline-block;\n  vertical-align: top;\n  margin-top: 0;\n  margin-bottom: 0;\n}\n.ya-share2__list_direction_horizontal > .ya-share2__item > .ya-share2__link > .ya-share2__title {\n  display: none;\n}\n.ya-share2__list_direction_vertical > .ya-share2__item {\n  display: block;\n  margin-right: 0;\n}\n.ya-share2__list_direction_vertical > .ya-share2__item > .ya-share2__link > .ya-share2__badge > .ya-share2__counter {\n  display: none;\n}\n.ya-share2__list {\n  display: inline-block;\n  vertical-align: top;\n  padding: 0;\n  margin: 0;\n  list-style-type: none;\n}\n.ya-share2__item {\n  font-family: Arial, sans;\n  display: inline-block;\n}\n.ya-share2__item:hover {\n  opacity: 0.9;\n}\n.ya-share2__link {\n  display: inline-block;\n  vertical-align: top;\n  text-decoration: none;\n  white-space: nowrap;\n}\n.ya-share2__badge {\n  display: inline-block;\n  vertical-align: top;\n  border-radius: 2px;\n  color: #fff;\n  overflow: hidden;\n  position: relative;\n}\n.ya-share2__icon {\n  display: inline-block;\n  vertical-align: top;\n}\n.ya-share2__icon:active {\n  box-shadow: inset 0 2px 0 0 rgba(0,0,0,0.1);\n}\n.ya-share2__counter {\n  display: none;\n}\n.ya-share2__counter:before {\n  content: "";\n  position: absolute;\n  width: 1px;\n  top: 2px;\n  bottom: 2px;\n  background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEX///+nxBvIAAAAAXRSTlMz/za5cAAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=") 0 0 repeat-y;\n}\n.ya-share2__counter_visible {\n  display: inline-block;\n}\n.ya-share2__title {\n  display: inline-block;\n  color: #000;\n  vertical-align: bottom;\n}\n.ya-share2__title:hover {\n  color: #f00;\n}\n.ya-share2__item_more {\n  position: relative;\n}\n.ya-share2__item_more:hover {\n  opacity: 1;\n}\n.ya-share2__icon_more {\n  background-color: #fff;\n  border: 1px solid #cdcdcd;\n  box-sizing: border-box;\n  position: relative;\n}\n.ya-share2__icon_more:before {\n  content: \'•••\';\n  color: #a0a0a0;\n  left: 0;\n  right: 0;\n  top: 0;\n  bottom: 0;\n  position: absolute;\n  text-align: center;\n}\n.ya-share2__popup {\n  position: absolute;\n  display: none;\n  border: 1px solid #e6e6e6;\n  z-index: 9999;\n  background-color: #fff;\n}\n.ya-share2__popup_direction_bottom {\n  box-shadow: 0 10px 20px -5px rgba(0,0,0,0.4);\n}\n.ya-share2__popup_direction_top {\n  box-shadow: 0 0 20px -5px rgba(0,0,0,0.4);\n}\n.ya-share2__popup_list-direction_horizontal {\n  right: 0;\n}\n.ya-share2__popup_list-direction_vertical {\n  left: 0;\n}\n.ya-share2__popup_visible {\n  display: block;\n}\n.ya-share2__popup_clipboard .ya-share2__input_copy,\n.ya-share2__link_copy {\n  display: none;\n}\n.ya-share2__popup_clipboard .ya-share2__link_copy {\n  display: inline-block;\n}\n';
  },
  function(e, t, n) {
    'use strict';
    function o(e, t) {
      if (!(e instanceof t))
        throw new TypeError('Cannot call a class as a function');
    }
    function i(e) {
      var t =
          arguments.length > 1 && void 0 !== arguments[1]
            ? arguments[1]
            : function() {},
        n = 'function' == typeof window.jQuery;
      try {
        (window['yaCounter' + e] = new window.Ya.Metrika({
          id: e,
          trackLinks: !0,
          accurateTrackBounce: !0,
          params: {
            jquery: n,
            version: n && window.jQuery().jquery,
            shareVersion: 2
          }
        })),
          t();
      } catch (e) {}
    }
    function r(e) {
      var t = 'yandex_metrika_callbacks';
      (window[t] = window[t] || []), window[t].push(e);
    }
    Object.defineProperty(t, '__esModule', { value: !0 });
    var s = (function() {
        function e(e, t) {
          for (var n = 0; n < t.length; n++) {
            var o = t[n];
            (o.enumerable = o.enumerable || !1),
              (o.configurable = !0),
              'value' in o && (o.writable = !0),
              Object.defineProperty(e, o.key, o);
          }
        }
        return function(t, n, o) {
          return n && e(t.prototype, n), o && e(t, o), t;
        };
      })(),
      a = n(0),
      l = (function() {
        function e(t) {
          o(this, e), (this._id = t);
        }
        return (
          s(e, [
            {
              key: 'init',
              value: function() {
                var e = this;
                if (window.Ya && 'Metrika' in window.Ya) i(this._id);
                else {
                  var t = (0, a.injectJs)('');
                  r(function() {
                    i(e._id, function() {
                      return t && t.parentNode.removeChild(t);
                    });
                  });
                }
              }
            },
            {
              key: 'getCounter',
              value: function() {
                return window['yaCounter' + this._id];
              }
            }
          ]),
          e
        );
      })();
    t.default = l;
  },
  function(e, t, n) {
    'use strict';
    function o(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function i(e) {
      return function(t) {
        var n =
          arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
        return (
          'string' == typeof t &&
            (t = u.default.toArray(document.querySelectorAll(t))),
          Array.isArray(t) || (t = [t]),
          !1 === n.reinit &&
            (t = t.filter(function(e) {
              return !m.default.getMod(e, 'inited');
            })),
          t.map(function(t) {
            var o = new l.default(t, (0, s.default)({ options: n }, e));
            return (
              o.isBare() ||
                v ||
                (_.injectCss((0, p.getCss)(e.plugins), { nonce: o.getNonce() }),
                (v = !0)),
              o
            );
          })
        );
      };
    }
    Object.defineProperty(t, '__esModule', { value: !0 }), (t.default = i);
    var r = n(11),
      s = o(r),
      a = n(71),
      l = o(a),
      c = n(2),
      u = o(c),
      p = n(15),
      d = n(0),
      h = o(d),
      f = n(17),
      m = o(f),
      _ = new h.default(window.document),
      v = !1;
  },
  function(e, t, n) {
    'use strict';
    function o(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function i(e, t) {
      if (!(e instanceof t))
        throw new TypeError('Cannot call a class as a function');
    }
    function r(e) {
      return Object.keys(e).reduce(function(t, n) {
        var o = e[n];
        return o.contentOptions && (t[n] = o.contentOptions), t;
      }, {});
    }
    Object.defineProperty(t, '__esModule', { value: !0 });
    var s =
        'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
          ? function(e) {
              return typeof e;
            }
          : function(e) {
              return e &&
                'function' == typeof Symbol &&
                e.constructor === Symbol &&
                e !== Symbol.prototype
                ? 'symbol'
                : typeof e;
            },
      a = (function() {
        function e(e, t) {
          for (var n = 0; n < t.length; n++) {
            var o = t[n];
            (o.enumerable = o.enumerable || !1),
              (o.configurable = !0),
              'value' in o && (o.writable = !0),
              Object.defineProperty(e, o.key, o);
          }
        }
        return function(t, n, o) {
          return n && e(t.prototype, n), o && e(t, o), t;
        };
      })(),
      l = n(72),
      c = o(l),
      u = n(1),
      p = n(74),
      d = o(p),
      h = n(78),
      f = (function(e) {
        if (e && e.__esModule) return e;
        var t = {};
        if (null != e)
          for (var n in e)
            Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
        return (t.default = e), t;
      })(h),
      m = n(17),
      _ = o(m),
      v = n(80),
      y = n(2),
      g = o(y),
      b = n(81),
      k = o(b),
      w = n(13),
      x = o(w),
      C = (function() {
        function e(t, n) {
          i(this, e);
          var o = n.plugins,
            s = n.defaults,
            a = n.options,
            l = n.frameUrl,
            c = n.metrika,
            u = r(o),
            p = 'ya-share2.' + Math.random(),
            d = new x.default(window, p);
          (this._params = n),
            (this._domNode = t),
            (this._messenger = d),
            (this._namespace = p),
            (this._plugins = o),
            (this._options = (0, k.default)(u, s, t.dataset, a));
          var h = this._options.get('theme.lang');
          (this._i18n = this._options.get('i18n.' + h)),
            this._initLayout(o, l, p),
            this._bindEvents(d, c),
            t.classList.add('ya-share2'),
            t.classList.add('ya-share2_inited'),
            (this._morePopup = _.default.findInside(this._domNode, {
              block: 'ya-share2',
              elem: 'popup'
            })[0]),
            'outer' === this._options.get('theme.popupPosition') &&
              this._moveMorePopupOutside(),
            this._options.get('hooks.onready').call(this);
        }
        return (
          a(e, [
            {
              key: '_isDestroyed',
              value: function() {
                return null === this._domNode;
              }
            },
            {
              key: '_moveMorePopupOutside',
              value: function() {
                var e = _.default.findInside(this._domNode, {
                  block: 'ya-share2',
                  elem: 'container'
                })[0];
                (this._morePopupContainer = document.createElement('div')),
                  (this._morePopupContainer.style.position = 'absolute'),
                  (this._morePopupContainer.style['pointer-events'] = 'none'),
                  (this._morePopup.style['pointer-events'] = 'all'),
                  (this._morePopupContainer.className = e.className),
                  this._morePopupContainer.appendChild(this._morePopup),
                  document.body.appendChild(this._morePopupContainer);
              }
            },
            {
              key: 'updateContent',
              value: function(e) {
                if (this._isDestroyed())
                  throw new Error('Could not operate on destroyed block.');
                this._options.merge({ content: e }),
                  this._initLayout(
                    this._params.plugins,
                    this._params.frameUrl,
                    this._namespace
                  );
              }
            },
            {
              key: 'updateContentByService',
              value: function(e) {
                if (this._isDestroyed())
                  throw new Error('Could not operate on destroyed block.');
                this._options.merge({ contentByService: e }),
                  this._initLayout(
                    this._params.plugins,
                    this._params.frameUrl,
                    this._namespace
                  );
              }
            },
            {
              key: 'destroy',
              value: function() {
                this._domNode.classList.remove('ya-share2_inited'),
                  (this._domNode.innerHTML = ''),
                  (this._domNode = null),
                  this._morePopupContainer &&
                    (g.default.remove(this._morePopupContainer),
                    (this._morePopupContainer = null)),
                  this._messenger.unsubscribe(this),
                  document.body.removeEventListener('click', this._onBodyClick),
                  document.body.removeEventListener('keydown', this._onKeydown);
              }
            },
            {
              key: '_getContentForService',
              value: function(e) {
                var t = this,
                  n = function(n) {
                    return t._options.get(n, e);
                  },
                  o = {
                    title: n('content.title'),
                    description: n('content.description'),
                    image: n('content.image'),
                    url: n('content.url')
                  },
                  i = this._plugins[e].contentOptions || {};
                return (
                  Object.keys(i).forEach(function(e) {
                    o[e] = n('content.' + e);
                  }),
                  o
                );
              }
            },
            {
              key: '_initLayout',
              value: function(e, t, n) {
                var o = this;
                (this._services = this._options
                  .get('theme.services')
                  .split(',')
                  .filter(function(t) {
                    return e[t];
                  })
                  .map(function(t) {
                    var n = function(e) {
                        return o._options.get(e, t);
                      },
                      i = e[t].config.shareUrl;
                    if ('object' === (void 0 === i ? 'undefined' : s(i))) {
                      i = i[n('content.template')] || i.default;
                    }
                    i += '&utm_source=share2';
                    var r = o._getContentForService(t);
                    return {
                      name: t,
                      title: e[t].i18n[n('theme.lang')],
                      location: (0, u.applyTemplate)(i, r),
                      hasCounter: Boolean(e[t].config.count),
                      popupDimensions: e[t].popupDimensions
                    };
                  })),
                  (0, c.default)(this._i18n).update(
                    this._domNode,
                    'container',
                    [
                      {
                        urls: {
                          content: this._options.get('content.url'),
                          frame: t
                        },
                        theme: this._options.get('theme'),
                        services: this._services,
                        namespace: n
                      }
                    ]
                  ),
                  (this._frame = this._domNode.getElementsByTagName(
                    'iframe'
                  )[0]);
              }
            },
            {
              key: 'getNonce',
              value: function() {
                return this._options.get('theme.nonce');
              }
            },
            {
              key: '_bindEvents',
              value: function(e, t) {
                var n = this;
                (this._onBodyClick = this._onBodyClick.bind(this, t)),
                  (this._onKeydown = this._onKeydown.bind(this)),
                  document.body.addEventListener('click', this._onBodyClick),
                  document.body.addEventListener('keydown', this._onKeydown),
                  e.subscribe(this, function(e) {
                    var t =
                      arguments.length > 1 && void 0 !== arguments[1]
                        ? arguments[1]
                        : {};
                    if ('init' === e)
                      n._messenger.publish(
                        'counter',
                        {
                          services: n._prepareServicesForFrame(),
                          url: n._options.get('content.url')
                        },
                        n._frame.contentWindow
                      );
                    else if ('counter' === e) {
                      var o = t.service,
                        i = t.count;
                      n.setCount(o, i);
                    }
                  });
              }
            },
            {
              key: '_prepareServicesForFrame',
              value: function() {
                var e = this;
                return this._services.reduce(function(t, n) {
                  var o = n.name,
                    i = e._getContentForService(o),
                    r = i.url;
                  return (t[o] = { url: (0, d.default)(r) }), t;
                }, {});
              }
            },
            {
              key: '_onKeydown',
              value: function(e) {
                switch (e.which || e.keyCode) {
                  case 27:
                    this._closePopup();
                }
              }
            },
            {
              key: '_onBodyClick',
              value: function(e, t) {
                var n = g.default.getTarget(t),
                  o = _.default.findOutside(n, {
                    block: 'ya-share2',
                    elem: 'container'
                  }),
                  i = _.default.findInside(this._domNode, {
                    block: 'ya-share2',
                    elem: 'container'
                  })[0];
                if (!o || (o !== i && o !== this._morePopupContainer))
                  return void this._closePopup();
                var r = _.default.findOutside(n, {
                  block: 'ya-share2',
                  elem: 'item'
                });
                return r
                  ? _.default.getMod(r, 'more')
                    ? void this._onMoreClick(t)
                    : _.default.getMod(r, 'copy')
                      ? void this._onCopyClick(t)
                      : void this._onServiceClick(t, r, e)
                  : void 0;
              }
            },
            {
              key: '_onCopyClick',
              value: function(e) {
                var t = this;
                this._morePopup.classList.contains(
                  'ya-share2__popup_clipboard'
                ) &&
                  (this._closePopup(),
                  (0, v.clip)(this._options.get('content.url'), function(e) {
                    prompt(t._i18n.pressToCopy, e);
                  })),
                  e.preventDefault(),
                  e.stopPropagation();
              }
            },
            {
              key: '_onMoreClick',
              value: function(e) {
                if (
                  ((0, v.copy)()
                    ? this._morePopup.classList.add(
                        'ya-share2__popup_clipboard'
                      )
                    : this._morePopup.classList.remove(
                        'ya-share2__popup_clipboard'
                      ),
                  this._morePopupContainer)
                ) {
                  var t = _.default.findInside(this._domNode, {
                      block: 'ya-share2',
                      elem: 'item',
                      modName: 'more'
                    })[0],
                    n = g.default.getRectRelativeToDocument(t),
                    o = n.top,
                    i = n.left,
                    r = n.width,
                    s = n.height;
                  (this._morePopupContainer.style.top = o + 'px'),
                    (this._morePopupContainer.style.left = i + 'px'),
                    (this._morePopupContainer.style.width = r + 'px'),
                    (this._morePopupContainer.style.height = s + 'px');
                }
                this._morePopup.classList.toggle('ya-share2__popup_visible'),
                  e.preventDefault(),
                  e.stopPropagation();
              }
            },
            {
              key: '_onServiceClick',
              value: function(e, t, n) {
                this._closePopup();
                var o = _.default.getMod(t, 'service');
                if (o) {
                  var i = this._services.filter(function(e) {
                    return e.name === o;
                  })[0];
                  if (
                    i &&
                    (this._options.get('hooks.onshare').call(this, i.name),
                    !this._isDestroyed())
                  ) {
                    if ((this.setCount(i.name), i.popupDimensions)) {
                      var r = _.default.findInside(t, {
                        block: 'ya-share2',
                        elem: 'link'
                      })[0];
                      e.preventDefault(),
                        e.stopPropagation(),
                        f.open('ya-share2', r.href, i.popupDimensions);
                    }
                    var s = _.default.findInside(this._domNode, {
                        block: 'ya-share2',
                        elem: 'item'
                      }),
                      a = [].indexOf.call(s, t);
                    n.getCounter().reachGoal('BUTTON_CLICK', {
                      serviceName: o,
                      buttonIndex: a
                    });
                  }
                }
              }
            },
            {
              key: 'setCount',
              value: function(e, t) {
                if (this._options.get('theme.counter')) {
                  var n = _.default.findInside(this._domNode, {
                    block: 'ya-share2',
                    elem: 'item',
                    modName: 'service',
                    modVal: e
                  })[0];
                  if (!n) return;
                  var o = _.default.findInside(n, {
                    block: 'ya-share2',
                    elem: 'counter'
                  })[0];
                  if (!o) return;
                  if (void 0 === t) {
                    var i = parseInt(o.textContent || 0, 10);
                    isNaN(i) && (i = 0), (t = i + 1);
                  }
                  (o.textContent = t),
                    t > 0
                      ? o.classList.add('ya-share2__counter_visible')
                      : o.classList.remove('ya-share2__counter_visible');
                }
              }
            },
            {
              key: 'isBare',
              value: function() {
                return Boolean(this._options.get('theme.bare'));
              }
            },
            {
              key: '_closePopup',
              value: function() {
                this._morePopup &&
                  this._morePopup.classList.remove('ya-share2__popup_visible');
              }
            }
          ]),
          e
        );
      })();
    t.default = C;
  },
  function(e, t, n) {
    'use strict';
    function o(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function i(e) {
      if (Array.isArray(e)) {
        for (var t = 0, n = Array(e.length); t < e.length; t++) n[t] = e[t];
        return n;
      }
      return Array.from(e);
    }
    function r(e) {
      function t(e) {
        for (
          var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), i = 1;
          i < t;
          i++
        )
          n[i - 1] = arguments[i];
        return (0, a.default)(
          { block: 'ya-share2', elem: e },
          o[e].apply(o, n)
        );
      }
      var n = new c.default(),
        o = {
          container: function(e) {
            var n = e.urls,
              o = e.theme,
              r = e.services,
              s = e.namespace;
            return {
              mods: { size: o.size },
              content: [
                t(
                  'list',
                  o.direction,
                  r,
                  o.limit,
                  n.content,
                  o.copy,
                  o.popupDirection
                )
              ].concat(
                i(
                  [
                    o.nonce && t('iframe-style', o.nonce),
                    t('iframe', n.frame, s, { inlineStyle: !o.nonce })
                  ].filter(function() {
                    return o.counter;
                  })
                )
              )
            };
          },
          list: function(e, n) {
            var o =
                arguments.length > 2 && void 0 !== arguments[2]
                  ? arguments[2]
                  : n.length,
              i =
                arguments.length > 3 && void 0 !== arguments[3]
                  ? arguments[3]
                  : '',
              r = arguments[4],
              s = arguments[5];
            !1 === o && (o = n.length);
            var a = n.slice(0, o),
              l = n.slice(o);
            return {
              tag: 'ul',
              mods: { direction: e },
              content: [
                a.map(function(e) {
                  return t('item', e);
                }),
                l.length > 0 && t('item_more', l, i, r, s, e)
              ]
            };
          },
          item: function() {
            var e =
              arguments.length > 0 && void 0 !== arguments[0]
                ? arguments[0]
                : {};
            return {
              tag: 'li',
              mods: { service: e.name },
              content: t('link', e)
            };
          },
          link: function() {
            var e =
                arguments.length > 0 && void 0 !== arguments[0]
                  ? arguments[0]
                  : {},
              n = e.location,
              o = e.title,
              i = e.hasCounter;
            return {
              tag: 'a',
              attrs: {
                href: n || '#',
                rel: n && 'nofollow',
                target: n && '_blank',
                title: o
              },
              content: [t('badge', i), t('title', o)]
            };
          },
          badge: function(e) {
            return { tag: 'span', content: [t('icon'), e && t('counter')] };
          },
          icon: function() {
            return { tag: 'span' };
          },
          counter: function() {
            return { tag: 'span' };
          },
          title: function(e) {
            return { tag: 'span', content: e };
          },
          item_more: function(e, n, o, i, r) {
            return (0, a.default)(t('item'), {
              mods: { more: !0 },
              content: [t('link_more'), t('popup', e, n, o, i, r)]
            });
          },
          link_more: function() {
            return (0, a.default)(t('link'), {
              mods: { more: !0 },
              content: t('badge_more')
            });
          },
          badge_more: function() {
            return (0, a.default)(t('badge'), {
              mods: { more: !0 },
              content: t('icon_more')
            });
          },
          icon_more: function() {
            return (0, a.default)(t('icon'), { mods: { more: !0 } });
          },
          item_copy: function(e) {
            return (0, a.default)(t('item'), {
              mods: { copy: !0 },
              content: [t('link_copy'), t('input_copy', e)]
            });
          },
          link_copy: function() {
            return (0, a.default)(t('link'), {
              mods: { copy: !0 },
              content: t('title', e.copyLink)
            });
          },
          input_copy: function(e) {
            return { tag: 'input', attrs: { value: e } };
          },
          popup: function(e, n) {
            var o =
                arguments.length > 2 && void 0 !== arguments[2]
                  ? arguments[2]
                  : 'last',
              i = arguments[3],
              r = arguments[4],
              s = t('list', 'vertical', e);
            return (
              'first' === o
                ? s.content.unshift(t('item_copy', n))
                : 'last' === o && s.content.push(t('item_copy', n)),
              (i = 'top' === i ? 'top' : 'bottom'),
              (r = 'vertical' === r ? 'vertical' : 'horizontal'),
              { mods: { direction: i, 'list-direction': r }, content: s }
            );
          },
          iframe: function(e, t) {
            var n =
                arguments.length > 2 && void 0 !== arguments[2]
                  ? arguments[2]
                  : {},
              o = n.inlineStyle;
            return {
              tag: 'iframe',
              attrs: {
                src: e + '?' + p.serializeParams({ namespace: t }),
                style: o
                  ? 'border: 0; display: none; position: absolute; left: -9999px;'
                  : null
              }
            };
          },
          'iframe-style': function(e) {
            return {
              tag: 'style',
              attrs: { nonce: e, scoped: !0 },
              content:
                '.ya-share2__iframe { border: 0; display: none; position: absolute; left: -9999px; }'
            };
          }
        };
      return {
        update: function(e, o) {
          var r =
            arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : [];
          e.innerHTML = n.toHtml(t.apply(void 0, [o].concat(i(r))));
        }
      };
    }
    Object.defineProperty(t, '__esModule', { value: !0 }), (t.default = r);
    var s = n(11),
      a = o(s),
      l = n(73),
      c = o(l),
      u = n(1),
      p = (function(e) {
        if (e && e.__esModule) return e;
        var t = {};
        if (null != e)
          for (var n in e)
            Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
        return (t.default = e), t;
      })(u);
  },
  function(e, t, n) {
    'use strict';
    var o =
        'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
          ? function(e) {
              return typeof e;
            }
          : function(e) {
              return e &&
                'function' == typeof Symbol &&
                e.constructor === Symbol &&
                e !== Symbol.prototype
                ? 'symbol'
                : typeof e;
            },
      i = (function() {
        function e() {
          this._shortTags = {};
          for (var e = 0; e < t.length; e++) this._shortTags[t[e]] = 1;
          (this._optJsAttrName = 'onclick'),
            (this._optJsAttrIsJs = !0),
            (this._optJsCls = 'i-bem'),
            (this._optJsElem = !0),
            (this._optEscapeContent = !0),
            (this._optNobaseMods = !1),
            (this._optDelimElem = '__'),
            (this._optDelimMod = '_');
        }
        e.prototype = {
          toHtml: function(e) {
            (this._buf = ''), this._html(e);
            var t = this._buf;
            return delete this._buf, t;
          },
          _html: function(e) {
            var t, a, l;
            if (!1 !== e && null != e)
              if ('object' !== (void 0 === e ? 'undefined' : o(e)))
                this._buf += this._optEscapeContent ? n(e) : e;
              else if (Array.isArray(e))
                for (t = 0, a = e.length; t < a; t++)
                  !1 !== (l = e[t]) && null != l && this._html(l);
              else {
                if (e.toHtml) {
                  var c = e.toHtml.call(this, e) || '';
                  return void (this._buf += c);
                }
                var u = !1 !== e.bem;
                if (void 0 !== e.tag && !e.tag)
                  return void (e.html
                    ? (this._buf += e.html)
                    : this._html(e.content));
                e.mix && !Array.isArray(e.mix) && (e.mix = [e.mix]);
                var p,
                  d,
                  h,
                  f = '',
                  m = '',
                  _ = !1;
                if ((p = e.attrs))
                  for (t in p)
                    (d = p[t]),
                      !0 === d
                        ? (m += ' ' + t)
                        : !1 !== d &&
                          null !== d &&
                          void 0 !== d &&
                          (m += ' ' + t + '="' + i(d) + '"');
                if (u) {
                  var v = e.block + (e.elem ? this._optDelimElem + e.elem : '');
                  e.block &&
                    ((f = s(
                      e,
                      v,
                      null,
                      this._optNobaseMods,
                      this._optDelimMod
                    )),
                    e.js && ((h = {})[v] = !0 === e.js ? {} : e.js));
                  var y = this._optJsCls && (this._optJsElem || !e.elem),
                    g = e.mix;
                  if (g && g.length)
                    for (t = 0, a = g.length; t < a; t++) {
                      var b = g[t];
                      if (b && !1 !== b.bem) {
                        var k = b.block || e.block || '',
                          w = b.elem || (b.block ? null : e.block && e.elem),
                          x = k + (w ? this._optDelimElem + w : '');
                        k &&
                          ((f += s(
                            b,
                            x,
                            v,
                            this._optNobaseMods,
                            this._optDelimMod
                          )),
                          b.js &&
                            (((h = h || {})[x] = !0 === b.js ? {} : b.js),
                            (_ = !0),
                            y ||
                              (y =
                                k &&
                                this._optJsCls &&
                                (this._optJsElem || !w))));
                      }
                    }
                  if (h) {
                    y && (f += ' ' + this._optJsCls);
                    var C =
                      _ || !0 !== e.js
                        ? r(JSON.stringify(h))
                        : '{"' + v + '":{}}';
                    m +=
                      ' ' +
                      (e.jsAttr || this._optJsAttrName) +
                      "='" +
                      (this._optJsAttrIsJs ? 'return ' + C : C) +
                      "'";
                  }
                }
                e.cls && (f = (f ? f + ' ' : '') + i(e.cls).trim());
                var j = e.tag || 'div';
                (this._buf +=
                  '<' + j + (f ? ' class="' + f + '"' : '') + (m || '')),
                  this._shortTags[j]
                    ? (this._buf += '/>')
                    : ((this._buf += '>'),
                      e.html ? (this._buf += e.html) : this._html(e.content),
                      (this._buf += '</' + j + '>'));
              }
          }
        };
        var t = 'area base br col command embed hr img input keygen link menuitem meta param source track wbr'.split(
            ' '
          ),
          n = (e.prototype.xmlEscape = function(e) {
            return (e + '')
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
          }),
          i = (e.prototype.attrEscape = function(e) {
            return (e + '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
          }),
          r = (e.prototype.jsAttrEscape = function(e) {
            return (e + '').replace(/&/g, '&amp;').replace(/'/g, '&#39;');
          }),
          s = function(e, t, n, o, i) {
            var r,
              s,
              a,
              l = '';
            if (
              (n !== t && (n && (l += ' '), (l += t)),
              (r = (e.elem && e.elemMods) || e.mods))
            )
              for (a in r)
                ((s = r[a]) || 0 === s) &&
                  (l += ' ' + (o ? i : t + i) + a + (!0 === s ? '' : i + s));
            return l;
          };
        return e;
      })();
    e.exports = i;
  },
  function(e, t, n) {
    'use strict';
    (function(e) {
      function o(t) {
        var n = new e(t),
          o = n.host;
        return n.href.replace(o, (0, i.toASCII)(o));
      }
      Object.defineProperty(t, '__esModule', { value: !0 }), (t.default = o);
      var i = n(76);
    }.call(t, n(75)));
  },
  function(e, t, n) {
    (function(t) {
      (function() {
        'use strict';
        !(function(e) {
          function t(e) {
            return void 0 !== p[e];
          }
          function n() {
            a.call(this), (this._isInvalid = !0);
          }
          function o(e) {
            return '' == e && n.call(this), e.toLowerCase();
          }
          function i(e) {
            var t = e.charCodeAt(0);
            return t > 32 &&
              t < 127 &&
              -1 == [34, 35, 60, 62, 63, 96].indexOf(t)
              ? e
              : encodeURIComponent(e);
          }
          function r(e) {
            var t = e.charCodeAt(0);
            return t > 32 && t < 127 && -1 == [34, 35, 60, 62, 96].indexOf(t)
              ? e
              : encodeURIComponent(e);
          }
          function s(e, s, a) {
            function l(e) {
              g.push(e);
            }
            var c = s || 'scheme start',
              u = 0,
              _ = '',
              v = !1,
              y = !1,
              g = [];
            e: for (; (e[u - 1] != h || 0 == u) && !this._isInvalid; ) {
              var b = e[u];
              switch (c) {
                case 'scheme start':
                  if (!b || !f.test(b)) {
                    if (s) {
                      l('Invalid scheme.');
                      break e;
                    }
                    (_ = ''), (c = 'no scheme');
                    continue;
                  }
                  (_ += b.toLowerCase()), (c = 'scheme');
                  break;
                case 'scheme':
                  if (b && m.test(b)) _ += b.toLowerCase();
                  else {
                    if (':' != b) {
                      if (s) {
                        if (h == b) break e;
                        l('Code point not allowed in scheme: ' + b);
                        break e;
                      }
                      (_ = ''), (u = 0), (c = 'no scheme');
                      continue;
                    }
                    if (((this._scheme = _), (_ = ''), s)) break e;
                    t(this._scheme) && (this._isRelative = !0),
                      (c =
                        'file' == this._scheme
                          ? 'relative'
                          : this._isRelative && a && a._scheme == this._scheme
                            ? 'relative or authority'
                            : this._isRelative
                              ? 'authority first slash'
                              : 'scheme data');
                  }
                  break;
                case 'scheme data':
                  '?' == b
                    ? ((this._query = '?'), (c = 'query'))
                    : '#' == b
                      ? ((this._fragment = '#'), (c = 'fragment'))
                      : h != b &&
                        '\t' != b &&
                        '\n' != b &&
                        '\r' != b &&
                        (this._schemeData += i(b));
                  break;
                case 'no scheme':
                  if (a && t(a._scheme)) {
                    c = 'relative';
                    continue;
                  }
                  l('Missing scheme.'), n.call(this);
                  break;
                case 'relative or authority':
                  if ('/' != b || '/' != e[u + 1]) {
                    l('Expected /, got: ' + b), (c = 'relative');
                    continue;
                  }
                  c = 'authority ignore slashes';
                  break;
                case 'relative':
                  if (
                    ((this._isRelative = !0),
                    'file' != this._scheme && (this._scheme = a._scheme),
                    h == b)
                  ) {
                    (this._host = a._host),
                      (this._port = a._port),
                      (this._path = a._path.slice()),
                      (this._query = a._query),
                      (this._username = a._username),
                      (this._password = a._password);
                    break e;
                  }
                  if ('/' == b || '\\' == b)
                    '\\' == b && l('\\ is an invalid code point.'),
                      (c = 'relative slash');
                  else if ('?' == b)
                    (this._host = a._host),
                      (this._port = a._port),
                      (this._path = a._path.slice()),
                      (this._query = '?'),
                      (this._username = a._username),
                      (this._password = a._password),
                      (c = 'query');
                  else {
                    if ('#' != b) {
                      var k = e[u + 1],
                        w = e[u + 2];
                      ('file' != this._scheme ||
                        !f.test(b) ||
                        (':' != k && '|' != k) ||
                        (h != w &&
                          '/' != w &&
                          '\\' != w &&
                          '?' != w &&
                          '#' != w)) &&
                        ((this._host = a._host),
                        (this._port = a._port),
                        (this._username = a._username),
                        (this._password = a._password),
                        (this._path = a._path.slice()),
                        this._path.pop()),
                        (c = 'relative path');
                      continue;
                    }
                    (this._host = a._host),
                      (this._port = a._port),
                      (this._path = a._path.slice()),
                      (this._query = a._query),
                      (this._fragment = '#'),
                      (this._username = a._username),
                      (this._password = a._password),
                      (c = 'fragment');
                  }
                  break;
                case 'relative slash':
                  if ('/' != b && '\\' != b) {
                    'file' != this._scheme &&
                      ((this._host = a._host),
                      (this._port = a._port),
                      (this._username = a._username),
                      (this._password = a._password)),
                      (c = 'relative path');
                    continue;
                  }
                  '\\' == b && l('\\ is an invalid code point.'),
                    (c =
                      'file' == this._scheme
                        ? 'file host'
                        : 'authority ignore slashes');
                  break;
                case 'authority first slash':
                  if ('/' != b) {
                    l("Expected '/', got: " + b),
                      (c = 'authority ignore slashes');
                    continue;
                  }
                  c = 'authority second slash';
                  break;
                case 'authority second slash':
                  if (((c = 'authority ignore slashes'), '/' != b)) {
                    l("Expected '/', got: " + b);
                    continue;
                  }
                  break;
                case 'authority ignore slashes':
                  if ('/' != b && '\\' != b) {
                    c = 'authority';
                    continue;
                  }
                  l('Expected authority, got: ' + b);
                  break;
                case 'authority':
                  if ('@' == b) {
                    v && (l('@ already seen.'), (_ += '%40')), (v = !0);
                    for (var x = 0; x < _.length; x++) {
                      var C = _[x];
                      if ('\t' != C && '\n' != C && '\r' != C)
                        if (':' != C || null !== this._password) {
                          var j = i(C);
                          null !== this._password
                            ? (this._password += j)
                            : (this._username += j);
                        } else this._password = '';
                      else l('Invalid whitespace in authority.');
                    }
                    _ = '';
                  } else {
                    if (
                      h == b ||
                      '/' == b ||
                      '\\' == b ||
                      '?' == b ||
                      '#' == b
                    ) {
                      (u -= _.length), (_ = ''), (c = 'host');
                      continue;
                    }
                    _ += b;
                  }
                  break;
                case 'file host':
                  if (h == b || '/' == b || '\\' == b || '?' == b || '#' == b) {
                    2 != _.length ||
                    !f.test(_[0]) ||
                    (':' != _[1] && '|' != _[1])
                      ? 0 == _.length
                        ? (c = 'relative path start')
                        : ((this._host = o.call(this, _)),
                          (_ = ''),
                          (c = 'relative path start'))
                      : (c = 'relative path');
                    continue;
                  }
                  '\t' == b || '\n' == b || '\r' == b
                    ? l('Invalid whitespace in file host.')
                    : (_ += b);
                  break;
                case 'host':
                case 'hostname':
                  if (':' != b || y) {
                    if (
                      h == b ||
                      '/' == b ||
                      '\\' == b ||
                      '?' == b ||
                      '#' == b
                    ) {
                      if (
                        ((this._host = o.call(this, _)),
                        (_ = ''),
                        (c = 'relative path start'),
                        s)
                      )
                        break e;
                      continue;
                    }
                    '\t' != b && '\n' != b && '\r' != b
                      ? ('[' == b ? (y = !0) : ']' == b && (y = !1), (_ += b))
                      : l('Invalid code point in host/hostname: ' + b);
                  } else if (
                    ((this._host = o.call(this, _)),
                    (_ = ''),
                    (c = 'port'),
                    'hostname' == s)
                  )
                    break e;
                  break;
                case 'port':
                  if (/[0-9]/.test(b)) _ += b;
                  else {
                    if (
                      h == b ||
                      '/' == b ||
                      '\\' == b ||
                      '?' == b ||
                      '#' == b ||
                      s
                    ) {
                      if ('' != _) {
                        var E = parseInt(_, 10);
                        E != p[this._scheme] && (this._port = E + ''), (_ = '');
                      }
                      if (s) break e;
                      c = 'relative path start';
                      continue;
                    }
                    '\t' == b || '\n' == b || '\r' == b
                      ? l('Invalid code point in port: ' + b)
                      : n.call(this);
                  }
                  break;
                case 'relative path start':
                  if (
                    ('\\' == b && l("'\\' not allowed in path."),
                    (c = 'relative path'),
                    '/' != b && '\\' != b)
                  )
                    continue;
                  break;
                case 'relative path':
                  if (
                    h != b &&
                    '/' != b &&
                    '\\' != b &&
                    (s || ('?' != b && '#' != b))
                  )
                    '\t' != b && '\n' != b && '\r' != b && (_ += i(b));
                  else {
                    '\\' == b && l('\\ not allowed in relative path.');
                    var z;
                    (z = d[_.toLowerCase()]) && (_ = z),
                      '..' == _
                        ? (this._path.pop(),
                          '/' != b && '\\' != b && this._path.push(''))
                        : '.' == _ && '/' != b && '\\' != b
                          ? this._path.push('')
                          : '.' != _ &&
                            ('file' == this._scheme &&
                              0 == this._path.length &&
                              2 == _.length &&
                              f.test(_[0]) &&
                              '|' == _[1] &&
                              (_ = _[0] + ':'),
                            this._path.push(_)),
                      (_ = ''),
                      '?' == b
                        ? ((this._query = '?'), (c = 'query'))
                        : '#' == b &&
                          ((this._fragment = '#'), (c = 'fragment'));
                  }
                  break;
                case 'query':
                  s || '#' != b
                    ? h != b &&
                      '\t' != b &&
                      '\n' != b &&
                      '\r' != b &&
                      (this._query += r(b))
                    : ((this._fragment = '#'), (c = 'fragment'));
                  break;
                case 'fragment':
                  h != b &&
                    '\t' != b &&
                    '\n' != b &&
                    '\r' != b &&
                    (this._fragment += b);
              }
              u++;
            }
          }
          function a() {
            (this._scheme = ''),
              (this._schemeData = ''),
              (this._username = ''),
              (this._password = null),
              (this._host = ''),
              (this._port = ''),
              (this._path = []),
              (this._query = ''),
              (this._fragment = ''),
              (this._isInvalid = !1),
              (this._isRelative = !1);
          }
          function l(e, t) {
            void 0 === t || t instanceof l || (t = new l(String(t))),
              (this._url = e),
              a.call(this);
            var n = e.replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/g, '');
            s.call(this, n, null, t);
          }
          var c = !1;
          if (!e.forceJURL)
            try {
              var u = new e.URL('b', 'http://a');
              (u.pathname = 'c%20d'), (c = 'http://a/c%20d' === u.href);
            } catch (e) {}
          if (!c) {
            var p = Object.create(null);
            (p.ftp = 21),
              (p.file = 0),
              (p.gopher = 70),
              (p.http = 80),
              (p.https = 443),
              (p.ws = 80),
              (p.wss = 443);
            var d = Object.create(null);
            (d['%2e'] = '.'),
              (d['.%2e'] = '..'),
              (d['%2e.'] = '..'),
              (d['%2e%2e'] = '..');
            var h = void 0,
              f = /[a-zA-Z]/,
              m = /[a-zA-Z0-9\+\-\.]/;
            l.prototype = {
              toString: function() {
                return this.href;
              },
              get href() {
                if (this._isInvalid) return this._url;
                var e = '';
                return (
                  ('' == this._username && null == this._password) ||
                    (e =
                      this._username +
                      (null != this._password ? ':' + this._password : '') +
                      '@'),
                  this.protocol +
                    (this._isRelative ? '//' + e + this.host : '') +
                    this.pathname +
                    this._query +
                    this._fragment
                );
              },
              set href(e) {
                a.call(this), s.call(this, e);
              },
              get protocol() {
                return this._scheme + ':';
              },
              set protocol(e) {
                this._isInvalid || s.call(this, e + ':', 'scheme start');
              },
              get host() {
                return this._isInvalid
                  ? ''
                  : this._port
                    ? this._host + ':' + this._port
                    : this._host;
              },
              set host(e) {
                !this._isInvalid && this._isRelative && s.call(this, e, 'host');
              },
              get hostname() {
                return this._host;
              },
              set hostname(e) {
                !this._isInvalid &&
                  this._isRelative &&
                  s.call(this, e, 'hostname');
              },
              get port() {
                return this._port;
              },
              set port(e) {
                !this._isInvalid && this._isRelative && s.call(this, e, 'port');
              },
              get pathname() {
                return this._isInvalid
                  ? ''
                  : this._isRelative
                    ? '/' + this._path.join('/')
                    : this._schemeData;
              },
              set pathname(e) {
                !this._isInvalid &&
                  this._isRelative &&
                  ((this._path = []), s.call(this, e, 'relative path start'));
              },
              get search() {
                return this._isInvalid || !this._query || '?' == this._query
                  ? ''
                  : this._query;
              },
              set search(e) {
                !this._isInvalid &&
                  this._isRelative &&
                  ((this._query = '?'),
                  '?' == e[0] && (e = e.slice(1)),
                  s.call(this, e, 'query'));
              },
              get hash() {
                return this._isInvalid ||
                  !this._fragment ||
                  '#' == this._fragment
                  ? ''
                  : this._fragment;
              },
              set hash(e) {
                this._isInvalid ||
                  ((this._fragment = '#'),
                  '#' == e[0] && (e = e.slice(1)),
                  s.call(this, e, 'fragment'));
              },
              get origin() {
                var e;
                if (this._isInvalid || !this._scheme) return '';
                switch (this._scheme) {
                  case 'data':
                  case 'file':
                  case 'javascript':
                  case 'mailto':
                    return 'null';
                }
                return (e = this.host), e ? this._scheme + '://' + e : '';
              }
            };
            var _ = e.URL;
            _ &&
              ((l.createObjectURL = function(e) {
                return _.createObjectURL.apply(_, arguments);
              }),
              (l.revokeObjectURL = function(e) {
                _.revokeObjectURL(e);
              })),
              (e.URL = l),
              (l.foo = 'bar');
          }
        })(window),
          (e.exports = t.URL);
      }.call(window));
    }.call(t, n(12)));
  },
  function(e, t, n) {
    'use strict';
    (function(e, o) {
      var i,
        r =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function(e) {
                return typeof e;
              }
            : function(e) {
                return e &&
                  'function' == typeof Symbol &&
                  e.constructor === Symbol &&
                  e !== Symbol.prototype
                  ? 'symbol'
                  : typeof e;
              };
      !(function(s) {
        function a(e) {
          throw new RangeError(T[e]);
        }
        function l(e, t) {
          for (var n = e.length, o = []; n--; ) o[n] = t(e[n]);
          return o;
        }
        function c(e, t) {
          var n = e.split('@'),
            o = '';
          return (
            n.length > 1 && ((o = n[0] + '@'), (e = n[1])),
            (e = e.replace(D, '.')),
            o + l(e.split('.'), t).join('.')
          );
        }
        function u(e) {
          for (var t, n, o = [], i = 0, r = e.length; i < r; )
            (t = e.charCodeAt(i++)),
              t >= 55296 && t <= 56319 && i < r
                ? ((n = e.charCodeAt(i++)),
                  56320 == (64512 & n)
                    ? o.push(((1023 & t) << 10) + (1023 & n) + 65536)
                    : (o.push(t), i--))
                : o.push(t);
          return o;
        }
        function p(e) {
          return l(e, function(e) {
            var t = '';
            return (
              e > 65535 &&
                ((e -= 65536),
                (t += U(((e >>> 10) & 1023) | 55296)),
                (e = 56320 | (1023 & e))),
              (t += U(e))
            );
          }).join('');
        }
        function d(e) {
          return e - 48 < 10
            ? e - 22
            : e - 65 < 26
              ? e - 65
              : e - 97 < 26
                ? e - 97
                : j;
        }
        function h(e, t) {
          return e + 22 + 75 * (e < 26) - ((0 != t) << 5);
        }
        function f(e, t, n) {
          var o = 0;
          for (
            e = n ? I(e / M) : e >> 1, e += I(e / t);
            e > (B * z) >> 1;
            o += j
          )
            e = I(e / B);
          return I(o + ((B + 1) * e) / (e + O));
        }
        function m(e) {
          var t,
            n,
            o,
            i,
            r,
            s,
            l,
            c,
            u,
            h,
            m = [],
            _ = e.length,
            v = 0,
            y = S,
            g = P;
          for (n = e.lastIndexOf(A), n < 0 && (n = 0), o = 0; o < n; ++o)
            e.charCodeAt(o) >= 128 && a('not-basic'), m.push(e.charCodeAt(o));
          for (i = n > 0 ? n + 1 : 0; i < _; ) {
            for (
              r = v, s = 1, l = j;
              i >= _ && a('invalid-input'),
                (c = d(e.charCodeAt(i++))),
                (c >= j || c > I((C - v) / s)) && a('overflow'),
                (v += c * s),
                (u = l <= g ? E : l >= g + z ? z : l - g),
                !(c < u);
              l += j
            )
              (h = j - u), s > I(C / h) && a('overflow'), (s *= h);
            (t = m.length + 1),
              (g = f(v - r, t, 0 == r)),
              I(v / t) > C - y && a('overflow'),
              (y += I(v / t)),
              (v %= t),
              m.splice(v++, 0, y);
          }
          return p(m);
        }
        function _(e) {
          var t,
            n,
            o,
            i,
            r,
            s,
            l,
            c,
            p,
            d,
            m,
            _,
            v,
            y,
            g,
            b = [];
          for (e = u(e), _ = e.length, t = S, n = 0, r = P, s = 0; s < _; ++s)
            (m = e[s]) < 128 && b.push(U(m));
          for (o = i = b.length, i && b.push(A); o < _; ) {
            for (l = C, s = 0; s < _; ++s) (m = e[s]) >= t && m < l && (l = m);
            for (
              v = o + 1,
                l - t > I((C - n) / v) && a('overflow'),
                n += (l - t) * v,
                t = l,
                s = 0;
              s < _;
              ++s
            )
              if (((m = e[s]), m < t && ++n > C && a('overflow'), m == t)) {
                for (
                  c = n, p = j;
                  (d = p <= r ? E : p >= r + z ? z : p - r), !(c < d);
                  p += j
                )
                  (g = c - d),
                    (y = j - d),
                    b.push(U(h(d + (g % y), 0))),
                    (c = I(g / y));
                b.push(U(h(c, 0))), (r = f(n, v, o == i)), (n = 0), ++o;
              }
            ++n, ++t;
          }
          return b.join('');
        }
        function v(e) {
          return c(e, function(e) {
            return L.test(e) ? m(e.slice(4).toLowerCase()) : e;
          });
        }
        function y(e) {
          return c(e, function(e) {
            return F.test(e) ? 'xn--' + _(e) : e;
          });
        }
        var g = 'object' == r(t) && t && !t.nodeType && t,
          b = 'object' == r(e) && e && !e.nodeType && e,
          k = 'object' == (void 0 === o ? 'undefined' : r(o)) && o;
        (k.global !== k && k.window !== k && k.self !== k) || (s = k);
        var w,
          x,
          C = 2147483647,
          j = 36,
          E = 1,
          z = 26,
          O = 38,
          M = 700,
          P = 72,
          S = 128,
          A = '-',
          L = /^xn--/,
          F = /[^\x20-\x7E]/,
          D = /[\x2E\u3002\uFF0E\uFF61]/g,
          T = {
            overflow: 'Overflow: input needs wider integers to process',
            'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
            'invalid-input': 'Invalid input'
          },
          B = j - E,
          I = Math.floor,
          U = String.fromCharCode;
        if (
          ((w = {
            version: '1.4.1',
            ucs2: { decode: u, encode: p },
            decode: m,
            encode: _,
            toASCII: y,
            toUnicode: v
          }),
          'object' == r(n(16)) && n(16))
        )
          void 0 !==
            (i = function() {
              return w;
            }.call(t, n, t, e)) && (e.exports = i);
        else if (g && b)
          if (e.exports == g) b.exports = w;
          else for (x in w) w.hasOwnProperty(x) && (g[x] = w[x]);
        else s.punycode = w;
      })(void 0);
    }.call(t, n(77)(e), n(12)));
  },
  function(e, t, n) {
    'use strict';
    e.exports = function(e) {
      return (
        e.webpackPolyfill ||
          ((e.deprecate = function() {}),
          (e.paths = []),
          e.children || (e.children = []),
          Object.defineProperty(e, 'loaded', {
            enumerable: !0,
            get: function() {
              return e.l;
            }
          }),
          Object.defineProperty(e, 'id', {
            enumerable: !0,
            get: function() {
              return e.i;
            }
          }),
          (e.webpackPolyfill = 1)),
        e
      );
    };
  },
  function(e, t, n) {
    'use strict';
    function o(e, t, n) {
      var o = '' + e + Date.now(),
        r = i(n, 2),
        s = r[0],
        a = r[1],
        l = {
          scrollbars: 1,
          resizable: 1,
          menubar: 0,
          toolbar: 0,
          status: 0,
          left: (screen.width - s) / 2,
          top: (screen.height - a) / 2,
          width: s,
          height: a
        },
        c = Object.keys(l)
          .map(function(e) {
            return e + '=' + l[e];
          })
          .join(','),
        u = window.open(t, o, c);
      u && u.focus();
    }
    Object.defineProperty(t, '__esModule', { value: !0 });
    var i = (function() {
      function e(e, t) {
        var n = [],
          o = !0,
          i = !1,
          r = void 0;
        try {
          for (
            var s, a = e[Symbol.iterator]();
            !(o = (s = a.next()).done) &&
            (n.push(s.value), !t || n.length !== t);
            o = !0
          );
        } catch (e) {
          (i = !0), (r = e);
        } finally {
          try {
            !o && a.return && a.return();
          } finally {
            if (i) throw r;
          }
        }
        return n;
      }
      return function(t, n) {
        if (Array.isArray(t)) return t;
        if (Symbol.iterator in Object(t)) return e(t, n);
        throw new TypeError(
          'Invalid attempt to destructure non-iterable instance'
        );
      };
    })();
    t.open = o;
  },
  function(e, t, n) {
    'use strict';
    (function(o) {
      var i,
        r =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function(e) {
                return typeof e;
              }
            : function(e) {
                return e &&
                  'function' == typeof Symbol &&
                  e.constructor === Symbol &&
                  e !== Symbol.prototype
                  ? 'symbol'
                  : typeof e;
              };
      !(function(o) {
        function s(e) {
          function t(e) {
            return _.test(e);
          }
          function n(e) {
            var t = _.exec(e);
            if (t) {
              var n = { block: t[1] || t[4] },
                o = t[5],
                i = t[2] || t[6];
              if ((o && (n.elem = o), i)) {
                var r = t[3] || t[7];
                (n.modName = i), (n.modVal = r || !0);
              }
              return n;
            }
          }
          function o(e) {
            if (e && e.block) {
              var t = e.block;
              if ((e.elem && (t += m.elem + e.elem), e.modName)) {
                var n = e.modVal;
                (!n && 0 !== n && e.hasOwnProperty('modVal')) ||
                  (t += m.mod.name + e.modName),
                  n && !0 !== n && (t += m.mod.val + n);
              }
              return t;
            }
          }
          function i(e) {
            if (('string' == typeof e && (e = n(e)), e && e.block)) {
              var t = e.modName,
                o = t && (e.modVal || !e.hasOwnProperty('modVal'));
              if (e.elem) {
                if (o) return c.ELEM_MOD;
                if (!t) return c.ELEM;
              }
              return o ? c.BLOCK_MOD : t ? void 0 : c.BLOCK;
            }
          }
          function r(e) {
            return i(e) === c.BLOCK;
          }
          function s(e) {
            return i(e) === c.BLOCK_MOD;
          }
          function u(e) {
            return i(e) === c.ELEM;
          }
          function d(e) {
            return i(e) === c.ELEM_MOD;
          }
          var h = a(e),
            f = JSON.stringify(h);
          if (p[f]) return p[f];
          var m = h.delims,
            _ = l(m, h.wordPattern),
            v = {
              validate: t,
              typeOf: i,
              isBlock: r,
              isBlockMod: s,
              isElem: u,
              isElemMod: d,
              parse: n,
              stringify: o,
              elemDelim: m.elem,
              modDelim: m.mod.name,
              modValDelim: m.mod.val
            };
          return (p[f] = v), v;
        }
        function a(e) {
          if ((e || (e = {}), 'string' == typeof e)) {
            var t = u[e];
            if (!t) throw new Error('The `' + e + '` naming is unknown.');
            return t;
          }
          var n = u.origin,
            o = n.delims,
            i = o.mod,
            r = e.mod || o.mod;
          return {
            delims: {
              elem: e.elem || o.elem,
              mod:
                'string' == typeof r
                  ? { name: r, val: r }
                  : { name: r.name || i.name, val: r.val || r.name || i.val }
            },
            wordPattern: e.wordPattern || n.wordPattern
          };
        }
        function l(e, t) {
          var n = '(' + t + ')',
            o = '(?:' + e.elem + '(' + t + '))?',
            i = '(?:' + e.mod.name + '(' + t + '))?',
            r = '(?:' + e.mod.val + '(' + t + '))?',
            s = i + r;
          return new RegExp('^' + n + s + '$|^' + n + o + s + '$');
        }
        var c = {
            BLOCK: 'block',
            BLOCK_MOD: 'blockMod',
            ELEM: 'elem',
            ELEM_MOD: 'elemMod'
          },
          u = {
            origin: {
              delims: { elem: '__', mod: { name: '_', val: '_' } },
              wordPattern: '[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*'
            },
            'two-dashes': {
              delims: { elem: '__', mod: { name: '--', val: '_' } },
              wordPattern: '[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*'
            }
          },
          p = {},
          d = !0,
          h = [
            'validate',
            'typeOf',
            'isBlock',
            'isBlockMod',
            'isElem',
            'isElemMod',
            'parse',
            'stringify',
            'elemDelim',
            'modDelim',
            'modValDelim'
          ],
          f = s();
        h.forEach(function(e) {
          s[e] = f[e];
        }),
          'object' === r(t) && ((e.exports = s), (d = !1)),
          'object' ===
            ('undefined' == typeof modules ? 'undefined' : r(modules)) &&
            (modules.define('bem-naming', function(e) {
              e(s);
            }),
            (d = !1)),
          void 0 !==
            (i = function(e, t, n) {
              n.exports = s;
            }.call(t, n, t, e)) && (e.exports = i),
          (d = !1),
          d && (o.bemNaming = s);
      })('undefined' != typeof window ? window : o);
    }.call(t, n(12)));
  },
  function(e, t, n) {
    'use strict';
    function o(e) {
      var t = document.createElement('input');
      return (
        t.setAttribute('type', 'text'),
        t.setAttribute('value', e),
        (t.style.position = 'absolute'),
        (t.style.left = '-9999px'),
        document.body.appendChild(t),
        t
      );
    }
    function i() {
      try {
        return document.execCommand('copy');
      } catch (e) {
        return !1;
      }
    }
    function r(e, t) {
      var n = o(e);
      n.select();
      var r = i();
      a.default.remove(n), r || t(e);
    }
    Object.defineProperty(t, '__esModule', { value: !0 }),
      (t.copy = i),
      (t.clip = r);
    var s = n(2),
      a = (function(e) {
        return e && e.__esModule ? e : { default: e };
      })(s);
  },
  function(e, t, n) {
    'use strict';
    function o(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function i(e, t) {
      if (!(e instanceof t))
        throw new TypeError('Cannot call a class as a function');
    }
    function r(e, t) {
      var n = (0, f.default)(!0, {}, e, { contentByService: {} });
      return (
        Object.keys(t).forEach(function(e) {
          var o = t[e];
          Object.keys(o).forEach(function(t) {
            var i = 'contentByService.' + e + '.' + t,
              r = o[t];
            _.default.set(n, i, r);
          });
        }),
        n
      );
    }
    function s(e) {
      var t = {};
      return (
        Object.keys(e).forEach(function(n) {
          var o = n.split(':'),
            i = p(o, 2),
            r = i[0],
            s = i[1],
            l = y[r] || y._defaults,
            c = l.group,
            u = l.type,
            d = a(u, e[n]),
            h = void 0;
          if (s) {
            if ('content' !== c) return;
            h = 'contentByService.' + s + '.' + r;
          } else h = c + '.' + r;
          _.default.set(t, h, d);
        }),
        t
      );
    }
    function a(e, t) {
      switch (e) {
        case 'boolean':
          return void 0 !== t;
        default:
          return t;
      }
    }
    function l(e, t) {
      var n = {};
      return (
        Object.keys(e).forEach(function(o) {
          var i = e[o];
          if ('object' === (void 0 === i ? 'undefined' : u(i)) && null !== i)
            if ('contentByService' === o) {
              var r = i;
              Object.keys(r).forEach(function(e) {
                var o = r[e];
                'object' === (void 0 === i ? 'undefined' : u(i)) &&
                  null !== i &&
                  Object.keys(o).forEach(function(i) {
                    var r = o[i],
                      s = 'contentByService.' + e + '.' + i;
                    (void 0 === _.default.get(t, 'content.' + i) &&
                      void 0 ===
                        _.default.get(t, 'contentByService.' + e + '.' + i)) ||
                      _.default.set(n, s, r);
                  });
              });
            } else {
              var s = i;
              Object.keys(s).forEach(function(e) {
                var i = s[e],
                  r = o + '.' + e;
                void 0 !== _.default.get(t, o + '.' + e) &&
                  _.default.set(n, r, i);
              });
            }
        }),
        n
      );
    }
    function c(e, t, n) {
      var o =
          arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {},
        i = r(t, e),
        a = s(n),
        c = l(a, i),
        u = l(o, i);
      return new v(i, c, u);
    }
    Object.defineProperty(t, '__esModule', { value: !0 }), (t.Storage = void 0);
    var u =
        'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
          ? function(e) {
              return typeof e;
            }
          : function(e) {
              return e &&
                'function' == typeof Symbol &&
                e.constructor === Symbol &&
                e !== Symbol.prototype
                ? 'symbol'
                : typeof e;
            },
      p = (function() {
        function e(e, t) {
          var n = [],
            o = !0,
            i = !1,
            r = void 0;
          try {
            for (
              var s, a = e[Symbol.iterator]();
              !(o = (s = a.next()).done) &&
              (n.push(s.value), !t || n.length !== t);
              o = !0
            );
          } catch (e) {
            (i = !0), (r = e);
          } finally {
            try {
              !o && a.return && a.return();
            } finally {
              if (i) throw r;
            }
          }
          return n;
        }
        return function(t, n) {
          if (Array.isArray(t)) return t;
          if (Symbol.iterator in Object(t)) return e(t, n);
          throw new TypeError(
            'Invalid attempt to destructure non-iterable instance'
          );
        };
      })(),
      d = (function() {
        function e(e, t) {
          for (var n = 0; n < t.length; n++) {
            var o = t[n];
            (o.enumerable = o.enumerable || !1),
              (o.configurable = !0),
              'value' in o && (o.writable = !0),
              Object.defineProperty(e, o.key, o);
          }
        }
        return function(t, n, o) {
          return n && e(t.prototype, n), o && e(t, o), t;
        };
      })();
    (t.createSchema = r),
      (t.fromDataset = s),
      (t.applyWhitelist = l),
      (t.default = c);
    var h = n(11),
      f = o(h),
      m = n(82),
      _ = o(m),
      v = (t.Storage = (function() {
        function e() {
          i(this, e);
          for (var t = arguments.length, n = Array(t), o = 0; o < t; o++)
            n[o] = arguments[o];
          this._options = f.default.apply(void 0, [!0, {}].concat(n));
        }
        return (
          d(e, [
            {
              key: 'merge',
              value: function(e) {
                (0, f.default)(!0, this._options, e);
              }
            },
            {
              key: 'get',
              value: function(e, t) {
                if (t && e.match(/^content\./)) {
                  var n = e.replace(
                      /^content\./,
                      'contentByService.' + t + '.'
                    ),
                    o = _.default.get(this._options, n);
                  if (void 0 !== o) return o;
                }
                return _.default.get(this._options, e);
              }
            }
          ]),
          e
        );
      })()),
      y = {
        _defaults: { group: 'content', type: 'string' },
        bare: { group: 'theme', type: 'boolean' },
        copy: { group: 'theme', type: 'string' },
        counter: { group: 'theme', type: 'boolean' },
        lang: { group: 'theme', type: 'string' },
        limit: { group: 'theme', type: 'string' },
        nonce: { group: 'theme', type: 'string' },
        popupPosition: { group: 'theme', type: 'string' },
        popupDirection: { group: 'theme', type: 'string' },
        services: { group: 'theme', type: 'string' },
        size: { group: 'theme', type: 'string' },
        direction: { group: 'theme', type: 'string' }
      };
  },
  function(e, t, n) {
    'use strict';
    function o(e) {
      for (var t = e.split('.'), n = [], o = 0; o < t.length; o++) {
        for (var i = t[o]; '\\' === i[i.length - 1] && void 0 !== t[o + 1]; )
          (i = i.slice(0, -1) + '.'), (i += t[++o]);
        n.push(i);
      }
      return n;
    }
    var i = n(83);
    e.exports = {
      get: function(e, t, n) {
        if (!i(e) || 'string' != typeof t) return void 0 === n ? e : n;
        for (var r = o(t), s = 0; s < r.length; s++) {
          if (!Object.prototype.propertyIsEnumerable.call(e, r[s])) return n;
          if (void 0 === (e = e[r[s]]) || null === e) {
            if (s !== r.length - 1) return n;
            break;
          }
        }
        return e;
      },
      set: function(e, t, n) {
        if (!i(e) || 'string' != typeof t) return e;
        for (var r = e, s = o(t), a = 0; a < s.length; a++) {
          var l = s[a];
          i(e[l]) || (e[l] = {}), a === s.length - 1 && (e[l] = n), (e = e[l]);
        }
        return r;
      },
      delete: function(e, t) {
        if (i(e) && 'string' == typeof t)
          for (var n = o(t), r = 0; r < n.length; r++) {
            var s = n[r];
            if (r === n.length - 1) return void delete e[s];
            if (((e = e[s]), !i(e))) return;
          }
      },
      has: function(e, t) {
        if (!i(e) || 'string' != typeof t) return !1;
        for (var n = o(t), r = 0; r < n.length; r++) {
          if (!i(e)) return !1;
          if (!(n[r] in e)) return !1;
          e = e[n[r]];
        }
        return !0;
      }
    };
  },
  function(e, t, n) {
    'use strict';
    var o =
      'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
        ? function(e) {
            return typeof e;
          }
        : function(e) {
            return e &&
              'function' == typeof Symbol &&
              e.constructor === Symbol &&
              e !== Symbol.prototype
              ? 'symbol'
              : typeof e;
          };
    e.exports = function(e) {
      var t = void 0 === e ? 'undefined' : o(e);
      return null !== e && ('object' === t || 'function' === t);
    };
  }
]);
