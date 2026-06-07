import { classifyIngredientEudr } from "@/lib/eudr-classifier";
import {
  deriveIngredientRiskTier,
  getDueDiligenceMode,
  type DueDiligenceMode,
  type EuCountryRiskTier,
} from "@/lib/eu-country-risk";
import {
  buildLegalityDossierTemplate,
  summarizeLegalityDossier,
  toIngredientLegalityStatus,
  type IngredientLegalityStatus,
  type LegalityAuditEvent,
  type LegalityDossierStatus,
  type LegalityEvidenceDocumentShape,
} from "@/lib/legality-dossier";
import type { DdsPayloadSummary, DdsSubmissionStatus } from "@/lib/traces-simulator";

export type CommodityCode = "COCOA" | "PALM" | "COFFEE" | "SOYA" | "RUBBER" | "WOOD" | "CATTLE" | "NONE";

export interface OrganizationProfile {
  id: string;
  name: string;
  legalName: string;
  tradingName: string;
  country: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  legalRole: string;
  defaultOutputMode: "COMPLIANCE_PACKAGE" | "DIRECT_DDS";
  primaryMarketFlow: string;
  eudrNarrative: string;
  rexNumber: string;
  eoriStatus: "NOT_REQUIRED_FOR_GFI" | "REQUIRED";
  tracesStatus: "EU_AGENT_DEPENDENT" | "REGISTERED";
}

export interface ScenarioOption {
  id: string;
  label: string;
  summary: string;
  businessMeaning: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  country: string;
  operatorMode: "EU_OPERATOR_AGENT" | "DIRECT_OPERATOR";
  eoriStatus: "VERIFIED" | "MISSING";
  tracesStatus: "VERIFIED" | "PENDING";
  readiness: "READY" | "FOLLOW_UP_REQUIRED" | "BLOCKED";
  assignedConsignmentIds: string[];
  notes: string[];
}

export interface SupplierRecord {
  id: string;
  name: string;
  country: string;
  supplierType: string;
  tier: number;
  commodities: CommodityCode[];
  onboardingStatus:
  | "APPROVED"
  | "UNDER_REVIEW"
  | "PENDING_RESPONSE"
  | "CHANGES_REQUESTED"
  | "BLOCKED";
  declarationStatus: "SIGNED" | "REQUESTED" | "MISSING" | "UNDER_REVIEW";
  cocStatus: "VERIFIED" | "MSDS_ONLY" | "MISSING" | "UNDER_REVIEW";
  geolocationCoverage: number;
  contractStatus: "EUDR_CLAUSE_PRESENT" | "LEGACY_CONTRACT" | "MISSING";
  latestRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  facilities: string[];
  certifications: string[];
  evidenceCount: number;
  issues: string[];
  linkedProductIds: string[];
  linkedConsignmentIds: string[];
  nextAction?: string;
  contactPerson?: string;
  address?: string;
  email?: string;
  fax?: string;
  phone?: string;
  documents?: SupplierDocument[];
}

export interface SupplierDocument {
  id: string;
  name: string;
  type: "Agreement" | "Declaration" | "Certificate" | "License" | "Audit Record";
  fileName: string;
  uploadDate: string;
  size?: string;
  issuedAt?: string;
  expiresAt?: string;
}

export interface IngredientRecord {
  id: string;
  name: string;
  hsCode: string;
  commodity: CommodityCode;
  relevance: "IN_SCOPE" | "OUT_OF_SCOPE" | "UNDER_REVIEW";
  supplierIds: string[];
  percentage: string;
  readiness: "READY" | "BLOCKED" | "REVIEW_REQUIRED";
  evidenceStatus: "COMPLETE" | "PARTIAL" | "MISSING";
  blockingReason: string;
  classificationSource?: "annex_i_rule" | "manual_review";
  classificationNote?: string;
  classificationConfidence?: "high" | "medium";
  supplyChainStatus:
  | "NOT_REQUESTED"
  | "REQUESTED"
  | "IN_PROGRESS"
  | "GAPS_FOUND"
  | "COMPLETE"
  | "BLOCKED";
  scientificName?: string;
  cocModel?: string;
  supplierName?: string;
  certifications?: string;
  certificationsExpiry?: string;
  documentType?: string;
  originCountries: string[];
  primaryOriginCountry: string;
  euRiskTier: EuCountryRiskTier;
  dueDiligenceMode: DueDiligenceMode;
  legalityDossierStatus: IngredientLegalityStatus;
  ddsStatus: "DRAFT" | "READY_FOR_TRACES" | "TRACES_SUBMITTED";
}

export interface ProductRecord {
  id: string;
  name: string;
  finishedHsCode: string;
  primaryMarkets: string[];
  annualVolume: string;
  scopeStatus:
  | "OUT_OF_SCOPE"
  | "IN_SCOPE"
  | "UNDER_CLASSIFICATION_REVIEW"
  | "FUTURE_EXPORT_BLOCKED";
  exportReadiness: "READY" | "NOT_READY" | "REVIEW_REQUIRED";
  activeBomRevision: string;
  operatorFlow: "COMPLIANCE_PACKAGE" | "DIRECT_DDS";
  summary: string;
  blockingGaps: string[];
  bomHistory: string[];
  ingredients: IngredientRecord[];
}

export interface PlotRecord {
  id: string;
  supplierId: string;
  label: string;
  sourceCountry: string;
  geoType: "POINT" | "POLYGON";
  areaHa: number;
  status:
  | "REQUESTED"
  | "PENDING_APPROVAL"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "SUPERSEDED";
  provenanceFlow: string;
  coordinatesSummary: string;
  latestDeforestationStatus: "NOT_STARTED" | "PENDING" | "CLEAR" | "FLAGGED";
  notes: string[];
}

export interface DeforestationCase {
  id: string;
  plotId: string;
  provider: string;
  resultStatus: "PENDING" | "CLEAR" | "FLAGGED" | "SUPERSEDED";
  decisionDate: string;
  downstreamImpact: "NO_BLOCK" | "REVIEW_REQUIRED" | "BLOCKING";
  summary: string;
  evidenceArtifact: string;
}

export interface RiskSubjectRecord {
  id: string;
  subjectType: "SUPPLIER" | "PRODUCT" | "CONSIGNMENT";
  subjectId: string;
  name: string;
  latestLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  workflowStatus: "ACTIVE" | "MITIGATION_PENDING" | "BLOCKING";
  methodology: string;
  criteria: Array<{
    code: string;
    title: string;
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    rationale: string;
  }>;
  mitigations: string[];
  history: string[];
}

export interface TraceabilityCase {
  id: string;
  mode: "REVERSE" | "FORWARD";
  rootReference: string;
  completeness: "TRACEABLE" | "PENDING_REVIEW" | "INCOMPLETE" | "BLOCKED";
  chainOfCustodySummary: string;
  supersession: string;
  nodes: Array<{
    label: string;
    entityType: string;
    status: "CLEAR" | "WARNING" | "BLOCKED";
    sourceRef: string;
    evidenceCount: number;
    note: string;
  }>;
  gaps: string[];
}

export interface GateIssue {
  code: string;
  severity: "WARNING" | "HIGH" | "CRITICAL";
  sourceDomain: string;
  blocking: boolean;
  message: string;
}

export interface DispatchLine {
  sr: number;
  finalCode: string;
  productName: string;
  packingDesc: string;
  section: string;
  totalCartons: number;
  dipsCartons: number;
  lotNo: string;
  mfgDate: string;
  expDate: string;
  grossWtKg: number;
  totalGrossWtKg: number;
}

export interface ConsignmentRecord {
  id: string;
  reference: string;
  destination: string;
  operatorAgentId: string;
  shipmentMode: "CURRENT_EXPORT" | "FUTURE_EXPORT";
  shipmentStatus?: "SHIPPED" | "IN_TRANSIT" | "TO_BE_SHIPPED";
  lineSummary: string[];
  gateStatus: "READY" | "BLOCKED" | "REVIEW_REQUIRED";
  outputEligibility: "PACKAGE_READY" | "HELD" | "SCOPE_REVIEW";
  traceabilityStatus: "TRACEABLE" | "BLOCKED" | "REVIEW_REQUIRED";
  policyNarrative: string;
  issues: GateIssue[];
  nextAction: string;
  // Dispatch Checklist — Document Header
  saleOrderNo?: string;
  dispatchDate?: string;
  invoiceNo?: string;
  customerRefNo?: string;
  pfaNo?: string;
  country?: string;
  // Container / Logistics
  containerNo?: string;
  containerSize?: string;
  cbm?: number;
  weightLimitKg?: number;
  grossWeightTons?: number;
  sealNo?: string;
  truckNo?: string;
  masterCaseColor?: string;
  logoOnCarton?: string;
  tapeOnCarton?: string;
  // Condition Checks
  cleanedBeforeLoading?: boolean;
  fitForLoading?: boolean;
  notFitReason?: string;
  specialRemarks?: string;
  // Loading Info
  placeOfLoading?: string;
  loadingTime?: string;
  // Product Line Items
  dispatchLines?: DispatchLine[];
  totalCartons?: number;
  totalDipsCartons?: number;
  // Signatories
  checkedByExport?: string;
  qualityInspector?: string;
  countBy?: string;
}

export interface OutputPackageRecord {
  id: string;
  consignmentId: string;
  mode: "COMPLIANCE_PACKAGE" | "DIRECT_DDS";
  snapshotVersion: string;
  status: "ASSEMBLED" | "READY_FOR_AGENT" | "HELD" | "SUPERSEDED";
  evidenceIndexCount: number;
  sourceAnchorCount: number;
  packageRef: string;
  supersessionNote: string;
  artifacts: string[];
}

export interface DocumentRecord {
  id: string;
  title: string;
  documentRole: string;
  linkedEntity: string;
  status: "CURRENT" | "REQUESTED" | "EXPIRED" | "DRAFT";
  note: string;
  issuedAt?: string;
  expiresAt?: string;
}

export interface ConcernRecord {
  id: string;
  headline: string;
  impactArea: string;
  severity: "MEDIUM" | "HIGH" | "CRITICAL";
  linkedEntity: string;
  status: "OPEN" | "UNDER_REVIEW" | "MITIGATED";
  downstreamEffect: string;
}

export interface IntegrationOverview {
  provider: string;
  status: "CONNECTED" | "PARTIAL";
  importedDispatches: number;
  importedBatches: number;
  missingHsEnrichments: number;
  missingCocEnrichments: number;
  reconciliationWarnings: string[];
}

export interface ReportRecord {
  id: string;
  title: string;
  scope: string;
  status: "CURRENT" | "DRAFT";
  generatedAt: string;
  note: string;
}

export interface SupplierPortalRequest {
  id: string;
  supplierId: string;
  supplierName: string;
  actorType: "INTERMEDIARY_PROCESSOR" | "PRODUCER_GROUP";
  tokenLabel: string;
  submissionStatus:
  | "PENDING_RESPONSE"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CHANGES_REQUESTED"
  | "CLOSED";
  requiredActions: string[];
  latestReviewerNote: string;
  formType?: "INTERMEDIARY" | "FARMER";
  targetNodeId?: string;
  parentRequestId?: string;
  email?: string;
  requestedAt?: string;
  expiresAt?: string;
}

export interface SupplyChainNode {
  id: string;
  ingredientId: string;
  productId: string;
  supplierId: string;
  parentNodeId: string | null;
  tier: number;
  actorType:
  | "DIRECT_SUPPLIER"
  | "INTERMEDIARY"
  | "MILL"
  | "TRADER"
  | "PROCESSOR"
  | "DISTRIBUTOR"
  | "EXPORTER"
  | "FARMER"
  | "COOPERATIVE"
  | "ESTATE";
  entityName: string;
  country: string;
  commodity: CommodityCode;
  materialName: string;
  volumeContributionPercent: number;
  status:
  | "NOT_REQUESTED"
  | "REQUESTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "GAPS_FOUND"
  | "COMPLETE"
  | "BLOCKED";
}

export interface EudrFormRequest {
  id: string;
  tokenLabel: string;
  targetSupplierId: string;
  targetNodeId: string;
  productId?: string;
  ingredientId?: string;
  formType: "INTERMEDIARY" | "FARMER";
  requestedBy: string;
  requestedAt: string;
  expiresAt: string;
  status:
  | "PENDING_RESPONSE"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CHANGES_REQUESTED"
  | "CLOSED";
  email: string;
  parentRequestId: string | null;
}

export interface SupplyChainEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType: "SUPPLIES_TO" | "PROCESSES_FOR" | "FARM_SOURCE_FOR";
  materialName: string;
  volumePercent: number;
  proofDocumentIds: string[];
  status: "PENDING" | "SUPPORTED" | "GAP";
}

export interface IntermediaryDeclarationSubmission {
  id: string;
  requestId: string;
  nodeId: string;
  submittedAt: string;
  sections: Record<string, unknown>;
  upstreamEntities: Array<{
    id: string;
    name: string;
    entityType: "Mill" | "Farm" | "Trader" | "Processor" | "Distributor" | "Exporter" | "Cooperative" | "Estate";
    address: string;
    materialName: string;
    volumeContributionPercent: number;
    certifiedSupplier: boolean;
    certificateAttached: boolean;
  }>;
  traceabilityControls: string;
  signatureName: string;
}

export interface FarmerDeclarationSubmission {
  id: string;
  requestId: string;
  nodeId: string;
  submittedAt: string;
  sections: Record<string, unknown>;
  plotRows: Array<{
    plotId: string;
    latitudes: string;
    longitudes: string;
    areaHa: number;
    commodityGrown: string;
    productionVolume: string;
    coordinateType: "POINT" | "POLYGON" | "FILE";
    fileName: string;
  }>;
  signatureName: string;
}

export interface EudrEvidenceAttachment {
  id: string;
  requestId: string;
  nodeId: string;
  sectionRef: string;
  documentRole:
  | "INTERMEDIARY_DECLARATION"
  | "FARMER_DECLARATION"
  | "UPSTREAM_TRADE_PROOF"
  | "LAND_RIGHTS_EVIDENCE"
  | "GEOLOCATION_FILE"
  | "SUSTAINABILITY_CERTIFICATE"
  | "LEGAL_LICENSE"
  | "LABOUR_RIGHTS_EVIDENCE";
  fileName: string;
  status: "REQUESTED" | "ATTACHED" | "MISSING";
}

export interface DdsSubmissionRecord {
  id: string;
  productId: string;
  ingredientId: string;
  supplierId: string;
  status: DdsSubmissionStatus;
  tracesReferenceCode: string;
  submittedAt: string;
  submittedBy: string;
  submissionMode: "SIMULATED";
  requestPayloadSummary: DdsPayloadSummary;
  responseLog: string[];
}

export interface LegalityEvidenceDocument extends LegalityEvidenceDocumentShape {}

export interface LegalityDossierRecord {
  id: string;
  ingredientId: string;
  productId: string;
  originCountry: string;
  euRiskTier: EuCountryRiskTier;
  dueDiligenceMode: DueDiligenceMode;
  overallStatus: LegalityDossierStatus;
  documents: LegalityEvidenceDocument[];
  auditTrail: LegalityAuditEvent[];
}

export const organizationProfile: OrganizationProfile = {
  id: "gfi-org-001",
  name: "GFI Pakistan",
  legalName: "Gujranwala Food Industries",
  tradingName: "GFI Pakistan",
  country: "Pakistan",
  address: "",
  email: "",
  phone: "",
  website: "",
  legalRole: "Non-EU Supplier / Compliance Data Pack Provider",
  defaultOutputMode: "COMPLIANCE_PACKAGE",
  primaryMarketFlow: "GFI -> EU Agent -> EU Retailer",
  eudrNarrative:
    "GFI usually provides upstream evidence packs to EU-established agents who file the legal DDS as Operators.",
  rexNumber: "PK-REX-778241",
  eoriStatus: "NOT_REQUIRED_FOR_GFI",
  tracesStatus: "EU_AGENT_DEPENDENT",
};

export const scenarioOptions: ScenarioOption[] = [
  {
    id: "current_gfi_reality",
    label: "Current GFI reality",
    summary: "Cocoa remains blocked, palm remains under HS scope review, and agent handoff is only partially ready.",
    businessMeaning: "This is the default operating story the UI should communicate.",
  },
  {
    id: "after_cocoa_remediation",
    label: "After cocoa remediation",
    summary: "JB Cocoa and N A Enterprises have provided acceptable provenance and CoC evidence.",
    businessMeaning: "Used for stakeholder walkthroughs on what good looks like after remediation.",
  },
  {
    id: "after_palm_reclassification",
    label: "After palm reclassification",
    summary: "Palm fat is formally confirmed out of Annex I scope.",
    businessMeaning: "Used to demonstrate how scope review can remove unnecessary diligence work.",
  },
  {
    id: "future_direct_dds",
    label: "Future direct DDS operator mode",
    summary: "A future tenant or market flow uses the same product with direct DDS filing instead of agent package handoff.",
    businessMeaning: "Shows that the platform can support both package and direct DDS modes.",
  },
];

export const agents: AgentProfile[] = [
  {
    id: "agent-fos-eu",
    name: "FOS Global Sourcing Europe GmbH",
    country: "Germany",
    operatorMode: "EU_OPERATOR_AGENT",
    eoriStatus: "VERIFIED",
    tracesStatus: "VERIFIED",
    readiness: "READY",
    assignedConsignmentIds: [
      "con-bubblegum-001",
      "con-gum-004",
      "con-candy-005",
      "con-jelly-006",
      "con-bubblegum-007",
      "con-candy-008",
      "con-jelly-009",
      "con-gum-010",
    ],
    notes: [
      "Primary EU operator agent for current low-complexity exports.",
      "Can receive compliance package immediately for out-of-scope or clean handoff flows.",
    ],
  },
  {
    id: "agent-rhine-bv",
    name: "Rhine Confectionery Imports BV",
    country: "Netherlands",
    operatorMode: "EU_OPERATOR_AGENT",
    eoriStatus: "VERIFIED",
    tracesStatus: "PENDING",
    readiness: "FOLLOW_UP_REQUIRED",
    assignedConsignmentIds: [
      "con-chew-002",
      "con-choc-003",
      "con-chew-011",
      "con-wafers-012",
      "con-chew-013",
      "con-chew-014",
      "con-wafers-015",
      "con-choc-016",
      "con-choc-017",
      "con-choc-018",
    ],
    notes: [
      "Agent readiness still depends on TRACES onboarding confirmation.",
      "Cannot accept final cocoa package while provenance blockers remain unresolved.",
    ],
  },
];

export const suppliers: SupplierRecord[] = [
  {
    id: "sup-cargill",
    name: "Cargill Palm Products SDN BHD",
    country: "Malaysia",
    supplierType: "Manufacturer / Refiner",
    tier: 1,
    commodities: ["PALM"],
    onboardingStatus: "APPROVED",
    declarationStatus: "SIGNED",
    cocStatus: "VERIFIED",
    geolocationCoverage: 100,
    contractStatus: "LEGACY_CONTRACT",
    latestRiskLevel: "MEDIUM",
    facilities: ["Port Klang refining complex"],
    certifications: ["RSPO BVC-RSPO-MY008900"],
    evidenceCount: 16,
    issues: [
      "Prepared palm fat blend remains under HS classification review before GFI can treat the route as definitively in or out of scope.",
      "Legacy contract is missing explicit EUDR clause language.",
    ],
    nextAction: "Retain the completed palm provenance package while customs scope confirmation and contract remediation are finalized.",
    linkedProductIds: ["prd-chew", "prd-chocolate", "prd-wafers"],
    linkedConsignmentIds: ["con-chew-002"],
    contactPerson: "Eugene Lim",
    address: "Cargill Malaysia, Suite 22-1, Menara Cargill, Kuala Lumpur, Malaysia",
    email: "eugene_lim@cargill.com",
    fax: "+60 3-7844 9999",
    phone: "—",
    documents: [
      {
        id: "doc-cargill-1",
        name: "Sumatra Palm Supply Agreement 2026",
        type: "Agreement",
        fileName: "sumatra_palm_supply_agreement_2026.pdf",
        uploadDate: "2026-01-10",
        size: "1.2 MB",
        issuedAt: "2026-01-10",
        expiresAt: "2026-12-31",
      },
      {
        id: "doc-cargill-2",
        name: "EUDR Deforestation-Free Self-Declaration",
        type: "Declaration",
        fileName: "deforestation_free_self_declaration.pdf",
        uploadDate: "2026-02-15",
        size: "450 KB",
        issuedAt: "2026-02-15",
        expiresAt: "2026-08-01",
      },
      {
        id: "doc-cargill-3",
        name: "RSPO Chain of Custody Certificate",
        type: "Certificate",
        fileName: "rspo_coc_certificate_my0089.pdf",
        uploadDate: "2026-03-01",
        size: "820 KB",
        issuedAt: "2026-01-12",
        expiresAt: "2028-01-12",
      },
      {
        id: "doc-cargill-4",
        name: "Malaysia Refining & Export License",
        type: "License",
        fileName: "refining_export_license_2026.pdf",
        uploadDate: "2025-11-20",
        size: "1.8 MB",
        issuedAt: "2025-11-20",
        expiresAt: "2026-07-20",
      },
      {
        id: "doc-cargill-5",
        name: "Traceability Verification Audit Report Q4",
        type: "Audit Record",
        fileName: "traceability_verification_audit_q4.pdf",
        uploadDate: "2026-01-05",
        size: "2.4 MB",
        issuedAt: "2026-01-05",
        expiresAt: "2026-10-05",
      }
    ],
  },
  {
    id: "sup-jb-cocoa",
    name: "JB Cocoa SDN BHD",
    country: "Malaysia",
    supplierType: "Processor",
    tier: 1,
    commodities: ["COCOA"],
    onboardingStatus: "CHANGES_REQUESTED",
    declarationStatus: "REQUESTED",
    cocStatus: "MISSING",
    geolocationCoverage: 0,
    contractStatus: "LEGACY_CONTRACT",
    latestRiskLevel: "HIGH",
    facilities: ["Malaysia cocoa processing facility"],
    certifications: [],
    evidenceCount: 3,
    issues: [
      "No accepted farm-level geolocation set has been approved for upstream cocoa origin.",
      "No chain-of-custody designation was found on commercial or supporting documents.",
      "Future EU cocoa export remains blocked until supplier response is complete.",
    ],
    nextAction: "Collect declaration, farm origin file, and transaction-level cocoa provenance evidence.",
    linkedProductIds: ["prd-chocolate", "prd-wafers"],
    linkedConsignmentIds: ["con-choc-003"],
    contactPerson: "Tan Wei Min",
    address: "JB Cocoa SDN BHD, Port of Tanjung Pelepas, Johor, Malaysia",
    email: "weimin.tan@jbcocoa.com.my",
    fax: "+60 7-504 2999",
    phone: "—",
    documents: [
      {
        id: "doc-jb-1",
        name: "Cocoa Processing Agreement",
        type: "Agreement",
        fileName: "cocoa_processing_agreement_2026.pdf",
        uploadDate: "2026-01-15",
        size: "950 KB",
        issuedAt: "2026-01-15",
        expiresAt: "2026-12-31",
      },
      {
        id: "doc-jb-2",
        name: "Traceability Framework Assessment Report",
        type: "Audit Record",
        fileName: "traceability_framework_assessment_2025.pdf",
        uploadDate: "2025-12-10",
        size: "3.1 MB",
        issuedAt: "2025-12-10",
        expiresAt: "2026-07-15",
      }
    ],
  },
  {
    id: "sup-rafhan",
    name: "Rafhan Maize Products",
    country: "Pakistan",
    supplierType: "Manufacturer",
    tier: 1,
    commodities: [],
    onboardingStatus: "APPROVED",
    declarationStatus: "SIGNED",
    cocStatus: "VERIFIED",
    geolocationCoverage: 100,
    contractStatus: "EUDR_CLAUSE_PRESENT",
    latestRiskLevel: "LOW",
    facilities: ["Faisalabad Maize Refining Plant"],
    certifications: [],
    evidenceCount: 5,
    issues: [],
    nextAction: "None.",
    linkedProductIds: ["prd-chew", "prd-gum", "prd-candy", "prd-jelly"],
    linkedConsignmentIds: [],
    contactPerson: "Mr. Abdul Rehman",
    address: "Rakh Canal East Road, Faisalabad, Pakistan",
    email: "compliance@rafhanmaize.com",
    fax: "+92 41 878 1234",
    phone: "0300-8445013",
    documents: [],
  },
  {
    id: "sup-layyah",
    name: "Layyah Sugar Mills",
    country: "Pakistan",
    supplierType: "Manufacturer",
    tier: 1,
    commodities: [],
    onboardingStatus: "APPROVED",
    declarationStatus: "SIGNED",
    cocStatus: "VERIFIED",
    geolocationCoverage: 100,
    contractStatus: "EUDR_CLAUSE_PRESENT",
    latestRiskLevel: "LOW",
    facilities: ["Layyah Sugar Milling Plant"],
    certifications: [],
    evidenceCount: 5,
    issues: [],
    nextAction: "None.",
    linkedProductIds: ["prd-chew", "prd-gum", "prd-candy", "prd-chocolate", "prd-jelly", "prd-wafers"],
    linkedConsignmentIds: [],
    contactPerson: "Sajid Mahmood",
    address: "Layyah Sugar Mills, Layyah, Pakistan",
    email: "compliance@layyahsugar.com",
    fax: "+92 60 641 4321",
    phone: "0301-7484278",
    documents: [],
  },
  {
    id: "sup-na-enterprises",
    name: "N A Enterprises",
    country: "Pakistan",
    supplierType: "Intermediary Trader",
    tier: 2,
    commodities: [],
    onboardingStatus: "APPROVED",
    declarationStatus: "SIGNED",
    cocStatus: "VERIFIED",
    geolocationCoverage: 100,
    contractStatus: "EUDR_CLAUSE_PRESENT",
    latestRiskLevel: "LOW",
    facilities: ["Karachi Warehouse Distribution Hub"],
    certifications: [],
    evidenceCount: 4,
    issues: [],
    nextAction: "None.",
    linkedProductIds: ["prd-chew", "prd-gum", "prd-candy", "prd-chocolate", "prd-jelly"],
    linkedConsignmentIds: [],
    contactPerson: "Naseer Ahmed",
    address: "413, Progressive Plaza, 5CL-10 Beaumont Road, Karachi, Pakistan",
    email: "na_enterprises@cyber.net.pk",
    fax: "+92 21 3568 9876",
    phone: "0300-8292650",
    documents: [],
  },
  {
    id: "sup-takasago",
    name: "Takasago Int. Pakistan",
    country: "Pakistan",
    supplierType: "Manufacturer",
    tier: 1,
    commodities: [],
    onboardingStatus: "APPROVED",
    declarationStatus: "SIGNED",
    cocStatus: "VERIFIED",
    geolocationCoverage: 100,
    contractStatus: "EUDR_CLAUSE_PRESENT",
    latestRiskLevel: "LOW",
    facilities: ["Lahore DHA Flavour Compounding Plant"],
    certifications: [],
    evidenceCount: 4,
    issues: [],
    nextAction: "None.",
    linkedProductIds: ["prd-chew", "prd-gum", "prd-candy", "prd-jelly", "prd-wafers"],
    linkedConsignmentIds: [],
    contactPerson: "Khawaja Rizwan",
    address: "79-D Commercial DHA-EME Multan Road, opp Sports Complex, Lahore, Pakistan",
    email: "rizwan@takasago.com.pk",
    fax: "+92 42 3593 1122",
    phone: "0300-8443302",
    documents: [],
  },
  {
    id: "sup-dohler",
    name: "Dohler Pakistan",
    country: "Pakistan",
    supplierType: "Manufacturer",
    tier: 1,
    commodities: [],
    onboardingStatus: "APPROVED",
    declarationStatus: "SIGNED",
    cocStatus: "VERIFIED",
    geolocationCoverage: 100,
    contractStatus: "EUDR_CLAUSE_PRESENT",
    latestRiskLevel: "LOW",
    facilities: ["Lahore EME Society Natural Colouring Lab"],
    certifications: [],
    evidenceCount: 4,
    issues: [],
    nextAction: "None.",
    linkedProductIds: ["prd-chew"],
    linkedConsignmentIds: [],
    contactPerson: "Yavuz Selim",
    address: "85 D Commercial EME Society, Lahore, Pakistan",
    email: "selim.yavuz@doehler.com.pk",
    fax: "+92 42 3593 4321",
    phone: "3158822409",
    documents: [],
  },
  {
    id: "sup-gum-corp",
    name: "Gum Corporation",
    country: "Pakistan",
    supplierType: "Manufacturer",
    tier: 1,
    commodities: [],
    onboardingStatus: "APPROVED",
    declarationStatus: "SIGNED",
    cocStatus: "VERIFIED",
    geolocationCoverage: 100,
    contractStatus: "EUDR_CLAUSE_PRESENT",
    latestRiskLevel: "LOW",
    facilities: ["Karachi Fortune Center Refining Plant"],
    certifications: [],
    evidenceCount: 4,
    issues: [],
    nextAction: "None.",
    linkedProductIds: ["prd-gum"],
    linkedConsignmentIds: [],
    contactPerson: "Kamran Siddiqui",
    address: "902 Fortune Center, Main Shahrah-e-Faisal, Karachi, Pakistan",
    email: "info@gumcorp.com",
    fax: "+92 21 3453 1234",
    phone: "0321-2422580",
    documents: [],
  },
  {
    id: "sup-shaheen-trading",
    name: "Shaheen Trading Co",
    country: "Pakistan",
    supplierType: "Intermediary Trader",
    tier: 2,
    commodities: [],
    onboardingStatus: "APPROVED",
    declarationStatus: "SIGNED",
    cocStatus: "VERIFIED",
    geolocationCoverage: 100,
    contractStatus: "EUDR_CLAUSE_PRESENT",
    latestRiskLevel: "LOW",
    facilities: ["Lahore Ravi Park Raw Material Hub"],
    certifications: [],
    evidenceCount: 4,
    issues: [],
    nextAction: "None.",
    linkedProductIds: ["prd-gum", "prd-candy", "prd-jelly", "prd-wafers"],
    linkedConsignmentIds: [],
    contactPerson: "Shaheen Iqbal",
    address: "4A Molana Ahmad Ali Road, Ravi Park, Lahore, Pakistan",
    email: "shaheen_trading@brain.net.pk",
    fax: "+92 42 3772 9876",
    phone: "0307-4572963",
    documents: [],
  },
  {
    id: "sup-brothers-enterprises",
    name: "Brothers Enterprises",
    country: "Pakistan",
    supplierType: "Intermediary Trader",
    tier: 2,
    commodities: [],
    onboardingStatus: "APPROVED",
    declarationStatus: "SIGNED",
    cocStatus: "VERIFIED",
    geolocationCoverage: 100,
    contractStatus: "EUDR_CLAUSE_PRESENT",
    latestRiskLevel: "LOW",
    facilities: ["Lahore Kot Lakhpat Industrial Plant"],
    certifications: [],
    evidenceCount: 4,
    issues: [],
    nextAction: "None.",
    linkedProductIds: ["prd-candy", "prd-chocolate", "prd-jelly", "prd-wafers"],
    linkedConsignmentIds: [],
    contactPerson: "Zafar Iqbal",
    address: "Plot #109/16A/M, Quaid-I-Azam Industrial Estate, Kot Lakhpat, Lahore, Pakistan",
    email: "brothers@khazana.com",
    fax: "+92 42 3511 8876",
    phone: "0321-4470016",
    documents: [],
  },
  {
    id: "sup-manzoor-brothers",
    name: "Manzoor & Brothers",
    country: "Pakistan",
    supplierType: "Intermediary Trader",
    tier: 2,
    commodities: [],
    onboardingStatus: "APPROVED",
    declarationStatus: "SIGNED",
    cocStatus: "VERIFIED",
    geolocationCoverage: 100,
    contractStatus: "EUDR_CLAUSE_PRESENT",
    latestRiskLevel: "LOW",
    facilities: ["GRW Trading Hub"],
    certifications: [],
    evidenceCount: 4,
    issues: [],
    nextAction: "None.",
    linkedProductIds: ["prd-chocolate", "prd-wafers"],
    linkedConsignmentIds: [],
    contactPerson: "Tariq Manzoor",
    address: "Manzoor & Brothers, GRW, Pakistan",
    email: "tariq@manzoorbros.com.pk",
    fax: "+92 55 422 1234",
    phone: "0300-8497665",
    documents: [],
  },
  {
    id: "sup-mubashar-traders",
    name: "Mubashar Traders",
    country: "Pakistan",
    supplierType: "Intermediary Trader",
    tier: 2,
    commodities: [],
    onboardingStatus: "APPROVED",
    declarationStatus: "SIGNED",
    cocStatus: "VERIFIED",
    geolocationCoverage: 100,
    contractStatus: "EUDR_CLAUSE_PRESENT",
    latestRiskLevel: "LOW",
    facilities: ["GRW Dairy Distribution Warehouse"],
    certifications: [],
    evidenceCount: 4,
    issues: [],
    nextAction: "None.",
    linkedProductIds: ["prd-chocolate"],
    linkedConsignmentIds: [],
    contactPerson: "Mubashar Ali",
    address: "Mubashar Traders, GRW, Pakistan",
    email: "mubashar_traders@hotmail.com",
    fax: "+92 55 423 9876",
    phone: "0321-8646400",
    documents: [],
  },
  {
    id: "sup-agrotech",
    name: "Agrotech (Pvt) Ltd",
    country: "Pakistan",
    supplierType: "Manufacturer / Refiner",
    tier: 1,
    commodities: [],
    onboardingStatus: "APPROVED",
    declarationStatus: "SIGNED",
    cocStatus: "VERIFIED",
    geolocationCoverage: 100,
    contractStatus: "EUDR_CLAUSE_PRESENT",
    latestRiskLevel: "LOW",
    facilities: ["GRW Salt Processing Refinery"],
    certifications: [],
    evidenceCount: 4,
    issues: [],
    nextAction: "None.",
    linkedProductIds: ["prd-chocolate", "prd-wafers"],
    linkedConsignmentIds: [],
    contactPerson: "Dr. Kamran Malik",
    address: "Agrotech (Pvt) Ltd, GRW, Pakistan",
    email: "kamran@agrotech.com.pk",
    fax: "+92 55 424 5678",
    phone: "0321-4004499",
    documents: [],
  },
];

