/**
 * Email Logs API Service
 * Handles all email log-related API calls to the backend
 */

import { apiClient } from './apiClient';
import { EmailLog } from '../types';

// Backend email log structure (matches database schema)
interface BackendEmailLog {
  id: string;
  user_id: string;
  template_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  content: string;
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
  sent_at?: string;
  created_at: string;
  message_id?: string;
  users?: {
    id: string;
    name: string;
    email: string;
  };
  templates?: {
    id: string;
    name: string;
    category: string;
  };
}

// Convert backend email log to frontend email log
const convertBackendEmailLogToEmailLog = (backendLog: BackendEmailLog): EmailLog => ({
  id: backendLog.id,
  userId: backendLog.user_id,
  templateId: backendLog.template_id,
  sentAt: new Date(backendLog.sent_at || backendLog.created_at),
  status: backendLog.status,
  errorMessage: backendLog.error_message
});

export const emailLogsApi = {
  /**
   * Get all email logs with optional filtering and pagination
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: 'sent' | 'failed' | 'pending';
    user_id?: string;
    template_id?: string;
    recipient_email?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<{ logs: EmailLog[]; pagination?: any }> {
    const response = await apiClient.get<BackendEmailLog[]>('/api/email-logs', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch email logs');
    }

    return {
      logs: response.data.map(convertBackendEmailLogToEmailLog),
      pagination: response.pagination
    };
  },

  /**
   * Get a single email log by ID
   */
  async getById(id: string): Promise<EmailLog & { 
    recipientEmail?: string;
    recipientName?: string;
    subject?: string;
    content?: string;
  }> {
    const response = await apiClient.get<BackendEmailLog>(`/api/email-logs/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch email log');
    }

    return {
      ...convertBackendEmailLogToEmailLog(response.data),
      recipientEmail: response.data.recipient_email,
      recipientName: response.data.recipient_name,
      subject: response.data.subject,
      content: response.data.content
    };
  },

  /**
   * Create a new email log entry
   */
  async create(logData: {
    user_id: string;
    template_id?: string;
    recipient_email: string;
    recipient_name: string;
    subject: string;
    content: string;
    status: 'sent' | 'failed' | 'pending';
    error_message?: string;
    message_id?: string;
  }): Promise<EmailLog> {
    const response = await apiClient.post<BackendEmailLog>('/api/email-logs', logData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create email log');
    }

    return convertBackendEmailLogToEmailLog(response.data);
  },

  /**
   * Update email log status
   */
  async updateStatus(id: string, data: {
    status: 'sent' | 'failed' | 'pending';
    error_message?: string;
    message_id?: string;
  }): Promise<EmailLog> {
    const response = await apiClient.put<BackendEmailLog>(`/api/email-logs/${id}/status`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update email log status');
    }

    return convertBackendEmailLogToEmailLog(response.data);
  },

  /**
   * Delete an email log
   */
  async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`/api/email-logs/${id}`);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete email log');
    }
  },

  /**
   * Get email statistics
   */
  async getStats(params?: {
    from_date?: string;
    to_date?: string;
  }): Promise<{
    overall: {
      total: number;
      sent: number;
      failed: number;
      pending: number;
      successRate: string;
    };
    daily: Record<string, {
      sent: number;
      failed: number;
      pending: number;
      total: number;
    }>;
    period: {
      from: string;
      to: string;
    };
  }> {
    const response = await apiClient.get<any>('/api/email-logs/stats', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch email stats');
    }

    return response.data;
  }
};
