FROM nginx:1.20-alpine
RUN mkdir -p /var/log/nginx /etc/nginx /var/run
WORKDIR /etc/nginx
COPY . /etc/nginx
RUN apk add bash dos2unix gzip curl \
    && dos2unix /etc/nginx/nginx.sh \
    && chmod +x /etc/nginx/nginx.sh \
    && cp /usr/share/zoneinfo/Europe/Moscow /etc/localtime \
    && echo "Europe/Moscow" > /etc/timezone \
    && rm -rf \
        /etc/nginx/conf.d/default.conf \
        /etc/nginx/cloudflare.ini \
        /etc/nginx/Dockerfile \
    && echo -e \
        "#!/bin/bash\n\nD=\$(date +%d-%m-%Y)\n\n" \
        "find /var/log/nginx -type f -name '*.log' -size +102400 -exec mv {} {}-\${D}.old \; >/dev/null 2>&1\n" \
        "find /var/log/nginx -type f -name '*.old' -exec gzip {} \; >/dev/null 2>&1\n" \
        "find /var/log/nginx -type f -name '*.gz' -mtime +10 -exec rm -rf {} \; >/dev/null 2>&1\n" \
        "[ -s /run/nginx.pid ] && kill -USR1 \$(cat /run/nginx.pid)" \
        > /etc/periodic/daily/nginx \
    && chmod a+x /etc/periodic/daily/nginx
EXPOSE 80 443
CMD ["/etc/nginx/nginx.sh"]
HEALTHCHECK --interval=30s --timeout=30s --retries=10 CMD curl -s --fail http://127.0.0.1:8080/ping || exit 1