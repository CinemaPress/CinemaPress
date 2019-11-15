// ==UserScript==
// @name cinemapress
// @name:ru синемапресс
// @name:zh cinemapress
// @description Button auto-complete movie information in CinemaPress.
// @description:ru Кнопка автозаполнения информации о фильме в CinemaPress.
// @description:zh CinemaPress电影信息自动完成按钮。
// @author CinemaPress
// @homepageURL https://cinemapress.io/
// @supportURL https://enota.club/
// @icon https://avatars3.githubusercontent.com/u/16612433?s=200
// @license MIT
// @version 2019.11
// @run-at document-end
// @include http://*/*/movies?id=*
// @include https://*/*/movies?id=*
// @include http://*/*/movies?kp_id=*
// @include https://*/*/movies?kp_id=*
// @include http://*/*/movies?tmdb_id=*
// @include https://*/*/movies?tmdb_id=*
// @include http://*/*/movies?imdb_id=*
// @include https://*/*/movies?imdb_id=*
// @include http://*/*/movies?douban_id=*
// @include https://*/*/movies?douban_id=*
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_xmlhttpRequest
// ==/UserScript==

autoComplete();

var omdb = getCookie('omdb');
var tmdb = getCookie('tmdb');

if (!omdb) inputOMDb();
if (!tmdb) inputTMDb();

var urls = [];

