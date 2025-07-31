"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { CreatePolicyRequest } from "@/utils/policyApi";
import { FaTimes, FaSave, FaUpload, FaFile, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

interface AddPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (policyData: CreatePolicyRequest, file?: File) => Promise<void>;
  onSave?: (policyData: CreatePolicyRequest, file?: File) => Promise<void>;
}

export default function AddPolicyModal({ isOpen, onClose, onSubmit, onSave }: AddPolicyModalProps) {
  const { user } = useAuth();
  const [formState, setFormState] = useState({
    no_dokumen: "",
    nama_dokumen: "",
    tanggal_dokumen: "",
    kategori: "Kebijakan" as const,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveClick = () => {
    if (!formState.no_dokumen || !formState.nama_dokumen || !formState.tanggal_dokumen) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsConfirmationOpen(true);
  };

  const confirmSave = () => {
    const policyData: CreatePolicyRequest = {
      ...formState,
      created_by: user?.name || user?.username || 'Unknown User'
    };
    const handler = onSave || onSubmit;
    if (handler) {
      handler(policyData, selectedFile || undefined);
    }
    setIsConfirmationOpen(false);
    // Reset form
    setFormState({
      no_dokumen: "",
      nama_dokumen: "",
      tanggal_dokumen: "",
      kategori: "Kebijakan",
    });
    setSelectedFile(null);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Policy</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Document Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="no_dokumen"
                    value={formState.no_dokumen}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Enter document number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="kategori"
                    value={formState.kategori}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  >
                    <option value="Kebijakan">Kebijakan</option>
                    <option value="SOP">SOP</option>
                    <option value="Pedoman">Pedoman</option>
                    <option value="Petunjuk Teknis">Petunjuk Teknis</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Document Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="nama_dokumen"
                    value={formState.nama_dokumen}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Enter document name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Document Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="tanggal_dokumen"
                    type="date"
                    value={formState.tanggal_dokumen}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* File Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Documents</h3>
              
              {/* Upload New File */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <FaUpload className="text-sm" />
                  Upload File (PDF)
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Supported format: PDF (Max 10MB)
                </p>
              </div>

              {/* File Preview */}
              {selectedFile && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected File:</h4>
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FaFile className="text-green-500 text-sm flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(selectedFile.size)} • New file
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove selected file"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <FaSave className="w-4 h-4" />
            Save Policy
          </button>
        </div>
        
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          onConfirm={confirmSave}
          onCancel={() => setIsConfirmationOpen(false)}
          message="Are you sure you want to save this policy?"
        />
      </div>
    </div>
  );
}
