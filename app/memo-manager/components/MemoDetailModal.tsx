"use client";

import { FaTimes, FaFileAlt, FaCalendarAlt, FaUser, FaEnvelope, FaHashtag } from "react-icons/fa";

interface Memo {
  id: string;
  jenis: "Memo" | "Surat";
  tanggal: string;
  nomor: string;
  kepada: string;
  cc: string;
  perihal: string;
  pembuat: string;
  createdAt: string;
  updatedAt: string;
}

interface MemoDetailModalProps {
  memo: Memo;
  onClose: () => void;
}

export default function MemoDetailModal({ memo, onClose }: MemoDetailModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDisplayDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <FaFileAlt className="text-blue-600 dark:text-blue-400" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Detail {memo.jenis}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {memo.nomor}
                </p>
              </div>
            </div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              memo.jenis === 'Memo' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
              {memo.jenis}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Document Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaFileAlt className="text-blue-600 dark:text-blue-400" />
                Informasi Dokumen
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <FaHashtag size={12} />
                    Nomor Dokumen
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono text-lg">
                    {memo.nomor}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <FaCalendarAlt size={12} />
                    Tanggal
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDisplayDate(memo.tanggal)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Jenis Dokumen
                  </label>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    memo.jenis === 'Memo' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {memo.jenis}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <FaUser size={12} />
                    Pembuat
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {memo.pembuat}
                  </p>
                </div>
              </div>
            </div>

            {/* Recipients Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaEnvelope className="text-blue-600 dark:text-blue-400" />
                Informasi Penerima
              </h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Kepada
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {memo.kepada}
                  </p>
                </div>

                {memo.cc && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      CC (Carbon Copy)
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {memo.cc}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Subject/Content */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Perihal
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                  {memo.perihal}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informasi Sistem
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Dibuat Pada
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(memo.createdAt)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Terakhir Diperbarui
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(memo.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Number Format Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Format Penomoran
                  </h4>
                  <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    {memo.jenis === 'Memo' ? (
                      <p>Format Memo: <strong>XXXXX/ITE-IAE/M/YYYY</strong></p>
                    ) : (
                      <p>Format Surat: <strong>XXXXX/ITE-IAG/YYYY</strong></p>
                    )}
                    <p className="mt-1">
                      Nomor urut berdasarkan jenis dokumen dan tahun pembuatan
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Always visible */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}