// localStorage data layer — replaces the Node.js/Express backend
const Store = {
  _KEY: 'dlc_tickets',

  _load() {
    try { return JSON.parse(localStorage.getItem(this._KEY) || '[]'); }
    catch { return []; }
  },

  _save(tickets) {
    localStorage.setItem(this._KEY, JSON.stringify(tickets));
  },

  _nextId() {
    const t = this._load();
    return t.length ? Math.max(...t.map(x => x.id)) + 1 : 1;
  },

  generateTicketNumber() {
    const tickets = this._load();
    const now = new Date();
    const ds = now.getFullYear().toString() +
               (now.getMonth() + 1).toString().padStart(2, '0') +
               now.getDate().toString().padStart(2, '0');
    const count = tickets.filter(t => t.ticket_number.startsWith(`TKT-${ds}-`)).length;
    return `TKT-${ds}-${(count + 1).toString().padStart(4, '0')}`;
  },

  getAll() { return this._load(); },

  get(ticketNumber) {
    return this._load().find(t => t.ticket_number === ticketNumber) || null;
  },

  create(data) {
    const tickets = this._load();
    const ticket = {
      id: this._nextId(),
      ticket_number: this.generateTicketNumber(),
      title: data.title || '',
      description: data.description || '',
      symptoms: data.symptoms || '',
      requester_name: data.requester_name || '',
      requester_email: data.requester_email || '',
      assigned_to: data.assigned_to || '',
      priority: data.priority || 'medium',
      status: 'new',
      solution: '',
      category: data.category || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      closed_at: null,
      notes: [],
      email_log: []
    };
    tickets.unshift(ticket);
    this._save(tickets);
    return ticket;
  },

  update(ticketNumber, fields) {
    const tickets = this._load();
    const i = tickets.findIndex(t => t.ticket_number === ticketNumber);
    if (i === -1) return null;
    Object.assign(tickets[i], fields, { updated_at: new Date().toISOString() });
    this._save(tickets);
    return tickets[i];
  },

  updateStatus(ticketNumber, status, solution) {
    const extra = {};
    if (status === 'resolved' || status === 'closed') extra.closed_at = new Date().toISOString();
    if (solution !== undefined) extra.solution = solution;
    return this.update(ticketNumber, { status, ...extra });
  },

  addNote(ticketNumber, note, author) {
    const tickets = this._load();
    const i = tickets.findIndex(t => t.ticket_number === ticketNumber);
    if (i === -1) return null;
    const entry = { id: Date.now(), note, author: author || 'Support', created_at: new Date().toISOString() };
    tickets[i].notes.push(entry);
    tickets[i].updated_at = new Date().toISOString();
    this._save(tickets);
    return entry;
  },

  logEmail(ticketNumber, to_email, subject, body) {
    const tickets = this._load();
    const i = tickets.findIndex(t => t.ticket_number === ticketNumber);
    if (i === -1) return null;
    const entry = { id: Date.now(), to_email, subject, body, sent_at: new Date().toISOString() };
    tickets[i].email_log.push(entry);
    tickets[i].updated_at = new Date().toISOString();
    this._save(tickets);
    return entry;
  },

  stats() {
    const tickets = this._load();
    return {
      total:       tickets.length,
      new:         tickets.filter(t => t.status === 'new').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      resolved:    tickets.filter(t => t.status === 'resolved').length,
      closed:      tickets.filter(t => t.status === 'closed').length
    };
  },

  filter({ search = '', status = 'all', priority = 'all' } = {}) {
    return this._load().filter(t => {
      if (status !== 'all' && t.status !== status) return false;
      if (priority !== 'all' && t.priority !== priority) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.ticket_number.toLowerCase().includes(q) &&
            !t.title.toLowerCase().includes(q) &&
            !t.requester_name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  },

  monthlyReport(month, year) {
    const tickets = this._load();
    const m = parseInt(month), y = parseInt(year);

    const opened = tickets.filter(t => {
      const d = new Date(t.created_at);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });

    const closed = tickets.filter(t => {
      if (!t.closed_at) return false;
      const d = new Date(t.closed_at);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });

    let avgResHours = null;
    if (closed.length > 0) {
      const totalH = closed.reduce((s, t) =>
        s + (new Date(t.closed_at) - new Date(t.created_at)) / 3600000, 0);
      avgResHours = (totalH / closed.length).toFixed(1);
    }

    const byPriority = {};
    opened.forEach(t => { byPriority[t.priority] = (byPriority[t.priority] || 0) + 1; });

    const byCategory = {};
    opened.forEach(t => {
      const cat = t.category || 'Uncategorized';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    return {
      month, year,
      summary: {
        total_opened: opened.length,
        total_closed: closed.length,
        new:          opened.filter(t => t.status === 'new').length,
        in_progress:  opened.filter(t => t.status === 'in_progress').length
      },
      avg_resolution_hours: avgResHours,
      by_priority:  Object.entries(byPriority).map(([priority, count]) => ({ priority, count })),
      by_category:  Object.entries(byCategory).map(([category, count]) => ({ category, count })),
      tickets:      opened
    };
  },

  yearlyTrend(year) {
    const tickets = this._load();
    const y = parseInt(year);
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return {
        month:  m,
        opened: tickets.filter(t => { const d = new Date(t.created_at); return d.getFullYear() === y && d.getMonth() + 1 === m; }).length,
        closed: tickets.filter(t => { if (!t.closed_at) return false; const d = new Date(t.closed_at); return d.getFullYear() === y && d.getMonth() + 1 === m; }).length
      };
    });
  }
};
