// ── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function statusBadge(s) {
  const labels = { new: 'New', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };
  return `<span class="badge badge-${s}">${labels[s] || s}</span>`;
}

function priorityBadge(p) {
  return `<span class="badge badge-${p}">${p.charAt(0).toUpperCase() + p.slice(1)}</span>`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toast(msg, type = 'error') {
  const c = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Charts ───────────────────────────────────────────────────────────────────

let priorityChart, categoryChart, trendChart;

const PRIORITY_COLORS = {
  low:      { bg: '#d1fae5', border: '#10b981' },
  medium:   { bg: '#fef3c7', border: '#f59e0b' },
  high:     { bg: '#ffedd5', border: '#f97316' },
  critical: { bg: '#fee2e2', border: '#ef4444' }
};

function buildPriorityChart(data) {
  if (priorityChart) priorityChart.destroy();
  const ctx = document.getElementById('priorityChart').getContext('2d');
  priorityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.priority.charAt(0).toUpperCase() + d.priority.slice(1)),
      datasets: [{
        label: 'Tickets',
        data:            data.map(d => d.count),
        backgroundColor: data.map(d => (PRIORITY_COLORS[d.priority] || {bg:'#e2e8f0'}).bg),
        borderColor:     data.map(d => (PRIORITY_COLORS[d.priority] || {border:'#94a3b8'}).border),
        borderWidth: 2, borderRadius: 6
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

function buildCategoryChart(data) {
  if (categoryChart) categoryChart.destroy();
  const ctx = document.getElementById('categoryChart').getContext('2d');
  const palette = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.category),
      datasets: [{ data: data.map(d => d.count), backgroundColor: data.map((_, i) => palette[i % palette.length]), borderWidth: 2, borderColor: '#fff' }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } } }
  });
}

function buildTrendChart(yearData, year) {
  if (trendChart) trendChart.destroy();
  document.getElementById('trendYear').textContent = year;
  const ctx = document.getElementById('trendChart').getContext('2d');
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: yearData.map(m => MONTH_NAMES[m.month - 1].slice(0, 3)),
      datasets: [
        { label: 'Opened', data: yearData.map(m => m.opened), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.12)', tension: 0.35, fill: true, pointRadius: 4, borderWidth: 2 },
        { label: 'Closed', data: yearData.map(m => m.closed), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.12)', tension: 0.35, fill: true, pointRadius: 4, borderWidth: 2 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { size: 12 } } } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

// ── Render report ─────────────────────────────────────────────────────────────

function renderReport(report, yearlyData) {
  const monthName = MONTH_NAMES[parseInt(report.month) - 1];
  document.getElementById('reportSubtitle').textContent = `${monthName} ${report.year}`;

  document.getElementById('rTotal').textContent    = report.summary.total_opened;
  document.getElementById('rNew').textContent      = report.summary.new;
  document.getElementById('rProgress').textContent = report.summary.in_progress;
  document.getElementById('rClosed').textContent   = report.summary.total_closed;
  document.getElementById('rAvg').textContent      = report.avg_resolution_hours != null ? report.avg_resolution_hours : '—';

  if (report.by_priority.length > 0) buildPriorityChart(report.by_priority);
  if (report.by_category.length > 0) buildCategoryChart(report.by_category);
  buildTrendChart(yearlyData, report.year);

  const tbody = document.getElementById('reportTbody');
  if (report.tickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="padding:40px 20px;"><p>No tickets for this period.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = report.tickets.map(t => `
    <tr>
      <td><a href="ticket-detail.html?id=${escHtml(t.ticket_number)}" class="ticket-link">${escHtml(t.ticket_number)}</a></td>
      <td><a href="ticket-detail.html?id=${escHtml(t.ticket_number)}" style="color:var(--text);">${escHtml(t.title)}</a></td>
      <td>${escHtml(t.requester_name)}</td>
      <td>${priorityBadge(t.priority)}</td>
      <td>${statusBadge(t.status)}</td>
      <td class="text-muted text-sm">${fmtDate(t.created_at)}</td>
      <td class="text-muted text-sm">${fmtDate(t.closed_at)}</td>
    </tr>
  `).join('');
}

// ── Load ──────────────────────────────────────────────────────────────────────

function loadReport() {
  const month = document.getElementById('reportMonth').value;
  const year  = document.getElementById('reportYear').value;

  try {
    const report    = Store.monthlyReport(month, year);
    const yearlyData = Store.yearlyTrend(year);
    renderReport(report, yearlyData);
  } catch (err) {
    toast(`Failed to load report: ${err.message}`, 'error');
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

function initYearSelector() {
  const sel  = document.getElementById('reportYear');
  const now  = new Date();
  const curr = now.getFullYear();
  for (let y = curr; y >= curr - 5; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    sel.appendChild(opt);
  }
  sel.value = curr;
  document.getElementById('reportMonth').value = now.getMonth() + 1;
}

document.getElementById('btnLoadReport').addEventListener('click', loadReport);
document.getElementById('btnPrint').addEventListener('click', () => window.print());

initYearSelector();
loadReport();
