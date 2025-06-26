'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperAirplaneIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  LanguageIcon,
  SparklesIcon,
  ChartBarIcon,
  CubeIcon,
  ShoppingCartIcon,
  UsersIcon,
  BoltIcon,
  StopIcon,
  XMarkIcon,
  LightBulbIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  useAIChat, 
  useBusinessQuery, 
  useTextToSpeech, 
  useVoiceRecording,
  useSupportedLanguages 
} from '@/lib/hooks/useAI';
import { ChatMessage } from '@/lib/api/services/ai';

export default function AIChatPage() {
  const { user } = useAuth();
  const [inputMessage, setInputMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'kannada' | 'hindi'>('english');
  const [selectedContext, setSelectedContext] = useState<string>('general');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aiChat = useAIChat();
  const businessQuery = useBusinessQuery();
  const textToSpeech = useTextToSpeech();
  const voiceRecording = useVoiceRecording();
  const { data: supportedLanguages } = useSupportedLanguages();

  const contexts = [
    { id: 'general', name: 'General', icon: SparklesIcon, color: 'text-purple-600' },
    { id: 'inventory', name: 'Inventory', icon: CubeIcon, color: 'text-blue-600' },
    { id: 'sales', name: 'Sales', icon: ChartBarIcon, color: 'text-green-600' },
    { id: 'customer', name: 'Customer', icon: UsersIcon, color: 'text-orange-600' },
    { id: 'business_analytics', name: 'Analytics', icon: BoltIcon, color: 'text-yellow-600' }
  ];

  const quickQueries = {
    english: [
      { text: "What's today's sales total?", context: 'sales' },
      { text: "Show me low stock items", context: 'inventory' },
      { text: "How many orders are pending?", context: 'customer' },
      { text: "What's the current gold rate?", context: 'general' },
      { text: "Top selling products this month", context: 'business_analytics' }
    ],
    kannada: [
      { text: "ಇಂದಿನ ಮಾರಾಟ ಎಷ್ಟು?", context: 'sales' },
      { text: "ಕಡಿಮೆ ಸ್ಟಾಕ್ ಇರುವ ವಸ್ತುಗಳನ್ನು ತೋರಿಸು", context: 'inventory' },
      { text: "ಎಷ್ಟು ಆರ್ಡರ್‌ಗಳು ಬಾಕಿ ಇವೆ?", context: 'customer' },
      { text: "ಇಂದಿನ ಚಿನ್ನದ ದರ ಏನು?", context: 'general' },
      { text: "ಈ ತಿಂಗಳ ಹೆಚ್ಚು ಮಾರಾಟವಾದ ವಸ್ತುಗಳು", context: 'business_analytics' }
    ],
    hindi: [
      { text: "आज की कुल बिक्री क्या है?", context: 'sales' },
      { text: "कम स्टॉक वाले आइटम दिखाएं", context: 'inventory' },
      { text: "कितने ऑर्डर पेंडिंग हैं?", context: 'customer' },
      { text: "आज की सोने की दर क्या है?", context: 'general' },
      { text: "इस महीने के टॉप सेलिंग प्रोडक्ट्स", context: 'business_analytics' }
    ]
  };

  const allMessages = [...aiChat.messages, ...businessQuery.queryHistory].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    if (selectedContext === 'business_analytics') {
      businessQuery.queryBusiness(inputMessage, 'analytics', selectedLanguage);
    } else {
      aiChat.sendMessage(inputMessage, selectedLanguage, selectedContext);
    }

    setInputMessage('');
    setShowSuggestions(false);
  };

  const handleVoiceMessage = async () => {
    if (voiceRecording.isRecording) {
      voiceRecording.stopRecording();
      const audioBlob = voiceRecording.getRecordedAudio();
      if (audioBlob) {
        aiChat.sendVoiceMessage(audioBlob, selectedLanguage);
        setShowSuggestions(false);
      }
    } else {
      await voiceRecording.startRecording();
    }
  };

  const handleQuickQuery = (query: string, context: string) => {
    setSelectedContext(context);
    setInputMessage(query);
    setShowSuggestions(false);
    
    if (context === 'business_analytics') {
      businessQuery.queryBusiness(query, 'analytics', selectedLanguage);
    } else {
      aiChat.sendMessage(query, selectedLanguage, context);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLanguageDisplay = (lang: 'english' | 'kannada' | 'hindi') => {
    switch (lang) {
      case 'kannada': return 'ಕನ್ನಡ';
      case 'hindi': return 'हिन्दी';
      default: return 'English';
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-white border border-gray-200 text-gray-900'
        } rounded-lg px-4 py-3 shadow-sm`}>
          {!isUser && (
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <SparklesIcon className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-xs font-medium text-gray-500">AI Assistant</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">{getLanguageDisplay(message.language)}</span>
                <button
                  onClick={() => textToSpeech.speak(message.content, message.language)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={textToSpeech.isPlaying}
                >
                  <SpeakerWaveIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
              {formatTime(message.timestamp)}
            </span>
            
            {message.metadata && (
              <div className="flex items-center space-x-1">
                {message.metadata.confidence && (
                  <span className="text-xs text-gray-400">
                    {Math.round(message.metadata.confidence * 100)}%
                  </span>
                )}
                {message.metadata.query_type && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    isUser ? 'bg-blue-500 text-blue-100' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {message.metadata.query_type}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
                <p className="text-sm text-gray-500">Multilingual jewelry business intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Online</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <LanguageIcon className="h-5 w-5 text-gray-400" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1"
              >
                <option value="english">English</option>
                <option value="kannada">ಕನ್ನಡ</option>
                <option value="hindi">हिन्दी</option>
              </select>
            </div>

            {/* Context Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Context:</span>
              <select
                value={selectedContext}
                onChange={(e) => setSelectedContext(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1"
              >
                {contexts.map((context) => (
                  <option key={context.id} value={context.id}>
                    {context.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Chat */}
            <button
              onClick={() => {
                aiChat.clearChat();
                businessQuery.clearQueryHistory();
                setShowSuggestions(true);
              }}
              className="btn-secondary btn-sm"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <SparklesIcon className="h-16 w-16 text-purple-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Welcome to your AI Assistant!
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              I can help you with inventory management, sales tracking, customer inquiries, and business analytics in English, Kannada, and Hindi.
            </p>
            
            {/* Capabilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {contexts.slice(1).map((context) => {
                const IconComponent = context.icon;
                return (
                  <div key={context.id} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <IconComponent className={`h-8 w-8 mx-auto mb-2 ${context.color}`} />
                    <h4 className="font-medium text-gray-900">{context.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {context.id === 'inventory' && 'Check stock levels, add items, track inventory'}
                      {context.id === 'sales' && 'View sales data, track performance, analyze trends'}
                      {context.id === 'customer' && 'Manage customers, track orders, handle inquiries'}
                      {context.id === 'business_analytics' && 'Get insights, reports, and business intelligence'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {allMessages.map(renderMessage)}
          </div>
        )}
        
        {/* Suggestions */}
        {showSuggestions && quickQueries[selectedLanguage] && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <LightBulbIcon className="h-4 w-4 mr-2" />
              Quick Questions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {quickQueries[selectedLanguage].map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuery(query.text, query.context)}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {query.text}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                selectedLanguage === 'kannada' ? 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...' :
                selectedLanguage === 'hindi' ? 'अपना संदेश टाइप करें...' :
                'Type your message...'
              }
              className="input pr-12"
              disabled={aiChat.isLoading || businessQuery.isLoading}
            />
            
            {(aiChat.isLoading || businessQuery.isLoading) && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Voice Button */}
          <button
            onClick={handleVoiceMessage}
            className={`p-3 rounded-full transition-colors ${
              voiceRecording.isRecording
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={aiChat.isLoading || businessQuery.isLoading}
          >
            {voiceRecording.isRecording ? (
              <StopIcon className="h-5 w-5" />
            ) : (
              <MicrophoneIcon className="h-5 w-5" />
            )}
          </button>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || aiChat.isLoading || businessQuery.isLoading}
            className="btn-primary p-3"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Context: {contexts.find(c => c.id === selectedContext)?.name}</span>
            <span>Language: {getLanguageDisplay(selectedLanguage)}</span>
            
            {voiceRecording.isRecording && (
              <div className="flex items-center text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                Recording...
              </div>
            )}
            
            {textToSpeech.isPlaying && (
              <div className="flex items-center text-green-500">
                <SpeakerWaveIcon className="h-4 w-4 mr-1" />
                Playing audio...
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Powered by AI • Real-time data from Azure backend</span>
          </div>
        </div>
      </div>
    </div>
  );
}