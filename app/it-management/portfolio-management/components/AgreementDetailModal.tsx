"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaTimes, FaEdit, FaCalendarAlt, FaUser, FaBuilding, FaFileContract, FaMoneyBillWave, FaFile, FaDownload } from "react-icons/fa";

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

interface AgreementDetailModalProps {
  agreement: Agreement;
  onClose: () => void;
  onEdit: () => void;
}

export default function AgreementDetailModal({ agreement, onClose, onEdit }: AgreementDetailModalProps) {
  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const [detailedAgreement, setDetailedAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch detailed agreement data when modal opens
  useEffect(() => {
    const fetchDetailedData = async () => {
      try {
        setLoading(true);
        
        const { portfolioApi } = await import("../services/portfolioApi");
        const response = await portfolioApi.getProjectById(agreement.id);
        
        if (response.success) {
          setDetailedAgreement(response.data);
        } else {
          setDetailedAgreement(agreement); // Fallback to original data
        }
      } catch (error) {
        console.error("Error fetching detailed data:", error);
        setDetailedAgreement(agreement); // Fallback to original data
      } finally {
        setLoading(false);
      }
    };

    if (agreement?.id) {
      fetchDetailedData();
    }
  }, [agreement.id]);

  // Use detailed agreement data if available, otherwise use original
  const displayAgreement = detailedAgreement || agreement;

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalPayment = () => {
    return displayAgreement?.terminPembayaran?.reduce((total, term) => total + (term.nominal || 0), 0) || 0;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const openFileInNewTab = (file: AgreementFile) => {
    if (file.file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const url = URL.createObjectURL(file.file);
      
      const browserSupported = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'txt', 'html', 'css', 'js'];
      
      if (browserSupported.includes(fileExtension || '')) {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
      }
    } else {
      toast(`Opening ${file.name}... (Mock file - no actual content)`);
    }
  };

  const handleDownloadFile = (file: AgreementFile) => {
    openFileInNewTab(file);
  };

  const getProjectStatus = () => {
    const today = new Date();
    const endDate = new Date(displayAgreement.tanggalBerakhir);
    
    if (endDate < today) {
      return { status: 'Expired', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' };
    } else {
      return { status: 'Active', color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' };
    }
  };

  const projectStatus = getProjectStatus();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading project details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Agreement Details
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {displayAgreement.kodeProject}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${projectStatus.color}`}>
              {projectStatus.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <FaEdit className="text-sm" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Project Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaFileContract className="text-blue-500" />
              Project Information
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Name</label>
                  <p className="text-gray-900 dark:text-white font-medium mt-1">{displayAgreement.projectName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Code</label>
                  <p className="text-gray-900 dark:text-white font-mono mt-1">{displayAgreement.kodeProject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Type</label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      displayAgreement.projectType === 'internal development' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : displayAgreement.projectType === 'procurement'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    }`}>
                      {displayAgreement.projectType === 'internal development' 
                        ? 'Internal Development' 
                        : displayAgreement.projectType === 'procurement'
                        ? 'Procurement'
                        : 'Non Procurement'
                      }
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Initiating Division</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <FaBuilding className="text-blue-500 text-sm" />
                    {displayAgreement.divisiInisiasi}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Involved Groups</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <FaUser className="text-green-500 text-sm" />
                    {displayAgreement.grupTerlibat}
                  </p>
                </div>
                {displayAgreement.keterangan && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                    <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">{displayAgreement.keterangan}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vendor & Contract Information - For Procurement and Non Procurement */}
          {(displayAgreement.projectType === 'procurement' || displayAgreement.projectType === 'non procurement') && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaUser className="text-green-500" />
                Vendor & Contract Information
              </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor Name</label>
                  <p className="text-gray-900 dark:text-white font-medium mt-1">{displayAgreement.namaVendor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">PKS/PO Number</label>
                  <p className="text-gray-900 dark:text-white font-mono mt-1">{displayAgreement.noPKSPO}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">PKS/PO Date</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-500 text-sm" />
                    {formatDate(displayAgreement.tanggalPKSPO)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Handover Date (BAPP)</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <FaCalendarAlt className="text-green-500 text-sm" />
                    {formatDate(displayAgreement.tanggalBAPP)}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <FaCalendarAlt className="text-red-500 text-sm" />
                    {formatDate(displayAgreement.tanggalBerakhir)}
                  </p>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Documents Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaFile className="text-purple-500" />
              Documents
            </h3>
            {(!displayAgreement.files || displayAgreement.files.length === 0) ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p>No documents uploaded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(displayAgreement.files || []).map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => openFileInNewTab(file)}>
                      <FaFile className="text-blue-500 text-lg flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 truncate">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)} • Uploaded {formatDateTime(file.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      title="Open/Download file"
                    >
                      <FaDownload className="text-sm" />
                      Open
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Terms - For Procurement and Non Procurement */}
          {(displayAgreement.projectType === 'procurement' || displayAgreement.projectType === 'non procurement') && (
            <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaMoneyBillWave className="text-yellow-500" />
              Payment Terms
            </h3>
            {(!displayAgreement.terminPembayaran || displayAgreement.terminPembayaran.length === 0) ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p>No payment terms defined</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayAgreement.terminPembayaran.map((term, index) => (
                  <div key={term.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm font-medium">
                            {index + 1}
                          </span>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {term.termin}
                          </h4>
                        </div>
                        {term.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {term.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(term.nominal)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Total Payment */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-blue-900 dark:text-blue-100">
                      Total Contract Value:
                    </span>
                    <span className="text-xl font-bold text-blue-900 dark:text-blue-100">
                      {formatCurrency(getTotalPayment())}
                    </span>
                  </div>
                </div>
              </div>
            )}
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Record Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-500 dark:text-gray-400">Created At</label>
                <p className="text-gray-900 dark:text-white">{formatDateTime(displayAgreement.createdAt)}</p>
              </div>
              <div>
                <label className="text-gray-500 dark:text-gray-400">Last Updated</label>
                <p className="text-gray-900 dark:text-white">{formatDateTime(displayAgreement.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-md transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2"
          >
            <FaEdit className="text-sm" />
            Edit Project
          </button>
        </div>
      </div>
    </div>
  );
}
