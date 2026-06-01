"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Pencil, Plus } from "lucide-react";
import { getSupplierName } from "@/lib/gfi-dummy-data";
import { useSession } from "@/components/ui/PermissionGuard";
import { IngredientRecord, ProductRecord } from "@/lib/gfi-dummy-data";
import { IngredientComplianceDrawer } from "@/components/traceability/IngredientComplianceDrawer";
import {
  Button,
  Card,
  Input,
  SectionHeader,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  Tag,
  Textarea,
} from "@/components/ui";
import type { StatusTone } from "@/lib/ui-semantics";
type RelevanceFilter = "ALL" | "IN_SCOPE" | "UNDER_REVIEW" | "OUT_OF_SCOPE" | "BLOCKED";

interface ProductDecisionHeaderVM {
  name: string;
  hsCode: string;
  summary: string;
  scopeStatus: ProductRecord["scopeStatus"];
  readiness: ProductRecord["exportReadiness"];
  flow: ProductRecord["operatorFlow"];
}

interface ProductDossierVM {
  annualVolume: string;
  primaryMarkets: string;
  activeBomRevision: string;
  revisionCount: number;
}

interface IngredientEvidenceSummaryVM {
  total: number;
  inScope: number;
  underReview: number;
  outOfScope: number;
  blocked: number;
}

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

function mapStatusTone(value: string): StatusTone {
  const normalized = value.toLowerCase();
  if (normalized.includes("ready") || normalized.includes("complete")) return "ready";
  if (normalized.includes("not_ready") || normalized.includes("blocked") || normalized.includes("gap")) return "blocked";
  if (normalized.includes("pending")) return "pending";
  if (normalized.includes("review")) return "under_review";
  if (normalized.includes("request")) return "requested";
  if (normalized.includes("out_of_scope") || normalized.includes("not_required")) return "current";
  if (normalized.includes("not required")) return "current";
  return "info";
}

function deriveScopeFromIngredients(ingredients: IngredientRecord[], selectedScope: ProductRecord["scopeStatus"]): ProductRecord["scopeStatus"] {
  if (ingredients.some((ingredient) => ingredient.relevance === "UNDER_REVIEW")) return "UNDER_CLASSIFICATION_REVIEW";
  if (ingredients.some((ingredient) => ingredient.relevance === "IN_SCOPE")) {
    return selectedScope === "FUTURE_EXPORT_BLOCKED" ? "FUTURE_EXPORT_BLOCKED" : "IN_SCOPE";
  }
  return "OUT_OF_SCOPE";
}

function deriveReadinessFromIngredients(ingredients: IngredientRecord[], fallback: ProductRecord["exportReadiness"]): ProductRecord["exportReadiness"] {
  if (ingredients.some((ingredient) => ingredient.relevance === "IN_SCOPE" && ingredient.readiness === "BLOCKED")) return "NOT_READY";
  if (ingredients.some((ingredient) => ingredient.relevance !== "OUT_OF_SCOPE" && ingredient.readiness === "REVIEW_REQUIRED")) return "REVIEW_REQUIRED";
  if (ingredients.every((ingredient) => ingredient.relevance === "OUT_OF_SCOPE" || ingredient.readiness === "READY")) return "READY";
  return fallback;
}

