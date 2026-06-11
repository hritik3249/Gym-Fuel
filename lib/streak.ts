import type { SupabaseClient } from "@supabase/supabase-js";

/** Updates the daily streak after a log. Called by the food-entry and
 *  saved-meal server actions — NOT a server action itself (lives outside
 *  "use server" so it can't be invoked directly from the client). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateStreak(supabase: SupabaseClient<any, any, any>, userId: string, loggedDate: string) {
  // Count how many entries the user now has for this local date.
  // If exactly 1, this is the first log of the day → update streak.
  const { count } = await supabase
    .from("food_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("entry_date", loggedDate);

  if ((count ?? 0) !== 1) return; // Not the first entry today — streak already updated.

  const { data: row } = await supabase
    .from("streaks")
    .select("daily_streak, last_logged_date")
    .eq("user_id", userId)
    .single();

  // Compute yesterday's date (noon avoids DST edge-cases).
  const d = new Date(`${loggedDate}T12:00:00`);
  d.setDate(d.getDate() - 1);
  const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const lastDate = (row?.last_logged_date as string | null) ?? null;
  const prev = row?.daily_streak ?? 0;
  const newStreak = lastDate === yesterday ? prev + 1 : 1;

  await supabase
    .from("streaks")
    .update({ daily_streak: newStreak, last_logged_date: loggedDate })
    .eq("user_id", userId);
}
