const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('public'));

// Simple HTML dashboard
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jewelry Shop Management System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-amber-50 to-orange-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg shadow-xl p-6 mb-8">
            <h1 class="text-4xl font-bold mb-2">💎 Jewelry Shop Management System</h1>
            <p class="text-amber-100">AI-Powered Business Management Dashboard</p>
            <div class="mt-4 flex flex-wrap gap-4 text-sm">
                <span class="bg-amber-700 px-3 py-1 rounded-full">
                    <i class="fas fa-robot mr-1"></i> AI Assistant: OpenAI GPT-4 + Gemini 2.5 Flash
                </span>
                <span class="bg-amber-700 px-3 py-1 rounded-full">
                    <i class="fas fa-database mr-1"></i> PostgreSQL + Redis
                </span>
                <span class="bg-amber-700 px-3 py-1 rounded-full">
                    <i class="fas fa-language mr-1"></i> Multi-language (EN/HI/KN)
                </span>
            </div>
        </div>

        <!-- System Status -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold mb-4">🏥 System Health</h3>
                <div id="systemHealth" class="text-gray-600">Checking...</div>
            </div>
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold mb-4">💰 Current Gold Rates</h3>
                <div id="goldRates" class="text-gray-600">Loading...</div>
            </div>
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold mb-4">📦 Inventory Status</h3>
                <div id="inventoryStatus" class="text-gray-600">Loading...</div>
            </div>
        </div>

        <!-- AI Chat Interface -->
        <div class="bg-white rounded-lg shadow-xl p-6 mb-8">
            <h3 class="text-xl font-bold mb-4">
                <i class="fas fa-robot text-blue-600 mr-2"></i>
                AI Business Assistant
            </h3>
            <div class="flex flex-wrap gap-2 mb-4">
                <button onclick="quickQuestion('What are today\\'s gold rates?')" 
                        class="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm">
                    📊 Gold Rates
                </button>
                <button onclick="quickQuestion('How can I improve customer retention?')" 
                        class="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm">
                    💡 Business Advice
                </button>
                <button onclick="quickQuestion('Explain 22K vs 18K gold for customers')" 
                        class="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm">
                    📚 Product Knowledge
                </button>
                <button onclick="quickQuestion('What inventory should I order?')" 
                        class="bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm">
                    📦 Inventory
                </button>
            </div>
            <div class="flex gap-2 mb-4">
                <select id="aiModel" class="border rounded-lg px-3 py-2">
                    <option value="gemini">Gemini 2.5 Flash (Recommended)</option>
                    <option value="openai">OpenAI GPT-4</option>
                </select>
                <button onclick="compareModels()" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg">
                    🔄 Compare Both
                </button>
            </div>
            <div class="flex gap-2">
                <input type="text" id="chatInput" placeholder="Ask anything about your jewelry business..." 
                       class="flex-1 border rounded-lg px-4 py-2" onkeypress="handleKeyPress(event)">
                <button onclick="sendMessage()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                    <i class="fas fa-paper-plane mr-1"></i> Send
                </button>
            </div>
            <div id="chatResponse" class="mt-4 p-4 bg-gray-50 rounded-lg min-h-[100px] hidden">
                <div class="flex items-center mb-2">
                    <i class="fas fa-robot text-blue-600 mr-2"></i>
                    <span class="font-semibold">AI Assistant</span>
                    <span id="aiModelUsed" class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"></span>
                </div>
                <div id="responseContent" class="whitespace-pre-wrap"></div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button onclick="testEndpoint('/api/users')" 
                    class="bg-white hover:bg-gray-50 rounded-lg shadow-md p-4 text-left border-l-4 border-blue-500">
                <i class="fas fa-users text-blue-600 text-xl mb-2"></i>
                <h4 class="font-semibold">View Users</h4>
                <p class="text-sm text-gray-600">Check registered users</p>
            </button>
            <button onclick="testEndpoint('/api/inventory/items')" 
                    class="bg-white hover:bg-gray-50 rounded-lg shadow-md p-4 text-left border-l-4 border-green-500">
                <i class="fas fa-gem text-green-600 text-xl mb-2"></i>
                <h4 class="font-semibold">Inventory</h4>
                <p class="text-sm text-gray-600">Browse jewelry items</p>
            </button>
            <button onclick="testEndpoint('/api/cache/test')" 
                    class="bg-white hover:bg-gray-50 rounded-lg shadow-md p-4 text-left border-l-4 border-purple-500">
                <i class="fas fa-server text-purple-600 text-xl mb-2"></i>
                <h4 class="font-semibold">Cache Test</h4>
                <p class="text-sm text-gray-600">Test Redis caching</p>
            </button>
            <button onclick="window.open('http://localhost:3020/health', '_blank')" 
                    class="bg-white hover:bg-gray-50 rounded-lg shadow-md p-4 text-left border-l-4 border-orange-500">
                <i class="fas fa-robot text-orange-600 text-xl mb-2"></i>
                <h4 class="font-semibold">AI Service</h4>
                <p class="text-sm text-gray-600">Direct AI API access</p>
            </button>
        </div>

        <!-- API Endpoints Reference -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold mb-4">🔗 Available API Endpoints</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <h4 class="font-semibold text-blue-600 mb-2">Core API (Port 3010)</h4>
                    <ul class="space-y-1 text-gray-600">
                        <li>• GET /health - System health check</li>
                        <li>• GET /api/gold-rates/current - Live metal rates</li>
                        <li>• GET /api/users - User management</li>
                        <li>• GET /api/inventory/items - Jewelry inventory</li>
                        <li>• GET /api/cache/test - Redis cache test</li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-semibold text-green-600 mb-2">AI API (Port 3020)</h4>
                    <ul class="space-y-1 text-gray-600">
                        <li>• POST /api/ai/chat - Smart business chat</li>
                        <li>• POST /api/ai/gold-rates - Gold rate analysis</li>
                        <li>• POST /api/ai/inventory - Inventory insights</li>
                        <li>• POST /api/ai/business-advice - Expert advice</li>
                        <li>• POST /api/ai/compare - Model comparison</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Load system status on page load
        window.onload = function() {
            checkSystemHealth();
            loadGoldRates();
            loadInventoryStatus();
        };

        async function checkSystemHealth() {
            try {
                const response = await axios.get('http://localhost:3010/health');
                document.getElementById('systemHealth').innerHTML = \`
                    <div class="text-green-600 font-semibold">✅ System Healthy</div>
                    <div class="text-xs text-gray-500 mt-1">Database: \${response.data.dependencies.database}</div>
                    <div class="text-xs text-gray-500">Redis: \${response.data.dependencies.redis}</div>
                \`;
            } catch (error) {
                document.getElementById('systemHealth').innerHTML = \`
                    <div class="text-red-600 font-semibold">❌ System Error</div>
                    <div class="text-xs text-gray-500 mt-1">\${error.message}</div>
                \`;
            }
        }

        async function loadGoldRates() {
            try {
                const response = await axios.get('http://localhost:3010/api/gold-rates/current');
                const rates = response.data.data;
                document.getElementById('goldRates').innerHTML = rates.map(rate => \`
                    <div class="flex justify-between items-center py-1">
                        <span class="font-medium">\${rate.name} (\${rate.symbol})</span>
                        <span class="text-green-600">₹\${parseFloat(rate.current_rate).toLocaleString()}</span>
                    </div>
                \`).join('');
            } catch (error) {
                document.getElementById('goldRates').innerHTML = '<div class="text-red-600">Error loading rates</div>';
            }
        }

        async function loadInventoryStatus() {
            try {
                const response = await axios.get('http://localhost:3010/api/inventory/items');
                document.getElementById('inventoryStatus').innerHTML = \`
                    <div class="text-blue-600 font-semibold">\${response.data.count} Items</div>
                    <div class="text-xs text-gray-500 mt-1">Last updated: \${new Date().toLocaleTimeString()}</div>
                \`;
            } catch (error) {
                document.getElementById('inventoryStatus').innerHTML = '<div class="text-red-600">Error loading inventory</div>';
            }
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }

        function quickQuestion(question) {
            document.getElementById('chatInput').value = question;
            sendMessage();
        }

        async function sendMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            if (!message) return;

            const model = document.getElementById('aiModel').value;
            const responseDiv = document.getElementById('chatResponse');
            const contentDiv = document.getElementById('responseContent');
            const modelUsed = document.getElementById('aiModelUsed');

            // Show loading
            responseDiv.classList.remove('hidden');
            contentDiv.textContent = 'AI is thinking...';
            modelUsed.textContent = model === 'gemini' ? 'Gemini 2.5 Flash' : 'OpenAI GPT-4';

            try {
                const response = await axios.post('http://localhost:3020/api/ai/chat', {
                    message: message,
                    model: model,
                    includeContext: true
                });

                contentDiv.textContent = response.data.data.response;
                input.value = '';
            } catch (error) {
                contentDiv.textContent = 'Error: ' + error.message;
            }
        }

        async function compareModels() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            if (!message) {
                alert('Please enter a question first');
                return;
            }

            const responseDiv = document.getElementById('chatResponse');
            const contentDiv = document.getElementById('responseContent');
            const modelUsed = document.getElementById('aiModelUsed');

            responseDiv.classList.remove('hidden');
            contentDiv.textContent = 'Comparing both AI models...';
            modelUsed.textContent = 'Both Models';

            try {
                const response = await axios.post('http://localhost:3020/api/ai/compare', {
                    question: message
                });

                const { openai, gemini } = response.data.data.responses;
                contentDiv.innerHTML = \`
                    <div class="mb-4">
                        <h4 class="font-bold text-blue-600 mb-2">🤖 OpenAI GPT-4 Response:</h4>
                        <div class="bg-blue-50 p-3 rounded border-l-4 border-blue-500">\${openai?.response || 'Not available'}</div>
                    </div>
                    <div>
                        <h4 class="font-bold text-green-600 mb-2">🧠 Gemini 2.5 Flash Response:</h4>
                        <div class="bg-green-50 p-3 rounded border-l-4 border-green-500">\${gemini?.response || 'Not available'}</div>
                    </div>
                \`;
                input.value = '';
            } catch (error) {
                contentDiv.textContent = 'Error: ' + error.message;
            }
        }

        async function testEndpoint(endpoint) {
            try {
                const response = await axios.get('http://localhost:3010' + endpoint);
                alert('Success! Check browser console for details.');
                console.log('API Response:', response.data);
            } catch (error) {
                alert('Error: ' + error.message);
                console.error('API Error:', error);
            }
        }
    </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`🌐 Frontend Dashboard running on http://localhost:${PORT}`);
  console.log(`📊 Connects to API: http://localhost:3010`);
  console.log(`🤖 Connects to AI: http://localhost:3020`);
});