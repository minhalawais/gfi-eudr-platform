"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileCheck2, Loader2, MapPinned, ScanSearch, UploadCloud, X } from "lucide-react";
import {
  IngredientRecord,
  ProductRecord,
  PlotRecord,
  DeforestationCase,
  SupplyChainNode,
  EudrEvidenceAttachment,
  FarmerDeclarationSubmission,
} from "@/lib/gfi-dummy-data";
import { useSession } from "@/components/ui/PermissionGuard";
import { Button, Card, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRoot, TableRow, Tag } from "@/components/ui";
import type { StatusTone } from "@/lib/ui-semantics";

interface IngredientComplianceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: IngredientRecord;
  product: ProductRecord;
  initialTab?: "traceability" | "plots" | "deforestation" | "documents";
}

type DrawerTab = "traceability" | "plots" | "deforestation" | "documents";

const TABS: Array<{ key: DrawerTab; label: string }> = [
  { key: "traceability", label: "Traceability" },
  { key: "plots", label: "Plots" },
  { key: "deforestation", label: "Deforestation" },
  { key: "documents", label: "Documents" },
];

function humanize(value: string) {
  return value.replace(/_/g, " ");
}

function toTone(value: string): StatusTone {
  const normalized = value.toLowerCase();
  if (normalized.includes("ready") || normalized.includes("complete") || normalized.includes("approved") || normalized.includes("clear")) return "ready";
  if (normalized.includes("blocked") || normalized.includes("flag") || normalized.includes("gap")) return "blocked";
  if (normalized.includes("pending")) return "pending";
  if (normalized.includes("review")) return "under_review";
  if (normalized.includes("request")) return "requested";
  return "info";
}

function getSubmissionRows(submissions: FarmerDeclarationSubmission[], ingredientNodes: SupplyChainNode[]) {
  return submissions.filter((submission) => ingredientNodes.some((node) => node.id === submission.nodeId));
}

function getAttachmentRows(attachments: EudrEvidenceAttachment[], ingredientNodes: SupplyChainNode[]) {
  return attachments.filter((attachment) => ingredientNodes.some((node) => node.id === attachment.nodeId));
}

