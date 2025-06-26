"use client";

import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaClipboardCheck, FaExchangeAlt, FaTasks, FaCalendarAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

// Define interfaces for API responses
interface ChangeRequest {
  id: number;
  name: string;
  type: string;
  category: string;
  urgency: string;
  requested_migration_date: string;
  actual_migration_date: string | null;
  created_at: string;
  finished_at: string | null;
  status: string;
  cab_meeting_date: string | null;
  downtime_risk: number;
  requester_id: number;
  approver_id: number | null;
  requester_name: string;
  approver_name: string | null;
  group: string;
  division: string;
  project_code: string;
  rfc_number: string;
  pic: string;
}

interface AuditFinding {
  id: string;
  kategoriAudit: string;
  namaTemuan: string;
  penyebab: string;
  rekomendasi: string;
  komitmenTindakLanjut: string;
  batasAkhirKomitmen: string;
  pic: string;
  status: string;
}

interface GovernanceTask {
  id: string;
  namaTugas: string;
  catatan: string;
  tanggal: string;
  pic: string;
  status: string;
}

// Define interfaces for the dashboard data
interface DashboardStats {
  changeManagement: {
    total: number;
    waitingApproval: number;
    waitingFinalization: number;
    waitingMigration: number;
    completed: number;
    failed: number;
    urgentCount: number;
    upcomingMigrations: {
      id: string;
      name: string;
      date: string;
      status: string;
    }[];
  };
  auditFindings: {
    total: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    overdueCount: number;
    upcomingDeadlines: {
      id: string;
      name: string;
      deadline: string;
      status: string;
    }[];
  };
  governanceTasks: {
    total: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    overdueCount: number;
    upcomingTasks: {
      id: string;
      name: string;
      deadline: string;
      status: string;
    }[];
  };
}

