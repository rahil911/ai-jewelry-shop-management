'use client';

import React, { useState } from 'react';
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
  FunnelIcon,
  ArrowPathIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  useAnalyticsDashboard, 
  useRealTimeMetrics,
  useAnalyticsActions 
} from '@/lib/hooks/useAnalytics';
import { AnalyticsFilters } from '@/lib/api/services/analytics';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: 'last_30_days',
    custom_from: '',
    custom_to: ''
  });
  
  // Real-time analytics data with live updates
  const analytics = useAnalyticsDashboard(filters);
  const realTimeMetrics = useRealTimeMetrics();
  const { refreshAll, exportReport, isExporting } = useAnalyticsActions();

  // Auto-refresh indicator
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

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

  const handleExportReport = (format: 'pdf' | 'excel') => {
    exportReport({ filters, format });
  };

  const handleApplyFilter = () => {
    analytics.refetchAll();
  };

  if (analytics.isLoading) {
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
      {/* Header with Real-time Updates */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
            {realTimeMetrics.isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            ) : (
              <div className="flex items-center text-sm text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                Live Data
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Real-time business insights from Azure backend services
          </p>
          <div className="flex items-center text-xs text-gray-400 mt-1">
            <ClockIcon className="h-4 w-4 mr-1" />
            Last updated: {new Date(realTimeMetrics.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={refreshAll}
            className="btn-secondary flex items-center"
            disabled={analytics.isLoading}
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${analytics.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => handleExportReport('pdf')}
            className="btn-secondary flex items-center"
            disabled={isExporting}
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button 
            onClick={() => handleExportReport('excel')}
            className="btn-secondary flex items-center"
            disabled={isExporting}
          >
            <DocumentChartBarIcon className="h-5 w-5 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Real-time Gold Rate Ticker */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Live Gold Rates</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  ₹{realTimeMetrics.metrics.goldRate.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">22K Gold/g</div>
              </div>
              <div className={`flex items-center text-sm font-semibold ${
                realTimeMetrics.metrics.goldChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {React.createElement(getGrowthIcon(realTimeMetrics.metrics.goldChange), { 
                  className: "h-4 w-4 mr-1" 
                })}
                ₹{Math.abs(realTimeMetrics.metrics.goldChange)}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Updates every 30 seconds during business hours
          </div>
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
              onChange={(e) => setFilters({...filters, period: e.target.value as any})}
              className="select"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {filters.date_from && (
            <>
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
            </>
          )}

          <div className="flex items-end">
            <button 
              onClick={handleApplyFilter}
              className="btn-primary flex items-center"
              disabled={analytics.isLoading}
            >
              {analytics.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Apply Filter
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Key Metrics */}
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
                    {formatCurrency(analytics.sales.data?.total_revenue || 0)}
                  </div>
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${getGrowthColor(analytics.sales.data?.revenue_growth || 0)}`}>
                    {React.createElement(getGrowthIcon(analytics.sales.data?.revenue_growth || 0), { className: "self-center flex-shrink-0 h-4 w-4" })}
                    <span className="ml-1">{Math.abs(analytics.sales.data?.revenue_growth || 0).toFixed(1)}%</span>
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
                    {analytics.sales.data?.total_orders || 0}
                  </div>
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${getGrowthColor(analytics.sales.data?.orders_growth || 0)}`}>
                    {React.createElement(getGrowthIcon(analytics.sales.data?.orders_growth || 0), { className: "self-center flex-shrink-0 h-4 w-4" })}
                    <span className="ml-1">{Math.abs(analytics.sales.data?.orders_growth || 0).toFixed(1)}%</span>
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
                    {formatCurrency(analytics.sales.data?.average_order_value || 0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Based on {analytics.sales.data?.total_orders || 0} orders
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CubeIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Inventory Value
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(realTimeMetrics.metrics.inventoryValue)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {analytics.inventory.data?.total_items || 0} items in stock
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Alerts */}
      {(realTimeMetrics.metrics.lowStockItems > 0 || realTimeMetrics.metrics.pendingOrders > 5) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Business Alerts</h3>
              <div className="text-sm text-yellow-700 mt-1 space-y-1">
                {realTimeMetrics.metrics.lowStockItems > 0 && (
                  <div>• {realTimeMetrics.metrics.lowStockItems} items are running low on stock</div>
                )}
                {realTimeMetrics.metrics.pendingOrders > 5 && (
                  <div>• {realTimeMetrics.metrics.pendingOrders} orders are pending attention</div>
                )}
              </div>
            </div>
            <button className="btn-outline btn-sm">
              View Details
            </button>
          </div>
        </div>
      )}

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
                {analytics.sales.data?.daily_sales?.length || 0} data points available
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
            {(analytics.sales.data?.category_performance || []).map((category, index) => (
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
                {(analytics.inventory.data?.metal_breakdown || []).map((metal, index) => (
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
            {(analytics.customers.data?.top_customers || []).map((customer, index) => (
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