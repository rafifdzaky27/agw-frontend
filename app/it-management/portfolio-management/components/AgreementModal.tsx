"use client";

import { useState, useEffect, useRef } from "react";
import { FaTimes, FaPlus, FaTrash, FaCalendarAlt, FaSave, FaUpload, FaFile, FaDownload } from "react-icons/fa";
import toast from "react-hot-toast";

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

interface AgreementModalProps {
  agreement: Agreement | null;
  onClose: () => void;
  onSave: (agreementData: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt'>, files: File[]) => void;
  isEditMode: boolean;
}

export default function AgreementModal({ agreement, onClose, onSave, isEditMode }: AgreementModalProps) {
  const [formData, setFormData] = useState({
    kodeProject: "",
    projectName: "",
    projectType: "internal development" as 'internal development' | 'procurement' | 'non procurement',
    divisiInisiasi: "",
    grupTerlibat: "",
    keterangan: "",
    namaVendor: "",
    noPKSPO: "",
    tanggalPKSPO: "",
    tanggalBAPP: "",
    tanggalBerakhir: "",
  });

  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [files, setFiles] = useState<AgreementFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<AgreementFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (isEditMode && agreement) {
      setFormData({
        kodeProject: agreement.kodeProject,
        projectName: agreement.projectName,
        projectType: agreement.projectType,
        divisiInisiasi: agreement.divisiInisiasi,
        grupTerlibat: agreement.grupTerlibat,
        keterangan: agreement.keterangan,
        namaVendor: agreement.namaVendor,
        noPKSPO: agreement.noPKSPO,
        tanggalPKSPO: agreement.tanggalPKSPO,
        tanggalBAPP: agreement.tanggalBAPP,
        tanggalBerakhir: agreement.tanggalBerakhir,
      });
      setPaymentTerms(agreement.terminPembayaran);
      setFiles(Array.isArray(agreement.files) ? agreement.files : []);
    } else {
      // Reset form for new agreement
      setFormData({
        kodeProject: "",
        projectName: "",
        projectType: "internal development",
        divisiInisiasi: "",
        grupTerlibat: "",
        keterangan: "",
        namaVendor: "",
        noPKSPO: "",
        tanggalPKSPO: "",
        tanggalBAPP: "",
        tanggalBerakhir: "",
      });
      setPaymentTerms([]);
      setFiles([]);
    }
  }, [agreement, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generatePaymentTermId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const addPaymentTerm = () => {
    const newTerm: PaymentTerm = {
      id: generatePaymentTermId(),
      termin: "",
      nominal: 0,
      description: ""
    };
    setPaymentTerms(prev => [...prev, newTerm]);
  };

  const removePaymentTerm = (id: string) => {
    setPaymentTerms(prev => prev.filter(term => term.id !== id));
  };

  const updatePaymentTerm = (id: string, field: keyof PaymentTerm, value: string | number) => {
    setPaymentTerms(prev => prev.map(term => 
      term.id === id ? { ...term, [field]: value } : term
    ));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    selectedFiles.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      const newFile: AgreementFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        file: file
      };

      setFiles(prev => [...prev, newFile]);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const parseCurrency = (value: string): number => {
    // Remove currency formatting and convert to number
    return parseInt(value.replace(/[^\d]/g, '')) || 0;
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.kodeProject.trim()) errors.push("Kode Project is required");
    if (!formData.projectName.trim()) errors.push("Project Name is required");
    if (!formData.divisiInisiasi.trim()) errors.push("Divisi yang Menginisiasi is required");
    if (!formData.grupTerlibat.trim()) errors.push("Grup yang Terlibat is required");
    
    // Validate vendor and payment terms for procurement and non procurement projects
    if (formData.projectType === 'procurement' || formData.projectType === 'non procurement') {
      if (!formData.namaVendor.trim()) errors.push(`Nama Vendor is required for ${formData.projectType} projects`);
      if (paymentTerms.length === 0) errors.push(`At least one payment term is required for ${formData.projectType} projects`);
    }
    
    if (!formData.noPKSPO.trim()) errors.push("No. PKS/PO is required");
    if (!formData.tanggalPKSPO) errors.push("Tanggal PKS/PO is required");
    if (!formData.tanggalBAPP) errors.push("Tanggal BAPP is required");
    if (!formData.tanggalBerakhir) errors.push("Tanggal Berakhir is required");

    // Validate date order
    if (formData.tanggalPKSPO && formData.tanggalBAPP) {
      if (new Date(formData.tanggalPKSPO) > new Date(formData.tanggalBAPP)) {
        errors.push("Tanggal BAPP must be after Tanggal PKS/PO");
      }
    }

    if (formData.tanggalBAPP && formData.tanggalBerakhir) {
      if (new Date(formData.tanggalBAPP) > new Date(formData.tanggalBerakhir)) {
        errors.push("Tanggal Berakhir must be after Tanggal BAPP");
      }
    }

    // Validate payment terms
    paymentTerms.forEach((term, index) => {
      if (!term.termin.trim()) errors.push(`Payment term ${index + 1}: Termin is required`);
      if (term.nominal <= 0) errors.push(`Payment term ${index + 1}: Nominal must be greater than 0`);
    });

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    setIsSubmitting(true);

    try {
      const agreementData = {
        ...formData,
        terminPembayaran: paymentTerms,
        files: files.filter(f => !f.file).map(({ file, ...fileData }) => fileData) || [] // Only existing files, ensure array
      };
      
      const newFiles = files.filter(f => f.file).map(f => f.file!); // Only new files

      await onSave(agreementData, newFiles);
    } catch (error) {
      toast.error("Failed to save agreement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalPayment = () => {
    return paymentTerms.reduce((total, term) => total + term.nominal, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditMode ? 'Edit Project' : 'Add New Project'}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                title={isEditMode ? 'Update project' : 'Save project'}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <FaSave className="w-4 h-4" />
                )}
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Project Details Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Project Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="kodeProject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kode Project *
                </label>
                <input
                  type="text"
                  id="kodeProject"
                  name="kodeProject"
                  value={formData.kodeProject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., PRJ-2024-001"
                  required
                />
              </div>

              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="projectName"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div>
                <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Type *
                </label>
                <select
                  id="projectType"
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="internal development">Internal Development</option>
                  <option value="procurement">Procurement</option>
                  <option value="non procurement">Non Procurement</option>
                </select>
              </div>

              <div>
                <label htmlFor="divisiInisiasi" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Divisi yang Menginisiasi *
                </label>
                <input
                  type="text"
                  id="divisiInisiasi"
                  name="divisiInisiasi"
                  value={formData.divisiInisiasi}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter initiating division"
                  required
                />
              </div>

              <div>
                <label htmlFor="grupTerlibat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grup yang Terlibat *
                </label>
                <input
                  type="text"
                  id="grupTerlibat"
                  name="grupTerlibat"
                  value={formData.grupTerlibat}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter involved groups"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="keterangan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Keterangan
                </label>
                <textarea
                  id="keterangan"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-vertical"
                  placeholder="Enter project description..."
                />
              </div>
            </div>
          </div>

          {/* Vendor & Document Details Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              {formData.projectType === 'internal development' ? 'Document Details' : 'Vendor & Document Details'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(formData.projectType === 'procurement' || formData.projectType === 'non procurement') && (
                <div>
                  <label htmlFor="namaVendor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Vendor *
                  </label>
                  <input
                    type="text"
                    id="namaVendor"
                    name="namaVendor"
                    value={formData.namaVendor}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter vendor name"
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="noPKSPO" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  No. PKS/PO *
                </label>
                <input
                  type="text"
                  id="noPKSPO"
                  name="noPKSPO"
                  value={formData.noPKSPO}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., PKS/2024/001"
                  required
                />
              </div>

              <div>
                <label htmlFor="tanggalPKSPO" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal PKS/PO *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="tanggalPKSPO"
                    name="tanggalPKSPO"
                    value={formData.tanggalPKSPO}
                    onChange={handleInputChange}

                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tanggalBAPP" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal BAPP (Handover Date) *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="tanggalBAPP"
                    name="tanggalBAPP"
                    value={formData.tanggalBAPP}
                    onChange={handleInputChange}
                    min={formData.tanggalPKSPO || ''}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="tanggalBerakhir" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal Berakhir (End Date) *
                </label>
                <div className="relative md:w-1/2">
                  <input
                    type="date"
                    id="tanggalBerakhir"
                    name="tanggalBerakhir"
                    value={formData.tanggalBerakhir}
                    onChange={handleInputChange}
                    min={formData.tanggalBAPP || ''}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Documents
              </h3>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={files.length >= 10}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm"
                >
                  <FaUpload className="text-xs" />
                  Upload Files {files.length > 0 && `(${files.length}/10)`}
                </button>
              </div>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p>No documents uploaded yet.</p>
                <p className="text-sm mt-1">Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT (Max 10MB each)</p>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Files to Upload ({files.length})
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FaFile className="text-blue-500 text-sm flex-shrink-0" />
                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => {
                          if (file.file) {
                            const url = URL.createObjectURL(file.file);
                            window.open(url, '_blank');
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                          }
                        }}>
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (file.file) {
                              const url = URL.createObjectURL(file.file);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = file.name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                            }
                          }}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Download file"
                        >
                          <FaDownload className="text-sm" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove file"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Terms Section - For Procurement and Non Procurement */}
          {(formData.projectType === 'procurement' || formData.projectType === 'non procurement') && (
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Termin Pembayaran (Payment Terms)
                </h3>
                <button
                  type="button"
                  onClick={addPaymentTerm}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md transition-colors text-sm"
                >
                  <FaPlus className="text-xs" />
                  Add Term
                </button>
              </div>

              {paymentTerms.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p>No payment terms added yet.</p>
                  <p className="text-sm mt-1">Click "Add Term" to add payment terms.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentTerms.map((term, index) => (
                    <div key={term.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Payment Term {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removePaymentTerm(term.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove payment term"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Termin *
                          </label>
                          <input
                            type="text"
                            value={term.termin}
                            onChange={(e) => updatePaymentTerm(term.id, 'termin', e.target.value)}
                            maxLength={100}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white text-sm"
                            placeholder="e.g., Down Payment, Term 1"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nominal (IDR) *
                          </label>
                          <input
                            type="number"
                            value={term.nominal}
                            onChange={(e) => updatePaymentTerm(term.id, 'nominal', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white text-sm"
                            placeholder="0"
                            min="1"
                            step="1000"
                            required
                          />
                          {term.nominal > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatCurrency(term.nominal)}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={term.description}
                            onChange={(e) => updatePaymentTerm(term.id, 'description', e.target.value)}
                            maxLength={255}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white text-sm"
                            placeholder="Payment description"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Total Payment */}
                  {paymentTerms.length > 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                          Total Payment:
                        </span>
                        <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                          {formatCurrency(getTotalPayment())}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


        </form>
      </div>
      

    </div>
  );
}
