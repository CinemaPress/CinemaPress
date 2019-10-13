FROM pagespeed/nginx-pagespeed:1.13.35.2-alpine3.8-ngx1.15
RUN mkdir -p \
    /var/log/nginx \
    /etc/nginx \
    /var/run
WORKDIR /etc/nginx
COPY . /etc/nginx
RUN chmod +x nginx.sh \
    && rm -rf \
        conf.d/default.conf \
        cloudflare.ini \
        Dockerfile
EXPOSE 80 443
CMD ["/etc/nginx/nginx.sh"]