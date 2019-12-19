const PdClient = require('node-pagerduty');

class PagerDuty {

  constructor(config) {
    this.config = config;

    this.client = new PdClient(config.token);
  }

  listIncidents() {
    return this.client.incidents.listIncidents({
      time_zone: 'UTC',
      include: ['first_trigger_log_entries']
    });
  }
}

module.exports = PagerDuty;
