import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  inventoryService, 
  type JewelryItem, 
  type InventoryStats, 
  type InventoryFilters,
  type StockMovement,
  type Category,
  type MetalType,
  type Purity
} from '@/lib/api/services/inventory';
import { useCurrentGoldRates } from './usePricing';
import { toast } from 'react-hot-toast';

// Query Keys
export const inventoryKeys = {
  all: ['inventory'] as const,
  items: () => [...inventoryKeys.all, 'items'] as const,
  itemsList: (filters?: Partial<InventoryFilters>) => [...inventoryKeys.items(), filters] as const,
  item: (id: number) => [...inventoryKeys.items(), id] as const,
  stats: () => [...inventoryKeys.all, 'stats'] as const,
  lowStock: (threshold?: number) => [...inventoryKeys.all, 'low-stock', threshold] as const,
  stockMovements: (params?: any) => [...inventoryKeys.all, 'stock-movements', params] as const,
  categories: () => [...inventoryKeys.all, 'categories'] as const,
  metalTypes: () => [...inventoryKeys.all, 'metal-types'] as const,
  purities: (metalTypeId?: number) => [...inventoryKeys.all, 'purities', metalTypeId] as const,
  valuation: (params?: any) => [...inventoryKeys.all, 'valuation', params] as const,
  search: (query: string, filters?: Partial<InventoryFilters>) => [...inventoryKeys.all, 'search', query, filters] as const,
};

