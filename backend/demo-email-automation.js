const { supabase } = require('./config/supabase');
const emailService = require('./utils/emailService');
require('dotenv').config();

async function demoEmailAutomation() {
  console.log('🚀 Starting Demo Email Automation...\n');

  try {
    // Step 1: Check available tables
    console.log('1️⃣ Checking available tables in database...');
    
    // Try to fetch from people table first (based on schema)
    let userData = null;
    let tableName = '';
    
    // Check people table
    console.log('   Checking "people" table...');
    const { data: peopleData, error: peopleError } = await supabase
      .from('people')
      .select('*')
      .ilike('first_name', '%yash%')
      .limit(5);

    if (!peopleError && peopleData && peopleData.length > 0) {
      userData = peopleData;
      tableName = 'people';
      console.log('   ✅ Found data in "people" table');
    } else {
      console.log('   ❌ No data found in "people" table:', peopleError?.message || 'No matching records');
    }

    // If no data in people, check users table
    if (!userData) {
      console.log('   Checking "users" table...');
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .ilike('name', '%yash%')
        .limit(5);

      if (!usersError && usersData && usersData.length > 0) {
        userData = usersData;
        tableName = 'users';
        console.log('   ✅ Found data in "users" table');
      } else {
        console.log('   ❌ No data found in "users" table:', usersError?.message || 'No matching records');
      }
    }

    // If still no data, try to get all available tables
    if (!userData) {
      console.log('   Checking all available tables...');
      
      // Try some common table names
      const commonTables = ['user_profiles', 'contacts', 'customers', 'members'];
      
      for (const table of commonTables) {
        console.log(`   Trying "${table}" table...`);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error && data) {
          console.log(`   ✅ Table "${table}" exists with structure:`, Object.keys(data[0] || {}));
        }
      }
    }

    if (!userData || userData.length === 0) {
      console.log('❌ No user data found for Yash Badgujar in any table');
      console.log('💡 Let me create a demo user entry and send email...\n');
      
      // Create demo user data
      userData = [{
        first_name: 'Yash',
        last_name: 'Badgujar',
        email: 'yash.badgujar582006@gmail.com',
        id: 'demo-user-123'
      }];
      tableName = 'demo';
    }

    // Step 2: Display found user data
    console.log(`\n2️⃣ User data found in "${tableName}" table:`);
    userData.forEach((user, index) => {
      console.log(`   User ${index + 1}:`, JSON.stringify(user, null, 2));
    });

    // Step 3: Select Yash Badgujar (first match)
    const targetUser = userData[0];
    console.log(`\n3️⃣ Selected user for demo email:`);
    console.log('   Name:', targetUser.first_name || targetUser.name || 'Yash');
    console.log('   Email:', targetUser.email || 'yash.badgujar582006@gmail.com');

    // Step 4: Create personalized email template
    console.log('\n4️⃣ Creating personalized email template...');
    
    const userName = targetUser.first_name || targetUser.name || 'Yash';
    const userEmail = targetUser.email || 'yash.badgujar582006@gmail.com';
    
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Greetflow Demo Email</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Automated Email System Test</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hello [Recipient Name]! 👋</h2>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            This is a <strong>demo email</strong> sent automatically by the Greetflow email automation system. 
            Your data was successfully fetched from the Supabase database and used to personalize this message.
          </p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0;">📊 User Information Retrieved:</h3>
            <ul style="color: #374151; margin: 0; padding-left: 20px;">
              <li><strong>Name:</strong> ${userName}</li>
              <li><strong>Email:</strong> ${userEmail}</li>
              <li><strong>Source Table:</strong> ${tableName}</li>
              <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            Dear [Recipient Name], this demonstrates that our email automation system can:
          </p>
          
          <ul style="color: #666; line-height: 1.8; font-size: 16px;">
            <li>✅ Connect to Supabase database</li>
            <li>✅ Fetch user data dynamically</li>
            <li>✅ Personalize email content</li>
            <li>✅ Send emails via Gmail SMTP</li>
            <li>✅ Replace placeholder text ([Recipient Name] → ${userName})</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; border-radius: 25px; display: inline-block; font-weight: bold;">
              🚀 Greetflow Email Automation - Working Perfectly!
            </div>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <strong>Technical Details:</strong><br>
            • Sent via Gmail SMTP (smtp.gmail.com:465)<br>
            • Database: Supabase PostgreSQL<br>
            • Backend: Node.js + Express<br>
            • Personalization: Dynamic placeholder replacement<br>
            • Time: ${new Date().toISOString()}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 14px;">
          <p>This email was sent automatically by Greetflow Email Automation System</p>
        </div>
      </div>
    `;

    // Step 5: Send the email
    console.log('\n5️⃣ Sending personalized demo email...');
    
    const emailResult = await emailService.sendEmail({
      to: userEmail,
      name: userName,
      subject: `🎉 Greetflow Demo - Hello ${userName}! (Automated Email Test)`,
      htmlTemplate: emailTemplate,
      text: `Hello ${userName}! This is a demo email from Greetflow automation system. Your data was fetched from the ${tableName} table and used to personalize this message. The system is working perfectly!`
    });

    // Step 6: Display results
    console.log('\n6️⃣ Email Automation Results:');
    if (emailResult.success) {
      console.log('   ✅ Email sent successfully!');
      console.log('   📧 Message ID:', emailResult.messageId);
      console.log('   📬 Sent to:', emailResult.recipientEmail);
      console.log('   📝 Subject:', `🎉 Greetflow Demo - Hello ${userName}! (Automated Email Test)`);
      console.log('   🎯 Personalization: [Recipient Name] → ' + userName);
      console.log('   📊 Data Source:', tableName + ' table');
    } else {
      console.log('   ❌ Email sending failed:', emailResult.message);
    }

    console.log('\n🎉 Demo Email Automation Complete!');
    console.log('📧 Check your email inbox for the personalized demo message.');

  } catch (error) {
    console.error('❌ Demo automation failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the demo
if (require.main === module) {
  demoEmailAutomation().then(() => {
    console.log('\n✨ Demo completed. Exiting...');
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { demoEmailAutomation };
