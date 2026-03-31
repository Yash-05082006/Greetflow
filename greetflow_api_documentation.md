# Greetflow API Documentation

## Overview

Greetflow provides REST APIs to manage people (leads/clients/users), message templates, campaigns, automated scheduling, and email delivery via Gmail (SMTP/API). The API is designed to support automation of personalized birthday/anniversary greetings, festival messages, and invitations at scale.

## Base URL
```
https://api.greetflow.app/api/v1
```

## Authentication

- Application authentication: JWT Bearer tokens (issued by the parent Beamwelly app or Greetflow auth). Include in the `Authorization` header.
- Gmail delivery: OAuth 2.0 tokens with the minimal scope `https://www.googleapis.com/auth/gmail.send` stored server-side (encrypted).

Example header:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Pagination

- Query params: `page` (default 1), `limit` (default 20, max 100)
- Response envelope includes `pagination`: `{ currentPage, totalPages, totalItems, itemsPerPage }`

## Rate Limits

- Default: 60 requests/min per API key/user
- Sensitive endpoints (`/sends`, `/campaigns/*/send`, `/oauth/gmail/*`): 10 requests/min
- 429 returned when exceeded; include `Retry-After` seconds

## Error Codes

- 400 VALIDATION_ERROR — Invalid input
- 401 UNAUTHORIZED — Missing/invalid JWT
- 403 FORBIDDEN — Insufficient permissions/consent not granted
- 404 NOT_FOUND — Resource not found
- 409 CONFLICT — Duplicate or state conflict
- 422 BUSINESS_RULE_VIOLATION — e.g., consent disabled
- 429 RATE_LIMITED — Too many requests
- 500 INTERNAL_ERROR — Unexpected server error

Error response example:
```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "email is required" },
  "traceId": "b9a2f1c6-..."
}
```

## Webhooks (Optional)

- `POST https://yourapp.com/webhooks/greetflow/sends` — Delivery status updates (queued, sent, failed, skipped)
- Retries: exponential backoff up to 5 attempts; sign with `X-Greetflow-Signature`

Payload example:
```json
{
  "id": "send_01HZX...",
  "status": "sent",
  "personId": "a8c2...",
  "campaignId": "c9d3...",
  "templateId": "t1...",
  "sentAt": "2025-10-22T05:12:33Z",
  "metadata": {}
}
```

## Resources and Endpoints

### People

List/search people
```
GET /people?query=&tags=&page=&limit=
```
Response:
```json
{
  "success": true,
  "data": [
    {"id":"a1", "first_name":"Asha", "last_name":"K", "email":"asha@example.com", "dob":"1998-05-21", "anniversary_date":null, "timezone":"Asia/Kolkata", "consent_email":true, "tags":["vip"]}
  ],
  "pagination": {"currentPage":1, "totalPages":10, "totalItems":100, "itemsPerPage":10}
}
```

Create person
```
POST /people
```
Request:
```json
{
  "first_name": "Asha",
  "last_name": "K",
  "email": "asha@example.com",
  "dob": "1998-05-21",
  "anniversary_date": null,
  "timezone": "Asia/Kolkata",
  "consent_email": true,
  "tags": ["vip", "north"]
}
```
Response:
```json
{ "success": true, "data": { "id": "a1" } }
```

Get person
```
GET /people/{id}
```

Update person
```
PUT /people/{id}
```

Delete person (cascades scheduled sends)
```
DELETE /people/{id}
```

Upcoming birthdays/anniversaries (next 30 days)
```
GET /people/upcoming?type=birthday|anniversary&days=30
```

### Templates

List templates
```
GET /templates?type=birthday|anniversary|greeting|invitation&age_group=8_15|15_18|18_plus|na&page=&limit=
```

Create template
```
POST /templates
```
Request:
```json
{
  "name": "Birthday Elegant 18+",
  "type": "birthday",
  "age_group": "18_plus",
  "html": "<html>...</html>",
  "preview_url": "https://.../bday18.png",
  "is_active": true
}
```

Update template
```
PUT /templates/{id}
```

Preview with sample data
```
GET /templates/{id}/preview?personId={personId}
```
Response:
```json
{ "success": true, "data": { "rendered_html": "<html>...Asha...</html>" } }
```

### Campaigns

List campaigns
```
GET /campaigns?status=draft|scheduled|sent|cancelled&page=&limit=
```

Create campaign
```
POST /campaigns
```
Request:
```json
{
  "title": "Diwali 2025",
  "type": "greeting",
  "template_id": "t1",
  "channel": "gmail",
  "scheduled_at": "2025-11-01T10:00:00+05:30",
  "audience_query": {"tags": ["vip"], "consent_email": true}
}
```
Response:
```json
{ "success": true, "data": { "id": "c1", "status": "scheduled" } }
```

Get campaign
```
GET /campaigns/{id}
```

Update campaign
```
PUT /campaigns/{id}
```

Cancel campaign
```
DELETE /campaigns/{id}
```

Trigger immediate send
```
POST /campaigns/{id}/send
```

### Sends and Logs

List sends/logs
```
GET /sends?status=queued|sent|failed|skipped&campaignId=&personId=&page=&limit=
```
Response:
```json
{
  "success": true,
  "data": [
    {"id":"s1","campaign_id":"c1","person_id":"a1","template_id":"t1","scheduled_for":"2025-11-01T04:30:00Z","sent_at":"2025-11-01T04:31:02Z","status":"sent","channel":"gmail","error_msg":null}
  ],
  "pagination": {"currentPage":1, "totalPages":5, "totalItems":50, "itemsPerPage":10}
}
```

Retry failed sends
```
POST /sends/retry
```
Request:
```json
{ "sendIds": ["s2", "s3"] }
```

### Scheduler

Trigger daily sweep (admin-only)
```
POST /scheduler/daily
```
Request:
```json
{ "runAt": "2025-10-22T00:05:00+05:30", "timezone": "Asia/Kolkata" }
```

### Analytics

Summary metrics
```
GET /analytics/summary?from=2025-10-01&to=2025-10-31
```
Response:
```json
{
  "success": true,
  "data": {"sent": 1240, "failed": 12, "suppressed": 34, "byChannel": {"gmail": 1200, "app": 40}}
}
```

### OAuth (Gmail)

Connect Gmail (begin OAuth)
```
POST /oauth/gmail/connect
```
Response:
```json
{ "success": true, "data": { "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..." } }
```

Integration status
```
GET /oauth/gmail/status
```
Response:
```json
{ "success": true, "data": { "connected": true, "account_email": "sender@company.com", "expiresAt": "2025-12-01T10:00:00Z" } }
```

## Request/Response Envelope

All responses follow:
```json
{ "success": true, "data": { /* resource */ }, "pagination": { /* optional */ } }
```

## Example curl Requests

List people
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.greetflow.app/api/v1/people?page=1&limit=20"
```

Create campaign
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "title":"Diwali 2025","type":"greeting","template_id":"t1","channel":"gmail",
    "scheduled_at":"2025-11-01T10:00:00+05:30","audience_query":{"tags":["vip"],"consent_email":true}
  }' \
  https://api.greetflow.app/api/v1/campaigns
```

Retry failed sends
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"sendIds":["s2","s3"]}' \
  https://api.greetflow.app/api/v1/sends/retry
```

## Notes

- Consent enforcement: emails are only sent if `consent_email = true`.
- Timezone handling: scheduler runs per person timezone; admin can batch in IST.
- Templates must render responsive HTML compatible with Gmail.


