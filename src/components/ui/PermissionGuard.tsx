"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { appendAuditEvent, summarizeLegalityDossier, toIngredientLegalityStatus } from "@/lib/legality-dossier"
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
  DdsSubmissionRecord,
  LegalityDossierRecord,
  LegalityEvidenceDocument,
  OrganizationProfile,
  organizationProfile as defaultOrganizationProfile,
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

export interface AccountProfile {
  id: string
  displayName: string
  email: string
  jobTitle: string
  phone: string
  role: UserRole
  organizationId: string
}

const AUTH_STORAGE_KEY = 'gfi.auth.session.v1'
const PROFILE_STORAGE_KEY = 'gfi.profile.v1'

const DEFAULT_ACCOUNT_PROFILE: AccountProfile = {
  id: 'd9b0429f-f529-470f-ad72-6878c772cb33',
  displayName: 'GFI Compliance Admin',
  email: 'admin_gfi@gmail.com',
  jobTitle: 'Compliance Officer',
  phone: '',
  role: 'COMPLIANCE_OFFICER',
  organizationId: '46147125-cdab-459e-a2c2-889b035c86c0',
}

type StoredProfileState = {
  account: AccountProfile
  organization: OrganizationProfile
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
    supplierName: "N A Enterprises",
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
  isHydrated: boolean
  accountProfile: AccountProfile
  organizationProfile: OrganizationProfile
  login: () => void
  logout: () => void
  updateAccountProfile: (profile: AccountProfile) => void
  updateOrganizationProfile: (profile: OrganizationProfile) => void
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
  ddsSubmissions: DdsSubmissionRecord[]
  legalityDossiers: LegalityDossierRecord[]
  
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
  addOrEditDdsSubmission: (record: DdsSubmissionRecord) => void
  addOrEditLegalityDossier: (record: LegalityDossierRecord) => void
  addLegalityEvidenceDocument: (input: {
    dossierId: string
    document: LegalityEvidenceDocument
    actor?: string
  }) => void
  verifyLegalityEvidenceDocument: (input: {
    dossierId: string
    documentId: string
    verificationStatus: LegalityEvidenceDocument["verificationStatus"]
    verificationNote?: string
    validFrom?: string
    validTo?: string
    countryRegistrarRef?: string
    customsSealRef?: string
    actor?: string
  }) => void
  updateIngredientComplianceState: (input: {
    productId: string
    ingredientId: string
    changes: Partial<Pick<IngredientRecord, "legalityDossierStatus" | "ddsStatus" | "euRiskTier" | "dueDiligenceMode" | "originCountries" | "primaryOriginCountry">>
  }) => void
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
  isHydrated: false,
  accountProfile: DEFAULT_ACCOUNT_PROFILE,
  organizationProfile: defaultOrganizationProfile,
  login: () => {},
  logout: () => {},
  updateAccountProfile: () => {},
  updateOrganizationProfile: () => {},
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
  ddsSubmissions: [],
  legalityDossiers: [],
  
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
  addOrEditDdsSubmission: () => {},
  addOrEditLegalityDossier: () => {},
  addLegalityEvidenceDocument: () => {},
  verifyLegalityEvidenceDocument: () => {},
  updateIngredientComplianceState: () => {},
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
  const [isHydrated, setIsHydrated] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accountProfile, setAccountProfile] = useState<AccountProfile>(DEFAULT_ACCOUNT_PROFILE)
  const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile>(defaultOrganizationProfile)
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
  const [customDdsSubmissions, setCustomDdsSubmissions] = useState<DdsSubmissionRecord[]>([])
  const [customLegalityDossiers, setCustomLegalityDossiers] = useState<LegalityDossierRecord[]>([])

  // Hydrate authentication and editable profile state from browser storage.
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(AUTH_STORAGE_KEY)
      setIsAuthenticated(savedSession === 'authenticated')

      const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY)
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile) as Partial<StoredProfileState>
        if (parsed.account) {
          const nextAccount = { ...DEFAULT_ACCOUNT_PROFILE, ...parsed.account }
          setAccountProfile(nextAccount)
          setRoleState(nextAccount.role)
        }
        if (parsed.organization) {
          setOrganizationProfile({ ...defaultOrganizationProfile, ...parsed.organization })
        }
      }

      const saved = localStorage.getItem('gfi_eudr_scenario')
      if (saved) {
        setScenarioIdState(saved)
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(PROFILE_STORAGE_KEY)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  const persistProfiles = (account: AccountProfile, organization: OrganizationProfile) => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ account, organization }))
  }

  const persistProfilePatch = (patch: Partial<StoredProfileState>) => {
    let stored: StoredProfileState = {
      account: accountProfile,
      organization: organizationProfile,
    }
    try {
      const current = localStorage.getItem(PROFILE_STORAGE_KEY)
      if (current) {
        const parsed = JSON.parse(current) as Partial<StoredProfileState>
        stored = {
          account: { ...stored.account, ...parsed.account },
          organization: { ...stored.organization, ...parsed.organization },
        }
      }
    } catch {
      // Replace malformed profile storage with the current valid provider state.
    }
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...stored, ...patch }))
  }

  const login = () => {
    setIsAuthenticated(true)
    localStorage.setItem(AUTH_STORAGE_KEY, 'authenticated')
    persistProfiles(accountProfile, organizationProfile)
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const updateAccountProfile = (profile: AccountProfile) => {
    setAccountProfile(profile)
    setRoleState(profile.role)
    persistProfilePatch({ account: profile })
  }

  const updateOrganizationProfile = (profile: OrganizationProfile) => {
    setOrganizationProfile(profile)
    persistProfilePatch({ organization: profile })
  }

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

      const dds = localStorage.getItem(`gfi_custom_dds_submissions_${scenarioId}`)
      setCustomDdsSubmissions(dds ? JSON.parse(dds) : [])

      const legality = localStorage.getItem(`gfi_custom_legality_dossiers_${scenarioId}`)
      setCustomLegalityDossiers(legality ? JSON.parse(legality) : [])
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

  // Self-healing product merge to prevent stale cached ingredient structures from overriding updated baselines
  function mergeProducts(baseline: ProductRecord[], custom: ProductRecord[]): ProductRecord[] {
    const merged = [...baseline]
    custom.forEach(cust => {
      const idx = merged.findIndex(item => item.id === cust.id)
      if (idx >= 0) {
        const baseProduct = merged[idx]
        const mergedIngredients = [...cust.ingredients]
        baseProduct.ingredients.forEach(baseIng => {
          const customIngIdx = mergedIngredients.findIndex(
            ing => ing.id === baseIng.id || ing.name.toLowerCase() === baseIng.name.toLowerCase()
          )
          if (customIngIdx >= 0) {
            // Heal ingredient properties: merge custom edits with missing baseline properties
            mergedIngredients[customIngIdx] = {
              ...baseIng,
              ...mergedIngredients[customIngIdx],
              // Ensure that new enriched fields from baseline are copied if missing in custom
              scientificName: mergedIngredients[customIngIdx].scientificName || baseIng.scientificName,
              cocModel: mergedIngredients[customIngIdx].cocModel || baseIng.cocModel,
              supplierName: mergedIngredients[customIngIdx].supplierName || baseIng.supplierName,
              certifications: mergedIngredients[customIngIdx].certifications || baseIng.certifications,
              originCountries: mergedIngredients[customIngIdx].originCountries?.length ? mergedIngredients[customIngIdx].originCountries : baseIng.originCountries,
              primaryOriginCountry: mergedIngredients[customIngIdx].primaryOriginCountry || baseIng.primaryOriginCountry,
              euRiskTier: mergedIngredients[customIngIdx].euRiskTier || baseIng.euRiskTier,
              dueDiligenceMode: mergedIngredients[customIngIdx].dueDiligenceMode || baseIng.dueDiligenceMode,
              legalityDossierStatus: mergedIngredients[customIngIdx].legalityDossierStatus || baseIng.legalityDossierStatus,
              ddsStatus: mergedIngredients[customIngIdx].ddsStatus || baseIng.ddsStatus,
            }
          } else {
            mergedIngredients.push(baseIng)
          }
        })
        merged[idx] = {
          ...cust,
          ingredients: mergedIngredients,
        }
      } else {
        merged.push(cust)
      }
    })
    return merged
  }

  function mergeSuppliers(baseline: SupplierRecord[], custom: SupplierRecord[]): SupplierRecord[] {
    const merged = [...baseline]
    custom.forEach(cust => {
      const idx = merged.findIndex(item => item.id === cust.id)
      if (idx >= 0) {
        merged[idx] = {
          ...merged[idx],
          ...cust,
          contactPerson: cust.contactPerson || merged[idx].contactPerson,
          address: cust.address || merged[idx].address,
          email: cust.email || merged[idx].email,
          fax: cust.fax || merged[idx].fax,
          phone: cust.phone || merged[idx].phone,
          documents: cust.documents && cust.documents.length > 0 ? cust.documents : (merged[idx].documents || []),
        }
      } else {
        merged.push(cust)
      }
    })
    return merged
  }

  // Derived merged data
  const scenarioData = getScenarioData(scenarioId)
  const suppliers = mergeSuppliers(scenarioData.suppliers, customSuppliers)
  const products = mergeProducts(scenarioData.products, customProducts)
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
  const ddsSubmissions = mergeDatasets(scenarioData.ddsSubmissions ?? [], customDdsSubmissions)
  const legalityDossiers = mergeDatasets(scenarioData.legalityDossiers ?? [], customLegalityDossiers)

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
  const persistDdsSubmissions = (records: DdsSubmissionRecord[]) => {
    setCustomDdsSubmissions(records)
    localStorage.setItem(`gfi_custom_dds_submissions_${scenarioId}`, JSON.stringify(records))
  }
  const persistLegalityDossiers = (records: LegalityDossierRecord[]) => {
    setCustomLegalityDossiers(records)
    localStorage.setItem(`gfi_custom_legality_dossiers_${scenarioId}`, JSON.stringify(records))
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

  const addOrEditDdsSubmission = (record: DdsSubmissionRecord) => {
    const idx = customDdsSubmissions.findIndex(r => r.id === record.id)
    const next = idx >= 0 ? customDdsSubmissions.map(r => r.id === record.id ? record : r) : [...customDdsSubmissions, record]
    persistDdsSubmissions(next)
  }

  const addOrEditLegalityDossier = (record: LegalityDossierRecord) => {
    const normalizedRecord = {
      ...record,
      overallStatus: summarizeLegalityDossier(record.documents),
    }
    const idx = customLegalityDossiers.findIndex(r => r.id === record.id)
    const next = idx >= 0 ? customLegalityDossiers.map(r => r.id === record.id ? normalizedRecord : r) : [...customLegalityDossiers, normalizedRecord]
    persistLegalityDossiers(next)
  }

  const addLegalityEvidenceDocument: AuthContextType["addLegalityEvidenceDocument"] = ({ dossierId, document, actor }) => {
    const target = legalityDossiers.find(dossier => dossier.id === dossierId)
    if (!target) return

    const nextDocuments = target.documents.map(existing =>
      existing.id === document.id
        ? { ...existing, ...document }
        : existing
    )
    const nextStatus = summarizeLegalityDossier(nextDocuments)
    const nextDossier: LegalityDossierRecord = {
      ...target,
      documents: nextDocuments,
      overallStatus: nextStatus,
      auditTrail: appendAuditEvent(target.auditTrail, {
        timestamp: new Date().toISOString(),
        actor: actor ?? "Compliance Officer",
        eventType: document.fileName ? "DOCUMENT_UPLOADED" : "DOCUMENT_REPLACED",
        message: `${document.sampleDocumentLabel} ${document.fileName ? `uploaded as ${document.fileName}` : "was updated"}.`,
      }),
    }
    addOrEditLegalityDossier(nextDossier)
  }

  const verifyLegalityEvidenceDocument: AuthContextType["verifyLegalityEvidenceDocument"] = (input) => {
    const target = legalityDossiers.find(dossier => dossier.id === input.dossierId)
    if (!target) return

    const nextDocuments = target.documents.map(document =>
      document.id === input.documentId
        ? {
            ...document,
            verificationStatus: input.verificationStatus,
            verificationNote: input.verificationNote,
            validFrom: input.validFrom ?? document.validFrom,
            validTo: input.validTo ?? document.validTo,
            countryRegistrarRef: input.countryRegistrarRef ?? document.countryRegistrarRef,
            customsSealRef: input.customsSealRef ?? document.customsSealRef,
          }
        : document
    )
    const nextStatus = summarizeLegalityDossier(nextDocuments)
    const eventType =
      input.verificationStatus === "VERIFIED"
        ? "DOCUMENT_VERIFIED"
        : input.verificationStatus === "EXPIRED"
          ? "DOCUMENT_EXPIRED"
          : "DOCUMENT_REJECTED"
    const nextDossier: LegalityDossierRecord = {
      ...target,
      documents: nextDocuments,
      overallStatus: nextStatus,
      auditTrail: appendAuditEvent(target.auditTrail, {
        timestamp: new Date().toISOString(),
        actor: input.actor ?? "Compliance Reviewer",
        eventType,
        message: `Document review status changed to ${input.verificationStatus.replace(/_/g, " ")}.`,
      }),
    }
    addOrEditLegalityDossier(nextDossier)
  }

  const updateIngredientComplianceState: AuthContextType["updateIngredientComplianceState"] = ({ productId, ingredientId, changes }) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const updatedIngredients = product.ingredients.map(ing =>
      ing.id === ingredientId ? { ...ing, ...changes } : ing
    )
    editProduct({ ...product, ingredients: updatedIngredients })
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

  const session: UserSession | null = isAuthenticated
    ? {
        user: {
          id: accountProfile.id,
          name: accountProfile.displayName,
          email: accountProfile.email,
          role,
          organizationId: accountProfile.organizationId,
        },
      }
    : null

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole)
    const nextAccount = { ...accountProfile, role: newRole }
    setAccountProfile(nextAccount)
    persistProfilePatch({ account: nextAccount })
  }

  return (
    <AuthContext.Provider value={{
      session,
      isHydrated,
      accountProfile,
      organizationProfile,
      login,
      logout,
      updateAccountProfile,
      updateOrganizationProfile,
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
      ddsSubmissions,
      legalityDossiers,
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
      addOrEditDdsSubmission,
      addOrEditLegalityDossier,
      addLegalityEvidenceDocument,
      verifyLegalityEvidenceDocument,
      updateIngredientComplianceState,
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
