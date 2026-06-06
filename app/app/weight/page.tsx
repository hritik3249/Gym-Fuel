import { WeightView } from "@/components/weight-view";
import { getDashboardSnapshot } from "@/lib/queries/dashboard";

export default async function WeightPage() {
  const snapshot = await getDashboardSnapshot();

  return <WeightView logs={snapshot.weightLogs} />;
}
