"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/ui/PermissionGuard";
import { getScenarioData, AgentProfile } from "@/lib/gfi-dummy-data";

export default function AgentsPage() {
  const { 
    agents: contextAgents, 
    addAgent, 
    editAgent, 
    consignments, 
    scenarioId 
  } = useSession();

  const scenarioData = getScenarioData(scenarioId);
  const { outputPackages } = scenarioData;

  const [selectedAgentId, setSelectedAgentId] = useState("");

  // Search state for VIES EORI database
  const [eoriQuery, setEoriQuery] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    status: "VALID" | "INVALID" | "PENDING";
    eori: string;
    name: string;
    address: string;
    details?: string;
  } | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCountry, setFormCountry] = useState("Germany");
  const [formOperatorMode, setFormOperatorMode] = useState<"EU_OPERATOR_AGENT" | "DIRECT_OPERATOR">("EU_OPERATOR_AGENT");
  const [formEoriStatus, setFormEoriStatus] = useState<"VERIFIED" | "MISSING">("MISSING");
  const [formTracesStatus, setFormTracesStatus] = useState<"VERIFIED" | "PENDING">("PENDING");
  const [formReadiness, setFormReadiness] = useState<"READY" | "FOLLOW_UP_REQUIRED" | "BLOCKED">("FOLLOW_UP_REQUIRED");
  const [formNotes, setFormNotes] = useState("");
  const [formAssignedConsignmentIds, setFormAssignedConsignmentIds] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  // Apply scenario-based overrides dynamically
  const processedAgents = React.useMemo(() => {
    const agentsClone = JSON.parse(JSON.stringify(contextAgents)) as AgentProfile[];

    if (scenarioId === "after_cocoa_remediation") {
      const rhine = agentsClone.find((a) => a.id === "agent-rhine-bv");
      if (rhine) {
        rhine.readiness = "READY";
        rhine.tracesStatus = "VERIFIED";
        const noteMsg = "TRACES registration successfully verified via automated daily sync.";
        if (!rhine.notes.includes(noteMsg)) {
          rhine.notes.unshift(noteMsg);
        }
      }
    }
    return agentsClone;
  }, [contextAgents, scenarioId]);

  // Handle selected Agent fallback
  useEffect(() => {
    if (processedAgents.length > 0) {
      const stillExists = processedAgents.some((a) => a.id === selectedAgentId);
      if (!stillExists) {
        setSelectedAgentId(processedAgents[0].id);
      }
    }
  }, [processedAgents, selectedAgentId]);

  const selectedAgent = processedAgents.find((agent) => agent.id === selectedAgentId) ?? processedAgents[0];

  // Sync pre-filled EORI search query when agent changes
  useEffect(() => {
    if (selectedAgent) {
      const dummyEori = selectedAgent.id === "agent-fos-eu" ? "DE812345678" : "NL809876543";
      setEoriQuery(dummyEori);
      setValidationResult(null);
    }
  }, [selectedAgentId, selectedAgent]);

  const handleViesCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eoriQuery.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    // Simulate 1.2-second network latency to EU VIES API
    setTimeout(() => {
      setIsValidating(false);

      if (eoriQuery.toUpperCase().startsWith("DE") || eoriQuery.toUpperCase().startsWith("NL")) {
        setValidationResult({
          status: "VALID",
          eori: eoriQuery.toUpperCase(),
          name: selectedAgent ? selectedAgent.name : "Verified EU Operator Import Corp",
          address: selectedAgent?.id === "agent-fos-eu" 
            ? "Compliance Allee 12, 20457 Hamburg, Germany" 
            : "Keizersgracht 451, 1016 EK Amsterdam, Netherlands",
          details: "Matches active VAT and economic operator registries. Clear for customs operations.",
        });
      } else {
        setValidationResult({
          status: "INVALID",
          eori: eoriQuery.toUpperCase(),
          name: "UNKNOWN / UNREGISTERED",
          address: "N/A",
          details: "No record found in EU VIES database. Customs filings will be rejected.",
        });
      }
    }, 1200);
  };

  const handleManualOverride = () => {
    if (!selectedAgent) return;
    
    const updatedAgent: AgentProfile = {
      ...selectedAgent,
      readiness: "READY",
      eoriStatus: "VERIFIED",
      tracesStatus: "VERIFIED",
      notes: [
        `Manual compliance override applied by Operator on ${new Date().toLocaleDateString()}`,
        ...selectedAgent.notes,
      ],
    };

    editAgent(updatedAgent);

    // Update result to represent validated operator
    setValidationResult({
      status: "VALID",
      eori: eoriQuery.toUpperCase() || "MANUAL-OVERRIDE",
      name: selectedAgent.name,
      address: "Manually overridden by compliance officer",
      details: "Bypassed active VIES check via validated internal compliance proof.",
    });
  };

  const resetForm = () => {
    setFormName("");
    setFormCountry("Germany");
    setFormOperatorMode("EU_OPERATOR_AGENT");
    setFormEoriStatus("MISSING");
    setFormTracesStatus("PENDING");
    setFormReadiness("FOLLOW_UP_REQUIRED");
    setFormNotes("");
    setFormAssignedConsignmentIds([]);
    setEditingId(null);
  };

  const handleOpenEdit = () => {
    if (!selectedAgent) return;
    setEditingId(selectedAgent.id);
    setFormName(selectedAgent.name);
    setFormCountry(selectedAgent.country);
    setFormOperatorMode(selectedAgent.operatorMode);
    setFormEoriStatus(selectedAgent.eoriStatus);
    setFormTracesStatus(selectedAgent.tracesStatus);
    setFormReadiness(selectedAgent.readiness);
    setFormNotes(selectedAgent.notes.join("\n"));
    setFormAssignedConsignmentIds(selectedAgent.assignedConsignmentIds || []);
    setIsEditModalOpen(true);
  };

  const handleSaveAgent = (e: React.FormEvent, isEdit: boolean) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const agentData: AgentProfile = {
      id: isEdit && editingId ? editingId : `agent-${Date.now()}`,
      name: formName,
      country: formCountry,
      operatorMode: formOperatorMode,
      eoriStatus: formEoriStatus,
      tracesStatus: formTracesStatus,
      readiness: formReadiness,
      assignedConsignmentIds: formAssignedConsignmentIds,
      notes: formNotes ? formNotes.split("\n").filter(n => n.trim() !== "") : ["No registration notes compiled."],
    };

    if (isEdit) {
      editAgent(agentData);
      setIsEditModalOpen(false);
    } else {
      addAgent(agentData);
      setSelectedAgentId(agentData.id);
      setIsAddModalOpen(false);
    }
    resetForm();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", width: "100%" }}>
      <div className="page-header">
        <div className="page-title">
          <h1>EU Agent Readiness</h1>
          <p>
            Track the receiving operator context for GFI flows: EORI, TRACES, assigned shipments, and whether a package can be handed over safely.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "var(--space-6)", alignItems: "start" }}>
        {/* Left: Agents List */}
        <div className="fos-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--fos-primary)" }}>Agent List</h2>
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="btn-primary"
              style={{ padding: "6px 12px", fontSize: "var(--text-xs)", textTransform: "uppercase", fontWeight: 700 }}
            >
              + Add Agent
            </button>
          </div>
          {processedAgents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              style={{
                textAlign: "left",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${selectedAgent?.id === agent.id ? "var(--fos-accent)" : "var(--fos-border)"}`,
                background: selectedAgent?.id === agent.id ? "rgba(217, 242, 79, 0.08)" : "var(--fos-surface)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                <strong style={{ color: "var(--fos-primary)" }}>{agent.name}</strong>
                <span className={`status-badge status-${agent.readiness === "READY" ? "ready" : agent.readiness === "BLOCKED" ? "blocked" : "review-required"}`}>
                  {agent.readiness.replace(/_/g, " ")}
                </span>
              </div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", marginTop: "8px" }}>
                {agent.country} | {agent.operatorMode.replace(/_/g, " ")}
              </p>
            </button>
          ))}
        </div>

        {/* Right: Selected Agent & Interactive Tools */}
        {selectedAgent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            
            {/* Agent Profile Details Card */}
            <div className="fos-card" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "var(--space-5)" }}>
              <div style={{ display: "grid", gap: "var(--space-3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Agent profile
                    </p>
                    <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 900, color: "var(--fos-primary)", marginTop: "4px" }}>
                      {selectedAgent.name}
                    </h2>
                  </div>
                  <button
                    onClick={handleOpenEdit}
                    className="btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "var(--text-xs)", cursor: "pointer", fontWeight: 700 }}
                  >
                    ✏️ Edit
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--space-4)" }}>
                  <div>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>Operator mode</p>
                    <strong style={{ color: "var(--fos-primary)" }}>{selectedAgent.operatorMode.replace(/_/g, " ")}</strong>
                  </div>
                  <div>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>Country</p>
                    <strong style={{ color: "var(--fos-primary)" }}>{selectedAgent.country}</strong>
                  </div>
                  <div>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>EORI Registry</p>
                    <strong style={{ color: selectedAgent.eoriStatus === "VERIFIED" ? "#22C55E" : "var(--risk-high)" }}>
                      {selectedAgent.eoriStatus}
                    </strong>
                  </div>
                  <div>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>TRACES Status</p>
                    <strong style={{ color: selectedAgent.tracesStatus === "VERIFIED" ? "#22C55E" : "var(--risk-medium)" }}>
                      {selectedAgent.tracesStatus}
                    </strong>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {selectedAgent.notes && selectedAgent.notes.map((note, index) => (
                  <div key={index} style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--fos-border)", color: "var(--fos-text-secondary)", fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
                    {note}
                  </div>
                ))}
              </div>
            </div>

            {/* EORI VIES Validator tool (Interactive) */}
            <div className="fos-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--fos-primary)" }}>
                  EORI Verification
                </h3>
                <span className="status-badge status-review-required" style={{ fontSize: "10px" }}>Real-time Gateway</span>
              </div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", lineHeight: 1.5 }}>
                Under EUDR, any receiving operator in the EU must possess a fully valid and verified EORI number matching economic records to clear customs without holding.
              </p>

              <form onSubmit={handleViesCheck} style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                <input
                  type="text"
                  value={eoriQuery}
                  onChange={(e) => setEoriQuery(e.target.value)}
                  placeholder="Enter EORI Number (e.g. NL809876543)"
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--fos-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--fos-primary)",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={isValidating || !eoriQuery.trim()}
                  className="btn btn-primary"
                  style={{ cursor: "pointer" }}
                >
                  {isValidating ? "Validating..." : "Query VIES"}
                </button>
              </form>

              {/* Validation Response (Micro-animations / simulated results) */}
              {isValidating && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", border: "1px solid var(--fos-border)", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.01)" }}>
                  <div className="animate-spin" style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid rgba(217, 242, 79, 0.2)",
                    borderTopColor: "var(--fos-accent)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }} />
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--fos-text-secondary)" }}>
                    Connecting to EU Customs VAT and Economic Operator Registry...
                  </span>
                </div>
              )}

              {validationResult && (
                <div style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${validationResult.status === "VALID" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                  background: validationResult.status === "VALID" ? "rgba(34, 197, 94, 0.05)" : "rgba(239, 68, 68, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  animation: "fadeIn 0.3s ease-out",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "var(--fos-primary)" }}>Result: {validationResult.eori}</strong>
                    <span className={`status-badge status-${validationResult.status === "VALID" ? "ready" : "blocked"}`}>
                      {validationResult.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--fos-text-secondary)" }}>
                    <p><strong>Registered Name:</strong> {validationResult.name}</p>
                    <p style={{ marginTop: "4px" }}><strong>VIES Address:</strong> {validationResult.address}</p>
                    <p style={{ marginTop: "6px", color: validationResult.status === "VALID" ? "#22C55E" : "#ef4444", fontSize: "var(--text-xs)" }}>
                      ℹ️ {validationResult.details}
                    </p>
                  </div>

                  {validationResult.status === "INVALID" && (
                    <button
                      onClick={handleManualOverride}
                      className="btn"
                      style={{
                        marginTop: "8px",
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid #ef4444",
                        color: "#ef4444",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        alignSelf: "flex-start",
                      }}
                    >
                      Bypass & Apply Compliance Override
                    </button>
                  )}
                </div>
              )}

              {/* Manual Override Option when pending/not validated */}
              {selectedAgent.readiness !== "READY" && !validationResult && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", border: "1px dashed var(--fos-border)", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.01)" }}>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>
                    Verification pending. You can bypass registry validations with internal evidence.
                  </span>
                  <button
                    onClick={handleManualOverride}
                    className="btn"
                    style={{
                      background: "rgba(217, 242, 79, 0.1)",
                      border: "1px solid var(--fos-accent)",
                      color: "var(--fos-accent)",
                      padding: "6px 12px",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                    }}
                  >
                    Bypass Registry & Approve Agent
                  </button>
                </div>
              )}
            </div>

            {/* Shipments and Packages lists */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)" }}>
              
              {/* Assigned Consignments (Scenario-aware) */}
              <div className="fos-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--fos-primary)" }}>Assigned consignments</h3>
                {!selectedAgent.assignedConsignmentIds || selectedAgent.assignedConsignmentIds.length === 0 ? (
                  <p style={{ color: "var(--fos-text-secondary)", fontSize: "var(--text-sm)" }}>No assigned consignments.</p>
                ) : (
                  selectedAgent.assignedConsignmentIds.map((consignmentId) => {
                    const consignment = consignments.find((item) => item.id === consignmentId);
                    if (!consignment) return null;
                    return (
                      <div key={consignmentId} style={{ padding: "12px", border: "1px solid var(--fos-border)", borderRadius: "var(--radius-sm)", background: "rgba(255, 255, 255, 0.01)", display: "grid", gap: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ color: "var(--fos-primary)" }}>{consignment.reference}</strong>
                          <span className={`status-badge status-${consignment.gateStatus === "READY" ? "ready" : consignment.gateStatus === "BLOCKED" ? "blocked" : "review-required"}`} style={{ fontSize: "9px" }}>
                            {consignment.gateStatus}
                          </span>
                        </div>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>
                          {consignment.destination} | {consignment.outputEligibility.replace(/_/g, " ")}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Available Packages (Scenario-aware) */}
              <div className="fos-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--fos-primary)" }}>Available packages</h3>
                {!selectedAgent.assignedConsignmentIds || outputPackages.filter((pkg) => selectedAgent.assignedConsignmentIds.includes(pkg.consignmentId)).length === 0 ? (
                  <p style={{ color: "var(--fos-text-secondary)", fontSize: "var(--text-sm)" }}>No compiled output packages available.</p>
                ) : (
                  outputPackages
                    .filter((pkg) => selectedAgent.assignedConsignmentIds.includes(pkg.consignmentId))
                    .map((pkg) => (
                      <div key={pkg.id} style={{ padding: "12px", border: "1px solid var(--fos-border)", borderRadius: "var(--radius-sm)", background: "rgba(255, 255, 255, 0.01)", display: "grid", gap: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ color: "var(--fos-primary)" }}>{pkg.packageRef}</strong>
                          <span className={`status-badge status-${pkg.status === "READY_FOR_AGENT" || pkg.status === "ASSEMBLED" ? "ready" : "blocked"}`} style={{ fontSize: "9px" }}>
                            {pkg.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>
                          Mode: {pkg.mode.replace(/_/g, " ")} | Artifacts: {pkg.artifacts.length} files
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="fos-card" style={{ padding: "40px", textAlign: "center", color: "var(--fos-text-secondary)" }}>
            Select an operator agent from the left to review registry details.
          </div>
        )}
      </div>

      {/* Add / Edit Agent Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              resetForm();
            }
          }}
          style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(6px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "var(--fos-surface)",
            border: "1px solid var(--fos-border)",
            borderRadius: "var(--radius-lg)",
            width: "95%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "var(--space-6)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)"
          }}>
            <div>
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 900, color: "var(--fos-accent)" }}>
                {isEditModalOpen ? "Modify Agent Registry Profile" : "Register New Economic Operator Agent"}
              </h2>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>
                Configure অর্থনৈতিক (economic) operator entities, VAT/EORI posture, TRACES statuses, and clearance readiness.
              </p>
            </div>

            <form onSubmit={(e) => handleSaveAgent(e, isEditModalOpen)} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div className="form-group">
                <label className="form-label">Operator Agent Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Rhine Logistics BV"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-group">
                  <label className="form-label">Country of Registration</label>
                  <input
                    type="text"
                    required
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Germany"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Operator Role Mode</label>
                  <select
                    value={formOperatorMode}
                    onChange={(e) => setFormOperatorMode(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="EU_OPERATOR_AGENT">EU Operator Agent (Importer of Record)</option>
                    <option value="DIRECT_OPERATOR">Direct Operator (GFI EU Hub)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-group">
                  <label className="form-label">EORI Registry Status</label>
                  <select
                    value={formEoriStatus}
                    onChange={(e) => setFormEoriStatus(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="MISSING">MISSING / UNREGISTERED</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">TRACES System Status</label>
                  <select
                    value={formTracesStatus}
                    onChange={(e) => setFormTracesStatus(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="VERIFIED">VERIFIED (Active)</option>
                    <option value="PENDING">PENDING (Awaiting Sync)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Clearance Readiness</label>
                  <select
                    value={formReadiness}
                    onChange={(e) => setFormReadiness(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="READY">READY (Passed)</option>
                    <option value="FOLLOW_UP_REQUIRED">FOLLOW UP REQUIRED</option>
                    <option value="BLOCKED">BLOCKED</option>
                  </select>
                </div>
              </div>

              {/* Interactive Assigned Consignment Linkages Checklist */}
              <div className="form-group">
                <label className="form-label">Assigned Consignment Shipments</label>
                <div style={{
                  maxHeight: "150px",
                  overflowY: "auto",
                  border: "1px solid var(--fos-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px",
                  background: "rgba(0,0,0,0.2)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  {consignments.length === 0 ? (
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>No consignments registered in sandbox.</span>
                  ) : (
                    consignments.map((con) => {
                      const isChecked = formAssignedConsignmentIds.includes(con.id);
                      return (
                        <label key={con.id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "var(--text-xs)", color: "var(--fos-primary)" }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setFormAssignedConsignmentIds(prev => prev.filter(id => id !== con.id));
                              } else {
                                setFormAssignedConsignmentIds(prev => [...prev, con.id]);
                              }
                            }}
                            style={{ accentColor: "var(--fos-accent)" }}
                          />
                          <span>{con.reference} ({con.destination})</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Compliance & Registration Notes (One per line)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="form-input"
                  style={{ minHeight: "80px", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
                  placeholder="e.g. TRACES registration completed on 2026-05-10&#10;EORI economic record checked via manual customs portal."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "var(--space-4)" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                  style={{ cursor: "pointer", fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ cursor: "pointer", textTransform: "uppercase", fontWeight: 700 }}
                >
                  {isEditModalOpen ? "Save Changes" : "Register Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
