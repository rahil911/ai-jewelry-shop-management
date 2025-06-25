# LLM Service - AI-Powered Multilingual Assistant

## Service Overview
The LLM Service is a sophisticated AI-powered microservice that provides multilingual conversational AI capabilities specifically designed for jewelry shop management. It integrates OpenAI GPT-4 and Google Gemini APIs to deliver natural language processing, voice transcription, and contextual business assistance in English, Hindi, and Kannada.

**Port**: 3007  
**Service Name**: `@jewelry-shop/llm-service`  
**Container**: `llm-service`

## Core Features

### 🧠 AI Integration
- **OpenAI GPT-4**: Primary AI model for chat and voice processing
- **Google Gemini Pro**: Alternative AI model for chat interactions
- **Configurable Model Switching**: Dynamic selection between AI providers
- **Health Monitoring**: Real-time AI service availability checking

### 🗣️ Voice Processing
- **Speech-to-Text**: OpenAI Whisper for transcription
- **Text-to-Speech**: OpenAI TTS for audio responses
- **Multi-format Support**: WAV, MP3, MPEG, WebM, OGG audio files
- **File Size Limit**: 25MB maximum per audio file

### 🌐 Multilingual Support
- **English**: Primary business language
- **Hindi**: हिन्दी - Regional language support
- **Kannada**: ಕನ್ನಡ - Local language support
- **Context-Aware Translation**: Jewelry business terminology preservation

### 💎 Jewelry Business Context
- **Specialized Prompts**: Industry-specific system prompts
- **Business Intelligence**: ERP-integrated AI queries
- **Cultural Awareness**: Indian jewelry traditions and festivals
- **Pricing Assistance**: Gold rate calculations and making charges

## API Endpoints

### Chat API (`/api/llm/chat`)

#### POST `/api/llm/chat`
Process chat messages with AI models
```json
{
  "message": "What's the current gold rate?",
  "language": "en",
  "context": "jewelry_business",
  "model": "openai"
}
```

#### POST `/api/llm/chat/conversation`
Handle conversation with history tracking
```json
{
  "conversationId": "conv_123",
  "message": "How much for a 15g necklace?",
  "language": "hi",
  "context": "jewelry_business"
}
```

#### GET `/api/llm/chat/models`
Check available AI models and their status

### Voice API (`/api/llm/voice`)

#### POST `/api/llm/voice/process`
Full voice processing: transcription + AI response
- **Input**: Audio file (multipart/form-data)
- **Parameters**: language, responseType, context
- **Output**: Transcription + AI response + optional audio URL

#### POST `/api/llm/voice/transcribe`
Audio transcription only
- **Input**: Audio file
- **Output**: Text transcription

#### GET `/api/llm/voice/supported-languages`
List supported languages for voice processing

### Configuration API (`/api/llm/config`)

#### GET `/api/llm/config`
Service configuration and capabilities

#### GET `/api/llm/config/prompts`
Available contexts and sample questions

#### POST `/api/llm/config/test`
Test AI service connectivity

## Architecture

### Dependencies
```json
{
  "openai": "^4.20.1",
  "@google/generative-ai": "^0.2.1",
  "microsoft-cognitiveservices-speech-sdk": "^1.34.0",
  "multer": "^1.4.5-lts.1",
  "ws": "^8.14.2",
  "socket.io": "^4.7.4",
  "franc": "^6.1.0",
  "google-translate-api-x": "^10.7.1"
}
```

### External Integrations
- **Database**: PostgreSQL for conversation history
- **Cache**: Redis for session management
- **Shared Library**: `@jewelry-shop/shared` for common utilities

### File Structure
```
src/
├── index.ts              # Express server setup
├── services/
│   └── LLMService.ts     # Core AI processing logic
├── routes/
│   ├── chat.ts           # Chat endpoints
│   ├── voice.ts          # Voice processing endpoints
│   └── config.ts         # Configuration endpoints
├── middleware/
│   └── errorHandler.ts   # AI-specific error handling
└── utils/
    └── logger.ts         # Service logging
```

## Business Intelligence Capabilities

### Jewelry Business Queries
The service handles natural language queries specific to jewelry operations:

**English Examples:**
- "What's the current gold rate?"
- "How do I calculate making charges?"
- "Show me low stock items"
- "What are popular jewelry trends for Diwali?"

