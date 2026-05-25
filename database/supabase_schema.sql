-- VORA Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lgbtgdqzkepdxdiviuiy/sql

-- ── Users (extends Supabase Auth) ─────────────────────────────────────────────
-- Supabase Auth handles the auth.users table automatically.
-- We create a public profiles table that mirrors it.

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  is_guest boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Allow insert on signup"
  on public.profiles for insert
  with check (auth.uid() = id);


-- ── Sessions (a "consultation" / conversation) ─────────────────────────────────
create table if not exists public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text default 'New Consultation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sessions enable row level security;

create policy "Users can CRUD own sessions"
  on public.sessions for all
  using (auth.uid() = user_id);


-- ── Messages ──────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  cases jsonb default '[]',
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Users can CRUD own messages"
  on public.messages for all
  using (auth.uid() = user_id);


-- ── Auto-create profile on signup ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, is_guest)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Counselor'),
    coalesce((new.raw_user_meta_data->>'is_guest')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── Auto-update session updated_at ────────────────────────────────────────────
create or replace function public.update_session_timestamp()
returns trigger as $$
begin
  update public.sessions set updated_at = now() where id = new.session_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row execute procedure public.update_session_timestamp();
