'use client';

import React, { useState } from 'react';
import { 
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChartBarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  useStaff, 
  useStaffAnalytics, 
  useStaffActions
} from '@/lib/hooks/useStaff';
import { StaffMember, StaffCreateRequest, StaffFilters } from '@/lib/api/services/staff';

export default function StaffPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<StaffFilters>({
    page: 1,
    limit: 20
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { data: staffData, isLoading, error } = useStaff({
    ...filters,
    search: searchQuery || undefined,
    role: selectedRole === 'all' ? undefined : selectedRole,
    department: selectedDepartment === 'all' ? undefined : selectedDepartment,
    status: selectedStatus === 'all' ? undefined : selectedStatus
  });

  const { data: analytics } = useStaffAnalytics();
  const staffActions = useStaffActions();

  const [newStaff, setNewStaff] = useState<StaffCreateRequest>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'sales',
    department: 'Sales',
    salary: 30000,
    commission_rate: 2.0,
    address: '',
    emergency_contact: {
      name: '',
      phone: '',
      relationship: ''
    },
    permissions: []
  });

  const roles = [
    { id: 'all', name: 'All Roles', count: analytics?.total_staff || 0 },
    { id: 'manager', name: 'Manager', count: analytics?.by_role.find(r => r.role === 'manager')?.count || 0 },
    { id: 'sales', name: 'Sales', count: analytics?.by_role.find(r => r.role === 'sales')?.count || 0 },
    { id: 'cashier', name: 'Cashier', count: analytics?.by_role.find(r => r.role === 'cashier')?.count || 0 },
    { id: 'craftsman', name: 'Craftsman', count: analytics?.by_role.find(r => r.role === 'craftsman')?.count || 0 }
  ];

  const departments = [
    { id: 'all', name: 'All Departments' },
    { id: 'Sales', name: 'Sales' },
    { id: 'Management', name: 'Management' },
    { id: 'Operations', name: 'Operations' },
    { id: 'Crafts', name: 'Crafts' }
  ];

  const statuses = [
    { id: 'all', name: 'All Status' },
    { id: 'active', name: 'Active' },
    { id: 'inactive', name: 'Inactive' },
    { id: 'on_leave', name: 'On Leave' }
  ];

  const permissions = [
    'view_orders',
    'create_orders',
    'edit_orders',
    'delete_orders',
    'view_customers',
    'edit_customers',
    'view_inventory',
    'manage_inventory',
    'process_payments',
    'view_reports',
    'manage_staff'
  ];

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
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'sales': return 'bg-green-100 text-green-800';
      case 'cashier': return 'bg-orange-100 text-orange-800';
      case 'craftsman': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateStaff = () => {
    staffActions.createStaff(newStaff);
    setIsCreateModalOpen(false);
    setNewStaff({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'sales',
      department: 'Sales',
      salary: 30000,
      commission_rate: 2.0,
      address: '',
      emergency_contact: {
        name: '',
        phone: '',
        relationship: ''
      },
      permissions: []
    });
  };

  const handleStatusChange = (staffId: string, newStatus: 'active' | 'inactive' | 'on_leave') => {
    staffActions.updateStaffStatus({ id: staffId, status: newStatus });
  };

  const handleViewStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsViewModalOpen(true);
  };

  const getPerformanceColor = (achievement: number, target: number) => {
    const percentage = target > 0 ? (achievement / target) * 100 : 0;
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage team members, roles, and performance
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary flex items-center"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Staff
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {analytics.total_staff}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Staff
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {analytics.by_status.find(s => s.status === 'active')?.count || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Performance
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {analytics.average_performance}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    On Leave
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {analytics.by_status.find(s => s.status === 'on_leave')?.count || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Role Filter */}
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="select"
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name} ({role.count})
            </option>
          ))}
        </select>

        {/* Department Filter */}
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="select"
        >
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="select"
        >
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </div>

      {/* Staff List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/5"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : staffData?.staff.length ? (
        <div className="space-y-4">
          {staffData.staff.map((staff) => (
            <div key={staff.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {staff.first_name[0]}{staff.last_name[0]}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {staff.first_name} {staff.last_name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(staff.role)}`}>
                        {staff.role}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(staff.status)}`}>
                        {staff.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        {staff.email}
                      </div>
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        {staff.phone}
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {staff.department}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="text-sm">
                        <span className="text-gray-500">Salary:</span>
                        <span className="font-medium ml-1">{formatCurrency(staff.salary)}</span>
                      </div>
                      {staff.performance_metrics.sales_target > 0 && (
                        <div className="text-sm">
                          <span className="text-gray-500">Performance:</span>
                          <span className={`font-medium ml-1 ${getPerformanceColor(staff.performance_metrics.sales_achieved, staff.performance_metrics.sales_target)}`}>
                            {((staff.performance_metrics.sales_achieved / staff.performance_metrics.sales_target) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-gray-500">Rating:</span>
                        <span className="font-medium ml-1 text-yellow-600">
                          {staff.performance_metrics.customer_rating} ★
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewStaff(staff)}
                    className="btn-secondary btn-sm"
                  >
                    View Details
                  </button>
                  
                  <div className="relative group">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="py-1">
                        <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full">
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                        <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full">
                          <ShieldCheckIcon className="h-4 w-4 mr-2" />
                          Permissions
                        </button>
                        <button
                          onClick={() => handleStatusChange(staff.id, staff.status === 'active' ? 'inactive' : 'active')}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                        >
                          {staff.status === 'active' ? <XCircleIcon className="h-4 w-4 mr-2" /> : <CheckCircleIcon className="h-4 w-4 mr-2" />}
                          {staff.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          onClick={() => staffActions.deleteStaff(staff.id)}
                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search terms.' : 'Start by adding your first staff member.'}
          </p>
          <div className="mt-6">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add Staff Member
            </button>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Add New Staff Member</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={newStaff.first_name}
                      onChange={(e) => setNewStaff({...newStaff, first_name: e.target.value})}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={newStaff.last_name}
                      onChange={(e) => setNewStaff({...newStaff, last_name: e.target.value})}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={newStaff.address}
                    onChange={(e) => setNewStaff({...newStaff, address: e.target.value})}
                    className="input"
                    rows={3}
                  />
                </div>
              </div>

              {/* Job Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Job Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={newStaff.role}
                      onChange={(e) => setNewStaff({...newStaff, role: e.target.value as any})}
                      className="select"
                    >
                      <option value="sales">Sales</option>
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                      <option value="craftsman">Craftsman</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      value={newStaff.department}
                      onChange={(e) => setNewStaff({...newStaff, department: e.target.value})}
                      className="select"
                    >
                      <option value="Sales">Sales</option>
                      <option value="Management">Management</option>
                      <option value="Operations">Operations</option>
                      <option value="Crafts">Crafts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      value={newStaff.salary}
                      onChange={(e) => setNewStaff({...newStaff, salary: Number(e.target.value)})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newStaff.commission_rate}
                      onChange={(e) => setNewStaff({...newStaff, commission_rate: Number(e.target.value)})}
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={newStaff.emergency_contact.name}
                      onChange={(e) => setNewStaff({
                        ...newStaff, 
                        emergency_contact: {...newStaff.emergency_contact, name: e.target.value}
                      })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newStaff.emergency_contact.phone}
                      onChange={(e) => setNewStaff({
                        ...newStaff, 
                        emergency_contact: {...newStaff.emergency_contact, phone: e.target.value}
                      })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                    <input
                      type="text"
                      value={newStaff.emergency_contact.relationship}
                      onChange={(e) => setNewStaff({
                        ...newStaff, 
                        emergency_contact: {...newStaff.emergency_contact, relationship: e.target.value}
                      })}
                      className="input"
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Permissions</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {permissions.map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newStaff.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewStaff({...newStaff, permissions: [...newStaff.permissions, permission]});
                          } else {
                            setNewStaff({...newStaff, permissions: newStaff.permissions.filter(p => p !== permission)});
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{permission.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStaff}
                disabled={staffActions.isLoading || !newStaff.first_name || !newStaff.last_name || !newStaff.email}
                className="btn-primary"
              >
                {staffActions.isLoading ? 'Creating...' : 'Create Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Staff Modal */}
      {isViewModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Staff Details</h3>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Personal Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="card">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <div className="font-medium">{selectedStaff.first_name} {selectedStaff.last_name}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <div className="font-medium">{selectedStaff.email}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <div className="font-medium">{selectedStaff.phone}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Address:</span>
                      <div className="font-medium">{selectedStaff.address}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Hire Date:</span>
                      <div className="font-medium">{new Date(selectedStaff.hire_date).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Login:</span>
                      <div className="font-medium">
                        {selectedStaff.last_login ? new Date(selectedStaff.last_login).toLocaleString('en-IN') : 'Never'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Job Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Role:</span>
                      <div className="font-medium capitalize">{selectedStaff.role}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Department:</span>
                      <div className="font-medium">{selectedStaff.department}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Salary:</span>
                      <div className="font-medium">{formatCurrency(selectedStaff.salary)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Commission Rate:</span>
                      <div className="font-medium">{selectedStaff.commission_rate}%</div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Emergency Contact</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <div className="font-medium">{selectedStaff.emergency_contact.name}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <div className="font-medium">{selectedStaff.emergency_contact.phone}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Relationship:</span>
                      <div className="font-medium">{selectedStaff.emergency_contact.relationship}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance & Status */}
              <div className="space-y-6">
                <div className="card">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Status & Performance</h4>
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-500 text-sm">Status:</span>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedStaff.status)}`}>
                        {selectedStaff.status}
                      </div>
                    </div>
                    
                    {selectedStaff.performance_metrics.sales_target > 0 && (
                      <div>
                        <span className="text-gray-500 text-sm">Sales Performance:</span>
                        <div className="mt-1">
                          <div className="flex justify-between text-sm">
                            <span>Target: {formatCurrency(selectedStaff.performance_metrics.sales_target)}</span>
                            <span>Achieved: {formatCurrency(selectedStaff.performance_metrics.sales_achieved)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min((selectedStaff.performance_metrics.sales_achieved / selectedStaff.performance_metrics.sales_target) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-gray-500 text-sm">Customer Rating:</span>
                      <div className="font-medium text-yellow-600">
                        {selectedStaff.performance_metrics.customer_rating} ★
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 text-sm">Orders Processed:</span>
                      <div className="font-medium">{selectedStaff.performance_metrics.orders_processed}</div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Permissions</h4>
                  <div className="space-y-2">
                    {selectedStaff.permissions.map((permission) => (
                      <div key={permission} className="flex items-center">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-700 capitalize">{permission.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}