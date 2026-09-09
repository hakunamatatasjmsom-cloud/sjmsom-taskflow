# SJMSOM TaskFlow

Task management and progress tracking for the **SJMSOM, IIT Bombay** fest core team. Replaces WhatsApp-based task tracking with a single source of truth: every task has an owner, a status, a due date, and a running progress log — plus a public showcase page you can present to faculty and sponsors.

Built with **Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth)**. Deploys straight to Vercel.

---

## Features

- **Public home page** (no login) — overall completion figure, progress by workstream (Sponsorship, Logistics, Marketing, …), a live feed of recent updates, and recently completed work. Presentable to faculty/sponsors.
- **Team login** — email/password per member via Supabase Auth.
- **Member dashboard** — "My Tasks" grouped by status, a priority-sorted "Do next" list, quick status changes, and progress notes.
- **Task management** — any member can create and assign tasks; filter the full list by person, category, and status; admins (and the assignee/creator) can edit any field.
- **Team overview** — per-member task counts and last activity, with click-through to each member's full history.
- **Progress log per task** — post updates on a task instead of messaging the group chat.

---

## Tech & structure

```
src/
  app/
    (public)/login/       Login page (Supabase Auth)
    dashboard/            Member dashboard (protected)
    tasks/                Task management + filters (protected)
    team/                 Team overview + [id] member detail (protected)
    actions.ts            Server Actions (all task/update mutations)
    page.tsx              Public home page
    layout.tsx            Root layout + fonts
    globals.css           Theme tokens + palette
  components/
    ui/                   shadcn-style primitives (button, card, dialog, …)
    tasks/                task-card, task-form, task-detail
    layout/               app-nav, app-shell, brand
    *-view.tsx            Client views wired to server data
  lib/
    supabase/             Browser / server / middleware clients
    queries.ts            Central DB reads
    stats.ts              Progress calculations
    types.ts              Shared domain types
  middleware.ts           Session refresh + route protection
supabase/
  schema.sql              Tables, enums, triggers, RLS, seed categories
  seed.sql                Notes on seeding (the npm script is preferred)
scripts/
  seed.mjs                Creates sample users + tasks (npm run seed)
```

---

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier is plenty).
2. In the dashboard, open **SQL Editor → New query**, paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates all tables, the auto-profile trigger, Row Level Security policies, and seeds the default categories.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only; used by the seed script — never expose it to the browser)

### Creating team logins

There's no public sign-up (this is an internal tool). Create accounts one of two ways:

- **Quickest for testing:** run the seed script (below) — it creates four sample users you can log in as immediately.
- **For real members:** **Authentication → Users → Add user** in the Supabase dashboard. A profile row is created automatically by a trigger. To make someone an admin, run in the SQL editor:
  ```sql
  update public.users set role = 'admin' where email = 'lead@sjmsom.in';
  ```

---

## 2. Run locally

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
# then edit .env.local with your Supabase URL + keys

# 3. (Optional) seed sample users + tasks so the UI is populated
npm run seed

# 4. Start
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Sample logins** (after `npm run seed`) — password is `password123` for all:

| Email | Role |
|---|---|
| aarav@sjmsom.in | admin |
| diya@sjmsom.in | member |
| kabir@sjmsom.in | member |
| ananya@sjmsom.in | member |

---

## 3. Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **New Project → Import** your repo. Framework preset is detected as Next.js automatically.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(only needed if you run the seed script; safe to add as it's server-side only)*
4. **Deploy.**

No extra Supabase configuration is needed for auth to work on your Vercel domain — email/password sign-in works out of the box. (If you later add email confirmations or password resets, add your Vercel URL under **Supabase → Authentication → URL Configuration**.)

---

## 4. Going live (clear sample data)

The seed data is only there so the UI looks populated on first run. Before real use, wipe it in the Supabase SQL editor:

```sql
-- Remove all sample tasks and their update logs
truncate public.task_updates, public.tasks restart identity cascade;
```

Then delete the sample accounts under **Authentication → Users** (their profile rows are removed automatically). Your seeded categories stay — keep or edit them as you like. Admins can add custom categories from the task form.

---

## Data model

- **users** — `id` (mirrors the Supabase Auth user), `name`, `email`, `role` (`admin`/`member`), `initials`, `avatar_url`.
- **categories** — seeded set (Sponsorship, Physical Visits, Emails/Outreach, Logistics, Venue Booking, Marketing, Social Media, Other/Manual); admins can add more.
- **tasks** — `title`, `description`, `category_id`, `assigned_to`, `created_by`, `status` (`pending`/`in_progress`/`done`), `priority` (`low`/`medium`/`high`/`urgent`), `due_date`, timestamps.
- **task_updates** — `task_id`, `user_id`, `update_text`, `created_at` — the progress log per task.

### Security model (Row Level Security)

- Anyone (including logged-out visitors) can **read** — this powers the public home page.
- Only authenticated users can **write**.
- A task can be edited by its **assignee**, its **creator**, or an **admin**; the same rule governs progress updates and deletions. All enforced in Postgres, so the rules hold no matter how the API is called.

---

## Notes

- Fonts (Inter + Fraunces) are loaded via `next/font` and fetched from Google Fonts at build time — this needs network access during `npm run build`, which Vercel provides.
- The app uses native `<select>` elements styled to match the design system, so the mobile experience uses the OS picker and stays dependency-light.
