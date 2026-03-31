const { supabase } = require('./config/supabase');
require('dotenv').config();

async function verifyDatabaseState() {
  console.log('🔍 Verifying current database state before migration...\n');

  try {
    // Check which tables exist by trying to query them
    const tablesToCheck = ['people', 'sends', 'users', 'templates', 'campaigns', 'email_logs', 'oauth_tokens', 'audit_logs'];
    const tableStatus = {};

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          tableStatus[table] = `❌ ERROR: ${error.message}`;
        } else {
          tableStatus[table] = `✅ EXISTS (${data?.length || 0} sample records)`;
        }
      } catch (err) {
        tableStatus[table] = `❌ FAILED: ${err.message}`;
      }
    }

    console.log('📊 Current Table Status:');
    console.log('═══════════════════════════════════════');
    Object.entries(tableStatus).forEach(([table, status]) => {
      console.log(`${table.padEnd(15)} | ${status}`);
    });

    console.log('\n🎯 Tables to be REMOVED by migration:');
    console.log('- people');
    console.log('- sends');

    console.log('\n✅ Tables to REMAIN after migration:');
    console.log('- users');
    console.log('- templates');
    console.log('- campaigns');
    console.log('- email_logs');
    console.log('- oauth_tokens');
    console.log('- audit_logs');

    console.log('\n⚠️  WARNING: API routes that will be affected:');
    console.log('- /api/people (will return 404 errors)');
    console.log('- /api/sends (will return 404 errors)');

    console.log('\n✅ API routes that will continue working:');
    console.log('- /api/templates');
    console.log('- /api/campaigns');
    console.log('- /api/send-email (uses users table)');
    console.log('- /api/email-logs');
    console.log('- /api/demo/* (uses users table)');

  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
  }
}

// Run verification
verifyDatabaseState().then(() => {
  console.log('\n✨ Database state verification completed.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
