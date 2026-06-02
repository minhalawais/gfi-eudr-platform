"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { AlertCircle, Check, FileText, HelpCircle, Info, MapPinned, Search } from "lucide-react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { AppTopbar, DevelopedByFooter } from "@/components/ui";
import {
  FarmerDeclarationSubmission,
  IntermediaryDeclarationSubmission,
  SupplyChainNode,
} from "@/lib/gfi-dummy-data";
import { useSession } from "@/components/ui/PermissionGuard";

type UpstreamEntityType = "Mill" | "Farm" | "Trader" | "Processor" | "Distributor" | "Exporter" | "Cooperative" | "Estate";

interface UpstreamEntityRow {
  id: string;
  name: string;
  entityType: UpstreamEntityType;
  address: string;
  materialName: string;
  volumeContributionPercent: number;
  certifiedSupplier: boolean;
  certificateAttached: boolean;
}

interface PlotRow {
  plotId: string;
  latitudes: string;
  longitudes: string;
  areaHa: number;
  commodityGrown: string;
  productionVolume: string;
  coordinateType: "POINT" | "POLYGON" | "FILE";
  fileName: string;
}

type FacilityType = "Production" | "Processing" | "Storage" | "";
type OperationalStatus = "Own" | "Lease" | "Contract" | "";
type ExistsYesNo = "YES" | "NO" | "";

interface Section3FacilityRow {
  siteNo: number;
  siteName: string;
  fullAddress: string;
  pinLocation: string;
  facilityType: FacilityType;
  operationalStatus: OperationalStatus;
}

interface Section3LandDocRow {
  id: string;
  documentType: string;
  existsYesNo: ExistsYesNo;
  issuingAuthorityName: string;
  attached: boolean;
  uploadedFiles: string[];
}

interface Section3LegalActions {
  hasDisputes: "no" | "yes";
  disputeExplanation: string;
  judicialDecisions: boolean;
  administrativeRulings: boolean;
  settlementDocsAttached: boolean;
  uploadedFiles: string[];
}

interface IntermediaryFormState {
  roles: string[];
  suppliedCommodities: string[];
  legalName: string;
  registeredAddress: string;
  country: string;
  registrationNumber: string;
  taxNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  headOfficeLat: string;
  headOfficeLng: string;
  headOfficeAddress: string;
  operationsScope: string;
  section3Facilities: Section3FacilityRow[];
  section3LandDocs: Section3LandDocRow[];
  section3LegalActions: Section3LegalActions;
  licenses: string;
  certifications: string;
  purchasedMaterials: string;
  upstreamEntities: UpstreamEntityRow[];
  tradeProof: Record<string, boolean>;
  traceabilityCapabilities: Record<string, boolean>;
  traceabilityControls: string;
  processingActivity: string;
  outputProduct: string;
  processingDocuments: string;
  firstPointOfSale: string;
  policies: Record<string, boolean>;
  thirdPartyVerification: string;
  documentUploads: {
    landRights: string[];
    disputes: string[];
    licenses: string[];
    certifications: string[];
    tradeProof: string[];
    processing: string[];
    policies: string[];
    thirdPartyVerification: string[];
  };
  signatureName: string;
  designation: string;
  declarationDate: string;
}

interface FarmerFormState {
  producerType: string;
  fullName: string;
  nationalId: string;
  address: string;
  locality: string;
  region: string;
  country: string;
  phone: string;
  producerDocuments: string;
  commodities: string[];
  harvestYears: string;
  annualVolume: string;
  landBasis: string;
  landDocuments: string;
  plots: PlotRow[];
  deforestationConfirmations: Record<string, boolean>;
  previousLandUse: string;
  boundaryChanged: string;
  environmentalCompliance: Record<string, string>;
  communityRights: string;
  labourTypes: string[];
  labourCompliance: Record<string, string>;
  firstPointOfSale: string;
  tradeProof: Record<string, boolean>;
  sellingMethod: string;
  ownershipTransfer: string;
  trackingMethods: string[];
  certification: string;
  disputes: string;
  signatureName: string;
  declarationDate: string;
}

const intermediarySections = [
  "Section 1 - Intermediary actor type",
  "Section 2 - Supplier profile",
  "Section 3 - Land, facility and legal use rights",
  "Section 4 - Business and operational licenses",
  "Section 5A - Sourcing, traceability and chain of custody",
  "Section 5B - Processing and manufacturing",
  "Section 6 - Policies and internal controls",
  "Section 7 - Certification and third-party verification",
  "Section 8 - Formal declaration",
];

const farmerSections = [
  "Section 1 - Producer identification",
  "Section 2 - Commodity produced",
  "Section 3 - Land ownership and use rights",
  "Section 4 - Production plot geolocation",
  "Section 5 - Deforestation-free confirmation",
  "Section 6 - Environmental and agricultural compliance",
  "Section 7 - Indigenous peoples and community rights",
  "Section 8 - Labour and human rights compliance",
  "Section 9 - Traceability and supply chain",
  "Section 10 - Certification",
  "Section 11 - Legal disputes and sanctions",
  "Section 12 - Formal declaration",
];

type FieldRequirement = "required" | "optional" | "conditional";
type InstructionTone = "important" | "howTo" | "ifApplicable" | "attachment";

interface IntermediaryFieldMeta {
  requirement: FieldRequirement;
  instruction?: string;
  condition?: string;
}

interface GeocodeFeature {
  id: string;
  place_name: string;
  center: [number, number];
}

const INTERMEDIARY_SECTION_INSTRUCTIONS: Record<number, { tone: InstructionTone; title: string; items: string[] }> = {
  0: {
    tone: "important",
    title: "Important instructions",
    items: [
      "This declaration is for intermediary suppliers only, not primary farmers/producers.",
      "Select all applicable roles and all EUDR commodity groups supplied to the buyer.",
      "Use accurate values that can be supported by evidence during audit.",
    ],
  },
  1: {
    tone: "howTo",
    title: "How to complete supplier profile",
    items: [
      "Enter legal registration details exactly as in official records.",
      "Head office coordinates should use decimal format (example: 31.5204, 74.3587).",
      "Tax number is optional if not issued in your jurisdiction.",
    ],
  },
  2: {
    tone: "ifApplicable",
    title: "If applicable",
    items: [
      "Complete this section if you own, lease, or operate production/processing/storage facilities.",
      "Include legal-use-right references and disclose ongoing disputes or enforcement actions.",
    ],
  },
  3: {
    tone: "attachment",
    title: "Attachment guidance",
    items: [
      "Confirm licenses/permits required for legal operation in your country.",
      "Where certification is claimed, include scheme, CoC model, validity period, and supporting files.",
    ],
  },
  4: {
    tone: "important",
    title: "Traceability declaration guidance",
    items: [
      "List all upstream entities contributing to declared materials.",
      "Attach trade evidence and confirm traceability controls used to prevent mixing.",
      "Volume contribution should reflect declared material composition.",
    ],
  },
  5: {
    tone: "howTo",
    title: "Processing operations guidance",
    items: [
      "Describe actual transformation activity performed on EUDR-relevant material.",
      "Document input-to-output flow and first point of sale information.",
    ],
  },
  6: {
    tone: "attachment",
    title: "Policy evidence guidance",
    items: [
      "Mark policy existence accurately and attach references where available.",
      "Include due-diligence and anti-deforestation policy controls where applicable.",
    ],
  },
  7: {
    tone: "attachment",
    title: "Certification and verification guidance",
    items: [
      "Declare third-party certification or audit scope only where applicable.",
      "Include validity period and attachment references when claiming certification.",
    ],
  },
  8: {
    tone: "important",
    title: "Declaration responsibility",
    items: [
      "Submit only after confirming all mandatory entries and evidence references.",
      "Authorized signatory confirms information is true, complete, and accurate.",
    ],
  },
};

const INTERMEDIARY_FIELD_META: Record<number, Record<string, IntermediaryFieldMeta>> = {
  0: {
    roles: { requirement: "required", instruction: "Tick all applicable roles in your current supply-chain function." },
    suppliedCommodities: { requirement: "required", instruction: "Select all EUDR commodity groups you supply to the buyer (Annex I aligned)." },
  },
  1: {
    legalName: { requirement: "required", instruction: "Use your legally registered company name." },
    country: { requirement: "required", instruction: "Country where the company is legally registered." },
    registeredAddress: { requirement: "required", instruction: "Registered legal address as per official registration." },
    registrationNumber: { requirement: "required", instruction: "Official company registration number." },
    taxNumber: { requirement: "optional", instruction: "Provide where tax registration exists in your jurisdiction." },
    contactPerson: { requirement: "required", instruction: "Responsible focal person name and designation." },
    email: { requirement: "required", instruction: "Compliance contact email used for audit communication." },
    phone: { requirement: "optional", instruction: "Preferred phone with country code." },
    headOfficeLat: { requirement: "optional", instruction: "Head office latitude in decimal format, or use map selection." },
    headOfficeLng: { requirement: "optional", instruction: "Head office longitude in decimal format, or use map selection." },
    headOfficeAddress: { requirement: "optional", instruction: "Search and select the office point on map to capture display location." },
    operationsScope: { requirement: "conditional", instruction: "List countries of operation when multi-country operations apply.", condition: "Required if operating in multiple countries." },
  },
  2: {
    facilities: { requirement: "conditional", instruction: "Capture site details: name, address, pin location, type and operating basis.", condition: "If you own/lease/operate facilities." },
    landDocuments: { requirement: "conditional", instruction: "List land-use-right documents and issuing authorities.", condition: "If facility declaration is applicable." },
    disputes: { requirement: "conditional", instruction: "Disclose legal disputes, sanctions, or enforcement actions with remediation references.", condition: "If any dispute/action exists." },
    landRightsUpload: { requirement: "conditional", instruction: "Attach land title, lease, cadastral extract, or zoning approval records.", condition: "If facility declaration is applicable." },
    disputesUpload: { requirement: "conditional", instruction: "Attach judicial decisions, rulings, or remediation records where available.", condition: "If disputes/enforcement actions exist." },
  },
  3: {
    licenses: { requirement: "required", instruction: "Confirm existence of legally required operating licenses and permit references." },
    certifications: { requirement: "conditional", instruction: "Include scheme, covered commodity, certificate ID, CoC type, and validity.", condition: "If sustainability certification is claimed." },
    licensesUpload: { requirement: "conditional", instruction: "Attach license/permit copies supporting this declaration.", condition: "If license exists." },
    certificationsUpload: { requirement: "conditional", instruction: "Attach valid certification documents and CoC evidence.", condition: "If certification is claimed." },
  },
  4: {
    purchasedMaterials: { requirement: "required", instruction: "Specify EUDR-relevant commodities/materials purchased from upstream suppliers." },
    upstreamEntities: { requirement: "required", instruction: "Add all upstream entities contributing to the declared material and volume share." },
    tradeProof: { requirement: "required", instruction: "Confirm trade evidence fields are present in attached records." },
    tradeProofUpload: { requirement: "required", instruction: "Upload invoice, delivery note, or equivalent trade evidence files." },
    traceabilityCapabilities: { requirement: "required", instruction: "Confirm current digital and batch-level traceability capabilities." },
    traceabilityControls: { requirement: "required", instruction: "Describe segregation controls preventing certified/non-certified mixing." },
  },
  5: {
    processingActivity: { requirement: "conditional", instruction: "State refining/blending/fermentation/modification activities performed.", condition: "If processing operations are performed." },
    outputProduct: { requirement: "conditional", instruction: "Map input commodity to output product supplied downstream.", condition: "If processing operations are performed." },
    processingDocuments: { requirement: "conditional", instruction: "Reference process flow and environmental audit/plan evidence.", condition: "If processing operations are performed." },
    processingUpload: { requirement: "conditional", instruction: "Attach process flow, environmental plan, and latest audit/inspection report.", condition: "If processing operations are performed." },
    firstPointOfSale: { requirement: "required", instruction: "Provide buyer name/type/location for first point of sale." },
  },
  6: {
    policies: { requirement: "conditional", instruction: "Mark documented policies and maintain attachment references.", condition: "If policy documents exist." },
    policiesUpload: { requirement: "conditional", instruction: "Attach policy files or controlled references for verification.", condition: "If policy documents exist." },
    thirdPartyVerification: { requirement: "optional", instruction: "Optional notes on policy evidence, review outcomes, or compliance controls." },
  },
  7: {
    thirdPartyVerification: { requirement: "optional", instruction: "Optional details on certification or third-party verification scope and attachments." },
    thirdPartyVerificationUpload: { requirement: "conditional", instruction: "Attach third-party audit/certification evidence files.", condition: "If third-party verification exists." },
  },
  8: {
    signatureName: { requirement: "required", instruction: "Authorized signatory full name." },
    designation: { requirement: "required", instruction: "Authorized signatory designation." },
    legalName: { requirement: "required", instruction: "Company legal name linked to this declaration." },
    declarationDate: { requirement: "required", instruction: "Date of declaration submission." },
  },
};

