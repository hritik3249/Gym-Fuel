"use server";

import { createClient } from "@/lib/supabase/server";

export type LogWeightInput = {
  weightKg: number;
  bodyFatPercent?: number;
  waistCm?: number;
};

export async function logWeight(input: LogWeightInput) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("weight_logs").insert({
    user_id: user.id,
    weight_kg: input.weightKg,
    body_fat_percent: input.bodyFatPercent ?? null,
    waist_cm: input.waistCm ?? null
  });

  if (error) return { error: error.message };

  return { success: true };
}
