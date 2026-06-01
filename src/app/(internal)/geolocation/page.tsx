"use client";

import React, { useState, useMemo } from "react";
import { FlaskConical, MapPinned, ShieldCheck, Compass, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getSupplierName, IngredientRecord, ProductRecord, PlotRecord } from "@/lib/gfi-dummy-data";
import { useSession } from "@/components/ui/PermissionGuard";
import { IngredientComplianceDrawer } from "@/components/traceability/IngredientComplianceDrawer";
import {
  Button,
  Card,
  SectionHeader,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  Tag,
} from "@/components/ui";
import type { StatusTone } from "@/lib/ui-semantics";

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

function toStatusTone(value: string): StatusTone {
  const normalized = value.toLowerCase();
  if (normalized.includes("approved") || normalized.includes("clear") || normalized.includes("valid")) return "ready";
  if (normalized.includes("blocked") || normalized.includes("rejected") || normalized.includes("fail") || normalized.includes("gaps")) return "blocked";
  if (normalized.includes("pending")) return "pending";
  if (normalized.includes("review")) return "under_review";
  if (normalized.includes("request")) return "requested";
  return "info";
}

// Visual mock coordinates representing Ivory Coast & Ghana on our 500x380 SVG grid
const MAP_BOUNDS = {
  ivoryCoast: "M 50,280 L 150,280 L 160,120 L 70,125 Z",
  ghana: "M 150,280 L 250,280 L 235,115 L 160,120 Z",
  malaysiaInlet: "M 320,60 H 480 V 160 H 320 Z", // Inset map box for Sabah reference plot
};

const PLOT_COORDINATE_SHAPES: Record<string, { x: number; y: number; path?: string; center: [number, number] }> = {
  "plot-jb-01": {
    x: 90,
    y: 200,
    path: "M 80,190 L 105,185 L 110,210 L 85,215 Z",
    center: [95, 200],
  },
  "plot-jb-02": {
    x: 200,
    y: 180,
    path: "M 190,170 L 215,165 L 220,190 L 195,195 Z",
    center: [205, 180],
  },
  "plot-cargill-01": {
    x: 400,
    y: 110,
    path: "M 380,95 L 420,95 L 430,125 L 390,125 Z",
    center: [400, 110],
  },
  "plot-demo-approved": {
    x: 120,
    y: 160,
    path: "M 110,150 L 135,145 L 140,170 L 115,175 Z",
    center: [125, 160],
  },
};

