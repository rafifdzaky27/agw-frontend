// API service for Finance Management
const BACKEND_IP = process.env.NEXT_PUBLIC_BACKEND_IP || "http://localhost:5006";

export interface PaymentTerm {
  id: string;
  termin: string;
  nominal: number;
  description: string;
  status: 'Belum Dibayar' | 'Sudah Dibayar' | 'Checking Umum' | 'Menunggu Posting' | 'Sirkulir IT';
  paymentDate?: string;
  budget?: 'Capex' | 'Opex';
  notes?: string;
  opexCabang?: number;
  opexPusat?: number;
}

export interface Project {
  id: string;
  kodeProject: string;
  projectName: string;
  projectType: 'internal development' | 'procurement' | 'non procurement';
  divisiInisiasi: string;
  grupTerlibat: string;
  keterangan: string;
  namaVendor: string;
  noPKSPO: string;
  tanggalPKSPO: string;
  tanggalBAPP: string;
  tanggalBerakhir: string;
  terminPembayaran?: PaymentTerm[]; // Make optional since list API might not include this
  createdAt: string;
  updatedAt: string;
  paymentStatus?: {
    status: string;
    color: string;
  };
  totalValue?: number;
  paidValue?: number;
  totalTerms?: number;
  paidTerms?: number;
}

export interface FinancialSummary {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  pendingProjects: number;
  totalValue: number;
  paidValue: number;
  remainingValue: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class FinanceApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const response = await fetch(`${BACKEND_IP}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get projects for finance view
  async getFinanceProjects(params: {
    page?: number;
    limit?: number;
    search?: string;
    year?: string;
    status?: string;
  } = {}): Promise<ApiResponse<Project[]>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.year && params.year !== 'all') queryParams.append('year', params.year);
    if (params.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/api/finance/projects${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<Project[]>(endpoint);
  }

  // Get project finance details
  async getProjectFinanceDetails(projectId: string): Promise<ApiResponse<Project>> {
    return this.makeRequest<Project>(`/api/finance/projects/${projectId}`);
  }

  // Get financial summary
  async getFinancialSummary(): Promise<ApiResponse<FinancialSummary>> {
    return this.makeRequest<FinancialSummary>('/api/finance/reports/summary');
  }

  // Update payment status
  async updatePaymentStatus(
    paymentTermId: string,
    statusData: {
      status: string;
      paymentDate?: string;
      budgetType?: string;
      notes?: string;
      opexCabang?: number;
      opexPusat?: number;
    }
  ): Promise<ApiResponse<PaymentTerm>> {
    return this.makeRequest<PaymentTerm>(`/api/finance/payment-terms/${paymentTermId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  // Export finance data
  async exportFinanceData(filters: {
    projectIds?: string[];
    year?: string;
    status?: string;
    format?: string;
  }): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>('/api/finance/export', {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  }

  // Get overdue payments
  async getOverduePayments(): Promise<ApiResponse<PaymentTerm[]>> {
    return this.makeRequest<PaymentTerm[]>('/api/finance/reports/overdue');
  }

  // Get payment status options
  async getPaymentStatusOptions(): Promise<ApiResponse<{
    statusOptions: Array<{ value: string; label: string; color: string }>;
    budgetTypeOptions: Array<{ value: string; label: string }>;
  }>> {
    return this.makeRequest('/api/finance/payment-terms/status-options');
  }

  // Bulk update payment status
  async bulkUpdatePaymentStatus(
    paymentTermIds: string[],
    statusData: {
      status: string;
      paymentDate?: string;
      budgetType?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<{ updated: PaymentTerm[]; errors: any[] }>> {
    return this.makeRequest('/api/finance/payment-terms/bulk-update-status', {
      method: 'POST',
      body: JSON.stringify({ paymentTermIds, statusData }),
    });
  }
}

export const financeApi = new FinanceApiService();
