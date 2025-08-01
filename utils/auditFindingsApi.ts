// API service for audit findings management with proper file upload support
const API_BASE_URL = process.env.NEXT_PUBLIC_AUDIT_SERVICE_URL || 'http://localhost:5010';

export interface AuditFindingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  file?: File; // For new files being uploaded
}

export interface AuditFinding {
  id: number;
  name: string;
  audit_id: number;
  audit_name?: string;
  root_cause: string;
  recommendation: string;
  commitment: string;
  commitment_date: string;
  person_in_charge: string;
  status: string;
  progress_pemenuhan: string;
  files?: AuditFindingFile[];
  created_at: string;
  updated_at: string;
}

export interface CreateAuditFindingRequest {
  name: string;
  audit_id: string;
  root_cause: string;
  recommendation: string;
  commitment: string;
  commitment_date: string;
  person_in_charge: string;
  status?: string;
  progress_pemenuhan?: string;
  files?: File[];
}

export interface UpdateAuditFindingRequest {
  name: string;
  audit_id: string;
  root_cause: string;
  recommendation: string;
  commitment: string;
  commitment_date: string;
  person_in_charge: string;
  status: string;
  progress_pemenuhan: string;
  files?: File[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuditOption {
  id: string;
  name: string;
}

class AuditFindingsApiService {
  private getAuthHeaders(token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private getFileUploadHeaders(token?: string) {
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    if (data.success !== undefined) {
      return data;
    }
    
    // If no success field, assume success
    return { success: true, data };
  }

  /**
   * Get all audit findings
   */
  async getAllFindings(token?: string): Promise<ApiResponse<AuditFinding[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/findings`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      return await this.handleResponse<AuditFinding[]>(response);
    } catch (error) {
      console.error('Error fetching audit findings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch audit findings'
      };
    }
  }

  /**
   * Get audit finding by ID
   */
  async getFindingById(id: string, token?: string): Promise<ApiResponse<AuditFinding>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/findings/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      return await this.handleResponse<AuditFinding>(response);
    } catch (error) {
      console.error('Error fetching audit finding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch audit finding'
      };
    }
  }

  /**
   * Create a new audit finding with file uploads using FormData
   */
  async createFinding(findingData: CreateAuditFindingRequest, token?: string): Promise<ApiResponse<AuditFinding>> {
    try {
      console.log('🔍 FINDINGS - createFinding called with data:', findingData);
      
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      
      // Add finding fields
      formData.append('name', findingData.name);
      formData.append('audit_id', findingData.audit_id);
      formData.append('root_cause', findingData.root_cause);
      formData.append('recommendation', findingData.recommendation);
      formData.append('commitment', findingData.commitment);
      formData.append('commitment_date', findingData.commitment_date);
      formData.append('person_in_charge', findingData.person_in_charge);
      formData.append('status', findingData.status || 'not started');
      formData.append('progress_pemenuhan', findingData.progress_pemenuhan || '');
      
      // Add files if provided
      if (findingData.files && findingData.files.length > 0) {
        console.log('🔍 FINDINGS - Adding files to FormData:', findingData.files.length);
        findingData.files.forEach((file, index) => {
          formData.append('files', file);
          console.log(`🔍 FINDINGS - Added file ${index + 1}:`, file.name, file.size, 'bytes');
        });
      }

      // Get auth token
      const authToken = token || localStorage.getItem('token');
      
      // Create headers WITHOUT Content-Type (let browser set it for FormData)
      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      console.log('🔍 FINDINGS - Sending FormData request to:', `${API_BASE_URL}/api/audit/findings`);

      const response = await fetch(`${API_BASE_URL}/api/audit/findings`, {
        method: 'POST',
        headers: headers, // No Content-Type header for FormData
        body: formData,
      });

      console.log('🔍 FINDINGS - Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 FINDINGS - Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('🔍 FINDINGS - Success result:', result);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error creating audit finding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create audit finding'
      };
    }
  }

  /**
   * Update an existing audit finding with file uploads using FormData
   */
  async updateFinding(id: string, findingData: UpdateAuditFindingRequest, token?: string): Promise<ApiResponse<AuditFinding>> {
    try {
      console.log('🔍 FINDINGS - updateFinding called with data:', findingData);
      
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      
      // Add finding fields
      formData.append('name', findingData.name);
      formData.append('audit_id', findingData.audit_id);
      formData.append('root_cause', findingData.root_cause);
      formData.append('recommendation', findingData.recommendation);
      formData.append('commitment', findingData.commitment);
      formData.append('commitment_date', findingData.commitment_date);
      formData.append('person_in_charge', findingData.person_in_charge);
      formData.append('status', findingData.status);
      formData.append('progress_pemenuhan', findingData.progress_pemenuhan);
      
      // Add files if provided
      if (findingData.files && findingData.files.length > 0) {
        console.log('🔍 FINDINGS - Adding files to FormData:', findingData.files.length);
        findingData.files.forEach((file, index) => {
          formData.append('files', file);
          console.log(`🔍 FINDINGS - Added file ${index + 1}:`, file.name, file.size, 'bytes');
        });
      }

      // Get auth token
      const authToken = token || localStorage.getItem('token');
      
      // Create headers WITHOUT Content-Type (let browser set it for FormData)
      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      console.log('🔍 FINDINGS - Sending FormData request to:', `${API_BASE_URL}/api/audit/findings/${id}`);

      const response = await fetch(`${API_BASE_URL}/api/audit/findings/${id}`, {
        method: 'PUT',
        headers: headers, // No Content-Type header for FormData
        body: formData,
      });

      console.log('🔍 FINDINGS - Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 FINDINGS - Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('🔍 FINDINGS - Success result:', result);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating audit finding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update audit finding'
      };
    }
  }

  /**
   * Upload files to an existing finding
   */
  async uploadFindingFiles(findingId: string, files: File[], token?: string): Promise<ApiResponse<AuditFindingFile[]>> {
    try {
      const uploadedFiles: AuditFindingFile[] = [];
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('files', file);

        const response = await fetch(`${API_BASE_URL}/api/audit/findings/${findingId}/files`, {
          method: 'POST',
          headers: this.getFileUploadHeaders(token),
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.files) {
            uploadedFiles.push(...result.files);
          }
        }
      }
      
      return { success: true, data: uploadedFiles };
    } catch (error) {
      console.error('Error uploading files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload files'
      };
    }
  }

  /**
   * Delete an audit finding
   */
  async deleteFinding(id: string, token?: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/findings/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting audit finding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete audit finding'
      };
    }
  }

  /**
   * Get available audits for dropdown
   */
  async getAvailableAudits(token?: string): Promise<ApiResponse<AuditOption[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/findings/audits`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      return await this.handleResponse<AuditOption[]>(response);
    } catch (error) {
      console.error('Error fetching available audits:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch available audits'
      };
    }
  }

  /**
   * Get findings by audit ID
   */
  async getFindingsByAuditId(auditId: string, token?: string): Promise<ApiResponse<AuditFinding[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/findings/audit/${auditId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      return await this.handleResponse<AuditFinding[]>(response);
    } catch (error) {
      console.error('Error fetching findings by audit ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch findings by audit ID'
      };
    }
  }

  /**
   * Download a finding file
   */
  async downloadFindingFile(findingId: string, fileId: string, token?: string): Promise<Blob | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/findings/${findingId}/files/${fileId}/download`, {
        method: 'GET',
        headers: this.getFileUploadHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading finding file:', error);
      return null;
    }
  }

  /**
   * Delete a finding file
   */
  async deleteFindingFile(fileId: string, token?: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/findings/files/${fileId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting finding file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete finding file'
      };
    }
  }
}

export const auditFindingsApiService = new AuditFindingsApiService();
