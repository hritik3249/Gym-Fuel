-- The food logger subscribes to "foods" and "saved_foods" for live refresh, but the
-- initial schema only added food_entries/water_logs/weight_logs/goals to the realtime
-- publication. Add the missing tables (idempotent — skips ones already present).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'foods'
  ) then
    alter publication supabase_realtime add table foods;
  end if;

  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'saved_foods'
  ) then
    alter publication supabase_realtime add table saved_foods;
  end if;
end $$;
