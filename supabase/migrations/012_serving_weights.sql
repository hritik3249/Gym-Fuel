-- The 1,014 foods imported in migration 007 were labelled '1 serving'
-- because the source CSV had no weight column — but the nutrition values
-- are per 100 g (verified against known foods: butter chicken 137 kcal,
-- boiled rice 117 kcal, idli 137 kcal, butter icing 500 kcal — all match
-- standard per-100g figures).
--
-- Relabelling them '100 g' makes every seed food show its gram weight,
-- enables the g/servings unit toggle in the log popup, and makes the
-- displayed macros truthful.

update foods
set serving = '100 g'
where source = 'seed'
  and serving = '1 serving';
