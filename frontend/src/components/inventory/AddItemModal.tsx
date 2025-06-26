'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/lib/api/services/inventory';
import { useCurrentGoldRates } from '@/lib/hooks/usePricing';
import { toast } from 'react-hot-toast';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  nameHi: string;
  nameKn: string;
  description: string;
  categoryId: string;
  metalTypeId: string;
  purityId: string;
  grossWeight: number | '';
  netWeight: number | '';
  stoneWeight: number | '';
  makingCharges: number | '';
  wastagePercentage: number | '';
  stoneCharges: number | '';
  otherCharges: number | '';
  costPrice: number | '';
  stockQuantity: number | '';
  minStockLevel: number | '';
  size: string;
  color: string;
  occasion: string;
  gender: string;
  ageGroup: string;
  style: string;
  isCustomizable: boolean;
  isFeatured: boolean;
  location: string;
  supplierId: string;
  warrantyMonths: number | '';
  careInstructions: string;
}

const initialFormData: FormData = {
  name: '',
  nameHi: '',
  nameKn: '',
  description: '',
  categoryId: '',
  metalTypeId: '',
  purityId: '',
  grossWeight: '',
  netWeight: '',
  stoneWeight: 0,
  makingCharges: 12, // Default making charges
  wastagePercentage: 5, // Default wastage
  stoneCharges: 0,
  otherCharges: 0,
  costPrice: '',
  stockQuantity: 1,
  minStockLevel: 2,
  size: '',
  color: '',
  occasion: '',
  gender: '',
  ageGroup: '',
  style: '',
  isCustomizable: false,
  isFeatured: false,
  location: '',
  supplierId: '',
  warrantyMonths: 12,
  careInstructions: ''
};

// Mock data for dropdowns (in real app, these would come from API)
const categories = [
  { id: '1', name: 'Rings' },
  { id: '2', name: 'Necklaces' },
  { id: '3', name: 'Earrings' },
  { id: '4', name: 'Bracelets' },
  { id: '5', name: 'Bangles' }
];

const metalTypes = [
  { id: '1', name: 'Gold', symbol: 'AU' },
  { id: '2', name: 'Silver', symbol: 'AG' },
  { id: '3', name: 'Platinum', symbol: 'PT' }
];

const purities = [
  { id: '1', name: '22K', percentage: 91.6 },
  { id: '2', name: '18K', percentage: 75.0 },
  { id: '3', name: '14K', percentage: 58.3 },
  { id: '4', name: '925 Silver', percentage: 92.5 },
  { id: '5', name: '950 Platinum', percentage: 95.0 }
];

