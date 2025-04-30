"use client";

import { useParams } from 'next/navigation';
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "react-hot-toast";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStatusColor } from '@/utils/status';
import { FaDownload, FaExclamationCircle } from 'react-icons/fa';
import { ConfirmationModal, PendingModal, PreviousMigrationsModal, AlertModal } from "@/components/ConfirmationModal"; // Import the new component

interface ChangeRequest {
    id: number;
    requester_id: number;
    approver_id: number | null;
    created_at: string;
    approved_at: string | null;
    finalized_at: string | null;
    vdh_operations_approved_at: string | null;
    vdh_development_approved_at: string | null;
    finished_at: string | null;
    cab_meeting_date: string | null;
    type: string;
    name: string;
    group: string;
    division: string;
    category: string;
    urgency: string;
    description: string;
    post_implementation_review: string | null;
    requested_migration_date: string;
    project_code: string;
    rfc_number: string;
    compliance_checklist: string;
    procedure_checklist: string;
    rollback_checklist: string;
    architecture_diagram: string;
    captures: string;
    completion_report: string | null;
    pic: string;
    cab_meeting_link: string;
    downtime_risk: number;
    integration_risk: number;
    uat_result: string;
    status: string;
    requester_name: string | null;
    approver_name: string | null;
    alert_count: number;
}

interface FormDataState extends ChangeRequest {
    compliance_checklist_file: File | null;
    procedure_checklist_file: File | null;
    rollback_checklist_file: File | null;
    architecture_diagram_file: File | null;
    captures_file: File | null;
    completion_report_file: File | null;
}

interface MigrationHistory {
    id: number;
    change_request_id: number;
    migration_date: string;
    pending_reason: string;
    status: string;
    recorded_at: string;
}

const fileFields = ["compliance_checklist", "procedure_checklist", "rollback_checklist", "architecture_diagram", "captures", "completion_report"] as const;
type FileFieldName = (typeof fileFields)[number];

