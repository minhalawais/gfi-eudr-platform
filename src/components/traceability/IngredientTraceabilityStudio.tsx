"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Send, Copy, Eye, FileText } from "lucide-react";

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
import { SupplyChainNode, getProductName } from "@/lib/gfi-dummy-data";
import { useSession } from "@/components/ui/PermissionGuard";
import {
  ModalShell,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormField,
  FormGrid,
  FormActions,
  Input,
  Select,
  Card,
  Button,
  StatusBadge,
  Tag,
} from "@/components/ui";

type StatusFilter = SupplyChainNode["status"] | "ALL";
type ActorFilter = SupplyChainNode["actorType"] | "ALL";
type CountryFilter = string | "ALL";
type FormFilter = "INTERMEDIARY" | "FARMER" | "ALL";
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

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

function toStatusTone(value: string): any {
  const normalized = value.toLowerCase();
  if (normalized === "closed") return "ready";
  if (normalized.includes("approve")) return "approved";
  if (normalized.includes("block")) return "blocked";
  if (normalized.includes("change")) return "changes_requested";
  if (normalized.includes("pending")) return "pending";
  if (normalized.includes("review")) return "under_review";
  if (normalized.includes("request")) return "requested";
  return "info";
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
  onViewDeclaration: (details: TraceabilityNodeDetails) => void;
  onAddSibling: (node: SupplyChainNode) => void;
}) {
  const { details, isSelected, isOnSelectedPath, isCollapsed, canToggle, onSelect, onToggle, onViewDeclaration, onAddSibling } = props;
  const { node, evidenceSummary } = details;

  return (
    <div className="traceability-node-card-shell">
      <div
        data-actor={node.actorType}
        data-status={node.status}
        className={`traceability-node-card${isSelected ? " is-selected" : ""}${isOnSelectedPath ? " is-on-path" : ""}`}
      >
      <div
        role="button"
        tabIndex={0}
        className="traceability-node-card__selectable"
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
      >
      {/* Top Row: Eyebrow Roles & Status tag */}
      <div className="traceability-node-card__eyebrow flex items-center justify-between w-full">
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span>{details.actorDisplayLabel}</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>Tier {node.tier}</span>
        </div>
        <span className={`trace-chip trace-chip--xs trace-chip--${STATUS_ACCENTS[node.status]}`}>{toSentenceCase(node.status)}</span>
      </div>

      {/* Identity Row: Icon + Name & Country */}
      <div className="traceability-node-card__identity flex items-start gap-2.5 w-full min-w-0">
        <span className="traceability-node-card__glyph flex-shrink-0">
          <NodeGlyph actorType={node.actorType} />
        </span>
        <div className="min-w-0 text-left" style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          <strong className="traceability-node-card__name block text-xs font-extrabold text-brand-primary" title={node.entityName}>
            {node.entityName}
          </strong>
          <span className="traceability-node-card__country block text-[10px] text-text-secondary">{node.country}</span>
        </div>
      </div>

      {/* Material & Volume Line (Inline) */}
      <div className="traceability-node-card__meta-line flex items-center justify-between w-full text-[10.5px] leading-tight min-w-0">
        <span className="traceability-node-card__material truncate font-medium text-text-secondary" title={node.materialName}>
          {node.materialName}
        </span>
        <span className="traceability-node-card__share shrink-0 font-bold text-brand-primary ml-2">
          {Math.round(node.volumeContributionPercent)}% share
        </span>
      </div>

      {/* Geolocation & Compliance Badges */}
      <div className="traceability-node-card__badges flex items-center gap-1.5 flex-wrap w-full">
        <span className="trace-chip trace-chip--xs trace-chip--outline">{details.formPartyLabel}</span>
        <span className={`trace-chip trace-chip--xs trace-chip--${evidenceSummary.geolocationReady === false || evidenceSummary.missing > 0 ? "blocked" : evidenceSummary.attached > 0 ? "ready" : "muted"}`}>
          {evidenceSummary.stateLabel}
        </span>
      </div>

      {/* Compliance Evidence Progress Bar */}
      {(() => {
        const totalEvidence = (evidenceSummary.attached ?? 0) + (evidenceSummary.missing ?? 0);
        const progressWidth = totalEvidence > 0 ? Math.round((evidenceSummary.attached / totalEvidence) * 100) : (node.status === "COMPLETE" ? 100 : 0);
        return (
          <div className="traceability-node-card__progress-container flex flex-col gap-1 w-full">
            <div className="flex justify-between items-center text-[8.5px] font-bold text-text-secondary leading-none">
              <span>Compliance Evidence</span>
              <span>{progressWidth}%</span>
            </div>
            <div className="traceability-node-card__bar">
              <div
                className="traceability-node-card__bar-fill"
                style={{
                  width: `${progressWidth}%`,
                  background: node.status === "COMPLETE" ? "#10b981" : node.status === "BLOCKED" || node.status === "GAPS_FOUND" ? "#ef4444" : "#f59e0b",
                }}
              />
            </div>
          </div>
        );
      })()}

      </div>
      <button
        type="button"
        className="traceability-node-card__declaration-action"
        onClick={(event) => {
          event.stopPropagation();
          onViewDeclaration(details);
        }}
      >
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        <span>View declaration form</span>
      </button>
      </div>

      <button
        type="button"
        className="traceability-node-card__branch-action"
        onClick={(e) => {
          e.stopPropagation();
          onAddSibling(node);
        }}
      >
        <span className="traceability-node-card__branch-action-icon" aria-hidden="true">+</span>
        <span>Add Parallel Actor</span>
      </button>
    </div>
  );
}

