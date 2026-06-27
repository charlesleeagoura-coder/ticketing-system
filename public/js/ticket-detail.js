// ── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

const ticketId = location.pathname.split('/').pop();
let currentTicket = null;

// ── Render ───────────────────────────────────────────────────────────────────

function renderPage(ticket, notes, emailLog) {
  currentTicket = ticket;

  const container = document.getElementById('pageContainer');
  container.innerHTML = `
    <a href="/" class="back-link">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      Back to Dashboard
    </a>

    <div class="detail-header">
      <div>
        <div class="detail-ticket-num">${escHtml(ticket.ticket_number)}</div>
        <h1 class="detail-title">${escHtml(ticket.title)}</h1>
        <div class="detail-meta">
          <span class="detail-meta-item">${statusBadge(ticket.status)}</span>
          <span class="detail-meta-item">${priorityBadge(ticket.priority)}</span>
          ${ticket.category ? `<span class="detail-meta-item" style="background:var(--bg);padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">${escHtml(ticket.category)}</span>` : ''}
          <span class="detail-meta-item">Opened ${fmtDate(ticket.created_at)}</span>
        </div>
      </div>
      <div class="flex gap-8 flex-wrap">
        <button class="btn btn-secondary btn-sm" id="editBtn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button class="btn btn-info btn-sm" id="emailBtn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Send Email
        </button>
      </div>
    </div>

    <div class="detail-grid">

      <!-- LEFT: ticket info -->
      <div class="section-gap">
        <div class="card">
          <div class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Ticket Information
          </div>
          <div class="info-row"><span class="info-row-label">Requester</span><span class="info-row-value"><strong>${escHtml(ticket.requester_name)}</strong><br><a href="mailto:${escHtml(ticket.requester_email)}">${escHtml(ticket.requester_email)}</a></span></div>
          <div class="info-row"><span class="info-row-label">Assigned To</span><span class="info-row-value">${ticket.assigned_to ? escHtml(ticket.assigned_to) : '<span class="text-muted">Unassigned</span>'}</span></div>
          <div class="info-row"><span class="info-row-label">Category</span><span class="info-row-value">${ticket.category || '<span class="text-muted">—</span>'}</span></div>
          <div class="info-row"><span class="info-row-label">Priority</span><span class="info-row-value">${priorityBadge(ticket.priority)}</span></div>
          <div class="info-row"><span class="info-row-label">Status</span><span class="info-row-value">${statusBadge(ticket.status)}</span></div>
          <div class="info-row"><span class="info-row-label">Opened</span><span class="info-row-value">${fmtDate(ticket.created_at)}</span></div>
          <div class="info-row"><span class="info-row-label">Last Updated</span><span class="info-row-value">${fmtDate(ticket.updated_at)}</span></div>
          ${ticket.closed_at ? `<div class="info-row"><span class="info-row-label">Closed</span><span class="info-row-value">${fmtDate(ticket.closed_at)}</span></div>` : ''}
        </div>

        <div class="card">
          <div class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Description
          </div>
          <div class="content-block-body ${ticket.description ? '' : 'empty'}">${ticket.description ? escHtml(ticket.description) : 'No description provided.'}</div>
        </div>

        ${ticket.symptoms ? `
        <div class="card">
          <div class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Symptoms / Error Messages
          </div>
          <div class="content-block-body">${escHtml(ticket.symptoms)}</div>
        </div>` : ''}

        ${ticket.solution ? `
        <div class="card" style="border-left:4px solid var(--success);">
          <div class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#065f46" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Resolution / Solution
          </div>
          <div class="content-block-body" style="background:#f0fdf4;border-color:#bbf7d0;">${escHtml(ticket.solution)}</div>
        </div>` : ''}
      </div>

      <!-- RIGHT: sidebar -->
      <div class="section-gap">

        <!-- Status management -->
        <div class="card">
          <div class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Update Status
          </div>
          <div class="status-widget">
            <div class="status-select-row">
              <select class="status-select" id="statusSelect">
                <option value="new"         ${ticket.status==='new'         ? 'selected' : ''}>New</option>
                <option value="in_progress" ${ticket.status==='in_progress' ? 'selected' : ''}>In Progress</option>
                <option value="resolved"    ${ticket.status==='resolved'    ? 'selected' : ''}>Resolved</option>
                <option value="closed"      ${ticket.status==='closed'      ? 'selected' : ''}>Closed</option>
              </select>
              <button class="btn btn-primary btn-sm" id="updateStatusBtn">Update</button>
            </div>
            <div id="solutionWrap" style="${(ticket.status==='resolved'||ticket.status==='closed') ? '' : 'display:none;'}">
              <label class="form-label" style="margin-top:8px;">Resolution Notes</label>
              <textarea id="solutionInput" class="form-control" rows="3" placeholder="Document the resolution…">${escHtml(ticket.solution || '')}</textarea>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="card">
          <div class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Notes
          </div>
          <div class="notes-list" id="notesList">${renderNotes(notes)}</div>
          <div class="form-group mb-0">
            <textarea id="noteInput" class="form-control" rows="2" placeholder="Add a note…" style="min-height:60px;"></textarea>
            <div style="margin-top:8px;display:flex;gap:8px;">
              <input type="text" id="noteAuthor" class="form-control" placeholder="Your name" style="flex:1;">
              <button class="btn btn-secondary btn-sm" id="addNoteBtn">Add</button>
            </div>
          </div>
        </div>

        <!-- Email log -->
        <div class="card">
          <div class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Email Log
          </div>
          <div class="email-log-list" id="emailLogList">${renderEmailLog(emailLog)}</div>
        </div>

      </div>
    </div>
  `;

  bindDetailEvents(ticket);
}

