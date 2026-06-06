import { cn, formatNumber } from "@/lib/utils";

export function ProgressRing({ value, goal, label, unit, tone = "emerald" }: { value: number; goal: number; label: string; unit: string; tone?: "emerald" | "sky" | "amber" | "rose" | "violet"; }) {
  const percent = goal ? Math.min(value / goal, 1) : 0;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - percent * circumference;
  const colorClass = { emerald: "stroke-emerald-500", sky: "stroke-sky-500", amber: "stroke-amber-500", rose: "stroke-rose-500", violet: "stroke-violet-500" }[tone];

  return (
    <div className="flex items-center gap-3">
      <div className="relative size-24 shrink-0">
        <svg className="-rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" className="stroke-muted" strokeWidth="10" fill="none" />
          <circle cx="50" cy="50" r="42" className={cn("transition-all", colorClass)} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold">{Math.round(percent * 100)}%</span>
          <span className="text-[11px] text-muted-foreground">{unit}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-2xl font-bold tracking-tight">
          {formatNumber(value, unit === "kg" ? 1 : 0)}
          <span className="text-sm font-medium text-muted-foreground"> / {formatNumber(goal)} {unit}</span>
        </p>
        <p className="text-xs text-muted-foreground">{formatNumber(Math.max(goal - value, 0))} remaining</p>
      </div>
    </div>
  );
}
