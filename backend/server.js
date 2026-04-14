const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { startDailyScheduler } = require('./scheduler/dailyScheduler');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', require('./routes/users')); // New users API (replaces people)
app.use('/api/templates', require('./routes/templates'));
app.use('/api/uploaded-templates', require('./routes/uploadedTemplates'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/email-logs', require('./routes/emailLogs')); // New email logs API
app.use('/api/audit-logs', require('./routes/auditLogs')); // Audit logs API
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/oauth', require('./routes/oauth'));
app.use('/api/scheduler', require('./routes/scheduler'));
app.use('/api', require('./routes/emailRoutes')); // Email automation routes
app.use('/api', require('./routes/demoRoutes')); // Demo automation routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Greetflow API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users',
      templates: '/api/templates',
      campaigns: '/api/campaigns',
      emailLogs: '/api/email-logs',
      sendEmail: '/api/send-email',
      emailStats: '/api/email-stats',
      emailHealth: '/api/email-health',
      demoEmail: '/api/demo/send-email',
      demoUsers: '/api/demo/users',
      templateEmail: '/api/demo/template-email'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Greetflow API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`📧 Templates API: http://localhost:${PORT}/api/templates`);
  console.log(`📋 Email Logs API: http://localhost:${PORT}/api/email-logs`);

  // Start daily automation scheduler (Phase 1 placeholder)
  startDailyScheduler();
});

module.exports = app;
