"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaSearch, FaMoneyBillWave, FaCheckCircle, FaClock, FaCalendarAlt, FaFileExcel, FaCheck, FaTimes, FaTrash } from "react-icons/fa";
import * as XLSX from 'xlsx';
import ProjectPaymentDetailModal from "./components/ProjectPaymentDetailModal";
import toast from "react-hot-toast";
import * as financeApi from "@/utils/financeApi";

// Define interfaces
interface PaymentTerm {
  id: string;
  termin: string;
  nominal: number;
  description: string;
  status: 'Belum Dibayar' | 'Sudah Dibayar' | 'Checking Umum' | 'Menunggu Posting' | 'Sirkulir IT';
  paymentDate?: string;
  budget?: 'Capex' | 'Opex';
  notes?: string;
  // New fields for Non-Procurement Opex breakdown
  opexCabang?: number;
  opexPusat?: number;
}

interface Project {
  id: string;
  kodeProject: string;
  projectName: string;
  projectType: 'internal development' | 'procurement' | 'non procurement';
  divisiInisiasi: string;
  grupTerlibat: string;
  keterangan: string;
  namaVendor: string;
  noPKSPO: string;
  tanggalPKSPO: string;
  tanggalBAPP: string;
  tanggalBerakhir: string;
  terminPembayaran: PaymentTerm[];
  createdAt: string;
  updatedAt: string;
}

