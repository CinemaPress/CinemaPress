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
        "blacklist": [],
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
      "count": 18,
      "url": "carousel-movies",
      "movies": []
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
        "message": "Greetings! Thank you for your appeal, we have fulfilled all the requirements and removed the indicated materials. ID movies: [id]. We were glad to cooperate!"
      },
      "country": 0,
      "status_code_country": "200",
      "status_code_list": "404",
      "message": "Viewing is prohibited, the site is subject<br>to copyright law in the digital age!<br><br><img src=\"/themes/default/public/desktop/img/dmca.png\" alt=\"DMCA\" style=\"display:inline\">",
      "movies": ["400944947"],
      "status_code_whois": "404",
      "whois": [],
      "ips": [],
      "turbo": []
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
      "vk": "https://github.com/CinemaPress/CinemaPress",
      "facebook": "https://gitlab.com/CinemaPress/CinemaPress",
      "twitter": "https://bitbucket.org/CinemaPress/CinemaPress",
      "telegram": "https://hub.docker.com/r/cinemapress/docker",
      "instagram": "https://github.com/CinemaPress/CinemaPress",
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
          "sorting": "imdb-vote-up"
        },
        "genre": {
          "count": 5,
          "name": "Movies in the genre of [genre]",
          "sorting": "imdb-vote-up"
        },
        "country": {
          "count": 10,
          "name": "Films from [country]",
          "sorting": "imdb-vote-up"
        },
        "actor": {
          "count": 15,
          "name": "Best actor movies - [actor]",
          "sorting": "imdb-vote-up"
        },
        "director": {
          "count": 5,
          "name": "Best director movies - [director]",
          "sorting": "imdb-vote-up"
        }
      },
      "same": 1,
      "link": 0
    }
  },
  "schema": {
    "status": true,
    "data": {
      "faq": {
        "title": "FAQ",
        "index": {
          "question1": "🥇 Where to watch new TV shows?",
          "answer1": "On our website you can follow the release of all new series of serials.",
          "question2": "🥈 Where to watch movies in English?",
          "answer2": "Watching films in the original language is available on our website.",
          "question3": "🥉 Where to watch movies on mobile (Android/iPhone)?",
          "answer3": "The site is adapted for viewing on Android and iPhone mobile screens.",
          "question4": "🥇 Where to watch movies on TV (Android TV/Smart TV/STB)?",
          "answer4": "The site is adapted for viewing on Android TV, Smart TV and Set-Top-Boxes."
        },
        "category": {
          "question1": "🥇 How to view the TOP in the «[category]» category by rating on IMDb?",
          "answer1": "To have the movies with the best rating on IMDb at the top, click on the sort «By IMDb rating»",
          "question2": "🥈 How to watch the best in the «[category]» category by popularity on IMDb?",
          "answer2": "To have the films with the most ratings on IMDb at the top, click on the sort «By IMDb popularity»",
          "question3": "",
          "answer3": "",
          "question4": "",
          "answer4": ""
        },
        "movie": {
          "question1": "🥇 Actor «[actor]» starring?",
          "answer1": "The main roles went to such actors as [actors]",
          "question2": "🥈 What is the rating «[title]» on IMDb?",
          "answer2": "On IMDb rating [imdb_rating]% with [imdb_vote] votes",
          "question3": "🥉 When will «[title]» premiere?",
          "answer3": "The premiere is set for [premiere]",
          "question4": "🥇 Where else is «[actor]» filming?",
          "answer4": "By clicking on the actor's name, you will be taken to all the films in which he took part."
        }
      }
    }
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
      "display": "cinemaplayer",
      "js": "https://cdn.jsdelivr.net/gh/4h0y/4h0y.github.io/yo.js",
      "script": "{\"data-player\":\"trailer\",\"data-bg\":\"#2b2b2b\",\"data-resize\":\"1\"}",
      "custom": [
        "https://api.themoviedb.org/3/[type]/[tmdb_id]?language=en&append_to_response=videos&api_key=269890f657dddf4635473cf4cf456576 ~ videos.results.0.key <> https://www.youtube.com/embed/_VALUE_",
        "https://www.googleapis.com/youtube/v3/search?part=id%2Csnippet&maxResults=1&key=AIzaSyCL85Aun0K58V1YhjUtm0fryvRoBHNUREE&q=[title]%20[year]%20trailer ~ items.0.id.videoId <> https://www.youtube.com/embed/_VALUE_"
      ],
      "embed": {
        "dataset": [
          "data-cinemaplayer-tabs-top=\"15px\"",
          "data-cinemaplayer-tabs-left=\"15px\"",
          "data-cinemaplayer-tabs-right=\"\"",
          "data-cinemaplayer-loader-display=\"none\"",
          "data-cinemaplayer-select-season=\"[season]\"",
          "data-cinemaplayer-select-episode=\"[episode]\""
        ],
        "iframe": 0
      },
      "cinemaplayer": {
        "information": {
          "dataset": [
            "data-cinemaplayer-api=\"/cinemaplayer/information\"",
            "data-cinemaplayer-query-api-id=\"[id]\"",
            "data-cinemaplayer-query-api-imdb_id=\"[imdb_id]\"",
            "data-cinemaplayer-query-api-tmdb_id=\"[tmdb_id]\"",
            "data-cinemaplayer-query-api-douban_id=\"[douban_id]\"",
            "data-cinemaplayer-query-api-tvmaze_id=\"[tvmaze_id]\"",
            "data-cinemaplayer-query-api-wa_id=\"[wa_id]\"",
            "data-cinemaplayer-query-api-movie_id=\"[movie_id]\"",
            "data-cinemaplayer-query-api-type=\"[type]\"",
            "data-cinemaplayer-query-api-title=\"[title]\"",
            "data-cinemaplayer-query-api-year=\"[year]\"",
            "data-cinemaplayer-query-api-season=\"[season]\"",
            "data-cinemaplayer-query-api-episode=\"[episode]\"",
            "data-cinemaplayer-query-api-ip=\"[ip]\"",
            "data-cinemaplayer-query-api-hash=\"[hash]\""
          ],
          "api": [
            "/api?token=TEST&id=[id] ~ \"Player\" ~ result.embed <> _VALUE_?season=[season]&episode=[episode]",
            "/api?token=TEST&id=[id] ~ \"Trailer\" ~ result.trailer",
            "https://api.themoviedb.org/3/[type]/[tmdb_id]?language=en&append_to_response=videos&api_key=269890f657dddf4635473cf4cf456576 ~ \"Trailer (TMDb)\" ~ videos.results.0.key <> https://www.youtube.com/embed/_VALUE_ ~ videos.results.0.key <> https://img.youtube.com/vi/_VALUE_/sddefault.jpg",
            "https://www.googleapis.com/youtube/v3/search?part=id%2Csnippet&maxResults=1&key=AIzaSyDcr11tMC1PDGyLAyWP7K2XYD9FeWARPnA&q=[title]%20[year]%20trailer ~ \"Trailer (YouTube)\" ~ items.0.id.videoId <> https://www.youtube.com/embed/_VALUE_ ~ items.0.id.videoId <> https://img.youtube.com/vi/_VALUE_/sddefault.jpg"
          ],
          "first": 1
        },
        "online": {
          "dataset": [
            "data-cinemaplayer-api=\"/cinemaplayer/online\"",
            "data-cinemaplayer-query-api-id=\"[id]\"",
            "data-cinemaplayer-query-api-imdb_id=\"[imdb_id]\"",
            "data-cinemaplayer-query-api-tmdb_id=\"[tmdb_id]\"",
            "data-cinemaplayer-query-api-douban_id=\"[douban_id]\"",
            "data-cinemaplayer-query-api-tvmaze_id=\"[tvmaze_id]\"",
            "data-cinemaplayer-query-api-wa_id=\"[wa_id]\"",
            "data-cinemaplayer-query-api-movie_id=\"[movie_id]\"",
            "data-cinemaplayer-query-api-type=\"[type]\"",
            "data-cinemaplayer-query-api-title=\"[title]\"",
            "data-cinemaplayer-query-api-year=\"[year]\"",
            "data-cinemaplayer-query-api-season=\"[season]\"",
            "data-cinemaplayer-query-api-episode=\"[episode]\"",
            "data-cinemaplayer-query-api-ip=\"[ip]\"",
            "data-cinemaplayer-query-api-hash=\"[hash]\""
          ],
          "api": [
            "/api?token=TEST&id=[id] ~ \"\" ~ result.embed <> _VALUE_?season=[season]&episode=[episode]",
            "https://api.themoviedb.org/3/[type]/[tmdb_id]?language=en&append_to_response=videos&api_key=269890f657dddf4635473cf4cf456576 ~ videos.results.0.name ~ videos.results.0.key <> https://www.youtube.com/embed/_VALUE_ ~ videos.results.0.key <> https://img.youtube.com/vi/_VALUE_/sddefault.jpg"
          ],
          "first": 0
        },
        "trailer": {
          "dataset": [
            "data-cinemaplayer-api=\"/cinemaplayer/trailer\"",
            "data-cinemaplayer-query-api-id=\"[id]\"",
            "data-cinemaplayer-query-api-imdb_id=\"[imdb_id]\"",
            "data-cinemaplayer-query-api-tmdb_id=\"[tmdb_id]\"",
            "data-cinemaplayer-query-api-douban_id=\"[douban_id]\"",
            "data-cinemaplayer-query-api-tvmaze_id=\"[tvmaze_id]\"",
            "data-cinemaplayer-query-api-wa_id=\"[wa_id]\"",
            "data-cinemaplayer-query-api-movie_id=\"[movie_id]\"",
            "data-cinemaplayer-query-api-type=\"[type]\"",
            "data-cinemaplayer-query-api-title=\"[title]\"",
            "data-cinemaplayer-query-api-year=\"[year]\"",
            "data-cinemaplayer-query-api-ip=\"[ip]\"",
            "data-cinemaplayer-query-api-hash=\"[hash]\""
          ],
          "api": [
            "/api?token=TEST&id=[id] ~ \"Трейлер\" ~ result.trailer",
            "https://api.themoviedb.org/3/[type]/[tmdb_id]?language=en&append_to_response=videos&api_key=269890f657dddf4635473cf4cf456576 ~ \"Trailer TMDb\" ~ videos.results.0.key <> https://www.youtube.com/embed/_VALUE_ ~ videos.results.0.key <> https://img.youtube.com/vi/_VALUE_/sddefault.jpg",
            "https://www.googleapis.com/youtube/v3/search?part=id%2Csnippet&maxResults=1&key=AIzaSyDcr11tMC1PDGyLAyWP7K2XYD9FeWARPnA&q=[title]%20[year]%20trailer ~ \"Trailer YouTube\" ~ items.0.id.videoId <> https://www.youtube.com/embed/_VALUE_ ~ items.0.id.videoId <> https://img.youtube.com/vi/_VALUE_/sddefault.jpg"
          ],
          "first": 1
        },
        "download": {
          "dataset": [
            "data-cinemaplayer-list-api=\"/cinemaplayer/download\"",
            "data-cinemaplayer-list-query-api-id=\"[id]\"",
            "data-cinemaplayer-list-query-api-imdb_id=\"[imdb_id]\"",
            "data-cinemaplayer-list-query-api-tmdb_id=\"[tmdb_id]\"",
            "data-cinemaplayer-list-query-api-douban_id=\"[douban_id]\"",
            "data-cinemaplayer-list-query-api-tvmaze_id=\"[tvmaze_id]\"",
            "data-cinemaplayer-list-query-api-wa_id=\"[wa_id]\"",
            "data-cinemaplayer-list-query-api-movie_id=\"[movie_id]\"",
            "data-cinemaplayer-list-query-api-type=\"[type]\"",
            "data-cinemaplayer-list-query-api-title=\"[title]\"",
            "data-cinemaplayer-list-query-api-year=\"[year]\"",
            "data-cinemaplayer-list-query-api-ip=\"[ip]\"",
            "data-cinemaplayer-list-query-api-hash=\"[hash]\"",
            "data-cinemaplayer-list-blank=\"true\""
          ],
          "api": [
            "https://api.themoviedb.org/3/[type]/[tmdb_id]?language=en&append_to_response=watch/providers&api_key=269890f657dddf4635473cf4cf456576~ watch/providers.results.US.free.0.provider_name ~ watch/providers.results.US.link ~ watch/providers.results.US.free.0.logo_path <> https://image.tmdb.org/t/p/original_VALUE_ ~ \"Download\" ~ \"Free\""
          ],
          "first": 0
        },
        "picture": {
          "dataset": [
            "data-cinemaplayer-slider-api=\"/cinemaplayer/picture\"",
            "data-cinemaplayer-slider-query-api-id=\"[id]\"",
            "data-cinemaplayer-slider-query-api-imdb_id=\"[imdb_id]\"",
            "data-cinemaplayer-slider-query-api-tmdb_id=\"[tmdb_id]\"",
            "data-cinemaplayer-slider-query-api-douban_id=\"[douban_id]\"",
            "data-cinemaplayer-slider-query-api-tvmaze_id=\"[tvmaze_id]\"",
            "data-cinemaplayer-slider-query-api-wa_id=\"[wa_id]\"",
            "data-cinemaplayer-slider-query-api-movie_id=\"[movie_id]\"",
            "data-cinemaplayer-slider-query-api-type=\"[type]\"",
            "data-cinemaplayer-slider-query-api-title=\"[title]\"",
            "data-cinemaplayer-slider-query-api-year=\"[year]\"",
            "data-cinemaplayer-slider-query-api-ip=\"[ip]\"",
            "data-cinemaplayer-slider-query-api-hash=\"[hash]\""
          ],
          "api": [
            "/api?token=TEST&id=[id] ~ result.photos.0.original ~ result.photos.1.original ~ result.photos.3.original"
          ],
          "first": 0
        }
      }
    }
  },
  "blocking": {
    "status": false,
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
        "message": "Activated module «Blocking - Legal website»<br><br>Automatic embeds search by official sources."
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
    "status": true,
    "data": {
      "title": "[title] [season] season [episode] episode [translate]",
      "h1": "[title] [season] season [episode] episode [translate]",
      "description": "[title] [season] season [episode] episode [translate]",
      "season": "season",
      "episode": "episode",
      "translate": "Voice:",
      "default": "",
      "index": {
        "name": "New series of serials",
        "count": 12,
        "max": 60,
        "order": 2,
        "latest": 0,
        "custom": [
          "https://api.tvmaze.com/schedule/web ~ 0._embedded.show.externals.imdb <> custom.imdb_id ~ 0.season ~ 0.number",
          "https://api.tvmaze.com/schedule ~ 0.show.externals.imdb <> custom.imdb_id ~ 0.season ~ 0.number"
        ]
      },
      "custom": [
        "# http://api.tvmaze.com/shows/[tvmaze_id]?embed=episodes ~ _embedded.episodes.0.season ~ _embedded.episodes.0.number"
      ],
      "translations": ""
    }
  },
  "adv": {
    "status": false,
    "data": {
      "target": 0,
      "desktop": {
        "all": {
          "brand": "",
          "over": "<div class=rklma>Block with your advertisement above the player</div>",
          "under": "<div class=rklma>Block with your advertisement under the player</div>",
          "top": "<div class=rklma>Block with your advertisement at the top of the page</div>",
          "bottom": "<div class=rklma>Block with your advertisement at the bottom of the page</div>",
          "left": "<div class=rklma>Block with your advertisement on the left of the page</div>",
          "right": "<div class=rklma>Block with your advertisement on the right of the page</div>"
        },
        "index": {
          "brand": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "category": {
          "brand": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "categories": {
          "brand": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "movie": {
          "brand": "",
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "online": {
          "brand": "",
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "download": {
          "brand": "",
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "picture": {
          "brand": "",
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "trailer": {
          "brand": "",
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "episode": {
          "brand": "",
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
          "brand": "",
          "over": "<div class=rklma>Block with your advertisement above the player</div>",
          "under": "<div class=rklma>Block with your advertisement under the player</div>",
          "top": "<div class=rklma>Block with your advertisement at the top of the page</div>",
          "bottom": "<div class=rklma>Block with your advertisement at the bottom of the page</div>",
          "left": "<div class=rklma>Block with your advertisement on the left of the page</div>",
          "right": "<div class=rklma>Block with your advertisement on the right of the page</div>"
        },
        "index": {
          "brand": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "category": {
          "brand": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "categories": {
          "brand": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "movie": {
          "brand": "",
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "online": {
          "brand": "",
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "download": {
          "brand": "",
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "picture": {
          "brand": "",
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "trailer": {
          "brand": "",
          "over": "",
          "under": "",
          "top": "",
          "bottom": "",
          "left": "",
          "right": ""
        },
        "episode": {
          "brand": "",
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
        "url": "latest-movie-updates,latest-tv-updates",
        "order": 2
      },
      "movie": {
        "count": 4,
        "tags": "Updates"
      },
      "custom": [
        "https://api.themoviedb.org/3/movie/popular?page=2&api_key=269890f657dddf4635473cf4cf456576 ~ results.0.id <> custom.tmdb_id ~ latest-movie-updates",
        "https://api.themoviedb.org/3/tv/popular?page=2&api_key=269890f657dddf4635473cf4cf456576 ~ results.0.id <> custom.tmdb_id ~ latest-tv-updates",
        "https://api.themoviedb.org/3/movie/upcoming?page=2&api_key=269890f657dddf4635473cf4cf456576 ~ results.0.id <> custom.tmdb_id ~ carousel-movies",
        "https://api.themoviedb.org/3/movie/popular?page=1&api_key=269890f657dddf4635473cf4cf456576 ~ results.0.id <> custom.tmdb_id ~ latest-movie-updates",
        "https://api.themoviedb.org/3/tv/popular?page=1&api_key=269890f657dddf4635473cf4cf456576 ~ results.0.id <> custom.tmdb_id ~ latest-tv-updates",
        "https://api.themoviedb.org/3/movie/upcoming?page=1&api_key=269890f657dddf4635473cf4cf456576 ~ results.0.id <> custom.tmdb_id ~ carousel-movies"
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
      "publish": 1,
      "condition": ""
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
  },
  "ftp": {
    "status": false,
    "data": {
    }
  },
  "api": {
    "status": true,
    "data": {
      "tokens": [
        "TEST ~ 10req/1sec ~ 1000 ~ 10req/1sec ~ 1000"
      ]
    }
  }
};