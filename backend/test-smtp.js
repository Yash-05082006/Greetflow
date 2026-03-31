const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTP() {
  console.log('🧪 Testing Gmail SMTP credentials...');
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Verify connection
    console.log('📡 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: 'Greetflow SMTP Test',
      text: 'This is a test email confirming that SMTP credentials are valid.',
      html: '<p>This is a test email confirming that SMTP credentials are valid.</p>'
    });

    console.log('✅ SMTP test successful');
    console.log('📧 Message ID:', info.messageId);
    console.log('🎯 Email sent to:', process.env.SMTP_USER);
    
  } catch (error) {
    console.error('❌ SMTP test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Troubleshooting suggestions:');
      console.log('1. Verify Gmail App Password is correct');
      console.log('2. Ensure 2-Step Verification is enabled on Gmail account');
      console.log('3. Generate a new App Password if needed');
      console.log('4. Check that "Less secure app access" is not required');
    }
    
    process.exit(1);
  }
}

testSMTP();
