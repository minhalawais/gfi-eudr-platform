"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from '@/components/ui/PermissionGuard'
import { AppTopbar, Button } from '@/components/ui'
import {
  Boxes,
  FileText,
  LayoutDashboard,
  MapPinned,
  MessageSquareWarning,
  PackageCheck,
  PanelLeftClose,
  Plug,
  ShieldCheck,
  Trees,
  Truck,
  UserCheck,
  Users,
  Workflow,
  Loader2,
} from 'lucide-react'
import Image from 'next/image'
import type { LucideIcon } from 'lucide-react'

const SIDEBAR_STORAGE_KEY = 'fos.sidebar.collapsed'

type NavigationItem = {
  name: string
  path: string
  icon: LucideIcon
}

export default function InternalLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const router = useRouter()
  const { accountProfile, isHydrated, logout, session } = useSession()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const navigationItems: NavigationItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Suppliers', path: '/suppliers', icon: Users },
    { name: 'Products & BOM', path: '/products', icon: Boxes },
    { name: 'Traceability', path: '/traceability', icon: Workflow },
    { name: 'Consignments', path: '/consignments', icon: Truck },
    { name: 'EUDR Compliance', path: '/eudr-compliance', icon: ShieldCheck },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'EU Agents', path: '/agents', icon: UserCheck },
    { name: 'Integration', path: '/integration', icon: Plug },
    
  ]

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored === 'true') {
      setIsSidebarCollapsed(true)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, isSidebarCollapsed ? 'true' : 'false')
  }, [isSidebarCollapsed])

  useEffect(() => {
    document.documentElement.style.setProperty('--platform-sidebar-width', isSidebarCollapsed ? '64px' : '280px')
    return () => {
      document.documentElement.style.removeProperty('--platform-sidebar-width')
    }
  }, [isSidebarCollapsed])

  useEffect(() => {
    if (isHydrated && !session?.user) {
      router.replace('/')
    }
  }, [isHydrated, router, session])

  useEffect(() => {
    const activeNav = navigationItems.find(
      (item) => pathname === item.path || (item.path !== '/dashboard' && pathname?.startsWith(item.path))
    );
    const titleSuffix = "GFI Compliance Control Center";
    if (pathname === '/profile') {
      document.title = `Profile | ${titleSuffix}`;
    } else if (activeNav) {
      document.title = `${activeNav.name} | ${titleSuffix}`;
    } else {
      document.title = titleSuffix;
    }
  }, [pathname]);

  if (!isHydrated || !session?.user) {
    return (
      <div className="flex h-[calc(100dvh-var(--platform-footer-height))] items-center justify-center bg-bg-page text-brand-primary">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Loading secure workspace...
        </div>
      </div>
    )
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev)
  }

  const activeNav = navigationItems.find((item) => pathname === item.path || (item.path !== '/dashboard' && pathname?.startsWith(item.path)))
  const breadcrumbs = pathname === '/profile' ? ['Profile'] : activeNav ? [activeNav.name] : []

  const handleLogout = () => {
    logout()
    router.replace('/')
  }

  return (
    <div className={[
      "grid h-screen overflow-hidden grid-cols-1 bg-bg-page transition-[grid-template-columns] duration-200 ease-emphasized",
      isSidebarCollapsed ? "lg:grid-cols-[64px_1fr]" : "lg:grid-cols-[280px_1fr]",
    ].join(" ")}>
      <aside className={[
        "internal-scroll internal-scroll--sidebar flex h-screen flex-col overflow-x-hidden border-r border-white/10 bg-brand-primary-dark text-text-inverse lg:sticky lg:top-0 lg:overflow-y-auto",
        isSidebarCollapsed ? "px-1.5 py-5" : "px-4 py-5",
      ].join(" ")}>
        <div className="mb-4">
          {isSidebarCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 transition-colors duration-150 ease-emphasized hover:bg-white/10 mx-auto"
            >
              <Image
                src="/jojo_logo.png"
                alt="JOJO logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain rounded-full"
                priority
              />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Image
                src="/jojo_logo.png"
                alt="JOJO logo"
                width={420}
                height={120}
                className="h-20 w-full object-contain object-center transition-all duration-200 ease-emphasized"
                priority
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="hidden h-10 w-10 shrink-0 border-white/20 bg-white/5 p-0 text-text-inverse hover:bg-white/10 lg:inline-flex"
                onClick={toggleSidebar}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1.5">
          {navigationItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname?.startsWith(item.path))
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                href={item.path as any}
                title={isSidebarCollapsed ? item.name : undefined}
                aria-label={isSidebarCollapsed ? item.name : undefined}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "group relative flex min-h-11 items-center rounded-md text-sm font-semibold transition-colors duration-150 ease-emphasized",
                  isSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5",
                  isActive
                    ? "bg-brand-accent text-brand-primary"
                    : "text-white/75 hover:bg-white/10 hover:text-text-inverse",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className={[
                  "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-emphasized",
                  isSidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[170px] opacity-100",
                ].join(" ")}>
                  {item.name}
                </span>

                {isSidebarCollapsed ? (
                  <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-3 hidden -translate-y-1/2 rounded-md border border-border-soft bg-bg-surface px-2 py-1 text-xs font-semibold text-text-primary shadow-card group-hover:block group-focus-visible:block">
                    {item.name}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

      </aside>

      <div className="flex h-[calc(100dvh-var(--platform-footer-height))] min-h-0 flex-col overflow-hidden">
        <AppTopbar
          variant="internal"
          microLabel="Compliance Suite"
          title="FOS EUDR Control Center"
          subtitle="PUWF Admin / Compliance Office"
          breadcrumbs={breadcrumbs}
          posture="monitoring_active"
          notificationCount={2}
          userName={session.user.name}
          userInitials="GF"
          userRole={accountProfile.jobTitle}
          profileHref="/profile"
          onLogout={handleLogout}
        />

        <main className="internal-scroll internal-scroll--main flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
