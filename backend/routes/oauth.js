const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// POST connect (no change needed)
router.post('/gmail/connect', (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=https://www.googleapis.com/auth/gmail.send&access_type=offline&prompt=consent`;

  res.json({
    success: true,
    data: { authUrl }
  });
});

// GET status
router.get('/gmail/status', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT account_email, expiry 
       FROM oauth_tokens 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: { connected: false } });
    }

    const data = result.rows[0];
    const isExpired = new Date(data.expiry) < new Date();

    if (isExpired) {
      return res.json({ success: true, data: { connected: false, message: 'Token expired' } });
    }

    res.json({
      success: true,
      data: {
        connected: true,
        account_email: data.account_email,
        expiry: data.expiry
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;