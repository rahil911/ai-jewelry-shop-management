'use client';

import React, { useState } from 'react';
import { 
  DocumentChartBarIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  PrinterIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChartBarIcon,
  UsersIcon,
  CubeIcon,
  ShoppingCartIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  PresentationChartLineIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAnalyticsDashboard, useAnalyticsActions } from '@/lib/hooks/useAnalytics';
import { AnalyticsFilters } from '@/lib/api/services/analytics';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'financial' | 'sales' | 'inventory' | 'customer' | 'tax';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'daily_sales',
    name: 'Daily Sales Report',
    description: 'Comprehensive daily sales breakdown with gold rates and profit analysis',
    icon: ChartBarIcon,
    category: 'sales',
    frequency: 'daily'
  },
  {
    id: 'monthly_pl',
    name: 'Monthly P&L Statement',
    description: 'Profit and loss statement with detailed financial breakdown',
    icon: CurrencyDollarIcon,
    category: 'financial',
    frequency: 'monthly'
  },
  {
    id: 'gst_report',
    name: 'GST Compliance Report',
    description: 'GST filing ready report with all tax calculations',
    icon: DocumentTextIcon,
    category: 'tax',
    frequency: 'monthly'
  },
  {
    id: 'inventory_valuation',
    name: 'Inventory Valuation Report',
    description: 'Current inventory value with metal-wise breakdown',
    icon: CubeIcon,
    category: 'inventory',
    frequency: 'weekly'
  },
  {
    id: 'customer_analysis',
    name: 'Customer Analysis Report',
    description: 'Customer behavior, loyalty points, and purchase patterns',
    icon: UsersIcon,
    category: 'customer',
    frequency: 'monthly'
  },
  {
    id: 'quarterly_performance',
    name: 'Quarterly Performance Report',
    description: 'Comprehensive business performance analysis',
    icon: PresentationChartLineIcon,
    category: 'financial',
    frequency: 'quarterly'
  }
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: 'last_30_days',
    custom_from: '',
    custom_to: ''
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const analytics = useAnalyticsDashboard(filters);
  const { exportReport, isExporting } = useAnalyticsActions();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredReports = selectedCategory === 'all' 
    ? reportTemplates 
    : reportTemplates.filter(report => report.category === selectedCategory);

  const handleGenerateReport = async (reportId: string, format: 'pdf' | 'excel') => {
    setGeneratingReport(reportId);
    try {
      await exportReport({ filters, format });
    } finally {
      setGeneratingReport(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return CurrencyDollarIcon;
      case 'sales': return ChartBarIcon;
      case 'inventory': return CubeIcon;
      case 'customer': return UsersIcon;
      case 'tax': return DocumentTextIcon;
      default: return DocumentChartBarIcon;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial': return 'bg-green-100 text-green-600';
      case 'sales': return 'bg-blue-100 text-blue-600';
      case 'inventory': return 'bg-purple-100 text-purple-600';
      case 'customer': return 'bg-orange-100 text-orange-600';
      case 'tax': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Financial Analysis</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate comprehensive business reports with real-time Azure backend data
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => analytics.refetchAll()}
            className="btn-secondary flex items-center"
            disabled={analytics.isLoading}
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${analytics.isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Quick Stats from Analytics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Revenue (Period)
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(analytics.sales.data?.total_revenue || 0)}
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
                <dd className="text-2xl font-semibold text-gray-900">
                  {analytics.sales.data?.total_orders || 0}
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
                  Active Customers
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {analytics.customers.data?.total_customers || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CubeIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Inventory Value
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(analytics.inventory.data?.total_value || 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
              Report Period
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
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {filters.period === 'custom' && (
            <>
              <div>
                <label htmlFor="date_from" className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  id="date_from"
                  value={filters.custom_from}
                  onChange={(e) => setFilters({...filters, custom_from: e.target.value})}
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
                  value={filters.custom_to}
                  onChange={(e) => setFilters({...filters, custom_to: e.target.value})}
                  className="input"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Report Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="select"
            >
              <option value="all">All Categories</option>
              <option value="financial">Financial</option>
              <option value="sales">Sales</option>
              <option value="inventory">Inventory</option>
              <option value="customer">Customer</option>
              <option value="tax">Tax & Compliance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => {
          const IconComponent = report.icon;
          const isGenerating = generatingReport === report.id;
          
          return (
            <div key={report.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${getCategoryColor(report.category)}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{report.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{report.frequency} • {report.category}</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {report.description}
              </p>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleGenerateReport(report.id, 'pdf')}
                  disabled={isGenerating || isExporting}
                  className="btn-primary flex-1 flex items-center justify-center text-sm py-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      PDF
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleGenerateReport(report.id, 'excel')}
                  disabled={isGenerating || isExporting}
                  className="btn-secondary flex-1 flex items-center justify-center text-sm py-2"
                >
                  <DocumentChartBarIcon className="h-4 w-4 mr-2" />
                  Excel
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Reports Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Reports
          </h3>
          <button className="text-sm text-blue-600 hover:text-blue-500">
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {[
            {
              name: 'Monthly P&L Statement',
              date: new Date().toISOString(),
              format: 'PDF',
              size: '2.4 MB',
              status: 'completed'
            },
            {
              name: 'Daily Sales Report',
              date: new Date(Date.now() - 86400000).toISOString(),
              format: 'Excel',
              size: '1.8 MB',
              status: 'completed'
            },
            {
              name: 'GST Compliance Report',
              date: new Date(Date.now() - 172800000).toISOString(),
              format: 'PDF',
              size: '3.1 MB',
              status: 'completed'
            }
          ].map((report, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <DocumentChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">{report.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(report.date).toLocaleDateString('en-IN')} • {report.format} • {report.size}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {report.status}
                </span>
                <button className="btn-secondary btn-sm">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Scheduled Reports
          </h3>
          <button className="btn-primary">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Schedule Report
          </button>
        </div>
        
        <div className="space-y-4">
          {[
            {
              name: 'Weekly Sales Summary',
              frequency: 'Every Monday 9:00 AM',
              format: 'PDF + Excel',
              recipients: 'owner@jewelryshop.com',
              nextRun: 'Monday, Dec 30, 2024'
            },
            {
              name: 'Monthly GST Report',
              frequency: '1st of every month',
              format: 'PDF',
              recipients: 'accounts@jewelryshop.com',
              nextRun: 'Wednesday, Jan 1, 2025'
            }
          ].map((schedule, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{schedule.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Active
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {schedule.frequency} • {schedule.format} • Next: {schedule.nextRun}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Send to: {schedule.recipients}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button className="btn-secondary btn-sm">
                  Edit
                </button>
                <button className="btn-secondary btn-sm text-red-600 hover:text-red-700">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}