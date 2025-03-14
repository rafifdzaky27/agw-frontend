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
}

export default function ChangeManagement() {
  const [allRequests, setAllRequests] = useState<ChangeRequest[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeReference, setTimeReference] = useState<"CAB" | "Migration">("CAB");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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
  }, [timeReference, startDate, endDate, allRequests]);

  const applyFilters = () => {
    let filtered = [...allRequests];

    if (timeReference === "CAB") {
      filtered = filtered.filter(request => {
        const createdAt = new Date(request.created_at); // Convert to Date object
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start) {
          start.setHours(0, 0, 0, 0);  // Set time to beginning of day for inclusive
          if (createdAt < start) return false;
        }
        if (end) {
          end.setHours(23, 59, 59, 999); // Set time to end of day for inclusive
          if (createdAt > end) return false;
        }
        return true;
      });
    } else if (timeReference === "Migration") {
      filtered = filtered.filter(request => {
        if (request.status !== "success" && request.status !== "failed") return false;
        if (!request.finished_at) return false;  // Filter out if no finished_at

        const finishedAt = new Date(request.finished_at); // Convert to Date object
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start) {
          start.setHours(0, 0, 0, 0); // Set time to beginning of day for inclusive
          if (finishedAt < start) return false;
        }
        if (end) {
          end.setHours(23, 59, 59, 999); // Set time to end of day for inclusive
          if (finishedAt > end) return false;
        }

        return true;
      });
    }

    setRequests(filtered);
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
        Type: request.type,
        Category: request.category,
        Urgency: request.urgency,
        Requested_Migration_Date: request.requested_migration_date,
        Actual_Migration_Date: request.actual_migration_date || "N/A",
        Created_At: request.created_at,
        Finished_At: request.finished_at || "N/A",
        Status: request.status,
        CAB_Meeting_Date: request.cab_meeting_date || "N/A",
      }));

      const ws = XLSX.utils.json_to_sheet(dataForExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Change Requests");
      XLSX.writeFile(wb, "change_requests.xlsx"); // Corrected filename

      toast.success("Change requests exported successfully", { id: toastId, duration: 1500 });
    } catch (error) {
      toast.error("Failed to export change requests", { id: toastId, duration: 1500 });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Change Requests Management
          </h1>

          <div className="flex justify-between items-stretch mb-4">
            {/* Add Request Button (Left) */}
            <button className="px-4 py-2 bg-blue-500 rounded flex items-center space-x-2 hover:bg-blue-700 transition duration-200" onClick={() => window.location.href = "/change-request-form"}>
              <FaPlus />
              <span>Add Request</span>
            </button>

            {/* Filters and Export (Right) */}
            <div className="flex items-stretch space-x-4">
              <div className="flex flex-col justify-start">
                <label className="block text-sm font-medium text-gray-300 h-1/2">Reference:</label>
                <select
                  className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                  value={timeReference}
                  onChange={(e) => setTimeReference(e.target.value as "CAB" | "Migration")}
                >
                  <option value="CAB">CAB</option>
                  <option value="Migration">Migration</option>
                </select>
              </div>

              <div className="flex flex-col justify-start">
                <label className="block text-sm font-medium text-gray-300 h-1/2">Start Date:</label>
                <input
                  type="date"
                  className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col justify-start">
                <label className="block text-sm font-medium text-gray-300 h-1/2">End Date:</label>
                <input
                  type="date"
                  className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              {/* Export Button */}
              <button className="px-4 py-2 bg-green-500 rounded flex items-center space-x-2 hover:bg-green-700 transition duration-200" onClick={exportToExcel}>
                <FaFileExport />
                <span>Export</span>
              </button>
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
          Actual Date: {request.finished_at ? new Date(request.finished_at).toLocaleString() : "N/A"}
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