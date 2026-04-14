require('dotenv').config();
const pool = require('./db');

// Generic query function (replacement for supabase)
const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return { data: res.rows, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

module.exports = {
  query
};