function toIngredient(
  id: string,
  name: string,
  hsCode: string,
  percentage: string,
  options?: {
    supplierIds?: string[];
    readiness?: IngredientRecord["readiness"];
    evidenceStatus?: IngredientRecord["evidenceStatus"];
    blockingReason?: string;
    supplyChainStatus?: IngredientRecord["supplyChainStatus"];
    forceReview?: boolean;
    scientificName?: string;
    cocModel?: string;
    supplierName?: string;
    certifications?: string;
    originCountries?: string[];
    primaryOriginCountry?: string;
    euRiskTier?: EuCountryRiskTier;
    dueDiligenceMode?: DueDiligenceMode;
    legalityDossierStatus?: IngredientLegalityStatus;
    ddsStatus?: IngredientRecord["ddsStatus"];
  },
): IngredientRecord {
  // Baseline source: docs/GFI Products-Ingredients Evaluation/GFI Products Form.md
  // Migration policy: preserve full formulation visibility, classify EUDR relevance via Annex-I-aware rule mapping.
  const base = classifyIngredientEudr(name, hsCode);
  const relevance = options?.forceReview ? "UNDER_REVIEW" : base.relevance;

  return {
    id,
    name,
    hsCode,
    commodity: base.commodity,
    relevance,
    supplierIds: options?.supplierIds ?? [],
    percentage,
    readiness:
      options?.readiness ?? (relevance === "IN_SCOPE" ? "REVIEW_REQUIRED" : "READY"),
    evidenceStatus:
      options?.evidenceStatus ?? (relevance === "IN_SCOPE" ? "PARTIAL" : "COMPLETE"),
    blockingReason:
      options?.blockingReason ??
      (relevance === "IN_SCOPE"
        ? "Evidence collection is required before this ingredient can be treated as negligible risk."
        : "None."),
    classificationSource: base.classificationSource,
    classificationNote: base.classificationNote,
    classificationConfidence: base.confidence,
    supplyChainStatus:
      options?.supplyChainStatus ?? (relevance === "IN_SCOPE" ? "NOT_REQUESTED" : "NOT_REQUESTED"),
    scientificName: options?.scientificName ?? "Not Applicable",
    cocModel: options?.cocModel ?? "Not Applicable",
    supplierName: options?.supplierName ?? "No supplier linkage",
    certifications: options?.certifications ?? "Not Applicable",
    originCountries: options?.originCountries ?? [],
    primaryOriginCountry: options?.primaryOriginCountry ?? "",
    euRiskTier: options?.euRiskTier ?? "UNKNOWN",
    dueDiligenceMode: options?.dueDiligenceMode ?? "STANDARD",
    legalityDossierStatus: options?.legalityDossierStatus ?? "MISSING",
    ddsStatus: options?.ddsStatus ?? "DRAFT",
  };
}

