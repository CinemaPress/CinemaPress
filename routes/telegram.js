'use strict';

/**
 * Configuration dependencies.
 */

var config = require('../config/production/config');

/**
 * Node dependencies.
 */

var TelegramBot = require('node-telegram-bot-api');
var bodyParser = require('body-parser');
var express = require('express');
var router = express.Router();

router.use(bodyParser.json());

/*
<!-- Вствить в вниз шаблона /themes/шаблон/views/includes/footer.ejs -->
<link href="/telegram/style.css?v=<%- page.ver %>" rel="stylesheet"/>
<script src="/telegram/script.js?v=<%- page.ver %>"></script>
<script src="/telegram/rand.js?v=<%- Math.random() %>"></script>
*/

/* ------------------------ TOKEN ------------------------ */
var TOKEN = '';
/* ------------------------------------------------------- */

/* ----------------------- CHAT_ID ----------------------- */
var CHAT_ID = 0;
/* ------------------------------------------------------- */

var cinemaLang = {
  success: 'Спасибо за Ваше сообщение!',
  id: 'Не заполнен CHAT_ID',
  ip: 'Не найден Ваш IP',
  message: 'Не заполнено сообщение',
  rand: 'Неправильно посчитана капча',
  cookies: 'Включите cookies и обновите страницу'
};

var bot = new TelegramBot(TOKEN);

bot.setWebHook(
  config.protocol + config.subdomain + config.domain + '/telegram/bot' + TOKEN
);

bot.on('message', function(msg) {
  if (!CHAT_ID) {
    CHAT_ID = msg.chat.id;
    bot.sendMessage(msg.chat.id, msg.chat.id);
  }
});

