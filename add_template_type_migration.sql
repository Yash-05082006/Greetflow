-- ============================================================
-- Migration: Add template_type + image_url to uploaded_templates
-- Run this once against your Neon PostgreSQL database.
-- ============================================================

-- 1. Add template_type column (distinguishes uploaded vs AI-generated)
ALTER TABLE uploaded_templates
  ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) NOT NULL DEFAULT 'uploaded';

-- 2. Add CHECK constraint so only valid values are stored
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chk_uploaded_templates_type'
      AND table_name = 'uploaded_templates'
  ) THEN
    ALTER TABLE uploaded_templates
      ADD CONSTRAINT chk_uploaded_templates_type
      CHECK (template_type IN ('uploaded', 'ai_generated'));
  END IF;
END $$;

-- 3. Add image_url column (public Supabase URL for display in frontend)
ALTER TABLE uploaded_templates
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Index on template_type for fast filtering
CREATE INDEX IF NOT EXISTS idx_uploaded_templates_type
  ON uploaded_templates (template_type);

-- 5. Backfill: mark any existing rows as 'uploaded'
UPDATE uploaded_templates
  SET template_type = 'uploaded'
WHERE template_type IS NULL OR template_type = '';

-- ============================================================
-- Verify
-- ============================================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'uploaded_templates'
ORDER BY ordinal_position;
