const { supabase } = require('../config/supabase');
const fs = require('fs');
const path = require('path');

async function setupEmailLogsTable() {
  try {
    console.log('🗄️ Setting up email_logs table...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_email_logs_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Failed to create email_logs table:', error.message);
      
      // Try alternative method - create table directly
      console.log('🔄 Trying alternative method...');
      
      const { error: createError } = await supabase
        .from('email_logs')
        .select('id')
        .limit(1);

      if (createError && createError.code === '42P01') {
        console.log('📝 Table does not exist. Please create it manually in Supabase dashboard.');
        console.log('SQL to execute:');
        console.log(sql);
        return false;
      } else if (createError) {
        console.error('❌ Error checking table:', createError.message);
        return false;
      } else {
        console.log('✅ email_logs table already exists');
        return true;
      }
    }

    console.log('✅ email_logs table created successfully');
    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  setupEmailLogsTable().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { setupEmailLogsTable };
