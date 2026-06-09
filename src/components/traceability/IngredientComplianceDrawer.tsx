"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileCheck2,
  FileText,
  Globe2,
  Loader2,
  ScanSearch,
  ShieldAlert,
  UploadCloud,
  X,
} from "lucide-react";
import type {
  EudrEvidenceAttachment,
  FarmerDeclarationSubmission,
  IngredientRecord,
  LegalityDossierRecord,
  LegalityEvidenceDocument,
  ProductRecord,
  SupplyChainNode,
} from "@/lib/gfi-dummy-data";
import { useSession } from "@/components/ui/PermissionGuard";
import {
  appendAuditEvent,
  getLegalityCompletionScore,
  summarizeLegalityDossier,
  toIngredientLegalityStatus,
} from "@/lib/legality-dossier";
import { Button, Card, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRoot, TableRow, Tag } from "@/components/ui";
import { DeforestationImageryWorkspace } from "@/components/traceability/DeforestationImageryWorkspace";

interface IngredientComplianceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: IngredientRecord;
  product: ProductRecord;
  initialTab?: "traceability" | "plots" | "deforestation" | "documents" | "legality";
}

type DrawerTab = "traceability" | "plots" | "deforestation" | "documents" | "legality";

const TABS: Array<{ key: DrawerTab; label: string }> = [
  { key: "traceability", label: "Traceability" },
  { key: "plots", label: "Plots" },
  { key: "deforestation", label: "Deforestation" },
  { key: "documents", label: "Documents" },
  { key: "legality", label: "Legality Dossier" },
];

function humanize(value: string) {
  return value.replace(/_/g, " ");
}

function toStatusTone(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("ready") || normalized.includes("complete") || normalized.includes("approved") || normalized.includes("verified") || normalized.includes("clear")) return "ready";
  if (normalized.includes("blocked") || normalized.includes("gap") || normalized.includes("reject") || normalized.includes("expired")) return "blocked";
  if (normalized.includes("review")) return "under_review";
  if (normalized.includes("request")) return "requested";
  return "info";
}

