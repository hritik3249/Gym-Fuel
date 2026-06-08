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

  return (
    <div className="flex items-center gap-3">
      <div className="relative size-24 shrink-0">
        <svg className="-rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={RADIUS} className="stroke-muted" strokeWidth="10" fill="none" />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            className={cn("transition-all duration-700 ease-out", RING_COLORS[tone])}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
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
