import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

async function getDisplayName() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return "";

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
  return profile?.display_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "";
}

export default async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  const displayName = await getDisplayName();
  return <AppShell displayName={displayName}>{children}</AppShell>;
}
