import type { ConsignmentRecord, DocumentRecord, ProductRecord, SupplierRecord } from "@/lib/gfi-dummy-data";

export type OnSiteTraceabilityStatus = "COMPLETE" | "REVIEW_REQUIRED" | "BLOCKED" | "NOT_APPLICABLE";

export type OnSiteStageId = "receiving" | "quality" | "storage" | "production" | "finished_goods" | "dispatch";

export type OnSiteStageThemeId = "teal" | "emerald" | "blue" | "amber" | "violet" | "rose";

export interface OnSiteStageTheme {
  id: OnSiteStageThemeId;
  color: string;
  softBg: string;
  borderColor: string;
  glowColor: string;
  iconBg: string;
}

export const STAGE_THEME_MAP: Record<OnSiteStageId, OnSiteStageThemeId> = {
  receiving: "teal",
  quality: "emerald",
  storage: "blue",
  production: "amber",
  finished_goods: "violet",
  dispatch: "rose",
};

export const STAGE_THEMES: Record<OnSiteStageThemeId, OnSiteStageTheme> = {
  teal:    { id: "teal",    color: "hsl(172, 66%, 40%)", softBg: "hsla(172, 66%, 40%, 0.06)", borderColor: "hsla(172, 66%, 40%, 0.25)", glowColor: "hsla(172, 66%, 40%, 0.35)", iconBg: "hsla(172, 66%, 40%, 0.12)" },
  emerald: { id: "emerald", color: "hsl(152, 68%, 40%)", softBg: "hsla(152, 68%, 40%, 0.06)", borderColor: "hsla(152, 68%, 40%, 0.25)", glowColor: "hsla(152, 68%, 40%, 0.35)", iconBg: "hsla(152, 68%, 40%, 0.12)" },
  blue:    { id: "blue",    color: "hsl(217, 72%, 55%)", softBg: "hsla(217, 72%, 55%, 0.06)", borderColor: "hsla(217, 72%, 55%, 0.25)", glowColor: "hsla(217, 72%, 55%, 0.35)", iconBg: "hsla(217, 72%, 55%, 0.12)" },
  amber:   { id: "amber",   color: "hsl(38, 92%, 50%)",  softBg: "hsla(38, 92%, 50%, 0.06)",  borderColor: "hsla(38, 92%, 50%, 0.25)",  glowColor: "hsla(38, 92%, 50%, 0.35)",  iconBg: "hsla(38, 92%, 50%, 0.12)" },
  violet:  { id: "violet",  color: "hsl(263, 60%, 55%)", softBg: "hsla(263, 60%, 55%, 0.06)", borderColor: "hsla(263, 60%, 55%, 0.25)", glowColor: "hsla(263, 60%, 55%, 0.35)", iconBg: "hsla(263, 60%, 55%, 0.12)" },
  rose:    { id: "rose",    color: "hsl(350, 75%, 55%)", softBg: "hsla(350, 75%, 55%, 0.06)", borderColor: "hsla(350, 75%, 55%, 0.25)", glowColor: "hsla(350, 75%, 55%, 0.35)", iconBg: "hsla(350, 75%, 55%, 0.12)" },
};

export type OnSiteNodeRole = "input" | "process" | "output" | "shipment";

export type OnSiteMovementType = "receipt" | "storage" | "consumption" | "transformation" | "packing" | "shipment";

export type OnSiteEventType =
  | "RECEIVED"
  | "QA_RELEASED"
  | "WAREHOUSED"
  | "TRANSFERRED"
  | "CONSUMED"
  | "TRANSFORMED"
  | "PACKED"
  | "STORED_FINISHED"
  | "ALLOCATED"
  | "SHIPPED";

export interface OnSiteIngredientLot {
  id: string;
  lotCode: string;
  supplierId: string;
  productId: string;
  ingredientId: string;
  ingredientName: string;
  hsCode: string;
  commodity: "PALM" | "COCOA" | "NONE";
  relevance: "EUDR_RELEVANT" | "NON_EUDR";
  cocModel: "SG" | "IP" | "MB" | "NOT_DECLARED" | "NOT_APPLICABLE";
  invoiceRef: string;
  deliveryNoteRef: string;
  grnRef: string;
  quantity: number;
  unit: string;
  receiptDate: string;
  warehouseLocation: string;
  qaStatus: "RELEASED" | "HOLD" | "REVIEW";
}

export interface ProductionBatch {
  id: string;
  batchCode: string;
  productId: string;
  bomRevision: string;
  productionLine: string;
  producedAt: string;
  outputQuantity: number;
  unit: string;
  qaStatus: "RELEASED" | "HOLD" | "REVIEW";
}

export interface BatchInput {
  id: string;
  lotId: string;
  batchId: string;
  ingredientId: string;
  consumedQuantity: number;
  expectedQuantity: number;
  unit: string;
}

export interface FinishedGoodsLot {
  id: string;
  lotCode: string;
  batchId: string;
  productId: string;
  sku: string;
  quantity: number;
  unit: string;
  stockState: "AVAILABLE" | "ALLOCATED" | "HELD";
}

export interface ConsignmentAllocation {
  id: string;
  finishedGoodsLotId: string;
  consignmentId: string;
  allocatedQuantity: number;
  unit: string;
}

export interface OnSiteTraceabilityEvent {
  id: string;
  eventType: OnSiteEventType;
  lotId?: string;
  batchId?: string;
  finishedGoodsLotId?: string;
  consignmentId?: string;
  occurredAt: string;
  location: string;
  status: OnSiteTraceabilityStatus;
  title: string;
  summary: string;
}

export interface TraceabilityEvidenceLink {
  id: string;
  eventId: string;
  evidenceType:
    | "INVOICE"
    | "DELIVERY_NOTE"
    | "GRN"
    | "BATCH_SHEET"
    | "QA_RELEASE"
    | "PACKING_RECORD"
    | "EXPORT_INVOICE"
    | "BILL_OF_LADING"
    | "COC_PROOF";
  label: string;
  documentId?: string;
  status: "ATTACHED" | "MISSING" | "REVIEW_REQUIRED" | "NOT_APPLICABLE";
}

