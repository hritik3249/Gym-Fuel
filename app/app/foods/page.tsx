import { redirect } from "next/navigation";
import { FoodLogger } from "@/components/food-logger";
import { getDashboardSnapshot } from "@/lib/queries/dashboard";

export default async function FoodsPage() {
  const snapshot = await getDashboardSnapshot();
  if (snapshot.isNewUser) redirect("/app/onboarding");

  return <FoodLogger foods={snapshot.foods} initialEntries={snapshot.entries} />;
}
