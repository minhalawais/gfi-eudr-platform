"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/ui/PermissionGuard";
import { Globe, Lock, Package, CheckCircle2, Microscope, ClipboardList, Tag as TagIcon, Plus, Edit2, Trash2 } from "lucide-react";
import { ConsignmentRecord, DispatchLine, GateIssue, getScenarioData } from "@/lib/gfi-dummy-data";
import {
  Button,
  Card,
  Input,
  RiskBadge,
  SectionHeader,
  Select,
  StatusBadge,
  Tag,
} from "@/components/ui";
import type { RiskTone, StatusTone } from "@/lib/ui-semantics";

const GATE_STATUS_MAP: Record<"READY" | "BLOCKED" | "REVIEW_REQUIRED", StatusTone> = {
  READY: "ready",
  BLOCKED: "blocked",
  REVIEW_REQUIRED: "review_required",
};

const ELIGIBILITY_STATUS_MAP: Record<"PACKAGE_READY" | "HELD" | "SCOPE_REVIEW", StatusTone> = {
  PACKAGE_READY: "ready",
  HELD: "held",
  SCOPE_REVIEW: "review_required",
};

const TRACE_STATUS_MAP: Record<"TRACEABLE" | "BLOCKED" | "REVIEW_REQUIRED", StatusTone> = {
  TRACEABLE: "ready",
  BLOCKED: "blocked",
  REVIEW_REQUIRED: "review_required",
};

const ISSUE_SEVERITY_MAP: Record<"WARNING" | "HIGH" | "CRITICAL", RiskTone> = {
  WARNING: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

const CHECK_STATUS_MAP: Record<"PENDING" | "RUNNING" | "PASS" | "FAIL", StatusTone> = {
  PENDING: "draft",
  RUNNING: "current",
  PASS: "ready",
  FAIL: "blocked",
};

type DetailTab = "overview" | "checklist" | "signatories" | "precheck" | "issues";

const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "checklist", label: "Dispatch Checklist" },
  { key: "signatories", label: "Signatories" },
  { key: "precheck", label: "Pre-Export Check" },
  { key: "issues", label: "Issues" },
];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

// ─── Info Grid Helper ─────────────────────────────────────────────────────────
function InfoGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-lg border border-border-soft bg-bg-surface-alt p-3"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-1">
            {label}
          </p>
          <p className="text-sm font-semibold text-text-primary leading-snug">{value ?? "—"}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Lot Badge ────────────────────────────────────────────────────────────────
function LotBadge({ lot }: { lot: string }) {
  const isPending = lot === "PENDING" || lot === "—";
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide ${
        isPending
          ? "bg-state-error/10 text-state-error"
          : "bg-amber-50 text-amber-700 border border-amber-200"
      }`}
    >
      {lot}
    </span>
  );
}

// ─── Condition Badge ──────────────────────────────────────────────────────────
function ConditionBadge({ ok, trueLabel, falseLabel }: { ok?: boolean; trueLabel: string; falseLabel: string }) {
  if (ok === undefined) return <span className="text-text-secondary text-sm">—</span>;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        ok
          ? "bg-state-success/10 text-state-success"
          : "bg-state-error/10 text-state-error"
      }`}
    >
      <span>{ok ? "✓" : "✗"}</span>
      {ok ? trueLabel : falseLabel}
    </span>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────
function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mt-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary bg-brand-accent/20 px-2 py-0.5 rounded-full">
        {title}
      </span>
      <div className="flex-1 h-px bg-border-soft" />
    </div>
  );
}