export interface OnSiteJourneyNode {
  id: string;
  stage: string;
  stageId: OnSiteStageId;
  stageLabel: string;
  stageThemeId: OnSiteStageThemeId;
  stepNumber: number;
  recordRef: string;
  timestamp: string;
  nodeRole: OnSiteNodeRole;
  eventType: OnSiteEventType;
  title: string;
  subtitle: string;
  quantity: string;
  status: OnSiteTraceabilityStatus;
  evidenceComplete: number;
  x: number;
  y: number;
}

export interface OnSiteJourneyEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  status: OnSiteTraceabilityStatus;
  movementType: OnSiteMovementType;
  quantityLabel: string;
  varianceLabel?: string;
}

export interface OnSiteJourneyStage {
  id: OnSiteStageId;
  label: string;
  shortLabel: string;
  description: string;
  status: OnSiteTraceabilityStatus;
  x: number;
  width: number;
}

export interface OnSiteGap {
  id: string;
  severity: "WARNING" | "HIGH" | "CRITICAL";
  title: string;
  source: string;
  status: OnSiteTraceabilityStatus;
}

export interface OnSiteEvidenceMatrixRow {
  eventId: string;
  eventTitle: string;
  eventType: OnSiteEventType;
  status: OnSiteTraceabilityStatus;
  evidence: TraceabilityEvidenceLink[];
}

export interface OnSiteTraceabilityViewModel {
  lots: OnSiteIngredientLot[];
  productionBatches: ProductionBatch[];
  finishedGoodsLots: FinishedGoodsLot[];
  consignments: ConsignmentRecord[];
  journeyOptions: Array<{
    id: string;
    label: string;
    productName: string;
    ingredientName: string;
    status: OnSiteTraceabilityStatus;
    routeSummary: string;
    evidenceSummary: string;
    relevance: OnSiteIngredientLot["relevance"];
  }>;
  selectedJourney: {
    lot: OnSiteIngredientLot;
    productName: string;
    supplierName: string;
    productionBatchReference: string;
    finishedGoodsReference: string;
    consignmentReference: string;
    status: OnSiteTraceabilityStatus;
  } | null;
  stages: OnSiteJourneyStage[];
  nodes: OnSiteJourneyNode[];
  edges: OnSiteJourneyEdge[];
  evidenceRows: OnSiteEvidenceMatrixRow[];
  gaps: OnSiteGap[];
  kpis: Array<{ label: string; value: string; helper: string; status: OnSiteTraceabilityStatus }>;
}

export const onSiteIngredientLots: OnSiteIngredientLot[] = [
  {
    id: "lot-cargill-palm-0426",
    lotCode: "CARGILL-PALM-SG-0426",
    supplierId: "sup-cargill",
    productId: "prd-chew",
    ingredientId: "ing-chew-palm",
    ingredientName: "Non Hydrogenated Vegetable Fat (Palm)",
    hsCode: "151329",
    commodity: "PALM",
    relevance: "EUDR_RELEVANT",
    cocModel: "SG",
    invoiceRef: "INV-CAR-2026-0418",
    deliveryNoteRef: "DN-CAR-2026-0418",
    grnRef: "GRN-GFI-2026-0781",
    quantity: 1200,
    unit: "kg",
    receiptDate: "2026-04-11",
    warehouseLocation: "Palm oil tank / RSPO labeled bay",
    qaStatus: "RELEASED",
  },
  {
    id: "lot-jb-cocoa-0526",
    lotCode: "JB-COCOA-1805-0526",
    supplierId: "sup-jb-cocoa",
    productId: "prd-chocolate",
    ingredientId: "ing-choc-cocoa-natural",
    ingredientName: "Natural cocoa powder",
    hsCode: "180500",
    commodity: "COCOA",
    relevance: "EUDR_RELEVANT",
    cocModel: "NOT_DECLARED",
    invoiceRef: "INV-JB-2026-0502",
    deliveryNoteRef: "DN-JB-2026-0502",
    grnRef: "GRN-GFI-2026-0814",
    quantity: 900,
    unit: "kg",
    receiptDate: "2026-05-02",
    warehouseLocation: "Dry ingredients area / cocoa rack",
    qaStatus: "REVIEW",
  },
  {
    id: "lot-sugar-local-0426",
    lotCode: "PK-SUGAR-0426",
    supplierId: "sup-brothers",
    productId: "prd-chew",
    ingredientId: "ing-chew-sugar",
    ingredientName: "Sugar",
    hsCode: "170199",
    commodity: "NONE",
    relevance: "NON_EUDR",
    cocModel: "NOT_APPLICABLE",
    invoiceRef: "INV-BRO-2026-0412",
    deliveryNoteRef: "DN-BRO-2026-0412",
    grnRef: "GRN-GFI-2026-0769",
    quantity: 1800,
    unit: "kg",
    receiptDate: "2026-04-12",
    warehouseLocation: "Bulk dry store / bay 3",
    qaStatus: "RELEASED",
  },
];

export const onSiteProductionBatches: ProductionBatch[] = [
  {
    id: "batch-chew-23036",
    batchCode: "23036WCBST28",
    productId: "prd-chew",
    bomRevision: "BOM-CHW-2026-R3",
    productionLine: "Chew wrapping line",
    producedAt: "2026-04-13T16:52:00",
    outputQuantity: 44.5,
    unit: "kg",
    qaStatus: "RELEASED",
  },
  {
    id: "batch-choc-0526",
    batchCode: "CHOC-EU-PILOT-0526",
    productId: "prd-chocolate",
    bomRevision: "BOM-CHOC-2026-R2",
    productionLine: "Chocolate moulding line",
    producedAt: "2026-05-08T10:30:00",
    outputQuantity: 62,
    unit: "kg",
    qaStatus: "HOLD",
  },
];

export const onSiteBatchInputs: BatchInput[] = [
  { id: "input-chew-palm", lotId: "lot-cargill-palm-0426", batchId: "batch-chew-23036", ingredientId: "ing-chew-palm", consumedQuantity: 1.5, expectedQuantity: 1.45, unit: "kg" },
  { id: "input-chew-sugar", lotId: "lot-sugar-local-0426", batchId: "batch-chew-23036", ingredientId: "ing-chew-sugar", consumedQuantity: 15, expectedQuantity: 14.9, unit: "kg" },
  { id: "input-choc-cocoa", lotId: "lot-jb-cocoa-0526", batchId: "batch-choc-0526", ingredientId: "ing-choc-cocoa-natural", consumedQuantity: 3.6, expectedQuantity: 3.62, unit: "kg" },
];

