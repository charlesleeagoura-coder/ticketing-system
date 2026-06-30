function toast(msg, type = 'error') {
  const c = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function validate() {
  const fields = [
    { id: 'requesterName',  check: v => v.length >= 2 },
    { id: 'requesterEmail', check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    { id: 'title',          check: v => v.length >= 3 },
    { id: 'description',    check: v => v.length >= 5 }
  ];

  let ok = true;
  fields.forEach(({ id, check }) => {
    const el  = document.getElementById(id);
    const val = el.value.trim();
    if (!check(val)) {
      el.classList.add('is-invalid');
      ok = false;
    } else {
      el.classList.remove('is-invalid');
    }
  });
  return ok;
}

['requesterName','requesterEmail','title','description'].forEach(id => {
  document.getElementById(id).addEventListener('input', function () {
    this.classList.remove('is-invalid');
  });
});

document.getElementById('ticketForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate()) {
    toast('Please fill in all required fields.', 'error');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Submitting…`;

  const data = {
    requester_name:  document.getElementById('requesterName').value.trim(),
    requester_email: document.getElementById('requesterEmail').value.trim(),
    title:           document.getElementById('title').value.trim(),
    category:        document.getElementById('category').value,
    priority:        document.getElementById('priority').value,
    description:     document.getElementById('description').value.trim(),
    symptoms:        document.getElementById('symptoms').value.trim(),
    assigned_to:     document.getElementById('assignedTo').value.trim()
  };

  try {
    const ticket = Store.create(data);
    const overlay = document.getElementById('successOverlay');
    document.getElementById('newTicketNum').textContent = ticket.ticket_number;
    document.getElementById('viewTicketBtn').href = `ticket-detail.html?id=${ticket.ticket_number}`;
    overlay.style.display = 'flex';
  } catch (err) {
    toast(`Failed to create ticket: ${err.message}`, 'error');
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Submit Ticket`;
  }
});
