# Greetflow API Stubs - Node.js + Express.js + Supabase

## Setup and Dependencies

```js
// package.json
{
  "name": "greetflow-api",
  "version": "1.0.0",
  "description": "Greetflow backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@supabase/supabase-js": "^2.38.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

```js
// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/greetings', require('./routes/greetings'));
app.use('/api/templates', require('./routes/templates')); // This line was already present
app.use('/api/occasions', require('./routes/occasions'));
app.use('/api/media', require('./routes/media'));
app.use('/api/sends', require('./routes/sends'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// New route for campaigns
app.use('/api/campaigns', require('./routes/campaigns'));
```

## Supabase Configuration

```js
// config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
```

## Users Routes

```js
// routes/users.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, dob, anniversary_date, timezone, consent_email, tags } = req.body;

    const { data, error } = await supabase
      .from('people')
      .insert([{
        first_name,
        last_name,
        email,
        dob,
        anniversary_date,
        timezone: timezone || 'UTC',
        consent_email: consent_email || false,
        tags: tags || []
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: data,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('people')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

## Clients Routes

```js
// routes/clients.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/clients - Get all clients
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('people')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/clients/:id - Get client by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('people')
      .select(`
        *,
        sends(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'Client not found'
    });
  }
});

// GET /api/clients/upcoming - Get upcoming birthdays/anniversaries
router.get('/upcoming', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('consent_email', true)
      .not('dob', 'is', null);

    if (error) throw error;

    // Filter for upcoming birthdays in next N days
    const upcoming = data.filter(person => {
      if (!person.dob) return false;
      const today = new Date();
      const birthday = new Date(today.getFullYear(), person.dob.getMonth(), person.dob.getDate());
      const diffDays = Math.ceil((birthday - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= days;
    });

    res.json({
      success: true,
      data: upcoming,
      count: upcoming.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

## Greetings Routes

```js
// routes/greetings.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/greetings - Get all greetings (sends)
router.get('/', async (req, res) => {
  try {
    const { status, campaign_id, person_id } = req.query;
    
    let query = supabase
      .from('sends')
      .select(`
        *,
        people(first_name, last_name, email),
        templates(name, type),
        campaigns(title)
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (campaign_id) query = query.eq('campaign_id', campaign_id);
    if (person_id) query = query.eq('person_id', person_id);

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/greetings - Send greeting immediately
router.post('/', async (req, res) => {
  try {
    const { person_id, template_id, channel = 'gmail' } = req.body;

    const { data, error } = await supabase
      .from('sends')
      .insert([{
        person_id,
        template_id,
        channel,
        status: 'queued',
        scheduled_for: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: data,
      message: 'Greeting queued for sending'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/greetings/retry - Retry failed greetings
router.post('/retry', async (req, res) => {
  try {
    const { send_ids } = req.body;

    const { data, error } = await supabase
      .from('sends')
      .update({ 
        status: 'queued',
        error_msg: null,
        scheduled_for: new Date().toISOString()
      })
      .in('id', send_ids)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      message: `${data.length} greetings queued for retry`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

## Templates Routes

```js
// routes/templates.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/templates - Get all templates
router.get('/', async (req, res) => {
  try {
    const { type, age_group, is_active } = req.query;
    
    let query = supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);
    if (age_group) query = query.eq('age_group', age_group);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/templates/:id - Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'Template not found'
    });
  }
});

// GET /api/templates/:id/preview - Preview template with sample data
router.get('/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    const { person_id } = req.query;
    
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError) throw templateError;

    // Get person data if person_id provided
    let personData = {};
    if (person_id) {
      const { data: person, error: personError } = await supabase
        .from('people')
        .select('first_name, last_name, email')
        .eq('id', person_id)
        .single();
      
      if (!personError && person) {
        personData = person;
      }
    }

    // Simple template rendering (replace {first_name} etc.)
    let renderedHtml = template.html;
    if (personData.first_name) {
      renderedHtml = renderedHtml.replace(/{first_name}/g, personData.first_name);
      renderedHtml = renderedHtml.replace(/{last_name}/g, personData.last_name || '');
      renderedHtml = renderedHtml.replace(/{email}/g, personData.email || '');
    }

    res.json({
      success: true,
      data: {
        template: template,
        rendered_html: renderedHtml,
        sample_data: personData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/templates - Create new template
router.post('/', async (req, res) => {
  try {
    const { name, type, age_group, html, preview_url, is_active = true } = req.body;

    const { data, error } = await supabase
      .from('templates')
      .insert([{
        name,
        type,
        age_group,
        html,
        preview_url,
        is_active
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: data,
      message: 'Template created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/templates/:id - Update template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      message: 'Template updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

## Occasions Routes

```js
// routes/occasions.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/occasions - Get all occasions (campaigns)
router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    
    let query = supabase
      .from('campaigns')
      .select(`
        *,
        templates(name, type),
        sends(count)
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/occasions - Create new occasion/campaign
router.post('/', async (req, res) => {
  try {
    const { title, type, template_id, audience_query, channel, scheduled_at } = req.body;

    const { data, error } = await supabase
      .from('campaigns')
      .insert([{
        title,
        type,
        template_id,
        audience_query: audience_query || {},
        channel: channel || 'gmail',
        scheduled_at,
        status: scheduled_at ? 'scheduled' : 'draft'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: data,
      message: 'Occasion created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/occasions/:id/send - Trigger campaign send
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;

    // Update campaign status
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ status: 'sent' })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Campaign send triggered'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

## Media Files Routes

```js
// routes/media.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/media - Get all media files
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('file_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/media/upload - Upload media file
router.post('/upload', async (req, res) => {
  try {
    // This is a simplified example - in production, use proper file upload middleware
    const { filename, file_path, file_size, mime_type, entity_type, entity_id } = req.body;

    const { data, error } = await supabase
      .from('file_uploads')
      .insert([{
        original_filename: filename,
        stored_filename: filename,
        file_path,
        file_size,
        mime_type,
        entity_type,
        entity_id,
        is_public: false
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: data,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

## Environment Variables

```bash
# .env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
PORT=3000
NODE_ENV=development
```

## Next Steps

### 1. Connect to Supabase

1. **Install dependencies:**
   ```bash
   npm install express @supabase/supabase-js cors helmet dotenv
   npm install -D nodemon
   ```

2. **Set up environment variables:**
   - Copy `.env` file with your Supabase credentials
   - Get your Supabase URL and anon key from your project dashboard

3. **Test the connection:**
   ```bash
   npm run dev
   ```

### 2. Test Routes Locally with Postman

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Test endpoints:**
   - `GET http://localhost:3000/health` - Health check
   - `GET http://localhost:3000/api/users` - Get all users
   - `POST http://localhost:3000/api/users` - Create user
   - `GET http://localhost:3000/api/templates` - Get templates
   - `GET http://localhost:3000/api/clients/upcoming` - Get upcoming birthdays

3. **Sample POST request body:**
   ```json
   {
     "first_name": "John",
     "last_name": "Doe",
     "email": "john@example.com",
     "dob": "1990-01-01",
     "timezone": "UTC",
     "consent_email": true,
     "tags": ["vip"]
   }
   ```

### 3. Deploy to Cloud Platforms

#### Option A: Render (Recommended)
1. **Create `render.yaml`:**
   ```yaml
   services:
     - type: web
       name: greetflow-api
       env: node
       buildCommand: npm install
       startCommand: npm start
       envVars:
         - key: SUPABASE_URL
           sync: false
         - key: SUPABASE_KEY
           sync: false
   ```

2. **Deploy:**
   - Connect your GitHub repository
   - Add environment variables in Render dashboard
   - Deploy automatically on git push

#### Option B: Vercel
1. **Create `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

2. **Deploy:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

#### Option C: Railway
1. **Create `railway.toml`:**
   ```toml
   [build]
   builder = "nixpacks"
   
   [deploy]
   startCommand = "npm start"
   ```

2. **Deploy:**
   - Connect GitHub repository
   - Add environment variables
   - Auto-deploy on push

### 4. Production Considerations

- **Add authentication middleware** for protected routes
- **Implement rate limiting** with `express-rate-limit`
- **Add request validation** with `joi` or `yup`
- **Set up logging** with `winston` or `pino`
- **Add monitoring** with services like Sentry
- **Configure CORS** properly for your frontend domain
- **Set up database backups** in Supabase dashboard
