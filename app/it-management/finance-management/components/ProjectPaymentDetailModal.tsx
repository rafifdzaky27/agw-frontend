"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaCheckCircle, FaClock, FaMoneyBillWave, FaCalendarAlt, FaFileContract, FaBuilding, FaUser, FaUsers, FaPlus, FaSpinner } from "react-icons/fa";
import UpdatePaymentModal from "./UpdatePaymentModal";
import AddEditBillModal from "./AddEditBillModal";
import { financeApi } from "../services/financeApi";
import toast from "react-hot-toast";

interface PaymentTerm {
  id: string;
  termin: string;
  nominal: number;
  description: string;
  status: 'Belum Dibayar' | 'Sudah Dibayar' | 'Checking Umum' | 'Menunggu Posting' | 'Sirkulir IT';
  paymentDate?: string;
  budget?: 'Capex' | 'Opex';
  notes?: string;
  // New fields for Non-Procurement Opex breakdown
  opexCabang?: number;
  opexPusat?: number;
}

interface Project {
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
  terminPembayaran?: PaymentTerm[]; // Make optional since list API doesn't include this
  createdAt: string;
  updatedAt: string;
  // Additional fields from finance API
  totalTerms?: number;
  paidTerms?: number;
  totalValue?: number;
  paidValue?: number;
}

interface ProjectPaymentDetailModalProps {
  project: Project;
  onClose: () => void;
  onUpdate: (project: Project) => void;
}

