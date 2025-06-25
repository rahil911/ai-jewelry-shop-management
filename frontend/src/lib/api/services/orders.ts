import { apiClient } from '../client';

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
  order_id: string;
  customer_name: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'processing' | 'completed' | 'cancelled';
  total: number;
  // Additional fields for UI (will be undefined from Azure API)
  order_number?: string;
  customer_phone?: string;
  order_type?: string;
  items?: OrderItem[];
  total_amount?: number;
  subtotal?: number;
  gst_amount?: number;
  staff_name?: string;
  created_at?: string;
  estimated_completion?: string;
  special_instructions?: string;
}

export interface CreateOrderRequest {
  customer_id: number;
  order_type: 'sale' | 'repair' | 'custom';
  items: {
    jewelry_item_id: number;
    quantity: number;
    customization_details?: string;
  }[];
  special_instructions?: string;
  estimated_completion?: string;
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
  completed_today: number;
  orders_by_status: Record<string, number>;
  orders_by_type: Record<string, number>;
}

class OrderService {
  private baseUrl = '/api/orders';

  async getOrders(filters?: OrderFilters): Promise<JewelryOrder[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    const response = await apiClient.get<{ success: boolean; data: JewelryOrder[] }>(url);
    return (response as any).data || [];
  }

  async getOrder(id: number): Promise<JewelryOrder> {
    return apiClient.get<JewelryOrder>(`${this.baseUrl}/${id}`);
  }

  async createOrder(orderData: CreateOrderRequest): Promise<JewelryOrder> {
    return apiClient.post<JewelryOrder>(this.baseUrl, orderData);
  }

  async updateOrder(id: number, updates: UpdateOrderRequest): Promise<JewelryOrder> {
    return apiClient.put<JewelryOrder>(`${this.baseUrl}/${id}`, updates);
  }

  async updateOrderStatus(id: number, status: string): Promise<JewelryOrder> {
    return apiClient.put<JewelryOrder>(`${this.baseUrl}/${id}/status`, { status });
  }

  async deleteOrder(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async addCustomization(orderId: number, customization: {
    order_item_id: number;
    customization_type: string;
    details: string;
    additional_cost?: number;
  }): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${orderId}/customization`, customization);
  }

  async generateInvoice(orderId: number): Promise<Blob> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${this.baseUrl}/${orderId}/invoice`);
    if (!response.ok) {
      throw new Error('Failed to generate invoice');
    }
    return response.blob();
  }

  async getOrderStats(): Promise<OrderStats> {
    const response = await apiClient.get<{ success: boolean; data: OrderStats }>('/api/analytics/orders');
    return (response as any).data;
  }

}

export const orderService = new OrderService();