export const products: ProductRecord[] = [
  {
    id: "prd-chew",
    name: "Chew",
    finishedHsCode: "170490",
    primaryMarkets: ["Pakistan", "EU", "Gulf"],
    annualVolume: "4,000 tons",
    scopeStatus: "UNDER_CLASSIFICATION_REVIEW",
    exportReadiness: "REVIEW_REQUIRED",
    activeBomRevision: "BOM-CHW-2026-R3",
    operatorFlow: "COMPLIANCE_PACKAGE",
    summary:
      "Current EU flow hinges on whether hydrogenated/prepared palm fat is ultimately confirmed outside Annex I scope.",
    blockingGaps: [
      "Palm ingredient HS review is still open.",
      "Per-delivery commercial CoC evidence remains weaker than required if palm stays in scope.",
    ],
    bomHistory: ["BOM-CHW-2025-R1", "BOM-CHW-2026-R2", "BOM-CHW-2026-R3 active"],
    ingredients: [
      toIngredient("ing-chew-glucose", "Liquid Glucose (Corn Syrup)", "170230", "54.00%", {
        scientificName: "Glucose Syrup",
        cocModel: "IP",
        supplierName: "Rafhan Maize Products",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-chew-sugar", "Sugar", "170199", "32.35%", {
        scientificName: "Sucrose",
        cocModel: "SG",
        supplierName: "Layyah Sugar Mills",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-chew-dextrose", "Dextrose (Glucose Powder)", "170230", "4.25%", {
        scientificName: "Dextrose",
        cocModel: "IP",
        supplierName: "Rafhan Maize Products",
        certifications: "Not Applicable",
      }),
      toIngredient(
        "ing-chew-palm",
        "Non Hydrogenated Vegetable Fat (Palm)",
        "151329",
        "3.25%",
        {
          supplierIds: ["sup-cargill"],
          readiness: "REVIEW_REQUIRED",
          evidenceStatus: "COMPLETE",
          blockingReason:
            "Ingredient traceability is complete, but legality and plot evidence must remain current before filing.",
          supplyChainStatus: "COMPLETE",
          scientificName: "Palmitic Acid",
          cocModel: "SG",
          supplierName: "Cargill",
          certifications: "BVC-RSPO-MY008900",
        },
      ),
      toIngredient("ing-chew-starch", "Maize Starch", "110812", "3.20%", {
        scientificName: "Amylum Maydis",
        cocModel: "IP",
        supplierName: "Rafhan Maize Products",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-chew-citric", "Citric Acid", "291814", "2.20%", {
        scientificName: "Citric Acid",
        cocModel: "SG",
        supplierName: "N A Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-chew-gum", "Gum Arabic (E414)", "130120", "0.10%", {
        scientificName: "Acacia Senegal",
        cocModel: "IP",
        supplierName: "N A Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-chew-mono", "Mono & Diglycerides of Fatty Acids (E471)", "210690", "0.32%", {
        scientificName: "Fatty Acid",
        cocModel: "IP",
        supplierName: "N A Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-chew-lecithin", "Soy Lecithin (E322)", "292320", "0.01%", {
        scientificName: "Phosphatidyl Choline",
        cocModel: "SG",
        supplierName: "N A Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-chew-flavor", "Artificial Flavours", "330210", "0.31%", {
        scientificName: "Synthetic",
        cocModel: "SG",
        supplierName: "Takasago Int. Pakistan",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-chew-color", "Natural Colours (E141, E160c, E163)", "320300", "0.01%", {
        scientificName: "E141=Copper chlorophyllin, E160c=Paprika, E163=Anthocyanin",
        cocModel: "SG",
        supplierName: "Dohler Pakistan",
        certifications: "Not Applicable",
      }),
    ],
  },
  {
    id: "prd-bubble-gum",
    name: "Bubble Gum",
    finishedHsCode: "170410",
    primaryMarkets: ["Pakistan", "EU", "Gulf"],
    annualVolume: "8,000 tons",
    scopeStatus: "OUT_OF_SCOPE",
    exportReadiness: "READY",
    activeBomRevision: "BOM-BBL-2026-R1",
    operatorFlow: "COMPLIANCE_PACKAGE",
    summary:
      "No current Annex I commodity remains in the documented formulation, so the export story is a scope memo rather than a full provenance dossier.",
    blockingGaps: [],
    bomHistory: ["BOM-BBL-2026-R1 active"],
    ingredients: [
      toIngredient("ing-bubble-sugar", "Sugar", "170199", "64.00%", {
        scientificName: "Sucrose",
        cocModel: "SG",
        supplierName: "Layyah Sugar Mills",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-bubble-gumbase", "Gum Base", "382499", "18.01%", {
        scientificName: "Poly isobutylene-poly vinyl acetate",
        cocModel: "SG",
        supplierName: "Gum Corporation",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-bubble-glucose", "Liquid Glucose (Corn Syrup)", "170230", "7.11%", {
        scientificName: "Glucose Syrup",
        cocModel: "IP",
        supplierName: "Rafhan Maize Products",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-bubble-citric", "Citric Acid", "291814", "0.84%", {
        scientificName: "Citric Acid",
        cocModel: "SG",
        supplierName: "N A Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-bubble-dextrose", "Dextrose (Glucose Powder)", "170230", "7.11%", {
        scientificName: "Dextrose",
        cocModel: "IP",
        supplierName: "Rafhan Maize Products",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-bubble-coconut", "Coconut Oil", "151319", "0.23%", {
        scientificName: "Cocos Nucifera",
        cocModel: "SG",
        supplierName: "N A Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-bubble-flavor", "Artificial Flavour", "330210", "0.70%", {
        scientificName: "Synthetic",
        cocModel: "SG",
        supplierName: "Takasago Int. Pakistan",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-bubble-color", "Artificial Colours (E102, E129, E133)", "320411", "0.01%", {
        scientificName: "E102=Tartrazine; E129=Allura Red; E133=Brilliant Blue",
        cocModel: "SG",
        supplierName: "Shaheen Trading Co",
        certifications: "Not Applicable",
      }),
    ],
  },
  {
    id: "prd-hard-candy",
    name: "Hard Boiled Candy",
    finishedHsCode: "170490",
    primaryMarkets: ["Pakistan", "EU", "Gulf"],
    annualVolume: "3,000 tons",
    scopeStatus: "OUT_OF_SCOPE",
    exportReadiness: "READY",
    activeBomRevision: "BOM-HBC-2026-R2",
    operatorFlow: "COMPLIANCE_PACKAGE",
    summary:
      "Current EU export flow is treated as out of scope with retained classification evidence.",
    blockingGaps: [],
    bomHistory: ["BOM-HBC-2025-R1", "BOM-HBC-2026-R2 active"],
    ingredients: [
      toIngredient("ing-hard-glucose", "Liquid Glucose (Corn Syrup)", "170230", "39.00%", {
        scientificName: "Glucose Syrup",
        cocModel: "IP",
        supplierName: "Rafhan Maize Products",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-hard-sugar", "Sugar", "170199", "47.30%", {
        scientificName: "Sucrose",
        cocModel: "SG",
        supplierName: "Layyah Sugar Mills",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-hard-citric", "Citric Acid", "291814", "7.60%", {
        scientificName: "Citric Acid",
        cocModel: "SG",
        supplierName: "N A Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-hard-dextrose", "Dextrose (Glucose Powder)", "170230", "5.19%", {
        scientificName: "Dextrose",
        cocModel: "IP",
        supplierName: "Rafhan Maize Products",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-hard-malic", "Malic Acid", "291819", "0.40%", {
        scientificName: "Malic Acid",
        cocModel: "SG",
        supplierName: "N A Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-hard-maltodextrin", "Maltodextrin", "17029030", "0.10%", {
        scientificName: "Maltodextrin",
        cocModel: "SG",
        supplierName: "Brothers Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-hard-carnauba", "Carnauba Wax", "152110", "0.10%", {
        scientificName: "Copernicia cerifera",
        cocModel: "SG",
        supplierName: "Brothers Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-hard-flavor", "Artificial Flavours", "330210", "0.30%", {
        scientificName: "Synthetic",
        cocModel: "SG",
        supplierName: "Takasago Int. Pakistan",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-hard-color", "Artificial Colours (E102, E129, E133)", "320411", "0.01%", {
        scientificName: "E102=Tartrazine; E129=Allura Red; E133=Brilliant Blue",
        cocModel: "SG",
        supplierName: "Shaheen Trading Co",
        certifications: "Not Applicable",
      }),
    ],
  },
  {
    id: "prd-chocolate",
    name: "Chocolate",
    finishedHsCode: "180690",
    primaryMarkets: ["Pakistan", "Future EU"],
    annualVolume: "1,000 tons",
    scopeStatus: "IN_SCOPE",
    exportReadiness: "NOT_READY",
    activeBomRevision: "BOM-CHO-2026-R4",
    operatorFlow: "COMPLIANCE_PACKAGE",
    summary:
      "Future EU export remains blocked because the cocoa path is in-scope and lacks accepted provenance and CoC evidence.",
    blockingGaps: [
      "JB Cocoa lacks accepted plot provenance package.",
      "Undisclosed source (Indococoa) via N A Enterprises is not fully onboarded.",
      "No cocoa CoC evidence exists on commercial documents.",
    ],
    bomHistory: ["BOM-CHO-2025-R2", "BOM-CHO-2026-R3", "BOM-CHO-2026-R4 active"],
    ingredients: [
      toIngredient("ing-choc-sugar", "Sugar", "170199", "59.30%", {
        scientificName: "Sucrose",
        cocModel: "SG",
        supplierName: "Layyah Sugar Mills",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-choc-palm", "Vegetable Fat", "151329", "24.20%", {
        supplierIds: ["sup-cargill"],
        readiness: "REVIEW_REQUIRED",
        evidenceStatus: "PARTIAL",
        blockingReason: "Palm remains secondary to the cocoa blocker, but its own provenance evidence is still active and in scope.",
        supplyChainStatus: "IN_PROGRESS",
        scientificName: "Palmitic Acid",
        cocModel: "SG",
        supplierName: "Cargill",
        certifications: "BVC-RSPO-MY008900",
      }),
      toIngredient("ing-choc-wheat", "Wheat Flour", "110100", "7.70%", {
        scientificName: "Triticum aestivum",
        cocModel: "SG",
        supplierName: "Manzoor & Brothers",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-choc-cocoa-natural", "Natural cocoa powder", "180500", "5.85%", {
        supplierIds: ["sup-jb-cocoa"],
        readiness: "BLOCKED",
        evidenceStatus: "MISSING",
        blockingReason: "No accepted geolocation or CoC evidence from JB Cocoa.",
        supplyChainStatus: "GAPS_FOUND",
        scientificName: "Theobroma cacao",
        cocModel: "SG",
        supplierName: "JB Cocoa SDN BHD Malaysia",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-choc-cocoa-alkalized", "Alkalized cocoa powder", "180500", "2.00%", {
        supplierIds: ["sup-na-enterprises"],
        readiness: "BLOCKED",
        evidenceStatus: "MISSING",
        blockingReason: "Undisclosed source (Indococoa) supplied via N A Enterprises remains unassessed.",
        supplyChainStatus: "REQUESTED",
        scientificName: "Theobroma cacao",
        cocModel: "SG",
        supplierName: "N A Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-choc-milk", "Milk Powder", "040210", "1.00%", {
        scientificName: "Milk Powder",
        cocModel: "SG",
        supplierName: "Mubashar Traders",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-choc-lecithin", "Soy Lecithin (E322)", "292320", "0.80%", {
        scientificName: "Phosphatidyl Choline",
        cocModel: "SG",
        supplierName: "N A Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-choc-whey", "Whey Powder", "040410", "0.60%", {
        scientificName: "Lactoserum",
        cocModel: "SG",
        supplierName: "Mubashar Traders",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-choc-salt", "Salt", "250100", "0.10%", {
        scientificName: "Sodium Chloride",
        cocModel: "SG",
        supplierName: "Agrotech (Pvt) Ltd",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-choc-bicarb", "Sodium Bicarbonate", "283630", "0.01%", {
        scientificName: "Sodium Bicarbonate",
        cocModel: "SG",
        supplierName: "Brothers Enterprises",
        certifications: "Not Applicable",
      }),
    ],
  },
  {
    id: "prd-wafers",
    name: "Wafers",
    finishedHsCode: "190532",
    primaryMarkets: ["Pakistan", "Future EU"],
    annualVolume: "300 tons",
    scopeStatus: "FUTURE_EXPORT_BLOCKED",
    exportReadiness: "NOT_READY",
    activeBomRevision: "BOM-WAF-2026-R2",
    operatorFlow: "COMPLIANCE_PACKAGE",
    summary:
      "Future EU entry requires final cocoa-path confirmation and palm scope resolution before any operator handoff can occur.",
    blockingGaps: [
      "Cocoa provenance package is not yet accepted.",
      "Palm scope decision remains open.",
    ],
    bomHistory: ["BOM-WAF-2026-R1", "BOM-WAF-2026-R2 active"],
    ingredients: [
      toIngredient("ing-waf-sugar", "Sugar", "170199", "16.55%", {
        scientificName: "Sucrose",
        cocModel: "SG",
        supplierName: "Layyah Sugar Mills",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-waf-palm", "Vegetable fat", "151329", "18.60%", {
        supplierIds: ["sup-cargill"],
        readiness: "REVIEW_REQUIRED",
        evidenceStatus: "PARTIAL",
        blockingReason: "Palm provenance evidence is still being completed before EU readiness can move forward.",
        supplyChainStatus: "IN_PROGRESS",
        scientificName: "Palmitic Acid",
        cocModel: "SG",
        supplierName: "Cargill",
        certifications: "BVC-RSPO-MY008900",
      }),
      toIngredient("ing-waf-wheat", "Wheat Flour", "110100", "62.95%", {
        scientificName: "Triticum aestivum",
        cocModel: "SG",
        supplierName: "Manzoor & Brothers",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-waf-salt", "Salt", "250100", "0.25%", {
        scientificName: "Sodium Chloride",
        cocModel: "SG",
        supplierName: "Agrotech (Pvt) Ltd",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-waf-starch", "Maize Starch", "110812", "0.23%", {
        scientificName: "Amylum Maydis",
        cocModel: "IP",
        supplierName: "Rafhan Maize Products",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-waf-bicarb", "Sodium Bicarbonate", "283630", "0.10%", {
        scientificName: "Sodium Bicarbonate",
        cocModel: "SG",
        supplierName: "Brothers Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-waf-flavor", "Artificial Flavours", "320210", "0.05%", {
        scientificName: "Synthetic",
        cocModel: "SG",
        supplierName: "Takasago Int. Pakistan",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-waf-color", "Artificial Colours (E102, E129, E133)", "320411", "0.02%", {
        scientificName: "E102=Tartrazine; E129=Allura Red; E133=Brilliant Blue",
        cocModel: "SG",
        supplierName: "Shaheen Trading Co",
        certifications: "Not Applicable",
      }),
    ],
  },
  {
    id: "prd-jelly",
    name: "Jelly",
    finishedHsCode: "170490",
    primaryMarkets: ["Pakistan"],
    annualVolume: "10 tons",
    scopeStatus: "OUT_OF_SCOPE",
    exportReadiness: "READY",
    activeBomRevision: "BOM-JEL-2026-R1",
    operatorFlow: "COMPLIANCE_PACKAGE",
    summary: "Exempt formulation with no Annex I forest risk commodities.",
    blockingGaps: [],
    bomHistory: ["BOM-JEL-2026-R1 active"],
    ingredients: [
      toIngredient("ing-jel-sugar", "Sugar", "170199", "42.30%", {
        scientificName: "Sucrose",
        cocModel: "SG",
        supplierName: "Layyah Sugar Mills",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-jel-water", "Water", "220100", "28.00%", {
        scientificName: "Hydrogen Oxide",
        cocModel: "IP",
        supplierName: "No supplier linkage required",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-jel-glucose", "Liquid Glucose (Corn Syrup)", "170230", "20.00%", {
        scientificName: "Glucose Syrup",
        cocModel: "IP",
        supplierName: "Rafhan Maize Products",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-jel-dextrose", "Dextrose (Glucose Powder)", "170230", "5.70%", {
        scientificName: "Dextrose",
        cocModel: "IP",
        supplierName: "Rafhan Maize Products",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-jel-pectin", "Pectin (E440)", "130220", "1.50%", {
        scientificName: "Beta D Galactopyranuronic Acid",
        cocModel: "IP",
        supplierName: "Brothers Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-jel-citric", "Citric Acid", "291814", "0.65%", {
        scientificName: "Citric Acid",
        cocModel: "SG",
        supplierName: "N A Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-jel-gum", "Gum Arabic (E414)", "130120", "0.50%", {
        scientificName: "Acacia Senegal",
        cocModel: "IP",
        supplierName: "N A Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-jel-malic", "Malic Acid", "291819", "0.32%", {
        scientificName: "Malic Acid",
        cocModel: "SG",
        supplierName: "N A Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-jel-citrate", "Sodium Citrate (E331)", "291815", "0.30%", {
        scientificName: "Sodium Citrate",
        cocModel: "SG",
        supplierName: "Brothers Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-jel-benzoate", "Sodium Benzoate (E211)", "291631", "0.10%", {
        scientificName: "Sodium Benzoate",
        cocModel: "SG",
        supplierName: "Brothers Enterprises",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-jel-oil", "Vegetable Oil (Corn)", "151529", "0.20%", {
        scientificName: "Zea Mays",
        cocModel: "Not Applicable",
        supplierName: "Rafhan Maize Products",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-jel-flavor", "Artificial Flavours", "330210", "0.42%", {
        scientificName: "Synthetic",
        cocModel: "SG",
        supplierName: "Takasago Int. Pakistan",
        certifications: "Not Applicable",
      }),
      toIngredient("ing-jel-color", "Artificial Colours (E102, E129, E133)", "320411", "0.01%", {
        scientificName: "E102=Tartrazine; E129=Allura Red; E133=Brilliant Blue",
        cocModel: "SG",
        supplierName: "Shaheen Trading Co",
        certifications: "Not Applicable",
      }),
    ],
  },
];

export const plots: PlotRecord[] = [
  {
    id: "plot-jb-01",
    supplierId: "sup-jb-cocoa",
    label: "Sassandra grower cluster A",
    sourceCountry: "Ivory Coast",
    geoType: "POINT",
    areaHa: 2.8,
    status: "CHANGES_REQUESTED",
    provenanceFlow: "Cocoa / future EU chocolate path",
    coordinatesSummary: "12 smallholder points submitted, 2 coordinates outside declared district boundary.",
    latestDeforestationStatus: "NOT_STARTED",
    notes: [
      "Returned for correction because the uploaded coordinate file mixed district labels.",
      "Cannot enter deforestation analysis until approval is complete.",
    ],
  },
  {
    id: "plot-jb-02",
    supplierId: "sup-jb-cocoa",
    label: "Ghana cooperative parcel set 12",
    sourceCountry: "Ghana",
    geoType: "POINT",
    areaHa: 3.1,
    status: "PENDING_APPROVAL",
    provenanceFlow: "Cocoa / future EU wafer path",
    coordinatesSummary: "Farm points uploaded through processor response package; review is pending.",
    latestDeforestationStatus: "PENDING",
    notes: [
      "Awaiting compliance review and supporting grower manifest cross-check.",
    ],
  },
  {
    id: "plot-cargill-01",
    supplierId: "sup-cargill",
    label: "Sabah plantation reference set",
    sourceCountry: "Malaysia",
    geoType: "POLYGON",
    areaHa: 24.4,
    status: "REQUESTED",
    provenanceFlow: "Palm / scope review path",
    coordinatesSummary: "No plantation geometry has been supplied yet because scope confirmation is still being decided.",
    latestDeforestationStatus: "NOT_STARTED",
    notes: [
      "Request kept visible so operators understand provenance work is not complete if palm remains in scope.",
    ],
  },
  {
    id: "plot-demo-approved",
    supplierId: "sup-jb-cocoa",
    label: "Training sandbox parcel - superseded",
    sourceCountry: "Ivory Coast",
    geoType: "POLYGON",
    areaHa: 5.2,
    status: "SUPERSEDED",
    provenanceFlow: "Demonstration lineage history",
    coordinatesSummary: "Old polygon used in internal training; later replaced by corrected geometry.",
    latestDeforestationStatus: "CLEAR",
    notes: [
      "Used to demonstrate superseded provenance history in the dummy UI.",
    ],
  },
];

export const deforestationCases: DeforestationCase[] = [
  {
    id: "def-jb-02",
    plotId: "plot-jb-02",
    provider: "Deterministic baseline adapter",
    resultStatus: "PENDING",
    decisionDate: "2026-05-21",
    downstreamImpact: "REVIEW_REQUIRED",
    summary: "Analysis queued but not yet finalized because the plot approval review is still pending.",
    evidenceArtifact: "deforestation-gfi-jb-02.json",
  },
  {
    id: "def-demo-01",
    plotId: "plot-demo-approved",
    provider: "Deterministic baseline adapter",
    resultStatus: "CLEAR",
    decisionDate: "2026-04-18",
    downstreamImpact: "NO_BLOCK",
    summary: "No post-2020 forest loss detected on the approved polygon snapshot.",
    evidenceArtifact: "deforestation-demo-approved.json",
  },
  {
    id: "def-demo-00",
    plotId: "plot-demo-approved",
    provider: "Archived manual review",
    resultStatus: "SUPERSEDED",
    decisionDate: "2026-03-02",
    downstreamImpact: "REVIEW_REQUIRED",
    summary: "Earlier analyst memo was replaced after geometry correction.",
    evidenceArtifact: "deforestation-demo-superseded.pdf",
  },
];

export const riskSubjects: RiskSubjectRecord[] = [
  {
    id: "risk-sup-jb",
    subjectType: "SUPPLIER",
    subjectId: "sup-jb-cocoa",
    name: "JB Cocoa SDN BHD",
    latestLevel: "HIGH",
    workflowStatus: "BLOCKING",
    methodology: "GFI 6-pillar view mapped to Article 10 criteria",
    criteria: [
      {
        code: "B3-COCOA-GEO",
        title: "Farm provenance completeness",
        level: "CRITICAL",
        rationale: "No accepted plot package is approved for the cocoa chain.",
      },
      {
        code: "B4-COC-EVIDENCE",
        title: "Transaction-level CoC evidence",
        level: "HIGH",
        rationale: "No chain-of-custody designation was found on JB Cocoa commercial documents.",
      },
    ],
    mitigations: [
      "Collect processor declaration and grower origin manifest.",
      "Add commercial document wording for chain-of-custody reference.",
    ],
    history: [
      "2026-05-20: escalated after GFI on-site finding review.",
      "2026-05-22: remained blocking pending supplier response.",
    ],
  },
  {
    id: "risk-prd-chew",
    subjectType: "PRODUCT",
    subjectId: "prd-chew",
    name: "Chew",
    latestLevel: "MEDIUM",
    workflowStatus: "MITIGATION_PENDING",
    methodology: "Scope review plus operational evidence readiness",
    criteria: [
      {
        code: "B2-HS-REVIEW",
        title: "Palm HS classification certainty",
        level: "HIGH",
        rationale: "Scope remains under customs-confirmed review.",
      },
      {
        code: "B4-ERP-ENRICHMENT",
        title: "Commercial trace evidence",
        level: "MEDIUM",
        rationale: "ERP lacks CoC and HS enrichments, so the evidence path is manual.",
      },
    ],
    mitigations: [
      "Finalize customs interpretation for hydrogenated / prepared palm fat route.",
      "Request improved per-delivery CoC wording from Cargill.",
    ],
    history: [
      "2026-05-18: moved from low to medium after palm classification review reopened.",
    ],
  },
  {
    id: "risk-con-choc",
    subjectType: "CONSIGNMENT",
    subjectId: "con-choc-003",
    name: "Future EU chocolate launch consignment",
    latestLevel: "CRITICAL",
    workflowStatus: "BLOCKING",
    methodology: "Consignment gate rollup from traceability, supplier, geo, deforestation, and agent readiness",
    criteria: [
      {
        code: "GATE-TRACEABILITY",
        title: "Complete cocoa lineage",
        level: "CRITICAL",
        rationale: "Supplier and plot lineage are both incomplete.",
      },
      {
        code: "GATE-AGENT-READINESS",
        title: "Receiving operator readiness",
        level: "MEDIUM",
        rationale: "Assigned EU agent still requires TRACES confirmation.",
      },
    ],
    mitigations: [
      "Close supplier onboarding and geolocation gaps before any export planning moves forward.",
      "Confirm operator agent TRACES status before packaging output.",
    ],
    history: [
      "2026-05-22: remained fully blocked as part of future export planning.",
    ],
  },
];

export const traceabilityCases: TraceabilityCase[] = [
  {
    id: "trace-reverse-chew",
    mode: "REVERSE",
    rootReference: "GFI-EU-CHEW-2026-002",
    completeness: "PENDING_REVIEW",
    chainOfCustodySummary: "Shipment -> batch -> goods receipt -> Cargill palm flow, with scope review still open.",
    supersession: "Latest effective traceability record v3.",
    nodes: [
      {
        label: "Consignment GFI-EU-CHEW-2026-002",
        entityType: "CONSIGNMENT",
        status: "WARNING",
        sourceRef: "Chew export candidate",
        evidenceCount: 4,
        note: "Shipment is held in scope-review state rather than fully blocked.",
      },
      {
        label: "Batch CHW-2026-044",
        entityType: "BATCH",
        status: "CLEAR",
        sourceRef: "SAP production order 44871",
        evidenceCount: 2,
        note: "Batch-to-receipt linkage is available from ERP import.",
      },
      {
        label: "Goods receipt GRN-CARG-1021",
        entityType: "GOODS_RECEIPT",
        status: "CLEAR",
        sourceRef: "Invoice, delivery note, and palm chain trade proof reconciled.",
        evidenceCount: 4,
        note: "Commercial and support records now align with the upstream palm provenance pack.",
      },
      {
        label: "Supplier Cargill Palm Products",
        entityType: "SUPPLIER",
        status: "CLEAR",
        sourceRef: "Complete supplier declaration, upstream trade desk, mill, and producer records",
        evidenceCount: 8,
        note: "Plantation and smallholder provenance is complete; only the HS scope decision remains open.",
      },
    ],
    gaps: [
      "Palm classification remains under review.",
    ],
  },
  {
    id: "trace-reverse-chocolate",
    mode: "REVERSE",
    rootReference: "GFI-EU-CHOC-2026-003",
    completeness: "BLOCKED",
    chainOfCustodySummary: "Future chocolate shipment depends on JB Cocoa and N A Enterprises (Indococoa) provenance packs that are not complete.",
    supersession: "Latest effective traceability record v5.",
    nodes: [
      {
        label: "Consignment GFI-EU-CHOC-2026-003",
        entityType: "CONSIGNMENT",
        status: "BLOCKED",
        sourceRef: "Future export planning",
        evidenceCount: 2,
        note: "Consignment is blocked before package generation.",
      },
      {
        label: "Batch CHOC-2026-010",
        entityType: "BATCH",
        status: "WARNING",
        sourceRef: "SAP batch + manual cocoa split note",
        evidenceCount: 1,
        note: "ERP data exists but lacks EUDR enrichment for supplier cocoa split.",
      },
      {
        label: "Supplier JB Cocoa",
        entityType: "SUPPLIER",
        status: "BLOCKED",
        sourceRef: "No accepted origin files",
        evidenceCount: 1,
        note: "No approved plot package.",
      },
      {
        label: "Supplier N A Enterprises (Indococoa)",
        entityType: "SUPPLIER",
        status: "BLOCKED",
        sourceRef: "Discovered on-site, not fully assessed",
        evidenceCount: 0,
        note: "Supplier onboarding and provenance are both incomplete.",
      },
    ],
    gaps: [
      "Missing cocoa farm geolocation for both suppliers.",
      "No cocoa transaction-level chain-of-custody evidence.",
      "Undisclosed processor Indococoa (supplied via N A Enterprises) remains unresolved.",
    ],
  },
  {
    id: "trace-forward-indococoa",
    mode: "FORWARD",
    rootReference: "LOT-NA-INDOCOCOA-HPA01",
    completeness: "INCOMPLETE",
    chainOfCustodySummary: "Forward trace from N A Enterprises (Indococoa lot) shows impacted product planning but no releasable shipment.",
    supersession: "Forward trace snapshot v2.",
    nodes: [
      {
        label: "Goods receipt NA-INDO-GRN-002",
        entityType: "GOODS_RECEIPT",
        status: "WARNING",
        sourceRef: "Manual supplier discovery record",
        evidenceCount: 1,
        note: "Lot exists in planning notes, not in the original declared supplier register.",
      },
      {
        label: "Batch CHOC-2026-010",
        entityType: "BATCH",
        status: "WARNING",
        sourceRef: "Future chocolate pilot batch",
        evidenceCount: 1,
        note: "Used in formulation planning.",
      },
      {
        label: "Consignment GFI-EU-CHOC-2026-003",
        entityType: "CONSIGNMENT",
        status: "BLOCKED",
        sourceRef: "Future export hold",
        evidenceCount: 0,
        note: "No compliance package can be released for this path.",
      },
    ],
    gaps: [
      "Supplier onboarding incomplete.",
      "No acceptable origin evidence has been linked to the lot.",
    ],
  },
];

export const consignments: ConsignmentRecord[] = [
  {
    id: "con-bubblegum-001",
    reference: "GFI-EU-BBL-2026-001",
    destination: "Hamburg, Germany",
    operatorAgentId: "agent-fos-eu",
    shipmentMode: "CURRENT_EXPORT",
    lineSummary: ["Bubble Gum / HS 170410 / out-of-scope memo attached"],
    gateStatus: "READY",
    outputEligibility: "PACKAGE_READY",
    traceabilityStatus: "TRACEABLE",
    policyNarrative:
      "This consignment uses the GFI compliance-package flow with an out-of-scope memo rather than a commodity provenance package.",
    issues: [],
    nextAction: "Release package to operator agent with scope memo and supporting classification evidence.",
    // Dispatch Checklist Data
    saleOrderNo: "2005023",
    dispatchDate: "10-04-2026",
    invoiceNo: "5227",
    customerRefNo: "02",
    pfaNo: "6420",
    country: "Jordan",
    containerNo: "TLLU-277374-7",
    containerSize: "20ft",
    cbm: 33,
    weightLimitKg: 10925,
    grossWeightTons: 10.91276,
    sealNo: "004640+047958",
    truckNo: "TKC-262",
    masterCaseColor: "WHITE",
    logoOnCarton: "CUSTOMER",
    tapeOnCarton: "CUSTOMER",
    cleanedBeforeLoading: true,
    fitForLoading: true,
    specialRemarks: "100% Load (10 Blue Racks)",
    placeOfLoading: "STATE TWO",
    loadingTime: "10:00:00",
    totalCartons: 1450,
    totalDipsCartons: 1369,
    checkedByExport: "Hadi & Waqas",
    qualityInspector: "Noman Afzal",
    countBy: "Imran",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "3147",
        productName: "Buster Tangy Candy Mix",
        packingDesc: "16gx24pcsx12box",
        section: "Estate-1",
        totalCartons: 250,
        dipsCartons: 250,
        lotNo: "24036IBTCM16",
        mfgDate: "25-03-2026",
        expDate: "25-03-2028",
        grossWtKg: 7.04,
        totalGrossWtKg: 1760,
      },
      {
        sr: 2,
        finalCode: "3031",
        productName: "Stripple Taffy Rope",
        packingDesc: "25gx24pcsx12box",
        section: "Chew",
        totalCartons: 350,
        dipsCartons: 348,
        lotNo: "22036STR25",
        mfgDate: "25-03-2026",
        expDate: "25-03-2028",
        grossWtKg: 9.2,
        totalGrossWtKg: 3201.6,
      },
      {
        sr: 3,
        finalCode: "4829",
        productName: "Fruties Tape Chew Assorted New",
        packingDesc: "15gx24pcsx12box",
        section: "Chew",
        totalCartons: 225,
        dipsCartons: 219,
        lotNo: "22036FTCA15",
        mfgDate: "25-03-2026",
        expDate: "25-03-2028",
        grossWtKg: 6.6,
        totalGrossWtKg: 1445.4,
      },
      {
        sr: 4,
        finalCode: "2158",
        productName: "Gum Fries Bubble Gum",
        packingDesc: "15gx24pcsx12box",
        section: "Bubble",
        totalCartons: 300,
        dipsCartons: 285,
        lotNo: "21036GFB15",
        mfgDate: "25-03-2026",
        expDate: "25-03-2028",
        grossWtKg: 6.46,
        totalGrossWtKg: 1841.1,
      },
      {
        sr: 5,
        finalCode: "4666",
        productName: "Whacky Chew Bar Twin Assorted",
        packingDesc: "28gx24pcsx12box",
        section: "Chew",
        totalCartons: 325,
        dipsCartons: 267,
        lotNo: "23036WCBT28",
        mfgDate: "25-03-2026",
        expDate: "25-03-2028",
        grossWtKg: 9.98,
        totalGrossWtKg: 2664.66,
      },
    ],
  },
  {
    id: "con-chew-002",
    reference: "GFI-EU-CHEW-2026-002",
    destination: "Rotterdam, Netherlands",
    operatorAgentId: "agent-rhine-bv",
    shipmentMode: "CURRENT_EXPORT",
    lineSummary: ["Chew / HS 170490 / palm ingredient traceability complete, scope still under review"],
    gateStatus: "REVIEW_REQUIRED",
    outputEligibility: "SCOPE_REVIEW",
    traceabilityStatus: "TRACEABLE",
    policyNarrative:
      "Shipment has a complete ingredient provenance pack, but it remains in review because the palm route is still pending HS scope confirmation.",
    issues: [
      {
        code: "PALM_SCOPE_REVIEW",
        severity: "HIGH",
        sourceDomain: "products",
        blocking: true,
        message: "Palm ingredient remains under classification review and cannot yet be treated as closed.",
      },
    ],
    nextAction: "Hold package release until scope decision is documented and agent readiness is reconfirmed.",
    // Dispatch Checklist Data
    saleOrderNo: "2005089",
    dispatchDate: "12-04-2026",
    invoiceNo: "5231",
    customerRefNo: "07",
    pfaNo: "6435",
    country: "Netherlands",
    containerNo: "MSCU-884312-6",
    containerSize: "40ft",
    cbm: 67,
    weightLimitKg: 21700,
    grossWeightTons: 18.47,
    sealNo: "007812+009341",
    truckNo: "LHR-448",
    masterCaseColor: "BROWN",
    logoOnCarton: "GFI",
    tapeOnCarton: "GFI",
    cleanedBeforeLoading: true,
    fitForLoading: true,
    specialRemarks: "Palletized — 22 pallets, stretch-wrapped",
    placeOfLoading: "DOCK A3",
    loadingTime: "08:30:00",
    totalCartons: 1820,
    totalDipsCartons: 1798,
    checkedByExport: "Sana Malik",
    qualityInspector: "Tahir Hussain",
    countBy: "Bilal Ahmed",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "3031",
        productName: "Stripple Taffy Rope",
        packingDesc: "25gx24pcsx12box",
        section: "Chew",
        totalCartons: 480,
        dipsCartons: 475,
        lotNo: "22036STR25-B",
        mfgDate: "01-04-2026",
        expDate: "01-04-2028",
        grossWtKg: 9.2,
        totalGrossWtKg: 4416,
      },
      {
        sr: 2,
        finalCode: "4829",
        productName: "Fruties Tape Chew Assorted New",
        packingDesc: "15gx24pcsx12box",
        section: "Chew",
        totalCartons: 560,
        dipsCartons: 553,
        lotNo: "22036FTCA15-C",
        mfgDate: "01-04-2026",
        expDate: "01-04-2028",
        grossWtKg: 6.6,
        totalGrossWtKg: 3696,
      },
      {
        sr: 3,
        finalCode: "4666",
        productName: "Whacky Chew Bar Twin Assorted",
        packingDesc: "28gx24pcsx12box",
        section: "Chew",
        totalCartons: 780,
        dipsCartons: 770,
        lotNo: "23036WCBT28-D",
        mfgDate: "01-04-2026",
        expDate: "01-04-2028",
        grossWtKg: 9.98,
        totalGrossWtKg: 7784.4,
      },
    ],
  },
  {
    id: "con-choc-003",
    reference: "GFI-EU-CHOC-2026-003",
    destination: "Le Havre, France",
    operatorAgentId: "agent-rhine-bv",
    shipmentMode: "FUTURE_EXPORT",
    lineSummary: ["Chocolate / HS 180690 / cocoa origin path unresolved"],
    gateStatus: "BLOCKED",
    outputEligibility: "HELD",
    traceabilityStatus: "BLOCKED",
    policyNarrative:
      "Future chocolate export remains fail-closed because the cocoa chain is in scope and upstream evidence is incomplete.",
    issues: [
      {
        code: "COCOA_GEO_MISSING",
        severity: "CRITICAL",
        sourceDomain: "geolocation",
        blocking: true,
        message: "No approved cocoa farm geolocation package exists for the shipment's source chain.",
      },
      {
        code: "INDOCOCOA_UNASSESSED",
        severity: "CRITICAL",
        sourceDomain: "suppliers",
        blocking: true,
        message: "Undisclosed processor Indococoa (supplied via N A Enterprises) is not fully onboarded and remains an undisclosed supplier blocker.",
      },
      {
        code: "COCOA_COC_MISSING",
        severity: "HIGH",
        sourceDomain: "documents",
        blocking: true,
        message: "No transaction-level cocoa chain-of-custody evidence has been linked.",
      },
    ],
    nextAction: "Keep shipment blocked and route supplier response tasks through the upstream portal.",
    // Dispatch Checklist Data (partial — blocked shipment)
    saleOrderNo: "2005101",
    dispatchDate: "—",
    invoiceNo: "5238",
    customerRefNo: "—",
    pfaNo: "—",
    country: "France",
    containerNo: "PENDING",
    containerSize: "40ft HC",
    cbm: undefined,
    weightLimitKg: 26500,
    grossWeightTons: undefined,
    sealNo: "—",
    truckNo: "—",
    masterCaseColor: "WHITE",
    logoOnCarton: "CUSTOMER",
    tapeOnCarton: "CUSTOMER",
    cleanedBeforeLoading: false,
    fitForLoading: false,
    notFitReason: "Shipment blocked pending upstream cocoa traceability resolution.",
    specialRemarks: "Do not load until gate clearance is obtained.",
    placeOfLoading: "TBD",
    loadingTime: "—",
    totalCartons: undefined,
    totalDipsCartons: undefined,
    checkedByExport: "—",
    qualityInspector: "—",
    countBy: "—",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "1801",
        productName: "Dark Chocolate Slab",
        packingDesc: "100gx12pcsx12box",
        section: "Chocolate",
        totalCartons: 600,
        dipsCartons: 0,
        lotNo: "PENDING",
        mfgDate: "—",
        expDate: "—",
        grossWtKg: 17.28,
        totalGrossWtKg: 10368,
      },
      {
        sr: 2,
        finalCode: "1823",
        productName: "Milk Chocolate Assorted Bites",
        packingDesc: "150gx8pcsx12box",
        section: "Chocolate",
        totalCartons: 420,
        dipsCartons: 0,
        lotNo: "PENDING",
        mfgDate: "—",
        expDate: "—",
        grossWtKg: 15.84,
        totalGrossWtKg: 6652.8,
      },
    ],
  },
  {
    id: "con-gum-004",
    reference: "GFI-EU-GUM-2026-004",
    destination: "Antwerp, Belgium",
    operatorAgentId: "agent-fos-eu",
    shipmentMode: "CURRENT_EXPORT",
    lineSummary: ["Bubble Gum / HS 170410 / scope memo attached"],
    gateStatus: "READY",
    outputEligibility: "PACKAGE_READY",
    traceabilityStatus: "TRACEABLE",
    policyNarrative:
      "This release-ready bubble gum route uses the established out-of-scope memo package and current dispatch evidence set.",
    issues: [],
    nextAction: "Release package to operator agent with scope memo and dispatch evidence set.",
    saleOrderNo: "2005110",
    dispatchDate: "15-04-2026",
    invoiceNo: "5241",
    customerRefNo: "09",
    pfaNo: "6441",
    country: "Belgium",
    containerNo: "CMAU-551204-2",
    containerSize: "20ft",
    cbm: 31,
    weightLimitKg: 11800,
    grossWeightTons: 11.3616,
    sealNo: "008112+008113",
    truckNo: "KHI-204",
    masterCaseColor: "WHITE",
    logoOnCarton: "GFI",
    tapeOnCarton: "GFI",
    cleanedBeforeLoading: true,
    fitForLoading: true,
    specialRemarks: "9 pallets; release-ready under current scope memo.",
    placeOfLoading: "STATE TWO",
    loadingTime: "09:15:00",
    totalCartons: 1580,
    totalDipsCartons: 1508,
    checkedByExport: "Hadi & Waqas",
    qualityInspector: "Noman Afzal",
    countBy: "Imran",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "5172",
        productName: "Bubble Gum Sour Belts",
        packingDesc: "20gx24pcsx12box",
        section: "Bubble",
        totalCartons: 780,
        dipsCartons: 744,
        lotNo: "25042BGSB20",
        mfgDate: "04-04-2026",
        expDate: "04-04-2028",
        grossWtKg: 7.92,
        totalGrossWtKg: 6177.6,
      },
      {
        sr: 2,
        finalCode: "2158",
        productName: "Gum Fries Bubble Gum",
        packingDesc: "15gx24pcsx12box",
        section: "Bubble",
        totalCartons: 800,
        dipsCartons: 764,
        lotNo: "25042GFB15",
        mfgDate: "04-04-2026",
        expDate: "04-04-2028",
        grossWtKg: 6.48,
        totalGrossWtKg: 5184,
      },
    ],
  },
  {
    id: "con-candy-005",
    reference: "GFI-EU-CND-2026-005",
    destination: "Bremerhaven, Germany",
    operatorAgentId: "agent-fos-eu",
    shipmentMode: "CURRENT_EXPORT",
    lineSummary: ["Hard boiled candy / HS 170490 / non-EUDR route complete"],
    gateStatus: "READY",
    outputEligibility: "PACKAGE_READY",
    traceabilityStatus: "TRACEABLE",
    policyNarrative:
      "Current export candy route is supported by non-EUDR formulation evidence and a complete dispatch package.",
    issues: [],
    nextAction: "Release package to operator agent and close shipment gate review.",
    saleOrderNo: "2005111",
    dispatchDate: "16-04-2026",
    invoiceNo: "5242",
    customerRefNo: "11",
    pfaNo: "6442",
    country: "Germany",
    containerNo: "OOLU-726441-1",
    containerSize: "20ft",
    cbm: 29,
    weightLimitKg: 11200,
    grossWeightTons: 10.182,
    sealNo: "008201+008202",
    truckNo: "KHI-219",
    masterCaseColor: "WHITE",
    logoOnCarton: "CUSTOMER",
    tapeOnCarton: "CUSTOMER",
    cleanedBeforeLoading: true,
    fitForLoading: true,
    specialRemarks: "Mixed candy pallet load; no upstream blocker remains.",
    placeOfLoading: "STATE ONE",
    loadingTime: "11:20:00",
    totalCartons: 1320,
    totalDipsCartons: 1270,
    checkedByExport: "Hadi & Waqas",
    qualityInspector: "Noman Afzal",
    countBy: "Bilal Ahmed",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "6104",
        productName: "Hard Boiled Candy Assorted",
        packingDesc: "18gx24pcsx12box",
        section: "Candy",
        totalCartons: 720,
        dipsCartons: 690,
        lotNo: "25043HBCA18",
        mfgDate: "05-04-2026",
        expDate: "05-04-2028",
        grossWtKg: 7.1,
        totalGrossWtKg: 5112,
      },
      {
        sr: 2,
        finalCode: "6117",
        productName: "Center Filled Candy Mix",
        packingDesc: "22gx24pcsx12box",
        section: "Candy",
        totalCartons: 600,
        dipsCartons: 580,
        lotNo: "25043CFCM22",
        mfgDate: "05-04-2026",
        expDate: "05-04-2028",
        grossWtKg: 8.45,
        totalGrossWtKg: 5070,
      },
    ],
  },
  {
    id: "con-jelly-006",
    reference: "GFI-EU-JLY-2026-006",
    destination: "Southampton, United Kingdom",
    operatorAgentId: "agent-fos-eu",
    shipmentMode: "CURRENT_EXPORT",
    lineSummary: ["Jelly confectionery / HS 170490 / supporting classification evidence complete"],
    gateStatus: "READY",
    outputEligibility: "PACKAGE_READY",
    traceabilityStatus: "TRACEABLE",
    policyNarrative:
      "This jelly export route is release-ready with current trade, dispatch, and scope-supporting evidence attached.",
    issues: [],
    nextAction: "Release package to operator agent and lock shipment dossier.",
    saleOrderNo: "2005112",
    dispatchDate: "16-04-2026",
    invoiceNo: "5243",
    customerRefNo: "12",
    pfaNo: "6443",
    country: "United Kingdom",
    containerNo: "MSCU-802114-3",
    containerSize: "20ft",
    cbm: 30,
    weightLimitKg: 11450,
    grossWeightTons: 10.6801,
    sealNo: "008211+008212",
    truckNo: "KHI-225",
    masterCaseColor: "WHITE",
    logoOnCarton: "GFI",
    tapeOnCarton: "GFI",
    cleanedBeforeLoading: true,
    fitForLoading: true,
    specialRemarks: "Cold-chain not required; visual seal check completed.",
    placeOfLoading: "STATE ONE",
    loadingTime: "12:05:00",
    totalCartons: 1490,
    totalDipsCartons: 1445,
    checkedByExport: "Hadi & Waqas",
    qualityInspector: "Tahir Hussain",
    countBy: "Imran",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "6208",
        productName: "Jelly Fruities Mix",
        packingDesc: "18gx24pcsx12box",
        section: "Jelly",
        totalCartons: 760,
        dipsCartons: 742,
        lotNo: "25044JFM18",
        mfgDate: "06-04-2026",
        expDate: "06-04-2028",
        grossWtKg: 6.82,
        totalGrossWtKg: 5183.2,
      },
      {
        sr: 2,
        finalCode: "6215",
        productName: "Jelly Cola Bottles",
        packingDesc: "20gx24pcsx12box",
        section: "Jelly",
        totalCartons: 730,
        dipsCartons: 703,
        lotNo: "25044JCB20",
        mfgDate: "06-04-2026",
        expDate: "06-04-2028",
        grossWtKg: 7.53,
        totalGrossWtKg: 5496.9,
      },
    ],
  },
  {
    id: "con-bubblegum-007",
    reference: "GFI-EU-BBL-2026-007",
    destination: "Barcelona, Spain",
    operatorAgentId: "agent-fos-eu",
    shipmentMode: "CURRENT_EXPORT",
    lineSummary: ["Bubble gum / HS 170410 / memo and dispatch evidence complete"],
    gateStatus: "READY",
    outputEligibility: "PACKAGE_READY",
    traceabilityStatus: "TRACEABLE",
    policyNarrative:
      "This current export route remains low-complexity and fully supported by scope memo, trade, and shipment records.",
    issues: [],
    nextAction: "Release package to operator agent with final scope memo attached.",
    saleOrderNo: "2005113",
    dispatchDate: "17-04-2026",
    invoiceNo: "5244",
    customerRefNo: "14",
    pfaNo: "6444",
    country: "Spain",
    containerNo: "TGHU-401882-0",
    containerSize: "20ft",
    cbm: 30,
    weightLimitKg: 11000,
    grossWeightTons: 10.5336,
    sealNo: "008301+008302",
    truckNo: "KHI-231",
    masterCaseColor: "WHITE",
    logoOnCarton: "CUSTOMER",
    tapeOnCarton: "CUSTOMER",
    cleanedBeforeLoading: true,
    fitForLoading: true,
    specialRemarks: "10 pallet route with final carton branding confirmation.",
    placeOfLoading: "STATE TWO",
    loadingTime: "09:40:00",
    totalCartons: 1410,
    totalDipsCartons: 1366,
    checkedByExport: "Hadi & Waqas",
    qualityInspector: "Noman Afzal",
    countBy: "Bilal Ahmed",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "5172",
        productName: "Bubble Gum Sour Belts",
        packingDesc: "20gx24pcsx12box",
        section: "Bubble",
        totalCartons: 690,
        dipsCartons: 672,
        lotNo: "25045BGSB20",
        mfgDate: "07-04-2026",
        expDate: "07-04-2028",
        grossWtKg: 7.92,
        totalGrossWtKg: 5464.8,
      },
      {
        sr: 2,
        finalCode: "3147",
        productName: "Buster Tangy Candy Mix",
        packingDesc: "16gx24pcsx12box",
        section: "Candy",
        totalCartons: 720,
        dipsCartons: 694,
        lotNo: "25045BTCM16",
        mfgDate: "07-04-2026",
        expDate: "07-04-2028",
        grossWtKg: 7.04,
        totalGrossWtKg: 5068.8,
      },
    ],
  },
  {
    id: "con-candy-008",
    reference: "GFI-EU-CND-2026-008",
    destination: "Valencia, Spain",
    operatorAgentId: "agent-fos-eu",
    shipmentMode: "CURRENT_EXPORT",
    lineSummary: ["Candy and jelly mix / HS 170490 / classification evidence complete"],
    gateStatus: "READY",
    outputEligibility: "PACKAGE_READY",
    traceabilityStatus: "TRACEABLE",
    policyNarrative:
      "Current export route is ready for release under the confectionery classification and dispatch-control package.",
    issues: [],
    nextAction: "Release package to operator agent and move to dispatch handoff.",
    saleOrderNo: "2005114",
    dispatchDate: "18-04-2026",
    invoiceNo: "5245",
    customerRefNo: "15",
    pfaNo: "6445",
    country: "Spain",
    containerNo: "TEMU-772034-5",
    containerSize: "40ft",
    cbm: 61,
    weightLimitKg: 22300,
    grossWeightTons: 11.6246,
    sealNo: "008322+008323",
    truckNo: "KHI-236",
    masterCaseColor: "WHITE",
    logoOnCarton: "GFI",
    tapeOnCarton: "GFI",
    cleanedBeforeLoading: true,
    fitForLoading: true,
    specialRemarks: "Mixed confectionery load cleared after final weight reconciliation.",
    placeOfLoading: "STATE ONE",
    loadingTime: "14:10:00",
    totalCartons: 1670,
    totalDipsCartons: 1613,
    checkedByExport: "Hadi & Waqas",
    qualityInspector: "Tahir Hussain",
    countBy: "Imran",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "6104",
        productName: "Hard Boiled Candy Assorted",
        packingDesc: "18gx24pcsx12box",
        section: "Candy",
        totalCartons: 840,
        dipsCartons: 811,
        lotNo: "25046HBCA18",
        mfgDate: "08-04-2026",
        expDate: "08-04-2028",
        grossWtKg: 7.1,
        totalGrossWtKg: 5964,
      },
      {
        sr: 2,
        finalCode: "6208",
        productName: "Jelly Fruities Mix",
        packingDesc: "18gx24pcsx12box",
        section: "Jelly",
        totalCartons: 830,
        dipsCartons: 802,
        lotNo: "25046JFM18",
        mfgDate: "08-04-2026",
        expDate: "08-04-2028",
        grossWtKg: 6.82,
        totalGrossWtKg: 5660.6,
      },
    ],
  },
  {
    id: "con-jelly-009",
    reference: "GFI-EU-JLY-2026-009",
    destination: "Dunkirk, France",
    operatorAgentId: "agent-fos-eu",
    shipmentMode: "CURRENT_EXPORT",
    lineSummary: ["Jelly and gum mix / HS 170490 / package ready"],
    gateStatus: "READY",
    outputEligibility: "PACKAGE_READY",
    traceabilityStatus: "TRACEABLE",
    policyNarrative:
      "This current export route has cleared evidence checks and is ready for operator handoff.",
    issues: [],
    nextAction: "Release package to operator agent and confirm vessel booking.",
    saleOrderNo: "2005115",
    dispatchDate: "18-04-2026",
    invoiceNo: "5246",
    customerRefNo: "16",
    pfaNo: "6446",
    country: "France",
    containerNo: "OOLU-783112-9",
    containerSize: "20ft",
    cbm: 28,
    weightLimitKg: 10250,
    grossWeightTons: 9.6564,
    sealNo: "008331+008332",
    truckNo: "KHI-239",
    masterCaseColor: "WHITE",
    logoOnCarton: "CUSTOMER",
    tapeOnCarton: "CUSTOMER",
    cleanedBeforeLoading: true,
    fitForLoading: true,
    specialRemarks: "Compact release-ready route with mixed jelly and gum SKU set.",
    placeOfLoading: "STATE ONE",
    loadingTime: "15:25:00",
    totalCartons: 1380,
    totalDipsCartons: 1325,
    checkedByExport: "Hadi & Waqas",
    qualityInspector: "Noman Afzal",
    countBy: "Bilal Ahmed",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "6215",
        productName: "Jelly Cola Bottles",
        packingDesc: "20gx24pcsx12box",
        section: "Jelly",
        totalCartons: 680,
        dipsCartons: 652,
        lotNo: "25047JCB20",
        mfgDate: "09-04-2026",
        expDate: "09-04-2028",
        grossWtKg: 7.53,
        totalGrossWtKg: 5120.4,
      },
      {
        sr: 2,
        finalCode: "2158",
        productName: "Gum Fries Bubble Gum",
        packingDesc: "15gx24pcsx12box",
        section: "Bubble",
        totalCartons: 700,
        dipsCartons: 673,
        lotNo: "25047GFB15",
        mfgDate: "09-04-2026",
        expDate: "09-04-2028",
        grossWtKg: 6.48,
        totalGrossWtKg: 4536,
      },
    ],
  },
  {
    id: "con-gum-010",
    reference: "GFI-EU-GUM-2026-010",
    destination: "Zeebrugge, Belgium",
    operatorAgentId: "agent-fos-eu",
    shipmentMode: "CURRENT_EXPORT",
    lineSummary: ["Bubble and chew confectionery / HS 170410 / release-ready"],
    gateStatus: "READY",
    outputEligibility: "PACKAGE_READY",
    traceabilityStatus: "TRACEABLE",
    policyNarrative:
      "Current export route remains operationally straightforward and is supported by a complete scope-supporting package.",
    issues: [],
    nextAction: "Release package to operator agent and archive shipment gate decision.",
    saleOrderNo: "2005116",
    dispatchDate: "19-04-2026",
    invoiceNo: "5247",
    customerRefNo: "18",
    pfaNo: "6447",
    country: "Belgium",
    containerNo: "GESU-447821-6",
    containerSize: "20ft",
    cbm: 32,
    weightLimitKg: 11600,
    grossWeightTons: 11.0352,
    sealNo: "008341+008342",
    truckNo: "KHI-244",
    masterCaseColor: "WHITE",
    logoOnCarton: "GFI",
    tapeOnCarton: "GFI",
    cleanedBeforeLoading: true,
    fitForLoading: true,
    specialRemarks: "Customer release note received and attached to dispatch file.",
    placeOfLoading: "STATE TWO",
    loadingTime: "08:50:00",
    totalCartons: 1520,
    totalDipsCartons: 1462,
    checkedByExport: "Hadi & Waqas",
    qualityInspector: "Tahir Hussain",
    countBy: "Imran",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "5172",
        productName: "Bubble Gum Sour Belts",
        packingDesc: "20gx24pcsx12box",
        section: "Bubble",
        totalCartons: 760,
        dipsCartons: 734,
        lotNo: "25048BGSB20",
        mfgDate: "10-04-2026",
        expDate: "10-04-2028",
        grossWtKg: 7.92,
        totalGrossWtKg: 6019.2,
      },
      {
        sr: 2,
        finalCode: "4829",
        productName: "Fruties Tape Chew Assorted New",
        packingDesc: "15gx24pcsx12box",
        section: "Chew",
        totalCartons: 760,
        dipsCartons: 728,
        lotNo: "25048FTCA15",
        mfgDate: "10-04-2026",
        expDate: "10-04-2028",
        grossWtKg: 6.6,
        totalGrossWtKg: 5016,
      },
    ],
  },
  {
    id: "con-chew-011",
    reference: "GFI-EU-CHEW-2026-011",
    destination: "Felixstowe, United Kingdom",
    operatorAgentId: "agent-rhine-bv",
    shipmentMode: "CURRENT_EXPORT",
    lineSummary: ["Chew / HS 170490 / palm ingredient path complete, final scope memo pending"],
    gateStatus: "REVIEW_REQUIRED",
    outputEligibility: "SCOPE_REVIEW",
    traceabilityStatus: "TRACEABLE",
    policyNarrative:
      "Chew route is fully traceable, but package release remains on hold until the palm scope memo is finalized and agent release is reconfirmed.",
    issues: [
      {
        code: "PALM_SCOPE_REVIEW",
        severity: "HIGH",
        sourceDomain: "products",
        blocking: true,
        message: "Palm ingredient remains under classification review for this consignment path.",
      },
      {
        code: "EXPORT_RECHECK",
        severity: "WARNING",
        sourceDomain: "outputs",
        blocking: false,
        message: "Export team must recheck the release note once the scope memo is approved.",
      },
    ],
    nextAction: "Hold package release until palm scope memo is approved and agent readiness is reconfirmed.",
    saleOrderNo: "2005117",
    dispatchDate: "20-04-2026",
    invoiceNo: "5248",
    customerRefNo: "19",
    pfaNo: "6448",
    country: "United Kingdom",
    containerNo: "MRSU-190822-8",
    containerSize: "40ft",
    cbm: 65,
    weightLimitKg: 21800,
    grossWeightTons: 17.0812,
    sealNo: "008411+008412",
    truckNo: "LHR-452",
    masterCaseColor: "BROWN",
    logoOnCarton: "GFI",
    tapeOnCarton: "GFI",
    cleanedBeforeLoading: true,
    fitForLoading: true,
    specialRemarks: "Awaiting final scope sign-off before release instruction is sent.",
    placeOfLoading: "DOCK A2",
    loadingTime: "10:05:00",
    totalCartons: 1760,
    totalDipsCartons: 1738,
    checkedByExport: "Sana Malik",
    qualityInspector: "Tahir Hussain",
    countBy: "Bilal Ahmed",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "3031",
        productName: "Stripple Taffy Rope",
        packingDesc: "25gx24pcsx12box",
        section: "Chew",
        totalCartons: 620,
        dipsCartons: 612,
        lotNo: "26011STR25",
        mfgDate: "11-04-2026",
        expDate: "11-04-2028",
        grossWtKg: 9.2,
        totalGrossWtKg: 5704,
      },
      {
        sr: 2,
        finalCode: "4666",
        productName: "Whacky Chew Bar Twin Assorted",
        packingDesc: "28gx24pcsx12box",
        section: "Chew",
        totalCartons: 1140,
        dipsCartons: 1126,
        lotNo: "26011WCBT28",
        mfgDate: "11-04-2026",
        expDate: "11-04-2028",
        grossWtKg: 9.98,
        totalGrossWtKg: 11377.2,
      },
    ],
  },
  {
    id: "con-wafers-012",
    reference: "GFI-EU-WAF-2026-012",
    destination: "Marseille, France",
    operatorAgentId: "agent-rhine-bv",
    shipmentMode: "CURRENT_EXPORT",
    lineSummary: ["Wafers / HS 190532 / palm-derived ingredient route still under compliance review"],
    gateStatus: "REVIEW_REQUIRED",
    outputEligibility: "SCOPE_REVIEW",
    traceabilityStatus: "TRACEABLE",
    policyNarrative:
      "Wafer route is operationally ready but cannot be handed over while the palm-derived ingredient decision remains open.",
    issues: [
      {
        code: "PALM_SCOPE_REVIEW",
        severity: "HIGH",
        sourceDomain: "products",
        blocking: true,
        message: "Palm-derived ingredient for wafers remains under classification review.",
      },
      {
        code: "AGENT_RELEASE_NOTE_PENDING",
        severity: "WARNING",
        sourceDomain: "agents",
        blocking: false,
        message: "Agent release note must be refreshed after the final palm determination.",
      },
    ],
    nextAction: "Hold package release until palm scope review closes and release note is refreshed.",
    saleOrderNo: "2005118",
    dispatchDate: "20-04-2026",
    invoiceNo: "5249",
    customerRefNo: "20",
    pfaNo: "6449",
    country: "France",
    containerNo: "TCKU-529014-7",
    containerSize: "40ft",
    cbm: 59,
    weightLimitKg: 20500,
    grossWeightTons: 11.842,
    sealNo: "008421+008422",
    truckNo: "LHR-457",
    masterCaseColor: "BROWN",
    logoOnCarton: "CUSTOMER",
    tapeOnCarton: "CUSTOMER",
    cleanedBeforeLoading: true,
    fitForLoading: true,
    specialRemarks: "Release path paused after latest ingredient scope review note.",
    placeOfLoading: "DOCK B1",
    loadingTime: "13:10:00",
    totalCartons: 1420,
    totalDipsCartons: 1402,
    checkedByExport: "Sana Malik",
    qualityInspector: "Tahir Hussain",
    countBy: "Bilal Ahmed",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "7301",
        productName: "Wafer Cream Bites",
        packingDesc: "22gx24pcsx12box",
        section: "Wafers",
        totalCartons: 740,
        dipsCartons: 730,
        lotNo: "26012WCB22",
        mfgDate: "12-04-2026",
        expDate: "12-04-2028",
        grossWtKg: 8.1,
        totalGrossWtKg: 5994,
      },
      {
        sr: 2,
        finalCode: "7314",
        productName: "Wafer Fingers Assorted",
        packingDesc: "24gx24pcsx12box",
        section: "Wafers",
        totalCartons: 680,
        dipsCartons: 672,
        lotNo: "26012WFA24",
        mfgDate: "12-04-2026",
        expDate: "12-04-2028",
        grossWtKg: 8.6,
        totalGrossWtKg: 5848,
      },
    ],
  },
  {
    id: "con-chew-013",
    reference: "GFI-EU-CHEW-2026-013",
    destination: "Genoa, Italy",
    operatorAgentId: "agent-rhine-bv",
    shipmentMode: "CURRENT_EXPORT",
    lineSummary: ["Chew / HS 170490 / palm scope note and export review still open"],
    gateStatus: "REVIEW_REQUIRED",
    outputEligibility: "SCOPE_REVIEW",
    traceabilityStatus: "TRACEABLE",
    policyNarrative:
      "The chew route remains fully traceable, but package release is paused pending final palm scope approval and export desk confirmation.",
    issues: [
      {
        code: "PALM_SCOPE_REVIEW",
        severity: "HIGH",
        sourceDomain: "products",
        blocking: true,
        message: "Palm scope memo is still pending approval for this chew route.",
      },
      {
        code: "EXPORT_RECHECK",
        severity: "WARNING",
        sourceDomain: "outputs",
        blocking: false,
        message: "Export desk must confirm release once the scope file is superseded.",
      },
    ],
    nextAction: "Retain held package until final palm determination is documented and export desk reconfirms release.",
    saleOrderNo: "2005119",
    dispatchDate: "21-04-2026",
    invoiceNo: "5250",
    customerRefNo: "22",
    pfaNo: "6450",
    country: "Italy",
    containerNo: "FSCU-661295-1",
    containerSize: "40ft",
    cbm: 61,
    weightLimitKg: 21200,
    grossWeightTons: 13.0934,
    sealNo: "008431+008432",
    truckNo: "LHR-461",
    masterCaseColor: "BROWN",
    logoOnCarton: "GFI",
    tapeOnCarton: "GFI",
    cleanedBeforeLoading: true,
    fitForLoading: true,
    specialRemarks: "Held at final review state; all traceability records reconciled.",
    placeOfLoading: "DOCK A3",
    loadingTime: "15:10:00",
    totalCartons: 1610,
    totalDipsCartons: 1587,
    checkedByExport: "Sana Malik",
    qualityInspector: "Noman Afzal",
    countBy: "Bilal Ahmed",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "4829",
        productName: "Fruties Tape Chew Assorted New",
        packingDesc: "15gx24pcsx12box",
        section: "Chew",
        totalCartons: 880,
        dipsCartons: 866,
        lotNo: "26013FTCA15",
        mfgDate: "13-04-2026",
        expDate: "13-04-2028",
        grossWtKg: 6.6,
        totalGrossWtKg: 5808,
      },
      {
        sr: 2,
        finalCode: "4666",
        productName: "Whacky Chew Bar Twin Assorted",
        packingDesc: "28gx24pcsx12box",
        section: "Chew",
        totalCartons: 730,
        dipsCartons: 721,
        lotNo: "26013WCBT28",
        mfgDate: "13-04-2026",
        expDate: "13-04-2028",
        grossWtKg: 9.98,
        totalGrossWtKg: 7285.4,
      },
    ],
  },
  {
    id: "con-chew-014",
    reference: "GFI-EU-CHEW-2026-014",
    destination: "Livorno, Italy",
    operatorAgentId: "agent-rhine-bv",
    shipmentMode: "FUTURE_EXPORT",
    lineSummary: ["Chew / HS 170490 / future export slot pending palm scope closure"],
    gateStatus: "REVIEW_REQUIRED",
    outputEligibility: "SCOPE_REVIEW",
    traceabilityStatus: "TRACEABLE",
    policyNarrative:
      "Future chew export is pre-positioned with batch and dispatch data, but release remains suspended until palm scope closure and export-slot confirmation.",
    issues: [
      {
        code: "PALM_SCOPE_REVIEW",
        severity: "HIGH",
        sourceDomain: "products",
        blocking: true,
        message: "Palm classification decision is still open for this future chew route.",
      },
      {
        code: "PLANNING_SLOT_PENDING",
        severity: "WARNING",
        sourceDomain: "consignments",
        blocking: false,
        message: "Route remains on planning hold until scope closure and booking confirmation.",
      },
    ],
    nextAction: "Keep package held and reopen release only after palm memo closure and booking confirmation.",
    saleOrderNo: "2005120",
    dispatchDate: "—",
    invoiceNo: "5251",
    customerRefNo: "23",
    pfaNo: "6451",
    country: "Italy",
    containerNo: "PENDING",
    containerSize: "40ft",
    cbm: 60,
    weightLimitKg: 21400,
    grossWeightTons: 13.829,
    sealNo: "—",
    truckNo: "—",
    masterCaseColor: "BROWN",
    logoOnCarton: "GFI",
    tapeOnCarton: "GFI",
    cleanedBeforeLoading: false,
    fitForLoading: false,
    notFitReason: "Future export route is waiting for scope closure before final loading instructions are issued.",
    specialRemarks: "Do not dispatch until scope decision and vessel slot are confirmed.",
    placeOfLoading: "TBD",
    loadingTime: "—",
    totalCartons: 1600,
    totalDipsCartons: 1583,
    checkedByExport: "—",
    qualityInspector: "—",
    countBy: "—",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "3031",
        productName: "Stripple Taffy Rope",
        packingDesc: "25gx24pcsx12box",
        section: "Chew",
        totalCartons: 790,
        dipsCartons: 781,
        lotNo: "26014STR25",
        mfgDate: "14-04-2026",
        expDate: "14-04-2028",
        grossWtKg: 9.2,
        totalGrossWtKg: 7268,
      },
      {
        sr: 2,
        finalCode: "7301",
        productName: "Wafer Cream Bites",
        packingDesc: "22gx24pcsx12box",
        section: "Wafers",
        totalCartons: 810,
        dipsCartons: 802,
        lotNo: "26014WCB22",
        mfgDate: "14-04-2026",
        expDate: "14-04-2028",
        grossWtKg: 8.1,
        totalGrossWtKg: 6561,
      },
    ],
  },
  {
    id: "con-wafers-015",
    reference: "GFI-EU-WAF-2026-015",
    destination: "Ravenna, Italy",
    operatorAgentId: "agent-rhine-bv",
    shipmentMode: "FUTURE_EXPORT",
    lineSummary: ["Wafers / HS 190532 / future export path held in palm review state"],
    gateStatus: "REVIEW_REQUIRED",
    outputEligibility: "SCOPE_REVIEW",
    traceabilityStatus: "TRACEABLE",
    policyNarrative:
      "Future wafer route is staged with inventory and dispatch references, but it remains in review until the palm-derived ingredient posture is settled.",
    issues: [
      {
        code: "PALM_SCOPE_REVIEW",
        severity: "HIGH",
        sourceDomain: "products",
        blocking: true,
        message: "Palm-derived wafer ingredient remains under review for future export release.",
      },
      {
        code: "PLANNING_HOLD",
        severity: "WARNING",
        sourceDomain: "consignments",
        blocking: false,
        message: "Future export remains on planning hold pending scope confirmation.",
      },
    ],
    nextAction: "Retain held package and revisit route once palm classification outcome is confirmed.",
    saleOrderNo: "2005121",
    dispatchDate: "—",
    invoiceNo: "5252",
    customerRefNo: "24",
    pfaNo: "6452",
    country: "Italy",
    containerNo: "PENDING",
    containerSize: "40ft HC",
    cbm: 58,
    weightLimitKg: 20900,
    grossWeightTons: 11.832,
    sealNo: "—",
    truckNo: "—",
    masterCaseColor: "BROWN",
    logoOnCarton: "CUSTOMER",
    tapeOnCarton: "CUSTOMER",
    cleanedBeforeLoading: false,
    fitForLoading: false,
    notFitReason: "Future wafer route cannot be finalized before palm scope closure.",
    specialRemarks: "Planning-only route; no dispatch release permitted yet.",
    placeOfLoading: "TBD",
    loadingTime: "—",
    totalCartons: 1520,
    totalDipsCartons: 1500,
    checkedByExport: "—",
    qualityInspector: "—",
    countBy: "—",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "7314",
        productName: "Wafer Fingers Assorted",
        packingDesc: "24gx24pcsx12box",
        section: "Wafers",
        totalCartons: 900,
        dipsCartons: 886,
        lotNo: "26015WFA24",
        mfgDate: "15-04-2026",
        expDate: "15-04-2028",
        grossWtKg: 8.6,
        totalGrossWtKg: 7740,
      },
      {
        sr: 2,
        finalCode: "4829",
        productName: "Fruties Tape Chew Assorted New",
        packingDesc: "15gx24pcsx12box",
        section: "Chew",
        totalCartons: 620,
        dipsCartons: 614,
        lotNo: "26015FTCA15",
        mfgDate: "15-04-2026",
        expDate: "15-04-2028",
        grossWtKg: 6.6,
        totalGrossWtKg: 4092,
      },
    ],
  },
  {
    id: "con-choc-016",
    reference: "GFI-EU-CHOC-2026-016",
    destination: "Trieste, Italy",
    operatorAgentId: "agent-rhine-bv",
    shipmentMode: "FUTURE_EXPORT",
    lineSummary: ["Chocolate / HS 180690 / cocoa origin and CoC path unresolved"],
    gateStatus: "BLOCKED",
    outputEligibility: "HELD",
    traceabilityStatus: "BLOCKED",
    policyNarrative:
      "Future chocolate export remains fail-closed because cocoa provenance and transaction-level CoC evidence are still incomplete.",
    issues: [
      {
        code: "COCOA_GEO_MISSING",
        severity: "CRITICAL",
        sourceDomain: "geolocation",
        blocking: true,
        message: "No approved cocoa farm geolocation package exists for the selected route.",
      },
      {
        code: "COCOA_COC_MISSING",
        severity: "HIGH",
        sourceDomain: "documents",
        blocking: true,
        message: "No transaction-level cocoa chain-of-custody evidence has been linked to this route.",
      },
      {
        code: "SUPPLIER_RESPONSE_OPEN",
        severity: "CRITICAL",
        sourceDomain: "suppliers",
        blocking: true,
        message: "Supplier remediation remains incomplete for cocoa provenance onboarding.",
      },
    ],
    nextAction: "Keep shipment blocked and continue cocoa supplier remediation before any release planning.",
    saleOrderNo: "2005122",
    dispatchDate: "—",
    invoiceNo: "5253",
    customerRefNo: "25",
    pfaNo: "6453",
    country: "Italy",
    containerNo: "PENDING",
    containerSize: "40ft HC",
    cbm: 62,
    weightLimitKg: 26500,
    grossWeightTons: 18.5184,
    sealNo: "—",
    truckNo: "—",
    masterCaseColor: "WHITE",
    logoOnCarton: "CUSTOMER",
    tapeOnCarton: "CUSTOMER",
    cleanedBeforeLoading: false,
    fitForLoading: false,
    notFitReason: "Blocked pending upstream cocoa origin and CoC resolution.",
    specialRemarks: "Do not allocate container until gate blockers are closed.",
    placeOfLoading: "TBD",
    loadingTime: "—",
    totalCartons: 1110,
    totalDipsCartons: 0,
    checkedByExport: "—",
    qualityInspector: "—",
    countBy: "—",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "1801",
        productName: "Dark Chocolate Slab",
        packingDesc: "100gx12pcsx12box",
        section: "Chocolate",
        totalCartons: 650,
        dipsCartons: 0,
        lotNo: "PENDING",
        mfgDate: "—",
        expDate: "—",
        grossWtKg: 17.28,
        totalGrossWtKg: 11232,
      },
      {
        sr: 2,
        finalCode: "1823",
        productName: "Milk Chocolate Assorted Bites",
        packingDesc: "150gx8pcsx12box",
        section: "Chocolate",
        totalCartons: 460,
        dipsCartons: 0,
        lotNo: "PENDING",
        mfgDate: "—",
        expDate: "—",
        grossWtKg: 15.84,
        totalGrossWtKg: 7286.4,
      },
    ],
  },
  {
    id: "con-choc-017",
    reference: "GFI-EU-CHOC-2026-017",
    destination: "Koper, Slovenia",
    operatorAgentId: "agent-rhine-bv",
    shipmentMode: "FUTURE_EXPORT",
    lineSummary: ["Chocolate and cocoa wafer mix / cocoa route unresolved"],
    gateStatus: "BLOCKED",
    outputEligibility: "HELD",
    traceabilityStatus: "BLOCKED",
    policyNarrative:
      "This future route remains blocked because cocoa-linked evidence is incomplete and supplier remediation remains open.",
    issues: [
      {
        code: "COCOA_GEO_MISSING",
        severity: "CRITICAL",
        sourceDomain: "geolocation",
        blocking: true,
        message: "Approved cocoa geolocation evidence is missing for this route.",
      },
      {
        code: "COCOA_COC_MISSING",
        severity: "HIGH",
        sourceDomain: "documents",
        blocking: true,
        message: "No cocoa chain-of-custody trade proof is attached to the dispatch package.",
      },
      {
        code: "SUPPLIER_PACK_INCOMPLETE",
        severity: "CRITICAL",
        sourceDomain: "suppliers",
        blocking: true,
        message: "Supplier provenance pack is still incomplete for cocoa release planning.",
      },
    ],
    nextAction: "Retain shipment block and continue supplier and document remediation for the cocoa path.",
    saleOrderNo: "2005123",
    dispatchDate: "—",
    invoiceNo: "5254",
    customerRefNo: "26",
    pfaNo: "6454",
    country: "Slovenia",
    containerNo: "PENDING",
    containerSize: "40ft HC",
    cbm: 60,
    weightLimitKg: 25800,
    grossWeightTons: 17.078,
    sealNo: "—",
    truckNo: "—",
    masterCaseColor: "WHITE",
    logoOnCarton: "CUSTOMER",
    tapeOnCarton: "CUSTOMER",
    cleanedBeforeLoading: false,
    fitForLoading: false,
    notFitReason: "Blocked until cocoa provenance blockers are fully cleared.",
    specialRemarks: "No loading action permitted; hold in planning queue only.",
    placeOfLoading: "TBD",
    loadingTime: "—",
    totalCartons: 1230,
    totalDipsCartons: 0,
    checkedByExport: "—",
    qualityInspector: "—",
    countBy: "—",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "1801",
        productName: "Dark Chocolate Slab",
        packingDesc: "100gx12pcsx12box",
        section: "Chocolate",
        totalCartons: 700,
        dipsCartons: 0,
        lotNo: "PENDING",
        mfgDate: "—",
        expDate: "—",
        grossWtKg: 17.28,
        totalGrossWtKg: 12096,
      },
      {
        sr: 2,
        finalCode: "7318",
        productName: "Cocoa Wafer Fingers",
        packingDesc: "24gx24pcsx12box",
        section: "Wafers",
        totalCartons: 530,
        dipsCartons: 0,
        lotNo: "PENDING",
        mfgDate: "—",
        expDate: "—",
        grossWtKg: 9.4,
        totalGrossWtKg: 4982,
      },
    ],
  },
  {
    id: "con-choc-018",
    reference: "GFI-EU-CHOC-2026-018",
    destination: "Gdansk, Poland",
    operatorAgentId: "agent-rhine-bv",
    shipmentMode: "FUTURE_EXPORT",
    lineSummary: ["Chocolate / HS 180690 / future release blocked by unresolved cocoa diligence"],
    gateStatus: "BLOCKED",
    outputEligibility: "HELD",
    traceabilityStatus: "BLOCKED",
    policyNarrative:
      "This route remains blocked because cocoa provenance, geolocation, and transaction-level CoC evidence are still missing.",
    issues: [
      {
        code: "COCOA_GEO_MISSING",
        severity: "CRITICAL",
        sourceDomain: "geolocation",
        blocking: true,
        message: "No approved cocoa plot package is linked for this future route.",
      },
      {
        code: "COCOA_COC_MISSING",
        severity: "HIGH",
        sourceDomain: "documents",
        blocking: true,
        message: "No cocoa CoC transaction evidence is attached for export release.",
      },
      {
        code: "SUPPLIER_RESPONSE_OPEN",
        severity: "CRITICAL",
        sourceDomain: "suppliers",
        blocking: true,
        message: "Supplier remediation remains open and prevents release planning.",
      },
    ],
    nextAction: "Keep shipment blocked and continue cocoa provenance remediation before route activation.",
    saleOrderNo: "2005124",
    dispatchDate: "—",
    invoiceNo: "5255",
    customerRefNo: "27",
    pfaNo: "6455",
    country: "Poland",
    containerNo: "PENDING",
    containerSize: "40ft HC",
    cbm: 61,
    weightLimitKg: 26200,
    grossWeightTons: 19.2672,
    sealNo: "—",
    truckNo: "—",
    masterCaseColor: "WHITE",
    logoOnCarton: "CUSTOMER",
    tapeOnCarton: "CUSTOMER",
    cleanedBeforeLoading: false,
    fitForLoading: false,
    notFitReason: "Blocked until the cocoa route clears geolocation and CoC review.",
    specialRemarks: "Planning reference only; export slot must remain closed.",
    placeOfLoading: "TBD",
    loadingTime: "—",
    totalCartons: 1160,
    totalDipsCartons: 0,
    checkedByExport: "—",
    qualityInspector: "—",
    countBy: "—",
    dispatchLines: [
      {
        sr: 1,
        finalCode: "1823",
        productName: "Milk Chocolate Assorted Bites",
        packingDesc: "150gx8pcsx12box",
        section: "Chocolate",
        totalCartons: 540,
        dipsCartons: 0,
        lotNo: "PENDING",
        mfgDate: "—",
        expDate: "—",
        grossWtKg: 15.84,
        totalGrossWtKg: 8553.6,
      },
      {
        sr: 2,
        finalCode: "1801",
        productName: "Dark Chocolate Slab",
        packingDesc: "100gx12pcsx12box",
        section: "Chocolate",
        totalCartons: 620,
        dipsCartons: 0,
        lotNo: "PENDING",
        mfgDate: "—",
        expDate: "—",
        grossWtKg: 17.28,
        totalGrossWtKg: 10713.6,
      },
    ],
  },
];

