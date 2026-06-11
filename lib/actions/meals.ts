"use server";

import { createClient } from "@/lib/supabase/server";
import type { FoodEntry, MealType, SavedMeal, SavedMealItem } from "@/lib/types";
import { updateStreak } from "@/lib/streak";

function mapSavedMeal(row: Record<string, unknown>): SavedMeal {
  return {
    id: row.id as string,
    name: row.name as string,
    meal: row.meal as MealType,
    items: (row.items as SavedMealItem[]) ?? [],
    createdAt: row.created_at as string,
  };
}

export async function getSavedMeals(): Promise<{ meals: SavedMeal[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { meals: [] };

  const { data } = await supabase
    .from("saved_meals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { meals: (data ?? []).map(mapSavedMeal) };
}

export async function saveMeal(name: string, meal: MealType, items: SavedMealItem[]) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Meal needs a name" };
  if (items.length === 0) return { error: "Meal has no items" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("saved_meals")
    .insert({ user_id: user.id, name: trimmed, meal, items })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, meal: mapSavedMeal(data) };
}

export async function deleteSavedMeal(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("saved_meals").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

/** Logs every item of a saved meal as food entries in one bulk insert. */
export async function logSavedMeal(mealId: string, entryDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: row, error: fetchError } = await supabase
    .from("saved_meals")
    .select("*")
    .eq("id", mealId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !row) return { error: "Saved meal not found" };
  const saved = mapSavedMeal(row);
  if (saved.items.length === 0) return { error: "Meal has no items" };

  const { data: inserted, error } = await supabase
    .from("food_entries")
    .insert(
      saved.items.map((item) => ({
        user_id: user.id,
        food_id: null, // snapshot rows — original food may no longer exist
        food_name: item.foodName,
        meal: saved.meal,
        serving: item.serving,
        quantity: item.quantity,
        entry_date: entryDate,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
        iron: item.iron,
        calcium: item.calcium,
        magnesium: item.magnesium,
        zinc: item.zinc,
        potassium: item.potassium,
        sodium: item.sodium,
        vitamin_d: item.vitaminD,
        vitamin_b12: item.vitaminB12,
      })),
    )
    .select();

  if (error) return { error: error.message };

  await updateStreak(supabase, user.id, entryDate);

  // Return the inserted rows so the client can swap its optimistic entries
  // for the real ones (correct ids/timestamps) without a second round trip.
  return { success: true, entries: (inserted ?? []).map(mapInsertedEntry) };
}

function mapInsertedEntry(row: Record<string, unknown>): FoodEntry {
  return {
    id: row.id as string,
    foodId: (row.food_id as string | null) ?? "",
    foodName: row.food_name as string,
    meal: row.meal as MealType,
    serving: row.serving as string,
    quantity: Number(row.quantity),
    loggedAt: row.logged_at as string,
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
    vitaminB12: Number(row.vitamin_b12),
  };
}
