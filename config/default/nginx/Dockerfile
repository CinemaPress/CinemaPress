FROM pagespeed/nginx-pagespeed:1.13.35.2-alpine3.8-ngx1.15
RUN mkdir -p \
    /var/log/nginx \
    /etc/nginx \
    /var/run
WORKDIR /etc/nginx
COPY . /etc/nginx
RUN rm -rf \
    /etc/nginx/conf.d/nginx.conf \
    /etc/nginx/cloudflare.ini \
    /etc/nginx/Dockerfile
EXPOSE 80 443
CMD ["/usr/sbin/nginx", "-g", "daemon off;"]