# GreetFlow Project - Comprehensive Technical Overview

## 🏗️ Project Architecture Overview

**GreetFlow** is a full-stack business automation platform for personalized greeting and invitation management, built with modern web technologies and microservices architecture.

### 📊 Technology Stack Summary
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express.js + RESTful APIs
- **Database**: PostgreSQL (via Supabase)
- **Cloud Functions**: Supabase Edge Functions (Deno)
- **Authentication**: Supabase Auth
- **Email Service**: Gmail API Integration
- **Deployment**: Supabase Platform

---

## 🎨 Frontend Architecture

### Core Technologies
- **React 18.3.1**: Component-based UI framework with hooks
- **TypeScript 5.5.3**: Type-safe development
- **Vite 5.4.21**: Modern build tool and dev server
- **TailwindCSS 3.4.1**: Utility-first CSS framework
- **Lucide React 0.344.0**: Modern icon library

### Application Structure
```
src/
├── components/          # React components
├── services/           # API service layers
├── types/              # TypeScript definitions
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
└── utils/              # Helper functions
```

### Key Components Architecture

#### 1. **App.tsx** - Main Application Shell
- **Navigation System**: Tab-based routing with gradient styling
- **State Management**: React useState for active tab management
- **Responsive Design**: Mobile-first approach with Flexbox/Grid
- **Component Rendering**: Dynamic content switching based on active tab

#### 2. **Dashboard Component**
- **Real-time Metrics**: User count, events, email statistics
- **Event Management**: Today/tomorrow/week event filtering
- **Analytics Display**: Success rates, monthly statistics
- **Status Indicators**: System health and auto-send status

#### 3. **Component Ecosystem**
- **UserManagement**: CRUD operations for user data
- **TemplateManager**: Template creation and management
- **EventManager**: Event scheduling and tracking
- **Analytics**: Data visualization and reporting
- **SettingsPanel**: Configuration management

### Frontend Design Patterns

#### 1. **Component Composition Pattern**
- Modular component architecture
- Props-based data flow
- Reusable UI components

#### 2. **Service Layer Pattern**
```typescript
// EmailService singleton pattern
export class EmailService {
  private static instance: EmailService;
  public static getInstance(): EmailService
}
```

#### 3. **Type Safety Implementation**
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  category: 'Lead' | 'Client' | 'User';
  dateOfBirth: Date;
  anniversaryDate?: Date;
}
```

### UI/UX Architecture Techniques

#### 1. **Gradient Design System**
- Color-coded navigation with gradient backgrounds
- Consistent visual hierarchy
- Modern glassmorphism effects

#### 2. **Responsive Layout Strategy**
- Mobile-first design approach
- Flexible grid system using CSS Grid/Flexbox
- Adaptive component sizing

#### 3. **Animation & Interactions**
- CSS transitions for smooth interactions
- Hover states and active indicators
- Loading states and micro-animations

---

## ⚙️ Backend Architecture

### Core Technologies
- **Node.js**: JavaScript runtime environment
- **Express.js 4.18.2**: Web application framework
- **Supabase Client 2.38.0**: Database and auth client
- **Joi 17.11.0**: Data validation library
- **CORS 2.8.5**: Cross-origin resource sharing
- **Helmet 7.1.0**: Security middleware

### API Architecture Patterns

#### 1. **RESTful API Design**
```javascript
// Route structure
app.use('/api/people', require('./routes/people'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/sends', require('./routes/sends'));
app.use('/api/analytics', require('./routes/analytics'));
```

#### 2. **Middleware Stack Architecture**
```javascript
// Security and performance middleware
app.use(helmet());                    // Security headers
app.use(cors());                      // CORS handling
app.use(express.json({ limit: '10mb' })); // JSON parsing
app.use(generalLimiter);              // Rate limiting
```

#### 3. **Validation Middleware Pattern**
```javascript
// Joi validation schemas
const schemas = {
  person: Joi.object({
    first_name: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().required(),
    // ... other fields
  })
};
```

### Backend Service Layers

#### 1. **Route Controllers**
- **People API**: User CRUD operations with pagination
- **Templates API**: Template management with filtering
- **Campaigns API**: Bulk operation management
- **Analytics API**: Data aggregation and reporting

#### 2. **Security Implementation**
- **Rate Limiting**: Express-rate-limit with tiered limits
- **Input Validation**: Joi schema validation
- **Security Headers**: Helmet.js implementation
- **Error Handling**: Centralized error middleware

#### 3. **Database Integration**
```javascript
// Supabase client configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

---

## 🗄️ Database Architecture

### PostgreSQL Schema Design

#### 1. **Core Tables Structure**
```sql
-- People table (users/contacts)
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    dob DATE,
    anniversary_date DATE,
    timezone VARCHAR(64) DEFAULT 'UTC',
    consent_email BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}'
);

-- Templates table
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    type template_type NOT NULL,
    age_group age_group DEFAULT 'na',
    html TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);
```

#### 2. **Relationship Architecture**
```
people (1) ──< sends >── (1) templates
   │                     │
   └─────────< campaigns ┘
```

#### 3. **Advanced Database Features**

**Custom Types**:
```sql
CREATE TYPE template_type AS ENUM ('birthday','anniversary','greeting','invitation');
CREATE TYPE campaign_status AS ENUM ('draft','scheduled','sent','cancelled');
CREATE TYPE send_status AS ENUM ('queued','sent','failed','skipped');
```

**Indexing Strategy**:
```sql
CREATE INDEX idx_people_dob ON people(dob);
CREATE INDEX idx_people_email ON people(email);
CREATE INDEX idx_templates_type ON templates(type);
CREATE INDEX idx_sends_status_scheduled ON sends(status, scheduled_for);
```

**Triggers & Functions**:
```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
```

### Data Architecture Patterns

#### 1. **Audit Trail System**
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    actor UUID,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id UUID,
    meta JSONB DEFAULT '{}'
);
```

#### 2. **OAuth Token Management**
```sql
CREATE TABLE oauth_tokens (
    id UUID PRIMARY KEY,
    provider VARCHAR(50) DEFAULT 'google',
    account_email VARCHAR(255) NOT NULL,
    access_token_enc TEXT NOT NULL,
    refresh_token_enc TEXT NOT NULL,
    expiry TIMESTAMP WITH TIME ZONE
);
```

---

## 🔧 Microservices Architecture

### Supabase Edge Functions

#### 1. **Email Service Function**
```typescript
// send-email/index.ts
interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  recipientName: string;
  templateId?: string;
  userId: string;
}
```

**Features**:
- CORS handling for cross-origin requests
- Input validation and error handling
- Simulated email delivery with 95% success rate
- Automatic logging to database
- Batch processing capabilities

#### 2. **Template Generation Service**
- AI-powered template creation
- Dynamic content personalization
- Age-group specific template selection

### Service Integration Patterns

#### 1. **Frontend-Backend Communication**
```typescript
// Service layer abstraction
export class EmailService {
  async sendEmail(emailData: EmailData): Promise<EmailResult>
  async sendBulkEmails(emails: EmailData[]): Promise<BulkResult>
  generatePersonalizedMessage(type, userName, preferences): string
}
```

#### 2. **Database Service Layer**
```javascript
// Supabase integration with error handling
const { data, error } = await supabase
  .from('people')
  .select('*')
  .order('created_at', { ascending: false });
