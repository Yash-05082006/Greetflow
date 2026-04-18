const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const { parse } = require('csv-parse');
const XLSX = require('xlsx');

console.log('[users] Users routes loaded');

// ──────────────────────────────────────────────────────────────
// Multer — memory storage for CSV imports (no disk writes)
// ──────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted'));
    }
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/users  — return ALL users (frontend handles pagination)
// Order: created_at DESC (newest batch first), import_order ASC
//        (preserves CSV row order within a batch)
// ──────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM users
       ORDER BY created_at DESC, COALESCE(import_order, 0) ASC`
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/users/export  ← MUST be before /:id
// All users → Excel (.xlsx) download
// ──────────────────────────────────────────────────────────────
router.get('/export', async (req, res) => {
  try {
    console.log('[Export] Starting user export...');

    const result = await pool.query(
      `SELECT
         name, email, phone, category,
         TO_CHAR(date_of_birth, 'YYYY-MM-DD')    AS date_of_birth,
         TO_CHAR(anniversary_date, 'YYYY-MM-DD') AS anniversary_date,
         array_to_string(preferences, ', ')      AS preferences,
         TO_CHAR(created_at, 'YYYY-MM-DD')       AS created_at
       FROM users
       ORDER BY created_at DESC`
    );

    const rows = result.rows.map(r => ({
      Name:            r.name            || '',
      Email:           r.email           || '',
      Phone:           r.phone           || '',
      Category:        r.category        || '',
      'Date of Birth': r.date_of_birth   || '',
      Anniversary:     r.anniversary_date || '',
      Preferences:     r.preferences     || '',
      'Created At':    r.created_at      || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'No users found' }]);

    // Auto-width columns
    const keys = Object.keys(rows[0] || { Note: '' });
    ws['!cols'] = keys.map(k => ({
      wch: Math.max(k.length, ...rows.map(r => String(r[k] || '').length)) + 2
    }));

    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = `greetflow-users-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

    console.log(`[Export] Exported ${rows.length} users`);
  } catch (err) {
    console.error('[Export] Error:', err.message);
    res.status(500).json({ success: false, message: 'Export failed. Please try again.' });
  }
});

// ──────────────────────────────────────────────────────────────
// Helper: normalise any date string → YYYY-MM-DD for PostgreSQL
// Handles: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, empty/null
// ──────────────────────────────────────────────────────────────
function normalizeDate(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dmyMatch) {
    const [, dd, mm, yyyy] = dmyMatch;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  // YYYY-MM-DD — already correct
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Fallback — let Postgres try (e.g. "July 22, 1986")
  return str;
}

