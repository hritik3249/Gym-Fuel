-- Comprehensive Indian food seed database.
-- Migration 005 wiped the old seed list; this replaces it with ~100 accurate
-- entries covering everyday Indian meals, snacks, breads, dals, sweets, and drinks.
-- Nutrient values per ICMR / NIN (National Institute of Nutrition, India) tables.
-- Runs safely on re-apply: deletes existing seed rows first, then re-inserts.

delete from foods where source = 'seed';

insert into foods
  (owner_id, name, serving, source, cuisine,
   calories, protein, carbs, fat, fiber,
   iron, calcium, magnesium, zinc, potassium, sodium, vitamin_d, vitamin_b12)
values

-- ─── BREAKFAST ────────────────────────────────────────────────────────────────
  (null, 'Roti / Phulka',               '1 piece, 35g',        'seed', 'Indian',  90,  2.7, 16.0,  1.5, 2.3, 1.2,  12, 22, 0.6,  70,  95, 0, 0),
  (null, 'Aloo Paratha',                '1 piece, 120g',       'seed', 'Indian', 250,  6.0, 36.0, 10.0, 3.0, 1.5,  28, 35, 0.8, 330, 320, 0, 0),
  (null, 'Plain Paratha',               '1 piece, 80g',        'seed', 'Indian', 215,  5.0, 27.0, 10.0, 2.5, 1.2,  18, 28, 0.7, 120, 280, 0, 0),
  (null, 'Gobi Paratha',                '1 piece, 120g',       'seed', 'Indian', 230,  6.0, 35.0,  8.0, 4.0, 1.4,  50, 30, 0.7, 280, 310, 0, 0),
  (null, 'Mooli Paratha',               '1 piece, 120g',       'seed', 'Indian', 225,  5.5, 34.0,  8.5, 3.5, 1.3,  38, 28, 0.6, 240, 295, 0, 0),
  (null, 'Idli',                        '3 pieces, 150g',      'seed', 'Indian', 174,  6.0, 36.0,  0.6, 1.5, 1.1,  18, 24, 0.7, 100, 290, 0, 0),
  (null, 'Plain Dosa',                  '1 piece, 90g',        'seed', 'Indian', 168,  4.0, 28.0,  4.5, 1.0, 1.0,  30, 28, 0.6, 210, 320, 0, 0),
  (null, 'Masala Dosa',                 '1 piece, 200g',       'seed', 'Indian', 365,  8.0, 52.0, 14.0, 4.0, 2.2,  60, 50, 1.1, 450, 610, 0, 0),
  (null, 'Rava Dosa',                   '1 piece, 90g',        'seed', 'Indian', 175,  4.5, 28.0,  5.5, 1.0, 1.0,  25, 22, 0.5, 140, 340, 0, 0),
  (null, 'Medu Vada',                   '2 pieces, 100g',      'seed', 'Indian', 275,  8.0, 28.0, 14.0, 3.0, 2.0,  35, 38, 1.0, 220, 410, 0, 0),
  (null, 'Sambar',                      '1 bowl, 200g',        'seed', 'Indian', 165,  8.0, 24.0,  4.0, 6.0, 2.4,  50, 45, 1.0, 380, 520, 0, 0),
  (null, 'Poha',                        '1 plate, 200g',       'seed', 'Indian', 270,  6.0, 48.0,  7.0, 3.0, 2.0,  30, 35, 0.8, 220, 380, 0, 0),
  (null, 'Upma',                        '1 plate, 200g',       'seed', 'Indian', 250,  7.0, 40.0,  8.0, 3.0, 1.8,  35, 38, 0.9, 200, 420, 0, 0),
  (null, 'Besan Cheela',                '2 pieces, 150g',      'seed', 'Indian', 200, 10.0, 25.0,  7.0, 5.0, 2.5,  42, 48, 1.1, 260, 350, 0, 0),
  (null, 'Moong Dal Cheela',            '2 pieces, 150g',      'seed', 'Indian', 195, 11.0, 26.0,  5.0, 4.5, 2.4,  38, 50, 1.0, 280, 320, 0, 0),
  (null, 'Sabudana Khichdi',            '1 bowl, 200g',        'seed', 'Indian', 320,  5.0, 55.0, 10.0, 2.0, 1.5,  28, 22, 0.4, 170, 280, 0, 0),
  (null, 'Rava Idli',                   '3 pieces, 150g',      'seed', 'Indian', 205,  6.5, 36.0,  4.5, 2.0, 1.3,  30, 30, 0.8, 160, 390, 0, 0),
  (null, 'Egg Bhurji',                  '2 eggs scrambled, 150g', 'seed', 'Indian', 230, 16.0, 5.0, 17.0, 0.5, 1.8, 52, 14, 1.2, 200, 490, 1.0, 1.0),
  (null, 'Oats Porridge',               '1 bowl, 250g',        'seed', null,      260,  9.0, 44.0,  5.0, 6.0, 2.8,  90, 75, 1.9, 270,  95, 0, 0),
  (null, 'Bread Omelette',              '2 slices + 2 eggs',   'seed', 'Indian', 380, 18.0, 30.0, 20.0, 2.5, 2.4,  80, 28, 1.6, 290, 540, 1.0, 1.0),

