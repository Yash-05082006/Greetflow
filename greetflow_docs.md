> **Greetflow**
>
> (AutomationSystemforWishes& Invitation/GreetingCards)
>
> 1.RequirementsAnalysis&Research
>
> The goal of this project is to build an automation system within the
> Beamwelly application that can send **personalized** **birthday**
> **wishes,** **anniversary** **wishes,** **greeting** **cards,**
> **and** **invitation** **cards** to clients/users.
>
> Whyneeded?
>
> Strengthen client relationships with personalized communication.
>
> Automate reminders & reduce manual effort.
>
> Provide visually appealing templates to make the experience engaging.
>
> KeyFeaturesRequired:
>
> A **UI** **button** at the top right corner → opens a new tab with
> “Wishes & Invitationsˮ module.
>
> For each client/user, store: **Name,** **Date** **of** **Birth,**
> **Anniversary** **Date** (if married).
>
> Automated sending of wishes on the exact date.
>
> **Age-based** **templates** for birthday wishes:
>
> 815 years: 34 templates (fun, colorful, child-friendly).
>
> 1518 years: 34 templates (teen-friendly, stylish).
>
> 18 years: 34 templates (professional, elegant).
>
> Anniversary templates: 34 options (romantic, simple, professional).
>
> Greeting cards for festivals/occasions: 5 templates.

Greetflow 1

> Invitation cards for company events: 5 templates.
>
> Sending channel: In-app  Gmail integration.
>
> Human-like creative design for templates (beautiful UI.
>
> **Users** **&** **Roles**
>
> **Marketing/CRM** **Ops** (chooses templates, schedules, edits
> content)
>
> **Viewer** (read-only logs, upcoming events)
>
> **Business** **Goals**
>
> Save manual effort, never miss key dates.
>
> Increase client engagement and goodwill.
>
> Keep design quality high to reflect brand.
>
> 2.TechnologyStackSelection
>
> **Frontend** **:** React.js (for smooth, interactive UI, template
> selection & preview).
>
> **Backend** **:** Python Flask/FastAPI for automation, scheduling &
> data handling).
>
> **Database** **:** PostgreSQL (to store client/user details, dates,
> and template selection) , Supabase for DB Storage.
>
> **Scheduler** **:** Python schedule or Celery for automated sending of
> wishes at the right time.
>
> **Email** **Service** **:** Gmail API or SMTP for sending
> wishes/invitations directly to email.
>
> **Template** **Engine** **:** HTML  CSS  Tailwind  Canva-like
> design integration for cards.
>
> **3.Documentation** **&** **Planning**
>
> *This* *section* *explicitly* *covers:* *SRS,* *TRS,* *API* *doc*
> *standards* *(high-level),* *security,* *system* *architecture*
> *docs,* *project* *timeline/milestones,* *Git* *setup* *&* *version*
> *control)*

Greetflow 2

