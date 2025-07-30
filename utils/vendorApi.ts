interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface Vendor {
  id: string;
  namaVendor: string;
  alamat: string;
  noTlp: string;
  portofolioProject: string;
  pics: PIC[];
  createdAt: string;
  updatedAt: string;
}

interface PIC {
  id: string;
  nama: string;
  email: string;
  noHP: string;
  role: string;
}

class VendorApiService {
  private baseUrl = process.env.NEXT_PUBLIC_ITM_SERVICE_URL;

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || `HTTP error! status: ${response.status}`
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getAllVendors(token: string): Promise<ApiResponse<Vendor[]>> {
    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/vendors`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        return {
          success: false,
          error: 'Authentication failed. Please login again.'
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`
        };
      }

      const data = await response.json();
      
      // Data is already in the correct format from backend
      const transformedData = data.data || data;
      
      return {
        success: true,
        data: transformedData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async createVendor(vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>, token: string): Promise<ApiResponse<Vendor>> {
    // Send data in frontend format - backend will handle it
    const transformedData = {
      namaVendor: vendorData.namaVendor,
      alamat: vendorData.alamat,
      noTlp: vendorData.noTlp,
      portofolioProject: vendorData.portofolioProject,
      pics: vendorData.pics
    };

    const response = await fetch(`${this.baseUrl}/api/vendors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedData),
    });

    return this.handleResponse<Vendor>(response);
  }

  async updateVendor(id: string, vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>, token: string): Promise<ApiResponse<Vendor>> {
    // Send data in frontend format - backend will handle it
    const transformedData = {
      namaVendor: vendorData.namaVendor,
      alamat: vendorData.alamat,
      noTlp: vendorData.noTlp,
      portofolioProject: vendorData.portofolioProject,
      pics: vendorData.pics
    };

    const response = await fetch(`${this.baseUrl}/api/vendors/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedData),
    });

    return this.handleResponse<Vendor>(response);
  }

  async deleteVendor(id: string, token: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/api/vendors/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return this.handleResponse<void>(response);
  }
}

export const vendorApiService = new VendorApiService();