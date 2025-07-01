const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Token yönetimi
export const tokenManager = {
  getToken: () => localStorage.getItem('auth_token'),
  setToken: (token: string) => localStorage.setItem('auth_token', token),
  removeToken: () => localStorage.removeItem('auth_token'),
  isTokenValid: () => {
    const token = tokenManager.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
};

// HTTP client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Auth token ekle
    const token = tokenManager.getToken();
    if (token && tokenManager.isTokenValid()) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// API Response types
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

// Auth API
export const authAPI = {
  register: async (userData: { email: string; password: string; name: string }) => {
    const response: ApiResponse<{ user: any; token: string }> = await apiClient.post('/auth/register', userData);
    if (response.success && response.data?.token) {
      tokenManager.setToken(response.data.token);
    }
    return response;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response: ApiResponse<{ user: any; token: string }> = await apiClient.post('/auth/login', credentials);
    if (response.success && response.data?.token) {
      tokenManager.setToken(response.data.token);
    }
    return response;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      tokenManager.removeToken();
    }
  },

  getProfile: async () => {
    const response: ApiResponse<{ user: any }> = await apiClient.get('/auth/profile');
    return response;
  },

  resetPassword: async (emailData: { email: string }) => {
    const response: ApiResponse<any> = await apiClient.post('/auth/reset-password', emailData);
    return response;
  },

  // Admin fonksiyonları
  getAllUsers: async () => {
    const response: ApiResponse<{ users: any[] }> = await apiClient.get('/auth/admin/users');
    return response;
  },

  updateUserRole: async (userId: string, role: 'user' | 'admin') => {
    const response: ApiResponse<{ user: any }> = await apiClient.put('/auth/admin/user/role', { userId, role });
    return response;
  },

  updateUserPassword: async (userId: string, newPassword: string) => {
    const response: ApiResponse<any> = await apiClient.put('/auth/admin/user/password', { userId, newPassword });
    return response;
  }
};

// CV API
export const cvAPI = {
  getCVData: async (userId: string) => {
    const response: ApiResponse<any> = await apiClient.get(`/cv/${userId}`);
    return response.data;
  },

  saveCVData: async (userId: string, cvData: any) => {
    const response: ApiResponse<any> = await apiClient.put(`/cv/${userId}`, cvData);
    return response.data;
  },

  getAllCVs: async () => {
    const response: ApiResponse<any[]> = await apiClient.get('/cv');
    return response.data || [];
  },

  deleteCVData: async (userId: string) => {
    const response: ApiResponse<any> = await apiClient.delete(`/cv/${userId}`);
    return response;
  },

  initializeEmptyCV: async (userId: string) => {
    const response: ApiResponse<any> = await apiClient.post(`/cv/${userId}/initialize`);
    return response.data;
  },

  searchCVs: async (keywords: string) => {
    const response: ApiResponse<any[]> = await apiClient.get(`/cv/search/query?keywords=${encodeURIComponent(keywords)}`);
    return response.data || [];
  }
};

// Utility functions
export const handleApiError = (error: any): string => {
  if (error.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Bilinmeyen bir hata oluştu';
}; 