// Basic test to verify server can start without Supabase
const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ success: true, message: 'Server is working!' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Test endpoint: http://localhost:3001/test');
});
