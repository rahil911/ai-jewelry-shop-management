import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { tokenManager } from '@/lib/auth/tokenManager';

// API Configuration
interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

const DEFAULT_CONFIG: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://4.236.132.147',
  timeout: 30000,
  retries: 3,
};

class ApiClient {
  private client: AxiosInstance;
  private config: ApiConfig;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 unauthorized - token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            console.log('🔄 401 Unauthorized - refreshing token automatically...');
            
            // Force refresh token using token manager
            const newToken = tokenManager.forceRefresh();
            
            // Update the failed request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            console.log('✅ Token refreshed, retrying request...');
            
            // Retry the original request with new token
            return this.client(originalRequest);
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            this.clearStoredToken();
            
            // Only redirect to login if we can't refresh the token
            // For development: just log the error
            console.warn('🚫 Could not refresh token - API call failed');
            // window.location.href = '/auth/login'; // Disabled for testing
            
            return Promise.reject(error);
          }
        }

        // Retry logic for network errors
        if (
          !originalRequest._retry && 
          originalRequest._retryCount < this.config.retries &&
          (error.code === 'NETWORK_ERROR' || error.response?.status >= 500)
        ) {
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          originalRequest._retry = true;
          
          // Exponential backoff
          const delay = Math.pow(2, originalRequest._retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.client(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  private getStoredToken(): string | null {
    try {
      // Use token manager to get always-valid token
      const validToken = tokenManager.getValidToken();
      console.log('🔑 Using token manager for API authentication');
      return validToken;
    } catch (error) {
      console.error('❌ Failed to get valid token:', error);
      return null;
    }
  }

  private clearStoredToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jewelry_token');
    }
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health');
  }

  // Update base URL (useful for switching environments)
  updateBaseURL(newBaseURL: string): void {
    this.config.baseURL = newBaseURL;
    this.client.defaults.baseURL = newBaseURL;
  }

  // Get current config
  getConfig(): ApiConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
export type { ApiConfig };