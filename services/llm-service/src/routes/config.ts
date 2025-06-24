import { Router, Request, Response } from 'express';
import { createApiResponse } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/llm/config
router.get('/', (req: Request, res: Response) => {
  const config = {
    features: {
      chat: true,
      voice_processing: true,
      multilingual: true,
      jewelry_context: true
    },
    supported_languages: ['en', 'hi', 'kn'],
    supported_models: ['openai', 'gemini'],
    voice: {
      max_file_size: '25MB',
      supported_formats: ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg'],
      transcription: true,
      text_to_speech: true
    },
    chat: {
      max_message_length: 4000,
      max_conversation_history: 50,
      context_aware: true
    },
    rate_limits: {
      requests_per_15min: 50,
      tokens_per_hour: 100000
    }
  };
  
  res.json(createApiResponse(true, config, 'LLM service configuration'));
});

// GET /api/llm/config/prompts
router.get('/prompts', (req: Request, res: Response) => {
  const prompts = {
    contexts: [
      {
        id: 'jewelry_business',
        name: 'Jewelry Business',
        description: 'Specialized for jewelry shop management, inventory, pricing, and customer service'
      },
      {
        id: 'general',
        name: 'General Assistant',
        description: 'General purpose AI assistant'
      }
    ],
    sample_questions: {
      jewelry_business: {
        en: [
          "What's the current gold rate?",
          "How do I calculate making charges?",
          "Show me low stock items",
          "What are popular jewelry trends for Diwali?",
          "How to price a 22K gold necklace?"
        ],
        hi: [
          "आज सोने की दर क्या है?",
          "मेकिंग चार्ज कैसे निकालते हैं?",
          "कम स्टॉक वाले आइटम दिखाएं",
          "दिवाली के लिए कौन से गहने लोकप्रिय हैं?",
          "22 कैरेट गोल्ड हार की कीमत कैसे लगाएं?"
        ],
        kn: [
          "ಇಂದು ಚಿನ್ನದ ದರ ಎಷ್ಟು?",
          "ಮೇಕಿಂಗ್ ಚಾರ್ಜ್ ಹೇಗೆ ಲೆಕ್ಕ ಹಾಕುವುದು?",
          "ಕಡಿಮೆ ಸ್ಟಾಕ್ ಇರುವ ವಸ್ತುಗಳನ್ನು ತೋರಿಸಿ",
          "ದೀಪಾವಳಿಗೆ ಯಾವ ಆಭರಣಗಳು ಜನಪ್ರಿಯ?",
          "22 ಕ್ಯಾರೆಟ್ ಚಿನ್ನದ ಹಾರದ ಬೆಲೆ ಹೇಗೆ ನಿರ್ಧರಿಸುವುದು?"
        ]
      }
    }
  };
  
  res.json(createApiResponse(true, prompts, 'Available prompts and contexts'));
});

// POST /api/llm/config/test
router.post('/test', async (req: Request, res: Response) => {
  const llmService = req.app.locals.llmService;
  
  try {
    const { model = 'openai', language = 'en' } = req.body;
    
    const testMessage = {
      en: 'Hello! This is a test message. Please respond briefly.',
      hi: 'नमस्ते! यह एक टेस्ट मैसेज है। कृपया संक्षेप में जवाब दें।',
      kn: 'ನಮಸ್ಕಾರ! ಇದು ಒಂದು ಟೆಸ್ಟ್ ಸಂದೇಶ. ದಯವಿಟ್ಟು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಉತ್ತರಿಸಿ.'
    };
    
    const response = await llmService.processChat([
      {
        role: 'user',
        content: testMessage[language] || testMessage.en,
        language
      }
    ], {
      model,
      language,
      context: 'general'
    });
    
    logger.info('LLM service test completed', { model, language });
    
    res.json(createApiResponse(true, {
      test_successful: true,
      model_used: response.model,
      response_preview: response.message.substring(0, 100) + (response.message.length > 100 ? '...' : ''),
      tokens_used: response.usage
    }, 'LLM service test completed successfully'));
    
  } catch (error) {
    logger.error('LLM service test error:', error);
    
    res.json(createApiResponse(false, {
      test_successful: false,
      error: error.message
    }, 'LLM service test failed'));
  }
});

export { router as configRoutes };