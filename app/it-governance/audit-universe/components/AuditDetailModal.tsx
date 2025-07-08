"use client";

import { useState, useRef, useEffect } from "react";
import { FaTimes, FaUpload, FaFile, FaTrash, FaCalendarAlt, FaDownload, FaEdit, FaSave } from "react-icons/fa";
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

interface AuditDetailModalProps {
  audit: Audit;
  onClose: () => void;
  onSave: (auditData: Audit) => void;
}

export default function AuditDetailModal({ audit, onClose, onSave }: AuditDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    auditName: audit.auditName,
    category: audit.category,
    auditor: audit.auditor,
    date: audit.date,
    scope: audit.scope,
  });
  const [files, setFiles] = useState<AuditFile[]>(audit.files);
  const [newFiles, setNewFiles] = useState<AuditFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset form data when audit changes
    setFormData({
      auditName: audit.auditName,
      category: audit.category,
      auditor: audit.auditor,
      date: audit.date,
      scope: audit.scope,
    });
    setFiles(audit.files);
    setNewFiles([]);
    setIsEditing(false);
  }, [audit]);

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

      setNewFiles(prev => [...prev, newFile]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExistingFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleRemoveNewFile = (fileId: string) => {
    setNewFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const openFileInNewTab = (file: AuditFile) => {
    // Check if this is a newly uploaded file (has file property) or from newFiles array
    const actualFile = file.file || newFiles.find(nf => nf.id === file.id)?.file;
    
    if (actualFile) {
      // For new uploaded files
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const url = URL.createObjectURL(actualFile);
      
      const browserSupported = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'txt', 'html', 'css', 'js'];
      
      if (browserSupported.includes(fileExtension || '')) {
        window.open(url, '_blank');
      } else {
        // Download for unsupported files
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
      }
    } else {
      // For existing files (mock data), just show info
      toast(`Opening ${file.name}... (Mock file - no actual content)`);
    }
  };

  const handleDownloadFile = (file: AuditFile) => {
    openFileInNewTab(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      // Combine existing files with new files (keep File object)
      const allFiles = [
        ...files,
        ...newFiles // Keep the File object
      ];

      const updatedAudit: Audit = {
        ...audit,
        auditName: formData.auditName.trim(),
        category: formData.category,
        auditor: formData.auditor.trim(),
        date: formData.date,
        scope: formData.scope.trim(),
        files: allFiles,
      };

      await onSave(updatedAudit);
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update audit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      auditName: audit.auditName,
      category: audit.category,
      auditor: audit.auditor,
      date: audit.date,
      scope: audit.scope,
    });
    setFiles(audit.files);
    setNewFiles([]);
    setIsEditing(false);
  };

  const getCurrentYearMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Internal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Regulatory':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'External':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Audit' : 'Audit Details'}
            </h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(audit.category)}`}>
              {audit.category}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <FaEdit className="text-sm" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          /* Edit Form */
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
                required
              />
            </div>

            {/* File Management */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Documents
              </label>
              <div className="space-y-4">
                {/* Existing Files */}
                {files.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Existing Files ({files.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
                      {files.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FaFile className="text-blue-500 text-sm flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.size)} • Uploaded {formatDateTime(file.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(file)}
                              className="text-blue-500 hover:text-blue-700 p-1"
                              title="Download"
                            >
                              <FaDownload className="text-sm" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingFile(file.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remove"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Files */}
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
                    Upload New Files
                  </button>
                </div>

                {/* New Files to Upload */}
                {newFiles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Files to Upload ({newFiles.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
                      {newFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FaFile className="text-green-500 text-sm flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.size)} • New file
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveNewFile(file.id)}
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
                onClick={handleCancel}
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
                  <>
                    <FaSave className="text-sm" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {audit.auditName}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Auditor</label>
                    <p className="text-gray-900 dark:text-white">{audit.auditor}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
                    <p className="text-gray-900 dark:text-white flex items-center gap-2">
                      <FaCalendarAlt className="text-blue-500 text-sm" />
                      {formatDate(audit.date)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                  <p className="text-gray-900 dark:text-white">{formatDateTime(audit.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                  <p className="text-gray-900 dark:text-white">{formatDateTime(audit.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Scope */}
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Scope</label>
              <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">{audit.scope}</p>
            </div>

            {/* Files */}
            {audit.files.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 block">
                  Documents ({audit.files.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                  {audit.files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded border hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => openFileInNewTab(file)}>
                        <FaFile className="text-blue-500 text-lg flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
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
                      >
                        <FaDownload className="text-sm" />
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
