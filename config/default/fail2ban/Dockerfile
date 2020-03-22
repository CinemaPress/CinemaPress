FROM crazymax/fail2ban:0.10.4
CMD ["fail2ban-server", "-f", "-x", "-v", "start"]
HEALTHCHECK --interval=100s --timeout=5s CMD fail2ban-client ping || exit 1