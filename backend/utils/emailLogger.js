const pool = require('../config/db');

class EmailLogger {
  async logEmail(logData) {
    try {
      const { 
        recipientEmail, 
        subject, 
        status, 
        messageId, 
        errorMessage 
      } = logData;

      if (!recipientEmail || !subject || !status) {
        throw new Error('Missing required fields: recipientEmail, subject, and status are required');
      }

      const sentAt = status.toLowerCase() === 'sent' ? new Date() : null;

      const result = await pool.query(
        `INSERT INTO email_logs 
        (recipient_email, subject, status, sent_at, message_id, error_message)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          recipientEmail,
          subject,
          status.toUpperCase(),
          sentAt,
          messageId || null,
          errorMessage || null
        ]
      );

      return {
        success: true,
        message: 'Email log stored successfully',
        logId: result.rows[0]?.id
      };

    } catch (error) {
      console.error('Email logging failed:', error.message);
      return {
        success: false,
        message: `Failed to log email: ${error.message}`
      };
    }
  }

  async getEmailLogs(filters = {}) {
    try {
      const { limit = 50, status, recipientEmail } = filters;

      let query = `SELECT * FROM email_logs`;
      const conditions = [];
      const values = [];

      if (status) {
        values.push(status.toUpperCase());
        conditions.push(`status = $${values.length}`);
      }

      if (recipientEmail) {
        values.push(recipientEmail);
        conditions.push(`recipient_email = $${values.length}`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
      }

      query += ` ORDER BY sent_at DESC LIMIT $${values.length + 1}`;
      values.push(limit);

      const result = await pool.query(query, values);

      return {
        success: true,
        data: result.rows,
        count: result.rows.length
      };

    } catch (error) {
      console.error('Failed to retrieve email logs:', error.message);
      return {
        success: false,
        message: `Failed to retrieve email logs: ${error.message}`
      };
    }
  }

  async getEmailStats() {
    try {
      const result = await pool.query(`SELECT status FROM email_logs`);

      const data = result.rows;

      const stats = {
        total: data.length,
        sent: data.filter(log => log.status === 'SENT').length,
        failed: data.filter(log => log.status === 'FAILED').length
      };

      stats.successRate = stats.total > 0 
        ? ((stats.sent / stats.total) * 100).toFixed(2) 
        : '0.00';

      return {
        success: true,
        stats
      };

    } catch (error) {
      console.error('Failed to get email statistics:', error.message);
      return {
        success: false,
        message: `Failed to get email statistics: ${error.message}`
      };
    }
  }
}

module.exports = new EmailLogger();