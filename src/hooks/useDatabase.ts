import { useState, useEffect } from 'react';
import { supabase, DatabaseUser, DatabaseTemplate, DatabaseEmailLog } from '../lib/supabase';
import { User, Template, EmailLog } from '../types';

// Conversion functions between database and app types
const convertDatabaseUserToUser = (dbUser: DatabaseUser): User => ({
  id: dbUser.id,
  name: dbUser.name,
  email: dbUser.email,
  phone: dbUser.phone,
  category: dbUser.category,
  dateOfBirth: new Date(dbUser.date_of_birth),
  anniversaryDate: dbUser.anniversary_date ? new Date(dbUser.anniversary_date) : undefined,
  preferences: dbUser.preferences || []
});

const convertUserToDatabaseUser = (user: Omit<User, 'id'>): Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'> => ({
  name: user.name,
  email: user.email,
  phone: user.phone,
  category: user.category,
  date_of_birth: user.dateOfBirth.toISOString().split('T')[0],
  anniversary_date: user.anniversaryDate ? user.anniversaryDate.toISOString().split('T')[0] : undefined,
  preferences: user.preferences || []
});

const convertDatabaseTemplateToTemplate = (dbTemplate: DatabaseTemplate): Template => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  category: dbTemplate.category,
  ageGroup: dbTemplate.age_group,
  content: dbTemplate.content,
  description: dbTemplate.description,
  design: dbTemplate.design,
  usageCount: dbTemplate.usage_count
});

export const useDatabase = () => {
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
      console.error('Database error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data from database');
    } finally {
      setLoading(false);
    }
  };

  // User operations
  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setUsers(data.map(convertDatabaseUserToUser));
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    const dbUserData = convertUserToDatabaseUser(userData);
    
    const { data, error } = await supabase
      .from('users')
      .insert([dbUserData])
      .select()
      .single();

    if (error) throw error;
    
    const newUser = convertDatabaseUserToUser(data);
    setUsers(prev => [newUser, ...prev]);
    return newUser;
  };

  const updateUser = async (id: string, userData: Omit<User, 'id'>) => {
    const dbUserData = convertUserToDatabaseUser(userData);
    
    const { data, error } = await supabase
      .from('users')
      .update(dbUserData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    const updatedUser = convertDatabaseUserToUser(data);
    setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
    return updatedUser;
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  // Template operations
  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('usage_count', { ascending: false });

    if (error) throw error;
    setTemplates(data.map(convertDatabaseTemplateToTemplate));
  };

  const addTemplate = async (templateData: Omit<Template, 'id' | 'usageCount'>) => {
    const { data, error } = await supabase
      .from('templates')
      .insert([{
        name: templateData.name,
        category: templateData.category,
        age_group: templateData.ageGroup,
        content: templateData.content,
        description: templateData.description,
        design: templateData.design,
        usage_count: 0,
        is_custom: true
      }])
      .select()
      .single();

    if (error) throw error;
    
    const newTemplate = convertDatabaseTemplateToTemplate(data);
    setTemplates(prev => [newTemplate, ...prev]);
    return newTemplate;
  };

  const updateTemplateUsage = async (templateId: string) => {
    const { error } = await supabase
      .from('templates')
      .update({ usage_count: supabase.sql`usage_count + 1` })
      .eq('id', templateId);

    if (error) throw error;
    
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, usageCount: template.usageCount + 1 }
        : template
    ));
  };

  // Email log operations
  const loadEmailLogs = async () => {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    
    setEmailLogs(data.map(log => ({
      id: log.id,
      userId: log.user_id,
      templateId: log.template_id,
      sentAt: new Date(log.sent_at || log.created_at),
      status: log.status as 'sent' | 'failed' | 'pending',
      errorMessage: log.error_message
    })));
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
    const { data, error } = await supabase
      .from('email_logs')
      .insert([{
        user_id: logData.userId,
        template_id: logData.templateId,
        recipient_email: logData.recipientEmail,
        recipient_name: logData.recipientName,
        subject: logData.subject,
        content: logData.content,
        status: logData.status,
        error_message: logData.errorMessage,
        sent_at: logData.status === 'sent' ? new Date().toISOString() : null
      }])
      .select()
      .single();

    if (error) throw error;
    
    const newLog: EmailLog = {
      id: data.id,
      userId: data.user_id,
      templateId: data.template_id,
      sentAt: new Date(data.sent_at || data.created_at),
      status: data.status as 'sent' | 'failed' | 'pending',
      errorMessage: data.error_message
    };
    
    setEmailLogs(prev => [newLog, ...prev]);
    return newLog;
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
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate()); // Extended to 2 months for better visibility

    users.forEach(user => {
      // Check birthday
      const birthdayThisYear = new Date(today.getFullYear(), user.dateOfBirth.getMonth(), user.dateOfBirth.getDate());
      const birthdayNextYear = new Date(today.getFullYear() + 1, user.dateOfBirth.getMonth(), user.dateOfBirth.getDate());
      
      // Check if birthday already passed this year, use next year's date
      const relevantBirthday = birthdayThisYear < today ? birthdayNextYear : birthdayThisYear;
      
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
        
        const relevantAnniversary = anniversaryThisYear < today ? anniversaryNextYear : anniversaryThisYear;
        
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