export const outputPackages: OutputPackageRecord[] = [
  {
    id: "pkg-bubblegum-001",
    consignmentId: "con-bubblegum-001",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-22-v2",
    status: "READY_FOR_AGENT",
    evidenceIndexCount: 6,
    sourceAnchorCount: 9,
    packageRef: "PKG-GFI-BBL-2026-001",
    supersessionNote: "Supersedes initial draft package after final scope memo review.",
    artifacts: ["package.json", "package.xml", "scope-memo.pdf", "evidence-index.csv"],
  },
  {
    id: "pkg-chew-002",
    consignmentId: "con-chew-002",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-22-v1",
    status: "HELD",
    evidenceIndexCount: 8,
    sourceAnchorCount: 12,
    packageRef: "PKG-GFI-CHW-2026-002",
    supersessionNote: "Held pending palm scope decision and stronger CoC evidence path.",
    artifacts: ["draft-package.json", "draft-evidence-index.csv"],
  },
  {
    id: "pkg-chocolate-003",
    consignmentId: "con-choc-003",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-22-v4",
    status: "HELD",
    evidenceIndexCount: 3,
    sourceAnchorCount: 7,
    packageRef: "PKG-GFI-CHOC-2026-003",
    supersessionNote: "New snapshot preserved after Indococoa route via N A Enterprises discovery, but package remains blocked.",
    artifacts: ["blocked-package-summary.json"],
  },
  {
    id: "pkg-gum-004",
    consignmentId: "con-gum-004",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-24-v1",
    status: "READY_FOR_AGENT",
    evidenceIndexCount: 6,
    sourceAnchorCount: 9,
    packageRef: "PKG-GFI-GUM-2026-004",
    supersessionNote: "Final export-ready package compiled after scope memo and dispatch check reconciliation.",
    artifacts: ["package.json", "package.xml", "scope-memo.pdf", "dispatch-checklist.pdf"],
  },
  {
    id: "pkg-candy-005",
    consignmentId: "con-candy-005",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-24-v1",
    status: "READY_FOR_AGENT",
    evidenceIndexCount: 6,
    sourceAnchorCount: 8,
    packageRef: "PKG-GFI-CND-2026-005",
    supersessionNote: "Customer carton artwork and dispatch packet aligned in the final export snapshot.",
    artifacts: ["package.json", "package.xml", "evidence-index.csv", "dispatch-checklist.pdf"],
  },
  {
    id: "pkg-jelly-006",
    consignmentId: "con-jelly-006",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-24-v1",
    status: "READY_FOR_AGENT",
    evidenceIndexCount: 7,
    sourceAnchorCount: 9,
    packageRef: "PKG-GFI-JLY-2026-006",
    supersessionNote: "Release-ready after final dispatch evidence upload and carton count reconciliation.",
    artifacts: ["package.json", "package.xml", "evidence-index.csv", "dispatch-checklist.pdf"],
  },
  {
    id: "pkg-bubblegum-007",
    consignmentId: "con-bubblegum-007",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-25-v1",
    status: "READY_FOR_AGENT",
    evidenceIndexCount: 6,
    sourceAnchorCount: 9,
    packageRef: "PKG-GFI-BBL-2026-007",
    supersessionNote: "Bubble gum route closed after final scope memo and release-note alignment.",
    artifacts: ["package.json", "package.xml", "scope-memo.pdf", "evidence-index.csv"],
  },
  {
    id: "pkg-candy-008",
    consignmentId: "con-candy-008",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-25-v1",
    status: "READY_FOR_AGENT",
    evidenceIndexCount: 7,
    sourceAnchorCount: 10,
    packageRef: "PKG-GFI-CND-2026-008",
    supersessionNote: "Mixed confectionery route packaged after dispatch-weight and carton reconciliation.",
    artifacts: ["package.json", "package.xml", "evidence-index.csv", "dispatch-checklist.pdf"],
  },
  {
    id: "pkg-jelly-009",
    consignmentId: "con-jelly-009",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-25-v1",
    status: "READY_FOR_AGENT",
    evidenceIndexCount: 6,
    sourceAnchorCount: 8,
    packageRef: "PKG-GFI-JLY-2026-009",
    supersessionNote: "Release-ready jelly route archived after final dispatch sign-off.",
    artifacts: ["package.json", "package.xml", "evidence-index.csv", "dispatch-checklist.pdf"],
  },
  {
    id: "pkg-gum-010",
    consignmentId: "con-gum-010",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-26-v1",
    status: "READY_FOR_AGENT",
    evidenceIndexCount: 7,
    sourceAnchorCount: 10,
    packageRef: "PKG-GFI-GUM-2026-010",
    supersessionNote: "Final route package preserves the approved release note and supporting scope memo.",
    artifacts: ["package.json", "package.xml", "scope-memo.pdf", "evidence-index.csv"],
  },
  {
    id: "pkg-chew-011",
    consignmentId: "con-chew-011",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-26-v2",
    status: "HELD",
    evidenceIndexCount: 8,
    sourceAnchorCount: 12,
    packageRef: "PKG-GFI-CHW-2026-011",
    supersessionNote: "Held pending final palm scope memo and export desk reconfirmation.",
    artifacts: ["draft-package.json", "draft-evidence-index.csv", "scope-review-note.pdf"],
  },
  {
    id: "pkg-wafers-012",
    consignmentId: "con-wafers-012",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-26-v1",
    status: "HELD",
    evidenceIndexCount: 8,
    sourceAnchorCount: 11,
    packageRef: "PKG-GFI-WAF-2026-012",
    supersessionNote: "Wafer route package is complete but held until palm review closes.",
    artifacts: ["draft-package.json", "draft-evidence-index.csv", "scope-review-note.pdf"],
  },
  {
    id: "pkg-chew-013",
    consignmentId: "con-chew-013",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-26-v1",
    status: "HELD",
    evidenceIndexCount: 8,
    sourceAnchorCount: 12,
    packageRef: "PKG-GFI-CHW-2026-013",
    supersessionNote: "Package is retained in held state until palm scope memo is superseded.",
    artifacts: ["draft-package.json", "draft-evidence-index.csv", "scope-review-note.pdf"],
  },
  {
    id: "pkg-chew-014",
    consignmentId: "con-chew-014",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-27-v1",
    status: "HELD",
    evidenceIndexCount: 7,
    sourceAnchorCount: 11,
    packageRef: "PKG-GFI-CHW-2026-014",
    supersessionNote: "Future chew export package remains held until scope closure and route booking.",
    artifacts: ["future-route-summary.json", "draft-evidence-index.csv", "scope-review-note.pdf"],
  },
  {
    id: "pkg-wafers-015",
    consignmentId: "con-wafers-015",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-27-v1",
    status: "HELD",
    evidenceIndexCount: 7,
    sourceAnchorCount: 10,
    packageRef: "PKG-GFI-WAF-2026-015",
    supersessionNote: "Future wafer package preserved in held state while palm review remains open.",
    artifacts: ["future-route-summary.json", "draft-evidence-index.csv", "scope-review-note.pdf"],
  },
  {
    id: "pkg-chocolate-016",
    consignmentId: "con-choc-016",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-27-v2",
    status: "HELD",
    evidenceIndexCount: 3,
    sourceAnchorCount: 7,
    packageRef: "PKG-GFI-CHOC-2026-016",
    supersessionNote: "Blocked route package preserved for audit trail while cocoa provenance gaps remain open.",
    artifacts: ["blocked-package-summary.json", "supplier-remediation-log.csv"],
  },
  {
    id: "pkg-chocolate-017",
    consignmentId: "con-choc-017",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-27-v1",
    status: "HELD",
    evidenceIndexCount: 4,
    sourceAnchorCount: 7,
    packageRef: "PKG-GFI-CHOC-2026-017",
    supersessionNote: "Blocked cocoa route remains fail-closed and is preserved for remediation review.",
    artifacts: ["blocked-package-summary.json", "supplier-remediation-log.csv"],
  },
  {
    id: "pkg-chocolate-018",
    consignmentId: "con-choc-018",
    mode: "COMPLIANCE_PACKAGE",
    snapshotVersion: "SNAP-2026-05-27-v1",
    status: "HELD",
    evidenceIndexCount: 4,
    sourceAnchorCount: 7,
    packageRef: "PKG-GFI-CHOC-2026-018",
    supersessionNote: "Blocked package retained while cocoa diligence and supplier remediation remain unresolved.",
    artifacts: ["blocked-package-summary.json", "supplier-remediation-log.csv"],
  },
];

