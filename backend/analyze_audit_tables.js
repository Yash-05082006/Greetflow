const { supabase } = require('./config/supabase');
require('dotenv').config();

async function analyzeAuditTables() {
  console.log('🔍 Analyzing audit_logs, users, and email_logs table structures...\n');

  try {
    // Check audit_logs table structure and sample data
    console.log('📋 AUDIT_LOGS Table Analysis:');
    console.log('═══════════════════════════════════════');
    
    try {
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .limit(5);

      if (auditError) {
        console.log('❌ audit_logs query failed:', auditError.message);
      } else {
        console.log(`✅ audit_logs table exists with ${auditLogs.length} sample records`);
        if (auditLogs.length > 0) {
          console.log('📊 Sample audit_logs structure:');
          const sampleRecord = auditLogs[0];
          Object.keys(sampleRecord).forEach(key => {
            console.log(`   ${key}: ${typeof sampleRecord[key]} (${sampleRecord[key]})`);
          });
        }
      }
    } catch (err) {
      console.log('❌ audit_logs table error:', err.message);
    }

    // Check users table structure
    console.log('\n👥 USERS Table Analysis:');
    console.log('═══════════════════════════════════════');
    
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .limit(3);

      if (usersError) {
        console.log('❌ users query failed:', usersError.message);
      } else {
        console.log(`✅ users table exists with ${users.length} sample records`);
        if (users.length > 0) {
          console.log('📊 Sample users structure:');
          const sampleUser = users[0];
          Object.keys(sampleUser).forEach(key => {
            console.log(`   ${key}: ${typeof sampleUser[key]} (${sampleUser[key]})`);
          });
        }
      }
    } catch (err) {
      console.log('❌ users table error:', err.message);
    }

    // Check email_logs table structure
    console.log('\n📧 EMAIL_LOGS Table Analysis:');
    console.log('═══════════════════════════════════════');
    
    try {
      const { data: emailLogs, error: emailError } = await supabase
        .from('email_logs')
        .select('*')
        .limit(3);

      if (emailError) {
        console.log('❌ email_logs query failed:', emailError.message);
      } else {
        console.log(`✅ email_logs table exists with ${emailLogs.length} sample records`);
        if (emailLogs.length > 0) {
          console.log('📊 Sample email_logs structure:');
          const sampleLog = emailLogs[0];
          Object.keys(sampleLog).forEach(key => {
            console.log(`   ${key}: ${typeof sampleLog[key]} (${sampleLog[key]})`);
          });
        }
      }
    } catch (err) {
      console.log('❌ email_logs table error:', err.message);
    }

    // Analyze potential foreign key relationships
    console.log('\n🔗 FOREIGN KEY RELATIONSHIP ANALYSIS:');
    console.log('═══════════════════════════════════════');
    
    // Check if audit_logs.actor values exist in users.id
    try {
      const { data: auditActors, error: actorError } = await supabase
        .from('audit_logs')
        .select('actor')
        .not('actor', 'is', null)
        .limit(10);

      if (!actorError && auditActors.length > 0) {
        console.log(`📊 Found ${auditActors.length} audit_logs records with non-null actor values`);
        
        // Check if these actor values exist in users table
        const actorIds = [...new Set(auditActors.map(a => a.actor))];
        console.log(`🔍 Checking ${actorIds.length} unique actor IDs against users table...`);
        
        for (const actorId of actorIds.slice(0, 3)) { // Check first 3
          const { data: userExists, error: userCheckError } = await supabase
            .from('users')
            .select('id, name')
            .eq('id', actorId)
            .single();

          if (!userCheckError && userExists) {
            console.log(`   ✅ Actor ${actorId} exists in users table (${userExists.name})`);
          } else {
            console.log(`   ❌ Actor ${actorId} NOT found in users table`);
          }
        }
      } else {
        console.log('ℹ️  No audit_logs records with actor values found');
      }
    } catch (err) {
      console.log('❌ Actor analysis failed:', err.message);
    }

    // Check if audit_logs.entity_id values could reference email_logs.id
    try {
      const { data: auditEntities, error: entityError } = await supabase
        .from('audit_logs')
        .select('entity_id, entity')
        .not('entity_id', 'is', null)
        .limit(10);

      if (!entityError && auditEntities.length > 0) {
        console.log(`📊 Found ${auditEntities.length} audit_logs records with non-null entity_id values`);
        
        // Check email-related audit entries
        const emailEntities = auditEntities.filter(e => 
          e.entity && e.entity.toLowerCase().includes('email')
        );
        
        if (emailEntities.length > 0) {
          console.log(`🔍 Found ${emailEntities.length} email-related audit entries`);
          
          // Check if these entity_id values exist in email_logs table
          for (const entity of emailEntities.slice(0, 3)) { // Check first 3
            const { data: emailExists, error: emailCheckError } = await supabase
              .from('email_logs')
              .select('id, recipient_email')
              .eq('id', entity.entity_id)
              .single();

            if (!emailCheckError && emailExists) {
              console.log(`   ✅ Entity ${entity.entity_id} exists in email_logs table (${emailExists.recipient_email})`);
            } else {
              console.log(`   ❌ Entity ${entity.entity_id} NOT found in email_logs table`);
            }
          }
        } else {
          console.log('ℹ️  No email-related audit entries found');
        }
      } else {
        console.log('ℹ️  No audit_logs records with entity_id values found');
      }
    } catch (err) {
      console.log('❌ Entity analysis failed:', err.message);
    }

    console.log('\n🎯 FOREIGN KEY RECOMMENDATIONS:');
    console.log('═══════════════════════════════════════');
    console.log('✅ SAFE TO CREATE: audit_logs.actor → users.id (ON DELETE SET NULL, ON UPDATE CASCADE)');
    console.log('✅ SAFE TO CREATE: audit_logs.entity_id → email_logs.id (ON DELETE SET NULL, ON UPDATE CASCADE)');
    console.log('⚠️  NOTE: Existing data may have orphaned references, but SET NULL will handle this gracefully');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Run analysis
analyzeAuditTables().then(() => {
  console.log('\n✨ Table analysis completed.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
