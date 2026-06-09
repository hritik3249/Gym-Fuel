import { OnboardingForm } from "@/components/onboarding-form";

// Render immediately with no server-side fetch — the dashboard already
// redirects new users here, and already-onboarded users back to dashboard.
export default function OnboardingPage() {
  return <OnboardingForm />;
}