> **SRS** **(Software** **Requirements** **Specification)** **—**
> **Summary**
>
> **Functional**
>
>  View upcoming birthdays/anniversaries in next 30 days.
>
>  Filter by lists (leads/customers/users), age group, status.
>
>  Create “greetingˮ or “invitationˮ **campaigns** with: audience,
> send time, template, variables.
>
>  Pick **age-based** **birthday** **templates** and **anniversary**
> **templates** with live preview.
>
>  Personalize with placeholders: {first_name} , {full_name} ,
> {company_name} , {event_date} , {event_title} etc.
>
>  Send via **in-app** (notification) and/or **Gmail**.
>
>  Automatic daily scheduler: creates send jobs for that day; retries
> on failure.
>
>  **Consent** & **opt-out** support; do not send if opt-out.
>
>  Delivery logs & status (queued, sent, failed, opened if tracked via
> link).
>
> **Data**
>
> Person: name, email, DOB, anniversary date, tags, timezone, consent
> flags.
>
> Templates: type, theme, age group, HTML, preview image.
>
> Campaigns & Sends: schedule, audience, channel, result.
>
> **Constraints**
>
> Least-privilege Gmail scopes; never store Gmail passwords.
>
> PII protected per DPDP Act (consent, purpose limitation, deletion on
> request).
> <u>[Meit](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf?utm_source=chatgpt.com)[YLatham
> &
> Watkins](https://www.lw.com/admin/upload/SiteAttachments/Indias-Digital-Personal-Data-Protection-Act-2023-vs-the-GDPR-A-Comparison.pdf?utm_source=chatgpt.com)</u>
>
> **TRS** **(Technical** **Requirements** **Specification)** **—**
> **Summary**
>
> **Frontend**:

Greetflow 3

> SPA in React; routes: /wishes , /anniversaries , /greetings ,
> /invitations , /templates , /campaigns , /logs .
>
> Form validation React Hook Form  Zod or built-in rules).
>
> Accessibility (labels, contrast, keyboard nav).
>
> **Backend**:
>
> FastAPI routers (auth, templates, campaigns, sends, logs).
>
> Celery worker + **celery** **beat** (or RedBeat) for periodic and
> one-off jobs.
>
> SQLAlchemy models; DB migrations Alembic).
>
> Email service uses Gmail API with OAuth 2.0 tokens stored securely
> (encrypted at rest).
>
> **Security**:
>
> Auth (if needed in this tab) via existing Beamwelly session/JWT;
> backend endpoints protected.
>
> Input validation via Pydantic; rate-limit sensitive endpoints.
>
> **Observability**:
>
> Structured logs for sends, failures, retries.
>
> Admin report (count sent, failed, suppressed due to opt-out).
>
> **Security** **Protocols** **&** **Data** **Protection**
>
> **OAuth** **2.0** with **minimum** **Gmail** **scope**
> https://www.googleapis.com/auth/gmail.send for sending only; avoid
> broad scopes.
>
> **PII** **Handling** under Indiaʼs **DPDP** **Act**: collect only
> needed fields DOB, anniversary), show clear purpose, allow
> opt-out/delete, keep consent records, and purge data on request.
> *Implementation* *guidance,* *not* *legal* *advice.)*
>
> Encrypt **in** **transit** TLS and **at** **rest** DB-level or
> field-level for tokens).
>
> Store OAuth refresh tokens encrypted and rotate if leaked.
>
> Apply **Least** **Privilege** for service accounts and infra access.
>
> **System** **Architecture** **Documentation**

Greetflow 4

> **Logical** **Components**
>
> React SPA (templates, campaigns, logs UI
>
> FastAPI service REST
>
> Celery worker + scheduler (daily sweep + queued sends)
>
> Redis (broker)
>
> PostgreSQL (persistent data)
>
> Gmail API (delivery)
>
> **High-Level** **Flow**
>
>  CRM  button → opens “Wishes & Invitationsˮ tab React).
>
>  User builds campaign or relies on daily auto-send.
>
>  Scheduler picks due items → worker renders template → calls Gmail
> API  logs status.
>
>  UI shows logs, retries, and suppressions (no consent, bounced,
> etc.).
>
> Design choices align with FastAPI  Celery  Gmail scopes docs.)
>
> **Project** **Timeline** **&** **Milestones**

||
||
||
||
||
||
||
||
||

Greetflow 5

> **4.UI/UX** **Design**
>
> **Pages** **&** **Navigation**
>
> **Dashboard**: todayʼs birthdays/anniversaries, upcoming list, quick
> actions (“Create Invitationˮ, “Create Greetingˮ).
>
> **Birthdays** **/** **Anniversaries**: table with date, person, age
> group, consent badge, template used; bulk “Send nowˮ.
>
> **Greetings** **/** **Invitations**: campaign list (status:
> Scheduled/Sent/Draft).
>
> **Templates**: gallery with filters (type, theme, age group); preview
> & edit variables.
>
> **Logs**: deliveries with status, error reason, and retry.
>
> **Template** **Guidelines**
>
> **Birthday** **815**: bright, playful, balloons/confetti; large
> name highlight.
>
> **Birthday** **1518**: trendy shapes, bold typography.
>
> **Birthday** **18**: minimal, elegant, brand colors.
>
> **Anniversary**: warm tones, subtle patterns.
>
> **Greeting** **5** **templates)** Occasion(Diwali, Holi, Eid,
> Christmas, New Year.)
>
> **Invitation** **5** **templates)** Product launch, Webinar,
> Townhall, Networking, Workshop.
>
> Personalize with {first_name} , {event_title} , {event_date} .
>
> Email HTML must be **responsive** and render well in Gmail.
>
> **UX** **Details**
>
> Clear empty states (“No birthdays today—view upcomingˮ).
>
> Undo snackbar for quick cancel (where safe).
>
> Inline validation, helper text; date pickers with min/max checks.
>
> Keyboard shortcuts (e.g., / to search, N to new campaign).

