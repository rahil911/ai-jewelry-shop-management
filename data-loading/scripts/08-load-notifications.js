#!/usr/bin/env node

const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');

const db = require('../config/database');
const settings = require('../config/settings');

console.log(chalk.blue.bold('\n🔔 Loading Notifications and AI Conversations Data\n'));

async function loadNotifications() {
  try {
    console.log('🔍 Testing database connection...');
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Get users for notifications
    const users = await db.query('SELECT id, role FROM users');
    
    if (users.rows.length === 0) {
      console.log('⚠️ No users found. Please run user loading script first.');
      return { success: true, notificationsLoaded: 0, conversationsLoaded: 0 };
    }

    console.log(`📧 Creating notifications and AI conversations...`);

    const notifications = [];
    const aiConversations = [];

    // Generate notifications for the last 30 days
    const notificationTypes = [
      'order_status_change', 'payment_received', 'inventory_low_stock', 
      'customer_registration', 'repair_completed', 'promotional_offer'
    ];
    
    const channels = ['email', 'sms', 'whatsapp', 'push', 'in_app'];
    const statuses = ['sent', 'delivered', 'read', 'failed'];

    for (let i = 0; i < 200; i++) {
      const user = users.rows[Math.floor(Math.random() * users.rows.length)];
      const notificationType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const sentAt = status !== 'failed' ? new Date(createdAt.getTime() + Math.random() * 60 * 60 * 1000) : null;
      const readAt = status === 'read' ? new Date(sentAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) : null;

      const notification = {
        id: uuidv4(),
        user_id: user.id,
        notification_type: notificationType,
        title: generateNotificationTitle(notificationType),
        message: generateNotificationMessage(notificationType),
        channel: channel,
        status: status,
        scheduled_at: createdAt,
        sent_at: sentAt,
        read_at: readAt,
        metadata: generateNotificationMetadata(notificationType),
        created_at: createdAt,
      };
      notifications.push(notification);
    }

    // Generate AI conversations
    const languages = ['en', 'hi', 'kn'];
    const models = ['gpt-4', 'gemini-pro', 'claude-3'];
    const inputTypes = ['text', 'voice'];

    for (let i = 0; i < 150; i++) {
      const user = users.rows[Math.floor(Math.random() * users.rows.length)];
      const language = languages[Math.floor(Math.random() * languages.length)];
      const model = models[Math.floor(Math.random() * models.length)];
      const inputType = inputTypes[Math.floor(Math.random() * inputTypes.length)];
      
      const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
      const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const conversation = {
        id: uuidv4(),
        user_id: user.id,
        session_id: sessionId,
        language: language,
        model_used: model,
        input_type: inputType,
        user_input: generateUserInput(language, user.role),
        ai_response: generateAIResponse(language, user.role),
        context_data: generateContextData(user.role),
        processing_time_ms: 500 + Math.floor(Math.random() * 2000),
        tokens_used: 50 + Math.floor(Math.random() * 200),
        cost_incurred: parseFloat((Math.random() * 0.01).toFixed(4)),
        created_at: createdAt,
      };
      aiConversations.push(conversation);
    }

    // Insert data
    console.log('\n📥 Inserting notifications...');
    const notificationResult = await db.bulkInsert('notifications', notifications, [], []);
    
    console.log('\n📥 Inserting AI conversations...');
    const conversationResult = await db.bulkInsert('ai_conversations', aiConversations, [], []);

    console.log('\n✅ Verifying data...');
    const finalCounts = {
      notifications: await db.getRowCount('notifications'),
      aiConversations: await db.getRowCount('ai_conversations'),
    };
    
    console.log('   Final counts:');
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`     ${table}: ${count}`);
    });

    console.log(chalk.green.bold('\n✅ Notifications data loading completed successfully!\n'));

    return {
      success: true,
      notificationsLoaded: finalCounts.notifications,
      conversationsLoaded: finalCounts.aiConversations,
    };

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error loading notifications data:'), error.message);
    return { success: false, error: error.message };
  }
}

