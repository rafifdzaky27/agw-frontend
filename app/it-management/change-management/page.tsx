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
import { FaExclamationTriangle, FaFileExport, FaPlus, FaTimes, FaCalendarAlt, FaRocket, FaTag, FaLayerGroup, FaInfoCircle } from "react-icons/fa";
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

type StatusOption = { value: string; label: string };

const statusOptions: StatusOption[] = [
    { value: "draft", label: "Draft" },
    { value: "waiting_approval", label: "Waiting Approval" },
    { value: "waiting_finalization", label: "Waiting Finalization" },
    { value: "waiting_ops_vdh_approval", label: "Waiting OPS VDH Approval" },
    { value: "waiting_dev_vdh_approval", label: "Waiting DEV VDH Approval" },
    { value: "waiting_migration", label: "Waiting Migration" },
    { value: "success", label: "Success" },
    { value: "failed", label: "Failed" },
];

type SortOption = { value: string; label: string };

const sortOptions: SortOption[] = [
    { value: "status", label: "Status" },
    { value: "created_at", label: "Created At" },
];

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
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [timeReference, setTimeReference] = useState<"CAB" | "Migration">("CAB");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]); // Use array of strings for status values
    const [sortBy, setSortBy] = useState<string>("created_at");
    const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
    const [alertRequesters, setAlertRequesters] = useState<RequesterInfo[]>([]); // Store both name and ID
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [alertSubject, setAlertSubject] = useState<string>(''); // State for subject
    const [alertText, setAlertText] = useState<string>(''); // State for text
    const router = useRouter();

    const { token, user } = useAuth();

    useEffect(() => {
        const replaceVariables = (template: string) => {
            const currentDate = new Date().toLocaleDateString();
            return template
                .replace(/{{currentDate}}/g, currentDate)  // Global replacement for all occurrences
                .replace(/{{currentUser}}/g, user?.name || "Admin")
                ;
          };
        const loadAlertConfig = async () => {
          if (!token || !user) return; // also check for user, since we use user variable

          try {
              const [subjectResponse, textResponse] = await Promise.all([
                  fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/api/config?key=blast_email_alert_subject`, {
                      method: "GET",
                      headers: {
                          Authorization: `Bearer ${token}`,
                      },
                  }),
                  fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/api/config?key=blast_email_alert_text`, {
                      method: "GET",
                      headers: {
                          Authorization: `Bearer ${token}`,
                      },
                  }),
              ]);

              if (!subjectResponse.ok || !textResponse.ok) {
                  throw new Error("Failed to load alert configuration");
              }

              const subjectData = await subjectResponse.json();
              const textData = await textResponse.json();

              let loadedSubject = "";
              let loadedText = "";

              if (subjectData.success && subjectData.data && subjectData.data.length > 0) {
                  loadedSubject = subjectData.data[0].value;
              } else {
                  console.warn("blast_email_alert_subject not found, using default");
                  loadedSubject = "Placeholder Subject"; // Default subject if not found
              }

              if (textData.success && textData.data && textData.data.length > 0) {
                  loadedText = textData.data[0].value;
              } else {
                  console.warn("blast_email_alert_text not found, using default");
                  loadedText = "Placeholder Text"; // Default text if not found
              }

              // Replace variables after loading
              setAlertSubject(replaceVariables(loadedSubject ));
              setAlertText(replaceVariables(loadedText));

          } catch (error: unknown) {
              console.error("Error loading alert configuration:", error);
              if (error instanceof Error) {
                  toast.error(`Error loading alert configuration: ${error.message}`);
              } else {
                  toast.error("Error loading alert configuration: Unknown error");
              }
          }
      };

        loadAlertConfig();
    }, [token, user]); // Added user as a dependency

    useEffect(() => {
        async function fetchRequests() {
            if (!token) return;

            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/api/requests`, {
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
                setRequests(result.data); // Initialize requests with all data
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }

        fetchRequests();
    }, [token]);

    useEffect(() => {
        const applyFilters = () => {
            let filtered = [...allRequests];

            // Time Reference Filtering
            if (timeReference === "CAB") {
                filtered = filtered.filter(request => {
                    const createdAt = new Date(request.created_at);
                    const start = startDate ? new Date(startDate) : null;
                    const end = endDate ? new Date(endDate) : null;

                    if (start) {
                        start.setHours(0, 0, 0, 0);
                        if (createdAt < start) return false;
                    }
                    if (end) {
                        end.setHours(23, 59, 59, 999);
                        if (createdAt > end) return false;
                    }
                    return true;
                });
            } else if (timeReference === "Migration") {
                filtered = filtered.filter(request => {
                    if (request.status !== "success" && request.status !== "failed") return false;
                    if (!request.finished_at) return false;

                    const finishedAt = new Date(request.finished_at);
                    const start = startDate ? new Date(startDate) : null;
                    const end = endDate ? new Date(endDate) : null;

                    if (start) {
                        start.setHours(0, 0, 0, 0);
                        if (finishedAt < start) return false;
                    }
                    if (end) {
                        end.setHours(23, 59, 59, 999);
                        if (finishedAt > end) return false;
                    }

                    return true;
                });
            }

            // Status Filtering
            if (selectedStatuses.length > 0) {
                filtered = filtered.filter(request => selectedStatuses.includes(request.status));
            }

            // Sorting
            if (sortBy === "status") {
                filtered.sort((a, b) => a.status.localeCompare(b.status));
            } else if (sortBy === "created_at") {
                filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            }

            setRequests(filtered);
        };
        // Apply filters whenever filter criteria change
        applyFilters();
    }, [timeReference, startDate, endDate, selectedStatuses, sortBy, allRequests]);

    useEffect(() => {
        async function fetchUsers() {
            if (!token) return;

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/api/users`, {
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
                if (result.success) {
                    setAvailableUsers(result.data);
                } else {
                    console.error("Failed to fetch users:", result.error || result.message);
                    toast.error("Failed to fetch users");
                }
            } catch (err) {
                console.error("Error fetching users:", err);
                toast.error("Error fetching users");
            }
        }

        if (isAddUserModalOpen) {
            fetchUsers();
        }
    }, [token, isAddUserModalOpen]);

    const handleStatusChange = (statusValue: string) => {
        setSelectedStatuses(prevStatuses => {
            if (prevStatuses.includes(statusValue)) {
                return prevStatuses.filter(s => s !== statusValue); // Unselect
            } else {
                return [...prevStatuses, statusValue]; // Select
            }
        });
    };

    const handleSelectAllStatuses = () => {
        setSelectedStatuses(statusOptions.map(option => option.value));
    };

    const handleClearAllStatuses = () => {
        setSelectedStatuses([]);
    };

    const formatUTCStringToInput = (utcString: string | null) => {
        if (!utcString) return "N/A"; // Handle null case
        const [datePart, timePart] = utcString.split('T');
        const [time] = timePart.split('.'); // remove .000Z
        const date_string = `${datePart}T${time}`;
        return new Date(date_string).toLocaleString();
    };

    const exportToExcel = () => {
        const toastId = toast.loading("Exporting change requests...");
        try {
            if (requests.length === 0) {
                toast.error("No change requests to export based on current filter", { id: toastId, duration: 1500 });
                return;
            }

            const dataForExcel = requests.map(request => ({
                ID: request.id,
                Name: request.name,
                Migration: request.finished_at ? "Yes" : "No",
                Type: request.type,
                Category: request.category,
                CAB_Meeting_Date: formatUTCStringToInput(request.cab_meeting_date),
                Requested_Migration_Date: formatUTCStringToInput(request.requested_migration_date),
                Project_Code: request.project_code,
                RFC_Number: request.rfc_number,
                Requester_Name: request.requester_name,
                Approver_Name: request.approver_name,
                Downtime: request.downtime_risk,
                Time: "",
                PIC: request.pic
            }));

            const ws = XLSX.utils.json_to_sheet(dataForExcel);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Change Requests");
            XLSX.writeFile(wb, "CAB_Report.xlsx");

            toast.success("Change requests exported successfully", { id: toastId, duration: 1500 });
        } catch {
            toast.error("Failed to export change requests", { id: toastId, duration: 1500 });
        }
    };

    const sendAlertEmail = async (requesterIds: number[], subject: string | null, text: string | null) => {
        try {
            const body: { ids: number[]; subject?: string; text?: string } = {
                ids: requesterIds
            };

            if (subject !== null && subject.trim() !== '') {
                body.subject = subject;
            }

            if (text !== null && text.trim() !== '') {
                body.text = text;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/api/users/email`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                console.error("Email error:", result);
                throw new Error(result.error || result.message || "Failed to send alert emails.");
            }
            return true;
        } catch (error: unknown) {
            console.error("Error sending emails:", error);
            throw error;
        }
    };

    const handleAlertClick = () => {
        const uniqueRequesters = [
            ...new Map(requests.map((request) => [request.requester_id, { name: request.requester_name, id: request.requester_id }])).values(),
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
            await sendAlertEmail(requesterIds, alertSubject, alertText);
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

    const selectedStatusCount = selectedStatuses.length;
    const statusText = selectedStatusCount === 0 ? "All Status" : `${selectedStatusCount} Selected`;

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
                                {allRequests.length}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Total Requests
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-stretch gap-4">
                            <div className="flex flex-wrap items-end gap-2 sm:gap-4">
                                <button
                                    className="flex-1 sm:flex-none sm:w-36 h-[42px] px-4 bg-blue-500 text-white rounded flex items-center justify-center space-x-2 hover:bg-blue-700 transition duration-200 font-medium"
                                    onClick={() => router.push("/it-management/change-management/change-request-form")}
                                >
                                    <FaPlus className="text-sm" />
                                    <span className="text-sm">Add Request</span>
                                </button>
                                <button className="flex-1 sm:flex-none sm:w-28 h-[42px] px-4 bg-green-500 text-white rounded flex items-center justify-center space-x-2 hover:bg-green-700 transition duration-200 font-medium" onClick={exportToExcel}>
                                    <FaFileExport className="text-sm" />
                                    <span className="text-sm">Export</span>
                                </button>
                                <button className="flex-1 sm:flex-none sm:w-28 h-[42px] px-4 bg-yellow-500 text-white rounded flex items-center justify-center space-x-2 hover:bg-yellow-700 transition duration-200 font-medium" onClick={handleAlertClick}>
                                    <FaExclamationTriangle className="text-sm" />
                                    <span className="text-sm">Alert</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-stretch gap-2 sm:gap-4">
                                <div className="flex flex-col justify-start">
                                    <label htmlFor="timeReference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference:</label>
                                    <select
                                        id="timeReference"
                                        className="block w-full h-[42px] p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white shadow-sm"
                                        value={timeReference}
                                        onChange={(e) => setTimeReference(e.target.value as "CAB" | "Migration")}
                                    >
                                        <option value="CAB">CAB</option>
                                        <option value="Migration">Migration</option>
                                    </select>
                                </div>

                                <div className="flex flex-col justify-start">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date:</label>
                                    <input
                                        type="date"
                                        className="block w-full h-[42px] p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white shadow-sm"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        placeholder="Select start date"
                                        title="Select start date"
                                    />
                                </div>

                                <div className="flex flex-col justify-start">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date:</label>
                                    <input
                                        type="date"
                                        className="block w-full h-[42px] p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white shadow-sm"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        placeholder="Select end date"
                                        title="Select end date"
                                    />
                                </div>

                                <div className="flex flex-col justify-start relative">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status:</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            className="block w-full h-[42px] p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white shadow-sm text-left outline-none min-w-[120px]"
                                            onClick={() => setIsStatusModalOpen(true)}
                                        >
                                            <span className="block truncate">{statusText}</span>
                                        </button>
                                    </div>

                                    {isStatusModalOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsStatusModalOpen(false)}></div>
                                            <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden w-56">
                                                <div className="py-1">
                                                    {statusOptions.map((option) => (
                                                        <label key={option.value} className="px-4 py-2 flex items-center text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                className="form-checkbox h-5 w-5 text-blue-500 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 focus:border-blue-500 mr-2"
                                                                value={option.value}
                                                                checked={selectedStatuses.includes(option.value)}
                                                                onChange={() => handleStatusChange(option.value)}
                                                            />
                                                            <span>{option.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-600 flex justify-between border-t border-gray-200 dark:border-gray-500">
                                                    <button
                                                        type="button"
                                                        className="text-sm text-gray-600 dark:text-gray-200 hover:text-black dark:hover:text-white"
                                                        onClick={handleClearAllStatuses}
                                                    >
                                                        Clear
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-sm text-gray-600 dark:text-gray-200 hover:text-black dark:hover:text-white"
                                                        onClick={handleSelectAllStatuses}
                                                    >
                                                        Select All
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex flex-col justify-start col-span-2 sm:col-span-1">
                                    <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By:</label>
                                    <select
                                        id="sortBy"
                                        className="block w-full h-[42px] p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white shadow-sm"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        {sortOptions.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>


                    {loading ? (
                        <p className="text-center text-gray-500 dark:text-gray-300">Loading...</p>
                    ) : error ? (
                        <p className="text-red-500 text-center">{error}</p>
                    ) : (
                        <ChangeRequestList requests={requests} />
                    )}
                </div>
            </div>
            {isAlertModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col text-gray-900 dark:text-white">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between flex-shrink-0">
                            <h2 className="text-lg font-bold">Request Alert</h2>
                            <button onClick={() => setIsAlertModalOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 focus:outline-none" title="Close Alert Modal">
                                <FaTimes className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">There are {alertRequesters.length} requesters selected.</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {alertRequesters.map(requester => (
                                    <div key={requester.id} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full px-3 py-1 flex items-center">
                                        {requester.name}
                                        <button
                                            className="ml-2 focus:outline-none"
                                            title="Remove requester"
                                            onClick={() => {
                                                setAlertRequesters(prevRequesters => prevRequesters.filter(r => r.id !== requester.id));
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}

                                <button className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full px-3 py-1 flex items-center focus:outline-none"
                                    onClick={() => {
                                        setIsAddUserModalOpen(true);
                                    }}>
                                    +
                                </button>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="alertSubject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject:</label>
                                <input
                                    type="text"
                                    id="alertSubject"
                                    className="block w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white outline-none"
                                    value={alertSubject}
                                    onChange={(e) => setAlertSubject(e.target.value)}
                                    placeholder="Enter subject"
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="alertText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message:</label>
                                <textarea
                                    id="alertText"
                                    rows={12}
                                    className="block w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white outline-none resize-none"
                                    value={alertText}
                                    onChange={(e) => setAlertText(e.target.value)}
                                    placeholder="Enter your message"
                                ></textarea>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row justify-end gap-2 flex-shrink-0">
                            <button
                                className="w-full sm:w-auto bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200"
                                onClick={() => setIsAlertModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="w-full sm:w-auto bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
                                onClick={handleSendAlerts}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAddUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg overflow-hidden p-4 w-full max-w-md text-gray-900 dark:text-white">
                        <h2 className="text-lg font-bold mb-4 text-center">Add User</h2>
                        {loading ? (
                            <p className="text-center text-gray-500 dark:text-gray-300">Loading users...</p>
                        ) : error ? (
                            <p className="text-red-500 text-center">{error}</p>
                        ) : (
                            <div className="max-h-60 overflow-y-auto">
                                {availableUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between py-2 px-4 border-b border-gray-200 dark:border-gray-700">
                                        <span>{user.name}</span>
                                        <button
                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-200"
                                            onClick={() => handleAddRequester(user)}
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4">
                            <button
                                type="button"
                                className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition duration-200"
                                onClick={() => setIsAddUserModalOpen(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
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
      href={`/change-management/${request.id}`}
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