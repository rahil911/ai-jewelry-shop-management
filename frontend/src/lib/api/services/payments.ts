import { apiClient } from '../client';

export interface Payment {
  payment_id: string;
  order_id: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  created_at: string;
  // Additional fields for UI (may not be in Azure API response)
  transaction_id?: string;
  customer_name?: string;
  order_number?: string;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'gold_exchange' | 'emi';
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded' | 'partial';

export interface CreatePaymentRequest {
  order_id: number;
  amount: number;
  payment_method: PaymentMethod;
  notes?: string;
  due_date?: string;
}

export interface UpdatePaymentRequest {
  status?: PaymentStatus;
  transaction_id?: string;
  gateway_response?: any;
  notes?: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  payment_method?: PaymentMethod;
  customer_id?: number;
  order_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface PaymentStats {
  total_payments: number;
  total_amount: number;
  pending_payments: number;
  completed_today: number;
  payments_by_method: Record<string, number>;
  payments_by_status: Record<string, number>;
  monthly_revenue: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  customer_details: {
    name: string;
    phone: string;
    address?: string;
  };
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  payment_status: string;
  generated_date: string;
  due_date: string;
  terms_conditions: string;
}

export interface RefundRequest {
  amount: number;
  reason: string;
  refund_method?: PaymentMethod;
}

class PaymentService {
  private baseUrl = '/api/payments';

  async getPayments(filters?: PaymentFilters): Promise<Payment[]> {
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
    
    const response = await apiClient.get<{ success: boolean; data: Payment[] }>(url);
    return (response as any).data || [];
  }

  async getPayment(id: number): Promise<Payment> {
    return apiClient.get<Payment>(`${this.baseUrl}/${id}`);
  }

  async createPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
    return apiClient.post<Payment>(this.baseUrl, paymentData);
  }

  async updatePayment(id: number, updates: UpdatePaymentRequest): Promise<Payment> {
    return apiClient.put<Payment>(`${this.baseUrl}/${id}`, updates);
  }

  async deletePayment(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async processRefund(id: number, refundData: RefundRequest): Promise<Payment> {
    return apiClient.post<Payment>(`${this.baseUrl}/${id}/refund`, refundData);
  }

  async getPaymentMethods(): Promise<{ method: PaymentMethod; enabled: boolean; description: string }[]> {
    const response = await apiClient.get<{ success: boolean; data: { method: PaymentMethod; enabled: boolean; description: string }[] }>(`${this.baseUrl}/methods`);
    return (response as any).data || [];
  }

  async generateInvoice(orderId: number): Promise<Invoice> {
    return apiClient.post<Invoice>('/api/invoices/generate', { order_id: orderId });
  }

  async downloadInvoice(invoiceId: number): Promise<Blob> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/${invoiceId}/pdf`);
    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }
    return response.blob();
  }

  async getPaymentStats(): Promise<PaymentStats> {
    const response = await apiClient.get<{ success: boolean; data: PaymentStats }>('/api/analytics/payments');
    return (response as any).data;
  }


  // Gateway Integration Methods
  async initiateRazorpayPayment(paymentData: {
    amount: number;
    order_id: number;
    customer_details: {
      name: string;
      email: string;
      phone: string;
    };
  }): Promise<{
    razorpay_order_id: string;
    key: string;
    amount: number;
    currency: string;
  }> {
    return apiClient.post('/api/payments/razorpay/initiate', paymentData);
  }

  async verifyRazorpayPayment(paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ success: boolean; payment: Payment }> {
    return apiClient.post('/api/payments/razorpay/verify', paymentData);
  }
}

export const paymentService = new PaymentService();