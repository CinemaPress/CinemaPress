FROM pagespeed/nginx-pagespeed:1.13.35.2-alpine3.8-ngx1.15
RUN mkdir -p \
    /var/log/nginx \
    /etc/nginx \
    /var/run
WORKDIR /etc/nginx
COPY . /etc/nginx
RUN apk add bash dos2unix logrotate \
    && dos2unix /etc/nginx/nginx.sh \
    && chmod +x /etc/nginx/nginx.sh \
    && cp -rf /etc/nginx/logrotate.d/ /etc/logrotate.d/ \
    && rm -rf \
        /etc/nginx/conf.d/default.conf \
        /etc/nginx/cloudflare.ini \
        /etc/nginx/Dockerfile
EXPOSE 80 443
CMD ["/etc/nginx/nginx.sh"]