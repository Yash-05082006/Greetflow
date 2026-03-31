const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const Joi = require('joi');
const { generalLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting
router.use(generalLimiter);

// Helpers to map API enums to DB schema values (seed uses Title Case and labels)
const mapTypeToCategory = (t) => {
  if (!t) return t;
  const m = {
    birthday: 'Birthday',
    anniversary: 'Anniversary',
    greeting: 'Greeting',
    invitation: 'Event Invitation'
  };
  return m[t] || t;
};

// Map API enums to DB label strings
const mapAgeGroup = (ag) => {
  if (!ag) return ag;
  const m = {
    '8_15': 'Children (8-15)',
    '15_18': 'Teens (15-18)',
    '18_plus': 'Adults (18+)',
    'na': 'Adults (18+)' // default to adults
  };
  return m[ag] || ag;
};

// GET /api/templates - list with filtering
router.get('/', async (req, res) => {
  try {
    const { type, age_group } = req.query;
    let query = supabase.from('templates').select('*').order('created_at', { ascending: false });
    if (type) query = query.eq('category', mapTypeToCategory(type));
    if (age_group) query = query.eq('age_group', mapAgeGroup(age_group));

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Validation schemas
const templateSchema = Joi.object({
  name: Joi.string().min(1).max(150).required(),
  type: Joi.string().valid('birthday', 'anniversary', 'greeting', 'invitation').required(),
  age_group: Joi.string().valid('8_15', '15_18', '18_plus', 'na').optional(),
  html: Joi.string().required(),
  description: Joi.string().max(500).optional(),
  design: Joi.object().optional()
});

const updateTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(150).optional(),
  type: Joi.string().valid('birthday', 'anniversary', 'greeting', 'invitation').optional(),
  age_group: Joi.string().valid('8_15', '15_18', '18_plus', 'na').optional(),
  html: Joi.string().optional(),
  description: Joi.string().max(500).optional(),
  design: Joi.object().optional()
});

// POST /api/templates - create
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = templateSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationError.details[0].message
        }
      });
    }

    const payload = {
      name: value.name,
      category: mapTypeToCategory(value.type),
      age_group: mapAgeGroup(value.age_group || 'na'),
      content: value.html,
      description: value.description ?? '',
      design: value.design ?? {},
      usage_count: 0
    };

    const { data, error } = await supabase.from('templates').insert([payload]).select().single();
    if (error) throw error;

    res.status(201).json({ success: true, data, message: 'Template created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// GET /api/templates/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('templates').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } });
      }
      throw error;
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// PUT /api/templates/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = updateTemplateSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationError.details[0].message
        }
      });
    }

    const payload = {
      name: value.name,
      category: mapTypeToCategory(value.type),
      age_group: mapAgeGroup(value.age_group || 'na'),
      content: value.html,
      description: value.description ?? '',
      design: value.design ?? {},
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    const { data, error } = await supabase.from('templates').update(payload).eq('id', id).select().single();
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } });
      }
      throw error;
    }

    res.json({ success: true, data, message: 'Template updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// DELETE /api/templates/:id - delete
router.delete('/:id', sensitiveLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } });
      }
      if (error.code === '23503') {
        return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Template is referenced by campaigns' } });
      }
      throw error;
    }

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// GET /api/templates/:id/preview - preview with sample data
router.get('/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    const { personId } = req.query;

    const { data: tpl, error: tErr } = await supabase.from('templates').select('*').eq('id', id).single();
    if (tErr) {
      if (tErr.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } });
      }
      throw tErr;
    }

    let name = 'Friend';
    if (personId) {
      const { data: user, error: uErr } = await supabase.from('users').select('name').eq('id', personId).single();
      if (!uErr && user?.name) name = user.name;
    }

    // Basic placeholder replacement
    const html = (tpl.content || '')
      .replace(/\[Name\]/g, name)
      .replace(/\[Message\]/g, 'Wishing you a wonderful day!');

    res.json({ success: true, data: { id: tpl.id, name: tpl.name, type: tpl.category, age_group: tpl.age_group, html } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

module.exports = router;
