"use client";

import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import BackButton from "@/components/BackButton";
import { FaDatabase, FaSearch, FaFilter, FaPlus } from "react-icons/fa";

export default function AuditUniversePage() {
  const { user } = useAuth();

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
                  <FaDatabase className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Audit Universe</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Comprehensive database of all auditable entities and processes
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
                    placeholder="Search audit universe..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  <FaFilter size={16} />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                  <FaPlus size={16} />
                  Add Entity
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="text-center py-12">
                <FaDatabase className="mx-auto text-gray-400 mb-4" size={64} />
                <h3 className="text-xl font-semibold mb-2">Audit Universe Coming Soon</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  This module will contain a comprehensive database of all auditable entities, 
                  processes, and systems within the organization.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      Business Processes
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Map and categorize all business processes
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      IT Systems
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Inventory of all IT systems and applications
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      Risk Areas
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Identify and assess risk areas for auditing
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
