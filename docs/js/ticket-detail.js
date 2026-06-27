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

const ticketNum = new URLSearchParams(location.search).get('id');
let currentTicket = null;

// ── Render ───────────────────────────────────────────────────────────────────

function renderPage(ticket) {
  currentTicket = ticket;

  const container = document.getElementById('pageContainer');
  container.innerHTML = `
    <a href="index.html" class="back-link">
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
          <div class="notes-list" id="notesList">${renderNotes(ticket.notes)}</div>
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
          <div class="email-log-list" id="emailLogList">${renderEmailLog(ticket.email_log)}</div>
        </div>

      </div>
    </div>
  `;

  bindDetailEvents();
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
  if (!log || log.length === 0) return '<div class="notes-empty">No emails logged yet.</div>';
  return log.map(e => `
    <div class="email-log-item">
      <div class="email-log-to">To: ${escHtml(e.to_email)}</div>
      <div class="email-log-subject">${escHtml(e.subject)}</div>
      <div class="email-log-date">${fmtDate(e.sent_at)}</div>
    </div>
  `).join('');
}

// ── Events ───────────────────────────────────────────────────────────────────

function bindDetailEvents() {
  document.getElementById('statusSelect').addEventListener('change', function () {
    document.getElementById('solutionWrap').style.display =
      (this.value === 'resolved' || this.value === 'closed') ? '' : 'none';
  });

  document.getElementById('updateStatusBtn').addEventListener('click', () => {
    const status   = document.getElementById('statusSelect').value;
    const solution = document.getElementById('solutionInput')?.value.trim() || '';
    Store.updateStatus(ticketNum, status, solution);
    toast('Status updated successfully.');
    loadTicket();
  });

  document.getElementById('addNoteBtn').addEventListener('click', () => {
    const note   = document.getElementById('noteInput').value.trim();
    const author = document.getElementById('noteAuthor').value.trim() || 'Support';
    if (!note) return toast('Note cannot be empty.', 'warning');
    Store.addNote(ticketNum, note, author);
    document.getElementById('noteInput').value = '';
    toast('Note added.');
    loadTicket();
  });

  document.getElementById('emailBtn').addEventListener('click', () => {
    document.getElementById('emailTo').value      = currentTicket.requester_email;
    document.getElementById('emailSubject').value = `Re: [${currentTicket.ticket_number}] ${currentTicket.title}`;
    document.getElementById('emailBody').value    = '';
    document.getElementById('emailModal').classList.add('open');
  });

  document.getElementById('editBtn').addEventListener('click', () => {
    document.getElementById('editTitle').value       = currentTicket.title || '';
    document.getElementById('editCategory').value    = currentTicket.category || '';
    document.getElementById('editPriority').value    = currentTicket.priority || 'medium';
    document.getElementById('editAssignedTo').value  = currentTicket.assigned_to || '';
    document.getElementById('editDescription').value = currentTicket.description || '';
    document.getElementById('editSymptoms').value    = currentTicket.symptoms || '';
    document.getElementById('editSolution').value    = currentTicket.solution || '';
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

['emailModal','editModal'].forEach(id => {
  document.getElementById(id).addEventListener('click', function (e) {
    if (e.target === this) closeModal(id);
  });
});

// Log email and open mailto: so the user can actually send it
document.getElementById('sendEmailBtn').addEventListener('click', () => {
  const to_email = document.getElementById('emailTo').value.trim();
  const subject  = document.getElementById('emailSubject').value.trim();
  const body     = document.getElementById('emailBody').value.trim();

  if (!to_email || !subject || !body) return toast('All email fields are required.', 'warning');

  Store.logEmail(ticketNum, to_email, subject, body);
  closeModal('emailModal');
  toast('Email logged. Opening your mail client…', 'success');
  window.open(`mailto:${encodeURIComponent(to_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  loadTicket();
});

// Save edits
document.getElementById('saveEditBtn').addEventListener('click', () => {
  const fields = {
    title:       document.getElementById('editTitle').value.trim(),
    category:    document.getElementById('editCategory').value,
    priority:    document.getElementById('editPriority').value,
    assigned_to: document.getElementById('editAssignedTo').value.trim(),
    description: document.getElementById('editDescription').value.trim(),
    symptoms:    document.getElementById('editSymptoms').value.trim(),
    solution:    document.getElementById('editSolution').value.trim()
  };

  Store.update(ticketNum, fields);
  closeModal('editModal');
  toast('Ticket updated.');
  loadTicket();
});

// ── Load ──────────────────────────────────────────────────────────────────────

function loadTicket() {
  if (!ticketNum) {
    document.getElementById('pageContainer').innerHTML =
      `<div class="empty-state" style="padding:80px 20px;"><p style="color:var(--danger);">No ticket ID specified.</p><a href="index.html" class="btn btn-secondary" style="margin-top:16px;">Back to Dashboard</a></div>`;
    return;
  }

  const ticket = Store.get(ticketNum);
  if (!ticket) {
    document.getElementById('pageContainer').innerHTML =
      `<div class="empty-state" style="padding:80px 20px;"><p style="color:var(--danger);">Ticket not found: ${escHtml(ticketNum)}</p><a href="index.html" class="btn btn-secondary" style="margin-top:16px;">Back to Dashboard</a></div>`;
    return;
  }

  document.title = `${ticket.ticket_number} — Support Desk`;
  renderPage(ticket);
}

loadTicket();
