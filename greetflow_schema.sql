-- greetflow_schema.sql

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Types (create safely)
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

-- Tables (ordered by dependencies)

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

-- CAMPAIGNS (references templates)
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

-- OAUTH TOKENS (independent)
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL DEFAULT 'google',
    account_email VARCHAR(255) NOT NULL,
    access_token_enc TEXT NOT NULL,
    refresh_token_enc TEXT NOT NULL,
    expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- AUDIT LOGS (independent)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor UUID,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id UUID,
    meta JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- SENDS (references campaigns, people, templates)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_people_dob ON people(dob);
CREATE INDEX IF NOT EXISTS idx_people_anniversary ON people(anniversary_date);
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);

CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(template_type);
CREATE INDEX IF NOT EXISTS idx_templates_age_group ON templates(age_group);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_schedule ON campaigns(scheduled_at);

CREATE UNIQUE INDEX IF NOT EXISTS uk_oauth_account ON oauth_tokens(provider, account_email);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_sends_status_scheduled ON sends(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_sends_campaign ON sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sends_person ON sends(person_id);

-- Triggers & Functions
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