export default function Dashboard() {
  const { user, token } = useAuth(); // Fetch user and token from AuthContext
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Get API URL from environment variable - moved inside useEffect to avoid hydration issues
  const BACKEND_IP = process.env.NEXT_PUBLIC_BACKEND_IP || "http://localhost:8080";

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-200 text-gray-800';
    const lowerCaseStatus = status.trim().toLowerCase();
    switch (lowerCaseStatus) {
      case 'waiting_approval':
      case 'waiting_ops_vdh_approval':
      case 'waiting_dev_vdh_approval':
      case 'waiting_finalization':
      case 'waiting_migration':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'success':
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'in_progress':
      case 'on progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'not_started':
      case 'not yet':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
    }
  };

  // Helper function to format status for display
  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Check if a date is overdue
  const isOverdue = (dateString: string): boolean => {
    if (!dateString) return false;
    const deadline = new Date(dateString);
    if (isNaN(deadline.getTime())) return false; // Invalid date check

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison
    return deadline < today;
  };

  useEffect(() => {
    // Define API_BASE_URL inside useEffect to avoid hydration issues
    const API_BASE_URL = `${BACKEND_IP}/api`;
    
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel with error handling for each request
        let changeRequestsData: ChangeRequest[] = [];
        let auditFindingsData: AuditFinding[] = [];
        let governanceTasksData: GovernanceTask[] = [];
        
        try {
          const changeRequestsResponse = await fetch(`${API_BASE_URL}/requests`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (changeRequestsResponse.ok) {
            const result = await changeRequestsResponse.json();
            if (result.success) {
              changeRequestsData = result.data || [];
            } else {
              console.error('Failed to fetch change requests: API returned success=false');
            }
          } else {
            console.error('Failed to fetch change requests:', changeRequestsResponse.status);
          }
        } catch (err) {
          console.error('Error fetching change requests:', err);
        }
        
        try {
          const auditFindingsResponse = await fetch(`${API_BASE_URL}/findings`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (auditFindingsResponse.ok) {
            const data = await auditFindingsResponse.json();
            if (Array.isArray(data)) {
              auditFindingsData = data;
            } else {
              console.error('Failed to fetch audit findings: API response was not an array.');
            }
          } else {
            console.error('Failed to fetch audit findings:', auditFindingsResponse.status);
          }
        } catch (err) {
          console.error('Error fetching audit findings:', err);
        }
        
        try {
          const governanceTasksResponse = await fetch(`${API_BASE_URL}/governance-tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (governanceTasksResponse.ok) {
            const data = await governanceTasksResponse.json();
            if (Array.isArray(data)) {
              governanceTasksData = data;
            } else {
              console.error('Failed to fetch governance tasks: API response was not an array.');
            }
          } else {
            console.error('Failed to fetch governance tasks:', governanceTasksResponse.status);
          }
        } catch (err) {
          console.error('Error fetching governance tasks:', err);
        }

        // If all requests failed, show an error but continue with empty data
        if (changeRequestsData.length === 0 && auditFindingsData.length === 0 && governanceTasksData.length === 0) {
          setError('Unable to fetch data from the backend. Please check your connection or try again later.');
        }
        
        // Use the data we were able to fetch
        const changeRequests = changeRequestsData;
        const auditFindings = auditFindingsData;
        const governanceTasks = governanceTasksData;

        // Process change management data
        const waitingApprovalRequests = changeRequests.filter(req => 
          ['waiting_approval', 'waiting_ops_vdh_approval', 'waiting_dev_vdh_approval'].includes(req.status.trim().toLowerCase())
        );
        const waitingFinalizationRequests = changeRequests.filter(req => 
          req.status.trim().toLowerCase() === 'waiting_finalization'
        );
        const waitingMigrationRequests = changeRequests.filter(req => 
          req.status.trim().toLowerCase() === 'waiting_migration'
        );
        const completedRequests = changeRequests.filter(req => 
          ['completed', 'success'].includes(req.status.trim().toLowerCase())
        );
        const failedRequests = changeRequests.filter(req => 
          ['failed', 'rejected'].includes(req.status.trim().toLowerCase())
        );
        // Urgent requests are those with high or urgent urgency level
        const urgentRequests = changeRequests.filter(req => 
          req.urgency && req.urgency.trim().toLowerCase() === 'emergency'
        );
        
        // Sort upcoming migrations by date
        const upcomingMigrations = changeRequests
          .filter(req => !['completed', 'success', 'failed', 'rejected'].includes(req.status.trim().toLowerCase()))
          .filter(req => req.requested_migration_date && new Date(req.requested_migration_date) >= new Date())
          .sort((a, b) => new Date(a.requested_migration_date).getTime() - new Date(b.requested_migration_date).getTime())
          .slice(0, 3) // Get only the 3 most recent
          .map(req => ({
            id: req.id.toString(),
            name: req.name,
            date: req.requested_migration_date,
            status: req.status
          }));

        // Process audit findings data
        const notStartedFindings = auditFindings.filter(finding => ['not started', 'not yet'].includes(finding.status.trim().toLowerCase()));
        const inProgressFindings = auditFindings.filter(finding => ['in progress', 'on progress'].includes(finding.status.trim().toLowerCase()));
        const completedFindings = auditFindings.filter(finding => ['completed', 'done'].includes(finding.status.trim().toLowerCase()));
        const overdueFindings = auditFindings.filter(finding => 
          !['completed', 'done'].includes(finding.status.trim().toLowerCase()) && isOverdue(finding.batasAkhirKomitmen)
        );
        
        // Sort upcoming deadlines by date
        const upcomingDeadlines = auditFindings
          .filter(finding => {
            const status = String(finding.status || '').trim().toLowerCase();
            return ['not started', 'not yet', 'in progress', 'on progress'].includes(status);
          })
          .sort((a, b) => new Date(a.batasAkhirKomitmen).getTime() - new Date(b.batasAkhirKomitmen).getTime())
          .slice(0, 3) // Get only the 3 most recent
          .map(finding => ({
            id: finding.id,
            name: finding.namaTemuan,
            deadline: finding.batasAkhirKomitmen,
            status: finding.status
          }));

        // Process governance tasks data
        const notStartedTasks = governanceTasks.filter(task => ['not started', 'not yet'].includes(task.status.trim().toLowerCase()));
        const inProgressTasks = governanceTasks.filter(task => ['in progress', 'on progress'].includes(task.status.trim().toLowerCase()));
        const completedTasks = governanceTasks.filter(task => ['completed', 'done'].includes(task.status.trim().toLowerCase()));
        const overdueTasks = governanceTasks.filter(task => 
          !['completed', 'done'].includes(task.status.trim().toLowerCase()) && isOverdue(task.tanggal)
        );
        
        // Sort upcoming tasks by date
        const upcomingTasks = governanceTasks
          .filter(task => {
            const status = String(task.status || '').trim().toLowerCase();
            return ['not started', 'not yet', 'in progress', 'on progress'].includes(status);
          })
          .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
          .slice(0, 3) // Get only the 3 most recent
          .map(task => ({
            id: task.id,
            name: task.namaTugas,
            deadline: task.tanggal,
            status: task.status
          }));

        // Construct dashboard stats object
        const stats: DashboardStats = {
          changeManagement: {
            total: changeRequests.length,
            waitingApproval: waitingApprovalRequests.length,
            waitingFinalization: waitingFinalizationRequests.length,
            waitingMigration: waitingMigrationRequests.length,
            completed: completedRequests.length,
            failed: failedRequests.length,
            urgentCount: urgentRequests.length,
            upcomingMigrations
          },
          auditFindings: {
            total: auditFindings.length,
            notStarted: notStartedFindings.length,
            inProgress: inProgressFindings.length,
            completed: completedFindings.length,
            overdueCount: overdueFindings.length,
            upcomingDeadlines
          },
          governanceTasks: {
            total: governanceTasks.length,
            notStarted: notStartedTasks.length,
            inProgress: inProgressTasks.length,
            completed: completedTasks.length,
            overdueCount: overdueTasks.length,
            upcomingTasks
          }
        };

        setDashboardStats(stats);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setError('An unexpected error occurred while fetching dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    if (token) { // Only fetch data if token is available
      fetchDashboardData();
    } else {
      // Handle case where token is not yet available or user is not logged in
      setLoading(false);
    }
  }, [token, BACKEND_IP, router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white flex">
        <Sidebar />
        <div className="flex-1 md:ml-60 p-6">
          <div className="flex flex-col items-center justify-center mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center">Architecture & Governance Dashboard</h1>

            {/* Consolidated Dashboard Overview Card */}
            <div className="w-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
              <h2 className="text-2xl font-semibold mb-6 text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-700 pb-2">
                Architecture & Governance Overview
              </h2>
              
              {loading ? (
                <div className="space-y-6">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ) : error ? (
                <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/30 dark:border-red-800 rounded-lg text-center">
                  <p className="text-red-700 dark:text-red-300 mb-2">{error}</p>
                  <button 
                    onClick={() => router.refresh()} 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Change Management Section */}
                  <div className="border dark:border-gray-700 rounded-lg p-4 flex flex-col h-full">
                    <div className="flex-grow">
                      <div className="flex items-center mb-4">
                        <FaExchangeAlt className="text-blue-500 text-xl mr-2" />
                        <h3 className="text-lg font-semibold">Change Management</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
                          <p className="text-2xl font-bold">{dashboardStats?.changeManagement.total}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Urgent</p>
                          <p className="text-2xl font-bold">{dashboardStats?.changeManagement.urgentCount}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Waiting Approval</span>
                          <span className="font-medium">{dashboardStats?.changeManagement.waitingApproval}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Waiting Finalization</span>
                          <span className="font-medium">{dashboardStats?.changeManagement.waitingFinalization}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Waiting Migration</span>
                          <span className="font-medium">{dashboardStats?.changeManagement.waitingMigration}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Completed</span>
                          <span className="font-medium">{dashboardStats?.changeManagement.completed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Failed</span>
                          <span className="font-medium">{dashboardStats?.changeManagement.failed}</span>
                        </div>
                      </div>
                      
                      <h4 className="font-medium mt-6 mb-2 text-sm text-gray-600 dark:text-gray-400">Upcoming Migrations</h4>
                      <div className="space-y-2">
                        {dashboardStats?.changeManagement.upcomingMigrations && dashboardStats.changeManagement.upcomingMigrations.length > 0 ? (
                          dashboardStats.changeManagement.upcomingMigrations.map((migration) => (
                            <div key={migration.id} className="grid grid-cols-[1fr_120px_auto] items-center gap-x-2 text-sm border-b border-gray-100 dark:border-gray-700 pb-1">
                              <span className="truncate">{migration.name}</span>
                              <div className="flex justify-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(migration.status)}`}>
                                  {formatStatus(migration.status)}
                                </span>
                              </div>
                              <span className="whitespace-nowrap text-right">{formatDate(migration.date)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">No upcoming migrations</div>
                        )}
                      </div>
                      
                    </div>
                    <div className="mt-4 text-center">
                      <Link href="/change-management" className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                        View all change requests →
                      </Link>
                    </div>
                  </div>
                  
                  {/* Governance Tasks Section */}
                  <div className="border dark:border-gray-700 rounded-lg p-4 flex flex-col h-full">
                    <div className="flex-grow">
                      <div className="flex items-center mb-4">
                        <FaTasks className="text-purple-500 text-xl mr-2" />
                        <h3 className="text-lg font-semibold">Governance Tasks</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
                          <p className="text-2xl font-bold">{dashboardStats?.governanceTasks.total}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                          <p className="text-2xl font-bold">{dashboardStats?.governanceTasks.overdueCount}</p>
                        </div>
                      </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Not Started</span>
                        <span className="font-medium">{dashboardStats?.governanceTasks.notStarted}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>In Progress</span>
                        <span className="font-medium">{dashboardStats?.governanceTasks.inProgress}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Completed</span>
                        <span className="font-medium">{dashboardStats?.governanceTasks.completed}</span>
                      </div>
                    </div>
                    
                    <h4 className="font-medium mt-20 mb-2 text-sm text-gray-600 dark:text-gray-400">Upcoming Tasks</h4>
                    <div className="space-y-2">
                      {dashboardStats?.governanceTasks.upcomingTasks && dashboardStats.governanceTasks.upcomingTasks.length > 0 ? (
                        dashboardStats.governanceTasks.upcomingTasks.map((task) => (
                          <div key={task.id} className="grid grid-cols-[1fr_120px_auto] items-center gap-x-2 text-sm border-b border-gray-100 dark:border-gray-700 pb-1">
                            <span className="truncate">{task.name}</span>
                            <div className="flex justify-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
                                {formatStatus(task.status)}
                              </span>
                            </div>
                            <span className="whitespace-nowrap text-right">{formatDate(task.deadline)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">No upcoming tasks</div>
                      )}
                    </div>
                    
                    </div>
                    <div className="mt-4 text-center">
                      <Link href="/governance-tasks" className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                        View all governance tasks →
                      </Link>
                    </div>
                  </div>

                  {/* Audit Findings Section */}
                  <div className="border dark:border-gray-700 rounded-lg p-4 flex flex-col h-full">
                    <div className="flex-grow">
                      <div className="flex items-center mb-4">
                        <FaClipboardCheck className="text-green-500 text-xl mr-2" />
                        <h3 className="text-lg font-semibold">Audit Findings</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Findings</p>
                          <p className="text-2xl font-bold">{dashboardStats?.auditFindings.total}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                          <p className="text-2xl font-bold">{dashboardStats?.auditFindings.overdueCount}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Not Started</span>
                          <span className="font-medium">{dashboardStats?.auditFindings.notStarted}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>In Progress</span>
                          <span className="font-medium">{dashboardStats?.auditFindings.inProgress}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Completed</span>
                          <span className="font-medium">{dashboardStats?.auditFindings.completed}</span>
                        </div>
                      </div>
                      
                      <h4 className="font-medium mt-20 mb-2 text-sm text-gray-600 dark:text-gray-400">Upcoming Deadlines</h4>
                      <div className="space-y-2">
                        {dashboardStats?.auditFindings.upcomingDeadlines && dashboardStats.auditFindings.upcomingDeadlines.length > 0 ? (
                          dashboardStats.auditFindings.upcomingDeadlines.map((finding) => (
                            <div key={finding.id} className="grid grid-cols-[1fr_120px_auto] items-center gap-x-2 text-sm border-b border-gray-100 dark:border-gray-700 pb-1">
                              <span className="truncate">{finding.name}</span>
                              <div className="flex justify-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(finding.status)}`}>
                                  {formatStatus(finding.status)}
                                </span>
                              </div>
                              <span className="whitespace-nowrap text-right">{formatDate(finding.deadline)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">No upcoming deadlines</div>
                        )}
                      </div>
                      
                    </div>
                    <div className="mt-4 text-center">
                      <Link href="/audit-findings" className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                        View all audit findings →
                      </Link>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Recent Activity and Quick Links */}
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
