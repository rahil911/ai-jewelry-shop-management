'use client';

import { useEffect, useState } from 'react';
import { 
  CreditCardIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/AuthContext';

interface Payment {
  id: number;
  invoice_number: string;
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque';
  payment_status: 'pending' | 'partial' | 'completed' | 'failed' | 'refunded';
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  transaction_id?: string;
  payment_date: string;
  due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentFilters {
  search: string;
  payment_method: string;
  payment_status: string;
  date_from: string;
  date_to: string;
}

interface PaymentStats {
  totalRevenue: number;
  pendingPayments: number;
  completedToday: number;
  overduePayments: number;
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    payment_method: '',
    payment_status: '',
    date_from: '',
    date_to: ''
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalRevenue: 0,
    pendingPayments: 0,
    completedToday: 0,
    overduePayments: 0
  });

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payments, filters]);

  const fetchPaymentsData = async () => {
    try {
      // In a real implementation, this would call the payments API
      // For now, using mock data
      setTimeout(() => {
        const mockPayments: Payment[] = [
          {
            id: 1,
            invoice_number: 'INV-24-001',
            order_id: 1,
            order_number: 'ORD241223001',
            customer_name: 'Priya Sharma',
            customer_phone: '+91 9876543210',
            payment_method: 'upi',
            payment_status: 'completed',
            total_amount: 334750,
            paid_amount: 334750,
            pending_amount: 0,
            transaction_id: 'TXN123456789',
            payment_date: '2024-01-23T14:30:00Z',
            created_at: '2024-01-23T10:30:00Z',
            updated_at: '2024-01-23T14:30:00Z'
          },
          {
            id: 2,
            invoice_number: 'INV-24-002',
            order_id: 2,
            order_number: 'ORD241223002',
            customer_name: 'Anita Patel',
            customer_phone: '+91 9876543211',
            payment_method: 'card',
            payment_status: 'partial',
            total_amount: 183340,
            paid_amount: 100000,
            pending_amount: 83340,
            transaction_id: 'TXN123456790',
            payment_date: '2024-01-23T15:00:00Z',
            due_date: '2024-02-15T10:00:00Z',
            notes: 'Partial payment received, balance due on delivery',
            created_at: '2024-01-23T11:15:00Z',
            updated_at: '2024-01-23T15:00:00Z'
          },
          {
            id: 3,
            invoice_number: 'INV-24-003',
            order_id: 3,
            order_number: 'ORD241223003',
            customer_name: 'Vikram Singh',
            customer_phone: '+91 9876543212',
            payment_method: 'cash',
            payment_status: 'completed',
            total_amount: 7210,
            paid_amount: 7210,
            pending_amount: 0,
            payment_date: '2024-01-25T16:30:00Z',
            created_at: '2024-01-22T09:00:00Z',
            updated_at: '2024-01-25T16:30:00Z'
          },
          {
            id: 4,
            invoice_number: 'INV-24-004',
            order_id: 4,
            order_number: 'ORD241223004',
            customer_name: 'Meera Reddy',
            customer_phone: '+91 9876543213',
            payment_method: 'bank_transfer',
            payment_status: 'pending',
            total_amount: 115360,
            paid_amount: 0,
            pending_amount: 115360,
            payment_date: '2024-01-24T10:15:00Z',
            due_date: '2024-01-30T10:00:00Z',
            notes: 'Awaiting bank transfer confirmation',
            created_at: '2024-01-23T14:20:00Z',
            updated_at: '2024-01-24T10:15:00Z'
          },
          {
            id: 5,
            invoice_number: 'INV-24-005',
            order_id: 5,
            order_number: 'ORD241223005',
            customer_name: 'Rahul Gupta',
            customer_phone: '+91 9876543214',
            payment_method: 'cheque',
            payment_status: 'failed',
            total_amount: 95000,
            paid_amount: 0,
            pending_amount: 95000,
            payment_date: '2024-01-22T11:45:00Z',
            due_date: '2024-01-20T10:00:00Z',
            notes: 'Cheque bounced - insufficient funds',
            created_at: '2024-01-18T09:30:00Z',
            updated_at: '2024-01-22T11:45:00Z'
          }
        ];

        setPayments(mockPayments);
        
        // Calculate stats
        const today = new Date().toDateString();
        const stats: PaymentStats = {
          totalRevenue: mockPayments
            .filter(p => p.payment_status === 'completed')
            .reduce((sum, payment) => sum + payment.paid_amount, 0),
          pendingPayments: mockPayments
            .filter(p => p.payment_status === 'pending' || p.payment_status === 'partial')
            .reduce((sum, payment) => sum + payment.pending_amount, 0),
          completedToday: mockPayments
            .filter(p => p.payment_status === 'completed' && 
              new Date(p.payment_date).toDateString() === today).length,
          overduePayments: mockPayments
            .filter(p => p.due_date && new Date(p.due_date) < new Date() && 
              (p.payment_status === 'pending' || p.payment_status === 'partial')).length
        };
        setPaymentStats(stats);
        
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch payments data:', error);
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    if (filters.search) {
      filtered = filtered.filter(payment => 
        payment.invoice_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        payment.order_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        payment.customer_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        payment.customer_phone.includes(filters.search)
      );
    }

    if (filters.payment_method) {
      filtered = filtered.filter(payment => payment.payment_method === filters.payment_method);
    }

    if (filters.payment_status) {
      filtered = filtered.filter(payment => payment.payment_status === filters.payment_status);
    }

    if (filters.date_from) {
      filtered = filtered.filter(payment => 
        new Date(payment.created_at) >= new Date(filters.date_from)
      );
    }

    if (filters.date_to) {
      filtered = filtered.filter(payment => 
        new Date(payment.created_at) <= new Date(filters.date_to)
      );
    }

    setFilteredPayments(filtered);
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
      case 'partial': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'refunded': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <BanknotesIcon className="h-5 w-5" />;
      case 'card': return <CreditCardIcon className="h-5 w-5" />;
      case 'upi': return <CreditCardIcon className="h-5 w-5" />;
      case 'bank_transfer': return <BanknotesIcon className="h-5 w-5" />;
      case 'cheque': return <DocumentTextIcon className="h-5 w-5" />;
      default: return <CreditCardIcon className="h-5 w-5" />;
    }
  };

  const isOverdue = (payment: Payment) => {
    return payment.due_date && 
           new Date(payment.due_date) < new Date() && 
           (payment.payment_status === 'pending' || payment.payment_status === 'partial');
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
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track payments, manage invoices, and handle billing
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="btn-primary flex items-center"
          >
            <CreditCardIcon className="h-5 w-5 mr-2" />
            Record Payment
          </button>
          <button className="btn-secondary flex items-center">
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Total Revenue</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(paymentStats.totalRevenue)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Pending Payments</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(paymentStats.pendingPayments)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Completed Today</div>
              <div className="text-2xl font-bold text-gray-900">{paymentStats.completedToday}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Overdue Payments</div>
              <div className="text-2xl font-bold text-gray-900">{paymentStats.overduePayments}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                placeholder="Invoice, order, customer..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              id="payment_method"
              value={filters.payment_method}
              onChange={(e) => setFilters({...filters, payment_method: e.target.value})}
              className="select"
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label htmlFor="payment_status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="payment_status"
              value={filters.payment_status}
              onChange={(e) => setFilters({...filters, payment_status: e.target.value})}
              className="select"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
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
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({search: '', payment_method: '', payment_status: '', date_from: '', date_to: ''})}
            className="btn-outline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className={`hover:bg-gray-50 ${isOverdue(payment) ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.invoice_number}</div>
                      <div className="text-sm text-gray-500">Order: {payment.order_number}</div>
                      {isOverdue(payment) && (
                        <div className="text-xs text-red-600 font-medium">OVERDUE</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.customer_name}</div>
                      <div className="text-sm text-gray-500">{payment.customer_phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Total: {formatCurrency(payment.total_amount)}
                      </div>
                      <div className="text-sm text-green-600">
                        Paid: {formatCurrency(payment.paid_amount)}
                      </div>
                      {payment.pending_amount > 0 && (
                        <div className="text-sm text-red-600">
                          Pending: {formatCurrency(payment.pending_amount)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getMethodIcon(payment.payment_method)}
                      <div className="ml-2">
                        <div className="text-sm text-gray-900 capitalize">
                          {payment.payment_method.replace('_', ' ')}
                        </div>
                        {payment.transaction_id && (
                          <div className="text-xs text-gray-500">
                            TXN: {payment.transaction_id}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.payment_status)}`}>
                        {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                      </span>
                      {payment.due_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          Due: {new Date(payment.due_date).toLocaleDateString('en-IN')}
                        </div>
                      )}
                      {payment.payment_date && (
                        <div className="text-xs text-gray-500">
                          Paid: {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <DocumentTextIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => console.log('Print invoice', payment.id)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Print Invoice"
                      >
                        <PrinterIcon className="h-5 w-5" />
                      </button>
                      {payment.payment_status === 'pending' && (
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="text-green-600 hover:text-green-900"
                          title="Record Payment"
                        >
                          <CreditCardIcon className="h-5 w-5" />
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
        Showing {filteredPayments.length} of {payments.length} payments
      </div>

      {/* Payment Details Modal Placeholder */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Payment Details - {selectedPayment.invoice_number}
                </h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                  <p className="text-sm text-gray-600">Name: {selectedPayment.customer_name}</p>
                  <p className="text-sm text-gray-600">Phone: {selectedPayment.customer_phone}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Payment Information</h4>
                  <p className="text-sm text-gray-600">Method: {selectedPayment.payment_method}</p>
                  <p className="text-sm text-gray-600">Status: {selectedPayment.payment_status}</p>
                  {selectedPayment.transaction_id && (
                    <p className="text-sm text-gray-600">Transaction ID: {selectedPayment.transaction_id}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Amount Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedPayment.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Paid Amount:</span>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(selectedPayment.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pending Amount:</span>
                    <span className="text-sm font-medium text-red-600">{formatCurrency(selectedPayment.pending_amount)}</span>
                  </div>
                </div>
              </div>
              
              {selectedPayment.notes && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedPayment.notes}</p>
                </div>
              )}
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="btn-outline"
                >
                  Close
                </button>
                <button className="btn-secondary">
                  Print Invoice
                </button>
                {selectedPayment.payment_status === 'pending' && (
                  <button className="btn-primary">
                    Record Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}