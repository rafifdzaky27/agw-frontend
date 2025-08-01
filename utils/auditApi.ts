// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5010';

// Types
export interface Audit {
  id: number;
  name: string;
  category: string;
  scope: string;
  auditor: string;
  date: string;
  created_at: string;
  updated_at: string;
  files: AuditFile[];
  findings?: any[];
}

export interface AuditFile {
  id: string | number;
  filename?: string;
  original_name?: string;
  name?: string;
  file_size?: number;
  size?: number;
  file_type?: string;
  type?: string;
  created_at?: string;
  uploadedAt?: string;
  audit_id?: number;
  file?: File;
}

export interface CreateAuditRequest {
  name: string;
  category: string;
  scope: string;
  auditor: string;
  date: string;
  files?: File[];
}

export interface UpdateAuditRequest {
  name?: string;
  category?: string;
  scope?: string;
  auditor?: string;
  date?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class AuditApi {
  private getAuthHeaders(token?: string): HeadersInit {
    const authToken = token || localStorage.getItem('token');
    return {
      'Authorization': authToken ? `Bearer ${authToken}` : '',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get all audits
   */
  async getAllAudits(token?: string): Promise<ApiResponse<Audit[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/audits`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching audits:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch audits'
      };
    }
  }

  /**
   * Get audit by ID
   */
  async getAuditById(id: number, token?: string): Promise<ApiResponse<Audit>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/audits/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching audit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch audit'
      };
    }
  }

  /**
   * Create a new audit with file uploads using FormData
   */
  async createAudit(auditData: CreateAuditRequest, token?: string): Promise<ApiResponse<Audit>> {
    try {
      console.log('🔍 FIXED - createAudit called with data:', auditData);
      
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      
      // Add audit fields
      formData.append('name', auditData.name);
      formData.append('category', auditData.category);
      formData.append('auditor', auditData.auditor);
      formData.append('date', auditData.date);
      formData.append('scope', auditData.scope);
      
      // Add files if provided
      if (auditData.files && auditData.files.length > 0) {
        console.log('🔍 FIXED - Adding files to FormData:', auditData.files.length);
        auditData.files.forEach((file, index) => {
          formData.append('files', file);
          console.log(`🔍 FIXED - Added file ${index + 1}:`, file.name, file.size, 'bytes');
        });
      }

      // Get auth token
      const authToken = token || localStorage.getItem('token');
      
      // Create headers WITHOUT Content-Type (let browser set it for FormData)
      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      console.log('🔍 FIXED - Sending FormData request to:', `${API_BASE_URL}/api/audit/audits`);

      const response = await fetch(`${API_BASE_URL}/api/audit/audits`, {
        method: 'POST',
        headers: headers, // No Content-Type header for FormData
        body: formData,
      });

      console.log('🔍 FIXED - Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 FIXED - Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('🔍 FIXED - Success result:', result);
      
      return { success: true, data: result };
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
  async updateAudit(id: number, auditData: UpdateAuditRequest, token?: string): Promise<ApiResponse<Audit>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/audits/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(auditData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating audit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update audit'
      };
    }
  }

  /**
   * Delete an audit
   */
  async deleteAudit(id: number, token?: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/audits/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting audit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete audit'
      };
    }
  }
}

export const auditApi = new AuditApi();
export const auditApiService = new AuditApi(); // Keep both exports for compatibility
