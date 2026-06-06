import { achievements, seedFoods, todayEntries, trends, waterLogs, weightLogs } from "@/lib/demo-data";
import { defaultGoals, sumEntries, waterTotal } from "@/lib/nutrition";

export async function getDashboardSnapshot() {
  const totals = sumEntries(todayEntries);
  const water = waterTotal(waterLogs);
  const latestWeight = weightLogs.at(-1);

  return {
    goals: defaultGoals,
    totals,
    water,
    currentWeight: latestWeight?.weightKg ?? 0,
    entries: todayEntries,
    foods: seedFoods,
    waterLogs,
    weightLogs,
    trends,
    achievements,
    streak: 12
  };
}