export function IngredientComplianceDrawer({
  isOpen,
  onClose,
  ingredient,
  product,
  initialTab = "traceability",
}: IngredientComplianceDrawerProps) {
  const {
    plots: allPlots,
    deforestationCases: allCases,
    editPlot,
    editDeforestationCase,
    supplyChainNodes,
    eudrFormRequests,
    farmerDeclarationSubmissions,
    eudrEvidenceAttachments,
    editProduct,
  } = useSession();

  const [activeTab, setActiveTab] = useState<DrawerTab>(initialTab);
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [geoValidationState, setGeoValidationState] = useState<"IDLE" | "VALIDATING" | "SUCCESS">("IDLE");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [parsedVertices, setParsedVertices] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const tabsBaseId = useId();

  const linkedPlots = useMemo(() => allPlots.filter((plot) => ingredient.supplierIds.includes(plot.supplierId)), [allPlots, ingredient.supplierIds]);
  const ingredientNodes = useMemo(() => supplyChainNodes.filter((node) => node.ingredientId === ingredient.id), [supplyChainNodes, ingredient.id]);
  const activePlot = linkedPlots.find((plot) => plot.id === selectedPlotId) || linkedPlots[0];
  const linkedCase = allCases.find((item) => item.plotId === activePlot?.id);

  const submissionRows = useMemo(
    () => getSubmissionRows(farmerDeclarationSubmissions, ingredientNodes),
    [farmerDeclarationSubmissions, ingredientNodes],
  );
  const attachmentRows = useMemo(
    () => getAttachmentRows(eudrEvidenceAttachments, ingredientNodes),
    [eudrEvidenceAttachments, ingredientNodes],
  );

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    setActiveTab(initialTab);
    setGeoValidationState("IDLE");
    setIsScanning(false);
    setScanProgress(0);
    setScanStep("");
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    if (linkedPlots.length > 0 && !selectedPlotId) setSelectedPlotId(linkedPlots[0].id);
  }, [isOpen, linkedPlots, selectedPlotId]);

  useEffect(() => {
    if (!isOpen) {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUploadGeoFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setGeoValidationState("VALIDATING");
    setTerminalLogs([]);

    const logs = [
      `[INGEST] Reading coordinate geometry binary stream from "${file.name}"...`,
      `[PROJECTION] Checking coordinate systems... Verified EPSG:4326 (WGS 84) projection bounds.`,
      `[GRID] Executing self-intersection check... 0 sliver boundaries detected.`,
      `[LEGACY] Checking local land reserves... No overlaps found (0.0% encroachment).`,
      `[CAPACITY] Calculated yield potential of parcel: ${(activePlot ? activePlot.areaHa * 1.14 : 3.5).toFixed(2)} MT annually.`,
      `[SUCCESS] Plot geometry validated! Boundary coordinate ring successfully closed.`,
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setTerminalLogs((prev) => [...prev, log]);
        if (index === logs.length - 1) {
          setGeoValidationState("SUCCESS");
          const vertices = Math.floor(Math.random() * 32) + 12;
          setParsedVertices(vertices);

          if (activePlot) {
            const updatedPlot: PlotRecord = {
              ...activePlot,
              status: "APPROVED",
              geoType: "POLYGON",
              coordinatesSummary: `Polygon: WGS 84 coordinate ring with ${vertices} verified vertices. Boundary verified clear of overlaps.`,
            };
            editPlot(updatedPlot);
            triggerToast(`Validated coordinates for ${activePlot.label}. Geometry checks passed.`);
          }
        }
      }, (index + 1) * 500);
    });
  };

  const startSatelliteScan = () => {
    if (!activePlot) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanStep("Initializing high-resolution satellite feed...");
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isScanning && activePlot) {
      timer = setInterval(() => {
        setScanProgress((previous) => {
          if (previous >= 100) {
            clearInterval(timer);
            setIsScanning(false);

            if (linkedCase) {
              const updatedCase: DeforestationCase = {
                ...linkedCase,
                resultStatus: "CLEAR",
                downstreamImpact: "NO_BLOCK",
                summary: "No post-2020 forest loss detected on approved polygon snapshot.",
                evidenceArtifact: `deforestation-verified-${activePlot.id}.json`,
              };
              editDeforestationCase(updatedCase);
            }

            editPlot({
              ...activePlot,
              latestDeforestationStatus: "CLEAR",
            });

            const updatedIngredients = product.ingredients.map((entry) =>
              entry.id === ingredient.id
                ? {
                    ...entry,
                    readiness: "READY" as const,
                    evidenceStatus: "COMPLETE" as const,
                    blockingReason: "",
                  }
                : entry,
            );
            const allReady = updatedIngredients.every((entry) => entry.readiness === "READY" || entry.relevance === "OUT_OF_SCOPE");

            editProduct({
              ...product,
              exportReadiness: allReady ? "READY" : product.exportReadiness,
              blockingGaps: allReady
                ? []
                : product.blockingGaps.filter((gap) => !gap.toLowerCase().includes(ingredient.name.toLowerCase())),
              ingredients: updatedIngredients,
            });

            triggerToast("Satellite scan completed. Forest-clear evidence generated.");
            return 100;
          }

          const next = previous + 10;
          if (next < 30) setScanStep("Ingesting Sentinel-2 imagery (2020-2026)...");
          else if (next < 60) setScanStep("Cross-checking against land-cover database...");
          else if (next < 85) setScanStep("Running canopy change detection...");
          else setScanStep("Finalizing compliance evidence package...");
          return next;
        });
      }, 250);
    }

    return () => clearInterval(timer);
  }, [isScanning, activePlot, linkedCase, editDeforestationCase, editPlot, editProduct, product, ingredient]);

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = TABS.length - 1;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const next = index === lastIndex ? 0 : index + 1;
      tabRefs.current[next]?.focus();
      setActiveTab(TABS[next].key);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const previous = index === 0 ? lastIndex : index - 1;
      tabRefs.current[previous]?.focus();
      setActiveTab(TABS[previous].key);
    } else if (event.key === "Home") {
      event.preventDefault();
      tabRefs.current[0]?.focus();
      setActiveTab(TABS[0].key);
    } else if (event.key === "End") {
      event.preventDefault();
      tabRefs.current[lastIndex]?.focus();
      setActiveTab(TABS[lastIndex].key);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveTab(TABS[index].key);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      {toastMessage ? (
        <div className="fixed bottom-6 right-6 z-[1200] max-w-sm rounded-lg border border-brand-accent bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-card">
          {toastMessage}
        </div>
      ) : null}

      <aside
        ref={drawerRef}
        className="ml-auto flex h-full w-full max-w-[920px] flex-col border-l border-border-soft bg-bg-surface shadow-card-hover"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${tabsBaseId}-title`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-soft p-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="neutral">BOM {ingredient.percentage}</Tag>
              <StatusBadge status={toTone(ingredient.readiness)}>{humanize(ingredient.readiness)}</StatusBadge>
            </div>
            <h2 id={`${tabsBaseId}-title`} className="text-xl font-extrabold text-brand-primary">
              {ingredient.name}
            </h2>
            <p className="text-sm text-text-secondary">
              {product.name} | HS {ingredient.hsCode} | Scope {humanize(ingredient.relevance)}
            </p>
          </div>
          <Button type="button" variant="tertiary" size="sm" icon={<X className="h-4 w-4" aria-hidden="true" />} onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="border-b border-border-soft px-4 py-3">
          <div role="tablist" aria-label="Inspect plot workspaces" className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((tab, index) => {
              const selected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  role="tab"
                  type="button"
                  id={`${tabsBaseId}-tab-${tab.key}`}
                  aria-selected={selected}
                  aria-controls={`${tabsBaseId}-panel-${tab.key}`}
                  tabIndex={selected ? 0 : -1}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2",
                    selected
                      ? "border-brand-accent bg-brand-accent-soft text-brand-primary"
                      : "border-border-soft bg-bg-surface-alt text-text-secondary hover:border-border-strong hover:text-text-primary",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "traceability" ? (
            <section role="tabpanel" id={`${tabsBaseId}-panel-traceability`} aria-labelledby={`${tabsBaseId}-tab-traceability`} className="space-y-4">
              <Card variant="inset" className="p-4 text-sm text-text-secondary">
                Review tier-by-tier entities and request states for this ingredient path.
              </Card>
              {ingredientNodes.length === 0 ? (
                <Card variant="inset" className="p-4 text-sm text-text-secondary">
                  No upstream nodes configured for this ingredient.
                </Card>
              ) : (
                <div className="space-y-3">
                  {ingredientNodes
                    .slice()
                    .sort((a, b) => a.tier - b.tier)
                    .map((node) => {
                      const request = eudrFormRequests.find((entry) => entry.targetNodeId === node.id);
                      return (
                        <Card key={node.id} variant="inset" className="space-y-2 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Tag tone="neutral">Tier {node.tier}</Tag>
                              <Tag tone="brand">{humanize(node.actorType)}</Tag>
                            </div>
                            <StatusBadge status={toTone(node.status)}>{humanize(node.status)}</StatusBadge>
                          </div>
                          <p className="font-semibold text-brand-primary">{node.entityName}</p>
                          <p className="text-xs text-text-secondary">
                            {node.country} | {node.materialName}
                          </p>
                          {request ? <p className="text-xs text-text-secondary">Request token: {request.tokenLabel}</p> : null}
                        </Card>
                      );
                    })}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "plots" ? (
            <section role="tabpanel" id={`${tabsBaseId}-panel-plots`} aria-labelledby={`${tabsBaseId}-tab-plots`} className="space-y-4">
              <Card variant="inset" className="p-4 text-sm text-text-secondary">
                Validate plot geometry and evidence quality before downstream clearance.
              </Card>

              {linkedPlots.length === 0 ? (
                <Card variant="inset" className="p-4 text-sm text-text-secondary">
                  No agricultural parcels are associated with this ingredient supplier path.
                </Card>
              ) : (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {linkedPlots.map((plot) => (
                      <button
                        key={plot.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlotId(plot.id);
                          setGeoValidationState("IDLE");
                        }}
                        className={[
                          "min-h-11 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2",
                          selectedPlotId === plot.id
                            ? "border-brand-accent bg-brand-accent-soft text-brand-primary"
                            : "border-border-soft bg-bg-surface-alt text-text-secondary hover:border-border-strong hover:text-text-primary",
                        ].join(" ")}
                      >
                        {plot.label}
                      </button>
                    ))}
                  </div>

                  {activePlot ? (
                    <Card className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Card variant="inset" className="space-y-1 p-3">
                          <p className="text-xs text-text-secondary">Origin country</p>
                          <p className="text-sm font-semibold text-text-primary">{activePlot.sourceCountry}</p>
                        </Card>
                        <Card variant="inset" className="space-y-1 p-3">
                          <p className="text-xs text-text-secondary">Geometry type</p>
                          <p className="text-sm font-semibold text-text-primary">{activePlot.geoType}</p>
                        </Card>
                        <Card variant="inset" className="space-y-1 p-3">
                          <p className="text-xs text-text-secondary">Area</p>
                          <p className="text-sm font-semibold text-text-primary">{activePlot.areaHa} ha</p>
                        </Card>
                        <Card variant="inset" className="space-y-1 p-3">
                          <p className="text-xs text-text-secondary">Parcel status</p>
                          <StatusBadge status={toTone(activePlot.status)}>{humanize(activePlot.status)}</StatusBadge>
                        </Card>
                      </div>
                      <Card variant="inset" className="space-y-2 p-3">
                        <p className="text-xs text-text-secondary">Coordinate summary</p>
                        <p className="text-sm leading-6 text-text-primary">{activePlot.coordinatesSummary}</p>
                      </Card>
                      {/* Mini GIS Map Canvas */}
                      <Card variant="inset" className="relative h-44 w-full bg-[#001712] overflow-hidden border border-white/5 rounded-lg flex items-center justify-center">
                        <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />
                        <svg className="w-full h-full" viewBox="0 0 220 150">
                          <g transform="translate(10, 5)">
                            <path
                              d={activePlot.id === "plot-cargill-01" ? "M 30,20 L 160,20 L 180,120 L 40,120 Z" : activePlot.id === "plot-jb-02" ? "M 60,30 L 140,25 L 160,105 L 50,110 Z" : activePlot.id === "plot-demo-approved" ? "M 50,35 L 155,30 L 165,115 L 45,120 Z" : "M 50,40 L 150,30 L 170,110 L 40,120 Z"}
                              className={[
                                "fill-brand-accent/5 stroke-[1.5px] pulsing-boundary",
                                geoValidationState === "SUCCESS" ? "stroke-emerald-500 fill-emerald-500/10" : "stroke-brand-accent/60",
                              ].join(" ")}
                            />
                            {geoValidationState === "VALIDATING" && (
                              <line x1="20" y1="20" x2="180" y2="120" className="stroke-brand-accent/40 stroke-[2px] animate-pulse" />
                            )}
                          </g>
                        </svg>
                        <div className="absolute bottom-2 left-2 bg-black/60 border border-white/10 rounded px-2 py-0.5 text-[8px] font-mono text-white/80">
                          {activePlot.geoType}: {activePlot.label}
                        </div>
                      </Card>

                      <Card variant="inset" className="space-y-3 p-3">
                        <p className="text-xs font-bold text-brand-primary">Upload and validate geolocation file</p>
                        <input
                          type="file"
                          accept=".geojson,.kml,.kmz,.shp,.zip"
                          onChange={handleUploadGeoFile}
                          className="block w-full cursor-pointer rounded-md border border-border-soft bg-bg-surface px-3 py-1.5 text-xs text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-brand-accent file:px-3 file:py-1 file:text-[10px] file:font-semibold file:text-brand-primary"
                        />
                        {uploadedFileName ? <p className="text-[10px] text-text-secondary">Selected file: {uploadedFileName}</p> : null}
                        
                        {terminalLogs.length > 0 && (
                          <Card variant="inset" className="p-3 bg-black border border-white/10 font-mono text-[9px] text-emerald-400 space-y-1 h-32 overflow-y-auto">
                            {terminalLogs.map((log, index) => (
                              <p key={index} className="leading-4">{log}</p>
                            ))}
                          </Card>
                        )}

                        {geoValidationState === "VALIDATING" ? (
                          <div className="flex items-center gap-2 rounded-md border border-state-warning/40 bg-state-warning/10 p-3 text-xs text-state-warning">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            Analyst parser validating geometry, projection WGS-84, and overlap matrices...
                          </div>
                        ) : null}
                        {geoValidationState === "SUCCESS" ? (
                          <div className="flex items-start gap-2 rounded-md border border-state-success/40 bg-state-success/10 p-3 text-xs text-state-success">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>Validation passed! Parsed {parsedVertices} WGS-84 boundary vertices. Plot marked COMPLIANT.</span>
                          </div>
                        ) : null}
                      </Card>
                    </Card>
                  ) : null}
                </>
              )}
            </section>
          ) : null}

          {activeTab === "deforestation" ? (
            <section role="tabpanel" id={`${tabsBaseId}-panel-deforestation`} aria-labelledby={`${tabsBaseId}-tab-deforestation`} className="space-y-4">
              <Card variant="inset" className="p-4 text-sm text-text-secondary">
                Run and verify deforestation analysis for selected parcel evidence.
              </Card>
              {activePlot ? (
                <Card className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Card variant="inset" className="space-y-1 p-3">
                      <p className="text-xs text-text-secondary">Selected plot</p>
                      <p className="text-sm font-semibold text-text-primary">{activePlot.label}</p>
                    </Card>
                    <Card variant="inset" className="space-y-1 p-3">
                      <p className="text-xs text-text-secondary">Deforestation status</p>
                      <StatusBadge status={toTone(activePlot.latestDeforestationStatus)}>{humanize(activePlot.latestDeforestationStatus)}</StatusBadge>
                    </Card>
                  </div>

                  {activePlot.latestDeforestationStatus !== "CLEAR" && !isScanning ? (
                    <Button type="button" onClick={startSatelliteScan} icon={<ScanSearch className="h-4 w-4" aria-hidden="true" />}>
                      Start satellite scan
                    </Button>
                  ) : null}

                  {isScanning ? (
                    <Card variant="inset" className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-brand-primary">Satellite radar ingestion scan in progress</p>
                        <Tag tone="warning" className="text-[10px]">{scanProgress}%</Tag>
                      </div>

                      {/* Interactive Radar Scanning Vector Canvas */}
                      <Card variant="inset" className="relative h-40 w-full bg-[#001712] overflow-hidden border border-white/5 rounded-lg flex items-center justify-center">
                        <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />
                        <svg className="w-full h-full" viewBox="0 0 220 150">
                          <g transform="translate(10, 5)">
                            <path
                              d={activePlot.id === "plot-cargill-01" ? "M 30,20 L 160,20 L 180,120 L 40,120 Z" : activePlot.id === "plot-jb-02" ? "M 60,30 L 140,25 L 160,105 L 50,110 Z" : activePlot.id === "plot-demo-approved" ? "M 50,35 L 155,30 L 165,115 L 45,120 Z" : "M 50,40 L 150,30 L 170,110 L 40,120 Z"}
                              className="fill-brand-accent/5 stroke-brand-accent stroke-[1.5px] pulsing-boundary"
                            />
                          </g>
                        </svg>
                        <div className="absolute inset-x-0 h-0.5 bg-brand-accent/60 shadow-[0_0_12px_#f4c400] radar-sweep-line pointer-events-none" />
                        <div className="absolute bottom-2 left-2 bg-black/60 border border-white/10 rounded px-2 py-0.5 text-[8px] font-mono text-white/80">
                          Sentinel-2 SAR / Ingest: {scanStep}
                        </div>
                      </Card>

                      <div className="h-1.5 overflow-hidden rounded-full bg-bg-surface-alt">
                        <div className="h-full bg-brand-accent transition-all duration-200" style={{ width: `${scanProgress}%` }} />
                      </div>
                      <p className="text-[10px] text-text-secondary font-semibold font-mono">{scanStep}</p>
                    </Card>
                  ) : null}

                  {activePlot.latestDeforestationStatus === "CLEAR" || linkedCase?.resultStatus === "CLEAR" ? (
                    <Card variant="inset" className="space-y-3 border-state-success/40 bg-state-success/10 p-4">
                      <div className="flex items-start gap-2 text-state-success">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <p className="text-sm font-semibold">Forest-clear validation is complete.</p>
                      </div>
                      <Button type="button" size="sm" variant="secondary" icon={<FileCheck2 className="h-4 w-4" aria-hidden="true" />} onClick={() => triggerToast("Downloaded forest-clear certificate.")}>
                        Download certificate
                      </Button>
                    </Card>
                  ) : null}
                </Card>
              ) : (
                <Card variant="inset" className="p-4 text-sm text-text-secondary">
                  Select a plot in the Plots tab to run deforestation analysis.
                </Card>
              )}
            </section>
          ) : null}

          {activeTab === "documents" ? (
            <section role="tabpanel" id={`${tabsBaseId}-panel-documents`} aria-labelledby={`${tabsBaseId}-tab-documents`} className="space-y-4">
              <Card variant="inset" className="p-4 text-sm text-text-secondary">
                Review declarations and evidence attachments linked to this ingredient path.
              </Card>

              <Card className="space-y-3">
                <h3 className="text-sm font-bold text-brand-primary">Farmer submissions</h3>
                {submissionRows.length === 0 ? (
                  <p className="text-sm text-text-secondary">No farmer declarations are currently linked.</p>
                ) : (
                  <TableRoot>
                    <Table>
                      <TableHead>
                        <tr>
                          <TableHeaderCell>Request</TableHeaderCell>
                          <TableHeaderCell>Signer</TableHeaderCell>
                          <TableHeaderCell>Plots</TableHeaderCell>
                          <TableHeaderCell>Status</TableHeaderCell>
                        </tr>
                      </TableHead>
                      <TableBody>
                        {submissionRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.requestId}</TableCell>
                            <TableCell>{row.signatureName || "Unknown"}</TableCell>
                            <TableCell>{row.plotRows.length}</TableCell>
                            <TableCell>
                              <StatusBadge status="ready">Signed</StatusBadge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableRoot>
                )}
              </Card>

              <Card className="space-y-3">
                <h3 className="text-sm font-bold text-brand-primary">Evidence attachments</h3>
                {attachmentRows.length === 0 ? (
                  <div className="flex items-start gap-2 rounded-md border border-state-warning/40 bg-state-warning/10 p-3 text-sm text-state-warning">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    No evidence files are linked to this ingredient path yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachmentRows.map((attachment) => (
                      <Card key={attachment.id} variant="inset" className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-brand-primary">{attachment.fileName}</p>
                          <p className="text-xs text-text-secondary">Section: {attachment.sectionRef}</p>
                        </div>
                        <StatusBadge status={toTone(attachment.status)}>{humanize(attachment.status)}</StatusBadge>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </section>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
