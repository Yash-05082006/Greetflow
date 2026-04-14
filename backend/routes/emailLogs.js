const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET logs
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT *, COUNT(*) OVER() as total FROM email_logs`;
    const values = [];
    const conditions = [];

    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    const total = result.rows[0]?.total || 0;

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        total
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;