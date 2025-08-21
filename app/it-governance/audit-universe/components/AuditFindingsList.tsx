"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
// Define AuditFinding interface locally since it's not in auditApi
interface AuditFinding {
  id: number;
  name: string;
  status: string;
  root_cause: string;
  recommendation: string;
  commitment: string;
  person_in_charge: string;
  commitment_date: string;
  progress_pemenuhan: string;
}
import { FaClipboardList, FaUser, FaClock, FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

interface AuditFindingsListProps {
  findings: AuditFinding[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'done':
      return <FaCheckCircle className="text-green-500" />;
    case 'in progress':
      return <FaSpinner className="text-yellow-500" />;
    case 'not started':
      return <FaExclamationCircle className="text-red-500" />;
    default:
      return <FaClipboardList className="text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
  switch (status) {
    case 'done':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'in progress':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 'not started':
      return `${baseClasses} bg-red-100 text-red-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export default function AuditFindingsList({ 
  findings
}: AuditFindingsListProps) {
  const router = useRouter();
  
  const handleFindingClick = (findingId: number) => {
    // Redirect to audit findings page with the specific finding ID
    router.push(`/it-governance/audit-findings?findingId=${findingId}`);
  };
  // Enhanced Debug logging
  console.log('🔍 DEBUG - AuditFindingsList received findings:', findings);
  console.log('🔍 DEBUG - AuditFindingsList findings type:', typeof findings);
  console.log('🔍 DEBUG - AuditFindingsList findings is array:', Array.isArray(findings));
  console.log('🔍 DEBUG - AuditFindingsList findings length:', findings?.length || 0);
  console.log('🔍 DEBUG - AuditFindingsList findings JSON:', JSON.stringify(findings, null, 2));
  
  if (!findings || findings.length === 0) {
    console.log('🔍 DEBUG - AuditFindingsList showing empty state');
    return (
      <div className="text-center py-8 text-gray-500">
        <FaClipboardList className="mx-auto text-4xl mb-4 opacity-50" />
        <p className="text-lg font-medium">Belum ada temuan audit</p>
        <p className="text-sm">Temuan audit akan muncul di sini setelah ditambahkan</p>
      </div>
    );
  }

  console.log('🔍 DEBUG - AuditFindingsList rendering findings list with', findings.length, 'items');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FaClipboardList className="text-blue-600" />
          Temuan Audit ({findings.length})
        </h3>
      </div>

      <div className="space-y-2">
        {findings.map((finding, index) => (
          <div
            key={`finding-${finding.id}`}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow duration-200 cursor-pointer hover:bg-gray-50"
            onClick={() => handleFindingClick(finding.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 text-sm flex-1">
                {index + 1}. {finding.name}
              </h4>
              <span className={getStatusBadge(finding.status)}>
                {finding.status === 'done' ? 'Done' : finding.status === 'in progress' ? 'In Progress' : 'Not Started'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600 whitespace-pre-wrap flex-1">
                {finding.progress_pemenuhan}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 ml-2">
                <FaClock />
                <span>{formatDate(finding.commitment_date)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
