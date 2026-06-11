-- Saved meals: a named bundle of food items (with quantities and nutrient
-- snapshots) that can be logged in one tap. Items are stored as jsonb
-- snapshots so a saved meal keeps working even if a food is later deleted.

create table if not exists saved_meals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  meal       text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snacks')),
  items      jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_saved_meals_user on saved_meals (user_id);

alter table saved_meals enable row level security;

drop policy if exists "manage own saved meals" on saved_meals;
create policy "manage own saved meals" on saved_meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
