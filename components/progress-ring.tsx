import { cn, formatNumber } from "@/lib/utils";

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const RING_COLORS = {
  emerald: "stroke-emerald-500",
  sky: "stroke-sky-500",
  amber: "stroke-amber-500",
  rose: "stroke-rose-500",
  violet: "stroke-violet-500"
} as const;

export type ProgressRingTone = keyof typeof RING_COLORS;

export type ProgressRingProps = {
  value: number;
  goal: number;
  label: string;
  unit: string;
  tone?: ProgressRingTone;
};

export function ProgressRing({ value, goal, label, unit, tone = "emerald" }: ProgressRingProps) {
  const percent = goal ? Math.min(value / goal, 1) : 0;
  const offset = CIRCUMFERENCE - percent * CIRCUMFERENCE;
  const remaining = Math.max(goal - value, 0);

  return (
    <div className="flex items-center gap-3">
      <div className="group relative size-20 shrink-0 cursor-default transition-transform duration-200 ease-out hover:scale-105 active:scale-95">
        <svg className="-rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={RADIUS} className="stroke-muted" strokeWidth="10" fill="none" />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            className={cn("transition-all duration-700 ease-out group-hover:drop-shadow-[0_0_6px_currentColor]", RING_COLORS[tone])}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold leading-none">{Math.round(percent * 100)}%</span>
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-xl font-bold leading-tight tracking-tight">
          {formatNumber(value, unit === "kg" ? 1 : 0)}
        </p>
        <p className="text-xs text-muted-foreground">
          / {formatNumber(goal)} {unit}
        </p>
        {remaining > 0 && (
          <p className="text-[11px] text-muted-foreground/70">{formatNumber(remaining, 0)} left</p>
        )}
      </div>
    </div>
  );
}
