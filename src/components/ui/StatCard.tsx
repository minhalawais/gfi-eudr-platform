import * as React from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, hint, icon, className, ...props }: StatCardProps) {
  return (
    <Card variant="raised" className={cn("space-y-2", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</span>
        {icon ? <span className="text-brand-primary">{icon}</span> : null}
      </div>
      <div className="text-2xl font-bold text-brand-primary">{value}</div>
      {hint ? <p className="text-sm text-text-secondary">{hint}</p> : null}
    </Card>
  );
}

