# Greetflow API Implementation Progress

This document tracks the implementation, testing, and status of each API endpoint for the Greetflow backend.

---

## 📧 EMAIL AUTOMATION APIS (NEW)

### Endpoint: POST /api/send-email
- **File**: `backend/routes/emailRoutes.js`, `backend/utils/emailService.js`
- **Purpose**: Send personalized emails via Gmail SMTP
- **cURL Command**:
  ```bash
  curl -X POST http://localhost:4000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "name": "Riya",
    "subject": "Test Personalized Email",
    "htmlTemplate": "<p>Dear [Recipient Name],</p><p>This is a test email from Greetflow.</p>",
    "text": "Optional plain text version",
    "attachments": []
  }'
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Email sent successfully",
    "messageId": "<bd5f294e-5f9f-b05b-69f5-000927cd9b63@gmail.com>"
  }
  ```
- **Error Response**:
  ```json
  {
    "success": false,
    "message": "Missing required fields: to, subject, and htmlTemplate are required"
  }
  ```
- **Status**: ✅ **IMPLEMENTED & TESTED**
- **Notes**: 
  - Gmail SMTP credentials verified and working
  - Personalization feature working ([Recipient Name] → actual name)
  - Rate limiting applied (10 requests/minute for sensitive operations)
  - Automatic email logging integration

### Endpoint: GET /api/email-health
- **File**: `backend/routes/emailRoutes.js`
- **Purpose**: Check SMTP connection health
- **cURL Command**:
  ```bash
  curl -X GET http://localhost:4000/api/email-health
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "status": "healthy",
    "message": "SMTP connection verified",
    "timestamp": "2025-11-06T05:36:36.011Z"
  }
  ```
- **Status**: ✅ **IMPLEMENTED & TESTED**

### Endpoint: POST /api/email-logs
- **File**: `backend/routes/emailRoutes.js`, `backend/utils/emailLogger.js`
- **Purpose**: Manually log email attempts (for testing/external integrations)
- **cURL Command**:
  ```bash
  curl -X POST http://localhost:4000/api/email-logs \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "test@example.com",
    "subject": "Test Email",
    "status": "SENT",
    "messageId": "test-message-id"
  }'
  ```
- **Status**: ✅ **IMPLEMENTED** (requires email_logs table in Supabase)

### Endpoint: GET /api/email-logs
- **File**: `backend/routes/emailRoutes.js`
- **Purpose**: Retrieve email logs with filtering
- **cURL Command**:
  ```bash
  curl -X GET "http://localhost:4000/api/email-logs?limit=10&status=SENT"
  ```
- **Status**: ✅ **IMPLEMENTED** (requires email_logs table in Supabase)

### Endpoint: GET /api/email-stats
- **File**: `backend/routes/emailRoutes.js`
- **Purpose**: Get email sending statistics
- **cURL Command**:
  ```bash
  curl -X GET http://localhost:4000/api/email-stats
  ```
- **Status**: ✅ **IMPLEMENTED** (requires email_logs table in Supabase)

### 🗄️ Database Requirements
- **Table**: `email_logs` needs to be created in Supabase
- **SQL File**: `create_email_logs_table_manual.sql` (execute in Supabase SQL Editor)
- **Status**: ⚠️ **PENDING** - Manual table creation required

---

### Endpoint: POST /api/people
- **File**: `server/src/routes/peopleRoutes.js`
- **cURL Command**:
  ```bash
  curl -X POST http://localhost:3000/api/people -H "Content-Type: application/json" -d '{"first_name": "Yash", "last_name": "Badgujar", "email": "yash.b@example.com", "dob": "1995-08-15", "consent_email": true, "tags": ["developer", "test"]}'
  ```
- **Output**: Success 
- **Notes**: Implemented the create person endpoint. Added basic validation for `first_name` and `email`. Included specific error handling for duplicate email addresses (HTTP 409 Conflict). The endpoint correctly returns the newly created person object on success.

---

### Endpoint: GET /health (Port 4000)
- **File**: `backend/server.js`
- **cURL Command**:
  ```bash
  curl http://localhost:4000/health
  ```
- **Output**: Success  (status: OK)
- **Notes**: Server reachable on port 4000. Returns version and timestamp.

### Endpoint: GET /api/people (List, Port 4000)
- **File**: `backend/routes/people.js`
- **cURL Command**:
  ```bash
  curl "http://localhost:4000/api/people?page=1&limit=5"
  ```
- **Output**: Success  (pagination present)
- **Notes**: Endpoint reachable.

---

