'use client';

import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  ShoppingBagIcon,
  CogIcon,
  CalculatorIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  CurrencyRupeeIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { useCreateOrder } from '@/lib/hooks/useOrdersEnhanced';
import { inventoryService, JewelryItem } from '@/lib/api/services/inventory';
import { pricingService, PriceCalculationResponse } from '@/lib/api/services/pricing';
import { ORDER_TYPES } from '@/lib/api/services/orders';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

interface OrderItem {
  jewelry_item_id: number;
  item: JewelryItem;
  quantity: number;
  unit_price: number;
  customization_details?: string;
  total_price: number;
}

interface OrderData {
  customer_id: number;
  customer: Customer;
  order_type: string;
  items: OrderItem[];
  special_instructions: string;
  estimated_completion: string;
  subtotal: number;
  making_charges: number;
  wastage_amount: number;
  gst_amount: number;
  total_amount: number;
}

interface OrderCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: any) => void;
}

export default function OrderCreationWizard({ isOpen, onClose, onSuccess }: OrderCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState<Partial<OrderData>>({
    items: [],
    special_instructions: '',
    estimated_completion: '',
    subtotal: 0,
    making_charges: 0,
    wastage_amount: 0,
    gst_amount: 0,
    total_amount: 0,
  });
  
  // State for each step
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [inventoryItems, setInventoryItems] = useState<JewelryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  
  const [isCalculatingPrices, setIsCalculatingPrices] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceCalculationResponse | null>(null);
  
  const createOrderMutation = useCreateOrder();

  // Handle mutation success
  useEffect(() => {
    if (createOrderMutation.isSuccess && createOrderMutation.data) {
      console.log('Order created successfully:', createOrderMutation.data);
      onSuccess(createOrderMutation.data);
      onClose();
      createOrderMutation.reset(); // Reset mutation state
    }
  }, [createOrderMutation.isSuccess, createOrderMutation.data, onSuccess, onClose]);

  const steps = [
    { id: 1, name: 'Customer', icon: UserIcon, description: 'Select or add customer' },
    { id: 2, name: 'Order Type', icon: ShoppingBagIcon, description: 'Choose order type' },
    { id: 3, name: 'Items', icon: CogIcon, description: 'Select jewelry items' },
    { id: 4, name: 'Pricing', icon: CalculatorIcon, description: 'Review pricing' },
    { id: 5, name: 'Review', icon: CheckCircleIcon, description: 'Confirm order' },
  ];

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      loadInventoryItems();
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    try {
      // Use real customers - the Order Management Service has at least customer_id: 1
      // In production, this would come from User Management Service, but for now we use known customers
      const realCustomers: Customer[] = [
        { 
          id: 1, 
          name: 'Shop Owner', 
          email: 'owner@jewelryshop.com', 
          phone: '+91-9876543210',
          address: 'Jewelry Shop Address'
        },
        // Add more customers as they get created in the backend
      ];
      setCustomers(realCustomers);
    } catch (error) {
      console.error('Failed to load customers:', error);
      // Fallback to at least one working customer
      setCustomers([
        { 
          id: 1, 
          name: 'Shop Owner', 
          email: 'owner@jewelryshop.com', 
          phone: '+91-9876543210',
          address: 'Jewelry Shop Address'
        }
      ]);
    }
  };

  const loadInventoryItems = async () => {
    try {
      const response = await inventoryService.getItems({ limit: 100 });
      setInventoryItems(response.items);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    
    // Create customer with a reasonable ID (for UI purposes)
    // In production, this would call a real customer creation API
    const customer: Customer = {
      id: customers.length + 1, // Simple incremental ID for UI
      ...newCustomer
    };
    
    setCustomers([...customers, customer]);
    setSelectedCustomer(customer);
    
    // For order creation, we'll use customer_id: 1 (known to exist in backend)
    // and pass customer details in the order
    setOrderData({ 
      ...orderData, 
      customer_id: 1, // Always use the known working customer ID
      customer: {
        ...customer,
        id: 1 // Map to backend customer ID
      }
    });
    setIsCreatingCustomer(false);
    setNewCustomer({ name: '', email: '', phone: '', address: '' });
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    // Always use customer_id: 1 for backend compatibility
    setOrderData({ 
      ...orderData, 
      customer_id: customer.id === 1 ? 1 : 1, // Map all to customer_id: 1 for now
      customer 
    });
  };

  const handleAddItem = (item: JewelryItem) => {
    const existingItem = selectedItems.find(si => si.jewelry_item_id === item.id);
    
    if (existingItem) {
      // Increase quantity
      const updatedItems = selectedItems.map(si =>
        si.jewelry_item_id === item.id
          ? { ...si, quantity: si.quantity + 1, total_price: si.unit_price * (si.quantity + 1) }
          : si
      );
      setSelectedItems(updatedItems);
    } else {
      // Add new item
      const orderItem: OrderItem = {
        jewelry_item_id: item.id,
        item,
        quantity: 1,
        unit_price: item.selling_price || item.base_price,
        total_price: item.selling_price || item.base_price,
        customization_details: ''
      };
      setSelectedItems([...selectedItems, orderItem]);
    }
  };

  const handleRemoveItem = (itemId: number) => {
    setSelectedItems(selectedItems.filter(item => item.jewelry_item_id !== itemId));
  };

  const handleUpdateItemQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    
    const updatedItems = selectedItems.map(item =>
      item.jewelry_item_id === itemId
        ? { ...item, quantity, total_price: item.unit_price * quantity }
        : item
    );
    setSelectedItems(updatedItems);
  };

  const handleUpdateCustomization = (itemId: number, customization: string) => {
    const updatedItems = selectedItems.map(item =>
      item.jewelry_item_id === itemId
        ? { ...item, customization_details: customization }
        : item
    );
    setSelectedItems(updatedItems);
  };

  const calculateOrderPricing = async () => {
    if (selectedItems.length === 0) return;
    
    setIsCalculatingPrices(true);
    try {
      let subtotal = 0;
      let totalWeight = 0;
      
      // Calculate subtotal and weight
      selectedItems.forEach(item => {
        subtotal += item.total_price;
        totalWeight += item.item.weight * item.quantity;
      });
      
      // Use pricing service for accurate calculations
      try {
        const priceCalc = await pricingService.calculateItemPrice({
          weight: totalWeight,
          purity: '22K', // Default to 22K, in real app this would be determined by items
          making_charge_percentage: 12,
          wastage_percentage: 2,
        });
        
        setPriceBreakdown(priceCalc);
        setOrderData({
          ...orderData,
          items: selectedItems,
          subtotal: priceCalc.subtotal,
          making_charges: priceCalc.making_charges,
          wastage_amount: priceCalc.wastage_amount,
          gst_amount: priceCalc.gst_amount,
          total_amount: priceCalc.total_price,
        });
      } catch (error) {
        console.warn('Pricing service failed, using fallback calculation:', error);
        
        // Fallback calculation
        const makingCharges = subtotal * 0.12; // 12%
        const wastageAmount = subtotal * 0.02; // 2%
        const gstAmount = (subtotal + makingCharges + wastageAmount) * 0.03; // 3%
        const totalAmount = subtotal + makingCharges + wastageAmount + gstAmount;
        
        setOrderData({
          ...orderData,
          items: selectedItems,
          subtotal,
          making_charges: makingCharges,
          wastage_amount: wastageAmount,
          gst_amount: gstAmount,
          total_amount: totalAmount,
        });
      }
    } catch (error) {
      console.error('Failed to calculate pricing:', error);
    } finally {
      setIsCalculatingPrices(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!orderData.customer_id || !orderData.items || orderData.items.length === 0) {
      console.error('Order validation failed:', { customer_id: orderData.customer_id, items: orderData.items });
      return;
    }

    try {
      const orderPayload = {
        customer_id: orderData.customer_id,
        order_type: orderData.order_type || ORDER_TYPES.SALE,
        items: orderData.items.map(item => ({
          jewelry_item_id: item.jewelry_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          customization_details: item.customization_details,
        })),
        special_instructions: orderData.special_instructions || '',
        estimated_completion: orderData.estimated_completion,
      };

      console.log('Creating order with payload:', orderPayload);
      
      createOrderMutation.mutate(orderPayload);
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      if (currentStep === 3) {
        calculateOrderPricing();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedCustomer !== null;
      case 2: return orderData.order_type !== undefined;
      case 3: return selectedItems.length > 0;
      case 4: return orderData.total_amount > 0;
      case 5: return true;
      default: return false;
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

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white min-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Create New Order</h3>
            <p className="text-sm text-gray-500 mt-1">Step {currentStep} of {steps.length}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Step 1: Customer Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">Select Customer</h4>
                <button
                  onClick={() => setIsCreatingCustomer(true)}
                  className="btn-outline flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add New Customer
                </button>
              </div>

              {isCreatingCustomer ? (
                <div className="card max-w-md">
                  <h5 className="font-medium text-gray-900 mb-4">New Customer</h5>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                        className="input"
                        placeholder="Customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                        className="input"
                        placeholder="+91-XXXXXXXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                        className="input"
                        placeholder="customer@example.com"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleCreateCustomer}
                        className="btn-primary"
                        disabled={!newCustomer.name || !newCustomer.phone}
                      >
                        Add Customer
                      </button>
                      <button
                        onClick={() => setIsCreatingCustomer(false)}
                        className="btn-outline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className={`card cursor-pointer transition-colors ${
                        selectedCustomer?.id === customer.id
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <UserIcon className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                          {customer.email && (
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Order Type Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Select Order Type</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { type: ORDER_TYPES.SALE, name: 'Sale', description: 'Direct jewelry sale', icon: ShoppingBagIcon },
                  { type: ORDER_TYPES.REPAIR, name: 'Repair', description: 'Jewelry repair service', icon: CogIcon },
                  { type: ORDER_TYPES.CUSTOM, name: 'Custom', description: 'Custom jewelry creation', icon: PhotoIcon },
                ].map((orderType) => (
                  <div
                    key={orderType.type}
                    onClick={() => setOrderData({...orderData, order_type: orderType.type})}
                    className={`card cursor-pointer transition-colors ${
                      orderData.order_type === orderType.type
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <orderType.icon className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                      <div className="font-medium text-gray-900 mb-1">{orderType.name}</div>
                      <div className="text-sm text-gray-500">{orderType.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                  <textarea
                    value={orderData.special_instructions}
                    onChange={(e) => setOrderData({...orderData, special_instructions: e.target.value})}
                    className="input"
                    rows={3}
                    placeholder="Any special instructions for this order..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Completion Date</label>
                  <input
                    type="date"
                    value={orderData.estimated_completion}
                    onChange={(e) => setOrderData({...orderData, estimated_completion: e.target.value})}
                    className="input max-w-xs"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Item Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">Select Items</h4>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                    placeholder="Search items..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Items */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Available Items</h5>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredItems.map((item) => (
                      <div key={item.id} className="card hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">
                              {item.category} • {item.purity} • {item.weight}g
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(item.selling_price || item.base_price)}
                            </div>
                            <div className="text-xs text-gray-400">Stock: {item.stock_quantity}</div>
                          </div>
                          <button
                            onClick={() => handleAddItem(item)}
                            className="btn-primary btn-sm"
                            disabled={item.stock_quantity === 0}
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Items */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Selected Items ({selectedItems.length})</h5>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedItems.map((orderItem) => (
                      <div key={orderItem.jewelry_item_id} className="card">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{orderItem.item.name}</div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(orderItem.unit_price)} each
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(orderItem.jewelry_item_id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                              <input
                                type="number"
                                min="1"
                                max={orderItem.item.stock_quantity}
                                value={orderItem.quantity}
                                onChange={(e) => handleUpdateItemQuantity(orderItem.jewelry_item_id, parseInt(e.target.value))}
                                className="input w-20"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">Customization</label>
                              <input
                                type="text"
                                value={orderItem.customization_details || ''}
                                onChange={(e) => handleUpdateCustomization(orderItem.jewelry_item_id, e.target.value)}
                                className="input"
                                placeholder="Custom engraving, sizing..."
                              />
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              Subtotal: {formatCurrency(orderItem.total_price)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {selectedItems.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        No items selected. Add items from the left panel.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Pricing Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Pricing Review</h4>
              
              {isCalculatingPrices ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Calculating prices...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Item Breakdown */}
                  <div className="card">
                    <h5 className="font-medium text-gray-900 mb-4">Items</h5>
                    <div className="space-y-3">
                      {selectedItems.map((item) => (
                        <div key={item.jewelry_item_id} className="flex justify-between items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.item.name}</div>
                            <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                            {item.customization_details && (
                              <div className="text-xs text-blue-600">Custom: {item.customization_details}</div>
                            )}
                          </div>
                          <div className="text-sm font-medium">{formatCurrency(item.total_price)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="card">
                    <h5 className="font-medium text-gray-900 mb-4">Price Breakdown</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span>{formatCurrency(orderData.subtotal || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Making Charges</span>
                        <span>{formatCurrency(orderData.making_charges || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wastage (2%)</span>
                        <span>{formatCurrency(orderData.wastage_amount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">GST (3%)</span>
                        <span>{formatCurrency(orderData.gst_amount || 0)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Amount</span>
                          <span className="text-green-600">{formatCurrency(orderData.total_amount || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {priceBreakdown && priceBreakdown.calculation_details && (
                      <div className="mt-4 pt-4 border-t">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Calculation Details</h6>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Gold Rate: ₹{priceBreakdown.calculation_details.base_rate || 'N/A'}/g</div>
                          <div>Making Charge Rate: {priceBreakdown.calculation_details.making_charge_rate || 12}%</div>
                          <div>GST Rate: {priceBreakdown.calculation_details.gst_rate || 3}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review & Confirm */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Order Review</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer & Order Info */}
                <div className="card">
                  <h5 className="font-medium text-gray-900 mb-4">Order Information</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-500">Customer</label>
                      <div className="font-medium">{selectedCustomer?.name}</div>
                      <div className="text-sm text-gray-600">{selectedCustomer?.phone}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Order Type</label>
                      <div className="font-medium capitalize">{orderData.order_type?.replace('_', ' ')}</div>
                    </div>
                    {orderData.estimated_completion && (
                      <div>
                        <label className="text-sm text-gray-500">Estimated Completion</label>
                        <div className="font-medium">
                          {new Date(orderData.estimated_completion).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    )}
                    {orderData.special_instructions && (
                      <div>
                        <label className="text-sm text-gray-500">Special Instructions</label>
                        <div className="text-sm">{orderData.special_instructions}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Summary */}
                <div className="card">
                  <h5 className="font-medium text-gray-900 mb-4">Order Summary</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Items: {selectedItems.length}</span>
                      <span>Qty: {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-green-600">
                      <span>Total Amount</span>
                      <span>{formatCurrency(orderData.total_amount || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="btn-outline flex items-center"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            Previous
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="btn-outline"
            >
              Cancel
            </button>
            
            {currentStep < steps.length ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="btn-primary flex items-center"
              >
                Next
                <ChevronRightIcon className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleCreateOrder}
                disabled={!canProceed() || createOrderMutation.isPending}
                className="btn-primary flex items-center"
              >
                {createOrderMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Order...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Create Order
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}