export const onSiteFinishedGoodsLots: FinishedGoodsLot[] = [
  { id: "fg-chew-23036", lotCode: "FG-CHEW-23036", batchId: "batch-chew-23036", productId: "prd-chew", sku: "Whacky Chew Wrapped Batch", quantity: 44.5, unit: "kg", stockState: "ALLOCATED" },
  { id: "fg-choc-0526", lotCode: "FG-CHOC-0526", batchId: "batch-choc-0526", productId: "prd-chocolate", sku: "Chocolate export pilot", quantity: 62, unit: "kg", stockState: "HELD" },
];

export const onSiteConsignmentAllocations: ConsignmentAllocation[] = [
  { id: "alloc-chew-002", finishedGoodsLotId: "fg-chew-23036", consignmentId: "con-chew-002", allocatedQuantity: 44.5, unit: "kg" },
  { id: "alloc-choc-003", finishedGoodsLotId: "fg-choc-0526", consignmentId: "con-choc-003", allocatedQuantity: 62, unit: "kg" },
];

export const onSiteEvents: OnSiteTraceabilityEvent[] = [
  { id: "evt-palm-received", eventType: "RECEIVED", lotId: "lot-cargill-palm-0426", occurredAt: "2026-04-11T09:10:00", location: "GFI receiving dock", status: "REVIEW_REQUIRED", title: "Supplier delivery received", summary: "Cargill palm lot received and matched to GFI GRN." },
  { id: "evt-palm-qa", eventType: "QA_RELEASED", lotId: "lot-cargill-palm-0426", occurredAt: "2026-04-11T11:20:00", location: "Quality office", status: "COMPLETE", title: "QA released ingredient lot", summary: "MSDS and RSPO certificate context reviewed; transaction CoC still needs delivery-note confirmation." },
  { id: "evt-palm-storage", eventType: "WAREHOUSED", lotId: "lot-cargill-palm-0426", occurredAt: "2026-04-11T13:40:00", location: "Palm oil tank / RSPO bay", status: "COMPLETE", title: "Stored in labeled palm bay", summary: "Lot stored in a dedicated RSPO-labeled bay." },
  { id: "evt-palm-consumed", eventType: "CONSUMED", lotId: "lot-cargill-palm-0426", batchId: "batch-chew-23036", occurredAt: "2026-04-13T16:52:00", location: "Chew production line", status: "COMPLETE", title: "Consumed in Chew batch", summary: "Production batch sheet records palm fat consumption." },
  { id: "evt-chew-transformed", eventType: "TRANSFORMED", batchId: "batch-chew-23036", occurredAt: "2026-04-13T17:30:00", location: "Chew production line", status: "COMPLETE", title: "Finished batch produced", summary: "Finished Chew batch produced from recorded ingredient inputs." },
  { id: "evt-chew-packed", eventType: "PACKED", batchId: "batch-chew-23036", finishedGoodsLotId: "fg-chew-23036", occurredAt: "2026-04-13T18:15:00", location: "Packing line", status: "COMPLETE", title: "Packed as finished goods", summary: "Finished batch packed and labeled with batch reference." },
  { id: "evt-chew-shipped", eventType: "SHIPPED", finishedGoodsLotId: "fg-chew-23036", consignmentId: "con-chew-002", occurredAt: "2026-05-20T08:00:00", location: "Export dispatch", status: "REVIEW_REQUIRED", title: "Allocated to export consignment", summary: "Consignment is traceable; release depends on palm scope and transaction CoC review." },
  { id: "evt-cocoa-received", eventType: "RECEIVED", lotId: "lot-jb-cocoa-0526", occurredAt: "2026-05-02T10:15:00", location: "GFI receiving dock", status: "BLOCKED", title: "Cocoa lot received", summary: "Lot received, but CoC and geolocation evidence are not accepted." },
  { id: "evt-cocoa-storage", eventType: "WAREHOUSED", lotId: "lot-jb-cocoa-0526", occurredAt: "2026-05-02T12:10:00", location: "Dry ingredients area", status: "REVIEW_REQUIRED", title: "Stored in cocoa rack", summary: "Batch label visible, origin evidence remains unresolved." },
  { id: "evt-cocoa-consumed", eventType: "CONSUMED", lotId: "lot-jb-cocoa-0526", batchId: "batch-choc-0526", occurredAt: "2026-05-08T10:30:00", location: "Chocolate production line", status: "BLOCKED", title: "Consumed in chocolate batch", summary: "Batch usage exists but compliance evidence is incomplete." },
  { id: "evt-choc-transformed", eventType: "TRANSFORMED", batchId: "batch-choc-0526", occurredAt: "2026-05-08T11:30:00", location: "Chocolate moulding line", status: "BLOCKED", title: "Chocolate batch produced", summary: "Finished batch held because cocoa origin package is incomplete." },
  { id: "evt-choc-shipped", eventType: "ALLOCATED", finishedGoodsLotId: "fg-choc-0526", consignmentId: "con-choc-003", occurredAt: "2026-05-28T09:00:00", location: "Finished goods warehouse", status: "BLOCKED", title: "Held for future consignment", summary: "Allocation exists, but release is blocked by cocoa provenance gaps." },
  { id: "evt-sugar-received", eventType: "RECEIVED", lotId: "lot-sugar-local-0426", occurredAt: "2026-04-12T08:35:00", location: "GFI receiving dock", status: "NOT_APPLICABLE", title: "Non-EUDR sugar received", summary: "Sugar lot is internally traceable with no EUDR program requirement." },
  { id: "evt-sugar-consumed", eventType: "CONSUMED", lotId: "lot-sugar-local-0426", batchId: "batch-chew-23036", occurredAt: "2026-04-13T16:52:00", location: "Chew production line", status: "NOT_APPLICABLE", title: "Sugar consumed in Chew batch", summary: "Consumption captured in production batch record." },
];

