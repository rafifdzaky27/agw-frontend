"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { getStatusColor } from "@/utils/status";

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
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "software",
    name: "",
    category: "monitoring",
    urgency: "normal",
    requested_migration_date: "",
    compliance_checklist: "",
    procedure_checklist: "",
    rollback_checklist: "",
    architecture_diagram: "",
    captures: "",
    downtime_risk: 0,
    integration_risk: 0,
    uat_score: 0,
    description: "",
  });

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const loadingToast = toast.loading("Adding request...");
  
    try {
      const response = await fetch("http://localhost:8080/api/requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
  
      const result = await response.json();
  
      if (!result.success) {
        toast.dismiss(loadingToast);
        toast.error(result.message || "Failed to create change request.");
        throw new Error(result.message || "Failed to create change request.");
      }
  
      toast.dismiss(loadingToast);
      toast.success("Change request created successfully.");
  
      setRequests([...requests, result.data]);
      setShowForm(false);
  
      // Reset the form to its default values
      setFormData({
        type: "software",
        name: "",
        category: "monitoring",
        urgency: "normal",
        requested_migration_date: "",
        compliance_checklist: "",
        procedure_checklist: "",
        rollback_checklist: "",
        architecture_diagram: "",
        captures: "",
        downtime_risk: 0,
        integration_risk: 0,
        uat_score: 0,
        description: "",
      });
  
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err instanceof Error ? err.message : "Unknown error");
    }
  }  

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Change Management Requests
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="mb-4 px-4 py-2 bg-blue-500 rounded"
          >
            {showForm ? "Cancel" : "Add Request"}
          </button>
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-800 p-4 mb-6 rounded">
              <input
                type="text"
                placeholder="Name"
                className="block w-full p-2 mb-2 bg-gray-700"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <select
                className="block w-full p-2 mb-2 bg-gray-700"
                title="Request Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="">Select Type</option>
                <option value="software">Software</option>
                <option value="hardware">Hardware</option>
              </select>

              <select
                className="block w-full p-2 mb-2 bg-gray-700"
                title="Request Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                <option value="monitoring">Monitoring</option>
                <option value="transactional">Transactional</option>
                <option value="regulatory">Regulatory</option>
                <option value="reporting">Reporting</option>
              </select>

              <select
                className="block w-full p-2 mb-2 bg-gray-700"
                title="Urgency"
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                required
              >
                <option value="">Select Urgency</option>
                <option value="urgent">Urgent</option>
                <option value="normal">Normal</option>
              </select>

              <input
                type="date"
                title="Requested Migration Date"
                className="block w-full p-2 mb-2 bg-gray-700"
                value={formData.requested_migration_date}
                onChange={(e) => setFormData({ ...formData, requested_migration_date: e.target.value })}
                required
              />

              {["compliance_checklist", "procedure_checklist", "rollback_checklist", "architecture_diagram", "captures"].map((field) => (
                <input
                  key={field}
                  type="text"
                  placeholder={field.replace("_", " ").toUpperCase()}
                  className="block w-full p-2 mb-2 bg-gray-700"
                  value={formData[field as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [field as keyof typeof formData]: e.target.value })}
                />
              ))}

              <input
                type="number"
                min="0"
                max="100"
                placeholder="Downtime Risk (0-100)"
                className="block w-full p-2 mb-2 bg-gray-700"
                value={formData.downtime_risk}
                onChange={(e) => setFormData({ ...formData, downtime_risk: Number(e.target.value) })}
                required
              />

              <input
                type="number"
                min="0"
                max="10"
                placeholder="Integration Risk (0-10)"
                className="block w-full p-2 mb-2 bg-gray-700"
                value={formData.integration_risk}
                onChange={(e) => setFormData({ ...formData, integration_risk: Number(e.target.value) })}
                required
              />

              <input
                type="number"
                min="0"
                max="100"
                placeholder="UAT Score (0-100)"
                className="block w-full p-2 mb-2 bg-gray-700"
                value={formData.uat_score}
                onChange={(e) => setFormData({ ...formData, uat_score: Number(e.target.value) })}
                required
              />

              <textarea
                placeholder="Description"
                className="block w-full p-2 mb-2 bg-gray-700"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <button type="submit" className="px-4 py-2 bg-green-500 rounded">
                Submit Request
              </button>
            </form>
          )}
          {loading ? (
            <p className="text-center text-gray-300">Loading...</p>
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : (
            <ChangeRequestTable requests={requests} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function ChangeRequestTable({ requests }: { requests: ChangeRequest[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-700">
        <thead className="bg-gray-800">
          <tr>
            {["ID", "Name", "Type", "Category", "Urgency", "Requested Migration", "Status"].map((header) => (
              <th key={header} className="p-3 border border-gray-700 text-left">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-4 text-center text-gray-400">
                No change requests found.
              </td>
            </tr>
          ) : (
            requests.map((request) => <ChangeRequestRow key={request.id} request={request} />)
          )}
        </tbody>
      </table>
    </div>
  );
}

function ChangeRequestRow({ request }: { request: ChangeRequest }) {
  return (
    <tr className="bg-gray-800 hover:bg-gray-700">
      <td className="p-3 border border-gray-700">{request.id}</td>
      <td className="p-3 border border-gray-700">{request.name}</td>
      <td className="p-3 border border-gray-700">{request.type}</td>
      <td className="p-3 border border-gray-700">{request.category}</td>
      <td className="p-3 border border-gray-700">{request.urgency}</td>
      <td className="p-3 border border-gray-700">{new Date(request.requested_migration_date).toLocaleString()}</td>
      <td className="p-3 border border-gray-700">
        <span className={`px-2 py-1 rounded text-white ${getStatusColor(request.status)}`}>
          {request.status.replace("_", " ")}
        </span>
      </td>
    </tr>
  );
}
