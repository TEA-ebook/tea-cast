const assert = require('assert');
const PagerDuty = require('../src/PagerDuty.js');

class FakePDClient {
}


describe('PagerDuty', function() {
  it('Create an incident with sev', function() {
    //Given
    const pd_client = new FakePDClient();
    const pd = new PagerDuty(pd_client);

    //When
    pd.createOrUpdateIncident({
      "id": "ID",
      "title": "title",
      "status": "status",
      "priority": {
        "name": "SEV-9000",
      },
      "assignments": [{
        "assignee": {
          "summary": "Luca Doncic"
        }
      }]
    });

    //Then
    assert.strictEqual(pd.incidents.length, 1);
    assert.strictEqual(pd.incidents[0].id, "ID");
    assert.strictEqual(pd.incidents[0].title, "title");
    assert.strictEqual(pd.incidents[0].status, "status");
    assert.strictEqual(pd.incidents[0].priority, "SEV-9000");
  });

  it('Create an incident without sev', function() {
    //Given
    const pd_client = new FakePDClient();
    const pd = new PagerDuty(pd_client);

    //When
    pd.createOrUpdateIncident({
      "id": "ID",
      "title": "title",
      "status": "status",
      "assignments": [{
        "assignee": {
          "summary": "Luca Doncic"
        }
      }]
    });

    //Then
    assert.strictEqual(pd.incidents.length, 1);
    assert.strictEqual(pd.incidents[0].id, "ID");
    assert.strictEqual(pd.incidents[0].title, "title");
    assert.strictEqual(pd.incidents[0].status, "status");
    assert.strictEqual(pd.incidents[0].priority, "SEV-?");
  });

  it('Update an incident', function() {
    //Given
    const pd_client = new FakePDClient();
    const pd = new PagerDuty(pd_client);
    pd.createOrUpdateIncident({
      "id": "ID",
      "title": "title",
      "status": "status",
      "assignments": [{
        "assignee": {
          "summary": "Luca Doncic"
        }
      }]
    });

    //When
    pd.createOrUpdateIncident({
      "id": "ID",
      "title": "new title",
      "status": "new status",
      "priority": {
        "name": "SEV-9000",
      },
      "assignments": [{
        "assignee": {
          "summary": "Luca Doncic"
        }
      }]
    });

    //Then
    assert.strictEqual(pd.incidents.length, 1);
    assert.strictEqual(pd.incidents[0].id, "ID");
    assert.strictEqual(pd.incidents[0].title, "new title");
    assert.strictEqual(pd.incidents[0].status, "new status");
    assert.strictEqual(pd.incidents[0].priority, "SEV-9000");
  });
});
