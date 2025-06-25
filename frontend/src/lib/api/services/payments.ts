import { apiClient } from '../client';

export interface Payment {
  id: number;
  order_id: number;
  customer_id: number;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  gateway_response?: any;
  payment_date: string;
  due_date?: string;
  notes?: string;
  created_by: number;
  invoice_generated: boolean;
  order_number?: string;
  customer_name?: string;
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
    
    const response = await apiClient.get<{ payments: Payment[] }>(url);
    return response.payments || [];
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
    try {
      return await apiClient.get<{ method: PaymentMethod; enabled: boolean; description: string }[]>(`${this.baseUrl}/methods`);
    } catch (error) {
      // Fallback to default payment methods
      return [
        { method: 'cash', enabled: true, description: 'Cash Payment' },
        { method: 'card', enabled: true, description: 'Credit/Debit Card' },
        { method: 'upi', enabled: true, description: 'UPI Payment' },
        { method: 'bank_transfer', enabled: true, description: 'Bank Transfer' },
        { method: 'gold_exchange', enabled: true, description: 'Gold Exchange' },
        { method: 'emi', enabled: false, description: 'EMI (Coming Soon)' }
      ];
    }
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
    try {
      const response = await apiClient.get<PaymentStats>('/api/analytics/payments');
      return response;
    } catch (error) {
      console.warn('Analytics endpoint failed, calculating from payments:', error);
      // Fallback: calculate stats from payments list
      const payments = await this.getPayments();
      return this.calculateStatsFromPayments(payments);
    }
  }

  private calculateStatsFromPayments(payments: Payment[]): PaymentStats {
    const today = new Date().toDateString();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const paymentsByMethod = payments.reduce((acc, payment) => {
      acc[payment.payment_method] = (acc[payment.payment_method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const paymentsByStatus = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const monthlyRevenue = payments
      .filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return payment.status === 'completed' &&
               paymentDate.getMonth() === currentMonth &&
               paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      total_payments: payments.length,
      total_amount: payments.reduce((sum, payment) => 
        payment.status === 'completed' ? sum + payment.amount : sum, 0
      ),
      pending_payments: payments.filter(payment => payment.status === 'pending').length,
      completed_today: payments.filter(payment => 
        payment.status === 'completed' && 
        new Date(payment.payment_date).toDateString() === today
      ).length,
      payments_by_method: paymentsByMethod,
      payments_by_status: paymentsByStatus,
      monthly_revenue: monthlyRevenue
    };
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