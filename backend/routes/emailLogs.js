const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const Joi = require('joi');
const { generalLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting
router.use(generalLimiter);

// Validation schemas
const emailLogSchema = Joi.object({
  user_id: Joi.string().uuid().optional(),
  template_id: Joi.string().uuid().optional(),
  recipient_email: Joi.string().email().required(),
  recipient_name: Joi.string().max(100).required(),
  subject: Joi.string().max(200).required(),
  content: Joi.string().required(),
  status: Joi.string().valid('sent', 'failed', 'pending').required(),
  error_message: Joi.string().optional(),
  message_id: Joi.string().optional()
});

// GET /api/email-logs - Get email logs with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      user_id, 
      template_id,
      recipient_email,
      from_date,
      to_date
    } = req.query;
    
    const offset = (page - 1) * limit;
    const maxLimit = Math.min(parseInt(limit), 100);

    let query = supabase
      .from('email_logs')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email
        ),
        templates:template_id (
          id,
          name,
          category
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + maxLimit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (template_id) {
      query = query.eq('template_id', template_id);
    }
    if (recipient_email) {
      query = query.ilike('recipient_email', `%${recipient_email}%`);
    }
    if (from_date) {
      query = query.gte('created_at', from_date);
    }
    if (to_date) {
      query = query.lte('created_at', to_date);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Email logs fetch error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch email logs'
        }
      });
    }

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: maxLimit,
        total: count,
        pages: Math.ceil(count / maxLimit)
      }
    });

  } catch (error) {
    console.error('Email logs list error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/email-logs/stats - Get email statistics
router.get('/stats', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    let baseQuery = supabase.from('email_logs').select('status, created_at');

    // Apply date filters if provided
    if (from_date) {
      baseQuery = baseQuery.gte('created_at', from_date);
    }
    if (to_date) {
      baseQuery = baseQuery.lte('created_at', to_date);
    }

    const { data: logs, error } = await baseQuery;

    if (error) {
      console.error('Email stats error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch email statistics'
        }
      });
    }

    // Calculate statistics
    const stats = {
      total: logs.length,
      sent: logs.filter(log => log.status === 'sent').length,
      failed: logs.filter(log => log.status === 'failed').length,
      pending: logs.filter(log => log.status === 'pending').length
    };

    // Calculate success rate
    stats.successRate = stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(2) : 0;

    // Get daily stats for the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyStats = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = {
        sent: 0,
        failed: 0,
        pending: 0,
        total: 0
      };
    }

    logs.forEach(log => {
      const logDate = new Date(log.created_at).toISOString().split('T')[0];
      if (dailyStats[logDate]) {
        dailyStats[logDate][log.status]++;
        dailyStats[logDate].total++;
      }
    });

    res.json({
      success: true,
      data: {
        overall: stats,
        daily: dailyStats,
        period: {
          from: from_date || sevenDaysAgo.toISOString(),
          to: to_date || new Date().toISOString()
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Email stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate email statistics'
      }
    });
  }
});

// GET /api/email-logs/:id - Get single email log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('email_logs')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email
        ),
        templates:template_id (
          id,
          name,
          category,
          content
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EMAIL_LOG_NOT_FOUND',
            message: 'Email log not found'
          }
        });
      }
      console.error('Email log fetch error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch email log'
        }
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Email log get error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// POST /api/email-logs - Create new email log entry
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = emailLogSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationError.details[0].message
        }
      });
    }

    // Add sent_at timestamp if status is 'sent'
    if (value.status === 'sent') {
      value.sent_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('email_logs')
      .insert([value])
      .select()
      .single();

    if (error) {
      console.error('Email log creation error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create email log'
        }
      });
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Email log created successfully'
    });

  } catch (error) {
    console.error('Email log creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// PUT /api/email-logs/:id/status - Update email log status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, error_message, message_id } = req.body;

    if (!status || !['sent', 'failed', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be one of: sent, failed, pending'
        }
      });
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add optional fields
    if (error_message !== undefined) {
      updateData.error_message = error_message;
    }
    if (message_id !== undefined) {
      updateData.message_id = message_id;
    }
    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('email_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EMAIL_LOG_NOT_FOUND',
            message: 'Email log not found'
          }
        });
      }
      console.error('Email log update error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update email log'
        }
      });
    }

    res.json({
      success: true,
      data,
      message: 'Email log status updated successfully'
    });

  } catch (error) {
    console.error('Email log update error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// DELETE /api/email-logs/:id - Delete email log (soft delete by updating status)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('email_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Email log deletion error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete email log'
        }
      });
    }

    res.json({
      success: true,
      message: 'Email log deleted successfully'
    });

  } catch (error) {
    console.error('Email log deletion error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

module.exports = router;
