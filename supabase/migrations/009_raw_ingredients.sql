-- Raw ingredient library: grains, dals, seeds, nuts, vegetables, fruits, dairy, proteins, oils.
-- All values are per 100 g of the raw/uncooked ingredient (or as noted).
-- Source: ICMR-NIN Indian Food Composition Tables + USDA FoodData Central.
-- Safe to re-run: skips entirely if already seeded.

do $$
begin
  if exists (select 1 from foods where source = 'seed' and name = 'White Rice (Raw)') then
    return;
  end if;

  insert into foods
    (owner_id, name, serving, source, cuisine,
     calories, protein, carbs, fat, fiber,
     iron, calcium, magnesium, zinc, potassium, sodium, vitamin_d, vitamin_b12)
  values

-- ─── GRAINS & CEREALS ────────────────────────────────────────────────────────
    (null, 'White Rice (Raw)',           '100 g',         'seed', null,      365,  7.1, 80.0,  0.7,  1.3,  0.8,  10,  25, 1.1,  115,   5, 0,    0),
    (null, 'Brown Rice (Raw)',           '100 g',         'seed', null,      370,  7.5, 77.0,  2.7,  3.5,  1.5,  20, 143, 2.0,  250,   7, 0,    0),
    (null, 'Rolled Oats',               '100 g',         'seed', null,      389, 16.9, 66.3,  6.9, 10.6,  4.7,  54, 177, 4.0,  429,   2, 0,    0),
    (null, 'Whole Wheat Flour (Atta)',   '100 g',         'seed', 'Indian',  340, 12.0, 72.0,  1.7, 10.0,  4.6,  34, 138, 2.6,  405,   2, 0,    0),
    (null, 'Semolina (Suji / Rava)',     '100 g',         'seed', 'Indian',  360, 12.7, 73.0,  1.0,  3.9,  3.8,  17,  47, 1.1,  186,   1, 0,    0),
    (null, 'Poha (Flattened Rice, Dry)', '100 g',         'seed', 'Indian',  350,  6.5, 78.0,  1.1,  1.9, 20.0,  14,  48, 1.0,  124,  16, 0,    0),
    (null, 'Bajra (Pearl Millet)',       '100 g',         'seed', 'Indian',  378, 11.3, 72.8,  5.0,  8.5,  6.4,  38, 114, 2.5,  307,  11, 0,    0),
    (null, 'Jowar (Sorghum)',            '100 g',         'seed', 'Indian',  349, 11.3, 72.1,  3.3,  6.7,  4.4,  28,  70, 1.7,  350,   6, 0,    0),
    (null, 'Ragi (Finger Millet)',       '100 g',         'seed', 'Indian',  336,  7.3, 72.6,  1.9, 11.5,  3.9, 344, 137, 2.5,  408,  11, 0,    0),
    (null, 'Quinoa (Raw)',               '100 g',         'seed', null,      368, 14.1, 64.2,  6.1,  7.0,  4.6,  47, 197, 3.1,  563,   5, 0,    0),
    (null, 'Maize / Cornflour',          '100 g',         'seed', null,      381,  0.9, 91.3,  0.6,  0.9,  0.6,   7,   6, 0.1,   35,   5, 0,    0),
    (null, 'Sabudana (Tapioca Pearls)',  '100 g dry',     'seed', 'Indian',  360,  0.2, 88.7,  0.2,  0.9,  0.4,  22,   2, 0.1,   11,   1, 0,    0),

