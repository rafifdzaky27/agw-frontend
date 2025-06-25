"use client";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useState } from 'react';

// Define interfaces for the data structures
interface RequestStats {
  totalRequests: number;
  requestsByStatus: { status: string; count: number }[];
}

interface Migration {
  id: string;
  name: string;
  status: string;
  submittedBy: string;
  submittedDate: string;
}

// Mock data (replace with actual API calls)
const mockRequestStats: RequestStats = {
  totalRequests: 125,
  requestsByStatus: [
    { status: "Pending", count: 30 },
    { status: "Approved", count: 75 },
    { status: "Rejected", count: 10 },
    { status: "In Progress", count: 5 },
    { status: "Completed", count: 5 },
  ],
};

const mockMigrationList: Migration[] = [
  { id: "MIG001", name: "Database Schema Update", status: "Approved", submittedBy: "Alice", submittedDate: "2023-10-26" },
  { id: "MIG002", name: "API Endpoint V2 Deployment", status: "Pending", submittedBy: "Bob", submittedDate: "2023-10-27" },
  { id: "MIG003", name: "Frontend UI Refresh", status: "In Progress", submittedBy: "Charlie", submittedDate: "2023-10-28" },
  { id: "MIG004", name: "Security Patch Q4", status: "Rejected", submittedBy: "David", submittedDate: "2023-10-29" },
  { id: "MIG005", name: "User Authentication Module Upgrade", status: "Completed", submittedBy: "Eve", submittedDate: "2023-10-25" },
];


export default function Dashboard() {
  const { user, token } = useAuth(); // Fetch user and token from AuthContext

  const [requestStats, setRequestStats] = useState<RequestStats | null>(null);
  const [migrationList, setMigrationList] = useState<Migration[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMigrations, setLoadingMigrations] = useState(true);

  useEffect(() => {
    // Simulate API call for request stats
    const fetchRequestStats = async () => {
      setLoadingStats(true);
      // In a real application, you would fetch this data from an API:
      // try {
      //   const response = await fetch('/api/dashboard/stats', { headers: { 'Authorization': `Bearer ${token}` } });
      //   if (!response.ok) throw new Error('Failed to fetch stats');
      //   const data = await response.json();
      //   setRequestStats(data);
      // } catch (error) {
      //   console.error("Error fetching request stats:", error);
      //   // Handle error appropriately
      // } finally {
      //   setLoadingStats(false);
      // }
      setTimeout(() => { // Simulate network delay
        setRequestStats(mockRequestStats);
        setLoadingStats(false);
      }, 1000);
    };

    // Simulate API call for migration list
    const fetchMigrationList = async () => {
      setLoadingMigrations(true);
      // In a real application, you would fetch this data from an API:
      // try {
      //   const response = await fetch('/api/dashboard/migrations', { headers: { 'Authorization': `Bearer ${token}` } });
      //   if (!response.ok) throw new Error('Failed to fetch migrations');
      //   const data = await response.json();
      //   setMigrationList(data);
      // } catch (error) {
      //   console.error("Error fetching migration list:", error);
      //   // Handle error appropriately
      // } finally {
      //   setLoadingMigrations(false);
      // }
      setTimeout(() => { // Simulate network delay
        setMigrationList(mockMigrationList);
        setLoadingMigrations(false);
      }, 1500);
    };

    if (token) { // Only fetch data if token is available
        fetchRequestStats();
        fetchMigrationList();
    } else {
        // Handle case where token is not yet available or user is not logged in
        setLoadingStats(false);
        setLoadingMigrations(false);
    }
  }, [token]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center">Dashboard</h1>

            {/* Dashboard Graphics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-8">
              {/* Number of Requests Card */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
                <h2 className="text-xl font-semibold mb-3 text-blue-600 dark:text-blue-400">Total Requests</h2>
                {loadingStats ? <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div> : <p className="text-5xl font-bold">{requestStats?.totalRequests}</p>}
              </div>

              {/* Requests by Status */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg md:col-span-2 transform hover:scale-105 transition-transform duration-300">
                <h2 className="text-xl font-semibold mb-4 text-green-600 dark:text-green-400">Requests by Status</h2>
                {loadingStats ? (
                    <>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </>
                ) : (
                  <div className="space-y-3">
                    {requestStats?.requestsByStatus.map(item => (
                      <div key={item.status} className="mb-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.status}</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div
                            className="bg-green-500 h-2.5 rounded-full"
                            style={{ width: `${(item.count / (requestStats?.totalRequests || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Migration List Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full mb-8">
              <h2 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">Active Migrations</h2>
              {loadingMigrations ? (
                <div className="space-y-2">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted By</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {migrationList.length > 0 ? migrationList.map(mig => (
                        <tr key={mig.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{mig.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{mig.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              mig.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              mig.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              mig.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              mig.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100' // Completed or other
                            }`}>
                              {mig.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{mig.submittedBy}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{mig.submittedDate}</td>
                        </tr>
                      )) : (
                        <tr>
                            <td colSpan={5} className="text-center py-4 text-gray-400 dark:text-gray-500">No migrations to display.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Additional Dashboard Elements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-yellow-600 dark:text-yellow-400">Recent Activity</h2>
                    {/* Placeholder for recent activity feed */}
                    <ul className="space-y-3">
                        <li className="text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">User 'admin' approved Change Request #CR123. <span className="text-xs text-gray-400 dark:text-gray-500 float-right">2 hours ago</span></li>
                        <li className="text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">New Change Request #CR126 submitted by 'dev_user'. <span className="text-xs text-gray-400 dark:text-gray-500 float-right">1 day ago</span></li>
                        <li className="text-sm text-gray-500 dark:text-gray-400">Migration 'MIG003' status updated to 'In Progress'. <span className="text-xs text-gray-400 dark:text-gray-500 float-right">3 days ago</span></li>
                    </ul>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-indigo-600 dark:text-indigo-400">Quick Links</h2>
                    <ul className="space-y-2">
                        <li><a href="/change-management/new" className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-500 dark:hover:text-blue-300 transition-colors">Submit New Change Request</a></li>
                        <li><a href="/admin-config/users" className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-500 dark:hover:text-blue-300 transition-colors">Manage Users</a></li>
                        <li><a href="/reports" className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-500 dark:hover:text-blue-300 transition-colors">View System Reports</a></li>
                        <li><a href="/profile" className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-500 dark:hover:text-blue-300 transition-colors">My Profile</a></li>
                    </ul>
                </div>
            </div>

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
