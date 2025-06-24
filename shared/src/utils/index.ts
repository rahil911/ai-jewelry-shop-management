import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// JWT utilities
export const generateToken = (payload: Record<string, any>, expiresIn = '24h'): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string): Record<string, any> => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwt.verify(token, secret) as Record<string, any>;
};

// UUID utilities
export const generateId = (): string => uuidv4();

// Date utilities
export const formatDate = (date: Date, locale = 'en-IN'): string => {
  return new Intl.DateTimeFormat(locale).format(date);
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Number utilities for jewelry calculations
export const calculateMakingCharges = (
  netWeight: number,
  chargeType: 'percentage' | 'per_gram' | 'fixed',
  rateValue: number,
  goldRate?: number
): number => {
  switch (chargeType) {
    case 'percentage':
      if (!goldRate) throw new Error('Gold rate required for percentage calculation');
      return (netWeight * goldRate * rateValue) / 100;
    case 'per_gram':
      return netWeight * rateValue;
    case 'fixed':
      return rateValue;
    default:
      throw new Error('Invalid charge type');
  }
};

export const calculateWastage = (netWeight: number, wastagePercentage: number): number => {
  return (netWeight * wastagePercentage) / 100;
};

export const calculateGSTAmount = (amount: number, gstRate: number): number => {
  return (amount * gstRate) / 100;
};

export const calculateSellingPrice = (
  netWeight: number,
  goldRate: number,
  makingCharges: number,
  stoneCharges = 0,
  otherCharges = 0
): number => {
  return (netWeight * goldRate) + makingCharges + stoneCharges + otherCharges;
};

// String utilities
export const generateSKU = (category: string, metalType: string, sequence: number): string => {
  const categoryCode = category.substring(0, 2).toUpperCase();
  const metalCode = metalType.substring(0, 2).toUpperCase();
  const sequenceStr = sequence.toString().padStart(4, '0');
  return `${categoryCode}${metalCode}${sequenceStr}`;
};

export const generateOrderNumber = (date = new Date()): string => {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD${dateStr}${randomStr}`;
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[1-9]?[0-9]{7,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const isValidGST = (gst: string): boolean => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst);
};

export const isValidPAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

// Error handling utilities
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export const createError = (
  message: string,
  code: string,
  statusCode = 500,
  details?: any
): ServiceError => {
  return new ServiceError(message, code, statusCode, details);
};

// Language utilities
export const getLanguageCode = (language: string): 'en' | 'hi' | 'kn' => {
  const supportedLanguages = ['en', 'hi', 'kn'];
  return supportedLanguages.includes(language) ? language as 'en' | 'hi' | 'kn' : 'en';
};

export const translateField = (
  item: Record<string, any>,
  fieldName: string,
  language: 'en' | 'hi' | 'kn'
): string => {
  if (language === 'en') {
    return item[fieldName] || '';
  }
  const translatedField = `${fieldName}${language.charAt(0).toUpperCase() + language.slice(1)}`;
  return item[translatedField] || item[fieldName] || '';
};

// Cache utilities
export const generateCacheKey = (...parts: (string | number)[]): string => {
  return parts.filter(Boolean).join(':');
};

export const parseCacheKey = (key: string): string[] => {
  return key.split(':');
};

// Logging utilities
export const sanitizeForLogs = (data: Record<string, any>): Record<string, any> => {
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

// API utilities - exported from types/index.ts

export const createPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
) => {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

// File utilities
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isValidImageFile = (filename: string): boolean => {
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  return validExtensions.includes(getFileExtension(filename));
};

export const generateFileName = (originalName: string, prefix = ''): string => {
  const extension = getFileExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}_${random}.${extension}`;
};

// Conversion utilities
export const gramsToTola = (grams: number): number => {
  return grams / 11.6638; // 1 tola = 11.6638 grams
};

export const tolaToGrams = (tola: number): number => {
  return tola * 11.6638;
};

export const formatCurrency = (amount: number, currency = 'INR', locale = 'en-IN'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatWeight = (weight: number, unit = 'grams'): string => {
  return `${weight.toFixed(3)} ${unit}`;
};

// Retry utility for external API calls
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('Max retry attempts exceeded');
};