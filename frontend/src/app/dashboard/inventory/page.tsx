'use client';

import { useEffect, useState } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  QrCodeIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService, type JewelryItem, type InventoryStats, type InventoryFilters as ApiInventoryFilters } from '@/lib/api/services/inventory';
import { useCurrentGoldRates } from '@/lib/hooks/usePricing';
import { toast } from 'react-hot-toast';
import AddItemModal from '@/components/inventory/AddItemModal';

// Extending the API type for local UI state
interface LocalJewelryItem extends JewelryItem {
  calculated_value?: number;
}

interface InventoryFilters {
  search: string;
  category: string;
  metal_type: string;
  purity: string;
  stock_status: string;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: goldRates } = useCurrentGoldRates();
  
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    category: '',
    metal_type: '',
    purity: '',
    stock_status: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LocalJewelryItem | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Convert UI filters to API filters
  const apiFilters: Partial<ApiInventoryFilters> = {
    search: filters.search || undefined,
    category: filters.category || undefined,
    metal_type: filters.metal_type || undefined,
    purity: filters.purity || undefined,
    low_stock: filters.stock_status === 'low' ? true : undefined,
    page,
    limit,
    sort_by: 'created_at',
    sort_order: 'desc'
  };

  // Real-time inventory data from Azure backend
  const { data: inventoryData, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory', 'items', apiFilters],
    queryFn: () => inventoryService.getItems(apiFilters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  // Inventory statistics
  const { data: inventoryStats, isLoading: statsLoading } = useQuery({
    queryKey: ['inventory', 'stats'],
    queryFn: () => inventoryService.getInventoryStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get low stock items for alerts
  const { data: lowStockItems } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryService.getLowStockItems(),
    staleTime: 2 * 60 * 1000,
  });

  // Mutations for inventory operations
  const updateStockMutation = useMutation({
    mutationFn: ({ id, quantity, reason }: { id: number; quantity: number; reason: string }) =>
      inventoryService.updateStock(id, quantity, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Stock updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => inventoryService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    },
  });

  // Calculate real-time item values using live gold rates
  const enhanceItemsWithValues = (items: JewelryItem[]): LocalJewelryItem[] => {
    if (!goldRates || !items) return items;
    
    return items.map(item => ({
      ...item,
      calculated_value: inventoryService.calculateItemValue(item, goldRates)
    }));
  };

  const items = enhanceItemsWithValues(inventoryData?.items || []);
  const totalPages = inventoryData?.total_pages || 1;

  // Handle barcode scanning
  const handleBarcodeSearch = async (barcode: string) => {
    try {
      const item = await inventoryService.getItemsByBarcode(barcode);
      if (item) {
        setSelectedItem({ ...item, calculated_value: inventoryService.calculateItemValue(item, goldRates || {}) });
        toast.success('Item found!');
      } else {
        toast.error('No item found with this barcode');
      }
    } catch (error: any) {
      toast.error('Error scanning barcode');
    }
  };

  const handleDeleteItem = (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItemMutation.mutate(id);
    }
  };

  const handleQuickStockUpdate = (item: LocalJewelryItem, newQuantity: number) => {
    updateStockMutation.mutate({
      id: item.id,
      quantity: newQuantity,
      reason: 'Quick adjustment from inventory page'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatusColor = (item: LocalJewelryItem) => {
    if (item.stock_quantity === 0) return 'text-red-600 bg-red-100';
    if (item.stock_quantity <= item.min_stock_level) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStockStatusText = (item: LocalJewelryItem) => {
    if (item.stock_quantity === 0) return 'Out of Stock';
    if (item.stock_quantity <= item.min_stock_level) return 'Low Stock';
    return 'In Stock';
  };

  if (isLoading || statsLoading) {
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
        <div className="card">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="skeleton h-16 w-16 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32"></div>
                  <div className="skeleton h-4 w-24"></div>
                  <div className="skeleton h-4 w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your jewelry inventory, track stock levels, and monitor valuations
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Item
          </button>
          <button 
            onClick={() => {
              const barcode = prompt('Enter barcode:');
              if (barcode) handleBarcodeSearch(barcode);
            }}
            className="btn-secondary flex items-center"
          >
            <QrCodeIcon className="h-5 w-5 mr-2" />
            Scan Barcode
          </button>
          <button 
            onClick={() => refetch()}
            disabled={isLoading}
            className="btn-outline flex items-center"
          >
            <ChartBarIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Live Connection Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Live Inventory Data from Azure Backend
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>Real-time stock levels and valuations • Auto-refresh every 5 minutes • {inventoryData?.total || 0} items loaded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Inventory Stats from Azure Backend */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CubeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Total Items</div>
              <div className="text-2xl font-bold text-gray-900">
                {inventoryStats?.total_items || inventoryData?.total || 0}
              </div>
              <div className="text-xs text-gray-500">Live from Azure</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Total Value</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(inventoryStats?.total_value || 0)}
              </div>
              <div className="text-xs text-gray-500">Real-time rates</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Low Stock Items</div>
              <div className="text-2xl font-bold text-gray-900">
                {inventoryStats?.low_stock_count || lowStockItems?.length || 0}
              </div>
              <div className="text-xs text-gray-500">Needs attention</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FunnelIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Categories</div>
              <div className="text-2xl font-bold text-gray-900">
                {inventoryStats?.categories ? Object.keys(inventoryStats.categories).length : 0}
              </div>
              <div className="text-xs text-gray-500">Active categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
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
                className="input pl-10"
                placeholder="Search items..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="select"
            >
              <option value="">All Categories</option>
              <option value="Necklaces">Necklaces</option>
              <option value="Earrings">Earrings</option>
              <option value="Rings">Rings</option>
              <option value="Bracelets">Bracelets</option>
              <option value="Bangles">Bangles</option>
            </select>
          </div>

          <div>
            <label htmlFor="metal_type" className="block text-sm font-medium text-gray-700 mb-2">
              Metal Type
            </label>
            <select
              id="metal_type"
              value={filters.metal_type}
              onChange={(e) => setFilters({...filters, metal_type: e.target.value})}
              className="select"
            >
              <option value="">All Metals</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Platinum">Platinum</option>
            </select>
          </div>

          <div>
            <label htmlFor="purity" className="block text-sm font-medium text-gray-700 mb-2">
              Purity
            </label>
            <select
              id="purity"
              value={filters.purity}
              onChange={(e) => setFilters({...filters, purity: e.target.value})}
              className="select"
            >
              <option value="">All Purities</option>
              <option value="22K">22K</option>
              <option value="18K">18K</option>
              <option value="14K">14K</option>
              <option value="925">925 Silver</option>
              <option value="950">950 Platinum</option>
            </select>
          </div>

          <div>
            <label htmlFor="stock_status" className="block text-sm font-medium text-gray-700 mb-2">
              Stock Status
            </label>
            <select
              id="stock_status"
              value={filters.stock_status}
              onChange={(e) => setFilters({...filters, stock_status: e.target.value})}
              className="select"
            >
              <option value="">All Stock</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({search: '', category: '', metal_type: '', purity: '', stock_status: ''})}
              className="btn-outline w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specifications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16">
                        <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                          <CubeIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                        <div className="text-sm text-gray-500">Category: {item.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.metal_type} - {item.purity}</div>
                    <div className="text-sm text-gray-500">Weight: {item.weight}g</div>
                    <div className="text-sm text-gray-500">Barcode: {item.barcode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Selling: {formatCurrency(item.selling_price || item.base_price * 1.15)}
                    </div>
                    <div className="text-sm text-gray-500">Base: {formatCurrency(item.base_price)}</div>
                    {item.calculated_value && (
                      <div className="text-sm text-green-600 font-medium">
                        Live Value: {formatCurrency(item.calculated_value)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(item)}`}>
                      {getStockStatusText(item)}
                    </span>
                    <div className="text-sm text-gray-500 mt-1">
                      Qty: {item.stock_quantity} / Min: {item.min_stock_level || 2}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit Item"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Item"
                        disabled={deleteItemMutation.isPending}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="btn-outline"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="btn-outline"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * limit, inventoryData?.total || 0)}</span> of{' '}
                <span className="font-medium">{inventoryData?.total || 0}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="btn-outline rounded-l-md"
                >
                  Previous
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`btn-outline ${page === pageNum ? 'bg-blue-50 border-blue-500 text-blue-600' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="btn-outline rounded-r-md"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-500 text-center">
        Showing {items.length} items • Page {page} of {totalPages} • Total: {inventoryData?.total || 0} items in inventory
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Unable to load inventory data
              </h3>
              <div className="mt-1 text-sm text-red-700">
                <p>Please check your connection and try again. Error: {error.message}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => refetch()}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}