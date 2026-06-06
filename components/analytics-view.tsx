"use client";
import { Award, CalendarDays, ShieldCheck, TrendingDown } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Achievement, DailyTrend } from "@/lib/types";

export function AnalyticsView({ trends, achievements }: { trends: DailyTrend[]; achievements: Achievement[]; }) {
  return (
    <div className="container grid gap-4 py-4 sm:py-6">
      <section className="surface-glass rounded-lg p-4 sm:p-6">
        <p className="text-sm font-semibold text-primary">Analytics</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Nutrition trends that guide action</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[["Average calories","2,441","kcal/day"],["Goal achievement","84%","last 14 days"],["Protein consistency","11/14","days above 140g"],["Best streak","12","days"]].map(([label, value, detail]) => (
            <Card key={label} className="bg-background/75">
              <CardContent className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p><p className="text-sm text-muted-foreground">{detail}</p></CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Calories and Macros</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Line dataKey="calories" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line dataKey="protein" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                <Line dataKey="carbs" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line dataKey="fat" stroke="#f43f5e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Micronutrients</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                <Area dataKey="iron" stroke="#ef4444" fill="#ef444433" strokeWidth={2} />
                <Area dataKey="calcium" stroke="#06b6d4" fill="#06b6d433" strokeWidth={2} />
                <Area dataKey="magnesium" stroke="#8b5cf6" fill="#8b5cf633" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <Card>
          <CardHeader><CardTitle>Weekly Report</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {[["Average calories","2,441 kcal"],["Average protein","147g"],["Average weight","89.9kg"],["Weight change","-0.6kg"],["Goal adherence","84%"]].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-md bg-secondary/60 p-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Consistency</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="adherence" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {achievements.map((achievement, index) => {
          const Icon = [Award, ShieldCheck, TrendingDown][index] ?? CalendarDays;
          return (
            <Card key={achievement.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{achievement.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{achievement.description}</p>
                    <div className="mt-3">
                      <Progress value={(achievement.progress / achievement.target) * 100} />
                      <p className="mt-1 text-xs text-muted-foreground">{achievement.progress}/{achievement.target}</p>
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
