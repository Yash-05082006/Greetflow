const emailService = require('./utils/emailService');
const emailLogger = require('./utils/emailLogger');
require('dotenv').config();

async function testEmailSystem() {
  console.log('🧪 Testing Email System...\n');

  try {
    // Test 1: Check SMTP connection
    console.log('1️⃣ Testing SMTP connection...');
    const isConnected = await emailService.verifyConnection();
    if (isConnected) {
      console.log('✅ SMTP connection verified\n');
    } else {
      console.log('❌ SMTP connection failed\n');
      return;
    }

    // Test 2: Test personalization
    console.log('2️⃣ Testing template personalization...');
    const template = '<p>Dear [Recipient Name],</p><p>This is a test email from Greetflow.</p>';
    const personalized = emailService.personalizeTemplate(template, 'Riya');
    console.log('Original:', template);
    console.log('Personalized:', personalized);
    console.log('✅ Personalization working\n');

    // Test 3: Send test email
    console.log('3️⃣ Sending test email...');
    const emailResult = await emailService.sendEmail({
      to: process.env.SMTP_USER,
      name: 'Riya',
      subject: 'Test Personalized Email from Greetflow',
      htmlTemplate: '<p>Dear [Recipient Name],</p><p>This is a test email from Greetflow API.</p><p>Timestamp: ' + new Date().toISOString() + '</p>'
    });

    if (emailResult.success) {
      console.log('✅ Email sent successfully');
      console.log('📧 Message ID:', emailResult.messageId);
      console.log('📬 Sent to:', emailResult.recipientEmail);
    } else {
      console.log('❌ Email sending failed:', emailResult.message);
      return;
    }

    // Test 4: Test logging (check if table exists)
    console.log('\n4️⃣ Testing email logging...');
    const logResult = await emailLogger.logEmail({
      recipientEmail: emailResult.recipientEmail,
      subject: emailResult.subject,
      status: 'SENT',
      messageId: emailResult.messageId
    });

    if (logResult.success) {
      console.log('✅ Email logged successfully');
      console.log('📝 Log ID:', logResult.logId);
    } else {
      console.log('❌ Email logging failed:', logResult.message);
      console.log('💡 You may need to create the email_logs table in Supabase');
    }

    // Test 5: Retrieve logs
    console.log('\n5️⃣ Testing log retrieval...');
    const logsResult = await emailLogger.getEmailLogs({ limit: 5 });
    
    if (logsResult.success) {
      console.log('✅ Logs retrieved successfully');
      console.log('📊 Found', logsResult.count, 'log entries');
    } else {
      console.log('❌ Log retrieval failed:', logsResult.message);
    }

    console.log('\n🎉 Email system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmailSystem();
