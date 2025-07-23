"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaCheck, FaTimes, FaChevronLeft, FaChevronRight, FaFileExcel } from "react-icons/fa";
import * as XLSX from 'xlsx';
import VendorModal from "./components/VendorModal";
import VendorDetailModal from "./components/VendorDetailModal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import toast from "react-hot-toast";

// Define interfaces
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

export default function VendorManagementPage() {
  const { user, token } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Generate mock data
  const generateMockVendors = (): Vendor[] => {
    const vendors: Vendor[] = [];
    const vendorNames = [
      "PT Teknologi Maju Bersama", "CV Digital Solutions Indonesia", "PT Inovasi Sistem Terpadu",
      "PT Solusi Teknologi Nusantara", "CV Kreasi Digital Mandiri", "PT Mitra Teknologi Global",
      "PT Sistem Informasi Terpadu", "CV Inovasi Digital Indonesia", "PT Teknologi Canggih Nusantara",
      "PT Digital Transformation Solutions", "CV Smart Technology Indonesia", "PT Cyber Security Solutions",
      "PT Cloud Computing Indonesia", "CV Mobile App Development", "PT Data Analytics Solutions",
      "PT Artificial Intelligence Tech", "CV Blockchain Solutions", "PT IoT Technology Indonesia",
      "PT Software Development House", "CV Web Development Solutions"
    ];

    const addresses = [
      "Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10220",
      "Jl. Gatot Subroto Kav. 45, Jakarta Selatan, DKI Jakarta 12950",
      "Jl. HR Rasuna Said Blok X-5 Kav. 1-2, Jakarta Selatan, DKI Jakarta 12950",
      "Jl. Thamrin No. 28-30, Jakarta Pusat, DKI Jakarta 10350",
      "Jl. Kuningan Raya No. 18, Jakarta Selatan, DKI Jakarta 12940",
      "Jl. Casablanca Raya Kav. 88, Jakarta Selatan, DKI Jakarta 12870",
      "Jl. TB Simatupang Kav. 1, Jakarta Selatan, DKI Jakarta 12560",
      "Jl. Mega Kuningan Barat III Lot 10.1-6, Jakarta Selatan, DKI Jakarta 12950"
    ];

    const roles = ["PIC Utama", "Business Partner", "Engineer"];
    const firstNames = ["Ahmad", "Sari", "Budi", "Maya", "Eko", "Linda", "Rizki", "Dewi", "Santoso", "Wijaya"];
    const lastNames = ["Rizki", "Dewi", "Santoso", "Sari", "Prasetyo", "Wijaya", "Rahman", "Putri", "Nugroho", "Handayani"];

    for (let i = 1; i <= 20; i++) {
      const numPICs = Math.floor(Math.random() * 3) + 1; // 1-3 PICs
      const pics: PIC[] = [];
      
      for (let j = 0; j < numPICs; j++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${vendorNames[i-1].toLowerCase().replace(/[^a-z]/g, '')}.com`;
        
        pics.push({
          id: `pic${i}_${j}`,
          nama: fullName,
          email: email,
          noHP: `081${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          role: j === 0 ? "PIC Utama" : roles[Math.floor(Math.random() * (roles.length - 1)) + 1] // First PIC is PIC Utama, others are random from remaining roles
        });
      }

      const createdDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      
      vendors.push({
        id: i.toString(),
        namaVendor: vendorNames[i - 1],
        alamat: addresses[Math.floor(Math.random() * addresses.length)],
        noTlp: `021-${Math.floor(Math.random() * 9000000) + 1000000}`,
        portofolioProject: `Pengembangan sistem ${['ERP', 'CRM', 'HRM', 'SCM', 'WMS'][Math.floor(Math.random() * 5)]} untuk perusahaan ${['manufaktur', 'retail', 'logistik', 'keuangan', 'kesehatan'][Math.floor(Math.random() * 5)]}, implementasi ${['cloud infrastructure', 'mobile application', 'web portal', 'data analytics', 'security system'][Math.floor(Math.random() * 5)]}, dan maintenance aplikasi ${['banking', 'e-commerce', 'inventory', 'payroll', 'reporting'][Math.floor(Math.random() * 5)]}.`,
        pics: pics,
        createdAt: createdDate.toISOString(),
        updatedAt: createdDate.toISOString()
      });
    }
    
    return vendors.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const mockVendors = generateMockVendors();

  useEffect(() => {
    fetchVendors();
  }, [token]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      setTimeout(() => {
        setVendors(mockVendors);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError("Failed to fetch vendors");
      setLoading(false);
      toast.error("Failed to load vendors");
    }
  };

  // Filter vendors based on search term
  const filteredVendors = useMemo(() => {
    if (!searchTerm) return vendors;
    
    return vendors.filter(vendor =>
      vendor.namaVendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.pics.some(pic => pic.nama.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [vendors, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVendors = filteredVendors.slice(startIndex, endIndex);

  // Get primary PIC
  const getPrimaryPIC = (pics: PIC[]) => {
    const primaryPIC = pics.find(pic => pic.role === "PIC Utama");
    return primaryPIC ? primaryPIC.nama : pics.length > 0 ? pics[0].nama : "-";
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedVendors([]);
  };

  // Handle row selection
  const handleRowSelect = (vendor: Vendor) => {
    if (isSelectionMode) {
      setSelectedVendors(prev => 
        prev.includes(vendor.id) 
          ? prev.filter(id => id !== vendor.id)
          : [...prev, vendor.id]
      );
    } else {
      setSelectedVendor(vendor);
      setShowDetailModal(true);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    const currentPageIds = currentVendors.map(vendor => vendor.id);
    const allSelected = currentPageIds.every(id => selectedVendors.includes(id));
    
    if (allSelected) {
      setSelectedVendors(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedVendors(prev => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedVendors([]);
    setSelectedVendor(null);
  };

  const handleDeleteVendor = () => {
    if (selectedVendors.length > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const handleEditFromDetail = () => {
    setShowDetailModal(false);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleCheckboxChange = (vendor: Vendor, e: React.MouseEvent) => {
    e.stopPropagation();
    handleRowSelect(vendor);
  };

  const handleNewVendor = () => {
    setSelectedVendor(null);
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleSaveVendor = (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isEditMode && selectedVendor) {
      const updatedVendor: Vendor = {
        ...selectedVendor,
        ...vendorData,
        updatedAt: new Date().toISOString()
      };
      
      setVendors(prev => prev.map(v => v.id === selectedVendor.id ? updatedVendor : v));
      toast.success(`Vendor "${vendorData.namaVendor}" berhasil diperbarui`);
    } else {
      const newVendor: Vendor = {
        id: Date.now().toString(),
        ...vendorData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setVendors(prev => [newVendor, ...prev]);
      toast.success(`Vendor "${vendorData.namaVendor}" berhasil ditambahkan`);
    }
    
    setShowModal(false);
    setSelectedVendor(null);
  };

  const confirmDelete = () => {
    const deletedVendors = vendors.filter(v => selectedVendors.includes(v.id));
    setVendors(prev => prev.filter(v => !selectedVendors.includes(v.id)));
    
    if (deletedVendors.length === 1) {
      toast.success(`Vendor "${deletedVendors[0].namaVendor}" berhasil dihapus`);
    } else {
      toast.success(`${deletedVendors.length} vendor berhasil dihapus`);
    }
    
    setSelectedVendors([]);
    setShowDeleteConfirm(false);
    setIsSelectionMode(false);
  };
  const handleExportSelected = async () => {
    if (selectedVendors.length === 0) {
      toast.error("Please select vendors to export");
      return;
    }

    try {
      setIsExporting(true);
      
      // Get selected vendors data
      const selectedVendorsData = vendors.filter(vendor => selectedVendors.includes(vendor.id));
      
      // Create Excel data - one row per PIC
      const excelData: any[] = [];
      let rowNumber = 1;
      
      selectedVendorsData.forEach(vendor => {
        // Find PIC Utama (Primary PIC)
        const primaryPIC = vendor.pics.find(pic => pic.role === "PIC Utama");
        
        if (primaryPIC) {
          // Use PIC Utama data
          excelData.push({
            "No": rowNumber++,
            "Nama Vendor": vendor.namaVendor,
            "Alamat": vendor.alamat,
            "No Telepon": vendor.noTlp,
            "Portfolio Project": vendor.portofolioProject,
            "PIC Nama": primaryPIC.nama,
            "PIC Email": primaryPIC.email,
            "PIC No HP": primaryPIC.noHP,
            "PIC Role": primaryPIC.role,
            "Created At": new Date(vendor.createdAt).toLocaleDateString('id-ID'),
            "Updated At": new Date(vendor.updatedAt).toLocaleDateString('id-ID')
          });
        } else {
          // If no PIC Utama found, create row with empty PIC data
          excelData.push({
            "No": rowNumber++,
            "Nama Vendor": vendor.namaVendor,
            "Alamat": vendor.alamat,
            "No Telepon": vendor.noTlp,
            "Portfolio Project": vendor.portofolioProject,
            "PIC Nama": "-",
            "PIC Email": "-",
            "PIC No HP": "-",
            "PIC Role": "-",
            "Created At": new Date(vendor.createdAt).toLocaleDateString('id-ID'),
            "Updated At": new Date(vendor.updatedAt).toLocaleDateString('id-ID')
          });
        }
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 5 },   // No
        { wch: 25 },  // Nama Vendor
        { wch: 40 },  // Alamat
        { wch: 15 },  // No Telepon
        { wch: 50 },  // Portfolio Project
        { wch: 20 },  // PIC Nama
        { wch: 25 },  // PIC Email
        { wch: 15 },  // PIC No HP
        { wch: 15 },  // PIC Role
        { wch: 12 },  // Created At
        { wch: 12 }   // Updated At
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vendor Data");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `Selected_Vendors_${selectedVendors.length}_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      // Show success message
      toast.success(`Successfully exported ${selectedVendors.length} vendors to Excel`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export vendors. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
          <Sidebar />
          <div className="flex-1 md:ml-60 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
        <Sidebar />
        <div className="flex-1 md:ml-60 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Vendor Management
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {isSelectionMode 
                      ? "Select multiple vendors to delete them. Click Cancel to exit selection mode."
                      : "Click on any row to view vendor details. Use Select button for bulk operations."
                    }
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {vendors.length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total Vendors
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Search Bar and Add Button */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              {!isSelectionMode ? (
                <>
                  <button
                    onClick={toggleSelectionMode}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                    title="Select multiple vendors for bulk operations"
                  >
                    <FaCheck className="text-sm" />
                    Select
                  </button>
                  
                  <button
                    onClick={handleNewVendor}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <FaPlus className="text-sm" />
                    New Vendor
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={toggleSelectionMode}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <FaTimes className="text-sm" />
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleDeleteVendor}
                    disabled={selectedVendors.length === 0}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <FaTrash className="text-sm" />
                    Delete {selectedVendors.length > 0 && `(${selectedVendors.length})`}
                  </button>
                  
                  <button
                    onClick={handleExportSelected}
                    disabled={selectedVendors.length === 0 || isExporting}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <FaFileExcel className="text-sm" />
                    {isExporting ? 'Exporting...' : `Export ${selectedVendors.length > 0 ? `(${selectedVendors.length})` : ''}`}
                  </button>                  
                  {selectedVendors.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 px-3 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg whitespace-nowrap">
                      <FaCheck className="text-blue-500 mr-2" />
                      {selectedVendors.length} selected
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {isSelectionMode && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={currentVendors.length > 0 && currentVendors.every(vendor => selectedVendors.includes(vendor.id))}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Nama Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Alamat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        PIC
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentVendors.length === 0 ? (
                      <tr>
                        <td colSpan={isSelectionMode ? 5 : 4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          {searchTerm ? 'No vendors found matching your search.' : 'No vendors available.'}
                        </td>
                      </tr>
                    ) : (
                      currentVendors.map((vendor, index) => (
                        <tr
                          key={vendor.id}
                          onClick={() => handleRowSelect(vendor)}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                            selectedVendors.includes(vendor.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          {isSelectionMode && (
                            <td className="px-6 py-4 whitespace-nowrap w-12">
                              <input
                                type="checkbox"
                                checked={selectedVendors.includes(vendor.id)}
                                onChange={(e) => handleCheckboxChange(vendor, e)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {vendor.namaVendor}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {vendor.noTlp}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                              {vendor.alamat}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {getPrimaryPIC(vendor.pics)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {vendor.pics.length} PIC{vendor.pics.length > 1 ? 's' : ''}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredVendors.length)} of {filteredVendors.length} vendors
                        {vendors.length !== filteredVendors.length && (
                          <span className="text-gray-500"> (filtered from {vendors.length} total)</span>
                        )}
                      </div>
                      {isSelectionMode && selectedVendors.length > 0 && (
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          {selectedVendors.length} selected across all pages
                        </div>
                      )}
                    </div>
                    
                    {/* Pagination Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-1 text-sm border rounded ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <span className="px-2 text-gray-500">...</span>
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vendor Modal */}
        {showModal && (
          <VendorModal
            vendor={selectedVendor}
            isEditMode={isEditMode}
            onSave={handleSaveVendor}
            onClose={() => {
              setShowModal(false);
              setSelectedVendor(null);
            }}
          />
        )}

        {/* Vendor Detail Modal */}
        {showDetailModal && selectedVendor && (
          <VendorDetailModal
            vendor={selectedVendor}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedVendor(null);
            }}
            onEdit={handleEditFromDetail}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={confirmDelete}
            title="Delete Vendors"
            message={`Are you sure you want to delete ${selectedVendors.length} vendor${selectedVendors.length > 1 ? 's' : ''}? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            type="danger"
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