-- ─── DALS & LENTILS ───────────────────────────────────────────────────────────
  (null, 'Dal Tadka',                   '1 bowl, 200g',        'seed', 'Indian', 240, 12.0, 32.0,  7.0, 8.0, 3.2,  56, 62, 1.5, 440, 510, 0, 0),
  (null, 'Dal Makhani',                 '1 bowl, 200g',        'seed', 'Indian', 310, 13.0, 35.0, 14.0, 8.0, 3.6,  72, 68, 1.8, 480, 580, 0.1, 0.2),
  (null, 'Homemade Dal (Toor)',         '1 katori, 180g',      'seed', 'Indian', 225, 13.0, 34.0,  5.0, 9.0, 3.9,  62, 70, 1.8, 540, 480, 0, 0),
  (null, 'Moong Dal (Yellow)',          '1 bowl, 200g',        'seed', 'Indian', 200, 12.0, 30.0,  3.0, 7.0, 2.8,  50, 54, 1.2, 380, 340, 0, 0),
  (null, 'Masoor Dal (Red Lentil)',     '1 bowl, 200g',        'seed', 'Indian', 215, 14.0, 33.0,  3.0, 8.0, 3.2,  48, 60, 1.4, 420, 360, 0, 0),
  (null, 'Chana Dal',                   '1 bowl, 200g',        'seed', 'Indian', 240, 13.0, 36.0,  5.0, 9.0, 2.9,  64, 65, 1.6, 470, 420, 0, 0),
  (null, 'Urad Dal',                    '1 bowl, 200g',        'seed', 'Indian', 235, 14.0, 34.0,  4.5, 8.5, 3.0,  60, 68, 1.5, 450, 400, 0, 0),
  (null, 'Rajma (Kidney Bean Curry)',   '1 bowl, 220g',        'seed', 'Indian', 270, 13.0, 40.0,  7.0,10.0, 3.6,  75, 65, 1.7, 520, 540, 0, 0),
  (null, 'Chole (Chickpea Curry)',      '1 bowl, 220g',        'seed', 'Indian', 290, 12.0, 38.0, 11.0, 9.0, 4.2,  90, 70, 1.9, 480, 560, 0, 0),

