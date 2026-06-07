"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Eye,
  FileCheck2,
  Globe2,
  Loader2,
  Printer,
  QrCode,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  DdsSubmissionRecord,
  IngredientRecord,
  LegalityDossierRecord,
  PlotRecord,
  ProductRecord,
} from "@/lib/gfi-dummy-data";
import { useSession } from "@/components/ui/PermissionGuard";
import { simulateTracesSubmission } from "@/lib/traces-simulator";
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
import type { RiskTone, StatusTone } from "@/lib/ui-semantics";
import { DeforestationImageryWorkspace } from "@/components/traceability/DeforestationImageryWorkspace";
import {
  buildEudrChecklist,
  EUDR_COMMODITY_REPOSITORY,
  getApplicabilityCopy,
  getApplicabilityLabel,
  getApplicabilityTone,
} from "@/lib/eudr-commodity-repository";

type ComplianceTab = "ingredients" | "deforestation" | "producers";

const RISK_TONES: Record<IngredientRecord["euRiskTier"], RiskTone> = {
  LOW: "low",
  STANDARD: "medium",
  HIGH: "high",
  UNKNOWN: "medium",
};

const DDS_STATUS_TONES: Record<IngredientRecord["ddsStatus"] | "SUBMITTING" | "SUBMISSION_FAILED", StatusTone> = {
  DRAFT: "draft",
  READY_FOR_TRACES: "pending",
  TRACES_SUBMITTED: "ready",
  SUBMITTING: "under_review",
  SUBMISSION_FAILED: "blocked",
};

function humanize(value: string) {
  return value.replace(/_/g, " ");
}

function dossierOverallStatus(dossiers: LegalityDossierRecord[]) {
  if (dossiers.length === 0) return "GAPS_FOUND";
  if (dossiers.some((dossier) => dossier.overallStatus === "GAPS_FOUND")) return "GAPS_FOUND";
  if (dossiers.every((dossier) => dossier.overallStatus === "COMPLETE")) return "COMPLETE";
  if (dossiers.some((dossier) => dossier.overallStatus === "UNDER_REVIEW")) return "UNDER_REVIEW";
  return "PARTIAL";
}

function statusTone(value: string): StatusTone {
  const normalized = value.toLowerCase();
  if (normalized.includes("ready") || normalized.includes("submitted") || normalized.includes("clear") || normalized.includes("complete")) return "ready";
  if (normalized.includes("fail") || normalized.includes("blocked") || normalized.includes("flagged") || normalized.includes("gaps")) return "blocked";
  if (normalized.includes("review")) return "under_review";
  if (normalized.includes("request")) return "requested";
  return "info";
}

function dueDiligenceCopy(mode: IngredientRecord["dueDiligenceMode"]) {
  if (mode === "SIMPLIFIED") return "Low-risk sourcing. Simplified due diligence can be applied with retained legality and traceability evidence.";
  if (mode === "ENHANCED") return "High-risk sourcing. Enhanced due diligence and mitigation evidence are mandatory before filing.";
  return "Standard due diligence. Maintain origin, legality, and traceability evidence in the active dossier.";
}

function getPayloadBlockers(input: {
  ingredient: IngredientRecord;
  dossiers: LegalityDossierRecord[];
  plots: PlotRecord[];
  evidenceCount: number;
}): string[] {
  const blockers: string[] = [];
  if (input.ingredient.originCountries.length === 0) blockers.push("Origin country is missing.");
  if (input.evidenceCount === 0) blockers.push("No traceability evidence attachments are linked.");
  if (input.plots.length === 0 && input.ingredient.relevance === "IN_SCOPE") blockers.push("No linked plot evidence is available.");
  if (input.ingredient.euRiskTier === "HIGH" && dossierOverallStatus(input.dossiers) !== "COMPLETE") {
    blockers.push("High-risk origin requires a fully complete and verified legality dossier.");
  }
  return blockers;
}

