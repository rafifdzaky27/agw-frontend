// API service for audit universe management
const API_BASE_URL = process.env.NEXT_PUBLIC_AUDIT_SERVICE_URL || 'http://localhost:5010';

export interface AuditFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  file?: File; // For new files being uploaded
}

export interface Audit {
  id: string;
  name: string;
  category: "Internal" | "Regulatory" | "External";
  auditor: string;
  date: string; // Format: YYYY-MM
  scope: string;
  files: AuditFile[];
  createdAt?: string;
  updatedAt?: string;
  created_at?: string; // Backend snake_case
  updated_at?: string; // Backend snake_case
}

export interface CreateAuditRequest {
  name: string;
  category: "Internal" | "Regulatory" | "External";
  auditor: string;
  date: string;
  scope: string;
  files?: File[]; // Files to upload
}

export interface UpdateAuditRequest {
  name: string;
  category: "Internal" | "Regulatory" | "External";
  auditor: string;
  date: string;
  scope: string;
  files?: File[]; // New files to upload
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
}

class AuditApiService {
  private getAuthHeaders(token?: string): HeadersInit {
    const authToken = token || localStorage.getItem('token');
    return {
      'Authorization': authToken ? `Bearer ${authToken}` : '',
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Handle backend response format { success: true, data: ... }
      const data = responseData.success ? responseData.data : responseData;
      
      return {
        success: true,
        data: data,
        count: Array.isArray(data) ? data.length : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all audits with optional filtering
   */
  async getAllAudits(token?: string, filters?: { 
    category?: string; 
    year?: string; 
    search?: string; 
  }): Promise<ApiResponse<Audit[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.category) {
        queryParams.append('category', filters.category);
      }
      
      if (filters?.year) {
        queryParams.append('year', filters.year);
      }
      
      if (filters?.search) {
        queryParams.append('search', filters.search);
      }

      const url = `${API_BASE_URL}/api/audit/audits${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('🔍 DEBUG - Fetching audits from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      console.log('🔍 DEBUG - Fetch response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view audits.');
        } else if (response.status === 404) {
          throw new Error('Audit service not found. Please contact support.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(errorMessage);
      }

      return await this.handleResponse<Audit[]>(response);
    } catch (error) {
      console.error('❌ Error fetching audits:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch audits'
      };
    }
  }

  /**
   * Get an audit by ID
   */
  async getAuditById(id: string, token?: string): Promise<ApiResponse<Audit>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/audits/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      return await this.handleResponse<Audit>(response);
    } catch (error) {
      console.error('Error fetching audit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch audit'
      };
    }
  }

  /**
   * Create a new audit
   */
  async createAudit(auditData: CreateAuditRequest, token?: string): Promise<ApiResponse<Audit>> {
    try {
      const formData = new FormData();
      
      // Add audit data
      formData.append('name', auditData.name);
      formData.append('category', auditData.category);
      formData.append('auditor', auditData.auditor);
      formData.append('date', auditData.date);
      formData.append('scope', auditData.scope);
      
      // Add files if any
      if (auditData.files && auditData.files.length > 0) {
        auditData.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/audit/audits`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: formData,
      });

      return await this.handleResponse<Audit>(response);
    } catch (error) {
      console.error('Error creating audit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create audit'
      };
    }
  }

  /**
   * Update an existing audit
   */
  async updateAudit(id: string, auditData: UpdateAuditRequest, token?: string): Promise<ApiResponse<Audit>> {
    try {
      const formData = new FormData();
      
      // Add audit data
      formData.append('name', auditData.name);
      formData.append('category', auditData.category);
      formData.append('auditor', auditData.auditor);
      formData.append('date', auditData.date);
      formData.append('scope', auditData.scope);
      
      // Add new files if any
      if (auditData.files && auditData.files.length > 0) {
        auditData.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/audit/audits/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(token),
        body: formData,
      });

      return await this.handleResponse<Audit>(response);
    } catch (error) {
      console.error('Error updating audit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update audit'
      };
    }
  }

  /**
   * Delete an audit by ID
   */
  async deleteAudit(id: string, token?: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/audits/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(token),
      });

      return await this.handleResponse<void>(response);
    } catch (error) {
      console.error('Error deleting audit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete audit'
      };
    }
  }

  /**
   * Delete multiple audits
   */
  async deleteMultipleAudits(auditIds: string[], token?: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/audits/delete-multiple`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auditIds }),
      });

      return await this.handleResponse<void>(response);
    } catch (error) {
      console.error('Error deleting multiple audits:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete audits'
      };
    }
  }

  /**
   * Upload files to an existing audit
   */
  async uploadAuditFiles(auditId: string, files: File[], token?: string): Promise<ApiResponse<AuditFile[]>> {
    try {
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/api/audit/audits/${auditId}/files`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: formData,
      });

      return await this.handleResponse<AuditFile[]>(response);
    } catch (error) {
      console.error('Error uploading files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload files'
      };
    }
  }

  /**
   * Download an audit file
   */
  async downloadAuditFile(auditId: string, fileId: string, token?: string): Promise<Blob | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/audits/${auditId}/files/${fileId}/download`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  }

  /**
   * Delete an audit file
   */
  async deleteAuditFile(fileId: string, token?: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/audits/files/${fileId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(token),
      });

      return await this.handleResponse<void>(response);
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file'
      };
    }
  }
}

// Export singleton instance
export const auditApiService = new AuditApiService();
