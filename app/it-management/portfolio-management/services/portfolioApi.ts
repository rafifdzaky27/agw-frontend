// API service for Portfolio Management
import { transformObjectToCamelCase, transformObjectToSnakeCase } from '../../../../utils/dataTransform';

const BACKEND_IP = process.env.NEXT_PUBLIC_BACKEND_IP || "http://localhost:5006";

export interface PaymentTerm {
  id: string;
  projectId?: string;
  termin: string;
  nominal: number;
  description: string;
  status?: string;
  paymentDate?: string | null;
  budgetType?: string | null;
  notes?: string | null;
  opexCabang?: number | null;
  opexPusat?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgreementFile {
  id: string;
  projectId?: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  downloadUrl?: string;
  file?: File; // For frontend file handling
  data?: string; // For base64 data transport
}

export interface Agreement {
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
  terminPembayaran?: PaymentTerm[];
  files: AgreementFile[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  count?: number;
}

class PortfolioApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('token');
    
    // Check if body is FormData
    const isFormData = options.body instanceof FormData;
    
    const defaultHeaders: Record<string, string> = {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
    
    // Only set Content-Type for non-FormData requests
    if (!isFormData) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    console.log("\n📡 ===== API REQUEST DEBUG =====");
    console.log("🔗 Endpoint:", `${BACKEND_IP}${endpoint}`);
    console.log("🔧 Method:", options.method || 'GET');
    console.log("🔑 Headers:", defaultHeaders);
    if (options.body && !isFormData) {
      console.log("📦 Request Body:", options.body);
    }

    try {
      const response = await fetch(`${BACKEND_IP}${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      console.log("📊 Response Status:", response.status);
      console.log("📊 Response OK:", response.ok);

      if (!response.ok) {
        // Try to get error details from response
        let errorDetails = '';
        try {
          const errorText = await response.text();
          console.error("❌ Error Response Body:", errorText);
          errorDetails = errorText;
        } catch (e) {
          console.error("❌ Could not read error response body");
        }
        
        throw new Error(`HTTP error! status: ${response.status}${errorDetails ? ` - ${errorDetails}` : ''}`);
      }

      const data = await response.json();
      console.log("✅ Response Data:", data);
      return data;
    } catch (error) {
      console.error("❌ API Request Failed:");
      console.error("   Endpoint:", `${BACKEND_IP}${endpoint}`);
      console.error("   Method:", options.method || 'GET');
      console.error("   Error:", error);
      throw error;
    }
  }

  // Get all projects/agreements
  async getAllProjects(params: {
    page?: number;
    limit?: number;
    search?: string;
    project_type?: string;
    year?: string;
  } = {}): Promise<ApiResponse<Agreement[]>> {
    console.log("\n🔍 ===== FRONTEND API GET ALL PROJECTS DEBUG START =====");
    console.log("📅 Timestamp:", new Date().toISOString());
    console.log("📥 Request Parameters:", JSON.stringify(params, null, 2));
    
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.project_type) queryParams.append('project_type', params.project_type);
    if (params.year) queryParams.append('year', params.year);

    const queryString = queryParams.toString();
    const endpoint = `/api/portfolio/projects${queryString ? `?${queryString}` : ''}`;
    
    console.log("🚀 Making API request to:", endpoint);
    
    try {
      const response = await this.makeRequest<any[]>(endpoint);
      
      console.log("✅ Raw API Response received:");
      console.log("📊 Success:", response.success);
      console.log("📋 Message:", response.message);
      console.log("📊 Data Count:", response.data?.length || 0);
      console.log("📋 Pagination:", JSON.stringify(response.pagination, null, 2));
      
      // Analyze first project data BEFORE transformation
      if (response.data && response.data.length > 0) {
        console.log("\n🔍 FIRST PROJECT DATA ANALYSIS (BEFORE TRANSFORMATION):");
        const firstProject = response.data[0];
        console.log("📋 Project Keys:", Object.keys(firstProject));
        
        Object.keys(firstProject).forEach(key => {
          const value = firstProject[key];
          let status = "✅ OK";
          let analysis = "";
          
          if (key === 'terminPembayaran' || key === 'termin_pembayaran') {
            status = Array.isArray(value) ? "✅ OK" : "❌ NOT ARRAY";
            analysis = `Array with ${Array.isArray(value) ? value.length : 0} items`;
          } else if (key === 'files') {
            status = Array.isArray(value) ? "✅ OK" : "❌ NOT ARRAY";
            analysis = `Array with ${Array.isArray(value) ? value.length : 0} items`;
          } else {
            const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
            status = isEmpty ? "❌ EMPTY" : "✅ OK";
            analysis = `${typeof value} = ${JSON.stringify(value)}`;
          }
          
          console.log(`${status} ${key}: ${analysis}`);
        });
      }
      
      // Transform data from snake_case to camelCase
      console.log("\n🔄 TRANSFORMING DATA FROM SNAKE_CASE TO CAMELCASE...");
      const transformedData = response.data.map((project: any) => transformObjectToCamelCase(project));
      
      // Analyze first project data AFTER transformation
      if (transformedData && transformedData.length > 0) {
        console.log("\n🔍 FIRST PROJECT DATA ANALYSIS (AFTER TRANSFORMATION):");
        const firstProject = transformedData[0];
        console.log("📋 Project Keys:", Object.keys(firstProject));
        
        Object.keys(firstProject).forEach(key => {
          const value = firstProject[key];
          let status = "✅ OK";
          let analysis = "";
          
          if (key === 'terminPembayaran') {
            status = Array.isArray(value) ? "✅ OK" : "❌ NOT ARRAY";
            analysis = `Array with ${Array.isArray(value) ? value.length : 0} items`;
          } else if (key === 'files') {
            status = Array.isArray(value) ? "✅ OK" : "❌ NOT ARRAY";
            analysis = `Array with ${Array.isArray(value) ? value.length : 0} items`;
          } else {
            const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
            status = isEmpty ? "❌ EMPTY" : "✅ OK";
            analysis = `${typeof value} = ${JSON.stringify(value)}`;
          }
          
          console.log(`${status} ${key}: ${analysis}`);
        });
      }
      
      const transformedResponse = {
        ...response,
        data: transformedData
      };
      
      console.log("🔍 ===== FRONTEND API GET ALL PROJECTS DEBUG END =====\n");
      return transformedResponse;
    } catch (error) {
      console.error("\n❌ FRONTEND API GET ALL PROJECTS ERROR:");
      console.error("   - Error Message:", error instanceof Error ? error.message : 'Unknown error');
      console.error("   - Error Object:", error);
      console.log("🔍 ===== FRONTEND API GET ALL PROJECTS DEBUG END (ERROR) =====\n");
      throw error;
    }
  }

  // Get project by ID
  async getProjectById(id: string): Promise<ApiResponse<Agreement>> {
    console.log("\n🔍 ===== GET PROJECT BY ID DEBUG START =====");
    console.log("📅 Timestamp:", new Date().toISOString());
    console.log("🆔 Project ID:", id);
    
    const response = await this.makeRequest<any>(`/api/portfolio/projects/${id}`);
    
    console.log("✅ Raw API Response received:");
    console.log("📊 Success:", response.success);
    console.log("📋 Message:", response.message);
    
    if (response.data) {
      console.log("\n🔍 RAW DATA ANALYSIS (BEFORE TRANSFORMATION):");
      console.log("📋 Data Keys:", Object.keys(response.data));
      console.log("📋 terminPembayaran exists:", !!response.data.terminPembayaran);
      console.log("📋 terminPembayaran length:", response.data.terminPembayaran?.length);
      console.log("📋 files exists:", !!response.data.files);
      console.log("📋 files length:", response.data.files?.length);
      
      if (response.data.terminPembayaran && response.data.terminPembayaran.length > 0) {
        console.log("💰 First payment term:", JSON.stringify(response.data.terminPembayaran[0], null, 2));
      }
    }
    
    // Transform data from snake_case to camelCase
    console.log("\n🔄 TRANSFORMING DATA FROM SNAKE_CASE TO CAMELCASE...");
    const transformedData = transformObjectToCamelCase(response.data);
    
    if (transformedData) {
      console.log("\n🔍 TRANSFORMED DATA ANALYSIS (AFTER TRANSFORMATION):");
      console.log("📋 Data Keys:", Object.keys(transformedData));
      console.log("📋 terminPembayaran exists:", !!transformedData.terminPembayaran);
      console.log("📋 terminPembayaran length:", transformedData.terminPembayaran?.length);
      console.log("📋 files exists:", !!transformedData.files);
      console.log("📋 files length:", transformedData.files?.length);
      
      if (transformedData.terminPembayaran && transformedData.terminPembayaran.length > 0) {
        console.log("💰 First payment term (transformed):", JSON.stringify(transformedData.terminPembayaran[0], null, 2));
      }
    }
    
    const finalResponse = {
      ...response,
      data: transformedData
    };
    
    console.log("🔍 ===== GET PROJECT BY ID DEBUG END =====\n");
    
    return finalResponse;
  }

  // Create new project
  async createProject(projectData: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Agreement>> {
    console.log("\n🔍 ===== API SERVICE DEBUG START =====");
    console.log("📥 API Service Input (camelCase):", JSON.stringify(projectData, null, 2));
    
    // Check if there are files to upload
    const hasFiles = projectData.files && projectData.files.length > 0;
    
    if (hasFiles) {
      console.log("📎 Files detected, but backend doesn't support multipart");
      console.log("📋 Converting files to base64 for JSON transport");
      
      // Convert files to base64 for JSON transport
      const filesWithBase64 = await Promise.all(
        projectData.files.map(async (fileItem) => {
          if (fileItem.file) {
            try {
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  // Remove data:mime/type;base64, prefix
                  const base64Data = result.split(',')[1];
                  resolve(base64Data);
                };
                reader.onerror = reject;
                reader.readAsDataURL(fileItem.file!);
              });
              
              return {
                id: fileItem.id,
                name: fileItem.name,
                size: fileItem.size,
                type: fileItem.type,
                uploadedAt: fileItem.uploadedAt,
                data: base64 // Add base64 data
              };
            } catch (error) {
              console.error(`Failed to convert file ${fileItem.name} to base64:`, error);
              return {
                id: fileItem.id,
                name: fileItem.name,
                size: fileItem.size,
                type: fileItem.type,
                uploadedAt: fileItem.uploadedAt
              };
            }
          }
          return {
            id: fileItem.id,
            name: fileItem.name,
            size: fileItem.size,
            type: fileItem.type,
            uploadedAt: fileItem.uploadedAt
          };
        })
      );
      
      // Create project data with base64 files
      const projectDataWithBase64Files = {
        ...projectData,
        files: filesWithBase64
      };
      
      console.log("📤 API Service Output (with base64 files):", JSON.stringify({
        ...projectDataWithBase64Files,
        files: projectDataWithBase64Files.files.map(f => ({
          ...f,
          data: f.data ? `[BASE64 DATA ${f.data.length} chars]` : undefined
        }))
      }, null, 2));
      
      console.log("🚀 Making JSON API request with base64 files to /api/portfolio/projects");
      
      try {
        const response = await this.makeRequest<any>('/api/portfolio/projects', {
          method: 'POST',
          body: JSON.stringify(projectDataWithBase64Files),
        });
        
        console.log("✅ Raw API Response received:", JSON.stringify(response, null, 2));
        
        // Transform response data from snake_case to camelCase
        const transformedResponseData = transformObjectToCamelCase(response.data);
        
        const finalResponse = {
          ...response,
          data: transformedResponseData
        };
        
        console.log("✅ Transformed API Response:", JSON.stringify(finalResponse, null, 2));
        console.log("🔍 ===== API SERVICE DEBUG END =====\n");
        
        return finalResponse;
      } catch (error) {
        console.error("❌ API Service Error:", error);
        console.log("🔍 ===== API SERVICE DEBUG END =====\n");
        throw error;
      }
    } else {
      console.log("📋 No files, using standard JSON request");
      
      // Backend expects camelCase - DON'T transform to snake_case!
      console.log("📤 API Service Output (keeping camelCase):", JSON.stringify(projectData, null, 2));
      
      // Validate data before sending
      console.log("🔍 API Service Field Analysis:");
      Object.keys(projectData).forEach(key => {
        const value = projectData[key as keyof typeof projectData];
        if (key === 'terminPembayaran') {
          console.log(`✅ ${key}: Array with ${Array.isArray(value) ? value.length : 0} items`);
        } else {
          const isEmpty = !value || value.toString().trim() === '';
          const status = isEmpty ? "❌ EMPTY" : "✅ OK";
          console.log(`${status} ${key}: "${value}"`);
        }
      });
      
      console.log("🚀 Making API request to /api/portfolio/projects");
      
      try {
        const response = await this.makeRequest<any>('/api/portfolio/projects', {
          method: 'POST',
          body: JSON.stringify(projectData), // Send camelCase data directly
        });
        
        console.log("✅ Raw API Response received:", JSON.stringify(response, null, 2));
        
        // Transform response data from snake_case to camelCase
        const transformedResponseData = transformObjectToCamelCase(response.data);
        
        const finalResponse = {
          ...response,
          data: transformedResponseData
        };
        
        console.log("✅ Transformed API Response:", JSON.stringify(finalResponse, null, 2));
        console.log("🔍 ===== API SERVICE DEBUG END =====\n");
        
        return finalResponse;
      } catch (error) {
        console.error("❌ API Service Error:", error);
        console.log("🔍 ===== API SERVICE DEBUG END =====\n");
        throw error;
      }
    }
  }

  // Update project
  async updateProject(id: string, projectData: Partial<Agreement>): Promise<ApiResponse<Agreement>> {
    console.log("\n🔧 ===== UPDATE PROJECT DEBUG =====");
    console.log("📅 Timestamp:", new Date().toISOString());
    console.log("🆔 Project ID:", id);
    console.log("📋 Original projectData:", projectData);
    console.log("📋 ProjectData keys:", Object.keys(projectData || {}));
    
    // Transform data from camelCase to snake_case for backend
    const transformedData = transformObjectToSnakeCase(projectData);
    
    // WORKAROUND: Try multiple field name formats to handle backend validation
    const backendData = {
      ...transformedData,
      // Ensure all possible field name variations are included
      name: transformedData.project_name || transformedData.projectName,
      type: transformedData.project_type || transformedData.projectType,
      division: transformedData.divisi_inisiasi || transformedData.divisiInisiasi,
      group: transformedData.grup_terlibat || transformedData.grupTerlibat,
      
      // Vendor field variations
      vendor: transformedData.nama_vendor || transformedData.namaVendor,
      vendor_name: transformedData.nama_vendor || transformedData.namaVendor,
      vendorName: projectData.namaVendor,
      
      // PKS/PO field variations
      pks_po: transformedData.no_pks_po || transformedData.noPKSPO,
      pks_po_number: transformedData.no_pks_po || transformedData.noPKSPO,
      po_number: transformedData.no_pks_po || transformedData.noPKSPO,
      contract_number: transformedData.no_pks_po || transformedData.noPKSPO,
      noPKSPO: projectData.noPKSPO,
      
      // Date field variations - CRITICAL FIX
      pks_date: transformedData.tanggal_pks_po,
      pks_po_date: transformedData.tanggal_pks_po,
      contract_date: transformedData.tanggal_pks_po,
      start_date: transformedData.tanggal_pks_po,
      tanggalPKSPO: projectData.tanggalPKSPO,
      
      bapp_date: transformedData.tanggal_bapp,
      handover_date: transformedData.tanggal_bapp,
      delivery_date: transformedData.tanggal_bapp,
      tanggalBAPP: projectData.tanggalBAPP,
      
      end_date: transformedData.tanggal_berakhir,
      finish_date: transformedData.tanggal_berakhir,
      completion_date: transformedData.tanggal_berakhir,
      tanggalBerakhir: projectData.tanggalBerakhir,
      
      // Payment terms variations - CRITICAL FIX
      payment_terms: transformedData.termin_pembayaran,
      payments: transformedData.termin_pembayaran,
      terms: transformedData.termin_pembayaran,
      terminPembayaran: projectData.terminPembayaran,
      
      // Keep original snake_case fields
      project_name: transformedData.project_name,
      project_type: transformedData.project_type,
      divisi_inisiasi: transformedData.divisi_inisiasi,
      grup_terlibat: transformedData.grup_terlibat,
      nama_vendor: transformedData.nama_vendor,
      no_pks_po: transformedData.no_pks_po,
      tanggal_pks_po: transformedData.tanggal_pks_po,
      tanggal_bapp: transformedData.tanggal_bapp,
      tanggal_berakhir: transformedData.tanggal_berakhir,
      termin_pembayaran: transformedData.termin_pembayaran,
      
      // Try camelCase as backup
      projectName: projectData.projectName,
      projectType: projectData.projectType,
      divisiInisiasi: projectData.divisiInisiasi,
      grupTerlibat: projectData.grupTerlibat,
      namaVendor: projectData.namaVendor
    };
    
    // Debug date values specifically
    console.log("\n📅 DATE VALUES DEBUG:");
    console.log("   Original tanggalPKSPO:", projectData.tanggalPKSPO);
    console.log("   Original tanggalBAPP:", projectData.tanggalBAPP);
    console.log("   Original tanggalBerakhir:", projectData.tanggalBerakhir);
    console.log("   Transformed tanggal_pks_po:", transformedData.tanggal_pks_po);
    console.log("   Transformed tanggal_bapp:", transformedData.tanggal_bapp);
    console.log("   Transformed tanggal_berakhir:", transformedData.tanggal_berakhir);
    
    // Debug payment terms specifically
    console.log("\n💰 PAYMENT TERMS DEBUG:");
    console.log("   Original terminPembayaran:", projectData.terminPembayaran);
    console.log("   Transformed termin_pembayaran:", transformedData.termin_pembayaran);
    console.log("   Payment terms count:", (projectData.terminPembayaran || []).length);
    
    // Enhanced payment terms processing
    if (projectData.terminPembayaran && projectData.terminPembayaran.length > 0) {
      console.log("   💰 Processing payment terms:");
      projectData.terminPembayaran.forEach((term, index) => {
        console.log(`      Term ${index + 1}:`, {
          id: term.id,
          termin: term.termin,
          nominal: term.nominal,
          description: term.description
        });
      });
      
      // Add multiple payment terms field variations with different structures
      const paymentTermsArray = projectData.terminPembayaran.map(term => ({
        id: term.id,
        termin: term.termin,
        nominal: Number(term.nominal) || 0,
        description: term.description || "",
        // Add additional fields that backend might expect
        name: term.termin,
        amount: Number(term.nominal) || 0,
        desc: term.description || "",
        term_name: term.termin,
        term_amount: Number(term.nominal) || 0,
        term_description: term.description || ""
      }));
      
      // Add all possible payment terms field variations
      backendData.termin_pembayaran = paymentTermsArray;
      backendData.payment_terms = paymentTermsArray;
      backendData.payments = paymentTermsArray;
      backendData.terms = paymentTermsArray;
      backendData.terminPembayaran = paymentTermsArray;
      backendData.paymentTerms = paymentTermsArray;
      backendData.project_payments = paymentTermsArray;
      backendData.project_terms = paymentTermsArray;
      
      console.log("   💰 Enhanced payment terms structure:", paymentTermsArray);
    } else {
      console.log("   💰 No payment terms to process");
      // Still send empty arrays for all variations
      backendData.termin_pembayaran = [];
      backendData.payment_terms = [];
      backendData.payments = [];
      backendData.terms = [];
      backendData.terminPembayaran = [];
      backendData.paymentTerms = [];
      backendData.project_payments = [];
      backendData.project_terms = [];
    }
    
    console.log("🔄 Transformed data (snake_case):", transformedData);
    console.log("🔄 Backend data (multiple formats):", backendData);
    console.log("🔄 Transformed data keys:", Object.keys(transformedData || {}));
    console.log("📡 API Endpoint:", `/api/portfolio/projects/${id}`);
    console.log("📡 Request method: PUT");
    console.log("📡 Request body:", JSON.stringify(backendData, null, 2));
    
    try {
      const response = await this.makeRequest<any>(`/api/portfolio/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(backendData),
      });
      
      console.log("✅ API Response success:", response);
      
      // Debug payment terms in response
      console.log("\n💰 ===== PAYMENT TERMS RESPONSE DEBUG =====");
      console.log("📋 Response data:", response.data);
      console.log("💰 Payment terms in response (raw):", response.data?.terminPembayaran || response.data?.termin_pembayaran);
      console.log("💰 Payment terms count in response:", (response.data?.terminPembayaran || response.data?.termin_pembayaran || []).length);
      
      // WORKAROUND: If backend doesn't return payment terms but we sent them, preserve them
      let responseData = response.data;
      const sentPaymentTerms = projectData.terminPembayaran;
      const receivedPaymentTerms = response.data?.terminPembayaran || response.data?.termin_pembayaran;
      
      if (sentPaymentTerms && sentPaymentTerms.length > 0 && (!receivedPaymentTerms || receivedPaymentTerms.length === 0)) {
        console.log("🔧 WORKAROUND: Backend didn't return payment terms, preserving sent data");
        console.log("💰 Preserving payment terms:", sentPaymentTerms);
        
        // Add payment terms to response data
        responseData = {
          ...response.data,
          terminPembayaran: sentPaymentTerms,
          termin_pembayaran: sentPaymentTerms
        };
        
        console.log("✅ Payment terms preserved in response");
      }
      
      // Transform response data from snake_case to camelCase
      const transformedResponseData = transformObjectToCamelCase(responseData);
      
      console.log("💰 Payment terms after transformation:", transformedResponseData?.terminPembayaran);
      console.log("💰 Payment terms count after transformation:", (transformedResponseData?.terminPembayaran || []).length);
      
      return {
        ...response,
        data: transformedResponseData
      };
    } catch (error) {
      console.error("❌ API Request failed:");
      console.error("   Error:", error);
      console.error("   Project ID:", id);
      console.error("   Transformed data:", transformedData);
      console.error("   Backend data:", backendData);
      throw error;
    }
  }

