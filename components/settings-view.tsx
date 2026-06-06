"use client";

import { Bell, Database, LogOut, Save, Target, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultGoals, nutrientTargets } from "@/lib/nutrition";
import type { Goal } from "@/lib/types";

export function SettingsView() {
  const [goals, setGoals] = useState<Goal>(defaultGoals);

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
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              ["calories", "Calories", "kcal"],
              ["protein", "Protein", "g"],
              ["carbs", "Carbs", "g"],
              ["fat", "Fat", "g"],
              ["waterMl", "Water", "ml"],
              ["targetWeightKg", "Target weight", "kg"]
            ].map(([key, label, unit]) => (
              <div key={key} className="grid gap-2">
                <Label htmlFor={key}>{label}</Label>
                <div className="flex rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                  <Input
                    id={key}
                    className="border-0 focus-visible:ring-0"
                    value={goals[key as keyof Goal]}
                    onChange={(event) => setGoals((current) => ({ ...current, [key]: Number(event.target.value || 0) }))}
                    inputMode="decimal"
                  />
                  <span className="flex items-center px-3 text-sm text-muted-foreground">{unit}</span>
                </div>
              </div>
            ))}
            <div className="sm:col-span-2">
              <Button>
                <Save className="size-4" />
                Save goals
              </Button>
            </div>
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
              <div className="grid gap-2">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" defaultValue="Hritik" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" defaultValue="Asia/Calcutta" />
              </div>
              <Button variant="outline">
                <LogOut className="size-4" />
                Sign out
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-4 text-primary" />
                Food Database Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-muted-foreground">
              <p>Custom foods and saved foods are always searched first.</p>
              <p>Cached USDA/Open Food Facts results reduce API cost and improve repeat search speed.</p>
              <p>Indian recipes are first-class custom and curated entries, not afterthoughts.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Micronutrient Targets</CardTitle>
          </CardHeader>
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
