const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET campaigns
router.get('/', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, t.name as template_name, t.category as template_category,
      COUNT(*) OVER() as total
      FROM campaigns c
      LEFT JOIN templates t ON c.template_id = t.id
    `;

    const conditions = [];
    const values = [];

    if (status) {
      values.push(status);
      conditions.push(`c.status = $${values.length}`);
    }

    if (type) {
      values.push(type);
      conditions.push(`c.type = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    const total = result.rows[0]?.total || 0;

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE campaign
router.post('/', async (req, res) => {
  try {
    const { title, type, template_id, audience_query, channel, scheduled_at } = req.body;

    const templateCheck = await pool.query(
      `SELECT id FROM templates WHERE id = $1`,
      [template_id]
    );

    if (templateCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const result = await pool.query(
      `INSERT INTO campaigns (title, type, template_id, audience_query, channel, scheduled_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title,
        type,
        template_id,
        audience_query || {},
        channel || 'gmail',
        scheduled_at,
        scheduled_at ? 'scheduled' : 'draft'
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single campaign
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, t.name, t.category
       FROM campaigns c
       LEFT JOIN templates t ON c.template_id = t.id
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({ success: true, data: result.rows[0] });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE campaign
router.put('/:id', async (req, res) => {
  try {
    const existing = await pool.query(
      `SELECT status FROM campaigns WHERE id = $1`,
      [req.params.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    if (['sent', 'cancelled'].includes(existing.rows[0].status)) {
      return res.status(422).json({ success: false, message: 'Cannot update this campaign' });
    }

    const { title, template_id, audience_query, scheduled_at, status } = req.body;

    const result = await pool.query(
      `UPDATE campaigns
       SET title=$1, template_id=$2, audience_query=$3, scheduled_at=$4, status=$5
       WHERE id=$6
       RETURNING *`,
      [title, template_id, audience_query, scheduled_at, status, req.params.id]
    );

    res.json({ success: true, data: result.rows[0] });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE (cancel)
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE campaigns SET status='cancelled' WHERE id=$1 RETURNING id, status`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({ success: true, message: 'Campaign cancelled', data: result.rows[0] });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// SEND campaign
router.post('/:id/send', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE campaigns SET status='sent', scheduled_at=$1 WHERE id=$2 RETURNING id, status`,
      [new Date(), req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({ success: true, message: 'Campaign send triggered', data: result.rows[0] });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;