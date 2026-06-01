"use client";

import React, { useState } from "react";
import { useSession } from "@/components/ui/PermissionGuard";
import { Button, FormActions, FormField, FormGrid, FormSection, Input, ModalBody, ModalFooter, ModalHeader, ModalShell, Select } from "@/components/ui";

interface ERPReceipt {
  id: string;
  lotNumber: string;
  supplierName: string;
  commodity: "COCOA" | "PALM" | "SUGAR";
  quantity: string;
  date: string;
  hsCode: string;
  cocType: string;
  isHsMissing: boolean;
  isCocMissing: boolean;
  status: "PENDING_ENRICHMENT" | "ENRICHED";
}

export default function ERPIntegrationPage() {
  const { 
    receipts, 
    addReceipt, 
    editReceipt,
    suppliers,
    scenarioId 
  } = useSession();

  // Loading and feedback states
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states
  const [formLotNumber, setFormLotNumber] = useState("");
  const [supplierSelectType, setSupplierSelectType] = useState("CUSTOM");
  const [formSupplierName, setFormSupplierName] = useState("");
  const [formCommodity, setFormCommodity] = useState<"COCOA" | "PALM" | "SUGAR">("COCOA");
  const [formQuantity, setFormQuantity] = useState("25.0 MT");
  const [formDate, setFormDate] = useState("2026-05-22");
  const [formHsCode, setFormHsCode] = useState("");
  const [formCocType, setFormCocType] = useState("");
  const [formStatus, setFormStatus] = useState<"PENDING_ENRICHMENT" | "ENRICHED">("PENDING_ENRICHMENT");

  const [editingId, setEditingId] = useState<string | null>(null);

  // Dynamic calculations based on state
  const missingHsCount = receipts.filter(r => r.isHsMissing && r.status === "PENDING_ENRICHMENT").length;
  const missingCocCount = receipts.filter(r => r.isCocMissing && r.status === "PENDING_ENRICHMENT").length;
  const pendingCount = receipts.filter(r => r.status === "PENDING_ENRICHMENT").length;

  const handleHsChange = (id: string, value: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (receipt) {
      editReceipt({
        ...receipt,
        hsCode: value,
        isHsMissing: value === ""
      });
    }
  };

  const handleCocChange = (id: string, value: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (receipt) {
      editReceipt({
        ...receipt,
        cocType: value,
        isCocMissing: value === ""
      });
    }
  };

  const handleEnrichReceipt = (id: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (!receipt || receipt.isHsMissing || receipt.isCocMissing) return;

    setSubmittingId(id);

    // Simulate ledger validation and SAP synchronization delay
    setTimeout(() => {
      editReceipt({
        ...receipt,
        status: "ENRICHED"
      });
      setSubmittingId(null);
      setSuccessToast(`Successfully enriched ${receipt.lotNumber} and synchronized with SAP ledger!`);
      setTimeout(() => setSuccessToast(null), 3000);
    }, 1000);
  };

  const resetForm = () => {
    setFormLotNumber("");
    setSupplierSelectType("CUSTOM");
    setFormSupplierName("");
    setFormCommodity("COCOA");
    setFormQuantity("25.0 MT");
    setFormDate("2026-05-22");
    setFormHsCode("");
    setFormCocType("");
    setFormStatus("PENDING_ENRICHMENT");
    setEditingId(null);
  };

  const handleOpenEdit = (receipt: ERPReceipt) => {
    setEditingId(receipt.id);
    setFormLotNumber(receipt.lotNumber);
    
    // Set supplier matching
    const matchedSupplier = suppliers.find(s => s.name === receipt.supplierName);
    if (matchedSupplier) {
      setSupplierSelectType(matchedSupplier.name);
      setFormSupplierName(matchedSupplier.name);
    } else {
      setSupplierSelectType("CUSTOM");
      setFormSupplierName(receipt.supplierName);
    }

    setFormCommodity(receipt.commodity);
    setFormQuantity(receipt.quantity);
    setFormDate(receipt.date);
    setFormHsCode(receipt.hsCode || "");
    setFormCocType(receipt.cocType || "");
    setFormStatus(receipt.status);
    setIsEditModalOpen(true);
  };

  const handleSaveReceipt = (e: React.FormEvent, isEdit: boolean) => {
    e.preventDefault();
    if (!formLotNumber.trim()) return;

    const receiptData: ERPReceipt = {
      id: isEdit && editingId ? editingId : `rcpt-${Date.now()}`,
      lotNumber: formLotNumber,
      supplierName: formSupplierName || "Unknown Sandbox Supplier",
      commodity: formCommodity,
      quantity: formQuantity,
      date: formDate,
      hsCode: formHsCode,
      cocType: formCocType,
      isHsMissing: formHsCode === "",
      isCocMissing: formCocType === "",
      status: formStatus,
    };

    if (isEdit) {
      editReceipt(receiptData);
      setIsEditModalOpen(false);
    } else {
      addReceipt(receiptData);
      setIsAddModalOpen(false);
    }
    resetForm();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", width: "100%" }}>
      <div className="page-header">
        <div className="page-title">
          <h1>Integration and Enrichment</h1>
          <p>
            ERP provides raw transaction dispatches and material logs. FOS enriches HS, CoC models, and geospatial links to secure downstream export readiness.
          </p>
        </div>
      </div>

      {/* Global Success Banner */}
      {successToast && (
        <div style={{
          padding: "16px",
          background: "rgba(34, 197, 94, 0.1)",
          border: "1px solid #22c55e",
          borderRadius: "var(--radius-md)",
          color: "#22c55e",
          fontWeight: 600,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          animation: "fadeIn 0.3s ease-out",
        }}>
          <span>🎉 {successToast}</span>
          <button onClick={() => setSuccessToast(null)} style={{ background: "none", border: "none", color: "#22c55e", cursor: "pointer", fontSize: "16px" }}>×</button>
        </div>
      )}

      {/* Metric Cards (Synchronized with State) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "var(--space-4)" }}>
        <div className="fos-card">
          <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Integration Provider</p>
          <p style={{ fontSize: "var(--text-xl)", fontWeight: 900, color: "var(--fos-primary)", marginTop: "8px" }}>SAP S/4HANA Cloud</p>
        </div>
        <div className="fos-card">
          <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Imported dispatches</p>
          <p style={{ fontSize: "var(--text-4xl)", fontWeight: 900, color: "var(--fos-primary)", marginTop: "8px" }}>{receipts.length}</p>
        </div>
        <div className="fos-card">
          <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Missing HS enrichments</p>
          <p style={{ fontSize: "var(--text-4xl)", fontWeight: 900, color: missingHsCount > 0 ? "var(--risk-medium)" : "#22c55e", marginTop: "8px", transition: "color 0.3s" }}>
            {missingHsCount}
          </p>
        </div>
        <div className="fos-card">
          <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Missing CoC enrichments</p>
          <p style={{ fontSize: "var(--text-4xl)", fontWeight: 900, color: missingCocCount > 0 ? "var(--risk-high)" : "#22c55e", marginTop: "8px", transition: "color 0.3s" }}>
            {missingCocCount}
          </p>
        </div>
      </div>

      {/* SAP Ingestion & Enrichment Board */}
      <div className="fos-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--fos-primary)" }}>SAP Receipt Queue</h2>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", marginTop: "2px" }}>
              Enrich HS commodity classifications and Chain-of-Custody (CoC) types. Unenriched items hold up consignment packaging.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {pendingCount === 0 ? (
              <span className="status-badge status-ready">All Reconciled</span>
            ) : (
              <span className="status-badge status-review-required">{pendingCount} Pending Enrichment</span>
            )}
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="btn-primary"
              style={{ padding: "6px 12px", fontSize: "var(--text-xs)", textTransform: "uppercase", fontWeight: 700 }}
            >
              + Ingest ERP Lot
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="fos-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Lot / ID</th>
                <th>Supplier / Commodity</th>
                <th>Quantity / Date</th>
                <th>HS Code (Select)</th>
                <th>CoC Model (Select)</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => {
                const isReady = !receipt.isHsMissing && !receipt.isCocMissing;
                const isPending = receipt.status === "PENDING_ENRICHMENT";

                return (
                  <tr key={receipt.id} style={{ 
                    background: receipt.status === "ENRICHED" ? "rgba(34, 197, 94, 0.02)" : "transparent",
                    transition: "background 0.3s",
                  }}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <strong style={{ color: "var(--fos-primary)", fontFamily: "monospace" }}>{receipt.lotNumber}</strong>
                        <span style={{ fontSize: "10px", color: "var(--fos-text-secondary)" }}>{receipt.id}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ color: "var(--fos-primary)", fontSize: "var(--text-sm)" }}>{receipt.supplierName}</span>
                        <span className={`risk-badge badge-${receipt.commodity === "COCOA" ? "high" : receipt.commodity === "PALM" ? "medium" : "low"}`} style={{ alignSelf: "flex-start", fontSize: "9px", padding: "1px 6px" }}>
                          {receipt.commodity}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ color: "var(--fos-primary)" }}>{receipt.quantity}</span>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>{receipt.date}</span>
                      </div>
                    </td>
                    <td>
                      {isPending ? (
                        <select
                          value={receipt.hsCode}
                          onChange={(e) => handleHsChange(receipt.id, e.target.value)}
                          style={{
                            padding: "8px 12px",
                            background: "rgba(255, 255, 255, 0.02)",
                            border: `1px solid ${receipt.isHsMissing ? "var(--risk-medium)" : "rgba(34, 197, 94, 0.4)"}`,
                            borderRadius: "var(--radius-sm)",
                            color: "var(--fos-primary)",
                            outline: "none",
                            width: "160px",
                          }}
                        >
                          <option value="">[Missing HS Code]</option>
                          {receipt.commodity === "COCOA" ? (
                            <>
                              <option value="1805.00">1805.00 (Powder)</option>
                              <option value="1803.10">1803.10 (Cocoa Paste)</option>
                            </>
                          ) : receipt.commodity === "PALM" ? (
                            <>
                              <option value="1511.90">1511.90 (Refined Palm)</option>
                              <option value="1516.20">1516.20 (Fat Blend)</option>
                            </>
                          ) : (
                            <>
                              <option value="1701.99">1701.99 (Refined Sugar)</option>
                              <option value="1701.14">1701.14 (Raw Cane Sugar)</option>
                            </>
                          )}
                        </select>
                      ) : (
                        <strong style={{ color: "#22c55e", fontFamily: "monospace" }}>✓ {receipt.hsCode}</strong>
                      )}
                    </td>
                    <td>
                      {isPending ? (
                        <select
                          value={receipt.cocType}
                          onChange={(e) => handleCocChange(receipt.id, e.target.value)}
                          style={{
                            padding: "8px 12px",
                            background: "rgba(255, 255, 255, 0.02)",
                            border: `1px solid ${receipt.isCocMissing ? "var(--risk-high)" : "rgba(34, 197, 94, 0.4)"}`,
                            borderRadius: "var(--radius-sm)",
                            color: "var(--fos-primary)",
                            outline: "none",
                            width: "180px",
                          }}
                        >
                          <option value="">[Missing CoC Model]</option>
                          <option value="Mass Balance">Mass Balance (RSPO MB)</option>
                          <option value="Segregated">Segregated (RSPO SG)</option>
                          <option value="Identity Preserved">Identity Preserved (IP)</option>
                        </select>
                      ) : (
                        <strong style={{ color: "#22c55e" }}>✓ {receipt.cocType}</strong>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {receipt.status === "ENRICHED" ? (
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                          <span className="status-badge status-ready">Reconciled</span>
                          <button
                            onClick={() => handleOpenEdit(receipt)}
                            className="btn-secondary"
                            style={{ padding: "6px 10px", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                          <button
                            onClick={() => handleEnrichReceipt(receipt.id)}
                            disabled={!isReady || submittingId !== null}
                            className="btn"
                            style={{
                              background: isReady ? "rgba(217, 242, 79, 0.1)" : "rgba(255, 255, 255, 0.02)",
                              border: `1px solid ${isReady ? "var(--fos-accent)" : "var(--fos-border)"}`,
                              color: isReady ? "var(--fos-accent)" : "var(--fos-text-secondary)",
                              padding: "8px 14px",
                              borderRadius: "var(--radius-sm)",
                              cursor: isReady ? "pointer" : "not-allowed",
                              fontSize: "var(--text-xs)",
                              fontWeight: 600,
                              minWidth: "110px",
                              transition: "all 0.2s",
                            }}
                          >
                            {submittingId === receipt.id ? "Syncing..." : isReady ? "Reconcile ERP" : "Enrich Missing"}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(receipt)}
                            className="btn-secondary"
                            style={{ padding: "8px 12px", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warnings Board (Dynamic based on remaining missing items) */}
      <div className="fos-card" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "var(--space-6)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--fos-primary)" }}>ERP Gap Assessment</h2>
          {pendingCount > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "rgba(249, 115, 22, 0.05)", border: "1px solid rgba(249, 115, 22, 0.2)", color: "var(--risk-medium)", fontSize: "var(--text-sm)", lineHeight: 1.5 }}>
                ⚠️ <strong>HS Code Review:</strong> ERP does not automatically tag chemically modified Palm Fats. Manual FOS review is mandated before generating the Article 9 Dossier.
              </div>
              <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--risk-high)", fontSize: "var(--text-sm)", lineHeight: 1.5 }}>
                ⚠️ <strong>CoC Discrepancy:</strong> Batch transaction invoices imported from JB Cocoa do not match validated RSPO SG certificates. Manual enrichment required.
              </div>
            </div>
          ) : (
            <div style={{
              padding: "20px",
              borderRadius: "var(--radius-md)",
              background: "rgba(34, 197, 94, 0.05)",
              border: "1px dashed rgba(34, 197, 94, 0.4)",
              color: "#22c55e",
              lineHeight: 1.6,
              fontSize: "var(--text-sm)",
            }}>
              <strong>✨ Ledger Reconciled:</strong> FOS has verified all ERP goods receipts.
              <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                <li>No missing HS code definitions</li>
                <li>Chain-of-Custody signatures matched (100% RSPO / Cocoa origin verified)</li>
                <li>All dispatches cleared for Pre-Export Gate Checks!</li>
              </ul>
            </div>
          )}
        </div>
        
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--fos-border)" }}>
            <strong style={{ color: "var(--fos-primary)" }}>Automated Sync Pipeline</strong>
            <p style={{ marginTop: "8px", color: "var(--fos-text-secondary)", lineHeight: 1.6, fontSize: "var(--text-sm)" }}>
              Goods dispatches, volumes, batch identifiers, and dates are pulled every hour via SAP S/4HANA REST APIs.
            </p>
          </div>
          <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--fos-border)" }}>
            <strong style={{ color: "var(--fos-primary)" }}>Secure Compliance Enrichment</strong>
            <p style={{ marginTop: "8px", color: "var(--fos-text-secondary)", lineHeight: 1.6, fontSize: "var(--text-sm)" }}>
              FOS supplements transaction data with HS code classification appeals, verified cooperative geolocations, and digital attestation signatures.
            </p>
          </div>
        </div>
      </div>

      {/* Add / Edit ERP Goods Receipt Modal */}
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
            title={isEditModalOpen ? "Edit ERP Lot Dispatch" : "Create ERP Goods Receipt"}
            description="Manually register lot deliveries with HS and chain-of-custody context."
            onClose={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              resetForm();
            }}
          />

          <form onSubmit={(e) => handleSaveReceipt(e, isEditModalOpen)}>
            <ModalBody className="space-y-4">
              <FormSection title="Lot Identity">
                <FormGrid>
                  <FormField label="Lot Number Identifier" required>
                    <Input
                      type="text"
                      required
                      value={formLotNumber}
                      onChange={(e) => setFormLotNumber(e.target.value)}
                      placeholder="e.g. LOT-COCOA-MY-999"
                    />
                  </FormField>
                  <FormField label="Material Commodity">
                    <Select value={formCommodity} onChange={(e) => setFormCommodity(e.target.value as any)}>
                      <option value="COCOA">COCOA</option>
                      <option value="PALM">PALM</option>
                      <option value="SUGAR">SUGAR</option>
                    </Select>
                  </FormField>
                </FormGrid>
              </FormSection>

              {/* Linked Supplier Selector */}
              <FormSection title="Supplier and Volume">
                <FormGrid>
                  <FormField label="Associated Supplier Type">
                    <Select 
                    value={supplierSelectType} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setSupplierSelectType(val);
                      if (val === "CUSTOM") {
                        setFormSupplierName("");
                      } else {
                        setFormSupplierName(val);
                      }
                    }} 
                  >
                    <option value="CUSTOM">Custom Supplier (Type below)</option>
                    <optgroup label="Active Suppliers">
                      {suppliers.map(s => (
                        <option key={s.id} value={s.name}>{s.name} (Supplier)</option>
                      ))}
                    </optgroup>
                  </Select>
                  </FormField>
                  <FormField label="Supplier Name" required>
                    <Input
                    type="text"
                    required
                    value={formSupplierName}
                    onChange={(e) => setFormSupplierName(e.target.value)}
                    placeholder="e.g. JB Cocoa SDN BHD"
                    disabled={supplierSelectType !== "CUSTOM"}
                  />
                  </FormField>
                  <FormField label="Lot Load Volume" required>
                    <Input
                    type="text"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="e.g. 24.5 MT"
                  />
                  </FormField>
                  <FormField label="Ingestion Receipt Date" required>
                    <Input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                  </FormField>
                </FormGrid>
              </FormSection>

              <FormSection title="Compliance Enrichment">
                <FormGrid>
                  <FormField label="HS Code Classification (Optional)">
                    <Select
                    value={formHsCode}
                    onChange={(e) => setFormHsCode(e.target.value)}
                  >
                    <option value="">[Missing / Unenriched]</option>
                    {formCommodity === "COCOA" ? (
                      <>
                        <option value="1805.00">1805.00 (Powder)</option>
                        <option value="1803.10">1803.10 (Cocoa Paste)</option>
                      </>
                    ) : formCommodity === "PALM" ? (
                      <>
                        <option value="1511.90">1511.90 (Refined Palm)</option>
                        <option value="1516.20">1516.20 (Fat Blend)</option>
                      </>
                    ) : (
                      <>
                        <option value="1701.99">1701.99 (Refined Sugar)</option>
                        <option value="1701.14">1701.14 (Raw Cane Sugar)</option>
                      </>
                    )}
                  </Select>
                  </FormField>
                  <FormField label="Chain of Custody Model (Optional)">
                    <Select
                    value={formCocType}
                    onChange={(e) => setFormCocType(e.target.value)}
                  >
                    <option value="">[Missing / Unenriched]</option>
                    <option value="Mass Balance">Mass Balance (RSPO MB)</option>
                    <option value="Segregated">Segregated (RSPO SG)</option>
                    <option value="Identity Preserved">Identity Preserved (IP)</option>
                  </Select>
                  </FormField>
                </FormGrid>
                <FormField label="SAP Ingestion Status">
                  <Select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                >
                  <option value="PENDING_ENRICHMENT">PENDING OPERATION ENRICHMENT (Held)</option>
                  <option value="ENRICHED">ENRICHED & RECONCILED (Synced with SAP)</option>
                  </Select>
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
                submitLabel={isEditModalOpen ? "Save changes" : "Create receipt"}
              />
            </ModalFooter>
          </form>
        </ModalShell>
      )}
    </div>
  );
}
