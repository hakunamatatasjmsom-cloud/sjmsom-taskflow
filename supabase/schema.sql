-- =============================================================
-- SJMSOM TaskFlow — database schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- Safe to re-run: drops and recreates objects.
-- =============================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
do $$ begin
  create type task_status as enum ('pending', 'in_progress', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('admin', 'member');
exception when duplicate_object then null; end $$;

-- ---------- Tables ----------

-- users: profile row per Supabase Auth user. id mirrors auth.users.id.
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  role        user_role not null default 'member',
  initials    text,                       -- e.g. "SG"; falls back to first letters of name
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- categories: seeded set + admin-added custom ones.
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

-- tasks
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  category_id  uuid references public.categories(id) on delete set null,
  assigned_to  uuid references public.users(id) on delete set null,
  created_by   uuid references public.users(id) on delete set null,
  status       task_status not null default 'pending',
  priority     task_priority not null default 'medium',
  due_date     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- task_updates: running comment/progress log per task.
create table if not exists public.task_updates (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  user_id     uuid references public.users(id) on delete set null,
  update_text text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_tasks_status      on public.tasks(status);
create index if not exists idx_tasks_category     on public.tasks(category_id);
create index if not exists idx_updates_task       on public.task_updates(task_id);

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------- Auto-create a profile row when a user signs up ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name, email, initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    upper(left(coalesce(new.raw_user_meta_data->>'name', new.email), 2))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

-- =============================================================
-- Row Level Security
--   Public (anon) can READ everything — the home page is public.
--   Writes require an authenticated user; some require admin.
-- =============================================================
alter table public.users        enable row level security;
alter table public.categories   enable row level security;
alter table public.tasks        enable row level security;
alter table public.task_updates enable row level security;

-- users
drop policy if exists "users read"        on public.users;
drop policy if exists "users self update" on public.users;
drop policy if exists "users admin update" on public.users;
create policy "users read"         on public.users for select using (true);
create policy "users self update"  on public.users for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "users admin update" on public.users for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- categories: anyone reads; any authed member creates; admin edits/deletes.
drop policy if exists "cat read"   on public.categories;
drop policy if exists "cat insert" on public.categories;
drop policy if exists "cat admin"  on public.categories;
create policy "cat read"   on public.categories for select using (true);
create policy "cat insert" on public.categories for insert to authenticated with check (true);
create policy "cat admin"  on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- tasks: anyone reads; any member creates; assignee/creator edits; admin edits any.
drop policy if exists "task read"   on public.tasks;
drop policy if exists "task insert" on public.tasks;
drop policy if exists "task update" on public.tasks;
drop policy if exists "task delete" on public.tasks;
create policy "task read"   on public.tasks for select using (true);
create policy "task insert" on public.tasks for insert to authenticated with check (auth.uid() = created_by);
create policy "task update" on public.tasks for update to authenticated
  using (public.is_admin() or auth.uid() = assigned_to or auth.uid() = created_by)
  with check (public.is_admin() or auth.uid() = assigned_to or auth.uid() = created_by);
create policy "task delete" on public.tasks for delete to authenticated
  using (public.is_admin() or auth.uid() = created_by);

-- task_updates: anyone reads; any authed member posts; author or admin deletes.
drop policy if exists "upd read"   on public.task_updates;
drop policy if exists "upd insert" on public.task_updates;
drop policy if exists "upd delete" on public.task_updates;
create policy "upd read"   on public.task_updates for select using (true);
create policy "upd insert" on public.task_updates for insert to authenticated with check (auth.uid() = user_id);
create policy "upd delete" on public.task_updates for delete to authenticated
  using (public.is_admin() or auth.uid() = user_id);

-- ---------- Seed categories ----------
insert into public.categories (name) values
  ('Sponsorship'), ('Physical Visits'), ('Emails/Outreach'),
  ('Logistics'), ('Venue Booking'), ('Marketing'),
  ('Social Media'), ('Other/Manual')
on conflict (name) do nothing;
