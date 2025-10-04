# Quick Start Guide

## Your Supabase is Already Configured! ✅

The `.env` file is set up with your Supabase credentials.

## Step-by-Step Setup (5 minutes)

### 1. Set Up Database (One-time setup)

Go to your Supabase Dashboard:
- URL: https://app.supabase.com/project/oguxzmpalqwbhudswfpw

Then:

1. Click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy and paste the entire contents of `supabase/00-complete-setup.sql`
4. Click **Run** or press `Cmd/Ctrl + Enter`

✅ **You should see**: "Success. No rows returned"

This creates:
- ✅ 4 tables (profiles, items, movements, alert_log)
- ✅ All indexes for performance
- ✅ Triggers for automatic updates
- ✅ Row Level Security policies

### 2. Start the Application

```bash
npm run dev
```

Open http://localhost:5173

### 3. Create Your First User

1. Enter your email on the login page
2. Check your email for the magic link
3. Click the link to sign in

🎉 **A profile is automatically created for you as 'staff'!**

### 4. Make Yourself Admin

After signing in, go back to **Supabase SQL Editor** and run:

```sql
-- Replace with your actual email
UPDATE profiles
SET role = 'admin', display_name = 'Admin User'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

✅ **Refresh the page** - you should now see the "Admin" menu item!

**Note:** All new users automatically get a profile created when they sign in for the first time. They start as 'staff' and admins can promote them later.

## You're Done! 🎉

You can now:
- ✅ Create inventory items
- ✅ Track stock movements (IN/OUT/ADJUST)
- ✅ View dashboard with KPIs
- ✅ See low-stock alerts
- ✅ View detailed item history
- ✅ (Admin) Manage users and archive items

## Quick Test

Try creating your first item:
1. Click **Items** in the sidebar
2. Click **Add Item** button
3. Fill in:
   - SKU: `TEST-001`
   - Name: `Test Product`
   - Category: `Electronics`
   - Unit: `pcs`
   - Initial Quantity: `100`
   - Minimum Threshold: `10`
4. Click **Create**

Now try recording a movement:
1. Find your item in the list
2. Click the **↓** (Stock In) or **↑** (Stock Out) button
3. Enter quantity and reason
4. Click **Record Movement**

The dashboard will update automatically!

## Need Help?

Check `README.md` for:
- Full documentation
- Troubleshooting tips
- Feature explanations
- Database schema reference

## Project Structure

```
arihantapp/
├── supabase/
│   └── 00-complete-setup.sql  ← Run this in Supabase SQL Editor
├── src/
│   ├── pages/          ← Dashboard, Items, Login, etc.
│   ├── components/     ← Reusable UI components
│   └── lib/           ← Supabase client & types
├── .env               ← Your Supabase config (already set!)
└── README.md          ← Full documentation
```
