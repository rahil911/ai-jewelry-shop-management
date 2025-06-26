import { apiClient } from '../client';

// Complete Order Management API interfaces based on backend v2.0 specification
export interface OrderItem {
  id: number;
  jewelry_item_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customization_details?: string;
}

export interface JewelryOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  staff_id: number;
  staff_name: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  order_type: 'sale' | 'repair' | 'custom';
  subtotal: number;
  making_charges: number;
  wastage_amount: number;
  gst_amount: number;
  total_amount: number;
  special_instructions?: string;
  estimated_completion?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

// Repair-related interfaces
export interface RepairOrder {
  id: number;
  order_id: number;
  item_description: string;
  problem_description: string;
  repair_type: string;
  estimated_cost: number;
  estimated_completion: string;
  actual_cost?: number;
  repair_notes?: string;
  customer_approval_required: boolean;
  customer_approved?: boolean;
  before_photos: string[];
  after_photos: string[];
  repair_status: 'received' | 'assessed' | 'approved' | 'in_progress' | 'completed' | 'ready_for_pickup';
  technician_id?: number;
  created_at: string;
}

// Return/Exchange interfaces
export interface ReturnRequest {
  id: number;
  order_id: number;
  return_type: 'full_return' | 'partial_return' | 'exchange';
  reason: string;
  reason_details: string;
  items_to_return: any[];
  return_amount: number;
  exchange_items?: any[];
  exchange_amount_difference?: number;
  status: 'requested' | 'approved' | 'rejected' | 'processed' | 'completed';
  processed_by?: number;
  refund_method?: string;
  refund_reference?: string;
  created_at: string;
  processed_at?: string;
}

export interface CreateOrderRequest {
  customer_id: number;
  order_type: 'sale' | 'repair' | 'custom';
  items: {
    jewelry_item_id: number;
    quantity: number;
    unit_price?: number;
    customization_details?: string;
  }[];
  special_instructions?: string;
  estimated_completion?: string;
}

export interface CreateRepairRequest {
  order_id?: number;
  item_description: string;
  problem_description: string;
  repair_type: string;
  estimated_cost?: number;
  estimated_completion?: string;
  before_photos?: string[];
}

export interface CreateReturnRequest {
  order_id: number;
  return_type: 'full_return' | 'partial_return' | 'exchange';
  reason: string;
  reason_details: string;
  items_to_return: any[];
  exchange_items?: any[];
}

export interface UpdateOrderRequest {
  status?: string;
  special_instructions?: string;
  estimated_completion?: string;
}

export interface OrderFilters {
  status?: string;
  order_type?: string;
  customer_id?: number;
  staff_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  confirmed_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  completed_today: number;
  average_order_value: number;
  orders_by_status: Record<string, number>;
  orders_by_type: Record<string, number>;
  monthly_revenue?: number;
  growth_rate?: number;
}

class OrderService {
  private baseUrl = '/api/orders';
  private repairUrl = '/api/repairs';
  private returnUrl = '/api/returns';
  private notificationUrl = '/api/notifications';

  // ===== ORDER MANAGEMENT =====
  async getOrders(filters?: OrderFilters): Promise<JewelryOrder[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      
      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
      
      const response = await apiClient.get<{ success: boolean; data: JewelryOrder[]; pagination?: any }>(url);
      return (response as any).data || [];
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  }

  async getOrder(id: number): Promise<JewelryOrder> {
    try {
      const response = await apiClient.get<{ success: boolean; data: JewelryOrder }>(`${this.baseUrl}/${id}`);
      return (response as any).data;
    } catch (error) {
      console.error(`Failed to fetch order ${id}:`, error);
      throw error;
    }
  }

