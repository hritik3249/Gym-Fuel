import { cn } from "@/lib/utils";

export type ProgressProps = {
  value: number;
  className?: string;
  indicatorClassName?: string;
};

export function Progress({ value, className, indicatorClassName }: ProgressProps) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className={cn("h-full rounded-full bg-primary transition-all", indicatorClassName)}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}