/* ── GFI DDS Reference Builder ────────────────────────── */
function buildDDSRef(ingredientName: string): string {
  const code = ingredientName
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .map((w) => w.slice(0, 2).toUpperCase())
    .join("")
    .slice(0, 4)
    .padEnd(3, "X");
  return `DDS-GFI-2026-${code}`;
}

/* ── GFI Anchor Card — Premium EU Operator Node ────────── */
function GFIAnchorCard({ ingredientName, productName }: { ingredientName: string; productName: string }) {
  const ddsRef = buildDDSRef(ingredientName);
  const commodityIcon = getCommodityIcon(ingredientName);
  return (
    <div className="gfi-anchor-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "6px" }}>
      {/* Top Center: Circular JoJo logo inside gold hexagonal frame */}
      <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
        <svg viewBox="0 0 48 48" width="40" height="40" style={{ display: "block", position: "absolute", top: 0, left: 0 }}>
          <defs>
            <linearGradient id="gfi-hex-grad-circle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F4C400" />
              <stop offset="100%" stopColor="#D4A800" />
            </linearGradient>
          </defs>
          <polygon points="24,2 43,12.5 43,35.5 24,46 5,35.5 5,12.5" fill="url(#gfi-hex-grad-circle)" />
          <polygon points="24,6 40,15.5 40,32.5 24,42 8,32.5 8,15.5" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
        </svg>
        <div style={{ position: "absolute", inset: "4.5px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: "50%", background: "#FFFFFF", padding: "1px", boxShadow: "0 1.5px 3px rgba(0,0,0,0.15)" }}>
          <img src="/jojo_logo.png" alt="JoJo Logo" style={{ width: "90%", height: "90%", objectFit: "contain" }} />
        </div>
      </div>

      {/* Identity Info */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
        <div style={{ color: "#FFFFFF", fontSize: "10.5px", fontWeight: 800, lineHeight: 1.2, letterSpacing: "0.01em" }}>
          Gujranwala Food Industries
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "7px", fontWeight: 850, letterSpacing: "0.06em", color: "#F4C400", background: "rgba(244,196,0,0.12)", border: "1px solid rgba(244,196,0,0.35)", borderRadius: "3px", padding: "1px 4px" }}>
            EU OPERATOR
          </span>
          <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)" }}>🇵🇰 PK</span>
        </div>
      </div>

      {/* Stars divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "3px", width: "70%" }}>
        <div style={{ flex: 1, height: "1px", background: "rgba(244,196,0,0.15)" }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <span key={i} style={{ fontSize: "5px", color: "rgba(244,196,0,0.4)", lineHeight: 1 }}>★</span>
        ))}
        <div style={{ flex: 1, height: "1px", background: "rgba(244,196,0,0.15)" }} />
      </div>

      {/* Context Details */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", width: "90%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "3px", justifyContent: "center", width: "100%" }}>
          <span style={{ fontSize: "10px", lineHeight: 1 }}>{commodityIcon}</span>
          <span style={{ fontSize: "9.5px", color: "#FFFFFF", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ingredientName}>
            {ingredientName}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "3px", justifyContent: "center", width: "100%", opacity: 0.8 }}>
          <span style={{ fontSize: "10px", lineHeight: 1 }}>📦</span>
          <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.75)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={productName}>
            {productName}
          </span>
        </div>
      </div>

      {/* Status & References */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", borderTop: "1px solid rgba(244,196,0,0.1)", paddingTop: "4px", width: "80%", marginTop: "1px" }}>
        <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace", fontWeight: 700 }} title={ddsRef}>{ddsRef}</span>
        <span style={{ fontSize: "7px", fontWeight: 800, color: "#10b981", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "3px", padding: "1px 4px", letterSpacing: "0.04em" }}>✓ COMPLETE</span>
        <span style={{ fontSize: "7px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace", marginTop: "1px" }}>EORI: PK-GFI-0001</span>
      </div>
    </div>
  );
}

function RootSelectorCard(props: {
  root: IngredientTraceabilityRootSummary;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { root, isSelected, onClick } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative group w-full rounded-lg border pl-4 pr-3 py-2.5 text-left transition-all duration-200 ease-emphasized overflow-hidden",
        isSelected
          ? "border-brand-primary bg-brand-accent-soft/40 shadow-sm"
          : "border-border-soft bg-bg-surface hover:-translate-y-0.5 hover:border-border-strong hover:bg-bg-surface-alt hover:shadow-card",
      ].join(" ")}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary rounded-l-lg" />
      )}
      <div className="flex items-center justify-between gap-2">
        <strong className="block truncate text-sm font-bold text-brand-primary transition-colors group-hover:text-brand-primary-dark">
          {root.ingredientName}
        </strong>
        <span className="text-[10px] font-semibold text-text-muted shrink-0">
          {root.totalActors} actors
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded bg-bg-page/55 border border-border-soft px-1.5 py-0.5 text-[10px] font-bold text-text-secondary truncate max-w-[120px]" title={root.productName}>
          {root.productName}
        </span>
        <span className="rounded bg-bg-page/55 border border-border-soft px-1.5 py-0.5 text-[10px] font-bold text-text-secondary truncate max-w-[120px]" title={root.directSupplierName}>
          {root.directSupplierName}
        </span>
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

