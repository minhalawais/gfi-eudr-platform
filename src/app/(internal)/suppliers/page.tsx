"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { Pencil, Plus, Send, Copy, AlertTriangle, CheckCircle2, Link2, Upload, Trash2, Eye, X, FileText, ShieldCheck, Download, Printer } from "lucide-react";
import { getProductName, type SupplierDocument } from "@/lib/gfi-dummy-data";
import { useSession } from "@/components/ui/PermissionGuard";
import { cn } from "@/lib/cn";
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

const ALL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Cote d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland",
  "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico",
  "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru",
  "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela",
  "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

interface SearchableCountryDropdownProps {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}

function SearchableCountryDropdown({ value, onChange, required }: SearchableCountryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearch(value);
    }
  }, [value, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter((c) => c.toLowerCase().includes(query));
  }, [search]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          required={required}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={(e) => {
            setIsOpen(true);
            e.target.select();
          }}
          placeholder="Search country..."
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="h-4 w-4 text-text-muted transition-transform duration-200"
            style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <ul className="absolute z-[1100] mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border-soft bg-bg-surface p-1 shadow-lg focus:outline-none">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => (
              <li
                key={country}
                onClick={() => {
                  onChange(country);
                  setSearch(country);
                  setIsOpen(false);
                }}
                className={cn(
                  "cursor-pointer select-none rounded px-3 py-2 text-sm text-text-primary transition-colors hover:bg-brand-accent-soft/20 hover:text-brand-primary",
                  value === country && "bg-brand-accent-soft/40 text-brand-primary font-semibold"
                )}
              >
                {country}
              </li>
            ))
          ) : (
            <li className="select-none px-3 py-2 text-sm text-text-muted">No countries found</li>
          )}
        </ul>
      )}
    </div>
  );
}

