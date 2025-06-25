"use client";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { toast } from 'react-hot-toast';

// Define default configuration values
const defaultConfig = {
    reminderDays: "7",
    requestAlertLimit: "3", // Added requestAlertLimit
    alertBlastSubject: "Reminder Kelengkapan Dokumen CAB ${currentDate}",
    alertBlastBody: `Kepada Yth.
Bapak/Ibu sebagai pengaju CAB

Dengan hormat,

Sehubungan dengan kebutuhan dokumen untuk proses CAB, kami informasikan bahwa proses persetujuan saat ini memerlukan kelengkapan dokumen pendukung agar dapat dilanjutkan ke tahap selanjutnya.

Maka dari itu, kami mohon kesediaan Anda untuk melengkapi dokumen-dokumen berikut:

Daftar dokumen yang perlu dilengkapi:
1. Compliance Checklist
2. Procedure Checklist
3. Rollback Checklist
4. Architecture Diagram
5. Captures
6. Final Report

Mohon agar dokumen-dokumen tersebut dapat dilengkapi secepatnya untuk memastikan CAB dapat diproses dan diselesaikan dengan baik.

Atas perhatian dan kerja samanya, kami ucapkan terima kasih.

Hormat kami,  
\${user?.name || "Admin"}
Change Request Advisory Board`,
    requestAlertSubject: "Permintaan Kelengkapan Dokumen untuk Change Request: ${formData.name}",
    requestAlertBody: `Kepada Yth.  
\${formData.requester_name || "Requester"}

Dengan hormat,

Sehubungan dengan pengajuan Change Request dengan judul "\${formData.name}", kami informasikan bahwa proses persetujuan saat ini memerlukan kelengkapan dokumen pendukung agar dapat dilanjutkan ke tahap selanjutnya.

Maka dari itu, kami mohon kesediaan Anda untuk melengkapi dokumen-dokumen berikut:

Daftar dokumen yang perlu dilengkapi:
1. Compliance Checklist :  [\${formData.compliance_checklist ? "Lengkap" : "Belum Lengkap"}]
2. Procedure Checklist : [\${formData.procedure_checklist ? "Lengkap" : "Belum Lengkap"}]
3. Rollback Checklist : [\${formData.rollback_checklist ? "Lengkap" : "Belum Lengkap"}]
4. Architecture Diagram : [\${formData.architecture_diagram ? "Lengkap" : "Belum Lengkap"}]
5. Captures : [\${formData.captures ? "Lengkap" : "Belum Lengkap"}]
6. Final Report : [\${formData.completion_report ? "Lengkap" : "Belum Lengkap"}]

Keterangan:
- Lengkap: Telah diterima dan sesuai
- Belum Lengkap: Belum tersedia atau masih perlu revisi

Mohon agar dokumen-dokumen tersebut dapat dilengkapi secepatnya untuk memastikan Change Request "\${formData.name}" dapat diproses dan diselesaikan dengan baik.

Atas perhatian dan kerja samanya, kami ucapkan terima kasih.

Hormat kami,  
\${formData.approver_name || "Approver"}  
Change Request Advisory Board`
};

