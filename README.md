# Arihant Inventory Management System

A comprehensive inventory management and tracking web application built with React, Vite, TypeScript, and Supabase.

## Features

- **Role-Based Access Control**: Admin and Staff roles with distinct permissions
- **Inventory Management**: Full CRUD operations for items with SKU tracking
- **Stock Movements**: Track IN, OUT, and ADJUST movements with audit trail
- **Real-time Alerts**: Instant low-stock notifications and daily digest summaries
- **Analytics Dashboard**: KPIs, trends, and inventory insights
- **CSV Import/Export**: Bulk operations for items and movements
- **Responsive UI**: Built with Tailwind CSS and Headless UI components

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Charts**: Recharts
- **Routing**: React Router v6

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works fine)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd arihantapp
npm install
```

### 2. Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Note your project URL and anon key from Settings > API

### 3. Configure Environment Variables

**Important:** The app will run without Supabase configured, but will show a setup message.

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Note:** You can start the dev server without configuring Supabase - it will display helpful setup instructions on the login page.

### 4. Set Up Database Schema

In your Supabase dashboard:

1. Go to **SQL Editor**
2. Create a new query
3. Copy the contents of `supabase/00-complete-setup.sql` and execute it
4. **(Optional)** To add the 3-tier role system (viewer/staff/admin), also run `supabase/01-add-viewer-role.sql`

This will create:
- Database tables: `profiles`, `items`, `movements`, `alert_log`
- Indexes for performance
- Row Level Security (RLS) policies
- Database triggers for automatic quantity updates and alerts
- **Automatic profile creation** - new users get role='viewer' by default

### 5. Promote Your First Admin User

After setting up the database:

1. Run the development server (see below)
2. Sign in with your email (profile auto-created as 'viewer')
3. In Supabase dashboard, go to **SQL Editor** and run:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles
SET role = 'admin', display_name = 'Admin User'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

4. Refresh the app and you'll have full admin access

**Note**: All new users automatically get a profile with role='viewer'. Admins can promote users to 'staff' or 'admin' via the database or (future) Admin panel UI.

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
arihantapp/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── ItemFormModal.tsx
│   │   └── MovementModal.tsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/              # Utilities and configurations
│   │   ├── supabase.ts
│   │   └── database.types.ts
│   ├── pages/            # Page components
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Items.tsx
│   │   ├── ItemDetail.tsx
│   │   ├── Analytics.tsx
│   │   └── Admin.tsx
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── supabase/
│   ├── schema.sql        # Database schema
│   └── policies.sql      # RLS policies
├── context/              # Project documentation
│   ├── CLAUDE.md
│   └── prompt.md
└── package.json
```

## User Roles & Permissions

The system implements a 3-tier role hierarchy with automatic profile creation:

### Viewer (Default)
- **Read-only access** to all data
- View dashboard, items, movements, and analytics
- Search and filter inventory
- **Cannot**: Create/edit items, record movements, access admin panel
- **Automatically assigned** to new users on first login

### Staff
- All viewer permissions, plus:
- Record stock movements (in, out, adjust)
- Cannot record negative stock without admin override
- **Cannot**: Create/edit items, archive items, modify thresholds, manage users

### Admin
- Full system access
- Create, edit, archive, and restore items
- Define per-item low-stock thresholds
- Override negative stock constraints
- Manage users and assign roles
- Import/export items and movements via CSV (planned)
- View comprehensive analytics and audit logs

## Database Schema

### Tables

**profiles**
- `user_id` (UUID, PK) - References auth.users
- `role` (enum: viewer | staff | admin)
- `display_name` (text)
- `created_at`, `updated_at` (timestamps)
- **Auto-created** on first login with role='viewer'

**items**
- `id` (UUID, PK)
- `sku` (text, unique, case-insensitive)
- `name` (text)
- `category` (text)
- `unit` (text)
- `current_qty` (numeric)
- `min_threshold` (numeric)
- `location` (text, nullable)
- `status` (enum: active | archived)
- `created_at`, `updated_at` (timestamps)

**movements**
- `id` (UUID, PK)
- `item_id` (UUID, FK -> items)
- `type` (enum: in | out | adjust)
- `delta` (numeric, non-zero)
- `reason` (text)
- `ref_doc` (text, nullable)
- `user_id` (UUID, FK -> profiles)
- `created_at` (timestamp)

**alert_log**
- `id` (UUID, PK)
- `item_id` (UUID, FK -> items)
- `alert_type` (enum: instant | digest)
- `sent_via` (text)
- `created_at` (timestamp)

## Key Features Implementation

### Stock Movements
- **IN**: Increases inventory quantity
- **OUT**: Decreases inventory (prevents negative stock for staff)
- **ADJUST**: Signed delta for corrections (damage, audit, etc.)
- All movements require reason and capture user/timestamp
- Movements blocked on archived items

### Alerts System
- **Instant alerts**: Fire when stock drops to/below threshold (debounced to 1 per 24hrs)
- **Daily digest**: Scheduled summary at 09:00 IST (requires Supabase Edge Function)
- All alerts logged in `alert_log` table

### Item Lifecycle
- Items created with initial quantity recorded as "opening balance" movement
- Soft delete via archive status
- Archived items remain searchable but block new movements

## Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Next Steps (Not Yet Implemented)

The following features are planned but not yet implemented:

1. **Analytics Dashboard**: Charts using Recharts (stock distribution, trends, top low-stock items)
2. **Admin Panel**: User management UI, CSV import/export interface
3. **Alert Delivery**: Supabase Edge Functions for email/SMS alerts
4. **Daily Digest**: Scheduled function for daily low-stock summary
5. **Advanced Filtering**: Date range filters, multi-select categories
6. **Audit Logs**: Detailed activity tracking for admins
7. **Mobile Responsiveness**: Enhanced mobile UI

## Troubleshooting

### Can't sign in
- Check that your Supabase URL and anon key are correct in `.env`
- Verify email is enabled in Supabase Auth settings
- Check spam folder for magic link email

### Database errors
- Ensure you've run both `schema.sql` and `policies.sql`
- Check Supabase logs in the dashboard
- Verify RLS policies are enabled

### Permission errors
- Make sure your user has a profile in the `profiles` table
- Check the `role` field in your profile (should be 'admin' or 'staff')

## License

MIT

## Support

For issues and questions, please check the documentation in the `context/` folder.
