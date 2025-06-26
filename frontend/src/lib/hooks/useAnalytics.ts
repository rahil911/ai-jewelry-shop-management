'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  analyticsService, 
  SalesAnalytics, 
  CustomerAnalytics, 
  InventoryAnalytics, 
  ProfitAnalytics, 
  BusinessInsights,
  AnalyticsFilters 
} from '../api/services/analytics';
import { toast } from 'react-hot-toast';

// Real-time analytics hooks with aggressive refresh for live dashboard

// Sales analytics with 2-minute refresh for live updates
export const useSalesAnalytics = (filters?: AnalyticsFilters) => {
  return useQuery({
    queryKey: ['salesAnalytics', filters],
    queryFn: () => analyticsService.getSalesAnalytics(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 2, // Auto-refresh every 2 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Customer analytics with 5-minute refresh
export const useCustomerAnalytics = (filters?: AnalyticsFilters) => {
  return useQuery({
    queryKey: ['customerAnalytics', filters],
    queryFn: () => analyticsService.getCustomerAnalytics(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
    retry: 2,
  });
};

// Inventory analytics with 3-minute refresh for real-time stock monitoring
export const useInventoryAnalytics = (filters?: AnalyticsFilters) => {
  return useQuery({
    queryKey: ['inventoryAnalytics', filters],
    queryFn: () => analyticsService.getInventoryAnalytics(filters),
    staleTime: 1000 * 60 * 3, // 3 minutes
    refetchInterval: 1000 * 60 * 3, // Auto-refresh every 3 minutes
    retry: 2,
  });
};

// Profit analytics with 10-minute refresh
export const useProfitAnalytics = (filters?: AnalyticsFilters) => {
  return useQuery({
    queryKey: ['profitAnalytics', filters],
    queryFn: () => analyticsService.getProfitAnalytics(filters),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60 * 10, // Auto-refresh every 10 minutes
    retry: 2,
  });
};

// Business insights with 5-minute refresh
export const useBusinessInsights = (filters?: AnalyticsFilters) => {
  return useQuery({
    queryKey: ['businessInsights', filters],
    queryFn: () => analyticsService.getBusinessInsights(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
    retry: 2,
  });
};

// Real-time dashboard data with 30-second refresh for live updates
export const useRealTimeDashboard = () => {
  return useQuery({
    queryKey: ['realTimeDashboard'],
    queryFn: () => analyticsService.getRealTimeDashboard(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
    retry: 3,
    retryDelay: 1000, // Quick retry for real-time data
  });
};

// Live gold rates with very frequent updates (every 30 seconds during business hours)
export const useLiveGoldRates = () => {
  const currentHour = new Date().getHours();
  const isBusinessHours = currentHour >= 9 && currentHour <= 18; // 9 AM to 6 PM
  
  return useQuery({
    queryKey: ['liveGoldRates'],
    queryFn: () => analyticsService.getLiveGoldRates(),
    staleTime: isBusinessHours ? 1000 * 30 : 1000 * 60 * 10, // 30 seconds during business hours, 10 minutes otherwise
    refetchInterval: isBusinessHours ? 1000 * 30 : 1000 * 60 * 10,
    retry: 3,
  });
};

// Combined analytics hook for dashboard overview
export const useAnalyticsDashboard = (filters?: AnalyticsFilters) => {
  const salesQuery = useSalesAnalytics(filters);
  const customerQuery = useCustomerAnalytics(filters);
  const inventoryQuery = useInventoryAnalytics(filters);
  const insightsQuery = useBusinessInsights(filters);
  const realTimeQuery = useRealTimeDashboard();
  const goldRatesQuery = useLiveGoldRates();

  return {
    sales: salesQuery,
    customers: customerQuery,
    inventory: inventoryQuery,
    insights: insightsQuery,
    realTime: realTimeQuery,
    goldRates: goldRatesQuery,
    isLoading: salesQuery.isLoading || customerQuery.isLoading || inventoryQuery.isLoading,
    isError: salesQuery.isError || customerQuery.isError || inventoryQuery.isError,
    refetchAll: () => {
      salesQuery.refetch();
      customerQuery.refetch();
      inventoryQuery.refetch();
      insightsQuery.refetch();
      realTimeQuery.refetch();
      goldRatesQuery.refetch();
    }
  };
};

// Export analytics report
export const useExportAnalytics = () => {
  return useMutation({
    mutationFn: ({ filters, format }: { filters: AnalyticsFilters; format: 'pdf' | 'excel' }) =>
      analyticsService.exportReport(filters, format),
    onSuccess: (blob, { format }) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Analytics report downloaded successfully!`);
    },
    onError: (error: any) => {
      console.error('Failed to export analytics:', error);
      toast.error('Failed to export analytics report');
    },
  });
};

// Analytics utility hooks
export const useAnalyticsActions = () => {
  const queryClient = useQueryClient();
  const exportMutation = useExportAnalytics();

  return {
    refreshAll: () => {
      queryClient.invalidateQueries({ queryKey: ['salesAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['customerAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['profitAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['businessInsights'] });
      queryClient.invalidateQueries({ queryKey: ['realTimeDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['liveGoldRates'] });
    },
    exportReport: exportMutation.mutate,
    isExporting: exportMutation.isPending,
  };
};

// Real-time updates hook for critical metrics
export const useRealTimeMetrics = () => {
  const dashboardQuery = useRealTimeDashboard();
  const goldRatesQuery = useLiveGoldRates();

  // Return formatted metrics for real-time display
  return {
    metrics: {
      goldRate: goldRatesQuery.data?.rates?.['22K'] || 0,
      goldChange: goldRatesQuery.data?.changes?.['22K'] || 0,
      todaySales: dashboardQuery.data?.todaySales || 0,
      todayOrders: dashboardQuery.data?.todayOrders || 0,
      pendingOrders: dashboardQuery.data?.pendingOrders || 0,
      lowStockItems: dashboardQuery.data?.lowStockItems || 0,
      inventoryValue: dashboardQuery.data?.inventoryValue || 0,
      revenueGrowth: dashboardQuery.data?.revenueGrowth || 0,
    },
    lastUpdated: dashboardQuery.data?.lastUpdated || new Date().toISOString(),
    isLoading: dashboardQuery.isLoading || goldRatesQuery.isLoading,
    isError: dashboardQuery.isError || goldRatesQuery.isError,
    refetch: () => {
      dashboardQuery.refetch();
      goldRatesQuery.refetch();
    }
  };
};