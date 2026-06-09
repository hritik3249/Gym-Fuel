import { redirect } from "next/navigation";
import { FoodLogger } from "@/components/food-logger";
import { getFoodsPageData } from "@/lib/queries/dashboard";

export default async function FoodsPage() {
  const data = await getFoodsPageData();
  if (data.isNewUser) redirect("/app/onboarding");

  return <FoodLogger foods={data.foods} initialEntries={data.entries} serverDate={data.serverDate} />;
}
