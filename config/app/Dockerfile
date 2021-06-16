FROM node:8-stretch
LABEL description="Create CinemaPress movie application"

RUN dpkg --add-architecture i386

RUN apt-get update \
    && apt-get --yes install wine32 imagemagick git \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN git clone "https://github.com/jiahaog/nativefier.git" "/nativefier"

WORKDIR /nativefier/app
RUN npm install
WORKDIR /nativefier
RUN npm install && npm run build && npm link

RUN mkdir /app
WORKDIR /app

RUN nativefier https://github.com/CinemaPress/CinemaPress /tmp/nativefier \
    && nativefier -p osx https://github.com/CinemaPress/CinemaPress /tmp/nativefier \
    && nativefier -p windows https://github.com/CinemaPress/CinemaPress /tmp/nativefier \
    && rm -rf /tmp/nativefier

ENTRYPOINT ["nativefier"]
CMD ["--help"]