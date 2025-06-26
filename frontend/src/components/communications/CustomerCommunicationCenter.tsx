'use client';

import { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  SpeakerWaveIcon,
  PaperAirplaneIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { useSendNotification } from '@/lib/hooks/useOrdersEnhanced';

// Communication Types based on Order Management Service v2.0
interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  whatsapp_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  preferred_language: 'en' | 'hi' | 'kn';
  last_order_date?: string;
  total_orders: number;
  total_spent: number;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'order_confirmation' | 'order_update' | 'payment_reminder' | 'promotional' | 'festival_wishes' | 'custom';
  subject: string;
  content: {
    en: string;
    hi: string;
    kn: string;
  };
  channels: ('whatsapp' | 'sms' | 'email')[];
  variables: string[];
}

interface CommunicationLog {
  id: number;
  customer_id: number;
  customer_name: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'voice';
  template_used?: string;
  subject: string;
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
}

interface BulkCommunication {
  template_id: string;
  customer_ids: number[];
  channels: ('whatsapp' | 'sms' | 'email')[];
  custom_variables: Record<string, string>;
  schedule_time?: string;
}

export default function CustomerCommunicationCenter() {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history' | 'bulk'>('compose');
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<('whatsapp' | 'sms' | 'email')[]>(['whatsapp']);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { mutate: sendNotification, isPending: isSending } = useSendNotification();

  // Mock data - in real implementation, this would come from APIs
  useEffect(() => {
    loadCustomers();
    loadTemplates();
    loadCommunicationHistory();
  }, []);

  const loadCustomers = () => {
    // Mock customer data
    setCustomers([
      {
        id: 1,
        name: 'Rajesh Kumar',
        phone: '+91-9876543210',
        email: 'rajesh@example.com',
        whatsapp_enabled: true,
        sms_enabled: true,
        email_enabled: true,
        preferred_language: 'hi',
        last_order_date: '2024-01-15',
        total_orders: 5,
        total_spent: 125000,
      },
      {
        id: 2,
        name: 'Priya Sharma',
        phone: '+91-9876543211',
        email: 'priya@example.com',
        whatsapp_enabled: true,
        sms_enabled: false,
        email_enabled: true,
        preferred_language: 'en',
        last_order_date: '2024-01-20',
        total_orders: 3,
        total_spent: 75000,
      },
      {
        id: 3,
        name: 'Amit Patel',
        phone: '+91-9876543212',
        whatsapp_enabled: true,
        sms_enabled: true,
        email_enabled: false,
        preferred_language: 'kn',
        last_order_date: '2024-01-18',
        total_orders: 8,
        total_spent: 200000,
      },
    ]);
  };

  const loadTemplates = () => {
    setTemplates([
      {
        id: 'order_confirm',
        name: 'Order Confirmation',
        type: 'order_confirmation',
        subject: 'Order Confirmed - {{order_number}}',
        content: {
          en: 'Dear {{customer_name}}, your order {{order_number}} has been confirmed. Amount: ₹{{amount}}. Expected delivery: {{delivery_date}}.',
          hi: 'प्रिय {{customer_name}}, आपका ऑर्डर {{order_number}} कन्फर्म हो गया है। राशि: ₹{{amount}}। अपेक्षित डिलिवरी: {{delivery_date}}।',
          kn: 'ಪ್ರಿಯ {{customer_name}}, ನಿಮ್ಮ ಆರ್ಡರ್ {{order_number}} ಖಚಿತಪಡಿಸಲಾಗಿದೆ। ಮೊತ್ತ: ₹{{amount}}। ನಿರೀಕ್ಷಿತ ವಿತರಣೆ: {{delivery_date}}।'
        },
        channels: ['whatsapp', 'sms'],
        variables: ['customer_name', 'order_number', 'amount', 'delivery_date'],
      },
      {
        id: 'order_ready',
        name: 'Order Ready for Pickup',
        type: 'order_update',
        subject: 'Your jewelry is ready! - {{order_number}}',
        content: {
          en: 'Great news {{customer_name}}! Your order {{order_number}} is ready for pickup. Please visit our store with this message.',
          hi: 'शुभ समाचार {{customer_name}}! आपका ऑर्डर {{order_number}} पिकअप के लिए तैयार है। कृपया इस संदेश के साथ हमारे स्टोर पर आएं।',
          kn: 'ಶುಭ ಸುದ್ದಿ {{customer_name}}! ನಿಮ್ಮ ಆರ್ಡರ್ {{order_number}} ಪಿಕಪ್‌ಗೆ ಸಿದ್ಧವಾಗಿದೆ। ದಯವಿಟ್ಟು ಈ ಸಂದೇಶದೊಂದಿಗೆ ನಮ್ಮ ಅಂಗಡಿಗೆ ಬನ್ನಿ।'
        },
        channels: ['whatsapp', 'sms', 'email'],
        variables: ['customer_name', 'order_number'],
      },
      {
        id: 'festival_diwali',
        name: 'Diwali Wishes & Offers',
        type: 'festival_wishes',
        subject: 'Diwali Special Offers - Up to 20% Off!',
        content: {
          en: 'Wishing you a sparkling Diwali {{customer_name}}! ✨ Celebrate with our special collection - Up to 20% off on gold jewelry. Valid till {{offer_end_date}}.',
          hi: '{{customer_name}} को चमकदार दिवाली की शुभकामनाएं! ✨ हमारे विशेष संग्रह के साथ मनाएं - सोने के आभूषणों पर 20% तक की छूट। {{offer_end_date}} तक वैध।',
          kn: '{{customer_name}} ಅವರಿಗೆ ಹೊಳೆಯುವ ದೀಪಾವಳಿ ಶುಭಾಶಯಗಳು! ✨ ನಮ್ಮ ವಿಶೇಷ ಸಂಗ್ರಹದೊಂದಿಗೆ ಆಚರಿಸಿ - ಚಿನ್ನದ ಆಭರಣಗಳ ಮೇಲೆ 20% ವರೆಗೆ ರಿಯಾಯಿತಿ। {{offer_end_date}} ವರೆಗೆ ಮಾನ್ಯ।'
        },
        channels: ['whatsapp', 'email'],
        variables: ['customer_name', 'offer_end_date'],
      },
    ]);
  };

  const loadCommunicationHistory = () => {
    setCommunicationLogs([
      {
        id: 1,
        customer_id: 1,
        customer_name: 'Rajesh Kumar',
        channel: 'whatsapp',
        template_used: 'order_confirm',
        subject: 'Order Confirmed - ORD-001',
        content: 'Dear Rajesh Kumar, your order ORD-001 has been confirmed...',
        status: 'delivered',
        sent_at: '2024-01-25T10:30:00Z',
        delivered_at: '2024-01-25T10:31:00Z',
      },
      {
        id: 2,
        customer_id: 2,
        customer_name: 'Priya Sharma',
        channel: 'email',
        template_used: 'festival_diwali',
        subject: 'Diwali Special Offers - Up to 20% Off!',
        content: 'Wishing you a sparkling Diwali Priya Sharma!...',
        status: 'read',
        sent_at: '2024-01-24T15:00:00Z',
        delivered_at: '2024-01-24T15:01:00Z',
        read_at: '2024-01-24T16:30:00Z',
      },
    ]);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (selectedCustomers.length === 0 || (!selectedTemplate && !customMessage)) {
      return;
    }

    const message = selectedTemplate 
      ? selectedTemplate.content.en // Default to English, would be based on customer preference
      : customMessage;

    for (const customerId of selectedCustomers) {
      try {
        await sendNotification({
          customer_id: customerId,
          message,
          channels: selectedChannels,
          template: selectedTemplate?.id,
        });
      } catch (error) {
        console.error(`Failed to send message to customer ${customerId}:`, error);
      }
    }

    // Reset form
    setSelectedCustomers([]);
    setCustomMessage('');
    setSelectedTemplate(null);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-600" />;
      case 'sms': return <DevicePhoneMobileIcon className="h-4 w-4 text-blue-600" />;
      case 'email': return <EnvelopeIcon className="h-4 w-4 text-purple-600" />;
      case 'voice': return <SpeakerWaveIcon className="h-4 w-4 text-orange-600" />;
      default: return <BellIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-emerald-100 text-emerald-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const ComposeTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Customer Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Select Customers</h3>
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
              placeholder="Search customers by name, phone, or email..."
            />
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedCustomers.includes(customer.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => {
                  if (selectedCustomers.includes(customer.id)) {
                    setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id));
                  } else {
                    setSelectedCustomers([...selectedCustomers, customer.id]);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                    <div className="text-xs text-gray-400">
                      {customer.total_orders} orders • {formatCurrency(customer.total_spent)}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {customer.whatsapp_enabled && (
                      <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-600" />
                    )}
                    {customer.sms_enabled && (
                      <DevicePhoneMobileIcon className="h-4 w-4 text-blue-600" />
                    )}
                    {customer.email_enabled && (
                      <EnvelopeIcon className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Selected: {selectedCustomers.length} customers
          </div>
        </div>
      </div>

      {/* Message Composition */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Compose Message</h3>
          
          {/* Template Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose Template</label>
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = templates.find(t => t.id === e.target.value);
                setSelectedTemplate(template || null);
                setCustomMessage('');
              }}
              className="select"
            >
              <option value="">Custom Message</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>

          {/* Message Content */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedTemplate ? 'Template Preview' : 'Custom Message'}
            </label>
            <textarea
              value={selectedTemplate ? selectedTemplate.content.en : customMessage}
              onChange={(e) => {
                if (!selectedTemplate) {
                  setCustomMessage(e.target.value);
                }
              }}
              className="input"
              rows={6}
              placeholder="Type your message here..."
              disabled={!!selectedTemplate}
            />
            {selectedTemplate && (
              <div className="mt-2 text-xs text-gray-500">
                Variables: {selectedTemplate.variables.join(', ')}
              </div>
            )}
          </div>

          {/* Channel Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Communication Channels</label>
            <div className="flex space-x-4">
              {[
                { id: 'whatsapp', label: 'WhatsApp', icon: ChatBubbleLeftRightIcon, color: 'green' },
                { id: 'sms', label: 'SMS', icon: DevicePhoneMobileIcon, color: 'blue' },
                { id: 'email', label: 'Email', icon: EnvelopeIcon, color: 'purple' },
              ].map((channel) => (
                <label key={channel.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(channel.id as any)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChannels([...selectedChannels, channel.id as any]);
                      } else {
                        setSelectedChannels(selectedChannels.filter(c => c !== channel.id));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 flex items-center">
                    <channel.icon className={`h-4 w-4 mr-1 text-${channel.color}-600`} />
                    {channel.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={selectedCustomers.length === 0 || (!selectedTemplate && !customMessage) || isSending}
            className="btn-primary w-full flex items-center justify-center"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                Send to {selectedCustomers.length} Customer{selectedCustomers.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const TemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Message Templates</h3>
        <button className="btn-outline">
          + Create Template
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">{template.name}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                template.type === 'promotional' ? 'bg-green-100 text-green-800' :
                template.type === 'order_confirmation' ? 'bg-blue-100 text-blue-800' :
                template.type === 'festival_wishes' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {template.type.replace('_', ' ')}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              {template.content.en.substring(0, 100)}...
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {template.channels.map((channel) => (
                  <span key={channel} className="inline-flex">
                    {getChannelIcon(channel)}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setSelectedTemplate(template)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const HistoryTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Communication History</h3>
      
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer & Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Timing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {communicationLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{log.customer_name}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        {getChannelIcon(log.channel)}
                        <span className="ml-1 capitalize">{log.channel}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{log.subject}</div>
                      <div className="text-sm text-gray-500">
                        {log.content.substring(0, 80)}...
                      </div>
                      {log.template_used && (
                        <div className="text-xs text-blue-600">Template: {log.template_used}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        Sent: {new Date(log.sent_at).toLocaleString()}
                      </div>
                      {log.delivered_at && (
                        <div className="text-xs text-green-600">
                          Delivered: {new Date(log.delivered_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Communication Center</h1>
          <p className="mt-1 text-sm text-gray-500">
            Multi-channel customer communication with WhatsApp, SMS, and Email
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-outline flex items-center">
            <UsersIcon className="h-5 w-5 mr-2" />
            Bulk Import
          </button>
          <button className="btn-primary flex items-center">
            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
            Quick Send
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'compose', name: 'Compose', icon: PaperAirplaneIcon },
            { id: 'templates', name: 'Templates', icon: DocumentTextIcon },
            { id: 'history', name: 'History', icon: ClockIcon },
            { id: 'bulk', name: 'Bulk Campaigns', icon: UsersIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading communications...</span>
        </div>
      ) : (
        <>
          {activeTab === 'compose' && <ComposeTab />}
          {activeTab === 'templates' && <TemplatesTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'bulk' && <div className="text-center py-12 text-gray-500">Bulk campaigns feature coming soon...</div>}
        </>
      )}
    </div>
  );
}