const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } catch (error) {
      console.error('Failed to initialize email transporter:', error.message);
      throw error;
    }
  }

  /**
   * Replace [Recipient Name] placeholders with actual name
   * @param {string} template - HTML template with placeholders
   * @param {string} name - Recipient name
   * @returns {string} - Personalized template
   */
  personalizeTemplate(template, name) {
    if (!template || !name) return template;
    return template.replace(/\[Recipient Name\]/g, name);
  }

  /**
   * Send email using Gmail SMTP
   * @param {Object} emailData - Email configuration
   * @returns {Object} - Result with success status and message ID
   */
  async sendEmail(emailData) {
    try {
      const { to, name, subject, htmlTemplate, text, attachments } = emailData;

      // Validate required fields
      if (!to || !subject || !htmlTemplate) {
        throw new Error('Missing required fields: to, subject, and htmlTemplate are required');
      }

      // Personalize the HTML template
      const personalizedHtml = this.personalizeTemplate(htmlTemplate, name);

      // Prepare email options
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: to,
        subject: subject,
        html: personalizedHtml
      };

      // Add optional text content
      if (text) {
        mailOptions.text = text;
      }

      // Add optional attachments
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        mailOptions.attachments = attachments;
      }

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId,
        recipientEmail: to,
        subject: subject
      };

    } catch (error) {
      console.error('Email sending failed:', error.message);
      return {
        success: false,
        message: error.message,
        recipientEmail: emailData.to || null,
        subject: emailData.subject || null
      };
    }
  }

  /**
   * Verify SMTP connection
   * @returns {Promise<boolean>} - Connection status
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP verification failed:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
