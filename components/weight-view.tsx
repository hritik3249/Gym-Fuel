"use client";

import { Loader2, Plus, Ruler, Scale, TrendingDown } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import { logWeight } from "@/lib/actions/weight";
import type { WeightLog } from "@/lib/types";

const WEEK_OFFSET = 8;
const MIN_WEIGHT_KG = 20;
const MAX_WEIGHT_KG = 500;
const CHART_TOOLTIP_STYLE = { borderRadius: 8, border: "1px solid hsl(var(--border))" };

function changeBetween(latest: WeightLog | undefined, baseline: WeightLog | undefined) {
  if (!latest || !baseline || latest.id === baseline.id) return null;
  return (latest.weightKg - baseline.weightKg).toFixed(1);
}

export function WeightView({ logs }: { logs: WeightLog[] }) {
  useRealtimeRefresh(["weight_logs"]);

  const [weightLogs, setWeightLogs] = useState(logs);
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [waist, setWaist] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const latest = weightLogs.at(-1);
  const weeklyChange = changeBetween(latest, weightLogs.at(-WEEK_OFFSET));
  const monthlyChange = changeBetween(latest, weightLogs.at(0));

  const summaryCards = [
    { label: "Current weight", value: latest ? `${latest.weightKg}kg` : "—", icon: Scale },
    { label: "Weekly change", value: weeklyChange ? `${weeklyChange}kg` : "—", icon: TrendingDown },
    { label: "Monthly change", value: monthlyChange ? `${monthlyChange}kg` : "—", icon: Ruler }
  ];

  function handleAddLog() {
    const parsed = Number(weight);
    if (!parsed || parsed < MIN_WEIGHT_KG || parsed > MAX_WEIGHT_KG) {
      setError(`Please enter a valid weight (${MIN_WEIGHT_KG}–${MAX_WEIGHT_KG} kg).`);
      return;
    }
    setError("");

    const newLog: WeightLog = {
      id: crypto.randomUUID(),
      loggedAt: new Date().toISOString(),
      weightKg: parsed,
      bodyFatPercent: bodyFat ? Number(bodyFat) : undefined,
      waistCm: waist ? Number(waist) : undefined
    };

    setWeightLogs((current) => [...current, newLog]);
    setWeight("");
    setBodyFat("");
    setWaist("");

    startTransition(async () => {
      const result = await logWeight({ weightKg: newLog.weightKg, bodyFatPercent: newLog.bodyFatPercent, waistCm: newLog.waistCm });
      if (result?.error) {
        toast.error("Couldn't log weight", { description: result.error });
        setError(result.error);
        setWeightLogs((current) => current.filter((log) => log.id !== newLog.id));
        return;
      }
      toast.success(`Logged ${newLog.weightKg}kg`);
    });
  }

  return (
    <div className="container grid gap-4 py-4 sm:py-6">
      <section className="surface-glass rounded-lg p-4 sm:p-6">
        <p className="text-sm font-semibold text-primary">Body progress</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Scale trend over daily noise</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {summaryCards.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="bg-background/75">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-1 text-3xl font-bold">{value}</p>
                </div>
                <Icon className="size-7 text-primary" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Weight Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            {weightLogs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No weight logs yet — add your first entry!</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightLogs.map((log) => ({ date: log.loggedAt.slice(5, 10), weight: log.weightKg }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="weight" stroke="#14b8a6" fill="#14b8a633" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Measurement</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" placeholder="e.g. 75.5" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body-fat">
                Body fat % <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="body-fat" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} inputMode="decimal" placeholder="e.g. 18" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="waist">
                Waist cm <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="waist" value={waist} onChange={(e) => setWaist(e.target.value)} inputMode="decimal" placeholder="e.g. 82" />
            </div>
            {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <Button onClick={handleAddLog} disabled={isPending || !weight}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add log
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
