import { Dashboard } from "@/components/dashboard";
import { getDashboardSnapshot } from "@/lib/queries/dashboard";

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();
  return <Dashboard goals={snapshot.goals} totals={snapshot.totals} water={snapshot.water} weight={snapshot.currentWeight} entries={snapshot.entries} trends={snapshot.trends} weights={snapshot.weightLogs} streak={snapshot.streak} />;
}
