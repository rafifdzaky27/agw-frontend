"use client";

import { useState, useRef } from "react";
import { FaTimes, FaUpload, FaFile, FaTrash, FaCalendarAlt } from "react-icons/fa";
import toast from "react-hot-toast";

interface AuditFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  file?: File; // For new files being uploaded
}

interface Audit {
  id: string;
  auditName: string;
  category: "Internal" | "Regulatory" | "External";
  auditor: string;
  date: string; // Format: YYYY-MM
  scope: string;
  files: AuditFile[];
  createdAt: string;
  updatedAt: string;
}

interface NewAuditModalProps {
  onClose: () => void;
  onSave: (auditData: Omit<Audit, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export default function NewAuditModal({ onClose, onSave }: NewAuditModalProps) {
  const [formData, setFormData] = useState({
    auditName: "",
    category: "Internal" as "Internal" | "Regulatory" | "External",
    auditor: "",
    date: "",
    scope: "",
  });
  const [files, setFiles] = useState<AuditFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    selectedFiles.forEach(file => {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      const newFile: AuditFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        file: file
      };

      setFiles(prev => [...prev, newFile]);
    });

    // Reset file input
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.auditName.trim()) {
      toast.error("Audit name is required");
      return;
    }
    if (!formData.auditor.trim()) {
      toast.error("Auditor is required");
      return;
    }
    if (!formData.date) {
      toast.error("Date is required");
      return;
    }
    if (!formData.scope.trim()) {
      toast.error("Scope is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Handle file uploads to server here
      // For now, we'll just pass the file metadata
      const auditData = {
        auditName: formData.auditName.trim(),
        category: formData.category,
        auditor: formData.auditor.trim(),
        date: formData.date,
        scope: formData.scope.trim(),
        files: files.map(({ file, ...fileData }) => fileData) // Remove File object for now
      };

      await onSave(auditData);
    } catch (error) {
      toast.error("Failed to create audit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentYearMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add New Audit
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Audit Name */}
          <div>
            <label htmlFor="auditName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Audit Name *
            </label>
            <input
              type="text"
              id="auditName"
              name="auditName"
              value={formData.auditName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter audit name"
              required
            />
          </div>

          {/* Category and Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="Internal">Internal</option>
                <option value="Regulatory">Regulatory</option>
                <option value="External">External</option>
              </select>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date (Month/Year) *
              </label>
              <div className="relative">
                <input
                  type="month"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  max={getCurrentYearMonth()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Auditor */}
          <div>
            <label htmlFor="auditor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Auditor *
            </label>
            <input
              type="text"
              id="auditor"
              name="auditor"
              value={formData.auditor}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter auditor name"
              required
            />
          </div>

          {/* Scope */}
          <div>
            <label htmlFor="scope" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scope *
            </label>
            <textarea
              id="scope"
              name="scope"
              value={formData.scope}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-vertical"
              placeholder="Describe the audit scope..."
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Documents
            </label>
            <div className="space-y-3">
              {/* Upload Button */}
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
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <FaUpload className="text-sm" />
                  Upload Files
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT (Max 10MB each)
                </p>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Files to Upload ({files.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto scrollbar-hide space-y-1">
                    {files.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FaFile className="text-blue-500 text-sm flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
