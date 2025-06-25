import { apiClient } from '../client';

// Inventory Types
export interface JewelryItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  metal_type: string;
  purity: string;
  weight: number;
  making_charges: number;
  wastage_percentage: number;
  base_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_level: number;
  description: string;
  images: string[];
  barcode?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryStats {
  total_items: number;
  total_value: number;
  low_stock_count: number;
  categories: {
    [key: string]: {
      count: number;
      value: number;
    };
  };
  metal_breakdown: {
    [key: string]: {
      weight: number;
      value: number;
      count: number;
    };
  };
}

export interface StockMovement {
  id: number;
  item_id: number;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  reference_number?: string;
  user_id: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  parent_id?: number;
  making_charge_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetalType {
  id: number;
  name: string;
  symbol: string;
  current_rate: number;
  rate_source: string;
  is_active: boolean;
  updated_at: string;
}

export interface Purity {
  id: number;
  metal_type_id: number;
  purity_name: string;
  purity_percentage: number;
  making_charge_rate: number;
  is_active: boolean;
}

export interface InventoryFilters {
  category?: string;
  metal_type?: string;
  purity?: string;
  location?: string;
  low_stock?: boolean;
  search?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
  sort_by?: 'name' | 'price' | 'stock' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface BulkUpdateRequest {
  item_ids: number[];
  updates: Partial<Pick<JewelryItem, 'making_charges' | 'wastage_percentage' | 'location' | 'min_stock_level'>>;
}

class InventoryService {
  private get baseUrl() {
    return '/api/inventory';
  }

  // Jewelry Items Management
  async getItems(filters?: InventoryFilters): Promise<{
    items: JewelryItem[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    return apiClient.get(`${this.baseUrl}/items`, { params: filters });
  }

  async getItem(id: number): Promise<JewelryItem> {
    return apiClient.get<JewelryItem>(`${this.baseUrl}/items/${id}`);
  }

  async createItem(item: Omit<JewelryItem, 'id' | 'created_at' | 'updated_at'>): Promise<JewelryItem> {
    return apiClient.post<JewelryItem>(`${this.baseUrl}/items`, item);
  }

  async updateItem(id: number, updates: Partial<JewelryItem>): Promise<JewelryItem> {
    return apiClient.put<JewelryItem>(`${this.baseUrl}/items/${id}`, updates);
  }

  async deleteItem(id: number): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/items/${id}`);
  }

  async bulkUpdateItems(request: BulkUpdateRequest): Promise<{ updated_count: number }> {
    return apiClient.patch(`${this.baseUrl}/items/bulk-update`, request);
  }

  // Stock Management
  async updateStock(id: number, quantity: number, reason: string): Promise<JewelryItem> {
    return apiClient.put<JewelryItem>(`${this.baseUrl}/items/${id}/stock`, {
      quantity,
      reason
    });
  }

  async adjustStock(adjustments: Array<{
    item_id: number;
    quantity_change: number;
    reason: string;
  }>): Promise<{ success_count: number; failed_count: number }> {
    return apiClient.post(`${this.baseUrl}/stock/adjustment`, { adjustments });
  }

  async getStockMovements(params?: {
    item_id?: number;
    movement_type?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    movements: StockMovement[];
    total: number;
    page: number;
    limit: number;
  }> {
    return apiClient.get(`${this.baseUrl}/stock/movements`, { params });
  }

  // Inventory Analytics - Use the actual Azure backend analytics endpoint
  async getInventoryStats(): Promise<InventoryStats> {
    try {
      // Use the real analytics endpoint
      const response = await apiClient.get<{
        success: boolean;
        data: {
          total_items: number;
          total_value: number;
          low_stock_items: number;
          categories: Record<string, number>;
        };
      }>('/api/analytics/inventory');
      
      if (response.success && response.data) {
        const data = response.data;
        return {
          total_items: data.total_items,
          total_value: data.total_value,
          low_stock_count: data.low_stock_items,
          categories: Object.entries(data.categories || {}).reduce((acc, [key, count]) => ({
            ...acc,
            [key]: { count, value: 0 }
          }), {} as { [key: string]: { count: number; value: number; } }),
          metal_breakdown: {} // Analytics doesn't provide this, calculate if needed
        };
      }
      
      // Fallback to calculating from items if analytics fails
      return this.calculateStatsFromItems();
    } catch (error) {
      console.warn('Analytics endpoint failed, calculating from items:', error);
      return this.calculateStatsFromItems();
    }
  }

  private async calculateStatsFromItems(): Promise<InventoryStats> {
    try {
      const itemsResponse = await this.getItems({ limit: 1000 });
      const items = itemsResponse.items;
      
      const categories: { [key: string]: { count: number; value: number } } = {};
      const metalBreakdown: { [key: string]: { weight: number; value: number; count: number } } = {};
      
      let totalValue = 0;
      let lowStockCount = 0;
      
      items.forEach(item => {
        const sellingPrice = item.selling_price || item.base_price * 1.15;
        
        // Category stats
        if (!categories[item.category]) {
          categories[item.category] = { count: 0, value: 0 };
        }
        categories[item.category].count++;
        categories[item.category].value += sellingPrice * item.stock_quantity;
        
        // Metal breakdown
        const metalKey = `${item.metal_type}-${item.purity}`;
        if (!metalBreakdown[metalKey]) {
          metalBreakdown[metalKey] = { weight: 0, value: 0, count: 0 };
        }
        metalBreakdown[metalKey].weight += item.weight;
        metalBreakdown[metalKey].value += sellingPrice * item.stock_quantity;
        metalBreakdown[metalKey].count++;
        
        // Total value and low stock
        totalValue += sellingPrice * item.stock_quantity;
        if (item.stock_quantity <= (item.min_stock_level || 2)) {
          lowStockCount++;
        }
      });
      
      return {
        total_items: items.length,
        total_value: totalValue,
        low_stock_count: lowStockCount,
        categories,
        metal_breakdown: metalBreakdown
      };
    } catch (error) {
      console.warn('Failed to calculate inventory stats:', error);
      return {
        total_items: 0,
        total_value: 0,
        low_stock_count: 0,
        categories: {},
        metal_breakdown: {}
      };
    }
  }

  async getValuation(params?: {
    category?: string;
    location?: string;
    as_of_date?: string;
  }): Promise<{
    total_value: number;
    breakdown: {
      category: string;
      value: number;
      count: number;
    }[];
    valuation_date: string;
  }> {
    return apiClient.get(`${this.baseUrl}/valuation`, { params });
  }

  async getLowStockItems(threshold?: number): Promise<JewelryItem[]> {
    try {
      // Get all items and filter for low stock since backend doesn't have /low-stock endpoint
      const itemsResponse = await this.getItems({ limit: 1000 });
      const items = itemsResponse.items;
      
      return items.filter(item => {
        const stockThreshold = threshold || item.min_stock_level;
        return item.stock_quantity <= stockThreshold;
      });
    } catch (error) {
      console.warn('Failed to get low stock items, using fallback:', error);
      return [];
    }
  }

  // Search and Filtering
  async searchItems(query: string, filters?: Partial<InventoryFilters>): Promise<JewelryItem[]> {
    return apiClient.get<JewelryItem[]>(`${this.baseUrl}/search`, {
      params: { q: query, ...filters }
    });
  }

  async getItemsBySKU(skus: string[]): Promise<JewelryItem[]> {
    return apiClient.post<JewelryItem[]>(`${this.baseUrl}/items/by-sku`, { skus });
  }

  async getItemsByBarcode(barcode: string): Promise<JewelryItem | null> {
    try {
      return await apiClient.get<JewelryItem>(`${this.baseUrl}/items/barcode/${barcode}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Categories Management
  async getCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>(`${this.baseUrl}/categories`);
  }

