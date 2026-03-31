/**
 * Users API Service
 * Handles all user-related API calls to the backend
 */

import { apiClient } from './apiClient';
import { User } from '../types';

// Backend user structure (matches database schema)
interface BackendUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  date_of_birth: string;
  anniversary_date?: string;
  preferences: string[];
  created_at: string;
  updated_at: string;
}

// Convert backend user to frontend user
const convertBackendUserToUser = (backendUser: BackendUser): User => ({
  id: backendUser.id,
  name: backendUser.name,
  email: backendUser.email,
  phone: backendUser.phone,
  category: (backendUser.category as 'Lead' | 'Client' | 'User') || 'User',
  dateOfBirth: new Date(backendUser.date_of_birth),
  anniversaryDate: backendUser.anniversary_date ? new Date(backendUser.anniversary_date) : undefined,
  preferences: backendUser.preferences || []
});

// Convert frontend user to backend format
const convertUserToBackendUser = (user: Omit<User, 'id'>): Omit<BackendUser, 'id' | 'created_at' | 'updated_at'> => ({
  name: user.name,
  email: user.email,
  phone: user.phone,
  category: user.category,
  date_of_birth: user.dateOfBirth.toISOString().split('T')[0],
  anniversary_date: user.anniversaryDate ? user.anniversaryDate.toISOString().split('T')[0] : undefined,
  preferences: user.preferences || []
});

export const usersApi = {
  /**
   * Get all users with optional filtering and pagination
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }): Promise<{ users: User[]; pagination?: any }> {
    const response = await apiClient.get<BackendUser[]>('/api/users', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch users');
    }

    return {
      users: response.data.map(convertBackendUserToUser),
      pagination: response.pagination
    };
  },

  /**
   * Get a single user by ID
   */
  async getById(id: string): Promise<User> {
    const response = await apiClient.get<BackendUser>(`/api/users/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user');
    }

    return convertBackendUserToUser(response.data);
  },

  /**
   * Create a new user
   */
  async create(userData: Omit<User, 'id'>): Promise<User> {
    const backendUserData = convertUserToBackendUser(userData);
    const response = await apiClient.post<BackendUser>('/api/users', backendUserData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create user');
    }

    return convertBackendUserToUser(response.data);
  },

  /**
   * Update an existing user
   */
  async update(id: string, userData: Omit<User, 'id'>): Promise<User> {
    const backendUserData = convertUserToBackendUser(userData);
    const response = await apiClient.put<BackendUser>(`/api/users/${id}`, backendUserData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update user');
    }

    return convertBackendUserToUser(response.data);
  },

  /**
   * Delete a user
   */
  async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`/api/users/${id}`);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete user');
    }
  },

  /**
   * Get users with upcoming birthdays/anniversaries
   */
  async getUpcoming(params?: {
    days?: number;
    type?: 'birthday' | 'anniversary';
  }): Promise<User[]> {
    const response = await apiClient.get<BackendUser[]>('/api/users/upcoming', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch upcoming users');
    }

    return response.data.map(convertBackendUserToUser);
  },

  /**
   * Get user statistics
   */
  async getStats(): Promise<{
    totalUsers: number;
    recentUsers: number;
    categoryCounts: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalUsers: number;
      recentUsers: number;
      categoryCounts: Record<string, number>;
    }>('/api/users/stats/summary');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user stats');
    }

    return response.data;
  }
};
