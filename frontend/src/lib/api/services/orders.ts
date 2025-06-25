import { apiClient, type ApiResponse } from '../client';

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
  customer_phone: string;
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
    
    const response = await apiClient.get<{ orders: JewelryOrder[] }>(url);
    return response.orders || [];
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
    try {
      const response = await apiClient.get<OrderStats>('/api/analytics/orders');
      return response;
    } catch (error) {
      console.warn('Analytics endpoint failed, calculating from orders:', error);
      // Fallback: calculate stats from orders list
      const orders = await this.getOrders();
      return this.calculateStatsFromOrders(orders);
    }
  }

  private calculateStatsFromOrders(orders: JewelryOrder[]): OrderStats {
    const today = new Date().toDateString();
    
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ordersByType = orders.reduce((acc, order) => {
      acc[order.order_type] = (acc[order.order_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_orders: orders.length,
      total_revenue: orders.reduce((sum, order) => sum + order.total_amount, 0),
      pending_orders: orders.filter(order => order.status === 'pending').length,
      completed_today: orders.filter(order => 
        order.status === 'completed' && 
        new Date(order.updated_at).toDateString() === today
      ).length,
      orders_by_status: ordersByStatus,
      orders_by_type: ordersByType
    };
  }
}

export const orderService = new OrderService();