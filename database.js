// Uses Node.js built-in sqlite (node:sqlite), available since Node 22.5 — no native compilation needed.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'tickets.db');

let db;

function getDB() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
  }
  return db;
}

function initDB() {
  return new Promise((resolve, reject) => {
    try {
      const database = getDB();
      database.exec(`
        CREATE TABLE IF NOT EXISTS tickets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_number TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          symptoms TEXT DEFAULT '',
          requester_name TEXT NOT NULL,
          requester_email TEXT NOT NULL,
          assigned_to TEXT DEFAULT '',
          priority TEXT DEFAULT 'medium',
          status TEXT DEFAULT 'new',
          solution TEXT DEFAULT '',
          category TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          closed_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS ticket_notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_id INTEGER NOT NULL,
          note TEXT NOT NULL,
          author TEXT DEFAULT 'Support',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS email_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_id INTEGER NOT NULL,
          to_email TEXT NOT NULL,
          subject TEXT NOT NULL,
          body TEXT NOT NULL,
          sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'sent',
          FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
        );
      `);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function generateTicketNumber() {
  const database = getDB();
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');

  const row = database
    .prepare(`SELECT COUNT(*) AS count FROM tickets WHERE ticket_number LIKE 'TKT-${dateStr}-%'`)
    .get();

  const seq = ((row.count || 0) + 1).toString().padStart(4, '0');
  return `TKT-${dateStr}-${seq}`;
}

module.exports = { getDB, initDB, generateTicketNumber };
