"use client";

import React, { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Graticule, Marker, ZoomableGroup } from "react-simple-maps";
import { CalendarRange, Compass, Globe, Minus, Move, Plus, RotateCcw, Ship } from "lucide-react";
import { Card, Tag } from "@/components/ui";
import type { DashboardExportCountryShipmentVM, DashboardExportCountryVM, DashboardExportMapVM } from "@/lib/dashboard-metrics";

const WORLD_GEO_URL = "/maps/world-110m.json";
const MAP_DIMENSIONS = {
  width: 920,
  height: 430,
} as const;
const MAP_FOCUS = {
  projection: "geoMercator" as const,
  center: [22, 39] as [number, number],
  scale: 500,
};
const MAP_VIEW_DEFAULT = {
  center: [0, 0] as [number, number],
  zoom: 1,
};
const MAP_ZOOM_MIN = 0.4;
const MAP_ZOOM_MAX = 4.5;
const MAP_TRANSLATE_EXTENT: [[number, number], [number, number]] = [
  [-500, -300],
  [MAP_DIMENSIONS.width + 500, MAP_DIMENSIONS.height + 300],
];

const STATUS_META = {
  SHIPPED: {
    label: "Shipped",
    tone: "success" as const,
    color: "var(--risk-negligible)",
  },
  IN_TRANSIT: {
    label: "In transit",
    tone: "info" as const,
    color: "var(--state-info)",
  },
  TO_BE_SHIPPED: {
    label: "To be shipped",
    tone: "warning" as const,
    color: "var(--risk-medium)",
  },
};

const COUNTRY_LABEL_LAYOUTS: Record<string, { dx: number; dy: number; anchor: "start" | "end" }> = {
  Germany: { dx: 16, dy: -8, anchor: "start" },
  France: { dx: -18, dy: -18, anchor: "end" },
  Italy: { dx: -18, dy: 10, anchor: "end" },
  Spain: { dx: -18, dy: -8, anchor: "end" },
  Netherlands: { dx: -18, dy: -22, anchor: "end" },
  "Czech Republic": { dx: 16, dy: 2, anchor: "start" },
  Ireland: { dx: -16, dy: -12, anchor: "end" },
  Poland: { dx: 16, dy: -20, anchor: "start" },
  Bulgaria: { dx: 14, dy: 2, anchor: "start" },
  Romania: { dx: 16, dy: -10, anchor: "start" },
  "United Arab Emirates": { dx: 12, dy: -14, anchor: "start" },
  "Saudi Arabia": { dx: 12, dy: -12, anchor: "start" },
  Qatar: { dx: -12, dy: -16, anchor: "end" },
  Oman: { dx: 12, dy: 14, anchor: "start" },
  Kuwait: { dx: -12, dy: -14, anchor: "end" },
  Singapore: { dx: 12, dy: -16, anchor: "start" },
  "South Africa": { dx: 12, dy: -16, anchor: "start" },
};

function getCountryToneMeta(country: DashboardExportCountryVM) {
  if (country.statusCounts.inTransit > 0) {
    return STATUS_META.IN_TRANSIT;
  }

  if (country.statusCounts.toBeShipped > 0) {
    return STATUS_META.TO_BE_SHIPPED;
  }

  return STATUS_META.SHIPPED;
}

function getShipmentMeta(status: DashboardExportCountryShipmentVM["shipmentStatus"]) {
  return STATUS_META[status];
}

function groupShipmentsByTimeline(shipments: DashboardExportCountryShipmentVM[]) {
  const grouped = new Map<string, DashboardExportCountryShipmentVM[]>();

  shipments.forEach((shipment) => {
    const key = shipment.timelineGroupLabel;
    const list = grouped.get(key) ?? [];
    list.push(shipment);
    grouped.set(key, list);
  });

  return [...grouped.entries()].map(([label, items]) => ({
    label,
    items,
  }));
}

