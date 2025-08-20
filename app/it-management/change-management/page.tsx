// page.tsx
"use client";

import { JSX } from 'react'; // Import JSX
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { getStatusColor } from "@/utils/status";
import Link from 'next/link';
import * as XLSX from 'xlsx';  // npm install xlsx
import { toast } from "react-hot-toast"; // Make sure you have react-hot-toast
import { FaExclamationTriangle, FaFileExport, FaPlus, FaTimes, FaCalendarAlt, FaRocket, FaTag, FaLayerGroup, FaInfoCircle, FaSearch, FaPaperPlane, FaDownload, FaSave } from "react-icons/fa";
import { useRouter } from "next/navigation";

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



// Type to hold both name and ID
type RequesterInfo = {
    name: string;
    id: number;
};

interface User {
    id: number;
    name: string;
    username: string;
    role: string;
    division: string;
    email: string;
}

export default function ChangeManagement() {
    const [allRequests, setAllRequests] = useState<ChangeRequest[]>([]);
    const [requests, setRequests] = useState<ChangeRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<ChangeRequest[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
    const [alertRequesters, setAlertRequesters] = useState<RequesterInfo[]>([]);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [alertSubject, setAlertSubject] = useState<string>('');
    const [alertText, setAlertText] = useState<string>('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

    const router = useRouter();

    const { token, user } = useAuth();



    useEffect(() => {
        async function fetchRequests() {
            if (!token) return;

            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`${process.env.NEXT_PUBLIC_ITM_SERVICE_URL}/api/cab/requests`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error("Failed to fetch change requests.");
                }

                setAllRequests(result.data);
                setRequests(result.data);
                setFilteredRequests(result.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }

        fetchRequests();
    }, [token]);

    // Search handler
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (value === '') {
            setFilteredRequests(requests);
        } else {
            const filtered = requests.filter(request => 
                request.name.toLowerCase().includes(value.toLowerCase()) ||
                request.pic.toLowerCase().includes(value.toLowerCase()) ||
                request.rfc_number.toLowerCase().includes(value.toLowerCase()) ||
                request.project_code.toLowerCase().includes(value.toLowerCase()) ||
                request.requester_name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredRequests(filtered);
        }
    };

    useEffect(() => {
        setFilteredRequests(requests);
    }, [requests]);

    useEffect(() => {
        const replaceVariables = (template: string) => {
            const currentDate = new Date().toLocaleDateString();
            return template
                .replace(/{{currentDate}}/g, currentDate)
                .replace(/{{currentUser}}/g, user?.name || "Admin");
        };
        const loadAlertConfig = async () => {
            if (!token || !user) return;

            try {
                const [subjectResponse, textResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/api/cab/config?key=blast_email_alert_subject`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/api/cab/config?key=blast_email_alert_text`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ]);

                const subjectData = subjectResponse.ok ? await subjectResponse.json() : null;
                const textData = textResponse.ok ? await textResponse.json() : null;

                let loadedSubject = "Change Request Alert - {{currentDate}}";
                let loadedText = "Dear Team,\n\nThis is a blast alert regarding change requests.\n\nPlease review and take necessary action.\n\nBest regards,\n{{currentUser}}";

                if (subjectData?.success && subjectData.data?.length > 0) {
                    loadedSubject = subjectData.data[0].value;
                }

                if (textData?.success && textData.data?.length > 0) {
                    loadedText = textData.data[0].value;
                }

                setAlertSubject(replaceVariables(loadedSubject));
                setAlertText(replaceVariables(loadedText));

            } catch (error) {
                console.error("Error loading alert configuration:", error);
            }
        };

        loadAlertConfig();
    }, [token, user]);

    useEffect(() => {
        async function fetchUsers() {
            if (!token || !isAddUserModalOpen) return;

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_ITM_SERVICE_URL}/api/cab/users`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        setAvailableUsers(result.data);
                    }
                }
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        }

        fetchUsers();
    }, [token, isAddUserModalOpen]);



    const exportToExcel = () => {
        try {
            setIsExporting(true);
            if (filteredRequests.length === 0) {
                toast.error("No change requests to export");
                return;
            }

            const dataForExcel = filteredRequests.map(request => ({
                'Request Name': request.name,
                'RFC Number': request.rfc_number,
                'Project Code': request.project_code,
                'Type': request.type,
                'Category': request.category,
                'Urgency': request.urgency,
                'PIC': request.pic,
                'Status': request.status,
                'Requester': request.requester_name,
                'Created': new Date(request.created_at).toLocaleDateString()
            }));

            const csvContent = "data:text/csv;charset=utf-8," 
                + Object.keys(dataForExcel[0] || {}).join(",") + "\n"
                + dataForExcel.map(row => Object.values(row).map(val => `"${val}"`).join(",")).join("\n");
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `change_requests_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Change requests exported successfully!");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export change requests");
        } finally {
            setIsExporting(false);
        }
    };

    const handleAlertClick = () => {
        const uniqueRequesters = [
            ...new Map(filteredRequests.map((request) => [request.requester_id, { name: request.requester_name, id: request.requester_id }])).values(),
        ];
        setAlertRequesters(uniqueRequesters);
        setIsAlertModalOpen(true);
    };

    const handleAddRequester = (user: User) => {
        const isAlreadyAdded = alertRequesters.some(requester => requester.id === user.id);
        if (isAlreadyAdded) {
            toast.error("User is already added to the alert list.");
            return;
        }
        setAlertRequesters(prevRequesters => [
            ...prevRequesters,
            { name: user.name, id: user.id }
        ]);
        setIsAddUserModalOpen(false);
    };

    const handleSendAlerts = async () => {
        const requesterIds = alertRequesters.map(r => r.id);

        if (requesterIds.length === 0) {
            toast.error("No requesters selected for alert emails.");
            return;
        }

        const toastId = toast.loading("Sending alert emails...");

        try {
            const body: { ids: number[]; subject?: string; text?: string } = {
                ids: requesterIds
            };

            if (alertSubject.trim() !== '') {
                body.subject = alertSubject;
            }

            if (alertText.trim() !== '') {
                body.text = alertText;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_ITM_SERVICE_URL}/api/cab/users/email`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || result.message || "Failed to send alert emails.");
            }
            
            toast.success("Alert emails sent successfully!", { id: toastId, duration: 5000 });
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(`An error occurred while sending alerts: ${error.message}`, { id: toastId, duration: 5000 });
            } else {
                toast.error("An unknown error occurred while sending alerts.", { id: toastId, duration: 5000 });
            }
        } finally {
            setIsAlertModalOpen(false);
        }
    };



    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
                <Sidebar />
                <div className="flex-1 md:ml-60 p-6">   
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Change Requests Management
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Manage IT change requests with comprehensive tracking and approval workflow
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {filteredRequests.length}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Total Requests
                            </div>
                        </div>
                    </div>

                    {/* Search Bar and Actions */}
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search requests by name, PIC, RFC number, project code, or requester..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                            />
                        </div>
                        <button
                            onClick={exportToExcel}
                            disabled={isExporting || filteredRequests.length === 0}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                        >
                            <FaFileExport className="text-sm" />
                            {isExporting ? 'Exporting...' : 'Export Excel'}
                        </button>
                        <button
                            onClick={handleAlertClick}
                            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                        >
                            <FaExclamationTriangle className="text-sm" />
                            Alert
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                        >
                            <FaPlus className="text-sm" />
                            Add Request
                        </button>
                    </div>


                    {loading ? (
                        <p className="text-center text-gray-500 dark:text-gray-300">Loading...</p>
                    ) : error ? (
                        <p className="text-red-500 text-center">{error}</p>
                    ) : (
                        <ChangeRequestList requests={filteredRequests} />
                    )}
                </div>
            </div>

            {isAlertModalOpen && (
                <AlertModal
                    isOpen={isAlertModalOpen}
                    onClose={() => setIsAlertModalOpen(false)}
                    alertRequesters={alertRequesters}
                    setAlertRequesters={setAlertRequesters}
                    setIsAddUserModalOpen={setIsAddUserModalOpen}
                    alertSubject={alertSubject}
                    setAlertSubject={setAlertSubject}
                    alertText={alertText}
                    setAlertText={setAlertText}
                    handleSendAlerts={handleSendAlerts}
                />
            )}

            {isAddUserModalOpen && (
                <AddUserModal
                    isOpen={isAddUserModalOpen}
                    onClose={() => setIsAddUserModalOpen(false)}
                    availableUsers={availableUsers}
                    handleAddRequester={handleAddRequester}
                    loading={loading}
                    error={error}
                />
            )}

            {isCreateModalOpen && (
                <CreateRequestModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        window.location.reload();
                    }}
                    token={token}
                />
            )}
        </ProtectedRoute>
    );
}



function ChangeRequestList({ requests }: { requests: ChangeRequest[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Increased gap */}
            {requests.length === 0 ? (
                <p className="col-span-full text-center text-gray-500 dark:text-gray-400">No change requests found.</p>
            ) : (
                requests.map((request) => (
                    <ChangeRequestCard key={request.id} request={request} />
                ))
            )}
        </div>
    );
}

function ChangeRequestCard({ request }: { request: ChangeRequest }) {
  const statusColor = getStatusColor(request.status);

  const formatDateForDisplay = (dateIsoString: string | null): string => {
    if (!dateIsoString) return "N/A";
    const date = new Date(dateIsoString);
    if (isNaN(date.getTime())) {
        return "N/A";
    }
    return date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
  };

  const getUrgencyStyles = (urgency: string | null): { badge: string; iconColor: string } => {
    switch (urgency?.toLowerCase()) {
      case 'emergency':
        return { badge: 'bg-red-700 text-red-100', iconColor: 'text-red-600' };
      case 'high':
        return { badge: 'bg-red-600 text-red-100', iconColor: 'text-red-400' };
      case 'medium':
        return { badge: 'bg-yellow-600 text-yellow-100', iconColor: 'text-yellow-400' };
      case 'low':
        return { badge: 'bg-green-600 text-green-100', iconColor: 'text-green-400' };
      default:
        return { badge: 'bg-gray-600 text-gray-100', iconColor: 'text-gray-400' };
    }
  };

  const urgencyStyles = getUrgencyStyles(request.urgency);

  const getStatusDisplay = (status: string | null): { text: string; style: string; icon: JSX.Element } => {
    const formattedStatus = status?.replace(/_/g, " ") || "Unknown";
    const capitalizedStatus = formattedStatus.charAt(0).toUpperCase() + formattedStatus.slice(1);

    let style = "text-gray-400";
    let icon = <FaInfoCircle className={`mr-1.5 h-3.5 w-3.5 ${style}`} />;

    if (status === "success") {
        style = "text-green-400";
        icon = <FaInfoCircle className={`mr-1.5 h-3.5 w-3.5 ${style}`} />; // Or FaCheckCircle
    } else if (status === "failed") {
        style = "text-red-400";
        icon = <FaInfoCircle className={`mr-1.5 h-3.5 w-3.5 ${style}`} />; // Or FaTimesCircle
    } else if (status?.includes("waiting")) {
        style = "text-yellow-400";
        icon = <FaInfoCircle className={`mr-1.5 h-3.5 w-3.5 ${style}`} />; // Or FaHourglassHalf
    } else if (status === "draft") {
        style = "text-blue-400";
         icon = <FaInfoCircle className={`mr-1.5 h-3.5 w-3.5 ${style}`} />; // Or FaPen
    }
    return { text: capitalizedStatus, style, icon };
  };

  const statusDisplay = getStatusDisplay(request.status);

  return (
    <Link
      href={`/it-management/change-management/${request.id}`}
      className="block bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg p-5 shadow-md hover:shadow-xl transition-shadow transition-transform duration-300 ease-in-out border-l-4 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      style={{ borderColor: statusColor }}
      >
        <div className="flex flex-col h-full justify-between">
          {/* Top section: Name and basic info */}
          <div>
            <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-300 mb-3 truncate" title={request.name}>
              {request.name || "Untitled Request"}
            </h2>

            <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center">
                <FaLayerGroup className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span>Type: {request.type || "N/A"}</span>
              </div>
              <div className="flex items-center">
                <FaTag className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span>Category: {request.category || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Middle section: Dates */}
          <div className="mb-4 space-y-1.5">
             <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                <FaCalendarAlt className="mr-2 text-teal-400 flex-shrink-0" />
                <span>CAB: {formatDateForDisplay(request.cab_meeting_date)}</span>
            </div>
            {request.finished_at && (
                 <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                    <FaRocket className="mr-2 text-purple-400 flex-shrink-0" />
                    <span>Migrated: {formatDateForDisplay(request.finished_at)}</span>
                </div>
            )}
          </div>

          {/* Bottom section: Urgency and Status */}
          <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center" title={`Urgency: ${request.urgency || 'N/A'}`}>
                    <FaExclamationTriangle className={`mr-1.5 h-4 w-4 ${urgencyStyles.iconColor} flex-shrink-0`} />
                    <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold leading-tight ${urgencyStyles.badge}`}
                    >
                        {request.urgency || 'N/A'}
                    </span>
                </div>
                <div className="flex items-center" title={`Status: ${statusDisplay.text}`}>
                    {statusDisplay.icon}
                    <span className={`text-xs font-medium ${statusDisplay.style}`}>
                        {statusDisplay.text}
                    </span>
                </div>
            </div>
          </div>
        </div>
      </Link>
  );
}

