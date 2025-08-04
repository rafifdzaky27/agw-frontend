"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaCheck, FaTimes, FaChevronLeft, FaChevronRight, FaFileExcel } from "react-icons/fa";
import AgreementModal from "./components/AgreementModal";
import AgreementDetailModal from "./components/AgreementDetailModal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import toast from "react-hot-toast";
import { usePortfolio, usePortfolioExport } from "./hooks/usePortfolio";
import { Agreement } from "./services/portfolioApi";

export default function PortfolioManagementPage() {
  const { user, token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [selectedAgreements, setSelectedAgreements] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [agreementToDelete, setAgreementToDelete] = useState<Agreement | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Use custom hooks for real API calls
  const {
    agreements,
    loading,
    error,
    pagination,
    fetchAgreements,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    bulkDeleteAgreements,
  } = usePortfolio();

  const { exportData, exporting } = usePortfolioExport();

  // Fetch agreements on component mount and when filters change
  useEffect(() => {
    fetchAgreements({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
    });
  }, [fetchAgreements, currentPage, itemsPerPage, searchTerm]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Reset selection when changing pages or search
  useEffect(() => {
    setSelectedAgreements([]);
    setSelectedAgreement(null);
  }, [currentPage, searchTerm]);

  const handleNewAgreement = () => {
    setSelectedAgreement(null);
    setIsEditMode(false);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (selectedAgreements.length > 0) {
        await bulkDeleteAgreements(selectedAgreements);
        setSelectedAgreements([]);
        setIsSelectionMode(false);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
    setShowDeleteConfirm(false);
  };

  const handleSaveAgreement = async (agreementData: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt' | 'files'>) => {
    console.log("\n💾 ===== HANDLE SAVE AGREEMENT DEBUG =====");
    console.log("📅 Timestamp:", new Date().toISOString());
    console.log("🔧 Mode:", isEditMode ? 'EDIT' : 'CREATE');
    console.log("📋 Agreement Data:", agreementData);
    console.log("📋 Agreement Data Keys:", Object.keys(agreementData || {}));
    console.log("💰 Payment Terms in Save Data:", agreementData.terminPembayaran);
    console.log("💰 Payment Terms Count:", (agreementData.terminPembayaran || []).length);
    
    // Validate required fields
    const requiredFields = [
      'kodeProject', 'projectName', 'projectType', 'divisiInisiasi', 
      'grupTerlibat', 'namaVendor', 'noPKSPO', 'tanggalPKSPO', 
      'tanggalBAPP', 'tanggalBerakhir'
    ];
    
    const missingFields = requiredFields.filter(field => 
      !agreementData[field as keyof typeof agreementData] || 
      agreementData[field as keyof typeof agreementData] === ''
    );
    
    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields);
      toast.error(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Validate date formats
    const dateFields = ['tanggalPKSPO', 'tanggalBAPP', 'tanggalBerakhir'];
    for (const field of dateFields) {
      const dateValue = agreementData[field as keyof typeof agreementData];
      if (dateValue && typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          console.error(`❌ Invalid date format for ${field}:`, dateValue);
          toast.error(`Invalid date format for ${field}`);
          return;
        }
      }
    }
    
    // Validate project type
    const validProjectTypes = ['internal development', 'procurement', 'non procurement'];
    if (!validProjectTypes.includes(agreementData.projectType)) {
      console.error("❌ Invalid project type:", agreementData.projectType);
      toast.error(`Invalid project type: ${agreementData.projectType}`);
      return;
    }
    
    console.log("✅ Data validation passed");
    
    try {
      if (isEditMode && selectedAgreement) {
        console.log("🔄 Updating agreement with ID:", selectedAgreement.id);
        const updatedProject = await updateAgreement(selectedAgreement.id, agreementData);
        
        console.log("\n🔍 ===== POST-UPDATE VERIFICATION =====");
        console.log("📋 Updated project returned:", updatedProject);
        console.log("💰 Payment terms in response:", updatedProject?.terminPembayaran);
        console.log("💰 Payment terms count in response:", (updatedProject?.terminPembayaran || []).length);
        
        // Force refresh to get latest data from backend
        console.log("🔄 Force refreshing project data...");
        setTimeout(async () => {
          try {
            await fetchAgreements({
              page: currentPage,
              limit: itemsPerPage,
              search: searchTerm,
            });
            console.log("✅ Project list refreshed after save");
          } catch (error) {
            console.error("❌ Error refreshing project list:", error);
          }
        }, 1000); // Wait 1 second for backend to process
        
      } else {
        console.log("➕ Creating new agreement");
        await createAgreement(agreementData);
      }
      
      console.log("✅ Save operation completed successfully");
      setShowModal(false);
      setSelectedAgreement(null);
    } catch (err) {
      console.error('❌ Save error:', err);
      console.error('   Agreement data:', agreementData);
      console.error('   Is edit mode:', isEditMode);
      console.error('   Selected agreement:', selectedAgreement);
    }
  };

  const handleRowSelect = (agreement: Agreement) => {
    setSelectedAgreement(selectedAgreement?.id === agreement.id ? null : agreement);
  };

  const handleRowClick = (agreement: Agreement) => {
    console.log("\n🔍 ===== HANDLE ROW CLICK DEBUG =====");
    console.log("📅 Timestamp:", new Date().toISOString());
    console.log("📋 Clicked agreement:", agreement);
    console.log("📋 Agreement keys:", Object.keys(agreement || {}));
    console.log("💰 terminPembayaran exists:", !!agreement?.terminPembayaran);
    console.log("💰 terminPembayaran length:", agreement?.terminPembayaran?.length);
    console.log("💰 terminPembayaran data:", agreement?.terminPembayaran);
    console.log("🔍 ===== HANDLE ROW CLICK DEBUG END =====\n");
    
    if (isSelectionMode) {
      // In selection mode, toggle selection
      handleMultipleSelect(agreement.id);
    } else {
      // Normal mode, show detail
      setSelectedAgreement(agreement);
      setShowDetailModal(true);
    }
  };

  const handleMultipleSelect = (agreementId: string) => {
    setSelectedAgreements(prev => 
      prev.includes(agreementId) 
        ? prev.filter(id => id !== agreementId)
        : [...prev, agreementId]
    );
  };

  const handleSelectAll = () => {
    const currentPageIds = agreements.map(agreement => agreement.id);
    const allCurrentSelected = currentPageIds.every(id => selectedAgreements.includes(id));
    
    if (allCurrentSelected) {
      // Deselect all on current page
      setSelectedAgreements(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      // Select all on current page
      setSelectedAgreements(prev => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedAgreements([]);
    setSelectedAgreement(null);
  };

  const handleDeleteAgreement = () => {
    if (selectedAgreements.length > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const handleExportSelected = async () => {
    if (selectedAgreements.length === 0) {
      toast.error("Please select agreements to export");
      return;
    }

    try {
      await exportData({
        projectIds: selectedAgreements,
      });
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleEditFromDetail = () => {
    console.log("\n🔧 ===== HANDLE EDIT FROM DETAIL DEBUG =====");
    console.log("📅 Timestamp:", new Date().toISOString());
    console.log("📋 Selected Agreement:", selectedAgreement);
    console.log("📋 Selected Agreement Keys:", Object.keys(selectedAgreement || {}));
    
    if (selectedAgreement) {
      console.log("✅ Agreement data available:");
      console.log("   ID:", selectedAgreement.id);
      console.log("   kodeProject:", selectedAgreement.kodeProject);
      console.log("   projectName:", selectedAgreement.projectName);
      console.log("   projectType:", selectedAgreement.projectType);
      console.log("   divisiInisiasi:", selectedAgreement.divisiInisiasi);
      console.log("   grupTerlibat:", selectedAgreement.grupTerlibat);
    } else {
      console.error("❌ No selected agreement data!");
    }
    
    setShowDetailModal(false);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleCheckboxChange = (agreement: Agreement, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    handleRowSelect(agreement);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && agreements.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
          <Sidebar />
          <div className="flex-1 md:ml-60 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Portfolio Management
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {isSelectionMode 
                      ? "Select multiple agreements to delete them. Click Cancel to exit selection mode."
                      : "Click on any row to view agreement details. Use Select button for bulk operations."
                    }
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {pagination.total || agreements.length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total Agreements
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300">
                  {error} - Make sure backend is running at http://localhost:5006
                </p>
              </div>
            )}

            {/* Search Bar and Add Button */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by project code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              {!isSelectionMode ? (
                <>
                  <button
                    onClick={toggleSelectionMode}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                    title="Select multiple agreements for bulk operations"
                  >
                    <FaCheck className="text-sm" />
                    Select
                  </button>
                  
                  <button
                    onClick={handleNewAgreement}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <FaPlus className="text-sm" />
                    New Project
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={toggleSelectionMode}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <FaTimes className="text-sm" />
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleDeleteAgreement}
                    disabled={selectedAgreements.length === 0}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <FaTrash className="text-sm" />
                    Delete {selectedAgreements.length > 0 && `(${selectedAgreements.length})`}
                  </button>
                  
                  <button
                    onClick={handleExportSelected}
                    disabled={selectedAgreements.length === 0 || exporting}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <FaFileExcel className="text-sm" />
                    {exporting ? 'Exporting...' : `Export ${selectedAgreements.length > 0 ? `(${selectedAgreements.length})` : ''}`}
                  </button>                  
                  {selectedAgreements.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 px-3 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg whitespace-nowrap">
                      <FaCheck className="text-blue-500 mr-2" />
                      {selectedAgreements.length} selected
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {isSelectionMode && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={agreements.length > 0 && agreements.every(agreement => selectedAgreements.includes(agreement.id))}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Kode Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Project Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Divisi yang Menginisiasi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Grup yang Terlibat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Project Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {agreements.length === 0 ? (
                      <tr>
                        <td colSpan={isSelectionMode ? 7 : 6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          {loading ? 'Loading agreements from API...' : 
                           error ? 'Failed to load agreements. Please check if backend is running.' :
                           searchTerm ? 'No agreements found matching your search.' : 'No agreements available.'}
                        </td>
                      </tr>
                    ) : (
                      agreements.map((agreement, index) => {
                        const startIndex = (pagination.page - 1) * pagination.limit;
                        
                        return (
                          <tr
                            key={agreement.id}
                            onClick={() => handleRowClick(agreement)}
                            className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                              isSelectionMode && selectedAgreements.includes(agreement.id)
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                                : ''
                            }`}
                          >
                            {isSelectionMode && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                <input
                                  type="checkbox"
                                  checked={selectedAgreements.includes(agreement.id)}
                                  onChange={() => handleMultipleSelect(agreement.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {startIndex + index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                              {agreement.kodeProject}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              <div className="max-w-xs truncate" title={agreement.projectName}>
                                {agreement.projectName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {agreement.divisiInisiasi}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              <div className="max-w-xs truncate" title={agreement.grupTerlibat}>
                                {agreement.grupTerlibat}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                agreement.projectType === 'internal development' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : agreement.projectType === 'procurement'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              }`}>
                                {agreement.projectType === 'internal development' 
                                  ? 'Internal Development' 
                                  : agreement.projectType === 'procurement'
                                  ? 'Procurement'
                                  : 'Non Procurement'
                                }
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} agreements
                      </div>
                      {isSelectionMode && selectedAgreements.length > 0 && (
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          {selectedAgreements.length} selected across all pages
                        </div>
                      )}
                    </div>
                    
                    {/* Pagination Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(pagination.page - 1, 1))}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 text-sm border rounded ${
                                pagination.page === pageNum
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                          <>
                            <span className="px-2 text-gray-500">...</span>
                            <button
                              onClick={() => setCurrentPage(pagination.totalPages)}
                              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              {pagination.totalPages}
                            </button>
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(pagination.page + 1, pagination.totalPages))}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agreement Modal */}
        {showModal && (
          <AgreementModal
            agreement={selectedAgreement}
            onClose={() => {
              setShowModal(false);
              setSelectedAgreement(null);
            }}
            onSave={handleSaveAgreement}
            isEditMode={isEditMode}
          />
        )}

        {/* Agreement Detail Modal */}
        {showDetailModal && selectedAgreement && (
          <AgreementDetailModal
            agreement={selectedAgreement}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedAgreement(null);
            }}
            onEdit={handleEditFromDetail}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={confirmDelete}
            title="Delete Agreements"
            message={`Are you sure you want to delete ${selectedAgreements.length} agreement(s)? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            type="danger"
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
