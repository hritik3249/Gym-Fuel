"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { defaultGoals } from "@/lib/nutrition";

export async function saveGoals(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const numberOr = (key: string, fallback: number) => Number(formData.get(key) || fallback);

  const { error } = await supabase.from("goals").upsert({
    user_id: user.id,
    calories: numberOr("calories", defaultGoals.calories),
    protein: numberOr("protein", defaultGoals.protein),
    carbs: numberOr("carbs", defaultGoals.carbs),
    fat: numberOr("fat", defaultGoals.fat),
    water_ml: numberOr("waterMl", defaultGoals.waterMl),
    target_weight_kg: numberOr("targetWeightKg", defaultGoals.targetWeightKg),
    updated_at: new Date().toISOString()
  });

  if (error) return { error: error.message };

  revalidatePath("/app/dashboard");
  revalidatePath("/app/settings");
  return { success: true };
}