export const onSiteEvidenceLinks: TraceabilityEvidenceLink[] = [
  { id: "ev-palm-invoice", eventId: "evt-palm-received", evidenceType: "INVOICE", label: "Cargill purchase invoice", status: "ATTACHED" },
  { id: "ev-palm-dn", eventId: "evt-palm-received", evidenceType: "DELIVERY_NOTE", label: "Delivery note with SG CoC", status: "REVIEW_REQUIRED" },
  { id: "ev-palm-grn", eventId: "evt-palm-received", evidenceType: "GRN", label: "GFI goods receipt note", status: "ATTACHED" },
  { id: "ev-palm-coc", eventId: "evt-palm-qa", evidenceType: "COC_PROOF", label: "MSDS/RSPO context", status: "REVIEW_REQUIRED" },
  { id: "ev-palm-batch", eventId: "evt-palm-consumed", evidenceType: "BATCH_SHEET", label: "Chew production batch sheet", status: "ATTACHED" },
  { id: "ev-chew-pack", eventId: "evt-chew-packed", evidenceType: "PACKING_RECORD", label: "Packing and finished lot label", status: "ATTACHED" },
  { id: "ev-chew-export", eventId: "evt-chew-shipped", evidenceType: "EXPORT_INVOICE", label: "Chew export invoice", status: "ATTACHED" },
  { id: "ev-cocoa-invoice", eventId: "evt-cocoa-received", evidenceType: "INVOICE", label: "JB Cocoa invoice", status: "ATTACHED" },
  { id: "ev-cocoa-coc", eventId: "evt-cocoa-received", evidenceType: "COC_PROOF", label: "Cocoa CoC declaration", status: "MISSING" },
  { id: "ev-cocoa-grn", eventId: "evt-cocoa-received", evidenceType: "GRN", label: "GFI cocoa GRN", status: "ATTACHED" },
  { id: "ev-cocoa-batch", eventId: "evt-cocoa-consumed", evidenceType: "BATCH_SHEET", label: "Chocolate production batch sheet", status: "ATTACHED" },
  { id: "ev-choc-export", eventId: "evt-choc-shipped", evidenceType: "EXPORT_INVOICE", label: "Future chocolate export pack", status: "MISSING" },
  { id: "ev-sugar-grn", eventId: "evt-sugar-received", evidenceType: "GRN", label: "Sugar GRN", status: "ATTACHED" },
  { id: "ev-sugar-batch", eventId: "evt-sugar-consumed", evidenceType: "BATCH_SHEET", label: "Chew production batch sheet", status: "ATTACHED" },
];

const STAGE_DEFINITIONS: Array<Omit<OnSiteJourneyStage, "status">> = [
  {
    id: "receiving",
    label: "Receiving",
    shortLabel: "Received",
    description: "Supplier delivery, invoice, delivery note, and GRN intake.",
    x: 0,
    width: 210,
  },
  {
    id: "quality",
    label: "Quality",
    shortLabel: "Verified",
    description: "QA release and compliance evidence review.",
    x: 248,
    width: 210,
  },
  {
    id: "storage",
    label: "Storage",
    shortLabel: "Stored",
    description: "Warehouse location, segregation, and internal stock control.",
    x: 496,
    width: 210,
  },
  {
    id: "production",
    label: "Production",
    shortLabel: "Produced",
    description: "Ingredient consumption, transformation, and batch output.",
    x: 744,
    width: 210,
  },
  {
    id: "finished_goods",
    label: "Finished Goods",
    shortLabel: "Packed",
    description: "Packed finished lot and stock state.",
    x: 992,
    width: 210,
  },
  {
    id: "dispatch",
    label: "Dispatch",
    shortLabel: "Shipped",
    description: "Consignment allocation, release checks, and export evidence.",
    x: 1240,
    width: 210,
  },
];

function statusRank(statuses: OnSiteTraceabilityStatus[]): OnSiteTraceabilityStatus {
  if (statuses.includes("BLOCKED")) return "BLOCKED";
  if (statuses.includes("REVIEW_REQUIRED")) return "REVIEW_REQUIRED";
  if (statuses.every((status) => status === "NOT_APPLICABLE")) return "NOT_APPLICABLE";
  return "COMPLETE";
}

function stageForEvent(eventType: OnSiteEventType): OnSiteStageId {
  if (eventType === "RECEIVED") return "receiving";
  if (eventType === "QA_RELEASED") return "quality";
  if (eventType === "WAREHOUSED" || eventType === "TRANSFERRED") return "storage";
  if (eventType === "CONSUMED" || eventType === "TRANSFORMED") return "production";
  if (eventType === "PACKED" || eventType === "STORED_FINISHED") return "finished_goods";
  return "dispatch";
}

function roleForEvent(eventType: OnSiteEventType): OnSiteNodeRole {
  if (eventType === "CONSUMED") return "input";
  if (eventType === "TRANSFORMED") return "process";
  if (eventType === "PACKED" || eventType === "STORED_FINISHED") return "output";
  if (eventType === "ALLOCATED" || eventType === "SHIPPED") return "shipment";
  return "input";
}

function movementForEdge(sourceType: OnSiteEventType, targetType: OnSiteEventType): OnSiteMovementType {
  if (targetType === "QA_RELEASED" || sourceType === "RECEIVED") return "receipt";
  if (targetType === "WAREHOUSED" || targetType === "TRANSFERRED") return "storage";
  if (targetType === "CONSUMED") return "consumption";
  if (targetType === "TRANSFORMED") return "transformation";
  if (targetType === "PACKED" || targetType === "STORED_FINISHED") return "packing";
  return "shipment";
}

function eventTitle(event: OnSiteTraceabilityEvent): string {
  const titles: Record<OnSiteEventType, string> = {
    RECEIVED: "Delivery Received",
    QA_RELEASED: "QA Released",
    WAREHOUSED: "Stored / Segregated",
    TRANSFERRED: "Internal Transfer",
    CONSUMED: "Consumed in Batch",
    TRANSFORMED: "Finished Batch Created",
    PACKED: "Packed",
    STORED_FINISHED: "Finished Goods Stored",
    ALLOCATED: "Allocated to Consignment",
    SHIPPED: "Dispatched",
  };

  return titles[event.eventType];
}

