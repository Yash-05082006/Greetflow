/**
 * Email API Service
 * Handles email sending operations through the backend
 */

import { apiClient } from './apiClient';

export interface SendEmailRequest {
  to: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  text?: string;
  attachments?: any[];
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

export interface EmailHealthResponse {
  success: boolean;
  status: string;
  message: string;
  timestamp: string;
}

export const emailApi = {
  /**
   * Send a personalized email
   */
  async sendEmail(emailData: SendEmailRequest): Promise<SendEmailResponse> {
    const response = await apiClient.post<SendEmailResponse>('/api/send-email', emailData);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to send email');
    }

    return {
      success: response.success,
      message: response.message || 'Email sent successfully',
      messageId: response.data?.messageId
    };
  },

  /**
   * Check SMTP connection health
   */
  async checkHealth(): Promise<EmailHealthResponse> {
    const response = await apiClient.get<EmailHealthResponse>('/api/email-health');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check email health');
    }

    return response.data;
  },

  /**
   * Send template-based email (demo endpoint)
   */
  async sendTemplateEmail(data: {
    userNames?: string[];
    templateId?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const response = await apiClient.post<any>('/api/demo/template-email', data);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to send template email');
    }

    return {
      success: response.success,
      message: response.message || 'Template email sent successfully',
      data: response.data
    };
  },

  /**
   * Send bulk emails to multiple recipients
   */
  async sendBulkEmails(emails: SendEmailRequest[]): Promise<{
    total: number;
    sent: number;
    failed: number;
    results: SendEmailResponse[];
  }> {
    const results: SendEmailResponse[] = [];
    let sent = 0;
    let failed = 0;

    for (const emailData of emails) {
      try {
        const result = await this.sendEmail(emailData);
        results.push(result);
        sent++;
      } catch (error) {
        results.push({
          success: false,
          message: error instanceof Error ? error.message : 'Failed to send email'
        });
        failed++;
      }
    }

    return {
      total: emails.length,
      sent,
      failed,
      results
    };
  }
};
