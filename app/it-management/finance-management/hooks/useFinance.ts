import { useState, useEffect, useCallback } from 'react';
import { financeApi, Project, FinancialSummary, PaymentTerm } from '../services/financeApi';
import toast from 'react-hot-toast';

export const useFinance = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Fetch projects for finance view
  const fetchProjects = useCallback(async (params: {
    page?: number;
    limit?: number;
    search?: string;
    year?: string;
    status?: string;
  } = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await financeApi.getFinanceProjects(params);
      
      if (response.success) {
        setProjects(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch projects');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(errorMessage);
      toast.error(errorMessage);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update payment status
  const updatePaymentStatus = useCallback(async (
    paymentTermId: string,
    statusData: {
      status: string;
      paymentDate?: string;
      budgetType?: string;
      notes?: string;
      opexCabang?: number;
      opexPusat?: number;
    }
  ) => {
    try {
      const response = await financeApi.updatePaymentStatus(paymentTermId, statusData);
      
      if (response.success) {
        toast.success('Payment status updated successfully');
        
        // Update local state
        setProjects(prevProjects => 
          prevProjects.map(project => ({
            ...project,
            terminPembayaran: project.terminPembayaran.map(term =>
              term.id === paymentTermId ? { ...term, ...response.data } : term
            )
          }))
        );
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update payment status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment status';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  return {
    projects,
    loading,
    error,
    pagination,
    fetchProjects,
    updatePaymentStatus,
  };
};

export const useFinancialSummary = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await financeApi.getFinancialSummary();
      
      if (response.success) {
        setSummary(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch financial summary');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch financial summary';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
};

export const useProjectFinanceDetails = (projectId: string | null) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectDetails = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await financeApi.getProjectFinanceDetails(id);
      
      if (response.success) {
        setProject(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch project details');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails(projectId);
    } else {
      setProject(null);
    }
  }, [projectId, fetchProjectDetails]);

  return {
    project,
    loading,
    error,
    refetch: projectId ? () => fetchProjectDetails(projectId) : () => {},
  };
};

export const useFinanceExport = () => {
  const [exporting, setExporting] = useState(false);

  const exportData = useCallback(async (filters: {
    projectIds?: string[];
    year?: string;
    status?: string;
    format?: string;
  }) => {
    try {
      setExporting(true);
      
      const response = await financeApi.exportFinanceData(filters);
      
      if (response.success) {
        // Create and download Excel file
        const dataToExport = response.data;
        
        // You can use a library like xlsx to create Excel file
        // For now, we'll create a CSV
        const csvContent = convertToCSV(dataToExport);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `finance_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Successfully exported ${dataToExport.length} records`);
      } else {
        throw new Error(response.message || 'Failed to export data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      toast.error(errorMessage);
    } finally {
      setExporting(false);
    }
  }, []);

  return {
    exportData,
    exporting,
  };
};

// Helper function to convert data to CSV
const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};
