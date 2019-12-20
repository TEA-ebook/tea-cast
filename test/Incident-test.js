const assert = require('assert');
const Incident = require('../src/Incident.js');

describe('Incident', function () {
  it('Creation with empty logs', function () {
    //Given
    //When
    const i = new Incident('id');
    i.title = 'title';
    i.status = 'status';
    i.priority = 'priority';

    //Then
    assert.strictEqual(i.id, 'id');
    assert.strictEqual(i.title, 'title');
    assert.strictEqual(i.status, 'status');
    assert.strictEqual(i.priority, 'priority');
    assert.deepStrictEqual(i.logs, []);
  });

  it('Set logs get last logs created_at', function () {
    //Given 
    const i = new Incident('id');
    i.title = 'title';
    i.status = 'status';
    i.priority = 'priority';


    // When
    i.logs = [
      {"created_at": "2019-12-01", "message": "A"},
      {"created_at": "2019-12-02", "message": "B"}
    ];

    // Then
    assert.strictEqual(i.lastUpdatedAt, "2019-12-02");
  });

  it('Update logs get last logs created_at', function () {
    //Given 
    const i = new Incident('id', 'title', 'status', 'priority');
    i.logs = [
      {"created_at": "2019-12-01", "message": "A"},
      {"created_at": "2019-12-02", "message": "B"}
    ];

    // When
    i.logs = [
      {"created_at": "2019-12-02", "message": "B"},
      {"created_at": "2019-12-03", "message": "C"},
      {"created_at": "2019-12-01", "message": "A"}
    ];

    // Then
    assert.strictEqual(i.lastUpdatedAt, "2019-12-03");
  });
});