export default function ConsignmentsPage() {
  const { consignments, agents, addConsignment, editConsignment, scenarioId, supplyChainNodes, eudrFormRequests } =
    useSession();
  const scenarioData = getScenarioData(scenarioId);
  const { outputPackages } = scenarioData;

  const [selectedConsignmentId, setSelectedConsignmentId] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");


  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Product Line sub-actions state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductLine, setEditingProductLine] = useState<DispatchLine | null>(null);

  const [productFinalCode, setProductFinalCode] = useState("");
  const [productName, setProductName] = useState("");
  const [productPacking, setProductPacking] = useState("");
  const [productSection, setProductSection] = useState("");
  const [productTotalCartons, setProductTotalCartons] = useState("");
  const [productDipsCartons, setProductDipsCartons] = useState("");
  const [productLotNo, setProductLotNo] = useState("PENDING");
  const [productMfgDate, setProductMfgDate] = useState("");
  const [productExpDate, setProductExpDate] = useState("");
  const [productGrossWt, setProductGrossWt] = useState("");

  // ─── Core Form State ────────────────────────────────────────────────────────
  const [formRef, setFormRef] = useState("");
  const [formDest, setFormDest] = useState("Rotterdam, Netherlands");
  const [formAgentId, setFormAgentId] = useState("");
  const [formShipMode, setFormShipMode] = useState<"CURRENT_EXPORT" | "FUTURE_EXPORT">("CURRENT_EXPORT");
  const [formGateStatus, setFormGateStatus] = useState<"READY" | "BLOCKED" | "REVIEW_REQUIRED">("READY");
  const [formEligibility, setFormEligibility] = useState<"PACKAGE_READY" | "HELD" | "SCOPE_REVIEW">("PACKAGE_READY");
  const [formTraceStatus, setFormTraceStatus] = useState<"TRACEABLE" | "BLOCKED" | "REVIEW_REQUIRED">("TRACEABLE");
  const [editingId, setEditingId] = useState<string | null>(null);

  // ─── Dispatch Header Form State ─────────────────────────────────────────────
  const [formSaleOrder, setFormSaleOrder] = useState("");
  const [formDispatchDate, setFormDispatchDate] = useState("");
  const [formInvoiceNo, setFormInvoiceNo] = useState("");
  const [formCustomerRef, setFormCustomerRef] = useState("");
  const [formPfaNo, setFormPfaNo] = useState("");
  const [formCountry, setFormCountry] = useState("");

  // ─── Container Form State ───────────────────────────────────────────────────
  const [formContainerNo, setFormContainerNo] = useState("");
  const [formContainerSize, setFormContainerSize] = useState("20ft");
  const [formCbm, setFormCbm] = useState("");
  const [formWeightLimit, setFormWeightLimit] = useState("");
  const [formSealNo, setFormSealNo] = useState("");
  const [formTruckNo, setFormTruckNo] = useState("");
  const [formMasterCase, setFormMasterCase] = useState("WHITE");
  const [formLogo, setFormLogo] = useState("CUSTOMER");
  const [formTape, setFormTape] = useState("CUSTOMER");

  // ─── Condition Form State ───────────────────────────────────────────────────
  const [formCleaned, setFormCleaned] = useState(true);
  const [formFitForLoading, setFormFitForLoading] = useState(true);
  const [formNotFitReason, setFormNotFitReason] = useState("");
  const [formSpecialRemarks, setFormSpecialRemarks] = useState("");

  // ─── Loading Form State ─────────────────────────────────────────────────────
  const [formPlaceOfLoading, setFormPlaceOfLoading] = useState("");
  const [formLoadingTime, setFormLoadingTime] = useState("");

  // ─── Dispatch Lines Form State ──────────────────────────────────────────────
  const [formDispatchLines, setFormDispatchLines] = useState<DispatchLine[]>([]);
  const [formLineProductName, setFormLineProductName] = useState("");
  const [formLineFinalCode, setFormLineFinalCode] = useState("");
  const [formLinePacking, setFormLinePacking] = useState("");
  const [formLineSection, setFormLineSection] = useState("");
  const [formLineTotalCtns, setFormLineTotalCtns] = useState("");
  const [formLineDipsCtns, setFormLineDipsCtns] = useState("");
  const [formLineLotNo, setFormLineLotNo] = useState("");
  const [formLineMfgDate, setFormLineMfgDate] = useState("");
  const [formLineExpDate, setFormLineExpDate] = useState("");
  const [formLineGrossWt, setFormLineGrossWt] = useState("");

  // ─── Signatory Form State ───────────────────────────────────────────────────
  const [formCheckedByExport, setFormCheckedByExport] = useState("");
  const [formQualityInspector, setFormQualityInspector] = useState("");
  const [formCountBy, setFormCountBy] = useState("");

  // ─── Gate Check State ───────────────────────────────────────────────────────
  const [gateCheckActive, setGateCheckActive] = useState(false);
  const [gateCheckStep, setGateCheckStep] = useState(0);
  const [gateCheckResults, setGateCheckResults] = useState<{
    bom: "PENDING" | "RUNNING" | "PASS" | "FAIL";
    supplier: "PENDING" | "RUNNING" | "PASS" | "FAIL";
    coordinates: "PENDING" | "RUNNING" | "PASS" | "FAIL";
    coc: "PENDING" | "RUNNING" | "PASS" | "FAIL";
  }>({
    bom: "PENDING",
    supplier: "PENDING",
    coordinates: "PENDING",
    coc: "PENDING",
  });

  useEffect(() => {
    if (consignments.length > 0) {
      const exists = consignments.some((item) => item.id === selectedConsignmentId);
      if (!exists) {
        setSelectedConsignmentId(consignments[0].id);
      }
    }
  }, [consignments, selectedConsignmentId]);

  const selectedConsignment = consignments.find((item) => item.id === selectedConsignmentId) ?? consignments[0];

  useEffect(() => {
    if (selectedConsignment) {
      document.title = `${selectedConsignment.reference} | Consignments | GFI Compliance Control Center`;
    } else {
      document.title = `Consignments | GFI Compliance Control Center`;
    }
  }, [selectedConsignment]);

  const assignedAgent = agents.find((agent) => agent.id === selectedConsignment?.operatorAgentId) ?? agents[0];
  const outputPackage = selectedConsignment
    ? outputPackages.find((pkg) => pkg.consignmentId === selectedConsignment.id)
    : undefined;

  const incompleteIngredientNodes = supplyChainNodes.filter(
    (node) => node.commodity === "COCOA" && ["REQUESTED", "IN_PROGRESS", "GAPS_FOUND", "BLOCKED"].includes(node.status),
  );

  const derivedIngredientIssue: GateIssue | null =
    incompleteIngredientNodes.length > 0
      ? {
          code: "INGREDIENT_SUPPLY_CHAIN_INCOMPLETE",
          severity: "CRITICAL",
          sourceDomain: "TRACEABILITY",
          blocking: true,
          message: `${incompleteIngredientNodes.length} cocoa ingredient chain node(s) still lack terminal farmer/producer evidence and approved plot data.`,
        }
      : null;

  const visibleIssues = selectedConsignment
    ? derivedIngredientIssue
      ? [...selectedConsignment.issues, derivedIngredientIssue]
      : selectedConsignment.issues
    : [];

  const queueStats = useMemo(
    () => ({
      total: consignments.length,
      blocked: consignments.filter((item) => item.gateStatus === "BLOCKED").length,
      ready: consignments.filter((item) => item.gateStatus === "READY").length,
    }),
    [consignments],
  );

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const runGateCheck = () => {
    if (!selectedConsignment) return;
    setGateCheckActive(true);
    setGateCheckStep(1);
    setGateCheckResults({ bom: "RUNNING", supplier: "PENDING", coordinates: "PENDING", coc: "PENDING" });
  };

  useEffect(() => {
    if (!gateCheckActive || !selectedConsignment) return;
    let timer: NodeJS.Timeout;

    if (gateCheckStep === 1) {
      timer = setTimeout(() => {
        const hasBomIssue = visibleIssues.some((issue) => issue.sourceDomain === "PRODUCT" && issue.blocking);
        setGateCheckResults((prev) => ({
          ...prev,
          bom: hasBomIssue ? "FAIL" : "PASS",
          supplier: hasBomIssue ? "PENDING" : "RUNNING",
        }));
        if (hasBomIssue) {
          setGateCheckActive(false);
          triggerToast("Gate check failed: BOM audit issues detected.");
        } else {
          setGateCheckStep(2);
        }
      }, 700);
    } else if (gateCheckStep === 2) {
      timer = setTimeout(() => {
        const hasSupplierIssue = visibleIssues.some((issue) => issue.sourceDomain === "SUPPLIER" && issue.blocking);
        setGateCheckResults((prev) => ({
          ...prev,
          supplier: hasSupplierIssue ? "FAIL" : "PASS",
          coordinates: hasSupplierIssue ? "PENDING" : "RUNNING",
        }));
        if (hasSupplierIssue) {
          setGateCheckActive(false);
          triggerToast("Gate check failed: Supplier onboarding issues detected.");
        } else {
          setGateCheckStep(3);
        }
      }, 700);
    } else if (gateCheckStep === 3) {
      timer = setTimeout(() => {
        const hasGeoIssue = visibleIssues.some((issue) => issue.sourceDomain === "GEOLOCATION" && issue.blocking);
        setGateCheckResults((prev) => ({
          ...prev,
          coordinates: hasGeoIssue ? "FAIL" : "PASS",
          coc: hasGeoIssue ? "PENDING" : "RUNNING",
        }));
        if (hasGeoIssue) {
          setGateCheckActive(false);
          triggerToast("Gate check failed: Geolocation polygon gaps detected.");
        } else {
          setGateCheckStep(4);
        }
      }, 700);
    } else if (gateCheckStep === 4) {
      timer = setTimeout(() => {
        const hasCocIssue = visibleIssues.some(
          (issue) => (issue.sourceDomain === "TRACEABILITY" || issue.sourceDomain === "DOCUMENTS") && issue.blocking,
        );
        setGateCheckResults((prev) => ({ ...prev, coc: hasCocIssue ? "FAIL" : "PASS" }));
        setGateCheckActive(false);
        if (hasCocIssue) {
          triggerToast("Gate check failed: Chain of custody or document gaps detected.");
        } else {
          triggerToast("Gate check cleared successfully. Shipment ready for operator agent handoff.");
        }
      }, 700);
    }

    return () => clearTimeout(timer);
  }, [gateCheckActive, gateCheckStep, selectedConsignment, visibleIssues]);

  useEffect(() => {
    setGateCheckActive(false);
    setGateCheckStep(0);
    setGateCheckResults({ bom: "PENDING", supplier: "PENDING", coordinates: "PENDING", coc: "PENDING" });
  }, [selectedConsignmentId, scenarioId]);

  // Reset active tab when consignment changes
  useEffect(() => {
    setActiveTab("overview");
  }, [selectedConsignmentId]);

  const resetForm = () => {
    setFormRef("");
    setFormDest("Rotterdam, Netherlands");
    setFormAgentId(agents[0]?.id || "");
    setFormShipMode("CURRENT_EXPORT");
    setFormGateStatus("READY");
    setFormEligibility("PACKAGE_READY");
    setFormTraceStatus("TRACEABLE");
    setEditingId(null);
    // Dispatch header
    setFormSaleOrder("");
    setFormDispatchDate("");
    setFormInvoiceNo("");
    setFormCustomerRef("");
    setFormPfaNo("");
    setFormCountry("");
    // Container
    setFormContainerNo("");
    setFormContainerSize("20ft");
    setFormCbm("");
    setFormWeightLimit("");
    setFormSealNo("");
    setFormTruckNo("");
    setFormMasterCase("WHITE");
    setFormLogo("CUSTOMER");
    setFormTape("CUSTOMER");
    // Condition
    setFormCleaned(true);
    setFormFitForLoading(true);
    setFormNotFitReason("");
    setFormSpecialRemarks("");
    // Loading
    setFormPlaceOfLoading("");
    setFormLoadingTime("");
    // Dispatch lines
    setFormDispatchLines([]);
    setFormLineProductName("");
    setFormLineFinalCode("");
    setFormLinePacking("");
    setFormLineSection("");
    setFormLineTotalCtns("");
    setFormLineDipsCtns("");
    setFormLineLotNo("");
    setFormLineMfgDate("");
    setFormLineExpDate("");
    setFormLineGrossWt("");
    // Signatories
    setFormCheckedByExport("");
    setFormQualityInspector("");
    setFormCountBy("");
  };

  const handleAddDispatchLine = () => {
    if (!formLineProductName.trim() || !formLineFinalCode.trim()) return;
    const totalCtns = parseInt(formLineTotalCtns) || 0;
    const grossWt = parseFloat(formLineGrossWt) || 0;
    const newLine: DispatchLine = {
      sr: formDispatchLines.length + 1,
      finalCode: formLineFinalCode,
      productName: formLineProductName,
      packingDesc: formLinePacking,
      section: formLineSection,
      totalCartons: totalCtns,
      dipsCartons: parseInt(formLineDipsCtns) || 0,
      lotNo: formLineLotNo || "PENDING",
      mfgDate: formLineMfgDate,
      expDate: formLineExpDate,
      grossWtKg: grossWt,
      totalGrossWtKg: +(grossWt * totalCtns).toFixed(2),
    };
    setFormDispatchLines((prev) => [...prev, newLine]);
    setFormLineProductName("");
    setFormLineFinalCode("");
    setFormLinePacking("");
    setFormLineSection("");
    setFormLineTotalCtns("");
    setFormLineDipsCtns("");
    setFormLineLotNo("");
    setFormLineMfgDate("");
    setFormLineExpDate("");
    setFormLineGrossWt("");
  };

  const handleRemoveDispatchLine = (sr: number) => {
    setFormDispatchLines((prev) => prev.filter((l) => l.sr !== sr).map((l, i) => ({ ...l, sr: i + 1 })));
  };

  const openAddProductModal = () => {
    setEditingProductLine(null);
    setProductFinalCode("");
    setProductName("");
    setProductPacking("");
    setProductSection("");
    setProductTotalCartons("");
    setProductDipsCartons("");
    setProductLotNo("PENDING");
    setProductMfgDate("");
    setProductExpDate("");
    setProductGrossWt("");
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (line: DispatchLine) => {
    setEditingProductLine(line);
    setProductFinalCode(line.finalCode);
    setProductName(line.productName);
    setProductPacking(line.packingDesc);
    setProductSection(line.section);
    setProductTotalCartons(line.totalCartons.toString());
    setProductDipsCartons(line.dipsCartons.toString());
    setProductLotNo(line.lotNo);
    setProductMfgDate(line.mfgDate);
    setProductExpDate(line.expDate);
    setProductGrossWt(line.grossWtKg.toString());
    setIsProductModalOpen(true);
  };

  const handleSaveProductLine = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedConsignment) return;
    if (!productFinalCode.trim() || !productName.trim()) {
      triggerToast("Please provide both Final Code and Product Name.");
      return;
    }

    const totalCtns = parseInt(productTotalCartons) || 0;
    const dipsCtns = parseInt(productDipsCartons) || 0;
    const grossWt = parseFloat(productGrossWt) || 0;

    const currentLines = selectedConsignment.dispatchLines ?? [];
    let updatedLines: DispatchLine[] = [];

    if (editingProductLine) {
      updatedLines = currentLines.map((l) => {
        if (l.sr === editingProductLine.sr) {
          return {
            ...l,
            finalCode: productFinalCode,
            productName: productName,
            packingDesc: productPacking,
            section: productSection,
            totalCartons: totalCtns,
            dipsCartons: dipsCtns,
            lotNo: productLotNo || "PENDING",
            mfgDate: productMfgDate,
            expDate: productExpDate,
            grossWtKg: grossWt,
            totalGrossWtKg: +(grossWt * totalCtns).toFixed(2),
          };
        }
        return l;
      });
    } else {
      const newLine: DispatchLine = {
        sr: currentLines.length + 1,
        finalCode: productFinalCode,
        productName: productName,
        packingDesc: productPacking,
        section: productSection,
        totalCartons: totalCtns,
        dipsCartons: dipsCtns,
        lotNo: productLotNo || "PENDING",
        mfgDate: productMfgDate,
        expDate: productExpDate,
        grossWtKg: grossWt,
        totalGrossWtKg: +(grossWt * totalCtns).toFixed(2),
      };
      updatedLines = [...currentLines, newLine];
    }

    const resequencedLines = updatedLines.map((l, index) => ({
      ...l,
      sr: index + 1,
    }));

    const totalCartons = resequencedLines.reduce((s, l) => s + l.totalCartons, 0);
    const totalDipsCartons = resequencedLines.reduce((s, l) => s + l.dipsCartons, 0);
    const grossWeightTons = +(resequencedLines.reduce((s, l) => s + l.totalGrossWtKg, 0) / 1000).toFixed(5);
    const lineSummary = [`${resequencedLines.length} product lines / ${grossWeightTons} MT gross weight`];

    const updatedConsignment: ConsignmentRecord = {
      ...selectedConsignment,
      dispatchLines: resequencedLines,
      totalCartons,
      totalDipsCartons,
      grossWeightTons,
      lineSummary,
    };

    editConsignment(updatedConsignment);
    setIsProductModalOpen(false);
    triggerToast(editingProductLine ? "Product line updated." : "Product line added.");
  };

  const handleDeleteProductLine = (sr: number) => {
    if (!selectedConsignment) return;
    if (!window.confirm("Are you sure you want to delete this product line?")) return;

    const currentLines = selectedConsignment.dispatchLines ?? [];
    const updatedLines = currentLines
      .filter((l) => l.sr !== sr)
      .map((l, index) => ({
        ...l,
        sr: index + 1,
      }));

    const totalCartons = updatedLines.reduce((s, l) => s + l.totalCartons, 0);
    const totalDipsCartons = updatedLines.reduce((s, l) => s + l.dipsCartons, 0);
    const grossWeightTons = +(updatedLines.reduce((s, l) => s + l.totalGrossWtKg, 0) / 1000).toFixed(5);
    const lineSummary = [`${updatedLines.length} product lines / ${grossWeightTons} MT gross weight`];

    const updatedConsignment: ConsignmentRecord = {
      ...selectedConsignment,
      dispatchLines: updatedLines,
      totalCartons,
      totalDipsCartons,
      grossWeightTons,
      lineSummary,
    };

    editConsignment(updatedConsignment);
    triggerToast("Product line deleted.");
  };

  const handleOpenEdit = () => {
    if (!selectedConsignment) return;
    const c = selectedConsignment;
    setEditingId(c.id);
    setFormRef(c.reference);
    setFormDest(c.destination);
    setFormAgentId(c.operatorAgentId);
    setFormShipMode(c.shipmentMode);
    setFormGateStatus(c.gateStatus);
    setFormEligibility(c.outputEligibility);
    setFormTraceStatus(c.traceabilityStatus);
    // Dispatch header
    setFormSaleOrder(c.saleOrderNo ?? "");
    setFormDispatchDate(c.dispatchDate ?? "");
    setFormInvoiceNo(c.invoiceNo ?? "");
    setFormCustomerRef(c.customerRefNo ?? "");
    setFormPfaNo(c.pfaNo ?? "");
    setFormCountry(c.country ?? "");
    // Container
    setFormContainerNo(c.containerNo ?? "");
    setFormContainerSize(c.containerSize ?? "20ft");
    setFormCbm(c.cbm?.toString() ?? "");
    setFormWeightLimit(c.weightLimitKg?.toString() ?? "");
    setFormSealNo(c.sealNo ?? "");
    setFormTruckNo(c.truckNo ?? "");
    setFormMasterCase(c.masterCaseColor ?? "WHITE");
    setFormLogo(c.logoOnCarton ?? "CUSTOMER");
    setFormTape(c.tapeOnCarton ?? "CUSTOMER");
    // Condition
    setFormCleaned(c.cleanedBeforeLoading ?? true);
    setFormFitForLoading(c.fitForLoading ?? true);
    setFormNotFitReason(c.notFitReason ?? "");
    setFormSpecialRemarks(c.specialRemarks ?? "");
    // Loading
    setFormPlaceOfLoading(c.placeOfLoading ?? "");
    setFormLoadingTime(c.loadingTime ?? "");
    // Dispatch lines
    setFormDispatchLines(c.dispatchLines ?? []);
    // Signatories
    setFormCheckedByExport(c.checkedByExport ?? "");
    setFormQualityInspector(c.qualityInspector ?? "");
    setFormCountBy(c.countBy ?? "");
    setIsEditModalOpen(true);
  };

  const handleSaveConsignment = (event: React.FormEvent, isEdit: boolean) => {
    event.preventDefault();
    if (!formRef.trim()) return;

    const totalCartons = formDispatchLines.reduce((s, l) => s + l.totalCartons, 0);
    const totalDipsCartons = formDispatchLines.reduce((s, l) => s + l.dipsCartons, 0);
    const grossWeightTons = +(formDispatchLines.reduce((s, l) => s + l.totalGrossWtKg, 0) / 1000).toFixed(5);
    const existingConsignment = isEdit && editingId
      ? consignments.find((consignment) => consignment.id === editingId)
      : undefined;

    const consignmentData: ConsignmentRecord = {
      id: isEdit && editingId ? editingId : `con-${Date.now()}`,
      reference: formRef,
      destination: formDest,
      operatorAgentId: formAgentId,
      shipmentMode: formShipMode,
      lineSummary:
        existingConsignment?.lineSummary ??
        [`${formDispatchLines.length || 0} product lines / ${grossWeightTons || 0} MT gross weight`],
      gateStatus: formGateStatus,
      outputEligibility: formEligibility,
      traceabilityStatus: formTraceStatus,
      policyNarrative:
        existingConsignment?.policyNarrative ??
        `Consignment shipment from GFI to ${formDest}.`,
      issues: existingConsignment?.issues ?? [],
      nextAction:
        existingConsignment?.nextAction ??
        "Complete the pre-export gate check and prepare the operator-agent handoff.",
      // Dispatch Checklist
      saleOrderNo: formSaleOrder || undefined,
      dispatchDate: formDispatchDate || undefined,
      invoiceNo: formInvoiceNo || undefined,
      customerRefNo: formCustomerRef || undefined,
      pfaNo: formPfaNo || undefined,
      country: formCountry || undefined,
      containerNo: formContainerNo || undefined,
      containerSize: formContainerSize || undefined,
      cbm: formCbm ? parseFloat(formCbm) : undefined,
      weightLimitKg: formWeightLimit ? parseFloat(formWeightLimit) : undefined,
      grossWeightTons: grossWeightTons || undefined,
      sealNo: formSealNo || undefined,
      truckNo: formTruckNo || undefined,
      masterCaseColor: formMasterCase || undefined,
      logoOnCarton: formLogo || undefined,
      tapeOnCarton: formTape || undefined,
      cleanedBeforeLoading: formCleaned,
      fitForLoading: formFitForLoading,
      notFitReason: !formFitForLoading ? formNotFitReason : undefined,
      specialRemarks: formSpecialRemarks || undefined,
      placeOfLoading: formPlaceOfLoading || undefined,
      loadingTime: formLoadingTime || undefined,
      dispatchLines: formDispatchLines.length > 0 ? formDispatchLines : undefined,
      totalCartons: totalCartons || undefined,
      totalDipsCartons: totalDipsCartons || undefined,
      checkedByExport: formCheckedByExport || undefined,
      qualityInspector: formQualityInspector || undefined,
      countBy: formCountBy || undefined,
    };

    if (isEdit) {
      editConsignment(consignmentData);
      setIsEditModalOpen(false);
    } else {
      addConsignment(consignmentData);
      setSelectedConsignmentId(consignmentData.id);
      setIsAddModalOpen(false);
    }
    resetForm();
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    resetForm();
  };

  // ─── Tab Renderers ────────────────────────────────────────────────────────────

  const renderOverviewTab = () => {
    const c = selectedConsignment;
    const lines = c.dispatchLines ?? [];
    const totalCtns = c.totalCartons ?? lines.reduce((s, l) => s + l.totalCartons, 0);
    const totalDips = c.totalDipsCartons ?? lines.reduce((s, l) => s + l.dipsCartons, 0);
    const totalGrossKg = lines.reduce((s, l) => s + l.totalGrossWtKg, 0);
    const totalGrossTons = (c.grossWeightTons ?? totalGrossKg / 1000).toFixed(5);

    return (
      <div className="space-y-6">
        {/* Compact Metadata Card (2 rows on medium/large screens) */}
        <Card variant="inset" className="p-4 bg-gradient-to-b from-bg-surface to-bg-surface-alt border-border-soft/60">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            {/* Destination */}
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Destination</p>
              <p className="text-sm font-semibold text-text-primary truncate">{c.destination}</p>
            </div>

            {/* Traceability */}
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Traceability</p>
              <div>
                <StatusBadge status={TRACE_STATUS_MAP[c.traceabilityStatus]}>
                  {formatLabel(c.traceabilityStatus)}
                </StatusBadge>
              </div>
            </div>

            {/* Operator Agent */}
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Operator Agent</p>
              <p className="text-sm font-semibold text-text-primary truncate">{assignedAgent?.name || "—"}</p>
            </div>

            {/* Output Eligibility */}
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Output Eligibility</p>
              <div>
                <StatusBadge status={ELIGIBILITY_STATUS_MAP[c.outputEligibility]}>
                  {formatLabel(c.outputEligibility)}
                </StatusBadge>
              </div>
            </div>

            {/* Agent Readiness */}
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Agent Readiness</p>
              <div>
                <StatusBadge status={assignedAgent?.readiness === "READY" ? "ready" : "review_required"}>
                  {formatLabel(assignedAgent?.readiness ?? "")}
                </StatusBadge>
              </div>
            </div>

            {/* Package Snapshot */}
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Package Snapshot</p>
              <p className="text-sm font-semibold text-brand-primary truncate">
                {outputPackage ? outputPackage.packageRef : "No package started"}
              </p>
            </div>
          </div>
        </Card>

        {/* Product Lines Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 mt-1">
            <div className="flex-1">
              <SectionDivider title="Product Lines" />
            </div>
            <Button
              size="sm"
              icon={<Plus className="h-3.5 w-3.5" />}
              className="shrink-0 whitespace-nowrap"
              onClick={openAddProductModal}
              disabled={gateCheckActive}
            >
              Add Product
            </Button>
          </div>

          {lines.length === 0 ? (
            <Card variant="inset" className="p-8 text-center text-sm text-text-secondary">
              No product lines have been recorded for this shipment.
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border-soft bg-bg-surface-alt p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Total Cartons</p>
                  <p className="text-2xl font-black text-brand-primary mt-1">{totalCtns.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border-soft bg-bg-surface-alt p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Dips Cartons</p>
                  <p className="text-2xl font-black text-brand-primary mt-1">{totalDips.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border-soft bg-bg-surface-alt p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Gross Weight</p>
                  <p className="text-2xl font-black text-teal-700 mt-1">{totalGrossTons} T</p>
                </div>
              </div>

              {/* Product Lines Table */}
              <div className="overflow-x-auto rounded-xl border border-border-soft">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-brand-primary text-text-inverse">
                      <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider">Sr</th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider">Code</th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider">Product / Packing</th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider">Section</th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider">Total Ctns</th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider">Dips Ctns</th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider">Lot #</th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider">Mfg / Exp</th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider">Gross Wt (kg)</th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider">Total Gross (kg)</th>
                      <th className="px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, idx) => (
                      <tr
                        key={line.sr}
                        className={`border-t border-border-soft transition-colors hover:bg-brand-accent/5 ${
                          idx % 2 === 0 ? "bg-bg-surface" : "bg-bg-surface-alt"
                        }`}
                      >
                        <td className="px-3 py-2.5 text-text-secondary font-mono text-xs">{line.sr}</td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block rounded-md bg-bg-page border border-border-soft px-2 py-0.5 font-mono text-[11px] font-bold text-brand-primary">
                            {line.finalCode}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-text-primary leading-tight">{line.productName}</p>
                          <p className="text-[11px] text-text-secondary mt-0.5">{line.packingDesc}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block rounded-full bg-bg-page border border-border-soft px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                            {line.section}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-text-primary">{line.totalCartons.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-text-secondary">{line.dipsCartons.toLocaleString()}</td>
                        <td className="px-3 py-2.5">
                          <LotBadge lot={line.lotNo} />
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-[11px] font-mono text-text-primary">{line.mfgDate}</p>
                          <p className="text-[11px] font-mono text-text-secondary">{line.expDate}</p>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-teal-700">{line.grossWtKg}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-teal-700">
                          {line.totalGrossWtKg.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditProductModal(line)}
                              className="text-text-secondary hover:text-brand-primary transition-colors p-1"
                              title="Edit Product Line"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProductLine(line.sr)}
                              className="text-text-secondary hover:text-state-error transition-colors p-1"
                              title="Delete Product Line"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="border-t-2 border-brand-primary bg-brand-accent/10">
                      <td colSpan={4} className="px-3 py-3 font-bold text-brand-primary text-xs uppercase tracking-wide">
                        TOTALS
                      </td>
                      <td className="px-3 py-3 text-right font-black text-brand-primary">{totalCtns.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right font-black text-brand-primary">{totalDips.toLocaleString()}</td>
                      <td colSpan={2} className="px-3 py-3" />
                      <td className="px-3 py-3 text-right font-black text-teal-700 font-mono">
                        {(totalGrossKg / lines.length).toFixed(2)} avg
                      </td>
                      <td className="px-3 py-3 text-right font-black text-teal-700 font-mono">
                        {totalGrossKg.toLocaleString()} kg
                        <br />
                        <span className="text-brand-primary">{totalGrossTons} T</span>
                      </td>
                      <td className="px-3 py-3" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChecklistTab = () => {
    const c = selectedConsignment;
    return (
      <div className="space-y-5">
        {/* Document Header */}
        <SectionDivider title="Document Header" />
        <InfoGrid
          items={[
            { label: "Sale Order #", value: c.saleOrderNo },
            { label: "Dispatch Date", value: c.dispatchDate },
            { label: "Invoice #", value: c.invoiceNo },
            { label: "Customer Ref #", value: c.customerRefNo },
            { label: "PFA #", value: c.pfaNo },
            { label: "Destination Country", value: c.country },
          ]}
        />

        {/* Container / Logistics */}
        <SectionDivider title="Container & Logistics" />
        <InfoGrid
          items={[
            { label: "Container #", value: c.containerNo },
            { label: "Container Size", value: c.containerSize },
            { label: "CBM", value: c.cbm !== undefined ? `${c.cbm} m³` : "—" },
            { label: "Weight Limit", value: c.weightLimitKg !== undefined ? `${c.weightLimitKg.toLocaleString()} kg` : "—" },
            { label: "Gross Weight", value: c.grossWeightTons !== undefined ? `${c.grossWeightTons} T` : "—" },
            { label: "Seal #", value: c.sealNo },
            { label: "Truck #", value: c.truckNo },
            { label: "Master Case", value: c.masterCaseColor },
          ]}
        />

        <div className="flex flex-wrap gap-3">
          {c.logoOnCarton && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-bg-surface-alt px-3 py-1.5 text-xs font-semibold text-text-primary">
              <TagIcon className="h-3.5 w-3.5 text-brand-primary" />
              <span>Logo: {c.logoOnCarton}</span>
            </span>
          )}
          {c.tapeOnCarton && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-bg-surface-alt px-3 py-1.5 text-xs font-semibold text-text-primary">
              <Lock className="h-3.5 w-3.5 text-brand-primary" />
              <span>Tape: {c.tapeOnCarton}</span>
            </span>
          )}
          {c.masterCaseColor && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-bg-surface-alt px-3 py-1.5 text-xs font-semibold text-text-primary">
              <Package className="h-3.5 w-3.5 text-brand-primary" />
              <span>Master Case: {c.masterCaseColor}</span>
            </span>
          )}
        </div>

        {/* Condition Checks */}
        <SectionDivider title="Condition Checks" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border-soft bg-bg-surface-alt p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Cleaned Before Loading</p>
            <ConditionBadge ok={c.cleanedBeforeLoading} trueLabel="YES — Cleaned" falseLabel="NO — Not Cleaned" />
          </div>
          <div className="rounded-lg border border-border-soft bg-bg-surface-alt p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Fit for Loading</p>
            <ConditionBadge ok={c.fitForLoading} trueLabel="YES — Fit" falseLabel="NO — Not Fit" />
            {!c.fitForLoading && c.notFitReason && (
              <p className="text-xs text-state-error mt-1">{c.notFitReason}</p>
            )}
          </div>
        </div>
        {c.specialRemarks && (
          <div className="rounded-lg border border-brand-accent/30 bg-brand-accent/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary mb-1">Special Remarks</p>
            <p className="text-sm text-text-primary font-medium">{c.specialRemarks}</p>
          </div>
        )}

        {/* Loading Info */}
        <SectionDivider title="Loading Information" />
        <div className="flex flex-wrap gap-4">
          {c.placeOfLoading && (
            <div className="rounded-lg border border-border-soft bg-bg-surface-alt px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Place of Loading</p>
              <p className="text-sm font-bold text-text-primary">{c.placeOfLoading}</p>
            </div>
          )}
          {c.loadingTime && (
            <div className="rounded-lg border border-border-soft bg-bg-surface-alt px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Loading Time</p>
              <p className="text-sm font-bold text-brand-primary font-mono">{c.loadingTime}</p>
            </div>
          )}
        </div>
      </div>
    );
  };



  const renderSignatoriesTab = () => {
    const c = selectedConsignment;
    const signatories = [
      { role: "Checked by (Export)", name: c.checkedByExport, icon: CheckCircle2 },
      { role: "Quality Inspector", name: c.qualityInspector, icon: Microscope },
      { role: "Count By", name: c.countBy, icon: ClipboardList },
    ];
    const hasData = signatories.some((s) => s.name && s.name !== "—");
    if (!hasData) {
      return (
        <Card variant="inset" className="p-8 text-center text-sm text-text-secondary">
          No signatory information recorded for this shipment.
        </Card>
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {signatories.map((sig) => (
          <div
            key={sig.role}
            className="rounded-xl border border-border-soft bg-bg-surface-alt p-5 flex flex-col items-center gap-3 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-accent/20 text-brand-primary">
              <sig.icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">{sig.role}</p>
              <p className="text-base font-bold text-text-primary">{sig.name && sig.name !== "—" ? sig.name : "—"}</p>
            </div>
            {sig.name && sig.name !== "—" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-state-success/10 px-3 py-1 text-[11px] font-semibold text-state-success">
                ✓ Signed
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPreExportTab = () => (
    <div className="space-y-4">
      <SectionHeader
        title="Pre-Export Gate Check"
        actions={
          !gateCheckActive && gateCheckStep === 0 ? (
            <Button size="sm" onClick={runGateCheck}>
              Run Clearance Scan
            </Button>
          ) : null
        }
      />
      {gateCheckActive || gateCheckStep > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { key: "bom", label: "BOM Audit", status: gateCheckResults.bom },
            { key: "supplier", label: "Supplier", status: gateCheckResults.supplier },
            { key: "coordinates", label: "Geolocation", status: gateCheckResults.coordinates },
            { key: "coc", label: "CoC & Docs", status: gateCheckResults.coc },
          ].map((item) => (
            <Card key={item.key} variant="inset" className="p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-text-secondary">{item.label}</p>
              <div className="mt-3">
                <StatusBadge status={CHECK_STATUS_MAP[item.status]}>{item.status}</StatusBadge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="inset" className="p-4 text-sm text-text-secondary">
          Run the clearance scan to evaluate gate checks step-by-step.
        </Card>
      )}
    </div>
  );

  const renderIssuesTab = () => (
    <div className="space-y-3">
      {visibleIssues.length === 0 ? (
        <Card variant="inset" className="p-4">
          <StatusBadge status="ready">No blocking or warning issues remain in this scenario.</StatusBadge>
        </Card>
      ) : (
        visibleIssues.map((issue) => (
          <Card key={issue.code} variant={issue.blocking ? "alert" : "inset"} className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-brand-primary">{issue.code}</p>
              <div className="flex items-center gap-2">
                <RiskBadge risk={ISSUE_SEVERITY_MAP[issue.severity]}>{issue.severity}</RiskBadge>
                <StatusBadge status={issue.blocking ? "blocked" : "review_required"}>
                  {issue.blocking ? "BLOCKING" : "REVIEW"}
                </StatusBadge>
              </div>
            </div>
            <p className="text-sm text-text-secondary">{issue.message}</p>
            <p className="font-mono text-xs text-text-secondary">Source domain: {issue.sourceDomain}</p>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-6">
      {toastMessage ? (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-md border border-brand-accent bg-brand-primary px-4 py-3 text-sm font-semibold text-text-inverse shadow-card">
          <span>{toastMessage}</span>
        </div>
      ) : null}

      <SectionHeader
        title="Consignment Management"
        description="Validate shipment readiness across BOM, suppliers, geolocation, and chain-of-custody checks."
        actions={
          <Tag tone="brand">
            Scenario: <span className="ml-1 font-semibold">{formatLabel(scenarioId)}</span>
          </Tag>
        }
      />

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Total Shipments</p>
          <p className="mt-2 text-2xl font-bold text-brand-primary">{queueStats.total}</p>
        </Card>
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Ready</p>
          <p className="mt-2 text-2xl font-bold text-state-success">{queueStats.ready}</p>
        </Card>
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Blocked</p>
          <p className="mt-2 text-2xl font-bold text-state-error">{queueStats.blocked}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* Shipment List */}
        <Card className="flex flex-col gap-4 border-border-strong/70 bg-gradient-to-b from-bg-surface to-bg-surface-alt lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border-soft/80 pb-3">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-brand-primary">Shipment List</h2>
              <p className="text-xs text-text-secondary">Select a shipment to inspect its details</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Tag tone="neutral">{consignments.length}</Tag>
              <Button
                size="sm"
                onClick={() => {
                  resetForm();
                  setIsAddModalOpen(true);
                }}
                disabled={gateCheckActive}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {consignments.map((consignment) => {
              const isSelected = selectedConsignment?.id === consignment.id;
              const gateColor =
                consignment.gateStatus === "READY"
                  ? "text-state-success bg-state-success/10 border-state-success/20"
                  : consignment.gateStatus === "BLOCKED"
                  ? "text-state-error bg-state-error/10 border-state-error/20"
                  : "text-state-warning bg-state-warning/10 border-state-warning/20";
              return (
                <button
                  key={consignment.id}
                  type="button"
                  disabled={gateCheckActive && !isSelected}
                  onClick={() => {
                    if (!gateCheckActive) setSelectedConsignmentId(consignment.id);
                  }}
                  onKeyDown={(event) => {
                    if (!gateCheckActive && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      setSelectedConsignmentId(consignment.id);
                    }
                  }}
                  className={[
                    "relative group w-full rounded-lg border pl-4 pr-3 py-3 text-left transition-all duration-200 ease-in-out overflow-hidden",
                    gateCheckActive && !isSelected ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                    isSelected
                      ? "border-brand-primary bg-brand-accent-soft/40 shadow-sm"
                      : "border-border-soft bg-bg-surface hover:-translate-y-0.5 hover:border-border-strong hover:bg-bg-surface-alt hover:shadow-card",
                  ].join(" ")}
                >
                  {/* Active left border indicator */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary rounded-l-lg" />
                  )}

                  {/* Reference */}
                  <div className="flex items-start justify-between gap-2">
                    <strong className="block text-sm font-bold text-brand-primary leading-tight group-hover:text-brand-primary truncate">
                      {consignment.reference}
                    </strong>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${gateColor}`}
                    >
                      {consignment.gateStatus === "REVIEW_REQUIRED" ? "REVIEW" : consignment.gateStatus}
                    </span>
                  </div>

                  {/* Destination + mode */}
                  <p className="mt-1.5 text-xs text-text-secondary leading-snug">
                    {consignment.destination}
                  </p>
                  <p className="text-[11px] text-text-secondary/70 mt-0.5">
                    {formatLabel(consignment.shipmentMode)}
                  </p>

                  {/* Meta row */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {consignment.country && (
                      <span className="inline-flex items-center gap-1 rounded bg-bg-page/60 border border-border-soft px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
                        <Globe className="h-3 w-3 text-text-secondary/70" />
                        <span>{consignment.country}</span>
                      </span>
                    )}
                    {consignment.saleOrderNo && (
                      <span className="rounded bg-bg-page/60 border border-border-soft px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
                        SO# {consignment.saleOrderNo}
                      </span>
                    )}
                    {consignment.totalCartons && (
                      <span className="rounded bg-bg-page/60 border border-border-soft px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
                        {consignment.totalCartons.toLocaleString()} ctns
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

        </Card>

        {/* Detail Panel */}
        {selectedConsignment && assignedAgent ? (
          <div className="flex flex-col gap-4">
            {/* Detail Header Card */}
            <Card className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-xl font-black text-brand-primary">{selectedConsignment.reference}</h2>
                    <StatusBadge status={GATE_STATUS_MAP[selectedConsignment.gateStatus]}>
                      {formatLabel(selectedConsignment.gateStatus)}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {selectedConsignment.destination}
                    {selectedConsignment.country ? ` · ${selectedConsignment.country}` : ""}
                    {selectedConsignment.saleOrderNo ? ` · SO# ${selectedConsignment.saleOrderNo}` : ""}
                    {" · "}
                    {formatLabel(selectedConsignment.shipmentMode)}
                  </p>
                  {selectedConsignment.dispatchLines && selectedConsignment.dispatchLines.length > 0 && (
                    <p className="text-xs text-text-secondary mt-1">
                      {selectedConsignment.dispatchLines.length} product lines
                      {selectedConsignment.totalCartons ? ` · ${selectedConsignment.totalCartons.toLocaleString()} cartons` : ""}
                      {selectedConsignment.grossWeightTons ? ` · ${selectedConsignment.grossWeightTons} T` : ""}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="secondary" onClick={handleOpenEdit} disabled={gateCheckActive}>
                  Edit
                </Button>
              </div>
            </Card>

            {/* Tab Navigation */}
            <div className="flex gap-1 overflow-x-auto pb-1 rounded-xl border border-border-soft bg-bg-surface-alt p-1">
              {DETAIL_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                const hasIssues = tab.key === "issues" && visibleIssues.length > 0;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-brand-primary text-text-inverse shadow-sm"
                        : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                    }`}
                  >
                    {tab.label}
                    {hasIssues && (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-state-error text-[9px] font-bold text-white">
                        {visibleIssues.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <Card className="p-4 sm:p-5 min-h-[300px]">
              {activeTab === "overview" && renderOverviewTab()}
              {activeTab === "checklist" && renderChecklistTab()}
              {activeTab === "signatories" && renderSignatoriesTab()}
              {activeTab === "precheck" && renderPreExportTab()}
              {activeTab === "issues" && renderIssuesTab()}
            </Card>
          </div>
        ) : (
          <Card className="p-10 text-center text-sm text-text-secondary">
            Select a consignment shipment from the left to review details.
          </Card>
        )}
      </div>

      {/* ─── Add / Edit Modal ────────────────────────────────────────────────── */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-page/80 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <Card className="max-h-[92vh] w-full max-w-5xl overflow-y-auto p-5 sm:p-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-brand-primary">
                {isEditModalOpen ? "Modify Shipment Parameters" : "Register New Consignment Shipment"}
              </h2>
              <p className="text-sm text-text-secondary">
                Record shipment identity, logistics, dispatch lines, loading checks, and responsible signatories.
              </p>
            </div>

            <form onSubmit={(event) => handleSaveConsignment(event, isEditModalOpen)} className="mt-5 space-y-6">
              {/* ── Core Shipment Info ─────────────────────────────────── */}
              <div className="space-y-3">
                <SectionDivider title="Shipment Info" />
                <label className="block max-w-xl space-y-2 text-sm">
                  <span className="text-text-secondary">Shipment Reference ID</span>
                  <Input required value={formRef} onChange={(event) => setFormRef(event.target.value)} />
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Destination Port</span>
                    <Select value={formDest} onChange={(event) => setFormDest(event.target.value)}>
                      <option value="Rotterdam, Netherlands">Rotterdam, Netherlands</option>
                      <option value="Hamburg, Germany">Hamburg, Germany</option>
                      <option value="Antwerp, Belgium">Antwerp, Belgium</option>
                      <option value="Le Havre, France">Le Havre, France</option>
                      <option value="Karachi, Pakistan">Karachi, Pakistan</option>
                    </Select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Assigned Operator Agent</span>
                    <Select value={formAgentId} onChange={(event) => setFormAgentId(event.target.value)}>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.country})
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Shipment Priority Mode</span>
                    <Select
                      value={formShipMode}
                      onChange={(event) => setFormShipMode(event.target.value as "CURRENT_EXPORT" | "FUTURE_EXPORT")}
                    >
                      <option value="CURRENT_EXPORT">CURRENT ACTIVE EXPORT</option>
                      <option value="FUTURE_EXPORT">FUTURE PLANNED EXPORT</option>
                    </Select>
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Gate Compliance Status</span>
                    <Select
                      value={formGateStatus}
                      onChange={(event) => setFormGateStatus(event.target.value as "READY" | "BLOCKED" | "REVIEW_REQUIRED")}
                    >
                      <option value="READY">READY</option>
                      <option value="REVIEW_REQUIRED">REVIEW REQUIRED</option>
                      <option value="BLOCKED">BLOCKED</option>
                    </Select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">TRACES Package Posture</span>
                    <Select
                      value={formEligibility}
                      onChange={(event) => setFormEligibility(event.target.value as "PACKAGE_READY" | "HELD" | "SCOPE_REVIEW")}
                    >
                      <option value="PACKAGE_READY">PACKAGE READY</option>
                      <option value="HELD">HELD</option>
                      <option value="SCOPE_REVIEW">SCOPE REVIEW</option>
                    </Select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Traceability Posture</span>
                    <Select
                      value={formTraceStatus}
                      onChange={(event) =>
                        setFormTraceStatus(event.target.value as "TRACEABLE" | "BLOCKED" | "REVIEW_REQUIRED")
                      }
                    >
                      <option value="TRACEABLE">TRACEABLE</option>
                      <option value="REVIEW_REQUIRED">REVIEW REQUIRED</option>
                      <option value="BLOCKED">BLOCKED</option>
                    </Select>
                  </label>
                </div>
              </div>

              {/* ── Dispatch Header ───────────────────────────────────── */}
              <div className="space-y-3">
                <SectionDivider title="Dispatch Document Header" />
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Sale Order #</span>
                    <Input value={formSaleOrder} onChange={(e) => setFormSaleOrder(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Invoice #</span>
                    <Input value={formInvoiceNo} onChange={(e) => setFormInvoiceNo(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Dispatch Date</span>
                    <Input value={formDispatchDate} placeholder="DD-MM-YYYY" onChange={(e) => setFormDispatchDate(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Customer Ref #</span>
                    <Input value={formCustomerRef} onChange={(e) => setFormCustomerRef(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">PFA #</span>
                    <Input value={formPfaNo} onChange={(e) => setFormPfaNo(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Destination Country</span>
                    <Input value={formCountry} onChange={(e) => setFormCountry(e.target.value)} />
                  </label>
                </div>
              </div>

              {/* ── Container Info ────────────────────────────────────── */}
              <div className="space-y-3">
                <SectionDivider title="Container & Logistics" />
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Container #</span>
                    <Input value={formContainerNo} onChange={(e) => setFormContainerNo(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Container Size</span>
                    <Select value={formContainerSize} onChange={(e) => setFormContainerSize(e.target.value)}>
                      <option value="20ft">20ft</option>
                      <option value="40ft">40ft</option>
                      <option value="40ft HC">40ft HC</option>
                    </Select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">CBM</span>
                    <Input type="number" value={formCbm} onChange={(e) => setFormCbm(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Weight Limit (kg)</span>
                    <Input type="number" value={formWeightLimit} onChange={(e) => setFormWeightLimit(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Seal #</span>
                    <Input value={formSealNo} onChange={(e) => setFormSealNo(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Truck #</span>
                    <Input value={formTruckNo} onChange={(e) => setFormTruckNo(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Master Case Color</span>
                    <Input value={formMasterCase} onChange={(e) => setFormMasterCase(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Logo on Carton</span>
                    <Input value={formLogo} onChange={(e) => setFormLogo(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Tape on Carton</span>
                    <Input value={formTape} onChange={(e) => setFormTape(e.target.value)} />
                  </label>
                </div>
              </div>

              {/* ── Condition Checks ──────────────────────────────────── */}
              <div className="space-y-3">
                <SectionDivider title="Condition Checks & Loading" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-3 text-sm text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formCleaned}
                      onChange={(e) => setFormCleaned(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span>Cleaned Before Loading</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formFitForLoading}
                      onChange={(e) => setFormFitForLoading(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span>Fit for Loading</span>
                  </label>
                </div>
                {!formFitForLoading && (
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Not Fit Reason</span>
                    <Input value={formNotFitReason} onChange={(e) => setFormNotFitReason(e.target.value)} />
                  </label>
                )}
                <label className="space-y-2 text-sm">
                  <span className="text-text-secondary">Special Remarks</span>
                  <Input value={formSpecialRemarks} onChange={(e) => setFormSpecialRemarks(e.target.value)} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Place of Loading</span>
                    <Input value={formPlaceOfLoading} onChange={(e) => setFormPlaceOfLoading(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Loading Time</span>
                    <Input value={formLoadingTime} placeholder="HH:MM:SS" onChange={(e) => setFormLoadingTime(e.target.value)} />
                  </label>
                </div>
              </div>

              {/* ── Dispatch Lines Builder ────────────────────────────── */}
              <Card variant="inset" className="space-y-4 p-4">
                <SectionDivider title="Product Line Items" />
                {formDispatchLines.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-border-soft">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-bg-surface-alt border-b border-border-soft">
                          <th className="px-2 py-2 text-left font-semibold text-text-secondary">Code</th>
                          <th className="px-2 py-2 text-left font-semibold text-text-secondary">Product</th>
                          <th className="px-2 py-2 text-left font-semibold text-text-secondary">Lot #</th>
                          <th className="px-2 py-2 text-right font-semibold text-text-secondary">Ctns</th>
                          <th className="px-2 py-2 text-right font-semibold text-text-secondary">Gross (kg)</th>
                          <th className="px-2 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {formDispatchLines.map((line) => (
                          <tr key={line.sr} className="border-t border-border-soft">
                            <td className="px-2 py-2 font-mono text-brand-primary font-bold">{line.finalCode}</td>
                            <td className="px-2 py-2">{line.productName}</td>
                            <td className="px-2 py-2">
                              <LotBadge lot={line.lotNo} />
                            </td>
                            <td className="px-2 py-2 text-right">{line.totalCartons}</td>
                            <td className="px-2 py-2 text-right text-teal-700 font-mono">{line.totalGrossWtKg}</td>
                            <td className="px-2 py-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="danger"
                                onClick={() => handleRemoveDispatchLine(line.sr)}
                              >
                                ✕
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Line Entry Row */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="space-y-1 text-xs">
                    <span className="text-text-secondary">Final Code *</span>
                    <Input value={formLineFinalCode} onChange={(e) => setFormLineFinalCode(e.target.value)} />
                  </label>
                  <label className="space-y-1 text-xs lg:col-span-2">
                    <span className="text-text-secondary">Product Name *</span>
                    <Input value={formLineProductName} onChange={(e) => setFormLineProductName(e.target.value)} />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="text-text-secondary">Packing</span>
                    <Input value={formLinePacking} placeholder="15gx24pcsx12box" onChange={(e) => setFormLinePacking(e.target.value)} />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="text-text-secondary">Section</span>
                    <Input value={formLineSection} onChange={(e) => setFormLineSection(e.target.value)} />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="text-text-secondary">Total Cartons</span>
                    <Input type="number" value={formLineTotalCtns} onChange={(e) => setFormLineTotalCtns(e.target.value)} />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="text-text-secondary">Dips Cartons</span>
                    <Input type="number" value={formLineDipsCtns} onChange={(e) => setFormLineDipsCtns(e.target.value)} />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="text-text-secondary">Lot #</span>
                    <Input value={formLineLotNo} placeholder="PENDING" onChange={(e) => setFormLineLotNo(e.target.value)} />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="text-text-secondary">Mfg Date</span>
                    <Input value={formLineMfgDate} placeholder="DD-MM-YYYY" onChange={(e) => setFormLineMfgDate(e.target.value)} />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="text-text-secondary">Exp Date</span>
                    <Input value={formLineExpDate} placeholder="DD-MM-YYYY" onChange={(e) => setFormLineExpDate(e.target.value)} />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="text-text-secondary">Gross Wt/Ctn (kg)</span>
                    <Input type="number" step="0.01" value={formLineGrossWt} onChange={(e) => setFormLineGrossWt(e.target.value)} />
                  </label>
                </div>
                <Button type="button" size="sm" onClick={handleAddDispatchLine}>
                  + Add Product Line
                </Button>
              </Card>

              {/* ── Signatories ───────────────────────────────────────── */}
              <div className="space-y-3">
                <SectionDivider title="Signatories" />
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Checked by (Export)</span>
                    <Input value={formCheckedByExport} onChange={(e) => setFormCheckedByExport(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Quality Inspector</span>
                    <Input value={formQualityInspector} onChange={(e) => setFormQualityInspector(e.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Count By</span>
                    <Input value={formCountBy} onChange={(e) => setFormCountBy(e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit">{isEditModalOpen ? "Save Changes" : "Create Shipment"}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ─── Product Line Add / Edit Modal ────────────────────────────────────── */}
      {isProductModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-bg-page/80 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsProductModalOpen(false);
          }}
        >
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5 sm:p-6 border-border-strong/40 bg-gradient-to-b from-bg-surface to-bg-surface-alt shadow-card">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-brand-primary">
                {editingProductLine ? "Modify Product Line Item" : "Add Product Line Item"}
              </h2>
              <p className="text-xs text-text-secondary">
                Configure details, quantities, and traceability codes for this shipment line.
              </p>
            </div>

            <form onSubmit={handleSaveProductLine} className="mt-5 space-y-5">
              <div className="space-y-3">
                <SectionDivider title="Product Details" />
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm block">
                    <span className="text-text-secondary font-medium">Product Name *</span>
                    <Input required value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Buster Tangy Candy Mix" />
                  </label>
                  <label className="space-y-2 text-sm block">
                    <span className="text-text-secondary font-medium">Final Code *</span>
                    <Input required value={productFinalCode} onChange={(e) => setProductFinalCode(e.target.value)} placeholder="e.g. 3147" />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm block">
                    <span className="text-text-secondary font-medium">Packing Description</span>
                    <Input value={productPacking} onChange={(e) => setProductPacking(e.target.value)} placeholder="e.g. 15gx24pcsx12box" />
                  </label>
                  <label className="space-y-2 text-sm block">
                    <span className="text-text-secondary font-medium">Production Section</span>
                    <Input value={productSection} onChange={(e) => setProductSection(e.target.value)} placeholder="e.g. Estate-3" />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <SectionDivider title="Quantities & Lot #" />
                
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-2 text-sm block">
                    <span className="text-text-secondary font-medium">Total Cartons *</span>
                    <Input type="number" required value={productTotalCartons} onChange={(e) => setProductTotalCartons(e.target.value)} placeholder="0" />
                  </label>
                  <label className="space-y-2 text-sm block">
                    <span className="text-text-secondary font-medium">Dips Cartons</span>
                    <Input type="number" value={productDipsCartons} onChange={(e) => setProductDipsCartons(e.target.value)} placeholder="0" />
                  </label>
                  <label className="space-y-2 text-sm block">
                    <span className="text-text-secondary font-medium">Lot Number</span>
                    <Input value={productLotNo} onChange={(e) => setProductLotNo(e.target.value)} placeholder="PENDING" />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <SectionDivider title="Dates & Weight" />
                
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-2 text-sm block">
                    <span className="text-text-secondary font-medium">Mfg Date</span>
                    <Input value={productMfgDate} onChange={(e) => setProductMfgDate(e.target.value)} placeholder="DD-MM-YYYY" />
                  </label>
                  <label className="space-y-2 text-sm block">
                    <span className="text-text-secondary font-medium">Exp Date</span>
                    <Input value={productExpDate} onChange={(e) => setProductExpDate(e.target.value)} placeholder="DD-MM-YYYY" />
                  </label>
                  <label className="space-y-2 text-sm block">
                    <span className="text-text-secondary font-medium">Gross Wt/Ctn (kg)</span>
                    <Input type="number" step="0.01" value={productGrossWt} onChange={(e) => setProductGrossWt(e.target.value)} placeholder="0.00" />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border-soft pt-4 mt-6">
                <Button type="button" variant="secondary" onClick={() => setIsProductModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProductLine ? "Save Changes" : "Save"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
