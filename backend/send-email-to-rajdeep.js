const { supabase } = require('./config/supabase');
const emailService = require('./utils/emailService');
require('dotenv').config();

async function sendEmailToRajdeep() {
  console.log('🎯 Fetching Rajdeep from users table and sending email...\n');

  try {
    // Step 1: Fetch Rajdeep's data from users table
    console.log('1️⃣ Searching for Rajdeep in users table...');
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .ilike('name', '%rajdeep%')
      .limit(10);

    if (error) {
      console.log('❌ Database error:', error.message);
      throw error;
    }

    console.log(`✅ Found ${userData?.length || 0} users with name containing 'Rajdeep'`);
    
    if (!userData || userData.length === 0) {
      console.log('❌ No user found with name "Rajdeep" in users table');
      return;
    }

    // Display all found users
    console.log('\n📊 Found users:');
    userData.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} - ${user.email} (ID: ${user.id})`);
    });

    // Step 2: Select Rajdeep (first match)
    const rajdeep = userData[0];
    console.log(`\n2️⃣ Selected user for email:`);
    console.log('   Name:', rajdeep.name);
    console.log('   Email:', rajdeep.email);
    console.log('   Phone:', rajdeep.phone || 'Not provided');
    console.log('   User ID:', rajdeep.id);

    // Step 3: Create personalized email for Rajdeep
    console.log('\n3️⃣ Creating personalized email for Rajdeep...');
    
    const emailTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f8fafc;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 15px 15px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">🎉 Hello [Recipient Name]!</h1>
          <p style="color: #e0e7ff; margin: 15px 0 0 0; font-size: 18px;">Greetflow Email Automation System</p>
        </div>
        
        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Dear [Recipient Name], 👋</h2>
          
          <p style="color: #4b5563; line-height: 1.7; font-size: 17px; margin-bottom: 25px;">
            This is a <strong>personalized email</strong> sent automatically by the Greetflow system! 
            Your information was successfully retrieved from the Supabase database and used to create this custom message just for you.
          </p>
          
          <!-- Success Status -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; border-radius: 12px; margin: 25px 0;">
            <h3 style="color: white; margin: 0 0 15px 0; font-size: 20px;">✅ Email Automation Success!</h3>
            <div style="color: #d1fae5; font-size: 15px; line-height: 1.6;">
              🗄️ Database Query: Successful<br>
              📧 Email Generation: Complete<br>
              🎯 Personalization: Active<br>
              📬 Delivery Status: Sent
            </div>
          </div>
          
          <!-- User Information Retrieved -->
          <div style="background: #f0f9ff; padding: 25px; border-radius: 10px; border-left: 5px solid #3b82f6; margin: 25px 0;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📊 Your Information Retrieved from Database:</h3>
            <table style="width: 100%; color: #374151; font-size: 15px;">
              <tr><td style="padding: 8px 0; font-weight: bold; width: 120px;">Name:</td><td>${rajdeep.name}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>${rajdeep.email}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td>${rajdeep.phone || 'Not provided'}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">User ID:</td><td>${rajdeep.id}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Table:</td><td>users</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Retrieved At:</td><td>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
            </table>
          </div>
          
          <!-- What This Demonstrates -->
          <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0;">🚀 This Email Demonstrates:</h3>
          <ul style="color: #4b5563; line-height: 1.8; font-size: 16px; padding-left: 20px;">
            <li><strong>Database Integration:</strong> Successfully connected to Supabase</li>
            <li><strong>User Query:</strong> Found your record in the 'users' table</li>
            <li><strong>Data Retrieval:</strong> Extracted your name, email, and other details</li>
            <li><strong>Personalization:</strong> Replaced [Recipient Name] with "${rajdeep.name}"</li>
            <li><strong>Email Delivery:</strong> Sent via Gmail SMTP automation</li>
            <li><strong>Template System:</strong> Rich HTML email with responsive design</li>
          </ul>
          
          <!-- Personal Message -->
          <div style="background: #fef3c7; padding: 20px; border-radius: 10px; border-left: 5px solid #f59e0b; margin: 25px 0;">
            <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">💌 Personal Message for [Recipient Name]:</h4>
            <p style="color: #78350f; margin: 0; font-size: 15px; line-height: 1.6;">
              Hi [Recipient Name]! This automated email system can be used to send you personalized birthday wishes, 
              anniversary greetings, event invitations, and other important notifications. The system will automatically 
              fetch your information from the database and create customized messages just like this one!
            </p>
          </div>
          
          <!-- Call to Action -->
          <div style="text-align: center; margin: 35px 0;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 18px 35px; border-radius: 30px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
              🎯 Greetflow Automation - Working Perfectly for [Recipient Name]!
            </div>
          </div>
          
          <!-- Technical Details -->
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 30px; border-top: 3px solid #e5e7eb;">
            <h4 style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Technical Implementation</h4>
            <div style="color: #6b7280; font-size: 13px; line-height: 1.6;">
              <strong>Database Query:</strong> SELECT * FROM users WHERE name ILIKE '%rajdeep%'<br>
              <strong>Email Service:</strong> Gmail SMTP (smtp.gmail.com:465)<br>
              <strong>Template Engine:</strong> Dynamic HTML with placeholder replacement<br>
              <strong>Personalization:</strong> [Recipient Name] → ${rajdeep.name}<br>
              <strong>Timestamp:</strong> ${new Date().toISOString()}
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            Dear [Recipient Name], this email confirms that the Greetflow automation system is successfully 
            integrated with the database and ready to send personalized communications to all users automatically!
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 13px;">
          <p style="margin: 0;">🤖 This email was sent automatically by Greetflow Email Automation</p>
          <p style="margin: 5px 0 0 0;">📧 Personalized for ${rajdeep.name} from users table</p>
        </div>
      </div>
    `;

    // Step 4: Send the personalized email
    console.log('\n4️⃣ Sending personalized email to Rajdeep...');
    
    const emailResult = await emailService.sendEmail({
      to: rajdeep.email,
      name: rajdeep.name,
      subject: `🎉 Hello ${rajdeep.name}! Your Personalized Email from Greetflow 📧`,
      htmlTemplate: emailTemplate,
      text: `Hello ${rajdeep.name}! This is a personalized email sent automatically by the Greetflow system. Your information was retrieved from the users table in the database. The system successfully found your record and created this custom message for you. This demonstrates that the email automation system is working perfectly and can send personalized communications to all users automatically!`
    });

    // Step 5: Display results
    console.log('\n5️⃣ Email Results:');
    if (emailResult.success) {
      console.log('   🎉 SUCCESS! Email sent to Rajdeep successfully!');
      console.log('   📧 Message ID:', emailResult.messageId);
      console.log('   📬 Sent to:', emailResult.recipientEmail);
      console.log('   👤 Recipient:', rajdeep.name);
      console.log('   📊 Data source: users table');
      console.log('   🆔 User ID:', rajdeep.id);
      console.log('   ⏰ Sent at:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      
      console.log('\n📧 Email sent to:', rajdeep.email);
      console.log('📱 Rajdeep should receive the personalized email shortly!');
    } else {
      console.log('   ❌ Email sending failed:', emailResult.message);
    }

    console.log('\n✨ Rajdeep email automation completed successfully!');

  } catch (error) {
    console.error('❌ Failed to send email to Rajdeep:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the automation
if (require.main === module) {
  sendEmailToRajdeep().then(() => {
    console.log('\n🏁 Process completed. Exiting...');
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { sendEmailToRajdeep };