-- ─── MAIN COURSE – VEG ────────────────────────────────────────────────────────
  (null, 'Palak Paneer',                '1 bowl, 220g',        'seed', 'Indian', 355, 18.0, 14.0, 26.0, 4.0, 3.8, 360, 55, 2.0, 450, 580, 0.5, 0.4),
  (null, 'Paneer Tikka Masala',         '1 bowl, 220g',        'seed', 'Indian', 390, 20.0, 18.0, 28.0, 3.0, 2.0, 340, 45, 1.8, 420, 620, 0.3, 0.5),
  (null, 'Shahi Paneer',                '1 bowl, 220g',        'seed', 'Indian', 450, 18.0, 16.0, 36.0, 2.0, 1.5, 380, 40, 1.6, 340, 580, 0.4, 0.4),
  (null, 'Matar Paneer',                '1 bowl, 220g',        'seed', 'Indian', 380, 17.0, 22.0, 26.0, 5.0, 2.5, 310, 50, 1.7, 450, 560, 0.3, 0.4),
  (null, 'Paneer Bhurji',               '1 bowl, 220g',        'seed', 'Indian', 410, 28.0, 14.0, 28.0, 3.0, 2.5, 520, 55, 3.6, 420, 620, 0.6, 1.2),
  (null, 'Cottage Cheese (Paneer)',     '100g',                'seed', 'Indian', 265, 18.0,  1.2, 21.0, 0,   0.2, 480, 30, 1.6,  90,  22, 0,   0.6),
  (null, 'Aloo Gobi',                   '1 bowl, 200g',        'seed', 'Indian', 195,  5.0, 28.0,  8.0, 5.0, 1.5,  48, 32, 0.7, 480, 420, 0, 0),
  (null, 'Aloo Matar',                  '1 bowl, 200g',        'seed', 'Indian', 210,  6.0, 30.0,  8.0, 5.0, 1.8,  40, 35, 0.8, 490, 440, 0, 0),
  (null, 'Baingan Bharta',              '1 bowl, 200g',        'seed', 'Indian', 170,  4.0, 18.0, 10.0, 5.0, 1.2,  42, 38, 0.5, 440, 380, 0, 0),
  (null, 'Bhindi Masala',               '1 bowl, 200g',        'seed', 'Indian', 180,  4.0, 15.0, 12.0, 5.0, 1.5,  95, 58, 0.6, 380, 360, 0, 0),
  (null, 'Malai Kofta',                 '1 bowl, 220g',        'seed', 'Indian', 520, 14.0, 28.0, 40.0, 3.0, 2.0, 300, 42, 1.5, 380, 560, 0.3, 0.3),
  (null, 'Kadhi Pakora',                '1 bowl, 250g',        'seed', 'Indian', 290,  9.0, 28.0, 16.0, 3.0, 2.2,  95, 40, 1.1, 360, 620, 0.1, 0.2),
  (null, 'Mix Veg Curry',               '1 bowl, 200g',        'seed', 'Indian', 190,  5.0, 22.0, 10.0, 5.0, 1.6,  65, 40, 0.8, 430, 420, 0, 0),

-- ─── MAIN COURSE – NON-VEG ────────────────────────────────────────────────────
  (null, 'Chicken Curry',               '1 bowl, 250g',        'seed', 'Indian', 365, 38.0, 10.0, 19.0, 2.0, 2.1,  68, 54, 3.2, 610, 710, 0.2, 0.5),
  (null, 'Butter Chicken',              '1 bowl, 250g',        'seed', 'Indian', 420, 35.0, 16.0, 25.0, 2.0, 2.0,  75, 52, 2.8, 580, 720, 0.2, 0.5),
  (null, 'Tandoori Chicken',            '2 pieces, 200g',      'seed', 'Indian', 320, 42.0,  4.0, 15.0, 0.5, 1.6,  30, 50, 2.4, 480, 620, 0.2, 0.7),
  (null, 'Chicken Tikka',               '6 pieces, 180g',      'seed', 'Indian', 295, 38.0,  5.0, 13.0, 0.5, 1.4,  25, 45, 2.2, 450, 580, 0.2, 0.6),
  (null, 'Mutton Curry',                '1 bowl, 250g',        'seed', 'Indian', 420, 40.0,  8.0, 26.0, 1.0, 2.8,  22, 40, 4.8, 490, 680, 0.1, 1.8),
  (null, 'Egg Curry',                   '2 eggs + gravy, 250g','seed', 'Indian', 340, 22.0, 12.0, 24.0, 2.0, 2.6,  78, 32, 1.8, 380, 640, 1.0, 1.0),
  (null, 'Keema Matar',                 '1 bowl, 220g',        'seed', 'Indian', 380, 30.0, 18.0, 22.0, 5.0, 3.2,  52, 44, 3.5, 480, 600, 0.1, 1.4),
  (null, 'Fish Curry',                  '1 bowl, 250g',        'seed', 'Indian', 310, 30.0, 10.0, 17.0, 1.0, 1.8,  90, 42, 0.8, 540, 660, 2.0, 2.8),

