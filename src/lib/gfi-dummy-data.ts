import { classifyIngredientEudr } from "@/lib/eudr-classifier";

export type CommodityCode = "COCOA" | "PALM" | "COFFEE" | "SOYA" | "RUBBER" | "WOOD" | "CATTLE" | "NONE";

export interface OrganizationProfile {
  id: string;
  name: string;
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

export const organizationProfile: OrganizationProfile = {
  id: "gfi-org-001",
  name: "GFI Pakistan",
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
    assignedConsignmentIds: ["con-bubblegum-001"],
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
    assignedConsignmentIds: ["con-chew-002", "con-choc-003"],
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
        size: "1.2 MB"
      },
      {
        id: "doc-cargill-2",
        name: "EUDR Deforestation-Free Self-Declaration",
        type: "Declaration",
        fileName: "deforestation_free_self_declaration.pdf",
        uploadDate: "2026-02-15",
        size: "450 KB"
      },
      {
        id: "doc-cargill-3",
        name: "RSPO Chain of Custody Certificate",
        type: "Certificate",
        fileName: "rspo_coc_certificate_my0089.pdf",
        uploadDate: "2026-03-01",
        size: "820 KB"
      },
      {
        id: "doc-cargill-4",
        name: "Malaysia Refining & Export License",
        type: "License",
        fileName: "refining_export_license_2026.pdf",
        uploadDate: "2025-11-20",
        size: "1.8 MB"
      },
      {
        id: "doc-cargill-5",
        name: "Traceability Verification Audit Report Q4",
        type: "Audit Record",
        fileName: "traceability_verification_audit_q4.pdf",
        uploadDate: "2026-01-05",
        size: "2.4 MB"
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
        size: "950 KB"
      },
      {
        id: "doc-jb-2",
        name: "Traceability Framework Assessment Report",
        type: "Audit Record",
        fileName: "traceability_framework_assessment_2025.pdf",
        uploadDate: "2025-12-10",
        size: "3.1 MB"
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
            "Ingredient traceability is complete, but final readiness still depends on customs scope review for the palm route.",
          supplyChainStatus: "COMPLETE",
          forceReview: true,
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
        blockingReason: "Palm remains secondary to the cocoa blocker but still requires scope confirmation.",
        supplyChainStatus: "IN_PROGRESS",
        forceReview: true,
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
        blockingReason: "Scope review must be concluded before EU readiness can move forward.",
        supplyChainStatus: "IN_PROGRESS",
        forceReview: true,
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
];

export const documents: DocumentRecord[] = [
  {
    id: "doc-cargill-rspo",
    title: "Cargill RSPO certificate",
    documentRole: "CERTIFICATION",
    linkedEntity: "Cargill Palm Products SDN BHD",
    status: "CURRENT",
    note: "Valid until January 2028 but covers both SG and MB; transaction-specific proof still needed.",
  },
  {
    id: "doc-cargill-msds",
    title: "Cargill palm product MSDS",
    documentRole: "CHAIN_OF_CUSTODY_SUPPORT",
    linkedEntity: "Cargill palm deliveries",
    status: "CURRENT",
    note: "Only current source showing RSPO SG for the specific palm product.",
  },
  {
    id: "doc-jb-request",
    title: "JB Cocoa supplier declaration request",
    documentRole: "SUPPLIER_REQUEST",
    linkedEntity: "JB Cocoa SDN BHD",
    status: "CURRENT",
    note: "Outstanding; waiting for formal response pack.",
  },
  {
    id: "doc-indococoa-request",
    title: "N A Enterprises (Indococoa) onboarding and declaration pack",
    documentRole: "SUPPLIER_REQUEST",
    linkedEntity: "N A Enterprises (Indococoa)",
    status: "CURRENT",
    note: "Initial outreach opened after on-site discovery of Indococoa supplied via N A Enterprises.",
  },
  {
    id: "doc-chew-scope-note",
    title: "Palm scope review memo for Chew",
    documentRole: "CLASSIFICATION_MEMO",
    linkedEntity: "Chew",
    status: "DRAFT",
    note: "Awaiting customs classification confirmation for palm route.",
  },
  {
    id: "doc-bubblegum-scope",
    title: "Bubble Gum out-of-scope justification",
    documentRole: "SCOPE_MEMO",
    linkedEntity: "Bubble Gum",
    status: "CURRENT",
    note: "Used in the compliance package instead of commodity provenance evidence.",
  },
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

  // Recalculate metrics dynamically based on transformed lists
  const blockedConsignmentsCount = currentConsignments.filter(c => c.gateStatus === "BLOCKED").length;
  const inScopeCount = currentProducts.filter(p => p.scopeStatus === "IN_SCOPE").length;
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
    products: currentProducts,
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
    metrics: dynamicMetrics,
  };
}
