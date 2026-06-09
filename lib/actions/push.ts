"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Save a push subscription for the current user's device. */
export async function subscribePush(sub: { endpoint: string; p256dh: string; auth: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("push_subscriptions").upsert(
    { user_id: user.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth_key: sub.auth },
    { onConflict: "user_id, endpoint" }
  );
  return error ? { error: error.message } : { success: true };
}

/** Remove a push subscription (user revoked permission or toggled all off). */
export async function unsubscribePush(endpoint: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
  return error ? { error: error.message } : { success: true };
}

/** Persist which reminder toggles the user has enabled. */
export async function saveReminderPrefs(prefs: {
  breakfast: boolean;
  hydration: boolean;
  weekly: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      reminder_breakfast: prefs.breakfast,
      reminder_hydration: prefs.hydration,
      reminder_weekly:    prefs.weekly,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/app/settings");
  return { success: true };
}
