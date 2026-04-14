const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET users
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT *, COUNT(*) OVER() as total
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rows[0]?.total || 0
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;

    const result = await pool.query(
      `INSERT INTO users (name, email)
       VALUES ($1, $2)
       RETURNING *`,
      [name, email]
    );

    res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *`,
      [req.body.name, req.body.email, req.params.id]
    );

    res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM users WHERE id=$1`, [req.params.id]);
    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;