export default function ProductsPage() {
  const {
    products: currentProducts,
    suppliers: currentSuppliers,
    addProduct,
    editProduct,
    supplyChainNodes,
    eudrFormRequests,
    generateEudrFormRequest,
  } = useSession();

  const [selectedProductId, setSelectedProductId] = useState("");
  const [appealStatus, setAppealStatus] = useState<string | null>(null);

  const [isComplianceDrawerOpen, setIsComplianceDrawerOpen] = useState(false);
  const [complianceDrawerIngredient, setComplianceDrawerIngredient] = useState<IngredientRecord | null>(null);
  const [complianceDrawerInitialTab, setComplianceDrawerInitialTab] = useState<"traceability" | "plots" | "deforestation" | "documents">("traceability");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formHs, setFormHs] = useState("");
  const [formMarkets, setFormMarkets] = useState("EU, Pakistan");
  const [formVolume, setFormVolume] = useState("1,200 tons");
  const [formScope, setFormScope] = useState<"OUT_OF_SCOPE" | "IN_SCOPE" | "UNDER_CLASSIFICATION_REVIEW" | "FUTURE_EXPORT_BLOCKED">("IN_SCOPE");
  const [formReadiness, setFormReadiness] = useState<"READY" | "NOT_READY" | "REVIEW_REQUIRED">("REVIEW_REQUIRED");
  const [formRevision, setFormRevision] = useState("REV-2026-01");
  const [formOutputMode, setFormOutputMode] = useState<"COMPLIANCE_PACKAGE" | "DIRECT_DDS">("COMPLIANCE_PACKAGE");
  const [formSummary, setFormSummary] = useState("");
  const [formGaps, setFormGaps] = useState("");
  const [formIngredients, setFormIngredients] = useState<IngredientRecord[]>([]);

  const [ingName, setIngName] = useState("");
  const [ingHs, setIngHs] = useState("");
  const [ingPct, setIngPct] = useState("20%");
  const [ingCommodity, setIngCommodity] = useState<"PALM" | "COCOA" | "COFFEE" | "SOYA" | "RUBBER" | "WOOD" | "CATTLE" | "NONE">("COCOA");
  const [ingRelevance, setIngRelevance] = useState<"IN_SCOPE" | "OUT_OF_SCOPE" | "UNDER_REVIEW">("IN_SCOPE");
  const [ingReadiness, setIngReadiness] = useState<"READY" | "BLOCKED" | "REVIEW_REQUIRED">("READY");
  const [ingEvidence, setIngEvidence] = useState<"COMPLETE" | "PARTIAL" | "MISSING">("COMPLETE");
  const [ingSupplier, setIngSupplier] = useState("");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [relevanceFilter, setRelevanceFilter] = useState<RelevanceFilter>("ALL");
  const [expandedChains, setExpandedChains] = useState<Record<string, boolean>>({});

  const [editingId, setEditingId] = useState<string | null>(null);

  const activeProductId = selectedProductId || currentProducts[0]?.id || "";
  const selectedProduct = currentProducts.find((product) => product.id === activeProductId) ?? currentProducts[0];
  const evidenceSummaryVm: IngredientEvidenceSummaryVM = useMemo(() => ({
    total: selectedProduct?.ingredients.length ?? 0,
    inScope: selectedProduct?.ingredients.filter((ingredient) => ingredient.relevance === "IN_SCOPE").length ?? 0,
    underReview: selectedProduct?.ingredients.filter((ingredient) => ingredient.relevance === "UNDER_REVIEW").length ?? 0,
    outOfScope: selectedProduct?.ingredients.filter((ingredient) => ingredient.relevance === "OUT_OF_SCOPE").length ?? 0,
    blocked: selectedProduct?.ingredients.filter((ingredient) => ingredient.readiness === "BLOCKED").length ?? 0,
  }), [selectedProduct]);

  const decisionHeaderVm: ProductDecisionHeaderVM | null = useMemo(() => {
    if (!selectedProduct) return null;
    return {
      name: selectedProduct.name,
      hsCode: selectedProduct.finishedHsCode,
      summary: selectedProduct.summary,
      scopeStatus: selectedProduct.scopeStatus,
      readiness: selectedProduct.exportReadiness,
      flow: selectedProduct.operatorFlow,
    };
  }, [selectedProduct]);

  const dossierVm: ProductDossierVM | null = useMemo(() => {
    if (!selectedProduct) return null;
    return {
      annualVolume: selectedProduct.annualVolume,
      primaryMarkets: selectedProduct.primaryMarkets.join(", "),
      activeBomRevision: selectedProduct.activeBomRevision,
      revisionCount: selectedProduct.bomHistory.length,
    };
  }, [selectedProduct]);

  const visibleIngredients = useMemo(() => {
    if (!selectedProduct) return [];
    return selectedProduct.ingredients.filter((ingredient) => {
      const bySearch = [ingredient.name, ingredient.hsCode, ingredient.commodity, ingredient.relevance]
        .join(" ")
        .toLowerCase()
        .includes(ingredientSearch.toLowerCase().trim());

      if (!bySearch) return false;
      if (relevanceFilter === "ALL") return true;
      if (relevanceFilter === "BLOCKED") return ingredient.readiness === "BLOCKED";
      return ingredient.relevance === relevanceFilter;
    });
  }, [selectedProduct, ingredientSearch, relevanceFilter]);
  const densityValue = "compact";

  const getIngredientChainStatus = (ingredient: IngredientRecord) => {
    if (ingredient.relevance === "OUT_OF_SCOPE" || ingredient.commodity === "NONE") {
      return "NOT_REQUIRED";
    }
    const nodes = supplyChainNodes.filter((node) => node.ingredientId === ingredient.id);
    const requests = eudrFormRequests.filter((request) => nodes.some((node) => node.id === request.targetNodeId));
    if (nodes.length === 0 && requests.length === 0) return "NOT_REQUESTED";
    if (nodes.some((node) => node.status === "BLOCKED" || node.status === "GAPS_FOUND")) return "GAPS_FOUND";
    if (nodes.length > 0 && nodes.every((node) => node.status === "COMPLETE")) return "COMPLETE";
    if (requests.some((request) => request.status === "PENDING_RESPONSE" || request.status === "IN_PROGRESS")) return "IN_PROGRESS";
    return "REQUESTED";
  };

  const handleGenerateIngredientRequest = (ingredient: IngredientRecord) => {
    const supplierId = ingredient.supplierIds[0];
    const supplier = currentSuppliers.find((item) => item.id === supplierId);
    if (!supplier || !selectedProduct) return;
    const request = generateEudrFormRequest({
      supplierId,
      supplierName: supplier.name,
      productId: selectedProduct.id,
      ingredientId: ingredient.id,
      commodity: ingredient.commodity,
      materialName: ingredient.name,
      formType: "INTERMEDIARY",
      country: supplier.country,
      email: `${supplier.name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@supplier.example`,
    });
    setAppealStatus(`Generated ${request.formType.toLowerCase()} EUDR form link ${request.tokenLabel} for ${supplier.name}.`);
    setTimeout(() => setAppealStatus(null), 6000);
  };

  const handleSubmitAppeal = () => {
    if (!selectedProduct) return;
    setAppealStatus(
      `Successfully filed HS Classification Appeal to EU Customs for ${selectedProduct.name} (finished HS: ${selectedProduct.finishedHsCode}). Simulated processing is active. Appeal Status: SUBMITTED (Review period 14 days).`,
    );
    setTimeout(() => setAppealStatus(null), 6000);
  };

  const clearIngSubform = () => {
    setIngName("");
    setIngHs("");
    setIngPct("20%");
    setIngCommodity("COCOA");
    setIngRelevance("IN_SCOPE");
    setIngReadiness("READY");
    setIngEvidence("COMPLETE");
    setIngSupplier("");
  };

  const resetForm = () => {
    setFormName("");
    setFormHs("");
    setFormMarkets("EU, Pakistan");
    setFormVolume("1,200 tons");
    setFormScope("IN_SCOPE");
    setFormReadiness("REVIEW_REQUIRED");
    setFormRevision("REV-2026-01");
    setFormOutputMode("COMPLIANCE_PACKAGE");
    setFormSummary("");
    setFormGaps("");
    setFormIngredients([]);
    setEditingId(null);
    clearIngSubform();
  };

  const handleAddIngredient = () => {
    if (!ingName.trim()) return;
    const newIng: IngredientRecord = {
      id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: ingName,
      hsCode: ingHs || "Unknown",
      commodity: ingCommodity,
      relevance: ingRelevance,
      supplierIds: ingSupplier ? [ingSupplier] : [],
      percentage: ingPct,
      readiness: ingReadiness,
      evidenceStatus: ingEvidence,
      blockingReason: ingReadiness === "BLOCKED" ? "Missing supplier provenance files." : "",
      supplyChainStatus: "NOT_REQUESTED",
    };
    setFormIngredients((prev) => [...prev, newIng]);
    clearIngSubform();
  };

  const handleRemoveIngredient = (id: string) => {
    setFormIngredients((prev) => prev.filter((ingredient) => ingredient.id !== id));
  };

  const handleOpenEdit = () => {
    if (!selectedProduct) return;
    setEditingId(selectedProduct.id);
    setFormName(selectedProduct.name);
    setFormHs(selectedProduct.finishedHsCode);
    setFormMarkets(selectedProduct.primaryMarkets.join(", "));
    setFormVolume(selectedProduct.annualVolume);
    setFormScope(selectedProduct.scopeStatus);
    setFormReadiness(selectedProduct.exportReadiness);
    setFormRevision(selectedProduct.activeBomRevision);
    setFormOutputMode(selectedProduct.operatorFlow);
    setFormSummary(selectedProduct.summary);
    setFormGaps(selectedProduct.blockingGaps.join("\n"));
    setFormIngredients(selectedProduct.ingredients);
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent, isEdit: boolean) => {
    e.preventDefault();
    if (!formName.trim() || !formHs.trim()) return;

    const productData: ProductRecord = {
      id: isEdit && editingId ? editingId : `prd-${Date.now()}`,
      name: formName,
      finishedHsCode: formHs,
      primaryMarkets: formMarkets.split(",").map((market) => market.trim()).filter(Boolean),
      annualVolume: formVolume,
      scopeStatus: deriveScopeFromIngredients(formIngredients, formScope),
      exportReadiness: deriveReadinessFromIngredients(formIngredients, formReadiness),
      activeBomRevision: formRevision,
      operatorFlow: formOutputMode,
      summary: formSummary || `Simulated finished compound representing ${formName}.`,
      blockingGaps: formGaps ? formGaps.split("\n").map((gap) => gap.trim()).filter(Boolean) : [],
      bomHistory: isEdit && selectedProduct ? selectedProduct.bomHistory : [formRevision],
      ingredients: formIngredients,
    };

    if (isEdit) {
      editProduct(productData);
      setIsEditModalOpen(false);
    } else {
      addProduct(productData);
      setSelectedProductId(productData.id);
      setIsAddModalOpen(false);
    }
    resetForm();
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <SectionHeader
        title="Product and BOM"
        description="Manage product scope, BOM revisions, ingredient evidence, supplier dependencies, and export readiness."
        actions={
          <div className="flex items-center gap-2">
            {selectedProduct ? <Tag tone="brand">{selectedProduct.name}</Tag> : null}
            <Button
              size="sm"
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
            >
              Add Product
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="flex flex-col gap-4 border-border-strong/70 bg-gradient-to-b from-bg-surface to-bg-surface-alt lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border-soft/80 pb-3">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-brand-primary">Products</h2>
              <p className="text-xs text-text-secondary">Select a product to review profile and BOM readiness</p>
            </div>
            <Tag tone="neutral">{currentProducts.length}</Tag>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {currentProducts.map((product) => {
              const active = selectedProduct?.id === product.id;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    setSelectedProductId(product.id);
                    setAppealStatus(null);
                  }}
                  className={[
                    "group w-full rounded-lg border p-4 text-left transition-all duration-200 ease-emphasized",
                    active
                      ? "border-brand-accent bg-brand-accent-soft/90 shadow-card"
                      : "border-border-soft bg-bg-surface hover:-translate-y-0.5 hover:border-border-strong hover:bg-bg-surface-alt hover:shadow-card",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-sm text-brand-primary transition-colors group-hover:text-brand-primary-dark">{product.name}</strong>
                    <StatusBadge status={mapStatusTone(product.exportReadiness)}>{humanize(product.exportReadiness)}</StatusBadge>
                  </div>
                  <p className="mt-2 text-xs text-text-secondary">
                    HS {product.finishedHsCode} | {humanize(product.scopeStatus)}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">{product.summary}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {selectedProduct ? (
          <div className="space-y-6">
            {appealStatus ? (
              <Card variant="inset" className="border-brand-accent bg-brand-accent-soft text-sm text-brand-primary">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p className="font-semibold">{appealStatus}</p>
                </div>
              </Card>
            ) : null}

            {decisionHeaderVm && dossierVm ? (
              <Card className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-soft pb-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">Product decision header</p>
                    <h2 className="text-2xl font-extrabold text-brand-primary">{decisionHeaderVm.name}</h2>
                    <p className="text-sm font-medium text-text-secondary">Finished goods HS {decisionHeaderVm.hsCode}</p>
                    <p className="max-w-3xl text-sm leading-6 text-text-secondary [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden">
                      {decisionHeaderVm.summary}
                    </p>
                  </div>
                  <div className="flex flex-col items-stretch gap-2 sm:items-end">
                    <Button size="sm" variant="secondary" icon={<Pencil className="h-4 w-4" aria-hidden="true" />} onClick={handleOpenEdit}>
                      Edit BOM
                    </Button>
                    {decisionHeaderVm.scopeStatus === "UNDER_CLASSIFICATION_REVIEW" ? (
                      <Button size="sm" onClick={handleSubmitAppeal}>
                        HS appeal
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone="warning">Scope: {humanize(decisionHeaderVm.scopeStatus)}</Tag>
                  <Tag tone={decisionHeaderVm.readiness === "READY" ? "success" : "warning"}>
                    Readiness: {humanize(decisionHeaderVm.readiness)}
                  </Tag>
                  <Tag tone="neutral">Flow: {humanize(decisionHeaderVm.flow)}</Tag>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Card variant="inset" className="space-y-1 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">Scope status</p>
                    <strong className="text-base font-semibold text-text-primary">{humanize(decisionHeaderVm.scopeStatus)}</strong>
                    <p className="text-xs text-text-secondary">Derived from ingredient-level scope state.</p>
                  </Card>
                  <Card variant="inset" className="space-y-1 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">Annual volume</p>
                    <strong className="text-base font-semibold text-text-primary">{dossierVm.annualVolume}</strong>
                    <p className="text-xs text-text-secondary">Current planning volume in active scenario.</p>
                  </Card>
                  <Card variant="inset" className="space-y-1 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">Primary markets</p>
                    <strong className="text-base font-semibold text-text-primary">{dossierVm.primaryMarkets}</strong>
                    <p className="text-xs text-text-secondary">Market destinations attached to this profile.</p>
                  </Card>
                  <Card variant="inset" className="space-y-1 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">Active BOM revision</p>
                    <strong className="text-base font-semibold text-text-primary">{dossierVm.activeBomRevision}</strong>
                    <p className="text-xs text-text-secondary">{dossierVm.revisionCount} revisions preserved.</p>
                  </Card>
                </div>

                <Card variant="inset" className="space-y-2 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">Operational context</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-text-secondary">Output mode</p>
                      <strong className="text-base font-semibold text-text-primary">{humanize(selectedProduct.operatorFlow)}</strong>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Revision history</p>
                      <strong className="text-base font-semibold text-text-primary">{selectedProduct.bomHistory.length} tracked revisions</strong>
                    </div>
                  </div>
                </Card>
              </Card>
            ) : null}

            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-brand-primary">Critical Gaps</h3>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary">View linked evidence</Button>
                  {selectedProduct.blockingGaps.length > 0 ? <Button size="sm">Resolve now</Button> : null}
                </div>
              </div>
              {selectedProduct.blockingGaps.length === 0 ? (
                <Card variant="inset" className="border-state-success/30 bg-state-success/10 p-3 text-sm font-semibold text-state-success">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>No active blockers. Current product profile is aligned with compliance checks.</span>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  {selectedProduct.blockingGaps.map((gap, index) => (
                    <Card key={gap} variant="inset" className="border-state-error/30 bg-state-error/10 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 text-sm font-semibold text-state-error">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{gap}</span>
                        </div>
                        <Tag tone="warning">Gap {index + 1}</Tag>
                      </div>
                      <p className="mt-2 text-xs text-state-error/90">Owner: Compliance Office | Action: Validate upstream evidence and update dossier.</p>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            <Card className="space-y-4">
              <h3 className="text-lg font-bold text-brand-primary">Ingredient Evidence</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone="neutral">Total {evidenceSummaryVm.total}</Tag>
                <Tag tone="success">In scope {evidenceSummaryVm.inScope}</Tag>
                <Tag tone="warning">Under review {evidenceSummaryVm.underReview}</Tag>
                <Tag tone="neutral">Out of scope {evidenceSummaryVm.outOfScope}</Tag>
                <Tag tone="danger">Blocked {evidenceSummaryVm.blocked}</Tag>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={ingredientSearch}
                  onChange={(event) => setIngredientSearch(event.target.value)}
                  placeholder="Search ingredient, HS, commodity, or relevance"
                  className="min-w-[220px] flex-1"
                />
              </div>
              <div className="overflow-x-auto">
                <div className="flex min-w-max items-center gap-2 pb-2">
                  <Button size="sm" variant={relevanceFilter === "ALL" ? "primary" : "secondary"} onClick={() => setRelevanceFilter("ALL")}>All</Button>
                  <Button size="sm" variant={relevanceFilter === "IN_SCOPE" ? "primary" : "secondary"} onClick={() => setRelevanceFilter("IN_SCOPE")}>In scope</Button>
                  <Button size="sm" variant={relevanceFilter === "UNDER_REVIEW" ? "primary" : "secondary"} onClick={() => setRelevanceFilter("UNDER_REVIEW")}>Under review</Button>
                  <Button size="sm" variant={relevanceFilter === "OUT_OF_SCOPE" ? "primary" : "secondary"} onClick={() => setRelevanceFilter("OUT_OF_SCOPE")}>Out of scope</Button>
                  <Button size="sm" variant={relevanceFilter === "BLOCKED" ? "primary" : "secondary"} onClick={() => setRelevanceFilter("BLOCKED")}>Blocked</Button>
                </div>
              </div>
              <TableRoot className="max-h-[640px] overflow-auto">
                <Table className="text-xs">
                  <TableHead>
                    <tr>
                      <TableHeaderCell density={densityValue} className="sticky left-0 top-0 z-20 bg-bg-surface-alt">Ingredient</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt">HS</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt">Commodity</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt">Supplier path</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt">Relevance</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt">Readiness</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt">Evidence</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt">Chain</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt">Action</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {visibleIngredients.length === 0 ? (
                      <TableRow>
                        <TableCell density={densityValue} className="text-center text-text-secondary" colSpan={9}>
                          No ingredients match the current filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleIngredients.map((ingredient) => {
                        const chainStatus = getIngredientChainStatus(ingredient);
                        const canRequest =
                          ingredient.relevance !== "OUT_OF_SCOPE" &&
                          ingredient.commodity !== "NONE" &&
                          ingredient.supplierIds.length > 0 &&
                          chainStatus !== "COMPLETE";
                        return (
                          <TableRow
                            key={ingredient.id}
                            className="cursor-pointer"
                            onClick={() => {
                              setComplianceDrawerIngredient(ingredient);
                              setComplianceDrawerInitialTab("traceability");
                              setIsComplianceDrawerOpen(true);
                            }}
                          >
                            <TableCell density={densityValue} className="sticky left-0 z-[1] bg-bg-surface align-top">
                              <div className="space-y-0.5">
                                <strong className="block text-brand-primary leading-5">{ingredient.name}</strong>
                                <p className="text-xs text-text-secondary">{ingredient.percentage}</p>
                              </div>
                            </TableCell>
                            <TableCell density={densityValue} className="align-top">
                              <span className="block leading-6">{ingredient.hsCode}</span>
                            </TableCell>
                            <TableCell density={densityValue} className="align-top">
                              <span className="block leading-6">{ingredient.commodity}</span>
                            </TableCell>
                            <TableCell density={densityValue} className="align-top text-xs">
                              <p className="max-w-[180px] leading-5">
                                {ingredient.supplierIds.length > 0
                                  ? ingredient.supplierIds.map((supplierId) => getSupplierName(supplierId)).join(", ")
                                  : "No EUDR supplier path required"}
                              </p>
                            </TableCell>
                            <TableCell density={densityValue} className="align-top">
                              {ingredient.relevance === "IN_SCOPE" ? <Tag tone="success">EUDR in scope</Tag> : null}
                              {ingredient.relevance === "OUT_OF_SCOPE" ? <Tag tone="neutral">Out of scope</Tag> : null}
                              {ingredient.relevance === "UNDER_REVIEW" ? <Tag tone="warning">Under review</Tag> : null}
                            </TableCell>
                            <TableCell density={densityValue} className="align-top">
                              <StatusBadge status={mapStatusTone(ingredient.readiness)}>{humanize(ingredient.readiness)}</StatusBadge>
                            </TableCell>
                            <TableCell density={densityValue} className="align-top">
                              <span className="block leading-6">{ingredient.evidenceStatus}</span>
                            </TableCell>
                            <TableCell density={densityValue} className="align-top">
                              <StatusBadge status={mapStatusTone(chainStatus)}>{humanize(chainStatus)}</StatusBadge>
                            </TableCell>
                            <TableCell density={densityValue} className="align-top">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={!canRequest}
                                className="min-w-[108px]"
                                title={!canRequest ? "Link generation is available only for in-scope ingredients with supplier linkage." : "Generate ingredient-scoped request"}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleGenerateIngredientRequest(ingredient);
                                }}
                              >
                                Generate link
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableRoot>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-brand-primary">Multi-tier supplier chain preview</h4>
                {selectedProduct.ingredients
                  .filter((ingredient) => ingredient.commodity !== "NONE" && ingredient.relevance !== "OUT_OF_SCOPE")
                  .map((ingredient) => {
                    const nodes = supplyChainNodes
                      .filter((node) => node.ingredientId === ingredient.id)
                      .sort((left, right) => left.tier - right.tier);
                    const isExpanded = expandedChains[ingredient.id] ?? false;
                    const visibleNodes = isExpanded ? nodes : nodes.slice(0, 4);
                    return (
                      <Card key={`chain-${ingredient.id}`} variant="inset" className="space-y-2 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-sm text-brand-primary">{ingredient.name}</strong>
                          {nodes.length > 4 ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setExpandedChains((prev) => ({ ...prev, [ingredient.id]: !isExpanded }))}
                            >
                              {isExpanded ? "Show less" : `Show full branch (${nodes.length})`}
                            </Button>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {nodes.length === 0 ? (
                            <span className="text-xs text-text-secondary">No EUDR supplier chain request generated yet.</span>
                          ) : (
                            visibleNodes.map((node, index) => (
                              <React.Fragment key={node.id}>
                                {index > 0 ? <span className="text-text-secondary">-</span> : null}
                                <StatusBadge status={mapStatusTone(node.status)}>
                                  T{node.tier} {node.entityName}: {humanize(node.status)}
                                </StatusBadge>
                              </React.Fragment>
                            ))
                          )}
                          {!isExpanded && nodes.length > 4 ? <Tag tone="neutral">+{nodes.length - 4} more nodes</Tag> : null}
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="h-full space-y-3">
                <h3 className="text-lg font-bold text-brand-primary">BOM Revision History</h3>
                {selectedProduct.bomHistory.map((revision) => (
                  <Card key={revision} variant="inset" className="p-3 text-sm text-text-primary">
                    {revision}
                  </Card>
                ))}
              </Card>
              <Card className="h-full space-y-3">
                <h3 className="text-lg font-bold text-brand-primary">Readiness Summary</h3>
                <Card variant="inset" className="p-4 text-sm leading-6 text-text-secondary">
                  {selectedProduct.exportReadiness === "READY" &&
                    "This product can move through the package workflow with classification evidence and no critical provenance blockers."}
                  {selectedProduct.exportReadiness === "REVIEW_REQUIRED" &&
                    "This product is not fully blocked, but it cannot be handed to an EU operator until the open classification and evidence questions are resolved."}
                  {selectedProduct.exportReadiness === "NOT_READY" &&
                    "This product remains fail-closed for EU use because upstream provenance and supplier evidence are not sufficient yet."}
                </Card>
              </Card>
            </div>

            <div className="sticky bottom-3 z-20 rounded-lg border border-border-soft bg-bg-surface/95 p-2 shadow-card backdrop-blur lg:hidden">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                  onClick={handleOpenEdit}
                >
                  Edit BOM
                </Button>
                {selectedProduct.scopeStatus === "UNDER_CLASSIFICATION_REVIEW" ? (
                  <Button size="sm" className="flex-1" onClick={handleSubmitAppeal}>
                    HS appeal
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {(isAddModalOpen || isEditModalOpen) ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <Card className="max-h-[92vh] w-full max-w-4xl overflow-y-auto p-6">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-brand-primary">
                {isEditModalOpen ? "Modify Product & BOM Revision" : "Register New Product & BOM"}
              </h2>
              <p className="text-xs text-text-secondary">
                Configure finished product details and dynamically append or structure its sub-ingredients Bill of Materials.
              </p>
            </div>

            <form onSubmit={(e) => handleSaveProduct(e, isEditModalOpen)} className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Product Commercial Name</label>
                  <Input required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Premium Cocoa Mass Blend" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Finished HS Code</label>
                  <Input required value={formHs} onChange={(e) => setFormHs(e.target.value)} placeholder="e.g. 18031000" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Target Markets (comma-separated)</label>
                  <Input required value={formMarkets} onChange={(e) => setFormMarkets(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Annual Volume</label>
                  <Input required value={formVolume} onChange={(e) => setFormVolume(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Active BOM Revision</label>
                  <Input required value={formRevision} onChange={(e) => setFormRevision(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">EUDR Regulatory Scope</label>
                  <Select value={formScope} onChange={(e) => setFormScope(e.target.value as typeof formScope)}>
                    <option value="IN_SCOPE">IN SCOPE (Mandatory Diligence)</option>
                    <option value="OUT_OF_SCOPE">OUT OF SCOPE (Exempt)</option>
                    <option value="UNDER_CLASSIFICATION_REVIEW">UNDER CLASSIFICATION REVIEW</option>
                    <option value="FUTURE_EXPORT_BLOCKED">FUTURE EXPORT BLOCKED</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Export Readiness</label>
                  <Select value={formReadiness} onChange={(e) => setFormReadiness(e.target.value as typeof formReadiness)}>
                    <option value="READY">READY (Cleared)</option>
                    <option value="REVIEW_REQUIRED">REVIEW REQUIRED (Hold)</option>
                    <option value="NOT_READY">NOT READY (Blocked)</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Operator Output Mode</label>
                  <Select value={formOutputMode} onChange={(e) => setFormOutputMode(e.target.value as typeof formOutputMode)}>
                    <option value="COMPLIANCE_PACKAGE">COMPLIANCE DATA PACKAGE</option>
                    <option value="DIRECT_DDS">DIRECT DDS FILE (TRACES)</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Product Summary & Regulatory Description</label>
                <Input
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="e.g. Raw processed cocoa cake used as a chocolate compound ingredient."
                />
              </div>

              <Card variant="inset" className="space-y-3 p-4">
                <h4 className="text-sm font-bold text-brand-primary">Active BOM Ingredients Builder</h4>
                <div className="max-h-40 overflow-y-auto border-b border-border-soft pb-3">
                  {formIngredients.length === 0 ? (
                    <p className="text-xs text-text-secondary">No BOM ingredients added yet. Use the tool below to build the BOM.</p>
                  ) : (
                    <div className="space-y-2">
                      {formIngredients.map((ingredient) => (
                        <Card key={ingredient.id} variant="surface" className="flex items-center justify-between gap-2 p-2 text-xs">
                          <span className="text-text-primary">
                            <strong className="text-brand-primary">
                              {ingredient.name} ({ingredient.percentage})
                            </strong>{" "}
                            | HS: {ingredient.hsCode} | Commodity: {ingredient.commodity} | Supplier:{" "}
                            {ingredient.supplierIds.length > 0 ? getSupplierName(ingredient.supplierIds[0]) : "Direct"}
                          </span>
                          <Button type="button" size="sm" variant="danger" onClick={() => handleRemoveIngredient(ingredient.id)}>
                            Remove
                          </Button>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-text-secondary">Ingredient Name</label>
                    <Input value={ingName} onChange={(e) => setIngName(e.target.value)} placeholder="e.g. Cocoa Butter" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-text-secondary">HS Code</label>
                    <Input value={ingHs} onChange={(e) => setIngHs(e.target.value)} placeholder="e.g. 1804.00" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-text-secondary">BOM Share (%)</label>
                    <Input value={ingPct} onChange={(e) => setIngPct(e.target.value)} className="h-9 text-xs" />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-text-secondary">Commodity Scope</label>
                    <Select value={ingCommodity} onChange={(e) => setIngCommodity(e.target.value as typeof ingCommodity)} className="h-9 py-1 text-xs">
                      <option value="COCOA">COCOA</option>
                      <option value="PALM">PALM</option>
                      <option value="COFFEE">COFFEE</option>
                      <option value="SOYA">SOYA</option>
                      <option value="RUBBER">RUBBER</option>
                      <option value="WOOD">WOOD</option>
                      <option value="CATTLE">CATTLE</option>
                      <option value="NONE">NONE / EXEMPT</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-text-secondary">Relevance</label>
                    <Select value={ingRelevance} onChange={(e) => setIngRelevance(e.target.value as typeof ingRelevance)} className="h-9 py-1 text-xs">
                      <option value="IN_SCOPE">IN SCOPE</option>
                      <option value="OUT_OF_SCOPE">OUT OF SCOPE</option>
                      <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-text-secondary">Supplier Link</label>
                    <Select value={ingSupplier} onChange={(e) => setIngSupplier(e.target.value)} className="h-9 py-1 text-xs">
                      <option value="">No supplier linkage</option>
                      {currentSuppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button type="button" size="sm" onClick={handleAddIngredient} className="w-full">
                      Add Ingredient
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Identified Regulatory Gaps (one gap per line)</label>
                <Textarea
                  value={formGaps}
                  onChange={(e) => setFormGaps(e.target.value)}
                  className="min-h-[80px] resize-y"
                  placeholder="e.g. Missing complete plot polygon shapefiles from Sumatra smallholders."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">{isEditModalOpen ? "Save Changes" : "Save Product"}</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {complianceDrawerIngredient && selectedProduct ? (
        <IngredientComplianceDrawer
          isOpen={isComplianceDrawerOpen}
          onClose={() => {
            setIsComplianceDrawerOpen(false);
            setComplianceDrawerIngredient(null);
          }}
          ingredient={complianceDrawerIngredient}
          product={selectedProduct}
          initialTab={complianceDrawerInitialTab}
        />
      ) : null}
    </div>
  );
}
