-- Seeds a starter library of common foods (global, owner_id null) so search/logging
-- has results out of the box on a fresh project. Safe to re-run: skips if already seeded.
do $$
begin
  if exists (select 1 from foods where source = 'seed') then
    return;
  end if;

  insert into foods (owner_id, name, brand, serving, source, cuisine, calories, protein, carbs, fat, fiber, iron, calcium, magnesium, zinc, potassium, sodium, vitamin_d, vitamin_b12)
  values
    (null, 'Paneer Bhurji', null, '1 bowl, 220g', 'seed', 'Indian', 410, 28, 14, 28, 3, 2.5, 520, 55, 3.6, 420, 620, 0.6, 1.2),
    (null, 'Chicken Curry', null, '1 bowl, 250g', 'seed', 'Indian', 365, 38, 10, 19, 2, 2.1, 68, 54, 3.2, 610, 710, 0.2, 0.5),
    (null, 'Homemade Dal', null, '1 katori, 180g', 'seed', 'Indian', 225, 13, 34, 5, 9, 3.9, 62, 70, 1.8, 540, 480, 0, 0),
    (null, 'Greek Yogurt', 'Plain', '200g', 'seed', null, 146, 20, 8, 4, 0, 0.1, 220, 22, 1.2, 282, 72, 0, 1.4),
    (null, 'Cooked Basmati Rice', null, '1 cup, 160g', 'seed', 'Indian', 205, 4.3, 45, 0.4, 0.7, 1.9, 16, 19, 0.8, 55, 2, 0, 0),
    (null, 'Roti (Whole Wheat)', null, '1 piece, 40g', 'seed', 'Indian', 104, 3.1, 18, 2.5, 2.7, 1.2, 12, 22, 0.6, 70, 95, 0, 0),
    (null, 'Boiled Eggs', null, '2 large', 'seed', null, 156, 13, 1.1, 11, 0, 1.8, 56, 12, 1.3, 138, 124, 1.1, 0.9),
    (null, 'Grilled Chicken Breast', null, '150g', 'seed', null, 248, 47, 0, 5.4, 0, 1.2, 18, 42, 1.5, 420, 290, 0, 0.6),
    (null, 'Oats Porridge', null, '1 bowl, 250g', 'seed', null, 260, 9, 44, 5, 6, 2.8, 90, 75, 1.9, 270, 95, 0, 0),
    (null, 'Banana', null, '1 medium, 120g', 'seed', null, 107, 1.3, 27, 0.4, 3.1, 0.3, 6, 32, 0.2, 420, 1, 0, 0),
    (null, 'Apple', null, '1 medium, 180g', 'seed', null, 95, 0.5, 25, 0.3, 4.4, 0.2, 11, 9, 0.1, 195, 2, 0, 0),
    (null, 'Almonds', null, '30g handful', 'seed', null, 174, 6.4, 6.1, 15, 3.5, 1.1, 76, 76, 1, 208, 0, 0, 0),
    (null, 'Peanut Butter', null, '2 tbsp, 32g', 'seed', null, 188, 8, 6, 16, 1.9, 0.6, 14, 49, 0.9, 208, 147, 0, 0),
    (null, 'Whey Protein Shake', null, '1 scoop in water', 'seed', null, 120, 24, 3, 1.5, 0, 0.3, 130, 22, 1.2, 180, 80, 0, 0.5),
    (null, 'Whey Banana Shake', null, '1 shaker, 350ml', 'seed', null, 310, 32, 38, 4, 4, 0.8, 180, 58, 1.1, 690, 210, 0, 0.8),
    (null, 'Brown Bread Toast', null, '2 slices', 'seed', null, 180, 8, 30, 3, 4, 1.8, 60, 40, 1, 130, 320, 0, 0),
    (null, 'Idli', null, '3 pieces', 'seed', 'Indian', 174, 6, 36, 0.6, 1.5, 1.1, 18, 24, 0.7, 100, 290, 0, 0),
    (null, 'Sambar', null, '1 bowl, 200g', 'seed', 'Indian', 165, 8, 24, 4, 6, 2.4, 50, 45, 1, 380, 520, 0, 0),
    (null, 'Masala Dosa', null, '1 piece', 'seed', 'Indian', 365, 8, 52, 14, 4, 2.2, 60, 50, 1.1, 450, 610, 0, 0),
    (null, 'Poha', null, '1 plate, 200g', 'seed', 'Indian', 270, 6, 48, 7, 3, 2, 30, 35, 0.8, 220, 380, 0, 0),
    (null, 'Upma', null, '1 plate, 200g', 'seed', 'Indian', 250, 7, 40, 8, 3, 1.8, 35, 38, 0.9, 200, 420, 0, 0),
    (null, 'Chole (Chickpea Curry)', null, '1 bowl, 220g', 'seed', 'Indian', 290, 12, 38, 11, 9, 4.2, 90, 70, 1.9, 480, 560, 0, 0),
    (null, 'Rajma (Kidney Bean Curry)', null, '1 bowl, 220g', 'seed', 'Indian', 270, 13, 40, 7, 10, 3.6, 75, 65, 1.7, 520, 540, 0, 0),
    (null, 'Curd (Dahi)', null, '1 bowl, 200g', 'seed', 'Indian', 122, 7, 9, 6, 0, 0.1, 240, 24, 1, 280, 80, 0, 0.6),
    (null, 'Boiled Sweet Potato', null, '1 medium, 150g', 'seed', null, 135, 2.4, 31, 0.2, 4.5, 0.9, 50, 33, 0.4, 540, 65, 0, 0),
    (null, 'Grilled Salmon', null, '150g fillet', 'seed', null, 280, 39, 0, 13, 0, 0.5, 18, 47, 0.6, 580, 75, 12, 4.5),
    (null, 'Mixed Vegetable Salad', null, '1 bowl, 200g', 'seed', null, 95, 3, 14, 3.5, 5, 1.2, 60, 35, 0.6, 520, 90, 0, 0),
    (null, 'Cottage Cheese (Paneer) Cubes', null, '100g', 'seed', 'Indian', 265, 18, 1.2, 21, 0, 0.2, 480, 30, 1.6, 90, 22, 0, 0.6),
    (null, 'Boiled Chana (Chickpeas)', null, '1 cup, 165g', 'seed', null, 270, 15, 45, 4, 12, 4.7, 80, 78, 2.5, 480, 11, 0, 0),
    (null, 'Black Coffee', null, '1 cup, 240ml', 'seed', null, 2, 0.3, 0, 0, 0, 0, 5, 7, 0, 116, 5, 0, 0),
    (null, 'Milk (Toned)', null, '1 glass, 250ml', 'seed', 'Indian', 125, 8, 12, 5, 0, 0.1, 300, 30, 1, 380, 105, 1, 1.1),
    (null, 'Mixed Nuts Trail Mix', null, '40g handful', 'seed', null, 220, 7, 12, 17, 3, 1.4, 60, 80, 1.3, 260, 50, 0, 0),
    (null, 'Vegetable Khichdi', null, '1 bowl, 250g', 'seed', 'Indian', 280, 9, 50, 6, 5, 2.6, 50, 55, 1.2, 380, 460, 0, 0),
    (null, 'Tandoori Chicken', null, '2 pieces, 200g', 'seed', 'Indian', 320, 42, 4, 15, 0.5, 1.6, 30, 50, 2.4, 480, 620, 0.2, 0.7),
    (null, 'Plain Dosa', null, '1 piece', 'seed', 'Indian', 168, 4, 28, 4.5, 1, 1, 30, 28, 0.6, 210, 320, 0, 0),
    (null, 'Fruit Bowl (Mixed)', null, '1 bowl, 200g', 'seed', null, 110, 1.5, 27, 0.4, 4, 0.4, 25, 22, 0.3, 380, 5, 0, 0),
    (null, 'Boiled Corn', null, '1 cup, 150g', 'seed', null, 132, 4.7, 29, 1.5, 3.6, 0.8, 4, 51, 0.9, 320, 27, 0, 0),
    (null, 'Protein Bar', null, '1 bar, 60g', 'seed', null, 220, 20, 22, 7, 5, 1.5, 100, 50, 1.8, 180, 200, 0, 0.8),
    (null, 'Multigrain Bread Sandwich', null, '1 sandwich', 'seed', null, 320, 14, 42, 11, 6, 2.4, 90, 60, 1.4, 260, 480, 0, 0),
    (null, 'Steamed Broccoli', null, '1 cup, 150g', 'seed', null, 55, 4, 11, 0.6, 5, 1, 62, 33, 0.6, 460, 50, 0, 0)
  on conflict do nothing;
end $$;
