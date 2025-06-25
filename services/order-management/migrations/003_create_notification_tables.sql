-- Migration: Create notification tracking tables
-- Description: Add tables for notification management and delivery tracking
-- Date: 2024-12-25

-- Create notification type enum
CREATE TYPE notification_type_enum AS ENUM (
  'order_created',
  'status_change',
  'progress_update',
  'completion',
  'repair_update',
  'return_update',
  'custom_message'
);

-- Create notification channel enum
CREATE TYPE notification_channel_enum AS ENUM (
  'whatsapp',
  'sms',
  'email',
  'push'
);

-- Create order notifications table
CREATE TABLE order_notifications (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  repair_id INTEGER REFERENCES repair_requests(id) ON DELETE CASCADE,
  return_id INTEGER REFERENCES return_requests(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES users(id),
  notification_type notification_type_enum NOT NULL,
  channels notification_channel_enum[] NOT NULL,
  template_data JSON NOT NULL DEFAULT '{}'::json,
  sent_at TIMESTAMP,
  delivery_status JSON DEFAULT '{}'::json,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notification templates table
CREATE TABLE notification_templates (
  id SERIAL PRIMARY KEY,
  notification_type notification_type_enum NOT NULL,
  channel notification_channel_enum NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  subject VARCHAR(200),
  template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_order_notifications_order_id ON order_notifications(order_id);
CREATE INDEX idx_order_notifications_repair_id ON order_notifications(repair_id);
CREATE INDEX idx_order_notifications_return_id ON order_notifications(return_id);
CREATE INDEX idx_order_notifications_customer_id ON order_notifications(customer_id);
CREATE INDEX idx_order_notifications_type ON order_notifications(notification_type);
CREATE INDEX idx_order_notifications_sent_at ON order_notifications(sent_at);
CREATE INDEX idx_order_notifications_created_at ON order_notifications(created_at);

CREATE INDEX idx_notification_templates_type_channel ON notification_templates(notification_type, channel);
CREATE INDEX idx_notification_templates_language ON notification_templates(language);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active);

-- Create unique constraint for template type/channel/language combination
CREATE UNIQUE INDEX idx_notification_templates_unique 
ON notification_templates(notification_type, channel, language) 
WHERE is_active = true;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_template_updated_at();

-- Insert default notification templates
INSERT INTO notification_templates (notification_type, channel, language, subject, template) VALUES
-- Order Created Templates
('order_created', 'sms', 'en', NULL, 'Hi {{customer_name}}, your order {{order_number}} has been created successfully. Total: ₹{{total_amount}}. We will keep you updated on the progress.'),
('order_created', 'whatsapp', 'en', NULL, 'Hi {{customer_name}}! 👋\n\nYour order has been created successfully!\n\n📦 Order: {{order_number}}\n💰 Total: ₹{{total_amount}}\n\nWe will keep you updated on the progress. Thank you for choosing us! ✨'),
('order_created', 'email', 'en', 'Order Confirmation - {{order_number}}', 'Dear {{customer_name}},\n\nThank you for your order! Your order {{order_number}} has been confirmed.\n\nOrder Total: ₹{{total_amount}}\n\nWe will keep you updated on the progress.\n\nBest regards,\nYour Jewelry Team'),

-- Status Change Templates  
('status_change', 'sms', 'en', NULL, 'Order {{order_number}} status updated to: {{status}}. {{#estimated_completion}}Expected completion: {{estimated_completion}}.{{/estimated_completion}}'),
('status_change', 'whatsapp', 'en', NULL, '📋 Order Update\n\n📦 Order: {{order_number}}\n🔄 Status: {{status}}\n\n{{#estimated_completion}}⏰ Expected completion: {{estimated_completion}}{{/estimated_completion}}\n\n{{#custom_message}}📝 {{custom_message}}{{/custom_message}}'),
('status_change', 'email', 'en', 'Order Status Update - {{order_number}}', 'Dear {{customer_name}},\n\nYour order {{order_number}} status has been updated to: {{status}}\n\n{{#estimated_completion}}Expected completion: {{estimated_completion}}{{/estimated_completion}}\n\n{{#custom_message}}Additional notes: {{custom_message}}{{/custom_message}}\n\nBest regards,\nYour Jewelry Team'),

-- Repair Update Templates
('repair_update', 'sms', 'en', NULL, 'Repair update for order {{order_number}}: {{status}}. Repair type: {{repair_type}}.'),
('repair_update', 'whatsapp', 'en', NULL, '🔧 Repair Update\n\n📦 Order: {{order_number}}\n🔄 Status: {{status}}\n⚙️ Repair Type: {{repair_type}}\n\n{{#custom_message}}📝 {{custom_message}}{{/custom_message}}'),
('repair_update', 'email', 'en', 'Repair Status Update - {{order_number}}', 'Dear {{customer_name}},\n\nYour jewelry repair for order {{order_number}} has been updated:\n\nStatus: {{status}}\nRepair Type: {{repair_type}}\n\n{{#custom_message}}Notes: {{custom_message}}{{/custom_message}}\n\nBest regards,\nYour Jewelry Team'),

-- Return Update Templates
('return_update', 'sms', 'en', NULL, 'Return request for order {{order_number}} status: {{status}}. Reason: {{return_reason}}.'),
('return_update', 'whatsapp', 'en', NULL, '↩️ Return Update\n\n📦 Order: {{order_number}}\n🔄 Status: {{status}}\n📝 Reason: {{return_reason}}\n\n{{#custom_message}}💬 {{custom_message}}{{/custom_message}}'),
('return_update', 'email', 'en', 'Return Request Update - {{order_number}}', 'Dear {{customer_name}},\n\nYour return request for order {{order_number}} has been updated:\n\nStatus: {{status}}\nReason: {{return_reason}}\n\n{{#custom_message}}Notes: {{custom_message}}{{/custom_message}}\n\nBest regards,\nYour Jewelry Team');