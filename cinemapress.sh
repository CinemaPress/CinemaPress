#!/bin/bash

R='\033[0;31m'
G='\033[0;32m'
Y='\033[0;33m'
C='\033[1;34m'
B='\033[0;36m'
S='\033[0;90m'
NC='\033[0m'

OPTION=${1:-}
GIT_SERVER="github.com"
CP_VER="4.0.0"
CP_ALL=""
PRC_=0

CP_DOMAIN=${CP_DOMAIN:-}
CP_LANG=${CP_LANG:-}
CP_THEME=${CP_THEME:-}
CP_PASSWD=${CP_PASSWD:-}
CP_MIRROR=${CP_MIRROR:-}
CP_KEY=${CP_KEY:-}
CLOUDFLARE_EMAIL=${CLOUDFLARE_EMAIL:-}
CLOUDFLARE_API_KEY=${CLOUDFLARE_API_KEY:-}
MEGA_EMAIL=${MEGA_EMAIL:-}
MEGA_PASSWORD=${MEGA_PASSWORD:-}

CP_DOMAIN_=$(echo "${CP_DOMAIN}" | sed -r "s/[^A-Za-z0-9]/_/g")
CP_MIRROR_=$(echo "${CP_DOMAIN}" | sed -r "s/[^A-Za-z0-9]/_/g")

CP_IP="domain"

EXTERNAL_PORT=""
EXTERNAL_DOCKER=""

CP_OS="`awk '/^ID=/' /etc/*-release | awk -F'=' '{ print tolower($2) }'`"

if [ "${CP_OS}" = "alpine" ] || [ "${CP_OS}" = "\"alpine\"" ] || \
   [ "${CP_OS}" = "debian" ] || [ "${CP_OS}" = "\"debian\"" ] || \
   [ "${CP_OS}" = "ubuntu" ] || [ "${CP_OS}" = "\"ubuntu\"" ] || \
   [ "${CP_OS}" = "fedora" ] || [ "${CP_OS}" = "\"fedora\"" ] || \
   [ "${CP_OS}" = "centos" ] || [ "${CP_OS}" = "\"centos\"" ]; then
   true
else
    _header "ERROR"
    _content
    _content "This OS is not supported."
    _content "Please reinstall to"
    _content "CentOS 7 or Debian 9/10 or Ubuntu 18/19 or Fedora 28/29"
    _content
    _s
    exit 0
fi

post_commands() {
    LOCAL_DOMAIN=${1:-${CP_DOMAIN}}
    LOCAL_DOMAIN_=`echo ${LOCAL_DOMAIN} | sed -r "s/[^A-Za-z0-9]/_/g"`

    if [ "`grep \"${LOCAL_DOMAIN}_autostart\" /etc/crontab`" = "" ] \
    && [ -f "/home/${LOCAL_DOMAIN}/process.json" ]; then
        echo -e "\n" >>/etc/crontab
        echo "# ----- ${LOCAL_DOMAIN}_autostart --------------------------------------" >>/etc/crontab
        echo "@reboot root /usr/bin/cinemapress autostart \"${LOCAL_DOMAIN}\" >>/home/${LOCAL_DOMAIN}/log/autostart_\$(date '+%d_%m_%Y').log 2>&1" >>/etc/crontab
        echo "# ----- ${LOCAL_DOMAIN}_autostart --------------------------------------" >>/etc/crontab
    fi
    if [ "`grep \"${LOCAL_DOMAIN}_ssl\" /etc/crontab`" = "" ] \
    && [ -d "/home/${LOCAL_DOMAIN}/config/production/nginx/ssl.d/live/${LOCAL_DOMAIN}/" ]; then
        echo -e "\n" >>/etc/crontab
        echo "# ----- ${LOCAL_DOMAIN}_ssl --------------------------------------" >>/etc/crontab
        echo "0 23 * * * root docker run --rm -v /home/${LOCAL_DOMAIN}/config/production/nginx/ssl.d:/etc/letsencrypt -v /home/${LOCAL_DOMAIN}/config/production/nginx/letsencrypt:/var/lib/letsencrypt -v /home/${LOCAL_DOMAIN}/config/production/nginx/cloudflare.ini:/cloudflare.ini certbot/dns-cloudflare renew --dns-cloudflare --dns-cloudflare-credentials /cloudflare.ini --quiet >>/home/${LOCAL_DOMAIN}/log/https_\$(date '+%d_%m_%Y').log 2>&1; docker exec -d nginx nginx -s reload" >>/etc/crontab
        echo "# ----- ${LOCAL_DOMAIN}_ssl --------------------------------------" >>/etc/crontab
    fi
    CP_SPEED=`grep "\"pagespeed\"" /home/${LOCAL_DOMAIN}/config/production/config.js | sed 's/.*"pagespeed":\s*\([0-9]\{1\}\).*/\1/'`
    if [ "${CP_SPEED}" != "" ]; then
        sed -E -i "s/\"pagespeed\":\s*[0-9]*/\"pagespeed\":${CP_SPEED}/" \
            /home/${LOCAL_DOMAIN}/config/production/config.js
        docker exec ${LOCAL_DOMAIN_} /usr/bin/cinemapress container speed "${CP_SPEED}" >/dev/null
        docker exec nginx nginx -s reload >/dev/null
    fi
}
docker_install() {
    if [ "${CP_OS}" != "alpine" ] && [ "${CP_OS}" != "\"alpine\"" ]; then
        if [ "`basename "${0}"`" != "cinemapress" ] || [ "${1}" != "" ]; then
            echo ""; echo -n "☐ Downloading cinemapress.sh ...";
            wget -qO /usr/bin/cinemapress https://gitlab.com/CinemaPress/CinemaPress/raw/master/cinemapress.sh && \
            chmod +x /usr/bin/cinemapress
            echo -e "\\r${G}✓ Downloading cinemapress.sh ...${NC}"
            echo -n "☐ Installing packages ..."
            if [ "${CP_OS}" = "debian" ] || [ "${CP_OS}" = "\"debian\"" ]; then
                DEBIAN_FRONTEND=noninteractive apt-get -y -qq update >>/var/log/docker_install_"$(date '+%d_%m_%Y')".log 2>&1
                DEBIAN_FRONTEND=noninteractive apt-get -y -qq install sudo wget curl nano htop lsb-release ca-certificates git-core openssl netcat cron zip gzip bzip2 unzip gcc make libssl-dev locales lsof net-tools >>/var/log/docker_install_"$(date '+%d_%m_%Y')".log 2>&1
            elif [ "${CP_OS}" = "ubuntu" ] || [ "${CP_OS}" = "\"ubuntu\"" ]; then
                DEBIAN_FRONTEND=noninteractive apt-get -y -qq update >>/var/log/docker_install_"$(date '+%d_%m_%Y')".log 2>&1
                DEBIAN_FRONTEND=noninteractive apt-get -y -qq install sudo wget curl nano htop lsb-release ca-certificates git-core openssl netcat cron zip gzip bzip2 unzip gcc make libssl-dev locales lsof net-tools syslog-ng >>/var/log/docker_install_"$(date '+%d_%m_%Y')".log 2>&1
            elif [ "${CP_OS}" = "fedora" ] || [ "${CP_OS}" = "\"fedora\"" ]; then
                dnf -y install sudo wget curl nano htop lsb-release ca-certificates git-core openssl netcat cron zip gzip bzip2 unzip gcc make libssl-dev locales lsof >>/var/log/docker_install_"$(date '+%d_%m_%Y')".log 2>&1
            elif [ "${CP_OS}" = "centos" ] || [ "${CP_OS}" = "\"centos\"" ]; then
                yum install -y epel-release >>/var/log/docker_install_"$(date '+%d_%m_%Y')".log 2>&1
                yum install -y sudo wget curl nano htop lsb-release ca-certificates git-core openssl netcat cron zip gzip bzip2 unzip gcc make libssl-dev locales lsof net-tools >>/var/log/docker_install_"$(date '+%d_%m_%Y')".log 2>&1
            fi
            echo -e "\\r${G}✓ Installing packages ...${NC}"
            echo ""
        fi
        if [ "$(docker -v 2>/dev/null)" = "" ]; then
            clear
            _line
            _logo
            _header "DOCKER"
            _content
            _content "Installing Docker ..."
            _content
            _s
            sed -Ei "s/#SyslogFacility AUTH/SyslogFacility AUTH/g" /etc/ssh/sshd_config >/dev/null
            sed -Ei "s/#LogLevel INFO/LogLevel ERROR/g" /etc/ssh/sshd_config >/dev/null
            sed -Ei "s/#MaxAuthTries 6/MaxAuthTries 3/g" /etc/ssh/sshd_config >/dev/null
            if [ "${CP_OS}" = "debian" ] || [ "${CP_OS}" = "\"debian\"" ]; then
                CP_ARCH="`dpkg --print-architecture`"
                DEBIAN_FRONTEND=noninteractive apt-get -y -qq remove docker docker-engine docker.io containerd runc
                DEBIAN_FRONTEND=noninteractive apt-get -y -qq update
                DEBIAN_FRONTEND=noninteractive apt-get -y -qq install \
                    apt-transport-https \
                    ca-certificates \
                    curl \
                    gnupg2 \
                    software-properties-common
                curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
                apt-key fingerprint 0EBFCD88
                if [ "${CP_ARCH}" = "amd64" ] || [ "${CP_ARCH}" = "x86_64" ] || [ "${CP_ARCH}" = "i386" ]
                then
                    CP_ARCH="amd64"
                elif [ "${CP_ARCH}" = "armhf" ] || [ "${CP_ARCH}" = "armel" ]
                then
                    CP_ARCH="armhf"
                elif [ "${CP_ARCH}" = "arm64" ]
                then
                    CP_ARCH="arm64"
                fi
                add-apt-repository \
                    "deb [arch=${CP_ARCH}] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
                DEBIAN_FRONTEND=noninteractive apt-get -y -qq update
                DEBIAN_FRONTEND=noninteractive apt-get -y -qq install docker-ce docker-ce-cli containerd.io
                systemctl restart ssh
            elif [ "${CP_OS}" = "ubuntu" ] || [ "${CP_OS}" = "\"ubuntu\"" ]; then
                CP_ARCH="`dpkg --print-architecture`"
                DEBIAN_FRONTEND=noninteractive apt-get -y -qq remove docker docker-engine docker.io containerd runc
                DEBIAN_FRONTEND=noninteractive apt-get -y -qq update
                DEBIAN_FRONTEND=noninteractive apt-get -y -qq install \
                    apt-transport-https \
                    ca-certificates \
                    curl \
                    gnupg-agent \
                    software-properties-common
                curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
                apt-key fingerprint 0EBFCD88
                if [ "${CP_ARCH}" = "amd64" ] || [ "${CP_ARCH}" = "x86_64" ] || [ "${CP_ARCH}" = "i386" ]
                then
                    CP_ARCH="amd64"
                elif [ "${CP_ARCH}" = "armhf" ] || [ "${CP_ARCH}" = "armel" ]
                then
                    CP_ARCH="armhf"
                elif [ "${CP_ARCH}" = "arm64" ]
                then
                    CP_ARCH="arm64"
                elif [ "${CP_ARCH}" = "ppc64el" ] || [ "${CP_ARCH}" = "ppc" ] || [ "${CP_ARCH}" = "powerpc" ]
                then
                    CP_ARCH="ppc64el"
                elif [ "${CP_ARCH}" = "s390x" ]
                then
                    CP_ARCH="s390x"
                fi
                add-apt-repository \
                    "deb [arch=${CP_ARCH}] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
                DEBIAN_FRONTEND=noninteractive apt-get -y -qq update
                DEBIAN_FRONTEND=noninteractive apt-get -y -qq install docker-ce docker-ce-cli containerd.io
                systemctl restart ssh
            elif [ "${CP_OS}" = "fedora" ] || [ "${CP_OS}" = "\"fedora\"" ]; then
                dnf -y remove docker \
                    docker-client \
                    docker-client-latest \
                    docker-common \
                    docker-latest \
                    docker-latest-logrotate \
                    docker-logrotate \
                    docker-selinux \
                    docker-engine-selinux \
                    docker-engine
                dnf -y install dnf-plugins-core
                dnf config-manager \
                    --add-repo \
                    https://download.docker.com/linux/fedora/docker-ce.repo
                dnf -y install docker-ce docker-ce-cli containerd.io
                systemctl start docker
                systemctl enable docker
                systemctl restart sshd
            elif [ "${CP_OS}" = "centos" ] || [ "${CP_OS}" = "\"centos\"" ]; then
                yum remove -y docker \
                    docker-client \
                    docker-client-latest \
                    docker-common \
                    docker-latest \
                    docker-latest-logrotate \
                    docker-logrotate \
                    docker-engine
                yum install -y yum-utils \
                    device-mapper-persistent-data \
                    lvm2
                yum-config-manager \
                    --add-repo \
                    https://download.docker.com/linux/centos/docker-ce.repo
                yum install -y docker-ce docker-ce-cli containerd.io
                systemctl start docker
                systemctl enable docker
                systemctl restart sshd
            fi
            if [ "$(docker -v 2>/dev/null)" = "" ]; then
                clear
                _header "ERROR"
                _content
                _content "Docker is not installed, try installing manually!"
                _content
                _s
                exit 0
            fi
        fi
    fi
}
ip_install() {
    IP1=`ip route get 1 | awk '{print $NF;exit}'`
    IP2=`ip route get 8.8.4.4 | head -1 | cut -d' ' -f8`
    IP3=`ip route get 8.8.4.4 | head -1 | awk '{print $7}'`
    if [ "`expr "${IP1}" : '[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$'`" = "0" ] \
    && [ "`expr "${IP2}" : '[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$'`" = "0" ] \
    && [ "`expr "${IP3}" : '[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$'`" = "0" ]; then exit 1; fi
    if [ "`expr "${IP1}" : '[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$'`" != "0" ]; then IP_DOMAIN="${IP1}"; \
    elif [ "`expr "${IP2}" : '[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$'`" != "0" ]; then IP_DOMAIN="${IP2}"; \
    elif [ "`expr "${IP3}" : '[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$'`" != "0" ]; then IP_DOMAIN="${IP3}"; fi
    CP_IP="ip"
    CP_LANG="${1}"
    CP_THEME="arya"
    CP_PASSWD="test"
    sh_yes
    _s
    sh_progress
    1_install "${IP_DOMAIN}" "${CP_LANG}" "${CP_THEME}" "${CP_PASSWD}"
    sh_progress 100
    success_install
}

