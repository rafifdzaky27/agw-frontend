// API service for memo management
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';

export interface MemoApiResponse {
  id: number;
  type: 'memo' | 'surat';
  memo_number: string;
  to: string;
  cc: string;
  reason: string;
  created_by: string;
  created_at: string;
}

export interface CreateMemoRequest {
  type: 'memo' | 'surat';
  to: string;
  cc?: string;
  reason: string;
  created_by: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
}

class MemoApiService {
  private getAuthHeaders(token?: string): HeadersInit {
    const authToken = token || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : '',
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  }

  /**
   * Get all memos with optional filtering
   */
  async getAllMemos(token?: string, filters?: { reason?: string; type?: 'memo' | 'surat' }): Promise<ApiResponse<MemoApiResponse[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.reason) {
        queryParams.append('reason', filters.reason);
      }
      
      if (filters?.type) {
        queryParams.append('type', filters.type);
      }

      const url = `${API_BASE_URL}/api/memo${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      return await this.handleResponse<MemoApiResponse[]>(response);
    } catch (error) {
      console.error('Error fetching memos:', error);
      throw error;
    }
  }

  /**
   * Get a memo by ID
   */
  async getMemoById(id: number, token?: string): Promise<ApiResponse<MemoApiResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memo/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      return await this.handleResponse<MemoApiResponse>(response);
    } catch (error) {
      console.error('Error fetching memo:', error);
      throw error;
    }
  }

  /**
   * Create a new memo
   */
  async createMemo(memoData: CreateMemoRequest, token?: string): Promise<ApiResponse<MemoApiResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memo`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(memoData),
      });

      return await this.handleResponse<MemoApiResponse>(response);
    } catch (error) {
      console.error('Error creating memo:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const memoApiService = new MemoApiService();
