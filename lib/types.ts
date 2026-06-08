export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export type FoodSource = "custom" | "usda" | "seed";

/** Per-100g-or-per-serving nutrient values shared by foods and logged entries. */
export type Nutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  iron: number;
  calcium: number;
  magnesium: number;
  zinc: number;
  potassium: number;
  sodium: number;
  vitaminD: number;
  vitaminB12: number;
};

/** Ordered list of every nutrient key — single source of truth for iteration, summing, and scaling. */
export const NUTRIENT_KEYS = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "iron",
  "calcium",
  "magnesium",
  "zinc",
  "potassium",
  "sodium",
  "vitaminD",
  "vitaminB12"
] as const satisfies readonly (keyof Nutrients)[];

export type Goal = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
  targetWeightKg: number;
};

export type Food = Nutrients & {
  id: string;
  name: string;
  brand?: string;
  serving: string;
  source: FoodSource;
  cuisine?: string;
  barcode?: string;
  favorite?: boolean;
};

export type FoodEntry = Nutrients & {
  id: string;
  foodId: string;
  foodName: string;
  meal: MealType;
  serving: string;
  quantity: number;
  loggedAt: string;
};

export type WeightLog = {
  id: string;
  loggedAt: string;
  weightKg: number;
  bodyFatPercent?: number;
  waistCm?: number;
};

export type WaterLog = {
  id: string;
  loggedAt: string;
  amountMl: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlockedAt?: string;
  progress: number;
  target: number;
};

export type DailyTrend = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  iron: number;
  calcium: number;
  magnesium: number;
  weightKg?: number;
  adherence: number;
};
