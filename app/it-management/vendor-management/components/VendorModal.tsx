"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaTrash, FaSave } from "react-icons/fa";
import toast from "react-hot-toast";

interface PIC {
  id: string;
  nama: string;
  email: string;
  noHP: string;
  role: string;
}

interface Vendor {
  id: string;
  namaVendor: string;
  alamat: string;
  noTlp: string;
  portofolioProject: string;
  pics: PIC[];
  createdAt: string;
  updatedAt: string;
}

interface VendorModalProps {
  vendor: Vendor | null;
  onClose: () => void;
  onSave: (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => void;
  isEditMode: boolean;
  onBackToDetail?: () => void;
}

export default function VendorModal({ vendor, onClose, onSave, isEditMode, onBackToDetail }: VendorModalProps) {
  const [formData, setFormData] = useState({
    namaVendor: "",
    alamat: "",
    noTlp: "",
    portofolioProject: "",
  });

  const [pics, setPics] = useState<PIC[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (isEditMode && vendor) {
      setFormData({
        namaVendor: vendor.namaVendor,
        alamat: vendor.alamat,
        noTlp: vendor.noTlp,
        portofolioProject: vendor.portofolioProject,
      });
      // For edit mode, if vendor has PIC, use it, otherwise create PIC Utama
      if (vendor.pics.length > 0) {
        // Keep existing PICs but ensure first one is PIC Utama
        const existingPics = [...vendor.pics];
        if (!existingPics.some(pic => pic.role === "PIC Utama")) {
          existingPics[0].role = "PIC Utama";
        }
        setPics(existingPics);
      } else {
        setPics([createEmptyPIC(true)]);
      }
    } else {
      // Reset form for new vendor - only create 1 PIC Utama
      setFormData({
        namaVendor: "",
        alamat: "",
        noTlp: "",
        portofolioProject: "",
      });
      setPics([createEmptyPIC(true)]);
    }
  }, [vendor, isEditMode]);

  const createEmptyPIC = (isFirst: boolean = false): PIC => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    nama: "",
    email: "",
    noHP: "",
    role: isFirst ? "PIC Utama" : ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePICChange = (picId: string, field: keyof PIC, value: string) => {
    // If changing role to "PIC Utama", ensure no other PIC has this role
    if (field === "role" && value === "PIC Utama") {
      const existingPICUtama = pics.find(pic => pic.id !== picId && pic.role === "PIC Utama");
      if (existingPICUtama) {
        toast.error("Hanya boleh ada satu PIC Utama per vendor");
        return;
      }
    }

    setPics(prev => prev.map(pic => 
      pic.id === picId ? { ...pic, [field]: value } : pic
    ));
  };

  const addPIC = () => {
    setPics(prev => [...prev, createEmptyPIC(false)]);
  };

  const removePIC = (picId: string) => {
    if (pics.length <= 1) {
      toast.error("At least one PIC is required");
      return;
    }
    
    const picToRemove = pics.find(pic => pic.id === picId);
    const remainingPics = pics.filter(pic => pic.id !== picId);
    
    // If removing PIC Utama, check if there are other PICs to promote
    if (picToRemove?.role === "PIC Utama") {
      const hasOtherPICUtama = remainingPics.some(pic => pic.role === "PIC Utama");
      if (!hasOtherPICUtama && remainingPics.length > 0) {
        // Auto-promote first remaining PIC to PIC Utama
        remainingPics[0].role = "PIC Utama";
        toast.success(`${remainingPics[0].nama || 'First PIC'} has been promoted to PIC Utama`);
      }
    }
    
    setPics(remainingPics);
  };

