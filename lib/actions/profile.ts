"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateGoals } from "@/lib/calculator";
import type { ActivityLevel, FitnessGoal, Gender } from "@/lib/calculator";

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const age = Number(formData.get("age"));
  const gender = formData.get("gender") as Gender;
  const heightCm = Number(formData.get("heightCm"));
  const weightKg = Number(formData.get("weightKg"));
  const activityLevel = formData.get("activityLevel") as ActivityLevel;
  const fitnessGoal = formData.get("fitnessGoal") as FitnessGoal;
  const displayName = formData.get("displayName") as string;

  // Validate
  if (!age || !gender || !heightCm || !weightKg || !activityLevel || !fitnessGoal) {
    return { error: "All fields are required." };
  }

  // Calculate goals
  const calculated = calculateGoals({ age, gender, heightCm, weightKg, activityLevel, goal: fitnessGoal });

  // Save profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      age,
      gender,
      height_cm: heightCm,
      current_weight_kg: weightKg,
      activity_level: activityLevel,
      fitness_goal: fitnessGoal,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  // Save calculated goals
  const { error: goalsError } = await supabase
    .from("goals")
    .upsert({
      user_id: user.id,
      calories: calculated.calories,
      protein: calculated.protein,
      carbs: calculated.carbs,
      fat: calculated.fat,
      water_ml: calculated.waterMl,
      target_weight_kg: calculated.targetWeightKg,
      updated_at: new Date().toISOString()
    });

  if (goalsError) return { error: goalsError.message };

  // Also log current weight
  await supabase.from("weight_logs").insert({
    user_id: user.id,
    weight_kg: weightKg
  });

  revalidatePath("/app/dashboard");
  revalidatePath("/app/settings");
  revalidatePath("/app/weight");

  return { success: true, calculated };
}
