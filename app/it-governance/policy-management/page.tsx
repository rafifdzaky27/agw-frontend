"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { ConfirmationModal } from "@/components/ConfirmationModal";

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
  const [expandedAccordions, setExpandedAccordions] = useState<{[key: string]: boolean}>({
    'Kebijakan': false,
    'SOP': false,
    'Pedoman': false,
    'Petunjuk Teknis': false
  });

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
    },
    {
      id: "6",
      noDokumen: "SOP-002/2021",
      namaDokumen: "SOP Manajemen Insiden",
      tanggalDokumen: "2021-08-20",
      kategori: "SOP",
      files: [
        { id: "f6", name: "sop-insiden.docx", size: 768000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", url: "/files/policies/sop-insiden.docx" }
      ]
    },
    {
      id: "7",
      noDokumen: "PD-002/2023",
      namaDokumen: "Pedoman Audit Internal",
      tanggalDokumen: "2023-11-10",
      kategori: "Pedoman",
      files: [
        { id: "f7", name: "pedoman-audit.pdf", size: 2304000, type: "application/pdf", url: "/files/policies/pedoman-audit.pdf" }
      ]
    },
    {
      id: "8",
      noDokumen: "PT-002/2020",
      namaDokumen: "Petunjuk Teknis Monitoring Jaringan",
      tanggalDokumen: "2020-09-15",
      kategori: "Petunjuk Teknis",
      files: [
        { id: "f8", name: "petunjuk-monitoring.pdf", size: 1792000, type: "application/pdf", url: "/files/policies/petunjuk-monitoring.pdf" }
      ]
    },
    {
      id: "9",
      noDokumen: "KB-003/2020",
      namaDokumen: "Kebijakan Manajemen Risiko",
      tanggalDokumen: "2020-05-12",
      kategori: "Kebijakan",
      files: [
        { id: "f9", name: "kebijakan-risiko.pdf", size: 1280000, type: "application/pdf", url: "/files/policies/kebijakan-risiko.pdf" }
      ]
    },
    {
      id: "10",
      noDokumen: "SOP-003/2024",
      namaDokumen: "SOP Pengelolaan Aset IT",
      tanggalDokumen: "2024-01-08",
      kategori: "SOP",
      files: [
        { id: "f10", name: "sop-aset-it.docx", size: 896000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", url: "/files/policies/sop-aset-it.docx" }
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

  // Function to save new policy
  const handleAddPolicy = useCallback(async (policy: Omit<Policy, 'id'>) => {
  try {
    const newId = (policies.length + 1).toString();
    const newPolicy: Policy = {
      ...policy,
      id: newId,
      files: []
    };

    setTimeout(() => {
      setPolicies((prev: Policy[]) => [...prev, newPolicy]);
      setShowAddDialog(false);
      console.log("Policy added (mock):", newPolicy);
    }, 300);
  } catch (error) {
    console.error("Failed to save policy (mock)", error);
  }
}, [policies]);

  // Function to update existing policy
  const handleUpdatePolicy = useCallback(async (policy: Policy) => {
    try {
      // Simulate API delay for mock update
      setTimeout(() => {
        setPolicies((prev: Policy[]) =>
          prev.map((item) => (item.id === policy.id ? policy : item))
        );
        setShowEditDialog(false);
        console.log("Policy updated (mock):", policy);
      }, 300);
    } catch (error) {
      console.error("Failed to update policy (mock)", error);
    }
  }, []);

  // Function to delete policy
  const handleDeletePolicy = useCallback(async (id: string) => {
    try {
      // Simulate API delay
      setTimeout(() => {
        setPolicies((prev: Policy[]) => prev.filter((item) => item.id !== id));
        setShowDetailDialog(false);
        console.log("Policy deleted (mock):", id);
      }, 300);
    } catch (error) {
      console.error("Failed to delete policy (mock)", error);
    }
  }, []);

  // Function to show policy details
  const handleShowDetail = useCallback((policy: Policy) => {
    setCurrentPolicy(policy);
    setShowDetailDialog(true);
  }, []);

  // Function to show edit dialog
  const handleShowEdit = useCallback((policy: Policy) => {
    setCurrentPolicy(policy);
    setShowEditDialog(true);
  }, []);

  // Toggle accordion
  const toggleAccordion = (category: string) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Check if document is a year old or more
  const isDocumentOld = (dateString: string): boolean => {
    const docDate = new Date(dateString);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return docDate <= oneYearAgo;
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  // Get policies by category
  const getPoliciesByCategory = (category: string) => {
    return policies.filter(policy => policy.kategori === category);
  };

  // Get count of old documents by category
  const getOldDocumentsByCategory = (category: string) => {
    return policies.filter(policy => 
      policy.kategori === category && isDocumentOld(policy.tanggalDokumen)
    ).length;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
        <Sidebar />
        <div className="flex-1 md:ml-60 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Policy Management</h1>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              onClick={() => setShowAddDialog(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add Policy
            </button>
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
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                              onClick={() => handleShowDetail(policy)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-4">
                                  <div className="font-medium min-w-[120px]">{policy.noDokumen}</div>
                                  <div className="text-gray-600 dark:text-gray-300 flex-1">{policy.namaDokumen}</div>
                                  
                                  {/* Date and Old Document Alert - Consistent Position */}
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
                                  className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors"
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

          {/* Add Policy Dialog */}
          {showAddDialog && (
            <AddPolicyDialog
              onClose={() => setShowAddDialog(false)}
              onSave={handleAddPolicy}
            />
          )}

          {/* Edit Policy Dialog */}
          {showEditDialog && currentPolicy && (
            <EditPolicyDialog
              policy={currentPolicy}
              onClose={() => setShowEditDialog(false)}
              onSave={handleUpdatePolicy}
            />
          )}

          {/* Policy Detail Dialog */}
          {showDetailDialog && currentPolicy && (
            <PolicyDetailDialog
              policy={currentPolicy}
              onClose={() => setShowDetailDialog(false)}
              onEdit={() => {
                setShowDetailDialog(false);
                handleShowEdit(currentPolicy);
              }}
              onDelete={() => handleDeletePolicy(currentPolicy.id)}
              formatDate={formatDate}
              isDocumentOld={isDocumentOld}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
// Add Policy Dialog Component
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
    const policyFiles: PolicyFile[] = files.map((file, index) => ({
      id: `temp-${index}`,
      name: file.name,
      size: file.size,
      type: file.type
    }));

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
        
        {/* File Upload Section */}
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
          
          {/* File List */}
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

// Edit Policy Dialog Component
interface EditPolicyDialogProps {
  policy: Policy;
  onClose: () => void;
  onSave: (policy: Policy) => void;
}

function EditPolicyDialog({ policy, onClose, onSave }: EditPolicyDialogProps) {
  const [formState, setFormState] = useState({
    id: policy.id,
    noDokumen: policy.noDokumen,
    namaDokumen: policy.namaDokumen,
    tanggalDokumen: policy.tanggalDokumen,
    kategori: policy.kategori,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<PolicyFile[]>(policy.files || []);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

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

  const removeExistingFile = (fileId: string) => {
    setExistingFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleSaveClick = () => {
    if (!formState.noDokumen || !formState.namaDokumen || !formState.tanggalDokumen) {
      alert("Please fill in all required fields");
      return;
    }
    setIsConfirmationOpen(true);
  };

  const confirmSave = () => {
    const allFiles = [...existingFiles, ...files] as any;
    onSave({
      ...formState,
      files: allFiles
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
        
        {/* File Management Section */}
        <div className="mb-6">
          <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Manage Files</div>
          
          {/* Existing Files */}
          {existingFiles.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Current Files:</h4>
              <div className="space-y-2">
                {existingFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900 rounded">
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
                      onClick={() => removeExistingFile(file.id)}
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
          
          {/* Add New Files */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Add new files (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)
            </p>
          </div>
          
          {/* New Files List */}
          {files.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">New Files to Add:</h4>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900 rounded">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            Update Policy
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
            message="Are you sure you want to update this policy?"
          />
        </div>
      </div>
    </div>
  );
}
// Policy Detail Dialog Component
interface PolicyDetailDialogProps {
  policy: Policy;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
  isDocumentOld: (date: string) => boolean;
}

function PolicyDetailDialog({ policy, onClose, onEdit, onDelete, formatDate, isDocumentOld }: PolicyDetailDialogProps) {
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteConfirmationOpen(true);
  };

  const confirmDelete = () => {
    onDelete();
    setIsDeleteConfirmationOpen(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        
        {/* Policy Information */}
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
        
        {/* Files Section */}
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
        
        {/* Document Age Warning */}
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
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
            onClick={onEdit}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Policy
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
            onClick={handleDeleteClick}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Policy
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            Close
          </button>
          
          <ConfirmationModal
            isOpen={isDeleteConfirmationOpen}
            onConfirm={confirmDelete}
            onCancel={() => setIsDeleteConfirmationOpen(false)}
            message="Are you sure you want to delete this policy? This action cannot be undone."
          />
        </div>
      </div>
    </div>
  );
}
