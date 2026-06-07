"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import {
  Building2,
  CheckCircle2,
  Globe2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  Button,
  Card,
  Input,
  SectionHeader,
  Select,
  Tag,
  Textarea,
} from "@/components/ui";
import {
  useSession,
  type AccountProfile,
} from "@/components/ui/PermissionGuard";
import type { OrganizationProfile } from "@/lib/gfi-dummy-data";

type ProfileErrors = Partial<Record<
  "displayName" | "accountEmail" | "legalName" | "tradingName" | "country" | "organizationEmail" | "website",
  string
>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function roleLabel(value: string) {
  return value.replace(/_/g, " ");
}

function displayValue(value: string) {
  return value.trim() || "Not provided";
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-soft bg-bg-surface-alt p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className="mt-1.5 break-words text-sm font-semibold text-text-primary">{displayValue(value)}</p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return <p className="mt-1 min-h-4 text-xs font-semibold text-state-error">{message ?? ""}</p>;
}

export default function ProfilePage() {
  const {
    accountProfile,
    organizationProfile,
    updateAccountProfile,
    updateOrganizationProfile,
  } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [accountDraft, setAccountDraft] = useState<AccountProfile>(accountProfile);
  const [organizationDraft, setOrganizationDraft] = useState<OrganizationProfile>(organizationProfile);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [savedMessage, setSavedMessage] = useState("");

  const beginEdit = () => {
    setAccountDraft(accountProfile);
    setOrganizationDraft(organizationProfile);
    setErrors({});
    setSavedMessage("");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setAccountDraft(accountProfile);
    setOrganizationDraft(organizationProfile);
    setErrors({});
    setIsEditing(false);
  };

  const validate = () => {
    const nextErrors: ProfileErrors = {};

    if (!accountDraft.displayName.trim()) nextErrors.displayName = "Display name is required.";
    if (!accountDraft.email.trim()) {
      nextErrors.accountEmail = "Login email is required.";
    } else if (!EMAIL_PATTERN.test(accountDraft.email.trim())) {
      nextErrors.accountEmail = "Enter a valid email address.";
    }
    if (!organizationDraft.legalName.trim()) nextErrors.legalName = "Legal name is required.";
    if (!organizationDraft.tradingName.trim()) nextErrors.tradingName = "Trading name is required.";
    if (!organizationDraft.country.trim()) nextErrors.country = "Country is required.";
    if (organizationDraft.email.trim() && !EMAIL_PATTERN.test(organizationDraft.email.trim())) {
      nextErrors.organizationEmail = "Enter a valid organization email.";
    }
    if (organizationDraft.website.trim()) {
      try {
        new URL(organizationDraft.website);
      } catch {
        nextErrors.website = "Enter a complete URL, including https://.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const nextAccount = {
      ...accountDraft,
      displayName: accountDraft.displayName.trim(),
      email: accountDraft.email.trim(),
      jobTitle: accountDraft.jobTitle.trim(),
      phone: accountDraft.phone.trim(),
    };
    const nextOrganization = {
      ...organizationDraft,
      name: organizationDraft.tradingName.trim(),
      legalName: organizationDraft.legalName.trim(),
      tradingName: organizationDraft.tradingName.trim(),
      country: organizationDraft.country.trim(),
      address: organizationDraft.address.trim(),
      email: organizationDraft.email.trim(),
      phone: organizationDraft.phone.trim(),
      website: organizationDraft.website.trim(),
      legalRole: organizationDraft.legalRole.trim(),
      primaryMarketFlow: organizationDraft.primaryMarketFlow.trim(),
      rexNumber: organizationDraft.rexNumber.trim(),
      eudrNarrative: organizationDraft.eudrNarrative.trim(),
    };

    updateAccountProfile(nextAccount);
    updateOrganizationProfile(nextOrganization);
    setAccountDraft(nextAccount);
    setOrganizationDraft(nextOrganization);
    setIsEditing(false);
    setSavedMessage("Profile changes saved successfully.");
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <SectionHeader
        title="GFI Profile"
        description="Manage the signed-in administrator and Gujranwala Food Industries organization details."
        actions={
          !isEditing ? (
            <Button type="button" variant="secondary" icon={<Pencil className="h-4 w-4" aria-hidden="true" />} onClick={beginEdit}>
              Edit profile
            </Button>
          ) : null
        }
      />

      {savedMessage ? (
        <div className="flex items-center gap-2 rounded-lg border border-state-success/25 bg-state-success/10 px-4 py-3 text-sm font-semibold text-state-success" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {savedMessage}
        </div>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="grid gap-5 bg-gradient-to-r from-brand-primary-dark via-brand-primary to-[#16745d] p-6 text-white md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex h-20 w-32 items-center justify-center rounded-xl border border-white/15 bg-white p-2 shadow-card">
            <Image src="/jojo_logo.png" alt="Gujranwala Food Industries" width={180} height={72} className="h-auto w-full object-contain" priority />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accent">Organization workspace</p>
            <h1 className="mt-1 text-2xl font-extrabold">{organizationProfile.legalName}</h1>
            <p className="mt-1 text-sm text-white/75">{organizationProfile.legalRole}</p>
          </div>
          <Tag tone="success" className="w-fit border-white/15 bg-white/10 text-white">
            Active profile
          </Tag>
        </div>
      </Card>

      {isEditing ? (
        <form className="space-y-6" onSubmit={saveProfile} noValidate>
          <Card className="space-y-5">
            <SectionHeader title="Account" description="Administrator identity used in the dashboard header and login." />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-text-primary">
                Display name
                <Input
                  className="mt-1.5"
                  value={accountDraft.displayName}
                  state={errors.displayName ? "error" : "default"}
                  onChange={(event) => setAccountDraft((current) => ({ ...current, displayName: event.target.value }))}
                />
                <FieldError message={errors.displayName} />
              </label>
              <label className="text-sm font-semibold text-text-primary">
                Login email
                <Input
                  className="mt-1.5"
                  type="email"
                  value={accountDraft.email}
                  state={errors.accountEmail ? "error" : "default"}
                  onChange={(event) => setAccountDraft((current) => ({ ...current, email: event.target.value }))}
                />
                <FieldError message={errors.accountEmail} />
              </label>
              <label className="text-sm font-semibold text-text-primary">
                Job title
                <Input
                  className="mt-1.5"
                  value={accountDraft.jobTitle}
                  onChange={(event) => setAccountDraft((current) => ({ ...current, jobTitle: event.target.value }))}
                />
                <FieldError />
              </label>
              <label className="text-sm font-semibold text-text-primary">
                Phone
                <Input
                  className="mt-1.5"
                  type="tel"
                  value={accountDraft.phone}
                  placeholder="Not provided"
                  onChange={(event) => setAccountDraft((current) => ({ ...current, phone: event.target.value }))}
                />
                <FieldError />
              </label>
              <label className="text-sm font-semibold text-text-primary md:col-span-2">
                System role
                <Input className="mt-1.5 bg-bg-surface-alt" value={roleLabel(accountDraft.role)} readOnly aria-readonly="true" />
                <p className="mt-1 text-xs font-normal text-text-muted">System roles cannot be changed from a personal profile.</p>
              </label>
            </div>
          </Card>

          <Card className="space-y-5">
            <SectionHeader title="Organization" description="Legal identity and company contact information." />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-text-primary">
                Legal name
                <Input
                  className="mt-1.5"
                  value={organizationDraft.legalName}
                  state={errors.legalName ? "error" : "default"}
                  onChange={(event) => setOrganizationDraft((current) => ({ ...current, legalName: event.target.value }))}
                />
                <FieldError message={errors.legalName} />
              </label>
              <label className="text-sm font-semibold text-text-primary">
                Trading name
                <Input
                  className="mt-1.5"
                  value={organizationDraft.tradingName}
                  state={errors.tradingName ? "error" : "default"}
                  onChange={(event) => setOrganizationDraft((current) => ({ ...current, tradingName: event.target.value }))}
                />
                <FieldError message={errors.tradingName} />
              </label>
              <label className="text-sm font-semibold text-text-primary">
                Country
                <Input
                  className="mt-1.5"
                  value={organizationDraft.country}
                  state={errors.country ? "error" : "default"}
                  onChange={(event) => setOrganizationDraft((current) => ({ ...current, country: event.target.value }))}
                />
                <FieldError message={errors.country} />
              </label>
              <label className="text-sm font-semibold text-text-primary">
                Organization email
                <Input
                  className="mt-1.5"
                  type="email"
                  value={organizationDraft.email}
                  state={errors.organizationEmail ? "error" : "default"}
                  placeholder="Not provided"
                  onChange={(event) => setOrganizationDraft((current) => ({ ...current, email: event.target.value }))}
                />
                <FieldError message={errors.organizationEmail} />
              </label>
              <label className="text-sm font-semibold text-text-primary">
                Organization phone
                <Input
                  className="mt-1.5"
                  type="tel"
                  value={organizationDraft.phone}
                  placeholder="Not provided"
                  onChange={(event) => setOrganizationDraft((current) => ({ ...current, phone: event.target.value }))}
                />
                <FieldError />
              </label>
              <label className="text-sm font-semibold text-text-primary">
                Website
                <Input
                  className="mt-1.5"
                  type="url"
                  value={organizationDraft.website}
                  state={errors.website ? "error" : "default"}
                  placeholder="https://"
                  onChange={(event) => setOrganizationDraft((current) => ({ ...current, website: event.target.value }))}
                />
                <FieldError message={errors.website} />
              </label>
              <label className="text-sm font-semibold text-text-primary md:col-span-2">
                Address
                <Textarea
                  className="mt-1.5 min-h-24"
                  value={organizationDraft.address}
                  placeholder="Not provided"
                  onChange={(event) => setOrganizationDraft((current) => ({ ...current, address: event.target.value }))}
                />
              </label>
            </div>
          </Card>

          <Card className="space-y-5">
            <SectionHeader title="Compliance Identity" description="Organization role and regulatory operating model." />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-text-primary md:col-span-2">
                Legal role
                <Input
                  className="mt-1.5"
                  value={organizationDraft.legalRole}
                  onChange={(event) => setOrganizationDraft((current) => ({ ...current, legalRole: event.target.value }))}
                />
              </label>
              <label className="text-sm font-semibold text-text-primary">
                Default output mode
                <Select
                  className="mt-1.5"
                  value={organizationDraft.defaultOutputMode}
                  onChange={(event) => setOrganizationDraft((current) => ({
                    ...current,
                    defaultOutputMode: event.target.value as OrganizationProfile["defaultOutputMode"],
                  }))}
                >
                  <option value="COMPLIANCE_PACKAGE">Compliance package</option>
                  <option value="DIRECT_DDS">Direct DDS</option>
                </Select>
              </label>
              <label className="text-sm font-semibold text-text-primary">
                Primary market flow
                <Input
                  className="mt-1.5"
                  value={organizationDraft.primaryMarketFlow}
                  onChange={(event) => setOrganizationDraft((current) => ({ ...current, primaryMarketFlow: event.target.value }))}
                />
              </label>
              <label className="text-sm font-semibold text-text-primary">
                REX number
                <Input
                  className="mt-1.5"
                  value={organizationDraft.rexNumber}
                  onChange={(event) => setOrganizationDraft((current) => ({ ...current, rexNumber: event.target.value }))}
                />
              </label>
              <label className="text-sm font-semibold text-text-primary">
                EORI status
                <Select
                  className="mt-1.5"
                  value={organizationDraft.eoriStatus}
                  onChange={(event) => setOrganizationDraft((current) => ({
                    ...current,
                    eoriStatus: event.target.value as OrganizationProfile["eoriStatus"],
                  }))}
                >
                  <option value="NOT_REQUIRED_FOR_GFI">Not required for GFI</option>
                  <option value="REQUIRED">Required</option>
                </Select>
              </label>
              <label className="text-sm font-semibold text-text-primary">
                TRACES status
                <Select
                  className="mt-1.5"
                  value={organizationDraft.tracesStatus}
                  onChange={(event) => setOrganizationDraft((current) => ({
                    ...current,
                    tracesStatus: event.target.value as OrganizationProfile["tracesStatus"],
                  }))}
                >
                  <option value="EU_AGENT_DEPENDENT">EU agent dependent</option>
                  <option value="REGISTERED">Registered</option>
                </Select>
              </label>
              <label className="text-sm font-semibold text-text-primary md:col-span-2">
                Traceability and EUDR narrative
                <Textarea
                  className="mt-1.5 min-h-28"
                  value={organizationDraft.eudrNarrative}
                  onChange={(event) => setOrganizationDraft((current) => ({ ...current, eudrNarrative: event.target.value }))}
                />
              </label>
            </div>
          </Card>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Button type="button" variant="secondary" onClick={cancelEdit}>Cancel</Button>
            <Button type="submit">Save profile</Button>
          </div>
        </form>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary-soft text-brand-primary">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <SectionHeader title="Account" description="Signed-in administrator identity" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Display name" value={accountProfile.displayName} />
              <DetailItem label="Login email" value={accountProfile.email} />
              <DetailItem label="Job title" value={accountProfile.jobTitle} />
              <DetailItem label="Phone" value={accountProfile.phone} />
              <DetailItem label="System role" value={roleLabel(accountProfile.role)} />
            </div>
          </Card>

          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary-soft text-brand-primary">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <SectionHeader title="Organization" description="Company identity and contact details" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Legal name" value={organizationProfile.legalName} />
              <DetailItem label="Trading name" value={organizationProfile.tradingName} />
              <DetailItem label="Country" value={organizationProfile.country} />
              <DetailItem label="Address" value={organizationProfile.address} />
              <DetailItem label="Organization email" value={organizationProfile.email} />
              <DetailItem label="Organization phone" value={organizationProfile.phone} />
              <DetailItem label="Website" value={organizationProfile.website} />
            </div>
          </Card>

          <Card className="space-y-5 xl:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary-soft text-brand-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <SectionHeader title="Compliance Identity" description="Regulatory role and operating model" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <DetailItem label="Legal role" value={organizationProfile.legalRole} />
              <DetailItem label="Output mode" value={roleLabel(organizationProfile.defaultOutputMode)} />
              <DetailItem label="Primary market flow" value={organizationProfile.primaryMarketFlow} />
              <DetailItem label="REX number" value={organizationProfile.rexNumber} />
              <DetailItem label="EORI status" value={roleLabel(organizationProfile.eoriStatus)} />
              <DetailItem label="TRACES status" value={roleLabel(organizationProfile.tracesStatus)} />
            </div>
            <div className="rounded-lg border border-border-soft bg-bg-surface-alt p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">Traceability and EUDR narrative</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{displayValue(organizationProfile.eudrNarrative)}</p>
            </div>
          </Card>
        </div>
      )}

      <div className="grid gap-3 text-xs text-text-muted sm:grid-cols-4">
        <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-primary" /> Account contact</div>
        <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-primary" /> Company contact</div>
        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-primary" /> Registered location</div>
        <div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-brand-primary" /> Market identity</div>
      </div>
    </div>
  );
}
