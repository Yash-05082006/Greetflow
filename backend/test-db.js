require('dotenv').config();

const pool = require('./config/db');

pool.query('SELECT NOW()')
  .then(res => {
    console.log("✅ Connected to Neon DB");
    console.log(res.rows);
  })
  .catch(err => {
    console.error("❌ Connection failed");
    console.error(err);
  });