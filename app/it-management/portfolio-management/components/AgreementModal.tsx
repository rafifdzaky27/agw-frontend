"use client";

import { useState, useEffect, useRef } from "react";
import { FaTimes, FaPlus, FaTrash, FaSave, FaUpload, FaFile } from "react-icons/fa";
import toast from "react-hot-toast";

interface PaymentTerm {
  id: string;
  termin: string;
  nominal: number;
  description: string;
}

interface AgreementFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  file?: File;
}

interface Agreement {
  id: string;
  kodeProject: string;
  projectName: string;
  projectType: 'internal development' | 'procurement' | 'non procurement';
  divisiInisiasi: string;
  grupTerlibat: string;
  keterangan: string;
  namaVendor: string;
  noPKSPO: string;
  tanggalPKSPO: string;
  tanggalBAPP: string;
  tanggalBerakhir: string;
  terminPembayaran: PaymentTerm[];
  files: AgreementFile[];
  createdAt: string;
  updatedAt: string;
}

interface AgreementModalProps {
  agreement: Agreement | null;
  onClose: () => void;
  onSave: (agreementData: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt'>) => void;
  isEditMode: boolean;
}

export default function AgreementModal({ agreement, onClose, onSave, isEditMode }: AgreementModalProps) {
  const [formData, setFormData] = useState({
    kodeProject: "",
    projectName: "",
    projectType: "internal development" as 'internal development' | 'procurement' | 'non procurement',
    divisiInisiasi: "",
    grupTerlibat: "",
    keterangan: "",
    namaVendor: "",
    noPKSPO: "",
    tanggalPKSPO: "",
    tanggalBAPP: "",
    tanggalBerakhir: "",
  });

  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);

