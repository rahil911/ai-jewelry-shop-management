-- Migration: Create return and exchange tables
-- Description: Add tables for return/exchange request management and status tracking
-- Date: 2024-12-25

-- Create return status enum
CREATE TYPE return_status_enum AS ENUM (
  'requested',
  'approved',
  'rejected', 
  'processed',
  'completed',
  'cancelled'
);

-- Create return type enum
CREATE TYPE return_type_enum AS ENUM (
  'full_return',
  'partial_return',
  'exchange'
);

-- Create return requests table
CREATE TABLE return_requests (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  return_type return_type_enum NOT NULL,
  reason VARCHAR(100) NOT NULL,
  reason_details TEXT,
  requested_by INTEGER NOT NULL REFERENCES users(id),
  items_to_return JSON NOT NULL DEFAULT '[]'::json,
  return_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  exchange_items JSON DEFAULT '[]'::json,
  exchange_amount_difference DECIMAL(10,2) DEFAULT 0,
  status return_status_enum DEFAULT 'requested',
  processed_by INTEGER REFERENCES users(id),
  refund_method VARCHAR(50),
  refund_reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- Create return status history table
CREATE TABLE return_status_history (
  id SERIAL PRIMARY KEY,
  return_id INTEGER NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
  status return_status_enum NOT NULL,
  notes TEXT,
  changed_by INTEGER NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_return_requests_order_id ON return_requests(order_id);
CREATE INDEX idx_return_requests_status ON return_requests(status);
CREATE INDEX idx_return_requests_requested_by ON return_requests(requested_by);
CREATE INDEX idx_return_requests_processed_by ON return_requests(processed_by);
CREATE INDEX idx_return_requests_created_at ON return_requests(created_at);
CREATE INDEX idx_return_status_history_return_id ON return_status_history(return_id);
CREATE INDEX idx_return_status_history_changed_at ON return_status_history(changed_at);

-- Create trigger to automatically create status history entry
CREATE OR REPLACE FUNCTION create_return_status_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history if status actually changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO return_status_history (return_id, status, changed_by)
    VALUES (NEW.id, NEW.status, COALESCE(NEW.processed_by, NEW.requested_by));
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_return_status_history_trigger
  AFTER UPDATE ON return_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_return_status_history();

-- Create initial status history entry on insert
CREATE OR REPLACE FUNCTION create_initial_return_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO return_status_history (return_id, status, changed_by)
  VALUES (NEW.id, NEW.status, NEW.requested_by);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_initial_return_status_trigger
  AFTER INSERT ON return_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_return_status();