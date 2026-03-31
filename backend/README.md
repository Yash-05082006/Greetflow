# Greetflow Backend API

A Node.js + Express.js backend API for the Greetflow application, built with Supabase as the database.

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
Create a `.env` file in the backend directory:
```env
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
PORT=3000
NODE_ENV=development
```

### 3. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 4. Test the API
```bash
# PowerShell (Windows)
.\test-api.ps1

# Bash (Linux/Mac)
./test-api.sh
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### People Management
- `GET /api/people` - List all people (with pagination and filtering)
- `GET /api/people/:id` - Get person by ID
- `POST /api/people` - Create new person
- `PUT /api/people/:id` - Update person
- `DELETE /api/people/:id` - Delete person
- `GET /api/people/upcoming` - Get upcoming birthdays/anniversaries

## Example Usage

### Create a Person
```bash
curl -X POST http://localhost:3000/api/people \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "dob": "1990-01-01",
    "timezone": "UTC",
    "consent_email": true,
    "tags": ["vip"]
  }'
```

### Get All People
```bash
curl http://localhost:3000/api/people
```

### Get Upcoming Birthdays
```bash
curl "http://localhost:3000/api/people/upcoming?days=30"
```

## Development

The server includes:
- ✅ Express.js with middleware (CORS, Helmet, JSON parsing)
- ✅ Supabase integration with proper error handling
- ✅ Input validation using Joi
- ✅ Rate limiting for API protection
- ✅ Comprehensive error responses
- ✅ Pagination support
- ✅ Search and filtering capabilities

## Next Steps

1. **Database Setup**: Run the SQL schema in your Supabase project
2. **Test Locally**: Use the test scripts to verify API functionality
3. **Add More APIs**: Templates, Campaigns, Sends, etc.
4. **Authentication**: Add JWT middleware for protected routes
5. **Deploy**: Deploy to Render, Vercel, or Railway
