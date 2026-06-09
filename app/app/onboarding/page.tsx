import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // If the user already completed onboarding (age is set), send them to the app
  const { data: profile } = await supabase.from("profiles").select("age, display_name").eq("id", user.id).maybeSingle();
  if (profile?.age) redirect("/app/dashboard");

  // Pre-fill display name from Google metadata or existing profile
  const defaultName =
    profile?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "";

  return <OnboardingForm defaultName={defaultName} />;
}
