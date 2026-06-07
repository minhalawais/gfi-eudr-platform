import type {
  ConsignmentRecord,
  DocumentRecord,
  EudrEvidenceAttachment,
  OutputPackageRecord,
  PlotRecord,
  ProductRecord,
  ReportRecord,
  SupplierPortalRequest,
  SupplierRecord,
  SupplyChainNode,
} from "@/lib/gfi-dummy-data";
import type { StatusTone } from "@/lib/ui-semantics";

export interface DashboardMetricCardVM {
  id: string;
  label: string;
  value: string;
  progressLabel: string;
  progressValue: number;
  breakdown: DashboardMetricBreakdownItem[];
}

export interface DashboardMetricBreakdownItem {
  label: string;
  value?: string;
  tone?: StatusTone | "neutral";
  emphasis?: "count" | "text";
}

export interface DashboardChartDatum {
  label: string;
  value: number;
  tone: StatusTone | "neutral";
}

export interface RiskPillarScore {
  code: string;
  name: string;
  score: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  tone: StatusTone;
}

export interface AuditFindingItem {
  id: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  status: "Open" | "Closed";
  tone: StatusTone;
}

export interface AuditFindingSummary {
  critical: number;
  high: number;
  medium: number;
  info: number;
  total: number;
  closed: number;
  remediationRate: number;
  findingsList: AuditFindingItem[];
}

export interface ComplianceFramework {
  name: string;
  description: string;
  status: "Active" | "Monitoring" | "Not Applicable" | "Planned";
  badgeTone: "success" | "info" | "neutral" | "warning";
  timeline: string;
}

export interface DashboardActionQueueVM {
  id: string;
  href: string;
  title: string;
  summary: string;
  tone: "warning" | "error" | "info" | "neutral";
}

export interface DashboardExportCountryShipmentVM {
  id: string;
  reference: string;
  destination: string;
  country: string;
  shipmentStatus: NonNullable<ConsignmentRecord["shipmentStatus"]>;
  gateStatus: ConsignmentRecord["gateStatus"];
  shipmentMode: ConsignmentRecord["shipmentMode"];
  cargoLabel: string;
  logisticsLabel: string;
  saleOrderLabel: string;
  dispatchDateLabel: string;
  dispatchMonthLabel: string;
  timelineGroupLabel: string;
  cartonLabel: string;
  grossWeightLabel: string;
  containerLabel: string;
  quantitySummaryLabel: string;
  productBreakdown: string[];
  nextAction: string;
  shipmentTone: StatusTone;
  parsedDateValue?: number;
  coordinates?: [number, number];
}

export interface DashboardExportRouteVM {
  id: string;
  reference: string;
  destination: string;
  country: string;
  coordinates: [number, number];
  gateStatus: ConsignmentRecord["gateStatus"];
  shipmentMode: ConsignmentRecord["shipmentMode"];
  cargoLabel: string;
  logisticsLabel: string;
  checkedByLabel: string;
  saleOrderLabel: string;
  dispatchDateLabel: string;
  cartonLabel: string;
  grossWeightLabel: string;
  containerLabel: string;
  traceabilityLabel: string;
  outputEligibilityLabel: string;
  nextAction: string;
  routeTone: StatusTone;
}

export interface DashboardExportMapVM {
  origin: {
    name: string;
    shortLabel: string;
    coordinates: [number, number];
  };
  activeCountryCount: number;
  statusSummary: {
    shipped: number;
    inTransit: number;
    toBeShipped: number;
  };
  countries: DashboardExportCountryVM[];
}

export interface DashboardExportCountryVM {
  id: string;
  country: string;
  coordinates: [number, number];
  shipmentCount: number;
  statusCounts: {
    shipped: number;
    inTransit: number;
    toBeShipped: number;
  };
  countryTone: StatusTone;
  shipments: DashboardExportCountryShipmentVM[];
}

export type ComplianceDocumentCategory =
  | "Agreements & Contracts"
  | "Certificates & Declarations"
  | "Product & Ingredient Documents"
  | "Chain of Custody (CoC) Documents"
  | "Geolocation & Mapping Records"
  | "Legal & Permit Documents"
  | "Audit & Assessment Reports"
  | "Policies & Procedures"
  | "Due Diligence Documents";

export interface DashboardComplianceDocumentCategoryVM {
  id: string;
  label: ComplianceDocumentCategory;
  count: number;
  current: number;
  requestedOrDraft: number;
  expired: number;
  expiringSoon: number;
  actionRequired: number;
  completionRate: number;
  tone: StatusTone | "neutral";
}

export interface DashboardComplianceDocumentCoverageVM {
  total: number;
  current: number;
  requestedOrDraft: number;
  expired: number;
  expiringSoon: number;
  actionRequired: number;
  categories: DashboardComplianceDocumentCategoryVM[];
}

export type DashboardEvidenceStatus = "attached" | "missing" | "requested" | "expired";

export interface DashboardEvidenceGapCellVM {
  rowId: string;
  columnId: string;
  label: string;
  status: DashboardEvidenceStatus;
  attached: number;
  missing: number;
  requested: number;
  expired: number;
  total: number;
}

export interface DashboardEvidenceGapHeatmapVM {
  rows: Array<{
    id: "supplier" | "ingredient" | "product" | "shipment";
    label: string;
    description: string;
    cells: DashboardEvidenceGapCellVM[];
  }>;
  columns: Array<{
    id: "declaration" | "coc" | "geolocation" | "legal" | "audit" | "dueDiligence";
    label: string;
  }>;
  statusTotals: Record<DashboardEvidenceStatus, number>;
  criticalGapCount: number;
}

export interface DashboardExpiringEvidenceRiskBucketVM {
  id: "next30" | "next60" | "next90";
  label: string;
  count: number;
}

export interface DashboardExpiringEvidenceRiskFamilyVM {
  id: string;
  family: ComplianceDocumentCategory;
  totalExpiring: number;
  next30: number;
  next60: number;
  next90: number;
  soonestExpiryLabel: string;
  linkedEntityLabel: string;
  tone: StatusTone | "neutral";
}

export interface DashboardExpiringEvidenceRiskVM {
  totalExpiring: number;
  buckets: DashboardExpiringEvidenceRiskBucketVM[];
  families: DashboardExpiringEvidenceRiskFamilyVM[];
}

export type DashboardSupplierTraceabilityStatusLabel =
  | "Complete Traceability"
  | "Partial Traceability"
  | "Missing Origin Data"
  | "Missing Documents"
  | "Pending Verification";

export interface DashboardSupplierTraceabilityStatusSegmentVM {
  id: string;
  label: DashboardSupplierTraceabilityStatusLabel;
  count: number;
  percentage: number;
  tone: StatusTone;
  description: string;
}

export interface DashboardSupplierTraceabilityStatusVM {
  totalSuppliers: number;
  completePercent: number;
  topRiskLabel: string;
  segments: DashboardSupplierTraceabilityStatusSegmentVM[];
}

export interface DashboardTraceabilityGapCategoryVM {
  id: string;
  label: string;
  count: number;
  tone: StatusTone | "neutral";
  description: string;
}

export interface DashboardViewModel {
  metrics: DashboardMetricCardVM[];
  uniqueMarketsCount: number;
  uniqueSupplierCountriesCount: number;
  openHighPriorityBlockers: number;
  openActionItems: number;
  productPortfolioChart: DashboardChartDatum[];
  supplierRiskChart: DashboardChartDatum[];
  shipmentReleaseChart: DashboardChartDatum[];
  traceabilityHealthChart: DashboardChartDatum[];
  commodityMix: Array<{ commodity: string; count: number }>;
  riskPillarScores: RiskPillarScore[];
  auditFindings: AuditFindingSummary;
  complianceFrameworks: ComplianceFramework[];
  actionQueue: DashboardActionQueueVM[];
  blockers: string[];
  supplierResponseSummary: {
    pending: number;
    inProgress: number;
    underReview: number;
    closed: number;
  };
  reportSummary: {
    current: number;
    draft: number;
  };
  complianceDocuments: DashboardComplianceDocumentCoverageVM;
  evidenceGapHeatmap: DashboardEvidenceGapHeatmapVM;
  expiringEvidenceRisk: DashboardExpiringEvidenceRiskVM;
  supplierTraceabilityStatus: DashboardSupplierTraceabilityStatusVM;
  traceabilityGapCategories: DashboardTraceabilityGapCategoryVM[];
  exportMap: DashboardExportMapVM;
}

const EXPORT_MARKETS = ["EU", "Gulf"] as const;

interface DashboardMetricParams {
  products: ProductRecord[];
  suppliers: SupplierRecord[];
  consignments: ConsignmentRecord[];
  plots: PlotRecord[];
  documents: DocumentRecord[];
  eudrEvidenceAttachments?: EudrEvidenceAttachment[];
  outputPackages: OutputPackageRecord[];
  reports: ReportRecord[];
  supplierRequests: SupplierPortalRequest[];
  supplyChainNodes: SupplyChainNode[];
}

const PRODUCT_POSTURE_ORDER = [
  "Ready",
  "Review required",
  "Not ready",
  "Future export blocked",
  "Under classification",
] as const;

const PRODUCT_POSTURE_TONES: Record<(typeof PRODUCT_POSTURE_ORDER)[number], DashboardChartDatum["tone"]> = {
  Ready: "ready",
  "Review required": "review_required",
  "Not ready": "blocked",
  "Future export blocked": "held",
  "Under classification": "under_review",
};

