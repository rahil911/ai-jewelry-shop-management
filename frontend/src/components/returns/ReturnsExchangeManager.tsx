'use client';

import { useState, useEffect } from 'react';
import {
  ArrowUturnLeftIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  UserIcon,
  CalendarIcon,
  PhotoIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { 
  useReturns, 
  useCreateReturn, 
  useApproveReturn 
} from '@/lib/hooks/useOrdersEnhanced';

// Return Types based on Order Management Service v2.0
interface ReturnRequest {
  id: number;
  order_id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  item_id: number;
  item_name: string;
  item_description: string;
  return_type: 'return' | 'exchange' | 'repair_return';
  return_reason: 'defective' | 'size_issue' | 'not_as_described' | 'customer_preference' | 'quality_issue' | 'damaged_in_transit';
  return_reason_details: string;
  original_amount: number;
  refund_amount: number;
  exchange_item_id?: number;
  exchange_item_name?: string;
  exchange_amount_difference?: number;
  return_status: 'requested' | 'approved' | 'rejected' | 'item_received' | 'inspected' | 'refund_processed' | 'exchange_completed';
  requested_date: string;
  approved_date?: string;
  processed_date?: string;
  refund_method: 'cash' | 'bank_transfer' | 'original_payment' | 'store_credit';
  photos: string[];
  quality_assessment?: string;
  staff_notes: string;
  customer_notes: string;
  created_at: string;
  updated_at: string;
}

interface CreateReturnFormData {
  order_id: number;
  item_id: number;
  return_type: string;
  return_reason: string;
  return_reason_details: string;
  refund_method: string;
  customer_notes: string;
}

export default function ReturnsExchangeManager() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pending' | 'processing' | 'completed'>('dashboard');
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    return_type: '',
    return_reason: '',
    date_from: '',
    date_to: '',
  });

  // Real Azure API hooks
  const { data: returns = [], isLoading, refetch } = useReturns(filters);
  const { mutate: createReturn, isPending: isCreating } = useCreateReturn();
  const { mutate: approveReturn, isPending: isApproving } = useApproveReturn();

  const returnReasons = [
    { value: 'defective', label: 'Defective Item', icon: '⚠️' },
    { value: 'size_issue', label: 'Size Issue', icon: '📏' },
    { value: 'not_as_described', label: 'Not as Described', icon: '❌' },
    { value: 'customer_preference', label: 'Customer Preference', icon: '💭' },
    { value: 'quality_issue', label: 'Quality Issue', icon: '🔍' },
    { value: 'damaged_in_transit', label: 'Damaged in Transit', icon: '📦' },
  ];

  const returnStatuses = [
    { value: 'requested', label: 'Requested', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Approved', color: 'bg-blue-100 text-blue-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'item_received', label: 'Item Received', color: 'bg-purple-100 text-purple-800' },
    { value: 'inspected', label: 'Inspected', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'refund_processed', label: 'Refund Processed', color: 'bg-green-100 text-green-800' },
    { value: 'exchange_completed', label: 'Exchange Completed', color: 'bg-emerald-100 text-emerald-800' },
  ];

  const getStatusColor = (status: string) => {
    const statusObj = returnStatuses.find(s => s.value === status);
    return statusObj?.color || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleApproveReturn = (returnId: number, approved: boolean, notes?: string) => {
    approveReturn({ id: returnId, approved, notes });
  };

  const ReturnsDashboard = () => {
    const pendingReturns = returns.filter(r => ['requested', 'approved', 'item_received'].includes(r.return_status));
    const completedReturns = returns.filter(r => ['refund_processed', 'exchange_completed'].includes(r.return_status));
    const rejectedReturns = returns.filter(r => r.return_status === 'rejected');
    const totalRefundAmount = completedReturns.reduce((sum, r) => sum + r.refund_amount, 0);

    return (
      <div className="space-y-6">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500">Pending Returns</div>
                <div className="text-2xl font-bold text-gray-900">{pendingReturns.length}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500">Completed (This Month)</div>
                <div className="text-2xl font-bold text-gray-900">
                  {completedReturns.filter(r => 
                    new Date(r.processed_date || r.updated_at).getMonth() === new Date().getMonth()
                  ).length}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500">Rejected</div>
                <div className="text-2xl font-bold text-gray-900">{rejectedReturns.length}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyRupeeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500">Total Refunds (This Month)</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    completedReturns
                      .filter(r => new Date(r.processed_date || r.updated_at).getMonth() === new Date().getMonth())
                      .reduce((sum, r) => sum + r.refund_amount, 0)
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Returns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Approvals */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Approvals</h3>
            <div className="space-y-3">
              {pendingReturns.filter(r => r.return_status === 'requested').slice(0, 5).map((returnReq) => (
                <div key={returnReq.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <div className="font-medium text-gray-900">{returnReq.item_name}</div>
                    <div className="text-sm text-gray-500">{returnReq.customer_name}</div>
                    <div className="text-xs text-gray-400">
                      {returnReasons.find(r => r.value === returnReq.return_reason)?.label}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(returnReq.refund_amount)}
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleApproveReturn(returnReq.id, true)}
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200"
                        disabled={isApproving}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproveReturn(returnReq.id, false)}
                        className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full hover:bg-red-200"
                        disabled={isApproving}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingReturns.filter(r => r.return_status === 'requested').length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No pending approvals
                </div>
              )}
            </div>
          </div>

          {/* Return Reasons Analysis */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Return Reasons (This Month)</h3>
            <div className="space-y-3">
              {returnReasons.map((reason) => {
                const count = returns.filter(r => 
                  r.return_reason === reason.value && 
                  new Date(r.created_at).getMonth() === new Date().getMonth()
                ).length;
                const percentage = returns.length > 0 ? (count / returns.length * 100) : 0;
                
                return (
                  <div key={reason.value} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{reason.icon}</span>
                      <span className="text-sm text-gray-700">{reason.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2 ml-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Urgent Actions */}
        {pendingReturns.filter(r => 
          ['item_received', 'inspected'].includes(r.return_status) &&
          new Date(r.updated_at) < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        ).length > 0 && (
          <div className="card bg-orange-50 border-orange-200">
            <div className="flex items-center mb-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mr-2" />
              <h3 className="text-lg font-medium text-orange-800">Action Required</h3>
            </div>
            <div className="space-y-2">
              {pendingReturns
                .filter(r => 
                  ['item_received', 'inspected'].includes(r.return_status) &&
                  new Date(r.updated_at) < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
                )
                .slice(0, 3)
                .map((returnReq) => (
                  <div key={returnReq.id} className="flex justify-between items-center">
                    <span className="text-sm text-orange-700">
                      {returnReq.item_name} - {returnReq.customer_name}
                    </span>
                    <span className="text-xs text-orange-600">
                      Pending for {Math.floor((Date.now() - new Date(returnReq.updated_at).getTime()) / (24 * 60 * 60 * 1000))} days
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ReturnsTable = ({ statusFilter }: { statusFilter?: string[] }) => {
    const filteredReturns = statusFilter 
      ? returns.filter(r => statusFilter.includes(r.return_status))
      : returns;

    return (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item & Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Return Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReturns.map((returnReq) => (
                <tr key={returnReq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{returnReq.item_name}</div>
                      <div className="text-sm text-gray-500">Order: {returnReq.order_number}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {returnReq.customer_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        {returnReq.return_type === 'return' ? (
                          <ArrowUturnLeftIcon className="h-4 w-4 mr-1 text-red-500" />
                        ) : returnReq.return_type === 'exchange' ? (
                          <ArrowsRightLeftIcon className="h-4 w-4 mr-1 text-blue-500" />
                        ) : (
                          <DocumentTextIcon className="h-4 w-4 mr-1 text-yellow-500" />
                        )}
                        {returnReq.return_type.charAt(0).toUpperCase() + returnReq.return_type.slice(1)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {returnReasons.find(r => r.value === returnReq.return_reason)?.icon}{' '}
                        {returnReasons.find(r => r.value === returnReq.return_reason)?.label}
                      </div>
                      <div className="text-xs text-gray-400">{returnReq.return_reason_details}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(returnReq.return_status)}`}>
                        {returnReq.return_status.replace('_', ' ')}
                      </span>
                      <div className="text-sm text-gray-500 mt-1 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {new Date(returnReq.requested_date).toLocaleDateString()}
                      </div>
                      {returnReq.processed_date && (
                        <div className="text-xs text-green-600">
                          Processed: {new Date(returnReq.processed_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Refund: {formatCurrency(returnReq.refund_amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Original: {formatCurrency(returnReq.original_amount)}
                      </div>
                      {returnReq.exchange_amount_difference && (
                        <div className="text-xs text-blue-600">
                          Exchange diff: {formatCurrency(returnReq.exchange_amount_difference)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedReturn(returnReq)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      {returnReq.photos.length > 0 && (
                        <button
                          onClick={() => setShowPhotoModal(true)}
                          className="text-green-600 hover:text-green-900"
                          title="View Photos"
                        >
                          <PhotoIcon className="h-5 w-5" />
                        </button>
                      )}
                      {returnReq.return_status === 'requested' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleApproveReturn(returnReq.id, true)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                            disabled={isApproving}
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleApproveReturn(returnReq.id, false)}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                            disabled={isApproving}
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns & Exchange Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Handle customer returns, exchanges, and refund processing
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
          disabled={isCreating}
        >
          <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
          New Return Request
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="select"
            >
              <option value="">All Statuses</option>
              {returnStatuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Type</label>
            <select
              value={filters.return_type}
              onChange={(e) => setFilters({...filters, return_type: e.target.value})}
              className="select"
            >
              <option value="">All Types</option>
              <option value="return">Return</option>
              <option value="exchange">Exchange</option>
              <option value="repair_return">Repair Return</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <select
              value={filters.return_reason}
              onChange={(e) => setFilters({...filters, return_reason: e.target.value})}
              className="select"
            >
              <option value="">All Reasons</option>
              {returnReasons.map(reason => (
                <option key={reason.value} value={reason.value}>{reason.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({...filters, date_from: e.target.value})}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({...filters, date_to: e.target.value})}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: ClockIcon },
            { id: 'pending', name: 'Pending', icon: ExclamationTriangleIcon },
            { id: 'processing', name: 'Processing', icon: ArrowUturnLeftIcon },
            { id: 'completed', name: 'Completed', icon: CheckCircleIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading returns...</span>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && <ReturnsDashboard />}
          {activeTab === 'pending' && <ReturnsTable statusFilter={['requested', 'approved']} />}
          {activeTab === 'processing' && <ReturnsTable statusFilter={['item_received', 'inspected']} />}
          {activeTab === 'completed' && <ReturnsTable statusFilter={['refund_processed', 'exchange_completed', 'rejected']} />}
        </>
      )}

      {/* Modals would go here - Create Return, Return Details, Photo Gallery */}
    </div>
  );
}