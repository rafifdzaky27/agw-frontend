"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaCheckCircle, FaClock, FaMoneyBillWave, FaCalendarAlt, FaFileContract, FaBuilding, FaUser, FaUsers, FaPlus } from "react-icons/fa";
import UpdatePaymentModal from "./UpdatePaymentModal";
import AddEditBillModal from "./AddEditBillModal";

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
  terminPembayaran: PaymentTerm[];
  createdAt: string;
  updatedAt: string;
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

  // Update local state when project prop changes
  useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  // Dynamic terminology based on project type
  const isNonProcurement = currentProject.projectType === 'non procurement';
  const termLabel = isNonProcurement ? 'Bill' : 'Termin';
  const termsLabel = isNonProcurement ? 'Billings' : 'Payment Terms';
  const sectionTitle = isNonProcurement ? 'Billing Management' : 'Payment Management';
  const updateButtonText = isNonProcurement ? 'Update Billing' : 'Update Payment';

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
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sudah Dibayar':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'Checking Umum':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Menunggu Posting':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const handleUpdatePayment = (term: PaymentTerm) => {
    if (isNonProcurement) {
      // For Non-Procurement, use the specialized AddEditBillModal
      setEditingBill(term);
      setShowAddEditBillModal(true);
    } else {
      // For Procurement, use the existing UpdatePaymentModal
      setSelectedTerm(term);
      setShowUpdateModal(true);
    }
  };

  const handleSavePayment = (updatedTerm: PaymentTerm) => {
    const updatedProject = {
      ...currentProject,
      terminPembayaran: currentProject.terminPembayaran.map(term =>
        term.id === updatedTerm.id ? updatedTerm : term
      ),
      updatedAt: new Date().toISOString()
    };
    
    // Update local state immediately
    setCurrentProject(updatedProject);
    
    // Update parent component
    onUpdate(updatedProject);
    
    // Close modal and reset
    setShowUpdateModal(false);
    setSelectedTerm(null);
  };

  const handleSaveBill = (billData: PaymentTerm) => {
    let updatedProject;
    
    if (editingBill) {
      // Editing existing bill
      updatedProject = {
        ...currentProject,
        terminPembayaran: currentProject.terminPembayaran.map(term =>
          term.id === billData.id ? billData : term
        ),
        updatedAt: new Date().toISOString()
      };
    } else {
      // Adding new bill
      updatedProject = {
        ...currentProject,
        terminPembayaran: [...currentProject.terminPembayaran, billData],
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

  const totalValue = currentProject.terminPembayaran.reduce((sum, term) => sum + term.nominal, 0);
  const paidValue = currentProject.terminPembayaran
    .filter(term => term.status === 'Sudah Dibayar')
    .reduce((sum, term) => sum + term.nominal, 0);

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
                {sectionTitle}
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
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Project Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaFileContract className="text-blue-500" />
                Project Information
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
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
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {isNonProcurement ? 'Billing Summary' : 'Payment Summary'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(totalValue)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {isNonProcurement ? 'Total Billing Value' : 'Total Contract Value'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(paidValue)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {isNonProcurement ? 'Total Billed' : 'Total Paid'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(totalValue - paidValue)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Remaining</div>
                </div>
              </div>
            </div>

            {/* Payment Terms / Billings */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {termsLabel} ({currentProject.terminPembayaran.length})
                </h3>
                
                {/* Add Bill button for Non-Procurement projects */}
                {isNonProcurement && (
                  <button
                    onClick={() => {
                      setEditingBill(null);
                      setShowAddEditBillModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    <FaPlus size={14} />
                    Add Bill
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {currentProject.terminPembayaran.map((term, index) => {
                  // Dynamic term name based on project type
                  const termName = isNonProcurement ? `Bill ${index + 1}` : term.termin;
                  
                  return (
                    <div
                      key={term.id}
                      className={`border rounded-lg p-6 transition-all duration-200 ${
                        term.status === 'Sudah Dibayar'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {termName}
                          </h4>
                          {term.status === 'Sudah Dibayar' && (
                            <FaCheckCircle className="text-green-500" size={16} />
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(term.status)}`}>
                          {term.status}
                        </span>
                      </div>

                      {/* Conditional content based on project type */}
                      {isNonProcurement ? (
                        // Non-Procurement: Simplified layout (Bill Name, Amount, Status only)
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Bill Name
                            </label>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {term.termin}
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Amount
                            </label>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatCurrency(term.nominal)}
                            </p>
                          </div>

                          {/* Additional fields for paid bills */}
                          {term.status === 'Sudah Dibayar' && term.paymentDate && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Billing Date
                              </label>
                              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                {formatDate(term.paymentDate)}
                              </p>
                            </div>
                          )}

                          {term.status === 'Sudah Dibayar' && term.budget && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Budget Type
                              </label>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                term.budget === 'Capex' 
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                              }`}>
                                {term.budget}
                              </span>
                            </div>
                          )}
                          {term.notes && (
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Notes
                          </label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {term.notes}
                          </p>
                        </div>
                      )}

                        </div>
                      ) : (
                        // Procurement: Full layout with requirements
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Requirements
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {term.description}
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Amount
                            </label>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatCurrency(term.nominal)}
                            </p>
                          </div>

                          {term.status === 'Sudah Dibayar' && term.paymentDate && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Payment Date
                              </label>
                              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                {formatDate(term.paymentDate)}
                              </p>
                            </div>
                          )}

                          {term.status === 'Sudah Dibayar' && term.budget && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Budget Type
                              </label>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                term.budget === 'Capex' 
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                              }`}>
                                {term.budget}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={() => handleUpdatePayment(term)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                        >
                          <FaClock size={14} />
                          {updateButtonText}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>

      {/* Update Payment Modal - Only for Procurement projects */}
      {showUpdateModal && selectedTerm && !isNonProcurement && (
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

      {/* Add/Edit Bill Modal - Only for Non-Procurement projects */}
      {showAddEditBillModal && isNonProcurement && (
        <AddEditBillModal
          bill={editingBill}
          projectId={currentProject.id}
          existingBillsCount={currentProject.terminPembayaran.length}
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
