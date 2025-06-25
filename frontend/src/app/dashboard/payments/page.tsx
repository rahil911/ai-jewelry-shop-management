'use client';

import { useState, useMemo } from 'react';
import { 
  CreditCardIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  usePayments, 
  usePaymentStats, 
  usePaymentMethods,
  useCreatePayment,
  useUpdatePayment,
  useProcessRefund,
  useDownloadInvoice,
  useGenerateInvoice
} from '@/lib/hooks/usePayments';
import type { Payment, PaymentFilters, PaymentMethod, PaymentStatus } from '@/lib/api/services/payments';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    status: undefined,
    payment_method: undefined,
    date_from: '',
    date_to: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // React Query hooks for data fetching
  const { data: payments = [], isLoading, error } = usePayments(filters);
  const { data: paymentStats } = usePaymentStats();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const createPaymentMutation = useCreatePayment();
  const updatePaymentMutation = useUpdatePayment();
  const processRefundMutation = useProcessRefund();
  const downloadInvoiceMutation = useDownloadInvoice();
  const generateInvoiceMutation = useGenerateInvoice();

  // Filter payments based on search - remove useMemo to fix render cycle violation
  const filteredPayments = (payments || []).filter(payment => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        payment.order_id?.toLowerCase().includes(searchLower) ||
        payment.payment_id?.toLowerCase().includes(searchLower)
      );
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

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'refunded': return 'text-blue-600 bg-blue-100';
      case 'partial': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case 'cash': return 'text-green-600 bg-green-100';
      case 'card': return 'text-blue-600 bg-blue-100';
      case 'upi': return 'text-purple-600 bg-purple-100';
      case 'bank_transfer': return 'text-indigo-600 bg-indigo-100';
      case 'gold_exchange': return 'text-yellow-600 bg-yellow-100';
      case 'emi': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleDownloadInvoice = (paymentId: number) => {
    downloadInvoiceMutation.mutate(paymentId);
  };

  const handleGenerateInvoice = (orderId: number) => {
    generateInvoiceMutation.mutate(orderId);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load payments</div>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

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
            Process payments, track transactions, and manage invoices
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Process Payment
          </button>
          <button className="btn-secondary flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
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
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(paymentStats?.total_amount || 0)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Total Payments</div>
              <div className="text-2xl font-bold text-gray-900">{paymentStats?.total_payments || 0}</div>
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
              <div className="text-2xl font-bold text-gray-900">{paymentStats?.pending_payments || 0}</div>
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
              <div className="text-2xl font-bold text-gray-900">{paymentStats?.completed_today || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Overview */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {(paymentMethods || []).map((method) => (
            <div key={method.method} className={`p-3 rounded-lg border ${method.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="text-sm font-medium text-gray-900 capitalize">
                {method.method.replace('_', ' ')}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {method.enabled ? 'Active' : 'Disabled'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {paymentStats?.payments_by_method?.[method.method] || 0} payments
              </div>
            </div>
          ))}
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
                className="input-field pl-10"
                placeholder="Order, customer, transaction..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={filters.status || ''}
              onChange={(e) => setFilters({...filters, status: e.target.value as PaymentStatus})}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              id="payment_method"
              value={filters.payment_method || ''}
              onChange={(e) => setFilters({...filters, payment_method: e.target.value as PaymentMethod})}
              className="input-field"
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="gold_exchange">Gold Exchange</option>
              <option value="emi">EMI</option>
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
              className="input-field"
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
              className="input-field"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({search: '', status: undefined, payment_method: undefined, date_from: '', date_to: ''})}
              className="btn-outline w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer & Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.payment_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Payment #{payment.payment_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        Order: {payment.order_id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Order #{payment.order_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.method.toUpperCase()} Payment
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(payment.method)}`}>
                        {payment.method.replace('_', ' ').toUpperCase()}
                      </span>
                      <br />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{formatCurrency(payment.amount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(payment.created_at).toLocaleDateString('en-IN')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(payment.created_at).toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDownloadInvoice(parseInt(payment.payment_id.replace('PAY-', '')))}
                        className="text-purple-600 hover:text-purple-900"
                        title="Download Invoice"
                        disabled={downloadInvoiceMutation.isPending}
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                      
                      {payment.status === 'completed' && (
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowRefundModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Process Refund"
                        >
                          <ExclamationTriangleIcon className="h-5 w-5" />
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

      {/* Payment Details Modal */}
      {selectedPayment && !showRefundModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Payment Details - #{selectedPayment.payment_id}
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
                  <h4 className="font-medium text-gray-900 mb-2">Payment Information</h4>
                  <p className="text-sm text-gray-600">Amount: {formatCurrency(selectedPayment.amount)}</p>
                  <p className="text-sm text-gray-600">Method: {selectedPayment.method}</p>
                  <p className="text-sm text-gray-600">Status: {selectedPayment.status}</p>
                  {selectedPayment.transaction_id && (
                    <p className="text-sm text-gray-600">Transaction ID: {selectedPayment.transaction_id}</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                  <p className="text-sm text-gray-600">Order: {selectedPayment.order_number || `#${selectedPayment.order_id}`}</p>
                  <p className="text-sm text-gray-600">Customer: {selectedPayment.customer_name}</p>
                  <p className="text-sm text-gray-600">Date: {new Date(selectedPayment.created_at).toLocaleString('en-IN')}</p>
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
                <button 
                  onClick={() => handleDownloadInvoice(parseInt(selectedPayment.payment_id.replace('PAY-', '')))}
                  className="btn-primary"
                  disabled={downloadInvoiceMutation.isPending}
                >
                  Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}