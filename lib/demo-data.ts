import { subDays } from "date-fns";
import { foodToEntry } from "@/lib/nutrition";
import type { Achievement, DailyTrend, Food, FoodEntry, WaterLog, WeightLog } from "@/lib/types";

export const seedFoods: Food[] = [
  {
    id: "paneer-bhurji",
    name: "Paneer Bhurji",
    serving: "1 bowl, 220g",
    source: "seed",
    cuisine: "Indian",
    favorite: true,
    calories: 410,
    protein: 28,
    carbs: 14,
    fat: 28,
    fiber: 3,
    iron: 2.5,
    calcium: 520,
    magnesium: 55,
    zinc: 3.6,
    potassium: 420,
    sodium: 620,
    vitaminD: 0.6,
    vitaminB12: 1.2
  },
  {
    id: "chicken-curry",
    name: "Chicken Curry",
    serving: "1 bowl, 250g",
    source: "seed",
    cuisine: "Indian",
    favorite: true,
    calories: 365,
    protein: 38,
    carbs: 10,
    fat: 19,
    fiber: 2,
    iron: 2.1,
    calcium: 68,
    magnesium: 54,
    zinc: 3.2,
    potassium: 610,
    sodium: 710,
    vitaminD: 0.2,
    vitaminB12: 0.5
  },
  {
    id: "homemade-dal",
    name: "Homemade Dal",
    serving: "1 katori, 180g",
    source: "seed",
    cuisine: "Indian",
    calories: 225,
    protein: 13,
    carbs: 34,
    fat: 5,
    fiber: 9,
    iron: 3.9,
    calcium: 62,
    magnesium: 70,
    zinc: 1.8,
    potassium: 540,
    sodium: 480,
    vitaminD: 0,
    vitaminB12: 0
  },
  {
    id: "greek-yogurt",
    name: "Greek Yogurt",
    brand: "Plain",
    serving: "200g",
    source: "seed",
    favorite: true,
    calories: 146,
    protein: 20,
    carbs: 8,
    fat: 4,
    fiber: 0,
    iron: 0.1,
    calcium: 220,
    magnesium: 22,
    zinc: 1.2,
    potassium: 282,
    sodium: 72,
    vitaminD: 0,
    vitaminB12: 1.4
  },
  {
    id: "whey-banana",
    name: "Whey Banana Shake",
    serving: "1 shaker",
    source: "custom",
    favorite: true,
    calories: 310,
    protein: 32,
    carbs: 38,
    fat: 4,
    fiber: 4,
    iron: 0.8,
    calcium: 180,
    magnesium: 58,
    zinc: 1.1,
    potassium: 690,
    sodium: 210,
    vitaminD: 0,
    vitaminB12: 0.8
  },
  {
    id: "rice-basmati",
    name: "Cooked Basmati Rice",
    serving: "1 cup, 160g",
    source: "seed",
    cuisine: "Indian",
    calories: 205,
    protein: 4.3,
    carbs: 45,
    fat: 0.4,
    fiber: 0.7,
    iron: 1.9,
    calcium: 16,
    magnesium: 19,
    zinc: 0.8,
    potassium: 55,
    sodium: 2,
    vitaminD: 0,
    vitaminB12: 0
  }
];

export const todayEntries: FoodEntry[] = [
  foodToEntry(seedFoods[3], "breakfast", 1),
  foodToEntry(seedFoods[4], "breakfast", 1),
  foodToEntry(seedFoods[2], "lunch", 1),
  foodToEntry(seedFoods[5], "lunch", 1.4),
  foodToEntry(seedFoods[1], "dinner", 1)
];

export const waterLogs: WaterLog[] = [
  { id: "w1", amountMl: 500, loggedAt: new Date().toISOString() },
  { id: "w2", amountMl: 1000, loggedAt: new Date().toISOString() },
  { id: "w3", amountMl: 750, loggedAt: new Date().toISOString() },
  { id: "w4", amountMl: 500, loggedAt: new Date().toISOString() }
];

export const weightLogs: WeightLog[] = Array.from({ length: 20 }).map((_, index) => ({
  id: `weight-${index}`,
  loggedAt: subDays(new Date(), 19 - index).toISOString(),
  weightKg: Number((91.4 - index * 0.12 + Math.sin(index) * 0.15).toFixed(1)),
  bodyFatPercent: Number((24.8 - index * 0.08).toFixed(1)),
  waistCm: Number((98.5 - index * 0.06).toFixed(1))
}));

export const trends: DailyTrend[] = Array.from({ length: 14 }).map((_, index) => ({
  date: subDays(new Date(), 13 - index).toISOString().slice(5, 10),
  calories: 2200 + Math.round(Math.sin(index * 0.8) * 230 + index * 18),
  protein: 122 + Math.round(Math.cos(index * 0.6) * 18 + index * 2),
  carbs: 210 + Math.round(Math.sin(index * 0.5) * 35),
  fat: 68 + Math.round(Math.cos(index * 0.7) * 10),
  iron: 11 + Math.round(Math.sin(index) * 4),
  calcium: 680 + Math.round(Math.cos(index * 0.5) * 160),
  magnesium: 270 + Math.round(Math.sin(index * 0.7) * 70),
  weightKg: weightLogs[Math.max(0, index + 6)]?.weightKg,
  adherence: 72 + Math.round(Math.sin(index * 0.9) * 12 + index)
}));

export const achievements: Achievement[] = [
  {
    id: "streak-7",
    title: "7-day logging streak",
    description: "Logged nutrition every day this week.",
    progress: 7,
    target: 7,
    unlockedAt: new Date().toISOString()
  },
  {
    id: "protein-30",
    title: "Protein closer",
    description: "Hit your protein target 30 times.",
    progress: 22,
    target: 30
  },
  {
    id: "weight-60",
    title: "Scale discipline",
    description: "Tracked weight for 60 days.",
    progress: 41,
    target: 60
  }
];
