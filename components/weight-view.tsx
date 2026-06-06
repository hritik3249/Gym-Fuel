"use client";
import { Plus, Ruler, Scale, TrendingDown } from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import type { WeightLog } from "@/lib/types";

export function WeightView({ logs }: { logs: WeightLog[] }) {
  useRealtimeRefresh(["weight_logs"]);
  const [weightLogs, setWeightLogs] = useState(logs);
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [waist, setWaist] = useState("");
  const latest = weightLogs.at(-1);
  const weekAgo = weightLogs.at(-8);
  const monthStart = weightLogs.at(0);

  function addLog() {
    const parsed = Number(weight);
    if (!parsed) return;
    setWeightLogs((c) => [...c, { id: crypto.randomUUID(), loggedAt: new Date().toISOString(), weightKg: parsed, bodyFatPercent: bodyFat ? Number(bodyFat) : undefined, waistCm: waist ? Number(waist) : undefined }]);
    setWeight(""); setBodyFat(""); setWaist("");
  }

  return (
    <div className="container grid gap-4 py-4 sm:py-6">
      <section className="surface-glass rounded-lg p-4 sm:p-6">
        <p className="text-sm font-semibold text-primary">Body progress</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Scale trend over daily noise</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {([[`Current weight`, `${latest?.weightKg ?? 0}kg`, Scale], [`Weekly change`, `${weekAgo && latest ? (latest.weightKg - weekAgo.weightKg).toFixed(1) : "0.0"}kg`, TrendingDown], [`Monthly change`, `${monthStart && latest ? (latest.weightKg - monthStart.weightKg).toFixed(1) : "0.0"}kg`, Ruler]] as const).map(([label, value, Icon]) => (
            <Card key={label} className="bg-background/75">
              <CardContent className="flex items-center justify-between p-4">
                <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></div>
                <Icon className="size-7 text-primary" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader><CardTitle>Weight Trend</CardTitle></CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightLogs.map((item) => ({ date: item.loggedAt.slice(5, 10), weight: item.weightKg }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="weight" stroke="#14b8a6" fill="#14b8a633" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Log Measurement</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2"><Label htmlFor="weight">Weight kg</Label><Input id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" /></div>
            <div className="grid gap-2"><Label htmlFor="body-fat">Body fat %</Label><Input id="body-fat" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} inputMode="decimal" /></div>
            <div className="grid gap-2"><Label htmlFor="waist">Waist cm</Label><Input id="waist" value={waist} onChange={(e) => setWaist(e.target.value)} inputMode="decimal" /></div>
            <Button onClick={addLog}><Plus className="size-4" />Add log</Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
