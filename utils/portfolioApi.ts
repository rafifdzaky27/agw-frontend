const BACKEND_IP = process.env.NEXT_PUBLIC_BACKEND_IP || "http://localhost:8080";

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

/**
 * Get all portfolio projects
 */
export const getAllProjects = async (token: string): Promise<Agreement[]> => {
  const response = await fetch(`${BACKEND_IP}/api/portfolio`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  const data = await response.json();
  const projects = data.success ? data.data : [];
  
  // Ensure each project has proper array structure
  return projects.map((project: any) => ({
    ...project,
    terminPembayaran: Array.isArray(project.terminPembayaran) ? project.terminPembayaran : [],
    files: Array.isArray(project.files) ? project.files : []
  }));
};

/**
 * Get a project by ID
 */
export const getProjectById = async (id: string, token: string): Promise<Agreement | null> => {
  const response = await fetch(`${BACKEND_IP}/api/portfolio/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch project');
  }

  const data = await response.json();
  const project = data.success ? data.data : null;
  
  if (project) {
    // Ensure arrays are properly structured
    return {
      ...project,
      terminPembayaran: Array.isArray(project.terminPembayaran) ? project.terminPembayaran : [],
      files: Array.isArray(project.files) ? project.files : []
    };
  }
  
  return null;
};

/**
 * Create a new project
 */
export const createProject = async (projectData: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt'>, files: File[], token: string): Promise<Agreement> => {
  const formData = new FormData();
  
  // Add project data
  Object.entries(projectData).forEach(([key, value]) => {
    if (key === 'terminPembayaran' || key === 'files') {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value as string);
    }
  });
  
  // Add files
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const response = await fetch(`${BACKEND_IP}/api/portfolio`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create project');
  }

  const data = await response.json();
  const project = data.data;
  
  // Ensure arrays are properly structured
  return {
    ...project,
    terminPembayaran: Array.isArray(project.terminPembayaran) ? project.terminPembayaran : [],
    files: Array.isArray(project.files) ? project.files : []
  };
};

/**
 * Update an existing project
 */
export const updateProject = async (id: string, projectData: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt'>, files: File[], token: string): Promise<Agreement> => {
  const formData = new FormData();
  
  // Add project data
  Object.entries(projectData).forEach(([key, value]) => {
    if (key === 'terminPembayaran' || key === 'files') {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value as string);
    }
  });
  
  // Add files
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const response = await fetch(`${BACKEND_IP}/api/portfolio/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update project');
  }

  const data = await response.json();
  const project = data.data;
  
  // Ensure arrays are properly structured
  return {
    ...project,
    terminPembayaran: Array.isArray(project.terminPembayaran) ? project.terminPembayaran : [],
    files: Array.isArray(project.files) ? project.files : []
  };
};

/**
 * Delete a project
 */
export const deleteProject = async (id: string, token: string): Promise<void> => {
  const response = await fetch(`${BACKEND_IP}/api/portfolio/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete project');
  }
};

/**
 * Delete multiple projects
 */
export const deleteMultipleProjects = async (ids: string[], token: string): Promise<number> => {
  const response = await fetch(`${BACKEND_IP}/api/portfolio/bulk`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete projects');
  }

  const data = await response.json();
  return data.deletedCount;
};

/**
 * Search projects
 */
export const searchProjects = async (searchTerm: string, token: string): Promise<Agreement[]> => {
  const response = await fetch(`${BACKEND_IP}/api/portfolio/search?q=${encodeURIComponent(searchTerm)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to search projects');
  }

  const data = await response.json();
  const projects = data.success ? data.data : [];
  
  // Ensure each project has proper array structure
  return projects.map((project: any) => ({
    ...project,
    terminPembayaran: Array.isArray(project.terminPembayaran) ? project.terminPembayaran : [],
    files: Array.isArray(project.files) ? project.files : []
  }));
};

/**
 * Get projects by type
 */
export const getProjectsByType = async (projectType: string, token: string): Promise<Agreement[]> => {
  const response = await fetch(`${BACKEND_IP}/api/portfolio/type/${encodeURIComponent(projectType)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch projects by type');
  }

  const data = await response.json();
  const projects = data.success ? data.data : [];
  
  // Ensure each project has proper array structure
  return projects.map((project: any) => ({
    ...project,
    terminPembayaran: Array.isArray(project.terminPembayaran) ? project.terminPembayaran : [],
    files: Array.isArray(project.files) ? project.files : []
  }));
};

/**
 * Download a file from a project
 */
export const downloadFile = async (projectId: string, fileId: string, token: string): Promise<Blob> => {
  const response = await fetch(`${BACKEND_IP}/api/portfolio/${projectId}/files/${fileId}/download`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download file');
  }

  return response.blob();
};

/**
 * Get file URL for viewing
 */
export const getFileViewUrl = (projectId: string, fileId: string, token: string): string => {
  return `${BACKEND_IP}/api/portfolio/${projectId}/files/${fileId}/view?token=${token}`;
};