-- Migration: Create order_items table
-- Order line items with price/name snapshots at time of purchase

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  product_name text NOT NULL,
  unit_price bigint NOT NULL,
  quantity integer NOT NULL
);

-- Validation constraints
ALTER TABLE order_items
  ADD CONSTRAINT order_items_unit_price_non_negative CHECK (unit_price >= 0),
  ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0);

-- Index for order item lookups
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
