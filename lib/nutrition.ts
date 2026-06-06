import type { Food, FoodEntry, Goal, Nutrients, WaterLog } from "@/lib/types";

export const defaultGoals: Goal = {
  calories: 2600, protein: 160, carbs: 250, fat: 80, waterMl: 7000, targetWeightKg: 85
};

export const nutrientTargets = {
  fiber: 30, iron: 18, calcium: 1000, magnesium: 420, zinc: 11,
  potassium: 3400, sodium: 2300, vitaminD: 15, vitaminB12: 2.4
};

export const nutrientUnits: Record<keyof typeof nutrientTargets, string> = {
  fiber: "g", iron: "mg", calcium: "mg", magnesium: "mg", zinc: "mg",
  potassium: "mg", sodium: "mg", vitaminD: "mcg", vitaminB12: "mcg"
};

export const emptyNutrients: Nutrients = {
  calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, iron: 0,
  calcium: 0, magnesium: 0, zinc: 0, potassium: 0, sodium: 0, vitaminD: 0, vitaminB12: 0
};

export function sumEntries(entries: FoodEntry[]): Nutrients {
  return entries.reduce((total, entry) => ({
    calories: total.calories + entry.calories, protein: total.protein + entry.protein,
    carbs: total.carbs + entry.carbs, fat: total.fat + entry.fat,
    fiber: total.fiber + entry.fiber, iron: total.iron + entry.iron,
    calcium: total.calcium + entry.calcium, magnesium: total.magnesium + entry.magnesium,
    zinc: total.zinc + entry.zinc, potassium: total.potassium + entry.potassium,
    sodium: total.sodium + entry.sodium, vitaminD: total.vitaminD + entry.vitaminD,
    vitaminB12: total.vitaminB12 + entry.vitaminB12
  }), emptyNutrients);
}

export function waterTotal(logs: WaterLog[]) { return logs.reduce((sum, log) => sum + log.amountMl, 0); }

export function foodToEntry(food: Food, meal: FoodEntry["meal"], quantity = 1): FoodEntry {
  return {
    id: crypto.randomUUID(), foodId: food.id, foodName: food.name, meal,
    serving: food.serving, quantity, loggedAt: new Date().toISOString(),
    calories: Math.round(food.calories * quantity),
    protein: Number((food.protein * quantity).toFixed(1)),
    carbs: Number((food.carbs * quantity).toFixed(1)),
    fat: Number((food.fat * quantity).toFixed(1)),
    fiber: Number((food.fiber * quantity).toFixed(1)),
    iron: Number((food.iron * quantity).toFixed(1)),
    calcium: Number((food.calcium * quantity).toFixed(1)),
    magnesium: Number((food.magnesium * quantity).toFixed(1)),
    zinc: Number((food.zinc * quantity).toFixed(1)),
    potassium: Number((food.potassium * quantity).toFixed(0)),
    sodium: Number((food.sodium * quantity).toFixed(0)),
    vitaminD: Number((food.vitaminD * quantity).toFixed(1)),
    vitaminB12: Number((food.vitaminB12 * quantity).toFixed(1))
  };
}
