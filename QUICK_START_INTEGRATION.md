# 🚀 Greetflow Integration - Quick Start Guide

## ⚡ **Quick Setup**

### **1. Start Backend Server**
```bash
cd backend
npm start
# Server runs on http://localhost:4000
```

### **2. Start Frontend**
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

### **3. Verify Integration**
- Open http://localhost:5173
- Check browser console for API logs
- Check backend terminal for API request logs

---

## 📝 **How to Migrate a Component**

### **Simple 3-Step Process:**

**Step 1: Update Import**
```typescript
// Change this:
import { useDatabase } from '../hooks/useDatabase';

// To this:
import { useDatabaseApi } from '../hooks/useDatabaseApi';
```

**Step 2: Update Hook Usage**
```typescript
// Change this:
const { users, templates, loading, addUser } = useDatabase();

// To this:
const { users, templates, loading, addUser } = useDatabaseApi();
```

**Step 3: Test**
- Save the file
- Test the component
- Check backend logs for API calls

That's it! The interface is the same, so your component code doesn't need to change.

---

## 🔍 **Quick Debugging**

### **Check if API is being called:**

**Backend Terminal:**
```
[API] GET /api/users
[API Success] /api/users: { success: true, data: [...] }
```

**Browser Console:**
```javascript
[API] GET /api/users
[API Success] /api/users: { success: true, data: [...] }
```

If you see these logs, integration is working! ✅

---

## ✅ **Already Migrated**

- ✅ Dashboard.tsx
- ✅ UserManagement.tsx
- ✅ TemplateManager.tsx

---

## 🔄 **Still Need to Migrate**

- [ ] EventManager.tsx
- [ ] Analytics.tsx
- [ ] AddEventModal.tsx
- [ ] BulkSendModal.tsx
- [ ] CustomTemplateCreator.tsx
- [ ] AITemplateGenerator.tsx
- [ ] SettingsPanel.tsx

---

## 📚 **API Services Available**

```typescript
// Users
import { usersApi } from '../services/usersApi';
await usersApi.getAll();
await usersApi.create(userData);
await usersApi.update(id, userData);
await usersApi.delete(id);

// Templates
import { templatesApi } from '../services/templatesApi';
await templatesApi.getAll();
await templatesApi.create(templateData);

// Email Logs
import { emailLogsApi } from '../services/emailLogsApi';
await emailLogsApi.getAll();
await emailLogsApi.getStats();

// Email Sending
import { emailApi } from '../services/emailApi';
await emailApi.sendEmail(emailData);
await emailApi.checkHealth();
```

---

## 🎯 **Success Checklist**

For each component you migrate:
- [ ] Changed import to `useDatabaseApi`
- [ ] Component loads without errors
- [ ] Data displays correctly
- [ ] CRUD operations work
- [ ] Backend logs show API calls
- [ ] No direct Supabase calls remain

---

## 🆘 **Need Help?**

Check these documents:
- `INTEGRATION_COMPLETE_SUMMARY.md` - Full details
- `INTEGRATION_PROGRESS.md` - Current status
- `FRONTEND_BACKEND_INTEGRATION_GUIDE.md` - Complete guide

---

**Quick Tip**: The lint warnings about unused imports are not critical. Focus on functionality first, clean up imports later.

**Remember**: All data now flows through backend APIs. No direct Supabase calls in frontend!
