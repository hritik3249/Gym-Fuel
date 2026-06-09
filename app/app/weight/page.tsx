"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WeightView } from "@/components/weight-view";
import { getWeightPageData } from "@/lib/actions/page-data";
import { cacheGet, cacheSet } from "@/lib/tab-cache";
import WeightLoading from "./loading";
import type { WeightPageData } from "@/lib/queries/dashboard";

const KEY = "weight";

export default function WeightPage() {
  const router = useRouter();
  const [data, setData] = useState<WeightPageData | null>(() => cacheGet(KEY) ?? null);

  useEffect(() => {
    getWeightPageData().then((d) => {
      if (d.isNewUser) { router.replace("/app/onboarding"); return; }
      cacheSet(KEY, d);
      setData(d);
    });
  }, [router]);

  if (!data) return <WeightLoading />;
  return <WeightView logs={data.weightLogs} />;
}
