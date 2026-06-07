export type EuCountryRiskTier = "LOW" | "STANDARD" | "HIGH" | "UNKNOWN";
export type DueDiligenceMode = "SIMPLIFIED" | "STANDARD" | "ENHANCED";

export interface CountryRiskEntry {
  country: string;
  tier: Exclude<EuCountryRiskTier, "UNKNOWN">;
  sourceLabel: string;
  lastReviewedAt: string;
}

const RISK_ORDER: Record<EuCountryRiskTier, number> = {
  UNKNOWN: 0,
  LOW: 1,
  STANDARD: 2,
  HIGH: 3,
};

export const EU_COUNTRY_RISK_REGISTRY: CountryRiskEntry[] = [
  { country: "Pakistan", tier: "LOW", sourceLabel: "EU Commission benchmark mirror", lastReviewedAt: "2026-01-15" },
  { country: "Germany", tier: "LOW", sourceLabel: "EU Commission benchmark mirror", lastReviewedAt: "2026-01-15" },
  { country: "Netherlands", tier: "LOW", sourceLabel: "EU Commission benchmark mirror", lastReviewedAt: "2026-01-15" },
  { country: "Malaysia", tier: "STANDARD", sourceLabel: "EU Commission benchmark mirror", lastReviewedAt: "2026-01-15" },
  { country: "Ghana", tier: "STANDARD", sourceLabel: "EU Commission benchmark mirror", lastReviewedAt: "2026-01-15" },
  { country: "Cote d'Ivoire", tier: "HIGH", sourceLabel: "EU Commission benchmark mirror", lastReviewedAt: "2026-01-15" },
  { country: "Ivory Coast", tier: "HIGH", sourceLabel: "EU Commission benchmark mirror", lastReviewedAt: "2026-01-15" },
  { country: "Indonesia", tier: "HIGH", sourceLabel: "EU Commission benchmark mirror", lastReviewedAt: "2026-01-15" },
  { country: "Brazil", tier: "STANDARD", sourceLabel: "EU Commission benchmark mirror", lastReviewedAt: "2026-01-15" },
  { country: "Colombia", tier: "STANDARD", sourceLabel: "EU Commission benchmark mirror", lastReviewedAt: "2026-01-15" },
  { country: "Peru", tier: "STANDARD", sourceLabel: "EU Commission benchmark mirror", lastReviewedAt: "2026-01-15" },
  { country: "Ecuador", tier: "STANDARD", sourceLabel: "EU Commission benchmark mirror", lastReviewedAt: "2026-01-15" },
];

export function getCountryRiskEntry(country: string): CountryRiskEntry | null {
  const normalized = country.trim().toLowerCase();
  return EU_COUNTRY_RISK_REGISTRY.find((entry) => entry.country.toLowerCase() === normalized) ?? null;
}

export function getCountryRiskTier(country: string): EuCountryRiskTier {
  return getCountryRiskEntry(country)?.tier ?? "UNKNOWN";
}

export function deriveIngredientRiskTier(originCountries: string[]): EuCountryRiskTier {
  if (originCountries.length === 0) return "UNKNOWN";
  return originCountries.reduce<EuCountryRiskTier>((highest, country) => {
    const tier = getCountryRiskTier(country);
    return RISK_ORDER[tier] > RISK_ORDER[highest] ? tier : highest;
  }, "UNKNOWN");
}

export function getDueDiligenceMode(tier: EuCountryRiskTier): DueDiligenceMode {
  if (tier === "LOW") return "SIMPLIFIED";
  if (tier === "HIGH") return "ENHANCED";
  return "STANDARD";
}
