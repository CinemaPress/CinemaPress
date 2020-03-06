module.exports = {
  "comments": {
    "status": true,
    "data": {
      "cackle": {
        "id": "",
        "siteApiKey": "",
        "accountApiKey": ""
      },
      "hypercomments": {
        "widget_id": "",
        "sekretkey": "",
        "recent": {
          "num_items": 0,
          "excerpt_length": 250,
          "display": []
        }
      },
      "disqus": {
        "shortname": "",
        "api_key": "",
        "recent": {
          "num_items": 0,
          "excerpt_length": 250,
          "hide_avatars": 0,
          "display": []
        }
      },
      "facebook": {
        "admins": ""
      },
      "vk": {
        "app_id": ""
      },
      "sigcomments": {
        "host_id": ""
      },
      "fast": {
        "active": 1,
        "premoderate": 1,
        "star_rating": 1,
        "per_page": 50,
        "sorting_page": "comment-publish-up",
        "url_links": 0,
        "url_links_text": "Forbidden to insert links",
        "bb_codes": 1,
        "bb_codes_text": "Forbidden to insert BB-codes",
        "html_tags": 0,
        "html_tags_text": "Forbidden to insert HTML-tags",
        "min_symbols": 100,
        "min_symbols_text": "Write at least [num] more characters",
        "recaptcha_secret": "",
        "recaptcha_sitekey": "",
        "recaptcha_score": 20,
        "recaptcha_text": "Google considers you a robot, change IP",
        "message": "Thank you for your comment, it will appear on the website within an hour.",
        "question": "Let me ask you a question, did you watch the movie [title]?",
        "question_yes": "Great, we really appreciate your feedback. Could you write a comment on the [url] page. For this, we will add any film or series of the series that you ask.",
        "question_not": "Great, when you have time, check out [url]. You should like it!",
        "stopworls": [],
        "recent": {
          "num_items": 5,
          "excerpt_length": 250,
          "hide_avatars": 0,
          "display": [
            "index","movie"
          ]
        }
      }
    }
  },
  "slider": {
    "status": true,
    "data": {
      "count": 0,
      "url": "",
      "movies": ["1047883","460586","843650","843859","840372","916498","1008445","1009536","1007049","994864","1005878","846824","706655","489414","843649","961715","924311","935940","926540","839650","840829","843479","843790"]
    }
  },
  "abuse": {
    "status": true,
    "data": {
      "imap": {
        "user": "",
        "password": "",
        "host": "",
        "port": 993,
        "tls": 1,
        "from": [],
        "subdomain": 0
      },
      "smtp": {
        "host": "",
        "port": 465,
        "secure": 1,
        "auth": {
          "user": "",
          "pass": ""
        },
        "dkim": "",
        "message": "Greetings! Thank you for your appeal, we have fulfilled all the requirements and removed the indicated materials. We were glad to cooperate!"
      },
      "country": 0,
      "status_code_country": "200",
      "status_code_list": "404",
      "message": "Viewing is prohibited, the site is subject<br>to copyright law in the digital age!<br><br><img src=\"/themes/default/public/desktop/img/dmca.png\" alt=\"DMCA\" style=\"display:inline\">",
      "movies": ["840372"]
    }
  },
  "top": {
    "status": true,
    "data": {
      "sorting": "imdb-vote-up",
      "count": 15
    }
  },
  "soon": {
    "status": true,
    "data": {
      "count": 2,
      "movies": []
    }
  },
  "social": {
    "status": false,
    "data": {
      "vk": "https://vk.com/CinemaPress",
      "facebook": "https://www.facebook.com/CinemaPress.org",
      "twitter": "https://twitter.com/CinemaPress_org",
      "telegram": "https://t.me/CinemaPress_org",
      "instagram": "https://www.instagram.com/CinemaPressOrg",
      "youtube": "https://www.youtube.com/CinemaPressOrg"
    }
  },
  "related": {
    "status": true,
    "data": {
      "display": [
        "year"
      ],
      "types": {
        "year": {
          "count": 6,
          "name": "[year] Movies",
          "sorting": "kinopoisk-vote-up"
        },
        "genre": {
          "count": 5,
          "name": "Movies in the genre of [genre]",
          "sorting": "kinopoisk-vote-up"
        },
        "country": {
          "count": 10,
          "name": "Films from [country]",
          "sorting": "kinopoisk-vote-up"
        },
        "actor": {
          "count": 15,
          "name": "Best actor movies - [actor]",
          "sorting": "kinopoisk-vote-up"
        },
        "director": {
          "count": 5,
          "name": "Best director movies - [director]",
          "sorting": "kinopoisk-vote-up"
        }
      },
      "same": 1,
      "link": 0
    }
  },
  "schema": {
    "status": false
  },
  "continue": {
    "status": true
  },
  "viewed": {
    "status": true,
    "data": {
      "count": 20,
      "width": "100px",
      "height": "140px"
    }
  },
  "player": {
    "status": true,
    "data": {
      "display": "script",
      "script": "{\"data-player\":\"videocdn,bazon,collaps,ustore,alloha,hdvb,iframe,kodik,trailer\",\"data-bg\":\"#2b2b2b\",\"data-videocdn\":\"\",\"data-bazon\":\"\",\"data-collaps\":\"\",\"data-ustore\":\"\",\"data-alloha\":\"\",\"data-hdvb\":\"\",\"data-iframe\":\"\",\"data-kodik\":\"\",\"data-youtube\":\"\",\"data-resize\":\"1\"}",
      "custom": [
        "https://iframe.video/api/v2/search?kp=[kp_id] ~ results.0.path",
        "# https://videocdn.tv/api/short?api_token=TOKEN&kinopoisk_id=[kp_id] ~ data.0.iframe_src",
        "# https://apicollaps.cc/list?token=TOKEN&kinopoisk_id=[kp_id] ~ results.0.iframe_url",
        "# https://kodikapi.com/search?token=TOKEN&kinopoisk_id=[kp_id] ~ results.0.link"
      ]
    }
  },
  "blocking": {
    "status": true,
    "data": {
      "display": "legal",
      "share": {
        "time": 60,
        "message": "Share the movie page on one of the social networks."
      },
      "sub": {
        "keys": ["CP06368342850052267","CP10020891099182505","CP46955642915431706"],
        "message": "Viewing is available only by subscription. Get a subscription and activate the key. <p style=\"margin:20px auto 0 auto\"><a href=\"https://digiseller.ru/\" target=\"_blank\" style=\"color:white;background:#16494e;border-radius: 5px;padding: 10px;\">Buy subscription</a></p>"
      },
      "adv": {
        "time": 10,
        "message": "<iframe src=\"https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1\" allow=\"autoplay; encrypted-media\" allowfullscreen style=\"width:100%;height:370px;border:0\"></iframe>",
        "skip": "Continue"
      },
      "adblock": {
        "time": 60,
        "message": "You are using AdBlock, please disable it and you won’t have to wait any longer."
      },
      "legal": {
        "time": 20,
        "countries": [],
        "message": "The function of the movie information catalog has been activated. To display the player, <a href=\"/admin-secret/blocking\" target=\"_blank\" style=\"color:white;\">disable the «Blocking» module in the admin panel</a>."
      },
      "app": {
        "download": {
          "windows": "",
          "macos": "",
          "linux": ""
        },
        "safe": {
          "windows": "",
          "macos": "",
          "linux": ""
        },
        "instruction": {
          "windows": "",
          "macos": "",
          "linux": ""
        },
        "time": 0,
        "countries": [],
        "abuse": 0,
        "message": "The player is available only in our official app.<br><br>WITHOUT installation, only download, unzip and run."
      }
    }
  },
  "mobile": {
    "status": false,
    "data": {
      "theme": "custom",
      "custom": {
        "a": "#99AABB",
        "hover": "#FFFFFF",
        "body_color": "#FFFFFF",
        "body_bg": "#14181C",
        "title_color": "#FFFFFF",
        "title_bg": "#445566",
        "description_color": "#FFFFFF",
        "description_bg": "#242D35",
        "block": "#2C3641",
        "form": "#2C3641",
        "btn_color": "#FFFFFF",
        "btn_bg": "#14181C"
      },
      "subdomain": 0
    }
  },
  "episode": {
    "status": false,
    "data": {
      "title": "[title] [season] season [episode] episode [translate]",
      "h1": "[title] [season] season [episode] episode [translate]",
      "description": "[title] [season] season [episode] episode [translate]",
      "season": "season",
      "episode": "episode",
      "translate": "Voice:",
      "default": "Original",
      "source": "iframe",
      "index": {
        "name": "New series of serials",
        "count": 12,
        "order": 2,
        "latest": 0,
        "custom": [
          "# https://iframe.video/api/v2/updates?limit=99&type=serial&api_token=TOKEN ~ results.0.kinopoisk_id ~ results.0.added.0.SxEx <> <> <> S([0-9]{1,3})E[0-9]{1,3} ~ results.0.added.0.SxEx <> <> <> S[0-9]{1,3}E([0-9]{1,3}) ~ results.0.added.0.translator"
        ]
      },
      "custom": [
        "# https://iframe.video/api/v2/serials?&include=seasons%2Ctranslate&api_token=TOKEN&kp=[kp_id] ~ results.0.seasons.0.season_num ~ results.0.seasons.0.episodes.0 ~ results.0.seasons.0.translate"
      ]
    }
  },
  "adv": {
    "status": false,
    "data": {
      "target": 0,
      "desktop": {
        "all": {
          "over": "<div class=rklma>Block with your advertisement above the player</div>",
          "under": "<div class=rklma>Block with your advertisement under the player</div>",
          "top": "<div class=rklma>Block with your advertisement at the top of the page</div>",
          "bottom": "<div class=rklma>Block with your advertisement at the bottom of the page</div>",
          "left": "<div class=rklma>Block with your advertisement on the left of the page</div>",
          "right": "<div class=rklma>Block with your advertisement on the right of the page</div>"
        },
        "index": {
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "category": {
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "categories": {
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "movie": {
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "online": {
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "download": {
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "picture": {
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "trailer": {
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "episode": {
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        }
      },
      "mobile": {
        "all": {
          "over": "<div class=rklma>Block with your advertisement above the player</div>",
          "under": "<div class=rklma>Block with your advertisement under the player</div>",
          "top": "<div class=rklma>Block with your advertisement at the top of the page</div>",
          "bottom": "<div class=rklma>Block with your advertisement at the bottom of the page</div>",
          "left": "<div class=rklma>Block with your advertisement on the left of the page</div>",
          "right": "<div class=rklma>Block with your advertisement on the right of the page</div>"
        },
        "index": {
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "category": {
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "categories": {
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "movie": {
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "online": {
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "download": {
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "picture": {
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "trailer": {
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "episode": {
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        }
      }
    }
  },
  "content": {
    "status": true,
    "data": {
      "title": "Site pages",
      "h1": "Site pages",
      "description": "Site pages",
      "url": "content",
      "news": {
        "count": 2,
        "tags": "News"
      },
      "index": {
        "count": 12,
        "url": "latest-movie-updates",
        "order": 2
      },
      "movie": {
        "count": 4,
        "tags": "Updates"
      },
      "custom": [
        "# https://iframe.video/api/v2/movies?limit=99&api_token=TOKEN ~ results.0.kinopoisk_id ~ poslednie-obnovleniya-filmov"
      ],
      "scraper": ""
    }
  },
  "rss": {
    "status": false
  },
  "rewrite": {
    "status": false,
    "data": {
      "token": "",
      "double": 1,
      "unique": 0,
      "publish": 1
    }
  },
  "voting": {
    "status": false
  },
  "bots": {
    "status": false,
    "data": {
      "token": ""
    }
  },
  "tv": {
    "status": false,
    "data": {
      "theme": "default",
      "custom": {
        "body_bg": "#000000",
        "contents_color": "#FFFFFF",
        "contents_active_bg": "#000000",
        "categories_color": "#FFFFFF",
        "categories_current_bg": "#22454c",
        "categories_active_bg": "#2af8ff"
      },
      "subdomain": 0
    }
  },
  "random": {
    "status": true,
    "data": {
      "category": ["year","country","genre","type","content"],
      "menu": "latest-movie-updates",
      "index": 1,
      "related": 1,
      "count": 200,
      "sorting": "imdb-vote-up"
    }
  },
  "app": {
    "status": false,
    "data": {
    }
  }
};