"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@/components/ui/PermissionGuard";
import { documentSchema } from "@/lib/form-schemas";
import { z } from "zod";
import {
  Button,
  Card,
  FormActions,
  FormField,
  FormGrid,
  FormSection,
  Input,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalShell,
  SectionHeader,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  Tag,
  Textarea,
  ValidationSummary,
} from "@/components/ui";
import { FileText, File, Image, MapPin, Eye, Edit2, Trash2 } from "lucide-react";
import type { StatusTone } from "@/lib/ui-semantics";

const documentFormSchema = documentSchema.extend({
  note: z.string(),
  roleText: z.string(),
});

const DOCUMENT_STATUS_MAP: Record<"CURRENT" | "REQUESTED" | "EXPIRED" | "DRAFT", StatusTone> = {
  CURRENT: "current",
  REQUESTED: "review_required",
  EXPIRED: "held",
  DRAFT: "draft",
};

const STANDARD_ROLES = [
  "SUPPLIER_DECLARATION",
  "INTERMEDIARY_DECLARATION",
  "FARMER_DECLARATION",
  "UPSTREAM_TRADE_PROOF",
  "LAND_RIGHTS_EVIDENCE",
  "GEOLOCATION_FILE",
  "SUSTAINABILITY_CERTIFICATE",
  "LEGAL_LICENSE",
  "LABOUR_RIGHTS_EVIDENCE",
  "DEFORESTATION_AUDIT",
  "CHAIN_OF_CUSTODY_PROOF",
  "AUDIT_SUMMARY",
  "GEOLOCATION_SHAPEFILE",
] as const;

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default function DocumentsEvidencePage() {
  const { documents, addDocument, editDocument, deleteDocument, suppliers, products, scenarioId } = useSession();

  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [roleType, setRoleType] = useState("SUPPLIER_DECLARATION");
  const [linkedEntityType, setLinkedEntityType] = useState("CUSTOM");
  const [editingId, setEditingId] = useState<string | null>(null);
  type DocumentFormValues = z.infer<typeof documentFormSchema>;
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: "",
      documentRole: "SUPPLIER_DECLARATION",
      linkedEntity: "",
      status: "CURRENT",
      note: "",
      roleText: "",
    },
  });

  useEffect(() => {
    if (documents.length > 0) {
      const exists = documents.some((item) => item.id === selectedDocumentId);
      if (!exists) setSelectedDocumentId(documents[0].id);
    }
  }, [documents, selectedDocumentId]);

  const selectedDocument = documents.find((item) => item.id === selectedDocumentId) ?? documents[0];

  const queueStats = useMemo(
    () => ({
      total: documents.length,
      current: documents.filter((item) => item.status === "CURRENT").length,
      requested: documents.filter((item) => item.status === "REQUESTED").length,
    }),
    [documents],
  );

  const resetForm = () => {
    setRoleType("SUPPLIER_DECLARATION");
    setLinkedEntityType("CUSTOM");
    setEditingId(null);
    form.reset({
      title: "",
      documentRole: "SUPPLIER_DECLARATION",
      linkedEntity: "",
      status: "CURRENT",
      note: "",
      roleText: "",
    });
  };

  function renderFileTypeChip(doc: typeof documents[0]) {
    const extSource = (doc.fileType || doc.title.split('.').pop() || '').toLowerCase();
    const ext = extSource.replace(/^\./, "");
    let label = ext ? ext.toUpperCase() : 'FILE';
    let Icon = File;

    if (ext.includes('pdf')) {
      Icon = FileText;
      label = 'PDF';
    } else if (ext.includes('doc') || ext.includes('rtf')) {
      Icon = FileText;
      label = 'DOC';
    } else if (ext === 'xls' || ext === 'xlsx') {
      Icon = FileText;
      label = 'EXCEL';
    } else if (ext === 'csv') {
      Icon = FileText;
      label = 'CSV';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].some((i) => ext.includes(i))) {
      Icon = Image;
      label = ext.toUpperCase();
    } else if (['geojson', 'kml', 'shp'].some((i) => ext.includes(i))) {
      Icon = MapPin;
      label = ext.toUpperCase();
    }

    return (
      <Tag tone="neutral" className="inline-flex items-center gap-2 px-3 py-1 text-sm">
        <Icon className="h-4 w-4 text-text-secondary" />
        <span className="font-semibold text-[13px] text-text-primary">{label}</span>
      </Tag>
    );
  }

  const closeModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    resetForm();
  };

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewDocument, setViewDocument] = useState<typeof documents[0] | null>(null);

  const handleView = (doc: typeof documents[0]) => {
    setViewDocument(doc);
    setIsViewOpen(true);
  };

  function renderPreview(doc: typeof documents[0]) {
    const previewSrc = "@file:test.pdf"; // dummy PDF for now
    const raw = (doc.fileType || doc.title.split('.').pop() || '').toLowerCase();
    if (raw.includes('pdf') || true) {
      return (
        <div className="w-full h-[640px] bg-white shadow-inner rounded">
          <object data={previewSrc} type="application/pdf" width="100%" height="100%">
            <p className="p-6 text-sm text-text-secondary">Preview not available. <a href={previewSrc} className="text-brand-primary underline">Download</a></p>
          </object>
        </div>
      );
    }
  }

  const handleOpenEdit = (docParam?: typeof documents[0]) => {
    const doc = docParam ?? selectedDocument;
    if (!doc) return;
    setSelectedDocumentId(doc.id);
    setEditingId(doc.id);
    form.setValue("title", doc.title);
    if (STANDARD_ROLES.includes(doc.documentRole as (typeof STANDARD_ROLES)[number])) {
      setRoleType(doc.documentRole);
      form.setValue("roleText", "");
    } else {
      setRoleType("CUSTOM");
      form.setValue("roleText", doc.documentRole);
    }

    const matchedSupplier = suppliers.find((item) => item.name === doc.linkedEntity);
    const matchedProduct = products.find((item) => item.name === doc.linkedEntity);
    if (matchedSupplier) {
      setLinkedEntityType(matchedSupplier.name);
      form.setValue("linkedEntity", matchedSupplier.name);
    } else if (matchedProduct) {
      setLinkedEntityType(matchedProduct.name);
      form.setValue("linkedEntity", matchedProduct.name);
    } else {
      setLinkedEntityType("CUSTOM");
      form.setValue("linkedEntity", doc.linkedEntity);
    }

    form.setValue("status", doc.status);
    form.setValue("note", doc.note);
    setIsEditModalOpen(true);
  };

  const handleSaveDocument = (values: DocumentFormValues, isEdit: boolean) => {
    const finalRole = roleType === "CUSTOM" ? values.roleText || "CUSTOM_DOCUMENT" : roleType;
    const documentData = {
      id: isEdit && editingId ? editingId : `doc-${Date.now()}`,
      title: values.title,
      documentRole: finalRole,
      linkedEntity: values.linkedEntity || "Global GFI Context",
      status: values.status as "CURRENT" | "REQUESTED" | "EXPIRED" | "DRAFT",
      note: values.note || "Awaiting compliance officer validation review notes.",
    };

    if (isEdit) {
      editDocument(documentData);
      setIsEditModalOpen(false);
    } else {
      addDocument(documentData);
      setSelectedDocumentId(documentData.id);
      setIsAddModalOpen(false);
    }
    resetForm();
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <SectionHeader
        title="Documents and Evidence"
        description="Manage declarations, certificates, audit records, and scope support documents."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Total Records</p>
          <p className="mt-2 text-2xl font-bold text-brand-primary">{queueStats.total}</p>
        </Card>
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Current</p>
          <p className="mt-2 text-2xl font-bold text-state-success">{queueStats.current}</p>
        </Card>
        <Card variant="inset" className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Requested</p>
          <p className="mt-2 text-2xl font-bold text-state-warning">{queueStats.requested}</p>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="space-y-4 p-4 sm:p-5 w-full">
          <SectionHeader
            title="Evidence Records List"
            actions={
              <Button
                size="sm"
                onClick={() => {
                  resetForm();
                  setIsAddModalOpen(true);
                }}
              >
                Add Evidence
              </Button>
            }
          />

          {documents.length === 0 ? (
            <Card variant="inset" className="p-3 text-sm text-text-secondary">
              No evidence documents found.
            </Card>
          ) : (
            <TableRoot>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Document</TableHeaderCell>
                    <TableHeaderCell>Supplier</TableHeaderCell>
                    <TableHeaderCell>Role</TableHeaderCell>
                    <TableHeaderCell>File Type</TableHeaderCell>
                    <TableHeaderCell>Uploaded By</TableHeaderCell>
                    <TableHeaderCell>Uploaded</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((document) => {
                    const matchedSupplier = suppliers.find((s) => s.name === document.linkedEntity);
                    return (
                      <TableRow key={document.id} className="">
                        <TableCell>
                          <p className="font-semibold text-brand-primary">{document.title}</p>
                          <p className="text-xs text-text-secondary">{formatLabel(document.documentRole)}</p>
                        </TableCell>
                        <TableCell>{matchedSupplier ? `${matchedSupplier.name}` : document.linkedEntity}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{formatLabel(document.documentRole)}</p>
                        </TableCell>
                        <TableCell className="py-4">
                          {renderFileTypeChip(document)}
                        </TableCell>
                        <TableCell className="text-sm text-text-secondary">{document.uploadedBy ?? 'System'}</TableCell>
                        <TableCell className="text-sm text-text-secondary">{(document.uploadedAt ?? document.issuedAt) ? new Date((document.uploadedAt ?? document.issuedAt) as string).toLocaleDateString() : '—'}</TableCell>
                        <TableCell>
                          <StatusBadge status={DOCUMENT_STATUS_MAP[document.status]}>
                            {formatLabel(document.status)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="tertiary"
                              className="h-9 w-9 p-2 rounded-full text-brand-primary hover:bg-brand-primary/10"
                              onClick={() => handleView(document)}
                              title={`View ${document.title}`}
                              aria-label={`View ${document.title}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-9 w-9 p-2 rounded-full text-text-primary hover:bg-surface-100"
                              onClick={() => { setSelectedDocumentId(document.id); handleOpenEdit(document); }}
                              title={`Edit ${document.title}`}
                              aria-label={`Edit ${document.title}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="danger"
                              className="h-9 w-9 p-2 rounded-full"
                              onClick={() => {
                                if (!confirm(`Delete document "${document.title}"? This cannot be undone.`)) return;
                                deleteDocument(document.id);
                                if (selectedDocumentId === document.id) setSelectedDocumentId("");
                              }}
                              title={`Delete ${document.title}`}
                              aria-label={`Delete ${document.title}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableRoot>
          )}
        </Card>

        {isViewOpen && viewDocument ? (
          <ModalShell open={isViewOpen} onClose={() => { setIsViewOpen(false); setViewDocument(null); }} size="xl">
            <ModalHeader title={viewDocument.title} description={formatLabel(viewDocument.documentRole)} onClose={() => { setIsViewOpen(false); setViewDocument(null); }} />
            <ModalBody>
              <div className="space-y-4">
                {renderPreview(viewDocument)}
              </div>
            </ModalBody>
            <ModalFooter>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setIsViewOpen(false); setViewDocument(null); }}>Close</Button>
                <a href="@file:test.pdf" target="_blank" rel="noreferrer" className="inline-block">
                  <Button size="sm">Open in new tab</Button>
                </a>
              </div>
            </ModalFooter>
          </ModalShell>
        ) : null}

        {/* Right detail panel removed — all details rendered inline within table rows */}
      </div>

      {(isAddModalOpen || isEditModalOpen) && (
        <ModalShell open={isAddModalOpen || isEditModalOpen} onClose={closeModal} size="lg">
          <ModalHeader
            title={isEditModalOpen ? "Edit Evidence Record" : "Create Evidence Record"}
            description="Add declarations, chain-of-custody proofs, or geospatial files and link them to entities."
            onClose={closeModal}
          />
          <form onSubmit={form.handleSubmit((values) => handleSaveDocument(values, isEditModalOpen))}>
            <ModalBody className="space-y-4">
              <ValidationSummary errors={Object.values(form.formState.errors).map((error) => error?.message ?? "").filter(Boolean)} />
              <FormSection title="Document Identity">
                <FormGrid>
                  <FormField label="Document Title / File Name" required error={form.formState.errors.title?.message}>
                    <Input {...form.register("title")} />
                  </FormField>
                  <FormField label="Lifecycle Status" required error={form.formState.errors.status?.message}>
                    <Select {...form.register("status")}>
                      <option value="CURRENT">CURRENT</option>
                      <option value="REQUESTED">REQUESTED</option>
                      <option value="EXPIRED">EXPIRED</option>
                      <option value="DRAFT">DRAFT</option>
                    </Select>
                  </FormField>
                </FormGrid>
              </FormSection>

              <FormSection title="Role and Linkage">
                <FormGrid>
                  <FormField label="Document Role / Classification">
                    <Select value={roleType} onChange={(event) => setRoleType(event.target.value)}>
                      <option value="SUPPLIER_DECLARATION">Supplier Compliance Declaration</option>
                      <option value="INTERMEDIARY_DECLARATION">Intermediary Actor Declaration</option>
                      <option value="FARMER_DECLARATION">Farmer / Producer Declaration</option>
                      <option value="UPSTREAM_TRADE_PROOF">Upstream Trade Proof</option>
                      <option value="LAND_RIGHTS_EVIDENCE">Land Rights Evidence</option>
                      <option value="GEOLOCATION_FILE">Geolocation File</option>
                      <option value="SUSTAINABILITY_CERTIFICATE">Sustainability Certificate</option>
                      <option value="LEGAL_LICENSE">Legal / Operational License</option>
                      <option value="LABOUR_RIGHTS_EVIDENCE">Labour Rights Evidence</option>
                      <option value="DEFORESTATION_AUDIT">Deforestation Sat-Map Report</option>
                      <option value="CHAIN_OF_CUSTODY_PROOF">Chain of Custody Validation Proof</option>
                      <option value="AUDIT_SUMMARY">ESG Audit Summary</option>
                      <option value="GEOLOCATION_SHAPEFILE">Geolocation Polygon Shapefile</option>
                      <option value="CUSTOM">Other / Custom Role</option>
                    </Select>
                  </FormField>
                  <FormField label="Linked Entity Type">
                    <Select
                      value={linkedEntityType}
                      onChange={(event) => {
                        const value = event.target.value;
                        setLinkedEntityType(value);
                        if (value === "CUSTOM") form.setValue("linkedEntity", "");
                        else form.setValue("linkedEntity", value);
                      }}
                    >
                      <option value="CUSTOM">Custom Entity</option>
                      <optgroup label="Active Suppliers">
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.name}>
                            {supplier.name} (Supplier)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Active Products">
                        {products.map((product) => (
                          <option key={product.id} value={product.name}>
                            {product.name} (Product)
                          </option>
                        ))}
                      </optgroup>
                    </Select>
                  </FormField>
                  <FormField label="Linked Entity Identifier" required error={form.formState.errors.linkedEntity?.message}>
                    <Input {...form.register("linkedEntity")} disabled={linkedEntityType !== "CUSTOM"} />
                  </FormField>
                </FormGrid>
                {roleType === "CUSTOM" ? (
                  <FormField label="Specify Custom Document Role">
                    <Input {...form.register("roleText")} />
                  </FormField>
                ) : null}
              </FormSection>

              <FormSection title="Review Context">
                <FormField label="Compliance Review / Validation Note">
                  <Textarea rows={4} {...form.register("note")} />
                </FormField>
              </FormSection>
            </ModalBody>
            <ModalFooter>
              <FormActions onCancel={closeModal} submitting={form.formState.isSubmitting} submitLabel={isEditModalOpen ? "Save changes" : "Create evidence"} />
            </ModalFooter>
          </form>
        </ModalShell>
      )}
    </div>
  );
}
