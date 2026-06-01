"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  getScenarioData,
  agents as staticAgents,
  SupplierRecord,
  ProductRecord,
  IngredientRecord,
  ConsignmentRecord,
  AgentProfile,
  DocumentRecord,
  ConcernRecord,
  SupplyChainNode,
  EudrFormRequest,
  SupplyChainEdge,
  IntermediaryDeclarationSubmission,
  FarmerDeclarationSubmission,
  EudrEvidenceAttachment,
  PlotRecord,
  DeforestationCase,
} from "@/lib/gfi-dummy-data"

export type UserRole = 'TENANT_ADMIN' | 'COMPLIANCE_OFFICER' | 'AUDITOR' | 'EXPORT_MANAGER' | 'SUPPLIER' | 'PUBLIC'

export interface UserSession {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    organizationId: string
  } | null
}

export interface ERPReceipt {
  id: string
  lotNumber: string
  supplierName: string
  commodity: "COCOA" | "PALM" | "SUGAR"
  quantity: string
  date: string
  hsCode: string
  cocType: string
  isHsMissing: boolean
  isCocMissing: boolean
  status: "PENDING_ENRICHMENT" | "ENRICHED"
}

const DEFAULT_RECEIPTS: ERPReceipt[] = [
  {
    id: "rcpt-001",
    lotNumber: "LOT-COCOA-JB-901",
    supplierName: "JB Cocoa SDN BHD",
    commodity: "COCOA",
    quantity: "24.5 MT",
    date: "2026-05-18",
    hsCode: "",
    cocType: "",
    isHsMissing: true,
    isCocMissing: true,
    status: "PENDING_ENRICHMENT",
  },
  {
    id: "rcpt-002",
    lotNumber: "LOT-PALM-CG-481",
    supplierName: "Cargill Palm Products SDN BHD",
    commodity: "PALM",
    quantity: "48.0 MT",
    date: "2026-05-20",
    hsCode: "",
    cocType: "",
    isHsMissing: true,
    isCocMissing: true,
    status: "PENDING_ENRICHMENT",
  },
  {
    id: "rcpt-003",
    lotNumber: "LOT-COCOA-IC-202",
    supplierName: "Indococoa",
    commodity: "COCOA",
    quantity: "12.0 MT",
    date: "2026-05-21",
    hsCode: "1805.00",
    cocType: "",
    isHsMissing: false,
    isCocMissing: true,
    status: "PENDING_ENRICHMENT",
  },
  {
    id: "rcpt-004",
    lotNumber: "LOT-SUGAR-LOC-77",
    supplierName: "Local Sugar Ltd",
    commodity: "SUGAR",
    quantity: "100.0 MT",
    date: "2026-05-22",
    hsCode: "1701.99",
    cocType: "Identity Preserved",
    isHsMissing: false,
    isCocMissing: false,
    status: "ENRICHED",
  },
]

interface AuthContextType {
  session: UserSession | null
  setRole: (role: UserRole) => void
  scenarioId: string
  setScenarioId: (id: string) => void
  
  // Data lists (merged static baseline + custom overrides)
  suppliers: SupplierRecord[]
  products: ProductRecord[]
  consignments: ConsignmentRecord[]
  agents: AgentProfile[]
  documents: DocumentRecord[]
  concerns: ConcernRecord[]
  receipts: ERPReceipt[]
  supplyChainNodes: SupplyChainNode[]
  eudrFormRequests: EudrFormRequest[]
  supplyChainEdges: SupplyChainEdge[]
  intermediaryDeclarationSubmissions: IntermediaryDeclarationSubmission[]
  farmerDeclarationSubmissions: FarmerDeclarationSubmission[]
  eudrEvidenceAttachments: EudrEvidenceAttachment[]
  plots: PlotRecord[]
  deforestationCases: DeforestationCase[]
  
