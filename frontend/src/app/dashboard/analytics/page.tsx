'use client';

import React, { useEffect, useState } from 'react';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  CalendarIcon,
  UsersIcon,
  CubeIcon,
  ShoppingCartIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/AuthContext';

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface CategoryPerformance {
  category: string;
  revenue: number;
  orders: number;
  percentage: number;
}

interface MetalTypeData {
  metal: string;
  weight: number;
  value: number;
  percentage: number;
}

interface AnalyticsStats {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  averageOrderValue: number;
  aovGrowth: number;
  customerRetention: number;
  retentionGrowth: number;
}

interface DateFilters {
  period: string;
  custom_from: string;
  custom_to: string;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<DateFilters>({
    period: 'last_30_days',
    custom_from: '',
    custom_to: ''
  });
  
  const [analyticsStats, setAnalyticsStats] = useState<AnalyticsStats>({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    averageOrderValue: 0,
    aovGrowth: 0,
    customerRetention: 0,
    retentionGrowth: 0
  });

  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [metalTypeData, setMetalTypeData] = useState<MetalTypeData[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [filters]);

  const fetchAnalyticsData = async () => {
    try {
      // In a real implementation, this would call the analytics API
      // For now, using mock data
      setTimeout(() => {
        // Mock analytics stats
        const stats: AnalyticsStats = {
          totalRevenue: 2850000,
          revenueGrowth: 15.2,
          totalOrders: 156,
          ordersGrowth: 8.7,
          averageOrderValue: 18269,
          aovGrowth: 6.1,
          customerRetention: 72.5,
          retentionGrowth: 4.2
        };
        setAnalyticsStats(stats);

        // Mock sales data (last 30 days)
        const sales: SalesData[] = [
          { date: '2024-01-01', revenue: 95000, orders: 5, customers: 4 },
          { date: '2024-01-02', revenue: 125000, orders: 7, customers: 6 },
          { date: '2024-01-03', revenue: 87000, orders: 4, customers: 4 },
          { date: '2024-01-04', revenue: 156000, orders: 9, customers: 8 },
          { date: '2024-01-05', revenue: 78000, orders: 3, customers: 3 },
          { date: '2024-01-06', revenue: 142000, orders: 8, customers: 7 },
          { date: '2024-01-07', revenue: 98000, orders: 5, customers: 5 },
          { date: '2024-01-08', revenue: 189000, orders: 11, customers: 9 },
          { date: '2024-01-09', revenue: 76000, orders: 4, customers: 4 },
          { date: '2024-01-10', revenue: 134000, orders: 7, customers: 6 },
          { date: '2024-01-11', revenue: 167000, orders: 9, customers: 8 },
          { date: '2024-01-12', revenue: 92000, orders: 5, customers: 5 },
          { date: '2024-01-13', revenue: 145000, orders: 8, customers: 7 },
          { date: '2024-01-14', revenue: 83000, orders: 4, customers: 4 },
          { date: '2024-01-15', revenue: 198000, orders: 12, customers: 10 }
        ];
        setSalesData(sales);

        // Mock category performance
        const categories: CategoryPerformance[] = [
          { category: 'Necklaces', revenue: 1250000, orders: 65, percentage: 43.8 },
          { category: 'Earrings', revenue: 680000, orders: 42, percentage: 23.9 },
          { category: 'Rings', revenue: 520000, orders: 28, percentage: 18.2 },
          { category: 'Bracelets', revenue: 280000, orders: 15, percentage: 9.8 },
          { category: 'Bangles', revenue: 120000, orders: 6, percentage: 4.2 }
        ];
        setCategoryPerformance(categories);

        // Mock metal type data
        const metals: MetalTypeData[] = [
          { metal: '22K Gold', weight: 2850.5, value: 1890000, percentage: 66.3 },
          { metal: '18K Gold', weight: 1420.8, value: 720000, percentage: 25.3 },
          { metal: 'Silver 925', weight: 890.2, value: 180000, percentage: 6.3 },
          { metal: 'Platinum', weight: 125.6, value: 60000, percentage: 2.1 }
        ];
        setMetalTypeData(metals);

        // Mock top customers
        const customers = [
          { name: 'Priya Sharma', orders: 8, spent: 850000, lastPurchase: '2024-01-23' },
          { name: 'Anita Patel', orders: 15, spent: 1250000, lastPurchase: '2024-01-20' },
          { name: 'Meera Reddy', orders: 5, spent: 425000, lastPurchase: '2024-01-10' },
          { name: 'Rahul Gupta', orders: 12, spent: 950000, lastPurchase: '2023-12-20' },
          { name: 'Vikram Singh', orders: 3, spent: 185000, lastPurchase: '2024-01-15' }
        ];
        setTopCustomers(customers);

        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
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

  const formatWeight = (weight: number) => {
    return `${weight.toLocaleString('en-IN')}g`;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? TrendingUpIcon : TrendingDownIcon;
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Business insights, sales analytics, and performance metrics
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary flex items-center">
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export Report
          </button>
          <button className="btn-secondary flex items-center">
            <PrinterIcon className="h-5 w-5 mr-2" />
            Print Report
          </button>
        </div>
      </div>

      {/* Date Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <select
              id="period"
              value={filters.period}
              onChange={(e) => setFilters({...filters, period: e.target.value})}
              className="select"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {filters.period === 'custom' && (
            <>
              <div>
                <label htmlFor="custom_from" className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  id="custom_from"
                  value={filters.custom_from}
                  onChange={(e) => setFilters({...filters, custom_from: e.target.value})}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="custom_to" className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  id="custom_to"
                  value={filters.custom_to}
                  onChange={(e) => setFilters({...filters, custom_to: e.target.value})}
                  className="input"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <button className="btn-primary">
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Revenue
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(analyticsStats.totalRevenue)}
                  </div>
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${getGrowthColor(analyticsStats.revenueGrowth)}`}>
                    {React.createElement(getGrowthIcon(analyticsStats.revenueGrowth), { className: "self-center flex-shrink-0 h-4 w-4" })}
                    <span className="ml-1">{Math.abs(analyticsStats.revenueGrowth)}%</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Orders
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {analyticsStats.totalOrders}
                  </div>
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${getGrowthColor(analyticsStats.ordersGrowth)}`}>
                    {React.createElement(getGrowthIcon(analyticsStats.ordersGrowth), { className: "self-center flex-shrink-0 h-4 w-4" })}
                    <span className="ml-1">{Math.abs(analyticsStats.ordersGrowth)}%</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Avg Order Value
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(analyticsStats.averageOrderValue)}
                  </div>
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${getGrowthColor(analyticsStats.aovGrowth)}`}>
                    {React.createElement(getGrowthIcon(analyticsStats.aovGrowth), { className: "self-center flex-shrink-0 h-4 w-4" })}
                    <span className="ml-1">{Math.abs(analyticsStats.aovGrowth)}%</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Customer Retention
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {analyticsStats.customerRetention}%
                  </div>
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${getGrowthColor(analyticsStats.retentionGrowth)}`}>
                    {React.createElement(getGrowthIcon(analyticsStats.retentionGrowth), { className: "self-center flex-shrink-0 h-4 w-4" })}
                    <span className="ml-1">{Math.abs(analyticsStats.retentionGrowth)}%</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Sales Trend
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-500">
              View Details
            </button>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Sales trend chart would be rendered here</p>
              <p className="text-xs text-gray-400 mt-1">
                {salesData.length} data points available
              </p>
            </div>
          </div>
        </div>

        {/* Category Performance */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Category Performance
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-500">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {categoryPerformance.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    <span className="text-sm text-gray-500">{category.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{category.orders} orders</span>
                    <span className="text-xs text-gray-500">{formatCurrency(category.revenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metal Type Analysis & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metal Type Analysis */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Metal Type Analysis
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-500">
              Inventory Report
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                    Metal Type
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                    Weight
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                    Value
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {metalTypeData.map((metal, index) => (
                  <tr key={index}>
                    <td className="py-2 text-sm font-medium text-gray-900">{metal.metal}</td>
                    <td className="py-2 text-sm text-gray-500 text-right">{formatWeight(metal.weight)}</td>
                    <td className="py-2 text-sm text-gray-500 text-right">{formatCurrency(metal.value)}</td>
                    <td className="py-2 text-sm text-gray-500 text-right">{metal.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Customers */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Top Customers
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-500">
              View All Customers
            </button>
          </div>
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {customer.name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.orders} orders</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{formatCurrency(customer.spent)}</div>
                  <div className="text-sm text-gray-500">
                    Last: {new Date(customer.lastPurchase).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Reports Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Additional Reports
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="btn-outline flex items-center justify-center p-4">
            <DocumentChartBarIcon className="h-6 w-6 mr-2" />
            Inventory Valuation
          </button>
          <button className="btn-outline flex items-center justify-center p-4">
            <CurrencyDollarIcon className="h-6 w-6 mr-2" />
            Profit Analysis
          </button>
          <button className="btn-outline flex items-center justify-center p-4">
            <UsersIcon className="h-6 w-6 mr-2" />
            Customer Insights
          </button>
          <button className="btn-outline flex items-center justify-center p-4">
            <ChartBarIcon className="h-6 w-6 mr-2" />
            Staff Performance
          </button>
        </div>
      </div>
    </div>
  );
}