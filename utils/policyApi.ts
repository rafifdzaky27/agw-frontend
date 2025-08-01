import { getValidToken, clearAuthData } from './tokenUtils';

// API service for policy management
const API_BASE_URL = process.env.NEXT_PUBLIC_POLICY_API_BASE_URL || 'http://localhost:5010';

console.log('Policy API Base URL:', API_BASE_URL);

export interface PolicyApiResponse {
  id: number;
  no_dokumen: string;
  nama_dokumen: string;
  tanggal_dokumen: string;
  kategori: 'Kebijakan' | 'SOP' | 'Pedoman' | 'Petunjuk Teknis';
  file_path?: string;
  file_name?: string;
  file_size?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePolicyRequest {
  no_dokumen: string;
  nama_dokumen: string;
  tanggal_dokumen: string;
  kategori: 'Kebijakan' | 'SOP' | 'Pedoman' | 'Petunjuk Teknis';
  created_by: string;
}

export interface UpdatePolicyRequest {
  no_dokumen?: string;
  nama_dokumen?: string;
  tanggal_dokumen?: string;
  kategori?: 'Kebijakan' | 'SOP' | 'Pedoman' | 'Petunjuk Teknis';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
}

class PolicyApiService {
  private getAuthHeaders(token?: string): HeadersInit {
    const authToken = token || getValidToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : '',
    };
  }

  private getFileUploadHeaders(token?: string): HeadersInit {
    const authToken = token || getValidToken();
    return {
      'Authorization': authToken ? `Bearer ${authToken}` : '',
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    console.log('API Response Status:', response.status);
    console.log('API Response URL:', response.url);
    
    // Handle token validation errors
    if (response.status === 401) {
      const errorText = await response.text();
      if (errorText.includes('Invalid token') || errorText.includes('Unauthorized')) {
        // Clear invalid token from localStorage
        clearAuthData();
        throw new Error('Invalid token. Please login again.');
      }
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Non-JSON response received:', textResponse);
      
      if (response.status === 404) {
        throw new Error('Policy API endpoint not found. Please check if the backend server is running on port 5010.');
      }
      
      throw new Error(`Server returned non-JSON response. Status: ${response.status}. Please check backend server.`);
    }
    
    const data = await response.json();
    console.log('API Response Data:', data);
    
    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401 && (data.error === 'Invalid token' || data.message === 'Invalid token')) {
        clearAuthData();
        throw new Error('Invalid token. Please login again.');
      }
      
      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection to Policy API:', `${API_BASE_URL}/api/policies`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/api/policies`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit',
      });
      
      clearTimeout(timeoutId);
      console.log('Connection test response:', response.status, response.statusText);
      
      // 401 means server is running but needs auth - that's good
      return response.status === 401 || response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get all policies with optional filtering
   */
  async getAllPolicies(token?: string, filters?: { kategori?: string; search?: string }): Promise<ApiResponse<PolicyApiResponse[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.kategori) {
        queryParams.append('kategori', filters.kategori);
      }
      
      if (filters?.search) {
        queryParams.append('search', filters.search);
      }

      const url = `${API_BASE_URL}/api/policies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Fetching policies from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
        mode: 'cors',
        credentials: 'omit',
      });

      return await this.handleResponse<PolicyApiResponse[]>(response);
    } catch (error) {
      console.error('Error fetching policies:', error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to Policy Management server. Please check if the backend is running on port 5010 and CORS is configured properly.');
      }
      
      throw error;
    }
  }

  /**
   * Get a policy by ID
   */
  async getPolicyById(id: number, token?: string): Promise<ApiResponse<PolicyApiResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/policies/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      return await this.handleResponse<PolicyApiResponse>(response);
    } catch (error) {
      console.error('Error fetching policy:', error);
      throw error;
    }
  }

  /**
   * Create a new policy
   */
  async createPolicy(policyData: CreatePolicyRequest, token?: string): Promise<ApiResponse<PolicyApiResponse>> {
    try {
      console.log('Creating policy with data:', policyData);
      console.log('API URL:', `${API_BASE_URL}/api/policies`);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_BASE_URL}/api/policies`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(policyData),
      });

      console.log('Create policy response status:', response.status);
      return await this.handleResponse<PolicyApiResponse>(response);
    } catch (error) {
      console.error('Error creating policy:', error);
      throw error;
    }
  }

  /**
   * Update a policy
   */
  async updatePolicy(id: number, policyData: UpdatePolicyRequest, token?: string): Promise<ApiResponse<PolicyApiResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/policies/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(policyData),
      });

      return await this.handleResponse<PolicyApiResponse>(response);
    } catch (error) {
      console.error('Error updating policy:', error);
      throw error;
    }
  }

  /**
   * Delete a policy
   */
  async deletePolicy(id: number, token?: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/policies/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(token),
      });

      return await this.handleResponse<void>(response);
    } catch (error) {
      console.error('Error deleting policy:', error);
      throw error;
    }
  }

  /**
   * Upload file for a policy
   */
  async uploadPolicyFile(policyId: number, file: File, token?: string): Promise<ApiResponse<{ file_path: string; file_name: string; file_size: number }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/policies/${policyId}/upload`, {
        method: 'POST',
        headers: this.getFileUploadHeaders(token),
        body: formData,
      });

      return await this.handleResponse<{ file_path: string; file_name: string; file_size: number }>(response);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Download policy file
   */
  async downloadPolicyFile(policyId: number, token?: string): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/policies/${policyId}/download`, {
        method: 'GET',
        headers: this.getFileUploadHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Delete policy file
   */
  async deletePolicyFile(policyId: number, token?: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/policies/${policyId}/file`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(token),
      });

      return await this.handleResponse<void>(response);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const policyApiService = new PolicyApiService();
