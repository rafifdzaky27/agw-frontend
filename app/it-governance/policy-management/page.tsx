"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { FaSearch, FaFileExcel, FaTimes, FaCheck  } from "react-icons/fa";
import * as XLSX from 'xlsx';

// Define Policy interface
interface Policy {
  id: string;
  noDokumen: string;
  namaDokumen: string;
  tanggalDokumen: string;
  kategori: 'Kebijakan' | 'SOP' | 'Pedoman' | 'Petunjuk Teknis';
  files: PolicyFile[];
}

// Define File interface for uploaded files
interface PolicyFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export default function PolicyManagement() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState<Policy | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedAccordions, setExpandedAccordions] = useState<{[key: string]: boolean}>({
    'Kebijakan': false,
    'SOP': false,
    'Pedoman': false,
    'Petunjuk Teknis': false
  });

  // State for checkbox selection
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Categories for the accordion containers
  const categories = ['Kebijakan', 'SOP', 'Pedoman', 'Petunjuk Teknis'] as const;

  // Mock data for policies (replacing API calls)
  const mockPolicies: Policy[] = [
    {
      id: "1",
      noDokumen: "KB-001/2023",
      namaDokumen: "Kebijakan Keamanan Informasi",
      tanggalDokumen: "2023-01-15",
      kategori: "Kebijakan",
      files: [
        { id: "f1", name: "kebijakan-keamanan.pdf", size: 1024000, type: "application/pdf", url: "/files/policies/kebijakan-keamanan.pdf" }
      ]
    },
    {
      id: "2",
      noDokumen: "SOP-001/2022",
      namaDokumen: "SOP Pengelolaan Data",
      tanggalDokumen: "2022-06-10",
      kategori: "SOP",
      files: [
        { id: "f2", name: "sop-data.docx", size: 512000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", url: "/files/policies/sop-data.docx" }
      ]
    },
    {
      id: "3",
      noDokumen: "PD-001/2024",
      namaDokumen: "Pedoman Implementasi IT Governance",
      tanggalDokumen: "2024-03-20",
      kategori: "Pedoman",
      files: []
    },
    {
      id: "4",
      noDokumen: "PT-001/2021",
      namaDokumen: "Petunjuk Teknis Backup Data",
      tanggalDokumen: "2021-12-05",
      kategori: "Petunjuk Teknis",
      files: [
        { id: "f4", name: "petunjuk-backup.pdf", size: 2048000, type: "application/pdf", url: "/files/policies/petunjuk-backup.pdf" }
      ]
    },
    {
      id: "5",
      noDokumen: "KB-002/2022",
      namaDokumen: "Kebijakan Penggunaan Sistem",
      tanggalDokumen: "2022-03-15",
      kategori: "Kebijakan",
      files: [
        { id: "f5", name: "kebijakan-sistem.pdf", size: 1536000, type: "application/pdf", url: "/files/policies/kebijakan-sistem.pdf" }
      ]
    }
  ];

  // Load mock data for policies (temporary solution)
  useEffect(() => {
    const loadMockData = async () => {
      try {
        setLoading(true);
        
        // Simulate API loading delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use mock data directly
        console.log("Loading mock data for policy management");
        setPolicies(mockPolicies);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load mock policies", error);
        setPolicies([]);
        setLoading(false);
      }
    };
    
    loadMockData();
  }, []);

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

  const handleSelectPolicy = (policyId: string) => {
    const newSelected = new Set(selectedPolicies);
    if (newSelected.has(policyId)) {
      newSelected.delete(policyId);
    } else {
      newSelected.add(policyId);
    }
    setSelectedPolicies(newSelected);
    
    // Update select all state
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

  // Helper function to check if document is old (more than 1 year)
  const isDocumentOld = (dateString: string): boolean => {
    const docDate = new Date(dateString);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return docDate < oneYearAgo;
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Excel export function
  const handleExportToExcel = () => {
    if (selectedPolicies.size === 0) return;

    // Get selected policies data
    const selectedPoliciesData = policies.filter(policy => 
      selectedPolicies.has(policy.id)
    );

    // Prepare data for Excel export
    const exportData = selectedPoliciesData.map(policy => ({
      'No Dokumen': policy.noDokumen,
      'Nama Dokumen': policy.namaDokumen,
      'Kategori': policy.kategori,
      'Tanggal Dokumen': formatDate(policy.tanggalDokumen),
      'Jumlah File': policy.files.length,
      'Status Dokumen': isDocumentOld(policy.tanggalDokumen) ? 'Perlu Review' : 'Aktif'
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
      { wch: 12 }, // Jumlah File
      { wch: 15 }  // Status Dokumen
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Policy Export');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `policy_export_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);
  };

  // Helper function to get policies by category with search filtering
  const getPoliciesByCategory = useCallback((category: string) => {
    return policies.filter(policy => {
      const matchesCategory = policy.kategori === category;
      const matchesSearch = !searchTerm || 
        policy.noDokumen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.namaDokumen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.tanggalDokumen.includes(searchTerm);
      
      return matchesCategory && matchesSearch;
    });
  }, [policies, searchTerm]);

  // Helper function to count old documents by category
  const getOldDocumentsByCategory = useCallback((category: string) => {
    return getPoliciesByCategory(category).filter(policy => isDocumentOld(policy.tanggalDokumen)).length;
  }, [getPoliciesByCategory]);

  // Toggle accordion
  const toggleAccordion = (category: string) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

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

  // Policy management functions
  const handleAddPolicy = useCallback(async (policy: Omit<Policy, 'id'>) => {
    try {
      const newId = (policies.length + 1).toString();
      const newPolicy: Policy = {
        ...policy,
        id: newId,
        files: []
      };
      setPolicies((prev: Policy[]) => [...prev, newPolicy]);
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error adding policy:", error);
    }
  }, [policies.length]);

  const handleUpdatePolicy = useCallback(async (updatedPolicy: Policy) => {
    try {
      setPolicies((prev: Policy[]) => 
        prev.map(p => p.id === updatedPolicy.id ? updatedPolicy : p)
      );
      setShowEditDialog(false);
      setCurrentPolicy(null);
    } catch (error) {
      console.error("Error updating policy:", error);
    }
  }, []);

  const handleDeletePolicy = useCallback(async (policyId: string) => {
    try {
      setPolicies((prev: Policy[]) => prev.filter(p => p.id !== policyId));
      setSelectedPolicies(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(policyId);
        return newSelected;
      });
    } catch (error) {
      console.error("Error deleting policy:", error);
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

          {loading ? (
            <div className="flex justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading policies...</p>
            </div>
          ) : (
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
                                    handleSelectPolicy(policy.id);
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
                                  <div className="font-medium min-w-[120px]">{policy.noDokumen}</div>
                                  <div className="text-gray-600 dark:text-gray-300 flex-1">{policy.namaDokumen}</div>
                                  
                                  {/* Date and Old Document Alert */}
                                  <div className="flex items-center gap-2 min-w-[140px]">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(policy.tanggalDokumen)}</div>
                                    {/* Red danger icon for old documents */}
                                    {isDocumentOld(policy.tanggalDokumen) && (
                                      <svg 
                                        className="w-4 h-4 text-red-600 dark:text-red-400" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                        title="Old Document - Needs Review"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                      </svg>
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
                                    handleDeletePolicy(policy.id);
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
          )}
        </div>
      </div>

      {/* Dialog Components */}
      {showAddDialog && (
        <AddPolicyDialog
          onClose={() => setShowAddDialog(false)}
          onSave={handleAddPolicy}
        />
      )}

      {showDetailDialog && currentPolicy && (
        <PolicyDetailDialog
          policy={currentPolicy}
          onClose={() => {
            setShowDetailDialog(false);
            setCurrentPolicy(null);
          }}
        />
      )}

      {showEditDialog && currentPolicy && (
        <EditPolicyDialog
          policy={currentPolicy}
          onClose={() => {
            setShowEditDialog(false);
            setCurrentPolicy(null);
          }}
          onSave={handleUpdatePolicy}
        />
      )}
    </ProtectedRoute>
  );
}

// Dialog Components
interface AddPolicyDialogProps {
  onClose: () => void;
  onSave: (policy: Omit<Policy, 'id'>) => void;
}

function AddPolicyDialog({ onClose, onSave }: AddPolicyDialogProps) {
  const [formState, setFormState] = useState({
    noDokumen: "",
    namaDokumen: "",
    tanggalDokumen: "",
    kategori: "Kebijakan" as const,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

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
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveClick = () => {
    if (!formState.noDokumen || !formState.namaDokumen || !formState.tanggalDokumen) {
      alert("Please fill in all required fields");
      return;
    }
    setIsConfirmationOpen(true);
  };

  const confirmSave = () => {
    onSave({
      ...formState,
      files: files as any
    });
    setIsConfirmationOpen(false);
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 lg:w-2/3 max-h-[90vh] overflow-y-auto text-gray-900 dark:text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add New Policy</h3>
          <button
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">No Dokumen *</div>
            <input
              name="noDokumen"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="Enter document number"
              value={formState.noDokumen}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Kategori *</div>
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
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Dokumen *</div>
            <input
              name="namaDokumen"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="Enter document name"
              value={formState.namaDokumen}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Tanggal Dokumen *</div>
            <input
              type="date"
              name="tanggalDokumen"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              value={formState.tanggalDokumen}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="mb-6">
          <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Upload Files</div>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
            </p>
          </div>
          
          {files.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Selected Files:</h4>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <div className="font-medium">{file.name}</div>
                        <div className="text-sm text-gray-500">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900 p-1 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={handleSaveClick}
          >
            Save Policy
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          
          <ConfirmationModal
            isOpen={isConfirmationOpen}
            onConfirm={confirmSave}
            onCancel={() => setIsConfirmationOpen(false)}
            message="Are you sure you want to save this policy?"
          />
        </div>
      </div>
    </div>
  );
}

interface PolicyDetailDialogProps {
  policy: Policy;
  onClose: () => void;
}

function PolicyDetailDialog({ policy, onClose }: PolicyDetailDialogProps) {
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const isDocumentOld = (dateString: string): boolean => {
    const docDate = new Date(dateString);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return docDate < oneYearAgo;
  };

  const downloadFile = (file: PolicyFile) => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 lg:w-3/4 max-h-[90vh] overflow-y-auto text-gray-900 dark:text-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-bold">{policy.namaDokumen}</h3>
            {isDocumentOld(policy.tanggalDokumen) && (
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
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">{policy.noDokumen}</div>
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
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">{policy.namaDokumen}</div>
            </div>
            
            <div>
              <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Tanggal Dokumen</div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">{formatDate(policy.tanggalDokumen)}</div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="font-bold text-gray-700 dark:text-gray-300 mb-3">Attached Files</div>
          {policy.files && policy.files.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {policy.files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)} • {file.type}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadFile(file)}
                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors"
                    title="Download File"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              ))}
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
        
        {isDocumentOld(policy.tanggalDokumen) && (
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
  onSave: (policy: Policy) => void;
}

function EditPolicyDialog({ policy, onClose, onSave }: EditPolicyDialogProps) {
  const [formState, setFormState] = useState({
    noDokumen: policy.noDokumen,
    namaDokumen: policy.namaDokumen,
    tanggalDokumen: policy.tanggalDokumen,
    kategori: policy.kategori,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave({ ...policy, ...formState });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 lg:w-2/3 text-gray-900 dark:text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Edit Policy</h3>
          <button onClick={onClose}>✕</button>
        </div>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold mb-1">No Dokumen *</label>
            <input
              name="noDokumen"
              className="w-full p-2 border rounded"
              value={formState.noDokumen}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block font-bold mb-1">Kategori *</label>
            <select
              name="kategori"
              className="w-full p-2 border rounded"
              value={formState.kategori}
              onChange={handleChange}
            >
              <option value="Kebijakan">Kebijakan</option>
              <option value="SOP">SOP</option>
              <option value="Pedoman">Pedoman</option>
              <option value="Petunjuk Teknis">Petunjuk Teknis</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block font-bold mb-1">Nama Dokumen *</label>
            <input
              name="namaDokumen"
              className="w-full p-2 border rounded"
              value={formState.namaDokumen}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block font-bold mb-1">Tanggal Dokumen *</label>
            <input
              name="tanggalDokumen"
              type="date"
              className="w-full p-2 border rounded"
              value={formState.tanggalDokumen}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={onClose}>
            Cancel
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
