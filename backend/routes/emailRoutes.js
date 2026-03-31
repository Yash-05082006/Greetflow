const express = require('express');
const router = express.Router();
const emailService = require('../utils/emailService');
const emailLogger = require('../utils/emailLogger');
const { generalLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting
router.use(generalLimiter);

/**
 * POST /api/send-email
 * Send an email using Gmail SMTP with personalization
 */
router.post('/send-email', sensitiveLimiter, async (req, res) => {
  try {
    const { to, name, subject, htmlTemplate, text, attachments } = req.body;

    // Validate required fields
    if (!to || !subject || !htmlTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, and htmlTemplate are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Send email
    const emailResult = await emailService.sendEmail({
      to,
      name,
      subject,
      htmlTemplate,
      text,
      attachments
    });

    // Log the email attempt
    const logResult = await emailLogger.logEmail({
      recipientEmail: emailResult.recipientEmail,
      subject: emailResult.subject,
      status: emailResult.success ? 'SENT' : 'FAILED',
      messageId: emailResult.messageId,
      errorMessage: emailResult.success ? null : emailResult.message
    });

    if (!logResult.success) {
      console.warn('Failed to log email:', logResult.message);
    }

    // Return response based on email sending result
    if (emailResult.success) {
      res.json({
        success: true,
        message: emailResult.message,
        messageId: emailResult.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: emailResult.message
      });
    }

  } catch (error) {
    console.error('Email route error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/email-logs
 * Manually log an email (mainly for testing or external integrations)
 */
router.post('/email-logs', async (req, res) => {
  try {
    const { recipientEmail, subject, status, messageId, errorMessage } = req.body;

    // Validate required fields
    if (!recipientEmail || !subject || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: recipientEmail, subject, and status are required'
      });
    }

    // Validate status
    if (!['SENT', 'FAILED'].includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either SENT or FAILED'
      });
    }

    const result = await emailLogger.logEmail({
      recipientEmail,
      subject,
      status,
      messageId,
      errorMessage
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('Email logging route error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/email-logs
 * Retrieve email logs with optional filtering
 */
router.get('/email-logs', async (req, res) => {
  try {
    const { limit, status, recipientEmail } = req.query;

    const filters = {};
    if (limit) filters.limit = parseInt(limit);
    if (status) filters.status = status;
    if (recipientEmail) filters.recipientEmail = recipientEmail;

    const result = await emailLogger.getEmailLogs(filters);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('Email logs retrieval route error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/email-stats
 * Get email sending statistics
 */
router.get('/email-stats', async (req, res) => {
  try {
    const result = await emailLogger.getEmailStats();

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('Email stats route error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/email-health
 * Check email service health
 */
router.get('/email-health', async (req, res) => {
  try {
    const isConnected = await emailService.verifyConnection();
    
    res.json({
      success: true,
      status: isConnected ? 'healthy' : 'unhealthy',
      message: isConnected ? 'SMTP connection verified' : 'SMTP connection failed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email health check error:', error.message);
    res.status(500).json({
      success: false,
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