router.post('/bot' + TOKEN, function(req, res) {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

router.post('/message', function(req, res) {
  var form = req.body;
  var ip = getIp(req);

  if (!CHAT_ID) {
    return res.json({
      color: 'red',
      message: cinemaLang.id
    });
  }

  if (!ip) {
    return res.json({
      color: 'red',
      message: cinemaLang.ip
    });
  }

  if (!form.message) {
    return res.json({
      color: 'red',
      message: cinemaLang.message
    });
  } else {
    form.message = decodeURIComponent(form.message);
  }

  if (!req.session.CP_rand) {
    return res.json({
      color: 'red',
      message: cinemaLang.cookies
    });
  }

  if (
    !form.rand ||
    !req.session.CP_rand ||
    '' + form.rand !== req.session.CP_rand + ''
  ) {
    return res.json({
      color: 'red',
      message: cinemaLang.rand
    });
  } else {
    req.session.CP_rand = '';
  }

  var matches = form.message.match(/\bhttps?:\/\/\S+/gi);
  var urls = matches
    ? matches
        .map(function(url, i) {
          var hostname = '';
          try {
            hostname = new URL(url).hostname;
          } catch (e) {
            console.log(e);
          }
          var regUrl = new RegExp('\\n' + url + '$', 'i');
          var n = regUrl.test(url) ? nums(i + 1) : '';
          form.message = form.message.replace(regUrl, '');
          form.message = form.message.replace(url, n);
          return hostname
            ? [
                {
                  text: n + ' ' + hostname,
                  url: url
                }
              ]
            : false;
        })
        .filter(Boolean)
    : null;

  var reply_markup =
    urls && urls.length
      ? {
          reply_markup: {
            inline_keyboard: urls
          }
        }
      : undefined;
  bot.sendMessage(
    CHAT_ID,
    form.message.replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, ''),
    reply_markup
  );
  return res.json({ color: 'green', message: cinemaLang.success });
});

router.get('/style.css', function(req, res) {
  res.header('Content-Type', 'text/css');
  res.send(
    '' +
      '.cinemaModal {\n' +
      '  display: none;\n' +
      '  position: fixed;\n' +
      '  z-index: 10000000;\n' +
      '  left: 0;\n' +
      '  top: 0;\n' +
      '  padding-top: 100px;\n' +
      '  width: 100%;\n' +
      '  height: 100%;\n' +
      '  overflow: auto;\n' +
      '  background-color: rgb(0,0,0);\n' +
      '  background-color: rgba(0,0,0,0.6);\n' +
      '  -webkit-animation-name: fadeIn;\n' +
      '  -webkit-animation-duration: 0.4s;\n' +
      '  animation-name: fadeIn;\n' +
      '  animation-duration: 0.4s\n' +
      '}\n' +
      '.cinemaModal-content {\n' +
      '  margin: auto;\n' +
      '  width: 70%;\n' +
      '  -webkit-animation-name: slideIn;\n' +
      '  -webkit-animation-duration: 0.4s;\n' +
      '  animation-name: slideIn;\n' +
      '  animation-duration: 0.4s\n' +
      '}\n' +
      '.cinemaModal-close {\n' +
      '  color: white;\n' +
      '  float: right;\n' +
      '  font-weight: bold;\n' +
      '}\n' +
      '.cinemaModal-close:hover,\n' +
      '.cinemaModal-close:focus {\n' +
      '  color: #999;\n' +
      '  text-decoration: none;\n' +
      '  cursor: pointer;\n' +
      '}\n' +
      '.cinemaModal-header {\n' +
      '  border-radius: 10px 10px 0 0;  \n' +
      '  padding: 10px 16px;\n' +
      '  background-image: linear-gradient(to right, #262626, #262626);\n' +
      '  color: #ccc;\n' +
      '  text-align: left;\n' +
      '}\n' +
      '.cinemaModal-body {\n' +
      '  background-image: linear-gradient(to right, #262626, #262626);\n' +
      '  color: #fff;\n' +
      '  padding: 0;\n' +
      '  margin: 0;\n' +
      '  position: relative;\n' +
      '  text-align: left;\n' +
      '}\n' +
      '.cinemaModal-footer {\n' +
      '  border-radius: 0 0 10px 10px;\n' +
      '  padding: 10px 16px;\n' +
      '  background-image: linear-gradient(to right, #262626, #262626);\n' +
      '  color: #ccc;\n' +
      '  text-align: left;\n' +
      '}\n' +
      '.cinemaModal-submit {\n' +
      '  padding: 2px 10px;\n' +
      '  background-color: #666;\n' +
      '  color: white;\n' +
      '  float: right;\n' +
      '  font-size: 12px;\n' +
      '  border-radius: 3px;\n' +
      '}\n' +
      '.cinemaModal-submit:hover {\n' +
      '  background-color: #777;\n' +
      '  cursor: pointer;\n' +
      '}\n' +
      '.cinemaModal-rand {\n' +
      '  width: 30px;\n' +
      '  background-color: #ccc !important;\n' +
      '  color: #000 !important;\n' +
      '  border: 0 !important;\n' +
      '  padding: 0 4px;\n' +
      '  border-radius: 3px;\n' +
      '}\n' +
      '.cinemaModal-message {\n' +
      '  background-image: linear-gradient(to right, #262626, #262626);\n' +
      '  color: #fff;\n' +
      '  margin: 0;\n' +
      '  padding: 10px 16px;\n' +
      '  height: 100px;\n' +
      '  width: 100%;\n' +
      '  border: none !important;\n' +
      '  font-size: 14px;\n' +
      '  overflow: auto;\n' +
      '  outline: none;\n' +
      '  -webkit-box-shadow: none;\n' +
      '  -moz-box-shadow: none;\n' +
      '  box-shadow: none;\n' +
      '}\n' +
      '@-webkit-keyframes slideIn {\n' +
      '  from {bottom: -300px; opacity: 0} \n' +
      '  to {bottom: 0; opacity: 1}\n' +
      '}\n' +
      '@keyframes slideIn {\n' +
      '  from {bottom: -300px; opacity: 0}\n' +
      '  to {bottom: 0; opacity: 1}\n' +
      '}\n' +
      '@-webkit-keyframes fadeIn {\n' +
      '  from {opacity: 0} \n' +
      '  to {opacity: 1}\n' +
      '}\n' +
      '@keyframes fadeIn {\n' +
      '  from {opacity: 0} \n' +
      '  to {opacity: 1}\n' +
      '}' +
      ''
  );
});

router.get('/script.js', function(req, res) {
  res.header('Content-Type', 'text/javascript');
  res.send(
    '    var cinemaLang = {\n' +
      '        "name": "Обратная связь",\n' +
      '        "error": "Ошибка отправки сообщения",\n' +
      '        "message": "Заполните поле сообщения",\n' +
      '        "rand": "Заполните поле капчи",\n' +
      '        "placeholder": "Ваше сообщение",\n' +
      '        "submit": "Отправить"\n' +
      '    };\n' +
      '\n' +
      "    var divCinemaModal = document.createElement('div');\n" +
      "    var divCinemaModalContent = document.createElement('div');\n" +
      "    var divCinemaModalHeader = document.createElement('div');\n" +
      "    var divCinemaModalClose = document.createElement('span');\n" +
      "    var divCinemaModalName = document.createElement('span');\n" +
      "    var divCinemaModalBody = document.createElement('div');\n" +
      "    var divCinemaModalMessage = document.createElement('textarea');\n" +
      "    var divCinemaModalFooter = document.createElement('div');\n" +
      "    var divCinemaModalMath = document.createElement('span');\n" +
      "    var divCinemaModalEqual = document.createElement('span');\n" +
      "    var divCinemaModalRand = document.createElement('input');\n" +
      "    var divCinemaModalSubmit = document.createElement('span');\n" +
      "    var divCinemapressCommentFormBg = document.createElement('div');\n" +
      '\n' +
      "    divCinemaModal.setAttribute('class', 'cinemaModal');\n" +
      "    divCinemaModalContent.setAttribute('class', 'cinemaModal-content');\n" +
      "    divCinemaModalHeader.setAttribute('class', 'cinemaModal-header');\n" +
      "    divCinemaModalClose.setAttribute('class', 'cinemaModal-close');\n" +
      "    divCinemaModalName.setAttribute('class', 'cinemaModal-name');\n" +
      "    divCinemaModalBody.setAttribute('class', 'cinemaModal-body');\n" +
      "    divCinemaModalMessage.setAttribute('class', 'cinemaModal-message');\n" +
      "    divCinemaModalFooter.setAttribute('class', 'cinemaModal-footer');\n" +
      "    divCinemaModalMath.setAttribute('class', 'cinemaModal-math');\n" +
      "    divCinemaModalRand.setAttribute('class', 'cinemaModal-rand');\n" +
      "    divCinemaModalSubmit.setAttribute('class', 'cinemaModal-submit');\n" +
      "    divCinemapressCommentFormBg.setAttribute('class', 'cinemapress-comment-form-bg');\n" +
      '\n' +
      "    divCinemaModalRand.setAttribute('type', 'text');\n" +
      "    divCinemaModalClose.innerHTML = 'X';\n" +
      "    divCinemaModalEqual.innerHTML = ' = ';\n" +
      "    divCinemaModalMessage.setAttribute('placeholder', cinemaLang.placeholder);\n" +
      '    divCinemaModalName.innerHTML = cinemaLang.name;\n' +
      '    divCinemaModalSubmit.innerHTML = cinemaLang.submit;\n' +
      '\n' +
      '    divCinemaModalHeader.appendChild(divCinemaModalClose);\n' +
      '    divCinemaModalHeader.appendChild(divCinemaModalName);\n' +
      '\n' +
      '    divCinemaModalBody.appendChild(divCinemaModalMessage);\n' +
      '    divCinemaModalBody.appendChild(divCinemapressCommentFormBg);\n' +
      '\n' +
      '    divCinemaModalFooter.appendChild(divCinemaModalMath);\n' +
      '    divCinemaModalFooter.appendChild(divCinemaModalEqual);\n' +
      '    divCinemaModalFooter.appendChild(divCinemaModalRand);\n' +
      '    divCinemaModalFooter.appendChild(divCinemaModalSubmit);\n' +
      '\n' +
      '    divCinemaModalContent.appendChild(divCinemaModalHeader);\n' +
      '    divCinemaModalContent.appendChild(divCinemaModalBody);\n' +
      '    divCinemaModalContent.appendChild(divCinemaModalFooter);\n' +
      '\n' +
      '    divCinemaModal.appendChild(divCinemaModalContent);\n' +
      '    document.body.appendChild(divCinemaModal);\n' +
      '\n' +
      "    var cinemaButtons = document.querySelectorAll('.cinemaButton');\n" +
      '    if (cinemaButtons) {\n' +
      '        cinemaButtons.forEach(function(btn) {\n' +
      "            btn.addEventListener('click', function(event) {\n" +
      '                event.preventDefault();\n' +
      "                document.querySelector('.cinemaModal-name').innerHTML = cinemaLang.name;\n" +
      "                document.querySelector('.cinemaModal-message').value = '';\n" +
      "                document.querySelector('.cinemaModal-rand').value = '';\n" +
      '                var cinemaText = this.dataset.cinemaText;\n' +
      '                if (cinemaText) {\n' +
      "                    document.querySelector('.cinemaModal-message').value = cinemaText\n" +
      "                    .replace(/\\\\n/g, '\\n');\n" +
      '                }\n' +
      "                divCinemaModal.style.display = 'block';\n" +
      '            });\n' +
      '        });\n' +
      '    }\n' +
      "    divCinemaModalSubmit.addEventListener('click', function() {\n" +
      "        var cinemaMessage = document.querySelector('.cinemaModal-message');\n" +
      "        var cinemaRand = document.querySelector('.cinemaModal-rand');\n" +
      '        if (cinemaMessage && cinemaMessage.value && cinemaRand && cinemaRand.value) {\n' +
      '            var cinemaHttp = new XMLHttpRequest();\n' +
      "            cinemaHttp.open('POST', '/telegram/message', true);\n" +
      "            cinemaHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');\n" +
      '            cinemaHttp.onreadystatechange = function() {\n' +
      '                if(cinemaHttp.readyState === 4 && cinemaHttp.status === 200) {\n' +
      '                    var cinemaSuccess = JSON.parse(cinemaHttp.responseText);\n' +
      "                    if (cinemaSuccess && cinemaSuccess.color && cinemaSuccess.color === 'green') {\n" +
      "                        document.querySelector('.cinemaModal-message').value = '';\n" +
      "                        document.querySelector('.cinemaModal-rand').value = '';\n" +
      "                        document.querySelector('.cinemaModal-name')\n" +
      "                        .innerHTML = '<span style=\"color:' + cinemaSuccess.color + '\">' + cinemaSuccess.message + '</span>';\n" +
      '                        setTimeout(function() {\n' +
      "                            divCinemaModal.style.display = 'none';\n" +
      '                        }, 2000);\n' +
      "                    } else if (cinemaSuccess && cinemaSuccess.color && cinemaSuccess.color === 'red') {\n" +
      "                        document.querySelector('.cinemaModal-name')\n" +
      "                        .innerHTML = '<span style=\"color:' + cinemaSuccess.color + '\">' + cinemaSuccess.message + '</span>';\n" +
      '                    } else {\n' +
      "                        document.querySelector('.cinemaModal-name')\n" +
      "                        .innerHTML = '<span style=\"color:red\">' + cinemaLang.error + '</span>';\n" +
      '                    }\n' +
      '                }\n' +
      '            }\n' +
      "            cinemaHttp.send('message=' + encodeURIComponent(cinemaMessage.value) + '&rand=' + cinemaRand.value);\n" +
      '        } else {\n' +
      '            if (!cinemaMessage || !cinemaMessage.value) {\n' +
      "                document.querySelector('.cinemaModal-name')\n" +
      "                .innerHTML = '<span style=\"color:red\">' + cinemaLang.message + '</span>';\n" +
      '            }\n' +
      '            if (!cinemaRand || !cinemaRand.value) {\n' +
      "                document.querySelector('.cinemaModal-name')\n" +
      "                .innerHTML = '<span style=\"color:red\">' + cinemaLang.rand + '</span>';\n" +
      '            }\n' +
      '        }\n' +
      '    });\n' +
      "    divCinemaModalClose.addEventListener('click', function() {\n" +
      "        divCinemaModal.style.display = 'none';\n" +
      '    });\n' +
      '    window.onclick = function(event) {\n' +
      '      if (event.target == divCinemaModal) {\n' +
      "        divCinemaModal.style.display = 'none';\n" +
      '      }\n' +
      '    }'
  );
});

router.get('/rand.js', function(req, res) {
  var rand1 = Math.floor(Math.random() * 10) + 1;
  var rand2 = Math.floor(Math.random() * 10) + 1;
  req.session.CP_rand = '' + (rand1 + rand2);
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  res.header('Content-Type', 'text/javascript');
  res.send(
    'document.querySelector(".cinemaModal-math").innerHTML = "' +
      rand1 +
      ' + ' +
      rand2 +
      '";'
  );
});

function getIp(req) {
  var ips = req.ips || [];
  var ip = '';
  if (req.header('x-forwarded-for')) {
    req
      .header('x-forwarded-for')
      .split(',')
      .forEach(function(one_ip) {
        if (ips.indexOf(one_ip.trim()) === -1) {
          ips.push(one_ip.trim());
        }
      });
  }
  if (req.header('x-real-ip')) {
    req
      .header('x-real-ip')
      .split(',')
      .forEach(function(one_ip) {
        if (ips.indexOf(one_ip.trim()) === -1) {
          ips.push(one_ip.trim());
        }
      });
  }
  if (req.connection.remoteAddress) {
    req.connection.remoteAddress.split(',').forEach(function(one_ip) {
      if (ips.indexOf(one_ip.trim()) === -1) {
        ips.push(one_ip.trim());
      }
    });
  }
  ips.forEach(function(one_ip) {
    if (ip) return;
    one_ip = one_ip.replace('::ffff:', '');
    if (
      one_ip !== '127.0.0.1' &&
      /^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/.test(
        one_ip
      )
    ) {
      ip = one_ip;
    }
  });
  return ip;
}

function nums(i) {
  switch (i) {
    case 1:
      return '1⃣';
    case 2:
      return '2⃣';
    case 3:
      return '3⃣';
    case 4:
      return '4⃣';
    case 5:
      return '5⃣';
    case 6:
      return '6⃣';
    case 7:
      return '7⃣';
    case 8:
      return '8⃣';
    case 9:
      return '9⃣';
    default:
      return '#⃣';
  }
}

module.exports = router;

/*
<div class="cinemaModal">
  <div class="cinemaModal-content">
    <div class="cinemaModal-header">
      <span class="cinemaModal-close">&times;</span>
      <span class="cinemaModal-name">Обратная связь</span>
    </div>
    <div class="cinemaModal-body">
      <textarea class="cinemaModal-message" placeholder="Ваше сообщение">
      </textarea>
      <div class="cinemapress-comment-form-bg"></div>
    </div>
    <div class="cinemaModal-footer">
      <span class="cinemaModal-math"></span><span> = </span>
      <input type="text" class="cinemaModal-rand">
      <span class="cinemaModal-submit">Отправить</span>
    </div>
  </div>
</div>
<style>
.cinemaModal {
  display: none;
  position: fixed;
  z-index: 10000000;
  left: 0;
  top: 0;
  padding-top: 100px;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgb(0,0,0);
  background-color: rgba(0,0,0,0.6);
  -webkit-animation-name: fadeIn;
  -webkit-animation-duration: 0.4s;
  animation-name: fadeIn;
  animation-duration: 0.4s
}
.cinemaModal-content {
  margin: auto;
  width: 70%;
  -webkit-animation-name: slideIn;
  -webkit-animation-duration: 0.4s;
  animation-name: slideIn;
  animation-duration: 0.4s
}
.cinemaModal-close {
  color: white;
  float: right;
  font-weight: bold;
}
.cinemaModal-close:hover,
.cinemaModal-close:focus {
  color: #999;
  text-decoration: none;
  cursor: pointer;
}
.cinemaModal-header {
  border-radius: 10px 10px 0 0;
  padding: 10px 16px;
  background-image: linear-gradient(to right, #262626, #262626);
  color: #ccc;
  text-align: left;
}
.cinemaModal-body {
  background-image: linear-gradient(to right, #262626, #262626);
  color: #fff;
  padding: 0;
  margin: 0;
  position: relative;
  text-align: left;
}
.cinemaModal-footer {
  border-radius: 0 0 10px 10px;
  padding: 10px 16px;
  background-image: linear-gradient(to right, #262626, #262626);
  color: #ccc;
  text-align: left;
}
.cinemaModal-submit {
  padding: 2px 10px;
  background-color: #666;
  color: white;
  float: right;
  font-size: 12px;
  border-radius: 3px;
}
.cinemaModal-submit:hover {
  background-color: #777;
  cursor: pointer;
}
.cinemaModal-rand {
  width: 30px;
  background-color: #ccc !important;
  color: #000 !important;
  border: 0 !important;
  padding: 0 4px;
  border-radius: 3px;
}
.cinemaModal-message {
  background-image: linear-gradient(to right, #262626, #262626);
  color: #fff;
  margin: 0;
  padding: 10px 16px;
  height: 100px;
  width: 100%;
  border: none !important;
  font-size: 14px;
  overflow: auto;
  outline: none;
  -webkit-box-shadow: none;
  -moz-box-shadow: none;
  box-shadow: none;
}
@-webkit-keyframes slideIn {
  from {bottom: -300px; opacity: 0}
  to {bottom: 0; opacity: 1}
}
@keyframes slideIn {
  from {bottom: -300px; opacity: 0}
  to {bottom: 0; opacity: 1}
}
@-webkit-keyframes fadeIn {
  from {opacity: 0}
  to {opacity: 1}
}
@keyframes fadeIn {
  from {opacity: 0}
  to {opacity: 1}
}
</style>
<script>
    var cinemaLang = {
        "name": "Обратная связь",
        "error": "Ошибка отправки сообщения",
        "message": "Заполните поле сообщения",
        "rand": "Заполните поле капчи",
        "placeholder": "Ваше сообщение",
        "submit": "Отправить"
    };

    var divCinemaModal = document.createElement('div');
    var divCinemaModalContent = document.createElement('div');
    var divCinemaModalHeader = document.createElement('div');
    var divCinemaModalClose = document.createElement('span');
    var divCinemaModalName = document.createElement('span');
    var divCinemaModalBody = document.createElement('div');
    var divCinemaModalMessage = document.createElement('textarea');
    var divCinemaModalFooter = document.createElement('div');
    var divCinemaModalMath = document.createElement('span');
    var divCinemaModalEqual = document.createElement('span');
    var divCinemaModalRand = document.createElement('input');
    var divCinemaModalSubmit = document.createElement('span');
    var divCinemapressCommentFormBg = document.createElement('div');

    divCinemaModal.setAttribute('class', 'cinemaModal');
    divCinemaModalContent.setAttribute('class', 'cinemaModal-content');
    divCinemaModalHeader.setAttribute('class', 'cinemaModal-header');
    divCinemaModalClose.setAttribute('class', 'cinemaModal-close');
    divCinemaModalName.setAttribute('class', 'cinemaModal-name');
    divCinemaModalBody.setAttribute('class', 'cinemaModal-body');
    divCinemaModalMessage.setAttribute('class', 'cinemaModal-message');
    divCinemaModalFooter.setAttribute('class', 'cinemaModal-footer');
    divCinemaModalMath.setAttribute('class', 'cinemaModal-math');
    divCinemaModalRand.setAttribute('class', 'cinemaModal-rand');
    divCinemaModalSubmit.setAttribute('class', 'cinemaModal-submit');
    divCinemapressCommentFormBg.setAttribute('class', 'cinemapress-comment-form-bg');

    divCinemaModalRand.setAttribute('type', 'text');
    divCinemaModalClose.innerHTML = 'X';
    divCinemaModalEqual.innerHTML = ' = ';
    divCinemaModalMessage.setAttribute('placeholder', cinemaLang.placeholder);
    divCinemaModalName.innerHTML = cinemaLang.name;
    divCinemaModalSubmit.innerHTML = cinemaLang.submit;

    divCinemaModalHeader.appendChild(divCinemaModalClose);
    divCinemaModalHeader.appendChild(divCinemaModalName);

    divCinemaModalBody.appendChild(divCinemaModalMessage);
    divCinemaModalBody.appendChild(divCinemapressCommentFormBg);

    divCinemaModalFooter.appendChild(divCinemaModalMath);
    divCinemaModalFooter.appendChild(divCinemaModalEqual);
    divCinemaModalFooter.appendChild(divCinemaModalRand);
    divCinemaModalFooter.appendChild(divCinemaModalSubmit);

    divCinemaModalContent.appendChild(divCinemaModalHeader);
    divCinemaModalContent.appendChild(divCinemaModalBody);
    divCinemaModalContent.appendChild(divCinemaModalFooter);

    divCinemaModal.appendChild(divCinemaModalContent);
    document.body.appendChild(divCinemaModal);

    var cinemaButtons = document.querySelectorAll('.cinemaButton');
    if (cinemaButtons) {
        cinemaButtons.forEach(function(btn) {
            btn.addEventListener('click', function(event) {
                event.preventDefault();
                document.querySelector('.cinemaModal-name').innerHTML = cinemaLang.name;
                document.querySelector('.cinemaModal-message').value = '';
                document.querySelector('.cinemaModal-rand').value = '';
                var cinemaText = this.dataset.cinemaText;
                if (cinemaText) {
                    document.querySelector('.cinemaModal-message').value = cinemaText
                    .replace(/\\n/g, '\n');
                }
                divCinemaModal.style.display = 'block';
            });
        });
    }
    divCinemaModalSubmit.addEventListener('click', function() {
        var cinemaMessage = document.querySelector('.cinemaModal-message');
        var cinemaRand = document.querySelector('.cinemaModal-rand');
        if (cinemaMessage && cinemaMessage.value && cinemaRand && cinemaRand.value) {
            var cinemaHttp = new XMLHttpRequest();
            cinemaHttp.open('POST', '/telegram/message', true);
            cinemaHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            cinemaHttp.onreadystatechange = function() {
                if(cinemaHttp.readyState === 4 && cinemaHttp.status === 200) {
                    var cinemaSuccess = JSON.parse(cinemaHttp.responseText);
                    if (cinemaSuccess && cinemaSuccess.color && cinemaSuccess.color === 'green') {
                        document.querySelector('.cinemaModal-message').value = '';
                        document.querySelector('.cinemaModal-rand').value = '';
                        document.querySelector('.cinemaModal-name')
                        .innerHTML = '<span style="color:' + cinemaSuccess.color + '">' + cinemaSuccess.message + '</span>';
                        setTimeout(function() {
                            divCinemaModal.style.display = 'none';
                        }, 2000);
                    } else if (cinemaSuccess && cinemaSuccess.color && cinemaSuccess.color === 'red') {
                        document.querySelector('.cinemaModal-name')
                        .innerHTML = '<span style="color:' + cinemaSuccess.color + '">' + cinemaSuccess.message + '</span>';
                    } else {
                        document.querySelector('.cinemaModal-name')
                        .innerHTML = '<span style="color:red">' + cinemaLang.error + '</span>';
                    }
                }
            }
            cinemaHttp.send('message=' + encodeURIComponent(cinemaMessage.value) + '&rand=' + cinemaRand.value);
        } else {
            if (!cinemaMessage || !cinemaMessage.value) {
                document.querySelector('.cinemaModal-name')
                .innerHTML = '<span style="color:red">' + cinemaLang.message + '</span>';
            }
            if (!cinemaRand || !cinemaRand.value) {
                document.querySelector('.cinemaModal-name')
                .innerHTML = '<span style="color:red">' + cinemaLang.rand + '</span>';
            }
        }
    });
    divCinemaModalClose.addEventListener('click', function() {
        divCinemaModal.style.display = 'none';
    });
    window.onclick = function(event) {
      if (event.target == divCinemaModal) {
        divCinemaModal.style.display = 'none';
      }
    }
</script>
*/
