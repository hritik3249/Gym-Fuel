import { redirect } from "next/navigation";
import { AnalyticsView } from "@/components/analytics-view";
import { getAnalyticsPageData } from "@/lib/queries/dashboard";

export default async function AnalyticsPage() {
  const data = await getAnalyticsPageData();
  if (data.isNewUser) redirect("/app/onboarding");

  return <AnalyticsView trends={data.trends} achievements={data.achievements} />;
}
