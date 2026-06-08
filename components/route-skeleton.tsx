/** Shown instantly while a route's server data streams in, so navigation feels immediate on slow connections. */
export function RouteSkeleton() {
  return (
    <div className="container grid gap-4 py-4 sm:py-6" aria-hidden="true">
      <div className="surface-glass h-32 animate-pulse rounded-lg bg-muted/40" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="h-40 animate-pulse rounded-lg bg-muted/40" />
        <div className="h-40 animate-pulse rounded-lg bg-muted/40" />
        <div className="h-40 animate-pulse rounded-lg bg-muted/40 sm:col-span-2 xl:col-span-1" />
      </div>
      <div className="h-72 animate-pulse rounded-lg bg-muted/40" />
    </div>
  );
}
