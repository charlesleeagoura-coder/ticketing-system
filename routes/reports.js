const express = require('express');
const router = express.Router();
const { getDB } = require('../database');

// GET /api/reports/monthly?year=2026&month=6
router.get('/monthly', (req, res) => {
  try {
    const db = getDB();
    const now = new Date();
    const targetYear = (req.query.year || now.getFullYear()).toString();
    const targetMonth = req.query.month
      ? req.query.month.padStart(2, '0')
      : (now.getMonth() + 1).toString().padStart(2, '0');

    const yFilter = `strftime('%Y', created_at) = '${targetYear}' AND strftime('%m', created_at) = '${targetMonth}'`;
    const closedFilter = `strftime('%Y', closed_at) = '${targetYear}' AND strftime('%m', closed_at) = '${targetMonth}'`;

    const totalOpened = db.prepare(`SELECT COUNT(*) as c FROM tickets WHERE ${yFilter}`).get().c;
    const totalClosed = db.prepare(`SELECT COUNT(*) as c FROM tickets WHERE status IN ('resolved','closed') AND ${closedFilter}`).get().c;
    const inProgress  = db.prepare(`SELECT COUNT(*) as c FROM tickets WHERE status = 'in_progress'`).get().c;
    const newCount    = db.prepare(`SELECT COUNT(*) as c FROM tickets WHERE status = 'new'`).get().c;

    const byPriority = db
      .prepare(`SELECT priority, COUNT(*) as count FROM tickets WHERE ${yFilter} GROUP BY priority ORDER BY count DESC`)
      .all();

    const byCategory = db
      .prepare(`SELECT COALESCE(NULLIF(category,''), 'Uncategorized') as category, COUNT(*) as count FROM tickets WHERE ${yFilter} GROUP BY category ORDER BY count DESC`)
      .all();

    const byStatus = db
      .prepare(`SELECT status, COUNT(*) as count FROM tickets WHERE ${yFilter} GROUP BY status`)
      .all();

    const avgRes = db
      .prepare(`SELECT AVG((julianday(closed_at) - julianday(created_at)) * 24) as avg_hours FROM tickets WHERE status IN ('resolved','closed') AND closed_at IS NOT NULL AND ${yFilter}`)
      .get();

    const tickets = db.prepare(`SELECT * FROM tickets WHERE ${yFilter} ORDER BY created_at DESC`).all();

    res.json({
      success: true,
      report: {
        year: targetYear,
        month: targetMonth,
        summary: { total_opened: totalOpened, total_closed: totalClosed, in_progress: inProgress, new: newCount },
        avg_resolution_hours: avgRes.avg_hours != null ? Math.round(avgRes.avg_hours * 10) / 10 : null,
        by_priority: byPriority,
        by_category: byCategory,
        by_status: byStatus,
        tickets
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/yearly?year=2026
router.get('/yearly', (req, res) => {
  try {
    const db = getDB();
    const targetYear = (req.query.year || new Date().getFullYear()).toString();

    const monthly = [];
    for (let m = 1; m <= 12; m++) {
      const month = m.toString().padStart(2, '0');
      const f = `strftime('%Y', created_at) = '${targetYear}' AND strftime('%m', created_at) = '${month}'`;
      const opened    = db.prepare(`SELECT COUNT(*) as c FROM tickets WHERE ${f}`).get().c;
      const closed    = db.prepare(`SELECT COUNT(*) as c FROM tickets WHERE status IN ('resolved','closed') AND ${f}`).get().c;
      const inProgress = db.prepare(`SELECT COUNT(*) as c FROM tickets WHERE status = 'in_progress' AND ${f}`).get().c;
      monthly.push({ month: m, opened, closed, in_progress: inProgress });
    }

    res.json({ success: true, year: targetYear, monthly });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