function parseData() {
  var movieData = {};

  var icon = document.querySelector('.autoComplete > strong');
  var text = document.querySelector('.autoComplete > span');
  var lang = document.querySelector('[name="lang"]')
    ? document.querySelector('[name="lang"]').value
    : 'en';

  icon.setAttribute('class', 'fa fa-spinner fa-spin');

  tmdb = tmdb
    ? tmdb
    : document.querySelector('[name="tmdb"]')
      ? document.querySelector('[name="tmdb"]').value
      : '';
  if (tmdb) setCookie('tmdb', tmdb, { expires: 3600000 });

  omdb = omdb
    ? omdb
    : document.querySelector('[name="omdb"]')
      ? document.querySelector('[name="omdb"]').value
      : '';
  if (omdb) setCookie('omdb', omdb, { expires: 3600000 });

  var src = document.querySelector('[data-poster="src"]');

  var type = document.querySelector('[name="movie.type"]')
    ? document.querySelector('[name="movie.type"]').options[
        document.querySelector('[name="movie.type"]').selectedIndex
      ].value
    : '';

  var kp_id = document.querySelector('[name="movie.kp_id"]')
    ? document.querySelector('[name="movie.kp_id"]').value
    : '';
  var tmdb_id = document.querySelector('[name="movie.tmdb_id"]')
    ? document.querySelector('[name="movie.tmdb_id"]').value
    : '';
  var imdb_id = document.querySelector('[name="movie.imdb_id"]')
    ? document.querySelector('[name="movie.imdb_id"]').value
    : '';
  var douban_id = document.querySelector('[name="movie.douban_id"]')
    ? document.querySelector('[name="movie.douban_id"]').value
    : '';

  if (!kp_id && !tmdb_id && !douban_id && !imdb_id) {
    icon.setAttribute('class', 'fa fa-bug');
    text.innerHTML = 'IDs not filled!';
    return;
  }

  if ((!tmdb && tmdb_id) || (!omdb && imdb_id)) {
    icon.setAttribute('class', 'fa fa-bug');
    text.innerHTML = 'API keys not filled!';
    return;
  }

  if (kp_id && (lang === 'ru' || (!imdb_id && !tmdb_id && !douban_id))) {
    urls.push(
      'https://api1573848848.apicollaps.cc/franchise/details?' +
        'token=6006bca37f7681fe1edf75fcf936aecc&' +
        'kinopoisk_id=' +
        '' +
        kp_id
    );
  }
  if (douban_id && (lang === 'zh' || (!imdb_id && !tmdb_id && !kp_id))) {
    urls.push('https://api.douban.com/v2/movie/subject/' + '' + douban_id);
    urls.push('https://movie.douban.com/subject/' + '' + douban_id);
  }
  if (tmdb && tmdb_id) {
    urls.push(
      'https://api.themoviedb.org/3/' +
        (type === '1' ? 'tv' : 'movie') +
        '/' +
        tmdb_id +
        '?' +
        'language=' +
        lang +
        '&' +
        'append_to_response=credits&' +
        'api_key=' +
        tmdb
    );
  }
  if (omdb && imdb_id) {
    urls.push(
      'https://www.omdbapi.com/?' + 'i=tt' + imdb_id + '&' + 'apikey=' + omdb
    );
  }
  if (kp_id && lang !== 'ru') {
    urls.push(
      'https://api1573848848.apicollaps.cc/franchise/details?' +
        'token=6006bca37f7681fe1edf75fcf936aecc&' +
        'kinopoisk_id=' +
        '' +
        kp_id
    );
  }
  if (douban_id && lang !== 'zh') {
    urls.push('https://movie.douban.com/subject/' + '' + douban_id);
  }

  function api() {
    var url = urls.length ? urls.shift() : undefined;
    if (url) {
      getAPI(url, function(err, res) {
        for (var r in res) {
          if (res.hasOwnProperty(r)) {
            if (lang !== 'ru' && (r === 'translate' || r === 'quality')) {
              continue;
            }
            movieData[r] = movieData[r] ? movieData[r] : res[r];
            if (
              url.indexOf('omdbapi.com') + 1 &&
              (r === 'imdb_rating' || r === 'imdb_vote')
            ) {
              movieData[r] = res[r];
            }
          }
        }
        api();
      });
    } else {
      if (!movieData.title_ru && !movieData.title_en) {
        icon.setAttribute('class', 'fa fa-bug');
        text.innerHTML = 'No information!';
        console.log(movieData);
        return;
      }

      movieData.country = movieData.country
        ? movieData.country.replace(
            /(The United States of America|United States of America|United States|^US$|^US,|,US$)/gi,
            'USA'
          )
        : '';

      if (movieData.title_ru) {
        document.querySelector('[name="movie.title_ru"]').value =
          movieData.title_ru;
      }
      if (movieData.title_en) {
        document.querySelector('[name="movie.title_en"]').value =
          movieData.title_en;
      }
      if (movieData.type) {
        document.querySelector('[name="movie.type"]').value = movieData.type;
      }
      if (movieData.premiere) {
        document.querySelector('[name="movie.premiere"]').value =
          movieData.premiere;
      }
      if (movieData.poster) {
        document.querySelector('[name="movie.poster"]').value =
          movieData.poster;
      }
      if (movieData.pictures) {
        document.querySelector('[name="movie.pictures"]').value =
          movieData.pictures;
      }
      if (movieData.translate) {
        var t = document.querySelector('[name="movie.translate"]');
        t.value = movieData.translate;
        t.style.display = 'block';
        var t1 = document.querySelectorAll('.tagify');
        t1.forEach(function(t) {
          t.style.display = 'none';
        });
      }
      if (movieData.quality) {
        var q = document.querySelector('[name="movie.quality"]');
        q.value = movieData.quality;
        q.style.display = 'block';
        var t2 = document.querySelectorAll('.tagify');
        t2.forEach(function(t) {
          t.style.display = 'none';
        });
      }
      if (movieData.year) {
        document.querySelector('[name="movie.year"]').value = movieData.year;
      }
      if (movieData.country) {
        document.querySelector('[name="movie.country"]').value =
          movieData.country;
      }
      if (movieData.genre) {
        document.querySelector('[name="movie.genre"]').value = movieData.genre;
      }
      if (movieData.actor) {
        document.querySelector('[name="movie.actor"]').value = movieData.actor;
      }
      if (movieData.director) {
        document.querySelector('[name="movie.director"]').value =
          movieData.director;
      }
      if (movieData.kp_rating) {
        document.querySelector('[name="movie.kp_rating"]').value =
          movieData.kp_rating;
      }
      if (movieData.kp_vote) {
        document.querySelector('[name="movie.kp_vote"]').value =
          movieData.kp_vote;
      }
      if (movieData.imdb_rating) {
        document.querySelector('[name="movie.imdb_rating"]').value =
          movieData.imdb_rating;
      }
      if (movieData.imdb_vote) {
        document.querySelector('[name="movie.imdb_vote"]').value =
          movieData.imdb_vote;
      }
      if (movieData.imdb_id) {
        document.querySelector('[name="movie.imdb_id"]').value =
          movieData.imdb_id;
      }
      if (
        movieData.description &&
        document.querySelector('[name="movie.description"]').value.length < 900
      ) {
        document.querySelector('[name="movie.description"]').value =
          movieData.description;
      }

      if (movieData.poster) {
        src.src =
          movieData.poster === '1'
            ? 'https://k.1poster.net/images/film_iphone/iphone_' +
              kp_id +
              '.jpg?width=180'
            : movieData.poster[0] === '/'
              ? 'https://t.1poster.net/t/p/w185' + movieData.poster
              : movieData.poster;
      }

      autoComplete();
    }
  }
  api();
}

