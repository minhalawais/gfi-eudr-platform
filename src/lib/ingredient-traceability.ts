import {
  ConsignmentRecord,
  EudrEvidenceAttachment,
  EudrFormRequest,
  FarmerDeclarationSubmission,
  IntermediaryDeclarationSubmission,
  ProductRecord,
  SupplyChainNode,
} from "@/lib/gfi-dummy-data";

export type ShipmentImpact = "READY" | "AT_RISK" | "BLOCKED";

export interface EvidenceSummary {
  total: number;
  attached: number;
  missing: number;
  requested: number;
  plotCount: number;
  geolocationReady: boolean | null;
  blockingGeoCount: number;
  missingGeoCount: number;
  legalEvidenceCount: number;
  sustainabilityEvidenceCount: number;
  deforestationReadiness: "READY" | "GAPS" | "NOT_APPLICABLE";
  stateLabel: string;
}

export interface BranchTimelineEvent {
  label: string;
  date: string;
  tone: "neutral" | "success" | "warning" | "danger";
}

export interface TraceabilityNodeDetails {
  node: SupplyChainNode;
  request: EudrFormRequest | null;
  intermediarySubmission: IntermediaryDeclarationSubmission | null;
  farmerSubmission: FarmerDeclarationSubmission | null;
  evidence: EudrEvidenceAttachment[];
  evidenceSummary: EvidenceSummary;
  pathNodeIds: string[];
  ancestorIds: string[];
  descendantIds: string[];
  childIds: string[];
  formType: "INTERMEDIARY" | "FARMER" | "UNASSIGNED";
  formPartyLabel: string;
  actorDisplayLabel: string;
  nextAction: string;
  downstreamImpact: string;
  timeline: BranchTimelineEvent[];
}

export interface IngredientTraceabilityBranchGroup {
  id: string;
  rootId: string;
  leafNodeId: string;
  label: string;
  pathNodeIds: string[];
  directSupplierNodeId: string | null;
  intermediaryNodeIds: string[];
  producerNodeIds: string[];
  isIncomplete: boolean;
  gapMessages: string[];
}

export interface IngredientTraceabilityRootSummary {
  rootId: string;
  productId: string;
  ingredientId: string;
  supplierId: string;
  productName: string;
  ingredientName: string;
  directSupplierName: string;
  commodity: SupplyChainNode["commodity"];
  status: SupplyChainNode["status"];
  totalActors: number;
  farmerCount: number;
  branchCount: number;
  incompleteLeafCount: number;
  completionPercent: number;
  shipmentImpact: ShipmentImpact;
  latestActivityDate: string | null;
  label: string;
  nodeIds: string[];
  leafNodeIds: string[];
  blockingNodeIds: string[];
  branchGroups: IngredientTraceabilityBranchGroup[];
}

export interface IngredientTraceabilityViewModel {
  roots: IngredientTraceabilityRootSummary[];
  rootById: Record<string, IngredientTraceabilityRootSummary>;
  nodeDetailsById: Record<string, TraceabilityNodeDetails>;
  tierGroups: Record<string, SupplyChainNode[]>;
  branchGroups: IngredientTraceabilityBranchGroup[];
  leafNodes: SupplyChainNode[];
}

const PRODUCER_ACTOR_TYPES = new Set<SupplyChainNode["actorType"]>(["FARMER", "COOPERATIVE", "ESTATE"]);
const INCOMPLETE_STATUSES = new Set<SupplyChainNode["status"]>([
  "NOT_REQUESTED",
  "REQUESTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "GAPS_FOUND",
  "BLOCKED",
]);

