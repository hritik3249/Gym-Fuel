"use client";

import { Copy, Heart, Pencil, Plus, Search, Star, Trash2, Utensils } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { foodToEntry, sumEntries } from "@/lib/nutrition";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import { formatNumber } from "@/lib/utils";
import type { Food, FoodEntry, MealType } from "@/lib/types";

const meals: Array<{ id: MealType; label: string }> = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snacks", label: "Snacks" }
];

const blankCustomFood: Omit<Food, "id" | "source"> = {
  name: "",
  serving: "1 serving",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  iron: 0,
  calcium: 0,
  magnesium: 0,
  zinc: 0,
  potassium: 0,
  sodium: 0,
  vitaminD: 0,
  vitaminB12: 0
};

export function FoodLogger({ foods, initialEntries }: { foods: Food[]; initialEntries: FoodEntry[] }) {
  useRealtimeRefresh(["foods", "saved_foods", "food_entries"]);

  const [query, setQuery] = useState("");
  const [selectedMeal, setSelectedMeal] = useState<MealType>("lunch");
  const [entries, setEntries] = useState(initialEntries);
  const [customFood, setCustomFood] = useState(blankCustomFood);
  const [savedFoods, setSavedFoods] = useState(foods);

  const filteredFoods = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return savedFoods;
    return savedFoods.filter((food) =>
      [food.name, food.brand, food.cuisine, food.source].filter(Boolean).join(" ").toLowerCase().includes(term)
    );
  }, [query, savedFoods]);

  function logFood(food: Food, quantity = 1) {
    setEntries((current) => [foodToEntry(food, selectedMeal, quantity), ...current]);
  }

  function duplicateEntry(entry: FoodEntry) {
    setEntries((current) => [{ ...entry, id: crypto.randomUUID(), loggedAt: new Date().toISOString() }, ...current]);
  }

  function saveCustomFood() {
    if (!customFood.name.trim()) return;
    const food: Food = {
      ...customFood,
      id: crypto.randomUUID(),
      source: "custom",
      favorite: true
    };
    setSavedFoods((current) => [food, ...current]);
    logFood(food);
    setCustomFood(blankCustomFood);
  }

  const mealGroups = meals.map((meal) => {
    const mealEntries = entries.filter((entry) => entry.meal === meal.id);
    return {
      ...meal,
      entries: mealEntries,
      totals: sumEntries(mealEntries)
    };
  });

  const recent = entries.slice(0, 4);
  const frequent = savedFoods.filter((food) => food.favorite).slice(0, 5);

  return (
    <div className="container grid gap-4 py-4 sm:py-6">
      <section className="surface-glass rounded-lg p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-sm font-semibold text-primary">Food log</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Log food in seconds</h2>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search paneer, dal, rice, chicken, barcode..."
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-4 gap-1 rounded-md border border-border bg-background p-1">
                {meals.map((meal) => (
                  <button
                    key={meal.id}
                    onClick={() => setSelectedMeal(meal.id)}
                    className={`rounded px-2 py-2 text-xs font-semibold ${
                      selectedMeal === meal.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {meal.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Card className="bg-background/75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Star className="size-4 text-amber-500" />
                One-tap logging
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {frequent.map((food) => (
                <Button key={food.id} variant="secondary" size="sm" onClick={() => logFood(food)}>
                  <Plus className="size-3.5" />
                  {food.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Smart Food Database</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {filteredFoods.map((food) => (
              <div
                key={food.id}
                className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{food.name}</p>
                    {food.favorite && <Heart className="size-4 fill-rose-500 text-rose-500" />}
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      {food.source.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {food.serving} · {food.calories} kcal · P {food.protein}g · C {food.carbs}g · F {food.fat}g · fiber{" "}
                    {food.fiber}g
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Iron {food.iron}mg · Calcium {food.calcium}mg · Magnesium {food.magnesium}mg · B12 {food.vitaminB12}mcg
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" aria-label={`Save ${food.name}`}>
                    <Heart className="size-4" />
                  </Button>
                  <Button onClick={() => logFood(food)}>
                    <Plus className="size-4" />
                    Log
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Food</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="food-name">Food name</Label>
                <Input
                  id="food-name"
                  value={customFood.name}
                  onChange={(event) => setCustomFood((food) => ({ ...food, name: event.target.value }))}
                  placeholder="Homemade Dal"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="serving">Serving size</Label>
                <Input
                  id="serving"
                  value={customFood.serving}
                  onChange={(event) => setCustomFood((food) => ({ ...food, serving: event.target.value }))}
                  placeholder="1 bowl, 180g"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["calories", "protein", "carbs", "fat", "fiber", "iron"] as const).map((field) => (
                  <div key={field} className="grid gap-2">
                    <Label htmlFor={field}>{field}</Label>
                    <Input
                      id={field}
                      inputMode="decimal"
                      value={customFood[field]}
                      onChange={(event) =>
                        setCustomFood((food) => ({ ...food, [field]: Number(event.target.value || 0) }))
                      }
                    />
                  </div>
                ))}
              </div>
              <Button onClick={saveCustomFood}>
                <Plus className="size-4" />
                Save and log
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Foods</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {recent.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => duplicateEntry(entry)}
                  className="flex items-center justify-between rounded-md border border-border bg-background p-3 text-left hover:bg-accent"
                >
                  <span>
                    <span className="block text-sm font-semibold">{entry.foodName}</span>
                    <span className="block text-xs text-muted-foreground">{entry.meal}</span>
                  </span>
                  <Copy className="size-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

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
                  No foods logged yet.
                </p>
              ) : (
                group.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-3 rounded-md border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">{entry.foodName}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.serving} · {entry.calories} kcal · P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" aria-label="Edit entry">
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => duplicateEntry(entry)} aria-label="Duplicate entry">
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))}
                        aria-label="Delete entry"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
