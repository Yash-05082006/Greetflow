const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { schemas, validate } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting
router.use(generalLimiter);

// GET /api/people - Get all people with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, tags, consent_email } = req.query;
    const offset = (page - 1) * limit;
    const maxLimit = Math.min(parseInt(limit), 100);

    let query = supabase
      .from('people')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + maxLimit - 1);

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (tags) {
      const tagArray = tags.split(',');
      query = query.overlaps('tags', tagArray);
    }
    if (consent_email !== undefined) {
      query = query.eq('consent_email', consent_email === 'true');
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / maxLimit),
        totalItems: count,
        itemsPerPage: maxLimit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// GET /api/people/upcoming - Get upcoming birthdays/anniversaries
router.get('/upcoming', async (req, res) => {
  try {
    const { days = 30, type = 'birthday' } = req.query;
    
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('consent_email', true)
      .not(type === 'birthday' ? 'dob' : 'anniversary_date', 'is', null);

    if (error) throw error;

    // Filter for upcoming events in next N days
    const today = new Date();
    const upcoming = data.filter(person => {
      const eventDate = type === 'birthday' ? person.dob : person.anniversary_date;
      if (!eventDate) return false;
      
      const event = new Date(today.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const diffDays = Math.ceil((event - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= parseInt(days);
    });

    res.json({
      success: true,
      data: upcoming,
      count: upcoming.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// GET /api/people/:id - Get person by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('people')
      .select(`
        *,
        sends(
          id,
          status,
          scheduled_for,
          sent_at,
          error_msg,
          templates(name),
          campaigns(title)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Person not found'
          }
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// POST /api/people - Create new person
router.post('/', validate(schemas.person), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('people')
      .insert([req.body])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Email already exists'
          }
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      data: data,
      message: 'Person created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// PUT /api/people/:id - Update person
router.put('/:id', validate(schemas.person), async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('people')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Person not found'
          }
        });
      }
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Email already exists'
          }
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data,
      message: 'Person updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// DELETE /api/people/:id - Delete person
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Person not found'
          }
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'Person deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});


module.exports = router;
