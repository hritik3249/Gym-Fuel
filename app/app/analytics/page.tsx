"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalyticsView } from "@/components/analytics-view";
import { getAnalyticsPageData } from "@/lib/actions/page-data";
import { cacheGet, cacheSet } from "@/lib/tab-cache";
import AnalyticsLoading from "./loading";
import type { AnalyticsPageData } from "@/lib/queries/dashboard";

const KEY = "analytics";

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsPageData | null>(() => cacheGet(KEY) ?? null);

  useEffect(() => {
    getAnalyticsPageData().then((d) => {
      if (d.isNewUser) { router.replace("/app/onboarding"); return; }
      cacheSet(KEY, d);
      setData(d);
    });
  }, [router]);

  if (!data) return <AnalyticsLoading />;
  return <AnalyticsView trends={data.trends} achievements={data.achievements} goals={data.goals} />;
}
