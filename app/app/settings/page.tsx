import { redirect } from "next/navigation";
import { SettingsView } from "@/components/settings-view";
import { createClient } from "@/lib/supabase/server";
import { defaultGoals } from "@/lib/nutrition";
import type { Goal } from "@/lib/types";
import type { ActivityLevel, FitnessGoal, Gender } from "@/lib/calculator";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: goalsData }, { data: profileData }] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", user.id).single(),
    supabase.from("profiles").select("*").eq("id", user.id).single()
  ]);

  const goals: Goal = goalsData ? {
    calories: goalsData.calories,
    protein: Number(goalsData.protein),
    carbs: Number(goalsData.carbs),
    fat: Number(goalsData.fat),
    waterMl: goalsData.water_ml,
    targetWeightKg: Number(goalsData.target_weight_kg)
  } : defaultGoals;

  const profile = {
    displayName: profileData?.display_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "",
    age: profileData?.age ?? ("" as const),
    gender: (profileData?.gender ?? "male") as Gender,
    heightCm: profileData?.height_cm ?? ("" as const),
    weightKg: profileData?.current_weight_kg ?? ("" as const),
    activityLevel: (profileData?.activity_level ?? "moderate") as ActivityLevel,
    fitnessGoal: (profileData?.fitness_goal ?? "maintain") as FitnessGoal
  };

  return <SettingsView goals={goals} profile={profile} />;
}
