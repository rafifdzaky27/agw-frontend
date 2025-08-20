"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import { FaDownload, FaSave } from 'react-icons/fa';
import ProtectedRoute from "@/components/ProtectedRoute";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import BackButton from '@/components/BackButton';

interface FormDataState {
  name: string;
  group: string;
  division: string;
  type: string;
  category: string;
  urgency: string;
  requested_migration_date: string;
  project_code: string;
  rfc_number: string;
  compliance_checklist: File | null;
  procedure_checklist: File | null;
  rollback_checklist: File | null;
  architecture_diagram: File | null;
  captures: File | null;
  pic: string;
  cab_meeting_link: string;
  downtime_risk: number;
  integration_risk: number;
  uat_result: string;
  description: string;
}

export default function ChangeRequestForm() {
  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    group: "group 1",
    division: "IT",
    type: "software",
    category: "monitoring",
    urgency: "normal",
    requested_migration_date: "",
    project_code: "",
    rfc_number: "",
    compliance_checklist: null,
    procedure_checklist: null,
    rollback_checklist: null,
    architecture_diagram: null,
    captures: null,
    pic: "",
    cab_meeting_link: "",
    downtime_risk: 0,
    integration_risk: 0,
    uat_result: "none",
    description: "",
  });

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    setIsConfirmationModalOpen(true);
  }

  const confirmSubmit = async () => {
    setIsConfirmationModalOpen(false);
    const loadingToast = toast.loading("Adding request...");
    setLoading(true);

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

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/api/cab/requests`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
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
        setError(result.message || "Failed to create change request.");
        return;
      }

      toast.dismiss(loadingToast);
      toast.success("Change request created successfully.");

      setFormData({
        name: "",
        group: "",
        division: "",
        type: "software",
        category: "monitoring",
        urgency: "normal",
        requested_migration_date: "",
        project_code: "",
        rfc_number: "",
        compliance_checklist: null,
        procedure_checklist: null,
        rollback_checklist: null,
        architecture_diagram: null,
        captures: null,
        pic: "",
        cab_meeting_link: "",
        downtime_risk: 0,
        integration_risk: 0,
        uat_result: "none",
        description: "",
      });

      setTimeout(() => {
        router.push('/it-management/change-management');
      }, 1000);

    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err instanceof Error ? err.message : "Unknown error");
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const cancelSubmit = () => {
    setIsConfirmationModalOpen(false);
  };

  return (
    <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
        <Sidebar />
        <div className="flex-1 md:ml-60 p-6">
          <BackButton />
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Create Change Request
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Submit a new change request for IT infrastructure or software modifications
              </p>
            </div>
          </div>

          {loading && <div className="text-center text-blue-600 dark:text-gray-300 font-medium">Loading...</div>}
          {error && <div className="text-center text-red-600 dark:text-red-400 font-medium">{error}</div>}

          {(!loading && !error) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Change Request</h2>
                  <div className="flex items-center gap-1">
                    <button
                      type="submit"
                      form="change-request-form"
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      title="Save change request"
                    >
                      <FaSave className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                    <button
                      type="button"
                      onClick={() => router.push('/it-management/change-management')}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <form id="change-request-form" onSubmit={handleSubmit}>
              <div className="flex flex-row gap-6">
                {/* Column 1 */}
                <div className="flex flex-col w-1/3 gap-6">
                  <div className="flex flex-col">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Request Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      placeholder="Enter request name"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="group" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Group <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="group"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={formData.group}
                      onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                      required
                    >
                      <option value="group 1">Group 1</option>
                      <option value="group 2">Group 2</option>
                      <option value="group 3">Group 3</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="division" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Division <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="division"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={formData.division}
                      onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                      required
                    >
                      <option value="IT">IT</option>
                      <option value="ITS">ITS</option>
                      <option value="DDB">DDB</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Request Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                    >
                      <option value="software">Software</option>
                      <option value="hardware">Hardware</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Request Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="monitoring">Monitoring</option>
                      <option value="transactional">Transactional</option>
                      <option value="regulatory">Regulatory</option>
                      <option value="reporting">Reporting</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Urgency <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="urgency"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={formData.urgency}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                      required
                    >
                      <option value="normal">Normal</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="requested_migration_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Requested Migration Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="requested_migration_date"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={formData.requested_migration_date}
                      onChange={(e) => setFormData({ ...formData, requested_migration_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Column 2 */}
                <div className="flex flex-col w-1/3 gap-6">
                  <div className="flex flex-col">
                    <label htmlFor="project_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Code
                    </label>
                    <input
                      type="text"
                      id="project_code"
                      placeholder="Enter project code"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={formData.project_code}
                      onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="rfc_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      RFC Number
                    </label>
                    <input
                      type="text"
                      id="rfc_number"
                      placeholder="Enter RFC number"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={formData.rfc_number}
                      onChange={(e) => setFormData({ ...formData, rfc_number: e.target.value })}
                    />
                  </div>

                  {["compliance_checklist", "procedure_checklist", "rollback_checklist", "architecture_diagram", "captures"].map((field) => {
                    const typedField = field as keyof FormDataState;
                    const hasValue = !!formData[typedField];
                    const filename = formData[typedField] ? (formData[typedField] as File).name : `Choose ${field.replace("_", " ")}`;
                    const truncatedFilename = hasValue ? truncateFilename(filename, 40) : filename;

                    return (
                      <div key={field} className="flex flex-col">
                        <label htmlFor={field} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {field.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}{field === "compliance_checklist" ? " *" : ""}
                        </label>
                        <div className="relative">
                          <label
                            htmlFor={field}
                            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent dark:bg-gray-700 cursor-pointer flex items-center justify-between"
                          >
                            <span className={`truncate ${!formData[typedField] ? 'text-gray-400 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                              {truncatedFilename}
                            </span>
                            {formData[typedField] && (
                              <button
                                type="button"
                                title={`Download ${field.replace("_", " ")}`}
                                className="ml-2 p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDownloadFile(typedField);
                                }}
                              >
                                <FaDownload className="w-4 h-4" />
                              </button>
                            )}
                            <input
                              type="file"
                              id={field}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => handleFileChange(e, typedField)}
                              required={field === "compliance_checklist"}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Column 3 */}
                <div className="flex flex-col w-1/3 gap-6">
                  <div className="flex flex-col">
                    <label htmlFor="pic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      PIC (Person in Charge)
                    </label>
                    <input
                      type="text"
                      id="pic"
                      placeholder="Enter person in charge"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={formData.pic}
                      onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="cab_meeting_link" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CAB Meeting Link
                    </label>
                    <input
                      type="text"
                      id="cab_meeting_link"
                      placeholder="Enter CAB meeting link"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={formData.cab_meeting_link}
                      onChange={(e) => setFormData({ ...formData, cab_meeting_link: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="downtime_risk" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Downtime Risk <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="downtime_risk"
                      min="0"
                      placeholder="Enter downtime risk"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={formData.downtime_risk}
                      onChange={(e) => setFormData({ ...formData, downtime_risk: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="integration_risk" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Integration Risk (0-10) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="integration_risk"
                      min="0"
                      max="10"
                      placeholder="Enter integration risk (0-10)"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={formData.integration_risk}
                      onChange={(e) => setFormData({ ...formData, integration_risk: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="uat_result" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      UAT Score
                    </label>
                    <select
                      id="uat_result"
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={formData.uat_result}
                      onChange={(e) => setFormData({ ...formData, uat_result: e.target.value })}
                    >
                      <option value="none">None</option>
                      <option value="done with notes">Done with Notes</option>
                      <option value="well done">Well Done</option>
                    </select>
                  </div>

                  {/* Description spans the remaining space */}
                  <div className="flex flex-col flex-grow">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      placeholder="Enter request description"
                      className="w-full h-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

                </form>
              </div>
            </div>
          )}

          <ConfirmationModal
            isOpen={isConfirmationModalOpen}
            onConfirm={confirmSubmit}
            onCancel={cancelSubmit}
            message="Are you sure you want to submit this change request?"
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}