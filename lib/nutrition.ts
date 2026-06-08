import { NUTRIENT_KEYS } from "@/lib/types";
import type { Food, FoodEntry, Goal, Nutrients, WaterLog } from "@/lib/types";

export const defaultGoals: Goal = {
  calories: 2600,
  protein: 160,
  carbs: 250,
  fat: 80,
  waterMl: 7000,
  targetWeightKg: 85
};

export const nutrientTargets = {
  fiber: 30,
  iron: 18,
  calcium: 1000,
  magnesium: 420,
  zinc: 11,
  potassium: 3400,
  sodium: 2300,
  vitaminD: 15,
  vitaminB12: 2.4
} satisfies Partial<Record<keyof Nutrients, number>>;

export const nutrientUnits: Record<keyof typeof nutrientTargets, string> = {
  fiber: "g",
  iron: "mg",
  calcium: "mg",
  magnesium: "mg",
  zinc: "mg",
  potassium: "mg",
  sodium: "mg",
  vitaminD: "mcg",
  vitaminB12: "mcg"
};

export const emptyNutrients: Nutrients = NUTRIENT_KEYS.reduce(
  (acc, key) => ({ ...acc, [key]: 0 }),
  {} as Nutrients
);

export function sumEntries(entries: FoodEntry[]): Nutrients {
  return entries.reduce<Nutrients>(
    (total, entry) => {
      const next = { ...total };
      for (const key of NUTRIENT_KEYS) next[key] = total[key] + entry[key];
      return next;
    },
    { ...emptyNutrients }
  );
}

export function waterTotal(logs: WaterLog[]) {
  return logs.reduce((sum, log) => sum + log.amountMl, 0);
}

/** Number of decimal places to keep when scaling a nutrient value by a serving quantity. */
function decimalsFor(key: keyof Nutrients) {
  return key === "calories" || key === "potassium" || key === "sodium" ? 0 : 1;
}

export function foodToEntry(food: Food, meal: FoodEntry["meal"], quantity = 1): FoodEntry {
  const scaled = NUTRIENT_KEYS.reduce((acc, key) => {
    acc[key] = Number((food[key] * quantity).toFixed(decimalsFor(key)));
    return acc;
  }, {} as Nutrients);

  return {
    ...scaled,
    id: crypto.randomUUID(),
    foodId: food.id,
    foodName: food.name,
    meal,
    serving: food.serving,
    quantity,
    loggedAt: new Date().toISOString()
  };
}
