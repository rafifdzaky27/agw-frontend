"use client";

import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import BackButton from "@/components/BackButton";
import { FaHandshake, FaSearch, FaFilter, FaPlus, FaBuilding, FaPhone, FaEnvelope, FaEdit, FaEye, FaStar } from "react-icons/fa";

export default function VendorManagementPage() {
  const { user } = useAuth();

  // Sample vendor data
  const sampleVendors = [
    {
      id: 1,
      name: "TechCorp Solutions",
      category: "Software Development",
      contact: "John Smith",
      phone: "+62-21-1234-5678",
      email: "contact@techcorp.com",
      status: "Active",
      rating: 4.5,
      contractValue: 250000000,
      contractEnd: "2024-12-31"
    },
    {
      id: 2,
      name: "CloudServe Indonesia",
      category: "Cloud Services",
      contact: "Sarah Johnson",
      phone: "+62-21-8765-4321",
      email: "info@cloudserve.id",
      status: "Active",
      rating: 4.8,
      contractValue: 180000000,
      contractEnd: "2025-06-30"
    },
    {
      id: 3,
      name: "SecureNet Systems",
      category: "Cybersecurity",
      contact: "Mike Wilson",
      phone: "+62-21-5555-0123",
      email: "security@securenet.com",
      status: "Under Review",
      rating: 4.2,
      contractValue: 150000000,
      contractEnd: "2024-09-15"
    },
    {
      id: 4,
      name: "DataFlow Analytics",
      category: "Data Management",
      contact: "Lisa Chen",
      phone: "+62-21-9999-8888",
      email: "hello@dataflow.co.id",
      status: "Inactive",
      rating: 3.8,
      contractValue: 75000000,
      contractEnd: "2024-03-31"
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" size={12} />);
    }

    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="text-yellow-400" size={12} />);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="text-gray-300 dark:text-gray-600" size={12} />);
    }

    return stars;
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
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <FaHandshake className="text-orange-600 dark:text-orange-400" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Vendor Management</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Manage vendor relationships, contracts, and performance
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <FaBuilding className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Vendors</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <FaHandshake className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Contracts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">18</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <FaStar className="text-yellow-600 dark:text-yellow-400" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">4.3</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                    <FaHandshake className="text-red-600 dark:text-red-400" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expiring Soon</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
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
                    placeholder="Search vendors..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  <FaFilter size={16} />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                  <FaPlus size={16} />
                  Add Vendor
                </button>
              </div>
            </div>

            {/* Vendors Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Vendor Directory</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contract Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contract End
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sampleVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {vendor.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {vendor.contact}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {vendor.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center gap-1 mb-1">
                              <FaPhone size={12} className="text-gray-400" />
                              <span>{vendor.phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaEnvelope size={12} className="text-gray-400" />
                              <span>{vendor.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vendor.status)}`}>
                            {vendor.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {renderStars(vendor.rating)}
                            <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                              ({vendor.rating})
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(vendor.contractValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {vendor.contractEnd}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300">
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
