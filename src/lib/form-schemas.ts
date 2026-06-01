import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Supplier company name is required."),
  country: z.string().min(1, "Origin country is required."),
  supplierType: z.string().min(1, "Supplier type is required."),
  tier: z.number().min(1).max(4),
  geolocationCoverage: z.number().min(0, "Coverage cannot be negative.").max(100, "Coverage cannot exceed 100."),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required."),
  finishedHsCode: z.string().min(1, "Finished HS code is required."),
  annualVolume: z.string().min(1, "Annual volume is required."),
  activeBomRevision: z.string().min(1, "BOM revision is required."),
});

export const consignmentSchema = z.object({
  reference: z.string().min(1, "Shipment reference is required."),
  destination: z.string().min(1, "Destination is required."),
  operatorAgentId: z.string().min(1, "Assigned operator agent is required."),
});

export const documentSchema = z.object({
  title: z.string().min(1, "Document title is required."),
  documentRole: z.string().min(1, "Document role is required."),
  linkedEntity: z.string().min(1, "Linked entity is required."),
  status: z.string().min(1, "Lifecycle status is required."),
});

export const agentSchema = z.object({
  name: z.string().min(1, "Operator agent name is required."),
  country: z.string().min(1, "Country of registration is required."),
  operatorMode: z.string().min(1, "Operator mode is required."),
});

export const receiptSchema = z.object({
  lotNumber: z.string().min(1, "Lot number is required."),
  supplierName: z.string().min(1, "Supplier name is required."),
  quantity: z.string().min(1, "Load volume is required."),
  date: z.string().min(1, "Receipt date is required."),
});

export const concernSchema = z.object({
  headline: z.string().min(1, "Alert headline is required."),
  impactArea: z.string().min(1, "Impact area is required."),
  linkedEntity: z.string().min(1, "Linked entity is required."),
  status: z.string().min(1, "Resolution status is required."),
});

