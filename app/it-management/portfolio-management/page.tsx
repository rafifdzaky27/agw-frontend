"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaCheck, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import AgreementModal from "./components/AgreementModal";
import AgreementDetailModal from "./components/AgreementDetailModal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import toast from "react-hot-toast";

// Define interfaces
interface PaymentTerm {
  id: string;
  termin: string;
  nominal: number;
  description: string;
}

interface Agreement {
  id: string;
  kodeProject: string;
  projectName: string;
  projectType: 'internal development' | 'procurement';
  divisiInisiasi: string;
  grupTerlibat: string;
  keterangan: string;
  namaVendor: string;
  noPKSPO: string;
  tanggalPKSPO: string;
  tanggalBAPP: string;
  tanggalBerakhir: string;
  terminPembayaran: PaymentTerm[];
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

  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Show 20 items per page

  const BACKEND_IP = process.env.NEXT_PUBLIC_BACKEND_IP || "http://localhost:8080";

  // Mock data for development - 200 entries for testing large dataset
  const generateMockAgreements = (): Agreement[] => {
    const divisions = [
      "IT Division", "Finance Division", "Operations Division", "HR Division", 
      "Marketing Division", "Sales Division", "Legal Division", "Procurement Division",
      "Digital Innovation", "Business Development", "Quality Assurance", "Risk Management"
    ];
    
    const groups = [
      "IT, Finance", "IT, Operations", "IT, Security", "Finance, Operations",
      "Marketing, Sales", "HR, Legal", "IT, Marketing, UX", "Operations, QA",
      "Finance, Legal", "IT, Business Development", "Sales, Marketing", "IT, Risk Management"
    ];
    
    const vendors = [
      "SAP Indonesia", "Oracle Corporation", "Microsoft Indonesia", "Amazon Web Services",
      "Google Cloud Platform", "IBM Indonesia", "Accenture", "Deloitte Consulting",
      "TechSoft Solutions", "Digital Innovations Ltd", "CloudTech Services", "DataPro Systems",
      "SecureNet Solutions", "InnovateTech", "SystemsPlus", "TechAdvance Corp",
      "SmartSolutions", "NextGen Technologies", "ProTech Services", "EliteTech Solutions"
    ];
    
    const projectTypes = [
      "ERP Implementation", "Cloud Migration", "Mobile App Development", "Web Portal Development",
      "Data Analytics Platform", "Security Assessment", "Infrastructure Upgrade", "Digital Transformation",
      "System Integration", "Database Migration", "Network Upgrade", "Software Licensing",
      "Cybersecurity Enhancement", "Business Intelligence", "CRM Implementation", "Workflow Automation"
    ];
    
    const agreements: Agreement[] = [];
    
    for (let i = 1; i <= 200; i++) {
      const year = 2024;
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      
      const pksDate = new Date(year, month - 1, day);
      const bappDate = new Date(pksDate.getTime() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000);
      const endDate = new Date(bappDate.getTime() + (Math.random() * 365 + 90) * 24 * 60 * 60 * 1000);
      
      const numPaymentTerms = Math.floor(Math.random() * 4) + 1; // 1-4 payment terms
      const totalAmount = (Math.random() * 2000000000) + 100000000; // 100M - 2.1B IDR
      
      const paymentTerms: PaymentTerm[] = [];
      const termNames = ["Down Payment", "Term 1", "Term 2", "Term 3", "Final Payment"];
      const descriptions = [
        "Initial payment", "After system setup", "Milestone completion", 
        "Testing phase", "Final delivery", "Monthly payment", "Quarterly payment"
      ];
      
      for (let j = 0; j < numPaymentTerms; j++) {
        const percentage = j === 0 ? 0.3 : (1 - 0.3) / (numPaymentTerms - 1);
        paymentTerms.push({
          id: `t${i}_${j}`,
          termin: j < termNames.length ? termNames[j] : `Term ${j + 1}`,
          nominal: Math.floor(totalAmount * percentage),
          description: descriptions[Math.floor(Math.random() * descriptions.length)]
        });
      }
      
      const createdDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      
      const projectTypeValue: 'internal development' | 'procurement' = Math.random() > 0.5 ? 'procurement' : 'internal development';
      
      agreements.push({
        id: i.toString(),
        kodeProject: `PRJ-2024-${i.toString().padStart(3, '0')}`,
        projectName: `${projectTypes[Math.floor(Math.random() * projectTypes.length)]} ${i}`,
        projectType: projectTypeValue,
        divisiInisiasi: divisions[Math.floor(Math.random() * divisions.length)],
        grupTerlibat: groups[Math.floor(Math.random() * groups.length)],
        keterangan: projectTypeValue === 'internal development' 
          ? `Internal development project for ${projectTypes[Math.floor(Math.random() * projectTypes.length)].toLowerCase()}. This project will be handled by our internal development team with focus on innovation and efficiency.`
          : `Procurement project for ${projectTypes[Math.floor(Math.random() * projectTypes.length)].toLowerCase()}. This project involves external vendor collaboration for implementation and delivery.`,
        namaVendor: projectTypeValue === 'procurement' ? vendors[Math.floor(Math.random() * vendors.length)] : '',
        noPKSPO: projectTypeValue === 'procurement' 
          ? (Math.random() > 0.5 ? `PKS/2024/${i.toString().padStart(3, '0')}` : `PO/2024/${i.toString().padStart(3, '0')}`)
          : `INT/2024/${i.toString().padStart(3, '0')}`,
        tanggalPKSPO: pksDate.toISOString().split('T')[0],
        tanggalBAPP: bappDate.toISOString().split('T')[0],
        tanggalBerakhir: endDate.toISOString().split('T')[0],
        terminPembayaran: projectTypeValue === 'procurement' ? paymentTerms : [],
        createdAt: createdDate.toISOString(),
        updatedAt: createdDate.toISOString()
      });
    }
    
    return agreements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const mockAgreements = generateMockAgreements();

  useEffect(() => {
    fetchAgreements();
  }, [token]);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`${BACKEND_IP}/api/agreements`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      // const data = await response.json();
      // setAgreements(data);
      
      // For now, use mock data
      setTimeout(() => {
        setAgreements(mockAgreements);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError("Failed to fetch agreements");
      setLoading(false);
      toast.error("Failed to load agreements");
    }
  };

  // Filter agreements based on search term
  const filteredAgreements = useMemo(() => {
    if (!searchTerm) return agreements;
    
    return agreements.filter(agreement =>
      agreement.kodeProject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.divisiInisiasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.grupTerlibat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.namaVendor.toLowerCase().includes(searchTerm.toLowerCase())
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
      // TODO: Replace with actual API call
      setAgreements(prev => prev.filter(agreement => !selectedAgreements.includes(agreement.id)));
      toast.success(`${selectedAgreements.length} agreement(s) deleted successfully`);
      setSelectedAgreements([]);
      setIsSelectionMode(false);
    } catch (err) {
      toast.error("Failed to delete agreements");
    }
    setShowDeleteConfirm(false);
  };

  const handleSaveAgreement = async (agreementData: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (isEditMode && selectedAgreement) {
        // Update existing agreement
        const updatedAgreement: Agreement = {
          ...agreementData,
          id: selectedAgreement.id,
          createdAt: selectedAgreement.createdAt,
          updatedAt: new Date().toISOString(),
        };
        
        setAgreements(prev => prev.map(agreement => 
          agreement.id === updatedAgreement.id ? updatedAgreement : agreement
        ));
        toast.success(`Project "${agreementData.projectName}" berhasil diperbarui`);
      } else {
        // Create new agreement
        const newAgreement: Agreement = {
          ...agreementData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setAgreements(prev => [newAgreement, ...prev]);
        toast.success(`Project "${agreementData.projectName}" berhasil ditambahkan`);
      }
      
      setShowModal(false);
      setSelectedAgreement(null);
    } catch (err) {
      toast.error("Failed to save agreement");
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
                  placeholder="Search agreements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              {!isSelectionMode ? (
                <>
                  <button
                    onClick={toggleSelectionMode}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
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
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {agreement.projectType === 'internal development' ? 'Internal Development' : 'Procurement'}
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


