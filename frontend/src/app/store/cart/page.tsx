'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
  HeartIcon,
  GiftIcon,
  TruckIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatCurrency } from '@/lib/utils/formatters';

export default function ShoppingCartPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [cartItems, setCartItems] = useState([
    {
      id: '1',
      product_id: 'ITEM001',
      name: '22K Gold Temple Necklace',
      sku: 'GN001',
      image: '/api/placeholder/200/200',
      price: 285000,
      quantity: 1,
      weight: 45,
      purity: '22K',
      customization: 'Custom engraving: "Blessed"',
      estimated_delivery: '2024-07-05',
      in_stock: true
    },
    {
      id: '2',
      product_id: 'ITEM002', 
      name: '18K Diamond Earrings',
      sku: 'GE002',
      image: '/api/placeholder/200/200',
      price: 125000,
      quantity: 1,
      weight: 8,
      purity: '18K',
      customization: null,
      estimated_delivery: '2024-07-03',
      in_stock: true
    },
    {
      id: '3',
      product_id: 'ITEM003',
      name: '22K Gold Bangle Set',
      sku: 'GB003',
      image: '/api/placeholder/200/200',
      price: 195000,
      quantity: 2,
      weight: 35,
      purity: '22K',
      customization: 'Size adjustment to 2.6 inches',
      estimated_delivery: '2024-07-10',
      in_stock: false
    }
  ]);

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    delivery_address: '123 MG Road, Bangalore, Karnataka 560001',
    phone: '+91 9876543210',
    special_instructions: ''
  });

  const promoCodes = {
    'WELCOME10': { discount: 0.10, description: '10% off for new customers' },
    'GOLD15': { discount: 0.15, description: '15% off on gold jewelry' },
    'FESTIVE20': { discount: 0.20, description: '20% off festive collection' }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(itemId);
      return;
    }
    
    setCartItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, newQuantity) }
          : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setCartItems(items => items.filter(item => item.id !== itemId));
  };

  const moveToWishlist = (itemId: string) => {
    // Mock functionality
    removeItem(itemId);
    alert('Item moved to wishlist!');
  };

  const applyPromoCode = () => {
    const promo = promoCodes[promoCode.toUpperCase() as keyof typeof promoCodes];
    if (promo) {
      setAppliedPromo({ code: promoCode.toUpperCase(), ...promo });
      setPromoCode('');
      alert(`Promo code applied! ${promo.description}`);
    } else {
      alert('Invalid promo code. Please try again.');
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    return calculateSubtotal() * appliedPromo.discount;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = (subtotal - discount) * 0.03; // 3% GST
    return subtotal - discount + tax;
  };

  const getTotalWeight = () => {
    return cartItems.reduce((total, item) => total + (item.weight * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (!user) {
      router.push('/auth/login?redirect=/store/cart');
      return;
    }
    
    if (cartItems.some(item => !item.in_stock)) {
      alert('Some items in your cart are out of stock. Please remove them before proceeding.');
      return;
    }

    setShowCheckoutForm(true);
  };

  const processOrder = () => {
    // Mock order processing
    const orderData = {
      items: cartItems,
      subtotal: calculateSubtotal(),
      discount: calculateDiscount(),
      total: calculateTotal(),
      payment_method: selectedPaymentMethod,
      customer_data: checkoutData,
      promo_code: appliedPromo?.code
    };

    console.log('Processing order:', orderData);
    
    // Simulate processing
    setTimeout(() => {
      alert('Order placed successfully! You will receive a confirmation email shortly.');
      setCartItems([]);
      setShowCheckoutForm(false);
      router.push('/store/track?order=ORD' + Date.now());
    }, 2000);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <button
              onClick={() => router.push('/store')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Continue Shopping
            </button>
            <h1 className="text-xl font-bold text-gray-900">Shopping Cart</h1>
            <div></div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any beautiful jewelry to your cart yet.
          </p>
          <button
            onClick={() => router.push('/store')}
            className="btn-primary"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/store')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Continue Shopping
          </button>
          <h1 className="text-xl font-bold text-gray-900">Shopping Cart ({cartItems.length})</h1>
          <div></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={120}
                      height={120}
                      className="object-cover rounded-lg"
                    />
                    {!item.in_stock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>Weight: {item.weight}g</span>
                          <span>Purity: {item.purity}</span>
                        </div>
                        {item.customization && (
                          <p className="text-sm text-blue-600 mt-1">✨ {item.customization}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          Est. Delivery: {new Date(item.estimated_delivery).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(item.price)}
                        </p>
                        <p className="text-sm text-gray-500">per item</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-gray-50"
                            disabled={!item.in_stock}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="px-3 py-2 border-x border-gray-300">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-50"
                            disabled={!item.in_stock}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <span className="text-lg font-medium text-gray-900">
                          = {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => moveToWishlist(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500"
                          title="Move to Wishlist"
                        >
                          <HeartIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500"
                          title="Remove from Cart"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {!item.in_stock && (
                      <div className="mt-3 flex items-center text-orange-600 text-sm">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                        This item is currently out of stock. Remove it to proceed with checkout.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Summary Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <TruckIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <span>Free delivery on orders above ₹50,000</span>
                </div>
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span>100% Authentic & BIS Hallmarked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Total Weight</span>
                  <span>{getTotalWeight()}g</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center">
                      <ReceiptPercentIcon className="h-4 w-4 mr-1" />
                      {appliedPromo.code} ({(appliedPromo.discount * 100).toFixed(0)}% off)
                    </span>
                    <div className="flex items-center">
                      <span>-{formatCurrency(calculateDiscount())}</span>
                      <button
                        onClick={removePromoCode}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>GST (3%)</span>
                  <span>{formatCurrency((calculateSubtotal() - calculateDiscount()) * 0.03)}</span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              {!appliedPromo && (
                <div className="mt-6">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={applyPromoCode}
                      className="btn-secondary px-4 py-2 text-sm"
                      disabled={!promoCode.trim()}
                    >
                      Apply
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Try: WELCOME10, GOLD15, or FESTIVE20
                  </p>
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={cartItems.some(item => !item.in_stock)}
                className="w-full btn-primary mt-6 py-3 text-lg"
              >
                {!user ? 'Sign In to Checkout' : 'Proceed to Checkout'}
              </button>

              {/* Trust Indicators */}
              <div className="mt-6 space-y-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-3" />
                  <span>Secure checkout & payment</span>
                </div>
                <div className="flex items-center">
                  <TruckIcon className="h-5 w-5 text-blue-500 mr-3" />
                  <span>Free insured delivery</span>
                </div>
                <div className="flex items-center">
                  <GiftIcon className="h-5 w-5 text-purple-500 mr-3" />
                  <span>7-day easy returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
                <button
                  onClick={() => setShowCheckoutForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Delivery Address */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Delivery Address</h3>
                  <textarea
                    value={checkoutData.delivery_address}
                    onChange={(e) => setCheckoutData({...checkoutData, delivery_address: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
                  <input
                    type="tel"
                    value={checkoutData.phone}
                    onChange={(e) => setCheckoutData({...checkoutData, phone: e.target.value})}
                    placeholder="Phone number"
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'card', name: 'Credit/Debit Card', icon: CreditCardIcon },
                      { id: 'upi', name: 'UPI Payment', icon: DevicePhoneMobileIcon },
                      { id: 'bank', name: 'Bank Transfer', icon: BanknotesIcon },
                    ].map((method) => {
                      const IconComponent = method.icon;
                      return (
                        <label key={method.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="payment"
                            value={method.id}
                            checked={selectedPaymentMethod === method.id}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className="mr-3"
                          />
                          <IconComponent className="h-5 w-5 mr-3 text-gray-400" />
                          <span>{method.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Special Instructions (Optional)</h3>
                  <textarea
                    value={checkoutData.special_instructions}
                    onChange={(e) => setCheckoutData({...checkoutData, special_instructions: e.target.value})}
                    placeholder="Any special delivery instructions..."
                    className="w-full p-3 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    {appliedPromo && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({appliedPromo.code})</span>
                        <span>-{formatCurrency(calculateDiscount())}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>GST</span>
                      <span>{formatCurrency((calculateSubtotal() - calculateDiscount()) * 0.03)}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowCheckoutForm(false)}
                    className="flex-1 btn-secondary py-3"
                  >
                    Back to Cart
                  </button>
                  <button
                    onClick={processOrder}
                    className="flex-1 btn-primary py-3"
                  >
                    Place Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}