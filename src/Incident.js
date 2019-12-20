class Incident {

  constructor(id) {
    this.id = id;
    this.title = '';
    this.status = null;
    this.priority = null;
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

  get assignees() {
    return this.assignments.join(', ');
  }

  get isMultipleAssignees() {
    return this.assignments.length > 1;
  }

  get shouldPlaySiren() {
    return this.priority === 'SEV-1' && this.status === 'triggered';
  }
}

module.exports = Incident;
