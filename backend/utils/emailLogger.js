const { supabase } = require('../config/supabase');

class EmailLogger {
  /**
   * Log email send attempt to Supabase database
   * @param {Object} logData - Email log data
   * @returns {Object} - Result with success status
   */
  async logEmail(logData) {
    try {
      const { 
        recipientEmail, 
        subject, 
        status, 
        messageId, 
        errorMessage 
      } = logData;

      // Validate required fields
      if (!recipientEmail || !subject || !status) {
        throw new Error('Missing required fields: recipientEmail, subject, and status are required');
      }

      // Prepare log entry
      const logEntry = {
        recipient_email: recipientEmail,
        subject: subject,
        status: status.toUpperCase(), // SENT or FAILED
        sent_at: status.toLowerCase() === 'sent' ? new Date().toISOString() : null,
        message_id: messageId || null,
        error_message: errorMessage || null
      };

      // Insert into database
      const { data, error } = await supabase
        .from('email_logs')
        .insert([logEntry])
        .select();

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Email log stored successfully',
        logId: data[0]?.id
      };

    } catch (error) {
      console.error('Email logging failed:', error.message);
      return {
        success: false,
        message: `Failed to log email: ${error.message}`
      };
    }
  }

  /**
   * Get email logs with optional filtering
   * @param {Object} filters - Optional filters (limit, status, etc.)
   * @returns {Object} - Result with email logs
   */
  async getEmailLogs(filters = {}) {
    try {
      const { limit = 50, status, recipientEmail } = filters;

      let query = supabase
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (status) {
        query = query.eq('status', status.toUpperCase());
      }

      if (recipientEmail) {
        query = query.eq('recipient_email', recipientEmail);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
        count: data.length
      };

    } catch (error) {
      console.error('Failed to retrieve email logs:', error.message);
      return {
        success: false,
        message: `Failed to retrieve email logs: ${error.message}`
      };
    }
  }

  /**
   * Get email statistics
   * @returns {Object} - Email statistics
   */
  async getEmailStats() {
    try {
      // Get total counts by status
      const { data, error } = await supabase
        .from('email_logs')
        .select('status');

      if (error) {
        throw error;
      }

      const stats = {
        total: data.length,
        sent: data.filter(log => log.status === 'SENT').length,
        failed: data.filter(log => log.status === 'FAILED').length
      };

      stats.successRate = stats.total > 0 ? 
        ((stats.sent / stats.total) * 100).toFixed(2) : '0.00';

      return {
        success: true,
        stats: stats
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
