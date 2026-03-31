# Greetflow SQL Blocks for Supabase

This document provides SQL blocks organized by table creation order for safe Supabase deployment.

## Prerequisites

```sql
-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## 1. people

**Purpose**: Store client/user profiles with personal details, dates, timezone, and consent flags for automated greeting delivery.

```sql
-- Create people table with all required fields
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name text NOT NULL,
    last_name text,
    email text NOT NULL UNIQUE,
    dob date,
    anniversary_date date,
    timezone text NOT NULL DEFAULT 'UTC',
    consent_email boolean NOT NULL DEFAULT false,
    tags text[] NOT NULL DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp with time zone NOT NULL DEFAULT NOW()
);
```

```sql
-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_people_dob ON people(dob);
CREATE INDEX IF NOT EXISTS idx_people_anniversary ON people(anniversary_date);
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);
```

```sql
-- Create trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_people_updated ON people;
CREATE TRIGGER trg_people_updated BEFORE UPDATE ON people
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

```sql
-- Example INSERT for people table
INSERT INTO people (id, first_name, last_name, email, dob, anniversary_date, timezone, consent_email, tags)
VALUES ('11111111-1111-1111-1111-111111111111','Asha','K','asha@example.com','1998-05-21',NULL,'Asia/Kolkata',true, ARRAY['vip']);
```

## 2. templates

**Purpose**: Store reusable HTML templates for different occasions (birthday, anniversary, greeting, invitation) with age-based categorization.

```sql
-- Create custom types for template categorization
DO $$ BEGIN
    CREATE TYPE template_type AS ENUM ('birthday','anniversary','greeting','invitation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE age_group AS ENUM ('8_15','15_18','18_plus','na');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

```sql
-- Create templates table with type and age group constraints
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    type template_type NOT NULL,
    age_group age_group NOT NULL DEFAULT 'na',
    html text NOT NULL,
    preview_url text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp with time zone NOT NULL DEFAULT NOW()
);
```

```sql
-- Create indexes for template filtering
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_age_group ON templates(age_group);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
```

```sql
-- Create trigger for automatic updated_at timestamp
DROP TRIGGER IF EXISTS trg_templates_updated ON templates;
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

```sql
-- Example INSERT for templates table
INSERT INTO templates (id, name, type, age_group, html, preview_url, is_active)
VALUES ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1','Birthday Elegant 18+','birthday','18_plus','<html><body>Happy Birthday {first_name}!</body></html>','https://cdn/greetflow/t_bday18.png',true);
```

## 3. campaigns

**Purpose**: Manage bulk greeting/invitation campaigns with audience selection, scheduling, and template assignment.

```sql
-- Create additional custom types for campaigns
DO $$ BEGIN
    CREATE TYPE campaign_status AS ENUM ('draft','scheduled','sent','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE channel_type AS ENUM ('app','gmail','both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

```sql
-- Create campaigns table with foreign key to templates
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    type template_type NOT NULL,
    audience_query jsonb NOT NULL DEFAULT '{}',
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE RESTRICT,
    channel channel_type NOT NULL DEFAULT 'gmail',
    scheduled_at timestamp with time zone,
    status campaign_status NOT NULL DEFAULT 'draft',
    created_by UUID,
    created_at timestamp with time zone NOT NULL DEFAULT NOW()
);
```

```sql
-- Create indexes for campaign management
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_schedule ON campaigns(scheduled_at);
```

```sql
-- Example INSERT for campaigns table
INSERT INTO campaigns (id, title, type, audience_query, template_id, channel, scheduled_at, status)
VALUES ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1','Diwali 2025','greeting','{"tags":["vip"],"consent_email":true}','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3','gmail','2025-11-01T04:30:00Z','scheduled');
```

## 4. oauth_tokens

**Purpose**: Store encrypted Gmail OAuth 2.0 tokens for email delivery integration.

```sql
-- Create oauth_tokens table for Gmail integration
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider text NOT NULL DEFAULT 'google',
    account_email text NOT NULL,
    access_token_enc text NOT NULL,
    refresh_token_enc text NOT NULL,
    expiry timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT NOW()
);
```

```sql
-- Create unique constraint for provider-account combination
CREATE UNIQUE INDEX IF NOT EXISTS uk_oauth_account ON oauth_tokens(provider, account_email);
```

```sql
-- Example INSERT for oauth_tokens table
INSERT INTO oauth_tokens (id, provider, account_email, access_token_enc, refresh_token_enc, expiry)
VALUES ('ddddddd1-dddd-dddd-dddd-ddddddddddd1','google','sender@company.com','enc:access:xyz','enc:refresh:xyz','2025-12-01T10:00:00Z');
```

## 5. audit_logs

**Purpose**: Track all system actions for compliance and security auditing.

```sql
-- Create audit_logs table for compliance tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor UUID,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id UUID,
    meta jsonb NOT NULL DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT NOW()
);
```

```sql
-- Create indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
```

```sql
-- Example INSERT for audit_logs table
INSERT INTO audit_logs (id, actor, action, entity, entity_id, meta, created_at)
VALUES ('eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1',NULL,'create','campaign','bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1','{"by":"system","source":"seed"}',NOW());
```

## 6. sends

**Purpose**: Track individual email delivery attempts and results, linking people, templates, and campaigns.

```sql
-- Create additional custom type for send status
DO $$ BEGIN
    CREATE TYPE send_status AS ENUM ('queued','sent','failed','skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

```sql
-- Create sends table with foreign keys to people, templates, and campaigns
CREATE TABLE IF NOT EXISTS sends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE RESTRICT,
    scheduled_for timestamp with time zone,
    sent_at timestamp with time zone,
    status send_status NOT NULL DEFAULT 'queued',
    error_msg text,
    channel channel_type NOT NULL DEFAULT 'gmail',
    metadata jsonb NOT NULL DEFAULT '{}'
);
```

```sql
-- Create indexes for send processing and reporting
CREATE INDEX IF NOT EXISTS idx_sends_status_scheduled ON sends(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_sends_campaign ON sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sends_person ON sends(person_id);
```

```sql
-- Example INSERT for sends table
INSERT INTO sends (id, campaign_id, person_id, template_id, scheduled_for, sent_at, status, error_msg, channel, metadata)
VALUES ('ccccccc1-cccc-cccc-cccc-ccccccccccc1','bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3','2025-11-01T04:30:00Z','2025-11-01T04:31:02Z','sent',NULL,'gmail','{}');
```

## Deployment Notes

- Execute blocks in the numbered order (1-6) to respect foreign key dependencies
- All tables use UUID primary keys with `uuid_generate_v4()` for Supabase compatibility
- Timestamps use `timestamp with time zone` for proper timezone handling
- Text fields use `text` type instead of `varchar` for better Supabase compatibility
- All constraints and indexes use `IF NOT EXISTS` for safe re-execution
