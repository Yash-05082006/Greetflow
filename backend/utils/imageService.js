/**
 * imageService.js
 * ────────────────────────────────────────────────────────────────────────────
 * Pixazo (Stable Diffusion SDXL) image generation service.
 *
 * Usage:
 *   const { generateImage } = require('./imageService');
 *   const buffer = await generateImage(prompt);   // → Buffer | null
 *
 * Environment variable required:
 *   PIXAZO_API_KEY — Ocp-Apim-Subscription-Key for the Pixazo gateway
 *
 * Returns null on ANY failure — never throws, never crashes.
 * ────────────────────────────────────────────────────────────────────────────
 */

const PIXAZO_URL = 'https://gateway.pixazo.ai/getImage/v1/getSDXLImage';
const REQUEST_TIMEOUT_MS = 90_000; // 90 seconds

/**
 * Generate an image via Pixazo Stable Diffusion SDXL.
 *
 * @param {string} prompt - The image generation prompt.
 * @returns {Promise<Buffer|null>} Image buffer on success, null on any failure.
 */
async function generateImage(prompt) {
  try {
    const apiKey = process.env.PIXAZO_API_KEY;

    if (!apiKey) {
      console.error('[Pixazo] PIXAZO_API_KEY is not set — cannot generate image');
      return null;
    }

    if (!prompt || !prompt.trim()) {
      console.error('[Pixazo] Empty prompt — cannot generate image');
      return null;
    }

    const body = {
      prompt: prompt.trim(),
      negative_prompt: 'low quality, blurry, deformed, ugly, disfigured, watermark, text, signature',
      height: 1024,
      width: 1024,
      num_steps: 20,
      guidance_scale: 5,
    };

    console.log('[Pixazo] Using Pixazo for image generation');
    console.log('[Pixazo] Calling Pixazo...');
    console.log('[Pixazo] API called with prompt:', prompt.trim().slice(0, 200));
    console.log(`[Pixazo] Prompt: "${prompt.trim().slice(0, 120)}..."`);

    // Timeout wrapper
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(PIXAZO_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Ocp-Apim-Subscription-Key': apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        console.error(`[Pixazo] Pixazo failed: request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
      } else {
        console.error('[Pixazo] Pixazo failed: network error:', fetchErr.message);
      }
      return null;
    }

    clearTimeout(timeoutId);

    console.log('[Pixazo] Raw response status:', response.status);
    console.log('[Pixazo] Response content-type:', response.headers.get('content-type'));

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errBody = await response.text();
        errorDetail += `: ${errBody.slice(0, 300)}`;
      } catch { /* ignore body parse error */ }
      console.error('[Pixazo] Pixazo failed: API error:', errorDetail);
      return null;
    }

    // Parse response — handle all known Pixazo response formats
    const contentType = response.headers.get('content-type') || '';

    // Format A: JSON with imageUrl / base64
    if (contentType.includes('application/json')) {
      const json = await response.json();
      console.log('[Pixazo] JSON response keys:', Object.keys(json));

      // Case: URL returned
      if (json.imageUrl || json.image_url || json.url) {
        const url = json.imageUrl || json.image_url || json.url;
        console.log(`[Pixazo] Pixazo success — Image URL: ${url}`);

        const imgResponse = await fetch(url);
        if (!imgResponse.ok) {
          console.error(`[Pixazo] Pixazo failed: could not fetch image from URL: HTTP ${imgResponse.status}`);
          return null;
        }
        const arrayBuffer = await imgResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log('[Pixazo] Image buffer created successfully');
        return buffer;
      }

      // Case: base64 image in JSON
      if (json.image || json.base64 || json.data) {
        const b64 = json.image || json.base64 || json.data;
        const raw = b64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(raw, 'base64');
        console.log(`[Pixazo] Pixazo success — Base64 image decoded (${Math.round(buffer.length / 1024)} KB)`);
        console.log('[Pixazo] Image buffer created successfully');
        return buffer;
      }

      console.error(`[Pixazo] Pixazo failed: JSON response had no image field. Keys: ${Object.keys(json).join(', ')}`);
      return null;
    }

    // Format B: raw binary
    if (contentType.includes('image/')) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`[Pixazo] Pixazo success — binary image (${Math.round(buffer.length / 1024)} KB, ${contentType})`);
      console.log('[Pixazo] Image buffer created successfully');
      return buffer;
    }

    console.error(`[Pixazo] Pixazo failed: unexpected content-type: ${contentType}`);
    return null;

  } catch (err) {
    // Catch-all — NEVER crash
    console.error('[Pixazo] Pixazo error (catch-all):', err.message || err);
    return null;
  }
}

// Log PIXAZO_API_KEY status on module load (never crash)
console.log('[Pixazo] PIXAZO_API_KEY loaded:', !!process.env.PIXAZO_API_KEY);
if (!process.env.PIXAZO_API_KEY) {
  console.error('[Pixazo] PIXAZO_API_KEY missing — AI image generation will not work');
}

module.exports = { generateImage };
