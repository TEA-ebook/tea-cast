FROM node:8-slim

# See https://crbug.com/795759
RUN apt-get update && apt-get install -yq libgconf-2-4

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install -y --no-install-recommends \
   python \
   build-essential \
   git \
   ttf-freefont \
   libx11-xcb-dev \
   libxtst6 \
   libnss3 \
   libxss1 \
   libasound2 \
   libatk-bridge2.0-0 \
   libgtk-3-0 \
   avahi-daemon \ 
   avahi-discover \
   avahi-utils \
   libnss-mdns \
   libavahi-compat-libdnssd-dev \
   supervisor && \
  rm -rf /var/lib/apt/lists/*

COPY docker/avahi/avahi-daemon.conf /etc/avahi/avahi-daemon.conf
COPY docker/supervisor/* /etc/supervisor/conf.d/
COPY . /app
WORKDIR /app

RUN npm install && rm -rf docker

ENV CONTAINER=1

EXPOSE 5252/udp
EXPOSE 9999/tcp

CMD /usr/bin/supervisord -nc /etc/supervisor/supervisord.conf