1_install() {
    LOCAL_DOMAIN=${1:-${CP_DOMAIN}}
    LOCAL_DOMAIN_=`echo ${LOCAL_DOMAIN} | sed -r "s/[^A-Za-z0-9]/_/g"`
    LOCAL_LANG=${2:-${CP_LANG}}
    LOCAL_THEME=${3:-${CP_THEME}}
    LOCAL_PASSWD=${4:-${CP_PASSWD}}

    echo "${PRC_}% install" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

    # MEMTOTATAL=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    # SWAPTOTAL=$(grep SwapTotal /proc/meminfo | awk '{print $2}')
    # MEMORY_DOCKER=""
    # if [ "${MEMTOTATAL}" -gt 0 ]; then
    #     MEMDOCKER=$(("${MEMTOTATAL}"-"${MEMTOTATAL}"*10/100))
    #     if [ "${MEMDOCKER}" -gt 0 ]; then
    #        SWAPDOCKER=$(("${MEMDOCKER}"+"${SWAPTOTAL}"-"${SWAPTOTAL}"*10/100))
    #        MEMORY_DOCKER="--memory ${MEMDOCKER}k --memory-swap ${SWAPDOCKER}k --oom-kill-disable"
    #    fi
    # fi

    if [ ! "$(docker network ls | grep cinemapress)" ]; then
        docker network create \
            --driver bridge \
            cinemapress >>/var/log/docker_install_"$(date '+%d_%m_%Y')".log 2>&1
    fi

    # docker build -t cinemapress/docker https://github.com/CinemaPress/CinemaPress.git

    docker run \
        -d \
        --name ${LOCAL_DOMAIN_} \
        -e "CP_DOMAIN=${LOCAL_DOMAIN}" \
        -e "CP_DOMAIN_=${LOCAL_DOMAIN_}" \
        -e "CP_LANG=${LOCAL_LANG}" \
        -e "CP_THEME=${LOCAL_THEME}" \
        -e "CP_PASSWD=${LOCAL_PASSWD}" \
        -e "RCLONE_CONFIG=/home/${LOCAL_DOMAIN}/config/production/rclone.conf" \
        -w /home/${LOCAL_DOMAIN} \
        --restart always \
        --network cinemapress \
        -v /var/ngx_pagespeed_cache:/var/ngx_pagespeed_cache \
        -v /var/lib/sphinx/data:/var/lib/sphinx/data \
        -v /var/local/images:/var/local/images \
        -v /var/local/balancer:/var/local/balancer \
        -v /home/${LOCAL_DOMAIN}:/home/${LOCAL_DOMAIN} \
        ${EXTERNAL_DOCKER} \
        cinemapress/docker:latest >>/var/log/docker_install_"$(date '+%d_%m_%Y')".log 2>&1

    WEBSITE_RUN=1
    while [ "${WEBSITE_RUN}" != "50" ]; do
        sleep 3
        WEBSITE_RUN=$((1+${WEBSITE_RUN}))
        if [ "`docker ps -aq -f status=running -f name=^/${LOCAL_DOMAIN_}\$ 2>/dev/null`" != "" ]; then
            WEBSITE_RUN=50
        fi
    done

    sh_progress

    echo "${PRC_}% nginx" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

    DIR_SUCCESS=1
    while [ "${DIR_SUCCESS}" != "10" ]; do
        sleep 3
        DIR_SUCCESS=$((1+${DIR_SUCCESS}))
        if [ -d "/home/${LOCAL_DOMAIN}/" ]; then
            ln -s /home/"${LOCAL_DOMAIN}"/ /root/"${LOCAL_DOMAIN}" >/dev/null
            DIR_SUCCESS=10
        fi
    done

    if [ "`docker ps -aq -f status=running -f name=^/nginx\$ 2>/dev/null`" != "" ]; then
        docker restart nginx >>/var/log/docker_install_"$(date '+%d_%m_%Y')".log 2>&1
    else
        if [ "${CP_IP}" = "domain" ] \
        && [ "`netstat -tunlp | grep 0.0.0.0:80`" = "" ] \
        && [ "`netstat -tunlp | grep :::80`" = "" ]; then
            # docker build -t cinemapress/nginx https://github.com/CinemaPress/CinemaPress.git#:config/default/nginx
            # docker build -t cinemapress/fail2ban https://github.com/CinemaPress/CinemaPress.git#:config/default/fail2ban
            # docker build -t cinemapress/filestash https://github.com/CinemaPress/CinemaPress.git#:config/default/filestash

            BOTS=""
            if [ ! -f "/etc/nginx/bots.d/blacklist-user-agents.conf" ] && [ -d "/home/${LOCAL_DOMAIN}/config/production/nginx/bots.d/" ]; then
                mkdir -p /etc/nginx/bots.d
                cp -rf /home/${LOCAL_DOMAIN}/config/production/nginx/bots.d/* /etc/nginx/bots.d/
                BOTS="-v /etc/nginx/bots.d:/etc/nginx/bots.d"
            fi

            docker run \
                -d \
                --name nginx \
                --restart always \
                --network cinemapress \
                -v /var/log/nginx:/var/log/nginx \
                -v /etc/nginx/bots.d:/etc/nginx/bots.d \
                -v /var/local/images:/var/local/images \
                -v /var/local/balancer:/var/local/balancer \
                -v /var/ngx_pagespeed_cache:/var/ngx_pagespeed_cache \
                -v /home:/home \
                ${BOTS} \
                -p 80:80 \
                -p 443:443 \
                cinemapress/nginx:latest >>/var/log/docker_install_"$(date '+%d_%m_%Y')".log 2>&1

            NGINX_RUN=1
            while [ "${NGINX_RUN}" != "50" ]; do
                sleep 3
                NGINX_RUN=$((1+${NGINX_RUN}))
                if [ "`docker ps -aq -f status=running -f name=^/nginx\$ 2>/dev/null`" != "" ]; then
                    NGINX_RUN=50
                fi
            done

            sh_progress

            echo "${PRC_}% fail2ban" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

            if [ ! -f "/var/log/nginx/access.log" ]; then touch "/var/log/nginx/access.log"; fi
            if [ ! -f "/var/log/auth.log" ]; then touch "/var/log/auth.log"; fi

            docker run \
                -d \
                --name fail2ban \
                --restart always \
                --network host \
                --cap-add NET_ADMIN \
                --cap-add NET_RAW \
                -v /home/${LOCAL_DOMAIN}/config/production/fail2ban:/data \
                -v /var/log:/var/log:ro \
                cinemapress/fail2ban:latest >>/var/log/docker_install_"$(date '+%d_%m_%Y')".log 2>&1

            FAIL2BAN_RUN=1
            while [ "${FAIL2BAN_RUN}" != "50" ]; do
                sleep 3
                FAIL2BAN_RUN=$((1+${FAIL2BAN_RUN}))
                if [ "`docker ps -aq -f status=running -f name=^/fail2ban\$ 2>/dev/null`" != "" ]; then
                    FAIL2BAN_RUN=50
                fi
            done

            sh_progress

            echo "${PRC_}% filestash" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

            docker run \
                -d \
                --name filestash \
                --restart always \
                --network cinemapress \
                cinemapress/filestash >>/var/log/docker_install_"$(date '+%d_%m_%Y')".log 2>&1

            FILESTASH_RUN=1
            while [ "${FILESTASH_RUN}" != "50" ]; do
                sleep 3
                FILESTASH_RUN=$((1+${FILESTASH_RUN}))
                if [ "`docker ps -aq -f status=running -f name=^/filestash\$ 2>/dev/null`" != "" ]; then
                    docker exec "${LOCAL_DOMAIN_}" /usr/bin/cinemapress container ftp
                    FILESTASH_RUN=50
                fi
            done

        fi
    fi
}
2_update() {
    LOCAL_DOMAIN=${1:-${CP_DOMAIN}}
    LOCAL_DOMAIN_=`echo ${LOCAL_DOMAIN} | sed -r "s/[^A-Za-z0-9]/_/g"`

    echo "${PRC_}% update" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

    CHECK_MEGA=$(docker exec "${LOCAL_DOMAIN_}" /usr/bin/cinemapress container rclone config show 2>/dev/null | grep "CINEMAPRESS")

    if [ "${CHECK_MEGA}" = "" ]; then
        _header "WARNING"
        _content
        _content "You have no configuration to create a backup!"
        _content
        _content "Configure for MEGA.nz cloud storage in one line:"
        _content
        printf "     ~# cinemapress b %s config \"email\" \"pass\"" "${LOCAL_DOMAIN}"
        _br
        _content
        _content "email - your email on MEGA.nz"
        _content "pass - your password on MEGA.nz"
        _content
        _s
        exit 0
    fi

    KILOBYTE_ALL=$(df -k /home | tail -1 | awk '{print $4}')
    KILOBYTE_DIR=614400
    if [ "${KILOBYTE_ALL}" -lt "${KILOBYTE_DIR}" ]; then
        _header "WARNING"
        _content
        _content "Less than 600 MB of free space left on the server!"
        _content "You need to increase disk space."
        _content
        _s
        exit 0
    fi

    AA=`grep "\"CP_ALL\"" /home/${LOCAL_DOMAIN}/process.json`
    KK=`grep "\"key\"" /home/${LOCAL_DOMAIN}/config/default/config.js`
    DD=`grep "\"date\"" /home/${LOCAL_DOMAIN}/config/default/config.js`
    PP=`grep "\"pagespeed\"" /home/${LOCAL_DOMAIN}/config/production/config.js`
    CP_ALL=`echo "${AA}" | sed 's/.*"CP_ALL":\s*"\([a-zA-Z0-9_| -]*\)".*/\1/'`
    CP_KEY=`echo ${KK} | sed 's/.*"key":\s*"\(FREE\|[a-zA-Z0-9-]\{32\}\)".*/\1/'`
    CP_DATE=`echo ${DD} | sed 's/.*"date":\s*"\([0-9-]*\)".*/\1/'`
    CP_SPEED=`echo ${PP} | sed 's/.*"pagespeed":\s*\([0-9]\{1\}\).*/\1/'`
    if [ "${CP_ALL}" = "" ] || [ "${CP_ALL}" = "${AA}" ]; then CP_ALL=""; fi
    DISABLE_SSL=$(grep "#ssl" /home/"${LOCAL_DOMAIN}"/config/production/nginx/conf.d/default.conf 2>/dev/null)
    rm -rf /home/"${LOCAL_DOMAIN}"/config/production/nginx/conf.d/default.conf
    mkdir -p /var/temp
    if [ ! -d /var/temp/nginx ]; then
        mkdir -p /var/temp/nginx
        cp -rf /home/"${LOCAL_DOMAIN}"/config/production/nginx/* /var/temp/nginx/ 2>/dev/null
    fi
    if [ ! -d /var/temp/windows ] && [ -d /home/"${LOCAL_DOMAIN}"/files/windows ]; then
        mv -f /home/"${LOCAL_DOMAIN}"/files/windows /var/temp/windows 2>/dev/null
    fi
    if [ ! -d /var/temp/linux ] && [ -d /home/"${LOCAL_DOMAIN}"/files/linux ]; then
        mv -f /home/"${LOCAL_DOMAIN}"/files/linux /var/temp/linux 2>/dev/null
    fi
    if [ ! -d /var/temp/osx ] && [ -d /home/"${LOCAL_DOMAIN}"/files/osx ]; then
        mv -f /home/"${LOCAL_DOMAIN}"/files/osx /var/temp/osx 2>/dev/null
    fi
    if [ ! -d /var/temp/poster ]; then
        mv -f /home/"${LOCAL_DOMAIN}"/files/poster /var/temp/poster 2>/dev/null
    fi
    if [ ! -d /var/temp/picture ]; then
        mv -f /home/"${LOCAL_DOMAIN}"/files/picture /var/temp/picture 2>/dev/null
    fi
    3_backup "${LOCAL_DOMAIN}" "create"
    8_remove "${LOCAL_DOMAIN}" "full" "safe"
    if [ ! -d /var/temp/sphinx ]; then
        mkdir -p /var/temp/sphinx
        cp -rf /var/lib/sphinx/data/* /var/temp/sphinx/ 2>/dev/null
    fi
    1_install "${LOCAL_DOMAIN}"
    if [ -d /var/temp/sphinx ] && [ -d /var/lib/sphinx/data ]; then
        cp -rf /var/temp/sphinx/* /var/lib/sphinx/data/ 2>/dev/null
        rm -rf /var/temp/sphinx
    fi
    if [ -d /var/temp/nginx ] && [ -d /home/"${LOCAL_DOMAIN}"/config/production/nginx ]; then
        cp -rf /var/temp/nginx/* /home/"${LOCAL_DOMAIN}"/config/production/nginx/ 2>/dev/null
        rm -rf /var/temp/nginx
    fi
    if [ -d /var/temp/windows ] && [ ! -d /home/"${LOCAL_DOMAIN}"/files/windows ]; then
        mv -f /var/temp/windows /home/"${LOCAL_DOMAIN}"/files/windows 2>/dev/null
    fi
    if [ -d /var/temp/linux ] && [ ! -d /home/"${LOCAL_DOMAIN}"/files/linux ]; then
        mv -f /var/temp/linux /home/"${LOCAL_DOMAIN}"/files/linux 2>/dev/null
    fi
    if [ -d /var/temp/osx ] && [ ! -d /home/"${LOCAL_DOMAIN}"/files/osx ]; then
        mv -f /var/temp/osx /home/"${LOCAL_DOMAIN}"/files/osx 2>/dev/null
    fi
    if [ -d /var/temp/poster ]; then
        mv -f /var/temp/poster /home/"${LOCAL_DOMAIN}"/files/poster 2>/dev/null
    fi
    if [ -d /var/temp/picture ]; then
        mv -f /var/temp/picture /home/"${LOCAL_DOMAIN}"/files/picture 2>/dev/null
    fi
    3_backup "${LOCAL_DOMAIN}" "restore"
    docker exec nginx nginx -s reload >>/var/log/docker_update_"$(date '+%d_%m_%Y')".log 2>&1
    if [ "${CP_ALL}" != "" ]; then
        sed -E -i "s/\"CP_ALL\":\s*\"[a-zA-Z0-9_| -]*\"/\"CP_ALL\":\"${CP_ALL}\"/" \
            /home/${LOCAL_DOMAIN}/process.json
    fi
    if [ "${CP_KEY}" != "" ]; then
        sed -E -i "s/\"key\":\s*\"(FREE|[a-zA-Z0-9-]{32})\"/\"key\":\"${CP_KEY}\"/" \
            /home/${LOCAL_DOMAIN}/config/production/config.js
        sed -E -i "s/\"key\":\s*\"(FREE|[a-zA-Z0-9-]{32})\"/\"key\":\"${CP_KEY}\"/" \
            /home/${LOCAL_DOMAIN}/config/default/config.js
    fi
    if [ "${CP_DATE}" != "" ]; then
        sed -E -i "s/\"date\":\s*\"[0-9-]*\"/\"date\":\"${CP_DATE}\"/" \
            /home/${LOCAL_DOMAIN}/config/production/config.js
        sed -E -i "s/\"date\":\s*\"[0-9-]*\"/\"date\":\"${CP_DATE}\"/" \
            /home/${LOCAL_DOMAIN}/config/default/config.js
    fi
    if [ "${CP_SPEED}" != "" ]; then
        sed -E -i "s/\"pagespeed\":\s*[0-9]*/\"pagespeed\":${CP_SPEED}/" \
            /home/${LOCAL_DOMAIN}/config/production/config.js
        docker exec ${LOCAL_DOMAIN_} /usr/bin/cinemapress container speed "${CP_SPEED}"
    fi
    if [ "${DISABLE_SSL}" = "" ]; then
        docker exec ${LOCAL_DOMAIN_} /usr/bin/cinemapress container protocol "https://"
    fi
    docker restart ${LOCAL_DOMAIN_} >>/var/log/docker_update_"$(date '+%d_%m_%Y')".log 2>&1
    sleep 10
}
3_backup() {
    LOCAL_DOMAIN=${1:-${CP_DOMAIN}}
    LOCAL_DOMAIN_=`echo ${LOCAL_DOMAIN} | sed -r "s/[^A-Za-z0-9]/_/g"`
    LOCAL_ACTION=${2} # 1 | 2 | 3 | create | restore | config
    LOCAL_MEGA_EMAIL=${3:-${MEGA_EMAIL}}
    LOCAL_MEGA_PASSWORD=${4:-${MEGA_PASSWORD}}
    LOCAL_ACTION2=${5} # 1 | 2 | create | restore
    LOCAL_DOMAIN2=${6:-${LOCAL_DOMAIN}}

    echo "${PRC_}% backup" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

    if [ -f "/var/rclone.conf" ] && [ ! -f "/home/${LOCAL_DOMAIN}/config/production/rclone.conf" ]; then
        cp -r /var/rclone.conf /home/${LOCAL_DOMAIN}/config/production/rclone.conf
    elif [ -f "/home/${LOCAL_DOMAIN}/config/production/rclone.conf" ]; then
        cp -r /home/${LOCAL_DOMAIN}/config/production/rclone.conf /var/rclone.conf
    fi

    RCS=`docker exec ${LOCAL_DOMAIN_} /usr/bin/cinemapress container rclone config show 2>/dev/null | grep "CINEMAPRESS"`

    if [ "${LOCAL_ACTION}" = "config" ] || [ "${LOCAL_ACTION}" = "3" ] || [ "${RCS}" = "" ]; then
        if [ "${LOCAL_MEGA_EMAIL}" != "" ] && [ "${LOCAL_MEGA_PASSWORD}" != "" ]; then

            sh_progress

            echo "${PRC_}% config check-connection" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

            docker exec ${LOCAL_DOMAIN_} rclone config delete CINEMAPRESS \
                >>/var/log/docker_backup_"$(date '+%d_%m_%Y')".log 2>&1
            docker exec ${LOCAL_DOMAIN_} rclone config create CINEMAPRESS mega user "${LOCAL_MEGA_EMAIL}" pass "${LOCAL_MEGA_PASSWORD}" \
                >>/var/log/docker_backup_"$(date '+%d_%m_%Y')".log 2>&1
            CHECK_MKDIR=`docker exec ${LOCAL_DOMAIN_} rclone mkdir CINEMAPRESS:/check-connection 2>/dev/null`
            sleep 3
            CHECK_PURGE=`docker exec ${LOCAL_DOMAIN_} rclone purge CINEMAPRESS:/check-connection 2>/dev/null`
            if [ "${CHECK_MKDIR}" != "" ] || [ "${CHECK_PURGE}" != "" ]; then
                _header "ERROR"
                _content
                _content "Cannot connect to backup storage."
                _content
                _s
                exit 0
            fi
            cp -r /home/${LOCAL_DOMAIN}/config/production/rclone.conf /var/rclone.conf
            if [ "${LOCAL_ACTION2}" = "create" ] || [ "${LOCAL_ACTION2}" = "1" ]; then
                docker exec ${LOCAL_DOMAIN_} /usr/bin/cinemapress container backup create hand \
                    >>/var/log/docker_backup_"$(date '+%d_%m_%Y')".log 2>&1
            elif [ "${LOCAL_ACTION2}" = "restore" ] || [ "${LOCAL_ACTION2}" = "2" ]; then
                docker exec ${LOCAL_DOMAIN_} /usr/bin/cinemapress container backup restore "${LOCAL_DOMAIN2}" \
                    >>/var/log/docker_backup_"$(date '+%d_%m_%Y')".log 2>&1
                docker exec nginx nginx -s reload \
                    >>/var/log/docker_backup_"$(date '+%d_%m_%Y')".log 2>&1
            fi
        else
            _header "ERROR RCLONE CONFIG"
            _content
            _content "Configure for MEGA.nz cloud storage in one line:"
            _content
            printf "     ~# cinemapress b %s config \"email\" \"pass\"" "${LOCAL_DOMAIN}"
            _br
            _content
            _content "email - your email on MEGA.nz"
            _content "pass - your password on MEGA.nz"
            _content
            _content "after creating config, you can create/restore backup:"
            _content
            printf "     ~# cinemapress b %s create" "${LOCAL_DOMAIN}"
            _br
            printf "     ~# cinemapress b %s restore" "${LOCAL_DOMAIN}"
            _br
            _content
            _s
            exit 0
        fi
    else
        if [ "${LOCAL_ACTION}" = "" ]; then
            _header "MAKE A CHOICE"
            printf "${C}---- ${G}1)${NC} create ${S}-------------------- Create New Backup Website ${C}----\n"
            printf "${C}---- ${G}2)${NC} restore ${S}------------ Restore Website From Last Backup ${C}----\n"
            _s
            read -e -p 'OPTION [1-2]: ' LOCAL_ACTION
            LOCAL_ACTION=`echo ${LOCAL_ACTION} | iconv -c -t UTF-8`
            _br
        fi

        sh_progress

        echo "${PRC_}% backup check-connection" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

        CHECK_MKDIR=$(docker exec "${LOCAL_DOMAIN_}" rclone mkdir CINEMAPRESS:/check-connection 2>/dev/null)
        sleep 3
        CHECK_PURGE=$(docker exec "${LOCAL_DOMAIN_}" rclone purge CINEMAPRESS:/check-connection 2>/dev/null)
        if [ "${CHECK_MKDIR}" != "" ] || [ "${CHECK_PURGE}" != "" ]; then
            _header "ERROR"
            _content
            _content "Cannot connect to backup storage."
            _content
            _s
            exit 0
        fi
        if [ "${LOCAL_ACTION}" = "create" ] || [ "${LOCAL_ACTION}" = "1" ]; then
            docker exec "${LOCAL_DOMAIN_}" /usr/bin/cinemapress container backup create hand \
                >>/var/log/docker_backup_"$(date '+%d_%m_%Y')".log 2>&1
        elif [ "${LOCAL_ACTION}" = "restore" ] || [ "${LOCAL_ACTION}" = "2" ]; then
            docker exec "${LOCAL_DOMAIN_}" /usr/bin/cinemapress container backup restore \
                >>/var/log/docker_backup_"$(date '+%d_%m_%Y')".log 2>&1
            docker exec nginx nginx -s reload \
                >>/var/log/docker_backup_"$(date '+%d_%m_%Y')".log 2>&1
        fi
    fi
    sleep 10
}
4_theme() {
    LOCAL_DOMAIN=${1:-${CP_DOMAIN}}
    LOCAL_DOMAIN_=`echo ${LOCAL_DOMAIN} | sed -r "s/[^A-Za-z0-9]/_/g"`
    LOCAL_THEME=${2:-${CP_THEME}}

    echo "${PRC_}% theme" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

    YES="NOT"
    if [ -d "/home/${LOCAL_DOMAIN}/themes/${LOCAL_THEME}" ]; then
        _header "${LOCAL_THEME}";
        _content
        _content "This theme exists!"
        _content
        _s
        if [ ${3} ]
        then
            YES=${3}
            YES=`echo ${YES} | iconv -c -t UTF-8`
            echo "Update? [YES/not] : ${YES}"
        else
            read -e -p 'Update? [YES/not] : ' YES
            YES=`echo ${YES} | iconv -c -t UTF-8`
        fi
        _br

        if [ "${YES}" != "ДА" ] && [ "${YES}" != "Да" ] && [ "${YES}" != "да" ] && [ "${YES}" != "YES" ] && [ "${YES}" != "Yes" ] && [ "${YES}" != "yes" ] && [ "${YES}" != "Y" ] && [ "${YES}" != "y" ] && [ "${YES}" != "" ]
        then
            exit 0
        else
            git clone https://${GIT_SERVER}/CinemaPress/Theme-"${LOCAL_THEME}".git \
                /var/"${LOCAL_THEME}" >>/var/log/docker_theme_"$(date '+%d_%m_%Y')".log 2>&1
            mkdir -p /home/"${LOCAL_DOMAIN}"/themes/"${LOCAL_THEME}"/
            cp -rf /var/"${LOCAL_THEME}"/* /home/"${LOCAL_DOMAIN}"/themes/"${LOCAL_THEME}"/
            sed -Ei "s/\"theme\":\s*\"[a-zA-Z0-9-]*\"/\"theme\":\"${LOCAL_THEME}\"/" \
                /home/"${LOCAL_DOMAIN}"/config/production/config.js
            docker exec "${LOCAL_DOMAIN_}" node optimal.js "${LOCAL_THEME}" \
                >>/var/log/docker_theme_"$(date '+%d_%m_%Y')".log 2>&1
        fi
    else
        git clone https://${GIT_SERVER}/CinemaPress/Theme-"${LOCAL_THEME}".git \
            /var/"${LOCAL_THEME}" >>/var/log/docker_theme_"$(date '+%d_%m_%Y')".log 2>&1
        mkdir -p /home/"${LOCAL_DOMAIN}"/themes/"${LOCAL_THEME}"/
        cp -rf /var/"${LOCAL_THEME}"/* /home/"${LOCAL_DOMAIN}"/themes/"${LOCAL_THEME}"/
        sed -Ei "s/\"theme\":\s*\"[a-zA-Z0-9-]*\"/\"theme\":\"${LOCAL_THEME}\"/" \
            /home/"${LOCAL_DOMAIN}"/config/production/config.js
        docker exec "${LOCAL_DOMAIN_}" node optimal.js "${LOCAL_THEME}" \
            >>/var/log/docker_theme_"$(date '+%d_%m_%Y')".log 2>&1
    fi

    rm -rf /var/"${LOCAL_THEME:?}"

    sh_progress

    echo "${PRC_}% theme" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

    if [ "$(docker -v 2>/dev/null)" != "" ]; then
        docker restart "${LOCAL_DOMAIN_}" >>/var/log/docker_theme_"$(date '+%d_%m_%Y')".log 2>&1
    fi
    sleep 10
}
5_database() {
    LOCAL_DOMAIN=${1:-${CP_DOMAIN}}
    LOCAL_DOMAIN_=$(echo "${LOCAL_DOMAIN}" | sed -r "s/[^A-Za-z0-9]/_/g")
    LOCAL_KEY=${2:-${CP_KEY}}

    echo "${PRC_}% database" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

    STS="http://d.cinemapress.io/${LOCAL_KEY}/${LOCAL_DOMAIN}?lang=${CP_LANG}"
    CHECK=$(wget -qO- "${STS}&status=CHECK")
    if [ "${CHECK}" = "" ]; then
        _header "ERROR"
        _content
        _content "Import is a one-time procedure,"
        _content "the key is no longer available."
        _content
        _s
        exit 0
    else
        for ((io=0;io<=10;io++));
        do
            sh_progress "$(("${io}" * 10))"
            sleep 30
        done
    fi
    mkdir -p /var/lib/sphinx/tmp /var/lib/sphinx/data /var/lib/sphinx/old
    _line
    _content "Downloading ..."
    wget -qO "/var/lib/sphinx/tmp/${LOCAL_KEY}.tar" "${STS}" || \
    rm -rf "/var/lib/sphinx/tmp/${LOCAL_KEY}.tar"
    if [ -f "/var/lib/sphinx/tmp/${LOCAL_KEY}.tar" ]; then
        _content "Unpacking ..."
        NOW=$(date +%Y-%m-%d)
        tar -xf "/var/lib/sphinx/tmp/${LOCAL_KEY}.tar" -C "/var/lib/sphinx/tmp" &> \
            /var/lib/sphinx/data/"${NOW}".log
        rm -rf "/var/lib/sphinx/tmp/${LOCAL_KEY}.tar"
        FILE_SPA=$(find /var/lib/sphinx/tmp/*.* -type f | grep spa)
        FILE_SPD=$(find /var/lib/sphinx/tmp/*.* -type f | grep spd)
        FILE_SPI=$(find /var/lib/sphinx/tmp/*.* -type f | grep spi)
        FILE_SPS=$(find /var/lib/sphinx/tmp/*.* -type f | grep sps)
        if [ -f "${FILE_SPA}" ] && [ -f "${FILE_SPD}" ] && [ -f "${FILE_SPI}" ] && [ -f "${FILE_SPS}" ]; then
            _content "Installing ..."
            if [ "$(docker -v 2>/dev/null | grep "version")" = "" ]; then
                docker_stop >>/var/lib/sphinx/data/"${NOW}".log 2>&1
            else
                docker exec "${LOCAL_DOMAIN_}" /usr/bin/cinemapress container stop >>/var/lib/sphinx/data/"${NOW}".log 2>&1
            fi
            rm -rf /var/lib/sphinx/old/movies_"${LOCAL_DOMAIN_}".*
            cp -R /var/lib/sphinx/data/movies_"${LOCAL_DOMAIN_}".* /var/lib/sphinx/old/
            rm -rf /var/lib/sphinx/data/movies_"${LOCAL_DOMAIN_}".*
            # shellcheck disable=SC2044
            for file in $(find /var/lib/sphinx/tmp/*.* -type f)
            do
                mv "${file}" "/var/lib/sphinx/data/movies_${LOCAL_DOMAIN_}.${file##*.}"
            done
            sed -E -i "s/\"key\":\s*\"(FREE|[a-zA-Z0-9-]{32})\"/\"key\":\"${LOCAL_KEY}\"/" \
                /home/"${LOCAL_DOMAIN}"/config/production/config.js
            sed -E -i "s/\"date\":\s*\"[0-9-]*\"/\"date\":\"${NOW}\"/" \
                /home/"${LOCAL_DOMAIN}"/config/production/config.js
            sed -E -i "s/\"key\":\s*\"(FREE|[a-zA-Z0-9-]{32})\"/\"key\":\"${LOCAL_KEY}\"/" \
                /home/"${LOCAL_DOMAIN}"/config/default/config.js
            sed -E -i "s/\"date\":\s*\"[0-9-]*\"/\"date\":\"${NOW}\"/" \
                /home/"${LOCAL_DOMAIN}"/config/default/config.js
            if [ "$(grep \"_"${CHECK}"_\" /home/"${LOCAL_DOMAIN}"/process.json)" = "" ]; then
                CURRENT=$(grep "CP_ALL" /home/"${LOCAL_DOMAIN}"/process.json | sed 's/.*"CP_ALL":\s*"\([a-zA-Z0-9_| -]*\)".*/\1/')
                sed -E -i "s/\"CP_ALL\":\s*\"[a-zA-Z0-9_| -]*\"/\"CP_ALL\":\"${CURRENT} | _${CHECK}_\"/" \
                    /home/"${LOCAL_DOMAIN}"/process.json
            fi
            _content "Starting ..."
            if [ "$(docker -v 2>/dev/null | grep "version")" = "" ]; then
                docker_start >>/var/lib/sphinx/data/"${NOW}".log 2>&1
            else
                docker exec "${LOCAL_DOMAIN_}" /usr/bin/cinemapress container start >>/var/lib/sphinx/data/"${NOW}".log 2>&1
            fi
            wget -qO /dev/null -o /dev/null "${STS}&status=SUCCESS"
            _content "Success ..."
            _s
            exit 0
        else
            wget -qO /dev/null -o /dev/null "${STS}&status=FAIL"
            _header "ERROR"
            _content
            _content "The downloaded database archive turned out to be empty,"
            _content "please try again later."
            _content
            _s
            exit 0
        fi
    else
        wget -qO /dev/null -o /dev/null "${STS}&status=FAIL"
        _header "ERROR"
        _content
        _content "The movie database has not been downloaded,"
        _content "please try again later."
        _content
        _s
        exit 0
    fi
    sleep 10
}
6_https() {
    LOCAL_DOMAIN=${1:-${CP_DOMAIN}}
    LOCAL_DOMAIN_=`echo ${LOCAL_DOMAIN} | sed -r "s/[^A-Za-z0-9]/_/g"`
    LOCAL_CLOUDFLARE_EMAIL=${2:-${CLOUDFLARE_EMAIL}}
    LOCAL_CLOUDFLARE_API_KEY=${3:-${CLOUDFLARE_API_KEY}}

    echo "${PRC_}% https" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

    NGX="/home/${LOCAL_DOMAIN}/config/production/nginx"

    if [ "${LOCAL_CLOUDFLARE_EMAIL}" != "" ] \
    && [ "${LOCAL_CLOUDFLARE_API_KEY}" != "" ]; then

        echo -e "dns_cloudflare_email = \"${LOCAL_CLOUDFLARE_EMAIL}\"\ndns_cloudflare_api_key = \"${LOCAL_CLOUDFLARE_API_KEY}\"" \
            > "${NGX}/cloudflare.ini"

        _header "Generating, please wait ..."
        _br

        sleep 5

        docker run \
            --rm \
            -v "${NGX}/ssl.d:/etc/letsencrypt" \
            -v "${NGX}/letsencrypt:/var/lib/letsencrypt" \
            -v "${NGX}/cloudflare.ini:/cloudflare.ini" \
            certbot/dns-cloudflare \
            certonly \
            --dns-cloudflare \
            --dns-cloudflare-credentials /cloudflare.ini \
            --email "support@${LOCAL_DOMAIN}" \
            --non-interactive \
            --agree-tos \
            -d "${LOCAL_DOMAIN}" \
            -d "*.${LOCAL_DOMAIN}" \
            --server https://acme-v02.api.letsencrypt.org/directory \
                >>/var/log/https_"$(date '+%d_%m_%Y')".log 2>&1

        sleep 15

        if [ -d "${NGX}/ssl.d/live/${LOCAL_DOMAIN}/" ]; then
            openssl dhparam -out "${NGX}/ssl.d/live/${LOCAL_DOMAIN}/dhparam.pem" 2048 \
                >>/var/log/https_"$(date '+%d_%m_%Y')".log 2>&1
            sed -Ei "s/self-signed/live/g" "${NGX}/ssl.d/default.conf"
            sed -Ei "s/#ssl //g" "${NGX}/conf.d/default.conf"
            sed -Ei "s/\"protocol\":\s*\"http:/\"protocol\":\"https:/" \
                "/home/${LOCAL_DOMAIN}/config/production/config.js"
            docker restart "${LOCAL_DOMAIN_}" \
                >>/var/log/https_"$(date '+%d_%m_%Y')".log 2>&1
            _header "Generating wildcard certificate, completed successfully!"
            _br
        else
            _header "ERROR"
            _content
            _content "Wildcard SSL certificate is not generated,"
            _content "check the correct Email and Global API Key."
            _content
            _s
        fi
    elif [ "${LOCAL_CLOUDFLARE_EMAIL}" = "ss" ]; then
        rm -rf "${NGX}"/ssl.d/self-signed/"${LOCAL_DOMAIN}"
        mkdir -p "${NGX}"/ssl.d/self-signed/"${LOCAL_DOMAIN}"
        openssl req \
            -x509 \
            -nodes \
            -days 3650 \
            -subj "/C=CA/ST=QC/O=${LOCAL_DOMAIN}/CN=${LOCAL_DOMAIN}" \
            -addext "subjectAltName=DNS:${LOCAL_DOMAIN}" \
            -newkey rsa:2048 \
            -keyout "${NGX}"/ssl.d/self-signed/"${LOCAL_DOMAIN}"/privkey.pem \
            -out "${NGX}"/ssl.d/self-signed/"${LOCAL_DOMAIN}"/fullchain.pem
        openssl dhparam \
            -out "${NGX}"/ssl.d/self-signed/"${LOCAL_DOMAIN}"/dhparam.pem 2048
        sed -Ei "s/live/self-signed/g" "${NGX}/ssl.d/default.conf"
        sed -Ei "s/#ssl //g" "${NGX}/conf.d/default.conf"
        sed -Ei "s/\"protocol\":\s*\"http:/\"protocol\":\"https:/" \
            /home/"${LOCAL_DOMAIN}"/config/production/config.js
        docker restart "${LOCAL_DOMAIN_}" \
            >>/var/log/https_"$(date '+%d_%m_%Y')".log 2>&1
        _header "Generating self-signed certificate, completed successfully!"
        _br
    fi
    sleep 10
}
7_mirror() {
    LOCAL_DOMAIN=${1:-${CP_DOMAIN}}
    LOCAL_DOMAIN_=`echo ${LOCAL_DOMAIN} | sed -r "s/[^A-Za-z0-9]/_/g"`

    LOCAL_MIRROR=${2:-${CP_MIRROR}}
    LOCAL_MIRROR_=`echo ${LOCAL_MIRROR} | sed -r "s/[^A-Za-z0-9]/_/g"`

    if [ ! -f "/home/${LOCAL_MIRROR}/process.json" ]; then
        if [ -f "/home/${LOCAL_DOMAIN}/process.json" ]; then
            M_="${LOCAL_MIRROR_}"
            LOCAL_MIRROR="${LOCAL_DOMAIN}"
            LOCAL_MIRROR_="${LOCAL_DOMAIN_}"
            LOCAL_DOMAIN=""
            LOCAL_DOMAIN_="${M_}"
        else
            _header "ERROR"
            _content
            _content "First create a mirror website ${LOCAL_MIRROR},"
            _content "import the movie database and"
            _content "configure HTTPS on it (if you use it)."
            _content
            _s
            exit 0
        fi
    fi

    sh_progress

    echo "${PRC_}% mirror" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

    docker stop ${LOCAL_MIRROR_} >>/var/log/docker_mirror_"$(date '+%d_%m_%Y')".log 2>&1
    if [ -f "/home/${LOCAL_DOMAIN}/process.json" ]; then
        3_backup "${LOCAL_DOMAIN}" "create"
        docker stop ${LOCAL_DOMAIN_} \
            >>/var/log/docker_mirror_"$(date '+%d_%m_%Y')".log 2>&1
        rm -rf \
            /home/${LOCAL_MIRROR}/config/comment \
            /home/${LOCAL_MIRROR}/config/content \
            /home/${LOCAL_MIRROR}/config/rt \
            /home/${LOCAL_MIRROR}/config/user
        cp -r \
            /home/${LOCAL_DOMAIN}/config/comment \
            /home/${LOCAL_MIRROR}/config/comment
        cp -r \
            /home/${LOCAL_DOMAIN}/config/content \
            /home/${LOCAL_MIRROR}/config/content
        cp -r \
            /home/${LOCAL_DOMAIN}/config/rt \
            /home/${LOCAL_MIRROR}/config/rt
        cp -r \
            /home/${LOCAL_DOMAIN}/config/user \
            /home/${LOCAL_MIRROR}/config/user
        cp -r \
            /home/${LOCAL_DOMAIN}/config/production/config.js \
            /home/${LOCAL_MIRROR}/config/production/config.js
        cp -r \
            /home/${LOCAL_DOMAIN}/config/production/modules.js \
            /home/${LOCAL_MIRROR}/config/production/modules.js
        cp -r \
            /home/${LOCAL_DOMAIN}/themes/default/public/desktop/* \
            /home/${LOCAL_MIRROR}/themes/default/public/desktop/
        cp -r \
            /home/${LOCAL_DOMAIN}/themes/default/public/mobile/* \
            /home/${LOCAL_MIRROR}/themes/default/public/mobile/
        cp -r \
            /home/${LOCAL_DOMAIN}/themes/default/views/mobile/* \
            /home/${LOCAL_MIRROR}/themes/default/views/mobile/
        cp -r \
            /home/${LOCAL_DOMAIN}/files/* \
            /home/${LOCAL_MIRROR}/files/
        sed -Ei \
            "s/${LOCAL_DOMAIN_}:3000/${LOCAL_MIRROR_}:3000/g" \
            /home/${LOCAL_DOMAIN}/config/production/nginx/conf.d/default.conf
    fi
    if [ "${LOCAL_DOMAIN_}" != "" ]; then
        for f in /home/${LOCAL_MIRROR}/config/comment/comment_${LOCAL_DOMAIN_}.*; do
            mv -f "${f}" "`echo ${f} | sed s/comment_${LOCAL_DOMAIN_}/comment_${LOCAL_MIRROR_}/`" 2>/dev/null
        done
        for f in /home/${LOCAL_MIRROR}/config/content/content_${LOCAL_DOMAIN_}.*; do
            mv -f "${f}" "`echo ${f} | sed s/content_${LOCAL_DOMAIN_}/content_${LOCAL_MIRROR_}/`" 2>/dev/null
        done
        for f in /home/${LOCAL_MIRROR}/config/rt/rt_${LOCAL_DOMAIN_}.*; do
            mv -f "${f}" "`echo ${f} | sed s/rt_${LOCAL_DOMAIN_}/rt_${LOCAL_MIRROR_}/`" 2>/dev/null
        done
        for f in /home/${LOCAL_MIRROR}/config/user/user_${LOCAL_DOMAIN_}.*; do
            mv -f "${f}" "`echo ${f} | sed s/user_${LOCAL_DOMAIN_}/user_${LOCAL_MIRROR_}/`" 2>/dev/null
        done
    fi
    CURRENT=`grep "CP_ALL" /home/${LOCAL_MIRROR}/process.json | sed 's/.*"CP_ALL":\s*"\([a-zA-Z0-9_| -]*\)".*/\1/'`
    CURRENT=`echo "${CURRENT}" | sed "s/_${LOCAL_MIRROR_}_ | //"`
    CURRENT=`echo "${CURRENT}" | sed "s/_${LOCAL_DOMAIN_}_ | //"`
    CURRENT=`echo "${CURRENT}" | sed "s/ | _${LOCAL_MIRROR_}_//"`
    CURRENT=`echo "${CURRENT}" | sed "s/ | _${LOCAL_DOMAIN_}_//"`
    CURRENT=`echo "${CURRENT}" | sed "s/_${LOCAL_MIRROR_}_//"`
    CURRENT=`echo "${CURRENT}" | sed "s/_${LOCAL_DOMAIN_}_//"`
    if [ "${CURRENT}" != "" ]; then CURRENT=" | ${CURRENT}"; fi
    if [ -f "/home/${LOCAL_DOMAIN}/process.json" ] && [ ! -f "/home/${LOCAL_MIRROR}/process.json" ]; then
        sed -E -i "s/\"CP_ALL\":\s*\"[a-zA-Z0-9_| -]*\"/\"CP_ALL\":\"_${LOCAL_DOMAIN_}_ | _${LOCAL_MIRROR_}_${CURRENT}\"/" /home/${LOCAL_MIRROR}/process.json
    else
        sed -E -i "s/\"CP_ALL\":\s*\"[a-zA-Z0-9_| -]*\"/\"CP_ALL\":\"_${LOCAL_MIRROR_}_ | _${LOCAL_DOMAIN_}_${CURRENT}\"/" /home/${LOCAL_MIRROR}/process.json
    fi

    sh_progress

    echo "${PRC_}% mirror2" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

    docker start ${LOCAL_MIRROR_} \
        >>/var/log/docker_mirror_"$(date '+%d_%m_%Y')".log 2>&1
    docker exec nginx nginx -s reload \
        >>/var/log/docker_mirror_"$(date '+%d_%m_%Y')".log 2>&1
    sleep 10
}
8_remove() {
    LOCAL_DOMAIN=${1:-${CP_DOMAIN}}
    LOCAL_DOMAIN_=`echo ${LOCAL_DOMAIN} | sed -r "s/[^A-Za-z0-9]/_/g"`
    LOCAL_FULL=${2}
    LOCAL_SAFE=${3}

    echo "${PRC_}% remove" >>/var/log/docker_log_"$(date '+%d_%m_%Y')".log

    if [ "${LOCAL_SAFE}" = "safe" ] && [ -f "/home/${LOCAL_DOMAIN}/config/production/config.js" ]; then
        T=`grep "\"theme\"" /home/${LOCAL_DOMAIN}/config/production/config.js`
        L=`grep "\"language\"" /home/${LOCAL_DOMAIN}/config/production/config.js`
        CP_THEME=`echo ${T} | sed 's/.*"theme":\s*"\([a-zA-Z0-9-]*\)".*/\1/'`
        CP_LANG=`echo ${L} | sed 's/.*"language":\s*"\([a-z]*\)".*/\1/'`
        if [ "${CP_THEME}" = "" ] \
        || [ "${CP_LANG}" = "" ] \
        || [ "${CP_THEME}" = "${T}" ] \
        || [ "${CP_LANG}" = "${L}" ]; then
            _header "ERROR"
            _content
            _content "The field has an invalid value:"
            _content "CP_THEME: ${CP_THEME}"
            _content "CP_LANG: ${CP_LANG}"
            _content
            _line
            exit 0
        fi
    fi
    docker stop ${LOCAL_DOMAIN_} >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
    docker rm -f ${LOCAL_DOMAIN_} >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
    docker pull cinemapress/docker:latest >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
    sed -i "s/.*${LOCAL_DOMAIN}.*//g" /etc/crontab &> /dev/null
    rm -rf /home/${LOCAL_DOMAIN:?}
    if [ "${LOCAL_FULL}" != "" ]; then
        echo "STOP NGINX" >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        docker stop nginx >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        echo "RM NGINX" >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        docker rm -f nginx >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        echo "PULL NGINX" >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        docker pull cinemapress/nginx:latest >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        echo "STOP FAIL2BAN" >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        docker stop fail2ban >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        echo "RM FAIL2BAN" >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        docker rm -f fail2ban >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        echo "PULL FAIL2BAN" >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        docker pull cinemapress/fail2ban:latest >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        echo "STOP FILESTASH" >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        docker stop filestash >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        echo "RM FILESTASH" >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        docker rm -f filestash >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        echo "PULL FILESTASH" >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
        docker pull cinemapress/filestash:latest >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
    fi
    echo "RMI OLD" >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
    docker rmi -f $(docker images -f 'dangling=true' -q) >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
    sleep 10
}

