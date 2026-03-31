# Greetflow API Implementation Plan

## High-Level Goals and Scope

**Goal**: Implement a complete REST API for Greetflow that manages people, templates, campaigns, and automated email delivery via Gmail integration.

**Scope**: 
- Full CRUD operations for all core entities (people, templates, campaigns, sends)
- Automated scheduling and email delivery
- Gmail OAuth integration for email sending
- Analytics and reporting capabilities
- Rate limiting and security features
- Comprehensive error handling and validation

**Technology Stack**:
- Node.js + Express.js backend
- Supabase (PostgreSQL) database
- @supabase/supabase-js client
- JWT authentication (future)
- Gmail API integration

## API Endpoints by Priority and Dependencies

### Phase 1: Core Foundation (Independent)

#### 1. Health Check
- **Method & Path**: `GET /health`
- **Purpose**: Verify server is running and database is accessible
- **DB Tables**: None (connection test only)
- **Auth Mode**: None
- **Error Cases**: 500 if database connection fails
- **Curl Test**: `curl http://localhost:3000/health`

#### 2. People Management (Core Entity)
- **Method & Path**: `GET /api/people`
- **Purpose**: List all people with pagination and filtering
- **DB Tables**: `people` (all fields)
- **Auth Mode**: Anon (for now)
- **Error Cases**: 500 database error, 400 invalid pagination
- **Curl Test**: `curl "http://localhost:3000/api/people?page=1&limit=20"`

- **Method & Path**: `POST /api/people`
- **Purpose**: Create new person with validation
- **DB Tables**: `people` (insert)
- **Auth Mode**: Anon
- **Error Cases**: 400 validation error, 409 duplicate email
- **Curl Test**: `curl -X POST http://localhost:3000/api/people -H "Content-Type: application/json" -d '{"first_name":"Test","email":"test@example.com","consent_email":true}'`

- **Method & Path**: `GET /api/people/:id`
- **Purpose**: Get specific person by ID
- **DB Tables**: `people` (select by id)
- **Auth Mode**: Anon
- **Error Cases**: 404 not found
- **Curl Test**: `curl http://localhost:3000/api/people/{person_id}`

- **Method & Path**: `PUT /api/people/:id`
- **Purpose**: Update person information
- **DB Tables**: `people` (update)
- **Auth Mode**: Anon
- **Error Cases**: 404 not found, 400 validation error, 409 duplicate email
- **Curl Test**: `curl -X PUT http://localhost:3000/api/people/{person_id} -H "Content-Type: application/json" -d '{"first_name":"Updated"}'`

- **Method & Path**: `DELETE /api/people/:id`
- **Purpose**: Delete person (cascades to sends)
- **DB Tables**: `people` (delete), `sends` (cascade delete)
- **Auth Mode**: Anon
- **Error Cases**: 404 not found
- **Curl Test**: `curl -X DELETE http://localhost:3000/api/people/{person_id}`

- **Method & Path**: `GET /api/people/upcoming`
- **Purpose**: Get upcoming birthdays/anniversaries
- **DB Tables**: `people` (filter by dob/anniversary_date)
- **Auth Mode**: Anon
- **Error Cases**: 500 database error
- **Curl Test**: `curl "http://localhost:3000/api/people/upcoming?days=30&type=birthday"`

### Phase 2: Templates (Independent)

#### 3. Template Management
- **Method & Path**: `GET /api/templates`
- **Purpose**: List templates with filtering by type and age group
- **DB Tables**: `templates` (all fields)
- **Auth Mode**: Anon
- **Error Cases**: 500 database error
- **Curl Test**: `curl "http://localhost:3000/api/templates?type=birthday&age_group=18_plus"`

- **Method & Path**: `POST /api/templates`
- **Purpose**: Create new template
- **DB Tables**: `templates` (insert)
- **Auth Mode**: Anon
- **Error Cases**: 400 validation error
- **Curl Test**: `curl -X POST http://localhost:3000/api/templates -H "Content-Type: application/json" -d '{"name":"Test Template","type":"birthday","html":"<html>Test</html>"}'`

- **Method & Path**: `GET /api/templates/:id`
- **Purpose**: Get specific template
- **DB Tables**: `templates` (select by id)
- **Auth Mode**: Anon
- **Error Cases**: 404 not found
- **Curl Test**: `curl http://localhost:3000/api/templates/{template_id}`

- **Method & Path**: `PUT /api/templates/:id`
- **Purpose**: Update template
- **DB Tables**: `templates` (update)
- **Auth Mode**: Anon
- **Error Cases**: 404 not found, 400 validation error
- **Curl Test**: `curl -X PUT http://localhost:3000/api/templates/{template_id} -H "Content-Type: application/json" -d '{"name":"Updated Template"}'`

