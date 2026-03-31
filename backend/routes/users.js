const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const Joi = require('joi');
const { generalLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting
router.use(generalLimiter);

// Validation schemas
const userSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(20).optional(),
  category: Joi.string().max(50).optional(),
  date_of_birth: Joi.date().optional(),
  anniversary_date: Joi.date().optional(),
  preferences: Joi.array().items(Joi.string()).optional()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().max(20).optional(),
  category: Joi.string().max(50).optional(),
  date_of_birth: Joi.date().optional(),
  anniversary_date: Joi.date().optional(),
  preferences: Joi.array().items(Joi.string()).optional()
});

// GET /api/users - Get all users with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, email_consent } = req.query;
    const offset = (page - 1) * limit;
    const maxLimit = Math.min(parseInt(limit), 100);

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + maxLimit - 1);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Users fetch error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch users'
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
    console.error('Users list error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/users/upcoming - Get users with upcoming birthdays/anniversaries
router.get('/upcoming', async (req, res) => {
  try {
    const { days = 30, type = 'birthday' } = req.query;
    const daysAhead = Math.min(parseInt(days), 365);

    let dateColumn;
    if (type === 'birthday') {
      dateColumn = 'date_of_birth';
    } else if (type === 'anniversary') {
      dateColumn = 'anniversary_date';
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Type must be "birthday" or "anniversary"'
        }
      });
    }

    // Query for upcoming dates using PostgreSQL date functions
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .not(dateColumn, 'is', null)
      .gte(`${dateColumn}::date`, new Date().toISOString().split('T')[0])
      .lte(`${dateColumn}::date`, new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order(dateColumn, { ascending: true });

    if (error) {
      console.error('Upcoming users error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch upcoming users'
        }
      });
    }

    res.json({
      success: true,
      data,
      count: data.length,
      type,
      days: daysAhead
    });

  } catch (error) {
    console.error('Upcoming users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/users/:id - Get single user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }
      console.error('User fetch error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch user'
        }
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('User get error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = userSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationError.details[0].message
        }
      });
    }

    const { data, error } = await supabase
      .from('users')
      .insert([value])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'A user with this email already exists'
          }
        });
      }
      console.error('User creation error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create user'
        }
      });
    }

    res.status(201).json({
      success: true,
      data,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = updateUserSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationError.details[0].message
        }
      });
    }

    // Add updated_at timestamp
    value.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'A user with this email already exists'
          }
        });
      }
      console.error('User update error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update user'
        }
      });
    }

    res.json({
      success: true,
      data,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('User deletion error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete user'
        }
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/users/stats/summary - Get user statistics
router.get('/stats/summary', async (req, res) => {
  try {
    // Get total users count
    const { count: totalUsers, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    // Get users by category
    const { data: categoryStats, error: categoryError } = await supabase
      .from('users')
      .select('category')
      .not('category', 'is', null);

    if (categoryError) {
      throw categoryError;
    }

    // Count by category
    const categoryCounts = categoryStats.reduce((acc, user) => {
      acc[user.category] = (acc[user.category] || 0) + 1;
      return acc;
    }, {});

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentUsers, error: recentError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo);

    if (recentError) {
      throw recentError;
    }

    res.json({
      success: true,
      data: {
        totalUsers,
        recentUsers,
        categoryCounts,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user statistics'
      }
    });
  }
});

module.exports = router;
