"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaSearch, FaMoneyBillWave, FaCheckCircle, FaClock } from "react-icons/fa";
import ProjectPaymentDetailModal from "./components/ProjectPaymentDetailModal";
import toast from "react-hot-toast";

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Generate mock data based on Portfolio Management structure
  const generateMockProjects = (): Project[] => {
    const projects: Project[] = [];
    const projectNames = [
      "Sistem Informasi Manajemen Keuangan", "Platform E-Commerce B2B", "Aplikasi Mobile Banking",
      "Dashboard Analytics Real-time", "Sistem Inventory Management", "Portal Customer Service",
      "Aplikasi HR Management System", "Platform Digital Marketing", "Sistem Document Management",
      "Aplikasi Project Management", "Portal Vendor Management", "Sistem CRM Terintegrasi",
      "Platform Learning Management", "Aplikasi Quality Control", "Sistem Asset Management"
    ];

    const vendors = [
      "PT Teknologi Maju Indonesia", "CV Digital Solutions", "PT Inovasi Sistem Terpadu",
      "PT Solusi IT Nusantara", "CV Kreasi Digital", "PT Mitra Teknologi Global"
    ];

    const divisions = ["IT", "Finance", "Operations", "HR", "Marketing", "Procurement"];
    const groups = ["Development Team", "Infrastructure Team", "Security Team", "Analytics Team"];

    for (let i = 1; i <= 15; i++) {
      const numTerms = Math.floor(Math.random() * 4) + 2; // 2-5 payment terms
      const terms: PaymentTerm[] = [];
      
      // Determine project type once per project
      const projectType = Math.random() > 0.6 ? 'procurement' : 'non procurement';
      const isNonProcurement = projectType === 'non procurement';
      
      for (let j = 1; j <= numTerms; j++) {
        const baseAmount = 100000000 + (Math.random() * 500000000); // 100M - 600M
        const status = Math.random() > 0.6 ? 'Sudah Dibayar' : 
                     Math.random() > 0.3 ? 'Checking Umum' : 'Belum Dibayar';
        
        terms.push({
          id: `term_${i}_${j}`,
          termin: isNonProcurement ? `Bill ${j}` : `Termin ${j}`,
          nominal: Math.floor(baseAmount),
          description: isNonProcurement ? 
            (j === 1 ? "Initial billing for project setup" : 
             j === 2 ? "Development milestone billing" :
             j === 3 ? "Final delivery billing" : "Maintenance billing") :
            (j === 1 ? "BA/PS, Proplan" : 
             j === 2 ? "Delivery & Testing" :
             j === 3 ? "Go Live & Training" : "Maintenance & Support"),
          status: status,
          paymentDate: status === 'Sudah Dibayar' ? 
            new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0] : 
            undefined,
          budget: status === 'Sudah Dibayar' ? (Math.random() > 0.5 ? 'Capex' : 'Opex') : undefined,
          notes: status === 'Sudah Dibayar' ? (isNonProcurement ? 'Billing completed successfully' : 'Payment completed successfully') : ''
        });
      }

      const createdDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      
      projects.push({
        id: i.toString(),
        kodeProject: `PRJ-${i.toString().padStart(3, '0')}`,
        projectName: projectNames[Math.floor(Math.random() * projectNames.length)],
        projectType: projectType,
        divisiInisiasi: divisions[Math.floor(Math.random() * divisions.length)],
        grupTerlibat: groups[Math.floor(Math.random() * groups.length)],
        keterangan: `Project implementation for ${projectNames[Math.floor(Math.random() * projectNames.length)].toLowerCase()}`,
        namaVendor: vendors[Math.floor(Math.random() * vendors.length)],
        noPKSPO: `PKS/${i.toString().padStart(3, '0')}/2024`,
        tanggalPKSPO: createdDate.toISOString().split('T')[0],
        tanggalBAPP: new Date(createdDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        tanggalBerakhir: new Date(createdDate.getTime() + (365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        terminPembayaran: terms,
        createdAt: createdDate.toISOString(),
        updatedAt: createdDate.toISOString()
      });
    }
    
    return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const mockProjects = generateMockProjects();

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call to get projects from Portfolio Management
      setTimeout(() => {
        setProjects(mockProjects);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError("Failed to fetch projects");
      setLoading(false);
      toast.error("Failed to load projects");
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
    if (!searchTerm) return projects;
    
    return projects.filter(project =>
      project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.noPKSPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.namaVendor.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

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
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  // Update project payment terms
  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    toast.success("Payment information updated successfully");
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

            {/* Search - Direct without card wrapper */}
            <div className="relative w-full mb-6">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
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
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
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
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {startIndex + index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
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