-- ─── RICE DISHES ──────────────────────────────────────────────────────────────
  (null, 'Cooked Basmati Rice',         '1 cup, 160g',         'seed', 'Indian', 205,  4.3, 45.0,  0.4, 0.7, 1.9,  16, 19, 0.8,  55,   2, 0, 0),
  (null, 'Jeera Rice',                  '1 bowl, 180g',        'seed', 'Indian', 250,  4.5, 44.0,  6.0, 1.0, 1.5,  14, 18, 0.7,  60, 180, 0, 0),
  (null, 'Pulao',                       '1 bowl, 200g',        'seed', 'Indian', 310,  7.0, 52.0,  9.0, 2.0, 1.8,  30, 28, 0.9, 200, 310, 0, 0),
  (null, 'Curd Rice',                   '1 bowl, 250g',        'seed', 'Indian', 270,  8.0, 42.0,  7.0, 1.0, 0.6, 220, 28, 0.9, 280, 200, 0, 0.5),
  (null, 'Lemon Rice',                  '1 bowl, 200g',        'seed', 'Indian', 280,  5.0, 48.0,  8.0, 1.5, 1.4,  14, 22, 0.7,  80, 260, 0, 0),
  (null, 'Veg Biryani',                 '1 plate, 300g',       'seed', 'Indian', 480, 10.0, 72.0, 18.0, 5.0, 2.5,  60, 42, 1.2, 340, 560, 0, 0),
  (null, 'Chicken Biryani',             '1 plate, 350g',       'seed', 'Indian', 620, 38.0, 70.0, 22.0, 3.0, 3.0,  60, 55, 2.8, 560, 740, 0.1, 0.5),
  (null, 'Mutton Biryani',              '1 plate, 350g',       'seed', 'Indian', 650, 35.0, 72.0, 26.0, 3.0, 3.4,  50, 52, 4.0, 530, 780, 0.1, 1.5),
  (null, 'Egg Biryani',                 '1 plate, 320g',       'seed', 'Indian', 540, 22.0, 70.0, 20.0, 2.5, 2.2,  65, 44, 1.6, 420, 680, 0.8, 0.8),
  (null, 'Vegetable Khichdi',           '1 bowl, 250g',        'seed', 'Indian', 280,  9.0, 50.0,  6.0, 5.0, 2.6,  50, 55, 1.2, 380, 460, 0, 0),

-- ─── BREADS ───────────────────────────────────────────────────────────────────
  (null, 'Naan',                        '1 piece, 90g',        'seed', 'Indian', 280,  8.0, 47.0,  7.0, 2.0, 1.5,  28, 22, 0.7, 100, 420, 0, 0),
  (null, 'Tandoori Roti',               '1 piece, 60g',        'seed', 'Indian', 160,  5.0, 28.0,  3.5, 2.5, 1.4,  22, 26, 0.7,  90, 280, 0, 0),
  (null, 'Kulcha',                      '1 piece, 90g',        'seed', 'Indian', 265,  7.0, 44.0,  7.0, 2.0, 1.3,  25, 20, 0.6,  90, 390, 0, 0),
  (null, 'Puri',                        '2 pieces, 60g',       'seed', 'Indian', 225,  4.0, 24.0, 13.0, 1.5, 1.0,  14, 18, 0.5,  80, 180, 0, 0),
  (null, 'Bhatura',                     '1 piece, 80g',        'seed', 'Indian', 275,  6.0, 38.0, 12.0, 1.5, 1.2,  20, 20, 0.6,  90, 310, 0, 0),
  (null, 'Roti (Whole Wheat)',          '1 piece, 40g',        'seed', 'Indian', 104,  3.1, 18.0,  2.5, 2.7, 1.2,  12, 22, 0.6,  70,  95, 0, 0),