const INTERMEDIARY_OPTION_LABELS: Record<string, string> = {
  upstreamSupplier: "Name of upstream supplier / farmer",
  date: "Date of transaction",
  productName: "Product name",
  hsCode: "HS code",
  lotNumber: "Batch / lot number",
  quantity: "Quantity supplied",
  cocStatus: "Chain-of-custody status (Segregated / IP)",
  millBatch: "Volume traceable to specific mill batch",
  batchRecords: "Batch-level traceability records maintained",
  erpReport: "ERP-generated traceability report available for audit",
  digitalExport: "Traceability data export available (Excel / CSV / ERP extract)",
  fiveYearRetention: "Records retained for at least five years",
};

function formatIntermediaryOptionLabel(key: string) {
  const mapped = INTERMEDIARY_OPTION_LABELS[key];
  if (mapped) return mapped;
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\bhs\b/gi, "HS")
    .replace(/\berp\b/gi, "ERP")
    .replace(/\bcoc\b/gi, "CoC")
    .replace(/^./, (char) => char.toUpperCase());
}

const roleOptions = [
  "Raw Material Aggregator / Consolidator",
  "Primary Processor",
  "Secondary / Refining Processor",
  "Chemical / Fermentation Processor",
  "Ingredient Formulator / Compounder",
  "Bulk Trader / Commodity Trader",
  "Ingredient Distributor",
  "Importer / Exporter",
  "Broker / Agent",
];

const commodityOptions = [
  "Oil Palm & Palm-Derived Products",
  "Soya & Soy-Derived Products",
  "Cocoa & Cocoa-Derived Products",
  "Coffee & Coffee-Derived Products",
  "Rubber & Rubber-Derived Products",
  "Cattle-Derived Products",
  "Wood & Wood-Derived Products",
];

const farmerCommodityOptions = ["Oil Palm", "Soybeans", "Sugarcane / Sugar Beet", "Cocoa", "Coffee", "Rubber", "Cattle"];

const SUPPORTED_LOCALES = ["en", "ms", "id", "fr", "nl", "de", "ar", "ur"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const RTL_LOCALES = new Set<SupportedLocale>(["ar", "ur"]);

const PORTAL_COPY: Record<SupportedLocale, Record<string, string>> = {
  en: {
    portalTitle: "Multi-Tier EUDR supplier declaration portal",
    back: "Back to GFI workspace",
    scopedAccess: "Scoped form access",
    noAccess: "Access restricted. Please open the supplier portal with your secure token link.",
    invalidToken: "This token is invalid or expired. Contact your compliance coordinator for a new link.",
    loading: "Loading secure declaration request...",
    formType: "Form type",
    chainStatus: "Chain status",
    prev: "Previous section",
    next: "Next section",
    submit: "Submit declaration and update chain",
    saveState: "Autosaved",
    issuesTitle: "Please resolve before continuing",
    language: "Language",
  },
  ms: {
    portalTitle: "Portal pengisytiharan pembekal EUDR berbilang peringkat",
    back: "Kembali ke ruang kerja GFI",
    scopedAccess: "Akses borang terhad",
    noAccess: "Akses terhad. Sila buka pautan token selamat.",
    invalidToken: "Token tidak sah atau tamat tempoh.",
    loading: "Memuatkan permintaan pengisytiharan selamat...",
    formType: "Jenis borang",
    chainStatus: "Status rantaian",
    prev: "Bahagian sebelumnya",
    next: "Bahagian seterusnya",
    submit: "Hantar pengisytiharan",
    saveState: "Disimpan automatik",
    issuesTitle: "Sila lengkapkan sebelum meneruskan",
    language: "Bahasa",
  },
  id: {
    portalTitle: "Portal deklarasi pemasok EUDR multi-tier",
    back: "Kembali ke workspace GFI",
    scopedAccess: "Akses formulir terbatas",
    noAccess: "Akses dibatasi. Buka portal dengan tautan token aman.",
    invalidToken: "Token tidak valid atau kedaluwarsa.",
    loading: "Memuat permintaan deklarasi aman...",
    formType: "Tipe formulir",
    chainStatus: "Status rantai",
    prev: "Bagian sebelumnya",
    next: "Bagian berikutnya",
    submit: "Kirim deklarasi",
    saveState: "Tersimpan otomatis",
    issuesTitle: "Mohon lengkapi sebelum lanjut",
    language: "Bahasa",
  },
  fr: {
    portalTitle: "Portail de declaration fournisseur EUDR multi-niveaux",
    back: "Retour a l'espace GFI",
    scopedAccess: "Acces au formulaire cible",
    noAccess: "Acces restreint. Ouvrez le lien securise avec jeton.",
    invalidToken: "Jeton invalide ou expire.",
    loading: "Chargement de la demande securisee...",
    formType: "Type de formulaire",
    chainStatus: "Statut de chaine",
    prev: "Section precedente",
    next: "Section suivante",
    submit: "Soumettre la declaration",
    saveState: "Enregistre automatiquement",
    issuesTitle: "A corriger avant de continuer",
    language: "Langue",
  },
  nl: {
    portalTitle: "Multi-Tier EUDR-leveranciersportaal",
    back: "Terug naar GFI-werkruimte",
    scopedAccess: "Gerichte formuliertoegang",
    noAccess: "Toegang beperkt. Open de beveiligde tokenlink.",
    invalidToken: "Token ongeldig of verlopen.",
    loading: "Veilige aanvraag wordt geladen...",
    formType: "Formuliertype",
    chainStatus: "Ketenstatus",
    prev: "Vorige sectie",
    next: "Volgende sectie",
    submit: "Verklaring indienen",
    saveState: "Automatisch opgeslagen",
    issuesTitle: "Los op voor u doorgaat",
    language: "Taal",
  },
  de: {
    portalTitle: "Multi-Tier EUDR-Lieferantenportal",
    back: "Zurueck zum GFI-Arbeitsbereich",
    scopedAccess: "Bereichsspezifischer Formularzugriff",
    noAccess: "Zugriff eingeschraenkt. Oeffnen Sie den sicheren Token-Link.",
    invalidToken: "Token ungueltig oder abgelaufen.",
    loading: "Sichere Anfrage wird geladen...",
    formType: "Formulartyp",
    chainStatus: "Kettenstatus",
    prev: "Vorheriger Abschnitt",
    next: "Naechster Abschnitt",
    submit: "Erklaerung uebermitteln",
    saveState: "Automatisch gespeichert",
    issuesTitle: "Bitte vor dem Fortfahren beheben",
    language: "Sprache",
  },
  ar: {
    portalTitle: "Arabic - EUDR Supplier Declaration Portal",
    back: "Back to GFI workspace",
    scopedAccess: "Scoped form access",
    noAccess: "Access restricted. Open the secure token link.",
    invalidToken: "Token invalid or expired.",
    loading: "Loading secure declaration request...",
    formType: "Form type",
    chainStatus: "Chain status",
    prev: "Previous section",
    next: "Next section",
    submit: "Submit declaration",
    saveState: "Autosaved",
    issuesTitle: "Please resolve before continuing",
    language: "Language",
  },
  ur: {
    portalTitle: "Urdu - EUDR Supplier Declaration Portal",
    back: "Back to GFI workspace",
    scopedAccess: "Scoped form access",
    noAccess: "Access restricted. Open the secure token link.",
    invalidToken: "Token invalid or expired.",
    loading: "Loading secure declaration request...",
    formType: "Form type",
    chainStatus: "Chain status",
    prev: "Previous section",
    next: "Next section",
    submit: "Submit declaration",
    saveState: "Autosaved",
    issuesTitle: "Please resolve before continuing",
    language: "Language",
  },
};

function toggleArray(value: string, selected: string[]) {
  return selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
}

function safeId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "entity";
}

function defaultSection3Facilities(): Section3FacilityRow[] {
  return [
    { siteNo: 1, siteName: "", fullAddress: "", pinLocation: "", facilityType: "", operationalStatus: "" },
    { siteNo: 2, siteName: "", fullAddress: "", pinLocation: "", facilityType: "", operationalStatus: "" },
    { siteNo: 3, siteName: "", fullAddress: "", pinLocation: "", facilityType: "", operationalStatus: "" },
  ];
}

function defaultSection3LandDocs(): Section3LandDocRow[] {
  return [
    { id: "land-title", documentType: "Government-issued land title / deed", existsYesNo: "", issuingAuthorityName: "", attached: false, uploadedFiles: [] },
    { id: "lease-usufruct", documentType: "Lease or usufruct agreement", existsYesNo: "", issuingAuthorityName: "", attached: false, uploadedFiles: [] },
    { id: "cadastral-record", documentType: "Property registry extract / cadastral record", existsYesNo: "", issuingAuthorityName: "", attached: false, uploadedFiles: [] },
    { id: "zoning-approval", documentType: "Industrial zoning or land-use approval", existsYesNo: "", issuingAuthorityName: "", attached: false, uploadedFiles: [] },
  ];
}

function defaultSection3LegalActions(): Section3LegalActions {
  return {
    hasDisputes: "no",
    disputeExplanation: "",
    judicialDecisions: false,
    administrativeRulings: false,
    settlementDocsAttached: false,
    uploadedFiles: [],
  };
}

function ensureIntermediaryUploads(form: IntermediaryFormState): IntermediaryFormState {
  return {
    ...form,
    headOfficeAddress: form.headOfficeAddress ?? "",
    section3Facilities:
      Array.isArray((form as unknown as { section3Facilities?: Section3FacilityRow[] }).section3Facilities) &&
      (form as unknown as { section3Facilities?: Section3FacilityRow[] }).section3Facilities!.length === 3
        ? (form as unknown as { section3Facilities: Section3FacilityRow[] }).section3Facilities.map((row, index) => ({
            siteNo: index + 1,
            siteName: row.siteName ?? "",
            fullAddress: row.fullAddress ?? "",
            pinLocation: row.pinLocation ?? "",
            facilityType: row.facilityType ?? "",
            operationalStatus: row.operationalStatus ?? "",
          }))
        : defaultSection3Facilities(),
    section3LandDocs:
      Array.isArray((form as unknown as { section3LandDocs?: Section3LandDocRow[] }).section3LandDocs) &&
      (form as unknown as { section3LandDocs?: Section3LandDocRow[] }).section3LandDocs!.length > 0
        ? (form as unknown as { section3LandDocs: Section3LandDocRow[] }).section3LandDocs.map((row, index) => ({
            id: row.id ?? `land-doc-${index + 1}`,
            documentType: row.documentType ?? defaultSection3LandDocs()[index]?.documentType ?? "",
            existsYesNo: row.existsYesNo ?? "",
            issuingAuthorityName: row.issuingAuthorityName ?? "",
            attached: !!row.attached,
            uploadedFiles: row.uploadedFiles ?? [],
          }))
        : defaultSection3LandDocs(),
    section3LegalActions: (form as unknown as { section3LegalActions?: Section3LegalActions }).section3LegalActions
      ? {
          hasDisputes: (form as unknown as { section3LegalActions: Section3LegalActions }).section3LegalActions.hasDisputes ?? "no",
          disputeExplanation: (form as unknown as { section3LegalActions: Section3LegalActions }).section3LegalActions.disputeExplanation ?? "",
          judicialDecisions: !!(form as unknown as { section3LegalActions: Section3LegalActions }).section3LegalActions.judicialDecisions,
          administrativeRulings: !!(form as unknown as { section3LegalActions: Section3LegalActions }).section3LegalActions.administrativeRulings,
          settlementDocsAttached: !!(form as unknown as { section3LegalActions: Section3LegalActions }).section3LegalActions.settlementDocsAttached,
          uploadedFiles: (form as unknown as { section3LegalActions: Section3LegalActions }).section3LegalActions.uploadedFiles ?? [],
        }
      : defaultSection3LegalActions(),
    documentUploads: {
      landRights: form.documentUploads?.landRights ?? [],
      disputes: form.documentUploads?.disputes ?? [],
      licenses: form.documentUploads?.licenses ?? [],
      certifications: form.documentUploads?.certifications ?? [],
      tradeProof: form.documentUploads?.tradeProof ?? [],
      processing: form.documentUploads?.processing ?? [],
      policies: form.documentUploads?.policies ?? [],
      thirdPartyVerification: form.documentUploads?.thirdPartyVerification ?? [],
    },
  };
}

