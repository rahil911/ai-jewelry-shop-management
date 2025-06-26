-- Migration: Create base schema for jewelry shop
-- Description: Create foundational tables required by order management
-- Date: 2024-12-25

-- Create role enum for users
CREATE TYPE user_role_enum AS ENUM ('owner', 'manager', 'staff', 'customer');

-- Create order status enum
CREATE TYPE order_status_enum AS ENUM (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'ready_for_delivery',
  'delivered'
);

-- Create order type enum
CREATE TYPE order_type_enum AS ENUM ('sale', 'repair', 'custom');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'customer',
  phone VARCHAR(20),
  address TEXT,
  preferred_language VARCHAR(10) DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create metal types table
CREATE TABLE IF NOT EXISTS metal_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  current_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  rate_source VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create purities table
CREATE TABLE IF NOT EXISTS purities (
  id SERIAL PRIMARY KEY,
  metal_type_id INTEGER REFERENCES metal_types(id),
  purity_name VARCHAR(10) NOT NULL, -- 22K, 18K, 14K, etc.
  purity_percentage DECIMAL(5,2) NOT NULL,
  making_charge_rate DECIMAL(5,2) DEFAULT 0
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES categories(id),
  making_charge_percentage DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Create jewelry items table
CREATE TABLE IF NOT EXISTS jewelry_items (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  metal_type_id INTEGER REFERENCES metal_types(id),
  purity_id INTEGER REFERENCES purities(id),
  weight DECIMAL(8,3) NOT NULL,
  making_charges DECIMAL(10,2) DEFAULT 0,
  wastage_percentage DECIMAL(5,2) DEFAULT 2.0,
  base_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 1,
  description TEXT,
  images JSON DEFAULT '[]'::json,
  barcode VARCHAR(100),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES users(id),
  staff_id INTEGER REFERENCES users(id),
  status order_status_enum DEFAULT 'pending',
  order_type order_type_enum NOT NULL DEFAULT 'sale',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  making_charges DECIMAL(10,2) DEFAULT 0,
  wastage_amount DECIMAL(10,2) DEFAULT 0,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  estimated_completion TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  jewelry_item_id INTEGER REFERENCES jewelry_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  customization_details TEXT,
  total_price DECIMAL(10,2) NOT NULL
);

-- Create customizations table
CREATE TABLE IF NOT EXISTS customizations (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  customization_type VARCHAR(50) NOT NULL,
  details TEXT NOT NULL,
  additional_cost DECIMAL(10,2) DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status_enum NOT NULL,
  notes TEXT,
  changed_by INTEGER REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create making charges config table
CREATE TABLE IF NOT EXISTS making_charges_config (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id),
  purity_id INTEGER REFERENCES purities(id),
  charge_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
  rate_value DECIMAL(8,2) NOT NULL,
  is_percentage BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create gold rates history table
CREATE TABLE IF NOT EXISTS gold_rates_history (
  id SERIAL PRIMARY KEY,
  metal_type_id INTEGER REFERENCES metal_types(id),
  rate_per_gram DECIMAL(10,2) NOT NULL,
  rate_per_tola DECIMAL(10,2),
  rate_source VARCHAR(100),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_staff_id ON orders(staff_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_jewelry_item_id ON order_items(jewelry_item_id);

CREATE INDEX IF NOT EXISTS idx_jewelry_items_sku ON jewelry_items(sku);
CREATE INDEX IF NOT EXISTS idx_jewelry_items_category_id ON jewelry_items(category_id);
CREATE INDEX IF NOT EXISTS idx_jewelry_items_available ON jewelry_items(is_available);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at ON order_status_history(changed_at);

-- Create triggers for automatic status history
CREATE OR REPLACE FUNCTION create_order_status_history()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, NEW.staff_id);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_order_status_history_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_status_history();

-- Create initial status history entry on insert
CREATE OR REPLACE FUNCTION create_initial_order_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_status_history (order_id, status, changed_by)
  VALUES (NEW.id, NEW.status, NEW.staff_id);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_initial_order_status_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_order_status();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jewelry_items_updated_at
  BEFORE UPDATE ON jewelry_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO metal_types (name, symbol, current_rate, rate_source) VALUES
('Gold', 'AU', 6800.00, 'manual'),
('Silver', 'AG', 80.00, 'manual'),
('Platinum', 'PT', 3200.00, 'manual')
ON CONFLICT DO NOTHING;

INSERT INTO purities (metal_type_id, purity_name, purity_percentage, making_charge_rate) VALUES
(1, '24K', 99.9, 15.0),
(1, '22K', 91.7, 12.0),
(1, '18K', 75.0, 10.0),
(1, '14K', 58.3, 8.0),
(2, 'Pure', 99.9, 25.0),
(2, '925', 92.5, 20.0),
(3, 'Pure', 95.0, 30.0)
ON CONFLICT DO NOTHING;

INSERT INTO categories (name, description, making_charge_percentage) VALUES
('Rings', 'Wedding rings, engagement rings, fashion rings', 12.0),
('Necklaces', 'Gold chains, pendant sets, traditional necklaces', 15.0),
('Earrings', 'Studs, hoops, chandelier earrings', 18.0),
('Bracelets', 'Gold bracelets, bangles', 14.0),
('Pendants', 'Religious pendants, fashion pendants', 16.0),
('Chains', 'Gold chains, silver chains', 10.0)
ON CONFLICT DO NOTHING;

INSERT INTO users (email, password_hash, first_name, last_name, role, phone) VALUES
('owner@jewelryshop.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdkWA', 'Shop', 'Owner', 'owner', '+91-9876543210'),
('manager@jewelryshop.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdkWA', 'Shop', 'Manager', 'manager', '+91-9876543211'),
('staff1@jewelryshop.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdkWA', 'Staff', 'Member', 'staff', '+91-9876543212'),
('customer1@jewelryshop.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdkWA', 'John', 'Doe', 'customer', '+91-9876543213')
ON CONFLICT DO NOTHING;

INSERT INTO jewelry_items (sku, name, category_id, metal_type_id, purity_id, weight, base_price, selling_price, stock_quantity) VALUES
('GR001', 'Classic Gold Ring', 1, 1, 2, 8.5, 57800, 68000, 5),
('GN001', 'Traditional Gold Necklace', 2, 1, 2, 25.0, 170000, 195000, 3),
('GE001', 'Diamond Earrings', 3, 1, 3, 6.2, 45000, 55000, 8),
('GB001', 'Gold Bracelet', 4, 1, 2, 12.0, 81600, 95000, 4),
('SC001', 'Silver Chain', 6, 2, 2, 15.0, 1200, 1500, 10)
ON CONFLICT DO NOTHING;