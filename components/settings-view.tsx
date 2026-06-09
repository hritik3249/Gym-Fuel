"use client";

import { Bell, BellOff, Calculator, Loader2, LogOut, Save, User } from "lucide-react";
import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollPickerModal } from "@/components/ui/scroll-picker-modal";
import { nutrientTargets } from "@/lib/nutrition";
import { saveProfile } from "@/lib/actions/profile";
import { saveGoals } from "@/lib/actions/goals";
import { subscribePush, unsubscribePush, saveReminderPrefs } from "@/lib/actions/push";
import { createClient } from "@/lib/supabase/browser";
import { calculateGoals } from "@/lib/calculator";
import type { ActivityLevel, CalculatedGoals, FitnessGoal, Gender } from "@/lib/calculator";
import type { Goal } from "@/lib/types";

const ACTIVITY_OPTIONS: Array<{ value: ActivityLevel; label: string }> = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light (1–3x/week)" },
  { value: "moderate", label: "Moderate (3–5x/week)" },
  { value: "active", label: "Active (6–7x/week)" },
  { value: "very_active", label: "Very Active (daily)" }
];

const GOAL_OPTIONS: Array<{ value: FitnessGoal; label: string }> = [
  { value: "lose", label: "🔥 Lose weight" },
  { value: "maintain", label: "⚖️ Maintain" },
  { value: "gain", label: "💪 Gain muscle" }
];

const GOAL_PICKERS = [
  { key: "calories"       as keyof Goal, label: "Calories",      unit: "kcal", min: 500,  max: 6000, step: 50  },
  { key: "protein"        as keyof Goal, label: "Protein",        unit: "g",    min: 20,   max: 400,  step: 1   },
  { key: "carbs"          as keyof Goal, label: "Carbs",          unit: "g",    min: 20,   max: 600,  step: 1   },
  { key: "fat"            as keyof Goal, label: "Fat",            unit: "g",    min: 10,   max: 200,  step: 1   },
  { key: "waterMl"        as keyof Goal, label: "Water",          unit: "ml",   min: 500,  max: 5000, step: 250 },
  { key: "targetWeightKg" as keyof Goal, label: "Target weight",  unit: "kg",   min: 30,   max: 200,  step: 0.5 },
] as const;

const REMINDER_CONFIG = [
  { key: "breakfast" as const, label: "Breakfast log reminder",  detail: "Every morning at 8 AM"    },
  { key: "hydration" as const, label: "Evening hydration check", detail: "Every evening at 8 PM"    },
  { key: "weekly"    as const, label: "Weekly report summary",   detail: "Every Sunday at 9 AM"     },
];

type ReminderKey = "breakfast" | "hydration" | "weekly";
type ReminderPrefs = Record<ReminderKey, boolean>;

const SELECT_CLASSES =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type SettingsProfile = {
  displayName: string;
  age: number | "";
  gender: Gender;
  heightCm: number | "";
  weightKg: number | "";
  activityLevel: ActivityLevel;
  fitnessGoal: FitnessGoal;
};

function applyCalculatedGoals(goals: Goal, calculated: CalculatedGoals): Goal {
  return {
    ...goals,
    calories: calculated.calories,
    protein: calculated.protein,
    carbs: calculated.carbs,
    fat: calculated.fat,
    waterMl: calculated.waterMl,
    targetWeightKg: calculated.targetWeightKg
  };
}

