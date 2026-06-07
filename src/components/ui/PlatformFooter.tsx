"use client";

import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";

const FOS_WEBSITE = "https://fruitofsustainability.com/";

export function PlatformFooter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEmbeddedSupplierPortal = pathname === "/supplier" && searchParams.get("embed") === "1";
  const isInternalRoute = pathname !== "/supplier" && pathname !== "/agent";

  if (pathname === "/" || isEmbeddedSupplierPortal) {
    return null;
  }

  return (
    <footer
      role="contentinfo"
      className={[
        "fixed inset-x-0 bottom-0 z-40 flex h-[var(--platform-footer-height)] items-center justify-center overflow-hidden border-t border-brand-primary/15 bg-white/92 px-3 pb-[env(safe-area-inset-bottom)] text-center shadow-[0_-2px_10px_rgba(8,56,45,0.06)] backdrop-blur-md",
        isInternalRoute ? "platform-footer--internal" : "",
      ].join(" ")}
    >
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/80 to-transparent" aria-hidden="true" />
      <div className="flex min-w-0 max-w-full items-center justify-center gap-1.5 whitespace-nowrap text-[9px] leading-none sm:text-[10px]">
        <Image
          src="/fos_square_logo.png"
          alt=""
          width={14}
          height={14}
          className="h-3.5 w-3.5 shrink-0 rounded-sm object-contain"
          aria-hidden="true"
        />
        <span className="font-medium tracking-wide text-text-muted">Powered by</span>
        <a
          href={FOS_WEBSITE}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex min-w-0 items-center gap-1 font-bold tracking-wide text-brand-primary transition-colors hover:text-brand-accent-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        >
          <span className="truncate">Fruit of Sustainability (SMC-Private) Limited</span>
          <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </footer>
  );
}
