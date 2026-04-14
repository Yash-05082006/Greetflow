const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/analytics/summary
router.get('/summary', async (req, res) => {
  try {
    const { from, to } = req.query;

    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(new Date().setDate(toDate.getDate() - 30));

    const fromISO = fromDate.toISOString();
    const toISO = toDate.toISOString();

    // Single optimized query instead of 4 calls
    const result = await pool.query(
      `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'sent') AS sent,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed,
        COUNT(*) FILTER (WHERE status = 'skipped') AS skipped,
        COUNT(*) FILTER (WHERE status = 'queued') AS queued
      FROM sends
      WHERE scheduled_for >= $1 AND scheduled_for <= $2
      `,
      [fromISO, toISO]
    );

    const data = result.rows[0];

    const sent = parseInt(data.sent) || 0;
    const failed = parseInt(data.failed) || 0;
    const skipped = parseInt(data.skipped) || 0;
    const queued = parseInt(data.queued) || 0;

    const total = sent + failed + skipped + queued;

    res.json({
      success: true,
      data: {
        sent,
        failed,
        skipped,
        queued,
        total,
        dateRange: {
          from: fromISO,
          to: toISO
        }
      }
    });

  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/analytics/popular-templates
// Returns top templates by usage_count from Neon (both uploaded and ai_generated)
router.get('/popular-templates', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const result = await pool.query(
      `SELECT id, display_name AS name, template_type, usage_count
       FROM uploaded_templates
       ORDER BY usage_count DESC, created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[analytics/popular-templates]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/analytics/email-stats
// Returns real email metrics from email_logs table, filtered by ?days=N (default 30)
router.get('/email-stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'success' OR status = 'sent') AS success,
         COUNT(*) FILTER (WHERE status = 'failed') AS failed
       FROM email_logs
       WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL`,
      [days]
    );
    const row = result.rows[0];
    const total   = parseInt(row.total)   || 0;
    const success = parseInt(row.success) || 0;
    const failed  = parseInt(row.failed)  || 0;
    const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : '0.0';
    res.json({ success: true, data: { total, success, failed, successRate } });
  } catch (error) {
    console.error('[analytics/email-stats]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;