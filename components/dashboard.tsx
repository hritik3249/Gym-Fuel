"use client";

import { useState, useTransition } from "react";
import { Activity, Award, Flame, GlassWater, Loader2, Scale, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ProgressRing } from "@/components/progress-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { nutrientTargets, nutrientUnits } from "@/lib/nutrition";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import { clampProgress, formatNumber } from "@/lib/utils";
import { logWater } from "@/lib/actions/water";
import type { DailyTrend, FoodEntry, Goal, MealType, Nutrients, WeightLog } from "@/lib/types";

const MACRO_TONES = { calories: "emerald", protein: "sky", carbs: "amber", fat: "rose" } as const;
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snacks"];
const WATER_QUICK_ADD_ML = [250, 500, 750, 1000];
const CHART_TOOLTIP_STYLE = { borderRadius: 8, border: "1px solid hsl(var(--border))" };

function progressMessage(percentComplete: number) {
  if (percentComplete === 0) return "Log your first meal to get started.";
  if (percentComplete < 50) return "Good start — keep logging your meals.";
  if (percentComplete < 90) return "You're on track. Keep it up!";
  return "Almost at your goal for today!";
}

function progressTone(percent: number) {
  if (percent < 60) return "bg-rose-500";
  if (percent < 90) return "bg-amber-500";
  return "bg-emerald-500";
}

function formatWaterAmount(amountMl: number) {
  return amountMl === 1000 ? "1L" : `${amountMl}ml`;
}

export type DashboardProps = {
  goals: Goal;
  totals: Nutrients;
  water: number;
  weight: number;
  entries: FoodEntry[];
  trends: DailyTrend[];
  weights: WeightLog[];
  streak: number;
};

export function Dashboard({ goals, totals, water, weight, entries, trends, weights, streak }: DashboardProps) {
  useRealtimeRefresh(["food_entries", "water_logs", "weight_logs", "goals"]);

  const [waterTotal, setWaterTotal] = useState(water);
  const [isPending, startTransition] = useTransition();

  const macros = [
    { key: "calories" as const, label: "Calories", value: totals.calories, goal: goals.calories, unit: "kcal" },
    { key: "protein" as const, label: "Protein", value: totals.protein, goal: goals.protein, unit: "g" },
    { key: "carbs" as const, label: "Carbs", value: totals.carbs, goal: goals.carbs, unit: "g" },
    { key: "fat" as const, label: "Fat", value: totals.fat, goal: goals.fat, unit: "g" }
  ];

  const mealTotals = MEAL_TYPES.map((meal) => ({
    meal,
    calories: entries.filter((entry) => entry.meal === meal).reduce((sum, entry) => sum + entry.calories, 0)
  }));

  function handleAddWater(amount: number) {
    setWaterTotal((prev) => prev + amount);
    startTransition(async () => {
      const result = await logWater(amount);
      if (result?.error) {
        toast.error("Couldn't log water", { description: result.error });
        setWaterTotal((prev) => prev - amount);
        return;
      }
      toast.success(`Logged ${formatWaterAmount(amount)} of water`);
    });
  }

  const percentComplete = goals.calories > 0 ? Math.round((totals.calories / goals.calories) * 100) : 0;
  const hasTrendData = trends.some((trend) => trend.calories > 0);

  return (
    <div className="container grid gap-4 py-4 sm:py-6">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr] animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="surface-glass rounded-lg p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Today</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Fuel plan is {percentComplete}% complete</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{progressMessage(percentComplete)}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-2">
              <Flame className="size-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Streak</p>
                <p className="font-bold">{streak} days</p>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {macros.map((macro) => (
              <ProgressRing key={macro.key} label={macro.label} value={macro.value} goal={macro.goal} unit={macro.unit} tone={MACRO_TONES[macro.key]} />
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GlassWater className="size-4 text-sky-500" />
              Water
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressRing label="Hydration" value={waterTotal / 1000} goal={goals.waterMl / 1000} unit="L" tone="sky" />
            <div className="mt-4 grid grid-cols-4 gap-2">
              {WATER_QUICK_ADD_ML.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleAddWater(amount)}
                  disabled={isPending}
                  className="flex items-center justify-center rounded-md border border-border bg-background py-2 text-xs font-semibold transition-all duration-150 hover:bg-accent hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="size-3 animate-spin" /> : formatWaterAmount(amount)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Nutrition Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {hasTrendData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="calories" stroke="#10b981" fill="#10b98133" strokeWidth={2} />
                  <Area type="monotone" dataKey="protein" stroke="#0ea5e9" fill="#0ea5e933" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No trend data yet — start logging meals!
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="size-4 text-amber-500" />
              Meal Totals
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mealTotals}>
                <XAxis dataKey="meal" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="calories" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="size-4 text-violet-500" />
              Body Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current weight</p>
                <p className="text-4xl font-bold">{weight > 0 ? `${formatNumber(weight, 1)}kg` : "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="text-xl font-bold">{goals.targetWeightKg}kg</p>
              </div>
            </div>
            <div className="mt-5 h-44">
              {weights.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No weight logs yet — add one in Weight tab.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weights.map((log) => ({ date: log.loggedAt.slice(5, 10), weight: log.weightKg }))}>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="weight" stroke="#8b5cf6" fill="#8b5cf633" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Micronutrient Coverage</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(nutrientTargets) as Array<keyof typeof nutrientTargets>).map((key) => {
              const consumed = totals[key];
              const target = nutrientTargets[key];
              const progress = clampProgress(consumed, target);
              return (
                <div key={key} className="rounded-lg border border-border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold">{key.replace(/([A-Z])/g, " $1")}</span>
                    <span className="text-muted-foreground">
                      {formatNumber(consumed, 1)} / {target}
                      {nutrientUnits[key]}
                    </span>
                  </div>
                  <Progress value={progress} indicatorClassName={progressTone(progress)} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-both">
        {[
          ["Weekly adherence", "—", "Log 7 days to see"],
          ["Avg protein", totals.protein > 0 ? `${formatNumber(totals.protein, 0)}g` : "—", "Today's protein"],
          ["Weight change", "—", "Log weight to track"]
        ].map(([title, value, detail]) => (
          <Card key={title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <p className="mt-1 text-3xl font-bold">{value}</p>
                </div>
                <Award className="size-8 text-primary" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
