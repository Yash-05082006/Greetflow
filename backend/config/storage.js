const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use the SERVICE ROLE key (not anon) so the backend can upload/delete
// files in Supabase storage without being blocked by Row Level Security.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;