-- ─── DALS & LEGUMES (raw) ────────────────────────────────────────────────────
    (null, 'Masoor Dal (Red Lentils)',   '100 g raw',     'seed', 'Indian',  353, 25.8, 60.1,  1.1, 10.7,  6.5,  35,  47, 3.3,  677,   6, 0,    0),
    (null, 'Moong Dal (Split Yellow)',   '100 g raw',     'seed', 'Indian',  347, 23.9, 62.6,  1.2, 16.3,  6.7, 124, 189, 2.7, 1246,  15, 0,    0),
    (null, 'Toor Dal (Arhar)',           '100 g raw',     'seed', 'Indian',  336, 22.3, 56.6,  1.5, 15.0,  2.7,  73, 134, 2.8, 1392,  17, 0,    0),
    (null, 'Chana Dal (Bengal Gram)',    '100 g raw',     'seed', 'Indian',  360, 17.1, 60.6,  5.6,  8.0,  4.5, 202, 115, 3.4,  875,  30, 0,    0),
    (null, 'Urad Dal (Black Gram)',      '100 g raw',     'seed', 'Indian',  341, 25.2, 58.9,  1.6, 18.3,  9.5, 138, 267, 3.4,  983,  38, 0,    0),
    (null, 'Whole Moong (Green Gram)',   '100 g raw',     'seed', 'Indian',  347, 23.9, 62.6,  1.2, 16.3,  6.7, 124, 189, 2.7, 1246,  15, 0,    0),
    (null, 'Kabuli Chana (Chickpeas)',   '100 g raw',     'seed', 'Indian',  364, 19.3, 60.7,  6.1, 17.4,  6.2, 105, 115, 3.4,  875,  24, 0,    0),
    (null, 'Kala Chana (Black Chana)',   '100 g raw',     'seed', 'Indian',  364, 18.1, 64.0,  2.6, 12.0,  6.5,  53, 115, 2.7,  770,  22, 0,    0),
    (null, 'Rajma (Kidney Beans, Raw)',  '100 g raw',     'seed', 'Indian',  333, 23.6, 60.0,  0.8, 15.2,  8.2, 143, 140, 2.8, 1359,  28, 0,    0),
    (null, 'Soybean (Dry)',             '100 g raw',     'seed', null,      446, 36.5, 30.2, 19.9,  9.3, 15.7, 277, 280, 4.9, 1797,   2, 0,    0),
    (null, 'Lobia (Black-eyed Peas)',    '100 g raw',     'seed', 'Indian',  336, 23.5, 60.0,  1.3, 10.6,  8.0,  61, 184, 3.4,  1393,  16, 0,    0),

-- ─── SEEDS ──────────────────────────────────────────────────────────────────
    (null, 'Chia Seeds',                '100 g',         'seed', null,      486, 16.5, 42.1, 30.7, 34.4,  7.7, 631, 335, 4.6,  407,  16, 0,    0),
    (null, 'Flaxseeds (Alsi)',          '100 g',         'seed', 'Indian',  534, 18.3, 28.9, 42.2, 27.3,  5.7, 255, 392, 4.3,  813,  30, 0,    0),
    (null, 'Sunflower Seeds',           '100 g',         'seed', null,      584, 20.8, 20.0, 51.5,  8.6,  5.2,  78, 325, 5.0,  645,   9, 0,    0),
    (null, 'Pumpkin Seeds (Pepitas)',   '100 g',         'seed', null,      559, 30.2, 10.7, 49.1,  6.0,  8.8,  46, 592, 7.8,  809,   7, 0,    0),
    (null, 'Sesame Seeds (Til)',        '100 g',         'seed', 'Indian',  573, 17.7, 23.4, 49.7, 11.8, 14.6, 975, 351, 7.8,  468,  11, 0,    0),
    (null, 'Watermelon Seeds (Magaz)',  '100 g',         'seed', 'Indian',  557, 28.3, 15.3, 47.4,  3.0,  7.3,  54, 556, 10.2, 648,  99, 0,    0),
    (null, 'Hemp Seeds',               '100 g',         'seed', null,      553, 31.6,  8.7, 48.8,  4.0,  7.9,  70, 700, 9.9,  859,   5, 0,    0),

-- ─── NUTS ───────────────────────────────────────────────────────────────────
    (null, 'Almonds (Raw)',             '100 g',         'seed', null,      579, 21.2, 21.7, 49.9, 12.5,  3.7, 269, 270, 3.1,  733,   1, 0,    0),
    (null, 'Cashews (Raw)',             '100 g',         'seed', null,      553, 18.2, 30.2, 43.9,  3.3,  6.7,  37, 292, 5.8,  660,  12, 0,    0),
    (null, 'Walnuts',                  '100 g',         'seed', null,      654, 15.2, 13.7, 65.2,  6.7,  2.9,  98, 158, 3.1,  441,   2, 0,    0),
    (null, 'Peanuts (Raw)',            '100 g',         'seed', null,      567, 25.8, 16.1, 49.2,  8.5,  4.6,  92, 168, 3.3,  705,  18, 0,    0),
    (null, 'Pistachios (Raw)',         '100 g',         'seed', null,      562, 20.2, 27.7, 45.4, 10.3,  3.9, 105, 121, 2.2, 1025,   1, 0,    0),
    (null, 'Dates (Dried)',            '100 g',         'seed', null,      277,  1.8, 75.0,  0.2,  6.7,  0.9,  64,  54, 0.4,  696,   1, 0,    0),

