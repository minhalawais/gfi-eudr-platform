"use client";

import React, { useMemo, useState, useEffect } from "react";
import { getSupplierName, IngredientRecord, ProductRecord, PlotRecord } from "@/lib/gfi-dummy-data";
import { useSession } from "@/components/ui/PermissionGuard";
import { IngredientComplianceDrawer } from "@/components/traceability/IngredientComplianceDrawer";
import {
  Button,
  Card,
  RiskBadge,
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
import { 
  Layers, 
  Activity, 
  TrendingDown, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Globe, 
  CalendarRange, 
  Loader2, 
  ShieldAlert, 
  Compass, 
  X 
} from "lucide-react";
import type { RiskTone, StatusTone } from "@/lib/ui-semantics";

const RESULT_STATUS_MAP: Record<"PENDING" | "CLEAR" | "FLAGGED" | "SUPERSEDED", StatusTone> = {
  PENDING: "pending",
  CLEAR: "ready",
  FLAGGED: "blocked",
  SUPERSEDED: "superseded",
};

const PLOT_STATUS_MAP: Record<
  "REQUESTED" | "PENDING_APPROVAL" | "CHANGES_REQUESTED" | "APPROVED" | "SUPERSEDED",
  StatusTone
> = {
  REQUESTED: "requested",
  PENDING_APPROVAL: "pending_approval",
  CHANGES_REQUESTED: "changes_requested",
  APPROVED: "approved",
  SUPERSEDED: "superseded",
};

const IMPACT_RISK_MAP: Record<"NO_BLOCK" | "REVIEW_REQUIRED" | "BLOCKING", RiskTone> = {
  NO_BLOCK: "low",
  REVIEW_REQUIRED: "medium",
  BLOCKING: "high",
};

function formatStatusLabel(value: string) {
  return value.replace(/_/g, " ");
}

// Plot shapes synced with geolocation coordinate boundaries
const PLOT_GIS_POLYGONS: Record<string, { path: string; center: [number, number]; area: number }> = {
  "plot-jb-01": {
    path: "M 30,30 L 160,25 L 175,115 L 45,120 Z",
    center: [100, 70],
    area: 12.4,
  },
  "plot-jb-02": {
    path: "M 60,35 L 140,30 L 165,100 L 50,110 Z",
    center: [105, 65],
    area: 3.2,
  },
  "plot-cargill-01": {
    path: "M 40,20 L 170,25 L 180,120 L 35,115 Z",
    center: [102, 70],
    area: 25.1,
  },
  "plot-demo-approved": {
    path: "M 50,30 L 155,25 L 165,110 L 45,115 Z",
    center: [105, 68],
    area: 1.5,
  },
};

// Interactive visual canopy data plots by year (2020-2026)
const CANOPY_TIMELINES: Record<string, number[]> = {
  "plot-jb-01": [94, 93, 92, 91, 91, 90, 89], // Healthy shade cocoa
  "plot-jb-02": [92, 91, 91, 90, 89, 89, 88], // Healthy stable
  "plot-cargill-01": [96, 95, 94, 52, 45, 42, 40], // Deforestation canopy crash post-2023!
  "plot-demo-approved": [90, 90, 89, 89, 88, 88, 88], // Compliant
};

export default function DeforestationResultsPage() {
  const { 
    deforestationCases: localCases, 
    plots, 
    products, 
    editPlot, 
    editDeforestationCase, 
    editProduct 
  } = useSession();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerIngredient, setDrawerIngredient] = useState<IngredientRecord | null>(null);
  const [drawerProduct, setDrawerProduct] = useState<ProductRecord | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState(localCases[0]?.id ?? "");

  // GIS visual layers state
  const [activeLayer, setActiveLayer] = useState<"base" | "ndvi" | "alerts" | "parks">("base");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // False-positive bypass override form states
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideCategory, setOverrideCategory] = useState("sustainable_agroforestry");

  const selectedCase = useMemo(
    () => localCases.find((item) => item.id === selectedCaseId) ?? localCases[0],
    [localCases, selectedCaseId],
  );

  const selectedPlot = useMemo(
    () => (selectedCase ? plots.find((plot) => plot.id === selectedCase.plotId) : undefined),
    [selectedCase, plots]
  );

  const selectedSupplierId = selectedPlot?.supplierId || "sup-cargill-cocoa";
  const clearCases = localCases.filter((item) => item.resultStatus === "CLEAR").length;
  const flaggedCases = localCases.filter((item) => item.resultStatus === "FLAGGED").length;
  const pendingCases = localCases.filter((item) => item.resultStatus === "PENDING").length;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenDeforestationDrawer = (supplierId: string) => {
    const matchingProduct =
      products.find((p) => p.ingredients.some((ing) => ing.supplierIds.includes(supplierId))) || products[0];

    const matchingIngredient =
      matchingProduct?.ingredients.find((ing) => ing.supplierIds.includes(supplierId)) ||
      matchingProduct?.ingredients[0];

    if (matchingProduct && matchingIngredient) {
      setDrawerProduct(matchingProduct);
      setDrawerIngredient(matchingIngredient);
      setIsDrawerOpen(true);
    }
  };

  const startSatelliteScan = () => {
    if (!selectedCase || !selectedPlot) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanStep("Initializing high-resolution multispectral scan...");
    setTerminalLogs([]);
  };

  // Satellite scan log simulation effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isScanning && selectedCase && selectedPlot) {
      const logs = [
        `[EO-INGEST] Connecting to Sentinel-2 Multi-Spectral Ingest feeds...`,
        `[IMAGE-ALIGN] Aligning baseline canopy (Dec 2020) vs. post-cutoff (May 2026)...`,
        `[NDVI-DIFF] Generating Normalized Difference Vegetation Index (NDVI) delta matrix...`,
        `[CANOPY-TEST] Calculating relative canopy coverage: ${(selectedPlot.areaHa * 14.2 + 48).toFixed(1)}% density index.`,
        `[RESERVE-CHECK] Intersecting boundaries with UNESCO & National reserves layers...`,
        `[SUCCESS] Deforestation analysis computed. 0% overlap with high-conservation canopy gaps.`,
      ];

      timer = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setIsScanning(false);
            return 100;
          }
          const next = prev + 10;
          const logIndex = Math.floor((next / 100) * logs.length);
          if (logs[logIndex] && !terminalLogs.includes(logs[logIndex])) {
            setTerminalLogs((l) => [...l, logs[logIndex]]);
          }

          if (next < 30) setScanStep("Ingesting Sentinel-2 imagery (2020-2026)...");
          else if (next < 60) setScanStep("Cross-checking canopy cover density indexes...");
          else if (next < 90) setScanStep("Validating national reserve spatial overlays...");
          else setScanStep("Compiling compliance verification certificates...");

          return next;
        });
      }, 250);
    }
    return () => clearInterval(timer);
  }, [isScanning, selectedCase, selectedPlot, terminalLogs]);

  // Operational Action: Clear & Approve Case
  const handleClearCase = () => {
    if (!selectedCase || !selectedPlot) return;

    // 1. Update active case
    const updatedCase = {
      ...selectedCase,
      resultStatus: "CLEAR" as const,
      downstreamImpact: "NO_BLOCK" as const,
      summary: "No post-2020 forest loss detected on approved polygon coordinates.",
      evidenceArtifact: `deforestation-verified-${selectedPlot.id}.json`,
    };
    editDeforestationCase(updatedCase);

    // 2. Update active plot
    editPlot({
      ...selectedPlot,
      latestDeforestationStatus: "CLEAR",
      status: "APPROVED",
    });

    // 3. Propagate to products
    const matchingProduct = products.find((p) => p.ingredients.some((ing) => ing.supplierIds.includes(selectedPlot.supplierId)));
    if (matchingProduct) {
      const updatedIngredients = matchingProduct.ingredients.map((ing) => {
        if (ing.supplierIds.includes(selectedPlot.supplierId)) {
          return {
            ...ing,
            readiness: "READY" as const,
            evidenceStatus: "COMPLETE" as const,
            blockingReason: "",
          };
        }
        return ing;
      });
      const allReady = updatedIngredients.every((ing) => ing.readiness === "READY" || ing.relevance === "OUT_OF_SCOPE");
      editProduct({
        ...matchingProduct,
        exportReadiness: allReady ? "READY" : matchingProduct.exportReadiness,
        blockingGaps: allReady
          ? []
          : matchingProduct.blockingGaps.filter((gap) => !gap.toLowerCase().includes(selectedPlot.supplierId.toLowerCase())),
        ingredients: updatedIngredients,
      });
    }

    triggerToast(`Dossier approved for ${selectedPlot.label}. Compliance certificate generated.`);
  };

  // Operational Action: Flag & Block Case
  const handleBlockCase = () => {
    if (!selectedCase || !selectedPlot) return;

    // 1. Update active case
    const updatedCase = {
      ...selectedCase,
      resultStatus: "FLAGGED" as const,
      downstreamImpact: "BLOCKING" as const,
      summary: "Canopy change analysis identified post-cutoff tree cover loss inside coordinates.",
    };
    editDeforestationCase(updatedCase);

    // 2. Update active plot
    editPlot({
      ...selectedPlot,
      latestDeforestationStatus: "FLAGGED",
      status: "CHANGES_REQUESTED",
    });

    // 3. Block downstream products
    const matchingProduct = products.find((p) => p.ingredients.some((ing) => ing.supplierIds.includes(selectedPlot.supplierId)));
    if (matchingProduct) {
      const updatedIngredients = matchingProduct.ingredients.map((ing) => {
        if (ing.supplierIds.includes(selectedPlot.supplierId)) {
          return {
            ...ing,
            readiness: "BLOCKED" as const,
            evidenceStatus: "MISSING" as const,
            blockingReason: `Deforestation signal flagged in parcel coordinate boundary ${selectedPlot.label}.`,
          };
        }
        return ing;
      });
      editProduct({
        ...matchingProduct,
        exportReadiness: "NOT_READY",
        blockingGaps: [...new Set([...matchingProduct.blockingGaps, `Deforestation signal inside ${selectedPlot.label}`])],
        ingredients: updatedIngredients,
      });
    }

    triggerToast(`Dossier FLAGGED and BLOCKED for ${selectedPlot.label}.`);
  };

  // Operational Action: Override False Positive
  const handleOverrideCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !selectedPlot || !overrideReason.trim()) return;

    // 1. Update active case
    const updatedCase = {
      ...selectedCase,
      resultStatus: "CLEAR" as const,
      downstreamImpact: "NO_BLOCK" as const,
      summary: `Alert bypassed by ESG Auditor. Category: ${overrideCategory.replace(/_/g, " ")}. Rationale: ${overrideReason}`,
      evidenceArtifact: `deforestation-override-${selectedPlot.id}.json`,
    };
    editDeforestationCase(updatedCase);

    // 2. Update active plot
    editPlot({
      ...selectedPlot,
      latestDeforestationStatus: "CLEAR",
      status: "APPROVED",
      notes: [`ESG Auditor Bypass: ${overrideReason}`],
    });

    // 3. Propagate to products
    const matchingProduct = products.find((p) => p.ingredients.some((ing) => ing.supplierIds.includes(selectedPlot.supplierId)));
    if (matchingProduct) {
      const updatedIngredients = matchingProduct.ingredients.map((ing) => {
        if (ing.supplierIds.includes(selectedPlot.supplierId)) {
          return {
            ...ing,
            readiness: "READY" as const,
            evidenceStatus: "COMPLETE" as const,
            blockingReason: "",
          };
        }
        return ing;
      });
      const allReady = updatedIngredients.every((ing) => ing.readiness === "READY" || ing.relevance === "OUT_OF_SCOPE");
      editProduct({
        ...matchingProduct,
        exportReadiness: allReady ? "READY" : matchingProduct.exportReadiness,
        blockingGaps: allReady
          ? []
          : matchingProduct.blockingGaps.filter((gap) => !gap.toLowerCase().includes(selectedPlot.supplierId.toLowerCase())),
        ingredients: updatedIngredients,
      });
    }

    setShowOverrideForm(false);
    setOverrideReason("");
    triggerToast(`Alert bypassed for ${selectedPlot.label}. Compliance restored.`);
  };

  // Grab GIS coordinates of selected plot for rendering
  const activeGisPlot = useMemo(() => {
    if (!selectedPlot) return undefined;
    return PLOT_GIS_POLYGONS[selectedPlot.id] || PLOT_GIS_POLYGONS["plot-jb-01"];
  }, [selectedPlot]);

  // Grab canopy timeline index data of selected plot for rendering chart
  const activeTimeline = useMemo(() => {
    if (!selectedPlot) return undefined;
    return CANOPY_TIMELINES[selectedPlot.id] || CANOPY_TIMELINES["plot-jb-01"];
  }, [selectedPlot]);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[1200] max-w-sm rounded-lg border border-brand-accent bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-card animate-pulse">
          {toastMessage}
        </div>
      )}

      <SectionHeader
        title="Deforestation Review Console"
        description="Review high-resolution satellite Earth Observation (EO) imagery, check forest depletion timelines, and manage risk clearance verdicts."
        actions={
          <Tag tone="brand">
            Monitoring mode: <span className="ml-1 font-semibold">Sentinel-2 multi-spectral SAR</span>
          </Tag>
        }
      />

      {/* Telemetry Widgets */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="raised" className="space-y-2 border-l-4 border-l-brand-primary">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <Globe className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            Total Audited Parcels
          </div>
          <p className="text-2xl font-extrabold text-brand-primary">{localCases.length}</p>
          <p className="text-xs text-text-secondary">Active Earth Observation dossier references.</p>
        </Card>
        <Card variant="raised" className="space-y-2 border-l-4 border-l-state-warning">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <Loader2 className="h-4 w-4 text-state-warning animate-spin" aria-hidden="true" />
            Active Scan Queue
          </div>
          <p className="text-2xl font-extrabold text-brand-primary">{pendingCases}</p>
          <p className="text-xs text-text-secondary">Dossiers awaiting fresh satellite ingestion.</p>
        </Card>
        <Card variant="raised" className={["space-y-2 border-l-4", flaggedCases > 0 ? "border-l-state-danger" : "border-l-state-success"].join(" ")}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              <ShieldAlert className={["h-4 w-4", flaggedCases > 0 ? "text-state-danger" : "text-state-success"].join(" ")} aria-hidden="true" />
              Operational Signal
            </div>
            <RiskBadge risk={flaggedCases > 0 ? "high" : "low"}>
              {flaggedCases > 0 ? "high" : "low"}
            </RiskBadge>
          </div>
          <p className="text-2xl font-extrabold text-brand-primary">
            {flaggedCases > 0 ? `${flaggedCases} FLAGGED` : `${clearCases} CLEAR`}
          </p>
          <p className="text-xs text-text-secondary">Downstream compliance releases active.</p>
        </Card>
      </div>

      {/* Split-screen satellite audit cockpit */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1.5fr] items-start w-full">
        
        {/* Left Column: Deforestation Cases Table */}
        <div className="flex flex-col gap-6 min-w-0">
          <Card className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-brand-primary">Deforestation Audit Queue</h2>
              <p className="text-xs text-text-secondary">
                Select a parcel case to inspect Earth Observation baseline layers and canopy depletion.
              </p>
            </div>

            <TableRoot>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Plot Parcel</TableHeaderCell>
                    <TableHeaderCell>Supplier</TableHeaderCell>
                    <TableHeaderCell>Verdict</TableHeaderCell>
                    <TableHeaderCell>Blockage</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {localCases.map((item) => {
                    const plot = plots.find((p) => p.id === item.plotId);
                    const supplierId = plot?.supplierId || "sup-cargill-cocoa";
                    const isSelected = selectedCase?.id === item.id;

                    return (
                      <TableRow
                        key={item.id}
                        selected={isSelected}
                        className="cursor-pointer transition-colors duration-150 hover:bg-brand-primary/5"
                        onClick={() => {
                          setSelectedCaseId(item.id);
                          setScanProgress(0);
                          setIsScanning(false);
                          setTerminalLogs([]);
                          setShowOverrideForm(false);
                        }}
                      >
                        <TableCell className="font-semibold text-brand-primary text-xs">
                          {plot?.label ?? "Unknown Plot"}
                        </TableCell>
                        <TableCell className="text-xs">{getSupplierName(supplierId)}</TableCell>
                        <TableCell>
                          <StatusBadge status={RESULT_STATUS_MAP[item.resultStatus]}>
                            {formatStatusLabel(item.resultStatus)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <RiskBadge risk={IMPACT_RISK_MAP[item.downstreamImpact]}>
                            {formatStatusLabel(item.downstreamImpact)}
                          </RiskBadge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableRoot>
          </Card>

          {/* Environmental Legal Guidance */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border-soft/60 pb-3">
              <FileText className="h-4.5 w-4.5 text-brand-primary" />
              <h3 className="text-sm font-extrabold text-brand-primary">EUDR Legal Guidance (Article 3)</h3>
            </div>
            <div className="grid gap-3 text-xs leading-5 text-text-secondary sm:grid-cols-3">
              <Card variant="inset" className="p-3 bg-bg-page/40 border border-border-soft/50 space-y-1">
                <span className="font-bold text-emerald-800">1. Deforestation-Free</span>
                <p>No agricultural harvest is allowed on parcels deforested or degraded after the **December 31, 2020** cutoff date.</p>
              </Card>
              <Card variant="inset" className="p-3 bg-bg-page/40 border border-border-soft/50 space-y-1">
                <span className="font-bold text-emerald-800">2. Legality Audit</span>
                <p>Coordinates must lie completely outside high-conservation national parks, native reserves, or state protected forestry zones.</p>
              </Card>
              <Card variant="inset" className="p-3 bg-bg-page/40 border border-border-soft/50 space-y-1">
                <span className="font-bold text-emerald-800">3. Due Diligence</span>
                <p>Importers are legally blocked from importing non-compliant ingredients. Verdicts must have verification certificates.</p>
              </Card>
            </div>
          </Card>
        </div>

        {/* Right Column: Earth Observation Satellite Audit Console */}
        {selectedCase && selectedPlot && activeGisPlot ? (
          <div className="flex flex-col gap-6 sticky top-20">
            <Card className="overflow-hidden p-0 border border-border-soft shadow-glow">
              
              {/* EO Panel Header */}
              <div className="flex items-center justify-between border-b border-border-soft/60 px-5 py-4 bg-bg-page/40">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-text-secondary">Earth Observation System</span>
                  <h3 className="text-sm font-extrabold text-brand-primary flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-brand-accent animate-spin-slow" />
                    NDVI Multispectral Analysis - {selectedPlot.label}
                  </h3>
                </div>
                <StatusBadge status={RESULT_STATUS_MAP[selectedCase.resultStatus]}>
                  {formatStatusLabel(selectedCase.resultStatus)}
                </StatusBadge>
              </div>

              {/* GIS Layer Selectors */}
              <div className="flex border-b border-border-soft/60 bg-bg-surface-alt/45 p-2 gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveLayer("base")}
                  className={["px-3 py-1.5 rounded-full text-[10px] font-bold border transition flex items-center gap-1.5", 
                    activeLayer === "base" ? "bg-brand-primary border-brand-primary text-white" : "bg-bg-surface border-border-soft text-text-secondary hover:border-border-strong hover:text-text-primary"
                  ].join(" ")}
                >
                  <Layers className="h-3 w-3" />
                  Baseline Forest (2020)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLayer("ndvi")}
                  className={["px-3 py-1.5 rounded-full text-[10px] font-bold border transition flex items-center gap-1.5", 
                    activeLayer === "ndvi" ? "bg-brand-primary border-brand-primary text-white" : "bg-bg-surface border-border-soft text-text-secondary hover:border-border-strong hover:text-text-primary"
                  ].join(" ")}
                >
                  <Layers className="h-3 w-3" />
                  Satellite NDVI (2026)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLayer("alerts")}
                  className={["px-3 py-1.5 rounded-full text-[10px] font-bold border transition flex items-center gap-1.5", 
                    activeLayer === "alerts" ? "bg-brand-primary border-brand-primary text-white" : "bg-bg-surface border-border-soft text-text-secondary hover:border-border-strong hover:text-text-primary"
                  ].join(" ")}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Canopy Loss Alerts
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLayer("parks")}
                  className={["px-3 py-1.5 rounded-full text-[10px] font-bold border transition flex items-center gap-1.5", 
                    activeLayer === "parks" ? "bg-brand-primary border-brand-primary text-white" : "bg-bg-surface border-border-soft text-text-secondary hover:border-border-strong hover:text-text-primary"
                  ].join(" ")}
                >
                  <Globe className="h-3 w-3" />
                  Protected Reserves
                </button>
              </div>

              {/* Dynamic Vector Map Canvas */}
              <div className="relative h-[240px] w-full bg-[#00140f] overflow-hidden">
                {/* Visual Coordinates Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />
                
                <svg className="w-full h-full" viewBox="0 0 220 140">
                  <defs>
                    <linearGradient id="ndvi-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#059669" stopOpacity="0.8"/>
                      <stop offset="50%" stopColor="#10B981" stopOpacity="0.5"/>
                      <stop offset="100%" stopColor="#34D399" stopOpacity="0.2"/>
                    </linearGradient>
                    <pattern id="parks-pattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="10" stroke="#d97706" strokeWidth="1.2" strokeOpacity="0.6" />
                    </pattern>
                  </defs>

                  <g transform="translate(10, 5)">
                    {/* Render Parcel Coordinates Polygon */}
                    <path
                      d={activeGisPlot.path}
                      className={[
                        "transition-all duration-300",
                        activeLayer === "base" 
                          ? "fill-emerald-950/45 stroke-emerald-500 stroke-[1.5px]" 
                          : activeLayer === "ndvi"
                            ? "fill-[url(#ndvi-gradient)] stroke-emerald-400 stroke-[1.5px]"
                            : activeLayer === "alerts"
                              ? selectedCase.resultStatus === "FLAGGED"
                                ? "fill-red-500/10 stroke-red-500 stroke-[2px] pulsing-boundary"
                                : "fill-emerald-500/10 stroke-emerald-500 stroke-[1.2px]"
                              : "fill-[url(#parks-pattern)] stroke-[#d97706] stroke-[1.5px] stroke-dasharray-[2 2]"
                      ].join(" ")}
                    />

                    {/* Neon alert highlights if active and flagged */}
                    {activeLayer === "alerts" && selectedCase.resultStatus === "FLAGGED" && (
                      <g>
                        <circle cx={activeGisPlot.center[0]} cy={activeGisPlot.center[1]} r="6" className="fill-red-500 stroke-white stroke-[1.5px] animate-pulse" />
                        <circle cx={activeGisPlot.center[0] + 15} cy={activeGisPlot.center[1] - 10} r="4" className="fill-red-500 stroke-white stroke-[1px] animate-pulse" />
                        <text x={activeGisPlot.center[0] + 12} y={activeGisPlot.center[1] + 18} fill="#f87171" fontSize="6" fontWeight="bold" fontFamily="monospace">CANOPY LOSS DETECTED (2023)</text>
                      </g>
                    )}

                    {/* Parks encroachment highlights */}
                    {activeLayer === "parks" && selectedCase.resultStatus === "FLAGGED" && (
                      <g>
                        <rect x="0" y="40" width="80" height="90" className="fill-amber-600/15 stroke-amber-600 stroke-[0.8px] stroke-dasharray-[3 3]" />
                        <text x="5" y="52" fill="#d97706" fontSize="5" fontWeight="bold" fontFamily="monospace">SASSANDRA FOREST PRESERVE</text>
                        <path d="M 40,40 L 80,75 L 45,95 Z" className="fill-red-600/25 stroke-red-500 stroke-[1px]" />
                        <text x="35" y="105" fill="#ef4444" fontSize="5" fontWeight="bold" fontFamily="monospace">Overlap overlap sliver</text>
                      </g>
                    )}
                  </g>
                </svg>

                {/* Satellite scanner sweep animation */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-0.5 bg-brand-accent/60 shadow-[0_0_12px_#f4c400] radar-sweep-line pointer-events-none" />
                )}

                {/* Legend badges overlays */}
                <div className="absolute bottom-3 left-3 bg-black/75 border border-white/10 rounded px-2 py-1 text-[8.5px] font-mono text-white/95 flex items-center gap-1.5 backdrop-blur-sm pointer-events-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-ping" />
                  <span>Sentinel-2 Orthorectified Composite (10m scale)</span>
                </div>
              </div>

              {/* Audit Case Details & Ingestion Results */}
              <div className="px-5 pb-5 pt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <Card variant="inset" className="p-3 bg-bg-page/40 border border-border-soft/50 space-y-1">
                    <span className="text-[9px] font-extrabold tracking-wider uppercase text-text-secondary">Dossier Details</span>
                    <div className="space-y-0.5">
                      <p>Plot: <strong className="text-text-primary">{selectedPlot.label}</strong></p>
                      <p>Area: <strong className="text-text-primary">{selectedPlot.areaHa} ha</strong></p>
                      <p>Type: <strong className="text-text-primary">{selectedPlot.geoType}</strong></p>
                    </div>
                  </Card>

                  <Card variant="inset" className="p-3 bg-bg-page/40 border border-border-soft/50 space-y-1">
                    <span className="text-[9px] font-extrabold tracking-wider uppercase text-text-secondary">Audit Evidence</span>
                    <div className="space-y-0.5">
                      <p>Supplier: <strong className="text-text-primary">{getSupplierName(selectedSupplierId)}</strong></p>
                      <p>Provider: <strong className="text-text-primary">{selectedCase.provider}</strong></p>
                      <p>Decision: <strong className="text-text-primary">{selectedCase.decisionDate}</strong></p>
                    </div>
                  </Card>
                </div>

                {/* Earth Observation Scanning Terminal */}
                {terminalLogs.length > 0 && (
                  <Card variant="inset" className="p-3 bg-black border border-white/10 font-mono text-[9px] text-emerald-400 space-y-1 h-32 overflow-y-auto">
                    {terminalLogs.map((log, index) => (
                      <p key={index} className="leading-4">{log}</p>
                    ))}
                    {isScanning && (
                      <div className="flex items-center gap-1.5 text-amber-400 animate-pulse pt-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Scanning canopy indexes: {scanProgress}% complete...</span>
                      </div>
                    )}
                  </Card>
                )}

                {/* Custom Interactive Temporal Timeline Line Chart */}
                {activeTimeline && (
                  <div className="space-y-2 border-t border-border-soft/60 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-text-secondary flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-brand-primary" />
                        Relative Canopy Density Trend (2020 - 2026)
                      </span>
                      {selectedCase.resultStatus === "FLAGGED" && (
                        <Tag tone="danger" className="py-0.5 text-[9px] font-bold flex items-center gap-1 animate-pulse">
                          <TrendingDown className="h-3 w-3" />
                          CANOPY DESTRUCT SIGNAL
                        </Tag>
                      )}
                    </div>

                    <div className="h-28 w-full border border-border-soft/40 bg-bg-page/20 rounded p-2 flex flex-col justify-between relative">
                      {/* Grid background horizontal lines */}
                      <div className="absolute inset-x-0 top-1/4 border-b border-border-soft/20 pointer-events-none" />
                      <div className="absolute inset-x-0 top-2/4 border-b border-border-soft/20 pointer-events-none" />
                      <div className="absolute inset-x-0 top-3/4 border-b border-border-soft/20 pointer-events-none" />
                      
                      {/* EUDR Cutoff vertical line at 2020 */}
                      <div className="absolute left-[14%] inset-y-0 border-l border-red-500/60 border-dashed pointer-events-none flex flex-col justify-end">
                        <span className="bg-red-500/10 text-red-600 font-mono text-[7px] font-extrabold px-1 rounded absolute bottom-6 whitespace-nowrap -translate-x-1/2">
                          EUDR CUTOFF (DEC 2020)
                        </span>
                      </div>

                      {/* Timeline Nodes & Trend line connector */}
                      <div className="flex justify-between items-end h-full px-4 relative z-10">
                        {activeTimeline.map((density, idx) => {
                          const year = 2020 + idx;
                          const heightPct = `${density}%`;
                          
                          return (
                            <div key={year} className="flex flex-col items-center gap-1.5 h-full justify-end relative group">
                              {/* Hover Tooltip tooltip */}
                              <span className="absolute bottom-8 scale-0 group-hover:scale-100 bg-brand-primary text-white text-[7px] font-bold py-0.5 px-1 rounded shadow-card pointer-events-none transition-transform duration-100 whitespace-nowrap">
                                {density}% density
                              </span>

                              {/* Numeric trend node dot */}
                              <div 
                                className={[
                                  "w-2 h-2 rounded-full shadow",
                                  density > 60 ? "bg-emerald-500" : density > 45 ? "bg-amber-500 animate-pulse" : "bg-red-500 animate-ping"
                                ].join(" ")}
                                style={{ marginBottom: `calc(${heightPct} * 0.6)` }}
                              />
                              <span className="font-mono text-[8px] text-text-secondary">{year}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Auditor Actions & Form */}
                <div className="space-y-4 border-t border-border-soft/60 pt-4">
                  {showOverrideForm ? (
                    <form onSubmit={handleOverrideCase} className="space-y-3 bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-amber-500/15 pb-2">
                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-amber-700" />
                          ESG Auditor Bypass & Justification Form
                        </span>
                        <button type="button" onClick={() => setShowOverrideForm(false)} className="text-text-muted hover:text-text-primary">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                          Justification Category
                        </label>
                        <select
                          value={overrideCategory}
                          onChange={(e) => setOverrideCategory(e.target.value)}
                          className="w-full text-xs rounded border border-border-soft bg-bg-surface p-2 text-text-primary font-semibold"
                        >
                          <option value="sustainable_agroforestry">Sustainable Agroforestry Canopy (Shade-Grown)</option>
                          <option value="seasonal_pruning">Seasonal Agricultural Pruning & Canopy Regeneration</option>
                          <option value="legal_cocoa_rotation">Authorized Cocoa Seedling Crop Rotation</option>
                          <option value="governmental_concession">Legitimate Pre-Approved Forestry Concession</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                          Auditor Justification Comments
                        </label>
                        <textarea
                          required
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          placeholder="Provide detailed scientific justification or reference certificate reference codes to bypass this alert under Article 10 exemptions..."
                          className="w-full text-xs rounded border border-border-soft bg-bg-surface p-2.5 text-text-primary min-h-[70px]"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" size="sm" onClick={() => setShowOverrideForm(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" size="sm">
                          Submit Auditor Override
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={startSatelliteScan}
                        disabled={isScanning}
                        icon={isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                      >
                        {isScanning ? "Running Scan..." : "Run Satellite Scan"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClearCase}
                        disabled={isScanning || selectedCase.resultStatus === "CLEAR"}
                        icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      >
                        Clear & Approve
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowOverrideForm(true)}
                        disabled={isScanning || selectedCase.resultStatus === "CLEAR"}
                        icon={<FileText className="h-4 w-4 text-amber-600" />}
                      >
                        Override Bypass
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleBlockCase}
                        disabled={isScanning || selectedCase.resultStatus === "FLAGGED"}
                        icon={<ShieldAlert className="h-4 w-4 text-red-600" />}
                        className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                      >
                        Flag & Block
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-6 text-center text-xs text-text-secondary font-semibold">
            Select a plot dossier case from the queue list to trigger high-resolution Earth Observation satellite reviews.
          </Card>
        )}
      </div>

      {isDrawerOpen && drawerIngredient && drawerProduct && (
        <IngredientComplianceDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setDrawerIngredient(null);
            setDrawerProduct(null);
          }}
          ingredient={drawerIngredient}
          product={drawerProduct}
          initialTab="deforestation"
        />
      )}
    </div>
  );
}