function CountryPin({
  country,
  isActive,
  showLabel,
  onActivate,
}: {
  country: DashboardExportCountryVM;
  isActive: boolean;
  showLabel: boolean;
  onActivate: () => void;
}) {
  const meta = getCountryToneMeta(country);
  const labelLayout = COUNTRY_LABEL_LAYOUTS[country.country] ?? { dx: 12, dy: -14, anchor: "start" as const };
  const badgeWidth = country.shipmentCount >= 10 ? 26 : 20;

  return (
    <Marker coordinates={country.coordinates} onMouseEnter={onActivate} onClick={onActivate}>
      <g className="cursor-pointer">
        <ellipse rx={isActive ? 19 : 15} ry={isActive ? 7 : 5.5} cy={22} fill={meta.color} fillOpacity={isActive ? 0.16 : 0.1} />
        <ellipse rx={isActive ? 26 : 22} ry={isActive ? 10 : 8} cy={22} fill={meta.color} fillOpacity={isActive ? 0.08 : 0.05} />
        {isActive ? <circle r={30} fill="none" stroke={meta.color} strokeOpacity={0.18} strokeWidth={1.4} strokeDasharray="4 4" /> : null}
        <path
          d="M0 -22 C10 -22 18 -13 18 -2 C18 10 7 17 0 27 C-7 17 -18 10 -18 -2 C-18 -13 -10 -22 0 -22 Z"
          fill={meta.color}
          stroke="rgba(255,255,255,0.97)"
          strokeWidth={isActive ? 1.8 : 1.4}
        />
        <path
          d="M-10 -13 C-5 -18 3 -20 10 -17 C13 -16 15 -13 16 -9 C11 -11 7 -10 2 -8 C-3 -6 -7 -1 -9 5 C-10 0 -14 -6 -10 -13 Z"
          fill="rgba(255,255,255,0.3)"
        />
        <circle r={8.2} cy={-4} fill="rgba(255,255,255,0.98)" />
        <circle r={5.1} cy={-4} fill={meta.color} fillOpacity={0.96} />
        <ellipse rx={2} ry={1.6} cx={1.7} cy={-5.4} fill="rgba(255,255,255,0.7)" />
        <g transform="translate(15,-18)">
          <rect x={-(badgeWidth / 2)} y={-8} width={badgeWidth} height={16} rx={8} fill="rgba(17,24,39,0.9)" stroke="rgba(255,255,255,0.88)" strokeWidth={1} />
          <text
            x={0}
            y={3}
            textAnchor="middle"
            className="pointer-events-none select-none text-[9px] font-black"
            style={{ fill: "white" }}
          >
            {country.shipmentCount}
          </text>
        </g>
        <text
          x={labelLayout.dx}
          y={labelLayout.dy}
          textAnchor={labelLayout.anchor}
          className="pointer-events-none select-none text-[9px] font-semibold tracking-[0.06em]"
          style={{
            fill: isActive ? "var(--fos-brand-primary)" : "var(--fos-text-secondary)",
            opacity: isActive ? 1 : 0.94,
            paintOrder: "stroke",
            stroke: "rgba(255,255,255,0.99)",
            strokeWidth: isActive ? 5 : 4.5,
          }}
        >
          {country.country}
        </text>
      </g>
    </Marker>
  );
}

function TimelineStage({ shipment }: { shipment: DashboardExportCountryShipmentVM }) {
  const meta = getShipmentMeta(shipment.shipmentStatus);

  return (
    <div className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-2.5 pb-4 last:pb-0">
      {/* Timeline spine */}
      <div className="relative flex flex-col items-center pt-1">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-md"
          style={{ background: meta.color }}
        >
          <div className="h-2 w-2 rounded-full bg-white/95" />
        </div>
        <div className="mt-1.5 w-px flex-1 bg-[linear-gradient(180deg,rgba(16,94,73,0.25),rgba(16,94,73,0.04))]" />
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border-soft/60 bg-white/80 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border-soft/50 bg-bg-surface/60 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-[0.7rem] font-bold text-brand-primary truncate">{shipment.reference}</p>
            <span className="shrink-0 text-[10px] text-text-muted">·</span>
            <p className="shrink-0 text-[10px] font-medium text-text-secondary">{shipment.dispatchDateLabel}</p>
          </div>
          <Tag tone={meta.tone} className="shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5">
            {meta.label}
          </Tag>
        </div>

        {/* Product lines as inline chips */}
        <div className="flex flex-wrap gap-1 px-3 py-2">
          {shipment.productBreakdown.map((line) => (
            <span
              key={line}
              className="inline-flex items-center rounded-md border border-border-soft/60 bg-bg-surface/70 px-2 py-0.5 text-[10px] font-medium text-text-primary"
            >
              {line}
            </span>
          ))}
        </div>

        {/* Footer — quantity + logistics */}
        <div className="flex items-center gap-3 border-t border-border-soft/40 bg-bg-surface/40 px-3 py-1.5">
          <span className="text-[10px] font-semibold text-text-secondary">{shipment.quantitySummaryLabel}</span>
          <span className="text-text-muted/50">·</span>
          <span className="text-[10px] font-medium text-text-muted">{shipment.logisticsLabel}</span>
        </div>
      </div>
    </div>
  );
}


