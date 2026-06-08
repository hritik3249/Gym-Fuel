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

const OFF_SEARCH_URL = "https://world.openfoodfacts.org/api/v2/search";
const OFF_RESULT_LIMIT = 12;
const OFF_FETCH_TIMEOUT_MS = 6000;

type OffNutriments = Partial<Record<
  | "energy-kcal_100g"
  | "proteins_100g"
  | "carbohydrates_100g"
  | "fat_100g"
  | "fiber_100g"
  | "iron_100g"
  | "calcium_100g"
  | "magnesium_100g"
  | "zinc_100g"
  | "potassium_100g"
  | "sodium_100g"
  | "vitamin-d_100g"
  | "vitamin-b12_100g",
  number
>>;

type OffProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: OffNutriments;
};

/** Open Food Facts reports minerals/vitamins in grams; the app stores them in mg/mcg. */
function gramsToMilligrams(value?: number) {
  return value ? Math.round(value * 1000 * 100) / 100 : 0;
}

function gramsToMicrograms(value?: number) {
  return value ? Math.round(value * 1_000_000 * 100) / 100 : 0;
}

function roundNutrient(value?: number) {
  return value ? Math.round(value * 100) / 100 : 0;
}

function mapOffProduct(product: OffProduct): Food | null {
  const name = product.product_name?.trim();
  if (!name || !product.code) return null;

  const n = product.nutriments ?? {};
  return {
    id: `off-${product.code}`,
    name,
    brand: product.brands?.split(",")[0]?.trim() || undefined,
    serving: product.serving_size?.trim() || "100g",
    source: "open_food_facts",
    cuisine: "Indian",
    calories: roundNutrient(n["energy-kcal_100g"]),
    protein: roundNutrient(n["proteins_100g"]),
    carbs: roundNutrient(n["carbohydrates_100g"]),
    fat: roundNutrient(n["fat_100g"]),
    fiber: roundNutrient(n["fiber_100g"]),
    iron: gramsToMilligrams(n["iron_100g"]),
    calcium: gramsToMilligrams(n["calcium_100g"]),
    magnesium: gramsToMilligrams(n["magnesium_100g"]),
    zinc: gramsToMilligrams(n["zinc_100g"]),
    potassium: gramsToMilligrams(n["potassium_100g"]),
    sodium: gramsToMilligrams(n["sodium_100g"]),
    vitaminD: gramsToMicrograms(n["vitamin-d_100g"]),
    vitaminB12: gramsToMicrograms(n["vitamin-b12_100g"])
  };
}

/** Live-searches Open Food Facts' India catalog for packaged/branded foods. */
async function searchOpenFoodFacts(term: string): Promise<Food[]> {
  const url = new URL(OFF_SEARCH_URL);
  url.searchParams.set("search_terms", term);
  url.searchParams.set("countries_tags_en", "India");
  url.searchParams.set("page_size", String(OFF_RESULT_LIMIT));
  url.searchParams.set("fields", "code,product_name,brands,serving_size,nutriments");

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(OFF_FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "FuelTrack - nutrition tracker" }
    });
    if (!response.ok) return [];

    const data = (await response.json()) as { products?: OffProduct[] };
    return (data.products ?? []).map(mapOffProduct).filter((food): food is Food => food !== null && food.calories > 0);
  } catch {
    return [];
  }
}

const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const USDA_API_KEY = process.env.USDA_FDC_API_KEY ?? "DEMO_KEY";
const USDA_RESULT_LIMIT = 12;
const USDA_FETCH_TIMEOUT_MS = 6000;

/** Maps USDA FoodData Central nutrient IDs to the per-100g fields our Food type stores. */
const USDA_NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
  fiber: 1079,
  iron: 1089,
  calcium: 1087,
  magnesium: 1090,
  zinc: 1095,
  potassium: 1092,
  sodium: 1093,
  vitaminD: 1114,
  vitaminB12: 1178
} as const satisfies Partial<Record<keyof Nutrients, number>>;

type UsdaNutrient = { nutrientId: number; value: number };
type UsdaFood = { fdcId: number; description: string; foodCategory?: string; foodNutrients?: UsdaNutrient[] };

function mapUsdaFood(food: UsdaFood): Food | null {
  if (!food.description) return null;

  const nutrientById = new Map(food.foodNutrients?.map((n) => [n.nutrientId, n.value]) ?? []);
  const nutrients = Object.fromEntries(
    Object.entries(USDA_NUTRIENT_IDS).map(([key, id]) => [key, Math.round((nutrientById.get(id) ?? 0) * 100) / 100])
  ) as Nutrients;

  return {
    id: `usda-${food.fdcId}`,
    name: food.description,
    serving: "100g",
    source: "usda",
    cuisine: food.foodCategory ?? undefined,
    ...nutrients
  };
}

/** Live-searches USDA FoodData Central — a huge, government-maintained reference for raw ingredients and generic foods. */
async function searchUsda(term: string): Promise<Food[]> {
  const url = new URL(USDA_SEARCH_URL);
  url.searchParams.set("api_key", USDA_API_KEY);
  url.searchParams.set("query", term);
  url.searchParams.set("pageSize", String(USDA_RESULT_LIMIT));
  url.searchParams.set("dataType", "Foundation,SR Legacy");

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(USDA_FETCH_TIMEOUT_MS) });
    if (!response.ok) return [];

    const data = (await response.json()) as { foods?: UsdaFood[] };
    return (data.foods ?? []).map(mapUsdaFood).filter((food): food is Food => food !== null && food.calories > 0);
  } catch {
    return [];
  }
}

/** Live-searches USDA FoodData Central and Open Food Facts in parallel and merges the results. */
export async function searchExternalFoods(query: string) {
  const term = query.trim();
  if (term.length < 3) return { foods: [] as Food[] };

  const [usdaFoods, offFoods] = await Promise.all([searchUsda(term), searchOpenFoodFacts(term)]);
  return { foods: [...usdaFoods, ...offFoods] };
}
