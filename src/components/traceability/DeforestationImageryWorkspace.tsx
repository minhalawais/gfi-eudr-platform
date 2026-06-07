"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { DeforestationCase, PlotRecord } from "@/lib/gfi-dummy-data";
import type { EoImageryCard, EoImageryResponse } from "@/lib/eo-imagery";
import { Card, RiskBadge, StatusBadge, Tag } from "@/components/ui";

interface DeforestationImageryWorkspaceProps {
  plot: PlotRecord;
  deforestationCase?: DeforestationCase | null;
  isScanning?: boolean;
  scanProgress?: number;
  scanStep?: string;
  compact?: boolean;
  actions?: React.ReactNode;
}

function humanize(value: string) {
  return value.replace(/_/g, " ");
}

function statusTone(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("clear") || normalized.includes("approved")) return "ready";
  if (normalized.includes("flag") || normalized.includes("block")) return "blocked";
  if (normalized.includes("pending") || normalized.includes("review")) return "under_review";
  return "info";
}

function useEoImagery(plot: PlotRecord, deforestationCase?: DeforestationCase | null) {
  const [data, setData] = useState<EoImageryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch("/api/eudr/eo-imagery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plot, deforestationCase }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to load imagery.");
        }
        return response.json() as Promise<EoImageryResponse>;
      })
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load imagery.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [deforestationCase, plot]);

  return { data, loading, error };
}

