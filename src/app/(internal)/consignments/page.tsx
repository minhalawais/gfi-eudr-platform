"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/ui/PermissionGuard";
import { ConsignmentRecord, GateIssue, getScenarioData } from "@/lib/gfi-dummy-data";
import {
  Button,
  Card,
  Input,
  RiskBadge,
  SectionHeader,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  Tag,
  Textarea,
} from "@/components/ui";
import type { RiskTone, StatusTone } from "@/lib/ui-semantics";

const GATE_STATUS_MAP: Record<"READY" | "BLOCKED" | "REVIEW_REQUIRED", StatusTone> = {
  READY: "ready",
  BLOCKED: "blocked",
  REVIEW_REQUIRED: "review_required",
};

const ELIGIBILITY_STATUS_MAP: Record<"PACKAGE_READY" | "HELD" | "SCOPE_REVIEW", StatusTone> = {
  PACKAGE_READY: "ready",
  HELD: "held",
  SCOPE_REVIEW: "review_required",
};

const TRACE_STATUS_MAP: Record<"TRACEABLE" | "BLOCKED" | "REVIEW_REQUIRED", StatusTone> = {
  TRACEABLE: "ready",
  BLOCKED: "blocked",
  REVIEW_REQUIRED: "review_required",
};

const ISSUE_SEVERITY_MAP: Record<"WARNING" | "HIGH" | "CRITICAL", RiskTone> = {
  WARNING: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

const CHECK_STATUS_MAP: Record<"PENDING" | "RUNNING" | "PASS" | "FAIL", StatusTone> = {
  PENDING: "draft",
  RUNNING: "current",
  PASS: "ready",
  FAIL: "blocked",
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default function ConsignmentsPage() {
  const { consignments, agents, addConsignment, editConsignment, scenarioId, supplyChainNodes, eudrFormRequests } =
    useSession();
  const scenarioData = getScenarioData(scenarioId);
  const { outputPackages } = scenarioData;

  const [selectedConsignmentId, setSelectedConsignmentId] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [formRef, setFormRef] = useState("");
  const [formDest, setFormDest] = useState("Rotterdam, Netherlands");
  const [formAgentId, setFormAgentId] = useState("");
  const [formWeight, setFormWeight] = useState("25.0 MT");
  const [formShipMode, setFormShipMode] = useState<"CURRENT_EXPORT" | "FUTURE_EXPORT">("CURRENT_EXPORT");
  const [formGateStatus, setFormGateStatus] = useState<"READY" | "BLOCKED" | "REVIEW_REQUIRED">("READY");
  const [formEligibility, setFormEligibility] = useState<"PACKAGE_READY" | "HELD" | "SCOPE_REVIEW">("PACKAGE_READY");
  const [formTraceStatus, setFormTraceStatus] = useState<"TRACEABLE" | "BLOCKED" | "REVIEW_REQUIRED">("TRACEABLE");
  const [formNarrative, setFormNarrative] = useState("");
  const [formNextAction, setFormNextAction] = useState("");
  const [formIssues, setFormIssues] = useState<GateIssue[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [issueCode, setIssueCode] = useState("");
  const [issueSeverity, setIssueSeverity] = useState<"WARNING" | "HIGH" | "CRITICAL">("HIGH");
  const [issueDomain, setIssueDomain] = useState("GEOLOCATION");
  const [issueMsg, setIssueMsg] = useState("");
  const [issueBlocking, setIssueBlocking] = useState(true);

  const [gateCheckActive, setGateCheckActive] = useState(false);
  const [gateCheckStep, setGateCheckStep] = useState(0);
  const [gateCheckResults, setGateCheckResults] = useState<{
    bom: "PENDING" | "RUNNING" | "PASS" | "FAIL";
    supplier: "PENDING" | "RUNNING" | "PASS" | "FAIL";
    coordinates: "PENDING" | "RUNNING" | "PASS" | "FAIL";
    coc: "PENDING" | "RUNNING" | "PASS" | "FAIL";
  }>({
    bom: "PENDING",
    supplier: "PENDING",
    coordinates: "PENDING",
    coc: "PENDING",
  });

  useEffect(() => {
    if (consignments.length > 0) {
      const exists = consignments.some((item) => item.id === selectedConsignmentId);
      if (!exists) {
        setSelectedConsignmentId(consignments[0].id);
      }
    }
  }, [consignments, selectedConsignmentId]);

  const selectedConsignment = consignments.find((item) => item.id === selectedConsignmentId) ?? consignments[0];
  const assignedAgent = agents.find((agent) => agent.id === selectedConsignment?.operatorAgentId) ?? agents[0];
  const outputPackage = selectedConsignment
    ? outputPackages.find((pkg) => pkg.consignmentId === selectedConsignment.id)
    : undefined;

  const incompleteIngredientNodes = supplyChainNodes.filter(
    (node) => node.commodity === "COCOA" && ["REQUESTED", "IN_PROGRESS", "GAPS_FOUND", "BLOCKED"].includes(node.status),
  );

  const derivedIngredientIssue: GateIssue | null =
    incompleteIngredientNodes.length > 0
      ? {
          code: "INGREDIENT_SUPPLY_CHAIN_INCOMPLETE",
          severity: "CRITICAL",
          sourceDomain: "TRACEABILITY",
          blocking: true,
          message: `${incompleteIngredientNodes.length} cocoa ingredient chain node(s) still lack terminal farmer/producer evidence and approved plot data.`,
        }
      : null;

  const visibleIssues = selectedConsignment
    ? derivedIngredientIssue
      ? [...selectedConsignment.issues, derivedIngredientIssue]
      : selectedConsignment.issues
    : [];

  const queueStats = useMemo(
    () => ({
      total: consignments.length,
      blocked: consignments.filter((item) => item.gateStatus === "BLOCKED").length,
      ready: consignments.filter((item) => item.gateStatus === "READY").length,
    }),
    [consignments],
  );

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const runGateCheck = () => {
    if (!selectedConsignment) return;
    setGateCheckActive(true);
    setGateCheckStep(1);
    setGateCheckResults({ bom: "RUNNING", supplier: "PENDING", coordinates: "PENDING", coc: "PENDING" });
  };

  useEffect(() => {
    if (!gateCheckActive || !selectedConsignment) return;
    let timer: NodeJS.Timeout;

    if (gateCheckStep === 1) {
      timer = setTimeout(() => {
        const hasBomIssue = visibleIssues.some((issue) => issue.sourceDomain === "PRODUCT" && issue.blocking);
        setGateCheckResults((prev) => ({
          ...prev,
          bom: hasBomIssue ? "FAIL" : "PASS",
          supplier: hasBomIssue ? "PENDING" : "RUNNING",
        }));
        if (hasBomIssue) {
          setGateCheckActive(false);
          triggerToast("Gate check failed: BOM audit issues detected.");
        } else {
          setGateCheckStep(2);
        }
      }, 700);
    } else if (gateCheckStep === 2) {
      timer = setTimeout(() => {
        const hasSupplierIssue = visibleIssues.some((issue) => issue.sourceDomain === "SUPPLIER" && issue.blocking);
        setGateCheckResults((prev) => ({
          ...prev,
          supplier: hasSupplierIssue ? "FAIL" : "PASS",
          coordinates: hasSupplierIssue ? "PENDING" : "RUNNING",
        }));
        if (hasSupplierIssue) {
          setGateCheckActive(false);
          triggerToast("Gate check failed: Supplier onboarding issues detected.");
        } else {
          setGateCheckStep(3);
        }
      }, 700);
    } else if (gateCheckStep === 3) {
      timer = setTimeout(() => {
        const hasGeoIssue = visibleIssues.some((issue) => issue.sourceDomain === "GEOLOCATION" && issue.blocking);
        setGateCheckResults((prev) => ({
          ...prev,
          coordinates: hasGeoIssue ? "FAIL" : "PASS",
          coc: hasGeoIssue ? "PENDING" : "RUNNING",
        }));
        if (hasGeoIssue) {
          setGateCheckActive(false);
          triggerToast("Gate check failed: Geolocation polygon gaps detected.");
        } else {
          setGateCheckStep(4);
        }
      }, 700);
    } else if (gateCheckStep === 4) {
      timer = setTimeout(() => {
        const hasCocIssue = visibleIssues.some(
          (issue) => (issue.sourceDomain === "TRACEABILITY" || issue.sourceDomain === "DOCUMENTS") && issue.blocking,
        );
        setGateCheckResults((prev) => ({ ...prev, coc: hasCocIssue ? "FAIL" : "PASS" }));
        setGateCheckActive(false);
        if (hasCocIssue) {
          triggerToast("Gate check failed: Chain of custody or document gaps detected.");
        } else {
          triggerToast("Gate check cleared successfully. Shipment ready for operator agent handoff.");
        }
      }, 700);
    }

    return () => clearTimeout(timer);
  }, [gateCheckActive, gateCheckStep, selectedConsignment, visibleIssues]);

  useEffect(() => {
    setGateCheckActive(false);
    setGateCheckStep(0);
    setGateCheckResults({ bom: "PENDING", supplier: "PENDING", coordinates: "PENDING", coc: "PENDING" });
  }, [selectedConsignmentId, scenarioId]);

  const clearIssueSubform = () => {
    setIssueCode("");
    setIssueSeverity("HIGH");
    setIssueDomain("GEOLOCATION");
    setIssueMsg("");
    setIssueBlocking(true);
  };

  const resetForm = () => {
    setFormRef("");
    setFormDest("Rotterdam, Netherlands");
    setFormAgentId(agents[0]?.id || "");
    setFormWeight("25.0 MT");
    setFormShipMode("CURRENT_EXPORT");
    setFormGateStatus("READY");
    setFormEligibility("PACKAGE_READY");
    setFormTraceStatus("TRACEABLE");
    setFormNarrative("");
    setFormNextAction("");
    setFormIssues([]);
    setEditingId(null);
    clearIssueSubform();
  };

  const handleAddIssue = () => {
    if (!issueCode.trim() || !issueMsg.trim()) return;
    const newIssue: GateIssue = {
      code: issueCode.toUpperCase().replace(/\s/g, "_"),
      severity: issueSeverity,
      sourceDomain: issueDomain,
      blocking: issueBlocking,
      message: issueMsg,
    };
    setFormIssues((prev) => [...prev, newIssue]);
    clearIssueSubform();
  };

  const handleRemoveIssue = (code: string) => {
    setFormIssues((prev) => prev.filter((item) => item.code !== code));
  };

  const handleOpenEdit = () => {
    if (!selectedConsignment) return;
    setEditingId(selectedConsignment.id);
    setFormRef(selectedConsignment.reference);
    setFormDest(selectedConsignment.destination);
    setFormAgentId(selectedConsignment.operatorAgentId);
    setFormWeight(selectedConsignment.lineSummary[0]?.split(" / ")[1] || "25.0 MT");
    setFormShipMode(selectedConsignment.shipmentMode);
    setFormGateStatus(selectedConsignment.gateStatus);
    setFormEligibility(selectedConsignment.outputEligibility);
    setFormTraceStatus(selectedConsignment.traceabilityStatus);
    setFormNarrative(selectedConsignment.policyNarrative);
    setFormNextAction(selectedConsignment.nextAction);
    setFormIssues(selectedConsignment.issues);
    setIsEditModalOpen(true);
  };

  const handleSaveConsignment = (event: React.FormEvent, isEdit: boolean) => {
    event.preventDefault();
    if (!formRef.trim()) return;

    const consignmentData: ConsignmentRecord = {
      id: isEdit && editingId ? editingId : `con-${Date.now()}`,
      reference: formRef,
      destination: formDest,
      operatorAgentId: formAgentId,
      shipmentMode: formShipMode,
      lineSummary: [`Material shipment / ${formWeight} weight / clear origin`],
      gateStatus: formGateStatus,
      outputEligibility: formEligibility,
      traceabilityStatus: formTraceStatus,
      policyNarrative: formNarrative || `Custom consignment shipping GFI ingredients to ${formDest}.`,
      issues: formIssues,
      nextAction: formNextAction || "Awaiting final customs clearance scan.",
    };

    if (isEdit) {
      editConsignment(consignmentData);
      setIsEditModalOpen(false);
    } else {
      addConsignment(consignmentData);
      setSelectedConsignmentId(consignmentData.id);
      setIsAddModalOpen(false);
    }
    resetForm();
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    resetForm();
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {toastMessage ? (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-md border border-brand-accent bg-brand-primary px-4 py-3 text-sm font-semibold text-text-inverse shadow-card">
          <span>{toastMessage}</span>
        </div>
      ) : null}

      <SectionHeader
        title="Shipment Gate"
        description="Validate shipment readiness across BOM, suppliers, geolocation, and chain-of-custody checks."
        actions={
          <Tag tone="brand">
            Scenario: <span className="ml-1 font-semibold">{formatLabel(scenarioId)}</span>
          </Tag>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Total Shipments</p>
          <p className="mt-2 text-2xl font-bold text-brand-primary">{queueStats.total}</p>
        </Card>
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Ready</p>
          <p className="mt-2 text-2xl font-bold text-state-success">{queueStats.ready}</p>
        </Card>
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Blocked</p>
          <p className="mt-2 text-2xl font-bold text-state-error">{queueStats.blocked}</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.95fr]">
        <Card className="space-y-4 p-4 sm:p-5">
          <SectionHeader
            title="Shipment List"
            actions={
              <Button
                size="sm"
                onClick={() => {
                  resetForm();
                  setIsAddModalOpen(true);
                }}
                disabled={gateCheckActive}
              >
                Add Shipment
              </Button>
            }
          />

          <TableRoot>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell density="compact">Reference</TableHeaderCell>
                  <TableHeaderCell density="compact">Gate</TableHeaderCell>
                  <TableHeaderCell density="compact">Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {consignments.map((consignment) => {
                  const isSelected = selectedConsignment?.id === consignment.id;
                  return (
                    <TableRow
                      key={consignment.id}
                      selected={isSelected}
                      className={gateCheckActive && !isSelected ? "opacity-60" : "cursor-pointer"}
                      onClick={() => {
                        if (!gateCheckActive) setSelectedConsignmentId(consignment.id);
                      }}
                      onKeyDown={(event) => {
                        if (!gateCheckActive && (event.key === "Enter" || event.key === " ")) {
                          event.preventDefault();
                          setSelectedConsignmentId(consignment.id);
                        }
                      }}
                      tabIndex={gateCheckActive ? -1 : 0}
                      role="button"
                    >
                      <TableCell density="compact">
                        <p className="font-semibold text-brand-primary">{consignment.reference}</p>
                        <p className="text-xs text-text-secondary">
                          {consignment.destination} | {formatLabel(consignment.shipmentMode)}
                        </p>
                      </TableCell>
                      <TableCell density="compact">
                        <StatusBadge status={GATE_STATUS_MAP[consignment.gateStatus]}>
                          {formatLabel(consignment.gateStatus)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell density="compact">
                        <Button size="sm" variant={isSelected ? "primary" : "secondary"} disabled={gateCheckActive}>
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableRoot>
        </Card>

        {selectedConsignment && assignedAgent ? (
          <div className="flex flex-col gap-6">
            <Card className="grid gap-4 p-4 sm:grid-cols-[1.2fr_1fr] sm:p-5">
              <div className="space-y-3">
                <SectionHeader
                  title={selectedConsignment.reference}
                  description="Shipment profile"
                  actions={
                    <Button size="sm" variant="secondary" onClick={handleOpenEdit} disabled={gateCheckActive}>
                      Edit
                    </Button>
                  }
                />
                <p className="text-sm leading-6 text-text-secondary">{selectedConsignment.policyNarrative}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card variant="inset" className="p-3">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Destination</p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">{selectedConsignment.destination}</p>
                  </Card>
                  <Card variant="inset" className="p-3">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Traceability</p>
                    <StatusBadge status={TRACE_STATUS_MAP[selectedConsignment.traceabilityStatus]}>
                      {formatLabel(selectedConsignment.traceabilityStatus)}
                    </StatusBadge>
                  </Card>
                  <Card variant="inset" className="p-3">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Operator Agent</p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">{assignedAgent.name}</p>
                  </Card>
                  <Card variant="inset" className="p-3">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Output Eligibility</p>
                    <StatusBadge status={ELIGIBILITY_STATUS_MAP[selectedConsignment.outputEligibility]}>
                      {formatLabel(selectedConsignment.outputEligibility)}
                    </StatusBadge>
                  </Card>
                </div>
              </div>

              <div className="grid gap-3">
                <Card variant="inset" className="p-3">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Agent Readiness</p>
                  <StatusBadge status={assignedAgent.readiness === "READY" ? "ready" : "review_required"}>
                    {formatLabel(assignedAgent.readiness)}
                  </StatusBadge>
                </Card>
                <Card variant="inset" className="p-3">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Package Snapshot</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">
                    {outputPackage ? outputPackage.packageRef : "No package started"}
                  </p>
                </Card>
                <Card variant="inset" className="p-3">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Line Count</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{selectedConsignment.lineSummary.length} line(s)</p>
                </Card>
              </div>
            </Card>

            <Card className="space-y-4 p-4 sm:p-5">
              <SectionHeader
                title="Pre-Export Check"
                actions={
                  !gateCheckActive && gateCheckStep === 0 ? (
                    <Button size="sm" onClick={runGateCheck}>
                      Run Clearance Scan
                    </Button>
                  ) : null
                }
              />
              {gateCheckActive || gateCheckStep > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { key: "bom", label: "BOM Audit", status: gateCheckResults.bom },
                    { key: "supplier", label: "Supplier", status: gateCheckResults.supplier },
                    { key: "coordinates", label: "Geolocation", status: gateCheckResults.coordinates },
                    { key: "coc", label: "CoC & Docs", status: gateCheckResults.coc },
                  ].map((item) => (
                    <Card key={item.key} variant="inset" className="p-3">
                      <p className="text-xs uppercase tracking-wide text-text-secondary">{item.label}</p>
                      <div className="mt-2">
                        <StatusBadge status={CHECK_STATUS_MAP[item.status]}>{item.status}</StatusBadge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card variant="inset" className="p-3 text-sm text-text-secondary">
                  Run the clearance scan to evaluate gate checks step-by-step.
                </Card>
              )}
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="space-y-4 p-4 sm:p-5">
                <SectionHeader title="Line Trace Status" />
                <div className="space-y-2">
                  {selectedConsignment.lineSummary.map((line) => (
                    <Card key={line} variant="inset" className="p-3 text-sm text-text-secondary">
                      {line}
                    </Card>
                  ))}
                </div>
              </Card>
              <Card className="space-y-4 p-4 sm:p-5">
                <SectionHeader title="Assigned Operator" />
                <Card variant="inset" className="p-3 text-sm leading-6 text-text-secondary">
                  This shipment is routed to <strong>{assignedAgent.name}</strong>. The compliance operator must confirm
                  agent registry in TRACES before customs appeal.
                </Card>
              </Card>
            </div>

            <Card className="space-y-4 p-4 sm:p-5">
              <SectionHeader title="Gate Issues" description="Blocking and warning issues with source context." />
              {visibleIssues.length === 0 ? (
                <Card variant="inset" className="p-3">
                  <StatusBadge status="ready">No blocking or warning issues remain in this scenario.</StatusBadge>
                </Card>
              ) : (
                <div className="space-y-3">
                  {visibleIssues.map((issue) => (
                    <Card key={issue.code} variant={issue.blocking ? "alert" : "inset"} className="space-y-2 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-brand-primary">{issue.code}</p>
                        <div className="flex items-center gap-2">
                          <RiskBadge risk={ISSUE_SEVERITY_MAP[issue.severity]}>{issue.severity}</RiskBadge>
                          <StatusBadge status={issue.blocking ? "blocked" : "review_required"}>
                            {issue.blocking ? "BLOCKING" : "REVIEW"}
                          </StatusBadge>
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary">{issue.message}</p>
                      <p className="font-mono text-xs text-text-secondary">Source domain: {issue.sourceDomain}</p>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            <Card className="space-y-3 p-4 sm:p-5">
              <SectionHeader title="Next Action" />
              <Card variant="inset" className="p-3 text-sm leading-6 text-text-secondary">
                {selectedConsignment.nextAction}
              </Card>
            </Card>
          </div>
        ) : (
          <Card className="p-10 text-center text-sm text-text-secondary">
            Select a consignment shipment from the left to review details.
          </Card>
        )}
      </div>

      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-page/80 p-4 backdrop-blur-sm">
          <Card className="max-h-[92vh] w-full max-w-5xl overflow-y-auto p-5 sm:p-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-brand-primary">
                {isEditModalOpen ? "Modify Shipment Parameters" : "Register New Consignment Shipment"}
              </h2>
              <p className="text-sm text-text-secondary">
                Declare reference identifiers, destination, operator assignment, and compliance checkpoints.
              </p>
            </div>

            <form onSubmit={(event) => handleSaveConsignment(event, isEditModalOpen)} className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                <label className="space-y-2 text-sm">
                  <span className="text-text-secondary">Shipment Reference ID</span>
                  <Input required value={formRef} onChange={(event) => setFormRef(event.target.value)} />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-text-secondary">Shipment Load Weight</span>
                  <Input required value={formWeight} onChange={(event) => setFormWeight(event.target.value)} />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2 text-sm">
                  <span className="text-text-secondary">Destination Port</span>
                  <Select value={formDest} onChange={(event) => setFormDest(event.target.value)}>
                    <option value="Rotterdam, Netherlands">Rotterdam, Netherlands</option>
                    <option value="Hamburg, Germany">Hamburg, Germany</option>
                    <option value="Antwerp, Belgium">Antwerp, Belgium</option>
                    <option value="Venice, Italy">Venice, Italy</option>
                    <option value="Karachi, Pakistan">Karachi, Pakistan</option>
                  </Select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-text-secondary">Assigned Operator Agent</span>
                  <Select value={formAgentId} onChange={(event) => setFormAgentId(event.target.value)}>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.country})
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-text-secondary">Shipment Priority Mode</span>
                  <Select
                    value={formShipMode}
                    onChange={(event) =>
                      setFormShipMode(event.target.value as "CURRENT_EXPORT" | "FUTURE_EXPORT")
                    }
                  >
                    <option value="CURRENT_EXPORT">CURRENT ACTIVE EXPORT</option>
                    <option value="FUTURE_EXPORT">FUTURE PLANNED EXPORT</option>
                  </Select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2 text-sm">
                  <span className="text-text-secondary">Gate Compliance Status</span>
                  <Select
                    value={formGateStatus}
                    onChange={(event) =>
                      setFormGateStatus(event.target.value as "READY" | "BLOCKED" | "REVIEW_REQUIRED")
                    }
                  >
                    <option value="READY">READY</option>
                    <option value="REVIEW_REQUIRED">REVIEW REQUIRED</option>
                    <option value="BLOCKED">BLOCKED</option>
                  </Select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-text-secondary">TRACES Package Posture</span>
                  <Select
                    value={formEligibility}
                    onChange={(event) =>
                      setFormEligibility(event.target.value as "PACKAGE_READY" | "HELD" | "SCOPE_REVIEW")
                    }
                  >
                    <option value="PACKAGE_READY">PACKAGE READY</option>
                    <option value="HELD">HELD</option>
                    <option value="SCOPE_REVIEW">SCOPE REVIEW</option>
                  </Select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-text-secondary">Traceability Posture</span>
                  <Select
                    value={formTraceStatus}
                    onChange={(event) =>
                      setFormTraceStatus(event.target.value as "TRACEABLE" | "BLOCKED" | "REVIEW_REQUIRED")
                    }
                  >
                    <option value="TRACEABLE">TRACEABLE</option>
                    <option value="REVIEW_REQUIRED">REVIEW REQUIRED</option>
                    <option value="BLOCKED">BLOCKED</option>
                  </Select>
                </label>
              </div>

              <label className="space-y-2 text-sm">
                <span className="text-text-secondary">Shipment Narrative</span>
                <Input value={formNarrative} onChange={(event) => setFormNarrative(event.target.value)} />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-text-secondary">Next Operational Action</span>
                <Textarea
                  rows={3}
                  value={formNextAction}
                  onChange={(event) => setFormNextAction(event.target.value)}
                />
              </label>

              <Card variant="inset" className="space-y-4 p-4">
                <SectionHeader title="Compliance Issues Builder" />
                {formIssues.length === 0 ? (
                  <p className="text-sm text-text-secondary">No custom compliance blockers added.</p>
                ) : (
                  <div className="space-y-2">
                    {formIssues.map((issue) => (
                      <Card key={issue.code} variant="inset" className="flex items-start justify-between gap-3 p-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-brand-primary">
                            {issue.code} ({issue.severity})
                          </p>
                          <p className="text-xs text-text-secondary">
                            {issue.sourceDomain} | {issue.message}
                          </p>
                        </div>
                        <Button type="button" size="sm" variant="danger" onClick={() => handleRemoveIssue(issue.code)}>
                          Remove
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr_1fr]">
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Issue Code</span>
                    <Input value={issueCode} onChange={(event) => setIssueCode(event.target.value)} />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Severity</span>
                    <Select
                      value={issueSeverity}
                      onChange={(event) => setIssueSeverity(event.target.value as "WARNING" | "HIGH" | "CRITICAL")}
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="WARNING">WARNING</option>
                    </Select>
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Source Domain</span>
                    <Select value={issueDomain} onChange={(event) => setIssueDomain(event.target.value)}>
                      <option value="GEOLOCATION">GEOLOCATION</option>
                      <option value="SUPPLIER">SUPPLIER</option>
                      <option value="PRODUCT">PRODUCT / BOM</option>
                      <option value="TRACEABILITY">TRACEABILITY</option>
                      <option value="DOCUMENTS">DOCUMENTS</option>
                    </Select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
                  <label className="space-y-2 text-sm">
                    <span className="text-text-secondary">Issue Description</span>
                    <Input value={issueMsg} onChange={(event) => setIssueMsg(event.target.value)} />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={issueBlocking}
                      onChange={(event) => setIssueBlocking(event.target.checked)}
                    />
                    Blocking issue
                  </label>
                  <Button type="button" onClick={handleAddIssue}>
                    Add Issue
                  </Button>
                </div>
              </Card>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit">{isEditModalOpen ? "Save Changes" : "Create Shipment"}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
