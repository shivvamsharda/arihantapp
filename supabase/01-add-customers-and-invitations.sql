-- =====================================================
-- Admin Panel Enhancement Migration
-- =====================================================
-- Adds customers table, user invitations, and enhances movements
-- Run this after 00-complete-setup.sql

-- =====================================================
-- 1. NEW ENUMS
-- =====================================================

-- Customer status
DO $$ BEGIN
  CREATE TYPE customer_status AS ENUM ('active', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Invitation status
DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. NEW TABLES
-- =====================================================

-- Customers/Clients table - track who receives inventory
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  status customer_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT non_empty_customer_name CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- User invitations table - track staff invites
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',

  CONSTRAINT valid_invitation_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT non_empty_invitation_email CHECK (LENGTH(TRIM(email)) > 0)
);

-- =====================================================
-- 3. ENHANCE EXISTING TABLES
-- =====================================================

-- Add customer tracking to movements (for OUT deliveries)
ALTER TABLE movements
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Add delivery note to movements
ALTER TABLE movements
ADD COLUMN IF NOT EXISTS delivery_note TEXT;

-- =====================================================
-- 4. INDEXES
-- =====================================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (status);

-- Invitation indexes
CREATE INDEX IF NOT EXISTS idx_invitations_email ON user_invitations (email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON user_invitations (status);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON user_invitations (invited_by);

-- Movement-customer relationship
CREATE INDEX IF NOT EXISTS idx_movements_customer ON movements (customer_id) WHERE customer_id IS NOT NULL;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- ============ CUSTOMERS POLICIES ============

-- Everyone can view active customers
CREATE POLICY "Anyone can view active customers"
  ON customers FOR SELECT
  USING (status = 'active');

-- Admins can view all customers (including inactive)
CREATE POLICY "Admins can view all customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Only admins can insert customers
CREATE POLICY "Admins can insert customers"
  ON customers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Only admins can update customers
CREATE POLICY "Admins can update customers"
  ON customers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Only admins can delete customers (prefer status = inactive)
CREATE POLICY "Admins can delete customers"
  ON customers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ============ USER INVITATIONS POLICIES ============

-- Only admins can view invitations
CREATE POLICY "Admins can view invitations"
  ON user_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Only admins can create invitations
CREATE POLICY "Admins can insert invitations"
  ON user_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Only admins can update invitations (to revoke/expire)
CREATE POLICY "Admins can update invitations"
  ON user_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- =====================================================
-- 6. FUNCTIONS & TRIGGERS
-- =====================================================

-- Trigger: Auto-update updated_at on customers
DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function: Check for pending invitation and auto-assign role
CREATE OR REPLACE FUNCTION handle_new_user_invitation()
RETURNS TRIGGER AS $$
DECLARE
  pending_invitation user_invitations%ROWTYPE;
BEGIN
  -- Check if there's a pending invitation for this user's email
  SELECT * INTO pending_invitation
  FROM user_invitations
  WHERE email = (SELECT email FROM auth.users WHERE id = NEW.user_id)
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If invitation found, assign the role from invitation
  IF FOUND THEN
    NEW.role := pending_invitation.role;
    NEW.display_name := COALESCE(NEW.display_name, split_part(pending_invitation.email, '@', 1));

    -- Mark invitation as accepted
    UPDATE user_invitations
    SET status = 'accepted'
    WHERE id = pending_invitation.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-assign role from invitation when profile created
DROP TRIGGER IF EXISTS profile_check_invitation ON profiles;
CREATE TRIGGER profile_check_invitation
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_invitation();

-- Function: Expire old invitations (run periodically via edge function)
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE user_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get customer delivery history
CREATE OR REPLACE FUNCTION get_customer_deliveries(customer_uuid UUID)
RETURNS TABLE (
  movement_id UUID,
  item_name TEXT,
  item_sku TEXT,
  quantity NUMERIC,
  delivery_note TEXT,
  delivered_at TIMESTAMPTZ,
  delivered_by TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS movement_id,
    i.name AS item_name,
    i.sku AS item_sku,
    m.delta AS quantity,
    m.delivery_note,
    m.created_at AS delivered_at,
    p.display_name AS delivered_by
  FROM movements m
  JOIN items i ON m.item_id = i.id
  JOIN profiles p ON m.user_id = p.user_id
  WHERE m.customer_id = customer_uuid
    AND m.type = 'out'
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. HELPER VIEWS
-- =====================================================

-- View: User management overview
CREATE OR REPLACE VIEW user_management_view AS
SELECT
  p.user_id,
  p.display_name,
  p.role,
  au.email,
  au.created_at AS user_created_at,
  au.last_sign_in_at,
  p.created_at AS profile_created_at,
  (SELECT COUNT(*) FROM movements WHERE user_id = p.user_id) AS total_movements
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
ORDER BY p.created_at DESC;

-- View: Customer overview with delivery stats
CREATE OR REPLACE VIEW customer_overview AS
SELECT
  c.id,
  c.name,
  c.email,
  c.phone,
  c.address,
  c.status,
  c.created_at,
  COUNT(m.id) AS total_deliveries,
  MAX(m.created_at) AS last_delivery_date
FROM customers c
LEFT JOIN movements m ON c.id = m.customer_id AND m.type = 'out'
GROUP BY c.id, c.name, c.email, c.phone, c.address, c.status, c.created_at
ORDER BY c.name;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Admin panel migration complete!';
  RAISE NOTICE '📋 New tables: customers, user_invitations';
  RAISE NOTICE '🔗 Enhanced movements with customer_id and delivery_note';
  RAISE NOTICE '🔒 RLS policies configured';
  RAISE NOTICE '⚡ Triggers and helper functions created';
  RAISE NOTICE '📊 Management views available';
END $$;
