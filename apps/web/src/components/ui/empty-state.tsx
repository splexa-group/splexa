import { cn } from "@/lib/utils";

interface EmptyStateProps {
  text: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ text, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 text-center",
        className,
      )}
    >
      <p className="text-sm text-secondary mb-2">{text}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-sm font-semibold rounded px-3 py-1.5 text-brand hover:bg-brand-soft/40 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
