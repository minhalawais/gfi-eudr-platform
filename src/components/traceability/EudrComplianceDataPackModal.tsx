"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileCheck2,
  Download,
  Search,
  Globe2,
  Copy,
  MapPin,
  Activity,
  FileText,
  Check,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  ConsignmentRecord,
  ProductRecord,
  IngredientRecord,
  PlotRecord,
  LegalityDossierRecord,
  DdsSubmissionRecord,
} from "@/lib/gfi-dummy-data";
import { useSession } from "@/components/ui/PermissionGuard";
import {
  Button,
  Card,
  StatusBadge,
  RiskBadge,
  ModalShell,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tag,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
} from "@/components/ui";
import type { RiskTone, StatusTone } from "@/lib/ui-semantics";

// ─── Interfaces & Helpers ───────────────────────────────────────────────────

export interface EudrComplianceDataPackModalProps {
  open: boolean;
  onClose: () => void;
  consignment: ConsignmentRecord;
}

const RISK_TONES: Record<IngredientRecord["euRiskTier"], RiskTone> = {
  LOW: "low",
  STANDARD: "medium",
  HIGH: "high",
  UNKNOWN: "medium",
};

const DOSSIER_STATUS_TONES: Record<string, StatusTone> = {
  COMPLETE: "ready",
  PARTIAL: "pending",
  UNDER_REVIEW: "under_review",
  GAPS_FOUND: "blocked",
};

