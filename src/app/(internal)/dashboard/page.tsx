"use client";

import React, { useMemo } from "react";
import { PermissionGuard, useSession } from "@/components/ui/PermissionGuard";
import {
  agents,
  getScenarioData,
  scenarioOptions,
  getSupplierName,
} from "@/lib/gfi-dummy-data";
import {
  Button,
  Card,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  Tag,
  SectionHeader,
} from "@/components/ui";
import { 
  ShieldAlert, 
  Globe, 
  Activity, 
  MapPinned, 
  Leaf, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Ship, 
  Users, 
  Layers, 
  FileSpreadsheet,
  ArrowRight,
  Compass,
  FileCheck2,
  Database
} from "lucide-react";
import Link from "next/link";

export default function IntelligenceDashboardPage() {
  const { 
    scenarioId, 
    eudrFormRequests, 
    supplyChainNodes,
    suppliers: sessionSuppliers,
    products: sessionProducts,
    consignments: sessionConsignments,
    plots: sessionPlots,
    deforestationCases: sessionCases,
  } = useSession();

  const data = getScenarioData(scenarioId);

  const {
    profile: currentProfile,
    reports: currentReports,
    supplierRequests: currentSupplierRequests,
    outputPackages: currentOutputPackages,
  } = data;

  // Calculate reactive variables dynamically from active browser context
  const totalPlotsAcreage = useMemo(() => {
    return sessionPlots.reduce((acc, plot) => acc + plot.areaHa, 0);
  }, [sessionPlots]);

  const geodataPolygonGaps = useMemo(() => {
    return sessionPlots.filter(plot => plot.areaHa > 4 && plot.geoType === "POINT").length;
  }, [sessionPlots]);

  const activeDeforestationAlerts = useMemo(() => {
    return sessionPlots.filter(plot => plot.latestDeforestationStatus === "FLAGGED").length;
  }, [sessionPlots]);

  const totalConsignmentsCount = sessionConsignments.length;
  const blockedConsignmentsCount = useMemo(() => {
    return sessionConsignments.filter(c => c.gateStatus === "BLOCKED").length;
  }, [sessionConsignments]);

  const releasedConsignmentsCount = useMemo(() => {
    return sessionConsignments.filter(c => c.gateStatus === "READY").length;
  }, [sessionConsignments]);

  const readyAgentPackagesCount = currentOutputPackages.filter((pkg) => pkg.status === "READY_FOR_AGENT").length;
  const followUpAgentsCount = agents.filter((agent) => agent.readiness !== "READY").length;
  const activeAgentsCount = agents.length;

  const rootNodes = supplyChainNodes.filter(n => n.parentNodeId === null);
  const totalChains = rootNodes.length;
  const completeChains = rootNodes.filter(r => r.status === "COMPLETE").length;
  const gapChains = rootNodes.filter(r => r.status === "GAPS_FOUND" || r.status === "BLOCKED").length;

  const pendingFarmerResponses = eudrFormRequests.filter((request) => request.formType === "FARMER" && request.status !== "CLOSED").length;
  const allFarmerRequests = eudrFormRequests.filter((request) => request.formType === "FARMER").length;

  const activeScenarioLabel = scenarioOptions.find(o => o.id === scenarioId)?.label ?? "Default GFI reality";

  // DDS Catalog Scope & Coverage Ledger stats
  const totalProductsCount = sessionProducts.length;
  const ddsAppliedProductsCount = useMemo(() => {
    return sessionProducts.filter(p => p.scopeStatus !== "OUT_OF_SCOPE").length;
  }, [sessionProducts]);

  const monitoredIngredientsCount = useMemo(() => {
    const allIngs = sessionProducts.flatMap(p => p.ingredients);
    const monitored = allIngs.filter(i => i.commodity !== "NONE" && i.relevance !== "OUT_OF_SCOPE");
    return new Set(monitored.map(i => i.name)).size;
  }, [sessionProducts]);

  const totalSuppliersCount = sessionSuppliers.length;
  const monitoredPlotsCount = sessionPlots.length;

  // Formulate Dynamic active EUDR gating blockers
  const activeBlockers = useMemo(() => {
    const list = [];
    
    if (sessionPlots.some(p => p.status === "REQUESTED")) {
      list.push("Supplier coordinate outlines requested but not yet uploaded.");
    }
    
    if (geodataPolygonGaps > 0) {
      list.push(`${geodataPolygonGaps} agricultural plot(s) > 4 ha submitted POINT coordinates instead of closed polygons.`);
    }

    if (activeDeforestationAlerts > 0) {
      list.push(`${activeDeforestationAlerts} farm plot(s) failed satellite canopy checks (post-2020 tree cover loss detected).`);
    }

    if (gapChains > 0) {
      list.push(`${gapChains} upstream processor chain(s) marked with outstanding legal or provenance document gaps.`);
    }

    if (scenarioId === "current_gfi_reality") {
      list.push("JB Cocoa still lacks verified smallholder polygon mapping.");
      list.push("Indococoa supply chain node remains an unmapped processor blocker.");
    } else if (scenarioId === "future_direct_dds") {
      list.push("Direct DDS importer flow requires connected EU Agent TRACES registration.");
    }

    return list;
  }, [sessionPlots, geodataPolygonGaps, activeDeforestationAlerts, gapChains, scenarioId]);

  return (
    <div className="flex w-full flex-col gap-6">
      
      {/* 🏛️ PILLAR 1: Regulatory Posture Gate Banner */}
      {activeBlockers.length > 0 ? (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-state-error/25 bg-gradient-to-r from-state-error/10 to-brand-accent-soft/10 shadow-sm animate-fadeIn">
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-state-error flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
              EUDR Compliance Barrier: {activeBlockers.length} Active Gaps Detected
            </h2>
            <p className="text-xs text-text-secondary">
              Downstream export gates are **Locked (Fail-Closed)**. Provenance chains contain outstanding environmental or coordinate validation flags.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-state-error bg-state-error/15 px-3 py-1 text-xs font-bold text-state-error tracking-wider select-none animate-pulse">
            FAIL-CLOSED ACTIVE
          </span>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 to-brand-accent-soft/10 shadow-sm animate-fadeIn">
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              All EUDR Barriers Remediated
            </h2>
            <p className="text-xs text-text-secondary">
              All supply paths, smallholder polygons, and deforestation indices have been cleared. Output due diligence dossiers are ready for TRACES release.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-500 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 tracking-wider select-none">
            COMPLIANT GATEWAY
          </span>
        </div>
      )}

      {/* Header and Page Meta */}
      <SectionHeader
        title="GFI Compliance Operations Dashboard"
        description="A real-time due diligence control console mapping raw materials (BOM), land parcels, satellite reviews, and agent TRACES exports."
        actions={
          <div className="flex items-center gap-2">
            <Tag tone="brand">{activeScenarioLabel}</Tag>
            <Tag tone="neutral">EORI Status: Mapped</Tag>
          </div>
        }
      />

      {/* Organizational Profile Context Panel */}
      <Card className="bg-[#00261E] border border-white/10 text-text-inverse p-5 md:p-6 grid gap-6 md:grid-cols-[1.5fr_1fr] rounded-xl relative overflow-hidden">
        {/* Subtle decorative background graticule */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:25px_25px]" />
        
        <div className="space-y-3 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-accent">
            Organizational Identity Context
          </span>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-brand-accent animate-spin-slow" />
            {currentProfile.legalRole}
          </h2>
          <p className="text-xs leading-5 text-white/75 max-w-xl">
            {currentProfile.eudrNarrative}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs border-t border-white/10 pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-6 border-white/10 relative z-10">
          <div className="space-y-1">
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Default Output Mode</p>
            <strong className="text-white font-bold">{currentProfile.defaultOutputMode.replace(/_/g, " ")}</strong>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-white/50 uppercase tracking-wider">EORI Status</p>
            <strong className="text-white font-bold">{currentProfile.eoriStatus.replace(/_/g, " ")}</strong>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-white/50 uppercase tracking-wider">TRACES Status</p>
            <strong className="text-white font-bold">{currentProfile.tracesStatus.replace(/_/g, " ")}</strong>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Operating Domain</p>
            <strong className="text-brand-accent font-bold">Multi-tier Sourcing & Imports</strong>
          </div>
        </div>
      </Card>

      {/* 📊 DDS Catalog & Scope Coverage Stats Ledger Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 w-full">
        {/* Card 1: DDS Scope Ratio */}
        <Card className="p-4 bg-bg-surface border border-border-soft hover:shadow-card-hover hover:border-brand-primary/30 transition-all flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-brand-primary" />
              DDS Scope Ratio
            </span>
            <Tag tone="brand" className="text-[9px] py-0.5 font-bold">EUDR IN-SCOPE</Tag>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-brand-primary">{ddsAppliedProductsCount}</span>
              <span className="text-xs text-text-secondary font-medium"> / {totalProductsCount} Products</span>
            </div>
            <span className="text-xs font-bold text-brand-primary">{totalProductsCount > 0 ? Math.round((ddsAppliedProductsCount / totalProductsCount) * 100) : 0}%</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full bg-bg-page rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-primary transition-all" 
              style={{ width: `${totalProductsCount > 0 ? (ddsAppliedProductsCount / totalProductsCount) * 100 : 0}%` }}
            />
          </div>
        </Card>

        {/* Card 2: Active Raw Ingredients */}
        <Card className="p-4 bg-bg-surface border border-border-soft hover:shadow-card-hover hover:border-emerald-600/30 transition-all flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5 text-emerald-600" />
              Active Ingredients
            </span>
            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">Monitored</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-brand-primary">{monitoredIngredientsCount}</span>
            <p className="text-[10px] text-text-secondary mt-1">Sourced in active formulations</p>
          </div>
        </Card>

        {/* Card 3: Supplier Integrity Maps */}
        <Card className="p-4 bg-bg-surface border border-border-soft hover:shadow-card-hover hover:border-amber-600/30 transition-all flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-amber-600" />
              Supplier Integrity Map
            </span>
            <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider">Verified</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-brand-primary">{totalSuppliersCount}</span>
            <p className="text-[10px] text-text-secondary mt-1">Upstream supply chain nodes</p>
          </div>
        </Card>

        {/* Card 4: GIS Land Plots */}
        <Card className="p-4 bg-bg-surface border border-border-soft hover:shadow-card-hover hover:border-violet-600/30 transition-all flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <MapPinned className="h-3.5 w-3.5 text-violet-600" />
              GIS Monitored Plots
            </span>
            <span className="text-[9px] text-violet-600 font-bold uppercase tracking-wider">Surveillance</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-brand-primary">{monitoredPlotsCount}</span>
            <p className="text-[10px] text-text-secondary mt-1">Total active smallholder units</p>
          </div>
        </Card>
      </div>

      {/* 📊 PILLARS 2-5: Unified Telemetry Matrix with Standardized Baseline Footers */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 items-stretch">
        {/* Pillar 2: Sourcing & BOM Coverage */}
        <Card className="flex flex-col justify-between gap-5 p-5 hover:-translate-y-0.5 transition-all shadow-card hover:shadow-card-hover border-t-4 border-t-brand-primary h-full">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <Layers className="h-4.5 w-4.5 text-brand-primary" />
              Sourcing & BOM
            </div>
            <p className="text-2xl font-extrabold text-brand-primary">
              {sessionProducts.filter(p => p.scopeStatus === "IN_SCOPE").length} <span className="text-xs font-normal text-text-secondary">Products</span>
            </p>
            <p className="text-xs text-text-secondary leading-4">
              {completeChains}/{totalChains} supply chains mapped completely. {pendingFarmerResponses} farmer disclosures outstanding.
            </p>
          </div>
          
          <div className="space-y-2 pt-2 border-t border-border-soft/60">
            <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary">
              <span>Chains Mapped: {totalChains > 0 ? Math.round((completeChains / totalChains) * 100) : 100}%</span>
              <span>Gaps: {pendingFarmerResponses}</span>
            </div>
            <div className="h-1.5 w-full bg-bg-page rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-primary transition-all" 
                style={{ width: `${totalChains > 0 ? Math.round((completeChains / totalChains) * 100) : 100}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Pillar 3: Deforestation & GIS Analytics */}
        <Card className="flex flex-col justify-between gap-5 p-5 hover:-translate-y-0.5 transition-all shadow-card hover:shadow-card-hover border-t-4 border-t-emerald-600 h-full">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <Leaf className="h-4.5 w-4.5 text-emerald-600" />
              GIS & Deforestation
            </div>
            <p className="text-2xl font-extrabold text-brand-primary">
              {totalPlotsAcreage.toFixed(1)} <span className="text-xs font-normal text-text-secondary">Acreage (ha)</span>
            </p>
            <p className="text-xs text-text-secondary leading-4">
              {activeDeforestationAlerts} active forest cover loss alerts identified. {geodataPolygonGaps} unmapped POINT gaps detected.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-border-soft/60">
            <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary">
              <span>Scan Coverage: 100%</span>
              <span className={activeDeforestationAlerts > 0 ? "text-state-error animate-pulse" : "text-emerald-600"}>
                {activeDeforestationAlerts > 0 ? "Alerts Active" : "Canopy Clear"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-bg-page rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-600 transition-all" 
                style={{ width: `${sessionPlots.length > 0 ? Math.round(((sessionPlots.length - activeDeforestationAlerts) / sessionPlots.length) * 100) : 100}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Pillar 4: Logistics Fail-Safe Gate */}
        <Card className="flex flex-col justify-between gap-5 p-5 hover:-translate-y-0.5 transition-all shadow-card hover:shadow-card-hover border-t-4 border-t-amber-600 h-full">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <Ship className="h-4.5 w-4.5 text-amber-600" />
              Logistics Gate
            </div>
            <p className="text-2xl font-extrabold text-brand-primary">
              {blockedConsignmentsCount}/{totalConsignmentsCount} <span className="text-xs font-normal text-text-secondary">Held Cargo</span>
            </p>
            <p className="text-xs text-text-secondary leading-4">
              Fail-closed gates restrict {blockedConsignmentsCount} unverified shipments from departing origin processors.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-border-soft/60">
            <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary">
              <span>Released: {releasedConsignmentsCount}</span>
              <span className={blockedConsignmentsCount > 0 ? "text-state-warning" : "text-emerald-600"}>
                {blockedConsignmentsCount > 0 ? "Gate Locked" : "Gate Open"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-bg-page rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-600 transition-all" 
                style={{ width: `${totalConsignmentsCount > 0 ? Math.round((releasedConsignmentsCount / totalConsignmentsCount) * 100) : 100}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Pillar 5: Dossier Library & Agent Handoff */}
        <Card className="flex flex-col justify-between gap-5 p-5 hover:-translate-y-0.5 transition-all shadow-card hover:shadow-card-hover border-t-4 border-t-[#8B5CF6] h-full">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <FileSpreadsheet className="h-4.5 w-4.5 text-[#8B5CF6]" />
              DDS Dossiers
            </div>
            <p className="text-2xl font-extrabold text-brand-primary">
              {readyAgentPackagesCount} <span className="text-xs font-normal text-text-secondary">Ready DDS</span>
            </p>
            <p className="text-xs text-text-secondary leading-4">
              {readyAgentPackagesCount} Due Diligence dossier packages verified clear for handoff to {activeAgentsCount} importing agents.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-border-soft/60">
            <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary">
              <span>TRACES Prepared: {readyAgentPackagesCount}</span>
              <span>Agents: {activeAgentsCount}</span>
            </div>
            <div className="h-1.5 w-full bg-bg-page rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#8B5CF6] transition-all" 
                style={{ width: `${activeAgentsCount > 0 ? Math.round((agents.filter(a => a.readiness === "READY").length / activeAgentsCount) * 100) : 100}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Split Grid: Consignment Gate Register & Compliance Task Backlog with perfect vertical alignment */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] w-full items-stretch">
        
        {/* Left Column: Logistics Gate Shipment Table Card */}
        <Card className="space-y-4 flex flex-col justify-between h-full">
          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-brand-primary">Logistics Fail-Safe Gate Register</h2>
              <p className="text-xs text-text-secondary">
                Real-time monitoring of shipments. Gate-controlled products are locked unless all ingredient chains are 100% compliant.
              </p>
            </div>

            <TableRoot>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Reference</TableHeaderCell>
                    <TableHeaderCell>Cargo & HS Code</TableHeaderCell>
                    <TableHeaderCell>Destination</TableHeaderCell>
                    <TableHeaderCell>Core Hold Issue</TableHeaderCell>
                    <TableHeaderCell>Gate Status</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessionConsignments.map((consignment) => {
                    const isBlocked = consignment.gateStatus === "BLOCKED";
                    const isReview = consignment.gateStatus === "REVIEW_REQUIRED";
                    return (
                      <TableRow key={consignment.id}>
                        <TableCell className="align-top font-semibold text-brand-primary text-xs flex items-center gap-1.5 py-3.5">
                          <Ship className="h-3.5 w-3.5 text-text-muted" />
                          {consignment.reference}
                        </TableCell>
                        <TableCell className="align-top text-xs font-semibold py-3.5 max-w-[150px] leading-5">{consignment.lineSummary[0] || "Unknown Cargo"}</TableCell>
                        <TableCell className="align-top text-xs py-3.5">{consignment.destination}</TableCell>
                        <TableCell className="align-top text-xs py-3.5 leading-5">
                          {isBlocked ? (
                            <span className="text-state-error font-semibold flex items-start gap-1">
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                              {consignment.issues[0]?.message || "Deforestation alerts flagged"}
                            </span>
                          ) : isReview ? (
                            <span className="text-state-warning font-semibold flex items-start gap-1">
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                              {consignment.issues[0]?.message || "Scope confirmation under review"}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold flex items-start gap-1">
                              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                              None - Clear to release
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="align-top py-3.5">
                          <StatusBadge status={isBlocked ? "blocked" : isReview ? "under_review" : "ready"}>
                            {isBlocked ? "HELD" : "REVIEW"}
                          </StatusBadge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableRoot>
          </div>
        </Card>

        {/* Right Column: Dynamic flex cards that align top-and-bottom with the left table card */}
        <div className="flex flex-col gap-6 h-full justify-between">
          {/* Active Task Queue */}
          <Card className="space-y-4 flex flex-col justify-between flex-1">
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-brand-primary">Compliance Action Backlog</h2>
                <p className="text-xs text-text-secondary">
                  Outstanding tasks gating GFI's supply chains. Click on any item to resolve gaps in corresponding workspaces.
                </p>
              </div>

              <div className="grid gap-3">
                {/* Task 1: Geolocation Coordinate Outline check */}
                {geodataPolygonGaps > 0 && (
                  <Link href="/geolocation" className="group flex items-start justify-between gap-3 p-3 rounded-lg border border-amber-500/25 bg-amber-500/5 hover:border-amber-500 transition-all">
                    <div className="space-y-1">
                      <strong className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <MapPinned className="h-4 w-4 text-amber-700" />
                        Resolve Polygon Gaps ({geodataPolygonGaps} plots)
                      </strong>
                      <p className="text-[11px] text-amber-800 leading-4">
                        Farms exceeding 4 ha must have closed coordinate loop boundaries, not points.
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-amber-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                )}

                {/* Task 2: Deforestation Review check */}
                {activeDeforestationAlerts > 0 && (
                  <Link href="/deforestation" className="group flex items-start justify-between gap-3 p-3 rounded-lg border border-state-danger/25 bg-state-danger/5 hover:border-state-danger transition-all">
                    <div className="space-y-1">
                      <strong className="text-xs font-bold text-state-error flex items-center gap-1.5">
                        <Leaf className="h-4 w-4 text-state-error" />
                        Audit Deforestation Cases ({activeDeforestationAlerts} flags)
                      </strong>
                      <p className="text-[11px] text-state-error/80 leading-4">
                        Multi-temporal satellites show canopy changes post-2020. Expose alerts or override false positives.
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-state-error group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                )}

                {/* Task 3: Unmapped Node Disclosures */}
                {gapChains > 0 && (
                  <Link href="/traceability" className="group flex items-start justify-between gap-3 p-3 rounded-lg border border-brand-primary/20 bg-brand-primary-soft/10 hover:border-brand-primary transition-all">
                    <div className="space-y-1">
                      <strong className="text-xs font-bold text-brand-primary flex items-center gap-1.5">
                        <Layers className="h-4 w-4" />
                        Map Processor Gaps ({gapChains} paths)
                      </strong>
                      <p className="text-[11px] text-text-secondary leading-4">
                        Track intermediary processor layers and collect missing document evidence.
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-brand-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                )}

                {/* Task 4: Risk Mitigation check */}
                <Link href="/risk-assessment" className="group flex items-start justify-between gap-3 p-3 rounded-lg border border-border-soft bg-bg-surface hover:border-border-strong transition-all">
                  <div className="space-y-1">
                    <strong className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-brand-primary" />
                      Review Sourcing Risk Subjects
                    </strong>
                    <p className="text-[11px] text-text-secondary leading-4">
                      Audit country risk rankings (high vs. low Commission classifications) and legality rights.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>
              </div>
            </div>
          </Card>

          {/* Active Posture Summary Blockers list */}
          <Card className="space-y-4 flex flex-col justify-between flex-1">
            <div className="space-y-4">
              <h2 className="text-base font-bold text-brand-primary flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-brand-primary" />
                Active System Blockers
              </h2>
              <div className="space-y-2 overflow-y-auto max-h-[160px] internal-scroll">
                {activeBlockers.length > 0 ? (
                  activeBlockers.map((line, idx) => (
                    <div key={idx} className="flex gap-2 rounded-lg border border-state-error/15 bg-state-error/5 p-2.5 text-xs text-state-error font-medium leading-5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-state-error mt-0.5" />
                      <span>{line}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-2.5 text-xs text-emerald-700 font-medium leading-5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>✓ All sourcing chains fully cleared. Export gateway is open!</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Grid: Supplier Responses & Connected Importer Agents - aligned perfectly via items-stretch */}
      <div className="grid gap-6 md:grid-cols-2 w-full items-stretch">
        
        {/* Supplier Responses Queue Card */}
        <Card className="p-5 flex flex-col justify-between h-full">
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between border-b border-border-soft/60 pb-3">
              <h2 className="text-base font-bold text-brand-primary flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-brand-primary" />
                Supplier Response Register
              </h2>
              <Tag tone="neutral" className="text-[10px]">{currentSupplierRequests.length} Tracked</Tag>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto internal-scroll pr-1">
              {currentSupplierRequests.map((request) => (
                <Card key={request.id} variant="inset" className="p-3.5 space-y-2 bg-bg-page/20 border border-border-soft/50">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-xs text-brand-primary font-bold">{request.supplierName}</strong>
                    <StatusBadge status={request.submissionStatus === "CLOSED" ? "ready" : "pending"}>
                      {request.submissionStatus.replace(/_/g, " ")}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-text-secondary leading-4">{request.latestReviewerNote}</p>
                  <div className="flex items-center justify-between text-[10px] text-text-muted font-semibold">
                    <span>Token: {request.tokenLabel}</span>
                    <span>Requested: {request.requestedAt}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>

        {/* Connected Importer Agent Readiness Card */}
        <Card className="p-5 flex flex-col justify-between h-full">
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between border-b border-border-soft/60 pb-3">
              <h2 className="text-base font-bold text-brand-primary flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-brand-primary" />
                EU Agent Clearance Matrix
              </h2>
              <Tag tone="neutral" className="text-[10px]">{agents.length} Registered</Tag>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto internal-scroll pr-1">
              {agents.map((agent) => {
                const isReady = agent.readiness === "READY";
                return (
                  <Card key={agent.id} variant="inset" className="p-3.5 space-y-2 bg-bg-page/20 border border-border-soft/50">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-xs text-brand-primary font-bold">{agent.name}</strong>
                      <StatusBadge status={isReady ? "ready" : "review_required"}>
                        {isReady ? "VERIFIED" : "REVIEW REQUIRED"}
                      </StatusBadge>
                    </div>
                    <p className="text-xs text-text-secondary leading-4">{agent.notes[0]}</p>
                    <div className="flex items-center justify-between text-[10px] text-text-muted font-semibold">
                      <span>EORI status: {agent.eoriStatus}</span>
                      <span>TRACES status: {agent.tracesStatus}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Generated Due Diligence Reports registry */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-soft/60 pb-3">
          <h2 className="text-base font-bold text-brand-primary flex items-center gap-2">
            <FileSpreadsheet className="h-4.5 w-4.5 text-brand-primary" />
            Compiled Due Diligence Statements (DDS)
          </h2>
          <Tag tone="neutral" className="text-[10px]">{currentReports.length} reports</Tag>
        </div>

        <TableRoot>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Title / Reference</TableHeaderCell>
                <TableHeaderCell>Ingredient Scope</TableHeaderCell>
                <TableHeaderCell>Generated</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Compliance Note</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {currentReports.map((report) => (
                <tr key={report.id} className="text-xs">
                  <td className="align-top font-semibold text-brand-primary py-3">{report.title}</td>
                  <td className="align-top py-3">{report.scope}</td>
                  <td className="align-top py-3">{report.generatedAt}</td>
                  <td className="align-top py-3">
                    <StatusBadge status={report.status.toLowerCase() === "final" ? "ready" : "pending"}>
                      {report.status}
                    </StatusBadge>
                  </td>
                  <td className="align-top py-3 text-text-secondary truncate max-w-[200px] leading-5">{report.note}</td>
                </tr>
              ))}
            </TableBody>
          </Table>
        </TableRoot>
      </Card>
    </div>
  );
}