-- ─── SNACKS & STREET FOOD ─────────────────────────────────────────────────────
  (null, 'Samosa',                      '2 pieces, 120g',      'seed', 'Indian', 340,  7.0, 38.0, 18.0, 3.0, 1.8,  28, 30, 0.7, 280, 490, 0, 0),
  (null, 'Veg Pakora',                  '6 pieces, 120g',      'seed', 'Indian', 290,  7.0, 32.0, 15.0, 3.0, 2.0,  40, 35, 0.8, 240, 440, 0, 0),
  (null, 'Dhokla',                      '4 pieces, 150g',      'seed', 'Indian', 200,  8.0, 30.0,  6.0, 2.0, 1.8,  38, 30, 0.8, 180, 520, 0, 0),
  (null, 'Pav Bhaji',                   '1 plate, 350g',       'seed', 'Indian', 490, 12.0, 68.0, 20.0, 7.0, 3.0,  80, 58, 1.4, 680, 820, 0.2, 0.1),
  (null, 'Vada Pav',                    '1 piece, 150g',       'seed', 'Indian', 320,  8.0, 48.0, 11.0, 3.0, 1.6,  38, 32, 0.8, 320, 560, 0, 0),
  (null, 'Chole Bhature',               '1 plate, 400g',       'seed', 'Indian', 700, 22.0, 90.0, 28.0,12.0, 5.0, 110, 90, 2.5, 760, 820, 0, 0),
  (null, 'Bhel Puri',                   '1 plate, 150g',       'seed', 'Indian', 200,  5.0, 36.0,  5.0, 3.0, 2.0,  30, 28, 0.7, 220, 480, 0, 0),
  (null, 'Sev Puri',                    '1 plate, 150g',       'seed', 'Indian', 240,  5.0, 36.0,  9.0, 3.0, 1.8,  28, 26, 0.6, 200, 510, 0, 0),
  (null, 'Dahi Vada',                   '3 pieces, 200g',      'seed', 'Indian', 290, 10.0, 38.0, 11.0, 3.0, 2.0,  95, 35, 1.0, 280, 560, 0, 0.3),
  (null, 'Aloo Tikki',                  '2 pieces, 120g',      'seed', 'Indian', 270,  5.0, 38.0, 11.0, 3.0, 1.4,  22, 28, 0.6, 340, 460, 0, 0),
  (null, 'Kachori',                     '2 pieces, 100g',      'seed', 'Indian', 350,  7.0, 40.0, 18.0, 3.0, 2.0,  28, 32, 0.8, 200, 430, 0, 0),
  (null, 'Paneer Tikka',                '6 pieces, 150g',      'seed', 'Indian', 315, 20.0,  8.0, 23.0, 1.0, 0.8, 340, 35, 1.6, 200, 420, 0.3, 0.5),

-- ─── DAIRY & EGGS ─────────────────────────────────────────────────────────────
  (null, 'Curd (Dahi)',                 '1 bowl, 200g',        'seed', 'Indian', 122,  7.0,  9.0,  6.0, 0,   0.1, 240, 24, 1.0, 280,  80, 0, 0.6),
  (null, 'Milk (Toned)',                '1 glass, 250ml',      'seed', 'Indian', 125,  8.0, 12.0,  5.0, 0,   0.1, 300, 30, 1.0, 380, 105, 1.0, 1.1),
  (null, 'Boiled Eggs',                 '2 large',             'seed', null,     156, 13.0,  1.1, 11.0, 0,   1.8,  56, 12, 1.3, 138, 124, 1.1, 0.9),
  (null, 'Paneer (Raw)',                '100g',                'seed', 'Indian', 265, 18.0,  1.2, 21.0, 0,   0.2, 480, 30, 1.6,  90,  22, 0,   0.6),
  (null, 'Ghee',                        '1 tsp, 5g',           'seed', 'Indian',  45,  0,    0,    5.0, 0,   0,     0,  0, 0,     1,   0, 0, 0),
  (null, 'Butter',                      '1 tsp, 5g',           'seed', null,      36,  0,    0,    4.1, 0,   0,     1,  0, 0,     1,  32, 0, 0),

