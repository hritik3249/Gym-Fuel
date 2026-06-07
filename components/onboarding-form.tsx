"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Activity, ChevronRight, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveGoals } from "@/lib/actions/goals";

export function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await saveGoals(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/app/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
            <Activity className="size-7" />
          </span>
          <h1 className="text-3xl font-bold">Welcome to FuelTrack</h1>
          <p className="mt-2 text-muted-foreground">Let&apos;s set your daily goals to get started.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              Your Daily Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "calories", label: "Calories", unit: "kcal", default: "2000" },
                  { name: "protein", label: "Protein", unit: "g", default: "150" },
                  { name: "carbs", label: "Carbs", unit: "g", default: "200" },
                  { name: "fat", label: "Fat", unit: "g", default: "65" },
                  { name: "waterMl", label: "Water", unit: "ml", default: "3000" },
                  { name: "targetWeightKg", label: "Target weight", unit: "kg", default: "75" }
                ].map(({ name, label, unit, default: def }) => (
                  <div key={name} className="grid gap-2">
                    <Label htmlFor={name}>{label}</Label>
                    <div className="flex rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                      <Input
                        id={name}
                        name={name}
                        defaultValue={def}
                        inputMode="decimal"
                        className="border-0 focus-visible:ring-0"
                        required
                      />
                      <span className="flex items-center px-3 text-sm text-muted-foreground">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
              )}

              <Button className="w-full mt-2" disabled={loading}>
                {loading
                  ? <Loader2 className="size-4 animate-spin" />
                  : <ChevronRight className="size-4" />
                }
                Start tracking
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          You can change these anytime in Settings.
        </p>
      </div>
    </div>
  );
}
