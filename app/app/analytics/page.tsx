import { redirect } from "next/navigation";
import { AnalyticsView } from "@/components/analytics-view";
import { getDashboardSnapshot } from "@/lib/queries/dashboard";

export default async function AnalyticsPage() {
  const snapshot = await getDashboardSnapshot();
  if (snapshot.isNewUser) redirect("/app/onboarding");

  return <AnalyticsView trends={snapshot.trends} achievements={snapshot.achievements} />;
}
