"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Food, FoodEntry, MealType, Nutrients } from "@/lib/types";

const FOOD_PATHS = ["/app/dashboard", "/app/foods"] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function revalidateFoodPaths() {
  for (const path of FOOD_PATHS) revalidatePath(path);
}

function mapFoodEntry(row: Record<string, unknown>): FoodEntry {
  return {
    id: row.id as string,
    foodId: (row.food_id as string | null) ?? "",
    foodName: row.food_name as string,
    meal: row.meal as FoodEntry["meal"],
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

type LoggableEntry = Nutrients & {
  foodId?: string;
  foodName: string;
  meal: MealType;
  serving: string;
  quantity: number;
  /** Client's local calendar date (YYYY-MM-DD). Fixes UTC midnight timezone issues. */
  entryDate: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateStreak(supabase: SupabaseClient<any, any, any>, userId: string, loggedDate: string) {
  // Count how many entries the user now has for this local date.
  // If exactly 1, this is the first log of the day → update streak.
  const { count } = await supabase
    .from("food_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("entry_date", loggedDate);

  if ((count ?? 0) !== 1) return; // Not the first entry today — streak already updated.

  const { data: row } = await supabase
    .from("streaks")
    .select("daily_streak, last_logged_date")
    .eq("user_id", userId)
    .single();

  // Compute yesterday's date (noon avoids DST edge-cases).
  const d = new Date(`${loggedDate}T12:00:00`);
  d.setDate(d.getDate() - 1);
  const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const lastDate = (row?.last_logged_date as string | null) ?? null;
  const prev = row?.daily_streak ?? 0;
  const newStreak = lastDate === yesterday ? prev + 1 : 1;

  await supabase
    .from("streaks")
    .update({ daily_streak: newStreak, last_logged_date: loggedDate })
    .eq("user_id", userId);
}

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
    entry_date: entry.entryDate,
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

  // Update streak after first log of the day.
  await updateStreak(supabase, user.id, entry.entryDate);

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

/** Fetch all food entries for a specific local calendar date. Handles both new rows
 *  (with entry_date set) and legacy rows (backfilled from logged_at UTC). */
export async function getFoodEntriesForDate(date: string): Promise<{ entries: FoodEntry[] }> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { entries: [] };

  const dayStart = `${date}T00:00:00`;
  const dayEnd   = `${date}T23:59:59`;

  // Primary: entry_date match (new rows with local date).
  // Fallback: timestamp range (legacy rows where entry_date was backfilled as UTC).
  const [{ data: primary }, { data: legacy }] = await Promise.all([
    supabase
      .from("food_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", date)
      .order("logged_at", { ascending: false }),
    supabase
      .from("food_entries")
      .select("*")
      .eq("user_id", user.id)
      .is("entry_date", null)
      .gte("logged_at", dayStart)
      .lte("logged_at", dayEnd)
      .order("logged_at", { ascending: false }),
  ]);

  const combined = [...(primary ?? []), ...(legacy ?? [])];
  combined.sort((a, b) => b.logged_at.localeCompare(a.logged_at));

  return { entries: combined.map(mapFoodEntry) };
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
