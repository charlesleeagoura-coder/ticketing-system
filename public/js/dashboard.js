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

async function loadStats() {
  try {
    const res = await fetch('/api/tickets/stats');
    const data = await res.json();
    if (!data.success) return;
    const s = data.stats;
    document.getElementById('statTotal').textContent    = s.total;
    document.getElementById('statNew').textContent      = s.new;
    document.getElementById('statProgress').textContent = s.in_progress;
    document.getElementById('statResolved').textContent = s.resolved;
    document.getElementById('statClosed').textContent   = s.closed;
  } catch (_) {}
}

// ── Ticket table ─────────────────────────────────────────────────────────────

async function loadTickets() {
  const { search, status, priority } = getFilters();
  const params = new URLSearchParams();
  if (search)   params.set('search', search);
  if (status)   params.set('status', status);
  if (priority) params.set('priority', priority);

  const tbody = document.getElementById('ticketTbody');
  tbody.innerHTML = `<tr><td colspan="8"><div class="loading-page" style="min-height:80px;"><span class="spinner" style="border-color:#dce1e7;border-top-color:#1e3a5f;"></span></div></td></tr>`;

  try {
    const res  = await fetch(`/api/tickets?${params}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    if (data.tickets.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><p>No tickets found.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = data.tickets.map(t => `
      <tr>
        <td><a class="ticket-link" href="/ticket/${t.id}">${t.ticket_number}</a></td>
        <td>
          <a class="ticket-title" href="/ticket/${t.id}" style="color:var(--text);font-weight:500;">${escHtml(t.title)}</a>
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
        <td><a href="/ticket/${t.id}" class="btn btn-secondary btn-sm">View</a></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><p style="color:var(--danger);">Error loading tickets: ${err.message}</p></div></td></tr>`;
  }
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
