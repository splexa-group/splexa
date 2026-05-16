import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[6px] border border-[#e2e8f0] bg-white px-3 py-[9px] text-sm text-[#0f172a] transition-colors",
          "placeholder:text-[#94a3b8]",
          "focus-visible:outline-none focus-visible:border-[#1e40af] focus-visible:ring-[3px] focus-visible:ring-[rgba(30,64,175,0.12)]",
          "disabled:cursor-not-allowed disabled:bg-[#f8fafc]",
          "aria-invalid:border-[#dc2626] aria-invalid:ring-[3px] aria-invalid:ring-[rgba(220,38,38,0.10)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
