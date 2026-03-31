-- Greetflow Dummy Data Seeding
-- Run this in your Supabase SQL Editor to add sample data.
-- This script now uses existing template IDs to ensure data integrity.

-- NOTE: This script assumes the following templates exist in your 'templates' table.
-- '494d58d5-5713-4c6f-8139-6845bb0adca7' (Sophisticated Elegance - Birthday)
-- 'a934a81c-1e9c-42b2-8b25-2f7af95ae493' (Warm Professional - Greeting)
-- '41f6ae7e-7b26-46dc-9ba3-899d040880ff' (Corporate Excellence - Event Invitation)

DO $$
DECLARE
    birthday_template_id UUID := '494d58d5-5713-4c6f-8139-6845bb0adca7';
    greeting_template_id UUID := 'a934a81c-1e9c-42b2-8b25-2f7af95ae493';
    invitation_template_id UUID := '41f6ae7e-7b26-46dc-9ba3-899d040880ff';
BEGIN
    -- A scheduled birthday campaign
    INSERT INTO campaigns (title, type, audience_query, template_id, channel, scheduled_at, status)
    VALUES ('Q4 Birthday Wishes', 'birthday', '{"tags": ["vip"]}', birthday_template_id, 'gmail', NOW() + INTERVAL '10 days', 'scheduled')
    ON CONFLICT (id) DO NOTHING;

    -- A draft campaign for Diwali
    INSERT INTO campaigns (title, type, audience_query, template_id, channel, status)
    VALUES ('Diwali 2025 Greetings', 'greeting', '{"tags": ["all_clients"]}', greeting_template_id, 'gmail', 'draft')
    ON CONFLICT (id) DO NOTHING;

    -- A campaign that has already been sent (using an invitation template for variety)
    INSERT INTO campaigns (title, type, audience_query, template_id, channel, scheduled_at, status)
    VALUES ('Annual Gala Invitation 2024', 'invitation', '{"tags": ["all_clients"]}', invitation_template_id, 'gmail', NOW() - INTERVAL '1 year', 'sent')
    ON CONFLICT (id) DO NOTHING;

END $$;