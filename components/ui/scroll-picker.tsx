"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

const ITEM_H = 44;   // px per item
const VISIBLE = 5;   // items shown (odd — centre = selected)
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;   // 88px top/bottom pad

function buildValues(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  // Use integer arithmetic to avoid floating-point drift
  const factor = Math.round(1 / step);
  const iMin = Math.round(min * factor);
  const iMax = Math.round(max * factor);
  for (let i = iMin; i <= iMax; i++) {
    out.push(i / factor);
  }
  return out;
}

function fmt(v: number, step: number) {
  return step < 1 ? v.toFixed(1) : String(v);
}

export interface ScrollPickerProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  label?: string;
  unit?: string;
  className?: string;
}

export function ScrollPicker({
  min, max, step = 1, value: rawValue, onChange, label, unit, className
}: ScrollPickerProps) {
  // Guard against NaN / undefined coming from parent
  const value = Number.isFinite(rawValue) ? rawValue : min;
  const containerRef = useRef<HTMLDivElement>(null);
  const values = buildValues(min, max, step);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to value whenever it changes externally
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = values.findIndex(v => Math.abs(v - value) < step * 0.5);
    if (idx >= 0) el.scrollTop = idx * ITEM_H;
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));
    const snapped = values[clamped];
    if (snapped !== undefined && Math.abs(snapped - value) >= step * 0.01) {
      onChange(snapped);
    }
    // Snap scroll position
    el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
  }, [values, value, onChange, step]);

  const onScroll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(commit, 80);
  }, [commit]);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      )}
      <div className="relative select-none" style={{ width: 88 }}>
        {/* Fade masks */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-background to-transparent" />
        {/* Selection highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 z-10 rounded-lg border border-primary/40 bg-primary/10"
          style={{ top: PAD, height: ITEM_H }}
        />
        {/* Scroll container */}
        <div
          ref={containerRef}
          onScroll={onScroll}
          className="overflow-y-scroll scrollbar-none"
          style={{
            height: VISIBLE * ITEM_H,
            paddingTop: PAD,
            paddingBottom: PAD,
            scrollSnapType: "y mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {values.map((v) => (
            <div
              key={v}
              onClick={() => {
                const idx = values.indexOf(v);
                containerRef.current?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
                onChange(v);
              }}
              className={cn(
                "flex cursor-pointer items-center justify-center text-center font-semibold transition-all duration-150",
                Math.abs(v - value) < step * 0.5
                  ? "text-base text-foreground"
                  : Math.abs(v - value) < step * 1.5
                  ? "text-sm text-muted-foreground/70"
                  : "text-xs text-muted-foreground/30"
              )}
              style={{ height: ITEM_H, scrollSnapAlign: "center" }}
            >
              {fmt(v, step)}
            </div>
          ))}
        </div>
      </div>
      {unit && (
        <p className="text-sm font-medium text-muted-foreground">{unit}</p>
      )}
    </div>
  );
}
