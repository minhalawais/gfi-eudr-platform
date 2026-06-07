"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/components/ui/PermissionGuard";
import { BrandLockup } from "@/components/ui";
import { getScenarioData, scenarioOptions, agents } from "@/lib/gfi-dummy-data";

export default function EUAgentPortalPage() {
  const { scenarioId } = useSession();
  const scenarioData = getScenarioData(scenarioId);
  
  useEffect(() => {
    document.title = "EU Agent Portal | GFI Compliance Control Center";
  }, []);

  const [searchQuery, setSearchQuery] = useState("PKG-GFI-BBL-2026-001");
  const [hasSearched, setHasSearched] = useState(true);

  // Active scenario metadata for context banner
  const activeScenarioLabel = scenarioOptions.find(o => o.id === scenarioId)?.label ?? "Default Reality";

  // Build searchable rows dynamically from the active scenario data
  const searchableRows = scenarioData.outputPackages.map((pkg) => {
    const consignment = scenarioData.consignments.find((item) => item.id === pkg.consignmentId);
    const agent = agents.find((item) => item.id === consignment?.operatorAgentId);
    return {
      pkg,
      consignment,
      agent,
    };
  });

  const queryClean = searchQuery.trim().toLowerCase();
  const result =
    searchableRows.find(
      (row) =>
        row.pkg.packageRef.toLowerCase() === queryClean ||
        row.consignment?.reference.toLowerCase() === queryClean ||
        row.pkg.id.toLowerCase() === queryClean ||
        row.consignment?.id.toLowerCase() === queryClean
    ) ?? null;

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setHasSearched(true);
  };

  const selectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setHasSearched(true);
  };

  return (
    <div style={{ minHeight: "calc(100dvh - var(--platform-footer-height))", paddingBottom: "var(--platform-footer-height)", background: "var(--fos-bg-page)", display: "flex", flexDirection: "column" }}>
      {/* Header with deep forest green gradient and HSL accents */}
      <header style={{
        background: "linear-gradient(135deg, var(--fos-primary) 0%, #001f16 100%)",
        color: "white",
        padding: "var(--space-4) var(--space-8)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        borderBottom: "1px solid rgba(217, 242, 79, 0.15)"
      }}>
        <div style={{ display: "grid", gap: "4px" }}>
          <BrandLockup compact className="mb-1 border-white/20 bg-white/10" />
          <span style={{ fontSize: "var(--text-xs)", color: "var(--fos-accent)", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700 }}>
            EU agent and operator portal
          </span>
          <strong style={{ fontSize: "var(--text-lg)", letterSpacing: "-0.01em" }}>Dossier Handoff & DDS Verification Portal</strong>
        </div>
        <Link href="/dashboard" className="btn-secondary" style={{
          background: "rgba(255, 255, 255, 0.03)",
          color: "white",
          borderColor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(8px)",
          padding: "8px 16px"
        }}>
          Back to GFI workspace
        </Link>
      </header>

      <main style={{ width: "100%", maxWidth: "1120px", margin: "0 auto", padding: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        
        {/* Scenario context indicator banner */}
        <div style={{
          padding: "12px 18px",
          borderRadius: "var(--radius-md)",
          background: "rgba(0, 59, 43, 0.04)",
          border: "1px solid var(--fos-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "var(--text-xs)",
          color: "var(--fos-text-secondary)"
        }}>
          <span>
            🛰️ Active regulatory context: <strong style={{ color: "var(--fos-primary)", fontSize: "13px" }}>{activeScenarioLabel}</strong>
          </span>
          <span style={{ fontStyle: "italic", fontSize: "11px" }}>
            (To modify, change the scenario in the GFI internal dashboard layout header)
          </span>
        </div>

        {/* Search Panel Card */}
        <div className="fos-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 900, color: "var(--fos-primary)" }}>Search Compliance Package Dossiers</h1>
          <p style={{ color: "var(--fos-text-secondary)", fontSize: "var(--text-sm)", lineHeight: 1.65 }}>
            EU Agents review compiled manufacturer evidence packs here to cross-check supplier provenance geometries, chain of custody certificates, and deforestation audits prior to filing the legal DDS.
          </p>

          <form onSubmit={handleSearch} style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginTop: "4px" }}>
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Try PKG-GFI-BBL-2026-001 or GFI-EU-CHOC-2026-003"
              style={{ flex: 1, minWidth: "260px", padding: "12px", border: "1px solid var(--fos-border)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)" }}
            />
            <button className="btn-primary" type="submit" style={{ padding: "12px 24px" }}>
              Search Dossiers
            </button>
          </form>

          {/* Search Suggestion Badges */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginTop: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--fos-text-secondary)", textTransform: "uppercase" }}>Quick Search:</span>
            <button
              onClick={() => selectSuggestion("PKG-GFI-BBL-2026-001")}
              style={{ padding: "4px 10px", fontSize: "11px", background: "#f1f5f9", border: "1px solid var(--fos-border)", borderRadius: "12px", cursor: "pointer", color: "var(--fos-primary)", fontWeight: 600 }}
            >
              Bubble Gum (Always Clear)
            </button>
            <button
              onClick={() => selectSuggestion("GFI-EU-CHEW-2026-002")}
              style={{ padding: "4px 10px", fontSize: "11px", background: "#f1f5f9", border: "1px solid var(--fos-border)", borderRadius: "12px", cursor: "pointer", color: "var(--fos-primary)", fontWeight: 600 }}
            >
              Chew ({scenarioId === "after_palm_reclassification" ? "✓ Cleared" : "🔒 Held"})
            </button>
            <button
              onClick={() => selectSuggestion("GFI-EU-CHOC-2026-003")}
              style={{ padding: "4px 10px", fontSize: "11px", background: "#f1f5f9", border: "1px solid var(--fos-border)", borderRadius: "12px", cursor: "pointer", color: "var(--fos-primary)", fontWeight: 600 }}
            >
              Chocolate ({scenarioId === "after_cocoa_remediation" ? "✓ Cleared" : "🔒 Blocked"})
            </button>
          </div>
        </div>

        {/* Search Result display */}
        {hasSearched && result && result.consignment && result.agent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            
            {/* Top overview panel */}
            <div className="fos-card" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "var(--space-6)" }}>
              <div style={{ display: "grid", gap: "var(--space-3)" }}>
                <div>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Verified Output Reference
                  </p>
                  <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 950, color: "var(--fos-primary)", letterSpacing: "-0.02em" }}>{result.pkg.packageRef}</h2>
                </div>
                <p style={{ color: "var(--fos-text-secondary)", fontSize: "var(--text-sm)", lineHeight: 1.65 }}>
                  {result.consignment.policyNarrative}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--space-4)", borderTop: "1px solid var(--fos-border)", paddingTop: "12px", marginTop: "4px" }}>
                  <div>
                    <p style={{ fontSize: "11px", color: "var(--fos-text-secondary)" }}>Consignment Ref</p>
                    <strong style={{ fontSize: "13px" }}>{result.consignment.reference}</strong>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: "var(--fos-text-secondary)" }}>Destination Port</p>
                    <strong style={{ fontSize: "13px" }}>{result.consignment.destination}</strong>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: "var(--fos-text-secondary)" }}>DDS Method</p>
                    <strong style={{ fontSize: "13px" }}>{result.pkg.mode.replace(/_/g, " ")}</strong>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: "var(--fos-text-secondary)" }}>Handoff Status</p>
                    <span className={`status-badge ${result.pkg.status === "READY_FOR_AGENT" ? "status-ready" : "status-held"}`} style={{ padding: "2px 8px", fontSize: "11px", display: "inline-block", textAlign: "center", width: "max-content", marginTop: "2px" }}>
                      {result.pkg.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operator details block */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "rgba(0,59,43,0.02)", border: "1px solid var(--fos-border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
                <h3 style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px", borderBottom: "1px solid var(--fos-border)", paddingBottom: "6px" }}>Importing Operator Info</h3>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--fos-text-secondary)" }}>Designated Operator Agent</p>
                  <strong style={{ fontSize: "14px", color: "var(--fos-primary)" }}>{result.agent.name}</strong>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--fos-text-secondary)" }}>Operator Handoff Status</p>
                  <span className={`status-badge ${result.agent.readiness === "READY" ? "status-ready" : "status-changes-requested"}`} style={{ fontSize: "10px", padding: "1px 6px" }}>
                    {result.agent.readiness.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--fos-text-secondary)" }}>EORI / TRACES Statuses</p>
                  <strong style={{ fontSize: "12px" }}>{result.agent.eoriStatus} / {result.agent.tracesStatus}</strong>
                </div>
              </div>
            </div>

            {/* Bottom details split */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)" }}>
              
              {/* Evidence package components */}
              <div className="fos-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <h3 style={{ fontSize: "var(--text-md)", fontWeight: 800, color: "var(--fos-primary)", borderBottom: "1px solid var(--fos-border)", paddingBottom: "8px" }}>Compiled Artifacts & Anchors</h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "rgba(0,0,0,0.01)", border: "1px solid var(--fos-border)" }}>
                    <span style={{ fontSize: "11px", color: "var(--fos-text-secondary)", display: "block" }}>Source Land Anchors</span>
                    <strong style={{ fontSize: "18px", color: "var(--fos-primary)" }}>{result.pkg.sourceAnchorCount} plots</strong>
                  </div>
                  <div style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "rgba(0,0,0,0.01)", border: "1px solid var(--fos-border)" }}>
                    <span style={{ fontSize: "11px", color: "var(--fos-text-secondary)", display: "block" }}>Commercial Evidence Files</span>
                    <strong style={{ fontSize: "18px", color: "var(--fos-primary)" }}>{result.pkg.evidenceIndexCount} files</strong>
                  </div>
                </div>

                <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "rgba(0,59,43,0.03)", border: "1px dashed var(--fos-border)", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--fos-primary)", textTransform: "uppercase" }}>Encrypted Handoff Contents</span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {result.pkg.artifacts.map((art) => (
                      <span
                        key={art}
                        style={{
                          fontSize: "11px",
                          fontFamily: "monospace",
                          background: "#0f172a",
                          color: "#38bdf8",
                          padding: "2px 8px",
                          borderRadius: "4px"
                        }}
                      >
                        {art}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Blockers or Readiness Banner */}
              <div className="fos-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <h3 style={{ fontSize: "var(--text-md)", fontWeight: 800, color: "var(--fos-primary)", borderBottom: "1px solid var(--fos-border)", paddingBottom: "8px" }}>DDS Audit Gaps & Gating Flags</h3>
                
                {result.consignment.issues.length > 0 ? (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {result.consignment.issues.map((issue) => (
                      <div
                        key={issue.code}
                        style={{
                          padding: "14px",
                          borderRadius: "var(--radius-md)",
                          background: issue.blocking ? "rgba(239, 68, 68, 0.05)" : "rgba(245, 158, 11, 0.05)",
                          border: `1px solid ${issue.blocking ? "#fecaca" : "#fef3c7"}`,
                          color: issue.blocking ? "#9f1239" : "#92400e"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "12px", fontFamily: "monospace" }}>{issue.code}</strong>
                          <span style={{ fontSize: "9px", fontWeight: 700, background: issue.blocking ? "#ffe4e6" : "#fef3c7", padding: "1px 6px", borderRadius: "10px" }}>
                            {issue.blocking ? "CRITICAL BLOCKER" : "WARNING"}
                          </span>
                        </div>
                        <p style={{ marginTop: "6px", fontSize: "12px", lineHeight: 1.5 }}>{issue.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: "24px",
                    borderRadius: "var(--radius-lg)",
                    background: "rgba(34, 197, 94, 0.04)",
                    border: "1px solid #22c55e",
                    color: "#166534",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <span style={{ fontSize: "32px" }}>🛡️</span>
                    <strong style={{ fontSize: "14px" }}>Dossier 100% Cleared for DDS Filing</strong>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--fos-text-secondary)", lineHeight: 1.6, maxWidth: "340px" }}>
                      This compiled package is fully verified, deforestation-free validated, and ready for digital import into TRACES under Operator reference {result.pkg.packageRef}.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : hasSearched ? (
          <div className="fos-card" style={{ padding: "30px", textAlign: "center", color: "var(--fos-text-secondary)", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--radius-lg)" }}>
            <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>🔍</span>
            <strong>Dossier Reference Not Found</strong>
            <p style={{ fontSize: "var(--text-xs)", marginTop: "4px", lineHeight: 1.5 }}>
              No active package matches reference query <code>"{searchQuery}"</code> in the active regulatory story. Ensure the matching scenario has been toggled in the GFI internal dashboard layout.
            </p>
          </div>
        ) : null}
      </main>

    </div>
  );
}
