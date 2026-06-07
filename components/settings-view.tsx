"use client";

import { Bell, Database, Loader2, LogOut, Save, Target, User } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nutrientTargets } from "@/lib/nutrition";
import { saveGoals } from "@/lib/actions/goals";
import { createClient } from "@/lib/supabase/browser";
import type { Goal } from "@/lib/types";

export function SettingsView({ goals, displayName }: { goals: Goal; displayName?: string }) {
  const router = useRouter();
  const [currentGoals, setCurrentGoals] = useState<Goal>(goals);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  function handleSaveGoals(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveGoals(formData);
      if (!result?.error) setSaved(true);
    });
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div className="container grid gap-4 py-4 sm:py-6">
      <section className="surface-glass rounded-lg p-4 sm:p-6">
        <p className="text-sm font-semibold text-primary">Settings</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Personalize FuelTrack</h2>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              Daily Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveGoals} className="grid gap-4 sm:grid-cols-2">
              {([
                ["calories", "Calories", "kcal"],
                ["protein", "Protein", "g"],
                ["carbs", "Carbs", "g"],
                ["fat", "Fat", "g"],
                ["waterMl", "Water", "ml"],
                ["targetWeightKg", "Target weight", "kg"]
              ] as const).map(([key, label, unit]) => (
                <div key={key} className="grid gap-2">
                  <Label htmlFor={key}>{label}</Label>
                  <div className="flex rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                    <Input
                      id={key}
                      name={key}
                      className="border-0 focus-visible:ring-0"
                      value={currentGoals[key]}
                      onChange={(e) => setCurrentGoals((c) => ({ ...c, [key]: Number(e.target.value || 0) }))}
                      inputMode="decimal"
                    />
                    <span className="flex items-center px-3 text-sm text-muted-foreground">{unit}</span>
                  </div>
                </div>
              ))}
              <div className="sm:col-span-2 flex items-center gap-3">
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save goals
                </Button>
                {saved && <p className="text-sm text-emerald-600 font-medium">Saved!</p>}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-4 text-primary" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {displayName && (
                <div className="grid gap-2">
                  <Label>Display name</Label>
                  <Input defaultValue={displayName} disabled />
                </div>
              )}
              <Button variant="outline" onClick={handleSignOut} disabled={signingOut}>
                {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                Sign out
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-4 text-primary" />
                Food Database
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-muted-foreground">
              <p>Custom foods you create are saved to your account.</p>
              <p>They appear first in search results for fast logging.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Micronutrient Targets</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {Object.entries(nutrientTargets).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-md bg-secondary/60 p-3">
                <span className="text-sm font-medium">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className="text-sm text-muted-foreground">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              Habit Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {["Breakfast log reminder", "Evening hydration check", "Weekly report summary"].map((item) => (
              <label key={item} className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                <span className="font-medium">{item}</span>
                <input type="checkbox" defaultChecked className="size-4 accent-emerald-600" />
              </label>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