### Endpoint: POST /api/people (Create, Port 4000)
- **File**: `backend/routes/people.js`
- **cURL Command**:
  ```bash
  curl -X POST http://localhost:4000/api/people \
    -H "Content-Type: application/json" \
    -d '{"first_name":"Yash","last_name":"Tester","email":"yash.<random>@example.com","consent_email":true,"tags":["developer","test"]}'
  ```
- **Output**: Success (201, returns created person with id)
- **Notes**: Validates input; handles duplicate email with 409.

### Endpoint: GET /api/people/:id (Port 4000)
- **File**: `backend/routes/people.js`
- **cURL Command**:
  ```bash
  curl http://localhost:4000/api/people/{id}
  ```
- **Output**: Success (200, returns person with nested sends [])
- **Notes**: Fixed earlier error by removing nonexistent `templates.type` from nested select.

### Endpoint: PUT /api/people/:id (Port 4000)
- **File**: `backend/routes/people.js`
- **cURL Command**:
  ```bash
  curl -X PUT http://localhost:4000/api/people/{id} \
    -H "Content-Type: application/json" \
    -d '{"first_name":"Updated","last_name":"Tester","email":"yash.<same>@example.com","consent_email":true,"tags":["developer","test"]}'
  ```
- **Output**: Success (200, returns updated person)
- **Notes**: Updated `first_name` verified.

### Endpoint: GET /api/people/upcoming (Port 4000)
- **File**: `backend/routes/people.js`
- **cURL Command**:
  ```bash
  curl "http://localhost:4000/api/people/upcoming?days=30&type=birthday"
  ```
- **Output**: Success (200, count: 0)
- **Notes**: Fixed route conflict by moving `/upcoming` above `/:id` to avoid UUID parsing error.

### Endpoint: DELETE /api/people/:id (Port 4000)
- **File**: `backend/routes/people.js`
- **cURL Command**:
  ```bash
  curl -X DELETE http://localhost:4000/api/people/{id}
  ```
- **Output**: Success (200, "Person deleted successfully")
- **Notes**: Verified deletion of created record.

---

## Templates API (Phase 2)

### Endpoint: GET /api/templates (List, Port 4000)
- **File**: `backend/routes/templates.js`
- **cURL Command**:
  ```bash
  curl "http://localhost:4000/api/templates?type=birthday&age_group=18_plus"
  ```
- **Output**: Pending (to be captured after server reload)
- **Notes**: Filters map to DB as `category=type`, `age_group` unchanged.

### Endpoint: POST /api/templates (Create, Port 4000)
- **File**: `backend/routes/templates.js`
- **cURL Command**:
  ```bash
  curl -X POST http://localhost:4000/api/templates \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Template","type":"birthday","age_group":"18_plus","html":"<div>Hello [Name]! [Message]</div>"}'
  ```
- **Output**: Pending (expected 201 with created template id)
- **Notes**: API fields mapped to DB columns: `type->category`, `html->content`.

### Endpoint: GET /api/templates/{id} (Port 4000)
- **File**: `backend/routes/templates.js`
- **cURL Command**:
  ```bash
  curl http://localhost:4000/api/templates/{template_id}
  ```
- **Output**: Pending (expected 200 with template record)

### Endpoint: PUT /api/templates/{id} (Port 4000)
- **File**: `backend/routes/templates.js`
- **cURL Command**:
  ```bash
  curl -X PUT http://localhost:4000/api/templates/{template_id} \
    -H "Content-Type: application/json" \
    -d '{"name":"Updated Template","type":"birthday","age_group":"18_plus","html":"<div>Hi [Name]! [Message]</div>"}'
  ```
- **Output**: Pending (expected 200 with updated fields)

### Endpoint: GET /api/templates/{id}/preview (Port 4000)
- **File**: `backend/routes/templates.js`
- **cURL Command**:
  ```bash
  curl "http://localhost:4000/api/templates/{template_id}/preview"
  ```
- **Output**: Pending (expected 200 with `html` after placeholder substitution)

### Endpoint: DELETE /api/templates/{id} (Port 4000)
- **File**: `backend/routes/templates.js`
- **cURL Command**:
  ```bash
  curl -X DELETE http://localhost:4000/api/templates/{template_id}
  ```
- **Output**: Pending (expected 200, "Template deleted successfully")

### Notes for Phase 2
- Implemented templates routes and mounted at `/api/templates`.
- Mapped API fields to DB schema: `type -> category`, `html -> content`.
- Next step: restart backend and execute tests to replace "Pending" with real outputs.

---

## Campaigns API (Phase 3)

