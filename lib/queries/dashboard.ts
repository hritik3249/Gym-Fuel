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

/** Resolves the current user and whether they've completed onboarding.
 *
 *  Why both checks?
 *  - The DB trigger auto-creates a `goals` row (calories=2600 default) for every
 *    new user, so goals-existence alone can't tell new from existing.
 *  - But existing users who set up their account before the onboarding wizard
 *    was added have age=NULL even though they're fully onboarded.
 *
 *  Solution: "new user" = age is unset AND goals are still at the trigger
 *  default (calories=2600). Anyone who has ever saved real goals is considered
 *  onboarded even if age is missing. */
async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: goals }] = await Promise.all([
    supabase.from("profiles").select("age").eq("id", user.id).maybeSingle(),
    supabase.from("goals").select("calories").eq("user_id", user.id).maybeSingle(),
  ]);

  const isNewUser = !profile?.age && (!goals || Number(goals.calories) === 2600);
  return { supabase, user, isNewUser };
}

export type FoodsPageData = { foods: Food[]; entries: FoodEntry[]; serverDate: string; isNewUser: boolean };

/** Lighter-weight fetch for the food logger page — skips goals, water, weight, streak, and trend data.
 *  Also returns serverDate (UTC YYYY-MM-DD) so the client can detect timezone mismatches. */
export async function getFoodsPageData(): Promise<FoodsPageData> {
  const session = await requireSession();
  const serverDate = todayISO();
  if (!session) return { foods: [], entries: [], serverDate, isNewUser: true };
  const { supabase, user, isNewUser } = session;
  if (isNewUser) return { foods: [], entries: [], serverDate, isNewUser };

  const [entriesRes, foodsRes] = await Promise.all([
    supabase
      .from("food_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", serverDate)           // use entry_date index — fast
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
    serverDate,
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

/** Pass `date` (YYYY-MM-DD) from the client so the snapshot uses the user's
 *  local calendar day instead of the server's UTC date. */
export async function getDashboardSnapshot(date?: string): Promise<DashboardSnapshot> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return emptySnapshot();

  // Prefer the client-supplied local date; fall back to UTC today on first load.
  const today    = date ?? todayISO();
  const dayStart = `${today}T00:00:00`;
  const dayEnd   = `${today}T23:59:59`;

  const [goalsRes, entriesRes, waterRes, weightRes, streakRes, profileRes] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", user.id).single(),
    supabase
      .from("food_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", today)
      .order("logged_at", { ascending: false }),
    supabase.from("water_logs").select("*").eq("user_id", user.id).gte("logged_at", dayStart).lte("logged_at", dayEnd),
    supabase.from("weight_logs").select("*").eq("user_id", user.id).order("logged_at", { ascending: false }).limit(RECENT_WEIGHT_LOGS),
    supabase.from("streaks").select("*").eq("user_id", user.id).single(),
    supabase.from("profiles").select("current_weight_kg, age, fitness_goal").eq("id", user.id).single()
  ]);

  // "New user" = age unset AND goals still at trigger default (calories=2600).
  // Existing users who customised goals before the onboarding wizard existed
  // have age=NULL but calories!=2600, so they're correctly treated as onboarded.
  const isNewUser = !profileRes.data?.age && (!goalsRes.data || Number(goalsRes.data.calories) === 2600);

  const entries = (entriesRes.data ?? []).map(mapEntry);
  const waterLogs = (waterRes.data ?? []).map(mapWaterLog);
  const weightLogs = (weightRes.data ?? []).map(mapWeightLog).reverse();

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
    foods: [],    // dashboard doesn't use the food catalogue — fetched only on /app/foods
    waterLogs,
    weightLogs,
    trends: buildTrendFrame(weightLogs),
    achievements: [],
    streak: streakRes.data?.daily_streak ?? 0,
    isNewUser
  };
}
