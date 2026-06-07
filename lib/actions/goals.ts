"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveGoals(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const goals = {
    calories: Number(formData.get("calories") || 2600),
    protein: Number(formData.get("protein") || 160),
    carbs: Number(formData.get("carbs") || 250),
    fat: Number(formData.get("fat") || 80),
    water_ml: Number(formData.get("waterMl") || 3000),
    target_weight_kg: Number(formData.get("targetWeightKg") || 75),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("goals")
    .upsert({ user_id: user.id, ...goals });

  if (error) return { error: error.message };

  revalidatePath("/app/dashboard");
  revalidatePath("/app/settings");
  return { success: true };
}
