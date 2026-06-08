"use client";

import { useState } from "react";
import { Activity, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProfile } from "@/lib/actions/profile";
import { calculateGoals } from "@/lib/calculator";
import type { ActivityLevel, FitnessGoal, Gender } from "@/lib/calculator";

const activityOptions: { value: ActivityLevel; label: string; detail: string }[] = [
  { value: "sedentary", label: "Sedentary", detail: "Little or no exercise" },
  { value: "light", label: "Light", detail: "1–3 days/week" },
  { value: "moderate", label: "Moderate", detail: "3–5 days/week" },
  { value: "active", label: "Active", detail: "6–7 days/week" },
  { value: "very_active", label: "Very Active", detail: "Hard training daily" }
];

const goalOptions: { value: FitnessGoal; label: string; detail: string; emoji: string }[] = [
  { value: "lose", label: "Lose weight", detail: "500 kcal deficit", emoji: "🔥" },
  { value: "maintain", label: "Maintain", detail: "Eat at TDEE", emoji: "⚖️" },
  { value: "gain", label: "Gain muscle", detail: "300 kcal surplus", emoji: "💪" }
];

export function OnboardingForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>("maintain");
  const [preview, setPreview] = useState<ReturnType<typeof calculateGoals> | null>(null);

  // Live preview of calculated goals
  function updatePreview(form: HTMLFormElement) {
    const data = new FormData(form);
    const age = Number(data.get("age"));
    const heightCm = Number(data.get("heightCm"));
    const weightKg = Number(data.get("weightKg"));
    if (age > 0 && heightCm > 0 && weightKg > 0) {
      setPreview(calculateGoals({ age, gender, heightCm, weightKg, activityLevel, goal: fitnessGoal }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("gender", gender);
    formData.set("activityLevel", activityLevel);
    formData.set("fitnessGoal", fitnessGoal);

    const result = await saveProfile(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    window.location.href = "/app/dashboard";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
            <Activity className="size-7" />
          </span>
          <h1 className="text-3xl font-bold">Welcome to FuelTrack</h1>
          <p className="mt-2 text-muted-foreground">Tell us about yourself and we&apos;ll calculate your optimal goals.</p>
        </div>

        <form onSubmit={handleSubmit} onChange={(e) => updatePreview(e.currentTarget)} className="grid gap-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 grid gap-2">
                <Label htmlFor="displayName">Your name</Label>
                <Input id="displayName" name="displayName" placeholder="e.g. Hritik" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" name="age" inputMode="numeric" placeholder="e.g. 25" required />
              </div>
              <div className="grid gap-2">
                <Label>Gender</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["male", "female"] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`rounded-md border py-2.5 text-sm font-semibold capitalize transition-colors ${
                        gender === g
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
                <Input id="heightCm" name="heightCm" inputMode="decimal" placeholder="e.g. 175" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weightKg">Current weight (kg)</Label>
                <Input id="weightKg" name="weightKg" inputMode="decimal" placeholder="e.g. 80" required />
              </div>
            </CardContent>
          </Card>

          {/* Activity Level */}
          <Card>
            <CardContent className="pt-6 grid gap-3">
              <Label>Activity level</Label>
              <div className="grid gap-2 sm:grid-cols-5">
                {activityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setActivityLevel(opt.value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      activityLevel === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.detail}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fitness Goal */}
          <Card>
            <CardContent className="pt-6 grid gap-3">
              <Label>Your goal</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {goalOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFitnessGoal(opt.value)}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      fitnessGoal === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    <p className="text-xl mb-1">{opt.emoji}</p>
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.detail}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          {preview && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm font-semibold text-primary mb-3">Your calculated daily goals</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Calories", value: `${preview.calories} kcal` },
                    { label: "Protein", value: `${preview.protein}g` },
                    { label: "Carbs", value: `${preview.carbs}g` },
                    { label: "Fat", value: `${preview.fat}g` }
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-background border border-border p-3 text-center">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-lg font-bold mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  BMR: {preview.bmr} kcal · TDEE: {preview.tdee} kcal · Water: {preview.waterMl}ml
                </p>
              </CardContent>
            </Card>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}

          <Button className="w-full h-12 text-base" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
            Calculate my goals & start tracking
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          You can update all of this anytime in Settings.
        </p>
      </div>
    </div>
  );
}