const supplementalComplianceDocumentBatches = [
  {
    role: "SUPPLIER_AGREEMENT",
    titlePrefix: "Supplier master agreement",
    linkedEntity: "GFI supplier network",
    count: 7,
    expiries: ["2026-12-31", "2027-01-31", "2027-03-31"],
  },
  {
    role: "SUPPLIER_DECLARATION",
    titlePrefix: "Supplier EUDR declaration",
    linkedEntity: "Supplier declaration register",
    count: 8,
    expiries: ["2026-07-28", "2026-09-30", "2027-02-28"],
  },
  {
    role: "PRODUCT_SPECIFICATION",
    titlePrefix: "Product and ingredient specification",
    linkedEntity: "Product and BOM library",
    count: 6,
    expiries: ["2026-10-15", "2027-04-30"],
  },
  {
    role: "CHAIN_OF_CUSTODY_PROOF",
    titlePrefix: "Chain of custody transaction proof",
    linkedEntity: "CoC evidence register",
    count: 7,
    expiries: ["2026-07-18", "2026-11-30", "2027-05-31"],
  },
  {
    role: "GEOLOCATION_SHAPEFILE",
    titlePrefix: "Farm geolocation mapping record",
    linkedEntity: "Plot evidence library",
    count: 7,
    expiries: ["2026-08-10", "2027-01-15"],
  },
  {
    role: "LEGAL_LICENSE",
    titlePrefix: "Legal permit and land-rights evidence",
    linkedEntity: "Legal evidence register",
    count: 6,
    expiries: ["2026-07-25", "2026-12-20", "2027-06-30"],
  },
  {
    role: "AUDIT_SUMMARY",
    titlePrefix: "Traceability audit assessment report",
    linkedEntity: "Audit evidence register",
    count: 6,
    expiries: ["2026-09-15", "2027-03-15"],
  },
  {
    role: "POLICY_PROCEDURE",
    titlePrefix: "Compliance policy and SOP",
    linkedEntity: "Governance document library",
    count: 5,
    expiries: ["2026-10-30", "2027-02-15"],
  },
  {
    role: "DUE_DILIGENCE_REPORT",
    titlePrefix: "Due diligence conclusion memo",
    linkedEntity: "Due diligence file",
    count: 5,
    expiries: ["2026-08-25", "2027-05-15"],
  },
] as const;

const supplementalComplianceDocuments: DocumentRecord[] = supplementalComplianceDocumentBatches.flatMap((batch) =>
  Array.from({ length: batch.count }, (_, index) => {
    const sequence = index + 1;
    const status: DocumentRecord["status"] = index % 13 === 0 ? "DRAFT" : index % 11 === 0 ? "REQUESTED" : "CURRENT";

    return {
      id: `doc-supplemental-${batch.role.toLowerCase().replace(/_/g, "-")}-${sequence}`,
      title: `${batch.titlePrefix} ${String(sequence).padStart(2, "0")}`,
      documentRole: batch.role,
      linkedEntity: batch.linkedEntity,
      status,
      note: "Supplemental dashboard evidence record used for document coverage analytics.",
      issuedAt: "2026-05-01",
      expiresAt: batch.expiries[index % batch.expiries.length],
    };
  }),
);

export const documents: DocumentRecord[] = [
  {
    id: "doc-cargill-rspo",
    title: "Cargill RSPO certificate",
    documentRole: "CERTIFICATION",
    linkedEntity: "Cargill Palm Products SDN BHD",
    status: "CURRENT",
    note: "Valid until January 2028 but covers both SG and MB; transaction-specific proof still needed.",
    issuedAt: "2026-01-12",
    expiresAt: "2028-01-12",
  },
  {
    id: "doc-cargill-msds",
    title: "Cargill palm product MSDS",
    documentRole: "CHAIN_OF_CUSTODY_SUPPORT",
    linkedEntity: "Cargill palm deliveries",
    status: "CURRENT",
    note: "Only current source showing RSPO SG for the specific palm product.",
    issuedAt: "2026-04-18",
    expiresAt: "2026-07-30",
  },
  {
    id: "doc-jb-request",
    title: "JB Cocoa supplier declaration request",
    documentRole: "SUPPLIER_REQUEST",
    linkedEntity: "JB Cocoa SDN BHD",
    status: "CURRENT",
    note: "Outstanding; waiting for formal response pack.",
    issuedAt: "2026-05-15",
    expiresAt: "2026-07-15",
  },
  {
    id: "doc-indococoa-request",
    title: "N A Enterprises (Indococoa) onboarding and declaration pack",
    documentRole: "SUPPLIER_REQUEST",
    linkedEntity: "N A Enterprises (Indococoa)",
    status: "CURRENT",
    note: "Initial outreach opened after on-site discovery of Indococoa supplied via N A Enterprises.",
    issuedAt: "2026-05-20",
    expiresAt: "2026-07-20",
  },
  {
    id: "doc-chew-scope-note",
    title: "Palm scope review memo for Chew",
    documentRole: "CLASSIFICATION_MEMO",
    linkedEntity: "Chew",
    status: "DRAFT",
    note: "Awaiting customs classification confirmation for palm route.",
    issuedAt: "2026-05-22",
    expiresAt: "2026-08-15",
  },
  {
    id: "doc-bubblegum-scope",
    title: "Bubble Gum out-of-scope justification",
    documentRole: "SCOPE_MEMO",
    linkedEntity: "Bubble Gum",
    status: "CURRENT",
    note: "Used in the compliance package instead of commodity provenance evidence.",
    issuedAt: "2026-05-22",
    expiresAt: "2027-05-22",
  },
  ...supplementalComplianceDocuments,
];

export const concerns: ConcernRecord[] = [
  {
    id: "concern-001",
    headline: "Undisclosed cocoa processor Indococoa supplied via N A Enterprises",
    impactArea: "Supplier completeness / future export gating",
    severity: "CRITICAL",
    linkedEntity: "N A Enterprises",
    status: "OPEN",
    downstreamEffect: "Blocks all cocoa-linked future EU consignments until supplier assessment is complete.",
  },
  {
    id: "concern-002",
    headline: "Palm CoC proof exists only on MSDS, not on delivery notes",
    impactArea: "Commercial evidence quality",
    severity: "HIGH",
    linkedEntity: "Cargill palm flow",
    status: "UNDER_REVIEW",
    downstreamEffect: "May force recheck of current palm-linked shipments if palm stays in scope.",
  },
  {
    id: "concern-003",
    headline: "EU agent TRACES readiness still pending for future cocoa launch",
    impactArea: "Operator handoff readiness",
    severity: "MEDIUM",
    linkedEntity: "Rhine Confectionery Imports BV",
    status: "OPEN",
    downstreamEffect: "Prevents package release even after provenance remediation is complete.",
  },
];

export const integrationOverview: IntegrationOverview = {
  provider: "SAP / Oracle blended operational feed",
  status: "PARTIAL",
  importedDispatches: 38,
  importedBatches: 104,
  missingHsEnrichments: 11,
  missingCocEnrichments: 14,
  reconciliationWarnings: [
    "SAP dispatches do not carry ingredient HS codes in a way FOS can use directly.",
    "Goods receipt lines still require manual CoC enrichment from invoices and delivery notes.",
    "Indococoa source linkage via N A Enterprises was added manually after on-site discovery, not from ERP.",
  ],
};

export const reports: ReportRecord[] = [
  {
    id: "report-annual-dd-2026",
    title: "Annual due diligence operating report",
    scope: "Governance, supplier response rate, and retained evidence",
    status: "DRAFT",
    generatedAt: "2026-05-22",
    note: "Will remain a narrative governance artifact for GFI even when EU agents file the DDS.",
  },
  {
    id: "report-agent-hand-off",
    title: "EU agent handoff readiness register",
    scope: "Operator readiness, package release, and TRACES dependency",
    status: "CURRENT",
    generatedAt: "2026-05-21",
    note: "Used to track whether the receiving EU operator can act on the supplied compliance package.",
  },
];

export const supplierPortalRequests: SupplierPortalRequest[] = [
  {
    id: "portal-cargill-2026",
    supplierId: "sup-cargill",
    supplierName: "Cargill Palm Products SDN BHD",
    actorType: "INTERMEDIARY_PROCESSOR",
    tokenLabel: "PORTAL-CARGILL-2026-05",
    submissionStatus: "CLOSED",
    formType: "INTERMEDIARY",
    targetNodeId: "node-chew-palm-cargill",
    email: "traceability.portklang@cargill.example",
    requestedAt: "2026-05-12",
    expiresAt: "2026-06-12",
    requiredActions: [
      "Submit palm intermediary declaration for the Chew palm fat ingredient.",
      "Disclose upstream trade desks, mills, and plantation or smallholder producers.",
      "Attach commercial and supporting chain-of-custody evidence for the selected palm route.",
    ],
    latestReviewerNote:
      "Supplier provided a complete route-to-producer palm packet. Only the separate customs scope decision remains open.",
  },
  {
    id: "portal-jb-2026",
    supplierId: "sup-jb-cocoa",
    supplierName: "JB Cocoa SDN BHD",
    actorType: "INTERMEDIARY_PROCESSOR",
    tokenLabel: "PORTAL-JBCOCOA-2026-05",
    submissionStatus: "CHANGES_REQUESTED",
    formType: "INTERMEDIARY",
    targetNodeId: "node-choc-natural-jb",
    email: "haris.jb@jbcocoa.com.my",
    requestedAt: "2026-05-20",
    expiresAt: "2026-06-20",
    requiredActions: [
      "Upload corrected farm origin file for Ghana and Ivory Coast source farms.",
      "Add chain-of-custody support for cocoa commercial transaction records.",
      "Sign processor declaration confirming upstream source accuracy.",
    ],
    latestReviewerNote:
      "Two coordinate bundles crossed district boundaries and cannot be approved until corrected.",
  },
  {
    id: "portal-indococoa-2026",
    supplierId: "sup-na-enterprises",
    supplierName: "N A Enterprises (Indococoa)",
    actorType: "INTERMEDIARY_PROCESSOR",
    tokenLabel: "PORTAL-INDOCOCOA-2026-05",
    submissionStatus: "PENDING_RESPONSE",
    formType: "INTERMEDIARY",
    targetNodeId: "node-choc-alkalized-indococoa",
    email: "na_enterprises@cyber.net.pk",
    requestedAt: "2026-05-21",
    expiresAt: "2026-06-21",
    requiredActions: [
      "Complete first-time supplier onboarding profile.",
      "Upload declaration, facility profile, and cocoa origin evidence.",
      "Disclose any upstream grower or aggregator dependencies.",
    ],
    latestReviewerNote:
      "Indococoa route via N A Enterprises was discovered during site review and has not yet submitted the initial package.",
  },
];

