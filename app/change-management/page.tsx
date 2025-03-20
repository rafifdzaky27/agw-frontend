"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { getStatusColor } from "@/utils/status";
import Link from 'next/link';
import * as XLSX from 'xlsx';  // npm install xlsx
import { toast } from "react-hot-toast"; // Make sure you have react-hot-toast
import { FaFileExport, FaPlus } from "react-icons/fa";

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
}

type StatusOption = { value: string; label: string };

const statusOptions: StatusOption[] = [
  { value: "draft", label: "Draft" },
  { value: "waiting_approval", label: "Waiting Approval" },
  { value: "waiting_finalization", label: "Waiting Finalization" },
  { value: "waiting_migration", label: "Waiting Migration" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
];

type SortOption = { value: string; label: string };

const sortOptions: SortOption[] = [
  { value: "status", label: "Status" },
  { value: "created_at", label: "Created At" },
];

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

  const { token } = useAuth();

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
        CAB_Meeting_Date: request.cab_meeting_date ? new Date(request.cab_meeting_date).toLocaleString() : "N/A",
        Requested_Migration_Date: new Date(request.requested_migration_date).toLocaleString(),
        Project_Code: "",
        RFC_Number: "",
        Requester_Name: request.requester_name, // Assuming you will fill this later
        Approver_Name: request.approver_name, // Assuming you will fill this later
        Downtime: request.downtime_risk, // Assuming you will calculate this later
        Time: "",
        PIC: ""
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
                <button className="px-4 py-2 bg-blue-500 rounded flex items-center space-x-2 hover:bg-blue-700 transition duration-200" onClick={() => window.location.href = "/change-request-form"}>
                  <FaPlus />
                  <span>Add Request</span>
                </button>
                {/* Export Button */}
                <button className="px-4 py-2 bg-green-500 rounded flex items-center space-x-2 hover:bg-green-700 transition duration-200" onClick={exportToExcel}>
                  <FaFileExport />
                  <span>Export</span>
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

  return (
    <Link href={`/change-management/${request.id}`} key={request.id}>
      <div className={`bg-gray-800 hover:bg-gray-700 cursor-pointer rounded-lg p-4 transition duration-200 border-l-8`} style={{ borderColor: statusColor }}>
        <h2 className="text-xl font-semibold mb-2">{request.name}</h2>
        <p className="text-gray-300">Type: {request.type}</p>
        <p className="text-gray-300">Category: {request.category}</p>
        <p className="text-gray-300">Urgency: {request.urgency}</p>
        <p className="text-gray-300">
          Creation Date: {request.created_at ? new Date(request.created_at).toLocaleString() : "N/A"}
        </p>
        <p className="text-gray-300">
          Requested Date: {new Date(request.requested_migration_date).toLocaleString()}
        </p>
        <p className="text-gray-300">
          Migration Date: {request.finished_at ? new Date(request.finished_at).toLocaleString() : "N/A"}
        </p>
        <div className="mt-2">
          <span
            className="text-gray-400"
          >
            {request.status?.replace("_", " ")}
          </span>
        </div>
      </div>
    </Link>
  );
}