**Hindi Examples:**
- "आज सोने की दर क्या है?"
- "मेकिंग चार्ज कैसे निकालते हैं?"
- "कम स्टॉक वाले आइटम दिखाएं"

**Kannada Examples:**
- "ಇಂದು ಚಿನ್ನದ ದರ ಎಷ್ಟು?"
- "ಮೇಕಿಂಗ್ ಚಾರ್ಜ್ ಹೇಗೆ ಲೆಕ್ಕ ಹಾಕುವುದು?"

### System Prompts
Context-aware prompts for different business scenarios:
- **Jewelry Business Context**: Specialized for shop operations
- **General Context**: Standard AI assistant functionality
- **Cultural Sensitivity**: Festival seasons and traditional preferences

## Security & Performance

### Rate Limiting
- **15-minute window**: 50 requests maximum
- **Stricter limits**: Due to expensive AI operations
- **Token monitoring**: Usage tracking for cost control

### File Processing
- **Temporary Storage**: `temp-uploads/` directory
- **Automatic Cleanup**: File deletion after processing
- **Security Validation**: MIME type checking for audio files

### Error Handling
- **AI Service Errors**: API key, rate limit, quota handling
- **File Upload Errors**: Size limits and format validation
- **Graceful Degradation**: Fallback between AI models

## Environment Configuration

### Required Environment Variables
```bash
# AI Service API Keys
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Database & Cache
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Service Configuration
PORT=3007
NODE_ENV=production
LOG_LEVEL=info
FRONTEND_URL=http://localhost:3000
```

## Deployment

### Docker Configuration
- **Base Image**: `node:18-alpine`
- **Health Check**: `/health` endpoint monitoring
- **Non-root User**: Security best practices
- **Port**: 3007 exposed

### Health Monitoring
```json
{
  "service": "llm-service",
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "ai_models": {
    "openai": "available",
    "gemini": "available"
  }
}
```

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Docker Commands
```bash
# Build image
docker build -t jewelry-shop/llm-service .

# Run container
docker run -p 3007:3007 jewelry-shop/llm-service

# Health check
curl http://localhost:3007/health
```

## Testing

### API Testing Examples
```bash
# Test chat endpoint
curl -X POST http://localhost:3007/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is the gold rate today?","language":"en"}'

# Test voice transcription
curl -X POST http://localhost:3007/api/llm/voice/transcribe \
  -F "audio=@test.wav" \
  -F "language=en"

# Check model availability
curl http://localhost:3007/api/llm/chat/models
```

## Integration with Other Services

### ERP Integration Points
- **Inventory Service**: Stock level queries
- **Pricing Service**: Gold rate and calculation queries
- **Order Service**: Order status and processing queries
- **User Service**: Customer interaction history

### Real-time Features
- **WebSocket Support**: Live chat sessions
- **Voice Streaming**: Real-time transcription
- **Context Persistence**: Conversation history

## Performance Considerations

### Optimization Strategies
- **Model Caching**: Reduce API call latency
- **Response Streaming**: Chunked responses for long content
- **Conversation Compression**: Efficient history storage
- **Rate Limiting**: Cost and performance balance

### Monitoring Metrics
- **Response Time**: AI model processing speed
- **Token Usage**: Cost tracking and optimization
- **Error Rates**: Service reliability monitoring
- **Language Distribution**: Usage analytics

## Future Enhancements

### Planned Features
- **Conversation Memory**: Long-term context retention
- **Voice Cloning**: Personalized audio responses
- **Image Understanding**: Visual jewelry analysis
- **Advanced Analytics**: Business intelligence dashboards
- **Custom Model Training**: Domain-specific fine-tuning

### Integration Roadmap
- **WhatsApp Integration**: Direct customer communication
- **Mobile App**: Voice-first jewelry shopping
- **IoT Integration**: Smart scale and measurement tools
- **AR/VR Support**: Virtual jewelry try-on assistance

---

## Summary

The LLM Service is the intelligent core of the jewelry shop management system, providing:
- **Multi-modal AI**: Text, voice, and future image processing
- **Business Intelligence**: Jewelry-specific knowledge and assistance
- **Cultural Sensitivity**: Multi-language support for Indian markets
- **Enterprise Grade**: Scalable, secure, and production-ready architecture
- **Cost Optimization**: Efficient AI usage with monitoring and controls

This service transforms traditional jewelry shop operations into intelligent, conversational experiences that can handle complex business queries in natural language across multiple languages and modalities.