function ComparisonMapCard({ card, label }: { card: EoImageryCard | null; label: string }) {
  return (
    <Card variant="inset" className="overflow-hidden border-slate-200/80 bg-slate-950 p-0 text-white">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">{label}</p>
          <p className="mt-1 text-xs text-slate-300">{card?.subtitle ?? "Imagery unavailable"}</p>
        </div>
        <Tag tone={card?.fallback ? "warning" : "success"} className="border-white/10 bg-white/10 text-[10px] uppercase tracking-[0.16em] text-white">
          {card?.available ? "MAP" : "UNAVAILABLE"}
        </Tag>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
        {card?.imageUrl ? (
          <>
            <img src={card.imageUrl} alt={label} className="h-full w-full object-cover" />
            {card.overlayTone === "change" ? <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_45%,rgba(251,113,133,0.24),transparent_26%),linear-gradient(135deg,rgba(249,115,22,0.16),rgba(239,68,68,0.22),transparent_68%)]" /> : null}
            {card.overlayTone !== "change" ? <div className="absolute inset-0 bg-gradient-to-t from-slate-950/38 via-transparent to-transparent" /> : null}
          </>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-300">
            {card?.warning ?? "Imagery is unavailable for this plot."}
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/15 bg-slate-950/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">
            {card?.acquisitionDate ?? "No date available"}
          </span>
          <span className="rounded-full border border-white/15 bg-slate-950/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">
            {card?.source ?? "No source configured"}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function DeforestationImageryWorkspace({
  plot,
  deforestationCase,
  isScanning = false,
  scanProgress = 0,
  scanStep = "Checking deforestation status...",
  actions,
}: DeforestationImageryWorkspaceProps) {
  const { data, loading, error } = useEoImagery(plot, deforestationCase);

  const baselineCard = useMemo(
    () => data?.cards.find((card) => card.id === "baseline") ?? null,
    [data],
  );
  const latestCard = useMemo(() => {
    if (!data) return null;
    return data.cards.find((card) => card.id === "current")
      ?? data.cards.find((card) => card.id === "change")
      ?? data.cards.find((card) => card.id === "ndvi")
      ?? null;
  }, [data]);

  return (
    <div className="space-y-5">
      <Card className="space-y-5 border-slate-200/70 bg-[linear-gradient(180deg,#ffffff_0%,#f7faf8_100%)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Deforestation Audit</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Baseline vs latest satellite comparison</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Compare forest cover before the EUDR cutoff with the latest plot image to assess deforestation risk.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={statusTone(plot.status)}>{humanize(plot.status)}</StatusBadge>
            <StatusBadge status={statusTone(plot.latestDeforestationStatus)}>{humanize(plot.latestDeforestationStatus)}</StatusBadge>
            {deforestationCase ? (
              <RiskBadge risk={deforestationCase.downstreamImpact === "NO_BLOCK" ? "low" : deforestationCase.downstreamImpact === "REVIEW_REQUIRED" ? "medium" : "high"}>
                {humanize(deforestationCase.downstreamImpact)}
              </RiskBadge>
            ) : null}
          </div>
        </div>

        {loading ? (
          <Card variant="inset" className="flex min-h-[260px] items-center justify-center rounded-[24px] border-dashed border-slate-300 bg-white/70">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading deforestation comparison...
            </div>
          </Card>
        ) : null}

        {error ? (
          <Card variant="inset" className="rounded-[24px] border-rose-300/40 bg-rose-500/10 p-4 text-sm text-rose-900">
            {error}
          </Card>
        ) : null}

        {!loading && !error ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <ComparisonMapCard card={baselineCard} label="1. Baseline Forest (Dec 2020)" />
            <ComparisonMapCard
              card={latestCard}
              label={plot.latestDeforestationStatus === "FLAGGED" ? "2. Latest Scan (Change Review)" : "2. Latest Scan"}
            />
          </div>
        ) : null}

        <Card variant="inset" className="space-y-4 rounded-[24px] p-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Comparison Details</p>
            <h4 className="mt-1 text-lg font-bold text-brand-primary">Deforestation result summary</h4>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card variant="inset" className="space-y-1 rounded-2xl p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Plot</p>
              <p className="text-sm font-semibold text-text-primary">{plot.label}</p>
            </Card>
            <Card variant="inset" className="space-y-1 rounded-2xl p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Country / Area</p>
              <p className="text-sm font-semibold text-text-primary">{plot.sourceCountry} | {plot.areaHa} ha</p>
            </Card>
            <Card variant="inset" className="space-y-1 rounded-2xl p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Baseline Date</p>
              <p className="text-sm font-semibold text-text-primary">{baselineCard?.acquisitionDate ?? "December 2020 target window"}</p>
            </Card>
            <Card variant="inset" className="space-y-1 rounded-2xl p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Latest Date</p>
              <p className="text-sm font-semibold text-text-primary">{latestCard?.acquisitionDate ?? deforestationCase?.decisionDate ?? "Latest review window"}</p>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card variant="inset" className="space-y-1 rounded-2xl p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Deforestation Status</p>
              <StatusBadge status={statusTone(plot.latestDeforestationStatus)}>{humanize(plot.latestDeforestationStatus)}</StatusBadge>
            </Card>
            <Card variant="inset" className="space-y-1 rounded-2xl p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Case Impact</p>
              {deforestationCase ? (
                <RiskBadge risk={deforestationCase.downstreamImpact === "NO_BLOCK" ? "low" : deforestationCase.downstreamImpact === "REVIEW_REQUIRED" ? "medium" : "high"}>
                  {humanize(deforestationCase.downstreamImpact)}
                </RiskBadge>
              ) : (
                <StatusBadge status="info">No Case Yet</StatusBadge>
              )}
            </Card>
            <Card variant="inset" className="space-y-1 rounded-2xl p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Cloud / Quality</p>
              <p className="text-sm font-semibold text-text-primary">{latestCard?.cloudCover ?? "N/A"}</p>
            </Card>
            <Card variant="inset" className="space-y-1 rounded-2xl p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Image Source</p>
              <p className="text-sm font-semibold text-text-primary">{latestCard?.source ?? "Not configured"}</p>
            </Card>
          </div>

          {deforestationCase?.summary ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
              {deforestationCase.summary}
            </div>
          ) : null}

          {data?.geometryQuality === "APPROXIMATED_POINT" ? (
            <div className="flex items-start gap-2 rounded-2xl border border-amber-300/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Plot boundary is approximated from point data. Upload a polygon file for a more accurate deforestation review.
            </div>
          ) : null}
        </Card>

        {isScanning ? (
          <Card variant="inset" className="space-y-3 rounded-[24px] border-emerald-300/40 bg-emerald-500/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <Loader2 className="h-4 w-4 animate-spin" />
                {scanStep}
              </div>
              <span className="text-sm font-bold text-emerald-950">{scanProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-emerald-950/10">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-200" style={{ width: `${scanProgress}%` }} />
            </div>
          </Card>
        ) : null}

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </Card>
    </div>
  );
}
