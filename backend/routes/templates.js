const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all templates
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM templates ORDER BY created_at DESC`
    );

    res.json({ success: true, data: result.rows });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE template (HTML or Image)
router.post('/', async (req, res) => {
  try {
    const { name, html, image_url, category } = req.body;

    // validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    if (!html && !image_url) {
      return res.status(400).json({
        success: false,
        error: 'Either html or image_url is required'
      });
    }

    // NEW: category validation
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Category is required'
      });
    }

    const result = await pool.query(
      `INSERT INTO templates (name, content, image_url, category)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, html || null, image_url || null, category]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET template by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM templates WHERE id=$1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false });
    }

    res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE template
router.put('/:id', async (req, res) => {
  try {
    const { name, html, image_url, category } = req.body;

    const result = await pool.query(
      `UPDATE templates 
       SET name=$1, content=$2, image_url=$3, category=$4
       WHERE id=$5 
       RETURNING *`,
      [name, html || null, image_url || null, category, req.params.id]
    );

    res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE template
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM templates WHERE id=$1`, [req.params.id]);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;