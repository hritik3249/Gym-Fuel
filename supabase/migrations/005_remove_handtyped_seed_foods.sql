-- The hand-typed starter list from 003 was too small to be useful. Live search now
-- pulls from USDA FoodData Central (huge, reliable, official nutrient reference) and
-- Open Food Facts (Indian packaged products), so the local seed rows are removed.
delete from foods where source = 'seed';