export default function Dashboard() {
    const { token } = useAuth();
    const [config, setConfig] = useState({ ...defaultConfig });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadConfig = async () => {
            if (!token) return;
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/api/config/all`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    const configData: { key: string; value: string }[] = data.data;

                    const mappedConfig = {
                        reminderDays: configData.find((item: { key: string; value: string }) => item.key === 'automatic_email_alert_duration')?.value || defaultConfig.reminderDays,
                        requestAlertLimit: configData.find((item: { key: string; value: string }) => item.key === 'request_email_alert_limit')?.value || defaultConfig.requestAlertLimit, // Fetch requestAlertLimit from backend
                        alertBlastSubject: configData.find((item: { key: string; value: string }) => item.key === 'blast_email_alert_subject')?.value || defaultConfig.alertBlastSubject,
                        alertBlastBody: configData.find((item: { key: string; value: string }) => item.key === 'blast_email_alert_text')?.value || defaultConfig.alertBlastBody,
                        requestAlertSubject: configData.find((item: { key: string; value: string }) => item.key === 'request_email_alert_subject')?.value || defaultConfig.requestAlertSubject,
                        requestAlertBody: configData.find((item: { key: string; value: string }) => item.key === 'request_email_alert_text')?.value || defaultConfig.requestAlertBody,
                    };

                    setConfig(mappedConfig);
                } else {
                    setError(data.message || "Failed to load configuration");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unexpected error occurred");
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setConfig((prevConfig) => ({
            ...prevConfig,
            [id]: value,
        }));
    };

    const handleSave = async () => {
        const loadingToast = toast.loading("Saving configuration...");

        try {
            const updates = [
                { key: "automatic_email_alert_duration", value: config.reminderDays },
                { key: "request_email_alert_limit", value: config.requestAlertLimit }, // Include requestAlertLimit in updates
                { key: "blast_email_alert_subject", value: config.alertBlastSubject },
                { key: "blast_email_alert_text", value: config.alertBlastBody },
                { key: "request_email_alert_subject", value: config.requestAlertSubject },
                { key: "request_email_alert_text", value: config.requestAlertBody },
            ];

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/api/config`, { // Replace with your actual API endpoint
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Ensure you have the token in your context
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            toast.dismiss(loadingToast); // Dismiss loading toast
            toast.success("Configuration saved successfully!");

        } catch (error) {
            console.error("Error saving configuration:", error);
            toast.dismiss(loadingToast); // Dismiss loading toast
            toast.error("Failed to save configuration. See console for details.");
        }
    };

    const handleReset = () => {
        setConfig({ ...defaultConfig });
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['approver', 'master']}>
                <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                    <p>Loading configuration...</p>
                </div>
            </ProtectedRoute>
        );
    }

    if (error) {
        return (
            <ProtectedRoute allowedRoles={['approver', 'master']}>
                <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                    <p className="text-red-500">Error: {error}</p>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['approver', 'master']}>
            <div>
                <Navbar />
                <div className="container mx-auto p-6">
                    <div className="flex items-center mb-6">
                        <h1 className="text-3xl font-bold text-center flex-grow">Email Configuration</h1>
                    </div>

                    <form className="flex flex-col gap-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                         {/* Automatic Reminder & Request Limit */}
                        <div className="flex flex-row gap-6">
                            <div className="flex flex-col w-1/2">
                                <label htmlFor="reminderDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Automatic Reminder (Days):</label>
                                <input
                                    type="number"
                                    id="reminderDays"
                                    className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                                    value={config.reminderDays}
                                    onChange={handleChange}
                                />
                            </div>

                             <div className="flex flex-col w-1/2">
                                <label htmlFor="requestAlertLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Request Alert Email Limit:</label>
                                <input
                                    type="number"
                                    id="requestAlertLimit"
                                    className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                                    value={config.requestAlertLimit}
                                    onChange={handleChange}
                                />
                            </div>
                         </div>
                        {/* Two-Column Layout for Email Templates */}
                        <div className="flex flex-row gap-6">
                            {/* Request Specific Alert Email Template */}
                            <div className="flex flex-col w-1/2">
                                <label htmlFor="requestAlertSubject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Request Alert Email Subject:</label>
                                <input
                                    type="text"
                                    id="requestAlertSubject"
                                    className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                                    value={config.requestAlertSubject}
                                    onChange={handleChange}
                                />
                            </div>
                            {/* Alert Blast Email Template */}
                            <div className="flex flex-col w-1/2">
                                <label htmlFor="alertBlastSubject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alert Blast Email Subject:</label>
                                <input
                                    type="text"
                                    id="alertBlastSubject"
                                    className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                                    value={config.alertBlastSubject}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="flex flex-row gap-6">
                            {/* Request Specific Alert Email Body */}
                            <div className="flex flex-col w-1/2">
                                <label htmlFor="requestAlertBody" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Request Alert Email Body:</label>
                                <textarea
                                    id="requestAlertBody"
                                    rows={20} // Increased rows
                                    className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                                    value={config.requestAlertBody}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                            {/* Alert Blast Email Body */}
                            <div className="flex flex-col w-1/2">
                                <label htmlFor="alertBlastBody" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alert Blast Email Body:</label>
                                <textarea
                                    id="alertBlastBody"
                                    rows={20} // Increased rows
                                    className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                                    value={config.alertBlastBody}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                        </div>
                        {/* Button Container */}
                        <div className="flex justify-between gap-4 mt-3">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="w-1/2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-500 dark:hover:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors mr-2"
                            >
                                Reset to Default
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="w-1/2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ProtectedRoute>
    );
}