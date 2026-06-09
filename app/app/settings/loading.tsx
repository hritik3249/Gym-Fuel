function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className ?? ""}`} />;
}

export default function SettingsLoading() {
  return (
    <div className="container grid gap-4 py-4 sm:py-6" aria-hidden>
      <div className="surface-glass rounded-lg p-4 sm:p-6">
        <Pulse className="mb-1 h-3 w-16" />
        <Pulse className="h-8 w-56" />
      </div>

      {/* Profile card */}
      <div className="rounded-xl border border-border bg-card p-4">
        <Pulse className="mb-4 h-5 w-36" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className={i === 0 ? "sm:col-span-2" : ""}>
              <Pulse className="mb-1.5 h-3 w-20" />
              <Pulse className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <Pulse className="h-10 w-36" />
          <Pulse className="h-10 w-28" />
        </div>
      </div>

      {/* Goals card */}
      <div className="rounded-xl border border-border bg-card p-4">
        <Pulse className="mb-4 h-5 w-28" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0,1,2,3,4,5].map(i => <Pulse key={i} className="h-20" />)}
        </div>
      </div>

      {/* Reminders card */}
      <div className="rounded-xl border border-border bg-card p-4">
        <Pulse className="mb-4 h-5 w-32" />
        <div className="grid gap-3">
          {[0,1,2,3].map(i => <Pulse key={i} className="h-14" />)}
        </div>
      </div>
    </div>
  );
}
