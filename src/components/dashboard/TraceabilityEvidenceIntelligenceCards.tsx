"use client";

import React from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileClock,
  FileText,
  GitBranch,
  Handshake,
  MapPinned,
  PackageSearch,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui";
import type {
  ComplianceDocumentCategory,
  DashboardEvidenceGapCellVM,
  DashboardEvidenceGapHeatmapVM,
  DashboardEvidenceStatus,
  DashboardExpiringEvidenceRiskVM,
  DashboardSupplierTraceabilityStatusSegmentVM,
  DashboardSupplierTraceabilityStatusVM,
} from "@/lib/dashboard-metrics";

const CATEGORY_ICON_MAP: Record<ComplianceDocumentCategory, LucideIcon> = {
  "Agreements & Contracts": Handshake,
  "Certificates & Declarations": BadgeCheck,
  "Product & Ingredient Documents": PackageSearch,
  "Chain of Custody (CoC) Documents": GitBranch,
  "Geolocation & Mapping Records": MapPinned,
  "Legal & Permit Documents": Scale,
  "Audit & Assessment Reports": ClipboardCheck,
  "Policies & Procedures": FileText,
  "Due Diligence Documents": ShieldCheck,
};

const EVIDENCE_STATUS_META: Record<
  DashboardEvidenceStatus,
  { label: string; icon: LucideIcon; classes: string; dotClass: string }
