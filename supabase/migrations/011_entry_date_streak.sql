-- entry_date: stores the user's local calendar date (YYYY-MM-DD) for each food entry.
-- This fixes timezone-based "day reset" bugs (server uses UTC, users are in IST/other zones).
-- last_logged_date: lets the streak logic cheaply determine if yesterday was logged.

alter table food_entries
  add column if not exists entry_date date;

-- Backfill existing rows with the UTC date (close enough for historical data).
update food_entries set entry_date = logged_at::date where entry_date is null;

-- Index for fast per-user per-day lookups.
create index if not exists idx_food_entries_user_date on food_entries(user_id, entry_date);

alter table streaks
  add column if not exists last_logged_date date;