export const supplyChainNodes: SupplyChainNode[] = [
  {
    id: "node-chew-palm-cargill",
    ingredientId: "ing-chew-palm",
    productId: "prd-chew",
    supplierId: "sup-cargill",
    parentNodeId: null,
    tier: 1,
    actorType: "DIRECT_SUPPLIER",
    entityName: "Cargill Palm Products SDN BHD",
    country: "Malaysia",
    commodity: "PALM",
    materialName: "Palm fat blend",
    volumeContributionPercent: 100,
    status: "COMPLETE",
  },
  {
    id: "node-chew-palm-sime-desk",
    ingredientId: "ing-chew-palm",
    productId: "prd-chew",
    supplierId: "sup-cargill",
    parentNodeId: "node-chew-palm-cargill",
    tier: 2,
    actorType: "TRADER",
    entityName: "Sime Darby Internal Transfer Desk",
    country: "Malaysia",
    commodity: "PALM",
    materialName: "Segregated crude palm oil",
    volumeContributionPercent: 45,
    status: "COMPLETE",
  },
  {
    id: "node-chew-palm-kempas-mill",
    ingredientId: "ing-chew-palm",
    productId: "prd-chew",
    supplierId: "sup-cargill",
    parentNodeId: "node-chew-palm-sime-desk",
    tier: 3,
    actorType: "MILL",
    entityName: "Kempas Palm Mill 12",
    country: "Malaysia",
    commodity: "PALM",
    materialName: "Crude palm oil",
    volumeContributionPercent: 45,
    status: "COMPLETE",
  },
  {
    id: "node-chew-palm-estate-johor",
    ingredientId: "ing-chew-palm",
    productId: "prd-chew",
    supplierId: "sup-cargill",
    parentNodeId: "node-chew-palm-kempas-mill",
    tier: 4,
    actorType: "ESTATE",
    entityName: "Ladang Seri Makmur Johor Block A",
    country: "Malaysia",
    commodity: "PALM",
    materialName: "Fresh fruit bunches",
    volumeContributionPercent: 27,
    status: "COMPLETE",
  },
  {
    id: "node-chew-palm-coop-johor",
    ingredientId: "ing-chew-palm",
    productId: "prd-chew",
    supplierId: "sup-cargill",
    parentNodeId: "node-chew-palm-kempas-mill",
    tier: 4,
    actorType: "COOPERATIVE",
    entityName: "Koperasi Pekebun Johor Selatan",
    country: "Malaysia",
    commodity: "PALM",
    materialName: "Fresh fruit bunches",
    volumeContributionPercent: 18,
    status: "COMPLETE",
  },
  {
    id: "node-chew-palm-bumitama-desk",
    ingredientId: "ing-chew-palm",
    productId: "prd-chew",
    supplierId: "sup-cargill",
    parentNodeId: "node-chew-palm-cargill",
    tier: 2,
    actorType: "INTERMEDIARY",
    entityName: "Bumitama Collection and Trade Desk",
    country: "Indonesia",
    commodity: "PALM",
    materialName: "Segregated crude palm oil",
    volumeContributionPercent: 55,
    status: "COMPLETE",
  },
  {
    id: "node-chew-palm-pelita-mill",
    ingredientId: "ing-chew-palm",
    productId: "prd-chew",
    supplierId: "sup-cargill",
    parentNodeId: "node-chew-palm-bumitama-desk",
    tier: 3,
    actorType: "MILL",
    entityName: "Pelita Palm Mill 07",
    country: "Indonesia",
    commodity: "PALM",
    materialName: "Crude palm oil",
    volumeContributionPercent: 55,
    status: "COMPLETE",
  },
  {
    id: "node-chew-palm-estate-pelita",
    ingredientId: "ing-chew-palm",
    productId: "prd-chew",
    supplierId: "sup-cargill",
    parentNodeId: "node-chew-palm-pelita-mill",
    tier: 4,
    actorType: "ESTATE",
    entityName: "Estate Bukit Pelita Block C",
    country: "Indonesia",
    commodity: "PALM",
    materialName: "Fresh fruit bunches",
    volumeContributionPercent: 30,
    status: "COMPLETE",
  },
  {
    id: "node-chew-palm-farmer-pelita",
    ingredientId: "ing-chew-palm",
    productId: "prd-chew",
    supplierId: "sup-cargill",
    parentNodeId: "node-chew-palm-pelita-mill",
    tier: 4,
    actorType: "FARMER",
    entityName: "Smallholder Cluster Sungai Pelita",
    country: "Indonesia",
    commodity: "PALM",
    materialName: "Fresh fruit bunches",
    volumeContributionPercent: 25,
    status: "COMPLETE",
  },
  {
    id: "node-choc-natural-jb",
    ingredientId: "ing-choc-cocoa-natural",
    productId: "prd-chocolate",
    supplierId: "sup-jb-cocoa",
    parentNodeId: null,
    tier: 1,
    actorType: "DIRECT_SUPPLIER",
    entityName: "JB Cocoa SDN BHD",
    country: "Malaysia",
    commodity: "COCOA",
    materialName: "Natural cocoa powder",
    volumeContributionPercent: 100,
    status: "GAPS_FOUND",
  },
  {
    id: "node-choc-natural-gh-agg",
    ingredientId: "ing-choc-cocoa-natural",
    productId: "prd-chocolate",
    supplierId: "sup-jb-cocoa",
    parentNodeId: "node-choc-natural-jb",
    tier: 2,
    actorType: "INTERMEDIARY",
    entityName: "Ghana Cocoa Cooperative Aggregator",
    country: "Ghana",
    commodity: "COCOA",
    materialName: "Fermented cocoa beans",
    volumeContributionPercent: 65,
    status: "REQUESTED",
  },
  {
    id: "node-choc-natural-gh-farmer",
    ingredientId: "ing-choc-cocoa-natural",
    productId: "prd-chocolate",
    supplierId: "sup-jb-cocoa",
    parentNodeId: "node-choc-natural-gh-agg",
    tier: 3,
    actorType: "FARMER",
    entityName: "Sassandra grower cluster A",
    country: "Ivory Coast",
    commodity: "COCOA",
    materialName: "Cocoa beans",
    volumeContributionPercent: 65,
    status: "GAPS_FOUND",
  },
  {
    id: "node-choc-alkalized-na",
    ingredientId: "ing-choc-cocoa-alkalized",
    productId: "prd-chocolate",
    supplierId: "sup-na-enterprises",
    parentNodeId: null,
    tier: 1,
    actorType: "DIRECT_SUPPLIER",
    entityName: "N A Enterprises",
    country: "Pakistan",
    commodity: "COCOA",
    materialName: "Alkalized cocoa powder",
    volumeContributionPercent: 100,
    status: "GAPS_FOUND",
  },
  {
    id: "node-choc-alkalized-indococoa",
    ingredientId: "ing-choc-cocoa-alkalized",
    productId: "prd-chocolate",
    supplierId: "sup-na-enterprises",
    parentNodeId: "node-choc-alkalized-na",
    tier: 2,
    actorType: "INTERMEDIARY",
    entityName: "Indococoa",
    country: "Indonesia",
    commodity: "COCOA",
    materialName: "Alkalized cocoa powder",
    volumeContributionPercent: 100,
    status: "REQUESTED",
  },
];

export const eudrFormRequests: EudrFormRequest[] = [
  {
    id: "req-cargill-2026",
    tokenLabel: "PORTAL-CARGILL-2026-05",
    targetSupplierId: "sup-cargill",
    targetNodeId: "node-chew-palm-cargill",
    formType: "INTERMEDIARY",
    requestedBy: "GFI Compliance",
    requestedAt: "2026-05-12",
    expiresAt: "2026-06-12",
    status: "CLOSED",
    email: "traceability.portklang@cargill.example",
    parentRequestId: null,
  },
  {
    id: "req-sime-desk-2026",
    tokenLabel: "PORTAL-SIME-DESK-2026-05",
    targetSupplierId: "sup-cargill",
    targetNodeId: "node-chew-palm-sime-desk",
    formType: "INTERMEDIARY",
    requestedBy: "Cargill Palm Products SDN BHD",
    requestedAt: "2026-05-13",
    expiresAt: "2026-06-13",
    status: "CLOSED",
    email: "transferdesk@sime.example",
    parentRequestId: "req-cargill-2026",
  },
  {
    id: "req-bumitama-desk-2026",
    tokenLabel: "PORTAL-BUMITAMA-DESK-2026-05",
    targetSupplierId: "sup-cargill",
    targetNodeId: "node-chew-palm-bumitama-desk",
    formType: "INTERMEDIARY",
    requestedBy: "Cargill Palm Products SDN BHD",
    requestedAt: "2026-05-13",
    expiresAt: "2026-06-13",
    status: "CLOSED",
    email: "trade.desk@bumitama.example",
    parentRequestId: "req-cargill-2026",
  },
  {
    id: "req-kempas-mill-2026",
    tokenLabel: "PORTAL-KEMPAS-MILL-2026-05",
    targetSupplierId: "sup-cargill",
    targetNodeId: "node-chew-palm-kempas-mill",
    formType: "INTERMEDIARY",
    requestedBy: "Sime Darby Internal Transfer Desk",
    requestedAt: "2026-05-14",
    expiresAt: "2026-06-14",
    status: "CLOSED",
    email: "compliance@kempasmill.example",
    parentRequestId: "req-sime-desk-2026",
  },
  {
    id: "req-pelita-mill-2026",
    tokenLabel: "PORTAL-PELITA-MILL-2026-05",
    targetSupplierId: "sup-cargill",
    targetNodeId: "node-chew-palm-pelita-mill",
    formType: "INTERMEDIARY",
    requestedBy: "Bumitama Collection and Trade Desk",
    requestedAt: "2026-05-14",
    expiresAt: "2026-06-14",
    status: "CLOSED",
    email: "pelita.mill@bumitama.example",
    parentRequestId: "req-bumitama-desk-2026",
  },
  {
    id: "req-estate-johor-2026",
    tokenLabel: "PORTAL-JOHOR-ESTATE-2026-05",
    targetSupplierId: "sup-cargill",
    targetNodeId: "node-chew-palm-estate-johor",
    formType: "FARMER",
    requestedBy: "Kempas Palm Mill 12",
    requestedAt: "2026-05-15",
    expiresAt: "2026-06-15",
    status: "CLOSED",
    email: "estate-a@serimakmur.example",
    parentRequestId: "req-kempas-mill-2026",
  },
  {
    id: "req-coop-johor-2026",
    tokenLabel: "PORTAL-JOHOR-COOP-2026-05",
    targetSupplierId: "sup-cargill",
    targetNodeId: "node-chew-palm-coop-johor",
    formType: "FARMER",
    requestedBy: "Kempas Palm Mill 12",
    requestedAt: "2026-05-15",
    expiresAt: "2026-06-15",
    status: "CLOSED",
    email: "admin@koperasijohor.example",
    parentRequestId: "req-kempas-mill-2026",
  },
  {
    id: "req-estate-pelita-2026",
    tokenLabel: "PORTAL-PELITA-ESTATE-2026-05",
    targetSupplierId: "sup-cargill",
    targetNodeId: "node-chew-palm-estate-pelita",
    formType: "FARMER",
    requestedBy: "Pelita Palm Mill 07",
    requestedAt: "2026-05-15",
    expiresAt: "2026-06-15",
    status: "CLOSED",
    email: "blockc@pelitaestate.example",
    parentRequestId: "req-pelita-mill-2026",
  },
  {
    id: "req-farmer-pelita-2026",
    tokenLabel: "PORTAL-SUNGAI-PELITA-2026-05",
    targetSupplierId: "sup-cargill",
    targetNodeId: "node-chew-palm-farmer-pelita",
    formType: "FARMER",
    requestedBy: "Pelita Palm Mill 07",
    requestedAt: "2026-05-15",
    expiresAt: "2026-06-15",
    status: "CLOSED",
    email: "cluster-admin@sungaipelita.example",
    parentRequestId: "req-pelita-mill-2026",
  },
  {
    id: "req-jb-2026",
    tokenLabel: "PORTAL-JBCOCOA-2026-05",
    targetSupplierId: "sup-jb-cocoa",
    targetNodeId: "node-choc-natural-jb",
    formType: "INTERMEDIARY",
    requestedBy: "GFI Compliance",
    requestedAt: "2026-05-20",
    expiresAt: "2026-06-20",
    status: "CHANGES_REQUESTED",
    email: "haris.jb@jbcocoa.com.my",
    parentRequestId: null,
  },
  {
    id: "req-indococoa-2026",
    tokenLabel: "PORTAL-INDOCOCOA-2026-05",
    targetSupplierId: "sup-na-enterprises",
    targetNodeId: "node-choc-alkalized-indococoa",
    formType: "INTERMEDIARY",
    requestedBy: "GFI Compliance",
    requestedAt: "2026-05-21",
    expiresAt: "2026-06-21",
    status: "PENDING_RESPONSE",
    email: "na_enterprises@cyber.net.pk",
    parentRequestId: null,
  },
  {
    id: "req-gh-farmer-2026",
    tokenLabel: "PORTAL-GH-FARMER-2026-05",
    targetSupplierId: "sup-jb-cocoa",
    targetNodeId: "node-choc-natural-gh-farmer",
    formType: "FARMER",
    requestedBy: "JB Cocoa SDN BHD",
    requestedAt: "2026-05-21",
    expiresAt: "2026-06-21",
    status: "CHANGES_REQUESTED",
    email: "cluster-admin@sassandra.example",
    parentRequestId: "req-jb-2026",
  },
];

export const supplyChainEdges: SupplyChainEdge[] = [
  {
    id: "edge-sime-desk-cargill",
    fromNodeId: "node-chew-palm-sime-desk",
    toNodeId: "node-chew-palm-cargill",
    relationshipType: "SUPPLIES_TO",
    materialName: "Segregated crude palm oil",
    volumePercent: 45,
    proofDocumentIds: ["evid-sime-desk-trade-proof"],
    status: "SUPPORTED",
  },
  {
    id: "edge-kempas-sime-desk",
    fromNodeId: "node-chew-palm-kempas-mill",
    toNodeId: "node-chew-palm-sime-desk",
    relationshipType: "PROCESSES_FOR",
    materialName: "Crude palm oil",
    volumePercent: 45,
    proofDocumentIds: ["evid-kempas-intermediary-decl"],
    status: "SUPPORTED",
  },
  {
    id: "edge-estate-johor-kempas",
    fromNodeId: "node-chew-palm-estate-johor",
    toNodeId: "node-chew-palm-kempas-mill",
    relationshipType: "FARM_SOURCE_FOR",
    materialName: "Fresh fruit bunches",
    volumePercent: 27,
    proofDocumentIds: ["evid-estate-johor-geo"],
    status: "SUPPORTED",
  },
  {
    id: "edge-coop-johor-kempas",
    fromNodeId: "node-chew-palm-coop-johor",
    toNodeId: "node-chew-palm-kempas-mill",
    relationshipType: "FARM_SOURCE_FOR",
    materialName: "Fresh fruit bunches",
    volumePercent: 18,
    proofDocumentIds: ["evid-coop-johor-geo"],
    status: "SUPPORTED",
  },
  {
    id: "edge-bumitama-desk-cargill",
    fromNodeId: "node-chew-palm-bumitama-desk",
    toNodeId: "node-chew-palm-cargill",
    relationshipType: "SUPPLIES_TO",
    materialName: "Segregated crude palm oil",
    volumePercent: 55,
    proofDocumentIds: ["evid-bumitama-desk-trade-proof"],
    status: "SUPPORTED",
  },
  {
    id: "edge-pelita-mill-bumitama",
    fromNodeId: "node-chew-palm-pelita-mill",
    toNodeId: "node-chew-palm-bumitama-desk",
    relationshipType: "PROCESSES_FOR",
    materialName: "Crude palm oil",
    volumePercent: 55,
    proofDocumentIds: ["evid-pelita-intermediary-decl"],
    status: "SUPPORTED",
  },
  {
    id: "edge-estate-pelita-mill",
    fromNodeId: "node-chew-palm-estate-pelita",
    toNodeId: "node-chew-palm-pelita-mill",
    relationshipType: "FARM_SOURCE_FOR",
    materialName: "Fresh fruit bunches",
    volumePercent: 30,
    proofDocumentIds: ["evid-estate-pelita-geo"],
    status: "SUPPORTED",
  },
  {
    id: "edge-farmer-pelita-mill",
    fromNodeId: "node-chew-palm-farmer-pelita",
    toNodeId: "node-chew-palm-pelita-mill",
    relationshipType: "FARM_SOURCE_FOR",
    materialName: "Fresh fruit bunches",
    volumePercent: 25,
    proofDocumentIds: ["evid-farmer-pelita-geo"],
    status: "SUPPORTED",
  },
  {
    id: "edge-gh-agg-jb",
    fromNodeId: "node-choc-natural-gh-agg",
    toNodeId: "node-choc-natural-jb",
    relationshipType: "SUPPLIES_TO",
    materialName: "Fermented cocoa beans",
    volumePercent: 65,
    proofDocumentIds: [],
    status: "GAP",
  },
  {
    id: "edge-gh-farmer-agg",
    fromNodeId: "node-choc-natural-gh-farmer",
    toNodeId: "node-choc-natural-gh-agg",
    relationshipType: "FARM_SOURCE_FOR",
    materialName: "Cocoa beans",
    volumePercent: 65,
    proofDocumentIds: [],
    status: "GAP",
  },
  {
    id: "edge-indococoa-na",
    fromNodeId: "node-choc-alkalized-indococoa",
    toNodeId: "node-choc-alkalized-na",
    relationshipType: "SUPPLIES_TO",
    materialName: "Alkalized cocoa powder",
    volumePercent: 100,
    proofDocumentIds: [],
    status: "GAP",
  },
];

export const intermediaryDeclarationSubmissions: IntermediaryDeclarationSubmission[] = [
  {
    id: "sub-cargill-2026-complete",
    requestId: "req-cargill-2026",
    nodeId: "node-chew-palm-cargill",
    submittedAt: "2026-05-13",
    sections: {
      section1: { roles: ["Primary Refiner"], commodities: ["Palm and Palm-Derived Products"] },
      section2: { legalName: "Cargill Palm Products SDN BHD", country: "Malaysia" },
      section5A: { traceabilityExportAvailable: true, recordsRetainedFiveYears: true },
    },
    upstreamEntities: [
      {
        id: "upstream-sime-desk",
        name: "Sime Darby Internal Transfer Desk",
        entityType: "Trader",
        address: "Johor and Klang Valley internal transfer route",
        materialName: "Segregated crude palm oil",
        volumeContributionPercent: 45,
        certifiedSupplier: true,
        certificateAttached: true,
      },
      {
        id: "upstream-bumitama-desk",
        name: "Bumitama Collection and Trade Desk",
        entityType: "Trader",
        address: "West Kalimantan collection and trade route",
        materialName: "Segregated crude palm oil",
        volumeContributionPercent: 55,
        certifiedSupplier: true,
        certificateAttached: true,
      },
    ],
    traceabilityControls:
      "Each palm route is held in a segregated ingredient dossier with upstream trade proof, mill intake reconciliation, and producer-level geolocation files retained at ingredient level.",
    signatureName: "Cargill compliance team",
  },
  {
    id: "sub-sime-desk-2026-complete",
    requestId: "req-sime-desk-2026",
    nodeId: "node-chew-palm-sime-desk",
    submittedAt: "2026-05-14",
    sections: {
      section1: { roles: ["Internal Trade Desk"], commodities: ["Palm Oil"] },
      section2: { legalName: "Sime Darby Internal Transfer Desk", country: "Malaysia" },
      section5A: { traceabilityExportAvailable: true, recordsRetainedFiveYears: true },
    },
    upstreamEntities: [
      {
        id: "upstream-kempas-mill",
        name: "Kempas Palm Mill 12",
        entityType: "Mill",
        address: "Johor mill collection perimeter",
        materialName: "Crude palm oil",
        volumeContributionPercent: 45,
        certifiedSupplier: true,
        certificateAttached: true,
      },
    ],
    traceabilityControls:
      "Transfer desk references shipment lots to mill dispatches and keeps mill-to-refinery transfer records attached to each commercial route.",
    signatureName: "Sime Darby transfer desk lead",
  },
  {
    id: "sub-bumitama-desk-2026-complete",
    requestId: "req-bumitama-desk-2026",
    nodeId: "node-chew-palm-bumitama-desk",
    submittedAt: "2026-05-14",
    sections: {
      section1: { roles: ["Collection Trader"], commodities: ["Palm Oil"] },
      section2: { legalName: "Bumitama Collection and Trade Desk", country: "Indonesia" },
      section5A: { traceabilityExportAvailable: true, recordsRetainedFiveYears: true },
    },
    upstreamEntities: [
      {
        id: "upstream-pelita-mill",
        name: "Pelita Palm Mill 07",
        entityType: "Mill",
        address: "West Kalimantan mill route",
        materialName: "Crude palm oil",
        volumeContributionPercent: 55,
        certifiedSupplier: true,
        certificateAttached: true,
      },
    ],
    traceabilityControls:
      "Desk consolidates estate and smallholder loads by mill day and retains dispatch-to-vessel references for the export route delivered into Cargill's refining flow.",
    signatureName: "Bumitama trade desk manager",
  },
  {
    id: "sub-kempas-mill-2026-complete",
    requestId: "req-kempas-mill-2026",
    nodeId: "node-chew-palm-kempas-mill",
    submittedAt: "2026-05-15",
    sections: {
      section1: { roles: ["Palm Mill"], commodities: ["Fresh Fruit Bunches / CPO"] },
      section2: { legalName: "Kempas Palm Mill 12", country: "Malaysia" },
      section5A: { traceabilityExportAvailable: true, recordsRetainedFiveYears: true },
    },
    upstreamEntities: [
      {
        id: "upstream-estate-johor",
        name: "Ladang Seri Makmur Johor Block A",
        entityType: "Estate",
        address: "Johor plantation estate block A",
        materialName: "Fresh fruit bunches",
        volumeContributionPercent: 27,
        certifiedSupplier: true,
        certificateAttached: true,
      },
      {
        id: "upstream-coop-johor",
        name: "Koperasi Pekebun Johor Selatan",
        entityType: "Cooperative",
        address: "Johor cooperative delivery route",
        materialName: "Fresh fruit bunches",
        volumeContributionPercent: 18,
        certifiedSupplier: true,
        certificateAttached: true,
      },
    ],
    traceabilityControls:
      "Mill retains weighbridge, intake, and lot separation records and reconciles each producer route to the crude palm oil dispatch referenced by the transfer desk.",
    signatureName: "Kempas mill compliance officer",
  },
  {
    id: "sub-pelita-mill-2026-complete",
    requestId: "req-pelita-mill-2026",
    nodeId: "node-chew-palm-pelita-mill",
    submittedAt: "2026-05-15",
    sections: {
      section1: { roles: ["Palm Mill"], commodities: ["Fresh Fruit Bunches / CPO"] },
      section2: { legalName: "Pelita Palm Mill 07", country: "Indonesia" },
      section5A: { traceabilityExportAvailable: true, recordsRetainedFiveYears: true },
    },
    upstreamEntities: [
      {
        id: "upstream-estate-pelita",
        name: "Estate Bukit Pelita Block C",
        entityType: "Estate",
        address: "West Kalimantan estate block C",
        materialName: "Fresh fruit bunches",
        volumeContributionPercent: 30,
        certifiedSupplier: true,
        certificateAttached: true,
      },
      {
        id: "upstream-farmer-pelita",
        name: "Smallholder Cluster Sungai Pelita",
        entityType: "Farm",
        address: "West Kalimantan smallholder cluster route",
        materialName: "Fresh fruit bunches",
        volumeContributionPercent: 25,
        certifiedSupplier: false,
        certificateAttached: true,
      },
    ],
    traceabilityControls:
      "Mill ties each estate and smallholder intake ticket to the daily extraction lot and stores the geolocation file reference with the export-facing provenance package.",
    signatureName: "Pelita mill traceability lead",
  },
  {
    id: "sub-jb-2026-draft",
    requestId: "req-jb-2026",
    nodeId: "node-choc-natural-jb",
    submittedAt: "2026-05-21",
    sections: {
      section1: { roles: ["Primary Processor"], commodities: ["Cocoa & Cocoa-Derived Products"] },
      section2: { legalName: "JB Cocoa SDN BHD", country: "Malaysia" },
      section5A: { traceabilityExportAvailable: true, recordsRetainedFiveYears: true },
    },
    upstreamEntities: [
      {
        id: "upstream-gh-agg",
        name: "Ghana Cocoa Cooperative Aggregator",
        entityType: "Trader",
        address: "Sassandra and partner cooperative collection regions",
        materialName: "Fermented cocoa beans",
        volumeContributionPercent: 65,
        certifiedSupplier: false,
        certificateAttached: false,
      },
      {
        id: "upstream-ci-farm",
        name: "Sassandra grower cluster A",
        entityType: "Farm",
        address: "Ivory Coast grower cluster, district confirmation pending",
        materialName: "Cocoa beans",
        volumeContributionPercent: 65,
        certifiedSupplier: false,
        certificateAttached: false,
      },
    ],
    traceabilityControls:
      "Batch records are maintained, but transaction-level CoC proof and corrected farm coordinates remain incomplete.",
    signatureName: "JB Cocoa compliance team",
  },
];

