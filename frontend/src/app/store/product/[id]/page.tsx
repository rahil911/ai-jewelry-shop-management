'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  HeartIcon,
  ShareIcon,
  StarIcon,
  ShoppingCartIcon,
  ArrowLeftIcon,
  EyeIcon,
  ShieldCheckIcon,
  TruckIcon,
  CurrencyRupeeIcon,
  ScaleIcon,
  GemIcon,
  SparklesIcon,
  CameraIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useInventory } from '@/lib/hooks/useInventory';
import { usePricing } from '@/lib/hooks/usePricing';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { InventoryItem } from '@/lib/api/services/inventory';
import { formatCurrency } from '@/lib/utils/formatters';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedCustomization, setSelectedCustomization] = useState<string | null>(null);
  const [showCustomizationForm, setShowCustomizationForm] = useState(false);
  const [customizationNotes, setCustomizationNotes] = useState('');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const { getItemById } = useInventory();
  const { calculatePrice } = usePricing();
  const { createCustomerInquiry } = useCustomers();
  
  const item: InventoryItem | undefined = getItemById(id);
  const priceCalculation = calculatePrice(item?.weight || 0, item?.purity || '', item?.making_charge_percentage || 0);

  // Mock data for enhanced product information
  const mockImages = [
    '/api/placeholder/600/600',
    '/api/placeholder/600/600', 
    '/api/placeholder/600/600',
    '/api/placeholder/600/600'
  ];

  const mockReviews = [
    {
      id: '1',
      customer_name: 'Priya Sharma',
      rating: 5,
      comment: 'Absolutely beautiful! The craftsmanship is exceptional and the gold quality is perfect.',
      date: '2024-06-20',
      verified: true
    },
    {
      id: '2', 
      customer_name: 'Rajesh Kumar',
      rating: 5,
      comment: 'Bought this for my wife. She loves it! Great value for money and excellent service.',
      date: '2024-06-18',
      verified: true
    },
    {
      id: '3',
      customer_name: 'Lakshmi Devi',
      rating: 4,
      comment: 'Very nice design. The delivery was quick and packaging was secure.',
      date: '2024-06-15',
      verified: false
    }
  ];

  const customizationOptions = [
    { id: 'size', name: 'Size Adjustment', price: 500, description: 'Adjust ring/bangle size' },
    { id: 'engraving', name: 'Custom Engraving', price: 1000, description: 'Personalized text engraving' },
    { id: 'stones', name: 'Add Gemstones', price: 2500, description: 'Add precious/semi-precious stones' },
    { id: 'chain', name: 'Chain Length', price: 800, description: 'Adjust chain length (for necklaces)' }
  ];

  const sizeOptions = ['14', '16', '18', '20', '22', '24'];

  useEffect(() => {
    // Check if item is in wishlist (mock implementation)
    setIsWishlisted(Math.random() > 0.5);
  }, [id]);

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/store')}
            className="btn-primary"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    // Mock cart functionality
    alert(`Added ${item.name} to cart! (${quantity} item${quantity > 1 ? 's' : ''})`);
  };

  const handleBuyNow = () => {
    // Mock checkout functionality
    alert('Redirecting to checkout...');
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const handleCustomizationRequest = () => {
    if (selectedCustomization && customizationNotes.trim()) {
      createCustomerInquiry.mutate({
        customer_name: 'Current Customer',
        email: 'customer@example.com',
        phone: '+91 9876543210',
        inquiry_type: 'customization',
        product_id: item.id,
        message: `Customization Request: ${selectedCustomization}\nNotes: ${customizationNotes}`,
        priority: 'medium'
      });
      setShowCustomizationForm(false);
      setCustomizationNotes('');
      setSelectedCustomization(null);
      alert('Customization request submitted! We will contact you within 24 hours.');
    }
  };

  const totalPrice = priceCalculation?.total_price || item.selling_price;
  const customizationPrice = selectedCustomization ? 
    customizationOptions.find(opt => opt.id === selectedCustomization)?.price || 0 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleWishlist}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              {isWishlisted ? (
                <HeartSolidIcon className="h-6 w-6 text-red-500" />
              ) : (
                <HeartIcon className="h-6 w-6 text-gray-600" />
              )}
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <ShareIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden">
              <Image
                src={mockImages[selectedImage]}
                alt={item.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {mockImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-white rounded-lg border-2 overflow-hidden ${
                    selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${item.name} ${index + 1}`}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* 360° View Button */}
            <button className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 flex items-center justify-center hover:bg-gray-50">
              <EyeIcon className="h-5 w-5 mr-2" />
              360° View
            </button>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  In Stock
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {item.category}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.name}</h1>
              <p className="text-gray-600">SKU: {item.sku}</p>
              
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarSolidIcon key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(3 reviews)</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t border-gray-200 pt-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {formatCurrency(totalPrice + (customizationPrice * quantity))}
              </div>
              {priceCalculation && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Gold Rate: {formatCurrency(priceCalculation.gold_rate_per_gram)}/gram</p>
                  <p>Weight: {item.weight}g ({item.purity})</p>
                  <p>Making Charges: {item.making_charge_percentage}%</p>
                  {customizationPrice > 0 && (
                    <p className="text-blue-600">Customization: +{formatCurrency(customizationPrice)}</p>
                  )}
                </div>
              )}
            </div>

            {/* Product Specifications */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <ScaleIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="font-medium">{item.weight}g</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <GemIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Purity</p>
                    <p className="font-medium">{item.purity}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <SparklesIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Making Charges</p>
                    <p className="font-medium">{item.making_charge_percentage}%</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Certification</p>
                    <p className="font-medium">BIS Hallmarked</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Size Selection (for rings/bangles) */}
            {(item.category === 'rings' || item.category === 'bangles') && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Size</h3>
                <div className="grid grid-cols-6 gap-2">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 px-3 border rounded-md text-center ${
                        selectedSize === size
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center space-x-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleBuyNow}
                  className="w-full btn-primary py-3 text-lg"
                >
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  className="w-full btn-secondary py-3 text-lg flex items-center justify-center"
                >
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Customization Options */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customization Options</h3>
              <div className="space-y-3">
                {customizationOptions.map((option) => (
                  <div key={option.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id={option.id}
                        name="customization"
                        value={option.id}
                        checked={selectedCustomization === option.id}
                        onChange={(e) => setSelectedCustomization(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium">{option.name}</p>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </div>
                    <span className="font-medium text-gray-900">+{formatCurrency(option.price)}</span>
                  </div>
                ))}
              </div>
              
              {selectedCustomization && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowCustomizationForm(true)}
                    className="btn-secondary"
                  >
                    Request Customization
                  </button>
                </div>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <ShieldCheckIcon className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium">100% Authentic</p>
                    <p className="text-sm text-gray-600">BIS Hallmarked</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <TruckIcon className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">Free Delivery</p>
                    <p className="text-sm text-gray-600">Within 3-5 days</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CurrencyRupeeIcon className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="font-medium">Easy Returns</p>
                    <p className="text-sm text-gray-600">7-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description & Reviews */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Description */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Description</h3>
            <div className="prose prose-sm text-gray-600">
              <p>
                {item.description || `Exquisite ${item.name} crafted with precision and attention to detail. This beautiful piece features high-quality ${item.purity} gold with expert craftsmanship that reflects traditional Indian jewelry making techniques.`}
              </p>
              {!showFullDescription && (
                <button
                  onClick={() => setShowFullDescription(true)}
                  className="text-blue-600 hover:text-blue-800 mt-2"
                >
                  Read more...
                </button>
              )}
              {showFullDescription && (
                <div className="mt-4">
                  <p>
                    Perfect for special occasions and daily wear, this piece combines traditional elegance with contemporary style. The intricate design work showcases the skilled artisanship that goes into every piece at Sri Lakshmi Jewellers.
                  </p>
                  <p>
                    Each item comes with proper certification and is backed by our quality guarantee. We use only the finest materials and time-tested techniques to ensure lasting beauty and durability.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Customer Reviews</h3>
            <div className="space-y-4">
              {mockReviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{review.customer_name}</span>
                      {review.verified && (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarSolidIcon
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{review.comment}</p>
                  <p className="text-xs text-gray-500">{review.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Have Questions?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-6 w-6 text-blue-500" />
              <div>
                <p className="font-medium">Call Us</p>
                <p className="text-gray-600">+91 9876543210</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-medium">Email Us</p>
                <p className="text-gray-600">info@srilakshmijewellers.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomizationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Customization Request</h3>
              <button
                onClick={() => setShowCustomizationForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Selected: {customizationOptions.find(opt => opt.id === selectedCustomization)?.name}
              </p>
              <textarea
                value={customizationNotes}
                onChange={(e) => setCustomizationNotes(e.target.value)}
                placeholder="Please describe your customization requirements..."
                className="w-full p-3 border border-gray-300 rounded-md resize-none"
                rows={4}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCustomizationForm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomizationRequest}
                className="flex-1 btn-primary"
                disabled={!customizationNotes.trim()}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}