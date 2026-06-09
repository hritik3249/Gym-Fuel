function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className ?? ""}`} />;
}

export default function WeightLoading() {
  return (
    <div className="container grid gap-4 py-4 sm:py-6" aria-hidden>
      <div className="surface-glass rounded-lg p-4 sm:p-6">
        <Pulse className="mb-1 h-3 w-16" />
        <Pulse className="h-7 w-36" />
      </div>

      {/* Log form */}
      <div className="rounded-xl border border-border bg-card p-4">
        <Pulse className="mb-4 h-5 w-24" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[0,1,2].map(i => (
            <div key={i}>
              <Pulse className="mb-1.5 h-3 w-20" />
              <Pulse className="h-10 w-full" />
            </div>
          ))}
        </div>
        <Pulse className="mt-3 h-10 w-28" />
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <Pulse className="mb-4 h-5 w-32" />
        <Pulse className="h-48 w-full" />
      </div>

      {/* Log list */}
      <div className="rounded-xl border border-border bg-card p-4">
        <Pulse className="mb-4 h-5 w-28" />
        <div className="grid gap-2">
          {[0,1,2,3].map(i => <Pulse key={i} className="h-12 w-full" />)}
        </div>
      </div>
    </div>
  );
}
