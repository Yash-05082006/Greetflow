/**
 * API Client for Greetflow Backend
 * Centralized HTTP client for all backend API communications
 */

const API_BASE_URL: string = import.meta.env.VITE_API_URL as string;

console.log('[apiClient] FINAL API BASE URL:', API_BASE_URL);


interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      console.log(`[API] ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.error(`[API Error] ${endpoint} (HTTP ${response.status}):`, data);
        const errMsg = typeof data.error === 'string'
          ? data.error
          : (data.error?.message || data.message || `API request failed (${response.status})`);
        throw new Error(errMsg);
      }

      console.log(`[API Success] ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`[API Exception] ${endpoint}:`, error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  // POST request (JSON)
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // POST request (multipart/form-data — for file uploads)
  // DO NOT set Content-Type here; the browser must compute the boundary.
  async postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    try {
      console.log(`[API] POST (multipart) ${endpoint}`);
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // No Content-Type header — browser sets it with the correct boundary
      });
      const data = await response.json();
      if (!response.ok) {
        console.error(`[API Error] ${endpoint}:`, data);
        throw new Error(data.error?.message || data.error || 'Upload failed');
      }
      console.log(`[API Success] ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`[API Exception] ${endpoint}:`, error);
      throw error;
    }
  }

  // PUT request
  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // GET binary file (for downloads — returns a Blob)
  async getBlob(endpoint: string): Promise<Blob> {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`[API] GET (blob) ${endpoint}`);
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Download failed: HTTP ${response.status}`);
    }
    return response.blob();
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export API base URL for reference
export { API_BASE_URL };
