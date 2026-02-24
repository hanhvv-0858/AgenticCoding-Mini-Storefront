-- Seed data: Categories, Products, Admin account, Test customers
-- Run via: supabase db reset

-- ============================================================
-- Categories
-- ============================================================
INSERT INTO categories (id, name, slug) VALUES
  ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Thời trang', 'thoi-trang'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Điện tử', 'dien-tu'),
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Gia dụng', 'gia-dung');

-- ============================================================
-- Products (mix of published/unpublished, varying stock)
-- ============================================================
INSERT INTO products (name, description, price, stock, is_published, category_id, image_path) VALUES
  ('Áo thun trắng basic', 'Áo thun cotton 100% form regular fit, thoáng mát phù hợp mọi hoạt động.', 250000, 50, true,
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', NULL),
  ('Quần jeans slim fit', 'Quần jeans nam co giãn nhẹ, phom slim fit hiện đại.', 450000, 30, true,
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', NULL),
  ('Áo khoác hoodie', 'Áo khoác hoodie unisex chất nỉ bông dày dặn, giữ ấm tốt.', 380000, 20, true,
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', NULL),
  ('Váy hoa nhí', 'Váy nữ hoa nhí vintage, chất vải nhẹ thoáng mát mùa hè.', 320000, 0, true,
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', NULL),
  ('Tai nghe Bluetooth', 'Tai nghe không dây chống ồn chủ động, pin 30 giờ, kết nối BT 5.3.', 1200000, 15, true,
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NULL),
  ('Sạc nhanh 65W', 'Củ sạc GaN 65W 3 cổng (2 USB-C + 1 USB-A), tương thích laptop.', 550000, 40, true,
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NULL),
  ('Chuột không dây', 'Chuột gaming không dây 16000 DPI, pin sạc nhanh, kết nối 2.4GHz.', 890000, 3, true,
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NULL),
  ('Bàn phím cơ (Draft)', 'Bàn phím cơ switch Blue, RGB, hot-swap. Đang chuẩn bị ra mắt.', 1500000, 10, false,
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NULL),
  ('Nồi cơm điện', 'Nồi cơm điện tử 1.8L, chức năng nấu đa dạng, lòng nồi chống dính.', 980000, 25, true,
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NULL),
  ('Bình giữ nhiệt 500ml', 'Bình giữ nhiệt inox 304, giữ nóng 12h / lạnh 24h.', 280000, 60, true,
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NULL);

-- ============================================================
-- Admin account: admin@store.local / admin123
-- Created via Supabase Auth API, then profile role updated
-- Note: In local dev, use supabase auth admin to create users
-- ============================================================

-- The admin user will be created programmatically.
-- After running migrations and seed, execute:
--   1. Create user via Supabase Auth (signup with admin@store.local / admin123)
--   2. Update their profile role to 'admin'
-- For local dev, this is handled by the setup script.

-- Create test users via Supabase Auth admin API (local dev only)
-- These will trigger the handle_new_user() trigger automatically
