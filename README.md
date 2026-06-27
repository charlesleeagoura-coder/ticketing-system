# Support Desk Ticketing System

A web-based IT ticketing system built with Node.js, Express, and SQLite. Tracks support tickets from submission through resolution with email notifications and monthly reporting.

## Features

- **Ticket management** — create, view, edit, and close tickets with auto-generated ticket numbers (`TKT-YYYYMMDD-XXXX`)
- **Full lifecycle** — New → In Progress → Resolved → Closed
- **Email notifications** — automatic confirmation email on ticket creation; manual response emails from the ticket detail page
- **Notes & activity log** — add timestamped notes to any ticket; full email history per ticket
- **Dashboard** — searchable, filterable ticket table with live stats (total, new, in-progress, resolved, closed)
- **Monthly reports** — summary stats, priority/category breakdown charts (Chart.js), yearly trend line, and ticket table
- **No database server** — uses Node.js built-in SQLite (`node:sqlite`); data stored in a single `tickets.db` file

## Requirements

- Node.js **v22.5 or later** (built-in SQLite was added in v22.5)
- npm

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/ticketing-system.git
cd ticketing-system

# 2. Install dependencies
npm install

# 3. (Optional) Configure email — copy and edit .env
cp .env.example .env

# 4. Start the server
npm start
```

Open **http://localhost:3000** in your browser.

> **Note for corporate/enterprise networks:** If npm install fails with an SSL certificate error, run:
> ```bash
> NODE_OPTIONS=--use-system-ca npm install
> ```

## Email Configuration

Without configuration, emails are printed to the console (no emails actually sent). To enable real email sending, create a `.env` file from `.env.example` and fill in your SMTP credentials.

**Gmail example:**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-address@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM="Support Desk <your-address@gmail.com>"
```

Gmail requires an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password).

## Docker

```bash
# Build and run
docker compose up -d

# Ticket data is persisted in ./data/tickets.db
```

## Project Structure

```
ticketing-system/
├── server.js              Express entry point
├── database.js            SQLite init & helpers (node:sqlite built-in)
├── routes/
│   ├── tickets.js         CRUD, status, notes, email endpoints
│   └── reports.js         Monthly & yearly report endpoints
├── email/
│   └── mailer.js          Nodemailer wrappers (SMTP or console-log fallback)
└── public/
    ├── index.html          Dashboard
    ├── new-ticket.html     Ticket creation form
    ├── ticket-detail.html  View / edit / respond to a ticket
    ├── reports.html        Monthly report with charts
    ├── css/styles.css
    └── js/
        ├── dashboard.js
        ├── new-ticket.js
        ├── ticket-detail.js
        └── reports.js
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets` | List tickets (supports `?status=`, `?priority=`, `?search=`) |
| GET | `/api/tickets/stats` | Aggregate counts by status |
| GET | `/api/tickets/:id` | Get ticket + notes + email log |
| POST | `/api/tickets` | Create ticket (sends confirmation email) |
| PUT | `/api/tickets/:id` | Update ticket fields |
| PUT | `/api/tickets/:id/status` | Change status (optionally set solution) |
| POST | `/api/tickets/:id/notes` | Add a note |
| POST | `/api/tickets/:id/email` | Send email response |
| GET | `/api/reports/monthly` | Monthly report (`?year=2026&month=6`) |
| GET | `/api/reports/yearly` | Yearly trend (`?year=2026`) |

## License

MIT
