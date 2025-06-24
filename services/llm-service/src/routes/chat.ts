import { Router, Request, Response } from 'express';
import { createApiResponse, ServiceError } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';
import { LLMService, ChatMessage } from '../services/LLMService';

const router = Router();

// POST /api/llm/chat
router.post('/', async (req: Request, res: Response) => {
  const llmService: LLMService = req.app.locals.llmService;
  
  try {
    const {
      message,
      messages = [],
      language = 'en',
      context = 'jewelry_business',
      model = 'openai'
    } = req.body;
    
    if (!message && messages.length === 0) {
      throw new ServiceError('Message or messages array required', 'MISSING_MESSAGE', 400);
    }
    
    // Prepare messages array
    let chatMessages: ChatMessage[] = messages;
    if (message) {
      chatMessages = [...messages, { role: 'user', content: message, language }];
    }
    
    // Validate messages format
    for (const msg of chatMessages) {
      if (!msg.role || !msg.content) {
        throw new ServiceError('Invalid message format', 'INVALID_MESSAGE_FORMAT', 400);
      }
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        throw new ServiceError('Invalid message role', 'INVALID_MESSAGE_ROLE', 400);
      }
    }
    
    const response = await llmService.processChat(chatMessages, {
      model,
      language,
      context,
      userId: req.user?.id
    });
    
    logger.info('Chat processed successfully', {
      userId: req.user?.id,
      model,
      language,
      messageCount: chatMessages.length,
      tokensUsed: response.usage?.total_tokens
    });
    
    res.json(createApiResponse(true, response, 'Chat processed successfully'));
    
  } catch (error) {
    logger.error('Chat processing error:', error);
    
    if (error instanceof ServiceError) {
      return res.status(error.statusCode).json(
        createApiResponse(false, undefined, null, error.message)
      );
    }
    
    res.status(500).json(
      createApiResponse(false, undefined, null, 'Failed to process chat')
    );
  }
});

// POST /api/llm/chat/conversation
router.post('/conversation', async (req: Request, res: Response) => {
  const llmService: LLMService = req.app.locals.llmService;
  
  try {
    const {
      conversationId,
      message,
      language = 'en',
      context = 'jewelry_business',
      model = 'openai'
    } = req.body;
    
    if (!message) {
      throw new ServiceError('Message required', 'MISSING_MESSAGE', 400);
    }
    
    // In a real implementation, you would retrieve conversation history from database
    // For now, we'll process as a single message
    const chatMessages: ChatMessage[] = [
      { role: 'user', content: message, language }
    ];
    
    const response = await llmService.processChat(chatMessages, {
      model,
      language,
      context,
      userId: req.user?.id
    });
    
    // In a real implementation, you would save the conversation to database
    logger.info('Conversation message processed', {
      conversationId,
      userId: req.user?.id,
      model,
      language
    });
    
    res.json(createApiResponse(true, {
      ...response,
      conversationId
    }, 'Message processed successfully'));
    
  } catch (error) {
    logger.error('Conversation processing error:', error);
    
    if (error instanceof ServiceError) {
      return res.status(error.statusCode).json(
        createApiResponse(false, undefined, null, error.message)
      );
    }
    
    res.status(500).json(
      createApiResponse(false, undefined, null, 'Failed to process conversation')
    );
  }
});

// GET /api/llm/chat/models
router.get('/models', async (req: Request, res: Response) => {
  const llmService: LLMService = req.app.locals.llmService;
  
  try {
    const availability = await llmService.checkModelAvailability();
    
    const models = {
      available: [],
      unavailable: []
    };
    
    if (availability.openai === 'available') {
      models.available.push({
        id: 'openai',
        name: 'OpenAI GPT-4',
        capabilities: ['chat', 'voice_transcription', 'text_to_speech']
      });
    } else {
      models.unavailable.push({
        id: 'openai',
        name: 'OpenAI GPT-4',
        reason: availability.openai_error || 'Not configured'
      });
    }
    
    if (availability.gemini === 'available') {
      models.available.push({
        id: 'gemini',
        name: 'Google Gemini Pro',
        capabilities: ['chat']
      });
    } else {
      models.unavailable.push({
        id: 'gemini',
        name: 'Google Gemini Pro',
        reason: availability.gemini_error || 'Not configured'
      });
    }
    
    res.json(createApiResponse(true, models, 'Models status retrieved'));
    
  } catch (error) {
    logger.error('Models check error:', error);
    res.status(500).json(
      createApiResponse(false, undefined, null, 'Failed to check models')
    );
  }
});

export { router as chatRoutes };