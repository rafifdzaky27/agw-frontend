// app/change-management/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "react-hot-toast";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStatusColor } from '@/utils/status';
import { FaDownload } from 'react-icons/fa';

interface ChangeRequest {
    id: number;
    requester_id: number;
    approver_id: number | null;
    created_at: string;
    approved_at: string | null;
    finalized_at: string | null;
    finished_at: string | null;
    cab_meeting_date: string | null;
    type: string;
    name: string;
    category: string;
    urgency: string;
    description: string;
    post_implementation_review: string | null;
    requested_migration_date: string;
    actual_migration_date: string | null;
    compliance_checklist: string;
    procedure_checklist: string;
    rollback_checklist: string;
    architecture_diagram: string;
    captures: string;
    completion_report: string | null;
    downtime_risk: number;
    integration_risk: number;
    uat_result: string;
    status: string;
}

export default function ChangeRequestDetails() {
    const params = useParams();
    const requestId = params.id as string; // Ensure requestId is a string
    const [formData, setFormData] = useState<ChangeRequest | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();

    useEffect(() => {
        async function fetchRequest() {
            if (!token) return;

            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`http://localhost:8080/api/requests/${requestId}`, {
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
                    throw new Error("Failed to fetch change request.");
                }

                setFormData(result.data[0]); // Assuming the API returns an array with one element
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }

        fetchRequest();
    }, [requestId, token]);

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-900 text-white">
                    <Navbar />
                    <div className="container mx-auto p-6">
                        <h1 className="text-3xl font-bold mb-6 text-center">Loading...</h1>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    if (error) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-900 text-white">
                    <Navbar />
                    <div className="container mx-auto p-6">
                        <h1 className="text-3xl font-bold mb-6 text-center">Error</h1>
                        <p className="text-red-500 text-center">{error}</p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    if (!formData) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-900 text-white">
                    <Navbar />
                    <div className="container mx-auto p-6">
                        <h1 className="text-3xl font-bold mb-6 text-center">Request Not Found</h1>
                        <p className="text-center">Change request with ID {requestId} not found.</p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const approveRequest = async () => {
        const loadingToast = toast.loading("Approving request...");
        try {
            const response = await fetch(`http://localhost:8080/api/requests/approve/${requestId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cab_meeting_date: formData?.cab_meeting_date }),
            });

            const result = await response.json();

            if (!result.success) {
                toast.dismiss(loadingToast);
                toast.error(result.message || "Failed to approve change request.");
                throw new Error(result.message || "Failed to approve change request.");
            }

            toast.dismiss(loadingToast);
            toast.success("Change request approved successfully.");

            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err instanceof Error ? err.message : "Unknown error");
        }
    };

    const finalizeRequest = async () => {
        const loadingToast = toast.loading("Finalizing request...");
        try {
            const response = await fetch(`http://localhost:8080/api/requests/finalize/${requestId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!result.success) {
                toast.dismiss(loadingToast);
                toast.error(result.message || "Failed to finalize change request.");
                throw new Error(result.message || "Failed to finalize change request.");
            }

            toast.dismiss(loadingToast);
            toast.success("Change request finalized successfully.");

            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err instanceof Error ? err.message : "Unknown error");
        }
    };

    const completeRequest = async (isSucceed: boolean) => {
        const loadingToast = toast.loading("Completing request...");
        try {
            const response = await fetch(`http://localhost:8080/api/requests/complete/${requestId}?isSucceed=${isSucceed}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ completion_report: formData?.completion_report, post_implementation_review: formData?.post_implementation_review }),
            });

            const result = await response.json();

            if (!result.success) {
                toast.dismiss(loadingToast);
                toast.error(result.message || "Failed to complete change request.");
                throw new Error(result.message || "Failed to complete change request.");
            }

            toast.dismiss(loadingToast);
            toast.success("Change request completed successfully.");

            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err instanceof Error ? err.message : "Unknown error");
        }
    };

    const handleSubmit = (isSucceed: boolean | null) => async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData?.status === "waiting_approval") {
            approveRequest();
        } else if (formData?.status === "waiting_finalization") {
            finalizeRequest();
        } else if (formData?.status === "waiting_migration" && isSucceed !== null) {
            completeRequest(isSucceed);
        } else {
            // Default action does nothing
        }
    };

    const statusSteps = [
        "draft",
        "waiting_approval",
        "waiting_finalization",
        "waiting_migration",
        "success/failed",
    ];

    const completedSteps = () => {
        const statusIndex = statusSteps.indexOf(formData.status);
        if (formData.status === "failed" || formData.status === "success") {
            return statusSteps.slice(0, statusSteps.length);
        }
        return statusSteps.slice(0, statusIndex);
    };

    const determineStatus = (step:string) => {
      if (formData.status === 'success' || formData.status === 'failed'){
        return 'completed'
      }

      if (formData.status === step){
        return 'active'
      }

      if (completedSteps().includes(step)) {
        return 'completed'
      }
      return 'pending'
    }

    const getNodeColor = (step: string) => {
        const status = determineStatus(step);
        switch (status) {
            case 'completed':
                return 'bg-green-500';
            case 'active':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getTextColor = (step: string) => {
        const status = determineStatus(step);
        return status === 'pending' ? 'text-gray-400' : 'text-white';
    };

    const getButton = () => {
        const status = formData?.status;

        const baseButtonStyle = `w-full px-4 py-2 text-white rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors`;

        if (status === "waiting_approval") {
            return (
                <button
                    type="submit"
                    onClick={handleSubmit(null)}
                    className={`${baseButtonStyle}`}
                    style={{ backgroundColor: getStatusColor(status) }}
                >
                    Approve Request
                </button>
            );
        }

        if (status === "waiting_finalization") {
            return (
                <button
                    type="button"
                    onClick={handleSubmit(null)}
                    className={`${baseButtonStyle}`}
                    style={{ backgroundColor: getStatusColor(status) }}
                >
                    Finalize Request
                </button>
            );
        }

        if (status === "waiting_migration") {
            return (
                <div className="flex gap-6">
                    <button
                        type="button"
                        onClick={handleSubmit(true)}
                        className={`${baseButtonStyle} flex-1`}
                        style={{ backgroundColor: getStatusColor("success") }}
                    >
                        Complete Success
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit(false)}
                        className={`${baseButtonStyle} flex-1`}
                        style={{ backgroundColor: getStatusColor("failed") }}
                    >
                        Complete Failed
                    </button>
                </div>
            );
        }

        return (
            <button
                type="submit"
                className={`${baseButtonStyle}`}
                style={{ backgroundColor: getStatusColor(status) }}
            >
                Update Request
            </button>
        );
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-900 text-white">
                <Navbar />
                <div className="container mx-auto p-6">
                    <div className="flex items-center mb-6">
                        <h1 className="text-3xl font-bold text-center flex-grow">Edit Change Request</h1>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold mb-3 mt-6">Request Flow</h2>
                        <div className="relative w-full">
                            <div className="flex justify-between items-center">
                                {statusSteps.map((step, index) => (
                                    <div key={step} className="flex flex-col items-center justify-center flex-1">
                                        <div
                                            className={`rounded-full h-8 w-8 flex items-center justify-center z-10 ${getNodeColor(step)}`}
                                        >
                                            {determineStatus(step) === 'completed' && <span className="text-white">✓</span>}
                                        </div>
                                        <p className={`text-sm mt-1 text-center ${getTextColor(step)}`}>{step.replace("_", " ")}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="absolute top-4 left-0 w-full h-1 bg-gray-700">
                                <div
                                    className="h-1 bg-green-500 transition-all duration-500"
                                    style={{ width: `${(completedSteps().length / statusSteps.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(null)} className="flex flex-col gap-6">
                        <div className="flex flex-row gap-6">
                            {/* Column 1 */}
                            <div className="flex flex-col w-1/3 gap-6">
                                <div className="flex flex-col">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name:</label>
                                    <input
                                        type="text"
                                        id="name"
                                        placeholder="Request Name"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="type" className="block text-sm font-medium text-gray-300">Request Type:</label>
                                    <select
                                        id="type"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        title="Request Type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="software">Software</option>
                                        <option value="hardware">Hardware</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-300">Request Category:</label>
                                    <select
                                        id="category"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        title="Request Category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        <option value="monitoring">Monitoring</option>
                                        <option value="transactional">Transactional</option>
                                        <option value="regulatory">Regulatory</option>
                                        <option value="reporting">Reporting</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="urgency" className="block text-sm font-medium text-gray-300">Urgency:</label>
                                    <select
                                        id="urgency"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        title="Urgency"
                                        value={formData.urgency}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Urgency</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="normal">Normal</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="actual_migration_date" className="block text-sm font-medium text-gray-300">Actual Migration Date:</label>
                                    <input
                                        type="date"
                                        id="actual_migration_date"
                                        title="Actual Migration Date"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.actual_migration_date?.split('T')[0] || ''}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="cab_meeting_date" className="block text-sm font-medium text-gray-300">CAB Meeting Date:</label>
                                    <input
                                        type="date"
                                        id="cab_meeting_date"
                                        title="CAB Meeting Date"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.cab_meeting_date?.split('T')[0] || ''}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Column 2 */}
                            <div className="flex flex-col w-1/3 gap-6">
                                {["compliance_checklist", "procedure_checklist", "rollback_checklist", "architecture_diagram", "captures", "completion_report"].map((field) => {
                                    const fieldValue = formData && formData[field as keyof typeof formData];
                                    const hasValue = !!fieldValue;

                                    return (
                                        <div key={field} className="flex flex-col">
                                            <label htmlFor={field} className="block text-sm font-medium text-gray-300">
                                                {field.replace("_", " ").toUpperCase()}:
                                            </label>
                                            <div className="flex items-center">
                                                <input
                                                    type="text"
                                                    id={field}
                                                    placeholder={field.replace("_", " ").toUpperCase()}
                                                    className={`mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 ${hasValue ? 'w-4/5' : ''}`}
                                                    value={fieldValue || ""}
                                                    onChange={handleChange}
                                                />
                                                {hasValue && (
                                                    <button
                                                        type="button"
                                                        title={`Download ${field.replace("_", " ")}`}
                                                        className="ml-2 w-10 h-10 p-2 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
                                                        onClick={() => {
                                                            // Placeholder for download logic
                                                            console.log(`Download ${field}`);
                                                        }}
                                                    >
                                                        <FaDownload className="text-white" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Column 3 */}
                            <div className="flex flex-col w-1/3 gap-6">
                                <div className="flex flex-col">
                                    <label htmlFor="downtime_risk" className="block text-sm font-medium text-gray-300">Downtime Risk:</label>
                                    <input
                                        type="number"
                                        id="downtime_risk"
                                        min="0"
                                        placeholder="Downtime Risk"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.downtime_risk}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="integration_risk" className="block text-sm font-medium text-gray-300">Integration Risk (0-10):</label>
                                    <input
                                        type="number"
                                        id="integration_risk"
                                        min="0"
                                        max="10"
                                        placeholder="Integration Risk (0-10)"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.integration_risk}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="uat_result" className="block text-sm font-medium text-gray-300">UAT Score:</label>
                                    <select
                                        id="uat_result"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        title="Urgency"
                                        value={formData.uat_result}
                                        onChange={handleChange}
                                    >
                                        <option value="none">None</option>
                                        <option value="done with notes">Done with Notes</option>
                                        <option value="well done">Welll Done</option>
                                    </select>
                                </div>

                                {/* Description spans the remaining space */}
                                <div className="flex flex-col flex-grow">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description:</label>
                                    <textarea
                                        id="description"
                                        placeholder="Description"
                                        className="mt-1 block w-full h-1/2 p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.description}
                                        onChange={handleChange}
                                    />

                                    <label htmlFor="post_implementation_review" className="block text-sm font-medium text-gray-300 mt-4">Post Implementation Review:</label>
                                    <textarea
                                        id="post_implementation_review"
                                        placeholder="Post Implementation Review"
                                        className="mt-1 block w-full h-1/2 p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.post_implementation_review || ''}
                                        onChange={handleChange}
                                    />

                                </div>
                            </div>
                        </div>

                        {getButton()}
                    </form>
                </div>
            </div>
        </ProtectedRoute>
    );
}