"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaCheck, FaTimes, FaChevronLeft, FaChevronRight, FaFileExcel } from "react-icons/fa";
import * as XLSX from 'xlsx';
import AgreementModal from "./components/AgreementModal";
import AgreementDetailModal from "./components/AgreementDetailModal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import toast from "react-hot-toast";
import * as portfolioApi from "@/utils/portfolioApi";

// Define interfaces
interface PaymentTerm {
  id: string;
  termin: string;
  nominal: number;
  description: string;
}

interface AgreementFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  file?: File;
}

interface Agreement {
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
  terminPembayaran: PaymentTerm[];
  files: AgreementFile[];
  createdAt: string;
  updatedAt: string;
}

export default function PortfolioManagementPage() {
  const { user, token } = useAuth();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [selectedAgreements, setSelectedAgreements] = useState<string[]>([]); // For multiple selection
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [agreementToDelete, setAgreementToDelete] = useState<Agreement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Show 20 items per page





  useEffect(() => {
    if (token) {
      fetchAgreements();
    }
  }, [token]);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const data = await portfolioApi.getAllProjects(token!);
      setAgreements(data);
    } catch (err) {
      setError("Failed to fetch agreements");
      toast.error("Failed to load agreements");
    } finally {
      setLoading(false);
    }
  };

  // Filter agreements based on search term
  const filteredAgreements = useMemo(() => {
    if (!searchTerm) return agreements;
    
    return agreements.filter(agreement =>
      agreement.kodeProject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [agreements, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAgreements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAgreements = filteredAgreements.slice(startIndex, endIndex);

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
      await portfolioApi.deleteMultipleProjects(selectedAgreements, token!);
      setAgreements(prev => prev.filter(agreement => !selectedAgreements.includes(agreement.id)));
      toast.success(`${selectedAgreements.length} agreement(s) deleted successfully`);
      setSelectedAgreements([]);
      setIsSelectionMode(false);
    } catch (err) {
      toast.error("Failed to delete agreements");
    }
    setShowDeleteConfirm(false);
  };

  const handleSaveAgreement = async (agreementData: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt'>, files: File[]) => {
    try {
      if (isEditMode && selectedAgreement) {
        // Update existing agreement
        const updatedAgreement = await portfolioApi.updateProject(selectedAgreement.id, agreementData, files, token!);
        
        setAgreements(prev => prev.map(agreement => 
          agreement.id === updatedAgreement.id ? updatedAgreement : agreement
        ));
        toast.success(`Project "${agreementData.projectName}" berhasil diperbarui`);
      } else {
        // Create new agreement
        const newAgreement = await portfolioApi.createProject(agreementData, files, token!);
        
        setAgreements(prev => [newAgreement, ...prev]);
        toast.success(`Project "${agreementData.projectName}" berhasil ditambahkan`);
      }
      
      setShowModal(false);
      setSelectedAgreement(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save agreement");
    }
  };

  const handleRowSelect = (agreement: Agreement) => {
    setSelectedAgreement(selectedAgreement?.id === agreement.id ? null : agreement);
  };

  const handleRowClick = (agreement: Agreement) => {
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
    const currentPageIds = currentAgreements.map(agreement => agreement.id);
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
      setIsExporting(true);
      
      // Get selected agreements data
      const selectedAgreementsData = agreements.filter(agreement => selectedAgreements.includes(agreement.id));
      
      // Create Excel data
      const excelData: any[] = [];
      
      selectedAgreementsData.forEach((agreement, index) => {
        // Calculate total payment amount
        const totalPayment = agreement.terminPembayaran.reduce((sum, term) => sum + term.nominal, 0);
        
        // Format payment terms as string
        const paymentTermsText = agreement.terminPembayaran
          .map(term => `${term.termin}: ${formatCurrency(term.nominal)} (${term.description})`)
          .join('; ');
        
        // Count files
        const fileCount = agreement.files.length;
        const fileNames = agreement.files.map(file => file.name).join('; ');
        
        excelData.push({
          "No": index + 1,
          "Kode Project": agreement.kodeProject,
          "Project Name": agreement.projectName,
          "Project Type": agreement.projectType,
          "Divisi Inisiasi": agreement.divisiInisiasi,
          "Grup Terlibat": agreement.grupTerlibat,
          "Keterangan": agreement.keterangan,
          "Nama Vendor": agreement.namaVendor,
          "No PKS/PO": agreement.noPKSPO,
          "Tanggal PKS/PO": new Date(agreement.tanggalPKSPO).toLocaleDateString('id-ID'),
          "Tanggal BAPP": new Date(agreement.tanggalBAPP).toLocaleDateString('id-ID'),
          "Tanggal Berakhir": new Date(agreement.tanggalBerakhir).toLocaleDateString('id-ID'),
          "Total Payment": formatCurrency(totalPayment),
          "Payment Terms": paymentTermsText,
          "File Count": fileCount,
          "File Names": fileNames,
          "Created At": new Date(agreement.createdAt).toLocaleDateString('id-ID'),
          "Updated At": new Date(agreement.updatedAt).toLocaleDateString('id-ID')
        });
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 5 },   // No
        { wch: 15 },  // Kode Project
        { wch: 30 },  // Project Name
        { wch: 20 },  // Project Type
        { wch: 20 },  // Divisi Inisiasi
        { wch: 20 },  // Grup Terlibat
        { wch: 40 },  // Keterangan
        { wch: 25 },  // Nama Vendor
        { wch: 20 },  // No PKS/PO
        { wch: 15 },  // Tanggal PKS/PO
        { wch: 15 },  // Tanggal BAPP
        { wch: 15 },  // Tanggal Berakhir
        { wch: 20 },  // Total Payment
        { wch: 50 },  // Payment Terms
        { wch: 10 },  // File Count
        { wch: 50 },  // File Names
        { wch: 12 },  // Created At
        { wch: 12 }   // Updated At
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Portfolio Data");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `Selected_Portfolio_${selectedAgreements.length}_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      // Show success message
      toast.success(`Successfully exported ${selectedAgreements.length} agreements to Excel`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export agreements. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };
  const handleEditFromDetail = () => {
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

  if (loading) {
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
                    {agreements.length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total Agreements
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300">{error}</p>
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
                    disabled={selectedAgreements.length === 0 || isExporting}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <FaFileExcel className="text-sm" />
                    {isExporting ? 'Exporting...' : `Export ${selectedAgreements.length > 0 ? `(${selectedAgreements.length})` : ''}`}
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
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {isSelectionMode && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={currentAgreements.length > 0 && currentAgreements.every(agreement => selectedAgreements.includes(agreement.id))}
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
                    {currentAgreements.length === 0 ? (
                      <tr>
                        <td colSpan={isSelectionMode ? 7 : 6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          {searchTerm ? "No agreements found matching your search." : "No agreements available."}
                        </td>
                      </tr>
                    ) : (
                      currentAgreements.map((agreement, index) => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Table Footer with Pagination */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredAgreements.length)} of {filteredAgreements.length} agreements
                      {agreements.length !== filteredAgreements.length && (
                        <span className="text-gray-500"> (filtered from {agreements.length} total)</span>
                      )}
                    </div>
                    {isSelectionMode && selectedAgreements.length > 0 && (
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {selectedAgreements.length} selected across all pages
                      </div>
                    )}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {/* Show page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 text-sm border rounded ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <span className="px-2 text-gray-500">...</span>
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showModal && (
          <AgreementModal
            agreement={isEditMode ? selectedAgreement : null}
            onClose={() => {
              setShowModal(false);
              setSelectedAgreement(null);
            }}
            onSave={handleSaveAgreement}
            isEditMode={isEditMode}
          />
        )}

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

        {showDeleteConfirm && (
          <ConfirmationModal
            isOpen={showDeleteConfirm}
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={confirmDelete}
            message={`Are you sure you want to delete ${selectedAgreements.length} agreement(s)? This action cannot be undone.`}
          />
        )}


      </div>
    </ProtectedRoute>
  );
}


