// API service for audit findings management
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
  id: string;
  name: string;                    // Backend field: name
  audit_id: string;                // Backend field: audit_id (changed from category)
  audit_name?: string;             // Backend field: audit_name (from JOIN)
  root_cause: string;              // Backend field: root_cause
  recommendation: string;          // Backend field: recommendation
  commitment: string;              // Backend field: commitment
  commitment_date: string;         // Backend field: commitment_date
  person_in_charge: string;        // Backend field: person_in_charge
  status: 'not started' | 'in progress' | 'done';
  progress_pemenuhan: string;      // Backend field: progress_pemenuhan
  files: AuditFindingFile[];       // Files attached to this finding (default to empty array)
  created_at: string;
  updated_at: string;
}

export interface CreateAuditFindingRequest {
  name: string;
  audit_id: string;                // Changed from category to audit_id
  root_cause: string;
  recommendation: string;
  commitment: string;
  commitment_date: string;
  person_in_charge: string;
  status?: 'not started' | 'in progress' | 'done';
  progress_pemenuhan?: string;
  files?: File[];                  // Files to upload
}

export interface UpdateAuditFindingRequest {
  name: string;
  audit_id: string;                // Changed from category to audit_id
  root_cause: string;
  recommendation: string;
  commitment: string;
  commitment_date: string;
  person_in_charge: string;
  status: 'not started' | 'in progress' | 'done';
  progress_pemenuhan: string;
  files?: File[];                  // New files to upload
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class AuditFindingsApiService {
  private getAuthHeaders(token?: string): HeadersInit {
    const authToken = token || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : '',
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      // Ensure files property exists for AuditFinding objects
      if (Array.isArray(data)) {
        // Handle array of findings
        data.forEach((item: any) => {
          if (item && typeof item === 'object' && 'name' in item && 'audit_id' in item) {
            item.files = item.files || [];
          }
        });
      } else if (data && typeof data === 'object' && 'name' in data && 'audit_id' in data) {
        // Handle single finding
        data.files = data.files || [];
      }
      
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
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
   * Create a new audit finding
   */
  async createFinding(findingData: CreateAuditFindingRequest, token?: string): Promise<ApiResponse<AuditFinding>> {
    try {
      // If files are provided, try FormData first, fallback to JSON if backend doesn't support it
      if (findingData.files && findingData.files.length > 0) {
        try {
          const formData = new FormData();
          
          // Add finding data
          formData.append('name', findingData.name);
          formData.append('audit_id', findingData.audit_id);
          formData.append('root_cause', findingData.root_cause);
          formData.append('recommendation', findingData.recommendation);
          formData.append('commitment', findingData.commitment);
          formData.append('commitment_date', findingData.commitment_date);
          formData.append('person_in_charge', findingData.person_in_charge);
          formData.append('status', findingData.status || 'not started');
          formData.append('progress_pemenuhan', findingData.progress_pemenuhan || '');
          
          // Add files
          findingData.files.forEach((file) => {
            formData.append('files', file);
          });

          const response = await fetch(`${API_BASE_URL}/api/audit/findings`, {
            method: 'POST',
            headers: this.getAuthHeaders(token),
            body: formData,
          });

          // If successful, return the result
          if (response.ok) {
            return await this.handleResponse<AuditFinding>(response);
          }
          
          // If failed, check if it's because backend doesn't support file upload
          const errorText = await response.text();
          if (response.status === 400 && errorText.includes('Missing required fields')) {
            console.warn('Backend does not support file upload for findings, creating without files');
            // Fall through to JSON creation without files
          } else {
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
          }
        } catch (formDataError) {
          console.warn('FormData upload failed, trying JSON without files:', formDataError);
          // Fall through to JSON creation without files
        }
      }
      
      // Use JSON for findings without files or as fallback
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
        headers: {
          ...this.getAuthHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      const result = await this.handleResponse<AuditFinding>(response);
      
      // If files were provided but couldn't be uploaded, show a warning
      if (findingData.files && findingData.files.length > 0 && result.success) {
        console.warn(`Finding created successfully, but ${findingData.files.length} file(s) could not be uploaded. Backend may not support file upload for findings yet.`);
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
   * Update an existing audit finding
   */
  async updateFinding(id: string, findingData: UpdateAuditFindingRequest, token?: string): Promise<ApiResponse<AuditFinding>> {
    try {
      // If files are provided, try FormData first, fallback to JSON if backend doesn't support it
      if (findingData.files && findingData.files.length > 0) {
        try {
          const formData = new FormData();
          
          // Add finding data
          formData.append('name', findingData.name);
          formData.append('audit_id', findingData.audit_id);
          formData.append('root_cause', findingData.root_cause);
          formData.append('recommendation', findingData.recommendation);
          formData.append('commitment', findingData.commitment);
          formData.append('commitment_date', findingData.commitment_date);
          formData.append('person_in_charge', findingData.person_in_charge);
          formData.append('status', findingData.status);
          formData.append('progress_pemenuhan', findingData.progress_pemenuhan);
          
          // Add new files
          findingData.files.forEach((file) => {
            formData.append('files', file);
          });

          const response = await fetch(`${API_BASE_URL}/api/audit/findings/${id}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(token),
            body: formData,
          });

          // If successful, return the result
          if (response.ok) {
            return await this.handleResponse<AuditFinding>(response);
          }
          
          // If failed, check if it's because backend doesn't support file upload
          const errorText = await response.text();
          if (response.status === 400 && errorText.includes('Missing required fields')) {
            console.warn('Backend does not support file upload for findings, updating without files');
            // Fall through to JSON update without files
          } else {
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
          }
        } catch (formDataError) {
          console.warn('FormData update failed, trying JSON without files:', formDataError);
          // Fall through to JSON update without files
        }
      }
      
      // Use JSON for findings without new files or as fallback
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
        headers: {
          ...this.getAuthHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      const result = await this.handleResponse<AuditFinding>(response);
      
      // If files were provided but couldn't be uploaded, show a warning
      if (findingData.files && findingData.files.length > 0 && result.success) {
        console.warn(`Finding updated successfully, but ${findingData.files.length} file(s) could not be uploaded. Backend may not support file upload for findings yet.`);
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
   * Get available audits for dropdown (replaces getCategories)
   */
  async getAvailableAudits(token?: string): Promise<ApiResponse<{id: string, name: string}[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/findings/audits`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      return await this.handleResponse<{id: string, name: string}[]>(response);
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
      console.error('Error fetching findings by audit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch findings by audit'
      };
    }
  }

  /**
   * Upload files to an existing audit finding
   */
  async uploadFindingFiles(findingId: string, files: File[], token?: string): Promise<ApiResponse<AuditFindingFile[]>> {
    try {
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/api/audit/findings/${findingId}/files`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: formData,
      });

      if (response.status === 404) {
        return {
          success: false,
          error: 'File upload not supported by backend yet'
        };
      }

      return await this.handleResponse<AuditFindingFile[]>(response);
    } catch (error) {
      console.error('Error uploading files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload files'
      };
    }
  }

  /**
   * Download an audit finding file
   */
  async downloadFindingFile(findingId: string, fileId: string, token?: string): Promise<Blob | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/findings/${findingId}/files/${fileId}/download`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('File download not supported by backend yet');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  }

  /**
   * Delete an audit finding file
   */
  async deleteFindingFile(fileId: string, token?: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/findings/files/${fileId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(token),
      });

      if (response.status === 404) {
        return {
          success: false,
          error: 'File deletion not supported by backend yet'
        };
      }

      return await this.handleResponse<void>(response);
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file'
      };
    }
  }

  /**
   * Export audit findings to Excel
   */
  async exportToExcel(findings: AuditFinding[]): Promise<void> {
    try {
      // Create Excel data
      const excelData = findings.map((finding, index) => ({
        "No": index + 1,
        "Audit Name": finding.audit_name || 'N/A',
        "Finding Name": finding.name,
        "Root Cause": finding.root_cause,
        "Recommendation": finding.recommendation,
        "Commitment": finding.commitment,
        "Commitment Date": finding.commitment_date,
        "Person in Charge": finding.person_in_charge,
        "Status": finding.status,
        "Progress": finding.progress_pemenuhan,
        "Created At": new Date(finding.created_at).toLocaleDateString('id-ID'),
        "Updated At": new Date(finding.updated_at).toLocaleDateString('id-ID')
      }));

      // Convert to CSV format
      const headers = Object.keys(excelData[0] || {});
      const csvContent = [
        headers.join(','),
        ...excelData.map(row => 
          headers.map(header => `"${(row as any)[header] || ''}"`).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-findings-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }
}

export const auditFindingsApiService = new AuditFindingsApiService();
