'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserIcon,
  ShoppingBagIcon,
  HeartIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  StarIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CurrencyRupeeIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/AuthContext';
import { useOrders } from '@/lib/hooks/useOrders';
import { formatCurrency } from '@/lib/utils/formatters';

export default function CustomerAccountPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { orders } = useOrders();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Priya Sharma',
    email: user?.email || 'priya.sharma@email.com',
    phone: '+91 9876543210',
    dateOfBirth: '1985-03-15',
    anniversary: '2010-12-01',
    address: '123 MG Road, Bangalore, Karnataka 560001',
    preferences: {
      notifications: true,
      promotions: true,
      newsletter: false
    }
  });

  // Mock data for customer features
  const customerOrders = [
    {
      id: 'ORD001',
      date: '2024-06-20',
      status: 'delivered',
      total: 125000,
      items: [
        { name: '22K Gold Necklace', image: '/api/placeholder/100/100', price: 125000 }
      ]
    },
    {
      id: 'ORD002', 
      date: '2024-06-15',
      status: 'processing',
      total: 85000,
      items: [
        { name: '18K Gold Earrings', image: '/api/placeholder/100/100', price: 85000 }
      ]
    },
    {
      id: 'ORD003',
      date: '2024-06-10',
      status: 'shipped',
      total: 195000,
      items: [
        { name: '22K Gold Bangle Set', image: '/api/placeholder/100/100', price: 195000 }
      ]
    }
  ];

  const wishlistItems = [
    {
      id: '1',
      name: '22K Gold Temple Necklace',
      price: 285000,
      image: '/api/placeholder/200/200',
      inStock: true
    },
    {
      id: '2', 
      name: 'Diamond Earrings',
      price: 150000,
      image: '/api/placeholder/200/200',
      inStock: false
    },
    {
      id: '3',
      name: 'Antique Gold Ring',
      price: 45000,
      image: '/api/placeholder/200/200',
      inStock: true
    }
  ];

  const loyaltyPoints = {
    current: 2850,
    tier: 'Gold',
    nextTier: 'Platinum',
    pointsToNext: 1150,
    rewardsAvailable: [
      { name: '₹500 Off Your Next Purchase', points: 1000, available: true },
      { name: 'Free Jewelry Cleaning', points: 500, available: true },
      { name: '₹1000 Off Premium Collection', points: 2000, available: true },
      { name: 'Free Home Delivery', points: 200, available: true }
    ]
  };

  const certificates = [
    {
      id: 'CERT001',
      productName: '22K Gold Necklace',
      certificateType: 'BIS Hallmark',
      issueDate: '2024-06-20',
      validTill: '2029-06-20',
      downloadUrl: '#'
    },
    {
      id: 'CERT002',
      productName: '18K Gold Earrings', 
      certificateType: 'Purity Certificate',
      issueDate: '2024-06-15',
      validTill: '2029-06-15',
      downloadUrl: '#'
    }
  ];

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'orders', name: 'My Orders', icon: ShoppingBagIcon },
    { id: 'wishlist', name: 'Wishlist', icon: HeartIcon },
    { id: 'rewards', name: 'Rewards', icon: GiftIcon },
    { id: 'certificates', name: 'Certificates', icon: ShieldCheckIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon }
  ];

  const handleSaveProfile = () => {
    setIsEditing(false);
    // API call to update profile would go here
    alert('Profile updated successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'shipped': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return CheckCircleIcon;
      case 'shipped': return TruckIcon;
      case 'processing': return ClockIcon;
      default: return ClockIcon;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Sign In</h2>
          <p className="text-gray-600 mb-6">Access your account to view orders, wishlist, and more.</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="btn-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
                <p className="text-gray-600">Welcome back, {profileData.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                loyaltyPoints.tier === 'Gold' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : loyaltyPoints.tier === 'Silver'
                  ? 'bg-gray-100 text-gray-800'  
                  : 'bg-purple-100 text-purple-800'
              }`}>
                <StarIcon className="h-4 w-4 mr-1" />
                {loyaltyPoints.tier} Member
              </span>
              <span className="text-sm text-gray-500">
                {loyaltyPoints.current} points
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-12 w-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {profileData.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{profileData.name}</p>
                  <p className="text-sm text-gray-500">{profileData.email}</p>
                </div>
              </div>
              
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="h-5 w-5 mr-3" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="w-full text-left text-red-600 hover:text-red-700 px-3 py-2"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn-secondary flex items-center"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900">{new Date(profileData.dateOfBirth).toLocaleDateString()}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    {isEditing ? (
                      <textarea
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        className="input"
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.address}</p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="btn-primary"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Order History</h2>
                  
                  <div className="space-y-4">
                    {customerOrders.map((order) => {
                      const StatusIcon = getStatusIcon(order.status);
                      return (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="font-medium text-gray-900">Order #{order.id}</p>
                                <p className="text-sm text-gray-500">{order.date}</p>
                              </div>
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
                              <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-1">
                                View Details
                                <ArrowRightIcon className="h-3 w-3 ml-1" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex items-center space-x-3">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-12 w-12 object-cover rounded-lg"
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                  <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">My Wishlist</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 mb-2">{item.name}</h3>
                        <p className="text-lg font-bold text-gray-900 mb-2">
                          {formatCurrency(item.price)}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${item.inStock ? 'text-green-600' : 'text-red-600'}`}>
                            {item.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            Remove
                          </button>
                        </div>
                        <button
                          className={`w-full mt-3 ${
                            item.inStock ? 'btn-primary' : 'btn-secondary'
                          }`}
                          disabled={!item.inStock}
                        >
                          {item.inStock ? 'Add to Cart' : 'Notify When Available'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Loyalty Rewards</h2>
                      <p className="text-yellow-100">
                        You're a {loyaltyPoints.tier} member with {loyaltyPoints.current} points
                      </p>
                    </div>
                    <GiftIcon className="h-16 w-16 text-yellow-200" />
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Progress to {loyaltyPoints.nextTier}</span>
                      <span>{loyaltyPoints.pointsToNext} points to go</span>
                    </div>
                    <div className="w-full bg-yellow-300 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all duration-300"
                        style={{ 
                          width: `${((loyaltyPoints.current) / (loyaltyPoints.current + loyaltyPoints.pointsToNext)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Rewards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loyaltyPoints.rewardsAvailable.map((reward, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{reward.name}</h4>
                          <span className="text-sm text-gray-500">{reward.points} points</span>
                        </div>
                        <button
                          className={`w-full mt-2 ${
                            reward.available && loyaltyPoints.current >= reward.points
                              ? 'btn-primary'
                              : 'btn-secondary opacity-50 cursor-not-allowed'
                          }`}
                          disabled={!reward.available || loyaltyPoints.current < reward.points}
                        >
                          {loyaltyPoints.current >= reward.points ? 'Redeem' : 'Not Enough Points'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Certificates Tab */}
            {activeTab === 'certificates' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Certificates</h2>
                
                <div className="space-y-4">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <ShieldCheckIcon className="h-8 w-8 text-green-500" />
                          <div>
                            <h3 className="font-medium text-gray-900">{cert.productName}</h3>
                            <p className="text-sm text-gray-500">{cert.certificateType}</p>
                            <p className="text-xs text-gray-400">
                              Issued: {cert.issueDate} | Valid till: {cert.validTill}
                            </p>
                          </div>
                        </div>
                        <button className="btn-secondary flex items-center">
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Order Updates</p>
                          <p className="text-sm text-gray-500">Get notified about order status changes</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={profileData.preferences.notifications}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            preferences: {
                              ...profileData.preferences,
                              notifications: e.target.checked
                            }
                          })}
                          className="toggle"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Promotional Offers</p>
                          <p className="text-sm text-gray-500">Receive special offers and discounts</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={profileData.preferences.promotions}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            preferences: {
                              ...profileData.preferences,
                              promotions: e.target.checked
                            }
                          })}
                          className="toggle"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Newsletter</p>
                          <p className="text-sm text-gray-500">Monthly newsletter with jewelry tips</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={profileData.preferences.newsletter}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            preferences: {
                              ...profileData.preferences,
                              newsletter: e.target.checked
                            }
                          })}
                          className="toggle"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
                    <div className="space-y-3">
                      <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        Change Password
                      </button>
                      <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        Download Account Data
                      </button>
                      <button className="w-full text-left p-3 border border-red-200 rounded-lg text-red-600 hover:bg-red-50">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}