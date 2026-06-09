"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SettingsView } from "@/components/settings-view";
import { getSettingsPageData } from "@/lib/actions/page-data";
import { cacheGet, cacheSet } from "@/lib/tab-cache";
import SettingsLoading from "./loading";
import type { SettingsPageData } from "@/lib/actions/page-data";

const KEY = "settings";

export default function SettingsPage() {
  const router = useRouter();
  const [data, setData] = useState<SettingsPageData | null>(() => cacheGet(KEY) ?? null);

  useEffect(() => {
    getSettingsPageData().then((d) => {
      if (d.isNewUser) { router.replace("/app/onboarding"); return; }
      cacheSet(KEY, d);
      setData(d);
    });
  }, [router]);

  if (!data) return <SettingsLoading />;
  return <SettingsView goals={data.goals} profile={data.profile} reminders={data.reminders} />;
}
