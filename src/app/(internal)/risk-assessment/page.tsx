"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/ui/PermissionGuard";
import { getScenarioData, RiskSubjectRecord } from "@/lib/gfi-dummy-data";
import {
  Button,
  Card,
  RiskBadge,
  SectionHeader,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  Tag,
} from "@/components/ui";
import type { RiskTone, StatusTone } from "@/lib/ui-semantics";

type PillarRating = "NEGLIGIBLE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const WORKFLOW_STATUS_MAP: Record<"ACTIVE" | "MITIGATION_PENDING" | "BLOCKING", StatusTone> = {
  ACTIVE: "active",
  MITIGATION_PENDING: "pending",
  BLOCKING: "blocked",
};

const RISK_LEVEL_MAP: Record<PillarRating | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL", RiskTone> = {
  NEGLIGIBLE: "negligible",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function scoreToWidthClass(score: number) {
  if (score >= 95) return "w-[95%]";
  if (score >= 90) return "w-[90%]";
  if (score >= 85) return "w-[85%]";
  if (score >= 80) return "w-[80%]";
  if (score >= 75) return "w-[75%]";
  if (score >= 70) return "w-[70%]";
  if (score >= 65) return "w-[65%]";
  if (score >= 60) return "w-[60%]";
  if (score >= 50) return "w-[50%]";
  if (score >= 40) return "w-[40%]";
  return "w-[25%]";
}

