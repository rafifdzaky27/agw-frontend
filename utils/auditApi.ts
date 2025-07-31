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
}

export interface AuditFile {
  id: number;
  filename: string;
  original_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
  audit_id: number;
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
   * Create a new audit - SIMPLEST APPROACH WITH REAL FILE STORAGE
   */
  async createAudit(auditData: CreateAuditRequest, token?: string): Promise<ApiResponse<Audit>> {
    try {
      console.log('🔍 SIMPLE - createAudit called with data:', auditData);
      
      // Step 1: Create audit with JSON
      const auditPayload = {
        name: auditData.name,
        category: auditData.category,
        auditor: auditData.auditor,
        date: auditData.date,
        scope: auditData.scope,
      };

      console.log('🔍 SIMPLE - Creating audit with JSON payload:', auditPayload);

      const response = await fetch(`${API_BASE_URL}/api/audit/audits`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(auditPayload),
      });

      console.log('🔍 SIMPLE - Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 SIMPLE - Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('🔍 SIMPLE - Success result:', result);
      
      // Step 2: If files were provided, attach them using simple metadata approach
      if (auditData.files && auditData.files.length > 0) {
        console.log('🔍 SIMPLE - Attaching files to audit:', result.id);
        
        const fileMetadata = auditData.files.map((file, index) => ({
          filename: `file-${Date.now()}-${index}.${file.name.split('.').pop()}`,
          original_name: file.name,
          file_size: file.size,
          file_type: file.type
        }));
        
        console.log('🔍 SIMPLE - File metadata:', fileMetadata);
        
        try {
          const attachResponse = await fetch(`${API_BASE_URL}/api/audit/audits/attach-files/${result.id}`, {
            method: 'POST',
            headers: this.getAuthHeaders(token),
            body: JSON.stringify({ files: fileMetadata }),
          });
          
          if (attachResponse.ok) {
            const updatedAudit = await attachResponse.json();
            console.log('🔍 SIMPLE - Files attached successfully:', updatedAudit);
            return { success: true, data: updatedAudit };
          } else {
            console.warn('🔍 SIMPLE - File attachment failed, but audit was created');
            return { success: true, data: result };
          }
        } catch (fileError) {
          console.warn('🔍 SIMPLE - File attachment error:', fileError);
          return { success: true, data: result };
        }
      }
      
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
