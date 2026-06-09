function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className ?? ""}`} />;
}

export default function FoodsLoading() {
  return (
    <div className="container grid gap-4 py-4 sm:py-6" aria-hidden>
      {/* Header with date nav + search */}
      <div className="surface-glass rounded-lg p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Pulse className="size-8 rounded-full" />
          <Pulse className="h-4 w-28" />
          <Pulse className="size-8 rounded-full" />
        </div>
        <Pulse className="mb-1 h-3 w-16" />
        <Pulse className="mb-5 h-7 w-44" />
        <div className="flex gap-3">
          <Pulse className="h-10 flex-1" />
          <Pulse className="h-10 w-44" />
        </div>
      </div>

      {/* Food list */}
      <div className="rounded-xl border border-border bg-card p-4">
        <Pulse className="mb-4 h-5 w-32" />
        <div className="grid gap-3">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex-1">
                <Pulse className="mb-2 h-4 w-40" />
                <Pulse className="h-3 w-56" />
              </div>
              <Pulse className="ml-4 h-9 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