option() {
    clear
    _line
    _logo
    _header "MAKE A CHOICE"
    printf "${C}---- ${G}1)${NC} install ${S}------------------ Create Movies / TV Website ${C}----\n"
    printf "${C}---- ${G}2)${NC} update ${S}------------------- Upgrade CinemaPress System ${C}----\n"
    printf "${C}---- ${G}3)${NC} backup ${S}-------------------- Backup System Master Data ${C}----\n"
    printf "${C}---- ${G}4)${NC} theme ${S}------------- Install / Update Website Template ${C}----\n"
    printf "${C}---- ${G}5)${NC} database ${S}------------- Import All Movies In The World ${C}----\n"
    printf "${C}---- ${G}6)${NC} https ${S}-------------- Getting Wildcard SSL Certificate ${C}----\n"
    printf "${C}---- ${G}7)${NC} mirror ${S}------------------------- Moving To New Domain ${C}----\n"
    printf "${C}---- ${G}8)${NC} remove ${S}---------------------------- Uninstall Website ${C}----\n"
    _s
    AGAIN=1
    while [ "${AGAIN}" -lt "10" ]
    do
        if [ ${1} ]
        then
            OPTION=${1}
            echo "OPTION [1-8]: ${OPTION}"
        else
            read -e -p 'OPTION [1-8]: ' OPTION
            OPTION=`echo ${OPTION} | iconv -c -t UTF-8`
        fi
        if [ "${OPTION}" != "" ]
        then
            if echo "${OPTION}" | grep -qE ^\-?[0-9a-z]+$
            then
               AGAIN=10
            else
                printf "${R}WARNING:${NC} Enter the number of the option. \n"
                AGAIN=$((${AGAIN}+1))
            fi
        else
            printf "${R}WARNING:${NC} Make your choice. \n"
            AGAIN=$((${AGAIN}+1))
        fi
    done
    printf "\n${NC}"
}

