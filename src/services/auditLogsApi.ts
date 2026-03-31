import { apiClient } from './apiClient';

// Types
export interface AuditLog {
  id: string;
  actor: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  recipient_name: string;
  subject: string;
  status: string;
  sent_at: string;
  meta: Record<string, any>;
  created_at: string;
}

export interface EmailHistoryItem {
  id: string;
  recipient_name: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  sent_at: string;
  actor: string | null;
  action: string;
  template_id?: string;
  user_id?: string;
  error_message?: string;
}

export interface AuditLogStats {
  total: number;
  emails: number;
  recent24h: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  pagination: PaginationInfo;
}

export interface EmailHistoryResponse {
  data: EmailHistoryItem[];
  pagination: PaginationInfo;
}

/**
 * Audit Logs API Service
 * Handles all audit log-related API calls
 */
export const auditLogsApi = {
  /**
   * Get all audit logs with pagination and filtering
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
    sort?: 'asc' | 'desc';
  }): Promise<AuditLogsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.action) queryParams.append('action', params.action);
    if (params?.entity) queryParams.append('entity', params.entity);
    if (params?.sort) queryParams.append('sort', params.sort);

    const url = `/api/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<AuditLogsResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch audit logs');
    }

    return response.data;
  },

  /**
   * Get email history (email-specific audit logs)
   */
  async getEmailHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<EmailHistoryResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/audit-logs/email-history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<EmailHistoryResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch email history');
    }

    return response.data;
  },

  /**
   * Get audit log statistics
   */
  async getStats(): Promise<AuditLogStats> {
    const response = await apiClient.get<{ data: AuditLogStats }>('/api/audit-logs/stats');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch audit log statistics');
    }

    return response.data.data;
  },

  /**
   * Get a single audit log by ID
   */
  async getById(id: string): Promise<AuditLog> {
    const response = await apiClient.get<{ data: AuditLog }>(`/api/audit-logs/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch audit log');
    }

    return response.data.data;
  }
};