function defaultIntermediaryForm(name: string, email = ""): IntermediaryFormState {
  return {
    roles: ["Primary Processor"],
    suppliedCommodities: ["Cocoa & Cocoa-Derived Products"],
    legalName: name,
    registeredAddress: "",
    country: "",
    registrationNumber: "",
    taxNumber: "",
    contactPerson: "",
    email,
    phone: "",
    headOfficeLat: "",
    headOfficeLng: "",
    headOfficeAddress: "",
    operationsScope: "Single country where business is registered.",
    section3Facilities: defaultSection3Facilities(),
    section3LandDocs: defaultSection3LandDocs(),
    section3LegalActions: defaultSection3LegalActions(),
    licenses: "",
    certifications: "",
    purchasedMaterials: "",
    upstreamEntities: [],
    tradeProof: {
      upstreamSupplier: false,
      date: false,
      productName: false,
      hsCode: false,
      lotNumber: false,
      quantity: false,
      cocStatus: false,
    },
    traceabilityCapabilities: {
      millBatch: false,
      batchRecords: false,
      erpReport: false,
      digitalExport: false,
      fiveYearRetention: false,
    },
    traceabilityControls: "",
    processingActivity: "",
    outputProduct: "",
    processingDocuments: "",
    firstPointOfSale: "",
    policies: {
      healthSafety: false,
      environment: false,
      antiDeforestation: false,
      waste: false,
      humanRights: false,
      subcontracting: false,
      supplierCode: false,
      dueDiligence: false,
    },
    thirdPartyVerification: "",
    documentUploads: {
      landRights: [],
      disputes: [],
      licenses: [],
      certifications: [],
      tradeProof: [],
      processing: [],
      policies: [],
      thirdPartyVerification: [],
    },
    signatureName: "",
    designation: "",
    declarationDate: "2026-05-22",
  };
}

function defaultFarmerForm(name: string): FarmerFormState {
  return {
    producerType: "Individual Smallholder Farmer",
    fullName: name,
    nationalId: "",
    address: "",
    locality: "",
    region: "",
    country: "",
    phone: "",
    producerDocuments: "",
    commodities: ["Cocoa"],
    harvestYears: "2025-2026",
    annualVolume: "",
    landBasis: "Ownership",
    landDocuments: "",
    plots: [
      {
        plotId: "Plot 1",
        latitudes: "",
        longitudes: "",
        areaHa: 0,
        commodityGrown: "Cocoa",
        productionVolume: "",
        coordinateType: "FILE",
        fileName: "",
      },
    ],
    deforestationConfirmations: {
      notDeforestedAfter2020: false,
      noForestCleared: false,
      commodityOnlyFromDeclaredPlots: false,
    },
    previousLandUse: "Agricultural land",
    boundaryChanged: "No",
    environmentalCompliance: {
      outsideProtectedAreas: "Not sure",
      nationalEnvironmentalLaw: "Not aware",
      environmentalNotices: "No",
      cropLegallyPermitted: "Not sure",
      waterPermission: "Yes",
      waterNoHarm: "Yes",
      approvedInputs: "Yes",
    },
    communityRights: "Not Applicable",
    labourTypes: ["Family labour only"],
    labourCompliance: {
      legalAge: "Yes",
      paymentFrequency: "Daily wage",
      paymentMethod: "Cash",
      healthSafety: "Yes",
      labourLawAwareness: "Some awareness",
      authorityVisit: "No",
    },
    firstPointOfSale: "",
    tradeProof: {
      buyer: false,
      date: false,
      productName: false,
      hsCode: false,
      lotNumber: false,
      quantity: false,
      cocStatus: false,
    },
    sellingMethod: "Product sold directly from farm",
    ownershipTransfer: "At farm gate",
    trackingMethods: ["Farmer ID or code"],
    certification: "No certification",
    disputes: "No",
    signatureName: "",
    declarationDate: "2026-05-22",
  };
}

function InstructionCard({ tone, title, items }: { tone: InstructionTone; title: string; items: string[] }) {
  const toneClasses =
    tone === "important"
      ? "border-state-warning/40 bg-state-warning/10 text-brand-primary"
      : tone === "howTo"
        ? "border-border-soft bg-bg-surface-alt text-text-secondary"
        : tone === "ifApplicable"
          ? "border-state-info/30 bg-state-info/10 text-brand-primary"
          : "border-state-success/30 bg-state-success/10 text-brand-primary";
  const Icon = tone === "important" ? AlertCircle : tone === "howTo" ? Info : tone === "ifApplicable" ? HelpCircle : FileText;
  return (
    <div className={`rounded-xl border p-3 ${toneClasses}`}>
      <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </p>
      <ul className="space-y-1 text-xs leading-relaxed">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function InfoRow({
  label,
  children,
  requirement,
  instruction,
  condition,
}: {
  label: string;
  children: React.ReactNode;
  requirement?: FieldRequirement;
  instruction?: string;
  condition?: string;
}) {
  const requirementText = requirement ? `${requirement.charAt(0).toUpperCase()}${requirement.slice(1)}` : null;
  return (
    <div className="form-group space-y-1.5">
      <label className="form-label flex flex-wrap items-center gap-1.5">
        <span>{label}</span>
        {requirementText ? <span className="text-xs font-semibold text-text-secondary">({requirementText})</span> : null}
      </label>
      {instruction ? <p className="text-xs text-text-secondary">{instruction}</p> : null}
      {condition ? <p className="text-xs font-medium text-state-info">Condition: {condition}</p> : null}
      {children}
    </div>
  );
}

function DocumentUploadInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <input
        type="file"
        multiple
        onChange={(event) => {
          const files = event.target.files ? Array.from(event.target.files).map((file) => file.name) : [];
          onChange(files);
        }}
        className="form-input"
      />
      <p className="text-xs text-text-secondary">
        {value.length > 0 ? `${value.length} file(s): ${value.join(", ")}` : "No files selected"}
      </p>
    </div>
  );
}