  // CRUD Actions
  addSupplier: (record: SupplierRecord) => void
  editSupplier: (record: SupplierRecord) => void
  addProduct: (record: ProductRecord) => void
  editProduct: (record: ProductRecord) => void
  addConsignment: (record: ConsignmentRecord) => void
  editConsignment: (record: ConsignmentRecord) => void
  addAgent: (record: AgentProfile) => void
  editAgent: (record: AgentProfile) => void
  addDocument: (record: DocumentRecord) => void
  editDocument: (record: DocumentRecord) => void
  addConcern: (record: ConcernRecord) => void
  editConcern: (record: ConcernRecord) => void
  addReceipt: (record: ERPReceipt) => void
  editReceipt: (record: ERPReceipt) => void
  addSupplyChainNode: (record: SupplyChainNode) => void
  editSupplyChainNode: (record: SupplyChainNode) => void
  addEudrFormRequest: (record: EudrFormRequest) => void
  editEudrFormRequest: (record: EudrFormRequest) => void
  addSupplyChainEdge: (record: SupplyChainEdge) => void
  addIntermediaryDeclarationSubmission: (record: IntermediaryDeclarationSubmission) => void
  addFarmerDeclarationSubmission: (record: FarmerDeclarationSubmission) => void
  addEudrEvidenceAttachment: (record: EudrEvidenceAttachment) => void
  editPlot: (record: PlotRecord) => void
  editDeforestationCase: (record: DeforestationCase) => void
  generateEudrFormRequest: (input: {
    supplierId: string
    supplierName: string
    productId: string
    ingredientId: string
    commodity: "COCOA" | "PALM" | "COFFEE" | "SOYA" | "RUBBER" | "WOOD" | "CATTLE" | "NONE"
    materialName: string
    formType: "INTERMEDIARY" | "FARMER"
    parentNodeId?: string | null
    parentRequestId?: string | null
    email?: string
    entityName?: string
    country?: string
    actorType?: SupplyChainNode["actorType"]
    volumeContributionPercent?: number
  }) => EudrFormRequest
  propagateChainCompletion: (completedNodeId: string) => void
  updateIngredientChainStatus: (productId: string, ingredientId: string, status: IngredientRecord["supplyChainStatus"]) => void
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  setRole: () => {},
  scenarioId: 'current_gfi_reality',
  setScenarioId: () => {},
  
  suppliers: [],
  products: [],
  consignments: [],
  agents: [],
  documents: [],
  concerns: [],
  receipts: [],
  supplyChainNodes: [],
  eudrFormRequests: [],
  supplyChainEdges: [],
  intermediaryDeclarationSubmissions: [],
  farmerDeclarationSubmissions: [],
  eudrEvidenceAttachments: [],
  plots: [],
  deforestationCases: [],
  
  addSupplier: () => {},
  editSupplier: () => {},
  addProduct: () => {},
  editProduct: () => {},
  addConsignment: () => {},
  editConsignment: () => {},
  addAgent: () => {},
  editAgent: () => {},
  addDocument: () => {},
  editDocument: () => {},
  addConcern: () => {},
  editConcern: () => {},
  addReceipt: () => {},
  editReceipt: () => {},
  addSupplyChainNode: () => {},
  editSupplyChainNode: () => {},
  addEudrFormRequest: () => {},
  editEudrFormRequest: () => {},
  addSupplyChainEdge: () => {},
  addIntermediaryDeclarationSubmission: () => {},
  addFarmerDeclarationSubmission: () => {},
  addEudrEvidenceAttachment: () => {},
  editPlot: () => {},
  editDeforestationCase: () => {},
  generateEudrFormRequest: () => ({
    id: "",
    tokenLabel: "",
    targetSupplierId: "",
    targetNodeId: "",
    formType: "INTERMEDIARY",
    requestedBy: "",
    requestedAt: "",
    expiresAt: "",
    status: "PENDING_RESPONSE",
    email: "",
    parentRequestId: null,
  }),
  propagateChainCompletion: () => {},
  updateIngredientChainStatus: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('COMPLIANCE_OFFICER')
  const [orgId] = useState('46147125-cdab-459e-a2c2-889b035c86c0')
  const [scenarioId, setScenarioIdState] = useState<string>('current_gfi_reality')

