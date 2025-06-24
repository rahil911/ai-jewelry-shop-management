import { Router, Request, Response } from 'express';
import { createApiResponse, ServiceError } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';
import { LLMService } from '../services/LLMService';
import multer from 'multer';

const router = Router();

// POST /api/llm/voice/process
router.post('/process', async (req: Request, res: Response) => {
  const upload = req.app.locals.upload;
  const llmService: LLMService = req.app.locals.llmService;
  
  upload.single('audio')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json(
            createApiResponse(false, null, null, 'Audio file too large (max 25MB)')
          );
        }
      }
      return res.status(400).json(
        createApiResponse(false, null, null, 'Audio upload error')
      );
    }
    
    try {
      if (!req.file) {
        throw new ServiceError('Audio file required', 'MISSING_AUDIO_FILE', 400);
      }
      
      const {
        language = 'en',
        responseType = 'text',
        context = 'jewelry_business'
      } = req.body;
      
      if (!['en', 'hi', 'kn'].includes(language)) {
        throw new ServiceError('Unsupported language', 'UNSUPPORTED_LANGUAGE', 400);
      }
      
      if (!['text', 'audio'].includes(responseType)) {
        throw new ServiceError('Invalid response type', 'INVALID_RESPONSE_TYPE', 400);
      }
      
      // Read the audio file
      const fs = require('fs');
      const audioBuffer = fs.readFileSync(req.file.path);
      
      // Process the voice input
      const result = await llmService.processVoice(audioBuffer, {
        language,
        responseType,
        context
      });
      
      // Clean up the temporary file
      fs.unlinkSync(req.file.path);
      
      logger.info('Voice processed successfully', {
        userId: req.user?.id,
        language,
        responseType,
        transcriptionLength: result.transcription.length,
        responseLength: result.response.length
      });
      
      res.json(createApiResponse(true, result, 'Voice processed successfully'));
      
    } catch (error) {
      // Clean up the temporary file if it exists
      if (req.file) {
        try {
          const fs = require('fs');
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          logger.error('File cleanup error:', cleanupError);
        }
      }
      
      logger.error('Voice processing error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(
          createApiResponse(false, null, null, error.message)
        );
      }
      
      res.status(500).json(
        createApiResponse(false, null, null, 'Failed to process voice')
      );
    }
  });
});

// POST /api/llm/voice/transcribe
router.post('/transcribe', async (req: Request, res: Response) => {
  const upload = req.app.locals.upload;
  const llmService: LLMService = req.app.locals.llmService;
  
  upload.single('audio')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json(
            createApiResponse(false, null, null, 'Audio file too large (max 25MB)')
          );
        }
      }
      return res.status(400).json(
        createApiResponse(false, null, null, 'Audio upload error')
      );
    }
    
    try {
      if (!req.file) {
        throw new ServiceError('Audio file required', 'MISSING_AUDIO_FILE', 400);
      }
      
      const { language = 'en' } = req.body;
      
      if (!['en', 'hi', 'kn'].includes(language)) {
        throw new ServiceError('Unsupported language', 'UNSUPPORTED_LANGUAGE', 400);
      }
      
      // Read the audio file
      const fs = require('fs');
      const audioBuffer = fs.readFileSync(req.file.path);
      
      // Transcribe only (no chat processing)
      const result = await llmService.processVoice(audioBuffer, {
        language,
        responseType: 'text',
        context: 'general'
      });
      
      // Clean up the temporary file
      fs.unlinkSync(req.file.path);
      
      logger.info('Audio transcribed successfully', {
        userId: req.user?.id,
        language,
        transcriptionLength: result.transcription.length
      });
      
      res.json(createApiResponse(true, {
        transcription: result.transcription,
        language: result.language
      }, 'Audio transcribed successfully'));
      
    } catch (error) {
      // Clean up the temporary file if it exists
      if (req.file) {
        try {
          const fs = require('fs');
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          logger.error('File cleanup error:', cleanupError);
        }
      }
      
      logger.error('Transcription error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(
          createApiResponse(false, null, null, error.message)
        );
      }
      
      res.status(500).json(
        createApiResponse(false, null, null, 'Failed to transcribe audio')
      );
    }
  });
});

// GET /api/llm/voice/supported-languages
router.get('/supported-languages', (req: Request, res: Response) => {
  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English'
    },
    {
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिन्दी'
    },
    {
      code: 'kn',
      name: 'Kannada',
      nativeName: 'ಕನ್ನಡ'
    }
  ];
  
  res.json(createApiResponse(true, languages, 'Supported languages retrieved'));
});

export { router as voiceRoutes };