### Endpoint: POST /api/campaigns (Create, Port 4000)
- **File**: `backend/routes/campaigns.js`
- **cURL Command**:
  ```bash
  # First, ensure you have a template_id from the templates table
  curl -X POST http://localhost:4000/api/campaigns \
    -H "Content-Type: application/json" \
    -d '{"title":"Q4 Birthday Greetings","type":"birthday","template_id":"{valid_template_id}","audience_query":{"tags":["vip"]},"scheduled_at":"2025-10-01T10:00:00Z"}'
  ```
- **Output**: Success (201, returns created campaign with id and `scheduled` status)
- **Notes**: Endpoint validates that `template_id` exists. Correctly sets status to `scheduled` if `scheduled_at` is provided, otherwise `draft`.

### Endpoint: GET /api/campaigns (List, Port 4000)
- **File**: `backend/routes/campaigns.js`
- **cURL Command**:
  ```bash
  curl "http://localhost:4000/api/campaigns?status=scheduled&page=1&limit=5"
  ```
- **Output**: Success (200, returns list of campaigns with pagination)
- **Notes**: Successfully filters by status. Response includes nested template info.

### Endpoint: GET /api/campaigns/:id (Port 4000)
- **File**: `backend/routes/campaigns.js`
- **cURL Command**:
  ```bash
  curl http://localhost:4000/api/campaigns/{campaign_id}
  ```
- **Output**: Success (200, returns single campaign object)
- **Notes**: Correctly fetches a single campaign by its ID.

### Endpoint: PUT /api/campaigns/:id (Update, Port 4000)
- **File**: `backend/routes/campaigns.js`
- **cURL Command**:
  ```bash
  curl -X PUT http://localhost:4000/api/campaigns/{campaign_id} \
    -H "Content-Type: application/json" \
    -d '{"title":"Updated Q4 Birthday Greetings"}'
  ```
- **Output**: Success (200, returns updated campaign object)
- **Notes**: Verified that the campaign title was updated. Added logic to prevent updates to `sent` or `cancelled` campaigns.

### Endpoint: DELETE /api/campaigns/:id (Cancel, Port 4000)
- **File**: `backend/routes/campaigns.js`
- **cURL Command**:
  ```bash
  curl -X DELETE http://localhost:4000/api/campaigns/{campaign_id}
  ```
- **Output**: Success (200, "Campaign cancelled successfully")
- **Notes**: This is a soft delete. The endpoint correctly updates the campaign's status to `cancelled`.

### Endpoint: POST /api/campaigns/:id/send (Trigger Send, Port 4000)
- **File**: `backend/routes/campaigns.js`
- **cURL Command**:
  ```bash
  # Use this on a campaign in 'draft' status
  curl -X POST http://localhost:4000/api/campaigns/{draft_campaign_id}/send
  ```
- **Output**: Success (200, "Campaign send triggered successfully.")
- **Notes**: This endpoint simulates triggering an immediate send by updating the campaign status to `sent`. The actual logic for querying the audience and creating `sends` records would be handled by a background worker.

### Notes for Phase 3
- Implemented all campaign routes and mounted them at `/api/campaigns`.
- Added validation for `template_id` existence during campaign creation.
- Implemented business logic to prevent modification of completed or cancelled campaigns.
- Next step is to implement the `sends` and `logs` API for tracking individual email deliveries.

---

## Sends API (Phase 4)

### Endpoint: GET /api/sends (List, Port 4000)
- **File**: `backend/routes/sends.js`
- **cURL Command**:
  ```bash
  # Get all sends with 'failed' status
  curl "http://localhost:4000/api/sends?status=failed&limit=5"
  ```
- **Output**: Success (200, returns a list of send records with pagination)
- **Notes**: The endpoint correctly joins data from `people`, `templates`, and `campaigns` to provide a comprehensive view of each send. Filtering by `status`, `campaign_id`, and `person_id` is functional.

### Endpoint: POST /api/sends/retry (Port 4000)
- **File**: `backend/routes/sends.js`
- **cURL Command**:
  ```bash
  # First, get the ID of a failed send from the GET /api/sends endpoint
  # Example failed send ID: "ccccccc2-cccc-cccc-cccc-ccccccccccc2" from seed data
  curl -X POST http://localhost:4000/api/sends/retry \
    -H "Content-Type: application/json" \
    -d '{"send_ids": ["{failed_send_id}"]}'
  ```
- **Output**: Success (200, "1 failed sends have been re-queued for delivery.")
- **Notes**: The endpoint correctly validates the input and only updates records that are in a `failed` state. The status of the specified send is updated to `queued`, and its `error_msg` is cleared.

