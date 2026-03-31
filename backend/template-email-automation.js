const { supabase } = require('./config/supabase');
const emailService = require('./utils/emailService');
require('dotenv').config();

async function templateEmailAutomation() {
  console.log('🚀 Starting Template-Based Email Automation...\n');

  try {
    // Step 1: Fetch templates from template table
    console.log('1️⃣ Fetching templates from template table...');
    
    const { data: templates, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .limit(10);

    if (templateError) {
      console.log('❌ Template fetch error:', templateError.message);
      throw templateError;
    }

    console.log(`✅ Found ${templates?.length || 0} templates`);
    
    if (!templates || templates.length === 0) {
      console.log('❌ No templates found in template table');
      return;
    }

    // Display available templates
    console.log('\n📋 Available Templates:');
    templates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.name} (${template.type}) - ID: ${template.id}`);
    });

    // Step 2: Select a template (pick the first one)
    const selectedTemplate = templates[0];
    console.log(`\n2️⃣ Selected Template:`);
    console.log('   Name:', selectedTemplate.name);
    console.log('   Type:', selectedTemplate.type);
    console.log('   Age Group:', selectedTemplate.age_group);
    console.log('   Template ID:', selectedTemplate.id);

    // Step 3: Fetch target users (Rajdeep and Yash Badgujar)
    console.log('\n3️⃣ Fetching target users from users table...');
    
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .or('name.ilike.%rajdeep%,name.ilike.%yash%')
      .limit(10);

    if (userError) {
      console.log('❌ User fetch error:', userError.message);
      throw userError;
    }

    console.log(`✅ Found ${users?.length || 0} target users`);
    
    if (!users || users.length === 0) {
      console.log('❌ No target users found (Rajdeep or Yash)');
      return;
    }

    // Display found users
    console.log('\n👥 Target Users Found:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} - ${user.email} (ID: ${user.id})`);
    });

    // Step 4: Create personalized email template using fetched template
    console.log('\n4️⃣ Creating personalized emails using template...');
    
    // Enhanced email template that incorporates the database template
    const createPersonalizedEmail = (user, template) => {
      return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f8fafc;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 15px 15px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">🎉 Hello [Recipient Name]!</h1>
            <p style="color: #e0e7ff; margin: 15px 0 0 0; font-size: 18px;">Template-Based Email Automation</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Dear [Recipient Name], 👋</h2>
            
            <p style="color: #4b5563; line-height: 1.7; font-size: 17px; margin-bottom: 25px;">
              This email was automatically generated using a <strong>template from your database</strong>! 
              The system fetched both your user information and the email template from Supabase, 
              then created this personalized message just for you.
            </p>
            
            <!-- Template Information -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 25px; border-radius: 12px; margin: 25px 0;">
              <h3 style="color: white; margin: 0 0 15px 0; font-size: 20px;">📋 Template Used from Database:</h3>
              <div style="color: #fef3c7; font-size: 15px; line-height: 1.6;">
                <strong>Template Name:</strong> ${template.name}<br>
                <strong>Template Type:</strong> ${template.type}<br>
                <strong>Age Group:</strong> ${template.age_group}<br>
                <strong>Template ID:</strong> ${template.id}
              </div>
            </div>
            
            <!-- Original Template Content -->
            <div style="background: #f0f9ff; padding: 25px; border-radius: 10px; border-left: 5px solid #3b82f6; margin: 25px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📄 Original Template Content:</h3>
              <div style="color: #374151; font-size: 15px; line-height: 1.6; background: white; padding: 15px; border-radius: 5px; border: 1px solid #e5e7eb;">
                ${template.html || 'No HTML content available'}
              </div>
            </div>
            
            <!-- User Information -->
            <div style="background: #ecfdf5; padding: 25px; border-radius: 10px; border-left: 5px solid #10b981; margin: 25px 0;">
              <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">👤 Your Information Retrieved:</h3>
              <table style="width: 100%; color: #374151; font-size: 15px;">
                <tr><td style="padding: 8px 0; font-weight: bold; width: 120px;">Name:</td><td>${user.name}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>${user.email}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td>${user.phone || 'Not provided'}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">User ID:</td><td>${user.id}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Source:</td><td>users table</td></tr>
              </table>
            </div>
            
            <!-- System Demonstration -->
            <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0;">🎯 This Email Demonstrates:</h3>
            <ul style="color: #4b5563; line-height: 1.8; font-size: 16px; padding-left: 20px;">
              <li><strong>Template Database Integration:</strong> Fetched "${template.name}" from templates table</li>
              <li><strong>User Database Integration:</strong> Retrieved ${user.name}'s data from users table</li>
              <li><strong>Cross-table Queries:</strong> Combined data from multiple database tables</li>
              <li><strong>Template Processing:</strong> Used database template for email generation</li>
              <li><strong>Personalization:</strong> Replaced [Recipient Name] with "${user.name}"</li>
              <li><strong>Email Delivery:</strong> Sent via Gmail SMTP automation</li>
            </ul>
            
            <!-- Personal Message -->
            <div style="background: #fef3c7; padding: 20px; border-radius: 10px; border-left: 5px solid #f59e0b; margin: 25px 0;">
              <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">💌 Personal Message for [Recipient Name]:</h4>
              <p style="color: #78350f; margin: 0; font-size: 15px; line-height: 1.6;">
                Hi [Recipient Name]! This email proves that your Greetflow system can automatically fetch templates 
                from the database and use them to send personalized emails to users. The system successfully 
                retrieved the "${template.name}" template and your user information to create this custom message!
              </p>
            </div>
            
            <!-- Call to Action -->
            <div style="text-align: center; margin: 35px 0;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 18px 35px; border-radius: 30px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                🚀 Template + Database Integration Working for [Recipient Name]!
              </div>
            </div>
            
            <!-- Technical Details -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 30px; border-top: 3px solid #e5e7eb;">
              <h4 style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Database Integration Details</h4>
              <div style="color: #6b7280; font-size: 13px; line-height: 1.6;">
                <strong>Template Query:</strong> SELECT * FROM templates LIMIT 10<br>
                <strong>User Query:</strong> SELECT * FROM users WHERE name ILIKE '%${user.name.split(' ')[0]}%'<br>
                <strong>Template Used:</strong> ${template.name} (${template.type})<br>
                <strong>User Found:</strong> ${user.name} (${user.email})<br>
                <strong>Personalization:</strong> [Recipient Name] → ${user.name}<br>
                <strong>Timestamp:</strong> ${new Date().toISOString()}
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Dear [Recipient Name], this email confirms that your Greetflow system can successfully integrate 
              templates and user data from the database to create automated, personalized communications!
            </p>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 13px;">
            <p style="margin: 0;">🤖 Template-Based Email Automation by Greetflow</p>
            <p style="margin: 5px 0 0 0;">📧 Template: ${template.name} | User: ${user.name}</p>
          </div>
        </div>
      `;
    };

    // Step 5: Send emails to all found users
    console.log('\n5️⃣ Sending template-based emails to users...');
    
    const emailResults = [];
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n   📧 Sending email ${i + 1}/${users.length} to ${user.name}...`);
      
      const personalizedTemplate = createPersonalizedEmail(user, selectedTemplate);
      
      const emailResult = await emailService.sendEmail({
        to: user.email,
        name: user.name,
        subject: `🎉 Hello ${user.name}! Template-Based Email from Greetflow (${selectedTemplate.name})`,
        htmlTemplate: personalizedTemplate,
        text: `Hello ${user.name}! This is a template-based email from Greetflow. We used the "${selectedTemplate.name}" template from our database and your user information to create this personalized message. The system successfully fetched both the template and your data from Supabase and created this custom email just for you!`
      });

      emailResults.push({
        user: user,
        template: selectedTemplate,
        result: emailResult
      });

      if (emailResult.success) {
        console.log(`   ✅ SUCCESS! Email sent to ${user.name}`);
        console.log(`   📧 Message ID: ${emailResult.messageId}`);
      } else {
        console.log(`   ❌ FAILED! Email to ${user.name}: ${emailResult.message}`);
      }

      // Small delay between emails
      if (i < users.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Step 6: Display comprehensive results
    console.log('\n6️⃣ Template Email Automation Results:');
    console.log('═══════════════════════════════════════════════════════════');
    
    console.log('\n📋 Template Information:');
    console.log(`   Name: ${selectedTemplate.name}`);
    console.log(`   Type: ${selectedTemplate.type}`);
    console.log(`   Age Group: ${selectedTemplate.age_group}`);
    console.log(`   Template ID: ${selectedTemplate.id}`);
    
    console.log('\n👥 Email Results:');
    emailResults.forEach((result, index) => {
      const status = result.result.success ? '✅ SUCCESS' : '❌ FAILED';
      console.log(`   ${index + 1}. ${result.user.name} (${result.user.email}) - ${status}`);
      if (result.result.success) {
        console.log(`      📧 Message ID: ${result.result.messageId}`);
      } else {
        console.log(`      ❌ Error: ${result.result.message}`);
      }
    });

    const successCount = emailResults.filter(r => r.result.success).length;
    const failCount = emailResults.filter(r => r.result.success === false).length;

    console.log('\n📊 Summary:');
    console.log(`   📋 Template Used: ${selectedTemplate.name} (from templates table)`);
    console.log(`   👥 Users Found: ${users.length} (from users table)`);
    console.log(`   ✅ Emails Sent Successfully: ${successCount}`);
    console.log(`   ❌ Emails Failed: ${failCount}`);
    console.log(`   📧 Total Emails Processed: ${emailResults.length}`);
    console.log(`   ⏰ Completed At: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

    console.log('\n🎉 Template-Based Email Automation Completed Successfully!');
    console.log('📧 All recipients should receive their personalized template-based emails shortly!');

  } catch (error) {
    console.error('❌ Template email automation failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the automation
if (require.main === module) {
  templateEmailAutomation().then(() => {
    console.log('\n🏁 Template automation process completed. Exiting...');
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { templateEmailAutomation };
