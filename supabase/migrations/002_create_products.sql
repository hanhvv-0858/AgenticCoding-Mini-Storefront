-- Migration: Create products table
-- Products with stock management and publish control

-- Enable pg_trgm extension for name text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price bigint NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  category_id uuid NOT NULL REFERENCES categories(id),
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation constraints
ALTER TABLE products
  ADD CONSTRAINT products_name_length CHECK (char_length(name) BETWEEN 1 AND 200),
  ADD CONSTRAINT products_price_non_negative CHECK (price >= 0),
  ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);

-- Indexes for common queries
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_published ON products(is_published) WHERE is_published = true;
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
