'use client';

import { useEffect, useState } from 'react';
import { 
  CurrencyDollarIcon, 
  CubeIcon, 
  ShoppingCartIcon, 
  UsersIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCurrentGoldRates } from '@/lib/hooks/usePricing';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  inventoryValue: number;
  goldRate: number;
  goldRateChange: number;
  silverRate: number;
  silverRateChange: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: goldRates, isLoading: goldRatesLoading } = useCurrentGoldRates();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    inventoryValue: 0,
    goldRate: 0,
    goldRateChange: 0,
    silverRate: 0,
    silverRateChange: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Update gold rate in stats when live data comes in
    if (goldRates) {
      setStats(prev => ({
        ...prev,
        goldRate: goldRates['22K'],
        goldRateChange: 2.5, // TODO: Calculate from historical data
      }));
    }
  }, [goldRates]);

  const fetchDashboardData = async () => {
    try {
      // Mock data for other stats - TODO: Connect to analytics API
      setTimeout(() => {
        setStats(prev => ({
          ...prev,
          totalRevenue: 125000,
          totalOrders: 45,
          totalCustomers: 128,
          inventoryValue: 850000,
          silverRate: 84,
          silverRateChange: -1.2,
        }));
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      name: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: CurrencyDollarIcon,
      change: '+12.5%',
      changeType: 'positive' as const,
    },
    {
      name: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCartIcon,
      change: '+8 new',
      changeType: 'positive' as const,
    },
    {
      name: 'Customers',
      value: stats.totalCustomers.toString(),
      icon: UsersIcon,
      change: '+5 this week',
      changeType: 'positive' as const,
    },
    {
      name: 'Inventory Value',
      value: formatCurrency(stats.inventoryValue),
      icon: CubeIcon,
      change: '+2.1%',
      changeType: 'positive' as const,
    },
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your jewelry shop today.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last updated</div>
          <div className="text-sm font-medium text-gray-900">
            {new Date().toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Metal Rates */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">Au</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Gold Rate (per gram)
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    ₹{stats.goldRate.toLocaleString('en-IN')}
                  </div>
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${ 
                    stats.goldRateChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.goldRateChange >= 0 ? (
                      <TrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                    ) : (
                      <TrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                    )}
                    <span className="ml-1">{Math.abs(stats.goldRateChange)}%</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">Ag</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Silver Rate (per gram)
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    ₹{stats.silverRate.toLocaleString('en-IN')}
                  </div>
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${ 
                    stats.silverRateChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.silverRateChange >= 0 ? (
                      <TrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                    ) : (
                      <TrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                    )}
                    <span className="ml-1">{Math.abs(stats.silverRateChange)}%</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <item.icon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {item.value}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${ 
                      item.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.changeType === 'positive' ? (
                        <TrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                      ) : (
                        <TrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                      )}
                      <span className="ml-1">{item.change}</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Orders
            </h3>
            <a href="/dashboard/orders" className="text-sm font-medium text-gold-600 hover:text-gold-500">
              View all
            </a>
          </div>
          <div className="space-y-3">
            {[
              { id: 'ORD241223001', customer: 'Priya Sharma', amount: 25000, status: 'confirmed' },
              { id: 'ORD241223002', customer: 'Rajesh Kumar', amount: 45000, status: 'pending' },
              { id: 'ORD241223003', customer: 'Anita Patel', amount: 15000, status: 'completed' },
            ].map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="text-sm font-medium text-gray-900">{order.id}</div>
                  <div className="text-sm text-gray-500">{order.customer}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.amount)}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-primary text-center py-3">
              Add New Item
            </button>
            <button className="btn-outline text-center py-3">
              Create Order
            </button>
            <button className="btn-secondary text-center py-3">
              Update Prices
            </button>
            <button className="btn-secondary text-center py-3">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}