"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, RotateCcw, Trash2, FileEdit, Upload, Calendar, User, FileText } from "lucide-react";
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
}

interface ProductDossierVM {
  activeBomRevision: string;
  revisionCount: number;
}

interface IngredientEvidenceSummaryVM {
  total: number;
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

interface RevisionDetail {
  code: string;
  date: string;
  author: string;
  description: string;
  status: "Active" | "Superseded" | "Draft";
  ingredients: Array<{
    name: string;
    hsCode: string;
    percentage: string;
    supplierName: string;
    cocModel: string;
    certifications: string;
  }>;
}

const getRevisionDetails = (product: ProductRecord, revisionCode: string): RevisionDetail => {
  const cleanCode = revisionCode.replace(" active", "").trim();
  const isActive = revisionCode.toLowerCase().includes("active") || cleanCode === product.activeBomRevision;

  const mockDb: Record<string, Record<string, Partial<RevisionDetail>>> = {
    "prd-chew": {
      "BOM-CHW-2025-R1": {
        date: "2025-11-12",
        author: "Sarah Jenkins (Compliance Lead)",
        description: "Initial baseline BOM formulation uploaded during product onboarding. Features standard composition weights.",
        status: "Superseded",
        ingredients: [
          { name: "Liquid Glucose (Corn Syrup)", hsCode: "170230", percentage: "55.00%", supplierName: "Rafhan Maize Products", cocModel: "IP", certifications: "Not Applicable" },
          { name: "Sugar", hsCode: "170199", percentage: "32.35%", supplierName: "Layyah Sugar Mills", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Non Hydrogenated Vegetable Fat (Palm)", hsCode: "151329", percentage: "3.50%", supplierName: "Cargill", cocModel: "SG", certifications: "BVC-RSPO-MY008900" },
          { name: "Maize Starch", hsCode: "110812", percentage: "3.50%", supplierName: "Rafhan Maize Products", cocModel: "IP", certifications: "Not Applicable" },
          { name: "Acidity Regulator (Citric Acid)", hsCode: "291814", percentage: "2.20%", supplierName: "N A Enterprises", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Gum Arabic (E414)", hsCode: "130120", percentage: "0.15%", supplierName: "N A Enterprises", cocModel: "IP", certifications: "Not Applicable" },
          { name: "Artificial Flavours", hsCode: "330210", percentage: "0.30%", supplierName: "Takasago Int. Pakistan", cocModel: "SG", certifications: "Not Applicable" },
        ]
      },
      "BOM-CHW-2026-R2": {
        date: "2026-02-15",
        author: "Marcus Vance (Supply Chain Coordinator)",
        description: "Updated formulation to swap the glucose supplier and adjust active composition ratios. Added certifications for corn derivatives.",
        status: "Superseded",
        ingredients: [
          { name: "Liquid Glucose (Corn Syrup)", hsCode: "170230", percentage: "54.00%", supplierName: "Rafhan Maize Products", cocModel: "IP", certifications: "Not Applicable" },
          { name: "Sugar", hsCode: "170199", percentage: "32.35%", supplierName: "Layyah Sugar Mills", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Non Hydrogenated Vegetable Fat (Palm)", hsCode: "151329", percentage: "3.25%", supplierName: "Cargill", cocModel: "SG", certifications: "BVC-RSPO-MY008900" },
          { name: "Maize Starch", hsCode: "110812", percentage: "3.20%", supplierName: "Rafhan Maize Products", cocModel: "IP", certifications: "Not Applicable" },
          { name: "Acidity Regulator (Citric Acid)", hsCode: "291814", percentage: "2.20%", supplierName: "N A Enterprises", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Gum Arabic (E414)", hsCode: "130120", percentage: "0.10%", supplierName: "N A Enterprises", cocModel: "IP", certifications: "Not Applicable" },
          { name: "Soy Lecithin (E322)", hsCode: "292320", percentage: "0.01%", supplierName: "N A Enterprises", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Artificial Flavours", hsCode: "330210", percentage: "0.31%", supplierName: "Takasago Int. Pakistan", cocModel: "SG", certifications: "Not Applicable" },
        ]
      }
    },
    "prd-bubble-gum": {
      "BOM-BBL-2026-R1": {
        date: "2026-01-20",
        author: "Sarah Jenkins (Compliance Lead)",
        description: "Baseline BOM formulation. Verified free of Annex I EUDR commodities.",
        status: "Active",
      }
    },
    "prd-hard-candy": {
      "BOM-HBC-2025-R1": {
        date: "2025-10-05",
        author: "Sarah Jenkins (Compliance Lead)",
        description: "Initial formulation import. Maize starch and sugar links unverified. Basic composition test.",
        status: "Superseded",
        ingredients: [
          { name: "Liquid Glucose (Corn Syrup)", hsCode: "170230", percentage: "40.00%", supplierName: "Rafhan Maize Products", cocModel: "IP", certifications: "Not Applicable" },
          { name: "Sugar", hsCode: "170199", percentage: "48.00%", supplierName: "Layyah Sugar Mills", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Acidity Regulator (Citric Acid)", hsCode: "291814", percentage: "7.60%", supplierName: "N A Enterprises", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Dextrose (Glucose Powder)", hsCode: "170230", percentage: "4.40%", supplierName: "Rafhan Maize Products", cocModel: "IP", certifications: "Not Applicable" },
        ]
      }
    },
    "prd-chocolate": {
      "BOM-CHO-2025-R2": {
        date: "2025-09-18",
        author: "Sarah Jenkins (Compliance Lead)",
        description: "Historical formulation import prior to EUDR vendor onboarding. Cocoa sources unassessed.",
        status: "Superseded",
        ingredients: [
          { name: "Sugar", hsCode: "170199", percentage: "60.00%", supplierName: "Layyah Sugar Mills", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Vegetable Fat", hsCode: "151329", percentage: "25.00%", supplierName: "Cargill", cocModel: "SG", certifications: "BVC-RSPO-MY008900" },
          { name: "Wheat Flour", hsCode: "110100", percentage: "7.70%", supplierName: "Manzoor & Brothers", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Natural cocoa powder", hsCode: "180500", percentage: "6.30%", supplierName: "JB Cocoa SDN BHD Malaysia", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Milk Powder", hsCode: "040210", percentage: "1.00%", supplierName: "Mubashar Traders", cocModel: "SG", certifications: "Not Applicable" },
        ]
      },
      "BOM-CHO-2026-R3": {
        date: "2026-01-10",
        author: "Marcus Vance (Supply Chain Coordinator)",
        description: "Updated to introduce alkalized cocoa powder and refine ingredient weights. Initiated EUDR audit phase.",
        status: "Superseded",
        ingredients: [
          { name: "Sugar", hsCode: "170199", percentage: "59.30%", supplierName: "Layyah Sugar Mills", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Vegetable Fat", hsCode: "151329", percentage: "24.20%", supplierName: "Cargill", cocModel: "SG", certifications: "BVC-RSPO-MY008900" },
          { name: "Wheat Flour", hsCode: "110100", percentage: "7.70%", supplierName: "Manzoor & Brothers", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Natural cocoa powder", hsCode: "180500", percentage: "6.00%", supplierName: "JB Cocoa SDN BHD Malaysia", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Alkalized cocoa powder", hsCode: "180500", percentage: "2.00%", supplierName: "N A Enterprises", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Milk Powder", hsCode: "040210", percentage: "0.80%", supplierName: "Mubashar Traders", cocModel: "SG", certifications: "Not Applicable" },
        ]
      }
    },
    "prd-wafers": {
      "BOM-WAF-2026-R1": {
        date: "2026-02-05",
        author: "Sarah Jenkins (Compliance Lead)",
        description: "Initial baseline for wafers onboarding. Standard formulation weights.",
        status: "Superseded",
        ingredients: [
          { name: "Sugar", hsCode: "170199", percentage: "17.00%", supplierName: "Layyah Sugar Mills", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Vegetable fat", hsCode: "151329", percentage: "19.00%", supplierName: "Cargill", cocModel: "SG", certifications: "BVC-RSPO-MY008900" },
          { name: "Wheat Flour", hsCode: "110100", percentage: "63.50%", supplierName: "Manzoor & Brothers", cocModel: "SG", certifications: "Not Applicable" },
          { name: "Salt", hsCode: "250100", percentage: "0.50%", supplierName: "Agrotech (Pvt) Ltd", cocModel: "SG", certifications: "Not Applicable" },
        ]
      }
    }
  };

  const defaultIngredients = product.ingredients.map(ing => ({
    name: ing.name,
    hsCode: ing.hsCode,
    percentage: ing.percentage,
    supplierName: ing.supplierName || "No supplier linkage",
    cocModel: ing.cocModel || "Not Applicable",
    certifications: ing.certifications || "Not Applicable",
  }));

  const fallbackDetails: RevisionDetail = {
    code: cleanCode,
    date: isActive ? "2026-05-10" : "2025-08-20",
    author: isActive ? "Marcus Vance (Supply Chain Coordinator)" : "Sarah Jenkins (Compliance Lead)",
    description: isActive
      ? "Current active production BOM formulation. Verified supplier connections and compliance attributes."
      : "Historical BOM revision formulation archived for compliance record-keeping.",
    status: isActive ? "Active" : "Superseded",
    ingredients: defaultIngredients,
  };

  if (isActive) {
    const productMocks = mockDb[product.id];
    const specActive = productMocks?.[cleanCode] || {};
    return {
      ...fallbackDetails,
      ...specActive,
      code: cleanCode,
      status: "Active",
      ingredients: defaultIngredients,
    };
  }

  const productMocks = mockDb[product.id];
  if (productMocks && productMocks[cleanCode]) {
    return {
      ...fallbackDetails,
      ...productMocks[cleanCode],
      code: cleanCode,
    };
  }

  return fallbackDetails;
};

export default function ProductsPage() {
  const {
    products: currentProducts,
    suppliers: currentSuppliers,
    addProduct,
    editProduct,
    supplyChainNodes,
    eudrFormRequests,
    generateEudrFormRequest,
    scenarioId,
  } = useSession();

  const [selectedProductId, setSelectedProductId] = useState("");
  const [appealStatus, setAppealStatus] = useState<string | null>(null);

  const [isComplianceDrawerOpen, setIsComplianceDrawerOpen] = useState(false);
  const [complianceDrawerIngredient, setComplianceDrawerIngredient] = useState<IngredientRecord | null>(null);
  const [complianceDrawerInitialTab, setComplianceDrawerInitialTab] = useState<"traceability" | "plots" | "deforestation" | "documents">("traceability");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // BOM Revision Details Modal state
  const [selectedRevision, setSelectedRevision] = useState<string | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);

  // BOM Ingredient CRUD Modals state
  const [isAddIngredientModalOpen, setIsAddIngredientModalOpen] = useState(false);
  const [isEditIngredientModalOpen, setIsEditIngredientModalOpen] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);

  // Upload certification modal states
  const [isUploadCertModalOpen, setIsUploadCertModalOpen] = useState(false);
  const [certIngredientId, setCertIngredientId] = useState<string | null>(null);
  const [certForm, setCertForm] = useState({
    certifications: "",
    certificationsExpiry: "",
    fileName: "",
    documentType: "Certificates & Declarations",
  });

  const [ingredientForm, setIngredientForm] = useState({
    name: "",
    hsCode: "",
    percentage: "0%",
    scientificName: "",
    cocModel: "Not Applicable",
    supplierId: "",
    certifications: "Not Applicable",
    commodity: "NONE" as any,
    relevance: "IN_SCOPE" as any,
    readiness: "READY" as any,
    evidenceStatus: "COMPLETE" as any,
    blockingReason: "",
  });

  const [formName, setFormName] = useState("");
  const [formHs, setFormHs] = useState("");
  const [formMarkets, setFormMarkets] = useState("EU, Pakistan");
  const [formVolume, setFormVolume] = useState("1,200 tons");
  const [formRevision, setFormRevision] = useState("REV-2026-01");
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

  const activeProductId = selectedProductId || currentProducts[0]?.id || "";
  const selectedProduct = currentProducts.find((product) => product.id === activeProductId) ?? currentProducts[0];

  const activeRevisionDetails = useMemo(() => {
    return selectedRevision && selectedProduct
      ? getRevisionDetails(selectedProduct, selectedRevision)
      : null;
  }, [selectedRevision, selectedProduct]);

  const evidenceSummaryVm: IngredientEvidenceSummaryVM = useMemo(() => ({
    total: selectedProduct?.ingredients.length ?? 0,
  }), [selectedProduct]);

  const decisionHeaderVm: ProductDecisionHeaderVM | null = useMemo(() => {
    if (!selectedProduct) return null;
    return {
      name: selectedProduct.name,
      hsCode: selectedProduct.finishedHsCode,
    };
  }, [selectedProduct]);

  const dossierVm: ProductDossierVM | null = useMemo(() => {
    if (!selectedProduct) return null;
    return {
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

  const handleResetToBaseline = () => {
    if (typeof window !== "undefined") {
      const keysToClear = [
        `gfi_custom_suppliers_${scenarioId}`,
        `gfi_custom_products_${scenarioId}`,
        `gfi_custom_consignments_${scenarioId}`,
        `gfi_custom_agents_${scenarioId}`,
        `gfi_custom_documents_${scenarioId}`,
        `gfi_custom_concerns_${scenarioId}`,
        `gfi_custom_receipts_${scenarioId}`,
        `gfi_custom_supply_chain_nodes_${scenarioId}`,
        `gfi_custom_eudr_form_requests_${scenarioId}`,
        `gfi_custom_supply_chain_edges_${scenarioId}`,
        `gfi_custom_intermediary_submissions_${scenarioId}`,
        `gfi_custom_farmer_submissions_${scenarioId}`,
        `gfi_custom_eudr_evidence_${scenarioId}`,
        `gfi_custom_plots_${scenarioId}`,
        `gfi_custom_deforestation_cases_${scenarioId}`,
      ];
      keysToClear.forEach((key) => localStorage.removeItem(key));
      window.location.reload();
    }
  };

  const handleDeleteIngredient = (ingredientId: string) => {
    if (!selectedProduct) return;
    const updatedIngredients = selectedProduct.ingredients.filter((ing) => ing.id !== ingredientId);
    const updatedScope = deriveScopeFromIngredients(updatedIngredients, selectedProduct.scopeStatus);
    const updatedReadiness = deriveReadinessFromIngredients(updatedIngredients, selectedProduct.exportReadiness);
    editProduct({
      ...selectedProduct,
      ingredients: updatedIngredients,
      scopeStatus: updatedScope,
      exportReadiness: updatedReadiness,
    });
  };

  const handleOpenAddIngredient = () => {
    setIngredientForm({
      name: "",
      hsCode: "",
      percentage: "0%",
      scientificName: "",
      cocModel: "Not Applicable",
      supplierId: "",
      certifications: "Not Applicable",
      commodity: "NONE",
      relevance: "IN_SCOPE",
      readiness: "READY",
      evidenceStatus: "COMPLETE",
      blockingReason: "",
    });
    setIsAddIngredientModalOpen(true);
  };

  const handleOpenEditIngredient = (ingredient: IngredientRecord) => {
    setEditingIngredientId(ingredient.id);
    setIngredientForm({
      name: ingredient.name,
      hsCode: ingredient.hsCode,
      percentage: ingredient.percentage,
      scientificName: ingredient.scientificName || "",
      cocModel: ingredient.cocModel || "Not Applicable",
      supplierId: ingredient.supplierIds?.[0] || "",
      certifications: ingredient.certifications || "Not Applicable",
      commodity: ingredient.commodity || "NONE",
      relevance: ingredient.relevance || "IN_SCOPE",
      readiness: ingredient.readiness || "READY",
      evidenceStatus: ingredient.evidenceStatus || "COMPLETE",
      blockingReason: ingredient.blockingReason || "",
    });
    setIsEditIngredientModalOpen(true);
  };
  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !ingredientForm.name.trim()) return;

    const supplier = currentSuppliers.find((s) => s.id === ingredientForm.supplierId);
    const supplierName = supplier ? supplier.name : (ingredientForm.supplierId ? "Unknown Supplier" : "No supplier linkage");

    const originalIngredient = editingIngredientId
      ? selectedProduct.ingredients.find((ing) => ing.id === editingIngredientId)
      : null;

    const ingredientData: IngredientRecord = {
      id: editingIngredientId || `ing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: ingredientForm.name,
      hsCode: ingredientForm.hsCode || "Unknown",
      percentage: ingredientForm.percentage || "0%",
      scientificName: ingredientForm.scientificName || "Not Applicable",
      cocModel: ingredientForm.cocModel || "Not Applicable",
      supplierIds: ingredientForm.supplierId ? [ingredientForm.supplierId] : [],
      supplierName: supplierName,
      certifications: ingredientForm.certifications || "Not Applicable",
      documentType: originalIngredient?.documentType,
      commodity: originalIngredient ? originalIngredient.commodity : "NONE",
      relevance: originalIngredient ? originalIngredient.relevance : "IN_SCOPE",
      readiness: originalIngredient ? originalIngredient.readiness : "READY",
      evidenceStatus: originalIngredient ? originalIngredient.evidenceStatus : "COMPLETE",
      blockingReason: originalIngredient ? originalIngredient.blockingReason : "",
      supplyChainStatus: originalIngredient
        ? (originalIngredient.supplyChainStatus || "NOT_REQUESTED")
        : "NOT_REQUESTED",
      originCountries: originalIngredient?.originCountries ?? (supplier ? [supplier.country] : []),
      primaryOriginCountry: originalIngredient?.primaryOriginCountry ?? supplier?.country ?? "",
      euRiskTier: originalIngredient?.euRiskTier ?? "UNKNOWN",
      dueDiligenceMode: originalIngredient?.dueDiligenceMode ?? "STANDARD",
      legalityDossierStatus: originalIngredient?.legalityDossierStatus ?? "MISSING",
      ddsStatus: originalIngredient?.ddsStatus ?? "DRAFT",
    };

    let updatedIngredients = [...selectedProduct.ingredients];
    if (editingIngredientId) {
      updatedIngredients = updatedIngredients.map((ing) =>
        ing.id === editingIngredientId ? ingredientData : ing
      );
      setIsEditIngredientModalOpen(false);
    } else {
      updatedIngredients.push(ingredientData);
      setIsAddIngredientModalOpen(false);
    }

    const updatedScope = deriveScopeFromIngredients(updatedIngredients, selectedProduct.scopeStatus);
    const updatedReadiness = deriveReadinessFromIngredients(updatedIngredients, selectedProduct.exportReadiness);

    editProduct({
      ...selectedProduct,
      ingredients: updatedIngredients,
      scopeStatus: updatedScope,
      exportReadiness: updatedReadiness,
    });

    setEditingIngredientId(null);
  };

  const handleOpenUploadCert = (ingredient: IngredientRecord) => {
    setCertIngredientId(ingredient.id);
    setCertForm({
      certifications: ingredient.certifications && ingredient.certifications !== "Not Applicable" ? ingredient.certifications : "",
      certificationsExpiry: ingredient.certificationsExpiry || "",
      fileName: "",
      documentType: ingredient.documentType || "Certificates & Declarations",
    });
    setIsUploadCertModalOpen(true);
  };

  const handleSaveUploadCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !certIngredientId) return;

    const updatedIngredients = selectedProduct.ingredients.map((ing) => {
      if (ing.id === certIngredientId) {
        return {
          ...ing,
          certifications: certForm.certifications || "Not Applicable",
          certificationsExpiry: certForm.certificationsExpiry || undefined,
          documentType: certForm.certifications ? certForm.documentType : undefined,
        };
      }
      return ing;
    });

    const updatedScope = deriveScopeFromIngredients(updatedIngredients, selectedProduct.scopeStatus);
    const updatedReadiness = deriveReadinessFromIngredients(updatedIngredients, selectedProduct.exportReadiness);

    editProduct({
      ...selectedProduct,
      ingredients: updatedIngredients,
      scopeStatus: updatedScope,
      exportReadiness: updatedReadiness,
    });

    setIsUploadCertModalOpen(false);
    setCertIngredientId(null);
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
    setFormRevision("REV-2026-01");
    setFormIngredients([]);
    clearIngSubform();
  };

  const handleAddIngredient = () => {
    if (!ingName.trim()) return;
    const supplier = currentSuppliers.find((item) => item.id === ingSupplier);
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
      scientificName: "Not Applicable",
      cocModel: "Not Applicable",
      supplierName: supplier?.name || "No supplier linkage",
      certifications: "Not Applicable",
      originCountries: supplier ? [supplier.country] : [],
      primaryOriginCountry: supplier?.country ?? "",
      euRiskTier: "UNKNOWN",
      dueDiligenceMode: "STANDARD",
      legalityDossierStatus: "MISSING",
      ddsStatus: "DRAFT",
    };
    setFormIngredients((prev) => [...prev, newIng]);
    clearIngSubform();
  };

  const handleRemoveIngredient = (id: string) => {
    setFormIngredients((prev) => prev.filter((ingredient) => ingredient.id !== id));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formHs.trim()) return;

    const productData: ProductRecord = {
      id: `prd-${Date.now()}`,
      name: formName,
      finishedHsCode: formHs,
      primaryMarkets: formMarkets.split(",").map((market) => market.trim()).filter(Boolean),
      annualVolume: formVolume,
      scopeStatus: deriveScopeFromIngredients(formIngredients, "IN_SCOPE"),
      exportReadiness: deriveReadinessFromIngredients(formIngredients, "REVIEW_REQUIRED"),
      activeBomRevision: formRevision,
      operatorFlow: "COMPLIANCE_PACKAGE",
      summary: `Simulated finished compound representing ${formName}.`,
      blockingGaps: [],
      bomHistory: [formRevision],
      ingredients: formIngredients,
    };

    addProduct(productData);
    setSelectedProductId(productData.id);
    setIsAddModalOpen(false);
    resetForm();
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <SectionHeader
        title="Product and BOM Management"
        description="Manage product scope, BOM revisions, ingredient evidence, supplier dependencies, and export readiness."
        actions={
          <div className="flex items-center gap-2">

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
              <p className="text-xs text-text-secondary">Select a product to review traceability and BOM posture</p>
            </div>
            <Tag tone="neutral">{currentProducts.length}</Tag>
          </div>
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
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
                    "relative group w-full rounded-lg border pl-4 pr-3 py-2.5 text-left transition-all duration-200 ease-emphasized overflow-hidden",
                    active
                      ? "border-brand-primary bg-brand-accent-soft/40 shadow-sm"
                      : "border-border-soft bg-bg-surface hover:-translate-y-0.5 hover:border-border-strong hover:bg-bg-surface-alt hover:shadow-card",
                  ].join(" ")}
                >
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary rounded-l-lg" />
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <strong className="block truncate text-sm font-bold text-brand-primary transition-colors group-hover:text-brand-primary-dark">
                      {product.name}
                    </strong>
                    <span className="text-[10px] font-semibold text-text-muted shrink-0">
                      {product.ingredients.length} items
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-bg-page/55 border border-border-soft px-1.5 py-0.5 text-[10px] font-bold text-text-secondary">
                      HS {product.finishedHsCode}
                    </span>
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${product.exportReadiness === "READY"
                      ? "bg-state-success/15 border-state-success/20 text-state-success"
                      : "bg-state-warning/15 border-state-warning/20 text-state-warning"
                      }`}>
                      {product.exportReadiness === "READY" ? "Ready" : "Review"}
                    </span>
                  </div>
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
              <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft pb-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2.5">
                      <h2 className="text-xl font-extrabold text-brand-primary">{decisionHeaderVm.name}</h2>
                      <span className="rounded bg-bg-page/80 border border-border-soft px-2 py-0.5 text-xs font-bold text-brand-primary">
                        HS {decisionHeaderVm.hsCode}
                      </span>
                    </div>
                  </div>
                </div>

              </Card>
            ) : null}

            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft pb-2">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-brand-primary">Product BOM</h3>
                  <Tag tone="neutral">Total {evidenceSummaryVm.total}</Tag>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                  onClick={handleOpenAddIngredient}
                >
                  Add Ingredient
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={ingredientSearch}
                  onChange={(event) => setIngredientSearch(event.target.value)}
                  placeholder="Search ingredient, HS, commodity, or relevance"
                  className="min-w-[220px] flex-1"
                />
              </div>
              <TableRoot className="max-h-[640px] overflow-auto">
                <Table className="text-xs">
                  <TableHead>
                    <tr>
                      <TableHeaderCell density={densityValue} className="sticky left-0 top-0 z-20 bg-bg-surface-alt">Ingredient</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt">HS</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt">Composition</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt">Scientific Name</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt">Chain of Custody model</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt">Supplier name</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt">Certifications</TableHeaderCell>
                      <TableHeaderCell density={densityValue} className="sticky top-0 z-10 bg-bg-surface-alt text-center">Actions</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {visibleIngredients.length === 0 ? (
                      <TableRow>
                        <TableCell density={densityValue} className="text-center text-text-secondary" colSpan={8}>
                          No ingredients match the current filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleIngredients.map((ingredient) => {
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
                              <strong className="block text-brand-primary leading-6">{ingredient.name}</strong>
                            </TableCell>
                            <TableCell density={densityValue} className="align-top">
                              <span className="block leading-6">{ingredient.hsCode}</span>
                            </TableCell>
                            <TableCell density={densityValue} className="align-top font-semibold text-text-primary">
                              <span className="block leading-6">{ingredient.percentage}</span>
                            </TableCell>
                            <TableCell density={densityValue} className="align-top italic text-text-secondary">
                              <span className="block leading-6">{ingredient.scientificName ?? "Not Applicable"}</span>
                            </TableCell>
                            <TableCell density={densityValue} className="align-top font-bold text-brand-primary">
                              <span className="block leading-6">{ingredient.cocModel ?? "Not Applicable"}</span>
                            </TableCell>
                            <TableCell density={densityValue} className="align-top text-xs text-text-primary">
                              <span className="block leading-6 font-semibold">{ingredient.supplierName ?? "No supplier linkage"}</span>
                            </TableCell>
                            <TableCell density={densityValue} className="align-top">
                              {ingredient.certifications && ingredient.certifications !== "Not Applicable" ? (
                                <div className="space-y-1">
                                  {ingredient.documentType && (
                                    <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider leading-tight">
                                      {ingredient.documentType}
                                    </span>
                                  )}
                                  <Tag tone="brand" className="mt-0.5">{ingredient.certifications}</Tag>
                                  {ingredient.certificationsExpiry && (
                                    <span className="block text-[10px] text-text-secondary font-semibold">
                                      Exp: {ingredient.certificationsExpiry}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="block leading-6 text-text-muted">Not Applicable</span>
                              )}
                            </TableCell>
                            <TableCell density={densityValue} className="align-top text-center">
                              <div className="flex items-center justify-center gap-1.5" onClick={(event) => event.stopPropagation()}>
                                <button
                                  type="button"
                                  title="Edit Ingredient"
                                  onClick={() => handleOpenEditIngredient(ingredient)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-soft bg-bg-surface text-brand-primary/80 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-primary/30 hover:bg-brand-accent-soft/40 hover:text-brand-primary hover:shadow-sm"
                                >
                                  <FileEdit className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  title="Upload Documentation"
                                  onClick={() => handleOpenUploadCert(ingredient)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-soft bg-bg-surface text-brand-primary/80 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-primary/30 hover:bg-brand-accent-soft/40 hover:text-brand-primary hover:shadow-sm"
                                >
                                  <Upload className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  title="Delete Ingredient"
                                  onClick={() => handleDeleteIngredient(ingredient.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-soft bg-bg-surface text-state-danger/70 transition-all duration-150 hover:-translate-y-0.5 hover:border-state-danger/30 hover:bg-state-danger/10 hover:text-state-danger hover:shadow-sm"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableRoot>

            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-soft pb-2">
                <h3 className="text-lg font-bold text-brand-primary flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-primary" />
                  BOM Revision History
                </h3>
                <Tag tone="neutral">{selectedProduct.bomHistory.length} Revisions</Tag>
              </div>
              <TableRoot>
                <Table className="text-xs">
                  <TableHead>
                    <tr>
                      <TableHeaderCell density="compact">Revision Code</TableHeaderCell>
                      <TableHeaderCell density="compact">Creation Date</TableHeaderCell>
                      <TableHeaderCell density="compact">Author</TableHeaderCell>
                      <TableHeaderCell density="compact">Status</TableHeaderCell>
                      <TableHeaderCell density="compact" className="text-right">Action</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {selectedProduct.bomHistory.map((revisionCode) => {
                      const details = getRevisionDetails(selectedProduct, revisionCode);
                      return (
                        <TableRow
                          key={revisionCode}
                          className="cursor-pointer transition-all duration-150 hover:bg-brand-accent-soft/20"
                          onClick={() => {
                            setSelectedRevision(revisionCode);
                            setIsRevisionModalOpen(true);
                          }}
                        >
                          <TableCell density="compact" className="font-bold text-brand-primary">
                            {details.code}
                          </TableCell>
                          <TableCell density="compact" className="text-text-secondary">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-text-muted" />
                              {details.date}
                            </span>
                          </TableCell>
                          <TableCell density="compact" className="font-medium text-text-primary">
                            <span className="flex items-center gap-1.5">
                              <User className="h-3 w-3 text-text-muted" />
                              {details.author}
                            </span>
                          </TableCell>
                          <TableCell density="compact">
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${details.status === "Active"
                              ? "bg-state-success/15 border-state-success/20 text-state-success"
                              : "bg-text-secondary/15 border-border-soft text-text-secondary"
                              }`}>
                              {details.status}
                            </span>
                          </TableCell>
                          <TableCell density="compact" className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedRevision(revisionCode);
                                setIsRevisionModalOpen(true);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableRoot>
            </Card>

          </div>
        ) : null}
      </div>

      {isAddModalOpen ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsAddModalOpen(false);
              resetForm();
            }
          }}
        >
          <Card className="max-h-[92vh] w-full max-w-4xl overflow-y-auto p-6">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-brand-primary">
                Register New Product & BOM
              </h2>
              <p className="text-xs text-text-secondary">
                Configure finished product details and dynamically append or structure its sub-ingredients Bill of Materials.
              </p>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
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

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Product</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {/* Add/Edit Ingredient Modal */}
      {(isAddIngredientModalOpen || isEditIngredientModalOpen) ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all duration-300"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsAddIngredientModalOpen(false);
              setIsEditIngredientModalOpen(false);
              setEditingIngredientId(null);
            }
          }}
        >
          <Card className="max-h-[92vh] w-full max-w-2xl overflow-y-auto border-border-strong/70 p-6 bg-gradient-to-b from-bg-surface to-bg-surface-alt shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border-soft pb-4 mb-4">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-brand-primary flex items-center gap-2">
                  {isEditIngredientModalOpen ? (
                    <>
                      <FileEdit className="h-5 w-5 text-brand-primary" />
                      Modify Ingredient details
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 text-brand-primary" />
                      Add Ingredient to BOM
                    </>
                  )}
                </h2>
                <p className="text-xs text-text-secondary">
                  Specify compliance parameters, supplier connections, and certification numbers for this ingredient.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddIngredientModalOpen(false);
                  setIsEditIngredientModalOpen(false);
                  setEditingIngredientId(null);
                }}
                className="text-text-muted hover:text-text-primary rounded-lg p-1.5 transition-colors font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Ingredient Name</label>
                  <Input
                    required
                    value={ingredientForm.name}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                    placeholder="e.g. Cocoa Butter"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">HS Code</label>
                  <Input
                    required
                    value={ingredientForm.hsCode}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, hsCode: e.target.value })}
                    placeholder="e.g. 18040000"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Composition (%)</label>
                  <Input
                    required
                    value={ingredientForm.percentage}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, percentage: e.target.value })}
                    placeholder="e.g. 12.5%"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Scientific Name</label>
                  <Input
                    value={ingredientForm.scientificName}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, scientificName: e.target.value })}
                    placeholder="e.g. Theobroma cacao"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Chain of Custody model</label>
                  <Select
                    value={ingredientForm.cocModel}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, cocModel: e.target.value })}
                  >
                    <option value="Not Applicable">Not Applicable</option>
                    <option value="SG">Segregated (SG)</option>
                    <option value="IP">Identity Preserved (IP)</option>
                    <option value="MB">Mass Balance (MB)</option>
                    <option value="BC">Book & Claim (BC)</option>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Supplier Link</label>
                  <Select
                    value={ingredientForm.supplierId}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, supplierId: e.target.value })}
                  >
                    <option value="">No supplier linkage (Direct)</option>
                    {currentSuppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.country})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Certifications</label>
                  <Input
                    value={ingredientForm.certifications}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, certifications: e.target.value })}
                    placeholder="e.g. BVC-RSPO-MY008900"
                  />
                </div>
              </div>



              <div className="flex justify-end gap-3 pt-4 border-t border-border-soft">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsAddIngredientModalOpen(false);
                    setIsEditIngredientModalOpen(false);
                    setEditingIngredientId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditIngredientModalOpen ? "Save Changes" : "Add Ingredient"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {/* Upload Documentation Modal */}
      {isUploadCertModalOpen ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all duration-300"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsUploadCertModalOpen(false);
              setCertIngredientId(null);
            }
          }}
        >
          <Card className="max-h-[92vh] w-full max-w-lg overflow-y-auto border-border-strong/70 p-6 bg-gradient-to-b from-bg-surface to-bg-surface-alt shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border-soft pb-4 mb-4">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-brand-primary flex items-center gap-2">
                  <Upload className="h-5 w-5 text-brand-primary" />
                  Upload Documentation
                </h2>
                <p className="text-xs text-text-secondary">
                  Provide credentials, select document category, and set the expiration date.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUploadCertModalOpen(false);
                  setCertIngredientId(null);
                }}
                className="text-text-muted hover:text-text-primary rounded-lg p-1.5 transition-colors font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUploadCert} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Document Type</label>
                <Select
                  value={certForm.documentType}
                  onChange={(e) => setCertForm({ ...certForm, documentType: e.target.value })}
                >
                  <option value="Agreements & Contracts">Agreements & Contracts</option>
                  <option value="Certificates & Declarations">Certificates & Declarations</option>
                  <option value="Product & Ingredient Documents">Product & Ingredient Documents</option>
                  <option value="Chain of Custody (CoC) Documents">Chain of Custody (CoC) Documents</option>
                  <option value="Geolocation & Mapping Records">Geolocation & Mapping Records</option>
                  <option value="Legal & Permit Documents">Legal & Permit Documents</option>
                  <option value="Audit & Assessment Reports">Audit & Assessment Reports</option>
                  <option value="Policies & Procedures">Policies & Procedures</option>
                  <option value="Due Diligence Documents">Due Diligence Documents</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Document ID / Reference</label>
                <Input
                  required
                  value={certForm.certifications}
                  onChange={(e) => setCertForm({ ...certForm, certifications: e.target.value })}
                  placeholder="e.g. RSPO-BVC-MY008900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Expiry Date</label>
                <Input
                  required
                  type="date"
                  value={certForm.certificationsExpiry}
                  onChange={(e) => setCertForm({ ...certForm, certificationsExpiry: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Upload Document PDF/Image</label>
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-strong bg-bg-surface-alt/40 p-6 text-center transition-all hover:border-brand-primary hover:bg-brand-accent-soft/10">
                  <div className="rounded-full bg-brand-accent-soft p-3 mb-2">
                    <Upload className="h-6 w-6 text-brand-primary" />
                  </div>
                  {certForm.fileName ? (
                    <span className="text-xs font-bold text-brand-primary">{certForm.fileName}</span>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-text-primary">Click to upload or drag & drop</span>
                      <span className="text-[10px] text-text-muted mt-1">PDF, PNG, JPG up to 10MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    id="cert-file-upload"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCertForm({ ...certForm, fileName: file.name });
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => document.getElementById("cert-file-upload")?.click()}
                  >
                    Select File
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-soft">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsUploadCertModalOpen(false);
                    setCertIngredientId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Save Documentation
                </Button>
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

      {/* BOM Revision Details Modal */}
      {isRevisionModalOpen && activeRevisionDetails ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all duration-300"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsRevisionModalOpen(false);
              setSelectedRevision(null);
            }
          }}
        >
          <Card className="max-h-[92vh] w-full max-w-4xl overflow-y-auto border-border-strong/70 p-6 bg-gradient-to-b from-bg-surface to-bg-surface-alt shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border-soft pb-4 mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-extrabold text-brand-primary flex items-center gap-2">
                    <FileText className="h-5.5 w-5.5 text-brand-primary" />
                    BOM Revision Details: {activeRevisionDetails.code}
                  </h2>
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold border uppercase tracking-wider ${activeRevisionDetails.status === "Active"
                    ? "bg-state-success/15 border-state-success/20 text-state-success"
                    : "bg-text-secondary/15 border-border-soft text-text-secondary"
                    }`}>
                    {activeRevisionDetails.status}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
                  Review historical composition snapshot, verified suppliers, and compliance metadata for this revision.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRevisionModalOpen(false);
                  setSelectedRevision(null);
                }}
                className="text-text-muted hover:text-text-primary rounded-lg p-1.5 transition-colors font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <Card variant="inset" className="p-3.5 space-y-1 bg-bg-surface/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Creation Date</span>
                <span className="text-sm font-semibold text-brand-primary block">{activeRevisionDetails.date}</span>
              </Card>
              <Card variant="inset" className="p-3.5 space-y-1 bg-bg-surface/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Authorized By</span>
                <span className="text-sm font-semibold text-brand-primary block">{activeRevisionDetails.author}</span>
              </Card>
              <Card variant="inset" className="p-3.5 space-y-1 bg-bg-surface/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Finished HS Code</span>
                <span className="text-sm font-semibold text-brand-primary block">HS {selectedProduct.finishedHsCode}</span>
              </Card>
            </div>

            <div className="mb-6 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Revision Summary & Change Log</h4>
              <Card variant="surface" className="p-4 bg-bg-page/40 border-border-soft">
                <p className="text-sm text-text-primary leading-relaxed">{activeRevisionDetails.description}</p>
              </Card>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Ingredient Composition Snapshot</h4>
              <TableRoot className="max-h-[300px] overflow-auto border border-border-soft rounded-lg">
                <Table className="text-xs">
                  <TableHead>
                    <tr>
                      <TableHeaderCell density="compact">Ingredient</TableHeaderCell>
                      <TableHeaderCell density="compact">HS Code</TableHeaderCell>
                      <TableHeaderCell density="compact">Percentage</TableHeaderCell>
                      <TableHeaderCell density="compact">Supplier</TableHeaderCell>
                      <TableHeaderCell density="compact">CoC Model</TableHeaderCell>
                      <TableHeaderCell density="compact">Certifications</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {activeRevisionDetails.ingredients.map((ing, idx) => (
                      <TableRow key={idx}>
                        <TableCell density="compact" className="font-bold text-text-primary">
                          {ing.name}
                        </TableCell>
                        <TableCell density="compact" className="text-text-secondary">
                          {ing.hsCode}
                        </TableCell>
                        <TableCell density="compact" className="font-semibold text-brand-primary">
                          {ing.percentage}
                        </TableCell>
                        <TableCell density="compact" className="font-medium text-text-primary">
                          {ing.supplierName}
                        </TableCell>
                        <TableCell density="compact" className="font-semibold text-text-secondary">
                          {ing.cocModel}
                        </TableCell>
                        <TableCell density="compact">
                          {ing.certifications !== "Not Applicable" ? (
                            <Tag tone="brand">{ing.certifications}</Tag>
                          ) : (
                            <span className="text-text-muted">Not Applicable</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableRoot>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border-soft">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsRevisionModalOpen(false);
                  setSelectedRevision(null);
                }}
              >
                Close Details
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