read_domain() {
    CP_DOMAIN=${1:-${CP_DOMAIN}}
    if [ "${CP_DOMAIN}" = "" ]; then
        _header "DOMAIN NAME OR IP"
        AGAIN=1
        while [ "${AGAIN}" -lt "10" ]
        do
            if [ ${1} ]
            then
                CP_DOMAIN=${1}
                CP_DOMAIN=`echo ${CP_DOMAIN} | iconv -c -t UTF-8`
                echo ": ${CP_DOMAIN}"
            else
                AUTO_DOMAIN=""
                cd /home && for D in *; do
                    if [ -d "$D" ] && [ "${AUTO_DOMAIN}" = "" ]; then
                        AUTO_DOMAIN="$D"
                    fi
                done
                if [ "${AUTO_DOMAIN}" = "" ]; then
                    read -e -p ': ' CP_DOMAIN
                else
                    read -e -p ': ' -i "${AUTO_DOMAIN}" CP_DOMAIN
                fi
                CP_DOMAIN=`echo ${CP_DOMAIN} | iconv -c -t UTF-8`
            fi
            if [ "${CP_DOMAIN}" != "" ]
            then
                if echo "${CP_DOMAIN}" | grep -qE ^\-?[.a-z0-9-]+$
                then
                    CP_DOMAIN_=`echo ${CP_DOMAIN} | sed -r "s/[^A-Za-z0-9]/_/g" | sed -r "s/www\.//g" | sed -r "s/http:\/\///g" | sed -r "s/https:\/\///g"`
                    if [ "`expr "${CP_DOMAIN}" : '[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$'`" != "0" ]; then
                        CP_IP="ip"
                    fi
                    AGAIN=10
                else
                    printf "${NC}         You entered: ${R}${CP_DOMAIN}${NC} \n"
                    printf "${R}WARNING:${NC} Only latin lowercase characters, \n"
                    printf "${NC}         numbers, dots, and hyphens are allowed! \n"
                    AGAIN=$((${AGAIN}+1))
                fi
            else
                printf "${R}WARNING:${NC} Domain name cannot be blank. \n"
                AGAIN=$((${AGAIN}+1))
            fi
        done
        if [ "${CP_DOMAIN}" = "" ]; then exit 1; fi
    fi
    if [ "`expr "${CP_DOMAIN}" : '[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$'`" != "0" ]; then
        while [ "`netstat -tunlp 2>/dev/null | grep :${EXTERNAL_PORT}`" != "" ]; do
            RND=`sh_random 1 9999`
            EXTERNAL_PORT=$((30000+${RND}))
        done
        if [ "`netstat -tunlp | grep 0.0.0.0:80`" = "" ] \
        && [ "`netstat -tunlp | grep :::80`" = "" ]; then
            EXTERNAL_PORT="80"
        fi
        EXTERNAL_DOCKER="-p ${EXTERNAL_PORT}:3000"
        CP_IP="ip"
    fi
    CP_DOMAIN_=`echo ${CP_DOMAIN} | sed -r "s/[^A-Za-z0-9]/_/g"`
}
read_mirror() {
    CP_MIRROR=${1:-${CP_MIRROR}}
    if [ "${CP_MIRROR}" = "" ]; then
        _header "MIRROR WEBSITE"
        AGAIN=1
        while [ "${AGAIN}" -lt "10" ]
        do
            if [ ${1} ]
            then
                CP_MIRROR=${1}
                CP_MIRROR=`echo ${CP_MIRROR} | iconv -c -t UTF-8`
                echo ": ${CP_MIRROR}"
            else
                read -e -p ': ' CP_MIRROR
                CP_MIRROR=`echo ${CP_MIRROR} | iconv -c -t UTF-8`
            fi
            if [ "${CP_MIRROR}" != "" ]
            then
                if echo "${CP_MIRROR}" | grep -qE ^\-?[.a-z0-9-]+$
                then
                    if [ "${CP_DOMAIN}" = "${CP_MIRROR}" ]
                    then
                        printf "${R}WARNING:${NC} The mirror of the website cannot be \n"
                        printf "${NC}         the same as the domain of the main website! \n"
                        AGAIN=$((${AGAIN}+1))
                    else
                        CP_MIRROR_=`echo ${CP_MIRROR} | sed -r "s/[^A-Za-z0-9]/_/g" | sed -r "s/www\.//g" | sed -r "s/http:\/\///g" | sed -r "s/https:\/\///g"`
                        AGAIN=10
                    fi
                else
                    printf "${NC}         You entered: ${R}${CP_MIRROR}${NC} \n"
                    printf "${R}WARNING:${NC} Only latin lowercase characters, \n"
                    printf "${NC}         numbers, dots, and hyphens are allowed! \n"
                    AGAIN=$((${AGAIN}+1))
                fi
            else
                printf "${R}WARNING:${NC} Mirror domain name cannot be blank. \n"
                AGAIN=$((${AGAIN}+1))
            fi
        done
        if [ "${CP_MIRROR}" = "" ]; then exit 1; fi
    fi
    CP_MIRROR_=`echo ${CP_MIRROR} | sed -r "s/[^A-Za-z0-9]/_/g" | sed -r "s/www\.//g" | sed -r "s/http:\/\///g" | sed -r "s/https:\/\///g"`
}
read_theme() {
    CP_THEME=${1:-${CP_THEME}}
    if [ "${CP_THEME}" = "" ]; then
        _header "WEBSITE THEME"
        AGAIN=1
        while [ "${AGAIN}" -lt "10" ]
        do
            if [ ${1} ]
            then
                CP_THEME=${1}
                CP_THEME=$(echo ${CP_THEME} | iconv -c -t UTF-8)
                echo ": ${CP_THEME}"
            else
                read -e -p ': ' -i "mormont" CP_THEME
                CP_THEME=$(echo ${CP_THEME} | iconv -c -t UTF-8)
            fi
            if [ "${CP_THEME}" = "" ]
            then
                AGAIN=10
                CP_THEME='tarly'
                echo ": ${CP_THEME}"
            else
                if [ "${CP_THEME}" = "default" ] || [ "${CP_THEME}" = "hodor" ] || [ "${CP_THEME}" = "sansa" ] || [ "${CP_THEME}" = "robb" ] || [ "${CP_THEME}" = "ramsay" ] || [ "${CP_THEME}" = "tyrion" ] || [ "${CP_THEME}" = "cersei" ] || [ "${CP_THEME}" = "joffrey" ] || [ "${CP_THEME}" = "drogo" ] || [ "${CP_THEME}" = "bran" ] || [ "${CP_THEME}" = "arya" ] || [ "${CP_THEME}" = "mormont" ] || [ "${CP_THEME}" = "tarly" ] || [ "${CP_THEME}" = "daenerys" ]
                then
                    AGAIN=10
                else
                    printf "%s         There is no such theme! \n" "${NC}"
                    printf "%sWARNING:%s Currently there are theme: hodor, sansa, robb, ramsay, tyrion, \n" "${R}" "${NC}"
                    printf "%s         cersei, joffrey, drogo, bran, arya, mormont, tarly и daenerys \n" "${NC}"
                    AGAIN=$(("${AGAIN}"+1))
                fi
            fi
        done
        if [ "${CP_THEME}" = "" ]; then exit 1; fi
    fi
}
read_password() {
    CP_PASSWD=${1:-${CP_PASSWD}}
    if [ "${CP_PASSWD}" = "" ]; then
        _header "PASSWORD ADMIN PANEL"
        AGAIN=1
        while [ "${AGAIN}" -lt "10" ]
        do
            if [ ${1} ]
            then
                CP_PASSWD=${1}
                CP_PASSWD=`echo ${CP_PASSWD} | iconv -c -t UTF-8`
                echo ": ${CP_PASSWD}"
            else
                read -e -p ': ' -i "`echo ${RANDOM} | tr '[0-9]' '[a-z]'`${RANDOM}`echo ${RANDOM} | tr '[0-9]' '[a-z]'`" CP_PASSWD
                CP_PASSWD=`echo ${CP_PASSWD} | iconv -c -t UTF-8`
            fi
            if [ "${CP_PASSWD}" != "" ]
            then
                AGAIN=10
            else
                printf "${R}WARNING:${NC} Admin panel password cannot be empty. \n"
                AGAIN=$((${AGAIN}+1))
            fi
        done
        if [ "${CP_PASSWD}" = "" ]; then exit 1; fi
    fi
}
read_key() {
    CP_KEY=${1:-${CP_KEY}}
    if [ "${CP_KEY}" = "" ]; then
        _header "DATABASE KEY"
        AGAIN=1
        while [ "${AGAIN}" -lt "10" ]
        do
            if [ ${1} ]; then
                CP_KEY=${1}
                CP_KEY=`echo ${CP_KEY} | iconv -c -t UTF-8`
                echo ": ${CP_KEY}"
            else
                read -e -p ': ' CP_KEY
                CP_KEY=`echo ${CP_KEY} | iconv -c -t UTF-8`
            fi
            if [ "${CP_KEY}" != "" ]
            then
                if echo "${CP_KEY}" | grep -qE ^\-?[A-Za-z0-9]+$
                then
                    AGAIN=10
                else
                    printf "${NC}         You entered: ${R}${CP_KEY}${NC} \n "
                    printf "${R}WARNING:${NC} Only latin characters \n "
                    printf "${NC}         and numbers! \n "
                    AGAIN=$((${AGAIN}+1))
                fi
            else
                printf "${R}WARNING:${NC} You can purchase a key \n "
                printf "${NC}         in the admin panel of your website. \n "
                AGAIN=$((${AGAIN}+1))
            fi
        done
        if [ "${CP_KEY}" = "" ]; then exit 1; fi
    fi
    if [ "${CP_LANG}" = "" ]; then
        L=`grep "\"language\"" /home/${CP_DOMAIN}/config/production/config.js`
        CP_LANG=`echo "${L}" | sed 's/.*"language":\s*"\([a-z]*\)".*/\1/'`
        if [ "${CP_LANG}" = "" ] \
        || [ "${CP_LANG}" = "${L}" ]; then
            _header "ERROR";
            _content
            _content "Failed to determine"
            _content "the language of the website."
            _content
            _s
            exit 0
        fi
    fi
}
read_lang() {
    CP_LANG=${1:-${CP_LANG}}
    if [ "${CP_LANG}" = "" ]; then
        _header "WEBSITE LANGUAGE"
        AGAIN=1
        while [ "${AGAIN}" -lt "10" ]
        do
            if [ ${1} ]
            then
                CP_LANG=${1}
                CP_LANG=`echo ${CP_LANG} | iconv -c -t UTF-8`
                echo ": ${CP_LANG}"
            else
                read -e -p ': ' -i "en" CP_LANG
                CP_LANG=`echo ${CP_LANG} | iconv -c -t UTF-8`
            fi
            if [ "${CP_LANG}" = "" ]
            then
                AGAIN=10
                CP_LANG='en'
                echo ": ${CP_LANG}"
            else
                if [ "${CP_LANG}" = "ru" ] || [ "${CP_LANG}" = "en" ] || [ "${CP_LANG}" = "Русский" ] || [ "${CP_LANG}" = "English" ] || [ "${CP_LANG}" = "русский" ] || [ "${CP_LANG}" = "english" ]
                then
                    if [ "${CP_LANG}" = "ru" ] || [ "${CP_LANG}" = "Русский" ] || [ "${CP_LANG}" = "русский" ]
                    then
                        CP_LANG="ru"
                    else
                        CP_LANG="en"
                    fi
                    AGAIN=10
                else
                    printf "${NC}         There is no such language! \n"
                    printf "${R}WARNING:${NC} Currently there are \n"
                    printf "${NC}         languages: ru and en. \n"
                    AGAIN=$((${AGAIN}+1))
                fi
            fi
        done
        if [ "${CP_LANG}" = "" ]; then exit 1; fi
    fi
}
read_cloudflare_email() {
    CLOUDFLARE_EMAIL=${1:-${CLOUDFLARE_EMAIL}}
    if [ "${CLOUDFLARE_EMAIL}" = "" ]; then
        _header "CLOUDFLARE EMAIL"
        AGAIN=1
        while [ "${AGAIN}" -lt "10" ]
        do
            if [ ${1} ]
            then
                CLOUDFLARE_EMAIL=${1}
                CLOUDFLARE_EMAIL=`echo ${CLOUDFLARE_EMAIL} | iconv -c -t UTF-8`
                echo ": ${CLOUDFLARE_EMAIL}"
            else
                read -e -p ': ' CLOUDFLARE_EMAIL
                CLOUDFLARE_EMAIL=`echo ${CLOUDFLARE_EMAIL} | iconv -c -t UTF-8`
            fi
            if [ "${CLOUDFLARE_EMAIL}" != "" ]
            then
                if echo "${CLOUDFLARE_EMAIL}" | grep -qE ^\-?[.a-zA-Z0-9@_-]+$
                then
                    AGAIN=10
                else
                    printf "${NC}         You entered: ${R}${CLOUDFLARE_EMAIL}${NC} \n"
                    printf "${R}WARNING:${NC} Only latin characters, @, numbers, \n"
                    printf "${NC}         dots, underscore and hyphens are allowed! \n"
                    AGAIN=$((${AGAIN}+1))
                fi
            fi
        done
        if [ "${CLOUDFLARE_EMAIL}" = "" ]; then exit 1; fi
    fi
}
read_cloudflare_api_key() {
    CLOUDFLARE_API_KEY=${1:-${CLOUDFLARE_API_KEY}}
    if [ "${CLOUDFLARE_API_KEY}" = "" ]; then
        _header "CLOUDFLARE API KEY"
        AGAIN=1
        while [ "${AGAIN}" -lt "10" ]
        do
            if [ ${1} ]
            then
                CLOUDFLARE_API_KEY=${1}
                CLOUDFLARE_API_KEY=`echo ${CLOUDFLARE_API_KEY} | iconv -c -t UTF-8`
                echo ": ${CLOUDFLARE_API_KEY}"
            else
                read -e -p ': ' CLOUDFLARE_API_KEY
                CLOUDFLARE_API_KEY=`echo ${CLOUDFLARE_API_KEY} | iconv -c -t UTF-8`
            fi
            if [ "${CLOUDFLARE_API_KEY}" != "" ]
            then
                if echo "${CLOUDFLARE_API_KEY}" | grep -qE ^\-?[.a-zA-Z0-9-]+$
                then
                    AGAIN=10
                else
                    printf "${NC}         You entered: ${R}${CLOUDFLARE_API_KEY}${NC} \n"
                    printf "${R}WARNING:${NC} Only latin characters \n"
                    printf "${NC}         and numbers are allowed! \n"
                    AGAIN=$((${AGAIN}+1))
                fi
            fi
        done
        if [ "${CLOUDFLARE_API_KEY}" = "" ]; then exit 1; fi
    fi
}
read_mega_email() {
    MEGA_EMAIL=${1:-${MEGA_EMAIL}}
    if [ "${MEGA_EMAIL}" = "" ]; then
        _header "MEGA EMAIL"
        AGAIN=1
        while [ "${AGAIN}" -lt "10" ]
        do
            if [ ${1} ]
            then
                MEGA_EMAIL=${1}
                MEGA_EMAIL=`echo ${MEGA_EMAIL} | iconv -c -t UTF-8`
                echo ": ${MEGA_EMAIL}"
            else
                read -e -p ': ' MEGA_EMAIL
                MEGA_EMAIL=`echo ${MEGA_EMAIL} | iconv -c -t UTF-8`
            fi
            if [ "${MEGA_EMAIL}" != "" ]
            then
                if echo "${MEGA_EMAIL}" | grep -qE ^\-?[.a-zA-Z0-9@_-]+$
                then
                    AGAIN=10
                else
                    printf "${NC}         You entered: ${R}${MEGA_EMAIL}${NC} \n"
                    printf "${R}WARNING:${NC} Only latin characters, @, numbers, \n"
                    printf "${NC}         dots, underscore and hyphens are allowed! \n"
                    AGAIN=$((${AGAIN}+1))
                fi
            fi
        done
        if [ "${MEGA_EMAIL}" = "" ]; then exit 1; fi
    fi
}
read_mega_password() {
    MEGA_PASSWORD=${1:-${MEGA_PASSWORD}}
    if [ "${MEGA_PASSWORD}" = "" ]; then
        _header "MEGA PASSWORD"
        AGAIN=1
        while [ "${AGAIN}" -lt "10" ]
        do
            if [ ${1} ]
            then
                MEGA_PASSWORD=${1}
                MEGA_PASSWORD=`echo ${MEGA_PASSWORD} | iconv -c -t UTF-8`
                echo ": ${MEGA_PASSWORD}"
            else
                read -e -p ': ' MEGA_PASSWORD
                MEGA_PASSWORD=`echo ${MEGA_PASSWORD} | iconv -c -t UTF-8`
            fi
            if [ "${MEGA_PASSWORD}" != "" ]
            then
                AGAIN=10
            fi
        done
        if [ "${MEGA_PASSWORD}" = "" ]; then exit 1; fi
    fi
}
read_cms() {
    NAME_CMS=${1:-${NAME_CMS}}
    if [ "${NAME_CMS}" = "" ]; then
        _header "NAME CMS"
        AGAIN=1
        while [ "${AGAIN}" -lt "10" ]
        do
            if [ ${1} ]
            then
                NAME_CMS=${1}
                NAME_CMS=`echo ${NAME_CMS} | iconv -c -t UTF-8`
                echo ": ${NAME_CMS}"
            else
                read -e -p ': ' -i "php-mysql" NAME_CMS
                NAME_CMS=`echo ${NAME_CMS} | iconv -c -t UTF-8`
            fi
            if [ "${NAME_CMS}" = "" ]
            then
                AGAIN=10
                NAME_CMS='php-mysql'
                echo ": ${NAME_CMS}"
            else
                if [ "${NAME_CMS}" = "php-mysql" ] || [ "${NAME_CMS}" = "wordpress" ] || [ "${NAME_CMS}" = "drupal" ] || [ "${NAME_CMS}" = "joomla" ] || [ "${NAME_CMS}" = "dle" ] || [ "${NAME_CMS}" = "backup" ]
                then
                    AGAIN=10
                else
                    printf "${NC}         There is no such CMS! \n"
                    printf "${R}WARNING:${NC} Currently there are \n"
                    printf "${NC}         CMS: wordpress, drupal, joomla, dle and php-mysql. \n"
                    AGAIN=$((${AGAIN}+1))
                fi
            fi
        done
        if [ "${NAME_CMS}" = "" ]; then exit 1; fi
    fi
}
read_os() {
    NAME_OS=${1:-${NAME_OS}}
    if [ "${NAME_OS}" = "" ]; then
        _header "NAME OS"
        AGAIN=1
        while [ "${AGAIN}" -lt "10" ]
        do
            if [ ${1} ]
            then
                NAME_OS=${1}
                NAME_OS=`echo ${NAME_OS} | iconv -c -t UTF-8`
                echo ": ${NAME_OS}"
            else
                read -e -p ': ' -i "windows" NAME_OS
                NAME_OS=`echo ${NAME_OS} | iconv -c -t UTF-8`
            fi
            if [ "${NAME_OS}" = "" ]
            then
                AGAIN=10
                NAME_OS='windows'
                echo ": ${NAME_OS}"
            else
                if [ "${NAME_OS}" = "macos" ] || [ "${NAME_OS}" = "ios" ]  || [ "${NAME_OS}" = "apple" ]
                then
                    NAME_OS="osx"
                fi
                if [ "${NAME_OS}" = "windows" ] || [ "${NAME_OS}" = "linux" ]  || [ "${NAME_OS}" = "osx" ]
                then
                    AGAIN=10
                else
                    printf "${NC}         There is no such OS! \n"
                    printf "${R}WARNING:${NC} Currently there are \n"
                    printf "${NC}         OS: windows, linux and osx. \n"
                    AGAIN=$((${AGAIN}+1))
                fi
            fi
        done
        if [ "${NAME_OS}" = "" ]; then exit 1; fi
    fi
}
read_app() {
    APP_DOMAIN=${1:-${APP_DOMAIN}}
    if [ "${APP_DOMAIN}" = "" ]; then
        _header "DOMAIN NAME FOR SPLASH SCREEN"
        AGAIN=1
        while [ "${AGAIN}" -lt "10" ]
        do
            if [ ${1} ]
            then
                APP_DOMAIN=${1}
                APP_DOMAIN=`echo ${APP_DOMAIN} | iconv -c -t UTF-8`
                echo ": ${APP_DOMAIN}"
            else
                read -e -p ': ' APP_DOMAIN
                APP_DOMAIN=`echo ${APP_DOMAIN} | iconv -c -t UTF-8`
            fi
            if [ "${APP_DOMAIN}" != "" ]
            then
                if echo "${APP_DOMAIN}" | grep -qE ^\-?[.a-z0-9-]+$
                then
                    APP_DOMAIN_=`echo ${APP_DOMAIN} | sed -r "s/[^A-Za-z0-9]/_/g" | sed -r "s/www\.//g" | sed -r "s/http:\/\///g" | sed -r "s/https:\/\///g"`
                    AGAIN=10
                else
                    printf "${NC}         You entered: ${R}${APP_DOMAIN}${NC} \n"
                    printf "${R}WARNING:${NC} Only latin lowercase characters, \n"
                    printf "${NC}         numbers, dots, and hyphens are allowed! \n"
                    AGAIN=$((${AGAIN}+1))
                fi
            else
                printf "${R}WARNING:${NC} Domain name for splash screen cannot be blank. \n"
                AGAIN=$((${AGAIN}+1))
            fi
        done
        if [ "${APP_DOMAIN}" = "" ]; then exit 1; fi
    fi
    APP_DOMAIN_=`echo ${APP_DOMAIN} | sed -r "s/[^A-Za-z0-9]/_/g"`
}
read_import() {
    IMPORT_DOMAIN=${1:-${IMPORT_DOMAIN}}
    if [ "${IMPORT_DOMAIN}" = "" ]; then
        _header "IMPORT DOMAIN NAME"
        AGAIN=1
        while [ "${AGAIN}" -lt "10" ]
        do
            if [ ${1} ]
            then
                IMPORT_DOMAIN=${1}
                IMPORT_DOMAIN=`echo ${IMPORT_DOMAIN} | iconv -c -t UTF-8`
                echo ": ${IMPORT_DOMAIN}"
            else
                read -e -p ': ' IMPORT_DOMAIN
                IMPORT_DOMAIN=`echo ${IMPORT_DOMAIN} | iconv -c -t UTF-8`
            fi
            if [ "${IMPORT_DOMAIN}" != "" ]
            then
                if echo "${IMPORT_DOMAIN}" | grep -qE ^\-?[.a-z0-9-]+$
                then
                    IMPORT_DOMAIN_=`echo ${IMPORT_DOMAIN} | sed -r "s/[^A-Za-z0-9]/_/g" | sed -r "s/www\.//g" | sed -r "s/http:\/\///g" | sed -r "s/https:\/\///g"`
                    AGAIN=10
                else
                    printf "${NC}         You entered: ${R}${IMPORT_DOMAIN}${NC} \n"
                    printf "${R}WARNING:${NC} Only latin lowercase characters, \n"
                    printf "${NC}         numbers, dots, and hyphens are allowed! \n"
                    AGAIN=$((${AGAIN}+1))
                fi
            else
                printf "${R}WARNING:${NC} Import domain name cannot be blank. \n"
                AGAIN=$((${AGAIN}+1))
            fi
        done
        if [ "${IMPORT_DOMAIN}" = "" ]; then exit 1; fi
    fi
    IMPORT_DOMAIN_=`echo ${IMPORT_DOMAIN} | sed -r "s/[^A-Za-z0-9]/_/g"`
}

