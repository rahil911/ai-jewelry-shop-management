require('dotenv').config();
const axios = require('axios');

async function testOpenAI() {
  console.log('🤖 Testing OpenAI Integration...\n');
  
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for a jewelry shop management system. Provide concise, helpful responses about jewelry business operations.'
        },
        {
          role: 'user',
          content: 'What should I know about gold purity for jewelry business?'
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ OpenAI Response:');
    console.log(response.data.choices[0].message.content);
    console.log(`\n📊 Tokens used: ${response.data.usage.total_tokens}`);
    
  } catch (error) {
    console.error('❌ OpenAI Error:', error.response?.data || error.message);
  }
}

async function testGemini() {
  console.log('\n🧠 Testing Google Gemini Integration...\n');
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: 'As a jewelry shop management assistant, explain the difference between 22K and 18K gold in simple terms for a shop owner.'
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Gemini Response:');
    console.log(response.data.candidates[0].content.parts[0].text);
    
  } catch (error) {
    console.error('❌ Gemini Error:', error.response?.data || error.message);
  }
}

async function testGoldRateAPI() {
  console.log('\n💰 Testing Gold Rate API (metals-api.com - Free)...\n');
  
  try {
    // Using free tier of metals-api.com (no API key needed for basic requests)
    const response = await axios.get('https://api.metals-api.com/v1/latest?access_key=YOUR_API_KEY&base=USD&symbols=XAU,XAG,XPT');
    
    console.log('✅ Metals API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('ℹ️  Note: This requires a free API key from metals-api.com');
    console.log('📝 Sign up at: https://metals-api.com/signup/free');
    console.log('🔑 Free plan provides 100 requests/month');
  }
}

async function runTests() {
  console.log('🧪 AI & External Services Integration Test\n');
  console.log('📋 Environment Check:');
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`Gemini API Key: ${process.env.GOOGLE_GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log('');
  
  if (process.env.OPENAI_API_KEY) {
    await testOpenAI();
  }
  
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    await testGemini();
  }
  
  await testGoldRateAPI();
  
  console.log('\n🎉 Testing completed!');
}

runTests().catch(console.error);