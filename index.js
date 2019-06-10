const nodecastor = require('nodecastor');
const express = require('express');
const exphbs  = require('express-handlebars');

const config = require('./config.json');
const Device = require('./src/Device.js');
const BrowserScrapper = require('./src/BrowserScrapper.js');

const devices = [];
const scanner = nodecastor.scan();

const localIp = require('./src/ip.js');
const browser = new BrowserScrapper(`http://${localIp}:9999/screenshots`);


scanner.on('online', chromecast => {
  console.log(`Detected chromecast ${chromecast.friendlyName}`);
  const connectedChromecastDashboard = config.dashboards.filter(dashboard => dashboard.device === chromecast.friendlyName);
  if (connectedChromecastDashboard.length > 0) {
    const device = new Device(chromecast, connectedChromecastDashboard[0], browser);
    devices.push(device);
    device.connect(config.castAppId, config.castUrn);
    return;
  }
  chromecast.stop();
});

scanner.on('offline', chromecast => console.log(`Removed chromecast ${chromecast.friendlyName}`));

// scan chromecast devices
browser.start().then(() => scanner.start());

// admin server
const app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.listen(9999, function () {
  console.log('Server listening on port 9999')
});

const options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['png'],
  index: false,
  maxAge: '10s',
  redirect: false
};

app.use(express.static('public', options));

app.get('/', function (req, res) {
  res.render('index', { devices: devices.map(d => ({ name: d.name, image: d.lastImageUrl })) });
});

process.on('SIGINT', function() {
  console.log('Stopping TEA Cast');
  //scanner.end();
  devices.map(device => device.stop());
  process.exit(0);
});
