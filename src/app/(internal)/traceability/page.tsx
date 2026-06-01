"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IngredientTraceabilityStudio } from "@/components/traceability/IngredientTraceabilityStudio";
import { useSession } from "@/components/ui/PermissionGuard";
import { buildIngredientTraceabilityViewModel } from "@/lib/ingredient-traceability";
import { getScenarioData } from "@/lib/gfi-dummy-data";
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

type TraceabilitySubview = "UPSTREAM" | "BACKWARD" | "FORWARD";

const COMPLETENESS_STATUS_MAP: Record<"TRACEABLE" | "PENDING_REVIEW" | "INCOMPLETE" | "BLOCKED", StatusTone> = {
  TRACEABLE: "ready",
  PENDING_REVIEW: "review_required",
  INCOMPLETE: "review_required",
  BLOCKED: "blocked",
};

const NODE_STATUS_MAP: Record<"CLEAR" | "WARNING" | "BLOCKED", StatusTone> = {
  CLEAR: "ready",
  WARNING: "review_required",
  BLOCKED: "blocked",
};

function getSubviewLabel(view: TraceabilitySubview) {
  if (view === "BACKWARD") return "Backward Lineage";
  if (view === "FORWARD") return "Forward Impact";
  return "Upstream Chain";
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function LegacyLineagePanel(props: {
  title: string;
  visibleCases: Array<{
    id: string;
    rootReference: string;
    completeness: "TRACEABLE" | "PENDING_REVIEW" | "INCOMPLETE" | "BLOCKED";
    chainOfCustodySummary: string;
    supersession: string;
    nodes: Array<{
      label: string;
      entityType: string;
      status: "CLEAR" | "WARNING" | "BLOCKED";
      sourceRef: string;
      evidenceCount: number;
      note: string;
    }>;
    gaps: string[];
  }>;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { title, visibleCases, selectedId, onSelect } = props;
  const selectedCase = visibleCases.find((item) => item.id === selectedId) ?? visibleCases[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.7fr]">
      <Card className="space-y-4 p-4 sm:p-5">
        <SectionHeader title={title} description="Select a lineage case to inspect node-level evidence and gaps." />
        <TableRoot>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell density="compact">Root</TableHeaderCell>
                <TableHeaderCell density="compact">Status</TableHeaderCell>
                <TableHeaderCell density="compact">Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleCases.map((item) => (
                <TableRow
                  key={item.id}
                  selected={selectedCase?.id === item.id}
                  className="cursor-pointer"
                  onClick={() => onSelect(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(item.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${item.rootReference}`}
                >
                  <TableCell density="compact">
                    <p className="font-semibold text-brand-primary">{item.rootReference}</p>
                    <p className="text-xs text-text-secondary">{item.chainOfCustodySummary}</p>
                  </TableCell>
                  <TableCell density="compact">
                    <StatusBadge status={COMPLETENESS_STATUS_MAP[item.completeness]}>
                      {formatLabel(item.completeness)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell density="compact">
                    <Button type="button" size="sm" variant="secondary" onClick={() => onSelect(item.id)}>
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableRoot>
      </Card>

      {selectedCase ? (
        <div className="flex flex-col gap-6">
          <Card className="space-y-4 p-4 sm:p-5">
            <SectionHeader
              title={selectedCase.rootReference}
              description="Selected lineage root context"
              actions={
                <StatusBadge status={COMPLETENESS_STATUS_MAP[selectedCase.completeness]}>
                  {formatLabel(selectedCase.completeness)}
                </StatusBadge>
              }
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <Card variant="inset" className="p-3">
                <p className="text-xs uppercase tracking-wide text-text-secondary">Completeness</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{formatLabel(selectedCase.completeness)}</p>
              </Card>
              <Card variant="inset" className="p-3">
                <p className="text-xs uppercase tracking-wide text-text-secondary">CoC Summary</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{selectedCase.chainOfCustodySummary}</p>
              </Card>
              <Card variant="inset" className="p-3">
                <p className="text-xs uppercase tracking-wide text-text-secondary">Record History</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{selectedCase.supersession}</p>
              </Card>
            </div>
          </Card>

          <Card className="space-y-4 p-4 sm:p-5">
            <SectionHeader title="Lineage Nodes" description="Node-by-node chain evidence and source references." />
            <div className="space-y-3">
              {selectedCase.nodes.map((node, index) => (
                <Card key={`${selectedCase.id}-${node.label}`} variant="inset" className="grid gap-3 p-4 sm:grid-cols-[2rem_1fr]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border-soft text-sm font-bold text-brand-primary">
                    {index + 1}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold text-brand-primary">{node.label}</h4>
                      <StatusBadge status={NODE_STATUS_MAP[node.status]}>{node.status}</StatusBadge>
                    </div>
                    <p className="text-xs text-text-secondary">
                      {node.entityType} | Source: {node.sourceRef} | Evidence count: {node.evidenceCount}
                    </p>
                    <p className="text-sm text-text-secondary">{node.note}</p>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          <Card className="space-y-4 p-4 sm:p-5">
            <SectionHeader title="Explicit Gaps and Warnings" description="Operational blockers and remediation cues." />
            {selectedCase.gaps.length === 0 ? (
              <Card variant="inset" className="p-4">
                <StatusBadge status="ready">No traceability or CoC gaps identified.</StatusBadge>
              </Card>
            ) : (
              <div className="space-y-2">
                {selectedCase.gaps.map((gap) => (
                  <Card key={gap} variant="alert" className="p-3 text-sm font-medium text-text-primary">
                    {gap}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card className="p-4 text-sm text-text-secondary">No lineage cases available for this view.</Card>
      )}
    </div>
  );
}

function TraceabilityPageContent() {
  const {
    scenarioId,
    products,
    consignments,
    supplyChainNodes,
    eudrFormRequests,
    intermediaryDeclarationSubmissions,
    farmerDeclarationSubmissions,
    eudrEvidenceAttachments,
  } = useSession();
  const scenarioData = getScenarioData(scenarioId);
  const { traceabilityCases } = scenarioData;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeSubview, setActiveSubview] = useState<TraceabilitySubview>("UPSTREAM");
  const [selectedId, setSelectedId] = useState("");

  const ingredientViewModel = useMemo(
    () =>
      buildIngredientTraceabilityViewModel({
        products,
        consignments,
        supplyChainNodes,
        eudrFormRequests,
        intermediaryDeclarationSubmissions,
        farmerDeclarationSubmissions,
        eudrEvidenceAttachments,
      }),
    [
      consignments,
      eudrEvidenceAttachments,
      eudrFormRequests,
      farmerDeclarationSubmissions,
      intermediaryDeclarationSubmissions,
      products,
      supplyChainNodes,
    ],
  );

  const visibleCases = traceabilityCases.filter((item) =>
    activeSubview === "FORWARD" ? item.mode === "FORWARD" : item.mode === "REVERSE",
  );

  useEffect(() => {
    const queryMode = searchParams.get("mode");
    if (queryMode === "forward") {
      setActiveSubview("FORWARD");
      return;
    }
    if (queryMode === "backward" || queryMode === "reverse") {
      setActiveSubview("BACKWARD");
      return;
    }
    setActiveSubview("UPSTREAM");
  }, [searchParams]);

  useEffect(() => {
    if (activeSubview === "UPSTREAM") {
      if (selectedId && ingredientViewModel.rootById[selectedId]) {
        return;
      }

      const productId = searchParams.get("productId");
      const ingredientId = searchParams.get("ingredientId");
      const supplierId = searchParams.get("supplierId");
      const requestedRoot = ingredientViewModel.roots.find(
        (root) => root.productId === productId && root.ingredientId === ingredientId && root.supplierId === supplierId,
      );

      if (requestedRoot) {
        setSelectedId(requestedRoot.rootId);
        return;
      }

      if (ingredientViewModel.roots[0]) {
        setSelectedId(ingredientViewModel.roots[0].rootId);
      }
      return;
    }

    if (visibleCases.length > 0 && !visibleCases.some((item) => item.id === selectedId)) {
      setSelectedId(visibleCases[0].id);
    }
  }, [activeSubview, ingredientViewModel, searchParams, selectedId, visibleCases]);

  useEffect(() => {
    if (activeSubview === "UPSTREAM") {
      const selectedRoot = ingredientViewModel.rootById[selectedId] ?? ingredientViewModel.roots[0];
      if (!selectedRoot) {
        return;
      }
      const params = new URLSearchParams({
        mode: "ingredient",
        productId: selectedRoot.productId,
        ingredientId: selectedRoot.ingredientId,
        supplierId: selectedRoot.supplierId,
      });
      router.replace(`${pathname}?${params.toString()}` as any, { scroll: false });
      return;
    }

    const modeValue = activeSubview === "FORWARD" ? "forward" : "backward";
    router.replace(`${pathname}?mode=${modeValue}` as any, { scroll: false });
  }, [activeSubview, ingredientViewModel.rootById, ingredientViewModel.roots, pathname, router, selectedId]);

  return (
    <div className="flex w-full flex-col gap-6">
      <SectionHeader
        title="Traceability"
        description="Track ingredient-to-farmer provenance, backward lineage, and forward impact."
        actions={
          <Tag tone="brand">
            Active focus: <span className="ml-1 font-semibold">{getSubviewLabel(activeSubview)}</span>
          </Tag>
        }
      />

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-secondary">Workspace Focus</p>
            <h2 className="mt-1 text-2xl font-bold text-brand-primary">{getSubviewLabel(activeSubview)}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["UPSTREAM", "BACKWARD", "FORWARD"] as const).map((view) => (
              <Button
                key={view}
                type="button"
                variant={activeSubview === view ? "primary" : "secondary"}
                onClick={() => {
                  setActiveSubview(view);
                  if (view === "UPSTREAM") {
                    setSelectedId(ingredientViewModel.roots[0]?.rootId ?? "");
                  } else {
                    setSelectedId("");
                  }
                }}
              >
                {getSubviewLabel(view)}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card variant="inset" className="p-3">
            <h3 className="font-semibold text-brand-primary">Upstream Chain</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Default EUDR view for supplier-to-farmer evidence, form ownership, and geolocation completeness.
            </p>
          </Card>
          <Card variant="inset" className="p-3">
            <h3 className="font-semibold text-brand-primary">Backward Lineage</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Investigate shipment or batch records backward into upstream source and chain-of-custody proof.
            </p>
          </Card>
          <Card variant="inset" className="p-3">
            <h3 className="font-semibold text-brand-primary">Forward Impact</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Assess downstream impact if an upstream receipt, supplier, or route becomes risky.
            </p>
          </Card>
        </div>
      </Card>

      {activeSubview === "UPSTREAM" ? (
        <IngredientTraceabilityStudio
          viewModel={ingredientViewModel}
          selectedRootId={selectedId || ingredientViewModel.roots[0]?.rootId || ""}
          onSelectRoot={setSelectedId}
        />
      ) : (
        <LegacyLineagePanel
          title={activeSubview === "BACKWARD" ? "Backward lineage cases" : "Forward impact cases"}
          visibleCases={visibleCases}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}
    </div>
  );
}

export default function TraceabilityPage() {
  return (
    <Suspense fallback={<div className="rounded-lg border border-border-soft bg-bg-surface p-4">Loading traceability workspace...</div>}>
      <TraceabilityPageContent />
    </Suspense>
  );
}