### Notes for Phase 4
- Implemented the `sends` routes and mounted them at `/api/sends`.
- The list endpoint provides rich, joined data for a clear overview of delivery status.
- The retry endpoint includes logic to only re-queue sends that have actually failed.
- Next step is to implement the analytics and reporting endpoints.

---

## Sends API (Phase 4)

### Endpoint: GET /api/sends (List, Port 4000)
- **File**: `backend/routes/sends.js`
- **cURL Command**:
  ```bash
  # Get all sends with 'failed' status
  curl "http://localhost:4000/api/sends?status=failed&limit=5"
  ```
- **Output**: Success (200, returns a list of send records with pagination)
- **Notes**: The endpoint correctly joins data from `people`, `templates`, and `campaigns` to provide a comprehensive view of each send. Filtering by `status`, `campaign_id`, and `person_id` is functional.

### Endpoint: POST /api/sends/retry (Port 4000)
- **File**: `backend/routes/sends.js`
- **cURL Command**:
  ```bash
  # First, get the ID of a failed send from the GET /api/sends endpoint
  # Example failed send ID: "ccccccc2-cccc-cccc-cccc-ccccccccccc2" from seed data
  curl -X POST http://localhost:4000/api/sends/retry \
    -H "Content-Type: application/json" \
    -d '{"send_ids": ["{failed_send_id}"]}'
  ```
- **Output**: Success (200, "1 failed sends have been re-queued for delivery.")
- **Notes**: The endpoint correctly validates the input and only updates records that are in a `failed` state. The status of the specified send is updated to `queued`, and its `error_msg` is cleared.

### Notes for Phase 4
- Implemented the `sends` routes and mounted them at `/api/sends`.
- The list endpoint provides rich, joined data for a clear overview of delivery status.
- The retry endpoint includes logic to only re-queue sends that have actually failed.
- Next step is to implement the analytics and reporting endpoints.

---

## Analytics and OAuth API (Phase 5)

### Endpoint: GET /api/analytics/summary (Port 4000)
- **File**: `backend/routes/analytics.js`
- **cURL Command**:
  ```bash
  # Get summary for the last 30 days (default)
  curl "http://localhost:4000/api/analytics/summary"
  
  # Get summary for a specific date range
  curl "http://localhost:4000/api/analytics/summary?from=2025-01-01&to=2025-12-31"
  ```
- **Output**: Success (200, returns an object with counts for sent, failed, skipped, and queued sends)
- **Notes**: Implemented logic to query the `sends` table and aggregate counts by status within a specified or default date range.

### Endpoint: POST /api/oauth/gmail/connect (Port 4000)
- **File**: `backend/routes/oauth.js`
- **cURL Command**:
  ```bash
  curl -X POST http://localhost:4000/api/oauth/gmail/connect
  ```
- **Output**: Success (200, returns a simulated Google OAuth authorization URL)
- **Notes**: This is a stub endpoint. It returns a placeholder URL. In a real application, it would use the `googleapis` library to generate a valid URL for the user to start the authorization flow.

### Endpoint: GET /api/oauth/gmail/status (Port 4000)
- **File**: `backend/routes/oauth.js`
- **cURL Command**:
  ```bash
  curl http://localhost:4000/api/oauth/gmail/status
  ```
- **Output**: Success (200, returns `{ "connected": true/false, ... }` based on token presence and validity in the `oauth_tokens` table)
- **Notes**: This endpoint checks the `oauth_tokens` table for a recent, non-expired token to determine if the Gmail integration is active.

### Endpoint: POST /api/scheduler/daily (Port 4000)
- **File**: `backend/routes/scheduler.js`
- **cURL Command**:
  ```bash
  # In a real app, this would be protected and likely triggered by a cron job.
  curl -X POST http://localhost:4000/api/scheduler/daily
  ```
- **Output**: Success (200, with a message indicating how many greetings were queued)
- **Notes**: This endpoint simulates a daily cron job. It queries the `people` table for users whose birthday or anniversary is today, and creates corresponding records in the `sends` table with a `queued` status.

### Notes for Phase 5
- Implemented the `analytics`, `oauth`, and `scheduler` routes.
- The analytics endpoint provides a basic summary of send statuses.
- The OAuth endpoints simulate the connection flow for Gmail integration.
- The scheduler endpoint provides a way to manually trigger the daily job that queues birthday/anniversary greetings.
- Next step would be to implement the actual background worker logic to process the `sends` queue and integrate with the Gmail API using the stored OAuth tokens.