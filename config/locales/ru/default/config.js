module.exports = {
  "database": {
    "key": "FREE",
    "date": ""
  },
  "protocol": "http://",
  "subdomain": "",
  "botdomain": "",
  "botdomains": "",
  "domain": "example.com",
  "bomain": "",
  "alt": {
    "botdomain": "",
    "bomain": ""
  },
  "ru": {
    "domain": "",
    "subdomain": "",
    "bomain": "",
    "botdomain": "",
    "random": 0
  },
  "rotate": {
    "list": [],
    "area": [ "domain.for.bots", "domain2.for.bots", "domain.for.ru.bots" ]
  },
  "dns": {
    "cloudflare": {
      "email": "",
      "key": "",
      "proxied": "true"
    }
  },
  "realtime": {
    "only_realtime": 0
  },
  "bots": [
    "google ~ googlebot.com,google.com ~ ~ Fake Google Bot!",
    "yandex. ~ yandex.ru,yandex.net,yandex.com ~ ~ Fake Yandex Bot!",
    "bing ~ search.msn.com ~ ~ Fake Bing Bot!",
    "yahoo ~ crawl.yahoo.net ~ ~ Fake Yahoo Bot!",
    "baidu ~ baidu.com,baidu.jp ~ ~ Fake Baidu Bot!",
    "duckduckgo ~ ~ 20.191.45.212,23.21.227.69,40.88.21.235,50.16.241.113,50.16.241.114,50.16.241.117,50.16.247.234,52.204.97.54,52.5.190.19,54.197.234.188,54.208.100.253,54.208.102.37,107.21.1.8 ~ Fake DuckDuckGo Bot!",
    "mail.ru ~ mail.ru ~ ~ Fake Mail Bot!"
  ],
  "user_bot": 0,
  "defense": {
    "domain": 2,
    "domain_key": 2,
    "domain_ex": [ "domain.for.people", "domain.for.ru.people", "domain.for.mobile", "domain.for.tv", "domain.for.app", "domain.for.ftp", "domain.for.www" ],
    "agent": 0,
    "message": "Мы заметили подозрительную активность, пожалуйста, пройдите проверку."
  },
  "blacklist": 0,
  "email": "support@example.com",
  "theme": "default",
  "country": "RU",
  "language": "ru",
  "random": 0,
  "homepage": "example.com",
  "redirect": {
    "from": [],
    "to": []
  },
  "geolite2": {
    "countries": ["Netherlands"],
    "ips": []
  },
  "image": {
    "save": 1
  },
  "cache": {
    "time": 3600,
    "ver": 0
  },
  "pagespeed": 0,
  "loadavg": {
    "one": 1200,
    "five": 960,
    "fifteen": 720,
    "message": "Сервер перегружен на [percent] пожалуйста зайдите позже."
  },
  "publish": {
    "start": 298,
    "stop": 10000000,
    "every" : {
      "hours": 0,
      "movies": 0
    },
    "text": 0,
    "required": [
      "poster",
      "title_ru"
    ],
    "thematic": {
      "type": "",
      "year": "",
      "genre": "",
      "country": "",
      "actor": "",
      "director": "",
      "query_id": "",
      "search": "",
      "kp_vote": 0,
      "imdb_vote": 0
    },
    "indexing": {
      "condition": ""
    }
  },
  "default": {
    "count": 15,
    "sorting": "imdb-vote-up",
    "sorting_search": "",
    "pages": 4,
    "lastpage": 0,
    "days": 0,
    "image": "/themes/default/public/desktop/img/player.png",
    "votes": {
      "kp": 5000,
      "imdb": 5000
    },
    "people_image": 0,
    "people_image_domain": "",
    "donotuse": ["actor","director","search"],
    "categories": {
      "countries": ["США","Россия","СССР","Индия","Франция","Япония","Великобритания","Испания","Италия","Канада"],
      "genres": ["аниме","биография","боевик","вестерн","военный","детектив","детский","документальный","драма","игра","история","комедия","концерт","короткометражка","криминал","мелодрама","музыка","мультфильм","мюзикл","новости","приключения","реальное ТВ","семейный","спорт","ток-шоу","триллер","ужасы","фантастика","фильм-нуар","фэнтези","церемония"],
      "years": ["2021","2020","2019","2018","2017","2016","2015","2014","2013","2012","2011"]
    },
    "types": {
      "movie": "!мультфильм !аниме !короткометражка !шоу !новости !реальное !церемония !концерт !детский !документальный",
      "serial": "!аниме !короткометражка",
      "mult": "мультфильм | детский !аниме !короткометражка",
      "multserial": "мультфильм | детский !аниме !короткометражка",
      "anime": "мультфильм | аниме",
      "anime_country": "Япония",
      "tv": "шоу | новости | реальное | церемония | концерт"
    },
    "moment": "DD MMM YYYY",
    "loc": 2000,
    "tag": 2000,
    "tags": {
      "list": ["year","genre"],
      "format": "[Type] [year] [genre] [country]"
    }
  },
  "movies": {
    "cron": [
      "1 ~ https://api.themoviedb.org/3/movie/popular?api_key=af6887753365e14160254ac7f4345dd2 ~ results.0.id ~ https://api.themoviedb.org/3/movie/[id]?language=ru&append_to_response=credits,external_ids&api_key=af6887753365e14160254ac7f4345dd2 ~ external_ids.imdb_id <> custom.imdb_id ~ \"movie\" <> type ~ backdrop_path <> pictures ~ poster_path <> poster ~ release_date <> premiere ~ title <> title_ru ~ original_title <> title_en ~ overview <> description ~ genres.0.name <> genre ~ credits.cast.0.name <> actor <> 5 ~ credits.crew.0.name <> director <> 5 <> job == Director ~ production_countries.0.iso_3166_1 <> country",
      "1 ~ https://api.themoviedb.org/3/tv/popular?api_key=af6887753365e14160254ac7f4345dd2 ~ results.0.id ~ https://api.themoviedb.org/3/tv/[id]?language=ru&append_to_response=credits,external_ids&api_key=af6887753365e14160254ac7f4345dd2 ~ external_ids.imdb_id <> custom.imdb_id ~ \"tv\" <> type ~ backdrop_path <> pictures ~ poster_path <> poster ~ first_air_date <> premiere ~ name <> title_ru ~ original_name <> title_en ~ overview <> description ~ genres.0.name <> genre ~ credits.cast.0.name <> actor <> 5 ~ credits.crew.0.name <> director <> 5 <> job == Director ~ origin_country.0 <> country",
      "1 ~ https://api.themoviedb.org/3/movie/upcoming?api_key=af6887753365e14160254ac7f4345dd2 ~ results.0.id ~ https://api.themoviedb.org/3/movie/[id]?language=ru&append_to_response=credits,external_ids&api_key=af6887753365e14160254ac7f4345dd2 ~ external_ids.imdb_id <> custom.imdb_id ~ \"movie\" <> type ~ backdrop_path <> pictures ~ poster_path <> poster ~ release_date <> premiere ~ title <> title_ru ~ original_title <> title_en ~ overview <> description ~ genres.0.name <> genre ~ credits.cast.0.name <> actor <> 5 ~ credits.crew.0.name <> director <> 5 <> job == Director ~ production_countries.0.iso_3166_1 <> country",
      "1 ~ https://api.tvmaze.com/schedule/web ~ 0._embedded.show.externals.imdb <> custom.imdb_id ~ https://api.themoviedb.org/3/find/[imdb_id]?language=ru&external_source=imdb_id&api_key=af6887753365e14160254ac7f4345dd2 ~ tv_results.0.name <> title_ru <> 1 ~ tv_results.0.original_name <> title_en <> 1 ~ tv_results.0.poster_path <> poster <> 1 ~ \"tv\" <> type",
      "1 ~ https://api.tvmaze.com/schedule ~ 0.show.externals.imdb <> custom.imdb_id ~ https://api.themoviedb.org/3/find/[imdb_id]?language=ru&external_source=imdb_id&api_key=af6887753365e14160254ac7f4345dd2 ~ tv_results.0.name <> title_ru <> 1 ~ tv_results.0.original_name <> title_en <> 1 ~ tv_results.0.poster_path <> poster <> 1 ~ \"tv\" <> type",
      "1 ~ lastmod_movie ~ custom.imdb_id ~ https://api.themoviedb.org/3/find/tt[imdb_id]?external_source=imdb_id&api_key=af6887753365e14160254ac7f4345dd2 ~ movie_results.0.id <> custom.tmdb_id <> 1",
      "1 ~ lastmod_tv ~ custom.imdb_id ~ https://api.themoviedb.org/3/find/tt[imdb_id]?external_source=imdb_id&api_key=af6887753365e14160254ac7f4345dd2 ~ tv_results.0.id <> custom.tmdb_id <> 1",
      "1 ~ lastmod_tv ~ custom.imdb_id ~ https://api.tvmaze.com/lookup/shows?imdb=tt[imdb_id] ~ id <> custom.tvmaze_id",
      "1 ~ lastmod_tv ~ custom.tmdb_id ~ https://api.themoviedb.org/3/tv/[id]?language=ru&append_to_response=credits,external_ids&api_key=af6887753365e14160254ac7f4345dd2 ~ external_ids.imdb_id <> custom.imdb_id ~ \"tv\" <> type ~ backdrop_path <> pictures ~ poster_path <> poster ~ first_air_date <> premiere ~ name <> title_ru ~ original_name <> title_en ~ overview <> description ~ genres.0.name <> genre ~ credits.cast.0.name <> actor <> 5 ~ credits.crew.0.name <> director <> 5 <> job == Director ~ origin_country.0 <> country",
      "1 ~ lastmod_movie ~ custom.tmdb_id ~ https://api.themoviedb.org/3/movie/[id]?language=ru&append_to_response=credits,external_ids&api_key=af6887753365e14160254ac7f4345dd2 ~ external_ids.imdb_id <> custom.imdb_id ~ \"movie\" <> type ~ backdrop_path <> pictures ~ poster_path <> poster ~ release_date <> premiere ~ title <> title_ru ~ original_title <> title_en ~ overview <> description ~ genres.0.name <> genre ~ credits.cast.0.name <> actor <> 5 ~ credits.crew.0.name <> director <> 5 <> job == Director ~ production_countries.0.iso_3166_1 <> country",
      "0 ~ https://api.themoviedb.org/3/movie/popular?api_key=af6887753365e14160254ac7f4345dd2&page=[page][30] ~ results.0.id ~ https://api.themoviedb.org/3/movie/[id]?language=ru&append_to_response=credits,external_ids&api_key=af6887753365e14160254ac7f4345dd2 ~ external_ids.imdb_id <> custom.imdb_id ~ \"movie\" <> type ~ backdrop_path <> pictures ~ poster_path <> poster ~ release_date <> premiere ~ title <> title_ru ~ original_title <> title_en ~ overview <> description ~ genres.0.name <> genre ~ credits.cast.0.name <> actor <> 5 ~ credits.crew.0.name <> director <> 5 <> job == Director ~ production_countries.0.iso_3166_1 <> country ~ vote_average <> rating ~ vote_count <> vote",
      "0 ~ https://api.themoviedb.org/3/tv/popular?api_key=af6887753365e14160254ac7f4345dd2&page=[page][30] ~ results.0.id ~ https://api.themoviedb.org/3/tv/[id]?language=ru&append_to_response=credits,external_ids&api_key=af6887753365e14160254ac7f4345dd2 ~ external_ids.imdb_id <> custom.imdb_id ~ \"tv\" <> type ~ backdrop_path <> pictures ~ poster_path <> poster ~ first_air_date <> premiere ~ name <> title_ru ~ original_name <> title_en ~ overview <> description ~ genres.0.name <> genre ~ credits.cast.0.name <> actor <> 5 ~ credits.crew.0.name <> director <> 5 <> job == Director ~ origin_country.0 <> country ~ vote_average <> rating ~ vote_count <> vote",
      "0 ~ lastmod_movie ~ custom.imdb_id ~ https://api.themoviedb.org/3/find/tt[imdb_id]?external_source=imdb_id&api_key=af6887753365e14160254ac7f4345dd2 ~ movie_results.0.id <> custom.tmdb_id <> 1",
      "0 ~ lastmod_tv ~ custom.imdb_id ~ https://api.themoviedb.org/3/find/tt[imdb_id]?external_source=imdb_id&api_key=af6887753365e14160254ac7f4345dd2 ~ tv_results.0.id <> custom.tmdb_id <> 1",
      "0 ~ lastmod_tv ~ custom.imdb_id ~ https://api.tvmaze.com/lookup/shows?imdb=tt[imdb_id] ~ id <> custom.tvmaze_id",
      "0 ~ https://datasets.imdbws.com/title.ratings.tsv.gz ~ ~ ~ tconst <> custom.imdb_id ~ averageRating <> imdb_rating ~ numVotes <> imdb_vote",
      "720 ~ https://datasets.imdbws.com/title.ratings.tsv.gz ~ ~ ~ tconst <> custom.imdb_id ~ averageRating <> imdb_rating ~ numVotes <> imdb_vote"
    ],
    "proxy": [],
    "cookies": "",
    "skip": []
  },
  "codes": {
    "head": "",
    "footer": "<script>window.lazyLoadOptions = {};</script>\n<script async src='https://cdn.jsdelivr.net/npm/vanilla-lazyload@17.3.0/dist/lazyload.min.js'></script>",
    "robots": "User-agent: *\nDisallow: /\nDisallow: /type/*/*\nDisallow: /type-*/*\nDisallow: /movie/*/*\nDisallow: /movie-*/*\nDisallow: /year/*/*\nDisallow: /year-*/*\nDisallow: /genre/*/*\nDisallow: /genre-*/*\nDisallow: /country/*/*\nDisallow: /country-*/*\nDisallow: /director/*/*\nDisallow: /director-*/*\nDisallow: /actor/*/*\nDisallow: /actor-*/*\nDisallow: /search\nDisallow: /*?sorting*\nDisallow: /*?tag*\nDisallow: /*?q*\nDisallow: /*?random*\nDisallow: /*?PageSpeed*\nDisallow: /*?desktop*\nDisallow: /*?year*\nDisallow: /*?genre*\nDisallow: /*?country*\nDisallow: /iframe\nDisallow: /noindex\nDisallow: /mobile-version/type/*/*\nDisallow: /mobile-version/type-*/*\nDisallow: /mobile-version/movie/*/*\nDisallow: /mobile-version/movie-*/*\nDisallow: /mobile-version/year/*/*\nDisallow: /mobile-version/year-*/*\nDisallow: /mobile-version/genre/*/*\nDisallow: /mobile-version/genre-*/*\nDisallow: /mobile-version/country/*/*\nDisallow: /mobile-version/country-*/*\nDisallow: /mobile-version/director/*/*\nDisallow: /mobile-version/director-*/*\nDisallow: /mobile-version/actor/*/*\nDisallow: /mobile-version/actor-*/*\nDisallow: /mobile-version/search\nDisallow: /mobile-version/*?sorting*\nDisallow: /mobile-version/*?tag*\nDisallow: /mobile-version/*?q*\nDisallow: /mobile-version/*?random*\nDisallow: /mobile-version/*?PageSpeed*\nDisallow: /mobile-version/*?desktop*\nDisallow: /mobile-version/*?year*\nDisallow: /mobile-version/*?genre*\nDisallow: /mobile-version/*?country*\nDisallow: /mobile-version/iframe\nDisallow: /mobile-version/noindex\nDisallow: /tv-version\nDisallow: /admin*"
  },
  "index": {
    "type": {
      "name": "Лучшие [type]",
      "keys": "",
      "sorting": "imdb-rating-up",
      "count": 15,
      "order": 2
    },
    "year": {
      "name": "Фильмы [year] года",
      "keys": "2020",
      "sorting": "premiere-up",
      "count": 15,
      "order": 3
    },
    "genre": {
      "name": "Фильмы в жанре [genre]",
      "keys": "",
      "sorting": "imdb-vote-up",
      "count": 10,
      "order": 4
    },
    "country": {
      "name": "Фильмы из страны [country]",
      "keys": "",
      "sorting": "imdb-rating-up",
      "count": 10,
      "order": 5
    },
    "actor": {
      "name": "Лучшие фильмы [actor]",
      "keys": "",
      "sorting": "imdb-vote-up",
      "count": 10,
      "order": 6
    },
    "director": {
      "name": "Лучшие фильмы [director]",
      "keys": "",
      "sorting": "imdb-vote-up",
      "count": 10,
      "order": 7
    },
    "ids": {
      "name": "Новые фильмы",
      "keys": "",
      "count": 10,
      "order": 1
    },
    "count": {
      "type": "year",
      "key": "2020",
      "sorting": "premiere-up"
    },
    "link": 0
  },
  "titles": {
    "index": "Информационный каталог фильмов",
    "year" : "Фильмы [year] года [sorting] [page]",
    "years" : "Фильмы по годам",
    "genre": "Фильмы в жанре [genre] [sorting] [page]",
    "genres" : "Фильмы по жанрам",
    "country": "Фильмы из страны [country] [sorting] [page]",
    "countries": "Фильмы по странам",
    "actor": "Фильмы с участием [actor] [sorting] [page]",
    "actors": "Самые популярные актеры",
    "director": "Фильмы которые срежиссировал [director] [sorting] [page]",
    "directors": "Самые популярные режиссеры",
    "type": "[Type] [year] [genre] [country] [sorting] [page]",
    "search": "(X) { [Type] +? [year] +? [Genre] +? [Country] +? [sorting] [page] }\n(default) { Поиск фильма «[search]» [sorting] [page] }",
    "num": "на странице [num]",
    "movie": {
      "movie": "(фильмы) { Фильм «[title]» }\n(сериалы) { Сериал «[title]» }\n(мультфильмы) { Мультфильм «[title]» }\n(мультсериалы) { Мультсериал «[title]» }\n(аниме) { Аниме «[title]» }\n(передачи) { ТВ-передача «[title]» }\n(default) { «[title]» }",
      "online": "[title] онлайн",
      "download": "[title] скачать",
      "trailer": "[title] трейлер",
      "picture": "[title] кадры"
    },
    "sorting": {
      "kinopoisk-rating-up": "отсортировано по рейтингу КиноПоиска",
      "kinopoisk-rating-down": "отсортировано по рейтингу КиноПоиска",
      "imdb-rating-up": "отсортировано по рейтингу IMDb",
      "imdb-rating-down": "отсортировано по рейтингу IMDb",
      "kinopoisk-vote-up": "отсортировано по популярности на КиноПоиске",
      "kinopoisk-vote-down": "отсортировано по популярности на КиноПоиске",
      "imdb-vote-up": "отсортировано по популярности на IMDb",
      "imdb-vote-down": "отсортировано по популярности на IMDb",
      "year-up": "отсортировано по году",
      "year-down": "отсортировано по году",
      "premiere-up": "отсортировано по дате премьеры",
      "premiere-down": "отсортировано по дате премьеры"
    }
  },
  "h1": {
    "index": "Все фильмы в мире",
    "year" : "Фильмы [year] года [sorting] [page]",
    "years" : "Фильмы по годам",
    "genre": "Фильмы в жанре [genre] [sorting] [page]",
    "genres" : "Фильмы по жанрам",
    "country": "Фильмы из страны [country] [sorting] [page]",
    "countries": "Фильмы по странам",
    "actor": "Фильмы с участием [actor] [sorting] [page]",
    "actors": "Самые популярные актеры",
    "director": "Фильмы которые срежиссировал [director] [sorting] [page]",
    "directors": "Самые популярные режиссеры",
    "type": "[Type] [year] [genre] [country] [sorting] [page]",
    "search": "(X) { [Type] +? [year] +? [Genre] +? [Country] +? [sorting] [page] }\n(default) { Поиск фильма «[search]» [sorting] [page] }",
    "num": "на странице [num]",
    "movie": {
      "movie": "[title]",
      "online": "[title] [year] онлайн",
      "download": "[title] [year] скачать",
      "trailer": "[title] [year] трейлер",
      "picture": "[title] [year] кадры"
    },
    "sorting": {
      "kinopoisk-rating-up": "отсортировано по рейтингу КиноПоиска",
      "kinopoisk-rating-down": "отсортировано по рейтингу КиноПоиска",
      "imdb-rating-up": "отсортировано по рейтингу IMDb",
      "imdb-rating-down": "отсортировано по рейтингу IMDb",
      "kinopoisk-vote-up": "отсортировано по популярности на КиноПоиске",
      "kinopoisk-vote-down": "отсортировано по популярности на КиноПоиске",
      "imdb-vote-up": "отсортировано по популярности на IMDb",
      "imdb-vote-down": "отсортировано по популярности на IMDb",
      "year-up": "отсортировано по году",
      "year-down": "отсортировано по году",
      "premiere-up": "отсортировано по дате премьеры",
      "premiere-down": "отсортировано по дате премьеры"
    }
  },
  "descriptions": {
    "index": "Сколько фильмов Вам удалось посмотреть на данный момент? Вероятней всего, довольно много, несколько сотен, а может и тысяч, если Вы заядлый киноман и не представляете себе вечер, без просмотра одного или нескольких кинолент. Либо Вы возможно очень любите сериалы и вечера проводите за просмотром нескольких серий увлекательного сериала. Как бы там ни было, Мы очень рады что Вы выбрали Наш сайт, как площадку для обсуждения и дискуссий с такими же кинолюбителями, как и Вы. Усаживайтесь поудобней, заварите чаю и да начнётся <span style='text-decoration:line-through'>срач</span> критика :)",
    "year" : "Фильмы [year] года",
    "years" : "Фильмы по годам",
    "genre": "Фильмы в жанре [genre]",
    "genres" : "Фильмы по жанрам",
    "country": "Фильмы из страны [country]",
    "countries": "Фильмы по странам",
    "actor": "Фильмы с участием [actor]",
    "actors": "Самые популярные актеры",
    "director": "Фильмы которые срежиссировал [director]",
    "directors": "Самые популярные режиссеры",
    "type": "[Type] [year] [genre] [country]",
    "search" : "(X) { [Type] +? [year] +? [Genre] +? [Country] }\n(default) { Поиск фильма «[search]» }",
    "movie": {
      "movie": "Картина «[title]» была выпущена в [year] году и сразу завоевала внимание зрителей в разных [уголках Земли|частях планеты]. Киноленты из жанра [genre] всегда пользовались особой популярностью, к тому же, когда их снимают такие именитые режиссеры, как [director]. Страна, которая приложила руку к этому кинопроизведению считается [country], потому зрители уже могут приблизительно представить уровень [красочности|логики|картинки|искусства] по аналогичным творениям.",
      "online": "[title] онлайн",
      "download": "[title] скачать",
      "trailer": "[title] трейлер",
      "picture": "[title] кадры"
    }
  },
  "sorting": {
    "kinopoisk-rating-up": "По рейтингу КП ⬆",
    "kinopoisk-rating-down": "По рейтингу КП ⬇",
    "imdb-rating-up": "По рейтингу IMDb ⬆",
    "imdb-rating-down": "По рейтингу IMDb ⬇",
    "kinopoisk-vote-up": "По популярности КП ⬆",
    "kinopoisk-vote-down": "По популярности КП ⬇",
    "imdb-vote-up": "По популярности IMDb ⬆",
    "imdb-vote-down": "По популярности IMDb ⬇",
    "year-up": "По году ⬆",
    "year-down": "По году ⬇",
    "premiere-up": "По дате премьеры ⬆",
    "premiere-down": "По дате премьеры ⬇"
  },
  "urls": {
    "prefix_id": "id",
    "unique_id": 0,
    "separator": "-",
    "translit": 0,
    "movie_url": "[prefix_id][separator][title]",
    "movie": "movie",
    "year" : "year",
    "genre": "genre",
    "country": "country",
    "actor": "actor",
    "director": "director",
    "type": "type",
    "search" : "search",
    "sitemap" : "sitemap",
    "admin": "admin-secret",
    "types": {
      "serial": "сериалы",
      "movie": "фильмы",
      "mult": "мультфильмы",
      "multserial": "мультсериалы",
      "tv": "передачи",
      "anime": "аниме"
    },
    "movies": {
      "online": "",
      "download": "",
      "trailer": "",
      "picture": ""
    },
    "noindex": "noindex",
    "slash": "/"
  },
  "l": {
    "more": "Подробнее",
    "home": "Главная",
    "information": "Информация",
    "online": "Онлайн",
    "download": "Скачать",
    "trailer": "Трейлер",
    "picture": "Кадры",
    "episode": "Серия",
    "movies": "Фильмы",
    "series": "Сериалы",
    "cartoons": "Мультфильмы",
    "animated": "Мультсериалы",
    "tv": "ТВ",
    "anime": "Аниме",
    "collection": "Коллекция",
    "collections": "Коллекции",
    "season": "Сезон",
    "year": "Год",
    "years": "Годы",
    "genre": "Жанр",
    "genres": "Жанры",
    "actor": "Актер",
    "actors": "Актеры",
    "director": "Режиссер",
    "directors": "Режиссеры",
    "country": "Страна",
    "countries": "Страны",
    "quality": "Качество",
    "translate": "Перевод",
    "premiere": "Премьера",
    "rating": "Рейтинг",
    "kp": "КиноПоиск",
    "imdb": "IMDb",
    "episodes": "серии",
    "storyline": "Описание",
    "later": "Досмотреть позже",
    "continue": "Продолжить",
    "saved": "Сохранено",
    "allCategories": "Все категории",
    "allYears": "Все годы",
    "allGenres": "Все жанры",
    "allCountries": "Все страны",
    "allActors": "Все актеры",
    "allDirectors": "Все режиссеры",
    "watched": "Вы недавно смотрели",
    "search": "Поиск",
    "share": "Поделиться",
    "subscribe": "Подписаться",
    "vk": "ВКонтакте",
    "facebook": "facebook",
    "twitter": "Twitter",
    "google": "Google",
    "telegram": "Telegram",
    "youtube": "YouTube",
    "instagram": "Instagram",
    "up": "Вверх",
    "soon": "Скоро выйдут",
    "contacts": "Контакты",
    "news": "Новости",
    "menu": "Меню",
    "comments": "Комментарии",
    "movieTitle": "Название фильма",
    "votes": "голосов",
    "hide": "Скрыть",
    "navigation": "Навигация",
    "and": "и",
    "overall": "Общий",
    "premieres": "Премьеры",
    "popular": "Популярные",
    "top": "Топ",
    "sorting": "Сортировка",
    "tags": "Теги",
    "mentions": "Упоминания",
    "said": "сказал(а)",
    "full": "Полная версия",
    "original": "Оригинал",
    "submit": "Отправить",
    "like": "Нравится",
    "dislike": "Не нравится",
    "reply": "Ответить",
    "bold": "жирный",
    "italic": "курсив",
    "spoiler": "спойлер",
    "username": "Имя пользователя",
    "yes": "Да",
    "not": "Нет",
    "comment": "Комментировать...",
    "notFound": "Данной страницы нет на сайте. Возможно Вы ошиблись в URL или это внутренняя ошибка сайта, о которой администратор уже знает и предпринимает действия для её устранения.",
    "notMobile": "Мобильная версия сайта не активирована. Сайт адаптируется под экран и одинаково прекрасно отображается, как на больших экранах, так и на мобильных устройствах под управлением iOS, Android или WindowsPhone.",
    "notTv": "ТВ версия сайта не активирована.",
    "lucky": "Мне повезет!",
    "random": "Случайный фильм из категории",
    "results": "Все результаты",
    "moreEpisodes": "показать еще серии",
    "downloading": "Скачать",
    "safety": "Безопасно",
    "instruction": "Инструкция",
    "legal": "Изображения/видео могут быть защищены авторским правом. Подробнее…",
    "reset": "Сбросить",
    "filter": "Фильтр"
  }
};