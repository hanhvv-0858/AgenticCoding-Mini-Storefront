-- Migration: Create orders table
-- Orders with status lifecycle and shipping info

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES profiles(id),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  total_amount bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'cod',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation constraints
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'delivering', 'completed', 'cancelled')),
  ADD CONSTRAINT orders_total_non_negative CHECK (total_amount >= 0),
  ADD CONSTRAINT orders_customer_name_length CHECK (char_length(customer_name) BETWEEN 1 AND 200),
  ADD CONSTRAINT orders_customer_phone_format CHECK (customer_phone ~ '^0\d{9}$'),
  ADD CONSTRAINT orders_customer_address_length CHECK (char_length(customer_address) BETWEEN 1 AND 500);

-- Indexes for common queries
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
