'use client';

import React, { useState } from 'react';
import { 
  FunnelIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  StarIcon,
  CurrencyDollarIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowUpDownIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useInventoryItems } from '@/lib/hooks/useInventory';
import { useCurrentGoldRates } from '@/lib/hooks/usePricing';
import { InventoryFilters } from '@/lib/api/services/inventory';

export default function StorePage() {
  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    limit: 24
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPurity, setSelectedPurity] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<{min: number; max: number}>({min: 0, max: 1000000});
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [wishlist, setWishlist] = useState<string[]>([]);

  const { data: inventoryData, isLoading } = useInventoryItems({
    ...filters,
    search: searchQuery || undefined,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    purity: selectedPurity === 'all' ? undefined : selectedPurity,
    min_price: priceRange.min,
    max_price: priceRange.max
  });

  const { data: goldRates } = useCurrentGoldRates();

  const categories = [
    { id: 'all', name: 'All Categories', icon: '💍' },
    { id: 'rings', name: 'Rings', icon: '💍' },
    { id: 'necklaces', name: 'Necklaces', icon: '📿' },
    { id: 'earrings', name: 'Earrings', icon: '👂' },
    { id: 'bracelets', name: 'Bracelets', icon: '🔗' },
    { id: 'bangles', name: 'Bangles', icon: '⭕' },
    { id: 'chains', name: 'Chains', icon: '🔗' },
    { id: 'pendants', name: 'Pendants', icon: '🏺' }
  ];

  const purities = [
    { id: 'all', name: 'All Purities' },
    { id: '22K', name: '22K Gold' },
    { id: '18K', name: '18K Gold' },
    { id: '14K', name: '14K Gold' },
    { id: 'Silver', name: 'Silver' },
    { id: 'Platinum', name: 'Platinum' }
  ];

  const sortOptions = [
    { id: 'newest', name: 'Newest First' },
    { id: 'price_low', name: 'Price: Low to High' },
    { id: 'price_high', name: 'Price: High to Low' },
    { id: 'popularity', name: 'Most Popular' },
    { id: 'rating', name: 'Highest Rated' }
  ];

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

  const toggleWishlist = (itemId: string) => {
    setWishlist(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const calculateRealTimePrice = (item: any) => {
    if (!goldRates || !item.purity || !item.weight) return item.selling_price || 0;
    
    const currentRate = goldRates[item.purity as keyof typeof goldRates];
    if (!currentRate) return item.selling_price || 0;
    
    const basePrice = currentRate * item.weight;
    const makingCharges = basePrice * (item.making_charges || 12) / 100;
    const gst = (basePrice + makingCharges) * 0.03; // 3% GST
    
    return basePrice + makingCharges + gst;
  };

  const renderProductCard = (item: any) => {
    const isInWishlist = wishlist.includes(item.id);
    const realTimePrice = calculateRealTimePrice(item);
    
    if (viewMode === 'list') {
      return (
        <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-6">
            <div className="relative flex-shrink-0">
              <img
                src={item.images?.[0] || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=200'}
                alt={item.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <button
                onClick={() => toggleWishlist(item.id)}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm"
              >
                {isInWishlist ? (
                  <HeartSolidIcon className="h-4 w-4 text-red-500" />
                ) : (
                  <HeartIcon className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">{item.name}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
              
              <div className="flex items-center space-x-4 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {item.purity}
                </span>
                <span className="text-sm text-gray-500">{formatWeight(item.weight)}</span>
                <div className="flex items-center">
                  <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-500 ml-1">4.8 (127)</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(realTimePrice)}</div>
                {realTimePrice !== (item.selling_price || 0) && (
                  <div className="text-sm text-gray-500 line-through">{formatCurrency(item.selling_price || 0)}</div>
                )}
                <div className="text-xs text-green-600">Live pricing ●</div>
              </div>
              
              <div className="flex space-x-2">
                <button className="btn-secondary btn-sm flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </button>
                <button className="btn-primary btn-sm flex items-center">
                  <ShoppingCartIcon className="h-4 w-4 mr-1" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
        <div className="relative aspect-square">
          <img
            src={item.images?.[0] || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400'}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Live pricing indicator */}
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Live Price
          </div>
          
          {/* Wishlist button */}
          <button
            onClick={() => toggleWishlist(item.id)}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isInWishlist ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
          
          {/* Quick actions */}
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-2">
              <button className="flex-1 btn-secondary btn-sm flex items-center justify-center">
                <EyeIcon className="h-4 w-4 mr-1" />
                Quick View
              </button>
              <button className="flex-1 btn-primary btn-sm flex items-center justify-center">
                <ShoppingCartIcon className="h-4 w-4 mr-1" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {item.purity}
            </span>
            <span className="text-sm text-gray-500">{formatWeight(item.weight)}</span>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-1">{item.name}</h3>
          
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
            </div>
            <span className="text-sm text-gray-500 ml-2">(127 reviews)</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(realTimePrice)}</div>
              {realTimePrice !== (item.selling_price || 0) && (
                <div className="text-sm text-gray-500 line-through">{formatCurrency(item.selling_price || 0)}</div>
              )}
            </div>
            
            <div className="text-xs text-green-600 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
              Live
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-8 mb-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">Exquisite Jewelry Collection</h1>
          <p className="text-xl mb-6">Discover our handcrafted pieces with real-time gold pricing</p>
          <div className="flex items-center space-x-6">
            {goldRates && (
              <>
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-6 w-6 mr-2" />
                  <div>
                    <div className="text-sm opacity-90">22K Gold</div>
                    <div className="font-bold">₹{goldRates['22K']?.toLocaleString()}/g</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <SparklesIcon className="h-6 w-6 mr-2" />
                  <div>
                    <div className="text-sm opacity-90">Live Pricing</div>
                    <div className="font-bold">Updated Every 5 Min</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </h3>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jewelry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Categories</label>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Purity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Metal Purity</label>
              <select
                value={selectedPurity}
                onChange={(e) => setSelectedPurity(e.target.value)}
                className="select w-full"
              >
                {purities.map((purity) => (
                  <option key={purity.id} value={purity.id}>
                    {purity.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min || ''}
                    onChange={(e) => setPriceRange({...priceRange, min: Number(e.target.value) || 0})}
                    className="input flex-1"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max || ''}
                    onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value) || 1000000})}
                    className="input flex-1"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {formatCurrency(priceRange.min)} - {formatCurrency(priceRange.max)}
                </div>
              </div>
            </div>

            {/* Quick Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Quick Filters</label>
              <div className="space-y-2">
                <button className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                  ⭐ Bestsellers
                </button>
                <button className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                  🆕 New Arrivals
                </button>
                <button className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                  💎 Premium Collection
                </button>
                <button className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                  🏷️ Sale Items
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-500">
                {inventoryData?.total || 0} products found
              </p>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Products Grid/List */}
          {isLoading ? (
            <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="aspect-square bg-gray-200 animate-pulse"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : inventoryData?.items.length ? (
            <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
              {inventoryData.items.map(renderProductCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || selectedCategory !== 'all' || selectedPurity !== 'all'
                  ? 'Try adjusting your filters to see more products.'
                  : 'No products available at the moment.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {inventoryData && inventoryData.total_pages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => setFilters({...filters, page: Math.max(1, (filters.page || 1) - 1)})}
                disabled={filters.page === 1}
                className="btn-secondary btn-sm"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-500">
                Page {filters.page} of {inventoryData.total_pages}
              </span>
              
              <button
                onClick={() => setFilters({...filters, page: Math.min(inventoryData.total_pages, (filters.page || 1) + 1)})}
                disabled={filters.page === inventoryData.total_pages}
                className="btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}