# GreetFlow – End-to-End User Journey

This document describes the complete user journey through the GreetFlow application, from login to analytics and audit history. It focuses on:

- What the **user sees** (UI and feedback)
- What the **user does** (actions and inputs)
- What the **system does** internally (API calls, database operations, email sending, logging)

The description reflects the current integrated architecture: **React frontend → API services → Express backend → Supabase (Postgres) + SMTP**.

---

## 1. Login & Authentication

### 1.1 Accessing the Application
- **User sees**
  - Public login page (`/login.html` or root redirect) with:
    - Email input field
    - Password input field (or simple access button, depending on deployment)
    - Primary “Login” button
  - Clean, modern UI consistent with the rest of GreetFlow.

- **User does**
  - Enters credentials or clicks the login button (for simplified demo login).
  - Submits the form.

- **System does (internally)**
  - Validates basic input client-side (non-empty fields).
  - Sends an **authentication request** to the backend (e.g. `/api/oauth/login` or equivalent auth endpoint, depending on current deployment configuration).
  - Backend verifies credentials, tokens, or session state against Supabase auth or a configured auth provider.
  - On success:
    - Backend returns a success response + user/session payload.
    - Frontend sets `localStorage.setItem('isLoggedIn', 'true')`.
    - Frontend redirects to the **Dashboard** route (React app root).
  - On failure:
    - Backend returns an error.
    - Frontend shows an error toast / inline error message and stays on login.

### 1.2 Session Guard on Dashboard
- **User sees**
  - When navigating directly to the main app (e.g. via bookmark), the Dashboard loads.

- **User does**
  - No explicit action; simply opens the app while a previous session may or may not be active.

- **System does (internally)**
  - In `Dashboard.tsx`, a `useEffect` runs on mount:
    - Checks `localStorage.getItem('isLoggedIn')`.
    - If not `'true'`, redirects back to `/login.html`.
  - This provides a simple client-side guard on top of any backend auth.

---

## 2. Dashboard Navigation

The Dashboard is the central hub for overview and navigation.

### 2.1 Initial Load & Data Fetching
- **User sees**
  - A **loading state** with:
    - Animated GreetFlow icon
    - “Loading Dashboard…” text
    - “Fetching your business data” subtitle
  - After loading, a rich dashboard view with:
    - Hero welcome banner
    - Key stats cards (users, templates, upcoming events, email performance, etc.)
    - Upcoming events sections (Today, Tomorrow, This Week)
    - Quick action buttons
    - Email Activity section with **Recent Activity** and **Email History** tabs.

- **User does**
  - Waits for data to load.
  - Optionally clicks quick navigation buttons (e.g. to Users, Templates, Events).

- **System does (internally)**
  - Dashboard mounts and calls `useDatabaseApi()` hook.
  - `useDatabaseApi` service layer:
    - Sends multiple GET requests to backend:
      - `GET /api/users`
      - `GET /api/templates`
      - `GET /api/email-logs` (and possibly `/api/email-logs/stats`)
    - Backend routes forward to Supabase:
      - Select from `people` (or equivalent users table)
      - Select from `templates`
      - Select from `email_logs` for recent email activity
  - Results are cached in React state and exposed as `users`, `templates`, `emailLogs`, etc.
  - Dashboard derives:
    - Stats cards (counts, success rates, upcoming events)
    - Segmented upcoming events (today, tomorrow, this week) using `dateUtils` helpers.

### 2.2 Hero Banner & Status Indicators
- **User sees**
  - Gradient hero section with:
    - “Welcome to GreetFlow” title
    - Subtitle: “Your intelligent relationship management system with persistent data storage”
    - Three status indicators:
      - Database Connected
      - Email Service Active
      - AI Templates Ready
    - Logout button.

- **User does**
  - May click **Logout**.

- **System does (internally)**
  - On Logout:
    - Clears `localStorage.isLoggedIn`.
    - Redirects to `/login.html`.

---

## 3. Managing Users

Users are managed from the **Users** section (UserManagement component).

### 3.1 Viewing Users
- **User sees**
  - A table of users with columns like:
    - Name
    - Email
    - Phone
    - Date of Birth / Occasion details
    - Category (Lead / Client / Other)
  - Search box and filters
  - Pagination controls.

- **User does**
  - Navigates to the **Users** tab.
  - Scrolls, searches, filters users.

- **System does (internally)**
  - `useDatabaseApi` already fetched all users via `GET /api/users`.
  - UserManagement:
    - Applies **client-side filtering** for search and category.
    - Manages **client-side pagination** over `filteredUsers`.
  - No additional network call is needed for pagination/search.

