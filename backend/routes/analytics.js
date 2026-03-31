const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/analytics/summary - Get delivery and engagement metrics
router.get('/summary', async (req, res) => {
  try {
    const { from, to } = req.query;

    // Default to the last 30 days if no date range is provided
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(new Date().setDate(toDate.getDate() - 30));

    const baseQuery = supabase
      .from('sends')
      .select('id', { count: 'exact', head: true })
      .gte('scheduled_for', fromDate.toISOString())
      .lte('scheduled_for', toDate.toISOString());

    const [
      { count: sent },
      { count: failed },
      { count: skipped },
      { count: queued }
    ] = await Promise.all([
      baseQuery.eq('status', 'sent'),
      baseQuery.eq('status', 'failed'),
      baseQuery.eq('status', 'skipped'),
      baseQuery.eq('status', 'queued')
    ]);

    const total = (sent || 0) + (failed || 0) + (skipped || 0) + (queued || 0);

    res.json({
      success: true,
      data: {
        sent: sent || 0,
        failed: failed || 0,
        skipped: skipped || 0,
        queued: queued || 0,
        total: total,
        dateRange: { from: fromDate.toISOString(), to: toDate.toISOString() }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;