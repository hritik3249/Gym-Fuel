import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sendPush, type PushPayload } from "@/lib/web-push";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>;

export const runtime = "nodejs";

const REMINDERS: Record<string, PushPayload & { column: string }> = {
  breakfast: {
    column: "reminder_breakfast",
    title:  "🍳 Log your breakfast",
    body:   "Track your morning meal to keep your streak alive!",
    url:    "/app/foods",
    tag:    "breakfast",
  },
  hydration: {
    column: "reminder_hydration",
    title:  "💧 Evening hydration check",
    body:   "How's your water intake today? Don't forget to log it.",
    url:    "/app/dashboard",
    tag:    "hydration",
  },
  weekly: {
    column: "reminder_weekly",
    title:  "📊 Your weekly summary",
    body:   "Check how you performed this week — calories, protein, consistency.",
    url:    "/app/analytics",
    tag:    "weekly",
  },
};

async function sendReminder(
  supabase: AnySupabase,
  type: string
): Promise<{ sent: number; stale: number }> {
  const reminder = REMINDERS[type];
  if (!reminder) return { sent: 0, stale: 0 };

  const { data: rows, error } = await supabase
    .from("profiles")
    .select("id, push_subscriptions(endpoint, p256dh, auth_key)")
    .eq(reminder.column, true);

  if (error || !rows) return { sent: 0, stale: 0 };

  type SubRow = { endpoint: string; p256dh: string; auth_key: string };
  const stale: string[] = [];
  let sent = 0;

  for (const profile of rows) {
    const subs = (profile as { push_subscriptions: SubRow[] }).push_subscriptions ?? [];
    for (const sub of subs) {
      const result = await sendPush(sub, reminder);
      if (result === "gone") stale.push(sub.endpoint);
      else sent++;
    }
  }

  if (stale.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", stale);
  }

  return { sent, stale: stale.length };
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "breakfast";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // "morning" = breakfast daily + weekly on Sundays — uses one cron slot
  if (type === "morning") {
    const results: Record<string, { sent: number; stale: number }> = {};
    results.breakfast = await sendReminder(supabase, "breakfast");
    if (new Date().getUTCDay() === 0) {
      results.weekly = await sendReminder(supabase, "weekly");
    }
    return NextResponse.json(results);
  }

  const result = await sendReminder(supabase, type);
  return NextResponse.json(result);
}
