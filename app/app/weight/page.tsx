import { redirect } from "next/navigation";
import { WeightView } from "@/components/weight-view";
import { getWeightPageData } from "@/lib/queries/dashboard";

export default async function WeightPage() {
  const data = await getWeightPageData();
  if (data.isNewUser) redirect("/app/onboarding");

  return <WeightView logs={data.weightLogs} />;
}