// ──────────────────────────────────────────────────────────────
// POST /api/users/import  ← MUST be before /:id
// CSV → bulk insert into users table
//
// Accepted CSV headers (case-insensitive, any spacing):
//   name | full_name | full name
//   email
//   phone | mobile | contact
//   category
//   date_of_birth | dob | birthday | birth_date
//   anniversary_date | anniversary | wedding_anniversary
//   preferences
// ──────────────────────────────────────────────────────────────
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    console.log('[Import] File received:', req.file?.originalname);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file uploaded.' });
    }

    // ── Step 1: Parse raw CSV ──────────────────────────────────
    const records = await new Promise((resolve, reject) => {
      const rows = [];
      parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        bom: true,
      })
        .on('data', row => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', err => reject(err));
    });

    console.log(`[Import] Parsed ${records.length} row(s) from CSV`);
    if (records.length > 0) {
      console.log('[Import] Sample raw row (first):', records[0]);
    }

    if (!records.length) {
      return res.status(400).json({ success: false, message: 'CSV file is empty.' });
    }

    // ── Step 2: Header normalisation + alias map ───────────────
    const normaliseKey = key =>
      key.toLowerCase().replace(/[\s\-\/]+/g, '_').replace(/[^a-z0-9_]/g, '').trim();

    const HEADER_ALIASES = {
      full_name:           'name',
      fullname:            'name',
      mobile:              'phone',
      contact:             'phone',
      contact_no:          'phone',
      phone_number:        'phone',
      dob:                 'date_of_birth',
      birthday:            'date_of_birth',
      birth_date:          'date_of_birth',
      date_of_birth:       'date_of_birth',
      anniversary:         'anniversary_date',
      wedding_anniversary: 'anniversary_date',
      anniversary_date:    'anniversary_date',
      type:                'category',
      user_type:           'category',
    };

    const normaliseRow = rawObj => {
      const out = {};
      for (const [k, v] of Object.entries(rawObj)) {
        const normKey  = normaliseKey(k);
        const canonKey = HEADER_ALIASES[normKey] || normKey;
        out[canonKey]  = typeof v === 'string' ? v.trim() : v;
      }
      return out;
    };

    // ── Step 3: Independent per-row inserts (NO global transaction)
    // Each row uses pool.query() directly — one bad row never
    // aborts others ("current transaction is aborted" is impossible).
    // ──────────────────────────────────────────────────────────
    let inserted = 0;
    let skipped  = 0;
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const row    = normaliseRow(records[i]);
      const rowNum = i + 2; // 1-indexed counting + header row

      console.log(`[Import] Row ${rowNum} mapped:`, row);

      const name  = (row.name  || '').trim();
      const email = (row.email || '').trim().toLowerCase();

      // Validate required fields
      if (!name) {
        skipped++;
        const reason = `Row ${rowNum}: missing "name" field`;
        console.warn('[Import] Skipped —', reason);
        errors.push({ row: rowNum, reason });
        continue;
      }
      if (!email) {
        skipped++;
        const reason = `Row ${rowNum}: missing "email" field`;
        console.warn('[Import] Skipped —', reason);
        errors.push({ row: rowNum, reason });
        continue;
      }

      // Normalise dates BEFORE sending to Postgres
      const dob         = normalizeDate(row.date_of_birth);
      const anniversary = normalizeDate(row.anniversary_date);
      const phone       = row.phone     || null;
      const category    = row.category  || 'User';
      const preferences = row.preferences ? `{${row.preferences}}` : null;

      console.log(`[Import] Row ${rowNum} — dob: ${dob}, anniversary: ${anniversary}`);

      try {
        // Each insert is independent — no surrounding transaction
        // import_order = i preserves the CSV row sequence within this batch
        const result = await pool.query(
          `INSERT INTO users
             (name, email, phone, category, date_of_birth, anniversary_date, preferences, import_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (email) DO NOTHING`,
          [name, email, phone, category, dob, anniversary, preferences, i]
        );

        if (result.rowCount > 0) {
          inserted++;
          console.log(`[Import] ✅ Inserted row ${rowNum}: ${email}`);
        } else {
          skipped++;
          const reason = `Row ${rowNum}: email "${email}" already exists (duplicate)`;
          console.log(`[Import] ⚠ Duplicate skipped row ${rowNum}: ${email}`);
          errors.push({ row: rowNum, reason });
        }
      } catch (rowErr) {
        skipped++;
        const reason = `Row ${rowNum} ("${name}"): ${rowErr.message}`;
        console.error('[Import] DB error —', reason);
        errors.push({ row: rowNum, reason });
        // Continue to next row — do NOT re-throw
      }
    }

    console.log(`[Import] Done — ${inserted} inserted, ${skipped} skipped of ${records.length} total`);

    res.json({
      success: true,
      message: `Import complete. ${inserted} user${inserted !== 1 ? 's' : ''} added, ${skipped} skipped.`,
      inserted,
      skipped,
      total: records.length,
      errors: errors.slice(0, 20),
    });

  } catch (err) {
    console.error('[Import] Fatal error:', err.message);
    res.status(500).json({ success: false, message: 'Import failed. Please try again.' });
  }
});


// ──────────────────────────────────────────────────────────────

// POST /api/users  — single create
// ──────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;

    const result = await pool.query(
      `INSERT INTO users (name, email)
       VALUES ($1, $2)
       RETURNING *`,
      [name, email]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT /api/users/:id  — update (AFTER literal routes)
// ──────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *`,
      [req.body.name, req.body.email, req.params.id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// DELETE /api/users/:id  — delete (AFTER literal routes)
// ──────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM users WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;