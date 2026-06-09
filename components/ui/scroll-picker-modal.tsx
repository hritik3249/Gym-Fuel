"use client";

import { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { ScrollPicker } from "@/components/ui/scroll-picker";

interface ScrollPickerModalProps {
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onConfirm: (v: number) => void;
  onClose: () => void;
}

export function ScrollPickerModal({
  label, unit, min, max, step = 1, value, onConfirm, onClose
}: ScrollPickerModalProps) {
  const [draft, setDraft] = useState(value);
  // Track whether the sheet has mounted — animation runs exactly once
  const sheetRef = useRef<HTMLDivElement>(null);
  const didMount = useRef(false);

  // One-shot entrance animation on mount only
  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;
    const el = sheetRef.current;
    if (!el) return;
    el.style.transform = "translateY(40px)";
    el.style.opacity = "0";
    // Force a paint then transition in
    requestAnimationFrame(() => {
      el.style.transition = "transform 220ms cubic-bezier(0.22,1,0.36,1), opacity 180ms ease";
      el.style.transform = "translateY(0)";
      el.style.opacity = "1";
    });
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    /* Backdrop — absorbs all pointer events so nothing bleeds through */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      // Stop wheel events at the backdrop so hovering outside can't scroll the picker
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Sheet — no Tailwind animation class, animated via ref above */}
      <div
        ref={sheetRef}
        className="w-full max-w-sm rounded-t-2xl border border-border bg-card p-6 sm:rounded-2xl"
        style={{ willChange: "transform, opacity" }}
        // Prevent any wheel/pointer events leaking out of the sheet
        onWheel={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">
              {step < 1 ? draft.toFixed(1) : Math.round(draft)}{" "}
              <span className="text-base font-normal text-muted-foreground">{unit}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Picker — wheel events contained inside */}
        <div
          className="flex justify-center"
          onWheel={(e) => e.stopPropagation()}
        >
          <ScrollPicker
            min={min} max={max} step={step}
            value={draft} onChange={setDraft}
            unit={unit}
          />
        </div>

        {/* Confirm */}
        <button
          onClick={() => { onConfirm(draft); onClose(); }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Check className="size-4" />
          Set {label}
        </button>
      </div>
    </div>
  );
}
