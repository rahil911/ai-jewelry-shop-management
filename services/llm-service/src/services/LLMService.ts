import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ServiceError } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  language?: 'en' | 'hi' | 'kn';
}

export interface ChatResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  language: string;
}

export interface VoiceProcessingResult {
  transcription: string;
  response: string;
  audioUrl?: string;
  language: string;
}

export class LLMService {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;
  
  constructor() {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    
    // Initialize Google Gemini
    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }
  
  async checkModelAvailability(): Promise<any> {
    const status: any = {};
    
    try {
      if (this.openai) {
        await this.openai.models.list();
        status.openai = 'available';
      } else {
        status.openai = 'not_configured';
      }
    } catch (error) {
      status.openai = 'error';
      status.openai_error = error.message;
    }
    
    try {
      if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
        await model.generateContent('test');
        status.gemini = 'available';
      } else {
        status.gemini = 'not_configured';
      }
    } catch (error) {
      status.gemini = 'error';
      status.gemini_error = error.message;
    }
    
    return status;
  }
  
  async processChat(
    messages: ChatMessage[],
    options: {
      model?: 'openai' | 'gemini';
      language?: 'en' | 'hi' | 'kn';
      context?: 'jewelry_business' | 'general';
      userId?: string;
    } = {}
  ): Promise<ChatResponse> {
    const { model = 'openai', language = 'en', context = 'jewelry_business' } = options;
    
    try {
      // Add system context for jewelry business
      const systemMessage = this.getSystemPrompt(context, language);
      const fullMessages = [
        { role: 'system' as const, content: systemMessage },
        ...messages
      ];
      
      if (model === 'openai' && this.openai) {
        return await this.processOpenAIChat(fullMessages, language);
      } else if (model === 'gemini' && this.gemini) {
        return await this.processGeminiChat(fullMessages, language);
      } else {
        throw new ServiceError('Requested AI model not available', 'MODEL_UNAVAILABLE', 503);
      }
    } catch (error) {
      logger.error('Chat processing error:', error);
      throw error;
    }
  }
  
  private async processOpenAIChat(messages: ChatMessage[], language: string): Promise<ChatResponse> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: 0.7,
      max_tokens: 1000
    });
    
    return {
      message: response.choices[0].message.content || '',
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      },
      model: 'gpt-4',
      language
    };
  }
  
  private async processGeminiChat(messages: ChatMessage[], language: string): Promise<ChatResponse> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    
    // Convert messages to Gemini format
    const chatHistory = messages.slice(1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    const chat = model.startChat({
      history: chatHistory.slice(0, -1)
    });
    
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    
    return {
      message: response.text(),
      model: 'gemini-pro',
      language
    };
  }
  
  async processVoice(
    audioBuffer: Buffer,
    options: {
      language?: 'en' | 'hi' | 'kn';
      responseType?: 'text' | 'audio';
      context?: 'jewelry_business' | 'general';
    } = {}
  ): Promise<VoiceProcessingResult> {
    const { language = 'en', responseType = 'text', context = 'jewelry_business' } = options;
    
    try {
      // Transcribe audio using OpenAI Whisper
      const transcription = await this.transcribeAudio(audioBuffer, language);
      
      // Process the transcription as a chat message
      const chatResponse = await this.processChat([
        { role: 'user', content: transcription, language }
      ], { language, context });
      
      let audioUrl;
      if (responseType === 'audio') {
        // Generate audio response (you might want to implement TTS here)
        audioUrl = await this.generateAudio(chatResponse.message, language);
      }
      
      return {
        transcription,
        response: chatResponse.message,
        audioUrl,
        language
      };
    } catch (error) {
      logger.error('Voice processing error:', error);
      throw error;
    }
  }
  
  private async transcribeAudio(audioBuffer: Buffer, language: string): Promise<string> {
    if (!this.openai) {
      throw new ServiceError('OpenAI not configured for transcription', 'SERVICE_UNAVAILABLE', 503);
    }
    
    // Create a temporary file for the audio
    const response = await this.openai.audio.transcriptions.create({
      file: new File([audioBuffer], 'audio.webm', { type: 'audio/webm' }),
      model: 'whisper-1',
      language: language === 'hi' ? 'hi' : language === 'kn' ? 'kn' : 'en'
    });
    
    return response.text;
  }
  
  private async generateAudio(text: string, language: string): Promise<string> {
    if (!this.openai) {
      throw new ServiceError('OpenAI not configured for TTS', 'SERVICE_UNAVAILABLE', 503);
    }
    
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text
    });
    
    // In a real implementation, you would save this to cloud storage
    // and return the URL. For now, return a placeholder
    return '/api/llm/audio/' + Date.now();
  }
  
  private getSystemPrompt(context: string, language: string): string {
    const prompts = {
      jewelry_business: {
        en: `You are an AI assistant for a jewelry shop management system. You help jewelry business owners with:
- Inventory management and pricing
- Customer service and product recommendations
- Gold rate tracking and calculations
- Order processing and billing
- Business analytics and insights

Respond in a helpful, professional manner suitable for Indian jewelry business context. Consider cultural preferences, festival seasons, and traditional jewelry styles.`,
        
        hi: `आप एक ज्वेलरी शॉप मैनेजमेंट सिस्टम के लिए AI असिस्टेंट हैं। आप ज्वेलरी व्यापारियों की मदद करते हैं:
- इन्वेंटरी मैनेजमेंट और प्राइसिंग में
- कस्टमर सर्विस और प्रोडक्ट रिकमेंडेशन में
- सोने की दरों की ट्रैकिंग और कैलकुलेशन में
- ऑर्डर प्रोसेसिंग और बिलिंग में
- बिज़नेस एनालिटिक्स और इनसाइट्स में

भारतीय ज्वेलरी बिज़नेस के संदर्भ में उपयोगी, व्यावसायिक तरीके से जवाब दें।`,
        
        kn: `ನೀವು ಆಭರಣ ಅಂಗಡಿ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆಯ AI ಸಹಾಯಕರು. ನೀವು ಆಭರಣ ವ್ಯಾಪಾರಿಗಳಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತೀರಿ:
- ದಾಸ್ತಾನು ನಿರ್ವಹಣೆ ಮತ್ತು ಬೆಲೆ ನಿರ್ಧಾರಣೆಯಲ್ಲಿ
- ಗ್ರಾಹಕ ಸೇವೆ ಮತ್ತು ಉತ್ಪಾದನೆ ಶಿಫಾರಸುಗಳಲ್ಲಿ
- ಚಿನ್ನದ ದರಗಳ ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಲೆಕ್ಕಾಚಾರಗಳಲ್ಲಿ
- ಆರ್ಡರ್ ಪ್ರೊಸೆಸಿಂಗ್ ಮತ್ತು ಬಿಲ್ಲಿಂಗ್‌ನಲ್ಲಿ

ಭಾರತೀಯ ಆಭರಣ ವ್ಯಾಪಾರದ ಸಂದರ್ಭದಲ್ಲಿ ಉಪಯುಕ್ತ, ವೃತ್ತಿಪರ ರೀತಿಯಲ್ಲಿ ಉತ್ತರಿಸಿ।`
      },
      general: {
        en: 'You are a helpful AI assistant. Respond clearly and concisely.',
        hi: 'आप एक सहायक AI असिस्टेंट हैं। स्पष्ट और संक्षिप्त जवाब दें।',
        kn: 'ನೀವು ಸಹಾಯಕ AI ಸಹಾಯಕರು. ಸ್ಪಷ್ಟವಾಗಿ ಮತ್ತು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಉತ್ತರಿಸಿ.'
      }
    };
    
    return prompts[context]?.[language] || prompts.general.en;
  }
}