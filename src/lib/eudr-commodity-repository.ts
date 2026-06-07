import type { CommodityCode, IngredientRecord } from "@/lib/gfi-dummy-data";

export interface EudrCommodityRepositoryRow {
  commodity: Exclude<CommodityCode, "NONE">;
  hsCodes: string;
  annexSignal: string;
  examples: string;
  operatorExpectation: string;
}

export interface ComplianceChecklistItem {
  id: string;
  label: string;
  detail: string;
  tone: "ready" | "under_review" | "blocked" | "info";
}

export const EUDR_COMMODITY_REPOSITORY: EudrCommodityRepositoryRow[] = [
  {
    commodity: "COCOA",
    hsCodes: "18, 1801, 1803, 1804, 1805, 1806",
    annexSignal: "Annex I cocoa and cocoa-derived product families",
    examples: "Cocoa beans, cocoa paste, cocoa butter, cocoa powder, chocolate inputs",
    operatorExpectation: "Collect grower traceability, geolocation, legality evidence, and forest-clear verification before DDS filing.",
  },
  {
    commodity: "PALM",
    hsCodes: "1511, 151321, 151329, 120710, 230660, 291570, 382311, 382312, 382319, 382370",
    annexSignal: "Annex I oil palm product families",
    examples: "Palm oil, palm kernel oil, palm-derived industrial ingredients",
    operatorExpectation: "Parcel validation and deforestation review are expected, especially for plantation and mill-linked sourcing.",
  },
  {
    commodity: "COFFEE",
    hsCodes: "0901",
    annexSignal: "Annex I coffee families",
    examples: "Green coffee, roasted coffee, coffee husks and skins where applicable",
    operatorExpectation: "Maintain farm origin mapping, legality proof, and chain-of-custody evidence for operator declarations.",
  },
  {
    commodity: "SOYA",
    hsCodes: "1201, 120810, 1507, 2304",
    annexSignal: "Annex I soya families",
    examples: "Soybeans, soy meal, soy oil, protein concentrates",
    operatorExpectation: "Confirm farm or estate origin, legal land use, and no post-cutoff deforestation before export claims.",
  },
  {
    commodity: "RUBBER",
    hsCodes: "400",
    annexSignal: "Annex I natural rubber families",
    examples: "Natural rubber latex, sheets, technical rubber inputs",
    operatorExpectation: "Retain polygon-level origin evidence where possible and validate upstream production traceability.",
  },
  {
    commodity: "WOOD",
    hsCodes: "44",
    annexSignal: "Annex I wood and wood-derived product families",
    examples: "Logs, timber, plywood, wood pulp derivatives where applicable",
    operatorExpectation: "Support legality, concession traceability, and harvest-area verification before operator filing.",
  },
  {
    commodity: "CATTLE",
    hsCodes: "01, 02, 160250, 410, 9406",
    annexSignal: "Annex I cattle and cattle-derived families",
    examples: "Live cattle, beef products, hides, leather-related entries covered by Annex I",
    operatorExpectation: "Demonstrate ranch or herd origin, land-use legality, and conversion-free sourcing evidence.",
  },
];

export function getApplicabilityTone(relevance: IngredientRecord["relevance"]) {
  if (relevance === "IN_SCOPE") return "ready";
  if (relevance === "UNDER_REVIEW") return "under_review";
  return "info";
}

export function getApplicabilityLabel(relevance: IngredientRecord["relevance"]) {
  if (relevance === "IN_SCOPE") return "In Scope";
  if (relevance === "UNDER_REVIEW") return "Under Review";
  return "Out of Scope";
}

export function getApplicabilityCopy(ingredient: IngredientRecord) {
  if (ingredient.relevance === "IN_SCOPE") {
    return `This ingredient maps to the EUDR ${ingredient.commodity} commodity family. Full legality, geolocation, deforestation, and DDS evidence should remain active.`;
  }
  if (ingredient.relevance === "UNDER_REVIEW") {
    return `This ingredient has a possible ${ingredient.commodity === "NONE" ? "EUDR" : ingredient.commodity} signal, but the HS path still requires compliance review before operator treatment is finalized.`;
  }
  return "This ingredient does not currently map to an EUDR Annex I commodity. Preserve classification evidence, but enhanced geolocation and DDS filing steps are not required unless scope changes.";
}

export function buildEudrChecklist(input: {
  ingredient: IngredientRecord;
  plotCount: number;
  approvedPlotCount: number;
  clearPlotCount: number;
  evidenceCount: number;
  dossierCompletionPercent: number;
}) {
  const { ingredient, plotCount, approvedPlotCount, clearPlotCount, evidenceCount, dossierCompletionPercent } = input;

  if (ingredient.relevance === "OUT_OF_SCOPE") {
    return [
      {
        id: "hs-audit",
        label: "HS Code Classification Audit",
        detail: "Out of Scope Confirmed",
        tone: "ready",
      },
      {
        id: "commodity-signal",
        label: "EUDR Commodity Signal",
        detail: "No Annex I commodity matched",
        tone: "info",
      },
      {
        id: "plot-presence",
        label: "Grower Coordinate Polygons Presence",
        detail: "Not Required",
        tone: "info",
      },
      {
        id: "deforestation",
        label: "Satellite Deforestation Scan Status",
        detail: "Not Required",
        tone: "info",
      },
      {
        id: "dossier",
        label: "Legality / Classification Record",
        detail: evidenceCount > 0 ? `${evidenceCount} supporting files retained` : "Classification archive recommended",
        tone: evidenceCount > 0 ? "ready" : "under_review",
      },
    ] satisfies ComplianceChecklistItem[];
  }

  return [
    {
      id: "hs-audit",
      label: "HS Code Classification Audit",
      detail: ingredient.relevance === "IN_SCOPE" ? "Passed" : "Manual Review Required",
      tone: ingredient.relevance === "IN_SCOPE" ? "ready" : "under_review",
    },
    {
      id: "commodity-signal",
      label: "EUDR Commodity Mapping",
      detail: ingredient.relevance === "IN_SCOPE" ? `${ingredient.commodity} matched` : `${ingredient.commodity === "NONE" ? "Potential" : ingredient.commodity} signal pending sign-off`,
      tone: ingredient.relevance === "IN_SCOPE" ? "ready" : "under_review",
    },
    {
      id: "plot-presence",
      label: "Grower Coordinate Polygons Presence",
      detail: plotCount === 0 ? "No plots linked" : `${approvedPlotCount}/${plotCount} plots approved`,
      tone: plotCount === 0 ? "blocked" : approvedPlotCount === plotCount ? "ready" : "under_review",
    },
    {
      id: "deforestation",
      label: "Satellite Deforestation Scan Status",
      detail: plotCount === 0 ? "Awaiting mapped plots" : clearPlotCount === plotCount ? "CLEAR Mapped" : clearPlotCount > 0 ? `${clearPlotCount}/${plotCount} clear` : "Pending review",
      tone: plotCount === 0 ? "blocked" : clearPlotCount === plotCount ? "ready" : "under_review",
    },
    {
      id: "dossier",
      label: "Legality Dossier Coverage",
      detail: `${dossierCompletionPercent}% verified`,
      tone: dossierCompletionPercent >= 100 ? "ready" : dossierCompletionPercent >= 50 ? "under_review" : "blocked",
    },
  ] satisfies ComplianceChecklistItem[];
}
