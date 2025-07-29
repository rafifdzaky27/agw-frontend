"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { CreatePolicyRequest } from "@/utils/policyApi";
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
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 lg:w-2/3 max-h-[90vh] overflow-y-auto text-gray-900 dark:text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add New Policy</h3>
          <button
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">No Dokumen *</div>
            <input
              name="no_dokumen"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="Enter document number"
              value={formState.no_dokumen}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Kategori *</div>
            <select
              name="kategori"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              value={formState.kategori}
              onChange={handleChange}
              required
            >
              <option value="Kebijakan">Kebijakan</option>
              <option value="SOP">SOP</option>
              <option value="Pedoman">Pedoman</option>
              <option value="Petunjuk Teknis">Petunjuk Teknis</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Dokumen *</div>
            <input
              name="nama_dokumen"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              placeholder="Enter document name"
              value={formState.nama_dokumen}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Tanggal Dokumen *</div>
            <input
              type="date"
              name="tanggal_dokumen"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
              value={formState.tanggal_dokumen}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="mb-6">
          <div className="font-bold text-gray-700 dark:text-gray-300 mb-2">Upload File (PDF)</div>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Supported format: PDF (Max 10MB)
            </p>
          </div>
          
          {selectedFile && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Selected File:</h4>
              <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900 p-1 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={handleSaveClick}
          >
            Save Policy
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          
          <ConfirmationModal
            isOpen={isConfirmationOpen}
            onConfirm={confirmSave}
            onCancel={() => setIsConfirmationOpen(false)}
            message="Are you sure you want to save this policy?"
          />
        </div>
      </div>
    </div>
  );
}
