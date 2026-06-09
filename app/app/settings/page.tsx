import { redirect } from "next/navigation";
import { SettingsView } from "@/components/settings-view";
import type { SettingsProfile } from "@/components/settings-view";
import { createClient } from "@/lib/supabase/server";
import { defaultGoals } from "@/lib/nutrition";
import type { Goal } from "@/lib/types";
import type { ActivityLevel, FitnessGoal, Gender } from "@/lib/calculator";

function safeNum(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function mapGoals(row: Record<string, unknown> | null): Goal {
  if (!row) return defaultGoals;
  return {
    calories:       safeNum(row.calories,         defaultGoals.calories),
    protein:        safeNum(row.protein,           defaultGoals.protein),
    carbs:          safeNum(row.carbs,             defaultGoals.carbs),
    fat:            safeNum(row.fat,               defaultGoals.fat),
    waterMl:        safeNum(row.water_ml,          defaultGoals.waterMl),
    targetWeightKg: safeNum(row.target_weight_kg,  defaultGoals.targetWeightKg),
  };
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: goalsData }, { data: profileData }] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", user.id).single(),
    supabase.from("profiles").select("*").eq("id", user.id).single()
  ]);

  const profile: SettingsProfile = {
    displayName: profileData?.display_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "",
    age: profileData?.age ?? "",
    gender: (profileData?.gender ?? "male") as Gender,
    heightCm: profileData?.height_cm ?? "",
    weightKg: profileData?.current_weight_kg ?? "",
    activityLevel: (profileData?.activity_level ?? "moderate") as ActivityLevel,
    fitnessGoal: (profileData?.fitness_goal ?? "maintain") as FitnessGoal
  };

  return <SettingsView goals={mapGoals(goalsData)} profile={profile} />;
}
