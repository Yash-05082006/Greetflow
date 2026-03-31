const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/sends - List sends with filtering
router.get('/', async (req, res) => {
  try {
    const { status, campaign_id, person_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('sends')
      .select(`
        id,
        status,
        scheduled_for,
        sent_at,
        error_msg,
        channel,
        people (id, first_name, last_name, email),
        templates (id, name, type),
        campaigns (id, title)
      `, { count: 'exact' })
      .order('scheduled_for', { ascending: false });

    if (status) query = query.eq('status', status);
    if (campaign_id) query = query.eq('campaign_id', campaign_id);
    if (person_id) query = query.eq('person_id', person_id);

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sends/retry - Retry failed sends
router.post('/retry', async (req, res) => {
  try {
    const { send_ids } = req.body;

    if (!send_ids || !Array.isArray(send_ids) || send_ids.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'send_ids must be a non-empty array.' } });
    }

    const { data, error } = await supabase
      .from('sends')
      .update({ 
        status: 'queued',
        error_msg: null,
        scheduled_for: new Date().toISOString() // Reschedule for immediate retry
      })
      .in('id', send_ids)
      .eq('status', 'failed') // Only retry sends that have actually failed
      .select('id, status');

    if (error) throw error;

    res.json({ success: true, message: `${data.length} failed sends have been re-queued for delivery.`, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;