-- ─── SWEETS & DESSERTS ────────────────────────────────────────────────────────
  (null, 'Gulab Jamun',                 '2 pieces, 100g',      'seed', 'Indian', 385,  5.0, 60.0, 14.0, 0.5, 0.5,  90, 18, 0.4, 120, 180, 0, 0.1),
  (null, 'Rasgulla',                    '2 pieces, 120g',      'seed', 'Indian', 220,  5.5, 42.0,  4.0, 0,   0.2, 100, 10, 0.2,  80, 120, 0, 0.1),
  (null, 'Kheer (Rice Pudding)',        '1 bowl, 200g',        'seed', 'Indian', 300,  8.0, 48.0,  9.0, 0.3, 0.3, 220, 30, 0.6, 280, 130, 0.5, 0.5),
  (null, 'Sooji Halwa',                 '1 bowl, 150g',        'seed', 'Indian', 390,  5.5, 55.0, 17.0, 1.0, 1.5,  30, 18, 0.5, 100, 110, 0, 0),
  (null, 'Gajar Halwa',                 '1 bowl, 150g',        'seed', 'Indian', 360,  6.0, 48.0, 16.0, 2.5, 1.2,  80, 22, 0.4, 240, 130, 0.3, 0.2),
  (null, 'Ladoo (Besan)',               '2 pieces, 80g',       'seed', 'Indian', 360,  7.0, 52.0, 14.0, 2.0, 2.0,  40, 30, 0.8, 120, 100, 0, 0),
  (null, 'Barfi (Milk)',                '2 pieces, 80g',       'seed', 'Indian', 340,  9.0, 48.0, 13.0, 0.5, 0.3, 200, 22, 0.6, 180, 100, 0.2, 0.3),
  (null, 'Jalebi',                      '4 pieces, 100g',      'seed', 'Indian', 450,  3.0, 75.0, 16.0, 0.5, 1.0,  14, 10, 0.2,  60, 180, 0, 0),

-- ─── DRINKS & BEVERAGES ───────────────────────────────────────────────────────
  (null, 'Chai (Milk Tea)',             '1 cup, 200ml',        'seed', 'Indian',  90,  3.0, 12.0,  4.0, 0,   0.1, 100, 12, 0.2, 150,  40, 0.2, 0.3),
  (null, 'Sweet Lassi',                 '1 glass, 300ml',      'seed', 'Indian', 235,  7.0, 38.0,  7.0, 0,   0.1, 260, 28, 0.8, 330,  95, 0, 0.6),
  (null, 'Salted Lassi / Chaas',        '1 glass, 300ml',      'seed', 'Indian',  85,  5.0,  9.0,  3.0, 0,   0.1, 180, 20, 0.5, 240, 420, 0, 0.5),
  (null, 'Nimbu Pani (Lemon Water)',    '1 glass, 250ml',      'seed', 'Indian',  55,  0.3, 14.0,  0,   0.3, 0.1,   6,  6, 0.1,  75,  20, 0, 0),
  (null, 'Coconut Water',               '1 glass, 240ml',      'seed', null,       55,  1.7, 11.0,  0.5, 2.0, 0.3,   6, 24, 0.2, 600, 105, 0, 0),
  (null, 'Black Coffee',                '1 cup, 240ml',        'seed', null,        2,  0.3,  0,    0,   0,   0,     5,  7, 0,   116,   5, 0, 0),

-- ─── PROTEINS & STAPLES ───────────────────────────────────────────────────────
  (null, 'Grilled Chicken Breast',      '150g',                'seed', null,     248, 47.0,  0,    5.4, 0,   1.2,  18, 42, 1.5, 420, 290, 0, 0.6),
  (null, 'Boiled Chana (Chickpeas)',    '1 cup, 165g',         'seed', null,     270, 15.0, 45.0,  4.0,12.0, 4.7,  80, 78, 2.5, 480,  11, 0, 0),
  (null, 'Boiled Sweet Potato',         '1 medium, 150g',      'seed', null,     135,  2.4, 31.0,  0.2, 4.5, 0.9,  50, 33, 0.4, 540,  65, 0, 0),
  (null, 'Banana',                      '1 medium, 120g',      'seed', null,     107,  1.3, 27.0,  0.4, 3.1, 0.3,   6, 32, 0.2, 420,   1, 0, 0),
  (null, 'Apple',                       '1 medium, 180g',      'seed', null,      95,  0.5, 25.0,  0.3, 4.4, 0.2,  11,  9, 0.1, 195,   2, 0, 0),
  (null, 'Almonds',                     '30g handful',         'seed', null,     174,  6.4,  6.1, 15.0, 3.5, 1.1,  76, 76, 1.0, 208,   0, 0, 0),
  (null, 'Whey Protein Shake',          '1 scoop in water',    'seed', null,     120, 24.0,  3.0,  1.5, 0,   0.3, 130, 22, 1.2, 180,  80, 0, 0.5);
