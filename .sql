-- Greetflow Dummy Data Seeding for the 'sends' table.
-- Run this in your Supabase SQL Editor to add sample send records.

-- NOTE: This script assumes that records with the specified UUIDs exist in the
-- 'people', 'campaigns', and 'templates' tables.

DO $$
DECLARE
    -- Existing Template IDs
    greeting_template_id UUID := 'a934a81c-1e9c-42b2-8b25-2f7af95ae493';
    birthday_template_id UUID := '494d58d5-5713-4c6f-8139-6845bb0adca7';

    -- Assumed existing People IDs
    person_id_1 UUID := '11111111-1111-1111-1111-111111111111';
    person_id_2 UUID := '22222222-2222-2222-2222-222222222222';

    -- Assumed existing Campaign IDs
    birthday_campaign_id UUID := 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1';
    greeting_campaign_id UUID := 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2';

BEGIN
    -- Insert sample 'sends' records
    INSERT INTO sends (id, campaign_id, person_id, template_id, scheduled_for, sent_at, status, error_msg, channel)
    VALUES
        -- 1. A successfully sent message from a greeting campaign
        ('ccccccc1-cccc-cccc-cccc-ccccccccccc1', greeting_campaign_id, person_id_2, greeting_template_id, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 'sent', NULL, 'gmail'),

        -- 2. A failed message (useful for testing retry logic)
        ('ccccccc2-cccc-cccc-cccc-ccccccccccc2', greeting_campaign_id, person_id_1, greeting_template_id, NOW() - INTERVAL '1 day', NULL, 'failed', 'SMTP Error: 550 User not found', 'gmail'),

        -- 3. A queued message for an upcoming birthday campaign
        ('ccccccc3-cccc-cccc-cccc-ccccccccccc3', birthday_campaign_id, person_id_1, birthday_template_id, NOW() + INTERVAL '10 days', NULL, 'queued', NULL, 'gmail')
    ON CONFLICT (id) DO NOTHING;
END $$;