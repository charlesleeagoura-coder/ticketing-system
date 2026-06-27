const express = require('express');
const router = express.Router();
const { getDB, generateTicketNumber } = require('../database');
const { sendConfirmationEmail, sendResponseEmail } = require('../email/mailer');

// GET /api/tickets
router.get('/', (req, res) => {
  try {
    const db = getDB();
    const { status, priority, search, month, year } = req.query;

    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (priority && priority !== 'all') {
      query += ' AND priority = ?';
      params.push(priority);
    }
    if (search) {
      query += ' AND (ticket_number LIKE ? OR title LIKE ? OR requester_name LIKE ? OR requester_email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (month && year) {
      query += ` AND strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?`;
      params.push(year, month.padStart(2, '0'));
    } else if (year) {
      query += ` AND strftime('%Y', created_at) = ?`;
      params.push(year);
    }

    query += ' ORDER BY created_at DESC';

    const tickets = db.prepare(query).all(...params);
    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tickets/stats
router.get('/stats', (req, res) => {
  try {
    const db = getDB();
    const total = db.prepare('SELECT COUNT(*) as count FROM tickets').get().count;
    const newCount = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'new'").get().count;
    const inProgress = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'in_progress'").get().count;
    const resolved = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved'").get().count;
    const closed = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'").get().count;
    res.json({ success: true, stats: { total, new: newCount, in_progress: inProgress, resolved, closed } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tickets/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const ticket = db
      .prepare('SELECT * FROM tickets WHERE id = ? OR ticket_number = ?')
      .get(req.params.id, req.params.id);

    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    const notes = db
      .prepare('SELECT * FROM ticket_notes WHERE ticket_id = ? ORDER BY created_at ASC')
      .all(ticket.id);
    const emailLog = db
      .prepare('SELECT * FROM email_log WHERE ticket_id = ? ORDER BY sent_at DESC')
      .all(ticket.id);

    res.json({ success: true, ticket, notes, emailLog });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tickets
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { title, description, symptoms, requester_name, requester_email, assigned_to, priority, category } = req.body;

    if (!title || !description || !requester_name || !requester_email) {
      return res.status(400).json({ success: false, error: 'title, description, requester_name, and requester_email are required' });
    }

    const ticket_number = generateTicketNumber();

    const result = db
      .prepare(
        `INSERT INTO tickets (ticket_number, title, description, symptoms, requester_name, requester_email, assigned_to, priority, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        ticket_number,
        title,
        description,
        symptoms || '',
        requester_name,
        requester_email,
        assigned_to || '',
        priority || 'medium',
        category || ''
      );

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);

    // Attempt confirmation email — non-fatal
    try {
      await sendConfirmationEmail(ticket);
      db.prepare(
        'INSERT INTO email_log (ticket_id, to_email, subject, body, status) VALUES (?, ?, ?, ?, ?)'
      ).run(
        ticket.id,
        ticket.requester_email,
        `[${ticket_number}] Ticket Received`,
        `Your ticket ${ticket_number} has been received.`,
        'sent'
      );
    } catch (emailErr) {
      console.warn('Confirmation email failed:', emailErr.message);
    }

    res.status(201).json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/tickets/:id
router.put('/:id', (req, res) => {
  try {
    const db = getDB();
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    const { title, description, symptoms, assigned_to, priority, category, solution } = req.body;

    db.prepare(
      `UPDATE tickets SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        symptoms = COALESCE(?, symptoms),
        assigned_to = COALESCE(?, assigned_to),
        priority = COALESCE(?, priority),
        category = COALESCE(?, category),
        solution = COALESCE(?, solution),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(title ?? null, description ?? null, symptoms ?? null, assigned_to ?? null, priority ?? null, category ?? null, solution ?? null, req.params.id);

    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    res.json({ success: true, ticket: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/tickets/:id/status
router.put('/:id/status', (req, res) => {
  try {
    const db = getDB();
    const { status, solution } = req.body;
    const valid = ['new', 'in_progress', 'resolved', 'closed'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, error: `Status must be one of: ${valid.join(', ')}` });
    }

    const isClosed = status === 'resolved' || status === 'closed';
    if (isClosed) {
      db.prepare(
        `UPDATE tickets SET status = ?, solution = COALESCE(?, solution), closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(status, solution || null, req.params.id);
    } else {
      db.prepare(
        `UPDATE tickets SET status = ?, closed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(status, req.params.id);
    }

    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    res.json({ success: true, ticket: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tickets/:id/notes
router.post('/:id/notes', (req, res) => {
  try {
    const db = getDB();
    const { note, author } = req.body;
    if (!note) return res.status(400).json({ success: false, error: 'note is required' });

    const result = db
      .prepare('INSERT INTO ticket_notes (ticket_id, note, author) VALUES (?, ?, ?)')
      .run(req.params.id, note, author || 'Support');

    const newNote = db.prepare('SELECT * FROM ticket_notes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, note: newNote });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tickets/:id/email
router.post('/:id/email', async (req, res) => {
  try {
    const db = getDB();
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    const { to_email, subject, body } = req.body;
    if (!to_email || !subject || !body) {
      return res.status(400).json({ success: false, error: 'to_email, subject, and body are required' });
    }

    await sendResponseEmail({ to: to_email, subject, body, ticket });

    db.prepare('INSERT INTO email_log (ticket_id, to_email, subject, body, status) VALUES (?, ?, ?, ?, ?)')
      .run(ticket.id, to_email, subject, body, 'sent');

    res.json({ success: true, message: 'Email sent' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
