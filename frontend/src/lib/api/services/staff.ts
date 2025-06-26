import { apiClient } from '../client';

export interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'owner' | 'manager' | 'sales' | 'craftsman' | 'cashier';
  department: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'on_leave';
  permissions: string[];
  salary: number;
  commission_rate: number;
  address: string;
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  };
  performance_metrics: {
    sales_target: number;
    sales_achieved: number;
    customer_rating: number;
    orders_processed: number;
  };
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface StaffCreateRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'manager' | 'sales' | 'craftsman' | 'cashier';
  department: string;
  salary: number;
  commission_rate: number;
  address: string;
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  };
  permissions: string[];
}

export interface StaffFilters {
  role?: string;
  department?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface StaffAnalytics {
  total_staff: number;
  by_role: { role: string; count: number }[];
  by_department: { department: string; count: number }[];
  by_status: { status: string; count: number }[];
  average_performance: number;
  top_performers: StaffMember[];
}

class StaffService {
  private baseUrl = '/api/staff';

  // Get all staff members with filters
  async getStaff(filters?: StaffFilters): Promise<{
    staff: StaffMember[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.role) params.append('role', filters.role);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      // Return mock data for development
      return this.getMockStaff(filters);
    }
  }

  // Get single staff member
  async getStaffMember(id: string): Promise<StaffMember> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch staff member:', error);
      throw error;
    }
  }

  // Create new staff member
  async createStaffMember(data: StaffCreateRequest): Promise<StaffMember> {
    try {
      const response = await apiClient.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Failed to create staff member:', error);
      throw error;
    }
  }

  // Update staff member
  async updateStaffMember(id: string, data: Partial<StaffCreateRequest>): Promise<StaffMember> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update staff member:', error);
      throw error;
    }
  }

  // Delete staff member
  async deleteStaffMember(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Failed to delete staff member:', error);
      throw error;
    }
  }

  // Update staff status
  async updateStaffStatus(id: string, status: 'active' | 'inactive' | 'on_leave'): Promise<StaffMember> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Failed to update staff status:', error);
      throw error;
    }
  }

  // Update staff permissions
  async updateStaffPermissions(id: string, permissions: string[]): Promise<StaffMember> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/${id}/permissions`, { permissions });
      return response.data;
    } catch (error) {
      console.error('Failed to update staff permissions:', error);
      throw error;
    }
  }

  // Get staff analytics
  async getStaffAnalytics(): Promise<StaffAnalytics> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch staff analytics:', error);
      return {
        total_staff: 8,
        by_role: [
          { role: 'sales', count: 4 },
          { role: 'manager', count: 2 },
          { role: 'cashier', count: 1 },
          { role: 'craftsman', count: 1 }
        ],
        by_department: [
          { department: 'Sales', count: 4 },
          { department: 'Management', count: 2 },
          { department: 'Operations', count: 2 }
        ],
        by_status: [
          { status: 'active', count: 7 },
          { status: 'on_leave', count: 1 },
          { status: 'inactive', count: 0 }
        ],
        average_performance: 87.5,
        top_performers: []
      };
    }
  }

  // Get staff performance
  async getStaffPerformance(id: string, period: 'week' | 'month' | 'quarter' | 'year'): Promise<{
    sales_performance: any;
    customer_satisfaction: number;
    orders_processed: number;
    target_achievement: number;
  }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}/performance?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch staff performance:', error);
      throw error;
    }
  }

  // Mock data for development
  private getMockStaff(filters?: StaffFilters): {
    staff: StaffMember[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  } {
    const mockStaff: StaffMember[] = [
      {
        id: '1',
        first_name: 'Priya',
        last_name: 'Sharma',
        email: 'priya.sharma@jewelryshop.com',
        phone: '+91 98765 43210',
        role: 'manager',
        department: 'Sales',
        hire_date: '2022-01-15',
        status: 'active',
        permissions: ['view_orders', 'create_orders', 'view_customers', 'manage_inventory'],
        salary: 45000,
        commission_rate: 2.5,
        address: 'Bangalore, Karnataka',
        emergency_contact: {
          name: 'Raj Sharma',
          phone: '+91 98765 43211',
          relationship: 'Spouse'
        },
        performance_metrics: {
          sales_target: 500000,
          sales_achieved: 485000,
          customer_rating: 4.8,
          orders_processed: 156
        },
        created_at: new Date('2022-01-15').toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      },
      {
        id: '2',
        first_name: 'Rajesh',
        last_name: 'Kumar',
        email: 'rajesh.kumar@jewelryshop.com',
        phone: '+91 98765 43212',
        role: 'sales',
        department: 'Sales',
        hire_date: '2022-03-20',
        status: 'active',
        permissions: ['view_orders', 'create_orders', 'view_customers'],
        salary: 35000,
        commission_rate: 2.0,
        address: 'Bangalore, Karnataka',
        emergency_contact: {
          name: 'Sunita Kumar',
          phone: '+91 98765 43213',
          relationship: 'Wife'
        },
        performance_metrics: {
          sales_target: 400000,
          sales_achieved: 420000,
          customer_rating: 4.6,
          orders_processed: 134
        },
        created_at: new Date('2022-03-20').toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        first_name: 'Anita',
        last_name: 'Patel',
        email: 'anita.patel@jewelryshop.com',
        phone: '+91 98765 43214',
        role: 'sales',
        department: 'Sales',
        hire_date: '2022-06-10',
        status: 'active',
        permissions: ['view_orders', 'create_orders', 'view_customers'],
        salary: 32000,
        commission_rate: 2.0,
        address: 'Bangalore, Karnataka',
        emergency_contact: {
          name: 'Mohan Patel',
          phone: '+91 98765 43215',
          relationship: 'Father'
        },
        performance_metrics: {
          sales_target: 350000,
          sales_achieved: 365000,
          customer_rating: 4.7,
          orders_processed: 98
        },
        created_at: new Date('2022-06-10').toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: '4',
        first_name: 'Suresh',
        last_name: 'Reddy',
        email: 'suresh.reddy@jewelryshop.com',
        phone: '+91 98765 43216',
        role: 'cashier',
        department: 'Operations',
        hire_date: '2021-11-05',
        status: 'active',
        permissions: ['process_payments', 'view_orders'],
        salary: 28000,
        commission_rate: 0.5,
        address: 'Bangalore, Karnataka',
        emergency_contact: {
          name: 'Lakshmi Reddy',
          phone: '+91 98765 43217',
          relationship: 'Wife'
        },
        performance_metrics: {
          sales_target: 0,
          sales_achieved: 0,
          customer_rating: 4.5,
          orders_processed: 287
        },
        created_at: new Date('2021-11-05').toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date(Date.now() - 1800000).toISOString()
      }
    ];

    const filteredStaff = mockStaff.filter(staff => {
      if (filters?.role && staff.role !== filters.role) return false;
      if (filters?.department && staff.department !== filters.department) return false;
      if (filters?.status && staff.status !== filters.status) return false;
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        const fullName = `${staff.first_name} ${staff.last_name}`.toLowerCase();
        if (!fullName.includes(search) && !staff.email.toLowerCase().includes(search)) {
          return false;
        }
      }
      return true;
    });

    return {
      staff: filteredStaff,
      total: filteredStaff.length,
      page: filters?.page || 1,
      limit: filters?.limit || 20,
      total_pages: Math.ceil(filteredStaff.length / (filters?.limit || 20))
    };
  }
}

export const staffService = new StaffService();