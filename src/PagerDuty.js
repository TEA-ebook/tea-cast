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
      currentIncident = new Incident(incidentDetails.id);
      this.incidents.push(currentIncident);
    }

    currentIncident.title = incidentDetails.title;
    currentIncident.status = incidentDetails.status;
    currentIncident.priority = priority;
    currentIncident.assignments = incidentDetails.assignments.map(a => a.assignee.summary); // TODO: do better please
  }

  async fetchLogs(incident) {
    const response = await this.client.incidents.listLogEntries(incident.id);
    const logsResponse = JSON.parse(response.body);
    const FORMAT_OPTIONS = {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false};
    incident.logs = logsResponse.log_entries.map(data => ({
      created_at: data.created_at,
      humanReadableDate: new Intl.DateTimeFormat('fr-FR', FORMAT_OPTIONS).format(new Date(data.created_at)),
      content: getContentFromLog(data)
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

function getContentFromLog(data) {
  const channel = data.channel;
  if (!channel || !channel.summary) {
    return data.summary;
  }

  if (channel.type === 'note') {
    return `${data.agent.summary} : ${data.channel.summary}`;
  }

  return data.channel.summary;
}