-- Push notification subscriptions (one row per device per user)
create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth_key    text not null,
  created_at  timestamptz not null default now(),
  unique(user_id, endpoint)
);

alter table push_subscriptions enable row level security;
create policy "manage own push subscriptions" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reminder toggles stored on profiles (no separate table needed)
alter table profiles
  add column if not exists reminder_breakfast boolean not null default false,
  add column if not exists reminder_hydration boolean not null default false,
  add column if not exists reminder_weekly    boolean not null default false;