function resolveRecordRef(event: OnSiteTraceabilityEvent): string {
  if (event.lotId && event.eventType === "RECEIVED") {
    const lot = onSiteIngredientLots.find((item) => item.id === event.lotId);
    return lot?.grnRef || lot?.deliveryNoteRef || lot?.invoiceRef || event.lotId;
  }
  if (event.lotId && event.eventType === "QA_RELEASED") {
    const lot = onSiteIngredientLots.find((item) => item.id === event.lotId);
    return lot?.invoiceRef || lot?.lotCode || event.lotId;
  }
  if (event.lotId && (event.eventType === "WAREHOUSED" || event.eventType === "TRANSFERRED")) {
    const lot = onSiteIngredientLots.find((item) => item.id === event.lotId);
    return lot?.warehouseLocation || lot?.lotCode || event.lotId;
  }
  if (event.batchId) {
    const batch = onSiteProductionBatches.find((item) => item.id === event.batchId);
    if (batch) return batch.batchCode;
  }
  if (event.finishedGoodsLotId) {
    const lot = onSiteFinishedGoodsLots.find((item) => item.id === event.finishedGoodsLotId);
    if (lot) return lot.lotCode;
  }
  if (event.consignmentId) return event.consignmentId;
  return event.id;
}

function resolveVarianceLabel(event: OnSiteTraceabilityEvent): string | undefined {
  if (event.eventType !== "CONSUMED" || !event.batchId || !event.lotId) return undefined;
  const input = onSiteBatchInputs.find((item) => item.batchId === event.batchId && item.lotId === event.lotId);
  if (!input) return undefined;
  const variance = input.consumedQuantity - input.expectedQuantity;
  if (Math.abs(variance) < 0.01) return "On BOM";
  const sign = variance > 0 ? "+" : "";
  return `${sign}${variance.toFixed(2)} ${input.unit} vs BOM`;
}

function evidenceScore(eventId: string): number {
  const links = onSiteEvidenceLinks.filter((item) => item.eventId === eventId);
  if (links.length === 0) return 0;
  const attached = links.filter((item) => item.status === "ATTACHED" || item.status === "NOT_APPLICABLE").length;
  return Math.round((attached / links.length) * 100);
}

function formatQuantity(quantity: number, unit: string): string {
  return `${quantity.toLocaleString()} ${unit}`;
}

function productName(products: ProductRecord[], productId: string): string {
  return products.find((item) => item.id === productId)?.name ?? productId;
}

function supplierName(suppliers: SupplierRecord[], supplierId: string): string {
  return suppliers.find((item) => item.id === supplierId)?.name ?? supplierId;
}

