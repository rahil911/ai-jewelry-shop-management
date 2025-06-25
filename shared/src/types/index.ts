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

export enum RepairStatus {
  RECEIVED = 'received',
  ASSESSED = 'assessed',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  READY_FOR_PICKUP = 'ready_for_pickup',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum RepairType {
  CLEANING = 'cleaning',
  FIXING = 'fixing',
  RESIZING = 'resizing',
  STONE_REPLACEMENT = 'stone_replacement',
  POLISHING = 'polishing',
  CHAIN_REPAIR = 'chain_repair',
  CLASP_REPAIR = 'clasp_repair',
  ENGRAVING = 'engraving',
  OTHER = 'other'
}

export enum ReturnStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ReturnType {
  FULL_RETURN = 'full_return',
  PARTIAL_RETURN = 'partial_return',
  EXCHANGE = 'exchange'
}

export enum NotificationType {
  ORDER_CREATED = 'order_created',
  STATUS_CHANGE = 'status_change',
  PROGRESS_UPDATE = 'progress_update',
  COMPLETION = 'completion',
  REPAIR_UPDATE = 'repair_update',
  RETURN_UPDATE = 'return_update',
  CUSTOM_MESSAGE = 'custom_message'
}

export enum NotificationChannel {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  EMAIL = 'email',
  PUSH = 'push'
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

// Repair Service Types
export interface RepairRequest {
  id: number;
  order_id: number;
  item_description: string;
  problem_description: string;
  repair_type: RepairType;
  estimated_cost: number;
  estimated_completion: Date;
  actual_cost?: number;
  repair_notes?: string;
  customer_approval_required: boolean;
  customer_approved?: boolean;
  before_photos: string[];
  after_photos: string[];
  repair_status: RepairStatus;
  technician_id?: number;
  created_at: Date;
  updated_at: Date;
  order?: JewelryOrder;
  technician?: User;
}

export interface CreateRepairRequest {
  order_id: number;
  item_description: string;
  problem_description: string;
  repair_type: RepairType;
  estimated_cost: number;
  estimated_completion: Date;
  customer_approval_required?: boolean;
  technician_id?: number;
}

export interface UpdateRepairRequest {
  repair_type?: RepairType;
  estimated_cost?: number;
  estimated_completion?: Date;
  actual_cost?: number;
  repair_notes?: string;
  customer_approved?: boolean;
  technician_id?: number;
}

export interface RepairStatusHistory {
  id: number;
  repair_id: number;
  status: RepairStatus;
  notes?: string;
  photos: string[];
  changed_by: number;
  changed_at: Date;
}

// Return Service Types
export interface ReturnRequest {
  id: number;
  order_id: number;
  return_type: ReturnType;
  reason: string;
  reason_details?: string;
  requested_by: number;
  items_to_return: ReturnItem[];
  return_amount: number;
  exchange_items?: ExchangeItem[];
  exchange_amount_difference?: number;
  status: ReturnStatus;
  processed_by?: number;
  refund_method?: string;
  refund_reference?: string;
  created_at: Date;
  processed_at?: Date;
  order?: JewelryOrder;
  requester?: User;
  processor?: User;
}

export interface ReturnItem {
  order_item_id: number;
  quantity: number;
  reason?: string;
}

export interface ExchangeItem {
  jewelry_item_id: number;
  quantity: number;
  unit_price: number;
}

export interface CreateReturnRequest {
  order_id: number;
  return_type: ReturnType;
  reason: string;
  reason_details?: string;
  items_to_return: ReturnItem[];
  exchange_items?: ExchangeItem[];
}

export interface ReturnStatusHistory {
  id: number;
  return_id: number;
  status: ReturnStatus;
  notes?: string;
  changed_by: number;
  changed_at: Date;
}

// Notification Types
export interface NotificationRequest {
  customer_id: number;
  order_id?: number;
  repair_id?: number;
  return_id?: number;
  notification_type: NotificationType;
  channels: NotificationChannel[];
  template_data: NotificationTemplateData;
  scheduled_at?: Date;
}

export interface NotificationTemplateData {
  order_number?: string;
  status?: string;
  estimated_completion?: string;
  custom_message?: string;
  customer_name?: string;
  total_amount?: number;
  repair_type?: string;
  return_reason?: string;
  [key: string]: any;
}

export interface OrderNotification {
  id: number;
  order_id?: number;
  repair_id?: number;
  return_id?: number;
  customer_id: number;
  notification_type: NotificationType;
  channels: NotificationChannel[];
  template_data: NotificationTemplateData;
  sent_at?: Date;
  delivery_status: { [key in NotificationChannel]?: 'pending' | 'sent' | 'delivered' | 'failed' };
  created_at: Date;
}

export interface NotificationTemplate {
  id: number;
  notification_type: NotificationType;
  channel: NotificationChannel;
  language: string;
  subject?: string;
  template: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Enhanced Invoice Types
export interface EnhancedInvoiceData {
  business_logo?: string;
  itemized_breakdown: InvoiceItemDetail[];
  tax_breakdown: TaxDetails;
  payment_terms: string;
  warranty_information?: string;
  care_instructions?: string;
  return_policy?: string;
  digital_signature: boolean;
  qr_code?: string;
}

export interface InvoiceItemDetail {
  name: string;
  sku: string;
  description: string;
  metal_type: string;
  purity: string;
  weight: number;
  quantity: number;
  unit_price: number;
  making_charges: number;
  wastage_amount: number;
  total_price: number;
  customization_details?: string;
}

export interface TaxDetails {
  subtotal: number;
  making_charges_total: number;
  wastage_total: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_tax: number;
  grand_total: number;
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