- **Method & Path**: `DELETE /api/templates/:id`
- **Purpose**: Delete template
- **DB Tables**: `templates` (delete)
- **Auth Mode**: Anon
- **Error Cases**: 404 not found, 409 if referenced by campaigns
- **Curl Test**: `curl -X DELETE http://localhost:3000/api/templates/{template_id}`

- **Method & Path**: `GET /api/templates/:id/preview`
- **Purpose**: Preview template with sample data
- **DB Tables**: `templates`, `people` (for sample data)
- **Auth Mode**: Anon
- **Error Cases**: 404 template not found, 400 invalid person_id
- **Curl Test**: `curl "http://localhost:3000/api/templates/{template_id}/preview?personId={person_id}"`

### Phase 3: Campaigns (Depends on Templates)

#### 4. Campaign Management
- **Method & Path**: `GET /api/campaigns`
- **Purpose**: List campaigns with status filtering
- **DB Tables**: `campaigns`, `templates` (join)
- **Auth Mode**: Anon
- **Error Cases**: 500 database error
- **Curl Test**: `curl "http://localhost:3000/api/campaigns?status=draft"`

- **Method & Path**: `POST /api/campaigns`
- **Purpose**: Create new campaign
- **DB Tables**: `campaigns` (insert), `templates` (validate template_id)
- **Auth Mode**: Anon
- **Error Cases**: 400 validation error, 404 template not found
- **Curl Test**: `curl -X POST http://localhost:3000/api/campaigns -H "Content-Type: application/json" -d '{"title":"Test Campaign","type":"greeting","template_id":"{template_id}","audience_query":{"tags":["vip"]}}'`

- **Method & Path**: `GET /api/campaigns/:id`
- **Purpose**: Get specific campaign
- **DB Tables**: `campaigns`, `templates` (join)
- **Auth Mode**: Anon
- **Error Cases**: 404 not found
- **Curl Test**: `curl http://localhost:3000/api/campaigns/{campaign_id}`

- **Method & Path**: `PUT /api/campaigns/:id`
- **Purpose**: Update campaign
- **DB Tables**: `campaigns` (update)
- **Auth Mode**: Anon
- **Error Cases**: 404 not found, 400 validation error
- **Curl Test**: `curl -X PUT http://localhost:3000/api/campaigns/{campaign_id} -H "Content-Type: application/json" -d '{"title":"Updated Campaign"}'`

- **Method & Path**: `DELETE /api/campaigns/:id`
- **Purpose**: Cancel campaign
- **DB Tables**: `campaigns` (update status to cancelled)
- **Auth Mode**: Anon
- **Error Cases**: 404 not found
- **Curl Test**: `curl -X DELETE http://localhost:3000/api/campaigns/{campaign_id}`

- **Method & Path**: `POST /api/campaigns/:id/send`
- **Purpose**: Trigger immediate campaign send
- **DB Tables**: `campaigns`, `sends` (create sends for campaign)
- **Auth Mode**: Anon
- **Error Cases**: 404 not found, 422 business rule violation
- **Curl Test**: `curl -X POST http://localhost:3000/api/campaigns/{campaign_id}/send`

### Phase 4: Sends and Logs (Depends on People, Templates, Campaigns)

#### 5. Send Management
- **Method & Path**: `GET /api/sends`
- **Purpose**: List sends with filtering by status and relationships
- **DB Tables**: `sends`, `people`, `templates`, `campaigns` (joins)
- **Auth Mode**: Anon
- **Error Cases**: 500 database error
- **Curl Test**: `curl "http://localhost:3000/api/sends?status=queued&campaignId={campaign_id}"`

- **Method & Path**: `POST /api/sends/retry`
- **Purpose**: Retry failed sends
- **DB Tables**: `sends` (update status to queued)
- **Auth Mode**: Anon
- **Error Cases**: 400 validation error, 404 send not found
- **Curl Test**: `curl -X POST http://localhost:3000/api/sends/retry -H "Content-Type: application/json" -d '{"sendIds":["{send_id1}","{send_id2}"]}'`

### Phase 5: Analytics and Reporting

#### 6. Analytics
- **Method & Path**: `GET /api/analytics/summary`
- **Purpose**: Get delivery and engagement metrics
- **DB Tables**: `sends` (aggregate by status, channel)
- **Auth Mode**: Anon
- **Error Cases**: 500 database error
- **Curl Test**: `curl "http://localhost:3000/api/analytics/summary?from=2025-01-01&to=2025-12-31"`

### Phase 6: OAuth and Integration

