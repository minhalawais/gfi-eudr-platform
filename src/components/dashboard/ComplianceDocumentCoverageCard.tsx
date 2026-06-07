"use client";

import React from "react";
import {
  BadgeCheck,
  ClipboardCheck,
  FileCheck2,
  FileClock,
  Files,
  GitBranch,
  Handshake,
  Info,
  MapPinned,
  PackageSearch,
  Scale,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui";
import type { ComplianceDocumentCategory, DashboardComplianceDocumentCoverageVM } from "@/lib/dashboard-metrics";

const CATEGORY_ICON_MAP: Record<ComplianceDocumentCategory, LucideIcon> = {
  "Agreements & Contracts": Handshake,
  "Certificates & Declarations": BadgeCheck,
  "Product & Ingredient Documents": PackageSearch,
  "Chain of Custody (CoC) Documents": GitBranch,
  "Geolocation & Mapping Records": MapPinned,
  "Legal & Permit Documents": Scale,
  "Audit & Assessment Reports": ClipboardCheck,
  "Policies & Procedures": ScrollText,
  "Due Diligence Documents": ShieldCheck,
};

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getToneClasses(tone: DashboardComplianceDocumentCoverageVM["categories"][number]["tone"]) {
  switch (tone) {
    case "ready":
      return "border-state-success/25 bg-state-success/5 text-state-success";
    case "held":
    case "blocked":
      return "border-state-error/25 bg-state-error/5 text-state-error";
    case "under_review":
    case "review_required":
      return "border-state-warning/25 bg-state-warning/5 text-state-warning";
    default:
      return "border-border-soft bg-bg-surface-alt text-text-secondary";
  }
}

// Supplier status main color palette (kept in same order used elsewhere)
const SUPPLIER_MAIN_COLORS = ["#22c55e", "#f59e0b", "#f97316", "#ef4444", "#6366f1"];

function StatusSegment({
  value,
  total,
  className,
}: {
  value: number;
  total: number;
  className: string;
}) {
  if (total <= 0 || value <= 0) {
    return null;
  }

  return <span className={className} style={{ width: `${Math.max(7, (value / total) * 100)}%` }} />;
}

function KpiTile({
  label,
  value,
  icon: Icon,
  toneClass,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  toneClass: string;
}) {
  return (
    <div className={`min-w-0 rounded-md border px-2 py-1.5 ${toneClass}`}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="truncate text-[8px] font-black uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-0.5 text-base font-black leading-none">{formatCount(value)}</p>
    </div>
  );
}

export function ComplianceDocumentCoverageCard({ summary }: { summary: DashboardComplianceDocumentCoverageVM }) {
  return (
    <Card className="flex flex-col gap-3 overflow-hidden border border-border-soft bg-[linear-gradient(180deg,var(--fos-bg-surface)_0%,rgba(240,249,244,0.62)_100%)] p-5 shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold leading-snug text-brand-primary">Due Dilligence Document Coverage</h3>
      </div>

      <div className="border-b border-border-soft/60" />



      <div className="h-[150px] overflow-y-auto overflow-x-hidden pr-1 internal-scroll internal-scroll--main">
        <div className="space-y-1.5">
          {(() => {
            const maxCount = Math.max(...summary.categories.map((c) => c.count), 1);
            return summary.categories.map((category) => {
              const CategoryIcon = CATEGORY_ICON_MAP[category.label] ?? Files;
              const percent = summary.total > 0 ? (category.count / summary.total) * 100 : 0;
              // Assign a supplier palette color by index to match the visual scheme
              const idx = summary.categories.findIndex((c) => c.id === category.id);
              const barColor = SUPPLIER_MAIN_COLORS[idx % SUPPLIER_MAIN_COLORS.length];
              const widthPercent = Math.max(7, (category.count / maxCount) * 100);

              return (
                <div key={category.id} className="grid grid-cols-[minmax(0,1fr)_36px] items-center gap-2 md:grid-cols-[96px_36px_minmax(0,1fr)]">
                  <div className="text-[10px] font-semibold text-text-secondary leading-snug">{category.label}</div>
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-white/70 shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                    style={{ background: `color-mix(in srgb, ${barColor} 18%, white)`, color: barColor }}
                  >
                    <CategoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  <div className="col-span-2 flex items-center gap-2 md:col-span-1 md:col-start-3">
                    <div className="relative h-4 w-full overflow-hidden rounded-sm bg-bg-surface-alt">
                      <div className="h-full rounded-sm" style={{ width: `${widthPercent}%`, backgroundColor: barColor, boxShadow: "0 6px 14px rgba(15,23,42,0.14)" }} />
                    </div>
                    <span className="min-w-[30px] text-right text-[10px] font-bold text-brand-primary">{formatCount(category.count)}</span>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      <div className="border-t border-border-soft/60 pt-2">
        <p className="flex items-center justify-center gap-1.5 text-center text-[9px] font-semibold italic leading-relaxed text-text-secondary">
          <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
          Evidence register and supplier uploads. Expiring soon means within 60 days.
        </p>
      </div>
    </Card>
  );
}
