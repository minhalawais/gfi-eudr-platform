"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/ui/PermissionGuard";
import { getScenarioData, ReportRecord } from "@/lib/gfi-dummy-data";

export default function AuditReportingPage() {
  const { scenarioId } = useSession();
  const scenarioData = getScenarioData(scenarioId);
  const { concerns, outputPackages, supplierRequests, reports: initialReports } = scenarioData;

  // Local state to manage report history dynamically
  const [reports, setReports] = useState<ReportRecord[]>([]);

  // Wizard form inputs
  const [reportTitle, setReportTitle] = useState("");
  const [reportScope, setReportScope] = useState("Cocoa Supply Chain Verification");
  const [reportNote, setReportNote] = useState("");

  // Report generation progress state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Sync reports list when scenario changes
  useEffect(() => {
    setReports(initialReports);
  }, [scenarioId, initialReports]);

  // Steps for simulated due diligence compiler
  const compileSteps = [
    "Ingesting active supplier declaration registry...",
    "Correlating smallholder plot coordinates (12 farm clusters verified)...",
    "Running deterministic Sentinel-2 deforestation scanning sweep...",
    "Validating SAP S/4HANA dispatches against RSPO SG certificates...",
    "Signing corporate compliance attestation and sealing record...",
  ];

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;

    setIsGenerating(true);
    setGenerationStep(0);
    setGenerationProgress(5);

    // Dynamic multi-stage loading animation
    const totalSteps = compileSteps.length;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < totalSteps) {
        setGenerationStep(currentStep);
        setGenerationProgress((currentStep / totalSteps) * 100);
      } else {
        clearInterval(interval);
        setGenerationProgress(100);

        setTimeout(() => {
          // Append new report record to state
          const newReport: ReportRecord = {
            id: `report-custom-${Date.now()}`,
            title: reportTitle,
            scope: reportScope.replace(/_/g, " "),
            status: "CURRENT",
            generatedAt: new Date().toISOString().split("T")[0],
            note: reportNote.trim() || "Compiled dynamically via compliance portal. Coordinates verified clear of forest loss.",
          };

          setReports((prev) => [newReport, ...prev]);
          setIsGenerating(false);
          setReportTitle("");
          setReportNote("");
        }, 600);
      }
    }, 700);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", width: "100%" }}>
      <div className="page-header">
        <div className="page-title">
          <h1>Audit and Reporting</h1>
          <p>
            Compile retained evidence, review annual due diligence statements, audit concern chronologies, and manage operator DDS packages.
          </p>
        </div>
      </div>

      {/* Metrics Header */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: "var(--space-4)" }}>
        <div className="fos-card">
          <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Annual DD reports
          </p>
          <p style={{ fontSize: "var(--text-4xl)", fontWeight: 900, color: "var(--fos-primary)", marginTop: "8px" }}>{reports.length}</p>
        </div>
        <div className="fos-card">
          <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Evidence package snapshots
          </p>
          <p style={{ fontSize: "var(--text-4xl)", fontWeight: 900, color: "var(--fos-primary)", marginTop: "8px" }}>{outputPackages.length}</p>
        </div>
        <div className="fos-card">
          <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Open review loops
          </p>
          <p style={{ fontSize: "var(--text-4xl)", fontWeight: 900, color: "var(--risk-medium)", marginTop: "8px" }}>{supplierRequests.length}</p>
        </div>
      </div>

      {/* Main Grid: Wizard Form & Report Queue */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "var(--space-6)", alignItems: "start" }}>
        
        {/* Left Panel: Report Generator Wizard */}
        <div className="fos-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--fos-primary)" }}>Report Builder</h2>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", lineHeight: 1.5 }}>
            Select your compliance parameters to compile an Article 9 aligned audit report. FOS automatically binds plot boundaries, satellite scanning logs, and RSPO certifications.
          </p>

          <form onSubmit={handleGenerateReport} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>Report Title</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g. Q2 Cocoa Compliance Audit"
                disabled={isGenerating}
                required
                style={{
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--fos-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--fos-primary)",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>Audit Scope</label>
              <select
                value={reportScope}
                onChange={(e) => setReportScope(e.target.value)}
                disabled={isGenerating}
                style={{
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--fos-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--fos-primary)",
                  outline: "none",
                }}
              >
                <option value="Cocoa Supply Chain Verification">Cocoa Supply Chain Verification</option>
                <option value="Palm Fat Scope Waiver Review">Palm Fat Scope Waiver Review</option>
                <option value="Full Corporate Due Diligence Audit">Full Corporate Due Diligence Audit</option>
                <option value="Geospatial Boundary & Deforestation Statement">Geospatial Boundary Statement</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)" }}>Compliance Notes (Optional)</label>
              <textarea
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                placeholder="Add special findings or customs references..."
                disabled={isGenerating}
                rows={3}
                style={{
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--fos-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--fos-primary)",
                  outline: "none",
                  resize: "none",
                  fontSize: "var(--text-sm)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating || !reportTitle.trim()}
              className="btn btn-primary"
              style={{
                marginTop: "6px",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                cursor: isGenerating ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              {isGenerating ? "Compiling..." : "Compile Due Diligence Statement"}
            </button>
          </form>

          {/* Animated Audit Status Loader */}
          {isGenerating && (
            <div style={{
              marginTop: "12px",
              padding: "14px",
              background: "rgba(255, 255, 255, 0.01)",
              border: "1px dashed var(--fos-border)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              animation: "fadeIn 0.3s ease-out",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--fos-accent)", fontWeight: 700, textTransform: "uppercase" }}>
                  Active Audit Run
                </span>
                <span style={{ fontSize: "11px", color: "var(--fos-text-secondary)" }}>
                  {Math.round(generationProgress)}%
                </span>
              </div>
              
              <div style={{
                height: "6px",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "3px",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${generationProgress}%`,
                  background: "var(--fos-accent)",
                  borderRadius: "3px",
                  transition: "width 0.4s ease-out",
                  boxShadow: "0 0 8px var(--fos-accent)",
                }} />
              </div>

              <span style={{ fontSize: "var(--text-xs)", color: "var(--fos-primary)", minHeight: "36px", display: "block" }}>
                ⚙️ {compileSteps[generationStep]}
              </span>
            </div>
          )}
        </div>

        {/* Right Panel: Governance Reports Table */}
        <div className="fos-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--fos-primary)" }}>Governance Reports</h2>
          <div className="table-container">
            <table className="fos-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Report Statement</th>
                  <th>Audit Scope</th>
                  <th>Status</th>
                  <th>Generated</th>
                  <th>Audit Notes / Details</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} style={{ animation: "fadeIn 0.4s ease-out" }}>
                    <td style={{ fontWeight: 700, color: "var(--fos-primary)" }}>{report.title}</td>
                    <td>{report.scope}</td>
                    <td>
                      <span className={`status-badge status-${report.status.toLowerCase()}`}>{report.status}</span>
                    </td>
                    <td>{report.generatedAt}</td>
                    <td style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", maxWidth: "220px" }}>
                      {report.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Section 2: Concerns Chronology & Invalidation rules */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "var(--space-6)" }}>
        
        {/* Left: Concerns Log */}
        <div className="fos-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--fos-primary)" }}>Concern Timeline</h2>
          {concerns.length === 0 ? (
            <p style={{ color: "var(--fos-text-secondary)", fontSize: "var(--text-sm)" }}>No concerns recorded in current scenario.</p>
          ) : (
            concerns.map((concern) => (
              <div key={concern.id} style={{ 
                padding: "14px", 
                border: "1px solid var(--fos-border)", 
                borderRadius: "var(--radius-md)", 
                background: "rgba(255,255,255,0.01)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                  <strong style={{ color: "var(--fos-primary)" }}>{concern.headline}</strong>
                  <span className={`risk-badge badge-${concern.severity.toLowerCase()}`}>{concern.severity}</span>
                </div>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", lineHeight: 1.5 }}>
                  <strong>Effect:</strong> {concern.downstreamEffect}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Right: Retained Evidence Rules */}
        <div className="fos-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--fos-primary)" }}>Retention Rules</h2>
          {[
            "DDS Package Archiving: Article 9 mandates that all evidence dossiers and plots remain retrievable for at least 5 years.",
            "Review Loop Logging: Timestamps, smallholder response forms, and recheck statuses must be permanently signed.",
            "Assumptions Invalidation: Substantiated concerns immediately trigger automatic gate shutdowns for all linked routes.",
            "Auditor Access Gateway: Cryptographically signed read-only access is generated for competent-authority reviews.",
          ].map((line) => (
            <div key={line} style={{ 
              padding: "14px", 
              borderRadius: "var(--radius-md)", 
              background: "rgba(255,255,255,0.02)", 
              border: "1px solid var(--fos-border)", 
              color: "var(--fos-text-secondary)", 
              fontSize: "var(--text-sm)", 
              lineHeight: 1.6,
            }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