export default function AddItemModal({ isOpen, onClose, onSuccess }: AddItemModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const queryClient = useQueryClient();
  const { data: goldRates } = useCurrentGoldRates();

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: (data: any) => inventoryService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item created successfully!');
      onSuccess?.();
      onClose();
      setFormData(initialFormData);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create item');
    },
  });

  // Calculate price when relevant fields change
  useEffect(() => {
    if (formData.netWeight && formData.makingCharges && goldRates && formData.purityId) {
      const selectedPurity = purities.find(p => p.id === formData.purityId);
      if (selectedPurity) {
        const goldRate = goldRates['22K'] || 6800; // Default fallback
        const adjustedRate = goldRate * (selectedPurity.percentage / 91.6); // Adjust for purity
        
        const weightValue = typeof formData.netWeight === 'number' ? formData.netWeight : 0;
        const makingChargesValue = typeof formData.makingCharges === 'number' ? formData.makingCharges : 0;
        const wastageValue = typeof formData.wastagePercentage === 'number' ? formData.wastagePercentage : 0;
        const stoneChargesValue = typeof formData.stoneCharges === 'number' ? formData.stoneCharges : 0;
        const otherChargesValue = typeof formData.otherCharges === 'number' ? formData.otherCharges : 0;
        
        const goldValue = weightValue * adjustedRate;
        const makingAmount = goldValue * (makingChargesValue / 100);
        const wastageAmount = goldValue * (wastageValue / 100);
        
        const totalPrice = goldValue + makingAmount + wastageAmount + stoneChargesValue + otherChargesValue;
        setCalculatedPrice(Math.round(totalPrice));
      }
    }
  }, [formData.netWeight, formData.makingCharges, formData.wastagePercentage, formData.stoneCharges, formData.otherCharges, formData.purityId, goldRates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert form data to match backend schema
    const submitData = {
      name: formData.name,
      nameHi: formData.nameHi || undefined,
      nameKn: formData.nameKn || undefined,
      description: formData.description || undefined,
      categoryId: formData.categoryId,
      metalTypeId: formData.metalTypeId,
      purityId: formData.purityId,
      grossWeight: Number(formData.grossWeight),
      netWeight: Number(formData.netWeight),
      stoneWeight: Number(formData.stoneWeight) || 0,
      makingCharges: Number(formData.makingCharges),
      wastagePercentage: Number(formData.wastagePercentage) || 0,
      stoneCharges: Number(formData.stoneCharges) || 0,
      otherCharges: Number(formData.otherCharges) || 0,
      costPrice: Number(formData.costPrice) || undefined,
      stockQuantity: Number(formData.stockQuantity) || 1,
      minStockLevel: Number(formData.minStockLevel) || 0,
      size: formData.size || undefined,
      color: formData.color || undefined,
      occasion: formData.occasion || undefined,
      gender: formData.gender || undefined,
      ageGroup: formData.ageGroup || undefined,
      style: formData.style || undefined,
      isCustomizable: formData.isCustomizable,
      isFeatured: formData.isFeatured,
      location: formData.location || undefined,
      supplierId: formData.supplierId || undefined,
      warrantyMonths: Number(formData.warrantyMonths) || 12,
      careInstructions: formData.careInstructions || undefined
    };

    createItemMutation.mutate(submitData);
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">💎 Add New Jewelry Item</h3>
              <p className="text-sm text-gray-600 mt-1">Create a new item in your inventory with complete details</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              title="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-8">
              {/* Section 1: Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="input"
                      placeholder="e.g., Classic Gold Ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="input resize-none"
                      placeholder="Detailed description of the jewelry item"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Product Classification */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Product Classification</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="categoryId"
                      required
                      value={formData.categoryId}
                      onChange={(e) => handleInputChange('categoryId', e.target.value)}
                      className="select"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="metalTypeId" className="block text-sm font-medium text-gray-700 mb-2">
                      Metal Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="metalTypeId"
                      required
                      value={formData.metalTypeId}
                      onChange={(e) => handleInputChange('metalTypeId', e.target.value)}
                      className="select"
                    >
                      <option value="">Select Metal</option>
                      {metalTypes.map(metal => (
                        <option key={metal.id} value={metal.id}>{metal.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="purityId" className="block text-sm font-medium text-gray-700 mb-2">
                      Purity <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="purityId"
                      required
                      value={formData.purityId}
                      onChange={(e) => handleInputChange('purityId', e.target.value)}
                      className="select"
                    >
                      <option value="">Select Purity</option>
                      {purities.map(purity => (
                        <option key={purity.id} value={purity.id}>{purity.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Weight Specifications */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Weight Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="grossWeight" className="block text-sm font-medium text-gray-700 mb-2">
                      Gross Weight (g) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="grossWeight"
                      required
                      step="0.001"
                      min="0"
                      value={formData.grossWeight}
                      onChange={(e) => handleInputChange('grossWeight', e.target.value ? parseFloat(e.target.value) : '')}
                      className="input"
                      placeholder="0.000"
                    />
                  </div>
                  <div>
                    <label htmlFor="netWeight" className="block text-sm font-medium text-gray-700 mb-2">
                      Net Weight (g) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="netWeight"
                      required
                      step="0.001"
                      min="0"
                      value={formData.netWeight}
                      onChange={(e) => handleInputChange('netWeight', e.target.value ? parseFloat(e.target.value) : '')}
                      className="input"
                      placeholder="0.000"
                    />
                  </div>
                  <div>
                    <label htmlFor="stoneWeight" className="block text-sm font-medium text-gray-700 mb-2">
                      Stone Weight (g)
                    </label>
                    <input
                      type="number"
                      id="stoneWeight"
                      step="0.001"
                      min="0"
                      value={formData.stoneWeight}
                      onChange={(e) => handleInputChange('stoneWeight', e.target.value ? parseFloat(e.target.value) : 0)}
                      className="input"
                      placeholder="0.000"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Pricing Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Charges</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="makingCharges" className="block text-sm font-medium text-gray-700 mb-2">
                      Making Charges (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="makingCharges"
                      required
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.makingCharges}
                      onChange={(e) => handleInputChange('makingCharges', e.target.value ? parseFloat(e.target.value) : '')}
                      className="input"
                      placeholder="12.00"
                    />
                  </div>
                  <div>
                    <label htmlFor="wastagePercentage" className="block text-sm font-medium text-gray-700 mb-2">
                      Wastage (%)
                    </label>
                    <input
                      type="number"
                      id="wastagePercentage"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.wastagePercentage}
                      onChange={(e) => handleInputChange('wastagePercentage', e.target.value ? parseFloat(e.target.value) : 0)}
                      className="input"
                      placeholder="5.00"
                    />
                  </div>
                  <div>
                    <label htmlFor="stoneCharges" className="block text-sm font-medium text-gray-700 mb-2">
                      Stone Charges (₹)
                    </label>
                    <input
                      type="number"
                      id="stoneCharges"
                      step="0.01"
                      min="0"
                      value={formData.stoneCharges}
                      onChange={(e) => handleInputChange('stoneCharges', e.target.value ? parseFloat(e.target.value) : 0)}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label htmlFor="otherCharges" className="block text-sm font-medium text-gray-700 mb-2">
                      Other Charges (₹)
                    </label>
                    <input
                      type="number"
                      id="otherCharges"
                      step="0.01"
                      min="0"
                      value={formData.otherCharges}
                      onChange={(e) => handleInputChange('otherCharges', e.target.value ? parseFloat(e.target.value) : 0)}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Calculated Price Display */}
                {calculatedPrice > 0 && (
                  <div className="mt-4 bg-blue-100 border border-blue-300 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">💰 Calculated Selling Price:</span>
                      <span className="text-xl font-bold text-blue-900">{formatCurrency(calculatedPrice)}</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      🔄 Auto-calculated based on current gold rates and specified charges
                    </p>
                  </div>
                )}
              </div>

              {/* Section 5: Stock Information */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Inventory Management</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                      📦 Initial Stock Quantity
                    </label>
                    <input
                      type="number"
                      id="stockQuantity"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => handleInputChange('stockQuantity', e.target.value ? parseInt(e.target.value) : 1)}
                      className="input"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label htmlFor="minStockLevel" className="block text-sm font-medium text-gray-700 mb-2">
                      ⚠️ Minimum Stock Level
                    </label>
                    <input
                      type="number"
                      id="minStockLevel"
                      min="0"
                      value={formData.minStockLevel}
                      onChange={(e) => handleInputChange('minStockLevel', e.target.value ? parseInt(e.target.value) : 0)}
                      className="input"
                      placeholder="2"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Product Details & Options */}
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h4>
                
                {/* Product Attributes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                      📏 Size
                    </label>
                    <input
                      type="text"
                      id="size"
                      value={formData.size}
                      onChange={(e) => handleInputChange('size', e.target.value)}
                      className="input"
                      placeholder="e.g., 16, M, Large"
                    />
                  </div>
                  <div>
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                      🎨 Color
                    </label>
                    <input
                      type="text"
                      id="color"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      className="input"
                      placeholder="e.g., Yellow Gold, White Gold"
                    />
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                      👤 Target Gender
                    </label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="select"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>
                </div>

                {/* Storage & Warranty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      📍 Storage Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="input"
                      placeholder="e.g., Showcase A, Vault 1"
                    />
                  </div>
                  <div>
                    <label htmlFor="warrantyMonths" className="block text-sm font-medium text-gray-700 mb-2">
                      🛡️ Warranty (Months)
                    </label>
                    <input
                      type="number"
                      id="warrantyMonths"
                      min="0"
                      value={formData.warrantyMonths}
                      onChange={(e) => handleInputChange('warrantyMonths', e.target.value ? parseInt(e.target.value) : 12)}
                      className="input"
                      placeholder="12"
                    />
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-6 mb-4">
                  <label className="flex items-center bg-white p-2 rounded border">
                    <input
                      type="checkbox"
                      checked={formData.isCustomizable}
                      onChange={(e) => handleInputChange('isCustomizable', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">🔧 Is Customizable</span>
                  </label>
                  <label className="flex items-center bg-white p-2 rounded border">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">⭐ Featured Item</span>
                  </label>
                </div>

                {/* Care Instructions */}
                <div>
                  <label htmlFor="careInstructions" className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Care Instructions
                  </label>
                  <textarea
                    id="careInstructions"
                    rows={3}
                    value={formData.careInstructions}
                    onChange={(e) => handleInputChange('careInstructions', e.target.value)}
                    className="input resize-none"
                    placeholder="Cleaning and maintenance instructions for the jewelry item"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200 bg-gray-50 px-4 py-4 rounded-lg">
              <div className="text-sm text-gray-600">
                <span className="text-red-500">*</span> Required fields
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-outline px-6 py-2"
                  disabled={createItemMutation.isPending}
                >
                  ✕ Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2 flex items-center"
                  disabled={createItemMutation.isPending || !formData.name || !formData.categoryId || !formData.metalTypeId || !formData.purityId || !formData.grossWeight || !formData.netWeight || !formData.makingCharges}
                >
                  {createItemMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>✓ Create Item</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}