# Greetflow Requirements

## Functional Requirements

1. **User Management**
   - Manage client/user profiles with personal details (name, email, DOB, anniversary date, timezone, consent flags)
   - Support role-based access (Marketing/CRM Ops, Viewer) with different permission levels
   - Handle consent management and opt-out functionality for DPDP Act compliance

2. **Template Management**
   - Create and manage age-based birthday templates (8-15, 15-18, 18+ years) with different themes
   - Manage anniversary templates (romantic, simple, professional styles)
   - Store greeting card templates for festivals/occasions (Diwali, Holi, Eid, Christmas, New Year)
   - Manage invitation card templates for company events (Product launch, Webinar, Townhall, Networking, Workshop)
   - Support template preview and variable personalization

3. **Campaign Management**
   - Create greeting and invitation campaigns with audience selection, send time, and template assignment
   - Support bulk sending with audience filtering by lists, age group, and status
   - Schedule campaigns for specific dates and times
   - Handle campaign status tracking (draft, scheduled, sent, cancelled)

4. **Automated Scheduling**
   - Daily scheduler to automatically create send jobs for birthdays and anniversaries
   - Timezone-aware scheduling with batch processing in IST
   - Retry mechanism with exponential backoff for failed sends
   - Support for both one-time and recurring campaigns

5. **Email Integration**
   - Gmail SMTP integration with OAuth 2.0 authentication
   - Support for in-app notifications and Gmail delivery
   - Email template rendering with personalization variables
   - Delivery status tracking (queued, sent, failed, opened)

6. **Personalization Engine**
   - Variable substitution for {first_name}, {full_name}, {company_name}, {event_date}, {event_title}
   - Age-based template selection and content adaptation
   - Timezone-aware scheduling and delivery

7. **Analytics and Reporting**
   - Track delivery logs with status, error reasons, and retry attempts
   - Generate reports on sent, failed, and suppressed emails
   - Monitor campaign performance and engagement metrics
   - Admin dashboard with comprehensive analytics

8. **Consent and Compliance**
   - DPDP Act compliance with consent management
   - Opt-out functionality and suppression handling
   - Data retention and deletion policies
   - Audit logging for all actions and data access

## Non-Functional Requirements

- **Performance**: Support for bulk email sending with rate limiting and queue management
- **Security**: OAuth 2.0 with minimal Gmail scopes, encrypted token storage, input validation, and rate limiting
- **Reliability**: Retry mechanisms, error handling, and graceful failure recovery
- **Scalability**: Celery-based task queue for handling large volumes of automated sends
- **Maintainability**: Clean API design, comprehensive logging, and modular architecture
- **Usability**: Responsive UI, accessibility compliance, and intuitive user experience

## External Integrations

- **Gmail API**: OAuth 2.0 integration for email sending with minimal scopes (gmail.send only)
- **Supabase**: PostgreSQL database hosting and management
- **Redis**: Message broker for Celery task queue
- **Beamwelly Application**: Integration point for UI button and authentication
- **OAuth Providers**: Google OAuth for Gmail API access
- **Timezone Services**: Timezone-aware scheduling and delivery

## API-Level Actions

- `GET /people` - Retrieve client/user list with filtering and pagination
- `POST /people` - Create new client/user profile
- `PUT /people/{id}` - Update client/user information
- `DELETE /people/{id}` - Remove client/user and cascade delete scheduled sends
- `GET /templates` - List available templates with filtering by type and age group
- `POST /templates` - Create new template
- `PUT /templates/{id}` - Update template content and metadata
- `GET /templates/{id}/preview` - Preview template with sample data
- `POST /campaigns` - Create new greeting/invitation campaign
- `GET /campaigns` - List campaigns with status filtering
- `PUT /campaigns/{id}` - Update campaign details and scheduling
- `POST /campaigns/{id}/send` - Trigger immediate campaign send
- `DELETE /campaigns/{id}` - Cancel scheduled campaign
- `GET /sends` - Retrieve delivery logs with status and error information
- `POST /sends/retry` - Retry failed email sends
- `GET /analytics/summary` - Generate delivery and engagement reports
- `POST /oauth/gmail/connect` - Connect Gmail account via OAuth
- `GET /oauth/gmail/status` - Check Gmail integration status
- `POST /scheduler/daily` - Trigger daily birthday/anniversary sweep
- `GET /upcoming` - List upcoming birthdays/anniversaries in next 30 days

## Entities and Relationships

### Core Entities

**Person**
- Attributes: id, first_name, last_name, email, dob, anniversary_date, timezone, consent_email, tags, created_at, updated_at
- Relationships: One-to-many with Sends, Campaigns

**Template**
- Attributes: id, name, type (birthday|anniversary|greeting|invitation), age_group (8_15|15_18|18_plus|na), html, preview_url, is_active, created_at, updated_at
- Relationships: One-to-many with Campaigns, Sends

**Campaign**
- Attributes: id, title, type, audience_query (JSON), template_id, channel (app|gmail|both), scheduled_at, status (draft|scheduled|sent|cancelled), created_by, created_at
- Relationships: Many-to-one with Template, One-to-many with Sends

**Send**
- Attributes: id, campaign_id, person_id, template_id, scheduled_for, sent_at, status (queued|sent|failed|skipped), error_msg, channel
- Relationships: Many-to-one with Campaign, Person, Template

**OAuth_Token**
- Attributes: id, provider (google), account_email, access_token_enc, refresh_token_enc, expiry
- Relationships: Independent entity for Gmail integration

**Audit_Log**
- Attributes: id, actor, action, entity, entity_id, meta (JSONB), created_at
- Relationships: Independent entity for compliance tracking

### Key Relationships

- Each Person can have multiple Sends (birthday, anniversary, campaign-based)
- Each Template can be used in multiple Campaigns and Sends
- Each Campaign can target multiple People through Sends
- Each Send belongs to one Person, one Template, and optionally one Campaign
- OAuth tokens are independent but required for Gmail integration
- Audit logs track all entity modifications for compliance
