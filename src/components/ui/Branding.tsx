import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

type BrandLockupProps = {
  subtitle?: string;
  title?: string;
  href?: Route;
  compact?: boolean;
  className?: string;
};

export function BrandLockup({
  subtitle = "Compliance Suite",
  title = "FOS EUDR",
  href = "/dashboard",
  compact = false,
  className = "",
}: BrandLockupProps) {
  const logoSize = compact ? 40 : 56;

  return (
    <Link
      href={href}
      className={[
        "group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition-colors duration-150 ease-emphasized hover:bg-white/10",
        className,
      ].join(" ")}
      aria-label="JOJO home"
    >
      <Image
        src="/jojo_logo.png"
        alt="JOJO logo"
        width={logoSize}
        height={logoSize}
        className="h-auto w-auto object-contain"
        priority
      />
      <span className="grid gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-accent">
          {subtitle}
        </span>
        <span className="text-sm font-extrabold text-text-inverse">{title}</span>
      </span>
    </Link>
  );
}

type DevelopedByFooterProps = {
  className?: string;
};

export function DevelopedByFooter({ className = "" }: DevelopedByFooterProps) {
  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-lg border border-border-soft bg-bg-surface px-3 py-2 text-xs text-text-secondary",
        className,
      ].join(" ")}
      aria-label="Developed by Fruit of Sustainability"
    >
      <Image
        src="/fos_square_logo.png"
        alt="Fruit of Sustainability logo"
        width={22}
        height={22}
        className="h-[22px] w-[22px] rounded-sm object-contain"
      />
      <span className="leading-tight">
        Developed by <strong className="font-semibold text-current">Fruit of Sustainability</strong>
      </span>
    </div>
  );
}