export function buildOnSiteTraceabilityViewModel(input: {
  products: ProductRecord[];
  suppliers: SupplierRecord[];
  consignments: ConsignmentRecord[];
  documents: DocumentRecord[];
  selectedLotId?: string;
  statusFilter?: OnSiteTraceabilityStatus | "ALL";
  showOnlyGaps?: boolean;
}): OnSiteTraceabilityViewModel {
  const { products, suppliers, consignments, selectedLotId, statusFilter = "ALL", showOnlyGaps = false } = input;

  // Dynamically generate dummy on-site journeys for all other ingredients in the products list
  products.forEach((product) => {
    product.ingredients.forEach((ingredient) => {
      const lotId = `lot-dyn-${product.id}-${ingredient.id}`;
      // Check if a lot already exists for this product + ingredient
      const exists = onSiteIngredientLots.some((lot) => lot.id === lotId);
      if (exists) return;

      const prodCode = product.name.substring(0, 3).toUpperCase();
      const ingCode = ingredient.name.substring(0, 3).toUpperCase();
      const lotCode = `LOT-${prodCode}-${ingCode}-2026-R1`;
      const batchId = `batch-dyn-${product.id}`;
      const batchCode = `BAT-${prodCode}-001`;
      const fgLotId = `fg-dyn-${product.id}`;
      const fgLotCode = `FG-${prodCode}-001`;
      const allocId = `alloc-dyn-${product.id}-${ingredient.id}`;

      const linkConsignment = consignments.find((c) => {
        const lowerId = c.id.toLowerCase();
        if (product.id === "prd-chew") return lowerId.includes("chew");
        if (product.id === "prd-bubble-gum") return lowerId.includes("bubblegum");
        if (product.id === "prd-chocolate" || product.id === "prd-wafers") return lowerId.includes("choc");
        return false;
      }) || consignments[0] || { id: "con-choc-003", reference: "CON-CHOC-003", gateStatus: "READY" };

      const isEudr = ingredient.commodity !== "NONE" && (ingredient.commodity as string) !== "NONE / EXEMPT";
      const qaStatus = ingredient.readiness === "READY" ? "RELEASED" : (ingredient.readiness === "BLOCKED" ? "HOLD" : "REVIEW");
      const qaEventStatus = ingredient.readiness === "READY" ? "COMPLETE" : (ingredient.readiness === "BLOCKED" ? "BLOCKED" : "REVIEW_REQUIRED");

      // 1. Push Lot
      onSiteIngredientLots.push({
        id: lotId,
        lotCode,
        supplierId: ingredient.supplierIds?.[0] || "sup-unknown",
        productId: product.id,
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        hsCode: ingredient.hsCode,
        commodity: (ingredient.commodity === "PALM" ? "PALM" : (ingredient.commodity === "COCOA" ? "COCOA" : "NONE")),
        relevance: isEudr ? "EUDR_RELEVANT" : "NON_EUDR",
        cocModel: (ingredient.cocModel === "Not Applicable" ? "NOT_APPLICABLE" : (ingredient.cocModel as any || "SG")),
        invoiceRef: `INV-${prodCode}-${ingCode}-0510`,
        deliveryNoteRef: `DN-${prodCode}-${ingCode}-0510`,
        grnRef: `GRN-${prodCode}-${ingCode}-0799`,
        quantity: 1500,
        unit: "kg",
        receiptDate: "2026-05-10",
        warehouseLocation: `Storage Bay ${prodCode}-${ingCode}`,
        qaStatus,
      });

      // 2. Push Production Batch
      if (!onSiteProductionBatches.some((b) => b.id === batchId)) {
        onSiteProductionBatches.push({
          id: batchId,
          batchCode,
          productId: product.id,
          bomRevision: product.activeBomRevision,
          productionLine: "Blending Line B",
          producedAt: "2026-05-14",
          outputQuantity: 2500,
          unit: "kg",
          qaStatus: "RELEASED",
        });
      }

      // 3. Push Batch Input
      onSiteBatchInputs.push({
        id: `input-dyn-${product.id}-${ingredient.id}`,
        lotId,
        batchId,
        ingredientId: ingredient.id,
        consumedQuantity: 1500,
        expectedQuantity: 1500,
        unit: "kg",
      });

      // 4. Push Finished Goods Lot
      if (!onSiteFinishedGoodsLots.some((fg) => fg.id === fgLotId)) {
        onSiteFinishedGoodsLots.push({
          id: fgLotId,
          lotCode: fgLotCode,
          batchId,
          productId: product.id,
          sku: `SKU-${prodCode}-001`,
          quantity: 2500,
          unit: "kg",
          stockState: "AVAILABLE",
        });
      }

      // 5. Push Consignment Allocation
      if (!onSiteConsignmentAllocations.some((alloc) => alloc.finishedGoodsLotId === fgLotId && alloc.consignmentId === linkConsignment.id)) {
        onSiteConsignmentAllocations.push({
          id: allocId,
          finishedGoodsLotId: fgLotId,
          consignmentId: linkConsignment.id,
          allocatedQuantity: 2500,
          unit: "kg",
        });
      }

      // 6. Push Events
      const evtReceived = `evt-dyn-${product.id}-${ingredient.id}-received`;
      const evtQA = `evt-dyn-${product.id}-${ingredient.id}-qa`;
      const evtWarehouse = `evt-dyn-${product.id}-${ingredient.id}-warehouse`;
      const evtConsumed = `evt-dyn-${product.id}-${ingredient.id}-consumed`;
      const evtTransformed = `evt-dyn-${product.id}-${ingredient.id}-transformed`;
      const evtPacked = `evt-dyn-${product.id}-${ingredient.id}-packed`;
      const evtAllocated = `evt-dyn-${product.id}-${ingredient.id}-allocated`;
      const evtShipped = `evt-dyn-${product.id}-${ingredient.id}-shipped`;

      onSiteEvents.push(
        {
          id: evtReceived,
          eventType: "RECEIVED",
          lotId,
          occurredAt: "2026-05-10T09:30:00Z",
          location: "GFI Unloading Gate 2",
          status: "COMPLETE",
          title: "Raw Material Unloaded",
          summary: `Unloaded 1,500 kg of ${ingredient.name} from supplier.`,
        },
        {
          id: evtQA,
          eventType: "QA_RELEASED",
          lotId,
          occurredAt: "2026-05-11T10:00:00Z",
          location: "GFI QC Laboratory",
          status: qaEventStatus,
          title: ingredient.readiness === "READY" ? "QA Passed & Released" : "QA Hold - Review Required",
          summary: `Quality checks run on ${ingredient.name} lot.`,
        },
        {
          id: evtWarehouse,
          eventType: "WAREHOUSED",
          lotId,
          occurredAt: "2026-05-11T14:00:00Z",
          location: `Storage Area ${prodCode}`,
          status: "COMPLETE",
          title: "Moved to Warehouse",
          summary: `Ingredient batch logged into bay storage.`,
        },
        {
          id: evtConsumed,
          eventType: "CONSUMED",
          lotId,
          batchId,
          occurredAt: "2026-05-14T08:30:00Z",
          location: "Blending Section 3",
          status: "COMPLETE",
          title: "Charged to Blending",
          summary: `BOM intake of 1,500 kg registered for batch ${batchCode}.`,
        },
        {
          id: evtTransformed,
          eventType: "TRANSFORMED",
          batchId,
          occurredAt: "2026-05-14T16:00:00Z",
          location: "GFI Production Floor",
          status: "COMPLETE",
          title: "Batch Extracted",
          summary: `Formulation complete for batch ${batchCode}. Output transferred to packing queue.`,
        },
        {
          id: evtPacked,
          eventType: "PACKED",
          batchId,
          finishedGoodsLotId: fgLotId,
          occurredAt: "2026-05-15T11:00:00Z",
          location: "Packing Bay 1",
          status: "COMPLETE",
          title: "Packed into Finished Goods",
          summary: `Output packed into finished goods lot ${fgLotCode}.`,
        },
        {
          id: evtAllocated,
          eventType: "ALLOCATED",
          finishedGoodsLotId: fgLotId,
          consignmentId: linkConsignment.id,
          occurredAt: "2026-05-18T09:00:00Z",
          location: "Finished Goods Storage",
          status: "COMPLETE",
          title: "Allocated to Order",
          summary: `Allocated to consignment reference ${linkConsignment.reference}.`,
        },
        {
          id: evtShipped,
          eventType: "SHIPPED",
          consignmentId: linkConsignment.id,
          occurredAt: "2026-05-20T15:30:00Z",
          location: "Outbound Dock",
          status: linkConsignment.gateStatus === "READY" ? "COMPLETE" : "REVIEW_REQUIRED",
          title: "Dispatched from Port",
          summary: `Consignment reference ${linkConsignment.reference} cleared and loaded.`,
        }
      );

      // 7. Push Evidence Links
      onSiteEvidenceLinks.push(
        {
          id: `ev-dyn-${product.id}-${ingredient.id}-inv`,
          eventId: evtReceived,
          evidenceType: "INVOICE",
          label: "Commercial Invoice",
          status: "ATTACHED",
        },
        {
          id: `ev-dyn-${product.id}-${ingredient.id}-dn`,
          eventId: evtReceived,
          evidenceType: "DELIVERY_NOTE",
          label: "Delivery Note",
          status: "ATTACHED",
        },
        {
          id: `ev-dyn-${product.id}-${ingredient.id}-grn`,
          eventId: evtReceived,
          evidenceType: "GRN",
          label: "Goods Receipt Note",
          status: "ATTACHED",
        },
        {
          id: `ev-dyn-${product.id}-${ingredient.id}-qa-doc`,
          eventId: evtQA,
          evidenceType: "QA_RELEASE",
          label: "QA Lab Certificate",
          status: ingredient.readiness === "READY" ? "ATTACHED" : "REVIEW_REQUIRED",
        },
        {
          id: `ev-dyn-${product.id}-${ingredient.id}-batch-sheet`,
          eventId: evtConsumed,
          evidenceType: "BATCH_SHEET",
          label: "Production Sheet",
          status: "ATTACHED",
        }
      );

      if (isEudr) {
        onSiteEvidenceLinks.push({
          id: `ev-dyn-${product.id}-${ingredient.id}-coc`,
          eventId: evtReceived,
          evidenceType: "COC_PROOF",
          label: "Chain of Custody Proof",
          status: ingredient.readiness === "READY" ? "ATTACHED" : "MISSING",
        });
      }
    });
  });

  const selectedLot = onSiteIngredientLots.find((lot) => lot.id === selectedLotId) ?? onSiteIngredientLots[0] ?? null;
  const lotEvents = selectedLot ? onSiteEvents.filter((event) => event.lotId === selectedLot.id || relatedToLot(event, selectedLot.id)) : [];
  const filteredEvents = lotEvents.filter((event) => {
    const statusMatches = statusFilter === "ALL" || event.status === statusFilter;
    const gapMatches = !showOnlyGaps || event.status === "BLOCKED" || event.status === "REVIEW_REQUIRED";
    return statusMatches && gapMatches;
  }).sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  const selectedStatuses = lotEvents.map((event) => event.status);
  const selectedStatus = selectedLot ? statusRank(selectedStatuses) : "NOT_APPLICABLE";
  const gaps = buildGaps(selectedLot, lotEvents);
  const selectedBatchIds = new Set(lotEvents.map((event) => event.batchId).filter(Boolean) as string[]);
  const selectedFinishedLotIds = new Set(lotEvents.map((event) => event.finishedGoodsLotId).filter(Boolean) as string[]);
  const selectedConsignmentIds = new Set(lotEvents.map((event) => event.consignmentId).filter(Boolean) as string[]);
  const selectedConsignment = consignments.find((item) => selectedConsignmentIds.has(item.id));
  const selectedBatch = onSiteProductionBatches.find((batch) => selectedBatchIds.has(batch.id));
  const selectedFinishedLot = onSiteFinishedGoodsLots.find((lot) => selectedFinishedLotIds.has(lot.id));

  const stages = STAGE_DEFINITIONS.map<OnSiteJourneyStage>((stage) => {
    const stageEvents = lotEvents.filter((event) => stageForEvent(event.eventType) === stage.id);
    return {
      ...stage,
      status: stageEvents.length > 0 ? statusRank(stageEvents.map((event) => event.status)) : "NOT_APPLICABLE",
    };
  });

  const stageOffsets = new Map<OnSiteStageId, number>();
  const nodes = filteredEvents.map<OnSiteJourneyNode>((event, index) => {
    const stageId = stageForEvent(event.eventType);
    const stage = STAGE_DEFINITIONS.find((item) => item.id === stageId) ?? STAGE_DEFINITIONS[0];
    const stageIndex = stageOffsets.get(stageId) ?? 0;
    stageOffsets.set(stageId, stageIndex + 1);

    return {
      id: event.id,
      stage: stage.label,
      stageId,
      stageLabel: stage.label,
      stageThemeId: STAGE_THEME_MAP[stageId],
      stepNumber: index + 1,
      recordRef: resolveRecordRef(event),
      timestamp: event.occurredAt,
      nodeRole: roleForEvent(event.eventType),
      eventType: event.eventType,
      title: eventTitle(event),
      subtitle: event.summary || event.location,
      quantity: resolveEventQuantity(event),
      status: event.status,
      evidenceComplete: evidenceScore(event.id),
      x: stage.x + 10,
      y: 90 + stageIndex * 148,
    };
  });

  const edges = nodes.slice(1).map<OnSiteJourneyEdge>((node, index) => {
    const source = nodes[index];
    const movementType = movementForEdge(source.eventType, node.eventType);
    return {
      id: `${source.id}-${node.id}`,
      source: source.id,
      target: node.id,
      label: node.quantity,
      status: node.status,
      movementType,
      quantityLabel: node.quantity,
      varianceLabel: resolveVarianceLabel(filteredEvents[index + 1]),
    };
  });

  const linkedBatches = onSiteProductionBatches.filter((batch) => selectedBatchIds.has(batch.id));
  const linkedFinishedLots = onSiteFinishedGoodsLots.filter((lot) => selectedFinishedLotIds.has(lot.id));
  const linkedConsignments = consignments.filter((item) => selectedConsignmentIds.has(item.id));
  const blockedPaths = onSiteIngredientLots.filter((lot) => {
    const events = onSiteEvents.filter((event) => event.lotId === lot.id || relatedToLot(event, lot.id));
    return statusRank(events.map((event) => event.status)) === "BLOCKED";
  }).length;
  const openEvidenceGaps = onSiteEvidenceLinks.filter((link) => link.status === "MISSING" || link.status === "REVIEW_REQUIRED").length;

  return {
    lots: onSiteIngredientLots,
    productionBatches: onSiteProductionBatches,
    finishedGoodsLots: onSiteFinishedGoodsLots,
    consignments,
    journeyOptions: onSiteIngredientLots.map((lot) => {
      const events = onSiteEvents.filter((event) => event.lotId === lot.id || relatedToLot(event, lot.id));
      const lotBatchIds = new Set(events.map((event) => event.batchId).filter(Boolean) as string[]);
      const lotFinishedIds = new Set(events.map((event) => event.finishedGoodsLotId).filter(Boolean) as string[]);
      const lotConsignmentIds = new Set(events.map((event) => event.consignmentId).filter(Boolean) as string[]);
      const batch = onSiteProductionBatches.find((item) => lotBatchIds.has(item.id));
      const finishedLot = onSiteFinishedGoodsLots.find((item) => lotFinishedIds.has(item.id));
      const consignment = consignments.find((item) => lotConsignmentIds.has(item.id));
      const evidence = events.flatMap((event) => onSiteEvidenceLinks.filter((link) => link.eventId === event.id));
      const evidenceAttached = evidence.filter((item) => item.status === "ATTACHED" || item.status === "NOT_APPLICABLE").length;
      return {
        id: lot.id,
        label: lot.lotCode,
        productName: productName(products, lot.productId),
        ingredientName: lot.ingredientName,
        status: statusRank(events.map((event) => event.status)),
        routeSummary: `${lot.lotCode} -> ${batch?.batchCode ?? "Batch pending"} -> ${consignment?.reference ?? finishedLot?.lotCode ?? "Consignment pending"}`,
        evidenceSummary: evidence.length > 0 ? `${evidenceAttached}/${evidence.length} evidence` : "No evidence mapped",
        relevance: lot.relevance,
      };
    }),
    selectedJourney: selectedLot
      ? {
          lot: selectedLot,
          productName: productName(products, selectedLot.productId),
          supplierName: supplierName(suppliers, selectedLot.supplierId),
          productionBatchReference: selectedBatch?.batchCode ?? "No production batch linked",
          finishedGoodsReference: selectedFinishedLot?.lotCode ?? "No finished lot linked",
          consignmentReference: selectedConsignment?.reference ?? "No consignment allocation",
          status: selectedStatus,
        }
      : null,
    stages,
    nodes,
    edges,
    evidenceRows: filteredEvents.map((event) => ({
      eventId: event.id,
      eventTitle: event.title,
      eventType: event.eventType,
      status: event.status,
      evidence: onSiteEvidenceLinks.filter((item) => item.eventId === event.id),
    })),
    gaps,
    kpis: [
      { label: "Received lots", value: String(onSiteIngredientLots.length), helper: "GFI ingredient lots in V1 trace sample", status: "COMPLETE" },
      { label: "Production links", value: String(linkedBatches.length), helper: "Batches joined to selected lot", status: linkedBatches.length > 0 ? "COMPLETE" : "REVIEW_REQUIRED" },
      { label: "Consignment links", value: String(linkedConsignments.length || linkedFinishedLots.length), helper: "Finished lots allocated or ready to allocate", status: linkedConsignments.length > 0 ? "COMPLETE" : "REVIEW_REQUIRED" },
      { label: "Evidence gaps", value: String(openEvidenceGaps), helper: "Missing or review-required evidence", status: openEvidenceGaps > 0 ? "REVIEW_REQUIRED" : "COMPLETE" },
      { label: "Blocked paths", value: String(blockedPaths), helper: "Journeys currently blocking release", status: blockedPaths > 0 ? "BLOCKED" : "COMPLETE" },
    ],
  };
}

