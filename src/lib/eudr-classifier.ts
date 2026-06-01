import type { CommodityCode, IngredientRecord } from "@/lib/gfi-dummy-data";

type Relevance = IngredientRecord["relevance"];

export interface IngredientClassification {
  commodity: CommodityCode;
  relevance: Relevance;
  classificationSource: "annex_i_rule" | "manual_review";
  classificationNote: string;
  confidence: "high" | "medium";
}

const HS_PREFIX_RULES: Array<{ prefixes: string[]; commodity: Exclude<CommodityCode, "NONE">; note: string }> = [
  { prefixes: ["18"], commodity: "COCOA", note: "HS family maps to cocoa in Annex I." },
  { prefixes: ["1511", "151321", "151329", "120710", "230660", "291570", "382311", "382312", "382319", "382370"], commodity: "PALM", note: "HS family maps to oil palm in Annex I." },
  { prefixes: ["0901"], commodity: "COFFEE", note: "HS family maps to coffee in Annex I." },
  { prefixes: ["1201", "120810", "1507", "2304"], commodity: "SOYA", note: "HS family maps to soya in Annex I." },
  { prefixes: ["400"], commodity: "RUBBER", note: "HS family maps to rubber in Annex I." },
  { prefixes: ["44"], commodity: "WOOD", note: "HS family maps to wood in Annex I." },
  { prefixes: ["01", "02", "160250", "410", "9406"], commodity: "CATTLE", note: "HS family maps to cattle-derived products in Annex I." },
];

function normalizeHs(rawHs: string): string {
  return rawHs.replace(/[^0-9]/g, "");
}

function inferByName(name: string): CommodityCode | null {
  const value = name.toLowerCase();
  if (value.includes("cocoa")) return "COCOA";
  if (value.includes("palm")) return "PALM";
  if (value.includes("coffee")) return "COFFEE";
  if (value.includes("soya") || value.includes("soy")) return "SOYA";
  if (value.includes("rubber")) return "RUBBER";
  if (value.includes("wood")) return "WOOD";
  if (value.includes("beef") || value.includes("cattle")) return "CATTLE";
  return null;
}

export function classifyIngredientEudr(name: string, hsCode: string): IngredientClassification {
  const normalizedHs = normalizeHs(hsCode);
  const reviewPath = hsCode.toLowerCase().includes("review");
  const nameHit = inferByName(name);

  if (reviewPath) {
    return {
      commodity: nameHit ?? "NONE",
      relevance: "UNDER_REVIEW",
      classificationSource: "manual_review",
      classificationNote: "HS path is ambiguous and marked for legal/compliance review.",
      confidence: "medium",
    };
  }

  for (const rule of HS_PREFIX_RULES) {
    if (rule.prefixes.some((prefix) => normalizedHs.startsWith(prefix))) {
      return {
        commodity: rule.commodity,
        relevance: "IN_SCOPE",
        classificationSource: "annex_i_rule",
        classificationNote: rule.note,
        confidence: "high",
      };
    }
  }

  if (nameHit) {
    return {
      commodity: nameHit,
      relevance: "UNDER_REVIEW",
      classificationSource: "manual_review",
      classificationNote: "Name indicates a relevant commodity but HS code is not mapped with high confidence.",
      confidence: "medium",
    };
  }

  return {
    commodity: "NONE",
    relevance: "OUT_OF_SCOPE",
    classificationSource: "annex_i_rule",
    classificationNote: "No Annex I commodity signal identified from HS or material name.",
    confidence: "high",
  };
}

