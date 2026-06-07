"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  CheckCircle2,
  Factory,
  PackageCheck,
  Search,
  Ship,
  Truck,
  Warehouse,
  X,
} from "lucide-react";
import { Card, SectionHeader, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRoot, TableRow, Tag } from "@/components/ui";
import type { ConsignmentRecord, DocumentRecord, ProductRecord, SupplierRecord } from "@/lib/gfi-dummy-data";
import {
  buildOnSiteTraceabilityViewModel,
  STAGE_THEME_MAP,
  STAGE_THEMES,
  type OnSiteEventType,
  type OnSiteJourneyEdge,
  type OnSiteJourneyNode,
  type OnSiteJourneyStage,
  type OnSiteStageId,
  type OnSiteStageTheme,
  type OnSiteStageThemeId,
  type OnSiteTraceabilityStatus,
} from "@/lib/on-site-traceability";
import type { StatusTone } from "@/lib/ui-semantics";

type ViewMode = "PROCESS" | "EVIDENCE" | "GAPS";
type QuickFilter = "ALL" | "BLOCKED" | "REVIEW_REQUIRED" | "COMPLETE" | "NON_EUDR";

const STATUS_TONE: Record<OnSiteTraceabilityStatus, StatusTone> = {
  COMPLETE: "ready",
  REVIEW_REQUIRED: "review_required",
  BLOCKED: "blocked",
  NOT_APPLICABLE: "draft",
};

const FLOW_COLORS: Record<OnSiteTraceabilityStatus, string> = {
  COMPLETE: "#10b981",
  REVIEW_REQUIRED: "#f59e0b",
  BLOCKED: "#ef4444",
  NOT_APPLICABLE: "#94a3b8",
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (part) => part.toUpperCase());
}

function stageIcon(stageId: OnSiteStageId) {
  if (stageId === "receiving") return Truck;
  if (stageId === "quality") return CheckCircle2;
  if (stageId === "storage") return Warehouse;
  if (stageId === "production") return Factory;
  if (stageId === "finished_goods") return Boxes;
  return Ship;
}

function eventIcon(type: OnSiteEventType) {
  if (type === "RECEIVED") return Truck;
  if (type === "QA_RELEASED") return CheckCircle2;
  if (type === "WAREHOUSED" || type === "TRANSFERRED") return Warehouse;
  if (type === "CONSUMED" || type === "TRANSFORMED") return Factory;
  if (type === "PACKED" || type === "STORED_FINISHED") return Boxes;
  if (type === "ALLOCATED" || type === "SHIPPED") return Ship;
  return PackageCheck;
}

/* ── Stage Panel ─────────────────────────────────────── */

