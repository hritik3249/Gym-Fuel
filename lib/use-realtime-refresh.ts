"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";

/** Subscribes to Postgres changes on the given tables and refreshes the current route when they fire. */
export function useRealtimeRefresh(tables: string[]) {
  const router = useRouter();
  const tablesKey = tables.join(",");
  // Every mount needs its own channel name — sharing one across pages makes Supabase
  // treat concurrent mount/unmount pairs (e.g. during navigation) as the same channel,
  // so subscriptions silently stop firing after the first route change.
  const channelNameRef = useRef<string>(undefined);
  if (!channelNameRef.current) {
    channelNameRef.current = `fueltrack-live-${crypto.randomUUID()}`;
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(channelNameRef.current!);

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