  // Custom client override states
  const [customSuppliers, setCustomSuppliers] = useState<SupplierRecord[]>([])
  const [customProducts, setCustomProducts] = useState<ProductRecord[]>([])
  const [customConsignments, setCustomConsignments] = useState<ConsignmentRecord[]>([])
  const [customAgents, setCustomAgents] = useState<AgentProfile[]>([])
  const [customDocuments, setCustomDocuments] = useState<DocumentRecord[]>([])
  const [customConcerns, setCustomConcerns] = useState<ConcernRecord[]>([])
  const [customReceipts, setCustomReceipts] = useState<ERPReceipt[]>([])
  const [customSupplyChainNodes, setCustomSupplyChainNodes] = useState<SupplyChainNode[]>([])
  const [customEudrFormRequests, setCustomEudrFormRequests] = useState<EudrFormRequest[]>([])
  const [customSupplyChainEdges, setCustomSupplyChainEdges] = useState<SupplyChainEdge[]>([])
  const [customIntermediarySubmissions, setCustomIntermediarySubmissions] = useState<IntermediaryDeclarationSubmission[]>([])
  const [customFarmerSubmissions, setCustomFarmerSubmissions] = useState<FarmerDeclarationSubmission[]>([])
  const [customEudrEvidenceAttachments, setCustomEudrEvidenceAttachments] = useState<EudrEvidenceAttachment[]>([])
  const [customPlots, setCustomPlots] = useState<PlotRecord[]>([])
  const [customDeforestationCases, setCustomDeforestationCases] = useState<DeforestationCase[]>([])

