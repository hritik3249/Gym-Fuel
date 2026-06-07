"use client";

import { Bell, Calculator, Loader2, LogOut, Save, User } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nutrientTargets } from "@/lib/nutrition";
import { saveProfile } from "@/lib/actions/profile";
import { saveGoals } from "@/lib/actions/goals";
import { createClient } from "@/lib/supabase/browser";
import { calculateGoals } from "@/lib/calculator";
import type { ActivityLevel, FitnessGoal, Gender } from "@/lib/calculator";
import type { Goal } from "@/lib/types";

const activityOptions: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light (1–3x/week)" },
  { value: "moderate", label: "Moderate (3–5x/week)" },
  { value: "active", label: "Active (6–7x/week)" },
  { value: "very_active", label: "Very Active (daily)" }
];

const goalOptions: { value: FitnessGoal; label: string }[] = [
  { value: "lose", label: "🔥 Lose weight" },
  { value: "maintain", label: "⚖️ Maintain" },
  { value: "gain", label: "💪 Gain muscle" }
];

type Profile = {
  displayName: string;
  age: number | "";
  gender: Gender;
  heightCm: number | "";
  weightKg: number | "";
  activityLevel: ActivityLevel;
  fitnessGoal: FitnessGoal;
};

export function SettingsView({
  goals: initialGoals,
  profile: initialProfile
}: {
  goals: Goal;
  profile: Profile;
}) {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal>(initialGoals);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [preview, setPreview] = useState<ReturnType<typeof calculateGoals> | null>(null);
  const [profilePending, startProfileTransition] = useTransition();
  const [goalsPending, startGoalsTransition] = useTransition();
  const [profileSaved, setProfileSaved] = useState(false);
  const [goalsSaved, setGoalsSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  function recalculate() {
    const age = Number(profile.age);
    const heightCm = Number(profile.heightCm);
    const weightKg = Number(profile.weightKg);
    if (age > 0 && heightCm > 0 && weightKg > 0) {
      const calc = calculateGoals({
        age, gender: profile.gender, heightCm, weightKg,
        activityLevel: profile.activityLevel, goal: profile.fitnessGoal
      });
      setPreview(calc);
      setGoals((g) => ({
        ...g,
        calories: calc.calories,
        protein: calc.protein,
        carbs: calc.carbs,
        fat: calc.fat,
        waterMl: calc.waterMl,
        targetWeightKg: calc.targetWeightKg
      }));
    }
  }

  function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileSaved(false);
    setProfileError("");
    const formData = new FormData(e.currentTarget);
    formData.set("gender", profile.gender);
    formData.set("activityLevel", profile.activityLevel);
    formData.set("fitnessGoal", profile.fitnessGoal);
    startProfileTransition(async () => {
      const result = await saveProfile(formData);
      if (result?.error) { setProfileError(result.error); return; }
      if (result?.calculated) {
        setGoals((g) => ({ ...g, ...result.calculated }));
      }
      setProfileSaved(true);
    });
  }

  function handleSaveGoals(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGoalsSaved(false);
    const formData = new FormData(e.currentTarget);
    startGoalsTransition(async () => {
      const result = await saveGoals(formData);
      if (!result?.error) setGoalsSaved(true);
    });
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <div className="container grid gap-4 py-4 sm:py-6">
      <section className="surface-glass rounded-lg p-4 sm:p-6">
        <p className="text-sm font-semibold text-primary">Settings</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Personalize FuelTrack</h2>
      </section>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            Profile & Body Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 grid gap-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={profile.displayName}
                  onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  name="age"
                  inputMode="numeric"
                  value={profile.age}
                  onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value ? Number(e.target.value) : "" }))}
                  placeholder="e.g. 25"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Gender</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["male", "female"] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setProfile((p) => ({ ...p, gender: g }))}
                      className={`rounded-md border py-2.5 text-sm font-semibold capitalize transition-colors ${
                        profile.gender === g
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-accent"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input
                  id="heightCm"
                  name="heightCm"
                  inputMode="decimal"
                  value={profile.heightCm}
                  onChange={(e) => setProfile((p) => ({ ...p, heightCm: e.target.value ? Number(e.target.value) : "" }))}
                  placeholder="e.g. 175"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weightKg">Current weight (kg)</Label>
                <Input
                  id="weightKg"
                  name="weightKg"
                  inputMode="decimal"
                  value={profile.weightKg}
                  onChange={(e) => setProfile((p) => ({ ...p, weightKg: e.target.value ? Number(e.target.value) : "" }))}
                  placeholder="e.g. 80"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="activityLevel">Activity level</Label>
                <select
                  id="activityLevel"
                  name="activityLevel"
                  value={profile.activityLevel}
                  onChange={(e) => setProfile((p) => ({ ...p, activityLevel: e.target.value as ActivityLevel }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {activityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fitnessGoal">Fitness goal</Label>
                <select
                  id="fitnessGoal"
                  name="fitnessGoal"
                  value={profile.fitnessGoal}
                  onChange={(e) => setProfile((p) => ({ ...p, fitnessGoal: e.target.value as FitnessGoal }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {goalOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recalculate preview */}
            {preview && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm font-semibold text-primary mb-2">Recalculated goals preview</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Calories", value: `${preview.calories}` },
                    { label: "Protein", value: `${preview.protein}g` },
                    { label: "Carbs", value: `${preview.carbs}g` },
                    { label: "Fat", value: `${preview.fat}g` }
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-md bg-background border border-border p-2">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-bold">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  BMR: {preview.bmr} kcal · TDEE: {preview.tdee} kcal
                </p>
              </div>
            )}

            {profileError && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{profileError}</p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={recalculate}>
                <Calculator className="size-4" />
                Recalculate goals
              </Button>
              <Button type="submit" disabled={profilePending}>
                {profilePending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save profile
              </Button>
              {profileSaved && <p className="text-sm text-emerald-600 font-medium">Saved!</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Manual Goals Override */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="size-4 text-primary" />
            Daily Goals
            <span className="ml-auto text-xs font-normal text-muted-foreground">Override calculated values</span>
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
                <Label htmlFor={`goal-${key}`}>{label}</Label>
                <div className="flex rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                  <Input
                    id={`goal-${key}`}
                    name={key}
                    className="border-0 focus-visible:ring-0"
                    value={goals[key]}
                    onChange={(e) => setGoals((g) => ({ ...g, [key]: Number(e.target.value || 0) }))}
                    inputMode="decimal"
                  />
                  <span className="flex items-center px-3 text-sm text-muted-foreground">{unit}</span>
                </div>
              </div>
            ))}
            <div className="sm:col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={goalsPending}>
                {goalsPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save goals
              </Button>
              {goalsSaved && <p className="text-sm text-emerald-600 font-medium">Saved!</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Micronutrients + Reminders */}
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
              <label key={item} className="flex items-center justify-between rounded-md border border-border bg-background p-3 cursor-pointer">
                <span className="font-medium">{item}</span>
                <input type="checkbox" defaultChecked className="size-4 accent-emerald-600" />
              </label>
            ))}
            <Button variant="outline" onClick={handleSignOut} disabled={signingOut} className="mt-2">
              {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              Sign out
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
