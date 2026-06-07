import type { DueDiligenceMode, EuCountryRiskTier } from "@/lib/eu-country-risk";

export type LegalArea =
  | "LAND_TENURE"
  | "ENVIRONMENTAL_PROTECTION"
  | "LABOR_REGULATIONS"
  | "TAX_AND_CUSTOMS";

export type LegalityVerificationStatus = "NOT_REVIEWED" | "VERIFIED" | "EXPIRED" | "REJECTED";
export type LegalityDossierStatus = "COMPLETE" | "PARTIAL" | "GAPS_FOUND" | "UNDER_REVIEW";
export type IngredientLegalityStatus = "COMPLETE" | "PARTIAL" | "MISSING";

export interface LegalityAuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  eventType:
    | "DOSSIER_CREATED"
    | "DOCUMENT_UPLOADED"
    | "DOCUMENT_REPLACED"
    | "VALIDITY_UPDATED"
    | "DOCUMENT_VERIFIED"
    | "DOCUMENT_REJECTED"
    | "DOCUMENT_EXPIRED"
    | "DOSSIER_STATUS_CHANGED";
  message: string;
}

export interface LegalityEvidenceDocumentShape {
  id: string;
  legalArea: LegalArea;
  sampleDocumentLabel: string;
  verificationMethod: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  verificationStatus: LegalityVerificationStatus;
  verificationNote?: string;
  validFrom?: string;
  validTo?: string;
  countryRegistrarRef?: string;
  customsSealRef?: string;
}

export interface LegalityDossierShape {
  id: string;
  ingredientId: string;
  productId: string;
  originCountry: string;
  euRiskTier: Exclude<EuCountryRiskTier, "UNKNOWN"> | "UNKNOWN";
  dueDiligenceMode: DueDiligenceMode;
  overallStatus: LegalityDossierStatus;
  documents: LegalityEvidenceDocumentShape[];
  auditTrail: LegalityAuditEvent[];
}

export const LEGALITY_DOCUMENT_TEMPLATES: Array<{
  legalArea: LegalArea;
  sampleDocumentLabel: string;
  verificationMethod: string;
}> = [
  {
    legalArea: "LAND_TENURE",
    sampleDocumentLabel: "Land Register Title Deed",
    verificationMethod: "Verification against national registrar",
  },
  {
    legalArea: "ENVIRONMENTAL_PROTECTION",
    sampleDocumentLabel: "Agroforestry Permit",
    verificationMethod: "Verification of validity dates",
  },
  {
    legalArea: "LABOR_REGULATIONS",
    sampleDocumentLabel: "Fair Trade / ILO Audit Report",
    verificationMethod: "Check for active audits/certifications",
  },
  {
    legalArea: "TAX_AND_CUSTOMS",
    sampleDocumentLabel: "Export Duty Clearance Certificate",
    verificationMethod: "Check for customs seal",
  },
];

export function buildLegalityDocumentTemplate(legalArea: LegalArea, seed: string): LegalityEvidenceDocumentShape {
  const template = LEGALITY_DOCUMENT_TEMPLATES.find((entry) => entry.legalArea === legalArea);
  if (!template) {
    throw new Error(`No legality document template registered for ${legalArea}`);
  }
  return {
    id: `${seed}-${legalArea.toLowerCase()}`,
    legalArea,
    sampleDocumentLabel: template.sampleDocumentLabel,
    verificationMethod: template.verificationMethod,
    verificationStatus: "NOT_REVIEWED",
  };
}

export function buildLegalityDossierTemplate(input: {
  id: string;
  ingredientId: string;
  productId: string;
  originCountry: string;
  euRiskTier: Exclude<EuCountryRiskTier, "UNKNOWN"> | "UNKNOWN";
  dueDiligenceMode: DueDiligenceMode;
  actor?: string;
  timestamp?: string;
}): LegalityDossierShape {
  const createdAt = input.timestamp ?? new Date().toISOString();
  return {
    id: input.id,
    ingredientId: input.ingredientId,
    productId: input.productId,
    originCountry: input.originCountry,
    euRiskTier: input.euRiskTier,
    dueDiligenceMode: input.dueDiligenceMode,
    overallStatus: "GAPS_FOUND",
    documents: LEGALITY_DOCUMENT_TEMPLATES.map((entry) => buildLegalityDocumentTemplate(entry.legalArea, input.id)),
    auditTrail: [
      {
        id: `${input.id}-created`,
        timestamp: createdAt,
        actor: input.actor ?? "System",
        eventType: "DOSSIER_CREATED",
        message: `Legality dossier initialized for ${input.originCountry}.`,
      },
    ],
  };
}

export function summarizeLegalityDossier(documents: LegalityEvidenceDocumentShape[]): LegalityDossierStatus {
  const uploadedDocuments = documents.filter((document) => Boolean(document.fileName));
  if (uploadedDocuments.length === 0) return "GAPS_FOUND";
  if (documents.some((document) => document.verificationStatus === "REJECTED" || document.verificationStatus === "EXPIRED" || !document.fileName)) {
    return "GAPS_FOUND";
  }
  if (documents.every((document) => document.fileName) && documents.some((document) => document.verificationStatus === "NOT_REVIEWED")) {
    return "UNDER_REVIEW";
  }
  if (documents.every((document) => document.fileName && document.verificationStatus === "VERIFIED")) {
    return "COMPLETE";
  }
  return "PARTIAL";
}

export function toIngredientLegalityStatus(status: LegalityDossierStatus): IngredientLegalityStatus {
  if (status === "COMPLETE") return "COMPLETE";
  if (status === "PARTIAL" || status === "UNDER_REVIEW") return "PARTIAL";
  return "MISSING";
}

export function getLegalityCompletionScore(documents: LegalityEvidenceDocumentShape[]): number {
  const complete = documents.filter((document) => document.fileName && document.verificationStatus === "VERIFIED").length;
  return Math.round((complete / documents.length) * 100);
}

export function appendAuditEvent(
  auditTrail: LegalityAuditEvent[],
  event: Omit<LegalityAuditEvent, "id">,
): LegalityAuditEvent[] {
  return [
    {
      id: `${event.eventType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...event,
    },
    ...auditTrail,
  ];
}
