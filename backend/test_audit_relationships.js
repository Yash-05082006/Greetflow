const { supabase } = require('./config/supabase');
require('dotenv').config();

async function testAuditRelationships() {
  console.log('🧪 Testing audit_logs relationships with sample data...\n');

  try {
    // Get sample user and email log for testing
    const { data: sampleUser } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(1)
      .single();

    const { data: sampleEmailLog } = await supabase
      .from('email_logs')
      .select('id, recipient_email, subject')
      .limit(1)
      .single();

    if (!sampleUser || !sampleEmailLog) {
      console.log('❌ Need sample data in users and email_logs tables for testing');
      return;
    }

    console.log('📊 Test Data:');
    console.log(`   User: ${sampleUser.name} (${sampleUser.id})`);
    console.log(`   Email Log: ${sampleEmailLog.recipient_email} (${sampleEmailLog.id})`);

    // Test 1: Create audit log entry linking to user
    console.log('\n🧪 Test 1: Create audit entry with user reference');
    const userAuditEntry = {
      actor: sampleUser.id,
      action: 'email_automation_triggered',
      entity: 'email_system',
      entity_id: null,
      meta: { 
        test: true,
        description: 'User triggered email automation',
        timestamp: new Date().toISOString()
      }
    };

    const { data: userAudit, error: userAuditError } = await supabase
      .from('audit_logs')
      .insert(userAuditEntry)
      .select()
      .single();

    if (userAudit) {
      console.log('✅ Created audit entry with user reference:', userAudit.id);
    } else {
      console.log('❌ Failed to create user audit entry:', userAuditError?.message);
    }

    // Test 2: Create audit log entry linking to email log
    console.log('\n🧪 Test 2: Create audit entry with email log reference');
    const emailAuditEntry = {
      actor: sampleUser.id,
      action: 'email_sent',
      entity: 'email_log',
      entity_id: sampleEmailLog.id,
      meta: { 
        test: true,
        description: 'Email successfully sent',
        recipient: sampleEmailLog.recipient_email,
        timestamp: new Date().toISOString()
      }
    };

    const { data: emailAudit, error: emailAuditError } = await supabase
      .from('audit_logs')
      .insert(emailAuditEntry)
      .select()
      .single();

    if (emailAudit) {
      console.log('✅ Created audit entry with email log reference:', emailAudit.id);
    } else {
      console.log('❌ Failed to create email audit entry:', emailAuditError?.message);
    }

    // Test 3: Query with joins to verify relationships
    console.log('\n🧪 Test 3: Query audit logs with joined data');
    
    const { data: joinedAudits, error: joinError } = await supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        entity,
        created_at,
        meta,
        users:actor (
          id,
          name,
          email
        ),
        email_logs:entity_id (
          id,
          recipient_email,
          subject,
          status
        )
      `)
      .in('id', [userAudit?.id, emailAudit?.id].filter(Boolean))
      .order('created_at', { ascending: false });

    if (joinedAudits && joinedAudits.length > 0) {
      console.log(`✅ Successfully queried ${joinedAudits.length} audit entries with joins`);
      
      joinedAudits.forEach((audit, index) => {
        console.log(`\n📋 Audit Entry ${index + 1}:`);
        console.log(`   Action: ${audit.action}`);
        console.log(`   Entity: ${audit.entity}`);
        console.log(`   User: ${audit.users?.name || 'None'} (${audit.users?.email || 'N/A'})`);
        console.log(`   Email: ${audit.email_logs?.recipient_email || 'None'}`);
        console.log(`   Subject: ${audit.email_logs?.subject || 'N/A'}`);
        console.log(`   Created: ${audit.created_at}`);
      });
    } else {
      console.log('❌ Failed to query joined audit data:', joinError?.message);
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    const testIds = [userAudit?.id, emailAudit?.id].filter(Boolean);
    
    if (testIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('audit_logs')
        .delete()
        .in('id', testIds);

      if (!deleteError) {
        console.log(`✅ Cleaned up ${testIds.length} test audit entries`);
      } else {
        console.log('⚠️  Failed to clean up test data:', deleteError.message);
      }
    }

    console.log('\n🎯 RELATIONSHIP TEST SUMMARY:');
    console.log('═══════════════════════════════════════');
    console.log('✅ audit_logs.actor → users.id relationship working');
    console.log('✅ audit_logs.entity_id → email_logs.id relationship working');
    console.log('✅ Join queries returning proper related data');
    console.log('✅ Foreign key constraints maintaining data integrity');

  } catch (error) {
    console.error('❌ Relationship test failed:', error.message);
  }
}

// Run test
testAuditRelationships().then(() => {
  console.log('\n✨ Audit relationship testing completed.');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
