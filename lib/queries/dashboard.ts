import { createClient } from "@/lib/supabase/server";
import { defaultGoals, emptyNutrients, sumEntries } from "@/lib/nutrition";
import type { DailyTrend, FoodEntry, Goal, WeightLog, WaterLog, Achievement } from "@/lib/types";
import { subDays } from "date-fns";

export async function getDashboardSnapshot() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in — return empty state
  if (!user) {
    return {
      goals: defaultGoals,
      totals: emptyNutrients,
      water: 0,
      currentWeight: 0,
      entries: [] as FoodEntry[],
      foods: [],
      waterLogs: [] as WaterLog[],
      weightLogs: [] as WeightLog[],
      trends: [] as DailyTrend[],
      achievements: [] as Achievement[],
      streak: 0,
      isNewUser: true
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

  // Run all queries in parallel
  const [
    goalsRes,
    entriesRes,
    waterRes,
    weightRes,
    foodsRes,
    streakRes
  ] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", user.id).single(),
    supabase.from("food_entries").select("*").eq("user_id", user.id).gte("logged_at", `${today}T00:00:00`).lte("logged_at", `${today}T23:59:59`).order("logged_at", { ascending: false }),
    supabase.from("water_logs").select("*").eq("user_id", user.id).gte("logged_at", `${today}T00:00:00`).lte("logged_at", `${today}T23:59:59`),
    supabase.from("weight_logs").select("*").eq("user_id", user.id).order("logged_at", { ascending: false }).limit(30),
    supabase.from("foods").select("*").or(`owner_id.eq.${user.id},owner_id.is.null`).order("created_at", { ascending: false }).limit(50),
    supabase.from("streaks").select("*").eq("user_id", user.id).single()
  ]);

  // Check if new user (no goals set beyond defaults)
  const isNewUser = !goalsRes.data || goalsRes.error;

  // Map goals
  const goals: Goal = goalsRes.data ? {
    calories: goalsRes.data.calories,
    protein: Number(goalsRes.data.protein),
    carbs: Number(goalsRes.data.carbs),
    fat: Number(goalsRes.data.fat),
    waterMl: goalsRes.data.water_ml,
    targetWeightKg: Number(goalsRes.data.target_weight_kg)
  } : defaultGoals;

  // Map food entries
  const entries: FoodEntry[] = (entriesRes.data ?? []).map((e) => ({
    id: e.id,
    foodId: e.food_id ?? "",
    foodName: e.food_name,
    meal: e.meal,
    serving: e.serving,
    quantity: Number(e.quantity),
    loggedAt: e.logged_at,
    calories: Number(e.calories),
    protein: Number(e.protein),
    carbs: Number(e.carbs),
    fat: Number(e.fat),
    fiber: Number(e.fiber),
    iron: Number(e.iron),
    calcium: Number(e.calcium),
    magnesium: Number(e.magnesium),
    zinc: Number(e.zinc),
    potassium: Number(e.potassium),
    sodium: Number(e.sodium),
    vitaminD: Number(e.vitamin_d),
    vitaminB12: Number(e.vitamin_b12)
  }));

  // Map water logs
  const waterLogs: WaterLog[] = (waterRes.data ?? []).map((w) => ({
    id: w.id,
    amountMl: w.amount_ml,
    loggedAt: w.logged_at
  }));

  // Map weight logs
  const weightLogs: WeightLog[] = (weightRes.data ?? []).map((w) => ({
    id: w.id,
    weightKg: Number(w.weight_kg),
    bodyFatPercent: w.body_fat_percent ? Number(w.body_fat_percent) : undefined,
    waistCm: w.waist_cm ? Number(w.waist_cm) : undefined,
    loggedAt: w.logged_at
  })).reverse();

  // Map foods
  const foods = (foodsRes.data ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    brand: f.brand ?? undefined,
    serving: f.serving,
    source: f.source as "custom" | "usda" | "open_food_facts" | "seed",
    cuisine: f.cuisine ?? undefined,
    favorite: false,
    calories: Number(f.calories),
    protein: Number(f.protein),
    carbs: Number(f.carbs),
    fat: Number(f.fat),
    fiber: Number(f.fiber),
    iron: Number(f.iron),
    calcium: Number(f.calcium),
    magnesium: Number(f.magnesium),
    zinc: Number(f.zinc),
    potassium: Number(f.potassium),
    sodium: Number(f.sodium),
    vitaminD: Number(f.vitamin_d),
    vitaminB12: Number(f.vitamin_b12)
  }));

  // Build 14-day trends from weight logs
  const trends: DailyTrend[] = Array.from({ length: 14 }).map((_, i) => {
    const date = subDays(new Date(), 13 - i).toISOString().slice(5, 10);
    const matchingWeight = weightLogs.find(w => w.loggedAt.slice(5, 10) === date);
    return {
      date,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      iron: 0,
      calcium: 0,
      magnesium: 0,
      weightKg: matchingWeight?.weightKg,
      adherence: 0
    };
  });

  const totals = sumEntries(entries);
  const water = waterLogs.reduce((sum, w) => sum + w.amountMl, 0);
  const currentWeight = weightLogs.at(-1)?.weightKg ?? 0;
  const streak = streakRes.data?.daily_streak ?? 0;

  return {
    goals,
    totals,
    water,
    currentWeight,
    entries,
    foods,
    waterLogs,
    weightLogs,
    trends,
    achievements: [] as Achievement[],
    streak,
    isNewUser
  };
}
