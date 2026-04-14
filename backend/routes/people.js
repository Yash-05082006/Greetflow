const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET people
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT *, COUNT(*) OVER() as total FROM people`;
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      query += ` WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    const total = result.rows[0]?.total || 0;

    res.json({
      success: true,
      data: result.rows,
      total
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO people (first_name, last_name, email)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.body.first_name, req.body.last_name, req.body.email]
    );

    res.json({ success: true, data: result.rows[0] });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;