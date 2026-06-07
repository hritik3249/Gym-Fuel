"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logWeight(data: {
  weightKg: number;
  bodyFatPercent?: number;
  waistCm?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("weight_logs").insert({
    user_id: user.id,
    weight_kg: data.weightKg,
    body_fat_percent: data.bodyFatPercent ?? null,
    waist_cm: data.waistCm ?? null
  });

  if (error) return { error: error.message };

  revalidatePath("/app/dashboard");
  revalidatePath("/app/weight");
  return { success: true };
}
