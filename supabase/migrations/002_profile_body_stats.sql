-- Add body stats columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female')),
  ADD COLUMN IF NOT EXISTS height_cm numeric(5,1),
  ADD COLUMN IF NOT EXISTS current_weight_kg numeric(6,2),
  ADD COLUMN IF NOT EXISTS activity_level text CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')),
  ADD COLUMN IF NOT EXISTS fitness_goal text CHECK (fitness_goal IN ('lose','maintain','gain'));
