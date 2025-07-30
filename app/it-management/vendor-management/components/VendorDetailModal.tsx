"use client";

import { useEffect } from "react";
import { FaTimes, FaEdit, FaBuilding, FaPhone, FaMapMarkerAlt, FaUser, FaEnvelope, FaMobile, FaUserTie, FaStar } from "react-icons/fa";

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

interface VendorDetailModalProps {
  vendor: Vendor;
  onClose: () => void;
  onEdit: () => void;
}

export default function VendorDetailModal({ vendor, onClose, onEdit }: VendorDetailModalProps) {
  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const primaryPIC = vendor.pics.find(pic => pic.role === "PIC Utama");
  const otherPICs = vendor.pics.filter(pic => pic.role !== "PIC Utama");

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <FaBuilding className="text-blue-600 dark:text-blue-400" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Vendor Details
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {vendor.namaVendor}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaBuilding className="text-blue-600 dark:text-blue-400" />
                Vendor Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Vendor Name
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {vendor.namaVendor}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <FaPhone size={12} />
                    Phone Number
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {vendor.noTlp}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <FaMapMarkerAlt size={12} />
                    Address
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {vendor.alamat}
                  </p>
                </div>

                {vendor.portofolioProject && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Project Portfolio
                    </label>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {vendor.portofolioProject}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Primary PIC */}
            {primaryPIC && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaStar className="text-yellow-500" />
                  PIC Utama
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <FaUser size={12} />
                      Name
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {primaryPIC.nama}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <FaUserTie size={12} />
                      Role
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {primaryPIC.role}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <FaEnvelope size={12} />
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      <a 
                        href={`mailto:${primaryPIC.email}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {primaryPIC.email}
                      </a>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <FaMobile size={12} />
                      Mobile Number
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      <a 
                        href={`tel:${primaryPIC.noHP}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {primaryPIC.noHP}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Other PICs */}
            {otherPICs.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaUser className="text-blue-600 dark:text-blue-400" />
                  Other Person in Charge ({otherPICs.length})
                </h3>
                
                <div className="space-y-6">
                  {otherPICs.map((pic, index) => (
                    <div key={pic.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                      <div className="flex items-center gap-2 mb-3">
                        <FaUserTie className="text-gray-600 dark:text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          PIC #{index + 2}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Name
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {pic.nama}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Role
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {pic.role}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Email
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            <a 
                              href={`mailto:${pic.email}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {pic.email}
                            </a>
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Mobile Number
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            <a 
                              href={`tel:${pic.noHP}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {pic.noHP}
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Record Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Created At
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(vendor.createdAt)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Last Updated
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(vendor.updatedAt)}
                  </p>
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
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <FaEdit size={14} />
            Edit Vendor
          </button>
        </div>
      </div>
    </div>
  );
}
