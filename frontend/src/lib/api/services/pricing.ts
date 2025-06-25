import { apiClient } from '../client';

// Pricing Types
export interface GoldRates {
  '22K': number;
  '18K': number;
  '14K': number;
  last_updated: string;
  rate_source: string;
}

export interface GoldRateHistory {
  date: string;
  '22K': number;
  '18K': number;
  '14K': number;
  rate_source: string;
}

export interface PriceCalculationRequest {
  weight: number;
  purity: '22K' | '18K' | '14K';
  making_charge_percentage?: number;
  wastage_percentage?: number;
  category?: string;
  location?: string;
}

export interface PriceCalculationResponse {
  weight: number;
  purity: string;
  gold_rate: number;
  gold_value: number;
  making_charges: number;
  wastage_amount: number;
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  total_price: number;
  breakdown: {
    gold_cost: number;
    making_charges: number;
    wastage: number;
    gst: number;
  };
  calculation_details: {
    base_rate: number;
    effective_rate: number;
    making_charge_rate: number;
    wastage_rate: number;
    gst_rate: number;
  };
}

export interface MakingCharges {
  id: number;
  category: string;
  purity: string;
  charge_type: 'percentage' | 'fixed_per_gram';
  rate_value: number;
  location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: number;
  rule_name: string;
  conditions: Record<string, any>;
  discount_percentage: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  applies_to: string;
}

export interface GSTRates {
  jewelry: number;
  gold: number;
  silver: number;
  diamond: number;
  making_charges: number;
}

class PricingService {
  private get baseUrl() {
    return '/api';
  }

  // Gold Rates Management
  async getCurrentGoldRates(): Promise<GoldRates> {
    return apiClient.get<GoldRates>(`${this.baseUrl}/gold-rates/current`);
  }

  async getGoldRateHistory(days: number = 30): Promise<GoldRateHistory[]> {
    return apiClient.get<GoldRateHistory[]>(`${this.baseUrl}/gold-rates/history`, {
      params: { days }
    });
  }

  async updateGoldRates(rates: Partial<GoldRates>): Promise<GoldRates> {
    return apiClient.post<GoldRates>(`${this.baseUrl}/gold-rates/update`, rates);
  }

  // Price Calculation
  async calculateItemPrice(request: PriceCalculationRequest): Promise<PriceCalculationResponse> {
    return apiClient.post<PriceCalculationResponse>(`${this.baseUrl}/pricing/calculate-item-price`, request);
  }

  async calculateBulkPricing(items: PriceCalculationRequest[]): Promise<PriceCalculationResponse[]> {
    return apiClient.post<PriceCalculationResponse[]>(`${this.baseUrl}/pricing/calculate-bulk`, { items });
  }

  // Making Charges Management
  async getMakingCharges(params?: {
    category?: string;
    purity?: string;
    location?: string;
  }): Promise<MakingCharges[]> {
    return apiClient.get<MakingCharges[]>(`${this.baseUrl}/making-charges`, { params });
  }

  async updateMakingCharges(category: string, data: Partial<MakingCharges>): Promise<MakingCharges> {
    return apiClient.put<MakingCharges>(`${this.baseUrl}/making-charges/${category}`, data);
  }

  async createMakingCharge(data: Omit<MakingCharges, 'id' | 'created_at' | 'updated_at'>): Promise<MakingCharges> {
    return apiClient.post<MakingCharges>(`${this.baseUrl}/making-charges`, data);
  }

  async deleteMakingCharge(id: number): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/making-charges/${id}`);
  }

  // Pricing Rules
  async getPricingRules(params?: {
    active?: boolean;
    applies_to?: string;
  }): Promise<PricingRule[]> {
    return apiClient.get<PricingRule[]>(`${this.baseUrl}/pricing/rules`, { params });
  }

  async createPricingRule(rule: Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>): Promise<PricingRule> {
    return apiClient.post<PricingRule>(`${this.baseUrl}/pricing/rules`, rule);
  }

  async updatePricingRule(id: number, data: Partial<PricingRule>): Promise<PricingRule> {
    return apiClient.put<PricingRule>(`${this.baseUrl}/pricing/rules/${id}`, data);
  }

  async deletePricingRule(id: number): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/pricing/rules/${id}`);
  }

  // GST Management
  async getGSTRates(): Promise<GSTRates> {
    return apiClient.get<GSTRates>(`${this.baseUrl}/pricing/gst-rates`);
  }

  async updateGSTRates(rates: Partial<GSTRates>): Promise<GSTRates> {
    return apiClient.put<GSTRates>(`${this.baseUrl}/pricing/gst-rates`, rates);
  }

  // Price History & Analytics
  async getPriceHistory(params: {
    item_id?: number;
    category?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Array<{
    date: string;
    item_id: number;
    price: number;
    gold_rate: number;
    making_charge_rate: number;
  }>> {
    return apiClient.get(`${this.baseUrl}/pricing/history`, { params });
  }

  async getPricingAnalytics(period: 'day' | 'week' | 'month' | 'year'): Promise<{
    average_gold_rate: number;
    price_volatility: number;
    most_volatile_period: string;
    trend: 'up' | 'down' | 'stable';
    recommendations: string[];
  }> {
    return apiClient.get(`${this.baseUrl}/pricing/analytics`, { params: { period } });
  }

  // Utility methods
  formatPrice(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  calculatePriceChange(currentPrice: number, previousPrice: number): {
    amount: number;
    percentage: number;
    direction: 'up' | 'down' | 'same';
  } {
    const difference = currentPrice - previousPrice;
    const percentage = previousPrice > 0 ? (difference / previousPrice) * 100 : 0;
    
    return {
      amount: Math.abs(difference),
      percentage: Math.abs(percentage),
      direction: difference > 0 ? 'up' : difference < 0 ? 'down' : 'same'
    };
  }

  getPurityMultiplier(purity: string): number {
    const multipliers: Record<string, number> = {
      '24K': 1.0,
      '22K': 0.9167,
      '18K': 0.75,
      '14K': 0.5833,
      '10K': 0.4167
    };
    return multipliers[purity] || 0.9167; // Default to 22K
  }
}

export const pricingService = new PricingService();