export default function EudrComplianceDashboard() {
  const {
    products,
    suppliers,
    plots,
    deforestationCases,
    supplyChainNodes,
    farmerDeclarationSubmissions,
    eudrEvidenceAttachments,
    legalityDossiers,
    ddsSubmissions,
    editPlot,
    editDeforestationCase,
    addOrEditDdsSubmission,
    updateIngredientComplianceState,
  } = useSession();

  const [activeTab, setActiveTab] = useState<ComplianceTab>("ingredients");
  const [selectedProductId, setSelectedProductId] = useState("prd-chocolate");
  const [selectedIngredientId, setSelectedIngredientId] = useState("ing-choc-cocoa-natural");
  const [showDdsReport, setShowDdsReport] = useState(false);
  const [showResponsePreview, setShowResponsePreview] = useState(false);
  const [submissionInFlight, setSubmissionInFlight] = useState(false);
  const [submissionError, setSubmissionError] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [drawerState, setDrawerState] = useState<{ open: boolean; tab: "traceability" | "plots" | "deforestation" | "documents" | "legality" }>({
    open: false,
    tab: "legality",
  });
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [showQrVerification, setShowQrVerification] = useState(false);
  const [verificationAnimating, setVerificationAnimating] = useState(false);
  const [showCommodityRepository, setShowCommodityRepository] = useState(false);

  const ingredientsList = useMemo(() => {
    const list: Array<IngredientRecord & { product: ProductRecord }> = [];
    products.forEach((product) => {
      product.ingredients.forEach((ingredient) => {
        list.push({ ...ingredient, product });
      });
    });
    return list;
  }, [products]);

  const selectedIngredientItem = useMemo(
    () => ingredientsList.find((item) => item.id === selectedIngredientId && item.product.id === selectedProductId) ?? ingredientsList[0],
    [ingredientsList, selectedIngredientId, selectedProductId],
  );

  const selectedIngredientSupplier = useMemo(() => {
    if (!selectedIngredientItem) return null;
    return suppliers.find((supplier) => supplier.id === selectedIngredientItem.supplierIds[0]) ?? null;
  }, [selectedIngredientItem, suppliers]);

  const selectedIngredientPlots = useMemo(
    () => selectedIngredientItem ? plots.filter((plot) => selectedIngredientItem.supplierIds.includes(plot.supplierId)) : [],
    [plots, selectedIngredientItem],
  );

  const selectedIngredientNodes = useMemo(
    () => selectedIngredientItem ? supplyChainNodes.filter((node) => node.ingredientId === selectedIngredientItem.id && node.productId === selectedIngredientItem.product.id) : [],
    [selectedIngredientItem, supplyChainNodes],
  );

  const selectedIngredientDossiers = useMemo(
    () => selectedIngredientItem ? legalityDossiers.filter((dossier) => dossier.productId === selectedIngredientItem.product.id && dossier.ingredientId === selectedIngredientItem.id) : [],
    [legalityDossiers, selectedIngredientItem],
  );

  const selectedDdsSubmission = useMemo(() => {
    if (!selectedIngredientItem) return null;
    return ddsSubmissions
      .filter((submission) => submission.productId === selectedIngredientItem.product.id && submission.ingredientId === selectedIngredientItem.id)
      .sort((left, right) => left.submittedAt.localeCompare(right.submittedAt))
      .at(-1) ?? null;
  }, [ddsSubmissions, selectedIngredientItem]);

  const selectedPlot = useMemo(
    () => selectedIngredientPlots.find((plot) => plot.id === selectedPlotId) ?? selectedIngredientPlots[0] ?? plots[0],
    [plots, selectedIngredientPlots, selectedPlotId],
  );

  const selectedCase = useMemo(
    () => deforestationCases.find((item) => item.plotId === selectedPlot?.id) ?? null,
    [deforestationCases, selectedPlot],
  );

  const dossierStatus = useMemo(() => dossierOverallStatus(selectedIngredientDossiers), [selectedIngredientDossiers]);
  const dossierCompletionPercent = useMemo(() => {
    if (selectedIngredientDossiers.length === 0) return 0;
    const total = selectedIngredientDossiers.reduce((acc, dossier) => acc + dossier.documents.length, 0);
    const verified = selectedIngredientDossiers.reduce(
      (acc, dossier) => acc + dossier.documents.filter((document) => document.verificationStatus === "VERIFIED").length,
      0,
    );
    return Math.round((verified / total) * 100);
  }, [selectedIngredientDossiers]);

  const evidenceCount = useMemo(
    () => selectedIngredientNodes.reduce((count, node) => count + eudrEvidenceAttachments.filter((attachment) => attachment.nodeId === node.id && attachment.status === "ATTACHED").length, 0),
    [eudrEvidenceAttachments, selectedIngredientNodes],
  );
  const approvedPlotCount = useMemo(
    () => selectedIngredientPlots.filter((plot) => plot.status === "APPROVED").length,
    [selectedIngredientPlots],
  );
  const clearPlotCount = useMemo(
    () => selectedIngredientPlots.filter((plot) => plot.latestDeforestationStatus === "CLEAR").length,
    [selectedIngredientPlots],
  );
  const checklistItems = useMemo(
    () => selectedIngredientItem ? buildEudrChecklist({
      ingredient: selectedIngredientItem,
      plotCount: selectedIngredientPlots.length,
      approvedPlotCount,
      clearPlotCount,
      evidenceCount,
      dossierCompletionPercent,
    }) : [],
    [approvedPlotCount, clearPlotCount, dossierCompletionPercent, evidenceCount, selectedIngredientItem, selectedIngredientPlots.length],
  );
  const applicabilityTone = selectedIngredientItem ? getApplicabilityTone(selectedIngredientItem.relevance) : "info";
  const applicabilityLabel = selectedIngredientItem ? getApplicabilityLabel(selectedIngredientItem.relevance) : "Classification unavailable";
  const applicabilityCopy = selectedIngredientItem ? getApplicabilityCopy(selectedIngredientItem) : "No ingredient classification data is available.";

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3200);
  };

  useEffect(() => {
    if (selectedIngredientPlots.length > 0) {
      setSelectedPlotId(selectedIngredientPlots[0].id);
    }
  }, [selectedIngredientPlots]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isScanning && selectedPlot) {
      timer = setInterval(() => {
        setScanProgress((previous) => {
          if (previous >= 100) {
            clearInterval(timer);
            setIsScanning(false);
            editPlot({ ...selectedPlot, latestDeforestationStatus: "CLEAR", status: "APPROVED" });
            if (selectedCase) {
              editDeforestationCase({
                ...selectedCase,
                resultStatus: "CLEAR",
                downstreamImpact: "NO_BLOCK",
                summary: "Forest-clear verification completed via simulated Sentinel-2 workflow.",
              });
            }
            triggerToast(`Deforestation scan completed for ${selectedPlot.label}.`);
            return 100;
          }
          return previous + 10;
        });
      }, 240);
    }
    return () => clearInterval(timer);
  }, [isScanning, selectedPlot, selectedCase, editPlot, editDeforestationCase]);

  useEffect(() => {
    if (!showQrVerification) return;
    setVerificationAnimating(true);
    const timer = setTimeout(() => setVerificationAnimating(false), 2200);
    return () => clearTimeout(timer);
  }, [showQrVerification]);

  const openDrawer = (tab: "traceability" | "plots" | "deforestation" | "documents" | "legality") => {
    setDrawerState({ open: true, tab });
  };

  const handleSubmitToTraces = async () => {
    if (!selectedIngredientItem || !selectedIngredientSupplier) return;
    const blockers = getPayloadBlockers({
      ingredient: selectedIngredientItem,
      dossiers: selectedIngredientDossiers,
      plots: selectedIngredientPlots,
      evidenceCount,
    });

    setSubmissionError([]);
    setSubmissionInFlight(true);
    await new Promise((resolve) => setTimeout(resolve, 900));

    const result = simulateTracesSubmission({
      payload: {
        productName: selectedIngredientItem.product.name,
        ingredientName: selectedIngredientItem.name,
        supplierName: selectedIngredientSupplier.name,
        originCountries: selectedIngredientItem.originCountries,
        euRiskTier: selectedIngredientItem.euRiskTier,
        dueDiligenceMode: selectedIngredientItem.dueDiligenceMode,
        plotCount: selectedIngredientPlots.length,
        evidenceCount,
        legalityStatus: selectedIngredientItem.legalityDossierStatus,
      },
      operatorEori: "DE-88127391",
      filingCountryCode: "DE",
    });

    if (!result.accepted || blockers.length > 0) {
      const combinedBlockers = [...new Set([...(result.accepted ? [] : result.blockers), ...blockers])];
      const failedRecord: DdsSubmissionRecord = {
        id: selectedDdsSubmission?.id ?? `dds-${selectedIngredientItem.product.id}-${selectedIngredientItem.id}`,
        productId: selectedIngredientItem.product.id,
        ingredientId: selectedIngredientItem.id,
        supplierId: selectedIngredientSupplier.id,
        status: "SUBMISSION_FAILED",
        tracesReferenceCode: selectedDdsSubmission?.tracesReferenceCode ?? "",
        submittedAt: new Date().toISOString(),
        submittedBy: "mg.compliance@fos-eudr.local",
        submissionMode: "SIMULATED",
        requestPayloadSummary: {
          productName: selectedIngredientItem.product.name,
          ingredientName: selectedIngredientItem.name,
          supplierName: selectedIngredientSupplier.name,
          originCountries: selectedIngredientItem.originCountries,
          euRiskTier: selectedIngredientItem.euRiskTier,
          dueDiligenceMode: selectedIngredientItem.dueDiligenceMode,
          plotCount: selectedIngredientPlots.length,
          evidenceCount,
          legalityStatus: selectedIngredientItem.legalityDossierStatus,
        },
        responseLog: combinedBlockers,
      };
      addOrEditDdsSubmission(failedRecord);
      updateIngredientComplianceState({
        productId: selectedIngredientItem.product.id,
        ingredientId: selectedIngredientItem.id,
        changes: { ddsStatus: "READY_FOR_TRACES" },
      });
      setSubmissionError(combinedBlockers);
      setSubmissionInFlight(false);
      return;
    }

    const successRecord: DdsSubmissionRecord = {
      id: selectedDdsSubmission?.id ?? `dds-${selectedIngredientItem.product.id}-${selectedIngredientItem.id}`,
      productId: selectedIngredientItem.product.id,
      ingredientId: selectedIngredientItem.id,
      supplierId: selectedIngredientSupplier.id,
      status: "TRACES_SUBMITTED",
      tracesReferenceCode: result.tracesReferenceCode,
      submittedAt: result.submittedAt,
      submittedBy: "mg.compliance@fos-eudr.local",
      submissionMode: "SIMULATED",
      requestPayloadSummary: {
        productName: selectedIngredientItem.product.name,
        ingredientName: selectedIngredientItem.name,
        supplierName: selectedIngredientSupplier.name,
        originCountries: selectedIngredientItem.originCountries,
        euRiskTier: selectedIngredientItem.euRiskTier,
        dueDiligenceMode: selectedIngredientItem.dueDiligenceMode,
        plotCount: selectedIngredientPlots.length,
        evidenceCount,
        legalityStatus: selectedIngredientItem.legalityDossierStatus,
      },
      responseLog: [result.message, `Operator EORI ${result.operatorEori}`, `TRACES reference ${result.tracesReferenceCode}`],
    };

    addOrEditDdsSubmission(successRecord);
    updateIngredientComplianceState({
      productId: selectedIngredientItem.product.id,
      ingredientId: selectedIngredientItem.id,
      changes: { ddsStatus: "TRACES_SUBMITTED" },
    });

    setSubmissionInFlight(false);
    setSubmissionError([]);
    setShowResponsePreview(true);
    triggerToast(`DDS submitted to simulated TRACES NT with reference ${result.tracesReferenceCode}.`);
  };

  const handleCopyReference = async () => {
    if (!selectedDdsSubmission?.tracesReferenceCode) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(selectedDdsSubmission.tracesReferenceCode);
    }
    triggerToast("TRACES reference copied.");
  };

  const selectedDdsState: IngredientRecord["ddsStatus"] | "SUBMITTING" | "SUBMISSION_FAILED" =
    submissionInFlight
      ? "SUBMITTING"
      : selectedDdsSubmission?.status === "SUBMISSION_FAILED"
        ? "SUBMISSION_FAILED"
        : selectedIngredientItem?.ddsStatus ?? "DRAFT";

  if (!selectedIngredientItem) {
    return <div className="p-6 text-sm text-text-secondary">No ingredient compliance data is available.</div>;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {toastMessage ? (
        <div className="fixed bottom-6 right-6 z-[1200] max-w-sm rounded-lg border border-brand-accent bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-card">
          {toastMessage}
        </div>
      ) : null}

      <SectionHeader
        title="EUDR Compliance Center"
        description="Decision hub for DDS filing, legality evidence, origin-country risk, and plot validation."
        actions={
          <div className="flex items-center gap-2">
            <Tag tone="brand">Target Cutoff: Dec 31, 2020</Tag>
            <Tag tone="neutral">TRACES NT Simulator</Tag>
            <Button size="sm" variant="secondary" onClick={() => setShowCommodityRepository(true)}>
              EUDR Commodity Repository
            </Button>
          </div>
        }
      />

      <div className="flex gap-2 border-b border-border-soft pb-1">
        {(["ingredients", "deforestation", "producers"] as ComplianceTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setShowDdsReport(false);
            }}
            className={[
              "px-4 py-2 text-sm font-bold border-b-2 transition-colors",
              activeTab === tab ? "border-brand-primary text-brand-primary" : "border-transparent text-text-secondary hover:text-text-primary",
            ].join(" ")}
          >
            {tab === "ingredients" ? "Ingredients Compliance" : tab === "deforestation" ? "Deforestation & Geolocation" : "Producer Disclosures"}
          </button>
        ))}
      </div>

      {activeTab === "ingredients" && !showDdsReport ? (
        <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
          <Card className="flex flex-col gap-4 p-5 xl:sticky xl:top-6 xl:max-h-[calc(100vh-8rem)] xl:overflow-hidden">
            <div className="border-b border-border-soft pb-3">
              <h2 className="text-lg font-bold text-brand-primary">BOM Ingredients Ledger</h2>
              <p className="text-xs text-text-secondary">Select an ingredient to review risk, legality, and DDS readiness.</p>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {ingredientsList.map((item) => {
                const selected = item.id === selectedIngredientItem.id && item.product.id === selectedIngredientItem.product.id;
                return (
                  <button
                    key={`${item.product.id}-${item.id}`}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(item.product.id);
                      setSelectedIngredientId(item.id);
                    }}
                    className={[
                      "w-full rounded-2xl border p-4 text-left transition",
                      selected ? "border-brand-accent bg-brand-accent-soft/60 shadow-card" : "border-border-soft bg-bg-surface-alt hover:border-border-strong",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-brand-primary">{item.name}</p>
                        <p className="text-xs text-text-secondary">{item.product.name} | {item.primaryOriginCountry || "No origin assigned"}</p>
                      </div>
                      <RiskBadge risk={RISK_TONES[item.euRiskTier]}>{item.euRiskTier}</RiskBadge>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="space-y-5 border-border-strong/70 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-brand-primary">{selectedIngredientItem.name}</h2>
                    <p className="text-sm text-text-secondary">
                      HS {selectedIngredientItem.hsCode} | Origin {selectedIngredientItem.primaryOriginCountry || "Unassigned"} | {selectedIngredientSupplier?.name ?? "No supplier"}
                    </p>
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-text-secondary">{applicabilityCopy}</p>
                  {selectedIngredientItem.classificationNote ? (
                    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-600">
                      <span className="font-semibold text-slate-900">Classification note:</span> {selectedIngredientItem.classificationNote}
                    </div>
                  ) : null}
                  {selectedIngredientItem.relevance === "IN_SCOPE" ? (
                    <p className="max-w-3xl text-sm leading-6 text-text-secondary">{dueDiligenceCopy(selectedIngredientItem.dueDiligenceMode)}</p>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card variant="inset" className="space-y-1 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">EUDR Commodity Scope</p>
                    <StatusBadge status={applicabilityTone}>{applicabilityLabel}</StatusBadge>
                  </Card>
                  <Card variant="inset" className="space-y-1 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">EU Risk Tier</p>
                    <RiskBadge risk={RISK_TONES[selectedIngredientItem.euRiskTier]}>{selectedIngredientItem.euRiskTier}</RiskBadge>
                  </Card>
                  <Card variant="inset" className="space-y-1 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Plots Linked</p>
                    <p className="text-lg font-bold text-text-primary">{selectedIngredientPlots.length}</p>
                  </Card>
                  <Card variant="inset" className="space-y-1 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">Evidence Files</p>
                    <p className="text-lg font-bold text-text-primary">{evidenceCount}</p>
                  </Card>
                </div>
              </div>

              {selectedIngredientItem.relevance === "OUT_OF_SCOPE" ? (
                <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                  <Globe2 className="mt-0.5 h-4 w-4 shrink-0" />
                  This ingredient is currently treated as outside EUDR Annex I scope. Keep HS classification support on file, but DDS filing, polygon mapping, and deforestation scan completion are informational rather than mandatory for this line.
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-3">
                <Card variant="inset" className="space-y-2 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">Risk Benchmarking</p>
                  <p className="text-sm text-text-secondary">Country benchmark</p>
                  <RiskBadge risk={RISK_TONES[selectedIngredientItem.euRiskTier]}>{selectedIngredientItem.euRiskTier}</RiskBadge>
                </Card>
                <Card variant="inset" className="space-y-2 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">Legality Dossier</p>
                  <p className="text-sm text-text-secondary">Overall status</p>
                  <StatusBadge status={statusTone(dossierStatus)}>{humanize(dossierStatus)}</StatusBadge>
                </Card>
                <Card variant="inset" className="space-y-2 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">DDS Filing</p>
                  <p className="text-sm text-text-secondary">Current workflow state</p>
                  <StatusBadge status={DDS_STATUS_TONES[selectedDdsState]}>{humanize(selectedDdsState)}</StatusBadge>
                </Card>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedIngredientItem.relevance === "IN_SCOPE" ? (
                  <Button onClick={() => setShowDdsReport(true)} icon={<FileCheck2 className="h-4 w-4" />}>
                    Open DDS Report Preview
                  </Button>
                ) : selectedIngredientItem.relevance === "UNDER_REVIEW" ? (
                  <Button variant="secondary" onClick={() => openDrawer("documents")} icon={<Eye className="h-4 w-4" />}>
                    Review Classification Evidence
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => openDrawer("documents")} icon={<Eye className="h-4 w-4" />}>
                    View Classification Record
                  </Button>
                )}
                <Button variant="secondary" onClick={() => openDrawer("legality")} icon={<Globe2 className="h-4 w-4" />}>
                  Open Legality Dossier
                </Button>
                <Button variant="secondary" onClick={() => openDrawer("documents")} icon={<Eye className="h-4 w-4" />}>
                  Inspect Evidence
                </Button>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="space-y-4 p-5 lg:col-span-2">
                <div>
                  <h3 className="text-lg font-bold text-brand-primary">EUDR Compliance Checklist</h3>
                  <p className="text-xs text-text-secondary">
                    {selectedIngredientItem.relevance === "OUT_OF_SCOPE"
                      ? "Checklist is adapted for an out-of-scope ingredient classification record."
                      : "Core ingredient-level checkpoints used to assess filing readiness."}
                  </p>
                </div>
                <div className="space-y-2.5">
                  {checklistItems.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2 rounded-[20px] border border-border-soft bg-bg-surface-alt/80 px-4 py-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[15px] font-semibold text-brand-primary">{item.label}</p>
                      </div>
                      <StatusBadge status={item.tone} className="self-start md:self-auto">
                        {item.detail}
                      </StatusBadge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-brand-primary">Legality Dossier Snapshot</h3>
                    <p className="text-xs text-text-secondary">Country-specific evidence readiness for the selected ingredient.</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => openDrawer("legality")}>Manage dossier</Button>
                </div>
                {selectedIngredientDossiers.length === 0 ? (
                  <div className="rounded-2xl border border-state-warning/40 bg-state-warning/10 p-4 text-sm text-state-warning">
                    No origin-country legality dossiers are available for this ingredient yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedIngredientDossiers.map((dossier) => (
                      <Card key={dossier.id} variant="inset" className="flex items-center justify-between gap-3 p-4">
                        <div>
                          <p className="font-semibold text-brand-primary">{dossier.originCountry}</p>
                          <p className="text-xs text-text-secondary">{humanize(dossier.dueDiligenceMode)} | {dossier.documents.filter((document) => document.verificationStatus === "VERIFIED").length}/{dossier.documents.length} verified</p>
                        </div>
                        <StatusBadge status={statusTone(dossier.overallStatus)}>{humanize(dossier.overallStatus)}</StatusBadge>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-brand-primary">Traceability and Plot Snapshot</h3>
                    <p className="text-xs text-text-secondary">Quick access to plot, deforestation, and upstream evidence.</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => openDrawer("traceability")}>Open detail workspace</Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card variant="inset" className="p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Supply chain nodes</p>
                    <p className="mt-1 text-lg font-bold text-text-primary">{selectedIngredientNodes.length}</p>
                  </Card>
                  <Card variant="inset" className="p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Producer submissions</p>
                    <p className="mt-1 text-lg font-bold text-text-primary">
                      {farmerDeclarationSubmissions.filter((submission) => selectedIngredientNodes.some((node) => node.id === submission.nodeId)).length}
                    </p>
                  </Card>
                </div>
                <div className="space-y-2">
                  {selectedIngredientPlots.map((plot) => (
                    <Card key={plot.id} variant="inset" className="flex items-center justify-between gap-3 p-3">
                      <div>
                        <p className="font-semibold text-brand-primary">{plot.label}</p>
                        <p className="text-xs text-text-secondary">{plot.sourceCountry} | {plot.areaHa} ha</p>
                      </div>
                      <StatusBadge status={statusTone(plot.latestDeforestationStatus)}>{humanize(plot.latestDeforestationStatus)}</StatusBadge>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "ingredients" && showDdsReport ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => setShowDdsReport(false)}>Back to ingredient workspace</Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setShowQrVerification(true)} icon={<QrCode className="h-4 w-4" />}>
                Verify QR Passport
              </Button>
              <Button variant="secondary" onClick={() => window.print()} icon={<Printer className="h-4 w-4" />}>
                Print DDS
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-border-strong/70 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)]">
            <div className="border-b border-border-soft bg-slate-950 px-6 py-5 text-white">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-emerald-300">EU 2023/1115 Article 9</p>
                  <h1 className="mt-2 text-3xl font-black">Due Diligence Statement</h1>
                  <p className="mt-2 text-sm text-slate-300">Prepared for TRACES NT filing under the current simulated operator flow.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Card className="border border-emerald-500/30 bg-emerald-500/10 p-3 text-white">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">Submission State</p>
                    <StatusBadge status={DDS_STATUS_TONES[selectedDdsState]}>{humanize(selectedDdsState)}</StatusBadge>
                  </Card>
                  <Card className="border border-slate-700 bg-slate-900 p-3 text-white">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">TRACES Ref</p>
                    <p className="font-mono text-sm font-bold">{selectedDdsSubmission?.tracesReferenceCode || "Pending submission"}</p>
                  </Card>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <Card variant="inset" className="space-y-1 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Product</p>
                      <p className="text-sm font-semibold text-text-primary">{selectedIngredientItem.product.name}</p>
                    </Card>
                    <Card variant="inset" className="space-y-1 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Ingredient</p>
                      <p className="text-sm font-semibold text-text-primary">{selectedIngredientItem.name}</p>
                    </Card>
                    <Card variant="inset" className="space-y-1 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Supplier</p>
                      <p className="text-sm font-semibold text-text-primary">{selectedIngredientSupplier?.name ?? "Unassigned"}</p>
                    </Card>
                    <Card variant="inset" className="space-y-1 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Origin</p>
                      <p className="text-sm font-semibold text-text-primary">{selectedIngredientItem.originCountries.join(", ") || "Not assigned"}</p>
                    </Card>
                    <Card variant="inset" className="space-y-1 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">EU Risk</p>
                      <RiskBadge risk={RISK_TONES[selectedIngredientItem.euRiskTier]}>{selectedIngredientItem.euRiskTier}</RiskBadge>
                    </Card>
                    <Card variant="inset" className="space-y-1 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Due Diligence</p>
                      <p className="text-sm font-semibold text-text-primary">{humanize(selectedIngredientItem.dueDiligenceMode)}</p>
                    </Card>
                  </div>

                  <Card variant="inset" className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">TRACES Gateway Simulator</p>
                        <h3 className="text-lg font-bold text-brand-primary">Submission control rail</h3>
                      </div>
                      <StatusBadge status={statusTone(dossierStatus)}>{humanize(dossierStatus)}</StatusBadge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Button onClick={handleSubmitToTraces} disabled={submissionInFlight || selectedDdsState === "TRACES_SUBMITTED"} icon={submissionInFlight ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}>
                        Submit to EU TRACES NT
                      </Button>
                      <Button variant="secondary" onClick={() => setShowResponsePreview((value) => !value)} icon={<Eye className="h-4 w-4" />}>
                        Preview Simulated Response
                      </Button>
                      <Button variant="secondary" onClick={handleCopyReference} disabled={!selectedDdsSubmission?.tracesReferenceCode} icon={<Copy className="h-4 w-4" />}>
                        Copy TRACES Reference
                      </Button>
                    </div>
                    {selectedIngredientItem.euRiskTier === "HIGH" ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        Enhanced due diligence gate active. TRACES filing remains disabled until the legality dossier is fully complete and verified.
                      </div>
                    ) : null}
                    {submissionError.length > 0 ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-semibold text-red-900">Submission blocked</p>
                        <ul className="mt-2 list-disc pl-5 text-sm text-red-800">
                          {submissionError.map((blocker) => <li key={blocker}>{blocker}</li>)}
                        </ul>
                      </div>
                    ) : null}
                    {showResponsePreview ? (
                      <Card className="border border-emerald-200 bg-emerald-50/60 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Simulated API Response</p>
                            <p className="text-sm text-emerald-900">{selectedDdsSubmission?.responseLog?.[0] ?? "Pending simulated submission."}</p>
                          </div>
                          {selectedDdsSubmission?.tracesReferenceCode ? (
                            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">{selectedDdsSubmission.tracesReferenceCode}</span>
                          ) : null}
                        </div>
                        {selectedDdsSubmission ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <Card variant="inset" className="p-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Submitted At</p>
                              <p className="mt-1 text-sm font-semibold text-text-primary">{new Date(selectedDdsSubmission.submittedAt).toLocaleString()}</p>
                            </Card>
                            <Card variant="inset" className="p-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Operator EORI</p>
                              <p className="mt-1 text-sm font-semibold text-text-primary">DE-88127391</p>
                            </Card>
                          </div>
                        ) : null}
                      </Card>
                    ) : null}
                  </Card>
                </div>

                <Card className="space-y-4 border border-border-soft bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-5">
                  <div className="rounded-2xl border border-border-soft bg-white p-4">
                    <div className="flex items-center justify-center">
                      <div className="grid grid-cols-5 gap-1 rounded-2xl bg-slate-950 p-4">
                        {Array.from({ length: 25 }).map((_, index) => (
                          <div key={index} className={index % 4 === 0 || index % 7 === 0 ? "h-3 w-3 rounded-sm bg-white" : "h-3 w-3 rounded-sm bg-emerald-500"} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-text-secondary">
                      Digital passport hash: eudr-dds-{selectedIngredientItem.id}
                    </p>
                  </div>
                  <div className="space-y-3 text-sm text-text-secondary">
                    <div className="flex items-center justify-between gap-3 border-b border-border-soft pb-2">
                      <span>EU filer operator</span>
                      <span className="font-semibold text-text-primary">FOS Global Sourcing Europe GmbH</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-border-soft pb-2">
                      <span>TRACES account</span>
                      <span className="font-semibold text-text-primary">EU-OP-901182</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-border-soft pb-2">
                      <span>Legality dossier</span>
                      <span className="font-semibold text-text-primary">{dossierCompletionPercent}% verified</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Plot references</span>
                      <span className="font-semibold text-text-primary">{selectedIngredientPlots.length} linked plots</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "deforestation" ? (
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-bold text-brand-primary">Plot Workspace</h2>
              <p className="text-xs text-text-secondary">Select a linked plot to review parcel geometry, compare EO imagery, and apply an analyst verdict.</p>
            </div>
            <div className="space-y-3">
              {selectedIngredientPlots.map((plot) => (
                <button
                  key={plot.id}
                  type="button"
                  onClick={() => setSelectedPlotId(plot.id)}
                  className={[
                    "w-full rounded-2xl border p-4 text-left transition",
                    selectedPlot?.id === plot.id ? "border-brand-accent bg-brand-accent-soft/60" : "border-border-soft bg-bg-surface-alt hover:border-border-strong",
                  ].join(" ")}
                >
                  <p className="font-semibold text-brand-primary">{plot.label}</p>
                  <p className="text-xs text-text-secondary">{plot.sourceCountry} | {plot.areaHa} ha</p>
                </button>
              ))}
            </div>
          </Card>

          {selectedPlot ? (
            <div className="space-y-6">
              <DeforestationImageryWorkspace
                plot={selectedPlot}
                deforestationCase={selectedCase}
                isScanning={isScanning}
                scanProgress={scanProgress}
                scanStep={
                  scanProgress < 25
                    ? "Initializing EO comparison package..."
                    : scanProgress < 55
                      ? "Acquiring current and baseline parcel imagery..."
                      : scanProgress < 85
                        ? "Running canopy and vegetation checks..."
                        : "Finalizing forest-clear evidence package..."
                }
                actions={(
                  <>
                    <Button onClick={() => { setIsScanning(true); setScanProgress(0); }} disabled={isScanning} icon={<Activity className="h-4 w-4" />}>
                      Run Satellite Scan
                    </Button>
                    <Button variant="secondary" onClick={() => {
                      editPlot({ ...selectedPlot, latestDeforestationStatus: "CLEAR", status: "APPROVED" });
                      if (selectedCase) {
                        editDeforestationCase({ ...selectedCase, resultStatus: "CLEAR", downstreamImpact: "NO_BLOCK", summary: "Manual auditor clearance applied after EO review." });
                      }
                      triggerToast("Plot marked clear.");
                    }} icon={<CheckCircle2 className="h-4 w-4" />}>
                      Approve & Clear
                    </Button>
                    <Button variant="secondary" onClick={() => {
                      editPlot({ ...selectedPlot, latestDeforestationStatus: "FLAGGED", status: "CHANGES_REQUESTED" });
                      if (selectedCase) {
                        editDeforestationCase({ ...selectedCase, resultStatus: "FLAGGED", downstreamImpact: "BLOCKING", summary: "Canopy change alert requires escalation and document review." });
                      }
                      triggerToast("Plot flagged for review.");
                    }} icon={<AlertTriangle className="h-4 w-4" />}>
                      Flag & Block
                    </Button>
                  </>
                )}
              />

              {selectedCase ? (
                <Card className="space-y-4 p-5">
                  <h3 className="text-lg font-bold text-brand-primary">Latest Deforestation Case</h3>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Card variant="inset" className="p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Provider</p>
                      <p className="mt-1 text-sm font-semibold text-text-primary">{selectedCase.provider}</p>
                    </Card>
                    <Card variant="inset" className="p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Decision</p>
                      <StatusBadge status={statusTone(selectedCase.resultStatus)}>{humanize(selectedCase.resultStatus)}</StatusBadge>
                    </Card>
                    <Card variant="inset" className="p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Impact</p>
                      <RiskBadge risk={selectedCase.downstreamImpact === "NO_BLOCK" ? "low" : selectedCase.downstreamImpact === "REVIEW_REQUIRED" ? "medium" : "high"}>
                        {humanize(selectedCase.downstreamImpact)}
                      </RiskBadge>
                    </Card>
                  </div>
                  <Card variant="inset" className="p-4 text-sm text-text-secondary">{selectedCase.summary}</Card>
                </Card>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === "producers" ? (
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-bold text-brand-primary">Upstream Producer Disclosure Packets</h2>
            <p className="text-xs text-text-secondary">Producer declarations and plot records parsed from the supplier workflow.</p>
          </div>
          <TableRoot>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Submission</TableHeaderCell>
                  <TableHeaderCell>Producer / Node</TableHeaderCell>
                  <TableHeaderCell>Commodity</TableHeaderCell>
                  <TableHeaderCell>Area</TableHeaderCell>
                  <TableHeaderCell>Geo Type</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {farmerDeclarationSubmissions.flatMap((submission) => {
                  const node = supplyChainNodes.find((entry) => entry.id === submission.nodeId);
                  return submission.plotRows.map((row) => (
                    <TableRow key={`${submission.id}-${row.plotId}`}>
                      <TableCell className="font-semibold text-xs">{row.plotId}</TableCell>
                      <TableCell className="text-xs font-bold text-brand-primary">{node?.entityName ?? "Independent cooperative"}</TableCell>
                      <TableCell className="text-xs">{row.commodityGrown}</TableCell>
                      <TableCell className="text-xs font-mono">{row.areaHa} ha</TableCell>
                      <TableCell className="text-xs font-bold">{row.coordinateType}</TableCell>
                      <TableCell><StatusBadge status="ready">SIGNED</StatusBadge></TableCell>
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          </TableRoot>
        </Card>
      ) : null}

      <IngredientComplianceDrawer
        isOpen={drawerState.open}
        onClose={() => setDrawerState((current) => ({ ...current, open: false }))}
        ingredient={selectedIngredientItem}
        product={selectedIngredientItem.product}
        initialTab={drawerState.tab}
      />

      {showQrVerification ? (
        <div
          className="fixed inset-0 z-[1350] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowQrVerification(false);
          }}
        >
          <Card className="max-w-md space-y-6 border border-border-soft p-6">
            <div className="flex items-center justify-between gap-4 border-b border-border-soft pb-3">
              <h3 className="text-sm font-extrabold text-brand-primary">Digital Passport Scan Simulator</h3>
              <button onClick={() => setShowQrVerification(false)} className="text-text-secondary hover:text-text-primary">
                <AlertTriangle className="h-4 w-4" />
              </button>
            </div>
            {verificationAnimating ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-brand-accent" />
                <p className="mt-4 text-sm font-semibold text-text-primary">Scanning digital compliance passport...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                  <p className="mt-2 text-sm font-bold text-emerald-900">EUDR passport verified</p>
                  <p className="mt-1 text-xs text-emerald-700">{selectedDdsSubmission?.tracesReferenceCode || `eudr-dds-${selectedIngredientItem.id}-hash`}</p>
                </div>
                <Button onClick={() => setShowQrVerification(false)} className="w-full justify-center">Close Scanner</Button>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {showCommodityRepository ? (
        <div
          className="fixed inset-0 z-[1320] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowCommodityRepository(false);
          }}
        >
          <Card className="max-h-[90vh] w-full max-w-6xl overflow-hidden border-border-strong/70 p-0">
            <div className="flex items-center justify-between gap-4 border-b border-border-soft bg-[linear-gradient(135deg,#f8fafc_0%,#eef6f0_100%)] px-6 py-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">Reference Repository</p>
                <h3 className="mt-2 text-2xl font-black text-brand-primary">EUDR Commodity Repository</h3>
                <p className="mt-2 max-w-3xl text-sm text-text-secondary">
                  Annex I commodity families, indicative HS-code groupings, and the evidence expectation typically associated with each EUDR-relevant sourcing path.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCommodityRepository(false)}
                className="rounded-full border border-border-soft bg-white p-2 text-text-secondary transition hover:text-text-primary"
                aria-label="Close commodity repository"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-120px)] overflow-auto p-6">
              <TableRoot>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Commodity</TableHeaderCell>
                      <TableHeaderCell>Indicative HS Codes</TableHeaderCell>
                      <TableHeaderCell>Annex I Signal</TableHeaderCell>
                      <TableHeaderCell>Examples</TableHeaderCell>
                      <TableHeaderCell>Operator Expectation</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {EUDR_COMMODITY_REPOSITORY.map((row) => (
                      <TableRow key={row.commodity}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tag tone="brand">{row.commodity}</Tag>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{row.hsCodes}</TableCell>
                        <TableCell className="text-sm">{row.annexSignal}</TableCell>
                        <TableCell className="text-sm">{row.examples}</TableCell>
                        <TableCell className="text-sm">{row.operatorExpectation}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableRoot>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
