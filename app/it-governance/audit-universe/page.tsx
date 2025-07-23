"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaPlus, FaCalendarAlt, FaFileAlt, FaEdit, FaSearch, FaCheck, FaTimes, FaTrash, FaFileExcel } from "react-icons/fa";
import * as XLSX from 'xlsx';
import NewAuditModal from "./components/NewAuditModal";
import AuditDetailModal from "./components/AuditDetailModal";
import toast from "react-hot-toast";

// Define interfaces
interface AuditFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface Audit {
  id: string;
  auditName: string;
  category: "Internal" | "Regulatory" | "External";
  auditor: string;
  date: string; // Format: YYYY-MM
  scope: string;
  files: AuditFile[];
  createdAt: string;
  updatedAt: string;
}

export default function AuditUniversePage() {
  const { user, token } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewAuditModal, setShowNewAuditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAudits, setSelectedAudits] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState({
    Internal: 1,
    Regulatory: 1,
    External: 1
  });
  const ITEMS_PER_PAGE = 10;

  const BACKEND_IP = process.env.NEXT_PUBLIC_BACKEND_IP || "http://localhost:8080";

  // Mock data for development - replace with actual API calls
  const mockAudits: Audit[] = [
    // Internal Audits
    {
      id: "1",
      auditName: "IT Security Assessment 2024",
      category: "Internal",
      auditor: "John Smith",
      date: "2024-03",
      scope: "Comprehensive security review of all IT systems and infrastructure",
      files: [
        { id: "f1", name: "security-report.pdf", size: 2048000, type: "application/pdf", uploadedAt: "2024-03-01" }
      ],
      createdAt: "2024-03-01T10:00:00Z",
      updatedAt: "2024-03-01T10:00:00Z"
    },
    {
      id: "4",
      auditName: "Financial Controls Review",
      category: "Internal",
      auditor: "Sarah Johnson",
      date: "2024-02",
      scope: "Assessment of internal financial controls and procedures",
      files: [],
      createdAt: "2024-02-10T09:00:00Z",
      updatedAt: "2024-02-10T09:00:00Z"
    },
    {
      id: "5",
      auditName: "HR Process Audit",
      category: "Internal",
      auditor: "Mike Chen",
      date: "2024-01",
      scope: "Review of human resources processes and compliance with company policies",
      files: [
        { id: "f3", name: "hr-audit-findings.xlsx", size: 512000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2024-01-15" }
      ],
      createdAt: "2024-01-15T14:20:00Z",
      updatedAt: "2024-01-15T14:20:00Z"
    },
    {
      id: "6",
      auditName: "Operational Efficiency Review",
      category: "Internal",
      auditor: "Lisa Wang",
      date: "2023-12",
      scope: "Analysis of operational processes and efficiency improvements",
      files: [
        { id: "f4", name: "operations-report.pdf", size: 1536000, type: "application/pdf", uploadedAt: "2023-12-20" },
        { id: "f5", name: "efficiency-metrics.xlsx", size: 768000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2023-12-20" }
      ],
      createdAt: "2023-12-20T11:30:00Z",
      updatedAt: "2023-12-20T11:30:00Z"
    },
    {
      id: "7",
      auditName: "Data Privacy Compliance Check",
      category: "Internal",
      auditor: "David Brown",
      date: "2023-11",
      scope: "Review of data privacy practices and GDPR compliance measures",
      files: [],
      createdAt: "2023-11-10T16:45:00Z",
      updatedAt: "2023-11-10T16:45:00Z"
    },
    
    // Regulatory Audits
    {
      id: "2",
      auditName: "SOX Compliance Review",
      category: "Regulatory",
      auditor: "Jane Doe",
      date: "2024-02",
      scope: "Sarbanes-Oxley compliance assessment for financial reporting systems",
      files: [],
      createdAt: "2024-02-15T14:30:00Z",
      updatedAt: "2024-02-15T14:30:00Z"
    },
    {
      id: "8",
      auditName: "PCI DSS Compliance Audit",
      category: "Regulatory",
      auditor: "Robert Taylor",
      date: "2024-01",
      scope: "Payment Card Industry Data Security Standard compliance verification",
      files: [
        { id: "f6", name: "pci-compliance-report.pdf", size: 2560000, type: "application/pdf", uploadedAt: "2024-01-25" }
      ],
      createdAt: "2024-01-25T13:15:00Z",
      updatedAt: "2024-01-25T13:15:00Z"
    },
    {
      id: "9",
      auditName: "ISO 27001 Certification Audit",
      category: "Regulatory",
      auditor: "Emma Wilson",
      date: "2023-12",
      scope: "Information security management system certification audit",
      files: [
        { id: "f7", name: "iso27001-audit.docx", size: 1280000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploadedAt: "2023-12-15" },
        { id: "f8", name: "security-controls.xlsx", size: 896000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2023-12-15" }
      ],
      createdAt: "2023-12-15T10:20:00Z",
      updatedAt: "2023-12-15T10:20:00Z"
    },
    {
      id: "10",
      auditName: "HIPAA Compliance Review",
      category: "Regulatory",
      auditor: "Dr. Amanda Lee",
      date: "2023-11",
      scope: "Health Insurance Portability and Accountability Act compliance assessment",
      files: [],
      createdAt: "2023-11-20T15:40:00Z",
      updatedAt: "2023-11-20T15:40:00Z"
    },
    {
      id: "11",
      auditName: "GDPR Data Protection Audit",
      category: "Regulatory",
      auditor: "Thomas Mueller",
      date: "2023-10",
      scope: "General Data Protection Regulation compliance verification",
      files: [
        { id: "f9", name: "gdpr-assessment.pdf", size: 1792000, type: "application/pdf", uploadedAt: "2023-10-30" }
      ],
      createdAt: "2023-10-30T12:10:00Z",
      updatedAt: "2023-10-30T12:10:00Z"
    },
    
    // External Audits
    {
      id: "3",
      auditName: "Third-Party Vendor Assessment",
      category: "External",
      auditor: "External Auditors Inc.",
      date: "2024-01",
      scope: "Review of third-party vendor security practices and compliance",
      files: [
        { id: "f2", name: "vendor-assessment.docx", size: 1024000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploadedAt: "2024-01-20" }
      ],
      createdAt: "2024-01-20T09:15:00Z",
      updatedAt: "2024-01-20T09:15:00Z"
    },
    {
      id: "12",
      auditName: "Annual Financial Audit",
      category: "External",
      auditor: "KPMG Audit Services",
      date: "2023-12",
      scope: "Independent financial statement audit and internal controls assessment",
      files: [
        { id: "f10", name: "financial-audit-report.pdf", size: 3072000, type: "application/pdf", uploadedAt: "2023-12-31" },
        { id: "f11", name: "management-letter.docx", size: 640000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploadedAt: "2023-12-31" }
      ],
      createdAt: "2023-12-31T17:00:00Z",
      updatedAt: "2023-12-31T17:00:00Z"
    },
    {
      id: "13",
      auditName: "Cloud Security Assessment",
      category: "External",
      auditor: "CyberSec Solutions",
      date: "2023-11",
      scope: "Comprehensive cloud infrastructure security evaluation",
      files: [
        { id: "f12", name: "cloud-security-report.pdf", size: 2304000, type: "application/pdf", uploadedAt: "2023-11-15" }
      ],
      createdAt: "2023-11-15T14:25:00Z",
      updatedAt: "2023-11-15T14:25:00Z"
    },
    {
      id: "14",
      auditName: "Penetration Testing Audit",
      category: "External",
      auditor: "SecureTest Labs",
      date: "2023-10",
      scope: "External penetration testing of web applications and network infrastructure",
      files: [
        { id: "f13", name: "pentest-report.pdf", size: 1856000, type: "application/pdf", uploadedAt: "2023-10-25" },
        { id: "f14", name: "vulnerability-summary.xlsx", size: 448000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2023-10-25" }
      ],
      createdAt: "2023-10-25T11:50:00Z",
      updatedAt: "2023-10-25T11:50:00Z"
    },
    {
      id: "15",
      auditName: "Business Continuity Audit",
      category: "External",
      auditor: "Risk Management Partners",
      date: "2023-09",
      scope: "Assessment of business continuity and disaster recovery capabilities",
      files: [],
      createdAt: "2023-09-20T13:35:00Z",
      updatedAt: "2023-09-20T13:35:00Z"
    },
    
    // Additional Internal Audits (16-35)
    {
      id: "16",
      auditName: "Inventory Management Review",
      category: "Internal",
      auditor: "Alex Thompson",
      date: "2023-10",
      scope: "Review of inventory tracking and management processes",
      files: [],
      createdAt: "2023-10-05T08:30:00Z",
      updatedAt: "2023-10-05T08:30:00Z"
    },
    {
      id: "17",
      auditName: "Customer Service Quality Audit",
      category: "Internal",
      auditor: "Maria Garcia",
      date: "2023-09",
      scope: "Assessment of customer service standards and performance metrics",
      files: [{ id: "f15", name: "customer-survey.xlsx", size: 320000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2023-09-10" }],
      createdAt: "2023-09-10T15:20:00Z",
      updatedAt: "2023-09-10T15:20:00Z"
    },
    {
      id: "18",
      auditName: "Supply Chain Risk Assessment",
      category: "Internal",
      auditor: "Kevin Lee",
      date: "2023-08",
      scope: "Evaluation of supply chain vulnerabilities and risk mitigation strategies",
      files: [],
      createdAt: "2023-08-25T11:45:00Z",
      updatedAt: "2023-08-25T11:45:00Z"
    },
    {
      id: "19",
      auditName: "IT Asset Management Audit",
      category: "Internal",
      auditor: "Rachel Kim",
      date: "2023-08",
      scope: "Review of IT asset tracking, lifecycle management, and disposal processes",
      files: [{ id: "f16", name: "asset-inventory.pdf", size: 1200000, type: "application/pdf", uploadedAt: "2023-08-15" }],
      createdAt: "2023-08-15T09:10:00Z",
      updatedAt: "2023-08-15T09:10:00Z"
    },
    {
      id: "20",
      auditName: "Training and Development Review",
      category: "Internal",
      auditor: "James Wilson",
      date: "2023-07",
      scope: "Assessment of employee training programs and professional development initiatives",
      files: [],
      createdAt: "2023-07-30T14:25:00Z",
      updatedAt: "2023-07-30T14:25:00Z"
    },
    {
      id: "21",
      auditName: "Procurement Process Audit",
      category: "Internal",
      auditor: "Linda Davis",
      date: "2023-07",
      scope: "Review of procurement policies, vendor selection, and purchase approval processes",
      files: [{ id: "f17", name: "procurement-analysis.xlsx", size: 680000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2023-07-20" }],
      createdAt: "2023-07-20T16:40:00Z",
      updatedAt: "2023-07-20T16:40:00Z"
    },
    {
      id: "22",
      auditName: "Quality Management System Review",
      category: "Internal",
      auditor: "Michael Brown",
      date: "2023-06",
      scope: "Evaluation of quality control processes and continuous improvement initiatives",
      files: [],
      createdAt: "2023-06-15T10:15:00Z",
      updatedAt: "2023-06-15T10:15:00Z"
    },
    {
      id: "23",
      auditName: "Environmental Compliance Check",
      category: "Internal",
      auditor: "Susan Miller",
      date: "2023-06",
      scope: "Assessment of environmental policies and waste management practices",
      files: [{ id: "f18", name: "environmental-report.pdf", size: 1500000, type: "application/pdf", uploadedAt: "2023-06-10" }],
      createdAt: "2023-06-10T13:50:00Z",
      updatedAt: "2023-06-10T13:50:00Z"
    },
    {
      id: "24",
      auditName: "Business Process Optimization",
      category: "Internal",
      auditor: "Daniel Taylor",
      date: "2023-05",
      scope: "Analysis of business processes for efficiency improvements and automation opportunities",
      files: [],
      createdAt: "2023-05-25T12:30:00Z",
      updatedAt: "2023-05-25T12:30:00Z"
    },
    {
      id: "25",
      auditName: "Risk Management Framework Review",
      category: "Internal",
      auditor: "Jennifer White",
      date: "2023-05",
      scope: "Evaluation of enterprise risk management processes and controls",
      files: [{ id: "f19", name: "risk-assessment.docx", size: 890000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploadedAt: "2023-05-15" }],
      createdAt: "2023-05-15T11:20:00Z",
      updatedAt: "2023-05-15T11:20:00Z"
    },
    {
      id: "26",
      auditName: "Facilities Management Audit",
      category: "Internal",
      auditor: "Robert Johnson",
      date: "2023-04",
      scope: "Review of facility maintenance, security, and space utilization",
      files: [],
      createdAt: "2023-04-20T09:45:00Z",
      updatedAt: "2023-04-20T09:45:00Z"
    },
    {
      id: "27",
      auditName: "Project Management Review",
      category: "Internal",
      auditor: "Patricia Anderson",
      date: "2023-04",
      scope: "Assessment of project management methodologies and delivery performance",
      files: [{ id: "f20", name: "project-metrics.xlsx", size: 450000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2023-04-10" }],
      createdAt: "2023-04-10T14:15:00Z",
      updatedAt: "2023-04-10T14:15:00Z"
    },
    {
      id: "28",
      auditName: "Communication Systems Audit",
      category: "Internal",
      auditor: "Christopher Lee",
      date: "2023-03",
      scope: "Review of internal and external communication channels and effectiveness",
      files: [],
      createdAt: "2023-03-30T16:00:00Z",
      updatedAt: "2023-03-30T16:00:00Z"
    },
    {
      id: "29",
      auditName: "Performance Management Review",
      category: "Internal",
      auditor: "Michelle Martinez",
      date: "2023-03",
      scope: "Evaluation of employee performance review processes and goal setting",
      files: [{ id: "f21", name: "performance-analysis.pdf", size: 720000, type: "application/pdf", uploadedAt: "2023-03-20" }],
      createdAt: "2023-03-20T10:30:00Z",
      updatedAt: "2023-03-20T10:30:00Z"
    },
    {
      id: "30",
      auditName: "Budget Planning and Control Audit",
      category: "Internal",
      auditor: "Steven Wilson",
      date: "2023-02",
      scope: "Review of budget preparation, monitoring, and variance analysis processes",
      files: [],
      createdAt: "2023-02-25T13:45:00Z",
      updatedAt: "2023-02-25T13:45:00Z"
    },
    {
      id: "31",
      auditName: "Document Management System Review",
      category: "Internal",
      auditor: "Karen Thompson",
      date: "2023-02",
      scope: "Assessment of document storage, version control, and access management",
      files: [{ id: "f22", name: "document-audit.docx", size: 560000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploadedAt: "2023-02-15" }],
      createdAt: "2023-02-15T11:10:00Z",
      updatedAt: "2023-02-15T11:10:00Z"
    },
    {
      id: "32",
      auditName: "Sales Process Optimization",
      category: "Internal",
      auditor: "Mark Davis",
      date: "2023-01",
      scope: "Review of sales pipeline, lead management, and conversion processes",
      files: [],
      createdAt: "2023-01-30T15:25:00Z",
      updatedAt: "2023-01-30T15:25:00Z"
    },
    {
      id: "33",
      auditName: "Compliance Training Effectiveness",
      category: "Internal",
      auditor: "Nancy Garcia",
      date: "2023-01",
      scope: "Evaluation of compliance training programs and employee understanding",
      files: [{ id: "f23", name: "training-results.xlsx", size: 380000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2023-01-20" }],
      createdAt: "2023-01-20T09:40:00Z",
      updatedAt: "2023-01-20T09:40:00Z"
    },
    {
      id: "34",
      auditName: "Technology Infrastructure Review",
      category: "Internal",
      auditor: "Paul Rodriguez",
      date: "2022-12",
      scope: "Assessment of IT infrastructure, network security, and system performance",
      files: [],
      createdAt: "2022-12-15T14:20:00Z",
      updatedAt: "2022-12-15T14:20:00Z"
    },
    {
      id: "35",
      auditName: "Customer Data Protection Audit",
      category: "Internal",
      auditor: "Laura Martinez",
      date: "2022-12",
      scope: "Review of customer data handling, storage, and privacy protection measures",
      files: [{ id: "f24", name: "data-protection-report.pdf", size: 950000, type: "application/pdf", uploadedAt: "2022-12-10" }],
      createdAt: "2022-12-10T12:55:00Z",
      updatedAt: "2022-12-10T12:55:00Z"
    },
    
    // Additional Regulatory Audits (36-55)
    {
      id: "36",
      auditName: "Anti-Money Laundering Compliance",
      category: "Regulatory",
      auditor: "Financial Compliance Group",
      date: "2023-09",
      scope: "Assessment of AML policies, procedures, and transaction monitoring systems",
      files: [{ id: "f25", name: "aml-compliance-report.pdf", size: 1800000, type: "application/pdf", uploadedAt: "2023-09-25" }],
      createdAt: "2023-09-25T10:15:00Z",
      updatedAt: "2023-09-25T10:15:00Z"
    },
    {
      id: "37",
      auditName: "Environmental Regulatory Compliance",
      category: "Regulatory",
      auditor: "Green Compliance Solutions",
      date: "2023-08",
      scope: "Review of environmental regulations compliance and reporting requirements",
      files: [],
      createdAt: "2023-08-20T13:30:00Z",
      updatedAt: "2023-08-20T13:30:00Z"
    },
    {
      id: "38",
      auditName: "Labor Law Compliance Review",
      category: "Regulatory",
      auditor: "Employment Law Associates",
      date: "2023-08",
      scope: "Assessment of compliance with labor laws, wage regulations, and workplace safety",
      files: [{ id: "f26", name: "labor-compliance.docx", size: 670000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploadedAt: "2023-08-15" }],
      createdAt: "2023-08-15T11:45:00Z",
      updatedAt: "2023-08-15T11:45:00Z"
    },
    {
      id: "39",
      auditName: "Tax Compliance Audit",
      category: "Regulatory",
      auditor: "Tax Advisory Services",
      date: "2023-07",
      scope: "Review of tax filing accuracy, compliance with tax regulations, and documentation",
      files: [],
      createdAt: "2023-07-25T09:20:00Z",
      updatedAt: "2023-07-25T09:20:00Z"
    },
    {
      id: "40",
      auditName: "Healthcare Compliance Review",
      category: "Regulatory",
      auditor: "Medical Compliance Experts",
      date: "2023-07",
      scope: "Assessment of healthcare regulations compliance and patient data protection",
      files: [{ id: "f27", name: "healthcare-audit.pdf", size: 1400000, type: "application/pdf", uploadedAt: "2023-07-20" }],
      createdAt: "2023-07-20T14:10:00Z",
      updatedAt: "2023-07-20T14:10:00Z"
    },
    {
      id: "41",
      auditName: "Financial Services Regulation Audit",
      category: "Regulatory",
      auditor: "FinReg Compliance",
      date: "2023-06",
      scope: "Review of financial services regulations and consumer protection measures",
      files: [],
      createdAt: "2023-06-25T16:35:00Z",
      updatedAt: "2023-06-25T16:35:00Z"
    },
    {
      id: "42",
      auditName: "Import/Export Compliance Check",
      category: "Regulatory",
      auditor: "Trade Compliance Solutions",
      date: "2023-06",
      scope: "Assessment of customs regulations, trade compliance, and documentation requirements",
      files: [{ id: "f28", name: "trade-compliance.xlsx", size: 520000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2023-06-15" }],
      createdAt: "2023-06-15T12:25:00Z",
      updatedAt: "2023-06-15T12:25:00Z"
    },
    {
      id: "43",
      auditName: "Consumer Protection Compliance",
      category: "Regulatory",
      auditor: "Consumer Rights Auditors",
      date: "2023-05",
      scope: "Review of consumer protection laws compliance and fair trading practices",
      files: [],
      createdAt: "2023-05-30T10:50:00Z",
      updatedAt: "2023-05-30T10:50:00Z"
    },
    {
      id: "44",
      auditName: "Intellectual Property Compliance",
      category: "Regulatory",
      auditor: "IP Compliance Group",
      date: "2023-05",
      scope: "Assessment of intellectual property protection and licensing compliance",
      files: [{ id: "f29", name: "ip-audit-report.pdf", size: 1100000, type: "application/pdf", uploadedAt: "2023-05-25" }],
      createdAt: "2023-05-25T15:15:00Z",
      updatedAt: "2023-05-25T15:15:00Z"
    },
    {
      id: "45",
      auditName: "Telecommunications Regulatory Audit",
      category: "Regulatory",
      auditor: "Telecom Compliance Associates",
      date: "2023-04",
      scope: "Review of telecommunications regulations and service provider compliance",
      files: [],
      createdAt: "2023-04-25T13:40:00Z",
      updatedAt: "2023-04-25T13:40:00Z"
    },
    {
      id: "46",
      auditName: "Energy Sector Compliance Review",
      category: "Regulatory",
      auditor: "Energy Regulatory Consultants",
      date: "2023-04",
      scope: "Assessment of energy sector regulations and environmental compliance",
      files: [{ id: "f30", name: "energy-compliance.docx", size: 780000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploadedAt: "2023-04-20" }],
      createdAt: "2023-04-20T11:30:00Z",
      updatedAt: "2023-04-20T11:30:00Z"
    },
    {
      id: "47",
      auditName: "Food Safety Regulatory Audit",
      category: "Regulatory",
      auditor: "Food Safety Compliance",
      date: "2023-03",
      scope: "Review of food safety regulations, HACCP compliance, and quality standards",
      files: [],
      createdAt: "2023-03-25T09:15:00Z",
      updatedAt: "2023-03-25T09:15:00Z"
    },
    {
      id: "48",
      auditName: "Pharmaceutical Compliance Review",
      category: "Regulatory",
      auditor: "Pharma Regulatory Experts",
      date: "2023-03",
      scope: "Assessment of pharmaceutical regulations, drug safety, and manufacturing compliance",
      files: [{ id: "f31", name: "pharma-audit.pdf", size: 1650000, type: "application/pdf", uploadedAt: "2023-03-20" }],
      createdAt: "2023-03-20T14:45:00Z",
      updatedAt: "2023-03-20T14:45:00Z"
    },
    {
      id: "49",
      auditName: "Transportation Safety Compliance",
      category: "Regulatory",
      auditor: "Transport Safety Auditors",
      date: "2023-02",
      scope: "Review of transportation safety regulations and vehicle compliance standards",
      files: [],
      createdAt: "2023-02-28T16:20:00Z",
      updatedAt: "2023-02-28T16:20:00Z"
    },
    {
      id: "50",
      auditName: "Construction Industry Compliance",
      category: "Regulatory",
      auditor: "Construction Compliance Group",
      date: "2023-02",
      scope: "Assessment of construction regulations, building codes, and safety standards",
      files: [{ id: "f32", name: "construction-audit.xlsx", size: 640000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2023-02-20" }],
      createdAt: "2023-02-20T12:10:00Z",
      updatedAt: "2023-02-20T12:10:00Z"
    },
    {
      id: "51",
      auditName: "Insurance Regulatory Compliance",
      category: "Regulatory",
      auditor: "Insurance Compliance Solutions",
      date: "2023-01",
      scope: "Review of insurance regulations, solvency requirements, and consumer protection",
      files: [],
      createdAt: "2023-01-25T10:35:00Z",
      updatedAt: "2023-01-25T10:35:00Z"
    },
    {
      id: "52",
      auditName: "Aviation Safety Compliance Audit",
      category: "Regulatory",
      auditor: "Aviation Safety Consultants",
      date: "2023-01",
      scope: "Assessment of aviation safety regulations and maintenance compliance",
      files: [{ id: "f33", name: "aviation-safety.pdf", size: 1320000, type: "application/pdf", uploadedAt: "2023-01-15" }],
      createdAt: "2023-01-15T13:25:00Z",
      updatedAt: "2023-01-15T13:25:00Z"
    },
    {
      id: "53",
      auditName: "Chemical Industry Compliance",
      category: "Regulatory",
      auditor: "Chemical Safety Auditors",
      date: "2022-12",
      scope: "Review of chemical handling, storage, and environmental compliance regulations",
      files: [],
      createdAt: "2022-12-20T15:50:00Z",
      updatedAt: "2022-12-20T15:50:00Z"
    },
    {
      id: "54",
      auditName: "Gaming Industry Regulatory Review",
      category: "Regulatory",
      auditor: "Gaming Compliance Associates",
      date: "2022-12",
      scope: "Assessment of gaming regulations, licensing requirements, and responsible gaming measures",
      files: [{ id: "f34", name: "gaming-compliance.docx", size: 890000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploadedAt: "2022-12-15" }],
      createdAt: "2022-12-15T11:40:00Z",
      updatedAt: "2022-12-15T11:40:00Z"
    },
    {
      id: "55",
      auditName: "Real Estate Compliance Audit",
      category: "Regulatory",
      auditor: "Property Compliance Experts",
      date: "2022-11",
      scope: "Review of real estate regulations, property management compliance, and tenant rights",
      files: [],
      createdAt: "2022-11-30T09:30:00Z",
      updatedAt: "2022-11-30T09:30:00Z"
    },
    
    // Additional External Audits (56-75)
    {
      id: "56",
      auditName: "Cybersecurity Maturity Assessment",
      category: "External",
      auditor: "CyberGuard Solutions",
      date: "2023-08",
      scope: "Comprehensive evaluation of cybersecurity posture and maturity level",
      files: [{ id: "f35", name: "cyber-maturity-report.pdf", size: 2100000, type: "application/pdf", uploadedAt: "2023-08-30" }],
      createdAt: "2023-08-30T14:20:00Z",
      updatedAt: "2023-08-30T14:20:00Z"
    },
    {
      id: "57",
      auditName: "Digital Transformation Readiness",
      category: "External",
      auditor: "Tech Innovation Consultants",
      date: "2023-08",
      scope: "Assessment of digital transformation capabilities and technology adoption",
      files: [],
      createdAt: "2023-08-25T10:45:00Z",
      updatedAt: "2023-08-25T10:45:00Z"
    },
    {
      id: "58",
      auditName: "Operational Excellence Review",
      category: "External",
      auditor: "Excellence Partners",
      date: "2023-07",
      scope: "Evaluation of operational processes and continuous improvement opportunities",
      files: [{ id: "f36", name: "operational-excellence.xlsx", size: 750000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2023-07-30" }],
      createdAt: "2023-07-30T16:15:00Z",
      updatedAt: "2023-07-30T16:15:00Z"
    },
    {
      id: "59",
      auditName: "Market Risk Assessment",
      category: "External",
      auditor: "Risk Analytics Group",
      date: "2023-07",
      scope: "Analysis of market risks, competitive positioning, and strategic threats",
      files: [],
      createdAt: "2023-07-25T12:30:00Z",
      updatedAt: "2023-07-25T12:30:00Z"
    },
    {
      id: "60",
      auditName: "Sustainability and ESG Audit",
      category: "External",
      auditor: "Green Future Auditors",
      date: "2023-06",
      scope: "Assessment of environmental, social, and governance practices and reporting",
      files: [{ id: "f37", name: "esg-assessment.pdf", size: 1850000, type: "application/pdf", uploadedAt: "2023-06-30" }],
      createdAt: "2023-06-30T13:50:00Z",
      updatedAt: "2023-06-30T13:50:00Z"
    },
    {
      id: "61",
      auditName: "Customer Experience Evaluation",
      category: "External",
      auditor: "CX Excellence Partners",
      date: "2023-06",
      scope: "Review of customer journey, satisfaction metrics, and experience optimization",
      files: [],
      createdAt: "2023-06-25T11:20:00Z",
      updatedAt: "2023-06-25T11:20:00Z"
    },
    {
      id: "62",
      auditName: "Supply Chain Resilience Audit",
      category: "External",
      auditor: "Supply Chain Experts",
      date: "2023-05",
      scope: "Evaluation of supply chain robustness, vendor relationships, and risk mitigation",
      files: [{ id: "f38", name: "supply-chain-audit.docx", size: 920000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploadedAt: "2023-05-30" }],
      createdAt: "2023-05-30T15:40:00Z",
      updatedAt: "2023-05-30T15:40:00Z"
    },
    {
      id: "63",
      auditName: "Innovation Capability Assessment",
      category: "External",
      auditor: "Innovation Consultancy",
      date: "2023-05",
      scope: "Review of innovation processes, R&D effectiveness, and product development",
      files: [],
      createdAt: "2023-05-25T09:10:00Z",
      updatedAt: "2023-05-25T09:10:00Z"
    },
    {
      id: "64",
      auditName: "Brand and Reputation Audit",
      category: "External",
      auditor: "Brand Strategy Partners",
      date: "2023-04",
      scope: "Assessment of brand positioning, reputation management, and market perception",
      files: [{ id: "f39", name: "brand-audit-report.pdf", size: 1450000, type: "application/pdf", uploadedAt: "2023-04-30" }],
      createdAt: "2023-04-30T14:25:00Z",
      updatedAt: "2023-04-30T14:25:00Z"
    },
    {
      id: "65",
      auditName: "Merger and Acquisition Due Diligence",
      category: "External",
      auditor: "M&A Advisory Services",
      date: "2023-04",
      scope: "Comprehensive due diligence review for potential acquisition targets",
      files: [],
      createdAt: "2023-04-25T16:35:00Z",
      updatedAt: "2023-04-25T16:35:00Z"
    },
    {
      id: "66",
      auditName: "Competitive Intelligence Review",
      category: "External",
      auditor: "Market Intelligence Group",
      date: "2023-03",
      scope: "Analysis of competitive landscape, market trends, and strategic positioning",
      files: [{ id: "f40", name: "competitive-analysis.xlsx", size: 680000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2023-03-30" }],
      createdAt: "2023-03-30T12:15:00Z",
      updatedAt: "2023-03-30T12:15:00Z"
    },
    {
      id: "67",
      auditName: "Digital Marketing Effectiveness Audit",
      category: "External",
      auditor: "Digital Marketing Experts",
      date: "2023-03",
      scope: "Evaluation of digital marketing strategies, ROI, and channel effectiveness",
      files: [],
      createdAt: "2023-03-25T10:50:00Z",
      updatedAt: "2023-03-25T10:50:00Z"
    },
    {
      id: "68",
      auditName: "Organizational Culture Assessment",
      category: "External",
      auditor: "Culture Transformation Partners",
      date: "2023-02",
      scope: "Review of organizational culture, employee engagement, and cultural alignment",
      files: [{ id: "f41", name: "culture-assessment.pdf", size: 1200000, type: "application/pdf", uploadedAt: "2023-02-28" }],
      createdAt: "2023-02-28T13:30:00Z",
      updatedAt: "2023-02-28T13:30:00Z"
    },
    {
      id: "69",
      auditName: "Technology Stack Evaluation",
      category: "External",
      auditor: "Tech Architecture Consultants",
      date: "2023-02",
      scope: "Assessment of technology architecture, scalability, and modernization needs",
      files: [],
      createdAt: "2023-02-25T15:20:00Z",
      updatedAt: "2023-02-25T15:20:00Z"
    },
    {
      id: "70",
      auditName: "Financial Performance Benchmarking",
      category: "External",
      auditor: "Financial Benchmarking Associates",
      date: "2023-01",
      scope: "Comparison of financial performance against industry benchmarks and peers",
      files: [{ id: "f42", name: "financial-benchmark.xlsx", size: 540000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "2023-01-30" }],
      createdAt: "2023-01-30T11:45:00Z",
      updatedAt: "2023-01-30T11:45:00Z"
    },
    {
      id: "71",
      auditName: "Strategic Planning Review",
      category: "External",
      auditor: "Strategy Consulting Group",
      date: "2023-01",
      scope: "Evaluation of strategic planning processes, goal setting, and execution capabilities",
      files: [],
      createdAt: "2023-01-25T09:30:00Z",
      updatedAt: "2023-01-25T09:30:00Z"
    },
    {
      id: "72",
      auditName: "Regulatory Compliance Readiness",
      category: "External",
      auditor: "Compliance Readiness Partners",
      date: "2022-12",
      scope: "Assessment of readiness for upcoming regulatory changes and compliance requirements",
      files: [{ id: "f43", name: "compliance-readiness.pdf", size: 1350000, type: "application/pdf", uploadedAt: "2022-12-30" }],
      createdAt: "2022-12-30T14:10:00Z",
      updatedAt: "2022-12-30T14:10:00Z"
    },
    {
      id: "73",
      auditName: "Crisis Management Preparedness",
      category: "External",
      auditor: "Crisis Management Consultants",
      date: "2022-12",
      scope: "Review of crisis management plans, response capabilities, and communication strategies",
      files: [],
      createdAt: "2022-12-25T16:40:00Z",
      updatedAt: "2022-12-25T16:40:00Z"
    },
    {
      id: "74",
      auditName: "Data Analytics Maturity Assessment",
      category: "External",
      auditor: "Analytics Excellence Partners",
      date: "2022-11",
      scope: "Evaluation of data analytics capabilities, tools, and decision-making processes",
      files: [{ id: "f44", name: "analytics-maturity.docx", size: 780000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploadedAt: "2022-11-30" }],
      createdAt: "2022-11-30T12:25:00Z",
      updatedAt: "2022-11-30T12:25:00Z"
    },
    {
      id: "75",
      auditName: "International Expansion Readiness",
      category: "External",
      auditor: "Global Expansion Advisors",
      date: "2022-11",
      scope: "Assessment of capabilities and readiness for international market expansion",
      files: [],
      createdAt: "2022-11-25T10:15:00Z",
      updatedAt: "2022-11-25T10:15:00Z"
    }
  ];

  useEffect(() => {
    fetchAudits();
  }, [token]);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`${BACKEND_IP}/api/audits`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      // const data = await response.json();
      // setAudits(data);
      
      // For now, use mock data
      setTimeout(() => {
        setAudits(mockAudits);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError("Failed to fetch audits");
      setLoading(false);
      toast.error("Failed to load audits");
    }
  };

  const handleCreateAudit = async (auditData: Omit<Audit, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // TODO: Replace with actual API call
      const newAudit: Audit = {
        ...auditData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setAudits(prev => [...prev, newAudit]);
      setShowNewAuditModal(false);
      toast.success("Audit created successfully");
    } catch (err) {
      toast.error("Failed to create audit");
    }
  };

  const handleUpdateAudit = async (auditData: Audit) => {
    try {
      // TODO: Replace with actual API call
      const updatedAudit = {
        ...auditData,
        updatedAt: new Date().toISOString(),
      };
      
      setAudits(prev => prev.map(audit => 
        audit.id === updatedAudit.id ? updatedAudit : audit
      ));
      setShowDetailModal(false);
      setSelectedAudit(null);
      toast.success("Audit updated successfully");
    } catch (err) {
      toast.error("Failed to update audit");
    }
  };

  const handleAuditClick = (audit: Audit) => {
    if (isSelectionMode) {
      handleMultipleSelect(audit.id);
    } else {
      setSelectedAudit(audit);
      setShowDetailModal(true);
    }
  };

  // Selection mode functions
  const handleMultipleSelect = (auditId: string) => {
    setSelectedAudits(prev => 
      prev.includes(auditId) 
        ? prev.filter(id => id !== auditId)
        : [...prev, auditId]
    );
  };

  const handleSelectAll = () => {
    const allCurrentAudits = audits.map(audit => audit.id);
    if (selectedAudits.length === allCurrentAudits.length) {
      setSelectedAudits([]);
    } else {
      setSelectedAudits(allCurrentAudits);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedAudits([]);
  };

  // Export function
  const handleExportSelected = async () => {
    if (selectedAudits.length === 0) {
      toast.error("Please select audits to export");
      return;
    }

    try {
      setIsExporting(true);
      
      // Get selected audits data
      const selectedAuditsData = audits.filter(audit => selectedAudits.includes(audit.id));
      
      // Create Excel data
      const excelData: any[] = [];
      
      selectedAuditsData.forEach((audit, index) => {
        // Count files
        const fileCount = audit.files.length;
        const fileNames = audit.files.map(file => file.name).join('; ');
        const totalFileSize = audit.files.reduce((sum, file) => sum + file.size, 0);
        
        // Format file size
        const formatFileSize = (bytes: number) => {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
        
        excelData.push({
          "No": index + 1,
          "Audit Name": audit.auditName,
          "Category": audit.category,
          "Auditor": audit.auditor,
          "Date": audit.date,
          "Scope": audit.scope,
          "File Count": fileCount,
          "File Names": fileNames,
          "Total File Size": formatFileSize(totalFileSize),
          "Created At": new Date(audit.createdAt).toLocaleDateString('id-ID'),
          "Updated At": new Date(audit.updatedAt).toLocaleDateString('id-ID')
        });
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 5 },   // No
        { wch: 30 },  // Audit Name
        { wch: 15 },  // Category
        { wch: 25 },  // Auditor
        { wch: 12 },  // Date
        { wch: 50 },  // Scope
        { wch: 12 },  // File Count
        { wch: 50 },  // File Names
        { wch: 15 },  // Total File Size
        { wch: 12 },  // Created At
        { wch: 12 }   // Updated At
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Universe Data");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `Selected_Audits_${selectedAudits.length}_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      // Show success message
      toast.success(`Successfully exported ${selectedAudits.length} audits to Excel`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export audits. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedAudits.length === 0) {
      toast.error("Please select audits to delete");
      return;
    }
    
    // Show confirmation dialog
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedAudits.length} audit(s)? This action cannot be undone.`);
    
    if (confirmDelete) {
      try {
        // Remove selected audits from the list
        setAudits(prev => prev.filter(audit => !selectedAudits.includes(audit.id)));
        setSelectedAudits([]);
        setIsSelectionMode(false);
        toast.success(`Successfully deleted ${selectedAudits.length} audit(s)`);
      } catch (error) {
        console.error('Delete error:', error);
        toast.error("Failed to delete audits. Please try again.");
      }
    }
  };
  // Export function based on current filter
  const handleExportFiltered = async () => {
    try {
      setIsExporting(true);
      
      // Get filtered audits based on current year filter and search term
      const filteredAudits = audits.filter(audit => 
        (selectedYear === 'all' || audit.date.split('-')[0] === selectedYear) &&
        (searchTerm === '' ||
         audit.auditName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         audit.auditor.toLowerCase().includes(searchTerm.toLowerCase()) ||
         audit.scope.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      if (filteredAudits.length === 0) {
        toast.error("No audits found with current filter");
        return;
      }
      
      // Create Excel data
      const excelData: any[] = [];
      
      filteredAudits.forEach((audit, index) => {
        // Count files
        const fileCount = audit.files.length;
        const fileNames = audit.files.map(file => file.name).join('; ');
        const totalFileSize = audit.files.reduce((sum, file) => sum + file.size, 0);
        
        // Format file size
        const formatFileSize = (bytes: number) => {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
        
        excelData.push({
          "No": index + 1,
          "Audit Name": audit.auditName,
          "Category": audit.category,
          "Auditor": audit.auditor,
          "Date": audit.date,
          "Scope": audit.scope,
          "File Count": fileCount,
          "File Names": fileNames,
          "Total File Size": formatFileSize(totalFileSize),
          "Created At": new Date(audit.createdAt).toLocaleDateString('id-ID'),
          "Updated At": new Date(audit.updatedAt).toLocaleDateString('id-ID')
        });
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 5 },   // No
        { wch: 30 },  // Audit Name
        { wch: 15 },  // Category
        { wch: 25 },  // Auditor
        { wch: 12 },  // Date
        { wch: 50 },  // Scope
        { wch: 12 },  // File Count
        { wch: 50 },  // File Names
        { wch: 15 },  // Total File Size
        { wch: 12 },  // Created At
        { wch: 12 }   // Updated At
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Audit Data");

      // Generate filename with filter info and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const yearFilter = selectedYear === 'all' ? 'All_Years' : `Year_${selectedYear}`;
      const searchFilter = searchTerm ? `_Search_${searchTerm.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const filename = `Audit_Universe_${yearFilter}${searchFilter}_${filteredAudits.length}_items_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      // Show success message
      toast.success(`Successfully exported ${filteredAudits.length} audits to Excel`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export audits. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };
  const formatDate = (dateString: string) => {
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const getAuditsByCategory = (category: string) => {
    const filtered = audits.filter(audit => 
      audit.category === category &&
      (selectedYear === 'all' || audit.date.split('-')[0] === selectedYear) &&
      (searchTerm === '' ||
       audit.auditName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       audit.auditor.toLowerCase().includes(searchTerm.toLowerCase()) ||
       audit.scope.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const page = currentPage[category as keyof typeof currentPage];
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    return {
      items: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
      currentPage: page
    };
  };

  const handlePageChange = (category: string, page: number) => {
    setCurrentPage(prev => ({
      ...prev,
      [category]: page
    }));
  };

  const resetPagination = () => {
    setCurrentPage({
      Internal: 1,
      Regulatory: 1,
      External: 1
    });
  };

  const AuditCard = ({ audit }: { audit: Audit }) => {
    // Check if audit name is likely 2 lines (rough estimation based on length)
    const isLongTitle = audit.auditName.length > 35;
    const scopeClampClass = isLongTitle ? 'line-clamp-2' : 'line-clamp-3';
    
    return (
      <div 
        className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border ${
          isSelectionMode && selectedAudits.includes(audit.id) 
            ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20' 
            : 'border-gray-200 dark:border-gray-700'
        } h-44 flex flex-col relative`}
        onClick={() => handleAuditClick(audit)}
      >
        {/* Selection Checkbox - Smaller Size */}
        {isSelectionMode && (
          <div 
            className="absolute top-2 right-2 z-10"
            onClick={(e) => {
              e.stopPropagation();
              handleMultipleSelect(audit.id);
            }}
          >
            <input
              type="checkbox"
              checked={selectedAudits.includes(audit.id)}
              onChange={() => {}}
              className="w-3.5 h-3.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        )}
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-5 line-clamp-2 flex-1">
            {audit.auditName}
          </h3>
          <FaEdit className="text-gray-400 hover:text-blue-500 text-sm flex-shrink-0 ml-2" />
        </div>
        
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-blue-500 text-xs flex-shrink-0" />
              <span className="truncate">{formatDate(audit.date)}</span>
            </div>
            
            <div className="flex items-start gap-2">
              <FaFileAlt className="text-green-500 text-xs mt-0.5 flex-shrink-0" />
              <span className={`${scopeClampClass} text-xs`}>{audit.scope}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
              {audit.auditor}
            </span>
            {audit.files.length > 0 && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded ml-2 flex-shrink-0">
                {audit.files.length}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
          <Sidebar />
          <div className="flex-1 md:ml-60 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="space-y-3">
                      {[1, 2].map(j => (
                        <div key={j} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex">
        <Sidebar />
        <div className="flex-1 md:ml-60 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Audit Universe
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Comprehensive audit management across Internal, Regulatory, and External categories
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {audits.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Audits
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Search Bar and Add Button */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search audits by name, auditor, or scope..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    resetPagination();
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                />
              </div>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  resetPagination();
                }}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors min-w-[120px]"
              >
                <option value="all">All Years</option>
                {[...new Set(audits.map(audit => audit.date.split('-')[0]))]
                  .sort((a, b) => parseInt(b) - parseInt(a))
                  .map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
              </select>
              <button
                onClick={toggleSelectionMode}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors whitespace-nowrap shadow-md hover:shadow-lg ${
                  isSelectionMode 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isSelectionMode ? <FaTimes className="text-sm" /> : <FaCheck className="text-sm" />}
                {isSelectionMode ? 'Cancel' : 'Select'}
              </button>   
              {/* Select All button - only show when in selection mode */}
              {isSelectionMode && (
                <button
                  onClick={handleSelectAll}
                  className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
                >
                  <FaCheck className="text-sm" />
                  {selectedAudits.length === audits.length ? 'Deselect All' : 'Select All'}
                </button>
              )}    
              {/* Export Button - Only show when year filter is not "all" OR when in selection mode with selected items */}
              {(selectedYear !== 'all' || (isSelectionMode && selectedAudits.length > 0)) && (
                <button
                  onClick={isSelectionMode && selectedAudits.length > 0 ? handleExportSelected : handleExportFiltered}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
                >
                  <FaFileExcel className="text-sm" />
                  {isExporting ? 'Exporting...' : 
                    isSelectionMode && selectedAudits.length > 0 
                      ? `Export (${selectedAudits.length})` 
                      : 'Export'
                  }
                </button>
              )}
              <button
                onClick={() => setShowNewAuditModal(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
              >
                <FaPlus className="text-sm" />
                Add New Audit
              </button>
              
            </div>

            {/* Selection Mode Toolbar - Compact Version - Only Counter and Delete */}
            {isSelectionMode && selectedAudits.length > 0 && (
              <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 px-2 py-1 bg-white dark:bg-gray-800 rounded">
                  {selectedAudits.length} selected
                </span>
                
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
                >
                  <FaTrash className="text-xs" />
                  Delete
                </button>
              </div>
            )}

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Internal Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    Internal
                  </h2>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-2 py-1 rounded-full">
                    {getAuditsByCategory('Internal').total}
                  </span>
                </div>
                <div className="space-y-3 min-h-[400px]">
                  {getAuditsByCategory('Internal').items.map(audit => (
                    <AuditCard key={audit.id} audit={audit} />
                  ))}
                  {getAuditsByCategory('Internal').total === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FaFileAlt className="mx-auto text-3xl mb-2 opacity-50" />
                      <p>No internal audits yet</p>
                    </div>
                  )}
                </div>
                {getAuditsByCategory('Internal').totalPages > 1 && (
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      Showing {((getAuditsByCategory('Internal').currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(getAuditsByCategory('Internal').currentPage * ITEMS_PER_PAGE, getAuditsByCategory('Internal').total)} of {getAuditsByCategory('Internal').total}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange('Internal', getAuditsByCategory('Internal').currentPage - 1)}
                        disabled={getAuditsByCategory('Internal').currentPage === 1}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ←
                      </button>
                      <span className="px-2 py-1">
                        {getAuditsByCategory('Internal').currentPage} / {getAuditsByCategory('Internal').totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange('Internal', getAuditsByCategory('Internal').currentPage + 1)}
                        disabled={getAuditsByCategory('Internal').currentPage === getAuditsByCategory('Internal').totalPages}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Regulatory Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">
                    Regulatory
                  </h2>
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm px-2 py-1 rounded-full">
                    {getAuditsByCategory('Regulatory').total}
                  </span>
                </div>
                <div className="space-y-3 min-h-[400px]">
                  {getAuditsByCategory('Regulatory').items.map(audit => (
                    <AuditCard key={audit.id} audit={audit} />
                  ))}
                  {getAuditsByCategory('Regulatory').total === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FaFileAlt className="mx-auto text-3xl mb-2 opacity-50" />
                      <p>No regulatory audits yet</p>
                    </div>
                  )}
                </div>
                {getAuditsByCategory('Regulatory').totalPages > 1 && (
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      Showing {((getAuditsByCategory('Regulatory').currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(getAuditsByCategory('Regulatory').currentPage * ITEMS_PER_PAGE, getAuditsByCategory('Regulatory').total)} of {getAuditsByCategory('Regulatory').total}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange('Regulatory', getAuditsByCategory('Regulatory').currentPage - 1)}
                        disabled={getAuditsByCategory('Regulatory').currentPage === 1}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ←
                      </button>
                      <span className="px-2 py-1">
                        {getAuditsByCategory('Regulatory').currentPage} / {getAuditsByCategory('Regulatory').totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange('Regulatory', getAuditsByCategory('Regulatory').currentPage + 1)}
                        disabled={getAuditsByCategory('Regulatory').currentPage === getAuditsByCategory('Regulatory').totalPages}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* External Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                    External
                  </h2>
                  <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm px-2 py-1 rounded-full">
                    {getAuditsByCategory('External').total}
                  </span>
                </div>
                <div className="space-y-3 min-h-[400px]">
                  {getAuditsByCategory('External').items.map(audit => (
                    <AuditCard key={audit.id} audit={audit} />
                  ))}
                  {getAuditsByCategory('External').total === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FaFileAlt className="mx-auto text-3xl mb-2 opacity-50" />
                      <p>No external audits yet</p>
                    </div>
                  )}
                </div>
                {getAuditsByCategory('External').totalPages > 1 && (
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      Showing {((getAuditsByCategory('External').currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(getAuditsByCategory('External').currentPage * ITEMS_PER_PAGE, getAuditsByCategory('External').total)} of {getAuditsByCategory('External').total}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange('External', getAuditsByCategory('External').currentPage - 1)}
                        disabled={getAuditsByCategory('External').currentPage === 1}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ←
                      </button>
                      <span className="px-2 py-1">
                        {getAuditsByCategory('External').currentPage} / {getAuditsByCategory('External').totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange('External', getAuditsByCategory('External').currentPage + 1)}
                        disabled={getAuditsByCategory('External').currentPage === getAuditsByCategory('External').totalPages}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showNewAuditModal && (
          <NewAuditModal
            onClose={() => setShowNewAuditModal(false)}
            onSave={handleCreateAudit}
          />
        )}

        {showDetailModal && selectedAudit && (
          <AuditDetailModal
            audit={selectedAudit}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedAudit(null);
            }}
            onSave={handleUpdateAudit}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
