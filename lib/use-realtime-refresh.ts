"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

/** Subscribes to Postgres changes on the given tables and refreshes the current route when they fire. */
export function useRealtimeRefresh(tables: string[]) {
  const router = useRouter();
  const tablesKey = tables.join(",");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("fueltrack-live-dashboard");

    for (const table of tablesKey.split(",")) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => router.refresh());
    }

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, tablesKey]);
}
