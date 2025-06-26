'use client';

import { useState } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PrinterIcon,
  CreditCardIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  useOrders, 
  useOrderStats, 
  useOrderActions
} from '@/lib/hooks/useOrdersEnhanced';
import OrderCreationWizard from '@/components/orders/OrderCreationWizard';
import InvoiceGenerator from '@/components/invoices/InvoiceGenerator';
import { 
  OrderFilters,
  ORDER_STATUSES,
  ORDER_TYPES 
} from '@/lib/api/services/orders';

// Interfaces are now imported from the API service

export default function OrdersPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: '',
    order_type: '',
    date_from: '',
    date_to: '',
    staff_id: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [orderForInvoice, setOrderForInvoice] = useState<any>(null);
  
  // Real Azure API data
  const { data: orders = [], isLoading, error, refetch } = useOrders(filters);
  const { data: orderStats, isLoading: statsLoading } = useOrderStats();
  const { updateStatus, generateInvoice, isLoading: actionLoading } = useOrderActions();

  // Handle loading and error states
  if (error) {
    console.error('Orders API Error:', error);
  }
  
  // Filter orders client-side for better UX (server-side filtering is also available)
  const filteredOrders = orders.filter(order => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!(
        order.order_number?.toLowerCase().includes(searchLower) ||
        order.customer_name?.toLowerCase().includes(searchLower) ||
        order.customer_phone?.includes(filters.search)
      )) {
        return false;
      }
    }
    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOrderTypeColor = (type: string) => {
    switch (type) {
      case 'sale': return 'text-green-600 bg-green-100';
      case 'repair': return 'text-yellow-600 bg-yellow-100';
      case 'custom': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleStatusUpdate = (orderId: number, newStatus: string) => {
    updateStatus({ id: orderId, status: newStatus });
  };
  
  const handleInvoiceDownload = (orderId: number) => {
    generateInvoice(orderId);
  };

  const handleShowInvoice = (order: any) => {
    setOrderForInvoice(order);
    setShowInvoiceModal(true);
  };
  
  const handleRefresh = () => {
    refetch();
  };

  const handleOrderCreated = (newOrder: any) => {
    // Order creation success is handled by the useCreateOrder hook
    // which will automatically update the orders list and stats
    setShowCreateModal(false);
    handleRefresh(); // Extra refresh to ensure UI is updated
  };

  if (isLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="skeleton h-8 w-48"></div>
          <div className="skeleton h-10 w-32"></div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage orders, track progress, and generate invoices
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
            disabled={actionLoading}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Order
          </button>
          <button 
            onClick={handleRefresh}
            className="btn-secondary flex items-center"
            disabled={isLoading}
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Total Orders</div>
              <div className="text-2xl font-bold text-gray-900">{orderStats?.total_orders || 0}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Total Revenue</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(orderStats?.total_revenue || 0)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Pending Orders</div>
              <div className="text-2xl font-bold text-gray-900">{orderStats?.pending_orders || 0}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Completed Today</div>
              <div className="text-2xl font-bold text-gray-900">{orderStats?.completed_today || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="input pl-10"
                placeholder="Order number, customer..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="select"
            >
              <option value="">All Status</option>
              <option value={ORDER_STATUSES.PENDING}>Pending</option>
              <option value={ORDER_STATUSES.CONFIRMED}>Confirmed</option>
              <option value={ORDER_STATUSES.IN_PROGRESS}>In Progress</option>
              <option value={ORDER_STATUSES.COMPLETED}>Completed</option>
              <option value={ORDER_STATUSES.CANCELLED}>Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="order_type" className="block text-sm font-medium text-gray-700 mb-2">
              Order Type
            </label>
            <select
              id="order_type"
              value={filters.order_type}
              onChange={(e) => setFilters({...filters, order_type: e.target.value})}
              className="select"
            >
              <option value="">All Types</option>
              <option value={ORDER_TYPES.SALE}>Sale</option>
              <option value={ORDER_TYPES.REPAIR}>Repair</option>
              <option value={ORDER_TYPES.CUSTOM}>Custom</option>
            </select>
          </div>

          <div>
            <label htmlFor="date_from" className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              id="date_from"
              value={filters.date_from}
              onChange={(e) => setFilters({...filters, date_from: e.target.value})}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="date_to" className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              id="date_to"
              value={filters.date_to}
              onChange={(e) => setFilters({...filters, date_to: e.target.value})}
              className="input"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({search: '', status: '', order_type: '', date_from: '', date_to: '', staff_id: ''})}
              className="btn-outline w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                      <div className="text-sm text-gray-500">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </div>
                      {order.special_instructions && (
                        <div className="text-xs text-gray-400 mt-1">
                          {order.special_instructions.length > 30 
                            ? `${order.special_instructions.substring(0, 30)}...` 
                            : order.special_instructions}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-sm text-gray-500">{order.customer_phone || 'No phone'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderTypeColor(order.order_type)}`}>
                        {order.order_type?.charAt(0).toUpperCase() + order.order_type?.slice(1)}
                      </span>
                      <br />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status?.replace('_', ' ').charAt(0).toUpperCase() + order.status?.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{formatCurrency(order.total_amount || 0)}</div>
                    <div className="text-sm text-gray-500">
                      Base: {formatCurrency(order.subtotal || 0)}
                    </div>
                    <div className="text-sm text-gray-500">
                      GST: {formatCurrency(order.gst_amount || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Created: {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </div>
                    {order.estimated_completion && (
                      <div className="text-sm text-gray-500">
                        Est. Completion: {new Date(order.estimated_completion).toLocaleDateString('en-IN')}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      Staff: {order.staff_name || 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit Order"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleShowInvoice(order)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Generate Invoice"
                          disabled={actionLoading}
                        >
                          <PrinterIcon className="h-5 w-5" />
                        </button>
                      </div>
                      
                      {/* Quick Status Updates */}
                      {order.status === ORDER_STATUSES.PENDING && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, ORDER_STATUSES.CONFIRMED)}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-200"
                          disabled={actionLoading}
                        >
                          Confirm
                        </button>
                      )}
                      
                      {order.status === ORDER_STATUSES.CONFIRMED && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, ORDER_STATUSES.IN_PROGRESS)}
                          className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full hover:bg-purple-200"
                          disabled={actionLoading}
                        >
                          Start Work
                        </button>
                      )}
                      
                      {order.status === ORDER_STATUSES.IN_PROGRESS && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, ORDER_STATUSES.COMPLETED)}
                          className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200"
                          disabled={actionLoading}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div>
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
        {error && (
          <div className="text-red-600 flex items-center">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Failed to load from Azure API - showing cached data
          </div>
        )}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="text-blue-600 hover:text-blue-800"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Order Creation Wizard */}
      <OrderCreationWizard
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleOrderCreated}
      />

      {/* Invoice Generator */}
      {orderForInvoice && (
        <InvoiceGenerator
          order={orderForInvoice}
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setOrderForInvoice(null);
          }}
        />
      )}

      {/* Order Details Modal Placeholder */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Order Details - {selectedOrder.order_number}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                  <p className="text-sm text-gray-600">Name: {selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-600">Phone: {selectedOrder.customer_phone || 'No phone'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                  <p className="text-sm text-gray-600">Type: {selectedOrder.order_type}</p>
                  <p className="text-sm text-gray-600">Status: {selectedOrder.status}</p>
                  <p className="text-sm text-gray-600">Staff: {selectedOrder.staff_name || 'Unassigned'}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{item.item_name} (Qty: {item.quantity})</span>
                      <span className="text-sm font-medium">{formatCurrency(item.total_price || 0)}</span>
                    </div>
                  )) || <div className="text-sm text-gray-500">No items found</div>}
                </div>
              </div>
              
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total Amount:</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(selectedOrder.total_amount || 0)}</span>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="btn-outline"
                >
                  Close
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => handleInvoiceDownload(selectedOrder.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Generating...' : 'Download Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}