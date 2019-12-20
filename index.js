const nodecastor = require('nodecastor');
const express = require('express');
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');

const config = require('./config.json');
const Device = require('./src/Device.js');
const BrowserScrapper = require('./src/BrowserScrapper.js');

const devices = [];
const scanner = nodecastor.scan();

const localIp = require('./src/ip.js');
const browser = new BrowserScrapper(`http://${localIp}:9999/screenshots`);

const PdClient = require('node-pagerduty');
const PagerDuty = require('./src/PagerDuty.js');
const pager = new PagerDuty(new PdClient(config.pagerDuty.token));

pager.fetchIncidents().then(() => setTimeout(displayIncidents, 5000));

scanner.on('online', chromecast => {
  console.log(`Detected chromecast ${chromecast.friendlyName}`);
  const connectedChromecastConfigs = config.dashboards.filter(dashboard => dashboard.device === chromecast.friendlyName);
  if (connectedChromecastConfigs.length > 0) {
    const device = new Device(chromecast, connectedChromecastConfigs[0], browser);
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
  console.log('Server listening on port 9999');
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
  res.render('index');
});

app.get('/screens', function (req, res) {
  res.render('screens', {devices: devices.map(d => ({name: d.name, image: d.lastImageUrl}))});
});

const jsonParser = bodyParser.json();
app.post('/pagerduty', jsonParser, async function (req, res) {
  const messages = req.body.messages;
  res.sendStatus(204);

  await pager.handleMessages(messages);

  if (pager.incidents.length > 0) {
    displayIncidents();
  } else {
    devices.forEach(device => device.stream());
  }
});

app.get('/incidents', function (req, res) {
  const majorIncident = pager.getMostRelevantIncident();
  const otherIncidents = pager.incidents.filter(i => i.id !== majorIncident.id);
  res.render('incidents', {
    incident: majorIncident,
    incidentList: otherIncidents,
    displayList: otherIncidents.length > 0
  });
});

process.on('SIGINT', function () {
  console.log('Stopping TEA Cast');
  devices.map(device => device.stop());
  process.exit(0);
});


function displayIncidents() {
  if (pager.incidents.length === 0) {
    return;
  }
  devices.filter(d => d.displayAlerts).forEach(device => device.displayUrl(`http://${localIp}:9999/incidents`));
}