sh_yes() {
    if [ -f "/home/${CP_DOMAIN}/process.json" ]; then
        clear
        _line
        _logo
        _header "${CP_DOMAIN}";
        _content
        _content "Website on this domain is installed!"
        _content
        _s
        exit 0
    fi
}
sh_not() {
    if [ ! -f "/home/${CP_DOMAIN}/process.json" ]; then
        clear
        _line
        _logo
        _header "${CP_DOMAIN}";
        _content
        _content "Website on this domain is not installed!"
        _content
        _s
        exit 0
    fi
}
sh_random() {
    FLOOR=${1}
    RANGE=${2}
    number=0
    while [ "${number}" -le ${FLOOR} ]
    do
      number=$RANDOM
      let "number %= $RANGE"
    done
    echo ${number}
}
sh_wget() {
    local flag=false c count cr=$'\r' nl=$'\n'
    while IFS='' read -d '' -rn 1 c
    do
        if $flag
        then
            printf '%s' "$c"
        else
            if [[ $c != $cr && $c != $nl ]]
            then
                count=0
            else
                ((count++))
                if ((count > 1))
                then
                    flag=true
                fi
            fi
        fi
    done
}
sh_progress() {
    if [ "${PRC_}" = "" ]; then PRC_=0; fi
    if [ "${1}" != "" ]; then PRC_=${1}; fi
    LR='\033[1;31m'; LG='\033[1;32m'; LY='\033[1;33m'; LC='\033[1;36m'; LW='\033[1;37m'; NC='\033[0m'
    if [ "${PRC_}" = "0" ]; then TME=$(date +"%s"); fi
    SEC=`printf "%04d\n" $(($(date +"%s")-${TME}))`; SEC="$SEC sec"
    PRC=`printf "%.0f" ${PRC_}`
    SHW=`printf "%3d\n" ${PRC}`
    LNE=`printf "%.0f" $((${PRC}/2))`
    LRR=`printf "%.0f" $((${PRC}/2-12))`; if [ ${LRR} -le 0 ]; then LRR=0; fi;
    LYY=`printf "%.0f" $((${PRC}/2-24))`; if [ ${LYY} -le 0 ]; then LYY=0; fi;
    LCC=`printf "%.0f" $((${PRC}/2-36))`; if [ ${LCC} -le 0 ]; then LCC=0; fi;
    LGG=`printf "%.0f" $((${PRC}/2-48))`; if [ ${LGG} -le 0 ]; then LGG=0; fi;
    LRR_=""; LYY_=""; LCC_=""; LGG_=""
    for ((i=1;i<=13;i++))
    do
        DOTS=""; for ((ii=${i};ii<13;ii++)); do DOTS="${DOTS}."; done
        if [ ${i} -le ${LNE} ]; then LRR_="${LRR_}#"; else LRR_="${LRR_}."; fi
        echo -ne "  ${LW}${SEC}  ${LR}${LRR_}${DOTS}${LY}............${LC}............${LG}............ ${SHW}%${NC}\r"
        if [ ${LNE} -ge 1 ]; then sleep .05; fi
    done
    for ((i=14;i<=25;i++))
    do
        DOTS=""; for ((ii=${i};ii<25;ii++)); do DOTS="${DOTS}."; done
        if [ ${i} -le ${LNE} ]; then LYY_="${LYY_}#"; else LYY_="${LYY_}."; fi
        echo -ne "  ${LW}${SEC}  ${LR}${LRR_}${LY}${LYY_}${DOTS}${LC}............${LG}............ ${SHW}%${NC}\r"
        if [ ${LNE} -ge 14 ]; then sleep .05; fi
    done
    for ((i=26;i<=37;i++))
    do
        DOTS=""; for ((ii=${i};ii<37;ii++)); do DOTS="${DOTS}."; done
        if [ ${i} -le ${LNE} ]; then LCC_="${LCC_}#"; else LCC_="${LCC_}."; fi
        echo -ne "  ${LW}${SEC}  ${LR}${LRR_}${LY}${LYY_}${LC}${LCC_}${DOTS}${LG}............ ${SHW}%${NC}\r"
        if [ ${LNE} -ge 26 ]; then sleep .05; fi
    done
    for ((i=38;i<=49;i++))
    do
        DOTS=""; for ((ii=${i};ii<49;ii++)); do DOTS="${DOTS}."; done
        if [ ${i} -le ${LNE} ]; then LGG_="${LGG_}#"; else LGG_="${LGG_}."; fi
        echo -ne "  ${LW}${SEC}  ${LR}${LRR_}${LY}${LYY_}${LC}${LCC_}${LG}${LGG_}${DOTS} ${SHW}%${NC}\r"
        if [ ${LNE} -ge 38 ]; then sleep .05; fi
    done
    if [ "${PRC}" = "100" ]; then
        printf "\n\n${NC}"
    fi
    PRC_=$((10+${PRC_}))
    if [ ${PRC_} -gt 100 ]; then PRC_=100; fi
}

