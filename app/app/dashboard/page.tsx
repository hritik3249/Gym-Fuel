import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard";
import { DateSync } from "@/components/date-sync";
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
    <>
      {/* Silently updates ?date= to the client's local date if it differs from UTC.
          Triggers one extra server render only when there is a timezone mismatch
          (e.g. between midnight IST and 05:30 IST). No-op the rest of the day. */}
      <Suspense>
        <DateSync />
      </Suspense>
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
    </>
  );
}
