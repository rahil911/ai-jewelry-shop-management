import Joi from 'joi';

// User validation schemas
export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[+]?[1-9]?[0-9]{7,15}$/).optional(),
  role: Joi.string().valid('owner', 'manager', 'staff', 'customer').default('customer'),
  preferredLanguage: Joi.string().valid('en', 'hi', 'kn').default('en'),
  address: Joi.string().max(500).optional()
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const userUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^[+]?[1-9]?[0-9]{7,15}$/).optional(),
  preferredLanguage: Joi.string().valid('en', 'hi', 'kn').optional(),
  address: Joi.string().max(500).optional()
});

// Jewelry item validation schemas
export const jewelryItemSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  nameHi: Joi.string().max(200).optional(),
  nameKn: Joi.string().max(200).optional(),
  description: Joi.string().max(1000).optional(),
  categoryId: Joi.string().uuid().required(),
  metalTypeId: Joi.string().uuid().required(),
  purityId: Joi.string().uuid().required(),
  grossWeight: Joi.number().positive().precision(3).required(),
  netWeight: Joi.number().positive().precision(3).required(),
  stoneWeight: Joi.number().min(0).precision(3).default(0),
  makingCharges: Joi.number().min(0).precision(2).required(),
  wastagePercentage: Joi.number().min(0).max(100).precision(2).default(0),
  stoneCharges: Joi.number().min(0).precision(2).default(0),
  otherCharges: Joi.number().min(0).precision(2).default(0),
  costPrice: Joi.number().positive().precision(2).optional(),
  stockQuantity: Joi.number().integer().min(0).default(1),
  minStockLevel: Joi.number().integer().min(0).default(0),
  size: Joi.string().max(20).optional(),
  color: Joi.string().max(50).optional(),
  occasion: Joi.string().max(100).optional(),
  gender: Joi.string().valid('male', 'female', 'unisex').optional(),
  ageGroup: Joi.string().valid('kids', 'adult', 'senior').optional(),
  style: Joi.string().max(100).optional(),
  tags: Joi.array().items(Joi.string().max(50)).default([]),
  isCustomizable: Joi.boolean().default(false),
  isFeatured: Joi.boolean().default(false),
  location: Joi.string().max(100).optional(),
  supplierId: Joi.string().uuid().optional(),
  warrantyMonths: Joi.number().integer().min(0).default(12),
  careInstructions: Joi.string().max(1000).optional()
});

// Order validation schemas
export const orderCreateSchema = Joi.object({
  customerId: Joi.string().uuid().optional(),
  orderType: Joi.string().valid('purchase', 'repair', 'customization', 'exchange').default('purchase'),
  items: Joi.array().items(Joi.object({
    jewelryItemId: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(1).required(),
    customizationDetails: Joi.object().optional(),
    specialInstructions: Joi.string().max(500).optional(),
    isGift: Joi.boolean().default(false),
    giftMessage: Joi.string().max(200).optional()
  })).min(1).required(),
  deliveryType: Joi.string().valid('pickup', 'home_delivery', 'courier').default('pickup'),
  deliveryAddress: Joi.string().max(500).optional(),
  deliveryDate: Joi.date().greater('now').optional(),
  specialInstructions: Joi.string().max(1000).optional()
});

export const orderUpdateSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled', 'refunded').optional(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
  deliveryDate: Joi.date().optional(),
  specialInstructions: Joi.string().max(1000).optional(),
  estimatedCompletion: Joi.date().optional()
});

// Payment validation schemas
export const paymentCreateSchema = Joi.object({
  orderId: Joi.string().uuid().optional(),
  repairId: Joi.string().uuid().optional(),
  paymentMethod: Joi.string().valid('cash', 'card', 'upi', 'net_banking', 'cheque', 'gold_exchange', 'emi').required(),
  amount: Joi.number().positive().precision(2).required(),
  referenceNumber: Joi.string().max(100).optional()
}).xor('orderId', 'repairId');