function renderNotes(notes) {
  if (!notes || notes.length === 0) return '<div class="notes-empty">No notes yet.</div>';
  return notes.map(n => `
    <div class="note-item">
      <div class="note-meta">${escHtml(n.author || 'Support')} &mdash; ${fmtDate(n.created_at)}</div>
      <div class="note-body">${escHtml(n.note)}</div>
    </div>
  `).join('');
}

function renderEmailLog(log) {
  if (!log || log.length === 0) return '<div class="notes-empty">No emails sent yet.</div>';
  return log.map(e => `
    <div class="email-log-item">
      <div class="email-log-to">To: ${escHtml(e.to_email)}</div>
      <div class="email-log-subject">${escHtml(e.subject)}</div>
      <div class="email-log-date">${fmtDate(e.sent_at)}</div>
    </div>
  `).join('');
}

// ── Events ───────────────────────────────────────────────────────────────────

function bindDetailEvents(ticket) {
  // Status change: show/hide solution box
  document.getElementById('statusSelect').addEventListener('change', function () {
    const wrap = document.getElementById('solutionWrap');
    wrap.style.display = (this.value === 'resolved' || this.value === 'closed') ? '' : 'none';
  });

  // Update status
  document.getElementById('updateStatusBtn').addEventListener('click', async () => {
    const status   = document.getElementById('statusSelect').value;
    const solution = document.getElementById('solutionInput')?.value.trim() || '';
    const btn = document.getElementById('updateStatusBtn');
    btn.disabled = true;
    btn.textContent = '…';
    try {
      const res  = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, solution })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast('Status updated successfully.');
      loadTicket(); // re-render
    } catch (err) {
      toast(`Error: ${err.message}`, 'error');
      btn.disabled = false;
      btn.textContent = 'Update';
    }
  });

  // Add note
  document.getElementById('addNoteBtn').addEventListener('click', async () => {
    const note   = document.getElementById('noteInput').value.trim();
    const author = document.getElementById('noteAuthor').value.trim() || 'Support';
    if (!note) return toast('Note cannot be empty.', 'warning');
    try {
      const res  = await fetch(`/api/tickets/${ticket.id}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, author })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      document.getElementById('noteInput').value = '';
      toast('Note added.');
      loadTicket();
    } catch (err) {
      toast(`Error: ${err.message}`, 'error');
    }
  });

  // Open email modal
  document.getElementById('emailBtn').addEventListener('click', () => {
    document.getElementById('emailTo').value      = ticket.requester_email;
    document.getElementById('emailSubject').value = `Re: [${ticket.ticket_number}] ${ticket.title}`;
    document.getElementById('emailBody').value    = '';
    document.getElementById('emailModal').classList.add('open');
  });

  // Open edit modal
  document.getElementById('editBtn').addEventListener('click', () => {
    document.getElementById('editTitle').value      = ticket.title || '';
    document.getElementById('editCategory').value   = ticket.category || '';
    document.getElementById('editPriority').value   = ticket.priority || 'medium';
    document.getElementById('editAssignedTo').value = ticket.assigned_to || '';
    document.getElementById('editDescription').value = ticket.description || '';
    document.getElementById('editSymptoms').value   = ticket.symptoms || '';
    document.getElementById('editSolution').value   = ticket.solution || '';
    document.getElementById('editModal').classList.add('open');
  });
}

// ── Modal controls ────────────────────────────────────────────────────────────

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

document.getElementById('closeEmailModal').addEventListener('click', () => closeModal('emailModal'));
document.getElementById('cancelEmailModal').addEventListener('click', () => closeModal('emailModal'));
document.getElementById('closeEditModal').addEventListener('click', () => closeModal('editModal'));
document.getElementById('cancelEditModal').addEventListener('click', () => closeModal('editModal'));

// Close modal on overlay click
['emailModal','editModal'].forEach(id => {
  document.getElementById(id).addEventListener('click', function (e) {
    if (e.target === this) closeModal(id);
  });
});

// Send email
document.getElementById('sendEmailBtn').addEventListener('click', async () => {
  const to_email = document.getElementById('emailTo').value.trim();
  const subject  = document.getElementById('emailSubject').value.trim();
  const body     = document.getElementById('emailBody').value.trim();

  if (!to_email || !subject || !body) return toast('All email fields are required.', 'warning');

  const btn = document.getElementById('sendEmailBtn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Sending…`;

  try {
    const res  = await fetch(`/api/tickets/${ticketId}/email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_email, subject, body })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    closeModal('emailModal');
    toast('Email sent successfully.');
    loadTicket();
  } catch (err) {
    toast(`Email failed: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Email`;
  }
});

// Save edits
document.getElementById('saveEditBtn').addEventListener('click', async () => {
  const body = {
    title:       document.getElementById('editTitle').value.trim(),
    category:    document.getElementById('editCategory').value,
    priority:    document.getElementById('editPriority').value,
    assigned_to: document.getElementById('editAssignedTo').value.trim(),
    description: document.getElementById('editDescription').value.trim(),
    symptoms:    document.getElementById('editSymptoms').value.trim(),
    solution:    document.getElementById('editSolution').value.trim()
  };

  const btn = document.getElementById('saveEditBtn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    const res  = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    closeModal('editModal');
    toast('Ticket updated.');
    loadTicket();
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
});

// ── Load ──────────────────────────────────────────────────────────────────────

async function loadTicket() {
  try {
    const res  = await fetch(`/api/tickets/${ticketId}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    document.title = `${data.ticket.ticket_number} — Support Desk`;
    renderPage(data.ticket, data.notes, data.emailLog);
  } catch (err) {
    document.getElementById('pageContainer').innerHTML =
      `<div class="empty-state" style="padding:80px 20px;"><p style="color:var(--danger);">Error loading ticket: ${err.message}</p><a href="/" class="btn btn-secondary" style="margin-top:16px;">Back to Dashboard</a></div>`;
  }
}

loadTicket();