function getAPI(url, callback) {
  GM_xmlhttpRequest({
    method: 'GET',
    url: url,
    onload: function(response) {
      if (response.readyState === 4 && response.status === 200) {
        var result = {};
        try {
          if (response && response.responseText) {
            if (url.indexOf('movie.douban.com') + 1) {
              var matchDate = /("datePublished":\s*")([0-9]{4}-[0-9]{2}-[0-9]{2})/gi.exec(
                response.responseText
              );
              var matchId = /(title\/tt)([0-9]{1,8})/gi.exec(
                response.responseText
              );
              result.imdb_id = matchId ? matchId[2].replace(/[^0-9]/g, '') : '';
              result.premiere = matchDate
                ? matchDate[2].replace(/[^0-9\-]/g, '')
                : '';
              if (omdb && result.imdb_id) {
                urls.push(
                  'https://www.omdbapi.com/?' +
                    'i=tt' +
                    result.imdb_id +
                    '&' +
                    'apikey=' +
                    omdb
                );
              }
            } else if (url.indexOf('kinopoisk.ru') + 1) {
              var matchDate1 = /(dateCreated"\s*content=")([0-9]{4}-[0-9]{2}-[0-9]{2})/i.exec(
                response.responseText
              );
              var matchDate2 = /(data-date-premier-start-link=")([0-9]{8})/i.exec(
                response.responseText
              );

              if (
                matchDate1 &&
                !isNaN(new Date(matchDate1[2] + '').getFullYear())
              ) {
                result.premiere = matchDate1[2];
              } else if (matchDate2) {
                var info = matchDate2[2];
                var date =
                  info[0] +
                  info[1] +
                  info[2] +
                  info[3] +
                  '-' +
                  info[4] +
                  info[5] +
                  '-' +
                  info[6] +
                  info[7];
                if (info && !isNaN(new Date(date).getFullYear())) {
                  result.premiere = date;
                }
              }
            } else {
              result = JSON.parse(response.responseText);
            }
          }
        } catch (e) {
          console.error(e);
        }
        var res = {};
        if (url.indexOf('apicollaps.cc') + 1) {
          res = parseKP(result);
        } else if (url.indexOf('omdbapi.com') + 1) {
          res = parseOMDb(result);
        } else if (url.indexOf('themoviedb.org') + 1) {
          res = parseTMDb(result);
        } else if (url.indexOf('douban.com') + 1) {
          res = parseDouban(result);
        }
        console.log(url, result, res);
        callback(null, res);
      } else {
        callback(null, {});
      }
    }
  });
}

function parseTMDb(res) {
  return {
    title_ru: res.title ? res.title : res.name ? res.name : '',
    title_en: res.original_title ? res.original_title : '',
    year: res.release_date
      ? res.release_date.substring(0, 4)
      : res.first_air_date
        ? res.first_air_date.substring(0, 4)
        : '',
    premiere: res.release_date
      ? res.release_date
      : res.first_air_date
        ? res.first_air_date
        : '',
    type: res.number_of_seasons ? '1' : '0',
    genre: (res.genres
      ? res.genres.map(function(v) {
          return v.name;
        })
      : []
    ).join(','),
    country: (res.production_countries
      ? res.production_countries.map(function(v) {
          return v.name;
        })
      : res.origin_country
        ? res.origin_country.map(function(v) {
            return v;
          })
        : []
    ).join(','),
    actor: (res.credits && res.credits.cast
      ? res.credits.cast.map(function(v, i) {
          return i < 10 ? v.name : null;
        })
      : []
    )
      .filter(Boolean)
      .join(','),
    director: (res.created_by
      ? res.created_by.map(function(v, i) {
          return i < 10 ? v.name : null;
        })
      : res.credits && res.credits.crew
        ? res.credits.crew.map(function(v) {
            return v.job === 'Director' ? v.name : null;
          })
        : []
    )
      .filter(Boolean)
      .join(','),
    description: res.overview ? res.overview : '',
    poster: res.poster_path ? res.poster_path : '',
    pictures: res.backdrop_path ? res.backdrop_path : '',
    imdb_rating: res.vote_average ? Math.floor(res.vote_average * 10) : '',
    imdb_vote: res.vote_count ? Math.floor(res.vote_count) : '',
    imdb_id: res.imdb_id ? res.imdb_id.replace(/[^0-9]/g, '') : ''
  };
}

