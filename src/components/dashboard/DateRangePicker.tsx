"use client";

import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import "react-day-picker/dist/style.css";

// CSS Custom overrides for react-day-picker to match GFI theme
const dayPickerStyles = `
  .rdp {
    --rdp-cell-size: 34px;
    --rdp-accent-color: var(--fos-brand-primary, #0E5A46);
    --rdp-background-color: var(--fos-brand-accent-soft, #e8f4ed);
    margin: 0;
  }
  .rdp-day_selected, .rdp-day_selected:focus, .rdp-day_selected:hover {
    background-color: var(--rdp-accent-color) !important;
    color: white !important;
    font-weight: bold;
    border-radius: 6px;
  }
  .rdp-day_range_middle {
    background-color: var(--rdp-background-color) !important;
    color: var(--rdp-accent-color) !important;
    border-radius: 0;
  }
  .rdp-day_range_start {
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
  }
  .rdp-day_range_end {
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
  }
  .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
    background-color: #f1f5f9;
    border-radius: 6px;
  }
`;

interface DateRangePickerProps {
  value: { from: Date | undefined; to: Date | undefined };
  onChange: (value: { from: Date | undefined; to: Date | undefined }) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRangeChange = (range: DateRange | undefined) => {
    onChange({ from: range?.from, to: range?.to });
  };

  const setPreset = (preset: string) => {
    const today = new Date();
    if (preset === "april2026") {
      onChange({
        from: new Date(Date.UTC(2026, 3, 1)),
        to: new Date(Date.UTC(2026, 3, 30)),
      });
    } else if (preset === "midapril2026") {
      onChange({
        from: new Date(Date.UTC(2026, 3, 15)),
        to: new Date(Date.UTC(2026, 3, 20)),
      });
    } else if (preset === "last30") {
      const from = new Date();
      from.setDate(today.getDate() - 30);
      onChange({ from, to: today });
    } else if (preset === "all") {
      onChange({ from: undefined, to: undefined });
    }
    setIsOpen(false);
  };

  const formattedLabel = () => {
    if (!value.from) return "All Time (No Filter)";
    if (!value.to) return `${format(value.from, "dd MMM yyyy")} - ...`;
    return `${format(value.from, "dd MMM yyyy")} - ${format(value.to, "dd MMM yyyy")}`;
  };

  // Convert internal state to react-day-picker structure
  const range: DateRange = {
    from: value.from,
    to: value.to,
  };

  return (
    <div className="relative" ref={containerRef}>
      <style>{dayPickerStyles}</style>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border-soft bg-white/70 px-3 py-2 text-xs font-semibold text-brand-primary shadow-sm backdrop-blur-sm transition-all hover:bg-bg-surface-alt hover:border-brand-primary/30"
      >
        <CalendarIcon className="h-4 w-4 text-brand-primary" />
        <span>{formattedLabel()}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-text-muted transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-[100] mt-1.5 flex gap-4 rounded-xl border border-border-soft bg-white/95 p-4 shadow-xl backdrop-blur-md animate-fadeIn min-w-[480px]">
          {/* Quick presets left column */}
          <div className="flex flex-col gap-1.5 border-r border-border-soft/60 pr-4 w-40 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 px-2">Presets</span>
            <button
              type="button"
              onClick={() => setPreset("april2026")}
              className="rounded-lg px-2 py-1.5 text-left text-xs font-medium text-brand-primary hover:bg-brand-accent-soft/45 transition-colors"
            >
              Full April 2026 (Active)
            </button>
            <button
              type="button"
              onClick={() => setPreset("midapril2026")}
              className="rounded-lg px-2 py-1.5 text-left text-xs font-medium text-brand-primary hover:bg-brand-accent-soft/45 transition-colors"
            >
              Mid April (15-20)
            </button>
            <button
              type="button"
              onClick={() => setPreset("last30")}
              className="rounded-lg px-2 py-1.5 text-left text-xs font-medium text-brand-primary hover:bg-brand-accent-soft/45 transition-colors"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setPreset("all")}
              className="rounded-lg px-2 py-1.5 text-left text-xs font-medium text-text-secondary hover:bg-bg-surface-alt transition-colors"
            >
              All Time (Reset)
            </button>
          </div>

          {/* Calendar Picker right column */}
          <div className="flex flex-col select-none">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={handleRangeChange}
              numberOfMonths={1}
              defaultMonth={value.from || new Date(Date.UTC(2026, 3, 1))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
