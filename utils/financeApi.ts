const BACKEND_IP = process.env.NEXT_PUBLIC_BACKEND_IP || "http://localhost:8080";

interface PaymentTerm {
  id: string;
  termin: string;
  nominal: number;
  description: string;
  status: 'Belum Dibayar' | 'Sudah Dibayar' | 'Checking Umum' | 'Menunggu Posting' | 'Sirkulir IT';
  paymentDate?: string;
  budget?: 'Capex' | 'Opex';
  notes?: string;
  opexCabang?: number;
  opexPusat?: number;
}

interface FinanceProject {
  id: string;
  kodeProject: string;
  projectName: string;
  projectType: 'procurement' | 'non procurement';
  divisiInisiasi: string;
  grupTerlibat: string;
  keterangan: string;
  namaVendor: string;
  noPKSPO: string;
  tanggalPKSPO: string;
  tanggalBAPP: string;
  tanggalBerakhir: string;
  terminPembayaran: PaymentTerm[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all finance projects
 */
export const getAllFinanceProjects = async (token: string): Promise<FinanceProject[]> => {
  const response = await fetch(`${BACKEND_IP}/api/finance`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch finance projects');
  }

  const data = await response.json();
  const projects = data.success ? data.data : [];
  
  // Ensure each project has proper array structure
  return projects.map((project: any) => ({
    ...project,
    terminPembayaran: Array.isArray(project.terminPembayaran) ? project.terminPembayaran : []
  }));
};

/**
 * Update payment terms for a project
 */
export const updatePaymentTerms = async (projectId: string, terminPembayaran: PaymentTerm[], token: string): Promise<FinanceProject> => {
  const response = await fetch(`${BACKEND_IP}/api/finance/${projectId}/payment-terms`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ terminPembayaran }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update payment terms');
  }

  const data = await response.json();
  const project = data.data;
  
  // Ensure arrays are properly structured
  return {
    ...project,
    terminPembayaran: Array.isArray(project.terminPembayaran) ? project.terminPembayaran : []
  };
};