  const validateForm = () => {
    if (!formData.namaVendor.trim()) {
      toast.error("Vendor name is required");
      return false;
    }
    if (!formData.alamat.trim()) {
      toast.error("Address is required");
      return false;
    }
    if (!formData.noTlp.trim()) {
      toast.error("Phone number is required");
      return false;
    }

    // Validate PICs
    const validPics = pics.filter(pic => 
      pic.nama.trim() && pic.email.trim() && pic.noHP.trim() && pic.role.trim()
    );

    if (validPics.length === 0) {
      toast.error("At least one complete PIC is required");
      return false;
    }

    // Check if there's a PIC Utama
    const hasPICUtama = validPics.some(pic => pic.role === "PIC Utama");
    if (!hasPICUtama) {
      toast.error("PIC Utama is required. Please assign one PIC as PIC Utama.");
      return false;
    }

    // Validate email format
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    for (const pic of validPics) {
      if (!emailRegex.test(pic.email)) {
        toast.error(`Format email tidak valid untuk ${pic.nama}`);
        return false;
      }
    }

    // Validate phone format
    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    for (const pic of validPics) {
      if (!phoneRegex.test(pic.noHP)) {
        toast.error(`Format nomor HP tidak valid untuk ${pic.nama}`);
        return false;
      }
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
      // Filter out empty PICs and ensure at least one PIC exists
      const validPics = pics.filter(pic => 
        pic.nama.trim() && pic.email.trim() && pic.noHP.trim() && pic.role.trim()
      );

      if (validPics.length === 0) {
        toast.error("At least one complete PIC is required");
        setIsSubmitting(false);
        return;
      }

      // All valid PICs will be saved
      const vendorData = {
        ...formData,
        pics: validPics
      };

      onSave(vendorData);
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast.error("Failed to save vendor");
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditMode ? "Edit Vendor" : "Add New Vendor"}
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
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Vendor Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Vendor Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama Vendor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Vendor *
                  </label>
                  <input
                    type="text"
                    name="namaVendor"
                    value={formData.namaVendor}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter vendor name"
                    required
                  />
                </div>

                {/* No. Telepon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    No. Telepon *
                  </label>
                  <input
                    type="text"
                    name="noTlp"
                    value={formData.noTlp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="021-1234567"
                    required
                  />
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alamat *
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Enter complete address"
                  required
                />
              </div>

              {/* Portofolio Project */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Portofolio Project
                </label>
                <textarea
                  name="portofolioProject"
                  value={formData.portofolioProject}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Describe vendor's project portfolio..."
                />
              </div>
            </div>

            {/* PIC Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Person in Charge (PIC) *
                  </h3>
                  {!pics.some(pic => pic.role === "PIC Utama") && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      ⚠️ PIC Utama is required
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addPIC}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  <FaPlus size={12} />
                  Add PIC
                </button>
              </div>

              <div className="space-y-4">
                {pics.map((pic, index) => {
                  const isComplete = pic.nama.trim() && pic.email.trim() && pic.noHP.trim() && pic.role.trim();
                  return (
                  <div key={pic.id} className={`border rounded-lg p-4 ${
                    isComplete 
                      ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700' 
                      : 'border-red-200 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          PIC #{index + 1}
                        </span>
                        {pic.role === "PIC Utama" && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                            PIC Utama
                          </span>
                        )}
                        {!isComplete && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                            Incomplete
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {pics.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePIC(pic.id)}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors duration-200"
                            title="Remove PIC"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Nama */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nama *
                        </label>
                        <input
                          type="text"
                          value={pic.nama}
                          onChange={(e) => handlePICChange(pic.id, "nama", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="Full name"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={pic.email}
                          onChange={(e) => handlePICChange(pic.id, "email", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="email@example.com"
                        />
                      </div>

                      {/* No. HP */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          No. HP *
                        </label>
                        <input
                          type="tel"
                          value={pic.noHP}
                          onChange={(e) => handlePICChange(pic.id, "noHP", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="08123456789"
                          pattern="[0-9+\-\s()]{10,15}"
                        />
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Role *
                        </label>
                        <select
                          value={pic.role}
                          onChange={(e) => handlePICChange(pic.id, "role", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">Select Role</option>
                          <option value="PIC Utama">PIC Utama</option>
                          <option value="Business Partner">Business Partner</option>
                          <option value="Engineer">Engineer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Always visible */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={isEditMode && onBackToDetail ? onBackToDetail : onClose}
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
                {isEditMode ? "Update Vendor" : "Save Vendor"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
