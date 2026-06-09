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
  const { documents, addDocument, editDocument, suppliers, products, scenarioId } = useSession();

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

  const closeModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    resetForm();
  };

  const handleOpenEdit = () => {
    if (!selectedDocument) return;
    setEditingId(selectedDocument.id);
    form.setValue("title", selectedDocument.title);
    if (STANDARD_ROLES.includes(selectedDocument.documentRole as (typeof STANDARD_ROLES)[number])) {
      setRoleType(selectedDocument.documentRole);
      form.setValue("roleText", "");
    } else {
      setRoleType("CUSTOM");
      form.setValue("roleText", selectedDocument.documentRole);
    }

    const matchedSupplier = suppliers.find((item) => item.name === selectedDocument.linkedEntity);
    const matchedProduct = products.find((item) => item.name === selectedDocument.linkedEntity);
    if (matchedSupplier) {
      setLinkedEntityType(matchedSupplier.name);
      form.setValue("linkedEntity", matchedSupplier.name);
    } else if (matchedProduct) {
      setLinkedEntityType(matchedProduct.name);
      form.setValue("linkedEntity", matchedProduct.name);
    } else {
      setLinkedEntityType("CUSTOM");
      form.setValue("linkedEntity", selectedDocument.linkedEntity);
    }

    form.setValue("status", selectedDocument.status);
    form.setValue("note", selectedDocument.note);
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

      <div className="grid gap-6 xl:grid-cols-[1fr_1.8fr]">
        <Card className="space-y-4 p-4 sm:p-5">
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
                    <TableHeaderCell density="compact">Document</TableHeaderCell>
                    <TableHeaderCell density="compact">Status</TableHeaderCell>
                    <TableHeaderCell density="compact">Action</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((document) => {
                    const selected = selectedDocument?.id === document.id;
                    return (
                      <TableRow
                        key={document.id}
                        selected={selected}
                        className="cursor-pointer"
                        onClick={() => setSelectedDocumentId(document.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedDocumentId(document.id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Select document ${document.title}`}
                      >
                        <TableCell density="compact">
                          <p className="font-semibold text-brand-primary">{document.title}</p>
                          <p className="text-xs text-text-secondary">{formatLabel(document.documentRole)}</p>
                        </TableCell>
                        <TableCell density="compact">
                          <StatusBadge status={DOCUMENT_STATUS_MAP[document.status]}>
                            {formatLabel(document.status)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell density="compact">
                          <Button size="sm" variant={selected ? "primary" : "secondary"}>
                            Inspect
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableRoot>
          )}
        </Card>

        {selectedDocument ? (
          <Card className="space-y-5 p-4 sm:p-5">
            <SectionHeader
              title={selectedDocument.title}
              description="Document details"
              actions={
                <Button size="sm" variant="secondary" onClick={handleOpenEdit}>
                  Edit
                </Button>
              }
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <Card variant="inset" className="p-3">
                <p className="text-xs uppercase tracking-wide text-text-secondary">Document Role</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {formatLabel(selectedDocument.documentRole)}
                </p>
              </Card>
              <Card variant="inset" className="p-3">
                <p className="text-xs uppercase tracking-wide text-text-secondary">Linked Entity</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{selectedDocument.linkedEntity}</p>
              </Card>
              <Card variant="inset" className="p-3">
                <p className="text-xs uppercase tracking-wide text-text-secondary">Lifecycle State</p>
                <div className="mt-1">
                  <StatusBadge status={DOCUMENT_STATUS_MAP[selectedDocument.status]}>
                    {formatLabel(selectedDocument.status)}
                  </StatusBadge>
                </div>
              </Card>
            </div>

            <Card variant="inset" className="p-4">
              <p className="text-sm font-semibold text-brand-primary">Compliance Officer Note</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{selectedDocument.note}</p>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card variant="inset" className="p-3">
                <p className="text-sm font-semibold text-brand-primary">Retention Posture</p>
                <p className="mt-2 text-xs leading-6 text-text-secondary">
                  EUDR Article 9 requires keeping compliance packages and evidence links archived for at least 5 years
                  post-market placement.
                </p>
              </Card>
              <Card variant="inset" className="p-3">
                <p className="text-sm font-semibold text-brand-primary">Downstream Use</p>
                <p className="mt-2 text-xs leading-6 text-text-secondary">
                  Verified evidence records are bundled dynamically when compiling exporter compliance packages for
                  customs agent submission.
                </p>
              </Card>
            </div>
          </Card>
        ) : (
          <Card className="p-10 text-center text-sm text-text-secondary">
            Select an evidence record from the left to view details.
          </Card>
        )}
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
