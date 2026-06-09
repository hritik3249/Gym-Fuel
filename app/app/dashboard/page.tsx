import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { getDashboardSnapshot } from "@/lib/queries/dashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const snapshot = await getDashboardSnapshot(date);
  if (snapshot.isNewUser) redirect("/app/onboarding");

  return (
    <Dashboard
      goals={snapshot.goals}
      totals={snapshot.totals}
      water={snapshot.water}
      weight={snapshot.currentWeight}
      entries={snapshot.entries}
      trends={snapshot.trends}
      weights={snapshot.weightLogs}
      streak={snapshot.streak}
    />
  );
}
