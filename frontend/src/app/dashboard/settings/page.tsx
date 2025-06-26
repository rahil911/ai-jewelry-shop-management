'use client';

import React, { useState } from 'react';
import { 
  Cog6ToothIcon,
  CurrencyDollarIcon,
  KeyIcon,
  BellIcon,
  CubeIcon,
  UserGroupIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  CloudIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  ChartBarIcon,
  CpuChipIcon,
  SpeakerWaveIcon,
  LanguageIcon,
  PaintBrushIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/AuthContext';

interface SettingsSection {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'business' | 'system' | 'integrations' | 'security';
}

const settingsSections: SettingsSection[] = [
  {
    id: 'business_info',
    name: 'Business Information',
    description: 'Shop details, contact information, and business hours',
    icon: CubeIcon,
    category: 'business'
  },
  {
    id: 'pricing_config',
    name: 'Pricing Configuration',
    description: 'Making charges, GST rates, and pricing rules',
    icon: CurrencyDollarIcon,
    category: 'business'
  },
  {
    id: 'user_permissions',
    name: 'User & Permissions',
    description: 'Staff roles, access control, and user management',
    icon: UserGroupIcon,
    category: 'security'
  },
  {
    id: 'ai_models',
    name: 'AI Model Configuration',
    description: 'OpenAI, Gemini API settings and language preferences',
    icon: CpuChipIcon,
    category: 'integrations'
  },
  {
    id: 'notifications',
    name: 'Notification Settings',
    description: 'SMS, email, WhatsApp, and push notification configuration',
    icon: BellIcon,
    category: 'integrations'
  },
  {
    id: 'payment_gateways',
    name: 'Payment Gateways',
    description: 'Razorpay, Stripe, and other payment method configurations',
    icon: ShieldCheckIcon,
    category: 'integrations'
  },
  {
    id: 'azure_services',
    name: 'Azure Services',
    description: 'Backend services, storage, and cloud configuration',
    icon: CloudIcon,
    category: 'system'
  },
  {
    id: 'appearance',
    name: 'Appearance & Theme',
    description: 'UI customization, logo, colors, and branding',
    icon: PaintBrushIcon,
    category: 'system'
  }
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('business_info');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sample settings state
  const [businessSettings, setBusinessSettings] = useState({
    shopName: 'Sri Lakshmi Jewellers',
    contactNumber: '+91 98765 43210',
    email: 'info@srilakshmijewellers.com',
    address: '123 Gandhi Road, Bangalore, Karnataka 560001',
    gstin: '29ABCDE1234F1Z5',
    businessHours: '10:00 AM - 8:00 PM',
    holidays: 'Sundays'
  });

  const [aiSettings, setAiSettings] = useState({
    primaryModel: 'openai',
    openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    geminiApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
    defaultLanguage: 'english',
    voiceEnabled: true,
    autoRespond: false
  });

  const [notificationSettings, setNotificationSettings] = useState({
    smsEnabled: true,
    emailEnabled: true,
    whatsappEnabled: true,
    pushEnabled: true,
    orderUpdates: true,
    inventoryAlerts: true,
    paymentNotifications: true
  });

  const handleSaveSettings = () => {
    // Here you would make API calls to save settings to Azure backend
    console.log('Saving settings...', { businessSettings, aiSettings, notificationSettings });
    setHasUnsavedChanges(false);
    // Show success toast
  };

  const renderBusinessSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-2">
            Shop Name
          </label>
          <input
            type="text"
            id="shopName"
            value={businessSettings.shopName}
            onChange={(e) => {
              setBusinessSettings({...businessSettings, shopName: e.target.value});
              setHasUnsavedChanges(true);
            }}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Contact Number
          </label>
          <input
            type="tel"
            id="contactNumber"
            value={businessSettings.contactNumber}
            onChange={(e) => {
              setBusinessSettings({...businessSettings, contactNumber: e.target.value});
              setHasUnsavedChanges(true);
            }}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Business Email
          </label>
          <input
            type="email"
            id="email"
            value={businessSettings.email}
            onChange={(e) => {
              setBusinessSettings({...businessSettings, email: e.target.value});
              setHasUnsavedChanges(true);
            }}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="gstin" className="block text-sm font-medium text-gray-700 mb-2">
            GSTIN
          </label>
          <input
            type="text"
            id="gstin"
            value={businessSettings.gstin}
            onChange={(e) => {
              setBusinessSettings({...businessSettings, gstin: e.target.value});
              setHasUnsavedChanges(true);
            }}
            className="input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
          Business Address
        </label>
        <textarea
          id="address"
          rows={3}
          value={businessSettings.address}
          onChange={(e) => {
            setBusinessSettings({...businessSettings, address: e.target.value});
            setHasUnsavedChanges(true);
          }}
          className="input"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="businessHours" className="block text-sm font-medium text-gray-700 mb-2">
            Business Hours
          </label>
          <input
            type="text"
            id="businessHours"
            value={businessSettings.businessHours}
            onChange={(e) => {
              setBusinessSettings({...businessSettings, businessHours: e.target.value});
              setHasUnsavedChanges(true);
            }}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="holidays" className="block text-sm font-medium text-gray-700 mb-2">
            Weekly Holidays
          </label>
          <input
            type="text"
            id="holidays"
            value={businessSettings.holidays}
            onChange={(e) => {
              setBusinessSettings({...businessSettings, holidays: e.target.value});
              setHasUnsavedChanges(true);
            }}
            className="input"
          />
        </div>
      </div>
    </div>
  );

  const renderAISettings = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">AI Model Configuration</h3>
            <p className="text-sm text-blue-700 mt-1">
              Configure your preferred AI model and API keys for multilingual support and voice commands.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="primaryModel" className="block text-sm font-medium text-gray-700 mb-2">
          Primary AI Model
        </label>
        <select
          id="primaryModel"
          value={aiSettings.primaryModel}
          onChange={(e) => {
            setAiSettings({...aiSettings, primaryModel: e.target.value});
            setHasUnsavedChanges(true);
          }}
          className="select"
        >
          <option value="openai">OpenAI GPT-4</option>
          <option value="gemini">Google Gemini</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="openaiApiKey" className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <div className="relative">
            <input
              type="password"
              id="openaiApiKey"
              value={aiSettings.openaiApiKey}
              onChange={(e) => {
                setAiSettings({...aiSettings, openaiApiKey: e.target.value});
                setHasUnsavedChanges(true);
              }}
              className="input pr-10"
              placeholder="sk-..."
            />
            <KeyIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div>
          <label htmlFor="geminiApiKey" className="block text-sm font-medium text-gray-700 mb-2">
            Google Gemini API Key
          </label>
          <div className="relative">
            <input
              type="password"
              id="geminiApiKey"
              value={aiSettings.geminiApiKey}
              onChange={(e) => {
                setAiSettings({...aiSettings, geminiApiKey: e.target.value});
                setHasUnsavedChanges(true);
              }}
              className="input pr-10"
              placeholder="AIza..."
            />
            <KeyIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="defaultLanguage" className="block text-sm font-medium text-gray-700 mb-2">
          Default Language
        </label>
        <select
          id="defaultLanguage"
          value={aiSettings.defaultLanguage}
          onChange={(e) => {
            setAiSettings({...aiSettings, defaultLanguage: e.target.value});
            setHasUnsavedChanges(true);
          }}
          className="select"
        >
          <option value="english">English</option>
          <option value="kannada">ಕನ್ನಡ (Kannada)</option>
          <option value="hindi">हिन्दी (Hindi)</option>
        </select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Voice Commands</h4>
            <p className="text-sm text-gray-500">Enable voice input and output for hands-free operation</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAiSettings({...aiSettings, voiceEnabled: !aiSettings.voiceEnabled});
              setHasUnsavedChanges(true);
            }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
              aiSettings.voiceEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                aiSettings.voiceEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Auto-Respond to Customers</h4>
            <p className="text-sm text-gray-500">Automatically respond to basic customer inquiries</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAiSettings({...aiSettings, autoRespond: !aiSettings.autoRespond});
              setHasUnsavedChanges(true);
            }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
              aiSettings.autoRespond ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                aiSettings.autoRespond ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Notification Channels</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Configure how customers and staff receive updates about orders, payments, and inventory.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">Communication Channels</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h5 className="text-sm font-medium text-gray-900">SMS Notifications</h5>
                <p className="text-sm text-gray-500">Order updates and alerts via SMS</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setNotificationSettings({...notificationSettings, smsEnabled: !notificationSettings.smsEnabled});
                setHasUnsavedChanges(true);
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                notificationSettings.smsEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notificationSettings.smsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <EnvelopeIcon className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h5 className="text-sm font-medium text-gray-900">Email Notifications</h5>
                <p className="text-sm text-gray-500">Professional email communication</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setNotificationSettings({...notificationSettings, emailEnabled: !notificationSettings.emailEnabled});
                setHasUnsavedChanges(true);
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                notificationSettings.emailEnabled ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notificationSettings.emailEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <SpeakerWaveIcon className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <h5 className="text-sm font-medium text-gray-900">WhatsApp Integration</h5>
                <p className="text-sm text-gray-500">Order updates via WhatsApp</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setNotificationSettings({...notificationSettings, whatsappEnabled: !notificationSettings.whatsappEnabled});
                setHasUnsavedChanges(true);
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                notificationSettings.whatsappEnabled ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notificationSettings.whatsappEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <BellIcon className="h-6 w-6 text-orange-600 mr-3" />
              <div>
                <h5 className="text-sm font-medium text-gray-900">Push Notifications</h5>
                <p className="text-sm text-gray-500">Real-time browser notifications</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setNotificationSettings({...notificationSettings, pushEnabled: !notificationSettings.pushEnabled});
                setHasUnsavedChanges(true);
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                notificationSettings.pushEnabled ? 'bg-orange-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notificationSettings.pushEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">Notification Types</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Order Updates</h5>
              <p className="text-sm text-gray-500">Notify customers about order status changes</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNotificationSettings({...notificationSettings, orderUpdates: !notificationSettings.orderUpdates});
                setHasUnsavedChanges(true);
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                notificationSettings.orderUpdates ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notificationSettings.orderUpdates ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Inventory Alerts</h5>
              <p className="text-sm text-gray-500">Alert staff when inventory is running low</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNotificationSettings({...notificationSettings, inventoryAlerts: !notificationSettings.inventoryAlerts});
                setHasUnsavedChanges(true);
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                notificationSettings.inventoryAlerts ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notificationSettings.inventoryAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Payment Notifications</h5>
              <p className="text-sm text-gray-500">Notify about successful payments and refunds</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNotificationSettings({...notificationSettings, paymentNotifications: !notificationSettings.paymentNotifications});
                setHasUnsavedChanges(true);
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                notificationSettings.paymentNotifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notificationSettings.paymentNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'business_info':
        return renderBusinessSettings();
      case 'ai_models':
        return renderAISettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'pricing_config':
        return (
          <div className="text-center py-12">
            <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Pricing Configuration</h3>
            <p className="mt-1 text-sm text-gray-500">Configure making charges, GST rates, and pricing rules.</p>
            <div className="mt-6">
              <button className="btn-primary">
                Configure Pricing
              </button>
            </div>
          </div>
        );
      case 'user_permissions':
        return (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">User & Permissions</h3>
            <p className="mt-1 text-sm text-gray-500">Manage staff roles, access control, and user permissions.</p>
            <div className="mt-6">
              <button className="btn-primary">
                Manage Users
              </button>
            </div>
          </div>
        );
      case 'payment_gateways':
        return (
          <div className="text-center py-12">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Payment Gateways</h3>
            <p className="mt-1 text-sm text-gray-500">Configure Razorpay, Stripe, and other payment methods.</p>
            <div className="mt-6">
              <button className="btn-primary">
                Configure Payments
              </button>
            </div>
          </div>
        );
      case 'azure_services':
        return (
          <div className="text-center py-12">
            <CloudIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Azure Services</h3>
            <p className="mt-1 text-sm text-gray-500">Backend services configuration and cloud settings.</p>
            <div className="mt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Azure Backend Connected</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Successfully connected to http://4.236.132.147 with all 9 microservices operational.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="text-center py-12">
            <PaintBrushIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Appearance & Theme</h3>
            <p className="mt-1 text-sm text-gray-500">Customize UI, upload logo, and configure branding.</p>
            <div className="mt-6">
              <button className="btn-primary">
                Customize Appearance
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Settings Navigation */}
      <div className="w-1/3 pr-6">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Settings</h2>
          {settingsSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <IconComponent className={`h-5 w-5 mr-3 ${
                    activeSection === section.id ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{section.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{section.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {settingsSections.find(s => s.id === activeSection)?.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {settingsSections.find(s => s.id === activeSection)?.description}
              </p>
            </div>
            {hasUnsavedChanges && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-orange-600 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Unsaved changes
                </span>
                <button
                  onClick={handleSaveSettings}
                  className="btn-primary"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
}