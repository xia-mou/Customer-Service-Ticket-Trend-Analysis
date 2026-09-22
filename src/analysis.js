const PRIORITY_ORDER = ['高', '中', '低'];

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function average(items, field) {
  if (!items.length) return 0;
  return round(items.reduce((sum, item) => sum + Number(item[field]), 0) / items.length);
}

function countBy(items, key) {
  const counts = new Map();
  items.forEach((item) => {
    const value = typeof key === 'function' ? key(item) : item[key];
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return counts;
}

function groupedStats(tickets, field, order = 'count') {
  const groups = new Map();
  tickets.forEach((ticket) => {
    const value = ticket[field];
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(ticket);
  });

  const result = Array.from(groups, ([value, items]) => ({
    [field]: value,
    count: items.length,
    share: round((items.length / tickets.length) * 100, 1),
    unresolved: items.filter((item) => !item.is_resolved).length,
    averageResolutionHours: average(items, 'resolution_time_hours'),
    averageSatisfaction: average(items, 'satisfaction'),
  }));

  if (order === 'priority') {
    return result.sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority));
  }
  return result.sort((a, b) => b.count - a.count || a[field].localeCompare(b[field], 'zh-CN'));
}

function summarize(tickets) {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    throw new Error('至少需要一条工单数据');
  }

  const dailyMap = countBy(tickets, (ticket) => ticket.created_at.slice(0, 10));
  const daily = Array.from(dailyMap, ([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const maxDay = daily.reduce((max, item) => item.count > max.count ? item : max, daily[0]);
  const recent = daily.slice(-3);

  return {
    total: tickets.length,
    resolved: tickets.filter((ticket) => ticket.is_resolved).length,
    unresolved: tickets.filter((ticket) => !ticket.is_resolved).length,
    highPriority: tickets.filter((ticket) => ticket.priority === '高').length,
    highPriorityUnresolved: tickets.filter((ticket) => ticket.priority === '高' && !ticket.is_resolved).length,
    averageResolutionHours: average(tickets, 'resolution_time_hours'),
    averageSatisfaction: average(tickets, 'satisfaction'),
    lowSatisfaction: tickets.filter((ticket) => ticket.satisfaction <= 2).length,
    longProcessing: tickets.filter((ticket) => ticket.resolution_time_hours >= 48).length,
    dateRange: [daily[0].date, daily[daily.length - 1].date],
    daily,
    maxDay,
    recentThreeAverage: round(recent.reduce((sum, item) => sum + item.count, 0) / recent.length, 1),
    categories: groupedStats(tickets, 'category'),
    priority: groupedStats(tickets, 'priority', 'priority'),
    channel: groupedStats(tickets, 'channel'),
  };
}

function getAnomalies(tickets) {
  return tickets
    .filter((ticket) => ticket.resolution_time_hours >= 48 || ticket.satisfaction <= 2 || (ticket.priority === '高' && !ticket.is_resolved))
    .map((ticket) => {
      const reasons = [];
      if (ticket.priority === '高' && !ticket.is_resolved) reasons.push('高优先级未解决');
      if (ticket.resolution_time_hours >= 48) reasons.push(`处理时长 ${ticket.resolution_time_hours} 小时`);
      if (ticket.satisfaction <= 2) reasons.push(`低满意度 ${ticket.satisfaction} 分`);
      return {
        ...ticket,
        severity: ticket.priority === '高' && !ticket.is_resolved ? 'critical' : 'watch',
        reason: reasons.join('、'),
      };
    })
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
      return b.resolution_time_hours - a.resolution_time_hours || a.satisfaction - b.satisfaction;
    });
}

const api = { round, average, summarize, getAnomalies };

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof globalThis !== 'undefined') globalThis.TicketAnalysis = api;
