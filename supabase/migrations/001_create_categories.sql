-- Migration: Create categories table
-- Categories for product classification

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Validation: name and slug length
ALTER TABLE categories
  ADD CONSTRAINT categories_name_length CHECK (char_length(name) BETWEEN 1 AND 100),
  ADD CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]*$' AND char_length(slug) BETWEEN 1 AND 100);
