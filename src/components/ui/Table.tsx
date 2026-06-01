import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const tableCellVariants = cva("text-left align-middle", {
  variants: {
    density: {
      comfortable: "px-4 py-3",
      compact: "px-3 py-2",
    },
  },
  defaultVariants: {
    density: "comfortable",
  },
});

export interface TableRootProps extends React.HTMLAttributes<HTMLDivElement> {}
export function TableRoot({ className, ...props }: TableRootProps) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-border-soft bg-bg-surface", className)} {...props} />
  );
}

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}
export function Table({ className, ...props }: TableProps) {
  return <table className={cn("w-full border-collapse text-sm", className)} {...props} />;
}

export interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
export function TableHead({ className, ...props }: TableHeadProps) {
  return <thead className={cn("bg-bg-surface-alt", className)} {...props} />;
}

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
export function TableBody({ className, ...props }: TableBodyProps) {
  return <tbody className={cn("[&_tr:last-child_td]:border-b-0", className)} {...props} />;
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
}
export function TableRow({ className, selected = false, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-border-soft transition-colors duration-150 ease-emphasized hover:bg-bg-surface-alt",
        selected && "bg-brand-primary-soft",
        className,
      )}
      {...props}
    />
  );
}

export interface TableHeaderCellProps
  extends React.ThHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableCellVariants> {}
export function TableHeaderCell({ className, density, ...props }: TableHeaderCellProps) {
  return (
    <th
      className={cn(
        tableCellVariants({ density }),
        "text-xs font-semibold uppercase tracking-wide text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableCellVariants> {}
export function TableCell({ className, density, ...props }: TableCellProps) {
  return <td className={cn(tableCellVariants({ density }), "text-text-primary", className)} {...props} />;
}

