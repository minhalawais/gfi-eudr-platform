import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

const modalSizeVariants = cva("w-full rounded-xl border border-border-soft bg-bg-surface shadow-card", {
  variants: {
    size: {
      sm: "max-w-lg",
      md: "max-w-2xl",
      lg: "max-w-4xl",
      xl: "max-w-6xl",
    },
  },
  defaultVariants: {
    size: "lg",
  },
});

export interface ModalShellProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof modalSizeVariants> {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  describedBy?: string;
}

export function ModalShell({
  open,
  onClose,
  size,
  children,
  className,
  labelledBy,
  describedBy,
  ...props
}: ModalShellProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={cn(modalSizeVariants({ size }), "max-h-[90vh] overflow-hidden", className)} {...props}>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  title,
  description,
  onClose,
  titleId,
  descriptionId,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  titleId?: string;
  descriptionId?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border-soft px-6 py-5">
      <div className="space-y-1">
        <h2 id={titleId} className="text-xl font-extrabold text-brand-primary">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="text-sm text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>
      <Button type="button" variant="tertiary" size="sm" icon={<X className="h-4 w-4" aria-hidden="true" />} onClick={onClose}>
        Close
      </Button>
    </div>
  );
}

export function ModalBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("max-h-[65vh] overflow-y-auto px-6 py-5", className)} {...props} />;
}

export function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end gap-3 border-t border-border-soft px-6 py-4", className)} {...props} />;
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-lg border border-border-soft bg-bg-surface-alt p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-bold uppercase tracking-wide text-brand-primary">{title}</h3>
        {description ? <p className="text-xs text-text-secondary">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function FormGrid({
  columns = 2,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { columns?: 1 | 2 | 3 }) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
        className,
      )}
      {...props}
    />
  );
}

export function FormField({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2" htmlFor={htmlFor}>
      <span className="text-sm font-semibold text-text-secondary">
        {label}
        {required ? <span className="ml-1 text-state-error">*</span> : null}
      </span>
      {children}
      {hint ? <p className="text-xs text-text-secondary">{hint}</p> : null}
      {error ? <p className="text-xs font-semibold text-state-error">{error}</p> : null}
    </label>
  );
}

export function ValidationSummary({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="rounded-md border border-state-error/40 bg-state-error/10 p-3 text-sm text-state-error">
      <p className="font-semibold">Please resolve the following:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

export function FormActions({
  submitting,
  submitLabel,
  onCancel,
}: {
  submitting?: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </>
  );
}
