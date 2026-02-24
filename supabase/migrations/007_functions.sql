-- Migration: Database functions for atomic operations
-- fn_create_order: atomic checkout with stock validation
-- fn_cancel_order: cancel order and restore stock
-- fn_get_revenue_stats: admin dashboard statistics

-- ============================================================
-- fn_create_order: Atomic checkout with SELECT FOR UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION fn_create_order(
  p_customer_id uuid DEFAULT NULL,
  p_customer_name text DEFAULT '',
  p_customer_phone text DEFAULT '',
  p_customer_address text DEFAULT '',
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product record;
  v_total bigint := 0;
  v_seq integer;
BEGIN
  -- Validate input
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Lock and validate all products first
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, price, stock, is_published
    INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::uuid
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
    END IF;

    IF NOT v_product.is_published THEN
      RAISE EXCEPTION 'Product not available: %', v_product.name;
    END IF;

    IF v_product.stock < (v_item->>'quantity')::int THEN
      RAISE EXCEPTION 'Insufficient stock for %: requested %, available %',
        v_product.name, (v_item->>'quantity')::int, v_product.stock;
    END IF;

    v_total := v_total + (v_product.price * (v_item->>'quantity')::int);
  END LOOP;

  -- Generate order number: ORD-YYYYMMDD-NNN
  SELECT COALESCE(MAX(
    CASE WHEN order_number LIKE 'ORD-' || to_char(now(), 'YYYYMMDD') || '-%'
      THEN CAST(SUBSTRING(order_number FROM '\d+$') AS integer)
      ELSE 0
    END
  ), 0) + 1
  INTO v_seq
  FROM orders;

  v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(v_seq::text, 3, '0');

  -- Create order
  INSERT INTO orders (
    id, order_number, customer_id, customer_name, customer_phone,
    customer_address, total_amount, status, payment_method
  ) VALUES (
    gen_random_uuid(), v_order_number, p_customer_id, p_customer_name,
    p_customer_phone, p_customer_address, v_total, 'pending', 'cod'
  )
  RETURNING id INTO v_order_id;

  -- Create order items and decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, price INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::uuid;

    INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
    VALUES (v_order_id, v_product.id, v_product.name, v_product.price, (v_item->>'quantity')::int);

    UPDATE products
    SET stock = stock - (v_item->>'quantity')::int, updated_at = now()
    WHERE id = v_product.id;
  END LOOP;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_amount', v_total
  );
END;
$$;

-- ============================================================
-- fn_cancel_order: Cancel order and restore stock
-- ============================================================
CREATE OR REPLACE FUNCTION fn_cancel_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify order is cancellable
  IF NOT EXISTS (
    SELECT 1 FROM orders WHERE id = p_order_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Order cannot be cancelled (not in pending status)';
  END IF;

  -- Restore stock for each item
  UPDATE products p
  SET stock = p.stock + oi.quantity, updated_at = now()
  FROM order_items oi
  WHERE oi.order_id = p_order_id AND oi.product_id = p.id;

  -- Update order status
  UPDATE orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_order_id;
END;
$$;

-- ============================================================
-- fn_get_revenue_stats: Revenue summary for admin dashboard
-- ============================================================
CREATE OR REPLACE FUNCTION fn_get_revenue_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_revenue', COALESCE((SELECT SUM(total_amount) FROM orders WHERE status = 'completed'), 0),
    'completed_orders_count', (SELECT COUNT(*) FROM orders WHERE status = 'completed'),
    'pending_orders_count', (SELECT COUNT(*) FROM orders WHERE status = 'pending'),
    'delivering_orders_count', (SELECT COUNT(*) FROM orders WHERE status = 'delivering'),
    'cancelled_orders_count', (SELECT COUNT(*) FROM orders WHERE status = 'cancelled'),
    'total_products', (SELECT COUNT(*) FROM products),
    'published_products', (SELECT COUNT(*) FROM products WHERE is_published = true),
    'low_stock_products', (SELECT COUNT(*) FROM products WHERE stock <= 5 AND is_published = true)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
