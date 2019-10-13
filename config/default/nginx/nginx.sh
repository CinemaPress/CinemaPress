#!/bin/bash
for NGINX_DIR in $(ls /home/*/config/production/nginx/conf.d/default.conf); do
    NGINX_INIT=$(md5sum ${NGINX_DIR} | awk '{ print $1 }')
    NGINX_NOW=${NGINX_INIT}
    while true; do
        NGINX_NOW=$(md5sum ${NGINX_DIR} | awk '{ print $1 }')
        if [ ${NGINX_INIT} != ${NGINX_NOW} ]; then
            echo "${NGINX_DIR} Reloading..."
            nginx -t && nginx -s reload;
        fi
        NGINX_INIT=${NGINX_NOW}
        sleep 5
    done &
done
/usr/sbin/nginx -g 'daemon off;'