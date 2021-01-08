#!/bin/bash
for NGINX_DIR in /home/*/config/production/nginx/conf.d/default.conf; do
  [ -f "${NGINX_DIR}" ] || continue
  NGINX_INIT=$(md5sum "${NGINX_DIR}" | awk '{ print $1 }')
  NGINX_NOW=${NGINX_INIT}
  while true; do
    [ -f "${NGINX_DIR}" ] || continue
    NGINX_NOW=$(md5sum "${NGINX_DIR}" | awk '{ print $1 }')
    if [ "${NGINX_INIT}" != "${NGINX_NOW}" ]; then
      echo "Reloading... [${NGINX_DIR}]"
      nginx -t && nginx -s reload;
    fi
    NGINX_INIT=${NGINX_NOW}
    sleep 60
  done &
done
crond && /usr/sbin/nginx -g 'daemon off;'