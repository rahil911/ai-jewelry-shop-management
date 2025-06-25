# Order Management System - Design Specification

## Overview
Complete order lifecycle management system for jewelry shop operations with real-time Azure backend integration.

## API Integration
- **Base URL**: `process.env.NEXT_PUBLIC_API_URL` (Azure: http://4.236.132.147)
- **Endpoints**: 
  - `GET /api/orders` - List orders with filters
  - `POST /api/orders` - Create new order
  - `PUT /api/orders/:id` - Update order
  - `PUT /api/orders/:id/status` - Update status
  - `GET /api/orders/:id` - Get order details
  - `POST /api/orders/:id/customization` - Add customization
  - `GET /api/orders/:id/invoice` - Generate invoice

## Page Structure

### Main Order Dashboard
- **Location**: `/dashboard/orders`
- **Layout**: Full-width with tabs and filters
- **Sections**:
  1. **Order Statistics Cards**
     - Total Orders (with trend)
     - Pending Orders (urgent count)
     - Completed Orders (today/week)
     - Revenue (real-time)
  
  2. **Order Status Tabs**
     - All Orders
     - Pending (🟡)
     - In Progress (🔵)
     - Ready for Pickup (🟢)
     - Completed (✅)
     - Cancelled (❌)
  
  3. **Advanced Filters**
     - Date Range Picker
     - Customer Search
     - Order Type (Sale/Repair/Custom)
     - Price Range
     - Staff Member
     - Payment Status

### Order List Component
```typescript
interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  staff_id: string;
  staff_name: string;
  status: 'pending' | 'in_progress' | 'ready' | 'completed' | 'cancelled';
  order_type: 'sale' | 'repair' | 'custom';
  subtotal: number;
  making_charges: number;
  gst_amount: number;
  total_amount: number;
  created_at: string;
  estimated_completion?: string;
  special_instructions?: string;
  items: OrderItem[];
}
```

### Order Details Modal/Page
- **Trigger**: Click on any order row
- **Content**:
  - Customer Information
  - Order Items with Images
  - Pricing Breakdown
  - Status Timeline
  - Customization Details
  - Payment Information
  - Action Buttons

### Create/Edit Order Form
- **Customer Selection**: Searchable dropdown
- **Item Selection**: Inventory picker with real-time pricing
- **Customization Fields**: Text areas for special requests
- **Pricing Calculator**: Auto-calculation with gold rates
- **Payment Terms**: Advance amount, payment method

## UI Components

### Order Status Badge
```typescript
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};
```

### Order Actions Menu
- View Details
- Edit Order
- Update Status
- Add Customization
- Generate Invoice
- Send SMS Update
- Cancel Order

## Mobile Optimization
- **Responsive Design**: Tailwind CSS mobile-first
- **Touch-Friendly**: Larger tap targets
- **Simplified Views**: Collapsible sections
- **Swipe Actions**: Quick status updates

## Real-time Updates
- **WebSocket Integration**: Live order status updates
- **Auto-refresh**: Every 30 seconds for active orders
- **Push Notifications**: Status change alerts

## State Management
- **React Query**: Server state management
- **Zustand**: Local UI state
- **Optimistic Updates**: Immediate UI feedback

## Error Handling
- **Network Errors**: Retry mechanism
- **Validation Errors**: Form-level feedback
- **Loading States**: Skeleton components
- **Empty States**: Helpful messages

## Implementation Priority
1. **Order List View** (High)
2. **Order Details** (High)
3. **Create Order** (Medium)
4. **Status Updates** (Medium)
5. **Advanced Filters** (Low)
6. **Real-time Updates** (Low)

## Testing Requirements
- **Unit Tests**: Component rendering
- **Integration Tests**: API calls
- **E2E Tests**: Complete workflows
- **Mobile Tests**: Responsive behavior

## Security Considerations
- **Authentication**: JWT token validation
- **Authorization**: Role-based access
- **Data Validation**: Input sanitization
- **Audit Trail**: Order change tracking