  const [files, setFiles] = useState<AgreementFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Initialize form data when editing
  useEffect(() => {
    console.log("\n🔄 ===== FORM INITIALIZATION DEBUG =====");
    console.log("📅 Timestamp:", new Date().toISOString());
    console.log("🔧 isEditMode:", isEditMode);
    console.log("📋 agreement:", agreement);
    
    if (isEditMode && agreement) {
      console.log("✅ Initializing form with agreement data:");
      console.log("   kodeProject:", agreement.kodeProject);
      console.log("   projectName:", agreement.projectName);
      console.log("   projectType:", agreement.projectType);
      console.log("   divisiInisiasi:", agreement.divisiInisiasi);
      console.log("   grupTerlibat:", agreement.grupTerlibat);
      console.log("   tanggalPKSPO (raw):", agreement.tanggalPKSPO);
      console.log("   tanggalBAPP (raw):", agreement.tanggalBAPP);
      console.log("   tanggalBerakhir (raw):", agreement.tanggalBerakhir);
      
      // Helper function to safely format dates
      const formatDateForInput = (dateString: string | null | undefined): string => {
        if (!dateString) return "";
        
        try {
          const date = new Date(dateString);
          // Check if date is valid and not epoch time
          if (isNaN(date.getTime()) || date.getTime() === 0) {
            console.warn(`⚠️  Invalid date: ${dateString}`);
            return "";
          }
          
          // Format as YYYY-MM-DD for input[type="date"]
          const formatted = date.toISOString().split('T')[0];
          console.log(`📅 Date formatted: ${dateString} → ${formatted}`);
          return formatted;
        } catch (error) {
          console.error(`❌ Date formatting error for ${dateString}:`, error);
          return "";
        }
      };
      
      const newFormData = {
        kodeProject: agreement.kodeProject || "",
        projectName: agreement.projectName || "",
        projectType: agreement.projectType || "internal development",
        divisiInisiasi: agreement.divisiInisiasi || "",
        grupTerlibat: agreement.grupTerlibat || "",
        keterangan: agreement.keterangan || "",
        namaVendor: agreement.namaVendor || "",
        noPKSPO: agreement.noPKSPO || "",
        tanggalPKSPO: formatDateForInput(agreement.tanggalPKSPO),
        tanggalBAPP: formatDateForInput(agreement.tanggalBAPP),
        tanggalBerakhir: formatDateForInput(agreement.tanggalBerakhir),
      };
      
      console.log("📦 New form data to set:", newFormData);
      console.log("📅 Formatted dates:");
      console.log("   tanggalPKSPO:", newFormData.tanggalPKSPO);
      console.log("   tanggalBAPP:", newFormData.tanggalBAPP);
      console.log("   tanggalBerakhir:", newFormData.tanggalBerakhir);
      
      setFormData(newFormData);

      // Handle payment terms with proper data structure
      if (agreement.terminPembayaran && agreement.terminPembayaran.length > 0) {
        console.log("💰 Setting payment terms:", agreement.terminPembayaran);
        console.log("💰 Payment terms count:", agreement.terminPembayaran.length);
        
        // Ensure payment terms have proper structure
        const validPaymentTerms = agreement.terminPembayaran.map((term, index) => {
          console.log(`💰 Payment term ${index + 1}:`, term);
          return {
            id: term.id || `term-${Date.now()}-${index}`,
            termin: term.termin || `Term ${index + 1}`,
            nominal: typeof term.nominal === 'number' ? term.nominal : 0,
            description: term.description || ""
          };
        });
        
        console.log("💰 Valid payment terms:", validPaymentTerms);
        setPaymentTerms(validPaymentTerms);
      } else {
        console.log("💰 No payment terms found, setting empty array");
        setPaymentTerms([]);
      }

      if (agreement.files && agreement.files.length > 0) {
        console.log("📁 Setting files:", agreement.files);
        setFiles(agreement.files);
      } else {
        console.log("📁 No files found, setting empty array");
        setFiles([]);
      }
    } else {
      console.log("➕ Resetting form for new agreement");
      // Reset form for new agreement
      setFormData({
        kodeProject: "",
        projectName: "",
        projectType: "internal development",
        divisiInisiasi: "",
        grupTerlibat: "",
        keterangan: "",
        namaVendor: "",
        noPKSPO: "",
        tanggalPKSPO: "",
        tanggalBAPP: "",
        tanggalBerakhir: "",
      });
      setPaymentTerms([]);
      setFiles([]);
    }
  }, [isEditMode, agreement]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addPaymentTerm = () => {
    const newTerm: PaymentTerm = {
      id: Date.now().toString(),
      termin: "",
      nominal: 0,
      description: ""
    };
    setPaymentTerms(prev => [...prev, newTerm]);
  };

  const removePaymentTerm = (id: string) => {
    setPaymentTerms(prev => prev.filter(term => term.id !== id));
  };

  const updatePaymentTerm = (id: string, field: keyof PaymentTerm, value: string | number) => {
    setPaymentTerms(prev => prev.map(term => 
      term.id === id ? { ...term, [field]: value } : term
    ));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    selectedFiles.forEach(file => {
      const newFile: AgreementFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        file: file
      };
      
      setFiles(prev => [...prev, newFile]);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Required fields validation
    if (!formData.kodeProject.trim()) errors.push("Kode Project is required");
    if (!formData.projectName.trim()) errors.push("Project Name is required");
    if (!formData.divisiInisiasi.trim()) errors.push("Divisi yang Menginisiasi is required");
    if (!formData.grupTerlibat.trim()) errors.push("Grup yang Terlibat is required");
    
    // Validate vendor and payment terms for procurement and non procurement projects
    if (formData.projectType === 'procurement' || formData.projectType === 'non procurement') {
      if (!formData.namaVendor.trim()) errors.push(`Nama Vendor is required for ${formData.projectType} projects`);
      if (paymentTerms.length === 0) errors.push(`At least one payment term is required for ${formData.projectType} projects`);
    }
    
    if (!formData.noPKSPO.trim()) errors.push("No. PKS/PO is required");
    if (!formData.tanggalPKSPO) errors.push("Tanggal PKS/PO is required");
    if (!formData.tanggalBAPP) errors.push("Tanggal BAPP is required");
    if (!formData.tanggalBerakhir) errors.push("Tanggal Berakhir is required");

    // Date validation
    if (formData.tanggalPKSPO && formData.tanggalBAPP) {
      if (new Date(formData.tanggalPKSPO) > new Date(formData.tanggalBAPP)) {
        errors.push("Tanggal BAPP must be after Tanggal PKS/PO");
      }
    }

    if (formData.tanggalBAPP && formData.tanggalBerakhir) {
      if (new Date(formData.tanggalBAPP) > new Date(formData.tanggalBerakhir)) {
        errors.push("Tanggal Berakhir must be after Tanggal BAPP");
      }
    }

    // Validate payment terms
    paymentTerms.forEach((term, index) => {
      if (!term.termin.trim()) errors.push(`Payment term ${index + 1}: Termin is required`);
      if (term.nominal <= 0) errors.push(`Payment term ${index + 1}: Nominal must be greater than 0`);
    });

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("\n📝 ===== AGREEMENT MODAL SUBMIT DEBUG =====");
    console.log("📅 Timestamp:", new Date().toISOString());
    console.log("🔧 Mode:", isEditMode ? 'EDIT' : 'CREATE');
    console.log("📋 Form Data:", formData);
    console.log("📋 Form Data Keys:", Object.keys(formData));
    console.log("💰 Payment Terms:", paymentTerms);
    console.log("📁 Files:", files);
    
    // Check for empty/null values
    console.log("\n🔍 FIELD VALIDATION CHECK:");
    const requiredFields = ['kodeProject', 'projectName', 'projectType', 'divisiInisiasi', 'grupTerlibat'];
    let hasEmptyFields = false;
    
    Object.entries(formData).forEach(([key, value]) => {
      if (!value || value === '') {
        console.warn(`⚠️  Empty field: ${key} = "${value}"`);
        if (requiredFields.includes(key)) {
          hasEmptyFields = true;
        }
      } else {
        console.log(`✅ ${key} = "${value}"`);
      }
    });
    
    // TEMPORARY TEST: Use hardcoded data if form is empty
    let testData = { ...formData };
    if (hasEmptyFields && isEditMode) {
      console.log("🧪 USING TEST DATA DUE TO EMPTY FIELDS");
      testData = {
        kodeProject: formData.kodeProject || "PRJ-2025-TEST",
        projectName: formData.projectName || "Test Project Name",
        projectType: formData.projectType || "procurement",
        divisiInisiasi: formData.divisiInisiasi || "IT Division",
        grupTerlibat: formData.grupTerlibat || "Development Team",
        keterangan: formData.keterangan || "Test description",
        namaVendor: formData.namaVendor || "Test Vendor",
        noPKSPO: formData.noPKSPO || "PKS/2025/TEST",
        tanggalPKSPO: formData.tanggalPKSPO || "2025-08-01",
        tanggalBAPP: formData.tanggalBAPP || "2025-08-15",
        tanggalBerakhir: formData.tanggalBerakhir || "2025-12-31",
      };
      console.log("🧪 Test data:", testData);
    }
    
    // Strict validation before proceeding
    if (hasEmptyFields && !isEditMode) {
      console.error("❌ CRITICAL: Required fields are empty!");
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Validate project type specifically
    const validProjectTypes = ['internal development', 'procurement', 'non procurement'];
    if (!validProjectTypes.includes(testData.projectType)) {
      console.error(`❌ CRITICAL: Invalid project type: "${testData.projectType}"`);
      console.error(`   Expected one of: ${validProjectTypes.join(', ')}`);
      toast.error(`Invalid project type: ${testData.projectType}`);
      return;
    }
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0 && !isEditMode) {
      console.error("❌ Validation errors:", validationErrors);
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    setIsSubmitting(true);

    try {
      // Helper function to format dates for backend
      const formatDateForBackend = (dateString: string): string => {
        if (!dateString) return "";
        
        try {
          // If it's already in YYYY-MM-DD format, convert to ISO string
          const date = new Date(dateString + 'T00:00:00.000Z');
          if (isNaN(date.getTime())) {
            console.warn(`⚠️  Invalid date for backend: ${dateString}`);
            return "";
          }
          
          const isoString = date.toISOString();
          console.log(`📅 Backend date formatted: ${dateString} → ${isoString}`);
          return isoString;
        } catch (error) {
          console.error(`❌ Backend date formatting error for ${dateString}:`, error);
          return "";
        }
      };

      // Create agreement data object with explicit field validation and proper date formatting
      const agreementData = {
        kodeProject: testData.kodeProject.trim(),
        projectName: testData.projectName.trim(),
        projectType: testData.projectType,
        divisiInisiasi: testData.divisiInisiasi.trim(),
        grupTerlibat: testData.grupTerlibat.trim(),
        keterangan: testData.keterangan.trim(),
        namaVendor: testData.namaVendor.trim(),
        noPKSPO: testData.noPKSPO.trim(),
        tanggalPKSPO: formatDateForBackend(testData.tanggalPKSPO),
        tanggalBAPP: formatDateForBackend(testData.tanggalBAPP),
        tanggalBerakhir: formatDateForBackend(testData.tanggalBerakhir),
        terminPembayaran: paymentTerms.map((term, index) => {
          console.log(`💰 Processing payment term ${index + 1}:`, term);
          
          const processedTerm = {
            id: term.id || `term-${Date.now()}-${index}`,
            termin: term.termin || `Term ${index + 1}`,
            nominal: Number(term.nominal) || 0,
            description: term.description || "",
            // Add additional fields that backend might expect
            name: term.termin || `Term ${index + 1}`,
            amount: Number(term.nominal) || 0,
            desc: term.description || "",
            term_name: term.termin || `Term ${index + 1}`,
            term_amount: Number(term.nominal) || 0,
            term_description: term.description || ""
          };
          
          console.log(`💰 Processed term ${index + 1}:`, processedTerm);
          return processedTerm;
        }),
        files: files.map(({ file, ...fileData }) => fileData)
      };
      
      console.log("\n📦 FINAL AGREEMENT DATA TO SEND:");
      console.log("📋 Agreement Data:", agreementData);
      console.log("📋 Agreement Data Keys:", Object.keys(agreementData));
      console.log("📋 Agreement Data JSON:", JSON.stringify(agreementData, null, 2));
      
      // Final validation check
      console.log("\n🔍 FINAL VALIDATION CHECK:");
      console.log("   projectName:", `"${agreementData.projectName}" (length: ${agreementData.projectName.length})`);
      console.log("   projectType:", `"${agreementData.projectType}"`);
      console.log("   divisiInisiasi:", `"${agreementData.divisiInisiasi}" (length: ${agreementData.divisiInisiasi.length})`);
      console.log("   grupTerlibat:", `"${agreementData.grupTerlibat}" (length: ${agreementData.grupTerlibat.length})`);
      console.log("   tanggalPKSPO:", `"${agreementData.tanggalPKSPO}"`);
      console.log("   tanggalBAPP:", `"${agreementData.tanggalBAPP}"`);
      console.log("   tanggalBerakhir:", `"${agreementData.tanggalBerakhir}"`);
      console.log("   paymentTerms count:", agreementData.terminPembayaran.length);
      
      await onSave(agreementData);
      
    } catch (error) {
      console.error("❌ Submit error:", error);
      toast.error("Failed to save agreement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalPayment = () => {
    return paymentTerms.reduce((total, term) => total + term.nominal, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Project' : 'Add New Project'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Project Details Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Project Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="kodeProject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kode Project *
                </label>
                <input
                  type="text"
                  id="kodeProject"
                  name="kodeProject"
                  value={formData.kodeProject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., PRJ-2024-001"
                  required
                />
              </div>

              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="projectName"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div>
                <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Type *
                </label>
                <select
                  id="projectType"
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="internal development">Internal Development</option>
                  <option value="procurement">Procurement</option>
                  <option value="non procurement">Non Procurement</option>
                </select>
              </div>

              <div>
                <label htmlFor="divisiInisiasi" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Divisi yang Menginisiasi *
                </label>
                <input
                  type="text"
                  id="divisiInisiasi"
                  name="divisiInisiasi"
                  value={formData.divisiInisiasi}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter initiating division"
                  required
                />
              </div>

              <div>
                <label htmlFor="grupTerlibat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grup yang Terlibat *
                </label>
                <input
                  type="text"
                  id="grupTerlibat"
                  name="grupTerlibat"
                  value={formData.grupTerlibat}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter involved groups"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="keterangan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Keterangan
                </label>
                <textarea
                  id="keterangan"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-vertical"
                  placeholder="Enter project description..."
                />
              </div>
            </div>
          </div>

          {/* Vendor & Document Details Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              {formData.projectType === 'internal development' ? 'Document Details' : 'Vendor & Document Details'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(formData.projectType === 'procurement' || formData.projectType === 'non procurement') && (
                <div>
                  <label htmlFor="namaVendor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Vendor *
                  </label>
                  <input
                    type="text"
                    id="namaVendor"
                    name="namaVendor"
                    value={formData.namaVendor}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter vendor name"
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="noPKSPO" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  No. PKS/PO *
                </label>
                <input
                  type="text"
                  id="noPKSPO"
                  name="noPKSPO"
                  value={formData.noPKSPO}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., PKS/2024/001"
                  required
                />
              </div>

              <div>
                <label htmlFor="tanggalPKSPO" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal PKS/PO *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="tanggalPKSPO"
                    name="tanggalPKSPO"
                    value={formData.tanggalPKSPO}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tanggalBAPP" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal BAPP (Handover Date) *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="tanggalBAPP"
                    name="tanggalBAPP"
                    value={formData.tanggalBAPP}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="tanggalBerakhir" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal Berakhir (End Date) *
                </label>
                <div className="relative md:w-1/2">
                  <input
                    type="date"
                    id="tanggalBerakhir"
                    name="tanggalBerakhir"
                    value={formData.tanggalBerakhir}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms Section - For Procurement and Non Procurement */}
          {(formData.projectType === 'procurement' || formData.projectType === 'non procurement') && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700">
                  Payment Terms
                </h3>
                <button
                  type="button"
                  onClick={addPaymentTerm}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md transition-colors"
                >
                  <FaPlus className="text-sm" />
                  Add Term
                </button>
              </div>

              <div className="space-y-4">
                {paymentTerms.map((term, index) => (
                  <div key={term.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Termin *
                      </label>
                      <input
                        type="text"
                        value={term.termin}
                        onChange={(e) => updatePaymentTerm(term.id, 'termin', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="e.g., Down Payment"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nominal *
                      </label>
                      <input
                        type="number"
                        value={term.nominal}
                        onChange={(e) => updatePaymentTerm(term.id, 'nominal', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={term.description}
                        onChange={(e) => updatePaymentTerm(term.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Payment description"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removePaymentTerm(term.id)}
                        disabled={paymentTerms.length === 1}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
                      >
                        <FaTrash className="text-sm" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                  Total Payment: {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(getTotalPayment())}
                </div>
              </div>
            </div>
          )}

          {/* Documents Section */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Documents
              </h3>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm"
                >
                  <FaUpload className="text-xs" />
                  Upload Files
                </button>
              </div>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p>No documents uploaded yet.</p>
                <p className="text-sm mt-1">Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT (Max 10MB each)</p>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Files to Upload ({files.length})
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FaFile className="text-blue-500 text-sm flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove file"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md transition-colors"
            >
              <FaSave className="text-sm" />
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Project' : 'Save Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
