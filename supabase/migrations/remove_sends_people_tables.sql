-- Migration: Remove unused 'sends' and 'people' tables
-- Date: 2025-11-07
-- Description: Safely remove sends and people tables along with all their dependencies
-- Reason: These tables are not used in the active Greetflow backend APIs or workflows

-- ============================================================================
-- STEP 1: Drop indexes related to 'sends' table
-- ============================================================================

-- Drop sends table indexes
DROP INDEX IF EXISTS idx_sends_status_scheduled;
-- ^ Removes composite index on sends(status, scheduled_for)

DROP INDEX IF EXISTS idx_sends_campaign;
-- ^ Removes index on sends(campaign_id) foreign key

DROP INDEX IF EXISTS idx_sends_person;
-- ^ Removes index on sends(person_id) foreign key

-- ============================================================================
-- STEP 2: Drop the 'sends' table (this will automatically drop its foreign keys)
-- ============================================================================

DROP TABLE IF EXISTS sends;
-- ^ Removes sends table and all its foreign key constraints:
--   - Foreign key to campaigns(id) with ON DELETE SET NULL
--   - Foreign key to people(id) with ON DELETE CASCADE  
--   - Foreign key to templates(id) with ON DELETE RESTRICT

-- ============================================================================
-- STEP 3: Drop triggers related to 'people' table
-- ============================================================================

DROP TRIGGER IF EXISTS trg_people_updated ON people;
-- ^ Removes the update trigger that calls set_updated_at() function

-- ============================================================================
-- STEP 4: Drop indexes related to 'people' table
-- ============================================================================

DROP INDEX IF EXISTS idx_people_dob;
-- ^ Removes index on people(dob) for birthday queries

DROP INDEX IF EXISTS idx_people_anniversary;
-- ^ Removes index on people(anniversary_date) for anniversary queries

DROP INDEX IF EXISTS idx_people_email;
-- ^ Removes index on people(email) for email lookups

-- ============================================================================
-- STEP 5: Drop the 'people' table
-- ============================================================================

DROP TABLE IF EXISTS people;
-- ^ Removes people table completely
-- Note: sends table was already dropped, so no foreign key constraints remain

-- ============================================================================
-- STEP 6: Clean up unused ENUM types (optional - only if not used elsewhere)
-- ============================================================================

-- Note: send_status ENUM was only used by sends table, so we can remove it
DROP TYPE IF EXISTS send_status;
-- ^ Removes send_status ENUM ('queued','sent','failed','skipped')
-- This was only used by the sends.status column

-- ============================================================================
-- VERIFICATION NOTES:
-- ============================================================================
-- After this migration, the remaining tables should be:
-- - users (active in backend APIs)
-- - templates (active in backend APIs) 
-- - campaigns (references templates, no longer references people)
-- - email_logs (active in backend APIs)
-- - oauth_tokens (independent table)
-- - audit_logs (independent table)
--
-- Remaining ENUM types:
-- - template_type (used by templates and campaigns)
-- - age_group (used by templates)
-- - campaign_status (used by campaigns)
-- - channel_type (used by campaigns)
--
-- No dangling foreign key constraints should remain.
-- All backend APIs referencing users, templates, campaigns, email_logs remain unaffected.
-- ============================================================================
