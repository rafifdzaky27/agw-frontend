"use client";

import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import BackButton from "@/components/BackButton";
import { FaFileAlt, FaSearch, FaFilter, FaPlus, FaEdit, FaEye } from "react-icons/fa";

export default function PolicyManagementPage() {
  const { user } = useAuth();

  // Sample policy data
  const samplePolicies = [
    {
      id: 1,
      title: "IT Security Policy",
      version: "v2.1",
      status: "Active",
      lastUpdated: "2024-06-15",
      owner: "IT Security Team",
      category: "Security"
    },
    {
      id: 2,
      title: "Data Governance Policy",
      version: "v1.3",
      status: "Under Review",
      lastUpdated: "2024-06-10",
      owner: "Data Management Team",
      category: "Data Management"
    },
    {
      id: 3,
      title: "Change Management Policy",
      version: "v3.0",
      status: "Active",
      lastUpdated: "2024-05-28",
      owner: "Change Advisory Board",
      category: "Change Management"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FaFileAlt className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Policy Management</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Manage organizational policies, procedures, and guidelines
                  </p>
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
                    placeholder="Search policies..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  <FaFilter size={16} />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                  <FaPlus size={16} />
                  New Policy
                </button>
              </div>
            </div>

            {/* Policies Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Active Policies</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Policy Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Version
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {samplePolicies.map((policy) => (
                      <tr key={policy.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {policy.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {policy.version}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(policy.status)}`}>
                            {policy.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {policy.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {policy.owner}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {policy.lastUpdated}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300">
                              <FaEye size={16} />
                            </button>
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                              <FaEdit size={16} />
                            </button>
                          </div>
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
