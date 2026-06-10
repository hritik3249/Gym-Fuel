"use client";

import { ChevronLeft, ChevronRight, Copy, Heart, Loader2, Plus, Search, Star, Trash2, Utensils } from "lucide-react";
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
import { notifyDataChanged } from "@/lib/tab-cache";
import type { Food, FoodEntry, MealType, Nutrients } from "@/lib/types";

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

const CUSTOM_FOOD_NUMBER_FIELDS = ["calories", "protein", "carbs", "fat", "fiber", "iron"] as const satisfies readonly (keyof Nutrients)[];

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

function matchesSearch(food: Food, term: string) {
  if (!term) return true;
  return [food.name, food.brand, food.cuisine, food.source].filter(Boolean).join(" ").toLowerCase().includes(term);
}

export type FoodLoggerProps = {
  foods: Food[];
  initialEntries: FoodEntry[];
  /** The UTC date the server used to load initialEntries (YYYY-MM-DD).
   *  When this differs from the client's local date, we know the server
   *  returned the wrong day (IST midnight edge case) and must refetch. */
  serverDate: string;
};

export function FoodLogger({ foods, initialEntries, serverDate }: FoodLoggerProps) {
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
  const [browseOpen, setBrowseOpen]         = useState(false);

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
    setAmountInput(String(measure?.amount ?? 1));
  }

  function confirmLogFood() {
    if (!loggingFood) return;
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const quantity = loggingFood.measure ? amount / loggingFood.measure.amount : amount;
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

  async function handleSaveCustomFood() {
    if (!customFood.name.trim()) return;
    setSavingCustom(true);
    const result = await saveCustomFood(customFood);
    if (result?.error) {
      toast.error("Couldn't save custom food", { description: result.error });
      setSavingCustom(false);
      return;
    }
    const food: Food = { ...customFood, id: result.food?.id ?? crypto.randomUUID(), source: "custom", favorite: true };
    setSavedFoods((current) => [food, ...current]);
    handleLogFood(food);
    toast.success(`Saved ${food.name} to your foods`);
    setCustomFood(BLANK_CUSTOM_FOOD);
    setSavingCustom(false);
  }

  function updateCustomFoodField<K extends keyof typeof customFood>(field: K, value: (typeof customFood)[K]) {
    setCustomFood((current) => ({ ...current, [field]: value }));
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
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(group.totals.calories)} kcal · P {formatNumber(group.totals.protein, 1)}g
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
                    <CardTitle>Create Custom Food</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="food-name">Food name</Label>
                      <Input id="food-name" value={customFood.name} onChange={(e) => updateCustomFoodField("name", e.target.value)} placeholder="e.g. Homemade Dal" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="serving">Serving size</Label>
                      <Input id="serving" value={customFood.serving} onChange={(e) => updateCustomFoodField("serving", e.target.value)} placeholder="1 bowl, 180g" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {CUSTOM_FOOD_NUMBER_FIELDS.map((field) => (
                        <div key={field} className="grid gap-2">
                          <Label htmlFor={field}>{field}</Label>
                          <Input
                            id={field}
                            inputMode="decimal"
                            value={customFood[field] || ""}
                            placeholder="0"
                            onChange={(e) => updateCustomFoodField(field, Number(e.target.value || 0))}
                          />
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleSaveCustomFood} disabled={savingCustom || !customFood.name.trim()}>
                      {savingCustom ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                      Save and log
                    </Button>
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

      {/* Log amount modal */}
      {loggingFood && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={cancelLogFood}>
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>How much {loggingFood.food.name}?</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {loggingFood.measure ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Base serving is {loggingFood.measure.amount}{loggingFood.measure.unit} ({loggingFood.food.serving}). Enter the actual amount you had.
                  </p>
                  <div className="grid gap-2">
                    <Label htmlFor="log-amount">Amount ({loggingFood.measure.unit})</Label>
                    <Input id="log-amount" type="number" min="0" step="any" autoFocus value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && confirmLogFood()} />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    One serving is {loggingFood.food.serving}. How many servings did you have?
                  </p>
                  <div className="grid gap-2">
                    <Label htmlFor="log-amount">Servings</Label>
                    <Input id="log-amount" type="number" min="0" step="any" autoFocus value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && confirmLogFood()} />
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={cancelLogFood}>Cancel</Button>
                <Button className="flex-1" onClick={confirmLogFood} disabled={isPending}>
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
