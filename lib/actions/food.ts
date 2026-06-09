"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Food, MealType, Nutrients } from "@/lib/types";

const FOOD_PATHS = ["/app/dashboard", "/app/foods"] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function revalidateFoodPaths() {
  for (const path of FOOD_PATHS) revalidatePath(path);
}

type LoggableEntry = Nutrients & {
  foodId?: string;
  foodName: string;
  meal: MealType;
  serving: string;
  quantity: number;
};

export async function logFoodEntry(entry: LoggableEntry) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("food_entries").insert({
    user_id: user.id,
    food_id: entry.foodId && UUID_PATTERN.test(entry.foodId) ? entry.foodId : null,
    food_name: entry.foodName,
    meal: entry.meal,
    serving: entry.serving,
    quantity: entry.quantity,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    fiber: entry.fiber,
    iron: entry.iron,
    calcium: entry.calcium,
    magnesium: entry.magnesium,
    zinc: entry.zinc,
    potassium: entry.potassium,
    sodium: entry.sodium,
    vitamin_d: entry.vitaminD,
    vitamin_b12: entry.vitaminB12
  });

  if (error) return { error: error.message };

  revalidateFoodPaths();
  return { success: true };
}

export async function deleteFoodEntry(id: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("food_entries").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidateFoodPaths();
  return { success: true };
}

type CustomFoodInput = Nutrients & {
  name: string;
  serving: string;
};

export async function saveCustomFood(food: CustomFoodInput) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("foods")
    .insert({
      owner_id: user.id,
      name: food.name,
      serving: food.serving,
      source: "custom",
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      iron: food.iron,
      calcium: food.calcium,
      magnesium: food.magnesium,
      zinc: food.zinc,
      potassium: food.potassium,
      sodium: food.sodium,
      vitamin_d: food.vitaminD,
      vitamin_b12: food.vitaminB12
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from("saved_foods").insert({ user_id: user.id, food_id: data.id, favorite: true });

  revalidatePath("/app/foods");
  return { success: true, food: data as { id: string } };
}


/** Searches the local foods table (seed + custom) by name — covers the full 1 000+ Indian food database. */
export async function searchLocalFoods(query: string) {
  const term = query.trim();
  if (term.length < 2) return { foods: [] as Food[] };

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { foods: [] as Food[] };

  const { data } = await supabase
    .from("foods")
    .select("*")
    .or(`owner_id.eq.${user.id},owner_id.is.null`)
    .ilike("name", `%${term}%`)
    .order("name")
    .limit(30);

  return {
    foods: (data ?? []).map(
      (row): Food => ({
        id: row.id,
        name: row.name,
        brand: row.brand ?? undefined,
        serving: row.serving,
        source: row.source,
        cuisine: row.cuisine ?? undefined,
        favorite: false,
        calories: Number(row.calories),
        protein: Number(row.protein),
        carbs: Number(row.carbs),
        fat: Number(row.fat),
        fiber: Number(row.fiber),
        iron: Number(row.iron),
        calcium: Number(row.calcium),
        magnesium: Number(row.magnesium),
        zinc: Number(row.zinc),
        potassium: Number(row.potassium),
        sodium: Number(row.sodium),
        vitaminD: Number(row.vitamin_d),
        vitaminB12: Number(row.vitamin_b12)
      })
    )
  };
}
