
## Admin Panel Implementation Plan

### 1. Database Changes
- Add `"admin"` to the `app_role` enum so we can assign admin privileges
- Add RLS policies allowing admins to read all tables (users, bookings, withdrawals, etc.)
- Add an update policy on `user_roles` for admins to manage user roles

### 2. Admin Layout & Routing
- Create `AdminLayout.tsx` with a sidebar (Users, Bookings, SOS Alerts, Revenue)
- Add admin routes: `/admin`, `/admin/users`, `/admin/bookings`, `/admin/sos-alerts`, `/admin/revenue`
- Add `AdminRoute` guard that checks for `admin` role

### 3. Admin Pages
- **Dashboard** (`/admin`) — Overview cards: total users, active bookings, active SOS alerts, total revenue
- **User & Vendor Management** (`/admin/users`) — List all profiles with roles, ability to view details, suspend/activate
- **Booking Management** (`/admin/bookings`) — View all bookings with filters (status, date), update statuses
- **SOS Alerts** (`/admin/sos-alerts`) — Real-time SOS alerts dashboard (reuse existing component logic)
- **Revenue & Analytics** (`/admin/revenue`) — Charts for bookings over time, earnings, pending withdrawals management

### 4. Security
- All admin actions verified via `has_role(auth.uid(), 'admin')` in RLS policies
- Admin role assignment done directly in DB (not self-assignable)
