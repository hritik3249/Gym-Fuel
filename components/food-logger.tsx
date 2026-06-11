"use client";

import { BookmarkPlus, ChevronLeft, ChevronRight, Copy, Heart, Loader2, Plus, Search, Star, Trash2, Utensils } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { foodToEntry, parseServingMeasure, sumEntries } from "@/lib/nutrition";
import type { ServingMeasure } from "@/lib/nutrition";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import { formatNumber } from "@/lib/utils";
import { logFoodEntry, deleteFoodEntry, saveCustomFood, searchLocalFoods, getFoodEntriesForDate } from "@/lib/actions/food";
import { saveMeal, deleteSavedMeal, logSavedMeal } from "@/lib/actions/meals";
import { notifyDataChanged } from "@/lib/tab-cache";
import type { Food, FoodEntry, MealType, Nutrients, SavedMeal, SavedMealItem } from "@/lib/types";

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns the device's local date as YYYY-MM-DD. */
function localDateISO(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Adds `delta` days to a YYYY-MM-DD string. Uses noon to avoid DST shifts. */
function offsetDate(date: string, delta: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDateLabel(date: string, today: string): string {
  if (date === today) return "Today";
  if (date === offsetDate(today, -1)) return "Yesterday";
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MEALS: Array<{ id: MealType; label: string }> = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch",     label: "Lunch"     },
  { id: "dinner",    label: "Dinner"    },
  { id: "snacks",    label: "Snacks"    },
];

const MACRO_FIELDS = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein",  label: "Protein",  unit: "g"    },
  { key: "carbs",    label: "Carbs",    unit: "g"    },
  { key: "fat",      label: "Fat",      unit: "g"    },
] as const satisfies readonly { key: keyof Nutrients; label: string; unit: string }[];

const EXTRA_FIELDS = [
  { key: "fiber",     label: "Fiber",     unit: "g"  },
  { key: "iron",      label: "Iron",      unit: "mg" },
  { key: "calcium",   label: "Calcium",   unit: "mg" },
  { key: "magnesium", label: "Magnesium", unit: "mg" },
  { key: "zinc",      label: "Zinc",      unit: "mg" },
  { key: "sodium",    label: "Sodium",    unit: "mg" },
] as const satisfies readonly { key: keyof Nutrients; label: string; unit: string }[];

const SERVING_UNITS = ["serving", "g", "ml", "piece", "bowl", "cup", "slice", "scoop", "tbsp"] as const;

const BLANK_CUSTOM_FOOD: Omit<Food, "id" | "source"> = {
  name: "", serving: "1 serving",
  calories: 0, protein: 0, carbs: 0, fat: 0,
  fiber: 0, iron: 0, calcium: 0, magnesium: 0,
  zinc: 0, potassium: 0, sodium: 0, vitaminD: 0, vitaminB12: 0,
};

const RECENT_ENTRIES_SHOWN   = 4;
const FREQUENT_FOODS_SHOWN   = 5;
const LOCAL_SEARCH_MIN_LENGTH   = 2;
const LOCAL_SEARCH_DEBOUNCE_MS  = 150;

export type FoodLoggerProps = {
  foods: Food[];
  initialEntries: FoodEntry[];
  savedMeals: SavedMeal[];
  /** The UTC date the server used to load initialEntries (YYYY-MM-DD).
   *  When this differs from the client's local date, we know the server
   *  returned the wrong day (IST midnight edge case) and must refetch. */
  serverDate: string;
};

export function FoodLogger({ foods, initialEntries, savedMeals, serverDate }: FoodLoggerProps) {
  useRealtimeRefresh(["foods", "saved_foods", "food_entries"]);

  // ── Date state ─────────────────────────────────────────────────────────────
  // todayDate is determined once on the CLIENT (local timezone), not server UTC.
  const [todayDate] = useState<string>(localDateISO);
  const [viewDate, setViewDate] = useState<string>(todayDate);
  const isToday = viewDate === todayDate;

  // ── Entry state ────────────────────────────────────────────────────────────
  // If the server's UTC date already matches the client's local date, the
  // initialEntries are correct — use them immediately with no extra fetch.
  // Only refetch when the client navigates to a different date OR when there
  // is a timezone mismatch (e.g. after midnight IST but before midnight UTC).
  const datesMismatch = serverDate !== todayDate;
  const [entries, setEntries]         = useState<FoodEntry[]>(datesMismatch ? [] : initialEntries);
  const [loadingDate, setLoadingDate] = useState(datesMismatch);

  useEffect(() => {
    // Normal case: serverDate === todayDate → initialEntries already correct,
    // no fetch needed unless the user navigates away from today.
    if (viewDate === todayDate && !datesMismatch) return;

    let cancelled = false;
    setLoadingDate(true);
    getFoodEntriesForDate(viewDate).then(({ entries: fetched }) => {
      if (!cancelled) {
        setEntries(fetched);
        setLoadingDate(false);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate]);

  // ── Search state ───────────────────────────────────────────────────────────
  const [query, setQuery]                   = useState("");
  const [selectedMeal, setSelectedMeal]     = useState<MealType>("lunch");
  const [customFood, setCustomFood]         = useState(BLANK_CUSTOM_FOOD);
  const [savedFoods, setSavedFoods]         = useState(foods);
  const [isPending, startTransition]        = useTransition();
  const [savingCustom, setSavingCustom]     = useState(false);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [localSearchFoods, setLocalSearchFoods] = useState<Food[]>([]);
  const [searchingLocal, setSearchingLocal] = useState(false);
  const [loggingFood, setLoggingFood]       = useState<{ food: Food; measure: ServingMeasure | null } | null>(null);
  const [amountInput, setAmountInput]       = useState("");
  const [logUnit, setLogUnit]               = useState<"g" | "ml" | "serving">("serving");
  const [browseOpen, setBrowseOpen]         = useState(false);
  const [servingAmount, setServingAmount]   = useState("1");
  const [servingUnit, setServingUnit]       = useState<string>("serving");
  const [extrasOpen, setExtrasOpen]         = useState(false);
  // Raw text for nutrient fields so partial decimals ("2.", "0.5") survive
  // typing — customFood keeps the parsed numbers for saving/estimates.
  const [nutrientInputs, setNutrientInputs] = useState<Record<string, string>>({});
  // Saved meals — one-tap logging of a whole meal
  const [meals, setMeals]                   = useState<SavedMeal[]>(savedMeals);
  const [saveMealTarget, setSaveMealTarget] = useState<{ meal: MealType; label: string } | null>(null);
  const [mealNameInput, setMealNameInput]   = useState("");
  const [savingMeal, setSavingMeal]         = useState(false);
  const [loggingMealId, setLoggingMealId]   = useState<string | null>(null);

  function handleNutrientInput(key: keyof Nutrients, raw: string) {
    if (!/^\d*\.?\d*$/.test(raw)) return; // digits and one dot only
    setNutrientInputs((current) => ({ ...current, [key]: raw }));
    updateCustomFoodField(key, Number(raw) || 0);
  }

  // No query → show pre-loaded recent foods. Typing → DB search (all 1 000+ foods).
  const filteredFoods = useMemo(() => {
    if (!query.trim()) return savedFoods;
    return localSearchFoods;
  }, [query, savedFoods, localSearchFoods]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < LOCAL_SEARCH_MIN_LENGTH) {
      setLocalSearchFoods([]);
      setSearchingLocal(false);
      return;
    }

    let cancelled = false;
    setSearchingLocal(true);

    const timer = setTimeout(async () => {
      const result = await searchLocalFoods(term);
      if (!cancelled) {
        setLocalSearchFoods(result.foods);
        setSearchingLocal(false);
      }
    }, LOCAL_SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function handleLogFood(food: Food, quantity = 1) {
    const entry = foodToEntry(food, selectedMeal, quantity);
    setEntries((current) => [entry, ...current]);
    startTransition(async () => {
      const result = await logFoodEntry({ ...entry, foodId: food.id, entryDate: viewDate });
      if (result?.error) {
        toast.error(`Couldn't log ${food.name}`, { description: result.error });
        setEntries((current) => current.filter((e) => e.id !== entry.id));
        return;
      }
      toast.success(`Logged ${food.name}`, { description: `${entry.calories} kcal · ${MEALS.find((m) => m.id === selectedMeal)?.label}` });
      notifyDataChanged(); // dashboard + analytics tabs refetch
    });
  }

  function startLogFood(food: Food) {
    const measure = parseServingMeasure(food.serving);
    setLoggingFood({ food, measure });
    setLogUnit(measure?.unit ?? "serving");
    setAmountInput(String(measure?.amount ?? 1));
  }

  /** Servings of the base food represented by the current amount + unit. */
  function logQuantity(): number {
    if (!loggingFood) return 0;
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    if (logUnit === "serving" || !loggingFood.measure) return amount;
    return amount / loggingFood.measure.amount;
  }

  function switchLogUnit(unit: "g" | "ml" | "serving") {
    if (!loggingFood) return;
    // Convert the current amount so the logged quantity stays the same
    const quantity = logQuantity();
    setLogUnit(unit);
    if (quantity <= 0) return;
    if (unit === "serving" || !loggingFood.measure) {
      setAmountInput(String(Math.round(quantity * 100) / 100));
    } else {
      setAmountInput(String(Math.round(quantity * loggingFood.measure.amount * 10) / 10));
    }
  }

  function confirmLogFood() {
    if (!loggingFood) return;
    const quantity = logQuantity();
    if (quantity <= 0) return;
    handleLogFood(loggingFood.food, quantity);
    setLoggingFood(null);
    setAmountInput("");
  }

  function cancelLogFood() {
    setLoggingFood(null);
    setAmountInput("");
  }

  function handleDuplicateEntry(entry: FoodEntry) {
    const duplicate: FoodEntry = { ...entry, id: crypto.randomUUID(), loggedAt: new Date().toISOString() };
    setEntries((current) => [duplicate, ...current]);
    startTransition(async () => {
      const result = await logFoodEntry({ ...duplicate, entryDate: viewDate });
      if (result?.error) {
        toast.error("Couldn't duplicate entry", { description: result.error });
        setEntries((current) => current.filter((e) => e.id !== duplicate.id));
        return;
      }
      toast.success(`Duplicated ${duplicate.foodName}`);
      notifyDataChanged();
    });
  }

  async function handleDeleteEntry(id: string) {
    const entry = entries.find((e) => e.id === id);
    setDeletingId(id);
    setEntries((current) => current.filter((entry) => entry.id !== id));
    const result = await deleteFoodEntry(id);
    if (result?.error) {
      toast.error("Couldn't delete entry", { description: result.error });
      if (entry) setEntries((current) => [entry, ...current]);
    } else if (entry) {
      toast.success(`Removed ${entry.foodName}`);
      notifyDataChanged();
    }
    setDeletingId(null);
  }

  async function handleSaveCustomFood(logAfter: boolean) {
    if (!customFood.name.trim()) return;
    setSavingCustom(true);
    const serving = `${servingAmount || "1"} ${servingUnit}`;
    const toSave = { ...customFood, serving };
    const result = await saveCustomFood(toSave);
    if (result?.error) {
      toast.error("Couldn't save custom food", { description: result.error });
      setSavingCustom(false);
      return;
    }
    const food: Food = { ...toSave, id: result.food?.id ?? crypto.randomUUID(), source: "custom", favorite: true };
    setSavedFoods((current) => [food, ...current]);
    if (logAfter) handleLogFood(food);
    toast.success(`Saved ${food.name}`, {
      description: logAfter ? "Logged and added to your database." : "Added to your database — find it anytime via search.",
    });
    setCustomFood(BLANK_CUSTOM_FOOD);
    setNutrientInputs({});
    setServingAmount("1");
    setServingUnit("serving");
    setExtrasOpen(false);
    setSavingCustom(false);
  }

  // Calories estimated from macros: 4 kcal/g protein & carbs, 9 kcal/g fat
  const estimatedKcal = Math.round(customFood.protein * 4 + customFood.carbs * 4 + customFood.fat * 9);
  const showKcalHint = estimatedKcal > 0 && Math.abs(estimatedKcal - customFood.calories) > Math.max(20, estimatedKcal * 0.15);

  function updateCustomFoodField<K extends keyof typeof customFood>(field: K, value: (typeof customFood)[K]) {
    setCustomFood((current) => ({ ...current, [field]: value }));
  }

  // ── Saved meals ─────────────────────────────────────────────────────────────

  function entryToMealItem(entry: FoodEntry): SavedMealItem {
    const { foodId, foodName, serving, quantity, calories, protein, carbs, fat, fiber, iron, calcium, magnesium, zinc, potassium, sodium, vitaminD, vitaminB12 } = entry;
    return { foodId, foodName, serving, quantity, calories, protein, carbs, fat, fiber, iron, calcium, magnesium, zinc, potassium, sodium, vitaminD, vitaminB12 };
  }

  async function handleSaveMeal() {
    if (!saveMealTarget || !mealNameInput.trim()) return;
    const items = entries.filter((e) => e.meal === saveMealTarget.meal).map(entryToMealItem);
    setSavingMeal(true);
    const result = await saveMeal(mealNameInput, saveMealTarget.meal, items);
    setSavingMeal(false);
    if (result?.error || !result?.meal) {
      toast.error("Couldn't save meal", { description: result?.error });
      return;
    }
    setMeals((current) => [result.meal!, ...current]);
    toast.success(`Saved "${result.meal.name}"`, { description: "Log it any day with one tap." });
    setSaveMealTarget(null);
    setMealNameInput("");
  }

  async function handleLogSavedMeal(meal: SavedMeal) {
    setLoggingMealId(meal.id);
    const result = await logSavedMeal(meal.id, viewDate);
    if (result?.error) {
      toast.error(`Couldn't log ${meal.name}`, { description: result.error });
      setLoggingMealId(null);
      return;
    }
    // Refetch the day's entries so ids/timestamps come from the database
    const { entries: fetched } = await getFoodEntriesForDate(viewDate);
    setEntries(fetched);
    setLoggingMealId(null);
    const kcal = Math.round(meal.items.reduce((sum, item) => sum + item.calories, 0));
    toast.success(`Logged ${meal.name}`, { description: `${meal.items.length} items · ${kcal} kcal` });
    notifyDataChanged();
  }

  async function handleDeleteSavedMeal(meal: SavedMeal) {
    setMeals((current) => current.filter((m) => m.id !== meal.id));
    const result = await deleteSavedMeal(meal.id);
    if (result?.error) {
      toast.error("Couldn't delete saved meal", { description: result.error });
      setMeals((current) => [meal, ...current]);
      return;
    }
    toast.success(`Deleted "${meal.name}"`);
  }

  const mealGroups = MEALS.map((meal) => {
    const mealEntries = entries.filter((entry) => entry.meal === meal.id);
    return { ...meal, entries: mealEntries, totals: sumEntries(mealEntries) };
  });

  const recentEntries   = entries.slice(0, RECENT_ENTRIES_SHOWN);
  const frequentFoods   = savedFoods.filter((food) => food.favorite).slice(0, FREQUENT_FOODS_SHOWN);
  const dayTotals       = sumEntries(entries);
  const isSearching     = query.trim().length > 0;

  const renderFoodRow = (food: Food) => (
    <div key={food.id} className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{food.name}</p>
          {food.favorite && <Heart className="size-4 fill-rose-500 text-rose-500" />}
          <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{food.source.replaceAll("_", " ")}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {food.serving} · {food.calories} kcal · P {food.protein}g · C {food.carbs}g · F {food.fat}g
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Iron {food.iron}mg · Calcium {food.calcium}mg · Mg {food.magnesium}mg · B12 {food.vitaminB12}mcg
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => startLogFood(food)} disabled={isPending}>
          <Plus className="size-4" />
          Log
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container grid gap-4 py-4 sm:py-6">
      <section className="surface-glass rounded-lg p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div>
            {/* ── Date navigator ─────────────────────────────────────── */}
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() => setViewDate((d) => offsetDate(d, -1))}
                className="flex size-8 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-accent"
                aria-label="Previous day"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-[130px] text-center text-sm font-semibold">
                {formatDateLabel(viewDate, todayDate)}
                {!isToday && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({viewDate})
                  </span>
                )}
              </span>
              <button
                onClick={() => setViewDate((d) => offsetDate(d, 1))}
                disabled={isToday}
                className="flex size-8 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next day"
              >
                <ChevronRight className="size-4" />
              </button>
              {!isToday && (
                <button
                  onClick={() => setViewDate(todayDate)}
                  className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  Back to today
                </button>
              )}
            </div>

            <p className="text-sm font-semibold text-primary">Food log</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">
              {isToday ? "Log food in seconds" : "Past entries"}
            </h2>

            {isToday && (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search paneer, dal, rice, chicken..." className="pl-9" />
                </div>
                <div className="grid grid-cols-4 gap-1 rounded-md border border-border bg-background p-1">
                  {MEALS.map((meal) => (
                    <button
                      key={meal.id}
                      onClick={() => setSelectedMeal(meal.id)}
                      className={`rounded px-2 py-2 text-xs font-semibold transition-colors ${
                        selectedMeal === meal.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {meal.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isToday && frequentFoods.length > 0 && (
            <Card className="bg-background/75">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Star className="size-4 text-amber-500" />
                  One-tap logging
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {frequentFoods.map((food) => (
                  <Button key={food.id} variant="secondary" size="sm" onClick={() => handleLogFood(food)} disabled={isPending}>
                    <Plus className="size-3.5" />
                    {food.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Loading overlay for date switches */}
      {loadingDate && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading entries…
        </div>
      )}

      {!loadingDate && (
        <>
          {/* Saved meals — log a whole meal in one tap */}
          {isToday && meals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BookmarkPlus className="size-4 text-primary" />
                  Saved Meals
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {meals.map((meal) => {
                  const kcal = Math.round(meal.items.reduce((sum, item) => sum + item.calories, 0));
                  return (
                    <div key={meal.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{meal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {MEALS.find((m) => m.id === meal.meal)?.label} · {meal.items.length} item{meal.items.length === 1 ? "" : "s"} · {kcal} kcal
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" onClick={() => handleLogSavedMeal(meal)} disabled={loggingMealId !== null}>
                          {loggingMealId === meal.id ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                          Log
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteSavedMeal(meal)} aria-label={`Delete ${meal.name}`}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Search results — appear right under the search bar while typing */}
          {isToday && isSearching && (
            <Card>
              <CardHeader>
                <CardTitle>Search results</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {searchingLocal ? (
                  <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Searching…
                  </div>
                ) : filteredFoods.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No foods found for &quot;{query}&quot;
                  </p>
                ) : (
                  filteredFoods.map(renderFoodRow)
                )}
              </CardContent>
            </Card>
          )}

          {/* Day total summary (shown on past dates + today) */}
          {entries.length > 0 && (
            <div className="grid grid-cols-4 gap-2 rounded-lg border border-border bg-background p-3 text-center text-sm">
              {[
                { label: "Calories", value: `${formatNumber(dayTotals.calories)} kcal` },
                { label: "Protein",  value: `${formatNumber(dayTotals.protein, 1)}g`  },
                { label: "Carbs",    value: `${formatNumber(dayTotals.carbs, 1)}g`    },
                { label: "Fat",      value: `${formatNumber(dayTotals.fat, 1)}g`      },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-bold">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Meal groups */}
          <section className="grid gap-4">
            {mealGroups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Utensils className="size-4 text-primary" />
                      {group.label}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(group.totals.calories)} kcal · P {formatNumber(group.totals.protein, 1)}g
                      </span>
                      {isToday && group.entries.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSaveMealTarget({ meal: group.id, label: group.label });
                            setMealNameInput(`My ${group.label.toLowerCase()}`);
                          }}
                        >
                          <BookmarkPlus className="size-4" />
                          Save meal
                        </Button>
                      )}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {group.entries.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                      {isToday ? "No foods logged yet." : "Nothing logged."}
                    </p>
                  ) : (
                    group.entries.map((entry) => (
                      <div key={entry.id} className="flex flex-col gap-3 rounded-md border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">{entry.foodName}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.serving} · {entry.calories} kcal · P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {isToday && (
                            <Button variant="outline" size="icon" onClick={() => handleDuplicateEntry(entry)} disabled={isPending} aria-label="Duplicate entry">
                              <Copy className="size-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="icon" onClick={() => handleDeleteEntry(entry.id)} disabled={deletingId === entry.id} aria-label="Delete entry">
                            {deletingId === entry.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Today: browse database (collapsed by default) + custom food + recent */}
          {isToday && (
            <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Food Database</span>
                    <Button variant="outline" size="sm" onClick={() => setBrowseOpen((open) => !open)}>
                      {browseOpen ? "Hide" : `Browse ${savedFoods.length} foods`}
                      <ChevronRight className={`size-4 transition-transform ${browseOpen ? "rotate-90" : ""}`} />
                    </Button>
                  </CardTitle>
                </CardHeader>
                {browseOpen && (
                  <CardContent className="grid gap-3">
                    {savedFoods.length === 0 ? (
                      <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No foods yet — create a custom food to get started.
                      </p>
                    ) : (
                      savedFoods.map(renderFoodRow)
                    )}
                  </CardContent>
                )}
              </Card>

              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Your Own Food</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Can&apos;t find something? Add it once — it&apos;s saved to your database forever and shows up in search.
                    </p>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {/* Step 1: name */}
                    <div className="grid gap-2">
                      <Label htmlFor="food-name">
                        <span className="mr-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">1</span>
                        What is it called?
                      </Label>
                      <Input id="food-name" value={customFood.name} onChange={(e) => updateCustomFoodField("name", e.target.value)} placeholder="e.g. Mom's Paneer Curry" />
                    </div>

                    {/* Step 2: serving size */}
                    <div className="grid gap-2">
                      <Label htmlFor="serving-amount">
                        <span className="mr-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">2</span>
                        How much is one serving?
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="serving-amount"
                          inputMode="decimal"
                          className="w-24"
                          value={servingAmount}
                          onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setServingAmount(e.target.value)}
                          placeholder="1"
                        />
                        <select
                          aria-label="Serving unit"
                          value={servingUnit}
                          onChange={(e) => setServingUnit(e.target.value)}
                          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          {SERVING_UNITS.map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>
                      <p className="text-xs text-muted-foreground">e.g. 1 bowl, 100 g, 2 piece — the nutrition below is for this amount.</p>
                    </div>

                    {/* Step 3: macros */}
                    <div className="grid gap-2">
                      <Label>
                        <span className="mr-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">3</span>
                        Nutrition per serving
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {MACRO_FIELDS.map(({ key, label, unit }) => (
                          <div key={key} className="grid gap-1.5">
                            <Label htmlFor={key} className="text-xs text-muted-foreground">{label} ({unit})</Label>
                            <Input
                              id={key}
                              inputMode="decimal"
                              value={nutrientInputs[key] ?? ""}
                              placeholder="0"
                              onChange={(e) => handleNutrientInput(key, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                      {showKcalHint && (
                        <button
                          type="button"
                          onClick={() => {
                            updateCustomFoodField("calories", estimatedKcal);
                            setNutrientInputs((current) => ({ ...current, calories: String(estimatedKcal) }));
                          }}
                          className="justify-self-start rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                        >
                          Your macros add up to ≈{estimatedKcal} kcal — tap to use
                        </button>
                      )}
                    </div>

                    {/* Optional micronutrients */}
                    <button
                      type="button"
                      onClick={() => setExtrasOpen((open) => !open)}
                      className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ChevronRight className={`size-4 transition-transform ${extrasOpen ? "rotate-90" : ""}`} />
                      {extrasOpen ? "Hide extra nutrients" : "Add extra nutrients (optional)"}
                    </button>
                    {extrasOpen && (
                      <div className="grid grid-cols-2 gap-3">
                        {EXTRA_FIELDS.map(({ key, label, unit }) => (
                          <div key={key} className="grid gap-1.5">
                            <Label htmlFor={key} className="text-xs text-muted-foreground">{label} ({unit})</Label>
                            <Input
                              id={key}
                              inputMode="decimal"
                              value={nutrientInputs[key] ?? ""}
                              placeholder="0"
                              onChange={(e) => handleNutrientInput(key, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => handleSaveCustomFood(true)} disabled={savingCustom || !customFood.name.trim()}>
                        {savingCustom ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                        Save &amp; log now
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => handleSaveCustomFood(false)} disabled={savingCustom || !customFood.name.trim()}>
                        Save for later
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {recentEntries.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Foods</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                      {recentEntries.map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => handleDuplicateEntry(entry)}
                          disabled={isPending}
                          className="flex items-center justify-between rounded-md border border-border bg-background p-3 text-left hover:bg-accent disabled:opacity-50"
                        >
                          <span>
                            <span className="block text-sm font-semibold">{entry.foodName}</span>
                            <span className="block text-xs text-muted-foreground">
                              {entry.meal} · {entry.calories} kcal
                            </span>
                          </span>
                          <Copy className="size-4 text-muted-foreground" />
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* Save meal modal */}
      {saveMealTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setSaveMealTarget(null)}>
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Save {saveMealTarget.label.toLowerCase()} as a meal</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-sm text-muted-foreground">
                Saves everything currently logged under {saveMealTarget.label} ({entries.filter((e) => e.meal === saveMealTarget.meal).length} items) so you can log it again with one tap.
              </p>
              <div className="grid gap-2">
                <Label htmlFor="meal-name">Meal name</Label>
                <Input
                  id="meal-name"
                  autoFocus
                  value={mealNameInput}
                  onChange={(e) => setMealNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveMeal()}
                  placeholder="e.g. My usual breakfast"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSaveMealTarget(null)}>Cancel</Button>
                <Button className="flex-1" onClick={handleSaveMeal} disabled={savingMeal || !mealNameInput.trim()}>
                  {savingMeal ? <Loader2 className="size-4 animate-spin" /> : <BookmarkPlus className="size-4" />}
                  Save meal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Log amount modal */}
      {loggingFood && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={cancelLogFood}>
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>How much {loggingFood.food.name}?</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-sm text-muted-foreground">
                One serving is {loggingFood.food.serving}
                {loggingFood.measure ? ` (${loggingFood.measure.amount}${loggingFood.measure.unit})` : ""}. Enter how much you had.
              </p>

              {/* Amount + unit */}
              <div className="grid gap-2">
                <Label htmlFor="log-amount">Amount</Label>
                <div className="flex gap-2">
                  <Input
                    id="log-amount"
                    type="number"
                    min="0"
                    step="any"
                    autoFocus
                    className="flex-1"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmLogFood()}
                  />
                  {loggingFood.measure ? (
                    <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-background p-1">
                      {([loggingFood.measure.unit, "serving"] as const).map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => switchLogUnit(unit)}
                          className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                            logUnit === unit ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {unit === "serving" ? "servings" : unit}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="flex items-center rounded-md border border-border bg-background px-3 text-sm text-muted-foreground">
                      servings
                    </span>
                  )}
                </div>
              </div>

              {/* Live macro preview — recalculates as the amount changes */}
              {(() => {
                const quantity = logQuantity();
                const preview = [
                  { label: "Calories", value: formatNumber(loggingFood.food.calories * quantity),    unit: "kcal" },
                  { label: "Protein",  value: formatNumber(loggingFood.food.protein * quantity, 1),  unit: "g"    },
                  { label: "Carbs",    value: formatNumber(loggingFood.food.carbs * quantity, 1),    unit: "g"    },
                  { label: "Fat",      value: formatNumber(loggingFood.food.fat * quantity, 1),      unit: "g"    },
                ];
                return (
                  <div className="grid grid-cols-4 gap-2 rounded-lg border border-border bg-background p-3 text-center">
                    {preview.map(({ label, value, unit }) => (
                      <div key={label}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-bold">
                          {quantity > 0 ? value : "–"}
                          <span className="ml-0.5 text-xs font-normal text-muted-foreground">{unit}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={cancelLogFood}>Cancel</Button>
                <Button className="flex-1" onClick={confirmLogFood} disabled={isPending || logQuantity() <= 0}>
                  <Plus className="size-4" />
                  Log it
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