  async createOrder(orderData: CreateOrderRequest): Promise<JewelryOrder> {
    try {
      const response = await apiClient.post<{ success: boolean; data: JewelryOrder }>(this.baseUrl, orderData);
      return (response as any).data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  async updateOrder(id: number, updates: UpdateOrderRequest): Promise<JewelryOrder> {
    try {
      const response = await apiClient.put<{ success: boolean; data: JewelryOrder }>(`${this.baseUrl}/${id}`, updates);
      return (response as any).data;
    } catch (error) {
      console.error(`Failed to update order ${id}:`, error);
      throw error;
    }
  }

  async updateOrderStatus(id: number, status: string, notes?: string): Promise<JewelryOrder> {
    try {
      const response = await apiClient.put<{ success: boolean; data: JewelryOrder }>(`${this.baseUrl}/${id}/status`, { status, notes });
      return (response as any).data;
    } catch (error) {
      console.error(`Failed to update order status ${id}:`, error);
      throw error;
    }
  }

  async cancelOrder(id: number, reason: string): Promise<JewelryOrder> {
    try {
      const response = await apiClient.put<{ success: boolean; data: JewelryOrder }>(`${this.baseUrl}/${id}/cancel`, { reason });
      return (response as any).data;
    } catch (error) {
      console.error(`Failed to cancel order ${id}:`, error);
      throw error;
    }
  }

  async addCustomization(orderId: number, customization: {
    order_item_id: number;
    customization_type: string;
    details: string;
    additional_cost?: number;
  }): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/${orderId}/customization`, customization);
    } catch (error) {
      console.error(`Failed to add customization to order ${orderId}:`, error);
      throw error;
    }
  }

  async generateInvoice(orderId: number): Promise<Blob> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${this.baseUrl}/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jewelry_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }
      return response.blob();
    } catch (error) {
      console.error(`Failed to generate invoice for order ${orderId}:`, error);
      throw error;
    }
  }

  async getOrderStats(): Promise<OrderStats> {
    try {
      const response = await apiClient.get<{ success: boolean; data: OrderStats }>(`${this.baseUrl}/stats`);
      return (response as any).data;
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
      throw error;
    }
  }

  // ===== REPAIR SERVICES =====
  async getRepairs(filters?: any): Promise<RepairOrder[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      
      const queryString = params.toString();
      const url = queryString ? `${this.repairUrl}?${queryString}` : this.repairUrl;
      
      const response = await apiClient.get<{ success: boolean; data: RepairOrder[] }>(url);
      return (response as any).data || [];
    } catch (error) {
      console.error('Failed to fetch repairs:', error);
      throw error;
    }
  }

  async createRepair(repairData: CreateRepairRequest): Promise<RepairOrder> {
    try {
      const response = await apiClient.post<{ success: boolean; data: RepairOrder }>(this.repairUrl, repairData);
      return (response as any).data;
    } catch (error) {
      console.error('Failed to create repair:', error);
      throw error;
    }
  }

  async updateRepairStatus(id: number, status: string, notes?: string): Promise<RepairOrder> {
    try {
      const response = await apiClient.put<{ success: boolean; data: RepairOrder }>(`${this.repairUrl}/${id}/status`, { status, notes });
      return (response as any).data;
    } catch (error) {
      console.error(`Failed to update repair status ${id}:`, error);
      throw error;
    }
  }

  async uploadRepairPhotos(id: number, photos: File[], type: 'before' | 'after'): Promise<void> {
    try {
      const formData = new FormData();
      photos.forEach(photo => formData.append('photos', photo));
      formData.append('type', type);
      
      await apiClient.post(`${this.repairUrl}/${id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (error) {
      console.error(`Failed to upload repair photos for ${id}:`, error);
      throw error;
    }
  }

  // ===== RETURNS & EXCHANGES =====
  async getReturns(filters?: any): Promise<ReturnRequest[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      
      const queryString = params.toString();
      const url = queryString ? `${this.returnUrl}?${queryString}` : this.returnUrl;
      
      const response = await apiClient.get<{ success: boolean; data: ReturnRequest[] }>(url);
      return (response as any).data || [];
    } catch (error) {
      console.error('Failed to fetch returns:', error);
      throw error;
    }
  }

  async createReturn(returnData: CreateReturnRequest): Promise<ReturnRequest> {
    try {
      const response = await apiClient.post<{ success: boolean; data: ReturnRequest }>(this.returnUrl, returnData);
      return (response as any).data;
    } catch (error) {
      console.error('Failed to create return:', error);
      throw error;
    }
  }

  async approveReturn(id: number, approved: boolean, notes?: string): Promise<ReturnRequest> {
    try {
      const response = await apiClient.put<{ success: boolean; data: ReturnRequest }>(`${this.returnUrl}/${id}/approve`, { approved, notes });
      return (response as any).data;
    } catch (error) {
      console.error(`Failed to approve return ${id}:`, error);
      throw error;
    }
  }

  async processReturn(id: number): Promise<ReturnRequest> {
    try {
      const response = await apiClient.put<{ success: boolean; data: ReturnRequest }>(`${this.returnUrl}/${id}/process`, {});
      return (response as any).data;
    } catch (error) {
      console.error(`Failed to process return ${id}:`, error);
      throw error;
    }
  }

  // ===== NOTIFICATIONS & COMMUNICATION =====
  async sendNotification(data: {
    customer_id: number;
    message: string;
    channels: ('whatsapp' | 'sms' | 'email')[];
    template?: string;
  }): Promise<void> {
    try {
      await apiClient.post(this.notificationUrl, data);
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  async getNotificationHistory(orderId: number): Promise<any[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any[] }>(`${this.baseUrl}/${orderId}/notifications`);
      return (response as any).data || [];
    } catch (error) {
      console.error(`Failed to fetch notification history for order ${orderId}:`, error);
      throw error;
    }
  }

}

export const orderService = new OrderService();

// Export helper functions for status management
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const ORDER_TYPES = {
  SALE: 'sale',
  REPAIR: 'repair',
  CUSTOM: 'custom'
} as const;

export const REPAIR_STATUSES = {
  RECEIVED: 'received',
  ASSESSED: 'assessed',
  APPROVED: 'approved',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  READY_FOR_PICKUP: 'ready_for_pickup'
} as const;

export const RETURN_STATUSES = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROCESSED: 'processed',
  COMPLETED: 'completed'
} as const;