export default function ProjectPaymentDetailModal({ project, onClose, onUpdate }: ProjectPaymentDetailModalProps) {
  const [selectedTerm, setSelectedTerm] = useState<PaymentTerm | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAddEditBillModal, setShowAddEditBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState<PaymentTerm | null>(null);
  const [currentProject, setCurrentProject] = useState<Project>(project);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch detailed project data when modal opens
  useEffect(() => {
    const fetchProjectDetails = async () => {
      // If terminPembayaran is missing, fetch detail data
      if (!project.terminPembayaran) {
        try {
          setLoading(true);
          setError(null);
          
          const response = await financeApi.getProjectFinanceDetails(project.id);
          
          if (response.success) {
            setCurrentProject(response.data);
          } else {
            throw new Error(response.message || 'Failed to fetch project details');
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project details';
          setError(errorMessage);
          toast.error(errorMessage);
          console.error('Error fetching project details:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentProject(project);
      }
    };

    fetchProjectDetails();
  }, [project]);

  // Safe access to terminPembayaran
  const terminPembayaran = currentProject.terminPembayaran || [];
  
  // Dynamic terminology based on project type
  const isNonProcurement = currentProject.projectType === 'non procurement';
  const termLabel = isNonProcurement ? 'Bill' : 'Termin';
  const termsLabel = isNonProcurement ? 'Billings' : 'Payment Terms';

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sudah Dibayar': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'Checking Umum': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case 'Menunggu Posting': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      case 'Sirkulir IT': return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleUpdatePayment = (term: PaymentTerm) => {
    setSelectedTerm(term);
    setShowUpdateModal(true);
  };

  const handleSavePayment = async (updatedTerm: PaymentTerm) => {
    try {
      // Call API to update payment status
      const response = await financeApi.updatePaymentStatus(updatedTerm.id, {
        status: updatedTerm.status,
        paymentDate: updatedTerm.paymentDate,
        budgetType: updatedTerm.budget,
        notes: updatedTerm.notes,
        opexCabang: updatedTerm.opexCabang,
        opexPusat: updatedTerm.opexPusat,
      });

      if (response.success) {
        // Update local state with API response
        const updatedProject = {
          ...currentProject,
          terminPembayaran: terminPembayaran.map(term =>
            term.id === updatedTerm.id ? response.data : term
          ),
          updatedAt: new Date().toISOString()
        };
        
        // Update local state immediately
        setCurrentProject(updatedProject);
        
        // Update parent component
        onUpdate(updatedProject);
        
        // Close modal
        setShowUpdateModal(false);
        setSelectedTerm(null);
        
        toast.success("Payment status updated successfully");
      } else {
        toast.error(response.message || "Failed to update payment status");
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Failed to update payment status. Please try again.");
    }
  };

  const handleAddBill = () => {
    setEditingBill(null);
    setShowAddEditBillModal(true);
  };

  const handleEditBill = (bill: PaymentTerm) => {
    setEditingBill(bill);
    setShowAddEditBillModal(true);
  };

  const handleSaveBill = (billData: PaymentTerm) => {
    let updatedProject;
    
    if (editingBill) {
      // Editing existing bill
      updatedProject = {
        ...currentProject,
        terminPembayaran: terminPembayaran.map(term =>
          term.id === billData.id ? billData : term
        ),
        updatedAt: new Date().toISOString()
      };
    } else {
      // Adding new bill
      updatedProject = {
        ...currentProject,
        terminPembayaran: [...terminPembayaran, billData],
        updatedAt: new Date().toISOString()
      };
    }
    
    // Update local state immediately
    setCurrentProject(updatedProject);
    
    // Update parent component
    onUpdate(updatedProject);
    
    // Close modal and reset
    setShowAddEditBillModal(false);
    setEditingBill(null);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Calculate totals safely
  const totalValue = terminPembayaran.reduce((sum, term) => sum + term.nominal, 0);
  const paidValue = terminPembayaran
    .filter(term => term.status === 'Sudah Dibayar')
    .reduce((sum, term) => sum + term.nominal, 0);

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 flex flex-col items-center">
          <FaSpinner className="animate-spin text-blue-600 text-3xl mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading project details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 flex flex-col items-center max-w-md">
          <div className="text-red-500 text-3xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Project</h3>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-4">
            <FaMoneyBillWave className="text-blue-600 dark:text-blue-400" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {termLabel} Details
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {currentProject.projectName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Project Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaFileContract className="text-blue-500" />
              Project Information
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Project Name
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {currentProject.projectName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Project Type
                  </label>
                  <p className="text-gray-900 dark:text-white capitalize">
                    {currentProject.projectType}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Involved Group
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <FaUser className="text-green-500 text-sm" />
                    {currentProject.grupTerlibat}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vendor & Contract Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaUser className="text-green-500" />
              Vendor & Contract Information
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentProject.projectType === 'procurement' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Vendor Name
                      </label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {currentProject.namaVendor}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        PKS/PO Number
                      </label>
                      <p className="text-gray-900 dark:text-white font-mono">
                        {currentProject.noPKSPO}
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    PKS/PO Date
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-500 text-sm" />
                    {formatDate(currentProject.tanggalPKSPO)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    End Date
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <FaCalendarAlt className="text-red-500 text-sm" />
                    {formatDate(currentProject.tanggalBerakhir)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment/Billing Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {isNonProcurement ? 'Billing Summary' : 'Payment Summary'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalValue)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Value
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(paidValue)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Paid Value
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(totalValue - paidValue)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Remaining
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {termsLabel} ({terminPembayaran.length})
              </h3>
              
              {isNonProcurement && (
                <button
                  onClick={handleAddBill}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPlus size={14} />
                  Add {termLabel}
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {terminPembayaran.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p>No {termsLabel.toLowerCase()} found</p>
                  {isNonProcurement && (
                    <button
                      onClick={handleAddBill}
                      className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Add your first {termLabel.toLowerCase()}
                    </button>
                  )}
                </div>
              ) : (
                terminPembayaran.map((term, index) => {
                  // Dynamic term name based on project type
                  const termName = isNonProcurement ? `Bill ${index + 1}` : term.termin;
                  
                  return (
                    <div key={term.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {termName}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(term.status)}`}>
                            {term.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(term.nominal)}
                          </span>
                          <button
                            onClick={() => handleUpdatePayment(term)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          >
                            Update
                          </button>
                          {isNonProcurement && (
                            <button
                              onClick={() => handleEditBill(term)}
                              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors ml-2"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {term.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {term.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {term.paymentDate && (
                          <span className="flex items-center gap-1">
                            <FaCalendarAlt />
                            Paid: {formatDate(term.paymentDate)}
                          </span>
                        )}
                        {term.budget && (
                          <span className="flex items-center gap-1">
                            <FaMoneyBillWave />
                            Budget: {term.budget}
                          </span>
                        )}
                      </div>
                      
                      {/* Opex breakdown for Non-Procurement */}
                      {isNonProcurement && term.budget === 'Opex' && (term.opexCabang || term.opexPusat) && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded text-sm">
                          <div className="flex justify-between">
                            {term.opexCabang && (
                              <span>Opex Cabang: {formatCurrency(term.opexCabang)}</span>
                            )}
                            {term.opexPusat && (
                              <span>Opex Pusat: {formatCurrency(term.opexPusat)}</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {term.notes && (
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-600 rounded text-sm">
                          <strong>Notes:</strong> {term.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Update Payment Modal */}
      {showUpdateModal && selectedTerm && (
        <UpdatePaymentModal
          term={selectedTerm}
          projectType={currentProject.projectType}
          onSave={handleSavePayment}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedTerm(null);
          }}
        />
      )}

      {/* Add/Edit Bill Modal */}
      {showAddEditBillModal && (
        <AddEditBillModal
          bill={editingBill}
          projectId={currentProject.id}
          existingBillsCount={terminPembayaran.length}
          onSave={handleSaveBill}
          onClose={() => {
            setShowAddEditBillModal(false);
            setEditingBill(null);
          }}
        />
      )}
    </div>
  );
}
