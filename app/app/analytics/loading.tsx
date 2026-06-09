function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className ?? ""}`} />;
}

export default function AnalyticsLoading() {
  return (
    <div className="container grid gap-4 py-4 sm:py-6" aria-hidden>
      <div className="surface-glass rounded-lg p-4 sm:p-6">
        <Pulse className="mb-1 h-3 w-20" />
        <Pulse className="h-7 w-40" />
      </div>

      {/* Achievement badges */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[0,1,2].map(i => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <Pulse className="mb-2 h-4 w-28" />
            <Pulse className="mb-3 h-3 w-36" />
            <Pulse className="h-2.5 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="rounded-xl border border-border bg-card p-4">
        <Pulse className="mb-4 h-5 w-32" />
        <Pulse className="h-48 w-full" />
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <Pulse className="mb-4 h-5 w-28" />
        <Pulse className="h-48 w-full" />
      </div>
    </div>
  );
}
