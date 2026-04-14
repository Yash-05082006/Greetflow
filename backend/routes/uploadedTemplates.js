const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');
const sharp = require('sharp');
const pool = require('../config/db');
const supabase = require('../config/storage');

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
// Nano Banana (Gemini) AI — @google/genai SDK
// Confirmed working image generation models (verified via diagnostic):
//   - gemini-2.5-flash-image         (Nano Banana — fastest)
//   - gemini-3.1-flash-image-preview (Nano Banana 2)
//   - gemini-3-pro-image-preview     (Nano Banana Pro — highest quality)
// ──────────────────────────────────────────────────────────────
const GEMINI_IMAGE_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image-preview',
];
const GENERATION_TIMEOUT_MS = 120_000; // 120 seconds max per attempt
const MAX_RETRIES = 2;                  // retry up to 2 times on rate limit
const RETRY_BASE_DELAY_MS = 15_000;     // base wait before retry

// ──────────────────────────────────────────────────────────────
// Helper: build an enhanced system prompt for Gemini
// ──────────────────────────────────────────────────────────────
function buildGeminiPrompt(userPrompt, category, ageGroup) {
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



// Helper: extract retryDelay in seconds from Gemini 429 error message
function parseRetryDelay(errMessage) {
  const match = errMessage?.match(/retry in ([\d.]+)s/);
  return match ? Math.ceil(parseFloat(match[1])) : null;
}

// Helper: detect permanent zero-quota (limit: 0) vs temporary rate limit
// When Gemini says "limit: 0" the project has no access — retrying is futile.
function isZeroQuotaError(errMessage) {
  return /limit:\s*0/i.test(errMessage || '');
}

// Call Gemini with timeout + model fallback.
// Retries only on transient rate limits. Aborts immediately on zero-quota.
async function callGeminiImageGeneration(prompt) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let lastError = null;

  for (const modelName of GEMINI_IMAGE_MODELS) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[AI Generate] Model: ${modelName}, attempt ${attempt + 1}/${MAX_RETRIES + 1}`);

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini timed out after ${GENERATION_TIMEOUT_MS / 1000}s`)), GENERATION_TIMEOUT_MS)
        );

        const genPromise = ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseModalities: ['IMAGE', 'TEXT'],
          },
        });

        const response = await Promise.race([genPromise, timeoutPromise]);

        // Extract image from response parts
        const parts = response.candidates?.[0]?.content?.parts || [];
        console.log(`[AI Generate] Response has ${parts.length} part(s)`);

        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            const buffer = Buffer.from(part.inlineData.data, 'base64');
            console.log(`[AI Generate] ✅ Image from ${modelName} (${Math.round(buffer.length / 1024)}KB, ${part.inlineData.mimeType})`);
            return buffer;
          }
        }

        console.warn(`[AI Generate] ${modelName} returned no image data in parts`);
        lastError = new Error(`${modelName} responded but produced no image`);
        break; // don't retry — model responded, just no image

      } catch (err) {
        const httpStatus = err.status || 0;
        const msg = err.message || '';
        console.error(`[AI Generate] ${modelName} error (HTTP ${httpStatus}):`, msg.substring(0, 400));

        if (httpStatus === 429 || msg.includes('RESOURCE_EXHAUSTED')) {
          // ── Zero-quota: project has no image generation access ──
          if (isZeroQuotaError(msg)) {
            console.error(`[AI Generate] ZERO QUOTA detected for ${modelName} — no retries.`);
            const zeroErr = new Error('ZERO_QUOTA');
            zeroErr.status = 403;
            throw zeroErr;
          }

          // ── Transient rate limit: retry with backoff ──
          const suggestedDelay = parseRetryDelay(msg);
          const waitMs = suggestedDelay
            ? Math.min(suggestedDelay * 1000, 60_000)
            : RETRY_BASE_DELAY_MS * (attempt + 1);

          if (attempt < MAX_RETRIES) {
            console.log(`[AI Generate] Transient rate limit. Waiting ${Math.round(waitMs / 1000)}s before retry...`);
            await new Promise(r => setTimeout(r, waitMs));
            continue;
          } else {
            console.log(`[AI Generate] Rate limited on ${modelName} after ${MAX_RETRIES + 1} attempts, trying next model...`);
            lastError = new Error(`Rate limited on ${modelName}. Gemini free tier quota exhausted.`);
            break;
          }
        }

        if (httpStatus === 404 || msg.includes('NOT_FOUND')) {
          console.log(`[AI Generate] ${modelName} not found, skipping`);
          lastError = new Error(`Model ${modelName} not available`);
          break;
        }

        // Any other error — propagate immediately
        throw err;
      }
    }
  }

  throw lastError || new Error('All Gemini image models failed. Please try again later.');
}

// ──────────────────────────────────────────────────────────────
// POST /api/uploaded-templates/generate
// AI image generation via Gemini + logo composite + Supabase upload
// Body: { prompt, category, ageGroup, name? }
// ──────────────────────────────────────────────────────────────
router.post('/generate', async (req, res) => {
  try {
    const { prompt, category, ageGroup, name } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({ success: false, error: 'prompt is required' });
    }
    if (!category) {
      return res.status(400).json({ success: false, error: 'category is required' });
    }
    if (!ageGroup) {
      return res.status(400).json({ success: false, error: 'ageGroup is required' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, error: 'AI generation is not configured. Please add GEMINI_API_KEY to backend environment.' });
    }

    const displayName = name?.trim() || `AI ${category} Template`;
    const enhancedPrompt = buildGeminiPrompt(prompt.trim(), category, ageGroup);

    console.log(`[AI Generate] Generating image for: "${displayName}"`);
    console.log(`[AI Generate] Enhanced prompt length: ${enhancedPrompt.length} chars`);

    // ── 1. Call Nano Banana / Gemini (with model fallback + timeout) ──
    const imageBuffer = await callGeminiImageGeneration(enhancedPrompt);

    if (!imageBuffer || imageBuffer.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Gemini did not return an image. Please try a different prompt.'
      });
    }

    console.log(`[AI Generate] Compositing logo...`);

    // ── 2. Composite Beam Welly logo onto image ────────────────
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
      return res.status(500).json({ success: false, error: `Storage upload failed: ${uploadError.message}` });
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
    const httpStatus = err.status || 0;
    const rawMsg = err.message || 'Unknown error';
    console.error(`[AI Generate] Error (HTTP ${httpStatus}):`, rawMsg.substring(0, 500));

    // Extract user-friendly message from Gemini's JSON error body
    let userMessage = rawMsg;
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed?.error?.message) userMessage = parsed.error.message;
    } catch { /* not JSON, use raw */ }

    // Zero-quota: project lacks image generation access entirely
    if (rawMsg === 'ZERO_QUOTA' || httpStatus === 403) {
      return res.status(403).json({
        success: false,
        error: 'AI image generation quota unavailable for current Gemini project. Please upgrade billing or use another API key.'
      });
    }
    if (httpStatus === 401 || rawMsg.includes('API_KEY_INVALID')) {
      return res.status(401).json({ success: false, error: 'Invalid Gemini API key. Please check GEMINI_API_KEY in backend .env' });
    }
    if (httpStatus === 429 || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('Rate limited')) {
      return res.status(429).json({ success: false, error: 'Gemini API quota temporarily exhausted. Please wait 1-2 minutes and try again.' });
    }
    if (rawMsg.includes('timed out')) {
      return res.status(504).json({ success: false, error: 'Image generation timed out. Please try a simpler prompt or try again later.' });
    }

    res.status(500).json({ success: false, error: userMessage.substring(0, 500) || 'Image generation failed' });
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