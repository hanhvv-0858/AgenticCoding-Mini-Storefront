-- Migration: Row Level Security policies for all tables
-- Three access patterns: public read, admin write, customer own data

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- CATEGORIES: public read, admin write
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage categories"
  ON categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- PRODUCTS: public read published, admin full access
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published products"
  ON products FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admin can view all products"
  ON products FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can insert products"
  ON products FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update products"
  ON products FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete products"
  ON products FOR DELETE
  USING (is_admin());

-- ============================================================
-- PROFILES: users read own, admin reads all
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'customer');

-- ============================================================
-- ORDERS: customer reads own, admin reads all + updates
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Admin can view all orders"
  ON orders FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can update orders"
  ON orders FOR UPDATE
  USING (is_admin());

CREATE POLICY "Authenticated users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL);

-- ============================================================
-- ORDER ITEMS: follows parent order access
-- ============================================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all order items"
  ON order_items FOR SELECT
  USING (is_admin());
