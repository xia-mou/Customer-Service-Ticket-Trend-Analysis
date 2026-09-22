const assert = require('assert').strict;
const tickets = require('../data/tickets.json');
const { summarize, getAnomalies } = require('../src/analysis');

let passed = 0;
function test(name, callback) {
  try {
    callback();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test('summarize aggregates the supplied fifty tickets', () => {
  const result = summarize(tickets);

  assert.equal(result.total, 50);
  assert.equal(result.resolved, 42);
  assert.equal(result.unresolved, 8);
  assert.equal(result.highPriorityUnresolved, 7);
  assert.equal(result.categories[0].category, '支付问题');
  assert.equal(result.categories[0].count, 16);
  assert.equal(result.categories.find((item) => item.category === '退款退货').unresolved, 5);
  assert.equal(result.daily.find((item) => item.date === '2024-06-10').count, 6);
});

test('summarize keeps the efficiency and satisfaction evidence', () => {
  const result = summarize(tickets);

  assert.equal(result.averageResolutionHours, 19.69);
  assert.equal(result.averageSatisfaction, 2.36);
  assert.equal(result.priority.find((item) => item.priority === '高').averageSatisfaction, 1.87);
  assert.equal(result.categories.find((item) => item.category === '退款退货').averageResolutionHours, 45.23);
});

test('getAnomalies flags actionable tickets with explainable reasons', () => {
  const anomalies = getAnomalies(tickets);
  const t031 = anomalies.find((ticket) => ticket.ticket_id === 'T031');
  const t046 = anomalies.find((ticket) => ticket.ticket_id === 'T046');

  assert.equal(anomalies.length, 27);
  assert.match(t031.reason, /高优先级未解决/);
  assert.match(t031.reason, /处理时长 120 小时/);
  assert.match(t046.reason, /低满意度/);
});

console.log(`${passed} tests passed`);