-- ─── VEGETABLES (raw) ────────────────────────────────────────────────────────
    (null, 'Spinach / Palak (Raw)',    '100 g',         'seed', 'Indian',   23,  2.9,  3.6,  0.4,  2.2,  2.7,  99,  79, 0.5,  558,  79, 0,    0),
    (null, 'Tomato (Raw)',             '100 g',         'seed', null,       18,  0.9,  3.9,  0.2,  1.2,  0.3,  10,  11, 0.2,  237,   5, 0,    0),
    (null, 'Onion (Raw)',              '100 g',         'seed', null,       40,  1.1,  9.3,  0.1,  1.7,  0.2,  23,  10, 0.2,  146,   4, 0,    0),
    (null, 'Potato (Raw)',             '100 g',         'seed', null,       77,  2.0, 17.5,  0.1,  2.1,  0.8,  12,  23, 0.3,  425,   6, 0,    0),
    (null, 'Sweet Potato (Raw)',       '100 g',         'seed', null,       86,  1.6, 20.1,  0.1,  3.0,  0.6,  30,  25, 0.3,  337,  55, 0,    0),
    (null, 'Green Peas (Raw)',         '100 g',         'seed', null,       81,  5.4, 14.5,  0.4,  5.1,  1.5,  25,  33, 1.2,  244,   5, 0,    0),
    (null, 'Cauliflower (Raw)',        '100 g',         'seed', null,       25,  1.9,  5.0,  0.3,  2.0,  0.4,  22,  15, 0.3,  299,  30, 0,    0),
    (null, 'Cabbage (Raw)',            '100 g',         'seed', null,       25,  1.3,  5.8,  0.1,  2.5,  0.5,  40,  12, 0.2,  170,  18, 0,    0),
    (null, 'Brinjal / Eggplant (Raw)', '100 g',         'seed', 'Indian',   25,  1.0,  5.9,  0.2,  3.0,  0.2,   9,  14, 0.2,  229,   2, 0,    0),
    (null, 'Capsicum / Bell Pepper',   '100 g',         'seed', null,       31,  1.0,  6.0,  0.3,  2.1,  0.4,  10,  10, 0.2,  175,   4, 0,    0),
    (null, 'Bitter Gourd (Karela)',    '100 g',         'seed', 'Indian',   17,  1.0,  3.7,  0.2,  2.8,  0.4,  19,  17, 0.8,  296,   5, 0,    0),
    (null, 'Lauki / Bottle Gourd',    '100 g',         'seed', 'Indian',   14,  0.6,  3.4,  0.0,  0.5,  0.2,  26,  11, 0.1,  170,   2, 0,    0),
    (null, 'Cucumber (Raw)',           '100 g',         'seed', null,       15,  0.7,  3.6,  0.1,  0.5,  0.3,  16,  13, 0.2,  147,   2, 0,    0),
    (null, 'Carrot (Raw)',             '100 g',         'seed', null,       41,  0.9,  9.6,  0.2,  2.8,  0.3,  33,  12, 0.2,  320,  69, 0,    0),
    (null, 'Garlic (Raw)',             '100 g',         'seed', null,      149,  6.4, 33.1,  0.5,  2.1,  1.7, 181,  25, 1.2,  401,  17, 0,    0),
    (null, 'Ginger (Raw)',             '100 g',         'seed', 'Indian',   80,  1.8, 17.8,  0.8,  2.0,  0.6,  16,  43, 0.3,  415,  13, 0,    0),
    (null, 'Green Chilli (Raw)',       '100 g',         'seed', 'Indian',   40,  2.0,  9.5,  0.4,  1.5,  1.2,  18,  25, 0.3,  340,   3, 0,    0),

-- ─── FRUITS ─────────────────────────────────────────────────────────────────
    (null, 'Banana',                   '1 medium, 120g','seed', null,      107,  1.3, 27.6,  0.4,  3.1,  0.3,   6,  32, 0.2,  430,   1, 0,    0),
    (null, 'Apple (with skin)',        '1 medium, 180g','seed', null,       94,  0.5, 24.8,  0.3,  4.4,  0.2,  11,   9, 0.1,  192,   2, 0,    0),
    (null, 'Mango',                    '100 g',         'seed', 'Indian',   60,  0.8, 15.0,  0.4,  1.6,  0.2,  11,  10, 0.1,  168,   1, 0,    0),
    (null, 'Papaya',                   '100 g',         'seed', 'Indian',   43,  0.5, 11.0,  0.3,  1.7,  0.3,  20,  21, 0.1,  182,   8, 0,    0),
    (null, 'Guava',                    '100 g',         'seed', 'Indian',   68,  2.6, 14.3,  1.0,  5.4,  0.3,  18,  22, 0.2,  417,   2, 0,    0),
    (null, 'Watermelon',              '100 g',         'seed', null,       30,  0.6,  7.6,  0.2,  0.4,  0.2,   7,  10, 0.1,  112,   1, 0,    0),
    (null, 'Orange',                  '1 medium, 150g','seed', null,       71,  1.3, 17.8,  0.2,  3.6,  0.2,  60,  15, 0.1,  272,   0, 0,    0),
    (null, 'Pomegranate',             '100 g arils',   'seed', 'Indian',   83,  1.7, 18.7,  1.2,  4.0,  0.3,  10,  12, 0.4,  236,   3, 0,    0),