export default function ChangeRequestDetails() {
    const params = useParams();
    const requestId = params.id as string; // Ensure requestId is a string
    const [formData, setFormData] = useState<FormDataState | null>(null);
    const [migrationHistory, setMigrationHistory] = useState<MigrationHistory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSucceed, setIsSucceed] = useState<boolean | null>(null);
    const { token, user } = useAuth();
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false); // State for modal visibility
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false); // State for modal visibility
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false); // State for modal visibility
    const [alertSubject, setAlertSubject] = useState<string>(''); // State for subject
    const [alertText, setAlertText] = useState<string>(''); // State for text
    const [alertLimit, setAlertLimit] = useState<number>(3); // State for alert limit

    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false); 

    const replaceVariables = (template: string) => {
        const currentDate = new Date().toLocaleDateString();
    
        return template
            .replace(/{{currentDate}}/g, currentDate)
            .replace(/{{currentUser}}/g, user?.name || "Admin")
            .replace(/{{formData\.name}}/g, formData?.name || "Change Request")
            .replace(/{{formData\.requesterName}}/g, formData?.requester_name || "Requester")
            .replace(/{{formData\.ComplianceChecklist}}/g, formData?.compliance_checklist ? "Lengkap" : "Belum Lengkap")
            .replace(/{{formData\.ProcedureChecklist}}/g, formData?.procedure_checklist ? "Lengkap" : "Belum Lengkap")
            .replace(/{{formData\.RollbackChecklist}}/g, formData?.rollback_checklist ? "Lengkap" : "Belum Lengkap")
            .replace(/{{formData\.ArchitectureDiagram}}/g, formData?.architecture_diagram ? "Lengkap" : "Belum Lengkap")
            .replace(/{{formData\.Captures}}/g, formData?.captures ? "Lengkap" : "Belum Lengkap")
            .replace(/{{formData\.FinalReport}}/g, formData?.completion_report ? "Lengkap" : "Belum Lengkap")
            .replace(/{{formData\.approverName}}/g, formData?.approver_name || "Approver");
    };

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

                const initialFormData: FormDataState = {
                    ...result.data,
                    compliance_checklist_file: null,
                    procedure_checklist_file: null,
                    rollback_checklist_file: null,
                    architecture_diagram_file: null,
                    captures_file: null,
                    completion_report_file: null,
                };

                // Function to download a file from URL and convert to File object
                const downloadFile = async (url: string, filename: string): Promise<File | null> => {
                    try {
                        const response = await fetch(url);
                        const blob = await response.blob();
                        return new File([blob], filename, { type: blob.type });
                    } catch (error) {
                        console.error(`Failed to download file ${filename}:`, error);
                        return null;
                    }
                };

                // Download existing files
                await Promise.all(
                    fileFields.map(async (field) => {
                        const backendFilename = initialFormData[field];
                        if (backendFilename) {
                            const downloadURL = `http://localhost:8080/files/${field}/${backendFilename}`;
                            const file = await downloadFile(downloadURL, backendFilename);

                            if (file) {
                                (initialFormData as any)[`${field}_file`] = file;
                            }
                        }
                    })
                );

                setFormData(initialFormData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }

        async function fetchMigrationHistory() {
            if (!token) return;

            try {
                const response = await fetch(`http://localhost:8080/api/requests/history/${requestId}`, {
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
                    throw new Error("Failed to fetch migration history.");
                }

                setMigrationHistory(result.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            }
        }

        fetchRequest();
        fetchMigrationHistory();
    }, [requestId, token]);

    useEffect(() => {
        const loadAlertConfig = async () => {
            if (!token || !user || !formData) return;
    
            try {
                const [subjectResponse, textResponse, limitResponse] = await Promise.all([
                    fetch(`http://localhost:8080/api/config?key=request_email_alert_subject`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    fetch(`http://localhost:8080/api/config?key=request_email_alert_text`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    fetch(`http://localhost:8080/api/config?key=request_email_alert_limit`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ]);
    
                if (!subjectResponse.ok || !textResponse.ok || !limitResponse.ok) {
                    throw new Error("Failed to load alert configuration");
                }
    
                const subjectData = await subjectResponse.json();
                const textData = await textResponse.json();
                const limitData = await limitResponse.json();
    
                let loadedSubject = "";
                let loadedText = "";
                let loadedLimit = 3; // Default limit
    
                if (subjectData.success && subjectData.data && subjectData.data.length > 0) {
                    loadedSubject = subjectData.data[0].value;
                } else {
                    console.warn("request_email_alert_subject not found, using default");
                    loadedSubject = "Placeholder Subject"; // Default subject if not found
                }
    
                if (textData.success && textData.data && textData.data.length > 0) {
                    loadedText = textData.data[0].value;
                } else {
                    console.warn("request_email_alert_text not found, using default");
                    loadedText = "Placeholder Text"; // Default text if not found
                }

                if (limitData.success && limitData.data && limitData.data.length > 0) {
                    loadedLimit = parseInt(limitData.data[0].value);
                }
    
                // Replace variables after loading
                setAlertSubject(replaceVariables(loadedSubject)); // pass empty object since it doesnt need to be parse here
                setAlertText(replaceVariables(loadedText)); // pass empty object since it doesnt need to be parse here
                setAlertLimit(loadedLimit); // Set the alert limit
    
            } catch (error: any) {
                console.error("Error loading alert configuration:", error);
                toast.error(`Error loading alert configuration: ${error.message}`);
            }
        };
    
        loadAlertConfig();
    }, [token, user, formData]);

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
        if (formData) {
            setFormData({ ...formData, [e.target.id]: e.target.value });
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fieldName: FileFieldName) => {
        if (formData) {
            const file = event.target.files?.[0] || null;
            setFormData({ ...formData, [`${fieldName}_file`]: file });
        }
    };

    const getDownloadURL = (field: FileFieldName) => {
        if (!formData) return null;

        const clientFile = formData[`${field}_file`];

        if (clientFile) {
            return URL.createObjectURL(clientFile); // Create a temporary URL for the client-side file
        }
        const backendFilename = formData[field];
        if (backendFilename) {
            return `http://localhost:8080/files/${field}/${backendFilename}`;
        }
        return null;
    };

    const confirmAlert = async () => {
        if (!formData?.requester_id) {
            toast.error("Requester ID is missing.");
            return;
        }

        const loadingToast = toast.loading("Sending alert email...");
        try {
            await incrementAlertCount();
            await sendAlertEmail(formData.requester_id);
            toast.dismiss(loadingToast);
            toast.success("Email sent successfully.");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err instanceof Error ? err.message : "Unknown error");
        }
    };

    const incrementAlertCount = async () => {
        const response = await fetch(`http://localhost:8080/api/requests/alert/${requestId}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ alert_limit: alertLimit }),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || "Failed to increment alert count.");
        }
    };

    const sendAlertEmail = async (requesterId: number) => {
        if (!formData) {
            throw new Error("Form data is missing.");
        }

        const subject = alertSubject || "Change Request Alert Subject";
        const text = alertText || "Change Request Alert Text";

        const response = await fetch(`http://localhost:8080/api/users/${requesterId}/email`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ subject, text }),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "Failed to send alert email.");
        }
    };

    const approveRequest = async () => {
        if (!formData?.cab_meeting_date) {
            toast.error("CAB Meeting Date is required.");
            return;
        }

        const loadingToast = toast.loading("Approving request...");
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("cab_meeting_date", formData.cab_meeting_date);

            const response = await fetch(`http://localhost:8080/api/requests/approve/${requestId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formDataToSend,
            });

            const result = await response.json();

            if (!result.success) {
                toast.dismiss(loadingToast);
                toast.error(result.message || "Failed to approve change request.");
                setTimeout(() => {
                    toast.dismiss();
                }, 1000);
                return;
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

    const approveVDHRequest = async () => {
        if (!formData?.type) {
            toast.error("Request Type is required.");
            return;
        }

        const loadingToast = toast.loading("Approving VDH request...");
        try {
            const response = await fetch(`http://localhost:8080/api/requests/approve_vdh/${requestId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ type: formData.type }),
            });

            const result = await response.json();

            if (!result.success) {
                toast.dismiss(loadingToast);
                toast.error(result.message || "Failed to approve VDH change request.");
                setTimeout(() => {
                    toast.dismiss();
                }, 1000);
                return;
            }

            toast.dismiss(loadingToast);
            toast.success("VDH change request approved successfully.");

            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err instanceof Error ? err.message : "Unknown error");
        }
    };

    const finalizeRequest = async () => {
        if (user?.name !== formData?.approver_name) {
            toast.error("You are not authorized to finalize this request.");
            return;
        }

        const loadingToast = toast.loading("Finalizing request...");
        const formDataToSend = new FormData();

        // Append text fields
        for (const key in formData) {
            if (key.endsWith('_file')) continue; // Skip file fields for now
            if (typeof formData[key as keyof FormDataState] === 'string' || typeof formData[key as keyof FormDataState] === 'number' || typeof formData[key as keyof FormDataState] === 'boolean' || formData[key as keyof FormDataState] === null) {
                formDataToSend.append(key, String(formData[key as keyof FormDataState]));
            }
        }

        // Append file fields
        for (const field of fileFields) {
            const fileFieldKey = `${field}_file` as keyof FormDataState;
            const file = formData[fileFieldKey];
            if (file) {
                if (file instanceof File) {
                    formDataToSend.append(field, file);
                }
            } else {
                // If no new file is selected, keep the existing filename in the database
                formDataToSend.append(field, formData[field] || ""); // Append the existing filename if no new file is selected
            }
        }

        try {
            const isEmergency = formData.urgency === "emergency";
            const response = await fetch(`http://localhost:8080/api/requests/finalize/${requestId}?isEmergency=${isEmergency}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formDataToSend,
            });

            const result = await response.json();

            if (!result.success) {
                toast.dismiss(loadingToast);
                toast.error(result.message || "Failed to finalize change request.");
                setTimeout(() => {
                    toast.dismiss();
                }, 1000);
                return;
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
        if (user?.name !== formData?.requester_name) {
            toast.error("You are not authorized to finalize this request.");
            return;
        }

        const loadingToast = toast.loading("Completing request...");
        const formDataToSend = new FormData();

        // Check if all file fields are filled and append them
        for (const field of fileFields) {
            const fileFieldKey = `${field}_file` as keyof FormDataState;
            const file = formData?.[fileFieldKey];
            const backendFilename = formData?.[field];
            if (!file && !backendFilename) {
                toast.dismiss(loadingToast);
                toast.error("All document fields are required.");
                return;
            }
            if (file) {
                if (file instanceof File) {
                    formDataToSend.append(field, file);
                }
            } else {
                // If no new file is selected, keep the existing filename in the database
                formDataToSend.append(field, formData[field] || ""); // Append the existing filename if no new file is selected
            }
        }

        // Append text fields
        for (const key in formData) {
            if (key.endsWith('_file')) continue; // Skip file fields for now
            if (typeof formData[key as keyof FormDataState] === 'string' || typeof formData[key as keyof FormDataState] === 'number' || typeof formData[key as keyof FormDataState] === 'boolean' || formData[key as keyof FormDataState] === null) {
                formDataToSend.append(key, String(formData[key as keyof FormDataState]));
            }
        }

        try {
            const response = await fetch(`http://localhost:8080/api/requests/complete/${requestId}?isSucceed=${isSucceed}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formDataToSend,
            });

            const result = await response.json();

            if (!result.success) {
                toast.dismiss(loadingToast);
                toast.error(result.message || "Failed to complete change request.");
                setTimeout(() => {
                    toast.dismiss();
                }, 1000);
                return;
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
        setIsSucceed(isSucceed);
        setIsConfirmationModalOpen(true);
    };

    const handlePending = () => async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPendingModalOpen(true);
    };

    const handleAlert = () => setIsAlertModalOpen(true);

    const confirmPending = async (selectedDate: string, pending_reason: string) => {
        setIsPendingModalOpen(false);
        if (!selectedDate || !pending_reason) return; // Ensure date and reason are provided
        if (user?.name !== formData?.requester_name) {
            toast.error("You are not authorized to finalize this request.");
            return;
        }

        const loadingToast = toast.loading("Updating migration request...");

        try {
            const response = await fetch(`http://localhost:8080/api/requests/pending/${requestId}`, {
                method: "POST", // Use POST since we're updating data
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ new_migration_date: selectedDate, pending_reason: pending_reason }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.dismiss(loadingToast);
                toast.success("Migration request updated successfully!");
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                toast.dismiss(loadingToast);
                toast.error(data.message || "Failed to update migration request.");
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error("An error occurred while updating the migration request.");
        }
    };

    const confirmSubmit = async () => {
        setIsConfirmationModalOpen(false);
        if (formData?.status === "waiting_approval") {
            approveRequest();
        } else if (formData?.status === "waiting_finalization") {
            finalizeRequest();
        } else if (formData?.status === "waiting_migration" && isSucceed !== null) {
            completeRequest(isSucceed);
        } else if (formData?.status === "waiting_dev_vdh_approval" || formData?.status === "waiting_ops_vdh_approval") {
            approveVDHRequest();
        } else {
            // Default action does nothing
        }
    };

    const statusSteps = ["draft", "waiting_approval", "waiting_finalization", "waiting_migration", "success/failed"];

    if (formData?.urgency === "emergency") {
        if (formData?.type === "software") {
            statusSteps.splice(3, 0, "waiting_dev_vdh_approval", "waiting_ops_vdh_approval");
        } else if (formData?.type === "hardware") {
            statusSteps.splice(3, 0, "waiting_ops_vdh_approval", "waiting_dev_vdh_approval");
        }
    }

    const completedSteps = () => {
        const statusIndex = statusSteps.indexOf(formData.status);
        if (formData.status === "failed" || formData.status === "success") {
            return statusSteps.slice(0, statusSteps.length);
        }
        return statusSteps.slice(0, statusIndex);
    };

    const determineStatus = (step: string) => {
        if (formData.status === 'success' || formData.status === 'failed') {
            return 'completed'
        }

        if (formData.status === step) {
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

    const timestampMap: { [key in string]: string | null } = {
      "draft": formData?.created_at,
      "waiting_approval": formData?.approved_at,
      "waiting_finalization": formData?.finalized_at,
      "waiting_ops_vdh_approval": formData?.vdh_operations_approved_at,
      "waiting_dev_vdh_approval": formData?.vdh_development_approved_at,
      "waiting_migration": formData?.finished_at,
      "success/failed": formData?.finished_at,
    };

    const formatTimestamp = (timestamp: string | null | undefined) => {
        if (!timestamp) return "";
        return new Date(timestamp).toLocaleString();
    };

    const formatUTCStringToInput = (utcString: string) => {
        const [datePart, timePart] = utcString.split('T');
        const [time] = timePart.split('.'); // remove .000Z
        return `${datePart}T${time}`;
    };

    const isFieldDisabled = (fieldName: string): boolean => {
        const currentStatus = formData?.status;

        if (currentStatus === "success" || currentStatus === "failed") {
            return true; // All fields are locked
        }

        if (currentStatus === "waiting_approval") {
            return fieldName !== "cab_meeting_date"; // Only cab_meeting_date is open
        }

        if (currentStatus === "waiting_finalization") {
            return (
                fieldName === "cab_meeting_date" ||
                fieldName === "completion_report" ||
                fieldName === "post_implementation_review"
            ); // These are locked
        }

        if (currentStatus === "waiting_migration") {
            return ( fieldName === "cab_meeting_date" || fieldName === "requested_migration_date" ) ; // cab_meeting_date and requested_migration_date are locked
        }

        return false; // Default: all fields open
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
                    style={{ backgroundColor: getStatusColor("success"), flexBasis: "40%" }}
                >
                Complete Success
                </button>
                <button
                    type="button"
                    onClick={handleSubmit(false)}
                    className={`${baseButtonStyle} flex-1`}
                    style={{ backgroundColor: getStatusColor("failed"), flexBasis: "40%" }}
                >
                Complete Failed
                </button>
                <button
                    type="button"
                    onClick={handlePending()}
                    className={`${baseButtonStyle} flex-1`}
                    style={{ backgroundColor: "purple", flexBasis: "20%" }}
                >
                Pending
                </button>
            </div>
            );
        }

        if (status === "waiting_ops_vdh_approval" || status === "waiting_dev_vdh_approval") {
            return (
                <button
                    type="button"
                    onClick={handleSubmit(null)}
                    className={`${baseButtonStyle}`}
                    style={{ backgroundColor: getStatusColor(status) }}
                >
                    Approve Request
                </button>
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

    const cancelSubmit = () => {
        setIsConfirmationModalOpen(false); // Close the modal
    };

    const cancelPending = () => {
        setIsPendingModalOpen(false); // Close the modal
    };

    const cancelAlert = () => setIsAlertModalOpen(false);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-900 text-white">
                <Navbar />
                <div className="container mx-auto p-6">
                    <div className="flex items-center mb-6">
                        <h1 className="text-3xl font-bold text-center flex-grow">Edit Change Request</h1>
                    </div>

                    <div className="mb-6 p-4 bg-gray-800 rounded relative">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-2xl font-semibold">Request Flow</h2>
                            <button
                                className="border font-medium border-white text-white rounded-full px-4 py-1 transition duration-300 hover:bg-white hover:text-gray-800"
                                onClick={openModal} // Replace with your function
                            >
                                Scheduled Migrations
                            </button>
                        </div>

                        <div className="mb-2 flex items-center">
                            <span className="font-medium mr-2">Requested by: </span> {formData.requester_name || "N/A"}
                            <button
                                className="ml-2 p-2 rounded-lg border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                                onClick={handleAlert}
                                title="Send alert email to requester"
                            >
                                <FaExclamationCircle className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="mb-4">    
                            <span className="font-medium mr-2">Approved by:</span> {formData.approver_name || "N/A"}
                        </div>

                        <div className="relative w-full">
                            <div className="flex justify-between items-start">
                                {statusSteps.map((step, index) => (
                                    <div key={step} className="flex flex-col items-center justify-center flex-1">
                                        <div
                                            className={`rounded-full h-8 w-8 flex items-center justify-center z-10 ${getNodeColor(step)}`}
                                        >
                                            {determineStatus(step) === 'completed' && <span className="text-white">✓</span>}
                                        </div>
                                        <p className={`text-sm mt-1 text-center ${getTextColor(step)}`}>
                                            {step.replace(/_/g, " ")}
                                        </p>
                                        {timestampMap[step as keyof typeof timestampMap] && (
                                            <p className={`text-xs text-gray-400 mt-1 text-center`}>
                                                {formatTimestamp(timestampMap[step])}
                                            </p>
                                        )}
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
                                        disabled={isFieldDisabled("name")}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="group" className="block text-sm font-medium text-gray-300">Group:</label>
                                    <select
                                        id="group"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.group}
                                        onChange={handleChange}
                                        required
                                        disabled={isFieldDisabled("group")}
                                    >
                                        <option value="group 1">Group 1</option>
                                        <option value="group 2">Group 2</option>
                                        <option value="group 3">Group 3</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="division" className="block text-sm font-medium text-gray-300">Division:</label>
                                    <select
                                        id="division"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.division}
                                        onChange={handleChange}
                                        required
                                        disabled={isFieldDisabled("division")}
                                    >
                                        <option value="">Select Division</option>
                                        <option value="IT">IT</option>
                                        <option value="ITS">ITS</option>
                                        <option value="DDB">DDB</option>
                                    </select>
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
                                        disabled={isFieldDisabled("type")}
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
                                        disabled={isFieldDisabled("category")}
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
                                        disabled={isFieldDisabled("urgency")}
                                    >
                                        <option value="">Select Urgency</option>
                                        <option value="emergency">Emergency</option>
                                        <option value="normal">Normal</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="requested_migration_date" className="block text-sm font-medium text-gray-300">Requested Migration Date:</label>
                                    <input
                                        type="datetime-local"
                                        id="requested_migration_date"
                                        title="Requested Migration Date"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.requested_migration_date 
                                            ? formatUTCStringToInput(formData.requested_migration_date)
                                            : ''
                                          }
                                        onChange={handleChange}
                                        required
                                        disabled={isFieldDisabled("requested_migration_date")}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="cab_meeting_date" className="block text-sm font-medium text-gray-300">CAB Meeting Date:</label>
                                    <input
                                        type="datetime-local"
                                        id="cab_meeting_date"
                                        title="CAB Meeting Date"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.cab_meeting_date 
                                            ? formatUTCStringToInput(formData.cab_meeting_date)
                                            : ''
                                          }
                                        onChange={handleChange}
                                        required
                                        disabled={isFieldDisabled("cab_meeting_date")}
                                    />
                                </div>
                            </div>

                            {/* Column 2 */}
                            <div className="flex flex-col w-1/3 gap-6">
                                <div className="flex flex-col">
                                    <label htmlFor="project_code" className="block text-sm font-medium text-gray-300">Project Code:</label>
                                    <input
                                        type="text"
                                        id="project_code"
                                        placeholder="Project Code"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.project_code}
                                        onChange={handleChange}
                                        required
                                        disabled={isFieldDisabled("project_code")}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="rfc_number" className="block text-sm font-medium text-gray-300">RFC Number:</label>
                                    <input
                                        type="text"
                                        id="rfc_number"
                                        placeholder="RFC Number"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.rfc_number}
                                        onChange={handleChange}
                                        required
                                        disabled={isFieldDisabled("rfc_number")}
                                    />
                                </div>

                                {fileFields.map((field) => {
                                    const backendFilename = formData[field] as string | null;
                                    const fileFieldKey = `${field}_file` as keyof FormDataState;
                                    const selectedFile = formData[fileFieldKey] as File | null;
                                    const hasFile = !!backendFilename || !!selectedFile; // Check if there's a file on the backend OR client
                                    const filename = selectedFile ? selectedFile.name : backendFilename;

                                    return (
                                        <div key={field} className="flex flex-col">
                                            <label
                                                htmlFor={field}
                                                className="block text-sm font-medium text-gray-300"
                                            >
                                                {field.replace("_", " ").toUpperCase()}:
                                            </label>
                                            <div className="flex items-center">
                                                <label
                                                    htmlFor={field}
                                                    className={`mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 cursor-pointer relative overflow-hidden ${hasFile ? "w-4/5" : ""
                                                        }`}
                                                >
                                                    <span
                                                        className={`block truncate ${!filename ? "text-gray-400" : ""
                                                            }`}
                                                    >
                                                        {selectedFile
                                                            ? truncateFilename(selectedFile.name, 40)
                                                            : backendFilename
                                                                ? truncateFilename(backendFilename, 40)
                                                                : `Choose ${field.replace("_", " ")}`}
                                                    </span>
                                                    <input
                                                        type="file"
                                                        id={field}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={(e) => handleFileChange(e, field)}
                                                        disabled={isFieldDisabled(field)}
                                                    />
                                                </label>
                                                {hasFile && (
                                                    <a
                                                        href={getDownloadURL(field) || undefined}
                                                        download={filename || ""}
                                                        target="_blank"
                                                        title={`Download ${field.replace("_", " ")}`}
                                                        className="ml-2 mt-1 w-10 h-10 p-2 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
                                                    >
                                                        <FaDownload className="text-white" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Column 3 */}
                            <div className="flex flex-col w-1/3 gap-6">
                                <div className="flex flex-col">
                                    <label htmlFor="pic" className="block text-sm font-medium text-gray-300">PIC:</label>
                                    <textarea
                                        id="pic"
                                        placeholder="PIC"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 h-10"
                                        value={formData.pic}
                                        onChange={handleChange}
                                        required
                                        disabled={isFieldDisabled("downtime_risk")}
                                />
                                </div>

                                <div className="flex flex-col">
                                    <label htmlFor="cab_meeting_link" className="block text-sm font-medium text-gray-300">CAB Meeting Link:</label>
                                    <input
                                        type="text"
                                        id="cab_meeting_link"
                                        placeholder="CAB Meeting Link"
                                        className="mt-1 block w-full p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.cab_meeting_link}
                                        onChange={handleChange}
                                        required
                                        disabled={isFieldDisabled("cab_meeting_link")}
                                    />
                                </div>

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
                                        disabled={isFieldDisabled("downtime_risk")}
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
                                        disabled={isFieldDisabled("integration_risk")}
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
                                        disabled={isFieldDisabled("uat_result")}
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
                                        disabled={isFieldDisabled("description")}
                                    />

                                    <label htmlFor="post_implementation_review" className="block text-sm font-medium text-gray-300 mt-4">Post Implementation Review:</label>
                                    <textarea
                                        id="post_implementation_review"
                                        placeholder="Post Implementation Review"
                                        className="mt-1 block w-full h-1/2 p-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.post_implementation_review || ''}
                                        onChange={handleChange}
                                        disabled={isFieldDisabled("post_implementation_review")}
                                    />

                                </div>
                            </div>
                        </div>

                        {getButton()}
                    </form>
                </div>
            </div>
            <AlertModal
                isOpen={isAlertModalOpen}
                onConfirm={confirmAlert}
                onCancel={cancelAlert}
                alertCount={formData.alert_count}
                alertLimit={alertLimit}
            />
            <PreviousMigrationsModal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                history={migrationHistory}
            />
            <PendingModal
                isOpen={isPendingModalOpen}
                onConfirm={confirmPending}
                onCancel={cancelPending}
            />
            <ConfirmationModal
                isOpen={isConfirmationModalOpen}
                onConfirm={confirmSubmit}
                onCancel={cancelSubmit}
                message="Are you sure you want to update this change request?"
            />
        </ProtectedRoute>
    );
}