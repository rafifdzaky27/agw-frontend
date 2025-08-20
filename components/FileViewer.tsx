"use client";

import { useState } from "react";
import { FaTimes, FaDownload, FaFile, FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, FaFileAlt } from "react-icons/fa";

interface FileViewerProps {
  file: {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadedAt: string;
    file?: File;
  };
  onClose: () => void;
}

export default function FileViewer({ file, onClose }: FileViewerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FaFilePdf className="text-red-500" size={24} />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-500" size={24} />;
      case 'xls':
      case 'xlsx':
        return <FaFileExcel className="text-green-500" size={24} />;
      case 'ppt':
      case 'pptx':
        return <FaFilePowerpoint className="text-orange-500" size={24} />;
      case 'txt':
        return <FaFileAlt className="text-gray-500" size={24} />;
      default:
        return <FaFile className="text-gray-500" size={24} />;
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
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async () => {
    if (!file.file) {
      // If no file object, show message that file is not available for download
      alert("File is not available for download. This might be a previously uploaded file.");
      return;
    }

    try {
      setIsLoading(true);
      
      // Create download link
      const url = URL.createObjectURL(file.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert("Failed to download file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const canPreview = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['txt', 'pdf'].includes(extension || '');
  };

  const renderPreview = () => {
    if (!file.file) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-center">
            <div className="mb-4">
              {getFileIcon(file.name)}
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              File preview not available
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              This file was uploaded previously and cannot be previewed
            </p>
          </div>
        </div>
      );
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'txt') {
      return <TextPreview file={file.file} />;
    } else if (extension === 'pdf') {
      return <PDFPreview file={file.file} />;
    } else {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-center">
            <div className="mb-4">
              {getFileIcon(file.name)}
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Preview not available for this file type
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Click download to view the file
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {getFileIcon(file.name)}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate max-w-md">
                {file.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isLoading || !file.file}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm"
            >
              <FaDownload className="text-xs" />
              {isLoading ? 'Downloading...' : 'Download'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}

// Text file preview component
function TextPreview({ file }: { file: File }) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useState(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setContent(e.target?.result as string || '');
      setLoading(false);
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };
    reader.readAsText(file);
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-auto">
      <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-mono">
        {content}
      </pre>
    </div>
  );
}

// PDF preview component
function PDFPreview({ file }: { file: File }) {
  const [objectUrl, setObjectUrl] = useState<string>('');

  useState(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  });

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
      <iframe
        src={objectUrl}
        className="w-full h-full border-0"
        title="PDF Preview"
      />
    </div>
  );
}