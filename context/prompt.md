# Builder Prompt: Inventory Management & Tracking Web App

## Important instructions
- 'context/claude.md' has to be followed before implementing any changes/code/new code etc.

## Project Overview
- Build a focused inventory management and tracking application that prioritizes clarity, essential workflows, and minimal UI clutter.
- Frontend implemented with React + Vite; backend services provided by Supabase (Auth, database, storage, scheduled functions).
- Deliver role-based access, automated alerts, and analytics that surface actionable stock insights.

## Tech Stack & Architecture
- **Frontend:** React + Vite, Tailwind CSS for styling, Headless UI and Lucide icons for accessible components.
- **Backend:** Supabase for PostgreSQL database, authentication (magic link/OTP), storage, scheduled jobs, and Row-Level Security (RLS).
- **Data Handling:** MDX for content where needed, CSV import/export pipelines, serverless functions for scheduled alert digests.

## Roles & Permissions
### Admin
- Full CRUD on inventory items; can add, edit, archive, and restore.
- Define per-item low-stock thresholds and override negative stock constraints when necessary.
- Manage unlimited staff users (create/update/delete) via Profiles, including role changes.
- Import/export items and movement data via CSV.
- View comprehensive analytics dashboards and audit logs (movements, alerts).

### Staff
- Browse, search, and filter inventory records.
- Record stock movements (in, out, adjust) with required reasons and optional references.
- View dashboards, item details, and movement history.
- Cannot archive items, modify thresholds, manage users, or perform imports/exports.

### RLS Expectations
- `profiles`: authenticated users read/update own row; admins can modify roles.
- `items`: all authenticated users can read. Staff insert movements only; admins insert/update/archive items.
- `movements`: all authenticated users read. Staff insert records; only admins delete.
- `alert_log`: insert performed by functions; read access restricted to admins.

## Database Schema
### profiles
- `user_id` (Supabase Auth ID, PK), `role` (enum: admin | staff), `display_name`, timestamps.

### items
- `id` (PK), `sku` (unique, case-insensitive), `name`, `category`, `unit`, `current_qty` (numeric), `min_threshold` (numeric), `location` (optional string for future relation), `status` (enum: active | archived), timestamps.
- Indexes: `sku`, `category`.

### movements
- `id` (PK), `item_id` (FK -> items), `type` (enum: in | out | adjust), `delta` (non-zero signed numeric), `reason` (text), `ref_doc` (optional), `user_id` (FK -> profiles), `created_at` (timestamp).
- Composite index on `(item_id, created_at)`.

### alert_log
- `id` (PK), `item_id` (FK -> items), `alert_type` (instant | digest), `sent_via` (email | sms | future channels), `created_at` (timestamp).

## Core Flows
### 1. Item Lifecycle
- Admin creates items with SKU, metadata, starting quantity, threshold, and optional location.
- Initial quantity is recorded as an `adjust` movement tagged "opening balance".
- Items can be archived (soft delete); archived items remain searchable/exportable but block new movements.

### 2. Stock Movements
- **In (Receive):** quantity increases `current_qty`; requires reason and optional reference.
- **Out (Issue):** quantity decreases `current_qty`; prevents negative stock unless admin override.
- **Adjust:** signed delta for corrections (damaged, audit, shrinkage) available to staff/admin.
- All movements must capture item, delta, reason, user, timestamp; delta must be non-zero.

### 3. Alerts
- Instant alert fires when a movement drops `current_qty` to or below `min_threshold`; debounce to 1 per item per 24 hours.
- Daily digest at 09:00 IST summarises all low-stock items.
- Alerts recorded in `alert_log` with delivery channel metadata.

## User Management
- Admins invite staff via Supabase Auth (magic link/OTP); records stored in `profiles` table.
- Admin UI supports adding/removing users and adjusting roles.
- Enforce strong auditing: track who performed movements and when; no anonymous actions.

## Import & Export
- **Import CSV (Admin only):** bulk create items with SKU, metadata, starting qty, threshold; automatically generates opening balance movements.
- **Export CSV:** provide item snapshots or movement logs filtered by date range.
- Validate schema, enforce SKU uniqueness, and surface row-level import errors.

## UI Screens & Requirements
1. **Login:** Supabase Auth entry (magic link/OTP) with clear status messaging.
2. **Dashboard:** KPI tiles (Total SKUs, Active SKUs, Low-stock count, Recent movements). Tables for Low Stock and Recent Movements.
3. **Items List:** Paginated (50/page) table with search, category/status filters, role-based row actions (Staff: In/Out/Adjust/View Log; Admin: Edit/Archive/Restore/Add Item).
4. **Item Detail:** Header with SKU, name, quantity, threshold, status. Tabs for Movements timeline, Item info, Alerts history.
5. **Analytics:** Charts (stock distribution by category, top low-stock items, 30-day movement trends) with filters for category/SKU/status.
6. **Admin Panel:** Manage users, archived items, import/export workflows, digest configuration, and audit log access.

## Policies & Validations
- Enforce SKU uniqueness and case-insensitive searches.
- Prevent negative stock for staff; allow admin override with explicit confirmation.
- Movement entries require reasons and non-zero deltas.
- Archived items block new movements but remain visible for reporting.
- Store timestamps in UTC; display UI in IST.

## Development Phases
1. **Setup (Day 1-2):** Supabase schema, Auth wiring, RLS policies, UI skeleton.
2. **Core Inventory (Day 3-4):** Items & Movements CRUD, validations, audit trail.
3. **Alerts (Day 5):** Implemxent instant alerts and scheduled digest pipeline.
4. **Analytics (Day 6):** Build charts, trends, filters, and exports.
5. **Polish & Deploy (Day 7-8):** Finalize import/export, admin management, testing, docs, deployment.

## Performance & Operations
- Use pagination for large tables; lazy-load data where appropriate.
- Ensure indexes exist on `items.sku`, `items.category`, and `movements(item_id, created_at)`.
- Plan for daily Supabase backups (available on paid tiers) and monitoring on alert delivery.
- Log alert sends and failures; surface retry mechanisms.