_content_l() {
    __C=${1}; _M=$((${#__C})); _L=1; _R=$((57-${_M})); L_=""; R_=""
    if [ "$((${#__C}%2))" != "0" ]; then _R=$((${_R})); fi
    for ((l=1;l<=${_L};l++)); do L_=" ${L_}"; done
    for ((r=1;r<=${_R};r++)); do R_=" ${R_}"; done
    printf "${C}----${NC}${L_}${1}${R_}${C}----\n${NC}"
}
_content() {
    __C=${1}; _M=$((${#__C}/2)); _L=$((29-${_M})); _R=$((29-${_M})); L_=""; R_=""
    if [ "$((${#__C}%2))" != "0" ]; then _R=$((${_R}-1)); fi
    for ((l=1;l<=${_L};l++)); do L_=" ${L_}"; done
    for ((r=1;r<=${_R};r++)); do R_=" ${R_}"; done
    printf "${C}----${NC}${L_}${1}${R_}${C}----\n${NC}"
}
_header() {
    _C=${1}; _M=$((${#_C}/2)); _L=$((31-${_M})); _R=$((31-${_M})); L_=""; R_=""
    if [ "$((${#_C}%2))" != "0" ]; then _R=$((${_R}-1)); fi
    for ((l=1;l<=${_L};l++)); do L_="-${L_}"; done
    for ((r=1;r<=${_R};r++)); do R_="-${R_}"; done
    printf "${C}${L_}[ ${Y}${1}${C} ]${R_}\n${NC}"
}
_logo() {
    printf  "  ${B} _______ ${G}_                        ${B} ______  ${G}                     \n"
    printf  "  ${B}(_______${G}|_)                       ${B}(_____ \ ${G}                     \n"
    printf  "  ${B} _      ${G} _ ____  _____ ____  _____${B} _____) )${G}___ _____  ___  ___  \n"
    printf  "  ${B}| |     ${G}| |  _ \| ___ |    \(____ ${B}|  ____/ ${G}___) ___ |/___)/___) \n"
    printf  "  ${B}| |_____${G}| | | | | ____| | | / ___ ${B}| |   ${G}| |   | ____|___ |___ | \n"
    printf  "  ${B} \______)${G}_|_| |_|_____)_|_|_\_____${B}|_|   ${G}|_|   |_____|___/(___/  \n"
    printf "\n${NC}"
}
_line() {
    printf "${C}------------------------------------------------------------------\n${NC}"
}
_br() {
    printf "\n${NC}"
}
_s() {
    if [ "${1}" = "" ]; then
        _line
        _br
    else
        _br
    fi
}

docker_run() {
    if [ ! -d "/home/${CP_DOMAIN}/config/production" ]; then
        find /var/cinemapress -maxdepth 1 -type f -iname '\.gitkeep' -delete
        cp -rf /var/cinemapress/* /home/${CP_DOMAIN}
        rm -rf /var/cinemapress/* /var/${CP_THEME:?}
        cp -rf /home/${CP_DOMAIN}/config/locales/${CP_LANG}/* /home/${CP_DOMAIN}/config/
        cp -rf /home/${CP_DOMAIN}/config/default/* /home/${CP_DOMAIN}/config/production/
        cp -rf /home/${CP_DOMAIN}/files/bbb.mp4 /var/local/balancer/bbb.mp4
        sed -Ei "s/127.0.0.1:3000/${CP_DOMAIN_}:3000/g" /home/${CP_DOMAIN}/config/production/nginx/conf.d/default.conf
        sed -Ei "s/example_com/${CP_DOMAIN_}/g" /home/${CP_DOMAIN}/config/production/nginx/pagespeed.d/default.conf
        sed -Ei "s/example_com/${CP_DOMAIN_}/g" /home/${CP_DOMAIN}/config/production/nginx/conf.d/default.conf
        sed -Ei "s/example_com/${CP_DOMAIN_}/g" /home/${CP_DOMAIN}/config/production/nginx/error.d/default.conf
        sed -Ei "s/example_com/${CP_DOMAIN_}/g" /home/${CP_DOMAIN}/config/production/nginx/ssl.d/default.conf
        sed -Ei "s/example_com/${CP_DOMAIN_}/g" /home/${CP_DOMAIN}/config/production/sphinx/sphinx.conf
        sed -Ei "s/example_com/${CP_DOMAIN_}/g" /home/${CP_DOMAIN}/config/production/sphinx/source.xml
        sed -Ei "s/example_com/${CP_DOMAIN_}/g" /home/${CP_DOMAIN}/config/production/config.js
        sed -Ei "s/example_com/${CP_DOMAIN_}/g" /home/${CP_DOMAIN}/config/default/config.js
        sed -Ei "s/example_com/${CP_DOMAIN_}/g" /home/${CP_DOMAIN}/process.json
        sed -Ei "s/example\.com/${CP_DOMAIN}/g" /home/${CP_DOMAIN}/config/production/nginx/pagespeed.d/default.conf
        sed -Ei "s/example\.com/${CP_DOMAIN}/g" /home/${CP_DOMAIN}/config/production/nginx/conf.d/default.conf
        sed -Ei "s/example\.com/${CP_DOMAIN}/g" /home/${CP_DOMAIN}/config/production/nginx/error.d/default.conf
        sed -Ei "s/example\.com/${CP_DOMAIN}/g" /home/${CP_DOMAIN}/config/production/nginx/ssl.d/default.conf
        sed -Ei "s/example\.com/${CP_DOMAIN}/g" /home/${CP_DOMAIN}/config/production/sphinx/sphinx.conf
        sed -Ei "s/example\.com/${CP_DOMAIN}/g" /home/${CP_DOMAIN}/config/production/sphinx/source.xml
        sed -Ei "s/example\.com/${CP_DOMAIN}/g" /home/${CP_DOMAIN}/config/production/config.js
        sed -Ei "s/example\.com/${CP_DOMAIN}/g" /home/${CP_DOMAIN}/config/default/config.js
        sed -Ei "s/example\.com/${CP_DOMAIN}/g" /home/${CP_DOMAIN}/process.json
        sed -Ei "s/\"theme\":\s*\"[a-zA-Z0-9-]*\"/\"theme\":\"${CP_THEME}\"/" /home/${CP_DOMAIN}/config/production/config.js
        git clone https://${GIT_SERVER}/CinemaPress/Theme-${CP_THEME}.git /var/${CP_THEME}
        mkdir -p /home/${CP_DOMAIN}/themes/${CP_THEME}/
        cp -rf /var/${CP_THEME}/* /home/${CP_DOMAIN}/themes/${CP_THEME}/
        node /home/${CP_DOMAIN}/optimal.js
        OPENSSL=`echo "${CP_PASSWD}" | openssl passwd -1 -stdin -salt CP`
        echo "admin:${OPENSSL}" > /home/${CP_DOMAIN}/config/production/nginx/pass.d/${CP_DOMAIN}.pass
        echo "${CP_DOMAIN}:${OPENSSL}" >> /home/${CP_DOMAIN}/config/production/nginx/pass.d/${CP_DOMAIN}.pass
        if [ "${CP_IP}" = "ip" ]; then rm -rf /home/${CP_DOMAIN}/config/production/nginx/conf.d/default.conf; fi
        ln -s /home/${CP_DOMAIN}/config/production/sphinx/sphinx.conf /etc/sphinx/sphinx.conf
        ln -s /home/${CP_DOMAIN}/config/production/sphinx/source.xml /etc/sphinx/source.xml
        if [ ! -f "/var/lib/sphinx/data/movies_${CP_DOMAIN_}.sps" ]; then indexer --all; fi
        searchd
        memcached -u root -d
        node /home/${CP_DOMAIN}/config/update/default.js
    else
        searchd
        memcached -u root -d
        node /home/${CP_DOMAIN}/config/update/config.js
    fi
    crond -L /var/log/cron.log
    cd /home/${CP_DOMAIN} && pm2-runtime start process.json
}
docker_stop() {
    sed -Ei "s/\/\/app\.use\(rebooting\(\)\);/app\.use\(rebooting\(\)\);/" "/home/${CP_DOMAIN}/app.js"
    pm2 reload all
    searchd --stop
    killall memcached
    killall crond
    sleep 5
}
docker_start() {
    sed -Ei "s/app\.use\(rebooting\(\)\);/\/\/app\.use\(rebooting\(\)\);/" "/home/${CP_DOMAIN}/app.js"
    searchd
    memcached -u root -d
    crond -L /var/log/cron.log
    node /home/${CP_DOMAIN}/config/update/config.js
    cd /home/${CP_DOMAIN} && pm2 restart process.json --update-env
}
docker_restart() {
    docker_stop
    docker_start
}
docker_reload() {
    cd /home/${CP_DOMAIN} && pm2 reload process.json
}
docker_logs() {
    SHOW_ERR_LOGS=$(pm2 logs --err --lines 50 --nostream | curl -s -F 'clbin=<-' https://clbin.com)
    SHOW_OUT_LOGS=$(pm2 logs --out --lines 50 --nostream | curl -s -F 'clbin=<-' https://clbin.com)
    _header "ERR LOGS"
    _content
    _content "${SHOW_ERR_LOGS}"
    _content
    _header "OUT LOGS"
    _content
    _content "${SHOW_OUT_LOGS}"
    _content
    _s
}
docker_zero() {
    sed -i "s/xmlpipe_command =.*/xmlpipe_command =/" "/home/${CP_DOMAIN}/config/production/sphinx/sphinx.conf"
    indexer xmlpipe2_${CP_DOMAIN_} --rotate
    (sleep 2; echo flush_all; sleep 2; echo quit;) | telnet 127.0.0.1 11211
}
docker_cron() {
    node /home/"${CP_DOMAIN}"/lib/CP_cron.js >> /home/"${CP_DOMAIN}"/log/CP_cron.log
}
docker_restore() {
    WEB_DIR=${1:-${CP_DOMAIN}}
    RCS=`rclone config show 2>/dev/null | grep "CINEMAPRESS"`
    if [ "${RCS}" = "" ]; then exit 0; fi
    docker_stop
    sleep 3; rclone -vv copy CINEMAPRESS:${WEB_DIR}/latest/config.tar /var/${CP_DOMAIN}/
    sleep 3; rclone -vv copy CINEMAPRESS:${WEB_DIR}/latest/themes.tar /var/${CP_DOMAIN}/
    cd /home/${CP_DOMAIN} && \
    tar -xf /var/${CP_DOMAIN}/config.tar && \
    tar --exclude=themes/default/views/desktop \
        -xf /var/${CP_DOMAIN}/themes.tar
    mkdir -p /home/${CP_DOMAIN}/config/custom
    if [ -d "/home/${CP_DOMAIN}/config/custom" ]; then
        cp -rf /home/${CP_DOMAIN}/config/custom/* /home/${CP_DOMAIN}/
    fi
    sleep 5
    if [ -f "/home/${CP_DOMAIN}/config/comment/comment_${CP_DOMAIN_}.ram" ]; then
      COMMENTSIZE=$(wc -c <"/home/${CP_DOMAIN}/config/comment/comment_${CP_DOMAIN_}.ram")
      if [ "${COMMENTSIZE}" -le "20" ]; then
        rm -rf /home/${CP_DOMAIN}/config/comment/*;
      fi
    else
      rm -rf /home/${CP_DOMAIN}/config/comment/*;
    fi
    if [ -f "/home/${CP_DOMAIN}/config/user/user_${CP_DOMAIN_}.ram" ]; then
      USERSIZE=$(wc -c <"/home/${CP_DOMAIN}/config/user/user_${CP_DOMAIN_}.ram")
      if [ "${USERSIZE}" -le "20" ]; then
        rm -rf /home/${CP_DOMAIN}/config/user/*;
      fi
    else
      rm -rf /home/${CP_DOMAIN}/config/user/*;
    fi
    docker_start
}
docker_backup() {
    RCS=$(rclone config show 2>/dev/null | grep "CINEMAPRESS")
    if [ "${RCS}" = "" ]; then exit 0; fi
    BACKUP_DAY=$(date +%d)
    BACKUP_NOW=$(date +%Y-%m-%d)
    BACKUP_DELETE=$(date +%Y-%m-%d -d "@$(($(date +%s) - 864000))")
    T=$(grep "\"theme\"" /home/"${CP_DOMAIN}"/config/production/config.js)
    THEME_NAME=$(echo "${T}" | sed 's/.*"theme":\s*"\([a-zA-Z0-9-]*\)".*/\1/')
    if [ "${THEME_NAME}" = "" ] || [ "${THEME_NAME}" = "${T}" ]; then exit 0; fi
    PORT_DOMAIN=$(grep "mysql41" /home/"${CP_DOMAIN}"/config/production/sphinx/sphinx.conf | sed 's/.*:\([0-9]*\):mysql41.*/\1/')
    echo "FLUSH RTINDEX rt_${CP_DOMAIN_};" | mysql -h0 -P"${PORT_DOMAIN}"
    echo "FLUSH RTINDEX content_${CP_DOMAIN_};" | mysql -h0 -P"${PORT_DOMAIN}"
    echo "FLUSH RTINDEX comment_${CP_DOMAIN_};" | mysql -h0 -P"${PORT_DOMAIN}"
    echo "FLUSH RTINDEX user_${CP_DOMAIN_};" | mysql -h0 -P"${PORT_DOMAIN}"
    rm -rf /var/"${CP_DOMAIN:?}" && mkdir -p /var/"${CP_DOMAIN}"
    cd /home/"${CP_DOMAIN}" && \
    tar --ignore-failed-read \
        --exclude=config/update \
        --exclude=config/default \
        --exclude=config/locales \
        --exclude=config/production/fail2ban \
        --exclude=config/production/filestash \
        --exclude=config/production/sphinx \
        --exclude=config/production/nginx \
        -uf /var/"${CP_DOMAIN}"/config.tar \
        config
    cd /home/"${CP_DOMAIN}" && \
    tar --ignore-failed-read \
        --exclude=files/GeoLite2-Country.mmdb \
        --exclude=files/GeoLite2-ASN.mmdb \
        --exclude=files/poster \
        --exclude=files/picture \
        --exclude=files/windows \
        --exclude=files/linux \
        --exclude=files/osx \
        --exclude=files/bbb.mp4 \
        --exclude=files/content/collage.psd \
        -uf /var/"${CP_DOMAIN}"/themes.tar \
        themes/default/public/desktop \
        themes/default/public/mobile \
        themes/default/views/mobile \
        themes/"${THEME_NAME}" \
        files
    sleep 3; rclone purge CINEMAPRESS:"${CP_DOMAIN}"/"${BACKUP_NOW}" &> /dev/null
    if [ "${BACKUP_DAY}" != "10" ]; then rclone purge CINEMAPRESS:"${CP_DOMAIN}"/"${BACKUP_DELETE}" &> /dev/null; fi
    sleep 3; rclone purge CINEMAPRESS:"${CP_DOMAIN}"/latest &> /dev/null
    sleep 3; rclone -vv copy /var/"${CP_DOMAIN}"/config.tar CINEMAPRESS:"${CP_DOMAIN}"/"${BACKUP_NOW}"/
    sleep 3; rclone -vv copy /var/"${CP_DOMAIN}"/themes.tar CINEMAPRESS:"${CP_DOMAIN}"/"${BACKUP_NOW}"/
    sleep 3; rclone -vv copy /var/"${CP_DOMAIN}"/config.tar CINEMAPRESS:"${CP_DOMAIN}"/latest/
    sleep 3; rclone -vv copy /var/"${CP_DOMAIN}"/themes.tar CINEMAPRESS:"${CP_DOMAIN}"/latest/
    rm -rf /var/"${CP_DOMAIN:?}"
    KILOBYTE_ALL=$(df -k /home | tail -1 | awk '{print $4}')
    KILOBYTE_DIR=$(du -d 0 /home/"${CP_DOMAIN}"/files | cut -f1)
    RCST=$(rclone config show 2>/dev/null | grep "CINEMASTATIC")
    if [ "${1}" = "" ] && [ "${RCST}" != "" ] && [ "${BACKUP_DAY}" = "10" ] && [ "${KILOBYTE_ALL}" -gt "${KILOBYTE_DIR}" ]; then
        CHECK_MKDIR=$(rclone mkdir CINEMASTATIC:/check-connection 2>/dev/null)
        sleep 3
        CHECK_PURGE=$(rclone purge CINEMASTATIC:/check-connection 2>/dev/null)
        if [ "${CHECK_MKDIR}" = "" ] && [ "${CHECK_PURGE}" = "" ]; then
            cd /home/"${CP_DOMAIN}" && tar -uf /home/"${CP_DOMAIN}"/static.tar \
                files/poster \
                files/picture
            if [ -d "/home/${CP_DOMAIN}/files/windows" ]; then
                cd /home/"${CP_DOMAIN}" && tar -uf /home/"${CP_DOMAIN}"/app.tar \
                    files/windows \
                    files/linux \
                    files/osx &>/dev/null
                sleep 3; rclone purge CINEMASTATIC:"${CP_DOMAIN}"/app.tar &>/dev/null
                sleep 3; rclone -vv copy /home/"${CP_DOMAIN}"/app.tar CINEMASTATIC:"${CP_DOMAIN}"/
            fi
            sleep 3; rclone purge CINEMASTATIC:"${CP_DOMAIN}"/static.tar &>/dev/null
            sleep 3; rclone -vv copy /home/"${CP_DOMAIN}"/static.tar CINEMASTATIC:"${CP_DOMAIN}"/
            rm -rf /home/"${CP_DOMAIN}"/static.tar /home/"${CP_DOMAIN}"/app.tar
        fi
    fi
}
docker_actual() {
    node /home/"${CP_DOMAIN}"/config/update/actual.js
}
docker_available() {
    node /home/"${CP_DOMAIN}"/config/update/available.js "${1}"
}
docker_rclone() {
    sleep 3; rclone "${1}" "${2}"
}
docker_passwd() {
    OPENSSL=`echo "${1}" | openssl passwd -1 -stdin -salt CP`
    echo "admin:${OPENSSL}" > "/home/${CP_DOMAIN}/config/production/nginx/pass.d/${CP_DOMAIN}.pass"
    echo "${CP_DOMAIN}:${OPENSSL}" >> "/home/${CP_DOMAIN}/config/production/nginx/pass.d/${CP_DOMAIN}.pass"
}
docker_speed_on() {
    sed -Ei "s/    #pagespeed include \/home\/${CP_DOMAIN}\/config\/production\/nginx\/pagespeed\.d\/default\.conf;/    include \/home\/${CP_DOMAIN}\/config\/production\/nginx\/pagespeed.d\/default.conf;/" \
        "/home/${CP_DOMAIN}/config/production/nginx/conf.d/default.conf"
}
docker_speed_off() {
    sed -Ei "s/    include \/home\/${CP_DOMAIN}\/config\/production\/nginx\/pagespeed\.d\/default\.conf;/    #pagespeed include \/home\/${CP_DOMAIN}\/config\/production\/nginx\/pagespeed.d\/default.conf;/" \
        "/home/${CP_DOMAIN}/config/production/nginx/conf.d/default.conf"
}
docker_ssl_on() {
    if [ -d "/home/${CP_DOMAIN}/config/production/nginx/ssl.d/live/${CP_DOMAIN}/" ]; then
        sed -Ei "s/    #ssl include \/home\/${CP_DOMAIN}\/config\/production\/nginx\/ssl\.d\/default\.conf;/    include \/home\/${CP_DOMAIN}\/config\/production\/nginx\/ssl.d\/default.conf;/" \
            "/home/${CP_DOMAIN}/config/production/nginx/conf.d/default.conf"
    fi
}
docker_ssl_off() {
    sed -Ei "s/    include \/home\/${CP_DOMAIN}\/config\/production\/nginx\/ssl\.d\/default\.conf;/    #ssl include \/home\/${CP_DOMAIN}\/config\/production\/nginx\/ssl.d\/default.conf;/" \
        "/home/${CP_DOMAIN}/config/production/nginx/conf.d/default.conf"
}
docker_ftp_on() {
    sed -Ei "s/#ftp //g" "/home/${CP_DOMAIN}/config/production/nginx/conf.d/default.conf"
}

success_install(){
    CP_URL="${CP_DOMAIN}"
    if [ "${CP_IP}" = "ip" ] && [ "${EXTERNAL_PORT}" != "80" ]; then
        CP_URL="${CP_DOMAIN}:${EXTERNAL_PORT}"
    else
        docker exec -d nginx nginx -s reload
    fi
    clear
    _line
    _logo
    _header "${CP_DOMAIN}";
    _content
    if [ "${CP_IP}" = "domain" ]; then
        _content "Website successfully installed!"
    else
        _content "Test website successfully installed!"
    fi
    _content
    _content "${CP_URL}"
    _content "${CP_URL}/admin"
    if [ "${CP_IP}" = "domain" ]; then
        _content
        _content "USERNAME: admin"
        _content "PASSWORD: ${CP_PASSWD}"
    fi
    _content
    _content "We strongly recommend immediately"
    _content "setting up automatic backup!"
    _content "root@vps:~# cinemapress backup"
    _content
    _content "You have questions?"
    _content "Forum: enota.club"
    _content
    _s
    exit 0
}

if [ ${EUID} -ne 0 ]; then
	printf "${R}WARNING:${NC} Run as root user! \n${NC}"
	exit 1
fi

docker_install

WHILE=0
while [ "${WHILE}" -lt "2" ]; do
    WHILE=$((${WHILE}+1))
    case ${OPTION} in
        "i"|"install"|1 )
            read_domain ${2}
            sh_yes
            read_lang ${3}
            read_theme ${4}
            read_password ${5}
            _s ${5}
            sh_progress
            1_install ${2} ${3} ${4} ${5}
            sh_progress 100
            success_install
            post_commands
            exit 0
        ;;
        "u"|"update"|2 )
            read_domain ${2}
            sh_not
            _s ${2}
            sh_progress
            2_update ${2}
            sh_progress 100
            post_commands
            exit 0
        ;;
        "b"|"backup"|3 )
            read_domain ${2}
            sh_not
            _s ${2}
            sh_progress
            3_backup ${2} ${3} ${4} ${5} ${6} ${7}
            sh_progress 100
            exit 0
        ;;
        "t"|"theme"|4 )
            read_domain ${2}
            sh_not
            read_theme ${3}
            _s ${3}
            sh_progress
            4_theme ${2} ${3} ${4}
            sh_progress 100
            exit 0
        ;;
        "d"|"database"|5 )
            read_domain ${2}
            sh_not
            read_key ${3}
            _s ${3}
            5_database ${2} ${3}
            exit 0
        ;;
        "h"|"https"|6 )
            read_domain ${2}
            sh_not
            read_cloudflare_email ${3}
            read_cloudflare_api_key ${4}
            _s ${4}
            6_https ${2} ${3} ${4}
            post_commands
            exit 0
        ;;
        "m"|"mirror"|7 )
            read_domain ${2}
            read_mirror ${3}
            _s ${3}
            sh_progress
            7_mirror ${2} ${3}
            sh_progress 100
            exit 0
        ;;
        "r"|"rm"|"remove"|8 )
            read_domain ${2}
            sh_not
            _s ${2}
            sh_progress
            8_remove ${2} ${3} ${4}
            sh_progress 100
            exit 0
        ;;
        "en"|"ru" )
            ip_install ${1}
            exit 0
        ;;
        "passwd" )
            _br
            read_domain ${2}
            sh_not
            read_password ${3}
            _s ${3}
            sh_progress
            docker exec ${CP_DOMAIN_} /usr/bin/cinemapress container "${1}" "${CP_PASSWD}" \
                >>/var/log/docker_passwd_"$(date '+%d_%m_%Y')".log 2>&1
            sh_progress
            docker exec nginx nginx -s reload \
                >>/var/log/docker_passwd_"$(date '+%d_%m_%Y')".log 2>&1
            sh_progress 100
            exit 0
        ;;
        "images" )
            _br
            read_domain ${2}
            sh_not
            read_key ${3}
            _s ${3}
            if [ -f "/home/${CP_DOMAIN}/files/poster/.latest" ]; then
                wget --progress=bar:force -O /var/images.tar \
                    "http://d.cinemapress.io/${CP_KEY}/${CP_DOMAIN}?lang=${CP_LANG}&status=LATEST" 2>&1 | sh_wget
                if [ -f "/var/images.tar" ]; then
                    tar -xf /var/images.tar -C /home/"${CP_DOMAIN}"/files >>/var/log/docker_images_"$(date '+%d_%m_%Y')".log 2>&1
                fi
            else
                wget --progress=bar:force -O /var/images.tar \
                    "http://d.cinemapress.io/${CP_KEY}/${CP_DOMAIN}?lang=${CP_LANG}&status=IMAGES" 2>&1 | sh_wget
                if [ -f "/var/images.tar" ]; then
                    _header "UNPACKING"
                    _content
                    _content "Unpacking may take several hours ..."
                    _content
                    _s
                    touch /home/"${CP_DOMAIN}"/files/poster/.latest
                    nohup tar -xf /var/images.tar -C /home/"${CP_DOMAIN}"/files >>/var/log/docker_images_"$(date '+%d_%m_%Y')".log 2>&1 &
                fi
            fi
            exit 0
        ;;
        "premium" )
            _br
            read_domain "${2}"
            sh_not
            if [ "${4}" = "" ]; then exit 0; fi
            CP_THEME="${3}"
            CP_KEY="${4}"
            _br
            wget --progress=bar:force -O /var/"${CP_THEME}".tar \
                "http://d.cinemapress.io/${CP_KEY}/${CP_DOMAIN}?theme=${CP_THEME}" 2>&1 | sh_wget
            if [ -f "/var/${CP_THEME}.tar" ]; then
                _header "UNPACKING"
                _content
                _content "Unpacking may take several seconds ..."
                _content
                _s
                tar -xf /var/"${CP_THEME}".tar -C /home/"${CP_DOMAIN}"/themes 2>/dev/null
                sed -Ei "s/\"theme\":\s*\"[a-zA-Z0-9-]*\"/\"theme\":\"${CP_THEME}\"/" \
                    /home/"${CP_DOMAIN}"/config/production/config.js
                docker exec -t "${CP_DOMAIN_}" node optimal.js
                docker restart "${CP_DOMAIN_}" >/dev/null
            fi
            exit 0
        ;;
        "upd" )
            docker_install "UPD"
            exit 0
        ;;
        "ss"|"self-signed" )
            read_domain "${2}"
            sh_not
            _s "${2}"
            6_https "${2}" "ss"
        ;;
        "stop"|"start"|"restart" )
            _br
            read_domain ${2}
            sh_not
            _s ${2}
            docker ${1} ${CP_DOMAIN_} >>/var/log/docker_${1}_"$(date '+%d_%m_%Y')".log 2>&1
            exit 0
        ;;
        "zero" )
            _br
            read_domain ${2}
            sh_not
            _s ${2}
            _header "WARNING";
            _content
            _content "This command will delete all movies!"
            _content
            _s
            if [ ${3} ]; then
                YES=${3}
                YES=`echo ${YES} | iconv -c -t UTF-8`
                echo "Delete? [NOT/yes] : ${YES}"
            else
                read -e -p 'Delete? [NOT/yes] : ' YES
                YES=`echo ${YES} | iconv -c -t UTF-8`
            fi
            _br

            if [ "${YES}" != "ДА" ] && [ "${YES}" != "Да" ] && [ "${YES}" != "да" ] && [ "${YES}" != "YES" ] && [ "${YES}" != "Yes" ] && [ "${YES}" != "yes" ] && [ "${YES}" != "Y" ] && [ "${YES}" != "y" ]; then
                exit 0
            else
                docker exec ${CP_DOMAIN_} /usr/bin/cinemapress container zero \
                    >>/var/log/docker_zero_"$(date '+%d_%m_%Y')".log 2>&1
                exit 0
            fi
        ;;
        "reload"|"actual"|"available"|"speed"|"cron" )
            _br
            read_domain ${2}
            sh_not
            _s ${2}
            docker exec ${CP_DOMAIN_} /usr/bin/cinemapress container "${1}" "${3}" \
                >>/var/log/docker_${1}_"$(date '+%d_%m_%Y')".log 2>&1
            exit 0
        ;;
        "container" )
            if [ "${2}" = "run" ]; then
                docker_run
            elif [ "${2}" = "stop" ]; then
                docker_stop
            elif [ "${2}" = "start" ]; then
                docker_start
            elif [ "${2}" = "restart" ]; then
                docker_restart
            elif [ "${2}" = "reload" ]; then
                docker_reload
            elif [ "${2}" = "logs" ]; then
                docker_logs
            elif [ "${2}" = "zero" ]; then
                docker_zero
            elif [ "${2}" = "cron" ]; then
                docker_cron
            elif [ "${2}" = "actual" ]; then
                docker_actual
            elif [ "${2}" = "available" ]; then
                docker_available "${3}"
            elif [ "${2}" = "passwd" ]; then
                docker_passwd "${3}"
            elif [ "${2}" = "rclone" ]; then
                docker_rclone "${3}" "${4}"
            elif [ "${2}" = "backup" ]; then
                if [ "${3}" = "create" ] || [ "${3}" = "1" ]; then
                    docker_backup "${4}"
                elif [ "${3}" = "restore" ] || [ "${3}" = "2" ]; then
                    docker_restore "${4}"
                fi
            elif [ "${2}" = "speed" ]; then
                if [ "${3}" = "off" ] || [ "${3}" = "0" ]; then
                    docker_speed_off
                else
                    docker_speed_on
                fi
            elif [ "${2}" = "protocol" ]; then
                if [ "${3}" = "http://" ]; then
                    docker_ssl_off
                else
                    docker_ssl_on
                fi
            elif [ "${2}" = "ftp" ]; then
                docker_ftp_on
            fi
            exit 0
        ;;
        "combine" )
            CP_DOMAIN=""
            CP_LANG=""
            CP_THEME=""
            CP_PASSWD=""
            CP_MIRROR=""
            CP_KEY=""
            CLOUDFLARE_EMAIL=""
            CLOUDFLARE_API_KEY=""
            MEGA_EMAIL=""
            MEGA_PASSWORD=""
            if [ "${2}" = "chrm" ] || [ "${2}" = "create_https_restore_mirror" ]; then
                read_domain ${3}
                read_mirror ${4}
                read_lang ${5}
                read_theme ${6}
                read_password ${7}
                read_cloudflare_email ${8}
                read_cloudflare_api_key ${9}
                read_mega_email ${10}
                read_mega_password ${11}
                _s ${11}
                sh_progress
                1_install "${CP_MIRROR}"
                6_https "${CP_MIRROR}" "${CLOUDFLARE_EMAIL}" "${CLOUDFLARE_API_KEY}"
                3_backup "${CP_MIRROR}" "config" "${MEGA_EMAIL}" "${MEGA_PASSWORD}" "restore" "${CP_DOMAIN}"
                7_mirror "${CP_DOMAIN}" "${CP_MIRROR}"
                post_commands "${CP_MIRROR}"
                sh_progress 100
                exit 0
            elif [ "${2}" = "crm" ] || [ "${2}" = "create_restore_mirror" ]; then
                read_domain ${3}
                read_mirror ${4}
                read_lang ${5}
                read_theme ${6}
                read_password ${7}
                read_mega_email ${8}
                read_mega_password ${9}
                _s ${9}
                sh_progress
                1_install "${CP_MIRROR}"
                3_backup "${CP_MIRROR}" "config" "${MEGA_EMAIL}" "${MEGA_PASSWORD}" "restore" "${CP_DOMAIN}"
                7_mirror "${CP_DOMAIN}" "${CP_MIRROR}"
                post_commands "${CP_MIRROR}"
                sh_progress 100
                exit 0
            elif [ "${2}" = "chm" ] || [ "${2}" = "create_https_mirror" ]; then
                read_domain ${3}
                read_mirror ${4}
                read_lang ${5}
                read_theme ${6}
                read_password ${7}
                read_cloudflare_email ${8}
                read_cloudflare_api_key ${9}
                _s ${9}
                sh_progress
                1_install "${CP_MIRROR}"
                6_https "${CP_MIRROR}" "${CLOUDFLARE_EMAIL}" "${CLOUDFLARE_API_KEY}"
                7_mirror "${CP_DOMAIN}" "${CP_MIRROR}"
                post_commands "${CP_MIRROR}"
                sh_progress 100
                exit 0
            elif [ "${2}" = "chb" ] || [ "${2}" = "create_https_backup" ]; then
                read_domain ${3}
                sh_yes
                read_lang ${4}
                read_theme ${5}
                read_password ${6}
                read_cloudflare_email ${7}
                read_cloudflare_api_key ${8}
                read_mega_email ${9}
                read_mega_password ${10}
                _s ${10}
                sh_progress
                1_install "${CP_DOMAIN}"
                6_https "${CP_DOMAIN}" "${CLOUDFLARE_EMAIL}" "${CLOUDFLARE_API_KEY}"
                3_backup "${CP_DOMAIN}" "config" "${MEGA_EMAIL}" "${MEGA_PASSWORD}" "create"
                post_commands "${CP_DOMAIN}"
                sh_progress 100
                exit 0
            elif [ "${2}" = "chr" ] || [ "${2}" = "create_https_restore" ]; then
                read_domain ${3}
                sh_yes
                read_lang ${4}
                read_theme ${5}
                read_password ${6}
                read_cloudflare_email ${7}
                read_cloudflare_api_key ${8}
                read_mega_email ${9}
                read_mega_password ${10}
                _s ${10}
                sh_progress
                1_install "${CP_DOMAIN}"
                6_https "${CP_DOMAIN}" "${CLOUDFLARE_EMAIL}" "${CLOUDFLARE_API_KEY}"
                3_backup "${CP_DOMAIN}" "config" "${MEGA_EMAIL}" "${MEGA_PASSWORD}" "restore"
                post_commands "${CP_DOMAIN}"
                sh_progress 100
                exit 0
            elif [ "${2}" = "ch" ] || [ "${2}" = "create_https" ]; then
                read_domain ${3}
                sh_yes
                read_lang ${4}
                read_theme ${5}
                read_password ${6}
                read_cloudflare_email ${7}
                read_cloudflare_api_key ${8}
                _s ${8}
                sh_progress
                1_install "${CP_DOMAIN}"
                6_https "${CP_DOMAIN}" "${CLOUDFLARE_EMAIL}" "${CLOUDFLARE_API_KEY}"
                post_commands "${CP_DOMAIN}"
                sh_progress 100
                exit 0
            elif [ "${2}" = "cb" ] || [ "${2}" = "create_backup" ]; then
                read_domain ${3}
                sh_yes
                read_lang ${4}
                read_theme ${5}
                read_password ${6}
                read_mega_email ${7}
                read_mega_password ${8}
                _s ${8}
                sh_progress
                1_install "${CP_DOMAIN}"
                3_backup "${CP_DOMAIN}" "config" "${MEGA_EMAIL}" "${MEGA_PASSWORD}" "create"
                post_commands "${CP_DOMAIN}"
                sh_progress 100
                exit 0
            elif [ "${2}" = "cr" ] || [ "${2}" = "create_restore" ]; then
                read_domain ${3}
                sh_yes
                read_lang ${4}
                read_theme ${5}
                read_password ${6}
                read_mega_email ${7}
                read_mega_password ${8}
                _s ${8}
                sh_progress
                1_install "${CP_DOMAIN}"
                3_backup "${CP_DOMAIN}" "config" "${MEGA_EMAIL}" "${MEGA_PASSWORD}" "restore"
                post_commands "${CP_DOMAIN}"
                sh_progress 100
                exit 0
            fi
            exit 0
        ;;
        "autostart" )
            docker start ${CP_DOMAIN_}
            docker start nginx
            docker start fail2ban
            docker start filestash
            exit 0
        ;;
        "optimal" )
            _br
            read_domain ${2}
            sh_not
            _s ${2}
            docker exec -t ${CP_DOMAIN_} node optimal.js
            exit 0
        ;;
        "log"|"logs" )
            _br
            read_domain "${2}"
            sh_not
            _s "${2}"
            _header "DOCKER CONTAINER"
            _content
            if docker network ls | grep -q cinemapress
            then
                _content "Network: runnind"
            else
                _content "Network: stopped"
            fi
            if [ "$(docker ps -aq -f status=running -f name=^/${CP_DOMAIN_}\$ 2>/dev/null)" != "" ]; then
                _content "Website: runnind"
            else
                _content "Website: stopped"
            fi
            if [ "$(docker ps -aq -f status=running -f name=^/nginx\$ 2>/dev/null)" != "" ]; then
                NGINX_STATUS=$(docker exec -t nginx nginx -t | grep successful)
                if [ "${NGINX_STATUS}" != "" ]; then
                    _content "Nginx: runnind"
                else
                    _content "Nginx: error"
                    docker exec -t nginx nginx -t
                fi
            else
                _content "Nginx: stopped"
            fi
            if [ "$(docker ps -aq -f status=running -f name=^/fail2ban\$ 2>/dev/null)" != "" ]; then
                _content "Fail2ban: runnind"
            else
                _content "Fail2ban: stopped"
            fi
            if [ "$(docker ps -aq -f status=running -f name=^/filestash\$ 2>/dev/null)" != "" ]; then
                _content "FTP: runnind"
            else
                _content "FTP: stopped"
            fi
            _content
            _header "NGINX LOGS"
            _content
            _content "$(tail -n50 /var/log/nginx/*.log | curl -s -F 'clbin=<-' https://clbin.com)"
            _content
            docker exec -t "${CP_DOMAIN_}" /usr/bin/cinemapress container logs
            exit 0
        ;;
        "clear_vps"|"clean_vps"|"flush_vps"|"clear_all"|"clean_all"|"flush_all" )
            _br
            sh_progress
            docker rm -f $(docker ps -aq) >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
            docker rmi -f $(docker images -q) >>/var/log/docker_remove_"$(date '+%d_%m_%Y')".log 2>&1
            for D in /home/*; do
                if [ -f "${D}/process.json" ]
                then
                    DD=`find ${D} -maxdepth 0 -printf "%f"`
                    sed -i "s/.*${DD}.*//g" /etc/crontab &> /dev/null
                    rm -rf /home/${DD:?}
                fi
            done
            rm -rf /var/log/* /var/ngx_pagespeed_cache /var/lib/sphinx* /etc/nginx/bots.d
            sh_progress 100
            exit 0
        ;;
        "clear_log"|"clean_log"|"clear_logs"|"clean_logs"|"logrotate" )
            CP_SIZE=${2:-"+102400"}
            find /var/log -type f -name '*.log' -size "${CP_SIZE}" -exec rm -rf {} \; \
                >>/var/log/docker_logrotate_"$(date '+%d_%m_%Y')".log 2>&1
            find /var/log -type f -name '*.gz' -exec rm -rf {} \; \
                >>/var/log/docker_logrotate_"$(date '+%d_%m_%Y')".log 2>&1
            rm -rf /var/ngx_pagespeed_cache/*
            if [ "${CP_OS}" != "alpine" ] && [ "${CP_OS}" != "\"alpine\"" ]; then
                docker restart nginx >>/var/log/docker_logrotate_"$(date '+%d_%m_%Y')".log 2>&1
                docker restart fail2ban >>/var/log/docker_logrotate_"$(date '+%d_%m_%Y')".log 2>&1
                docker restart filestash >>/var/log/docker_logrotate_"$(date '+%d_%m_%Y')".log 2>&1
            fi
            exit 0
        ;;
        "bench"|"benchmark"|"speedtest" )
            SPEED_LOCATION=${2:-"eu"}
            bash <(wget "https://raw.githubusercontent.com/laset-com/speedtest/master/speedtest.sh" -qO-) "-${SPEED_LOCATION}"
            exit 0
        ;;
        "import" )
            if [ "${2}" = "dle" ]; then
                read_domain "${3}"
                sh_not
                read_import "${4}"
                _s "${4}"
                FILE_EXPORT="http://${IMPORT_DOMAIN}/uploads/files/${CP_DOMAIN}.xml"
                CREATE_EXPORT=$(wget -qO- "http://${IMPORT_DOMAIN}/dle2cinemapress.php?domain=${CP_DOMAIN}")
                if [ "${CREATE_EXPORT}" != "ok" ]; then
                    _header "ERROR"
                    _content
                    _content "The website ${IMPORT_DOMAIN} is temporarily unavailable,"
                    _content "please try again later."
                    _content "http://${IMPORT_DOMAIN}/dle2cinemapress.php?domain=${CP_DOMAIN}"
                    _content
                    _s
                    exit 0
                else
                    sleep 2
                fi
                _line
                _content "Downloading ..."
                wget -qO "/home/${CP_DOMAIN}/config/production/sphinx/export.xml" "${FILE_EXPORT}" || \
                rm -rf "/home/${CP_DOMAIN}/config/production/sphinx/export.xml"
                if [ -f "/home/${CP_DOMAIN}/config/production/sphinx/export.xml" ]; then
                    _content "Import ..."
                    rm -rf "/home/${CP_DOMAIN}/config/production/sphinx/source.xml"
                    mv "/home/${CP_DOMAIN}/config/production/sphinx/export.xml" \
                        "/home/${CP_DOMAIN}/config/production/sphinx/source.xml"
                    docker exec "${CP_DOMAIN_}" indexer "xmlpipe2_${CP_DOMAIN_}" --rotate >/dev/null
                    _content "Done!"
                else
                    _header "ERROR"
                    _content
                    _content "Failed to download export file,"
                    _content "please try again later."
                    _content "${FILE_EXPORT}"
                    _content
                    _s
                    exit 0
                fi
            fi
            exit 0
        ;;
        "app" )
            read_domain "${2}"
            sh_not
            if [ "${3}" = "windows" ] || [ "${3}" = "linux" ]  || [ "${3}" = "osx" ]; then
                NAME_OS="${3}"
                if [ "${4}" = "" ]; then
                    APP_DOMAIN="app.${2}"
                else
                    APP_DOMAIN="${4}"
                fi
                _br
            else
                read_os "${3}"
                read_app "${4}"
                _s "${4}"
            fi
            PROTOCOLS=$(grep "\"protocol\"" /home/"${CP_DOMAIN}"/config/production/config.js)
            PROTOCOL=$(echo "${PROTOCOLS}" | sed 's/.*"protocol":\s*"\(https\|http\).*/\1/')
            sh_progress
            sh_progress
            sh_progress
            docker run \
                -v /home/"${CP_DOMAIN}"/config/app/icons:/icons \
                -v /home/"${CP_DOMAIN}"/config/app/"${NAME_OS}":/app \
                cinemapress/app:latest \
                --name "${CP_DOMAIN_}" \
                --platform "${NAME_OS}" \
                --arch "x64" \
                --app-copyright "CinemaPress App" \
                --app-version "${CP_VER}" \
                --icon "/icons/icon.png" \
                --width "1280px" \
                --height "800px" \
                --min-width "0" \
                --min-height "0" \
                --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:99.0) Gecko/20100101 Firefox/99.0 CinemaPress App" \
                --ignore-certificate \
                --insecure \
                --internal-urls ".*?\.?${CP_DOMAIN}|.*?\.github\.io|.*?\.gitlab\.io|.*?\.bitbucket\.io|.*?\.netlify\.com|.*?\.appspot\.com|.*?\.surge\.sh|.*?\.updog\.co|.*?\.neocities\.org|.*?\.herokuapp\.com" \
                --disable-context-menu \
                --disable-dev-tools \
                --single-instance \
                --darwin-dark-mode-support \
                --background-color "#1a2035" \
                --win32metadata "{\"CompanyName\": \"${CP_DOMAIN}\",\"FileDescription\": \"${CP_DOMAIN}\",\"OriginalFilename\": \"${CP_DOMAIN}\",\"ProductName\": \"${CP_DOMAIN}\",\"InternalName\": \"${CP_DOMAIN}\"}" \
                "${PROTOCOL}://${APP_DOMAIN}" \
                >>/var/log/docker_app_"$(date '+%d_%m_%Y')".log 2>&1
            sh_progress
            CP_DOMAIN__=$(echo "${CP_DOMAIN}" | sed -r "s/[^A-Za-z0-9]/-/g")
            rm -rf /home/${CP_DOMAIN}/files/"${NAME_OS}"
            mkdir -p /home/${CP_DOMAIN}/files/"${NAME_OS}"
            mv /home/${CP_DOMAIN}/config/app/"${NAME_OS}"/"${CP_DOMAIN_}"-* \
                /home/${CP_DOMAIN}/config/app/"${NAME_OS}"/app >/dev/null 2>&1;
            mv /home/${CP_DOMAIN}/config/app/"${NAME_OS}"/"${CP_DOMAIN__}"-* \
                /home/${CP_DOMAIN}/config/app/"${NAME_OS}"/app >/dev/null 2>&1;
            if [ -f /home/${CP_DOMAIN}/config/app/"${NAME_OS}"/app/"${CP_DOMAIN_}".exe ]; then
                mv /home/${CP_DOMAIN}/config/app/"${NAME_OS}"/app/"${CP_DOMAIN_}".exe \
                    /home/${CP_DOMAIN}/config/app/"${NAME_OS}"/app/app.exe
            fi
            cd /home/${CP_DOMAIN}/config/app/"${NAME_OS}" && \
            zip -rq /home/${CP_DOMAIN}/files/"${NAME_OS}"/app_"${CP_VER}".zip app
            rm -rf /home/${CP_DOMAIN}/config/app/"${NAME_OS}"
            sh_progress 100
            _line
            _header "//${CP_DOMAIN}/files/${NAME_OS}/app_${CP_VER}.zip"
            _line
            _br
            exit 0
        ;;
        "splash" )
            if [ "${4}" = "" ]; then exit 0; fi
            _br
            sh_progress
            GIT=${5:-github}
            PROTOCOLS=$(grep "\"protocol\"" /home/"${2}"/config/production/config.js)
            PROTOCOL=$(echo "${PROTOCOLS}" | sed 's/.*"protocol":\s*"\(https\|http\).*/\1/')
            cd /home/"${2}"/files/splash && \
            echo "config" >> .gitignore && \
            echo "screen.html" >> .gitignore && \
            git init >/dev/null 2>&1; \
            cp -rf config .git/config; \
            cp -rf screen.html index.html; \
            sed -Ei "s/\/\/example\.com/${PROTOCOL}:\/\/app.${2}/g" index.html; \
            sed -Ei "s/config_name/${3}/g" .git/config; \
            sed -Ei "s/config_password/${4}/g" .git/config; \
            if [ "${GIT}" != "github" ]; then
              sed -Ei "s/github/gitlab/g" .git/config;
            fi;
            git add . >/dev/null 2>&1; \
            git commit -a -m "${3}" >/dev/null 2>&1; \
            git push --force >/dev/null 2>&1
            sh_progress
            sleep 20
            sh_progress 100
            _line
            _header "DOMAIN NAME FOR SPLASH SCREEN"
            _line
            _header "${3}.${GIT}.io"
            _line
            _br
            exit 0
        ;;
        "cms" )
            read_domain ${2}
            sh_yes
            read_cms "${3}"
            _s ${3}
            NAME_CMS=${NAME_CMS:-}
            MYSQL_PASSWORD="$(date +%s%N | sha256sum | base64 | head -c 12)"
            MYSQL_DATABASE="${CP_DOMAIN_}"
            MYSQL_USER="${CP_DOMAIN_}"
            ADMIN_USER="cinemaadmin"
            ADMIN_PASSWORD="$(date +%s%N | sha256sum | base64 | head -c 12)"
            if [ "${NAME_CMS}" = "backup" ] && [ "${4}" = "create" ]; then
                if [ -f "/var/lib/cinemapress/dump/backup.sql" ]; then
                    echo "ERROR: Backup file found /var/lib/cinemapress/dump/backup.sql"
                    exit 0
                fi
                docker exec mysql sh -c 'exec mysqldump -A -uroot' \
                    > "/var/lib/cinemapress/dump/backup.sql"
                echo "SUCCESS: Backup file /var/lib/cinemapress/dump/backup.sql"
                exit 0
            fi
            if [ "${NAME_CMS}" = "backup" ] && [ "${4}" = "restore" ]; then
                if [ ! -f "/var/lib/cinemapress/dump/restore.sql" ]; then
                    echo "ERROR: Restore file not found /var/lib/cinemapress/dump/restore.sql"
                    exit 0
                fi
                docker exec -i mysql sh -c 'exec mysql -uroot' \
                    < "/var/lib/cinemapress/dump/restore.sql"
                echo "SUCCESS: Restore file /var/lib/cinemapress/dump/restore.sql"
                exit 0
            fi
            mkdir -p /var/lib/cinemapress/php
            mkdir -p /var/lib/cinemapress/mysql
            mkdir -p /var/lib/cinemapress/dump
            mkdir -p /home/${CP_DOMAIN}/config/production/nginx/conf.d
            mkdir -p /home/${CP_DOMAIN}/config/production/nginx/pass.d
            if [ ! "$(docker ps -a | grep php)" ]; then
                docker run \
                    -d \
                    --name php \
                    --restart always \
                    --network cinemapress \
                    -v /var/lib/cinemapress/php:/var/lib/php \
                    -v /home:/home \
                    chialab/php:7.4-fpm
            fi
            if [ ! "$(docker ps -a | grep mysql)" ]; then
                docker run \
                    -d \
                    --name mysql \
                    --restart always \
                    --network cinemapress \
                    -v /var/lib/cinemapress/mysql:/var/lib/mysql \
                    -e MYSQL_ALLOW_EMPTY_PASSWORD=yes \
                    mariadb:10 \
                    --character-set-server=utf8mb4 \
                    --collation-server=utf8mb4_unicode_ci
            fi
            sleep 30
            docker exec mysql sh -c \
                "exec mysql -uroot -e \"FLUSH PRIVILEGES;CREATE DATABASE ${MYSQL_DATABASE} /*\!40100 DEFAULT CHARACTER SET utf8mb4 */;CREATE USER '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${MYSQL_USER}'@'%';FLUSH PRIVILEGES;\""
            sleep 30
            docker exec mysql sh -c \
                "exec mysql -uroot -e \"FLUSH PRIVILEGES;DROP USER '${MYSQL_USER}'@'%';CREATE USER '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${MYSQL_USER}'@'%';FLUSH PRIVILEGES;\""
            if [ ! "$(docker ps -a | grep adminer)" ]; then
                docker run \
                    -d \
                    --name adminer \
                    --network cinemapress \
                    -e ADMINER_DEFAULT_SERVER=mysql \
                    -e ADMINER_DESIGN='galkaev' \
                    adminer:fastcgi
                OPENSSL=`echo "${ADMIN_PASSWORD}" | openssl passwd -1 -stdin -salt CP`
                echo "cinemaadmin:${OPENSSL}" > /home/${CP_DOMAIN}/config/production/nginx/pass.d/${CP_DOMAIN}.pass
            fi
            if [ "${NAME_CMS}" = "wordpress" ]; then
                wget -O "wordpress.tar.gz" "https://wordpress.org/wordpress-latest.tar.gz"
                tar -xzf "wordpress.tar.gz" -C /var
                rm -rf "wordpress.tar.gz"
                cp -rf /var/wordpress/* /home/${CP_DOMAIN}/
            elif [ "${NAME_CMS}" = "drupal" ]; then
                wget -O "drupal.tar.gz" "https://www.drupal.org/download-latest/tar.gz"
                tar -xzf "drupal.tar.gz" -C /var
                rm -rf "drupal.tar.gz"
                cp -rf /var/drupal-*/* /home/${CP_DOMAIN}/
            elif [ "${NAME_CMS}" = "joomla" ]; then
                wget -O "joomla3.tar.gz" "https://downloads.joomla.org/cms/joomla3/3-9-14/Joomla_3-9-14-Stable-Full_Package.tar.gz?format=gz"
                tar -xzf "joomla3.tar.gz" -C /home/${CP_DOMAIN}/
                rm -rf "joomla3.tar.gz"
            elif [ "${NAME_CMS}" = "dle" ]; then
                wget -O "dle_trial.zip" "https://dle-news.ru/files/dle_trial.zip"
                mkdir -p /var/dle
                unzip "dle_trial.zip" -d /var/dle/
                rm -rf "dle_trial.zip"
                cp -rf /var/dle/upload/* /home/${CP_DOMAIN}/
                chmod 777 /home/${CP_DOMAIN}/templates
                chmod 777 $(find /home/${CP_DOMAIN}/templates -type d)
                chmod 666 $(find /home/${CP_DOMAIN}/templates -type f)
                chmod 777 /home/${CP_DOMAIN}/backup
                chmod 777 $(find /home/${CP_DOMAIN}/backup -type d)
                chmod 777 /home/${CP_DOMAIN}/uploads
                chmod 777 $(find /home/${CP_DOMAIN}/uploads -type d)
                chmod 777 /home/${CP_DOMAIN}/engine/data
                chmod 777 /home/${CP_DOMAIN}/engine/cache
                chmod 777 /home/${CP_DOMAIN}/engine/cache/system
            elif [ "${MYSQL_USER}" != "" ] && [ "${MYSQL_PASSWORD}" != "" ] && [ "${MYSQL_DATABASE}" != "" ]; then
                {
                    echo "<html>"
                    echo "<head>"
                    echo "    <title>Hello CinemaPress</title>"
                    echo "</head>"
                    echo "<body>"
                    echo "    <?php"
                    echo "        \$link = mysqli_connect('mysql', '${MYSQL_USER}', '${MYSQL_PASSWORD}', '${MYSQL_DATABASE}');"
                    echo "        if (!\$link) {"
                    echo "            die('ERROR: ' . mysqli_error());"
                    echo "        }"
                    echo "        echo 'Hello, CinemaPress!';"
                    echo "        mysqli_close(\$link);"
                    echo "    ?>"
                    echo "</body>"
                    echo "</html>"
                } >> /home/${CP_DOMAIN}/index.php
            else
                {
                    echo "<html>"
                    echo "<head>"
                    echo "    <title>Hello CinemaPress</title>"
                    echo "</head>"
                    echo "<body>"
                    echo "    <?php"
                    echo "        echo 'Hello, CinemaPress!';"
                    echo "    ?>"
                    echo "</body>"
                    echo "</html>"
                } >> /home/${CP_DOMAIN}/index.php
            fi
            {
                echo "server {"
                echo "    listen 80;"
                echo "    listen [::]:80;"
                echo "    # listen 443;"
                echo "    # listen [::]:443;"
                echo "    root /home/${CP_DOMAIN};"
                echo "    index index.php index.html index.htm;"
                echo "    server_name .${CP_DOMAIN};"
                echo "    access_log /var/log/nginx/access_${CP_DOMAIN}.log;"
                echo "    include /etc/nginx/bots.d/ddos.conf;"
                echo "    include /etc/nginx/bots.d/blockbots.conf;"
                echo "    keepalive_timeout 10;"
                echo "    client_max_body_size 64m;"
                echo "    location / {"
                echo "        try_files \$uri \$uri/ /index.php?\$query_string;"
                echo "    }"
                echo "    if ( \$request_method !~ ^(GET|POST)$ ) {"
                echo "        return 444;"
                echo "    }"
                echo "    location ~* ^/(bin|.*\.sh|.*\.conf)($|\/) {"
                echo "        return 404;"
                echo "    }"
                echo "    location ~* \.php$ {"
                echo "        try_files \$uri \$uri/ /index.php last;"
                echo "        fastcgi_split_path_info (.+?\.php)(/.*)$;"
                echo "        fastcgi_pass php:9000;"
                echo "        fastcgi_index index.php;"
                echo "        include fastcgi_params;"
                echo "        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;"
                echo "        fastcgi_param PATH_INFO \$fastcgi_path_info;"
                echo "    }"
                echo "    location ~* .php/ { rewrite  (.*.php)/ \$1 last; }"
                echo "    location  ~ \/cinemaadmin {"
                echo "        auth_basic \"Login Adminer!\";"
                echo "        auth_basic_user_file /home/${CP_DOMAIN}/config/production/nginx/pass.d/${CP_DOMAIN}.pass;"
                echo "        rewrite ^/cinemaadmin(/.*)$ \$1 break;"
                echo "        try_files \$uri \$uri/ /index.php last;"
                echo "        fastcgi_split_path_info (.+?\.php)(/.*)$;"
                echo "        fastcgi_pass adminer:9000;"
                echo "        fastcgi_index index.php;"
                echo "        include fastcgi_params;"
                echo "        fastcgi_param SCRIPT_FILENAME /var/www/html/index.php;"
                echo "        fastcgi_param DOCUMENT_ROOT /var/www/html/;"
                echo "    }"
                echo "    location ~ /\.ht {"
                echo "        deny all;"
                echo "    }"
                echo "    location = /favicon.ico {"
                echo "        log_not_found off; access_log off;"
                echo "    }"
                echo "    location = /robots.txt {"
                echo "        log_not_found off; access_log off; allow all;"
                echo "    }"
                echo "    location ~* \.(css|gif|ico|jpeg|jpg|js|png)$ {"
                echo "        expires max; log_not_found off;"
                echo "    }"
                echo "}"
            } >> /home/${CP_DOMAIN}/config/production/nginx/conf.d/default.conf
            _line
            _header "${NAME_CMS}"
            _line
            echo "Website: http://${CP_DOMAIN}"
            echo "MYSQL HOST: mysql"
            if [ "${MYSQL_DATABASE}" != "" ]; then echo "MYSQL DATABASE: ${MYSQL_DATABASE}"; fi;
            if [ "${MYSQL_USER}" != "" ]; then echo "MYSQL USER: ${MYSQL_USER}"; fi;
            if [ "${MYSQL_PASSWORD}" != "" ]; then echo "MYSQL PASSWORD: ${MYSQL_PASSWORD}"; fi;
            echo "Adminer: http://${CP_DOMAIN}/cinemaadmin"
            if [ "${ADMIN_USER}" != "" ]; then echo "USER: ${ADMIN_USER}"; fi;
            if [ "${ADMIN_PASSWORD}" != "" ]; then echo "PASSWORD: ${ADMIN_PASSWORD}"; fi;
            _line
            exit 0
        ;;
        "static" )
            read_domain "${2}"
            sh_not
            RCS=$(docker exec "${CP_DOMAIN_}" /usr/bin/cinemapress container rclone config show 2>/dev/null | grep "CINEMASTATIC")
            if [ "${RCS}" = "" ]; then
                if [ "${4}" != "" ]; then
                    docker exec "${CP_DOMAIN_}" rclone config delete CINEMASTATIC \
                        >>/var/log/docker_static_"$(date '+%d_%m_%Y')".log 2>&1
                    docker exec "${CP_DOMAIN_}" rclone config create CINEMASTATIC mega user "${3}" pass "${4}" \
                        >>/var/log/docker_static_"$(date '+%d_%m_%Y')".log 2>&1
                    sleep 3
                    CHECK_MKDIR=$(docker exec "${CP_DOMAIN_}" rclone mkdir CINEMASTATIC:/check-connection 2>/dev/null)
                    sleep 3
                    CHECK_PURGE=$(docker exec "${CP_DOMAIN_}" rclone purge CINEMASTATIC:/check-connection 2>/dev/null)
                    if [ "${CHECK_MKDIR}" != "" ] || [ "${CHECK_PURGE}" != "" ]; then
                        _header "ERROR"
                        _content
                        _content "Cannot connect to backup storage."
                        _content
                        _s
                        exit 0
                    fi
                    cp -r /home/"${CP_DOMAIN}"/config/production/rclone.conf /var/rclone.conf
                else
                    echo "NOT CINEMASTATIC"
                    exit 0
                fi
            fi
            if [ "${3}" = "restore" ] || [ "${5}" = "restore" ]; then
                sleep 3; docker exec "${CP_DOMAIN_}" rclone -vv copy CINEMASTATIC:${CP_DOMAIN}/static.tar /home/${CP_DOMAIN}/
                cd /home/${CP_DOMAIN} && tar -xf /home/${CP_DOMAIN}/static.tar
                rm -rf /home/${CP_DOMAIN}/static.tar
                sleep 3; docker exec "${CP_DOMAIN_}" rclone -vv copy CINEMASTATIC:${CP_DOMAIN}/app.tar /home/${CP_DOMAIN}/
                if [ -f "/home/${CP_DOMAIN}/app.tar" ]; then
                    cd /home/${CP_DOMAIN} && tar -xf /home/${CP_DOMAIN}/app.tar
                    rm -rf /home/${CP_DOMAIN}/app.tar
                fi
            elif [ "${3}" = "create" ] || [ "${5}" = "create" ]; then
                cd /home/${CP_DOMAIN} && tar -uf /home/${CP_DOMAIN}/static.tar \
                    files/poster \
                    files/picture
                if [ -d "/home/${CP_DOMAIN}/files/windows" ]; then
                    cd /home/${CP_DOMAIN} && tar -uf /home/${CP_DOMAIN}/app.tar \
                        files/windows \
                        files/linux \
                        files/osx &>/dev/null
                    sleep 3; docker exec "${CP_DOMAIN_}" rclone purge CINEMASTATIC:${CP_DOMAIN}/app.tar &>/dev/null
                    sleep 3; docker exec "${CP_DOMAIN_}" rclone -vv copy /home/${CP_DOMAIN}/app.tar CINEMASTATIC:${CP_DOMAIN}/
                fi
                sleep 3; docker exec "${CP_DOMAIN_}" rclone purge CINEMASTATIC:${CP_DOMAIN}/static.tar &>/dev/null
                sleep 3; docker exec "${CP_DOMAIN_}" rclone -vv copy /home/${CP_DOMAIN}/static.tar CINEMASTATIC:${CP_DOMAIN}/
                rm -rf /home/${CP_DOMAIN}/static.tar /home/${CP_DOMAIN}/app.tar
            fi
            exit 0
        ;;
        "help"|"H"|"--help"|"-h"|"-H" )
            clear
            _line
            _logo
            _header "HELP"
            _br
            printf " ~# cinemapress [OPTION]"; _br; _br;
            printf " OPTIONS:"; _br; _br;
            printf " en        - Fast install EN website"; _br;
            printf " ru        - Fast install RU website"; _br;
            printf " passwd    - Change the password for access to the admin panel"; _br;
            printf " stop      - Stop website (docker container)"; _br;
            printf " start     - Start website (docker container)"; _br;
            printf " restart   - Restart website (docker container)"; _br;
            printf " reload    - Reload website (PM2)"; _br;
            printf " zero      - Delete all data from the automatic database"; _br;
            printf " speed     - Enabled Nginx PageSpeed module"; _br;
            printf " logs      - Show all logs"; _br;
            printf " bench     - System info, I/O test and speedtest"; _br;
            printf " actual    - Updating data from an automatic database"; _br;
            printf "             to a manual database (year, list of actors, list"; _br;
            printf "             of genres, list of countries, list of directors,"; _br;
            printf "             premiere date, rating and number of votes)"; _br;
            printf " clear_vps - Complete deletion of all data on the VPS"; _br;
            printf " app       - Create movie application"; _br;
            printf " cms       - Install other CMS (php-mysql,wordpress,drupal,joomla,dle)"; _br;
            printf " cms example.com backup [create,restore]"; _br;
            printf " splash example.com github_login github_pass"; _br;
            printf " static example.com mega_login mega_pass [create,restore]"; _br; _br;
            printf " combine create_https_restore_mirror"; _br;
            printf " combine create_restore_mirror"; _br;
            printf " combine create_https_mirror"; _br;
            printf " combine create_https_backup"; _br;
            printf " combine create_https_restore"; _br;
            printf " combine create_https"; _br;
            printf " combine create_backup"; _br;
            printf " combine create_restore"; _br; _br;
            printf " nohup cinemapress [FULL COMMAND] > log 2>&1; tail -f log"; _br; _br;
            exit 0
        ;;
        "version"|"ver"|"v"|"V"|"--version"|"--ver"|"-v"|"-V" )
            printf "CinemaPress ${CP_VER}"
            _br
            printf "Copyright (c) 2014-2020, CinemaPress (https://cinemapress.io)"
            _br
            exit 0
        ;;
        * )
            option ${1}
        ;;
    esac
done