-- Migration: Create repair service tables
-- Description: Add tables for repair request management and status tracking
-- Date: 2024-12-25

-- Create repair status enum
CREATE TYPE repair_status_enum AS ENUM (
  'received',
  'assessed', 
  'approved',
  'in_progress',
  'completed',
  'ready_for_pickup',
  'delivered',
  'cancelled'
);

-- Create repair type enum  
CREATE TYPE repair_type_enum AS ENUM (
  'cleaning',
  'fixing',
  'resizing',
  'stone_replacement',
  'polishing',
  'chain_repair',
  'clasp_repair',
  'engraving',
  'other'
);

-- Create repair requests table
CREATE TABLE repair_requests (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  repair_type repair_type_enum NOT NULL,
  estimated_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimated_completion DATE,
  actual_cost DECIMAL(10,2),
  repair_notes TEXT,
  customer_approval_required BOOLEAN DEFAULT false,
  customer_approved BOOLEAN,
  before_photos JSON DEFAULT '[]'::json,
  after_photos JSON DEFAULT '[]'::json,
  repair_status repair_status_enum DEFAULT 'received',
  technician_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create repair status history table
CREATE TABLE repair_status_history (
  id SERIAL PRIMARY KEY,
  repair_id INTEGER NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
  status repair_status_enum NOT NULL,
  notes TEXT,
  photos JSON DEFAULT '[]'::json,
  changed_by INTEGER NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_repair_requests_order_id ON repair_requests(order_id);
CREATE INDEX idx_repair_requests_status ON repair_requests(repair_status);
CREATE INDEX idx_repair_requests_technician ON repair_requests(technician_id);
CREATE INDEX idx_repair_requests_created_at ON repair_requests(created_at);
CREATE INDEX idx_repair_status_history_repair_id ON repair_status_history(repair_id);
CREATE INDEX idx_repair_status_history_changed_at ON repair_status_history(changed_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_repair_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_repair_requests_updated_at
  BEFORE UPDATE ON repair_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_repair_updated_at();

-- Create trigger to automatically create status history entry
CREATE OR REPLACE FUNCTION create_repair_status_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history if status actually changed
  IF NEW.repair_status IS DISTINCT FROM OLD.repair_status THEN
    INSERT INTO repair_status_history (repair_id, status, changed_by)
    VALUES (NEW.id, NEW.repair_status, NEW.technician_id);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_repair_status_history_trigger
  AFTER UPDATE ON repair_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_repair_status_history();