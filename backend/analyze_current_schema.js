const { supabase } = require('./config/supabase');
require('dotenv').config();

async function analyzeCurrentSchema() {
  console.log('🔍 Analyzing current database schema after table removal...\n');

  const tables = ['users', 'templates', 'campaigns', 'email_logs', 'oauth_tokens', 'audit_logs'];
  
  for (const table of tables) {
    try {
      console.log(`📋 ${table.toUpperCase()} TABLE:`);
      console.log('═'.repeat(50));
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Error: ${error.message}`);
      } else {
        console.log(`✅ Table exists with ${data.length > 0 ? 'data' : 'no data'}`);
        if (data.length > 0) {
          console.log('📊 Columns:', Object.keys(data[0]).join(', '));
          console.log('📝 Sample record structure:');
          Object.entries(data[0]).forEach(([key, value]) => {
            const type = typeof value;
            const preview = type === 'string' && value.length > 50 
              ? value.substring(0, 50) + '...' 
              : value;
            console.log(`   ${key}: ${type} (${preview})`);
          });
        }
      }
      console.log('');
    } catch (err) {
      console.log(`❌ ${table} - Error: ${err.message}\n`);
    }
  }

  // Check for removed tables
  console.log('🗑️  REMOVED TABLES (should not exist):');
  console.log('═'.repeat(50));
  
  const removedTables = ['people', 'sends'];
  for (const table of removedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        console.log(`✅ ${table} - Successfully removed`);
      } else {
        console.log(`❌ ${table} - Still exists! May need manual removal`);
      }
    } catch (err) {
      console.log(`✅ ${table} - Successfully removed (${err.message})`);
    }
  }

  console.log('\n🎯 API REQUIREMENTS BASED ON CURRENT SCHEMA:');
  console.log('═'.repeat(50));
  console.log('✅ USERS API - Replace people API functionality');
  console.log('✅ TEMPLATES API - Already exists, may need updates');
  console.log('✅ CAMPAIGNS API - Update to work with users instead of people');
  console.log('✅ EMAIL_LOGS API - For email tracking and analytics');
  console.log('✅ OAUTH_TOKENS API - For Gmail integration');
  console.log('✅ AUDIT_LOGS API - For system auditing');
  console.log('✅ EMAIL AUTOMATION API - Already implemented');
}

analyzeCurrentSchema().then(() => {
  console.log('\n✨ Schema analysis completed.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
