# TEA Cast

npm start

# With forever:

TEA_CAST_SERVER_IP=192.168.6.31 CHROMIUM_PATH=/usr/bin/chromium-browser forever start --uid tea-cast -l /var/log/tea-cast.log -a --sourceDir /home/pi/tea/tea-cast -c "npm start" index.js
