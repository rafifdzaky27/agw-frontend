"use client";

import React, { useState, useRef } from 'react';
import { FaUpload, FaFile, FaTimes, FaDownload, FaTrash } from 'react-icons/fa';

export interface FileData {
  id?: string;
  name: string;
  size: number;
  type: string;
  file?: File;
  uploadedAt?: string;
}

interface FileUploadProps {
  files: FileData[];
  onFilesChange: (files: FileData[]) => void;
  onFileDownload?: (fileId: string, fileName: string) => void;
  onFileDelete?: (fileId: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  disabled?: boolean;
  showExistingFiles?: boolean;
}

export default function FileUpload({
  files,
  onFilesChange,
  onFileDownload,
  onFileDelete,
  maxFiles = 10,
  maxFileSize = 10, // 10MB default
  acceptedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'],
  disabled = false,
  showExistingFiles = true
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(fileExtension)) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: FileData[] = [];
    const errors: string[] = [];

    // Check total file count
    if (files.length + fileList.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return;
    }

    Array.from(fileList).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        // Check for duplicate names
        const isDuplicate = files.some(existingFile => existingFile.name === file.name);
        if (isDuplicate) {
          errors.push(`${file.name}: File with this name already exists`);
        } else {
          newFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
          });
        }
      }
    });

    if (errors.length > 0) {
      alert('File upload errors:\n' + errors.join('\n'));
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const handleDownload = (file: FileData) => {
    if (file.id && onFileDownload) {
      onFileDownload(file.id, file.name);
    }
  };

  const handleDelete = (file: FileData) => {
    if (file.id && onFileDelete) {
      if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
        onFileDelete(file.id);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        <FaUpload className="mx-auto text-3xl text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Max {maxFiles} files, {maxFileSize}MB each. Supported: {acceptedTypes.join(', ')}
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {showExistingFiles ? 'Files' : 'New Files'} ({files.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FaFile className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                      {file.uploadedAt && ` • Uploaded ${new Date(file.uploadedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* Download button for existing files */}
                  {file.id && onFileDownload && (
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Download file"
                    >
                      <FaDownload className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Delete button */}
                  {file.id && onFileDelete ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(file)}
                      className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete file"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title="Remove file"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