const INGREDIENT_RELEVANCE_ORDER = ["In scope", "Under review", "Out of scope"] as const;
const INGREDIENT_RELEVANCE_TONES: Record<(typeof INGREDIENT_RELEVANCE_ORDER)[number], DashboardChartDatum["tone"]> = {
  "In scope": "ready",
  "Under review": "under_review",
  "Out of scope": "neutral",
};

const SHIPMENT_RELEASE_ORDER = ["Ready", "Review required", "Blocked"] as const;
const SHIPMENT_RELEASE_TONES: Record<(typeof SHIPMENT_RELEASE_ORDER)[number], DashboardChartDatum["tone"]> = {
  Ready: "ready",
  "Review required": "under_review",
  Blocked: "blocked",
};

const EXPORT_LOCATION_COORDINATES: Record<string, [number, number]> = {
  "Karachi, Pakistan": [67.0011, 24.8607],
  "Hamburg, Germany": [9.9937, 53.5511],
  "Rotterdam, Netherlands": [4.4777, 51.9244],
  "Prague, Czech Republic": [14.4378, 50.0755],
  "Le Havre, France": [0.1079, 49.4944],
  "Antwerp, Belgium": [4.4025, 51.2194],
  "Bremerhaven, Germany": [8.5809, 53.5396],
  "Southampton, United Kingdom": [-1.4043, 50.9097],
  "Barcelona, Spain": [2.1734, 41.3851],
  "Valencia, Spain": [-0.3763, 39.4699],
  "Varna, Bulgaria": [27.9147, 43.2141],
  "Dunkirk, France": [2.3768, 51.0344],
  "Zeebrugge, Belgium": [3.1956, 51.3319],
  "Felixstowe, United Kingdom": [1.3511, 51.9634],
  "Marseille, France": [5.3698, 43.2965],
  "Genoa, Italy": [8.9463, 44.4056],
  "Livorno, Italy": [10.3106, 43.5485],
  "Ravenna, Italy": [12.2035, 44.4184],
  "Trieste, Italy": [13.7768, 45.6495],
  "Koper, Slovenia": [13.7306, 45.5481],
  "Gdansk, Poland": [18.6466, 54.352],
  "Dublin, Ireland": [-6.2603, 53.3498],
  "Constanta, Romania": [28.6348, 44.1598],
  "Dubai, United Arab Emirates": [55.2708, 25.2048],
  "Jeddah, Saudi Arabia": [39.1925, 21.4858],
  "Doha, Qatar": [51.531, 25.2854],
  "Muscat, Oman": [58.4059, 23.588],
  "Kuwait City, Kuwait": [47.9783, 29.3759],
  "Singapore, Singapore": [103.8198, 1.3521],
  "Cape Town, South Africa": [18.4241, -33.9249],
};

const TRACEABILITY_HEALTH_ORDER = ["Complete", "In progress", "Requested", "Gaps found", "Blocked"] as const;
const TRACEABILITY_HEALTH_TONES: Record<(typeof TRACEABILITY_HEALTH_ORDER)[number], DashboardChartDatum["tone"]> = {
  Complete: "ready",
  "In progress": "pending",
  Requested: "requested",
  "Gaps found": "review_required",
  Blocked: "blocked",
};

const COMPLIANCE_DOCUMENT_CATEGORIES: ComplianceDocumentCategory[] = [
  "Agreements & Contracts",
  "Certificates & Declarations",
  "Product & Ingredient Documents",
  "Chain of Custody (CoC) Documents",
  "Geolocation & Mapping Records",
  "Legal & Permit Documents",
  "Audit & Assessment Reports",
  "Policies & Procedures",
  "Due Diligence Documents",
];