  // Delete project
  async deleteProject(id: string): Promise<ApiResponse<Agreement>> {
    return this.makeRequest<Agreement>(`/api/portfolio/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Bulk delete projects
  async bulkDeleteProjects(projectIds: string[]): Promise<ApiResponse<{ id: string }[]>> {
    return this.makeRequest('/api/portfolio/projects/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ projectIds }),
    });
  }

  // Export projects
  async exportProjects(params: {
    search?: string;
    project_type?: string;
    year?: string;
    projectIds?: string[];
  } = {}): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.project_type) queryParams.append('project_type', params.project_type);
    if (params.year) queryParams.append('year', params.year);
    if (params.projectIds) queryParams.append('projectIds', params.projectIds.join(','));

    const queryString = queryParams.toString();
    const endpoint = `/api/portfolio/projects/export${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<any[]>(endpoint);
  }

  // Upload files
  async uploadFiles(projectId: string, files: File[]): Promise<ApiResponse<{
    uploaded: AgreementFile[];
    errors: Array<{ filename: string; error: string }>;
  }>> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${BACKEND_IP}/api/portfolio/files/upload/${projectId}`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Upload single file
  async uploadSingleFile(projectId: string, file: File): Promise<ApiResponse<AgreementFile>> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BACKEND_IP}/api/portfolio/files/upload-single/${projectId}`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get file info
  async getFileInfo(fileId: string): Promise<ApiResponse<AgreementFile>> {
    return this.makeRequest<AgreementFile>(`/api/portfolio/files/${fileId}/info`);
  }

  // Delete file
  async deleteFile(fileId: string): Promise<ApiResponse<AgreementFile>> {
    return this.makeRequest<AgreementFile>(`/api/portfolio/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Get download URL for file
  getFileDownloadUrl(fileId: string): string {
    return `${BACKEND_IP}/api/portfolio/files/${fileId}`;
  }

  // Get file statistics
  async getFileStatistics(): Promise<ApiResponse<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
  }>> {
    return this.makeRequest('/api/portfolio/files/statistics');
  }
}

export const portfolioApi = new PortfolioApiService();
