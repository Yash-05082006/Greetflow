const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// GoogleGenAI removed — using Pixazo (Stable Diffusion) for image generation
const sharp = require('sharp');
const pool = require('../config/db');
const supabase = require('../config/storage');
const { generateImage: pixazoGenerateImage } = require('../utils/imageService');


// ──────────────────────────────────────────────────────────────
// Multer — memory storage for file uploads
// ──────────────────────────────────────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only PNG and JPG images are allowed'));
  }
});

const STORAGE_BUCKET = 'Templates';
const LOGO_PATH = path.join(__dirname, '../assets/logo.png');

// ──────────────────────────────────────────────────────────────
// Image generation is handled by Pixazo (Stable Diffusion SDXL)
// via ../utils/imageService.js — no Gemini dependency
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// Helper: build an enhanced prompt for Pixazo image generation
// ──────────────────────────────────────────────────────────────
function buildImagePrompt(userPrompt, category, ageGroup) {
  const categoryContext = {
    'Birthday': 'a warm, joyful birthday celebration greeting card',
    'Anniversary': 'an elegant, romantic anniversary celebration greeting card',
    'Event Invitation': 'a stylish, exciting event invitation card',
    'Greeting': 'a heartfelt, professional greeting card'
  };

  const ageContext = {
    'Children (8-15)': 'bright, playful, colorful design with fun elements appropriate for children and young teens',
    'Teens (15-18)': 'modern, trendy, vibrant design that appeals to teenagers with contemporary aesthetics',
    'Adults (18+)': 'sophisticated, elegant, professional design with refined typography and premium aesthetics'
  };

  const catDesc = categoryContext[category] || 'a professional greeting card';
  const ageDesc = ageContext[ageGroup] || 'a universally appealing design';

  return `Create ${catDesc} as a high-quality digital image.

Design Style: ${ageDesc}.

User's Creative Request: ${userPrompt}

CRITICAL DESIGN REQUIREMENTS:
- Format: Portrait or landscape greeting card (1200x900px or 900x1200px visually)
- Leave a clean white or lightly colored band at the top (~15% of height) for a company logo to be placed
- Do NOT add any company name or logo text yourself - leave the top area clean
- Use premium illustration style, rich gradients, beautiful typography
- Include appropriate festive/thematic decorations, icons, or illustrations
- Add placeholder text like "Happy [Occasion]!" or "[Occasion] Wishes" with space for personalization
- Ensure the composition is balanced and professional
- Use rich, vibrant colors that evoke the emotion of the occasion
- The design should look like a professional printed greeting card

Output: A single, complete, high-quality greeting card image ready for use.`;
}

// ──────────────────────────────────────────────────────────────
// Helper: composite Beam Welly logo onto the generated image
// ──────────────────────────────────────────────────────────────
async function compositeLogoOntoImage(imageBuffer) {
  try {
    if (!fs.existsSync(LOGO_PATH)) {
      console.warn('[AI Generate] Logo file not found at', LOGO_PATH, '— skipping logo overlay');
      return imageBuffer;
    }

    const mainImageMeta = await sharp(imageBuffer).metadata();
    const imgWidth = mainImageMeta.width || 1200;
    const imgHeight = mainImageMeta.height || 900;

    // Logo: ~22% of image width, maintain aspect ratio
    const logoTargetWidth = Math.round(imgWidth * 0.22);
    const logoResized = await sharp(LOGO_PATH)
      .resize(logoTargetWidth, null, { fit: 'inside', withoutEnlargement: false })
      .png()
      .toBuffer();

    const logoMeta = await sharp(logoResized).metadata();
    const logoW = logoMeta.width || logoTargetWidth;
    const logoH = logoMeta.height || Math.round(logoTargetWidth * 0.6);

    // Position: horizontally centered, with top padding (~3% of height)
    const left = Math.round((imgWidth - logoW) / 2);
    const top = Math.round(imgHeight * 0.025);

    const composited = await sharp(imageBuffer)
      .composite([
        {
          input: logoResized,
          left,
          top,
          blend: 'over'
        }
      ])
      .png()
      .toBuffer();

    return composited;
  } catch (err) {
    console.error('[AI Generate] Logo composite failed:', err.message, '— using original image');
    return imageBuffer;
  }
}