const DDS_STATUS_TONES: Record<string, StatusTone> = {
  DRAFT: "draft",
  READY_FOR_TRACES: "pending",
  TRACES_SUBMITTED: "ready",
  SUBMISSION_FAILED: "blocked",
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function EudrComplianceDataPackModal({
  open,
  onClose,
  consignment,
}: EudrComplianceDataPackModalProps) {
  const {
    products,
    suppliers,
    plots,
    legalityDossiers,
    ddsSubmissions,
    supplyChainNodes,
  } = useSession();

  // ─── Verification Pack State ────────────────────────────────────────────────
  const [compiling, setCompiling] = useState(true);
  const [compilationProgress, setCompilationProgress] = useState(0);
  const [compilationStep, setCompilationStep] = useState("");
  
  // Active Navigation inside modal
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "traceability" | "plots" | "legality" | "dds">("overview");
  const [selectedIngredientIndex, setSelectedIngredientIndex] = useState(0);

  // Download Action State
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // ─── Compilation Simulation ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setCompiling(true);
      setCompilationProgress(0);
      return;
    }

    const steps = [
      { progress: 15, label: "Scanning consignment products and quantities..." },
      { progress: 35, label: "Fetching product Bill of Materials (BOM)..." },
      { progress: 55, label: "Resolving supply chain traceability nodes..." },
      { progress: 75, label: "Analyzing plot boundaries and Sentinel-2 imagery..." },
      { progress: 90, label: "Validating legality dossiers & certifications..." },
      { progress: 100, label: "Structuring TRACES NT Due Diligence statements..." },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setCompilationProgress(steps[currentStep].progress);
        setCompilationStep(steps[currentStep].label);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setCompiling(false);
        }, 300);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [open]);

  // ─── Data Extraction ────────────────────────────────────────────────────────
  
  // Get products listed on the consignment's dispatchLines
  const consignmentProducts = useMemo(() => {
    const lines = consignment.dispatchLines ?? [];
    return lines.map((line, idx) => {
      // Find full product details from session context
      const fullProduct = products.find((p) => p.name === line.productName);
      return {
        line,
        idx,
        productRecord: fullProduct,
      };
    });
  }, [consignment, products]);

  // Active product selected
  const activeProduct = useMemo(() => {
    return consignmentProducts[selectedProductIndex] ?? consignmentProducts[0] ?? null;
  }, [consignmentProducts, selectedProductIndex]);

  // All ingredients for the active product
  const activeIngredients = useMemo(() => {
    return activeProduct?.productRecord?.ingredients ?? [];
  }, [activeProduct]);

  // Active ingredient selected
  const activeIngredient = useMemo(() => {
    return activeIngredients[selectedIngredientIndex] ?? activeIngredients[0] ?? null;
  }, [activeIngredients, selectedIngredientIndex]);

  // Resolve supplier for active ingredient
  const activeSupplier = useMemo(() => {
    if (!activeIngredient) return null;
    const sId = activeIngredient.supplierIds[0];
    return suppliers.find((s) => s.id === sId) ?? null;
  }, [activeIngredient, suppliers]);

  // Resolve plots for active ingredient
  const activePlots = useMemo(() => {
    if (!activeIngredient) return [];
    return plots.filter((plot) => activeIngredient.supplierIds.includes(plot.supplierId));
  }, [activeIngredient, plots]);

  // Resolve legality dossiers for active ingredient
  const activeDossier = useMemo(() => {
    if (!activeProduct?.productRecord || !activeIngredient) return null;
    return (
      legalityDossiers.find(
        (d) =>
          d.productId === activeProduct.productRecord!.id &&
          d.ingredientId === activeIngredient.id
      ) ?? null
    );
  }, [activeProduct, activeIngredient, legalityDossiers]);

  // Resolve DDS submissions for active ingredient
  const activeDds = useMemo(() => {
    if (!activeProduct?.productRecord || !activeIngredient) return null;
    return (
      ddsSubmissions
        .filter(
          (sub) =>
            sub.productId === activeProduct.productRecord!.id &&
            sub.ingredientId === activeIngredient.id
        )
        .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
        .at(-1) ?? null
    );
  }, [activeProduct, activeIngredient, ddsSubmissions]);

  // Reset selected ingredient when product changes
  useEffect(() => {
    setSelectedIngredientIndex(0);
    setActiveTab("overview");
  }, [selectedProductIndex]);

  // Calculate overall consignment compliance status
  const overallCompliance = useMemo(() => {
    // If any product is NOT_READY, overall is REVIEW_REQUIRED
    const statuses = consignmentProducts.map(
      (cp) => cp.productRecord?.exportReadiness ?? "REVIEW_REQUIRED"
    );
    if (statuses.includes("NOT_READY")) return "NOT_READY";
    if (statuses.includes("REVIEW_REQUIRED")) return "REVIEW_REQUIRED";
    return "READY";
  }, [consignmentProducts]);

  // ─── Actions ─────────────────────────────────────────────────────────────────
  
  const handleDownloadPack = () => {
    setDownloading(true);
    setDownloadProgress(0);
    setShowDownloadSuccess(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setDownloadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setDownloading(false);
          setShowDownloadSuccess(true);
          setTimeout(() => setShowDownloadSuccess(false), 3000);
        }, 400);
      }
    }, 120);
  };

  const handleCopyDds = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  if (!open) return null;

  return (
    <ModalShell open={open} onClose={onClose} size="xl" className="flex flex-col h-[85vh] max-h-[750px]">
      {/* Dynamic Compiling Screen */}
      {compiling ? (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-b from-bg-surface to-bg-surface-alt text-center">
          <div className="relative mb-6">
            <div className="h-16 w-16 rounded-full border-4 border-brand-accent/20 border-t-brand-primary animate-spin" />
            <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-primary h-7 w-7 animate-pulse" />
          </div>
          <h3 className="text-lg font-extrabold text-brand-primary">Assembling Compliance Data Pack</h3>
          <p className="text-sm text-text-secondary mt-1 max-w-sm">
            Compiling and auditing regulatory traceability parameters for consignment shipment.
          </p>
          <div className="w-64 bg-border-soft rounded-full h-1.5 mt-6 overflow-hidden">
            <div
              className="bg-brand-primary h-1.5 transition-all duration-150 rounded-full"
              style={{ width: `${compilationProgress}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase mt-3 animate-pulse">
            {compilationStep}
          </span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border-soft px-6 py-4 bg-bg-surface-alt">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-brand-primary">EUDR Compliance Evidence Pack</h2>
                <Tag tone="brand" className="text-[10px] tracking-wide py-0.5">EU 2026 AUDIT READY</Tag>
              </div>
              <p className="text-xs text-text-secondary">
                Consolidated due diligence dossiers and geolocational verification for shipment{" "}
                <span className="font-bold text-text-primary">{consignment.reference}</span> (SO# {consignment.saleOrderNo || "—"})
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Consignment posture</p>
                <div className="mt-0.5">
                  <StatusBadge status={overallCompliance === "READY" ? "ready" : "review_required"}>
                    {overallCompliance === "READY" ? "COMPLIANT" : "UNDER COMPLIANCE REVIEW"}
                  </StatusBadge>
                </div>
              </div>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                icon={<X className="h-4 w-4" />}
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>

          {/* Modal Grid Body */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[260px_1fr]">
            
            {/* Left Sidebar: Products List */}
            <div className="border-r border-border-soft bg-bg-surface-alt/40 overflow-y-auto p-4 flex flex-col gap-3 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1">
                Products in Shipment ({consignmentProducts.length})
              </p>
              
              <div className="space-y-2">
                {consignmentProducts.map((cp, idx) => {
                  const isSelected = selectedProductIndex === idx;
                  const prod = cp.productRecord;
                  const line = cp.line;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedProductIndex(idx)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all duration-150 ${
                        isSelected
                          ? "border-brand-accent bg-brand-accent-soft/40 shadow-sm"
                          : "border-border-soft bg-bg-surface hover:border-border-strong"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-bold text-brand-primary truncate">{line.productName}</p>
                        <RiskBadge risk={prod?.exportReadiness === "READY" ? "low" : "high"} className="text-[9px] px-1 py-0 scale-90 origin-top-right">
                          {prod?.exportReadiness || "NOT_READY"}
                        </RiskBadge>
                      </div>
                      <p className="text-[10px] text-text-secondary mt-1">HS Code: {prod?.finishedHsCode || "—"}</p>
                      <div className="flex justify-between items-center text-[10px] text-text-secondary mt-1.5 pt-1 border-t border-border-soft/60">
                        <span>{line.totalCartons.toLocaleString()} ctns</span>
                        <span className="font-semibold text-text-primary">{(line.totalGrossWtKg / 1000).toFixed(2)} MT</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Selected Product Compliance Details */}
            <div className="overflow-y-auto p-5 sm:p-6 flex flex-col gap-5 min-w-0">
              
              {/* Product Info Summary */}
              {activeProduct ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-soft pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-brand-primary">{activeProduct.line.productName}</h3>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Finished HS {activeProduct.productRecord?.finishedHsCode || "—"} | BOM Revision {activeProduct.productRecord?.activeBomRevision || "—"} | Flow Mode: {formatLabel(activeProduct.productRecord?.operatorFlow || "")}
                      </p>
                    </div>
                    <div>
                      <StatusBadge status={activeProduct.productRecord?.exportReadiness === "READY" ? "ready" : "review_required"}>
                        {activeProduct.productRecord?.exportReadiness === "READY" ? "PASSED AUDIT" : "NEEDS VERIFICATION"}
                      </StatusBadge>
                    </div>
                  </div>

                  {/* Ingredients Ledger Section */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Ingredients Compliance Status</p>
                    <TableRoot className="border border-border-soft overflow-hidden">
                      <Table className="text-xs">
                        <TableHead>
                          <TableRow className="bg-bg-surface-alt">
                            <TableHeaderCell className="text-[10px] font-bold py-2">Ingredient</TableHeaderCell>
                            <TableHeaderCell className="text-[10px] font-bold py-2">Risk Benchmarking</TableHeaderCell>
                            <TableHeaderCell className="text-[10px] font-bold py-2">Legality Dossier</TableHeaderCell>
                            <TableHeaderCell className="text-[10px] font-bold py-2">DDS Status</TableHeaderCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {activeIngredients.map((ing, idx) => {
                            const ingDossier = legalityDossiers.find(
                              (d) =>
                                d.productId === activeProduct.productRecord?.id &&
                                d.ingredientId === ing.id
                            );
                            const dossierStatus = ingDossier?.overallStatus ?? "GAPS_FOUND";

                            const ingDds = ddsSubmissions
                              .filter(
                                (sub) =>
                                  sub.productId === activeProduct.productRecord?.id &&
                                  sub.ingredientId === ing.id
                              )
                              .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
                              .at(-1);
                            const ddsState = ingDds?.status ?? ing.ddsStatus ?? "DRAFT";

                            return (
                              <TableRow
                                key={ing.id}
                                onClick={() => setSelectedIngredientIndex(idx)}
                                className={`cursor-pointer transition-colors ${
                                  selectedIngredientIndex === idx
                                    ? "bg-brand-accent-soft/30 hover:bg-brand-accent-soft/40 font-semibold"
                                    : "hover:bg-bg-surface-alt"
                                }`}
                              >
                                <TableCell className="py-2 text-brand-primary font-bold">
                                  {ing.name}
                                </TableCell>
                                <TableCell className="py-2">
                                  <RiskBadge risk={RISK_TONES[ing.euRiskTier]}>{ing.euRiskTier}</RiskBadge>
                                </TableCell>
                                <TableCell className="py-2">
                                  <StatusBadge status={DOSSIER_STATUS_TONES[dossierStatus]}>
                                    {formatLabel(dossierStatus)}
                                  </StatusBadge>
                                </TableCell>
                                <TableCell className="py-2">
                                  <StatusBadge status={DDS_STATUS_TONES[ddsState]}>
                                    {formatLabel(ddsState)}
                                  </StatusBadge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableRoot>
                  </div>

                  {/* Active Ingredient Detailed Verification Tabs */}
                  {activeIngredient ? (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-brand-primary uppercase tracking-wider">
                          Dossier Drill-down: <span className="text-text-primary text-sm font-black lowercase">{activeIngredient.name}</span>
                        </p>
                      </div>

                      {/* Tab Selectors */}
                      <div className="flex gap-1 overflow-x-auto border-b border-border-soft pb-1">
                        {[
                          { key: "overview", label: "Evidence Summary" },
                          { key: "traceability", label: "Upstream Chain" },
                          { key: "plots", label: "Geolocation Plots" },
                          { key: "legality", label: "Legality Files" },
                          { key: "dds", label: "TRACES DDS" },
                        ].map((t) => (
                          <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key as any)}
                            className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                              activeTab === t.key
                                ? "border-brand-primary text-brand-primary"
                                : "border-transparent text-text-secondary hover:text-text-primary"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {/* Tab Contents */}
                      <div className="rounded-xl border border-border-soft bg-bg-surface-alt/25 p-4 min-h-[220px]">
                        
                        {/* 1. Evidence Summary */}
                        {activeTab === "overview" && (
                          <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <Card variant="inset" className="p-3 text-center space-y-1">
                                <span className="text-[9px] uppercase tracking-wider text-text-secondary">Direct Supplier</span>
                                <p className="text-xs font-bold text-text-primary truncate">{activeSupplier?.name || "—"}</p>
                              </Card>
                              <Card variant="inset" className="p-3 text-center space-y-1">
                                <span className="text-[9px] uppercase tracking-wider text-text-secondary">Country of Origin</span>
                                <p className="text-xs font-bold text-text-primary truncate">{activeIngredient.primaryOriginCountry || "—"}</p>
                              </Card>
                              <Card variant="inset" className="p-3 text-center space-y-1">
                                <span className="text-[9px] uppercase tracking-wider text-text-secondary">Geolocation Plots</span>
                                <p className="text-xs font-bold text-text-primary">{activePlots.length} polygons</p>
                              </Card>
                              <Card variant="inset" className="p-3 text-center space-y-1">
                                <span className="text-[9px] uppercase tracking-wider text-text-secondary">Legality Status</span>
                                <div className="flex justify-center mt-0.5">
                                  <StatusBadge status={DOSSIER_STATUS_TONES[activeDossier?.overallStatus ?? ""]}>
                                    {activeDossier ? formatLabel(activeDossier.overallStatus) : "MISSING"}
                                  </StatusBadge>
                                </div>
                              </Card>
                            </div>
                            
                            <div className="text-xs text-text-secondary space-y-2 leading-relaxed bg-bg-surface-alt/50 p-3 rounded-lg border border-border-soft/60">
                              <div className="flex items-start gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold text-text-primary">Deforestation Posture:</span> All associated supplier coordinates and boundaries have been vetted against December 31, 2020 forest clearance requirements. Zero anomalies found in Sentinel imagery history.
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold text-text-primary">Legality Check:</span> Sourcing license, custom clearances, grower consent declarations, and local processing certificates have been verified for compliance.
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. Traceability Upstream */}
                        {activeTab === "traceability" && (
                          <div className="space-y-4">
                            <p className="text-xs font-semibold text-text-secondary">Traceability supply chain map for this consignment dispatch line</p>
                            
                            <div className="flex flex-col gap-3 max-w-lg mt-2">
                              {/* Simple flow chart actors */}
                              <div className="flex items-center gap-3">
                                <div className="h-7 w-7 rounded-full bg-brand-primary text-white flex items-center justify-center text-[10px] font-bold shadow-sm">1</div>
                                <div className="flex-1 bg-bg-surface p-2.5 rounded-lg border border-border-soft">
                                  <p className="text-xs font-bold text-brand-primary">Grower Cooperative Farms</p>
                                  <p className="text-[10px] text-text-secondary">Primary origin geolocation plot collection · Indonesia</p>
                                </div>
                              </div>

                              <div className="w-0.5 h-3 bg-brand-primary/40 ml-[13px]" />

                              <div className="flex items-center gap-3">
                                <div className="h-7 w-7 rounded-full bg-brand-primary text-white flex items-center justify-center text-[10px] font-bold shadow-sm">2</div>
                                <div className="flex-1 bg-bg-surface p-2.5 rounded-lg border border-border-soft">
                                  <p className="text-xs font-bold text-brand-primary">Local Collector & Processing Mill</p>
                                  <p className="text-[10px] text-text-secondary">Bean processing, segregation & certificate check · Sumatra Mill</p>
                                </div>
                              </div>

                              <div className="w-0.5 h-3 bg-brand-primary/40 ml-[13px]" />

                              <div className="flex items-center gap-3">
                                <div className="h-7 w-7 rounded-full bg-brand-primary text-white flex items-center justify-center text-[10px] font-bold shadow-sm">3</div>
                                <div className="flex-1 bg-bg-surface p-2.5 rounded-lg border border-border-soft">
                                  <p className="text-xs font-bold text-brand-primary">{activeSupplier?.name || "Direct Supplier"}</p>
                                  <p className="text-[10px] text-text-secondary">Direct Vendor supply integration · Chain of Custody Model: Identity Preserved</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3. Geolocation Plots */}
                        {activeTab === "plots" && (
                          <div className="space-y-4">
                            <div className="flex flex-col lg:flex-row gap-4">
                              <div className="flex-1 space-y-3">
                                <p className="text-xs font-bold text-text-secondary">Linked Plots Deforestation Assessment</p>
                                <div className="space-y-2">
                                  {activePlots.length === 0 ? (
                                    <div className="text-xs text-text-secondary">No plots attached to this supplier's registry.</div>
                                  ) : (
                                    activePlots.map((plot) => (
                                      <div key={plot.id} className="p-2.5 border border-border-soft rounded-lg bg-bg-surface flex items-center justify-between text-xs">
                                        <div>
                                          <p className="font-bold text-text-primary">{plot.label}</p>
                                          <p className="text-[10px] text-text-secondary mt-0.5">
                                            Area: {plot.areaHa} Ha | GeoType: {plot.geoType} | Origin: {plot.sourceCountry}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <StatusBadge status={plot.latestDeforestationStatus === "CLEAR" ? "ready" : "blocked"}>
                                            {plot.latestDeforestationStatus === "CLEAR" ? "FOREST CLEAR" : "RISK DETECTED"}
                                          </StatusBadge>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Mock Sentinel Map Visual */}
                              {activePlots.length > 0 && (
                                <Card className="lg:w-60 bg-slate-950 p-2.5 text-slate-100 flex flex-col justify-between h-[180px] select-none border-slate-800">
                                  <div>
                                    <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-emerald-400 font-black">
                                      <span>Sentinel-2 Radar Scan</span>
                                      <span className="animate-pulse">● LIVE</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 font-mono">Center: {activePlots[0].areaHa > 10 ? "0.8142° N, 109.8271° E" : "4.2105° N, 101.9758° E"}</p>
                                  </div>
                                  
                                  {/* Simulated map boundary vector mockup */}
                                  <div className="flex-1 my-2 border border-slate-800 rounded bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.15),transparent_70%)] relative flex items-center justify-center overflow-hidden">
                                    <svg className="h-full w-full opacity-60" viewBox="0 0 100 100">
                                      {/* Grid lines */}
                                      <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeWidth="0.5" />
                                      <line x1="50" y1="0" x2="50" y2="100" stroke="#1e293b" strokeWidth="0.5" />
                                      <circle cx="50" cy="50" r="30" stroke="#1e293b" strokeWidth="0.5" fill="none" />
                                      
                                      {/* Mock Plot Polygon */}
                                      <polygon points="30,40 65,30 75,65 45,70 35,55" fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="1.5" />
                                    </svg>
                                    <div className="absolute text-[8px] bg-slate-950/80 px-1 py-0.5 rounded text-emerald-300 font-bold border border-emerald-500/20">
                                      Canopy Stable (No loss)
                                    </div>
                                  </div>

                                  <div className="text-[9px] text-slate-400 font-mono text-center">
                                    Assessed date: 2026-05 window
                                  </div>
                                </Card>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 4. Legality Files */}
                        {activeTab === "legality" && (
                          <div className="space-y-4">
                            <p className="text-xs font-semibold text-text-secondary">Verified Legality Dossier Documents</p>
                            
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-border-soft text-text-secondary bg-bg-surface-alt/40">
                                    <th className="pb-2 font-bold">Document Type</th>
                                    <th className="pb-2 font-bold">Reference ID</th>
                                    <th className="pb-2 font-bold">Verification Status</th>
                                    <th className="pb-2 font-bold">Expiration Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {!activeDossier || activeDossier.documents.length === 0 ? (
                                    <tr>
                                      <td colSpan={4} className="py-4 text-center text-text-secondary">
                                        No documents found in this ingredient legality dossier.
                                      </td>
                                    </tr>
                                  ) : (
                                    activeDossier.documents.map((doc) => (
                                      <tr key={doc.id} className="border-b border-border-soft/60 hover:bg-bg-surface-alt/30">
                                        <td className="py-2.5 font-bold text-text-primary">{formatLabel(doc.sampleDocumentLabel)}</td>
                                        <td className="py-2.5 font-mono text-text-secondary">{doc.fileName || doc.id}</td>
                                        <td className="py-2.5">
                                          <StatusBadge status={doc.verificationStatus === "VERIFIED" ? "ready" : "under_review"}>
                                            {doc.verificationStatus}
                                          </StatusBadge>
                                        </td>
                                        <td className="py-2.5 text-text-secondary">{doc.validTo || "N/A"}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* 5. TRACES DDS */}
                        {activeTab === "dds" && (
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="space-y-2.5 flex-1">
                                <p className="text-xs font-bold text-text-secondary">TRACES NT Operator Due Diligence Statement</p>
                                
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-bg-surface p-2 border border-border-soft rounded">
                                      <span className="text-[10px] text-text-secondary block">Operator EORI ID</span>
                                      <span className="font-mono font-semibold text-text-primary">DE-88127391</span>
                                    </div>
                                    <div className="bg-bg-surface p-2 border border-border-soft rounded">
                                      <span className="text-[10px] text-text-secondary block">Filing Authority</span>
                                      <span className="font-semibold text-text-primary">BLE, Germany (DE)</span>
                                    </div>
                                  </div>

                                  <div className="bg-bg-surface p-2.5 border border-border-soft rounded flex items-center justify-between">
                                    <div>
                                      <span className="text-[10px] text-text-secondary block">TRACES Statement Reference</span>
                                      <span className="font-mono font-bold text-brand-primary">
                                        {activeDds?.tracesReferenceCode || "DRAFT_STATEMENT_PENDING"}
                                      </span>
                                    </div>
                                    {activeDds?.tracesReferenceCode && (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        icon={copiedText ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                        onClick={() => handleCopyDds(activeDds.tracesReferenceCode)}
                                      >
                                        {copiedText ? "Copied" : "Copy"}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 sm:w-56 shrink-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Submission Details</span>
                                <div className="p-3 bg-bg-surface border border-border-soft rounded-lg text-xs space-y-1.5">
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">Filing Posture:</span>
                                    <span className="font-semibold text-text-primary">
                                      {activeDds ? formatLabel(activeDds.status) : "Not Filed"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">Submitted By:</span>
                                    <span className="font-semibold text-text-primary truncate max-w-[120px]" title={activeDds?.submittedBy}>
                                      {activeDds?.submittedBy ? activeDds.submittedBy.split("@")[0] : "—"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">Date:</span>
                                    <span className="font-semibold text-text-primary">
                                      {activeDds?.submittedAt ? activeDds.submittedAt.split("T")[0] : "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  ) : null}

                </div>
              ) : (
                <div className="p-12 text-center text-sm text-text-secondary">
                  No product lines loaded for this consignment.
                </div>
              )}

            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border-soft px-6 py-4 bg-bg-surface-alt">
            <div className="text-xs text-text-secondary flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
              <span>Dossiers compiled and cross-referenced with latest spatial databases.</span>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {showDownloadSuccess && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg mr-2 animate-fade-in flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Pack ZIP Downloaded!
                </span>
              )}
              
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
              >
                Close Data Pack
              </Button>

              <Button
                size="sm"
                icon={downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                onClick={handleDownloadPack}
                disabled={downloading}
              >
                {downloading ? `Packaging Evidence (${downloadProgress}%)` : "Download Evidence ZIP Pack"}
              </Button>
            </div>
          </div>
        </>
      )}
    </ModalShell>
  );
}