function parseOMDb(res) {
  var month = 'Jan/Feb/Mar/Apr/May/Jun/Jul/Aug/Sept/Oct/Nov/Dec'.split('/');
  return {
    title_en: res.Title && res.Title !== 'N/A' ? res.Title : '',
    year:
      res.Year && res.Year !== 'N/A'
        ? (res.Year + '').split('-')[0].replace(/[^0-9]/g, '')
        : '',
    premiere: (res.Released && res.Released !== 'N/A'
      ? month.map(function(y, i) {
          if (res.Released.indexOf(y) === -1) return null;
          var d = res.Released.split(y);
          if (d && d.length !== 2) return null;
          var mon = i + 1 < 10 ? '0' + (i + 1) : i + 1;
          return d[1].trim() + '-' + mon + '-' + d[0].trim();
        })
      : []
    )
      .filter(Boolean)
      .join(''),
    type: res.Type && res.Type === 'series' ? '1' : '0',
    genre: (res.Genre && res.Genre !== 'N/A'
      ? res.Genre.split(',').map(function(v) {
          return v.trim();
        })
      : []
    ).join(','),
    country: (res.Country && res.Country !== 'N/A'
      ? res.Country.split(',').map(function(v) {
          return v.trim();
        })
      : []
    ).join(','),
    actor: (res.Actors && res.Actors !== 'N/A'
      ? res.Actors.split(',').map(function(v, i) {
          return i < 10 ? v.trim() : null;
        })
      : []
    )
      .filter(Boolean)
      .join(','),
    director: (res.Director && res.Director !== 'N/A'
      ? res.Director.split(',').map(function(v, i) {
          return i < 10 ? v.trim() : null;
        })
      : res.Writer && res.Writer !== 'N/A'
        ? res.Writer.split(',').map(function(v, i) {
            return i < 10 ? v.trim() : null;
          })
        : []
    )
      .filter(Boolean)
      .join(','),
    description: res.Plot && res.Plot !== 'N/A' ? res.Plot : '',
    poster: res.Poster && res.Poster !== 'N/A' ? res.Poster : '',
    imdb_rating:
      res.imdbRating && res.imdbRating !== 'N/A'
        ? Math.floor(parseInt(res.imdbRating) * 10)
        : '',
    imdb_vote:
      res.imdbVotes && res.imdbVotes !== 'N/A'
        ? Math.floor(parseInt(res.imdbVotes.replace(/,/g, '')))
        : ''
  };
}

function parseKP(r) {
  if (!r.id) return {};
  var res = r;
  return {
    title_ru: res.name
      ? res.name
          .split('(')[0]
          .split('[')[0]
          .trim()
      : '',
    title_en: res.name_eng
      ? res.name_eng
          .split('(')[0]
          .split('[')[0]
          .trim()
      : '',
    year: res.year ? (res.year + '').split('-')[0].replace(/[^0-9]/g, '') : '',
    type: res.type && res.type === 'series' ? '1' : '0',
    genre: (res.genre
      ? res.genre.map(function(v) {
          return v.toLowerCase();
        })
      : []
    ).join(','),
    country: (res.country
      ? res.country.map(function(v) {
          return v;
        })
      : []
    ).join(','),
    actor: (res.actors
      ? res.actors.map(function(v, i) {
          return i < 10 ? v : null;
        })
      : []
    )
      .filter(Boolean)
      .join(','),
    director: (res.director
      ? res.director.map(function(v, i) {
          return i < 10 ? v : null;
        })
      : []
    )
      .filter(Boolean)
      .join(','),
    description: res.description ? res.description : '',
    poster: res.poster ? '1' : '',
    kp_rating: res.kinopoisk ? Math.floor(res.kinopoisk * 10) : '',
    kp_vote: '1000',
    imdb_rating: res.imdb ? Math.floor(res.imdb * 10) : '',
    imdb_vote: '1000',
    translate:
      res.voiceActing && res.voiceActing[0]
        ? res.voiceActing.filter(function(voice) {
            return !/(укр|eng)/i.test(voice);
          })[0]
        : '',
    quality: res.quality ? res.quality : '',
    premiere: res.premier ? res.premier : ''
  };
}

