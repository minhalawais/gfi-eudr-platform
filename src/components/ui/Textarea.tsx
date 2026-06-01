import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const textareaVariants = cva(
  "w-full rounded-md border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 ease-emphasized focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-1",
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

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, state, ...props }, ref) => (
    <textarea ref={ref} className={cn(textareaVariants({ state }), className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