// Helper functions
function generateNotificationTitle(type) {
  const titles = {
    order_status_change: 'Order Status Updated',
    payment_received: 'Payment Confirmation',
    inventory_low_stock: 'Low Stock Alert',
    customer_registration: 'Welcome to Sri Lakshmi Jewellers',
    repair_completed: 'Repair Service Completed',
    promotional_offer: 'Special Offer Just for You!',
  };
  return titles[type] || 'Notification';
}

function generateNotificationMessage(type) {
  const messages = {
    order_status_change: 'Your order status has been updated. Please check your account for details.',
    payment_received: 'We have received your payment. Thank you for choosing us!',
    inventory_low_stock: 'Some items are running low on stock. Please reorder soon.',
    customer_registration: 'Welcome! Your account has been created successfully.',
    repair_completed: 'Your jewelry repair has been completed and is ready for pickup.',
    promotional_offer: 'Enjoy special discounts on our premium collection. Limited time offer!',
  };
  return messages[type] || 'You have a new notification.';
}

function generateNotificationMetadata(type) {
  const metadata = {
    order_status_change: { order_id: `ORD${Math.floor(Math.random() * 10000)}`, new_status: 'completed' },
    payment_received: { payment_id: `PAY${Math.floor(Math.random() * 10000)}`, amount: Math.floor(Math.random() * 100000) },
    inventory_low_stock: { item_count: Math.floor(Math.random() * 10) + 1 },
    promotional_offer: { discount_percent: Math.floor(Math.random() * 20) + 5 },
  };
  return metadata[type] || {};
}

function generateUserInput(language, role) {
  const inputs = {
    en: {
      customer: ['What is the current gold rate?', 'I want to buy a necklace', 'Can you help me track my order?'],
      staff: ['Show me today\'s sales report', 'Which items are low in stock?', 'Create a new order for customer'],
      manager: ['Generate monthly analytics', 'Show profit margins', 'Update pricing rules'],
    },
    hi: {
      customer: ['आज सोने का रेट क्या है?', 'मुझे हार खरीदना है', 'मेरा ऑर्डर कहाँ है?'],
      staff: ['आज की बिक्री दिखाओ', 'कौन से आइटम कम हैं?', 'नया ऑर्डर बनाओ'],
      manager: ['महीने की रिपोर्ट दो', 'प्रॉफिट मार्जिन दिखाओ', 'कीमत अपडेट करो'],
    },
    kn: {
      customer: ['ಇಂದು ಚಿನ್ನದ ಬೆಲೆ ಎಷ್ಟು?', 'ನನಗೆ ಹಾರ ಬೇಕು', 'ನನ್ನ ಆರ್ಡರ್ ಎಲ್ಲಿದೆ?'],
      staff: ['ಇಂದಿನ ಮಾರಾಟ ತೋರಿಸಿ', 'ಯಾವ ಐಟಂಗಳು ಕಡಿಮೆ ಇವೆ?', 'ಹೊಸ ಆರ್ಡರ್ ಮಾಡಿ'],
      manager: ['ತಿಂಗಳ ವರದಿ ಕೊಡಿ', 'ಲಾಭ ತೋರಿಸಿ', 'ಬೆಲೆ ಅಪ್ಡೇಟ್ ಮಾಡಿ'],
    },
  };
  
  const roleInputs = inputs[language]?.[role] || inputs.en.customer;
  return roleInputs[Math.floor(Math.random() * roleInputs.length)];
}

function generateAIResponse(language, role) {
  const responses = {
    en: 'I can help you with that. Let me fetch the latest information for you.',
    hi: 'मैं आपकी मदद कर सकता हूं। मैं आपके लिए नवीनतम जानकारी लाता हूं।',
    kn: 'ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದು। ನಿಮಗಾಗಿ ಇತ್ತೀಚಿನ ಮಾಹಿತಿ ತರುತ್ತೇನೆ।',
  };
  return responses[language] || responses.en;
}

function generateContextData(role) {
  return {
    user_role: role,
    session_start: new Date().toISOString(),
    device_type: Math.random() > 0.5 ? 'mobile' : 'desktop',
    location: 'Bangalore, India',
  };
}

// Run the script if called directly
if (require.main === module) {
  loadNotifications()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('❌ Unexpected error:'), error);
      process.exit(1);
    });
}

module.exports = loadNotifications;