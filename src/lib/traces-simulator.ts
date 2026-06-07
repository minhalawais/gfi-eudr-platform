export type DdsSubmissionStatus =
  | "DRAFT"
  | "READY_FOR_TRACES"
  | "SUBMITTING"
  | "TRACES_SUBMITTED"
  | "SUBMISSION_FAILED";

export interface DdsPayloadSummary {
  productName: string;
  ingredientName: string;
  supplierName: string;
  originCountries: string[];
  euRiskTier: string;
  dueDiligenceMode: string;
  plotCount: number;
  evidenceCount: number;
  legalityStatus: string;
}

export interface TracesSimulationSuccess {
  accepted: true;
  tracesReferenceCode: string;
  submittedAt: string;
  operatorEori: string;
  message: string;
}

export interface TracesSimulationFailure {
  accepted: false;
  submittedAt: string;
  blockers: string[];
  message: string;
}

export function buildTracesReferenceCode(input: { filedAt: Date; filingCountryCode?: string; seed?: number }): string {
  const year = input.filedAt.getFullYear();
  const filingCountryCode = (input.filingCountryCode ?? "DE").toUpperCase();
  const seed = Math.abs(input.seed ?? Math.floor(input.filedAt.getTime() / 1000));
  const suffix = `${seed}`.slice(-7).padStart(7, "0");
  return `EUDR-${year}-${filingCountryCode}-${suffix}`;
}

export function simulateTracesSubmission(input: {
  payload: DdsPayloadSummary;
  operatorEori: string;
  filingCountryCode?: string;
  now?: Date;
}): TracesSimulationSuccess | TracesSimulationFailure {
  const now = input.now ?? new Date();
  const blockers: string[] = [];

  if (input.payload.originCountries.length === 0) {
    blockers.push("At least one origin country is required before TRACES submission.");
  }
  if (!input.payload.legalityStatus || input.payload.legalityStatus === "MISSING") {
    blockers.push("Legality dossier evidence is incomplete for the selected ingredient.");
  }
  if (!input.operatorEori) {
    blockers.push("Operator EORI is missing from the DDS filing payload.");
  }

  if (blockers.length > 0) {
    return {
      accepted: false,
      submittedAt: now.toISOString(),
      blockers,
      message: "TRACES simulation rejected the submission because required filing fields are incomplete.",
    };
  }

  return {
    accepted: true,
    tracesReferenceCode: buildTracesReferenceCode({
      filedAt: now,
      filingCountryCode: input.filingCountryCode,
      seed: `${input.payload.productName}-${input.payload.ingredientName}-${input.payload.originCountries.join("-")}`
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0) + now.getDate(),
    }),
    submittedAt: now.toISOString(),
    operatorEori: input.operatorEori,
    message: `Simulated TRACES NT accepted the DDS filing for ${input.payload.ingredientName}.`,
  };
}
