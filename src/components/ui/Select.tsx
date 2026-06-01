import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const selectVariants = cva(
  "w-full rounded-md border bg-bg-surface px-3 py-2 text-sm text-text-primary transition-colors duration-150 ease-emphasized focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-1",
  {
    variants: {
      state: {
        default: "border-border-soft hover:border-border-strong",
        error: "border-state-error focus-visible:ring-state-error",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, state, ...props }, ref) => (
  <select ref={ref} className={cn(selectVariants({ state }), className)} {...props} />
));
Select.displayName = "Select";

