# Greetflow Frontend-Backend Integration Guide

## 🎯 **Integration Overview**

This document outlines the complete integration process for connecting the Greetflow frontend with the backend APIs, replacing all direct Supabase calls.

---

## 📋 **Integration Status**

### ✅ **Completed Steps**

#### **1. API Service Layer Created**
- **`apiClient.ts`** - Centralized HTTP client for all API calls
- **`usersApi.ts`** - Users API service (7 endpoints)
- **`templatesApi.ts`** - Templates API service (6 endpoints)
- **`emailLogsApi.ts`** - Email logs API service (6 endpoints)
- **`emailApi.ts`** - Email sending API service (4 endpoints)

#### **2. New Database Hook Created**
- **`useDatabaseApi.ts`** - Replacement for `useDatabase.ts`
- Uses API services instead of direct Supabase calls
- Maintains same interface for easy component migration

#### **3. Environment Configuration**
- **`.env`** updated with `VITE_API_BASE_URL=http://localhost:4000`
- Backend API base URL configured

---

## 🔄 **Migration Strategy**

### **Phase 1: Update Hooks and Services** ✅ COMPLETE
1. Created API service layer
2. Created new database hook using APIs
3. Configured environment variables

### **Phase 2: Component Migration** 🔄 IN PROGRESS
Replace `useDatabase` with `useDatabaseApi` in all components:

#### **Components to Update:**
1. **Dashboard.tsx** - Main dashboard view
2. **UserManagement.tsx** - User CRUD operations
3. **TemplateManager.tsx** - Template management
4. **EventManager.tsx** - Event handling
5. **Analytics.tsx** - Analytics and statistics
6. **AddEventModal.tsx** - Event creation modal
7. **BulkSendModal.tsx** - Bulk email sending
8. **CustomTemplateCreator.tsx** - Template creation

### **Phase 3: Remove Direct Supabase Dependencies** 📝 PENDING
1. Update or remove `useDatabase.ts` (old hook)
2. Update `emailService.ts` to use API
3. Update `templateService.ts` to use API
4. Remove direct Supabase imports from components

### **Phase 4: Testing & Validation** 📝 PENDING
1. Test each page individually
2. Verify backend logs show API calls
3. Test complete user workflows
4. Validate data consistency

---

## 🔧 **Technical Implementation**

### **API Service Pattern**

```typescript
// Example: Using the new API services
import { usersApi } from '../services/usersApi';

// Fetch all users
const { users, pagination } = await usersApi.getAll({ page: 1, limit: 20 });

// Create a user
const newUser = await usersApi.create(userData);

// Update a user
const updatedUser = await usersApi.update(userId, userData);

// Delete a user
await usersApi.delete(userId);
```

### **Hook Migration Pattern**

```typescript
// OLD (Direct Supabase)
import { useDatabase } from '../hooks/useDatabase';

// NEW (API-based)
import { useDatabaseApi } from '../hooks/useDatabaseApi';

// Usage remains the same
const { users, templates, loading, addUser, updateUser } = useDatabaseApi();
```

---

## 📊 **API Endpoints Mapping**

### **Users API**
| Frontend Operation | Backend Endpoint | Method |
|-------------------|------------------|--------|
| Get all users | `/api/users` | GET |
| Get user by ID | `/api/users/:id` | GET |
| Create user | `/api/users` | POST |
| Update user | `/api/users/:id` | PUT |
| Delete user | `/api/users/:id` | DELETE |
| Get upcoming | `/api/users/upcoming` | GET |
| Get stats | `/api/users/stats/summary` | GET |

### **Templates API**
| Frontend Operation | Backend Endpoint | Method |
|-------------------|------------------|--------|
| Get all templates | `/api/templates` | GET |
| Get template by ID | `/api/templates/:id` | GET |
| Create template | `/api/templates` | POST |
| Update template | `/api/templates/:id` | PUT |
| Delete template | `/api/templates/:id` | DELETE |
| Get preview | `/api/templates/:id/preview` | GET |

### **Email Logs API**
| Frontend Operation | Backend Endpoint | Method |
|-------------------|------------------|--------|
| Get all logs | `/api/email-logs` | GET |
| Get log by ID | `/api/email-logs/:id` | GET |
| Create log | `/api/email-logs` | POST |
| Update status | `/api/email-logs/:id/status` | PUT |
| Delete log | `/api/email-logs/:id` | DELETE |
| Get stats | `/api/email-logs/stats` | GET |

### **Email API**
| Frontend Operation | Backend Endpoint | Method |
|-------------------|------------------|--------|
| Send email | `/api/send-email` | POST |
| Check health | `/api/email-health` | GET |
| Send template email | `/api/demo/template-email` | POST |

---

## 🚀 **Next Steps**

### **Immediate Actions:**

1. **Update Dashboard Component**
   - Replace `useDatabase` with `useDatabaseApi`
   - Test data loading and display
   - Verify backend logs

2. **Update UserManagement Component**
   - Migrate to API-based operations
   - Test CRUD operations
   - Verify error handling

3. **Update TemplateManager Component**
   - Migrate template operations
   - Test template creation/editing
   - Verify preview functionality

4. **Update EventManager Component**
   - Migrate event handling
   - Test email sending
   - Verify logging

5. **Update Analytics Component**
   - Use email logs API for statistics
   - Test data aggregation
   - Verify charts and metrics

---

## ✅ **Validation Checklist**

### **For Each Component:**
- [ ] Replaced `useDatabase` with `useDatabaseApi`
- [ ] Removed direct Supabase imports
- [ ] Tested all CRUD operations
- [ ] Verified error handling
- [ ] Checked loading states
- [ ] Validated data display
- [ ] Confirmed backend logs show API calls

### **System-Wide:**
- [ ] No direct Supabase calls in frontend
- [ ] All data flows through backend APIs
- [ ] Error messages are user-friendly
- [ ] Loading states work correctly
- [ ] Backend logs all requests
- [ ] Data consistency maintained

---

## 🔍 **Debugging Tips**

### **Check Backend Logs:**
```bash
# Backend should log all API requests
[API] GET /api/users
[API Success] /api/users: { success: true, data: [...] }
```

### **Check Browser Console:**
```javascript
// API client logs all requests
[API] GET /api/users
[API Success] /api/users: { success: true, data: [...] }
```

### **Common Issues:**
1. **CORS errors** - Ensure backend CORS is configured
2. **404 errors** - Check API endpoint URLs
3. **Type mismatches** - Verify data structure conversions
4. **Loading states** - Ensure proper async/await handling

---

## 📝 **Notes**

- **No Login Page**: Current app doesn't have authentication, so no login integration needed
- **Direct Navigation**: App uses tab-based navigation without routing
- **Data Persistence**: All data persists in Supabase via backend APIs
- **Real-time Updates**: Currently using polling, can add WebSockets later

---

## 🎯 **Success Criteria**

The integration is complete when:
1. ✅ All components use API services
2. ✅ No direct Supabase calls in frontend
3. ✅ Backend logs show all API requests
4. ✅ All CRUD operations work correctly
5. ✅ Error handling is robust
6. ✅ Loading states are smooth
7. ✅ Data consistency is maintained
8. ✅ User experience is seamless

---

**Last Updated**: November 7, 2025  
**Status**: API Services Created, Component Migration In Progress