  async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    return apiClient.post<Category>(`${this.baseUrl}/categories`, category);
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category> {
    return apiClient.put<Category>(`${this.baseUrl}/categories/${id}`, updates);
  }

  async deleteCategory(id: number): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/categories/${id}`);
  }

  // Metal Types and Purities
  async getMetalTypes(): Promise<MetalType[]> {
    return apiClient.get<MetalType[]>(`${this.baseUrl}/metal-types`);
  }

  async getPurities(metalTypeId?: number): Promise<Purity[]> {
    return apiClient.get<Purity[]>(`${this.baseUrl}/purities`, {
      params: metalTypeId ? { metal_type_id: metalTypeId } : undefined
    });
  }

  // Barcode Generation
  async generateBarcode(itemId: number): Promise<{ barcode: string; barcode_image_url: string }> {
    return apiClient.post(`${this.baseUrl}/barcode/generate`, { item_id: itemId });
  }

  async generateBulkBarcodes(itemIds: number[]): Promise<Array<{
    item_id: number;
    barcode: string;
    barcode_image_url: string;
  }>> {
    return apiClient.post(`${this.baseUrl}/barcode/bulk-generate`, { item_ids: itemIds });
  }

  // Import/Export
  async importItems(file: File, options?: {
    update_existing?: boolean;
    category_mapping?: Record<string, string>;
  }): Promise<{
    imported_count: number;
    updated_count: number;
    failed_count: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    return apiClient.post(`${this.baseUrl}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  async exportItems(filters?: InventoryFilters, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/export`, {
      params: { ...filters, format },
      responseType: 'blob'
    });
    return response as unknown as Blob;
  }

  // Utility Methods
  calculateItemValue(item: JewelryItem, goldRates: Record<string, number> | { [key: string]: any }): number {
    // Handle GoldRates type from pricing service
    const rateValue = typeof goldRates[item.purity] === 'number' 
      ? goldRates[item.purity] 
      : (goldRates as any)[item.purity];
    const goldRate = typeof rateValue === 'number' ? rateValue : 0;
    
    const goldValue = item.weight * goldRate;
    const makingCharges = goldValue * (item.making_charges / 100);
    const wastage = goldValue * (item.wastage_percentage / 100);
    return goldValue + makingCharges + wastage;
  }

  formatWeight(weight: number): string {
    return `${weight.toFixed(2)}g`;
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  getStockStatus(item: JewelryItem): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (item.stock_quantity === 0) return 'out_of_stock';
    if (item.stock_quantity <= item.min_stock_level) return 'low_stock';
    return 'in_stock';
  }

  generateSKU(category: string, metalType: string, purity: string): string {
    const categoryCode = category.substring(0, 2).toUpperCase();
    const metalCode = metalType.substring(0, 2).toUpperCase();
    const purityCode = purity.replace('K', '');
    const timestamp = Date.now().toString().slice(-4);
    return `${categoryCode}${metalCode}${purityCode}-${timestamp}`;
  }
}

export const inventoryService = new InventoryService();