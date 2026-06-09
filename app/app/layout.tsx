import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

async function getShellData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { displayName: "", streak: 0 };

  const [profileRes, streakRes] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase.from("streaks").select("daily_streak").eq("user_id", user.id).single()
  ]);

  const displayName =
    profileRes.data?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "";

  return { displayName, streak: streakRes.data?.daily_streak ?? 0 };
}

export default async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  const { displayName, streak } = await getShellData();
  return <AppShell displayName={displayName} streak={streak}>{children}</AppShell>;
}
