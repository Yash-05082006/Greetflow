const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// POST /api/oauth/gmail/connect - Initiate Gmail OAuth flow
router.post('/gmail/connect', (req, res) => {
  // In a real app, you would use googleapis to generate this URL
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=https://www.googleapis.com/auth/gmail.send&access_type=offline&prompt=consent`;
  
  res.json({
    success: true,
    data: {
      authUrl: authUrl
    },
    message: "Redirect user to this URL to authorize the application."
  });
});

// GET /api/oauth/gmail/status - Check Gmail integration status
router.get('/gmail/status', async (req, res) => {
  try {
    // Check for the most recent, valid token in the database
    const { data, error } = await supabase
      .from('oauth_tokens')
      .select('account_email, expiry')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.json({ success: true, data: { connected: false } });
    }

    const isExpired = new Date(data.expiry) < new Date();
    if (isExpired) {
      return res.json({ success: true, data: { connected: false, message: 'Token has expired.' } });
    }

    res.json({ success: true, data: { connected: true, account_email: data.account_email, expiry: data.expiry } });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;