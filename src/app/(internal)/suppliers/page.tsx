"use client";

import React, { useMemo, useState } from "react";
import { Pencil, Plus, Send, Copy, AlertTriangle, CheckCircle2, Link2 } from "lucide-react";
import { getProductName } from "@/lib/gfi-dummy-data";
import { SupplyChainSnapshot } from "@/components/traceability/IngredientTraceabilityStudio";
import { useSession } from "@/components/ui/PermissionGuard";
import { buildIngredientTraceabilityViewModel } from "@/lib/ingredient-traceability";
import {
  Button,
  Card,
  Input,
  RiskBadge,
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
import type { RiskTone, StatusTone } from "@/lib/ui-semantics";

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

function toStatusTone(value: string): StatusTone {
  const normalized = value.toLowerCase();
  if (normalized === "closed") return "ready";
  if (normalized.includes("approve")) return "approved";
  if (normalized.includes("block")) return "blocked";
  if (normalized.includes("change")) return "changes_requested";
  if (normalized.includes("pending")) return "pending";
  if (normalized.includes("review")) return "under_review";
  if (normalized.includes("request")) return "requested";
  return "info";
}

function toRiskTone(value: string): RiskTone {
  const normalized = value.toLowerCase() as RiskTone;
  if (normalized === "low" || normalized === "medium" || normalized === "high" || normalized === "critical" || normalized === "negligible") {
    return normalized;
  }
  return "medium";
}

export default function SuppliersPage() {
  const {
    suppliers: currentSuppliers,
    products: currentProducts,
    consignments: currentConsignments,
    addSupplier,
    editSupplier,
    supplyChainNodes,
    eudrFormRequests,
    generateEudrFormRequest,
    intermediaryDeclarationSubmissions,
    farmerDeclarationSubmissions,
    eudrEvidenceAttachments,
  } = useSession();

  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedScopeKeys, setSelectedScopeKeys] = useState<string[]>([]);

  const [formName, setFormName] = useState("");
  const [formCountry, setFormCountry] = useState("Malaysia");
  const [formType, setFormType] = useState("Processor");
  const [formTier, setFormTier] = useState(1);
  const [formCommodities, setFormCommodities] = useState<("PALM" | "COCOA")[]>(["PALM"]);
  const [formOnboarding, setFormOnboarding] = useState<"APPROVED" | "UNDER_REVIEW" | "PENDING_RESPONSE" | "CHANGES_REQUESTED" | "BLOCKED">("UNDER_REVIEW");
  const [formDeclaration, setFormDeclaration] = useState<"SIGNED" | "REQUESTED" | "MISSING" | "UNDER_REVIEW">("UNDER_REVIEW");
  const [formCoc, setFormCoc] = useState<"VERIFIED" | "MSDS_ONLY" | "MISSING" | "UNDER_REVIEW">("MISSING");
  const [formGeoCoverage, setFormGeoCoverage] = useState(0);
  const [formContract, setFormContract] = useState<"EUDR_CLAUSE_PRESENT" | "LEGACY_CONTRACT" | "MISSING">("MISSING");
  const [formRisk, setFormRisk] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [formFacilities, setFormFacilities] = useState("");
  const [formCertifications, setFormCertifications] = useState("");
  const [formNextAction, setFormNextAction] = useState("");
  const [formIssues, setFormIssues] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeSupplierId = selectedSupplierId || currentSuppliers[0]?.id || "";
  const selectedSupplier = currentSuppliers.find((supplier) => supplier.id === activeSupplierId) ?? currentSuppliers[0];
  const selectedSupplierNodes = selectedSupplier
    ? supplyChainNodes.filter((node) => node.supplierId === selectedSupplier.id || node.entityName === selectedSupplier.name)
    : [];
  const selectedSupplierRequests = selectedSupplier
    ? eudrFormRequests.filter(
        (request) =>
          selectedSupplierNodes.some((node) => node.id === request.targetNodeId) || request.targetSupplierId === selectedSupplier.id,
      )
    : [];
  const selectedSupplierIngredientScopes = useMemo(() => {
    if (!selectedSupplier) return [];
    return currentProducts.flatMap((product) =>
      product.ingredients
        .filter((ingredient) => ingredient.supplierIds.includes(selectedSupplier.id))
        .map((ingredient) => {
          const key = `${selectedSupplier.id}::${product.id}::${ingredient.id}::INTERMEDIARY`;
          return { key, productId: product.id, productName: product.name, ingredientId: ingredient.id, ingredientName: ingredient.name, commodity: ingredient.commodity };
        }),
    );
  }, [currentProducts, selectedSupplier]);

  const ingredientViewModel = useMemo(
    () =>
      buildIngredientTraceabilityViewModel({
        products: currentProducts,
        consignments: currentConsignments,
        supplyChainNodes,
        eudrFormRequests,
        intermediaryDeclarationSubmissions,
        farmerDeclarationSubmissions,
        eudrEvidenceAttachments,
      }),
    [
      currentConsignments,
      currentProducts,
      eudrEvidenceAttachments,
      eudrFormRequests,
      farmerDeclarationSubmissions,
      intermediaryDeclarationSubmissions,
      supplyChainNodes,
    ],
  );

  const handleRequestOutreach = () => {
    if (!selectedSupplier) return;
    setEmailStatus(
      `Formally dispatched EUDR Geolocation and CoC request pack to the compliance contact of ${selectedSupplier.name}. An automated tracking token has been attached to their upstream portal.`,
    );
    setTimeout(() => setEmailStatus(null), 6000);
  };

  const handleOpenGenerateLinks = () => {
    if (!selectedSupplier) return;
    if (selectedSupplierIngredientScopes.length === 0) {
      setEmailStatus(`No ingredient path is linked to ${selectedSupplier.name}. Add this supplier to an ingredient first.`);
      setTimeout(() => setEmailStatus(null), 6000);
      return;
    }
    setSelectedScopeKeys(selectedSupplierIngredientScopes.map((scope) => scope.key));
    setIsLinkModalOpen(true);
  };

  const handleGenerateScopedLinks = () => {
    if (!selectedSupplier) return;
    const selectedScopes = selectedSupplierIngredientScopes.filter((scope) => selectedScopeKeys.includes(scope.key));
    if (selectedScopes.length === 0) {
      setEmailStatus("Select at least one ingredient path to generate EUDR links.");
      setTimeout(() => setEmailStatus(null), 5000);
      return;
    }

    const generatedTokens: string[] = [];
    const reusedTokens: string[] = [];

    selectedScopes.forEach((scope) => {
      const existingRequest = selectedSupplierRequests.find((request) => {
        if (request.formType !== "INTERMEDIARY" || request.status === "CLOSED") return false;
        if (request.targetSupplierId !== selectedSupplier.id) return false;
        if (request.productId && request.ingredientId) {
          return request.productId === scope.productId && request.ingredientId === scope.ingredientId;
        }
        const node = supplyChainNodes.find((item) => item.id === request.targetNodeId);
        return node?.productId === scope.productId && node?.ingredientId === scope.ingredientId;
      });

      if (existingRequest) {
        reusedTokens.push(existingRequest.tokenLabel);
        return;
      }

      const request = generateEudrFormRequest({
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        productId: scope.productId,
        ingredientId: scope.ingredientId,
        commodity: scope.commodity,
        materialName: scope.ingredientName,
        formType: "INTERMEDIARY",
        country: selectedSupplier.country,
        email: `${selectedSupplier.name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@supplier.example`,
      });
      generatedTokens.push(request.tokenLabel);
    });

    editSupplier({
      ...selectedSupplier,
      declarationStatus: "REQUESTED",
      onboardingStatus: selectedSupplier.onboardingStatus === "APPROVED" ? "APPROVED" : "PENDING_RESPONSE",
      nextAction:
        generatedTokens.length > 0
          ? `Ingredient-scoped EUDR requests generated: ${generatedTokens.join(", ")}.`
          : selectedSupplier.nextAction,
    });
    setEmailStatus(
      `Generated ${generatedTokens.length} scoped link(s)${
        reusedTokens.length > 0 ? `, reused ${reusedTokens.length} existing active link(s)` : ""
      } for ${selectedSupplier.name}.`,
    );
    setTimeout(() => setEmailStatus(null), 6000);
    setIsLinkModalOpen(false);
  };

  const resetForm = () => {
    setFormName("");
    setFormCountry("Malaysia");
    setFormType("Processor");
    setFormTier(1);
    setFormCommodities(["PALM"]);
    setFormOnboarding("UNDER_REVIEW");
    setFormDeclaration("UNDER_REVIEW");
    setFormCoc("MISSING");
    setFormGeoCoverage(0);
    setFormContract("MISSING");
    setFormRisk("MEDIUM");
    setFormFacilities("");
    setFormCertifications("");
    setFormNextAction("");
    setFormIssues("");
    setEditingId(null);
  };

  const handleOpenEdit = () => {
    if (!selectedSupplier) return;
    setEditingId(selectedSupplier.id);
    setFormName(selectedSupplier.name);
    setFormCountry(selectedSupplier.country);
    setFormType(selectedSupplier.supplierType);
    setFormTier(selectedSupplier.tier);
    setFormCommodities(selectedSupplier.commodities as ("PALM" | "COCOA")[]);
    setFormOnboarding(selectedSupplier.onboardingStatus as typeof formOnboarding);
    setFormDeclaration(selectedSupplier.declarationStatus as typeof formDeclaration);
    setFormCoc(selectedSupplier.cocStatus as typeof formCoc);
    setFormGeoCoverage(selectedSupplier.geolocationCoverage);
    setFormContract(selectedSupplier.contractStatus as typeof formContract);
    setFormRisk(selectedSupplier.latestRiskLevel as typeof formRisk);
    setFormFacilities(selectedSupplier.facilities.join(", "));
    setFormCertifications(selectedSupplier.certifications.join(", "));
    setFormNextAction(selectedSupplier.nextAction);
    setFormIssues(selectedSupplier.issues.join("\n"));
    setIsEditModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent, isEdit: boolean) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const supplierData = {
      id: isEdit && editingId ? editingId : `sup-${Date.now()}`,
      name: formName,
      country: formCountry,
      supplierType: formType,
      tier: Number(formTier),
      commodities: formCommodities as any[],
      onboardingStatus: formOnboarding,
      declarationStatus: formDeclaration,
      cocStatus: formCoc,
      geolocationCoverage: Number(formGeoCoverage),
      contractStatus: formContract,
      latestRiskLevel: formRisk,
      facilities: formFacilities ? formFacilities.split(",").map((s) => s.trim()) : [],
      certifications: formCertifications ? formCertifications.split(",").map((s) => s.trim()) : [],
      evidenceCount: isEdit && selectedSupplier ? selectedSupplier.evidenceCount : 0,
      issues: formIssues ? formIssues.split("\n").map((s) => s.trim()).filter(Boolean) : [],
      nextAction: formNextAction || "No immediate action required.",
      linkedProductIds: isEdit && selectedSupplier ? selectedSupplier.linkedProductIds : [],
      linkedConsignmentIds: isEdit && selectedSupplier ? selectedSupplier.linkedConsignmentIds : [],
    };

    if (isEdit) {
      editSupplier(supplierData);
      setIsEditModalOpen(false);
    } else {
      addSupplier(supplierData);
      setSelectedSupplierId(supplierData.id);
      setIsAddModalOpen(false);
    }
    resetForm();
  };

  const handleCommodityToggle = (commodity: "PALM" | "COCOA") => {
    setFormCommodities((prev) => (prev.includes(commodity) ? prev.filter((value) => value !== commodity) : [...prev, commodity]));
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <SectionHeader
        title="Supplier Compliance"
        description="Review supplier status, declarations, CoC evidence, contract posture, geolocation coverage, and export impact."
        actions={
          <div className="flex items-center gap-2">
            {selectedSupplier ? <Tag tone="brand">{selectedSupplier.name}</Tag> : null}
            <Button
              size="sm"
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
            >
              Add Supplier
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
        <Card className="space-y-4 border-border-strong/70 bg-gradient-to-b from-bg-surface to-bg-surface-alt lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border-soft/80 pb-3">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-brand-primary">Suppliers</h2>
              <p className="text-xs text-text-secondary">Select a supplier to review profile and requests</p>
            </div>
            <Tag tone="neutral">{currentSuppliers.length}</Tag>
          </div>
          <div className="space-y-3 lg:overflow-y-auto lg:pr-1">
            {currentSuppliers.map((supplier) => {
              const active = selectedSupplier?.id === supplier.id;
              return (
                <button
                  key={supplier.id}
                  type="button"
                  onClick={() => {
                    setSelectedSupplierId(supplier.id);
                    setEmailStatus(null);
                  }}
                  className={[
                    "group w-full rounded-lg border p-4 text-left transition-all duration-200 ease-emphasized",
                    active
                      ? "border-brand-accent bg-brand-accent-soft/90 shadow-card"
                      : "border-border-soft bg-bg-surface hover:-translate-y-0.5 hover:border-border-strong hover:bg-bg-surface-alt hover:shadow-card",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <strong className="text-sm text-brand-primary transition-colors group-hover:text-brand-primary-dark">{supplier.name}</strong>
                    <StatusBadge status={toStatusTone(supplier.onboardingStatus)}>{humanize(supplier.onboardingStatus)}</StatusBadge>
                  </div>
                  <p className="mt-2 text-xs font-medium text-text-secondary">
                    {supplier.supplierType} | Tier {supplier.tier} | {supplier.country}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary/90">
                    Geolocation coverage {supplier.geolocationCoverage}% | CoC {humanize(supplier.cocStatus)}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        {selectedSupplier ? (
          <div className="space-y-6">
            {emailStatus ? (
              <Card variant="inset" className="border-brand-accent bg-brand-accent-soft text-sm text-brand-primary">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p className="font-semibold">{emailStatus}</p>
                </div>
              </Card>
            ) : null}

            <Card className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Supplier profile</p>
                    <h2 className="text-2xl font-extrabold text-brand-primary">{selectedSupplier.name}</h2>
                  </div>
                  <Button size="sm" variant="secondary" icon={<Pencil className="h-4 w-4" aria-hidden="true" />} onClick={handleOpenEdit}>
                    Edit
                  </Button>
                </div>
                <p className="text-sm leading-6 text-text-secondary">{selectedSupplier.nextAction}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-text-secondary">Supplier type</p>
                    <strong className="text-sm text-text-primary">{selectedSupplier.supplierType}</strong>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Latest risk</p>
                    <RiskBadge risk={toRiskTone(selectedSupplier.latestRiskLevel)}>{selectedSupplier.latestRiskLevel}</RiskBadge>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Declaration</p>
                    <strong className="text-sm text-text-primary">{humanize(selectedSupplier.declarationStatus)}</strong>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Contract posture</p>
                    <strong className="text-sm text-text-primary">{humanize(selectedSupplier.contractStatus)}</strong>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <Card variant="inset" className="space-y-1 p-4">
                  <p className="text-xs text-text-secondary">Facilities</p>
                  <strong className="text-sm text-text-primary">{selectedSupplier.facilities.length > 0 ? selectedSupplier.facilities.join(", ") : "None declared"}</strong>
                </Card>
                <Card variant="inset" className="space-y-1 p-4">
                  <p className="text-xs text-text-secondary">Certifications</p>
                  <strong className="text-sm text-text-primary">{selectedSupplier.certifications.length > 0 ? selectedSupplier.certifications.join(", ") : "None declared"}</strong>
                </Card>
                <Card variant="inset" className="space-y-1 p-4">
                  <p className="text-xs text-text-secondary">Evidence library</p>
                  <strong className="text-sm text-text-primary">{selectedSupplier.evidenceCount} linked records</strong>
                </Card>
                {selectedSupplier.onboardingStatus !== "APPROVED" ? (
                  <Button size="sm" onClick={handleRequestOutreach} icon={<Send className="h-4 w-4" aria-hidden="true" />} fullWidth>
                    Request geolocation file
                  </Button>
                ) : null}
                <Button size="sm" variant="secondary" onClick={handleOpenGenerateLinks} icon={<Link2 className="h-4 w-4" aria-hidden="true" />} fullWidth>
                  Generate EUDR links
                </Button>
              </div>
            </Card>

            <Card className="space-y-4">
              <h3 className="text-lg font-bold text-brand-primary">Chain Requests</h3>
              {selectedSupplierRequests.length === 0 ? (
                <p className="text-sm text-text-secondary">No multi-tier EUDR request has been generated for this supplier yet.</p>
              ) : (
                <div className="space-y-3">
                  {selectedSupplierRequests.map((request) => {
                    const node = supplyChainNodes.find((item) => item.id === request.targetNodeId);
                    const portalUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/supplier?token=${request.tokenLabel}`;
                    return (
                      <Card key={request.id} variant="inset" className="space-y-2 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-sm text-brand-primary">{request.tokenLabel}</strong>
                          <StatusBadge status={toStatusTone(request.status)}>{humanize(request.status)}</StatusBadge>
                        </div>
                        <p className="text-xs text-text-secondary">
                          {request.formType} form | {node ? getProductName(node.productId) : "Unknown product"} | {node?.materialName ?? "material path"} | Tier {node?.tier ?? "?"} | expires {request.expiresAt}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            icon={<Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                            onClick={() => {
                              navigator.clipboard.writeText(portalUrl);
                              setEmailStatus(`Link copied: ${portalUrl}`);
                              setTimeout(() => setEmailStatus(null), 4000);
                            }}
                          >
                            Copy link
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            icon={<Send className="h-3.5 w-3.5" aria-hidden="true" />}
                            onClick={() => {
                              setEmailStatus(
                                `Simulated email sent to ${request.email || "supplier"} with EUDR portal link ${request.tokenLabel}.`,
                              );
                              setTimeout(() => setEmailStatus(null), 5000);
                            }}
                          >
                            Send email
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-brand-primary">Supply Chain Snapshot</h3>
                {selectedSupplierNodes.length > 0
                  ? (() => {
                      const leafNodes = supplyChainNodes.filter(
                        (node) =>
                          ["FARMER", "COOPERATIVE", "ESTATE"].includes(node.actorType) &&
                          selectedSupplierNodes.some((target) => {
                            let current: typeof node | undefined = node;
                            while (current) {
                              if (current.id === target.id) return true;
                              current = supplyChainNodes.find((parent) => parent.id === current?.parentNodeId);
                            }
                            return false;
                          }),
                      );
                      const completeFarmers = leafNodes.filter((node) => node.status === "COMPLETE").length;
                      const maxTier = Math.max(
                        ...selectedSupplierNodes.map((node) => node.tier),
                        ...supplyChainNodes
                          .filter((node) => selectedSupplierNodes.some((selectedNode) => node.ingredientId === selectedNode.ingredientId))
                          .map((node) => node.tier),
                      );
                      return (
                        <Tag tone="neutral">
                          Depth: Tier 1 {"->"} Tier {maxTier || 1}
                          {leafNodes.length > 0 ? ` | Farmers: ${completeFarmers}/${leafNodes.length}` : ""}
                        </Tag>
                      );
                    })()
                  : null}
              </div>
              <SupplyChainSnapshot viewModel={ingredientViewModel} supplierId={selectedSupplier.id} />
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="space-y-4">
                <h3 className="text-lg font-bold text-brand-primary">Issues and Next Actions</h3>
                {selectedSupplier.issues.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSupplier.issues.map((issue) => (
                      <Card key={issue} variant="inset" className="border-state-error/30 bg-state-error/10 p-3 text-sm font-semibold text-state-error">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>{issue}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card variant="inset" className="border-state-success/30 bg-state-success/10 p-3 text-sm font-semibold text-state-success">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>No active issues identified. All checklists cleared.</span>
                    </div>
                  </Card>
                )}
              </Card>

              <Card className="space-y-3">
                <h3 className="text-lg font-bold text-brand-primary">Workflow Status</h3>
                <TableRoot>
                  <Table>
                    <TableHead>
                      <tr>
                        <TableHeaderCell>Workflow</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {[
                        { label: "Onboarding workflow", value: humanize(selectedSupplier.onboardingStatus) },
                        { label: "Declaration workflow", value: humanize(selectedSupplier.declarationStatus) },
                        { label: "CoC evidence", value: humanize(selectedSupplier.cocStatus) },
                        { label: "Geolocation coverage", value: `${selectedSupplier.geolocationCoverage}%` },
                      ].map((item) => (
                        <TableRow key={item.label}>
                          <TableCell>{item.label}</TableCell>
                          <TableCell className="font-semibold text-brand-primary">{item.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableRoot>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="space-y-4">
                <h3 className="text-lg font-bold text-brand-primary">Linked Products</h3>
                {selectedSupplier.linkedProductIds.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSupplier.linkedProductIds.map((productId) => (
                      <Card key={productId} variant="inset" className="p-3">
                        <strong className="text-sm text-brand-primary">{getProductName(productId)}</strong>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">No linked products.</p>
                )}
              </Card>

              <Card className="space-y-4">
                <h3 className="text-lg font-bold text-brand-primary">Linked Shipments</h3>
                {selectedSupplier.linkedConsignmentIds.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSupplier.linkedConsignmentIds.map((consignmentId) => {
                      const consignment = currentConsignments.find((item) => item.id === consignmentId);
                      return (
                        <Card key={consignmentId} variant="inset" className="space-y-1 p-3">
                          <strong className="text-sm text-brand-primary">{consignment?.reference ?? consignmentId}</strong>
                          <p className="text-xs text-text-secondary">
                            {consignment?.gateStatus ? humanize(consignment.gateStatus) : "Unknown gate status"} |{" "}
                            {consignment?.outputEligibility ? humanize(consignment.outputEligibility) : "Unknown eligibility"}
                          </p>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">No linked consignments.</p>
                )}
              </Card>
            </div>
          </div>
        ) : (
          <Card className="p-10 text-center text-text-secondary">Select a supplier to view compliance details.</Card>
        )}
      </div>

      {(isAddModalOpen || isEditModalOpen) ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-brand-primary">
                {isEditModalOpen ? "Edit Supplier Record" : "Add New Supplier"}
              </h2>
              <p className="text-xs text-text-secondary">
                Provide supplier identity, compliance posture status, and risk vectors to calculate downstream eligibility.
              </p>
            </div>

            <form onSubmit={(e) => handleSaveSupplier(e, isEditModalOpen)} className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Supplier Company Name</label>
                  <Input required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Sumatra Smallholders Group" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Origin Country</label>
                  <Input required value={formCountry} onChange={(e) => setFormCountry(e.target.value)} placeholder="e.g. Indonesia" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Supplier Type</label>
                  <Select value={formType} onChange={(e) => setFormType(e.target.value)}>
                    <option value="Grower / Smallholder Group">Grower / Smallholder Group</option>
                    <option value="Processor">Processor</option>
                    <option value="Manufacturer / Refiner">Manufacturer / Refiner</option>
                    <option value="Intermediary Trader">Intermediary Trader</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Onboarding Tier</label>
                  <Select value={formTier} onChange={(e) => setFormTier(Number(e.target.value))}>
                    <option value={1}>Tier 1 (Direct Supplier)</option>
                    <option value={2}>Tier 2 (Indirect Supplier)</option>
                    <option value={3}>Tier 3 (Sub-Tier / Smallholder)</option>
                  </Select>
                </div>
              </div>

              <Card variant="inset" className="space-y-2 p-3">
                <label className="text-sm font-semibold text-text-secondary">Linked Commodities</label>
                <div className="flex flex-wrap gap-4 text-sm text-brand-primary">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={formCommodities.includes("PALM")} onChange={() => handleCommodityToggle("PALM")} className="h-4 w-4 accent-brand-accent" />
                    Palm Oil (PALM)
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={formCommodities.includes("COCOA")} onChange={() => handleCommodityToggle("COCOA")} className="h-4 w-4 accent-brand-accent" />
                    Cocoa Products (COCOA)
                  </label>
                </div>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Onboarding Status</label>
                  <Select value={formOnboarding} onChange={(e) => setFormOnboarding(e.target.value as typeof formOnboarding)}>
                    <option value="APPROVED">APPROVED</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="PENDING_RESPONSE">PENDING RESPONSE</option>
                    <option value="CHANGES_REQUESTED">CHANGES REQUESTED</option>
                    <option value="BLOCKED">BLOCKED</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">EUDR Declaration Posture</label>
                  <Select value={formDeclaration} onChange={(e) => setFormDeclaration(e.target.value as typeof formDeclaration)}>
                    <option value="SIGNED">SIGNED & VERIFIED</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="REQUESTED">REQUESTED</option>
                    <option value="MISSING">MISSING</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">CoC Verification State</label>
                  <Select value={formCoc} onChange={(e) => setFormCoc(e.target.value as typeof formCoc)}>
                    <option value="VERIFIED">VERIFIED (Full IP/SG)</option>
                    <option value="MSDS_ONLY">MSDS ONLY</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="MISSING">MISSING</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Geolocation Mapping Coverage (%)</label>
                  <Input type="number" min={0} max={100} required value={formGeoCoverage} onChange={(e) => setFormGeoCoverage(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Contract Clause Posture</label>
                  <Select value={formContract} onChange={(e) => setFormContract(e.target.value as typeof formContract)}>
                    <option value="EUDR_CLAUSE_PRESENT">EUDR CLAUSE PRESENT</option>
                    <option value="LEGACY_CONTRACT">LEGACY CONTRACT (No Explicit Clause)</option>
                    <option value="MISSING">MISSING CONTRACT</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Latest Composite Risk Level</label>
                  <Select value={formRisk} onChange={(e) => setFormRisk(e.target.value as typeof formRisk)}>
                    <option value="LOW">LOW RISK</option>
                    <option value="MEDIUM">MEDIUM RISK</option>
                    <option value="HIGH">HIGH RISK</option>
                    <option value="CRITICAL">CRITICAL RISK</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Facilities List (comma-separated)</label>
                <Input value={formFacilities} onChange={(e) => setFormFacilities(e.target.value)} placeholder="e.g. Sumatra milling center, Medan warehouse" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Certifications (comma-separated)</label>
                <Input value={formCertifications} onChange={(e) => setFormCertifications(e.target.value)} placeholder="e.g. RSPO BVC-MY-991, Rainforest Alliance 801" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Active Blockers / Grievance Issues (one issue per line)</label>
                <Textarea
                  value={formIssues}
                  onChange={(e) => setFormIssues(e.target.value)}
                  className="min-h-[96px] resize-y"
                  placeholder={"e.g. Missing geolocation polygon shapefiles\nLegacy contract needs legal EUDR amendment"}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Next Action Directive</label>
                <Input value={formNextAction} onChange={(e) => setFormNextAction(e.target.value)} placeholder="e.g. Request coordinates from smallholders group leader." />
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
                <Button type="submit">{isEditModalOpen ? "Save Changes" : "Create Supplier"}</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {isLinkModalOpen ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <Card className="w-full max-w-3xl p-6">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-brand-primary">Generate Ingredient-Scoped EUDR Links</h2>
              <p className="text-sm text-text-secondary">
                Select one or more ingredient paths. Each selected path generates an isolated token link.
              </p>
            </div>
            <div className="mt-4 max-h-[48vh] space-y-2 overflow-y-auto">
              {selectedSupplierIngredientScopes.map((scope) => (
                <label key={scope.key} className="flex cursor-pointer items-start gap-3 rounded-md border border-border-soft bg-bg-surface p-3">
                  <input
                    type="checkbox"
                    checked={selectedScopeKeys.includes(scope.key)}
                    onChange={() =>
                      setSelectedScopeKeys((prev) =>
                        prev.includes(scope.key) ? prev.filter((item) => item !== scope.key) : [...prev, scope.key],
                      )
                    }
                    className="mt-1 h-4 w-4 accent-brand-accent"
                  />
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-brand-primary">
                      {scope.productName} | {scope.ingredientName}
                    </p>
                    <p className="text-text-secondary">Commodity: {scope.commodity}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsLinkModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleGenerateScopedLinks}>
                Generate Links
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
