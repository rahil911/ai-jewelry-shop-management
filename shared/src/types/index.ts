// Core domain types for Jewelry Shop Management System

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  preferredLanguage: Language;
  address?: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'owner' | 'manager' | 'staff' | 'customer';
export type Language = 'en' | 'hi' | 'kn';

export interface Customer {
  userId: string;
  loyaltyPoints: number;
  totalPurchases: number;
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  birthDate?: Date;
  anniversaryDate?: Date;
  preferredCategories: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MetalType {
  id: string;
  name: string;
  symbol: string;
  currentRate: number;
  ratePer: 'gram' | 'tola' | 'ounce';
  rateSource?: string;
  lastUpdated: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Purity {
  id: string;
  metalTypeId: string;
  purityName: string; // 22K, 18K, 14K, 925 Silver
  purityPercentage: number;
  makingChargeRate: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  nameHi?: string;
  nameKn?: string;
  description?: string;
  parentId?: string;
  makingChargePercentage: number;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JewelryItem {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  nameHi?: string;
  nameKn?: string;
  description?: string;
  categoryId: string;
  metalTypeId: string;
  purityId: string;
  grossWeight: number;
  netWeight: number;
  stoneWeight: number;
  makingCharges: number;
  wastagePercentage: number;
  stoneCharges: number;
  otherCharges: number;
  basePrice: number;
  sellingPrice: number;
  costPrice?: number;
  mrp?: number;
  stockQuantity: number;
  minStockLevel: number;
  size?: string;
  color?: string;
  occasion?: string;
  gender?: 'male' | 'female' | 'unisex';
  ageGroup?: 'kids' | 'adult' | 'senior';
  style?: string;
  images: string[];
  certifications: string[];
  tags: string[];
  isCustomizable: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  location?: string;
  supplierId?: string;
  purchaseDate?: Date;
  warrantyMonths: number;
  careInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  staffId?: string;
  orderType: 'purchase' | 'repair' | 'customization' | 'exchange';
  status: OrderStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subtotal: number;
  makingChargesTotal: number;
  stoneChargesTotal: number;
  wastageTotal: number;
  discountAmount: number;
  discountType?: 'percentage' | 'fixed' | 'loyalty';
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  advancePaid: number;
  balanceAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  deliveryType: 'pickup' | 'home_delivery' | 'courier';
  deliveryAddress?: string;
  deliveryDate?: Date;
  specialInstructions?: string;
  estimatedCompletion?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id: string;
  orderId: string;
  jewelryItemId: string;
  quantity: number;
  unitPrice: number;
  makingCharges: number;
  stoneCharges: number;
  wastageCharges: number;
  totalPrice: number;
  goldRateAtTime?: number;
  customizationDetails?: Record<string, any>;
  specialInstructions?: string;
  isGift: boolean;
  giftMessage?: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  orderId?: string;
  repairId?: string;
  paymentNumber: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transactionId?: string;
  paymentGateway?: string;
  gatewayResponse?: Record<string, any>;
  referenceNumber?: string;
  processedAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
  createdAt: Date;
}

export type PaymentMethod = 
  | 'cash'
  | 'card'
  | 'upi'
  | 'net_banking'
  | 'cheque'
  | 'gold_exchange'
  | 'emi';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export interface AIConversation {
  id: string;
  userId: string;
  sessionId: string;
  language: Language;
  modelUsed: string;
  inputType: 'text' | 'voice';
  userInput: string;
  aiResponse: string;
  contextData?: Record<string, any>;
  processingTimeMs: number;
  tokensUsed: number;
  costIncurred: number;
  createdAt: Date;
}

export interface GoldRate {
  id: string;
  metalTypeId: string;
  ratePerGram: number;
  ratePerTola?: number;
  rateSource: string;
  recordedAt: Date;
}

export interface MakingChargesConfig {
  id: string;
  categoryId?: string;
  purityId?: string;
  chargeType: 'percentage' | 'per_gram' | 'fixed';
  rateValue: number;
  minimumCharge: number;
  maximumCharge?: number;
  weightRangeMin: number;
  weightRangeMax?: number;
  locationId?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Service configuration types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface AIModelConfig {
  provider: 'openai' | 'gemini';
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

// Validation schemas and error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

// Event types for microservices communication
export interface ServiceEvent {
  type: string;
  payload: Record<string, any>;
  timestamp: Date;
  source: string;
  correlationId: string;
}

export interface InventoryUpdateEvent extends ServiceEvent {
  type: 'inventory.updated';
  payload: {
    itemId: string;
    oldQuantity: number;
    newQuantity: number;
    reason: string;
  };
}

export interface OrderStatusEvent extends ServiceEvent {
  type: 'order.status_changed';
  payload: {
    orderId: string;
    oldStatus: OrderStatus;
    newStatus: OrderStatus;
    customerId: string;
  };
}

export interface GoldRateUpdateEvent extends ServiceEvent {
  type: 'gold_rate.updated';
  payload: {
    metalType: string;
    oldRate: number;
    newRate: number;
    source: string;
  };
}