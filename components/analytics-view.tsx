"use client";

import { Award, CalendarDays, ShieldCheck, TrendingDown } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/utils";
import type { Achievement, DailyTrend, Goal } from "@/lib/types";

const CHART_TOOLTIP_STYLE = { borderRadius: 8, border: "1px solid hsl(var(--border))" };
const ACHIEVEMENT_ICONS = [Award, ShieldCheck, TrendingDown, CalendarDays];

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeStats(trends: DailyTrend[], goals: Goal) {
  const loggedDays = trends.filter((t) => t.calories > 0);
  const avgCalories = Math.round(avg(loggedDays.map((t) => t.calories)));
  const avgProtein = Math.round(avg(loggedDays.map((t) => t.protein)));

  const goalDays = loggedDays.filter((t) => goals.calories > 0 && t.calories >= goals.calories * 0.9).length;
  const goalAchievement = loggedDays.length > 0 ? Math.round((goalDays / loggedDays.length) * 100) : 0;

  const proteinDays = loggedDays.filter((t) => goals.protein > 0 && t.protein >= goals.protein).length;

  let bestStreak = 0;
  let streak = 0;
  for (const t of trends) {
    if (t.calories > 0) { streak++; bestStreak = Math.max(bestStreak, streak); }
    else { streak = 0; }
  }

  const weightPoints = trends.filter((t) => t.weightKg != null);
  const avgWeight = weightPoints.length ? avg(weightPoints.map((t) => t.weightKg!)) : null;
  const weightChange =
    weightPoints.length >= 2
      ? (weightPoints.at(-1)!.weightKg! - weightPoints[0]!.weightKg!).toFixed(1)
      : null;

  return { avgCalories, avgProtein, goalAchievement, proteinDays, bestStreak, loggedDays: loggedDays.length, avgWeight, weightChange };
}

export function AnalyticsView({ trends, achievements, goals }: { trends: DailyTrend[]; achievements: Achievement[]; goals: Goal }) {
  const stats = computeStats(trends, goals);

  const summaryCards = [
    { label: "Average calories", value: stats.avgCalories > 0 ? `${stats.avgCalories}` : "—", detail: "kcal/day" },
    { label: "Goal achievement", value: stats.loggedDays > 0 ? `${stats.goalAchievement}%` : "—", detail: "last 14 days" },
    { label: "Protein target", value: stats.loggedDays > 0 ? `${stats.proteinDays}/14` : "—", detail: "days above goal" },
    { label: "Best streak", value: stats.bestStreak > 0 ? `${stats.bestStreak}` : "—", detail: "consecutive days" }
  ];

  const weeklyReportRows = [
    ["Average calories", stats.avgCalories > 0 ? `${stats.avgCalories} kcal` : "—"],
    ["Average protein", stats.avgProtein > 0 ? `${stats.avgProtein}g` : "—"],
    ["Average weight", stats.avgWeight != null ? `${formatNumber(stats.avgWeight, 1)}kg` : "—"],
    ["Weight change", stats.weightChange != null ? `${Number(stats.weightChange) > 0 ? "+" : ""}${stats.weightChange}kg` : "—"],
    ["Goal adherence", stats.loggedDays > 0 ? `${stats.goalAchievement}%` : "—"]
  ] as const;

  const hasData = trends.some((t) => t.calories > 0);

  return (
    <div className="container grid gap-4 py-4 sm:py-6">
      <section className="surface-glass rounded-lg p-4 sm:p-6">
        <p className="text-sm font-semibold text-primary">Analytics</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Nutrition trends that guide action</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map(({ label, value, detail }) => (
            <Card key={label} className="bg-background/75">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-3xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calories and Macros</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend />
                  <Line dataKey="calories" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line dataKey="protein" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                  <Line dataKey="carbs" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line dataKey="fat" stroke="#f43f5e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data yet — start logging meals to see trends.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Micronutrients</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area dataKey="iron" stroke="#ef4444" fill="#ef444433" strokeWidth={2} />
                  <Area dataKey="calcium" stroke="#06b6d4" fill="#06b6d433" strokeWidth={2} />
                  <Area dataKey="magnesium" stroke="#8b5cf6" fill="#8b5cf633" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data yet — log meals with micronutrient data.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <Card>
          <CardHeader>
            <CardTitle>14-Day Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {weeklyReportRows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-md bg-secondary/60 p-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Consistency</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends}>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, "Goal hit"]} />
                  <Bar dataKey="adherence" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Log meals to see your daily consistency.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {achievements.map((achievement, index) => {
          const Icon = ACHIEVEMENT_ICONS[index] ?? CalendarDays;
          const pct = Math.min(100, Math.round((achievement.progress / achievement.target) * 100));
          return (
            <Card key={achievement.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{achievement.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{achievement.description}</p>
                    <div className="mt-3">
                      <Progress value={pct} />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {achievement.progress} / {achievement.target}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
