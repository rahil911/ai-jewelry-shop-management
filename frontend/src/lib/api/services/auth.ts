import { apiClient } from '../client';
import { tokenManager } from '@/lib/auth/tokenManager';

// Authentication Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'owner' | 'manager' | 'staff' | 'customer';
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_in: number;
}

export interface RefreshTokenResponse {
  token: string;
  expires_in: number;
}

class AuthService {
  private get baseUrl() {
    return '/api/auth';
  }

  // User authentication
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${this.baseUrl}/login`, credentials);
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem('jewelry_token', response.token);
      localStorage.setItem('jewelry_user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${this.baseUrl}/register`, userData);
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem('jewelry_token', response.token);
      localStorage.setItem('jewelry_user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/logout`);
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      this.clearStoredData();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      // Try API refresh first
      const response = await apiClient.post<AuthResponse>(`${this.baseUrl}/refresh`);
      
      if (response.token) {
        localStorage.setItem('jewelry_token', response.token);
        localStorage.setItem('jewelry_user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      console.warn('🔄 API refresh failed, using token manager fallback');
      
      // Fallback to token manager for development/testing
      const newToken = tokenManager.forceRefresh();
      const payload = tokenManager.getTokenPayload(newToken);
      
      if (!payload) {
        throw new Error('Failed to generate fallback token');
      }
      
      const fallbackResponse: AuthResponse = {
        user: {
          id: payload.id,
          email: payload.email,
          first_name: payload.first_name,
          last_name: payload.last_name,
          role: payload.role as any,
          phone: '',
          address: '',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        token: newToken,
        expires_in: 24 * 60 * 60 // 24 hours
      };
      
      return fallbackResponse;
    }
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>(`${this.baseUrl}/me`);
  }

  // OTP functionality
  async sendOTP(phone: string): Promise<{ message: string }> {
    return apiClient.post(`${this.baseUrl}/otp/send`, { phone });
  }

  async verifyOTP(phone: string, otp: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${this.baseUrl}/otp/verify`, { phone, otp });
    
    if (response.token) {
      localStorage.setItem('jewelry_token', response.token);
      localStorage.setItem('jewelry_user', JSON.stringify(response.user));
    }
    
    return response;
  }

  // Password management
  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post(`${this.baseUrl}/forgot-password`, { email });
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return apiClient.post(`${this.baseUrl}/reset-password`, { token, password });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return apiClient.post(`${this.baseUrl}/change-password`, { 
      current_password: currentPassword, 
      new_password: newPassword 
    });
  }

  // Local storage utilities
  getStoredToken(): string | null {
    try {
      // Use token manager for always-valid tokens
      return tokenManager.getValidToken();
    } catch (error) {
      console.error('❌ Failed to get stored token:', error);
      return null;
    }
  }

  getStoredUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('jewelry_user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (error) {
          console.warn('Failed to parse stored user data:', error);
          this.clearStoredData();
        }
      }
    }
    return null;
  }

  clearStoredData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jewelry_token');
      localStorage.removeItem('jewelry_user');
    }
  }

  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }

  hasRole(requiredRole: string): boolean {
    const user = this.getStoredUser();
    if (!user) return false;
    
    // Role hierarchy: owner > manager > staff > customer
    const roleHierarchy = {
      'owner': 4,
      'manager': 3,
      'staff': 2,
      'customer': 1
    };
    
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    
    return userLevel >= requiredLevel;
  }
}

export const authService = new AuthService();