```

---

## 🔐 Security Architecture

### Authentication & Authorization
- **Supabase Auth**: JWT-based authentication
- **Row Level Security**: Database-level access control
- **API Key Management**: Environment-based configuration

### Security Measures
1. **Rate Limiting**: Multi-tier rate limiting (60/min general, 10/min sensitive)
2. **Input Validation**: Joi schema validation on all inputs
3. **SQL Injection Prevention**: Parameterized queries via Supabase
4. **XSS Protection**: Helmet.js security headers
5. **CORS Configuration**: Controlled cross-origin access

---

## 📊 Performance Architecture

### Frontend Optimization
- **Code Splitting**: Vite-based dynamic imports
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Optimized bundle sizes
- **Lazy Loading**: Component-level lazy loading

### Backend Optimization
- **Connection Pooling**: Supabase managed connections
- **Query Optimization**: Indexed database queries
- **Caching Strategy**: In-memory caching for frequently accessed data
- **Batch Processing**: Bulk operations for email sending

### Database Performance
- **Strategic Indexing**: Multi-column indexes for complex queries
- **Query Optimization**: Efficient JOIN operations
- **Connection Management**: Supabase connection pooling
- **Data Partitioning**: Time-based partitioning for logs

---

## 🚀 Deployment Architecture

### Development Environment
- **Local Development**: Vite dev server + Node.js backend
- **Database**: Supabase cloud PostgreSQL
- **Environment Management**: .env configuration files

### Production Architecture
- **Frontend Hosting**: Static site deployment
- **Backend API**: Supabase Edge Functions
- **Database**: Supabase managed PostgreSQL
- **CDN**: Global content delivery network

### DevOps Practices
- **Version Control**: Git-based workflow
- **Environment Separation**: Dev/staging/production environments
- **Automated Testing**: API endpoint testing scripts
- **Monitoring**: Health check endpoints and logging

---

## 📈 Scalability Considerations

### Horizontal Scaling
- **Microservices**: Independent service scaling
- **Database Sharding**: User-based data partitioning
- **Load Balancing**: Multi-instance deployment

### Vertical Scaling
- **Resource Optimization**: Efficient memory usage
- **Query Optimization**: Database performance tuning
- **Caching Layers**: Redis integration for session management

---

## 🔄 Integration Architecture

### Third-Party Integrations
1. **Gmail API**: OAuth 2.0 integration for email sending
2. **Supabase Platform**: Database, auth, and edge functions
3. **External APIs**: Template generation and personalization

### API Design Patterns
- **RESTful Architecture**: Standard HTTP methods and status codes
- **JSON API**: Consistent response formats
- **Error Handling**: Standardized error response structure
- **Versioning**: API version management strategy

---

## 📋 Project File Structure

```
greetflow/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Helper functions
│   ├── package.json        # Frontend dependencies
│   └── vite.config.ts      # Build configuration
├── backend/
│   ├── routes/             # API route handlers
│   ├── middleware/         # Express middleware
│   ├── config/             # Configuration files
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
├── database/
│   ├── schema.sql          # Database schema
│   └── seed.sql            # Initial data
└── docs/                   # Project documentation
```

This architecture provides a robust, scalable, and maintainable foundation for the GreetFlow business automation platform, utilizing modern web development practices and cloud-native technologies.
