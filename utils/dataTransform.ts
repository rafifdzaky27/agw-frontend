// Utility functions for transforming data between snake_case and camelCase

export interface SnakeCaseProject {
  id: string;
  kode_project: string;
  project_name: string;
  project_type: 'internal development' | 'procurement' | 'non procurement';
  divisi_inisiasi: string;
  grup_terlibat: string;
  keterangan: string;
  nama_vendor: string;
  no_pks_po: string;
  tanggal_pks_po: string;
  tanggal_bapp: string;
  tanggal_berakhir: string;
  vendor_id: string | null;
  created_at: string;
  updated_at: string;
  vendor_name: string | null;
  total_count?: string;
  paymentStats?: any;
  fileStats?: any;
  paymentStatus?: any;
}

export interface CamelCaseProject {
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
  vendorId: string | null;
  createdAt: string;
  updatedAt: string;
  vendorName: string | null;
  totalCount?: string;
  paymentStats?: any;
  fileStats?: any;
  paymentStatus?: any;
}

// Transform single project from snake_case to camelCase
export const transformProjectToCamelCase = (project: SnakeCaseProject): CamelCaseProject => {
  return {
    id: project.id,
    kodeProject: project.kode_project,
    projectName: project.project_name,
    projectType: project.project_type,
    divisiInisiasi: project.divisi_inisiasi,
    grupTerlibat: project.grup_terlibat,
    keterangan: project.keterangan,
    namaVendor: project.nama_vendor,
    noPKSPO: project.no_pks_po,
    tanggalPKSPO: project.tanggal_pks_po,
    tanggalBAPP: project.tanggal_bapp,
    tanggalBerakhir: project.tanggal_berakhir,
    vendorId: project.vendor_id,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    vendorName: project.vendor_name,
    totalCount: project.total_count,
    paymentStats: project.paymentStats,
    fileStats: project.fileStats,
    paymentStatus: project.paymentStatus,
  };
};

// Transform array of projects from snake_case to camelCase
export const transformProjectsToCamelCase = (projects: SnakeCaseProject[]): CamelCaseProject[] => {
  return projects.map(transformProjectToCamelCase);
};

// Transform project from camelCase to snake_case (for API requests)
export const transformProjectToSnakeCase = (project: Partial<CamelCaseProject>): Partial<SnakeCaseProject> => {
  const transformed: Partial<SnakeCaseProject> = {};
  
  if (project.id !== undefined) transformed.id = project.id;
  if (project.kodeProject !== undefined) transformed.kode_project = project.kodeProject;
  if (project.projectName !== undefined) transformed.project_name = project.projectName;
  if (project.projectType !== undefined) transformed.project_type = project.projectType;
  if (project.divisiInisiasi !== undefined) transformed.divisi_inisiasi = project.divisiInisiasi;
  if (project.grupTerlibat !== undefined) transformed.grup_terlibat = project.grupTerlibat;
  if (project.keterangan !== undefined) transformed.keterangan = project.keterangan;
  if (project.namaVendor !== undefined) transformed.nama_vendor = project.namaVendor;
  if (project.noPKSPO !== undefined) transformed.no_pks_po = project.noPKSPO;
  if (project.tanggalPKSPO !== undefined) transformed.tanggal_pks_po = project.tanggalPKSPO;
  if (project.tanggalBAPP !== undefined) transformed.tanggal_bapp = project.tanggalBAPP;
  if (project.tanggalBerakhir !== undefined) transformed.tanggal_berakhir = project.tanggalBerakhir;
  if (project.vendorId !== undefined) transformed.vendor_id = project.vendorId;
  if (project.createdAt !== undefined) transformed.created_at = project.createdAt;
  if (project.updatedAt !== undefined) transformed.updated_at = project.updatedAt;
  if (project.vendorName !== undefined) transformed.vendor_name = project.vendorName;
  
  return transformed;
};

// Generic function to convert snake_case keys to camelCase
export const snakeToCamel = (str: string): string => {
  // Handle specific cases first
  const specialCases: { [key: string]: string } = {
    'no_pks_po': 'noPKSPO',
    'tanggal_pks_po': 'tanggalPKSPO',
    'tanggal_bapp': 'tanggalBAPP',
    'termin_pembayaran': 'terminPembayaran',
    'uploaded_at': 'uploadedAt',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'project_id': 'projectId',
    'vendor_id': 'vendorId',
    'payment_date': 'paymentDate',
    'budget_type': 'budgetType',
    'opex_cabang': 'opexCabang',
    'opex_pusat': 'opexPusat'
  };
  
  if (specialCases[str]) {
    return specialCases[str];
  }
  
  // Default transformation
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

// Generic function to convert camelCase keys to snake_case
export const camelToSnake = (str: string): string => {
  // Handle specific cases first - Updated based on backend validation errors
  const specialCases: { [key: string]: string } = {
    'kodeProject': 'kode_project',
    'projectName': 'project_name',
    'projectType': 'project_type',
    'divisiInisiasi': 'divisi_inisiasi',
    'grupTerlibat': 'grup_terlibat',
    'namaVendor': 'nama_vendor',
    'noPKSPO': 'no_pks_po',
    'tanggalPKSPO': 'tanggal_pks_po',
    'tanggalBAPP': 'tanggal_bapp',
    'tanggalBerakhir': 'tanggal_berakhir',
    'terminPembayaran': 'termin_pembayaran',
    'uploadedAt': 'uploaded_at',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    'projectId': 'project_id',
    'vendorId': 'vendor_id',
    'paymentDate': 'payment_date',
    'budgetType': 'budget_type',
    'opexCabang': 'opex_cabang',
    'opexPusat': 'opex_pusat',
    // Additional vendor field variations
    'vendorName': 'vendor_name',
    'vendor': 'vendor',
    // Additional PKS/PO field variations
    'pksPoNumber': 'pks_po_number',
    'poNumber': 'po_number',
    'contractNumber': 'contract_number',
    // Additional date field variations
    'pksDate': 'pks_date',
    'pksPoDate': 'pks_po_date',
    'contractDate': 'contract_date',
    'startDate': 'start_date',
    'bappDate': 'bapp_date',
    'handoverDate': 'handover_date',
    'deliveryDate': 'delivery_date',
    'endDate': 'end_date',
    'finishDate': 'finish_date',
    'completionDate': 'completion_date',
    // Additional payment terms variations
    'paymentTerms': 'payment_terms',
    'payments': 'payments',
    'terms': 'terms',
    'projectPayments': 'project_payments',
    'projectTerms': 'project_terms'
  };
  
  const result = specialCases[str] || str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  
  return result;
};

// Generic object transformation from snake_case to camelCase
export const transformObjectToCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(transformObjectToCamelCase);
  
  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    
    // Special handling for nested arrays that need transformation
    if (Array.isArray(value)) {
      transformed[camelKey] = value.map(transformObjectToCamelCase);
    } else if (value && typeof value === 'object') {
      transformed[camelKey] = transformObjectToCamelCase(value);
    } else {
      transformed[camelKey] = value;
    }
  }
  return transformed;
};

// Generic object transformation from camelCase to snake_case
export const transformObjectToSnakeCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(transformObjectToSnakeCase);
  
  const transformed: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);
    transformed[snakeKey] = transformObjectToSnakeCase(value);
  }
  
  return transformed;
};
