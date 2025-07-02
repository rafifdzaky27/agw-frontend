"use client";

import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import BackButton from "@/components/BackButton";
import { FaTasks, FaSearch, FaFilter, FaPlus, FaUser, FaClock, FaExclamationTriangle } from "react-icons/fa";

export default function ITManagementWorkloadPage() {
  const { user } = useAuth();

  // Sample workload data
  const sampleWorkloads = [
    {
      id: 1,
      title: "Server Infrastructure Upgrade",
      assignee: "John Doe",
      priority: "High",
      status: "In Progress",
      dueDate: "2024-07-15",
      progress: 65,
      category: "Infrastructure"
    },
    {
      id: 2,
      title: "Network Security Assessment",
      assignee: "Jane Smith",
      priority: "Critical",
      status: "Pending",
      dueDate: "2024-07-10",
      progress: 25,
      category: "Security"
    },
    {
      id: 3,
      title: "Database Performance Optimization",
      assignee: "Mike Johnson",
      priority: "Medium",
      status: "Completed",
      dueDate: "2024-06-30",
      progress: 100,
      category: "Database"
    },
    {
      id: 4,
      title: "Cloud Migration Planning",
      assignee: "Sarah Wilson",
      priority: "High",
      status: "In Progress",
      dueDate: "2024-07-20",
      progress: 40,
      category: "Cloud"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'On Hold':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
        <Sidebar />
        <div className="flex-1 md:ml-60 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <BackButton />
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FaTasks className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">IT Management Workload</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Track and manage IT team workloads and assignments
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <FaTasks className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <FaClock className="text-yellow-600 dark:text-yellow-400" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                    <FaExclamationTriangle className="text-red-600 dark:text-red-400" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <FaUser className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Team Members</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search workloads..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  <FaFilter size={16} />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <FaPlus size={16} />
                  New Task
                </button>
              </div>
            </div>

            {/* Workload Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Current Workloads</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Assignee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Category
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sampleWorkloads.map((workload) => (
                      <tr key={workload.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {workload.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {workload.assignee}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(workload.priority)}`}>
                            {workload.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(workload.status)}`}>
                            {workload.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${workload.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{workload.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {workload.dueDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {workload.category}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
