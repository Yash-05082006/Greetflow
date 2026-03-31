# Greetflow - PostgreSQL Database Architecture

## Overview
This document defines the PostgreSQL schema for Greetflow, covering people, templates, campaigns, sends/logs, OAuth tokens, and audit logs. It aligns with the API and automation requirements for greeting and invitation workflows.

## Database Technology Stack
- Database: PostgreSQL 15+
- Character Set: UTF8
- Extensions: uuid-ossp, pgcrypto

## Text ER Diagram (Logical)

```
people (1) ──< sends >── (1) templates
   │                     │
   └─────────< campaigns ┘

campaigns (1) ──< sends >── (1) people

oauth_tokens (1) → used by → sends (delivery via Gmail)

audit_logs → records actions on people/templates/campaigns/sends
```

Relationships
- Each person can have multiple sends; a send references one person and one template, and optionally one campaign.
- A campaign uses one template and produces many sends.
- OAuth tokens are stored per connected Gmail account (not tied to a person).
- Audit logs capture actions across entities.

## Tables and Purpose

1) people — store recipients with DOB/anniversary, timezone, and consent
2) templates — reusable HTML templates for different occasions
3) campaigns — scheduled/bulk operations that generate sends
4) sends — individual delivery attempts and results
5) oauth_tokens — Gmail OAuth 2.0 tokens (encrypted at rest)
6) audit_logs — security/compliance trail of actions

## Schema (PostgreSQL)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENUMs
DO $$ BEGIN
    CREATE TYPE template_type AS ENUM ('birthday','anniversary','greeting','invitation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE age_group AS ENUM ('8_15','15_18','18_plus','na');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE campaign_status AS ENUM ('draft','scheduled','sent','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE channel_type AS ENUM ('app','gmail','both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE send_status AS ENUM ('queued','sent','failed','skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PEOPLE
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    dob DATE,
    anniversary_date DATE,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    consent_email BOOLEAN NOT NULL DEFAULT false,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_people_dob ON people(dob);
CREATE INDEX IF NOT EXISTS idx_people_anniversary ON people(anniversary_date);
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);

-- TEMPLATES
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    type template_type NOT NULL,
    age_group age_group NOT NULL DEFAULT 'na',
    html TEXT NOT NULL,
    preview_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_age_group ON templates(age_group);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);

-- CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    type template_type NOT NULL,
    audience_query JSONB NOT NULL DEFAULT '{}',
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE RESTRICT,
    channel channel_type NOT NULL DEFAULT 'gmail',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status campaign_status NOT NULL DEFAULT 'draft',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_schedule ON campaigns(scheduled_at);

-- SENDS
CREATE TABLE IF NOT EXISTS sends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE RESTRICT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    status send_status NOT NULL DEFAULT 'queued',
    error_msg TEXT,
    channel channel_type NOT NULL DEFAULT 'gmail',
    metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_sends_status_scheduled ON sends(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_sends_campaign ON sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sends_person ON sends(person_id);

-- OAUTH TOKENS (Gmail)
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL DEFAULT 'google',
    account_email VARCHAR(255) NOT NULL,
    access_token_enc TEXT NOT NULL,
    refresh_token_enc TEXT NOT NULL,
    expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_oauth_account ON oauth_tokens(provider, account_email);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor UUID,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id UUID,
    meta JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
```

## Triggers and Functions

```sql
-- Update timestamp helper
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_people_updated ON people;
CREATE TRIGGER trg_people_updated BEFORE UPDATE ON people
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_templates_updated ON templates;
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

## Indexing Strategy
- `people(dob)`, `people(anniversary_date)` for daily picks
- `sends(status, scheduled_for)` for worker fetch
- `campaigns(status)`, `campaigns(scheduled_at)` for dashboards

## Sample Records

```sql
-- People
INSERT INTO people (first_name, last_name, email, dob, timezone, consent_email, tags)
VALUES
('Asha','K','asha@example.com','1998-05-21','Asia/Kolkata',true, ARRAY['vip']),
('Rahul','S','rahul@example.com','1989-11-02','Asia/Kolkata',true, ARRAY['north']);

-- Templates
INSERT INTO templates (name, type, age_group, html, preview_url)
VALUES
('Birthday Elegant 18+','birthday','18_plus','<html>...</html>','https://cdn/greetflow/t1.png'),
('Diwali Classic','greeting','na','<html>...</html>','https://cdn/greetflow/t2.png');

-- Campaigns
INSERT INTO campaigns (title, type, audience_query, template_id, channel, scheduled_at, status)
SELECT 'Diwali 2025','greeting','{"tags":["vip"],"consent_email":true}'::jsonb, id, 'gmail', '2025-11-01T04:30:00Z', 'scheduled'
FROM templates WHERE name = 'Diwali Classic' LIMIT 1;

-- Sends
-- (Typically created by scheduler)
```

## Automation Logic (DB-side)

- Scheduling is orchestrated in the worker, but queries rely on:
  - People due today per timezone: `WHERE consent_email AND (dob or anniversary_date matches local date)`
  - Pending sends: `status = 'queued' AND scheduled_for <= now()`
- Optional: materialized view for upcoming events to speed UI queries.

```sql
-- Optional view for upcoming birthdays/anniversaries (simplified UTC comparison)
CREATE OR REPLACE VIEW upcoming_events AS
SELECT
  p.id as person_id,
  p.first_name,
  p.last_name,
  p.email,
  p.timezone,
  COALESCE(
    make_date(date_part('year', now())::int, date_part('month', p.dob)::int, date_part('day', p.dob)::int),
    make_date(date_part('year', now())::int, date_part('month', p.anniversary_date)::int, date_part('day', p.anniversary_date)::int)
  ) as event_date
FROM people p
WHERE p.consent_email = true;
```

## Constraints and Policies

- Enforce consent: application layer must check `people.consent_email = true` before enqueueing sends.
- On delete of `people`, cascade removes dependent `sends`.
- Unique email per person enforced by `UNIQUE (email)`.

## Supabase Compatibility

- Schema uses PostgreSQL core features and is compatible with Supabase.
- RLS can be added per project needs; no RLS included here by default.