const EVAL_SECTIONS = [
  {
    title: "General Requirements",
    items: [
      { id: "licenses_current", label: "State and Local Operating Licenses current? Attach required copy." }
    ]
  },
  {
    title: "Food Safety Programs",
    items: [
      { id: "pest_control", label: "Pest Control In Place?" },
      { id: "pest_control_contractor", label: "Pest Control Contractor Name:", type: "text" },
      { id: "inspection_records", label: "Inspection Records - Please Attach Last Three" },
      { id: "inspecting_agency", label: "Names of Inspecting Agency:", type: "text" },
      { id: "water_tested", label: "Water Tested Annually - Please Attach Results" },
      { id: "cleaning_schedule", label: "Master Cleaning Schedule used?" },
      { id: "food_safety_training", label: "Provide employees with Food Safety Training?" },
      { id: "environmental_testing", label: "Environmental testing performed of premises?" },
      { id: "corrective_actions", label: "Corrective actions procedures identified?" },
      { id: "mock_recalls", label: "Mock Recalls conducted? Plz attache" }
    ]
  },
  {
    title: "Building and Facilities",
    items: [
      { id: "interior_exterior_clean", label: "Exterior/Interior clean and free of debris?" },
      { id: "glass_policy", label: "Glass policy in place?" },
      { id: "equipment_maintained", label: "Equipment maintained?" },
      { id: "pm_program", label: "PM program in place and documented." },
      { id: "storage_clean", label: "Storage areas clean and well maintained?" },
      { id: "no_standing_water", label: "No standing water?" },
      { id: "sewage_maintained", label: "Sewage maintained properly?" }
    ]
  },
  {
    title: "Receiving and Storage",
    items: [
      { id: "vehicle_inspections", label: "Records are maintained for incoming/outgoing vehicle inspections?" },
      { id: "lot_numbers", label: "Lot numbers utilized?" },
      { id: "chemicals_stored", label: "Chemicals stored properly?" }
    ]
  },
  {
    title: "Food Security",
    items: [
      { id: "food_security_training", label: "Training provided to employees for food security? Attach Annual training plan" },
      { id: "access_limited", label: "Access limited into your processing area?" }
    ]
  },
  {
    title: "Glass Policy and Allergen Management",
    items: [
      { id: "traceability_forward_backward", label: "Traceability forward and backward" }
    ]
  }
];

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
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formFax, setFormFax] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Supplier Document Upload states
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [formDocTitle, setFormDocTitle] = useState("");
  const [formDocType, setFormDocType] = useState<string>("Agreements & Contracts");
  const [formDocFileName, setFormDocFileName] = useState("");

  // Supplier Document View state
  const [viewingDoc, setViewingDoc] = useState<SupplierDocument | null>(null);

  // Supplier Evaluation states
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalFormData, setEvalFormData] = useState<any>({
    supplierName: "",
    contactPerson: "",
    address: "",
    email: "",
    fax: "",
    productsSupplied: "",
    checklist: {}
  });

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

  useEffect(() => {
    if (selectedSupplier) {
      document.title = `${selectedSupplier.name} | Suppliers | GFI Compliance Control Center`;
    } else {
      document.title = `Suppliers | GFI Compliance Control Center`;
    }
  }, [selectedSupplier]);


  const handleRequestOutreach = () => {
    if (!selectedSupplier) return;
    setEmailStatus(
      `Formally dispatched EUDR Geolocation and CoC request pack to the compliance contact of ${selectedSupplier.name}. An automated tracking token has been attached to their upstream portal.`,
    );
    setTimeout(() => setEmailStatus(null), 6000);
  };

  const handleOpenEvaluation = () => {
    if (!selectedSupplier) return;
    const saved = localStorage.getItem(`gfi_supplier_eval_${selectedSupplier.id}`);
    if (saved) {
      try {
        setEvalFormData(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing supplier evaluation", e);
        initializeNewEvalForm();
      }
    } else {
      initializeNewEvalForm();
    }
    setIsEvalModalOpen(true);
  };

  const initializeNewEvalForm = () => {
    setEvalFormData({
      supplierName: selectedSupplier.name || "",
      contactPerson: selectedSupplier.contactPerson || "",
      address: selectedSupplier.address || "",
      email: selectedSupplier.email || "",
      fax: selectedSupplier.fax || "",
      productsSupplied: selectedSupplier.commodities.join(", ") || "",
      checklist: {
        licenses_current: { status: "Yes", remarks: "" },
        pest_control: { status: "Yes", remarks: "" },
        pest_control_contractor: { status: "", remarks: "" },
        inspection_records: { status: "Yes", remarks: "" },
        inspecting_agency: { status: "", remarks: "" },
        water_tested: { status: "Yes", remarks: "" },
        cleaning_schedule: { status: "Yes", remarks: "" },
        food_safety_training: { status: "Yes", remarks: "" },
        environmental_testing: { status: "Yes", remarks: "" },
        corrective_actions: { status: "Yes", remarks: "" },
        mock_recalls: { status: "Yes", remarks: "" },
        interior_exterior_clean: { status: "Yes", remarks: "" },
        glass_policy: { status: "Yes", remarks: "" },
        equipment_maintained: { status: "Yes", remarks: "" },
        pm_program: { status: "Yes", remarks: "" },
        storage_clean: { status: "Yes", remarks: "" },
        no_standing_water: { status: "Yes", remarks: "" },
        sewage_maintained: { status: "Yes", remarks: "" },
        vehicle_inspections: { status: "Yes", remarks: "" },
        lot_numbers: { status: "Yes", remarks: "" },
        chemicals_stored: { status: "Yes", remarks: "" },
        food_security_training: { status: "Yes", remarks: "" },
        access_limited: { status: "Yes", remarks: "" },
        traceability_forward_backward: { status: "Yes", remarks: "" },
      }
    });
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    localStorage.setItem(`gfi_supplier_eval_${selectedSupplier.id}`, JSON.stringify(evalFormData));
    setIsEvalModalOpen(false);

    editSupplier({
      ...selectedSupplier,
      nextAction: "Supplier evaluation checklist F-68 completed and saved.",
    });

    setEmailStatus(`Supplier evaluation checklist F-68 saved successfully for ${selectedSupplier.name}.`);
    setTimeout(() => setEmailStatus(null), 5000);
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
      `Generated ${generatedTokens.length} scoped link(s)${reusedTokens.length > 0 ? `, reused ${reusedTokens.length} existing active link(s)` : ""
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
    setFormContactPerson("");
    setFormAddress("");
    setFormEmail("");
    setFormFax("");
    setFormPhone("");
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
    setFormNextAction(selectedSupplier.nextAction || "");
    setFormIssues(selectedSupplier.issues.join("\n"));
    setFormContactPerson(selectedSupplier.contactPerson || "");
    setFormAddress(selectedSupplier.address || "");
    setFormEmail(selectedSupplier.email || "");
    setFormFax(selectedSupplier.fax || "");
    setFormPhone(selectedSupplier.phone || "");
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
      commodities: isEdit && selectedSupplier ? selectedSupplier.commodities : [],
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
      contactPerson: formContactPerson,
      address: formAddress,
      email: formEmail,
      fax: formFax,
      phone: formPhone,
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

  const handleOpenUploadDoc = () => {
    setFormDocTitle("");
    setFormDocType("Agreements & Contracts");
    setFormDocFileName("");
    setIsUploadDocModalOpen(true);
  };

  const handleSaveUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !formDocTitle.trim() || !formDocFileName) return;

    const newDoc = {
      id: `doc-${Date.now()}`,
      name: formDocTitle,
      type: formDocType,
      fileName: formDocFileName,
      uploadDate: new Date().toISOString().split("T")[0],
      size: "1.5 MB"
    };

    const updatedDocs = [...(selectedSupplier.documents || []), newDoc];

    editSupplier({
      ...selectedSupplier,
      documents: updatedDocs
    });

    setIsUploadDocModalOpen(false);
  };

  const handleDeleteDoc = (docId: string) => {
    if (!selectedSupplier) return;
    const updatedDocs = (selectedSupplier.documents || []).filter((doc) => doc.id !== docId);
    editSupplier({
      ...selectedSupplier,
      documents: updatedDocs
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormDocFileName(file.name);
      if (!formDocTitle.trim()) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .split(/[-_]+/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        setFormDocTitle(cleanName);
      }
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <SectionHeader
        title="Supplier Management"
        description="Review supplier status, declarations, CoC evidence, contract posture, geolocation coverage, and export impact."
        actions={
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
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
        <Card className="flex flex-col border-border-strong/70 bg-gradient-to-b from-bg-surface to-bg-surface-alt lg:sticky lg:top-6 lg:self-start lg:h-[calc(100vh-8rem)] lg:max-h-[calc(100vh-8rem)] lg:overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border-soft/80 pb-3 shrink-0 mb-3">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-brand-primary">Suppliers</h2>
              <p className="text-xs text-text-secondary">Select a supplier to review profile and requests</p>
            </div>
            <Tag tone="neutral">{currentSuppliers.length}</Tag>
          </div>
          <div className="flex-1 min-h-0 space-y-3 lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1 internal-scroll internal-scroll--main">
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
                    "group w-full rounded-lg border p-4 text-left transition-all duration-200 ease-emphasized min-w-0 overflow-hidden",
                    active
                      ? "border-brand-accent bg-brand-accent-soft/90 shadow-card"
                      : "border-border-soft bg-bg-surface hover:-translate-y-0.5 hover:border-border-strong hover:bg-bg-surface-alt hover:shadow-card",
                  ].join(" ")}
                >
                  <div className="min-w-0 w-full">
                    <strong className="text-sm text-brand-primary transition-colors group-hover:text-brand-primary-dark truncate block" title={supplier.name}>
                      {supplier.name}
                    </strong>
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-text-secondary truncate" title={`${supplier.supplierType} | Tier ${supplier.tier} | ${supplier.country}`}>
                    {supplier.supplierType} | Tier {supplier.tier} | {supplier.country}
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
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-text-secondary">Supplier Type</p>
                    <strong className="text-sm text-text-primary">{selectedSupplier.supplierType}</strong>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Origin Country</p>
                    <strong className="text-sm text-text-primary">{selectedSupplier.country}</strong>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Onboarding Tier</p>
                    <strong className="text-sm text-text-primary">Tier {selectedSupplier.tier} ({selectedSupplier.tier === 1 ? "Direct" : selectedSupplier.tier === 2 ? "Indirect" : "Sub-Tier"})</strong>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 border-t border-border-soft/60 pt-4 mt-2">
                  <div>
                    <p className="text-xs text-text-secondary">Contact Person</p>
                    <strong className="text-sm text-text-primary">{selectedSupplier.contactPerson || "Not Declared"}</strong>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Email</p>
                    <strong className="text-sm text-text-primary">{selectedSupplier.email || "Not Declared"}</strong>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Contact No</p>
                    <strong className="text-sm text-text-primary">{selectedSupplier.phone || "Not Declared"}</strong>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Fax</p>
                    <strong className="text-sm text-text-primary">{selectedSupplier.fax || "Not Declared"}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-text-secondary">Address</p>
                    <strong className="text-sm text-text-primary block truncate max-w-full" title={selectedSupplier.address}>{selectedSupplier.address || "Not Declared"}</strong>
                  </div>
                </div>
              </div>

              <Card className="flex flex-col h-full space-y-4">
                <div className="flex items-center justify-between border-b border-border-soft pb-2">
                  <h3 className="text-lg font-bold text-brand-primary">Supplier Documents</h3>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Upload className="h-4 w-4" aria-hidden="true" />}
                    onClick={handleOpenUploadDoc}
                  >
                    Upload
                  </Button>
                </div>

                <div className="flex-grow overflow-y-auto max-h-[280px] space-y-2 pr-1 min-h-[160px]">
                  {!selectedSupplier.documents || selectedSupplier.documents.length === 0 ? (
                    <div className="text-center py-8 text-xs text-text-secondary">
                      No documents uploaded yet. Click Upload to add agreements, declarations, certificates, licenses, or audits.
                    </div>
                  ) : (
                    selectedSupplier.documents.map((doc) => {
                      let typeColor = "border-l-[5px] border-l-blue-500/90 dark:border-l-blue-400/90";
                      let typeLabelColor = "text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-400/10 border border-blue-500/30 dark:border-blue-400/30 shadow-[0_1px_2px_rgba(59,130,246,0.12)]";

                      const docType = doc.type.toLowerCase();
                      if (docType.includes("declaration") || docType.includes("coc") || docType.includes("chain of custody")) {
                        typeColor = "border-l-[5px] border-l-emerald-500/90 dark:border-l-emerald-400/90";
                        typeLabelColor = "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-400/10 border border-emerald-500/30 dark:border-emerald-400/30 shadow-[0_1px_2px_rgba(16,185,129,0.12)]";
                      } else if (docType.includes("certificate") || docType.includes("diligence")) {
                        typeColor = "border-l-[5px] border-l-violet-500/90 dark:border-l-violet-400/90";
                        typeLabelColor = "text-violet-600 bg-violet-500/10 dark:text-violet-400 dark:bg-violet-400/10 border border-violet-500/30 dark:border-violet-400/30 shadow-[0_1px_2px_rgba(139,92,246,0.12)]";
                      } else if (docType.includes("license") || docType.includes("permit") || docType.includes("geolocation") || docType.includes("mapping")) {
                        typeColor = "border-l-[5px] border-l-amber-500/90 dark:border-l-amber-400/90";
                        typeLabelColor = "text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-400/10 border border-amber-500/30 dark:border-amber-400/30 shadow-[0_1px_2px_rgba(245,158,11,0.12)]";
                      } else if (docType.includes("audit") || docType.includes("assessment") || docType.includes("report")) {
                        typeColor = "border-l-[5px] border-l-rose-500/90 dark:border-l-rose-400/90";
                        typeLabelColor = "text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-400/10 border border-rose-500/30 dark:border-rose-400/30 shadow-[0_1px_2px_rgba(244,63,94,0.12)]";
                      }

                      return (
                        <div
                          key={doc.id}
                          className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border-y border-r border-border-soft bg-white dark:bg-bg-surface shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:shadow hover:bg-bg-surface-alt transition-all duration-200 ease-in-out ${typeColor}`}
                        >
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${typeLabelColor}`}>
                                {doc.type}
                              </span>
                              <span className="text-[10px] font-semibold text-text-muted">
                                {doc.uploadDate} | {doc.size || "1.5 MB"}
                              </span>
                            </div>
                            <strong className="block truncate text-sm text-text-primary font-bold" title={doc.name}>
                              {doc.name}
                            </strong>
                            <span className="block truncate text-xs text-text-secondary font-medium italic">
                              {doc.fileName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setViewingDoc(doc)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-brand-primary hover:bg-brand-accent-soft/30 transition-all duration-150"
                              title="Open Document"
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-state-danger hover:bg-state-danger/10 transition-all duration-150"
                              title="Delete Document"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 space-y-2 border-t border-border-soft/60">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleOpenEvaluation}
                    icon={<FileText className="h-4 w-4" aria-hidden="true" />}
                    fullWidth
                  >
                    Fill Supplier Evaluation Form
                  </Button>
                </div>
              </Card>
            </Card>

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
          </div>
        ) : (
          <Card className="p-10 text-center text-text-secondary">Select a supplier to view compliance details.</Card>
        )}
      </div>

      {(isAddModalOpen || isEditModalOpen) ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              resetForm();
            }
          }}
        >
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-brand-primary">
                {isEditModalOpen ? "Edit Supplier Record" : "Add New Supplier"}
              </h2>
              <p className="text-xs text-text-secondary">
                Provide supplier identity, contact credentials, and linked commodities to build the traceability profile.
              </p>
            </div>

            <form onSubmit={(e) => handleSaveSupplier(e, isEditModalOpen)} className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-text-secondary">Supplier Company Name</label>
                  <Input required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Sumatra Smallholders Group" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Origin Country</label>
                  <SearchableCountryDropdown required value={formCountry} onChange={setFormCountry} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Supplier Type</label>
                  <Select value={formType} onChange={(e) => setFormType(e.target.value)}>
                    <option value="Intermediary Trader">Trader / Distritbuer / Importer</option>
                    <option value="Processor">Manufacturer / Processor</option>
                    <option value="Aggregator">Raw Material Aggregator / Consolidator</option>
                    <option value="Farmer">Farmer / Producer</option>
                  </Select>
                </div>
              </div>

              {/* Contact Information Fields (Requested via Screenshot) */}
              <div className="grid gap-4 md:grid-cols-2 border-t border-border-soft/60 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Contact Person</label>
                  <Input value={formContactPerson} onChange={(e) => setFormContactPerson(e.target.value)} placeholder="e.g. John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Supplier Email</label>
                  <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="e.g. contact@supplier.com" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Supplier Address</label>
                  <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="e.g. Suite 3A, Level 10, Menara Cargill, Malaysia" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Contact No</label>
                  <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="e.g. 0300-8445013" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Fax</label>
                  <Input value={formFax} onChange={(e) => setFormFax(e.target.value)} placeholder="e.g. +60 3 1234 5678" />
                </div>
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
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsLinkModalOpen(false);
          }}
        >
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

      {isUploadDocModalOpen ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsUploadDocModalOpen(false);
          }}
        >
          <Card className="w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-brand-primary">Upload Supplier Document</h2>
              <p className="text-xs text-text-secondary">
                Upload legal, regulatory, or operational documentation for this supplier.
              </p>
            </div>

            <form onSubmit={handleSaveUploadDoc} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Document Title</label>
                <Input
                  required
                  value={formDocTitle}
                  onChange={(e) => setFormDocTitle(e.target.value)}
                  placeholder="e.g. Sumatra Palm Oil Supply Agreement"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Document Type</label>
                <Select
                  value={formDocType}
                  onChange={(e) => setFormDocType(e.target.value)}
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

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Document File</label>
                <div
                  onClick={() => document.getElementById("supplier-doc-file-input")?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-border-strong/70 hover:border-brand-primary rounded-xl p-6 bg-bg-surface-alt hover:bg-brand-accent-soft/20 cursor-pointer transition-all duration-150 text-center"
                >
                  <input
                    type="file"
                    id="supplier-doc-file-input"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                  <Upload className="h-8 w-8 text-brand-primary/60 mb-2" />
                  <p className="text-sm font-bold text-brand-primary">
                    {formDocFileName ? "File Selected" : "Click to select a file"}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {formDocFileName ? formDocFileName : "Supports PDF, DOCX, XLSX up to 10MB"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsUploadDocModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!formDocFileName}>
                  Upload Document
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {viewingDoc ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(event) => {
            if (event.target === event.currentTarget) setViewingDoc(null);
          }}
        >
          <Card className="w-full max-w-4xl overflow-hidden p-0 bg-white dark:bg-bg-surface shadow-2xl border border-border-soft rounded-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-soft p-5 bg-bg-surface-alt">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-accent-soft/20 text-brand-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-brand-primary leading-tight">
                    {viewingDoc.name}
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {viewingDoc.fileName} • {viewingDoc.size || "1.5 MB"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-hover transition-all duration-150"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-slate-50/50 dark:bg-bg-surface/30">
              {/* Document Info Grid */}
              <div className="grid grid-cols-4 gap-4 bg-white dark:bg-bg-surface border border-border-soft p-4 rounded-xl shadow-sm">
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-text-secondary">Document Type</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-xs font-bold border uppercase tracking-wider shadow-sm ${
                    (() => {
                      const vt = viewingDoc.type.toLowerCase();
                      if (vt.includes("declaration") || vt.includes("coc") || vt.includes("chain of custody")) {
                        return "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-400/10 border-emerald-500/30 dark:border-emerald-400/30 shadow-[0_1px_2px_rgba(16,185,129,0.12)]";
                      }
                      if (vt.includes("certificate") || vt.includes("diligence")) {
                        return "text-violet-600 bg-violet-500/10 dark:text-violet-400 dark:bg-violet-400/10 border-violet-500/30 dark:border-violet-400/30 shadow-[0_1px_2px_rgba(139,92,246,0.12)]";
                      }
                      if (vt.includes("license") || vt.includes("permit") || vt.includes("geolocation") || vt.includes("mapping")) {
                        return "text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-400/10 border-amber-500/30 dark:border-amber-400/30 shadow-[0_1px_2px_rgba(245,158,11,0.12)]";
                      }
                      if (vt.includes("audit") || vt.includes("assessment") || vt.includes("report")) {
                        return "text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-400/10 border-rose-500/30 dark:border-rose-400/30 shadow-[0_1px_2px_rgba(244,63,94,0.12)]";
                      }
                      return "text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-400/10 border-blue-500/30 dark:border-blue-400/30 shadow-[0_1px_2px_rgba(59,130,246,0.12)]";
                    })()
                  }`}>
                    {viewingDoc.type}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-text-secondary">Verification Status</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Active
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-text-secondary">Uploaded Date</span>
                  <span className="block mt-0.5 text-sm font-semibold text-text-primary">{viewingDoc.uploadDate}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-text-secondary">Assigned Supplier</span>
                  <span className="block mt-0.5 text-sm font-semibold text-text-primary">{selectedSupplier.name}</span>
                </div>
              </div>

              {/* PDF Viewer */}
              <div className="border border-border-soft bg-white dark:bg-bg-surface-alt rounded-xl shadow-sm overflow-hidden h-[500px]">
                <iframe
                  src="/test.pdf"
                  className="w-full h-full border-none"
                  title="PDF Viewer"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border-soft p-4 bg-bg-surface-alt">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Download className="h-4 w-4" />}
                onClick={() => {
                  alert(`Simulating file download: ${viewingDoc.fileName}`);
                }}
              >
                Download File
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Printer className="h-4 w-4" />}
                onClick={() => {
                  alert("Simulating printing document audit record.");
                }}
              >
                Print Record
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setViewingDoc(null)}
              >
                Close Preview
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {isEvalModalOpen ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsEvalModalOpen(false);
          }}
        >
          <div className="border border-border-soft rounded-2xl bg-white dark:bg-bg-surface p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col gap-4">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-text-muted border-b border-border-soft pb-3 shrink-0">
              <span>Controlled Document</span>
              <button
                type="button"
                onClick={() => setIsEvalModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-hover transition-all duration-150 absolute right-4 top-3"
              >
                <X className="h-5 w-5" />
              </button>
              <span className="text-brand-primary bg-brand-accent-soft/20 px-2.5 py-0.5 rounded mr-8">F-68</span>
            </div>

            {/* Document Title */}
            <div className="text-center shrink-0">
              <h2 className="text-lg font-black text-brand-primary uppercase tracking-wide">Supplier Evaluation Checklist</h2>
              <p className="text-xs text-text-secondary italic mt-0.5">* Please complete the following. Thank you in advance for your cooperation.</p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveEvaluation} className="flex-1 overflow-y-auto space-y-6 pr-1 internal-scroll">
              <div className="grid gap-4 md:grid-cols-2 bg-bg-surface-alt border border-border-soft p-4 rounded-xl shadow-sm">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">Supplier Name</label>
                  <Input
                    required
                    value={evalFormData.supplierName}
                    onChange={(e) => setEvalFormData((prev: any) => ({ ...prev, supplierName: e.target.value }))}
                    className="bg-white dark:bg-bg-surface text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">Contact Person</label>
                  <Input
                    value={evalFormData.contactPerson}
                    onChange={(e) => setEvalFormData((prev: any) => ({ ...prev, contactPerson: e.target.value }))}
                    className="bg-white dark:bg-bg-surface text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">Supplier Address</label>
                  <Input
                    value={evalFormData.address}
                    onChange={(e) => setEvalFormData((prev: any) => ({ ...prev, address: e.target.value }))}
                    className="bg-white dark:bg-bg-surface text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">Supplier Email</label>
                  <Input
                    type="email"
                    value={evalFormData.email}
                    onChange={(e) => setEvalFormData((prev: any) => ({ ...prev, email: e.target.value }))}
                    className="bg-white dark:bg-bg-surface text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">Fax</label>
                  <Input
                    value={evalFormData.fax}
                    onChange={(e) => setEvalFormData((prev: any) => ({ ...prev, fax: e.target.value }))}
                    className="bg-white dark:bg-bg-surface text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">Products Supplied</label>
                  <Input
                    value={evalFormData.productsSupplied}
                    onChange={(e) => setEvalFormData((prev: any) => ({ ...prev, productsSupplied: e.target.value }))}
                    className="bg-white dark:bg-bg-surface text-sm"
                  />
                </div>
              </div>

              {/* Requirement Table */}
              <div className="border border-border-soft rounded-xl overflow-hidden shadow-sm bg-white dark:bg-bg-surface">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-surface-alt border-b border-border-soft text-[10px] uppercase tracking-wider font-bold text-text-primary">
                      <th className="p-3 w-1/2">Requirement</th>
                      <th className="p-3 text-center w-1/4">Yes / No / NA</th>
                      <th className="p-3 w-1/4">Remarks / Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft/60">
                    {EVAL_SECTIONS.map((sec) => (
                      <React.Fragment key={sec.title}>
                        {/* Section Header Row */}
                        <tr className="bg-slate-50 dark:bg-bg-surface-alt font-black text-xs text-brand-primary">
                          <td colSpan={3} className="p-2.5 font-bold tracking-wide border-y border-border-soft/80">
                            {sec.title}
                          </td>
                        </tr>
                        {sec.items.map((item) => (
                          <tr key={item.id} className="hover:bg-bg-surface-alt/40 transition-colors duration-150">
                            <td className="p-3 text-xs text-text-primary font-medium leading-normal">
                              {item.label}
                            </td>
                            <td className="p-3 text-center align-middle">
                              {item.type !== "text" ? (
                                <div className="flex gap-1 justify-center">
                                  {["Yes", "No", "N/A"].map((opt) => {
                                    const isSelected = evalFormData.checklist?.[item.id]?.status === opt;
                                    return (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                          setEvalFormData((prev: any) => {
                                            const checklist = { ...prev.checklist };
                                            checklist[item.id] = {
                                              ...checklist[item.id],
                                              status: opt,
                                            };
                                            return { ...prev, checklist };
                                          });
                                        }}
                                        className={cn(
                                          "px-2.5 py-1 text-[10px] font-bold rounded-md border transition-all duration-150 select-none",
                                          isSelected
                                            ? opt === "Yes"
                                              ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                              : opt === "No"
                                              ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                              : "bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                            : "bg-white border-border-soft text-text-secondary hover:bg-slate-50 dark:bg-bg-surface dark:hover:bg-slate-800"
                                        )}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-[10px] text-text-muted italic">—</span>
                              )}
                            </td>
                            <td className="p-3">
                              <Input
                                value={evalFormData.checklist?.[item.id]?.remarks || ""}
                                onChange={(e) => {
                                  const textVal = e.target.value;
                                  setEvalFormData((prev: any) => {
                                    const checklist = { ...prev.checklist };
                                    checklist[item.id] = {
                                      ...checklist[item.id],
                                      remarks: textVal,
                                    };
                                    return { ...prev, checklist };
                                  });
                                }}
                                placeholder={item.type === "text" ? "Enter value..." : "Add remarks..."}
                                className="h-8 py-1 text-xs"
                              />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Document Footer Info */}
              <div className="border-t border-border-soft pt-4 flex flex-col md:flex-row justify-between items-center text-[9px] uppercase font-bold tracking-wider text-text-muted gap-2 text-center md:text-left shrink-0">
                <div className="space-y-0.5">
                  <p>Gujranwala Food Industries (Pvt) Ltd</p>
                  <p>Gujranwala Pakistan</p>
                </div>
                <div className="space-y-0.5 text-center">
                  <p>F-68 Supplier Evaluation Checklist • Version # 03</p>
                  <p className="text-brand-primary">Confidential</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p>Issue Date: 20-03-20</p>
                  <p>Revision Date: 23-02-23</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEvalModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Evaluation</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
