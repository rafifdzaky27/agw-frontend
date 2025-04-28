"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { getStatusColor } from "@/utils/status";
import Link from 'next/link';
import * as XLSX from 'xlsx';  // npm install xlsx
import { toast } from "react-hot-toast"; // Make sure you have react-hot-toast
import { FaExclamationTriangle, FaFileExport, FaPlus, FaTimes } from "react-icons/fa";
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

    const replaceVariables = (template: string) => {
      const currentDate = new Date().toLocaleDateString();
      return template
          .replace(/{{currentDate}}/g, currentDate)  // Global replacement for all occurrences
          .replace(/{{currentUser}}/g, user?.name || "Admin")
          ;
    };

    useEffect(() => {
      const loadAlertConfig = async () => {
          if (!token || !user) return; // also check for user, since we use user variable
  
          try {
              const [subjectResponse, textResponse] = await Promise.all([
                  fetch(`http://localhost:8080/api/config?key=blast_email_alert_subject`, {
                      method: "GET",
                      headers: {
                          Authorization: `Bearer ${token}`,
                      },
                  }),
                  fetch(`http://localhost:8080/api/config?key=blast_email_alert_text`, {
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
  
          } catch (error: any) {
              console.error("Error loading alert configuration:", error);
              toast.error(`Error loading alert configuration: ${error.message}`);
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

                const response = await fetch("http://localhost:8080/api/requests", {
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
        // Apply filters whenever filter criteria change
        applyFilters();
    }, [timeReference, startDate, endDate, selectedStatuses, sortBy, allRequests]);

    useEffect(() => {
        async function fetchUsers() {
            if (!token) return;

            try {
                const response = await fetch("http://localhost:8080/api/users", {
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
                Requester_Name: request.requester_name, // Assuming you will fill this later
                Approver_Name: request.approver_name, // Assuming you will fill this later
                Downtime: request.downtime_risk, // Assuming you will calculate this later
                Time: "",
                PIC: request.pic
            }));

            const ws = XLSX.utils.json_to_sheet(dataForExcel);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Change Requests");
            XLSX.writeFile(wb, "CAB_Report.xlsx");

            toast.success("Change requests exported successfully", { id: toastId, duration: 1500 });
        } catch (error) {
            toast.error("Failed to export change requests", { id: toastId, duration: 1500 });
        }
    };

    const sendAlertEmail = async (requesterIds: number[], subject: string | null, text: string | null) => {
        try {
            const body: any = {
                ids: requesterIds // Send the IDs in the request body
            };

            if (subject !== null && subject.trim() !== '') {
                body.subject = subject; // Include the subject if not null
            }

            if (text !== null && text.trim() !== '') {
                body.text = text; // Include the text if not null
            }

            const response = await fetch("http://localhost:8080/api/users/email", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json", // Important: Tell the server you're sending JSON
                },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                console.error("Email error:", result); // Log the entire response for debugging
                throw new Error(result.error || result.message || "Failed to send alert emails.");
            }
            return true;
        } catch (error: any) {
            console.error("Error sending emails:", error);
            throw error; // Re-throw to be caught by the caller
        }
    };

    const handleAlertClick = () => {
        // Store both name and ID
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
        setIsAddUserModalOpen(false); // Close the modal after adding
    };

    const handleSendAlerts = async () => {
        const requesterIds = alertRequesters.map(r => r.id);

        if (requesterIds.length === 0) {
            toast.error("No requesters selected for alert emails.");
            return;
        }

        const toastId = toast.loading("Sending alert emails...");

        try {
            // Send all emails at once
            await sendAlertEmail(requesterIds, alertSubject, alertText);
            toast.success("Alert emails sent successfully!", { id: toastId, duration: 5000 });

        } catch (error: any) {
            toast.error(`An error occurred while sending alerts: ${error.message}`, { id: toastId, duration: 5000 });
        } finally {
            setIsAlertModalOpen(false); // Close the modal after attempting to send alerts
        }
    };

    const selectedStatusCount = selectedStatuses.length;
    const statusText = selectedStatusCount === 0 ? "None Selected" : `${selectedStatusCount} Selected`;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-900 text-white">
                <Navbar />
                <div className="container mx-auto p-6">
                    <h1 className="text-3xl font-bold mb-6 text-center">
                        Change Requests Management
                    </h1>

                    <div className="bg-gray-800 rounded-lg p-4 mb-4"> {/* Card styling applied here */}
                        <div className="flex justify-between items-stretch">
                            <div className="flex items-stretch space-x-4">
                                {/* Add Request Button (Left) */}
                                <button
                                    className="px-4 py-2 bg-blue-500 rounded flex items-center space-x-2 hover:bg-blue-700 transition duration-200"
                                    onClick={() => router.push("/change-request-form")}
                                    >
                                    <FaPlus />
                                    <span>Add Request</span>
                                </button>
                                {/* Export Button */}
                                <button className="px-4 py-2 bg-green-500 rounded flex items-center space-x-2 hover:bg-green-700 transition duration-200" onClick={exportToExcel}>
                                    <FaFileExport />
                                    <span>Export</span>
                                </button>
                                {/* Alert Button */}
                                <button className="px-4 py-2 bg-yellow-500 rounded flex items-center space-x-2 hover:bg-yellow-700 transition duration-200" onClick={handleAlertClick}>
                                    <FaExclamationTriangle />
                                    <span>Alert</span>
                                </button>
                            </div>

                            {/* Filters and Export (Right) */}
                            <div className="flex items-stretch space-x-4">
                                {/* Time Reference */}
                                <div className="flex flex-col justify-start">
                                    <label htmlFor="timeReference" className="block text-sm font-medium text-gray-300 h-1/2">Reference:</label>
                                    <select
                                        id="timeReference"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={timeReference}
                                        onChange={(e) => setTimeReference(e.target.value as "CAB" | "Migration")}
                                    >
                                        <option value="CAB">CAB</option>
                                        <option value="Migration">Migration</option>
                                    </select>
                                </div>

                                {/* Start Date */}
                                <div className="flex flex-col justify-start">
                                    <label className="block text-sm font-medium text-gray-300 h-1/2">Start Date:</label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        placeholder="Select start date"
                                        title="Select start date"
                                    />
                                </div>

                                {/* End Date */}
                                <div className="flex flex-col justify-start">
                                    <label className="block text-sm font-medium text-gray-300 h-1/2">End Date:</label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        placeholder="Select end date"
                                        title="Select end date"
                                    />
                                </div>

                                {/* Status Filter (Modal) */}
                                <div className="flex flex-col justify-start relative">
                                    <label className="block text-sm font-medium text-gray-300 h-1/2">Status:</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                            onClick={() => setIsStatusModalOpen(true)}
                                            style={{ width: '250px' }} // Increased Width
                                        >
                                            {statusText}
                                        </button>
                                    </div>

                                    {/* Status Modal (Dropdown Style) */}
                                    {isStatusModalOpen && (
                                        <div className="absolute left-0 top-full mt-1 z-10 bg-gray-800 border border-gray-600 rounded shadow-lg overflow-hidden" style={{ width: '250px' }}>
                                            <div className="py-1">
                                                {statusOptions.map((option) => (
                                                    <label key={option.value} className="px-4 py-2 flex items-center text-gray-300 hover:bg-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            className="form-checkbox h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 mr-2"
                                                            value={option.value}
                                                            checked={selectedStatuses.includes(option.value)}
                                                            onChange={() => handleStatusChange(option.value)}
                                                        />
                                                        <span>{option.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="px-4 py-2 bg-gray-700 flex justify-between">
                                                <button
                                                    type="button"
                                                    className="text-sm text-gray-300 hover:text-white"
                                                    onClick={handleClearAllStatuses}
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    type="button"
                                                    className="text-sm text-gray-300 hover:text-white"
                                                    onClick={handleSelectAllStatuses}
                                                >
                                                    Select All
                                                </button>
                                            </div>
                                            <div className="px-4 py-2 bg-gray-700">
                                                <button
                                                    type="button"
                                                    className="w-full text-sm text-gray-300 hover:text-white"
                                                    onClick={() => setIsStatusModalOpen(false)}
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sort By */}
                                <div className="flex flex-col justify-start">
                                    <label htmlFor="sortBy" className="block text-sm font-medium text-gray-300 h-1/2">Sort By:</label>
                                    <select
                                        id="sortBy"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
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
                        <p className="text-center text-gray-300">Loading...</p>
                    ) : error ? (
                        <p className="text-red-500 text-center">{error}</p>
                    ) : (
                        <ChangeRequestList requests={requests} />
                    )}
                </div>
            </div>
            {/* Alert Modal (Alert Style) */}
            {isAlertModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-gray-800 border border-gray-600 rounded shadow-lg overflow-hidden w-full max-w-2xl">
                        {/* Header Section */}
                        <div className="p-4 border-b border-gray-600 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-300">Request Alert</h2>
                            <button onClick={() => setIsAlertModalOpen(false)} className="text-gray-400 hover:text-gray-300 focus:outline-none" title="Close Alert Modal">
                                <FaTimes className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Content Section */}
                        <div className="p-6">
                            <p className="text-gray-400 mb-4">There are {alertRequesters.length} requesters selected.</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {/* Display Requester Names */}
                                {alertRequesters.map(requester => (
                                    <div key={requester.id} className="bg-gray-700 text-gray-300 rounded-full px-3 py-1 flex items-center">
                                        {requester.name}
                                        <button
                                            className="ml-2 focus:outline-none"
                                            title="Remove requester"
                                            onClick={() => {
                                                // Remove requester from the alertRequesters state
                                                setAlertRequesters(prevRequesters => prevRequesters.filter(r => r.id !== requester.id));
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}

                                <button className="bg-gray-700 text-gray-300 rounded-full px-3 py-1 flex items-center focus:outline-none"
                                    onClick={() => {
                                        setIsAddUserModalOpen(true);
                                    }}>
                                    +
                                </button>
                            </div>

                            {/* Subject Text Box */}
                            <div className="mb-4 flex flex-col">
                                <label htmlFor="alertSubject" className="block text-sm font-medium text-gray-300">Subject:</label>
                                <input
                                    type="text"
                                    id="alertSubject"
                                    className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-300"
                                    value={alertSubject}
                                    onChange={(e) => setAlertSubject(e.target.value)}
                                    placeholder="Enter subject"
                                />
                            </div>

                            {/* Text Text Box */}
                            <div className="mb-4 flex flex-col">
                                <label htmlFor="alertText" className="block text-sm font-medium text-gray-300">Message:</label>
                                <textarea
                                    id="alertText"
                                    rows={18} // Increased rows for more height
                                    className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-300"
                                    value={alertText}
                                    onChange={(e) => setAlertText(e.target.value)}
                                    placeholder="Enter your message"
                                ></textarea>
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="p-4 border-t border-gray-600 flex justify-end gap-2">
                            <button
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                                onClick={() => setIsAlertModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                                onClick={handleSendAlerts}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {isAddUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-gray-800 border border-gray-600 rounded shadow-lg overflow-hidden p-4 w-full max-w-md">
                        <h2 className="text-lg font-bold text-gray-300 mb-4 text-center">Add User</h2>
                        {loading ? (
                            <p className="text-center text-gray-300">Loading users...</p>
                        ) : error ? (
                            <p className="text-red-500 text-center">{error}</p>
                        ) : (
                            <div className="max-h-60 overflow-y-auto">
                                {availableUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between py-2 px-4 border-b border-gray-700">
                                        <span className="text-gray-300">{user.name}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.length === 0 ? (
                <p className="text-center text-gray-400">No change requests found.</p>
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

  const formatUTCStringToInput = (utcString: string | null) => {
    if (!utcString) return "N/A"; // Handle null case
    const [datePart, timePart] = utcString.split('T');
    const [time] = timePart.split('.'); // remove .000Z
    const date_string = `${datePart}T${time}`;
    return new Date(date_string).toLocaleString();
};

  return (
    <Link href={`/change-management/${request.id}`} key={request.id}>
      <div
        className="bg-gray-800 hover:bg-gray-700 cursor-pointer rounded-lg p-4 transition duration-200 border-l-8"
        style={{ borderColor: statusColor }}
      >
        <h2 className="text-xl font-semibold mb-2">{request.name}</h2>
        <p className="text-gray-300">Type: {request.type}</p>
        <p className="text-gray-300">Category: {request.category}</p>
        <p className="text-gray-300">Urgency: {request.urgency}</p>
        <p className="text-gray-300">
          Creation Date: {formatUTCStringToInput(request.created_at)}
        </p>
        <p className="text-gray-300">
          Requested Date: {formatUTCStringToInput(request.requested_migration_date)}
        </p>
        <p className="text-gray-300">
          Migration Date: {formatUTCStringToInput(request.finished_at)}
        </p>
        <div className="mt-2">
          <span className="text-gray-400">
            {request.status?.replace("_", " ")}
          </span>
        </div>
      </div>
    </Link>
  );
}