#### 7. Gmail OAuth
- **Method & Path**: `POST /api/oauth/gmail/connect`
- **Purpose**: Initiate Gmail OAuth flow
- **DB Tables**: None (returns auth URL)
- **Auth Mode**: Anon
- **Error Cases**: 500 OAuth configuration error
- **Curl Test**: `curl -X POST http://localhost:3000/api/oauth/gmail/connect`

- **Method & Path**: `GET /api/oauth/gmail/status`
- **Purpose**: Check Gmail integration status
- **DB Tables**: `oauth_tokens` (check if valid token exists)
- **Auth Mode**: Anon
- **Error Cases**: 500 database error
- **Curl Test**: `curl http://localhost:3000/api/oauth/gmail/status`

#### 8. Scheduler (Admin)
- **Method & Path**: `POST /api/scheduler/daily`
- **Purpose**: Trigger daily birthday/anniversary sweep
- **DB Tables**: `people`, `sends` (create sends for due people)
- **Auth Mode**: Service role (admin)
- **Error Cases**: 500 database error, 403 unauthorized
- **Curl Test**: `curl -X POST http://localhost:3000/api/scheduler/daily -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{"runAt":"2025-10-22T00:05:00Z","timezone":"UTC"}'`

## Development Steps and Checkpoints

### Step 1: Server Scaffold
- [x] Create Express.js server with middleware
- [x] Setup Supabase connection
- [x] Add error handling and validation
- [x] Create basic health check endpoint

### Step 2: People API Implementation
- [x] Implement GET /api/people (list with pagination)
- [x] Implement POST /api/people (create with validation)
- [x] Implement GET /api/people/:id (get by ID)
- [x] Implement PUT /api/people/:id (update)
- [x] Implement DELETE /api/people/:id (delete)
- [x] Implement GET /api/people/upcoming (upcoming events)
- [ ] Test all people endpoints with curl

### Step 3: Templates API Implementation
- [ ] Implement GET /api/templates (list with filtering)
- [ ] Implement POST /api/templates (create)
- [ ] Implement GET /api/templates/:id (get by ID)
- [ ] Implement PUT /api/templates/:id (update)
- [ ] Implement DELETE /api/templates/:id (delete)
- [ ] Implement GET /api/templates/:id/preview (preview with sample data)
- [ ] Test all template endpoints with curl

### Step 4: Campaigns API Implementation
- [ ] Implement GET /api/campaigns (list with filtering)
- [ ] Implement POST /api/campaigns (create with template validation)
- [ ] Implement GET /api/campaigns/:id (get by ID)
- [ ] Implement PUT /api/campaigns/:id (update)
- [ ] Implement DELETE /api/campaigns/:id (cancel)
- [ ] Implement POST /api/campaigns/:id/send (trigger send)
- [ ] Test all campaign endpoints with curl

### Step 5: Sends API Implementation
- [ ] Implement GET /api/sends (list with filtering)
- [ ] Implement POST /api/sends/retry (retry failed sends)
- [ ] Test all send endpoints with curl

### Step 6: Analytics and OAuth
- [ ] Implement GET /api/analytics/summary (metrics)
- [ ] Implement POST /api/oauth/gmail/connect (OAuth flow)
- [ ] Implement GET /api/oauth/gmail/status (OAuth status)
- [ ] Implement POST /api/scheduler/daily (admin scheduler)
- [ ] Test all advanced endpoints with curl

### Step 7: Final Testing and Documentation
- [ ] Run comprehensive curl test suite
- [ ] Create Postman collection (optional)
- [ ] Document API usage and deployment
- [ ] Add authentication middleware (future)

## Timeline Checklist

### Week 1: Foundation
1. ✅ Server scaffold and health check
2. ✅ People API (CRUD operations)
3. ✅ People API testing and fixes

### Week 2: Core Features
4. Templates API (CRUD operations)
5. Templates API testing and fixes
6. Campaigns API (CRUD operations)
7. Campaigns API testing and fixes

### Week 3: Advanced Features
8. Sends API (list and retry)
9. Analytics API (summary metrics)
10. OAuth API (Gmail integration)
11. Scheduler API (admin functions)

### Week 4: Testing and Deployment
12. Comprehensive curl testing
13. Postman collection creation
14. Documentation and deployment guide
15. Authentication implementation (future)

## Success Criteria

- [ ] All endpoints return proper HTTP status codes
- [ ] All endpoints handle errors gracefully
- [ ] All curl tests pass successfully
- [ ] Database operations are efficient and secure
- [ ] API follows RESTful conventions
- [ ] Response format is consistent across all endpoints
- [ ] Rate limiting is properly implemented
- [ ] Input validation prevents invalid data
- [ ] Error messages are helpful and consistent
