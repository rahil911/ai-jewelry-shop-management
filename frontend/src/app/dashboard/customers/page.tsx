'use client';

import { useEffect, useState } from 'react';
import { 
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  StarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  date_of_birth?: string;
  anniversary_date?: string;
  loyalty_points: number;
  total_purchases: number;
  total_spent: number;
  last_purchase_date?: string;
  preferred_categories: string[];
  communication_preferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  created_at: string;
  updated_at: string;
}

interface CustomerFilters {
  search: string;
  city: string;
  loyalty_tier: string;
  last_purchase: string;
}

interface CustomerStats {
  totalCustomers: number;
  newThisMonth: number;
  loyaltyMembers: number;
  averageSpent: number;
}

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    city: '',
    loyalty_tier: '',
    last_purchase: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats>({
    totalCustomers: 0,
    newThisMonth: 0,
    loyaltyMembers: 0,
    averageSpent: 0
  });

  useEffect(() => {
    fetchCustomersData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, filters]);

  const fetchCustomersData = async () => {
    try {
      // In a real implementation, this would call the customers API
      // For now, using mock data
      setTimeout(() => {
        const mockCustomers: Customer[] = [
          {
            id: 1,
            first_name: 'Priya',
            last_name: 'Sharma',
            email: 'priya.sharma@email.com',
            phone: '+91 9876543210',
            address: '123 MG Road, Koramangala',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560034',
            date_of_birth: '1985-05-15',
            anniversary_date: '2010-12-01',
            loyalty_points: 2500,
            total_purchases: 8,
            total_spent: 850000,
            last_purchase_date: '2024-01-23T10:30:00Z',
            preferred_categories: ['Necklaces', 'Earrings'],
            communication_preferences: {
              email: true,
              sms: true,
              whatsapp: true
            },
            created_at: '2022-06-15T09:00:00Z',
            updated_at: '2024-01-23T10:30:00Z'
          },
          {
            id: 2,
            first_name: 'Anita',
            last_name: 'Patel',
            email: 'anita.patel@email.com',
            phone: '+91 9876543211',
            address: '456 Brigade Road, Richmond Town',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560025',
            date_of_birth: '1978-09-22',
            anniversary_date: '2005-02-14',
            loyalty_points: 4200,
            total_purchases: 15,
            total_spent: 1250000,
            last_purchase_date: '2024-01-20T14:15:00Z',
            preferred_categories: ['Rings', 'Bracelets', 'Necklaces'],
            communication_preferences: {
              email: true,
              sms: false,
              whatsapp: true
            },
            created_at: '2021-03-20T11:30:00Z',
            updated_at: '2024-01-20T14:15:00Z'
          },
          {
            id: 3,
            first_name: 'Vikram',
            last_name: 'Singh',
            email: 'vikram.singh@email.com',
            phone: '+91 9876543212',
            address: '789 Commercial Street, Shivajinagar',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001',
            date_of_birth: '1982-03-10',
            loyalty_points: 800,
            total_purchases: 3,
            total_spent: 185000,
            last_purchase_date: '2024-01-15T16:45:00Z',
            preferred_categories: ['Rings'],
            communication_preferences: {
              email: false,
              sms: true,
              whatsapp: false
            },
            created_at: '2023-08-10T14:00:00Z',
            updated_at: '2024-01-15T16:45:00Z'
          },
          {
            id: 4,
            first_name: 'Meera',
            last_name: 'Reddy',
            email: 'meera.reddy@email.com',
            phone: '+91 9876543213',
            address: '321 Indiranagar, 100 Feet Road',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560038',
            date_of_birth: '1990-11-30',
            anniversary_date: '2018-06-15',
            loyalty_points: 1500,
            total_purchases: 5,
            total_spent: 425000,
            last_purchase_date: '2024-01-10T12:30:00Z',
            preferred_categories: ['Earrings', 'Pendants'],
            communication_preferences: {
              email: true,
              sms: true,
              whatsapp: true
            },
            created_at: '2023-01-25T10:15:00Z',
            updated_at: '2024-01-10T12:30:00Z'
          },
          {
            id: 5,
            first_name: 'Rahul',
            last_name: 'Gupta',
            email: 'rahul.gupta@email.com',
            phone: '+91 9876543214',
            address: '654 HSR Layout, Sector 2',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560102',
            date_of_birth: '1975-07-08',
            anniversary_date: '2008-11-20',
            loyalty_points: 3200,
            total_purchases: 12,
            total_spent: 950000,
            last_purchase_date: '2023-12-20T15:20:00Z',
            preferred_categories: ['Necklaces', 'Bangles'],
            communication_preferences: {
              email: true,
              sms: false,
              whatsapp: true
            },
            created_at: '2020-11-12T13:45:00Z',
            updated_at: '2023-12-20T15:20:00Z'
          }
        ];

        setCustomers(mockCustomers);
        
        // Calculate stats
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const stats: CustomerStats = {
          totalCustomers: mockCustomers.length,
          newThisMonth: mockCustomers.filter(customer => {
            const createdDate = new Date(customer.created_at);
            return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
          }).length,
          loyaltyMembers: mockCustomers.filter(customer => customer.loyalty_points > 1000).length,
          averageSpent: mockCustomers.reduce((sum, customer) => sum + customer.total_spent, 0) / mockCustomers.length
        };
        setCustomerStats(stats);
        
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch customers data:', error);
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...customers];

    if (filters.search) {
      filtered = filtered.filter(customer => 
        `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        customer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        customer.phone.includes(filters.search)
      );
    }

    if (filters.city) {
      filtered = filtered.filter(customer => customer.city === filters.city);
    }

    if (filters.loyalty_tier) {
      if (filters.loyalty_tier === 'gold') {
        filtered = filtered.filter(customer => customer.loyalty_points >= 3000);
      } else if (filters.loyalty_tier === 'silver') {
        filtered = filtered.filter(customer => customer.loyalty_points >= 1000 && customer.loyalty_points < 3000);
      } else if (filters.loyalty_tier === 'bronze') {
        filtered = filtered.filter(customer => customer.loyalty_points < 1000);
      }
    }

    if (filters.last_purchase) {
      const days = parseInt(filters.last_purchase);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filtered = filtered.filter(customer => 
        customer.last_purchase_date && new Date(customer.last_purchase_date) >= cutoffDate
      );
    }

    setFilteredCustomers(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getLoyaltyTier = (points: number) => {
    if (points >= 3000) return { tier: 'Gold', color: 'text-yellow-600 bg-yellow-100' };
    if (points >= 1000) return { tier: 'Silver', color: 'text-gray-600 bg-gray-100' };
    return { tier: 'Bronze', color: 'text-orange-600 bg-orange-100' };
  };

  const getCustomerFullName = (customer: Customer) => {
    return `${customer.first_name} ${customer.last_name}`;
  };

  const isUpcomingBirthday = (dateOfBirth: string) => {
    const today = new Date();
    const birthday = new Date(dateOfBirth);
    birthday.setFullYear(today.getFullYear());
    
    const daysDiff = Math.ceil((birthday.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysDiff >= 0 && daysDiff <= 30;
  };

  const isUpcomingAnniversary = (anniversaryDate: string) => {
    const today = new Date();
    const anniversary = new Date(anniversaryDate);
    anniversary.setFullYear(today.getFullYear());
    
    const daysDiff = Math.ceil((anniversary.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysDiff >= 0 && daysDiff <= 30;
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
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer profiles, loyalty programs, and purchase history
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add Customer
          </button>
          <button className="btn-secondary flex items-center">
            <GiftIcon className="h-5 w-5 mr-2" />
            Birthday/Anniversary
          </button>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Total Customers</div>
              <div className="text-2xl font-bold text-gray-900">{customerStats.totalCustomers}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserPlusIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">New This Month</div>
              <div className="text-2xl font-bold text-gray-900">{customerStats.newThisMonth}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <StarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Loyalty Members</div>
              <div className="text-2xl font-bold text-gray-900">{customerStats.loyaltyMembers}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Average Spent</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(customerStats.averageSpent)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                placeholder="Name, email, phone..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <select
              id="city"
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
              className="input-field"
            >
              <option value="">All Cities</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Chennai">Chennai</option>
            </select>
          </div>

          <div>
            <label htmlFor="loyalty_tier" className="block text-sm font-medium text-gray-700 mb-2">
              Loyalty Tier
            </label>
            <select
              id="loyalty_tier"
              value={filters.loyalty_tier}
              onChange={(e) => setFilters({...filters, loyalty_tier: e.target.value})}
              className="input-field"
            >
              <option value="">All Tiers</option>
              <option value="gold">Gold (3000+ points)</option>
              <option value="silver">Silver (1000-2999 points)</option>
              <option value="bronze">Bronze (&lt; 1000 points)</option>
            </select>
          </div>

          <div>
            <label htmlFor="last_purchase" className="block text-sm font-medium text-gray-700 mb-2">
              Last Purchase
            </label>
            <select
              id="last_purchase"
              value={filters.last_purchase}
              onChange={(e) => setFilters({...filters, last_purchase: e.target.value})}
              className="input-field"
            >
              <option value="">Any Time</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({search: '', city: '', loyalty_tier: '', last_purchase: ''})}
            className="btn-outline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Information
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase History
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loyalty & Preferences
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Special Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => {
                const loyaltyInfo = getLoyaltyTier(customer.loyalty_points);
                const hasUpcomingBirthday = customer.date_of_birth && isUpcomingBirthday(customer.date_of_birth);
                const hasUpcomingAnniversary = customer.anniversary_date && isUpcomingAnniversary(customer.anniversary_date);
                
                return (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getCustomerFullName(customer)}
                            {(hasUpcomingBirthday || hasUpcomingAnniversary) && (
                              <span className="ml-2 inline-flex items-center">
                                <GiftIcon className="h-4 w-4 text-pink-500" />
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Customer since {new Date(customer.created_at).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {customer.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {customer.city}, {customer.state}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.total_purchases} orders
                        </div>
                        <div className="text-sm text-gray-500">
                          Total: {formatCurrency(customer.total_spent)}
                        </div>
                        {customer.last_purchase_date && (
                          <div className="text-sm text-gray-500">
                            Last: {new Date(customer.last_purchase_date).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loyaltyInfo.color}`}>
                          {loyaltyInfo.tier} ({customer.loyalty_points} pts)
                        </span>
                        <div className="text-xs text-gray-500">
                          Prefers: {customer.preferred_categories.join(', ')}
                        </div>
                        <div className="flex space-x-1">
                          {customer.communication_preferences.email && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">Email</span>
                          )}
                          {customer.communication_preferences.sms && (
                            <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">SMS</span>
                          )}
                          {customer.communication_preferences.whatsapp && (
                            <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">WhatsApp</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.date_of_birth && (
                          <div className={`flex items-center ${hasUpcomingBirthday ? 'text-pink-600 font-medium' : ''}`}>
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Birthday: {new Date(customer.date_of_birth).toLocaleDateString('en-IN')}
                          </div>
                        )}
                        {customer.anniversary_date && (
                          <div className={`flex items-center mt-1 ${hasUpcomingAnniversary ? 'text-pink-600 font-medium' : ''}`}>
                            <HeartIcon className="h-4 w-4 mr-1" />
                            Anniversary: {new Date(customer.anniversary_date).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit Customer"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => console.log('Delete customer', customer.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Customer"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-500 text-center">
        Showing {filteredCustomers.length} of {customers.length} customers
      </div>

      {/* Customer Details Modal Placeholder */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Customer Profile - {getCustomerFullName(selectedCustomer)}
                </h3>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Email:</strong> {selectedCustomer.email}</p>
                    <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
                    <p><strong>Address:</strong> {selectedCustomer.address}</p>
                    <p><strong>City:</strong> {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pincode}</p>
                    {selectedCustomer.date_of_birth && (
                      <p><strong>Date of Birth:</strong> {new Date(selectedCustomer.date_of_birth).toLocaleDateString('en-IN')}</p>
                    )}
                    {selectedCustomer.anniversary_date && (
                      <p><strong>Anniversary:</strong> {new Date(selectedCustomer.anniversary_date).toLocaleDateString('en-IN')}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Purchase History</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Total Orders:</strong> {selectedCustomer.total_purchases}</p>
                    <p><strong>Total Spent:</strong> {formatCurrency(selectedCustomer.total_spent)}</p>
                    <p><strong>Loyalty Points:</strong> {selectedCustomer.loyalty_points}</p>
                    <p><strong>Preferred Categories:</strong> {selectedCustomer.preferred_categories.join(', ')}</p>
                    {selectedCustomer.last_purchase_date && (
                      <p><strong>Last Purchase:</strong> {new Date(selectedCustomer.last_purchase_date).toLocaleDateString('en-IN')}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="btn-outline"
                >
                  Close
                </button>
                <button className="btn-secondary">
                  View Orders
                </button>
                <button className="btn-primary">
                  Edit Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}