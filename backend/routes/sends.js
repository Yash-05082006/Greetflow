const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET sends
router.get('/', async (req, res) => {
  try {
    const { status, campaign_id, person_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, 
             p.first_name, p.last_name, p.email,
             t.name as template_name,
             c.title as campaign_title,
             COUNT(*) OVER() as total
      FROM sends s
      LEFT JOIN people p ON s.person_id = p.id
      LEFT JOIN templates t ON s.template_id = t.id
      LEFT JOIN campaigns c ON s.campaign_id = c.id
    `;

    const conditions = [];
    const values = [];

    if (status) {
      values.push(status);
      conditions.push(`s.status = $${values.length}`);
    }
    if (campaign_id) {
      values.push(campaign_id);
      conditions.push(`s.campaign_id = $${values.length}`);
    }
    if (person_id) {
      values.push(person_id);
      conditions.push(`s.person_id = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY s.scheduled_for DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    const total = result.rows[0]?.total || 0;

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// RETRY
router.post('/retry', async (req, res) => {
  try {
    const { send_ids } = req.body;

    const result = await pool.query(
      `UPDATE sends
       SET status='queued', error_msg=NULL, scheduled_for=$1
       WHERE id = ANY($2) AND status='failed'
       RETURNING id, status`,
      [new Date(), send_ids]
    );

    res.json({
      success: true,
      message: `${result.rows.length} retried`,
      data: result.rows
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;