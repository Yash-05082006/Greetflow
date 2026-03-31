const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/campaigns - List campaigns with filtering
router.get('/', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('campaigns')
      .select(`
        *,
        templates (name, type)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);

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

// POST /api/campaigns - Create new campaign
router.post('/', async (req, res) => {
  try {
    const { title, type, template_id, audience_query, channel, scheduled_at } = req.body;

    // Validate required fields
    if (!title || !type || !template_id) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'title, type, and template_id are required.' } });
    }

    // Validate template_id exists
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('id')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Template with id ${template_id} not found.` } });
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert([{
        title,
        type,
        template_id,
        audience_query: audience_query || {},
        channel: channel || 'gmail',
        scheduled_at,
        status: scheduled_at ? 'scheduled' : 'draft'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/campaigns/:id - Get specific campaign
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        templates (name, type)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });

    res.json({ success: true, data });
  } catch (error) {
    if (error.code === 'PGRST116') { // PostgREST error for no rows found
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, template_id, audience_query, scheduled_at, status } = req.body;

    // Prevent updating a campaign that is already sent or cancelled
    const { data: existingCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !existingCampaign) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
    }

    if (['sent', 'cancelled'].includes(existingCampaign.status)) {
      return res.status(422).json({ success: false, error: { code: 'BUSINESS_RULE_VIOLATION', message: `Cannot update a campaign with status '${existingCampaign.status}'.` } });
    }

    const { data, error } = await supabase
      .from('campaigns')
      .update({ title, template_id, audience_query, scheduled_at, status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/campaigns/:id - Cancel campaign
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('campaigns')
      update({ status: 'cancelled' })
      .eq('id', id)
      .select('id, status')
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });

    res.json({ success: true, message: 'Campaign cancelled successfully', data });
  } catch (error) {
    if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/campaigns/:id/send - Trigger immediate campaign send
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;

    // In a real application, this would trigger a background job.
    // For now, we'll just update the status to 'sent'.
    const { data, error } = await supabase
      .from('campaigns')
      .update({ status: 'sent', scheduled_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status')
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });

    // Here you would query the audience and create records in the 'sends' table.
    // This is a placeholder for that logic.
    console.log(`Triggering send for campaign ${id}. Audience would be processed and sends queued.`);

    res.json({ success: true, message: 'Campaign send triggered successfully.', data });
  } catch (error) {
    if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: { code_name: 'NOT_FOUND', message: 'Campaign not found' } });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;