### 3.2 Creating a New User
- **User sees**
  - “Add New User” button.
  - Modal or form with fields:
    - Name
    - Email
    - Phone
    - Date of Birth
    - Category / Tags

- **User does**
  - Clicks **Add New User**.
  - Fills out the form.
  - Clicks **Save / Add User**.

- **System does (internally)**
  - Frontend validates basic input.
  - Calls Users API service (used inside `useDatabaseApi` or directly):
    - `POST /api/users` with JSON body.
  - Backend:
    - Validates payload.
    - Inserts into Supabase `people` (or equivalent users table).
    - Returns created user record.
  - Frontend:
    - Updates local `users` state (optimistic or via refetch).
    - UI shows updated user list.

### 3.3 Editing / Deleting Users
- **User sees**
  - Edit and delete icons per user row.
  - Edit modal/form similar to create.

- **User does**
  - Clicks **Edit** → updates fields → saves.
  - Or clicks **Delete** → confirms deletion.

- **System does (internally)**
  - Edit:
    - `PUT /api/users/:id` with updated fields.
    - Backend updates the row in Supabase.
    - Frontend merges updated record into `users` list.
  - Delete:
    - `DELETE /api/users/:id`.
    - Backend deletes or marks user as inactive.
    - Frontend removes user from list.

---

## 4. Managing Templates

Email templates define content and styling for greetings.

### 4.1 Viewing & Filtering Templates
- **User sees**
  - Template cards or rows with:
    - Template name
    - Category (Birthday, Anniversary, Event Invitation, Greeting)
    - Age group
    - Description
    - Usage count
  - Filters by category and age group.

- **User does**
  - Opens the **Templates** tab.
  - Filters templates by category/age group.

- **System does (internally)**
  - `useDatabaseApi` already loaded templates via `GET /api/templates`.
  - TemplateManager filters and maps templates client-side.

### 4.2 Creating a Custom Template
- **User sees**
  - “Create Custom Template” button.
  - CustomTemplateCreator modal with fields:
    - Name
    - Category (Birthday / Anniversary / Event Invitation / Greeting)
    - Age group
    - Description
    - Template content (HTML with placeholders like `[Name]`, `[Message]`, `[Preference]`)
    - Design options (background gradient, text color, font).

- **User does**
  - Fills in template details.
  - Uses preview to see how the email card will look.
  - Clicks **Save**.

- **System does (internally)**
  - Frontend constructs a `Template` payload (without `id` / `usageCount`).
  - Calls Templates API:
    - `POST /api/templates`.
  - Backend:
    - Inserts record into Supabase `templates` table.
    - Returns created template.
  - Frontend updates local templates list.

### 4.3 AI Template Generation (Mocked)
- **User sees**
  - “AI Template Generator” / “Generate with AI” button.
  - AITemplateGenerator modal with:
    - Prompt text area
    - Category dropdown
    - Age group dropdown
    - Generate button
    - Preview of generated template
    - Save/use buttons.

- **User does**
  - Enters a prompt: e.g. “Create a birthday template for a music lover”.
  - Selects category and age group.
  - Clicks **Generate**.

- **System does (internally)**
  - A mock function `generateMockTemplate` runs in the frontend:
    - Simulates a delay (~1.5s) to mimic an AI call.
    - Builds a `Template` object using the prompt and selections.
  - No external AI API is called in the current setup.
  - User may then **Save** the template, which uses the same `POST /api/templates` flow as custom templates.

---

## 5. Managing Events

Events represent important dates (birthdays, anniversaries, etc.) and scheduled greetings.

### 5.1 Viewing Upcoming Events
- **User sees**
  - In Dashboard and EventManager:
    - Sections: **Today**, **Tomorrow**, **This Week**, later upcoming events.
    - Each event shows:
      - User name
      - Occasion (Birthday / Anniversary / Other)
      - Date
      - Associated template (if any).

- **User does**
  - Navigates to the **Events** section.
  - Optionally filters or selects events by time frame.

- **System does (internally)**
  - `useDatabaseApi` provides `users` and helper `getUpcomingEvents()`.
  - Events are computed client-side from:
    - User profiles and dates
    - Possibly stored event records
  - No extra API calls beyond initial `GET /api/users` (and relevant events endpoints, if implemented).

