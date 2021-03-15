FROM crazymax/fail2ban:0.10.4
CMD ["fail2ban-server", "-f", "-x", "-v", "start"]
HEALTHCHECK --interval=200s --timeout=200s --retries=10 CMD fail2ban-client ping || exit 1