function LocationPickerModal({
  open,
  initialLat,
  initialLng,
  initialAddress,
  onConfirm,
  onClose,
}: {
  open: boolean;
  initialLat: string;
  initialLng: string;
  initialAddress: string;
  onConfirm: (payload: { lat: string; lng: string; address: string }) => void;
  onClose: () => void;
}) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const fallbackLat = Number(initialLat);
  const fallbackLng = Number(initialLng);
  const hasInitialPoint = Number.isFinite(fallbackLat) && Number.isFinite(fallbackLng);

  const [searchQuery, setSearchQuery] = useState(initialAddress || "");
  const [results, setResults] = useState<GeocodeFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingAddress, setPendingAddress] = useState(initialAddress || "");
  const [pendingLat, setPendingLat] = useState(hasInitialPoint ? fallbackLat : 24.8607);
  const [pendingLng, setPendingLng] = useState(hasInitialPoint ? fallbackLng : 67.0011);
  const [viewState, setViewState] = useState({
    latitude: hasInitialPoint ? fallbackLat : 24.8607,
    longitude: hasInitialPoint ? fallbackLng : 67.0011,
    zoom: hasInitialPoint ? 11 : 4,
  });

  useEffect(() => {
    if (!open) return;
    const lat = Number(initialLat);
    const lng = Number(initialLng);
    const valid = Number.isFinite(lat) && Number.isFinite(lng);
    const nextLat = valid ? lat : 24.8607;
    const nextLng = valid ? lng : 67.0011;
    setPendingLat(nextLat);
    setPendingLng(nextLng);
    setPendingAddress(initialAddress || "");
    setSearchQuery(initialAddress || "");
    setResults([]);
    setViewState({ latitude: nextLat, longitude: nextLng, zoom: valid ? 11 : 4 });
  }, [open, initialLat, initialLng, initialAddress]);

  useEffect(() => {
    if (!open || !mapboxToken || searchQuery.trim().length < 3) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery.trim())}.json?access_token=${mapboxToken}&autocomplete=true&limit=5`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        setResults((data.features ?? []) as GeocodeFeature[]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery, open, mapboxToken]);

  if (!open) return null;

  const latValid = pendingLat >= -90 && pendingLat <= 90;
  const lngValid = pendingLng >= -180 && pendingLng <= 180;
  const canConfirm = latValid && lngValid;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-4xl rounded-xl border border-border-soft bg-bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-brand-primary">Head Office Location Picker</p>
            <p className="text-xs text-text-secondary">Search place or drop a pin to capture exact coordinates.</p>
          </div>
          <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={onClose}>
            Close
          </button>
        </div>

        {!mapboxToken ? (
          <div className="p-4">
            <div className="rounded-lg border border-state-error/40 bg-state-error/10 p-3 text-sm text-state-error">
              Mapbox token is missing. Set <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to enable map selection.
            </div>
          </div>
        ) : (
          <div className="grid gap-4 p-4 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary">Search location</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-text-secondary" aria-hidden="true" />
                <input
                  className="form-input pl-8"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search address or place"
                />
              </div>
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-border-soft bg-bg-surface-alt p-2">
                {results.length === 0 ? (
                  <p className="px-1 py-1 text-xs text-text-secondary">{isSearching ? "Searching..." : "Type at least 3 characters to search."}</p>
                ) : (
                  results.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full rounded-md px-2 py-1.5 text-left text-xs text-brand-primary hover:bg-bg-page"
                      onClick={() => {
                        const [lng, lat] = item.center;
                        setPendingLat(lat);
                        setPendingLng(lng);
                        setPendingAddress(item.place_name);
                        setViewState({ latitude: lat, longitude: lng, zoom: 12 });
                        setResults([]);
                      }}
                    >
                      {item.place_name}
                    </button>
                  ))
                )}
              </div>
              <div className="rounded-md border border-border-soft bg-bg-surface-alt p-2 text-xs text-text-secondary">
                <p>Latitude: {pendingLat.toFixed(6)}</p>
                <p>Longitude: {pendingLng.toFixed(6)}</p>
                <p className="mt-1 break-words">Address: {pendingAddress || "Not selected"}</p>
              </div>
              <p className="text-xs text-text-secondary">Click map or drag marker to refine location.</p>
            </div>

            <div className="min-h-[360px] overflow-hidden rounded-lg border border-border-soft">
              <Map
                mapboxAccessToken={mapboxToken}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                longitude={viewState.longitude}
                latitude={viewState.latitude}
                zoom={viewState.zoom}
                onMove={(event) => setViewState(event.viewState)}
                onClick={(event) => {
                  setPendingLat(event.lngLat.lat);
                  setPendingLng(event.lngLat.lng);
                  setPendingAddress("");
                }}
                attributionControl
                style={{ width: "100%", height: "100%" }}
              >
                <NavigationControl position="top-right" />
                <Marker
                  longitude={pendingLng}
                  latitude={pendingLat}
                  draggable
                  onDragEnd={(event) => {
                    setPendingLat(event.lngLat.lat);
                    setPendingLng(event.lngLat.lng);
                    setPendingAddress("");
                  }}
                >
                  <MapPinned className="h-5 w-5 text-brand-accent" />
                </Marker>
              </Map>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border-soft px-4 py-3">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canConfirm || !mapboxToken}
            onClick={() =>
              onConfirm({
                lat: pendingLat.toFixed(6),
                lng: pendingLng.toFixed(6),
                address: pendingAddress,
              })
            }
          >
            Confirm location
          </button>
        </div>
      </div>
    </div>
  );
}

function SupplierPortalContent() {
  const {
    eudrFormRequests,
    supplyChainNodes,
    editEudrFormRequest,
    editSupplyChainNode,
    addIntermediaryDeclarationSubmission,
    addFarmerDeclarationSubmission,
    addEudrEvidenceAttachment,
    generateEudrFormRequest,
    propagateChainCompletion,
  } = useSession();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  // Track which upstream entities already have generated form links (entityId -> tokenLabel)
  const [generatedEntityLinks, setGeneratedEntityLinks] = useState<Record<string, { tokenLabel: string; formType: string; url: string }>>({});

  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [activeSection, setActiveSection] = useState(0);
  const [intermediaryForms, setIntermediaryForms] = useState<Record<string, IntermediaryFormState>>({});
  const [farmerForms, setFarmerForms] = useState<Record<string, FarmerFormState>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [locale, setLocale] = useState<SupportedLocale>("en");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  const copy = PORTAL_COPY[locale] ?? PORTAL_COPY.en;
  const isRtl = RTL_LOCALES.has(locale);

  const scopedRequests = token ? eudrFormRequests.filter((request) => request.tokenLabel === token) : [];
  const selectedRequest =
    scopedRequests.find((request) => request.id === selectedRequestId) ?? scopedRequests[0];
  const selectedNode = supplyChainNodes.find((node) => node.id === selectedRequest?.targetNodeId);
  const formType = selectedRequest?.formType ?? "INTERMEDIARY";
  const activeSections = formType === "FARMER" ? farmerSections : intermediarySections;
  const intermediaryForm = selectedRequest ? intermediaryForms[selectedRequest.id] : undefined;
  const farmerForm = selectedRequest ? farmerForms[selectedRequest.id] : undefined;

  useEffect(() => {
    if (scopedRequests.length > 0 && !scopedRequests.some((request) => request.id === selectedRequestId)) {
      setSelectedRequestId(scopedRequests[0].id);
    }
  }, [scopedRequests, selectedRequestId]);

  useEffect(() => {
    const lang = searchParams.get("lang");
    const storedLocale = typeof window !== "undefined" ? window.localStorage.getItem("gfi.portal.locale") : null;
    const resolved = ([lang, storedLocale].find((value): value is string => !!value && SUPPORTED_LOCALES.includes(value as SupportedLocale)) ??
      "en") as SupportedLocale;
    setLocale(resolved);
  }, [searchParams]);

  useEffect(() => {
    const storedIntermediary = localStorage.getItem("gfi_exact_intermediary_forms");
    const storedFarmer = localStorage.getItem("gfi_exact_farmer_forms");
    if (storedIntermediary) {
      const parsed = JSON.parse(storedIntermediary) as Record<string, IntermediaryFormState>;
      const normalized = Object.fromEntries(
        Object.entries(parsed).map(([requestId, form]) => [requestId, ensureIntermediaryUploads(form)]),
      );
      setIntermediaryForms(normalized);
      localStorage.setItem("gfi_exact_intermediary_forms", JSON.stringify(normalized));
    } else {
      setIntermediaryForms({});
    }
    setFarmerForms(storedFarmer ? JSON.parse(storedFarmer) : {});
  }, []);

  useEffect(() => {
    if (!selectedRequest || !selectedNode) return;
    if (selectedRequest.formType === "INTERMEDIARY" && !intermediaryForms[selectedRequest.id]) {
      const next = {
        ...intermediaryForms,
        [selectedRequest.id]: defaultIntermediaryForm(selectedNode.entityName, selectedRequest.email),
      };
      setIntermediaryForms(next);
      localStorage.setItem("gfi_exact_intermediary_forms", JSON.stringify(next));
    }
    if (selectedRequest.formType === "FARMER" && !farmerForms[selectedRequest.id]) {
      const next = {
        ...farmerForms,
        [selectedRequest.id]: defaultFarmerForm(selectedNode.entityName),
      };
      setFarmerForms(next);
      localStorage.setItem("gfi_exact_farmer_forms", JSON.stringify(next));
    }
  }, [selectedRequest, selectedNode, intermediaryForms, farmerForms]);

  const updateIntermediaryForm = (updates: Partial<IntermediaryFormState>) => {
    if (!selectedRequest || !intermediaryForm) return;
    const next = { ...intermediaryForms, [selectedRequest.id]: { ...intermediaryForm, ...updates } };
    setIntermediaryForms(next);
    localStorage.setItem("gfi_exact_intermediary_forms", JSON.stringify(next));
    setLastSavedAt(new Date().toISOString());
    setValidationIssues([]);
  };

  const updateIntermediaryUpload = (
    key: keyof IntermediaryFormState["documentUploads"],
    files: string[],
  ) => {
    if (!intermediaryForm) return;
    updateIntermediaryForm({
      documentUploads: {
        ...intermediaryForm.documentUploads,
        [key]: files,
      },
    });
  };

  const updateFarmerForm = (updates: Partial<FarmerFormState>) => {
    if (!selectedRequest || !farmerForm) return;
    const next = { ...farmerForms, [selectedRequest.id]: { ...farmerForm, ...updates } };
    setFarmerForms(next);
    localStorage.setItem("gfi_exact_farmer_forms", JSON.stringify(next));
    setLastSavedAt(new Date().toISOString());
    setValidationIssues([]);
  };

  const getStepIssues = (stepIndex: number): string[] => {
    if (formType === "INTERMEDIARY") {
      if (!intermediaryForm) return [];
      if (stepIndex === 0) {
        const issues: string[] = [];
        if (intermediaryForm.roles.length === 0) issues.push("Select at least one actor role.");
        if (intermediaryForm.suppliedCommodities.length === 0) issues.push("Select at least one supplied commodity.");
        return issues;
      }
      if (stepIndex === 1) {
        const issues: string[] = [];
        if (!intermediaryForm.legalName.trim()) issues.push("Legal name is required.");
        if (!intermediaryForm.country.trim()) issues.push("Country of registration is required.");
        if (!intermediaryForm.email.trim()) issues.push("Contact email is required.");
        return issues;
      }
      return [];
    }
    if (!farmerForm) return [];
    if (stepIndex === 0) {
      const issues: string[] = [];
      if (!farmerForm.fullName.trim()) issues.push("Producer full name is required.");
      if (!farmerForm.country.trim()) issues.push("Country is required.");
      return issues;
    }
    if (stepIndex === 3) {
      const issues: string[] = [];
      if (farmerForm.plots.length === 0) issues.push("Add at least one plot.");
      if (farmerForm.plots.some((plot) => !plot.plotId.trim())) issues.push("Each plot requires a plot ID.");
      return issues;
    }
    return [];
  };

  const formatLocalDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
  };

  const validateCoordinate = (value: string, type: "lat" | "lng") => {
    if (!value.trim()) return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return type === "lat" ? "Latitude must be a valid number." : "Longitude must be a valid number.";
    if (type === "lat" && (numeric < -90 || numeric > 90)) return "Latitude must be between -90 and 90.";
    if (type === "lng" && (numeric < -180 || numeric > 180)) return "Longitude must be between -180 and 180.";
    return null;
  };

  const addUpstreamRow = () => {
    if (!intermediaryForm) return;
    updateIntermediaryForm({
      upstreamEntities: [
        ...intermediaryForm.upstreamEntities,
        {
          id: `up-${Date.now()}`,
          name: "",
          entityType: "Farm",
          address: "",
          materialName: selectedNode?.materialName ?? "",
          volumeContributionPercent: 100,
          certifiedSupplier: false,
          certificateAttached: false,
        },
      ],
    });
  };

  const addPlotRow = () => {
    if (!farmerForm) return;
    updateFarmerForm({
      plots: [
        ...farmerForm.plots,
        {
          plotId: `Plot ${farmerForm.plots.length + 1}`,
          latitudes: "",
          longitudes: "",
          areaHa: 0,
          commodityGrown: selectedNode?.commodity === "PALM" ? "Oil Palm" : "Cocoa",
          productionVolume: "",
          coordinateType: "FILE",
          fileName: "",
        },
      ],
    });
  };

  const isProducerType = (entityType: UpstreamEntityType) =>
    entityType === "Farm" || entityType === "Cooperative" || entityType === "Estate";

  const submitIntermediary = () => {
    if (!selectedRequest || !selectedNode || !intermediaryForm) return;

    const submission: IntermediaryDeclarationSubmission = {
      id: `inter-sub-${Date.now()}`,
      requestId: selectedRequest.id,
      nodeId: selectedNode.id,
      submittedAt: new Date().toISOString().slice(0, 10),
      sections: {
        section1: { roles: intermediaryForm.roles, suppliedCommodities: intermediaryForm.suppliedCommodities },
        section2: { legalName: intermediaryForm.legalName, country: intermediaryForm.country, email: intermediaryForm.email },
        section3: {
          facilities: intermediaryForm.section3Facilities,
          landDocumentMatrix: intermediaryForm.section3LandDocs,
          legalActions: intermediaryForm.section3LegalActions,
        },
        section4: { licenses: intermediaryForm.licenses, certifications: intermediaryForm.certifications },
        section5A: { purchasedMaterials: intermediaryForm.purchasedMaterials, tradeProof: intermediaryForm.tradeProof, traceabilityCapabilities: intermediaryForm.traceabilityCapabilities },
        section5B: { processingActivity: intermediaryForm.processingActivity, outputProduct: intermediaryForm.outputProduct, firstPointOfSale: intermediaryForm.firstPointOfSale },
        section6: { policies: intermediaryForm.policies },
        section7: { thirdPartyVerification: intermediaryForm.thirdPartyVerification },
        section8: { signatureName: intermediaryForm.signatureName, designation: intermediaryForm.designation, declarationDate: intermediaryForm.declarationDate },
      },
      upstreamEntities: intermediaryForm.upstreamEntities,
      traceabilityControls: intermediaryForm.traceabilityControls,
      signatureName: intermediaryForm.signatureName,
    };

    addIntermediaryDeclarationSubmission(submission);
    editEudrFormRequest({ ...selectedRequest, status: "UNDER_REVIEW" });
    editSupplyChainNode({
      ...selectedNode,
      status: intermediaryForm.upstreamEntities.length === 0 && selectedNode.commodity === "COCOA" ? "GAPS_FOUND" : "SUBMITTED",
    });
    addEudrEvidenceAttachment({
      id: `evid-inter-${Date.now()}`,
      requestId: selectedRequest.id,
      nodeId: selectedNode.id,
      sectionRef: "INTERMEDIARY_SECTION_8",
      documentRole: "INTERMEDIARY_DECLARATION",
      fileName: `${safeId(intermediaryForm.legalName)}-intermediary-declaration.json`,
      status: "ATTACHED",
    });

    // Only generate links for entities that don't already have one
    let newLinksGenerated = 0;
    intermediaryForm.upstreamEntities.forEach((entity) => {
      if (!entity.name.trim()) return;
      if (generatedEntityLinks[entity.id]) return; // already has a link
      const nextFormType = isProducerType(entity.entityType) ? "FARMER" : "INTERMEDIARY";
      generateEudrFormRequest({
        supplierId: `discovered-${safeId(entity.name)}`,
        supplierName: entity.name,
        productId: selectedNode.productId,
        ingredientId: selectedNode.ingredientId,
        commodity: selectedNode.commodity,
        materialName: entity.materialName,
        formType: nextFormType,
        parentNodeId: selectedNode.id,
        parentRequestId: selectedRequest.id,
        entityName: entity.name,
        country: entity.address,
        actorType: nextFormType === "FARMER" ? "FARMER" : "INTERMEDIARY",
        volumeContributionPercent: entity.volumeContributionPercent,
      });
      newLinksGenerated++;
    });

    setNotice(`Intermediary declaration submitted.${newLinksGenerated > 0 ? ` ${newLinksGenerated} new next-tier form link(s) generated.` : " All upstream entity links were already generated."} Chain status updated.`);
    setTimeout(() => setNotice(null), 6000);
  };

  const submitFarmer = () => {
    if (!selectedRequest || !selectedNode || !farmerForm) return;
    const hasBlockingGeo = farmerForm.plots.some((plot) => plot.areaHa > 4 && plot.coordinateType !== "POLYGON" && plot.coordinateType !== "FILE");
    const missingGeo = farmerForm.plots.some((plot) => !plot.latitudes && !plot.fileName);

    const submission: FarmerDeclarationSubmission = {
      id: `farmer-sub-${Date.now()}`,
      requestId: selectedRequest.id,
      nodeId: selectedNode.id,
      submittedAt: new Date().toISOString().slice(0, 10),
      sections: {
        section1: { producerType: farmerForm.producerType, fullName: farmerForm.fullName, country: farmerForm.country },
        section2: { commodities: farmerForm.commodities, harvestYears: farmerForm.harvestYears, annualVolume: farmerForm.annualVolume },
        section3: { landBasis: farmerForm.landBasis, landDocuments: farmerForm.landDocuments },
        section4: { plots: farmerForm.plots },
        section5: { confirmations: farmerForm.deforestationConfirmations, previousLandUse: farmerForm.previousLandUse, boundaryChanged: farmerForm.boundaryChanged },
        section6: { environmentalCompliance: farmerForm.environmentalCompliance },
        section7: { communityRights: farmerForm.communityRights },
        section8: { labourTypes: farmerForm.labourTypes, labourCompliance: farmerForm.labourCompliance },
        section9: { firstPointOfSale: farmerForm.firstPointOfSale, tradeProof: farmerForm.tradeProof, sellingMethod: farmerForm.sellingMethod },
        section10: { certification: farmerForm.certification },
        section11: { disputes: farmerForm.disputes },
        section12: { signatureName: farmerForm.signatureName, declarationDate: farmerForm.declarationDate },
      },
      plotRows: farmerForm.plots,
      signatureName: farmerForm.signatureName,
    };

    addFarmerDeclarationSubmission(submission);
    editEudrFormRequest({ ...selectedRequest, status: "UNDER_REVIEW" });
    const farmerNodeStatus = hasBlockingGeo || missingGeo ? "GAPS_FOUND" : "COMPLETE";
    editSupplyChainNode({ ...selectedNode, status: farmerNodeStatus });
    addEudrEvidenceAttachment({
      id: `evid-farmer-${Date.now()}`,
      requestId: selectedRequest.id,
      nodeId: selectedNode.id,
      sectionRef: "FARMER_SECTION_4",
      documentRole: "GEOLOCATION_FILE",
      fileName: farmerForm.plots[0]?.fileName || `${safeId(farmerForm.fullName)}-manual-plot-entry.json`,
      status: missingGeo ? "MISSING" : "ATTACHED",
    });

    // Propagate completion up the chain if farmer node is COMPLETE
    if (farmerNodeStatus === "COMPLETE") {
      propagateChainCompletion(selectedNode.id);
    }

    setNotice(
      hasBlockingGeo || missingGeo
        ? "Farmer declaration submitted, but geolocation validation still has blocking gaps."
        : "Farmer declaration submitted. This chain branch is now complete - status propagated up the supply chain.",
    );
    setTimeout(() => setNotice(null), 6000);
  };

  const renderCheckboxGroup = (items: string[], selected: string[], onChange: (next: string[]) => void) => (
    <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <label key={item} className="flex min-w-0 cursor-pointer items-start gap-2 text-xs text-brand-primary">
          <input className="mt-0.5" type="checkbox" checked={selected.includes(item)} onChange={() => onChange(toggleArray(item, selected))} />
          <span className="min-w-0 break-words leading-snug">{item}</span>
        </label>
      ))}
    </div>
  );

  const renderIntermediarySection = () => {
    if (!intermediaryForm) return null;
    const section = activeSection;

    if (section === 0) {
      return (
        <>
          <InstructionCard {...INTERMEDIARY_SECTION_INSTRUCTIONS[0]} />
          <InfoRow
            label="1.1 Please indicate your role(s) in the supply chain"
            requirement={INTERMEDIARY_FIELD_META[0].roles.requirement}
            instruction={INTERMEDIARY_FIELD_META[0].roles.instruction}
          >
            {renderCheckboxGroup(roleOptions, intermediaryForm.roles, (roles) => updateIntermediaryForm({ roles }))}
          </InfoRow>
          <InfoRow
            label="1.2 Which EUDR-relevant commodity/product do you supply to the buyer?"
            requirement={INTERMEDIARY_FIELD_META[0].suppliedCommodities.requirement}
            instruction={INTERMEDIARY_FIELD_META[0].suppliedCommodities.instruction}
          >
            {renderCheckboxGroup(commodityOptions, intermediaryForm.suppliedCommodities, (suppliedCommodities) => updateIntermediaryForm({ suppliedCommodities }))}
          </InfoRow>
        </>
      );
    }

    if (section === 1) {
      return (
        <div className="space-y-3">
          <InstructionCard {...INTERMEDIARY_SECTION_INSTRUCTIONS[1]} />
          <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
            <InfoRow label="Legal Name of Company" requirement={INTERMEDIARY_FIELD_META[1].legalName.requirement} instruction={INTERMEDIARY_FIELD_META[1].legalName.instruction}><input className="form-input" value={intermediaryForm.legalName} onChange={(e) => updateIntermediaryForm({ legalName: e.target.value })} /></InfoRow>
            <InfoRow label="Country of Registration" requirement={INTERMEDIARY_FIELD_META[1].country.requirement} instruction={INTERMEDIARY_FIELD_META[1].country.instruction}><input className="form-input" value={intermediaryForm.country} onChange={(e) => updateIntermediaryForm({ country: e.target.value })} /></InfoRow>
            <InfoRow label="Registered Address" requirement={INTERMEDIARY_FIELD_META[1].registeredAddress.requirement} instruction={INTERMEDIARY_FIELD_META[1].registeredAddress.instruction}><input className="form-input" value={intermediaryForm.registeredAddress} onChange={(e) => updateIntermediaryForm({ registeredAddress: e.target.value })} /></InfoRow>
            <InfoRow label="Company Registration Number" requirement={INTERMEDIARY_FIELD_META[1].registrationNumber.requirement} instruction={INTERMEDIARY_FIELD_META[1].registrationNumber.instruction}><input className="form-input" value={intermediaryForm.registrationNumber} onChange={(e) => updateIntermediaryForm({ registrationNumber: e.target.value })} /></InfoRow>
            <InfoRow label="Tax Registration Number" requirement={INTERMEDIARY_FIELD_META[1].taxNumber.requirement} instruction={INTERMEDIARY_FIELD_META[1].taxNumber.instruction}><input className="form-input" value={intermediaryForm.taxNumber} onChange={(e) => updateIntermediaryForm({ taxNumber: e.target.value })} /></InfoRow>
            <InfoRow label="Contact Person" requirement={INTERMEDIARY_FIELD_META[1].contactPerson.requirement} instruction={INTERMEDIARY_FIELD_META[1].contactPerson.instruction}><input className="form-input" value={intermediaryForm.contactPerson} onChange={(e) => updateIntermediaryForm({ contactPerson: e.target.value })} /></InfoRow>
            <InfoRow label="Email" requirement={INTERMEDIARY_FIELD_META[1].email.requirement} instruction={INTERMEDIARY_FIELD_META[1].email.instruction}><input className="form-input" value={intermediaryForm.email} onChange={(e) => updateIntermediaryForm({ email: e.target.value })} /></InfoRow>
            <InfoRow label="Phone" requirement={INTERMEDIARY_FIELD_META[1].phone.requirement} instruction={INTERMEDIARY_FIELD_META[1].phone.instruction}><input className="form-input" value={intermediaryForm.phone} onChange={(e) => updateIntermediaryForm({ phone: e.target.value })} /></InfoRow>
            <InfoRow
              label="Head Office Latitude"
              requirement={INTERMEDIARY_FIELD_META[1].headOfficeLat.requirement}
              instruction={INTERMEDIARY_FIELD_META[1].headOfficeLat.instruction}
            >
              <input className="form-input" value={intermediaryForm.headOfficeLat} onChange={(e) => updateIntermediaryForm({ headOfficeLat: e.target.value })} />
              {validateCoordinate(intermediaryForm.headOfficeLat, "lat") ? (
                <p className="mt-1 text-xs text-state-error">{validateCoordinate(intermediaryForm.headOfficeLat, "lat")}</p>
              ) : null}
            </InfoRow>
            <InfoRow
              label="Head Office Longitude"
              requirement={INTERMEDIARY_FIELD_META[1].headOfficeLng.requirement}
              instruction={INTERMEDIARY_FIELD_META[1].headOfficeLng.instruction}
            >
              <input className="form-input" value={intermediaryForm.headOfficeLng} onChange={(e) => updateIntermediaryForm({ headOfficeLng: e.target.value })} />
              {validateCoordinate(intermediaryForm.headOfficeLng, "lng") ? (
                <p className="mt-1 text-xs text-state-error">{validateCoordinate(intermediaryForm.headOfficeLng, "lng")}</p>
              ) : null}
            </InfoRow>
            <div className="md:col-span-2 space-y-2 rounded-lg border border-border-soft bg-bg-surface-alt p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-brand-primary">Map-based location picker</p>
                <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setIsLocationPickerOpen(true)}>
                  Select on map
                </button>
              </div>
              <InfoRow
                label="Selected head office address"
                requirement={INTERMEDIARY_FIELD_META[1].headOfficeAddress.requirement}
                instruction={INTERMEDIARY_FIELD_META[1].headOfficeAddress.instruction}
              >
                <input className="form-input" value={intermediaryForm.headOfficeAddress} readOnly placeholder="No map address selected yet" />
              </InfoRow>
            </div>
            <InfoRow
              label="Scope of Operations"
              requirement={INTERMEDIARY_FIELD_META[1].operationsScope.requirement}
              instruction={INTERMEDIARY_FIELD_META[1].operationsScope.instruction}
              condition={INTERMEDIARY_FIELD_META[1].operationsScope.condition}
            >
              <input className="form-input" value={intermediaryForm.operationsScope} onChange={(e) => updateIntermediaryForm({ operationsScope: e.target.value })} />
            </InfoRow>
          </div>
        </div>
      );
    }

    if (section === 2) {
      return (
        <div className="space-y-4">
          <InstructionCard
            tone="ifApplicable"
            title="Section 3 applicability"
            items={["Complete this section if you own or operate production, processing, or storage facilities."]}
          />

          <div className="rounded-lg border border-border-soft bg-bg-surface">
            <div className="border-b border-border-soft px-3 py-2">
              <h3 className="text-sm font-semibold text-brand-primary">
                3.1 Do you own, lease or operate any production, processing or storage facilities?
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 bg-bg-surface-alt text-text-secondary">
                  <tr>
                    <th className="border-b border-border-soft px-2 py-2 text-left">Site No.</th>
                    <th className="border-b border-border-soft px-2 py-2 text-left">Site Name</th>
                    <th className="border-b border-border-soft px-2 py-2 text-left">Full Address</th>
                    <th className="border-b border-border-soft px-2 py-2 text-left">Pin Locations</th>
                    <th className="border-b border-border-soft px-2 py-2 text-left">Type of Facility</th>
                    <th className="border-b border-border-soft px-2 py-2 text-left">Operational Status</th>
                  </tr>
                </thead>
                <tbody>
                  {intermediaryForm.section3Facilities.map((row, rowIndex) => (
                    <tr key={`facility-${row.siteNo}`}>
                      <td className="border-b border-border-soft px-2 py-2 text-text-secondary">{row.siteNo}</td>
                      <td className="border-b border-border-soft px-2 py-2">
                        <input
                          className="form-input"
                          value={row.siteName}
                          onChange={(event) => {
                            const next = [...intermediaryForm.section3Facilities];
                            next[rowIndex] = { ...row, siteName: event.target.value };
                            updateIntermediaryForm({ section3Facilities: next });
                          }}
                        />
                      </td>
                      <td className="border-b border-border-soft px-2 py-2">
                        <input
                          className="form-input"
                          value={row.fullAddress}
                          onChange={(event) => {
                            const next = [...intermediaryForm.section3Facilities];
                            next[rowIndex] = { ...row, fullAddress: event.target.value };
                            updateIntermediaryForm({ section3Facilities: next });
                          }}
                        />
                      </td>
                      <td className="border-b border-border-soft px-2 py-2">
                        <input
                          className="form-input"
                          placeholder="31.5204, 74.3587"
                          value={row.pinLocation}
                          onChange={(event) => {
                            const next = [...intermediaryForm.section3Facilities];
                            next[rowIndex] = { ...row, pinLocation: event.target.value };
                            updateIntermediaryForm({ section3Facilities: next });
                          }}
                        />
                      </td>
                      <td className="border-b border-border-soft px-2 py-2">
                        <select
                          className="form-select"
                          value={row.facilityType}
                          onChange={(event) => {
                            const next = [...intermediaryForm.section3Facilities];
                            next[rowIndex] = { ...row, facilityType: event.target.value as FacilityType };
                            updateIntermediaryForm({ section3Facilities: next });
                          }}
                        >
                          <option value="">Select</option>
                          <option value="Production">Production</option>
                          <option value="Processing">Processing</option>
                          <option value="Storage">Storage</option>
                        </select>
                      </td>
                      <td className="border-b border-border-soft px-2 py-2">
                        <div className="flex flex-wrap gap-2">
                          {(["Own", "Lease", "Contract"] as const).map((status) => (
                            <label key={status} className="inline-flex items-center gap-1 text-xs text-brand-primary">
                              <input
                                type="radio"
                                name={`facility-status-${row.siteNo}`}
                                checked={row.operationalStatus === status}
                                onChange={() => {
                                  const next = [...intermediaryForm.section3Facilities];
                                  next[rowIndex] = { ...row, operationalStatus: status };
                                  updateIntermediaryForm({ section3Facilities: next });
                                }}
                              />
                              <span>{status}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-border-soft bg-bg-surface">
            <div className="border-b border-border-soft px-3 py-2">
              <p className="text-sm font-semibold text-brand-primary">If yes, please indicate which documents exist and attach copies.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 bg-bg-surface-alt text-text-secondary">
                  <tr>
                    <th className="border-b border-border-soft px-2 py-2 text-left">Document Type</th>
                    <th className="border-b border-border-soft px-2 py-2 text-left">Exists (Yes/No)</th>
                    <th className="border-b border-border-soft px-2 py-2 text-left">Issuing Authority Name</th>
                    <th className="border-b border-border-soft px-2 py-2 text-left">Document Attached</th>
                  </tr>
                </thead>
                <tbody>
                  {intermediaryForm.section3LandDocs.map((row, rowIndex) => (
                    <tr key={row.id}>
                      <td className="border-b border-border-soft px-2 py-2 text-brand-primary">{row.documentType}</td>
                      <td className="border-b border-border-soft px-2 py-2">
                        <div className="flex gap-3">
                          <label className="inline-flex items-center gap-1">
                            <input
                              type="radio"
                              name={`doc-exists-${row.id}`}
                              checked={row.existsYesNo === "YES"}
                              onChange={() => {
                                const next = [...intermediaryForm.section3LandDocs];
                                next[rowIndex] = { ...row, existsYesNo: "YES" };
                                updateIntermediaryForm({ section3LandDocs: next });
                              }}
                            />
                            <span>Yes</span>
                          </label>
                          <label className="inline-flex items-center gap-1">
                            <input
                              type="radio"
                              name={`doc-exists-${row.id}`}
                              checked={row.existsYesNo === "NO"}
                              onChange={() => {
                                const next = [...intermediaryForm.section3LandDocs];
                                next[rowIndex] = { ...row, existsYesNo: "NO" };
                                updateIntermediaryForm({ section3LandDocs: next });
                              }}
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </td>
                      <td className="border-b border-border-soft px-2 py-2">
                        <input
                          className="form-input"
                          value={row.issuingAuthorityName}
                          onChange={(event) => {
                            const next = [...intermediaryForm.section3LandDocs];
                            next[rowIndex] = { ...row, issuingAuthorityName: event.target.value };
                            updateIntermediaryForm({ section3LandDocs: next });
                          }}
                        />
                      </td>
                      <td className="border-b border-border-soft px-2 py-2">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={row.attached}
                            onChange={(event) => {
                              const next = [...intermediaryForm.section3LandDocs];
                              next[rowIndex] = {
                                ...row,
                                attached: event.target.checked,
                                uploadedFiles: event.target.checked ? row.uploadedFiles : [],
                              };
                              updateIntermediaryForm({ section3LandDocs: next });
                            }}
                          />
                          <span>Attached</span>
                        </label>
                        <div className="mt-2">
                          <DocumentUploadInput
                            value={row.uploadedFiles}
                            onChange={(files) => {
                              const next = [...intermediaryForm.section3LandDocs];
                              next[rowIndex] = { ...row, uploadedFiles: files, attached: files.length > 0 || row.attached };
                              updateIntermediaryForm({ section3LandDocs: next });
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-border-soft bg-bg-surface p-3">
            <p className="text-sm font-semibold text-brand-primary">
              3.2 Have there been any legal disputes, sanctions or enforcement actions related to land, environment, labor or production?
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  name="section3-disputes"
                  checked={intermediaryForm.section3LegalActions.hasDisputes === "no"}
                  onChange={() =>
                    updateIntermediaryForm({
                      section3LegalActions: { ...intermediaryForm.section3LegalActions, hasDisputes: "no" },
                    })
                  }
                />
                <span>No</span>
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  name="section3-disputes"
                  checked={intermediaryForm.section3LegalActions.hasDisputes === "yes"}
                  onChange={() =>
                    updateIntermediaryForm({
                      section3LegalActions: { ...intermediaryForm.section3LegalActions, hasDisputes: "yes" },
                    })
                  }
                />
                <span>Yes (please explain briefly)</span>
              </label>
            </div>
            {intermediaryForm.section3LegalActions.hasDisputes === "yes" ? (
              <textarea
                className="form-input mt-3"
                rows={4}
                value={intermediaryForm.section3LegalActions.disputeExplanation}
                onChange={(event) =>
                  updateIntermediaryForm({
                    section3LegalActions: {
                      ...intermediaryForm.section3LegalActions,
                      disputeExplanation: event.target.value,
                    },
                  })
                }
              />
            ) : null}
            <div className="mt-4 space-y-2 rounded-md border border-border-soft bg-bg-surface-alt p-3 text-sm">
              <p className="font-medium text-brand-primary">
                If yes, attach (if applicable): judicial decisions, administrative rulings, settlement/remediation documents.
              </p>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={intermediaryForm.section3LegalActions.judicialDecisions}
                  onChange={(event) =>
                    updateIntermediaryForm({
                      section3LegalActions: {
                        ...intermediaryForm.section3LegalActions,
                        judicialDecisions: event.target.checked,
                      },
                    })
                  }
                />
                <span>Judicial decisions</span>
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={intermediaryForm.section3LegalActions.administrativeRulings}
                  onChange={(event) =>
                    updateIntermediaryForm({
                      section3LegalActions: {
                        ...intermediaryForm.section3LegalActions,
                        administrativeRulings: event.target.checked,
                      },
                    })
                  }
                />
                <span>Administrative rulings</span>
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={intermediaryForm.section3LegalActions.settlementDocsAttached}
                  onChange={(event) =>
                    updateIntermediaryForm({
                      section3LegalActions: {
                        ...intermediaryForm.section3LegalActions,
                        settlementDocsAttached: event.target.checked,
                      },
                    })
                  }
                />
                <span>Settlement or remediation documents attached</span>
              </label>
              <DocumentUploadInput
                value={intermediaryForm.section3LegalActions.uploadedFiles}
                onChange={(files) =>
                  updateIntermediaryForm({
                    section3LegalActions: {
                      ...intermediaryForm.section3LegalActions,
                      uploadedFiles: files,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      );
    }

    if (section === 3 || section === 5 || section === 6 || section === 7) {
      const fields =
        section === 3
          ? [
              ["Business registration, manufacturing, food safety, environmental and import/export licenses", "licenses"],
              ["Sustainability certification scheme, commodity, certificate number, CoC type and validity", "certifications"],
            ]
          : section === 5
            ? [
                ["Processing/refining/blending/fermentation/chemical modification activity", "processingActivity"],
                ["Input commodity purchased, processing performed and output product supplied", "outputProduct"],
                ["Process flow, environmental plan and latest environmental audit availability", "processingDocuments"],
                ["First point of sale: buyer, buyer type and location", "firstPointOfSale"],
              ]
            : section === 6
              ? [["Policy evidence notes for health and safety, environment, anti-deforestation, labour and due diligence", "thirdPartyVerification"]]
              : [["Certification, third-party audit scope, validity period and attachment notes", "thirdPartyVerification"]];
      return (
        <>
          <InstructionCard {...INTERMEDIARY_SECTION_INSTRUCTIONS[section]} />
          {fields.map(([label, key]) => (
            <InfoRow
              key={key}
              label={label}
              requirement={INTERMEDIARY_FIELD_META[section][key]?.requirement}
              instruction={INTERMEDIARY_FIELD_META[section][key]?.instruction}
              condition={INTERMEDIARY_FIELD_META[section][key]?.condition}
            >
              <textarea className="form-input" rows={3} value={(intermediaryForm as any)[key]} onChange={(e) => updateIntermediaryForm({ [key]: e.target.value } as any)} />
            </InfoRow>
          ))}
          {section === 6 && (
            <InfoRow
              label="Documented company policies"
              requirement={INTERMEDIARY_FIELD_META[6].policies.requirement}
              instruction={INTERMEDIARY_FIELD_META[6].policies.instruction}
              condition={INTERMEDIARY_FIELD_META[6].policies.condition}
            >
              {Object.keys(intermediaryForm.policies).map((key) => (
                <label key={key} className="mr-3 inline-flex max-w-full items-start gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={intermediaryForm.policies[key]}
                    onChange={() => updateIntermediaryForm({ policies: { ...intermediaryForm.policies, [key]: !intermediaryForm.policies[key] } })}
                  />
                  <span className="break-words">{formatIntermediaryOptionLabel(key)}</span>
                </label>
              ))}
            </InfoRow>
          )}
          {section === 3 && (
            <>
              <InfoRow
                label="License/permit document upload"
                requirement={INTERMEDIARY_FIELD_META[3].licensesUpload.requirement}
                instruction={INTERMEDIARY_FIELD_META[3].licensesUpload.instruction}
                condition={INTERMEDIARY_FIELD_META[3].licensesUpload.condition}
              >
                <DocumentUploadInput value={intermediaryForm.documentUploads.licenses} onChange={(files) => updateIntermediaryUpload("licenses", files)} />
              </InfoRow>
              <InfoRow
                label="Certification evidence upload"
                requirement={INTERMEDIARY_FIELD_META[3].certificationsUpload.requirement}
                instruction={INTERMEDIARY_FIELD_META[3].certificationsUpload.instruction}
                condition={INTERMEDIARY_FIELD_META[3].certificationsUpload.condition}
              >
                <DocumentUploadInput value={intermediaryForm.documentUploads.certifications} onChange={(files) => updateIntermediaryUpload("certifications", files)} />
              </InfoRow>
            </>
          )}
          {section === 5 && (
            <InfoRow
              label="Processing and environmental documents upload"
              requirement={INTERMEDIARY_FIELD_META[5].processingUpload.requirement}
              instruction={INTERMEDIARY_FIELD_META[5].processingUpload.instruction}
              condition={INTERMEDIARY_FIELD_META[5].processingUpload.condition}
            >
              <DocumentUploadInput value={intermediaryForm.documentUploads.processing} onChange={(files) => updateIntermediaryUpload("processing", files)} />
            </InfoRow>
          )}
          {section === 6 && (
            <InfoRow
              label="Policy documents upload"
              requirement={INTERMEDIARY_FIELD_META[6].policiesUpload.requirement}
              instruction={INTERMEDIARY_FIELD_META[6].policiesUpload.instruction}
              condition={INTERMEDIARY_FIELD_META[6].policiesUpload.condition}
            >
              <DocumentUploadInput value={intermediaryForm.documentUploads.policies} onChange={(files) => updateIntermediaryUpload("policies", files)} />
            </InfoRow>
          )}
          {section === 7 && (
            <InfoRow
              label="Third-party verification document upload"
              requirement={INTERMEDIARY_FIELD_META[7].thirdPartyVerificationUpload.requirement}
              instruction={INTERMEDIARY_FIELD_META[7].thirdPartyVerificationUpload.instruction}
              condition={INTERMEDIARY_FIELD_META[7].thirdPartyVerificationUpload.condition}
            >
              <DocumentUploadInput
                value={intermediaryForm.documentUploads.thirdPartyVerification}
                onChange={(files) => updateIntermediaryUpload("thirdPartyVerification", files)}
              />
            </InfoRow>
          )}
        </>
      );
    }

    if (section === 4) {
      const handleGenerateEntityLink = (entityRow: UpstreamEntityRow) => {
        if (!selectedNode || !selectedRequest || !entityRow.name.trim()) return;
        const nextFormType = isProducerType(entityRow.entityType) ? "FARMER" : "INTERMEDIARY";
        const request = generateEudrFormRequest({
          supplierId: `discovered-${safeId(entityRow.name)}`,
          supplierName: entityRow.name,
          productId: selectedNode.productId,
          ingredientId: selectedNode.ingredientId,
          commodity: selectedNode.commodity,
          materialName: entityRow.materialName || selectedNode.materialName,
          formType: nextFormType,
          parentNodeId: selectedNode.id,
          parentRequestId: selectedRequest.id,
          entityName: entityRow.name,
          country: entityRow.address,
          actorType: nextFormType === "FARMER" ? "FARMER" : entityRow.entityType === "Mill" ? "MILL" : entityRow.entityType === "Trader" ? "TRADER" : entityRow.entityType === "Processor" ? "PROCESSOR" : entityRow.entityType === "Distributor" ? "DISTRIBUTOR" : entityRow.entityType === "Exporter" ? "EXPORTER" : entityRow.entityType === "Cooperative" ? "COOPERATIVE" : entityRow.entityType === "Estate" ? "ESTATE" : "INTERMEDIARY",
          volumeContributionPercent: entityRow.volumeContributionPercent,
        });
        const url = `${typeof window !== "undefined" ? window.location.origin : ""}/supplier?token=${request.tokenLabel}`;
        setGeneratedEntityLinks(prev => ({
          ...prev,
          [entityRow.id]: { tokenLabel: request.tokenLabel, formType: nextFormType, url },
        }));
        setNotice(`Generated ${nextFormType} form link ${request.tokenLabel} for ${entityRow.name}. Link copied to clipboard.`);
        if (typeof navigator !== "undefined") navigator.clipboard.writeText(url);
        setTimeout(() => setNotice(null), 5000);
      };

      return (
        <>
          <InstructionCard {...INTERMEDIARY_SECTION_INSTRUCTIONS[4]} />
          <InfoRow
            label="5.1 EUDR-relevant commodity/product purchased from upstream suppliers"
            requirement={INTERMEDIARY_FIELD_META[4].purchasedMaterials.requirement}
            instruction={INTERMEDIARY_FIELD_META[4].purchasedMaterials.instruction}
          >
            <textarea className="form-input" rows={3} value={intermediaryForm.purchasedMaterials} onChange={(e) => updateIntermediaryForm({ purchasedMaterials: e.target.value })} />
          </InfoRow>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-brand-primary">5.2 Upstream mill / farm / trader entities (Required)</h3>
            <button type="button" className="btn-secondary" onClick={addUpstreamRow}>Add upstream entity</button>
          </div>
          {intermediaryForm.upstreamEntities.map((row, index) => {
            const entityLink = generatedEntityLinks[row.id];
            // Also check if a child node already exists for this entity in the supply chain
            const existingChildNode = supplyChainNodes.find(
              n => n.parentNodeId === selectedNode?.id && n.entityName === row.name && row.name.trim()
            );
            const existingRequest = existingChildNode ? eudrFormRequests.find(r => r.targetNodeId === existingChildNode.id) : undefined;
            const hasLink = !!entityLink || !!existingRequest;
            const linkToken = entityLink?.tokenLabel || existingRequest?.tokenLabel || "";
            const linkFormType = entityLink?.formType || existingRequest?.formType || "";
            const childStatus = existingChildNode?.status || "NOT_REQUESTED";

            const statusDotClass =
              childStatus === "COMPLETE"
                ? "bg-state-success"
                : childStatus === "SUBMITTED" || childStatus === "IN_PROGRESS"
                  ? "bg-state-warning"
                  : childStatus === "GAPS_FOUND"
                    ? "bg-state-error"
                    : hasLink
                      ? "bg-brand-accent"
                      : "bg-text-secondary";

            return (
              <div key={row.id} className="flex flex-col gap-2.5 rounded-md border border-border-soft p-3">
                <div className="grid w-full min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
                  <input className="form-input" placeholder="Upstream entity name" value={row.name} onChange={(e) => {
                    const rows = [...intermediaryForm.upstreamEntities];
                    rows[index] = { ...row, name: e.target.value };
                    updateIntermediaryForm({ upstreamEntities: rows });
                  }} />
                  <select className="form-select" value={row.entityType} onChange={(e) => {
                    const rows = [...intermediaryForm.upstreamEntities];
                    rows[index] = { ...row, entityType: e.target.value as UpstreamEntityType };
                    updateIntermediaryForm({ upstreamEntities: rows });
                  }}>
                    {["Mill", "Farm", "Trader", "Processor", "Distributor", "Exporter", "Cooperative", "Estate"].map((type) => <option key={type}>{type}</option>)}
                  </select>
                  <input className="form-input" placeholder="Address / origin" value={row.address} onChange={(e) => {
                    const rows = [...intermediaryForm.upstreamEntities];
                    rows[index] = { ...row, address: e.target.value };
                    updateIntermediaryForm({ upstreamEntities: rows });
                  }} />
                  <input className="form-input" type="number" placeholder="% volume" value={row.volumeContributionPercent} onChange={(e) => {
                    const rows = [...intermediaryForm.upstreamEntities];
                    rows[index] = { ...row, volumeContributionPercent: Number(e.target.value) };
                    updateIntermediaryForm({ upstreamEntities: rows });
                  }} />
                </div>
                {/* Per-entity EUDR link generation */}
                <div className="flex min-w-0 flex-wrap items-center gap-2.5 border-t border-border-soft pt-1">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass}`} />
                  {hasLink ? (
                    <>
                      <span className="min-w-0 break-words text-[10px] text-text-secondary">
                        {linkFormType} form - {linkToken}
                        {existingChildNode ? ` - ${childStatus.replace(/_/g, " ")}` : " - LINK SENT"}
                      </span>
                       <button
                         type="button"
                         onClick={() => {
                           const url = entityLink?.url || `${typeof window !== "undefined" ? window.location.origin : ""}/supplier?token=${linkToken}`;
                           navigator.clipboard.writeText(url);
                           setNotice(`Link copied: ${url}`);
                           setTimeout(() => setNotice(null), 3000);
                        }}
                        className="btn-secondary px-2 py-1 text-[10px]"
                      >
                        Copy link
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={!row.name.trim()}
                      onClick={() => handleGenerateEntityLink(row)}
                      className="btn-secondary px-2.5 py-1 text-[10px] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Generate {isProducerType(row.entityType) ? "Farmer" : "Intermediary"} EUDR form link
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <InfoRow
            label="5.3 Trade proof confirmations"
            requirement={INTERMEDIARY_FIELD_META[4].tradeProof.requirement}
            instruction={INTERMEDIARY_FIELD_META[4].tradeProof.instruction}
          >
            {Object.keys(intermediaryForm.tradeProof).map((key) => (
                <label key={key} className="mr-3 inline-flex max-w-full items-start gap-1.5 text-xs">
                <input type="checkbox" checked={intermediaryForm.tradeProof[key]} onChange={() => updateIntermediaryForm({ tradeProof: { ...intermediaryForm.tradeProof, [key]: !intermediaryForm.tradeProof[key] } })} />
                  <span className="break-words">{formatIntermediaryOptionLabel(key)}</span>
                </label>
            ))}
          </InfoRow>
          <InfoRow
            label="5.3 Trade proof document upload"
            requirement={INTERMEDIARY_FIELD_META[4].tradeProofUpload.requirement}
            instruction={INTERMEDIARY_FIELD_META[4].tradeProofUpload.instruction}
          >
            <DocumentUploadInput value={intermediaryForm.documentUploads.tradeProof} onChange={(files) => updateIntermediaryUpload("tradeProof", files)} />
          </InfoRow>
          <InfoRow
            label="5.4 Traceability capabilities"
            requirement={INTERMEDIARY_FIELD_META[4].traceabilityCapabilities.requirement}
            instruction={INTERMEDIARY_FIELD_META[4].traceabilityCapabilities.instruction}
          >
            {Object.keys(intermediaryForm.traceabilityCapabilities).map((key) => (
                <label key={key} className="mr-3 inline-flex max-w-full items-start gap-1.5 text-xs">
                <input type="checkbox" checked={intermediaryForm.traceabilityCapabilities[key]} onChange={() => updateIntermediaryForm({ traceabilityCapabilities: { ...intermediaryForm.traceabilityCapabilities, [key]: !intermediaryForm.traceabilityCapabilities[key] } })} />
                  <span className="break-words">{formatIntermediaryOptionLabel(key)}</span>
                </label>
            ))}
          </InfoRow>
          <InfoRow
            label="Describe segregation and traceability controls to prevent mixing"
            requirement={INTERMEDIARY_FIELD_META[4].traceabilityControls.requirement}
            instruction={INTERMEDIARY_FIELD_META[4].traceabilityControls.instruction}
          >
            <textarea className="form-input" rows={4} value={intermediaryForm.traceabilityControls} onChange={(e) => updateIntermediaryForm({ traceabilityControls: e.target.value })} />
          </InfoRow>
        </>
      );
    }

    return (
      <div className="space-y-3">
        <InstructionCard {...INTERMEDIARY_SECTION_INSTRUCTIONS[8]} />
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
          <InfoRow label="Authorized Name" requirement={INTERMEDIARY_FIELD_META[8].signatureName.requirement} instruction={INTERMEDIARY_FIELD_META[8].signatureName.instruction}><input className="form-input" value={intermediaryForm.signatureName} onChange={(e) => updateIntermediaryForm({ signatureName: e.target.value })} /></InfoRow>
          <InfoRow label="Designation" requirement={INTERMEDIARY_FIELD_META[8].designation.requirement} instruction={INTERMEDIARY_FIELD_META[8].designation.instruction}><input className="form-input" value={intermediaryForm.designation} onChange={(e) => updateIntermediaryForm({ designation: e.target.value })} /></InfoRow>
          <InfoRow label="Company" requirement={INTERMEDIARY_FIELD_META[8].legalName.requirement} instruction={INTERMEDIARY_FIELD_META[8].legalName.instruction}><input className="form-input" value={intermediaryForm.legalName} disabled /></InfoRow>
          <InfoRow label="Date" requirement={INTERMEDIARY_FIELD_META[8].declarationDate.requirement} instruction={INTERMEDIARY_FIELD_META[8].declarationDate.instruction}><input className="form-input" value={intermediaryForm.declarationDate} onChange={(e) => updateIntermediaryForm({ declarationDate: e.target.value })} /></InfoRow>
        </div>
        <div className="text-sm leading-relaxed text-text-secondary">
          The supplier declares that all information, statements and documents are true, complete and accurate, and commits to notify the buyer of material sourcing or legality changes.
        </div>
      </div>
    );
  };

  const renderFarmerSection = () => {
    if (!farmerForm) return null;
    const section = activeSection;
    if (section === 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ minWidth: 0 }}>
          <InfoRow label="1.1 Producer Type"><select className="form-select" value={farmerForm.producerType} onChange={(e) => updateFarmerForm({ producerType: e.target.value })}>{["Individual Smallholder Farmer", "Cooperative / Farmer Group", "Commercial Farm / Estate / Plantation", "Livestock Producer", "Other"].map((type) => <option key={type}>{type}</option>)}</select></InfoRow>
          <InfoRow label="Full Name / Entity"><input className="form-input" value={farmerForm.fullName} onChange={(e) => updateFarmerForm({ fullName: e.target.value })} /></InfoRow>
          <InfoRow label="National ID / Registration"><input className="form-input" value={farmerForm.nationalId} onChange={(e) => updateFarmerForm({ nationalId: e.target.value })} /></InfoRow>
          <InfoRow label="Address"><input className="form-input" value={farmerForm.address} onChange={(e) => updateFarmerForm({ address: e.target.value })} /></InfoRow>
          <InfoRow label="Village / Locality"><input className="form-input" value={farmerForm.locality} onChange={(e) => updateFarmerForm({ locality: e.target.value })} /></InfoRow>
          <InfoRow label="District / Province / Region"><input className="form-input" value={farmerForm.region} onChange={(e) => updateFarmerForm({ region: e.target.value })} /></InfoRow>
          <InfoRow label="Country"><input className="form-input" value={farmerForm.country} onChange={(e) => updateFarmerForm({ country: e.target.value })} /></InfoRow>
          <InfoRow label="Phone Number"><input className="form-input" value={farmerForm.phone} onChange={(e) => updateFarmerForm({ phone: e.target.value })} /></InfoRow>
          <InfoRow label="Farm/cooperative/livestock registration documents"><textarea className="form-input" value={farmerForm.producerDocuments} onChange={(e) => updateFarmerForm({ producerDocuments: e.target.value })} /></InfoRow>
        </div>
      );
    }
    if (section === 1) {
      return (
        <>
          <InfoRow label="2.1 Commodity produced">{renderCheckboxGroup(farmerCommodityOptions, farmerForm.commodities, (commodities) => updateFarmerForm({ commodities }))}</InfoRow>
          <InfoRow label="Harvest / Production Year(s)"><input className="form-input" value={farmerForm.harvestYears} onChange={(e) => updateFarmerForm({ harvestYears: e.target.value })} /></InfoRow>
          <InfoRow label="Annual Production Volume"><input className="form-input" value={farmerForm.annualVolume} onChange={(e) => updateFarmerForm({ annualVolume: e.target.value })} /></InfoRow>
        </>
      );
    }
    if (section === 2) {
      return (
        <>
          <InfoRow label="3.1 Legal basis for using land"><select className="form-select" value={farmerForm.landBasis} onChange={(e) => updateFarmerForm({ landBasis: e.target.value })}>{["Ownership", "Lease", "Customary / Community Land Rights", "Government Allocation", "Other"].map((type) => <option key={type}>{type}</option>)}</select></InfoRow>
          <InfoRow label="3.2 Supporting documents"><textarea className="form-input" rows={4} value={farmerForm.landDocuments} onChange={(e) => updateFarmerForm({ landDocuments: e.target.value })} /></InfoRow>
        </>
      );
    }
    if (section === 3) {
      return (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "var(--text-sm)", color: "var(--fos-primary)" }}>4.2 Plot-wise geolocation details</h3>
            <button className="btn-secondary" type="button" onClick={addPlotRow}>Add plot</button>
          </div>
          {farmerForm.plots.map((plot, index) => (
            <div key={`${plot.plotId}-${index}`} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 w-full" style={{ padding: "10px", border: "1px solid var(--fos-border)", borderRadius: "var(--radius-md)", minWidth: 0 }}>
              {(["plotId", "latitudes", "longitudes", "areaHa", "commodityGrown", "productionVolume"] as const).map((key) => (
                <input key={key} className="form-input" placeholder={key} value={plot[key] as any} type={key === "areaHa" ? "number" : "text"} onChange={(e) => {
                  const plots = [...farmerForm.plots];
                  plots[index] = { ...plot, [key]: key === "areaHa" ? Number(e.target.value) : e.target.value };
                  updateFarmerForm({ plots });
                }} />
              ))}
              <select className="form-select" value={plot.coordinateType} onChange={(e) => {
                const plots = [...farmerForm.plots];
                plots[index] = { ...plot, coordinateType: e.target.value as PlotRow["coordinateType"] };
                updateFarmerForm({ plots });
              }}>
                <option value="POINT">Point coordinates</option>
                <option value="POLYGON">Polygon coordinates</option>
                <option value="FILE">Digital file</option>
              </select>
              <input className="form-input" placeholder=".kml, .geojson, .gpx file name" value={plot.fileName} onChange={(e) => {
                const plots = [...farmerForm.plots];
                plots[index] = { ...plot, fileName: e.target.value };
                updateFarmerForm({ plots });
              }} />
            </div>
          ))}
        </>
      );
    }
    if (section === 4) {
      return (
        <>
          {Object.keys(farmerForm.deforestationConfirmations).map((key) => (
            <label key={key} style={{ display: "flex", gap: "8px", fontSize: "var(--text-sm)", color: "var(--fos-primary)", alignItems: "flex-start", minWidth: 0 }}>
              <input type="checkbox" checked={farmerForm.deforestationConfirmations[key]} onChange={() => updateFarmerForm({ deforestationConfirmations: { ...farmerForm.deforestationConfirmations, [key]: !farmerForm.deforestationConfirmations[key] } })} />
              <span style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>{key}</span>
            </label>
          ))}
          <InfoRow label="5.2 Previous land use"><input className="form-input" value={farmerForm.previousLandUse} onChange={(e) => updateFarmerForm({ previousLandUse: e.target.value })} /></InfoRow>
          <InfoRow label="5.3 Plot boundary changed since 31 Dec 2020?"><input className="form-input" value={farmerForm.boundaryChanged} onChange={(e) => updateFarmerForm({ boundaryChanged: e.target.value })} /></InfoRow>
        </>
      );
    }
    if (section === 5 || section === 7 || section === 8) {
      const group = section === 5 ? farmerForm.environmentalCompliance : section === 7 ? farmerForm.labourCompliance : farmerForm.tradeProof;
      return (
        <>
          {section === 7 && <InfoRow label="8.1 Labour used on farm">{renderCheckboxGroup(["Family labour only", "Permanent hired workers", "Seasonal / temporary workers", "Casual / daily wage workers", "Labour hired through contractor", "No labour used"], farmerForm.labourTypes, (labourTypes) => updateFarmerForm({ labourTypes }))}</InfoRow>}
          {Object.keys(group).map((key) => (
            <InfoRow key={key} label={key}>
              <input className="form-input" value={(group as any)[key].toString()} onChange={(e) => {
                if (section === 5) updateFarmerForm({ environmentalCompliance: { ...farmerForm.environmentalCompliance, [key]: e.target.value } });
                if (section === 7) updateFarmerForm({ labourCompliance: { ...farmerForm.labourCompliance, [key]: e.target.value } });
                if (section === 8) updateFarmerForm({ tradeProof: { ...farmerForm.tradeProof, [key]: e.target.value === "true" } });
              }} />
            </InfoRow>
          ))}
          {section === 8 && (
            <>
              <InfoRow label="9.1 First point of sale"><input className="form-input" value={farmerForm.firstPointOfSale} onChange={(e) => updateFarmerForm({ firstPointOfSale: e.target.value })} /></InfoRow>
              <InfoRow label="9.3 Selling method"><input className="form-input" value={farmerForm.sellingMethod} onChange={(e) => updateFarmerForm({ sellingMethod: e.target.value })} /></InfoRow>
              <InfoRow label="9.4 Ownership transfer point"><input className="form-input" value={farmerForm.ownershipTransfer} onChange={(e) => updateFarmerForm({ ownershipTransfer: e.target.value })} /></InfoRow>
              <InfoRow label="9.5 Tracking methods">{renderCheckboxGroup(["Weighing slip", "Delivery note / receipt", "Farmer ID or code", "Batch or lot number", "None"], farmerForm.trackingMethods, (trackingMethods) => updateFarmerForm({ trackingMethods }))}</InfoRow>
            </>
          )}
        </>
      );
    }
    if (section === 6 || section === 9 || section === 10) {
      return (
        <>
          {section === 6 && <InfoRow label="7.1 Indigenous peoples or local community rights"><textarea className="form-input" value={farmerForm.communityRights} onChange={(e) => updateFarmerForm({ communityRights: e.target.value })} /></InfoRow>}
          {section === 9 && <InfoRow label="10.1 Sustainability certification held"><textarea className="form-input" value={farmerForm.certification} onChange={(e) => updateFarmerForm({ certification: e.target.value })} /></InfoRow>}
          {section === 10 && <InfoRow label="11.1 Legal disputes, sanctions or enforcement actions"><textarea className="form-input" value={farmerForm.disputes} onChange={(e) => updateFarmerForm({ disputes: e.target.value })} /></InfoRow>}
        </>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ minWidth: 0 }}>
        <InfoRow label="Producer Name"><input className="form-input" value={farmerForm.signatureName} onChange={(e) => updateFarmerForm({ signatureName: e.target.value })} /></InfoRow>
        <InfoRow label="National ID / Registration"><input className="form-input" value={farmerForm.nationalId} onChange={(e) => updateFarmerForm({ nationalId: e.target.value })} /></InfoRow>
        <InfoRow label="Date"><input className="form-input" value={farmerForm.declarationDate} onChange={(e) => updateFarmerForm({ declarationDate: e.target.value })} /></InfoRow>
        <div style={{ gridColumn: "1 / -1", color: "var(--fos-text-secondary)", fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
          The producer declares the commodity was produced on declared geolocated plots and that no deforestation or conversion occurred after 31 December 2020.
        </div>
      </div>
    );
  };

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--fos-bg-page)", padding: "var(--space-8)" }}>
        <div className="fos-card">{copy.noAccess}</div>
      </div>
    );
  }

  if (!selectedRequest || !selectedNode || selectedRequest.expiresAt < new Date().toISOString().slice(0, 10)) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--fos-bg-page)", padding: "var(--space-8)" }}>
        <div className="fos-card">{copy.invalidToken}</div>
      </div>
    );
  }

  return (
    <NextIntlClientProvider locale={locale} messages={{ portal: copy }}>
      <div dir={isRtl ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "var(--fos-bg-page)", display: "flex", flexDirection: "column" }}>
        <AppTopbar
          variant="portal"
          portalTitle={formType === "FARMER" ? "Agricultural producer / farmer form" : "Intermediary actor declaration form"}
          portalSubtitle={copy.portalTitle}
          languageLabel={copy.language}
          locale={locale}
          locales={SUPPORTED_LOCALES}
          onLocaleChange={(next) => {
            const nextLocale = next as SupportedLocale;
            setLocale(nextLocale);
            localStorage.setItem("gfi.portal.locale", nextLocale);
          }}
          backHref="/dashboard"
          backLabel={copy.back}
          scopeLabel={copy.scopedAccess}
          requestStatusLabel={selectedRequest.status.replace(/_/g, " ")}
          requestStatusTone={
            selectedRequest.status === "CLOSED"
              ? "success"
              : selectedRequest.status === "CHANGES_REQUESTED"
                ? "danger"
                : selectedRequest.status === "UNDER_REVIEW"
                  ? "warning"
                  : "info"
          }
        />

      <main className="mx-auto w-full max-w-[1380px] p-4 md:p-8 flex flex-col lg:grid lg:grid-cols-[minmax(280px,330px)_minmax(0,1fr)] gap-6 lg:items-start" style={{ boxSizing: "border-box" }}>
        <aside className="fos-card w-full" style={{ display: "grid", gap: "var(--space-4)", minWidth: 0 }}>
          <h2 style={{ fontSize: "var(--text-md)", fontWeight: 800, color: "var(--fos-primary)" }}>{copy.scopedAccess}</h2>
          {scopedRequests.map((request) => {
            const node = supplyChainNodes.find((item) => item.id === request.targetNodeId);
            return (
              <button
                key={request.id}
                onClick={() => {
                  setSelectedRequestId(request.id);
                  setActiveSection(0);
                }}
                style={{ textAlign: "left", padding: "14px", borderRadius: "var(--radius-md)", border: `1px solid ${selectedRequest.id === request.id ? "var(--fos-accent)" : "var(--fos-border)"}`, background: selectedRequest.id === request.id ? "rgba(0, 59, 43, 0.04)" : "var(--fos-surface)", cursor: "pointer", display: "grid", gap: "6px" }}
              >
                <strong style={{ color: "var(--fos-primary)", fontSize: "var(--text-sm)" }}>{node?.entityName ?? request.targetSupplierId}</strong>
                <span style={{ fontSize: "11px", color: "var(--fos-text-secondary)" }}>{request.formType} | {request.tokenLabel}</span>
                <span className={`status-badge status-${request.status === "CLOSED" ? "ready" : request.status === "CHANGES_REQUESTED" ? "blocked" : "review-required"}`}>
                  {request.status.replace(/_/g, " ")}
                </span>
              </button>
            );
          })}
        </aside>

        <section className="fos-card w-full" style={{ display: "grid", gap: "var(--space-5)", minWidth: 0 }}>
          {notice && (
            <div style={{ padding: "12px", border: "1px solid var(--fos-accent)", borderRadius: "var(--radius-md)", color: "var(--fos-primary)", background: "rgba(217, 242, 79, 0.1)", fontWeight: 700 }}>
              {notice}
            </div>
          )}
          <div className="flex items-center justify-between rounded-md border border-border-soft bg-bg-surface-alt px-3 py-2 text-xs font-semibold text-text-secondary">
            <span>{copy.saveState}</span>
            <span>{lastSavedAt ? formatLocalDateTime(lastSavedAt) : "-"}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-5 pb-4" style={{ borderBottom: "1px solid var(--fos-border)", minWidth: 0 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Token {selectedRequest.tokenLabel}
              </p>
              <h1 style={{ fontSize: "var(--text-2xl)", color: "var(--fos-primary)", fontWeight: 900 }}>{selectedNode.entityName}</h1>
              <p style={{ color: "var(--fos-text-secondary)", fontSize: "var(--text-sm)", lineHeight: 1.65 }}>
                Tier {selectedNode.tier} | {selectedNode.materialName} | {selectedNode.commodity} | request expires {selectedRequest.expiresAt}
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "10px", minWidth: 0 }}>
              <div style={{ padding: "12px", border: "1px solid var(--fos-border)", borderRadius: "var(--radius-md)" }}>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>{copy.formType}</p>
                <strong>{selectedRequest.formType}</strong>
              </div>
              <div style={{ padding: "12px", border: "1px solid var(--fos-border)", borderRadius: "var(--radius-md)" }}>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>{copy.chainStatus}</p>
                <strong>{selectedNode.status.replace(/_/g, " ")}</strong>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border-soft bg-bg-surface p-3" style={{ minWidth: 0, overflow: "hidden" }}>
            <div className="mb-3 flex items-center justify-between text-xs font-semibold text-text-secondary">
              <span>
                Step {activeSection + 1} of {activeSections.length}
              </span>
              <span>{Math.round(((activeSection + 1) / activeSections.length) * 100)}% complete</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 stepper-scrollbar" style={{ width: "100%", minWidth: 0 }}>
              {activeSections.map((section, index) => {
                const stepIssues = getStepIssues(index);
                const isComplete = index < activeSection && stepIssues.length === 0;
                const isCurrent = index === activeSection;
                const stepLabel = section.replace(/^Section\s+\d+\s*-\s*/i, "");
                return (
                  <button
                    key={section}
                    onClick={() => setActiveSection(index)}
                    aria-current={isCurrent ? "step" : undefined}
                    className={[
                      "inline-flex min-w-[150px] items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-xs font-semibold transition-colors duration-150",
                      isCurrent
                        ? "border-brand-accent bg-brand-accent-soft text-brand-primary shadow-[inset_0_0_0_1px_rgba(0,59,43,0.06)]"
                        : isComplete
                          ? "border-state-success/50 bg-state-success/10 text-state-success"
                          : "border-border-soft bg-bg-surface-alt text-text-secondary hover:border-border-strong hover:text-text-primary",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold leading-none",
                        isCurrent
                          ? "bg-brand-accent text-brand-primary"
                          : isComplete
                            ? "bg-state-success text-white"
                            : "bg-bg-page text-text-secondary",
                      ].join(" ")}
                    >
                      {isComplete ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
                    </span>
                    <span className="line-clamp-2">{stepLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {validationIssues.length > 0 ? (
            <div className="rounded-md border border-state-error/40 bg-state-error/10 p-3 text-sm text-state-error">
              <p className="font-semibold">{copy.issuesTitle}</p>
              <ul className="mt-2 list-disc pl-5">
                {validationIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--fos-primary)" }}>{activeSections[activeSection]}</h2>
            {formType === "FARMER" ? renderFarmerSection() : renderIntermediarySection()}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", borderTop: "1px solid var(--fos-border)", paddingTop: "16px" }}>
            <button className="btn-secondary" disabled={activeSection === 0} onClick={() => setActiveSection((value) => Math.max(0, value - 1))}>
              {copy.prev}
            </button>
            <div style={{ display: "flex", gap: "10px" }}>
              {activeSection < activeSections.length - 1 ? (
                <button
                  className="btn-primary"
                  onClick={() => {
                    const issues = getStepIssues(activeSection);
                    if (issues.length > 0) {
                      setValidationIssues(issues);
                      return;
                    }
                    setValidationIssues([]);
                    setActiveSection((value) => Math.min(activeSections.length - 1, value + 1));
                  }}
                >
                  {copy.next}
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => {
                    const issues = getStepIssues(activeSection);
                    if (issues.length > 0) {
                      setValidationIssues(issues);
                      return;
                    }
                    setValidationIssues([]);
                    if (formType === "FARMER") {
                      submitFarmer();
                    } else {
                      submitIntermediary();
                    }
                  }}
                >
                  {copy.submit}
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {formType === "INTERMEDIARY" && intermediaryForm ? (
        <LocationPickerModal
          open={isLocationPickerOpen}
          initialLat={intermediaryForm.headOfficeLat}
          initialLng={intermediaryForm.headOfficeLng}
          initialAddress={intermediaryForm.headOfficeAddress}
          onClose={() => setIsLocationPickerOpen(false)}
          onConfirm={({ lat, lng, address }) => {
            updateIntermediaryForm({
              headOfficeLat: lat,
              headOfficeLng: lng,
              headOfficeAddress: address,
            });
            setIsLocationPickerOpen(false);
          }}
        />
      ) : null}

      <footer className="mx-auto mb-6 w-full max-w-[1380px] px-4 md:px-8 flex justify-center">
        <DevelopedByFooter className="border-border-soft bg-bg-surface text-text-secondary" />
      </footer>
    </div>
    </NextIntlClientProvider>
  );
}

export default function SupplierPortalPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "var(--fos-bg-page)", padding: "var(--space-8)" }}>
          <div className="fos-card">{PORTAL_COPY.en.loading}</div>
        </div>
      }
    >
      <SupplierPortalContent />
    </Suspense>
  );
}

