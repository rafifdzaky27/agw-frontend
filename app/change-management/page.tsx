"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { getStatusColor } from "@/utils/status";
import Link from 'next/link';

interface ChangeRequest {
  id: number;
  name: string;
  type: string;
  category: string;
  urgency: string;
  requested_migration_date: string;
  status: string;
}

export default function ChangeManagement() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

        setRequests(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, [token]);


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Change Requests Management
          </h1>
          <Link href="/change-request-form">
            <button
              className="mb-4 px-4 py-2 bg-blue-500 rounded"
            >
              Add Request
            </button>
          </Link>

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
          Requested Migration: {new Date(request.requested_migration_date).toLocaleString()}
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