export default function RiskAssessmentPage() {
  const { scenarioId, supplyChainNodes, eudrFormRequests } = useSession();
  const scenarioData = getScenarioData(scenarioId);
  const { riskSubjects } = scenarioData;

  const generatedChainRiskSubjects: RiskSubjectRecord[] = useMemo(
    () =>
      supplyChainNodes.map((node) => {
        const request = eudrFormRequests.find((item) => item.targetNodeId === node.id);
        const hasGap = node.status === "GAPS_FOUND" || node.status === "BLOCKED" || node.status === "REQUESTED";
        return {
          id: `risk-chain-${node.id}`,
          subjectType: "SUPPLIER",
          subjectId: node.id,
          name: `Ingredient chain: ${node.entityName}`,
          latestLevel: hasGap ? "HIGH" : "LOW",
          workflowStatus: hasGap ? "BLOCKING" : "ACTIVE",
          methodology:
            "Generated from multi-tier EUDR supplier and farmer declaration status. Missing land rights, trade proof, CoC, farmer plots, or geolocation keeps the chain high risk.",
          criteria: [
            {
              code: "CHAIN_FORM_STATUS",
              title: "Declaration form completion",
              level: request?.status === "CLOSED" || node.status === "COMPLETE" ? "LOW" : "HIGH",
              rationale: request
                ? `Latest request ${request.tokenLabel} is ${request.status}.`
                : "No declaration request exists for this chain node.",
            },
            {
              code: "FARMER_TERMINATION",
              title: "Branch terminates at farmer or producer evidence",
              level:
                node.actorType === "FARMER" && node.status !== "COMPLETE"
                  ? "HIGH"
                  : node.status === "COMPLETE"
                    ? "LOW"
                    : "MEDIUM",
              rationale:
                "Cocoa branches must terminate with producer/farmer declaration and accepted geolocation.",
            },
          ],
          mitigations: [
            "Complete pending supplier/farmer declaration forms.",
            "Attach trade proof, CoC, land rights and geolocation evidence where applicable.",
          ],
          history: [`${node.entityName} chain node created for ${node.materialName}.`],
        };
      }),
    [eudrFormRequests, supplyChainNodes],
  );
  const allRiskSubjects = useMemo(
    () => [...riskSubjects, ...generatedChainRiskSubjects],
    [generatedChainRiskSubjects, riskSubjects],
  );

  const [selectedRiskId, setSelectedRiskId] = useState("");

  useEffect(() => {
    if (allRiskSubjects.length > 0) {
      const exists = allRiskSubjects.some((risk) => risk.id === selectedRiskId);
      if (!exists) {
        setSelectedRiskId(allRiskSubjects[0].id);
      }
    }
  }, [allRiskSubjects, selectedRiskId]);

  const selectedRisk = allRiskSubjects.find((subject) => subject.id === selectedRiskId) ?? allRiskSubjects[0];

  const pillars = useMemo(() => {
    const defaultPillars: Array<{ name: string; score: number; rating: PillarRating }> = [
      { name: "Canopy Protection & Deforestation", score: 65, rating: "MEDIUM" },
      { name: "Land Legality & Tenancy Check", score: 80, rating: "LOW" },
      { name: "Traceability Completeness", score: 40, rating: "HIGH" },
      { name: "Supplier Onboarding Verification", score: 50, rating: "HIGH" },
      { name: "Operator Agent Registry Readiness", score: 70, rating: "MEDIUM" },
      { name: "Local Sovereignty & HR Compliance", score: 90, rating: "NEGLIGIBLE" },
    ];

    if (scenarioId === "after_cocoa_remediation") {
      return [
        { name: "Canopy Protection & Deforestation", score: 98, rating: "NEGLIGIBLE" },
        { name: "Land Legality & Tenancy Check", score: 95, rating: "NEGLIGIBLE" },
        { name: "Traceability Completeness", score: 96, rating: "NEGLIGIBLE" },
        { name: "Supplier Onboarding Verification", score: 98, rating: "NEGLIGIBLE" },
        { name: "Operator Agent Registry Readiness", score: 90, rating: "NEGLIGIBLE" },
        { name: "Local Sovereignty & HR Compliance", score: 95, rating: "NEGLIGIBLE" },
      ];
    }
    if (scenarioId === "after_palm_reclassification") {
      return [
        { name: "Canopy Protection & Deforestation", score: 85, rating: "LOW" },
        { name: "Land Legality & Tenancy Check", score: 85, rating: "LOW" },
        { name: "Traceability Completeness", score: 60, rating: "MEDIUM" },
        { name: "Supplier Onboarding Verification", score: 75, rating: "LOW" },
        { name: "Operator Agent Registry Readiness", score: 80, rating: "LOW" },
        { name: "Local Sovereignty & HR Compliance", score: 90, rating: "NEGLIGIBLE" },
      ];
    }
    if (scenarioId === "future_direct_dds") {
      return [
        { name: "Canopy Protection & Deforestation", score: 100, rating: "NEGLIGIBLE" },
        { name: "Land Legality & Tenancy Check", score: 100, rating: "NEGLIGIBLE" },
        { name: "Traceability Completeness", score: 100, rating: "NEGLIGIBLE" },
        { name: "Supplier Onboarding Verification", score: 100, rating: "NEGLIGIBLE" },
        { name: "Operator Agent Registry Readiness", score: 100, rating: "NEGLIGIBLE" },
        { name: "Local Sovereignty & HR Compliance", score: 100, rating: "NEGLIGIBLE" },
      ];
    }
    return defaultPillars;
  }, [scenarioId]);

  const blockingCount = allRiskSubjects.filter((subject) => subject.workflowStatus === "BLOCKING").length;

  return (
    <div className="flex w-full flex-col gap-6">
      <SectionHeader
        title="Risk Assessment"
        description="Assess supplier, product, and chain risk with clear mitigation tracking."
        actions={
          <Tag tone="brand">
            Scenario: <span className="ml-1 font-semibold">{formatLabel(scenarioId)}</span>
          </Tag>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Risk Subjects</p>
          <p className="mt-2 text-2xl font-bold text-brand-primary">{allRiskSubjects.length}</p>
        </Card>
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Blocking Subjects</p>
          <p className="mt-2 text-2xl font-bold text-state-error">{blockingCount}</p>
        </Card>
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Active Subject</p>
          <p className="mt-2 text-sm font-semibold text-text-primary">{selectedRisk?.name ?? "None selected"}</p>
        </Card>
      </div>

      <Card className="space-y-4 p-4 sm:p-5">
        <SectionHeader
          title="6-Pillar Risk Scorecard"
          description="Current compliance signal across core risk pillars."
          actions={<Button variant="secondary" size="sm">Refresh Scores</Button>}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pillars.map((pillar) => (
            <Card key={pillar.name} variant="inset" className="space-y-3 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-text-secondary">{pillar.name}</p>
                <RiskBadge risk={RISK_LEVEL_MAP[pillar.rating as PillarRating]}>{pillar.rating}</RiskBadge>
              </div>
              <div className="space-y-1">
                <div className="h-2 overflow-hidden rounded-full bg-bg-surface-alt">
                  <div className={`h-full rounded-full bg-brand-primary ${scoreToWidthClass(pillar.score)}`} />
                </div>
                <p className="text-xs font-semibold text-brand-primary">{pillar.score}%</p>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.8fr]">
        <Card className="space-y-4 p-4 sm:p-5">
          <SectionHeader title="Risk Subjects" description="Select a subject to inspect criteria, mitigations, and assessment history." />
          <TableRoot>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell density="compact">Subject</TableHeaderCell>
                  <TableHeaderCell density="compact">Risk</TableHeaderCell>
                  <TableHeaderCell density="compact">Workflow</TableHeaderCell>
                  <TableHeaderCell density="compact">Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allRiskSubjects.map((subject) => {
                  const selected = selectedRisk?.id === subject.id;
                  return (
                    <TableRow
                      key={subject.id}
                      selected={selected}
                      className="cursor-pointer"
                      onClick={() => setSelectedRiskId(subject.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedRiskId(subject.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Select risk subject ${subject.name}`}
                    >
                      <TableCell density="compact">
                        <p className="font-semibold text-brand-primary">{subject.name}</p>
                        <p className="text-xs text-text-secondary">{subject.subjectType}</p>
                      </TableCell>
                      <TableCell density="compact">
                        <RiskBadge risk={RISK_LEVEL_MAP[subject.latestLevel]}>{subject.latestLevel}</RiskBadge>
                      </TableCell>
                      <TableCell density="compact">
                        <StatusBadge status={WORKFLOW_STATUS_MAP[subject.workflowStatus]}>
                          {formatLabel(subject.workflowStatus)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell density="compact">
                        <Button size="sm" variant={selected ? "primary" : "secondary"}>Inspect</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableRoot>
        </Card>

        {selectedRisk ? (
          <div className="flex flex-col gap-6">
            <Card className="grid gap-4 p-4 sm:grid-cols-[1.15fr_1fr] sm:p-5">
              <div className="space-y-3">
                <SectionHeader title={selectedRisk.name} description="Risk summary" />
                <p className="text-sm leading-6 text-text-secondary">{selectedRisk.methodology}</p>
              </div>
              <div className="grid gap-3">
                <Card variant="inset" className="p-3">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Subject Type</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{selectedRisk.subjectType}</p>
                </Card>
                <Card variant="inset" className="p-3">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Latest Risk Level</p>
                  <div className="mt-1">
                    <RiskBadge risk={RISK_LEVEL_MAP[selectedRisk.latestLevel]}>{selectedRisk.latestLevel}</RiskBadge>
                  </div>
                </Card>
                <Card variant="inset" className="p-3">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Workflow Status</p>
                  <div className="mt-1">
                    <StatusBadge status={WORKFLOW_STATUS_MAP[selectedRisk.workflowStatus]}>
                      {formatLabel(selectedRisk.workflowStatus)}
                    </StatusBadge>
                  </div>
                </Card>
              </div>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
              <Card className="space-y-4 p-4 sm:p-5">
                <SectionHeader title="Structured Observations" description="Criterion-level rationale for the current risk determination." />
                {selectedRisk.criteria.length === 0 ? (
                  <Card variant="inset" className="p-3 text-sm text-text-secondary">
                    No active criteria findings for this subject.
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {selectedRisk.criteria.map((criterion) => (
                      <Card key={criterion.code} variant="inset" className="space-y-2 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-semibold text-brand-primary">{criterion.title}</h3>
                          <RiskBadge risk={RISK_LEVEL_MAP[criterion.level]}>{criterion.level}</RiskBadge>
                        </div>
                        <p className="font-mono text-xs text-text-secondary">{criterion.code}</p>
                        <p className="text-sm text-text-secondary">{criterion.rationale}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>

              <div className="flex flex-col gap-6">
                <Card className="space-y-4 p-4 sm:p-5">
                  <SectionHeader title="Mitigation Plan" description="Recommended remediation actions." />
                  {selectedRisk.mitigations.length === 0 ? (
                    <Card variant="inset" className="p-3 text-sm text-text-secondary">
                      No mitigation actions currently required.
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {selectedRisk.mitigations.map((mitigation) => (
                        <Card key={mitigation} variant="inset" className="p-3 text-sm text-text-secondary">
                          {mitigation}
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="space-y-4 p-4 sm:p-5">
                  <SectionHeader title="Assessment History" description="Timeline notes and historical evidence context." />
                  {selectedRisk.history.length === 0 ? (
                    <Card variant="inset" className="p-3 text-sm text-text-secondary">
                      No historical entries available.
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {selectedRisk.history.map((entry) => (
                        <Card key={entry} variant="inset" className="p-3 text-sm text-text-secondary">
                          {entry}
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center text-sm text-text-secondary">
            Select a risk subject from the left to view assessment details.
          </Card>
        )}
      </div>
    </div>
  );
}
