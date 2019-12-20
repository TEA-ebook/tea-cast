const Incident = require('./Incident');

class PagerDuty {

  constructor(client) {
    this.client = client;
    this.incidents = [];
  }

  async updateIncidents(incidentList) {
    incidentList.forEach(incident => {
      this.createOrUpdateIncident(incident);
    });

    this.incidents = this.incidents.filter(isIncidentWorthDisplaying);
    await Promise.all(this.incidents.map(incident => this.fetchLogs(incident)));

    this.incidents.sort((a, b) => {
      if (a.priority === b.priority) {
        return (a.lastUpdatedAt > b.lastUpdatedAt) ? -1 : 1;
      }
      return (a.priority < b.priority) ? -1 : 1;
    });

    return this.incidents;
  }

  async fetchIncidents() {
    const response = await this.client.incidents.listIncidents({
      sort_by: 'created_at:DESC',
      statuses: ['triggered', 'acknowledged']
    });

    const incidentsResponse = JSON.parse(response.body);

    return this.updateIncidents(incidentsResponse.incidents);
  }

  handleMessages(messages) {
    const incidentList = messages.map(m => m.incident);
    return this.updateIncidents(incidentList);
  }

  createOrUpdateIncident(incidentDetails) {
    const priority = incidentDetails.priority ? incidentDetails.priority.name : 'SEV-?';

    let currentIncident = this.incidents.find(i => i.id === incidentDetails.id);
    if (!currentIncident) {
      currentIncident = new Incident(incidentDetails.id, incidentDetails.title, incidentDetails.status, priority);
      this.incidents.push(currentIncident);
    }

    currentIncident.title = incidentDetails.title;
    currentIncident.status = incidentDetails.status;
    currentIncident.priority = priority;
  }

  async fetchLogs(incident) {
    const response = await this.client.incidents.listLogEntries(incident.id);
    const logsResponse = JSON.parse(response.body);
    incident.logs = logsResponse.log_entries.map(data => ({
      created_at: data.created_at,
      content: data.channel.summary || data.summary,
      agent: data.agent ? data.agent.summary : ''
    }));

    return incident;
  }

  getMostRelevantIncident() {
    return this.incidents[0];
  }
}

module.exports = PagerDuty;

function isIncidentWorthDisplaying(incident) {
  return incident.status !== 'resolved' && parseInt(incident.priority.split('-').pop(), 10) <= 3;
}
