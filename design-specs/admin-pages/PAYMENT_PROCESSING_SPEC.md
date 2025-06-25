# Payment Processing System - Design Specification

## Overview
Comprehensive payment management system for jewelry transactions with Azure backend integration and multiple payment gateway support.

## API Integration
- **Base URL**: `process.env.NEXT_PUBLIC_API_URL` (Azure: http://4.236.132.147)
- **Endpoints**:
  - `GET /api/payments` - List payments with filters
  - `POST /api/payments` - Process new payment
  - `PUT /api/payments/:id` - Update payment
  - `GET /api/payments/:id` - Get payment details
  - `POST /api/payments/:id/refund` - Process refund
  - `GET /api/payments/methods` - Available payment methods
  - `POST /api/invoices/generate` - Generate invoice
  - `GET /api/invoices/:id/pdf` - Download invoice PDF

## Page Structure

### Payment Dashboard
- **Location**: `/dashboard/payments`
- **Layout**: Full-width with cards and tables
- **Sections**:
  1. **Payment Statistics**
     - Today's Collections
     - Pending Payments
     - Refunds Processed
     - Payment Methods Breakdown
  
  2. **Payment Status Filters**
     - All Payments
     - Completed (✅)
     - Pending (⏳)
     - Failed (❌)
     - Refunded (↩️)
  
  3. **Quick Actions**
     - Process Payment
     - Generate Invoice
     - Bulk Payment Updates
     - Export Reports

### Payment Processing Form
- **Order Selection**: Link to existing orders
- **Payment Method**: Cash, Card, UPI, Bank Transfer, Gold Exchange
- **Amount Fields**: 
  - Subtotal (auto-calculated)
  - Making Charges
  - GST Amount
  - Total Amount
  - Advance Paid
  - Balance Due
- **Payment Gateway Integration**: Razorpay/Stripe widgets

### Invoice Generation
- **GST Compliance**: Automatic tax calculations
- **Company Details**: Letterhead with shop info
- **Item Breakdown**: Detailed pricing with gold rates
- **Payment Terms**: Due dates and conditions
- **Digital Signature**: Authentication stamps

## Data Models

### Payment Interface
```typescript
interface Payment {
  id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  gateway_response?: any;
  payment_date: string;
  due_date?: string;
  notes?: string;
  created_by: string;
  invoice_generated: boolean;
}

type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'gold_exchange' | 'emi';
type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded' | 'partial';
```

### Invoice Interface
```typescript
interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_details: CustomerInfo;
  items: InvoiceItem[];
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  payment_status: string;
  generated_date: string;
  due_date: string;
  terms_conditions: string;
}
```

## Payment Gateway Integration

### Razorpay Configuration
```typescript
const razorpayOptions = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: amount * 100, // Convert to paise
  currency: 'INR',
  order_id: razorpayOrderId,
  handler: handlePaymentSuccess,
  prefill: {
    name: customerName,
    email: customerEmail,
    contact: customerPhone
  },
  theme: {
    color: '#D4AF37' // Gold theme
  }
};
```

### UPI Integration
- **QR Code Generation**: Dynamic QR for payments
- **UPI ID Support**: Direct UPI ID payments
- **Auto-verification**: Payment status checking

## UI Components

### Payment Method Selector
- **Visual Cards**: Icons for each method
- **Available Methods**: Based on configuration
- **Default Selection**: Most used method

### Payment Status Badge
```typescript
const paymentStatusColors = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-blue-100 text-blue-800',
  partial: 'bg-orange-100 text-orange-800'
};
```

### GST Calculator Component
- **Automatic Calculation**: Based on item categories
- **Rate Configuration**: 3% for gold, 5% for silver
- **Breakdown Display**: Clear tax separation

## Mobile Optimization
- **Payment Gateway**: Mobile-optimized checkout
- **Receipt Display**: Formatted for mobile screens
- **Quick Actions**: Swipe gestures for common tasks
- **Offline Mode**: Store failed payments for retry

## Security Features
- **PCI Compliance**: Secure payment processing
- **Data Encryption**: Sensitive information protection
- **Audit Logging**: All payment activities tracked
- **Fraud Detection**: Unusual pattern alerts

## Real-time Features
- **Payment Status**: Live updates from gateways
- **Balance Tracking**: Real-time due amount calculation
- **Notification System**: SMS/Email for successful payments

## Error Handling
- **Gateway Failures**: Graceful error handling
- **Network Issues**: Retry mechanisms
- **Validation Errors**: Clear user feedback
- **Failed Payments**: Recovery workflows

## Reporting Features
- **Daily Collections**: Payment summary reports
- **Payment Methods**: Usage analytics
- **GST Reports**: Tax compliance exports
- **Customer Payments**: Individual payment history

## Implementation Priority
1. **Basic Payment Processing** (High)
2. **Invoice Generation** (High)
3. **Payment Gateway Integration** (Medium)
4. **GST Compliance** (Medium)
5. **Advanced Reporting** (Low)
6. **Bulk Operations** (Low)

## Integration Requirements
- **Order Management**: Seamless order-payment linking
- **Customer Management**: Payment history tracking
- **Inventory**: Stock updates on payment
- **Accounting**: Financial record synchronization