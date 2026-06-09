"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const ITEM_H = 44;
const VISIBLE = 5;
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;

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
  const value          = Number.isFinite(rawValue) ? rawValue : min;
  const containerRef   = useRef<HTMLDivElement>(null);
  const isUserScroll   = useRef(false);
  const isProgrammatic = useRef(false);
  const commitTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // liveIdx: which slot is currently centred while the finger/mouse is moving.
  // null = not scrolling → fall back to the committed value for highlighting.
  const [liveIdx, setLiveIdx] = useState<number | null>(null);

  const values = useMemo(() => buildValues(min, max, step), [min, max, step]);

  // Derive the committed index from the value prop
  const committedIdx = values.findIndex(v => Math.abs(v - value) < step * 0.5);

  // What to highlight: live position while scrolling, committed when still
  const activeIdx = liveIdx ?? (committedIdx >= 0 ? committedIdx : 0);

  // Scroll to value when it changes externally
  useEffect(() => {
    if (isUserScroll.current) return;
    const el = containerRef.current;
    if (!el) return;
    const idx = values.findIndex(v => Math.abs(v - value) < step * 0.5);
    if (idx < 0) return;
    isProgrammatic.current = true;
    el.scrollTop = idx * ITEM_H;
    requestAnimationFrame(() => { isProgrammatic.current = false; });
  }, [value, values, step]);

  const commit = useCallback(() => {
    isUserScroll.current = false;
    setLiveIdx(null);  // stop live highlighting — snap to committed value
    const el = containerRef.current;
    if (!el) return;
    const idx     = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));
    const snapped = values[clamped];
    if (snapped === undefined) return;
    isProgrammatic.current = true;
    el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
    requestAnimationFrame(() => { isProgrammatic.current = false; });
    onChange(snapped);
  }, [values, onChange]);

  const onScroll = useCallback(() => {
    if (isProgrammatic.current) return;
    isUserScroll.current = true;

    // Update highlighted item in real-time as each number passes through centre
    const el = containerRef.current;
    if (el) {
      const idx = Math.round(el.scrollTop / ITEM_H);
      setLiveIdx(Math.max(0, Math.min(idx, values.length - 1)));
    }

    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(commit, 120);
  }, [commit, values]);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      )}
      <div className="relative select-none" style={{ width: 88 }}>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-background to-transparent" />
        <div
          className="pointer-events-none absolute inset-x-0 z-10 rounded-lg border border-primary/40 bg-primary/10"
          style={{ top: PAD, height: ITEM_H }}
        />
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
          {values.map((v, i) => (
            <div
              key={v}
              onClick={() => {
                isProgrammatic.current = true;
                containerRef.current?.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
                requestAnimationFrame(() => { isProgrammatic.current = false; });
                onChange(v);
              }}
              className={cn(
                "flex cursor-pointer items-center justify-center text-center font-semibold transition-all duration-75",
                i === activeIdx
                  ? "text-base text-foreground"
                  : Math.abs(i - activeIdx) === 1
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
