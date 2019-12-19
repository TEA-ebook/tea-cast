class Incident {

  constructor(id, title, status, priority) {
    this.id = id;
    this.title = title;
    this.status = status;
    this.priority = priority;
    this.logList = [];
  }

  get lastUpdatedAt() {
    return this.logList[0].created_at;
  }

  set logs(logs) {
    this.logList = logs.sort((a, b) => (a.created_at > b.created_at) ? -1 : 1);
  }

  get logs() {
    return this.logList;
  }
}

module.exports = Incident;