const ALL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", 
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", 
  "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", 
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", 
  "Comoros", "Congo", "Costa Rica", "Côte d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", 
  "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", 
  "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", 
  "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", 
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", 
  "Kazakhstan", "Kenya", "Kiribati", "North Korea", "South Korea", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", 
  "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", 
  "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", 
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", 
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", 
  "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", 
  "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", 
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", 
  "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", 
  "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", 
  "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", 
  "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export function IngredientTraceabilityStudio(props: IngredientTraceabilityStudioProps) {
  const { viewModel, selectedRootId, onSelectRoot } = props;
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [actorFilter, setActorFilter] = useState<ActorFilter>("ALL");
  const [countryFilter, setCountryFilter] = useState<CountryFilter>("ALL");
  const [formFilter, setFormFilter] = useState<FormFilter>("ALL");
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isDeclarationModalOpen, setIsDeclarationModalOpen] = useState(false);
  const [declarationActorId, setDeclarationActorId] = useState("");
  const [declarationModalToken, setDeclarationModalToken] = useState("");
  const [declarationNotice, setDeclarationNotice] = useState<string | null>(null);

  const {
    addSupplyChainNode,
    addSupplyChainEdge,
    eudrFormRequests,
    generateEudrFormRequest,
    suppliers,
    supplyChainNodes
  } = useSession();

  // Local email status for Chain Requests
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  // Add Actor Modal State
  const [isAddActorModalOpen, setIsAddActorModalOpen] = useState(false);
  const [addActorMode, setAddActorMode] = useState<"SIBLING" | "CHILD">("SIBLING");
  const [addActorTargetNode, setAddActorTargetNode] = useState<SupplyChainNode | null>(null);

  // Modal Form State
  const [newActorName, setNewActorName] = useState("");
  const [newActorType, setNewActorType] = useState<SupplyChainNode["actorType"]>("TRADER");
  const [newActorCountry, setNewActorCountry] = useState("Indonesia");
  const [newActorMaterial, setNewActorMaterial] = useState("");
  const [newActorVolume, setNewActorVolume] = useState(100);
  const [newActorStatus, setNewActorStatus] = useState<SupplyChainNode["status"]>("COMPLETE");

  const selectedRoot = viewModel.rootById[selectedRootId] ?? viewModel.roots[0];

  const selectedRootRequests = useMemo(() => {
    if (!selectedRoot) return [];
    return eudrFormRequests.filter((request) => {
      if (request.productId === selectedRoot.productId && request.ingredientId === selectedRoot.ingredientId) {
        return true;
      }
      const node = supplyChainNodes.find((item) => item.id === request.targetNodeId);
      if (node && node.productId === selectedRoot.productId && node.ingredientId === selectedRoot.ingredientId) {
        return true;
      }
      return false;
    });
  }, [eudrFormRequests, selectedRoot, supplyChainNodes]);

  useEffect(() => {
    if (!selectedRoot) return;
    const current = selectedNodeId ? viewModel.nodeDetailsById[selectedNodeId] : null;
    if (!current || !selectedRoot.nodeIds.includes(current.node.id)) {
      setSelectedNodeId(selectedRoot.rootId);
    }
  }, [selectedNodeId, selectedRoot, viewModel.nodeDetailsById]);

  useEffect(() => {
    if (!isMapFullscreen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMapFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMapFullscreen]);

  const selectedNode = selectedNodeId ? viewModel.nodeDetailsById[selectedNodeId] : null;
  const selectedPathSet = new Set(selectedNode?.pathNodeIds ?? []);

  const getLatestRequestForNode = (nodeId: string) =>
    eudrFormRequests
      .filter((request) => request.targetNodeId === nodeId && request.status !== "CLOSED")
      .sort((left, right) => left.requestedAt.localeCompare(right.requestedAt))
      .at(-1) ?? null;

  const getDeclarationRequestForDetails = (details: TraceabilityNodeDetails) =>
    getLatestRequestForNode(details.node.id) ?? details.request;

  const buildDeclarationLink = (tokenLabel: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/supplier?token=${tokenLabel}`;

  const withDeclarationNotice = (message: string) => {
    setDeclarationNotice(message);
    window.setTimeout(() => setDeclarationNotice(null), 4000);
  };

  const ensureDeclarationRequest = (details: TraceabilityNodeDetails) => {
    const existing = getDeclarationRequestForDetails(details);
    if (existing) return existing;

    const supplier = suppliers.find((item) => item.id === details.node.supplierId);
    const formType = details.formType === "FARMER" ? "FARMER" : "INTERMEDIARY";
    const parentRequestId = details.node.parentNodeId ? getLatestRequestForNode(details.node.parentNodeId)?.id ?? null : null;

    return generateEudrFormRequest({
      supplierId: details.node.supplierId,
      supplierName: supplier?.name ?? details.node.entityName,
      productId: details.node.productId,
      ingredientId: details.node.ingredientId,
      commodity: details.node.commodity,
      materialName: details.node.materialName,
      formType,
      parentNodeId: details.node.parentNodeId,
      parentRequestId,
      email: supplier?.email ?? "",
      entityName: details.node.entityName,
      country: details.node.country,
      actorType: details.node.actorType,
      volumeContributionPercent: details.node.volumeContributionPercent,
    });
  };

  const handleCopyDeclarationLink = async (details: TraceabilityNodeDetails) => {
    try {
      const request = ensureDeclarationRequest(details);
      const url = buildDeclarationLink(request.tokenLabel);
      await navigator.clipboard.writeText(url);
      withDeclarationNotice(`Declaration link copied for ${details.node.entityName}.`);
    } catch {
      withDeclarationNotice("The declaration link could not be copied. Please try again.");
    }
  };

  const handleSendDeclarationEmail = (details: TraceabilityNodeDetails) => {
    try {
      const request = ensureDeclarationRequest(details);
      const recipient = request.email || suppliers.find((item) => item.id === details.node.supplierId)?.email;
      if (!recipient) {
        withDeclarationNotice(`No email address is available for ${details.node.entityName}.`);
        return;
      }

      const url = buildDeclarationLink(request.tokenLabel);
      const subject = encodeURIComponent(`Declaration form request - ${details.node.entityName}`);
      const body = encodeURIComponent(
        [
          `Hello ${details.node.entityName},`,
          "",
          `Please complete the ${details.formPartyLabel.toLowerCase()} for ${selectedRoot.ingredientName} in ${selectedRoot.productName}.`,
          `Request token: ${request.tokenLabel}`,
          `Portal link: ${url}`,
          "",
          "Regards,",
          "GFI Compliance",
        ].join("\n"),
      );
      withDeclarationNotice(`Email draft prepared for ${details.node.entityName}.`);
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    } catch {
      withDeclarationNotice("The declaration email could not be prepared. Please try again.");
    }
  };

  const handleViewDeclarationForm = (details: TraceabilityNodeDetails) => {
    const request = ensureDeclarationRequest(details);
    setSelectedNodeId(details.node.id);
    setDeclarationActorId(details.node.id);
    setDeclarationModalToken(request.tokenLabel);
    setDeclarationNotice(null);
    setIsDeclarationModalOpen(true);
  };

  const closeDeclarationWorkspace = () => {
    setIsDeclarationModalOpen(false);
    setDeclarationActorId("");
    setDeclarationModalToken("");
    setDeclarationNotice(null);
  };

  const declarationActor = declarationActorId ? viewModel.nodeDetailsById[declarationActorId] : null;
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

  /* ── SVG Tree Layout Engine (Horizontal Left → Right) ──── */
  const SVG_NODE_W = 290;
  const SVG_NODE_CARD_H = 274;
  const SVG_NODE_LAYOUT_H = 320;
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

  /* Measures how much vertical height a subtree occupies */
  const computeSubtreeHeight = (nodeId: string): number => {
    const d = viewModel.nodeDetailsById[nodeId];
    if (!d || !subtreeVisible(nodeId)) return 0;
    const isCol = collapsedNodeIds.includes(nodeId);
    const kids = isCol ? [] : d.childIds.filter((c) => subtreeVisible(c));
    if (kids.length === 0) return SVG_NODE_LAYOUT_H;
    const childHeights = kids.map((k) => computeSubtreeHeight(k));
    return childHeights.reduce((a, b) => a + b, 0) + (kids.length - 1) * SVG_SIBLING_GAP;
  };

  /* Places nodes horizontally: x = tier column, y = vertical center of subtree */
  const computePositions = (rootIds: string[]) => {
    const positions = new Map<string, { x: number; y: number }>();
    const assign = (nodeId: string, depth: number, topEdge: number) => {
      const d = viewModel.nodeDetailsById[nodeId];
      if (!d || !subtreeVisible(nodeId)) return;
      const sh = computeSubtreeHeight(nodeId);
      positions.set(nodeId, {
        x: depth * (SVG_NODE_W + SVG_TIER_GAP),
        y: topEdge + sh / 2 - SVG_NODE_LAYOUT_H / 2,
      });
      const isCol = collapsedNodeIds.includes(nodeId);
      const kids = isCol ? [] : d.childIds.filter((c) => subtreeVisible(c));
      let cursor = topEdge;
      kids.forEach((k) => {
        const ch = computeSubtreeHeight(k);
        assign(k, depth + 1, cursor);
        cursor += ch + SVG_SIBLING_GAP;
      });
    };
    const visibleRootIds = rootIds.filter((rootId) => subtreeVisible(rootId));
    let rootCursor = 0;
    visibleRootIds.forEach((rootId) => {
      const rootHeight = computeSubtreeHeight(rootId);
      assign(rootId, 0, rootCursor);
      rootCursor += rootHeight + SVG_SIBLING_GAP;
    });
    const totalH = Math.max(
      SVG_NODE_LAYOUT_H,
      rootCursor > 0 ? rootCursor - SVG_SIBLING_GAP : 0,
    );
    let maxDepth = 0;
    positions.forEach((p) => {
      const col = SVG_NODE_W + SVG_TIER_GAP > 0 ? Math.round(p.x / (SVG_NODE_W + SVG_TIER_GAP)) : 0;
      if (col > maxDepth) maxDepth = col;
    });
    const width = (maxDepth + 1) * SVG_NODE_W + maxDepth * SVG_TIER_GAP;
    return { positions, width, height: totalH };
  };

  /* Horizontal S-curve: flows right from parent to child */
  const bezierH = (x1: number, y1: number, x2: number, y2: number) => {
    const midX = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  };

  const renderSVGTree = (instanceId: "inline" | "fullscreen") => {
    const entryNodeIds = selectedRoot.nodeIds.filter(
      (nodeId) => viewModel.nodeDetailsById[nodeId]?.node.parentNodeId === null,
    );
    const layout = computePositions(entryNodeIds);
    if (layout.positions.size === 0) return <p className="traceability-empty-state" style={{ color: "#94a3b8" }}>No visible nodes match the current filters.</p>;
    const { width: tw, height: th } = layout;

    // Shift all existing nodes right by one column to insert GFI anchor at position 0
    const COLUMN_SHIFT = SVG_NODE_W + SVG_TIER_GAP;
    const positions = new Map(
      Array.from(layout.positions.entries()).map(([id, pos]) => [id, { x: pos.x + COLUMN_SHIFT, y: pos.y }])
    );

    const totalW = tw + COLUMN_SHIFT + SVG_PAD * 2 + 50;
    const totalH = th + SVG_PAD * 2;

    // Center the GFI anchor against all parallel chain entry actors.
    const gfiCardY = Math.max(0, th / 2 - SVG_NODE_CARD_H / 2);

    // Build all connectors: GFI→parallel entries (gold) + standard node-to-node
    const conns: { id: string; d: string; cls: string; midX: number; midY: number; isGfi?: boolean }[] = [];

    entryNodeIds.forEach((entryNodeId) => {
      const rootPos = positions.get(entryNodeId);
      if (!rootPos) return;
      const x1 = SVG_PAD + 230;                          // GFI right edge (circle boundary)
      const y1 = gfiCardY + SVG_NODE_CARD_H / 2 + SVG_PAD;    // GFI vertical center
      const x2 = rootPos.x + SVG_PAD;                     // root left edge
      const y2 = rootPos.y + SVG_NODE_CARD_H / 2 + SVG_PAD;   // root card center
      conns.push({ id: `gfi-${entryNodeId}`, d: bezierH(x1, y1, x2, y2), cls: "complete", midX: (x1 + x2) / 2, midY: (y1 + y2) / 2, isGfi: true });
    });

    positions.forEach((pos, nodeId) => {
      const det = viewModel.nodeDetailsById[nodeId];
      if (!det) return;
      const isCol = collapsedNodeIds.includes(nodeId);
      const kids = isCol ? [] : det.childIds.filter((c) => subtreeVisible(c));
      kids.forEach((childId) => {
        const cp = positions.get(childId);
        if (!cp) return;
        const x1 = pos.x + SVG_NODE_W + SVG_PAD;    // parent right edge
        const y1 = pos.y + SVG_NODE_CARD_H / 2 + SVG_PAD; // parent card center
        const x2 = cp.x + SVG_PAD;                    // child left edge
        const y2 = cp.y + SVG_NODE_CARD_H / 2 + SVG_PAD;  // child card center
        const cls = statusToCls(viewModel.nodeDetailsById[childId]?.node.status ?? "");
        conns.push({ id: `${nodeId}-${childId}`, d: bezierH(x1, y1, x2, y2), cls, midX: (x1 + x2) / 2, midY: (y1 + y2) / 2 });
      });
    });

    return (
      <div style={{ position: "relative", width: totalW, minHeight: totalH }}>
        <svg className="supply-chain-svg" width={totalW} height={totalH} viewBox={`0 0 ${totalW} ${totalH}`}>
          <defs>
            <filter id={`${instanceId}-supply-glow`} x="-25%" y="-25%" width="150%" height="150%">
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
                fill={c.isGfi ? "#F4C400" : statusToColor(c.cls)}
                className="supply-checkpoint"
              />
            </g>
          ))}
          {/* Leaf node extension lines */}
          {Array.from(positions.entries()).map(([nodeId, pos]) => {
            const det = viewModel.nodeDetailsById[nodeId];
            if (!det) return null;
            const hasVisibleKids = det.childIds.filter((c) => subtreeVisible(c)).length > 0;
            if (hasVisibleKids) return null;
            const lineX1 = pos.x + SVG_NODE_W + SVG_PAD;
            const lineY = pos.y + SVG_NODE_CARD_H / 2 + SVG_PAD;
            const lineX2 = lineX1 + 40;
            return (
              <path
                key={`leaf-line-${nodeId}`}
                d={`M ${lineX1} ${lineY} L ${lineX2} ${lineY}`}
                stroke="rgba(14, 90, 70, 0.25)"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="none"
              />
            );
          })}
        </svg>

        {/* GFI Anchor Card — leftmost node in every chain (styled as circular medallion) */}
        <div className="supply-node-container" style={{ left: SVG_PAD, top: gfiCardY + SVG_PAD, width: 230 }}>
          <GFIAnchorCard ingredientName={selectedRoot.ingredientName} productName={selectedRoot.productName} />
        </div>

        {/* Standard supply chain node cards */}
        {Array.from(positions.entries()).map(([nodeId, pos]) => {
          const det = viewModel.nodeDetailsById[nodeId];
          if (!det) return null;
          const hasVisibleKids = det.childIds.filter((c) => subtreeVisible(c)).length > 0;
          const isCol = collapsedNodeIds.includes(nodeId);
          return (
            <div key={`card-${nodeId}`} className="supply-node-container" style={{ left: pos.x + SVG_PAD, top: pos.y + SVG_PAD, width: SVG_NODE_W }}>
              <NodeCard
                details={det}
                isSelected={selectedNodeId === nodeId}
                isOnSelectedPath={selectedPathSet.has(nodeId)}
                isCollapsed={isCol}
                canToggle={hasVisibleKids}
                onSelect={() => setSelectedNodeId(nodeId)}
                onToggle={() => setCollapsedNodeIds((cur) => cur.includes(nodeId) ? cur.filter((id) => id !== nodeId) : [...cur, nodeId])}
                onViewDeclaration={handleViewDeclarationForm}
                onAddSibling={(node) => {
                  setAddActorTargetNode(node);
                  setAddActorMode("SIBLING");
                  setNewActorName("");
                  setNewActorType(node.actorType);
                  setNewActorCountry(node.country);
                  setNewActorMaterial(node.materialName);
                  setNewActorVolume(100);
                  setNewActorStatus("COMPLETE");
                  setIsAddActorModalOpen(true);
                }}
              />
            </div>
          );
        })}

        {/* Leaf node plus buttons for adding upstream tier actors */}
        {Array.from(positions.entries()).map(([nodeId, pos]) => {
          const det = viewModel.nodeDetailsById[nodeId];
          if (!det) return null;
          const hasVisibleKids = det.childIds.filter((c) => subtreeVisible(c)).length > 0;
          if (hasVisibleKids) return null;
          const buttonLeft = pos.x + SVG_NODE_W + SVG_PAD + 40 - 14;
          const buttonTop = pos.y + SVG_PAD + SVG_NODE_CARD_H / 2 - 14;
          return (
            <div
              key={`leaf-add-${nodeId}`}
              style={{
                position: "absolute",
                left: buttonLeft,
                top: buttonTop,
                zIndex: 10,
              }}
              className="group/btn"
            >
              <button
                type="button"
                onClick={() => {
                  setAddActorTargetNode(det.node);
                  setAddActorMode("CHILD");
                  setNewActorName("");
                  setNewActorType("FARMER");
                  setNewActorCountry("Indonesia");
                  setNewActorMaterial(det.node.materialName);
                  setNewActorVolume(100);
                  setNewActorStatus("COMPLETE");
                  setIsAddActorModalOpen(true);
                }}
                className="w-7 h-7 rounded-full bg-brand-primary text-white hover:bg-brand-primary-dark shadow-md flex items-center justify-center border border-white hover:scale-110 transition-all duration-150 cursor-pointer"
                title="Add Upstream Supplier (New Tier)"
              >
                <span className="text-base font-extrabold leading-none">+</span>
              </button>
              <span className="absolute left-1/2 -translate-x-1/2 bottom-8 bg-brand-primary text-white text-[9.5px] font-extrabold px-2 py-0.5 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-30">
                Add new tier actor
              </span>
            </div>
          );
        })}
      </div>
    );
  };


  const renderMergedTreeMap = (mode: "inline" | "fullscreen" = "inline") => (
    <div className={`traceability-map${mode === "fullscreen" ? " traceability-map--fullscreen" : ""}`}>
      {mode === "fullscreen" && (
        <div className="traceability-map__header">
          <div>
            <p className="traceability-map__eyebrow">Supply Chain Map</p>
            <h3>{selectedRoot.ingredientName}</h3>
            <span>{selectedRoot.productName} • {selectedRoot.directSupplierName}</span>
          </div>
          <div className="traceability-map__meta">
            <button
              type="button"
              className="traceability-icon-button"
              onClick={() => setIsMapFullscreen(false)}
              aria-label="Close full screen supply chain map"
            >
              <CloseGlyph />
            </button>
          </div>
        </div>
      )}

      <div className="traceability-map__legend">
        <span><em className="traceability-map__lane-dot traceability-map__lane-dot--supplier" />Direct supplier</span>
        <span><em className="traceability-map__lane-dot traceability-map__lane-dot--intermediary" />Intermediaries and mills</span>
        <span><em className="traceability-map__lane-dot traceability-map__lane-dot--producer" />Producers, estates, and farmers</span>
      </div>

      <div className={`traceability-tree${mode === "fullscreen" ? " traceability-tree--fullscreen" : ""}`}>
        {renderSVGTree(mode)}
      </div>
    </div>
  );

  return (
    <div className="traceability-studio">
      <Card className="flex flex-col gap-4 border-border-strong/70 bg-gradient-to-b from-bg-surface to-bg-surface-alt lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border-soft/80 pb-3">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-brand-primary">Ingredient roots</h2>
            <p className="text-xs text-text-secondary">Select an ingredient to view traceability posture</p>
          </div>
          <Tag tone="neutral">{viewModel.roots.length}</Tag>
        </div>
        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
          {viewModel.roots.map((root) => (
            <RootSelectorCard key={root.rootId} root={root} isSelected={root.rootId === selectedRoot.rootId} onClick={() => onSelectRoot(root.rootId)} />
          ))}
        </div>
      </Card>

      <div className="traceability-studio__content">
        {/* Merged Supply Chain Overview & Map Card */}
        <Card className="p-6 border-border-strong/70 bg-gradient-to-b from-bg-surface to-bg-surface-alt shadow-sm space-y-6">
          {/* Merged Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border-soft pb-5">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                Supply Chain Map
              </span>
              <h2 className="text-2xl font-black text-brand-primary flex items-center gap-2">
                <span className="text-3xl select-none leading-none">{getCommodityIcon(selectedRoot.ingredientName)}</span>
                {selectedRoot.ingredientName}
              </h2>
              <p className="text-xs text-text-secondary font-medium font-sans">
                {selectedRoot.productName} • {selectedRoot.directSupplierName}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Branch Completion info */}
              <div className="bg-white dark:bg-bg-surface border border-border-soft px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-2.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Branch Completion
                </span>
                <strong className="text-sm font-black text-brand-primary leading-none tracking-tight">
                  {selectedRoot.completionPercent}%
                </strong>
              </div>

              {/* Shipment impact status */}
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1.5 rounded-lg border tracking-wide select-none ${
                selectedRoot.shipmentImpact === "READY" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : 
                selectedRoot.shipmentImpact === "BLOCKED" ? "bg-state-error/10 text-state-error border-state-error/20" : 
                "bg-amber-500/10 text-amber-700 border-amber-500/20"
              }`}>
                {selectedRoot.shipmentImpact === "AT_RISK" ? "At Risk" : toSentenceCase(selectedRoot.shipmentImpact)}
              </span>

              {/* Fullscreen button */}
              <button
                type="button"
                className="traceability-icon-button"
                onClick={() => setIsMapFullscreen(true)}
                title="Open full screen supply chain map"
              >
                <FullscreenGlyph />
              </button>
            </div>
          </div>

          {/* Map Body */}
          <div>
            {renderMergedTreeMap("inline")}
          </div>
        </Card>

        {/* Chain Requests Card */}
        <div className="traceability-studio__workspace mt-6">
          <Card className="p-5 rounded-xl border border-border-soft bg-bg-surface shadow-sm space-y-4">
            <div className="traceability-studio__section-title flex justify-between items-center pb-3 border-b border-border-soft/60">
              <h2 className="text-base font-extrabold text-brand-primary uppercase tracking-wider">Chain Requests</h2>
              <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 border border-brand-primary/10 px-3 py-1 rounded-full">
                {selectedRootRequests.length} requests
              </span>
            </div>

            {emailNotice && (
              <Card variant="inset" className="border-brand-accent bg-brand-accent-soft text-xs text-brand-primary py-2 px-3">
                <p className="font-semibold">{emailNotice}</p>
              </Card>
            )}

            {selectedRootRequests.length === 0 ? (
              <p className="text-sm text-text-secondary">No multi-tier EUDR requests have been generated for this ingredient chain yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 max-h-[380px] overflow-y-auto pr-1 internal-scroll">
                {selectedRootRequests.map((request) => {
                  const node = supplyChainNodes.find((item) => item.id === request.targetNodeId);
                  const portalUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/supplier?token=${request.tokenLabel}`;
                  return (
                    <Card key={request.id} variant="inset" className="space-y-2.5 p-4 bg-bg-surface border border-border-soft/60 hover:border-border-strong/60 transition-all duration-150">
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-sm text-brand-primary font-bold">{request.tokenLabel}</strong>
                        <StatusBadge status={toStatusTone(request.status)}>{humanize(request.status)}</StatusBadge>
                      </div>
                      <p className="text-[11px] text-text-secondary font-medium leading-relaxed">
                        <span className="font-bold text-text-primary">{request.formType} Form</span> • {node ? getProductName(node.productId) : "Unknown product"} • {node?.materialName ?? "material path"} • Tier {node?.tier ?? "?"} <br />
                        <span className="text-[10px] text-text-muted">Expires: {request.expiresAt}</span>
                      </p>
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          icon={<Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                          onClick={() => {
                            navigator.clipboard.writeText(portalUrl);
                            setEmailNotice(`Link copied: ${portalUrl}`);
                            setTimeout(() => setEmailNotice(null), 4000);
                          }}
                        >
                          Copy Link
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          icon={<Send className="h-3.5 w-3.5" aria-hidden="true" />}
                          onClick={() => {
                            setEmailNotice(
                              `Simulated email sent to ${request.email || "supplier"} with EUDR portal link ${request.tokenLabel}.`,
                            );
                            setTimeout(() => setEmailNotice(null), 5000);
                          }}
                        >
                          Send Email
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
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
        <div
          className="traceability-modal-backdrop traceability-modal-backdrop--supply-chain"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsMapFullscreen(false);
          }}
        >
          <div className="traceability-modal traceability-modal--supply-chain">
            {renderMergedTreeMap("fullscreen")}
          </div>
        </div>
      )}

      <ModalShell open={isDeclarationModalOpen} onClose={closeDeclarationWorkspace} size="xl">
        <div className="flex h-[88vh] min-h-[720px] flex-col overflow-hidden rounded-[1.75rem] bg-bg-surface">
          <div className="declaration-workspace-header">
            <div className="declaration-workspace-header__top">
              <div className="declaration-workspace-header__identity">
                <p className="declaration-workspace-header__eyebrow">Declaration form</p>
                <strong>{declarationActor?.node.entityName ?? "Actor workspace"}</strong>
              </div>
              <div className="declaration-workspace-header__actions">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!declarationActor}
                  onClick={() => declarationActor && void handleCopyDeclarationLink(declarationActor)}
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy form link
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!declarationActor}
                  onClick={() => declarationActor && handleSendDeclarationEmail(declarationActor)}
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Send form
                </button>
                <button type="button" className="btn-secondary" onClick={closeDeclarationWorkspace}>
                  Close
                </button>
              </div>
            </div>
            <div className="declaration-workspace-header__notice" aria-live="polite" aria-atomic="true">
              {declarationNotice}
            </div>
          </div>
          <div className="flex-1 overflow-hidden bg-bg-canvas-subtle">
            {declarationModalToken ? (
              <iframe
                src={`/supplier?token=${encodeURIComponent(declarationModalToken)}&embed=1`}
                title="Declaration form workspace"
                className="h-full w-full border-0 bg-white"
              />
            ) : (
              <div className="p-6 text-sm text-text-secondary">Loading declaration form...</div>
            )}
          </div>
        </div>
      </ModalShell>

      <ModalShell open={isAddActorModalOpen} onClose={() => setIsAddActorModalOpen(false)} size="sm">
        <ModalHeader
          title={addActorMode === "SIBLING" ? "Add Sibling Supply Chain Actor" : "Add Upstream Supplier Node"}
          description={
            addActorMode === "SIBLING"
              ? `Create another actor in the same tier (shares buyer: ${
                  addActorTargetNode
                    ? viewModel.nodeDetailsById[addActorTargetNode.parentNodeId || ""]?.node?.entityName || "EU Operator"
                    : "EU Operator"
                })`
              : `Create a supplier that feeds directly into: ${addActorTargetNode?.entityName}`
          }
          onClose={() => setIsAddActorModalOpen(false)}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newActorName.trim()) return;

            const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            const generatedNodeId = `node-${newActorType.toLowerCase()}-${suffix}`;

            const parentId = addActorMode === "SIBLING"
              ? (addActorTargetNode?.parentNodeId ?? null)
              : (addActorTargetNode?.id ?? null);

            const targetTier = addActorTargetNode?.tier ?? 1;
            const nodeTier = addActorMode === "SIBLING" ? targetTier : targetTier + 1;

            const newNode: SupplyChainNode = {
              id: generatedNodeId,
              ingredientId: selectedRoot.ingredientId,
              productId: selectedRoot.productId,
              supplierId: selectedRoot.supplierId,
              parentNodeId: parentId,
              tier: nodeTier,
              actorType: newActorType,
              entityName: newActorName.trim(),
              country: newActorCountry,
              commodity: selectedRoot.commodity,
              materialName: newActorMaterial.trim() || selectedRoot.ingredientName,
              volumeContributionPercent: Number(newActorVolume) || 100,
              status: newActorStatus,
            };

            addSupplyChainNode(newNode);

            if (parentId) {
              addSupplyChainEdge({
                id: `edge-${generatedNodeId}-${parentId}`,
                fromNodeId: generatedNodeId,
                toNodeId: parentId,
                relationshipType: newActorType === "FARMER" || newActorType === "ESTATE" ? "FARM_SOURCE_FOR" : "SUPPLIES_TO",
                materialName: newActorMaterial.trim() || selectedRoot.ingredientName,
                volumePercent: Number(newActorVolume) || 100,
                proofDocumentIds: [],
                status: newActorStatus === "COMPLETE" ? "SUPPORTED" : "PENDING",
              });
            }

            setIsAddActorModalOpen(false);
          }}
        >
          <ModalBody className="space-y-4">
            <FormField label="Entity Name" required>
              <Input
                type="text"
                required
                value={newActorName}
                onChange={(e) => setNewActorName(e.target.value)}
                placeholder="e.g. Borneo Milling Group"
              />
            </FormField>

            <FormGrid columns={2}>
              <FormField label="Actor Type / Role" required>
                <Select
                  value={newActorType}
                  onChange={(e) => setNewActorType(e.target.value as any)}
                >
                  <option value="FARMER">Farmer</option>
                  <option value="ESTATE">Estate</option>
                  <option value="COOPERATIVE">Cooperative</option>
                  <option value="MILL">Mill</option>
                  <option value="PROCESSOR">Processor</option>
                  <option value="TRADER">Trader</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                  <option value="EXPORTER">Exporter</option>
                  <option value="INTERMEDIARY">Intermediary</option>
                </Select>
              </FormField>

              <FormField label="Country of Operation" required>
                <Input
                  type="text"
                  list="countries-datalist"
                  value={newActorCountry}
                  onChange={(e) => setNewActorCountry(e.target.value)}
                  placeholder="Select or type country..."
                  required
                />
                <datalist id="countries-datalist">
                  {ALL_COUNTRIES.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
              </FormField>
            </FormGrid>

            <FormGrid columns={2}>
              <FormField label="Material Sourced">
                <Input
                  type="text"
                  value={newActorMaterial}
                  onChange={(e) => setNewActorMaterial(e.target.value)}
                  placeholder="e.g. Cocoa Beans"
                />
              </FormField>

              <FormField label="Volume Contribution %" required>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={newActorVolume}
                  onChange={(e) => setNewActorVolume(Number(e.target.value))}
                />
              </FormField>
            </FormGrid>
          </ModalBody>
          <ModalFooter>
            <FormActions submitLabel="Add Actor" onCancel={() => setIsAddActorModalOpen(false)} />
          </ModalFooter>
        </form>
      </ModalShell>

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
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Per-ingredient readiness, branch gaps, and the latest upstream declaration activity for this supplier.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
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
            <div
              key={root.rootId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border-soft bg-bg-surface shadow-sm hover:shadow-card-hover transition-all duration-200"
            >
              {/* Left Side: Ingredient Details & Status Badge */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm font-bold text-brand-primary">{root.ingredientName}</strong>
                  <span className="text-xs text-text-muted font-normal">({root.productName})</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 border ${
                    root.shipmentImpact === "READY"
                      ? "bg-state-success/10 text-state-success border-state-success/20"
                      : root.shipmentImpact === "BLOCKED"
                      ? "bg-state-error/10 text-state-error border-state-error/20"
                      : "bg-state-warning/10 text-state-warning border-state-warning/20"
                  }`}>
                    {root.shipmentImpact === "READY" ? "Ready" : root.shipmentImpact === "BLOCKED" ? "Blocked" : "Review"}
                  </span>
                </div>

                {/* Middle Side: Micro stats */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></span>
                    {completedFarmers}/{root.leafNodeIds.length} producers complete
                  </span>
                  <span className="text-text-muted/40">|</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${root.blockingNodeIds.length > 0 ? "bg-state-error" : "bg-state-success"}`}></span>
                    {root.blockingNodeIds.length} branch gaps
                  </span>
                  {latestRequest && (
                    <>
                      <span className="text-text-muted/40">|</span>
                      <span className="text-[11px] text-text-muted truncate">
                        Latest: <span className="font-mono font-semibold text-text-primary">{latestRequest.tokenLabel}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Side: Action Button */}
              <div className="shrink-0 flex items-center justify-end">
                <Link
                  href={buildTraceabilityLink(root) as any}
                  className="inline-flex items-center justify-center rounded bg-brand-accent hover:bg-brand-accent-hover text-brand-primary text-xs font-semibold py-1.5 px-3.5 transition-colors duration-150 shadow-sm"
                >
                  Open Studio
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
