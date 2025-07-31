"use client";

import { useState, useRef, useEffect } from "react";
import { FaTimes, FaUpload, FaFile, FaTrash, FaCalendarAlt, FaDownload, FaEdit, FaSave, FaFileAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import { Audit, AuditFile } from "@/utils/auditApi";
import AuditFindingsList from "./AuditFindingsList";


interface AuditDetailModalProps {
  audit: Audit;
  onClose: () => void;
  onSave: (auditData: Audit) => void;
}

export default function AuditDetailModal({ audit, onClose, onSave }: AuditDetailModalProps) {
  // Enhanced Debug logging
  console.log('🔍 DEBUG - AuditDetailModal received audit:', audit);
  console.log('🔍 DEBUG - AuditDetailModal audit type:', typeof audit);
  console.log('🔍 DEBUG - AuditDetailModal audit keys:', Object.keys(audit));
  console.log('🔍 DEBUG - AuditDetailModal findings:', audit.findings);
  console.log('🔍 DEBUG - AuditDetailModal findings type:', typeof audit.findings);
  console.log('🔍 DEBUG - AuditDetailModal findings count:', audit.findings?.length || 0);
  console.log('🔍 DEBUG - AuditDetailModal related_findings:', (audit as any).related_findings);
  console.log('🔍 DEBUG - AuditDetailModal audit_findings:', (audit as any).audit_findings);
  console.log('🔍 DEBUG - AuditDetailModal raw audit JSON:', JSON.stringify(audit, null, 2));
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: audit.name,
    category: audit.category,
    auditor: audit.auditor,
    date: audit.date,
    scope: audit.scope,
  });
  const [files, setFiles] = useState<AuditFile[]>(audit.files);
  const [newFiles, setNewFiles] = useState<AuditFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    // Reset form data when audit changes
    setFormData({
      name: audit.name,
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
      // For new uploaded files - always open in new tab
      const url = URL.createObjectURL(actualFile);
      window.open(url, '_blank');
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } else {
      // For existing files, open in new tab
      const baseUrl = process.env.NEXT_PUBLIC_ITG_SERVICE_URL || 'http://localhost:5010';
      const token = localStorage.getItem('token');
      const downloadUrl = `${baseUrl}/api/audit/audits/${audit.id}/files/${file.id}/download`;
      
      fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      })
      .catch(error => {
        console.error('Open error:', error);
        toast.error('Failed to open file');
      });
    }
  };

  const handleDownloadFile = (file: AuditFile) => {
    // Check if this is a newly uploaded file (has file property) or from newFiles array
    const actualFile = file.file || newFiles.find(nf => nf.id === file.id)?.file;
    
    if (actualFile) {
      // For new uploaded files - download directly
      const url = URL.createObjectURL(actualFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      // For existing files, use API download endpoint
      const baseUrl = process.env.NEXT_PUBLIC_ITG_SERVICE_URL || 'http://localhost:5010';
      const token = localStorage.getItem('token');
      const downloadUrl = `${baseUrl}/api/audit/audits/${audit.id}/files/${file.id}/download`;
      
      fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          return response.blob();
        }
        throw new Error('Download failed');
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(error => {
        console.error('Download error:', error);
        toast.error('Failed to download file');
      });
    }
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
    if (!formData.name.trim()) {
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
        name: formData.name.trim(),
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
      name: audit.name,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Audit' : 'Audit Details'}
            </h2>
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
          {isEditing ? (
            /* Edit Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(audit.category)}`}>
                    {audit.category}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Audit Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      required
                    >
                      <option value="Internal">Internal</option>
                      <option value="Regulatory">Regulatory</option>
                      <option value="External">External</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="auditor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Auditor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="auditor"
                      name="auditor"
                      value={formData.auditor}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date (Month/Year) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="month"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      max={getCurrentYearMonth()}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Audit Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Audit Details</h3>
                <div>
                  <label htmlFor="scope" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Scope <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="scope"
                    name="scope"
                    value={formData.scope}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                    required
                  />
                </div>
              </div>

              {/* File Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Documents</h3>
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
            </form>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(audit.category)}`}>
                    {audit.category}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audit Name</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">{audit.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Auditor</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">{audit.auditor}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-500 text-sm" />
                    {formatDate(audit.date)}
                  </div>
                </div>
              </div>

              {/* Audit Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Audit Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scope</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white whitespace-pre-wrap">{audit.scope}</div>
                </div>
              </div>

              {/* Documents */}
              {audit.files.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Documents ({audit.files.length})</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                    {audit.files.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
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
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Findings */}
              <div className="space-y-4">
                <AuditFindingsList 
                  findings={
                    audit.findings || 
                    (audit as any).related_findings || 
                    (audit as any).audit_findings || 
                    []
                  }
                />
              </div>

              {/* Audit Files */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Audit Files
                </h3>
                {audit.files && audit.files.length > 0 ? (
                  <div className="space-y-2">
                    {audit.files.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <FaFileAlt className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {file.original_name || file.filename || `File ${index + 1}`}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'Unknown size'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {file.id && (
                            <button
                              onClick={() => {
                                // TODO: Implement file download
                                console.log('Download file:', file);
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                            >
                              Download
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FaFileAlt className="mx-auto text-4xl mb-2 opacity-50" />
                    <p>No files attached to this audit</p>
                  </div>
                )}
              </div>

              {/* Audit Trail */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Audit Trail</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created At</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">{(audit.createdAt || audit.created_at) ? formatDateTime((audit.createdAt || audit.created_at)!) : 'Unknown'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Updated</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">{(audit.updatedAt || audit.updated_at) ? formatDateTime((audit.updatedAt || audit.updated_at)!) : 'Unknown'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex justify-end gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <FaEdit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
