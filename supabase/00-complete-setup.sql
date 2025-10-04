-- =====================================================
-- Arihant Inventory Management System - Complete Setup
-- =====================================================
-- This script creates all tables, policies, triggers, and indexes
-- Run this once in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ENUMS
-- =====================================================

-- User roles: viewer (read-only), staff (can record movements), admin (full access)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('viewer', 'staff', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Item status
DO $$ BEGIN
  CREATE TYPE item_status AS ENUM ('active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Movement types
DO $$ BEGIN
  CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjust');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Alert types
DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('instant', 'digest');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. TABLES
-- =====================================================

-- Profiles table - stores user roles and metadata
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items table - inventory items
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_qty NUMERIC NOT NULL DEFAULT 0,
  min_threshold NUMERIC NOT NULL DEFAULT 0,
  location TEXT,
  status item_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT positive_qty CHECK (current_qty >= 0),
  CONSTRAINT positive_threshold CHECK (min_threshold >= 0),
  CONSTRAINT non_empty_sku CHECK (LENGTH(TRIM(sku)) > 0),
  CONSTRAINT non_empty_name CHECK (LENGTH(TRIM(name)) > 0)
);

-- Movements table - stock transaction history
CREATE TABLE IF NOT EXISTS movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  type movement_type NOT NULL,
  delta NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  ref_doc TEXT,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT non_zero_delta CHECK (delta != 0),
  CONSTRAINT non_empty_reason CHECK (LENGTH(TRIM(reason)) > 0)
);

-- Alert log table - tracks low-stock alerts
CREATE TABLE IF NOT EXISTS alert_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  alert_type alert_type NOT NULL,
  sent_via TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. INDEXES
-- =====================================================

-- Case-insensitive SKU search
CREATE INDEX IF NOT EXISTS idx_items_sku_lower ON items (LOWER(sku));
CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);
CREATE INDEX IF NOT EXISTS idx_items_low_stock ON items (current_qty) WHERE current_qty <= min_threshold;

-- Movement queries
CREATE INDEX IF NOT EXISTS idx_movements_item_created ON movements (item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_user ON movements (user_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON movements (created_at DESC);

-- Alert queries
CREATE INDEX IF NOT EXISTS idx_alert_log_item ON alert_log (item_id, created_at DESC);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_log ENABLE ROW LEVEL SECURITY;

-- ============ PROFILES POLICIES ============

-- Users can read all profiles
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Users can create their OWN first profile (fixes chicken-and-egg problem!)
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid())
  );

-- Users can update their own display name
CREATE POLICY "Users can update own display name"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = (SELECT role FROM profiles WHERE user_id = auth.uid()));

-- Admins can update any profile (including roles)
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============ ITEMS POLICIES ============

-- Everyone can read items
CREATE POLICY "Anyone can view items"
  ON items FOR SELECT
  USING (true);

-- Only admins can insert items
CREATE POLICY "Admins can insert items"
  ON items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update items
CREATE POLICY "Admins can update items"
  ON items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete items (soft delete via archive preferred)
CREATE POLICY "Admins can delete items"
  ON items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============ MOVEMENTS POLICIES ============

-- Everyone can read movements
CREATE POLICY "Anyone can view movements"
  ON movements FOR SELECT
  USING (true);

-- Staff and admins can insert movements
CREATE POLICY "Staff and admins can insert movements"
  ON movements FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('staff', 'admin')
    )
  );

-- Only admins can delete movements
CREATE POLICY "Admins can delete movements"
  ON movements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============ ALERT LOG POLICIES ============

-- Only admins can view alerts
CREATE POLICY "Admins can view alerts"
  ON alert_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Alert log inserts handled by functions/triggers (service role)
-- No user-facing insert policy needed

-- =====================================================
-- 5. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on profiles
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger: Auto-update updated_at on items
DROP TRIGGER IF EXISTS items_updated_at ON items;
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function: Update item quantity after movement
CREATE OR REPLACE FUNCTION update_item_quantity_after_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the item's current_qty based on movement delta
  UPDATE items
  SET current_qty = current_qty + NEW.delta
  WHERE id = NEW.item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-update quantity when movement inserted
DROP TRIGGER IF EXISTS movement_update_quantity ON movements;
CREATE TRIGGER movement_update_quantity
  AFTER INSERT ON movements
  FOR EACH ROW
  EXECUTE FUNCTION update_item_quantity_after_movement();

-- Function: Check for low stock and create alert
CREATE OR REPLACE FUNCTION check_low_stock_after_movement()
RETURNS TRIGGER AS $$
DECLARE
  current_item items%ROWTYPE;
  last_alert_time TIMESTAMPTZ;
BEGIN
  -- Get the updated item
  SELECT * INTO current_item FROM items WHERE id = NEW.item_id;

  -- Check if stock is at or below threshold
  IF current_item.current_qty <= current_item.min_threshold THEN
    -- Check for recent alerts (debounce to 1 per 24 hours)
    SELECT MAX(created_at) INTO last_alert_time
    FROM alert_log
    WHERE item_id = NEW.item_id
      AND alert_type = 'instant'
      AND created_at > NOW() - INTERVAL '24 hours';

    -- If no recent alert, create one
    IF last_alert_time IS NULL THEN
      INSERT INTO alert_log (item_id, alert_type, sent_via)
      VALUES (NEW.item_id, 'instant', 'system_log');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Check low stock after movement
DROP TRIGGER IF EXISTS movement_check_low_stock ON movements;
CREATE TRIGGER movement_check_low_stock
  AFTER INSERT ON movements
  FOR EACH ROW
  EXECUTE FUNCTION check_low_stock_after_movement();

-- Function: Prevent movements on archived items
CREATE OR REPLACE FUNCTION prevent_archived_item_movements()
RETURNS TRIGGER AS $$
DECLARE
  item_status_val item_status;
BEGIN
  -- Get item status
  SELECT status INTO item_status_val FROM items WHERE id = NEW.item_id;

  -- Raise error if item is archived
  IF item_status_val = 'archived' THEN
    RAISE EXCEPTION 'Cannot record movements for archived items';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Prevent movements on archived items
DROP TRIGGER IF EXISTS movement_prevent_archived ON movements;
CREATE TRIGGER movement_prevent_archived
  BEFORE INSERT ON movements
  FOR EACH ROW
  EXECUTE FUNCTION prevent_archived_item_movements();

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function: Get user role (useful for frontend queries)
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE user_id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE '📋 Tables created: profiles, items, movements, alert_log';
  RAISE NOTICE '🔒 RLS policies enabled with 3-tier roles (viewer/staff/admin)';
  RAISE NOTICE '⚡ Triggers configured for auto-updates and alerts';
  RAISE NOTICE '🎯 Next: Sign in to create your profile, then promote to admin';
END $$;
