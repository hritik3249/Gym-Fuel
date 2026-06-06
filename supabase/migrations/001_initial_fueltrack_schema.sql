create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type meal_type as enum ('breakfast', 'lunch', 'dinner', 'snacks');
create type food_source as enum ('custom', 'usda', 'open_food_facts', 'seed');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text not null default 'Asia/Calcutta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table goals (
  user_id uuid primary key references profiles(id) on delete cascade,
  calories integer not null default 2600 check (calories > 0),
  protein numeric(8,2) not null default 160,
  carbs numeric(8,2) not null default 250,
  fat numeric(8,2) not null default 80,
  water_ml integer not null default 7000,
  target_weight_kg numeric(6,2) not null default 85,
  updated_at timestamptz not null default now()
);

create table nutrient_targets (
  user_id uuid primary key references profiles(id) on delete cascade,
  fiber numeric(8,2) not null default 30,
  iron numeric(8,2) not null default 18,
  calcium numeric(8,2) not null default 1000,
  magnesium numeric(8,2) not null default 420,
  zinc numeric(8,2) not null default 11,
  potassium numeric(8,2) not null default 3400,
  sodium numeric(8,2) not null default 2300,
  vitamin_d numeric(8,2) not null default 15,
  vitamin_b12 numeric(8,2) not null default 2.4,
  updated_at timestamptz not null default now()
);

create table foods (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  name text not null,
  brand text,
  serving text not null,
  source food_source not null default 'custom',
  external_id text,
  barcode text,
  cuisine text,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(cuisine, '') || ' ' || coalesce(barcode, ''))
  ) stored,
  calories numeric(10,2) not null default 0,
  protein numeric(10,2) not null default 0,
  carbs numeric(10,2) not null default 0,
  fat numeric(10,2) not null default 0,
  fiber numeric(10,2) not null default 0,
  iron numeric(10,2) not null default 0,
  calcium numeric(10,2) not null default 0,
  magnesium numeric(10,2) not null default 0,
  zinc numeric(10,2) not null default 0,
  potassium numeric(10,2) not null default 0,
  sodium numeric(10,2) not null default 0,
  vitamin_d numeric(10,2) not null default 0,
  vitamin_b12 numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table saved_foods (
  user_id uuid references profiles(id) on delete cascade,
  food_id uuid references foods(id) on delete cascade,
  favorite boolean not null default false,
  times_logged integer not null default 0,
  last_logged_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

create table food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  food_id uuid references foods(id) on delete set null,
  meal meal_type not null,
  food_name text not null,
  serving text not null,
  quantity numeric(8,2) not null default 1,
  logged_at timestamptz not null default now(),
  calories numeric(10,2) not null default 0,
  protein numeric(10,2) not null default 0,
  carbs numeric(10,2) not null default 0,
  fat numeric(10,2) not null default 0,
  fiber numeric(10,2) not null default 0,
  iron numeric(10,2) not null default 0,
  calcium numeric(10,2) not null default 0,
  magnesium numeric(10,2) not null default 0,
  zinc numeric(10,2) not null default 0,
  potassium numeric(10,2) not null default 0,
  sodium numeric(10,2) not null default 0,
  vitamin_d numeric(10,2) not null default 0,
  vitamin_b12 numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount_ml integer not null check (amount_ml > 0),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  weight_kg numeric(6,2) not null check (weight_kg > 0),
  body_fat_percent numeric(5,2),
  waist_cm numeric(6,2),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  target integer not null
);

create table user_achievements (
  user_id uuid references profiles(id) on delete cascade,
  achievement_id uuid references achievements(id) on delete cascade,
  progress integer not null default 0,
  unlocked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table streaks (
  user_id uuid primary key references profiles(id) on delete cascade,
  daily_streak integer not null default 0,
  weekly_streak integer not null default 0,
  last_tracked_date date,
  updated_at timestamptz not null default now()
);

create table food_search_cache (
  id uuid primary key default gen_random_uuid(),
  source food_source not null,
  external_id text not null,
  query text not null,
  payload jsonb not null,
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now(),
  unique (source, external_id)
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fueltrack-media',
  'fueltrack-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create index foods_search_idx on foods using gin (search_vector);
create index foods_name_trgm_idx on foods using gin (name gin_trgm_ops);
create index food_entries_user_date_idx on food_entries (user_id, logged_at desc);
create index food_entries_user_meal_idx on food_entries (user_id, meal, logged_at desc);
create index water_logs_user_date_idx on water_logs (user_id, logged_at desc);
create index weight_logs_user_date_idx on weight_logs (user_id, logged_at desc);
create index saved_foods_user_favorite_idx on saved_foods (user_id, favorite desc, times_logged desc);
create index food_search_cache_query_idx on food_search_cache using gin (query gin_trgm_ops);

alter table profiles enable row level security;
alter table goals enable row level security;
alter table nutrient_targets enable row level security;
alter table foods enable row level security;
alter table saved_foods enable row level security;
alter table food_entries enable row level security;
alter table water_logs enable row level security;
alter table weight_logs enable row level security;
alter table user_achievements enable row level security;
alter table streaks enable row level security;
alter table food_search_cache enable row level security;

create policy "read own profile" on profiles for select using (auth.uid() = id);
create policy "update own profile" on profiles for update using (auth.uid() = id);
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "manage own goals" on goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manage own nutrient targets" on nutrient_targets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "read global or own foods" on foods for select using (owner_id is null or owner_id = auth.uid());
create policy "manage own foods" on foods for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "manage own saved foods" on saved_foods for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manage own food entries" on food_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manage own water logs" on water_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manage own weight logs" on weight_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manage own achievements" on user_achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manage own streaks" on streaks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "read food cache" on food_search_cache for select using (true);
create policy "read fueltrack media" on storage.objects for select using (bucket_id = 'fueltrack-media');
create policy "upload own fueltrack media" on storage.objects for insert with check (
  bucket_id = 'fueltrack-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "update own fueltrack media" on storage.objects for update using (
  bucket_id = 'fueltrack-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "delete own fueltrack media" on storage.objects for delete using (
  bucket_id = 'fueltrack-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));

  insert into public.goals (user_id) values (new.id);
  insert into public.nutrient_targets (user_id) values (new.id);
  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter publication supabase_realtime add table food_entries;
alter publication supabase_realtime add table water_logs;
alter publication supabase_realtime add table weight_logs;
alter publication supabase_realtime add table goals;
