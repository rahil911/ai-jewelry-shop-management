require('dotenv').config();

async function testOpenAI() {
  console.log('🤖 Testing OpenAI Integration...\n');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ OpenAI Error:', data.error);
    } else {
      console.log('✅ OpenAI Response:');
      console.log(data.choices[0].message.content);
      console.log(`\n📊 Tokens used: ${data.usage.total_tokens}`);
    }
    
  } catch (error) {
    console.error('❌ OpenAI Error:', error.message);
  }
}

async function testGemini() {
  console.log('\n🧠 Testing Google Gemini Integration...\n');
  
  try {
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
              text: 'As a jewelry shop management assistant, explain the difference between 22K and 18K gold in simple terms for a shop owner.'
            }]
          }]
        })
      }
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Gemini Error:', data.error);
    } else {
      console.log('✅ Gemini Response:');
      console.log(data.candidates[0].content.parts[0].text);
    }
    
  } catch (error) {
    console.error('❌ Gemini Error:', error.message);
  }
}

async function runTests() {
  console.log('🧪 AI Services Integration Test\n');
  console.log('📋 Environment Check:');
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Set (' + process.env.OPENAI_API_KEY.substring(0, 10) + '...)' : '❌ Missing'}`);
  console.log(`Gemini API Key: ${process.env.GOOGLE_GEMINI_API_KEY ? '✅ Set (' + process.env.GOOGLE_GEMINI_API_KEY.substring(0, 10) + '...)' : '❌ Missing'}`);
  console.log('');
  
  if (process.env.OPENAI_API_KEY) {
    await testOpenAI();
  }
  
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    await testGemini();
  }
  
  console.log('\n🎉 AI Testing completed!');
  console.log('\n📝 Recommendations:');
  console.log('💰 Free Gold Rate API: https://metals-api.com/signup/free (100 requests/month)');
  console.log('🎙️  Voice integration: Azure Speech Services or Google Speech-to-Text');
  console.log('📱 WhatsApp API: Twilio WhatsApp Business API');
}

runTests().catch(console.error);