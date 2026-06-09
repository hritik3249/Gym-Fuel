"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    /* Backdrop — no blur, no transforms, just a dark overlay */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet — no animation, no willChange, no transform */}
      <div
        className="w-full max-w-sm rounded-t-2xl border border-border bg-card p-6 sm:rounded-2xl"
        onMouseDown={(e) => e.stopPropagation()}
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
            onMouseDown={onClose}
            className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Picker */}
        <div className="flex justify-center">
          <ScrollPicker
            min={min} max={max} step={step}
            value={draft} onChange={setDraft}
            unit={unit}
          />
        </div>

        {/* Confirm */}
        <button
          onMouseDown={() => { onConfirm(draft); onClose(); }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Check className="size-4" />
          Set {label}
        </button>
      </div>
    </div>
  );
}
