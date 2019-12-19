const GrafanaScrapper = require(`${__dirname}/GrafanaScrapper.js`);
const LockRedisScrapper = require(`${__dirname}/LockRedisScrapper.js`);

class Device {

  constructor(chromecast, config, browser) {
    this.chromecast = chromecast;
    this.config = config;
    this.browser = browser;
    this.name = this.config.device;
    this.session = null;
    this.live = false;
  }

  connect(castAppId, castUrn) {
    const device = this;

    this.chromecast.on('connect', () => {
      console.log(`[${device.name}] Connected`);
      this.chromecast.on('status', status => {
        //console.log(`[${device.name}] Status updated`, status);
        const wasLive = device.live;
        device.updateStatus(castAppId, status);

        if (wasLive && !device.live) {
          console.log(`[${device.name}] TEA Cast is not running`);
          device.stop();
        }

        if (chromecastFree(status)) {
          device.start(castAppId, castUrn);
        }
      });

      device.start(castAppId, castUrn);
    });

    this.chromecast.on('error', error => {
      console.log(`[${device.name}]`, error);
    });

    this.chromecast.on('disconnect', () => {
      device.stop();
    });
  }

  start(castAppId, castUrn) {
    const device = this;

    launchApp(device, castAppId)
      .then(app => getSession(app, castUrn))
      .then(session => {
        device.session = session;
        device.stream();
      })
      .catch(console.log);
  }

  updateStatus(castAppId, status) {
    this.live = teaCastRunning(castAppId, status);
  }

  async stop() {
    console.log(`[${this.name}] Stopped`);
    if (this.scrapper) {
      return this.scrapper.stop();
    }
    clearHandler(this.refreshHandler);
    return Promise.resolve();
  }

  stream() {
    const device = this;

    const [displayMethod, id] = this.config.type.split(':');

    // scrap image and send it
    if (displayMethod === 'scrapper') {
      if (id === 'grafana') {
        this.scrapper = new GrafanaScrapper(device.config, device.browser, device.displayImage.bind(device));
        this.scrapper.start();
      } else if (id === 'lockRedis') {
        this.scrapper = new LockRedisScrapper(device.config, device.browser, device.displayImage.bind(device));
        this.scrapper.start();
      } else {
        console.log(`Unimplemented ${id} scrapper.`);
      }
    }

    // send URL to display in iframe
    else if (displayMethod === 'iframe') {
      if (this.config.refreshInterval) {
        clearHandler(this.refreshHandler);
        this.refreshHandler = setInterval(() => device.displayUrl(device.config.url), this.config.refreshInterval);
      }
      device.displayUrl(device.config.url);
    }
  }

  displayImage(url) {
    this.session.send({image: url});
  }

  displayUrl(url) {
    console.log(`[${this.name}] Display iframe ${url}`);
    this.session.send({url});
  }

  displayIncident(url) {
    this.session.send({image: `${url}/incident.jpg`});
  }
}

function teaCastRunning(castAppId, status) {
  return status.applications && status.applications.some(app => app.appId === castAppId);
}

function chromecastFree(status) {
  return status.applications && status.applications.every(app => app.isIdleScreen);
}

function launchApp(device, castAppId) {
  return new Promise(function (resolve, reject) {
    device.chromecast.application(castAppId, (err, app) => {
      if (err) {
        reject(err);
        return;
      }

      console.log(`[${device.name}] Launched TEA Cast application ${app.id}`);
      resolve(app);
    });
  });
}

function getSession(app, castUrn) {
  return new Promise((resolve, reject) => {
    app.join(castUrn, (appNotLaunched, session) => {
      if (appNotLaunched) {
        app.run(castUrn, (error, newSession) => {
          if (error) {
            reject(error);
            return;
          }
          console.log('Got a session', newSession.id);
          resolve(newSession);
        });

        return;
      }

      console.log('Joined a session', session.id);
      resolve(session);
    });
  });
}

function clearHandler(handler) {
  if (handler) {
    clearInterval(handler);
  }
}

module.exports = Device;