function StagePanel(props: {
  stage: OnSiteJourneyStage;
  theme: OnSiteStageTheme;
  events: OnSiteJourneyNode[];
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
}) {
  const { stage, theme, events, selectedNodeId, onSelectNode } = props;
  const Icon = stageIcon(stage.id);

  return (
    <div
      className={`onsite-stage-panel onsite-theme--${theme.id}`}
      style={{
        position: "absolute",
        left: stage.x,
        top: 46,
        width: stage.width,
        height: "auto",
        minHeight: 130,
        maxHeight: 350,
      }}
    >
      {/* Colored glow top border */}
      <div className="onsite-stage-panel__glow" style={{ background: theme.color, boxShadow: `0 4px 20px ${theme.glowColor}` }} />
      <div className="onsite-stage-panel__header">
        <span className="onsite-stage-panel__icon" style={{ background: theme.iconBg, color: theme.color }}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="onsite-stage-panel__title">
          <p className="onsite-stage-panel__label">{stage.label}</p>
          <p className="onsite-stage-panel__desc">{stage.description}</p>
        </div>
      </div>
      <div className="onsite-stage-panel__events">
        {events.length === 0 ? (
          <div className="onsite-stage-panel__empty">
            <p>No events</p>
          </div>
        ) : (
          events.map((node) => (
            <PipelineEventCard
              key={node.id}
              node={node}
              theme={theme}
              isSelected={selectedNodeId === node.id}
              onClick={() => onSelectNode(node.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ── Pipeline Event Card ─────────────────────────────── */

function PipelineEventCard(props: {
  node: OnSiteJourneyNode;
  theme: OnSiteStageTheme;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { node, theme, isSelected, onClick } = props;
  const Icon = eventIcon(node.eventType);
  const progressWidth = Math.max(0, Math.min(100, node.evidenceComplete));

  return (
    <button
      id={`onsite-node-${node.id}`}
      type="button"
      className={`onsite-event-card ${isSelected ? "is-selected" : ""}`}
      style={{
        borderLeftColor: theme.color,
        ...(isSelected ? { boxShadow: `0 0 0 2px ${theme.color}, 0 6px 20px ${theme.glowColor}` } : {}),
      }}
      onClick={onClick}
    >
      <div className="onsite-event-card__top">
        <span className="onsite-event-card__step" style={{ background: theme.color }}>
          {node.stepNumber}
        </span>
        <span className="onsite-event-card__type-icon" style={{ background: theme.iconBg, color: theme.color }}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="onsite-event-card__info">
          <p className="onsite-event-card__title">{node.title}</p>
          <p className="onsite-event-card__ref">{node.recordRef}</p>
        </div>
      </div>
      <div className="onsite-event-card__meta">
        <span className="onsite-event-card__qty">{node.quantity}</span>
        <span className="onsite-event-card__evidence">{node.evidenceComplete}%</span>
      </div>
      <div className="onsite-event-card__bar">
        <div
          className="onsite-event-card__bar-fill"
          style={{
            width: `${progressWidth}%`,
            background: node.status === "COMPLETE" ? "#10b981" : node.status === "BLOCKED" ? "#ef4444" : node.status === "REVIEW_REQUIRED" ? "#f59e0b" : "#94a3b8",
          }}
        />
      </div>
    </button>
  );
}

/* ── Flow Connector SVG Layer ────────────────────────── */

function FlowConnectors(props: {
  nodes: OnSiteJourneyNode[];
  edges: OnSiteJourneyEdge[];
  stages: OnSiteJourneyStage[];
  coords: Record<
    string,
    {
      leftX: number;
      rightX: number;
      centerX: number;
      centerY: number;
      topY: number;
      bottomY: number;
    }
  >;
}) {
  const { nodes, edges, stages, coords } = props;
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Build stage-aware connections: connect last event of stage N to first event of stage N+1
  const stageOrder: OnSiteStageId[] = ["receiving", "quality", "storage", "production", "finished_goods", "dispatch"];
  const eventsPerStage = useMemo(() => {
    const map = new Map<OnSiteStageId, OnSiteJourneyNode[]>();
    for (const sid of stageOrder) map.set(sid, []);
    for (const node of nodes) {
      const list = map.get(node.stageId);
      if (list) list.push(node);
    }
    return map;
  }, [nodes]);

  // Build intra-stage connections (events within same stage)
  const intraStageConns: Array<{ source: OnSiteJourneyNode; target: OnSiteJourneyNode; edge?: OnSiteJourneyEdge }> = [];
  for (const [, stageEvents] of eventsPerStage) {
    for (let i = 0; i < stageEvents.length - 1; i++) {
      const edge = edges.find((e) => e.source === stageEvents[i].id && e.target === stageEvents[i + 1].id);
      intraStageConns.push({ source: stageEvents[i], target: stageEvents[i + 1], edge });
    }
  }

  // Build inter-stage connections (last event of stage → first event of next stage)
  const interStageConns: Array<{ source: OnSiteJourneyNode; target: OnSiteJourneyNode; edge?: OnSiteJourneyEdge }> = [];
  for (let i = 0; i < stageOrder.length - 1; i++) {
    const currentEvents = eventsPerStage.get(stageOrder[i]) ?? [];
    const nextEvents = eventsPerStage.get(stageOrder[i + 1]) ?? [];
    if (currentEvents.length > 0 && nextEvents.length > 0) {
      const lastOfCurrent = currentEvents[currentEvents.length - 1];
      const firstOfNext = nextEvents[0];
      const edge = edges.find((e) => e.source === lastOfCurrent.id && e.target === firstOfNext.id)
        ?? edges.find((e) => {
          const srcNode = nodeById.get(e.source);
          const tgtNode = nodeById.get(e.target);
          return srcNode?.stageId === stageOrder[i] && tgtNode?.stageId === stageOrder[i + 1];
        });
      interStageConns.push({ source: lastOfCurrent, target: firstOfNext, edge });
    }
  }

  const STAGE_WIDTH = 210;
  const CARD_HEIGHT = 128;

  function getNodeCenter(node: OnSiteJourneyNode, side: "right" | "left"): { x: number; y: number } {
    if (coords[node.id]) {
      return {
        x: side === "right" ? coords[node.id].rightX : coords[node.id].leftX,
        y: coords[node.id].centerY,
      };
    }

    const stage = stages.find((s) => s.id === node.stageId);
    if (!stage) return { x: 0, y: 0 };

    const stageEvents = eventsPerStage.get(node.stageId) ?? [];
    const idx = stageEvents.indexOf(node);
    const cardY = 90 + idx * CARD_HEIGHT + 46; // top padding + stage header

    return {
      x: side === "right" ? stage.x + STAGE_WIDTH : stage.x,
      y: cardY + 52, // center of card
    };
  }

  function renderConnection(conn: { source: OnSiteJourneyNode; target: OnSiteJourneyNode; edge?: OnSiteJourneyEdge }, key: string, isInterStage: boolean) {
    const isSameStage = conn.source.stageId === conn.target.stageId;
    const status = conn.edge?.status ?? conn.target.status;
    const color = FLOW_COLORS[status];
    const quantityLabel = conn.edge?.quantityLabel;

    if (isSameStage && coords[conn.source.id] && coords[conn.target.id]) {
      const from = {
        x: coords[conn.source.id].centerX,
        y: coords[conn.source.id].bottomY + 4,
      };
      const to = {
        x: coords[conn.target.id].centerX,
        y: coords[conn.target.id].topY - 4,
      };

      const d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
      const midX = from.x;
      const midY = (from.y + to.y) / 2;

      return (
        <g key={key}>
          {/* Background glow path */}
          <path d={d} fill="none" stroke={color} strokeWidth={2} opacity={0.15} />
          {/* Static path */}
          <path d={d} fill="none" stroke={color} strokeWidth={1.5} opacity={0.35} />
          {/* Arrowhead pointing down */}
          <path
            d={`M ${to.x - 4} ${to.y - 5} L ${to.x} ${to.y} L ${to.x + 4} ${to.y - 5} Z`}
            fill={color}
            opacity={0.85}
          />
          {/* Quantity label next to vertical line */}
          {quantityLabel && (
            <text
              x={midX + 8}
              y={midY + 3}
              textAnchor="start"
              fill={color}
              fontSize={8.5}
              fontWeight={700}
              fontFamily="inherit"
              className="select-none"
              style={{
                paintOrder: "stroke",
                stroke: "var(--fos-bg-page)",
                strokeWidth: 3,
                strokeLinejoin: "round",
              }}
            >
              {quantityLabel}
            </text>
          )}
        </g>
      );
    }

    const from = getNodeCenter(conn.source, "right");
    const to = getNodeCenter(conn.target, "left");

    // Add margin gaps so lines and arrowheads don't intersect the cards
    const adjustedFromX = from.x + 4;
    const adjustedToX = to.x - 4;

    const gap = adjustedToX - adjustedFromX;
    const cp = isInterStage ? Math.max(gap * 0.4, 20) : Math.max(gap * 0.3, 10);

    const d = `M ${adjustedFromX} ${from.y} C ${adjustedFromX + cp} ${from.y}, ${adjustedToX - cp} ${to.y}, ${adjustedToX} ${to.y}`;

    const midX = (adjustedFromX + adjustedToX) / 2;
    const midY = (from.y + to.y) / 2;

    return (
      <g key={key}>
        {/* Background glow path */}
        <path d={d} fill="none" stroke={color} strokeWidth={isInterStage ? 3.5 : 2.5} strokeLinecap="round" opacity={0.15} />
        {/* Static path */}
        <path d={d} fill="none" stroke={color} strokeWidth={isInterStage ? 3 : 2} strokeLinecap="round" opacity={0.35} />
        {/* Animated flow path */}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={isInterStage ? 3.5 : 2.5}
          strokeLinecap="round"
          strokeDasharray={isInterStage ? "8 22" : "5 16"}
          className="onsite-flow-path--animated"
        />
        {/* Proper Arrowhead at target */}
        <path
          d={`M ${adjustedToX - 7} ${to.y - 4.5} L ${adjustedToX} ${to.y} L ${adjustedToX - 7} ${to.y + 4.5} Z`}
          fill={color}
          opacity={0.85}
        />
        {/* Quantity label above the arrow */}
        {quantityLabel && (
          <g>
            <text
              x={midX}
              y={midY - 6}
              textAnchor="middle"
              fill={color}
              fontSize={9}
              fontWeight={700}
              fontFamily="inherit"
              className="select-none"
              style={{
                paintOrder: "stroke",
                stroke: "var(--fos-bg-page)",
                strokeWidth: 4,
                strokeLinejoin: "round",
              }}
            >
              {quantityLabel}
            </text>
          </g>
        )}
      </g>
    );
  }

  return (
    <svg
      className="onsite-flow-svg"
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}
    >
      {intraStageConns.map((conn, i) => renderConnection(conn, `intra-${i}`, false))}
      {interStageConns.map((conn, i) => renderConnection(conn, `inter-${i}`, true))}
    </svg>
  );
}

/* ── Pipeline Canvas ─────────────────────────────────── */

function PipelineCanvas(props: {
  stages: OnSiteJourneyStage[];
  nodes: OnSiteJourneyNode[];
  edges: OnSiteJourneyEdge[];
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
}) {
  const { stages, nodes, edges, selectedNodeId, onSelectNode } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<Record<
    string,
    {
      leftX: number;
      rightX: number;
      centerX: number;
      centerY: number;
      topY: number;
      bottomY: number;
    }
  >>({});

  useEffect(() => {
    const canvasEl = scrollRef.current?.querySelector(".onsite-pipeline-canvas");
    if (!canvasEl) return;

    const updateCoords = () => {
      const canvasRect = canvasEl.getBoundingClientRect();
      const newCoords: Record<
        string,
        {
          leftX: number;
          rightX: number;
          centerX: number;
          centerY: number;
          topY: number;
          bottomY: number;
        }
      > = {};

      nodes.forEach((node) => {
        const cardEl = document.getElementById(`onsite-node-${node.id}`);
        if (cardEl) {
          const cardRect = cardEl.getBoundingClientRect();
          newCoords[node.id] = {
            leftX: cardRect.left - canvasRect.left,
            rightX: cardRect.right - canvasRect.left,
            centerX: (cardRect.left + cardRect.right) / 2 - canvasRect.left,
            centerY: (cardRect.top + cardRect.bottom) / 2 - canvasRect.top,
            topY: cardRect.top - canvasRect.top,
            bottomY: cardRect.bottom - canvasRect.top,
          };
        }
      });
      setCoords(newCoords);
    };

    updateCoords();

    const timer = setTimeout(updateCoords, 100);

    window.addEventListener("resize", updateCoords);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateCoords);
    };
  }, [nodes]);

  const eventsByStage = useMemo(() => {
    const map = new Map<OnSiteStageId, OnSiteJourneyNode[]>();
    for (const stage of stages) map.set(stage.id, []);
    for (const node of nodes) {
      const list = map.get(node.stageId);
      if (list) list.push(node);
    }
    return map;
  }, [nodes, stages]);

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-2">
          <Search className="mx-auto h-8 w-8 text-text-muted" aria-hidden="true" />
          <p className="text-sm font-semibold text-brand-primary">No journey events match these filters.</p>
          <p className="text-xs text-text-secondary">Adjust the filters to restore the full material path.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onsite-pipeline-scroll" ref={scrollRef}>
      <div className="onsite-pipeline-canvas">
        {/* Background grid */}
        <div className="onsite-pipeline-canvas__grid" />

        {/* Stage zone labels at top */}
        <div className="onsite-pipeline-canvas__stage-strip">
          {stages.map((stage) => {
            const themeId = STAGE_THEME_MAP[stage.id];
            const theme = STAGE_THEMES[themeId];
            const events = eventsByStage.get(stage.id) ?? [];
            return (
              <div
                key={stage.id}
                className="onsite-stage-chip"
                style={{
                  position: "absolute",
                  left: stage.x,
                  top: 0,
                  width: stage.width,
                }}
              >
                <span
                  className="onsite-stage-chip__dot"
                  style={{
                    background: stage.status === "NOT_APPLICABLE" ? "#94a3b8" : theme.color,
                    boxShadow: stage.status !== "NOT_APPLICABLE" ? `0 0 8px ${theme.glowColor}` : "none",
                  }}
                />
                <span className="onsite-stage-chip__label" style={{ color: stage.status === "NOT_APPLICABLE" ? "#94a3b8" : theme.color }}>
                  {stage.shortLabel}
                </span>
                <span className="onsite-stage-chip__count">{events.length}</span>
              </div>
            );
          })}
        </div>

        {/* SVG flow connections layer */}
        <FlowConnectors nodes={nodes} edges={edges} stages={stages} coords={coords} />

        {/* Stage panels */}
        {stages.map((stage) => {
          const themeId = STAGE_THEME_MAP[stage.id];
          const theme = STAGE_THEMES[themeId];
          const events = eventsByStage.get(stage.id) ?? [];
          return (
            <StagePanel
              key={stage.id}
              stage={stage}
              theme={theme}
              events={events}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Studio Component ───────────────────────────── */

export function OnSiteTraceabilityStudio(props: {
  products: ProductRecord[];
  suppliers: SupplierRecord[];
  consignments: ConsignmentRecord[];
  documents: DocumentRecord[];
}) {
  const { products, suppliers, consignments, documents } = props;
  const [selectedLotId, setSelectedLotId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("PROCESS");
  const [statusFilter, setStatusFilter] = useState<OnSiteTraceabilityStatus | "ALL">("ALL");
  const [selectedNodeId, setSelectedNodeId] = useState("");

  const baseViewModel = useMemo(
    () => buildOnSiteTraceabilityViewModel({ products, suppliers, consignments, documents }),
    [consignments, documents, products, suppliers],
  );

  const lotById = useMemo(() => new Map(baseViewModel.lots.map((lot) => [lot.id, lot])), [baseViewModel.lots]);

  const filteredLotIds = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return baseViewModel.lots
      .filter((lot) => {
        if (!query) return true;
        return (
          lot.lotCode.toLowerCase().includes(query) ||
          lot.ingredientName.toLowerCase().includes(query)
        );
      })
      .map((lot) => lot.id);
  }, [baseViewModel.lots, searchQuery]);

  useEffect(() => {
    if (selectedLotId && filteredLotIds.includes(selectedLotId)) return;
    setSelectedLotId(filteredLotIds[0] ?? baseViewModel.lots[0]?.id ?? "");
  }, [baseViewModel.lots, filteredLotIds, selectedLotId]);

  const viewModel = useMemo(
    () =>
      buildOnSiteTraceabilityViewModel({
        products,
        suppliers,
        consignments,
        documents,
        selectedLotId,
        statusFilter,
        showOnlyGaps: viewMode === "GAPS",
      }),
    [consignments, documents, products, selectedLotId, statusFilter, suppliers, viewMode],
  );

  useEffect(() => {
    setSelectedNodeId(viewModel.nodes[0]?.id ?? "");
  }, [selectedLotId, statusFilter, viewModel.nodes]);

  const selectedNode = viewModel.nodes.find((node) => node.id === selectedNodeId) ?? viewModel.nodes[0];
  const selectedEvidenceRow = selectedNode ? viewModel.evidenceRows.find((row) => row.eventId === selectedNode.id) : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      {/* Left sidebar: lot selector */}
      <Card className="space-y-4 p-4 sm:p-5 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-auto">
        <SectionHeader title="On Site Journeys" description="Select a GFI ingredient lot, batch, or consignment path." />
        {/* Compact search input filter */}
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lot code, ingredient..."
            className="w-full rounded-lg border border-border-soft bg-bg-surface-alt pl-9 pr-8 py-2 text-xs font-semibold text-text-primary placeholder:text-text-secondary focus:border-brand-primary focus:bg-bg-surface focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all duration-150"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
            <Search className="h-3.5 w-3.5" />
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="space-y-2">
          {filteredLotIds.map((lotId) => {
            const lot = lotById.get(lotId);
            const option = baseViewModel.journeyOptions.find((item) => item.id === lotId);
            if (!lot || !option) return null;

            return (
              <button
                key={lot.id}
                type="button"
                onClick={() => setSelectedLotId(lot.id)}
                className={[
                  "w-full rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent",
                  selectedLotId === lot.id
                    ? "border-brand-accent bg-brand-accent-soft shadow-sm"
                    : "border-border-soft bg-bg-surface hover:border-brand-primary/30 hover:bg-bg-surface-alt",
                ].join(" ")}
              >
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-extrabold text-brand-primary">{lot.lotCode}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-4 text-text-secondary">{lot.ingredientName}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Right content area */}
      <div className="min-w-0 space-y-6">
        {/* KPI row */}
        <Card className="space-y-4 p-4 sm:p-5">
          <SectionHeader
            title="GFI Material Journey"
            description="Internal movement from supplier receipt through production, finished goods, and consignment release."
            actions={viewModel.selectedJourney ? <StatusBadge status={STATUS_TONE[viewModel.selectedJourney.status]}>{formatLabel(viewModel.selectedJourney.status)}</StatusBadge> : null}
          />
        </Card>

        {/* Pipeline Canvas */}
        <Card className="min-w-0 overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Material Journey Pipeline</p>
              <h3 className="text-lg font-extrabold text-brand-primary">
                {viewModel.selectedJourney?.lot.lotCode ?? "No journey selected"}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Tag tone="neutral">{viewModel.selectedJourney?.supplierName ?? "Supplier pending"}</Tag>
              <Tag tone="brand">{viewModel.selectedJourney?.consignmentReference ?? "No consignment"}</Tag>
            </div>
          </div>
          {/* Journey metadata strip */}
          <div className="space-y-3 border-b border-border-soft bg-bg-surface p-4">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
              {[
                ["Ingredient lot", viewModel.selectedJourney?.lot.lotCode],
                ["Supplier", viewModel.selectedJourney?.supplierName],
                ["Batch", viewModel.selectedJourney?.productionBatchReference],
                ["Finished lot", viewModel.selectedJourney?.finishedGoodsReference],
                ["Consignment", viewModel.selectedJourney?.consignmentReference],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border-soft bg-bg-surface-alt px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">{label}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-brand-primary">{value ?? "Pending"}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                {viewModel.stages.map((stage) => {
                  const themeId = STAGE_THEME_MAP[stage.id];
                  const theme = STAGE_THEMES[themeId];
                  return (
                    <span
                      key={stage.id}
                      className="flex items-center gap-2 rounded-full border border-border-soft bg-bg-surface-alt px-3 py-1.5 text-xs font-bold text-text-secondary"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background: stage.status === "NOT_APPLICABLE" ? "#94a3b8" : theme.color,
                          boxShadow: stage.status !== "NOT_APPLICABLE" ? `0 0 6px ${theme.glowColor}` : "none",
                        }}
                      />
                      {stage.shortLabel}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Pipeline canvas */}
          <div className="h-[420px] bg-bg-page">
            <PipelineCanvas
              stages={viewModel.stages}
              nodes={viewModel.nodes}
              edges={viewModel.edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />
          </div>
        </Card>

        {/* Evidence Matrix + Gaps */}
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card className="space-y-4 p-4 sm:p-5">
            <SectionHeader title="Evidence Matrix" description="Event-level proof required for the selected material journey." />
            <TableRoot>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell density="compact">Event</TableHeaderCell>
                    <TableHeaderCell density="compact">Status</TableHeaderCell>
                    <TableHeaderCell density="compact">Evidence</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewModel.evidenceRows.map((row) => (
                    <TableRow
                      key={row.eventId}
                      selected={row.eventId === selectedNodeId}
                      onClick={() => setSelectedNodeId(row.eventId)}
                      className="cursor-pointer"
                    >
                      <TableCell density="compact">
                        <p className="font-semibold text-brand-primary">{row.eventTitle}</p>
                        <p className="text-xs text-text-secondary">{formatLabel(row.eventType)}</p>
                      </TableCell>
                      <TableCell density="compact">
                        <StatusBadge status={STATUS_TONE[row.status]}>{formatLabel(row.status)}</StatusBadge>
                      </TableCell>
                      <TableCell density="compact">
                        <div className="flex flex-wrap gap-1.5">
                          {row.evidence.length > 0 ? row.evidence.map((evidence) => (
                            <Tag key={evidence.id} tone={evidence.status === "ATTACHED" ? "success" : evidence.status === "MISSING" ? "danger" : "warning"}>
                              {formatLabel(evidence.evidenceType)}
                            </Tag>
                          )) : <Tag tone="neutral">No evidence mapped</Tag>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableRoot>
          </Card>

          <Card className="space-y-4 p-4 sm:p-5">
            <SectionHeader title="Gaps and Exceptions" description="Evidence joins that need compliance or operations follow-up." />
            {viewModel.gaps.length === 0 ? (
              <Card variant="inset" className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-5 w-5 text-state-success" aria-hidden="true" />
                <p className="text-sm font-semibold text-brand-primary">No open gaps on this selected journey.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {viewModel.gaps.map((gap) => (
                  <Card key={gap.id} variant={gap.status === "BLOCKED" ? "alert" : "inset"} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-primary">{gap.title}</p>
                        <p className="mt-1 text-xs text-text-secondary">Source: {gap.source}</p>
                      </div>
                      <StatusBadge status={gap.status === "BLOCKED" ? "blocked" : "review_required"}>{gap.severity}</StatusBadge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