export function SettingsView({ goals: initialGoals, profile: initialProfile, reminders: initialReminders }: {
  goals: Goal;
  profile: SettingsProfile;
  reminders: ReminderPrefs;
}) {
  const [goals, setGoals] = useState<Goal>(initialGoals);
  const [profile, setProfile] = useState<SettingsProfile>(initialProfile);
  const [preview, setPreview] = useState<CalculatedGoals | null>(null);
  const [profilePending, startProfileTransition] = useTransition();
  const [goalsPending, startGoalsTransition] = useTransition();
  const [profileSaved, setProfileSaved] = useState(false);
  const [goalsSaved, setGoalsSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [activePicker, setActivePicker] = useState<typeof GOAL_PICKERS[number] | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ── Push notification state ──────────────────────────────────────────────
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [reminders, setReminders]   = useState<ReminderPrefs>(initialReminders);
  const [reminderPending, setReminderPending] = useState(false);
  useEffect(() => {
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
  }, []);

  const getSubscription = useCallback(async (): Promise<PushSubscription | null> => {
    if (!("serviceWorker" in navigator)) return null;
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  }, []);

  const createSubscription = useCallback(async (): Promise<PushSubscription | null> => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return null;
    const reg = await navigator.serviceWorker.ready;
    const raw = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const padding = "=".repeat((4 - (raw.length % 4)) % 4);
    const base64 = (raw + padding).replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const applicationServerKey = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) applicationServerKey[i] = binary.charCodeAt(i);
    return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
  }, []);

  async function handleReminderToggle(key: ReminderKey, enabled: boolean) {
    setReminderPending(true);
    try {
      // Request permission if needed
      if (enabled && permission !== "granted") {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== "granted") {
          toast.error("Notification permission denied", { description: "Enable notifications in your browser settings." });
          setReminderPending(false);
          return;
        }
      }

      // Ensure a push subscription exists when enabling any reminder
      if (enabled) {
        let sub = await getSubscription();
        if (!sub) sub = await createSubscription();
        if (sub) {
          const j = sub.toJSON();
          await subscribePush({
            endpoint: j.endpoint!,
            p256dh:   j.keys!.p256dh,
            auth:     j.keys!.auth,
          });
        }
      }

      const updated = { ...reminders, [key]: enabled };
      setReminders(updated);
      await saveReminderPrefs(updated);

      // Unsubscribe from push entirely if all reminders are now off
      if (!updated.breakfast && !updated.hydration && !updated.weekly) {
        const sub = await getSubscription();
        if (sub) { await sub.unsubscribe(); await unsubscribePush(sub.endpoint); }
      }

      toast.success(enabled ? "Reminder enabled" : "Reminder disabled");
    } catch {
      toast.error("Failed to update reminder");
    } finally {
      setReminderPending(false);
    }
  }

  function updateProfile<K extends keyof SettingsProfile>(field: K, value: SettingsProfile[K]) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function recalculate() {
    const age = Number(profile.age);
    const heightCm = Number(profile.heightCm);
    const weightKg = Number(profile.weightKg);
    if (age <= 0 || heightCm <= 0 || weightKg <= 0) return;

    const calculated = calculateGoals({ age, gender: profile.gender, heightCm, weightKg, activityLevel: profile.activityLevel, goal: profile.fitnessGoal });
    setPreview(calculated);
    setGoals((current) => applyCalculatedGoals(current, calculated));
  }

  function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileSaved(false);
    setProfileError("");

    const formData = new FormData(event.currentTarget);
    formData.set("gender", profile.gender);
    formData.set("activityLevel", profile.activityLevel);
    formData.set("fitnessGoal", profile.fitnessGoal);

    startProfileTransition(async () => {
      const result = await saveProfile(formData);
      if (result?.error) {
        toast.error("Couldn't save profile", { description: result.error });
        setProfileError(result.error);
        return;
      }
      if (result?.calculated) setGoals((current) => applyCalculatedGoals(current, result.calculated));
      setProfileSaved(true);
      toast.success("Profile saved");
    });
  }

  function handleSaveGoals(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGoalsSaved(false);

    const formData = new FormData(event.currentTarget);
    startGoalsTransition(async () => {
      const result = await saveGoals(formData);
      if (result?.error) {
        toast.error("Couldn't save goals", { description: result.error });
        return;
      }
      setGoalsSaved(true);
      toast.success("Goals saved");
    });
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <>
    <div className={`container grid gap-4 py-4 sm:py-6 ${activePicker ? "pointer-events-none select-none" : ""}`}>
      <section className="surface-glass rounded-lg p-4 sm:p-6">
        <p className="text-sm font-semibold text-primary">Settings</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Personalize FuelTrack</h2>
      </section>

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
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input id="displayName" name="displayName" value={profile.displayName} onChange={(e) => updateProfile("displayName", e.target.value)} placeholder="Your name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  name="age"
                  inputMode="numeric"
                  value={!profile.age || isNaN(Number(profile.age)) ? "" : profile.age}
                  onChange={(e) => updateProfile("age", e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 25"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Gender</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["male", "female"] as const satisfies readonly Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => updateProfile("gender", g)}
                      className={`rounded-md border py-2.5 text-sm font-semibold capitalize transition-colors ${
                        profile.gender === g ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"
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
                  value={!profile.heightCm || isNaN(Number(profile.heightCm)) ? "" : profile.heightCm}
                  onChange={(e) => updateProfile("heightCm", e.target.value ? Number(e.target.value) : "")}
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
                  value={!profile.weightKg || isNaN(Number(profile.weightKg)) ? "" : profile.weightKg}
                  onChange={(e) => updateProfile("weightKg", e.target.value ? Number(e.target.value) : "")}
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
                  onChange={(e) => updateProfile("activityLevel", e.target.value as ActivityLevel)}
                  className={SELECT_CLASSES}
                >
                  {ACTIVITY_OPTIONS.map((opt) => (
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
                  onChange={(e) => updateProfile("fitnessGoal", e.target.value as FitnessGoal)}
                  className={SELECT_CLASSES}
                >
                  {GOAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {preview && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="mb-2 text-sm font-semibold text-primary">Recalculated goals preview</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Calories", value: `${preview.calories}` },
                    { label: "Protein", value: `${preview.protein}g` },
                    { label: "Carbs", value: `${preview.carbs}g` },
                    { label: "Fat", value: `${preview.fat}g` }
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-md border border-border bg-background p-2">
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

            {profileError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{profileError}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={recalculate}>
                <Calculator className="size-4" />
                Recalculate goals
              </Button>
              <Button type="submit" disabled={profilePending}>
                {profilePending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save profile
              </Button>
              {profileSaved && <p className="text-sm font-medium text-emerald-600">Saved!</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="size-4 text-primary" />
            Daily Goals
            <span className="ml-auto text-xs font-normal text-muted-foreground">Override calculated values</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveGoals} className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {GOAL_PICKERS.map((picker) => {
                const { key, label, unit, step } = picker;
                const raw = Number(goals[key]);
                const val = Number.isFinite(raw) ? raw : 0;
                const display = step < 1 ? val.toFixed(1) : String(Math.round(val));
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActivePicker(picker)}
                    className="group flex flex-col items-start rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold group-hover:text-primary">
                      {display}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
                    </p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground/60">Tap to edit</p>
                    <input type="hidden" name={key} value={val} />
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={goalsPending}>
                {goalsPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save goals
              </Button>
              {goalsSaved && <p className="text-sm font-medium text-primary">Saved!</p>}
            </div>
          </form>

        </CardContent>
      </Card>

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
            {/* Permission banner */}
            {permission === "denied" && (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <BellOff className="size-4 shrink-0" />
                <span>Notifications blocked. Enable them in your browser / phone settings, then reload.</span>
              </div>
            )}
            {permission === "default" && (
              <p className="text-xs text-muted-foreground">
                Turn on a reminder below and your browser will ask for notification permission.
              </p>
            )}

            {/* Reminder toggles */}
            {REMINDER_CONFIG.map(({ key, label, detail }) => (
              <label
                key={key}
                className={`flex cursor-pointer items-center justify-between rounded-lg border bg-background p-3 transition-colors ${
                  reminders[key] ? "border-primary/40 bg-primary/5" : "border-border"
                } ${reminderPending ? "pointer-events-none opacity-60" : ""}`}
              >
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{detail}</p>
                </div>
                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={reminders[key]}
                  disabled={reminderPending || permission === "denied"}
                  onClick={() => handleReminderToggle(key, !reminders[key])}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none ${
                    reminders[key] ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
                    reminders[key] ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
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

    {/* Portal: renders directly on document.body — completely outside the
        pointer-events-none wrapper, no stacking context conflicts */}
    {mounted && activePicker && createPortal(
      <ScrollPickerModal
        label={activePicker.label}
        unit={activePicker.unit}
        min={activePicker.min}
        max={activePicker.max}
        step={activePicker.step}
        value={Number(goals[activePicker.key])}
        onConfirm={(v) => setGoals((g) => ({ ...g, [activePicker.key]: v }))}
        onClose={() => setActivePicker(null)}
      />,
      document.body
    )}
    </>
  );
}
