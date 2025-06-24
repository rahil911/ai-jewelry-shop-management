-- Jewelry Shop Management System Database Schema
-- Comprehensive database design for Indian jewelry business

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users and Authentication Tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'manager', 'staff', 'customer')),
    preferred_language VARCHAR(10) DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'kn')),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    loyalty_points INTEGER DEFAULT 0,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    communication_preferences JSONB DEFAULT '{"email": true, "sms": true, "whatsapp": false}',
    birth_date DATE,
    anniversary_date DATE,
    preferred_categories TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Metal Types and Pricing Tables
CREATE TABLE metal_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    current_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    rate_per VARCHAR(20) DEFAULT 'gram' CHECK (rate_per IN ('gram', 'tola', 'ounce')),
    rate_source VARCHAR(100),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gold_rates_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metal_type_id UUID REFERENCES metal_types(id),
    rate_per_gram DECIMAL(10,2) NOT NULL,
    rate_per_tola DECIMAL(10,2),
    rate_source VARCHAR(100) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metal_type_id UUID REFERENCES metal_types(id),
    purity_name VARCHAR(20) NOT NULL, -- 22K, 18K, 14K, 925 Silver, etc.
    purity_percentage DECIMAL(5,2) NOT NULL, -- 91.67 for 22K, 75.00 for 18K
    making_charge_rate DECIMAL(5,2) DEFAULT 0, -- Base rate for this purity
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(metal_type_id, purity_name)
);

-- Categories and Product Organization
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100), -- Hindi name
    name_kn VARCHAR(100), -- Kannada name
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    making_charge_percentage DECIMAL(5,2) DEFAULT 10.0,
    image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers and Vendors
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    address TEXT,
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    bank_details JSONB,
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Jewelry Inventory
CREATE TABLE jewelry_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(200) NOT NULL,
    name_hi VARCHAR(200), -- Hindi name
    name_kn VARCHAR(200), -- Kannada name
    description TEXT,
    category_id UUID REFERENCES categories(id),
    metal_type_id UUID REFERENCES metal_types(id),
    purity_id UUID REFERENCES purities(id),
    gross_weight DECIMAL(8,3) NOT NULL, -- in grams
    net_weight DECIMAL(8,3) NOT NULL, -- after deducting stone weight
    stone_weight DECIMAL(8,3) DEFAULT 0,
    making_charges DECIMAL(10,2) NOT NULL,
    wastage_percentage DECIMAL(5,2) DEFAULT 0,
    stone_charges DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    base_price DECIMAL(12,2) NOT NULL, -- without current gold rate
    selling_price DECIMAL(12,2) NOT NULL, -- with current market rates
    cost_price DECIMAL(12,2), -- purchase/manufacturing cost
    mrp DECIMAL(12,2), -- Maximum Retail Price
    stock_quantity INTEGER DEFAULT 1,
    min_stock_level INTEGER DEFAULT 0,
    size VARCHAR(20),
    color VARCHAR(50),
    occasion VARCHAR(100),
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'unisex')),
    age_group VARCHAR(20) CHECK (age_group IN ('kids', 'adult', 'senior')),
    style VARCHAR(100),
    images TEXT[], -- Array of image URLs
    certifications TEXT[], -- Array of certification numbers
    tags TEXT[], -- Search tags
    is_customizable BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    location VARCHAR(100), -- Storage location
    supplier_id UUID REFERENCES suppliers(id),
    purchase_date DATE,
    warranty_months INTEGER DEFAULT 12,
    care_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Making Charges Configuration
CREATE TABLE making_charges_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id),
    purity_id UUID REFERENCES purities(id),
    charge_type VARCHAR(20) NOT NULL CHECK (charge_type IN ('percentage', 'per_gram', 'fixed')),
    rate_value DECIMAL(10,2) NOT NULL,
    minimum_charge DECIMAL(10,2) DEFAULT 0,
    maximum_charge DECIMAL(10,2),
    weight_range_min DECIMAL(8,3) DEFAULT 0,
    weight_range_max DECIMAL(8,3),
    location_id UUID, -- For different rates at different locations
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, purity_id, charge_type)
);

