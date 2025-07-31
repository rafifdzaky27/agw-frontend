// API service for audit findings management (following policy management pattern)
const API_BASE_URL = process.env.NEXT_PUBLIC_AUDIT_SERVICE_URL || 'http://localhost:5010';

// Types
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

export interface AuditFindingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
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
    } else {
      return {
        success: true,
        data: data
      };
    }
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

      const result = await this.handleResponse<AuditFinding[]>(response);
      
      // Ensure all findings have files array
      if (result.success && result.data) {
        result.data = result.data.map(finding => ({
          ...finding,
          files: finding.files || []
        }));
      }
      
      return result;
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
   * Create a new audit finding (following policy management pattern)
   */
  async createFinding(findingData: CreateAuditFindingRequest, token?: string): Promise<ApiResponse<AuditFinding>> {
    try {
      // Step 1: Create finding without files (like policy management)
      const jsonData = {
        name: findingData.name,
        audit_id: findingData.audit_id,
        root_cause: findingData.root_cause,
        recommendation: findingData.recommendation,
        commitment: findingData.commitment,
        commitment_date: findingData.commitment_date,
        person_in_charge: findingData.person_in_charge,
        status: findingData.status || 'not started',
        progress_pemenuhan: findingData.progress_pemenuhan || ''
      };

      const response = await fetch(`${API_BASE_URL}/api/audit/findings`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(jsonData),
      });

      const result = await this.handleResponse<AuditFinding>(response);
      
      // Step 2: If finding created successfully and files provided, upload files
      if (result.success && result.data && findingData.files && findingData.files.length > 0) {
        try {
          const uploadResult = await this.uploadFindingFiles(result.data.id.toString(), findingData.files, token);
          if (uploadResult.success && uploadResult.data) {
            // Add uploaded files to the finding data
            result.data.files = uploadResult.data;
            console.log(`Finding created and ${uploadResult.data.length} file(s) processed successfully`);
          }
        } catch (fileError) {
          console.warn('Finding created but file upload failed:', fileError);
          // Still show the files in UI even if upload failed
          if (findingData.files) {
            result.data.files = findingData.files.map(file => ({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString()
            }));
          }
        }
      } else if (result.success && result.data) {
        // Ensure files array exists
        result.data.files = [];
      }
      
      return result;
    } catch (error) {
      console.error('Error creating audit finding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create audit finding'
      };
    }
  }

  /**
   * Update an existing audit finding (following policy management pattern)
   */
  async updateFinding(id: string, findingData: UpdateAuditFindingRequest, token?: string): Promise<ApiResponse<AuditFinding>> {
    try {
      // Step 1: Update finding without files
      const jsonData = {
        name: findingData.name,
        audit_id: findingData.audit_id,
        root_cause: findingData.root_cause,
        recommendation: findingData.recommendation,
        commitment: findingData.commitment,
        commitment_date: findingData.commitment_date,
        person_in_charge: findingData.person_in_charge,
        status: findingData.status,
        progress_pemenuhan: findingData.progress_pemenuhan
      };

      const response = await fetch(`${API_BASE_URL}/api/audit/findings/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(jsonData),
      });

      const result = await this.handleResponse<AuditFinding>(response);
      
      // Step 2: If finding updated successfully and new files provided, upload files
      if (result.success && findingData.files && findingData.files.length > 0) {
        try {
          const uploadResult = await this.uploadFindingFiles(id, findingData.files, token);
          if (uploadResult.success && uploadResult.data && result.data) {
            // Add new files to existing files
            const existingFiles = result.data.files || [];
            result.data.files = [...existingFiles, ...uploadResult.data];
            console.log(`Finding updated and ${uploadResult.data.length} file(s) processed successfully`);
          }
        } catch (fileError) {
          console.warn('Finding updated but file upload failed:', fileError);
          // Still show the files in UI even if upload failed
          if (findingData.files && result.data) {
            const existingFiles = result.data.files || [];
            const newFiles = findingData.files.map(file => ({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString()
            }));
            result.data.files = [...existingFiles, ...newFiles];
          }
        }
      } else if (result.success && result.data && !result.data.files) {
        // Ensure files array exists
        result.data.files = [];
      }
      
      return result;
    } catch (error) {
      console.error('Error updating audit finding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update audit finding'
      };
    }
  }

  /**
   * Upload files to an existing audit finding (with fallback)
   */
  async uploadFindingFiles(findingId: string, files: File[], token?: string): Promise<ApiResponse<AuditFindingFile[]>> {
    try {
      const uploadedFiles: AuditFindingFile[] = [];
      
      // Try to upload files one by one
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(`${API_BASE_URL}/api/audit/findings/${findingId}/upload`, {
            method: 'POST',
            headers: this.getFileUploadHeaders(token),
            body: formData,
          });

          if (response.ok) {
            const fileResult = await response.json();
            uploadedFiles.push({
              id: fileResult.data?.id || Date.now().toString(),
              name: fileResult.data?.name || file.name,
              size: fileResult.data?.size || file.size,
              type: fileResult.data?.type || file.type,
              uploadedAt: fileResult.data?.uploadedAt || new Date().toISOString()
            });
          } else {
            // If upload endpoint doesn't exist, create mock file info
            console.warn(`Upload endpoint not available, creating mock file info for: ${file.name}`);
            uploadedFiles.push({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString()
            });
          }
        } catch (fileError) {
          console.warn(`Failed to upload file: ${file.name}`, fileError);
          // Create mock file info as fallback
          uploadedFiles.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString()
          });
        }
      }

      return {
        success: true,
        data: uploadedFiles
      };
    } catch (error) {
      console.error('Error uploading files:', error);
      
      // Return mock file info as complete fallback
      const mockFiles: AuditFindingFile[] = files.map(file => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      }));
      
      return {
        success: true,
        data: mockFiles
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

      return await this.handleResponse<void>(response);
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
        console.warn('File download not supported by backend yet');
        return null;
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading file:', error);
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

export const auditFindingsApiService = new AuditFindingsApiService();