  // Initial Scenario Sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gfi_eudr_scenario')
      if (saved) {
        setScenarioIdState(saved)
      }
    }
  }, [])

  // Sync Local overrides whenever ScenarioId changes (Hydration Safe)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem(`gfi_custom_suppliers_${scenarioId}`)
      setCustomSuppliers(s ? JSON.parse(s) : [])

      const p = localStorage.getItem(`gfi_custom_products_${scenarioId}`)
      setCustomProducts(p ? JSON.parse(p) : [])

      const c = localStorage.getItem(`gfi_custom_consignments_${scenarioId}`)
      setCustomConsignments(c ? JSON.parse(c) : [])

      const a = localStorage.getItem(`gfi_custom_agents_${scenarioId}`)
      setCustomAgents(a ? JSON.parse(a) : [])

      const d = localStorage.getItem(`gfi_custom_documents_${scenarioId}`)
      setCustomDocuments(d ? JSON.parse(d) : [])

      const co = localStorage.getItem(`gfi_custom_concerns_${scenarioId}`)
      setCustomConcerns(co ? JSON.parse(co) : [])

      const r = localStorage.getItem(`gfi_custom_receipts_${scenarioId}`)
      setCustomReceipts(r ? JSON.parse(r) : DEFAULT_RECEIPTS)

      const scn = localStorage.getItem(`gfi_custom_supply_chain_nodes_${scenarioId}`)
      setCustomSupplyChainNodes(scn ? JSON.parse(scn) : [])

      const req = localStorage.getItem(`gfi_custom_eudr_form_requests_${scenarioId}`)
      setCustomEudrFormRequests(req ? JSON.parse(req) : [])

      const edge = localStorage.getItem(`gfi_custom_supply_chain_edges_${scenarioId}`)
      setCustomSupplyChainEdges(edge ? JSON.parse(edge) : [])

      const inter = localStorage.getItem(`gfi_custom_intermediary_submissions_${scenarioId}`)
      setCustomIntermediarySubmissions(inter ? JSON.parse(inter) : [])

      const farmer = localStorage.getItem(`gfi_custom_farmer_submissions_${scenarioId}`)
      setCustomFarmerSubmissions(farmer ? JSON.parse(farmer) : [])

      const evidence = localStorage.getItem(`gfi_custom_eudr_evidence_${scenarioId}`)
      setCustomEudrEvidenceAttachments(evidence ? JSON.parse(evidence) : [])

      const pl = localStorage.getItem(`gfi_custom_plots_${scenarioId}`)
      setCustomPlots(pl ? JSON.parse(pl) : [])

      const df = localStorage.getItem(`gfi_custom_deforestation_cases_${scenarioId}`)
      setCustomDeforestationCases(df ? JSON.parse(df) : [])
    }
  }, [scenarioId])

  const setScenarioId = (id: string) => {
    setScenarioIdState(id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('gfi_eudr_scenario', id)
    }
  }

  // Merge algorithm helper (custom edits override baseline; new items are appended)
  function mergeDatasets<T extends { id: string }>(baseline: T[], custom: T[]): T[] {
    const merged = [...baseline]
    custom.forEach(cust => {
      const idx = merged.findIndex(item => item.id === cust.id)
      if (idx >= 0) {
        merged[idx] = cust
      } else {
        merged.push(cust)
      }
    })
    return merged
  }

  // Derived merged data
  const scenarioData = getScenarioData(scenarioId)
  const suppliers = mergeDatasets(scenarioData.suppliers, customSuppliers)
  const products = mergeDatasets(scenarioData.products, customProducts)
  const consignments = mergeDatasets(scenarioData.consignments, customConsignments)
  const agents = mergeDatasets(staticAgents, customAgents)
  const documents = mergeDatasets(scenarioData.documents, customDocuments)
  const concerns = mergeDatasets(scenarioData.concerns, customConcerns)
  const receipts = customReceipts // Receipts are fully customized/overridden client-side
  const supplyChainNodes = mergeDatasets(scenarioData.supplyChainNodes, customSupplyChainNodes)
  const eudrFormRequests = mergeDatasets(scenarioData.eudrFormRequests, customEudrFormRequests)
  const supplyChainEdges = mergeDatasets(scenarioData.supplyChainEdges, customSupplyChainEdges)
  const intermediaryDeclarationSubmissions = mergeDatasets(
    scenarioData.intermediaryDeclarationSubmissions,
    customIntermediarySubmissions,
  )
  const farmerDeclarationSubmissions = mergeDatasets(scenarioData.farmerDeclarationSubmissions, customFarmerSubmissions)
  const eudrEvidenceAttachments = mergeDatasets(scenarioData.eudrEvidenceAttachments, customEudrEvidenceAttachments)
  const plots = mergeDatasets(scenarioData.plots, customPlots)
  const deforestationCases = mergeDatasets(scenarioData.deforestationCases, customDeforestationCases)

  // CRUD Implementations
  const addSupplier = (record: SupplierRecord) => {
    const next = [...customSuppliers, record]
    setCustomSuppliers(next)
    localStorage.setItem(`gfi_custom_suppliers_${scenarioId}`, JSON.stringify(next))
  }
  const editSupplier = (record: SupplierRecord) => {
    const idx = customSuppliers.findIndex(r => r.id === record.id)
    const next = idx >= 0 ? customSuppliers.map(r => r.id === record.id ? record : r) : [...customSuppliers, record]
    setCustomSuppliers(next)
    localStorage.setItem(`gfi_custom_suppliers_${scenarioId}`, JSON.stringify(next))
  }

  const addProduct = (record: ProductRecord) => {
    const next = [...customProducts, record]
    setCustomProducts(next)
    localStorage.setItem(`gfi_custom_products_${scenarioId}`, JSON.stringify(next))
  }
  const editProduct = (record: ProductRecord) => {
    const idx = customProducts.findIndex(r => r.id === record.id)
    const next = idx >= 0 ? customProducts.map(r => r.id === record.id ? record : r) : [...customProducts, record]
    setCustomProducts(next)
    localStorage.setItem(`gfi_custom_products_${scenarioId}`, JSON.stringify(next))
  }

  const addConsignment = (record: ConsignmentRecord) => {
    const next = [...customConsignments, record]
    setCustomConsignments(next)
    localStorage.setItem(`gfi_custom_consignments_${scenarioId}`, JSON.stringify(next))
  }
  const editConsignment = (record: ConsignmentRecord) => {
    const idx = customConsignments.findIndex(r => r.id === record.id)
    const next = idx >= 0 ? customConsignments.map(r => r.id === record.id ? record : r) : [...customConsignments, record]
    setCustomConsignments(next)
    localStorage.setItem(`gfi_custom_consignments_${scenarioId}`, JSON.stringify(next))
  }

  const addAgent = (record: AgentProfile) => {
    const next = [...customAgents, record]
    setCustomAgents(next)
    localStorage.setItem(`gfi_custom_agents_${scenarioId}`, JSON.stringify(next))
  }
  const editAgent = (record: AgentProfile) => {
    const idx = customAgents.findIndex(r => r.id === record.id)
    const next = idx >= 0 ? customAgents.map(r => r.id === record.id ? record : r) : [...customAgents, record]
    setCustomAgents(next)
    localStorage.setItem(`gfi_custom_agents_${scenarioId}`, JSON.stringify(next))
  }

  const addDocument = (record: DocumentRecord) => {
    const next = [...customDocuments, record]
    setCustomDocuments(next)
    localStorage.setItem(`gfi_custom_documents_${scenarioId}`, JSON.stringify(next))
  }
  const editDocument = (record: DocumentRecord) => {
    const idx = customDocuments.findIndex(r => r.id === record.id)
    const next = idx >= 0 ? customDocuments.map(r => r.id === record.id ? record : r) : [...customDocuments, record]
    setCustomDocuments(next)
    localStorage.setItem(`gfi_custom_documents_${scenarioId}`, JSON.stringify(next))
  }

  const addConcern = (record: ConcernRecord) => {
    const next = [...customConcerns, record]
    setCustomConcerns(next)
    localStorage.setItem(`gfi_custom_concerns_${scenarioId}`, JSON.stringify(next))
  }
  const editConcern = (record: ConcernRecord) => {
    const idx = customConcerns.findIndex(r => r.id === record.id)
    const next = idx >= 0 ? customConcerns.map(r => r.id === record.id ? record : r) : [...customConcerns, record]
    setCustomConcerns(next)
    localStorage.setItem(`gfi_custom_concerns_${scenarioId}`, JSON.stringify(next))
  }

  const addReceipt = (record: ERPReceipt) => {
    const next = [...customReceipts, record]
    setCustomReceipts(next)
    localStorage.setItem(`gfi_custom_receipts_${scenarioId}`, JSON.stringify(next))
  }
  const editReceipt = (record: ERPReceipt) => {
    const idx = customReceipts.findIndex(r => r.id === record.id)
    const next = idx >= 0 ? customReceipts.map(r => r.id === record.id ? record : r) : [...customReceipts, record]
    setCustomReceipts(next)
    localStorage.setItem(`gfi_custom_receipts_${scenarioId}`, JSON.stringify(next))
  }

  const persistSupplyChainNodes = (records: SupplyChainNode[]) => {
    setCustomSupplyChainNodes(records)
    localStorage.setItem(`gfi_custom_supply_chain_nodes_${scenarioId}`, JSON.stringify(records))
  }
  const persistEudrFormRequests = (records: EudrFormRequest[]) => {
    setCustomEudrFormRequests(records)
    localStorage.setItem(`gfi_custom_eudr_form_requests_${scenarioId}`, JSON.stringify(records))
  }
  const persistSupplyChainEdges = (records: SupplyChainEdge[]) => {
    setCustomSupplyChainEdges(records)
    localStorage.setItem(`gfi_custom_supply_chain_edges_${scenarioId}`, JSON.stringify(records))
  }
  const persistIntermediarySubmissions = (records: IntermediaryDeclarationSubmission[]) => {
    setCustomIntermediarySubmissions(records)
    localStorage.setItem(`gfi_custom_intermediary_submissions_${scenarioId}`, JSON.stringify(records))
  }
  const persistFarmerSubmissions = (records: FarmerDeclarationSubmission[]) => {
    setCustomFarmerSubmissions(records)
    localStorage.setItem(`gfi_custom_farmer_submissions_${scenarioId}`, JSON.stringify(records))
  }
  const persistEudrEvidenceAttachments = (records: EudrEvidenceAttachment[]) => {
    setCustomEudrEvidenceAttachments(records)
    localStorage.setItem(`gfi_custom_eudr_evidence_${scenarioId}`, JSON.stringify(records))
  }

  const editPlot = (record: PlotRecord) => {
    const idx = customPlots.findIndex(r => r.id === record.id)
    const next = idx >= 0 ? customPlots.map(r => r.id === record.id ? record : r) : [...customPlots, record]
    setCustomPlots(next)
    localStorage.setItem(`gfi_custom_plots_${scenarioId}`, JSON.stringify(next))
  }

  const editDeforestationCase = (record: DeforestationCase) => {
    const idx = customDeforestationCases.findIndex(r => r.id === record.id)
    const next = idx >= 0 ? customDeforestationCases.map(r => r.id === record.id ? record : r) : [...customDeforestationCases, record]
    setCustomDeforestationCases(next)
    localStorage.setItem(`gfi_custom_deforestation_cases_${scenarioId}`, JSON.stringify(next))
  }

  const addSupplyChainNode = (record: SupplyChainNode) => {
    persistSupplyChainNodes([...customSupplyChainNodes, record])
  }
  const editSupplyChainNode = (record: SupplyChainNode) => {
    const idx = customSupplyChainNodes.findIndex(r => r.id === record.id)
    const next = idx >= 0 ? customSupplyChainNodes.map(r => r.id === record.id ? record : r) : [...customSupplyChainNodes, record]
    persistSupplyChainNodes(next)
  }
  const addEudrFormRequest = (record: EudrFormRequest) => {
    persistEudrFormRequests([...customEudrFormRequests, record])
  }
  const editEudrFormRequest = (record: EudrFormRequest) => {
    const idx = customEudrFormRequests.findIndex(r => r.id === record.id)
    const next = idx >= 0 ? customEudrFormRequests.map(r => r.id === record.id ? record : r) : [...customEudrFormRequests, record]
    persistEudrFormRequests(next)
  }
  const addSupplyChainEdge = (record: SupplyChainEdge) => {
    persistSupplyChainEdges([...customSupplyChainEdges, record])
  }
  const addIntermediaryDeclarationSubmission = (record: IntermediaryDeclarationSubmission) => {
    persistIntermediarySubmissions([...customIntermediarySubmissions, record])
  }
  const addFarmerDeclarationSubmission = (record: FarmerDeclarationSubmission) => {
    persistFarmerSubmissions([...customFarmerSubmissions, record])
  }
  const addEudrEvidenceAttachment = (record: EudrEvidenceAttachment) => {
    persistEudrEvidenceAttachments([...customEudrEvidenceAttachments, record])
  }

  const generateEudrFormRequest: AuthContextType["generateEudrFormRequest"] = (input) => {
    const now = new Date()
    const requestedAt = now.toISOString().slice(0, 10)
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const nodeId = `node-${input.ingredientId}-${suffix}`
    const requestId = `req-${input.ingredientId}-${suffix}`
    const tokenLabel = `PORTAL-${input.formType}-${suffix}`.toUpperCase()
    const targetNodeId = input.parentNodeId ? nodeId : (supplyChainNodes.find(
      node => node.ingredientId === input.ingredientId && node.supplierId === input.supplierId && node.parentNodeId === null,
    )?.id ?? nodeId)

    const existingActive = eudrFormRequests.find((request) =>
      request.targetSupplierId === input.supplierId &&
      request.productId === input.productId &&
      request.ingredientId === input.ingredientId &&
      request.targetNodeId === targetNodeId &&
      request.formType === input.formType &&
      request.status !== "CLOSED",
    )
    if (existingActive) {
      return existingActive
    }

    const node: SupplyChainNode = {
      id: targetNodeId,
      ingredientId: input.ingredientId,
      productId: input.productId,
      supplierId: input.supplierId,
      parentNodeId: input.parentNodeId ?? null,
      tier: input.parentNodeId
        ? (supplyChainNodes.find(node => node.id === input.parentNodeId)?.tier ?? 1) + 1
        : 1,
      actorType: input.actorType ?? (input.formType === "FARMER" ? "FARMER" : "DIRECT_SUPPLIER"),
      entityName: input.entityName ?? input.supplierName,
      country: input.country ?? "Unknown",
      commodity: input.commodity,
      materialName: input.materialName,
      volumeContributionPercent: input.volumeContributionPercent ?? 100,
      status: "REQUESTED",
    }

    const request: EudrFormRequest = {
      id: requestId,
      tokenLabel,
      targetSupplierId: input.supplierId,
      targetNodeId,
      productId: input.productId,
      ingredientId: input.ingredientId,
      formType: input.formType,
      requestedBy: "GFI Compliance",
      requestedAt,
      expiresAt,
      status: "PENDING_RESPONSE",
      email: input.email ?? "",
      parentRequestId: input.parentRequestId ?? null,
    }

    editSupplyChainNode(node)
    addEudrFormRequest(request)

    if (input.parentNodeId) {
      addSupplyChainEdge({
        id: `edge-${targetNodeId}-${input.parentNodeId}`,
        fromNodeId: targetNodeId,
        toNodeId: input.parentNodeId,
        relationshipType: input.formType === "FARMER" ? "FARM_SOURCE_FOR" : "SUPPLIES_TO",
        materialName: input.materialName,
        volumePercent: input.volumeContributionPercent ?? 100,
        proofDocumentIds: [],
        status: "PENDING",
      })
    }

    return request
  }

  const propagateChainCompletion = (completedNodeId: string) => {
    const completedNode = supplyChainNodes.find(n => n.id === completedNodeId)
    if (!completedNode) return

    // If this node has a parent, check if all siblings (children of parent) are COMPLETE
    if (completedNode.parentNodeId) {
      const siblings = supplyChainNodes.filter(n => n.parentNodeId === completedNode.parentNodeId)
      const allComplete = siblings.every(s => s.id === completedNodeId ? true : s.status === "COMPLETE")
      if (allComplete) {
        const parentNode = supplyChainNodes.find(n => n.id === completedNode.parentNodeId)
        if (parentNode) {
          editSupplyChainNode({ ...parentNode, status: "COMPLETE" })
          // Recurse upward
          propagateChainCompletion(parentNode.id)
        }
      }
    } else {
      // This is a root node — update the ingredient's supplyChainStatus
      updateIngredientChainStatus(completedNode.productId, completedNode.ingredientId, "COMPLETE")
    }
  }

  const updateIngredientChainStatus = (
    productId: string,
    ingredientId: string,
    status: IngredientRecord["supplyChainStatus"]
  ) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const updatedIngredients = product.ingredients.map(ing =>
      ing.id === ingredientId ? { ...ing, supplyChainStatus: status } : ing
    )
    editProduct({ ...product, ingredients: updatedIngredients })
  }

  const session: UserSession = {
    user: {
      id: 'd9b0429f-f529-470f-ad72-6878c772cb33',
      name: 'Mg Operator',
      email: 'mg.compliance@fos-eudr.local',
      role: role,
      organizationId: orgId
    }
  }

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole)
  }

  return (
    <AuthContext.Provider value={{
      session,
      setRole,
      scenarioId,
      setScenarioId,
      suppliers,
      products,
      consignments,
      agents,
      documents,
      concerns,
      receipts,
      supplyChainNodes,
      eudrFormRequests,
      supplyChainEdges,
      intermediaryDeclarationSubmissions,
      farmerDeclarationSubmissions,
      eudrEvidenceAttachments,
      plots,
      deforestationCases,
      addSupplier,
      editSupplier,
      addProduct,
      editProduct,
      addConsignment,
      editConsignment,
      addAgent,
      editAgent,
      addDocument,
      editDocument,
      addConcern,
      editConcern,
      addReceipt,
      editReceipt,
      addSupplyChainNode,
      editSupplyChainNode,
      addEudrFormRequest,
      editEudrFormRequest,
      addSupplyChainEdge,
      addIntermediaryDeclarationSubmission,
      addFarmerDeclarationSubmission,
      addEudrEvidenceAttachment,
      editPlot,
      editDeforestationCase,
      generateEudrFormRequest,
      propagateChainCompletion,
      updateIngredientChainStatus,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useSession() {
  return useContext(AuthContext)
}

export function PermissionGuard({
  requiredRoles,
  children,
  fallback = null
}: {
  requiredRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { session } = useSession()
  const userRole = session?.user?.role

  if (!userRole || !requiredRoles.includes(userRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
