import { apiClient } from '../client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  language: 'english' | 'kannada' | 'hindi';
  metadata?: {
    query_type?: 'inventory' | 'sales' | 'customer' | 'general' | 'business_analytics';
    confidence?: number;
    data_sources?: string[];
  };
}

export interface ChatRequest {
  message: string;
  language: 'english' | 'kannada' | 'hindi';
  context?: 'inventory' | 'sales' | 'customer' | 'general' | 'business_analytics';
  session_id?: string;
}

export interface VoiceRequest {
  audio_data: Blob;
  language: 'english' | 'kannada' | 'hindi';
  session_id?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'gemini';
  capabilities: string[];
  languages: string[];
  is_active: boolean;
}

export interface BusinessQuery {
  query: string;
  language: 'english' | 'kannada' | 'hindi';
  type: 'inventory' | 'sales' | 'analytics' | 'customer' | 'orders';
}

class AIService {
  private baseUrl = '/api/llm';

  // Send text chat message
  async sendChatMessage(request: ChatRequest): Promise<ChatMessage> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/chat`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to send chat message:', error);
      // Return mock response for development
      return this.getMockChatResponse(request);
    }
  }

  // Send voice message
  async sendVoiceMessage(request: VoiceRequest): Promise<{
    transcription: string;
    response: ChatMessage;
    audio_url?: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('audio', request.audio_data);
      formData.append('language', request.language);
      if (request.session_id) formData.append('session_id', request.session_id);

      const response = await apiClient.post(`${this.baseUrl}/voice`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send voice message:', error);
      throw error;
    }
  }

  // Text to speech synthesis
  async synthesizeSpeech(text: string, language: 'english' | 'kannada' | 'hindi'): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/voice/synthesize`, {
        text,
        language
      }, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to synthesize speech:', error);
      throw error;
    }
  }

  // Get available AI models
  async getAvailableModels(): Promise<AIModel[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/models`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch AI models:', error);
      return [
        {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'openai',
          capabilities: ['chat', 'voice', 'business_analytics'],
          languages: ['english', 'kannada', 'hindi'],
          is_active: true
        },
        {
          id: 'gemini-pro',
          name: 'Gemini Pro',
          provider: 'gemini',
          capabilities: ['chat', 'voice', 'business_analytics'],
          languages: ['english', 'kannada', 'hindi'],
          is_active: false
        }
      ];
    }
  }

  // Get supported languages
  async getSupportedLanguages(): Promise<{
    code: string;
    name: string;
    native_name: string;
  }[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/languages`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch supported languages:', error);
      return [
        { code: 'english', name: 'English', native_name: 'English' },
        { code: 'kannada', name: 'Kannada', native_name: 'ಕನ್ನಡ' },
        { code: 'hindi', name: 'Hindi', native_name: 'हिन्दी' }
      ];
    }
  }

  // Business intelligence query
  async queryBusinessData(request: BusinessQuery): Promise<ChatMessage> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/query/${request.type}`, request);
      return response.data;
    } catch (error) {
      console.error('Failed to query business data:', error);
      return this.getMockBusinessResponse(request);
    }
  }

  // Get chat history
  async getChatHistory(session_id: string): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/chat/history/${session_id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      return [];
    }
  }

  // Update AI configuration
  async updateAIConfig(config: {
    primary_model: string;
    default_language: string;
    voice_enabled: boolean;
    auto_respond: boolean;
  }): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/config`, config);
    } catch (error) {
      console.error('Failed to update AI config:', error);
      throw error;
    }
  }

  // Mock responses for development
  private getMockChatResponse(request: ChatRequest): ChatMessage {
    const responses = {
      english: {
        inventory: "I found 1,248 jewelry items in your inventory with a total value of ₹28.5 lakhs. Your most popular category is rings with 345 items, followed by necklaces with 287 items. You're running low on 22K gold bangles - only 3 left in stock.",
        sales: "Today's sales are looking great! You've made ₹1.2 lakhs in sales with 8 orders processed. This is 15% higher than yesterday. Your top-selling item today is the 22K gold chain necklace.",
        general: "Hello! I'm your AI assistant for Sri Lakshmi Jewellers. I can help you with inventory management, sales tracking, customer inquiries, and business analytics. What would you like to know?"
      },
      kannada: {
        inventory: "ನಿಮ್ಮ ದಾಸ್ತಾನಿನಲ್ಲಿ ₹28.5 ಲಕ್ಷ ಮೌಲ್ಯದ 1,248 ಆಭರಣ ವಸ್ತುಗಳು ಇವೆ. ಅತ್ಯಂತ ಜನಪ್ರಿಯ ವಿಭಾಗವು 345 ವಸ್ತುಗಳೊಂದಿಗೆ ಉಂಗುರಗಳು, ನಂತರ 287 ವಸ್ತುಗಳೊಂದಿಗೆ ಹಾರಗಳು.",
        sales: "ಇಂದಿನ ಮಾರಾಟ ಚೆನ್ನಾಗಿದೆ! 8 ಆರ್ಡರ್‌ಗಳೊಂದಿಗೆ ₹1.2 ಲಕ್ಷ ಮಾರಾಟ ಮಾಡಿದ್ದೀರಿ. ಇದು ನಿನ್ನೆಗಿಂತ 15% ಹೆಚ್ಚು.",
        general: "ನಮಸ್ಕಾರ! ನಾನು ಶ್ರೀ ಲಕ್ಷ್ಮೀ ಜ್ಯುವೆಲರ್ಸ್‌ನ AI ಸಹಾಯಕ. ನಾನು ದಾಸ್ತಾನು ನಿರ್ವಹಣೆ, ಮಾರಾಟ ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ವ್ಯಾಪಾರ ವಿಶ್ಲೇಷಣೆಯಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ."
      },
      hindi: {
        inventory: "आपकी इन्वेंटरी में ₹28.5 लाख की कुल राशि के साथ 1,248 ज्वेलरी आइटम हैं। सबसे लोकप्रिय श्रेणी 345 आइटम के साथ रिंग्स है, इसके बाद 287 आइटम के साथ नेकलेस हैं।",
        sales: "आज की बिक्री बहुत अच्छी है! 8 ऑर्डर के साथ आपने ₹1.2 लाख की बिक्री की है। यह कल से 15% अधिक है।",
        general: "नमस्ते! मैं श्री लक्ष्मी ज्वेलर्स का AI असिस्टेंट हूं। मैं इन्वेंटरी प्रबंधन, बिक्री ट्रैकिंग और व्यापार विश्लेषण में आपकी मदद कर सकता हूं।"
      }
    };

    const context = request.context || 'general';
    const content = responses[request.language]?.[context] || responses.english.general;

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      language: request.language,
      metadata: {
        query_type: context,
        confidence: 0.95,
        data_sources: ['inventory-service', 'order-service', 'analytics-service']
      }
    };
  }

  private getMockBusinessResponse(request: BusinessQuery): ChatMessage {
    const businessResponses = {
      english: {
        inventory: "Current inventory status: 1,248 items worth ₹28.5L total. Top categories: Rings (345), Necklaces (287), Earrings (234). Low stock alert: 22K bangles (3 left), Silver chains (7 left).",
        sales: "Sales performance: Today ₹1.2L (8 orders), This week ₹8.5L (67 orders), This month ₹34.2L (278 orders). Growth: +15% vs last week, +22% vs last month.",
        analytics: "Business insights: Peak sales time 2-6 PM, Top customer segment: Women 25-45, Best performing staff: Priya Sharma (₹4.8L this month), Inventory turnover: 2.3x quarterly."
      }
    };

    const content = businessResponses.english[request.type] || "I'll help you with that business query.";

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      language: request.language,
      metadata: {
        query_type: 'business_analytics',
        confidence: 0.98,
        data_sources: ['analytics-service', 'inventory-service', 'order-service']
      }
    };
  }
}

export const aiService = new AIService();