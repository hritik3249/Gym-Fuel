function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className ?? ""}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="container grid gap-4 py-4 sm:py-6" aria-hidden>
      {/* Hero glass card */}
      <div className="surface-glass rounded-lg p-4 sm:p-6">
        <Pulse className="mb-1 h-3 w-20" />
        <Pulse className="mb-5 h-7 w-40" />
        <div className="grid grid-cols-4 gap-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Pulse className="size-16 rounded-full" />
              <Pulse className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Water + streak row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <Pulse className="mb-3 h-4 w-24" />
          <div className="flex gap-2">
            {[0,1,2,3].map(i => <Pulse key={i} className="h-9 flex-1" />)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Pulse className="mb-3 h-4 w-20" />
          <Pulse className="mb-3 h-2.5 w-full rounded-full" />
          <Pulse className="h-4 w-28" />
        </div>
      </div>

      {/* Meal cards */}
      {[0,1,2,3].map(i => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex justify-between">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-4 w-16" />
          </div>
          <Pulse className="h-14 w-full" />
        </div>
      ))}
    </div>
  );
}
