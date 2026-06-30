// ── Shared helpers ──────────────────────────────────────────────────────────

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

function toast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── State ────────────────────────────────────────────────────────────────────

let debounceTimer;

function getFilters() {
  return {
    search:   document.getElementById('searchInput').value.trim(),
    status:   document.getElementById('filterStatus').value,
    priority: document.getElementById('filterPriority').value
  };
}

// ── Stats ────────────────────────────────────────────────────────────────────

function loadStats() {
  const s = Store.stats();
  document.getElementById('statTotal').textContent    = s.total;
  document.getElementById('statNew').textContent      = s.new;
  document.getElementById('statProgress').textContent = s.in_progress;
  document.getElementById('statResolved').textContent = s.resolved;
  document.getElementById('statClosed').textContent   = s.closed;
}

// ── Ticket table ─────────────────────────────────────────────────────────────

function loadTickets() {
  const filters = getFilters();
  const tickets = Store.filter(filters);
  const tbody   = document.getElementById('ticketTbody');

  if (tickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><p>No tickets found.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = tickets.map(t => `
    <tr>
      <td><a class="ticket-link" href="ticket-detail.html?id=${escHtml(t.ticket_number)}">${escHtml(t.ticket_number)}</a></td>
      <td>
        <a class="ticket-title" href="ticket-detail.html?id=${escHtml(t.ticket_number)}" style="color:var(--text);font-weight:500;">${escHtml(t.title)}</a>
        ${t.assigned_to ? `<div class="text-sm text-muted" style="margin-top:2px;">→ ${escHtml(t.assigned_to)}</div>` : ''}
      </td>
      <td>
        <div style="font-weight:500;">${escHtml(t.requester_name)}</div>
        <div class="text-sm text-muted">${escHtml(t.requester_email)}</div>
      </td>
      <td class="text-muted">${t.category || '—'}</td>
      <td>${priorityBadge(t.priority)}</td>
      <td>${statusBadge(t.status)}</td>
      <td class="text-muted text-sm">${fmtDate(t.created_at)}</td>
      <td><a href="ticket-detail.html?id=${escHtml(t.ticket_number)}" class="btn btn-secondary btn-sm">View</a></td>
    </tr>
  `).join('');
}

// ── Event bindings ────────────────────────────────────────────────────────────

document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadTickets, 280);
});

document.getElementById('filterStatus').addEventListener('change', loadTickets);
document.getElementById('filterPriority').addEventListener('change', loadTickets);

document.getElementById('btnClear').addEventListener('click', () => {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterStatus').value = 'all';
  document.getElementById('filterPriority').value = 'all';
  loadTickets();
});

// ── Init ─────────────────────────────────────────────────────────────────────
loadStats();
loadTickets();
