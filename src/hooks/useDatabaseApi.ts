/**
 * Database API Hook
 * Replaces direct Supabase calls with backend API calls
 * This is the new hook that should be used instead of useDatabase
 */

import { useState, useEffect } from 'react';
import { User, Template, EmailLog } from '../types';
import { usersApi } from '../services/usersApi';
import { templatesApi } from '../services/templatesApi';
import { emailLogsApi } from '../services/emailLogsApi';

export const useDatabaseApi = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        loadUsers(),
        loadTemplates(),
        loadEmailLogs()
      ]);
    } catch (err) {
      console.error('API error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data from API');
    } finally {
      setLoading(false);
    }
  };

  // User operations
  const loadUsers = async () => {
    try {
      const { users: fetchedUsers } = await usersApi.getAll();
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
      throw err;
    }
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    try {
      const newUser = await usersApi.create(userData);
      setUsers(prev => [newUser, ...prev]);
      return newUser;
    } catch (err) {
      console.error('Failed to add user:', err);
      throw err;
    }
  };

  const updateUser = async (id: string, userData: Omit<User, 'id'>) => {
    try {
      const updatedUser = await usersApi.update(id, userData);
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
      return updatedUser;
    } catch (err) {
      console.error('Failed to update user:', err);
      throw err;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await usersApi.delete(id);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      console.error('Failed to delete user:', err);
      throw err;
    }
  };

  // Template operations
  const loadTemplates = async () => {
    try {
      const fetchedTemplates = await templatesApi.getAll();
      setTemplates(fetchedTemplates);
    } catch (err) {
      console.error('Failed to load templates:', err);
      throw err;
    }
  };

  const addTemplate = async (templateData: Omit<Template, 'id' | 'usageCount'>) => {
    try {
      const newTemplate = await templatesApi.create(templateData);
      setTemplates(prev => [newTemplate, ...prev]);
      return newTemplate;
    } catch (err) {
      console.error('Failed to add template:', err);
      throw err;
    }
  };

  const updateTemplateUsage = async (templateId: string) => {
    try {
      await templatesApi.incrementUsage(templateId);
      setTemplates(prev => prev.map(template => 
        template.id === templateId 
          ? { ...template, usageCount: template.usageCount + 1 }
          : template
      ));
    } catch (err) {
      console.error('Failed to update template usage:', err);
      // Don't throw - this is not critical
    }
  };

  // Email log operations
  const loadEmailLogs = async () => {
    try {
      const { logs } = await emailLogsApi.getAll({ limit: 100 });
      setEmailLogs(logs);
    } catch (err) {
      console.error('Failed to load email logs:', err);
      throw err;
    }
  };

  const logEmail = async (logData: {
    userId: string;
    templateId?: string;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    content: string;
    status: 'sent' | 'failed' | 'pending';
    errorMessage?: string;
  }) => {
    try {
      const newLog = await emailLogsApi.create({
        user_id: logData.userId,
        template_id: logData.templateId,
        recipient_email: logData.recipientEmail,
        recipient_name: logData.recipientName,
        subject: logData.subject,
        content: logData.content,
        status: logData.status,
        error_message: logData.errorMessage
      });
      
      setEmailLogs(prev => [newLog, ...prev]);
      return newLog;
    } catch (err) {
      console.error('Failed to log email:', err);
      throw err;
    }
  };

  // Utility functions
  const getUpcomingEvents = () => {
    const events: Array<{
      id: string;
      user: User;
      type: 'birthday' | 'anniversary';
      date: Date;
    }> = [];
    
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate());

    users.forEach(user => {
      // Check birthday
      const birthdayThisYear = new Date(today.getFullYear(), user.dateOfBirth.getMonth(), user.dateOfBirth.getDate());
      const birthdayNextYear = new Date(today.getFullYear() + 1, user.dateOfBirth.getMonth(), user.dateOfBirth.getDate());
      
      if (birthdayThisYear >= today && birthdayThisYear <= nextMonth) {
        events.push({
          id: `birthday-${user.id}`,
          user,
          type: 'birthday',
          date: birthdayThisYear
        });
      } else if (birthdayNextYear >= today && birthdayNextYear <= nextMonth) {
        events.push({
          id: `birthday-${user.id}`,
          user,
          type: 'birthday',
          date: birthdayNextYear
        });
      }

      // Check anniversary
      if (user.anniversaryDate) {
        const anniversaryThisYear = new Date(today.getFullYear(), user.anniversaryDate.getMonth(), user.anniversaryDate.getDate());
        const anniversaryNextYear = new Date(today.getFullYear() + 1, user.anniversaryDate.getMonth(), user.anniversaryDate.getDate());
        
        if (anniversaryThisYear >= today && anniversaryThisYear <= nextMonth) {
          events.push({
            id: `anniversary-${user.id}`,
            user,
            type: 'anniversary',
            date: anniversaryThisYear
          });
        } else if (anniversaryNextYear >= today && anniversaryNextYear <= nextMonth) {
          events.push({
            id: `anniversary-${user.id}`,
            user,
            type: 'anniversary',
            date: anniversaryNextYear
          });
        }
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  return {
    users,
    templates,
    emailLogs,
    loading,
    error,
    addUser,
    updateUser,
    deleteUser,
    addTemplate,
    updateTemplateUsage,
    logEmail,
    getUpcomingEvents,
    refreshData: loadAllData
  };
};
