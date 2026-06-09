"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { getDashboardSnapshot } from "@/lib/actions/page-data";
import { cacheGet, cacheSet } from "@/lib/tab-cache";
import DashboardLoading from "@/app/app/dashboard/loading";
import type { DashboardSnapshot } from "@/lib/queries/dashboard";

function localDateISO() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}

export function DashboardTab() {
  const router = useRouter();
  const [today] = useState(localDateISO);
  const cacheKey = `dashboard:${today}`;
  const [data, setData] = useState<DashboardSnapshot | null>(() => cacheGet(cacheKey) ?? null);

  useEffect(() => {
    getDashboardSnapshot(today).then((d) => {
      if (d.isNewUser) { router.replace("/app/onboarding"); return; }
      cacheSet(cacheKey, d);
      setData(d);
    });
  }, [today, cacheKey, router]);

  if (!data) return <DashboardLoading />;
  return (
    <Dashboard
      goals={data.goals}
      totals={data.totals}
      water={data.water}
      weight={data.currentWeight}
      entries={data.entries}
      trends={data.trends}
      weights={data.weightLogs}
      streak={data.streak}
    />
  );
}
