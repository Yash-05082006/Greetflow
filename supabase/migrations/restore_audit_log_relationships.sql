-- Migration: Restore foreign key relationships for audit_logs table
-- Date: 2025-11-07
-- Description: Reconnect audit_logs table with users and email_logs tables
-- Reason: After removing people and sends tables, audit_logs needs proper relational integrity

-- ============================================================================
-- STEP 1: Add foreign key constraint for audit_logs.actor → users.id
-- ============================================================================

-- Add foreign key relationship between audit_logs.actor and users.id
ALTER TABLE audit_logs 
ADD CONSTRAINT fk_audit_logs_actor_users 
FOREIGN KEY (actor) 
REFERENCES users(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- ^ Creates relationship: audit_logs.actor → users.id
-- ^ ON DELETE SET NULL: Preserves audit history even if user is deleted
-- ^ ON UPDATE CASCADE: Maintains consistency if user ID is updated

-- ============================================================================
-- STEP 2: Add foreign key constraint for audit_logs.entity_id → email_logs.id  
-- ============================================================================

-- Add foreign key relationship between audit_logs.entity_id and email_logs.id
ALTER TABLE audit_logs 
ADD CONSTRAINT fk_audit_logs_entity_email_logs 
FOREIGN KEY (entity_id) 
REFERENCES email_logs(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- ^ Creates relationship: audit_logs.entity_id → email_logs.id
-- ^ ON DELETE SET NULL: Preserves audit history even if email log is deleted
-- ^ ON UPDATE CASCADE: Maintains consistency if email log ID is updated

-- ============================================================================
-- STEP 3: Create indexes for improved query performance (optional but recommended)
-- ============================================================================

-- Create index on audit_logs.actor for faster joins with users table
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor 
ON audit_logs(actor) 
WHERE actor IS NOT NULL;

-- ^ Improves performance for queries joining audit_logs with users
-- ^ Partial index (WHERE actor IS NOT NULL) for efficiency

-- Create index on audit_logs.entity_id for faster joins with email_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id 
ON audit_logs(entity_id) 
WHERE entity_id IS NOT NULL;

-- ^ Improves performance for queries joining audit_logs with email_logs
-- ^ Partial index (WHERE entity_id IS NOT NULL) for efficiency

-- ============================================================================
-- VERIFICATION NOTES:
-- ============================================================================
-- After this migration, the audit_logs table will have proper relational integrity:
--
-- RELATIONSHIPS CREATED:
-- 1. audit_logs.actor → users.id (tracks who performed the action)
-- 2. audit_logs.entity_id → email_logs.id (tracks what email was acted upon)
--
-- FOREIGN KEY PROPERTIES:
-- - ON DELETE SET NULL: Audit history preserved even if referenced record is deleted
-- - ON UPDATE CASCADE: Maintains referential integrity during updates
--
-- INDEXES CREATED:
-- - idx_audit_logs_actor: Optimizes queries joining audit_logs with users
-- - idx_audit_logs_entity_id: Optimizes queries joining audit_logs with email_logs
--
-- SCHEMA VISUALIZATION:
-- The Supabase schema visualizer should now show connection lines:
-- - audit_logs → users (via actor column)
-- - audit_logs → email_logs (via entity_id column)
--
-- EXISTING DATA:
-- - All existing audit_logs data remains unchanged
-- - No columns were renamed, dropped, or modified
-- - Orphaned references (if any) will be handled gracefully by SET NULL constraint
--
-- UNAFFECTED TABLES:
-- - users: No changes made
-- - email_logs: No changes made  
-- - templates, campaigns, oauth_tokens: Remain untouched
-- ============================================================================
