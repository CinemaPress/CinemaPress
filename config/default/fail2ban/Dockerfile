FROM crazymax/fail2ban:0.10.4
COPY . /etc/f2b
RUN rm -rf /etc/f2b/Dockerfile \
    cp -r /etc/f2b/* /etc/fail2ban/ \
    rm -rf /etc/f2b \
    touch /etc/fail2ban/ip.blacklist \
    touch /etc/fail2ban/nginx.repeatoffender \
    chmod +x /etc/fail2ban/nginx.repeatoffender
CMD ["fail2ban-server", "-f", "-x", "-v", "start"]
HEALTHCHECK --interval=100s --timeout=5s CMD fail2ban-client ping || exit 1