// ──────────────────────────────────────────────────────────────
// GET /api/uploaded-templates
// Returns templates from Neon DB.
// Supports ?template_type=uploaded|ai_generated filter.
// ──────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { template_type } = req.query;
    let queryText = `SELECT * FROM uploaded_templates ORDER BY created_at DESC`;
    const params = [];

    if (template_type) {
      queryText = `SELECT * FROM uploaded_templates WHERE template_type = $1 ORDER BY created_at DESC`;
      params.push(template_type);
    }

    const result = await pool.query(queryText, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[uploaded-templates GET]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/uploaded-templates/:id/use
// Increments usage_count by 1 for any uploaded or ai_generated template.
// Called once per bulk send batch (not once per recipient).
// ──────────────────────────────────────────────────────────────
router.post('/:id/use', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE uploaded_templates
       SET usage_count = usage_count + 1
       WHERE id = $1
       RETURNING id, display_name, usage_count`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    console.log(`[usage] Template ${id} usage_count → ${result.rows[0].usage_count}`);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[uploaded-templates/:id/use]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});



// (Gemini image generation removed — Pixazo is the sole image provider)

// ──────────────────────────────────────────────────────────────
// POST /api/uploaded-templates/generate
// AI image generation via Pixazo + logo composite + Supabase upload
// Body: { prompt, category, ageGroup, name? }
// ──────────────────────────────────────────────────────────────
router.post('/generate', async (req, res) => {
  try {
    const { prompt, category, ageGroup, name } = req.body;

    if (!prompt?.trim()) {
      return res.status(200).json({ success: false, message: 'Prompt is required.' });
    }
    if (!category) {
      return res.status(200).json({ success: false, message: 'Category is required.' });
    }
    if (!ageGroup) {
      return res.status(200).json({ success: false, message: 'Age group is required.' });
    }
    if (!process.env.PIXAZO_API_KEY) {
      console.error('[AI Generate] PIXAZO_API_KEY missing');
      return res.status(200).json({ success: false, message: 'AI image generation is not configured. Please contact the administrator.' });
    }

    const displayName = name?.trim() || `AI ${category} Template`;
    const enhancedPrompt = buildImagePrompt(prompt.trim(), category, ageGroup);

    console.log('[AI Generate] Template generation started');
    console.log(`[AI Generate] Name: "${displayName}"`);
    console.log(`[AI Generate] Prompt length: ${enhancedPrompt.length} chars`);

    // ── 1. Generate image via Pixazo (returns null on failure) ──
    console.log('[AI Generate] Calling Pixazo...');
    const imageBuffer = await pixazoGenerateImage(enhancedPrompt);

    if (!imageBuffer || imageBuffer.length === 0) {
      console.error('[AI Generate] Pixazo failed — no image buffer returned');
      return res.status(200).json({
        success: false,
        message: 'Image generation failed. Please try again.'
      });
    }

    console.log(`[AI Generate] Pixazo success — ${Math.round(imageBuffer.length / 1024)} KB`);

    // ── 2. Composite Beam Welly logo onto image ────────────────
    console.log('[AI Generate] Compositing logo...');
    const finalImageBuffer = await compositeLogoOntoImage(imageBuffer);

    // ── 3. Upload to Supabase Storage ─────────────────────────
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(16).slice(2);
    const storagePath = `ai_generated/${timestamp}-${uniqueId}.png`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, finalImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[AI Generate] Supabase upload error:', uploadError);
      return res.status(200).json({ success: false, message: 'Failed to save generated image. Please try again.' });
    }

    // ── 4. Get public URL ──────────────────────────────────────
    const { data: publicData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const imageUrl = publicData.publicUrl;

    // ── 5. Save to Neon DB ─────────────────────────────────────
    const dbResult = await pool.query(
      `INSERT INTO uploaded_templates (display_name, storage_path, image_url, template_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [displayName, storagePath, imageUrl, 'ai_generated']
    );

    console.log(`[AI Generate] Template saved: ${dbResult.rows[0].id}`);

    res.status(201).json({ success: true, data: dbResult.rows[0] });

  } catch (err) {
    // Catch-all — NEVER crash the server
    console.error('[AI Generate] Unexpected error:', err.message || err);
    res.status(200).json({
      success: false,
      message: 'Image generation failed. Please try again.'
    });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/uploaded-templates/upload
// Manual file upload: multer → Supabase → Neon
// ──────────────────────────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const displayName = req.body.name?.trim();
    if (!displayName) {
      return res.status(400).json({ success: false, error: 'name field is required' });
    }

    const templateType = req.body.template_type || 'uploaded';
    const extension = req.file.originalname.split('.').pop().toLowerCase();
    const uniqueId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const storagePath = `${templateType}/${uniqueId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[upload error]', uploadError);
      return res.status(500).json({ success: false, error: `Storage upload failed: ${uploadError.message}` });
    }

    const { data: publicData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const result = await pool.query(
      `INSERT INTO uploaded_templates (display_name, storage_path, image_url, template_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [displayName, storagePath, publicData.publicUrl, templateType]
    );

    res.status(201).json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error('[uploaded-templates POST /upload]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// DELETE /api/uploaded-templates/:id
// Removes file from Supabase bucket + Neon record
// ──────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const lookup = await pool.query(
      `SELECT * FROM uploaded_templates WHERE id = $1`,
      [id]
    );

    if (lookup.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const record = lookup.rows[0];

    const { error: removeError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([record.storage_path]);

    if (removeError) {
      console.error('[Supabase remove error]', removeError);
      return res.status(500).json({ success: false, error: `Storage delete failed: ${removeError.message}` });
    }

    await pool.query(`DELETE FROM uploaded_templates WHERE id = $1`, [id]);

    res.json({ success: true, message: 'Template deleted successfully' });

  } catch (err) {
    console.error('[uploaded-templates DELETE]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// Multer error handler
// ──────────────────────────────────────────────────────────────
router.use((err, req, res, _next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, error: err.message });
  }
  res.status(500).json({ success: false, error: 'Unexpected error' });
});

module.exports = router;