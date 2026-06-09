"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollPicker } from "@/components/ui/scroll-picker";
import { saveProfile } from "@/lib/actions/profile";
import { calculateGoals } from "@/lib/calculator";
import { createClient } from "@/lib/supabase/browser";
import type { ActivityLevel, CalculatedGoals, FitnessGoal, Gender } from "@/lib/calculator";
import { cn } from "@/lib/utils";

/* ── Step definitions ─────────────────────────────── */
const TOTAL_STEPS = 6;

const ACTIVITY_OPTIONS: Array<{ value: ActivityLevel; label: string; detail: string; emoji: string }> = [
  { value: "sedentary",   label: "Sedentary",    detail: "Desk job, little movement",  emoji: "🪑" },
  { value: "light",       label: "Light",         detail: "Walk / gym 1–3×/week",       emoji: "🚶" },
  { value: "moderate",    label: "Moderate",      detail: "Gym or sport 3–5×/week",     emoji: "🏃" },
  { value: "active",      label: "Active",        detail: "Hard training 6–7×/week",    emoji: "💪" },
  { value: "very_active", label: "Very Active",   detail: "Athlete / physical job",     emoji: "🔥" },
];

const GOAL_OPTIONS: Array<{ value: FitnessGoal; label: string; detail: string; emoji: string }> = [
  { value: "lose",     label: "Lose weight",  detail: "500 kcal deficit/day",   emoji: "🔥" },
  { value: "maintain", label: "Maintain",     detail: "Eat at your TDEE",       emoji: "⚖️" },
  { value: "gain",     label: "Gain muscle",  detail: "300 kcal surplus/day",   emoji: "💪" },
];

/* ── Small helpers ────────────────────────────────── */
function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-300",
            i < current
              ? "size-2 bg-primary"
              : i === current
              ? "h-2 w-5 bg-primary"
              : "size-2 bg-border"
          )}
        />
      ))}
    </div>
  );
}

function StepShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