export default function FinanceManagementPage() {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filter and selection states
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);



  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await financeApi.getAllFinanceProjects(token!);
      setProjects(data);
    } catch (err) {
      setError("Failed to fetch projects");
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  // Calculate payment status for each project
  const getPaymentStatus = (terms: PaymentTerm[]) => {
    const paidTerms = terms.filter(term => term.status === 'Sudah Dibayar').length;
    const totalTerms = terms.length;
    
    if (paidTerms === totalTerms) {
      return { status: 'Done', color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' };
    } else if (paidTerms > 0) {
      return { 
        status: `Progress (${paidTerms}/${totalTerms})`, 
        color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' 
      };
    } else {
      return { status: 'Not Started', color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400' };
    }
  };

  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    let filtered = projects;
    
    // Filter by year
    if (selectedYear !== 'all') {
      filtered = filtered.filter(project => 
        project.tanggalPKSPO.split('-')[0] === selectedYear
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.noPKSPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.namaVendor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [projects, searchTerm, selectedYear]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle row click
  const handleRowClick = (project: Project) => {
    if (isSelectionMode) {
      handleMultipleSelect(project.id);
    } else {
      setSelectedProject(project);
      setShowDetailModal(true);
    }
  };

  // Update project payment terms
  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      await financeApi.updatePaymentTerms(updatedProject.id, updatedProject.terminPembayaran, token!);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      toast.success("Payment information updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment information");
    }
  };
  // Selection mode functions
  const handleMultipleSelect = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    const allCurrentProjects = filteredProjects.map(project => project.id);
    if (selectedProjects.length === allCurrentProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(allCurrentProjects);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedProjects([]);
  };

  // Export function for selected projects
  const handleExportSelected = async () => {
    if (selectedProjects.length === 0) {
      toast.error("Please select projects to export");
      return;
    }

    try {
      setIsExporting(true);
      
      // Get selected projects data
      const selectedProjectsData = projects.filter(project => selectedProjects.includes(project.id));
      
      // Create Excel data
      const excelData: any[] = [];
      
      selectedProjectsData.forEach((project, index) => {
        const paymentStatus = getPaymentStatus(project.terminPembayaran);
        const totalValue = project.terminPembayaran.reduce((sum, term) => sum + term.nominal, 0);
        const paidValue = project.terminPembayaran
          .filter(term => term.status === 'Sudah Dibayar')
          .reduce((sum, term) => sum + term.nominal, 0);
        
        excelData.push({
          "No": index + 1,
          "Project Code": project.kodeProject,
          "Project Name": project.projectName,
          "Project Type": project.projectType,
          "PKS/PO Number": project.noPKSPO,
          "Vendor": project.namaVendor,
          "Division": project.divisiInisiasi,
          "Group": project.grupTerlibat,
          "PKS/PO Date": project.tanggalPKSPO,
          "BAPP Date": project.tanggalBAPP,
          "End Date": project.tanggalBerakhir,
          "Payment Status": paymentStatus.status,
          "Total Value": formatCurrency(totalValue),
          "Paid Value": formatCurrency(paidValue),
          "Remaining Value": formatCurrency(totalValue - paidValue),
          "Payment Terms Count": project.terminPembayaran.length,
          "Paid Terms": project.terminPembayaran.filter(term => term.status === 'Sudah Dibayar').length,
          "Description": project.keterangan,
          "Created At": new Date(project.createdAt).toLocaleDateString('id-ID'),
          "Updated At": new Date(project.updatedAt).toLocaleDateString('id-ID')
        });
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 5 },   // No
        { wch: 15 },  // Project Code
        { wch: 30 },  // Project Name
        { wch: 15 },  // Project Type
        { wch: 20 },  // PKS/PO Number
        { wch: 25 },  // Vendor
        { wch: 15 },  // Division
        { wch: 20 },  // Group
        { wch: 12 },  // PKS/PO Date
        { wch: 12 },  // BAPP Date
        { wch: 12 },  // End Date
        { wch: 20 },  // Payment Status
        { wch: 18 },  // Total Value
        { wch: 18 },  // Paid Value
        { wch: 18 },  // Remaining Value
        { wch: 15 },  // Payment Terms Count
        { wch: 12 },  // Paid Terms
        { wch: 40 },  // Description
        { wch: 12 },  // Created At
        { wch: 12 }   // Updated At
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Selected Projects");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `Selected_Finance_Projects_${selectedProjects.length}_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      // Show success message
      toast.success(`Successfully exported ${selectedProjects.length} projects to Excel`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export projects. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export function based on current filter
  const handleExportFiltered = async () => {
    try {
      setIsExporting(true);
      
      if (filteredProjects.length === 0) {
        toast.error("No projects found with current filter");
        return;
      }
      
      // Create Excel data
      const excelData: any[] = [];
      
      filteredProjects.forEach((project, index) => {
        const paymentStatus = getPaymentStatus(project.terminPembayaran);
        const totalValue = project.terminPembayaran.reduce((sum, term) => sum + term.nominal, 0);
        const paidValue = project.terminPembayaran
          .filter(term => term.status === 'Sudah Dibayar')
          .reduce((sum, term) => sum + term.nominal, 0);
        
        excelData.push({
          "No": index + 1,
          "Project Code": project.kodeProject,
          "Project Name": project.projectName,
          "Project Type": project.projectType,
          "PKS/PO Number": project.noPKSPO,
          "Vendor": project.namaVendor,
          "Division": project.divisiInisiasi,
          "Group": project.grupTerlibat,
          "PKS/PO Date": project.tanggalPKSPO,
          "BAPP Date": project.tanggalBAPP,
          "End Date": project.tanggalBerakhir,
          "Payment Status": paymentStatus.status,
          "Total Value": formatCurrency(totalValue),
          "Paid Value": formatCurrency(paidValue),
          "Remaining Value": formatCurrency(totalValue - paidValue),
          "Payment Terms Count": project.terminPembayaran.length,
          "Paid Terms": project.terminPembayaran.filter(term => term.status === 'Sudah Dibayar').length,
          "Description": project.keterangan,
          "Created At": new Date(project.createdAt).toLocaleDateString('id-ID'),
          "Updated At": new Date(project.updatedAt).toLocaleDateString('id-ID')
        });
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 5 },   // No
        { wch: 15 },  // Project Code
        { wch: 30 },  // Project Name
        { wch: 15 },  // Project Type
        { wch: 20 },  // PKS/PO Number
        { wch: 25 },  // Vendor
        { wch: 15 },  // Division
        { wch: 20 },  // Group
        { wch: 12 },  // PKS/PO Date
        { wch: 12 },  // BAPP Date
        { wch: 12 },  // End Date
        { wch: 20 },  // Payment Status
        { wch: 18 },  // Total Value
        { wch: 18 },  // Paid Value
        { wch: 18 },  // Remaining Value
        { wch: 15 },  // Payment Terms Count
        { wch: 12 },  // Paid Terms
        { wch: 40 },  // Description
        { wch: 12 },  // Created At
        { wch: 12 }   // Updated At
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Projects");

      // Generate filename with filter info and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const yearFilter = selectedYear === 'all' ? 'All_Years' : `Year_${selectedYear}`;
      const searchFilter = searchTerm ? `_Search_${searchTerm.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const filename = `Finance_Projects_${yearFilter}${searchFilter}_${filteredProjects.length}_items_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      // Show success message
      toast.success(`Successfully exported ${filteredProjects.length} projects to Excel`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export projects. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedProjects.length === 0) {
      toast.error("Please select projects to delete");
      return;
    }
    
    // Show confirmation dialog
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedProjects.length} project(s)? This action cannot be undone.`);
    
    if (confirmDelete) {
      try {
        // Remove selected projects from the list
        setProjects(prev => prev.filter(project => !selectedProjects.includes(project.id)));
        setSelectedProjects([]);
        setIsSelectionMode(false);
        toast.success(`Successfully deleted ${selectedProjects.length} project(s)`);
      } catch (error) {
        console.error('Delete error:', error);
        toast.error("Failed to delete projects. Please try again.");
      }
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
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
                    Finance Management
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Monitor and manage payment status for all projects
                  </p>
                </div>
                <div className="flex items-center gap-8">
                  {/* Status Summary */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {projects.filter(p => getPaymentStatus(p.terminPembayaran).status === 'Done').length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Completed
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {projects.filter(p => getPaymentStatus(p.terminPembayaran).status.includes('Progress')).length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      In Progress
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {projects.length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total Projects
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Search Bar and Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors min-w-[120px]"
              >
                <option value="all">All Years</option>
                {[...new Set(projects.map(project => project.tanggalPKSPO.split('-')[0]))]
                  .sort((a, b) => parseInt(b) - parseInt(a))
                  .map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
              </select>
              <button
                onClick={toggleSelectionMode}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors whitespace-nowrap shadow-md hover:shadow-lg ${
                  isSelectionMode 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isSelectionMode ? <FaTimes className="text-sm" /> : <FaCheck className="text-sm" />}
                {isSelectionMode ? 'Cancel' : 'Select'}
              </button>   
              {/* Select All button - only show when in selection mode */}
              {isSelectionMode && (
                <button
                  onClick={handleSelectAll}
                  className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
                >
                  <FaCheck className="text-sm" />
                  {selectedProjects.length === filteredProjects.length ? 'Deselect All' : 'Select All'}
                </button>
              )}    
              {/* Export Button - Only show when year filter is not "all" OR when in selection mode with selected items */}
              {(selectedYear !== 'all' || (isSelectionMode && selectedProjects.length > 0)) && (
                <button
                  onClick={isSelectionMode && selectedProjects.length > 0 ? handleExportSelected : handleExportFiltered}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
                >
                  <FaFileExcel className="text-sm" />
                  {isExporting ? 'Exporting...' : 
                    isSelectionMode && selectedProjects.length > 0 
                      ? `Export (${selectedProjects.length})` 
                      : 'Export'
                  }
                </button>
              )}
            </div>

            {/* Selection Mode Toolbar - Only Counter and Delete */}
            {isSelectionMode && selectedProjects.length > 0 && (
              <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 px-2 py-1 bg-white dark:bg-gray-800 rounded">
                  {selectedProjects.length} selected
                </span>
                
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
                >
                  <FaTrash className="text-xs" />
                  Delete
                </button>
              </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {/* Selection checkbox column - only show in selection mode */}
                      {isSelectionMode && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        PKS/PO Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Project Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status Payment
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentProjects.length === 0 ? (
                      <tr>
                        <td colSpan={isSelectionMode ? 6 : 5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          {searchTerm ? 'No projects found matching your search.' : 'No projects available.'}
                        </td>
                      </tr>
                    ) : (
                      currentProjects.map((project, index) => {
                        const paymentStatus = getPaymentStatus(project.terminPembayaran);
                        const totalValue = project.terminPembayaran.reduce((sum, term) => sum + term.nominal, 0);
                        
                        return (
                          <tr
                            key={project.id}
                            onClick={() => handleRowClick(project)}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                              isSelectionMode && selectedProjects.includes(project.id) 
                                ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20' 
                                : ''
                            }`}
                          >
                            {/* Selection checkbox column - only show in selection mode */}
                            {isSelectionMode && (
                              <td 
                                className="px-6 py-4 whitespace-nowrap"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMultipleSelect(project.id);
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedProjects.includes(project.id)}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {startIndex + index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                              {project.noPKSPO}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              <div className="font-medium">{project.projectName}</div>
                              <div className="text-gray-500 dark:text-gray-400">{project.kodeProject}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {project.namaVendor}
                            </td> 
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentStatus.color}`}>
                                {paymentStatus.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
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
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredProjects.length)} of {filteredProjects.length} projects
                        {projects.length !== filteredProjects.length && (
                          <span className="text-gray-500"> (filtered from {projects.length} total)</span>
                        )}
                      </div>
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

        {/* Project Payment Detail Modal */}
        {showDetailModal && selectedProject && (
          <ProjectPaymentDetailModal
            project={selectedProject}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedProject(null);
            }}
            onUpdate={handleUpdateProject}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
