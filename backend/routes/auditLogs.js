const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/audit-logs
 * Fetch all audit logs with pagination and filtering
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 50, max: 100)
 *   - action: filter by action type
 *   - entity: filter by entity type
 *   - sort: sort order (asc/desc, default: desc)
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;
    const action = req.query.action;
    const entity = req.query.entity;
    const sortOrder = req.query.sort === 'asc' ? 'asc' : 'desc';

    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (action) {
      query = query.eq('action', action);
    }
    if (entity) {
      query = query.eq('entity', entity);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch audit logs',
          details: error.message
        }
      });
    }

    // Transform data to include email-specific fields from meta
    const transformedData = data.map(log => ({
      id: log.id,
      actor: log.actor,
      action: log.action,
      entity: log.entity,
      entity_id: log.entity_id,
      recipient_name: log.meta?.recipient_name || log.meta?.user_name || 'N/A',
      subject: log.meta?.subject || log.meta?.template_name || 'N/A',
      status: log.meta?.status || 'completed',
      sent_at: log.created_at,
      meta: log.meta,
      created_at: log.created_at
    }));

    res.json({
      success: true,
      data: transformedData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/audit-logs/email-history
 * Fetch email-specific audit logs
 */
router.get('/email-history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;

    // Fetch email-related audit logs
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .in('action', ['email_sent', 'email_failed', 'email_scheduled', 'send_email'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching email history:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch email history',
          details: error.message
        }
      });
    }

    // Transform data for email history display
    const emailHistory = data.map(log => ({
      id: log.id,
      recipient_name: log.meta?.recipient_name || log.meta?.to || 'Unknown',
      subject: log.meta?.subject || 'No Subject',
      status: log.meta?.status || (log.action === 'email_failed' ? 'failed' : 'sent'),
      sent_at: log.created_at,
      actor: log.actor,
      action: log.action,
      template_id: log.meta?.template_id,
      user_id: log.meta?.user_id || log.entity_id,
      error_message: log.meta?.error_message
    }));

    res.json({
      success: true,
      data: emailHistory,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Email history fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/audit-logs/stats
 * Get audit log statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Get total count
    const { count: totalCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    // Get email-related count
    const { count: emailCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .in('action', ['email_sent', 'email_failed', 'email_scheduled', 'send_email']);

    // Get recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday);

    res.json({
      success: true,
      data: {
        total: totalCount || 0,
        emails: emailCount || 0,
        recent24h: recentCount || 0
      }
    });
  } catch (error) {
    console.error('Audit logs stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch statistics',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/audit-logs/:id
 * Get a single audit log by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Audit log not found'
          }
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        actor: data.actor,
        action: data.action,
        entity: data.entity,
        entity_id: data.entity_id,
        recipient_name: data.meta?.recipient_name || 'N/A',
        subject: data.meta?.subject || 'N/A',
        status: data.meta?.status || 'completed',
        sent_at: data.created_at,
        meta: data.meta,
        created_at: data.created_at
      }
    });
  } catch (error) {
    console.error('Audit log fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch audit log',
        details: error.message
      }
    });
  }
});

module.exports = router;
