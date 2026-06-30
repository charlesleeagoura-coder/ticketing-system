# Digital Lee Consulting — Support Desk

A fully client-side IT ticketing system built with pure **HTML, CSS, and JavaScript**. No server, no database, no installation required — runs entirely in the browser using `localStorage`.

## Live URL

**[https://charlesleeagoura-coder.github.io/ticketing-system/](https://charlesleeagoura-coder.github.io/ticketing-system/)**

## Features

- **Ticket management** — create, view, edit, and close tickets with auto-generated ticket numbers (`TKT-YYYYMMDD-XXXX`)
- **Full lifecycle** — New → In Progress → Resolved → Closed
- **Notes & activity log** — add timestamped notes to any ticket
- **Email log** — log outbound emails per ticket; clicking Send opens your mail client pre-filled
- **Dashboard** — searchable, filterable ticket table with live stats (total, new, in-progress, resolved, closed)
- **Monthly reports** — summary stats, priority/category breakdown charts (Chart.js), yearly trend line, and ticket table
- **No installation** — open the URL and start using it; data is saved in your browser's `localStorage`

## Categories

- Hardware, Software, Network, Account / Access, Email, Printer
- Request for Open Practice
- Request for Announcement
- Other

## Project Structure

```
ticketing-system/
├── docs/                      GitHub Pages deployment root
│   ├── index.html             Dashboard
│   ├── new-ticket.html        Ticket creation form
│   ├── ticket-detail.html     View / edit / respond to a ticket
│   ├── reports.html           Monthly report with charts
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── store.js           localStorage data layer (replaces backend)
│       ├── dashboard.js
│       ├── new-ticket.js
│       ├── ticket-detail.js
│       └── reports.js
└── public/                    Local development copy (mirrors docs/)
```

## How Data Works

All ticket data is stored in your browser's `localStorage` under the key `dlc_tickets`. This means:

- Data is **private to the browser** where it was entered
- Data **persists between sessions** unless you clear your browser data
- Multiple users on different computers each have their own separate data

## Run Locally

No installation needed. Open `docs/index.html` directly in your browser, or use any static file server:

```bash
# Python (built into macOS/Linux/Windows with Python installed)
python -m http.server 8080 --directory docs

# Then open: http://localhost:8080
```

## Enabling GitHub Pages

1. Go to the repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / Folder: `/docs`
4. Click **Save** — the live URL appears within ~60 seconds

## License

MIT