// Alert Modal Component
function AlertModal({ 
    isOpen, 
    onClose, 
    alertRequesters, 
    setAlertRequesters, 
    setIsAddUserModalOpen, 
    alertSubject, 
    setAlertSubject, 
    alertText, 
    setAlertText, 
    handleSendAlerts 
}: {
    isOpen: boolean;
    onClose: () => void;
    alertRequesters: RequesterInfo[];
    setAlertRequesters: React.Dispatch<React.SetStateAction<RequesterInfo[]>>;
    setIsAddUserModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    alertSubject: string;
    setAlertSubject: React.Dispatch<React.SetStateAction<string>>;
    alertText: string;
    setAlertText: React.Dispatch<React.SetStateAction<string>>;
    handleSendAlerts: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col text-gray-900 dark:text-white">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Request Alert</h2>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleSendAlerts}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                title="Send alerts"
                            >
                                <FaPaperPlane className="w-4 h-4" />
                            </button>
                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">There are {alertRequesters.length} requesters selected.</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {alertRequesters.map(requester => (
                            <div key={requester.id} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full px-3 py-1 flex items-center">
                                {requester.name}
                                <button
                                    className="ml-2"
                                    onClick={() => {
                                        setAlertRequesters(prevRequesters => prevRequesters.filter(r => r.id !== requester.id));
                                    }}
                                >
                                    <FaTimes className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        <button 
                            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full px-3 py-1 flex items-center"
                            onClick={() => setIsAddUserModalOpen(true)}
                        >
                            +
                        </button>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Subject:</label>
                        <input
                            type="text"
                            className="block w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                            value={alertSubject}
                            onChange={(e) => setAlertSubject(e.target.value)}
                            placeholder="Enter subject"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Message:</label>
                        <textarea
                            rows={12}
                            className="block w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md resize-none"
                            value={alertText}
                            onChange={(e) => setAlertText(e.target.value)}
                            placeholder="Enter your message"
                        ></textarea>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add User Modal Component
function AddUserModal({ 
    isOpen, 
    onClose, 
    availableUsers, 
    handleAddRequester, 
    loading, 
    error 
}: {
    isOpen: boolean;
    onClose: () => void;
    availableUsers: User[];
    handleAddRequester: (user: User) => void;
    loading: boolean;
    error: string | null;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add User to Alert</h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-500 text-center">{error}</p>
                        </div>
                    ) : availableUsers.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">No users available</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Available Users ({availableUsers.length})</h3>
                            {availableUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500">{user.division} • {user.role}</div>
                                    </div>
                                    <button
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                        onClick={() => handleAddRequester(user)}
                                    >
                                        <FaPlus className="w-3 h-3" />
                                        Add
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Create Request Modal Component
interface FormDataState {
  name: string;
  group: string;
  division: string;
  type: string;
  category: string;
  urgency: string;
  requested_migration_date: string;
  project_code: string;
  rfc_number: string;
  compliance_checklist: File | null;
  procedure_checklist: File | null;
  rollback_checklist: File | null;
  architecture_diagram: File | null;
  captures: File | null;
  pic: string;
  cab_meeting_link: string;
  downtime_risk: number;
  integration_risk: number;
  uat_result: string;
  description: string;
}

function CreateRequestModal({ 
    isOpen, 
    onClose, 
    onSuccess,
    token
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    token: string | null;
}) {
    const [formData, setFormData] = useState<FormDataState>({
        name: "",
        group: "group 1",
        division: "IT",
        type: "software",
        category: "monitoring",
        urgency: "normal",
        requested_migration_date: "",
        project_code: "",
        rfc_number: "",
        compliance_checklist: null,
        procedure_checklist: null,
        rollback_checklist: null,
        architecture_diagram: null,
        captures: null,
        pic: "",
        cab_meeting_link: "",
        downtime_risk: 0,
        integration_risk: 0,
        uat_result: "none",
        description: "",
    });

    const [loading, setLoading] = useState<boolean>(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const loadingToast = toast.loading("Creating request...");

        try {
            const formDataToSend = new FormData();

            for (const key in formData) {
                if (typeof formData[key as keyof FormDataState] === 'string' || typeof formData[key as keyof FormDataState] === 'number') {
                    formDataToSend.append(key, String(formData[key as keyof FormDataState]));
                }
            }

            formDataToSend.append('compliance_checklist', formData.compliance_checklist || '');
            formDataToSend.append('procedure_checklist', formData.procedure_checklist || '');
            formDataToSend.append('rollback_checklist', formData.rollback_checklist || '');
            formDataToSend.append('architecture_diagram', formData.architecture_diagram || '');
            formDataToSend.append('captures', formData.captures || '');

            const response = await fetch(`${process.env.NEXT_PUBLIC_ITM_SERVICE_URL}/api/cab/requests`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formDataToSend,
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Failed to create change request.");
            }

            toast.dismiss(loadingToast);
            toast.success("Change request created successfully.");
            onSuccess();
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Change Request</h2>
                        <div className="flex items-center gap-1">
                            <button
                                type="submit"
                                form="change-request-form"
                                disabled={loading}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-50"
                                title="Save change request"
                            >
                                <FaSave className="w-4 h-4" />
                            </button>
                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <form id="change-request-form" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Request Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter request name"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Group <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        value={formData.group}
                                        onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                                        required
                                    >
                                        <option value="group 1">Group 1</option>
                                        <option value="group 2">Group 2</option>
                                        <option value="group 3">Group 3</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Division <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        value={formData.division}
                                        onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                                        required
                                    >
                                        <option value="IT">IT</option>
                                        <option value="ITS">ITS</option>
                                        <option value="DDB">DDB</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Request Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        required
                                    >
                                        <option value="software">Software</option>
                                        <option value="hardware">Hardware</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Request Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="monitoring">Monitoring</option>
                                        <option value="transactional">Transactional</option>
                                        <option value="regulatory">Regulatory</option>
                                        <option value="reporting">Reporting</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Urgency <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        value={formData.urgency}
                                        onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                                        required
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="emergency">Emergency</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Migration Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        value={formData.requested_migration_date}
                                        onChange={(e) => setFormData({ ...formData, requested_migration_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Project Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter project code"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        value={formData.project_code}
                                        onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        RFC Number
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter RFC number"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        value={formData.rfc_number}
                                        onChange={(e) => setFormData({ ...formData, rfc_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        PIC
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter person in charge"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        value={formData.pic}
                                        onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        CAB Meeting Link
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter CAB meeting link"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        value={formData.cab_meeting_link}
                                        onChange={(e) => setFormData({ ...formData, cab_meeting_link: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Downtime Risk <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Enter downtime risk"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        value={formData.downtime_risk}
                                        onChange={(e) => setFormData({ ...formData, downtime_risk: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Integration Risk <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        placeholder="Enter integration risk (0-10)"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        value={formData.integration_risk}
                                        onChange={(e) => setFormData({ ...formData, integration_risk: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        UAT Score
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        value={formData.uat_result}
                                        onChange={(e) => setFormData({ ...formData, uat_result: e.target.value })}
                                    >
                                        <option value="none">None</option>
                                        <option value="done with notes">Done with Notes</option>
                                        <option value="well done">Well Done</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Compliance Checklist <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="file"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        onChange={(e) => setFormData({ ...formData, compliance_checklist: e.target.files?.[0] || null })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Procedure Checklist
                                    </label>
                                    <input
                                        type="file"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        onChange={(e) => setFormData({ ...formData, procedure_checklist: e.target.files?.[0] || null })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Rollback Checklist
                                    </label>
                                    <input
                                        type="file"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        onChange={(e) => setFormData({ ...formData, rollback_checklist: e.target.files?.[0] || null })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Architecture Diagram
                                    </label>
                                    <input
                                        type="file"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        onChange={(e) => setFormData({ ...formData, architecture_diagram: e.target.files?.[0] || null })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Captures
                                    </label>
                                    <input
                                        type="file"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        onChange={(e) => setFormData({ ...formData, captures: e.target.files?.[0] || null })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        placeholder="Enter request description"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}