# 3-Tier Role System Implementation Guide

## Overview

The Arihant Inventory system now implements automatic profile creation with a 3-tier role hierarchy:

1. **Viewer** (default) - Read-only access
2. **Staff** - Can record movements
3. **Admin** - Full system access

## Setup Instructions

### Step 1: Run Database Migration

In your Supabase SQL Editor, execute the complete migration:

```sql
-- Add viewer role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'viewer';

-- CRITICAL: Allow users to create their own profile on first login
-- This fixes the chicken-and-egg problem!
CREATE POLICY IF NOT EXISTS "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Update movement policy to exclude viewers
DROP POLICY IF EXISTS "Staff can insert movements" ON movements;
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
```

**Why the "Users can create own profile" policy is critical:**
- Without it, only admins can create profiles
- New users have no profile, so they can't create one
- This is a chicken-and-egg problem!
- The policy allows first-time users to create their own profile (but only once)

### Step 2: Promote Yourself to Admin

Since you already logged in and your profile wasn't created, run this:

```sql
-- Check if you have a profile
SELECT * FROM profiles WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

-- If NO profile exists, create one as admin
INSERT INTO profiles (user_id, role, display_name)
SELECT id, 'admin', 'Admin User'
FROM auth.users
WHERE email = 'your-email@example.com';

-- If profile EXISTS, update to admin
UPDATE profiles
SET role = 'admin', display_name = 'Admin User'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

### Step 3: Test Auto-Profile Creation

1. Sign out of your current account
2. Sign in with a different email
3. Check Supabase `profiles` table - you should see a new profile with `role='viewer'`
4. That user will have read-only access

### Step 4: Promote Users

To change a user's role:

```sql
-- Make someone staff
UPDATE profiles
SET role = 'staff'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'staff-user@example.com'
);

-- Make someone admin
UPDATE profiles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'new-admin@example.com'
);
```

## Role Permissions Matrix

| Feature | Viewer | Staff | Admin |
|---------|--------|-------|-------|
| View Dashboard | ✅ | ✅ | ✅ |
| View Items | ✅ | ✅ | ✅ |
| View Movements | ✅ | ✅ | ✅ |
| View Analytics | ✅ | ✅ | ✅ |
| Record Movements (IN/OUT/ADJUST) | ❌ | ✅ | ✅ |
| Create/Edit Items | ❌ | ❌ | ✅ |
| Archive/Restore Items | ❌ | ❌ | ✅ |
| Access Admin Panel | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Override Negative Stock | ❌ | ❌ | ✅ |

## How Auto-Profile Creation Works

When a user signs in for the first time:

1. `AuthContext` fetches profile from database
2. If profile doesn't exist (error code `PGRST116`)
3. `createProfile()` function automatically creates profile with:
   - `user_id`: From auth.users
   - `role`: 'viewer' (default)
   - `display_name`: From user email or metadata
4. User can immediately access the app with viewer permissions
5. Admins can promote users via SQL or (future) Admin UI

## Troubleshooting

### Profile not auto-created?

Check browser console for errors. Ensure:
- You ran the migration SQL
- RLS policies allow profile insertion
- Supabase connection is working

### Can't record movements as staff?

Ensure:
- User's role in `profiles` table is 'staff' or 'admin'
- The movement policy was updated correctly
- Page was refreshed after role change

### Admin menu not showing?

Ensure:
- User's role is 'admin' in profiles table
- Browser was refreshed after promotion
- No console errors in AuthContext

## Files Modified

- `src/lib/database.types.ts` - Added 'viewer' to role types
- `src/contexts/AuthContext.tsx` - Added auto-profile creation + role checks
- `src/pages/Items.tsx` - Hide movement buttons for viewers
- `src/pages/ItemDetail.tsx` - Added auth import
- `README.md` - Updated documentation
- `supabase/01-add-viewer-role.sql` - Migration script (NEW)

## Next Steps

Future enhancements:
- Admin UI for user management (assign roles without SQL)
- Bulk user import
- Role-based email notifications
- Audit log for role changes