Greetflow 6

> **5.Database** **Design** **&** **Setup**
>
> **Core** **Tables** **(simplified)**
>
> **people**: id , first_name , last_name , email , dob ,
> anniversary_date , timezone , consent_email (bool), tags\[\] ,
> created_at , updated_at
>
> **templates**: id , name , type (
> birthday\|anniversary\|greeting\|invitation ), age_group (
> 8_15\|15_18\|18_plus\|na ), html , preview_url , is_active ,
> created_at , updated_at
>
> **campaigns**: id , title , type , audience_query JSON, template_id
> , channel
>
> ( app\|gmail\|both ), scheduled_at (ts), status (
> draft\|scheduled\|sent\|cancelled ), created_by ,
>
> created_at
>
> **sends**: id , campaign_id (nullable), person_id , template_id ,
> scheduled_for , sent_at , status ( queued\|sent\|failed\|skipped ),
> error_msg , channel
>
> **oauth_tokens**: id , provider ( google ), account_email ,
> access_token_enc , refresh_token_enc ,
>
> expiry
>
> **audit_logs**: id , actor , action , entity , entity_id , meta JSONB
> , created_at
>
> **Keys** **&** **Indexes**
>
> Index people(dob) , people(anniversary_date) for daily picks.
>
> Index sends(status, scheduled_for) for worker fetch.
>
> Foreign keys from sends → campaigns/templates/people.
>
> **Data** **Policies**
>
> **Consent**: consent_email = true required to send.
>
> **Deletion**: cascade remove scheduled sends when person is deleted.
>
> **Backups**: nightly DB backup; keep 30 days.
>
> **6.Backend** **Development** **(Python)**
>
> **Services**

Greetflow 7

> **FastAPI** app with routers: templates , people , campaigns , sends ,
> logs .
>
> **Celery** **worker** for:
>
> Daily scheduler job (at 0005 local per timezone or batched in IST to
> queue birthday/anniversary sends.
>
> Campaign sends at specific times.
>
> Retries with exponential backoff.
>
> **Gmail** **client** using OAuth tokens; use **gmail.send** **scope**
> only.
>
> **Security**
>
> Validate all inputs with Pydantic; sanitize HTML variables; size
> limits for images.
>
> Protect routes with Beamwelly auth/JWT; log every send and failure.
>
> Follow FastAPI JWT/security best practices.
>
> **Scheduling**
>
> **celery** **beat** (or RedBeat) for periodic jobs; store schedules in
> Redis for dynamic updates.
>
> **7.Frontend** **Development** **(React)**
>
> **Main** **Components**
>
> **DashboardCards** (counts & todayʼs list), **PeopleTable**,
> **TemplateCard**, **TemplatePreview**, **CampaignBuilder**,
> **SchedulePicker**, **LogTable**.
>
> **State** **&** **Data**
>
> React Query for caching & refetch.
>
> Form state with React Hook Form; reusable Input, Select,
> DateTimePicker components.
>
> Timezone handling with Day.js; show clear “will send at HHMM TZˮ.

Greetflow 8

<img src="./2syi4ece.png" style="width:6.5in;height:4.34375in" />

> **UI** **System**
>
> Tailwind + shadcn/ui; spacing scale for clean layout; responsive grid;
> accessible modals/tooltips.
>
> Theme tokens (colors, radius, shadows) to keep brand consistent.
>
> ***General*** ***Flowchart***

Greetflow 9
