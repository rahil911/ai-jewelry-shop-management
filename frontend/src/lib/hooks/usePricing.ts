import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingService, type GoldRates, type PriceCalculationRequest } from '@/lib/api/services/pricing';
import { toast } from 'react-hot-toast';

// Query Keys
export const pricingKeys = {
  all: ['pricing'] as const,
  goldRates: () => [...pricingKeys.all, 'gold-rates'] as const,
  goldRatesCurrent: () => [...pricingKeys.goldRates(), 'current'] as const,
  goldRatesHistory: (days: number) => [...pricingKeys.goldRates(), 'history', days] as const,
  makingCharges: () => [...pricingKeys.all, 'making-charges'] as const,
  pricingRules: () => [...pricingKeys.all, 'rules'] as const,
};

// Real-time Gold Rates Hook (connects to deployed Azure backend)
export function useCurrentGoldRates() {
  return useQuery({
    queryKey: pricingKeys.goldRatesCurrent(),
    queryFn: () => pricingService.getCurrentGoldRates(),
    staleTime: 60 * 1000, // 1 minute - refresh frequently for live rates
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useGoldRateHistory(days: number = 30) {
  return useQuery({
    queryKey: pricingKeys.goldRatesHistory(days),
    queryFn: () => pricingService.getGoldRateHistory(days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: days > 0,
  });
}

// Price Calculation Hook
export function usePriceCalculation() {
  return useMutation({
    mutationFn: (request: PriceCalculationRequest) => 
      pricingService.calculateItemPrice(request),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Price calculation failed');
    },
  });
}

// Making Charges Hooks
export function useMakingCharges() {
  return useQuery({
    queryKey: pricingKeys.makingCharges(),
    queryFn: () => pricingService.getMakingCharges(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateMakingCharges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ category, data }: { category: string; data: any }) =>
      pricingService.updateMakingCharges(category, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.makingCharges() });
      toast.success('Making charges updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update making charges');
    },
  });
}

// Pricing Rules Hooks
export function usePricingRules() {
  return useQuery({
    queryKey: pricingKeys.pricingRules(),
    queryFn: () => pricingService.getPricingRules(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Helper Hooks for UI Components
export function useGoldRateDisplay() {
  const { data: goldRates, isLoading, error } = useCurrentGoldRates();

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rate);
  };

  const getRateChange = (currentRate: number, previousRate: number) => {
    const change = currentRate - previousRate;
    const changePercent = (change / previousRate) * 100;
    return {
      amount: change,
      percentage: changePercent,
      isPositive: change >= 0,
    };
  };

  return {
    goldRates,
    isLoading,
    error,
    formatRate,
    getRateChange,
  };
}

export function usePriceCalculator() {
  const { mutate: calculatePrice, data: calculation, isPending, error } = usePriceCalculation();
  const { data: goldRates } = useCurrentGoldRates();
  const { data: makingCharges } = useMakingCharges();

  const calculate = (request: PriceCalculationRequest) => {
    if (!goldRates) {
      toast.error('Gold rates not available. Please try again.');
      return;
    }
    calculatePrice(request);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return {
    calculate,
    calculation,
    isCalculating: isPending,
    error,
    goldRates,
    makingCharges,
    formatPrice,
  };
}