import { cn } from "@/utils/tailwind";

interface DateBadgeProps {
  date: string;
  align?: "center" | "end";
  className?: string;
}

export function DateBadge({ date, align = "center", className }: DateBadgeProps) {
  const d = new Date(date);
  const day = d.toLocaleDateString("en-IN", { day: "2-digit" });
  const month = d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
  const year = d.getFullYear();

  return (
    <div
      className={cn(
        "flex flex-col shrink-0",
        align === "end" ? "items-end text-right" : "items-center text-center",
        className,
      )}
    >
      <span className="text-2xl font-black text-dark leading-none">{day}</span>
      <span className="text-[10px] font-bold text-label uppercase tracking-widest mt-0.5">
        {month}
      </span>
      <span className="text-xs font-medium text-secondary mt-0.5">{year}</span>
    </div>
  );
}
