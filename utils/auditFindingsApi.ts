// API service for audit findings management
const API_BASE_URL = process.env.NEXT_PUBLIC_AUDIT_SERVICE_URL || 'http://localhost:5010';

export interface AuditFinding {
  id: string;
  name: string;                    // Backend field: name
  category: string;                // Backend field: category  
  root_cause: string;              // Backend field: root_cause
  recommendation: string;          // Backend field: recommendation
  commitment: string;              // Backend field: commitment
  commitment_date: string;         // Backend field: commitment_date
  person_in_charge: string;        // Backend field: person_in_charge
  status: 'not started' | 'in progress' | 'done';
  progress_pemenuhan: string;      // Backend field: progress_pemenuhan
  created_at: string;
  updated_at: string;
}

export interface CreateAuditFindingRequest {
  name: string;
  category: string;
  root_cause: string;
  recommendation: string;
  commitment: string;
  commitment_date: string;
  person_in_charge: string;
  status?: 'not started' | 'in progress' | 'done';
  progress_pemenuhan?: string;
}

export interface UpdateAuditFindingRequest {
  name: string;
  category: string;
  root_cause: string;
  recommendation: string;
  commitment: string;
  commitment_date: string;
  person_in_charge: string;
  status: 'not started' | 'in progress' | 'done';
  progress_pemenuhan: string;
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
      const response = await fetch(`${API_BASE_URL}/api/audit/findings`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(findingData),
      });

      return await this.handleResponse<AuditFinding>(response);
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
      const response = await fetch(`${API_BASE_URL}/api/audit/findings/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(findingData),
      });

      return await this.handleResponse<AuditFinding>(response);
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
   * Get available categories
   */
  async getCategories(token?: string): Promise<ApiResponse<string[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/findings/categories`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      return await this.handleResponse<string[]>(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories'
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
        "Category": finding.category,
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
