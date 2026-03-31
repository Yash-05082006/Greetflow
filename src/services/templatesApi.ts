/**
 * Templates API Service
 * Handles all template-related API calls to the backend
 */

import { apiClient } from './apiClient';
import { Template } from '../types';

// Backend template structure (matches database schema)
interface BackendTemplate {
  id: string;
  name: string;
  category: string;
  age_group: string;
  content: string;
  description: string;
  design: any;
  usage_count: number;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

// Convert backend template to frontend template
const convertBackendTemplateToTemplate = (backendTemplate: BackendTemplate): Template => ({
  id: backendTemplate.id,
  name: backendTemplate.name,
  category: backendTemplate.category as 'Birthday' | 'Anniversary' | 'Event Invitation' | 'Greeting',
  ageGroup: backendTemplate.age_group as 'Children (8-15)' | 'Teens (15-18)' | 'Adults (18+)',
  content: backendTemplate.content,
  description: backendTemplate.description,
  design: backendTemplate.design || {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#2c3e50',
    fontFamily: 'Arial, sans-serif'
  },
  usageCount: backendTemplate.usage_count
});

// Convert frontend template to backend format
const convertTemplateToBackendTemplate = (template: Omit<Template, 'id' | 'usageCount'>): any => ({
  name: template.name,
  type: template.category.toLowerCase().replace(' ', '_'),
  age_group: template.ageGroup.includes('8-15') ? '8_15' : 
             template.ageGroup.includes('15-18') ? '15_18' : '18_plus',
  html: template.content,
  description: template.description,
  design: template.design
});

export const templatesApi = {
  /**
   * Get all templates with optional filtering
   */
  async getAll(params?: {
    type?: string;
    age_group?: string;
  }): Promise<Template[]> {
    const response = await apiClient.get<BackendTemplate[]>('/api/templates', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch templates');
    }

    return response.data.map(convertBackendTemplateToTemplate);
  },

  /**
   * Get a single template by ID
   */
  async getById(id: string): Promise<Template> {
    const response = await apiClient.get<BackendTemplate>(`/api/templates/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch template');
    }

    return convertBackendTemplateToTemplate(response.data);
  },

  /**
   * Create a new template
   */
  async create(templateData: Omit<Template, 'id' | 'usageCount'>): Promise<Template> {
    const backendTemplateData = convertTemplateToBackendTemplate(templateData);
    const response = await apiClient.post<BackendTemplate>('/api/templates', backendTemplateData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create template');
    }

    return convertBackendTemplateToTemplate(response.data);
  },

  /**
   * Update an existing template
   */
  async update(id: string, templateData: Omit<Template, 'id' | 'usageCount'>): Promise<Template> {
    const backendTemplateData = convertTemplateToBackendTemplate(templateData);
    const response = await apiClient.put<BackendTemplate>(`/api/templates/${id}`, backendTemplateData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update template');
    }

    return convertBackendTemplateToTemplate(response.data);
  },

  /**
   * Delete a template
   */
  async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`/api/templates/${id}`);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete template');
    }
  },

  /**
   * Get template preview with sample data
   */
  async getPreview(id: string, personId?: string): Promise<{
    id: string;
    name: string;
    type: string;
    age_group: string;
    html: string;
  }> {
    const params = personId ? { personId } : undefined;
    const response = await apiClient.get<any>(`/api/templates/${id}/preview`, params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch template preview');
    }

    return response.data;
  },

  /**
   * Increment template usage count
   * Note: This might be handled automatically by the backend when sending emails
   */
  async incrementUsage(id: string): Promise<void> {
    // This could be a separate endpoint or handled automatically
    // For now, we'll just log it
    console.log(`Template ${id} usage incremented`);
  }
};
