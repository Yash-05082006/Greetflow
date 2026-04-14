const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET audit logs
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;
    const { action, entity } = req.query;
    const sortOrder = req.query.sort === 'asc' ? 'ASC' : 'DESC';

    let query = `SELECT *, COUNT(*) OVER() as total FROM audit_logs`;
    const conditions = [];
    const values = [];

    if (action) {
      values.push(action);
      conditions.push(`action = $${values.length}`);
    }

    if (entity) {
      values.push(entity);
      conditions.push(`entity = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at ${sortOrder} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    const total = result.rows[0]?.total || 0;

    const transformedData = result.rows.map(log => ({
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
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Audit logs fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET email history
router.get('/email-history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT *, COUNT(*) OVER() as total
       FROM audit_logs
       WHERE action = ANY($1)
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [['email_sent', 'email_failed', 'email_scheduled', 'send_email'], limit, offset]
    );

    const total = result.rows[0]?.total || 0;

    const emailHistory = result.rows.map(log => ({
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
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET stats
router.get('/stats', async (req, res) => {
  try {
    const totalRes = await pool.query(`SELECT COUNT(*) FROM audit_logs`);
    const emailRes = await pool.query(
      `SELECT COUNT(*) FROM audit_logs WHERE action = ANY($1)`,
      [['email_sent', 'email_failed', 'email_scheduled', 'send_email']]
    );
    const recentRes = await pool.query(
      `SELECT COUNT(*) FROM audit_logs WHERE created_at >= $1`,
      [new Date(Date.now() - 24 * 60 * 60 * 1000)]
    );

    res.json({
      success: true,
      data: {
        total: parseInt(totalRes.rows[0].count),
        emails: parseInt(emailRes.rows[0].count),
        recent24h: parseInt(recentRes.rows[0].count)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single log
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM audit_logs WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Audit log not found' });
    }

    const data = result.rows[0];

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
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;