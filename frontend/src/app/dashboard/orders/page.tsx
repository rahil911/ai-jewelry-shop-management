'use client';

import { useEffect, useState } from 'react';
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

interface OrderItem {
  id: number;
  jewelry_item_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customization_details?: string;
}

interface JewelryOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  staff_id: number;
  staff_name: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  order_type: 'sale' | 'repair' | 'custom';
  subtotal: number;
  making_charges: number;
  wastage_amount: number;
  gst_amount: number;
  total_amount: number;
  special_instructions?: string;
  estimated_completion?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

interface OrderFilters {
  search: string;
  status: string;
  order_type: string;
  date_from: string;
  date_to: string;
  staff_id: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<JewelryOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<JewelryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: '',
    order_type: '',
    date_from: '',
    date_to: '',
    staff_id: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<JewelryOrder | null>(null);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedToday: 0
  });

  useEffect(() => {
    fetchOrdersData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchOrdersData = async () => {
    try {
      // In a real implementation, this would call the orders API
      // For now, using mock data
      setTimeout(() => {
        const mockOrders: JewelryOrder[] = [
          {
            id: 1,
            order_number: 'ORD241223001',
            customer_id: 1,
            customer_name: 'Priya Sharma',
            customer_phone: '+91 9876543210',
            staff_id: 1,
            staff_name: 'Rajesh Kumar',
            status: 'confirmed',
            order_type: 'sale',
            subtotal: 280000,
            making_charges: 40000,
            wastage_amount: 5000,
            gst_amount: 9750,
            total_amount: 334750,
            special_instructions: 'Customer prefers traditional design',
            estimated_completion: '2024-01-30T10:00:00Z',
            created_at: '2024-01-23T10:30:00Z',
            updated_at: '2024-01-23T14:45:00Z',
            items: [
              {
                id: 1,
                jewelry_item_id: 1,
                item_name: '22K Gold Necklace Set',
                quantity: 1,
                unit_price: 320000,
                total_price: 320000
              }
            ]
          },
          {
            id: 2,
            order_number: 'ORD241223002',
            customer_id: 2,
            customer_name: 'Anita Patel',
            customer_phone: '+91 9876543211',
            staff_id: 1,
            staff_name: 'Rajesh Kumar',
            status: 'pending',
            order_type: 'custom',
            subtotal: 150000,
            making_charges: 25000,
            wastage_amount: 3000,
            gst_amount: 5340,
            total_amount: 183340,
            special_instructions: 'Custom design with customer provided stones',
            estimated_completion: '2024-02-15T10:00:00Z',
            created_at: '2024-01-23T11:15:00Z',
            updated_at: '2024-01-23T11:15:00Z',
            items: [
              {
                id: 2,
                jewelry_item_id: 2,
                item_name: 'Custom Gold Bracelet',
                quantity: 1,
                unit_price: 175000,
                total_price: 175000,
                customization_details: 'Customer stones to be set'
              }
            ]
          },
          {
            id: 3,
            order_number: 'ORD241223003',
            customer_id: 3,
            customer_name: 'Vikram Singh',
            customer_phone: '+91 9876543212',
            staff_id: 1,
            staff_name: 'Rajesh Kumar',
            status: 'completed',
            order_type: 'repair',
            subtotal: 5000,
            making_charges: 2000,
            wastage_amount: 0,
            gst_amount: 210,
            total_amount: 7210,
            special_instructions: 'Chain repair - broken link',
            estimated_completion: '2024-01-25T10:00:00Z',
            created_at: '2024-01-22T09:00:00Z',
            updated_at: '2024-01-25T16:30:00Z',
            items: [
              {
                id: 3,
                jewelry_item_id: 0,
                item_name: 'Chain Repair Service',
                quantity: 1,
                unit_price: 7000,
                total_price: 7000
              }
            ]
          },
          {
            id: 4,
            order_number: 'ORD241223004',
            customer_id: 4,
            customer_name: 'Meera Reddy',
            customer_phone: '+91 9876543213',
            staff_id: 2,
            staff_name: 'Sunita Devi',
            status: 'in_progress',
            order_type: 'sale',
            subtotal: 95000,
            making_charges: 15000,
            wastage_amount: 2000,
            gst_amount: 3360,
            total_amount: 115360,
            estimated_completion: '2024-01-28T10:00:00Z',
            created_at: '2024-01-23T14:20:00Z',
            updated_at: '2024-01-24T10:15:00Z',
            items: [
              {
                id: 4,
                jewelry_item_id: 2,
                item_name: '18K Gold Diamond Earrings',
                quantity: 1,
                unit_price: 110000,
                total_price: 110000
              }
            ]
          }
        ];

        setOrders(mockOrders);
        
        // Calculate stats
        const today = new Date().toDateString();
        const stats = {
          totalOrders: mockOrders.length,
          totalRevenue: mockOrders.reduce((sum, order) => sum + order.total_amount, 0),
          pendingOrders: mockOrders.filter(order => order.status === 'pending').length,
          completedToday: mockOrders.filter(order => 
            order.status === 'completed' && 
            new Date(order.updated_at).toDateString() === today
          ).length
        };
        setOrderStats(stats);
        
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch orders data:', error);
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (filters.search) {
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customer_phone.includes(filters.search)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    if (filters.order_type) {
      filtered = filtered.filter(order => order.order_type === filters.order_type);
    }

    if (filters.date_from) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) >= new Date(filters.date_from)
      );
    }

    if (filters.date_to) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) <= new Date(filters.date_to)
      );
    }

    if (filters.staff_id) {
      filtered = filtered.filter(order => order.staff_id === parseInt(filters.staff_id));
    }

    setFilteredOrders(filtered);
  };

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

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      // In a real implementation, this would call the API
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus as any, updated_at: new Date().toISOString() }
            : order
        )
      );
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="skeleton h-8 w-48"></div>
          <div className="skeleton h-10 w-32"></div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-6 w-24 mb-4"></div>
              <div className="skeleton h-8 w-32 mb-2"></div>
              <div className="skeleton h-4 w-20"></div>
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
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Order
          </button>
          <button className="btn-secondary flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Bulk Export
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
              <div className="text-2xl font-bold text-gray-900">{orderStats.totalOrders}</div>
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
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(orderStats.totalRevenue)}</div>
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
              <div className="text-2xl font-bold text-gray-900">{orderStats.pendingOrders}</div>
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
              <div className="text-2xl font-bold text-gray-900">{orderStats.completedToday}</div>
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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
              <option value="sale">Sale</option>
              <option value="repair">Repair</option>
              <option value="custom">Custom</option>
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
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
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
                        <div className="text-sm text-gray-500">{order.customer_phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderTypeColor(order.order_type)}`}>
                        {order.order_type.charAt(0).toUpperCase() + order.order_type.slice(1)}
                      </span>
                      <br />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{formatCurrency(order.total_amount)}</div>
                    <div className="text-sm text-gray-500">
                      Base: {formatCurrency(order.subtotal)}
                    </div>
                    <div className="text-sm text-gray-500">
                      GST: {formatCurrency(order.gst_amount)}
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
                      Staff: {order.staff_name}
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
                          onClick={() => console.log('Print invoice', order.id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Print Invoice"
                        >
                          <PrinterIcon className="h-5 w-5" />
                        </button>
                      </div>
                      
                      {/* Quick Status Updates */}
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-200"
                        >
                          Confirm
                        </button>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'in_progress')}
                          className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full hover:bg-purple-200"
                        >
                          Start Work
                        </button>
                      )}
                      
                      {order.status === 'in_progress' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200"
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
      <div className="text-sm text-gray-500 text-center">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>

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
                  <p className="text-sm text-gray-600">Phone: {selectedOrder.customer_phone}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                  <p className="text-sm text-gray-600">Type: {selectedOrder.order_type}</p>
                  <p className="text-sm text-gray-600">Status: {selectedOrder.status}</p>
                  <p className="text-sm text-gray-600">Staff: {selectedOrder.staff_name}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{item.item_name} (Qty: {item.quantity})</span>
                      <span className="text-sm font-medium">{formatCurrency(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total Amount:</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="btn-outline"
                >
                  Close
                </button>
                <button className="btn-primary">
                  Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}