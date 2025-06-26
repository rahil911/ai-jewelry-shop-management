'use client';

import { useState, useEffect } from 'react';
import {
  WrenchScrewdriverIcon,
  PhotoIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyRupeeIcon,
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { 
  useRepairs, 
  useCreateRepair, 
  useUpdateRepairStatus 
} from '@/lib/hooks/useOrdersEnhanced';

// Repair Types based on Order Management Service v2.0
interface RepairRequest {
  id: number;
  order_id?: number;
  item_description: string;
  problem_description: string;
  repair_type: 'cleaning' | 'fixing' | 'resizing' | 'stone_replacement' | 'chain_repair' | 'clasp_repair' | 'polishing' | 'plating';
  estimated_cost: number;
  estimated_completion: string;
  actual_cost?: number;
  repair_notes: string;
  customer_approval_required: boolean;
  customer_approved?: boolean;
  before_photos: string[];
  after_photos: string[];
  repair_status: 'received' | 'assessed' | 'approved' | 'in_progress' | 'completed' | 'ready_for_pickup' | 'delivered';
  technician_id?: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  updated_at: string;
}

interface CreateRepairFormData {
  customer_id: number;
  item_description: string;
  problem_description: string;
  repair_type: string;
  estimated_cost: number;
  estimated_completion: string;
  customer_approval_required: boolean;
}

export default function RepairWorkflowManager() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'history'>('dashboard');
  const [selectedRepair, setSelectedRepair] = useState<RepairRequest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    repair_type: '',
    date_from: '',
    date_to: '',
    technician_id: ''
  });

  // Real Azure API hooks
  const { data: repairs = [], isLoading, refetch } = useRepairs(filters);
  const { mutate: createRepair, isPending: isCreating } = useCreateRepair();
  const { mutate: updateRepairStatus, isPending: isUpdating } = useUpdateRepairStatus();

  const repairTypes = [
    { value: 'cleaning', label: 'Cleaning', icon: '🧽' },
    { value: 'fixing', label: 'General Fixing', icon: '🔧' },
    { value: 'resizing', label: 'Resizing', icon: '📏' },
    { value: 'stone_replacement', label: 'Stone Replacement', icon: '💎' },
    { value: 'chain_repair', label: 'Chain Repair', icon: '🔗' },
    { value: 'clasp_repair', label: 'Clasp Repair', icon: '📎' },
    { value: 'polishing', label: 'Polishing', icon: '✨' },
    { value: 'plating', label: 'Gold/Silver Plating', icon: '🏅' },
  ];

  const repairStatuses = [
    { value: 'received', label: 'Received', color: 'bg-blue-100 text-blue-800' },
    { value: 'assessed', label: 'Assessed', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
    { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'ready_for_pickup', label: 'Ready for Pickup', color: 'bg-orange-100 text-orange-800' },
    { value: 'delivered', label: 'Delivered', color: 'bg-gray-100 text-gray-800' },
  ];

  const getStatusColor = (status: string) => {
    const statusObj = repairStatuses.find(s => s.value === status);
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

  const handleStatusUpdate = (repairId: number, newStatus: string, notes?: string) => {
    updateRepairStatus({ id: repairId, status: newStatus, notes });
  };

  const RepairDashboard = () => {
    const pendingRepairs = repairs.filter(r => ['received', 'assessed', 'approved', 'in_progress'].includes(r.repair_status));
    const completedRepairs = repairs.filter(r => ['completed', 'ready_for_pickup', 'delivered'].includes(r.repair_status));
    const urgentRepairs = repairs.filter(r => 
      new Date(r.estimated_completion) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && 
      !['completed', 'delivered'].includes(r.repair_status)
    );

    return (
      <div className="space-y-6">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500">Active Repairs</div>
                <div className="text-2xl font-bold text-gray-900">{pendingRepairs.length}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500">Completed Today</div>
                <div className="text-2xl font-bold text-gray-900">
                  {completedRepairs.filter(r => 
                    new Date(r.updated_at).toDateString() === new Date().toDateString()
                  ).length}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500">Urgent Repairs</div>
                <div className="text-2xl font-bold text-gray-900">{urgentRepairs.length}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500">Revenue (This Month)</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    completedRepairs
                      .filter(r => new Date(r.updated_at).getMonth() === new Date().getMonth())
                      .reduce((sum, r) => sum + (r.actual_cost || r.estimated_cost), 0)
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Repairs Alert */}
        {urgentRepairs.length > 0 && (
          <div className="card bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <h3 className="text-lg font-medium text-yellow-800">Urgent Attention Required</h3>
            </div>
            <div className="mt-2 space-y-2">
              {urgentRepairs.slice(0, 3).map((repair) => (
                <div key={repair.id} className="flex justify-between items-center">
                  <span className="text-sm text-yellow-700">
                    {repair.item_description} - {repair.customer_name}
                  </span>
                  <span className="text-xs text-yellow-600">
                    Due: {new Date(repair.estimated_completion).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Repairs */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Repairs</h3>
            <div className="space-y-3">
              {repairs.slice(0, 5).map((repair) => (
                <div key={repair.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{repair.item_description}</div>
                    <div className="text-sm text-gray-500">{repair.customer_name}</div>
                    <div className="text-xs text-gray-400">
                      {repairTypes.find(t => t.value === repair.repair_type)?.label}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(repair.repair_status)}`}>
                      {repair.repair_status.replace('_', ' ')}
                    </span>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatCurrency(repair.estimated_cost)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Repair Types Distribution */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Repair Types This Month</h3>
            <div className="space-y-3">
              {repairTypes.map((type) => {
                const count = repairs.filter(r => 
                  r.repair_type === type.value && 
                  new Date(r.created_at).getMonth() === new Date().getMonth()
                ).length;
                return (
                  <div key={type.value} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{type.icon}</span>
                      <span className="text-sm text-gray-700">{type.label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RepairQueue = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="select"
            >
              <option value="">All Statuses</option>
              {repairStatuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repair Type</label>
            <select
              value={filters.repair_type}
              onChange={(e) => setFilters({...filters, repair_type: e.target.value})}
              className="select"
            >
              <option value="">All Types</option>
              {repairTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
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

      {/* Repairs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item & Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Repair Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {repairs.map((repair) => (
                <tr key={repair.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{repair.item_description}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {repair.customer_name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        {repair.customer_phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {repairTypes.find(t => t.value === repair.repair_type)?.icon}{' '}
                        {repairTypes.find(t => t.value === repair.repair_type)?.label}
                      </div>
                      <div className="text-sm text-gray-500">{repair.problem_description}</div>
                      {repair.repair_notes && (
                        <div className="text-xs text-blue-600 mt-1">{repair.repair_notes}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(repair.repair_status)}`}>
                        {repair.repair_status.replace('_', ' ')}
                      </span>
                      <div className="text-sm text-gray-500 mt-1 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Est: {new Date(repair.estimated_completion).toLocaleDateString()}
                      </div>
                      {repair.customer_approval_required && !repair.customer_approved && (
                        <div className="text-xs text-yellow-600 mt-1">⚠️ Awaiting approval</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(repair.actual_cost || repair.estimated_cost)}
                      </div>
                      {repair.actual_cost && repair.actual_cost !== repair.estimated_cost && (
                        <div className="text-xs text-gray-500">
                          Est: {formatCurrency(repair.estimated_cost)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedRepair(repair)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setShowPhotoModal(true)}
                        className="text-green-600 hover:text-green-900"
                        title="View Photos"
                      >
                        <PhotoIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setSelectedRepair(repair)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Update Status"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const RepairHistory = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Completed Repairs</h3>
        <div className="space-y-4">
          {repairs.filter(r => ['completed', 'delivered'].includes(r.repair_status)).map((repair) => (
            <div key={repair.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900">{repair.item_description}</div>
                  <div className="text-sm text-gray-500">{repair.customer_name} • {repair.customer_phone}</div>
                  <div className="text-sm text-gray-600 mt-1">{repair.problem_description}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    {formatCurrency(repair.actual_cost || repair.estimated_cost)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Completed: {new Date(repair.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {repair.after_photos.length > 0 && (
                <div className="mt-3 flex space-x-2">
                  {repair.after_photos.slice(0, 3).map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt="After repair"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repair Workflow Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Complete repair service workflow with photo documentation and customer communication
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
          disabled={isCreating}
        >
          <WrenchScrewdriverIcon className="h-5 w-5 mr-2" />
          New Repair Request
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: ClockIcon },
            { id: 'queue', name: 'Repair Queue', icon: WrenchScrewdriverIcon },
            { id: 'history', name: 'History', icon: CheckCircleIcon },
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
          <span className="ml-3 text-gray-600">Loading repairs...</span>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && <RepairDashboard />}
          {activeTab === 'queue' && <RepairQueue />}
          {activeTab === 'history' && <RepairHistory />}
        </>
      )}

      {/* Modals would go here - Create Repair, Repair Details, Photo Gallery */}
    </div>
  );
}