> = {
  attached: {
    label: "Attached",
    icon: CheckCircle2,
    classes: "border-state-success/25 bg-state-success/8 text-state-success shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]",
    dotClass: "bg-state-success",
  },
  requested: {
    label: "Requested",
    icon: FileClock,
    classes: "border-state-warning/25 bg-state-warning/8 text-state-warning shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]",
    dotClass: "bg-state-warning",
  },
  missing: {
    label: "Missing",
    icon: CircleAlert,
    classes: "border-state-error/25 bg-state-error/8 text-state-error shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]",
    dotClass: "bg-state-error",
  },
  expired: {
    label: "Expired",
    icon: XCircle,
    classes: "border-red-300/60 bg-red-50 text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]",
    dotClass: "bg-red-600",
  },
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function HeatmapCell({ cell }: { cell: DashboardEvidenceGapCellVM }) {
  const meta = EVIDENCE_STATUS_META[cell.status];
  const Icon = meta.icon;
  const primaryCount =
    cell.status === "attached"
      ? cell.attached
      : cell.status === "requested"
        ? cell.requested
        : cell.status === "expired"
          ? cell.expired
          : cell.missing;

  return (
    <div className={`min-h-[78px] rounded-xl border p-2.5 transition duration-150 hover:-translate-y-0.5 hover:shadow-md ${meta.classes}`}>
      <div className="flex items-center justify-between gap-2">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="rounded-full bg-white/75 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-current">
          {meta.label}
        </span>
      </div>
      <p className="mt-2 text-xl font-black leading-none">{formatNumber(primaryCount)}</p>
      <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-[0.08em] text-text-secondary">{cell.label}</p>
      <div className="mt-2 grid grid-cols-4 gap-1" aria-label={`${cell.label} evidence status mix`}>
        {(["attached", "requested", "missing", "expired"] as DashboardEvidenceStatus[]).map((status) => {
          const count = cell[status];
          return (
            <span key={status} className="h-1.5 overflow-hidden rounded-full bg-white/70">
              <span
                className={`block h-full ${EVIDENCE_STATUS_META[status].dotClass}`}
                style={{ width: cell.total > 0 ? `${Math.max(12, (count / cell.total) * 100)}%` : "0%" }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function TraceabilityEvidenceGapHeatmapCard({ heatmap }: { heatmap: DashboardEvidenceGapHeatmapVM }) {
  return (
    <Card className="overflow-hidden border border-border-soft bg-[linear-gradient(180deg,var(--fos-bg-surface)_0%,rgba(240,249,244,0.68)_100%)] p-5 shadow-glow">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primary/8 text-brand-primary">
              <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-brand-primary">Traceability Evidence Gap Heatmap</h3>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Evidence coverage across supplier, ingredient, product, and shipment traceability layers.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(EVIDENCE_STATUS_META).map(([status, meta]) => (
            <span key={status} className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-white/75 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-text-secondary">
              <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
              {meta.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full border border-state-error/20 bg-state-error/8 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-state-error">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            {formatNumber(heatmap.criticalGapCount)} critical gaps
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[150px_repeat(6,minmax(104px,1fr))] gap-2">
            <div />
            {heatmap.columns.map((column) => (
              <div key={column.id} className="rounded-lg border border-border-soft bg-white/70 px-2 py-2 text-center text-[10px] font-black uppercase tracking-[0.08em] text-brand-primary">
                {column.label}
              </div>
            ))}
          </div>

          <div className="mt-2 space-y-2">
            {heatmap.rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[150px_repeat(6,minmax(104px,1fr))] gap-2">
                <div className="rounded-xl border border-border-soft bg-white/80 p-3">
                  <p className="text-sm font-black text-brand-primary">{row.label}</p>
                  <p className="mt-1 text-[10px] leading-snug text-text-secondary">{row.description}</p>
                </div>
                {row.cells.map((cell) => (
                  <HeatmapCell key={`${cell.rowId}-${cell.columnId}`} cell={cell} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ExpiryBucket({ label, count, tone }: { label: string; count: number; tone: "danger" | "warning" | "info" }) {
  const classes =
    tone === "danger"
      ? "border-state-error/25 bg-state-error/8 text-state-error"
      : tone === "warning"
        ? "border-state-warning/25 bg-state-warning/8 text-state-warning"
        : "border-state-info/25 bg-state-info/8 text-state-info";

  return (
    <div className={`rounded-lg border px-3 py-2 ${classes}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-1 text-xl font-black leading-none">{formatNumber(count)}</p>
    </div>
  );
}

export function EvidenceExpiryRiskCard({ risk }: { risk: DashboardExpiringEvidenceRiskVM }) {
  return (
    <Card className="flex h-full min-h-[430px] flex-col overflow-hidden border border-border-soft bg-[linear-gradient(180deg,var(--fos-bg-surface)_0%,rgba(239,246,255,0.72)_100%)] p-5 shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-state-info/20 bg-state-info/8 text-state-info">
              <CalendarClock className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-brand-primary">Evidence Expiry Risk</h3>
          </div>
          <p className="mt-1 text-sm text-text-secondary">30 / 60 / 90 day runway for documents that can become stale.</p>
        </div>
        <span className="rounded-full border border-state-info/20 bg-state-info/8 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-state-info">
          {formatNumber(risk.totalExpiring)} at risk
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <ExpiryBucket label={risk.buckets[0]?.label ?? "Next 30"} count={risk.buckets[0]?.count ?? 0} tone="danger" />
        <ExpiryBucket label={risk.buckets[1]?.label ?? "31-60"} count={risk.buckets[1]?.count ?? 0} tone="warning" />
        <ExpiryBucket label={risk.buckets[2]?.label ?? "61-90"} count={risk.buckets[2]?.count ?? 0} tone="info" />
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 internal-scroll internal-scroll--main">
        <div className="space-y-2">
          {risk.families.length === 0 ? (
            <div className="rounded-xl border border-state-success/20 bg-state-success/8 p-4 text-sm font-semibold text-state-success">
              No compliance evidence expires in the next 90 days.
            </div>
          ) : (
            risk.families.map((family) => {
              const Icon = CATEGORY_ICON_MAP[family.family];
              const max = Math.max(family.next30, family.next60, family.next90, 1);

              return (
                <div key={family.id} className="rounded-xl border border-border-soft bg-white/78 p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primary/6 text-brand-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-black uppercase tracking-[0.08em] text-brand-primary">{family.family}</p>
                        <p className="mt-1 truncate text-[10px] font-semibold text-text-secondary">
                          {family.linkedEntityLabel} · soonest {family.soonestExpiryLabel}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-lg font-black leading-none text-brand-primary">{formatNumber(family.totalExpiring)}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    <span className="h-2 overflow-hidden rounded-full bg-state-error/10">
                      <span className="block h-full rounded-full bg-state-error" style={{ width: `${(family.next30 / max) * 100}%` }} />
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-state-warning/10">
                      <span className="block h-full rounded-full bg-state-warning" style={{ width: `${(family.next60 / max) * 100}%` }} />
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-state-info/10">
                      <span className="block h-full rounded-full bg-state-info" style={{ width: `${(family.next90 / max) * 100}%` }} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}

const SUPPLIER_STATUS_COLOR_MAP: Record<
  DashboardSupplierTraceabilityStatusSegmentVM["label"],
  { color: string; softClass: string; dotClass: string; iconBg: string; iconColor: string }
> = {
  "Complete Traceability": {
    color: "#22c55e",
    softClass: "border-state-success/20 bg-state-success/8 text-state-success",
    dotClass: "bg-state-success",
    iconBg: "rgba(16,185,129,0.18)",
    iconColor: "#0f766e",
  },
  "Partial Traceability": {
    color: "#f59e0b",
    softClass: "border-state-warning/20 bg-state-warning/8 text-state-warning",
    dotClass: "bg-state-warning",
    iconBg: "rgba(245,158,11,0.16)",
    iconColor: "#b45309",
  },
  "Missing Origin Data": {
    color: "#f97316",
    softClass: "border-orange-200 bg-orange-50 text-orange-600",
    dotClass: "bg-orange-500",
    iconBg: "rgba(249,115,22,0.16)",
    iconColor: "#c2410c",
  },
  "Missing Documents": {
    color: "#ef4444",
    softClass: "border-state-error/20 bg-state-error/8 text-state-error",
    dotClass: "bg-state-error",
    iconBg: "rgba(239,68,68,0.16)",
    iconColor: "#b91c1c",
  },
  "Pending Verification": {
    color: "#6366f1",
    softClass: "border-indigo-200 bg-indigo-50 text-indigo-600",
    dotClass: "bg-indigo-500",
    iconBg: "rgba(99,102,241,0.16)",
    iconColor: "#4338ca",
  },
};

const SUPPLIER_STATUS_ICON_MAP: Record<DashboardSupplierTraceabilityStatusSegmentVM["label"], LucideIcon> = {
  "Complete Traceability": BadgeCheck,
  "Partial Traceability": ShieldCheck,
  "Missing Origin Data": MapPinned,
  "Missing Documents": FileText,
  "Pending Verification": ClipboardCheck,
};

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function buildDonutGradient(segments: DashboardSupplierTraceabilityStatusSegmentVM[]): string {
  const visibleSegments = segments.filter((segment) => segment.count > 0);
  if (visibleSegments.length === 0) {
    return "conic-gradient(#e2e8f0 0deg 360deg)";
  }

  let currentAngle = 0;
  const stops = visibleSegments.map((segment) => {
    const start = currentAngle;
    const angle = (segment.percentage / 100) * 360;
    currentAngle += angle;
    return `${SUPPLIER_STATUS_COLOR_MAP[segment.label].color} ${start}deg ${currentAngle}deg`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

export function SupplierTraceabilityStatusCard({
  summary,
  variant = "default",
}: {
  summary: DashboardSupplierTraceabilityStatusVM;
  variant?: "default" | "compact";
}) {
  const rankedSegments = [...summary.segments].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const donutGradient = buildDonutGradient(summary.segments);
  const isCompact = variant === "compact";
  const maxCount = Math.max(...summary.segments.map((s) => s.count), 1);

  return (
    <Card className="overflow-visible border border-border-soft bg-bg-surface p-5 shadow-glow">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-brand-primary">Supplier Traceability Gaps</h3>
      </div>

      <div className="mt-1 grid gap-1">
        {rankedSegments.map((segment) => {
          const tone = SUPPLIER_STATUS_COLOR_MAP[segment.label];
          const StatusIcon = SUPPLIER_STATUS_ICON_MAP[segment.label];
          const percentage = Math.max(2, Number(segment.percentage.toFixed(1)));
          const widthPercent = Math.max(7, (segment.count / maxCount) * 100);

          return (
            <div key={segment.id} className="grid grid-cols-[minmax(0,1fr)_36px] items-center gap-2 md:grid-cols-[96px_36px_minmax(0,1fr)]">
              <div className="text-[10px] font-semibold text-text-secondary leading-snug">{segment.label}</div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-soft bg-bg-surface-alt"
                style={{ color: tone.color }}
              >
                <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="col-span-2 flex items-center gap-2 md:col-span-1 md:col-start-3">
                <div className="relative h-4 w-full overflow-hidden rounded-[6px] bg-bg-surface-alt border border-border-soft/20">
                  <div
                    className="h-full rounded-[6px] transition-all"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: tone.color,
                    }}
                  />
                </div>
                <span className="min-w-[30px] text-right text-[10px] font-bold" style={{ color: tone.color }}>{formatPercent(segment.percentage)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
