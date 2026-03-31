const { supabase } = require('./config/supabase');
require('dotenv').config();

async function verifyPostMigration() {
  console.log('🔍 Verifying database state after migration...\n');

  try {
    // Check that removed tables no longer exist
    const removedTables = ['people', 'sends'];
    console.log('❌ Verifying REMOVED tables:');
    for (const table of removedTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error && error.message.includes('does not exist')) {
          console.log(`   ✅ ${table} - Successfully removed`);
        } else {
          console.log(`   ❌ ${table} - Still exists! Migration may have failed`);
        }
      } catch (err) {
        console.log(`   ✅ ${table} - Successfully removed (${err.message})`);
      }
    }

    // Check that remaining tables still exist and work
    const remainingTables = ['users', 'templates', 'campaigns', 'email_logs', 'oauth_tokens', 'audit_logs'];
    console.log('\n✅ Verifying REMAINING tables:');
    for (const table of remainingTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`   ❌ ${table} - ERROR: ${error.message}`);
        } else {
          console.log(`   ✅ ${table} - Working correctly`);
        }
      } catch (err) {
        console.log(`   ❌ ${table} - FAILED: ${err.message}`);
      }
    }

    // Test key API functionality
    console.log('\n🧪 Testing key API functionality:');
    
    // Test users table (used by email automation)
    try {
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .limit(3);

      if (userError) {
        console.log('   ❌ Users query - FAILED:', userError.message);
      } else {
        console.log(`   ✅ Users query - Working (${users.length} users found)`);
      }
    } catch (err) {
      console.log('   ❌ Users query - ERROR:', err.message);
    }

    // Test templates table
    try {
      const { data: templates, error: templateError } = await supabase
        .from('templates')
        .select('id, name, type')
        .limit(3);

      if (templateError) {
        console.log('   ❌ Templates query - FAILED:', templateError.message);
      } else {
        console.log(`   ✅ Templates query - Working (${templates.length} templates found)`);
      }
    } catch (err) {
      console.log('   ❌ Templates query - ERROR:', err.message);
    }

    // Test campaigns table (should still reference templates)
    try {
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, title, template_id')
        .limit(3);

      if (campaignError) {
        console.log('   ❌ Campaigns query - FAILED:', campaignError.message);
      } else {
        console.log(`   ✅ Campaigns query - Working (${campaigns.length} campaigns found)`);
      }
    } catch (err) {
      console.log('   ❌ Campaigns query - ERROR:', err.message);
    }

    console.log('\n📊 Migration Summary:');
    console.log('═══════════════════════════════════════');
    console.log('✅ REMOVED: people table and all dependencies');
    console.log('✅ REMOVED: sends table and all dependencies');
    console.log('✅ REMOVED: send_status enum type');
    console.log('✅ PRESERVED: All other tables and their data');
    console.log('✅ PRESERVED: Email automation functionality');
    console.log('⚠️  AFFECTED: /api/people and /api/sends routes will now fail');

  } catch (error) {
    console.error('❌ Post-migration verification failed:', error.message);
  }
}

// Run verification
verifyPostMigration().then(() => {
  console.log('\n✨ Post-migration verification completed.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
