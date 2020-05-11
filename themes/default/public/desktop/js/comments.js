var cinemapress_comments = {
  domain: '',
  spoiler: '',
  submit: '',
  search: '',
  movie_id: '',
  season_id: '',
  episode_id: '',
  content_id: '',
  recaptcha_sitekey: '',
  recaptcha_text: '',
  min_symbols: parseInt(''),
  min_symbols_text: '',
  url_links: parseInt(''),
  url_links_text: '',
  bb_codes: parseInt(''),
  bb_codes_text: '',
  html_tags: parseInt(''),
  html_tags_text: '',
  stopworls: encodeURIComponent('')
};
(function(cc) {
  var comment_text = document.querySelector('[name="comment_text"]');
  if (!comment_text) return;
  var comment_button_bg = document.querySelector(
    '.cinemapress-comment-button-bg'
  );
  var comment_button_text = document.querySelector(
    '.cinemapress-comment-button-text'
  );
  var comment_spoilers = document.querySelectorAll(
    '.cinemapress-comment-spoiler'
  );
  var comment_search = document.querySelectorAll('.cinemapress-comment-search');
  var comment_stars = document.querySelectorAll(
    '.cinemapress-comment-star div'
  );
  var comment_bb_codes = document.querySelectorAll('[data-bb-code]');
  var comment_type = document.querySelectorAll(
    '[data-comment-type="like"],[data-comment-type="dislike"]'
  );
  var comment_anonymous = document.querySelector('[name="comment_anonymous"]');
  var comment_anonymous_new = getCookieCinemaPress('CP_anonymous');
  if (comment_anonymous && comment_anonymous_new) {
    comment_anonymous.value = comment_anonymous_new;
  }
  comment_type.forEach(function(type) {
    type.addEventListener('click', createRequest, true);
  });
  comment_spoilers.forEach(function(spoiler) {
    spoiler.addEventListener(
      'click',
      function() {
        if (this.innerHTML === cc.spoiler) {
          this.innerHTML = this.dataset.commentSpoiler;
        } else {
          this.innerHTML = cc.spoiler;
        }
      },
      true
    );
  });
  comment_search.forEach(function(search) {
    search.addEventListener(
      'click',
      function() {
        window.open(
          '/' +
            cc.search +
            '?q=' +
            encodeURIComponent(this.dataset.commentSearch)
        );
      },
      true
    );
  });
  comment_stars.forEach(function(star) {
    star.addEventListener('click', function() {
      var self = this;
      comment_text.dataset.commentStar = self.dataset.commentStar;
      document
        .querySelectorAll('.cinemapress-comment-star div')
        .forEach(function(span) {
          if (span.dataset.commentStar === self.dataset.commentStar) {
            span.setAttribute(
              'class',
              span.getAttribute('class') + ' selected'
            );
          } else {
            span.style.display = 'none';
          }
        });
    });
  });
  comment_bb_codes.forEach(function(bb_code) {
    bb_code.addEventListener('click', function() {
      var textarea = document.querySelector('[name="comment_text"]');
      if (this.dataset.bbValue) {
        textarea.value =
          (cc.bb_codes ? '[' + this.dataset.bbCode + ']' : '') +
          this.dataset.bbValue +
          (cc.bb_codes ? '[/' + this.dataset.bbCode + '], ' : ', ');
        textarea.focus();
        textarea.dataset.replyId = this.dataset.replyId;
        window.location.hash = '#cinemapress-comments';
      } else if (this.dataset.bbCode) {
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var sel = textarea.value.substring(start, end);
        textarea.value =
          textarea.value.substring(0, start) +
          (cc.bb_codes ? '[' + this.dataset.bbCode + ']' : '') +
          sel +
          (cc.bb_codes ? '[/' + this.dataset.bbCode + ']' : '') +
          textarea.value.substring(end);
        textarea.focus();
        textarea.selectionEnd = end + (this.dataset.bbCode.length * 2 + 5);
      }
    });
  });
  var once_click = true;
  comment_text.addEventListener('input', function() {
    var self = this;
    self.value = self.value
      .replace(
        /\[(b|i|spoiler|search)([^\]]*?)]\[\/(b|i|spoiler|search)]/gi,
        '[$1]$2[/$3]'
      )
      .replace(
        /\[(b|i|spoiler|search)]\[([^\]]*?)\/(b|i|spoiler|search)]/gi,
        '[$1]$2[/$3]'
      )
      .replace(
        /\[(b|i|spoiler|search)]\[\/([^\]]*?)(b|i|spoiler|search)]/gi,
        '[$1]$2[/$3]'
      )
      .replace(
        /\[(b|i|spoiler|search)]\s*([^\[]*?)\[\/(b|i|spoiler|search)]/gi,
        '[$1]$2[/$3]'
      )
      .replace(
        /([a-zа-яё0-9]+)\[(b|i|spoiler|search)]([^\[]*?)\[\/(b|i|spoiler|search)]/gi,
        '$1 [$2]$3[/$4]'
      )
      .replace(
        /\[(b|i|spoiler|search)]([^\[]*?)\[\/(b|i|spoiler|search)]([a-zа-яё0-9]+)/gi,
        '[$1]$2[/$3] $4'
      );
    if (/\[\/(b|i|spoiler|search)]$/i.test(self.value)) {
      self.focus();
      self.selectionEnd = self.value.lastIndexOf('[/');
    }
    var value = self.value
      .replace(/[<][^>]*?>/gi, '')
      .replace(/[\[][^\]]*?]/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/(^\s*)|(\s*)$/g, '');
    self.value = self.value.replace(/\s{3,}/g, ' ');
    var error_stopworlds = cc.stopworls
      ? decodeURIComponent(cc.stopworls)
          .split(',')
          .filter(function(world) {
            var w = new RegExp(world, 'i');
            return w.test(self.value);
          })
      : [];
    var error_min_symbols = cc.min_symbols && value.length < cc.min_symbols;
    var error_url_links =
      !cc.url_links &&
      /[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+/i.test(
        self.value
      );
    var error_bb_codes = !cc.bb_codes && /\[[^\]]*?]/i.test(self.value);
    var error_html_tags = !cc.html_tags && /<[^>]*?>/i.test(self.value);
    if (
      error_min_symbols ||
      error_url_links ||
      error_bb_codes ||
      error_html_tags ||
      error_stopworlds.length
    ) {
      once_click = true;
      comment_button_bg.className = comment_button_bg.className
        .replace(/hover-on/gi, 'hover-off')
        .replace(/\serror-off/gi, '')
        .replace(/\serror-on/gi, '');
      comment_button_text.className = comment_button_text.className
        .replace(/\serror-off/gi, '')
        .replace(/\serror-on/gi, '');
      comment_button_bg.setAttribute(
        'class',
        comment_button_bg.getAttribute('class') + ' error-on'
      );
      comment_button_text.setAttribute(
        'class',
        comment_button_text.getAttribute('class') + ' error-on'
      );
      if (error_min_symbols) {
        comment_button_text.innerHTML = cc.min_symbols_text.replace(
          '[num]',
          '' + (cc.min_symbols - value.length)
        );
      } else if (error_url_links) {
        comment_button_text.innerHTML = cc.url_links_text;
      } else if (error_bb_codes) {
        comment_button_text.innerHTML = cc.bb_codes_text;
      } else if (error_html_tags) {
        comment_button_text.innerHTML = cc.html_tags_text;
      } else if (error_stopworlds.length) {
        comment_button_text.innerHTML =
          '«' + error_stopworlds.join('», «') + '»';
      } else {
        comment_button_text.innerHTML = 'o_0';
      }
      comment_button_bg.removeEventListener('click', createRequest, true);
    } else if (self.value) {
      comment_button_bg.className = comment_button_bg.className.replace(
        /hover-off/gi,
        'hover-on'
      );
      comment_button_bg.className = comment_button_bg.className.replace(
        /\serror-off/gi,
        ''
      );
      comment_button_bg.className = comment_button_bg.className.replace(
        /\serror-on/gi,
        ''
      );
      comment_button_text.className = comment_button_text.className.replace(
        /\serror-off/gi,
        ''
      );
      comment_button_text.className = comment_button_text.className.replace(
        /\serror-on/gi,
        ''
      );
      comment_button_bg.setAttribute(
        'class',
        comment_button_bg.getAttribute('class') + ' error-off'
      );
      comment_button_text.setAttribute(
        'class',
        comment_button_text.getAttribute('class') + ' error-off'
      );
      comment_button_text.innerHTML = cc.submit;
      if (once_click) {
        once_click = false;
        comment_button_bg.addEventListener('click', createRequest, true);
      }
    }
  });
  function createRequest() {
    var data = {};
    var self = this;
    self.removeEventListener('click', createRequest, true);
    var comment_recaptcha = document.querySelector('#cinemapress-comments');
    if (
      comment_recaptcha &&
      comment_recaptcha.dataset &&
      comment_recaptcha.dataset.recaptcha
    ) {
      data.comment_recaptcha = comment_recaptcha.dataset.recaptcha;
    }
    if (self.dataset.commentType === 'submit') {
      data.movie_id = cc.movie_id;
      data.season_id = cc.season_id;
      data.episode_id = cc.episode_id;
      data.content_id = cc.content_id;
      data.comment_title = document.title;
      var comment_text = document.querySelector('[name="comment_text"]');
      var comment_anonymous = document.querySelector(
        '[name="comment_anonymous"]'
      );
      if (comment_anonymous && comment_anonymous.value) {
        data.comment_anonymous = comment_anonymous.value;
        setCookieCinemaPress('CP_anonymous', comment_anonymous.value, {
          expires: 864e5,
          path: '/',
          domain: '.' + cc.domain
        });
      }
      data.reply_id = comment_text.dataset.replyId;
      data.comment_text = comment_text.value;
      data.comment_star = comment_text.dataset.commentStar;
      comment_text.value = '';
      comment_text.dataset.replyId = '';
      comment_text.dataset.commentStar = '';
      var comment_count = document.querySelector('.cinemapress-comment-count');
      if (comment_count)
        comment_count.innerHTML = '' + (parseInt(comment_count.innerHTML) + 1);
      var comment_star = document.querySelector('.cinemapress-comment-star');
      if (comment_star) comment_star.style.visibility = 'hidden';
      var question = document.querySelector('.cinemapress-comment-question');
      if (question) {
        var form_bb = document.querySelector('.cinemapress-comment-form-bb');
        if (form_bb) form_bb.style.visibility = 'hidden';
        question.style.display = 'block';
      }
      var question_text = document.querySelector(
        '.cinemapress-comment-question-text'
      );
      if (question_text) question_text.style.display = 'block';
      var answer = document.querySelector(
        '.cinemapress-comment-question-answer'
      );
      if (answer) answer.style.display = 'block';
      var answer_yes = document.querySelector(
        '.cinemapress-comment-question-answer-yes'
      );
      if (answer_yes) {
        answer_yes.addEventListener(
          'click',
          function() {
            answer.style.display = 'none';
            question_text.style.display = 'none';
            document.querySelector(
              '.cinemapress-comment-question-text-yes'
            ).style.display = 'block';
          },
          false
        );
      }
      var answer_not = document.querySelector(
        '.cinemapress-comment-question-answer-not'
      );
      if (answer_not) {
        answer_not.addEventListener(
          'click',
          function() {
            answer.style.display = 'none';
            question_text.style.display = 'none';
            document.querySelector(
              '.cinemapress-comment-question-text-not'
            ).style.display = 'block';
          },
          false
        );
      }
      once_click = true;
    } else if (
      self.dataset.commentType === 'like' ||
      self.dataset.commentType === 'dislike'
    ) {
      data.comment_id = self.dataset.commentId;
      data.comment_type = self.dataset.commentType;
      var number = self.querySelector(
        '.cinemapress-comment-' + self.dataset.commentType + '-number'
      );
      number.innerHTML = '' + (parseInt(number.innerHTML) + 1);
    }
    sendRequest(data, function(res) {
      if (typeof res === 'object') {
        if (
          self.dataset.commentType === 'like' ||
          self.dataset.commentType === 'dislike'
        ) {
          if (res.status !== 'success') {
            var number = self.querySelector(
              '.cinemapress-comment-' + self.dataset.commentType + '-number'
            );
            number.innerHTML = '' + (parseInt(number.innerHTML) - 1);
          }
          var ld = document.querySelector(
            '' +
              '[data-comment-type="' +
              (self.dataset.commentType && self.dataset.commentType === 'like'
                ? 'dislike'
                : 'like') +
              '"]' +
              '[data-comment-id="' +
              self.dataset.commentId +
              '"]'
          );
          if (ld) {
            ld.removeEventListener('click', createRequest, true);
          }
        } else if (res.status === 'error') {
          if (res.code === 3) {
            console.log(res.message);
            alert(cc.recaptcha_text);
          } else {
            alert(res.message);
          }
        }
      } else {
        console.log(res);
      }
      cinemapressRecaptcha();
    });
  }
  function sendRequest(data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/comments', true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        callback(
          typeof xhr.responseText === 'string'
            ? JSON.parse(xhr.responseText)
            : xhr.responseText
        );
      }
    };
    xhr.send(JSON.stringify(data));
  }
  function cinemapressRecaptcha() {
    if (!cc.recaptcha_sitekey) return;
    grecaptcha.ready(function() {
      grecaptcha.execute(cc.recaptcha_sitekey).then(function(e) {
        var o = document.querySelector('#cinemapress-comments');
        if (o) {
          o.setAttribute('data-recaptcha', e);
        }
      });
    });
  }
  document.addEventListener('DOMContentLoaded', function(event) {
    cinemapressRecaptcha();
  });
  setInterval(function() {
    cinemapressRecaptcha();
  }, 60000);
})(cinemapress_comments);
