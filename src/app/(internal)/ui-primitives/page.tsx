"use client";

import {
  Badge,
  Button,
  Card,
  Input,
  RiskBadge,
  SectionHeader,
  Select,
  StatCard,
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
} from "@/components/ui";
import { ShieldCheck, ShieldAlert, Link2, Leaf } from "lucide-react";

export default function UiPrimitivesPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <SectionHeader
        title="UI Primitives Gallery"
        description="Task 0 validation surface for Tailwind tokens, variants, semantics, and accessibility."
        actions={
          <>
            <Button variant="secondary" icon={<Link2 className="h-4 w-4" aria-hidden="true" />}>
              Secondary
            </Button>
            <Button icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}>Primary</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Compliant Suppliers" value="124" hint="12 new this week" icon={<Leaf className="h-4 w-4" />} />
        <StatCard label="Open Reviews" value="19" hint="Requires analyst triage" icon={<ShieldAlert className="h-4 w-4" />} />
        <Card variant="inset" className="space-y-3">
          <h3 className="text-sm font-semibold text-brand-primary">Badge Semantics</h3>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="approved" />
            <StatusBadge status="pending_approval" />
            <StatusBadge status="blocked" />
            <RiskBadge risk="low" />
            <RiskBadge risk="medium" />
            <RiskBadge risk="critical" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag tone="brand">Traceability</Tag>
            <Tag tone="warning">Review Needed</Tag>
            <Tag tone="danger">Gap Found</Tag>
            <Badge tone="info">Informational</Badge>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <h3 className="text-base font-semibold text-brand-primary">Controls</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Supplier name" aria-label="Supplier name" />
            <Select aria-label="Supplier status" defaultValue="under_review">
              <option value="under_review">Under review</option>
              <option value="approved">Approved</option>
              <option value="blocked">Blocked</option>
            </Select>
            <Textarea className="md:col-span-2" rows={4} placeholder="Notes..." aria-label="Notes" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Save</Button>
            <Button size="sm" variant="secondary">
              Cancel
            </Button>
            <Button size="sm" variant="danger">
              Reject
            </Button>
            <Button size="sm" loading>
              Syncing
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-base font-semibold text-brand-primary">Table Pattern</h3>
          <TableRoot>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Supplier</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Risk</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Cargill Palm Products</TableCell>
                  <TableCell>
                    <StatusBadge status="approved" />
                  </TableCell>
                  <TableCell>
                    <RiskBadge risk="medium" />
                  </TableCell>
                </TableRow>
                <TableRow selected>
                  <TableCell>JB Cocoa SDN BHD</TableCell>
                  <TableCell>
                    <StatusBadge status="changes_requested" />
                  </TableCell>
                  <TableCell>
                    <RiskBadge risk="high" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableRoot>
        </Card>
      </div>
    </div>
  );
}