/* ── Main component ───────────────────────────────── */
export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  // If the user is already onboarded (completed in another tab, or navigated
  // here directly after setup), kick them to the dashboard immediately.
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("age")
      .single()
      .then(({ data }) => {
        if (data?.age) router.replace("/app/dashboard");
      });
  }, [router]);

  // Fields
  const [displayName, setDisplayName] = useState("");
  const [age,         setAge]         = useState(25);
  const [gender,      setGender]      = useState<Gender>("male");
  const [heightCm,    setHeightCm]    = useState(170);
  const [weightKg,    setWeightKg]    = useState(70);
  const [targetKg,    setTargetKg]    = useState(65);
  const [activity,    setActivity]    = useState<ActivityLevel>("moderate");
  const [goal,        setGoal]        = useState<FitnessGoal>("maintain");
  const [preview,     setPreview]     = useState<CalculatedGoals | null>(null);

  function next() {
    if (step === 4) {
      // Compute preview before showing summary
      const calc = calculateGoals({ age, gender, heightCm, weightKg, activityLevel: activity, goal });
      setPreview(calc);
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function back() { setStep((s) => Math.max(s - 1, 0)); }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("displayName", displayName);
    formData.set("age",         String(age));
    formData.set("gender",      gender);
    formData.set("heightCm",    String(heightCm));
    formData.set("weightKg",    String(weightKg));
    formData.set("targetWeightKg", String(targetKg));
    formData.set("activityLevel",  activity);
    formData.set("fitnessGoal",    goal);

    const result = await saveProfile(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    window.location.href = "/app/dashboard";
  }

  // Can user proceed from this step?
  const canNext =
    step === 0 ? displayName.trim().length >= 1 :
    step === 1 ? age >= 10 && age <= 100 :
    step === 2 ? heightCm >= 100 && weightKg >= 20 :
    true;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">

        {/* Logo + progress */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="size-6" />
          </span>
          <StepDots current={step} />
        </div>

        {/* ── Step 0: Name ── */}
        {step === 0 && (
          <StepShell title="Hey! What should we call you?" subtitle="This is how you'll appear in the app.">
            <Input
              autoFocus
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Hritik"
              className="h-12 text-base"
              onKeyDown={(e) => e.key === "Enter" && canNext && next()}
            />
          </StepShell>
        )}

        {/* ── Step 1: Age + Gender ── */}
        {step === 1 && (
          <StepShell title="How old are you?" subtitle="Used to calculate your base metabolic rate.">
            <div className="flex flex-col items-center gap-6">
              <ScrollPicker min={10} max={100} step={1} value={age} onChange={setAge} label="Age" unit="years" />
              <div>
                <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gender</p>
                <div className="flex gap-3">
                  {(["male", "female"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={cn(
                        "rounded-xl border px-8 py-3 text-sm font-semibold capitalize transition-all",
                        gender === g
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-accent"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </StepShell>
        )}

        {/* ── Step 2: Height + Weight ── */}
        {step === 2 && (
          <StepShell title="Your body measurements" subtitle="Used to compute your calorie targets accurately.">
            <div className="flex items-start justify-center gap-10">
              <ScrollPicker min={100} max={250} step={0.5} value={heightCm} onChange={setHeightCm} label="Height" unit="cm" />
              <ScrollPicker min={20}  max={250} step={0.5} value={weightKg} onChange={setWeightKg} label="Weight" unit="kg" />
              <ScrollPicker min={20}  max={250} step={0.5} value={targetKg} onChange={setTargetKg} label="Target" unit="kg" />
            </div>
          </StepShell>
        )}

        {/* ── Step 3: Activity ── */}
        {step === 3 && (
          <StepShell title="How active are you?" subtitle="Be honest — this is the biggest factor in your calorie target.">
            <div className="grid gap-2">
              {ACTIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setActivity(opt.value)}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                    activity === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:bg-accent"
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <div>
                    <p className="font-semibold">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.detail}</p>
                  </div>
                  {activity === opt.value && (
                    <div className="ml-auto size-4 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {/* ── Step 4: Goal ── */}
        {step === 4 && (
          <StepShell title="What's your main goal?" subtitle="We'll adjust your calorie target accordingly.">
            <div className="grid gap-3">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGoal(opt.value)}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-5 text-left transition-all",
                    goal === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:bg-accent"
                  )}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <div>
                    <p className="text-base font-bold">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.detail}</p>
                  </div>
                  {goal === opt.value && (
                    <div className="ml-auto size-4 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {/* ── Step 5: Summary ── */}
        {step === 5 && preview && (
          <StepShell
            title={`You're all set, ${displayName}!`}
            subtitle="Here's your personalised daily plan. You can tweak these anytime in Settings."
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Calories",  value: `${preview.calories}`, unit: "kcal" },
                { label: "Protein",   value: `${preview.protein}`,  unit: "g" },
                { label: "Carbs",     value: `${preview.carbs}`,    unit: "g" },
                { label: "Fat",       value: `${preview.fat}`,      unit: "g" },
                { label: "Water",     value: `${preview.waterMl}`,  unit: "ml" },
                { label: "TDEE",      value: `${preview.tdee}`,     unit: "kcal/day" },
              ].map(({ label, value, unit }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-primary">{value}</p>
                  <p className="text-xs text-muted-foreground">{unit}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              BMR: {preview.bmr} kcal · Goal: {goal} · {activity.replace("_", " ")}
            </p>
          </StepShell>
        )}

        {/* ── Navigation ── */}
        <div className={cn("mt-8 flex gap-3", step === 0 ? "justify-end" : "justify-between")}>
          {step > 0 && (
            <Button variant="outline" onClick={back} className="gap-2">
              <ChevronLeft className="size-4" />
              Back
            </Button>
          )}

          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={next} disabled={!canNext} className="gap-2">
              {step === 0 ? "Let's go" : "Continue"}
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
              Start tracking
            </Button>
          )}
        </div>

        {error && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
