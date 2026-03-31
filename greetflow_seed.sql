-- greetflow_seed.sql
-- This script populates the database with sample data for people, campaigns, and sends.
-- It uses deterministic UUIDs for consistency and references existing template IDs.

-- Ensure extensions for UUID determinism (optional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    -- Use actual Template IDs from your database
    birthday_template_id UUID := '494d58d5-5713-4c6f-8139-6845bb0adca7';
    greeting_template_id UUID := 'a934a81c-1e9c-42b2-8b25-2f7af95ae493';
    invitation_template_id UUID := '41f6ae7e-7b26-46dc-9ba3-899d040880ff';
    anniversary_template_id UUID := 'fdc4da8c-198b-4291-adba-503b6a15a83d';

    -- Deterministic UUIDs for people for consistency
    person_id_1 UUID := '11111111-1111-1111-1111-111111111111';
    person_id_2 UUID := '22222222-2222-2222-2222-222222222222';
    person_id_3 UUID := '33333333-3333-3333-3333-333333333333';

    -- Deterministic UUIDs for campaigns for consistency
    campaign_id_1 UUID := 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1';
    campaign_id_2 UUID := 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2';
    campaign_id_3 UUID := 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3';

BEGIN
    -- Step 1: Seed PEOPLE table
    INSERT INTO people (id, first_name, last_name, email, dob, timezone, consent_email, tags)
    VALUES
        (person_id_1, 'Jane', 'Doe', 'jane.doe@example.com', '1990-10-25', 'America/New_York', true, ARRAY['vip', 'early_adopter']),
        (person_id_2, 'John', 'Smith', 'john.smith@example.com', '1985-04-12', 'Europe/London', true, ARRAY['new_user']),
        (person_id_3, 'Sam', 'Wilson', 'sam.wilson@example.com', '2001-07-30', 'Asia/Kolkata', false, ARRAY['test_account', 'vip'])
    ON CONFLICT (id) DO NOTHING;

    -- Step 2: Seed CAMPAIGNS table
    INSERT INTO campaigns (id, title, type, audience_query, template_id, channel, scheduled_at, status)
    VALUES
        (campaign_id_1, 'Q4 Birthday Campaign', 'birthday', '{"tags": ["vip"]}', birthday_template_id, 'gmail', NOW() + INTERVAL '10 days', 'scheduled'),
        (campaign_id_2, 'Welcome Greetings Q4', 'greeting', '{"tags": ["new_user"]}', greeting_template_id, 'gmail', NOW() - INTERVAL '1 day', 'sent'),
        (campaign_id_3, 'Annual Gala Invitation 2024', 'invitation', '{"tags": ["all_clients"]}', invitation_template_id, 'gmail', NOW() - INTERVAL '1 year', 'sent')
    ON CONFLICT (id) DO NOTHING;

    -- Step 3: Seed SENDS table (linking people, campaigns, and templates)
    INSERT INTO sends (id, campaign_id, person_id, template_id, scheduled_for, sent_at, status, error_msg, channel)
    VALUES
        ('ccccccc1-cccc-cccc-cccc-ccccccccccc1', campaign_id_2, person_id_2, greeting_template_id, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 'sent', NULL, 'gmail')
        ,('ccccccc2-cccc-cccc-cccc-ccccccccccc2', campaign_id_2, person_id_3, greeting_template_id, NOW() - INTERVAL '1 day', NULL, 'failed', 'SMTP Error: 550 User not found', 'gmail')
        ,('ccccccc3-cccc-cccc-cccc-ccccccccccc3', campaign_id_1, person_id_1, birthday_template_id, NOW() + INTERVAL '10 days', NULL, 'queued', NULL, 'gmail')
    ON CONFLICT (id) DO NOTHING;

END $$;
