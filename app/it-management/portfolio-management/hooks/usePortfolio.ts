import { useState, useEffect, useCallback } from 'react';
import { portfolioApi, Agreement, AgreementFile } from '../services/portfolioApi';
import toast from 'react-hot-toast';

export const usePortfolio = () => {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Fetch all projects/agreements
  const fetchAgreements = useCallback(async (params: {
    page?: number;
    limit?: number;
    search?: string;
    project_type?: string;
    year?: string;
  } = {}) => {
    try {
      console.log("\n🔍 ===== USEPORTFOLIO HOOK FETCH DEBUG START =====");
      console.log("📅 Timestamp:", new Date().toISOString());
      console.log("📥 Hook Parameters:", JSON.stringify(params, null, 2));
      
      setLoading(true);
      setError(null);
      
      console.log("🚀 Calling portfolioApi.getAllProjects...");
      const response = await portfolioApi.getAllProjects(params);
      
      console.log("✅ API Response received in hook:");
      console.log("📊 Success:", response.success);
      console.log("📋 Message:", response.message);
      console.log("📊 Data Count:", response.data?.length || 0);
      
      if (response.success) {
        console.log("✅ Setting agreements state...");
        console.log("📋 Data being set:", JSON.stringify(response.data, null, 2));
        
        setAgreements(response.data);
        
        if (response.pagination) {
          console.log("📋 Setting pagination:", JSON.stringify(response.pagination, null, 2));
          setPagination(response.pagination);
        }
        
        console.log("✅ State updated successfully");
      } else {
        console.log("❌ Response not successful:", response.message);
        throw new Error(response.message || 'Failed to fetch agreements');
      }
      
      console.log("🔍 ===== USEPORTFOLIO HOOK FETCH DEBUG END =====\n");
    } catch (err) {
      console.error("\n❌ USEPORTFOLIO HOOK FETCH ERROR:");
      console.error("   - Error Message:", err instanceof Error ? err.message : 'Unknown error');
      console.error("   - Error Object:", err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch agreements';
      setError(errorMessage);
      toast.error(errorMessage);
      setAgreements([]);
      
      console.log("🔍 ===== USEPORTFOLIO HOOK FETCH DEBUG END (ERROR) =====\n");
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new agreement
  const createAgreement = useCallback(async (agreementData: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt' | 'files'>) => {
    try {
      const response = await portfolioApi.createProject(agreementData);
      
      if (response.success) {
        toast.success(`Project "${agreementData.projectName}" berhasil ditambahkan`);
        
        // Add to local state
        setAgreements(prev => [response.data, ...prev]);
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create agreement');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create agreement';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Update agreement
  const updateAgreement = useCallback(async (id: string, agreementData: Partial<Agreement>) => {
    console.log("\n🔄 ===== UPDATE AGREEMENT HOOK DEBUG =====");
    console.log("📅 Timestamp:", new Date().toISOString());
    console.log("🆔 Agreement ID:", id);
    console.log("📋 Agreement Data:", agreementData);
    console.log("💰 Payment Terms in Input:", agreementData.terminPembayaran);
    console.log("💰 Payment Terms Count in Input:", (agreementData.terminPembayaran || []).length);
    
    try {
      const response = await portfolioApi.updateProject(id, agreementData);
      
      console.log("📊 API Response:", response);
      console.log("💰 Payment Terms in API Response:", response.data?.terminPembayaran);
      console.log("💰 Payment Terms Count in API Response:", (response.data?.terminPembayaran || []).length);
      
      if (response.success) {
        toast.success(`Project "${agreementData.projectName}" berhasil diperbarui`);
        
        // Update local state
        setAgreements(prev => {
          const updatedAgreements = prev.map(agreement => 
            agreement.id === id ? response.data : agreement
          );
          
          console.log("🔄 Updating local state...");
          console.log("💰 Updated agreement payment terms:", response.data?.terminPembayaran);
          
          return updatedAgreements;
        });
        
        console.log("✅ Local state updated successfully");
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update agreement');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update agreement';
      console.error("❌ Update Agreement Error:", err);
      console.error("   Agreement ID:", id);
      console.error("   Agreement Data:", agreementData);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Delete agreement
  const deleteAgreement = useCallback(async (id: string) => {
    try {
      const response = await portfolioApi.deleteProject(id);
      
      if (response.success) {
        toast.success('Agreement deleted successfully');
        
        // Remove from local state
        setAgreements(prev => prev.filter(agreement => agreement.id !== id));
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to delete agreement');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete agreement';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Bulk delete agreements
  const bulkDeleteAgreements = useCallback(async (agreementIds: string[]) => {
    try {
      const response = await portfolioApi.bulkDeleteProjects(agreementIds);
      
      if (response.success) {
        toast.success(`${agreementIds.length} agreement(s) deleted successfully`);
        
        // Remove from local state
        setAgreements(prev => 
          prev.filter(agreement => !agreementIds.includes(agreement.id))
        );
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to delete agreements');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete agreements';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  return {
    agreements,
    loading,
    error,
    pagination,
    fetchAgreements,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    bulkDeleteAgreements,
  };
};

export const useAgreementDetails = (agreementId: string | null) => {
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgreementDetails = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await portfolioApi.getProjectById(id);
      
      if (response.success) {
        setAgreement(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch agreement details');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch agreement details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (agreementId) {
      fetchAgreementDetails(agreementId);
    } else {
      setAgreement(null);
    }
  }, [agreementId, fetchAgreementDetails]);

  return {
    agreement,
    loading,
    error,
    refetch: agreementId ? () => fetchAgreementDetails(agreementId) : () => {},
  };
};

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadFiles = useCallback(async (projectId: string, files: File[]) => {
    try {
      setUploading(true);
      
      const response = await portfolioApi.uploadFiles(projectId, files);
      
      if (response.success) {
        const { uploaded, errors } = response.data;
        
        if (uploaded.length > 0) {
          toast.success(`${uploaded.length} file(s) uploaded successfully`);
        }
        
        if (errors.length > 0) {
          errors.forEach(error => {
            toast.error(`${error.filename}: ${error.error}`);
          });
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to upload files');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload files';
      toast.error(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadSingleFile = useCallback(async (projectId: string, file: File) => {
    try {
      setUploading(true);
      
      const response = await portfolioApi.uploadSingleFile(projectId, file);
      
      if (response.success) {
        toast.success('File uploaded successfully');
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to upload file');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      toast.error(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const response = await portfolioApi.deleteFile(fileId);
      
      if (response.success) {
        toast.success('File deleted successfully');
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to delete file');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  return {
    uploadFiles,
    uploadSingleFile,
    deleteFile,
    uploading,
  };
};

export const usePortfolioExport = () => {
  const [exporting, setExporting] = useState(false);

  const exportData = useCallback(async (params: {
    search?: string;
    project_type?: string;
    year?: string;
    projectIds?: string[];
  } = {}) => {
    try {
      setExporting(true);
      
      const response = await portfolioApi.exportProjects(params);
      
      if (response.success) {
        // Create and download Excel file
        const dataToExport = response.data;
        
        // Convert to CSV for now
        const csvContent = convertToCSV(dataToExport);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `portfolio_export_${new Date().toISOString().split('T')[0]}.csv`);
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
