"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Users, Layers, ShieldAlert, Activity, CheckCircle2, X, Shield, Ship, FileText, Award } from "lucide-react";

function getCommodityIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("cocoa")) return "🍫";
  if (n.includes("palm")) return "🌴";
  if (n.includes("coffee")) return "☕";
  if (n.includes("soya") || n.includes("soy")) return "🌱";
  if (n.includes("rubber")) return "🩸";
  if (n.includes("wood") || n.includes("timber")) return "🌲";
  return "📦";
}
import {
  IngredientTraceabilityRootSummary,
  IngredientTraceabilityViewModel,
  TraceabilityNodeDetails,
} from "@/lib/ingredient-traceability";
import { SupplyChainNode } from "@/lib/gfi-dummy-data";

type StatusFilter = SupplyChainNode["status"] | "ALL";
type ActorFilter = SupplyChainNode["actorType"] | "ALL";
type CountryFilter = string | "ALL";
type FormFilter = "INTERMEDIARY" | "FARMER" | "ALL";
type MobileTab = "summary" | "lineage" | "inspector";

interface IngredientTraceabilityStudioProps {
  viewModel: IngredientTraceabilityViewModel;
  selectedRootId: string;
  onSelectRoot: (rootId: string) => void;
}

interface SupplyChainSnapshotProps {
  viewModel: IngredientTraceabilityViewModel;
  supplierId: string;
}

const STATUS_ACCENTS: Record<SupplyChainNode["status"], string> = {
  COMPLETE: "ready",
  SUBMITTED: "review",
  REQUESTED: "requested",
  IN_PROGRESS: "review",
  GAPS_FOUND: "blocked",
  BLOCKED: "blocked",
  NOT_REQUESTED: "muted",
};

function toSentenceCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (part) => part.toUpperCase());
}

function formatDate(date: string | null): string {
  if (!date || date === "Current") {
    return "Current";
  }
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function NodeGlyph({ actorType }: { actorType: SupplyChainNode["actorType"] }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (actorType === "FARMER" || actorType === "ESTATE") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M4 17c2.8-4.2 5.7-6.3 8.5-6.3 2.3 0 4.8 1.4 7.5 4.3" />
        <path {...common} d="M12 6v11" />
        <path {...common} d="M8 8.5c1.2 0 2.2.8 4 2.5-2.8.3-4.8-.8-4.8-2.3 0-.1.3-.2.8-.2Z" />
        <path {...common} d="M16.2 8.2c-1.2 0-2.2.8-4 2.5 2.8.3 4.8-.8 4.8-2.3 0-.1-.3-.2-.8-.2Z" />
      </svg>
    );
  }

  if (actorType === "COOPERATIVE") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle {...common} cx="8" cy="9" r="2.5" />
        <circle {...common} cx="16" cy="9" r="2.5" />
        <path {...common} d="M4.5 18c.8-2.7 2.4-4 4.9-4 2.4 0 4 1.3 4.8 4" />
        <path {...common} d="M10.6 18c.8-2.4 2.2-3.6 4.3-3.6 2.1 0 3.5 1.2 4.3 3.6" />
      </svg>
    );
  }

  if (actorType === "TRADER" || actorType === "DISTRIBUTOR" || actorType === "EXPORTER" || actorType === "INTERMEDIARY") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect {...common} x="4" y="7" width="16" height="10" rx="2" />
        <path {...common} d="M8 17v2.5M16 17v2.5M4 12h16" />
        <path {...common} d="M7 7 9 4h6l2 3" />
      </svg>
    );
  }

  if (actorType === "MILL" || actorType === "PROCESSOR" || actorType === "DIRECT_SUPPLIER") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M4 20V9l4-3 4 3v11Z" />
        <path {...common} d="M12 20V6l4-2 4 2v14Z" />
        <path {...common} d="M7 13h2M7 16h2M15 10h2M15 13h2M15 16h2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle {...common} cx="12" cy="12" r="8" />
      <path {...common} d="M8 12h8M12 8l4 4-4 4" />
    </svg>
  );
}

function FullscreenGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 3H4v4M16 3h4v4M8 21H4v-4M20 17v4h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NodeCard(props: {
  details: TraceabilityNodeDetails;
  isSelected: boolean;
  isOnSelectedPath: boolean;
  isCollapsed: boolean;
  canToggle: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const { details, isSelected, isOnSelectedPath, isCollapsed, canToggle, onSelect, onToggle } = props;
  const { node, request, evidenceSummary } = details;

  return (
    <button
      type="button"
      data-actor={node.actorType}
      data-status={node.status}
      className={`traceability-node-card${isSelected ? " is-selected" : ""}${isOnSelectedPath ? " is-on-path" : ""}`}
      onClick={onSelect}
    >
      <div className="traceability-node-card__eyebrow">
        <span>{details.actorDisplayLabel}</span>
        <span>Tier {node.tier}</span>
      </div>
      <div className="traceability-node-card__header">
        <div className="traceability-node-card__identity">
          <span className="traceability-node-card__glyph">
            <NodeGlyph actorType={node.actorType} />
          </span>
          <div>
            <strong>{node.entityName}</strong>
            <span>{node.country}</span>
          </div>
        </div>
        <span className={`trace-chip trace-chip--${STATUS_ACCENTS[node.status]}`}>{toSentenceCase(node.status)}</span>
      </div>

      <div className="traceability-node-card__meta">
        <span>{node.materialName}</span>
        <span>{Math.round(node.volumeContributionPercent)}% share</span>
      </div>

      <div className="traceability-node-card__badges">
        <span className="trace-chip trace-chip--outline">{details.formPartyLabel}</span>
        <span className={`trace-chip trace-chip--${evidenceSummary.geolocationReady === false || evidenceSummary.missing > 0 ? "blocked" : evidenceSummary.attached > 0 ? "ready" : "muted"}`}>
          {evidenceSummary.stateLabel}
        </span>
      </div>

      {request && <div className="traceability-node-card__token">{request.tokenLabel}</div>}

      {canToggle && (
        <span
          className="traceability-node-card__toggle"
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
        >
          {isCollapsed ? "Expand subtree" : "Hide subtree"}
        </span>
      )}
    </button>
  );
}

function RootSelectorCard(props: {
  root: IngredientTraceabilityRootSummary;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { root, isSelected, onClick } = props;

  return (
    <button type="button" className={`traceability-root-card${isSelected ? " is-selected" : ""}`} onClick={onClick}>
      <div className="traceability-root-card__top flex items-start gap-2">
        <div className="traceability-root-card__title-wrap flex items-start gap-2.5 flex-1 min-w-0">
          <span className="text-xl shrink-0 mt-0.5" role="img" aria-label={root.ingredientName}>
            {getCommodityIcon(root.ingredientName)}
          </span>
          <div className="grid gap-0.5 text-left min-w-0">
            <strong className="text-xs font-extrabold text-brand-primary truncate block">{root.ingredientName}</strong>
            <span className="traceability-root-card__subline text-[10px] text-text-secondary leading-normal truncate block">{root.productName} • {root.directSupplierName}</span>
          </div>
        </div>
        <span className={`trace-chip shrink-0 text-[8px] px-2 py-0.5 trace-chip--${root.shipmentImpact === "READY" ? "ready" : root.shipmentImpact === "BLOCKED" ? "blocked" : "review"}`}>
          {root.shipmentImpact === "AT_RISK" ? "At Risk" : toSentenceCase(root.shipmentImpact)}
        </span>
      </div>
      <div className="traceability-root-card__stats flex justify-between text-[10px] text-text-muted mt-1 border-t border-border-soft/40 pt-2 font-medium">
        <span>{root.branchCount} branches</span>
        <span>{root.farmerCount} producers</span>
        <span>{root.incompleteLeafCount} gaps</span>
      </div>
    </button>
  );
}

function buildTraceabilityLink(root: IngredientTraceabilityRootSummary): string {
  const params = new URLSearchParams({
    mode: "ingredient",
    productId: root.productId,
    ingredientId: root.ingredientId,
    supplierId: root.supplierId,
  });
  return `/traceability?${params.toString()}`;
}

export function IngredientTraceabilityStudio(props: IngredientTraceabilityStudioProps) {
  const { viewModel, selectedRootId, onSelectRoot } = props;
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [actorFilter, setActorFilter] = useState<ActorFilter>("ALL");
  const [countryFilter, setCountryFilter] = useState<CountryFilter>("ALL");
  const [formFilter, setFormFilter] = useState<FormFilter>("ALL");
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("summary");
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const selectedRoot = viewModel.rootById[selectedRootId] ?? viewModel.roots[0];

  useEffect(() => {
    if (!selectedRoot) return;
    const current = selectedNodeId ? viewModel.nodeDetailsById[selectedNodeId] : null;
    if (!current || !selectedRoot.nodeIds.includes(current.node.id)) {
      setSelectedNodeId(selectedRoot.rootId);
    }
  }, [selectedNodeId, selectedRoot, viewModel.nodeDetailsById]);

  const selectedNode = selectedNodeId ? viewModel.nodeDetailsById[selectedNodeId] : null;
  const selectedPathSet = new Set(selectedNode?.pathNodeIds ?? []);

  const countryOptions = useMemo(
    () => Array.from(new Set((selectedRoot?.nodeIds ?? []).map((nodeId) => viewModel.nodeDetailsById[nodeId].node.country))).sort(),
    [selectedRoot, viewModel.nodeDetailsById],
  );

  const nodeMatchesFilters = (details: TraceabilityNodeDetails) => {
    if (statusFilter !== "ALL" && details.node.status !== statusFilter) return false;
    if (actorFilter !== "ALL" && details.node.actorType !== actorFilter) return false;
    if (countryFilter !== "ALL" && details.node.country !== countryFilter) return false;
    if (formFilter !== "ALL" && details.formType !== formFilter) return false;
    return true;
  };

  const subtreeHasIncomplete = (nodeId: string): boolean => {
    const details = viewModel.nodeDetailsById[nodeId];
    if (!details) return false;
    if (details.node.status !== "COMPLETE") return true;
    return details.childIds.some((childId) => subtreeHasIncomplete(childId));
  };

  const subtreeVisible = (nodeId: string): boolean => {
    const details = viewModel.nodeDetailsById[nodeId];
    if (!details) return false;
    if (showIncompleteOnly && !subtreeHasIncomplete(nodeId)) return false;
    if (nodeMatchesFilters(details)) return true;
    return details.childIds.some((childId) => subtreeVisible(childId));
  };

  const visibleNodeCount = selectedRoot ? selectedRoot.nodeIds.filter((nodeId) => subtreeVisible(nodeId)).length : 0;
  const visibleSplitCount = selectedRoot ? selectedRoot.nodeIds.filter((nodeId) => {
    const details = viewModel.nodeDetailsById[nodeId];
    return details && details.childIds.filter((childId) => subtreeVisible(childId)).length > 1;
  }).length : 0;

  const gapNodes = selectedRoot ? selectedRoot.blockingNodeIds.map((nodeId) => viewModel.nodeDetailsById[nodeId]).filter(Boolean) : [];

  if (!selectedRoot) {
    return (
      <div className="fos-card">
        <p style={{ color: "var(--fos-text-secondary)", fontSize: "var(--text-sm)" }}>No ingredient traceability chain is available yet.</p>
      </div>
    );
  }

  /* ── SVG Tree Layout Engine ────────────────────────────── */
  const SVG_NODE_W = 290;
  const SVG_NODE_H = 230;
  const SVG_TIER_GAP = 80;
  const SVG_SIBLING_GAP = 24;
  const SVG_PAD = 40;

  const statusToCls = (status: string) => {
    switch (status) {
      case "COMPLETE": return "complete";
      case "GAPS_FOUND": return "gaps";
      case "BLOCKED": return "blocked";
      case "REQUESTED": case "IN_PROGRESS": return "requested";
      case "SUBMITTED": return "submitted";
      case "NOT_REQUESTED": return "not-requested";
      default: return "default";
    }
  };

  const statusToColor = (cls: string) => {
    switch (cls) {
      case "complete": return "#10b981";
      case "gaps": case "blocked": return "#ef4444";
      case "requested": return "#8b5cf6";
      case "submitted": return "#f59e0b";
      default: return "rgba(255,255,255,0.2)";
    }
  };

  const computeSubtreeWidth = (nodeId: string): number => {
    const d = viewModel.nodeDetailsById[nodeId];
    if (!d || !subtreeVisible(nodeId)) return 0;
    const isCol = collapsedNodeIds.includes(nodeId);
    const kids = isCol ? [] : d.childIds.filter((c) => subtreeVisible(c));
    if (kids.length === 0) return SVG_NODE_W;
    const childWidths = kids.map((k) => computeSubtreeWidth(k));
    return childWidths.reduce((a, b) => a + b, 0) + (kids.length - 1) * SVG_SIBLING_GAP;
  };

  const computePositions = (rootId: string) => {
    const positions = new Map<string, { x: number; y: number }>();
    const assign = (nodeId: string, depth: number, leftEdge: number) => {
      const d = viewModel.nodeDetailsById[nodeId];
      if (!d || !subtreeVisible(nodeId)) return;
      const sw = computeSubtreeWidth(nodeId);
      positions.set(nodeId, { x: leftEdge + sw / 2, y: depth * (SVG_NODE_H + SVG_TIER_GAP) });
      const isCol = collapsedNodeIds.includes(nodeId);
      const kids = isCol ? [] : d.childIds.filter((c) => subtreeVisible(c));
      let cursor = leftEdge;
      kids.forEach((k) => { const cw = computeSubtreeWidth(k); assign(k, depth + 1, cursor); cursor += cw + SVG_SIBLING_GAP; });
    };
    const totalW = computeSubtreeWidth(rootId);
    assign(rootId, 0, 0);
    let maxDepth = 0;
    positions.forEach((p) => { const d = p.y / (SVG_NODE_H + SVG_TIER_GAP); if (d > maxDepth) maxDepth = d; });
    return { positions, width: totalW, height: (maxDepth + 1) * SVG_NODE_H + maxDepth * SVG_TIER_GAP };
  };

  const bezierD = (x1: number, y1: number, x2: number, y2: number) => {
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  };

  const renderSVGTree = () => {
    const layout = computePositions(selectedRoot.rootId);
    if (layout.positions.size === 0) return <p className="traceability-empty-state" style={{ color: "#94a3b8" }}>No visible nodes match the current filters.</p>;
    const { positions, width: tw, height: th } = layout;
    const totalW = tw + SVG_PAD * 2;
    const totalH = th + SVG_PAD * 2;

    // Build connections
    const conns: { id: string; d: string; cls: string; midX: number; midY: number }[] = [];
    positions.forEach((pos, nodeId) => {
      const det = viewModel.nodeDetailsById[nodeId];
      if (!det) return;
      const isCol = collapsedNodeIds.includes(nodeId);
      const kids = isCol ? [] : det.childIds.filter((c) => subtreeVisible(c));
      kids.forEach((childId) => {
        const cp = positions.get(childId);
        if (!cp) return;
        const x1 = pos.x + SVG_PAD, y1 = pos.y + SVG_NODE_H + SVG_PAD;
        const x2 = cp.x + SVG_PAD, y2 = cp.y + SVG_PAD;
        const cls = statusToCls(viewModel.nodeDetailsById[childId]?.node.status ?? "");
        conns.push({ id: `${nodeId}-${childId}`, d: bezierD(x1, y1, x2, y2), cls, midX: (x1 + x2) / 2, midY: (y1 + y2) / 2 });
      });
    });

    return (
      <div style={{ position: "relative", width: totalW, minHeight: totalH, margin: "0 auto" }}>
        <svg className="supply-chain-svg" width={totalW} height={totalH} viewBox={`0 0 ${totalW} ${totalH}`}>
          <defs>
            <filter id="supply-glow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {conns.map((c) => (
            <g key={c.id}>
              <path className={`supply-path supply-path--${c.cls}`} d={c.d} />
              <path className={`supply-path-flow supply-path--${c.cls}`} d={c.d} style={{ filter: "none" }} />
              <rect
                x={c.midX - 4} y={c.midY - 4} width={8} height={8} rx={1}
                transform={`rotate(45 ${c.midX} ${c.midY})`}
                fill={statusToColor(c.cls)}
                className="supply-checkpoint"
              />
            </g>
          ))}
        </svg>
        {Array.from(positions.entries()).map(([nodeId, pos]) => {
          const det = viewModel.nodeDetailsById[nodeId];
          if (!det) return null;
          const hasVisibleKids = det.childIds.filter((c) => subtreeVisible(c)).length > 0;
          const isCol = collapsedNodeIds.includes(nodeId);
          return (
            <div key={`card-${nodeId}`} className="supply-node-container" style={{ left: pos.x + SVG_PAD - SVG_NODE_W / 2, top: pos.y + SVG_PAD, width: SVG_NODE_W }}>
              <NodeCard
                details={det}
                isSelected={selectedNodeId === nodeId}
                isOnSelectedPath={selectedPathSet.has(nodeId)}
                isCollapsed={isCol}
                canToggle={hasVisibleKids}
                onSelect={() => { setSelectedNodeId(nodeId); setMobileTab("inspector"); setIsInspectorOpen(true); }}
                onToggle={() => setCollapsedNodeIds((cur) => cur.includes(nodeId) ? cur.filter((id) => id !== nodeId) : [...cur, nodeId])}
              />
            </div>
          );
        })}
      </div>
    );
  };

  /* ── Journey Map (Fullscreen Horizontal Three-Zone) ──── */
  const ORIGIN_ACTORS = new Set(["FARMER", "ESTATE", "COOPERATIVE"]);
  const PROCESSING_ACTORS = new Set(["MILL", "PROCESSOR", "TRADER", "INTERMEDIARY", "DISTRIBUTOR", "EXPORTER"]);

  const renderJourneyMap = () => {
    const allIds = selectedRoot.nodeIds.filter((id) => subtreeVisible(id));
    const originIds = allIds.filter((id) => ORIGIN_ACTORS.has(viewModel.nodeDetailsById[id]?.node.actorType));
    const processingIds = allIds.filter((id) => PROCESSING_ACTORS.has(viewModel.nodeDetailsById[id]?.node.actorType));
    const directSupplierNodeId = allIds.find(id => viewModel.nodeDetailsById[id]?.node.actorType === "DIRECT_SUPPLIER") || selectedRoot.rootId;
    const otherProcessingIds = processingIds.filter(id => id !== directSupplierNodeId);

    // Compute coordinates dynamically
    const originNodes = originIds.map((id, index) => {
      const total = originIds.length;
      const y = total <= 1 ? 310 : 80 + (index * (460 / (total - 1)));
      return { id, x: 170, y };
    });

    const centralNode = { id: directSupplierNodeId, x: 670, y: 310 };

    const processingNodes = otherProcessingIds.map((id, index) => {
      const coords = [
        { x: 440, y: 130 }, // Top Left
        { x: 440, y: 490 }, // Bottom Left
        { x: 890, y: 150 }, // Top Right
        { x: 890, y: 470 }  // Bottom Right
      ];
      return { id, ...coords[index % coords.length] };
    });

    const gatewayShield = { x: 1200, y: 160 };
    const gatewayShip = { x: 1200, y: 370 };
    const gatewayRing = { x: 1200, y: 510 };
    const gatewayRibbon = { x: 1200, y: 610 };

    const renderOriginPlot = (id: string, x: number, y: number, index: number) => {
      const det = viewModel.nodeDetailsById[id];
      if (!det) return null;
      const areas = ["1.27 ha", "8.63 ha", "13.3 ha", "6.45 ha"];
      const area = areas[index % areas.length];
      const isSelected = selectedNodeId === id;

      return (
        <div
          key={`plot-${id}`}
          className={`journey-plot-card ${isSelected ? "is-selected" : ""}`}
          style={{
            position: "absolute",
            left: x - 130,
            top: y - 60,
            width: 260,
            height: 120,
            zIndex: 10
          }}
          onClick={() => setSelectedNodeId(id)}
        >
          {/* Farmer Avatar & Verification */}
          <div className="journey-plot-avatar-col">
            <div className="journey-plot-avatar-glow">
              <div className="journey-plot-avatar">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="journey-plot-radar-line" />
            </div>
            <span className="journey-plot-verified-badge">✓ Geo</span>
          </div>

          {/* Plot Info & 3D Terrain */}
          <div className="journey-plot-details-col">
            <div className="journey-plot-title-wrap">
              <strong className="truncate block max-w-[140px]">{det.node.entityName}</strong>
              <span className="text-[9px] uppercase tracking-wider text-[#94a3b8] font-bold block mt-0.5">Tier 4 • {det.node.actorType}</span>
            </div>

            {/* Isometric SVG plot */}
            <div className="journey-plot-terrain-wrap">
              <svg className="journey-isometric-plot-svg" viewBox="0 0 100 60" width="100%" height="45">
                <defs>
                  <linearGradient id={`laser-glow-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Satellite Beam */}
                <polygon points="50,2 18,30 82,30" fill={`url(#laser-glow-${id})`} />
                {/* Satellite */}
                <g transform="translate(43, -2)">
                  <circle cx="7" cy="5" r="3" fill="#94a3b8" />
                  <line x1="1" y1="5" x2="13" y2="5" stroke="#cbd5e1" strokeWidth="1" />
                  <rect x="0" y="3" width="2" height="4" fill="#60a5fa" />
                  <rect x="12" y="3" width="2" height="4" fill="#60a5fa" />
                </g>
                {/* Isometric Block */}
                {/* Dirt sides */}
                <polygon points="15,30 50,45 50,56 15,41" fill="#4a3728" />
                <polygon points="50,45 85,30 85,41 50,56" fill="#36251b" />
                {/* Grass top */}
                <polygon points="50,18 85,30 50,45 15,30" fill="#15803d" />
                {/* Small trees */}
                <g transform="translate(30, 20)">
                  <polygon points="5,0 8,8 2,8" fill="#14532d" />
                  <line x1="5" y1="8" x2="5" y2="11" stroke="#78350f" strokeWidth="1.5" />
                </g>
                <g transform="translate(48, 26)">
                  <polygon points="5,0 8,8 2,8" fill="#166534" />
                  <line x1="5" y1="8" x2="5" y2="11" stroke="#78350f" strokeWidth="1.5" />
                </g>
                <g transform="translate(62, 18)">
                  <polygon points="5,0 8,8 2,8" fill="#14532d" />
                  <line x1="5" y1="8" x2="5" y2="11" stroke="#78350f" strokeWidth="1.5" />
                </g>
              </svg>
            </div>

            <div className="journey-plot-meta-row">
              <span>Area: <strong>{area}</strong></span>
              <span className="text-[#10b981] font-bold text-[9px] tracking-wide">100% OK</span>
            </div>
          </div>
        </div>
      );
    };

    const renderProcessingCard = (id: string, x: number, y: number, index: number) => {
      const det = viewModel.nodeDetailsById[id];
      if (!det) return null;
      const volumes = ["35.8%", "30.0%", "31.5%", "18.5%"];
      const vol = volumes[index % volumes.length];
      const isSelected = selectedNodeId === id;

      return (
        <div
          key={`proc-${id}`}
          className={`journey-proc-card ${isSelected ? "is-selected" : ""}`}
          style={{
            position: "absolute",
            left: x - 100,
            top: y - 50,
            width: 200,
            height: 100,
            zIndex: 10
          }}
          onClick={() => setSelectedNodeId(id)}
        >
          <div className="journey-proc-header">
            <span className="journey-proc-icon flex items-center justify-center text-amber-500">
              <NodeGlyph actorType={det.node.actorType} />
            </span>
            <div className="journey-proc-identity min-w-0">
              <strong className="truncate block">{det.node.entityName}</strong>
              <span className="truncate block">{det.node.country}</span>
            </div>
          </div>

          <div className="journey-proc-meta">
            <div className="journey-proc-meta-item">
              <span>Material</span>
              <strong className="truncate block max-w-[85px]">{det.node.materialName || "Palm Product"}</strong>
            </div>
            <div className="journey-proc-meta-item">
              <span>Volume %</span>
              <strong>{vol}</strong>
            </div>
          </div>
        </div>
      );
    };

    const renderCentralNode = () => {
      const det = viewModel.nodeDetailsById[directSupplierNodeId];
      if (!det) return null;
      const isSelected = selectedNodeId === directSupplierNodeId;
      return (
        <div
          key={`central-${directSupplierNodeId}`}
          className={`journey-central-node-wrap ${isSelected ? "is-selected" : ""}`}
          style={{
            position: "absolute",
            left: centralNode.x - 85,
            top: centralNode.y - 85,
            width: 170,
            height: 170,
            zIndex: 12
          }}
          onClick={() => setSelectedNodeId(directSupplierNodeId)}
        >
          <div className="journey-central-node-shape" />
          <div className="journey-central-node-content">
            <span className="journey-central-icon flex items-center justify-center text-brand-primary w-12 h-12">
              <NodeGlyph actorType={det.node.actorType} />
            </span>
            <strong className="journey-central-name truncate block max-w-[120px]">{det.node.entityName}</strong>
            <span className="journey-central-label">DIRECT SUPPLIER</span>
          </div>
        </div>
      );
    };

    const renderGatewayShield = () => (
      <div
        className="journey-shield-card"
        style={{
          position: "absolute",
          left: gatewayShield.x - 90,
          top: gatewayShield.y - 70,
          width: 180,
          height: 140,
          zIndex: 10
        }}
      >
        <div className="journey-shield-glow" />
        <div className="journey-shield-icon">
          <Shield className="h-10 w-10 text-[#60a5fa] fill-[#1e40af]/30" />
          <div className="journey-shield-stars">
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const rx = 13;
              const ry = 13;
              const cx = 16 + rx * Math.cos(angle);
              const cy = 16 + ry * Math.sin(angle);
              return (
                <span
                  key={i}
                  className="journey-shield-star"
                  style={{
                    left: `${cx}px`,
                    top: `${cy}px`
                  }}
                >
                  ★
                </span>
              );
            })}
          </div>
        </div>
        <strong>EU TRACES</strong>
        <span>Entry Point</span>

        {/* Floating DDS document files */}
        <div className="journey-floating-doc doc-1"><FileText className="h-3 w-3 mr-1 shrink-0" /> DDS</div>
        <div className="journey-floating-doc doc-2"><FileText className="h-3 w-3 mr-1 shrink-0" /> DDS</div>
        <div className="journey-floating-doc doc-3"><FileText className="h-3 w-3 mr-1 shrink-0" /> DDS</div>
      </div>
    );

    const renderGatewayShip = () => (
      <div
        className="journey-ship-card"
        style={{
          position: "absolute",
          left: gatewayShip.x - 100,
          top: gatewayShip.y - 45,
          width: 200,
          height: 90,
          zIndex: 10
        }}
      >
        <div className="journey-ship-icon-wrap">
          <Ship className="h-6 w-6 text-[#60a5fa]" />
        </div>
        <div className="journey-ship-details">
          <strong>Consignment</strong>
          <span>SHP-2026-EU-RDAM</span>
        </div>
      </div>
    );

    const renderGatewayRing = () => (
      <div
        className="journey-ring-card"
        style={{
          position: "absolute",
          left: gatewayRing.x - 70,
          top: gatewayRing.y - 70,
          width: 140,
          height: 140,
          zIndex: 10
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(96, 165, 250, 0.1)" strokeWidth="6" />
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="6"
            strokeDasharray="301.6"
            strokeDashoffset={301.6 - (301.6 * selectedRoot.completionPercent) / 100}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", filter: "drop-shadow(0 0 8px rgba(96, 165, 250, 0.6))" }}
          />
        </svg>
        <div className="journey-ring-content">
          <strong>{selectedRoot.completionPercent}%</strong>
          <span>TRACED</span>
        </div>
      </div>
    );

    const renderGatewayRibbon = () => (
      <div
        className="journey-ribbon-card"
        style={{
          position: "absolute",
          left: gatewayRibbon.x - 80,
          top: gatewayRibbon.y - 20,
          width: 160,
          height: 40,
          zIndex: 10
        }}
      >
        <div className="journey-ribbon-banner">
          <Award className="h-4 w-4 mr-1.5 text-yellow-400 fill-yellow-400/20 shrink-0" />
          <span>COMPLIANT</span>
        </div>
      </div>
    );

    // SVG paths
    const xm = 400;
    const ym = 310;

    const paths: React.ReactNode[] = [];
    const flowPaths: React.ReactNode[] = [];

    // 1. Origin to Center Flow
    originNodes.forEach((node) => {
      const x1 = node.x + 130;
      const y1 = node.y;
      const d = `M ${x1} ${y1} C ${x1 + 100} ${y1}, ${xm - 80} ${ym}, ${xm} ${ym}`;
      paths.push(<path key={`p-origin-${node.id}`} d={d} className="journey-svg-path path-green" />);
      flowPaths.push(<path key={`f-origin-${node.id}`} d={d} className="journey-svg-path-flow path-green" />);
    });

    // Merged line
    const dm = `M ${xm} ${ym} L ${centralNode.x - 110} ${ym}`;
    paths.push(<path key="p-merged" d={dm} className="journey-svg-path path-green" />);
    flowPaths.push(<path key="f-merged" d={dm} className="journey-svg-path-flow path-green" />);

    // 2. Processing Nodes to Central Node
    processingNodes.forEach((node) => {
      const x1 = node.x;
      const y1 = node.y;
      const x2 = centralNode.x;
      const y2 = centralNode.y;
      const cp1x = x1 < x2 ? x1 + 100 : x1 - 100;
      const cp2x = x1 < x2 ? x2 - 100 : x2 + 100;
      const d = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
      paths.push(<path key={`p-proc-${node.id}`} d={d} className="journey-svg-path path-amber" />);
      flowPaths.push(<path key={`f-proc-${node.id}`} d={d} className="journey-svg-path-flow path-amber" />);
    });

    // 3. Central Node to Gateway Shield
    const dShield = `M ${centralNode.x + 110} ${centralNode.y} C ${centralNode.x + 220} ${centralNode.y}, ${gatewayShield.x - 220} ${gatewayShield.y}, ${gatewayShield.x - 90} ${gatewayShield.y}`;
    paths.push(<path key="p-shield" d={dShield} className="journey-svg-path path-blue" />);
    flowPaths.push(<path key="f-shield" d={dShield} className="journey-svg-path-flow path-blue" />);

    // 4. Gateway Vertical Flow
    const dShip = `M ${gatewayShield.x} ${gatewayShield.y + 70} L ${gatewayShip.x} ${gatewayShip.y - 45}`;
    paths.push(<path key="p-ship" d={dShip} className="journey-svg-path path-blue" style={{ strokeDasharray: "none" }} />);
    flowPaths.push(<path key="f-ship" d={dShip} className="journey-svg-path-flow path-blue" />);

    const dRing = `M ${gatewayShip.x} ${gatewayShip.y + 45} L ${gatewayRing.x} ${gatewayRing.y - 70}`;
    paths.push(<path key="p-ring" d={dRing} className="journey-svg-path path-blue" style={{ strokeDasharray: "none" }} />);
    flowPaths.push(<path key="f-ring" d={dRing} className="journey-svg-path-flow path-blue" />);

    const dRibbon = `M ${gatewayRing.x} ${gatewayRing.y + 70} L ${gatewayRibbon.x} ${gatewayRibbon.y - 20}`;
    paths.push(<path key="p-ribbon" d={dRibbon} className="journey-svg-path path-blue" style={{ strokeDasharray: "none" }} />);
    flowPaths.push(<path key="f-ribbon" d={dRibbon} className="journey-svg-path-flow path-blue" />);

    return (
      <div className="journey-canvas">
        {/* Dynamic Topographic background paths */}
        <svg className="journey-topographic-svg" width="100%" height="100%">
          <path d="M -100 200 C 100 150, 300 450, 200 600" fill="none" stroke="rgba(96, 165, 250, 0.02)" strokeWidth="1.5" />
          <path d="M -120 230 C 90 170, 280 480, 180 630" fill="none" stroke="rgba(96, 165, 250, 0.015)" strokeWidth="1" />
          <path d="M 500 50 C 700 100, 800 -50, 1000 80" fill="none" stroke="rgba(245, 158, 11, 0.02)" strokeWidth="1.5" />
          <path d="M 480 30 C 690 80, 780 -70, 980 60" fill="none" stroke="rgba(245, 158, 11, 0.015)" strokeWidth="1" />
          <path d="M 1200 500 C 1300 550, 1500 450, 1600 600" fill="none" stroke="rgba(16, 185, 129, 0.02)" strokeWidth="1.5" />
          <path d="M 1180 520 C 1280 570, 1480 470, 1580 620" fill="none" stroke="rgba(16, 185, 129, 0.015)" strokeWidth="1" />
        </svg>

        {/* Zone label headers */}
        <div className="journey-canvas-zone-label l-zone">
          <span className="label-text green-theme flex items-center gap-1.5 justify-center">
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span>LEFT ZONE - 'ORIGIN'</span>
          </span>
          <span className="sub-text">(green theme)</span>
        </div>

        <div className="journey-canvas-zone-label c-zone">
          <span className="label-text amber-theme flex items-center gap-1.5 justify-center">
            <Activity className="h-3.5 w-3.5 shrink-0" />
            <span>CENTER ZONE - 'PROCESSING'</span>
          </span>
          <span className="sub-text">(amber theme)</span>
        </div>

        <div className="journey-canvas-zone-label r-zone">
          <span className="label-text blue-theme flex items-center gap-1.5 justify-center">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            <span>RIGHT ZONE - 'COMPLIANCE GATEWAY'</span>
          </span>
          <span className="sub-text">(blue theme)</span>
        </div>

        {/* SVG connection lines layer */}
        <svg className="journey-connector-svg" width="100%" height="100%">
          <defs>
            <filter id="svg-amber-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="svg-green-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="svg-blue-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <g opacity="0.65">
            {paths}
          </g>
          <g>
            {flowPaths}
          </g>
        </svg>

        {/* Render node elements absolutely */}
        {originNodes.map((n, index) => renderOriginPlot(n.id, n.x, n.y, index))}
        {processingNodes.map((n, index) => renderProcessingCard(n.id, n.x, n.y, index))}
        {renderCentralNode()}

        {/* Render gateway elements */}
        {renderGatewayShield()}
        {renderGatewayShip()}
        {renderGatewayRing()}
        {renderGatewayRibbon()}

        {/* Floating statistics panel (top right) */}
        <div className="journey-glass-stats-panel">
          <div className="stat-item"><span className="val text-brand-primary">{selectedRoot.totalActors}</span><span className="lbl">Actors Mapped</span></div>
          <div className="stat-item"><span className="val text-emerald-500">{selectedRoot.farmerCount}</span><span className="lbl">Producers</span></div>
          <div className="stat-item"><span className="val text-brand-primary">{selectedRoot.branchCount}</span><span className="lbl">Branches</span></div>
          <div className="stat-item"><span className="val text-[#ef4444]">{selectedRoot.incompleteLeafCount}</span><span className="lbl">Open Gaps</span></div>
        </div>

        {/* Deforestation free pill bar footer */}
        <div className="journey-footer-pill-bar">
          <span>{selectedRoot.nodeIds.length} Nodes Mapped</span>
          <span className="sep">•</span>
          <span>{selectedRoot.farmerCount} Plots Identified</span>
          <span className="sep">•</span>
          <span>100% Deforestation Polygon Coverage</span>
          <span className="sep">•</span>
          <span className="text-[#10b981] font-extrabold font-mono">0 Deforestation Flags Detected</span>
        </div>
      </div>
    );
  };

  const renderMergedTreeMap = () => (
    <div className="traceability-map">
      <div className="traceability-map__header">
        <div>
          <p className="traceability-map__eyebrow">Supply Chain Map</p>
          <h3>{selectedRoot.ingredientName}</h3>
          <span>{selectedRoot.productName} • {selectedRoot.directSupplierName}</span>
        </div>
        <div className="traceability-map__meta">
          <span className="trace-chip trace-chip--outline">{visibleNodeCount} visible actors</span>
          <span className="trace-chip trace-chip--outline">{visibleSplitCount} split point{visibleSplitCount === 1 ? "" : "s"}</span>
          <button type="button" className="traceability-icon-button" onClick={() => setIsMapFullscreen(true)} aria-label="Open full screen supply chain map">
            <FullscreenGlyph />
          </button>
        </div>
      </div>

      <div className="traceability-map__legend">
        <span><em className="traceability-map__lane-dot traceability-map__lane-dot--supplier" />Direct supplier</span>
        <span><em className="traceability-map__lane-dot traceability-map__lane-dot--intermediary" />Intermediaries and mills</span>
        <span><em className="traceability-map__lane-dot traceability-map__lane-dot--producer" />Producers, estates, and farmers</span>
      </div>

      <div className="traceability-tree">
        {renderSVGTree()}
      </div>
    </div>
  );

  return (
    <div className="traceability-studio">
      <div className="traceability-studio__rail fos-card">
        <div className="traceability-studio__section-title">
          <h2>Ingredient roots</h2>
          <span>{viewModel.roots.length} chains</span>
        </div>
        <div className="traceability-studio__rail-list">
          {viewModel.roots.map((root) => (
            <RootSelectorCard key={root.rootId} root={root} isSelected={root.rootId === selectedRoot.rootId} onClick={() => onSelectRoot(root.rootId)} />
          ))}
        </div>
      </div>

      <div className="traceability-studio__content">
        <div className="fos-card traceability-overview p-6 rounded-xl border border-white/40 bg-gradient-to-br from-white/95 to-bg-page/95 shadow-md">
          <div className="traceability-overview__hero flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-5 border-b border-border-soft/60">
            <div className="traceability-overview__hero-copy space-y-1">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] block">
                Ingredient Traceability Studio
              </span>
              <h2 className="text-2xl font-black text-brand-primary flex items-center gap-2">
                <span className="text-3xl select-none leading-none">{getCommodityIcon(selectedRoot.ingredientName)}</span>
                {selectedRoot.ingredientName}
              </h2>
              <span className="text-xs text-text-secondary font-medium">
                {selectedRoot.productName} • {selectedRoot.directSupplierName}
              </span>
            </div>
            <div className="traceability-overview__impact flex items-center gap-4">
              <div className="bg-white rounded-xl border border-brand-primary/10 p-3 text-center min-w-[130px] shadow-sm flex flex-col justify-center">
                <strong className="text-2xl font-black text-brand-primary leading-none tracking-tight">
                  {selectedRoot.completionPercent}%
                </strong>
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider mt-1 block">
                  Branch Completion
                </span>
              </div>
              <span className={`traceability-impact text-xs font-extrabold uppercase px-4 py-2 rounded-full border tracking-wide select-none ${
                selectedRoot.shipmentImpact === "READY" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : 
                selectedRoot.shipmentImpact === "BLOCKED" ? "bg-state-error/10 text-state-error border-state-error/20" : 
                "bg-amber-500/10 text-amber-700 border-amber-500/20"
              }`}>
                {selectedRoot.shipmentImpact === "AT_RISK" ? "At Risk" : toSentenceCase(selectedRoot.shipmentImpact)}
              </span>
            </div>
          </div>

          <div className="traceability-overview__stats grid grid-cols-2 lg:grid-cols-4 gap-4 py-5 border-b border-border-soft/60">
            <div className="p-3 bg-white/60 rounded-xl border border-border-soft/50 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-brand-primary/5 text-brand-primary flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="grid gap-0.5 leading-none">
                <strong className="text-base font-extrabold text-brand-primary">{selectedRoot.totalActors}</strong>
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Total Actors</span>
              </div>
            </div>

            <div className="p-3 bg-white/60 rounded-xl border border-border-soft/50 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/5 text-emerald-600 flex items-center justify-center shrink-0">
                <Layers className="h-5 w-5" />
              </div>
              <div className="grid gap-0.5 leading-none">
                <strong className="text-base font-extrabold text-brand-primary">{selectedRoot.branchCount}</strong>
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Terminal Producers</span>
              </div>
            </div>

            <div className="p-3 bg-white/60 rounded-xl border border-border-soft/50 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/5 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="grid gap-0.5 leading-none">
                <strong className="text-base font-extrabold text-brand-primary">{selectedRoot.incompleteLeafCount}</strong>
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Incomplete Leaves</span>
              </div>
            </div>

            <div className="p-3 bg-white/60 rounded-xl border border-border-soft/50 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-500/5 text-violet-600 flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5" />
              </div>
              <div className="grid gap-0.5 leading-none">
                <strong className="text-sm font-extrabold text-brand-primary truncate max-w-[110px] block">
                  {selectedRoot.latestActivityDate ? formatDate(selectedRoot.latestActivityDate) : "No activity"}
                </strong>
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Latest Activity</span>
              </div>
            </div>
          </div>

          <div className="traceability-legend flex flex-wrap justify-center gap-5 pt-4 text-xs font-semibold text-text-secondary leading-none">
            <span className="flex items-center gap-1.5"><em className="traceability-legend__dot traceability-legend__dot--requested bg-violet-500 shadow-sm" />Request sent</span>
            <span className="flex items-center gap-1.5"><em className="traceability-legend__dot traceability-legend__dot--review bg-amber-500 shadow-sm" />Response received</span>
            <span className="flex items-center gap-1.5"><em className="traceability-legend__dot traceability-legend__dot--ready bg-emerald-500 shadow-sm" />Evidence attached</span>
            <span className="flex items-center gap-1.5"><em className="traceability-legend__dot traceability-legend__dot--leaf bg-cyan-600 shadow-sm" />Geolocation valid</span>
            <span className="flex items-center gap-1.5"><em className="traceability-legend__dot traceability-legend__dot--path bg-brand-primary shadow-sm" />Branch complete</span>
          </div>
        </div>

        <div className="traceability-mobile-tabs lg:hidden">
          {(["summary", "lineage", "inspector"] as const).map((tab) => (
            <button key={tab} type="button" className={mobileTab === tab ? "btn-primary" : "btn-secondary"} onClick={() => setMobileTab(tab)}>
              {tab === "summary" ? "Summary" : tab === "lineage" ? "Map" : "Inspector"}
            </button>
          ))}
        </div>

        <div className={`traceability-studio__workspace traceability-studio__workspace--${mobileTab}`}>
          <div className="traceability-studio__canvas fos-card p-5 rounded-xl border border-border-soft bg-bg-surface shadow-sm">
            <div className="traceability-studio__section-title flex justify-between items-center pb-3 border-b border-border-soft/60">
              <h2 className="text-base font-extrabold text-brand-primary uppercase tracking-wider">Supply chain map</h2>
              <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 border border-brand-primary/10 px-3 py-1 rounded-full">{visibleNodeCount} visible actors</span>
            </div>

            <div className="traceability-filters grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-border-soft/50 bg-bg-page/30 mt-4">
              <label className="traceability-filter-field flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Status</span>
                <select className="form-select text-xs font-semibold text-brand-primary rounded-lg border-border-soft p-2.5 bg-white" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                  <option value="ALL">All statuses</option>
                  {["NOT_REQUESTED", "REQUESTED", "IN_PROGRESS", "SUBMITTED", "GAPS_FOUND", "COMPLETE", "BLOCKED"].map((status) => (
                    <option key={status} value={status}>{toSentenceCase(status)}</option>
                  ))}
                </select>
              </label>
              <label className="traceability-filter-field flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Actor</span>
                <select className="form-select text-xs font-semibold text-brand-primary rounded-lg border-border-soft p-2.5 bg-white" value={actorFilter} onChange={(event) => setActorFilter(event.target.value as ActorFilter)}>
                  <option value="ALL">All actor types</option>
                  {["DIRECT_SUPPLIER", "INTERMEDIARY", "MILL", "TRADER", "PROCESSOR", "DISTRIBUTOR", "EXPORTER", "FARMER", "COOPERATIVE", "ESTATE"].map((actorType) => (
                    <option key={actorType} value={actorType}>{toSentenceCase(actorType)}</option>
                  ))}
                </select>
              </label>
              <label className="traceability-filter-field flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Country</span>
                <select className="form-select text-xs font-semibold text-brand-primary rounded-lg border-border-soft p-2.5 bg-white" value={countryFilter} onChange={(event) => setCountryFilter(event.target.value as CountryFilter)}>
                  <option value="ALL">All countries</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </label>
              <label className="traceability-filter-field flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Form</span>
                <select className="form-select text-xs font-semibold text-brand-primary rounded-lg border-border-soft p-2.5 bg-white" value={formFilter} onChange={(event) => setFormFilter(event.target.value as FormFilter)}>
                  <option value="ALL">All forms</option>
                  <option value="INTERMEDIARY">Intermediary form</option>
                  <option value="FARMER">Farmer form</option>
                </select>
              </label>
              <label className="traceability-toggle col-span-2 md:col-span-4 flex items-center gap-2 pt-2 text-xs font-bold text-brand-primary cursor-pointer select-none">
                <input type="checkbox" className="accent-brand-primary cursor-pointer h-4 w-4" checked={showIncompleteOnly} onChange={(event) => setShowIncompleteOnly(event.target.checked)} />
                Only incomplete branches
              </label>
            </div>

            <div className="mt-5">
              {renderMergedTreeMap()}
            </div>
          </div>
        </div>

        {/* Slide-over floating inspector drawer backdrop */}
        <div 
          className={`traceability-inspector-drawer__backdrop ${isInspectorOpen && selectedNode ? "is-open" : ""}`}
          onClick={() => setIsInspectorOpen(false)}
        />

        {/* Slide-over floating inspector drawer */}
        <div className={`traceability-inspector-drawer ${isInspectorOpen && selectedNode ? "is-open" : ""}`}>
          <div className="flex items-center justify-between border-b border-border-soft/60 pb-4">
            <div>
              <h2 className="text-sm font-extrabold text-brand-primary uppercase tracking-wider">Inspector</h2>
              <span className="text-[10px] font-bold text-text-secondary">{selectedNode ? selectedNode.formPartyLabel : ""}</span>
            </div>
            <button 
              type="button" 
              className="h-8 w-8 rounded-full border border-border-soft flex items-center justify-center text-text-secondary hover:bg-bg-page transition-colors"
              onClick={() => setIsInspectorOpen(false)}
              aria-label="Close inspector panel"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {!selectedNode ? (
            <p className="traceability-empty-state mt-4">Select a chain node to inspect which party filled which form and what evidence is still open.</p>
          ) : (
            <div className="traceability-inspector mt-2">
              <div className="traceability-inspector__hero p-4 rounded-xl bg-gradient-to-b from-white to-bg-page border border-border-soft flex items-center gap-3">
                <div className="traceability-node-card__glyph">
                  <NodeGlyph actorType={selectedNode.node.actorType} />
                </div>
                <div>
                  <strong className="text-xs font-bold text-brand-primary">{selectedNode.node.entityName}</strong>
                  <span className="text-[10px] text-text-secondary block mt-0.5">{selectedNode.actorDisplayLabel} • {selectedNode.node.country}</span>
                </div>
              </div>

              <div className="traceability-inspector__section">
                <h3>Who this actor is</h3>
                <p>{selectedNode.node.entityName} sits at tier {selectedNode.node.tier} for {selectedRoot.ingredientName} and contributes {Math.round(selectedNode.node.volumeContributionPercent)}% of the visible branch volume.</p>
              </div>

              <div className="traceability-inspector__section">
                <h3>Which form they filled</h3>
                <div className="traceability-inspector__grid">
                  <div><span>Form family</span><strong>{selectedNode.formPartyLabel}</strong></div>
                  <div><span>Form token</span><strong className="truncate max-w-[120px] inline-block">{selectedNode.request?.tokenLabel ?? "No request generated"}</strong></div>
                  <div><span>Request status</span><strong>{selectedNode.request ? toSentenceCase(selectedNode.request.status) : "Not requested"}</strong></div>
                  <div><span>Requested at</span><strong>{selectedNode.request ? formatDate(selectedNode.request.requestedAt) : "Not available"}</strong></div>
                </div>
              </div>

              <div className="traceability-inspector__section">
                <h3>Evidence attached</h3>
                <div className="traceability-inspector__grid">
                  <div><span>Attached</span><strong>{selectedNode.evidenceSummary.attached}</strong></div>
                  <div><span>Missing</span><strong>{selectedNode.evidenceSummary.missing}</strong></div>
                  <div><span>Legal evidence</span><strong>{selectedNode.evidenceSummary.legalEvidenceCount}</strong></div>
                  <div><span>Sustainability evidence</span><strong>{selectedNode.evidenceSummary.sustainabilityEvidenceCount}</strong></div>
                </div>
              </div>

              <div className="traceability-inspector__section">
                <h3>Geolocation / plot readiness</h3>
                <div className="traceability-inspector__grid">
                  <div><span>Plot count</span><strong>{selectedNode.evidenceSummary.plotCount}</strong></div>
                  <div><span>Geolocation state</span><strong>{selectedNode.evidenceSummary.geolocationReady === null ? "Not applicable" : selectedNode.evidenceSummary.geolocationReady ? "Valid" : "Blocked"}</strong></div>
                  <div><span>Blocking geo issues</span><strong>{selectedNode.evidenceSummary.blockingGeoCount}</strong></div>
                  <div><span>Missing geo rows</span><strong>{selectedNode.evidenceSummary.missingGeoCount}</strong></div>
                </div>
              </div>

              <div className="traceability-inspector__section">
                <h3>Parent branch and downstream impact</h3>
                <p>{selectedNode.downstreamImpact}</p>
                <p className="text-xs font-mono text-brand-primary p-2.5 bg-bg-page rounded border border-border-soft mt-1 leading-5">
                  {selectedNode.pathNodeIds.map((nodeId) => viewModel.nodeDetailsById[nodeId].node.entityName).join(" → ")}
                </p>
              </div>

              <div className="traceability-inspector__section">
                <h3>Next action</h3>
                <p>{selectedNode.nextAction}</p>
              </div>

              <div className="traceability-inspector__section">
                <h3>Branch timeline</h3>
                <div className="traceability-timeline">
                  {selectedNode.timeline.map((event, index) => (
                    <div key={`${event.label}-${index}`} className={`traceability-timeline__item traceability-timeline__item--${event.tone}`}>
                      <span>{formatDate(event.date)}</span>
                      <strong>{event.label}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

        <div className="fos-card traceability-open-gaps">
          <div className="traceability-studio__section-title">
            <h2>Open gaps</h2>
            <span>{gapNodes.length} blocking nodes</span>
          </div>
          {visibleNodeCount === 0 ? (
            <p className="traceability-empty-state">No open gaps are visible because the current filter set hides the full tree.</p>
          ) : gapNodes.length === 0 ? (
            <div className="traceability-gap traceability-gap--success">All visible branches currently terminate in accepted farmer or producer evidence.</div>
          ) : (
            selectedRoot.branchGroups
              .filter((branch) => branch.pathNodeIds.some((nodeId) => subtreeVisible(nodeId)))
              .map((branch) => (
                <div key={`${branch.id}-gaps`} className="traceability-gap-group">
                  <strong>{branch.label}</strong>
                  {branch.gapMessages.length === 0 ? (
                    <div className="traceability-gap traceability-gap--success">No open issues on this branch.</div>
                  ) : (
                    branch.gapMessages.map((message) => (
                      <div key={message} className="traceability-gap">{message}</div>
                    ))
                  )}
                </div>
              ))
          )}
        </div>

      {isMapFullscreen && (
        <div className="traceability-modal-backdrop traceability-modal-backdrop--journey" onClick={() => setIsMapFullscreen(false)}>
          <div className="traceability-modal traceability-modal--journey" onClick={(event) => event.stopPropagation()}>
            <div className="traceability-modal__header">
              <div>
                <p className="traceability-map__eyebrow" style={{ color: "#64748b" }}>Journey Map — Full Supply Chain View</p>
                <h2>{selectedRoot.ingredientName}</h2>
                <span>{selectedRoot.productName} • {selectedRoot.directSupplierName}</span>
              </div>
              <button type="button" className="traceability-icon-button" onClick={() => setIsMapFullscreen(false)} aria-label="Close full screen map">
                <CloseGlyph />
              </button>
            </div>
            <div className="traceability-modal__body" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
              {renderJourneyMap()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SupplyChainSnapshot(props: SupplyChainSnapshotProps) {
  const { viewModel, supplierId } = props;
  const roots = viewModel.roots.filter((root) => root.supplierId === supplierId);

  if (roots.length === 0) {
    return (
      <div className="traceability-snapshot">
        <p className="traceability-empty-state">No ingredient-linked supplier chain has been started yet. Generate the first EUDR form link to create a traceability path.</p>
      </div>
    );
  }

  return (
    <div className="traceability-snapshot">
      <div className="traceability-snapshot__hero">
        <div>
          <h3>Supply chain snapshot</h3>
          <p>Per-ingredient readiness, branch gaps, and the latest upstream declaration activity for this supplier.</p>
        </div>
      </div>

      <div className="traceability-snapshot__chips">
        {roots.map((root) => (
          <span key={`${root.rootId}-chip`} className={`trace-chip trace-chip--${root.shipmentImpact === "READY" ? "ready" : root.shipmentImpact === "BLOCKED" ? "blocked" : "review"}`}>
            {root.ingredientName}
          </span>
        ))}
      </div>

      <div className="traceability-snapshot__grid">
        {roots.map((root) => {
          const latestRequest = root.nodeIds
            .map((nodeId) => viewModel.nodeDetailsById[nodeId].request)
            .filter((request): request is NonNullable<typeof request> => Boolean(request))
            .sort((left, right) => left.requestedAt.localeCompare(right.requestedAt))
            .at(-1);
          const completedFarmers = root.leafNodeIds
            .map((nodeId) => viewModel.nodeDetailsById[nodeId].node)
            .filter((node) => node.status === "COMPLETE").length;

          return (
            <div key={root.rootId} className="traceability-snapshot__item">
              <div className="traceability-snapshot__item-top">
                <div>
                  <strong>{root.ingredientName}</strong>
                  <span>{root.productName}</span>
                </div>
                <span className={`trace-chip trace-chip--${root.shipmentImpact === "READY" ? "ready" : root.shipmentImpact === "BLOCKED" ? "blocked" : "review"}`}>
                  {root.shipmentImpact === "AT_RISK" ? "At Risk" : toSentenceCase(root.shipmentImpact)}
                </span>
              </div>

              <div className="traceability-snapshot__stats">
                <span>{completedFarmers}/{root.leafNodeIds.length} producers complete</span>
                <span>{root.blockingNodeIds.length} open branch gaps</span>
                <span>{latestRequest ? `Latest: ${latestRequest.tokenLabel}` : "No request activity"}</span>
              </div>

              <div className="traceability-snapshot__actions">
                <Link href={buildTraceabilityLink(root) as any} className="btn-primary">Open Full Traceability Studio</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
