(function () {
  const analysis = globalThis.TicketAnalysis;
  const tickets = globalThis.Tickets;
  const summary = analysis.summarize(tickets);
  const anomalies = analysis.getAnomalies(tickets);

  const colors = {
    navy: '#16324f',
    blue: '#2f6fed',
    teal: '#0f766e',
    orange: '#c46b14',
    red: '#c24132',
    ink: '#17212b',
    muted: '#66717d',
    grid: '#dce3ea',
    soft: '#eef3f7',
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function hours(value) {
    return value < 1 ? `${value} 小时` : `${value} 小时`;
  }

  function percent(value) {
    return `${Number(value).toFixed(value % 1 ? 1 : 0)}%`;
  }

  function renderKpis() {
    byId('kpi-total').textContent = summary.total;
    byId('kpi-unresolved').textContent = summary.unresolved;
    byId('kpi-high').textContent = summary.highPriorityUnresolved;
    byId('kpi-satisfaction').textContent = summary.averageSatisfaction.toFixed(2);
    byId('kpi-total-note').textContent = `${summary.dateRange[0]} 至 ${summary.dateRange[1]}`;
    byId('kpi-unresolved-note').textContent = `占全部 ${percent((summary.unresolved / summary.total) * 100)}`;
    byId('kpi-high-note').textContent = `高优先级 ${summary.highPriority} 条中的 ${summary.highPriorityUnresolved} 条`;
    byId('kpi-satisfaction-note').textContent = `低满意度工单 ${summary.lowSatisfaction} 条`;
    byId('date-range').textContent = `${summary.dateRange[0]} — ${summary.dateRange[1]} · ${summary.total} 条工单`;
  }

  function renderDailyChart() {
    const width = 760;
    const height = 250;
    const pad = { top: 22, right: 24, bottom: 42, left: 42 };
    const max = Math.max.apply(null, summary.daily.map((item) => item.count));
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const x = (index) => pad.left + (index / (summary.daily.length - 1)) * chartWidth;
    const y = (value) => pad.top + chartHeight - (value / (max + 1)) * chartHeight;
    const points = summary.daily.map((item, index) => `${x(index).toFixed(1)},${y(item.count).toFixed(1)}`).join(' ');
    const yTicks = Array.from({ length: max + 2 }, (_, index) => index);
    const xTickEvery = summary.daily.length > 8 ? 2 : 1;
    const grid = yTicks.map((tick) => `<line x1="${pad.left}" y1="${y(tick)}" x2="${width - pad.right}" y2="${y(tick)}" stroke="${colors.grid}" stroke-width="1" />`).join('');
    const yLabels = yTicks.map((tick) => `<text x="${pad.left - 12}" y="${y(tick) + 4}" text-anchor="end" fill="${colors.muted}" font-size="11">${tick}</text>`).join('');
    const xLabels = summary.daily.map((item, index) => index % xTickEvery === 0 ? `<text x="${x(index)}" y="${height - 14}" text-anchor="middle" fill="${colors.muted}" font-size="11">${item.date.slice(5)}</text>` : '').join('');
    const dots = summary.daily.map((item, index) => `<circle cx="${x(index)}" cy="${y(item.count)}" r="4" fill="${colors.blue}" stroke="#ffffff" stroke-width="2"><title>${item.date}：${item.count} 条</title></circle>`).join('');
    byId('daily-chart').innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="按日工单量折线图"><title>按日工单量</title>${grid}${yLabels}${xLabels}<polyline points="${points}" fill="none" stroke="${colors.blue}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />${dots}</svg>`;
    byId('daily-note').textContent = `峰值 ${summary.maxDay.date.slice(5)} 为 ${summary.maxDay.count} 条，最近 3 日均值 ${summary.recentThreeAverage} 条`;
  }

  function renderCategoryChart() {
    const max = summary.categories[0].count;
    byId('category-chart').innerHTML = summary.categories.map((item, index) => {
      const barClass = index === 0 ? 'bar bar-blue' : index === 1 ? 'bar bar-orange' : 'bar bar-teal';
      return `<div class="category-row"><div class="category-label"><strong>${escapeHtml(item.category)}</strong><span>${item.count} 条 · ${percent(item.share)}</span></div><div class="bar-track"><div class="${barClass}" style="width:${(item.count / max) * 100}%"></div></div><div class="category-meta"><span>${item.unresolved ? `${item.unresolved} 未解决` : '全部已解决'}</span><span>${hours(item.averageResolutionHours)}</span></div></div>`;
    }).join('');
  }

  function renderPriority() {
    byId('priority-rows').innerHTML = summary.priority.map((item) => `<tr><td><span class="priority-dot priority-${item.priority}"></span>${item.priority}</td><td class="num">${item.count}</td><td class="num">${item.unresolved}</td><td class="num">${hours(item.averageResolutionHours)}</td><td class="num ${item.averageSatisfaction <= 2 ? 'danger-text' : ''}">${item.averageSatisfaction.toFixed(2)}</td></tr>`).join('');
    byId('channel-rows').innerHTML = summary.channel.map((item) => `<div class="channel-row"><span>${escapeHtml(item.channel)}</span><div class="channel-track"><div style="width:${item.share}%; background:${item.channel === '在线' ? colors.teal : colors.orange}"></div></div><strong>${item.count}</strong><small>${percent(item.share)}</small></div>`).join('');
  }

  function renderEfficiency() {
    const sorted = summary.categories.slice().sort((a, b) => b.averageResolutionHours - a.averageResolutionHours);
    byId('efficiency-rows').innerHTML = sorted.map((item) => `<tr><td>${escapeHtml(item.category)}</td><td class="num">${hours(item.averageResolutionHours)}</td><td class="num ${item.averageSatisfaction <= 2 ? 'danger-text' : ''}">${item.averageSatisfaction.toFixed(2)}</td><td class="num">${item.unresolved}</td></tr>`).join('');
  }

  function anomalyRow(ticket) {
    const severity = ticket.severity === 'critical' ? '<span class="signal signal-critical">立即关注</span>' : '<span class="signal signal-watch">重点观察</span>';
    const state = ticket.is_resolved ? '<span class="state resolved">已解决</span>' : '<span class="state open">未解决</span>';
    return `<tr><td class="ticket-id">${escapeHtml(ticket.ticket_id)}</td><td>${escapeHtml(ticket.category)}</td><td>${severity}</td><td>${state}</td><td class="num">${hours(ticket.resolution_time_hours)}</td><td class="num ${ticket.satisfaction <= 2 ? 'danger-text' : ''}">${ticket.satisfaction}</td><td><strong>${escapeHtml(ticket.reason)}</strong><br><span class="desc">${escapeHtml(ticket.description)}</span></td></tr>`;
  }

  function renderAnomalies(filter) {
    let visible = anomalies;
    if (filter === 'open') visible = anomalies.filter((ticket) => !ticket.is_resolved);
    if (filter === 'long') visible = anomalies.filter((ticket) => ticket.resolution_time_hours >= 48);
    if (filter === 'low') visible = anomalies.filter((ticket) => ticket.satisfaction <= 2);
    byId('anomaly-rows').innerHTML = visible.map(anomalyRow).join('');
    byId('anomaly-count').textContent = `${visible.length} 条`;
  }

  function renderTicketTable() {
    const categorySelect = byId('category-filter');
    const statusSelect = byId('status-filter');
    const render = () => {
      const category = categorySelect.value;
      const status = statusSelect.value;
      const filtered = tickets.filter((ticket) => {
        const categoryMatch = category === 'all' || ticket.category === category;
        const statusMatch = status === 'all' || (status === 'open' ? !ticket.is_resolved : ticket.is_resolved);
        return categoryMatch && statusMatch;
      });
      byId('ticket-count').textContent = `${filtered.length} 条`;
      byId('ticket-rows').innerHTML = filtered.map((ticket) => `<tr><td class="ticket-id">${escapeHtml(ticket.ticket_id)}</td><td>${escapeHtml(ticket.created_at.slice(5))}</td><td>${escapeHtml(ticket.category)}</td><td>${escapeHtml(ticket.priority)}</td><td>${escapeHtml(ticket.channel)}</td><td>${ticket.is_resolved ? '<span class="state resolved">已解决</span>' : '<span class="state open">未解决</span>'}</td><td class="num">${hours(ticket.resolution_time_hours)}</td><td class="num">${ticket.satisfaction}</td><td class="desc">${escapeHtml(ticket.description)}</td></tr>`).join('');
    };
    Array.from(document.querySelectorAll('[data-filter]')).forEach((button) => button.addEventListener('click', () => {
      Array.from(document.querySelectorAll('[data-filter]')).forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      renderAnomalies(button.dataset.filter);
    }));
    categorySelect.addEventListener('change', render);
    statusSelect.addEventListener('change', render);
    renderAnomalies('all');
    render();
    Array.from(new Set(tickets.map((ticket) => ticket.category))).sort((a, b) => a.localeCompare(b, 'zh-CN')).forEach((category) => {
      categorySelect.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`);
    });
  }

  renderKpis();
  renderDailyChart();
  renderCategoryChart();
  renderPriority();
  renderEfficiency();
  renderTicketTable();
  byId('print-button').addEventListener('click', () => window.print());
})();
