"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { policyApiService, PolicyApiResponse, CreatePolicyRequest, UpdatePolicyRequest, ApiResponse } from "@/utils/policyApi";
import toast from "react-hot-toast";
import AddPolicyModal from "./components/AddPolicyModal";
import { FaSearch, FaFileExcel, FaTimes, FaCheck } from "react-icons/fa";
import * as XLSX from 'xlsx';

// Use real API service
const apiService = policyApiService;

// Define Policy interface that matches backend response
interface Policy {
  id: number;
  no_dokumen: string;
  nama_dokumen: string;
  tanggal_dokumen: string;
  kategori: 'Kebijakan' | 'SOP' | 'Pedoman' | 'Petunjuk Teknis';
  file_path?: string;
  file_name?: string;
  file_size?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function PolicyManagement() {
  const { user, token } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState<Policy | null>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<{[key: string]: boolean}>({
    'Kebijakan': false,
    'SOP': false,
    'Pedoman': false,
    'Petunjuk Teknis': false
  });

  // Categories for the accordion containers
  const categories = ['Kebijakan', 'SOP', 'Pedoman', 'Petunjuk Teknis'] as const;

  // Search and selection states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPolicies, setSelectedPolicies] = useState<Set<number>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; policyId: number | null }>({
    show: false,
    policyId: null
  });
  // API Integration Functions
  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const response: ApiResponse<PolicyApiResponse[]> = await apiService.getAllPolicies(token!);
      
      if (response.success && response.data) {
        // Convert API response to frontend Policy interface
        const convertedPolicies: Policy[] = response.data.map(apiPolicy => ({
          id: apiPolicy.id,
          no_dokumen: apiPolicy.no_dokumen,
          nama_dokumen: apiPolicy.nama_dokumen,
          tanggal_dokumen: apiPolicy.tanggal_dokumen,
          kategori: apiPolicy.kategori,
          file_path: apiPolicy.file_path,
          file_name: apiPolicy.file_name,
          file_size: apiPolicy.file_size,
          created_by: apiPolicy.created_by,
          created_at: apiPolicy.created_at,
          updated_at: apiPolicy.updated_at
        }));
        
        setPolicies(convertedPolicies);
      } else {
        throw new Error(response.error || 'Failed to fetch policies');
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      
      if (error instanceof Error && error.message.includes('Cannot connect to Policy Management server')) {
        toast.error('Policy Management backend is not available. Please start the backend server on port 5003.');
        // Set empty policies array so UI doesn't break
        setPolicies([]);
      } else {
        toast.error('Failed to load policies: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      console.log('=== Policy Management Debug Info ===');
      console.log('Token available:', !!token);
      console.log('API Base URL:', process.env.NEXT_PUBLIC_POLICY_API_BASE_URL || 'http://localhost:5003');
      
      // Test API connection first
      apiService.testConnection().then(isConnected => {
        console.log('Policy API Connection Test Result:', isConnected ? 'SUCCESS' : 'FAILED');
        if (!isConnected) {
          toast.error('❌ Cannot connect to Policy Management API server on port 5003. Please ensure the backend is running and accessible.');
          console.log('Backend Requirements:');
          console.log('1. Policy Management backend should be running on port 5003');
          console.log('2. CORS should be configured to allow requests from frontend');
          console.log('3. API endpoint /api/policies should be available');
        } else {
          toast.success('✅ Connected to Policy Management API');
        }
      });
      
      fetchPolicies();
    }
  }, [token, fetchPolicies]);

  // Utility functions - moved up to be available for other functions
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const isDocumentOld = useCallback((dateString: string): boolean => {
    const docDate = new Date(dateString);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return docDate < oneYearAgo;
  }, []);

  // Create new policy with optional file upload
  const handleCreatePolicy = async (policyData: CreatePolicyRequest, file?: File) => {
    try {
      const response: ApiResponse<PolicyApiResponse> = await apiService.createPolicy(policyData, token!);
      
      if (response.success && response.data) {
        toast.success('Policy created successfully');
        
        // If there's a file, upload it after creating the policy
        if (file) {
          await handleFileUpload(response.data.id, file);
        }
        
        await fetchPolicies(); // Refresh the list
        setShowAddDialog(false);
      } else {
        throw new Error(response.error || 'Failed to create policy');
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create policy');
    }
  };

  // Update policy with optional file upload/deletion
  const handleUpdatePolicy = async (id: number, policyData: UpdatePolicyRequest, file?: File, deleteCurrentFile?: boolean) => {
    try {
      const response: ApiResponse<PolicyApiResponse> = await apiService.updatePolicy(id, policyData, token!);
      
      if (response.success) {
        toast.success('Policy updated successfully');
        
        // Handle file operations after policy update
        if (deleteCurrentFile) {
          try {
            await apiService.deletePolicyFile(id, token!);
            toast.success('File deleted successfully');
          } catch (error) {
            console.error('Error deleting file:', error);
            toast.error('Policy updated but failed to delete file');
          }
        }
        
        // If there's a new file to upload
        if (file) {
          try {
            await handleFileUpload(id, file);
          } catch (error) {
            console.error('Error uploading new file:', error);
            toast.error('Policy updated but failed to upload new file');
          }
        }
        
        await fetchPolicies(); // Refresh the list
        setShowEditDialog(false);
        setCurrentPolicy(null);
      } else {
        throw new Error(response.error || 'Failed to update policy');
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update policy');
    }
  };

  // Delete policy
  const handleDeletePolicy = async (id: number) => {
    try {
      const response: ApiResponse<void> = await apiService.deletePolicy(id, token!);
      
      if (response.success) {
        toast.success('Policy deleted successfully');
        await fetchPolicies(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to delete policy');
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete policy');
    }
  };

  // Upload file for policy
  const handleFileUpload = async (policyId: number, file: File) => {
    try {
      const response = await apiService.uploadPolicyFile(policyId, file, token!);
      
      if (response.success) {
        toast.success('File uploaded successfully');
        await fetchPolicies(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    }
  };

  // Download file
  const handleFileDownload = async (policyId: number, fileName: string) => {
    try {
      const blob = await apiService.downloadPolicyFile(policyId, token!);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  // Clear search function - clears search and closes all accordions
  const clearSearch = () => {
    setSearchTerm("");
    // Close all accordions when clearing search for a clean reset
    setExpandedAccordions({
      'Kebijakan': false,
      'SOP': false,
      'Pedoman': false,
      'Petunjuk Teknis': false
    });
  };

  // Selection mode functions
  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setSelectedPolicies(new Set());
      setIsSelectAll(false);
      setIsSelectionMode(false);
    } else {
      setIsSelectionMode(true);
    }
  };

  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedPolicies(new Set());
      setIsSelectAll(false);
    } else {
      const allPolicyIds = new Set(policies.map(policy => policy.id));
      setSelectedPolicies(allPolicyIds);
      setIsSelectAll(true);
    }
  };

  const handlePolicySelection = (policyId: number) => {
    const newSelected = new Set(selectedPolicies);
    if (newSelected.has(policyId)) {
      newSelected.delete(policyId);
    } else {
      newSelected.add(policyId);
    }
    setSelectedPolicies(newSelected);
    setIsSelectAll(newSelected.size === policies.length);
  };

  // Update select all state when policies change
  useEffect(() => {
    if (selectedPolicies.size === 0) {
      setIsSelectAll(false);
    } else if (selectedPolicies.size === policies.length) {
      setIsSelectAll(true);
    } else {
      setIsSelectAll(false);
    }
  }, [selectedPolicies.size, policies.length]);

  // Toggle accordion
  const toggleAccordion = (category: string) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Helper function to get policies by category with search filtering
  const getPoliciesByCategory = useCallback((category: string) => {
    return policies.filter(policy => {
      const matchesCategory = policy.kategori === category;
      const matchesSearch = !searchTerm || 
        policy.no_dokumen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.nama_dokumen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatDate(policy.tanggal_dokumen).toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [policies, searchTerm, formatDate]);

  // Helper function to count old documents by category
  const getOldDocumentsByCategory = useCallback((category: string) => {
    return getPoliciesByCategory(category).filter(policy => isDocumentOld(policy.tanggal_dokumen)).length;
  }, [getPoliciesByCategory, isDocumentOld]);

  // Handle search with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    
    // If there's a search term, expand all accordions to show results
    if (value && value.trim().length > 0) {
      // Expand all accordions when searching to show results
      setExpandedAccordions({
        'Kebijakan': true,
        'SOP': true,
        'Pedoman': true,
        'Petunjuk Teknis': true
      });
    } else if (!value || value.trim().length === 0) {
      // Close all accordions when search is empty/cleared
      setExpandedAccordions({
        'Kebijakan': false,
        'SOP': false,
        'Pedoman': false,
        'Petunjuk Teknis': false
      });
    }
  }, []);

  const handleShowDetail = (policy: Policy) => {
    setCurrentPolicy(policy);
    setShowDetailDialog(true);
  };

  const handleShowEdit = (policy: Policy) => {
    setCurrentPolicy(policy);
    setShowEditDialog(true);
  };

  // Excel export function
  const handleExportToExcel = useCallback(() => {
    if (selectedPolicies.size === 0) return;

    // Get selected policies data
    const selectedPoliciesData = policies.filter(policy => 
      selectedPolicies.has(policy.id)
    );

    // Prepare data for Excel export
    const exportData = selectedPoliciesData.map(policy => ({
      'No Dokumen': policy.no_dokumen,
      'Nama Dokumen': policy.nama_dokumen,
      'Kategori': policy.kategori,
      'Tanggal Dokumen': formatDate(policy.tanggal_dokumen),
      'Status File': policy.file_name ? 'Ada File' : 'Tidak Ada File',
      'Nama File': policy.file_name || '-',
      'Ukuran File': policy.file_size ? formatFileSize(policy.file_size) : '-',
      'Status Dokumen': isDocumentOld(policy.tanggal_dokumen) ? 'Perlu Review' : 'Aktif',
      'Dibuat Oleh': policy.created_by,
      'Tanggal Dibuat': formatDate(policy.created_at)
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // No Dokumen
      { wch: 40 }, // Nama Dokumen
      { wch: 20 }, // Kategori
      { wch: 15 }, // Tanggal Dokumen
      { wch: 12 }, // Status File
      { wch: 30 }, // Nama File
      { wch: 12 }, // Ukuran File
      { wch: 15 }, // Status Dokumen
      { wch: 20 }, // Dibuat Oleh
      { wch: 15 }  // Tanggal Dibuat
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Policy Export');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `policy_export_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);
  }, [selectedPolicies, policies, formatDate, formatFileSize, isDocumentOld]);

  const openDeleteConfirmation = (policyId: number) => {
    setConfirmDelete({ show: true, policyId });
  };

  const confirmDeletePolicy = async () => {
    if (confirmDelete.policyId) {
      await handleDeletePolicy(confirmDelete.policyId);
      setConfirmDelete({ show: false, policyId: null });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
          <Sidebar />
          <div className="flex-1 md:ml-60 p-6">
            <div className="flex justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading policies...</p>
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Policy Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage organizational policies, SOPs, guidelines, and technical instructions
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {policies.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Policies
              </div>
            </div>
          </div>

              {/* Search Bar, Select All, Export Button, and Add Button */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search policies by document number, name, category, or date..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                  />
                </div>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Clear Search
                  </button>
                )}
                
                {/* Select/Cancel Button */}
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

                {/* Select All Button - Only show in selection mode */}
                {isSelectionMode && (
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {isSelectAll ? 'Deselect All' : 'Select All'}
                  </button>
                )}

                {/* Export to Excel Button - Only show in selection mode */}
                {isSelectionMode && (
                  <button
                    onClick={handleExportToExcel}
                    disabled={selectedPolicies.size === 0}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${
                      selectedPolicies.size === 0
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                    title={selectedPolicies.size === 0 ? 'Select policies to export' : `Export ${selectedPolicies.size} selected policies`}
                  >
                    <FaFileExcel className="w-4 h-4" />
                    Export Excel
                    {selectedPolicies.size > 0 && (
                      <span className="bg-green-800 text-white px-2 py-1 rounded-full text-xs">
                        {selectedPolicies.size}
                      </span>
                    )}
                  </button>
                )}

                {/* Add Policy Button - Hide in selection mode */}
                {!isSelectionMode && (
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Policy
                  </button>
                )}
              </div>

            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  {/* Accordion Header */}
                  <button
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    onClick={() => toggleAccordion(category)}
                  >
                    <h2 className="text-xl font-semibold">{category}</h2>
                    <div className="flex items-center gap-3">
                      {/* Total documents counter */}
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm font-medium">
                          {getPoliciesByCategory(category).length}
                        </span>
                      </div>
                      
                      {/* Old documents counter */}
                      {getOldDocumentsByCategory(category) > 0 && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-sm font-medium">
                            {getOldDocumentsByCategory(category)}
                          </span>
                        </div>
                      )}
                      
                      {/* Expand/collapse arrow */}
                      <svg
                        className={`w-5 h-5 transition-transform ${expandedAccordions[category] ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {expandedAccordions[category] && (
                    <div className="px-6 pb-4">
                      {getPoliciesByCategory(category).length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          No policies found in this category
                        </p>
                      ) : (
                        <div className="space-y-2">
                            {getPoliciesByCategory(category).map((policy) => (
                              <div
                                key={policy.id}
                                className="flex items-center gap-3 p-3 bg-blue-100 dark:bg-gray-700 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                              >
                                {/* Checkbox - Only show in selection mode */}
                                {isSelectionMode && (
                                  <input
                                    type="checkbox"
                                    checked={selectedPolicies.has(policy.id)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handlePolicySelection(policy.id);
                                    }}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                                
                                {/* Policy Content - Clickable */}
                                <div 
                                  className="flex-1 cursor-pointer"
                                  onClick={() => handleShowDetail(policy)}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="font-medium min-w-[120px]">{policy.no_dokumen}</div>
                                    <div className="text-gray-600 dark:text-gray-300 flex-1">{policy.nama_dokumen}</div>
                                    
                                    {/* Date and Old Document Alert */}
                                    <div className="flex items-center gap-2 min-w-[140px]">
                                      <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(policy.tanggal_dokumen)}</div>
                                      {/* Red danger icon for old documents */}
                                      {isDocumentOld(policy.tanggal_dokumen) && (
                                        <div title="Old Document - Needs Review">
                                          <svg 
                                            className="w-4 h-4 text-red-600 dark:text-red-400" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 ml-4">
                                  {/* Action buttons */}
                                  <button
                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors dark:text-blue-400 dark:hover:text-blue-500"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShowEdit(policy);
                                    }}
                                    title="Edit Policy"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDeleteConfirmation(policy.id);
                                    }}
                                    title="Delete Policy"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
        </div>
      </div>

      {/* Dialog Components */}
      {showAddDialog && (
        <AddPolicyModal
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onSave={handleCreatePolicy}
        />
      )}

      {showDetailDialog && currentPolicy && (
        <PolicyDetailDialog
          policy={currentPolicy}
          onClose={() => {
            setShowDetailDialog(false);
            setCurrentPolicy(null);
          }}
          onFileDownload={handleFileDownload}
          isDocumentOld={isDocumentOld}
          formatDate={formatDate}
          formatFileSize={formatFileSize}
        />
      )}

      {showEditDialog && currentPolicy && (
        <EditPolicyDialog
          policy={currentPolicy}
          onClose={() => {
            setShowEditDialog(false);
            setCurrentPolicy(null);
          }}
          onSave={(updatedPolicy, file, deleteCurrentFile) => handleUpdatePolicy(currentPolicy.id, updatedPolicy, file, deleteCurrentFile)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmDelete.show}
        onCancel={() => setConfirmDelete({ show: false, policyId: null })}
        onConfirm={confirmDeletePolicy}
        message="Are you sure you want to delete this policy? This action cannot be undone."
      />
    </ProtectedRoute>
  );
}

interface PolicyDetailDialogProps {
  policy: Policy;
  onClose: () => void;
  onFileDownload: (policyId: number, fileName: string) => void;
  isDocumentOld: (dateString: string) => boolean;
  formatDate: (dateString: string) => string;
  formatFileSize: (bytes: number) => string;
}

function PolicyDetailDialog({ policy, onClose, onFileDownload, isDocumentOld, formatDate, formatFileSize }: PolicyDetailDialogProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 lg:w-3/4 max-h-[90vh] overflow-y-auto text-gray-900 dark:text-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-bold">{policy.nama_dokumen}</h3>
            {isDocumentOld(policy.tanggal_dokumen) && (
              <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Document Needs Review
              </div>
            )}
          </div>
          <button
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">No Dokumen</div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">{policy.no_dokumen}</div>
            </div>
            
            <div>
              <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Kategori</div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                  {policy.kategori}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Dokumen</div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">{policy.nama_dokumen}</div>
            </div>
            
            <div>
              <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Tanggal Dokumen</div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">{formatDate(policy.tanggal_dokumen)}</div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="font-bold text-gray-700 dark:text-gray-300 mb-3">Attached Files</div>
          {policy.file_name ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">{policy.file_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {policy.file_size ? formatFileSize(policy.file_size) : 'Unknown size'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onFileDownload(policy.id, policy.file_name!)}
                  className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors"
                  title="Download File"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              No files attached to this policy
            </div>
          )}
        </div>
        
        {isDocumentOld(policy.tanggal_dokumen) && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Document Review Required</h4>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  This document is more than one year old and may need to be reviewed or updated to ensure it remains current and relevant.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditPolicyDialogProps {
  policy: Policy;
  onClose: () => void;
  onSave: (policyData: UpdatePolicyRequest, file?: File, deleteCurrentFile?: boolean) => void;
}

function EditPolicyDialog({ policy, onClose, onSave }: EditPolicyDialogProps) {
  const [formState, setFormState] = useState({
    no_dokumen: policy.no_dokumen,
    nama_dokumen: policy.nama_dokumen,
    tanggal_dokumen: policy.tanggal_dokumen,
    kategori: policy.kategori,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteCurrentFile, setDeleteCurrentFile] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setDeleteCurrentFile(false); // Reset delete flag when new file is selected
    }
  };

  const handleDeleteCurrentFile = () => {
    setDeleteCurrentFile(true);
    setSelectedFile(null); // Clear any selected new file
  };

  const handleSave = () => {
    onSave(formState, selectedFile || undefined, deleteCurrentFile);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 lg:w-3/4 max-h-[90vh] overflow-y-auto text-gray-900 dark:text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Edit Policy</h3>
          <button
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">No Dokumen *</label>
            <input
              name="no_dokumen"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              value={formState.no_dokumen}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Kategori *</label>
            <select
              name="kategori"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              value={formState.kategori}
              onChange={handleChange}
              required
            >
              <option value="Kebijakan">Kebijakan</option>
              <option value="SOP">SOP</option>
              <option value="Pedoman">Pedoman</option>
              <option value="Petunjuk Teknis">Petunjuk Teknis</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Dokumen *</label>
            <input
              name="nama_dokumen"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              value={formState.nama_dokumen}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Tanggal Dokumen *</label>
            <input
              name="tanggal_dokumen"
              type="date"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              value={formState.tanggal_dokumen}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* File Management Section */}
        <div className="mb-6">
          <div className="font-bold text-gray-700 dark:text-gray-300 mb-3">File Management</div>
          
          {/* Current File Display */}
          {policy.file_name && !deleteCurrentFile && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Current File:</h4>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">{policy.file_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {policy.file_size ? formatFileSize(policy.file_size) : 'Unknown size'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDeleteCurrentFile}
                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors"
                  title="Remove current file"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* File Deletion Confirmation */}
          {deleteCurrentFile && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-medium">Current file will be deleted when you save changes</span>
              </div>
            </div>
          )}

          {/* Upload New File */}
          <div>
            <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
              {policy.file_name && !deleteCurrentFile ? 'Replace with New File (PDF):' : 'Upload New File (PDF):'}
            </h4>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf"
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Supported format: PDF (Max 10MB)
              </p>
            </div>
          </div>

          {/* New File Preview */}
          {selectedFile && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">New File Selected:</h4>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(selectedFile.size)}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors"
                  title="Remove selected file"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-4 py-2 rounded transition-colors" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors" 
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}