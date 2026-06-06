"use client";
import { Activity, Award, Flame, GlassWater, Scale, Utensils } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ProgressRing } from "@/components/progress-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { defaultGoals, nutrientTargets, nutrientUnits } from "@/lib/nutrition";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import { clampProgress, formatNumber } from "@/lib/utils";
import type { DailyTrend, FoodEntry, Goal, Nutrients, WeightLog } from "@/lib/types";

const metricTones = { calories: "emerald", protein: "sky", carbs: "amber", fat: "rose" } as const;

export function Dashboard({ goals, totals, water, weight, entries, trends, weights, streak }: { goals: Goal; totals: Nutrients; water: number; weight: number; entries: FoodEntry[]; trends: DailyTrend[]; weights: WeightLog[]; streak: number; }) {
  useRealtimeRefresh(["food_entries", "water_logs", "weight_logs", "goals"]);

  const macros = [
    { key: "calories", label: "Calories", value: totals.calories, goal: goals.calories, unit: "kcal" },
    { key: "protein", label: "Protein", value: totals.protein, goal: goals.protein, unit: "g" },
    { key: "carbs", label: "Carbs", value: totals.carbs, goal: goals.carbs, unit: "g" },
    { key: "fat", label: "Fat", value: totals.fat, goal: goals.fat, unit: "g" }
  ] as const;

  const mealTotals = ["breakfast", "lunch", "dinner", "snacks"].map((meal) => ({
    meal, calories: entries.filter((e) => e.meal === meal).reduce((sum, e) => sum + e.calories, 0)
  }));

  return (
    <div className="container grid gap-4 py-4 sm:py-6">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="surface-glass rounded-lg p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Today</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Fuel plan is 73% complete</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Calories are on pace, protein is strong, and hydration needs one more focused push.</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-2">
              <Flame className="size-5 text-orange-500" />
              <div><p className="text-xs text-muted-foreground">Streak</p><p className="font-bold">{streak} days</p></div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {macros.map((macro) => <ProgressRing key={macro.key} label={macro.label} value={macro.value} goal={macro.goal} unit={macro.unit} tone={metricTones[macro.key]} />)}
          </div>
        </div>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><GlassWater className="size-4 text-sky-500" />Water</CardTitle></CardHeader>
          <CardContent>
            <ProgressRing label="Hydration" value={water / 1000} goal={goals.waterMl / 1000} unit="L" tone="sky" />
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[250, 500, 750, 1000].map((amount) => (
                <button key={amount} className="rounded-md border border-border bg-background py-2 text-xs font-semibold hover:bg-accent">{amount === 1000 ? "1L" : `${amount}ml`}</button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="size-4 text-primary" />Nutrition Trend</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="calories" stroke="#10b981" fill="#10b98133" strokeWidth={2} />
                <Area type="monotone" dataKey="protein" stroke="#0ea5e9" fill="#0ea5e933" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Utensils className="size-4 text-amber-500" />Meal Totals</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mealTotals}>
                <XAxis dataKey="meal" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="calories" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="size-4 text-violet-500" />Body Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div><p className="text-sm text-muted-foreground">Current weight</p><p className="text-4xl font-bold">{formatNumber(weight, 1)}kg</p></div>
              <div className="text-right"><p className="text-sm text-muted-foreground">Target</p><p className="text-xl font-bold">{defaultGoals.targetWeightKg}kg</p></div>
            </div>
            <div className="mt-5 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weights.map((item) => ({ date: item.loggedAt.slice(5, 10), weight: item.weightKg }))}>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                  <Area type="monotone" dataKey="weight" stroke="#8b5cf6" fill="#8b5cf633" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Micronutrient Coverage</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(nutrientTargets) as Array<keyof typeof nutrientTargets>).map((key) => {
              const consumed = totals[key];
              const target = nutrientTargets[key];
              const progress = clampProgress(consumed, target);
              return (
                <div key={key} className="rounded-lg border border-border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold">{key.replace(/([A-Z])/g, " $1")}</span>
                    <span className="text-muted-foreground">{formatNumber(consumed, 1)} / {target}{nutrientUnits[key]}</span>
                  </div>
                  <Progress value={progress} indicatorClassName={progress < 60 ? "bg-rose-500" : progress < 90 ? "bg-amber-500" : "bg-emerald-500"} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[["Weekly adherence", "84%", "Goal days hit this week"], ["Avg protein", "147g", "7-day rolling average"], ["Monthly change", "-1.8kg", "Weight trend direction"]].map(([title, value, detail]) => (
          <Card key={title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-1 text-3xl font-bold">{value}</p></div>
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