export const farmerDeclarationSubmissions: FarmerDeclarationSubmission[] = [
  {
    id: "farmer-estate-johor-2026",
    requestId: "req-estate-johor-2026",
    nodeId: "node-chew-palm-estate-johor",
    submittedAt: "2026-05-16",
    sections: {
      section1: { producerType: "Estate", fullName: "Ladang Seri Makmur Johor Block A", country: "Malaysia" },
      section2: { commodities: ["Palm"], harvestYears: ["2025", "2026"], annualVolume: "4,300 MT FFB" },
      section3: { landBasis: "Concession / long-term lease", landDocuments: ["estate-title-johor-a.pdf"] },
      section4: { plots: ["PLT-JOH-A1", "PLT-JOH-A2"] },
      section5: { confirmations: ["No deforestation after cut-off date"], previousLandUse: "Mature palm replanting area", boundaryChanged: false },
      section9: { firstPointOfSale: "Kempas Palm Mill 12", sellingMethod: "Direct estate dispatch" },
      section12: { signatureName: "Rahman Iskandar", declarationDate: "2026-05-16" },
    },
    plotRows: [
      {
        plotId: "PLT-JOH-A1",
        latitudes: "1.6612,1.6625,1.6608,1.6612",
        longitudes: "103.7121,103.7149,103.7160,103.7121",
        areaHa: 12.4,
        commodityGrown: "Palm",
        productionVolume: "2,120 MT FFB",
        coordinateType: "FILE",
        fileName: "estate-johor-block-a-plot-a1.geojson",
      },
      {
        plotId: "PLT-JOH-A2",
        latitudes: "1.6548,1.6560,1.6542,1.6548",
        longitudes: "103.7063,103.7088,103.7102,103.7063",
        areaHa: 10.1,
        commodityGrown: "Palm",
        productionVolume: "2,180 MT FFB",
        coordinateType: "FILE",
        fileName: "estate-johor-block-a-plot-a2.geojson",
      },
    ],
    signatureName: "Rahman Iskandar",
  },
  {
    id: "farmer-coop-johor-2026",
    requestId: "req-coop-johor-2026",
    nodeId: "node-chew-palm-coop-johor",
    submittedAt: "2026-05-16",
    sections: {
      section1: { producerType: "Cooperative", fullName: "Koperasi Pekebun Johor Selatan", country: "Malaysia" },
      section2: { commodities: ["Palm"], harvestYears: ["2025", "2026"], annualVolume: "2,700 MT FFB" },
      section3: { landBasis: "Member-owned smallholdings", landDocuments: ["coop-member-register.pdf"] },
      section4: { plots: ["PLT-KPJ-11", "PLT-KPJ-18"] },
      section5: { confirmations: ["No deforestation after cut-off date"], previousLandUse: "Existing palm smallholdings", boundaryChanged: false },
      section9: { firstPointOfSale: "Kempas Palm Mill 12", sellingMethod: "Cooperative dispatch" },
      section12: { signatureName: "Nur Aisyah", declarationDate: "2026-05-16" },
    },
    plotRows: [
      {
        plotId: "PLT-KPJ-11",
        latitudes: "1.6124",
        longitudes: "103.5987",
        areaHa: 3.8,
        commodityGrown: "Palm",
        productionVolume: "1,180 MT FFB",
        coordinateType: "POINT",
        fileName: "",
      },
      {
        plotId: "PLT-KPJ-18",
        latitudes: "1.6181,1.6194,1.6172,1.6181",
        longitudes: "103.6044,103.6071,103.6085,103.6044",
        areaHa: 6.2,
        commodityGrown: "Palm",
        productionVolume: "1,520 MT FFB",
        coordinateType: "FILE",
        fileName: "koperasi-johor-plot-18.geojson",
      },
    ],
    signatureName: "Nur Aisyah",
  },
  {
    id: "farmer-estate-pelita-2026",
    requestId: "req-estate-pelita-2026",
    nodeId: "node-chew-palm-estate-pelita",
    submittedAt: "2026-05-16",
    sections: {
      section1: { producerType: "Estate", fullName: "Estate Bukit Pelita Block C", country: "Indonesia" },
      section2: { commodities: ["Palm"], harvestYears: ["2025", "2026"], annualVolume: "4,950 MT FFB" },
      section3: { landBasis: "Hak Guna Usaha", landDocuments: ["pelita-hgu-block-c.pdf"] },
      section4: { plots: ["PLT-PEL-C3", "PLT-PEL-C4"] },
      section5: { confirmations: ["No deforestation after cut-off date"], previousLandUse: "Mature estate block", boundaryChanged: false },
      section9: { firstPointOfSale: "Pelita Palm Mill 07", sellingMethod: "Direct estate dispatch" },
      section12: { signatureName: "Adi Saputra", declarationDate: "2026-05-16" },
    },
    plotRows: [
      {
        plotId: "PLT-PEL-C3",
        latitudes: "-0.4341,-0.4329,-0.4317,-0.4341",
        longitudes: "111.0221,111.0254,111.0272,111.0221",
        areaHa: 14.7,
        commodityGrown: "Palm",
        productionVolume: "2,430 MT FFB",
        coordinateType: "FILE",
        fileName: "pelita-block-c3.geojson",
      },
      {
        plotId: "PLT-PEL-C4",
        latitudes: "-0.4418,-0.4404,-0.4397,-0.4418",
        longitudes: "111.0196,111.0222,111.0249,111.0196",
        areaHa: 13.5,
        commodityGrown: "Palm",
        productionVolume: "2,520 MT FFB",
        coordinateType: "FILE",
        fileName: "pelita-block-c4.geojson",
      },
    ],
    signatureName: "Adi Saputra",
  },
  {
    id: "farmer-pelita-smallholders-2026",
    requestId: "req-farmer-pelita-2026",
    nodeId: "node-chew-palm-farmer-pelita",
    submittedAt: "2026-05-17",
    sections: {
      section1: { producerType: "Farmer", fullName: "Smallholder Cluster Sungai Pelita", country: "Indonesia" },
      section2: { commodities: ["Palm"], harvestYears: ["2025", "2026"], annualVolume: "3,050 MT FFB" },
      section3: { landBasis: "Smallholder ownership / village land titles", landDocuments: ["sungai-pelita-member-title-index.pdf"] },
      section4: { plots: ["PLT-SP-04", "PLT-SP-09"] },
      section5: { confirmations: ["No deforestation after cut-off date"], previousLandUse: "Existing mixed smallholder palm plots", boundaryChanged: false },
      section9: { firstPointOfSale: "Pelita Palm Mill 07", sellingMethod: "Cluster collection dispatch" },
      section12: { signatureName: "Yusuf Hamid", declarationDate: "2026-05-17" },
    },
    plotRows: [
      {
        plotId: "PLT-SP-04",
        latitudes: "-0.4488,-0.4472,-0.4459,-0.4488",
        longitudes: "111.0141,111.0162,111.0188,111.0141",
        areaHa: 5.4,
        commodityGrown: "Palm",
        productionVolume: "1,480 MT FFB",
        coordinateType: "FILE",
        fileName: "sungai-pelita-plot-04.geojson",
      },
      {
        plotId: "PLT-SP-09",
        latitudes: "-0.4521,-0.4506,-0.4498,-0.4521",
        longitudes: "111.0118,111.0144,111.0161,111.0118",
        areaHa: 4.9,
        commodityGrown: "Palm",
        productionVolume: "1,570 MT FFB",
        coordinateType: "POLYGON",
        fileName: "",
      },
    ],
    signatureName: "Yusuf Hamid",
  },
];

export const eudrEvidenceAttachments: EudrEvidenceAttachment[] = [
  {
    id: "evid-cargill-intermediary-decl",
    requestId: "req-cargill-2026",
    nodeId: "node-chew-palm-cargill",
    sectionRef: "INTERMEDIARY_SECTION_8",
    documentRole: "INTERMEDIARY_DECLARATION",
    fileName: "cargill-palm-intermediary-declaration.pdf",
    status: "ATTACHED",
  },
  {
    id: "evid-cargill-sustainability",
    requestId: "req-cargill-2026",
    nodeId: "node-chew-palm-cargill",
    sectionRef: "INTERMEDIARY_SECTION_6",
    documentRole: "SUSTAINABILITY_CERTIFICATE",
    fileName: "cargill-rspo-sg-route-summary.pdf",
    status: "ATTACHED",
  },
  {
    id: "evid-sime-desk-trade-proof",
    requestId: "req-sime-desk-2026",
    nodeId: "node-chew-palm-sime-desk",
    sectionRef: "INTERMEDIARY_SECTION_7",
    documentRole: "UPSTREAM_TRADE_PROOF",
    fileName: "sime-desk-to-cargill-route-pack.pdf",
    status: "ATTACHED",
  },
  {
    id: "evid-bumitama-desk-trade-proof",
    requestId: "req-bumitama-desk-2026",
    nodeId: "node-chew-palm-bumitama-desk",
    sectionRef: "INTERMEDIARY_SECTION_7",
    documentRole: "UPSTREAM_TRADE_PROOF",
    fileName: "bumitama-desk-route-pack.pdf",
    status: "ATTACHED",
  },
  {
    id: "evid-kempas-intermediary-decl",
    requestId: "req-kempas-mill-2026",
    nodeId: "node-chew-palm-kempas-mill",
    sectionRef: "INTERMEDIARY_SECTION_8",
    documentRole: "INTERMEDIARY_DECLARATION",
    fileName: "kempas-mill-declaration.pdf",
    status: "ATTACHED",
  },
  {
    id: "evid-pelita-intermediary-decl",
    requestId: "req-pelita-mill-2026",
    nodeId: "node-chew-palm-pelita-mill",
    sectionRef: "INTERMEDIARY_SECTION_8",
    documentRole: "INTERMEDIARY_DECLARATION",
    fileName: "pelita-mill-declaration.pdf",
    status: "ATTACHED",
  },
  {
    id: "evid-estate-johor-geo",
    requestId: "req-estate-johor-2026",
    nodeId: "node-chew-palm-estate-johor",
    sectionRef: "FARMER_SECTION_4",
    documentRole: "GEOLOCATION_FILE",
    fileName: "estate-johor-block-a.geojson.zip",
    status: "ATTACHED",
  },
  {
    id: "evid-estate-johor-land",
    requestId: "req-estate-johor-2026",
    nodeId: "node-chew-palm-estate-johor",
    sectionRef: "FARMER_SECTION_3",
    documentRole: "LAND_RIGHTS_EVIDENCE",
    fileName: "estate-johor-land-rights.pdf",
    status: "ATTACHED",
  },
  {
    id: "evid-coop-johor-geo",
    requestId: "req-coop-johor-2026",
    nodeId: "node-chew-palm-coop-johor",
    sectionRef: "FARMER_SECTION_4",
    documentRole: "GEOLOCATION_FILE",
    fileName: "johor-cooperative-plots.geojson.zip",
    status: "ATTACHED",
  },
  {
    id: "evid-coop-johor-land",
    requestId: "req-coop-johor-2026",
    nodeId: "node-chew-palm-coop-johor",
    sectionRef: "FARMER_SECTION_3",
    documentRole: "LAND_RIGHTS_EVIDENCE",
    fileName: "johor-cooperative-land-basis.pdf",
    status: "ATTACHED",
  },
  {
    id: "evid-estate-pelita-geo",
    requestId: "req-estate-pelita-2026",
    nodeId: "node-chew-palm-estate-pelita",
    sectionRef: "FARMER_SECTION_4",
    documentRole: "GEOLOCATION_FILE",
    fileName: "pelita-estate-block-c.geojson.zip",
    status: "ATTACHED",
  },
  {
    id: "evid-estate-pelita-land",
    requestId: "req-estate-pelita-2026",
    nodeId: "node-chew-palm-estate-pelita",
    sectionRef: "FARMER_SECTION_3",
    documentRole: "LAND_RIGHTS_EVIDENCE",
    fileName: "pelita-estate-hgu.pdf",
    status: "ATTACHED",
  },
  {
    id: "evid-farmer-pelita-geo",
    requestId: "req-farmer-pelita-2026",
    nodeId: "node-chew-palm-farmer-pelita",
    sectionRef: "FARMER_SECTION_4",
    documentRole: "GEOLOCATION_FILE",
    fileName: "sungai-pelita-smallholder-cluster.geojson.zip",
    status: "ATTACHED",
  },
  {
    id: "evid-farmer-pelita-land",
    requestId: "req-farmer-pelita-2026",
    nodeId: "node-chew-palm-farmer-pelita",
    sectionRef: "FARMER_SECTION_3",
    documentRole: "LAND_RIGHTS_EVIDENCE",
    fileName: "sungai-pelita-title-index.pdf",
    status: "ATTACHED",
  },
  {
    id: "evid-jb-intermediary-decl",
    requestId: "req-jb-2026",
    nodeId: "node-choc-natural-jb",
    sectionRef: "INTERMEDIARY_SECTION_8",
    documentRole: "INTERMEDIARY_DECLARATION",
    fileName: "jb-cocoa-intermediary-declaration-draft.pdf",
    status: "ATTACHED",
  },
  {
    id: "evid-gh-geo-missing",
    requestId: "req-gh-farmer-2026",
    nodeId: "node-choc-natural-gh-farmer",
    sectionRef: "FARMER_SECTION_4",
    documentRole: "GEOLOCATION_FILE",
    fileName: "corrected-farm-plot-file-required.geojson",
    status: "REQUESTED",
  },
];

type ConsignmentDestinationRegion = "Europe" | "Gulf" | "Other";

const CONSIGNMENT_DESTINATION_OVERRIDES: Record<
  string,
  { destination: string; country: string; region: ConsignmentDestinationRegion }
> = {
  "con-bubblegum-001": { destination: "Rotterdam, Netherlands", country: "Netherlands", region: "Europe" },
  "con-chew-002": { destination: "Hamburg, Germany", country: "Germany", region: "Europe" },
  "con-choc-003": { destination: "Gdansk, Poland", country: "Poland", region: "Europe" },
  "con-gum-004": { destination: "Prague, Czech Republic", country: "Czech Republic", region: "Europe" },
  "con-candy-005": { destination: "Valencia, Spain", country: "Spain", region: "Europe" },
  "con-jelly-006": { destination: "Varna, Bulgaria", country: "Bulgaria", region: "Europe" },
  "con-bubblegum-007": { destination: "Le Havre, France", country: "France", region: "Europe" },
  "con-candy-008": { destination: "Dublin, Ireland", country: "Ireland", region: "Europe" },
  "con-jelly-009": { destination: "Genoa, Italy", country: "Italy", region: "Europe" },
  "con-gum-010": { destination: "Constanta, Romania", country: "Romania", region: "Europe" },
  "con-chew-011": { destination: "Bremerhaven, Germany", country: "Germany", region: "Europe" },
  "con-wafers-012": { destination: "Dubai, United Arab Emirates", country: "United Arab Emirates", region: "Gulf" },
  "con-chew-013": { destination: "Jeddah, Saudi Arabia", country: "Saudi Arabia", region: "Gulf" },
  "con-chew-014": { destination: "Doha, Qatar", country: "Qatar", region: "Gulf" },
  "con-wafers-015": { destination: "Muscat, Oman", country: "Oman", region: "Gulf" },
  "con-choc-016": { destination: "Kuwait City, Kuwait", country: "Kuwait", region: "Gulf" },
  "con-choc-017": { destination: "Singapore, Singapore", country: "Singapore", region: "Other" },
  "con-choc-018": { destination: "Cape Town, South Africa", country: "South Africa", region: "Other" },
};

const CONSIGNMENT_SHIPMENT_STATUSES: Record<ConsignmentRecord["id"], ConsignmentRecord["shipmentStatus"]> = {
  "con-bubblegum-001": "SHIPPED",
  "con-chew-002": "SHIPPED",
  "con-choc-003": "TO_BE_SHIPPED",
  "con-gum-004": "SHIPPED",
  "con-candy-005": "SHIPPED",
  "con-jelly-006": "SHIPPED",
  "con-bubblegum-007": "IN_TRANSIT",
  "con-candy-008": "SHIPPED",
  "con-jelly-009": "IN_TRANSIT",
  "con-gum-010": "SHIPPED",
  "con-chew-011": "IN_TRANSIT",
  "con-wafers-012": "IN_TRANSIT",
  "con-chew-013": "IN_TRANSIT",
  "con-chew-014": "TO_BE_SHIPPED",
  "con-wafers-015": "TO_BE_SHIPPED",
  "con-choc-016": "TO_BE_SHIPPED",
  "con-choc-017": "TO_BE_SHIPPED",
  "con-choc-018": "TO_BE_SHIPPED",
};

const EUROPE_COUNTRY_TARGETS = [
  { country: "Netherlands", destination: "Rotterdam, Netherlands", targetCount: 14, templateId: "con-bubblegum-001", refCode: "NLD" },
  { country: "Poland", destination: "Gdansk, Poland", targetCount: 10, templateId: "con-choc-003", refCode: "POL" },
  { country: "Czech Republic", destination: "Prague, Czech Republic", targetCount: 9, templateId: "con-gum-004", refCode: "CZE" },
  { country: "Germany", destination: "Hamburg, Germany", targetCount: 7, templateId: "con-chew-002", refCode: "DEU" },
  { country: "Spain", destination: "Valencia, Spain", targetCount: 5, templateId: "con-candy-005", refCode: "ESP" },
  { country: "Bulgaria", destination: "Varna, Bulgaria", targetCount: 4, templateId: "con-jelly-006", refCode: "BGR" },
  { country: "France", destination: "Le Havre, France", targetCount: 3, templateId: "con-bubblegum-007", refCode: "FRA" },
  { country: "Ireland", destination: "Dublin, Ireland", targetCount: 3, templateId: "con-candy-008", refCode: "IRL" },
  { country: "Italy", destination: "Genoa, Italy", targetCount: 1, templateId: "con-jelly-009", refCode: "ITA" },
  { country: "Romania", destination: "Constanta, Romania", targetCount: 1, templateId: "con-gum-010", refCode: "ROU" },
] as const;

const GULF_COUNTRY_TARGETS = [
  { country: "United Arab Emirates", destination: "Dubai, United Arab Emirates", targetCount: 4, templateId: "con-wafers-012", refCode: "UAE" },
  { country: "Saudi Arabia", destination: "Jeddah, Saudi Arabia", targetCount: 3, templateId: "con-chew-013", refCode: "SAU" },
  { country: "Qatar", destination: "Doha, Qatar", targetCount: 2, templateId: "con-chew-014", refCode: "QAT" },
  { country: "Oman", destination: "Muscat, Oman", targetCount: 2, templateId: "con-wafers-015", refCode: "OMN" },
  { country: "Kuwait", destination: "Kuwait City, Kuwait", targetCount: 1, templateId: "con-choc-016", refCode: "KWT" },
] as const;

const DASHBOARD_COUNTRY_TARGETS = [...EUROPE_COUNTRY_TARGETS, ...GULF_COUNTRY_TARGETS] as const;

const SYNTHETIC_DISPATCH_DATES = [
  "08-01-2026",
  "22-01-2026",
  "06-02-2026",
  "20-02-2026",
  "05-03-2026",
  "19-03-2026",
  "02-04-2026",
  "16-04-2026",
  "30-04-2026",
  "14-05-2026",
  "28-05-2026",
  "11-06-2026",
  "25-06-2026",
  "09-07-2026",
  "23-07-2026",
  "06-08-2026",
];

function applyConsignmentDestinationMix(records: ConsignmentRecord[]) {
  records.forEach((record) => {
    const override = CONSIGNMENT_DESTINATION_OVERRIDES[record.id];
    if (!override) {
      return;
    }

    record.destination = override.destination;
    record.country = override.country;

    const marketCode =
      override.region === "Europe" ? "EU" : override.region === "Gulf" ? "GCC" : "INT";
    record.reference = record.reference.replace(/^GFI-(EU|GCC|INT)-/, `GFI-${marketCode}-`);
  });
}

function applyConsignmentShipmentStatuses(records: ConsignmentRecord[]) {
  records.forEach((record) => {
    record.shipmentStatus = CONSIGNMENT_SHIPMENT_STATUSES[record.id] ?? "TO_BE_SHIPPED";
  });
}

function syncLifecycleFields(record: ConsignmentRecord) {
  switch (record.shipmentStatus) {
    case "SHIPPED":
      record.gateStatus = "READY";
      record.outputEligibility = "PACKAGE_READY";
      record.traceabilityStatus = "TRACEABLE";
      record.nextAction = "Archive dispatch evidence and retain delivered route records for country-level reporting.";
      break;
    case "IN_TRANSIT":
      record.gateStatus = "READY";
      record.outputEligibility = "PACKAGE_READY";
      record.traceabilityStatus = "TRACEABLE";
      record.nextAction = "Monitor transit milestones and confirm arrival updates with the destination operator.";
      break;
    case "TO_BE_SHIPPED":
    default:
      if (record.gateStatus !== "BLOCKED") {
        record.gateStatus = "REVIEW_REQUIRED";
        record.outputEligibility = "SCOPE_REVIEW";
        record.traceabilityStatus = "REVIEW_REQUIRED";
      } else {
        record.outputEligibility = "HELD";
        record.traceabilityStatus = "BLOCKED";
      }
      record.nextAction =
        record.gateStatus === "BLOCKED"
          ? "Keep shipment on hold until all blocking evidence gaps are resolved."
          : "Finalize dispatch preparation, booking, and release checks before vessel handoff.";
      break;
  }
}

function addSyntheticDashboardConsignments(records: ConsignmentRecord[]) {
  let syntheticCounter = 0;

  DASHBOARD_COUNTRY_TARGETS.forEach((target) => {
    const existingForCountry = records.filter((record) => record.country === target.country);
    const missingCount = target.targetCount - existingForCountry.length;
    if (missingCount <= 0) {
      return;
    }

    const template = records.find((record) => record.id === target.templateId);
    if (!template) {
      return;
    }

    for (let index = 0; index < missingCount; index += 1) {
      const clone = JSON.parse(JSON.stringify(template)) as ConsignmentRecord;
      const sequence = existingForCountry.length + index + 1;
      const absoluteSequence = 100 + syntheticCounter;
      const cartonsBase = Math.max(220, (template.totalCartons ?? 320) + ((index % 5) - 2) * 28 + syntheticCounter * 3);
      const dipsBase = Math.max(36, Math.round((template.totalDipsCartons ?? Math.max(24, cartonsBase * 0.18)) + (index % 4) * 6));
      const grossBase = Number((((template.grossWeightTons ?? 13.5) + (index % 4) * 0.65 + syntheticCounter * 0.04)).toFixed(1));
      const shipmentStatus: NonNullable<ConsignmentRecord["shipmentStatus"]> =
        index < Math.ceil(missingCount * 0.5)
          ? "SHIPPED"
          : index < Math.ceil(missingCount * 0.8)
            ? "IN_TRANSIT"
            : "TO_BE_SHIPPED";

      clone.id = `con-auto-${target.refCode.toLowerCase()}-${String(sequence).padStart(3, "0")}`;
      clone.reference = `GFI-EU-${target.refCode}-2026-${String(absoluteSequence).padStart(3, "0")}`;
      clone.destination = target.destination;
      clone.country = target.country;
      clone.shipmentStatus = shipmentStatus;
      clone.saleOrderNo = String(320000 + syntheticCounter);
      clone.customerRefNo = `CUST-${target.refCode}-${String(sequence).padStart(3, "0")}`;
      clone.invoiceNo = `INV-${target.refCode}-${String(absoluteSequence).padStart(3, "0")}`;
      clone.pfaNo = `PFA-${target.refCode}-${String(absoluteSequence).padStart(3, "0")}`;
      clone.totalCartons = cartonsBase;
      clone.totalDipsCartons = dipsBase;
      clone.grossWeightTons = grossBase;
      clone.cbm = Number((((template.cbm ?? 38) + (index % 3) * 1.8)).toFixed(1));
      clone.weightLimitKg = template.weightLimitKg ?? 26800;
      clone.containerNo =
        shipmentStatus === "TO_BE_SHIPPED" && index % 2 === 1
          ? "PENDING"
          : `${target.refCode}${String(760000 + syntheticCounter).padStart(6, "0")}`;
      clone.containerSize = shipmentStatus === "TO_BE_SHIPPED" && clone.containerNo === "PENDING" ? template.containerSize : "40HQ";
      clone.sealNo = shipmentStatus === "TO_BE_SHIPPED" && clone.containerNo === "PENDING" ? "PENDING" : `${target.refCode}${String(410000 + syntheticCounter).padStart(6, "0")}`;
      clone.dispatchDate =
        shipmentStatus === "TO_BE_SHIPPED" && index % 3 === 2
          ? "—"
          : SYNTHETIC_DISPATCH_DATES[syntheticCounter % SYNTHETIC_DISPATCH_DATES.length];
      clone.dispatchLines = (clone.dispatchLines ?? []).map((line, lineIndex) => {
        const adjustedCartons = Math.max(24, Math.round(line.totalCartons * (0.88 + ((index + lineIndex) % 4) * 0.06)));
        const adjustedDips = Math.max(4, Math.round(line.dipsCartons * (0.85 + ((index + lineIndex) % 3) * 0.08)));
        const adjustedGross = Number((line.grossWtKg * (0.94 + ((index + lineIndex) % 4) * 0.03)).toFixed(2));
        return {
          ...line,
          lotNo: `${line.lotNo}-${target.refCode}-${String(sequence).padStart(2, "0")}`,
          totalCartons: adjustedCartons,
          dipsCartons: adjustedDips,
          totalGrossWtKg: Number((line.totalGrossWtKg * (0.94 + ((index + lineIndex) % 4) * 0.03)).toFixed(2)),
          grossWtKg: adjustedGross,
        };
      });
      clone.lineSummary = clone.dispatchLines?.length
        ? clone.dispatchLines
            .slice(0, 2)
            .map((line) => `${line.productName} / ${line.totalCartons.toLocaleString()} ctns / ${target.country}`)
        : [`${template.lineSummary[0] ?? "Mixed export cargo"} / ${target.country}`];

      syncLifecycleFields(clone);
      records.push(clone);
      syntheticCounter += 1;
    }
  });
}

applyConsignmentDestinationMix(consignments);
applyConsignmentShipmentStatuses(consignments);
addSyntheticDashboardConsignments(consignments);

export const dashboardMetrics = {
  productsInScope: 2,
  supplierResponsesPending: 2,
  missingGeolocationCases: 3,
  blockedConsignments: 1,
  staleOutputs: 1,
  agentReadyPackages: 1,
};

export function getSupplierName(supplierId: string): string {
  return suppliers.find((supplier) => supplier.id === supplierId)?.name ?? supplierId;
}

export function getProductName(productId: string): string {
  return products.find((product) => product.id === productId)?.name ?? productId;
}

export function getConsignment(referenceOrId: string): ConsignmentRecord | undefined {
  return consignments.find(
    (consignment) =>
      consignment.id === referenceOrId || consignment.reference === referenceOrId,
  );
}

export function getOutputPackageForConsignment(consignmentId: string): OutputPackageRecord | undefined {
  return outputPackages.find((pkg) => pkg.consignmentId === consignmentId);
}

function buildOriginCountriesForIngredient(
  ingredient: IngredientRecord,
  allPlots: PlotRecord[],
  allSuppliers: SupplierRecord[],
): string[] {
  const plotCountries = allPlots
    .filter((plot) => ingredient.supplierIds.includes(plot.supplierId))
    .map((plot) => plot.sourceCountry)
    .filter(Boolean);
  const supplierCountries = allSuppliers
    .filter((supplier) => ingredient.supplierIds.includes(supplier.id))
    .map((supplier) => supplier.country)
    .filter(Boolean);
  return [...new Set([...plotCountries, ...supplierCountries])];
}

