"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

function localDateISO(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * Invisible component that fires once on mount.
 * If the URL's ?date= param doesn't match the client's local date
 * (e.g. after midnight IST while UTC is still the previous day),
 * it silently replaces the URL so the server re-renders with the
 * correct date. No-op when dates already match (the common case).
 */
export function DateSync() {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const localDate = localDateISO();
    const urlDate   = searchParams.get("date");
    if (urlDate === localDate) return;          // already correct — nothing to do
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", localDate);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);                                       // intentionally runs once on mount only

  return null;
}
