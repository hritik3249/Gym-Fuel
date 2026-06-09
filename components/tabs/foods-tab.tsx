"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FoodLogger } from "@/components/food-logger";
import { getFoodsPageData } from "@/lib/actions/page-data";
import { cacheGet, cacheSet } from "@/lib/tab-cache";
import FoodsLoading from "@/app/app/foods/loading";
import type { FoodsPageData } from "@/lib/queries/dashboard";

const KEY = "foods";

export function FoodsTab() {
  const router = useRouter();
  const [data, setData] = useState<FoodsPageData | null>(() => cacheGet(KEY) ?? null);

  useEffect(() => {
    getFoodsPageData().then((d) => {
      if (d.isNewUser) { router.replace("/app/onboarding"); return; }
      cacheSet(KEY, d);
      setData(d);
    });
  }, [router]);

  if (!data) return <FoodsLoading />;
  return <FoodLogger foods={data.foods} initialEntries={data.entries} serverDate={data.serverDate} />;
}