function relatedToLot(event: OnSiteTraceabilityEvent, lotId: string): boolean {
  const lotInputs = onSiteBatchInputs.filter((input) => input.lotId === lotId);
  const batchIds = new Set(lotInputs.map((input) => input.batchId));
  const finishedLotIds = new Set(onSiteFinishedGoodsLots.filter((lot) => batchIds.has(lot.batchId)).map((lot) => lot.id));
  const consignmentIds = new Set(onSiteConsignmentAllocations.filter((allocation) => finishedLotIds.has(allocation.finishedGoodsLotId)).map((allocation) => allocation.consignmentId));
  return Boolean(
    (event.batchId && batchIds.has(event.batchId)) ||
      (event.finishedGoodsLotId && finishedLotIds.has(event.finishedGoodsLotId)) ||
      (event.consignmentId && consignmentIds.has(event.consignmentId)),
  );
}

function resolveEventQuantity(event: OnSiteTraceabilityEvent): string {
  if (event.lotId) {
    const lot = onSiteIngredientLots.find((item) => item.id === event.lotId);
    if (lot && event.eventType !== "CONSUMED") return formatQuantity(lot.quantity, lot.unit);
  }
  if (event.batchId && event.eventType === "CONSUMED" && event.lotId) {
    const input = onSiteBatchInputs.find((item) => item.batchId === event.batchId && item.lotId === event.lotId);
    if (input) return formatQuantity(input.consumedQuantity, input.unit);
  }
  if (event.batchId) {
    const batch = onSiteProductionBatches.find((item) => item.id === event.batchId);
    if (batch) return formatQuantity(batch.outputQuantity, batch.unit);
  }
  if (event.finishedGoodsLotId) {
    const lot = onSiteFinishedGoodsLots.find((item) => item.id === event.finishedGoodsLotId);
    if (lot) return formatQuantity(lot.quantity, lot.unit);
  }
  return "Linked event";
}