export function ExportDestinationMapCard({ map }: { map: DashboardExportMapVM }) {
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(map.countries[0]?.id ?? null);
  const [mapView, setMapView] = useState(MAP_VIEW_DEFAULT);
  const [isDragging, setIsDragging] = useState(false);

  const activeCountry = useMemo(
    () => map.countries.find((country) => country.id === selectedCountryId) ?? map.countries[0] ?? null,
    [map.countries, selectedCountryId],
  );

  const activeCountryTimeline = useMemo(
    () => (activeCountry ? groupShipmentsByTimeline(activeCountry.shipments) : []),
    [activeCountry],
  );

  const adjustZoom = (delta: number) => {
    setMapView((current) => ({
      ...current,
      zoom: Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, Number((current.zoom + delta).toFixed(2)))),
    }));
  };

  const resetMapView = () => {
    setMapView(MAP_VIEW_DEFAULT);
  };

  return (
    <Card className="relative flex h-full flex-col gap-4 overflow-hidden border border-border-soft bg-bg-surface p-6 shadow-glow">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-bold leading-snug text-brand-primary">
          <Globe className="h-4.5 w-4.5 text-brand-primary" />
          Export Destination Map
        </h3>
        <Tag tone="brand" className="shrink-0 text-[10px] font-bold">
          {map.activeCountryCount} Countries
        </Tag>
      </div>

      <div className="border-b border-border-soft/60" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-stretch">
        <div className="relative overflow-hidden rounded-[1.6rem] border border-border-soft/50 bg-[radial-gradient(circle_at_20%_0%,rgba(47,128,237,0.14),transparent_24%),radial-gradient(circle_at_85%_10%,rgba(31,157,85,0.12),transparent_26%),linear-gradient(180deg,rgba(244,249,247,0.98),rgba(232,241,237,0.98))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] xl:h-[520px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,_rgba(20,32,27,0.045)_1px,transparent_1px)] bg-[length:14px_14px] opacity-25" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.68),transparent)]" />
          {map.countries.length > 0 ? (
            <div className="space-y-3">
              <div className="pointer-events-none absolute right-3 top-3 z-[3] flex items-center gap-2 rounded-2xl border border-border-soft/60 bg-white/85 px-2 py-1.5 shadow-sm backdrop-blur-sm">
                <span className="hidden items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary sm:inline-flex">
                  <Move className="h-3.5 w-3.5 text-brand-primary" />
                  Drag map
                </span>
                <div className="pointer-events-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustZoom(-0.35)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-soft bg-bg-surface text-text-secondary transition hover:border-brand-primary/30 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                    aria-label="Zoom out export map"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustZoom(0.35)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-soft bg-bg-surface text-text-secondary transition hover:border-brand-primary/30 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                    aria-label="Zoom in export map"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={resetMapView}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-soft bg-bg-surface text-text-secondary transition hover:border-brand-primary/30 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                    aria-label="Reset export map view"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <ComposableMap
                projection={MAP_FOCUS.projection}
                projectionConfig={{ center: MAP_FOCUS.center, scale: MAP_FOCUS.scale }}
                width={MAP_DIMENSIONS.width}
                height={MAP_DIMENSIONS.height}
                className={[
                  "relative z-[1] h-auto w-full touch-pan-y select-none transition-[filter]",
                  isDragging ? "cursor-grabbing" : "cursor-grab",
                ].join(" ")}
              >
                <ZoomableGroup
                  center={mapView.center}
                  zoom={mapView.zoom}
                  minZoom={MAP_ZOOM_MIN}
                  maxZoom={MAP_ZOOM_MAX}
                  translateExtent={MAP_TRANSLATE_EXTENT}
                  onMoveStart={() => setIsDragging(true)}
                  onMoveEnd={({ coordinates, zoom }) => {
                    setIsDragging(false);
                    setMapView({
                      center: coordinates as [number, number],
                      zoom,
                    });
                  }}
                >
                  <Graticule stroke="var(--fos-border-strong)" strokeOpacity={0.12} />
                  <Geographies geography={WORLD_GEO_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="rgba(234,241,238,0.96)"
                          stroke="var(--fos-border-strong)"
                          strokeWidth={0.55}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none" },
                            pressed: { outline: "none" },
                          }}
                        />
                      ))
                    }
                  </Geographies>

                  <Marker coordinates={map.origin.coordinates}>
                    <g>
                      <circle r={20} fill="var(--state-info)" fillOpacity={0.1} />
                      <circle r={14} fill="var(--state-info)" fillOpacity={0.16} />
                      <circle r={9.5} fill="white" fillOpacity={0.9} />
                      <circle r={6.5} fill="var(--state-info)" stroke="white" strokeWidth={2} />
                      <circle r={24} fill="none" stroke="var(--state-info)" strokeOpacity={0.18} strokeWidth={1.2} strokeDasharray="4 5" />
                      <text
                        x={0}
                        y={-18}
                        textAnchor="middle"
                        className="pointer-events-none select-none text-[10px] font-semibold tracking-[0.14em]"
                        style={{ fill: "var(--fos-brand-primary)", paintOrder: "stroke", stroke: "rgba(255,255,255,0.95)", strokeWidth: 4 }}
                      >
                        Karachi
                      </text>
                    </g>
                  </Marker>

                  {map.countries.map((country) => (
                    <CountryPin
                      key={country.id}
                      country={country}
                      isActive={country.id === activeCountry?.id}
                      showLabel={true}
                      onActivate={() => setSelectedCountryId(country.id)}
                    />
                  ))}
                </ZoomableGroup>
              </ComposableMap>

              <div className="pointer-events-none absolute bottom-4 left-4 z-[3] flex flex-wrap items-center gap-2 rounded-2xl border border-border-soft/60 bg-white/82 px-3 py-2 shadow-sm backdrop-blur-md">
                <Tag tone="success" className="text-[10px] font-semibold shadow-none">
                  Shipped
                </Tag>
                <Tag tone="info" className="text-[10px] font-semibold shadow-none">
                  In transit
                </Tag>
                <Tag tone="warning" className="text-[10px] font-semibold shadow-none">
                  To be shipped
                </Tag>
              </div>

              <div className="relative z-[1] flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border-soft/40 bg-white/65 px-3 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                  <Compass className="h-3.5 w-3.5 text-brand-primary" />
                  Country shipment network
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone="info" className="text-[10px] font-semibold">
                    Drag and zoom enabled
                  </Tag>
                  <Tag tone="neutral" className="text-[10px] font-semibold">
                    {map.activeCountryCount} destination countries
                  </Tag>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-[1] flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-border-soft bg-bg-surface text-sm text-text-secondary">
              No export countries are available for the current dashboard scenario.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 xl:h-[520px]">
          {activeCountry ? (
            <Card
              variant="inset"
              className="flex h-full min-h-0 flex-col gap-4 overflow-hidden rounded-[1.4rem] border-border-soft/70 bg-[linear-gradient(180deg,rgba(239,246,243,0.96),rgba(233,242,237,0.96))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">
                    Country shipment summary
                  </p>
                  <h4 className="text-lg font-semibold text-brand-primary">{activeCountry.country}</h4>
                  <p className="text-xs font-medium text-text-secondary">{activeCountry.shipmentCount} total shipments</p>
                </div>
                <Tag tone={getCountryToneMeta(activeCountry).tone} className="text-[10px] font-bold uppercase">
                  {getCountryToneMeta(activeCountry).label}
                </Tag>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-lg border border-state-success/20 bg-state-success/10 px-2 py-1.5">
                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-state-success leading-none">Shipped</p>
                  <p className="mt-0.5 text-base font-black leading-none text-state-success">{activeCountry.statusCounts.shipped}</p>
                </div>
                <div className="rounded-lg border border-state-info/20 bg-state-info/10 px-2 py-1.5">
                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-state-info leading-none">In transit</p>
                  <p className="mt-0.5 text-base font-black leading-none text-state-info">{activeCountry.statusCounts.inTransit}</p>
                </div>
                <div className="rounded-lg border border-state-warning/20 bg-state-warning/10 px-2 py-1.5">
                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-state-warning leading-none">To be shipped</p>
                  <p className="mt-0.5 text-base font-black leading-none text-state-warning">{activeCountry.statusCounts.toBeShipped}</p>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border-soft/70 bg-white/60 p-3">
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-brand-primary" />
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-muted">Shipment timeline</p>
                </div>
                <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  {activeCountryTimeline.map((group) => (
                    <div key={group.label} className="space-y-3">
                      <div className="flex items-center gap-2 rounded-2xl border border-border-soft/60 bg-bg-surface/85 px-3 py-2 backdrop-blur-sm">
                        <Ship className="h-3.5 w-3.5 text-brand-primary" />
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text-secondary">{group.label}</p>
                        <Tag tone="neutral" className="ml-auto text-[10px] font-semibold">
                          {group.items.length} shipments
                        </Tag>
                      </div>
                      {group.items.map((shipment) => (
                        <TimelineStage key={shipment.id} shipment={shipment} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
