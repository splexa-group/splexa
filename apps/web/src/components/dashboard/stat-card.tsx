import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/tailwind";

interface Props {
  label: string;
  value: number | undefined;
  icon: LucideIcon;
}

export function StatCard({ label, value, icon: Icon }: Props) {
  return (
    <div className="rounded-lg border border-line bg-card px-5 py-4 flex items-start gap-4">
      <div className="rounded-md bg-brand/10 p-2.5 shrink-0">
        <Icon className="size-5 text-brand" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-secondary mb-1">{label}</p>
        {value === undefined ? (
          <div className="h-7 w-10 rounded bg-subtle animate-pulse" />
        ) : (
          <p
            className={cn(
              "text-2xl font-bold leading-none",
              value === 0 ? "text-secondary" : "text-dark",
            )}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}
