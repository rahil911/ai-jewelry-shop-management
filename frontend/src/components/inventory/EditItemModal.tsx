'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentDuplicateIcon, CalculatorIcon, CubeIcon, TagIcon, CurrencyDollarIcon, ScaleIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService, type JewelryItem } from '@/lib/api/services/inventory';
import { useCurrentGoldRates } from '@/lib/hooks/usePricing';
import { toast } from 'react-hot-toast';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  item: JewelryItem | null;
}

interface EditItemForm {
  name: string;
  sku: string;
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
  barcode: string;
  location: string;
}

export default function EditItemModal({ isOpen, onClose, onSuccess, item }: EditItemModalProps) {
  const queryClient = useQueryClient();
  const { data: goldRates } = useCurrentGoldRates();
  
  const [formData, setFormData] = useState<EditItemForm>({
    name: '',
    sku: '',
    category: '',
    metal_type: '',
    purity: '',
    weight: 0,
    making_charges: 0,
    wastage_percentage: 0,
    base_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    min_stock_level: 2,
    description: '',
    barcode: '',
    location: '',
  });

  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [errors, setErrors] = useState<Partial<EditItemForm>>({});

  // Load item data when modal opens
  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        name: item.name || '',
        sku: item.sku || '',
        category: item.category || '',
        metal_type: item.metal_type || '',
        purity: item.purity || '',
        weight: item.weight || 0,
        making_charges: item.making_charges || 0,
        wastage_percentage: item.wastage_percentage || 0,
        base_price: item.base_price || 0,
        selling_price: item.selling_price || 0,
        stock_quantity: item.stock_quantity || 0,
        min_stock_level: item.min_stock_level || 2,
        description: item.description || '',
        barcode: item.barcode || '',
        location: item.location || '',
      });
    }
  }, [item, isOpen]);

  // Real-time price calculation
  useEffect(() => {
    if (goldRates && formData.weight > 0 && formData.purity && formData.metal_type === 'Gold') {
      const goldRate = goldRates[formData.purity] || 0;
      const goldValue = formData.weight * goldRate;
      const makingCharges = goldValue * (formData.making_charges / 100);
      const wastage = goldValue * (formData.wastage_percentage / 100);
      const totalPrice = goldValue + makingCharges + wastage;
      
      setCalculatedPrice(totalPrice);
      
      // Auto-update base price if it's empty or zero
      if (formData.base_price === 0) {
        setFormData(prev => ({
          ...prev,
          base_price: Math.round(totalPrice),
          selling_price: Math.round(totalPrice * 1.15) // 15% markup
        }));
      }
    }
  }, [goldRates, formData.weight, formData.purity, formData.making_charges, formData.wastage_percentage, formData.metal_type, formData.base_price]);

  const updateItemMutation = useMutation({
    mutationFn: (updates: Partial<JewelryItem>) => {
      if (!item) throw new Error('No item to update');
      return inventoryService.updateItem(item.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item updated successfully!');
      onSuccess?.();
      handleClose();
    },
    onError: (error: any) => {
      console.error('Update item error:', error);
      toast.error(error.response?.data?.message || 'Failed to update item');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<EditItemForm> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.metal_type) newErrors.metal_type = 'Metal type is required';
    if (!formData.purity) newErrors.purity = 'Purity is required';
    if (formData.weight <= 0) newErrors.weight = 'Weight must be greater than 0';
    if (formData.base_price <= 0) newErrors.base_price = 'Base price must be greater than 0';
    if (formData.stock_quantity < 0) newErrors.stock_quantity = 'Stock quantity cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    updateItemMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      metal_type: '',
      purity: '',
      weight: 0,
      making_charges: 0,
      wastage_percentage: 0,
      base_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      min_stock_level: 2,
      description: '',
      barcode: '',
      location: '',
    });
    setErrors({});
    setCalculatedPrice(0);
    onClose();
  };

  const handleInputChange = (field: keyof EditItemForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={handleClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 mb-6">
                      Edit Jewelry Item
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Basic Information Section */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <CubeIcon className="h-5 w-5 text-blue-600 mr-2" />
                          <h4 className="text-sm font-medium text-blue-900">Basic Information</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Item Name *
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              className={`input ${errors.name ? 'border-red-500' : ''}`}
                              placeholder="Enter item name"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              SKU *
                            </label>
                            <input
                              type="text"
                              value={formData.sku}
                              onChange={(e) => handleInputChange('sku', e.target.value)}
                              className={`input ${errors.sku ? 'border-red-500' : ''}`}
                              placeholder="Enter SKU"
                            />
                            {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Category *
                            </label>
                            <select
                              value={formData.category}
                              onChange={(e) => handleInputChange('category', e.target.value)}
                              className={`select ${errors.category ? 'border-red-500' : ''}`}
                            >
                              <option value="">Select Category</option>
                              <option value="rings">Rings</option>
                              <option value="necklaces">Necklaces</option>
                              <option value="earrings">Earrings</option>
                              <option value="bracelets">Bracelets</option>
                              <option value="pendants">Pendants</option>
                            </select>
                            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              value={formData.description}
                              onChange={(e) => handleInputChange('description', e.target.value)}
                              className="input"
                              rows={3}
                              placeholder="Enter item description"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Metal Specifications Section */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <ScaleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                          <h4 className="text-sm font-medium text-yellow-900">Metal Specifications</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Metal Type *
                            </label>
                            <select
                              value={formData.metal_type}
                              onChange={(e) => handleInputChange('metal_type', e.target.value)}
                              className={`select ${errors.metal_type ? 'border-red-500' : ''}`}
                            >
                              <option value="">Select Metal</option>
                              <option value="Gold">Gold</option>
                              <option value="Silver">Silver</option>
                              <option value="Platinum">Platinum</option>
                            </select>
                            {errors.metal_type && <p className="mt-1 text-sm text-red-600">{errors.metal_type}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Purity *
                            </label>
                            <select
                              value={formData.purity}
                              onChange={(e) => handleInputChange('purity', e.target.value)}
                              className={`select ${errors.purity ? 'border-red-500' : ''}`}
                            >
                              <option value="">Select Purity</option>
                              {formData.metal_type === 'Gold' && (
                                <>
                                  <option value="22K">22K</option>
                                  <option value="18K">18K</option>
                                  <option value="14K">14K</option>
                                </>
                              )}
                              {formData.metal_type === 'Silver' && (
                                <option value="925">925 Silver</option>
                              )}
                              {formData.metal_type === 'Platinum' && (
                                <option value="950">950 Platinum</option>
                              )}
                            </select>
                            {errors.purity && <p className="mt-1 text-sm text-red-600">{errors.purity}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Weight (grams) *
                            </label>
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={formData.weight}
                              onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                              className={`input ${errors.weight ? 'border-red-500' : ''}`}
                              placeholder="0.000"
                            />
                            {errors.weight && <p className="mt-1 text-sm text-red-600">{errors.weight}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Charges Section */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
                          <h4 className="text-sm font-medium text-green-900">Pricing & Charges</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Making Charges (%)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={formData.making_charges}
                              onChange={(e) => handleInputChange('making_charges', parseFloat(e.target.value) || 0)}
                              className="input"
                              placeholder="12.0"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Wastage (%)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="50"
                              value={formData.wastage_percentage}
                              onChange={(e) => handleInputChange('wastage_percentage', parseFloat(e.target.value) || 0)}
                              className="input"
                              placeholder="5.0"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Base Price (₹) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={formData.base_price}
                              onChange={(e) => handleInputChange('base_price', parseInt(e.target.value) || 0)}
                              className={`input ${errors.base_price ? 'border-red-500' : ''}`}
                              placeholder="25000"
                            />
                            {errors.base_price && <p className="mt-1 text-sm text-red-600">{errors.base_price}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Selling Price (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={formData.selling_price}
                              onChange={(e) => handleInputChange('selling_price', parseInt(e.target.value) || 0)}
                              className="input"
                              placeholder="28750"
                            />
                          </div>
                        </div>

                        {calculatedPrice > 0 && (
                          <div className="mt-4 p-3 bg-green-100 rounded-md">
                            <div className="flex items-center">
                              <CalculatorIcon className="h-5 w-5 text-green-600 mr-2" />
                              <span className="text-sm font-medium text-green-800">
                                Calculated Price: {formatCurrency(calculatedPrice)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Inventory Management Section */}
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <TagIcon className="h-5 w-5 text-purple-600 mr-2" />
                          <h4 className="text-sm font-medium text-purple-900">Inventory Management</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Stock Quantity *
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={formData.stock_quantity}
                              onChange={(e) => handleInputChange('stock_quantity', parseInt(e.target.value) || 0)}
                              className={`input ${errors.stock_quantity ? 'border-red-500' : ''}`}
                              placeholder="5"
                            />
                            {errors.stock_quantity && <p className="mt-1 text-sm text-red-600">{errors.stock_quantity}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Minimum Stock Level
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={formData.min_stock_level}
                              onChange={(e) => handleInputChange('min_stock_level', parseInt(e.target.value) || 2)}
                              className="input"
                              placeholder="2"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Barcode
                            </label>
                            <input
                              type="text"
                              value={formData.barcode}
                              onChange={(e) => handleInputChange('barcode', e.target.value)}
                              className="input"
                              placeholder="Auto-generated"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Location
                            </label>
                            <input
                              type="text"
                              value={formData.location}
                              onChange={(e) => handleInputChange('location', e.target.value)}
                              className="input"
                              placeholder="Shelf A1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={handleClose}
                          className="btn-outline"
                          disabled={updateItemMutation.isPending}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={updateItemMutation.isPending}
                        >
                          {updateItemMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            'Update Item'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}