function buildIndex<T extends { id: string }>(records: T[]): Record<string, T> {
  return records.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

function toActorDisplayLabel(actorType: SupplyChainNode["actorType"]): string {
  return actorType.replace(/_/g, " ").replace(/\b\w/g, (part) => part.toUpperCase());
}

function toFormPartyLabel(actorType: SupplyChainNode["actorType"], request?: EudrFormRequest | null): string {
  if (request?.formType === "FARMER" || PRODUCER_ACTOR_TYPES.has(actorType)) {
    return "Farmer form";
  }
  if (request?.formType === "INTERMEDIARY") {
    return "Intermediary form";
  }
  return PRODUCER_ACTOR_TYPES.has(actorType) ? "Farmer form" : "Intermediary form";
}

function getChildrenMap(nodes: SupplyChainNode[]) {
  return nodes.reduce<Record<string, SupplyChainNode[]>>((acc, node) => {
    const key = node.parentNodeId ?? "__root__";
    acc[key] ??= [];
    acc[key].push(node);
    return acc;
  }, {});
}

function getDescendantIds(nodeId: string, childrenMap: Record<string, SupplyChainNode[]>): string[] {
  const descendants: string[] = [];
  const visit = (currentId: string) => {
    const children = childrenMap[currentId] ?? [];
    children.forEach((child) => {
      descendants.push(child.id);
      visit(child.id);
    });
  };
  visit(nodeId);
  return descendants;
}

function getPathToRoot(nodeId: string, nodeById: Record<string, SupplyChainNode>): string[] {
  const path: string[] = [];
  let current: SupplyChainNode | undefined = nodeById[nodeId];
  while (current) {
    path.unshift(current.id);
    current = current.parentNodeId ? nodeById[current.parentNodeId] : undefined;
  }
  return path;
}

function compareIsoDate(a: string | null, b: string | null): number {
  return (a ?? "").localeCompare(b ?? "");
}

function maxIsoDate(values: Array<string | null | undefined>): string | null {
  const valid = values.filter((value): value is string => Boolean(value)).sort(compareIsoDate);
  return valid.at(-1) ?? null;
}

function buildEvidenceSummary(
  node: SupplyChainNode,
  evidence: EudrEvidenceAttachment[],
  farmerSubmission: FarmerDeclarationSubmission | null,
): EvidenceSummary {
  const attached = evidence.filter((item) => item.status === "ATTACHED").length;
  const missing = evidence.filter((item) => item.status === "MISSING").length;
  const requested = evidence.filter((item) => item.status === "REQUESTED").length;
  const legalEvidenceCount = evidence.filter((item) =>
    item.documentRole === "LAND_RIGHTS_EVIDENCE" || item.documentRole === "LEGAL_LICENSE" || item.documentRole === "LABOUR_RIGHTS_EVIDENCE",
  ).length;
  const sustainabilityEvidenceCount = evidence.filter((item) =>
    item.documentRole === "SUSTAINABILITY_CERTIFICATE" || item.documentRole === "GEOLOCATION_FILE",
  ).length;

  if (!farmerSubmission) {
    return {
      total: evidence.length,
      attached,
      missing,
      requested,
      plotCount: 0,
      geolocationReady: null,
      blockingGeoCount: 0,
      missingGeoCount: 0,
      legalEvidenceCount,
      sustainabilityEvidenceCount,
      deforestationReadiness: PRODUCER_ACTOR_TYPES.has(node.actorType) ? "GAPS" : "NOT_APPLICABLE",
      stateLabel: attached > 0 ? "Evidence attached" : requested > 0 ? "Awaiting evidence" : "No evidence attached",
    };
  }

  const blockingGeoCount = farmerSubmission.plotRows.filter(
    (plot) => plot.areaHa > 4 && plot.coordinateType !== "POLYGON" && plot.coordinateType !== "FILE",
  ).length;
  const missingGeoCount = farmerSubmission.plotRows.filter((plot) => !plot.latitudes && !plot.fileName).length;
  const geolocationReady = blockingGeoCount === 0 && missingGeoCount === 0;

  return {
    total: evidence.length,
    attached,
    missing,
    requested,
    plotCount: farmerSubmission.plotRows.length,
    geolocationReady,
    blockingGeoCount,
    missingGeoCount,
    legalEvidenceCount,
    sustainabilityEvidenceCount,
    deforestationReadiness: geolocationReady ? "READY" : "GAPS",
    stateLabel: geolocationReady ? "Geolocation valid" : "Geolocation gaps",
  };
}

function buildTimeline(
  node: SupplyChainNode,
  request: EudrFormRequest | null,
  intermediarySubmission: IntermediaryDeclarationSubmission | null,
  farmerSubmission: FarmerDeclarationSubmission | null,
  evidenceSummary: EvidenceSummary,
): BranchTimelineEvent[] {
  const timeline: BranchTimelineEvent[] = [];

  if (request) {
    timeline.push({
      label: `Request sent (${request.formType.toLowerCase()})`,
      date: request.requestedAt,
      tone: "neutral",
    });
  }

  if (intermediarySubmission) {
    timeline.push({
      label: "Intermediary declaration submitted",
      date: intermediarySubmission.submittedAt,
      tone: "warning",
    });
  }

  if (farmerSubmission) {
    timeline.push({
      label: "Farmer declaration submitted",
      date: farmerSubmission.submittedAt,
      tone: evidenceSummary.geolocationReady ? "success" : "warning",
    });
  }

  if (evidenceSummary.attached > 0) {
    timeline.push({
      label: `${evidenceSummary.attached} evidence attachment(s) available`,
      date: farmerSubmission?.submittedAt ?? intermediarySubmission?.submittedAt ?? request?.requestedAt ?? "Current",
      tone: "success",
    });
  }

  if (evidenceSummary.missing > 0) {
    timeline.push({
      label: `${evidenceSummary.missing} evidence gap(s) remain open`,
      date: farmerSubmission?.submittedAt ?? intermediarySubmission?.submittedAt ?? request?.requestedAt ?? "Current",
      tone: "danger",
    });
  }

  if (node.status === "COMPLETE") {
    timeline.push({
      label: "Completion propagated upstream",
      date: farmerSubmission?.submittedAt ?? intermediarySubmission?.submittedAt ?? request?.requestedAt ?? "Current",
      tone: "success",
    });
  }

  return timeline.sort((left, right) => compareIsoDate(left.date, right.date));
}

function buildNextAction(
  node: SupplyChainNode,
  request: EudrFormRequest | null,
  evidenceSummary: EvidenceSummary,
): string {
  if (!request) {
    return `Issue a ${PRODUCER_ACTOR_TYPES.has(node.actorType) ? "farmer" : "intermediary"} declaration request.`;
  }
  if (node.status === "COMPLETE") {
    return "No immediate action. This branch currently satisfies the traceability workflow.";
  }
  if (PRODUCER_ACTOR_TYPES.has(node.actorType) && evidenceSummary.geolocationReady === false) {
    return "Collect valid polygon or file-based geolocation and close the farmer evidence gap.";
  }
  if (evidenceSummary.missing > 0) {
    return "Attach the missing supporting evidence before the branch can be treated as complete.";
  }
  if (request.status === "PENDING_RESPONSE" || request.status === "IN_PROGRESS") {
    return `Await response for ${request.tokenLabel} and follow up with ${node.entityName}.`;
  }
  return `Resolve outstanding review items for ${node.entityName}.`;
}

function buildDownstreamImpact(node: SupplyChainNode, productName: string, ingredientName: string): string {
  if (node.status === "COMPLETE") {
    return `${ingredientName} remains clear at this point in the chain for ${productName}.`;
  }
  return `${node.entityName} is still blocking upstream certainty for ${ingredientName} in ${productName}.`;
}

function buildGapMessages(
  branchNodes: SupplyChainNode[],
  nodeDetailsById: Record<string, TraceabilityNodeDetails>,
): string[] {
  const messages: string[] = [];

  branchNodes.forEach((node) => {
    const details = nodeDetailsById[node.id];
    if (node.status === "BLOCKED") {
      messages.push(`${node.entityName} is blocked and prevents ingredient readiness.`);
    } else if (node.status === "GAPS_FOUND") {
      messages.push(`${node.entityName} has unresolved declaration or evidence gaps.`);
    } else if (node.status === "REQUESTED" || node.status === "IN_PROGRESS" || node.status === "SUBMITTED") {
      messages.push(`Awaiting a finished ${details.formPartyLabel.toLowerCase()} response from ${node.entityName}.`);
    }

    if (details.evidenceSummary.geolocationReady === false) {
      messages.push(
        `${node.entityName} still has ${details.evidenceSummary.blockingGeoCount + details.evidenceSummary.missingGeoCount} geolocation issue(s).`,
      );
    }

    if (details.evidenceSummary.missing > 0) {
      messages.push(`${node.entityName} is missing ${details.evidenceSummary.missing} supporting evidence attachment(s).`);
    }
  });

  return [...new Set(messages)];
}

function buildShipmentImpact(nodes: SupplyChainNode[]): ShipmentImpact {
  if (nodes.some((node) => node.status === "BLOCKED" || node.status === "GAPS_FOUND")) {
    return "BLOCKED";
  }
  if (nodes.some((node) => node.status !== "COMPLETE")) {
    return "AT_RISK";
  }
  return "READY";
}

export function buildIngredientTraceabilityViewModel(input: {
  products: ProductRecord[];
  consignments: ConsignmentRecord[];
  supplyChainNodes: SupplyChainNode[];
  eudrFormRequests: EudrFormRequest[];
  intermediaryDeclarationSubmissions: IntermediaryDeclarationSubmission[];
  farmerDeclarationSubmissions: FarmerDeclarationSubmission[];
  eudrEvidenceAttachments: EudrEvidenceAttachment[];
}): IngredientTraceabilityViewModel {
  const {
    products,
    consignments,
    supplyChainNodes,
    eudrFormRequests,
    intermediaryDeclarationSubmissions,
    farmerDeclarationSubmissions,
    eudrEvidenceAttachments,
  } = input;

  const productById = buildIndex(products);
  const nodeById = buildIndex(supplyChainNodes);
  const childrenMap = getChildrenMap(supplyChainNodes);
  const leafNodes = supplyChainNodes.filter((node) => (childrenMap[node.id] ?? []).length === 0);

  const requestsByNodeId = eudrFormRequests.reduce<Record<string, EudrFormRequest[]>>((acc, request) => {
    acc[request.targetNodeId] ??= [];
    acc[request.targetNodeId].push(request);
    return acc;
  }, {});
  const evidenceByNodeId = eudrEvidenceAttachments.reduce<Record<string, EudrEvidenceAttachment[]>>((acc, item) => {
    acc[item.nodeId] ??= [];
    acc[item.nodeId].push(item);
    return acc;
  }, {});
  const intermediarySubmissionByNodeId = intermediaryDeclarationSubmissions.reduce<Record<string, IntermediaryDeclarationSubmission>>(
    (acc, submission) => {
      acc[submission.nodeId] = submission;
      return acc;
    },
    {},
  );
  const farmerSubmissionByNodeId = farmerDeclarationSubmissions.reduce<Record<string, FarmerDeclarationSubmission>>((acc, submission) => {
    acc[submission.nodeId] = submission;
    return acc;
  }, {});

  const rootIdCache: Record<string, string> = {};
  const resolveRootId = (nodeId: string): string => {
    if (rootIdCache[nodeId]) {
      return rootIdCache[nodeId];
    }
    const node = nodeById[nodeId];
    if (!node) {
      return "";
    }
    if (!node.parentNodeId) {
      rootIdCache[nodeId] = node.id;
      return node.id;
    }
    const rootId = resolveRootId(node.parentNodeId);
    rootIdCache[nodeId] = rootId;
    return rootId;
  };

  const nodeDetailsById = supplyChainNodes.reduce<Record<string, TraceabilityNodeDetails>>((acc, node) => {
    const requests = (requestsByNodeId[node.id] ?? []).slice().sort((left, right) => compareIsoDate(left.requestedAt, right.requestedAt));
    const request = requests.at(-1) ?? null;
    const intermediarySubmission = intermediarySubmissionByNodeId[node.id] ?? null;
    const farmerSubmission = farmerSubmissionByNodeId[node.id] ?? null;
    const evidence = evidenceByNodeId[node.id] ?? [];
    const product = productById[node.productId];
    const ingredient = product?.ingredients.find((item) => item.id === node.ingredientId);
    const evidenceSummary = buildEvidenceSummary(node, evidence, farmerSubmission);
    const pathNodeIds = getPathToRoot(node.id, nodeById);
    const childIds = (childrenMap[node.id] ?? []).map((child) => child.id);
    const descendantIds = getDescendantIds(node.id, childrenMap);
    const actorDisplayLabel = toActorDisplayLabel(node.actorType);
    const formPartyLabel = toFormPartyLabel(node.actorType, request);

    acc[node.id] = {
      node,
      request,
      intermediarySubmission,
      farmerSubmission,
      evidence,
      evidenceSummary,
      pathNodeIds,
      ancestorIds: pathNodeIds.slice(0, -1),
      descendantIds,
      childIds,
      formType: request?.formType ?? (PRODUCER_ACTOR_TYPES.has(node.actorType) ? "FARMER" : "INTERMEDIARY"),
      formPartyLabel,
      actorDisplayLabel,
      nextAction: buildNextAction(node, request, evidenceSummary),
      downstreamImpact: buildDownstreamImpact(node, product?.name ?? "selected product", ingredient?.name ?? node.materialName),
      timeline: buildTimeline(node, request, intermediarySubmission, farmerSubmission, evidenceSummary),
    };
    return acc;
  }, {});

  const roots = supplyChainNodes
    .filter((node) => node.parentNodeId === null)
    .map<IngredientTraceabilityRootSummary>((rootNode) => {
      const product = productById[rootNode.productId];
      const ingredient = product?.ingredients.find((item) => item.id === rootNode.ingredientId);
      const nodesForRoot = supplyChainNodes.filter((node) => resolveRootId(node.id) === rootNode.id);
      const leafNodesForRoot = leafNodes.filter((node) => resolveRootId(node.id) === rootNode.id);
      const branchGroups = leafNodesForRoot.map<IngredientTraceabilityBranchGroup>((leafNode, index) => {
        const pathNodeIds = getPathToRoot(leafNode.id, nodeById).filter((nodeId) => resolveRootId(nodeId) === rootNode.id);
        const branchNodes = pathNodeIds.map((nodeId) => nodeById[nodeId]).filter(Boolean);
        const intermediaryNodeIds = branchNodes
          .filter((node) => node.id !== rootNode.id && !PRODUCER_ACTOR_TYPES.has(node.actorType))
          .map((node) => node.id);
        const producerNodeIds = branchNodes
          .filter((node) => node.id !== rootNode.id && PRODUCER_ACTOR_TYPES.has(node.actorType))
          .map((node) => node.id);
        const volumeLabelNode = branchNodes.find((node) => node.id !== rootNode.id && node.volumeContributionPercent !== 100) ?? leafNode;
        const gapMessages = buildGapMessages(branchNodes, nodeDetailsById);

        return {
          id: `${rootNode.id}-branch-${leafNode.id}`,
          rootId: rootNode.id,
          leafNodeId: leafNode.id,
          label: volumeLabelNode ? `${Math.round(volumeLabelNode.volumeContributionPercent)}% branch` : `Branch ${index + 1}`,
          pathNodeIds,
          directSupplierNodeId: rootNode.id,
          intermediaryNodeIds,
          producerNodeIds,
          isIncomplete: branchNodes.some((node) => INCOMPLETE_STATUSES.has(node.status)),
          gapMessages,
        };
      });
      const latestActivityDate = maxIsoDate(
        nodesForRoot.flatMap((node) => {
          const details = nodeDetailsById[node.id];
          return [
            details.request?.requestedAt,
            details.intermediarySubmission?.submittedAt,
            details.farmerSubmission?.submittedAt,
          ];
        }),
      );

      return {
        rootId: rootNode.id,
        productId: rootNode.productId,
        ingredientId: rootNode.ingredientId,
        supplierId: rootNode.supplierId,
        productName: product?.name ?? rootNode.productId,
        ingredientName: ingredient?.name ?? rootNode.materialName,
        directSupplierName: rootNode.entityName,
        commodity: rootNode.commodity,
        status: rootNode.status,
        totalActors: nodesForRoot.length,
        farmerCount: nodesForRoot.filter((node) => PRODUCER_ACTOR_TYPES.has(node.actorType)).length,
        branchCount: branchGroups.length,
        incompleteLeafCount: leafNodesForRoot.filter((node) => node.status !== "COMPLETE").length,
        completionPercent: leafNodesForRoot.length === 0 ? 0 : Math.round((leafNodesForRoot.filter((node) => node.status === "COMPLETE").length / leafNodesForRoot.length) * 100),
        shipmentImpact: buildShipmentImpact(nodesForRoot),
        latestActivityDate,
        label: `${ingredient?.name ?? rootNode.materialName} • ${product?.name ?? rootNode.productId} • ${rootNode.entityName}`,
        nodeIds: nodesForRoot.map((node) => node.id),
        leafNodeIds: leafNodesForRoot.map((node) => node.id),
        blockingNodeIds: nodesForRoot.filter((node) => node.status === "BLOCKED" || node.status === "GAPS_FOUND").map((node) => node.id),
        branchGroups,
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));

  const rootById = roots.reduce<Record<string, IngredientTraceabilityRootSummary>>((acc, root) => {
    acc[root.rootId] = root;
    return acc;
  }, {});

  const tierGroups = supplyChainNodes.reduce<Record<string, SupplyChainNode[]>>((acc, node) => {
    const key = `tier-${node.tier}`;
    acc[key] ??= [];
    acc[key].push(node);
    return acc;
  }, {});

  const branchGroups = roots.flatMap((root) => root.branchGroups);

  void consignments;

  return {
    roots,
    rootById,
    nodeDetailsById,
    tierGroups,
    branchGroups,
    leafNodes,
  };
}
