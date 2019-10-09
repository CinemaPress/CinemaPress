FROM alpine:3.10
ARG NODE_ENV="production"
ENV NODE_ENV=${NODE_ENV}
ARG NODE_PORT="3000"
ENV NODE_PORT=${NODE_PORT}
ARG CP_DOMAIN=""
ENV CP_DOMAIN=${CP_DOMAIN}
ARG CP_DOMAIN_=""
ENV CP_DOMAIN_=${CP_DOMAIN_}
ARG CP_LANG=""
ENV CP_LANG=${CP_LANG}
ARG CP_THEME=""
ENV CP_THEME=${CP_THEME}
ARG CP_PASSWD=""
ENV CP_PASSWD=${CP_PASSWD}
ARG CP_MIRROR=""
ENV CP_MIRROR=${CP_MIRROR}
ARG CP_MIRROR_=""
ENV CP_MIRROR_=${CP_MIRROR_}
ARG CP_KEY=""
ENV CP_KEY=${CP_KEY}
ARG RCLONE_CONFIG=""
ENV RCLONE_CONFIG=${RCLONE_CONFIG}
ENV TZ=Europe/Helsinki
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
RUN mkdir -p /var/cinemapress
WORKDIR /var/cinemapress
COPY package.json /var/cinemapress/package.json
RUN set -o pipefail \
    && apk update \
#    && apk add -u --no-cache libpng librsvg libgsf giflib libjpeg-turbo musl \
#    && apk add vips-dev fftw-dev build-base --update-cache \
#        --repository http://dl-3.alpinelinux.org/alpine/edge/community/ \
#        --repository http://dl-3.alpinelinux.org/alpine/edge/main \
    && apk --no-cache add --virtual .build-dependencies make g++ gcc gtk-doc gobject-introspection expat-dev glib-dev libpng-dev libjpeg-turbo-dev giflib-dev librsvg-dev \
    && apk add -u --no-cache sudo python wget curl tar gzip unzip git sed bash nano openrc openssl dos2unix busybox-extras tzdata \
    && apk add -u --no-cache npm=10.16.3-r0 mysql-client=10.3.17-r0 sphinx=2.2.11-r1 memcached=1.5.16-r0 \
    && wget -qO - https://rclone.org/install.sh | bash \
    && cp /usr/share/zoneinfo/Europe/Helsinki /etc/localtime \
    && echo "Europe/Helsinki" > /etc/timezone \
    && npm i node-gyp -g \
    && npm i pm2 -g \
    && npm i \
    && mkdir -p \
        /var/ngx_pagespeed_cache \
        /etc/sphinx \
        /var/lib/sphinx/data \
        /var/local/images \
        /var/local/balancer \
    && npm cache clean --force \
    && apk del .build-dependencies \
    && rm -rf /var/cache/apk/*
COPY . /var/cinemapress
RUN set -o pipefail \
    && rm -rf package-lock.json doc .dockerignore .gitignore .prettierignore .prettierrc Dockerfile LICENSE.txt README.md \
    && dos2unix cinemapress.sh \
    && cp cinemapress.sh /usr/bin/cinemapress && chmod +x /usr/bin/cinemapress \
    && rm -rf cinemapress.sh \
    && cp -rf themes/default/public/admin/favicon.ico favicon.ico \
    && cp -rf files/bbb.mp4 /var/local/balancer/bbb.mp4 \
    && cp -rf themes/default/public/desktop/img/player$(( ( RANDOM % 7 ) + 1 )).png \
        themes/default/public/desktop/img/player.png \
    && wget -qO geo.tar.gz http://geolite.maxmind.com/download/geoip/database/GeoLite2-City.tar.gz \
    && tar xfz geo.tar.gz \
    && mv GeoLite2-City_*/GeoLite2-City.mmdb files/GeoLite2-City.mmdb \
    && rm -rf geo.tar.gz GeoLite2-City_* \
    && wget -qO geo.tar.gz http://geolite.maxmind.com/download/geoip/database/GeoLite2-Country.tar.gz \
    && tar xfz geo.tar.gz \
    && mv GeoLite2-Country_*/GeoLite2-Country.mmdb files/GeoLite2-Country.mmdb \
    && rm -rf geo.tar.gz GeoLite2-Country_* \
    && echo -e "#!/bin/bash\n/usr/bin/cinemapress container backup > /home/\${CP_DOMAIN}/log/backup_\$(date '+%d_%m_%Y').log" \
        > /etc/periodic/daily/backup \
    && chmod a+x /etc/periodic/daily/backup \
    && echo -e "#!/bin/bash\n/usr/bin/cinemapress container cron > /home/\${CP_DOMAIN}/log/cron_\$(date '+%d_%m_%Y').log" \
        > /etc/periodic/hourly/cron \
    && chmod a+x /etc/periodic/hourly/cron
EXPOSE 3000
CMD ["/usr/bin/cinemapress", "container", "run"]