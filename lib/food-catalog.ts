"use client";

import { createClient } from "@/lib/supabase/browser";
import type { Food } from "@/lib/types";

// The full food catalog (~1,100 rows) loaded once per session into memory.
// In-memory search needs zero network requests per keystroke — the previous
// flow paid client → Vercel → Supabase round trips on every search.
let catalog: Food[] | null = null;
let loading: Promise<Food[]> | null = null;

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
    vitaminB12: Number(row.vitamin_b12),
  };
}

export function isCatalogReady(): boolean {
  return catalog !== null;
}

/** Loads the entire catalog once (browser → Supabase directly, no Vercel hop). */
export function loadCatalog(): Promise<Food[]> {
  if (catalog) return Promise.resolve(catalog);
  if (loading) return loading;
  loading = (async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("foods").select("*").order("name").limit(5000);
    if (error || !data) {
      loading = null; // allow retry on next call
      return [];
    }
    catalog = data.map(mapFood);
    return catalog;
  })();
  return loading;
}

/** Keeps the in-memory catalog in sync when the user creates a custom food. */
export function addToCatalog(food: Food): void {
  if (catalog) catalog.unshift(food);
}

/** Instant in-memory search. Rank: name starts with term (0) →
 *  a word starts with term (1) → term appears anywhere (2). */
export function searchCatalog(query: string, limit = 30): Food[] {
  if (!catalog) return [];
  const term = query.trim().toLowerCase();
  if (!term) return [];

  const scored: Array<{ food: Food; score: number }> = [];
  for (const food of catalog) {
    const name = food.name.toLowerCase();
    let score: number;
    if (name.startsWith(term)) {
      score = 0;
    } else {
      const idx = name.indexOf(term);
      if (idx === -1) continue;
      const prev = name[idx - 1];
      score = prev === " " || prev === "(" || prev === "/" || prev === "-" ? 1 : 2;
    }
    scored.push({ food, score });
  }

  scored.sort(
    (a, b) =>
      a.score - b.score ||
      a.food.name.length - b.food.name.length ||
      a.food.name.localeCompare(b.food.name),
  );
  return scored.slice(0, limit).map((s) => s.food);
}
