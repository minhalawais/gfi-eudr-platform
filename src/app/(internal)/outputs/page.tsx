"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/ui/PermissionGuard";
import { getOutputPackageForConsignment, getScenarioData, OutputPackageRecord } from "@/lib/gfi-dummy-data";
import {
  Button,
  Card,
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
import type { StatusTone } from "@/lib/ui-semantics";

const PACKAGE_STATUS_MAP: Record<"ASSEMBLED" | "READY_FOR_AGENT" | "HELD" | "SUPERSEDED", StatusTone> = {
  ASSEMBLED: "current",
  READY_FOR_AGENT: "ready",
  HELD: "held",
  SUPERSEDED: "superseded",
};

const ELIGIBILITY_MAP: Record<"PACKAGE_READY" | "HELD" | "SCOPE_REVIEW", StatusTone> = {
  PACKAGE_READY: "ready",
  HELD: "held",
  SCOPE_REVIEW: "review_required",
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function progressWidthClass(progress: number) {
  if (progress >= 100) return "w-full";
  if (progress >= 90) return "w-[90%]";
  if (progress >= 80) return "w-[80%]";
  if (progress >= 70) return "w-[70%]";
  if (progress >= 60) return "w-[60%]";
  if (progress >= 50) return "w-1/2";
  if (progress >= 40) return "w-[40%]";
  if (progress >= 30) return "w-[30%]";
  if (progress >= 20) return "w-[20%]";
  if (progress >= 10) return "w-[10%]";
  return "w-0";
}

export default function OutputsPage() {
  const { scenarioId, eudrEvidenceAttachments, intermediaryDeclarationSubmissions, farmerDeclarationSubmissions } =
    useSession();
  const scenarioData = getScenarioData(scenarioId);
  const { outputPackages, consignments } = scenarioData;

  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileStep, setCompileStep] = useState("");
  const [localPackages, setLocalPackages] = useState<OutputPackageRecord[]>([]);

  useEffect(() => {
    if (outputPackages.length > 0) {
      const exists = outputPackages.some((pkg) => pkg.id === selectedPackageId);
      if (!exists) setSelectedPackageId(outputPackages[0].id);
    }
  }, [outputPackages, selectedPackageId]);

  useEffect(() => {
    setLocalPackages(outputPackages);
  }, [outputPackages]);

  const selectedPackage = localPackages.find((pkg) => pkg.id === selectedPackageId) ?? localPackages[0];
  const consignment = consignments.find((item) => item.id === selectedPackage?.consignmentId);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const startCompilation = () => {
    setIsCompiling(true);
    setCompileProgress(0);
    setCompileStep("Locating active consignment records...");
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCompiling && selectedPackage) {
      timer = setInterval(() => {
        setCompileProgress((previous) => {
          if (previous >= 100) {
            clearInterval(timer);
            setIsCompiling(false);
            setLocalPackages((previousPackages) =>
              previousPackages.map((pkg) =>
                pkg.id === selectedPackageId
                  ? {
                    ...pkg,
                    status: "READY_FOR_AGENT",
                    supersessionNote: "Compiled successfully. Fully validated against EUDR requirements.",
                  }
                  : pkg,
              ),
            );
            triggerToast("Dossier compiled successfully. Exporter compliance package is active.");
            return 100;
          }

          const next = previous + 10;
          if (next < 30) setCompileStep("Aggregating supplier geo-polygons...");
          else if (next < 60) setCompileStep("Generating signed audit manifests...");
          else if (next < 85) setCompileStep("Formatting TRACES-aligned XML schema nodes...");
          else setCompileStep("Bundling package ZIP archive...");
          return next;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [isCompiling, selectedPackage, selectedPackageId]);

  const isAssembled = selectedPackage?.status === "ASSEMBLED" || selectedPackage?.status === "HELD";
  const currentStatus = selectedPackage
    ? localPackages.find((pkg) => pkg.id === selectedPackage.id)?.status ?? selectedPackage.status
    : undefined;

  const snapshotStats = useMemo(
    () => ({
      packages: localPackages.length,
      ready: localPackages.filter((pkg) => pkg.status === "READY_FOR_AGENT").length,
      held: localPackages.filter((pkg) => pkg.status === "HELD").length,
    }),
    [localPackages],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      {toastMessage ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-md border border-brand-accent bg-brand-primary px-4 py-3 text-sm font-semibold text-text-inverse shadow-card">
          {toastMessage}
        </div>
      ) : null}

      <SectionHeader
        title="Output Dossiers"
        description="Compile provenance, deforestation, and supplier evidence into shipment dossiers."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Snapshots</p>
          <p className="mt-2 text-2xl font-bold text-brand-primary">{snapshotStats.packages}</p>
        </Card>
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Ready For Agent</p>
          <p className="mt-2 text-2xl font-bold text-state-success">{snapshotStats.ready}</p>
        </Card>
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Held</p>
          <p className="mt-2 text-2xl font-bold text-state-warning">{snapshotStats.held}</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.85fr]">
        <Card className="space-y-4 p-4 sm:p-5">
          <SectionHeader title="Package List" description="Select a package to review lifecycle and artifacts." />
          {localPackages.length === 0 ? (
            <Card variant="inset" className="p-3 text-sm text-text-secondary">
              No output packages available.
            </Card>
          ) : (
            <TableRoot>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell density="compact">Package</TableHeaderCell>
                    <TableHeaderCell density="compact">Status</TableHeaderCell>
                    <TableHeaderCell density="compact">Action</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {localPackages.map((pkg) => {
                    const selected = selectedPackage?.id === pkg.id;
                    return (
                      <TableRow
                        key={pkg.id}
                        selected={selected}
                        className={isCompiling && !selected ? "opacity-60" : "cursor-pointer"}
                        onClick={() => {
                          if (!isCompiling) setSelectedPackageId(pkg.id);
                        }}
                        onKeyDown={(event) => {
                          if (!isCompiling && (event.key === "Enter" || event.key === " ")) {
                            event.preventDefault();
                            setSelectedPackageId(pkg.id);
                          }
                        }}
                        tabIndex={isCompiling ? -1 : 0}
                        role="button"
                      >
                        <TableCell density="compact">
                          <p className="font-semibold text-brand-primary">{pkg.packageRef}</p>
                          <p className="text-xs text-text-secondary">
                            {formatLabel(pkg.mode)} | {pkg.snapshotVersion}
                          </p>
                        </TableCell>
                        <TableCell density="compact">
                          <StatusBadge status={PACKAGE_STATUS_MAP[pkg.status]}>{formatLabel(pkg.status)}</StatusBadge>
                        </TableCell>
                        <TableCell density="compact">
                          <Button size="sm" variant={selected ? "primary" : "secondary"} disabled={isCompiling}>
                            Inspect
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableRoot>
          )}
        </Card>

        {selectedPackage && consignment ? (
          <div className="flex flex-col gap-6">
            <Card className="grid gap-4 p-4 sm:grid-cols-[1.2fr_1fr] sm:p-5">
              <div className="space-y-3">
                <SectionHeader title={selectedPackage.packageRef} description="Package summary" />
                <p className="text-sm leading-6 text-text-secondary">{consignment.policyNarrative}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card variant="inset" className="p-3">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Consignment</p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">{consignment.reference}</p>
                  </Card>
                  <Card variant="inset" className="p-3">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Snapshot Version</p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">{selectedPackage.snapshotVersion}</p>
                  </Card>
                  <Card variant="inset" className="p-3">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Evidence Index Size</p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">
                      {selectedPackage.evidenceIndexCount +
                        eudrEvidenceAttachments.filter((item) => item.status === "ATTACHED").length}{" "}
                      entries
                    </p>
                  </Card>
                  <Card variant="inset" className="p-3">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Source Anchors</p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">
                      {selectedPackage.sourceAnchorCount} pinned records
                    </p>
                  </Card>
                </div>
              </div>

              <div className="grid gap-3">
                <Card variant="inset" className="p-3">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Lifecycle Status</p>
                  <div className="mt-1">
                    {currentStatus ? (
                      <StatusBadge status={PACKAGE_STATUS_MAP[currentStatus]}>{formatLabel(currentStatus)}</StatusBadge>
                    ) : null}
                  </div>
                </Card>
                <Card variant="inset" className="p-3">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Supersession Note</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">
                    {localPackages.find((pkg) => pkg.id === selectedPackageId)?.supersessionNote ??
                      selectedPackage.supersessionNote}
                  </p>
                </Card>
                <Card variant="inset" className="p-3">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Eligibility</p>
                  <div className="mt-1">
                    <StatusBadge status={ELIGIBILITY_MAP[consignment.outputEligibility]}>
                      {formatLabel(consignment.outputEligibility)}
                    </StatusBadge>
                  </div>
                </Card>
              </div>
            </Card>

            <Card className="space-y-4 p-4 sm:p-5">
              <SectionHeader
                title="Dossier Compiler"
                actions={
                  isAssembled && !isCompiling ? (
                    <Button size="sm" onClick={startCompilation}>
                      Compile Dossier Archive
                    </Button>
                  ) : null
                }
              />

              {isCompiling ? (
                <Card variant="inset" className="space-y-3 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-brand-primary">{compileStep}</span>
                    <span className="font-semibold text-text-primary">{compileProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg-surface-alt">
                    <div
                      className={`h-full rounded-full bg-brand-accent transition-all duration-200 ${progressWidthClass(compileProgress)}`}
                    />
                  </div>
                </Card>
              ) : currentStatus === "READY_FOR_AGENT" ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <Button variant="secondary" onClick={() => triggerToast("Downloaded encrypted ZIP dossier successfully.")}>
                    Download ZIP
                  </Button>
                  <Button variant="secondary" onClick={() => triggerToast("Downloaded metadata JSON dossier successfully.")}>
                    Download JSON
                  </Button>
                  <Button variant="secondary" onClick={() => triggerToast("Downloaded TRACES XML schema successfully.")}>
                    Download TRACES XML
                  </Button>
                </div>
              ) : (
                <Card variant="inset" className="p-3 text-sm text-text-secondary">
                  This dossier is held or already compiled. Remediate active blockers to enable compilation.
                </Card>
              )}
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="space-y-4 p-4 sm:p-5">
                <SectionHeader title="Generated Artifacts" />
                <div className="space-y-2">
                  {selectedPackage.artifacts.map((artifact) => (
                    <Card key={artifact} variant="inset" className="p-3 text-sm text-text-secondary">
                      {artifact}
                    </Card>
                  ))}
                </div>
              </Card>

              <Card className="space-y-4 p-4 sm:p-5">
                <SectionHeader title="Lifecycle Notes" />
                <Card variant="inset" className="p-3 text-sm leading-6 text-text-secondary">
                  Outputs are immutable snapshots anchored to explicit source selections. This view distinguishes
                  releasable compliance packages from held packages with unresolved lineage.
                </Card>
              </Card>
            </div>

            <Card className="space-y-4 p-4 sm:p-5">
              <SectionHeader title="Included Supplier-Chain Evidence" />
              <div className="grid gap-3 md:grid-cols-3">
                <Card variant="inset" className="p-3">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Intermediary Forms</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{intermediaryDeclarationSubmissions.length}</p>
                </Card>
                <Card variant="inset" className="p-3">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Farmer Forms</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{farmerDeclarationSubmissions.length}</p>
                </Card>
                <Card variant="inset" className="p-3">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Linked EUDR Attachments</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{eudrEvidenceAttachments.length}</p>
                </Card>
              </div>
            </Card>

            <Card className="space-y-4 p-4 sm:p-5">
              <SectionHeader title="Linked Package Sequence" />
              <div className="space-y-2">
                {consignments.map((item) => {
                  const linkedPackage = getOutputPackageForConsignment(item.id);
                  return (
                    <Card key={item.id} variant="inset" className="flex items-center justify-between gap-3 p-3">
                      <p className="font-semibold text-brand-primary">{item.reference}</p>
                      <p className="text-sm text-text-secondary">
                        {linkedPackage
                          ? `${linkedPackage.packageRef} / ${formatLabel(linkedPackage.status)}`
                          : "No package started"}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-10 text-center text-sm text-text-secondary">
            Select an output package snapshot from the left to view details.
          </Card>
        )}
      </div>
    </div>
  );
}
