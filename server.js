require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { initDB } = require('./database');
const ticketsRouter = require('./routes/tickets');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/tickets', ticketsRouter);
app.use('/api/reports', reportsRouter);

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/new-ticket', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'new-ticket.html')));
app.get('/ticket/:id', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'ticket-detail.html')));
app.get('/reports', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'reports.html')));

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Ticketing System running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
