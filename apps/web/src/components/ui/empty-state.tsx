import { cn } from "@/utils/tailwind";
import { Button } from "./button";

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
      <p className="text-[13.5px] text-secondary mb-2">{text}</p>
      {action && (
        <Button className="rounded-3xl" type="button" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
