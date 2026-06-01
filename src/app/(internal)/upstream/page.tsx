"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/ui/PermissionGuard";
import { Button, FormActions, FormField, FormGrid, FormSection, ModalBody, ModalFooter, ModalHeader, ModalShell, Select, Textarea, Input } from "@/components/ui";

export default function UpstreamConcernsPage() {
  const { 
    concerns, 
    addConcern, 
    editConcern, 
    suppliers, 
    products, 
    scenarioId 
  } = useSession();

  const [selectedConcernId, setSelectedConcernId] = useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states
  const [formHeadline, setFormHeadline] = useState("");
  const [impactAreaType, setImpactAreaType] = useState("Deforestation Alert");
  const [formImpactAreaText, setFormImpactAreaText] = useState("");
  const [formSeverity, setFormSeverity] = useState<"MEDIUM" | "HIGH" | "CRITICAL">("HIGH");
  const [linkedEntityType, setLinkedEntityType] = useState("CUSTOM");
  const [formLinkedEntity, setFormLinkedEntity] = useState("");
  const [formStatus, setFormStatus] = useState<"OPEN" | "UNDER_REVIEW" | "MITIGATED">("OPEN");
  const [formDownstreamEffect, setFormDownstreamEffect] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  // Sync selected concern if scenario changes and previous selection is invalid
  useEffect(() => {
    if (concerns.length > 0) {
      const exists = concerns.some((c) => c.id === selectedConcernId);
      if (!exists) {
        setSelectedConcernId(concerns[0].id);
      }
    }
  }, [concerns, selectedConcernId]);

  const selectedConcern = concerns.find((concern) => concern.id === selectedConcernId) ?? concerns[0];

  const resetForm = () => {
    setFormHeadline("");
    setImpactAreaType("Deforestation Alert");
    setFormImpactAreaText("");
    setFormSeverity("HIGH");
    setLinkedEntityType("CUSTOM");
    setFormLinkedEntity("");
    setFormStatus("OPEN");
    setFormDownstreamEffect("");
    setEditingId(null);
  };

  const handleOpenEdit = () => {
    if (!selectedConcern) return;
    setEditingId(selectedConcern.id);
    setFormHeadline(selectedConcern.headline);
    
    // Set impact area
    const standardImpacts = ["Deforestation Alert", "Indigenous Land Grievance", "Chain of Custody Disconnect", "Labor Grievance / Human Rights"];
    if (standardImpacts.includes(selectedConcern.impactArea)) {
      setImpactAreaType(selectedConcern.impactArea);
      setFormImpactAreaText("");
    } else {
      setImpactAreaType("CUSTOM");
      setFormImpactAreaText(selectedConcern.impactArea);
    }

    setFormSeverity(selectedConcern.severity);

    // Set linked entity
    const matchedSupplier = suppliers.find(s => s.name === selectedConcern.linkedEntity);
    const matchedProduct = products.find(p => p.name === selectedConcern.linkedEntity);
    if (matchedSupplier) {
      setLinkedEntityType(matchedSupplier.name);
      setFormLinkedEntity(matchedSupplier.name);
    } else if (matchedProduct) {
      setLinkedEntityType(matchedProduct.name);
      setFormLinkedEntity(matchedProduct.name);
    } else {
      setLinkedEntityType("CUSTOM");
      setFormLinkedEntity(selectedConcern.linkedEntity);
    }

    setFormStatus(selectedConcern.status);
    setFormDownstreamEffect(selectedConcern.downstreamEffect);
    setIsEditModalOpen(true);
  };

  const handleSaveConcern = (e: React.FormEvent, isEdit: boolean) => {
    e.preventDefault();
    if (!formHeadline.trim()) return;

    const finalImpactArea = impactAreaType === "CUSTOM" ? (formImpactAreaText || "Custom Grievance") : impactAreaType;

    const concernData = {
      id: isEdit && editingId ? editingId : `concern-${Date.now()}`,
      headline: formHeadline,
      impactArea: finalImpactArea,
      severity: formSeverity,
      linkedEntity: formLinkedEntity || "General Upstream Region",
      status: formStatus,
      downstreamEffect: formDownstreamEffect || "Ongoing evaluation of lot trace blockages required.",
    };

    if (isEdit) {
      editConcern(concernData);
      setIsEditModalOpen(false);
    } else {
      addConcern(concernData);
      setSelectedConcernId(concernData.id);
      setIsAddModalOpen(false);
    }
    resetForm();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", width: "100%" }}>
      <div className="page-header">
        <div className="page-title">
          <h1>Concerns and External Alerts</h1>
          <p>
            Reframed from generic whistleblower triage into the EUDR concern workflow: what surfaced, who is impacted, and how it should invalidate simplified assumptions or export readiness.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "var(--space-6)", alignItems: "start" }}>
        {/* Left: Concerns List */}
        <div className="fos-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--fos-primary)" }}>Concern List</h2>
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="btn-primary"
              style={{ padding: "6px 12px", fontSize: "var(--text-xs)", textTransform: "uppercase", fontWeight: 700 }}
            >
              + Add Grievance Alert
            </button>
          </div>
          {concerns.length === 0 ? (
            <p style={{ color: "var(--fos-text-secondary)", fontSize: "var(--text-sm)" }}>No active concerns found.</p>
          ) : (
            concerns.map((concern) => (
              <button
                key={concern.id}
                onClick={() => setSelectedConcernId(concern.id)}
                style={{
                  textAlign: "left",
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${selectedConcern?.id === concern.id ? "var(--fos-accent)" : "var(--fos-border)"}`,
                  background: selectedConcern?.id === concern.id ? "rgba(217, 242, 79, 0.08)" : "var(--fos-surface)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                  <strong style={{ color: "var(--fos-primary)" }}>{concern.headline}</strong>
                  <span className={`risk-badge badge-${concern.severity.toLowerCase()}`} style={{ flexShrink: 0 }}>
                    {concern.severity}
                  </span>
                </div>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", marginTop: "8px" }}>
                  {concern.status.replace(/_/g, " ")} | {concern.linkedEntity}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Right: Concern Details */}
        {selectedConcern ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            <div className="fos-card" style={{ display: "grid", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Concern detail
                  </p>
                  <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 900, color: "var(--fos-primary)", marginTop: "4px" }}>
                    {selectedConcern.headline}
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "var(--space-4)" }}>
                <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.02)", border: "1px solid var(--fos-border)" }}>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", marginBottom: "4px" }}>Severity</p>
                  <strong>{selectedConcern.severity}</strong>
                </div>
                <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.02)", border: "1px solid var(--fos-border)" }}>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", marginBottom: "4px" }}>Impact area</p>
                  <strong>{selectedConcern.impactArea}</strong>
                </div>
                <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.02)", border: "1px solid var(--fos-border)" }}>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", marginBottom: "4px" }}>Linked entity</p>
                  <strong>{selectedConcern.linkedEntity}</strong>
                </div>
              </div>
            </div>

            <div className="fos-card" style={{ display: "grid", gap: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--fos-primary)" }}>Downstream Impact</h3>
              <div style={{
                padding: "16px",
                background: selectedConcern.status === "MITIGATED" ? "rgba(34, 197, 94, 0.05)" : "rgba(239, 68, 68, 0.05)",
                border: `1px solid ${selectedConcern.status === "MITIGATED" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                borderRadius: "var(--radius-md)",
                color: selectedConcern.status === "MITIGATED" ? "#22C55E" : "#ef4444",
                lineHeight: 1.65,
                fontSize: "var(--text-sm)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <strong>Downstream Resolution Posture:</strong>
                  <span className={`status-badge status-${selectedConcern.status === "MITIGATED" ? "ready" : selectedConcern.status === "UNDER_REVIEW" ? "review-required" : "blocked"}`} style={{ fontSize: "9px" }}>
                    {selectedConcern.status.replace(/_/g, " ")}
                  </span>
                </div>
                {selectedConcern.downstreamEffect}
              </div>
            </div>

            <div className="fos-card" style={{ display: "grid", gap: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--fos-primary)" }}>Why this matters</h3>
              {[
                "Concerns can invalidate simplified due diligence assumptions even in low-risk countries.",
                "Supplier and shipment readiness must change visibly when new evidence or red flags appear.",
                "Concerns should be reviewable as their own workflow, not hidden inside supplier comments.",
              ].map((line) => (
                <div key={line} style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.02)", border: "1px solid var(--fos-border)", color: "var(--fos-text-secondary)", lineHeight: 1.6 }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="fos-card" style={{ padding: "40px", textAlign: "center", color: "var(--fos-text-secondary)" }}>
            Select an active concern from the left to view details.
          </div>
        )}
      </div>

      {/* Add / Edit Concern Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <ModalShell
          open={isAddModalOpen || isEditModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            resetForm();
          }}
          size="lg"
        >
          <ModalHeader
            title={isEditModalOpen ? "Edit Upstream Alert" : "Create Upstream Alert"}
            description="Declare red flags, NGO forest alerts, labor grievances, or community land overlaps."
            onClose={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              resetForm();
            }}
          />
          <form onSubmit={(e) => handleSaveConcern(e, isEditModalOpen)}>
            <ModalBody className="space-y-4">
              <FormSection title="Alert Context">
                <FormField label="Alert Headline" required>
                  <Input
                    required
                    value={formHeadline}
                    onChange={(e) => setFormHeadline(e.target.value)}
                    placeholder="e.g. Forest cover loss identified near Smallholder Block 4"
                  />
                </FormField>
                <FormGrid>
                  <FormField label="Impact Area Domain">
                    <Select value={impactAreaType} onChange={(e) => setImpactAreaType(e.target.value)}>
                      <option value="Deforestation Alert">Deforestation Cover Alert</option>
                      <option value="Indigenous Land Grievance">Indigenous Land Grievance</option>
                      <option value="Chain of Custody Disconnect">Chain of Custody Disconnect</option>
                      <option value="Labor Grievance / Human Rights">Labor / Human Rights Grievance</option>
                      <option value="CUSTOM">Other / Custom Impact Area...</option>
                    </Select>
                  </FormField>
                  <FormField label="Severity Level">
                    <Select value={formSeverity} onChange={(e) => setFormSeverity(e.target.value as any)}>
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                    </Select>
                  </FormField>
                </FormGrid>
                {impactAreaType === "CUSTOM" ? (
                  <FormField label="Specify Custom Impact Domain" required>
                    <Input
                      required
                      value={formImpactAreaText}
                      onChange={(e) => setFormImpactAreaText(e.target.value)}
                      placeholder="e.g. TRACEABILITY_MISMATCH"
                    />
                  </FormField>
                ) : null}
              </FormSection>

              <FormSection title="Linkage and Resolution">
                <FormGrid>
                  <FormField label="Linked Entity Type">
                    <Select
                      value={linkedEntityType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLinkedEntityType(val);
                        if (val === "CUSTOM") setFormLinkedEntity("");
                        else setFormLinkedEntity(val);
                      }}
                    >
                      <option value="CUSTOM">Custom Entity (Type details)</option>
                      <optgroup label="Active Suppliers">
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.name}>{s.name} (Supplier)</option>
                        ))}
                      </optgroup>
                      <optgroup label="Active Products">
                        {products.map((p) => (
                          <option key={p.id} value={p.name}>{p.name} (Product)</option>
                        ))}
                      </optgroup>
                    </Select>
                  </FormField>
                  <FormField label="Linked Entity / Region Name" required>
                    <Input
                      required
                      value={formLinkedEntity}
                      onChange={(e) => setFormLinkedEntity(e.target.value)}
                      placeholder="e.g. JB Cocoa SDN BHD"
                      disabled={linkedEntityType !== "CUSTOM"}
                    />
                  </FormField>
                </FormGrid>
                <FormGrid columns={1}>
                  <FormField label="Resolution Workflow Status">
                    <Select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                      <option value="OPEN">OPEN</option>
                      <option value="UNDER_REVIEW">UNDER REVIEW</option>
                      <option value="MITIGATED">MITIGATED</option>
                    </Select>
                  </FormField>
                </FormGrid>
                <FormField label="Downstream Narrative Resolution Posture">
                  <Textarea
                    value={formDownstreamEffect}
                    onChange={(e) => setFormDownstreamEffect(e.target.value)}
                    className="min-h-[90px]"
                    placeholder="Describe downstream impact on shipment clearances or mitigation proof details..."
                  />
                </FormField>
              </FormSection>
            </ModalBody>
            <ModalFooter>
              <FormActions
                onCancel={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                  resetForm();
                }}
                submitLabel={isEditModalOpen ? "Save changes" : "Create alert"}
              />
            </ModalFooter>
          </form>
        </ModalShell>
      )}
    </div>
  );
}
