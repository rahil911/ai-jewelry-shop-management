// User and Authentication Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
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
  address?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    refresh_token?: string;
  };
  error?: string;
}

// Order Management Types
export interface JewelryOrder {
  id: number;
  order_number: string;
  customer_id: number;
  staff_id: number;
  status: OrderStatus;
  order_type: OrderType;
  subtotal: number;
  making_charges: number;
  wastage_amount: number;
  gst_amount: number;
  total_amount: number;
  special_instructions?: string;
  estimated_completion?: Date;
  created_at: Date;
  updated_at: Date;
  items?: OrderItem[];
  customer?: any;
  staff?: any;
}

export interface OrderItem {
  id: number;
  order_id: number;
  jewelry_item_id: number;
  quantity: number;
  unit_price: number;
  customization_details?: string;
  total_price: number;
  item?: any;
}

export interface CreateOrderRequest {
  customer_id: number;
  staff_id?: number;
  order_type?: OrderType;
  items: OrderItem[];
  special_instructions?: string;
  estimated_completion?: Date;
}

export interface UpdateOrderRequest {
  special_instructions?: string;
  estimated_completion?: Date;
}

export interface CustomizationRequest {
  order_item_id: number;
  customization_type: string;
  details: string;
  additional_cost?: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  customer_id?: number;
  staff_id?: number;
  order_type?: OrderType;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value: number;
}

// Payment Types
export interface Payment {
  id: number;
  payment_id: string;
  order_id: number;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  gateway_order_id?: string;
  gateway_transaction_id?: string;
  gateway_response?: any;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  order?: any;
  customer?: any;
}

export interface CreatePaymentRequest {
  order_id: number;
  amount: number;
  currency?: string;
  payment_method: PaymentMethod;
  created_by?: number;
}

export interface Refund {
  id: number;
  refund_id: string;
  payment_id: string;
  amount: number;
  reason: string;
  status: string;
  gateway_refund_id?: string;
  gateway_response?: any;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentStats {
  total_payments: number;
  pending_payments: number;
  successful_payments: number;
  failed_payments: number;
  total_revenue: number;
  average_payment_value: number;
  payment_methods: {
    razorpay: number;
    stripe: number;
    cash: number;
  };
}

// Invoice Types
export interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  amount: number;
  gst_amount: number;
  total_amount: number;
  invoice_date: Date;
  due_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

// Image Management Types
export interface JewelryImage {
  id: number;
  jewelry_item_id?: number;
  image_url: string;
  thumbnail_url?: string;
  medium_url?: string;
  filename: string;
  file_size: number;
  mime_type: string;
  alt_text?: string;
  category: string;
  is_primary: boolean;
  uploaded_by: number;
  created_at: Date;
  updated_at: Date;
  jewelry_item?: any;
}

export interface ImageUploadRequest {
  jewelry_item_id?: number;
  category: string;
  alt_text?: string;
  is_primary: boolean;
  uploaded_by: number;
}

// Enums
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DELIVERED = 'delivered'
}

export enum OrderType {
  SALE = 'sale',
  REPAIR = 'repair',
  CUSTOM = 'custom',
  EXCHANGE = 'exchange'
}

export enum PaymentMethod {
  CASH = 'cash',
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
  BANK_TRANSFER = 'bank_transfer'
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Helper function to create API responses
export const createApiResponse = <T>(
  success: boolean,
  data?: T | undefined,
  message?: string | undefined,
  error?: string | undefined
): ApiResponse<T> => {
  const response: ApiResponse<T> = {
    success,
    timestamp: new Date().toISOString()
  };
  
  if (data !== undefined) response.data = data;
  if (message !== undefined) response.message = message;
  if (error !== undefined) response.error = error;
  
  return response;
};