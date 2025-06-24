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
import { useAuth } from '@/lib/auth/AuthContext';

interface JewelryItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  metal_type: string;
  purity: string;
  weight: number;
  stock_quantity: number;
  min_stock_level: number;
  base_price: number;
  selling_price: number;
  making_charges: number;
  images: string[];
  barcode?: string;
  created_at: string;
  updated_at: string;
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
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<JewelryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    category: '',
    metal_type: '',
    purity: '',
    stock_status: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<JewelryItem | null>(null);
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    categories: 0
  });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [items, filters]);

  const fetchInventoryData = async () => {
    try {
      // In a real implementation, this would call the inventory API
      // For now, using mock data
      setTimeout(() => {
        const mockItems: JewelryItem[] = [
          {
            id: 1,
            sku: 'GRN-22K-001',
            name: '22K Gold Necklace Set',
            category: 'Necklaces',
            metal_type: 'Gold',
            purity: '22K',
            weight: 45.5,
            stock_quantity: 3,
            min_stock_level: 2,
            base_price: 280000,
            selling_price: 320000,
            making_charges: 40000,
            images: ['necklace1.jpg'],
            barcode: '1234567890123',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-20T14:45:00Z'
          },
          {
            id: 2,
            sku: 'GER-18K-002',
            name: '18K Gold Diamond Earrings',
            category: 'Earrings',
            metal_type: 'Gold',
            purity: '18K',
            weight: 12.3,
            stock_quantity: 8,
            min_stock_level: 5,
            base_price: 95000,
            selling_price: 110000,
            making_charges: 15000,
            images: ['earrings1.jpg'],
            barcode: '1234567890124',
            created_at: '2024-01-10T09:15:00Z',
            updated_at: '2024-01-18T11:20:00Z'
          },
          {
            id: 3,
            sku: 'SBR-925-001',
            name: 'Silver Bracelet with Stones',
            category: 'Bracelets',
            metal_type: 'Silver',
            purity: '925',
            weight: 25.8,
            stock_quantity: 1,
            min_stock_level: 3,
            base_price: 8500,
            selling_price: 12000,
            making_charges: 3500,
            images: ['bracelet1.jpg'],
            barcode: '1234567890125',
            created_at: '2024-01-05T16:00:00Z',
            updated_at: '2024-01-22T13:30:00Z'
          },
          {
            id: 4,
            sku: 'GRG-22K-003',
            name: '22K Gold Wedding Ring',
            category: 'Rings',
            metal_type: 'Gold',
            purity: '22K',
            weight: 8.2,
            stock_quantity: 12,
            min_stock_level: 6,
            base_price: 50000,
            selling_price: 58000,
            making_charges: 8000,
            images: ['ring1.jpg'],
            barcode: '1234567890126',
            created_at: '2024-01-12T14:20:00Z',
            updated_at: '2024-01-21T10:15:00Z'
          }
        ];

        setItems(mockItems);
        
        // Calculate stats
        const stats = {
          totalItems: mockItems.length,
          totalValue: mockItems.reduce((sum, item) => sum + (item.selling_price * item.stock_quantity), 0),
          lowStockItems: mockItems.filter(item => item.stock_quantity <= item.min_stock_level).length,
          categories: new Set(mockItems.map(item => item.category)).size
        };
        setInventoryStats(stats);
        
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    if (filters.search) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.sku.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    if (filters.metal_type) {
      filtered = filtered.filter(item => item.metal_type === filters.metal_type);
    }

    if (filters.purity) {
      filtered = filtered.filter(item => item.purity === filters.purity);
    }

    if (filters.stock_status) {
      if (filters.stock_status === 'low') {
        filtered = filtered.filter(item => item.stock_quantity <= item.min_stock_level);
      } else if (filters.stock_status === 'out') {
        filtered = filtered.filter(item => item.stock_quantity === 0);
      } else if (filters.stock_status === 'in') {
        filtered = filtered.filter(item => item.stock_quantity > item.min_stock_level);
      }
    }

    setFilteredItems(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatusColor = (item: JewelryItem) => {
    if (item.stock_quantity === 0) return 'text-red-600 bg-red-100';
    if (item.stock_quantity <= item.min_stock_level) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStockStatusText = (item: JewelryItem) => {
    if (item.stock_quantity === 0) return 'Out of Stock';
    if (item.stock_quantity <= item.min_stock_level) return 'Low Stock';
    return 'In Stock';
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your jewelry inventory, track stock levels, and monitor valuations
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Item
          </button>
          <button className="btn-secondary flex items-center">
            <QrCodeIcon className="h-5 w-5 mr-2" />
            Scan Barcode
          </button>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CubeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5">
              <div className="text-sm font-medium text-gray-500">Total Items</div>
              <div className="text-2xl font-bold text-gray-900">{inventoryStats.totalItems}</div>
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
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(inventoryStats.totalValue)}</div>
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
              <div className="text-2xl font-bold text-gray-900">{inventoryStats.lowStockItems}</div>
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
              <div className="text-2xl font-bold text-gray-900">{inventoryStats.categories}</div>
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
              {filteredItems.map((item) => (
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
                    <div className="text-sm text-gray-900">Selling: {formatCurrency(item.selling_price)}</div>
                    <div className="text-sm text-gray-500">Base: {formatCurrency(item.base_price)}</div>
                    <div className="text-sm text-gray-500">Making: {formatCurrency(item.making_charges)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(item)}`}>
                      {getStockStatusText(item)}
                    </span>
                    <div className="text-sm text-gray-500 mt-1">
                      Qty: {item.stock_quantity} / Min: {item.min_stock_level}
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
                        onClick={() => console.log('Delete item', item.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Item"
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

      {/* Results Summary */}
      <div className="text-sm text-gray-500 text-center">
        Showing {filteredItems.length} of {items.length} items
      </div>
    </div>
  );
}