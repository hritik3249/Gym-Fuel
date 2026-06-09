"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

const ITEM_H = 44;
const VISIBLE = 5;
const PAD = ((VISIBLE - 1) / 2) * ITEM_H; // 88px

function buildValues(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  const count = Math.round((max - min) / step);
  for (let i = 0; i <= count; i++) {
    out.push(Math.round((min + i * step) * 1000) / 1000);
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
  const value = Number.isFinite(rawValue) ? rawValue : min;
  const containerRef  = useRef<HTMLDivElement>(null);
  const isScrolling   = useRef(false);   // true while user is actively scrolling
  const commitTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const values        = buildValues(min, max, step);

  // Scroll to the current value — but ONLY when user is not scrolling
  // (prevents the feedback loop that causes the glitch)
  useEffect(() => {
    if (isScrolling.current) return;
    const el = containerRef.current;
    if (!el) return;
    const idx = values.findIndex(v => Math.abs(v - value) < step * 0.5);
    if (idx >= 0) el.scrollTop = idx * ITEM_H;
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Called once scrolling stops — snap to nearest item and notify parent
  const commit = useCallback(() => {
    isScrolling.current = false;
    const el = containerRef.current;
    if (!el) return;

    const idx     = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));
    const snapped = values[clamped];

    // Smooth-snap the scroll position
    el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });

    if (snapped !== undefined) onChange(snapped);
  }, [values, onChange]);

  const onScroll = useCallback(() => {
    isScrolling.current = true;
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(commit, 120);
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
                "flex cursor-pointer items-center justify-center text-center font-semibold transition-colors duration-100",
                Math.abs(v - value) < step * 0.5
                  ? "text-base text-foreground"
                  : Math.abs(v - value) < step * 1.5
                  ? "text-sm text-muted-foreground/60"
                  : "text-xs text-muted-foreground/25"
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