function getDueDiligenceCopy(mode: IngredientRecord["dueDiligenceMode"]) {
  if (mode === "SIMPLIFIED") return "Simplified due diligence applies. Article 10 mitigation steps are not expected unless new signals emerge.";
  if (mode === "ENHANCED") return "Enhanced due diligence applies. Mandatory mitigation evidence should be complete before operator filing.";
  return "Standard due diligence applies. Verify origin, legality, and traceability evidence before filing.";
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
    legalityDossiers,
    addOrEditLegalityDossier,
    verifyLegalityEvidenceDocument,
    addEudrEvidenceAttachment,
    editEudrEvidenceAttachment,
    deleteEudrEvidenceAttachment,
    suppliers,
    updateIngredientComplianceState,
  } = useSession();

  const [activeTab, setActiveTab] = useState<DrawerTab>(initialTab);
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(ingredient.primaryOriginCountry || ingredient.originCountries[0] || "");
  const [previewDocument, setPreviewDocument] = useState<LegalityEvidenceDocument | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
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
  const ingredientNodes = useMemo(() => supplyChainNodes.filter((node) => node.ingredientId === ingredient.id && node.productId === product.id), [supplyChainNodes, ingredient.id, product.id]);
  const activePlot = linkedPlots.find((plot) => plot.id === selectedPlotId) || linkedPlots[0];
  const linkedCase = allCases.find((item) => item.plotId === activePlot?.id);
  const submissionRows = useMemo(() => getSubmissionRows(farmerDeclarationSubmissions, ingredientNodes), [farmerDeclarationSubmissions, ingredientNodes]);
  const attachmentRows = useMemo(() => getAttachmentRows(eudrEvidenceAttachments, ingredientNodes), [eudrEvidenceAttachments, ingredientNodes]);
  const ingredientDossiers = useMemo(
    () => legalityDossiers.filter((dossier) => dossier.productId === product.id && dossier.ingredientId === ingredient.id),
    [legalityDossiers, product.id, ingredient.id],
  );
  const activeDossier = ingredientDossiers.find((dossier) => dossier.originCountry === selectedCountry) ?? ingredientDossiers[0] ?? null;
  const selectedDocument = activeDossier?.documents.find((document) => document.id === selectedDocumentId) ?? activeDossier?.documents[0] ?? null;

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    setActiveTab(initialTab);
    setGeoValidationState("IDLE");
    setIsScanning(false);
    setScanProgress(0);
    setScanStep("");
    setSelectedCountry(ingredient.primaryOriginCountry || ingredient.originCountries[0] || "");
  }, [isOpen, initialTab, ingredient.primaryOriginCountry, ingredient.originCountries]);

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
    if (!selectedDocument) return;
    setSelectedDocumentId(selectedDocument.id);
    setReviewNote(selectedDocument.verificationNote ?? "");
    setValidFrom(selectedDocument.validFrom ?? "");
    setValidTo(selectedDocument.validTo ?? "");
    setReferenceCode(selectedDocument.countryRegistrarRef ?? selectedDocument.customsSealRef ?? "");
  }, [selectedDocument?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const syncIngredientLegalityState = (nextDossiers: LegalityDossierRecord[]) => {
    const nextStatus = nextDossiers.length === 0
      ? "MISSING"
      : nextDossiers.some((dossier) => dossier.overallStatus === "GAPS_FOUND")
        ? "MISSING"
        : nextDossiers.every((dossier) => dossier.overallStatus === "COMPLETE")
          ? "COMPLETE"
          : "PARTIAL";
    updateIngredientComplianceState({
      productId: product.id,
      ingredientId: ingredient.id,
      changes: {
        legalityDossierStatus: nextStatus,
      },
    });
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
      `[SUCCESS] Plot geometry validated and parcel evidence bound to ingredient dossier.`,
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setTerminalLogs((prev) => [...prev, log]);
        if (index === logs.length - 1) {
          setGeoValidationState("SUCCESS");
          const vertices = Math.floor(Math.random() * 32) + 12;
          setParsedVertices(vertices);
          if (activePlot) {
            editPlot({
              ...activePlot,
              status: "APPROVED",
              geoType: "POLYGON",
              coordinatesSummary: `Polygon evidence parsed with ${vertices} validated vertices.`,
            });
          }
          triggerToast(`Validated geolocation package for ${activePlot?.label ?? "selected plot"}.`);
        }
      }, (index + 1) * 350);
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
              editDeforestationCase({
                ...linkedCase,
                resultStatus: "CLEAR",
                downstreamImpact: "NO_BLOCK",
                summary: "No post-2020 forest loss detected on approved polygon snapshot.",
                evidenceArtifact: `deforestation-verified-${activePlot.id}.json`,
              });
            }
            editPlot({
              ...activePlot,
              latestDeforestationStatus: "CLEAR",
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
      }, 220);
    }
    return () => clearInterval(timer);
  }, [isScanning, activePlot, linkedCase, editDeforestationCase, editPlot]);

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
    }
  };

  const handleLegalityUpload = (event: React.ChangeEvent<HTMLInputElement>, document: LegalityEvidenceDocument) => {
    const file = event.target.files?.[0];
    if (!file || !activeDossier) return;
    const nextDocument: LegalityEvidenceDocument = {
      ...document,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Compliance Officer",
      verificationStatus: "NOT_REVIEWED",
      verificationNote: "",
    };
    const replaced = Boolean(document.fileName);
    const nextDossier = {
      ...activeDossier,
      documents: activeDossier.documents.map((entry) => entry.id === nextDocument.id ? nextDocument : entry),
    };
    nextDossier.overallStatus = summarizeLegalityDossier(nextDossier.documents);
    nextDossier.auditTrail = appendAuditEvent(activeDossier.auditTrail, {
      timestamp: new Date().toISOString(),
      actor: "Compliance Officer",
      eventType: replaced ? "DOCUMENT_REPLACED" : "DOCUMENT_UPLOADED",
      message: `${nextDocument.sampleDocumentLabel} ${replaced ? "replaced" : "uploaded"} for ${activeDossier.originCountry}.`,
    });
    addOrEditLegalityDossier(nextDossier);
    syncIngredientLegalityState(
      ingredientDossiers.map((dossier) => dossier.id === nextDossier.id ? nextDossier : dossier),
    );
    triggerToast(`${nextDocument.sampleDocumentLabel} uploaded for ${activeDossier.originCountry}.`);
  };

  const handleVerification = (status: LegalityEvidenceDocument["verificationStatus"]) => {
    if (!activeDossier || !selectedDocument) return;
    verifyLegalityEvidenceDocument({
      dossierId: activeDossier.id,
      documentId: selectedDocument.id,
      verificationStatus: status,
      verificationNote: reviewNote,
      validFrom,
      validTo,
      countryRegistrarRef: selectedDocument.legalArea === "LAND_TENURE" ? referenceCode : undefined,
      customsSealRef: selectedDocument.legalArea === "TAX_AND_CUSTOMS" ? referenceCode : undefined,
      actor: "Compliance Reviewer",
    });

    const nextDossier: LegalityDossierRecord = {
      ...activeDossier,
      documents: activeDossier.documents.map((document) =>
        document.id === selectedDocument.id
          ? {
              ...document,
              verificationStatus: status,
              verificationNote: reviewNote,
              validFrom,
              validTo,
              countryRegistrarRef: selectedDocument.legalArea === "LAND_TENURE" ? referenceCode : document.countryRegistrarRef,
              customsSealRef: selectedDocument.legalArea === "TAX_AND_CUSTOMS" ? referenceCode : document.customsSealRef,
            }
          : document,
      ),
    };
    nextDossier.overallStatus = summarizeLegalityDossier(nextDossier.documents);
    syncIngredientLegalityState(
      ingredientDossiers.map((dossier) => dossier.id === nextDossier.id ? nextDossier : dossier),
    );
    triggerToast(`Document marked ${humanize(status)}.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/65 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && onClose()}>
      {toastMessage ? (
        <div className="fixed bottom-6 right-6 z-[1200] max-w-sm rounded-lg border border-brand-accent bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-card">
          {toastMessage}
        </div>
      ) : null}

      <aside
        ref={drawerRef}
        className="ml-auto flex h-full w-full max-w-[1040px] flex-col border-l border-border-soft bg-bg-surface shadow-card-hover"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${tabsBaseId}-title`}
      >
        <div className="border-b border-border-soft bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_35%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone="neutral">BOM {ingredient.percentage}</Tag>
                <StatusBadge status={toStatusTone(ingredient.readiness)}>{humanize(ingredient.readiness)}</StatusBadge>
                <StatusBadge status={toStatusTone(ingredient.legalityDossierStatus)}>{humanize(ingredient.legalityDossierStatus)}</StatusBadge>
              </div>
              <div>
                <h2 id={`${tabsBaseId}-title`} className="text-2xl font-extrabold text-brand-primary">
                  {ingredient.name}
                </h2>
                <p className="text-sm text-text-secondary">
                  {product.name} | HS {ingredient.hsCode} | Scope {humanize(ingredient.relevance)}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Card variant="inset" className="space-y-1 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Origin Country</p>
                  <p className="text-sm font-semibold text-text-primary">{ingredient.primaryOriginCountry || "Not assigned"}</p>
                </Card>
                <Card variant="inset" className="space-y-1 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">EU Risk Tier</p>
                  <p className="text-sm font-semibold text-text-primary">{ingredient.euRiskTier}</p>
                </Card>
                <Card variant="inset" className="space-y-1 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Due Diligence</p>
                  <p className="text-sm font-semibold text-text-primary">{humanize(ingredient.dueDiligenceMode)}</p>
                </Card>
              </div>
            </div>
            <Button type="button" variant="tertiary" size="sm" icon={<X className="h-4 w-4" />} onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="border-b border-border-soft px-4 py-3">
          <div role="tablist" aria-label="Inspect ingredient compliance workspaces" className="flex gap-2 overflow-x-auto pb-1">
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
                <div className="grid gap-3 md:grid-cols-2">
                  {ingredientNodes
                    .slice()
                    .sort((a, b) => a.tier - b.tier)
                    .map((node) => {
                      const request = eudrFormRequests.find((entry) => entry.targetNodeId === node.id);
                      return (
                        <Card key={node.id} variant="inset" className="space-y-3 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Tag tone="neutral">Tier {node.tier}</Tag>
                              <Tag tone="brand">{humanize(node.actorType)}</Tag>
                            </div>
                            <StatusBadge status={toStatusTone(node.status)}>{humanize(node.status)}</StatusBadge>
                          </div>
                          <div>
                            <p className="font-semibold text-brand-primary">{node.entityName}</p>
                            <p className="text-xs text-text-secondary">{node.country} | {node.materialName}</p>
                          </div>
                          {request ? (
                            <div className="rounded-lg border border-border-soft bg-bg-page/50 px-3 py-2 text-xs text-text-secondary">
                              <span className="font-semibold text-text-primary">Latest request:</span> {request.tokenLabel}
                            </div>
                          ) : null}
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
                          "min-h-11 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition",
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
                    <Card className="space-y-4 p-4">
                      <div className="grid gap-3 sm:grid-cols-4">
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
                          <StatusBadge status={toStatusTone(activePlot.status)}>{humanize(activePlot.status)}</StatusBadge>
                        </Card>
                      </div>

                      <Card variant="inset" className="space-y-2 p-3">
                        <p className="text-xs text-text-secondary">Coordinate summary</p>
                        <p className="text-sm leading-6 text-text-primary">{activePlot.coordinatesSummary}</p>
                      </Card>

                      <Card variant="inset" className="space-y-3 p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Upload and validate geolocation file</p>
                        <input
                          type="file"
                          accept=".geojson,.kml,.kmz,.shp,.zip"
                          onChange={handleUploadGeoFile}
                          className="block w-full cursor-pointer rounded-md border border-border-soft bg-bg-surface px-3 py-2 text-xs text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-brand-accent file:px-3 file:py-1 file:text-[10px] file:font-semibold file:text-brand-primary"
                        />
                        {uploadedFileName ? <p className="text-[11px] text-text-secondary">Selected file: {uploadedFileName}</p> : null}
                        {terminalLogs.length > 0 ? (
                          <Card variant="inset" className="h-32 overflow-y-auto border border-white/10 bg-black p-3 font-mono text-[10px] text-emerald-400">
                            {terminalLogs.map((log, index) => <p key={index}>{log}</p>)}
                          </Card>
                        ) : null}
                        {geoValidationState === "VALIDATING" ? (
                          <div className="flex items-center gap-2 rounded-md border border-state-warning/40 bg-state-warning/10 p-3 text-xs text-state-warning">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Analyst parser validating geometry, projection, and overlap matrices...
                          </div>
                        ) : null}
                        {geoValidationState === "SUCCESS" ? (
                          <div className="flex items-start gap-2 rounded-md border border-state-success/40 bg-state-success/10 p-3 text-xs text-state-success">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>Validation passed. Parsed {parsedVertices} WGS-84 boundary vertices and linked the file to the ingredient dossier.</span>
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
                <DeforestationImageryWorkspace
                  plot={activePlot}
                  deforestationCase={linkedCase}
                  compact
                  isScanning={isScanning}
                  scanProgress={scanProgress}
                  scanStep={scanStep || "Preparing parcel review workspace..."}
                  actions={(
                    <>
                      {activePlot.latestDeforestationStatus !== "CLEAR" && !isScanning ? (
                        <Button type="button" onClick={startSatelliteScan} icon={<ScanSearch className="h-4 w-4" />}>
                          Start satellite scan
                        </Button>
                      ) : null}
                      {activePlot.latestDeforestationStatus === "CLEAR" || linkedCase?.resultStatus === "CLEAR" ? (
                        <Button type="button" size="sm" variant="secondary" icon={<FileCheck2 className="h-4 w-4" />} onClick={() => triggerToast("Downloaded forest-clear certificate.")}>
                          Download certificate
                        </Button>
                      ) : null}
                    </>
                  )}
                />
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
              <Card className="space-y-3 p-4">
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
                            <TableCell><StatusBadge status="ready">Signed</StatusBadge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableRoot>
                )}
              </Card>
              <Card className="space-y-3 p-4">
                <h3 className="text-sm font-bold text-brand-primary">Evidence attachments</h3>
                <div className="flex items-center justify-between">
                  <div />
                  <div className="flex gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold" title="Add evidence file">
                      <UploadCloud className="h-4 w-4" /> Add evidence
                      <input type="file" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file || ingredientNodes.length === 0) return;
                        const nodeId = ingredientNodes[0].id;
                        const record: EudrEvidenceAttachment = {
                          id: `evid-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
                          requestId: `req-${nodeId}-${Date.now()}`,
                          nodeId,
                          sectionRef: "UPLOADED",
                          documentRole: "UPSTREAM_TRADE_PROOF",
                          fileName: file.name,
                          status: "ATTACHED",
                        };
                        addEudrEvidenceAttachment(record);
                        triggerToast(`Added evidence ${file.name}`);
                      }} />
                    </label>
                  </div>
                </div>
                {attachmentRows.length === 0 ? (
                  <div className="flex items-start gap-2 rounded-md border border-state-warning/40 bg-state-warning/10 p-3 text-sm text-state-warning">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    No evidence files are linked to this ingredient path yet.
                  </div>
                ) : (
                  <TableRoot>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>File</TableHeaderCell>
                          <TableHeaderCell>Supplier</TableHeaderCell>
                          <TableHeaderCell>Role</TableHeaderCell>
                          <TableHeaderCell>Section</TableHeaderCell>
                          <TableHeaderCell>Status</TableHeaderCell>
                          <TableHeaderCell>Actions</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attachmentRows.map((attachment) => {
                          const supplier = supplyChainNodes.find((n) => n.id === attachment.nodeId)
                          const supplierName = suppliers.find(s => s.id === supplier?.supplierId)?.name ?? supplier?.entityName ?? "Unknown"
                          return (
                            <TableRow key={attachment.id}>
                              <TableCell>
                                <div className="text-sm font-semibold text-text-primary">{attachment.fileName}</div>
                              </TableCell>
                              <TableCell>{supplierName}</TableCell>
                              <TableCell>{humanize(attachment.documentRole)}</TableCell>
                              <TableCell>{attachment.sectionRef}</TableCell>
                              <TableCell><StatusBadge status={toStatusTone(attachment.status)}>{humanize(attachment.status)}</StatusBadge></TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <button title="Edit" className="rounded-md border px-2 py-1 text-xs" onClick={() => {
                                    const updated = { ...attachment, fileName: `${attachment.fileName} (edited)` };
                                    editEudrEvidenceAttachment(updated);
                                    triggerToast(`Edited ${attachment.fileName}`);
                                  }}>✏️</button>
                                  <button title="Delete" className="rounded-md border px-2 py-1 text-xs" onClick={() => {
                                    deleteEudrEvidenceAttachment(attachment.id);
                                    triggerToast(`Deleted ${attachment.fileName}`);
                                  }}>🗑️</button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableRoot>
                )}
              </Card>
            </section>
          ) : null}

          {activeTab === "legality" ? (
            <section role="tabpanel" id={`${tabsBaseId}-panel-legality`} aria-labelledby={`${tabsBaseId}-tab-legality`} className="space-y-4">
              <Card className="border-border-strong/60 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_35%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-brand-primary" />
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Legality Dossier</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-text-primary">Origin-country evidence binder</h3>
                    <p className="max-w-2xl text-sm text-text-secondary">{getDueDiligenceCopy(ingredient.dueDiligenceMode)}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Card variant="inset" className="space-y-1 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Risk Tier</p>
                      <p className="text-sm font-semibold text-text-primary">{ingredient.euRiskTier}</p>
                    </Card>
                    <Card variant="inset" className="space-y-1 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Due Diligence</p>
                      <p className="text-sm font-semibold text-text-primary">{humanize(ingredient.dueDiligenceMode)}</p>
                    </Card>
                    <Card variant="inset" className="space-y-1 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Dossier State</p>
                      <StatusBadge status={toStatusTone(activeDossier?.overallStatus ?? "GAPS_FOUND")}>
                        {humanize(activeDossier?.overallStatus ?? "GAPS_FOUND")}
                      </StatusBadge>
                    </Card>
                  </div>
                </div>
              </Card>

              {ingredient.euRiskTier === "HIGH" ? (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  Enhanced due diligence is mandatory for this origin. Complete and verify all four legal evidence domains before operator filing.
                </div>
              ) : null}

              {ingredient.originCountries.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {ingredient.originCountries.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => setSelectedCountry(country)}
                      className={[
                        "min-h-11 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition",
                        selectedCountry === country
                          ? "border-brand-accent bg-brand-accent-soft text-brand-primary"
                          : "border-border-soft bg-bg-surface-alt text-text-secondary hover:border-border-strong hover:text-text-primary",
                      ].join(" ")}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              ) : null}

              {activeDossier ? (
                <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                  <div className="space-y-4">
                    <Card className="p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">{activeDossier.originCountry}</p>
                          <h4 className="text-lg font-bold text-brand-primary">Required legal evidence</h4>
                        </div>
                        <Tag tone="neutral">{getLegalityCompletionScore(activeDossier.documents)}% verified</Tag>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {activeDossier.documents.map((document) => (
                          <Card key={document.id} variant="inset" className="space-y-3 border border-border-soft/80 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-secondary">{humanize(document.legalArea)}</p>
                                <h5 className="text-sm font-bold text-text-primary">{document.sampleDocumentLabel}</h5>
                              </div>
                              <StatusBadge status={toStatusTone(document.verificationStatus)}>{humanize(document.verificationStatus)}</StatusBadge>
                            </div>
                            <p className="text-xs leading-5 text-text-secondary">{document.verificationMethod}</p>
                            <div className="rounded-xl border border-border-soft bg-white/70 p-3 text-xs">
                              {document.fileName ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-text-primary">{document.fileName}</span>
                                    <span className="text-text-secondary">{document.fileSize}</span>
                                  </div>
                                  <p className="text-text-secondary">
                                    Uploaded {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : "not yet"} by {document.uploadedBy ?? "Unassigned reviewer"}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-text-secondary">No document uploaded yet.</p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-accent bg-brand-accent-soft px-3 py-2 text-xs font-semibold text-brand-primary">
                                <UploadCloud className="h-3.5 w-3.5" />
                                Upload evidence
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(event) => handleLegalityUpload(event, document)}
                                />
                              </label>
                              <Button size="sm" variant="secondary" onClick={() => setPreviewDocument(document)} icon={<Eye className="h-4 w-4" />}>
                                Preview
                              </Button>
                              <Button size="sm" variant={selectedDocumentId === document.id ? "primary" : "secondary"} onClick={() => setSelectedDocumentId(document.id)} icon={<FileText className="h-4 w-4" />}>
                                Review
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <Card className="space-y-4 p-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">Reviewer Console</p>
                        <h4 className="text-lg font-bold text-brand-primary">{selectedDocument?.sampleDocumentLabel ?? "Select a document"}</h4>
                      </div>
                      {selectedDocument ? (
                        <>
                          <div className="grid gap-3">
                            <div className="rounded-xl border border-border-soft bg-bg-page/50 p-3 text-xs text-text-secondary">
                              {selectedDocument.fileName ? `Current file: ${selectedDocument.fileName}` : "Upload a file to enable verification."}
                            </div>
                            <label className="space-y-1 text-xs font-semibold text-text-secondary">
                              Reviewer note
                              <textarea
                                value={reviewNote}
                                onChange={(event) => setReviewNote(event.target.value)}
                                className="min-h-[88px] w-full rounded-xl border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary"
                                placeholder="Add registry checks, validity observations, or customs remarks..."
                              />
                            </label>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="space-y-1 text-xs font-semibold text-text-secondary">
                                Valid from
                                <input type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} className="w-full rounded-xl border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary" />
                              </label>
                              <label className="space-y-1 text-xs font-semibold text-text-secondary">
                                Valid to
                                <input type="date" value={validTo} onChange={(event) => setValidTo(event.target.value)} className="w-full rounded-xl border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary" />
                              </label>
                            </div>
                            <label className="space-y-1 text-xs font-semibold text-text-secondary">
                              Registrar / customs reference
                              <input value={referenceCode} onChange={(event) => setReferenceCode(event.target.value)} className="w-full rounded-xl border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary" placeholder="Registrar ref or customs seal" />
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => handleVerification("VERIFIED")} disabled={!selectedDocument.fileName} icon={<CheckCircle2 className="h-4 w-4" />}>
                              Verify
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleVerification("REJECTED")} disabled={!selectedDocument.fileName} icon={<AlertTriangle className="h-4 w-4" />}>
                              Reject
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleVerification("EXPIRED")} disabled={!selectedDocument.fileName} icon={<ShieldAlert className="h-4 w-4" />}>
                              Mark expired
                            </Button>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-text-secondary">Select a document card to review its verification fields.</p>
                      )}
                    </Card>

                    <Card className="space-y-4 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">Audit Trail</p>
                          <h4 className="text-lg font-bold text-brand-primary">Activity log</h4>
                        </div>
                        <Tag tone="neutral">{activeDossier.auditTrail.length}</Tag>
                      </div>
                      <div className="space-y-3">
                        {activeDossier.auditTrail.map((event) => (
                          <div key={event.id} className="rounded-xl border border-border-soft bg-bg-page/50 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-text-primary">{humanize(event.eventType)}</p>
                              <span className="text-[11px] text-text-secondary">{new Date(event.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="mt-1 text-sm text-text-secondary">{event.message}</p>
                            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-text-secondary">{event.actor}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card variant="inset" className="p-4 text-sm text-text-secondary">
                  No origin-country legality dossier is currently linked to this ingredient.
                </Card>
              )}
            </section>
          ) : null}
        </div>
      </aside>

      {previewDocument ? (
        <div
          className="fixed inset-0 z-[1250] flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPreviewDocument(null);
          }}
        >
          <Card className="w-full max-w-2xl space-y-4 p-6">
            <div className="flex items-start justify-between gap-4 border-b border-border-soft pb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">Simulated document preview</p>
                <h4 className="text-lg font-bold text-brand-primary">{previewDocument.sampleDocumentLabel}</h4>
              </div>
              <button type="button" onClick={() => setPreviewDocument(null)} className="text-text-secondary hover:text-text-primary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-2xl border border-dashed border-border-soft bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-brand-accent-soft p-3 text-brand-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-text-primary">{previewDocument.fileName ?? "No uploaded file yet"}</p>
                  <p className="text-sm text-text-secondary">This placeholder preview simulates the in-app evidence viewer for uploaded legality records.</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-border-soft bg-white/80 px-3 py-2 text-xs text-text-secondary">Type: {previewDocument.fileType ?? "Unknown"}</div>
                    <div className="rounded-xl border border-border-soft bg-white/80 px-3 py-2 text-xs text-text-secondary">Status: {humanize(previewDocument.verificationStatus)}</div>
                    <div className="rounded-xl border border-border-soft bg-white/80 px-3 py-2 text-xs text-text-secondary">Valid from: {previewDocument.validFrom ?? "Not set"}</div>
                    <div className="rounded-xl border border-border-soft bg-white/80 px-3 py-2 text-xs text-text-secondary">Valid to: {previewDocument.validTo ?? "Not set"}</div>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={() => setPreviewDocument(null)} className="w-full justify-center">Close Preview</Button>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
