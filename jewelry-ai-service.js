require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 3020;

app.use(express.json());

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://jeweler:jeweler123@localhost:5432/jewelry_shop_db',
  ssl: false
});

// Redis connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect().catch(console.error);

// AI Service Functions
async function queryOpenAI(systemPrompt, userPrompt, context = {}) {
  try {
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];
    
    // Add context if provided
    if (Object.keys(context).length > 0) {
      messages.push({
        role: 'system',
        content: `Current business context: ${JSON.stringify(context)}`
      });
    }
    
    messages.push({
      role: 'user',
      content: userPrompt
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return {
      response: data.choices[0].message.content,
      tokens: data.usage.total_tokens,
      model: 'gpt-4'
    };
  } catch (error) {
    throw new Error(`OpenAI Error: ${error.message}`);
  }
}

async function queryGemini(prompt, context = {}) {
  try {
    let fullPrompt = prompt;
    
    // Add context if provided
    if (Object.keys(context).length > 0) {
      fullPrompt = `Business Context: ${JSON.stringify(context)}\n\nQuery: ${prompt}`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }]
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return {
      response: data.candidates[0].content.parts[0].text,
      model: 'gemini-2.5-flash'
    };
  } catch (error) {
    throw new Error(`Gemini Error: ${error.message}`);
  }
}

// Get business context from database
async function getBusinessContext() {
  try {
    const [goldRates, inventory, users] = await Promise.all([
      db.query('SELECT name, symbol, current_rate, last_updated FROM metal_types WHERE is_active = true'),
      db.query('SELECT COUNT(*) as total_items, SUM(selling_price * stock_quantity) as total_value FROM jewelry_items WHERE is_available = true'),
      db.query('SELECT COUNT(*) as total_users FROM users WHERE is_active = true')
    ]);

    return {
      goldRates: goldRates.rows,
      inventory: inventory.rows[0],
      userCount: users.rows[0].total_users,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting business context:', error);
    return {};
  }
}

// Routes

// Health check
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    await redisClient.ping();
    
    res.json({
      status: 'healthy',
      service: 'jewelry-ai-service',
      version: '1.0.0',
      ai_models: {
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
        gemini: process.env.GOOGLE_GEMINI_API_KEY ? 'configured' : 'missing'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// AI Chat endpoint with model selection
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { 
      message, 
      model = 'gemini', // Default to Gemini 2.5 Flash
      includeContext = true,
      language = 'en'
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get business context if requested
    const context = includeContext ? await getBusinessContext() : {};

    let result;
    
    if (model === 'openai' && process.env.OPENAI_API_KEY) {
      const systemPrompt = `You are an AI assistant for a jewelry shop management system. You help with business operations, customer queries, inventory management, pricing, and general jewelry knowledge. Keep responses concise but helpful. Language: ${language}`;
      result = await queryOpenAI(systemPrompt, message, context);
    } else if (model === 'gemini' && process.env.GOOGLE_GEMINI_API_KEY) {
      const enhancedPrompt = `You are an AI assistant for a jewelry shop management system. Help with business operations, customer queries, inventory management, pricing, and jewelry knowledge. Be conversational and business-focused. Language: ${language}. User query: ${message}`;
      result = await queryGemini(enhancedPrompt, context);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid model specified or API key missing'
      });
    }

    // Cache the response
    const cacheKey = `ai:${model}:${Buffer.from(message).toString('base64').substring(0, 20)}`;
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(result)); // Cache for 1 hour

    res.json({
      success: true,
      data: {
        query: message,
        ...result,
        language,
        context_included: includeContext,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Jewelry business-specific AI endpoints

// Ask about gold rates and pricing
app.post('/api/ai/gold-rates', async (req, res) => {
  try {
    const { question = "What are the current gold rates and how do they affect pricing?" } = req.body;
    
    const context = await getBusinessContext();
    const prompt = `Based on current gold rates and inventory data, ${question}`;
    
    const result = await queryGemini(prompt, context);
    
    res.json({
      success: true,
      data: {
        ...result,
        context: context.goldRates,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Inventory insights
app.post('/api/ai/inventory', async (req, res) => {
  try {
    const { question = "Give me insights about our current inventory" } = req.body;
    
    const context = await getBusinessContext();
    const inventoryDetails = await db.query(`
      SELECT 
        c.name as category,
        COUNT(*) as item_count,
        AVG(ji.selling_price) as avg_price,
        SUM(ji.stock_quantity) as total_stock
      FROM jewelry_items ji
      LEFT JOIN categories c ON ji.category_id = c.id
      WHERE ji.is_available = true
      GROUP BY c.name
      ORDER BY item_count DESC
    `);
    
    const enhancedContext = {
      ...context,
      inventoryByCategory: inventoryDetails.rows
    };
    
    const result = await queryGemini(question, enhancedContext);
    
    res.json({
      success: true,
      data: {
        ...result,
        inventory_summary: enhancedContext.inventoryByCategory,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Business advice
app.post('/api/ai/business-advice', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }
    
    const context = await getBusinessContext();
    const businessPrompt = `As a jewelry business consultant, provide advice for this question: ${question}`;
    
    const result = await queryOpenAI(
      "You are an expert jewelry business consultant with deep knowledge of inventory management, pricing strategies, customer service, and market trends. Provide practical, actionable advice.",
      businessPrompt,
      context
    );
    
    res.json({
      success: true,
      data: {
        ...result,
        category: 'business-advice',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Compare AI models
app.post('/api/ai/compare', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    const context = await getBusinessContext();
    
    // Query both models in parallel
    const [openaiResult, geminiResult] = await Promise.all([
      process.env.OPENAI_API_KEY ? 
        queryOpenAI("You are a jewelry business assistant. Be concise and practical.", question, context) :
        Promise.resolve(null),
      process.env.GOOGLE_GEMINI_API_KEY ?
        queryGemini(`As a jewelry business assistant: ${question}`, context) :
        Promise.resolve(null)
    ]);

    res.json({
      success: true,
      data: {
        question,
        responses: {
          openai: openaiResult,
          gemini: geminiResult
        },
        comparison: {
          openai_available: !!process.env.OPENAI_API_KEY,
          gemini_available: !!process.env.GOOGLE_GEMINI_API_KEY
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`💎 Jewelry AI Service running on port ${PORT}`);
  console.log(`🤖 AI Models: OpenAI ${process.env.OPENAI_API_KEY ? '✅' : '❌'}, Gemini ${process.env.GOOGLE_GEMINI_API_KEY ? '✅' : '❌'}`);
  console.log(`📋 Health: http://localhost:${PORT}/health`);
  console.log(`💬 Chat: POST http://localhost:${PORT}/api/ai/chat`);
  console.log(`💰 Gold Rates: POST http://localhost:${PORT}/api/ai/gold-rates`);
  console.log(`📦 Inventory: POST http://localhost:${PORT}/api/ai/inventory`);
  console.log(`💡 Business Advice: POST http://localhost:${PORT}/api/ai/business-advice`);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await db.end();
  await redisClient.quit();
  process.exit(0);
});