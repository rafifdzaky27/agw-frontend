"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaPlus, FaFileExport, FaExclamationTriangle, FaUser, FaProjectDiagram, FaIdCard, FaTimes, FaCalendar, FaDollarSign, FaUsers, FaChartLine, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface Portfolio {
  id: number;
  no_pks: string;
  nama_project: string;
  pic: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  budget: string;
  progress: number;
  team_size: number;
  description: string;
  objectives: string[];
  deliverables: string[];
  risks: string[];
}

// Generate 50 dummy portfolios
const generatePortfolios = (): Portfolio[] => {
  const projects = [
    "Digital Banking Platform", "Mobile Payment System", "Core Banking Upgrade", "Risk Management System",
    "Customer Portal", "Data Analytics Platform", "Security Enhancement", "API Gateway", "Cloud Migration",
    "Blockchain Integration", "AI Chatbot", "Document Management", "Fraud Detection", "Loan Processing",
    "Investment Platform", "Credit Scoring", "Regulatory Reporting", "Business Intelligence", "CRM System",
    "HR Management", "Asset Management", "Compliance Monitoring", "Audit System", "Treasury Management",
    "Trade Finance", "Foreign Exchange", "Insurance Platform", "Wealth Management", "Pension System",
    "Card Management", "ATM Network", "Branch Automation", "Call Center", "Email Marketing",
    "Social Media", "Website Redesign", "Mobile Banking", "Internet Banking", "Payment Gateway",
    "Merchant Services", "POS System", "E-wallet", "Cryptocurrency", "Robo Advisor", "Financial Planning",
    "Budget Management", "Expense Tracking", "Invoice System", "Accounting Software", "Tax Management"
  ];
  
  const names = [
    "John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson", "David Brown", "Lisa Davis", "Robert Miller",
    "Emily Taylor", "James Anderson", "Maria Garcia", "William Martinez", "Jennifer Lopez", "Michael Rodriguez",
    "Jessica Hernandez", "Christopher Lee", "Amanda Walker", "Daniel Hall", "Ashley Allen", "Matthew Young",
    "Stephanie King", "Anthony Wright", "Michelle Scott", "Joshua Green", "Kimberly Adams", "Andrew Baker"
  ];
  
  const statuses = ["Active", "In Progress", "Completed", "On Hold"];
  const priorities = ["High", "Medium", "Low"];
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    no_pks: `PKS-2024-${String(i + 1).padStart(3, '0')}`,
    nama_project: projects[i % projects.length],
    pic: names[i % names.length],
    status: statuses[i % statuses.length],
    priority: priorities[i % priorities.length],
    start_date: `2024-${String(Math.floor(i / 4) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    end_date: `2024-${String(Math.floor(i / 3) + 6).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    budget: `$${(Math.random() * 4000000 + 500000).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
    progress: Math.floor(Math.random() * 101),
    team_size: Math.floor(Math.random() * 20) + 3,
    description: `Comprehensive ${projects[i % projects.length].toLowerCase()} solution to enhance business operations and customer experience.`,
    objectives: ["Improve efficiency", "Reduce costs", "Enhance security"],
    deliverables: ["System Implementation", "Documentation", "Training", "Support"],
    risks: ["Budget constraints", "Timeline delays", "Technical challenges"]
  }));
};

export default function PortfolioManagement() {
  const [allPortfolios] = useState<Portfolio[]>(generatePortfolios());
  const [filteredPortfolios, setFilteredPortfolios] = useState<Portfolio[]>(allPortfolios);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredPortfolios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPortfolios = filteredPortfolios.slice(startIndex, endIndex);
  
  // Filter and search effect
  useEffect(() => {
    let filtered = allPortfolios;
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.nama_project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.no_pks.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.pic.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    if (priorityFilter) {
      filtered = filtered.filter(p => p.priority === priorityFilter);
    }
    
    setFilteredPortfolios(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, allPortfolios]);
  
  const [portfolios] = useState<Portfolio[]>([
  ]);

  const [selectedProject, setSelectedProject] = useState<Portfolio | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddPortfolio = () => {
    console.log("Add Portfolio clicked");
  };

  const handleExport = () => {
    console.log("Export clicked");
  };

  const handleAlert = () => {
    console.log("Alert clicked");
  };

  const handleRowClick = (portfolio: Portfolio) => {
    setSelectedProject(portfolio);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex">
        <Sidebar />
        <div className="flex-1 md:ml-60 p-6">
          <h1 className="text-3xl font-bold mb-6 text-center text-black dark:text-white">
            Portfolio Management
          </h1>
          
          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border-2 border-gray-300 dark:border-gray-600">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects, PKS number, or PIC..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
              <select
                className="px-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <select
                className="px-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            <div className="flex items-end space-x-4 mb-1">
              <button
                className="w-36 h-[42px] px-3 bg-blue-500 text-white rounded flex items-center justify-center space-x-2 hover:bg-blue-700 transition duration-200 font-medium"
                onClick={handleAddPortfolio}
              >
                <FaPlus className="text-sm" />
                <span className="text-sm">Add Portfolio</span>
              </button>
              <button 
                className="w-24 h-[42px] px-3 bg-green-500 text-white rounded flex items-center justify-center space-x-2 hover:bg-green-700 transition duration-200 font-medium" 
                onClick={handleExport}
              >
                <FaFileExport className="text-sm" />
                <span className="text-sm">Export</span>
              </button>
              <button 
                className="w-24 h-[42px] px-3 bg-yellow-500 text-white rounded flex items-center justify-center space-x-2 hover:bg-yellow-700 transition duration-200 font-medium" 
                onClick={handleAlert}
              >
                <FaExclamationTriangle className="text-sm" />
                <span className="text-sm">Alert</span>
              </button>
            </div>
          </div>

          {/* Portfolio Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <FaIdCard className="text-blue-500 text-xs" />
                        No PKS
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <FaProjectDiagram className="text-green-500 text-xs" />
                        Project Name
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <FaUser className="text-purple-500 text-xs" />
                        PIC
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentPortfolios.map((portfolio, index) => (
                    <tr 
                      key={portfolio.id} 
                      className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer group"
                      onClick={() => handleRowClick(portfolio)}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-6 w-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-2">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-300">{startIndex + index + 1}</span>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-900 dark:text-white">{portfolio.no_pks}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{portfolio.start_date}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              {portfolio.nama_project}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                portfolio.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' :
                                portfolio.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {portfolio.priority}
                              </span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ml-1 ${
                                portfolio.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' :
                                portfolio.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                                  portfolio.status === 'Active' ? 'bg-green-500' :
                                  portfolio.status === 'In Progress' ? 'bg-blue-500' :
                                  'bg-gray-500'
                                }`}></div>
                                {portfolio.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900 dark:text-white">{portfolio.pic}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredPortfolios.length)}</span> of <span className="font-medium">{filteredPortfolios.length}</span> results
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-500 text-sm"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-500"
                    >
                      <FaChevronLeft className="text-sm" />
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
                      {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-500"
                    >
                      <FaChevronRight className="text-sm" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-500 text-sm"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Detail Modal */}
          {isModalOpen && selectedProject && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedProject.nama_project}</h2>
                      <p className="text-blue-100 mt-1">{selectedProject.no_pks}</p>
                    </div>
                    <button 
                      onClick={closeModal}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <FaTimes className="text-xl" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Project Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FaUser className="text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Project Manager</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{selectedProject.pic}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FaDollarSign className="text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Budget</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{selectedProject.budget}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FaUsers className="text-purple-600 dark:text-purple-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Team Size</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{selectedProject.team_size} members</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline and Progress */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <FaCalendar className="text-gray-600 dark:text-gray-400" />
                        Timeline
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Start Date:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedProject.start_date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-300">End Date:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedProject.end_date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <FaChartLine className="text-gray-600 dark:text-gray-400" />
                        Progress
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Completion:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedProject.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${selectedProject.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedProject.description}</p>
                  </div>

                  {/* Objectives, Deliverables, Risks */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Objectives</h3>
                      <ul className="space-y-2">
                        {selectedProject.objectives.map((objective, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Deliverables</h3>
                      <ul className="space-y-2">
                        {selectedProject.deliverables.map((deliverable, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{deliverable}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Risks</h3>
                      <ul className="space-y-2">
                        {selectedProject.risks.map((risk, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}