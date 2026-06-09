import { subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { defaultGoals, emptyNutrients, sumEntries } from "@/lib/nutrition";
import { todayISO } from "@/lib/utils";
import type { Achievement, DailyTrend, Food, FoodEntry, Goal, WaterLog, WeightLog } from "@/lib/types";

const TREND_DAYS = 14;
const RECENT_WEIGHT_LOGS = 30;
const RECENT_FOODS = 50;

export type DashboardSnapshot = {
  goals: Goal;
  totals: ReturnType<typeof sumEntries>;
  water: number;
  currentWeight: number;
  entries: FoodEntry[];
  foods: Food[];
  waterLogs: WaterLog[];
  weightLogs: WeightLog[];
  trends: DailyTrend[];
  achievements: Achievement[];
  streak: number;
  isNewUser: boolean;
};

function emptySnapshot(): DashboardSnapshot {
  return {
    goals: defaultGoals,
    totals: emptyNutrients,
    water: 0,
    currentWeight: 0,
    entries: [],
    foods: [],
    waterLogs: [],
    weightLogs: [],
    trends: [],
    achievements: [],
    streak: 0,
    isNewUser: true
  };
}

function safeNum(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function mapGoals(row: Record<string, unknown> | null): Goal {
  if (!row) return defaultGoals;
  return {
    calories:       safeNum(row.calories,        defaultGoals.calories),
    protein:        safeNum(row.protein,          defaultGoals.protein),
    carbs:          safeNum(row.carbs,            defaultGoals.carbs),
    fat:            safeNum(row.fat,              defaultGoals.fat),
    waterMl:        safeNum(row.water_ml,         defaultGoals.waterMl),
    targetWeightKg: safeNum(row.target_weight_kg, defaultGoals.targetWeightKg),
  };
}

function mapEntry(row: Record<string, unknown>): FoodEntry {
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
    vitaminB12: Number(row.vitamin_b12)
  };
}

function mapWaterLog(row: Record<string, unknown>): WaterLog {
  return { id: row.id as string, amountMl: row.amount_ml as number, loggedAt: row.logged_at as string };
}

function mapWeightLog(row: Record<string, unknown>): WeightLog {
  return {
    id: row.id as string,
    weightKg: Number(row.weight_kg),
    bodyFatPercent: row.body_fat_percent != null ? Number(row.body_fat_percent) : undefined,
    waistCm: row.waist_cm != null ? Number(row.waist_cm) : undefined,
    loggedAt: row.logged_at as string
  };
}

function mapFood(row: Record<string, unknown>): Food {
  return {
    id: row.id as string,
    name: row.name as string,
    brand: (row.brand as string | null) ?? undefined,
    serving: row.serving as string,
    source: row.source as Food["source"],
    cuisine: (row.cuisine as string | null) ?? undefined,
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
  };
}

/** Builds a placeholder 14-day trend frame, filling in weight where a log lands on that date. */
function buildTrendFrame(weightLogs: WeightLog[]): DailyTrend[] {
  return Array.from({ length: TREND_DAYS }, (_, i) => {
    const date = subDays(new Date(), TREND_DAYS - 1 - i).toISOString().slice(5, 10);
    const matchingWeight = weightLogs.find((log) => log.loggedAt.slice(5, 10) === date);
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
}

/** Resolves the current user and whether they've completed onboarding, via a single lightweight query.
 *  We check profiles.age because the DB trigger auto-creates a goals row for every new user
 *  (including Google OAuth), so we can't rely on goals existence. A null age means the user
 *  hasn't completed the onboarding wizard yet. */
async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("age").eq("id", user.id).maybeSingle();
  return { supabase, user, isNewUser: !profile?.age };
}

export type FoodsPageData = { foods: Food[]; entries: FoodEntry[]; isNewUser: boolean };

/** Lighter-weight fetch for the food logger page — skips goals, water, weight, streak, and trend data. */
export async function getFoodsPageData(): Promise<FoodsPageData> {
  const session = await requireSession();
  if (!session) return { foods: [], entries: [], isNewUser: true };
  const { supabase, user, isNewUser } = session;
  if (isNewUser) return { foods: [], entries: [], isNewUser };

  const today = todayISO();
  const dayStart = `${today}T00:00:00`;
  const dayEnd = `${today}T23:59:59`;

  const [entriesRes, foodsRes] = await Promise.all([
    supabase
      .from("food_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", dayStart)
      .lte("logged_at", dayEnd)
      .order("logged_at", { ascending: false }),
    supabase
      .from("foods")
      .select("*")
      .or(`owner_id.eq.${user.id},owner_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(RECENT_FOODS)
  ]);

  return {
    foods: (foodsRes.data ?? []).map(mapFood),
    entries: (entriesRes.data ?? []).map(mapEntry),
    isNewUser
  };
}

export type WeightPageData = { weightLogs: WeightLog[]; isNewUser: boolean };

/** Lighter-weight fetch for the weight page — only the recent weight log history. */
export async function getWeightPageData(): Promise<WeightPageData> {
  const session = await requireSession();
  if (!session) return { weightLogs: [], isNewUser: true };
  const { supabase, user, isNewUser } = session;
  if (isNewUser) return { weightLogs: [], isNewUser };

  const { data } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(RECENT_WEIGHT_LOGS);

  return { weightLogs: (data ?? []).map(mapWeightLog).reverse(), isNewUser };
}

export type AnalyticsPageData = { trends: DailyTrend[]; achievements: Achievement[]; goals: Goal; isNewUser: boolean };

/** Fetches real 14-day food entries, weight logs, and goals to populate the analytics page. */
export async function getAnalyticsPageData(): Promise<AnalyticsPageData> {
  const session = await requireSession();
  if (!session) return { trends: [], achievements: [], goals: defaultGoals, isNewUser: true };
  const { supabase, user, isNewUser } = session;
  if (isNewUser) return { trends: [], achievements: [], goals: defaultGoals, isNewUser };

  const trendStart = subDays(new Date(), TREND_DAYS - 1).toISOString().slice(0, 10);

  const [weightRes, entriesRes, goalsRes] = await Promise.all([
    supabase.from("weight_logs").select("*").eq("user_id", user.id).order("logged_at", { ascending: true }).limit(RECENT_WEIGHT_LOGS),
    supabase.from("food_entries").select("*").eq("user_id", user.id).gte("logged_at", `${trendStart}T00:00:00`).order("logged_at"),
    supabase.from("goals").select("*").eq("user_id", user.id).single()
  ]);

  const weightLogs = (weightRes.data ?? []).map(mapWeightLog);
  const entries = (entriesRes.data ?? []).map(mapEntry);
  const goals = mapGoals(goalsRes.data);

  // Build 14-day frame then fill in real nutrition data from entries
  const trends = buildTrendFrame(weightLogs);
  for (const entry of entries) {
    const date = entry.loggedAt.slice(5, 10);
    const trend = trends.find((t) => t.date === date);
    if (trend) {
      trend.calories += entry.calories;
      trend.protein += entry.protein;
      trend.carbs += entry.carbs;
      trend.fat += entry.fat;
      trend.iron += entry.iron;
      trend.calcium += entry.calcium;
      trend.magnesium += entry.magnesium;
    }
  }

  // Adherence = % of calorie goal hit that day (capped at 100)
  for (const trend of trends) {
    trend.adherence = goals.calories > 0 ? Math.min(100, Math.round((trend.calories / goals.calories) * 100)) : 0;
  }

  // Build real achievements from trend data
  const loggedDays = trends.filter((t) => t.calories > 0).length;
  const proteinDays = trends.filter((t) => goals.protein > 0 && t.protein >= goals.protein).length;
  let bestStreak = 0;
  let currentStreak = 0;
  for (const trend of trends) {
    if (trend.calories > 0) { currentStreak++; bestStreak = Math.max(bestStreak, currentStreak); }
    else { currentStreak = 0; }
  }

  const achievements: Achievement[] = [
    { id: "logging", title: "Consistent Logger", description: "Days tracked in the last 14 days", progress: loggedDays, target: 14 },
    { id: "protein", title: "Protein Target", description: `Days hitting protein goal (${goals.protein}g)`, progress: proteinDays, target: 14 },
    { id: "streak", title: "Best Streak", description: "Consecutive days logged in this period", progress: bestStreak, target: 7 }
  ];

  return { trends, achievements, goals, isNewUser };
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return emptySnapshot();

  const today = todayISO();
  const dayStart = `${today}T00:00:00`;
  const dayEnd = `${today}T23:59:59`;

  const [goalsRes, entriesRes, waterRes, weightRes, foodsRes, streakRes, profileRes] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", user.id).single(),
    supabase
      .from("food_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", dayStart)
      .lte("logged_at", dayEnd)
      .order("logged_at", { ascending: false }),
    supabase.from("water_logs").select("*").eq("user_id", user.id).gte("logged_at", dayStart).lte("logged_at", dayEnd),
    supabase.from("weight_logs").select("*").eq("user_id", user.id).order("logged_at", { ascending: false }).limit(RECENT_WEIGHT_LOGS),
    supabase
      .from("foods")
      .select("*")
      .or(`owner_id.eq.${user.id},owner_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(RECENT_FOODS),
    supabase.from("streaks").select("*").eq("user_id", user.id).single(),
    supabase.from("profiles").select("current_weight_kg, age, fitness_goal").eq("id", user.id).single()
  ]);

  // A user is "new" until they've completed onboarding wizard (which sets their age).
  // We can't check goals presence because the DB trigger auto-creates a goals row
  // for every new user (including Google OAuth) with default values.
  const isNewUser = !profileRes.data?.age;

  const entries = (entriesRes.data ?? []).map(mapEntry);
  const waterLogs = (waterRes.data ?? []).map(mapWaterLog);
  const weightLogs = (weightRes.data ?? []).map(mapWeightLog).reverse();
  const foods = (foodsRes.data ?? []).map(mapFood);

  const totals = sumEntries(entries);
  const water = waterLogs.reduce((sum, log) => sum + log.amountMl, 0);

  const currentWeight =
    weightLogs.at(-1)?.weightKg ?? (profileRes.data?.current_weight_kg ? Number(profileRes.data.current_weight_kg) : 0);

  return {
    goals: mapGoals(goalsRes.data),
    totals,
    water,
    currentWeight,
    entries,
    foods,
    waterLogs,
    weightLogs,
    trends: buildTrendFrame(weightLogs),
    achievements: [],
    streak: streakRes.data?.daily_streak ?? 0,
    isNewUser
  };
}
