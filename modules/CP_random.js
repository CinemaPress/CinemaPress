'use strict';

/**
 * Configuration dependencies.
 */

var modules = require('../config/production/modules');
Object.keys(modules).length === 0 &&
  (modules = require('../config/production/modules.backup'));

/**
 * Add the function to random movie.
 * All category in top: class="randomMovieCategory"
 * All pages in menu: class="randomMovieMenu"
 * Homepage: class="randomMovieIndex"
 * Movie page: class="randomMovieRelated"
 *
 * @return {String}
 */

function codeRandom(page, movies) {
  if (!page.type) return '';

  var code = '';

  if (modules.random.status) {
    if (modules.random.data.index) {
      code +=
        'var a,b=document.querySelectorAll(".randomMovieIndex");' +
        'if(b)for(a=0;a<b.length;++a)b[a].outerHTML=b[a].innerHTML;';
    }

    if (modules.random.data.related) {
      code +=
        'var c,d=document.querySelectorAll(".randomMovieRelated");' +
        'if(d)for(c=0;c<d.length;++c)d[c].outerHTML=d[c].innerHTML;';
    }

    if (modules.random.data.menu) {
      code +=
        'var e,f=document.querySelectorAll(".randomMovieMenu");' +
        'if(f)for(e=0;e<f.length;++e)f[e].outerHTML=f[e].innerHTML;';
    }

    if (
      modules.random.data.category.indexOf(page.type) + 1 &&
      page.sorting &&
      movies
    ) {
      code +=
        'var g,h=document.querySelectorAll(".randomMovieCategory");' +
        'if(h)for(g=0;g<h.length;++g)h[g].outerHTML=h[g].innerHTML;';
    }

    code = '(function(){' + code + '})();';
    code = '<script>' + code + '</script>';
  }

  return code;
}

module.exports = {
  code: codeRandom
};
