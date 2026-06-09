-- Add lunch and dinner reminder columns to profiles.
-- Safe to re-run (IF NOT EXISTS).

alter table profiles
  add column if not exists reminder_lunch  boolean not null default false,
  add column if not exists reminder_dinner boolean not null default false;
