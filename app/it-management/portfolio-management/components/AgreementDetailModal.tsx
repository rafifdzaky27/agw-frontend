"use client";

import { FaTimes, FaEdit, FaCalendarAlt, FaUser, FaBuilding, FaFileContract, FaMoneyBillWave } from "react-icons/fa";

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

interface AgreementDetailModalProps {
  agreement: Agreement;
  onClose: () => void;
  onEdit: () => void;
}

export default function AgreementDetailModal({ agreement, onClose, onEdit }: AgreementDetailModalProps) {
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
    return agreement.terminPembayaran.reduce((total, term) => total + term.nominal, 0);
  };

  const getProjectStatus = () => {
    const today = new Date();
    const endDate = new Date(agreement.tanggalBerakhir);
    
    if (endDate < today) {
      return { status: 'Expired', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' };
    } else {
      return { status: 'Active', color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' };
    }
  };

  const projectStatus = getProjectStatus();

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
                {agreement.kodeProject}
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
                  <p className="text-gray-900 dark:text-white font-medium mt-1">{agreement.projectName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Code</label>
                  <p className="text-gray-900 dark:text-white font-mono mt-1">{agreement.kodeProject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Type</label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      agreement.projectType === 'internal development' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {agreement.projectType === 'internal development' ? 'Internal Development' : 'Procurement'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Initiating Division</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <FaBuilding className="text-blue-500 text-sm" />
                    {agreement.divisiInisiasi}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Involved Groups</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <FaUser className="text-green-500 text-sm" />
                    {agreement.grupTerlibat}
                  </p>
                </div>
                {agreement.keterangan && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                    <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">{agreement.keterangan}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vendor & Contract Information - Only for Procurement */}
          {agreement.projectType === 'procurement' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaUser className="text-green-500" />
                Vendor & Contract Information
              </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor Name</label>
                  <p className="text-gray-900 dark:text-white font-medium mt-1">{agreement.namaVendor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">PKS/PO Number</label>
                  <p className="text-gray-900 dark:text-white font-mono mt-1">{agreement.noPKSPO}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">PKS/PO Date</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-500 text-sm" />
                    {formatDate(agreement.tanggalPKSPO)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Handover Date (BAPP)</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <FaCalendarAlt className="text-green-500 text-sm" />
                    {formatDate(agreement.tanggalBAPP)}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <FaCalendarAlt className="text-red-500 text-sm" />
                    {formatDate(agreement.tanggalBerakhir)}
                  </p>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Payment Terms - Only for Procurement */}
          {agreement.projectType === 'procurement' && (
            <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaMoneyBillWave className="text-yellow-500" />
              Payment Terms
            </h3>
            {agreement.terminPembayaran.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p>No payment terms defined</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agreement.terminPembayaran.map((term, index) => (
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
                <p className="text-gray-900 dark:text-white">{formatDateTime(agreement.createdAt)}</p>
              </div>
              <div>
                <label className="text-gray-500 dark:text-gray-400">Last Updated</label>
                <p className="text-gray-900 dark:text-white">{formatDateTime(agreement.updatedAt)}</p>
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