### 5.2 Creating / Scheduling an Event
- **User sees**
  - “Add Event” / “Schedule Event” button.
  - AddEventModal with fields:
    - Event type (Birthday, Anniversary, Custom)
    - Date / time (or derived from user DOB/anniversary)
    - Template selector (with preview)
    - Additional message field.

- **User does**
  - Selects one or more users (for whom to schedule the event).
  - Opens **Add Event** modal.
  - Chooses template and custom message.
  - Clicks **Send Now** or **Schedule** (depending on configuration).

- **System does (internally)**
  - Frontend loads templates via `useDatabaseApi` and handles selection.
  - When sending:
    - Frontend processes the template locally:
      - Replaces placeholders like `[Name]` and `[Message]`.
    - For each selected user, calls **Email API**:
      - `POST /api/send-email` via `emailApi.sendEmail`.
      - Payload includes: `to`, `name`, `subject`, `htmlTemplate`, and metadata.
  - Backend email route:
    - Uses SMTP (Gmail or configured provider) to send email.
    - Logs result into `email_logs` and/or `audit_logs`.
    - Returns success/failure for each send.
  - Frontend tracks progress and updates UI accordingly.

---

## 6. Bulk Send & Email Personalization

BulkSendModal and AddOccasionModal handle sending many emails at once.

### 6.1 Selecting Recipients
- **User sees**
  - A multi-select user list (checkboxes in Users or Events sections).

- **User does**
  - Selects multiple users.
  - Clicks **Bulk Send** or **Add Occasion**.

- **System does (internally)**
  - Frontend holds `selectedUserIds` and passes them into BulkSendModal or AddOccasionModal.
  - Selected users are resolved from `users` state.

### 6.2 Choosing a Template & Custom Message
- **User sees**
  - Template dropdown showing only relevant templates (based on category / occasion).
  - Optional preview (TemplatePreview) of the chosen template.
  - Text area for **Custom Message**.

- **User does**
  - Chooses template.
  - Enters custom greeting.
  - Confirms **Send**.

- **System does (internally)**
  - Frontend derives `selectedTemplateData` from templates list.
  - Local `processTemplate` function:
    - Replaces tokens like `[Name]`, `[Message]`, `[Preference]` with:
      - User’s name
      - User’s preferences (if defined)
      - Custom message
  - For each user:
    - Generates personalized subject (e.g. “🎉 Happy Birthday John!”).
    - Generates personalized HTML body.
    - Calls `emailApi.sendEmail` with these values.
  - Progress UI updates after each sent email.

### 6.3 Bulk Send Progress & Results
- **User sees**
  - While sending:
    - Progress bar with percentage.
    - “Sending…” text and loader.
  - After completion:
    - Result screen: “X sent successfully, Y failed”.
    - Optional auto-close after a short delay.

- **User does**
  - Can watch status.
  - Waits for auto-close or acts on completion.

- **System does (internally)**
  - For each email:
    - Backend sends via SMTP and responds.
    - On success/failure:
      - Logs to `email_logs` and/or `audit_logs` (with status, recipient, subject, error message if any).
  - If any were sent:
    - Frontend calls `updateTemplateUsage(templateId)` via `useDatabaseApi` → backend increments usage count in `templates`.

---

## 7. Email Automation & SMTP

Email sending is centralized through backend automation.

### 7.1 Sending a Single Email (Internal Flow)
- **User sees**
  - From AddEventModal, BulkSendModal, or AddOccasionModal:
    - UI states described earlier (forms, progress, confirmation).

- **User does**
  - Triggers email sending via UI.

- **System does (internally)**
  - Frontend:
    - Builds email payload.
    - Calls `emailApi.sendEmail` → `POST /api/send-email`.
  - Backend (`emailRoutes`):
    - Validates payload (`to`, `subject`, `htmlTemplate`, etc.).
    - Uses configured SMTP (e.g., Gmail with app password) to send.
    - On success:
      - Writes into `email_logs` (status, to, subject, timestamps).
      - Writes into `audit_logs` with action `email_sent` and meta JSON.
    - On failure:
      - Logs failure and error message.
      - Writes `email_failed`/`status: failed` to `audit_logs`.
    - Returns JSON: `{ success: true/false, error?: ... }`.

---

## 8. Audit Logs & Email History

Audit logging provides a historical view of activity, especially emails.

### 8.1 Writing Audit Logs (Implicit Flow)
- **User sees**
  - Nothing directly when an audit log is created; logging is transparent.

- **User does**
  - Performs actions that send emails or modify data.

