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

const PagerDuty = require('./src/PagerDuty.js');
const pager = new PagerDuty(config.pagerDuty);

let incidents = [];
pager.listIncidents().then(response => {
  const incidentsResponse = JSON.parse(response.body);
  updateIncidents(incidentsResponse.incidents.map(incident => ({incident})));
  setTimeout(displayIncidents, 5000);
});

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
app.post('/pagerduty', jsonParser, function (req, res) {
  const messages = req.body.messages;
  updateIncidents(messages);

  res.sendStatus(204);

  if (incidents.length > 0) {
    displayIncidents();
  } else {
    devices.forEach(device => device.stream());
  }
});

app.get('/incidents', function (req, res) {
  const sortedIncidents = incidents.sort((a, b) => (a.lastChange > b.lastChange) ? -1 : 1);
  res.render('incidents', {
    incident: sortedIncidents[0],
    incidentCount: incidents.length
  });
});

process.on('SIGINT', function () {
  console.log('Stopping TEA Cast');
  devices.map(device => device.stop());
  process.exit(0);
});


function updateIncidents(messages) {
  messages.forEach(message => {
    const incident = message.incident;
    const logs = message.log_entries ? message.log_entries : [incident.first_trigger_log_entry];

    if (!incident.priority || parseInt(incident.priority.name.split('-').pop(), 10) > 3) {
      return;
    }

    let currentIncident = incidents.find(i => i.id === incident.id);
    if (!currentIncident) {
      currentIncident = {id: incident.id};
      incidents.push(currentIncident);
    }

    if (incident.status === 'resolved') {
      incidents = incidents.filter(i => i.id !== incident.id);
      return;
    }

    Object.assign(currentIncident, {
      id: incident.id,
      title: incident.title,
      status: incident.status,
      priority: incident.priority ? incident.priority.name : 'SEV-?',
      lastChange: logs.pop().created_at
    });
  });
}

function displayIncidents() {
  if (incidents.length === 0) {
    return;
  }
  devices.forEach(device => device.displayUrl(`http://${localIp}:9999/incidents`));
}