-- Orders and Transactions
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id),
    staff_id UUID REFERENCES users(id),
    order_type VARCHAR(20) DEFAULT 'purchase' CHECK (order_type IN ('purchase', 'repair', 'customization', 'exchange')),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled', 'refunded')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    making_charges_total DECIMAL(12,2) DEFAULT 0,
    stone_charges_total DECIMAL(12,2) DEFAULT 0,
    wastage_total DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed', 'loyalty')),
    cgst_amount DECIMAL(10,2) DEFAULT 0,
    sgst_amount DECIMAL(10,2) DEFAULT 0,
    igst_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    advance_paid DECIMAL(12,2) DEFAULT 0,
    balance_amount DECIMAL(12,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
    delivery_type VARCHAR(20) DEFAULT 'pickup' CHECK (delivery_type IN ('pickup', 'home_delivery', 'courier')),
    delivery_address TEXT,
    delivery_date DATE,
    special_instructions TEXT,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    jewelry_item_id UUID REFERENCES jewelry_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    making_charges DECIMAL(10,2) NOT NULL,
    stone_charges DECIMAL(10,2) DEFAULT 0,
    wastage_charges DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL,
    gold_rate_at_time DECIMAL(10,2), -- Gold rate when order was placed
    customization_details JSONB,
    special_instructions TEXT,
    is_gift BOOLEAN DEFAULT false,
    gift_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    customization_type VARCHAR(50) NOT NULL, -- size_change, engraving, design_modification
    description TEXT NOT NULL,
    additional_cost DECIMAL(10,2) DEFAULT 0,
    additional_weight DECIMAL(8,3) DEFAULT 0,
    estimated_days INTEGER DEFAULT 7,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Repair Services
CREATE TABLE repair_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id),
    staff_id UUID REFERENCES users(id),
    repair_number VARCHAR(50) UNIQUE NOT NULL,
    item_description TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    estimated_days INTEGER DEFAULT 7,
    status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'diagnosed', 'in_progress', 'completed', 'ready_for_pickup', 'delivered', 'cancelled')),
    received_date DATE DEFAULT CURRENT_DATE,
    completion_date DATE,
    images TEXT[],
    parts_used JSONB,
    labor_charges DECIMAL(10,2) DEFAULT 0,
    material_charges DECIMAL(10,2) DEFAULT 0,
    warranty_days INTEGER DEFAULT 90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments and Financial Transactions
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    repair_id UUID REFERENCES repair_services(id),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi', 'net_banking', 'cheque', 'gold_exchange', 'emi')),
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    transaction_id VARCHAR(255),
    payment_gateway VARCHAR(50),
    gateway_response JSONB,
    reference_number VARCHAR(100),
    processed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices and Billing
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    customer_id UUID REFERENCES users(id),
    invoice_type VARCHAR(20) DEFAULT 'sale' CHECK (invoice_type IN ('sale', 'repair', 'estimate', 'credit_note', 'debit_note')),
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    cgst_rate DECIMAL(5,2) DEFAULT 1.5,
    sgst_rate DECIMAL(5,2) DEFAULT 1.5,
    igst_rate DECIMAL(5,2) DEFAULT 3.0,
    cgst_amount DECIMAL(10,2) DEFAULT 0,
    sgst_amount DECIMAL(10,2) DEFAULT 0,
    igst_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_terms VARCHAR(100),
    due_date DATE,
    pdf_path VARCHAR(500),
    is_cancelled BOOLEAN DEFAULT false,
    cancelled_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Certificates and Quality Assurance
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jewelry_item_id UUID REFERENCES jewelry_items(id),
    certificate_type VARCHAR(50) NOT NULL, -- hallmark, quality, appraisal, lab_report
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    issuing_authority VARCHAR(200) NOT NULL,
    issue_date DATE NOT NULL,
    validity_date DATE,
    grade VARCHAR(20),
    purity_tested DECIMAL(5,2),
    weight_certified DECIMAL(8,3),
    stone_details JSONB,
    document_url VARCHAR(500),
    qr_code VARCHAR(500),
    verification_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Image Management
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jewelry_item_id UUID REFERENCES jewelry_items(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    cdn_url VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    is_primary BOOLEAN DEFAULT false,
    alt_text VARCHAR(255),
    tags TEXT[],
    upload_source VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pricing Rules and Discounts
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(30) NOT NULL CHECK (rule_type IN ('quantity_discount', 'category_discount', 'customer_discount', 'seasonal_offer', 'loyalty_discount')),
    conditions JSONB NOT NULL, -- Flexible conditions in JSON format
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_amount DECIMAL(12,2) DEFAULT 0,
    maximum_discount DECIMAL(12,2),
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- LLM and AI Conversations
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL CHECK (language IN ('en', 'hi', 'kn')),
    model_used VARCHAR(50) NOT NULL,
    input_type VARCHAR(20) CHECK (input_type IN ('text', 'voice')),
    user_input TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    context_data JSONB,
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    cost_incurred DECIMAL(8,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications and Alerts
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(20) CHECK (channel IN ('email', 'sms', 'whatsapp', 'push', 'in_app')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics and Reporting
CREATE TABLE sales_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    average_order_value DECIMAL(12,2) DEFAULT 0,
    top_category_id UUID REFERENCES categories(id),
    top_metal_type_id UUID REFERENCES metal_types(id),
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    gold_rate_avg DECIMAL(10,2),
    profit_margin DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
);

-- Audit Trail for Security and Compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance Optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_jewelry_items_sku ON jewelry_items(sku);
CREATE INDEX idx_jewelry_items_category ON jewelry_items(category_id);
CREATE INDEX idx_jewelry_items_metal_type ON jewelry_items(metal_type_id);
CREATE INDEX idx_jewelry_items_available ON jewelry_items(is_available);
CREATE INDEX idx_jewelry_items_featured ON jewelry_items(is_featured);
CREATE INDEX idx_jewelry_items_tags ON jewelry_items USING GIN(tags);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_gold_rates_recorded_at ON gold_rates_history(recorded_at);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_images_jewelry_item ON images(jewelry_item_id);

-- Full-text search indexes
CREATE INDEX idx_jewelry_items_search ON jewelry_items USING GIN(to_tsvector('english', name || ' ' || description));
CREATE INDEX idx_customers_search ON users USING GIN(to_tsvector('english', first_name || ' ' || last_name || ' ' || email));

-- Insert Default Data
INSERT INTO metal_types (name, symbol, current_rate, rate_per) VALUES 
('Gold', 'AU', 6500.00, 'gram'),
('Silver', 'AG', 85.00, 'gram'),
('Platinum', 'PT', 3200.00, 'gram');

INSERT INTO purities (metal_type_id, purity_name, purity_percentage, making_charge_rate) VALUES 
((SELECT id FROM metal_types WHERE symbol = 'AU'), '22K', 91.67, 10.0),
((SELECT id FROM metal_types WHERE symbol = 'AU'), '18K', 75.00, 12.0),
((SELECT id FROM metal_types WHERE symbol = 'AU'), '14K', 58.33, 15.0),
((SELECT id FROM metal_types WHERE symbol = 'AG'), '925', 92.50, 8.0),
((SELECT id FROM metal_types WHERE symbol = 'PT'), '950', 95.00, 15.0);

INSERT INTO categories (name, name_hi, name_kn, description, making_charge_percentage) VALUES 
('Rings', 'अंगूठी', 'ಉಂಗುರ', 'Wedding rings, engagement rings, and fashion rings', 12.0),
('Necklaces', 'हार', 'ಹಾರ', 'Gold chains, pendant sets, and traditional necklaces', 10.0),
('Earrings', 'कानरी', 'ಕಿವಿಯೋಲೆ', 'Studs, hoops, and traditional earrings', 15.0),
('Bangles', 'कंगन', 'ಕಂಕಣ', 'Traditional bangles and bracelets', 8.0),
('Pendants', 'लकेट', 'ಪೆಂಡೆಂಟ್', 'Religious and fashion pendants', 18.0),
('Chains', 'चेन', 'ಚೈನ್', 'Gold and silver chains', 6.0),
('Nose Pins', 'नकी', 'ಮೂಗುತಿ', 'Traditional nose pins and rings', 20.0);

INSERT INTO users (email, password_hash, first_name, last_name, role, preferred_language) VALUES 
('owner@jewelryshop.com', '$2b$10$rQZ0P4PcJYjXK9X8mZyH0.QXGy4gJkKv4wKqJvS8.Dv3pOQF4kKMW', 'Shop', 'Owner', 'owner', 'en'),
('manager@jewelryshop.com', '$2b$10$rQZ0P4PcJYjXK9X8mZyH0.QXGy4gJkKv4wKqJvS8.Dv3pOQF4kKMW', 'Store', 'Manager', 'manager', 'hi'),
('staff@jewelryshop.com', '$2b$10$rQZ0P4PcJYjXK9X8mZyH0.QXGy4gJkKv4wKqJvS8.Dv3pOQF4kKMW', 'Sales', 'Staff', 'staff', 'kn');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;   
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jewelry_items_updated_at BEFORE UPDATE ON jewelry_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repair_services_updated_at BEFORE UPDATE ON repair_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ORD' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE order_number_seq START WITH 1;

-- Function to calculate item selling price
CREATE OR REPLACE FUNCTION calculate_selling_price(
    p_metal_type_id UUID,
    p_net_weight DECIMAL,
    p_making_charges DECIMAL,
    p_stone_charges DECIMAL DEFAULT 0,
    p_other_charges DECIMAL DEFAULT 0
) RETURNS DECIMAL AS $$
DECLARE
    current_rate DECIMAL;
    total_price DECIMAL;
BEGIN
    SELECT current_rate INTO current_rate FROM metal_types WHERE id = p_metal_type_id;
    
    total_price := (current_rate * p_net_weight) + p_making_charges + p_stone_charges + p_other_charges;
    
    RETURN total_price;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing
INSERT INTO suppliers (name, contact_person, email, phone, gst_number) VALUES 
('Mumbai Gold Suppliers', 'Raj Patel', 'raj@mumbaiGold.com', '+91-9876543210', '27ABCDE1234F1Z5');

-- Sample jewelry items
INSERT INTO jewelry_items (
    sku, name, name_hi, name_kn, description, category_id, metal_type_id, purity_id,
    gross_weight, net_weight, making_charges, selling_price, cost_price
) VALUES 
('GR001', 'Traditional Gold Ring', 'पारंपरिक सोने की अंगूठी', 'ಸಾಂಪ್ರದಾಯಿಕ ಚಿನ್ನದ ಉಂಗುರ',
 'Beautiful traditional gold ring with intricate design',
 (SELECT id FROM categories WHERE name = 'Rings'),
 (SELECT id FROM metal_types WHERE symbol = 'AU'),
 (SELECT id FROM purities WHERE purity_name = '22K'),
 5.500, 5.200, 650.00, 34500.00, 32000.00);

COMMIT;