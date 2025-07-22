"use client";

import { useState } from "react";
import { FaTimes, FaSave, FaCalendarAlt } from "react-icons/fa";
import toast from "react-hot-toast";

interface MemoModalProps {
  onSave: (memoData: { type: "memo" | "surat"; to: string; cc?: string; reason: string }) => Promise<void>;
  onClose: () => void;
}

export default function MemoModal({ onSave, onClose }: MemoModalProps) {
  const [formData, setFormData] = useState({
    jenis: "Memo" as "Memo" | "Surat",
    tanggal: new Date().toISOString().split('T')[0],
    kepada: "",
    cc: "",
    perihal: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.jenis) {
      toast.error("Jenis dokumen wajib dipilih");
      return false;
    }
    if (!formData.tanggal) {
      toast.error("Tanggal wajib diisi");
      return false;
    }
    if (!formData.kepada.trim()) {
      toast.error("Kepada wajib diisi");
      return false;
    }
    if (!formData.perihal.trim()) {
      toast.error("Perihal wajib diisi");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert old format to new API format
      const apiData = {
        type: (formData.jenis.toLowerCase() === "memo" ? "memo" : "surat") as "memo" | "surat",
        to: formData.kepada.trim(),
        cc: formData.cc.trim() || undefined,
        reason: formData.perihal.trim()
      };

      await onSave(apiData);
    } catch (error) {
      console.error("Error saving memo:", error);
      toast.error("Gagal menyimpan dokumen");
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Buat Memo/Surat Baru
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Jenis Dokumen *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name="jenis"
                    value="Memo"
                    checked={formData.jenis === "Memo"}
                    onChange={handleInputChange}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Memo</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Format: XXXXX/ITE-IAE/M/YYYY</div>
                  </div>
                </label>
                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name="jenis"
                    value="Surat"
                    checked={formData.jenis === "Surat"}
                    onChange={handleInputChange}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Surat</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Format: XXXXX/ITE-IAG/YYYY</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tanggal *
              </label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kepada *
              </label>
              <input
                type="text"
                name="kepada"
                value={formData.kepada}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Masukkan nama penerima"
                required
              />
            </div>

            {/* CC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CC
              </label>
              <input
                type="text"
                name="cc"
                value={formData.cc}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Masukkan nama CC (opsional)"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Perihal *
              </label>
              <textarea
                name="perihal"
                value={formData.perihal}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Masukkan perihal/subjek dokumen"
                required
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Informasi Otomatis
                  </h4>
                  <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    <p>• <strong>Nomor dokumen</strong> akan dibuat otomatis sesuai jenis dan tahun</p>
                    <p>• <strong>Pembuat</strong> akan diisi otomatis berdasarkan user yang login</p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Always visible */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <FaSave size={14} />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