// Category validation schemas
export const categorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  nameHi: Joi.string().max(100).optional(),
  nameKn: Joi.string().max(100).optional(),
  description: Joi.string().max(500).optional(),
  parentId: Joi.string().uuid().optional(),
  makingChargePercentage: Joi.number().min(0).max(100).precision(2).default(10),
  sortOrder: Joi.number().integer().min(0).default(0)
});

// Making charges configuration schema
export const makingChargesConfigSchema = Joi.object({
  categoryId: Joi.string().uuid().optional(),
  purityId: Joi.string().uuid().optional(),
  chargeType: Joi.string().valid('percentage', 'per_gram', 'fixed').required(),
  rateValue: Joi.number().positive().precision(2).required(),
  minimumCharge: Joi.number().min(0).precision(2).default(0),
  maximumCharge: Joi.number().positive().precision(2).optional(),
  weightRangeMin: Joi.number().min(0).precision(3).default(0),
  weightRangeMax: Joi.number().positive().precision(3).optional(),
  effectiveFrom: Joi.date().default('now'),
  effectiveTo: Joi.date().greater(Joi.ref('effectiveFrom')).optional()
});

// AI conversation schema
export const aiConversationSchema = Joi.object({
  sessionId: Joi.string().required(),
  language: Joi.string().valid('en', 'hi', 'kn').default('en'),
  inputType: Joi.string().valid('text', 'voice').default('text'),
  userInput: Joi.string().min(1).max(5000).required(),
  contextData: Joi.object().optional()
});

// Search and pagination schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const searchSchema = Joi.object({
  q: Joi.string().min(1).max(100).optional(),
  category: Joi.string().uuid().optional(),
  metalType: Joi.string().uuid().optional(),
  purity: Joi.string().uuid().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().positive().optional(),
  minWeight: Joi.number().min(0).optional(),
  maxWeight: Joi.number().positive().optional(),
  gender: Joi.string().valid('male', 'female', 'unisex').optional(),
  occasion: Joi.string().max(100).optional(),
  isAvailable: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional()
}).concat(paginationSchema);

// File upload schema
export const fileUploadSchema = Joi.object({
  files: Joi.array().items(
    Joi.object({
      fieldname: Joi.string().required(),
      originalname: Joi.string().required(),
      mimetype: Joi.string().valid('image/jpeg', 'image/jpg', 'image/png', 'image/webp').required(),
      size: Joi.number().max(10 * 1024 * 1024).required() // 10MB max
    })
  ).min(1).max(10).required(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  altText: Joi.string().max(255).optional()
});

// Gold rate update schema
export const goldRateUpdateSchema = Joi.object({
  metalTypeId: Joi.string().uuid().required(),
  ratePerGram: Joi.number().positive().precision(2).required(),
  ratePerTola: Joi.number().positive().precision(2).optional(),
  rateSource: Joi.string().max(100).required()
});

// Repair service schema
export const repairServiceSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  itemDescription: Joi.string().min(10).max(500).required(),
  issueDescription: Joi.string().min(10).max(1000).required(),
  estimatedCost: Joi.number().positive().precision(2).optional(),
  estimatedDays: Joi.number().integer().min(1).max(365).default(7)
});

// Notification schema
export const notificationSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  notificationType: Joi.string().max(50).required(),
  title: Joi.string().min(1).max(200).required(),
  message: Joi.string().min(1).max(1000).required(),
  channel: Joi.string().valid('email', 'sms', 'whatsapp', 'push', 'in_app').required(),
  scheduledAt: Joi.date().optional(),
  metadata: Joi.object().optional()
});

// Validation helper functions
export const validateRequest = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      code: detail.type
    }));
    throw {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      statusCode: 400,
      details: validationErrors
    };
  }

  return value;
};

export const validateId = (id: string, fieldName = 'id') => {
  const schema = Joi.string().uuid().required();
  const { error } = schema.validate(id);
  
  if (error) {
    throw {
      code: 'INVALID_ID',
      message: `Invalid ${fieldName}`,
      statusCode: 400
    };
  }
};