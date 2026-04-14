const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// POST /api/scheduler/daily
router.post('/daily', async (req, res) => {
  try {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');

    const result = await pool.query(
      `SELECT id, first_name, dob, anniversary_date
       FROM people
       WHERE consent_email = true
       AND (
         TO_CHAR(dob, 'MM-DD') = $1 OR
         TO_CHAR(anniversary_date, 'MM-DD') = $1
       )`,
      [`${month}-${day}`]
    );

    const people = result.rows;

    if (people.length === 0) {
      return res.json({ success: true, message: 'No events today' });
    }

    const templateId = 'a934a81c-1e9c-42b2-8b25-2f7af95ae493';

    const values = [];
    const placeholders = people.map((p, i) => {
      const base = i * 5;
      values.push(p.id, templateId, 'queued', 'gmail', today);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    }).join(',');

    const insertResult = await pool.query(
      `INSERT INTO sends (person_id, template_id, status, channel, scheduled_for)
       VALUES ${placeholders}
       RETURNING id, person_id`,
      values
    );

    res.json({
      success: true,
      message: `${insertResult.rows.length} greetings queued`,
      data: insertResult.rows
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;