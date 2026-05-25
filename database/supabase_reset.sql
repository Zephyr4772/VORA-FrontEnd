-- ── VORA LEGAL: Clean Database Reset ────────────────────────────────────────
-- Run this ENTIRELY in: https://supabase.com/dashboard/project/lgbtgdqzkepdxdiviuiy/sql/new

-- Step 1: Drop old tables (clean slate)
drop table if exists public.messages cascade;
drop table if exists public.sessions cascade;
drop table if exists public.chats cascade;

-- Step 2: Recreate sessions table
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default 'New Consultation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sessions enable row level security;

-- Allow users to manage their own sessions
create policy "Users can manage own sessions"
  on public.sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Step 3: Recreate messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  cases jsonb default '[]',
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

-- Allow users to manage messages in their own sessions
create policy "Users can manage messages in own sessions"
  on public.messages for all
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = messages.session_id
      and sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sessions
      where sessions.id = messages.session_id
      and sessions.user_id = auth.uid()
    )
  );

-- Step 4: Auto-update session updated_at when a message is inserted
create or replace function public.update_session_timestamp()
returns trigger as $$
begin
  update public.sessions set updated_at = now() where id = new.session_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row execute procedure public.update_session_timestamp();
