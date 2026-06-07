"use client";

import React from "react";
import Link from "next/link";
import { Bell, ChevronDown, CircleAlert, CircleCheckBig, LogOut, Search, ShieldAlert, UserRound } from "lucide-react";
import { BrandLockup } from "./Branding";
import { Tag } from "./Tag";
import type { TagProps } from "./Tag";

type TopbarPosture = "monitoring_active" | "degraded" | "action_required";

type InternalTopbarProps = {
  variant: "internal";
  title?: string;
  subtitle?: string;
  microLabel?: string;
  breadcrumbs?: string[];
  posture: TopbarPosture;
  notificationCount?: number;
  userName?: string;
  userInitials?: string;
  userRole?: string;
  profileHref: string;
  onLogout: () => void;
};

type PortalTopbarProps = {
  variant: "portal";
  portalTitle: string;
  portalSubtitle: string;
  languageLabel: string;
  locale: string;
  locales: readonly string[];
  onLocaleChange: (nextLocale: string) => void;
  backHref: string;
  backLabel: string;
  scopeLabel: string;
  requestStatusLabel: string;
  requestStatusTone: NonNullable<TagProps["tone"]>;
};

export type AppTopbarProps = InternalTopbarProps | PortalTopbarProps;

function postureMeta(posture: TopbarPosture) {
  if (posture === "action_required") {
    return { label: "Action", tone: "bg-red-500", iconColor: "text-red-500", Icon: ShieldAlert };
  }
  if (posture === "degraded") {
    return { label: "Degraded", tone: "bg-amber-500", iconColor: "text-amber-500", Icon: CircleAlert };
  }
  return { label: "Active", tone: "bg-emerald-500", iconColor: "text-emerald-500", Icon: CircleCheckBig };
}

export function AppTopbar(props: AppTopbarProps) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = React.useState(false);
  const accountMenuRef = React.useRef<HTMLDivElement>(null);
  const accountTriggerRef = React.useRef<HTMLButtonElement>(null);
  const profileLinkRef = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    if (!isAccountMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
        accountTriggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => profileLinkRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  if (props.variant === "portal") {
    const isRtl = props.locale === "ar" || props.locale === "ur";
    return (
      <header className="sticky top-0 z-20 h-14 border-b border-white/10 bg-brand-primary/90 backdrop-blur-md text-text-inverse/95">
        <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLockup compact className="h-9 border-white/20 bg-white/10 py-1" />
            <div className="min-w-0 border-l border-white/15 pl-3">
              <p className="truncate text-xs font-bold leading-tight">{props.portalTitle}</p>
              <p className="truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-brand-accent">{props.portalSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <Tag tone="neutral" className="py-1 text-[10px]">{props.scopeLabel}</Tag>
            <Tag tone={props.requestStatusTone} className="py-1 text-[10px]">{props.requestStatusLabel}</Tag>
            <label className="hidden text-[10px] font-bold uppercase tracking-[0.08em] text-white/75 sm:inline-block">
              {props.languageLabel}
            </label>
            <select
              value={props.locale}
              onChange={(event) => props.onLocaleChange(event.target.value)}
              className="h-8 rounded-md border border-white/20 bg-white/10 px-2 text-[11px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              aria-label={props.languageLabel}
            >
              {props.locales.map((item) => (
                <option key={item} value={item} className="bg-brand-primary text-white">
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
            <Link
              href={props.backHref as any}
              className="inline-flex h-8 items-center rounded-md border border-white/20 bg-white/10 px-3 text-[11px] font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
            >
              {props.backLabel}
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const meta = postureMeta(props.posture);
  const unread = props.notificationCount ?? 0;

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-border-soft/60 bg-bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-full items-center justify-between px-4 md:px-6">

        {/* LEFT: Context Breadcrumbs (Highly compact, replaces bulky titles) */}
        <div className="flex items-center gap-1.5 min-w-0">
          {props.breadcrumbs && props.breadcrumbs.length > 0 ? (
            props.breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb}>
                {idx > 0 && <span className="text-text-muted/40 text-[10px] font-medium font-sans">/</span>}
                <span className={`text-[11px] font-bold tracking-wide font-sans truncate ${idx === props.breadcrumbs!.length - 1
                    ? "text-brand-primary"
                    : "text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  }`}>
                  {crumb}
                </span>
              </React.Fragment>
            ))
          ) : (
            <span className="text-[11px] font-bold tracking-wide font-sans text-brand-primary">
              {props.title ?? "Control Center"}
            </span>
          )}
        </div>

        {/* CENTER: command-K interactive search input mockup */}
        <div className="hidden max-w-sm flex-1 px-8 md:block">
          <div className="group relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-text-muted transition-colors group-hover:text-text-secondary" />
            <input
              type="text"
              readOnly
              placeholder="Search compliance logs or press ⌘K..."
              className="h-8 w-full cursor-pointer rounded-lg border border-border-soft bg-bg-page/50 pl-9 pr-4 text-xs font-semibold text-text-primary outline-none transition-all placeholder:text-text-muted/70 hover:bg-bg-page focus:border-brand-primary/20"
              aria-label="Global search console"
            />
          </div>
        </div>

        {/* RIGHT: Compact control actions grouped seamlessly */}
        <div className="flex items-center gap-3">

          {/* Posture Badge Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-border-soft bg-bg-page/60 py-1 pl-2.5 pr-3 text-[10px] font-bold text-text-primary">
            <span className={`h-1.5 w-1.5 rounded-full ${meta.tone} animate-pulse`} />
            <span className="text-text-secondary">API: {meta.label}</span>
          </div>

          <div className="h-4 w-px bg-border-soft" />

          {/* Notifications Button */}
          <button
            type="button"
            aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
            className="relative flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition hover:bg-bg-page hover:text-text-primary"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 ? (
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-state-error animate-pulse" />
            ) : null}
          </button>

          <div ref={accountMenuRef} className="relative">
            <button
              ref={accountTriggerRef}
              type="button"
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={isAccountMenuOpen}
              aria-controls="account-menu"
              onClick={() => setIsAccountMenuOpen((current) => !current)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setIsAccountMenuOpen(true);
                }
              }}
              className="flex items-center gap-2 rounded-md p-1 transition hover:bg-bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-primary/10 text-[9px] font-extrabold text-brand-primary">
                {props.userInitials ?? props.userName?.substring(0, 2).toUpperCase() ?? "OP"}
              </div>
              <span className="hidden max-w-44 truncate text-xs font-bold text-text-primary md:inline-block">
                {props.userName ?? "Operator"}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-text-secondary transition-transform ${isAccountMenuOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {isAccountMenuOpen ? (
              <div
                id="account-menu"
                role="menu"
                aria-label="Account menu"
                className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-border-soft bg-bg-surface shadow-card-hover"
              >
                <div className="border-b border-border-soft bg-bg-surface-alt px-4 py-3">
                  <p className="truncate text-sm font-bold text-text-primary">{props.userName ?? "Operator"}</p>
                  <p className="mt-0.5 truncate text-xs text-text-secondary">{props.userRole ?? "Workspace user"}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    ref={profileLinkRef}
                    href={props.profileHref as any}
                    role="menuitem"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-text-primary transition hover:bg-bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                  >
                    <UserRound className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      props.onLogout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-semibold text-state-error transition hover:bg-state-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-error"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Log out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
