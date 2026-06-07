import React from "react";
import { AlertTriangle, CircleAlert, FileWarning, Link2Off, MapPinned, ShieldAlert } from "lucide-react";

import { Card } from "@/components/ui";
import type { DashboardTraceabilityGapCategoryVM } from "@/lib/dashboard-metrics";
import type { StatusTone } from "@/lib/ui-semantics";

const TONE_COLOR_MAP: Record<StatusTone | "neutral", string> = {
  approved: "var(--risk-negligible)",
  active: "var(--risk-negligible)",
  ready: "var(--risk-negligible)",
  pending: "var(--state-info)",
  pending_response: "var(--state-info)",
  pending_approval: "var(--state-info)",
  review: "var(--risk-medium)",
  review_required: "var(--risk-medium)",
  under_review: "var(--risk-medium)",
  blocked: "var(--risk-high)",
  held: "var(--risk-critical)",
  changes_requested: "var(--risk-high)",
  requested: "var(--state-info)",
  current: "var(--state-info)",
  draft: "var(--fos-text-muted)",
  superseded: "var(--fos-text-muted)",
  info: "var(--state-info)",
  neutral: "var(--fos-border-strong)",
};

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "Missing Origin Data": MapPinned,
  "Missing Supplier Declaration": ShieldAlert,
  "Missing Chain-of-Custody Document": FileWarning,
  "Expired Certificates": AlertTriangle,
  "Unverified Upstream Supplier": CircleAlert,
  "Missing Consignment Linkage": Link2Off,
};

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function TraceabilityGapsByCategoryCard({
  categories,
}: {
  categories: DashboardTraceabilityGapCategoryVM[];
}) {
  const total = categories.reduce((sum, category) => sum + category.count, 0);

  // Enforce display order to match provided image
  const DESIRED_ORDER = [
    "Missing Origin Data",
    "Missing Supplier Declaration",
    "Missing Chain-of-Custody Document",
    "Expired Certificates",
    "Unverified Upstream Supplier",
    "Missing Consignment Linkage",
  ];

  const orderedCategories = [...categories].sort((a, b) => {
    const ai = DESIRED_ORDER.indexOf(a.label);
    const bi = DESIRED_ORDER.indexOf(b.label);
    const ia = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const ib = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    return ia - ib || a.label.localeCompare(b.label);
  });
  const maxCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <Card className="flex flex-col gap-4 overflow-hidden border border-border-soft bg-bg-surface p-5 shadow-glow">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-brand-primary">Supplier Traceability Gaps</h3>
      </div>

      <div className="mt-1 grid gap-1">
        {orderedCategories.map((category) => {
          const Icon = CATEGORY_ICON_MAP[category.label] ?? AlertTriangle;
          const barColor = TONE_COLOR_MAP[category.tone];
          const percent = total > 0 ? (category.count / total) * 100 : 0;
          const displayPercent = Math.max(2, Number(percent.toFixed(1)));
          const widthPercent = Math.max(7, (category.count / maxCount) * 100);

          return (
            <div
              key={category.id}
              className="grid grid-cols-[minmax(0,1fr)_36px] items-center gap-2 md:grid-cols-[96px_36px_minmax(0,1fr)]"
            >
              <div className="text-[10px] font-semibold text-text-secondary leading-snug">
                {category.label}
              </div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-soft bg-bg-surface-alt"
                style={{
                  color: barColor,
                }}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="col-span-2 flex items-center gap-2 md:col-span-1 md:col-start-3">
                <div className="relative h-4 w-full overflow-hidden rounded-[6px] bg-bg-surface-alt border border-border-soft/20">
                  <div
                    className="h-full rounded-[6px] transition-all"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
                <span className="min-w-[30px] text-right text-[10px] font-bold" style={{ color: barColor }}>
                  {formatCount(category.count)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
