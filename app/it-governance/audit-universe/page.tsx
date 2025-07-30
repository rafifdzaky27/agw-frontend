"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaPlus, FaCalendarAlt, FaFileAlt, FaEdit, FaSearch, FaCheck, FaTimes, FaTrash, FaFileExcel } from "react-icons/fa";
import * as XLSX from 'xlsx';
import NewAuditModal from "./components/NewAuditModal";
import AuditDetailModal from "./components/AuditDetailModal";
import toast from "react-hot-toast";
import { auditApiService, Audit } from "@/utils/auditApi";

export default function AuditUniversePage() {
  const { user, token } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewAuditModal, setShowNewAuditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAudits, setSelectedAudits] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState({
    Internal: 1,
    Regulatory: 1,
    External: 1
  });
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (token) {
      fetchAudits();
    }
  }, [token]);

  // Refetch when search or year filter changes
  useEffect(() => {
    if (token) {
      fetchAudits();
    }
  }, [searchTerm, selectedYear, token]);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure we have a valid token
      if (!token) {
        throw new Error('Authentication token is missing. Please log in again.');
      }
      
      const response = await auditApiService.getAllAudits(token, {
        year: selectedYear !== 'all' ? selectedYear : undefined,
        search: searchTerm || undefined
      });
      
      if (response.success && response.data) {
        setAudits(response.data);
      } else {
        // Handle specific error cases
        const errorMessage = response.error || 'Failed to fetch audits';
        if (errorMessage.includes('token') || errorMessage.includes('auth')) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('❌ Error fetching audits:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch audits";
      setError(errorMessage);
      
      // Show user-friendly error messages
      if (errorMessage.includes('Authentication') || errorMessage.includes('token')) {
        toast.error("Please log in again to access audits");
      } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error("Failed to load audits. Please try again.");
      }
      
      // Set empty array to prevent UI issues
      setAudits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAudit = async (auditData: Omit<Audit, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Validate required fields before sending
      if (!auditData.name?.trim()) {
        toast.error("Audit name is required");
        return;
      }
      if (!auditData.category) {
        toast.error("Category is required");
        return;
      }
      if (!auditData.auditor?.trim()) {
        toast.error("Auditor is required");
        return;
      }
      if (!auditData.date) {
        toast.error("Date is required");
        return;
      }
      if (!auditData.scope?.trim()) {
        toast.error("Scope is required");
        return;
      }
      
      // Ensure we have a valid token
      if (!token) {
        toast.error("Authentication token is missing. Please log in again.");
        return;
      }
      
      // Extract actual File objects from the files array
      const actualFiles: File[] = [];
      if (auditData.files && auditData.files.length > 0) {
        auditData.files.forEach(fileData => {
          if (fileData.file instanceof File) {
            actualFiles.push(fileData.file);
          }
        });
      }
      
      const createData = {
        name: auditData.name.trim(),
        category: auditData.category,
        auditor: auditData.auditor.trim(),
        date: auditData.date,
        scope: auditData.scope.trim(),
        files: actualFiles
      };
      
      console.log('🔍 DEBUG - Data being sent to API:', {
        name: createData.name,
        category: createData.category,
        auditor: createData.auditor,
        date: createData.date,
        scope: createData.scope,
        filesCount: createData.files?.length || 0
      });
      
      const response = await auditApiService.createAudit(createData, token);
      
      if (response.success) {
        toast.success("Audit created successfully");
        setShowNewAuditModal(false);
        await fetchAudits(); // Refresh the list
      } else {
        // Handle specific error cases
        const errorMessage = response.error || 'Failed to create audit';
        if (errorMessage.includes('Missing required fields')) {
          toast.error("Please fill in all required fields");
        } else if (errorMessage.includes('token') || errorMessage.includes('auth')) {
          toast.error("Authentication failed. Please log in again.");
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('❌ Error creating audit:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create audit";
      
      // Only show toast if we haven't already shown one above
      if (!errorMessage.includes('required fields') && 
          !errorMessage.includes('Authentication') && 
          !errorMessage.includes('token')) {
        toast.error("Failed to create audit. Please try again.");
      }
    }
  };

  const handleUpdateAudit = async (auditData: Audit) => {
    try {
      const response = await auditApiService.updateAudit(auditData.id, {
        name: auditData.name ?? '',
        category: auditData.category,
        auditor: auditData.auditor ?? '',
        date: auditData.date ?? '',
        scope: auditData.scope ?? '',
        files: auditData.files?.map(f => f.file).filter(Boolean) as File[]
      }, token ?? '');
      
      if (response.success) {
        toast.success("Audit updated successfully");
        setShowDetailModal(false);
        setSelectedAudit(null);
        await fetchAudits(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to update audit');
      }
    } catch (err) {
      console.error('Error updating audit:', err);
      toast.error(err instanceof Error ? err.message : "Failed to update audit");
    }
  };

  const handleAuditClick = (audit: Audit) => {
    if (isSelectionMode) {
      handleMultipleSelect(audit.id);
    } else {
      setSelectedAudit(audit);
      setShowDetailModal(true);
    }
  };

  // Selection mode functions
  const handleMultipleSelect = (auditId: string) => {
    setSelectedAudits(prev => 
      prev.includes(auditId) 
        ? prev.filter(id => id !== auditId)
        : [...prev, auditId]
    );
  };

  const handleSelectAll = () => {
    const allCurrentAudits = audits.map(audit => audit.id);
    if (selectedAudits.length === allCurrentAudits.length) {
      setSelectedAudits([]);
    } else {
      setSelectedAudits(allCurrentAudits);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedAudits([]);
  };

  // Export function
  const handleExportSelected = async () => {
    if (selectedAudits.length === 0) {
      toast.error("Please select audits to export");
      return;
    }

    try {
      setIsExporting(true);
      
      // Get selected audits data
      const selectedAuditsData = audits.filter(audit => selectedAudits.includes(audit.id));
      
      // Create Excel data
      const excelData: Record<string, string | number>[] = [];
      
      selectedAuditsData.forEach((audit, index) => {
        // Count files
        const fileCount = audit.files.length;
        const fileNames = audit.files.map(file => file.name).join('; ');
        const totalFileSize = audit.files.reduce((sum, file) => sum + file.size, 0);
        
        // Format file size
        const formatFileSize = (bytes: number) => {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
        
        excelData.push({
          "No": index + 1,
          "Audit Name": audit.name,
          "Category": audit.category,
          "Auditor": audit.auditor,
          "Date": audit.date,
          "Scope": audit.scope,
          "File Count": fileCount,
          "File Names": fileNames,
          "Total File Size": formatFileSize(totalFileSize),
          "Created At": audit.created_at ? new Date(audit.created_at).toLocaleDateString('id-ID') : 'N/A',
          "Updated At": audit.updated_at ? new Date(audit.updated_at).toLocaleDateString('id-ID') : 'N/A'
        });
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 5 },   // No
        { wch: 30 },  // Audit Name
        { wch: 15 },  // Category
        { wch: 25 },  // Auditor
        { wch: 12 },  // Date
        { wch: 50 },  // Scope
        { wch: 12 },  // File Count
        { wch: 50 },  // File Names
        { wch: 15 },  // Total File Size
        { wch: 12 },  // Created At
        { wch: 12 }   // Updated At
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Universe Data");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `Selected_Audits_${selectedAudits.length}_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      // Show success message
      toast.success(`Successfully exported ${selectedAudits.length} audits to Excel`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export audits. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedAudits.length === 0) {
      toast.error("Please select audits to delete");
      return;
    }
    
    // Show confirmation dialog
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedAudits.length} audit(s)? This action cannot be undone.`);
    
    if (confirmDelete) {
      try {
        const response = await auditApiService.deleteMultipleAudits(selectedAudits, token ?? '');
        
        if (response.success) {
          toast.success(`Successfully deleted ${selectedAudits.length} audit(s)`);
          setSelectedAudits([]);
          setIsSelectionMode(false);
          await fetchAudits(); // Refresh the list
        } else {
          throw new Error(response.error || 'Failed to delete audits');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error(error instanceof Error ? error.message : "Failed to delete audits. Please try again.");
      }
    }
  };
  // Export function based on current filter
  const handleExportFiltered = async () => {
    try {
      setIsExporting(true);
      
      // Get filtered audits based on current year filter and search term
      const filteredAudits = audits.filter(audit => 
        (selectedYear === 'all' || audit.date.split('-')[0] === selectedYear) &&
        (searchTerm === '' ||
         audit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         audit.auditor.toLowerCase().includes(searchTerm.toLowerCase()) ||
         audit.scope.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      if (filteredAudits.length === 0) {
        toast.error("No audits found with current filter");
        return;
      }
      
      // Create Excel data
      const excelData: Record<string, string | number>[] = [];
      
      filteredAudits.forEach((audit, index) => {
        // Count files
        const fileCount = audit.files.length;
        const fileNames = audit.files.map(file => file.name).join('; ');
        const totalFileSize = audit.files.reduce((sum, file) => sum + file.size, 0);
        
        // Format file size
        const formatFileSize = (bytes: number) => {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
        
        excelData.push({
          "No": index + 1,
          "Audit Name": audit.name,
          "Category": audit.category,
          "Auditor": audit.auditor,
          "Date": audit.date,
          "Scope": audit.scope,
          "File Count": fileCount,
          "File Names": fileNames,
          "Total File Size": formatFileSize(totalFileSize),
          "Created At": audit.created_at ? new Date(audit.created_at).toLocaleDateString('id-ID') : 'N/A',
          "Updated At": audit.updated_at ? new Date(audit.updated_at).toLocaleDateString('id-ID') : 'N/A'
        });
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 5 },   // No
        { wch: 30 },  // Audit Name
        { wch: 15 },  // Category
        { wch: 25 },  // Auditor
        { wch: 12 },  // Date
        { wch: 50 },  // Scope
        { wch: 12 },  // File Count
        { wch: 50 },  // File Names
        { wch: 15 },  // Total File Size
        { wch: 12 },  // Created At
        { wch: 12 }   // Updated At
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Audit Data");

      // Generate filename with filter info and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const yearFilter = selectedYear === 'all' ? 'All_Years' : `Year_${selectedYear}`;
      const searchFilter = searchTerm ? `_Search_${searchTerm.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const filename = `Audit_Universe_${yearFilter}${searchFilter}_${filteredAudits.length}_items_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      // Show success message
      toast.success(`Successfully exported ${filteredAudits.length} audits to Excel`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export audits. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const getAuditsByCategory = (category: 'Internal' | 'Regulatory' | 'External') => {
    const filtered = audits.filter(audit => 
      audit.category === category &&
      (selectedYear === 'all' || audit.date.split('-')[0] === selectedYear) &&
      (searchTerm === '' ||
       audit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       audit.auditor.toLowerCase().includes(searchTerm.toLowerCase()) ||
       audit.scope.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const page = currentPage[category];
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    return {
      items: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
      currentPage: page
    };
  };

  const handlePageChange = (category: 'Internal' | 'Regulatory' | 'External', page: number) => {
    setCurrentPage(prev => ({
      ...prev,
      [category]: page
    }));
  };

  const resetPagination = () => {
    setCurrentPage({
      Internal: 1,
      Regulatory: 1,
      External: 1
    });
  };

  const AuditCard = ({ audit }: { audit: Audit }) => {
    // Check if audit name is likely 2 lines (rough estimation based on length)
    const isLongTitle = audit.name.length > 35;
    const scopeClampClass = isLongTitle ? 'line-clamp-2' : 'line-clamp-3';
    
    return (
      <div 
        className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border ${
          isSelectionMode && selectedAudits.includes(audit.id) 
            ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20' 
            : 'border-gray-200 dark:border-gray-700'
        } h-44 flex flex-col relative`}
        onClick={() => handleAuditClick(audit)}
      >
        {/* Selection Checkbox - Smaller Size */}
        {isSelectionMode && (
          <div 
            className="absolute top-2 right-2 z-10"
            onClick={(e) => {
              e.stopPropagation();
              handleMultipleSelect(audit.id);
            }}
          >
            <input
              type="checkbox"
              checked={selectedAudits.includes(audit.id)}
              onChange={() => {}}
              className="w-3.5 h-3.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        )}
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-5 line-clamp-2 flex-1">
            {audit.name}
          </h3>
          {audit.files.length > 0 && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded flex-shrink-0 ml-2">
              {audit.files.length}
            </span>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
            <div className="line-clamp-5 text-xs whitespace-pre-line">
              {audit.scope}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(audit.date)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {audit.auditor}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
          <Sidebar />
          <div className="flex-1 md:ml-60 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="space-y-3">
                      {[1, 2].map(j => (
                        <div key={j} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
        <Sidebar />
        <div className="flex-1 md:ml-60 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Audit Universe
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Comprehensive audit management across Internal, Regulatory, and External categories
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {audits.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Audits
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Search Bar and Add Button */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search audits by name, auditor, or scope..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    resetPagination();
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                />
              </div>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  resetPagination();
                }}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors min-w-[120px]"
              >
                <option value="all">All Years</option>
                {[...new Set(audits.map(audit => audit.date.split('-')[0]))]
                  .sort((a, b) => parseInt(b) - parseInt(a))
                  .map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
              </select>
              <button
                onClick={toggleSelectionMode}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors whitespace-nowrap shadow-md hover:shadow-lg ${
                  isSelectionMode 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isSelectionMode ? <FaTimes className="text-sm" /> : <FaCheck className="text-sm" />}
                {isSelectionMode ? 'Cancel' : 'Select'}
              </button>   
              {/* Select All button - only show when in selection mode */}
              {isSelectionMode && (
                <button
                  onClick={handleSelectAll}
                  className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
                >
                  <FaCheck className="text-sm" />
                  {selectedAudits.length === audits.length ? 'Deselect All' : 'Select All'}
                </button>
              )}    
              {/* Export Button - Only show when year filter is not "all" OR when in selection mode with selected items */}
              {(selectedYear !== 'all' || (isSelectionMode && selectedAudits.length > 0)) && (
                <button
                  onClick={isSelectionMode && selectedAudits.length > 0 ? handleExportSelected : handleExportFiltered}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
                >
                  <FaFileExcel className="text-sm" />
                  {isExporting ? 'Exporting...' : 
                    isSelectionMode && selectedAudits.length > 0 
                      ? `Export (${selectedAudits.length})` 
                      : 'Export'
                  }
                </button>
              )}
              <button
                onClick={() => setShowNewAuditModal(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
              >
                <FaPlus className="text-sm" />
                Add New Audit
              </button>
              
            </div>

            {/* Selection Mode Toolbar - Compact Version - Only Counter and Delete */}
            {isSelectionMode && selectedAudits.length > 0 && (
              <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 px-2 py-1 bg-white dark:bg-gray-800 rounded">
                  {selectedAudits.length} selected
                </span>
                
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
                >
                  <FaTrash className="text-xs" />
                  Delete
                </button>
              </div>
            )}

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Internal Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    Internal
                  </h2>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-2 py-1 rounded-full">
                    {getAuditsByCategory('Internal').total}
                  </span>
                </div>
                <div className="space-y-3 min-h-[400px]">
                  {getAuditsByCategory('Internal').items.map(audit => (
                    <AuditCard key={audit.id} audit={audit} />
                  ))}
                  {getAuditsByCategory('Internal').total === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FaFileAlt className="mx-auto text-3xl mb-2 opacity-50" />
                      <p>No internal audits yet</p>
                    </div>
                  )}
                </div>
                {getAuditsByCategory('Internal').totalPages > 1 && (
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      Showing {((getAuditsByCategory('Internal').currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(getAuditsByCategory('Internal').currentPage * ITEMS_PER_PAGE, getAuditsByCategory('Internal').total)} of {getAuditsByCategory('Internal').total}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange('Internal', getAuditsByCategory('Internal').currentPage - 1)}
                        disabled={getAuditsByCategory('Internal').currentPage === 1}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ←
                      </button>
                      <span className="px-2 py-1">
                        {getAuditsByCategory('Internal').currentPage} / {getAuditsByCategory('Internal').totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange('Internal', getAuditsByCategory('Internal').currentPage + 1)}
                        disabled={getAuditsByCategory('Internal').currentPage === getAuditsByCategory('Internal').totalPages}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Regulatory Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">
                    Regulatory
                  </h2>
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm px-2 py-1 rounded-full">
                    {getAuditsByCategory('Regulatory').total}
                  </span>
                </div>
                <div className="space-y-3 min-h-[400px]">
                  {getAuditsByCategory('Regulatory').items.map(audit => (
                    <AuditCard key={audit.id} audit={audit} />
                  ))}
                  {getAuditsByCategory('Regulatory').total === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FaFileAlt className="mx-auto text-3xl mb-2 opacity-50" />
                      <p>No regulatory audits yet</p>
                    </div>
                  )}
                </div>
                {getAuditsByCategory('Regulatory').totalPages > 1 && (
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      Showing {((getAuditsByCategory('Regulatory').currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(getAuditsByCategory('Regulatory').currentPage * ITEMS_PER_PAGE, getAuditsByCategory('Regulatory').total)} of {getAuditsByCategory('Regulatory').total}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange('Regulatory', getAuditsByCategory('Regulatory').currentPage - 1)}
                        disabled={getAuditsByCategory('Regulatory').currentPage === 1}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ←
                      </button>
                      <span className="px-2 py-1">
                        {getAuditsByCategory('Regulatory').currentPage} / {getAuditsByCategory('Regulatory').totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange('Regulatory', getAuditsByCategory('Regulatory').currentPage + 1)}
                        disabled={getAuditsByCategory('Regulatory').currentPage === getAuditsByCategory('Regulatory').totalPages}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* External Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                    External
                  </h2>
                  <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm px-2 py-1 rounded-full">
                    {getAuditsByCategory('External').total}
                  </span>
                </div>
                <div className="space-y-3 min-h-[400px]">
                  {getAuditsByCategory('External').items.map(audit => (
                    <AuditCard key={audit.id} audit={audit} />
                  ))}
                  {getAuditsByCategory('External').total === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FaFileAlt className="mx-auto text-3xl mb-2 opacity-50" />
                      <p>No external audits yet</p>
                    </div>
                  )}
                </div>
                {getAuditsByCategory('External').totalPages > 1 && (
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      Showing {((getAuditsByCategory('External').currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(getAuditsByCategory('External').currentPage * ITEMS_PER_PAGE, getAuditsByCategory('External').total)} of {getAuditsByCategory('External').total}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange('External', getAuditsByCategory('External').currentPage - 1)}
                        disabled={getAuditsByCategory('External').currentPage === 1}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ←
                      </button>
                      <span className="px-2 py-1">
                        {getAuditsByCategory('External').currentPage} / {getAuditsByCategory('External').totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange('External', getAuditsByCategory('External').currentPage + 1)}
                        disabled={getAuditsByCategory('External').currentPage === getAuditsByCategory('External').totalPages}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showNewAuditModal && (
          <NewAuditModal
            onClose={() => setShowNewAuditModal(false)}
            onSave={handleCreateAudit}
          />
        )}

        {showDetailModal && selectedAudit && (
          <AuditDetailModal
            audit={selectedAudit}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedAudit(null);
            }}
            onSave={handleUpdateAudit}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
