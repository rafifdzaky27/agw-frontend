// app/change-request-form/page.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { FaDownload } from 'react-icons/fa';
import ProtectedRoute from "@/components/ProtectedRoute";
import { ConfirmationModal } from "@/components/ConfirmationModal"; // Import the new component

interface FormDataState {
    type: string;
    name: string;
    category: string;
    urgency: string;
    requested_migration_date: string;
    compliance_checklist: File | null;
    procedure_checklist: File | null;
    rollback_checklist: File | null;
    architecture_diagram: File | null;
    captures: File | null;
    downtime_risk: number;
    integration_risk: number;
    uat_result: string;
    description: string;
}

export default function ChangeRequestForm() {
    const [formData, setFormData] = useState<FormDataState>({
        type: "software",
        name: "",
        category: "monitoring",
        urgency: "normal",
        requested_migration_date: "",
        compliance_checklist: null,
        procedure_checklist: null,
        rollback_checklist: null,
        architecture_diagram: null,
        captures: null,
        downtime_risk: 0,
        integration_risk: 0,
        uat_result: "none",
        description: "",
    });
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false); // State for modal visibility

    const { token } = useAuth();
    const router = useRouter();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof FormDataState) => {
        if (event.target.files && event.target.files.length > 0) {
            setFormData({ ...formData, [field]: event.target.files[0] });
        } else {
            setFormData({ ...formData, [field]: null });
        }
    };

    const handleDownloadFile = (field: keyof FormDataState) => {
        const file = formData[field];
        if (file) {
            if (file instanceof File) {
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name || field;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
            }
        } else {
            toast.error('No file selected');
        }
    };

    const truncateFilename = (filename: string, maxLength: number): string => {
        if (filename.length <= maxLength) {
            return filename;
        }

        const extension = filename.split('.').pop();
        const nameWithoutExtension = filename.substring(0, filename.length - (extension ? extension.length + 1 : 0));

        if (nameWithoutExtension.length > maxLength) {
            return nameWithoutExtension.substring(0, maxLength) + '...' + (extension ? `.${extension}` : '');
        }

        return nameWithoutExtension + '...' + (extension ? `.${extension}` : '');
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsConfirmationModalOpen(true); // Open the confirmation modal
    }

    const confirmSubmit = async () => {
        setIsConfirmationModalOpen(false); // Close the modal
        const loadingToast = toast.loading("Adding request...");

        try {
            const formDataToSend = new FormData();

            // Append text fields
            for (const key in formData) {
                if (typeof formData[key as keyof FormDataState] === 'string' || typeof formData[key as keyof FormDataState] === 'number') {
                    formDataToSend.append(key, String(formData[key as keyof FormDataState]));
                }
            }

            // Append file fields
            formDataToSend.append('compliance_checklist', formData.compliance_checklist || '');
            formDataToSend.append('procedure_checklist', formData.procedure_checklist || '');
            formDataToSend.append('rollback_checklist', formData.rollback_checklist || '');
            formDataToSend.append('architecture_diagram', formData.architecture_diagram || '');
            formDataToSend.append('captures', formData.captures || '');

            const response = await fetch("http://localhost:8080/api/requests", {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`, // Don't set Content-Type for FormData
                },
                body: formDataToSend,
            });

            const result = await response.json();

            if (!result.success) {
                toast.dismiss(loadingToast);
                toast.error(result.message || "Failed to create change request.");
                setTimeout(() => {
                    toast.dismiss();
                }, 1000);
                return;
            }

            toast.dismiss(loadingToast);
            toast.success("Change request created successfully.");

            setFormData({
                type: "software",
                name: "",
                category: "monitoring",
                urgency: "normal",
                requested_migration_date: "",
                compliance_checklist: null,
                procedure_checklist: null,
                rollback_checklist: null,
                architecture_diagram: null,
                captures: null,
                downtime_risk: 0,
                integration_risk: 0,
                uat_result: "none",
                description: "",
            });

            setTimeout(() => {
                router.push('/change-management');
            }, 1000);

        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err instanceof Error ? err.message : "Unknown error");
        }
    }

    const cancelSubmit = () => {
        setIsConfirmationModalOpen(false); // Close the modal
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-900 text-white">
                <Navbar />
                <div className="container mx-auto p-6">
                    <div className="flex items-center mb-6">
                        <h1 className="text-3xl font-bold text-center flex-grow">Create Change Request</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                                        onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Urgency</option>
                                        <option value="emergency">Emergency</option>
                                        <option value="normal">Normal</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="requested_migration_date" className="block text-sm font-medium text-gray-300">Requested Migration Date:</label>
                                    <input
                                        type="date"
                                        id="requested_migration_date"
                                        title="Requested Migration Date"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.requested_migration_date}
                                        onChange={(e) => setFormData({ ...formData, requested_migration_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Column 2 */}
                            <div className="flex flex-col w-1/3 gap-6">
                                {["compliance_checklist", "procedure_checklist", "rollback_checklist", "architecture_diagram", "captures"].map((field) => {
                                    const typedField = field as keyof FormDataState;
                                    const hasValue = !!formData[typedField];
                                    const filename = formData[typedField] ? (formData[typedField] as File).name : `Choose ${field.replace("_", " ")}`;
                                    const truncatedFilename = hasValue ? truncateFilename(filename, 40) : filename; // Adjust maxLength as needed

                                    return (
                                        <div key={field} className="flex flex-col">
                                            <label htmlFor={field} className="block text-sm font-medium text-gray-300">
                                                {field.replace("_", " ").toUpperCase()}:
                                            </label>
                                            <div className="flex items-center">
                                                <label
                                                    htmlFor={field}
                                                    className={`mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 cursor-pointer relative overflow-hidden ${hasValue ? 'w-4/5' : ''}`}
                                                >
                                                    <span className={`block truncate ${!formData[typedField] ? 'text-gray-400' : ''}`}>
                                                        {truncatedFilename}
                                                    </span>
                                                    <input
                                                        type="file"
                                                        id={field}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={(e) => handleFileChange(e, typedField)}
                                                        required={field === "compliance_checklist"}
                                                    />
                                                </label>
                                                {formData[typedField] && (
                                                    <button
                                                        type="button"
                                                        title={`Download ${field.replace("_", " ")}`}
                                                        className="mt-1 ml-2 w-10 h-10 p-2 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
                                                        onClick={() => handleDownloadFile(typedField)}
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
                                        onChange={(e) => setFormData({ ...formData, downtime_risk: Number(e.target.value) })}
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
                                        onChange={(e) => setFormData({ ...formData, integration_risk: Number(e.target.value) })}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="uat_result" className="block text-sm font-medium text-gray-300">UAT Score:</label>
                                    <select
                                        id="uat_result"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        title="uat_result"
                                        value={formData.uat_result}
                                        onChange={(e) => setFormData({ ...formData, uat_result: e.target.value })}
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
                                        className="mt-1 block w-full h-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors">
                            Submit Request
                        </button>
                    </form>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmationModalOpen}
                onConfirm={confirmSubmit}
                onCancel={cancelSubmit}
                message="Are you sure you want to submit this change request?"
            />
        </ProtectedRoute>
    );
}