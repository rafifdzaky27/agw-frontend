"use client";

import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import BackButton from "@/components/BackButton";
import { FaDollarSign, FaSearch, FaFilter, FaPlus, FaChartLine, FaWallet, FaCreditCard, FaFileInvoiceDollar } from "react-icons/fa";

export default function FinanceManagementPage() {
  const { user } = useAuth();

  // Sample budget data
  const budgetData = [
    {
      id: 1,
      category: "Infrastructure",
      allocated: 500000,
      spent: 325000,
      remaining: 175000,
      percentage: 65
    },
    {
      id: 2,
      category: "Software Licenses",
      allocated: 200000,
      spent: 180000,
      remaining: 20000,
      percentage: 90
    },
    {
      id: 3,
      category: "Cloud Services",
      allocated: 150000,
      spent: 95000,
      remaining: 55000,
      percentage: 63
    },
    {
      id: 4,
      category: "Security",
      allocated: 100000,
      spent: 45000,
      remaining: 55000,
      percentage: 45
    }
  ];

  // Sample expense data
  const recentExpenses = [
    {
      id: 1,
      description: "AWS Cloud Services - Monthly",
      amount: 15000,
      date: "2024-07-01",
      category: "Cloud Services",
      status: "Approved"
    },
    {
      id: 2,
      description: "Microsoft Office 365 Licenses",
      amount: 25000,
      date: "2024-06-28",
      category: "Software Licenses",
      status: "Pending"
    },
    {
      id: 3,
      description: "Network Equipment Purchase",
      amount: 75000,
      date: "2024-06-25",
      category: "Infrastructure",
      status: "Approved"
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
      case 'Approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getBudgetColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
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
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <FaDollarSign className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Finance Management</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Manage IT budgets, expenses, and financial planning
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <FaWallet className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Budget</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(950000)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                    <FaCreditCard className="text-red-600 dark:text-red-400" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(645000)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <FaChartLine className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(305000)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <FaFileInvoiceDollar className="text-purple-600 dark:text-purple-400" size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Approvals</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">5</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Allocation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Budget Allocation by Category</h2>
              <div className="space-y-4">
                {budgetData.map((budget) => (
                  <div key={budget.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {budget.category}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.allocated)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getBudgetColor(budget.percentage)}`}
                          style={{ width: `${budget.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>{budget.percentage}% used</span>
                        <span>{formatCurrency(budget.remaining)} remaining</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  <FaFilter size={16} />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  <FaPlus size={16} />
                  New Expense
                </button>
              </div>
            </div>

            {/* Recent Expenses */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Recent Expenses</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {recentExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {expense.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {expense.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {expense.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                            {expense.status}
                          </span>
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
