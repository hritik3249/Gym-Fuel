"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";
import { notifyDataChanged } from "@/lib/tab-cache";

/** Subscribes to Postgres changes on the given tables and fires the in-app
 *  data-changed event so always-mounted tabs refetch. (Previously called
 *  router.refresh(), which re-rendered the whole route and wiped client
 *  state like the food search — the pages are client-side now, so a server
 *  refresh is both destructive and useless.) */
export function useRealtimeRefresh(tables: string[]) {
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
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => notifyDataChanged());
    }

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tablesKey]);
}
