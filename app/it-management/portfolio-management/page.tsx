"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaCheck, FaTimes } from "react-icons/fa";
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

  const BACKEND_IP = process.env.NEXT_PUBLIC_BACKEND_IP || "http://localhost:8080";

  // Mock data for development
  const mockAgreements: Agreement[] = [
    {
      id: "1",
      kodeProject: "PRJ-2024-001",
      projectName: "Enterprise Resource Planning Implementation",
      divisiInisiasi: "IT Division",
      grupTerlibat: "IT, Finance, Operations",
      keterangan: "Implementation of new ERP system for company-wide operations",
      namaVendor: "SAP Indonesia",
      noPKSPO: "PKS/2024/001",
      tanggalPKSPO: "2024-01-15",
      tanggalBAPP: "2024-02-01",
      tanggalBerakhir: "2024-12-31",
      terminPembayaran: [
        { id: "t1", termin: "Down Payment", nominal: 500000000, description: "Initial payment" },
        { id: "t2", termin: "Term 1", nominal: 300000000, description: "After system setup" },
        { id: "t3", termin: "Term 2", nominal: 200000000, description: "Final payment" }
      ],
      createdAt: "2024-01-10T10:00:00Z",
      updatedAt: "2024-01-10T10:00:00Z"
    },
    {
      id: "2",
      kodeProject: "PRJ-2024-002",
      projectName: "Cloud Infrastructure Migration",
      divisiInisiasi: "IT Division",
      grupTerlibat: "IT, Security",
      keterangan: "Migration of on-premise infrastructure to cloud services",
      namaVendor: "Amazon Web Services",
      noPKSPO: "PO/2024/002",
      tanggalPKSPO: "2024-02-01",
      tanggalBAPP: "2024-02-15",
      tanggalBerakhir: "2024-08-31",
      terminPembayaran: [
        { id: "t4", termin: "Monthly Payment", nominal: 50000000, description: "Monthly cloud services" }
      ],
      createdAt: "2024-01-25T14:30:00Z",
      updatedAt: "2024-01-25T14:30:00Z"
    },
    {
      id: "3",
      kodeProject: "PRJ-2024-003",
      projectName: "Mobile Application Development",
      divisiInisiasi: "Digital Innovation",
      grupTerlibat: "IT, Marketing, UX",
      keterangan: "Development of customer-facing mobile application",
      namaVendor: "TechSoft Solutions",
      noPKSPO: "PKS/2024/003",
      tanggalPKSPO: "2024-03-01",
      tanggalBAPP: "2024-03-15",
      tanggalBerakhir: "2024-09-30",
      terminPembayaran: [
        { id: "t5", termin: "Down Payment", nominal: 150000000, description: "Project initiation" },
        { id: "t6", termin: "Milestone 1", nominal: 100000000, description: "UI/UX completion" },
        { id: "t7", termin: "Milestone 2", nominal: 100000000, description: "Backend development" },
        { id: "t8", termin: "Final Payment", nominal: 50000000, description: "Testing and deployment" }
      ],
      createdAt: "2024-02-20T09:15:00Z",
      updatedAt: "2024-02-20T09:15:00Z"
    }
  ];

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
        toast.success("Agreement updated successfully");
      } else {
        // Create new agreement
        const newAgreement: Agreement = {
          ...agreementData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setAgreements(prev => [...prev, newAgreement]);
        toast.success("Agreement created successfully");
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
    if (selectedAgreements.length === filteredAgreements.length) {
      setSelectedAgreements([]);
    } else {
      setSelectedAgreements(filteredAgreements.map(agreement => agreement.id));
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

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Action Buttons */}
                <div className="flex gap-3">
                  {!isSelectionMode ? (
                    <>
                      <button
                        onClick={handleNewAgreement}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <FaPlus className="text-sm" />
                        New Agreement
                      </button>
                      
                      <button
                        onClick={toggleSelectionMode}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                        title="Select multiple agreements for bulk operations"
                      >
                        <FaCheck className="text-sm" />
                        Select
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={toggleSelectionMode}
                        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <FaTimes className="text-sm" />
                        Cancel Selection
                      </button>
                      
                      <button
                        onClick={handleDeleteAgreement}
                        disabled={selectedAgreements.length === 0}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <FaTrash className="text-sm" />
                        Delete {selectedAgreements.length > 0 && `(${selectedAgreements.length})`}
                      </button>
                      
                      {selectedAgreements.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <FaCheck className="text-blue-500 mr-2" />
                          {selectedAgreements.length} of {filteredAgreements.length} selected
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search agreements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
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
                            checked={selectedAgreements.length === filteredAgreements.length && filteredAgreements.length > 0}
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
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAgreements.length === 0 ? (
                      <tr>
                        <td colSpan={isSelectionMode ? 6 : 5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          {searchTerm ? "No agreements found matching your search." : "No agreements available."}
                        </td>
                      </tr>
                    ) : (
                      filteredAgreements.map((agreement, index) => (
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
                            {index + 1}
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Table Footer */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {filteredAgreements.length} of {agreements.length} agreements
                  </div>
                  {isSelectionMode && selectedAgreements.length > 0 && (
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {selectedAgreements.length} selected
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