-- ─── DAIRY & PROTEINS ────────────────────────────────────────────────────────
    (null, 'Chicken Breast (Raw)',     '100 g',         'seed', null,      114, 21.2,  0.0,  2.6,  0.0,  0.7,  11,  29, 0.9,  370,  74, 0.1,  0.3),
    (null, 'Chicken Thigh (Raw)',      '100 g',         'seed', null,      109, 18.0,  0.0,  3.9,  0.0,  0.9,  12,  21, 1.6,  278,  90, 0.1,  0.2),
    (null, 'Whole Egg',               '1 large, 50g',  'seed', null,       70,  6.0,  0.5,  4.8,  0.0,  0.9,  25,   6, 0.6,   63,  62, 1.1,  0.6),
    (null, 'Egg White (Raw)',          '100 g',         'seed', null,       52, 10.9,  0.7,  0.2,  0.0,  0.1,   7,  11, 0.0,  163, 166, 0.0,  0.1),
    (null, 'Egg Yolk (Raw)',           '100 g',         'seed', null,      322, 15.9,  3.6, 26.5,  0.0,  2.7,  129,  5,  2.3,  109,  48, 4.9,  1.9),
    (null, 'Tuna (Canned in Water)',   '100 g drained', 'seed', null,      108, 23.6,  0.0,  0.9,  0.0,  1.3,  11,  35, 0.9,  237, 247, 3.7, 10.0),
    (null, 'Paneer (Raw)',             '100 g',         'seed', 'Indian',  265, 18.3,  1.2, 20.8,  0.0,  0.2, 480,  30, 1.6,   90,  22, 0.0,  0.6),
    (null, 'Full Cream Milk',         '100 ml',        'seed', 'Indian',   61,  3.2,  4.8,  3.3,  0.0,  0.1, 113,  10, 0.4,  132,  43, 0.1,  0.4),
    (null, 'Skimmed Milk',            '100 ml',        'seed', null,       34,  3.4,  5.0,  0.1,  0.0,  0.1, 122,  11, 0.4,  156,  52, 0.0,  0.4),
    (null, 'Greek Yogurt (Plain)',    '100 g',         'seed', null,       73,  9.0,  4.0,  2.0,  0.0,  0.1, 110,  11, 0.6,  141,  36, 0.0,  0.7),
    (null, 'Dahi / Curd (Full Fat)',  '100 g',         'seed', 'Indian',   61,  3.5,  4.5,  3.0,  0.0,  0.1, 120,  12, 0.5,  140,  40, 0.0,  0.5),
    (null, 'Tofu (Firm, Raw)',        '100 g',         'seed', null,       76,  8.1,  1.9,  4.8,  0.3,  5.4, 350,  30, 0.8,  121,   7, 0.0,  0.0),

-- ─── OILS, FATS & SWEETENERS ─────────────────────────────────────────────────
    (null, 'Ghee',                    '1 tbsp, 13g',   'seed', 'Indian',  117,  0.0,  0.0, 12.9,  0.0,  0.0,   1,   0, 0.0,    1,   0, 0.0,  0.0),
    (null, 'Butter (Unsalted)',       '1 tbsp, 14g',   'seed', null,      100,  0.1,  0.0, 11.3,  0.0,  0.0,   3,   0, 0.0,    3,   2, 0.0,  0.0),
    (null, 'Olive Oil',               '1 tbsp, 14g',   'seed', null,      124,  0.0,  0.0, 14.0,  0.0,  0.1,   0,   0, 0.0,    0,   0, 0.0,  0.0),
    (null, 'Coconut Oil',             '1 tbsp, 14g',   'seed', null,      125,  0.0,  0.0, 13.9,  0.0,  0.0,   0,   0, 0.0,    0,   0, 0.0,  0.0),
    (null, 'Mustard Oil',             '1 tbsp, 14g',   'seed', 'Indian',  124,  0.0,  0.0, 14.0,  0.0,  0.0,   0,   0, 0.0,    0,   0, 0.0,  0.0),
    (null, 'Sugar (White)',           '1 tsp, 4g',     'seed', null,       16,  0.0,  4.0,  0.0,  0.0,  0.0,   0,   0, 0.0,    0,   0, 0.0,  0.0),
    (null, 'Honey',                   '1 tbsp, 21g',   'seed', null,       64,  0.1, 17.3,  0.0,  0.0,  0.1,   1,   0, 0.0,   11,   1, 0.0,  0.0),
    (null, 'Jaggery (Gud)',           '100 g',         'seed', 'Indian',  383,  0.4, 98.1,  0.1,  0.0, 11.4,  80,  70, 0.3,  1056,  30, 0.0,  0.0)

  on conflict do nothing;
end $$;
