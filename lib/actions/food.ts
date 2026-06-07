"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logFoodEntry(entry: {
  foodId?: string;
  foodName: string;
  meal: "breakfast" | "lunch" | "dinner" | "snacks";
  serving: string;
  quantity: number;
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
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("food_entries").insert({
    user_id: user.id,
    food_id: entry.foodId ?? null,
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

  revalidatePath("/app/dashboard");
  revalidatePath("/app/foods");
  return { success: true };
}

export async function deleteFoodEntry(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("food_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/app/dashboard");
  revalidatePath("/app/foods");
  return { success: true };
}

export async function saveCustomFood(food: {
  name: string;
  serving: string;
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
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase.from("foods").insert({
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
  }).select().single();

  if (error) return { error: error.message };

  // Also add to saved foods
  await supabase.from("saved_foods").insert({
    user_id: user.id,
    food_id: data.id,
    favorite: true
  });

  revalidatePath("/app/foods");
  return { success: true, food: data };
}