function buildGaps(lot: OnSiteIngredientLot | null, events: OnSiteTraceabilityEvent[]): OnSiteGap[] {
  if (!lot) return [];
  const gaps: OnSiteGap[] = [];
  if (!lot.hsCode) {
    gaps.push({ id: `${lot.id}-hs`, severity: "HIGH", title: "HS code missing from lot metadata", source: lot.grnRef, status: "BLOCKED" });
  }
  if (lot.relevance === "EUDR_RELEVANT" && (lot.cocModel === "NOT_DECLARED" || lot.cocModel === "MB")) {
    gaps.push({ id: `${lot.id}-coc`, severity: "CRITICAL", title: "Transaction-level Chain-of-Custody proof is missing or not acceptable", source: lot.invoiceRef, status: "BLOCKED" });
  }
  if (!lot.grnRef) {
    gaps.push({ id: `${lot.id}-grn`, severity: "HIGH", title: "Goods Receipt Note is missing", source: lot.lotCode, status: "BLOCKED" });
  }
  const inputs = onSiteBatchInputs.filter((input) => input.lotId === lot.id);
  if (inputs.length === 0) {
    gaps.push({ id: `${lot.id}-batch-link`, severity: "HIGH", title: "Ingredient lot is not linked to a production batch", source: lot.lotCode, status: "BLOCKED" });
  }
  inputs.forEach((input) => {
    const variance = Math.abs(input.consumedQuantity - input.expectedQuantity);
    if (variance > 0.1) {
      gaps.push({ id: `${input.id}-variance`, severity: "WARNING", title: "Consumed quantity differs from expected BOM quantity", source: input.batchId, status: "REVIEW_REQUIRED" });
    }
  });
  events.forEach((event) => {
    const evidence = onSiteEvidenceLinks.filter((link) => link.eventId === event.id);
    if (evidence.some((link) => link.status === "MISSING")) {
      gaps.push({ id: `${event.id}-missing-evidence`, severity: "HIGH", title: "Required event evidence is missing", source: event.title, status: "BLOCKED" });
    }
    if (evidence.some((link) => link.status === "REVIEW_REQUIRED")) {
      gaps.push({ id: `${event.id}-review-evidence`, severity: "WARNING", title: "Event evidence requires compliance review", source: event.title, status: "REVIEW_REQUIRED" });
    }
  });
  return gaps;
}
