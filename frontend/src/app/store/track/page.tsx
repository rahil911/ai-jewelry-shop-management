'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  ShoppingBagIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils/formatters';

export default function OrderTrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('order') || '');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock tracking data
  const mockTrackingData = {
    'ORD001': {
      id: 'ORD001',
      customer_name: 'Priya Sharma',
      phone: '+91 9876543210',
      email: 'priya.sharma@email.com',
      order_date: '2024-06-20',
      estimated_delivery: '2024-06-25',
      total_amount: 125000,
      payment_status: 'paid',
      current_status: 'delivered',
      tracking_number: 'TRK123456789',
      courier_service: 'Professional Courier Services',
      delivery_address: '123 MG Road, Bangalore, Karnataka 560001',
      items: [
        {
          id: '1',
          name: '22K Gold Necklace Set',
          sku: 'GN001',
          quantity: 1,
          price: 125000,
          image: '/api/placeholder/100/100',
          customization: 'Custom engraving: "PM ❤️ RS"'
        }
      ],
      timeline: [
        {
          status: 'order_placed',
          title: 'Order Placed',
          description: 'Your order has been successfully placed and payment confirmed.',
          timestamp: '2024-06-20T10:30:00Z',
          completed: true
        },
        {
          status: 'order_confirmed',
          title: 'Order Confirmed',
          description: 'Order confirmed and sent to production team.',
          timestamp: '2024-06-20T14:15:00Z',
          completed: true
        },
        {
          status: 'in_production',
          title: 'In Production',
          description: 'Your jewelry is being crafted by our skilled artisans.',
          timestamp: '2024-06-21T09:00:00Z',
          completed: true
        },
        {
          status: 'quality_check',
          title: 'Quality Check',
          description: 'Quality inspection and BIS hallmarking completed.',
          timestamp: '2024-06-22T16:30:00Z',
          completed: true
        },
        {
          status: 'packaging',
          title: 'Packaging',
          description: 'Order carefully packaged for secure delivery.',
          timestamp: '2024-06-23T11:20:00Z',
          completed: true
        },
        {
          status: 'shipped',
          title: 'Shipped',
          description: 'Package handed over to courier service.',
          timestamp: '2024-06-23T17:45:00Z',
          completed: true
        },
        {
          status: 'out_for_delivery',
          title: 'Out for Delivery',
          description: 'Package is out for delivery in your area.',
          timestamp: '2024-06-25T08:00:00Z',
          completed: true
        },
        {
          status: 'delivered',
          title: 'Delivered',
          description: 'Package delivered successfully. Thank you for shopping with us!',
          timestamp: '2024-06-25T14:30:00Z',
          completed: true
        }
      ],
      updates: [
        {
          timestamp: '2024-06-25T14:30:00Z',
          message: 'Package delivered successfully to Priya Sharma',
          location: 'MG Road, Bangalore'
        },
        {
          timestamp: '2024-06-25T08:00:00Z',
          message: 'Out for delivery - Expected delivery by 6 PM',
          location: 'Bangalore Delivery Hub'
        },
        {
          timestamp: '2024-06-24T20:15:00Z',
          message: 'Package arrived at local delivery facility',
          location: 'Bangalore Hub'
        },
        {
          timestamp: '2024-06-23T17:45:00Z',
          message: 'Package shipped from warehouse',
          location: 'Sri Lakshmi Jewellers - Bangalore'
        }
      ]
    },
    'ORD002': {
      id: 'ORD002',
      customer_name: 'Rajesh Kumar',
      phone: '+91 9876543211',
      email: 'rajesh.kumar@email.com',
      order_date: '2024-06-15',
      estimated_delivery: '2024-06-22',
      total_amount: 85000,
      payment_status: 'paid',
      current_status: 'in_production',
      tracking_number: 'TRK987654321',
      courier_service: 'Express Delivery',
      delivery_address: '456 Brigade Road, Bangalore, Karnataka 560025',
      items: [
        {
          id: '2',
          name: '18K Gold Diamond Earrings',
          sku: 'GE002',
          quantity: 1,
          price: 85000,
          image: '/api/placeholder/100/100',
          customization: 'No customization'
        }
      ],
      timeline: [
        {
          status: 'order_placed',
          title: 'Order Placed',
          description: 'Your order has been successfully placed and payment confirmed.',
          timestamp: '2024-06-15T11:20:00Z',
          completed: true
        },
        {
          status: 'order_confirmed',
          title: 'Order Confirmed',
          description: 'Order confirmed and sent to production team.',
          timestamp: '2024-06-15T15:30:00Z',
          completed: true
        },
        {
          status: 'in_production',
          title: 'In Production',
          description: 'Your jewelry is being crafted by our skilled artisans.',
          timestamp: '2024-06-16T10:00:00Z',
          completed: true
        },
        {
          status: 'quality_check',
          title: 'Quality Check',
          description: 'Quality inspection and certification in progress.',
          timestamp: null,
          completed: false
        },
        {
          status: 'packaging',
          title: 'Packaging',
          description: 'Order will be carefully packaged for secure delivery.',
          timestamp: null,
          completed: false
        },
        {
          status: 'shipped',
          title: 'Shipped',
          description: 'Package will be handed over to courier service.',
          timestamp: null,
          completed: false
        },
        {
          status: 'delivered',
          title: 'Delivered',
          description: 'Package will be delivered to your address.',
          timestamp: null,
          completed: false
        }
      ],
      updates: [
        {
          timestamp: '2024-06-18T14:20:00Z',
          message: 'Diamond setting in progress - Expected completion by June 20',
          location: 'Production Workshop'
        },
        {
          timestamp: '2024-06-16T10:00:00Z',
          message: 'Production started - Gold work in progress',
          location: 'Production Workshop'
        },
        {
          timestamp: '2024-06-15T15:30:00Z',
          message: 'Order confirmed and materials allocated',
          location: 'Sri Lakshmi Jewellers'
        }
      ]
    }
  };

  const handleTrackOrder = () => {
    if (!orderId.trim()) {
      setError('Please enter a valid Order ID');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      const data = mockTrackingData[orderId.toUpperCase()];
      if (data) {
        setTrackingData(data);
        setError('');
      } else {
        setError('Order not found. Please check your Order ID and try again.');
        setTrackingData(null);
      }
      setIsLoading(false);
    }, 1000);
  };

  const getStatusIcon = (status: string, completed: boolean) => {
    if (completed) {
      return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    }
    
    switch (status) {
      case 'in_production':
      case 'quality_check':
      case 'packaging':
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
      case 'shipped':
      case 'out_for_delivery':
        return <TruckIcon className="h-6 w-6 text-blue-500" />;
      case 'delivered':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'shipped':
      case 'out_for_delivery':
        return 'text-blue-600 bg-blue-100';
      case 'in_production':
      case 'quality_check':
      case 'packaging':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/store')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Store
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
                <p className="text-gray-600">Enter your order ID to get real-time updates</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="max-w-md mx-auto">
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                  placeholder="Enter Order ID (e.g., ORD001)"
                  className="input"
                />
              </div>
              <button
                onClick={handleTrackOrder}
                disabled={isLoading}
                className="btn-primary flex items-center px-6"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                )}
                Track
              </button>
            </div>
            
            {error && (
              <div className="mt-3 flex items-center text-red-600">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Try sample order IDs:</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setOrderId('ORD001')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ORD001 (Delivered)
              </button>
              <button
                onClick={() => setOrderId('ORD002')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ORD002 (In Production)
              </button>
            </div>
          </div>
        </div>

        {/* Tracking Results */}
        {trackingData && (
          <div className="space-y-8">
            {/* Order Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Order #{trackingData.id}</h2>
                  <p className="text-gray-600">Placed on {new Date(trackingData.order_date).toLocaleDateString()}</p>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trackingData.current_status)}`}>
                  {trackingData.current_status.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      {trackingData.customer_name}
                    </p>
                    <p className="flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      {trackingData.phone}
                    </p>
                    <p className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      {trackingData.email}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Delivery Information</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Est. Delivery: {new Date(trackingData.estimated_delivery).toLocaleDateString()}
                    </p>
                    <p className="flex items-center">
                      <TruckIcon className="h-4 w-4 mr-2" />
                      {trackingData.courier_service}
                    </p>
                    {trackingData.tracking_number && (
                      <p className="flex items-center">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        {trackingData.tracking_number}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center">
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      Total: {formatCurrency(trackingData.total_amount)}
                    </p>
                    <p className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Payment: {trackingData.payment_status}
                    </p>
                    <p className="flex items-center">
                      <ShoppingBagIcon className="h-4 w-4 mr-2" />
                      {trackingData.items.length} item(s)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {trackingData.items.map((item: any) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.customization !== 'No customization' && (
                        <p className="text-sm text-blue-600">✨ {item.customization}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Timeline</h3>
              <div className="relative">
                {trackingData.timeline.map((step: any, index: number) => (
                  <div key={step.status} className="flex items-start space-x-4 pb-8 last:pb-0">
                    <div className="flex-shrink-0 relative">
                      {getStatusIcon(step.status, step.completed)}
                      {index < trackingData.timeline.length - 1 && (
                        <div 
                          className={`absolute top-8 left-3 w-0.5 h-16 ${
                            step.completed ? 'bg-green-200' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                          {step.title}
                        </h4>
                        {step.timestamp && (
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(step.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${step.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <p className="text-gray-600">{trackingData.delivery_address}</p>
              </div>
            </div>

            {/* Recent Updates */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Updates</h3>
              <div className="space-y-3">
                {trackingData.updates.map((update: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <BellIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{update.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">{update.location}</p>
                        <p className="text-xs text-gray-500">{formatTimestamp(update.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
                  <p className="text-gray-600">
                    Have questions about your order? Our customer support team is here to help.
                  </p>
                </div>
                <button className="btn-primary flex items-center">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  Contact Support
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Call Us</p>
                    <p className="text-sm text-gray-600">+91 9876543210 (9 AM - 8 PM)</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">Email Us</p>
                    <p className="text-sm text-gray-600">support@srilakshmijewellers.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!trackingData && !error && (
          <div className="text-center py-12">
            <TruckIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Track Your Order</h3>
            <p className="text-gray-600">
              Enter your order ID above to get real-time updates on your jewelry order.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}