function buildScenarioLegalityDossiers(
  allProducts: ProductRecord[],
  allPlots: PlotRecord[],
  allSuppliers: SupplierRecord[],
): LegalityDossierRecord[] {
  return allProducts.flatMap((product) =>
    product.ingredients.flatMap((ingredient) => {
      const originCountries = buildOriginCountriesForIngredient(ingredient, allPlots, allSuppliers);
      return originCountries.map((originCountry) => {
        const euRiskTier = deriveIngredientRiskTier([originCountry]);
        const dossier = buildLegalityDossierTemplate({
          id: `legality-${product.id}-${ingredient.id}-${originCountry.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          ingredientId: ingredient.id,
          productId: product.id,
          originCountry,
          euRiskTier,
          dueDiligenceMode: getDueDiligenceMode(euRiskTier),
        }) as LegalityDossierRecord;

        // Seed realistic documents and statuses for segregation
        dossier.documents = dossier.documents.map((doc) => {
          let verificationStatus: "NOT_REVIEWED" | "VERIFIED" | "EXPIRED" | "REJECTED" = "VERIFIED";
          let hasFile = true;

          if (originCountry === "Pakistan") {
            verificationStatus = "VERIFIED";
          } else if (originCountry === "Malaysia") {
            if (doc.legalArea === "LABOR_REGULATIONS") {
              verificationStatus = "NOT_REVIEWED";
            } else if (doc.legalArea === "TAX_AND_CUSTOMS") {
              hasFile = false; // Gap
              verificationStatus = "NOT_REVIEWED";
            }
          } else if (originCountry === "Ghana") {
            if (doc.legalArea === "ENVIRONMENTAL_PROTECTION") {
              verificationStatus = "NOT_REVIEWED";
            }
          } else if (originCountry === "Ivory Coast") {
            if (doc.legalArea === "LABOR_REGULATIONS") {
              hasFile = false; // Gap
              verificationStatus = "NOT_REVIEWED";
            } else if (doc.legalArea === "TAX_AND_CUSTOMS") {
              verificationStatus = "NOT_REVIEWED";
            }
          } else if (originCountry === "Indonesia") {
            if (doc.legalArea === "LAND_TENURE") {
              verificationStatus = "NOT_REVIEWED";
            } else if (doc.legalArea === "LABOR_REGULATIONS") {
              verificationStatus = "NOT_REVIEWED";
            } else if (doc.legalArea === "TAX_AND_CUSTOMS") {
              hasFile = false; // Gap
              verificationStatus = "NOT_REVIEWED";
            }
          }

          if (hasFile) {
            return {
              ...doc,
              fileName: `${doc.sampleDocumentLabel.replace(/[\s/]+/g, "_").toLowerCase()}_ver1.pdf`,
              fileType: "application/pdf",
              fileSize: "2.4 MB",
              uploadedAt: new Date(Date.UTC(2026, 3, 5)).toISOString(),
              uploadedBy: "Compliance Officer",
              verificationStatus,
            };
          }

          return doc;
        });

        // Summarize overall status of the dossier using the official summarizeLegalityDossier
        dossier.overallStatus = summarizeLegalityDossier(dossier.documents);

        return dossier;
      });
    }),
  );
}

function enrichIngredientComplianceMetadata(
  allProducts: ProductRecord[],
  allPlots: PlotRecord[],
  allSuppliers: SupplierRecord[],
  allLegalityDossiers: LegalityDossierRecord[],
  allDdsSubmissions: DdsSubmissionRecord[],
): ProductRecord[] {
  return allProducts.map((product) => ({
    ...product,
    ingredients: product.ingredients.map((ingredient) => {
      const originCountries = buildOriginCountriesForIngredient(ingredient, allPlots, allSuppliers);
      const primaryOriginCountry = originCountries[0] ?? "";
      const euRiskTier = deriveIngredientRiskTier(originCountries);
      const dueDiligenceMode = getDueDiligenceMode(euRiskTier);
      const ingredientDossiers = allLegalityDossiers.filter(
        (dossier) => dossier.productId === product.id && dossier.ingredientId === ingredient.id,
      );
      const legalityOverall = ingredientDossiers.length === 0
        ? "GAPS_FOUND"
        : ingredientDossiers.some((dossier) => dossier.overallStatus === "GAPS_FOUND")
          ? "GAPS_FOUND"
          : ingredientDossiers.every((dossier) => dossier.overallStatus === "COMPLETE")
            ? "COMPLETE"
            : ingredientDossiers.some((dossier) => dossier.overallStatus === "UNDER_REVIEW")
              ? "UNDER_REVIEW"
              : "PARTIAL";
      const latestDdsSubmission = allDdsSubmissions
        .filter((submission) => submission.productId === product.id && submission.ingredientId === ingredient.id)
        .sort((left, right) => left.submittedAt.localeCompare(right.submittedAt))
        .at(-1);

      return {
        ...ingredient,
        originCountries,
        primaryOriginCountry,
        euRiskTier,
        dueDiligenceMode,
        legalityDossierStatus: toIngredientLegalityStatus(legalityOverall),
        ddsStatus: latestDdsSubmission?.status === "TRACES_SUBMITTED" ? "TRACES_SUBMITTED" : "READY_FOR_TRACES",
      };
    }),
  }));
}

export function getScenarioData(scenarioId: string) {
  // Deep copy base data to avoid mutating original exported constants
  const currentSuppliers = JSON.parse(JSON.stringify(suppliers)) as SupplierRecord[];
  const currentProducts = JSON.parse(JSON.stringify(products)) as ProductRecord[];
  const currentConsignments = JSON.parse(JSON.stringify(consignments)) as ConsignmentRecord[];
  const currentOutputPackages = JSON.parse(JSON.stringify(outputPackages)) as OutputPackageRecord[];
  const currentPlots = JSON.parse(JSON.stringify(plots)) as PlotRecord[];
  const currentDeforestationCases = JSON.parse(JSON.stringify(deforestationCases)) as DeforestationCase[];
  const currentTraceabilityCases = JSON.parse(JSON.stringify(traceabilityCases)) as TraceabilityCase[];
  const currentRiskSubjects = JSON.parse(JSON.stringify(riskSubjects)) as RiskSubjectRecord[];
  const currentConcerns = JSON.parse(JSON.stringify(concerns)) as ConcernRecord[];
  const currentDocuments = JSON.parse(JSON.stringify(documents)) as DocumentRecord[];
  const currentProfile = JSON.parse(JSON.stringify(organizationProfile)) as OrganizationProfile;
  const currentReports = JSON.parse(JSON.stringify(reports)) as ReportRecord[];
  const currentSupplierRequests = JSON.parse(JSON.stringify(supplierPortalRequests)) as SupplierPortalRequest[];
  const currentSupplyChainNodes = JSON.parse(JSON.stringify(supplyChainNodes)) as SupplyChainNode[];
  const currentEudrFormRequests = JSON.parse(JSON.stringify(eudrFormRequests)) as EudrFormRequest[];
  const currentSupplyChainEdges = JSON.parse(JSON.stringify(supplyChainEdges)) as SupplyChainEdge[];
  const currentIntermediarySubmissions = JSON.parse(
    JSON.stringify(intermediaryDeclarationSubmissions),
  ) as IntermediaryDeclarationSubmission[];
  const currentFarmerSubmissions = JSON.parse(JSON.stringify(farmerDeclarationSubmissions)) as FarmerDeclarationSubmission[];
  const currentEudrEvidenceAttachments = JSON.parse(JSON.stringify(eudrEvidenceAttachments)) as EudrEvidenceAttachment[];
  const currentDdsSubmissions: DdsSubmissionRecord[] = [];
  const currentLegalityDossiers: LegalityDossierRecord[] = [];

  if (scenarioId === "after_cocoa_remediation") {
    // 1. JB Cocoa is Approved, risk level low, 100% geolocation, issues cleared
    const jb = currentSuppliers.find(s => s.id === "sup-jb-cocoa");
    if (jb) {
      jb.onboardingStatus = "APPROVED";
      jb.declarationStatus = "SIGNED";
      jb.cocStatus = "VERIFIED";
      jb.geolocationCoverage = 100;
      jb.contractStatus = "EUDR_CLAUSE_PRESENT";
      jb.latestRiskLevel = "LOW";
      jb.issues = [];
      jb.nextAction = "Monitor compliance periodically.";
    }

    // 3. Products: Chocolate and Wafers become READY, gaps cleared, ingredients ready
    const choc = currentProducts.find(p => p.id === "prd-chocolate");
    if (choc) {
      choc.exportReadiness = "READY";
      choc.blockingGaps = [];
      choc.ingredients.forEach(ing => {
        if (ing.commodity === "COCOA") {
          ing.readiness = "READY";
          ing.evidenceStatus = "COMPLETE";
          ing.blockingReason = "None.";
        }
      });
    }
    const waf = currentProducts.find(p => p.id === "prd-wafers");
    if (waf) {
      waf.exportReadiness = "READY";
      waf.blockingGaps = [];
      waf.ingredients.forEach(ing => {
        if (ing.commodity === "COCOA") {
          ing.readiness = "READY";
          ing.evidenceStatus = "COMPLETE";
          ing.blockingReason = "None.";
        }
      });
    }

    // 4. Consignments: Chocolate consignment con-choc-003 becomes READY, eligible, issues cleared
    const chocCon = currentConsignments.find(c => c.id === "con-choc-003");
    if (chocCon) {
      chocCon.gateStatus = "READY";
      chocCon.outputEligibility = "PACKAGE_READY";
      chocCon.traceabilityStatus = "TRACEABLE";
      chocCon.issues = [];
      chocCon.nextAction = "Release package to operator agent.";
    }

    // 5. Output package: pkg-chocolate-003 becomes READY_FOR_AGENT, artifacts updated
    const chocPkg = currentOutputPackages.find(p => p.consignmentId === "con-choc-003");
    if (chocPkg) {
      chocPkg.status = "READY_FOR_AGENT";
      chocPkg.artifacts = ["package.json", "package.xml", "dossier-index.csv", "supplier-declarations.zip"];
    }

    // 6. Plots: jb-01, jb-02 approved
    const plot1 = currentPlots.find(p => p.id === "plot-jb-01");
    if (plot1) {
      plot1.status = "APPROVED";
      plot1.latestDeforestationStatus = "CLEAR";
    }
    const plot2 = currentPlots.find(p => p.id === "plot-jb-02");
    if (plot2) {
      plot2.status = "APPROVED";
      plot2.latestDeforestationStatus = "CLEAR";
    }

    // 7. Deforestation Cases: clear
    const defCase = currentDeforestationCases.find(d => d.plotId === "plot-jb-02");
    if (defCase) {
      defCase.resultStatus = "CLEAR";
      defCase.downstreamImpact = "NO_BLOCK";
      defCase.summary = "Scan completed. Deforestation-free verification check successful.";
    }

    // 8. Traceability Cases: chocolate complete
    const traceChoc = currentTraceabilityCases.find(t => t.id === "trace-reverse-chocolate");
    if (traceChoc) {
      traceChoc.completeness = "TRACEABLE";
      traceChoc.nodes.forEach(n => {
        n.status = "CLEAR";
      });
      traceChoc.gaps = [];
    }

    // 9. Risks: supplier & consignment low risk
    const riskSup = currentRiskSubjects.find(r => r.subjectId === "sup-jb-cocoa");
    if (riskSup) {
      riskSup.latestLevel = "LOW";
      riskSup.workflowStatus = "ACTIVE";
      riskSup.criteria = [];
    }
    const riskCon = currentRiskSubjects.find(r => r.subjectId === "con-choc-003");
    if (riskCon) {
      riskCon.latestLevel = "LOW";
      riskCon.workflowStatus = "ACTIVE";
      riskCon.criteria = [];
    }

    // 10. Concerns: closed
    const c1 = currentConcerns.find(c => c.id === "concern-001");
    if (c1) {
      c1.status = "MITIGATED";
      c1.downstreamEffect = "None. Cocoa supply chain is cleared.";
    }

    // 11. Supplier Portal Requests: approved
    currentSupplierRequests.forEach(req => {
      req.submissionStatus = "UNDER_REVIEW";
    });
    currentEudrFormRequests.forEach(req => {
      req.status = "CLOSED";
    });
    currentSupplyChainNodes.forEach(node => {
      if (node.commodity === "COCOA") {
        node.status = "COMPLETE";
      }
    });
    currentSupplyChainEdges.forEach(edge => {
      edge.status = "SUPPORTED";
    });
    currentEudrEvidenceAttachments.forEach(evidence => {
      evidence.status = "ATTACHED";
    });

  } else if (scenarioId === "after_palm_reclassification") {
    // 1. Cargill palm fat is formally out of scope
    const cargill = currentSuppliers.find(s => s.id === "sup-cargill");
    if (cargill) {
      cargill.onboardingStatus = "APPROVED";
      cargill.issues = [];
      cargill.cocStatus = "VERIFIED";
    }

    // 2. Chew finished scope becomes OUT_OF_SCOPE and ready
    const chew = currentProducts.find(p => p.id === "prd-chew");
    if (chew) {
      chew.scopeStatus = "OUT_OF_SCOPE";
      chew.exportReadiness = "READY";
      chew.blockingGaps = [];
      chew.ingredients.forEach(ing => {
        if (ing.commodity === "PALM") {
          ing.relevance = "OUT_OF_SCOPE";
          ing.readiness = "READY";
          ing.evidenceStatus = "COMPLETE";
          ing.blockingReason = "None. Prepared fat blend is chemically modified and falls out of EUDR Annex I scope.";
        }
      });
    }

    // Vegetable fat in Chocolate & Wafers also becomes OUT_OF_SCOPE
    currentProducts.forEach(p => {
      p.ingredients.forEach(ing => {
        if (ing.commodity === "PALM") {
          ing.relevance = "OUT_OF_SCOPE";
          ing.readiness = "READY";
          ing.evidenceStatus = "COMPLETE";
          ing.blockingReason = "None. Chemically modified palm kernel stearine is confirmed out-of-scope.";
        }
      });
    });

    // 3. Chew consignment con-chew-002 becomes READY, eligible, issues cleared
    const chewCon = currentConsignments.find(c => c.id === "con-chew-002");
    if (chewCon) {
      chewCon.gateStatus = "READY";
      chewCon.outputEligibility = "PACKAGE_READY";
      chewCon.traceabilityStatus = "TRACEABLE";
      chewCon.issues = [];
      chewCon.lineSummary = ["Chew / HS 170490 / palm ingredient confirmed out-of-scope"];
      chewCon.nextAction = "Release package to operator agent.";
    }

    // 4. Output package: pkg-chew-002 becomes READY_FOR_AGENT
    const chewPkg = currentOutputPackages.find(p => p.consignmentId === "con-chew-002");
    if (chewPkg) {
      chewPkg.status = "READY_FOR_AGENT";
      chewPkg.artifacts = ["package.json", "scope-memo.pdf", "evidence-index.csv"];
    }

    // 5. Traceability Chew
    const traceChew = currentTraceabilityCases.find(t => t.id === "trace-reverse-chew");
    if (traceChew) {
      traceChew.completeness = "TRACEABLE";
      traceChew.nodes.forEach(n => {
        n.status = "CLEAR";
      });
      traceChew.gaps = [];
    }

    // 6. Risk subject Chew
    const riskChew = currentRiskSubjects.find(r => r.subjectId === "prd-chew");
    if (riskChew) {
      riskChew.latestLevel = "LOW";
      riskChew.workflowStatus = "ACTIVE";
      riskChew.criteria = [];
    }

    // 7. Concerns palm
    const c2 = currentConcerns.find(c => c.id === "concern-002");
    if (c2) {
      c2.status = "MITIGATED";
      c2.downstreamEffect = "None. Palm classification confirmed out of scope.";
    }

  } else if (scenarioId === "future_direct_dds") {
    // 1. Direct DDS Operator Flow
    currentProfile.defaultOutputMode = "DIRECT_DDS";
    currentProfile.legalRole = "Direct EU Operator / Importer Flow";
    currentProfile.tracesStatus = "REGISTERED";

    currentConsignments.forEach(c => {
      c.outputEligibility = "PACKAGE_READY";
    });

  }

  // Programmatically generate dummy supply chains for all other ingredients
  currentProducts.forEach((product) => {
    product.ingredients.forEach((ingredient) => {
      // Skip if a root node already exists for this product + ingredient
      const hasRoot = currentSupplyChainNodes.some(
        (node) => node.productId === product.id && node.ingredientId === ingredient.id && node.parentNodeId === null
      );
      if (hasRoot) return;

      const prodCode = product.name.substring(0, 3).toUpperCase();
      const ingCode = ingredient.name.substring(0, 3).toUpperCase();
      const supplierId = ingredient.supplierIds?.[0] || "sup-cargill";

      const t1Id = `node-dyn-${product.id}-${ingredient.id}-t1`;
      const t2Id = `node-dyn-${product.id}-${ingredient.id}-t2`;
      const t3Id = `node-dyn-${product.id}-${ingredient.id}-t3`;

      const isEudr = ingredient.commodity !== "NONE" && (ingredient.commodity as string) !== "NONE / EXEMPT";
      const status = ingredient.readiness === "READY" ? "COMPLETE" : (ingredient.readiness === "BLOCKED" ? "BLOCKED" : "REQUESTED");

      // 1. Direct Supplier (Tier 1)
      currentSupplyChainNodes.push({
        id: t1Id,
        ingredientId: ingredient.id,
        productId: product.id,
        supplierId,
        parentNodeId: null,
        tier: 1,
        actorType: "DIRECT_SUPPLIER",
        entityName: ingredient.supplierName || "Direct Supplier",
        country: "Pakistan",
        commodity: ((ingredient.commodity as string) === "NONE / EXEMPT" ? "NONE" : ingredient.commodity as any || "NONE"),
        materialName: ingredient.name,
        volumeContributionPercent: 100,
        status,
      });

      // 2. Intermediary Processor (Tier 2)
      currentSupplyChainNodes.push({
        id: t2Id,
        ingredientId: ingredient.id,
        productId: product.id,
        supplierId,
        parentNodeId: t1Id,
        tier: 2,
        actorType: "INTERMEDIARY",
        entityName: `${ingredient.supplierName || "Upstream"} Processing Center`,
        country: "Malaysia",
        commodity: ((ingredient.commodity as string) === "NONE / EXEMPT" ? "NONE" : ingredient.commodity as any || "NONE"),
        materialName: `Processed ${ingredient.name}`,
        volumeContributionPercent: 100,
        status: status === "COMPLETE" ? "COMPLETE" : "REQUESTED",
      });

      // 3. Producer (Tier 3)
      currentSupplyChainNodes.push({
        id: t3Id,
        ingredientId: ingredient.id,
        productId: product.id,
        supplierId,
        parentNodeId: t2Id,
        tier: 3,
        actorType: "FARMER",
        entityName: `${ingredient.name.split(" ")[0]} Grower Cooperative`,
        country: "Indonesia",
        commodity: ((ingredient.commodity as string) === "NONE / EXEMPT" ? "NONE" : ingredient.commodity as any || "NONE"),
        materialName: `Raw ${ingredient.name}`,
        volumeContributionPercent: 100,
        status: status === "COMPLETE" ? "COMPLETE" : "REQUESTED",
      });

      // 4. Edges
      currentSupplyChainEdges.push(
        {
          id: `edge-dyn-${product.id}-${ingredient.id}-t3-t2`,
          fromNodeId: t3Id,
          toNodeId: t2Id,
          relationshipType: "FARM_SOURCE_FOR",
          materialName: `Raw ${ingredient.name}`,
          volumePercent: 100,
          proofDocumentIds: [],
          status: "SUPPORTED",
        },
        {
          id: `edge-dyn-${product.id}-${ingredient.id}-t2-t1`,
          fromNodeId: t2Id,
          toNodeId: t1Id,
          relationshipType: "SUPPLIES_TO",
          materialName: `Processed ${ingredient.name}`,
          volumePercent: 100,
          proofDocumentIds: [],
          status: "SUPPORTED",
        }
      );

      // 5. EUDR Portal forms and submissions
      if (isEudr) {
        const req1 = `req-dyn-${product.id}-${ingredient.id}-t1`;
        const req2 = `req-dyn-${product.id}-${ingredient.id}-t2`;
        const req3 = `req-dyn-${product.id}-${ingredient.id}-t3`;

        currentEudrFormRequests.push(
          {
            id: req1,
            tokenLabel: `PORTAL-${prodCode}-${ingCode}-T1`,
            targetSupplierId: supplierId,
            targetNodeId: t1Id,
            formType: "INTERMEDIARY",
            requestedBy: "GFI Compliance Team",
            requestedAt: "2026-05-10",
            expiresAt: "2026-06-10",
            status: status === "COMPLETE" ? "CLOSED" : "PENDING_RESPONSE",
            email: `compliance@${supplierId.slice(4)}.example`,
            parentRequestId: null,
          },
          {
            id: req2,
            tokenLabel: `PORTAL-${prodCode}-${ingCode}-T2`,
            targetSupplierId: supplierId,
            targetNodeId: t2Id,
            formType: "INTERMEDIARY",
            requestedBy: "GFI Compliance Team",
            requestedAt: "2026-05-10",
            expiresAt: "2026-06-10",
            status: status === "COMPLETE" ? "CLOSED" : "PENDING_RESPONSE",
            email: `processor@${supplierId.slice(4)}.example`,
            parentRequestId: req1,
          },
          {
            id: req3,
            tokenLabel: `PORTAL-${prodCode}-${ingCode}-T3`,
            targetSupplierId: supplierId,
            targetNodeId: t3Id,
            formType: "FARMER",
            requestedBy: "GFI Compliance Team",
            requestedAt: "2026-05-10",
            expiresAt: "2026-06-10",
            status: status === "COMPLETE" ? "CLOSED" : "PENDING_RESPONSE",
            email: `farmer@${supplierId.slice(4)}.example`,
            parentRequestId: req2,
          }
        );

        if (status === "COMPLETE") {
          currentIntermediarySubmissions.push({
            id: `sub-dyn-${product.id}-${ingredient.id}-t2`,
            requestId: req2,
            nodeId: t2Id,
            submittedAt: "2026-05-12",
            sections: {
              section1: { roles: ["Primary Processor"], commodities: [ingredient.commodity] },
              section2: { legalName: `${ingredient.supplierName || "Upstream"} Processor`, country: "Malaysia" },
              section5A: { traceabilityExportAvailable: true, recordsRetainedFiveYears: true },
            },
            upstreamEntities: [
              {
                id: `upstream-dyn-${product.id}-${ingredient.id}-farm`,
                name: `${ingredient.name.split(" ")[0]} Grower Cooperative`,
                entityType: "Farm",
                address: "Sumatra growers block",
                materialName: `Raw ${ingredient.name}`,
                volumeContributionPercent: 100,
                certifiedSupplier: true,
                certificateAttached: true,
              }
            ],
            traceabilityControls: "Incoming lot tickets matching finished goods.",
            signatureName: "Logistics Lead",
          });

          currentFarmerSubmissions.push({
            id: `sub-dyn-${product.id}-${ingredient.id}-t3`,
            requestId: req3,
            nodeId: t3Id,
            submittedAt: "2026-05-12",
            sections: {
              section1: { producerType: "Estate", fullName: `${ingredient.name.split(" ")[0]} Farm`, country: "Indonesia" },
              section2: { commodities: [ingredient.commodity as any], harvestYears: ["2025", "2026"], annualVolume: "1,200 MT" },
              section3: { landBasis: "Concession", landDocuments: ["land-title.pdf"] },
              section4: { plots: [`PLT-DYN-${prodCode}-${ingCode}`] },
              section5: { confirmations: ["No deforestation after cut-off date"], previousLandUse: "Existing plot replanting", boundaryChanged: false },
              section9: { firstPointOfSale: "Processor Mill", sellingMethod: "Direct contract" },
              section12: { signatureName: "Owner", declarationDate: "2026-05-12" },
            },
            plotRows: [
              {
                plotId: `PLT-DYN-${prodCode}-${ingCode}`,
                latitudes: "1.6124,1.6181,1.6194,1.6124",
                longitudes: "103.5987,103.6044,103.6071,103.5987",
                areaHa: 5.4,
                commodityGrown: ingredient.commodity as any,
                productionVolume: "1,200 MT",
                coordinateType: "FILE",
                fileName: `${ingredient.name.toLowerCase().replace(/[^a-z]+/g, "-")}-plots.geojson`,
              }
            ],
            signatureName: "Estate Manager",
          });

          currentPlots.push({
            id: `plot-dyn-${product.id}-${ingredient.id}`,
            supplierId,
            label: `${ingredient.name} plot`,
            sourceCountry: "Indonesia",
            geoType: "POLYGON",
            areaHa: 5.4,
            status: "APPROVED",
            provenanceFlow: "Direct Contract",
            coordinatesSummary: "1.6124, 103.5987 (concession block)",
            latestDeforestationStatus: "CLEAR",
            notes: [],
          });

          currentEudrEvidenceAttachments.push(
            {
              id: `ev-dyn-${product.id}-${ingredient.id}-intermediary-decl`,
              requestId: req2,
              nodeId: t2Id,
              sectionRef: "INTERMEDIARY_SECTION_8",
              documentRole: "INTERMEDIARY_DECLARATION",
              fileName: `${ingredient.name.toLowerCase().replace(/[^a-z]+/g, "-")}-processor-decl.pdf`,
              status: "ATTACHED",
            },
            {
              id: `ev-dyn-${product.id}-${ingredient.id}-geo`,
              requestId: req3,
              nodeId: t3Id,
              sectionRef: "FARMER_SECTION_4",
              documentRole: "GEOLOCATION_FILE",
              fileName: `${ingredient.name.toLowerCase().replace(/[^a-z]+/g, "-")}-plots.geojson`,
              status: "ATTACHED",
            },
            {
              id: `ev-dyn-${product.id}-${ingredient.id}-land`,
              requestId: req3,
              nodeId: t3Id,
              sectionRef: "FARMER_SECTION_3",
              documentRole: "LAND_RIGHTS_EVIDENCE",
              fileName: `${ingredient.name.toLowerCase().replace(/[^a-z]+/g, "-")}-land-basis.pdf`,
              status: "ATTACHED",
            }
          );
        }
      }
    });
  });

  currentLegalityDossiers.push(...buildScenarioLegalityDossiers(currentProducts, currentPlots, currentSuppliers));
  const enrichedProducts = enrichIngredientComplianceMetadata(
    currentProducts,
    currentPlots,
    currentSuppliers,
    currentLegalityDossiers,
    currentDdsSubmissions,
  );

  // Recalculate metrics dynamically based on transformed lists
  const blockedConsignmentsCount = currentConsignments.filter(c => c.gateStatus === "BLOCKED").length;
  const inScopeCount = enrichedProducts.filter(p => p.scopeStatus === "IN_SCOPE").length;
  const pendingResponsesCount = currentSupplierRequests.filter(r => r.submissionStatus === "PENDING_RESPONSE").length;
  const missingGeoCount = currentPlots.filter(p => p.status === "REQUESTED" || p.status === "CHANGES_REQUESTED").length;

  const dynamicMetrics = {
    productsInScope: inScopeCount,
    supplierResponsesPending: pendingResponsesCount,
    missingGeolocationCases: missingGeoCount,
    blockedConsignments: blockedConsignmentsCount,
    staleOutputs: currentOutputPackages.filter(p => p.status === "HELD").length,
    agentReadyPackages: currentOutputPackages.filter(p => p.status === "READY_FOR_AGENT").length,
  };

  return {
    suppliers: currentSuppliers,
    products: enrichedProducts,
    consignments: currentConsignments,
    outputPackages: currentOutputPackages,
    plots: currentPlots,
    deforestationCases: currentDeforestationCases,
    traceabilityCases: currentTraceabilityCases,
    riskSubjects: currentRiskSubjects,
    concerns: currentConcerns,
    documents: currentDocuments,
    profile: currentProfile,
    reports: currentReports,
    supplierRequests: currentSupplierRequests,
    supplyChainNodes: currentSupplyChainNodes,
    eudrFormRequests: currentEudrFormRequests,
    supplyChainEdges: currentSupplyChainEdges,
    intermediaryDeclarationSubmissions: currentIntermediarySubmissions,
    farmerDeclarationSubmissions: currentFarmerSubmissions,
    eudrEvidenceAttachments: currentEudrEvidenceAttachments,
    ddsSubmissions: currentDdsSubmissions,
    legalityDossiers: currentLegalityDossiers,
    metrics: dynamicMetrics,
  };
}
