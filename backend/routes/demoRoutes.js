const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const emailService = require('../utils/emailService');
const { generalLimiter } = require('../middleware/rateLimiter');

router.use(generalLimiter);

// POST /api/demo/send-email
router.post('/demo/send-email', async (req, res) => {
  try {
    const { targetEmail, userName } = req.body;

    const emailAddress = targetEmail || 'yash.badgujar582006@gmail.com';
    const name = userName || 'Yash';

    const result = await pool.query(
      `SELECT * FROM people WHERE first_name ILIKE $1 LIMIT 5`,
      [`%${name}%`]
    );

    const userData = result.rows;

    let dataSource = 'manual entry';
    if (userData.length > 0) {
      dataSource = 'people table';
    }

    const emailTemplate = `<h2>Hello ${name}</h2><p>Demo email from Greetflow</p>`;

    const emailResult = await emailService.sendEmail({
      to: emailAddress,
      name,
      subject: `Hello ${name}`,
      htmlTemplate: emailTemplate
    });

    res.json({
      success: emailResult.success,
      data: {
        dataSource,
        databaseRecordsFound: userData.length
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/demo/send-to-user
router.post('/demo/send-to-user', async (req, res) => {
  try {
    const { userName, userEmail } = req.body;

    let query = `SELECT * FROM users`;
    const values = [];

    if (userName) {
      values.push(`%${userName}%`);
      query += ` WHERE name ILIKE $1`;
    } else if (userEmail) {
      values.push(userEmail);
      query += ` WHERE email = $1`;
    }

    query += ` LIMIT 1`;

    const result = await pool.query(query, values);
    const userData = result.rows;

    if (userData.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userData[0];

    const emailResult = await emailService.sendEmail({
      to: user.email,
      name: user.name,
      subject: `Hello ${user.name}`,
      htmlTemplate: `<h2>Hello ${user.name}</h2>`
    });

    res.json({
      success: emailResult.success,
      data: user
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET users
router.get('/demo/users', async (req, res) => {
  try {
    const { search = 'yash', limit = 10 } = req.query;

    const result = await pool.query(
      `SELECT id, name, email, phone, created_at
       FROM users
       WHERE name ILIKE $1
       LIMIT $2`,
      [`%${search}%`, limit]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST template email
router.post('/demo/template-email', async (req, res) => {
  try {
    const { templateId } = req.body;

    let templateResult;

    if (templateId) {
      templateResult = await pool.query(
        `SELECT * FROM templates WHERE id=$1`,
        [templateId]
      );
    } else {
      templateResult = await pool.query(`SELECT * FROM templates LIMIT 1`);
    }

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No template found' });
    }

    const template = templateResult.rows[0];

    const usersResult = await pool.query(`SELECT * FROM users LIMIT 5`);
    const users = usersResult.rows;

    let successCount = 0;

    for (const user of users) {
      const emailResult = await emailService.sendEmail({
        to: user.email,
        name: user.name,
        subject: `Hello ${user.name}`,
        htmlTemplate: `<h2>Hello ${user.name}</h2>`
      });

      if (emailResult.success) successCount++;
    }

    res.json({
      success: true,
      message: `${successCount} emails sent`,
      template: template.name
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;