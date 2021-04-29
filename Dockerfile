FROM alpine:3.11
ARG NODE_ENV="production"
ENV NODE_ENV=${NODE_ENV}
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
ENV CP_SPB=""
ARG RCLONE_CONFIG=""
ENV RCLONE_CONFIG=${RCLONE_CONFIG}
ENV TZ=Europe/Moscow
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
RUN mkdir -p /var/cinemapress
WORKDIR /var/cinemapress
COPY package.json /var/cinemapress/package.json
RUN set -o pipefail \
    && apk update \
    && apk --no-cache add --virtual .build-dependencies make g++ gcc gtk-doc gobject-introspection expat-dev glib-dev libpng-dev libjpeg-turbo-dev giflib-dev librsvg-dev \
    && apk add -u --no-cache sudo python wget curl tar gzip unzip git sed bash nano openrc openssl dos2unix busybox-extras tzdata grep \
    && apk add -u --no-cache npm mysql-client sphinx=2.2.11-r1 \
    && wget -qO - https://rclone.org/install.sh | bash \
    && cp /usr/share/zoneinfo/Europe/Moscow /etc/localtime \
    && echo "Europe/Moscow" > /etc/timezone \
    && npm i node-gyp -g \
    && npm i pm2@4.5.6 -g \
    && npm i cinematheme@0.0.13 -g \
    && npm i \
    && mkdir -p \
        /var/lib/sphinx/data \
        /var/local/balancer \
    && npm cache clean --force \
    && apk del .build-dependencies \
    && rm -rf /var/cache/apk/*
COPY . /var/cinemapress
RUN set -o pipefail \
    && rm -rf package-lock.json doc .dockerignore .gitignore .prettierignore .prettierrc Dockerfile LICENSE.txt README.md \
    && dos2unix cinemapress.sh \
    && cp cinemapress.sh /usr/bin/cinemapress && chmod +x /usr/bin/cinemapress \
    && rm -rf /etc/sphinx && mv config/default/sphinx /etc/sphinx \
    && mv node_modules/mysql node_modules/sphinx \
    && rm -rf cinemapress.sh \
    && cp -rf themes/default/public/admin/favicon.ico favicon.ico \
    && cp -rf themes/default/public/desktop/img/player$(( ( RANDOM % 7 ) + 1 )).png \
        themes/default/public/desktop/img/player.png \
    && echo -e "#!/bin/bash\n/usr/bin/cinemapress container backup create >> /home/\${CP_DOMAIN}/log/backup_\$(date '+%d_%m_%Y').log" \
        > /etc/periodic/daily/backup \
    && chmod a+x /etc/periodic/daily/backup \
    && echo -e "#!/bin/bash\n/usr/bin/cinemapress container cron >> /home/\${CP_DOMAIN}/log/cron_\$(date '+%d_%m_%Y').log" \
        > /etc/periodic/hourly/cron \
    && chmod a+x /etc/periodic/hourly/cron
EXPOSE 3000
CMD ["/usr/bin/cinemapress", "container", "run"]
HEALTHCHECK --interval=60s --timeout=30s --start-period=30s --retries=10 CMD curl --fail http://localhost:3000/ping || exit 1