function parseDouban(res) {
  return {
    title_ru: res.title ? res.title : '',
    title_en: res.original_title ? res.original_title : '',
    year: res.year ? (res.year + '').split('-')[0].replace(/[^0-9]/g, '') : '',
    type: res.subtype && res.subtype === 'tv' ? '1' : '0',
    genre: (res.genres
      ? res.genres.map(function(v) {
          return v;
        })
      : []
    ).join(','),
    country: (res.countries
      ? res.countries.map(function(v) {
          return v;
        })
      : []
    ).join(','),
    actor: (res.casts
      ? res.casts.map(function(v, i) {
          return i < 10 ? v.name : null;
        })
      : []
    )
      .filter(Boolean)
      .join(','),
    director: (res.directors
      ? res.directors.map(function(v, i) {
          return i < 10 ? v.name : null;
        })
      : []
    )
      .filter(Boolean)
      .join(','),
    description: res.summary ? res.summary : '',
    poster: res.images && res.images.medium ? res.images.medium : '',
    imdb_rating:
      res.rating && res.rating.average
        ? Math.floor(res.rating.average * 10)
        : '',
    imdb_vote: res.ratings_count ? Math.floor(res.ratings_count) : '',
    imdb_id: res.imdb_id ? res.imdb_id : '',
    premiere: res.premiere ? res.premiere : ''
  };
}

function autoComplete() {
  var elem = document.querySelector('.autoComplete');
  if (elem) elem.parentNode.removeChild(elem);
  var autoBtn = document.createElement('a');
  var autoIcon = document.createElement('strong');
  var autoSeparate = document.createElement('i');
  var autoText = document.createElement('span');
  autoBtn.setAttribute('class', 'btn power-on autoComplete');
  autoBtn.setAttribute('href', 'javascript:void(0)');
  autoSeparate.innerHTML = '&nbsp;&nbsp;';
  autoText.innerHTML = 'Auto-fill information';
  autoIcon.setAttribute('class', 'fa fa-video');
  autoBtn.appendChild(autoIcon);
  autoBtn.appendChild(autoSeparate);
  autoBtn.appendChild(autoText);
  var right = document.querySelector('.window > .actionbar > .pull-right > a');
  if (right) {
    right.parentNode.insertBefore(autoBtn, right);
  }
  autoBtn.addEventListener('click', parseData, false);
}

function inputOMDb() {
  var omdbDiv = document.createElement('div');
  var omdbInput = document.createElement('input');
  omdbDiv.setAttribute('class', 'spacer-10');
  omdbInput.setAttribute('class', 'form-control');
  omdbInput.setAttribute('name', 'omdb');
  omdbInput.setAttribute('placeholder', 'OMDb apikey [omdbapi.com]');
  var omdbInsert = document.querySelector('[name="movie.id"]');
  if (omdbInsert) {
    omdbInsert.parentNode.insertBefore(omdbDiv, omdbInsert.nextSibling);
    omdbInsert.parentNode.insertBefore(omdbInput, omdbInsert.nextSibling);
  }
}

function inputTMDb() {
  var tmdbDiv = document.createElement('div');
  var tmdbInput = document.createElement('input');
  tmdbDiv.setAttribute('class', 'spacer-10');
  tmdbInput.setAttribute('class', 'form-control');
  tmdbInput.setAttribute('name', 'tmdb');
  tmdbInput.setAttribute('placeholder', 'TMDb api_key [tmdb.org]');
  var tmdbInsert = document.querySelector('[name="movie.id"]');
  if (tmdbInsert) {
    tmdbInsert.parentNode.insertBefore(tmdbDiv, tmdbInsert.nextSibling);
    tmdbInsert.parentNode.insertBefore(tmdbInput, tmdbInsert.nextSibling);
  }
}

function getCookie(name) {
  var matches = document.cookie.match(
    new RegExp(
      '(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + '=([^;]*)'
    )
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

function setCookie(name, value, options) {
  options = options || {};
  var expires = options.expires;
  if (typeof expires === 'number' && expires) {
    var d = new Date();
    d.setTime(d.getTime() + expires * 1000);
    expires = options.expires = d;
  }
  if (expires && expires.toUTCString) {
    options.expires = expires.toUTCString();
  }
  value = encodeURIComponent(value);
  var updatedCookie = name + '=' + value;
  for (var propName in options) {
    if (options.hasOwnProperty(propName)) {
      updatedCookie += '; ' + propName;
      var propValue = options[propName];
      if (propValue !== true) {
        updatedCookie += '=' + propValue;
      }
    }
  }
  document.cookie = updatedCookie;
}
