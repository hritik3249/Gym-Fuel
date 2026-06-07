import { redirect } from "next/navigation";
import { SettingsView } from "@/components/settings-view";
import { createClient } from "@/lib/supabase/server";
import { defaultGoals } from "@/lib/nutrition";
import type { Goal } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: goalsData } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const goals: Goal = goalsData ? {
    calories: goalsData.calories,
    protein: Number(goalsData.protein),
    carbs: Number(goalsData.carbs),
    fat: Number(goalsData.fat),
    waterMl: goalsData.water_ml,
    targetWeightKg: Number(goalsData.target_weight_kg)
  } : defaultGoals;

  const displayName = user.user_metadata?.name
    ?? user.user_metadata?.full_name
    ?? user.email?.split("@")[0]
    ?? "User";

  return <SettingsView goals={goals} displayName={displayName} />;
}
