require('dotenv').config();

// Data loading configuration and settings
const settings = {
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://jewelry_user:jewelry_pass@localhost:5432/jewelry_shop',
    retryAttempts: 3,
    retryDelay: 1000, // milliseconds
  },

  // Azure backend configuration
  azure: {
    baseUrl: process.env.AZURE_BACKEND_URL || 'http://4.236.132.147',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 2000,
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    adminEmail: 'owner@jewelryshop.com',
    adminPassword: 'password123', // Will be hashed
  },

  // Business information
  business: {
    name: process.env.BUSINESS_NAME || 'Sri Lakshmi Jewellers',
    address: '123 MG Road, Bangalore, Karnataka 560001',
    phone: process.env.BUSINESS_PHONE || '+91-9876543210',
    email: process.env.BUSINESS_EMAIL || 'info@srilakshmijewellers.com',
    gstNumber: '29AAAAA0000A1Z5',
    panNumber: 'AAAAA0000A',
    website: 'https://srilakshmijewellers.com',
  },

  // Data generation settings
  dataGeneration: {
    users: {
      customers: 120,
      staff: 8,
      managers: 3,
    },
    
    inventory: {
      rings: 40,
      necklaces: 35,
      earrings: 45,
      bangles: 30,
      chains: 25,
      pendants: 25,
    },
    
    orders: {
      total: 85,
      completed: 60,
      pending: 15,
      cancelled: 10,
    },
    
    dateRange: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-26'),
    },
  },

  // Indian jewelry specific data
  jewelry: {
    metalTypes: [
      { name: 'Gold', symbol: 'AU', currentRate: 6800, rateSource: 'Mumbai Gold Market' },
      { name: 'Silver', symbol: 'AG', currentRate: 84, rateSource: 'Silver Exchange' },
      { name: 'Platinum', symbol: 'PT', currentRate: 3200, rateSource: 'International Market' },
    ],
    
    purities: [
      { metalSymbol: 'AU', name: '24K', percentage: 99.9, makingChargeRate: 15.0 },
      { metalSymbol: 'AU', name: '22K', percentage: 91.67, makingChargeRate: 12.0 },
      { metalSymbol: 'AU', name: '18K', percentage: 75.0, makingChargeRate: 10.0 },
      { metalSymbol: 'AU', name: '14K', percentage: 58.33, makingChargeRate: 8.0 },
      { metalSymbol: 'AG', name: '925', percentage: 92.5, makingChargeRate: 20.0 },
      { metalSymbol: 'AG', name: 'Pure', percentage: 99.9, makingChargeRate: 25.0 },
      { metalSymbol: 'PT', name: '950', percentage: 95.0, makingChargeRate: 30.0 },
    ],
    
    categories: [
      { name: 'Rings', nameHi: 'अंगूठी', nameKn: 'ಉಂಗುರ', makingChargePercentage: 12.0 },
      { name: 'Necklaces', nameHi: 'हार', nameKn: 'ಹಾರ', makingChargePercentage: 10.0 },
      { name: 'Earrings', nameHi: 'कानरी', nameKn: 'ಕಿವಿಯೋಲೆ', makingChargePercentage: 15.0 },
      { name: 'Bangles', nameHi: 'कंगन', nameKn: 'ಕಂಕಣ', makingChargePercentage: 8.0 },
      { name: 'Chains', nameHi: 'चेन', nameKn: 'ಚೈನ್', makingChargePercentage: 6.0 },
      { name: 'Pendants', nameHi: 'लकेट', nameKn: 'ಪೆಂಡೆಂಟ್', makingChargePercentage: 18.0 },
      { name: 'Nose Pins', nameHi: 'नकी', nameKn: 'ಮೂಗುತಿ', makingChargePercentage: 20.0 },
    ],
  },

  // Indian names for realistic data
  indianNames: {
    male: {
      first: ['Arjun', 'Vikram', 'Rajesh', 'Suresh', 'Ramesh', 'Anil', 'Kiran', 'Sanjay', 'Mahesh', 'Dinesh',
             'Ravi', 'Mohan', 'Krishna', 'Ganesh', 'Praveen', 'Vinod', 'Ashok', 'Deepak', 'Naresh', 'Jagdish'],
      last: ['Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Agarwal', 'Jain', 'Reddy', 'Rao', 'Nair',
             'Iyer', 'Menon', 'Joshi', 'Shah', 'Verma', 'Mishra', 'Pandey', 'Tiwari', 'Sinha', 'Chopra'],
    },
    female: {
      first: ['Priya', 'Anita', 'Sunita', 'Kavita', 'Meera', 'Ritu', 'Sita', 'Geeta', 'Nisha', 'Rekha',
             'Pooja', 'Asha', 'Usha', 'Radha', 'Shanti', 'Pushpa', 'Lata', 'Mala', 'Kiran', 'Seema'],
      last: ['Sharma', 'Patel', 'Kumari', 'Singh', 'Gupta', 'Agarwal', 'Jain', 'Reddy', 'Rao', 'Nair',
             'Iyer', 'Menon', 'Joshi', 'Shah', 'Verma', 'Mishra', 'Pandey', 'Tiwari', 'Sinha', 'Chopra'],
    },
  },

  // Sample jewelry item names
  jewelryNames: {
    rings: [
      'Traditional Gold Ring', 'Diamond Solitaire Ring', 'Wedding Band', 'Antique Ring',
      'Temple Jewelry Ring', 'Cocktail Ring', 'Engagement Ring', 'Fashion Ring',
      'Kundan Ring', 'Polki Ring', 'Ruby Ring', 'Emerald Ring', 'Pearl Ring'
    ],
    necklaces: [
      'Temple Jewelry Necklace', 'Kundan Necklace Set', 'Pearl Necklace', 'Diamond Necklace',
      'Gold Chain Necklace', 'Antique Necklace', 'Bridal Necklace Set', 'Choker Necklace',
      'Long Gold Chain', 'Traditional Haar', 'Polki Necklace', 'Ruby Necklace'
    ],
    earrings: [
      'Diamond Stud Earrings', 'Chandelier Earrings', 'Jhumka Earrings', 'Hoop Earrings',
      'Temple Earrings', 'Kundan Earrings', 'Pearl Drop Earrings', 'Antique Earrings',
      'Gold Ball Earrings', 'Ruby Earrings', 'Traditional Earrings', 'Designer Earrings'
    ],
    bangles: [
      'Gold Bangles Set', 'Diamond Bangles', 'Antique Bangles', 'Temple Bangles',
      'Kundan Bangles', 'Plain Gold Bangles', 'Designer Bangles', 'Bridal Bangles',
      'Traditional Kadas', 'Stone Studded Bangles', 'Meenakari Bangles'
    ],
    chains: [
      'Gold Chain', 'Silver Chain', 'Platinum Chain', 'Designer Chain',
      'Traditional Chain', 'Box Chain', 'Rope Chain', 'Cuban Chain',
      'Snake Chain', 'Figaro Chain', 'Wheat Chain', 'Cable Chain'
    ],
    pendants: [
      'Religious Pendant', 'Diamond Pendant', 'Gold Pendant', 'Antique Pendant',
      'Temple Pendant', 'Designer Pendant', 'Heart Pendant', 'Om Pendant',
      'Ganesha Pendant', 'Lakshmi Pendant', 'Cross Pendant', 'Star Pendant'
    ],
  },

  // Payment methods
  paymentMethods: [
    'cash', 'card', 'upi', 'net_banking', 'cheque', 'gold_exchange', 'emi'
  ],

  // Order statuses
  orderStatuses: [
    'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'ready_for_delivery', 'delivered'
  ],

  // GST rates for jewelry
  gstRates: {
    gold: 3.0,
    silver: 3.0,
    platinum: 3.0,
    diamonds: 0.25,
    making_charges: 5.0,
  },

  // File paths
  paths: {
    images: './data/images',
    templates: './data/templates',
    backups: './backups',
    logs: './logs',
  },

  // Logging configuration
  logging: {
    level: 'info',
    timestamp: true,
    colors: true,
    maxFileSize: '10MB',
    maxFiles: 5,
  },

  // Performance settings
  performance: {
    batchSize: 100,
    maxConcurrentRequests: 10,
    requestDelay: 100, // milliseconds between requests
    progressUpdateInterval: 50, // update progress every N operations
  },
};

module.exports = settings;