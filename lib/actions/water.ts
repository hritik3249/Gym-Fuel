"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logWater(amountMl: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("water_logs")
    .insert({ user_id: user.id, amount_ml: amountMl });

  if (error) return { error: error.message };

  revalidatePath("/app/dashboard");
  return { success: true };
}