export default function GeolocationReviewPage() {
  const {
    plots: currentPlots,
    products,
    farmerDeclarationSubmissions,
    eudrEvidenceAttachments,
    suppliers,
    supplyChainNodes,
    eudrFormRequests,
  } = useSession();

  const farmerPlotRows = farmerDeclarationSubmissions.flatMap((submission) =>
    submission.plotRows.map((plot) => ({ ...plot, submission })),
  );

  const [selectedPlotId, setSelectedPlotId] = useState<string>("plot-jb-01");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerIngredient, setDrawerIngredient] = useState<IngredientRecord | null>(null);
  const [drawerProduct, setDrawerProduct] = useState<ProductRecord | null>(null);

  const activePlot = useMemo(
    () => currentPlots.find((p) => p.id === selectedPlotId) ?? currentPlots[0],
    [currentPlots, selectedPlotId]
  );

  const handleOpenPlotDrawer = (supplierId: string) => {
    const matchingProduct =
      products.find((product) => product.ingredients.some((ingredient) => ingredient.supplierIds.includes(supplierId))) || products[0];
    const matchingIngredient =
      matchingProduct?.ingredients.find((ingredient) => ingredient.supplierIds.includes(supplierId)) ||
      matchingProduct?.ingredients[0];

    if (matchingProduct && matchingIngredient) {
      setDrawerProduct(matchingProduct);
      setDrawerIngredient(matchingIngredient);
      setIsDrawerOpen(true);
    }
  };

  const approvedPlots = currentPlots.filter((plot) => plot.status === "APPROVED").length;
  const reviewPlots = currentPlots.filter((plot) => plot.status.includes("REVIEW") || plot.status.includes("PENDING")).length;

  // Map panning & zooming calculations
  const mapOffset = useMemo(() => {
    const coords = PLOT_COORDINATE_SHAPES[selectedPlotId] ?? PLOT_COORDINATE_SHAPES["plot-jb-01"];
    // Pan SVG viewport center to the selected plot coordinate
    const dx = 250 - coords.center[0] * 1.5;
    const dy = 160 - coords.center[1] * 1.5;
    return { dx, dy };
  }, [selectedPlotId]);

  return (
    <div className="flex w-full flex-col gap-6">
      <SectionHeader
        title="Geolocation Compliance Console"
        description="Review smallholder boundary coordinates, parse geometry files, and audit PostGIS shape boundaries against deforestation layers."
        actions={
          <div className="flex items-center gap-2">
            <Tag tone="brand">{currentPlots.length} agricultural plots</Tag>
            <Tag tone="neutral">{suppliers.length} active suppliers</Tag>
          </div>
        }
      />

      {/* Top Telemetry Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="raised" className="space-y-2 border-l-4 border-l-brand-primary">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <ShieldCheck className="h-4 w-4 text-state-success" aria-hidden="true" />
            Coordinated Coverage
          </div>
          <p className="text-2xl font-extrabold text-brand-primary">{approvedPlots}/{currentPlots.length}</p>
          <p className="text-xs text-text-secondary">Plots verified clear of overlaps & encroachment.</p>
        </Card>
        <Card variant="raised" className="space-y-2 border-l-4 border-l-state-warning">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <MapPinned className="h-4 w-4 text-state-warning" aria-hidden="true" />
            Pending Analyst Audit
          </div>
          <p className="text-2xl font-extrabold text-brand-primary">{reviewPlots}</p>
          <p className="text-xs text-text-secondary">Uploaded geometry shapes in active queue.</p>
        </Card>
        <Card variant="raised" className="space-y-2 border-l-4 border-l-state-info">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <FlaskConical className="h-4 w-4 text-state-info" aria-hidden="true" />
            Farmer Submissions
          </div>
          <p className="text-2xl font-extrabold text-brand-primary">{farmerPlotRows.length}</p>
          <p className="text-xs text-text-secondary">Multi-tier smallholder digital geodata records.</p>
        </Card>
      </div>

      {/* Split-screen GIS Cockpit */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1.5fr] items-start w-full">
        
        {/* Left Column: Plot Review Queue */}
        <div className="flex flex-col gap-6 min-w-0">
          <Card className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-brand-primary">Compliance Queue</h2>
              <p className="text-xs text-text-secondary">
                Select any plot to center and load telemetry audits in the GIS Map Console.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {currentPlots.map((plot) => {
                const isSelected = plot.id === selectedPlotId;
                return (
                  <button
                    key={plot.id}
                    type="button"
                    onClick={() => setSelectedPlotId(plot.id)}
                    className={[
                      "group flex h-full flex-col justify-between gap-3 rounded-lg border p-4 text-left shadow-card transition-all duration-150 ease-emphasized focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2",
                      isSelected
                        ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary"
                        : "border-border-soft bg-bg-surface hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover",
                    ].join(" ")}
                    title={`Center ${plot.label} on map`}
                  >
                    <div className="space-y-2 w-full">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-xs font-extrabold text-brand-primary">{plot.label}</strong>
                        <StatusBadge status={toStatusTone(plot.status)} className="scale-90">{humanize(plot.status)}</StatusBadge>
                      </div>
                      <div className="space-y-0.5 text-[11px] text-text-secondary">
                        <p>
                          Supplier: <span className="font-semibold text-text-primary">{getSupplierName(plot.supplierId)}</span>
                        </p>
                        <p>
                          Area: <span className="font-semibold text-text-primary">{plot.areaHa} ha ({plot.geoType})</span>
                        </p>
                      </div>
                      <p className="text-[10px] leading-4 text-text-secondary truncate">{plot.coordinatesSummary}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-soft/60 pt-2 w-full text-[10px]">
                      <Tag tone={plot.latestDeforestationStatus === "CLEAR" ? "success" : plot.latestDeforestationStatus === "PENDING" ? "warning" : "danger"} className="py-0.5 px-1.5 scale-90">
                        Signal: {plot.latestDeforestationStatus}
                      </Tag>
                      <span className="font-bold text-brand-primary transition-colors group-hover:text-brand-accent-hover">
                        Center Map →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Farmer Plot Declarations Table */}
          {farmerPlotRows.length > 0 && (
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-brand-primary">Disclosed Grower Packets</h2>
                <Tag tone="neutral" className="text-[10px]">{farmerPlotRows.length} rows</Tag>
              </div>

              <TableRoot>
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeaderCell>ID</TableHeaderCell>
                      <TableHeaderCell>Commodity</TableHeaderCell>
                      <TableHeaderCell>Area</TableHeaderCell>
                      <TableHeaderCell>Type</TableHeaderCell>
                      <TableHeaderCell>Evidence File</TableHeaderCell>
                      <TableHeaderCell>Audit</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {farmerPlotRows.map((plot) => {
                      const evidence = eudrEvidenceAttachments.find(
                        (item) => item.requestId === plot.submission.requestId && item.sectionRef === "FARMER_SECTION_4",
                      );
                      const node = supplyChainNodes.find((item) => item.id === plot.submission.nodeId);
                      const supplierId =
                        node?.supplierId || eudrFormRequests.find((request) => request.id === plot.submission.requestId)?.targetSupplierId || "sup-jb-cocoa";
                      return (
                        <TableRow key={`${plot.submission.id}-${plot.plotId}`}>
                          <TableCell className="font-semibold text-text-primary text-xs">{plot.plotId}</TableCell>
                          <TableCell className="text-xs">{plot.commodityGrown}</TableCell>
                          <TableCell className="text-xs font-semibold">{plot.areaHa} ha</TableCell>
                          <TableCell className="text-xs">{plot.coordinateType}</TableCell>
                          <TableCell className="text-xs truncate max-w-[120px]">{plot.fileName || evidence?.fileName || "Manual Entry"}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="py-1 px-2.5 text-[10px]"
                              onClick={() => {
                                const matchingPlot = currentPlots.find(p => p.supplierId === supplierId);
                                if (matchingPlot) {
                                  setSelectedPlotId(matchingPlot.id);
                                }
                                handleOpenPlotDrawer(supplierId);
                              }}
                            >
                              Inspect
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableRoot>
            </Card>
          )}
        </div>

        {/* Right Column: Premium GIS Map Console */}
        <Card className="flex flex-col gap-4 overflow-hidden border border-border-soft bg-bg-surface p-0 shadow-glow sticky top-20">
          
          {/* GIS Header */}
          <div className="flex items-center justify-between border-b border-border-soft/60 px-5 py-4 bg-bg-page/40">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">Spatial Radar Panel</span>
              <h3 className="text-sm font-extrabold text-brand-primary flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-brand-accent animate-spin-slow" />
                FOS Visual GIS Engine (West African Cocoa Belt)
              </h3>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              GIS ONLINE
            </span>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative h-[380px] w-full bg-[#001712] overflow-hidden border-y border-white/5">
            {/* Coordinate Grid Overlay (Graticules) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Geographical Markers & Polygons */}
            <svg className="w-full h-full" viewBox="0 0 500 360">
              <g transform={`translate(${mapOffset.dx}, ${mapOffset.dy}) scale(1.5)`}>
                {/* Landmass Outlines (Ivory Coast & Ghana) */}
                <path
                  d={MAP_BOUNDS.ivoryCoast}
                  className="fill-emerald-950/30 stroke-emerald-900/40"
                  strokeWidth="1"
                />
                <path
                  d={MAP_BOUNDS.ghana}
                  className="fill-emerald-950/20 stroke-emerald-900/30"
                  strokeWidth="1"
                />

                {/* Country Boundary Line */}
                <line x1="150" y1="280" x2="160" y2="120" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" strokeDasharray="2 3" />

                {/* Malaysia Insert Inset */}
                <rect x="290" y="20" width="130" height="90" className="fill-[#00281D]/80 stroke-white/10" strokeWidth="1" />
                <path d="M 300,80 L 340,75 L 350,95 L 310,95 Z" className="fill-brand-accent/5 stroke-brand-accent/20" />
                <text x="295" y="32" fill="rgba(255,255,255,0.5)" fontSize="7" fontWeight="bold" fontFamily="monospace">MALAYSIA REGION</text>

                {/* Grid Labels */}
                <text x="35" y="130" fill="rgba(255,255,255,0.2)" fontSize="6" fontFamily="monospace">8° W</text>
                <text x="145" y="115" fill="rgba(255,255,255,0.2)" fontSize="6" fontFamily="monospace">6° W</text>
                <text x="230" y="110" fill="rgba(255,255,255,0.2)" fontSize="6" fontFamily="monospace">4° W</text>
                <text x="20" y="275" fill="rgba(255,255,255,0.2)" fontSize="6" fontFamily="monospace">4° N (Equator belt)</text>

                {/* Render Plot Outlines */}
                {Object.entries(PLOT_COORDINATE_SHAPES).map(([id, coords]) => {
                  const plot = currentPlots.find(p => p.id === id);
                  if (!plot) return null;
                  const isActive = id === selectedPlotId;
                  const colorTone = plot.latestDeforestationStatus === "CLEAR" 
                    ? "fill-emerald-500/15 stroke-emerald-500" 
                    : plot.latestDeforestationStatus === "PENDING"
                      ? "fill-amber-500/15 stroke-amber-500"
                      : "fill-red-500/15 stroke-red-500";

                  return (
                    <g key={id} className="cursor-pointer" onClick={() => setSelectedPlotId(id)}>
                      {coords.path ? (
                        <path
                          d={coords.path}
                          className={[
                            colorTone,
                            isActive ? "stroke-[2.5px] pulsing-boundary" : "stroke-[1.2px] hover:stroke-white transition-all",
                          ].join(" ")}
                        />
                      ) : (
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r={isActive ? 6 : 4}
                          className={[
                            colorTone,
                            isActive ? "stroke-[2px] stroke-white animate-pulse" : "stroke-none hover:r-5",
                          ].join(" ")}
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Scanning Radar Laser Overlay */}
            {activePlot?.latestDeforestationStatus === "PENDING" && (
              <div className="absolute inset-x-0 h-0.5 bg-brand-accent/60 shadow-[0_0_12px_#f4c400] radar-sweep-line pointer-events-none" />
            )}

            {/* Map Compass */}
            <div className="absolute bottom-4 left-4 bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-[9px] font-mono text-white/80 flex items-center gap-1.5 backdrop-blur-sm pointer-events-none">
              <Compass className="h-3 w-3 text-brand-accent animate-spin-slow" />
              <span>N 4° 32' 11&quot; / W 6° 12' 40&quot;</span>
            </div>

            {/* Quick Country Labels */}
            <div className="absolute top-1/2 left-[15%] text-[10px] font-bold tracking-widest text-white/20 select-none uppercase pointer-events-none">CÔTE D'IVOIRE</div>
            <div className="absolute top-[45%] left-[54%] text-[10px] font-bold tracking-widest text-white/20 select-none uppercase pointer-events-none">GHANA</div>
          </div>

          {/* Telemetry Spatial Audit Drawer Dashboard */}
          {activePlot ? (
            <div className="px-5 pb-5 pt-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft/60 pb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-brand-primary">{activePlot.label}</h4>
                  <p className="text-[11px] text-text-secondary">WGS-84 projection verification database logs</p>
                </div>
                <StatusBadge status={toStatusTone(activePlot.status)} className="text-[10px]">{humanize(activePlot.status)}</StatusBadge>
              </div>

              {/* Grid of spatial telemetry audits */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Card variant="inset" className="p-3 bg-bg-page/40 border border-border-soft/50 space-y-1">
                  <span className="text-[9px] font-extrabold tracking-wider uppercase text-text-secondary">Yield Potential</span>
                  <p className="text-sm font-extrabold text-brand-primary">
                    {(activePlot.areaHa * 1.14).toFixed(2)} MT <span className="text-[10px] font-normal text-text-secondary">(estimated)</span>
                  </p>
                </Card>
                <Card variant="inset" className="p-3 bg-bg-page/40 border border-border-soft/50 space-y-1">
                  <span className="text-[9px] font-extrabold tracking-wider uppercase text-text-secondary">Spatial Overlap Check</span>
                  <p className="text-sm font-extrabold text-brand-primary flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-state-success" />
                    0.0% slivers
                  </p>
                </Card>
                <Card variant="inset" className="p-3 bg-bg-page/40 border border-border-soft/50 space-y-1">
                  <span className="text-[9px] font-extrabold tracking-wider uppercase text-text-secondary">Forest Encroachment</span>
                  <p className="text-sm font-extrabold text-brand-primary flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-state-success" />
                    Compliant (0%)
                  </p>
                </Card>
                <Card variant="inset" className="p-3 bg-bg-page/40 border border-border-soft/50 space-y-1">
                  <span className="text-[9px] font-extrabold tracking-wider uppercase text-text-secondary">Coordinate Nodes</span>
                  <p className="text-sm font-extrabold text-brand-primary">
                    {activePlot.geoType === "POLYGON" ? "24 closed boundary vertices" : "Point centroid centroid"}
                  </p>
                </Card>
              </div>

              {/* Warning box if there are gaps */}
              {activePlot.status !== "APPROVED" && (
                <div className="flex gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-800 leading-5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5 animate-pulse" />
                  <div>
                    <strong>Outstanding Geodata Gaps Detected:</strong> {activePlot.notes[0]}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2.5 pt-2">
                <Button
                  type="button"
                  icon={<FlaskConical className="h-4 w-4" />}
                  onClick={() => handleOpenPlotDrawer(activePlot.supplierId)}
                >
                  Run Compliance Scan
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleOpenPlotDrawer(activePlot.supplierId)}
                >
                  Parse Geometry Shape
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-text-secondary font-semibold">Select a plot card to view dynamic spatial audits.</div>
          )}
        </Card>
      </div>

      {isDrawerOpen && drawerIngredient && drawerProduct ? (
        <IngredientComplianceDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setDrawerIngredient(null);
            setDrawerProduct(null);
          }}
          ingredient={drawerIngredient}
          product={drawerProduct}
          initialTab="plots"
        />
      ) : null}
    </div>
  );
}