- **System does (internally)**
  - Whenever an email is sent, failed, or scheduled:
    - Backend creates an entry in `audit_logs` with fields:
      - `actor` (user ID or system ID)
      - `action` (e.g. `email_sent`, `email_failed`, `email_scheduled`, `send_email`)
      - `entity` and `entity_id` (e.g. `user`, `template`)
      - `meta` JSON containing:
        - `recipient_name`
        - `subject`
        - `status`
        - `template_id`
        - `user_id`
        - `error_message` (on failure)
      - `created_at` timestamp.
  - Supabase stores this in the `audit_logs` table.

### 8.2 Viewing Email History in Dashboard
- **User sees**
  - In the Dashboard’s **Email Activity** section:
    - A tab switcher with:
      - **Recent Activity** (existing, unchanged)
      - **Email History** (new)
  - On **Email History** tab:
    - Table with columns:
      - Status (colored badge: Sent / Failed / Pending)
      - Recipient
      - Subject
      - Action (audit action string)
      - Sent At (timestamp)
    - Pagination controls (page X of Y).
    - Clean empty state:
      - “No email history found” if there are no records.
    - Loading spinner on initial load.
    - Error message with “Try Again” on failure.

- **User does**
  - Clicks **Email History** tab.
  - Scrolls and, if needed, uses **Next / Previous** page buttons.

- **System does (internally)**
  - When the Email History tab is activated:
    - Dashboard calls `auditLogsApi.getEmailHistory({ page, limit })`.
    - This triggers `GET /api/audit-logs/email-history` on the backend.
  - Backend `auditLogs` route:
    - Queries Supabase `audit_logs` table with filter:
      - `action IN ('email_sent', 'email_failed', 'email_scheduled', 'send_email')`.
    - Applies pagination.
    - Maps each row to a simplified email history object:
      - `recipient_name`, `subject`, `status`, `sent_at`, `actor`, `action`, `template_id`, `user_id`, `error_message`.
    - Returns paginated JSON.
  - Frontend:
    - Stores results in `emailHistory` state.
    - Renders table rows accordingly.
    - Updates pagination info.
  - Live updates:
    - While Email History tab is active, every 10 seconds a **silent refresh** runs:
      - Calls `auditLogsApi.getEmailHistory()` again (without changing loading spinner).
      - Updates `emailHistory` so new emails appear automatically.

---

## 9. Analytics & Insights

Analytics provides an overview of email performance and user engagement.

### 9.1 Viewing Analytics
- **User sees**
  - Analytics page or section with:
    - Total emails sent
    - Success vs failure rates
    - Recent email activity counts
    - Possibly charts or KPI tiles derived from `email_logs` and users.

- **User does**
  - Navigates to **Analytics**.

- **System does (internally)**
  - `Analytics.tsx` uses `useDatabaseApi` to access:
    - `users`
    - `templates`
    - `emailLogs`
  - May also use dedicated analytics endpoints:
    - `GET /api/email-logs/stats` for aggregated metrics.
  - Backend aggregates using Supabase:
    - Counts emails by status and time window.
    - Returns summary: totals, success rate, recently sent count, etc.
  - Frontend calculates or merges additional metrics and displays them.

---

## 10. End-to-End Example Journey

Below is a concise end-to-end example tying all pieces together.

1. **Login**
   - User logs in → `localStorage.isLoggedIn = 'true'` → redirected to Dashboard.
2. **Dashboard Load**
   - Frontend calls `/api/users`, `/api/templates`, `/api/email-logs` → shows stats, upcoming events, recent activity.
3. **Create User**
   - User adds "Jane Doe" → `POST /api/users` → row added in Supabase.
4. **Create Template**
   - User creates "Birthday – Friendly" template → `POST /api/templates` → stored in `templates`.
5. **Schedule Birthday Greeting**
   - From Events / Add Occasion:
     - User selects Jane → chooses "Birthday – Friendly" → writes custom message → clicks Send.
   - Frontend personalizes content → `POST /api/send-email`.
   - Backend sends email via SMTP, writes to `email_logs` + `audit_logs`.
6. **View Email History**
   - User opens Email History tab on Dashboard.
   - Frontend calls `/api/audit-logs/email-history`.
   - Table shows entry for Jane’s sent birthday email.
7. **Analytics Check**
   - User opens Analytics → sees total emails sent, success rate, and Jane’s email counted.

This flow demonstrates how the **user journey** maps directly to **backend APIs**, **Supabase data**, and **email/audit logging** in the current GreetFlow architecture.