function parseAnnualVolume(value: string): number {
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCountValue(value: number): string {
  return formatInteger(value);
}

function formatPercent(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function classifyProductPosture(product: ProductRecord): (typeof PRODUCT_POSTURE_ORDER)[number] {
  if (product.scopeStatus === "UNDER_CLASSIFICATION_REVIEW") {
    return "Under classification";
  }

  if (product.scopeStatus === "FUTURE_EXPORT_BLOCKED") {
    return "Future export blocked";
  }

  if (product.exportReadiness === "NOT_READY") {
    return "Not ready";
  }

  if (product.exportReadiness === "REVIEW_REQUIRED") {
    return "Review required";
  }

  return "Ready";
}

function buildChartData<TLabel extends string>(
  order: readonly TLabel[],
  counts: Record<string, number>,
  tones: Record<TLabel, DashboardChartDatum["tone"]>,
): DashboardChartDatum[] {
  return order.map((label) => ({
    label,
    value: counts[label] ?? 0,
    tone: tones[label],
  }));
}

function getCommodityMix(products: ProductRecord[]) {
  const counts = new Map<string, number>();

  products
    .flatMap((product) => product.ingredients)
    .forEach((ingredient) => {
      counts.set(ingredient.commodity, (counts.get(ingredient.commodity) ?? 0) + 1);
    });

  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .map(([commodity, count]) => ({ commodity, count }))
    .sort((a, b) => b.count - a.count);
}

function buildTopListBreakdown(
  items: Array<{ label: string; value?: string; tone?: StatusTone | "neutral"; emphasis?: "count" | "text" }>,
  limit = 3,
): DashboardMetricBreakdownItem[] {
  if (items.length <= limit) {
    return items;
  }

  return [
    ...items.slice(0, limit),
    {
      label: `+${items.length - limit} more`,
      tone: "neutral",
      emphasis: "text",
    },
  ];
}

function buildSortedBreakdownMap(
  values: string[],
  options?: {
    order?: string[];
    toneMap?: Record<string, StatusTone | "neutral">;
    labelMap?: Record<string, string>;
  },
): DashboardMetricBreakdownItem[] {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  const mapped = [...counts.entries()].map(([key, count]) => ({
    key,
    label: options?.labelMap?.[key] ?? key,
    value: formatCountValue(count),
    numericCount: count,
    tone: options?.toneMap?.[key] ?? "neutral",
  }));

  if (options?.order?.length) {
    const orderIndex = new Map(options.order.map((value, index) => [value, index]));
    mapped.sort((a, b) => {
      const aIndex = orderIndex.get(a.key);
      const bIndex = orderIndex.get(b.key);

      if (aIndex !== undefined && bIndex !== undefined) {
        return aIndex - bIndex;
      }

      if (aIndex !== undefined) {
        return -1;
      }

      if (bIndex !== undefined) {
        return 1;
      }

      if (b.numericCount !== a.numericCount) {
        return b.numericCount - a.numericCount;
      }

      return a.label.localeCompare(b.label);
    });
  } else {
    mapped.sort((a, b) => {
      if (b.numericCount !== a.numericCount) {
        return b.numericCount - a.numericCount;
      }

      return a.label.localeCompare(b.label);
    });
  }

  return mapped.map(({ label, value, tone }) => ({
    label,
    value,
    tone,
    emphasis: "count",
  }));
}

function getRouteTone(status: ConsignmentRecord["gateStatus"]): StatusTone {
  switch (status) {
    case "READY":
      return "ready";
    case "REVIEW_REQUIRED":
      return "under_review";
    case "BLOCKED":
    default:
      return "blocked";
  }
}

function getLogisticsLabel(consignment: ConsignmentRecord): string {
  if (consignment.shipmentMode === "FUTURE_EXPORT") {
    return "Planning hold";
  }

  if (consignment.containerNo && consignment.containerNo !== "PENDING") {
    return "Ocean freight";
  }

  return "Export dispatch";
}

function getCargoLabel(consignment: ConsignmentRecord): string {
  const dispatchProduct = consignment.dispatchLines?.[0]?.productName;
  if (dispatchProduct) {
    return dispatchProduct;
  }

  return consignment.lineSummary[0]?.split(" / ")[0] ?? "Mixed export cargo";
}

function formatShipmentDate(value?: string): string {
  return value && value !== "—" ? value : "Planning hold";
}

function formatCartonLabel(value?: number): string {
  return typeof value === "number" ? `${value.toLocaleString()} ctns` : "Pending";
}

function formatGrossWeightLabel(value?: number): string {
  return typeof value === "number" ? `${value.toLocaleString()} T` : "Pending";
}

function getContainerLabel(consignment: ConsignmentRecord): string {
  if (!consignment.containerNo || consignment.containerNo === "PENDING" || consignment.containerNo === "—") {
    return "Container pending";
  }

  return consignment.containerSize ? `${consignment.containerNo} / ${consignment.containerSize}` : consignment.containerNo;
}

function getSaleOrderLabel(consignment: ConsignmentRecord): string {
  return consignment.saleOrderNo ? `SO# ${consignment.saleOrderNo}` : "SO pending";
}

function formatStatusLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function getShipmentStatus(consignment: ConsignmentRecord): NonNullable<ConsignmentRecord["shipmentStatus"]> {
  return consignment.shipmentStatus ?? "TO_BE_SHIPPED";
}

function getShipmentTone(status: NonNullable<ConsignmentRecord["shipmentStatus"]>): StatusTone {
  switch (status) {
    case "SHIPPED":
      return "ready";
    case "IN_TRANSIT":
      return "current";
    case "TO_BE_SHIPPED":
    default:
      return "pending";
  }
}

function formatShipmentStatusLabel(status: NonNullable<ConsignmentRecord["shipmentStatus"]>): string {
  switch (status) {
    case "SHIPPED":
      return "Shipped";
    case "IN_TRANSIT":
      return "In transit";
    case "TO_BE_SHIPPED":
    default:
      return "To be shipped";
  }
}

function parseDispatchDate(value?: string): Date | null {
  if (!value || value === "—" || value === "â€”") {
    return null;
  }

  const [day, month, year] = value.split("-").map(Number);
  if (!day || !month || !year) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDispatchMonth(date: Date | null): string {
  if (!date) {
    return "Planned / Date pending";
  }

  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function getQuantitySummaryLabel(consignment: ConsignmentRecord): string {
  const cartons = typeof consignment.totalCartons === "number" ? `${consignment.totalCartons.toLocaleString()} cartons` : null;
  const gross = typeof consignment.grossWeightTons === "number" ? `${consignment.grossWeightTons.toLocaleString()} T` : null;
  return [cartons, gross].filter(Boolean).join(" / ") || "Quantity pending";
}

function getProductBreakdown(consignment: ConsignmentRecord): string[] {
  const lines =
    consignment.dispatchLines?.map((line) => `${line.productName} • ${line.totalCartons.toLocaleString()} ctns`) ?? [];

  if (lines.length <= 2) {
    return lines;
  }

  return [...lines.slice(0, 2), `+${lines.length - 2} more lines`];
}

function getDestinationMarketGroup(consignment: ConsignmentRecord): "Europe" | "Gulf" | "Other markets" {
  const country = consignment.country ?? consignment.destination.split(",").at(-1)?.trim() ?? "";

  if (
    [
      "Netherlands",
      "Poland",
      "Czech Republic",
      "Germany",
      "Spain",
      "Bulgaria",
      "France",
      "Ireland",
      "Italy",
      "Romania",
    ].includes(country)
  ) {
    return "Europe";
  }

  if (["United Arab Emirates", "Saudi Arabia", "Qatar", "Oman", "Kuwait"].includes(country)) {
    return "Gulf";
  }

  return "Other markets";
}

function getComplianceDocumentCategory(value: string): ComplianceDocumentCategory {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]+/g, "_");

  if (normalized.includes("AGREEMENT") || normalized.includes("CONTRACT") || normalized.includes("EUDR_CLAUSE")) {
    return "Agreements & Contracts";
  }

  if (
    [
      "SUPPLIER_DECLARATION",
      "INTERMEDIARY_DECLARATION",
      "FARMER_DECLARATION",
      "SUSTAINABILITY_CERTIFICATE",
      "CERTIFICATION",
      "CERTIFICATE",
      "DECLARATION",
      "SUPPLIER_REQUEST",
    ].some((token) => normalized.includes(token))
  ) {
    return "Certificates & Declarations";
  }

  if (["CHAIN_OF_CUSTODY", "COC", "UPSTREAM_TRADE_PROOF", "TRADE_PROOF"].some((token) => normalized.includes(token))) {
    return "Chain of Custody (CoC) Documents";
  }

  if (["GEOLOCATION", "SHAPEFILE", "MAPPING", "MAP"].some((token) => normalized.includes(token))) {
    return "Geolocation & Mapping Records";
  }

  if (["LEGAL", "LICENSE", "PERMIT", "LAND_RIGHTS", "LABOUR_RIGHTS"].some((token) => normalized.includes(token))) {
    return "Legal & Permit Documents";
  }

  if (["AUDIT", "ASSESSMENT", "DEFORESTATION"].some((token) => normalized.includes(token))) {
    return "Audit & Assessment Reports";
  }

  if (["POLICY", "PROCEDURE", "SOP", "GOVERNANCE"].some((token) => normalized.includes(token))) {
    return "Policies & Procedures";
  }

  if (["DDS", "DUE_DILIGENCE", "DILIGENCE", "COMPLIANCE_PACKAGE", "RISK_CONCLUSION"].some((token) => normalized.includes(token))) {
    return "Due Diligence Documents";
  }

  return "Product & Ingredient Documents";
}

function parseIsoDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isExpiringSoon(expiresAt?: string, now = new Date()): boolean {
  const expiry = parseIsoDate(expiresAt);
  if (!expiry) {
    return false;
  }

  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const expiryUtc = expiry.getTime();
  const sixtyDaysFromToday = todayUtc + 60 * 24 * 60 * 60 * 1000;
  return expiryUtc >= todayUtc && expiryUtc <= sixtyDaysFromToday;
}

function isExpiredByDate(expiresAt?: string, now = new Date()): boolean {
  const expiry = parseIsoDate(expiresAt);
  if (!expiry) {
    return false;
  }

  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return expiry.getTime() < todayUtc;
}

function buildComplianceDocumentCoverage(documents: DocumentRecord[], suppliers: SupplierRecord[]): DashboardComplianceDocumentCoverageVM {
  type NormalizedDocument = {
    id: string;
    category: ComplianceDocumentCategory;
    status: DocumentRecord["status"];
    expiresAt?: string;
  };

  const normalizedDocuments: NormalizedDocument[] = [
    ...documents.map((document) => ({
      id: document.id,
      category: getComplianceDocumentCategory(`${document.documentRole} ${document.title}`),
      status: document.status,
      expiresAt: document.expiresAt,
    })),
    ...suppliers.flatMap((supplier) =>
      (supplier.documents ?? []).map((document) => ({
        id: `${supplier.id}-${document.id}`,
        category: getComplianceDocumentCategory(`${document.type} ${document.name}`),
        status: isExpiredByDate(document.expiresAt) ? ("EXPIRED" as const) : ("CURRENT" as const),
        expiresAt: document.expiresAt,
      })),
    ),
  ];

  const categories = COMPLIANCE_DOCUMENT_CATEGORIES.map((category) => {
    const categoryDocuments = normalizedDocuments.filter((document) => document.category === category);
    const expired = categoryDocuments.filter(
      (document) => document.status === "EXPIRED" || isExpiredByDate(document.expiresAt),
    ).length;
    const requestedOrDraft = categoryDocuments.filter(
      (document) => document.status === "REQUESTED" || document.status === "DRAFT",
    ).length;
    const expiringSoon = categoryDocuments.filter((document) => isExpiringSoon(document.expiresAt)).length;
    const current = categoryDocuments.filter(
      (document) => document.status === "CURRENT" && !isExpiredByDate(document.expiresAt),
    ).length;
    const actionRequired = requestedOrDraft + expired + expiringSoon;
    const count = categoryDocuments.length;

    return {
      id: category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      label: category,
      count,
      current,
      requestedOrDraft,
      expired,
      expiringSoon,
      actionRequired,
      completionRate: formatPercent(current, count),
      tone:
        expired > 0
          ? ("held" as StatusTone)
          : requestedOrDraft > 0 || expiringSoon > 0
            ? ("under_review" as StatusTone)
            : count > 0
              ? ("ready" as StatusTone)
              : "neutral",
    } satisfies DashboardComplianceDocumentCategoryVM;
  });

  return {
    total: normalizedDocuments.length,
    current: categories.reduce((sum, category) => sum + category.current, 0),
    requestedOrDraft: categories.reduce((sum, category) => sum + category.requestedOrDraft, 0),
    expired: categories.reduce((sum, category) => sum + category.expired, 0),
    expiringSoon: categories.reduce((sum, category) => sum + category.expiringSoon, 0),
    actionRequired: categories.reduce((sum, category) => sum + category.actionRequired, 0),
    categories,
  };
}

function getEvidenceStatusFromCounts(counts: Pick<DashboardEvidenceGapCellVM, "attached" | "missing" | "requested" | "expired">): DashboardEvidenceStatus {
  if (counts.expired > 0) return "expired";
  if (counts.missing > 0) return "missing";
  if (counts.requested > 0) return "requested";
  return "attached";
}

function createEvidenceGapCell(
  rowId: DashboardEvidenceGapCellVM["rowId"],
  columnId: DashboardEvidenceGapCellVM["columnId"],
  label: string,
  counts: Pick<DashboardEvidenceGapCellVM, "attached" | "missing" | "requested" | "expired">,
): DashboardEvidenceGapCellVM {
  const total = counts.attached + counts.missing + counts.requested + counts.expired;
  return {
    rowId,
    columnId,
    label,
    ...counts,
    total,
    status: total > 0 ? getEvidenceStatusFromCounts(counts) : "missing",
  };
}

function getDocumentStatusCounts(documents: Array<{ status: DocumentRecord["status"]; expiresAt?: string }>) {
  return {
    attached: documents.filter((document) => document.status === "CURRENT" && !isExpiredByDate(document.expiresAt)).length,
    missing: 0,
    requested: documents.filter((document) => document.status === "REQUESTED" || document.status === "DRAFT").length,
    expired: documents.filter((document) => document.status === "EXPIRED" || isExpiredByDate(document.expiresAt)).length,
  };
}

function getEvidenceAttachmentStatusCounts(evidence: EudrEvidenceAttachment[]) {
  return {
    attached: evidence.filter((item) => item.status === "ATTACHED").length,
    missing: evidence.filter((item) => item.status === "MISSING").length,
    requested: evidence.filter((item) => item.status === "REQUESTED").length,
    expired: 0,
  };
}

function addCounts(
  left: Pick<DashboardEvidenceGapCellVM, "attached" | "missing" | "requested" | "expired">,
  right: Pick<DashboardEvidenceGapCellVM, "attached" | "missing" | "requested" | "expired">,
) {
  return {
    attached: left.attached + right.attached,
    missing: left.missing + right.missing,
    requested: left.requested + right.requested,
    expired: left.expired + right.expired,
  };
}

function buildEvidenceGapHeatmap({
  products,
  suppliers,
  consignments,
  documents,
  eudrEvidenceAttachments = [],
}: Pick<DashboardMetricParams, "products" | "suppliers" | "consignments" | "documents" | "eudrEvidenceAttachments">): DashboardEvidenceGapHeatmapVM {
  const columns: DashboardEvidenceGapHeatmapVM["columns"] = [
    { id: "declaration", label: "Declaration" },
    { id: "coc", label: "CoC" },
    { id: "geolocation", label: "Geolocation" },
    { id: "legal", label: "Legal Evidence" },
    { id: "audit", label: "Audit Report" },
    { id: "dueDiligence", label: "Due Diligence Memo" },
  ];

  const documentsByCategory = COMPLIANCE_DOCUMENT_CATEGORIES.reduce<Record<ComplianceDocumentCategory, DocumentRecord[]>>((acc, category) => {
    acc[category] = documents.filter((document) => getComplianceDocumentCategory(`${document.documentRole} ${document.title}`) === category);
    return acc;
  }, {} as Record<ComplianceDocumentCategory, DocumentRecord[]>);

  const supplierDeclarationCounts = {
    attached: suppliers.filter((supplier) => supplier.declarationStatus === "SIGNED").length,
    missing: suppliers.filter((supplier) => supplier.declarationStatus === "MISSING").length,
    requested: suppliers.filter((supplier) => supplier.declarationStatus === "REQUESTED" || supplier.declarationStatus === "UNDER_REVIEW").length,
    expired: 0,
  };
  const supplierCocCounts = {
    attached: suppliers.filter((supplier) => supplier.cocStatus === "VERIFIED").length,
    missing: suppliers.filter((supplier) => supplier.cocStatus === "MISSING").length,
    requested: suppliers.filter((supplier) => supplier.cocStatus === "MSDS_ONLY" || supplier.cocStatus === "UNDER_REVIEW").length,
    expired: 0,
  };
  const supplierGeolocationCounts = {
    attached: suppliers.filter((supplier) => supplier.geolocationCoverage >= 90).length,
    missing: suppliers.filter((supplier) => supplier.geolocationCoverage < 50).length,
    requested: suppliers.filter((supplier) => supplier.geolocationCoverage >= 50 && supplier.geolocationCoverage < 90).length,
    expired: 0,
  };
  const supplierContractCounts = {
    attached: suppliers.filter((supplier) => supplier.contractStatus === "EUDR_CLAUSE_PRESENT").length,
    missing: suppliers.filter((supplier) => supplier.contractStatus === "MISSING").length,
    requested: suppliers.filter((supplier) => supplier.contractStatus === "LEGACY_CONTRACT").length,
    expired: suppliers.flatMap((supplier) => supplier.documents ?? []).filter((document) => document.type === "Agreement" && isExpiredByDate(document.expiresAt)).length,
  };
  const supplierAuditCounts = getDocumentStatusCounts(
    suppliers.flatMap((supplier) => (supplier.documents ?? []).filter((document) => document.type === "Audit Record").map((document) => ({
      status: isExpiredByDate(document.expiresAt) ? ("EXPIRED" as const) : ("CURRENT" as const),
      expiresAt: document.expiresAt,
    }))),
  );

  const ingredientRecords = products.flatMap((product) => product.ingredients);
  const ingredientDeclarationCounts = {
    attached: ingredientRecords.filter((ingredient) => ingredient.evidenceStatus === "COMPLETE").length,
    missing: ingredientRecords.filter((ingredient) => ingredient.evidenceStatus === "MISSING").length,
    requested: ingredientRecords.filter((ingredient) => ingredient.evidenceStatus === "PARTIAL").length,
    expired: 0,
  };
  const ingredientCocCounts = {
    attached: ingredientRecords.filter((ingredient) => ingredient.supplyChainStatus === "COMPLETE").length,
    missing: ingredientRecords.filter((ingredient) => ingredient.supplyChainStatus === "GAPS_FOUND" || ingredient.supplyChainStatus === "BLOCKED").length,
    requested: ingredientRecords.filter((ingredient) => ingredient.supplyChainStatus === "REQUESTED" || ingredient.supplyChainStatus === "IN_PROGRESS").length,
    expired: 0,
  };
  const geoEvidenceCounts = getEvidenceAttachmentStatusCounts(eudrEvidenceAttachments.filter((item) => item.documentRole === "GEOLOCATION_FILE"));
  const legalEvidenceCounts = getEvidenceAttachmentStatusCounts(
    eudrEvidenceAttachments.filter((item) =>
      item.documentRole === "LAND_RIGHTS_EVIDENCE" || item.documentRole === "LEGAL_LICENSE" || item.documentRole === "LABOUR_RIGHTS_EVIDENCE",
    ),
  );

  const productReadyCounts = {
    attached: products.filter((product) => product.exportReadiness === "READY").length,
    missing: products.filter((product) => product.exportReadiness === "NOT_READY").length,
    requested: products.filter((product) => product.exportReadiness === "REVIEW_REQUIRED").length,
    expired: 0,
  };
  const productScopeCounts = {
    attached: products.filter((product) => product.scopeStatus === "OUT_OF_SCOPE").length,
    missing: products.filter((product) => product.scopeStatus === "FUTURE_EXPORT_BLOCKED").length,
    requested: products.filter((product) => product.scopeStatus === "IN_SCOPE" || product.scopeStatus === "UNDER_CLASSIFICATION_REVIEW").length,
    expired: 0,
  };

  const shipmentTraceabilityCounts = {
    attached: consignments.filter((consignment) => consignment.traceabilityStatus === "TRACEABLE").length,
    missing: consignments.filter((consignment) => consignment.traceabilityStatus === "BLOCKED").length,
    requested: consignments.filter((consignment) => consignment.traceabilityStatus === "REVIEW_REQUIRED").length,
    expired: 0,
  };
  const shipmentGateCounts = {
    attached: consignments.filter((consignment) => consignment.gateStatus === "READY").length,
    missing: consignments.filter((consignment) => consignment.gateStatus === "BLOCKED").length,
    requested: consignments.filter((consignment) => consignment.gateStatus === "REVIEW_REQUIRED").length,
    expired: 0,
  };

  const rows: DashboardEvidenceGapHeatmapVM["rows"] = [
    {
      id: "supplier",
      label: "Supplier",
      description: "Direct supplier declarations, CoC, geo and legal/audit evidence.",
      cells: [
        createEvidenceGapCell("supplier", "declaration", "Declaration", supplierDeclarationCounts),
        createEvidenceGapCell("supplier", "coc", "CoC", supplierCocCounts),
        createEvidenceGapCell("supplier", "geolocation", "Geolocation", supplierGeolocationCounts),
        createEvidenceGapCell("supplier", "legal", "Legal Evidence", supplierContractCounts),
        createEvidenceGapCell("supplier", "audit", "Audit Report", supplierAuditCounts),
        createEvidenceGapCell("supplier", "dueDiligence", "Due Diligence Memo", getDocumentStatusCounts(documentsByCategory["Due Diligence Documents"])),
      ],
    },
    {
      id: "ingredient",
      label: "Ingredient",
      description: "Ingredient evidence, upstream CoC, geo files and legal attachments.",
      cells: [
        createEvidenceGapCell("ingredient", "declaration", "Declaration", addCounts(ingredientDeclarationCounts, getEvidenceAttachmentStatusCounts(eudrEvidenceAttachments.filter((item) => item.documentRole.includes("DECLARATION"))))),
        createEvidenceGapCell("ingredient", "coc", "CoC", addCounts(ingredientCocCounts, getEvidenceAttachmentStatusCounts(eudrEvidenceAttachments.filter((item) => item.documentRole === "UPSTREAM_TRADE_PROOF")))),
        createEvidenceGapCell("ingredient", "geolocation", "Geolocation", geoEvidenceCounts),
        createEvidenceGapCell("ingredient", "legal", "Legal Evidence", legalEvidenceCounts),
        createEvidenceGapCell("ingredient", "audit", "Audit Report", getDocumentStatusCounts(documentsByCategory["Audit & Assessment Reports"])),
        createEvidenceGapCell("ingredient", "dueDiligence", "Due Diligence Memo", getDocumentStatusCounts(documentsByCategory["Due Diligence Documents"])),
      ],
    },
    {
      id: "product",
      label: "Product",
      description: "Product readiness, ingredient evidence, scope memos and DDS support.",
      cells: [
        createEvidenceGapCell("product", "declaration", "Declaration", productReadyCounts),
        createEvidenceGapCell("product", "coc", "CoC", ingredientCocCounts),
        createEvidenceGapCell("product", "geolocation", "Geolocation", geoEvidenceCounts),
        createEvidenceGapCell("product", "legal", "Legal Evidence", getDocumentStatusCounts(documentsByCategory["Legal & Permit Documents"])),
        createEvidenceGapCell("product", "audit", "Audit Report", getDocumentStatusCounts(documentsByCategory["Audit & Assessment Reports"])),
        createEvidenceGapCell("product", "dueDiligence", "Due Diligence Memo", addCounts(productScopeCounts, getDocumentStatusCounts(documentsByCategory["Due Diligence Documents"]))),
      ],
    },
    {
      id: "shipment",
      label: "Shipment",
      description: "Release evidence, traceability gate state and downstream package risk.",
      cells: [
        createEvidenceGapCell("shipment", "declaration", "Declaration", shipmentGateCounts),
        createEvidenceGapCell("shipment", "coc", "CoC", shipmentTraceabilityCounts),
        createEvidenceGapCell("shipment", "geolocation", "Geolocation", shipmentTraceabilityCounts),
        createEvidenceGapCell("shipment", "legal", "Legal Evidence", shipmentGateCounts),
        createEvidenceGapCell("shipment", "audit", "Audit Report", getDocumentStatusCounts(documentsByCategory["Audit & Assessment Reports"])),
        createEvidenceGapCell("shipment", "dueDiligence", "Due Diligence Memo", shipmentGateCounts),
      ],
    },
  ];

  const allCells = rows.flatMap((row) => row.cells);
  const statusTotals = allCells.reduce<Record<DashboardEvidenceStatus, number>>(
    (acc, cell) => {
      acc.attached += cell.attached;
      acc.missing += cell.missing;
      acc.requested += cell.requested;
      acc.expired += cell.expired;
      return acc;
    },
    { attached: 0, missing: 0, requested: 0, expired: 0 },
  );

  return {
    rows,
    columns,
    statusTotals,
    criticalGapCount: statusTotals.missing + statusTotals.expired,
  };
}

function getDaysUntilExpiry(expiresAt?: string, now = new Date()): number | null {
  const expiry = parseIsoDate(expiresAt);
  if (!expiry) return null;

  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.ceil((expiry.getTime() - todayUtc) / (24 * 60 * 60 * 1000));
}

function formatShortDate(value?: string): string {
  const parsed = parseIsoDate(value);
  if (!parsed) return "Date pending";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(parsed);
}

function buildExpiringEvidenceRisk(documents: DocumentRecord[], suppliers: SupplierRecord[]): DashboardExpiringEvidenceRiskVM {
  type ExpiringEvidenceItem = {
    id: string;
    family: ComplianceDocumentCategory;
    linkedEntityLabel: string;
    expiresAt?: string;
    daysUntilExpiry: number;
  };

  const evidenceItems: ExpiringEvidenceItem[] = [
    ...documents.map((document) => ({
      id: document.id,
      family: getComplianceDocumentCategory(`${document.documentRole} ${document.title}`),
      linkedEntityLabel: document.linkedEntity,
      expiresAt: document.expiresAt,
      daysUntilExpiry: getDaysUntilExpiry(document.expiresAt) ?? Number.POSITIVE_INFINITY,
    })),
    ...suppliers.flatMap((supplier) =>
      (supplier.documents ?? []).map((document) => ({
        id: `${supplier.id}-${document.id}`,
        family: getComplianceDocumentCategory(`${document.type} ${document.name}`),
        linkedEntityLabel: supplier.name,
        expiresAt: document.expiresAt,
        daysUntilExpiry: getDaysUntilExpiry(document.expiresAt) ?? Number.POSITIVE_INFINITY,
      })),
    ),
  ].filter((item) => item.daysUntilExpiry >= 0 && item.daysUntilExpiry <= 90);

  const buckets: DashboardExpiringEvidenceRiskBucketVM[] = [
    { id: "next30", label: "Next 30", count: evidenceItems.filter((item) => item.daysUntilExpiry <= 30).length },
    { id: "next60", label: "31-60", count: evidenceItems.filter((item) => item.daysUntilExpiry > 30 && item.daysUntilExpiry <= 60).length },
    { id: "next90", label: "61-90", count: evidenceItems.filter((item) => item.daysUntilExpiry > 60 && item.daysUntilExpiry <= 90).length },
  ];

  const families = COMPLIANCE_DOCUMENT_CATEGORIES.map((family) => {
    const familyItems = evidenceItems.filter((item) => item.family === family).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    const soonest = familyItems[0];
    const next30 = familyItems.filter((item) => item.daysUntilExpiry <= 30).length;
    const next60 = familyItems.filter((item) => item.daysUntilExpiry > 30 && item.daysUntilExpiry <= 60).length;
    const next90 = familyItems.filter((item) => item.daysUntilExpiry > 60 && item.daysUntilExpiry <= 90).length;

    return {
      id: family.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      family,
      totalExpiring: familyItems.length,
      next30,
      next60,
      next90,
      soonestExpiryLabel: soonest ? formatShortDate(soonest.expiresAt) : "No 90-day risk",
      linkedEntityLabel: soonest?.linkedEntityLabel ?? "No linked risk",
      tone: next30 > 0 ? ("held" as StatusTone) : next60 > 0 ? ("under_review" as StatusTone) : next90 > 0 ? ("pending" as StatusTone) : "neutral",
    } satisfies DashboardExpiringEvidenceRiskFamilyVM;
  }).filter((family) => family.totalExpiring > 0);

  return {
    totalExpiring: evidenceItems.length,
    buckets,
    families,
  };
}

function getSupplierTraceabilityStatusLabel(supplier: SupplierRecord): DashboardSupplierTraceabilityStatusLabel {
  const documents = supplier.documents ?? [];
  const hasAudit = documents.some((document) => document.type === "Audit Record" && !isExpiredByDate(document.expiresAt));
  const hasExpiredAudit = documents.some((document) => document.type === "Audit Record" && isExpiredByDate(document.expiresAt));

  const hasMissingDocuments =
    supplier.declarationStatus === "MISSING" ||
    supplier.cocStatus === "MISSING" ||
    supplier.contractStatus === "MISSING" ||
    hasExpiredAudit ||
    !hasAudit;

  const isPendingVerification =
    supplier.onboardingStatus === "UNDER_REVIEW" ||
    supplier.onboardingStatus === "PENDING_RESPONSE" ||
    supplier.onboardingStatus === "CHANGES_REQUESTED" ||
    supplier.onboardingStatus === "BLOCKED" ||
    supplier.declarationStatus === "REQUESTED" ||
    supplier.declarationStatus === "UNDER_REVIEW" ||
    supplier.cocStatus === "MSDS_ONLY" ||
    supplier.cocStatus === "UNDER_REVIEW" ||
    supplier.contractStatus === "LEGACY_CONTRACT";

  const isComplete =
    supplier.onboardingStatus === "APPROVED" &&
    supplier.declarationStatus === "SIGNED" &&
    supplier.cocStatus === "VERIFIED" &&
    supplier.geolocationCoverage >= 90 &&
    supplier.contractStatus === "EUDR_CLAUSE_PRESENT" &&
    hasAudit;

  if (supplier.geolocationCoverage < 50) {
    return "Missing Origin Data";
  }

  if (hasMissingDocuments) {
    return "Missing Documents";
  }

  if (isPendingVerification) {
    return "Pending Verification";
  }

  if (isComplete) {
    return "Complete Traceability";
  }

  return "Partial Traceability";
}

function buildSupplierTraceabilityStatus(suppliers: SupplierRecord[]): DashboardSupplierTraceabilityStatusVM {
  const statusMeta: Array<{
    id: string;
    label: DashboardSupplierTraceabilityStatusLabel;
    tone: StatusTone;
    description: string;
  }> = [
    {
      id: "complete-traceability",
      label: "Complete Traceability",
      tone: "ready",
      description: "Approved suppliers with declaration, CoC, geolocation, contract, and valid audit evidence.",
    },
    {
      id: "partial-traceability",
      label: "Partial Traceability",
      tone: "under_review",
      description: "Meaningful supplier traceability exists, but one or more completion signals still need closure.",
    },
    {
      id: "missing-origin-data",
      label: "Missing Origin Data",
      tone: "review_required",
      description: "Origin or geolocation coverage is materially incomplete for traceability assurance.",
    },
    {
      id: "missing-documents",
      label: "Missing Documents",
      tone: "blocked",
      description: "Critical declaration, CoC, contract, or audit evidence is missing or expired.",
    },
    {
      id: "pending-verification",
      label: "Pending Verification",
      tone: "pending",
      description: "Supplier evidence exists, but verification or review workflow is still open.",
    },
  ];

  const totalSuppliers = suppliers.length;
  const counts = suppliers.reduce<Record<DashboardSupplierTraceabilityStatusLabel, number>>(
    (acc, supplier) => {
      const label = getSupplierTraceabilityStatusLabel(supplier);
      acc[label] += 1;
      return acc;
    },
    {
      "Complete Traceability": 0,
      "Partial Traceability": 0,
      "Missing Origin Data": 0,
      "Missing Documents": 0,
      "Pending Verification": 0,
    },
  );

  const segments = statusMeta.map((segment) => ({
    ...segment,
    count: counts[segment.label],
    percentage: totalSuppliers > 0 ? Number(((counts[segment.label] / totalSuppliers) * 100).toFixed(1)) : 0,
  })) satisfies DashboardSupplierTraceabilityStatusSegmentVM[];

  const nonCompleteSegments = segments
    .filter((segment) => segment.label !== "Complete Traceability" && segment.count > 0)
    .sort((a, b) => b.count - a.count || b.percentage - a.percentage);

  return {
    totalSuppliers,
    completePercent: segments.find((segment) => segment.label === "Complete Traceability")?.percentage ?? 0,
    topRiskLabel: nonCompleteSegments[0]?.label ?? "No active supplier traceability gaps",
    segments,
  };
}

function buildTraceabilityGapCategories({
  suppliers,
  supplyChainNodes,
  consignments,
}: Pick<DashboardMetricParams, "suppliers" | "supplyChainNodes" | "consignments">): DashboardTraceabilityGapCategoryVM[] {
  const missingOriginData = suppliers.filter((supplier) => supplier.geolocationCoverage < 50).length;
  const missingSupplierDeclaration = suppliers.filter((supplier) => supplier.declarationStatus === "MISSING").length;
  const missingCocDocument = suppliers.filter((supplier) => supplier.cocStatus === "MISSING").length;
  const expiredCertificates = suppliers
    .flatMap((supplier) => supplier.documents ?? [])
    .filter((document) => document.type === "Certificate" && isExpiredByDate(document.expiresAt)).length;
  const unverifiedUpstreamSupplier = supplyChainNodes.filter(
    (node) => node.tier >= 2 && node.status !== "COMPLETE",
  ).length;
  const missingConsignmentLinkage = consignments.filter(
    (consignment) => consignment.traceabilityStatus !== "TRACEABLE",
  ).length;

  const categories: DashboardTraceabilityGapCategoryVM[] = [
    {
      id: "missing-origin-data",
      label: "Missing Origin Data",
      count: missingOriginData,
      tone: "held",
      description: "Suppliers with geolocation coverage below 50%.",
    },
    {
      id: "missing-supplier-declaration",
      label: "Missing Supplier Declaration",
      count: missingSupplierDeclaration,
      tone: "blocked",
      description: "Direct suppliers missing signed EUDR declarations.",
    },
    {
      id: "missing-coc-document",
      label: "Missing Chain-of-Custody Document",
      count: missingCocDocument,
      tone: "review_required",
      description: "Suppliers without verified CoC evidence.",
    },
    {
      id: "expired-certificates",
      label: "Expired Certificates",
      count: expiredCertificates,
      tone: "under_review",
      description: "Supplier certificates that are past their validity date.",
    },
    {
      id: "unverified-upstream-supplier",
      label: "Unverified Upstream Supplier",
      count: unverifiedUpstreamSupplier,
      tone: "pending",
      description: "Tier 2+ nodes awaiting traceability completion.",
    },
    {
      id: "missing-consignment-linkage",
      label: "Missing Consignment Linkage",
      count: missingConsignmentLinkage,
      tone: "blocked",
      description: "Consignments missing traceability clearance.",
    },
  ];

  return categories.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function getUniqueBlockers({
  products,
  suppliers,
  consignments,
  plots,
  documents,
  supplyChainNodes,
}: Pick<
  DashboardMetricParams,
  "products" | "suppliers" | "consignments" | "plots" | "documents" | "supplyChainNodes"
>): string[] {
  const blockers = new Set<string>();

  products
    .filter((product) => product.exportReadiness !== "READY" || product.scopeStatus !== "OUT_OF_SCOPE")
    .flatMap((product) => product.blockingGaps)
    .slice(0, 6)
    .forEach((gap) => blockers.add(gap));

  suppliers
    .filter((supplier) => supplier.onboardingStatus !== "APPROVED")
    .flatMap((supplier) => supplier.issues.slice(0, 1))
    .forEach((issue) => blockers.add(issue));

  consignments
    .filter((consignment) => consignment.gateStatus !== "READY")
    .flatMap((consignment) => consignment.issues.map((issue) => issue.message))
    .forEach((issue) => blockers.add(issue));

  plots
    .filter((plot) => plot.status === "REQUESTED" || plot.status === "CHANGES_REQUESTED")
    .forEach((plot) => blockers.add(`${plot.label}: coordinate or geometry review still open.`));

  documents
    .filter((document) => document.status === "REQUESTED" || document.status === "EXPIRED")
    .slice(0, 2)
    .forEach((document) => blockers.add(`${document.title}: evidence status is ${document.status.toLowerCase()}.`));

  supplyChainNodes
    .filter((node) => node.parentNodeId === null && node.status !== "COMPLETE")
    .forEach((node) => blockers.add(`${node.entityName}: upstream chain is ${node.status.toLowerCase().replace(/_/g, " ")}.`));

  return [...blockers].slice(0, 8);
}

export function buildDashboardViewModel({
  products,
  suppliers,
  consignments,
  plots,
  documents,
  eudrEvidenceAttachments = [],
  outputPackages,
  reports,
  supplierRequests,
  supplyChainNodes,
}: DashboardMetricParams): DashboardViewModel {
  // Source of truth for this dashboard pass is the normalized frontend dataset.
  // Reconcile richer raw GFI markdown baseline coverage in a follow-up phase.
  const allIngredients = products.flatMap((product) => product.ingredients);
  const totalAnnualVolume = products.reduce((sum, product) => sum + parseAnnualVolume(product.annualVolume), 0);
  const exportProducts = products.filter((product) =>
    product.primaryMarkets.some((market) => EXPORT_MARKETS.includes(market as (typeof EXPORT_MARKETS)[number])),
  );
  const annualExportVolume = exportProducts.reduce((sum, product) => sum + parseAnnualVolume(product.annualVolume), 0);
  const readyProducts = products.filter((product) => classifyProductPosture(product) === "Ready").length;
  const approvedSuppliers = suppliers.filter((supplier) => supplier.onboardingStatus === "APPROVED").length;
  const readyShipments = consignments.filter((consignment) => consignment.gateStatus === "READY").length;
  const blockedShipments = consignments.filter((consignment) => consignment.gateStatus === "BLOCKED").length;
  const reviewShipments = consignments.filter((consignment) => consignment.gateStatus === "REVIEW_REQUIRED").length;
  const complianceRelevantIngredients = allIngredients.filter(
    (ingredient) => ingredient.relevance === "IN_SCOPE" || ingredient.relevance === "UNDER_REVIEW",
  ).length;
  const rootNodes = supplyChainNodes.filter((node) => node.parentNodeId === null);
  const completeRootChains = rootNodes.filter((node) => node.status === "COMPLETE").length;
  const requestedRootChains = rootNodes.filter((node) => node.status === "REQUESTED").length;
  const inProgressRootChains = rootNodes.filter((node) => node.status === "IN_PROGRESS" || node.status === "SUBMITTED").length;
  const gapRootChains = rootNodes.filter((node) => node.status === "GAPS_FOUND").length;
  const blockedRootChains = rootNodes.filter((node) => node.status === "BLOCKED").length;
  const currentDocuments = documents.filter((document) => document.status === "CURRENT").length;
  const requestedOrExpiredDocuments = documents.filter(
    (document) => document.status === "REQUESTED" || document.status === "EXPIRED",
  ).length;
  const complianceDocuments = buildComplianceDocumentCoverage(documents, suppliers);
  const evidenceGapHeatmap = buildEvidenceGapHeatmap({ products, suppliers, consignments, documents, eudrEvidenceAttachments });
  const expiringEvidenceRisk = buildExpiringEvidenceRisk(documents, suppliers);
  const supplierTraceabilityStatus = buildSupplierTraceabilityStatus(suppliers);
  const traceabilityGapCategories = buildTraceabilityGapCategories({ suppliers, supplyChainNodes, consignments });
  const readyPackages = outputPackages.filter((pkg) => pkg.status === "READY_FOR_AGENT").length;
  const heldPackages = outputPackages.filter((pkg) => pkg.status === "HELD").length;
  const inScopeProducts = products.filter((product) => product.scopeStatus === "IN_SCOPE").length;
  const deforestationReviews = plots.filter(
    (plot) => plot.latestDeforestationStatus === "PENDING" || plot.latestDeforestationStatus === "FLAGGED",
  ).length;
  const uniqueMarketsCount = new Set(products.flatMap((product) => product.primaryMarkets)).size;
  const uniqueSupplierCountriesCount = new Set(suppliers.map((supplier) => supplier.country)).size;
  const openHighPriorityBlockers =
    blockedShipments +
    gapRootChains +
    suppliers.filter((supplier) => supplier.latestRiskLevel === "HIGH" || supplier.latestRiskLevel === "CRITICAL").length;

  const blockers = getUniqueBlockers({ products, suppliers, consignments, plots, documents, supplyChainNodes });
  const marketOrder = ["Pakistan", "EU", "Gulf", "Future EU"];
  const euLinkedProductsCount = products.filter(
    (product) => product.primaryMarkets.includes("EU") || product.primaryMarkets.includes("Future EU"),
  ).length;
  const exportMarketBreakdown = buildSortedBreakdownMap(
    exportProducts.flatMap((product) =>
      product.primaryMarkets.filter((market) => EXPORT_MARKETS.includes(market as (typeof EXPORT_MARKETS)[number])),
    ),
    {
      order: ["EU", "Gulf"],
      toneMap: {
        EU: "ready",
        Gulf: "neutral",
      },
    },
  ).map((item) => ({
    ...item,
    value: `${item.value} Products`,
  }));

  const lowRiskSuppliers = suppliers.filter((s) => s.latestRiskLevel === "LOW").length;
  const mediumRiskSuppliers = suppliers.filter((s) => s.latestRiskLevel === "MEDIUM").length;
  const highRiskSuppliers = suppliers.filter((s) => s.latestRiskLevel === "HIGH").length;
  const criticalRiskSuppliers = suppliers.filter((s) => s.latestRiskLevel === "CRITICAL").length;

  const supplierRiskChart: DashboardChartDatum[] = [
    { label: "Critical", value: criticalRiskSuppliers, tone: "held" },
    { label: "High", value: highRiskSuppliers, tone: "blocked" },
    { label: "Medium", value: mediumRiskSuppliers, tone: "review" },
    { label: "Low", value: lowRiskSuppliers, tone: "approved" },
  ];

  const riskPillarScores: RiskPillarScore[] = [
    { code: "B1", name: "Legal & Regulatory", score: 45, riskLevel: "MEDIUM", tone: "under_review" },
    { code: "B2", name: "Product Scope & HS Codes", score: 65, riskLevel: "HIGH", tone: "blocked" },
    { code: "B3", name: "Procurement & Suppliers", score: 70, riskLevel: "HIGH", tone: "blocked" },
    { code: "B4", name: "Production & Traceability", score: 50, riskLevel: "MEDIUM", tone: "under_review" },
    { code: "B5", name: "Governance & Operations", score: 55, riskLevel: "MEDIUM", tone: "under_review" },
    { code: "B6", name: "Country Sourcing Risk", score: 25, riskLevel: "LOW", tone: "approved" },
  ];

  const auditFindings: AuditFindingSummary = {
    critical: 2,
    high: 7,
    medium: 1,
    info: 2,
    total: 12,
    closed: 3,
    remediationRate: 25,
    findingsList: [
      { id: "F-01", description: "Palm Fat HS Code WRONG — must correct from 1513.29 to 1516.20/1517.90", severity: "HIGH", status: "Open", tone: "blocked" },
      { id: "F-02", description: "GFI uses SOLID/WAX palm fat, not liquid oil — product type differs", severity: "HIGH", status: "Open", tone: "blocked" },
      { id: "F-03", description: "UNDISCLOSED cocoa processor Indococoa (supplied via N A Enterprises) — not in Products Form", severity: "CRITICAL", status: "Open", tone: "held" },
      { id: "F-04", description: "Indococoa route via N A Enterprises must receive Supplier Declaration Form and be formally assessed", severity: "HIGH", status: "Open", tone: "blocked" },
      { id: "F-05", description: "Cocoa Powder HS 1805.00 confirmed correct — matches Annex I", severity: "INFO", status: "Closed", tone: "approved" },
      { id: "F-06", description: "GFI has NO EORI and NO TRACES account — sells via EU agents", severity: "CRITICAL", status: "Open", tone: "held" },
      { id: "F-07", description: "GFI has REX number — NOT relevant for EUDR (REX ≠ EORI)", severity: "MEDIUM", status: "Open", tone: "under_review" },
      { id: "F-08", description: "GFI revenue €37M — classified as MEDIUM enterprise (Dec 2026 deadline)", severity: "HIGH", status: "Closed", tone: "approved" },
      { id: "F-09", description: "SAP ERP does NOT store HS codes or Chain-of-Custody — traceability gap", severity: "HIGH", status: "Open", tone: "blocked" },
      { id: "F-10", description: "Palm Oil CoC (Segregated) found ONLY on MSDS — not on commercial docs", severity: "HIGH", status: "Open", tone: "blocked" },
      { id: "F-11", description: "Cocoa CoC NOT found on ANY document — zero CoC evidence for suppliers", severity: "HIGH", status: "Open", tone: "blocked" },
      { id: "F-12", description: "RSPO Certificate verified as legitimate — valid until Jan 2028", severity: "INFO", status: "Closed", tone: "approved" },
    ]
  };

  const complianceFrameworks: ComplianceFramework[] = [
    {
      name: "EUDR",
      description: "European Union Deforestation Regulation",
      status: "Active",
      badgeTone: "success",
      timeline: "Deadline Dec 2026",
    },
    {
      name: "CSDDD",
      description: "Corporate Sustainability Due Diligence Directive",
      status: "Monitoring",
      badgeTone: "info",
      timeline: "Phased from 2027",
    },
    {
      name: "FSMA 204",
      description: "FDA Food Safety Modernization Act (Section 204)",
      status: "Planned",
      badgeTone: "warning",
      timeline: "Targeting US Exports",
    },
    {
      name: "CBAM",
      description: "Carbon Border Adjustment Mechanism",
      status: "Not Applicable",
      badgeTone: "neutral",
      timeline: "No direct exposure",
    },
  ];

  const actionQueue: DashboardActionQueueVM[] = [];

  if (blockedShipments > 0) {
    actionQueue.push({
      id: "shipments",
      href: "/consignments",
      title: `Release blocked shipments (${blockedShipments})`,
      summary: "Resolve held consignments with missing evidence, chain gaps, or unresolved policy blockers.",
      tone: "error",
    });
  }

  if (gapRootChains + requestedRootChains + inProgressRootChains > 0) {
    actionQueue.push({
      id: "traceability",
      href: "/traceability",
      title: `Close traceability chain gaps (${gapRootChains + requestedRootChains + inProgressRootChains})`,
      summary: "Complete upstream path mapping, supplier responses, and missing provenance links.",
      tone: gapRootChains > 0 ? "error" : "warning",
    });
  }

  const supplierFollowUps = suppliers.filter((supplier) => supplier.onboardingStatus !== "APPROVED").length;
  if (supplierFollowUps > 0) {
    actionQueue.push({
      id: "suppliers",
      href: "/suppliers",
      title: `Advance supplier compliance (${supplierFollowUps})`,
      summary: "Follow up on onboarding, declarations, contracts, and direct supplier remediation tasks.",
      tone: "warning",
    });
  }

  if (requestedOrExpiredDocuments > 0) {
    actionQueue.push({
      id: "documents",
      href: "/documents",
      title: `Refresh evidence library (${requestedOrExpiredDocuments})`,
      summary: "Complete requested or expired documents before downstream release packages go stale.",
      tone: "info",
    });
  }

  const pendingProductReviews = products.filter(
    (product) => product.scopeStatus === "UNDER_CLASSIFICATION_REVIEW" || product.exportReadiness !== "READY",
  ).length;
  if (pendingProductReviews > 0) {
    actionQueue.push({
      id: "products",
      href: "/products",
      title: `Review product decision posture (${pendingProductReviews})`,
      summary: "Confirm formulation scope, ingredient evidence, and release-readiness for products under review.",
      tone: "neutral",
    });
  }

  const productPortfolioCounts = PRODUCT_POSTURE_ORDER.reduce<Record<string, number>>((acc, label) => {
    acc[label] = products.filter((product) => classifyProductPosture(product) === label).length;
    return acc;
  }, {});

  const ingredientRelevanceCounts = INGREDIENT_RELEVANCE_ORDER.reduce<Record<string, number>>((acc, label) => {
    const key =
      label === "In scope" ? "IN_SCOPE" : label === "Under review" ? "UNDER_REVIEW" : "OUT_OF_SCOPE";
    acc[label] = allIngredients.filter((ingredient) => ingredient.relevance === key).length;
    return acc;
  }, {});

  const shipmentReleaseCounts: Record<string, number> = {
    Ready: readyShipments,
    "Review required": reviewShipments,
    Blocked: blockedShipments,
  };

  const traceabilityCounts: Record<string, number> = {
    Complete: completeRootChains,
    "In progress": inProgressRootChains,
    Requested: requestedRootChains,
    "Gaps found": gapRootChains,
    Blocked: blockedRootChains,
  };

  const exportRoutes = consignments
    .map((consignment) => {
      const coordinates = EXPORT_LOCATION_COORDINATES[consignment.destination];
      if (!coordinates) {
        return null;
      }

      return {
        id: consignment.id,
        reference: consignment.reference,
        destination: consignment.destination,
        country: consignment.country ?? consignment.destination.split(",").at(-1)?.trim() ?? "Unknown",
        coordinates,
        gateStatus: consignment.gateStatus,
        shipmentMode: consignment.shipmentMode,
        cargoLabel: getCargoLabel(consignment),
        logisticsLabel: getLogisticsLabel(consignment),
        checkedByLabel:
          consignment.checkedByExport && consignment.checkedByExport !== "—"
            ? consignment.checkedByExport
            : "Pending export check",
        saleOrderLabel: getSaleOrderLabel(consignment),
        dispatchDateLabel: formatShipmentDate(consignment.dispatchDate),
        cartonLabel: formatCartonLabel(consignment.totalCartons),
        grossWeightLabel: formatGrossWeightLabel(consignment.grossWeightTons),
        containerLabel: getContainerLabel(consignment),
        traceabilityLabel: formatStatusLabel(consignment.traceabilityStatus),
        outputEligibilityLabel: formatStatusLabel(consignment.outputEligibility),
        nextAction: consignment.nextAction,
        routeTone: getRouteTone(consignment.gateStatus),
      } satisfies DashboardExportRouteVM;
    })
    .filter((route): route is DashboardExportRouteVM => route !== null);

  const checkedRoutes = exportRoutes.filter((route) => route.checkedByLabel !== "Pending export check").length;
  const routeModes = Array.from(new Set(exportRoutes.map((route) => route.logisticsLabel)));
  const europeanRoutes = consignments.filter((consignment) => getDestinationMarketGroup(consignment) === "Europe").length;
  const nonEuropeanRoutes = consignments.length - europeanRoutes;
  const exportCountries = (() => {
    const grouped = new Map<
      string,
      DashboardExportCountryVM & {
        shipments: Array<DashboardExportCountryShipmentVM & { parsedDateValue: number; coordinates: [number, number] }>;
      }
    >();

    consignments.forEach((consignment) => {
      const coordinates = EXPORT_LOCATION_COORDINATES[consignment.destination];
      if (!coordinates) {
        return;
      }

      const shipmentStatus = getShipmentStatus(consignment);
      const parsedDate = parseDispatchDate(consignment.dispatchDate);
      const shipment = {
        id: consignment.id,
        reference: consignment.reference,
        destination: consignment.destination,
        country: consignment.country ?? consignment.destination.split(",").at(-1)?.trim() ?? "Unknown",
        shipmentStatus,
        gateStatus: consignment.gateStatus,
        shipmentMode: consignment.shipmentMode,
        cargoLabel: getCargoLabel(consignment),
        logisticsLabel: getLogisticsLabel(consignment),
        saleOrderLabel: getSaleOrderLabel(consignment),
        dispatchDateLabel: formatShipmentDate(consignment.dispatchDate),
        dispatchMonthLabel: formatDispatchMonth(parsedDate),
        timelineGroupLabel: formatDispatchMonth(parsedDate),
        cartonLabel: formatCartonLabel(consignment.totalCartons),
        grossWeightLabel: formatGrossWeightLabel(consignment.grossWeightTons),
        containerLabel: getContainerLabel(consignment),
        quantitySummaryLabel: getQuantitySummaryLabel(consignment),
        productBreakdown: getProductBreakdown(consignment),
        nextAction: consignment.nextAction,
        shipmentTone: getShipmentTone(shipmentStatus),
        parsedDateValue: parsedDate?.getTime() ?? Number.MAX_SAFE_INTEGER,
        coordinates,
      } satisfies DashboardExportCountryShipmentVM & { parsedDateValue: number; coordinates: [number, number] };

      const existing = grouped.get(shipment.country);
      if (!existing) {
        grouped.set(shipment.country, {
          id: `country-${shipment.country.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          country: shipment.country,
          coordinates: shipment.coordinates,
          shipmentCount: 1,
          statusCounts: {
            shipped: shipment.shipmentStatus === "SHIPPED" ? 1 : 0,
            inTransit: shipment.shipmentStatus === "IN_TRANSIT" ? 1 : 0,
            toBeShipped: shipment.shipmentStatus === "TO_BE_SHIPPED" ? 1 : 0,
          },
          countryTone: shipment.shipmentTone,
          shipments: [shipment],
        });
        return;
      }

      existing.coordinates = [
        Number(((existing.coordinates[0] * existing.shipmentCount + shipment.coordinates[0]) / (existing.shipmentCount + 1)).toFixed(4)),
        Number(((existing.coordinates[1] * existing.shipmentCount + shipment.coordinates[1]) / (existing.shipmentCount + 1)).toFixed(4)),
      ];
      existing.shipmentCount += 1;
      existing.statusCounts.shipped += shipment.shipmentStatus === "SHIPPED" ? 1 : 0;
      existing.statusCounts.inTransit += shipment.shipmentStatus === "IN_TRANSIT" ? 1 : 0;
      existing.statusCounts.toBeShipped += shipment.shipmentStatus === "TO_BE_SHIPPED" ? 1 : 0;
      existing.shipments.push(shipment);
    });

    return [...grouped.values()]
      .map((country) => ({
        ...country,
        countryTone:
          country.statusCounts.inTransit > 0
            ? ("current" as StatusTone)
            : country.statusCounts.toBeShipped > 0
              ? ("pending" as StatusTone)
              : ("ready" as StatusTone),
        shipments: country.shipments
          .sort((a, b) => {
            const aDate = a.parsedDateValue ?? Number.MAX_SAFE_INTEGER;
            const bDate = b.parsedDateValue ?? Number.MAX_SAFE_INTEGER;

            if (aDate !== bDate) {
              return aDate - bDate;
            }

            return a.reference.localeCompare(b.reference);
          })
          .map(({ parsedDateValue: _parsedDateValue, coordinates: _coordinates, ...shipment }) => shipment),
      }))
      .sort((a, b) => {
        if (b.shipmentCount !== a.shipmentCount) {
          return b.shipmentCount - a.shipmentCount;
        }

        return a.country.localeCompare(b.country);
      });
  })();

  return {
    metrics: [
      {
        id: "products",
        label: "Total Products",
        value: formatInteger(products.length),
        progressLabel: `${formatPercent(readyProducts, products.length)}% ready`,
        progressValue: formatPercent(readyProducts, products.length),
        breakdown: products.map((product) => ({
          label: product.name,
          tone: classifyProductPosture(product) === "Ready" ? "ready" : "neutral",
          emphasis: "text",
        })),
      },
      {
        id: "suppliers",
        label: "Total Suppliers",
        value: "13",
        progressLabel: "3 approved (EUDR)",
        progressValue: 100,
        breakdown: [
          { label: "Karachi", value: "3", tone: "ready", emphasis: "count" },
          { label: "Lahore", value: "3", tone: "ready", emphasis: "count" },
          { label: "Faisalabad", value: "2", tone: "ready", emphasis: "count" },
          { label: "Layyah", value: "1", tone: "neutral", emphasis: "count" },
          { label: "Gujranwala", value: "1", tone: "neutral", emphasis: "count" },
          { label: "Port Klang", value: "1", tone: "ready", emphasis: "count" },
          { label: "Johor Bahru", value: "1", tone: "neutral", emphasis: "count" },
          { label: "Surabaya", value: "1", tone: "neutral", emphasis: "count" },
        ],
      },
      {
        id: "shipments",
        label: "Total Consignments",
        value: formatInteger(consignments.length),
        progressLabel: `${formatPercent(europeanRoutes, consignments.length)}% Europe / ${formatPercent(
          nonEuropeanRoutes,
          consignments.length,
        )}% non-Europe`,
        progressValue: formatPercent(europeanRoutes, consignments.length),
        breakdown: buildSortedBreakdownMap(
          consignments.map((consignment) => getDestinationMarketGroup(consignment)),
          {
            order: ["Europe", "Gulf", "Other markets"],
          toneMap: {
              Europe: "ready",
              Gulf: "under_review",
              "Other markets": "neutral",
            },
          },
        ),
      },
      {
        id: "volume",
        label: "Export Volume",
        value: `${formatInteger(annualExportVolume)} tons`,
        progressLabel: `${formatInteger(exportProducts.length)} export-active products`,
        progressValue: formatPercent(
          exportProducts.length,
          products.length,
        ),
        breakdown: exportMarketBreakdown,
      },
      {
        id: "ingredients",
        label: "Total Ingredients",
        value: formatInteger(allIngredients.length),
        progressLabel: `${formatPercent(complianceRelevantIngredients, allIngredients.length)}% active focus`,
        progressValue: formatPercent(complianceRelevantIngredients, allIngredients.length),
        breakdown: buildSortedBreakdownMap(allIngredients.map((ingredient) => ingredient.relevance), {
          order: ["IN_SCOPE", "UNDER_REVIEW", "OUT_OF_SCOPE"],
          labelMap: {
            IN_SCOPE: "In scope",
            UNDER_REVIEW: "Under review",
            OUT_OF_SCOPE: "Out of scope",
          },
          toneMap: {
            IN_SCOPE: "ready",
            UNDER_REVIEW: "under_review",
            OUT_OF_SCOPE: "neutral",
          },
        }),
      },
    ],
    uniqueMarketsCount,
    uniqueSupplierCountriesCount,
    openHighPriorityBlockers,
    openActionItems: actionQueue.length,
    productPortfolioChart: buildChartData(PRODUCT_POSTURE_ORDER, productPortfolioCounts, PRODUCT_POSTURE_TONES),
    supplierRiskChart,
    shipmentReleaseChart: buildChartData(SHIPMENT_RELEASE_ORDER, shipmentReleaseCounts, SHIPMENT_RELEASE_TONES),
    traceabilityHealthChart: buildChartData(
      TRACEABILITY_HEALTH_ORDER,
      traceabilityCounts,
      TRACEABILITY_HEALTH_TONES,
    ),
    commodityMix: getCommodityMix(products),
    riskPillarScores,
    auditFindings,
    complianceFrameworks,
    actionQueue,
    blockers,
    supplierResponseSummary: {
      pending: supplierRequests.filter((request) => request.submissionStatus === "PENDING_RESPONSE").length,
      inProgress: supplierRequests.filter((request) => request.submissionStatus === "IN_PROGRESS").length,
      underReview: supplierRequests.filter(
        (request) => request.submissionStatus === "UNDER_REVIEW" || request.submissionStatus === "CHANGES_REQUESTED",
      ).length,
      closed: supplierRequests.filter((request) => request.submissionStatus === "CLOSED").length,
    },
    reportSummary: {
      current: reports.filter((report) => report.status === "CURRENT").length,
      draft: reports.filter((report) => report.status === "DRAFT").length,
    },
    complianceDocuments,
    evidenceGapHeatmap,
    expiringEvidenceRisk,
    supplierTraceabilityStatus,
    traceabilityGapCategories,
    exportMap: {
      origin: {
        name: "Karachi, Pakistan",
        shortLabel: "Karachi, PK",
        coordinates: EXPORT_LOCATION_COORDINATES["Karachi, Pakistan"],
      },
      activeCountryCount: exportCountries.length,
      statusSummary: {
        shipped: consignments.filter((consignment) => getShipmentStatus(consignment) === "SHIPPED").length,
        inTransit: consignments.filter((consignment) => getShipmentStatus(consignment) === "IN_TRANSIT").length,
        toBeShipped: consignments.filter((consignment) => getShipmentStatus(consignment) === "TO_BE_SHIPPED").length,
      },
      countries: exportCountries,
    },
  };
}