// Items Management Hooks
export function useInventoryItems(filters?: Partial<InventoryFilters>) {
  const { data: goldRates } = useCurrentGoldRates();
  
  const query = useQuery({
    queryKey: inventoryKeys.itemsList(filters),
    queryFn: () => inventoryService.getItems(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  // Enhance items with real-time values
  const enhancedItems = query.data?.items?.map(item => ({
    ...item,
    calculated_value: goldRates ? inventoryService.calculateItemValue(item, goldRates) : undefined,
    stock_status: inventoryService.getStockStatus(item),
  }));

  return {
    ...query,
    data: query.data ? {
      ...query.data,
      items: enhancedItems || []
    } : undefined,
  };
}

export function useInventoryItem(id: number) {
  const { data: goldRates } = useCurrentGoldRates();
  
  const query = useQuery({
    queryKey: inventoryKeys.item(id),
    queryFn: () => inventoryService.getItem(id),
    enabled: id > 0,
    staleTime: 2 * 60 * 1000,
  });

  // Enhance item with real-time value
  const enhancedItem = query.data ? {
    ...query.data,
    calculated_value: goldRates ? inventoryService.calculateItemValue(query.data, goldRates) : undefined,
    stock_status: inventoryService.getStockStatus(query.data),
  } : undefined;

  return {
    ...query,
    data: enhancedItem,
  };
}

export function useInventoryStats() {
  return useQuery({
    queryKey: inventoryKeys.stats(),
    queryFn: () => inventoryService.getInventoryStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Auto-refresh every 10 minutes
  });
}

export function useLowStockItems(threshold?: number) {
  return useQuery({
    queryKey: inventoryKeys.lowStock(threshold),
    queryFn: () => inventoryService.getLowStockItems(threshold),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useStockMovements(params?: any) {
  return useQuery({
    queryKey: inventoryKeys.stockMovements(params),
    queryFn: () => inventoryService.getStockMovements(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useInventoryValuation(params?: any) {
  return useQuery({
    queryKey: inventoryKeys.valuation(params),
    queryFn: () => inventoryService.getValuation(params),
    staleTime: 5 * 60 * 1000,
  });
}

// Search Hooks
export function useInventorySearch(query: string, filters?: Partial<InventoryFilters>) {
  const { data: goldRates } = useCurrentGoldRates();
  
  const searchQuery = useQuery({
    queryKey: inventoryKeys.search(query, filters),
    queryFn: () => inventoryService.searchItems(query, filters),
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Enhance search results with real-time values
  const enhancedResults = searchQuery.data?.map(item => ({
    ...item,
    calculated_value: goldRates ? inventoryService.calculateItemValue(item, goldRates) : undefined,
    stock_status: inventoryService.getStockStatus(item),
  }));

  return {
    ...searchQuery,
    data: enhancedResults,
  };
}

export function useBarcodeSearch() {
  const { data: goldRates } = useCurrentGoldRates();
  
  return useMutation({
    mutationFn: (barcode: string) => inventoryService.getItemsByBarcode(barcode),
    onSuccess: (item) => {
      if (item) {
        toast.success('Item found!');
      } else {
        toast.error('No item found with this barcode');
      }
    },
    onError: () => {
      toast.error('Error scanning barcode');
    },
  });
}

// Categories, Metal Types, and Purities
export function useCategories() {
  return useQuery({
    queryKey: inventoryKeys.categories(),
    queryFn: () => inventoryService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useMetalTypes() {
  return useQuery({
    queryKey: inventoryKeys.metalTypes(),
    queryFn: () => inventoryService.getMetalTypes(),
    staleTime: 10 * 60 * 1000,
  });
}

export function usePurities(metalTypeId?: number) {
  return useQuery({
    queryKey: inventoryKeys.purities(metalTypeId),
    queryFn: () => inventoryService.getPurities(metalTypeId),
    staleTime: 10 * 60 * 1000,
  });
}

// Mutation Hooks
export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: Omit<JewelryItem, 'id' | 'created_at' | 'updated_at'>) =>
      inventoryService.createItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success('Item created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create item');
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<JewelryItem> }) =>
      inventoryService.updateItem(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.setQueryData(inventoryKeys.item(data.id), data);
      toast.success('Item updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update item');
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inventoryService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success('Item deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quantity, reason }: { id: number; quantity: number; reason: string }) =>
      inventoryService.updateStock(id, quantity, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success('Stock updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    },
  });
}

export function useBulkUpdateItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: { item_ids: number[]; updates: any }) =>
      inventoryService.bulkUpdateItems(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success(`${data.updated_count} items updated successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update items');
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adjustments: Array<{ item_id: number; quantity_change: number; reason: string }>) =>
      inventoryService.adjustStock(adjustments),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success(`${data.success_count} items adjusted successfully${data.failed_count > 0 ? `, ${data.failed_count} failed` : ''}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to adjust stock');
    },
  });
}

// Barcode Generation
export function useGenerateBarcode() {
  return useMutation({
    mutationFn: (itemId: number) => inventoryService.generateBarcode(itemId),
    onSuccess: () => {
      toast.success('Barcode generated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate barcode');
    },
  });
}

export function useGenerateBulkBarcodes() {
  return useMutation({
    mutationFn: (itemIds: number[]) => inventoryService.generateBulkBarcodes(itemIds),
    onSuccess: (data) => {
      toast.success(`${data.length} barcodes generated successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate barcodes');
    },
  });
}

// Category Management
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) =>
      inventoryService.createCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
      toast.success('Category created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create category');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Category> }) =>
      inventoryService.updateCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
      toast.success('Category updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update category');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inventoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    },
  });
}

// Import/Export
export function useImportItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, options }: { file: File; options?: any }) =>
      inventoryService.importItems(file, options),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success(`Import completed: ${data.imported_count} imported, ${data.updated_count} updated${data.failed_count > 0 ? `, ${data.failed_count} failed` : ''}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Import failed');
    },
  });
}

export function useExportItems() {
  return useMutation({
    mutationFn: ({ filters, format }: { filters?: InventoryFilters; format?: 'csv' | 'xlsx' }) =>
      inventoryService.exportItems(filters, format),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-export.${variables.format || 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export completed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Export failed');
    },
  });
}

// Utility Hooks
export function useInventoryUtilities() {
  return {
    calculateItemValue: inventoryService.calculateItemValue,
    formatWeight: inventoryService.formatWeight,
    formatPrice: inventoryService.formatPrice,
    getStockStatus: inventoryService.getStockStatus,
    generateSKU: inventoryService.generateSKU,
  };
}